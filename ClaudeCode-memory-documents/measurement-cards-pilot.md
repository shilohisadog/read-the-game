---
name: measurement-cards-pilot
description: "⭐⭐ On the rules half the DEFINITION IS THE LESSON; on the measurement half it is only the SETUP. ⭐ **A share with no base rate is correct and LOSES THE ARGUMENT** — hence 11.4% vs 3.3%. ✅ 2026-09-10 THREE CARDS IN ONE DAY, tenth to twelfth — `All situations` (PP **95.06** / even **58.65** / PK **13.05** per 60), `The attacking zone` (**1.42** against **0.77** over 165,420 draws) and `Score effects` (**66/59/53**, and **64 vs 53** at even strength). ⭐⭐ THE TWO CONDITION CARDS END ON THE SAME SENTENCE PATTERN AND A TEST PINS IT — that parallel IS the one vocabulary Kevin asked for. ⛔⛔ AND A GUARD THAT ASSERTS A FIGURE IS *PRESENT* PASSES A CARD WITH THE FIGURES SWAPPED. ⚠️ `data/measures.json` is a CACHE that rotted."
metadata:
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-02T23:45:00.922Z
---

Kevin: *"I'm not sure we provide what we need within the what we count cards, we
need to take an **education first** approach to the information."*

## ✅ 2026-09-10 (later) — THE ELEVENTH AND TWELFTH, and Kevin found both gaps by READING

⭐⭐ **HE FOUND THE ELEVENTH BY READING THE CARD NEXT TO THE ONE HE CARED ABOUT.**
*"We say 'that gap is what the shading is for'. However, we don't explain what the
blue line shading is for."* Two defects under one sentence: **the word `shading`
named three different marks** (the slot lozenge, the blue-line band, the green
next-play cue — and the replay carries a button labelled *Show the shading*), and
**the band had a rule and no value**. `The attacking zone` carries
`census.endZone.atkPerDraw`/`defPerDraw` — **1.42 against 0.77 over 165,420
draws** — and says the limit in its own words, because the band is drawn AT the
line and the figure is about which SIDE of it play is on.

⛔⛔ **THE OBVIOUS FIGURE FOR IT WAS ONE THIS PROJECT HAD ALREADY BANNED.**
`faceoffZone`'s 2.395× / 0.712× may not go on a surface: the same draw lands in
the O row or the D row depending only on who won it. **The fix transferred** —
sum both outcomes, split by which club was ATTACKING that end — which is exactly
what `zoneWorth` did on the other axis. *A ban on a figure is not a ban on the
question.*

✅ **THE TWELFTH IS `Score effects`**, the other half of the tenth's lesson: part
of an attempt lead is the power play, part of it is the scoreboard. **66 / 59 /
53 per 60**, and ⭐ **the second row is the card's LICENCE, not an extra** —
**64 against 53** with both goaltenders on the ice and the sides even, because
every framing of score effects meets *"isn't that just the empty net?"* first and
the only answer on file that morning was 48 games.

⭐⭐ **THE TWO CONDITION CARDS END ON THE SAME SENTENCE PATTERN, DELIBERATELY, AND
A TEST PINS IT.** *"…nothing but the time it spent on the power play"* /
*"…nothing but the time it spent behind."* **That parallel IS the seamless
vocabulary Kevin asked for**, and it is precisely what a well-meaning copy pass
destroys by varying the language. A second assertion stops the guard being
satisfied by making the two cards duplicates.

⛔⛔ **AND THE TEST HOLE, TWICE IN AN HOUR: asserting a figure is PRESENT passes a
card with the figures SWAPPED.** A card claiming clubs attempt LESS when behind is
worse than no card. Every figure on both cards is now tied to its subject by name.
⭐ **The lesson generalises past copy — an assertion that a value APPEARS is
almost never the claim being made about it.** See [[mechanize-the-review]].

⭐ **A CARD ALSO WIRES A LAYER'S `Learn More` ROW**, because `LEARNCARDS` is
derived from the doors. Zone starts had shipped that morning as the only layer
with no card, so its row was absent and nothing said so; both golden-DOM changes
that day came from cards wiring themselves in, which is how the wiring was
confirmed rather than assumed.

## ✅ 2026-09-10 — THE TENTH CARD, and the first about a CONDITION

`All situations` — not a rule (those are icing/offside/penalties/empty-net) and
not one of our metrics (control/blocked/slot/goaltending), but **the condition
under which a metric is counted**. Kevin found the gap by checking: the learn page
had **zero** mentions of *power play*, *penalty kill*, *even strength* or *all
situations*, while the box under the ice printed one of those on every frame.

⭐ **ARCHIVE, 4,192 games, attempts per 60 minutes of each situation: 95.06 on the
power play, 58.65 at even strength, 13.05 killing a penalty.** The lesson it ends
on: *part of a club's attempt lead can be nothing but the time it spent on the
power play.*

⛔⛔ **KEVIN REJECTED THE FIRST COPY TWICE AND BOTH WERE RIGHT.** (1) *"It doesn't
read like it's teaching anything"* — it quoted three figures and never said what
*all situations* ARE, so the comparison had no subject. **Define the thing, then
measure it**; every rules card here already does. (2) *"'in an hour' isn't
standard hockey terminology, it's always 'per 60 minutes'"* — I had softened the
unit for a novice. ⭐ **A site that teaches the sport uses the sport's unit and
makes it legible, rather than substituting a friendlier one nobody will hear
again.**

⚠️ **AND TWO ERRORS CAME OUT OF READING THE NEIGHBOURING CARDS** — the Penalties
card asserts **no duration** (a minor is two minutes, a major five, and a power
play ends early on a goal), and *"all three"* undercounted a page that has an
empty-net card. **The cards are one vocabulary; write a new one with the others
open.**

## ⭐⭐ THE PAIRED BASE RATE — the strongest form of this doctrine yet

*A share with no base rate loses the argument* became something sharper. The
archive published **both** halves and no surface said the second:

| | lost | n |
|---|---:|---:|
| the team with **more shot attempts** | 2,228 | 4,100 |
| the team that controlled play **while the score was level** | 1,560 | 3,925 |

CHENG: *"the hook is not the mystery. An unresolved 54.3% is a curiosity — huh,
weird. **The pair is an argument**, and it's the site's actual thesis in two
lines: which number you count changes the answer."* And the doctrinal half:
**publishing the first alone teaches that shot counts are meaningless, which is
the opposite of the truth from entirely true data.**

⛔ **FRACTIONS, AND IT IS CORRECTNESS NOT STYLE**: the two rates have **different
denominators**, so two percentages side by side print one reference class and
attribute it to both.

⚠️ **AND OPTION A'S CACHE ROTS.** `data/measures.json` is a committed build input
so a static page can state an archive figure — and it sat stale across a
`strength.js` fix because `measures_fresh.py` watches a **named list**. A card now
reads `census.pace`, so those paths joined it. **The rest of the census is still
unwatched.**

---

## ⭐⭐ THE ASYMMETRY THAT MADE IT A DESIGN PROBLEM, NOT A COPY ONE
**On the rules half the DEFINITION IS THE LESSON** — knowing what icing is, is
the point. **On the measurement half the definition is only the SETUP**, and the
lesson is what the count lets you see. All four `ours` cards shipped setup: three
closed on *"This is the first one of the game"*, a pointer to a door printed
directly above an `at` line that already announces the door.

⭐ **AND `slot` PROVED IT WAS NOT A MISSING SURFACE.** It already had the full
rules-half structure — card → diagram → replay — and its whole diagram page was
three steps of boundary definition. **The 75.4% appeared nowhere on it.** Given
the entire teaching surface, we spent it defining an edge.

So the page inverts: **the "why" is not a section to add — it is the page's
thesis, and the definition is subordinate to it.**

| | rules page | measurement page |
|---|---|---|
| thesis | here is the rule | **what this lets you see** |
| steps | how it works | what we count to get it |
| close | what to watch | ⚠️ what it does **not** tell you |

## ⭐ THE SHIPPED SLOT CARD, AND WHY *THAT* NUMBER
> A shot taken from inside the slot goes in **11.4%** of the time — 19,304 goals
> from 168,910 attempts. From outside it, **3.3%**. That gap is what the shading
> is for.

⚠️ **NOT the 75.4% goals share**, which was already computed on the game page's
legend and **loses its first argument**: *"that's where everybody shoots"* — and
the reply is half right, **46.7% of located attempts are already inside it**. The
CONVERSION is the number that survives, so it leads. The base rate is the page's
closing move (its `note`), which also explains why blocked shots are in neither
count: the coordinate recorded for one is where the puck was **stopped**.

⭐ **A SHARE WITH NO BASE RATE BESIDE IT IS CORRECT AND UNPERSUASIVE** — a
different defect from being wrong, and no arithmetic check can see it.

## ⭐ CHENG's Q1 RULING, which settles the wall question
**A frequency REPORTS; a verdict INSTRUCTS or CONCLUDES.** *"75.4% of goals come
from the slot"* is allowed; *"the slot is where games are won"* is a verdict
wearing a frequency; *"shoot from the slot"* is advice. ⚠️ His own rule —
*"every published frequency carries its n and population on the same line"* —
contradicts his own example, which carried neither. I kept the rule.

## ⭐⭐ OPTION A — how a static learn page states an archive figure (Kevin's call)
Learn pages carry **zero scripts** and `connect-src 'self'`; `measures.json` is
fetched at RUNTIME and only the game page does it. So **`data/measures.json` (16
KB) is committed as a BUILD INPUT** and substituted by
`build_index.py::_archive()` the way `__UNREACHED__` already was.
- ⛔ **Python only READS and formats.** Anything needing a `quantile` (the `reach`
  medians) stays out — that would restate `distribution.js` in a second language.
- ⚠️ **A derived artifact in a repo of inputs is how five stale fixtures sat
  green**, so `tools/measures_fresh.py` runs in `derive.yml` right after
  publication and diffs the 8 fields the build reads (not the whole document —
  `featured`/`perGame` change nightly and an alarm that cries wolf gets switched
  off). Proven to fire.
- ⚠️ The origin **403s `Python-urllib`**; the gate sends a named User-Agent. This
  is also why CHENG cannot read `measures.json` himself.
- ⚠️ **Caught by the placeholder gate:** `slot.html` is built by a DIFFERENT path
  than the card grid, so the first substitution shipped four raw `__SLOT_*__`
  tokens as the page's lede.

## What the archive gained (all aggregation; no re-derivation of extracts)
`measure.mjs` already stored `slot` and `located` per game and `slotShare`
ignored both. Published 2026-09-01 over **4,192 games**:

| | |
|---|---|
| `slot.attempts` | 168,910 of 361,840 = **46.7%** |
| `slot.scoredFromInside` | **11.4%** · `scoredFromOutside` **3.3%** (3.5×) |
| `reach` | blocked recorded at a median **24 ft**, shots on goal **34** |
| `goalieNight` | faces **27** (22–32), allows **3** (2–4), n=8,867 |

⚠️ **My own test found a defect in my own implementation:** a record with goal
placement but not attempt placement put its goals in the conversion numerator
while its attempts never reached the denominator — `saveShare`'s defect one
function away. Conversions now require BOTH halves. Mutation-proven.

⛔ **NOT BUILT, and already forbidden:** *"the team that blocked more won X%"*.
`archive.js` rules it unpublishable at any sample size — the team that blocks
more attempted fewer **81.7%** of the time, so the reference class is "teams
being outshot". **I proposed it before reading that comment and Kevin approved it
on my recommendation.**

## Queued, in order
1. **Goaltending** — anchor already published, no derive needed: *faces 27,
   allows 3*. Makes "33 of 35" legible without printing a save percentage.
2. **Blocked** — needs `median` published beside the `reach` distribution so
   Python never touches a quantile. One `archive.js` change + a derive run.
3. **Control** — the three-beat lesson: you cannot count possession, so we count
   its visible trace; the raw version misleads because the scoreboard changes how
   teams play; hold the score level and it predicts.
   ⭐⭐ **THE ARC, recomputed from count/n:** more attempts → won **45.7%**
   (n=4,100); more shots on goal → **54.3%** (n=4,026); more attempts **while
   level** → **60.3%** (n=3,925). Raw attempts is the WORST of the three raw
   predictors and the scoreboard is why. `levelCurve` quoted only to k=15
   (n=422); past that n falls to 26 and it is noise.
   ⚠️ CHENG called this "the site's thesis" and claimed the homepage says so —
   **it does not, in any words.** The homepage claims PROVENANCE (*"see where a
   number comes from"*). Publishing the arc would ESTABLISH a thesis, not confirm
   one. ⭐ And the contaminated count is a toggleable lens while the clean one
   (`tiedControl`) is **not a lens at all** — Kevin's call.

Related: [[architecture-audit-2026-09]] · [[rule-diagrams]] ·
[[penalties-lede-open]] · [[base-layer-shading]] · [[feedback-carry-your-n]]
