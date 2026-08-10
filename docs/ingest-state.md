# Ingest state — what the index records, and what the front page says

**Status:** design, for CHENG's review. Not built.
**Date:** 2026-08-10
**Amends:** `docs/nightly-ingest.md` §Staleness on screen, which specified a single
`lastIngest` field. That field is live and this document argues it is wrong.

---

## The defect, with the evidence

`lastIngest` was specified to make a stalled pipeline visible: carry it in the
index, render *"Data through August 8,"* and a stall becomes something users and
we can see without a monitoring service existing.

The mechanism is right. The **single field cannot carry it**, which showed up the
first time the pipeline ran twice.

```
run 1   rehydrated 0 pointers   fetched 6   index lastIngest = 2026-08-10T07:59:33Z
run 2   rehydrated 6 pointers   fetched 0   index lastIngest = 2026-08-10T07:59:33Z
```

The second run was **completely successful** — it checked the window, confirmed
all six games were current, and correctly wrote nothing. And the field that is
supposed to prove the pipeline is alive did not move.

This is not a bug in the implementation. The implementation follows the design,
including the deliberate rule that an empty night writes no index at all, whose
stated justification was:

> Rewriting the index every run would make `lastIngest` advance while the
> pipeline was silently fetching zero games, which is the precise failure
> staleness-on-screen exists to expose.

That reasoning is sound **for a field meaning data freshness** and wrong for a
field meaning pipeline liveness. `lastIngest` was quietly asked to mean both.

## Why one field cannot work

The two meanings diverge exactly when it matters:

| Situation | Data freshness | Pipeline liveness |
|---|---|---|
| Season, ingesting nightly | current | current |
| **Offseason, ingesting nightly** | **months old — correctly** | **current** |
| **Season, pipeline dead** | **days old — alarmingly** | **days old** |

Rows 2 and 3 are indistinguishable through a single field, and they are opposite
conditions: one is the system working perfectly, the other is it being broken.
Today — 10 August, no NHL games within reach — a healthy nightly run leaves the
date frozen indefinitely, and the front page would claim staleness that does not
exist. Come October, a dead pipeline would look identical.

**A signal that cannot separate "nothing to do" from "not working" is not a
health signal.**

---

## The proposed state

Three facts, each independently observable, none derived from the others:

```json
{
  "lastRun":     "2026-08-10T11:00:04Z",
  "dataThrough": "2023-11-10",
  "coverage":    { "finalInWindow": 6, "heldInWindow": 6, "windowDays": 14 },
  "games":       [ { "id": 2023020204, "date": "2023-11-10" } ]
}
```

### `lastRun` — when the pipeline last completed without halting

- **Type:** RFC 3339 UTC instant.
- **Advances:** on every run that completes, *including one that fetches nothing.*
- **Does not advance:** on a halted run (a vocabulary change across games), because
  that run did not establish the window's state — it refused to look.
- **Answers:** *is anything still running?*

A run with per-game fetch errors **does** advance it. Those games wrote nothing
and are counted in `coverage`; the pipeline itself worked.

### `dataThrough` — the date of the most recent game held

- **Type:** calendar date, `YYYY-MM-DD`, as the NHL's schedule states it.
- **Advances:** only when a game with a later date is stored.
- **Answers:** *how recent is the hockey?*

**It is a game date, not a timestamp, and the distinction is load-bearing.** The
schedule's date field is the league's own labelling of which day a game belongs
to. Deriving it from the ingest clock instead would put a game that started
22:00 Pacific on the following UTC day and quietly mislabel every late West Coast
game. We take the league's answer.

### `coverage` — what the window expected against what we hold

- **`finalInWindow`** — games in the current window whose `gameState` is in
  `FINAL_STATES`. From the schedule.
- **`heldInWindow`** — how many of those we actually have.
- **`windowDays`** — the window used, so the other two numbers have a scope.

This is the field that makes the other two safe, and it costs nothing because the
schedule was already fetched to find the games at all. **It distinguishes "quiet
because no hockey was played" from "games happened and we do not have them"
without guessing at either.** A silent night in August has `finalInWindow: 0`; a
broken fetch in January has `finalInWindow: 7, heldInWindow: 3`.

It matters doctrinally too. Saying "we are behind" requires knowing what we
should have, and the only honest source for that is the league's own schedule —
not an assumption about how many games a Tuesday usually has.

---

## The states, and what each one says on screen

| `lastRun` | `finalInWindow` vs `heldInWindow` | State | Front page |
|---|---|---|---|
| recent | equal, > 0 | **healthy, in season** | Data through 8 August. |
| recent | equal, = 0 | **healthy, no games** | Data through 10 November 2023. No games in the last 14 days. |
| recent | held < final | **behind** | Data through 8 August. 3 of 7 recent games are still loading. |
| stale | any | **stalled** | Data through 8 August. Last checked 4 days ago. |
| — | no index at all | **empty** | No data loaded yet. |

Three properties of that copy, deliberately:

**Every line states a fact, never a diagnosis.** "Last checked 4 days ago" is
observable. "The pipeline is broken" is a conclusion we would be drawing on the
reader's behalf, and it might be wrong — GitHub could be down, or the season
could have ended. The reader can conclude; we report. (Doctrine §3, and the same
reason `whyNotEven` states skater counts rather than intent.)

**`dataThrough` is always shown, in every state.** It is the honest headline
regardless of health, and it is the number a reader actually wants.

**"Last checked" appears only when stale.** Otherwise it is noise — nobody needs
to be told the pipeline ran an hour ago.

### The one threshold, and it is policy

"Stale" needs a number. It is the only judgement here, so it should be a single
named constant in one place, not a comparison inlined at a call site.

Proposal: **36 hours.** The job runs every 24, so 36 tolerates one missed run
plus a delayed retry without crying wolf, and catches two consecutive failures.
It is a guess about our own tolerance rather than a fact about hockey, and it
should be labelled as such where it lives.

---

## What this changes in the implementation

| Change | Detail |
|---|---|
| `fetch_nhl.py` | write the index on **every** completed run, not only when data changed |
| | drop the empty-night rule and its test — it exists only to protect the conflated field |
| | count `finalInWindow` during classification, where the schedule is already parsed |
| | compute `dataThrough` from stored games' schedule dates |
| `build_index.py` | render the state; `dataThrough` always, "last checked" only when stale |
| index schema | `lastIngest` → `lastRun` + `dataThrough` + `coverage` |

### Migration

One index exists, holding six games and a `lastIngest`. The reader should treat a
missing `lastRun` as unknown and say so rather than substituting `lastIngest`,
which would silently reassert the conflation this document removes. The next run
writes the new shape; the transitional state lasts one run and should still be
handled, because "it will be fine after the next run" is how a broken empty state
ships.

### Tests this needs

1. A run that fetches nothing still advances `lastRun` — **the regression this
   whole document is about.**
2. A halted run does **not** advance `lastRun`.
3. A run with per-game errors **does** advance `lastRun`, and `heldInWindow`
   reflects the shortfall.
4. `dataThrough` comes from the schedule's game date, not the run clock — pinned
   with a late game whose UTC date differs from its game date.
5. `dataThrough` never moves backwards when an older window is backfilled.
6. `finalInWindow` counts only final games — a window containing scheduled or
   in-progress games does not report itself as behind.
7. The empty state renders without an index present.
8. Mutation: conflating the two fields again (setting `dataThrough = lastRun`)
   must fail the suite.

---

## Open questions for CHENG

1. **Is `coverage` scoped to the window, or all time?** Window is cheap and
   answers "are we behind right now." All-time answers "is the archive complete,"
   which is a different and probably more interesting question — but it needs the
   full season schedule, which is a larger fetch and a different job.
2. **Should `lastRun` advance on a halted run?** I say no: the run refused to
   look, so it established nothing about the window. The counter-argument is that
   a halt still proves the pipeline is alive, and treating it as a stall conflates
   *broken* with *stopped deliberately* — which is arguably the same error this
   document is fixing, one level up.
3. **Is 36 hours right,** and should the threshold be visible to the reader at all
   ("checked every day; last checked 4 days ago") rather than only implied by
   the message appearing?
4. **Does "3 of 7 recent games are still loading" overstate?** They may be
   loading, or they may have failed permanently. "Still loading" implies progress
   we cannot promise. "We have 3 of the 7 games played in the last 14 days" is
   duller and strictly true.
5. **Should the halted state say so on the front page?** It is the most
   informative thing we could tell a reader — *the league's feed changed and we
   stopped rather than guess* — and it is the single best advertisement for the
   vocabulary gate. But it also puts an internal failure in front of a novice
   who came to watch hockey.

---

# Amendment — after CHENG's review, 2026-08-10

## Q2 — conceded. I re-derived my own bug one level up.

The argument that settles it is the shape of the two definitions side by side:

> `lastRun` — when the pipeline last completed **without halting**
> `dataThrough` — the date of the most recent game held

**One has an embedded exception and one does not, and a definition with a
carve-out is a conflated field** — which is the exact diagnosis this document
makes about `lastIngest`. Applying the document's own test: *a signal that cannot
separate "nothing to do" from "not working" is not a health signal.* A halted run
is a third condition — **working, looked, and deliberately stopped** — and under
my proposed rule it would be byte-identical to a dead pipeline. Those are
opposite conditions, precisely like rows 2 and 3 of the table that motivated the
redesign.

My objection was also true: a halted run did not establish the window's state, so
advancing a field that implies coverage is current would lie. **Both being true is
the signature of another conflation, and the answer is another fact rather than a
choice.**

## The state, revised

```json
{
  "lastRun":     "2026-08-10T11:00:04Z",
  "dataThrough": "2023-11-10",
  "halted":      { "since": "2026-08-09T11:00:07Z",
                   "reason": "gameState 'PPD' appeared in 4 games" },
  "coverage":    { "finalInWindow": 7, "heldInWindow": 3, "refusedInWindow": 1,
                   "windowDays": 14, "asOf": "2026-08-08T11:00:03Z" }
}
```

- **`lastRun`** — the pipeline executed. **Always advances**, including on a halt.
  A halt is running.
- **`halted`** — `null`, or when and why it stopped on purpose.
- **`coverage.asOf`** — when coverage was last actually established, so figures
  from before a halt cannot read as current.

Four independently observable facts, none derived from the others. That was this
document's stated principle; it now survives one level deeper.

## The `refused` vs `missing` finding — accepted, and it is the same bug again

`heldInWindow` counts games we hold. A game that failed its vocabulary gate
publishes nothing, so it is not held — and would render as:

> Data through 8 August. 3 of 7 recent games are still loading.

**That game is not loading. It will never load.** It was deliberately refused,
and the copy tells a novice to wait for something that is not coming while the
informative state stays invisible. One count asked to mean two things that
diverge exactly where it matters: *fetch failed, a retry may fix it* and *we
understood the feed well enough to refuse it* are opposite conditions with
opposite implications for the reader.

So `refusedInWindow` joins `heldInWindow` as a peer, and:

```
finalInWindow = heldInWindow + refusedInWindow + missing
```

**This is a conservation property, and it is the same ledger as
`counted + excluded` in the layers.** It is testable, mutation-provable, and it
fails loudly rather than silently mis-reporting — which is what the layer ledger
already buys us one floor down. Consistency here is free.

## The week/window boundary — real hazard, and the code was already right

CHENG's finding: `finalInWindow` is assembled from seven-day week responses whose
edges do not align with a 14-day window, so counting the games in the
**responses** rather than the games in the **window** overstates permanently.

**Measured against the live feed, the magnitude is not subtle:**

| | |
|---|---|
| window | 2023-11-10 … 2023-11-12 (3 days) |
| schedule calls | 1, returning 2023-11-10 … 2023-11-16 |
| games in the returned week | **47** |
| games actually in the window | **23** |
| `classify()` returned | **23 final** — filters correctly |

Had it counted the response, coverage would have read *23 of 47* — a permanent
phantom shortfall of 24 games. In season nobody notices, because a busy schedule
makes the wrong number plausible.

**`classify()` already takes a `dates` argument and filters on it, so the
behaviour was correct — and completely untested.** That is the "passes by
accident" case, and the fix is the test rather than the code. Two added, both
mutation-proven by disabling the filter:

- a week overhanging the window on both sides contributes only in-window games
- an out-of-window game with an unknown state is **not** counted as refused
  either — leaking it into `unknown` would halt the run on a vocabulary change
  in a week we were never asked to ingest

## The remaining questions, resolved

**Q1 — archive completeness is a separate weekly job.** All-time coverage is the
more interesting question and does not belong on the critical path of a freshness
check. The full season schedule is ~28 week-calls: trivial weekly, wasteful
nightly.

**Q3 — 36 hours stands, and the cadence is shown with it.** *"Last checked 4 days
ago"* is uninterpretable without knowing what normal is — the reader cannot tell
whether that is alarming. **This is the base-rate principle from the goalie card,
turned on our own reliability**, and Doctrine §8 says a rate without a base rate
is a story. So: *"Checked daily. Last checked 4 days ago."*

**Q4 — "still loading" overstates, take the duller sentence.** It promises
progress we cannot guarantee, which is the same class of error as *"Buffalo had
stopped trying to score"* — a claim about a future or a motive rather than a
count. With `refusedInWindow` split out, the honest line finally exists:

> We have 3 of the 7 games played in the last 14 days. 1 is not published — the
> league's feed contains something we don't recognize.

**Q5 — yes, the halt goes on the front page.** The alternative is knowing our data
is incomplete and not saying so, which is the one thing this project has never
done. Stated as a fact rather than an apology it reads as competence:

> **Updates paused 9 August.** The league's feed contains an event type we don't
> recognize yet, so we stopped rather than guess.

## Tests, revised

Replacing items 1–8 above:

1. A run that fetches nothing advances `lastRun` — the original regression.
2. **A halted run also advances `lastRun`** (reversed from the first draft), and
   sets `halted`.
3. A halted run leaves `coverage.asOf` **behind** `lastRun`.
4. A run with per-game errors advances `lastRun`; `heldInWindow` reflects it.
5. `finalInWindow == heldInWindow + refusedInWindow + missing` — conservation,
   in every state including halted.
6. A refused game is counted in `refusedInWindow` and never in `missing`.
7. `dataThrough` comes from the schedule's game date, not the run clock.
8. `dataThrough` never moves backwards when an older window is backfilled.
9. ~~A week overhanging the window does not inflate the count.~~ **Done** —
   `test_fetch_nhl.py`, mutation-proven.
10. Mutation: `dataThrough = lastRun` must fail.
11. Mutation: folding `refusedInWindow` back into `missing` must fail.
12. The empty state renders with no index present.

## Doctrine

CHENG proposes the migration reasoning belongs in `DOCTRINE.md`:

> **"It will be fine after the next run" is how a broken empty state ships.**

Agreed. It generalises past migrations — it is the same failure as a gate that
only passes on a warm cache, or a page that only renders once localStorage has
been written.
