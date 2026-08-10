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
