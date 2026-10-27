---
name: replay-motion-open
description: PARTLY SHIPPED 2026-08-25 — arrivals and the goal-ending hero loop are LIVE. ⛔ DISTANCE-BASED PACING IS DEAD — Kevin declined it 2026-08-29 ("let's make a constant update rate for the events") and again 2026-09-08; the pace is three flat gears and he LIKES it. The SWEEP is dead too. Carries every measurement taken.
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-09-08T17:04:08.877Z
---

## ⏩ 2026-10-15: SLOWED AGAIN — `PACE=[7800,5400,3000]` (was 5200/3600/2000)

Kevin, after the play line shipped: *"it's difficult to watch the replay, read the
description and mentally process what's happening."* Every gear ×1.5; a "Last
play" summary frame earns CAPTION_BONUS; the front-door hero loop keeps the
fastest gear (a taste, ~30 s budget). Still three flat gears, no tiering.

## ⛔⛔ DISTANCE-BASED PACING IS DECLINED — and this file said the opposite for two weeks

**Kevin, 2026-08-29:** *"let's make a constant update rate for the events."* It
was drafted, prototyped and set aside the same day. **Kevin again, 2026-09-08:**
*"I like the pacing the replay has now and don't think I want to adjust it."*

⚠️⚠️ **This file's own summary said the 1600+10 pacing was AGREED AND UNBUILT**,
which is how I came to recommend it to him as the next build — **the second thing
in one session I proposed that he had already declined** (the other was E1, the
pre-game names, declined in `docs/status.md` §E). ⭐⭐ **Both declines were written
down, and neither was in the file I read.** E1's lived in `status.md`; this one
lived in a **code comment in `src/app.js` above `const PACE`** — the most durable
place it could have been and the last place a memory recall looks.

⭐ **A memory file is dated the day it was written and the world keeps moving.**
This one was accurate on 2026-08-24 and wrong by 2026-08-29. Before recommending
anything from a memory, **grep the repo for the decision** — see
[[verify-inherited-claims]].

**What actually shipped instead** (`PACE=[5200,3600,2000]`, `CAPTION_BONUS=900`):
three flat gears, one constant each, no ranking of events by importance —
`docs/event-timing.md` §7.2 argues tiering encodes an editorial judgement the site
refuses. Speed is a **stepper**, not three buttons. The measurement stands and is
reusable — 76,837 consecutive event pairs over 294 games, median **47 ft**, p10
**13**, p90 **136**, 24.7% crossing centre ice — it just does not justify a change
Kevin does not want.

## ✅ WHAT SHIPPED FROM THIS THREAD, 2026-08-25

- **The moment of arrival** — the "still unexplored" idea at the bottom of this
  file. Four new arrivals as two pairs of opposites: `jolt` a hit, `halt` a
  blocked shot, `snatch` a takeaway, `slip` a giveaway. Everything else keeps
  `pop`. **It invents nothing — the event type is recorded** — which is the
  opposite standing to anything drawn in the interval BETWEEN events.
- **The hero loop ends on the first goal** and runs ~10 seconds. `BUDGET_MS` is
  demoted from the loop's length to its bound. See [[hockey-legibility-build]].

## ❌ AND THE SWEEP IS DEAD — killed by the census, not by argument

CHENG proposed a broad region of emphasis travelling between two events over the
gap's real duration. **Only 5 of 61 long continuous pairs have a path the clock
FORCES** (slack ≤1.5); 23% have 6× slack or more. ⭐ **The sweep tells its
biggest lie exactly where he said it was safest** — a 51-second drift asserts a
quiet 51 seconds, and long gaps are where the MOST unrecorded hockey happened.
The repair that survives: **duration should control WIDTH, not speed.** Median
slack 4.8×; only 12.6% of intervals are tight enough to justify drawing a path.

⭐ **AND HIS PREMISE DIED TOO.** "The rush is hockey's most exciting unit" —
forced end-to-end transitions end in a chance 57.9% against a **57.6% baseline**,
and in a goal 2.50% against **2.93%**. Distance-matched they do beat their peers
by 4–11 points, so the honest verdict is *somewhat more productive*, not special.
⚠️ I nearly reported 57.9% as a lift without computing the baseline.

**STILL OPEN as of 2026-08-24.** Kevin: *"still trying to find exactly what
I am wanting to add to the hero game and replays."* Prototypes live in the pixels
scratch dir and as artifacts; **nothing has been committed to the repo.**

## ⭐ THE MEASUREMENTS. Re-use these; they were expensive.

Reference game (`data/rich.json`), 320 events:

- **The events are INSTANTS and the game IS the gaps.** Intervals between
  consecutive events sum to **exactly 3,600s** — a full regulation game. An
  identity, not a coincidence: the gaps partition the clock.
- **All 3,600s is LIVE play.** Game-clock time only advances while play is live,
  so none of it is stoppage. (My live/dead split returned 100/0 for this reason.)
- Interval: median **7s**, p90 **30s**, max **94s**, and **68 are zero**.
- ⚠️ **The zero-second pairs are a median 58 ft APART** (only 3 of 18 within
  20 ft). They are NOT rebounds in one spot — I asserted that and it was wrong.
- **41% of intervals change possession** (92 of 222 located pairs).
- **r = +0.26** between gap seconds and distance moved — **a long silence does
  NOT mean the puck went far.** Kills anything reading speed/energy from duration.
- **Areas** (site's own constants, `HIGH_DANGER_FT`/`SLOT_HALF_WIDTH`):
  **71% of consecutive events change area**, median run **1 event**.
  slot 45% · wall 15% · behind the net 12% · point 11% · corner 10% · **NZ 7%**.
  ⚠️ The NZ figure is the honest caveat: the feed records **where recordable
  things happen**, not where the puck is. ⭐ **NEVER BUILD A HEAT MAP OF THIS** —
  summing the areas turns a recording bias into a claim about hockey.
- **Spatial jumps at display rate: 29% of consecutive events cross centre ice
  entirely** (one every 5 events, ~9s apart on screen); 23% jump ≥100 ft;
  median 43 ft, p90 151, max 195. **Every one gets the same dwell.**
- `G.shifts` is **694 records/game and completely unread by `app.js`.**

## ✅ AGREED: pacing by DISTANCE, `dwell = base + rate × feet`

Kevin, 2026-08-24: *"let's go with the 1600 + 10 to start… that'll give the most
time between longer distance events, which is the objective."* He wants to **slow
it right down, find the floor, then walk up.** Today is flat `FRAME_MS.sp1=1800`
(`src/app.js:752`).

⭐ **WHY THIS IS NOT THE THING `docs/event-timing.md` §8 DECLINED.** That was
pacing by GAME CLOCK and needed constants about the game — and Kevin had set it
aside himself (*"events aren't timed and depend on the actual game"*). Base and
per-foot are constants about **the viewer's EYE**: how long a person needs to
relocate their gaze. Same kind of claim the flat 1800 already makes, minus the
pretence that distance does not exist. **Use the INCOMING jump** (i−1 → i): the
time belongs after the eye has moved.

At 1600+10: 10 ft → 1700ms, 43 ft → 2034ms, 195 ft → 3550ms, whole game ~11.9 min
(vs 9.6 today). Trim the BASE first if it is too long; the per-foot term is the
part doing the requested work. §8.1 of that doc already says the constant is
Kevin's call.

## ❌ REJECTED: the counting clock

Kevin killed it, and his reason is better than my "it's weak": **it elapses time
but skews the relationship between on-ice events and reality.** A 54s gap and a
5s gap both get one frame, so the clock's RATE varies ~10× frame to frame — and
rate is the one thing a clock exists to hold constant. A jump asserts nothing
about rate; a smooth count asserts a false and inconsistent one.

## ❌ REJECTED: framing the interval as our ignorance

Kevin: *"I'm not sure if we lead the viewer to 'something happened here, but we
can't show it' is exactly where we want to go."* A decaying/fading mark is honest
and makes **our limitation the aesthetic**. Stating limits is doctrine; building
the look around them is not. **The fix is tense, not mechanism** — *"the game is
here"* over *"we lost it."*

## 🚧 NOT WORKING YET: focus areas

Kevin's own nugget: *"when I watch a game I watch AREAS of the ice, not
necessarily the actual puck movement."* Built as: far ice recedes, focus
**cross-fades** (never travels — a sliding focus draws a path, which is CHENG's
trail objection with a softer brush), caption names the area, **adds zero marks.**

⭐ **An area is a WEAKER claim than the dot already shipped** — we currently place
a point precise to the foot. So this is a doctrine upgrade, not a compromise.

**Kevin, 2026-08-24: "the focus areas concept still isn't working like I
envisioned."** ⚠️ Note his first read (*"can't tell the difference at 0 or 60%"*)
was a **BUG**, not a verdict — the slider wrote to `layers[1-front]`, the
faded-OUT layer. Fixed and verified (0→0, 16→0.16, 60→0.6). **So the concept is
still barely tested; the objection above came after the fix.**

## The framing worth keeping

⭐ CHENG's line, and the best idea in the whole thread: **the gap is exactly where
a novice loses the puck in a real game too.** An expert does not track the puck
either — they read structure and infer it. So the intervals are a *purified*
version of the actual cognitive task, not a degradation.

⭐ **AND "GAP" IS THE WRONG WORD** (Kevin flagged it). The events are the
zero-width things; the interval is the entire game. Call it **the play** — *"11
seconds of play, not recorded."* You are not filling a hole, you are giving the
play somewhere to live.

## Still unexplored

⭐ **THE PACING IS AGREED AND STILL NOT BUILT.** `src/app.js` remains flat
`FRAME_MS={sp0:2600,sp1:1800,sp2:1000}`; `dwell = base + rate × feet` at 1600+10
was never shipped. It is the oldest agreed-and-undone item here.

**Focus areas** — still not what Kevin envisions, still barely tested.

⭐ **AND THE LOOKAHEAD QUESTION IS LIVE.** CHENG's rule, which I would keep:
*foreknowledge may set the pace and choose the clip; it may not point at the
ice.* ⚠️ He offered `dwell` and the hero window as existing counterexamples and
**neither is one** — `dwell(EV[i])` runs AFTER `set(i+1)` advances `i`, so the
extra time elapses while the goal is already on screen, and the hero window is
selection. So nothing here points at the ice with future information, and his
rule describes practice rather than carving an exception out of it.
⚠️ **AND INDUCTION IS THE WRONG MECHANISM** for a lookahead feature: the
strongest transition contrast is shot 28.4% vs hit 14.0% within 25 ft, and you
cannot induce a 28-vs-14 rule from twenty samples without learning false ones.
The rescue is **feedback, not induction** — let the viewer form an expectation
and check it. See [[base-layer-shading]] for the full table.

Related: [[hockey-legibility-build]] · C3 owns the shifts reducer, so any
personnel idea is C3 and not flair · [[novice-tester-scheduled]] is the judge of
whether any of this reads.
