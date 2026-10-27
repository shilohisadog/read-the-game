---
name: ingest-delivery-target
description: "⏰ Kevin's 10:00 Eastern SLA, and the file for anything about the nightly. ⛔⛔⛔ FOUR TIMES NOW THE PIPELINE HAS REPORTED SUCCESS OVER SOMETHING THAT NEVER REACHED A READER: a green deploy, a green ingest, a green derive publishing a 404ing `players.json` (the upload step was a TYPED list), and on 2026-10-07 a PUBLISH-AND-COMMIT THAT DIED BETWEEN ITS TWO WRITES — the step pushes to R2 and commits to git as two acts, the health block failed in between, and origin and repo stayed apart with `npm run gates` green on the difference because nothing in gates reads the origin. ✅ `deploy.yml` now hard-fails on that. ⭐ The LEAGUE AMENDS PUBLISHED GAMES. ⚠️ A scheduled ingest arrived FOUR HOURS LATE — the concurrency group, not the cron times, is the real protection."
metadata:
  node_type: memory
  type: project
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-07T18:24:00.000Z
---

Kevin, 2026-09-23: *"I'd like all of the previous nights games to be ingested,
processed and available on the site by 1000 Eastern, daily."*

⚠️ **THE NUMBERS LIVE IN `docs/front-door.md` §6.1.0, WHICH OWNS THEM.** Do not
quote them from here into code — the workflow files cite the section and must not
restate it. What this file holds is the RULING and why it is provisional.

**The three measurements that sized it.** Latest puck drop **03:30 UTC** (10 of
167 nights, from every 2025-26 regular-season start the league scheduled — 1,312
games). Scheduler lateness **+0.3h to +10.3h, median +3.9h** over 31 scheduled
runs. Run duration **3–8 minutes**. ⛔ Game length is NOT measured and cannot be:
the play-by-play carries period clocks and no wall clock, so ~2h50m with overtime
is quoted from the sport, and it is the one soft input in the chain.

**What changed.** `ingest.yml` went from `0 11 * * *` to three entries — 07:23,
08:53, 10:23 UTC — because no single cron fits a ~7-hour start window against a
scheduler with a 10-hour tail, and the job CONVERGES (14-day window, idempotent),
so only one attempt has to land and the others exit as `unchanged`. Off the hour
and the half hour on purpose: those are the congested slots. `derive.yml` moved
from Mondays 09:20 to **15:47 UTC** — it shares the `ingest` concurrency group and
runs the better part of an hour, so a nightly queued behind a late one would miss
the deadline every Monday.

⭐ **THE DEFERRED DECISION, AND THE REASON IT IS THE RIGHT FIX.** From 07:23, 28 of
31 observed runs would have landed in time — **90%**. The rest is GitHub's queue,
and `workflow_dispatch` is not deprioritised (a dispatch this morning started in
under a second). A Cloudflare Worker cron POSTing to the dispatch API would make
the start time OURS: on the site by about 03:40 Eastern. It needs a GitHub token
as a Worker secret, and it does **not** violate `ingest.yml`'s no-Worker-in-the-
pipeline rule — that rule is about the extraction producing every number on the
site, and a trigger computes nothing.
Kevin: *"let's stay with the 90 percent plus and see how we do with these other
updates. then we can see how the regular season starts out and then decide on if 3
is needed or not."*


## ⚠️ 2026-10-05 — A RED INGEST THAT WAS NOT THE INGEST

Kevin: *"there was a failed ingest at 3:18 eastern this afternoon, can you look
into that please."* Run `37362517481`, 19:18:55Z.

**The `ingest` job was green through all seventeen steps and published.** The
`measure` job behind it **never got a runner** — `runner=` empty, zero steps
recorded — sat fifteen minutes to the second, and GitHub cancelled it, which
takes the whole run red. **Not our code**, and not the shape of the September
halt. It derived one game, so the cost is that one amendment's measurement did
not land; the next run with work to do carries it.

⚠️ `tools/measured-through.mjs` stayed ✅ throughout, and that is correct rather
than lucky: the amendment was a RECLASSIFICATION inside an already-counted game,
not a new game, so a date-and-count gate cannot see it.

✅ **WHAT WAS FIXED** (`e4835db`): `measure` was gated on
`needs.ingest.outputs.synced`, and that flag means **THE SYNC STEP RAN** — it is 1
on a run that walked the window and found every game already current. **Two of
that day's six runs derived nothing and still spawned a job that pulled 373 MB of
extracts, ran `npm run gates`, and committed an identical file.** It now also
requires `changed`, read from the derive report's own `run.derived`.

⛔⛔⛔ **IT DOES NOT PREVENT THE FAILURE THAT PROMPTED IT**, and two earlier
versions of the fix were wrong — see [[mechanize-the-review]] #70, which is the
part worth re-reading: *a string in a log is not a thing that happened*, and *a
gate whose condition can never be false ships inert*.

⭐ **WHY IT STILL MATTERS.** Every pointless job is a fresh chance for an
infrastructure cancellation to paint the ingest red for nothing, and **a red
ingest that means nothing teaches us to stop reading red ingests** — which is
exactly how the 31-hour halt above went unquestioned.

## ⭐ AND THE LEAGUE AMENDS GAMES THAT ARE ALREADY PUBLISHED

Found while chasing the above, and priced for the first time: on a day when
`fetched: 0`, the window still reported `derived: 7`, `2`, `4` and `1`. Two shot
attempts moved from `missed-shot` to `shot-on-goal` **in already-published
games** between two runs over the same 4,231. The 14-day window re-derives and
catches them, which is what it is for — and it means **"no new games" and
"nothing changed" are different questions.**

## ✅ BUILT AND PROVEN 2026-09-24 — ⛔⛔⛔ AND THE REASON I GAVE WAS FALSE

**What I reported at 08:47Z:** scheduled `ingest` runs unbroken daily from 09-11
to **2026-09-22T15:25Z**, then no `schedule` event on 09-23 at all and none yet on
09-24. I called it *"the scheduler stopped firing"* and wrote **"sized against
LATENESS, the failure that arrived was ABSENCE"** into `status.md`, `front-door.md`
§6.1.3, a commit message and this file.

⛔⛔⛔ **MY OWN COMMIT IS THE EXPLANATION.** The three-cron change landed
**2026-09-23T13:08Z**, replacing `0 11 * * *`. That day's 11:00 entry had not yet
fired — median +3.9h puts it near 14:50Z — and all three new entries had already
passed for the day. **Replacing a schedule mid-day produces a day with no
scheduled run, and needs no scheduler fault.** 09-24's runs did land: **12:46Z and
13:50Z, +5.4h and +4.9h**, inside the 14:00 deadline, the second by four minutes,
both inside the measured +0.3h–10.3h.

⭐⭐⭐ **THE SHAPE, AND IT IS A NEW ONE FOR ME: I ASSUMED THE FLATTERING DIRECTION
ON A SILENCE.** [[verify-inherited-claims]] says a disagreement has a direction and
I take the one that flatters. Here there was no disagreement — there was an ABSENCE
of runs, two readings fitted it (*the scheduler is broken* / *I edited the schedule
yesterday*), and I took the one that made the build I was about to start urgent.
⭐ **An absence is where this is hardest to catch, because there is no second
figure to compare against.** The check I did not run: `git log -- the workflow
file` before blaming the platform that reads it.

✅ **THE WORKER IS STILL THE RIGHT BUILD, on the case that survives** — a throwaway
cron fired **14:51:03Z**, GitHub created the run **14:51:05Z: two seconds**, versus
+4.9h the same afternoon. That is an argument about owning a TAIL that left four
minutes of margin, not about a broken scheduler.

**`worker/trigger.js`** — a Cloudflare cron POSTing `workflow_dispatch` at
**06:47 and 08:17 UTC**. On the site by ≈06:55 UTC = **02:55 EDT / 01:55 EST**,
and the margin is the same in winter because every figure in §6.1.0 is UTC. ⭐ The
second fire is not redundancy against a scheduler we now control: it covers the
one input in that table **nothing has measured** — how long the league takes to
finalise a feed after the horn.

⛔ **`ingest.yml`'s three crons STAY, and the reason is written where someone
would go to tidy them:** they keep the site current on the day the Worker's token
expires. **The Worker's failure is SILENT by construction** — a 401 is covered by
the fallback, so the freshness line never trips and nothing says the fix we built
stopped working. That is the safe direction, and it is why `trigger.yml`'s last
step asserts a token is BOUND to the Worker (`wrangler secret list` prints names,
never values) instead of trusting the deploy.

⏭ **TWO STEPS ARE KEVIN'S, IN THIS ORDER.** (1) `CLOUDFLARE_API_TOKEN` needs
**Workers Scripts:Edit** — the existing one was made for Pages and the first
deploy said so: *"No access to the specified resource."* It is first because the
Worker must EXIST before a secret can be attached to it. (2) a fine-grained PAT,
`actions: write` on this repo only, bound as a Worker secret named `GITHUB_TOKEN`
**in the Cloudflare dashboard** — not routed through Actions, which would store a
GitHub credential in GitHub to hand it to Cloudflare. ⭐ **The deploy is red until
both happen, by design.**

⛔⛔ **AND NOT WITH `wrangler secret put` — I wrote that into three files before
checking it.** Wrangler 4.x refuses to start below **Node 22** and the dev machine
is pinned to **20**, because that is the runtime the suite is tested against.
`deploy.yml` has opened with that exact sentence since the day it was written, in
the paragraph explaining why the site is published from CI rather than a laptop.
⭐⭐ **A constraint already written down in this repo is still an inherited claim,
and the fact that I had READ the file it is in did not make me check it.** See
[[verify-inherited-claims]].

⭐ **The dispatch route is PROVEN, not assumed:** a manual dispatch on 09-24 went
from `gh workflow run` to `in_progress` in under twelve seconds, against a
schedule that had not fired in two days.

⛔ **One limit no schedule can fix.** A vocabulary halt refuses to publish anything,
by design — three nights in September 2026 alone, including the one that left the
site a day stale while the preview page was being built. The target is a target for
a healthy pipeline. See [[season-restart-traps]].


## ⚠️ Two things learned deploying it, neither of them in any doc

- **A newly registered Cloudflare cron needs some minutes to take.** A cron set
  nine minutes out never fired; the retry at nineteen minutes did. One
  observation, not a measurement, but plan leads accordingly.
- ⛔⛔ **A resource that does not exist yet does not refuse your write.** The
  `GITHUB_TOKEN` secret was added before the Worker's first successful deploy, so
  it landed on the **Pages project one row away** in the same Workers & Pages
  list, which accepted it and displayed it. `wrangler secret list` returned `[]`
  against a Worker that had deployed cleanly seconds earlier. ⭐ The neighbour
  takes the write and looks right.


## ⛔⛔⛔ 2026-09-25 — THE SLA'S REAL ENEMY WAS NOT LATENESS, IT WAS A HALT

The Cloudflare trigger fixed lateness: it fires the run in two seconds. What
stopped the archive reaching readers for **31 hours** was a penalty descriptor.
`derive.py` alarms on a name it has never seen, `ingest.yml` ran it as an
ordinary step, so a non-zero exit halted the job and `sync to R2` never ran. The
games were fetched, derived and thrown away, five runs in a row.

⛔ **AND IT WAS THE FOURTH TIME** — 09-19, 09-21, 09-23, 09-25. The first three
fixes added the word and touched no workflow. See [[mechanize-the-review]] §145:
on a second occurrence, ask what you FIXED and what you PAID.

✅ **FIXED AS A CONTRACT:** derive exits **2** for "published, a label needs a
human" and **1** for "do not trust this output"; both workflows read it and alarm
AFTER their sync; `test/workflows.test.js` compares the step positions. A comment
cannot fail, which is why this survived six days of being readable.

⚠️ **WATCH FOR:** `charging` appears in none of the three full seasons archived.
Either the regular-season feed spells it differently or the league changed its
descriptors this preseason — the second means more are coming, every night, all
season.


## ✅ 2026-09-28 — WHAT THE HALT WAS ACTUALLY COSTING: twenty-nine

The halt came off on 09-25 (derive exits 2, publishes, the RUN goes red after).
The first full archive sweep under that contract — 4,618 games — reported **29
unseen penalty descriptors in one list**. Every previous drift report had been a
report of ONE, because the pipeline stopped at the first unknown word.

⭐⭐⭐ **A GUARD THAT ABORTS ON ITS FIRST FINDING IS AN ALARM WITH NO DIAL.** It can
tell you something is wrong and never how much. Four nights were spent fixing one
word each and concluding the vocabulary had drifted by one word.

⭐ **AND IT ANSWERED THE `charging` QUESTION, in the opposite direction to the one
the comment leaned.** That comment asked whether the league had changed its
descriptors this preseason, *"because the second means more are coming."* They had
already come: `spearing`, `checking-from-behind` and `illegal-check-to-head` are
ordinary regular-season infractions sitting in three full seasons of archive,
never vetted. **The vocabulary did not drift — it was never fully walked.**

⚠️ **MEASURED BEFORE FIXING**, so the size is on the record: 175 games sampled
across the published archive hold 1,274 penalties, **8 with no prose — 0.6% of
penalties, in 8 of 175 games (4.6%)**. About one game in twenty-two showed a
reader `illegal-check-to-head` instead of words; that one descriptor is half the
eight. ⚠️ The first measurement said 0.0% because it read `descKey`; the extract
field is `pen`. Corrected before quoting — [[verify-inherited-claims]], and the
error pointed the flattering way.

⛔ **AND I MADE THE MISTAKE THE TABLE WARNS ABOUT, one minute after quoting it.**
Wrote `head-butting-double-minor` in on the pattern; the sweep never reported it.
**Plausible is the disqualifier** — a key added because the pattern suggests it is
a key the alarm can never tell us about. `test/render-penalties.test.js` already
held `PEN` and `KNOWN_PENALTIES` to each other in both directions and named it, so
no new gate was needed. See [[mechanize-the-review]] §20.


## ⛔⛔⛔ THE NIGHTLY CANNOT RE-DERIVE THE ARCHIVE, AND I TOLD KEVIN IT WOULD

2026-10-07. A schema bump (`extract.SCHEMA`) is what forces a re-read — `derive`
skips a game only when its raw digest AND `ex` both match. I said *"the next run
re-derives all 4,661 games"*. **False.**

| | `ingest.yml` (nightly) | `derive.yml` |
|---|---|---|
| pulls | **pointers only**, a few hundred bytes a game | the whole raw archive |
| derives | only games it fetched raw for | everything, no window |
| trigger | Cloudflare worker + three fallback crons | `workflow_dispatch` + `47 15 * * 1` |
| run time | minutes | the better part of an hour |

⭐ So a nightly reports `absent: 4670` in the steady state and that is HEALTHY —
*"calling that an error would make every healthy run report fifteen hundred
failures."* The tell that the bump had not landed was data, not logs: a 2026 game
carried the new key and a 2023 game did not.

⚠️ **A full derive is safe to dispatch outside the delivery window** — it shares
the `ingest` concurrency group, so never near 10:00 Eastern. Checked before each
dispatch: today's ingest completed, all three fallback crons passed, nothing in
flight.


## ⛔⛔⛔ A NEW DOCUMENT IS NOT PUBLISHED BY DEFAULT — 2026-10-07

`players.json` was written by `measure.mjs`, the suite was green, a full
`derive.yml` ran for an hour and reported **success**, and the site answered
**404**. The upload step is a shell `for f in catalog.json measures.json
teams.json index.json` — a typed list of the documents that existed when somebody
wrote it.

✅ **`test/workflows.test.js` now DERIVES the publish set from the writer**:
whatever `measure.mjs` writes into `--out` must appear in some workflow's upload
list. It reads the `for f in …` lists and not the whole file, because a name in a
comment or an `--exclude` is not a name that gets uploaded. See
[[mechanize-the-review]] #75.

⚠️ **AND THE NIGHTLY MUST NOT PUBLISH IT.** The slate path returns before
`players.json` is written, which is correct: a players document describing one
night would be a card about three games. So those figures move WEEKLY.

## ⚠️ GITHUB DELIVERS A SCHEDULED RUN HOURS LATE

2026-10-07: I cleared a manual derive on the grounds that all three ingest crons
(`23 7`, `53 8`, `23 10` UTC) had passed. GitHub then delivered the 10:23 run at
**14:35 UTC — four hours late**, while the derive was running.

✅ **No harm, and the reason is the concurrency group**: `group: ingest` with
`cancel-in-progress: false` queued it behind the derive instead of colliding over
R2. ⭐ **But "the crons have passed" is a weaker guarantee than it sounds** — a
GitHub schedule is best-effort, so the concurrency group is the real protection
and the cron times are only a hint.

## ⛔⛔⛔ THE GAP BETWEEN TWO WRITES — 2026-10-07

The refresh step in `ingest.yml` does two things in one step, in this order:
**publish the measurement to R2**, then **commit `data/measures.json` to git**.
The 15:49 run published the amended measurement and then **failed at the health
block before the commit** (correctly — the suite was red, and *a pass count
measured while the suite is red is a figure that was never true*).

Result: the origin moved, the repo did not, and **nothing was red about it.**
`npm run gates` passed on the stale repo because nothing in `gates` reads the
origin, so the deploy shipped `slot.html` baking **171,027** attempts while the
front door FETCHED **171,026** — which is exactly what the first outside reviewer
saw hours earlier ([[outside-review-grok]]).

⭐⭐ **THE SHAPE: A STEP THAT WRITES TO TWO PLACES HAS A FAILURE WINDOW BETWEEN
THEM, AND THE ONLY GATE THAT COULD SEE IT LIVED INSIDE THAT STEP.**
`tools/measures_fresh.py` was called from the same step, AFTER
`cp ingest/measures.json data/measures.json` — so it compared a file the step had
just overwritten against the document that file came from. It could only catch a
failed PUBLISH, never a stale repo, which is the one case its own error message
tells a human to fix. **Ask what a check's INPUT is at the moment it runs, not
what it compares.**

✅ **FIXED, THREE POSITIONS AND THREE DIFFERENT QUESTIONS:**

- **`deploy.yml` HARD FAILS** — the load-bearing one. No page may bake a figure
  the published archive contradicts, and a deploy already needs the network.
- `ingest.yml` runs `--report` **BEFORE** the copy. The step's job is the repair,
  so a gate in front of it that exits 1 would stop the repair.
- `derive.yml` keeps its hard fail after publishing; derive never commits, so
  there a drift is a true alarm for a human.

⚠️ **NOT IN `npm run gates`, DELIBERATELY.** `gates` must run with no network —
`tools/box-witness.mjs` states that policy — and a check that silently passes
when it cannot fetch is Shape 10. A failed FETCH now exits **2** with its own
sentence, and `--report` softens a drift, never a dead origin.

⭐ My own comment claimed "exit 2" beside a `sys.exit("string")`, which exits 1.
The test asserted the 2 the comment had promised and caught it — *name the
property the claim is about, then check THAT one*, applied to my own prose.
