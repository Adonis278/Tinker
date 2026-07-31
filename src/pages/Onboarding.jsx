import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { INTEREST_DOMAINS, LANGUAGES, AGE_BANDS } from "../data/interests.js";
import { saveUser } from "../lib/store.js";
import { track } from "../firebase.js";

/**
 * Onboarding exists to collect the four things that genuinely change what the
 * learner is shown — language, the worlds they already know, why they are here,
 * and how confident they feel. Anything that would not change a lesson does not
 * belong in here; every extra question costs completions.
 */

const GOALS = [
  { id: "exam", emoji: "📝", label: "Pass an exam", hint: "Focused, lots of practice" },
  { id: "school", emoji: "🎒", label: "Keep up in class", hint: "Fill the gaps as they appear" },
  { id: "curious", emoji: "🔭", label: "I'm just curious", hint: "Go wide, follow the interesting bits" },
  { id: "career", emoji: "💼", label: "Skills for work", hint: "Practical and applied" },
];

const LEVELS = [
  { id: "new", label: "Totally new", hint: "Start from the very beginning" },
  { id: "shaky", label: "Seen it, shaky", hint: "I've met this but it didn't stick" },
  { id: "solid", label: "Fairly solid", hint: "Push me, go deeper" },
];

const STEPS = ["You", "Language", "Your world", "Goal"];

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    displayName: "",
    ageBand: "17-22",
    nativeLanguage: "sw",
    interests: [],
    otherInterest: "",
    goal: "school",
    level: "shaky",
  });

  function toggleInterest(id) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id)
        ? f.interests.filter((i) => i !== id)
        : f.interests.length < 3
          ? [...f.interests, id]
          : f.interests,
    }));
  }

  function finish() {
    saveUser({
      ...form,
      xp: 0,
      streak: 1,
      badges: [],
      lastActiveDate: new Date().toISOString().slice(0, 10),
    });
    track("onboarding_complete", {
      language: form.nativeLanguage,
      interests: form.interests.join(","),
      goal: form.goal,
      level: form.level,
    });
    nav("/learn");
  }

  const needsOtherText = form.interests.includes("other") && !form.otherInterest.trim();
  const canAdvance = step !== 2 || (form.interests.length > 0 && !needsOtherText);

  return (
    <div className="aurora flex min-h-[calc(100vh-57px)] flex-col px-5 pb-6 pt-6 sm:px-8">
      {/* progress */}
      <div className="mb-7">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="rail flex-1">
              <i style={{ width: i <= step ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgb(var(--accent))" }}>
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      <div key={step} className="tinker-rise flex-1">
        {step === 0 && (
          <section>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
              Let's start with you
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
              No account, no email. This takes about a minute and it shapes everything after it.
            </p>

            <label className="mt-7 block text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
              What should we call you?
            </label>
            <input
              className="field mt-2"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Your name"
              autoFocus
            />

            <p className="mt-6 text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>How old are you?</p>
            <p className="mt-0.5 text-[13px]" style={{ color: "rgb(var(--ink-soft))" }}>
              We pitch the language and examples to match.
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {AGE_BANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setForm({ ...form, ageBand: b })}
                  className={`chip focus-ring justify-center ${form.ageBand === b ? "chip-on" : ""}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
              Which language do you think in?
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
              We teach the idea in your language first, then hand you the English term for it — so you
              gain the word without losing the concept.
            </p>
            <div className="mt-6 space-y-2.5">
              {LANGUAGES.map((l) => {
                const on = form.nativeLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setForm({ ...form, nativeLanguage: l.code })}
                    className={`card card-lift focus-ring flex w-full items-center gap-3 p-4 text-left ${on ? "brand-ring" : ""}`}
                    style={on ? { background: "rgb(var(--accent) / 0.05)" } : undefined}
                  >
                    <span className="flex-1 text-[16px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                      {l.label}
                    </span>
                    {on && <span aria-hidden="true" style={{ color: "rgb(var(--green-deep))" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
              What do you already know well?
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
              This is the important one. We don't simplify hard ideas — we move them into a world you
              already navigate confidently.
            </p>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-[13px] font-semibold" style={{ color: "rgb(var(--ink-soft))" }}>
                Pick up to 3
              </span>
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: form.interests.length ? "rgb(var(--green-deep))" : "rgb(var(--ink-soft))" }}
              >
                {form.interests.length} of 3 chosen
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {INTEREST_DOMAINS.map((d) => {
                const on = form.interests.includes(d.id);
                const full = !on && form.interests.length >= 3;
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleInterest(d.id)}
                    aria-pressed={on}
                    className={`card card-lift focus-ring p-3.5 text-left transition-opacity ${on ? "brand-ring" : ""} ${full ? "opacity-40" : ""}`}
                    style={on ? { background: "rgb(var(--green) / 0.07)" } : undefined}
                  >
                    <span aria-hidden="true" className="block text-2xl">{d.emoji}</span>
                    <span className="mt-1.5 block text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {form.interests.includes("other") && (
              <div className="tinker-pop mt-4">
                <label className="block text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                  What is it you know well?
                </label>
                <input
                  className="field mt-2"
                  value={form.otherInterest}
                  onChange={(e) => setForm({ ...form, otherInterest: e.target.value })}
                  placeholder="e.g. fishing, tailoring, motorbike repair, hair braiding…"
                  autoFocus
                />
                <p className="mt-1.5 text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
                  Anything at all — we'll build your explanations inside it.
                </p>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
              What brings you here?
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
              This changes how we pace things — and how hard we push.
            </p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {GOALS.map((g) => {
                const on = form.goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setForm({ ...form, goal: g.id })}
                    className={`card card-lift focus-ring flex items-start gap-3 p-3.5 text-left ${on ? "brand-ring" : ""}`}
                    style={on ? { background: "rgb(var(--accent) / 0.05)" } : undefined}
                  >
                    <span aria-hidden="true" className="text-xl">{g.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                        {g.label}
                      </span>
                      <span className="block text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>{g.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-7 text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
              How confident do you feel right now?
            </p>
            <div className="mt-2.5 space-y-2">
              {LEVELS.map((l) => {
                const on = form.level === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setForm({ ...form, level: l.id })}
                    className={`card card-lift focus-ring flex w-full items-center gap-3 p-3.5 text-left ${on ? "brand-ring" : ""}`}
                    style={on ? { background: "rgb(var(--green) / 0.06)" } : undefined}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                        {l.label}
                      </span>
                      <span className="block text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>{l.hint}</span>
                    </span>
                    {on && <span aria-hidden="true" style={{ color: "rgb(var(--green-deep))" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* actions */}
      <div className="mt-8 flex gap-2.5">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn btn-ghost focus-ring px-5">
            Back
          </button>
        )}
        <button
          onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
          disabled={!canAdvance}
          className="btn btn-primary focus-ring flex-1"
        >
          {step === STEPS.length - 1 ? "Start learning" : "Continue"}
        </button>
      </div>

      {step === 2 && !form.interests.length && (
        <p className="mt-2 text-center text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
          Pick at least one to continue
        </p>
      )}
    </div>
  );
}
