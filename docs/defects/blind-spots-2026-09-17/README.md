# Row 8, measured — the blind spots were not mostly states

**The question** (`docs/test-program.md` §7.2, row 8): the survivorship experiment left
**19 reader-facing defects that every detector missed**, and diagnosed them as clustering
in three states no probe entered — the Tabletop figure style, animation timing, and
gestures. The exit condition was *"re-plant the 19"*, and *"how many a new state catches
is the measurement"*.

**The answer: new states catch two of them, and the diagnosis was wrong about the rest.**

| what the escape actually needs | n | closed today? |
|---|---:|---|
| the Tabletop figure style — **deleted**, it had no door | 8 | ✅ `adf9868` |
| code that no longer exists (the parked counters) | 1 | ✅ `c9aafaf` |
| **nothing — the mutant is equivalent** | 3 | ✅ proven below, not guessed |
| **dead code** — the function has no caller | 1 | ✅ deleted here |
| **another page** — the module is not on the replay | 1 | ⏭ the walk covers one page |
| **another specimen** — the condition is not in this game | 3 | ⏭ needs a second game |
| **a gesture** | 2 | ✅ the two new gesture states |

⭐ **So the "19 escapes" were never one problem.** Nine are gone with the code they sat
on — **nine, not the eight this repo has been saying**, because one sat on the deleted
counters. Of the ten still plantable, **only two are what a new browser state can reach**.

## The instrument, before any result from it

⛔ **A silence is worth nothing from a probe that cannot speak.** `walkFrames`
(`tools/browser/states.mjs`) hashes `#rg` at every frame of every layer — 1,884
frame-states for the reference game — and before it was believed:

- **it is deterministic**: the same page walked three times is byte-identical;
- **it is sensitive**: three planted changes move it — a goal mark's radius (93 of 1,884
  frame-states), the figure's shadow ellipse (945), the figure's bob amplitude (938).

## The three that are equivalent, and why two readers called them real

| id | change | why nothing can see it |
|---|---|---|
| `s20260916-23` | `Math.sin(t*1.7 …)` → `t*3.4` | ⭐ **`T` in `src/app.js` is declared `0` and never assigned again — there is no animation loop.** The bob is a constant per-x offset. Its AMPLITUDE moves 938 frame-states; its `t` multiplier moves none, and never can. |
| `s20260916-31` | `shadowBlur = goal ? u*5.0` → `u*6` | the only caller passes `glow:false` (`marks.js`), **and** `SvgPen` documents that it accepts `shadowColor`/`shadowBlur` and ignores them. Dead twice over. |
| `s20260916-96` | `clientX < mid` → `<=` | a one-pixel boundary in the double-click midpoint. The adjudication's own note says *"imperceptible, definitional"*. |

⚠️ **Both readers marked the first two `RV` — "real, and a reader could see it".** Neither
was: the reading assumed a canvas that animates, and the surface is an SVG pen on a page
with no clock. `docs/survivorship-experiment.md` §4's three limits already warned that
CC adjudicated its own calls; this is what that cost.

## The one that is dead code

`s20260916-58` plants a defect in `droppedForStrength` (`src/lib/layer.js`) — **which has
no caller anywhere.** Kevin's *"no strength chips"* call removed the sentence it fed on
2026-09-07 (`4ed08c2`); the function stayed, exported, under a comment that still read
*"THIS IS THE NUMBER UNDER THE SITUATIONS CONTROL"*. Ten days unreachable.
**The same shape as `figTabletop`, found the same way** — by asking what a planted defect
in it could possibly change. Deleted here.

## The three that need a different specimen, not a different state

⭐⭐ **THIS IS THE FINDING THAT CHANGES THE PLAN. A probe that walks one game is evidence
about one game.**

| id | what it breaks | the specimen it needs |
|---|---|---|
| `s916-14` | `contrast(hex, on) >= 3` → `>= 4` in `teams.js` | **exactly one of the 33 clubs** falls in the band it moves: Philadelphia, `#F74902`, contrast **3.55**. The next nearest are VGK 2.79 and ANA 2.73, both already dark. The reference game is BUF at MIN. |
| `s20260916-81` | the short-handed tag on a goal caption | a game with a **short-handed goal**; `shortHanded()` returns false for every event in this one. |
| `s20260916-71` | *"No shot has reached a goaltender yet"* | a game where one goaltender faced and saved everything, so the sum is zero either way. |

## The two a gesture reaches — and both are now covered

`s20260916-82` and `s916-50` are both in the double-click door handlers (`doorAt`, and the
clip box's `stopPropagation`). The new `step-back`, `step-forward` and `slot-door` states
are the first probes in this repo that perform a gesture at all.

## ⛔ And the first version of the states measured nothing

It sampled **0.55 of the scrub**. On the reference game that is frame 147, a **faceoff** —
and `marks.js` draws a figure only for the CURRENT attempt, so every state written to
exercise the figure code was looking at a circle. 135 of the 269 frames draw a figure and
the probe entered none of them. It reported six clean, reproducible hashes.

⭐ **The rule that replaced it: a state names the SUBJECT it needs, scrubs until it finds
one, and goes red if it never does.** Entering is the first claim `judgeStates` makes.

Two more things the rebuild had to learn, each caught by insisting on a canary:

- **a mark drawn as a figure is 33% hittable.** Clicking the centre of a `<g data-i>`'s
  box lands between the figure's legs, on a faceoff dot painted underneath, and reports
  "the door did not open" about a page whose door is fine. Measured over 44 clickable
  marks: **min 32%, max 35%, identical at 1100×900 and at 844×390**. The probe now sweeps
  the box, presses the first point that really is the mark, and carries the fraction.
- ⛔ **an inline `style` attribute does nothing on any page of this site.** `style-src` is
  hash-pinned with no `'unsafe-inline'`, so a canary planted as `style="pointer-events:none"`
  changed the markup, passed the build, and had no effect — a mutation that cannot land is
  not evidence. Re-planted as the SVG presentation attribute `pointer-events="none"`, it
  fired.

## Every claim has been seen fail

| planted defect | what went red |
|---|---|
| the goal label loses its siren | `goal-figure`: lost its siren |
| the goal label loses its club | `goal-figure`: does not name the club |
| `markAt` reads `ev.target` again (**the defect that was live in both readers**) | `slot-door`: did not open the why-card |
| `DBL_BACK/-FWD` step two frames | `step-back` and `step-forward` |
| attempts stop being drawn as figures | `attempt-figure` **never entered its subject**, and three more |
| `pointer-events="none"` on the figure | `slot-door`: no point in the mark's own box is the mark |

## How it was run

```
node tools/mutate.mjs relocate 2ef986a docs/defects/survivorship-2026-09-16/data reloc.json
node tools/browser/run.mjs replay-states
```

The per-mutant walk, the canary runs and the hit-fraction sweep are in
`scripts/` beside this file.
