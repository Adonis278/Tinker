# Tinker

**Learn in the language you think in, through the things you already love.**

An AI learning companion that teaches concepts through what a learner already knows —
cooking, football, music, farming — in their own language, with a Socratic tutor that
refuses to hand out answers.

Built by **Spiritus Agentic Solutions** for the AI/ML in Education hackathon.

---

## Start here (5 minutes, no accounts, no API keys)

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The whole app works immediately on **mock data** — fake tutor,
fake storage, no Firebase, no API key. **Do not wait for anyone to set anything up before
you start building.**

Then read, in this order:
1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — the contracts. 10 minutes. Non-negotiable.
2. **Your own task file** in `docs/tasks/`.
3. [CONTRIBUTING.md](CONTRIBUTING.md) — branch + PR rules.

---

## Who is doing what

> **Adoni: confirm or swap these four names before kickoff, then delete this line.**

| Role | Person | GitHub | Task brief |
|---|---|---|---|
| P1 — Frontend / UX | *(assign)* | `AfricanTobacco` | [P1-frontend.md](docs/tasks/P1-frontend.md) |
| P2 — AI Engineering | *(assign)* | `mansmako` | [P2-ai-engineering.md](docs/tasks/P2-ai-engineering.md) |
| P3 — Content + Game Logic | *(assign)* | `Donnovan99` | [P3-content-gamification.md](docs/tasks/P3-content-gamification.md) |
| P4 — Platform + Pitch | Adoni | *(owner)* | [P4-platform-pitch.md](docs/tasks/P4-platform-pitch.md) |

Everything in the repo refers to **roles (P1–P4), not names**, so swapping people is a
one-line edit to this table.

---

## What you own

You edit files in your column only. This is the single rule that stops four people
spending the hackathon resolving merge conflicts.

| P1 | P2 | P3 | P4 |
|---|---|---|---|
| `src/pages/` | `functions/` | `src/data/` | `src/firebase.js` |
| `src/components/` | `src/lib/tutor.js` | `src/lib/gamification.js` | `firebase.json`, deploy |
| `src/index.css` | | | `README.md`, `.github/` |

Shared (announce in chat first): `src/App.jsx`, `package.json`, `docs/ARCHITECTURE.md`.

---

## Project layout

```
src/
  pages/         P1 — Onboarding, Lesson, Dashboard
  components/    P1 — TutorChat
  lib/
    tutor.js         P2 — the only thing that talks to the AI
    gamification.js  P3 — XP, levels, streaks, badges (pure functions)
    store.js         P4 — user + progress, mock or Firestore
  data/          P3 — lessons, interests, misconceptions
  firebase.js    P4 — auth, analytics, Firestore init
functions/       P2 — tutor endpoint, NVIDIA failover, prompts, translation
docs/            contracts, task briefs, BRD
```

## Tech

React + Vite + Tailwind · Firebase (Hosting, Firestore, Auth, Analytics) ·
**NVIDIA NIM** free models with automatic rate-limit failover · **Google Translate API**
for low-resource languages.

## Commands

```bash
npm run dev      # local dev on mocks
npm run build    # production build
npm run deploy   # build + firebase deploy --only hosting  (P4)
```
