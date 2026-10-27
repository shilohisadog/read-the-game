---
name: power-play-endings
description: "★ 2026-08-31 — one power play in FIVE ended in silence because a reducer refused a fact on the grounds that 'the goal caption owns that frame anyway'. Kevin found it and MISREAD it, which is the evidence. Plus: a whistle outranks a clock, and the chip must name its own verb's subject."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T07:54:24.045Z
---

Commit `123c054`. Kevin, watching the hero game and then the whole game:

> *"CAR is on a power play, then the next event is a CAR goal, nothing shows the
> power play is now over (because the team scored), that's a gap I think."*

## ⭐⭐ HE IS RIGHT, AND HIS MISREADING IS THE EVIDENCE
On his own specimen (`2025030414`, P1) the VGK tripping penalty ran **s=84 to
s=204 and ended ON THE CLOCK**; the goal was at **s=208**, four seconds later, at
even strength. The goal did not end the power play.

**A page silent about a rule led a viewer who knows the sport cold to infer the
wrong one.** A novice would infer the same and learn something false. That is a
stronger argument for the fix than the missing caption ever was.

## Two separate gaps
1. **A kill displaced by a goal on the same frame** — the caption EXISTED and was
   thrown away, because a goal outranks a kill and owned the frame.
2. **A power play that ends BECAUSE of a goal** — no caption at all. Refused by
   `penaltyKilled`, whose own docstring said why: *"the power play was scored on,
   and the goal caption owns that frame anyway (69 of 327, 21.1%)."*
   ⭐ **The first half is a fact about hockey. The second was an assumption about
   PRESENTATION living inside a reducer — and it was exactly backwards.** The goal
   caption owning the frame is the REASON better than one ending in five was
   unsaid.

## ⭐⭐ A WHISTLE OUTRANKS A CLOCK — and it reverses my own ordering of the same day
Icing sat UNDER the kill on a rarity argument (3.3/game vs 7.8). Both halves of
that are still true and the order was still wrong, for a reason only available
after the pill shipped: **the pill already carries the condition**, so the kill
caption amplifies a signal the page gives anyway, while a rule restart has no
other surface at all. And the wrong order is **actively misleading**, not merely
silent: *"Penalty killed"* on a face-off offers an explanation for a whistle it
did not cause, and no expiry produces a face-off.

Cost as a COUNT, not a rate: **1 of 4** kill captions displaced in the reference
game. ⚠️ **The collision is coincidence, not structure — I assumed the opposite
and measured**: only 1 of those 4 kills lands on a face-off at all, because a
penalty usually expires during live play. And **the old order had NEVER RUN** —
0 of 8 icing restarts collide — so it read as a decision and was an untested
preference.

## What was built
`powerPlayOver` is the primitive; `penaltyKilled` is it filtered to `by==='time'`.
A power play scored on is the OPPOSITE of a kill, so it keeps its own label and
glyph — the shield on a team that just conceded says the reverse of what happened.
`sayAt` defers a transition that surfaces ON a goal by one frame: once, never onto
another goal, never across a period.

## ⚠️ TWO THINGS ONLY FOUND BY READING OR MUTATING
- **The chip named the wrong club.** "Penalty killed" chips the side that HELD;
  "Power play over" is about whose POWER PLAY ended — the other club. Reusing
  `killedBy` rendered **"BUF · Power play over" on a power play that was MIN's**:
  the chip naming the opposite club from its own verb's subject. Same shape as
  the exclusion ledger's *"BUF were on the power play — 4 skaters against 5"*,
  which is why `relativeTo` exists. **No test could have caught it; nothing had
  claimed the chip had a subject to get wrong.**
- **A mutation survived for a FIXTURE reason.** Dropping `OFFSIDE.has(e)` from
  `captioned()` — the seam that makes a silent pause impossible — passed 902
  tests, because the reference game's ONLY offside restarts on the same frame a
  penalty expires, so `KILLED.has(e)` kept the dwell long. The invariant is sound
  and **the fixture cannot express the case**. Asserted structurally instead:
  every map the caption chain branches on must be a term in `captioned()`.

⚠️ **`rich.json` cannot reach the deferral either** — its six transitions land on
faceoffs, hits, blocked shots and a shot on goal, never a goal. Four
constructed-event tests reach it, each refusal paired with the shape that succeeds.

Related: [[rule-diagrams]] · [[teaching-surfaces-shipped]] · [[mechanize-the-review]]
