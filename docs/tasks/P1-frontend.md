# P1 — Frontend / UX

**You own every screen a judge will see.** Technical Execution is 25 points and most of it
is your work. The app already runs — your job is to take it from "working skeleton" to
"this looks like a real product".

**You own:** `src/pages/`, `src/components/`, `src/index.css`
**You never edit:** `functions/`, `src/data/`, `src/lib/gamification.js`
**Ask before editing:** `src/App.jsx`

Start now — you do not need Firebase, API keys, or anyone else's work. `npm run dev`.

---

## Non-negotiable

**Design at 390px wide.** Our learners are on phones, the demo is recorded on a phone, and
a desktop-first layout that gets squeezed down always looks it. Keep DevTools on iPhone 14
the entire time.

---

## Tasks, in priority order

### 1. Make the interest picker beautiful (highest value — it's the opening demo shot)
`src/pages/Onboarding.jsx`, step 3. Right now it's a plain grid of buttons.

- Big tappable cards with the emoji doing real visual work.
- Obvious selected state — colour fill, checkmark, slight scale. It should feel good to tap.
- Show "2 of 3 chosen" so the limit doesn't feel like a bug when the fourth tap does nothing.
- Copy is already written; don't weaken it. "What do you already know well?" is the pitch.

### 2. Make the anchor callout on the lesson page unmissable
`src/pages/Lesson.jsx` — the `BECAUSE YOU KNOW COOKING` block.

This single component *is* our differentiator made visible. It should look deliberate and
premium, not like a warning box. Consider the interest emoji, a softer card, better type.

### 3. Polish the tutor chat
`src/components/TutorChat.jsx`

- Proper typing indicator (animated dots), not the text "thinking…".
- Keep the `via cooking` / model-name chips — they make the AI's work visible to judges.
- Make sure the sheet doesn't jump when the mobile keyboard opens. Test on a real phone.
- Message bubbles need breathing room; current spacing is functional, not nice.

### 4. Dashboard
`src/pages/Dashboard.jsx`

- Animate the XP bar filling on mount.
- The region card is the emotional close of the demo — give it the most visual weight.
- Badges: show locked ones greyed out, not hidden. Loss aversion only works if you can see
  what you don't have yet.

### 5. Quiz feedback
A wrong answer currently just turns red. Make it feel supportive rather than punishing —
this is a product that explicitly doesn't say "wrong". Match the tone.

### 6. Empty and loading states
Every screen needs to survive a slow network and a fresh user without looking broken.

---

## Brand

Navy `#1F4E78`, blue `#008AD1` (already in `tailwind.config.js` as `brand-navy` /
`brand-blue`). System font stack is fine — don't add a webfont, it costs load time on 3G
and nobody will notice in a 2-minute video.

---

## Definition of done

- [ ] Every screen looks correct at 390px with no horizontal scroll
- [ ] The six demo-path steps in [ARCHITECTURE.md §8](../ARCHITECTURE.md) all work
- [ ] No console errors, no layout shift on load
- [ ] Tapped targets are at least 44px tall
- [ ] It looks good enough that you'd screenshot it unprompted
