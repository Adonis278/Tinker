# Tinker — Hackathon MVP Design Doc

**Team of 4 · Build window: ~1.5 days · Due: Friday · Stack: Firebase + Gemini**

This doc replaces the BRD as the build reference for the hackathon. The BRD (v1.0) stays as the vision/pitch source. Everything here is scoped to what four people can ship and demo in a 2-minute video.

---

## 1. The one decision that matters

Judging is 4 × 25 points: Educational Impact, Creative AI/ML, Technical Execution, Pitch & Demo.
That means: **build 3 things at 95% quality, not 10 things at 40%.**

Tinker's two genuinely unique cards (per the BRD's own competitive matrix):

1. **Concept-preserving multilingual scaffolding** — teach the concept in the learner's native language with local examples first, then bridge to academic English terms. → Educational Impact points.
2. **Socratic Resistance Engine** — an AI tutor engineered to *refuse* direct answers and detect misconceptions. → Creative AI points. (Judges will see 100 GPT-wrapper chatbots; one that fights back is memorable.)

Everything else in the MVP exists to frame these two features.

### Cut list (explicitly OUT for the hackathon — say "roadmap" in the pitch)

| Cut | Why |
|---|---|
| Offline-first PWA (Service Workers, IndexedDB, background sync) | Biggest time sink in the BRD and **invisible in a demo video**. One sentence in the pitch covers it. |
| RAG / vector DB (Pinecone) | You have 5 lessons. Put lesson content directly in the Gemini prompt. RAG solves a scale problem you don't have. |
| Real leaderboards / real territorial data | Seed Firestore with realistic mock data. Judges can't tell and don't care. |
| QR sync, multi-device, conflict resolution | Demo happens on one device. |
| Payments, premium tier, B2B anything | Zero judging value. |
| Real BKT/Ebbinghaus math | Keep the *story*; implement a simple "wrong answer → review card appears later" rule. |
| Real-time multiplayer battles | High complexity, high failure risk on demo day. |

### Standard stack (all four versions)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind | Deployed to **Firebase Hosting** |
| Auth | **Firebase Auth (anonymous)** | One line of code; "no signup needed" is itself a demo point |
| Database | **Firestore** | Users, progress, lessons, mock leaderboard |
| AI | **Gemini API** (Google AI Studio free tier) via **Cloud Functions** | Natively multilingual — handles scaffolding without a separate Translate call. Key stays server-side. |
| Translation (optional) | Google Translate API | Only if you want UI-string translation; Gemini covers the pedagogy |
| Analytics | **Firebase Analytics** | Free, zero setup, gives you a "we measure learning" pitch line |
| Repo | GitHub, main + feature branches | Required for submission |

---

## 2. Team split (same shape for all versions)

| Person | Owns | Ships |
|---|---|---|
| **P1 — Frontend/UX** | App shell, routing, onboarding quiz UI, lesson viewer, chat UI skin, mobile-first polish | Every screen the judges see |
| **P2 — AI Engineering** | Cloud Functions, Gemini calls, Socratic system prompt, scaffolding prompt, misconception patterns, hint ladder | The two wow moments |
| **P3 — Content + Game Logic** | 5 hand-written lessons + quizzes (Firestore), XP/streak/badge logic, progress dashboard, mock territorial map | Substance + dopamine |
| **P4 — Platform + Pitch** | Firebase project, auth, analytics, hosting/deploy, CI of the demo path, **owns the 2-min video from hour zero** | The glue + 25% of the total score |

**Rules of engagement**
- P4 storyboards the video **first** (Wed morning). Nothing gets built that doesn't appear in the storyboard or support it.
- Interfaces agreed in the first hour: Firestore schema (P3 ↔ P1) and Cloud Function request/response shapes (P2 ↔ P1). After that, everyone builds in parallel.
- Freeze features 4 hours before recording. Last 4 hours = bug fixes, polish, video takes only.

---

## 3. The four MVP versions

### V1 — "The Tutor That Won't Give You Answers" ⭐ RECOMMENDED

**Thesis:** Depth on both differentiators. The demo is a *conversation*, not a feature tour.

**Scope (IN):**
1. 60-second onboarding: name, age band, native language (pick from ~5: Yoruba, Shona, Hindi, Swahili, Spanish), goal.
2. One pathway: "Foundations of Algebra" — 5 hand-written lessons, each = short text + 3-question quiz.
3. **Socratic chat tutor** (Gemini): refuses direct answers, asks guiding questions, hint ladder after 3 exchanges, explains concepts in the learner's native language and bridges terms to English.
4. **Misconception moment:** wrong quiz answer → tutor names the likely misconception ("you added instead of subtracting when moving terms") and responds with an analogy in the native language. 3–5 hardcoded patterns is plenty.
5. Light gamification: XP, streak counter, one badge, simple dashboard.
6. Mock territorial stat on the dashboard: "You helped Lagos reach 14% algebra mastery."

**Demo storyboard (2 min):**
0:00 problem stat → 0:20 onboarding in Yoruba → 0:40 lesson + quiz, gets it wrong → 0:55 tutor detects the misconception, explains with a Yoruba market example → 1:20 student tries to paste a homework question, **tutor refuses** and Socratically guides → 1:40 dashboard: XP, streak, "Lagos mastery" stat → 1:50 roadmap flash (offline, territorial maps) + close.

**Risk:** low. Worst case the chat is slightly slow; pre-warm the function and script the demo inputs.

---

### V2 — "The AI That Knows What You Forgot"

**Thesis:** Lead with adaptive learning/ML. The hero screen is a live *model of the learner* — per-concept mastery bars that update as you answer, plus a "review scheduled" feed.

**Scope (IN):** onboarding with a 5-question diagnostic → same 5 lessons → per-concept mastery score (simplified knowledge tracing: right answers raise P(known), wrong answers lower it and spawn a review card) → "What you'll forget by Friday" panel → Socratic tutor present but thinner (no scaffolding depth).

**Demo beat:** answer wrong → watch your mastery bar drop and a review card appear, timestamped 48h out → do the review → bar recovers.

**Strength:** clearest "ML is core, not garnish" narrative of the four.
**Weakness:** visually quieter; the multilingual card (your best impact story) gets benched.
**Risk:** medium — the mastery model must *feel* believable live.

---

### V3 — "Tinker on WhatsApp" (the dark horse)

**Thesis:** Use the team's existing **Twilio / Meta (WhatsApp) API experience**. The tutor lives where low-connectivity learners already are: WhatsApp on any phone, no install, no data-heavy app. Web dashboard shows progress + territorial map.

**Scope (IN):**
1. WhatsApp number (Twilio WhatsApp sandbox or Meta Cloud API) → webhook → **Cloud Function** → Gemini Socratic prompt → reply.
2. Same Socratic + native-language scaffolding prompts as V1 (P2's work is identical).
3. Firestore logs every exchange → thin web dashboard (Firebase Hosting): learner progress, streak, mock regional heatmap.
4. Onboarding via chat: "What language do you want to learn in?"

**Demo beat:** film a real phone receiving a Socratic exchange in Shona over WhatsApp. That shot alone can win Educational Impact.

**Strength:** unbeatable accessibility narrative; plays to your team's proven skills; genuinely differentiated demo.
**Weakness:** "quality of UI/UX" is judged — chat-only risks looking thin, so the dashboard must be good. Sandbox setup friction (opt-in codes, webhook config) can eat hours.
**Risk:** medium-high. **Pick this only if a message round-trips end-to-end by Wednesday night.** Fallback: keep the web chat UI from V1 and demo WhatsApp as a bonus channel.

---

### V4 — "The Learning World" (breadth play)

**Thesis:** Closest to BRD Section 20. Bet on polish and dopamine: full gamification (XP, levels, 3 badges, streak, quests), animated mock territorial heatmap of Africa/India, share-card generator, plus a simpler tutor.

**Scope (IN):** onboarding → 5 lessons → basic Gemini tutor (Socratic prompt but no misconception library, one language) → full gamification suite → territorial heatmap page → downloadable share card.

**Strength:** prettiest screenshots; strongest UX score if execution is clean.
**Weakness:** the AI is garnish — directly sacrifices the Creative AI/ML 25 points, and judges have seen gamified quiz apps before.
**Risk:** medium — breadth means more integration surface; one broken feature in the video costs more than a missing one.

---

## 4. Recommendation

**Build V1, and steal the best 10% of V2 and V4:**
- V2's misconception-detection moment *is already in* V1's scope — make it the emotional center of the video.
- V4's mock territorial stat costs P3 an hour and buys the community-impact pitch line.
- If the team insists on WhatsApp: timebox a V3 spike to 3 hours Wednesday. Round-trip works → promote it to the demo. Doesn't → it's a roadmap slide.

Why not the others as primary: V2 buries your best impact story, V3 gambles UI points on a channel integration, V4 gambles AI points on features every team has.

---

## 5. Day-and-a-half schedule

**Wednesday PM (or whenever the 1.5 days start) — Foundation (hours 0–6)**
- Hour 0–1 (all): agree Firestore schema + function contracts; P4 creates Firebase project, repo, deploys "hello world" to Hosting; P4 drafts video storyboard.
- P1: app shell, routing, onboarding UI.
- P2: Cloud Function skeleton, first Gemini call, v1 Socratic prompt working in a test harness.
- P3: writes all 5 lessons + quizzes as JSON, loads into Firestore.
- End of day gate: onboarding → lesson 1 → quiz renders end-to-end with live data.

**Thursday — Build (hours 6–14)**
- P1: chat UI, lesson viewer polish, dashboard layout.
- P2: scaffolding (native-language explanation + term bridging), misconception patterns, hint ladder; iterate prompts against P3's actual quiz questions.
- P3: XP/streak/badge logic, dashboard data, mock territorial stat + leaderboard seed.
- P4: anonymous auth, analytics events (lesson_start, quiz_submit, tutor_message), deploy pipeline, starts capturing b-roll screen recordings.
- End of day gate: **full demo path works on a phone.** Feature freeze at end of day.

**Friday AM — Polish & Pitch (hours 14–18)**
- All: bug-fix only on the demo path. No new features. 
- P4 + one narrator: record the 2-minute video (script ≤ 280 words), cut, export.
- P4: README with setup instructions, architecture diagram, submission checklist (video link + repo).

---

## 6. Demo video structure (25 points — treat as a feature)

| Time | Beat |
|---|---|
| 0:00–0:20 | The why: "272M kids out of school; millions more can't learn in the language they think in." One stat, one face. |
| 0:20–0:40 | Onboarding: pick Yoruba, pick algebra. "No account needed." |
| 0:40–1:20 | **The two wow moments:** wrong answer → misconception detected → explained with a local-context analogy in Yoruba → then user pastes a homework question and the tutor *refuses* and guides Socratically. |
| 1:20–1:45 | Dashboard: mastery, streak, "You helped Lagos reach 14% algebra mastery." |
| 1:45–2:00 | Tech slide (Firebase + Gemini, one diagram) + roadmap (offline-first, WhatsApp, territorial maps) + team card. |

Script it, rehearse it twice, record the app with scripted inputs (no live typing improvisation).

---

## 7. Firestore schema (agree hour one, then don't touch)

```
users/{uid}: { name, ageBand, nativeLang, goal, xp, streak, badges[], createdAt }
users/{uid}/progress/{lessonId}: { status, quizScore, misconceptions[], completedAt }
lessons/{lessonId}: { order, title, bodyMd, quiz: [{q, options[], answerIdx, misconceptionMap{} }] }
regions/{regionId}: { name, masteryPct, learnerCount }   // seeded mock data
```

Cloud Function contract (P2 ↔ P1):

```
POST /tutor  { uid, lessonId, message, history[] }
→ { reply, misconceptionDetected?: string, hintLevel: 0-3 }
```

---

## 8. Known risks

| Risk | Mitigation |
|---|---|
| Gemini latency/cold starts in demo | Pre-warm function; record video with best takes; cache one canned exchange as absolute fallback |
| Prompt breaks Socratic character ("just tell me the answer") | P2 red-teams the prompt Thursday; hint-ladder caps the failure mode |
| Native-language quality (none of you may speak Yoruba/Shona) | Pick a language a team member or friend can sanity-check; Hindi or Swahili are safer than a dialect |
| Integration crunch Friday | Feature freeze Thursday night is non-negotiable; P4 enforces |
| Scope creep (the BRD is seductive) | This doc is the scope. New ideas go to a `POST_MVP.md` parking lot |
