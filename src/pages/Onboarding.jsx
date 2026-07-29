import { useState } from "react";
import { INTEREST_DOMAINS } from "../data/interests.js";

export default function Onboarding() {
  const [form, setForm] = useState({ interests: [], ageBand: null });
  const [step, setStep] = useState(2);

  function toggleInterest(id) {
    const sel = form.interests.includes(id);
    if (sel) setForm({ ...form, interests: form.interests.filter((x) => x !== id) });
    else {
      if (form.interests.length >= 3) setForm({ ...form, interests: [...form.interests.slice(1), id] });
      else setForm({ ...form, interests: [...form.interests, id] });
    }
  }

  return (
    <div>
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
                  className={`relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 transition-all duration-150 active:scale-95 ${
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
    </div>
  );
}
