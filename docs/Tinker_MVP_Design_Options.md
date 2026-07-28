# Tinker — Hackathon MVP Design Doc (4 Attack Plans)

**Team:** 4 people · **Time:** ~1.5 days (due Friday) · **Constraint:** Google Firebase for hosting, backend, auth, analytics · Google APIs for translation · Team experience: Meta (WhatsApp) API, Twilio, AI agents

---

## Shared Foundation (applies to every option)

Whichever option you pick, the base stack is the same. Set this up first (Hour 0–1, one person):

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind, deployed to **Firebase Hosting** | Fast, free tier, one-command deploy |
| Database | **Cloud Firestore** | Realtime, offline persistence built in (replaces the BRD's PostgreSQL + IndexedDB plumbing for free) |
| Auth | **Firebase Auth** — anonymous sign-in, optional email upgrade | Matches the BRD's anonymous-to-auth flow with ~10 lines of code |
| AI Tutor | **Gemini API** (gemini-2.x-flash) via Cloud Functions or client SDK | Free-tier friendly, multilingual, stays in Google ecosystem |
| Translation | **Google Cloud Translation API** (or just prompt Gemini to teach bilingually — cheaper and better for "scaffolding, not translation") | The BRD's differentiator is concept bridging, and an LLM prompt does that better than the Translate API |
| Analytics | **Firebase Analytics / Google Analytics 4** | Free, zero setup, gives you the demo-day metrics slide |
| Serverless | **Cloud Functions for Firebase** | Webhooks (WhatsApp option), API key hiding, scheduled jobs |

**Key simplification vs. the BRD:** Firestore's built-in offline persistence gives you the "offline-first" story without writing Service Worker + IndexedDB sync code. Enable it with one flag, demo it by toggling airplane mode.

---

## Option A — "The Faithful MVP" (web app, closest to the BRD)

**One-liner:** The BRD's Section 20 scope, trimmed to what 4 people can ship: onboarding quiz → one algebra pathway → Socratic Gemini tutor → XP/streaks → dashboard.

**In scope:**
- Onboarding quiz (age, language, goal, 3 baseline questions) → learner profile in Firestore
- 5 algebra lessons (pre-written JSON content, not AI-generated live) with multiple-choice quizzes
- Socratic tutor chat (Gemini + strict system prompt: never answer directly, hint ladder after 3 exchanges)
- Bilingual toggle per lesson: English ↔ one native language (pre-generate the translations with Gemini before the demo — don't translate live)
- XP, levels, streak counter, 3 badges, progress dashboard
- Regional leaderboard with seeded mock data

**Cut:** real spaced repetition (fake it: hardcode one "review due" card), social share images, QR sync, misconception library (one hardcoded pattern is enough for demo).

**Work split:**
- **P1 — Frontend shell & lessons:** app skeleton, routing, lesson viewer, quiz component, onboarding flow
- **P2 — AI tutor:** Gemini integration, Socratic system prompt, chat UI, bilingual lesson generation script
- **P3 — Gamification & dashboard:** XP/streak/badge logic in Firestore, dashboard, leaderboard
- **P4 — Firebase & glue:** project setup, Auth, Firestore schema, security rules, Analytics events, Hosting deploy, demo data seeding

**Risk:** Broadest scope of the four — most likely to hit Friday with three features at 80% instead of five at 100%.

---

## Option B — "WhatsApp Tinker" (plays to your team's strengths)

**One-liner:** The tutor lives in WhatsApp. No app install, works on any phone — the strongest version of the BRD's accessibility story (Tariro and Priya personas), built on APIs your team already knows.

**Architecture:** WhatsApp (Meta Cloud API or Twilio WhatsApp Sandbox) → Cloud Function webhook → Gemini (Socratic prompt) → Firestore (user state, XP, streaks) → reply. A small web dashboard on Firebase Hosting shows the learner's progress and the regional leaderboard for the demo screen.

**In scope:**
- Onboarding conversation in WhatsApp (language, goal, baseline)
- Daily lesson delivered as chat messages; quiz as numbered-reply questions
- Socratic tutoring in the learner's native language, right in the thread
- XP/streaks tracked in Firestore; "streak reminder" message via scheduled Cloud Function
- Web dashboard (read-only) for progress + territorial leaderboard — this is what judges look at while one of you demos the phone

**Cut:** the entire PWA/offline story (WhatsApp *is* the low-bandwidth story), rich lesson media, social sharing.

**Work split:**
- **P1 — WhatsApp pipeline:** webhook Cloud Function, message routing, session state (your Meta/Twilio person)
- **P2 — AI tutor:** Gemini Socratic prompt, conversation state machine (onboarding → lesson → quiz → tutoring), native-language prompting
- **P3 — Dashboard:** web app showing progress, streaks, leaderboard, region map (reads Firestore live — updates on screen as the phone demo happens, which is a great moment)
- **P4 — Content & Firebase:** lesson/quiz content, Firestore schema, Analytics, deploy, demo script

**Risk:** Meta Cloud API test numbers only message pre-verified recipients — set that up Day 1 morning or fall back to Twilio Sandbox. Demoing a phone on a projector needs rehearsal (screen-mirror it).

---

## Option C — "The Socratic Wow Demo" (depth over breadth)

**One-liner:** Cut everything except the two things no competitor does (BRD Section 7): concept-preserving multilingual scaffolding + Socratic resistance. Make that one experience flawless.

**In scope:**
- One polished lesson experience: pick a concept (e.g., photosynthesis or linear equations)
- Side-by-side bilingual view: native-language explanation with cultural examples on the left, academic-English bridge on the right — this visual *is* your pitch
- Socratic chat with visible "misconception detected" moments: wrong quiz answer → AI names the misconception → clarifying analogy → hint ladder
- A "cheat attempt" demo beat: paste an exam question, watch the AI refuse and redirect (judges love this given the AI-misuse narrative)
- Minimal gamification: XP + streak only, small dashboard

**Cut:** multiple lessons, leaderboards, offline, social, spaced repetition, onboarding quiz (a 3-field form).

**Work split:**
- **P1 — Lesson experience:** bilingual side-by-side lesson UI, polish, animations
- **P2 — Socratic engine:** Gemini prompt engineering, misconception patterns (3–5 hardcoded), hint ladder, cheat-refusal behavior — this person spends the whole hackathon making the AI conversation great
- **P3 — Chat UI & demo flow:** chat component, quiz component, the scripted demo path end-to-end
- **P4 — Firebase & content:** setup, Auth, Firestore, Analytics, writing the lesson content in both languages, deploy

**Risk:** Thin surface area — if judges score on feature completeness rather than depth, you look small. Mitigate with a roadmap slide showing the full BRD vision.

---

## Option D — "The Community Engine" (gamification + territorial map)

**One-liner:** Lead with the most visual, most shareable differentiator: territorial competency mapping. A live map of regions filling in as learners master concepts, backed by a simpler tutor.

**In scope:**
- Interactive region map (e.g., Nigerian states or Zimbabwe provinces) colored by mastery %, updating live from Firestore as users answer quizzes
- Quiz-centric learning loop: short lessons → quizzes → your answers move your region's score
- Basic Gemini tutor (Socratic prompt, no misconception library)
- Full gamification: XP, badges, streaks, regional leaderboard, "You helped Lagos reach 15% algebra mastery" share card
- Seeded demo data so the map looks alive; judges answer a quiz on their phones and watch the map move

**Cut:** multilingual scaffolding (or keep a token language toggle), offline, spaced repetition.

**Work split:**
- **P1 — Map & visualization:** the SVG/GeoJSON region map, live Firestore listeners, animations
- **P2 — Learning loop:** lessons, quizzes, Gemini tutor chat
- **P3 — Gamification:** XP/badges/streaks/leaderboard, share card generator
- **P4 — Firebase & demo:** setup, Auth, Firestore aggregation logic (region scores), Analytics, seeding, deploy, the "judges play along" demo mechanics

**Risk:** The map is mock-ish by nature (you won't have real regional users), and it drops the multilingual/Socratic depth that makes Tinker defensible on paper. Best if your judging criteria reward audience engagement and visual impact.

---

## Recommendation

**Primary: Option B (WhatsApp Tinker), with Option C's Socratic depth as the tutor brain.**

Reasons:
1. It's the only option where your team's existing Meta API/Twilio muscle memory is an advantage — you're not learning PWA/Service Worker tech under deadline.
2. It tells the BRD's accessibility story (Tariro on a basic Android, Priya on a shared phone) more credibly than any web demo can.
3. The demo is theatrical: one teammate chats with Tinker on a real phone in Shona/Yoruba/Hindi while the projected dashboard updates live.
4. Firebase does all the heavy lifting (webhook function, Firestore, hosting, analytics) — minimal infra to build.

If the WhatsApp number/webhook setup fights you past noon on Day 1, fall back to Option C — it reuses the same Gemini Socratic engine (P2's work transfers 1:1) in a plain web chat.

---

## 1.5-Day Timeline (any option)

**Day 1 morning (hrs 1–4):** Firebase project + Hosting deploy of skeleton (P4), channel/pipeline spike — WhatsApp webhook or app shell (P1), first Socratic prompt working in a script (P2), content drafting (P3/P4). *Milestone: end-to-end "hello" through the whole pipeline by lunch.*
**Day 1 afternoon (hrs 5–9):** Each person builds their lane. *Milestone: full happy path (onboard → lesson → quiz → tutor) works ugly by dinner.*
**Day 1 evening (hrs 10–12):** Integration pass, fix the seams, seed demo data.
**Day 2 morning (hrs 13–16):** Polish, Analytics events, the demo script rehearsed twice, freeze features by noon.
**Day 2 buffer:** Bug fixes only. Record a backup demo video in case of demo-day WiFi failure.

**Rules to survive:** feature freeze at Day 2 noon · no live AI generation of lesson content (pre-generate everything) · one person owns the deploy · rehearse the demo on the actual demo device.
