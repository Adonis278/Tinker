/**
 * OWNER: P3 (Game Logic).
 * Pure functions only — no React, no Firebase. That keeps it trivially testable
 * and means P1 can call it from anywhere without side effects.
 */

export const XP_PER_LESSON = 50;
export const XP_PER_CORRECT = 10;
export const XP_STREAK_BONUS = 25;

export const BADGES = [
  { id: "first-steps", label: "First Steps", emoji: "\u{1F331}", test: (u) => u.xp > 0 },
  { id: "own-words", label: "In My Own Words", emoji: "\u{1F5E3}️", test: (u) => (u.tutorTurns ?? 0) >= 3 },
  { id: "streak-3", label: "Three Day Fire", emoji: "\u{1F525}", test: (u) => (u.streak ?? 0) >= 3 },
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

export function earnedBadges(user) {
  return BADGES.filter((b) => b.test(user)).map((b) => b.id);
}

/**
 * Reinforcement: a wrong answer schedules a micro-review.
 * TODO(P3): if there's time, weight the delay by how many times they've missed it.
 */
export function scheduleReview({ hoursFromNow = 48 } = {}) {
  return Date.now() + hoursFromNow * 3600 * 1000;
}
