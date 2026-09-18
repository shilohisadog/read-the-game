# Row 8, closed — where each of the 19 ended up

`docs/test-program.md` §10 row 8's exit was *"re-plant the 19"*. Re-planted twice: once
against `adf9868` (README.md beside this, the diagnosis) and once against the work that
followed. This is where they ended.

| outcome | n | |
|---|---:|---|
| **gone with the code they sat on** | **11** | 8 Tabletop · 1 the parked counters · 1 `droppedForStrength` · 1 the goaltending expression |
| **caught now, by a check that did not exist** | **3** | 2 by the suite, 1 by a browser state |
| **still not caught** | **5** | 3 equivalent or imperceptible · 1 on another page · 1 needs a game with a video clip |

## The three now caught

| id | what it breaks | what catches it |
|---|---|---|
| `s916-14` | `teams.js` `contrast >= 3` → `>= 4`: Philadelphia loses its own colour as text | `teams.test.js` — `readableInk` had **no test at all**; `inkOn` is a different function |
| `s20260916-81` | the short-handed tag on an unplaced goal | `render-penalties.test.js` — the claim was tested **by grepping the source**, which the mutant leaves intact |
| `s20260916-82` | `doorAt` widened to `hdOn \|\| isHD(e)`: a mark with no door swallows a double press and the replay stops answering | `tools/browser/states.mjs` — `mark-swallows-step` |

⭐ **Only ONE of the 19 was closed by a new browser state**, and it is not one of the two
this file first predicted. The prediction was checked and was wrong: planting the two
"gesture" escapes against the six new states caught neither, because the gestures were
aimed at open ice and the defect lives on a **mark**. The state that catches it seeks the
mark with the slot layer on and then presses it with the layer off — the condition the
claim is actually about.

## The five that remain, each with its reason

| id | why nothing catches it |
|---|---|
| `s20260916-23` | **equivalent** — `T` is `0` and never assigned; there is no animation loop |
| `s20260916-31` | **equivalent** — the only caller passes `glow:false`, and `SvgPen` ignores `shadowBlur` by documented design |
| `s20260916-96` | a one-pixel double-click midpoint; the adjudication's own note says *"imperceptible, definitional"* |
| `s20260916-34` | `daily.js`, which the replay page does not ship — it is on the front door and the calendar |
| `s916-50` | the clip box's double-click; the offline reference game carries no video clip |

## ⛔⛔ AND THE ENGINE REPORTED TWO FALSE CATCHES

Run at `--workers 3`, `tools/mutate.mjs` reported `s20260916-82` and `s20260916-96` as
**caught by `homepage.test.js`**. Both are not: at `--workers 1` both come back
`not-caught`, and the full suite passes with either planted. Three worktrees each running
a build and a 4-way suite made a test go red under load.

**A false CAUGHT is the worst error this engine can make** — it reports detection the
suite does not have, which is the claim the whole test program rests on. The engine now
**confirms a red by re-running just the files that failed**; a red that does not reproduce
is recorded as `flaky` and is not counted as a catch. Only mutants that went red pay the
cost.

⚠️ **This puts a caveat on `docs/defects/mutation-rerun-2026-09-17/`**, which ran at
`--workers 3` with the unconfirmed engine: its 52 / 43 / 28 may contain false catches in
the same way. It should be re-run with the confirming engine before it is quoted again.

## The lesson that generalises

⭐⭐ **"It needs a different specimen" was wrong about all three specimens.** Two of the
conditions were already in committed fixtures nothing used for them (`rich-ot.json` is a
Philadelphia game *and* holds a short-handed goal), and the third was not a specimen
problem at all. What the three had in common was a claim tested **at the wrong level or
not at all** — one untested function, one grep standing in for a behaviour, one sentence
no test had ever rendered.
