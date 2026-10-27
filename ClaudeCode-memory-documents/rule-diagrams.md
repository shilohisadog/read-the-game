---
name: rule-diagrams
description: "★ 2026-08-31/09-01, SIX RULE DIAGRAMS SHIPPED on their own pages — offside, icing, faceoffs, slot, empty net, penalties — the rules half is now five cards, five diagrams. ⭐⭐ A DIAGRAM IS NOT A MEASUREMENT: the honesty doctrine binds claims about a GAME; a diagram claims something about the RULEBOOK. Plus the offside caption, 'power play over', and three production defects found on the way."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T07:54:00.326Z
---

Twelve commits, `5da59d0` → `79ed53a`. **934 JS + 180 Python.** All live.
Read after [[teaching-surfaces-shipped]]; this is the thread that followed it.

## ⭐⭐ KEVIN'S IDEA, AND THE DOCTRINE IT NEEDED
> *"Since the learning cards don't have to be specific replay events, I wonder if
> we have some discretion in what we overlay onto the ice for explanatory
> purposes."*

**A DIAGRAM IS NOT A MEASUREMENT.** The honesty doctrine binds claims about *what
happened*; a diagram claims something about the **RULEBOOK**, which is true
independently of our archive. Different kind of statement, different surface.

His three constraints, all load-bearing:
1. *"Only the learning ice, not the actual game page — that's where our doctrine lives."*
2. *"The same ice rink, but the graphics noticeably and obviously different."*
3. *"A similar layout, without the scoreboard, clock, controls — similar yet
   different enough not to be confusing."* → **same stage, no invented
   instruments.** A scoreboard with no game and a clock with no time are
   fabrications; that is the one part of the game page a diagram must not borrow.

⭐ **AND HE MOVED THEM OFF THE CARDS MID-BUILD**, which was the better shape: one
figure took the learn page 2,337→2,695px at 390 and five would have hit ~4,300.
As destinations they cost the learn page nothing and the rink went from 323×224
to **359×252 on a phone and 760×530 on a laptop** — desktop stopped being the
binding case. `/offside.html` `/icing.html` `/faceoffs.html` `/slot.html`
`/empty-net.html`, each carrying the door onward: card → diagram → the real game.

## ⭐ THE RULES THAT CAME OUT OF IT
1. ⭐⭐ **THE PROVENANCE GRAMMAR IS THE OUTLINE, NOT THE ARROW** (CHENG). *Filled
   in a club's colour = recorded; outlined neutral = illustrative.* "The replay
   never draws an arrow" is true today and dies the moment anything directional
   lands on the game ice. The arrow is a **convention**; the outline is the
   **signal**.
2. ⭐⭐ **A STILL FRAME OF ANY ANIMATION MUST BE TRUE ON ITS OWN.** Steps ADD,
   never replace, so `prefers-reduced-motion` lands on the complete picture with
   no second code path. **It caught a dishonesty**: the empty-net sketch had the
   goalie VANISH, which motion-off reads as a goalie in the crease *and* an empty
   crease. He skates to the bench instead — what actually happens.
3. ⭐⭐ **THE RINK IS GEOMETRY AND EVERY TOKEN IS ANNOTATION.** Lines/spots/boards/
   nets/the slot region are real things and scale with the crop; a dot standing
   for a player is a legibility choice and must be a constant number of PIXELS.
   Sized in rink units the goalie was **8.8 ft across beside a 6-ft net**, on
   every page already shipped. Now badge 15.9px / token 15.2px on all five.
4. ⭐ **THE CROP FOLLOWS THE RULE.** Offside zooms (one line); icing must NOT crop
   (120 ft of travel IS the subject); the empty net is full-sheet because the
   CONTRAST between a defended and an empty net is the lesson.
5. ⭐ **A LIT LINE BORROWS THE COLOUR OF THE LINE IT EXPLAINS.** Icing's first
   build lit the centre and goal lines — both red — in blue, which reads as "blue
   line", the one thing icing is not about.
6. ⭐ **THE TWO HALVES OF THE LEARN PAGE ARE A WALL, NOW ENFORCED ACROSS THE SEAM.**
   Rules figures carry no tint of ours; the SLOT figure *is* the tint. Each figure
   declares `group`, and `build_index` asserts it against the card's actual group.
7. ⭐ **A CROP WITH NO NET DOES NOT READ AS AN END OF A RINK** (Kevin). A full
   sheet is obviously symmetric; a crop needs the equipment to say which way.

## ⚠️ THE PATTERN THAT REPEATED — write this one down
**Each new figure broke an assumption the previous ones left standing, always the
same shape: a test said "EVERY figure does X" when the truth was "a figure that
does X must do it correctly."**
- 2nd figure: three page tests only ever read `offside.html`.
- 3rd: four tests assumed every figure animates or lights a line — **a map has
  nothing to move**, and forcing motion would be decoration.
- 4th: annotation sized in rink units (see rule 3).
- 5th: badges drawn **on top of the net the figure was about**; and a CSS-prefix
  collision one card away (`.dgfig.{cid[:2]}` scopes each figure's keyframes).

Each fix keeps a **count** so the scoped claim cannot go vacuous, and where a
branch was unavoidable both sides are asserted non-empty (§H4).

## ⭐⭐ THE SIXTH — PENALTIES, 2026-09-01, AND THE THREE LESSONS IT PAID FOR
Kevin: *"that's the only card that links to a game"* (true of the RULES half).
The card promised *"this is that gap — the delayed call"*, and **79 of 109
delayed→penalty pairs across 46 games carry NO event between the call and the
whistle** — the gap is real in time (median 4s) and empty in the record. The DOOR
was always correct; only the words were wrong.

1. ⭐⭐ **THE WALL, IN ITS SHARPEST FORM (CHENG): the rules half may state what the
   record CONTAINS; only the measurements half may state HOW OFTEN.** Offside's
   *"the feed records the call and the restart, never the crossing"* is
   categorical and checkable against the schema; *"79 of 109"* is a measurement.
   ⭐ **Frequency WORDS are fine** — CHENG's own approved lede says *"usually
   nothing in between"*. It is NUMBERS the rules half may not carry.
2. ⭐ **A FIGURE DRAWS WHAT THE ICE CAN SHOW.** The three kinds of foul were drawn
   and ruled out: *"drawing them at the places those fouls happen would be
   INVENTING COORDINATES — the taxonomy is a naming of `descKey` values and
   carries no geometry."* Hence the new **`note`** slot: prose that points at
   nothing, unnumbered, because there is nowhere for it to point.
3. ⚠️⚠️ **I OVERSTATED THE SAME SENTENCE THREE TIMES AND KEVIN CAUGHT ALL THREE.**
   *"until it expires"* (50 of 289 minors end early on a goal), then *"two
   minutes"* left standing one clause left (289 of 325 — 25 majors, 6
   misconducts), then a **game misconduct** he named that I had not.
   ⭐ **THE FIX WAS STRUCTURAL, NOT A HEDGE:** a step saying "two minutes" is
   describing ONE KIND of penalty inside a sentence about all of them, and no
   amount of "most" repairs that. The lengths moved to the `note`, where each is
   attached to the thing it is true of.

⭐ **The official is the third person on the rink** — same body, opposite limb
(`officialGlyph` beside `goalieGlyph`/`skaterGlyph`). ⚠️ The first arm rendered as
a **spur on the head**; a bare line is a stick, a line ending in a fist is an arm.

⭐ **THE BI-DIRECTIONAL SEE-ALSO IS KEVIN'S IDEA AND IT WORKS** — he checked the
pair himself: *"they are definitely different enough to not be in conflict."* A
test refuses a one-way link: the reader who needs it is the one who has not seen
the other card.

⚠️ **AND ONE OF MY OWN GUARDS WAS PINNED TO MY PHRASING** — it matched the literal
*"other team scores"* and went red when the sentence was reworded to the same
fact. **A test that accepts only one wording of a claim blocks the next
correction instead of protecting it.**

## What else shipped (not diagrams)
- **The offside caption** — `🔵 Offside`. The feed records the call and the
  restart, never the crossing; a stoppage is not even on the playable timeline,
  so the RESTART is the only frame a viewer can stand on.
- ⭐⭐ **A WHISTLE OUTRANKS A CLOCK**, reversing my own 2026-08-31 ordering. The
  pill already carries the condition, so the kill caption AMPLIFIES a signal the
  page gives; a rule restart has no other surface. And the wrong order is
  actively misleading — "Penalty killed" on a face-off explains a whistle it did
  not cause.
- **`⚡ Power play over`** — see [[power-play-endings]].
- **`src/lib/rinkart.js`** — the rink's paint, extracted from app.js. Game markup
  **byte-identical**. ⚠️ It is NOT in `LIB`: CHENG's ruling is that `SX` must be
  lexically unreachable from library scope, so it is inlined INSIDE `boot`.
  Renaming to slip past the probe would keep the test and lose the property.

## Where it stands
- ✅ **The penalties card is BUILT** — see above. Reviewed and approved by Kevin.
- ✅ **All six reviewed by Kevin.** The empty net gained a real skater glyph
  arriving from the bench after the goalie gets there (order asserted from the
  keyframes), and the goaltender leaves the ice entirely.

## ⚠️ THE SLOT FIGURE, CORRECTED TWICE BY KEVIN LOOKING AT IT (2026-09-02)
**A hollow circle already meant A PLAYER** (`.dgtok`) on faceoffs, offside,
penalties and the empty net. The slot figure asked the same shape to mean *"a
shot the rule refuses"* — one signal, two meanings. ⭐ **Kevin's fix is a
SUBTRACTION:** drop the shot marks and let the numbered badge sit at the shot's
own coordinate as the only token. **The shading already carries the verdict** —
that is what painting a region is for. A legend would have patched it.
**Third time this class has been caught by him looking at a picture.**

⚠️ **AND STEP 3 NAMED A PLAY THE FEED DOES NOT RECORD.** *"A wrap-around from
behind the net"* — `extract.py:56` lists `shotType` among the DELIBERATELY
DROPPED fields. The tell was the hockey: a completed wrap-around comes back in
front of the goal line and WOULD count, so the sentence contradicted the rule it
illustrated. **A figure draws what the ice can show, and the ice shows a
POSITION, never an intention.**

Related: [[teaching-surfaces-shipped]] · [[hockey-legibility-build]] ·
[[power-play-endings]] · [[learn-door-resolution]] · [[mechanize-the-review]] ·
[[looking-at-pixels]] · [[novice-tester-scheduled]]
