---
name: preview-what-to-watch-for
description: "★ The per-game preview card and its methods page, both LIVE. 3 club rows (level5 35, dmen 23, slot 38) + 7 league tiles, every one with TWO doors — a lesson and the WORK. how-we-measure.html prints each figure’s own division and concedes four criticisms. ✅ The dispersion is DONE. ⛔⛔⛔ 2026-10-04: **ITS EIGHT LESSON DOORS NEVER REACHED A LESSON** — all eight opened a replay frame from the day they shipped, because two unrelated dicts in `build_index.py` are both called `figures` and `_preview_doors` passed the wrong one; the rule was right on the learn page and inverted here. Kevin found it live. ✅ Fixed `07de373` by making the set internal to `_card_href`. ⛔⛔ The guarding test asserted `rule page OR replay link` — **an `or` over both answers is satisfied by always giving one.** ✅ CLOSED 2026-10-07: `control.html` exists and ALL EIGHT doors open a lesson — and it was TWO rows, not three. ✅ The card is rebuilt: four tiles, power-play merged into penalties, THE TWO TEAMS FIRST, and a player block on top."
metadata: 
  node_type: memory
  type: project
  originSessionId: 5739ef7d-3f95-478e-9252-cad98f4b4007
  modified: 2026-09-23T18:08:28.272Z
---

✅ **LIVE.** `readthegame.co/preview?game=<id>`, one URL per game, reachable from
every fixture row on the front door. Built by `build_preview()` in
`builders/build_index.py`; the card itself is `src/lib/preview.js`, which the
tests drive. **`docs/preview-page.md`** is where it lives, **`docs/what-settles.md`**
is the evidence, **`docs/preview-and-corsi.md`** §11–§12 is the original ruling.

## What is on it

- **Three CLUB rows**, measure-first so both clubs share one axis: `level5`
  (5-on-5 CF% while the score was level, 35 games), `dmen` (23), `slot` (38).
  Each is a bar from the league tick to the club's value, on an axis that spans
  what real clubs did over a full season — ⭐ **the axis is `clubRange`, measured,
  so its edge means the edge of what clubs do rather than a span somebody picked.**
- ⭐⭐ **The bar's fill opacity is `games / need`, outline always solid.** Kevin's
  ruling: a bar drawn at full strength on twelve games looks exactly as
  authoritative as one on sixty. Continuous, derived, no cliff (CHENG P1), and no
  chosen floor because the outline carries visibility.
- **Seven LEAGUE tiles**: power play (a 10×10 dot grid, since it is literally *of
  every 100*), penalties, offside, icing, where an attempt ends (a stacked bar,
  the one true partition), how long a shift is, and hits as a measured NULL.
- ⚠️ **The hits tile ships with its own bias in small print** — +4.1% home
  premium, because the home rink's crew counts them.
- **The rows draw before the season with no club bars**, which Kevin asked for and
  the empty-population rule permits: the axis is itself a measurement. The league
  TICK is still withheld — that figure is this season's.

## ⛔⛔⛔ The thing that must not be forgotten

`src/lib/reliability.js` **pooled seasons without centring them** until
2026-09-23, against its own specification in `preview-and-corsi.md` §11.2. It
shipped `missed` (33 games pooled, **113 centred**) and dropped `slot` (**38**).
Fixed, with a sign-flipping test. The full story is [[mechanize-the-review]] §140.

⛔ **`missed` IS NOT COMING BACK.** Two independent disqualifications, recorded
where the row used to be in `preview.js`. Whether a shot *missed* rather than was
*saved* is a human in the arena deciding; shot location is geometry and a
defenceman is a roster row. That is the line.

## ✅ AND EVERY FIGURE NOW DOORS TO ITS WORK — 2026-09-23

`how-we-measure.html`, built the evening Kevin restated the rule. Per figure: what
it was counted from, **the division itself**, why it is shown, and what is wrong
with it — then seven arguments against our method, **four conceded as correct**,
static so they outlive a dead data origin. Reached from every figure and from the
front door's limits block. ⭐ `test/methods.test.js` renders BOTH pages and
requires every door to land. See [[show-the-work-or-do-not-print-it]].

⭐⭐ **THE POSSESSION FAMILY, QUANTIFIED — Kevin's condition for showing it once.**
`reliability.agreement` correlates the CF% row against Corsi, Fenwick and SF% over
96 centred club-seasons: **weakest pair 0.85, strongest 0.98.** Those three are
defined in `preview.js` as `WITHHELD` — a measure the site declines to show is
still a claim the site makes, so it lives beside the rows it explains.

⚠️ **AND EVERY COUNT NOW CARRIES ITS OWN SENSITIVITY**, which is the concession
made useful: `dmen` 23 published / 13 on alternate halves / 15 at r=0.6 / 40 at
0.8. The criticism is worth ten games on `dmen` and ONE on `slot`, which is the
argument for publishing it per row rather than as a blanket disclaimer.

## ✅ THE DISPERSION IS RULED AND UNDER WAY — 2026-09-24

⛔⛔⛔ **THE PREMISE I RECOMMENDED IT ON WAS FALSE.** I told Kevin "rule pages
first — `icing`, `offside`, `penalties`, `slot` carry 7–16 figures each and no
derivation language", he approved it, and **five of the six rule pages carry NO
statistical figures at all**. They are a rule, a diagram and a door to a replay,
and none renders a number at runtime either. The 7–16 came from counting the KEYS
of each page's entry in `data/learn-figures.json` — `viewBox, group, label, door,
svg, steps, css` — **a file whose "figures" are DIAGRAMS**. A length read out of a
structure nobody opened, sitting in `preview-page.md` §11.7 since 09-23.

⭐ **THE MEASURED TABLE** (every figure substituted with a unique marker, then
grepped out of the BUILT pages — the only way that does not lie):

| page | figures | doors |
|---|---|---|
| `what-you-can-see.html` | **17** | 0 |
| `index.html` | 14 | 1, site-wide |
| `slot.html` | 7 | 0 |
| `preview.html` | 10 | 10 ✅ |
| `game.html` / `read-the-game.html` | at runtime | 0 |

⭐ **Kevin's rulings:** every LAYER on the replay gets a door · start with
`what-you-can-see` · rename the colliding key. And after I argued the opposite at
his request: **the layer RULES do not go on `how-we-measure.html`.** A layer has
no archive division — it has a counting rule applied live to one game — and the
methods page is organised around divisions. So: **one source, two renderings.**
The rule lives in the layer descriptor (`src/lib/layers/*.js`, where `counts:`
already is), the replay renders it inline, the methods page IMPORTS and indexes
it. *Auditable in one sitting ≠ on one page — a module is auditable too.*

⛔ **THERE ARE TWO "WORK" QUESTIONS ON THE REPLAY AND THEY MUST NOT MERGE.**
`Show me the work` already exists and answers *this game*: every event the layer
saw, counted or excluded, adding up. The new door answers *the rule*.

## ⏭ WHERE IT STOPPED, AND WHAT IS ALREADY DONE

✅ `EXPLAINS` in `methods.js` — a row key and a derivation key are **not the same
namespace**. ⛔ Kevin ruled "rename the card's key" and the card's key **indexes
published data** (`settle.rows` is keyed by it, live keys `dmen/level5/slot`), so
the DERIVATION moved instead (`slot` → `slotShare`). A rename that reads as
cosmetic would have degraded a live card until Monday's derive.

✅ `census.pace.what`, `census.endZone.what` and the zone NUMERATORS are LIVE —
`235,614 ÷ 165,420 = 1.424` now reproduces from the published document.

⏭ **NEXT: the four derivations** — `slotGoals`, `pace`, `scoreEffects`,
`zoneStarts` — **reading published `what`, and the doors on `what-you-can-see`.**

## ⏳ THE DECISION AS IT WAS PUT — disperse the methods page?

Kevin, 2026-09-23: *"do we want to disperse these sections across the site…
it seems like a shame to consolidate all of it into one place and not put the
specific bits closer to the cards or metrics that surface that specific
information."*

⭐ **TWO PIECES OF EVIDENCE FOUND WHILE ANSWERING, AND BOTH SAY YES:**

1. ⛔ **The hits caveat is ALREADY duplicated.** The card renderer hardcodes
   *"Counted by each home rink's own crew, which records about 4% more hits at
   home…"* and `DERIVATION.hits.caveat` says the same thing in different words.
   Two statements of one fact, free to drift — **the exact defect `methods.js`
   was built to prevent, live on the card right now.**
2. ⛔ **`icing`, `offside`, `penalties` and `slot` carry 7–16 figures each in
   visible text and not one word about how any was counted.** The naked-number
   problem is still live on four pages.

**The shape of the answer.** Disperse the PER-FIGURE half — counted / out of /
the division / what could be wrong with it — because `methods.js` is a module and
any surface can import `DERIVATION`. ⛔ **Do NOT disperse the instrument**: the
test, the two policy choices and the seven questions must be auditable in one
sitting. The methods page becomes the index and the argument rather than the only
home, and the gate extends to *every surface that prints a figure resolves to its
derivation* — which goes red on those four rule pages immediately, correctly.

⏭ **KEVIN HAS NOT CHOSEN:** rule pages first (most naked figures, no layout risk)
or the card first (fixes the live duplication, but the card is dense and the
novice tester is on a phone, so it likely needs a disclosure rather than more
text). **My recommendation on the table: rule pages first.**
`docs/preview-page.md` §11.7 has the full write-up.

## ⏭ Also open

- **`avgShiftLen`** — 12 games, orthogonal to everything, survives every control.
  The one genuinely new club row available. Needs per-club shift plumbing, and 57
  consecutive 2024-25 games carry no shift block.
- **The chrome does not link the methods page** — Kevin's call; the nav is three
  items and its width was measured before the third was added (`page.py`).
- **The venue instruments disagree** (§4 of `what-settles.md`) — informative, not
  a gate.
- ⚠️ **Per-sixty-of-even-strength needs time on ice by situation, and we have not
  built it.** ⛔ IT IS NOT A FAULT IN THE TEN FIGURES WE SHOW — every team number
  is a SHARE, which needs no such denominator, and believing otherwise put a
  wrong caveat on the CF% row for a day. What IS true: `dmen` and `slot` count
  ALL situations, so a team that draws penalties is partly described by its power
  play. That is said on each of them.
- A site-wide **og:image** still does not exist.

## ⛔⛔⛔ AND ITS LESSON DOORS NEVER REACHED A LESSON — 2026-10-04

**Every one of the preview card's EIGHT doors dropped the reader into a replay
frame. Not one reached a rule page, from the day they shipped.** Kevin found it
from the live page, eleven days later:

> *"on a preview page, what is normal section, I thought the doors such as 'What
> a power play is' went to the learning page for a power play, it doesn't do that
> anymore."*

⭐⭐⭐ **THE CAUSE WAS A NAME, NOT A RULE.** `_card_href` decided *owns a diagram →
lead to the diagram* from a dict the caller handed it, and **two unrelated things
in `build_index.py` are called `figures`:**

| the name | what it holds |
|---|---|
| `_fig_json()` / `_figures()` | the rule DIAGRAMS, keyed by CARD ID — 6 keys |
| `learn-doors.json["figures"]` | measured figure VALUES — one key, `unreached` |

`_learn()` passed the first. `_preview_doors()` passed the second. So
`cid in figures` was false for every row on the preview and the rule was honoured
on one surface and silently inverted on the other — **positionally, so nothing
could complain.** This is `own means 4+ different things` ([[restart-frames-and-k1]])
in a second place: **a shared name whose meaning depends on which caller you are.**

✅ **FIXED BY REMOVING THE ARGUMENT** (`07de373`). `_card_href(cid, doors)` reads
the one document that defines the set, so no caller can supply the wrong one.
Five doors moved: power play + penalties → `/penalties.html`, offside, icing and
slot → their own pages. ⭐ **The three Control rows CORRECTLY stayed on the replay
frame** — there is no Corsi diagram, and the layer counting an attempt IS the
lesson.

⛔⛔ **AND THE TEST ANNOUNCED MORE THAN IT CHECKED, WHICH IS WHY IT LIVED.**
`test/preview-page.test.js` was titled *"every tile and every measure row is a
door into the lesson behind it"* and asserted:

```js
assert.match(d.href, /^\/(offside|penalties)\.html$|^\/game\.html\?game=\d+&at=/)
```

**An `or` over both possible answers is satisfied by always giving the same
one.** See [[mechanize-the-review]] #69. Replaced by three checks, all three red
against the committed defect rebuilt: the preview and the learn page must send
one lesson to one place (**the learn page is a fair oracle — it was right for all
eleven days**); a lesson owning a diagram must be reached AS one, stated against
`data/learn-figures.json`; and the power-play row pinned to Kevin's ruling.

⭐ **KEVIN'S RULING ON THE WORDING.** `penalties.html` says *"a skater short"* six
times and never says *"power play"*. Asked whether the tile should adopt the
page's plainer words: *"I prefer to keep 'What a power play is' since that's the
terminology the hockey world uses. We can use the explanatory wording on the
learning page itself."* **The door speaks the language a reader arrives with; the
page teaches it in the site's own.** That makes it the one row whose destination
cannot be derived from its key, so a test pins it.

## ⏭ OPEN — CAN THE CONTROL ROWS BE DIAGRAMMED? Kevin asked for a brainstorm

Kevin, straight after the fix, 2026-10-04: *"let's brainstorm if we can figure out
how to diagram the control rows … I'd like everything to be consistent, if at all
possible."*

The three Control rows (CF%, defencemen, missed attempts) are now **the only
preview doors that still open a replay frame instead of a page**, because
`control` owns no rule diagram. ⚠️ **The reason they were left is written down and
is not laziness** — `_card_href`'s own note says CF% and the defencemen row both
lead to `control` deliberately, since both are shot attempts and sending them to
two doors would imply the site counts them two ways. **So the question is not
"add a diagram" but "what would a Corsi diagram DRAW", given [[rule-diagrams]]'s
rule that a diagram is not a measurement.** Nothing decided; the brainstorm is
Kevin's, not started.

## ✅ The unfurl works

`functions/_middleware.js` — the only server-side code on the site. It rewrites
`<title>` and the og/twitter values for `/preview.html?game=`, adds no tags,
computes nothing, imports `nameOf` rather than restating a club table, and passes
through untouched on any error. Verified live. ⭐ It also answered the question no
unit test could: **`wrangler pages deploy src` DOES pick up a `functions/` at the
repo root.** See [[deploy-cloudflare]] for what its arrival broke in the gate.


## ✅ 2026-09-24 (afternoon) — THE DISPERSION IS DONE, ON EVERY SURFACE

Ruled by Kevin, built the same day. **Twelve doors on three static pages plus one
per replay layer**, and the methods page grew a third section (the figures the
rest of the site prints) and an index (the replay's six layers, in their own
words). Detail in [[show-the-work-or-do-not-print-it]] — the token-keyed map, the
one non-circular gate, and the three measurements that share the word "slot".

⭐ **THE PREMISE I RECOMMENDED IT ON WAS STILL FALSE and the plan still landed.**
The rule pages carry no figures except `slot.html`. Starting from the MEASURED
table rather than from the recommendation is what made the scope right: six cards
on `what-you-can-see`, four tiles on the front door, two on `slot.html`, none on
the other five rule pages — asserted, so a door cannot appear where there is
nothing to explain.

⏭ **WHAT IS LEFT OF THIS THREAD:** the seven `census.js` sub-objects with no
`what` (`whistles`, `shift`, `hits`, `state`, `faceoffZone`, `drawStrength`,
`shooter`), listed in `test/census.test.js`. `faceoffZone` is the one with a
waiting consumer.


## ✅ THE CARD REBUILT — 2026-10-07, and the Control brainstorm CLOSED

⭐ **CONTROL IS DIAGRAMMED.** `control.html` ships, so **all eight preview doors
open a lesson and none opens a replay frame.** The answer to Kevin's brainstorm
was that a diagram of the RATIO is impossible and a diagram of the DEFINITION is
not: three attempts from 36 ft, and the only difference is how each one ended.
See [[figure-family-and-scale]].

⚠️ **AND IT WAS TWO ROWS, NOT THREE** — this file and `docs/status.md` both said
three. Of the keys pointing at `control`, `missed` is permanently withheld and
never renders. **A count carried in prose, inherited twice.**

✅ **KEVIN'S RESTRUCTURE** (*"I want to remove some of the 'What is normal' cards
to create space for the per-player cards … merge power plays and penalties, since
they are doors to the same diagram; keep that merged card, offsides, icing and
attempts (since each of those have a diagram associated with them)"*):

- **Four tiles**, and the rule is a property: *it has a diagram*. `shift` and
  `hits` come off.
- ⛔ **THE FILTER IS IN THE CARD, NOT IN `leagueRows()`** — that module is SHARED
  with the replay's `Is that a lot?` overlay, so dropping rows there would have
  stripped a surface nobody was looking at. A test asserts BOTH halves.
- **The merged tile prints TWO measurements, so it carries TWO doors**, one under
  each paragraph — `slot.html`'s rule, and the reason `doors === tiles + rows`
  stopped being the rule.
- ⭐⭐ **THE TWO TEAMS COME FIRST, and the reason the old order existed was FALSE.**
  I had assumed the league frame had to precede the clubs so their numbers could
  be calibrated — but every club row already draws its own league tick, its own
  measured axis and its own range. At 390px the clubs did not begin until
  **~2,200px down**, two and a half screens on the phone the novice tester uses.

✅ **AND THE PLAYER BLOCK IS ON TOP** — see [[player-card-and-reliability]].

⛔ **FOUR DOOR LABELS WERE PROMISING THE WRONG DESTINATION.** They read *"See an
attempt being counted"*, written when they opened a replay frame; three now open
a diagram. Worse, that wording **exempted them from the one test that checks a
door's promise**, which only reads labels of the form *"What a … is"*. Now *"What
a shot attempt is"* and *"What the slot is"*, which puts all of them under it.

⏭ **STILL OPEN: the hits premium rule needs a home.** *A figure we know is
scorer-dependent may not be printed as though it were clean* lived on the hits
tile, which is gone. Deliberately NOT re-pointed at a figure this page no longer
draws — a check like that passes forever and protects nothing.

## ⛔⛔ 2026-10-12 — THE SAME DOOR DEFECT, A THIRD SURFACE: the front door's "What we count"

Three of four measurement cards opened a replay of 2023020204 under a line
promising "Each one opens the lesson behind it". Born 2026-09-11 (`135ee22`)
using `_card_href`, the LESSONS page's rule (there the card IS the lesson and
states its moment). The promise was rewritten twice on 2026-09-23 (`0df0be3`,
`ae52c82`) to say "lesson" and nobody checked the hrefs against it; the
2026-10-04 fix (`07de373`) repaired the PREVIEW card's eight doors only. Fixed
`1036645` with `_lesson_href` + a test holding every card to an existing lesson.
⭐ **A fix to one surface is not a fix to the class: grep every caller of the
shared href rule.** Kevin: "I thought we fixed the card-->replay issue once before?"

## ⏭ 2026-10-13 — THE TEAM SECTION GROWS TO SEVEN ROWS (Kevin ruled, VERBOSE)
Kevin: rows that are "similar" to possession can still help a novice READ the game;
keep the **must settle** condition. Measured with `tools/candidates.mjs` (all 47
candidates, both splits, venue check WITH a road control — `docs/what-settles.md`
§2a). Order: records intro (live) → **Possession group** (CF% level headline;
shots-on-goal share 37g r.85; attempts against/game 33g r−.81; blocked shots/game
33g r−.61; one family sentence) → defencemen → slot → **average shift length**
(12 games, |r| ≤ .07 to all three, home .54 = road .57 → shared stoppages, not
the arena). Full cards for every row; trim later only if mobile reads badly.
Every-other-game halves add nothing clean: they lift possession relatives and
ARENA-scored stats (takeaways .76 home / −.02 road; hits 47→12).
Also live today: records intro ("… this regular season, through <date>. The
record says who won; the rows below say how each team plays.") witnessed by
the league's standings; team values to one decimal (axis ends whole).

## ✅ 2026-10-13 evening — the seven-row team section is LIVE

`07eda34`. Order: "Who had the puck" heading + one family sentence (pairs with
the headline from `settle.family`), then level5, sogShare, attemptsAgainst,
blocks; then dmen, slot, shiftLength. Each CLUB_ROWS entry declares `unit` and
`fields`; the renderer's `UNITS` table spells value/axis/league/footnote. ⚠️ A
new non-share row must also be handled by the methods page's `spanOf` — it
formats ranges by unit, and the share default prints a count as "4820%".
