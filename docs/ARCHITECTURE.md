# Tinker — Architecture & Contracts

**This file is the single source of truth for how the four workstreams connect.**
Everything in here is FROZEN after the kickoff meeting. If you need to change something in
this file, say so in the group chat first — changing it silently breaks someone else's work.

---

## 1. The rule that makes 4 people work in parallel

Every person owns **files**, not features. You only edit files in your own column.

| Owner | Owns these paths | Never edits |
|---|---|---|
| **P1 — Frontend/UX** | `src/pages/`, `src/components/`, `src/index.css` | `functions/`, `src/data/`, `src/lib/gamification.js` |
| **P2 — AI Engineering** | `functions/` (all of it), `src/lib/tutor.js` | `src/pages/`, `src/data/` |
| **P3 — Content + Game Logic** | `src/data/`, `src/lib/gamification.js` | `functions/`, `src/pages/` |
| **P4 — Platform + Pitch** | `src/firebase.js`, `firebase.json`, `.github/`, `README.md`, deploy config | everyone's feature code |

Shared files that need a heads-up in chat before editing: `src/App.jsx`, `package.json`, this file.

---

## 2. Mock mode — nobody is blocked on anybody

Set `VITE_USE_MOCKS=true` in `.env` (this is the default in `.env.example`).

With mocks on:
- **No Firebase project needed** — user profile and progress live in `localStorage`.
- **No API key needed** — the tutor returns realistic canned Socratic replies with a fake delay.
- **No backend running** — `npm install && npm run dev` is the entire setup.

This means P1, P2 and P3 all start building in hour one, before P4 has finished the Firebase
setup. P4 flips mocks off once the real services are live, and nothing else has to change.

**The mock tutor is also the demo safety net.** If the AI endpoint dies during recording,
flip mocks on and the demo still runs. Do not delete the mocks.

---

## 3. Data contract — Firestore (and the mock's shape)

The mock in `src/lib/store.js` uses these exact shapes, so swapping to real Firestore is a
drop-in. Do not rename fields.

```js
// users/{uid}
{
  displayName: string,
  ageBand: "12-16" | "17-22" | "23-28",
  nativeLanguage: "en" | "sw" | "hi" | "yo" | "sn",   // ISO-ish codes, see §6
  interests: string[],          // 1-3 of the INTEREST_DOMAINS ids below
  goal: string,
  xp: number,
  streak: number,
  lastActiveDate: string,       // "YYYY-MM-DD"
  badges: string[],             // badge ids
  createdAt: number             // Date.now()
}

// users/{uid}/progress/{lessonId}
{
  status: "not-started" | "in-progress" | "complete",
  quizScore: number,            // 0..1
  misconceptionsHit: string[],  // misconception ids
  reviewDueAt: number | null,   // epoch ms; set when an answer is wrong
  completedAt: number | null
}

// lessons/{lessonId}   -- authored by P3 as JSON, see src/data/lessons.sample.json
// regions/{regionId}
{ name: string, masteryPct: number, learnerCount: number }
```

### INTEREST_DOMAINS (P3 owns this list; P1 renders it; P2 injects it into prompts)

```
cooking · football · music · fiction · farming · trading · gaming · fashion · cars · faith
```

Each has `{ id, label, emoji }` — see `src/data/interests.js`.

---

## 4. API contract — the tutor endpoint

**P2 implements this. P1 calls it via `src/lib/tutor.js` and never talks to the network directly.**

```
POST  {VITE_TUTOR_ENDPOINT}
Content-Type: application/json
```

**Request**

```js
{
  uid: string,
  lessonId: string,
  conceptId: string,          // which concept in the lesson we're on
  message: string,            // what the learner just typed
  history: [                  // last 6 turns max, oldest first
    { role: "user" | "assistant", content: string }
  ],
  learner: {
    nativeLanguage: "yo",
    interests: ["cooking", "football"],
    ageBand: "17-22"
  },
  context: {                  // P3's lesson data, passed through by P1
    lessonTitle: string,
    conceptSummary: string,   // 2-3 sentences of ground truth so the AI can't hallucinate
    misconceptions: [ { id: string, description: string, signal: string } ]
  }
}
```

**Response — 200**

```js
{
  reply: string,                       // what to show in the chat bubble
  anchorUsed: string | null,           // e.g. "cooking" — P1 shows a small chip for this
  misconceptionDetected: string | null,// misconception id, or null
  hintLevel: 0 | 1 | 2 | 3,            // 3 = maximum scaffolding reached
  modelUsed: string,                   // e.g. "meta/llama-3.3-70b-instruct"
  translated: boolean,                 // true if Google Translate post-processed the reply
  latencyMs: number
}
```

**Response — error (any failure, including all models rate-limited)**

```js
{ reply: "<a safe fallback Socratic nudge>", error: "all_models_exhausted", modelUsed: null }
```

Note: the endpoint **never returns a non-200 to the client**. If everything fails it returns a
generic guiding question so the UI never shows a broken state on demo day.

---

## 5. AI stack — NVIDIA NIM with rate-limit failover

We use **NVIDIA's free hosted models** (build.nvidia.com) via their OpenAI-compatible API:

```
POST https://integrate.api.nvidia.com/v1/chat/completions
Authorization: Bearer $NVIDIA_API_KEY
```

Because free tiers rate-limit, `functions/models.js` holds an ordered chain. On `429`, `5xx`,
or timeout we advance to the next model and mark the failed one as cooling-down for 60s.

```
1. meta/llama-3.3-70b-instruct        (primary — strongest reasoning)
2. qwen/qwen2.5-72b-instruct          (best multilingual coverage)
3. nvidia/llama-3.1-nemotron-70b-instruct
4. mistralai/mistral-large-2-instruct
5. meta/llama-3.1-8b-instruct         (fast last resort, always answers)
```

> **P2: verify these model IDs against build.nvidia.com on day one** — NVIDIA's catalog
> changes. The chain is config, not code; fixing a bad ID is a one-line edit.

`modelUsed` is returned to the client on purpose: showing the failover working live is a
technical-execution point in the demo.

### Language strategy (this is a real risk — read it)

Llama/Qwen handle **Swahili and Hindi** reasonably. They are **weak on Yoruba and Shona**
(low-resource languages). Do not assume the model can teach in Shona — it will produce
confident nonsense.

So each language is tagged with a strategy in `functions/translate.js`:

| Language | Strategy |
|---|---|
| English, Swahili, Hindi | `direct` — the LLM writes in the target language |
| Yoruba, Shona | `pivot` — LLM reasons and writes in English, then **Google Translate API** converts the learner-facing text; academic terms are held back in English on purpose |

The pivot path is exactly why Google Translate is in the stack. It also sets `translated: true`
so we can be honest about it in the pitch.

**Demo recommendation:** record the video in **Swahili or Hindi** (direct path, highest
quality), and show Yoruba/Shona as the pivot path if it holds up in testing.

---

## 6. Supported languages (MVP)

| Code | Language | Strategy |
|---|---|---|
| `en` | English | direct |
| `sw` | Swahili | direct |
| `hi` | Hindi | direct |
| `yo` | Yoruba | pivot via Translate |
| `sn` | Shona | pivot via Translate |

---

## 7. Where the tutor endpoint is hosted — decide in the kickoff

**Firebase Cloud Functions cannot make outbound calls to third-party APIs on the free Spark
plan.** This will block P2 on day one if nobody handles it. Two options:

- **Option A (recommended): upgrade the Firebase project to Blaze.** Pay-as-you-go, requires a
  card, but the free monthly allowance means a hackathon costs ~$0. Everything stays in one
  console. *P4 does this in the first hour.*
- **Option B (no card): host only the tutor function on Cloudflare Workers.** Free, no card,
  100k requests/day. Firebase still does hosting, Firestore, auth, analytics. The handler in
  `functions/tutor-core.js` is platform-agnostic — the swap is ~15 lines of glue.

Either way the client only knows `VITE_TUTOR_ENDPOINT`, so this decision is reversible.

---

## 8. Definition of done for the MVP demo path

The demo is broken unless all of these are true on a **phone-sized screen**:

1. Onboarding captures language + 1-3 interests in under 60 seconds.
2. Lesson 1 renders, with its example visibly written in the learner's chosen interest domain.
3. Quiz accepts a wrong answer → tutor names the misconception → explains via the interest anchor.
4. Learner asks the tutor to "just give me the answer" → tutor refuses and asks a question back.
5. Dashboard shows XP, streak, and the mock territorial stat.
6. No console errors, no unstyled flashes, no broken layout at 390px wide.
