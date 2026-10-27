---
name: faceoff-share-null-result
description: "Faceoff share is the site's cleanest null — the leader wins 50.4% of games — and the open question is whether OZ/DZ draws hide a real effect"
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-18T13:59:09.030Z
---

**Kevin, 2026-08-18, mid-thread on the whistle cards:** *"Is there any benefit to
tracking faceoff winning percentage (as a team) and does it impact the final
score? Probably a nothing-burger."*

**Measured, and the nothing IS the finding.** 819 decided regular-season and
playoff games from the on-disk working set, ≥10 faceoffs each:

> **The team that won more faceoffs won the game 50.4% of the time.**

And it does not improve with dominance — margin 1–3: 53.1%, 4–7: 49.2%, 8–14:
49.0%, **15+: 50.6%**. At this n, 50.4% is indistinguishable from a coin flip
(±1.7 points).

**Why that is worth publishing rather than discarding.** Beside what the site
already carries, it is the sharpest number we have:

| measure | the leader's fate |
|---|---|
| shots on goal | wins 54.2% |
| shot attempts | **loses 54.5%** — the front door's thesis |
| **faceoffs won** | **50.4% — nothing at all** |

Shot attempts anti-predict. Faceoff share does not even do that, and it is on
screen every broadcast. Same teaching shape as the front door, one step further.

## Two honesty constraints, agreed before any build

1. **Never "faceoffs don't matter."** What was measured is that the *aggregate
   leader* wins half the time. A defensive-zone draw on a penalty kill can matter
   enormously without moving that number. Publish the count, never the conclusion.
2. **The 50.4% is not an archive figure.** It came from a 852-game working set,
   not the pipeline. Like every other base rate it has to come through
   `measure.mjs` over all 4,417, and may land a point or two either side.

## ⭐ THE OPEN QUESTION — parked for a future discussion, Kevin's call

**Do offensive- and defensive-zone faceoffs behave differently from the
aggregate?** That is where a real effect could hide, and the aggregate would mask
it by construction.

This is newly answerable because of the zone-start work in [[hockey-legibility-build]]:
**the coordinate IS the dot** — 52,742 of 52,742 faceoffs carry coordinates
across all 715 dates — so OZ/DZ needs no threshold and no model. `own` on a
faceoff is always the winner, verified 11,246 of 11,246 (`extract.py` maps
`actor` to `winningPlayerId`).

Cheap to measure and NOT yet measured. Do not assert anything about zone faceoffs
until it is — see [[verify-inherited-claims]].

## ✅ 2026-08-30 — THE NULL IS EXPLAINED, AND IT IS CANCELLATION
The parked question (*"do OZ/DZ draws hide a real effect?"*) is **answered**.
Over 237,502 draws: offensive-zone win returns **2.395×** the opponent's
attempts, neutral **1.132×**, defensive **0.712×**. **The season total adds up
quantities with opposite signs**, so 50.4% is not emptiness — it is the sum
cancelling. See [[census-archive-answers]] for the full table and the control.
