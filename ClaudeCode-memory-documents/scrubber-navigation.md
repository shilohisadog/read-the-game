---
name: scrubber-navigation
description: "✅ GOAL TICKS SHIPPED 2026-09-18 (Kevin: 'start small'). ⭐⭐ THE DISTINCTION THAT DECIDES THIS WHOLE AREA: navigation changes WHERE YOU ARE, a lens changes WHAT IS COUNTED — building them behind similar controls is the trap. ✅ THE LENS IS BUILT TOO, 2026-09-21 — a LADDER of three rungs (all situations 135 / even strength 86 / while the score was level 62 on the reference game), each a strict subset of the one above. ⚠️ The scrubber is indexed by EVENT, not clock."
metadata: 
  node_type: memory
  type: project
  originSessionId: 8f9d1658-c867-4634-b583-bc00a74d9ec7
  modified: 2026-09-19T04:48:33.129Z
---

Kevin, 2026-09-18: *"how would we add a 'only show goals', 'only show even
strength', 'only show power plays' type of parsing? I can also see a more
advanced user wanting to fast forward to a specific time of the game."* Then,
after the options: ***"let's go with goal ticks only, I don't want to overcrowd
the scrubber area, so let's start small."***

## ⭐⭐ THE DISTINCTION THAT DECIDES EVERYTHING HERE

Those three asks are **two different machines**, and building them behind
similar-looking controls is the failure to design against — a user cannot tell
which of their numbers just moved.

- **NAVIGATION** changes only where you are. **No number moves**, nothing touches
  a reducer, so no total can disagree with the ice because of it. Goal ticks,
  jump-to-time, chapter marks. Cheap.
- **A LENS** changes what is counted, and then *every* number on the page has to
  move with it. Even-strength-only is this.

⭐ **The architecture already does a transport filter once**: `NOT_A_PLAY`/`SKIP`
drops stoppages while `EV`/`EVI` keeps the index mapping. A second one is a known
pattern, not new machinery.

## ✅ SHIPPED — goal ticks

A 2px mark per goal in the scoring club's colour, under the scrubber; pressing
one jumps to that frame. ⭐ **The label is `clipNames`, the board's own sentence**
("MIN scored at 16:13 of Period 1"), so overtime and the shootout are named the
way the scoreboard names them — *a second sentence here would be a second thing
free to disagree.*

⛔⛔ **A native range's thumb does not travel 0→100%, and its width cannot be read
from script.** Placement is `f×100% + thumb×(0.5−f)`; the fraction is
**`(k+1)/n`, not `k/(n−1)`**, because the playhead floor `-1` is a real frame.
Full workings, and the two closed measurement routes, in [[looking-at-pixels]].

⏭ **Known, not fixed:** two goals close together have **overlapping 14px tap
targets** (the reference game's first two are ~10px apart), so a press between
them takes the later one. Narrowing the target trades against the phone.

## ⏭ THE STRENGTH LENS — designed, reviewed, still unbuilt

`docs/strength-filter.md` (2026-08-07, CHENG-reviewed, *"nothing implemented"*).
**The primitives have landed since**: `strength.js` exports `situation()`,
`isEven()`, **`whyNotEven()`** (the exclusion reason), `standing()`,
`powerPlayOver()`, `penaltyKilled()` and **`windows()`** — the "mark *when*, not
just exclude" half. Its blocking dependency (conservation bound to the full game
rather than pre-filtered `EV`) now looks satisfied: `test/layers.test.js` binds
it to all 320 events.

What it still needs, and why it is not a small job:

- ⭐ **The mode label is part of the NUMBER, not chrome around it.** `MIN 18 –
  BUF 15` with no adjacent scope label is unverifiable against any public source
  and reads as an error. *It must be impossible to screenshot the number away
  from its scope.*
- **Strength is a second DIMENSION of exclusion, not a second list.** A hit on
  the power play is excluded twice and must be neither double-counted nor
  silently assigned one reason. Conservation has to hold across both at once.
- **The default stays all-situations** — the complete, externally checkable
  record. The hook is *"Minnesota outshot Buffalo 35–25 and lost"*; at even
  strength that is 18–15, a shrug. ⚠️ CC noticed only after choosing that the
  default flatters the hook: the reasons are independent of the benefit, *the
  confidence in them is not.*
- An unrecognised `situationCode` must **refuse to classify rather than guess**
  ([[guard-where-the-archive-is]]).

## ⚠️ THE SCRUBBER IS INDEXED BY EVENT, NOT BY CLOCK

The events are instants and the intervals sum to exactly 3,600s — **the game IS
the gaps** ([[replay-motion-open]]). So the middle of the bar is the middle
EVENT, not 30:00, and a power play packs events into a short stretch of clock.
*"Jump to P2 12:30" is a second axis needing a mapping.* **Measure how far bar
position diverges from game clock before building either** — if it is large, that
is a latent legibility issue independent of any feature.

## ⏭ OPEN — Kevin's call

- The whistle layer draws its stacked-restart count with the identical `m.n>1`
  rule that zone starts just dropped, so the site carries **two conventions**.
  Two-character change, not made unasked.
- The full scrub-bar map (strength windows as shaded regions — `windows()` gives
  **9 in the reference game**, one crossing a period break) was declined for now
  as overcrowding. ⚠️ `docs/strength-filter.md`'s own last low-confidence line is
  *"whether nine windows is legible or clutter on a timeline this size."*

Related: [[hockey-legibility-build]] · [[looking-at-pixels]] ·
[[layers-off-the-watch-page]] (the controls-follow-the-layer principle) ·
[[power-play-endings]].


## ✅ THE COUNTING LADDER — built 2026-09-21, and it is the other half of the rule above

Kevin ruled the strength lens and the score-effects level control built **together,
"since they are semi-related"** — and they turned out to be **one control**, because
`tiedControl` already IS the third rung.

| rung | reducer | reference game |
|---|---|---:|
| All situations | `corsi`, `evenOnly:false` | **135** |
| Even strength only | `corsi`, `evenOnly:true` | **86** |
| While the score was level | `tiedControl` | **62** |

⭐⭐ **49 of 135 is EXACTLY the figure `docs/strength-filter.md` predicted on 2026-08-07.**
The design measured it before anything was built and the build reproduced it — the
strongest evidence this project has that the artifact-before-code process pays.

⭐ **THE THIRD RUNG NEEDED NO NEW REDUCER.** `tiedControl` has run on every game since the
verdict card and already excludes on the five dimensions the work overlay prints —
`play`, `type`, `period`, `state`, `strength` — so **the exclusion ledger the strength
design asked for is what that reducer has always produced.** Before proposing a
mechanism, grep for the one already running.

⛔⛔ **THE CHIP UNDER THE SCRUBBER HAD ITS OWN WAY IN.** The ladder was wired through
`lens()` and the layer box while `LEDGER` — which feeds the chip count AND the work
overlay — still called `corsi` directly, so "while the score was level" moved the box and
left the chip reading 135. ⭐ **Caught only because the test presses the control and reads
the number a VIEWER sees.** A test that called the reducers would have agreed with itself
and shipped it. All three sites funnel through one `counted(slice)` now.

⭐ **THE HOLD WAS LIFTED BY CARDS THAT SHIPPED SINCE.** The chips were removed 2026-09-07
— *"a novice cannot decide whether to press it without a paragraph about why power-play
shots inflate a count, and that paragraph is exactly what the learn cards refuse to
carry"* — with a **stated expiry**. Both halves now exist as cards openable from the page
(`All situations`, `Score effects`). CC had recorded the hold as half-met; re-reading it
on 09-21 it was fully met. **A hold with a written expiry is worth re-reading, not
inheriting** — [[verify-inherited-claims]].

⏭ **Scoped to the Attempts layer**, because `score-effects.md` §6.2 says so and the third
rung has an archive rate to compare against on no other layer. Widening costs a selector.
