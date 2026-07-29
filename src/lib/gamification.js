/**
 * OWNER: P3 (Content + Game Logic).
 *
 * Pure functions only, no localStorage, no Firestore, no side effects.
 * src/lib/store.js (P4) calls these and persists whatever they return.
 * Field shapes are frozen in docs/ARCHITECTURE.md section 3. Do not rename.
 */

const XP_BASE_PER_LESSON = 50;
const XP_MAX_QUIZ_BONUS = 50;

export function xpForLessonCompletion(quizScore) {
  const clamped = Math.max(0, Math.min(1, quizScore));
  return XP_BASE_PER_LESSON + Math.round(clamped * XP_MAX_QUIZ_BONUS);
}

function xpRequiredForLevel(level) {
  return 50 * (level - 1) * (level - 1);
}

export function getLevelInfo(totalXp) {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) level++;
  const currentFloor = xpRequiredForLevel(level);
  const nextCeiling = xpRequiredForLevel(level + 1);
  return {
    level,
    xpIntoLevel: totalXp - currentFloor,
    xpForNextLevel: nextCeiling - currentFloor,
  };
}

function dayDiff(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr + "T00:00:00Z");
  const to = new Date(toDateStr + "T00:00:00Z");
  return Math.round((to - from) / 86400000);
}

export function calculateStreak(lastActiveDate, previousStreak, today) {
  if (!lastActiveDate) return 1;
  const diffDays = dayDiff(lastActiveDate, today);
  if (diffDays <= 0) return previousStreak || 1;
  if (diffDays === 1) return (previousStreak || 0) + 1;
  return 1;
}

export const BADGE_DEFS = {
  "first-lesson": { label: "First Step", check: (ctx) => ctx.completedLessonCount >= 1 },
  "three-day-streak": { label: "Warming Up", check: (ctx) => ctx.streak >= 3 },
  "seven-day-streak": { label: "One Week Strong", check: (ctx) => ctx.streak >= 7 },
  "perfect-score": { label: "Nailed It", check: (ctx) => ctx.justScoredPerfect === true },
  "all-lessons-complete": { label: "Course Cleared", check: (ctx) => ctx.completedLessonCount >= ctx.totalLessonCount },
};

export function evaluateNewBadges(existingBadges, ctx) {
  return Object.entries(BADGE_DEFS)
    .filter(([id, def]) => !existingBadges.includes(id) && def.check(ctx))
    .map(([id]) => id);
}

/**
 * Single entry point for store.js to call on lesson completion.
 * Pure, computes everything that changes; store.js persists the result.
 * Must be called exactly once per completion (the not-started/in-progress
 * to complete transition), not on every lesson reopen.
 */
export function applyLessonCompletion({ user, quizScore, today, completedLessonCount, totalLessonCount }) {
  const xpGained = xpForLessonCompletion(quizScore);
  const newXp = (user.xp ?? 0) + xpGained;
  const newStreak = calculateStreak(user.lastActiveDate, user.streak ?? 0, today);
  const newBadges = evaluateNewBadges(user.badges ?? [], {
    completedLessonCount,
    totalLessonCount,
    streak: newStreak,
    justScoredPerfect: quizScore >= 1,
  });

  return {
    xp: newXp,
    streak: newStreak,
    lastActiveDate: today,
    badges: [...(user.badges ?? []), ...newBadges],
    xpGained,
    newBadges,
  };
}
