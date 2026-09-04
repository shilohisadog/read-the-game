# What is left of `render`, and whether it should move

**For CHENG. 2026-09-04, after seven clusters came out of `boot()`.**

The standing answer has been *"what remains is wiring."* This document checks that
sentence rather than repeating it, because it has been said three times and never
measured. **It is not quite true**, and the four things that make it untrue are
more interesting than the question I started with.

Read `step2-decomposition.md` §0.4–§0.5 first: it carries your Q1–Q6 rulings and
what happened when they were built.

---

## 1. What is actually there, counted

`render(i,how)` is **187 lines: 55 of code, 131 of comment, 1 blank.** Every line
of code, classified:

| | lines | what it is |
|---|---|---|
| **frame computation** | 6 | `moment`, `evs`/`L`/`cur`, `PER`, `dropped`, `cp`, `a`/`h`/`tot`/`pa` |
| **drawing the ice** | 19 | rink, boxes, ends note, marks, cue, whistles or rule lines, shot line, puck, no-place, label, netmen, pill |
| **scoreboard and chrome** | 12 | two notes, three class toggles on `#rg`, ice note, scores, the bar, four counters, period, clock |
| **the announcement** | 9 | the `switch` on `announcement(cur, rank())` |
| **optional panels** | 5 | blocked, layer box, goaltending, show-me-the-work |
| **carrying state forward** | 1 | `prevA=a;prevH=h;` |
| **the active-player line** | 1 | `sayWho(cur)` |

It **writes 20 DOM elements directly** and calls draw helpers that write more; the
golden captures **86 elements, of which 31 vary across the game** — so `render` is
the function that moves everything a viewer sees.

It **reads 13 of `boot`'s 25 mutable bindings** — `T REDUCED evenOnly trails prevA
prevH workOpen i lastHD hdOn goalieOn whistleOn blockOn` — and **writes 3**:
`prevA`, `prevH`, `lastHD`.

---

## 2. Four things in it that are not wiring

This is the part I did not expect, and it is why the document exists.

### 2.1 ⭐⭐ A real invariant, and it already has a test

Two conditions in `render` mean *"this frame is a moment"* and **they are
deliberately different**:

```js
const moment = how==='play' || how==='jump';
…
if(how==='play'){ if(a>prevA)flash('cA'); if(h>prevH)flash('cH'); }   // NOT moment
…
if(moment){ switch(announcement(cur, rank())){ … } }                   // moment
```

A deep link **jumps** to a frame: it must caption (you arrived somewhere and
deserve to be told what it is) and must **not** flash the attempt counters,
because nothing was just attempted — you landed mid-game with twenty already on
the board. `render-transport.test.js` asserts exactly this in both directions: a
jump does not bump, a play does.

**So the sentence "what remains is wiring" is false in at least one place.** This
is a claim about what the page means, living in a one-word difference between two
adjacent conditions.

### 2.2 The only temporal state left in the drawing path

`prevA`/`prevH` are read at the flash and written at the end of every render —
**unconditionally, including on a scrub.** That is correct and subtle: scrubbing to
frame 100 and pressing Play must compare frame 101 against 100, not against
whatever was on screen before the drag. If the write were inside `if(how==='play')`
the first played frame after any scrub would flash for every attempt accumulated
during the drag.

**Nothing states this.** The test above covers *jump does not bump*; nothing covers
*scrub re-bases the comparison*.

### 2.3 An analysis computation inline in a renderer

```js
const dropped = L.excluded.filter(x => x.dims && x.dims.strength && !x.dims.type && !x.dims.play).length;
```

This is a measurement over the ledger's own dimensions, computed in the renderer
and handed to `situationsNote`. **It is the same shape as `isNearMiss`**, which was
moved into `layer.js` for a reason we then wrote down: the page and the check
guarding it were two statements of one rule and could drift. This one has never
been moved and has no test of its own — its correctness is asserted only by the
sentence it produces.

### 2.4 A DOM cache, and it earns its keep

Three of the mutable bindings — `rinkPer`, `netmenAre`, `pillIs` — exist so a draw
function can return early when what it would write is what is already there.
Measured from the golden across the reference game's 269 frames:

| element | distinct states in 269 frames |
|---|---|
| `#rink` | **2** |
| `#netmen` | **3** |
| `#ppill` | **4** |
| `#cue` | 215 |
| `#events` | 269 |

So the three memos collapse **807 potential writes into 9**, and the two surfaces
with no memo are the two that genuinely change every frame. They are not
premature; they are measured.

⚠️ **But they are a cache with no stated invalidation rule.** `drawRink` returns
early on `per === rinkPer`, and its output also depends on `AX`, `HOMECOL` and
`AWAYCOL` — all fixed for the life of a boot, which is *why* keying on the period
alone is safe. That reasoning is nowhere. It is the last mutable state in the
drawing path and the one place a future change could produce a stale frame that no
walk would catch, because the walk would render the same stale thing every time.

### 2.5 Two things I checked and they are fine

**The icing/offside ternary at lines 15–17 is not a second precedence ladder.** It
orders the same two ranks `announce.js` orders, so it looked like the rule stated
twice again. It is not: a stoppage carries one reason, so the two maps are
disjoint by construction — measured on the reference game, 8 icing restarts, 1
offside restart, **0 events in both**. Recorded here so nobody re-discovers it as
a defect.

**`lastHD` is written by the `slot` branch and read nowhere** — dead, and a comment
830 lines away already says so. It was left deliberately, because that change was a
move and *a cleanup folded into a move is a cleanup nobody reviewed*. It is still
waiting.

---

## 3. The options

**A — stop.** Declare `render` wiring, close step 2, and write the three missing
checks (§2.1 is done, §2.2 and §2.4 are not) where the code already sits.

**B — extract the frame.** Lines 2, 3, 4, 18, 27 and 35 become a pure
`frameOf(i, how, …)` returning `{moment, evs, cur, PER, L, dropped, cp, a, h, tot,
pa}`. `render` becomes writes only. Buys a testable derivation and removes §2.3.
Costs an 11-field record, and `lens(i)` already does the heavy part.

**C — split by surface.** `drawIce(frame)`, `drawScoreboard(frame)`,
`announce(frame)`, `drawPanels(frame)`, each owning its own elements. Buys owners
for the 20 direct `$()` targets. ⚠️ Risks exactly what `architecture.md` §2 warns
about — *seven files mutating one shared state* — except they would share a
**value** rather than bindings, which may be the whole difference.

**D — name the cache.** Leave the structure; make the memo discipline explicit and
instrumented, so §2.4's unstated reasoning becomes a check.

**E — move `dropped` to the layer**, on the `isNearMiss` precedent. Small,
self-contained, and independent of A–D.

---

## 4. The case for stopping, which I think is the strong one

Everything above notwithstanding: **the goal was never smaller files.** It was to
make invariants executable, and the seventh cluster proved the point in the
sharpest available way — `announce.js` shrank `app.js` by **net zero lines** (66
in, 66 out) and is **11 lines of code carrying 96 of comment**. Judged on size it
did not happen. It was worth doing because the ladder can now be asked all fifteen
of its pairwise collisions, of which the game contains one.

**Apply that same test to the residue and it mostly fails.** What are `drawRink`,
`drawBoxes`, `drawLabel`, `drawNetmen` hiding that a caller could ask them? They
are already separate functions; extracting them into a file changes which file
they are in and nothing about what can be asked of them. **A move that buys no new
question is a move that buys nothing** — which is §5 of the step-2 plan, and it is
the objection I would make to option C if someone else proposed it.

The three things in §2 that are *not* wiring are all repairable **in place**: a
test for the scrub re-base, a test for the memo's invalidation premise, and one
small function move for `dropped`. None of them needs `render` to be four files.

---

## 5. Questions

**Q7 — is "wiring" a terminus or a tier?** If `render` is the binding tier doing
its job, step 2 is finished and the remaining work is three checks. If wiring is
itself a thing that wants a shape, say what shape, because I cannot find a
question option C lets me ask that I cannot ask today.

**Q8 — does the cohesion measurement point the other way here?** `marks.js` needed
19 declared inputs for 57 lines and you took that as the honest cost of a real
cluster. A frame record is ~11 fields consumed by four surfaces that each use a
different subset. Is a wide record shared by four readers the same finding, or the
opposite one — a sign the four are not separate clusters at all?

**Q9 — the DOM cache.** Three bindings, 807 writes saved, no stated invalidation
rule, and a failure mode a rendered-DOM walk structurally cannot see: a stale
frame renders identically on every pass. Is this instrumented, folded into the
draw functions, or written down and left?

**Q10 — and the one I most want answered.** Is the right output here **code or
checks**? Every finding in §2 is an unstated claim rather than a misplaced
function. If the answer is checks, then §4 is right and step 2 ends — and *"the
decomposition ended when the last unstated invariant got an instrument, not when
the file got small"* is a better stopping rule than any line count.
