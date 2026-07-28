import { useState, useRef, useEffect } from "react";
import { askTutor } from "../lib/tutor.js";
import { track } from "../firebase.js";

/**
 * OWNER: P1 (the skin) — P2 owns what comes back from askTutor().
 * Bottom sheet chat. The "anchor" and "model" chips are demo gold: they make
 * the invisible AI work visible to a judge. Keep them.
 */
export default function TutorChat({ lesson, user, misconceptionId, onClose }) {
  const opener = misconceptionId
    ? "I noticed something in your answer. Let's look at it together — no marks lost."
    : "Ask me anything about this lesson. Fair warning: I won't just hand you answers.";

  const [messages, setMessages] = useState([{ role: "assistant", content: opener, meta: null }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    track("tutor_message", { lessonId: lesson.id });

    const res = await askTutor({
      uid: user.uid ?? "local",
      lessonId: lesson.id,
      conceptId: lesson.conceptId,
      message: text,
      history,
      learner: {
        nativeLanguage: user.nativeLanguage,
        interests: user.interests,
        ageBand: user.ageBand,
      },
      context: {
        lessonTitle: lesson.title,
        conceptSummary: lesson.conceptSummary,
        misconceptions: lesson.misconceptions,
      },
    });

    setMessages((m) => [...m, { role: "assistant", content: res.reply, meta: res }]);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-[80vh] flex-col rounded-t-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-bold text-brand-navy">Your Tinker tutor</p>
            <p className="text-xs text-slate-500">Guides you. Never does it for you.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-[15px] ${
                  m.role === "user" ? "bg-brand-blue text-white" : "bg-slate-100"
                }`}
              >
                {m.content}
              </div>
              {m.meta?.anchorUsed && (
                <div className="mt-1 flex gap-1 text-[10px] text-slate-400">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-brand-blue">
                    via {m.meta.anchorUsed}
                  </span>
                  {m.meta.modelUsed && <span className="rounded bg-slate-100 px-1.5 py-0.5">{m.meta.modelUsed}</span>}
                  {m.meta.translated && <span className="rounded bg-slate-100 px-1.5 py-0.5">translated</span>}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="text-sm text-slate-400">thinking…</div>}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t p-3">
          <input
            className="flex-1 rounded-full border px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type what you're thinking…"
          />
          <button onClick={send} disabled={busy} className="rounded-full bg-brand-blue px-5 font-semibold text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
