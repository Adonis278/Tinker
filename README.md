# Tinker

**Learn in the language you think in, through the things you already know.**

**Live → https://tinkersas.web.app**

Built by **Spiritus Agentic Solutions** for the AI/ML in Education hackathon.

---

## The problem

Millions of learners are taught in a language they do not think in, using examples drawn from
a world they have never seen, by systems that reward answer-getting over understanding. So
they memorise, pass, and forget — or hand their work to an AI that answers for them and
teaches them nothing.

A learner in rural Zimbabwe meets probability through cricket averages and ratios through a
train timetable between two English cities, in a language they are still translating in their
head. Existing tools translate the words, or hand over the answer. Neither starts from what
the learner already knows.

## What Tinker does

You tell it what you want to learn. You can attach your own notes or a chapter. It then:

1. **Indexes your material** — chunks it, embeds it with NVIDIA's retrieval models, and
   retrieves the relevant passages when you ask something. Answers cite the passage they came
   from, so you can check us rather than trust us.
2. **Builds a lesson plan from that material** — not a generic plan about the topic.
3. **Explains it inside a world you already know** — cooking, football, farming, music. Not a
   simplified version of the idea: the same idea, relocated somewhere you navigate confidently.
4. **Teaches in your language** — Kiswahili, Hindi, Yoruba, Shona or English — then hands you
   the academic English term as a label for something you already understand.
5. **Refuses to give you the answer.** Ask it to just tell you and it won't, every time. It
   asks a better question instead, and when you get something wrong it names the misconception
   rather than marking you down.

### Why this needs AI

No content library can be pre-written for every learner's language crossed with every
learner's passion crossed with their own uploaded notes — the combinations are effectively
infinite. The AI is not a feature bolted onto courseware; it is the only mechanism by which
this product can exist.

---

## Try it in 5 minutes

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The app runs fully on **mock data** with no Firebase project and
no API keys — that is intentional, so anyone can start immediately.

To run against the real services, set `VITE_MOCK_STORE=false` and `VITE_MOCK_TUTOR=false` in
`.env` and fill in the Firebase config.

---

## How it's built

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast builds, mobile-first |
| Hosting | Firebase Hosting | One-command deploys, global CDN |
| Data | Cloud Firestore + local cache | Local-first: works offline, syncs when it can |
| Auth | Firebase Auth — anonymous + Google | No signup wall; Google *links* to an anonymous session so progress survives |
| Tutor | NVIDIA NIM chat models | Free hosted inference, OpenAI-compatible |
| Retrieval | NVIDIA embeddings + cosine in-process | Real RAG without a vector database |
| Resilience | Ranked model failover | Free tiers rate-limit; the tutor must not go down mid-session |
| Translation | Google Cloud Translate | For languages the models handle poorly |
| Analytics | Firebase Analytics | Learning events, not just clicks |

### Three decisions worth knowing

**Local-first storage.** Reads are synchronous from `localStorage`; Firestore hydrates once at
boot and mirrors writes in the background, last-write-wins on `updatedAt`. Our learners are on
2G — the app has to work when the network doesn't and reconcile when it returns.

**No vector database.** At the scale one learner uploads, an in-process cosine scan over a few
hundred vectors costs under a millisecond. A hosted vector DB would add a network hop, a bill,
and another thing to fail on demo day.

**The AI never fails loudly.** If every model in the chain is exhausted, the endpoint still
returns HTTP 200 with a pedagogically valid nudge. A learner should never see a stack trace.

---

## Layout

```
src/
  pages/         Landing · Onboarding · Learn · Study · Lesson · Dashboard
  components/    StudyTutor, TutorChat
  lib/
    tutor.js         the only thing that talks to the AI
    study.js         ingest + course generation client
    store.js         local-first user & progress
    gamification.js  XP, levels, streaks, badges (pure functions)
  data/          lessons, interests, regions
functions/       tutor · ingest · course endpoints, retrieval, prompts, model failover
docs/            architecture, design doc, per-role task briefs, BRD
scripts/         verify-models.mjs — check the model chain still works
```

## Commands

```bash
npm run dev              # local dev
npm run build            # production build
npm run deploy           # build + deploy hosting
npm run deploy:functions # deploy the AI endpoints
node scripts/verify-models.mjs   # check the NVIDIA model chain is healthy
```

> Run `verify-models.mjs` at the start of a session. NVIDIA rotates its hosted catalogue and
> free-tier capacity moves hour to hour — a model that 404s or stalls silently drops you down
> the chain, which is easy to miss until it matters.

---

## Docs

- **[docs/DESIGN.md](docs/DESIGN.md)** — system design, diagrams, per-role commit plans
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — the frozen contracts
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — branch and PR rules

## Team

| Role | Owns |
|---|---|
| P1 — Frontend / UX | `src/pages`, `src/components`, styles |
| P2 — AI Engineering | `functions/`, `src/lib/tutor.js` |
| P3 — Content + Game Logic | `src/data`, `src/lib/gamification.js` |
| P4 — Platform + Pitch | Firebase, `store.js`, deploys, the demo |
