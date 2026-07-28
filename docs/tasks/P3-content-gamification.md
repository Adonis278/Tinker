# P3 — Content + Game Logic

**You own the substance.** P2's tutor is only as good as the ground truth you give it, and
Educational Impact (25 points) lives or dies on whether the lessons actually teach. You also
own the dopamine.

**You own:** `src/data/`, `src/lib/gamification.js`
**You never edit:** `functions/`, `src/pages/`

Start now — no dependencies on anyone. One sample lesson already exists as your template.

---

## Part 1: Content (do this first — P2 is blocked on it in a soft way)

### Write 5 lessons: "Foundations of Algebra"

`src/data/lessons.sample.json` has lesson 1 fully worked as the template. Copy its shape
exactly — the field names are a frozen contract (see
[ARCHITECTURE.md §3](../ARCHITECTURE.md)).

Suggested sequence, each building on the last:
1. **What a variable really is** (done — use as reference)
2. **Keeping both sides balanced**
3. **Undoing operations (inverses)**
4. **Solving in two steps**
5. **Turning a word problem into an equation**

For each lesson you must write:

| Field | What it needs to be |
|---|---|
| `conceptSummary` | 2–3 sentences of **ground truth**. This goes into the AI prompt and is what stops it hallucinating. Be precise. |
| `bodyMd` | Short. Under 150 words. Phone screen, low attention, low bandwidth. |
| `anchorPrompts` | **The important one.** The same concept written 4 ways — `cooking`, `football`, `music`, `farming`. Each must be a genuine explanation in that world, not a sentence with the word "football" bolted on. |
| `quiz` | 2–3 multiple choice. Every wrong option maps to a real misconception id. |
| `misconceptions` | id, description, and the observable `signal` P2's prompt matches against. |

**Write the anchors properly.** These are the fallback if the AI is slow or off, and they're
what appears on screen in the demo. If you can only do a great job on three domains, do
cooking, football and music — those are what we'll record.

### Misconception library

Aim for 8–12 real ones across the five lessons. Good sources: what actually goes wrong in a
classroom. Examples already in the sample: `one-sided-operation`,
`wrong-inverse-operation`, `var-is-the-answer`. Each needs a `signal` concrete enough that a
language model can spot it in a learner's reply.

### Region data

Create `src/data/regions.js` with 6–8 realistic entries (`name`, `masteryPct`,
`learnerCount`) — Lagos, Nairobi, Harare, Accra, Mumbai, Kampala. Mock data is fine and
expected; make the numbers plausible, not round.

---

## Part 2: Game logic

`src/lib/gamification.js` is scaffolded with XP, levels, streaks and 3 badges. Pure
functions, no React, no Firebase — keep it that way so it stays trivial to test.

- [ ] Check the XP curve feels right — a learner should hit level 2 in one session, not five
- [ ] Streak logic handles the day-boundary case (there's a `today` parameter for testing it)
- [ ] Add 2–3 more badges tied to *understanding*, not just activity. `Polyglot` (learned in
      2 languages) and `Own Words` (3 tutor exchanges) are more on-brand than "did 10 quizzes"
- [ ] `scheduleReview()` — a wrong answer schedules a review. If there's time, weight the
      delay by how many times they've missed that concept

---

## Definition of done

- [ ] 5 lessons complete, valid JSON, loads without errors
- [ ] Every lesson has at least 3 well-written interest anchors
- [ ] Every wrong quiz option maps to a real misconception
- [ ] A non-maths-person can read a lesson and actually understand the concept
- [ ] XP, levels, streaks and badges all update correctly in the running app
- [ ] `regions.js` exists and the dashboard pulls from it
