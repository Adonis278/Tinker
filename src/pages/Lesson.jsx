import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import lessons from "../data/lessons.sample.json";
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

  // Analytics owned by P4 — the taxonomy lives in src/firebase.js.
  useEffect(() => {
    if (!user) return;
    const anchor = user.interests?.find((i) => lesson.anchorPrompts[i]) ?? "cooking";
    track("lesson_start", { lessonId: lesson.id });
    track("anchor_used", { lessonId: lesson.id, anchor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  if (!user) return <div className="p-5">Please complete onboarding first.</div>;

  // THE FEATURE: the same lesson, told in the learner's own world.
  const anchorId = user.interests?.find((i) => lesson.anchorPrompts[i]) ?? "cooking";
  const anchorText = lesson.anchorPrompts[anchorId] ?? Object.values(lesson.anchorPrompts)[0];

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
        {lesson.bodyMd.replace(/\*\*/g, "")}
      </div>

      <div className="mt-5 rounded-xl border-l-4 border-brand-blue bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
          Because you know {anchorId}
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-800">{anchorText}</p>
      </div>

      <h2 className="mt-8 text-lg font-bold text-brand-navy">Check yourself</h2>
      {lesson.quiz.map((q) => (
        <div key={q.id} className="mt-4">
          <p className="font-medium">{q.prompt}</p>
          <div className="mt-2 space-y-2">
            {q.options.map((opt, i) => {
              const chosen = answers[q.id] === i;
              const isRight = submitted && i === q.answerIdx;
              const isWrongPick = submitted && chosen && i !== q.answerIdx;
              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: i })}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    isRight
                      ? "border-green-500 bg-green-50"
                      : isWrongPick
                        ? "border-red-400 bg-red-50"
                        : chosen
                          ? "border-brand-blue bg-blue-50"
                          : ""
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < lesson.quiz.length}
          className="mt-6 w-full rounded-lg bg-brand-blue py-3 font-semibold text-white disabled:opacity-40"
        >
          Submit
        </button>
      ) : (
        <button onClick={() => setTutorOpen(true)} className="mt-6 w-full rounded-lg border py-3 font-semibold">
          Ask the tutor
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
