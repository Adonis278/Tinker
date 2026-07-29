import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import lessons from "../data/lessons.sample.json";
import { INTEREST_DOMAINS } from "../data/interests.js";
import { getUser, saveUser, saveProgress } from "../lib/store.js";
import { awardQuiz, scheduleReview } from "../lib/gamification.js";
import { track } from "../firebase.js";

export default function Lesson() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {}, [lesson.id]);

  if (!user)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span aria-hidden="true" className="text-4xl">🌱</span>
        <p className="text-base font-bold text-brand-navy">Your journey starts here</p>
        <p className="max-w-[260px] text-sm leading-relaxed text-slate-500">
          Tell us your language and your world — then this lesson is written for you.
        </p>
        <a
          href="/onboarding"
          className="mt-2 flex min-h-[44px] items-center rounded-full bg-brand-blue px-5 text-sm font-bold text-white active:scale-95"
        >
          Start in 60 seconds
        </a>
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
  }

  return (
    <div>
      {lesson.bodyMd.replace(/\*\*/g, "")}

      <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-navy/5 px-4 py-4">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 rounded-full bg-gradient-to-b from-brand-blue to-brand-navy"
        />
        <div className="flex items-start gap-3 pl-2">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-brand-blue/20"
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
        <div key={q.id} className="mt-3">
          {q.options.map((opt, i) => {
            const chosen = answers[q.id] === i;
            const isMissedPick = submitted && chosen && i !== q.answerIdx;
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => setAnswers({ ...answers, [q.id]: i })}
                className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-all duration-200 ${
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
      ))}

      {submitted &&
        (activeMisconception ? (
          <div className="tinker-pop mt-5 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-xl">💡</span>
              <p className="text-[15px] leading-snug text-amber-900">
                <span className="font-bold">Not yet — but you're close.</span> Your tutor spotted
                exactly where the thinking slipped. Talk it through — no marks lost.
              </p>
            </div>
          </div>
        ) : (
          <div className="tinker-pop mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-200">
            <span aria-hidden="true" className="text-xl">🎉</span>
            <p className="text-[15px] leading-snug text-emerald-900">
              <span className="font-bold">You've got it.</span> That's exactly the idea.
            </p>
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
    </div>
  );
}
