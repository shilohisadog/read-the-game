---
name: next-play-shading
description: ⭐ LIVE — a 5-ft green shading on the NEXT event, the pace halved to 3600ms, and the rink edge-to-edge on a phone (U11 SOLVED). Carries the doctrine spend on foreknowledge and three "a reason that expired without being re-examined" lessons.
metadata:
  type: project
---

## What shipped, 2026-08-29/30 — all live
- **`PACE` halved to `[5200,3600,2000]`.** Measured exactly **2.00×** at all three
  gears; a game runs ~16 min. Kevin approved 3600 as the constant.
  `CAPTION_BONUS` deliberately does NOT scale — it buys reading time for words,
  and the words are the same length at every gear.
- **A five-foot green shading on the next event's spot** (`drawCue`), on for
  everyone, switchable under **The next play** (`Show the shading` / `No shading`).
- **U11 SOLVED — the rink goes edge to edge below 520px.** Board vs ice at 390:
  **118% → 92%**; the ice itself **320.8×136.3 → 386×164 (+20% of hockey)**.

## ⭐ THE DOCTRINE SPEND, and it is the largest this project has made
The standing rule was *foreknowledge may set the pace and choose the clip; it may
not point at the ice.* This **points at the ice**. Kevin spent it deliberately
2026-08-28 on the teaching-product argument (annotated chess prints the winning
line). **The spoiler rule is untouched** — what is protected is the RESULT, and
where to look is structure.
⚠️ **NO SUPPRESSION ON GOALS**: if the shading preceded everything except a goal,
its ABSENCE would announce one — the same side channel `drawBoxes` refuses.
**The toggle is a doctrine control, not a preference one**: a page claiming
"nothing is invented" must be able to show a replay with its one lookahead off.

## ⭐⭐ THE LESSON: A REASON THAT EXPIRED WITHOUT BEING RE-EXAMINED
Three times in two days, and only a question from OUTSIDE caught each one.
1. **The ring's outline.** Added because v1 was an 18–32-ft gradient with no
   location. **The fix for that was the RESIZE, not the stroke** — but the stroke
   stayed, solving a problem the previous change had already solved. Kevin:
   *"neither the slot nor the blue line highlights have outlines."*
2. **U11's own row said the fix was impossible** — *"every fix is a scoreboard
   fix… no slack in the ice."* False: the rink was **not** filling the width
   (69.2px of chrome, 17.7% of the viewport). **I wrote that row and then quoted
   it back at Kevin as a constraint.**
3. CHENG's *"its size is its honesty"* spec **destroyed legibility** — a shape
   that can never be mistaken for a position cannot be read as a PLACE either.

⭐ **KEVIN'S FRAMING IS THE ONE TO KEEP: three HINTS, one grammar.** The slot, the
blue line and this are all *an area to keep an eye on*, so they take a soft flat
tint and **no outline**. Two are permanent hints, this one moves — expressed by
the thing moving, not by a different shape. **Same grammar, different colour**:
shape says what KIND, colour says WHOSE (amber/blue are hockey's, **green is
ours**). Neither dimension carries both facts alone.
Second reason, same conclusion: the event is a POINT and 5 ft is a target size
chosen for the eye, so a stroke drew **a boundary that means nothing**.

## ⚠️ TRAPS HIT
- **The tempting U11 fix was a trap**: `.pens:empty{display:none}` is a free 44px
  — free *because* Kevin asked for the reserved seat on 2026-08-27 (*"the
  scoreboard adjusts heights… that shouldn't happen"*). **Two of his own requests
  pull against each other and pixels cannot tell you which you are breaking.**
- **Two of my measurements contradicted each other**: `#rg .pens{display:none}`
  saved 0px, `:empty` saved 44 — **a specificity failure, not a finding**
  (`#rg:not(.preview) .pens` out-specifies `#rg .pens`). Three "levers" had never
  applied. **A CSS experiment that loses the cascade reports the same thing as a
  lever that does not work.**
- **My legend entry was invisible** — `.zref` is PARKED (`display:none`); the
  visible key is `capFor('none')` harvesting `.zref .legend`'s children. Assert
  the RENDERED caption, never the file.
- **My own boot check was a false negative** — I asserted `#events` non-empty,
  which is a property of the resting frame, not of booting. Chips are what boot writes.

⏸ **OPEN: half the arrivals are nearly invisible** — 134 of 269 events (49.8%)
drawn at 20% opacity (faceoffs, hits, giveaways, takeaways, penalties). The
shading points confidently at spots where almost nothing appears. Best remaining
candidate for *why the stream reads as nothing*, and it is Kevin's call because
it changes every game.

Related: [[hockey-legibility-build]] · [[replay-motion-open]] · [[looking-at-pixels]]
