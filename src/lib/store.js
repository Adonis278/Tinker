/**
 * OWNER: P4 (Platform). P1/P3 read from it, nobody else edits it.
 *
 * One API for user + progress data, with two backends:
 *   VITE_USE_MOCKS=true  -> localStorage  (no Firebase needed, works offline)
 *   VITE_USE_MOCKS=false -> Firestore     (P4 wires this up on day 1)
 *
 * Field shapes are frozen in docs/ARCHITECTURE.md §3. Do not rename fields.
 */

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
const KEY = "tinker.user";
const PROGRESS_KEY = "tinker.progress";

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUser() {
  if (USE_MOCKS) return read(KEY, null);
  // TODO(P4): read from Firestore users/{uid} once auth is wired.
  return read(KEY, null);
}

export function saveUser(patch) {
  const next = { ...(getUser() ?? {}), ...patch };
  if (!next.createdAt) next.createdAt = Date.now();
  write(KEY, next);
  // TODO(P4): mirror to Firestore + log a Firebase Analytics event.
  return next;
}

export function getProgress(lessonId) {
  const all = read(PROGRESS_KEY, {});
  return (
    all[lessonId] ?? {
      status: "not-started",
      quizScore: 0,
      misconceptionsHit: [],
      reviewDueAt: null,
      completedAt: null,
    }
  );
}

export function saveProgress(lessonId, patch) {
  const all = read(PROGRESS_KEY, {});
  all[lessonId] = { ...getProgress(lessonId), ...patch };
  write(PROGRESS_KEY, all);
  return all[lessonId];
}

export function resetAll() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(PROGRESS_KEY);
}

/** Mock territorial data. TODO(P3): move to src/data/regions.js and expand. */
export function getRegion() {
  return { name: "Lagos", masteryPct: 14, learnerCount: 2481 };
}
