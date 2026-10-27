---
name: rerun-failed-runs-in-place
description: "When a CI run fails and the fix is elsewhere, re-run THAT run (gh run rerun --failed), never dispatch a fresh one — a new run leaves the old red check attached to the commit forever."
metadata:
  type: feedback
---

**Kevin, 2026-08-10, on the red X sitting on the repo's main page: "not exactly a good look."**

A GitHub commit carries every check run ever attached to it. Dispatching a *new*
run after a failure creates a second check and **leaves the failed one attached**,
so the commit — and the repository home page, which shows the latest commit's
status — stays red even though the current state is green.

> **`gh run rerun <id> --failed` updates the existing check in place. `gh workflow run` does not.**

**Why:** the repo is public and is the shopfront for a project whose entire pitch
is rigour. A red mark that means "a check was wrong two hours ago" reads to a
stranger as "this is broken."

**How to apply:**
- After fixing the cause, re-run the failed run by id. Only dispatch fresh when
  testing something new.
- **Before re-running a `deploy`, check `git diff <sha> HEAD -- src/`.** A deploy
  re-run republishes *that commit's* tree, so re-running an old one silently
  regresses the live site. This nearly happened with the 2026-08-08 deploy.
- Some failures **cannot** be cleared and should be left: the code at that commit
  is genuinely broken, or the workflow compares the live site against its own
  older checkout. Leave them. A project with no red in its history mostly means
  nobody was checking anything — what matters is the **latest commit** being
  clean.
- The README carries `gates` / `deploy` / `ingest` badges, which is what a
  visitor actually sees. **Badges belong on the README, never on readthegame.co**
  — that page is for someone who wants to watch hockey, and the CSP would block
  the external image anyway.

Related: [[deploy-cloudflare]], [[mechanize-the-review]].

---

## ⚠️ THE EXCEPTION, 2026-08-23: a run pinned at a commit that genuinely was broken

`gh run rerun` replays at the **same head SHA**. The failed ingest was pinned at
`07af46c`, which contained the bug, so a rerun would have replayed it.

**Re-running in place is for a run that failed for a reason the COMMIT DID NOT
CONTAIN** — a flaky network, a runner hiccup, an expired token. When the commit
itself is wrong: fix it, push, and **dispatch once at the fixed tip to verify**.

The old red check STAYS RED, and that is correct — it is accurate history about
that commit. The rule's purpose was never to make checks green; it was to stop a
fresh dispatch being used to HIDE a red one.

See [[guard-where-the-archive-is]] for what broke.

⚠️ **LIMIT, found 2026-10-16:** `gh run rerun` replays the run at its ORIGINAL
commit. It only helps when the fix is OUTSIDE the repo (a secret, a flaky
service, published data). When the fix is a commit pushed afterwards, the rerun
re-tests the old code and fails the same way — ingest 38863247981 did exactly
that. Then verify the fix locally with the workflow's own steps and let the next
scheduled run (fresh checkout) confirm it.
