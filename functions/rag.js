/**
 * Retrieval: chunking, similarity, and turning retrieved passages into
 * grounding for the Socratic tutor.
 *
 * Deliberately dependency-free — no vector database. At the scale a learner
 * actually uploads (a chapter, a handout, a set of notes) an in-process cosine
 * scan over a few hundred vectors costs under a millisecond, and a hosted
 * vector DB would add a network hop, a bill, and another thing to fail on
 * demo day. If a class ever uploads a whole textbook, revisit this.
 */

/**
 * Split text into overlapping chunks on paragraph and sentence boundaries.
 * Overlap matters: a concept explained across a paragraph break is otherwise
 * split in half and neither half retrieves well.
 */
/*
 * Chunk size is a retrieval-quality decision, not a formatting one. At ~900
 * chars a five-paragraph handout collapsed into two chunks, each covering
 * several unrelated ideas, and a question about planting density retrieved the
 * passage about leaf colour instead. Roughly one paragraph per chunk keeps each
 * vector about a single idea, which is what makes cosine similarity mean
 * anything.
 */
export function chunkText(text, { targetChars = 450, overlapChars = 90 } = {}) {
  const clean = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let buffer = "";

  const flush = () => {
    const t = buffer.trim();
    if (t.length > 40) chunks.push(t);
    buffer = "";
  };

  for (const para of paragraphs) {
    if (para.length > targetChars) {
      // Long paragraph: fall back to sentence packing.
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [para];
      for (const s of sentences) {
        if (buffer.length + s.length > targetChars) flush();
        buffer += s;
      }
      flush();
    } else if (buffer.length + para.length > targetChars) {
      flush();
      buffer = para;
    } else {
      buffer += (buffer ? "\n\n" : "") + para;
    }
  }
  flush();

  if (overlapChars <= 0 || chunks.length < 2) return chunks;

  // Prepend the tail of the previous chunk so boundary-straddling ideas survive.
  return chunks.map((c, i) => (i === 0 ? c : `${chunks[i - 1].slice(-overlapChars)} ${c}`.trim()));
}

export function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

/**
 * Rank chunks against a query vector.
 *
 * `minScore` exists so an off-topic question returns NOTHING rather than the
 * least-bad passage. Handing the tutor an irrelevant passage and telling it
 * that's the ground truth is worse than handing it none — it will dutifully
 * build a lesson around the wrong thing.
 */
export function retrieve(queryVector, chunks, { topK = 4, minScore = 0.25 } = {}) {
  return chunks
    .map((c) => ({ ...c, score: cosine(queryVector, c.embedding ?? []) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest); // drop vectors before they cross the wire
}

/** Render retrieved passages for the prompt, numbered so the model can cite them. */
export function formatGrounding(passages) {
  if (!passages.length) return "";
  return passages
    .map((p, i) => `[${i + 1}] ${p.text}`)
    .join("\n\n");
}
