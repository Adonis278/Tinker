/**
 * OWNER: P3 (Game Logic).
 * Pure functions only — no React, no Firebase. That keeps it trivially testable
 * and means P1 can call it from anywhere without side effects.
 */

// Tuned so a learner doing reasonably well on one lesson's quiz (2-3 correct
// answers, ideally a perfect run) crosses into level 2 in that same session.
export const XP_PER_LESSON = 50; // awarded as a perfect-quiz bonus
export const XP_PER_CORRECT = 20; // was 10 — too slow to reach level 2 in one sitting
export const XP_STREAK_BONUS = 25; // now actually used, see streakBonus() below

export const BADGES = [
  { id: "first-steps", label: "First Steps", emoji: "\u{1F331}", test: (u) => u.xp > 0 },
  { id: "own-words", label: "In My Own Words", emoji: "\u{1F5E3}️", test: (u) => (u.tutorTurns ?? 0) >= 3 },
  { id: "streak-3", label: "Three Day Fire", emoji: "\u{1F525}", test: (u) => (u.streak ?? 0) >= 3 },
  // New — understanding-oriented rather than pure activity-volume badges.
  { id: "polyglot", label: "Polyglot", emoji: "\u{1F30D}", test: (u) => (u.languagesUsed?.length ?? 0) >= 2 },
  { id: "comeback", label: "Comeback", emoji: "\u{1F501}", test: (u) => u.reviewedAndCorrected === true },
];

/** Level curve: 0-99 = L1, then every 150 XP. */
export function levelFor(xp = 0) {
  if (xp < 100) return 1;
  return 2 + Math.floor((xp - 100) / 150);
}

export function xpToNextLevel(xp = 0) {
  const level = levelFor(xp);
  const next = level === 1 ? 100 : 100 + (level - 1) * 150;
  return { current: xp, next, pct: Math.min(100, Math.round((xp / next) * 100)) };
}

export function awardQuiz({ correctCount, total }) {
  const perfect = correctCount === total;
  return XP_PER_CORRECT * correctCount + (perfect ? XP_PER_LESSON : 0);
}

/** Returns the updated streak given the last active date. Pure — pass today in for tests. */
export function nextStreak(lastActiveDate, streak = 0, today = new Date().toISOString().slice(0, 10)) {
  if (lastActiveDate === today) return streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return lastActiveDate === yesterday ? streak + 1 : 1;
}

/**
 * Bonus XP for a streak that just extended (call alongside nextStreak with
 * the before/after values). Returns 0 if the streak didn't grow this check.
 */
export function streakBonus(prevStreak = 0, newStreak = 0) {
  return newStreak > prevStreak ? XP_STREAK_BONUS : 0;
}

export function earnedBadges(user) {
  return BADGES.filter((b) => b.test(user)).map((b) => b.id);
}

/**
 * Reinforcement: a wrong answer schedules a micro-review.
 * Weighted by repeated misses — the more times a learner has missed this
 * SAME misconception, the sooner the review comes back around (tighter
 * spaced-repetition interval for concepts they're actually struggling with).
 * Pass hoursFromNow explicitly to override the weighting (e.g. for tests).
 */
export function scheduleReview({ missCount = 1, hoursFromNow } = {}) {
  const baseHours = 48; // first miss: review in ~2 days
  const minHours = 2; // never schedule sooner than 2 hours out
  const delayHours = hoursFromNow ?? Math.max(minHours, baseHours / missCount);
  return Date.now() + delayHours * 3600 * 1000;
}

/**
 * Counts how many times a given misconception id shows up in a learner's
 * history — feed the result into scheduleReview's missCount.
 */
export function countMisses(misconceptionsHit = [], misconceptionId) {
  return misconceptionsHit.filter((id) => id === misconceptionId).length;
}