/**
 * OWNER: P2.
 * NVIDIA NIM model chain + rate-limit failover.
 *
 * NVIDIA's hosted models are OpenAI-compatible, so switching models is just
 * changing a string. Free tiers rate-limit hard, so we keep an ordered chain
 * and step down it whenever a model returns 429 / 5xx / times out.
 *
 * >>> P2 DAY-1 TASK: verify these ids against https://build.nvidia.com <<<
 * NVIDIA rotates its catalogue. A wrong id fails fast with a 404 — just edit
 * the list below, no other code changes needed.
 */

const BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const TIMEOUT_MS = 20000;
const COOLDOWN_MS = 60000;

export const MODEL_CHAIN = [
  "meta/llama-3.3-70b-instruct",
  "qwen/qwen2.5-72b-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "mistralai/mistral-large-2-instruct",
  "meta/llama-3.1-8b-instruct",
];

/** model id -> epoch ms until which we skip it */
const cooldowns = new Map();

function available() {
  const now = Date.now();
  const ok = MODEL_CHAIN.filter((m) => (cooldowns.get(m) ?? 0) < now);
  // If everything is cooling down, ignore cooldowns rather than fail the learner.
  return ok.length ? ok : MODEL_CHAIN;
}

async function callOnce(model, messages, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 400,
      }),
    });

    if (res.status === 429 || res.status >= 500) {
      cooldowns.set(model, Date.now() + COOLDOWN_MS);
      throw new Error(`${model} unavailable (${res.status})`);
    }
    if (!res.ok) throw new Error(`${model} failed (${res.status}): ${await res.text()}`);

    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try each available model in order. Returns { content, model }.
 * Throws only if every model in the chain failed.
 */
export async function completeWithFailover(messages, apiKey) {
  const errors = [];
  for (const model of available()) {
    try {
      const content = await callOnce(model, messages, apiKey);
      if (content) return { content, model };
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
    }
  }
  throw new Error(`all_models_exhausted :: ${errors.join(" | ")}`);
}
