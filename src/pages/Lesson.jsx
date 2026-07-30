import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import lessons from "../data/lessons.sample.json";
import { INTEREST_DOMAINS } from "../data/interests.js";
import { getUser, saveUser, saveProgress } from "../lib/store.js";
import { awardQuiz, scheduleReview } from "../lib/gamification.js";
import { track } from "../firebase.js";
import TutorChat from "../components/TutorChat.jsx";

/**
 * OWNER: P1.
 * Renders a lesson, swaps in the learner's interest anchor, runs the quiz,
 * and opens the tutor on a wrong answer. Working skeleton — style it up.
 */
export default function Lesson() {
  const { lessonId } = useParams();
  const user = getUser();
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [activeMisconception, setActiveMisconception] = useState(null);
  // Tone-critical: the banner must key off whether they were right, NOT off
  // whether a misconception id happened to be mapped. A wrong answer with no
  // mapping must never render the celebratory state.
  const [allCorrect, setAllCorrect] = useState(false);

  // Analytics owned by P4 — the taxonomy lives in src/firebase.js.
  useEffect(() => {
    if (!user) return;
    const anchor = user.interests?.find((i) => lesson.anchorPrompts[i]) ?? "cooking";
    track("lesson_start", { lessonId: lesson.id });
    track("anchor_used", { lessonId: lesson.id, anchor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  if (!user)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span aria-hidden="true" className="text-4xl">🌱</span>
        <p className="text-base font-bold text-brand-navy">Your journey starts here</p>
        <p className="max-w-[260px] text-sm leading-relaxed text-slate-500">
          Tell us your language and your world — then this lesson is written for you.
        </p>
        <Link
          to="/onboarding"
          className="mt-2 flex min-h-[44px] items-center rounded-full bg-brand-blue px-5 text-sm font-bold text-white active:scale-95"
        >
          Start in 60 seconds
        </Link>
      </div>
    );

  // THE FEATURE: the same lesson, told in the learner's own world.
  const anchorId = user.interests?.find((i) => lesson.anchorPrompts[i]) ?? "cooking";
  const anchorText = lesson.anchorPrompts[anchorId] ?? Object.values(lesson.anchorPrompts)[0];
  const anchorDomain = INTEREST_DOMAINS.find((d) => d.id === anchorId);
  const anchorEmoji = anchorDomain?.emoji ?? "✨";
  const anchorLabel = anchorDomain?.label?.toLowerCase() ?? anchorId;

  function submit() {
    const correct = lesson.quiz.filter((q) => answers[q.id] === q.answerIdx).length;
    const wrong = lesson.quiz.find((q) => answers[q.id] !== undefined && answers[q.id] !== q.answerIdx);
    const missed = wrong ? wrong.misconceptionMap[String(answers[wrong.id])] : null;

    const xp = awardQuiz({ correctCount: correct, total: lesson.quiz.length });
    saveUser({ xp: (user.xp ?? 0) + xp });
    saveProgress(lesson.id, {
      status: "complete",
      quizScore: correct / lesson.quiz.length,
      misconceptionsHit: missed ? [missed] : [],
      reviewDueAt: missed ? scheduleReview() : null,
      completedAt: Date.now(),
    });

    track("quiz_submit", { lessonId: lesson.id, score: correct / lesson.quiz.length, misconception: missed });
    track("lesson_complete", { lessonId: lesson.id, score: correct / lesson.quiz.length, xpAwarded: xp });
    setSubmitted(true);
    setAllCorrect(correct === lesson.quiz.length);
    if (missed) {
      setActiveMisconception(missed);
      setTutorOpen(true);
      track("misconception_detected", { misconception: missed });
    }
  }

  return (
    <div className="p-5 pb-24">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Lesson {lesson.order}</p>
      <h1 className="text-2xl font-bold text-brand-navy">{lesson.title}</h1>

      <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
        {renderBodyMd(lesson.bodyMd)}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-navy/5 px-4 py-4">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 rounded-full bg-gradient-to-b from-brand-blue to-brand-navy"
        />
        <div className="flex items-start gap-3 pl-2">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-brand-blue/20"
          >
            {anchorEmoji}
          </span>
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue">
              Because you know {anchorLabel}
            </p>
            <p className="text-[15px] leading-relaxed text-brand-navy">{anchorText}</p>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-brand-navy">Check yourself</h2>
      {lesson.quiz.map((q) => (
        <div key={q.id} className="mt-4">
          <p className="font-medium">{q.prompt}</p>
          <div className="mt-2 space-y-2">
            {q.options.map((opt, i) => {
              const chosen = answers[q.id] === i;
              const isRight = submitted && i === q.answerIdx;
              const isMissedPick = submitted && chosen && i !== q.answerIdx;
              return (
                <button
                  key={i}
                  role="button"
                  aria-disabled={submitted}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: i })}
                  className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border-2 px-6 py-3 text-left text-[15px] transition-all duration-200 ${
                    isRight
                      ? "border-emerald-400 bg-emerald-50 font-medium text-emerald-900"
                      : isMissedPick
                        ? "border-amber-400 bg-amber-50 font-medium text-amber-900"
                        : submitted
                          ? "border-slate-100 text-slate-400"
                          : chosen
                            ? "border-brand-blue bg-brand-blue/10 font-medium text-brand-navy"
                            : "border-slate-200 active:scale-[0.98]"
                  }`}
                >
                  <span>{opt}</span>
                  {isRight && <span aria-hidden="true" className="shrink-0 text-lg">✓</span>}
                  {isMissedPick && <span aria-hidden="true" className="shrink-0 text-lg">🤔</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {submitted &&
        (allCorrect ? (
          <div className="tinker-pop mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-200">
            <span aria-hidden="true" className="text-xl">🎉</span>
            <p className="text-[15px] leading-snug text-emerald-900">
              <span className="font-bold">You've got it.</span> That's exactly the idea.
            </p>
          </div>
        ) : (
          <div className="tinker-pop mt-5 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-xl">💡</span>
              <p className="text-[15px] leading-snug text-amber-900">
                <span className="font-bold">Not yet — but you're close.</span>{" "}
                {activeMisconception
                  ? "Your tutor spotted exactly where the thinking slipped. Talk it through — no marks lost."
                  : "Let's walk through it together — no marks lost."}
              </p>
            </div>
          </div>
        ))}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < lesson.quiz.length}
          className="mt-6 min-h-[48px] w-full rounded-xl bg-brand-blue py-3 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Check my thinking
        </button>
      ) : (
        <button
          onClick={() => setTutorOpen(true)}
          className="mt-4 min-h-[48px] w-full rounded-xl border-2 border-brand-blue/30 py-3 font-semibold text-brand-navy transition-transform active:scale-[0.98]"
        >
          Talk it through with your tutor
        </button>
      )}

      {tutorOpen && (
        <TutorChat
          lesson={lesson}
          user={user}
          misconceptionId={activeMisconception}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * bodyMd is markdown, but we only ever need the two inline marks P3 actually
 * writes: **bold** for equations and *emphasis* for stressed words. Previously
 * ** was stripped (equations rendered flat) and single * leaked through as
 * literal asterisks on screen. Not a markdown parser — deliberately narrow.
 * Plain segments stay strings so the parent's whitespace-pre-line still works.
 */
function renderBodyMd(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-brand-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}
