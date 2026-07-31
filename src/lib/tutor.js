/**
 * OWNER: P2 (AI Engineering).
 *
 * The ONLY place the frontend talks to the tutor. P1 imports askTutor() and
 * never calls fetch() directly — that way P2 can change the backend freely.
 *
 * Request/response shapes are frozen in docs/ARCHITECTURE.md §4.
 */

import { MOCK_TUTOR } from "./env.js";

const USE_MOCKS = MOCK_TUTOR;
const ENDPOINT = import.meta.env.VITE_TUTOR_ENDPOINT;

/**
 * @returns {Promise<{reply,anchorUsed,misconceptionDetected,hintLevel,modelUsed,translated,latencyMs}>}
 */
export async function askTutor({ uid, lessonId, conceptId, message, history = [], learner, context, sourceId = null }) {
  if (USE_MOCKS) return mockTutor({ message, learner, context, history });

  const started = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        lessonId,
        conceptId,
        message,
        history: history.slice(-6),
        learner,
        context,
        // When present the backend retrieves from the learner's own material
        // and returns the passages it actually used.
        sourceId,
      }),
    });
    return await res.json();
  } catch (err) {
    // The UI must never show a broken state. Fall back to a safe nudge.
    return {
      reply: "Let's slow down a step. In your own words, what is the question actually asking you to find?",
      anchorUsed: null,
      misconceptionDetected: null,
      hintLevel: 0,
      modelUsed: null,
      translated: false,
      latencyMs: Date.now() - started,
      error: String(err),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Mock tutor — realistic enough to build the whole UI against, and    */
/* doubles as the demo-day safety net. DO NOT DELETE.                  */
/* ------------------------------------------------------------------ */

const ANCHOR_LINES = {
  cooking:
    "Think about doubling a jollof recipe. If 2 cups of rice feeds 4 people, you didn't guess — you scaled both sides by the same amount. What would you have to do to BOTH sides of this equation to keep it balanced?",
  football:
    "Picture a striker's stats. If he scores 12 goals in 3 seasons and you want his average per season, you're undoing a multiplication. Which operation undoes the one you see here?",
  music:
    "A beat stays in time because every bar gets the same count. An equation is the same — both sides must stay equal. So if you take 5 away from the left, what has to happen on the right?",
  fiction:
    "Every story has an unknown the reader is chasing — who did it. Here, x is your unknown. What's the first clue the equation gives you about it?",
  farming:
    "If 3 bags of seed cover a field and you need to know what one bag covers, you divide. What would dividing do to this equation?",
  trading:
    "If you buy 4 crates for 2000 naira, working out one crate's price means undoing a multiplication. What's the reverse of multiplying by 4?",
  gaming:
    "Think of x as hidden HP. The equation is your damage log. What does the log tell you has already happened to it?",
  fashion:
    "Scaling a pattern up two sizes means changing every measurement by the same factor — not just one. What does that tell you about changing one side of an equation?",
  cars: "An engine's power-to-weight is a ratio. Change one side and the ratio breaks. What must you do to keep this equation's balance?",
  faith: "A fair exchange gives the same to both sides. What does fairness require you to do here?",
};

const REFUSALS = [
  "I could hand you the number, but then it's my answer and not yours. Let's get you there — what's the very first thing you'd try?",
  "I'm not going to give you that one. I will get you to it though. What does the equals sign promise you about both sides?",
  "Nope, that's the one thing I don't do. Talk me through where you got stuck instead.",
];

const ASKING_FOR_ANSWER = /\b(answer|solve it|just tell|give me|what is x|whats x|do it for me)\b/i;

async function mockTutor({ message, learner, context, history }) {
  await new Promise((r) => setTimeout(r, 550 + Math.random() * 500));

  const anchor = learner?.interests?.[0] ?? "cooking";
  const hintLevel = Math.min(3, history.filter((h) => h.role === "user").length);

  if (ASKING_FOR_ANSWER.test(message)) {
    return {
      reply: REFUSALS[Math.floor(Math.random() * REFUSALS.length)],
      anchorUsed: null,
      misconceptionDetected: null,
      hintLevel,
      modelUsed: "mock",
      translated: false,
      latencyMs: 600,
    };
  }

  const misconception = context?.misconceptions?.[0]?.id ?? null;
  return {
    reply: ANCHOR_LINES[anchor] ?? ANCHOR_LINES.cooking,
    anchorUsed: anchor,
    misconceptionDetected: hintLevel >= 1 ? misconception : null,
    hintLevel,
    modelUsed: "mock",
    translated: false,
    latencyMs: 600,
  };
}
