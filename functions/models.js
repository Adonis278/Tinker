/**
 * OWNER: P2.
 * NVIDIA NIM model chain + rate-limit failover.
 *
 * NVIDIA's hosted models are OpenAI-compatible, so switching models is just
 * changing a string. Free tiers rate-limit hard, so we keep an ordered chain
 * and step down it whenever a model returns 429 / 5xx / times out.
 *
 * CHAIN VERIFIED 28 Jul 2026 against this account's catalogue, by sending a
 * real Socratic prompt (Kiswahili + cooking anchor) to every candidate and
 * checking latency, JSON compliance and whether it leaked the answer.
 *
 * Rejected, with reasons — do not re-add without retesting:
 *   qwen/qwen2.5-72b-instruct              not in this account's catalogue
 *   mistralai/mistral-large[-2-instruct]   404 for this account
 *   nvidia/llama-3.1-nemotron-70b-instruct 404 for this account
 *   nvidia/llama-3.1-nemotron-51b-instruct 404 for this account
 *   google/gemma-4-31b-it                  504 after 300s
 *   nvidia/nemotron-3-super-120b-a12b      reasoning model, leaks its scratchpad instead of JSON
 *   nvidia/nvidia-nemotron-nano-9b-v2      returns empty content
 *
 * Re-verify with: node scripts/verify-models.mjs
 */

const BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
// Deliberately tight. A dead model costs us this much latency before we move
// on, and free-tier capacity fluctuates hour to hour — a 20s budget meant one
// stalled model pushed a real reply out to 24s, which is unusable on camera.
// Better to abandon a slow model quickly than to wait politely for it.
const TIMEOUT_MS = 10000;
const COOLDOWN_MS = 60000;

// ORDER IS NOT PERMANENT. Free-tier capacity moves hour to hour: in testing,
// llama-3.1-70b answered in 6s one hour and timed out entirely the next.
// Re-run `node scripts/verify-models.mjs` before the demo and put whichever
// model is healthiest first.
export const MODEL_CHAIN = [
  // Answering in ~3.5s and holding the anchor well as of the last check.
  "nvidia/llama-3.3-nemotron-super-49b-v1",
  // 6-8s when healthy, good anchoring. Was timing out at last check.
  "meta/llama-3.1-70b-instruct",
  // Strongest on paper but the free tier frequently returns 503
  // "Worker local total request limit reached". Kept as opportunistic backup.
  "meta/llama-3.3-70b-instruct",
  // ~1.4s and has never failed. Weaker anchoring, but it always answers —
  // which is the entire point of a last resort.
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
