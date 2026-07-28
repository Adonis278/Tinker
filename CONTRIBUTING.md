# How we work (read once, takes 3 minutes)

We have roughly a day and a half. These rules exist to stop the two things that kill
hackathon teams: **merge conflicts** and **waiting on someone else**.

---

## 1. Never push to `main`

```bash
git checkout -b p2/socratic-prompt      # p<your number>/<what you're doing>
git add -A
git commit -m "Socratic prompt with interest anchoring"
git push -u origin p2/socratic-prompt
```

Open a PR. Anyone can approve. Don't wait more than 20 minutes for a review — if nobody
has looked, ping the group chat and merge it yourself. Momentum beats process today.

## 2. Only edit files you own

See the ownership table in [README.md](README.md). If you need something changed in
someone else's file, **ask them in chat** — do not edit it yourself, even if it's one line.
That one line is how you get a conflict at 2am.

## 3. Pull before you start, and often

```bash
git pull origin main --rebase
```

Do this every time you sit back down. Small, frequent merges hurt far less than one big one.

## 4. Commit early and often

Commit whenever something works, even if it's ugly. A working ugly commit is worth more
than a beautiful uncommitted one that dies with your laptop.

## 5. Don't break the demo path

The demo path is defined in [docs/ARCHITECTURE.md §8](docs/ARCHITECTURE.md). Before you
push, click through it once:

**onboard → lesson shows your interest anchor → get a quiz answer wrong → tutor names the
misconception → ask the tutor for the answer and watch it refuse → dashboard shows XP,
streak and the region stat.**

If your change breaks any of those six steps, fix it before you push.

## 6. Never commit secrets

`.env` and `functions/.env` are gitignored. Keep it that way. API keys go in those files
and nowhere else. Anything named `VITE_*` is compiled into the public browser bundle —
never put a secret behind a `VITE_` prefix.

## 7. Mock mode is sacred

`VITE_USE_MOCKS=true` must always produce a fully working app with no keys and no network.
It's how new people start in 5 minutes, and it's our safety net if an API dies mid-demo.
Don't let real dependencies leak into the mock path.

---

## Feature freeze

**End of Day 2, no exceptions.** After freeze: bug fixes on the demo path only. No new
features, no refactors, no "quick improvements". Everything after freeze goes into
`docs/POST_MVP.md` and gets pitched as roadmap.

## If you're blocked

Say so in the group chat immediately. Blocked for 15 minutes with nobody knowing is the
most expensive thing that can happen today. There is almost always a mock or a stub that
unblocks you — check `src/lib/tutor.js` and `src/lib/store.js` for the pattern.
