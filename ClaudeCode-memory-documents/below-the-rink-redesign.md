---
name: below-the-rink-redesign
description: "The layer surface, distributions, per-game summary and share links — ALL SHIPPED, §32.6 CLOSED. U11 is SOLVED too (see next-play-shading), and this file was wrong about how. Carries §H4 and the five-defects-past-a-green-suite day."
metadata:
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-27T23:30:00.000Z
---

**BUILT AND LIVE.** 35 commits over two sessions, `489e43c..a3021dd`, every one
gates + deploy green. Full record in `docs/below-the-rink-2.md` §15–§32;
`docs/status.md` §A2 is the summary a build list wants. **766 JS + 180 Python.**

## ⭐ THE PAGE NOW

    nav · lede · scoreboard(game line, score, penalties) · rink
    [ LAYER BOX — one height, every lens ] · transport
    WATCHING [Just events] │ [Attempts 59][Slot 24][Blocked 15][Goaltending 27][Stoppages 36]
    caption · [ Show me the work, behind a button ] · Other games · footer

**Three surfaces, three questions, none doing another's job:** the **chip
counts** say what each lens is for (learned by watching), the **box** says this
club / that club / right now, the **ledger** proves it.

## ⭐ THE RULES THAT COST THE MOST TO LEARN

**A fixed box holds only what CHANGES; every constant explanation goes in the
caption.** Paid for three times in one day. §27.1 already said it: the caption
says what the LENS IS, the box says what is true NOW.

**`--lboxh` IS MEASURED, NOT CHOSEN** — released to `height:auto`, swept over
six states × three widths × two games, worst case taken. Guessed wrong three
times before being measured once. ⚠️ **Three of four box defects were a LABEL or
a FIGURE outgrowing the row, not the sentence** — twice after shortening copy
that was never the problem.

**§31.4c — a column carries the club HOCKEY would put it under.** Shooter for
attempts and slot, BLOCKER for blocks, a save against the other club's shot.
This SUPERSEDED a consistency rule I invented the day before, which had also
overridden `docs/blocked-shots-layer.md` §6, a document that had already ruled.
⭐ **Agreeing with the sport beats agreeing with ourselves.**

**A reason that names a RULE groups; a reason that names the EVENT does not.**
The slot ledger was a **3,176px wall** — 276 exclusions in 49 rows, 32 appearing
once, each naming that shot's own distance. `why` is the rule, `detail` is the
measurement, one example per group. 49 → 14 rows.

**An exclusion teaches when a viewer could plausibly have expected it to COUNT**
(CHENG) — the mirror of the `surprising` rule. Derivable from the DIMENSION:
`play`/`type` collapse, `strength`/`limit`/`geometry` are promoted. ⭐ **A
blocked shot is excluded by a LIMIT, not by its type** — *"two of these are
hockey, one is us."*

**A layer's signal must fire on a frame the transport VISITS.** Stoppages counts
0% of visited frames — its events are exactly what `SKIP` removes.

## ⭐ THE CENSUS THAT KILLED MY DESIGN — 262 games, 69,661 frames

    per lens, share of visited frames it COUNTS
      Attempts 45.0% · Goaltending 21.7% · Slot 15.4% · Blocked 12.3%
      nothing at all 55.0%

I proposed "the most specific layer flashes". Attempts would have flashed on
**5.8%** while counting **45.0%** — the chip and the counter disagreeing 7.8-fold
about one quantity, this project's signature bug in a new medium. CHENG caught
it. **A count, not a flash**: it reports where a pulse invites, PERSISTS (so
reduced-motion gets the whole lesson), and is cumulative. ⭐ **The counts teach
CONTAINMENT for free** — verified as a property: every Slot, Blocked and
Goaltending event is also an Attempt, in every fixture game.

⚠️ **This reopened §31.6** (`Just events` means no metric). Kevin ruled to build
it. The distinction held: **the box is the output slot; a chip count is a menu
with prices.** The `Just events` chip carries none and a test forbids one.

## ⚠️ THE SEAM THAT DECIDED FOUR DESIGNS — AND NOW HAS ONE READER

`chip.textContent` carries the live count. It ruled out a "Done" label on the
press acknowledgement, ruled out putting the count in the chip's text (would
have shipped *"**Slot33** — attempts from within 33 ft"*), forced the label into
`.pkl` — and then decided a FOURTH on 2026-08-28, because the fix went into
`capFor` and **the work panel's heading was the other reader**, so it shipped
*"How Goaltending10 is counted"*. ⭐ **A seam that keeps biting wants ONE READER,
not a second correction** — `chipLabel()`. ⚠️ **And the suite was structurally
blind: the fake chip stored its label in its own `textContent`**, so `.pkl` and
the whole chip were one string; two caption tests were passing on that gap.
**Old harness + broken page = 25 of 25 green.** The harness now concatenates
`n_<layer>` the way a browser does.

## ✅ BUILT 2026-08-28 (docs/below-the-rink-2.md §33–§35, status §A2b–§A2e)

**The layer surface passed Kevin's review** after four nits: `Goaltending10`
(the chip seam's FOURTH design, and the suite was blind to it — the fake chip
stored its label in its own `textContent`); the ledger line joined with `+`,
which **turned a separator into an equation and exposed two layers whose figures
do not sum** (goaltending sums by DENOMINATOR, blocked credits a teammate's
block to neither); ⭐ **`type` DISQUALIFIES in the near-miss split** — 428
NOT_A_PLAY events were promoted into "Close, but not counted", including EVERY
whistle on Attempts under `evenOnly`, and the rule was **stated twice** (page +
its own test) so it now lives in `layer.js::isNearMiss`; and a reason under a
COUNTED heading that only said what it was denied.

**PER-GAME DISTRIBUTIONS ARE BUILT** — `measures.json` gains `perGame`: a
histogram per lens, **keyed by SEASON**, unit = the chip's own `counted.length`.
⭐ **Per-season scoping was MEASURED, not assumed**: pooling moves a game's rank
by 15.0 / 13.0 / 12.5 points (blocked / goaltending / attempts) against a
**random-split control** whose p95 is 7–11. Costs +850 B gzipped. **No UI, no
club-level.** ⚠️ Ships on the next PIPELINE run, not on deploy.

**COPY A LINK TO THIS MOMENT is live.** The read side was always built; there was
no WRITER. The confirmation **names the event the link resolves to** (built,
parsed back, resolved). ⛔ CHENG's shootout finding **refuted by measurement**:
160,012 moments round-tripped, 0 wrong; the whole shootout shares ONE clock
(`5-00:00`, ≤25 events) and **28.8% of ALL moments need an ordinal**. The clock
is unencoded now (`at=1-03:19`), both spellings proven to resolve alike.

## ✅ THE PER-GAME SUMMARY IS BUILT (§36) — §32.6's list is CLOSED

On the verdict card, which already fires at the horn. *"156 shot attempts —
higher than all 200 games this season. Every count here sat outside the middle
half — an unusual game by every lens."* ⭐ **NO TUNED THRESHOLD: the middle half
(p25–p75) is a DEFINITION, not a number anybody chose**, and the card can say a
game was ordinary — which was a REQUIREMENT of "three ways this game was
unusual". ⭐ **A fraction, never a percentage** (`levelCurve`'s rule), which also
removes the minimum-`n` guard. The four primitives live in
**`src/lib/distribution.js`**, split out so the game page carries the mechanism
without the archive tier (+4.6 KB gzipped).
⚠️ **Waits on a DERIVE run** — `perGame` is not in the published measures.json.

## ⭐⭐ THE DAY'S REAL LESSON: FIVE DEFECTS PAST A GREEN SUITE, THREE OF THEM THE TEST'S FAULT

Now **§H4** in `docs/status.md`. The shapes, all from 2026-08-28:

* ⭐ **A test that BRANCHES on the data is not a test of either branch.**
  `if (U) … else …` — nine fixture games took the else, so the finding branch was
  **never executed by anything in the suite** while a browser threw on it and
  left a dead scrubber on every game page. *It reads as thorough coverage.*
* ⭐ **Assert the claim in the test's own NAME.** The nameless-document case
  asserted "no lens id reached the reader", which the defect satisfied entirely.
* ⭐ **A guard must ask the QUESTION, not a neighbour of it** — `some(d => d.n)`
  (distributions exist) instead of `judgeable()` (a lens can be judged); **null
  was two facts** and the page called a game ordinary without checking.
* ⭐ **A harness that cannot tell two things apart makes the whole class
  invisible** — the fake chip stored its label in its own `textContent`.
* ⭐ **A rule stated twice drifts** — the near-miss rule lived in the page AND in
  the test that guarded it.

## OPEN, ranked

1. ✅ **U11 — SOLVED 2026-08-30, the rink now goes edge to edge; see [[next-play-shading]]. ⚠️ THE ANALYSIS BELOW WAS WRONG about the fix being a scoreboard-only one.** Kevin,
   2026-08-28, on his own phone. **Measured: board 161px vs rink 136px at 390
   (118%), 129% at 360, 43% at 1100.** ⭐ The board's height is CONSTANT across
   widths (type in `rem` — the defect `tools/pixels.sh` documents in its own
   header, one page over); the rink is width-bound at **2.35:1** because that is
   the ice. ⛔ **Only one knob exists** — "make the rink taller without making it
   wider" is not available, so **every fix is a scoreboard fix.** Ranked first:
   first screen, on the tester's device.
2. **The motion thread** — `replay-motion-open` has the measurements banked
   (distance pacing at 1600+10; focus-areas not matching Kevin's picture).
3. **The default playback speed wants adjusting again** — Kevin, unmeasured.
4. ⏸ **Playoffs are pooled with the regular season in `perGame`, and 12 games
   CANNOT answer whether that matters** (the control's own p95 at n=12 is 33–37
   points). The archive holds 256; the measurement belongs to the pipeline.
3. **The per-game summary**, grown out of the verdict card, which already fires
   at the right moment. Ladder in §31.7b.
4. **The measurements page** — approved, parked; also the home for the three
   per-game SHA-256 provenance digests, which ship and are invisible.
5. **Clicking a ledger row to seek** — `docs/event-index.md` §7 already rules
   what clicking does and names the `newest`-flag wrinkle. **A third of rows
   cannot be shown** (`SKIP` types have no frame).

Related: [[hockey-legibility-build]] · [[mechanize-the-review]] ·
[[looking-at-pixels]] · [[name-the-path-to-the-expectation]].

## ✅ U11 IS SOLVED, 2026-08-30 — and this file's own claim about it was wrong
It said the scoreboard was the only lever and *"there is no slack in the ice"*.
False: the rink was not filling the width — **69.2px of chrome, 17.7% of the
viewport**. The rink now goes edge to edge below 520px and the board fell from
**118% to 92%** of the ice at 390. See [[next-play-shading]].
