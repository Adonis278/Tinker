# Getting this onto GitHub and the team into it

For Adoni. Ten minutes, start to finish.

---

## 1. Push the scaffold

The local repo is committed and ready. Point it at your existing GitHub repo and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

```bash
git branch -M main && git push -u origin main
```

If the remote already has commits (a README from when you created it), rebase onto them first:

```bash
git pull origin main --rebase --allow-unrelated-histories
```

---

## 2. Fix the collaborator list

From your screenshot: **Tobacco** (`AfricanTobacco`) and **Makomborero Manyeruke**
(`mansmako`) are active. **Donnovan99's invite has expired** — remove and re-invite:

Repo → **Settings → Collaborators** → remove Donnovan99 → **Add people** → re-add.

Give everyone **Write** access, not Admin. Write lets them push branches and merge PRs,
which is all anyone needs today.

---

## 3. Fill in the role table

Open `README.md` and put real names against P1–P4, then delete the reminder line. Everything
else in the repo refers to roles, not people, so this is the only place you need to edit.

**My suggested split, based on nothing but balance — change it to match actual skills:**

| Role | Why this person | Suggested |
|---|---|---|
| P1 Frontend | Whoever is fastest at React and has taste | Tobacco |
| P2 AI | Whoever built the agents with the Meta API — this is closest to that work | Makomborero |
| P3 Content | Whoever explains things well; needs writing more than coding | Donnovan99 |
| P4 Platform + Pitch | You. You own the narrative and you'll present it. | Adoni |

P4 is not the leftover job — it's the seat that owns a quarter of the score.

---

## 4. Send this message to the group

> Repo is up: `<paste URL>`
>
> Before you write any code, do these three things:
>
> 1. Clone it, then `npm install` → `cp .env.example .env` → `npm run dev`. It runs
>    immediately on mock data — no Firebase, no API keys, nothing to wait for.
> 2. Read `docs/ARCHITECTURE.md`. Ten minutes. It's the contract between our four pieces
>    and it's frozen after kickoff.
> 3. Read your own file in `docs/tasks/` — you're P1/P2/P3/P4, see the table in the README.
>
> Two rules: **never push to main** (branch + PR), and **only edit files you own** (table in
> the README). That's what stops us spending Friday morning resolving conflicts.
>
> The demo path we're protecting is in ARCHITECTURE.md §8. If your change breaks any of
> those six steps, fix it before you push.
>
> Kickoff call: 30 minutes. We agree the schema, confirm roles, and storyboard the video
> before anyone builds anything.

---

## 5. Run a 30-minute kickoff before anyone codes

Worth every minute. Agenda:

1. **Confirm roles** (5 min) — swap if someone's stronger elsewhere.
2. **Walk the demo path together** (10 min) — everyone runs the app on mocks and clicks
   through it. Now the whole team has seen the finished shape of the thing.
3. **Freeze the contracts** (10 min) — read ARCHITECTURE.md §3 and §4 aloud. Any objection
   to a field name has to happen now, not at 2am.
4. **P4 decides Blaze vs Cloudflare** (5 min) — this blocks P2 and nothing else can start
   until it's called.

---

## Optional: GitHub CLI

You don't have `gh` installed. You don't need it — the web UI does everything above. But if
you want it for faster PR handling:

```bash
winget install --id GitHub.cli
```

Then `gh auth login`, and afterwards `gh pr create` / `gh pr merge` from the terminal.
