---
name: figure-family-and-scale
description: "⭐⭐⭐ ONE HAND DRAWS EVERY PERSON ON THE RINK, and at TRUE SCALE — built 2026-10-05 from Kevin's *\"the stick figures on the penalties and empty net diagrams just don't work for me anymore.\"* Photographing them found the bigger defect: THE REPLAY ITSELF drew its goaltenders with the wireframe `goalieGlyph` while the shooter beside them was `FIG.mascot`. `figures.js` now holds a CAST — mascot, goalie, official — and both the replay and the rule diagrams draw through it. ⛔⛔⛔ Then Kevin asked whether the NET was accurately scaled: the rink is 200x85 units for 200x85 FEET, so every length is readable in feet, and nobody had ever done it. The net was right but for a depth typed by eye (4 ft vs 44 in); the PEOPLE were a NINE-FOOT skater beside a FOUR-FOOT goaltender. All sizes now derive from one declared `PLAYER_FT = 6.2`. ⚠️ `size` is NOT the drawn height — a figure stands 1.19x it."
metadata: 
  node_type: memory
  type: project
  originSessionId: ff173db5-1717-462d-b1d1-955659c28146
  modified: 2026-10-06T08:18:42.986Z
---

# The figure cast, and the day the rink got a scale

Two consecutive builds, 2026-10-04 → 10-05, both started by Kevin looking at the
live site. Commits `34d0f2b` (the cast) and `9225151` (true scale).

## ⭐⭐⭐ IT STARTED AS A DIAGRAM COMPLAINT AND WAS A REPLAY DEFECT

Kevin: *"the stick figures on the penalties and empty net diagrams just don't
work for me anymore. We need to update them to something more, I dunno,
consistent with the replay figures?"*

Photographing the two side by side (`docs/reviews/figures-2026-10-04/`) found
something he had not asked about: **`app.js::drawNetmen` drew its goaltenders
with `rinkart.js::goalieGlyph`** — a circle, a capsule and a line — while the
shooter three feet away was the full `FIG.mascot`. **The live rink already showed
a character shooting past two wireframes standing in the creases**, in front of
every reader. Not the diagrams disagreeing with the replay: one project with two
drawings of a person, already side by side.

⭐ **THE OBJECTION THAT HAD KEPT THEM APART WAS PARAMETERISED ALL ALONG.**
`skaterGlyph`'s own header argues the mascot cannot be borrowed because its
jersey means "recorded" and its pose encodes an outcome. Both are *arguments*:
`jersey` is a fill and `out==='goal'` only changes the arms. A neutral fill with
a non-goal outcome is a person who claims nothing — exactly what a diagram needs.

✅ **WHAT SHIPPED.** `src/lib/figures.js` gained `figGoalie` and `figOfficial` on
the mascot's own grid (same `u = size/10`, same feet origin, same ink, same
detail-by-apparent-size rule). `FIG` stopped being interchangeable STYLES and
became a CAST — which its own reachability test had to be taught, rather than
exempted. The replay and `builders/learn-figures.mjs` both draw through it; the
diagrams pass `NEUTRAL`, so they still borrow no club colour.

## ⭐⭐⭐ THEN KEVIN ASKED IF THE NET WAS SCALED RIGHT, AND NOTHING WAS

> *"is the net size scaled accurately to the rink size? Since the goalie is
> scaled to the net, the players appear quite a bit larger than the goalie, let's
> ensure the net scale is accurate, then work backwards to the size of the
> skaters (since they appear a bit 'large' now)."*

**The rink is drawn 200x85 units for 200x85 feet, so ONE UNIT IS ONE FOOT and
every length on it is readable against the rulebook with nothing to convert.**
Nobody had ever done that. Measured:

| | drawn | rulebook | |
|---|---|---|---|
| goal mouth | 6.00 ft | 6 ft | ✅ exact |
| goal line to boards | 11 ft | 11 ft | ✅ exact |
| net depth | 4.00 ft | 44 in = 3.67 ft | ⛔ 9% over |
| **skater** | **9 ft** | ~6 | ⛔ half again over |
| **goaltender** | **4 ft** | ~6 | ⛔ two thirds of life |

⛔⛔ **NEITHER FIGURE NUMBER WAS A DRAWING MISTAKE; BOTH WERE MISSING SOURCES.**
The skater's 9 came from a comment reading *"a ~6 ft player is ~6 units, goals
get a little more presence"* — an exaggeration nobody re-examined. The
goaltender's 4 came from fitting him inside the six-foot goal mouth.

⭐⭐⭐ **A RATIO TO THE NEAREST OBJECT IS NOT A SCALE.** Fitting a PERSON to a piece
of EQUIPMENT is what made him two thirds of life size, and the rule could not see
the skater beside him at half again over it. Every figure now derives from one
declared `PLAYER_FT = 6.2` in `figures.js`, and the net's depth is written the way
the rule writes it, in inches.

## ⛔⛔ `size` IS NOT THE DRAWN HEIGHT

Asking for 6.2 drew a **7.4-foot** goaltender. The figures sit on `u = size/10`
and stand about **11.9** of those units from the shadow under the skates to the
crown — measured per figure (mascot 1.197, goaltender 1.190), converted once
through `sizeFor(ft) = ft / FIG_RISE`. **A PARAMETER NAMED FOR A QUANTITY IS NOT
THE QUANTITY**, the same shape as `own` meaning four things.

⚠️ The raised-arm poses are legitimately TALLER (goal 1.365, official 1.288) and
are NOT corrected back down: a man does not shrink to celebrate.

## ⛔⛔⛔ FOUR DEFECTS IN THE ART, EVERY ONE FOUND BY RENDERING AND LOOKING

1. **Narrow tall pads** → he read as a thin man in white trousers.
2. **Wide pads with eleven loose objects** → the mascot works because its
   SILHOUETTE IS ONE BLOB, and I had not given him one.
3. **`#eaf1f7` pads on `#eef4f8` ice** — flawless on a 250px comparison sheet,
   invisible at the **54px the replay actually draws**. ⭐⭐ **A FIGURE CHECKED AT
   ONE SIZE IS NOT CHECKED.** The same lesson one axis over: the official's raised
   arm was the sweater's WHITE on near-white ice — perfect on the dark preview
   ground, a floating hand on the real rink. **A COLOUR CHECKED ON ONE BACKGROUND
   IS NOT CHECKED.**
4. **The arm, once dark, was drawn BEFORE the head** and painted out by an opaque
   circle — which looks exactly like defect 3 and is not. ⭐⭐ **DRAW ORDER IS A
   VISIBILITY PROPERTY AND NOTHING BUT LOOKING WILL TELL YOU.**

⚠️ **AND ONE THAT WAS MY CAMERA.** The goaltender appeared to render at ~10%
opacity on the real page. It was `Page.captureScreenshot` with
`captureBeyondViewport` RESTARTING the `gkin` entrance animation. Computed
opacity was 1 the whole time — see [[looking-at-pixels]], same family as the
video's black band.

## ⭐ WHAT THE SUITE CAUGHT THAT LOOKING COULD NOT

Drawing the goaltender person-sized at 8.2 units turned `render-board` red on a
rule written from an earlier Kevin screen capture: *"the goalie figures are
bigger than the net."* I had reintroduced the exact defect in new clothes.

**That rule is now REPLACED, not deleted** — it required the goaltender to fill
under 90% of the mouth, which is a ratio, and it could not see the skater at all.
The test is absolute now and the net is still the yardstick, because six feet of
goal mouth and six feet of goaltender are the same measurement out of the same
book — and it compares the SKATER to the GOALTENDER, which is the defect Kevin
actually reported.

## ⚠️ THREE TESTS HAD TO GROW RATHER THAN BEND

- **The diagrams' transform walker** now carries a MATRIX and reads PATHS. It
  refused the figure's `translate rotate` outright, which is why this went red
  instead of quietly measuring the wrong place. ⛔ I composed the matrix in the
  WRONG ORDER first — **an SVG transform list applies right to left.**
- **`drawnExtent`** demanded the closing quote straight after `translate(...)`, so
  a figure that also ROTATES was never split and measured **48 feet**. The
  goaltender does not lean, so he measured correctly throughout and it looked like
  a defect in the skater's SIZE rather than in the ruler.
- **The ghost rule** stopped stripping `fill`: `.dgghost * { fill:none }` is right
  for an outlined glyph and turns a FILLED figure into scattered debris.

## ⏭ TWO DECISIONS THAT ARE KEVIN'S TO REVERSE

1. **The goal figure's 28% size bonus is now 1.0.** An emphasis measured against a
   scale that was wrong by half again is not a decision anybody made; the pose
   raises both arms (14% taller on its own) and it keeps its colour and glow.
   **One number brings the presence back on an honest height.**
2. **Both goaltenders now wear their club's colour.** The glyph gave the VISITOR a
   white body with a coloured outline, after the real sweater convention —
   but `marks.js` has always painted a shooter in his club's colour whichever end
   he came from, so keeping it would have been the one place on the ice where two
   people of the same kind were coloured by different rules.

## ✅ BUILT — THE CONTROL DIAGRAM, 2026-10-07

⭐⭐ **WHAT A CORSI DIAGRAM DRAWS IS THE DEFINITION, NOT THE RATIO.** A share has
no geometry; what IS drawable is *what counts as an attempt*. Three attempts from
36 ft on a ±35° fan, and the only thing that differs is how each one ended — one
reaches the goaltender, one misses, a body blocks one. The number stays on the
card.

⛔⛔⛔ **AND NO STEP SAYS "AN ATTEMPT ENDS ONE OF THREE WAYS"**, which is the
sentence Kevin already killed on the Attempts door: *"the shot could be deflected
by a teammate … there are (at least) 5 ways a shot attempt could end."* A drawing
on a rink is a taxonomy of the ICE, which is the thing that was false, so the
three headings live in the NOTE where they are a claim about THE RECORD.

⛔⛔ **A PERSON IS GEOMETRY NOW, AND `person()` WAS STILL SCALING HIM BY THE CROP.**
Latent and unfireable: every cropped figure drew no people and every figure with
people was full-width, so `k` was 1 at all six call sites. The control diagram is
the first cropped figure with a person on it — at `k=0.495` it drew a **3-foot
man** beside a 6-foot goal. ⭐ Since true scale, a figure is 6.2 units for 6.2
FEET, which makes him as much a real thing as the blue line. `px` moves the OTHER
way: a tighter crop magnifies, so apparent size goes UP. `learn-figures.json` is
byte-identical across the change, which is how the fix was proved inert.

⛔ **FOUR DRAWING DEFECTS, ALL FOUND BY LOOKING.** The full sheet spent three
quarters of the frame on ice the lesson says nothing about; the blocked attempt
collapsed into one clump; badge ① came to rest nearer the wrong shooter. **And
the miss took FOUR goes** — at 8, 11 and 16 ft wide the puck still read as a goal
in the top corner, because *wide is not enough on its own*: a puck level with the
goal line is ambiguous however far out it is. It has to finish PAST the net too.

⚠️ **AND THE TWO CARDS IT BROKE WERE A PAIR.** `control` and `blocked` pointed at
consecutive events in one second of one game — *"this is the first one of the
game"*, *"one event after that shot"* — so moving control's door orphaned both
referents. **A card is read on its own**, the same rule as a step beside a badge.

## ⏭ WAS OPEN — Kevin wanted the Control rows diagrammed

*"let's brainstorm if we can figure out how to diagram the control rows … I'd
like everything to be consistent, if at all possible."* The three Control rows are
the only preview doors still opening a replay frame, because `control` owns no
diagram. ⚠️ The question is not "add a diagram" but **what a Corsi diagram would
DRAW**, under [[rule-diagrams]]'s rule that a diagram is not a measurement: the
other five are GEOMETRY (a line, a region), and control is a ratio over a count.
See [[preview-what-to-watch-for]].
