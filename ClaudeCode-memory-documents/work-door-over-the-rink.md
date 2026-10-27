---
name: work-door-over-the-rink
description: "✅ 2026-10-04: the summary panel is now `Game metrics` in the SIDEBAR, every row draws a mark per team, and ⭐⭐⭐ **every row opens to how its count was counted** (`LAYERWORK`, the work panel's own mapping; Stoppages opens its three). That door was MISSING until the day the site went public — see [[going-public-and-the-card]]. ✅ LIVE. Kevin's two doors under the replay: `How we counted` (this game's ledger) and `Is that a lot?` (the archive's answer over the rink). ⭐ The answer is DERIVED from the published per-game histograms, not written. ⛔ SEVEN defects in four days now, none by the suite — the table is the value of this file. ✅ 2026-09-28: all six layers answer, the prose stopped pointing at a hidden rink, and the panel stopped being blank in the state every replay opens in."
metadata:
  node_type: memory
  type: project
---

Kevin, 2026-09-25: *"It takes 3 or 4 mouse clicks to get to 'how we counted this'
from a replay-layer and it takes us away from the replay page."* Measured: 2
clicks and a PAGE LOAD. The clicks were never the cost — leaving the replay loses
your position in the game, the layer you chose and the frame you were looking at.

⭐⭐ **THE PRINCIPLED BOUNDARY, and it stops this becoming "overlay everything":
the replay is the only surface where LEAVING costs you something.** The front
door and `what-you-can-see` are reading surfaces; their doors stay links.

## ✅ Kevin's three rulings, 2026-09-26

1. **The naming is his and it is better than mine.** I proposed `Is that a lot?`
   for the new door as a way AROUND a collision — `How we counted this` beside
   `Show me the work` says nearly the same thing, and a reader who cannot tell two
   adjacent buttons apart presses neither. He removed the collision instead:
   **`How we counted` goes on the panel that IS the event-by-event count for this
   game**, and the archive door takes the reader's actual question. Two labels,
   two questions. ⭐ The lesson is general: when two labels collide, check whether
   one of them is on the wrong thing before rewording either.
2. **Same space, different overlays**, mutually exclusive — his own August ruling.
3. **Layout: build it and look.** Done; see below.

## ⛔⛔⛔ I SHIPPED IT COVERING THREE LAYERS OF SIX

The panel was built against `printed.js` alone. **Four of the seven layer doors
land on the other kind of figure** — one whose numerator and denominator are
prose we wrote (`derivation.js`, drawn by `figureSection`) rather than published
beside the number (`printed.js`, drawn by `printedSection`). Opening it on
Control put that layer's name in the heading and drew an empty body. Every test
passed. **Found by opening the page in a browser and looking at it.**

⭐⭐⭐ **THE ROOT CAUSE WAS THIS FILE.** Its earlier version said the overlay shows
"the layer's `work` sections, one to three, unabridged" — true, and written from
the doors' NAMES rather than from what renders them. A design note that names a
thing without opening it is a claim, and this one was half false for a day.
See [[verify-inherited-claims]].

## ⛔⛔ THE GATE THAT FIX PRODUCED, and it found two more on its first run

Both inliners **strip `import` lines**, so a page that inlines a module and not
what that module imports **builds clean and throws at render time**.
`build_methods` has carried that sentence in prose for weeks; it then happened
again, to `preview.html`, the moment `leagueRows` moved into a file of its own.
Twice is a class. `test/lib-closure.test.js` requires every transitive import to
be in the page's list **and to be listed FIRST** — the files are concatenated, so
a top-level `const` read before its own line has run is a dead zone, while a graph
of nothing but `function` declarations hoists and hides it.

⚠️ It found `archive.js` importing `rink.js` and `distribution.js` on the front
door and the calendar, reached by nothing today. **+22.6KB on each of those two
pages for code neither executes** — correct, costly, and reversible if Kevin
would rather split `archive.js`.

## ⭐ The purity boundary, caught by the tooling

`sections.js` first named `document.createElement`, and `tools/tiers.mjs` rewrote
`docs/architecture.md` to say *"sections.js reach outside pure computation — the
boundary §1 claims is broken."* It was right. `work.js` keeps that boundary by
returning markup STRINGS; this keeps it by **taking `create` as an argument**, the
arrangement `boot(G, RATES)` already uses. 0 impure again, and the renderers are
now testable with an element-maker that builds anything at all.

## What was measured on a phone

At **568x320** — the narrowest surface the portrait ruling leaves — `How we
counted` needed 112px of text in a 105px box and **wrapped onto two lines** beside
a neighbour on one. Type clamped, floor `.62rem`, ceiling `.72rem`. Both labels on
one line at 568 / 600 / 667 / 1100; `--lboxh` unchanged at 162 and 120; nothing
scrolls sideways.

⚠️ **THE FIRST RULER WAS WRONG AND SAID SO CONFIDENTLY.** It divided
`scrollHeight` by line-height and reported "2.7 lines" for a label plainly on one:
`min-height:34px` inflates `scrollHeight`, so it measured the **BOX** while
wearing the name of the **TEXT**. A Range over the text node returns one client
rect per line box, which is the claim. See [[looking-at-pixels]].

## Where it lives

`src/lib/sections.js` (both renderers, factory over `create`) · `src/sections.css`
(their shared stylesheet) · `src/lib/printed.js`, `src/lib/derivation.js`,
`src/lib/league-rows.js` (the two tables and the archive counts the second
divides) · `renderAlot` in `src/app.js` · `setOverlay` owns the space ·
`test/overlay-archive-door.test.js` and `test/lib-closure.test.js`.

---

# ⏭ 2026-09-28 — IT NOW ANSWERS THE QUESTION ON ITS OWN BUTTON

Kevin: *"Is that a lot should definitely answer the question of 'is that a lot',
no? now when the stoppages layer is active and is that a lot is pressed, the
first bit a viewer sees in the panel is 'how many penalties a team takes', which
doesn't quite align."* Two faults in one: the panel never named tonight's number,
and what it led with was a COMPONENT of the layer rather than the layer.

And: *"we have all of the data (somewhere in the software), isn't there a way to
programmatically (and automatically) extract the answer?"* — yes.

## ⭐⭐⭐ THE ANSWER IS A WALK OF A PUBLISHED TABLE, NOT PROSE

`measures.json` carries `perGame[season][lens]`: the full histogram of that lens's
per-game count, with `noun`, `min`, `max`, `n` and `population`. **Keyed by the
same ids the selector uses, counted off the same reducers the chips run** — an
identity `test/measure.test.js` asserts. So the chip's `34` and the sentence's
`34` are ONE quantity, and a layer measured for the first time next spring gets
an answer with no edit to the page.

`sitsIn(d, count)` in `distribution.js` is the walk, shared with the verdict card
so the two surfaces cannot come to mean different things by "unusual".
⚠️ **NOT called `standing`** — that is `strength.js`'s and means the score state,
and both would have been top-level names in one concatenated bundle where a
redeclaration silently wins. `test/build.test.js` caught it on the first run.

## ⛔⛔ THREE REFUSALS, AND EACH IS THE INTERESTING PART

1. **The verdict waits for the horn; the reference class does not.** The chip says
   *so far*, the population is of FINISHED games. Two different facts, two
   different guards — and printing the final total mid-replay would spoil the
   game a reader is watching.
2. **A new season has no distribution, and that is not an edge case.** It is every
   featured game from the first preseason puck until enough regular-season games
   are measured. The nearest season is offered as a yardstick and NAMED as one;
   this game is deliberately NOT ranked inside it, because `distribution.js`
   carries the measurement for that refusal — rank moves 12.5 places for attempts
   against the wrong season, versus a random p50 of about 5.
3. **`zonestart` has no published distribution**, so one layer of six carries no
   lead. The test asserts the SIZE of that hole so it cannot quietly grow.

⚠️ I built the season label from the key and shipped *"the 2025–11 season"* until
I read the rendered sentence. `population` travels with the reference class now:
naming a thing the archive names is the archive's job.

# ⛔⛔⛔ FOUR DEFECTS IN THREE DAYS, ALL FOUND BY KEVIN FROM THE LIVE SITE

None was caught by a green suite. The list is the point:

| | what | why the suite could not see it |
|---|---|---|
| 09-26 | the panel drew NOTHING for 3 of 6 layers | a design note written from the doors' NAMES |
| 09-27 | the panel followed the layer selector for the LEDGER and not for itself | a rule kept in one branch of a two-branch decision |
| 09-27 | the panel ended inside the layer box, slicing a line of type — and a BUTTON one viewport wider | no CSS, no layout in the harness |
| 09-27 | the panel hung 563px past its card, BURYING every transport control | the same defect from the other end; my fix had been a BOUND |

⭐⭐ See [[mechanize-the-review]] §148 (shape #17): **a fix stated as an
inequality only ever closes one side.** `min-height:100%` fixed too-short and was
silent about too-tall. `inset:0` closes both.

## ⏭ A SMALL ONE STILL OPEN, and it is mine

2026-09-28, Kevin: *"the zone starts layer is selected but within the text we talk
about the blue line shading, which we have removed"* — then, *"never mind, I
didn't notice the shading."* **The band is not removed**: measured on production,
`display:none` in the base view and `display:inline` at 49×403px with Zone starts
on ([[base-layer-shading]], `f098dbe` moved it off the base ice onto that layer).

⭐ BUT HE HAD THE LAYER ON AND DID NOT SEE IT, because the panel sets the rink to
`visibility:hidden` — so you read *"it prices the blue-line band"* with the band
hidden behind the panel that is telling you about it. The shared prose was written
for a READING page and is now printed over the thing it names. The numbers
survived that move and were mutation-tested three ways; **nobody asked whether the
PROSE survived it.** Three sentences in that one section assume the reader is not
looking at the rink.


## ✅ 2026-09-28 — ALL SIX LAYERS ANSWER, and three more defects from one probe

**`zonestart` was never a pipeline question.** `docs/status.md` recorded it as one
— *"adding a distribution is a pipeline question, not a page question"* — and
`measure.mjs` had been writing `lens.zonestart` on every game since 09-10. The
hole was `perGame`'s wording table in `archive.js`, typed on **08-28**, thirteen
days before the sixth lens existed. Live now:

> **Most nights finish with between 51 and 61 face-offs** — the middle half of the
> 1,394 games we hold for the 2025-26 season, which ran from 33 to 91.

⚠️ **The noun is `face-offs`, not `zone starts`.** The chip says Zone starts; the
reducer counts every draw outside the shootout. Naming the sentence after the chip
would be a quantity nobody counted wearing the label of one that was.

### The three defects, found by opening it and pressing the buttons in order

| what | why the suite could not see it |
|---|---|
| `How we counted` was BLANK at `at < 0` — the frame every replay opens on | every check on the panel moved the playhead first, and **my own test called the blank "by design"** |
| the prose said *"it prices the blue-line band"* with band and ice both measured at `visibility:hidden` | the harness has no CSS; and prose is not a number, so nothing checked it survived the move |
| `Where this appears:` LED every section — a list of other pages, handed to somebody standing in one of them | only PRESENCE was asserted, never position |

⭐⭐ The first one is [[mechanize-the-review]] shape #18: **a test that steps around
a behaviour has decided to tolerate it.** The tell is a workaround with a
justification attached.

⭐ **The deixis check is narrower than the defect and says so in the test.** A
keyword sweep flags two other phrases and both are fine — *"the shaded patch in
front of the net"* carries its own location, *"the figure on screen"* is the
broadcast's. A regex tuned to fire on this instance and not those would announce a
class while testing an example. Named regression test for two sentences; the class
stays closed by the habit, not the file.

## ✅ CLOSED — THE ZONE STARTS DOOR DOES NOT MOVE TO `census.faceoffZone`

Kevin ruled it closed 2026-09-28. `docs/status.md` §0.00-y carried it as a planned
build for four days. **It was wrong on this repo's own evidence, and the
contradiction was inside one file:**

- `zonestart.js` line ~48 — *"⛔ THE UNCONTROLLED TABLE MAY NOT BE QUOTED ON A
  SURFACE … `faceoffZone` cannot separate being there from winning there."*
- `zonestart.js` line ~95, forty lines below it — *"⏭ THE EXACT MATCH IS
  `census.faceoffZone` … when it has a `what`, the door moves."*

`census.test.js` and `census.js` both side with the prohibition; `endZone` exists
specifically to be the quotable pair. ⭐ And the stated motivation — *"the layer
counts DRAWS and the door counts ATTEMPTS"* — is what the per-game face-off
distribution actually closed: the note was right that the layer had no figure of
its own and wrong about where one would come from.

⭐⭐⭐ **TWO COMMENTS IN ONE FILE DISAGREED FOR EIGHTEEN DAYS, and a planned build
followed the wrong one into `docs/status.md`.** A file is not a single voice:
**when a note plans work, check it against the rules stated ABOVE it.** The wrong
instruction is corrected in place in `status.md` rather than deleted, so the next
reader meets the error and not only the fix.

## ✅ CLOSED — the two populations in the panel each name their subject

The lead ended *"the middle half of the 1,394 games we hold for the 2025-26
season"* and the next line read *"Counted over 4,192 games."* — a bare count
attached to nothing, one line under a different count, so the nearer reading binds
it UPWARD and the panel appeared to answer one question twice.

⛔ **THE REPAIR WAS NOT TO MAKE THE NUMBERS EQUAL, and that is the whole lesson.**
Both are right and the difference is load-bearing: the lead is season-scoped
because pooling seasons moves a game's rank by 12.5 places against a random-draw
p50 of about 5, which is why `perGame` is keyed by season at all. Equal numbers
would have meant a MEASUREMENT re-scoped to match prose. Now reads *"The figures
below are counted over all 4,192 games in the archive, across every season we
hold"* — derived from the rows, still silent when they disagree.

⭐ **The test holds the STRUCTURE, not the reading**: two population figures in one
panel, each naming its subject, and the two still different. It cannot decide
whether a sentence is ambiguous — that took a person looking at it.
⚠️ And it asserts both sentences read back NON-EMPTY, because the lead is built
with `innerHTML` and the sections with `appendChild`: asking either the wrong way
returns `""` and the check passes by finding nothing.

## ⭐⭐⭐ A THIRD DOOR — "What this game was" (2026-10-01)

Kevin, on a finished game: *"seems like the attempts card is only one piece of the
'What this game was' puzzle. Can we create a 'game summary' card that overlays the
rink (using the 'Is that alot' model) at the end of the game?"* — then, when asked
whether the card below the rink should stay: *"The overlay should contain (or be)
the What this game was information, so it'll replace the card."*

`#sumPanel` joins `setOverlay(null|'work'|'alot'|'sum')`, which already owned the
space and the mutual exclusion. **It opens itself at the horn because the ice is
EMPTY there** — no puck, no shot, no player, just the Final chip — so it covers
nothing. It closes on the way back, because every figure in it is of a finished game.

⛔ **IT NEVER TAKES A PANEL THE READER CHOSE.** The first version opened
unconditionally and the door-hears-the-horn test went red naming it: a reader with
`Is that a lot?` open who scrubs to the horn had it replaced by the summary — the one
door whose purpose is to answer at exactly that moment.

⭐ **THE CARD MOVED, IT WAS NOT REBUILT.** The same `<p id="verdict">` element, so
`sentenceFor`, the CSSOM-written dot and the live `verdict-dot` deploy gate all kept
the reader they had. ⚠️ That gate measures a REAL bounding box, so it had to be taught
to open the panel — a hidden panel reports zero width and it would have failed on
healthy pages.

⭐ **ALL SIX LENSES, EACH DRAWING ITS OWN SCALE.** `mostUnusual` scores six and
discards five, so those counts were computed, ranked and thrown away on every game
page the site ever served. The band IS the middle half the row names.
⛔ Positions through the CSSOM, never a `style` attribute — the CSP refuses it.

⛔ **The reference class must be a FINISHED season** — `distribution.js::finishedSeason`.
Without it this panel placed six counts against EIGHT games. See [[mechanize-the-review]] #28.


## 2026-10-12 — the summary door is `Whole-game metrics`, and the season is NAMED

Kevin, reading SEA at WSH live: "Game metrics" read as the game so far (the door
is open from frame one), and "the 86 games we have measured" did not say 86 of
WHAT. ⚠️ That second one partly reverses his own 2026-10-04 ruling ("just remove
'for that season'") — the code comment had recorded exactly this cost. The fix
NAMES the season off `population` ("for the 2026-27 season") instead of a
pronoun, which is what the first ruling objected to. Commit `395e12d`.

## 2026-10-12 (later) — two full-width columns, and a key to the scales

Kevin: too much white space → the rows are a grid of at most TWO columns at
full panel width (pairs mirror the sidebar's layer buttons; one column on a
landscape phone via a 34ch floor). And the scale ends were unexplained — they
are min/max over TEAM-games for five rows and over WHOLE games for Stoppages,
two populations on one card. A one-line key above the rows, in Kevin's wording.
Commits `ec10782` `14d52a1`. Screenshots of the LIVE card are the evidence:
`tools/browser/cdp.mjs` + `adoptedStyleSheets` previews CSS on the live page
past its CSP (an injected `<style>` is silently refused).
