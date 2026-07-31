/**
 * NVIDIA embeddings with the same failover discipline as the chat models.
 *
 * VERIFIED 30 Jul 2026 on this account by embedding three passages and one
 * query, then checking the query retrieved the right passage:
 *
 *   nvidia/llama-nemotron-embed-1b-v2  dim 2048  ~180ms  separation 0.514 / 0.135  <- best
 *   nvidia/nemotron-3-embed-1b         dim 2048  ~160ms  separation 0.499 / 0.144
 *   nvidia/nv-embedqa-e5-v5            dim 1024  ~450ms  separation 0.437 / 0.222
 *
 * Rejected (404 on this account): llama-3.2-nv-embedqa-1b-v1, snowflake/arctic-embed-l,
 * nvidia/embed-qa-4.
 *
 * NOTE: dimensions differ between models, so a document indexed with one model
 * must be queried with the same one. `embed()` returns which model it used and
 * the caller stores it alongside the vectors.
 */

const URL = "https://integrate.api.nvidia.com/v1/embeddings";
const TIMEOUT_MS = 15000;
const COOLDOWN_MS = 60000;

export const EMBED_CHAIN = [
  "nvidia/llama-nemotron-embed-1b-v2",
  "nvidia/nemotron-3-embed-1b",
  "nvidia/nv-embedqa-e5-v5",
];

const cooldowns = new Map();

function available() {
  const now = Date.now();
  const ok = EMBED_CHAIN.filter((m) => (cooldowns.get(m) ?? 0) < now);
  return ok.length ? ok : EMBED_CHAIN;
}

async function callOnce(model, input, inputType, apiKey) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, {
      method: "POST",
      signal: ctl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input,
        model,
        // NVIDIA retrieval models are asymmetric: documents and questions are
        // encoded differently. Getting this wrong quietly wrecks recall.
        input_type: inputType,
        encoding_format: "float",
        truncate: "END",
      }),
    });

    if (res.status === 429 || res.status >= 500) {
      cooldowns.set(model, Date.now() + COOLDOWN_MS);
      throw new Error(`${model} unavailable (${res.status})`);
    }
    if (!res.ok) throw new Error(`${model} failed (${res.status})`);

    const json = await res.json();
    const vectors = (json.data ?? []).map((d) => d.embedding);
    if (!vectors.length) throw new Error(`${model} returned no vectors`);
    return vectors;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string[]} texts
 * @param {"passage"|"query"} inputType
 * @returns {Promise<{vectors: number[][], model: string}>}
 */
export async function embed(texts, inputType, apiKey) {
  const errors = [];
  for (const model of available()) {
    try {
      const vectors = await callOnce(model, texts, inputType, apiKey);
      return { vectors, model };
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
    }
  }
  throw new Error(`all_embed_models_exhausted :: ${errors.join(" | ")}`);
}

/** Embed in batches — the API rejects very large single requests. */
export async function embedBatched(texts, inputType, apiKey, batchSize = 32) {
  const out = [];
  let model = null;
  for (let i = 0; i < texts.length; i += batchSize) {
    const { vectors, model: used } = await embed(texts.slice(i, i + batchSize), inputType, apiKey);
    out.push(...vectors);
    model = used;
  }
  return { vectors: out, model };
}
