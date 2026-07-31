import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../firebase.js";
import { track } from "../firebase.js";

/**
 * Public landing page. Responsive by design: a single column on a phone,
 * a two-column hero from `lg` up.
 *
 * The demo device is a phone, but judges will open this on a laptop — so it
 * has to hold up at both ends, not just scale awkwardly between them.
 */
export default function Landing() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function google() {
    setBusy(true);
    setNote(null);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.ok) {
      track("sign_in", { method: "google", upgraded: Boolean(res.upgraded) });
      nav("/onboarding");
    } else if (res.error === "auth-unavailable") {
      setNote("Sign-in isn't configured in this environment — you can still try it without an account.");
    } else if (res.error !== "cancelled") {
      setNote("That didn't work. You can still try it without an account.");
    }
  }

  return (
    <div className="min-h-full bg-white">
      {/* ---------------- nav ---------------- */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="brand-gradient flex h-8 w-8 items-center justify-center rounded-xl text-[15px] font-black text-white">
            T
          </span>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: "rgb(var(--ink))" }}>Tinker</span>
        </div>
        <button onClick={google} disabled={busy} className="chip focus-ring">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(50% 45% at 18% 22%, rgb(var(--accent) / 0.16), transparent 70%)," +
              "radial-gradient(45% 45% at 85% 10%, rgb(var(--green) / 0.18), transparent 72%)," +
              "radial-gradient(40% 40% at 60% 80%, rgb(6 160 160 / 0.10), transparent 70%)",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-16">
          {/* copy */}
          <div className="tinker-rise">
            <span className="brand-ring inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
              style={{ color: "rgb(var(--accent-deep))" }}>
              <span aria-hidden="true">✦</span> AI tutoring that refuses to do it for you
            </span>

            <h1 className="mt-5 text-[38px] font-bold leading-[1.08] tracking-tight sm:text-[46px] lg:text-[54px]"
              style={{ color: "rgb(var(--ink))" }}>
              Learn in the language<br className="hidden sm:block" /> you think in,{" "}
              <span className="brand-text">through what you already love.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed sm:text-[17.5px]"
              style={{ color: "rgb(var(--ink-soft))" }}>
              Tell Tinker what you want to learn — bring your own notes if you have them. It builds
              your lessons from <em>your</em> material, explains them through cooking, football or
              farming, and asks the questions that make it stick.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => { track("cta_try", {}); nav("/onboarding"); }}
                className="btn btn-primary focus-ring w-full sm:w-auto sm:px-8"
              >
                Try it out — no account needed
              </button>
              <button onClick={google} disabled={busy} className="btn btn-ghost focus-ring w-full sm:w-auto">
                <GoogleMark /> {busy ? "Signing in…" : "Continue with Google"}
              </button>
            </div>

            {note && (
              <p className="tinker-pop mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-[13.5px] text-amber-900 ring-1 ring-amber-200">
                {note}
              </p>
            )}

            <p className="mt-4 text-[13px]" style={{ color: "rgb(var(--ink-soft))" }}>
              Free · works on any phone · your progress saves without signing up
            </p>
          </div>

          {/* preview */}
          <div className="tinker-rise lg:justify-self-end" style={{ animationDelay: "120ms" }}>
            <PhonePreview />
          </div>
        </div>
      </section>

      {/* ---------------- what makes it different ---------------- */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
        <h2 className="text-center text-[26px] font-bold tracking-tight sm:text-[32px]" style={{ color: "rgb(var(--ink))" }}>
          Not another chatbot that does your homework
        </h2>
        <div className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            emoji="🌍"
            title="Your language first"
            body="Concepts land in Kiswahili, Hindi, Yoruba or Shona — then we bridge you to the academic English term, as a label for something you already understand."
          />
          <Feature
            emoji="⚽"
            title="Explained through your world"
            body="Ratios through scaling a recipe. Averages through a striker's season. We don't simplify the idea — we move it somewhere you already navigate confidently."
          />
          <Feature
            emoji="📎"
            title="Grounded in your material"
            body="Upload your notes or a chapter. Tinker indexes it, teaches from it, and shows you exactly which passage each answer came from."
          />
          <Feature
            emoji="🧠"
            title="It won't give you the answer"
            body="Ask it to just tell you and it refuses — every time. It asks a better question instead, and names the misconception behind a wrong answer."
          />
          <Feature
            emoji="📶"
            title="Built for real connections"
            body="Text-first, light pages, and your progress is kept on your device so a dropped signal never costs you a lesson."
          />
          <Feature
            emoji="🌱"
            title="Progress that means something"
            body="Track what you've actually mastered, and see your region's learning grow alongside your own."
          />
        </div>
      </section>

      {/* ---------------- closing ---------------- */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="brand-gradient mx-auto max-w-4xl rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="text-[26px] font-bold leading-tight text-white sm:text-[32px]">
            What do you want to learn?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15.5px] leading-relaxed text-white/85">
            Sixty seconds of setup, then it's yours. No card, no account, no waiting.
          </p>
          <button
            onClick={() => { track("cta_try", { position: "footer" }); nav("/onboarding"); }}
            className="btn focus-ring mt-7 bg-white px-8"
            style={{ color: "rgb(var(--accent-deep))" }}
          >
            Start learning
          </button>
        </div>
        <p className="mt-8 text-center text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
          Built by Spiritus Agentic Solutions · AI, custom-built for African realities
        </p>
      </section>
    </div>
  );
}

function Feature({ emoji, title, body }) {
  return (
    <div className="card p-5">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
        style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.12), rgb(var(--green) / 0.12))" }}>
        {emoji}
      </span>
      <h3 className="mt-3.5 text-[16.5px] font-bold" style={{ color: "rgb(var(--ink))" }}>{title}</h3>
      <p className="mt-1.5 text-[14.5px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>{body}</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.5 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C2.9 17.3 2 20.5 2 24s.9 6.7 2.5 9.9l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  );
}

/** Static product preview — deliberately not a screenshot, so it never goes stale. */
function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
        style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.35), rgb(var(--green) / 0.35))" }}
      />
      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl">
        <div className="brand-gradient px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">Your plan</p>
          <p className="text-[15px] font-bold text-white">Maize &amp; sunlight</p>
        </div>
        <div className="space-y-2.5 p-3.5">
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgb(var(--violet) / 0.08)" }}>
            <p className="text-[10.5px] font-bold" style={{ color: "rgb(92 62 214)" }}>📎 FROM YOUR MATERIAL · 4 PASSAGES</p>
          </div>
          <div className="anchor-card !px-3 !py-2.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgb(var(--accent))" }}>
              Because you know farming
            </p>
            <p className="mt-1 text-[12px] leading-snug" style={{ color: "rgb(var(--ink))" }}>
              Kama shamba linavyohitaji mvua, mmea unahitaji mwanga wa jua…
            </p>
          </div>
          <div className="rounded-xl px-3 py-2.5 text-[12px] leading-snug"
            style={{ background: "rgb(var(--canvas))", color: "rgb(var(--ink))" }}>
            <span className="font-semibold">You:</span> just give me the answer
          </div>
          <div className="rounded-xl px-3 py-2.5 text-[12px] leading-snug"
            style={{ background: "rgb(var(--accent) / 0.08)", color: "rgb(var(--ink))" }}>
            Sitakupa jibu — lakini nitakusaidia kulipata. Ni nini kinachotokea kwa mmea bila maji?
          </div>
        </div>
      </div>
    </div>
  );
}
