---
name: census-archive-answers
description: ⭐ THE CENSUS IS BUILT, RUN AND LIVE — 4,192 games. The zone gradient is real (2.395x/1.132x/0.712x) and EXPLAINS the faceoff null; the power-play draw is 4.16x; CHENG's hits hypothesis is DEAD (r=-0.07). ⚠️ My "4x" headline was small-sample noise — the archive says 2.2x.
metadata:
  type: project
---

`src/lib/census.js` + `builders/measure.mjs`, published in `measures.json` under
`census`. Ran 2026-08-30. **These are archive numbers and may be quoted.**

| claim | 8 games said | **4,192 games say** |
|---|---|---|
| being in the attacking end / winning the draw there | 1.29 / +0.30 | **1.163 / +0.52** (lift 44.7%) |
| a draw won **on the power play** | 4.50× vs 1.29× | **4.16×** vs **1.272×** |
| goals per 60 — even / PP | 4.65 / 7.40 | **5.013 / 7.602** (1.52×) |
| hits vs attempts | r = −0.15 | **r = −0.07**, opposite in 48.1% |

⭐ **THE ZONE GRADIENT EXPLAINS THE PUBLISHED FACEOFF NULL.** Offensive-zone draw
won → **2.395×** the opponent's attempts; neutral **1.132×**; defensive
**0.712×**. Monotonic over 237,502 draws. The 50.4% null is not emptiness, it is
**cancellation** — the season total adds up quantities with opposite signs. The
best teaching line the site has: *watch where the puck is dropped, not who wins
it.* See [[faceoff-share-null-result]], which this supersedes in meaning.

⚠️ **AND I STATED AN 8-GAME MULTIPLIER AS A FINDING.** I told Kevin "where the
puck drops is worth about **four times** what winning it is worth". It is
**2.2×**. Direction and ordering held; the ratio did not. The census existed to
prevent exactly this and I did it while building the census.

❌ **HITS ARE A NULL.** CHENG proposed "you hit the team that has the puck",
killed it on one game, and refused to write copy. r = −0.07 over 4,192 agrees.

✅ **FIVE-ON-THREE WAS INVISIBLE AND IS NOT ANY MORE** — corrected 2026-09-10
from a hand-run derive. It said `KNOWN_SITUATIONS` holds 8 codes and **4,151.9
min (~59 s/game) and 299 goals** could not be classified. ⚠️ **Both halves were
stale, and one was wrong when written**: the committed `measures.json` said
*1,117* goals over those minutes, not 299, and the freshly derived archive says
`census.state.unknown` is **0 minutes and 0 goals**. `situation()` now classifies
everything, and every figure derived from the situation codes moved with it —
`state.even.per60` 5.013 → 5.099, `drawStrength.pp.ratio` 4.16 → 4.302.

⛔⛔ **AND THAT MOVE EXPOSED THE REAL TRAP: `data/measures.json` IS A CACHE OF THE
ARCHIVE, NOT THE ARCHIVE.** It sat stale across the strength fix because
`tools/measures_fresh.py` watches a NAMED list (`slot.*`, `measured`) and no
census path was on it. ⚠️ **I then checked a code comment against that cache and
declared the COMMENT stale — it was current and the cache was not.** *Guard where
the archive is* is exactly that rule. `census.pace` is now watched; the rest of
the census still is not, so **re-derive before quoting any census figure.**
Shifts CAN see 5v3 (they reproduce `sit` at **97%**, 116/120 sampled shots).

**Design worth reusing:** every tally is an INTEGER and the division happens
once — a per-game rate cannot be summed. The correlation rides as six additive
sufficient statistics, with a test that the answer is invariant to game order.
The run-of-play window is faceoff → next whistle, **both ends recorded**, so no
chosen constant is in it.

⚠️ **3 mutations passed a green suite first time and all 3 were real holes**:
capping the window at 6 events; letting the WINNER define which end the control
fixes (**coverage alone passes a broken control** — every draw lands in `won`,
`lost` empties, population still covered); and a shootout test that was
**structurally vacuous** because a shootout contains no faceoffs. 2 further
mutations fired nothing and were WEAK MUTATIONS not holes — worth distinguishing.

Related: [[hockey-legibility-build]] · [[mechanize-the-review]] · [[layer-ideas-and-taxonomy]]
