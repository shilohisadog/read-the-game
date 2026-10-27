---
name: mobile-landscape-ruling
description: "⛔ PORTRAIT IS OUT ON A PHONE — Kevin's ruling 2026-09-13, and the site now asks you to rotate. ⭐⭐ THE PREMISE OF HIS COMPLAINT WAS WRONG AND THE VERDICT WAS RIGHT: the drawing got 19.4% of the phone's first screen, so it was a BUDGET we never set — but the rink is 200x85 against a 0.46:1 viewport, so no arrangement in portrait could ever give it more than a fifth. ⭐ LANDSCAPE TAKES THE LAPTOP'S TWO COLUMNS WITH THE RULE INVERTED: width is taken FROM the rink on purpose, because the rink's height IS its width x 0.425. ⛔⛔ TWO TRAPS: `orientation` is a property of the DOCUMENT's viewport and the hero is an iframe that is itself landscape and short; and every type size on the phone was the LAPTOP'S, because U11's clamp assumed viewport width IS element width."
metadata: 
  node_type: memory
  type: project
  originSessionId: 93e6fd35-9c6d-4b88-b317-618e5a2a3d81
  modified: 2026-09-14T15:23:09.832Z
---

# Mobile — portrait is out, landscape is the surface

**Kevin, 2026-09-13, after using the site on his phone:**

> *"the verdict isn't good, in my opinion. the replay just isn't informative on a
> mobile device, there simply isn't enough room on that small of a screen to
> surface the required controls to allow for a seamless user experience. We need
> to rethink what we provide on mobile."*

Then, after the audit: *"I have decided portrait isn't salvageable, there's no way
that portrait will work for a novice, heck it doesn't work for me and I know what
it's trying to show. Portrait is out on mobile… can we replicate the laptop
approach on mobile, with the controls side by side with the rink?"* and *"a rotate
prompt would be the best portrait approach."*

The full record is **`docs/mobile.md`** in the repo. This file is the shape of it.

---

## ⭐⭐ The verdict was right and half the premise was wrong

Measured at 390×844 before proposing anything — because *"there isn't enough
room"* and *"we are spending the room badly"* lead to different rebuilds:

| band | height | share of the fold |
|---|---:|---:|
| the ice | **164** | **19.4%** |
| `#lbox`, an EMPTY layer box | **120** | **14.2%** |
| scoreboard | 145 | 17.2% |
| header + nav | 75 | 8.9% |
| transport, three rows | 136 | 16.2% |

The largest block after the ice was a box whose entire content was *"Choose one
under Layers and this fills in as the replay runs"* — pointing at a control
**1,130px away**. And `#lcap`, the sentence explaining the layer, sat at **1.62
screens**, 1,056px below the ice it describes. That is the defect Kevin caught
once already about a different element (*"many pixels between the event(s)"*,
measured 479px), at 2.2× the distance, because **the fix that day was aimed at an
element rather than at the rule.**

**⚠️ AND THE HALF HE WAS EXACTLY RIGHT ABOUT, sharper than he put it:** the rink
is 200×85 — **2.35:1** — and a portrait phone is **0.46:1**. The drawing's height
is set by the container's WIDTH and nothing else. Reclaiming vertical space moves
things closer together and **makes the rink no bigger at all.**

## ⛔ Landscape alone makes it WORSE, and only measuring showed it

CHENG recommended rotation first (*"more than double the ice, with room beneath
it"*). The drawing arithmetic was right and the conclusion was wrong:

| | portrait 390×844 | landscape 844×390 | landscape 844×320 |
|---|---:|---:|---:|
| ice | 386 × 164 | **762 × 324** | 762 × 324 |
| area | 63,304 px² | 246,888 px² (**3.90×**) | — |
| ice ÷ fold | 19.4% | **83.1%** | **101.3%** |
| the caption | 0.57 screens | **1.52** | 1.85 |
| the transport | 0.81 screens | **2.04** | 2.49 |

**There is no room beneath it.** The whole first screen in landscape was header,
eyebrow and scoreboard, with the rink only *beginning* at the bottom edge. And it
made CHENG's own diagnosis worse — *"the ice and the thing that explains the ice
cannot occupy the screen together"* — by moving the caption from 0.57 to 1.52.

> **Drawing area and everything-else trade against ONE fixed budget, in every
> orientation.** Landscape spends the whole budget on the drawing; a vertical
> rink spends it in proportion; only collapsing the output changes the budget.

## ⭐ What shipped — the laptop's two columns, with the rule inverted

`app.css` gates two columns at `min-width:1360px` and derives it honestly: *"the
smallest width at which nothing regresses… the rink gets 992px against today's
900."* **That protects the rink's WIDTH, because width is what a laptop has
spare.** In landscape the scarce dimension is HEIGHT — and the rink's height IS
its width × 0.425. So the same move is made for the opposite reason: **width is
taken FROM the rink on purpose.** Shrinking the controls and enlarging the
drawing are the same edit.

| | ice | board ÷ rink | everything ends at |
|---|---|---:|---:|
| landscape, shipped | **510 × 217** | **0.44** | 0.85 at 390 · 0.95 at 350 · 1.03 at 320 |
| laptop 1400×900 | 924 × 393 | 0.31 | unchanged, every size untouched |

**The rink moves, not everything else.** `.side` is `display:contents` at this
width, so its children are already grid items of `.wrap`; pulling only
`.rinkbox` into column two leaves every other block to flow down column one in
document order, and `#who` travels with the rink because it lives inside it.
Placing two dozen children by hand would be a second statement of the document's
shape.

## ⛔⛔ Trap one — `orientation` is the DOCUMENT's, and the hero is an iframe

The front door's hero is an iframe measured at **315×220** on a portrait phone:
landscape, under 500px tall, **a match for the media query.** Without
`:not(.preview)` on every rule the preview would take the game page's two-column
layout inside a box with no second column to give, on the first surface a
stranger sees. A test walks the block's selectors and asserts each one is guarded.

## ⛔⛔ Trap two — every type size on the phone was the LAPTOP'S

Kevin: *"The scoreboard appears to be 2/3 the size of the rink, it looks way too
big, same with the controls."* Measured at 844×350 against 1400×900:

| | phone | laptop |
|---|---:|---:|
| score | 28.8px | **28.8px** |
| chips / clock / buttons / caption | 14.4 / 12.48 / 13.28 / 13.12 | identical |
| board ÷ rink | **0.57** | 0.31 |

**It is U11's own defect in a new viewport.** That work replaced a rem constant
with `clamp(1.6rem,5.4vw,2.2rem)` because *"rem does not care how wide the screen
is"* — **and assumed viewport width IS element width.** In landscape the viewport
is 844 and the board sits in 230. Same shape as the board's three-across grid
breaking in the same column, one property over.

> **Size against the thing the element is actually IN.** A second `vw` clamp
> would have looked like the careful fix and reproduced the bug.

**⛔ 44px survived every line.** Text shrank; the tap target did not. The padding
cut and `min-height:44px` are in the same declaration so they cannot drift, and a
mutation removing the floor is red.

## Portrait is a prompt, never a wall

*Show it anyway* reveals the page exactly as it is today. **A reader with
orientation lock on is not making a mistake**, and a prompt that cannot be
dismissed decides on their behalf whether they can turn their phone. The
scoreboard stays visible beside it, so a reader arriving from a shared link can
see they reached the right game before being asked to do anything.

## ⏭ Left open, all named in `docs/status.md` §0.00

1. The board's ~22px reserved penalty band — reclaimable only by accepting jitter.
2. 844×320 — the scrubber's last pixels below the fold; the next cut is the speed
   stepper, and dropping a control on one viewport is a product call.
3. `#lbox` and `#lcap` — portrait-path only now, behind the prompt.

See [[looking-at-pixels]] for the phone-vs-laptop rule this run re-earned, and
[[novice-tester-scheduled]] — the novice tester is on a phone, which is why this mattered.
