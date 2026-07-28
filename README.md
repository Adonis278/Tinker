# Tinker

**Learn in the language you think in, through the things you already love.**

An AI learning companion that teaches concepts through what a learner already knows —
cooking, football, music, farming — in their own language, with a Socratic tutor that
refuses to hand out answers.

Built by **Spiritus Agentic Solutions** for the AI/ML in Education hackathon.

**Live:** https://tinkersas.web.app

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
1. **[docs/DESIGN.md](docs/DESIGN.md)** — how the system works, what you build, and your
   commit-by-commit plan. Read this one as a team at kickoff.
2. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — the frozen contracts. 10 minutes. Non-negotiable.
3. **Your own task file** in `docs/tasks/` — quick reference while you work.
4. [CONTRIBUTING.md](CONTRIBUTING.md) — branch + PR rules.

---

## Who is doing what

> **Adoni: confirm or swap these four names before kickoff, then delete this line.**

| Role | Person | GitHub | Brief | Commit plan |
|---|---|---|---|---|
| P1 — Frontend / UX | *(assign)* | `AfricanTobacco` | [P1](docs/tasks/P1-frontend.md) | [DESIGN §4](docs/DESIGN.md#4-p1--frontend--ux) |
| P2 — AI Engineering | *(assign)* | `mansmako` | [P2](docs/tasks/P2-ai-engineering.md) | [DESIGN §5](docs/DESIGN.md#5-p2--ai-engineering) |
| P3 — Content + Game Logic | *(assign)* | `Donnovan99` | [P3](docs/tasks/P3-content-gamification.md) | [DESIGN §6](docs/DESIGN.md#6-p3--content--game-logic) |
| P4 — Platform + Pitch | Adoni | `Adonis278` | [P4](docs/tasks/P4-platform-pitch.md) | [DESIGN §7](docs/DESIGN.md#7-p4--platform--pitch) |

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
