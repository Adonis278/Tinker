# P4 — Platform + Pitch

**You own 25 of the 100 points on your own.** The demo video is a quarter of the score and
it is the only part of the project the judges are guaranteed to experience in full. You also
own the infrastructure everyone else depends on.

**You own:** `src/firebase.js`, `src/lib/store.js`, `firebase.json`, `.github/`, `README.md`, deploys
**You never edit:** other people's feature code

---

## Hour one — you are the critical path, nobody else is

### 1. Decide where the tutor function lives (blocks P2)
Firebase Cloud Functions **cannot make outbound calls to NVIDIA or Google on the free Spark
plan.** Pick one, now:

- **Blaze plan (recommended)** — pay-as-you-go, needs a card, free monthly allowance means a
  hackathon costs about nothing. Everything stays in one console.
- **Cloudflare Workers** — free, no card, 100k requests/day. Only the tutor endpoint moves;
  Firebase still does hosting, Firestore, auth and analytics.

Tell P2 within the first hour either way.

### 2. Firebase project
- Create the project, enable **Anonymous** auth, create Firestore in test mode, enable Analytics.
- Put the web config into `.env` (it's already templated in `.env.example`).
- Deploy the empty build to Hosting immediately, so we have a live URL from hour one and
  deployment is never a surprise on the last day.

### 3. Repo hygiene
- Confirm all four collaborators have accepted their invites (**Donnovan99's has expired —
  resend it**).
- Protect `main` if you can: require a PR. If it slows people down, drop it.

---

## Then

### Wire Firestore behind the mocks
`src/lib/store.js` has the whole data API behind one flag. Implement the real Firestore path
so `VITE_USE_MOCKS=false` works — **without changing any function signature**, because P1 and
P3 are calling them already.

**Do not delete the mocks.** They're how the team works offline and they're the demo-day
safety net if a service dies mid-recording.

### Analytics events
`track()` in `src/firebase.js` is the single entry point. Make sure these fire:
`onboarding_complete`, `lesson_start`, `quiz_submit`, `tutor_message`,
`misconception_detected`, `anchor_used`, `lesson_complete`.

Being able to say "we instrumented learning, not just clicks" is a real pitch line — and if
you get 20 friends to test it before Friday, real funnel numbers in the video are worth more
than any slide.

### Integration testing
You're the only person clicking the whole path regularly. Do it every couple of hours on a
real phone. When it breaks, you find it, not a judge.

---

## The video — start Wednesday, not Friday

**Storyboard it before anyone writes code.** If a feature isn't in the storyboard, we
shouldn't be building it.

| Time | Beat |
|---|---|
| 0:00–0:20 | The problem. One stat, one face. "Taught in a language you don't think in, with examples from a world you've never seen." |
| 0:20–0:40 | Onboarding — pick Kiswahili, pick football and cooking. "No account needed." |
| 0:40–1:00 | **Hero shot:** the same lesson, two learners, side by side — one sees algebra through jollof rice, the other through a striker's stats. This is the whole product in eight seconds. |
| 1:00–1:25 | Wrong answer → tutor names the misconception → explains it through cooking, in Kiswahili. |
| 1:25–1:40 | Learner types "just give me the answer" → **tutor refuses** and asks a question back. |
| 1:40–1:50 | Dashboard: XP, streak, "You helped Lagos reach 14% algebra mastery." |
| 1:50–2:00 | One architecture slide + roadmap (offline-first, WhatsApp, more languages) + team. |

Rules that make it good:
- **Script it.** Under 280 words for two minutes. Write it, read it aloud, cut a third.
- **Never type live on camera.** Scripted inputs, best take, no hesitation.
- **Record in Kiswahili or Hindi**, not Yoruba or Shona — ask P2 which language is actually
  holding up. Do not find this out during recording.
- Screen-record at phone aspect ratio. It's a mobile product; make it look like one.
- Say the word "why" out loud. Judges score the *why*, not the feature list.

### Also submit
- GitHub repo, public, with a README that lets a judge run it in 5 minutes (done — keep it true)
- Architecture diagram — one image, no more
- Make sure the live Hosting URL works from a phone on mobile data, not just your wifi

---

## Definition of done

- [ ] Live URL works on a phone on mobile data
- [ ] Real Firestore + anonymous auth working, mocks still intact as fallback
- [ ] Analytics events firing and visible in the Firebase console
- [ ] All four collaborators active on the repo
- [ ] 2-minute video recorded, edited, uploaded, link tested in an incognito window
- [ ] Repo public, README accurate, no secrets in git history
