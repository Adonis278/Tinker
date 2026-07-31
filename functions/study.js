/**
 * Study session: ingest a learner's own material, then generate a lesson plan
 * grounded in it.
 *
 * The pitch rests on this being real retrieval, not an LLM improvising about a
 * topic. So the generated plan cites the passages it came from, and the tutor
 * is later handed the same passages as ground truth.
 */

import { embedBatched } from "./embeddings.js";
import { chunkText, retrieve, formatGrounding } from "./rag.js";
import { completeWithFailover } from "./models.js";
import { parseTutorJson } from "./prompts.js";

const MAX_CHARS = 60000; // roughly a long chapter; keeps ingest under a few seconds

/**
 * Chunk + embed the learner's material.
 * @returns {Promise<{chunks: {id,text,embedding}[], model: string, truncated: boolean}>}
 */
export async function ingestMaterial(rawText, apiKey) {
  const truncated = rawText.length > MAX_CHARS;
  const text = truncated ? rawText.slice(0, MAX_CHARS) : rawText;

  const pieces = chunkText(text);
  if (!pieces.length) return { chunks: [], model: null, truncated };

  const { vectors, model } = await embedBatched(pieces, "passage", apiKey);
  const chunks = pieces.map((t, i) => ({ id: `c${i}`, text: t, embedding: vectors[i] }));
  return { chunks, model, truncated };
}

/**
 * Build a lesson plan for `topic`, grounded in retrieved passages when the
 * learner supplied material.
 */
export async function generateCourse({ topic, learner, chunks = [], apiKey }) {
  let grounding = "";
  let citations = [];

  if (chunks.length) {
    // Retrieve against the topic itself so the plan follows the learner's
    // material rather than whatever the model happens to know about the topic.
    const { vectors } = await embedBatched([topic], "query", apiKey);
    citations = retrieve(vectors[0], chunks, { topK: 6, minScore: 0.2 });
    grounding = formatGrounding(citations);
  }

  const langName =
    { en: "English", sw: "Kiswahili", hi: "Hindi", yo: "Yoruba", sn: "Shona" }[learner?.nativeLanguage] ??
    "English";
  const interests = (learner?.interests ?? []).join(", ") || "everyday situations";

  const GOAL_NOTE = {
    exam: "They are preparing for an exam: be precise, drill the things examiners actually test, and keep each lesson tight.",
    school: "They are trying to keep up in class: fill the gaps that block the next topic, and assume some of the basics are missing.",
    curious: "They are here out of curiosity: follow what is genuinely interesting and connect it outward, rather than optimising for a test.",
    career: "They want practical skills: lead with where this is actually used, and keep every lesson applied.",
  }[learner?.goal] ?? "";

  const LEVEL_NOTE = {
    new: "They are completely new to this. Assume nothing. Define every term the first time it appears.",
    shaky: "They have met this before and it did not stick. Rebuild the foundation rather than revising over the crack.",
    solid: "They are already fairly solid. Skip the introduction, go deeper, and challenge them.",
  }[learner?.level] ?? "";

  const system = `You design short, honest learning plans. You are building a plan for a learner aged ${learner?.ageBand ?? "17-22"} who wants to learn: "${topic}".

${GOAL_NOTE}
${LEVEL_NOTE}

ANCHOR EVERY LESSON in a world the learner already knows: ${interests}. Each lesson's
"anchor" field must explain that lesson's idea INSIDE one of those worlds — a real
explanation, not a sentence with the word "football" inserted.

${grounding ? `GROUND TRUTH — the learner supplied this material. Build the plan from it and do NOT invent content it does not support. Cite the passage numbers you used.\n\n${grounding}` : `The learner supplied no material, so build a sensible beginner plan from general knowledge. Leave "citations" empty.`}

Write "title" and "summary" in English. Write "anchor" in ${langName}.

Return ONLY a JSON object, no markdown fences:
{"courseTitle":"<3-5 words>","lessons":[{"title":"<5 words max>","summary":"<ONE short sentence>","anchor":"<the idea inside the learner's world, in ${langName}, MAX 25 WORDS>","check":"<one short question>","citations":[<passage numbers, or empty>]}]}

Produce exactly 3 lessons, ordered so each builds on the last. Be concise — brevity is required, not optional.`;

  // These models drop out of JSON often enough that one attempt is a coin
  // flip. A single retry turns an occasional broken plan into a rare one, and
  // costs nothing when the first attempt succeeds.
  let parsed = null;
  let model = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const nudge =
      attempt === 0
        ? `Build the plan for: ${topic}`
        : `Build the plan for: ${topic}\n\nYour previous reply was not valid JSON. Reply with the raw JSON object ONLY — no preamble, no reasoning, no code fences. Start with { and end with }.`;

    const res = await completeWithFailover(
      [
        { role: "system", content: system },
        { role: "user", content: nudge },
      ],
      apiKey,
      // Sized so a CAPABLE model finishes rather than a weak one winning by
      // default. At 1600 tokens every good model timed out and the chain fell
      // through to the 8B fallback, which wrote fluent-sounding Kiswahili about
      // the wrong subject entirely.
      { maxTokens: 1100, timeoutMs: 30000 }
    );
    model = res.model;
    parsed = parseCourseJson(res.content);
  }

  if (!parsed) parsed = FALLBACK_COURSE;
  return {
    ...parsed,
    modelUsed: model,
    grounded: citations.length > 0,
    sources: citations.map((c, i) => ({ n: i + 1, score: Number(c.score.toFixed(3)), text: c.text.slice(0, 260) })),
  };
}

const FALLBACK_COURSE = {
  courseTitle: "Your learning plan",
  lessons: [
    {
      id: "gen-1",
      order: 1,
      title: "Getting oriented",
      summary: "We had trouble drafting a full plan. Ask the tutor anything and it will start from where you are.",
      anchor: "",
      check: "What part of this topic feels least clear right now?",
      citations: [],
    },
  ],
};

/**
 * Parse a course out of a model reply, or return null so the caller can retry.
 *
 * Two failure modes are common and both are recoverable:
 *   - reasoning models emit a <think> block or prose before the JSON
 *   - the reply is cut off by the token budget mid-object
 * So we strip the preamble, then, if it still will not parse, close whatever
 * brackets are open and try once more before giving up.
 */
function parseCourseJson(raw) {
  let text = String(raw ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json|```/g, "")
    .trim();

  const start = text.indexOf("{");
  if (start === -1) return null;
  text = text.slice(start);

  const candidates = [text.slice(0, text.lastIndexOf("}") + 1), repairTruncatedJson(text)];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const obj = JSON.parse(candidate);
      const lessons = Array.isArray(obj.lessons) ? obj.lessons.filter((l) => l && l.title) : [];
      if (!lessons.length) continue;
      return {
        courseTitle: String(obj.courseTitle ?? "Your learning plan"),
        lessons: lessons.slice(0, 5).map((l, i) => ({
          id: `gen-${i + 1}`,
          order: i + 1,
          title: String(l.title ?? `Lesson ${i + 1}`),
          summary: String(l.summary ?? ""),
          anchor: String(l.anchor ?? ""),
          check: String(l.check ?? ""),
          citations: Array.isArray(l.citations) ? l.citations : [],
        })),
      };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** Close any brackets left open by a truncated reply, discarding a partial tail. */
function repairTruncatedJson(text) {
  // Drop a trailing incomplete object so we keep only whole lessons.
  let cut = text.lastIndexOf("}");
  if (cut === -1) return null;
  let body = text.slice(0, cut + 1);

  const depthOf = (s, open, close) => {
    let d = 0;
    let inStr = false;
    let esc = false;
    for (const ch of s) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === open) d++;
      else if (ch === close) d--;
    }
    return d;
  };

  const brackets = depthOf(body, "[", "]");
  const braces = depthOf(body, "{", "}");
  if (brackets < 0 || braces < 0) return null;
  return body + "]".repeat(brackets) + "}".repeat(braces);
}

/** Retrieve grounding for a live tutor question. */
export async function groundQuestion({ question, chunks, apiKey }) {
  if (!chunks?.length) return { passages: [], grounding: "" };
  const { vectors } = await embedBatched([question], "query", apiKey);
  const passages = retrieve(vectors[0], chunks, { topK: 4, minScore: 0.25 });
  return { passages, grounding: formatGrounding(passages) };
}

export { parseTutorJson };
