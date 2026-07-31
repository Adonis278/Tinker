/**
 * Platform-agnostic handlers. Firebase Functions and Cloudflare Workers both
 * just wrap these, so moving hosts changes nothing in here.
 *
 * Contract: docs/ARCHITECTURE.md §4.
 */

import { completeWithFailover } from "./models.js";
import { buildMessages, parseTutorJson } from "./prompts.js";
import { strategyFor, writeLanguageFor, translate } from "./translate.js";
import { ingestMaterial, generateCourse, groundQuestion } from "./study.js";

const SAFE_FALLBACK =
  "Let's take one step back. In your own words, what is this question actually asking you to find?";

/* ------------------------------------------------------------------ */
/* POST /tutor                                                         */
/* ------------------------------------------------------------------ */

export async function handleTutorRequest(body, env, deps = {}) {
  const started = Date.now();
  const { message = "", history = [], learner = {}, context = {}, sourceId = null } = body ?? {};

  if (!message.trim()) {
    return {
      reply: "What are you stuck on?",
      anchorUsed: null, misconceptionDetected: null, hintLevel: 0,
      modelUsed: null, translated: false, sources: [], latencyMs: 0,
    };
  }

  const lang = learner.nativeLanguage ?? "en";
  const writeInLanguage = writeLanguageFor(lang);

  // Retrieval, when the learner has uploaded material for this session.
  let grounding = "";
  let passages = [];
  if (sourceId && deps.loadChunks) {
    try {
      const chunks = await deps.loadChunks(sourceId);
      const g = await groundQuestion({ question: message, chunks, apiKey: env.NVIDIA_API_KEY });
      grounding = g.grounding;
      passages = g.passages;
    } catch (err) {
      // Retrieval failing must not take the tutor down — it just answers
      // ungrounded, exactly as it would with no uploaded material.
      console.warn("[tutor] retrieval failed, answering ungrounded", err?.message ?? err);
    }
  }

  try {
    const messages = buildMessages({ learner, context, history, message, writeInLanguage, grounding });
    const { content, model } = await completeWithFailover(messages, env.NVIDIA_API_KEY);
    const parsed = parseTutorJson(content);

    let translated = false;
    let reply = parsed.reply;
    if (strategyFor(lang) === "pivot") {
      const t = await translate(reply, lang, env.GOOGLE_TRANSLATE_API_KEY);
      reply = t.text;
      translated = t.translated;
    }

    // Only surface passages the model said it actually used; fall back to
    // everything retrieved if it did not report.
    const used = parsed.usedSources?.length
      ? passages.filter((_, i) => parsed.usedSources.includes(i + 1))
      : passages;

    return {
      reply,
      anchorUsed: parsed.anchorUsed,
      misconceptionDetected: parsed.misconceptionDetected,
      hintLevel: parsed.hintLevel,
      modelUsed: model,
      translated,
      sources: used.map((p, i) => ({ n: i + 1, score: Number(p.score.toFixed(3)), text: p.text.slice(0, 240) })),
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      reply: SAFE_FALLBACK,
      anchorUsed: null, misconceptionDetected: null, hintLevel: 0,
      modelUsed: null, translated: false, sources: [],
      latencyMs: Date.now() - started,
      error: "all_models_exhausted",
      detail: String(err.message ?? err),
    };
  }
}

/* ------------------------------------------------------------------ */
/* POST /ingest — chunk + embed the learner's material                 */
/* ------------------------------------------------------------------ */

export async function handleIngestRequest(body, env, deps = {}) {
  const started = Date.now();
  const { text = "", title = "Untitled material" } = body ?? {};

  if (!text.trim() || text.trim().length < 80) {
    return { ok: false, error: "too_short", message: "Paste a bit more material — at least a paragraph or two." };
  }

  try {
    const { chunks, model, truncated } = await ingestMaterial(text, env.NVIDIA_API_KEY);
    if (!chunks.length) return { ok: false, error: "no_chunks", message: "Could not read any usable text from that." };

    const sourceId = await deps.saveChunks(chunks, { title, embedModel: model });
    return {
      ok: true,
      sourceId,
      title,
      chunkCount: chunks.length,
      embedModel: model,
      truncated,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return { ok: false, error: "ingest_failed", message: String(err.message ?? err), latencyMs: Date.now() - started };
  }
}

/* ------------------------------------------------------------------ */
/* POST /course — generate a lesson plan for a topic                   */
/* ------------------------------------------------------------------ */

export async function handleCourseRequest(body, env, deps = {}) {
  const started = Date.now();
  const { topic = "", learner = {}, sourceId = null } = body ?? {};

  if (!topic.trim()) return { ok: false, error: "no_topic", message: "Tell me what you want to learn." };

  let chunks = [];
  if (sourceId && deps.loadChunks) {
    try {
      chunks = await deps.loadChunks(sourceId);
    } catch (err) {
      console.warn("[course] could not load material, generating ungrounded", err?.message ?? err);
    }
  }

  try {
    const course = await generateCourse({ topic, learner, chunks, apiKey: env.NVIDIA_API_KEY });
    return { ok: true, topic, ...course, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, error: "course_failed", message: String(err.message ?? err), latencyMs: Date.now() - started };
  }
}
