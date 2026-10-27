---
name: learn-door-resolution
description: "⚠️ 2026-08-31 — the playable timeline was stated THREE times and the third copy drifted: a learn door asked for an occurrence the replay does not have, the app clamped, and two cards opened the identical frame. The guard missed it by counting the wrong denominator."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T07:54:44.491Z
---

Commit `56fb57e`. Found while building the icing diagram, by asking a question
nobody had asked: *does the door actually land where the card says?*

## ⭐⭐ THE ROOT CAUSE: ONE RULE, THREE STATEMENTS
- `src/lib/layer.js` owns `NOT_A_PLAY` with its reasons.
- `src/app.js` typed the same five literals into a `SKIP` set.
- `builders/learn-doors.mjs` assumed a THIRD version by counting an event's
  occurrence over the **raw** list.

The first two agreed **by luck**. The third did not, and `format` counts within
whatever list it is handed:

- **faceoffs asked for occurrence 2 at P1 15:02, where the replay has ONE frame.**
  The app clamped, and the icing card and the faceoffs card opened the IDENTICAL
  frame — the exact *"cards sharing a moment has no symptom at all"* defect
  `learn-doors.mjs`'s own header was written to prevent, arriving through the
  ORDINAL instead of through the choice.
- **icing, offside and penalties each name an event that is NOT PLAYABLE**, so
  they landed wherever the arithmetic reached. Twice right by luck; the penalties
  clock has **no playable frame at all** and the app fell forward.

## ⚠️ THE GUARD MISSED IT BY COUNTING THE WRONG DENOMINATOR
*"every door lands on a moment the game actually contains"* filtered
`rich.events` — every event, including the ones the replay drops — while the app
indexes the **playable** list. **Ask what a drift alarm's denominator is.**

## The fix, at each level
- `playable(events)` joins `NOT_A_PLAY` in `layer.js`; `app.js` DERIVES `SKIP`.
- A door resolves on that timeline. A rule firing on an unplayable event maps
  **forward** to the first frame after it — for a stoppage, the restart it forces.
  `via` records the hop instead of hiding it.
- `type` in the committed document is the **frame's**, not the rule's. It recorded
  `stoppage` for a door that opens a face-off: the artifact asserting something
  untrue about where it goes.

## ⭐ A TEST WAS ASSERTING SOMETHING FALSE, and Kevin's ruling replaced it
It said the face-off was *"later in the sequence at that clock"* (`fo.at.n >
ice.at.n`) — true of the raw ordinals, never true of the replay. Kevin:
> *"Option B, the pairing between icing and the faceoff is the teaching moment,
> those should stay paired."*

So it asserts **ONE frame, two lessons** — and derives that frame from
`icingRestarts` rather than from the two doors agreeing with each other, which
would prove only that they agree.

## ⭐ A GUARD BECAME UNNECESSARY AND WAS REPLACED RATHER THAN DELETED
`hero-loop.test.js` compared app.js's literal SKIP against `NOT_A_PLAY`; with
SKIP derived they cannot disagree **by construction**, so what is asserted now is
the DERIVATION — a literal set creeping back is the regression. ⛔ **The eight
hand-typed copies in the tests STAY**: an independent restatement is what a test
is for, and importing the implementation's own model of its input is the failure
mode this repo keeps paying for.

## ⏸ Still open
**The penalties card promises a gap the replay cannot show.** *"This is that gap —
the delayed call, before the whistle"*, and the door lands on the PENALTY BEING
CALLED. In the reference game the gap contains **zero recorded events**. Same
class as offside's crossing — reword it, or give it a diagram. Kevin's call.

Related: [[rule-diagrams]] · [[mechanize-the-review]] · [[guard-where-the-archive-is]]
