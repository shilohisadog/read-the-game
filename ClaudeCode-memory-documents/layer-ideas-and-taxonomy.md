---
name: layer-ideas-and-taxonomy
description: "✅ DECIDED 2026-09-09 — TWO LAYERS AND ONE ATTRIBUTE (zone starts, defencemen's attempts, who-was-on-the-ice), CHENG ruled all four questions, `docs/layer-ideas.md` is the artifact. ⭐ FLAT IS A RULING. ⛔ THREE TRAPS: a blocked shot is recorded where it was STOPPED, the shift interval is `s < t <= e`, and this note's own 55% figure was WRONG (49.8%). ⚠️ EVERY RATE BELOW WAS RE-MEASURED — trust `docs/layer-ideas.md`, not this."
metadata:
  type: project
---

# ✅ DECIDED 2026-09-09 — READ `docs/layer-ideas.md` FIRST, IT SUPERSEDES THE RANKING BELOW

Kevin, after a pass over the candidates: *"zone starts might be good, point shots
might be another one… who's on the ice could be interesting, it would have to be
associated with an event though, because just having it as a layer seems
cumbersome… not sure how much value shifts would have as a layer? C3 is really
two separate things I think, C5 would be a good layer, C6 is already built."*
Then: *"I like all three of those, 2 layers and one attribute."*

**Three of those four observations were corrections to the record and all three
were right.** C6 was locked in by his own ruling a day earlier; C3 was two things
that do not share an input; C5 is not a layer at all but the zone-start layer's
base rate — **already computed** in `measures.json`.

## ⭐⭐ THE ZONE-START SENTENCE IS ALREADY MEASURED, over 165,420 draws

`census.endZone` — the CONTROLLED answer, and the census says it is *"the one a
sentence may quote"*. ⛔⛔ **BUT THE OBVIOUS SENTENCE IS AN OVER-CLAIM, AND IT WAS
LIVE FOR A DAY (corrected 2026-09-10).** What is measured, over 165,420 end-zone
draws: the club **attacking that end** averages **1.163** shot attempts before
the next whistle having **LOST** the draw, and **1.683** having **WON** it — so
`zoneWorth` is a LEVEL and `winningWorth` (**0.52**) is a DIFFERENCE. ⚠️ Writing
both with a `+` is what made Kevin read it as *losing gets you more*.

⛔ *"Where the draw is taken is worth 2.2× what winning it is"* asserts a PLACE
effect against not-being-there, and this table **has no such baseline** — it
fixes the END and varies only the winner. ⭐ **The supported claim is a
DECOMPOSITION of one number: of the 1.683, the 1.163 arrives whether or not you
win, and that part is 2.2× the 0.52 winning adds.** Same ratio, a claim the
measurement can carry — and it still EXPLAINS the archive's cleanest null (50.4%
faceoff share), because the season total adds up quantities with opposite signs.
⛔ The uncontrolled `faceoffZone` table (2.395/1.132/0.712) may NOT be quoted: the
same physical draw lands in the O row or the D row depending only on who won.

## ⛔⛔ THREE TRAPS, each of which would have cost a session

1. **A BLOCKED SHOT IS RECORDED WHERE IT WAS STOPPED**, not where it was taken —
   D's blocked shots sit at a median 65 ft from centre against 46 ft for their
   shots on goal, **closer to the net than shots that reached it**, which is
   impossible for a shot location. It bites hardest on "from the point", the
   most-blocked kind of shot. **So the lens is defined by SHOOTER POSITION**:
   D take 32.9% of attempts, blocked 37.6% against a forward's 23.3% (1.62×), and
   score 2.8% against 6.6%. ⚠️ SAMPLE, 224 games — archive-wide lands Monday.
2. **THE SHIFT INTERVAL IS `s < t <= e`.** `s <= t < e` gives 95.9% plausible
   skater counts — five-a-side nearly everywhere — and names the right players
   **16.2%** of the time. **A check on the count cannot separate them**; what does
   is asking whether the players the EVENT names are in the set. With the right
   convention: 97.9% plausible, 97.4% named. ⚠️ And 97.4% means *"the players the
   event names are in the set"*, NOT *"the set is right"*.
3. ⚠️ **THIS NOTE'S OWN "55% of the stream is uncounted" WAS WRONG — it is 49.8%**,
   and every per-type rate in it was off too. Written from memory into a file
   carrying a *never quote counts from memory* warning. **Fourth recalled figure,
   second inside a document warning against it.** CHENG's proposed fix, not built:
   *any figure in a doc carries the command that produced it.*

## ⏸ WHAT IS DECLINED, AND WHY

**Shifts as a layer** — Kevin, and I agree: no location, no outcome, nothing to
draw. It is the INPUT to who-was-on-the-ice, not a lens. **Who's on the ice is an
ATTRIBUTE**, both because twelve names is a roster readout rather than a mark and
because DOCTRINE §5 means we know WHO and never WHERE.

---

## ⭐ FLAT, ruled by Kevin 2026-08-30
*"I prefer a flatter taxonomy… that puts yet another decision in front of the
user."* Grouping helps a reader who knows the vocabulary and needs to navigate;
it **taxes one who is browsing and does not**, and the novice is the second
reader. **It kills two proposals, neither of them his**: a family layer
(Shots/Restarts/Battles) and **CHENG's "Slot and Blocked become refinements
inside Attempts"** — the same extra decision in different clothes.
⚠️ Cost, measured: **11 chips at 390px = 6 rows, 320px**, against an ice height
of 164. Reconciliation: grouping may survive as **typography, never navigation**.
⚠️ Three denser arrangements were tried and **none applied** (cascade lost, same
trap as U11) — untested, not rejected.

## ⭐ NOT EVERY LENS NEEDS A CHIP — Kevin's idea, and it resolves the density fight
A lens has two possible jobs: **a control on the rink**, and **a sentence in this
game's story**. They need not be the same surface. A piece that makes a poor
toggle can still be a paragraph on the **measurement page** — which relieves chip
density *without adding a decision anywhere*. Kevin, unprompted: *"gotta remember
the measurement page, where we'll tie all the data pieces together into a
consistent story for that particular game."* Already pointing at it: the verdict
card's season summary (§36), `docs/game-sentence.md`, `docs/one-measure.md`
(one measure per screen), and `perGame` in `archive.js`. **Not specified, not
started.**

## THE INVENTORY — what the extract actually holds
Artifact: https://claude.ai/code/artifact/17aec071-15e8-4401-a0dd-f66e17835f95

⭐ **Five types carry 160 events/game and NOTHING counts any of them** — faceoff
62.3, hit 53.9, giveaway 20.3, penalty 13.3, takeaway 10.6. **55% of the rendered
stream is idle**; every existing layer works on the other 45%.

**100% populated and unused:** `blk` (who blocked it), `miss` (why it missed —
**18.8% of missed shots hit iron**, ~2/game), `drew` (93%, who drew the penalty),
`a1`/`a2`, `pos` on every player (**D take 31% of attempts**), `shifts` (694
records/game, never opened; reproduce `sit` at 97%).

⚠️ **DELIBERATELY DROPPED by extract.py, pending a decision** — needs a
re-extract: **`shotType`** (wrist/slap/snap/backhand/tip — *the strongest
teaching field we do not keep*), `hitteePlayerId`, `losingPlayerId`, `zoneCode`
on non-penalty events, running `awaySOG`/`homeSOG`.

⚠️ **`zone` EXISTS ONLY ON PENALTIES.** Every other zone must be derived from `x`
— which is better: `BLUE_LINE_X` is the same constant the band is painted from,
so a reader can check it with a ruler.

## ⚠️ I QUOTED FILL RATES OFF STALE FIXTURES
5 of the 8 local extracts predate the 2026-08-18 penalty/miss decision. I
reported `miss` at 33% and `drew` at 39%; the true figures are **100% and 93%**,
and two refusals reversed. The fixture README says it in its own words: *"a test
in this directory may assert a property holds; it may never assert how often
something happens."* **Use `data/rich.json`, `2025030214`, `2025030223` for
anything about fields.**

## Candidate lenses, ranked after the census
1. **Special teams** — a STATE WITH DURATION, not a lens. ⚠️ "Show only special
   teams" **removes 76% of the game** — that is a highlight reel, not a filter.
   The honest home is the **scrub track**, the only duration surface we own and
   currently mark-free. (~8.4 windows/game; ~4px a band at 360 — check in a browser.)
2. **Faceoffs / zone starts — ONE layer, not two.** A zone start *is* a faceoff.
   Lesson: see [[census-archive-answers]].
3. **From the point** — D take 31% of attempts; complements the slot (where vs who).
4. **Hits** — legible but the census says it teaches nothing.
5. **Who's on the ice** — buildable now (shifts validated at 97%) but that is C3.

**Refused:** rebounds (a chosen threshold = a model wearing a UI control), zone
entries and possession time (not recorded at any resolution), anything xG-shaped.

Related: [[hockey-legibility-build]] · [[census-archive-answers]] · [[next-play-shading]]
