import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUser, getRegion, resetAll } from "../lib/store.js";
import { levelFor, xpToNextLevel, BADGES, earnedBadges } from "../lib/gamification.js";
import { INTEREST_DOMAINS } from "../data/interests.js";

/**
 * OWNER: P1 (layout) + P3 (the numbers).
 * The region card is the emotional close of the demo — it goes last and
 * carries the most visual weight. XP bar animates on mount. Locked badges
 * stay visible and greyed: loss aversion needs to be seen.
 */
export default function Dashboard() {
  const user = getUser();
  const region = getRegion();

  const { pct, next } = xpToNextLevel(user?.xp ?? 0);
  const earned = user ? earnedBadges(user) : [];

  // Double-rAF so the browser paints 0% first and the width transition runs.
  const [barPct, setBarPct] = useState(0);
  const [regionPct, setRegionPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setBarPct(pct);
        setRegionPct(region.masteryPct);
      })
    );
    return () => cancelAnimationFrame(id);
  }, [pct, region.masteryPct]);

  if (!user)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span aria-hidden="true" className="text-4xl">🌱</span>
        <p className="text-base font-bold text-brand-navy">Your journey starts here</p>
        <p className="max-w-[260px] text-sm leading-relaxed text-slate-500">
          Finish your first lesson and this dashboard comes alive.
        </p>
        <Link
          to="/onboarding"
          className="mt-2 flex min-h-[44px] items-center rounded-full bg-brand-blue px-5 text-sm font-bold text-white active:scale-95"
        >
          Start in 60 seconds
        </Link>
      </div>
    );

  return (
    <div className="space-y-4 p-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          {user.displayName ? `Nice work, ${user.displayName}` : "Your progress"}
        </h1>
        <p className="text-sm text-slate-500">Level {levelFor(user.xp ?? 0)}</p>
      </div>

      {/* XP — fills on mount */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-brand-navy">{user.xp ?? 0} XP</span>
          <span className="text-slate-400">{next} XP to next level</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            role="progressbar"
            aria-valuenow={user.xp ?? 0}
            aria-valuemax={next}
            className="no-motion-transition h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-navy transition-[width] duration-1000 ease-out"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Day streak" value={`🔥 ${user.streak ?? 0}`} />
        <Stat label="Badges" value={`${earned.length} / ${BADGES.length}`} />
      </div>

      {/* Badges — locked ones visible, greyed, with the unlock condition */}
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const has = earned.includes(b.id);
          return (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-1 ${
                has ? "bg-white shadow-sm ring-brand-blue/20" : "bg-slate-50 ring-slate-100"
              }`}
            >
              {/* The lock sits OUTSIDE the greyed span — opacity on a parent
                  cascades to the whole subtree and a child cannot escape it. */}
              <span aria-hidden="true" className="relative text-3xl leading-none">
                <span className={has ? "" : "block grayscale opacity-35"}>{b.emoji}</span>
                {!has && <span className="absolute -bottom-1 -right-2 text-sm">🔒</span>}
              </span>
              <span
                className={`text-[11px] font-semibold leading-tight ${has ? "text-brand-navy" : "text-slate-400"}`}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-navy">Learning through</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(user.interests ?? []).map((id) => {
            const d = INTEREST_DOMAINS.find((x) => x.id === id);
            return (
              <span key={id} className="rounded-full bg-brand-blue/10 px-3 py-1.5 text-sm font-medium text-brand-blue">
                {d?.emoji} {d?.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* THE CLOSE — territorial progress, biggest thing on the page */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-brand-blue p-5 text-white shadow-lg">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        />
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          Your region 🌍
        </p>
        <div className="mb-1 flex items-end gap-2">
          <span className="text-5xl font-extrabold leading-none">{region.masteryPct}%</span>
          <span className="pb-1 text-sm text-white/80">algebra mastery in {region.name}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="no-motion-transition h-full rounded-full bg-white transition-[width] duration-1000 ease-out"
            style={{ width: `${regionPct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold">You helped move this number</p>
          <p className="text-xs text-white/70">
            {region.learnerCount.toLocaleString()} learners
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          resetAll();
          location.href = "/";
        }}
        className="min-h-[44px] text-xs text-slate-400 underline"
      >
        Reset demo data
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-brand-navy">{value}</p>
    </div>
  );
}
