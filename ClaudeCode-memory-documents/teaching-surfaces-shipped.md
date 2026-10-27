---
name: teaching-surfaces-shipped
description: "★ 2026-08-31, FOUR SHIPPED: the power-play pill on the scoreboard, the penalty-kill caption, the bi-directional learn-card link, and the icing caption + rule lines. ⭐ Kevin's DIRECTION: educational content, work↔cards bi-directional, more teaching in the caption pill. The pill is now a TEACHING surface and can wrap."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-08-31T17:04:08.255Z
---

Four commits, one day, all live and all clicked on production.
`35b0a32` · `4fd71dc` · `6b2bc12` · `180ef6e`. **881 JS + 180 Python tests.**

## ⭐⭐ KEVIN'S DIRECTION, IN HIS WORDS — this is the spine now
> *"What I want to focus on is educational content, aligning show me the work
> with learning cards, and making them bi-directional, adding more learning
> information to the rink (in the caption pill we just leveraged for the penalty
> is over information)."*

All three are now started, none finished. See "what is open" below.

## What shipped

| | |
|---|---|
| **The power-play pill** on the scoreboard (`standing()` in `strength.js`) | a CONDITION that sits still; up on 15.1% of frames, toggles 13.6×/game |
| **The penalty-kill caption** (`penaltyKilled()`) | 3.5/game; closes the **78.6%** of power plays that ended in silence |
| **Bi-directional learn cards** (`cardsFor()` + card anchors) | the work panel ends with a **Learn More** row; every card is anchored |
| **The icing caption + rule lines** (`icingRestarts()`) | 7.8/game; says the CAUSE and the punishment, and lights the two lines |

## ⭐ THE RULES THAT CAME OUT OF IT — reusable, not incidental
1. ⭐⭐ **A CONDITION IS NOT AN EVENT, AND THE INSTRUMENT MUST KNOW WHICH.** I
   scored "standing power play" as if it re-announced every frame (3 sentences,
   20 repeats) and called it wallpaper. Re-scored as a badge that goes on and
   stays on: 15.1% of frames, 13.6 toggles. **Same fact, opposite verdict.**
   Kevin's instinct beat my measurement because my measurement modelled the
   wrong kind of thing.
2. ⭐ **IMPORTANT = A CHANGE OF STATE, NEVER A STATE.** Measured on one fact two
   ways: *standing* PP = 3 sentences × 20 repeats; PP *changing* = 4 × 6.
3. ⭐ **CONDITIONS AND CHANGES NEED SEPARATE SURFACES, and the collision is
   measurable**: 77.6% of power-play windows contain a caption-worthy event, so
   a standing fact in the caption pill would fight it exactly when both matter.
4. ⭐ **RULES ALWAYS SPEAK; MEASUREMENTS SPEAK ONLY WITH THEIR LAYER ON.** Goals,
   penalties, kills and icings caption unconditionally; a slot shot needs `hdOn`.
   A rule applies whether or not anyone opted into measuring it.
   ⚠️ **BUT THE ORDER BETWEEN THEM WAS WRONG AND WAS REVERSED 2026-08-31.** The
   kill outranked icing here on a rarity argument; **a whistle outranks a clock**,
   because the pill already carries the condition and a rule restart has nowhere
   else to go. See [[power-play-endings]].
5. ⭐ **LIST THEM ALL RATHER THAN CHOOSE INSIDE A SET THE DATA DOES NOT RANK** —
   9 learn cards onto 5 layers (Stoppages is taught by four).

## ⚠️ THE PILL IS A TEACHING SURFACE NOW, AND THAT TOOK THREE HIDDEN FIXES
`white-space:nowrap` meant `max-width:92%` could not shrink the pill below its
own text — it overflowed and **the whole page scrolled sideways at 320 and 390**.
Each fix exposed the next: `flex-wrap` folded the sentence into a 160px column
(text wants a line box, not a flex line); `width:max-content` was needed because
an abspos box at `left:50%` shrink-to-fits into **half** the card; and
`box-sizing:border-box`, because the cap **was applying** — computed width 294px
in a 316px card — while 15px of padding each side sat outside it.
⭐ **A max-width the box then exceeds is the most convincing kind of wrong:
present, correct, applied, and insufficient.**
Cost, measured: the icing caption is 2 lines / 32% of the ice at 390 and
**3 lines / 53% at 320.** That is the price of saying both halves on a phone.

## Quotable archive figures (60 games, systematic spread, `v===1`)
- power play: **16.2% of minutes, 20.5% of goals**, 7.60 goals/60 vs 5.01
- power plays **end** 5.1/game; **78.6% end with the penalty simply running out**
- a PP **start** is redundant with the penalty caption: 317/317 have a penalty
  in the preceding frames and the code changes **1 frame / 0 seconds** later
- **four-on-four is EVEN**, so a second penalty darkens the badge (2 of 8 in `rich`)
- icings **7.8/game**; **468 of 469** followed straight by a faceoff; **1 of 469**
  restarts in the neutral zone and names no end
- captioned frames **17.3 → 25.1 a game** (6.7% → 9.7%)
- ⚠️ the unreadable `sit` bucket is **four things**, not "five-on-three
  blindness" as `status.md` §A5.1 says: two-man advantage 34.1%, empty-net
  combinations 29.7%, **3-on-3 OT 25.8%**, shootout 10.4% (n=182)

## ⚠️ THIS LIST IS SUPERSEDED — see [[rule-diagrams]] for what happened next
Three of the five below shipped in the thread that followed:
**offside got its caption**, five cards got **rule diagrams on their own pages**,
and the icing/faceoff DOOR defect underneath them was fixed
([[learn-door-resolution]]). What is still open from here:

1. ⏸ **The learn cards' PROSE.** The five with diagrams gained real teaching; the
   other four are untouched.
2. ⏸ **The Blocked layer has NO learn card** — the card named "blocked" opens
   ATTEMPTS. Pinned by a test that should fail the day someone writes one.
   ⛔ I refused the `card id == layer id` fix: it fires exactly once in the whole
   table, which makes it a special case wearing a rule's clothes.
3. ⏸ `.html` URLs **308-redirect** to the extensionless form site-wide. Pre-existing.
4. ⏸ **The parked block** (2026-08-27) still hides the counters, split bar,
   goaltender and whistle/blocked panels. ⚠️ The `referee-or-linesman` copy
   defect lives there and becomes live the day it is un-parked: **40 of 55 of
   those stoppages carry an `rsn2` naming a different reason.**

⚠️ **I CLAIMED THE LAYERS "CHANGE NOTHING" AND WAS WRONG** — I probed `#events`,
`#lines`, `#whistles` and the parked panels and never `.lbox`, which IS the
layer's live output (`15 SHOTS FROM THE SLOT 16`). Kevin caught it with a link.
The narrow true statement is that four of five layers do not change **the ice**.

Related: [[rule-diagrams]] · [[hockey-legibility-build]] · [[restart-frames-and-k1]] ·
[[looking-at-pixels]] · [[mechanize-the-review]] · [[census-archive-answers]] ·
[[name-the-path-to-the-expectation]]
