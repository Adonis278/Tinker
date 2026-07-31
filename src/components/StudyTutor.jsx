import { useState, useRef, useEffect } from "react";
import { askTutor } from "../lib/tutor.js";
import { track } from "../firebase.js";

/**
 * Tutor for a generated lesson. Same Socratic contract as TutorChat, but it
 * carries the session's sourceId so answers are retrieved from the learner's
 * own material — and it shows which passages were used, which is the whole
 * point of doing real retrieval rather than improvising.
 */
export default function StudyTutor({ lesson, user, session, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: lesson.check || "What part of this is least clear?", meta: null },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    track("tutor_message", { lessonId: lesson.id, grounded: Boolean(session.sourceId) });

    const res = await askTutor({
      uid: user?.uid ?? "local",
      lessonId: lesson.id,
      conceptId: lesson.id,
      message: msg,
      history,
      learner: {
        nativeLanguage: user?.nativeLanguage,
        interests: user?.interests,
        ageBand: user?.ageBand,
      },
      context: {
        lessonTitle: lesson.title,
        conceptSummary: lesson.summary,
        misconceptions: [],
      },
      sourceId: session.sourceId ?? null,
    });

    setMessages((m) => [...m, { role: "assistant", content: res.reply, meta: res }]);
    setBusy(false);
  }

  const QUICK = ["I don't understand", "Give me a hint", "Show me an example"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex h-[86vh] flex-col rounded-t-3xl bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Tutor"
      >
        {/* grab handle */}
        <div className="flex justify-center pt-2.5">
          <span aria-hidden="true" className="h-1 w-10 rounded-full" style={{ background: "rgb(var(--line))" }} />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold" style={{ color: "rgb(var(--ink))" }}>{lesson.title}</p>
            <p className="text-[12.5px]" style={{ color: "rgb(var(--ink-soft))" }}>
              Guides you. Never does it for you.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close chat"
            className="focus-ring -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ color: "rgb(var(--ink-soft))" }}>
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto px-5 pb-2">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className="max-w-[86%]">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                    m.role === "user" ? "text-white" : ""
                  }`}
                  style={
                    m.role === "user"
                      ? { backgroundImage: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-deep)))" }
                      : { background: "rgb(var(--canvas))", color: "rgb(var(--ink))" }
                  }
                >
                  {m.content}
                </div>

                {m.meta && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {m.meta.anchorUsed && (
                      <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                        style={{ background: "rgb(var(--accent) / 0.10)", color: "rgb(var(--accent-deep))" }}>
                        via {m.meta.anchorUsed}
                      </span>
                    )}
                    {m.meta.translated && (
                      <span className="rounded-md px-1.5 py-0.5 text-[10.5px]"
                        style={{ background: "rgb(var(--line))", color: "rgb(var(--ink-soft))" }}>
                        translated
                      </span>
                    )}
                    {m.meta.modelUsed && (
                      <span className="rounded-md px-1.5 py-0.5 text-[10.5px]"
                        style={{ background: "rgb(var(--line))", color: "rgb(var(--ink-soft))" }}>
                        {m.meta.modelUsed.split("/").pop()}
                      </span>
                    )}
                  </div>
                )}

                {/* Retrieved passages — proof the answer came from their material. */}
                {m.meta?.sources?.length > 0 && (
                  <details className="mt-2 rounded-xl px-3 py-2" style={{ background: "rgb(var(--violet) / 0.06)" }}>
                    <summary className="cursor-pointer list-none text-[11.5px] font-semibold"
                      style={{ color: "rgb(92 62 214)" }}>
                      📎 From your material · {m.meta.sources.length} passage
                      {m.meta.sources.length > 1 ? "s" : ""}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {m.meta.sources.map((s) => (
                        <div key={s.n}>
                          <span className="text-[10.5px] tabular-nums" style={{ color: "rgb(var(--ink-soft))" }}>
                            match {s.score}
                          </span>
                          <p className="text-[12.5px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
                            {s.text}…
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-1.5 px-1">
              <span className="tinker-dot" />
              <span className="tinker-dot" style={{ animationDelay: "150ms" }} />
              <span className="tinker-dot" style={{ animationDelay: "300ms" }} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {!busy && messages.length <= 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 pb-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="chip focus-ring shrink-0">{q}</button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t p-3.5" style={{ borderColor: "rgb(var(--line))" }}>
          <input
            ref={inputRef}
            className="field flex-1 rounded-full py-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type what you're thinking…"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="btn btn-primary focus-ring h-12 w-12 shrink-0 rounded-full px-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
