/**
 * OWNER: P4 (Platform). P1 and P3 read from it; nobody else edits it.
 *
 * LOCAL-FIRST BY DESIGN
 * ---------------------
 * Reads are synchronous and always come from localStorage. Firestore is the
 * durable layer behind it: we hydrate from it once at boot, then mirror every
 * write up in the background.
 *
 * This matters for two reasons:
 *   1. The public API stays synchronous, so P1 can call getUser() during
 *      render. Making the store async would have forced a refactor of every
 *      page — the contract in ARCHITECTURE.md §3 is unchanged.
 *   2. It is the right shape for the product. Our learners are on 2G. The app
 *      must work when the network doesn't, and reconcile when it returns.
 *
 * Conflict resolution is last-write-wins on `updatedAt`.
 * Field shapes are frozen in docs/ARCHITECTURE.md §3. Do not rename fields.
 */

import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { MOCK_STORE } from "./env.js";
import { db, live, ensureSignedIn } from "../firebase.js";
import { nextStreak, streakBonus } from "./gamification.js";

const KEY = "tinker.user";
const PROGRESS_KEY = "tinker.progress";

let uid = null;

/* ------------------------------------------------------------------ */
/* Local cache — the synchronous read path                             */
/* ------------------------------------------------------------------ */

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[store] local write failed", err);
  }
}

/* ------------------------------------------------------------------ */
/* Public API — signatures frozen, callers unchanged                   */
/* ------------------------------------------------------------------ */

export function getUser() {
  return read(KEY, null);
}

export function saveUser(patch) {
  const next = { ...(getUser() ?? {}), ...patch, updatedAt: Date.now() };
  if (!next.createdAt) next.createdAt = Date.now();
  write(KEY, next);
  syncUser(next);
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
  const next = { ...getProgress(lessonId), ...patch, updatedAt: Date.now() };
  all[lessonId] = next;
  write(PROGRESS_KEY, all);
  syncProgress(lessonId, next);
  return next;
}

export function resetAll() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(PROGRESS_KEY);
}

/* ------------------------------------------------------------------ */
/* Activity — the bridge between the pure game logic and the app       */
/* ------------------------------------------------------------------ */
/*
 * These exist because the game logic was written but never called: the streak
 * was set to 1 at onboarding and never moved, streakBonus awarded nothing, and
 * three of the five badges tested fields that nothing in the app ever wrote,
 * so they could not be earned at all. Anything gamification needs recorded
 * goes through here.
 */

/**
 * Call once per meaningful learning action (finishing a quiz, working through
 * a lesson). Advances the streak, pays the streak bonus, and notes which
 * language the learner is studying in.
 */
export function recordActivity({ language } = {}) {
  const user = getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const prev = user.streak ?? 0;
  const streak = nextStreak(user.lastActiveDate, prev, today);
  const bonus = streakBonus(prev, streak);

  const langs = new Set(user.languagesUsed ?? []);
  if (language) langs.add(language);

  return saveUser({
    streak,
    lastActiveDate: today,
    xp: (user.xp ?? 0) + bonus,
    languagesUsed: [...langs],
  });
}

/** Feeds the "In My Own Words" badge — earned by explaining, not by clicking. */
export function recordTutorTurn() {
  const user = getUser();
  if (!user) return null;
  return saveUser({ tutorTurns: (user.tutorTurns ?? 0) + 1 });
}

/** Feeds "Comeback": missed a concept, came back, got it right. */
export function markComeback() {
  const user = getUser();
  if (!user || user.reviewedAndCorrected) return user;
  return saveUser({ reviewedAndCorrected: true });
}

/** Mock regional data until P3's src/data/regions.js is wired in. */
export function getRegion() {
  return { name: "Lagos", masteryPct: 14, learnerCount: 2481 };
}

/* ------------------------------------------------------------------ */
/* Background sync — fire and forget, never blocks or throws           */
/* ------------------------------------------------------------------ */

async function syncUser(user) {
  if (!live || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), user, { merge: true });
  } catch (err) {
    console.warn("[store] user sync failed, kept locally", err);
  }
}

async function syncProgress(lessonId, progress) {
  if (!live || !uid) return;
  try {
    await setDoc(doc(db, "users", uid, "progress", lessonId), progress, { merge: true });
  } catch (err) {
    console.warn("[store] progress sync failed, kept locally", err);
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

/**
 * Sign in anonymously and reconcile local cache with Firestore.
 * Called once from main.jsx. Resolves with { changed } so the bootstrap can
 * re-render if remote data won. Never rejects — a failed hydrate just means
 * we carry on with whatever is local.
 *
 * @returns {Promise<{mode: string, changed: boolean, uid: string|null}>}
 */
export async function initStore() {
  if (MOCK_STORE || !live) {
    return { mode: "local", changed: false, uid: null };
  }

  try {
    const user = await ensureSignedIn();
    uid = user.uid;

    const [remoteUserSnap, remoteProgressSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDocs(collection(db, "users", uid, "progress")),
    ]);

    let changed = false;

    // --- user doc: last write wins ---
    const localUser = getUser();
    const remoteUser = remoteUserSnap.exists() ? remoteUserSnap.data() : null;

    if (remoteUser && (!localUser || (remoteUser.updatedAt ?? 0) > (localUser.updatedAt ?? 0))) {
      write(KEY, remoteUser);
      changed = true;
    } else if (localUser) {
      syncUser(localUser); // local is newer (or remote is empty) — push it up
    }

    // --- progress: merge per lesson, last write wins ---
    if (!remoteProgressSnap.empty) {
      const localAll = read(PROGRESS_KEY, {});
      remoteProgressSnap.forEach((d) => {
        const remote = d.data();
        const local = localAll[d.id];
        if (!local || (remote.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
          localAll[d.id] = remote;
          changed = true;
        }
      });
      write(PROGRESS_KEY, localAll);
    }

    return { mode: "firestore", changed, uid };
  } catch (err) {
    console.warn("[store] hydrate failed, running on local cache", err);
    return { mode: "local-fallback", changed: false, uid };
  }
}
