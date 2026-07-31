import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, track } from "../firebase.js";

/**
 * Public landing page.
 *
 * Responsive by construction: one column on a phone, a two-column hero from
 * `lg` up. The demo is recorded on a phone but judges will open this on a
 * laptop, so it has to hold up at both ends rather than scale awkwardly
 * between them.
 */
export default function Landing() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function google() {
    setBusy(true);
    setNote(null);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.ok) {
      track("sign_in", { method: "google", upgraded: Boolean(res.upgraded) });
      nav("/onboarding");
    } else if (res.error === "auth-unavailable") {
      setNote("Sign-in isn't configured here — you can still try it without an account.");
    } else if (res.error !== "cancelled") {
      setNote("That didn't work. You can still try it without an account.");
    }
  }

  const tryIt = (where) => {
    track("cta_try", { position: where });
    nav("/onboarding");
  };

  return (
    <div className="min-h-full bg-white">
      {/* ---------------------------- nav ---------------------------- */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "border-b bg-white/90 backdrop-blur-md" : "bg-transparent"
        }`}
        style={scrolled ? { borderColor: "rgb(var(--line))" } : undefined}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-[16px] font-black text-white shadow-sm"
            >
              T
            </span>
            <span className="text-[18px] font-bold tracking-tight" style={{ color: "rgb(var(--ink))" }}>
              Tinker
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={google} disabled={busy} className="chip focus-ring">
              {busy ? "Signing in…" : "Log in"}
            </button>
            <button onClick={() => tryIt("nav")} className="btn btn-primary focus-ring hidden !min-h-[44px] px-5 text-[14px] sm:inline-flex">
              Try it out
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------- hero ---------------------------- */}
      <section className="relative overflow-hidden">
        <GradientMesh />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-16">
          <div className="tinker-rise">
            <span
              className="brand-ring inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold shadow-sm"
              style={{ color: "rgb(var(--accent-deep))" }}
            >
              <span aria-hidden="true">✦</span> The AI tutor that refuses to do it for you
            </span>

            <h1
              className="mt-6 text-[40px] font-bold leading-[1.06] tracking-tight sm:text-[52px] lg:text-[58px]"
              style={{ color: "rgb(var(--ink))" }}
            >
              Learn in the language you think in,{" "}
              <span className="brand-text">through what you already love.</span>
            </h1>

            <p
              className="mt-6 max-w-xl text-[17px] leading-relaxed sm:text-[18.5px]"
              style={{ color: "rgb(var(--ink-soft))" }}
            >
              Tell Tinker what you want to learn and bring your own notes if you have them. It builds
              lessons from <em>your</em> material, explains them through cooking, football or farming,
              and asks the questions that make it actually stick.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => tryIt("hero")} className="btn btn-primary focus-ring w-full sm:w-auto sm:px-9">
                Try it out — free, no account
              </button>
              <button onClick={google} disabled={busy} className="btn btn-ghost focus-ring w-full sm:w-auto">
                <GoogleMark /> {busy ? "Signing in…" : "Log in with Google"}
              </button>
            </div>

            {note && (
              <p className="tinker-pop mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-[13.5px] text-amber-900 ring-1 ring-amber-200">
                {note}
              </p>
            )}

            <dl className="mt-11 grid max-w-lg grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: "rgb(var(--line))" }}>
              {[
                ["5", "languages"],
                ["10", "worlds to learn through"],
                ["0", "answers handed out"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="brand-text text-[26px] font-bold leading-none">{n}</dt>
                  <dd className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "rgb(var(--ink-soft))" }}>
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="tinker-rise lg:justify-self-end" style={{ animationDelay: "120ms" }}>
            <PhonePreview />
          </div>
        </div>
      </section>

      {/* ------------------------ how it works ------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgb(var(--accent))" }}>
            How it works
          </p>
          <h2 className="mt-2.5 text-[28px] font-bold tracking-tight sm:text-[36px]" style={{ color: "rgb(var(--ink))" }}>
            Three steps, about a minute
          </h2>
        </div>

        <div className="stagger mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Tell us how you think", "Your language, and up to three worlds you already know well — cooking, football, farming, music."],
            ["02", "Say what you want to learn", "Any topic. Attach your notes or a chapter if you have them, and we'll teach from those."],
            ["03", "Work it through", "Lessons built for you, and a tutor that asks better questions instead of handing over answers."],
          ].map(([n, title, body]) => (
            <div key={n} className="relative">
              <span className="brand-text text-[38px] font-black leading-none opacity-90">{n}</span>
              <h3 className="mt-3 text-[18px] font-bold" style={{ color: "rgb(var(--ink))" }}>{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------- what makes it different --------------------- */}
      <section
        className="py-16 sm:py-20"
        style={{ background: "linear-gradient(180deg, rgb(var(--canvas)), #fff)" }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2
            className="mx-auto max-w-2xl text-center text-[28px] font-bold tracking-tight sm:text-[36px]"
            style={{ color: "rgb(var(--ink))" }}
          >
            Not another chatbot that does your homework
          </h2>
          <div className="stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              emoji="🌍"
              title="Your language first"
              body="Concepts land in Kiswahili, Hindi, Yoruba or Shona — then we hand you the academic English term as a label for something you already understand."
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
              body="Text-first, light pages, and your progress lives on your device — so a dropped signal never costs you a lesson."
            />
            <Feature
              emoji="🌱"
              title="Progress that means something"
              body="Track what you've genuinely mastered, and watch your region's learning grow alongside your own."
            />
          </div>
        </div>
      </section>

      {/* ---------------------------- closing ---------------------------- */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="brand-gradient relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-14 text-center shadow-xl sm:px-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 60% at 50% 0%, rgb(255 255 255 / 0.22), transparent 70%)" }}
          />
          <div className="relative">
            <h2 className="text-[28px] font-bold leading-tight text-white sm:text-[36px]">
              So — what do you want to learn?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/85">
              About a minute of setup, then it's yours. No card, no account, no waiting.
            </p>
            <button
              onClick={() => tryIt("footer")}
              className="btn focus-ring mt-8 bg-white px-9 shadow-lg"
              style={{ color: "rgb(var(--accent-deep))" }}
            >
              Start learning
            </button>
          </div>
        </div>

        <footer className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-1 text-center">
          <p className="text-[13px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
            Spiritus Agentic Solutions
          </p>
          <p className="text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
            AI, custom-built for African realities
          </p>
        </footer>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GradientMesh() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 42% at 14% 18%, rgb(var(--accent) / 0.20), transparent 68%)," +
            "radial-gradient(46% 44% at 88% 8%, rgb(var(--green) / 0.22), transparent 70%)," +
            "radial-gradient(40% 38% at 62% 74%, rgb(6 160 160 / 0.14), transparent 70%)",
        }}
      />
      {/* Soft blue -> green band that ties the hero to the brand mark. */}
      <div
        className="absolute -top-24 left-1/2 h-64 w-[140%] -translate-x-1/2 opacity-[0.16] blur-3xl"
        style={{ background: "linear-gradient(90deg, rgb(var(--accent)), rgb(6 160 160), rgb(var(--green)))" }}
      />
    </div>
  );
}

function Feature({ emoji, title, body }) {
  return (
    <div className="card card-lift p-5">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-[22px]"
        style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.13), rgb(var(--green) / 0.13))" }}
      >
        {emoji}
      </span>
      <h3 className="mt-4 text-[17px] font-bold" style={{ color: "rgb(var(--ink))" }}>{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>{body}</p>
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

/** Product preview — hand-built rather than a screenshot, so it never goes stale. */
function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <div
        aria-hidden="true"
        className="absolute -inset-7 -z-10 rounded-[3.5rem] opacity-60 blur-3xl"
        style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.45), rgb(var(--green) / 0.45))" }}
      />
      <div className="overflow-hidden rounded-[2.25rem] border-[5px] border-white bg-white shadow-2xl">
        <div className="brand-gradient px-4 py-3.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-white/80">Your plan</p>
          <p className="text-[16px] font-bold text-white">Maize &amp; sunlight</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-1/3 rounded-full bg-white" />
          </div>
        </div>

        <div className="space-y-2.5 p-3.5">
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgb(var(--violet) / 0.09)" }}>
            <p className="text-[10px] font-bold tracking-wide" style={{ color: "rgb(92 62 214)" }}>
              📎 FROM YOUR MATERIAL · 4 PASSAGES
            </p>
          </div>

          <div className="anchor-card !px-3 !py-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.13em]" style={{ color: "rgb(var(--accent))" }}>
              🌾 Because you know farming
            </p>
            <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "rgb(var(--ink))" }}>
              Mahindi yanakua vizuri katika hali ya joto na mwanga, ikiwa kuna mvua ya kutosha.
            </p>
          </div>

          <div
            className="ml-auto w-[82%] rounded-2xl px-3 py-2 text-[11.5px] leading-snug text-white"
            style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-deep)))" }}
          >
            just give me the answer
          </div>

          <div
            className="w-[92%] rounded-2xl px-3 py-2.5 text-[11.5px] leading-snug"
            style={{ background: "rgb(var(--canvas))", color: "rgb(var(--ink))" }}
          >
            Sitakupa jibu — lakini nitakusaidia kulipata. Ni nini kinachotokea kwa mmea bila maji?
          </div>

          <div className="flex gap-1.5 pt-0.5">
            <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold"
              style={{ background: "rgb(var(--accent) / 0.10)", color: "rgb(var(--accent-deep))" }}>
              via farming
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-[9.5px]"
              style={{ background: "rgb(var(--line))", color: "rgb(var(--ink-soft))" }}>
              llama-3.1-70b
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
