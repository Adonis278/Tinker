import { useState, useRef, useEffect } from "react";
import { askTutor } from "../lib/tutor.js";
import { track } from "../firebase.js";

/**
 * OWNER: P1 (the skin) — P2 owns what comes back from askTutor().
 * Bottom sheet chat. The "anchor" and "model" chips are demo gold: they make
 * the invisible AI work visible to a judge. Keep them.
 *
 * Keyboard behaviour: the sheet is sized against the *visual* viewport
 * (dvh + visualViewport listener), so opening the mobile keyboard resizes
 * the sheet instead of jumping it. Input row is safe-area padded.
 */
export default function TutorChat({ lesson, user, misconceptionId, onClose }) {
  const opener = misconceptionId
    ? "I noticed something in your answer. Let's look at it together — no marks lost."
    : "Ask me anything about this lesson. Fair warning: I won't just hand you answers.";

  const [messages, setMessages] = useState([{ role: "assistant", content: opener, meta: null }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  // Keep the sheet inside the visible viewport when the mobile keyboard opens.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (sheetRef.current) {
        sheetRef.current.style.maxHeight = `${Math.round(vv.height * 0.85)}px`;
      }
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

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
        ref={sheetRef}
        className="flex flex-col rounded-t-3xl bg-white shadow-2xl"
        style={{ height: "85dvh", maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/10 text-lg"
          >
            💬
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-brand-navy">Your Tinker tutor</p>
            <p className="text-xs leading-tight text-slate-500">Guides you. Never does it for you.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-3 text-[15px] leading-relaxed ${
                      isUser
                        ? "rounded-2xl rounded-br-md bg-brand-navy text-white"
                        : "rounded-2xl rounded-bl-md bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.meta?.anchorUsed && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-blue">
                        via {m.meta.anchorUsed}
                      </span>
                      {m.meta.modelUsed && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                          {m.meta.modelUsed}
                        </span>
                      )}
                      {m.meta.translated && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                          translated
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3.5">
                <span className="tinker-dot" />
                <span className="tinker-dot" style={{ animationDelay: "0.15s" }} />
                <span className="tinker-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div
          className="flex items-end gap-2 border-t border-slate-100 px-3 pt-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <input
            className="min-h-[44px] flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-[15px] focus:border-brand-blue focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type what you're thinking…"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
