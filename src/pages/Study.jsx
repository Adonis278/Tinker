import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../lib/study.js";
import { getUser } from "../lib/store.js";
import { INTEREST_DOMAINS } from "../data/interests.js";
import { track } from "../firebase.js";
import StudyTutor from "../components/StudyTutor.jsx";

/**
 * The learning workspace: the plan we generated, grounded in the learner's own
 * material, with the tutor one tap away from any lesson.
 */
export default function Study() {
  const nav = useNavigate();
  const session = getSession();
  const user = getUser();

  const [openId, setOpenId] = useState(null);
  const [done, setDone] = useState(() => new Set());
  const [tutorFor, setTutorFor] = useState(null);
  const [showSources, setShowSources] = useState(false);

  if (!session?.lessons?.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span aria-hidden="true" className="text-4xl">📚</span>
        <p className="text-base font-bold" style={{ color: "rgb(var(--ink))" }}>No session yet</p>
        <p className="max-w-[260px] text-sm" style={{ color: "rgb(var(--ink-soft))" }}>
          Tell us what you want to learn and we'll build it.
        </p>
        <Link to="/learn" className="btn btn-primary mt-2">Start learning</Link>
      </div>
    );
  }

  const anchorDomain = INTEREST_DOMAINS.find((d) => d.id === (user?.interests?.[0] ?? "cooking"));
  const pct = Math.round((done.size / session.lessons.length) * 100);

  function toggleDone(id) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (!prev.has(id)) track("lesson_complete", { lessonId: id, generated: true });
      return next;
    });
  }

  return (
    <div className="aurora px-5 pb-28 pt-7">
      {/* ---------- header ---------- */}
      <header className="tinker-rise">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgb(var(--accent))" }}>
              Your plan
            </p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
              {session.courseTitle}
            </h1>
          </div>
          <button
            onClick={() => { clearSession(); nav("/learn"); }}
            className="chip focus-ring shrink-0"
            title="Start a different topic"
          >
            New
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="rail flex-1"><i style={{ width: `${pct}%` }} /></div>
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "rgb(var(--ink-soft))" }}>
            {done.size}/{session.lessons.length}
          </span>
        </div>
      </header>

      {/* ---------- grounding banner: the RAG made visible ---------- */}
      {session.grounded && (
        <button
          onClick={() => setShowSources((v) => !v)}
          className="card card-lift focus-ring tinker-rise mt-5 flex w-full items-center gap-3 p-3.5 text-left"
          style={{ animationDelay: "60ms" }}
        >
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ background: "rgb(var(--violet) / 0.10)" }}>🔎</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
              Built from your material
            </span>
            <span className="block text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
              {session.sources?.length ?? 0} passages retrieved{session.materialName ? ` from ${session.materialName}` : ""}
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-300">{showSources ? "▴" : "▾"}</span>
        </button>
      )}

      {showSources && (
        <div className="tinker-pop mt-2 space-y-2">
          {(session.sources ?? []).map((s) => (
            <div key={s.n} className="card p-3">
              <div className="flex items-center gap-2">
                <span className="source-pill">passage {s.n}</span>
                <span className="text-[11px] tabular-nums" style={{ color: "rgb(var(--ink-soft))" }}>
                  match {s.score}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>{s.text}…</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------- lessons ---------- */}
      <ol className="stagger mt-6 space-y-3">
        {session.lessons.map((l) => {
          const open = openId === l.id;
          const complete = done.has(l.id);
          return (
            <li key={l.id} className="card overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : l.id)}
                className="focus-ring flex w-full items-start gap-3 p-4 text-left"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                  style={{
                    background: complete ? "rgb(16 185 129)" : "rgb(var(--accent) / 0.10)",
                    color: complete ? "#fff" : "rgb(var(--accent-deep))",
                  }}
                >
                  {complete ? "✓" : l.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold leading-snug" style={{ color: "rgb(var(--ink))" }}>
                    {l.title}
                  </span>
                  <span className="mt-0.5 block text-[13.5px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
                    {l.summary}
                  </span>
                </span>
                <span aria-hidden="true" className="mt-1 shrink-0 text-slate-300">{open ? "▴" : "▾"}</span>
              </button>

              {open && (
                <div className="tinker-pop border-t px-4 pb-4 pt-4" style={{ borderColor: "rgb(var(--line))" }}>
                  {l.anchor && (
                    <div className="anchor-card">
                      <div className="flex items-start gap-3">
                        <span aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                          {anchorDomain?.emoji ?? "✨"}
                        </span>
                        <div className="min-w-0">
                          <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                            style={{ color: "rgb(var(--accent))" }}>
                            Because you know {anchorDomain?.label?.toLowerCase() ?? "this"}
                          </p>
                          <p className="text-[14.5px] leading-relaxed" style={{ color: "rgb(var(--ink))" }}>{l.anchor}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {l.citations?.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11.5px]" style={{ color: "rgb(var(--ink-soft))" }}>from</span>
                      {l.citations.map((c) => (
                        <span key={c} className="source-pill">passage {c}</span>
                      ))}
                    </div>
                  )}

                  {l.check && (
                    <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgb(var(--canvas))" }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgb(var(--ink-soft))" }}>
                        Check yourself
                      </p>
                      <p className="mt-1 text-[14.5px] leading-relaxed" style={{ color: "rgb(var(--ink))" }}>{l.check}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setTutorFor(l)} className="btn btn-primary focus-ring flex-1 text-[14px]">
                      💬 Work it through
                    </button>
                    <button onClick={() => toggleDone(l.id)} className="btn btn-ghost focus-ring px-4 text-[14px]">
                      {complete ? "Undo" : "Got it"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {pct === 100 && (
        <div className="tinker-pop mt-6 rounded-2xl px-4 py-4 text-center"
          style={{ background: "rgb(16 185 129 / 0.10)", border: "1px solid rgb(16 185 129 / 0.25)" }}>
          <p className="text-[15px] font-bold text-emerald-800">You worked through all of it.</p>
          <Link to="/learn" className="btn btn-ghost focus-ring mt-3 text-[14px]">Learn something else</Link>
        </div>
      )}

      {tutorFor && (
        <StudyTutor
          lesson={tutorFor}
          user={user}
          session={session}
          onClose={() => setTutorFor(null)}
        />
      )}
    </div>
  );
}
