import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUser } from "../lib/store.js";
import { ingestMaterial, generateCourse, saveSession } from "../lib/study.js";
import { INTEREST_DOMAINS } from "../data/interests.js";
import { track } from "../firebase.js";

const SUGGESTIONS = [
  "Photosynthesis",
  "Solving for x",
  "Compound interest",
  "How rainfall affects crop yield",
  "Python loops",
  "Supply and demand",
];

const ACCEPTED = ".txt,.md,.markdown,.csv";

export default function Learn() {
  const nav = useNavigate();
  const user = getUser();
  const fileRef = useRef(null);

  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [showMaterial, setShowMaterial] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | ingesting | planning | error
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span aria-hidden="true" className="text-4xl">🌱</span>
        <p className="text-base font-bold" style={{ color: "rgb(var(--ink))" }}>First, tell us how you think</p>
        <p className="max-w-[270px] text-sm leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
          Your language and the things you already know shape every lesson we write.
        </p>
        <Link to="/onboarding" className="btn btn-primary mt-2">Start in 60 seconds</Link>
      </div>
    );
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMaterial(text);
    setMaterialName(file.name);
    setShowMaterial(true);
  }

  async function start() {
    if (!topic.trim()) return;
    setError(null);

    let sourceId = null;
    const learner = {
      nativeLanguage: user.nativeLanguage,
      interests: user.interests,
      ageBand: user.ageBand,
      goal: user.goal,
      level: user.level,
      otherInterest: user.otherInterest,
    };

    if (material.trim().length >= 80) {
      setPhase("ingesting");
      const ing = await ingestMaterial({ text: material, title: materialName || topic });
      if (!ing.ok) {
        setPhase("error");
        setError(ing.message ?? "Could not read that material.");
        return;
      }
      sourceId = ing.sourceId;
      setDetail({ chunkCount: ing.chunkCount, embedModel: ing.embedModel });
      track("material_ingested", { chunks: ing.chunkCount });
    }

    setPhase("planning");
    const course = await generateCourse({ topic: topic.trim(), learner, sourceId });
    if (!course.ok) {
      setPhase("error");
      setError(course.message ?? "Could not build a plan. Try rewording the topic.");
      return;
    }

    saveSession({
      topic: topic.trim(),
      sourceId,
      materialName: materialName || null,
      chunkCount: detail?.chunkCount ?? null,
      courseTitle: course.courseTitle,
      lessons: course.lessons,
      sources: course.sources ?? [],
      grounded: course.grounded,
      modelUsed: course.modelUsed,
      startedAt: Date.now(),
    });
    track("course_generated", { topic: topic.trim(), grounded: Boolean(sourceId) });
    nav("/study");
  }

  const busy = phase === "ingesting" || phase === "planning";
  if (busy) return <Building phase={phase} topic={topic} detail={detail} />;

  return (
    <div className="aurora px-5 pb-28 pt-8">
      <header className="tinker-rise">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgb(var(--accent))" }}>
          Your session
        </p>
        <h1 className="mt-1 text-[30px] font-bold leading-[1.15]" style={{ color: "rgb(var(--ink))" }}>
          What do you want<br />to learn?
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
          Anything. We'll build it around {readableInterests(user.interests)} — in your language.
        </p>
      </header>

      <div className="tinker-rise mt-6" style={{ animationDelay: "80ms" }}>
        <textarea
          className="field min-h-[92px] resize-none leading-relaxed"
          placeholder="e.g. why plants need sunlight, or solving equations with two steps…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="tinker-rise mt-3 flex flex-wrap gap-2" style={{ animationDelay: "140ms" }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => setTopic(s)} className={`chip focus-ring ${topic === s ? "chip-on" : ""}`}>
            {s}
          </button>
        ))}
      </div>

      {/* ---- optional material ---- */}
      <section className="tinker-rise mt-7" style={{ animationDelay: "200ms" }}>
        {!showMaterial ? (
          <button onClick={() => setShowMaterial(true)} className="card card-lift focus-ring flex w-full items-center gap-3 p-4 text-left">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: "rgb(var(--violet) / 0.10)" }}>📎</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold" style={{ color: "rgb(var(--ink))" }}>
                Add your own material
              </span>
              <span className="block text-[13px]" style={{ color: "rgb(var(--ink-soft))" }}>
                Notes, a chapter, a handout — we'll teach from it
              </span>
            </span>
            <span aria-hidden="true" className="ml-auto text-slate-300">＋</span>
          </button>
        ) : (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold" style={{ color: "rgb(var(--ink))" }}>Your material</p>
              <button
                onClick={() => { setShowMaterial(false); setMaterial(""); setMaterialName(""); }}
                className="focus-ring text-[13px]" style={{ color: "rgb(var(--ink-soft))" }}
              >
                Remove
              </button>
            </div>

            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
              Everything the tutor says will be grounded in this — and it will show you which passage it used.
            </p>

            <textarea
              className="field mt-3 min-h-[130px] resize-y text-[14px] leading-relaxed"
              placeholder="Paste your notes or a chapter here…"
              value={material}
              onChange={(e) => { setMaterial(e.target.value); setMaterialName(""); }}
            />

            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="chip focus-ring">
                📄 Upload a file
              </button>
              <input ref={fileRef} type="file" accept={ACCEPTED} onChange={onFile} className="hidden" />
              <span className="text-[12px]" style={{ color: "rgb(var(--ink-soft))" }}>
                {materialName
                  ? materialName
                  : material.trim().length >= 80
                    ? `${material.trim().length.toLocaleString()} characters ready`
                    : ".txt or .md"}
              </span>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p className="tinker-pop mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900 ring-1 ring-amber-200">
          {error}
        </p>
      )}

      {/* ---- sticky action ---- */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-white/90 p-4 backdrop-blur"
        style={{ borderColor: "rgb(var(--line))" }}>
        <button onClick={start} disabled={!topic.trim()} className="btn btn-primary focus-ring w-full">
          {material.trim().length >= 80 ? "Build my lessons from this" : "Build my lessons"}
        </button>
      </div>
    </div>
  );
}

function readableInterests(list = []) {
  const labels = list
    .map((id) => INTEREST_DOMAINS.find((d) => d.id === id)?.label?.toLowerCase())
    .filter(Boolean);
  if (!labels.length) return "what you already know";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/* Progress view — the two phases are genuinely different work, so we name them. */
function Building({ phase, topic, detail }) {
  const steps = [
    { key: "ingesting", label: "Reading your material", done: phase !== "ingesting" },
    { key: "planning", label: "Writing lessons for you", done: false },
  ];
  return (
    <div className="aurora flex min-h-[70vh] flex-col justify-center px-6">
      <div className="tinker-rise">
        <div className="flex items-center gap-2">
          <span className="tinker-dot" />
          <span className="tinker-dot" style={{ animationDelay: "150ms" }} />
          <span className="tinker-dot" style={{ animationDelay: "300ms" }} />
        </div>
        <h1 className="mt-5 text-[26px] font-bold leading-tight" style={{ color: "rgb(var(--ink))" }}>
          {phase === "ingesting" ? "Reading what you gave us" : "Writing your lessons"}
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "rgb(var(--ink-soft))" }}>{topic}</p>

        <ul className="mt-7 space-y-3">
          {steps.map((s) => {
            const active = s.key === phase;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${active ? "text-white" : ""}`}
                  style={{
                    background: s.done ? "rgb(16 185 129)" : active ? "rgb(var(--accent))" : "rgb(var(--line))",
                    color: s.done ? "#fff" : active ? "#fff" : "rgb(var(--ink-soft))",
                  }}
                >
                  {s.done ? "✓" : active ? "•" : ""}
                </span>
                <span className={`text-[15px] ${active ? "font-semibold" : ""}`}
                  style={{ color: active ? "rgb(var(--ink))" : "rgb(var(--ink-soft))" }}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>

        {detail?.chunkCount != null && (
          <p className="tinker-pop mt-6 text-[13px]" style={{ color: "rgb(var(--ink-soft))" }}>
            Indexed <strong>{detail.chunkCount} passages</strong> from your material
            {detail.embedModel ? ` · ${detail.embedModel.split("/").pop()}` : ""}
          </p>
        )}

        <p className="mt-6 text-[13px] leading-relaxed" style={{ color: "rgb(var(--ink-soft))" }}>
          This takes a few seconds — we're writing a plan specific to you, not loading a template.
        </p>
      </div>
    </div>
  );
}
