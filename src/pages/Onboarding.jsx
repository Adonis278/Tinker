import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { INTEREST_DOMAINS, LANGUAGES, AGE_BANDS } from "../data/interests.js";
import { saveUser } from "../lib/store.js";
import { track } from "../firebase.js";

/**
 * OWNER: P1.
 * This is a WORKING SKELETON, not the final design. Make it beautiful.
 * The "Your World" step is the demo's opening shot — give it the most love.
 */
export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ displayName: "", ageBand: "17-22", nativeLanguage: "sw", interests: [] });

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
    saveUser({ ...form, xp: 0, streak: 1, badges: [], lastActiveDate: new Date().toISOString().slice(0, 10) });
    track("onboarding_complete", { language: form.nativeLanguage, interests: form.interests.join(",") });
    nav("/lesson/algebra-01");
  }

  // flex-1, not h-full: as a flex item a percentage height resolves against an
  // indefinite main size and collapses to content height, which left the footer
  // floating mid-screen with dead space below it.
  return (
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-brand-blue" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 0 && (
        <section className="flex-1">
          <h1 className="text-2xl font-bold text-brand-navy">Let's start with you</h1>
          <p className="mt-1 text-sm text-slate-500">No account needed. This takes 60 seconds.</p>

          <label className="mt-6 block text-sm font-medium">What should we call you?</label>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none focus-visible:ring focus-visible:ring-brand-blue/20"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Your name"
          />

          <label className="mt-4 block text-sm font-medium">How old are you?</label>
          <div className="mt-1 flex gap-2">
            {AGE_BANDS.map((b) => (
              <button
                key={b}
                onClick={() => setForm({ ...form, ageBand: b })}
                className={`min-h-[44px] flex-1 rounded-lg border py-2 text-sm transition-colors focus-visible:ring focus-visible:ring-brand-blue/20 ${
                  form.ageBand === b ? "border-brand-blue bg-blue-50 font-semibold text-brand-blue" : ""
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex-1">
          <h1 className="text-2xl font-bold text-brand-navy">Which language do you think in?</h1>
          <p className="mt-1 text-sm text-slate-500">
            We'll teach the idea in your language first, then show you the English term.
          </p>
          <div className="mt-5 space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setForm({ ...form, nativeLanguage: l.code })}
                className={`w-full rounded-lg border px-4 py-3 text-left focus-visible:ring focus-visible:ring-brand-blue/20 ${
                  form.nativeLanguage === l.code ? "border-brand-blue bg-blue-50 font-semibold text-brand-blue" : ""
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex-1 overflow-y-auto pb-2">
          <h1 className="text-2xl font-bold text-brand-navy">What do you already know well?</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick up to 3. We'll teach maths through these — not through someone else's world.
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span
              aria-live="polite"
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
                form.interests.length >= 3 ? "bg-brand-blue text-white" : "bg-brand-blue/10 text-brand-navy"
              }`}
            >
              {form.interests.length} of 3 chosen
            </span>
            {form.interests.length >= 3 && (
              <span className="text-xs text-slate-400">Tap one to swap it out</span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {INTEREST_DOMAINS.map((d) => {
              const on = form.interests.includes(d.id);
              const dimmed = !on && form.interests.length >= 3;
              return (
                <button
                  key={d.id}
                  onClick={() => toggleInterest(d.id)}
                  aria-pressed={on}
                  className={`relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 transition-all duration-150 active:scale-95 focus-visible:ring focus-visible:ring-brand-blue/20 ${
                    on
                      ? "scale-[1.02] border-brand-blue bg-brand-blue/10 shadow-md shadow-brand-blue/20"
                      : dimmed
                        ? "border-slate-200 bg-white opacity-40"
                        : "border-slate-200 bg-white hover:border-brand-blue/40"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white transition-all duration-200 ${
                      on ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-4xl leading-none transition-transform duration-150 ${on ? "scale-110" : ""}`}
                  >
                    {d.emoji}
                  </span>
                  <span
                    className={`text-center text-sm font-semibold leading-tight ${
                      on ? "text-brand-navy" : "text-slate-700"
                    }`}
                  >
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="rounded-lg border px-4 py-3 text-sm focus-visible:ring focus-visible:ring-brand-blue/20">
            Back
          </button>
        )}
        <button
          onClick={() => (step === 2 ? finish() : setStep(step + 1))}
          disabled={step === 2 && form.interests.length === 0}
          className="flex-1 rounded-lg bg-brand-blue py-3 font-semibold text-white disabled:opacity-40 focus-visible:ring focus-visible:ring-brand-blue/20"
        >
          {step === 2 ? "Start learning" : "Continue"}
        </button>
      </div>
    </div>
  );
}
