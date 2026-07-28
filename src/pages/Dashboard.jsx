import { getUser, getRegion, resetAll } from "../lib/store.js";
import { levelFor, xpToNextLevel, BADGES, earnedBadges } from "../lib/gamification.js";
import { INTEREST_DOMAINS } from "../data/interests.js";

/**
 * OWNER: P1 (layout) + P3 (the numbers).
 * Working skeleton. The territorial line is the emotional close of the demo.
 */
export default function Dashboard() {
  const user = getUser();
  const region = getRegion();
  if (!user) return <div className="p-5">Complete onboarding first.</div>;

  const { pct, next } = xpToNextLevel(user.xp ?? 0);
  const earned = earnedBadges(user);

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          {user.displayName ? `Nice work, ${user.displayName}` : "Your progress"}
        </h1>
        <p className="text-sm text-slate-500">Level {levelFor(user.xp ?? 0)}</p>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{user.xp ?? 0} XP</span>
          <span className="text-slate-400">{next} XP to next level</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Day streak" value={`\u{1F525} ${user.streak ?? 0}`} />
        <Stat label="Badges" value={`${earned.length} / ${BADGES.length}`} />
      </div>

      <div className="rounded-xl bg-brand-navy p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-blue-200">Your region</p>
        <p className="mt-1 text-lg font-semibold">
          You helped {region.name} reach {region.masteryPct}% algebra mastery
        </p>
        <p className="mt-1 text-xs text-blue-200">
          {region.learnerCount.toLocaleString()} learners building this together
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">Learning through</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(user.interests ?? []).map((id) => {
            const d = INTEREST_DOMAINS.find((x) => x.id === id);
            return (
              <span key={id} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-brand-blue">
                {d?.emoji} {d?.label}
              </span>
            );
          })}
        </div>
      </div>

      <button onClick={() => { resetAll(); location.href = "/"; }} className="text-xs text-slate-400 underline">
        Reset demo data
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-brand-navy">{value}</p>
    </div>
  );
}
