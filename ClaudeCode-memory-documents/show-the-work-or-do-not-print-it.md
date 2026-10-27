---
name: show-the-work-or-do-not-print-it
description: "⛔⛔⛔ 2026-10-04: **"CLOSED ON EVERY SURFACE" IS CLOSED AS OF A DATE, NOT FOREVER.** The summary card moved into an overlay (10-01) and gained a mark per club (10-04), and NEITHER change brought a door with it — twelve numbers and zero links on the screen the first public link opens, and nothing went red. Found by checking a DRAFT POST's sentence against the live page. **Every new surface re-opens this rule.** ✅ Re-closed in `4466880` from `LAYERWORK`, the mapping the work panel already uses. ★★★ Kevin's standing rule, and now a SURFACE and a GATE: every number the site prints must have a door to its derivation. ✅ readthegame.co/how-we-measure + src/lib/methods.js + test/methods.test.js, built 2026-09-23. ⛔ Three traps found building it: a methods page that never did the arithmetic, one written in our own vocabulary, and a criticism aimed at the wrong number."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5739ef7d-3f95-478e-9252-cad98f4b4007
  modified: 2026-09-23T17:30:16.691Z
---

Kevin, 2026-09-23, after the #fancystats discussion — and he flagged it as a
repeat: *"We are open source and transparent. Everything we claim on the site
needs to be adversarially challenged internally, cause it's going to be
challenged externally for sure (at least I hope it will be)…. every metric and
number needs to have an opportunity for a critic to 'be shown the work' and the
work needs to be squared away."*

⭐ **WHY IT IS A PRODUCT RULE AND NOT A NICETY.** The site's pitch is *check our
work*. A figure a reader cannot check is not a weaker version of the pitch, it
contradicts it — and the reader most likely to check is the one whose opinion
carries furthest. Kevin WANTS that audience: *"at least I hope it will be."*

⛔ **THE FAILURE I FOUND WHEN I ACTUALLY LOOKED, the same day he said it.** The
preview card had seven league tiles and two club rows. Five tiles carried a door
— and **every one of those doors led to a LESSON, not to the WORK**. A door to
`penalties.html` teaches what a penalty is; nothing anywhere showed how 3.6 a
game was counted. Two tiles (shift, hits) had no door at all. And the most
attackable number on the whole card, *"14 of 35 games"*, was naked: no reader
could learn what 35 was, how it was derived, or what it assumes. Those two door
kinds are not substitutes and I had been counting one as the other.

✅ **FIXED THE SAME DAY, AND IT IS A GATE.** `src/how-we-measure.html` — one
block per figure: what it was counted from, **the division itself** ("5,011 ÷
22,872 = 21.9"), why it is shown, and what is wrong with it; then seven arguments
against our method, four conceded as correct, as static markup so they survive a
dead data origin. `src/lib/methods.js` pairs every key the CARD reports drawing
with its derivation (`keysOf` asks the card, never a hand-written list) and owns
the one spelling of the anchor both pages use.

⭐⭐ **THE TEST IS THE ONLY VERSION OF THIS THAT SURVIVES.** A promise to keep
figures checkable is the kind of thing this repo forgets in a fortnight.
`test/methods.test.js` renders **both real pages** and compares their output —
every work-door href must resolve to a section the methods page actually
rendered, and the door count must equal the figure count. Checking either side
alone passes two pages that disagree about how the anchor is spelled. Write the
gate, not the intention.

⚠️ **AND LOOKING STILL FOUND TWO THINGS THE GATE COULD NOT.** The first rendering
explained in prose what each figure was counted from and then printed only the
archive size — *a page called "how this is counted" that never performed the
arithmetic*, and it read as finished. That is why league rows now carry `work`
({count, n, value}), computed once by the row and read by both surfaces. The same
pass caught "the middle value of 3,101,105" — a number with no noun, on the page
whose subject is what our numbers are made of. See [[looking-at-pixels]].

⚠️ **AND THE ADVERSARY IS RUN INTERNALLY FIRST.** Before publishing a
methodology, name the strongest arguments AGAINST it and answer them in public —
and where a criticism is correct, concede it in the same breath. For the
reliability instrument those are: a chronological split is conservative; r = 0.7
is a declared policy and not a measurement; 41 games is half a season and nothing
more; and **reliability is not usefulness** — a measure can be predictive before
it is stable, which is a fair hit and must be conceded rather than argued with.

Related: [[feedback-argue-the-opposite]] (make the counter-case, because agreement
between same-model reviewers is correlated), [[doc-claim-integrity]] (every claim
in a doc must be checkable), [[feedback-carry-your-n]], [[cold-reader-gate]]
(for a project whose pitch is check our work, a legibility defect IS a
correctness defect), [[feedback-no-hardcoded-values]].


---

## ⛔⛔⛔ THREE WAYS TO BUILD THIS AND STILL FAIL THE RULE (2026-09-23)

All three read as finished. None was caught by a test.

**1. A page called *how this is counted* that never does the arithmetic.** The
first rendering gave each figure a sentence — *"Counted: power-play goals / Out
of: power plays"* — and then printed the archive size and nothing else. The
division was never performed. ✅ Fixed by giving every league row a `work`
object `{count, n, value}`, computed ONCE by the row and read by both surfaces, so
the page prints **5,011 ÷ 22,872 = 21.9** and nothing on it divides. Found by
looking at a screenshot.

**2. Written in our own vocabulary.** [[cold-reader-gate]] has the full account.
The short of it: *a reader who has to learn our words before they can check our
work cannot check our work*, which is the same defect as a naked figure, and it
was invisible to me because I wrote every one of those words.

**3. ⭐⭐⭐ A CRITICISM AIMED AT THE WRONG NUMBER — the subtlest of the three.**
The CF% row's caveat conceded that we divide by games played when we should divide
by five-on-five minutes. `level5` is a SHARE of two teams' strictly-1551 attempts:
no per-game denominator, no special-teams time. **The criticism did not apply.**
The real fault was more specific and worse: `dmen` and `slot` count ALL
situations, so a team that draws penalties is partly being described by its power
play. ⛔ **A concession-shaped object passes every check we have** — it looks like
candour, reads like rigour, and protects the actual weakness by occupying its
slot. Kevin found it by noticing the phrasing was off. **When conceding, name the
number and check the definition: does this criticism attach to THIS arithmetic?**

## ⭐ AND THE BEST FIX FOR AN UNSUPPORTED CLAIM IS USUALLY NOT DELETION

The page explained the CF% score condition with a mechanism — *"a team that is
losing throws everything at the net"* — which we do not measure. Kevin: *"We don't
measure that, nor can we 'show the work' conclusively that that's the case, so why
do we include that snippet?"*

The archive had counted the EFFECT since the site began, in `baseRates`, read by
the front door and by nothing else: **2,228 of 4,100** — the team with more shot
attempts lost; **1,560 of 3,925** — the team that controlled play while the score
was level lost. The claim is now two checkable counts instead of an assertion.
⭐ **Before cutting an unsupported sentence, look for the measurement that already
supports it.** This repo publishes more than it reads.

## ✅ WHAT THE GATE ACTUALLY ASSERTS

`test/methods.test.js` renders **both real pages** and compares their output: every
work-door href the card writes must resolve to a section id the methods page
actually rendered, and the door count must equal the figure count. ⛔ Checking
either side alone passes two pages that disagree about how the anchor is spelled.
`src/lib/methods.js::keysOf` asks the CARD what it draws rather than holding a
second list, and `anchorOf` is the one spelling both pages use.

⏭ **OPEN: should the per-figure half be dispersed to the surfaces that print the
figures?** Kevin's idea, and the evidence says yes — see [[preview-what-to-watch-for]].


## ✅ 2026-09-24 — ONE STATEMENT OF EACH MEASUREMENT, AND WHERE IT LIVES

⛔ **FOUR MEASUREMENTS WERE WRITTEN OUT TWICE** — once in the front-door strip and
once in the card that proves them — **and the words had already drifted**: *"A
shot FROM inside the slot"* against *"A shot TAKEN FROM inside the slot"*.
⭐⭐ **The NUMBERS were never the exposure, which is why nobody saw it.** Both
sides substitute the same placeholder out of the same published measurement, so
the figures could not disagree and `measures_fresh.py` had them covered. The
SENTENCE was the half no guard watched. `FIGURE_CLAUSE` in `build_index.py` +
`test/test_one_statement.py`: every placeholder `_archive()` defines is written
at exactly one site across every builder.

⭐⭐⭐ **AND THE DEEPER CAUSE, FOUND WHILE SIZING THE FIX:** `archive.js` carries a
`what` on every measurement, because `share()` will not build one without it.
**`census.js` published none — nine sub-objects, zero sentences.** So the
surfaces printing census figures had nowhere to read a description FROM, and
`methods.js` hand-wrote one — the exact drift its own header says it exists to
prevent. ✅ `pace` and `endZone` now say what they are at the point they are
computed, and **no figure is named in either sentence**: a number typed into
prose beside the code that computes it is the same defect one step earlier.

⛔⛔ **AND THE ZONE NUMERATORS WERE BEING DISCARDED.** `ezAtk`/`ezDef` were
computed and thrown away, so the document carried two rates and a draw count and
**nothing a reader could multiply back** — on the site whose promise is that every
figure shows its division. Invisible, because a rate looks complete on its own.
✅ Published: **235,614 ÷ 165,420 = 1.424** now reproduces from the document a
critic can fetch. ⭐ The test for it is the READER's check — it touches only the
published block, which is all a critic has, not the accumulator.

⚠️ **KNOWN DEBT, MADE VISIBLE RATHER THAN IMPLICIT:** `whistles`, `shift`, `hits`,
`state`, `faceoffZone`, `drawStrength` and `shooter` still publish no `what`, and
their derivations are still hand-written. **The list is in the test**, so it is
where the debt shows when it shrinks — not a comment nobody re-reads.

## ✅ 2026-09-24 (afternoon) — THE RULE IS NOW CLOSED ON EVERY SURFACE

**Twelve doors on three static pages plus one per replay layer.** Measured by
marker census, not counted by eye: every placeholder replaced with a unique
string, the site rebuilt, the built pages grepped.

| surface | figures | doors |
|---|---|---|
| `what-you-can-see.html` | 17 | 6, one per card that prints one |
| `index.html` | 14 (13 + the archive size) | 4 |
| `slot.html` | 7 | 2 — the lede and the note under the drawing |
| the replay | one box per layer | 6, one per layer a viewer can switch on |
| the other five rule pages | 0 | 0, asserted |

⭐⭐⭐ **THE DOOR IS KEYED BY THE TOKEN, NEVER BY THE CARD.** `FIGURE_DERIVATION`
in `build_index.py` maps every `__PLACEHOLDER__` `_archive()` publishes to the
derivation that explains it. A map from CARD to derivation goes stale silently
the first time a card's copy is rewritten around a different measurement — the
sentence moves and the door does not, and both still render. `_archive()` now
refuses to publish a token nobody has claimed; `None` is a decision (the size of
the archive is not a measurement about hockey), an absence is a build failure.

⭐⭐ **AND THE FIGURES ON THOSE SURFACES READ THEIR OWN DESCRIPTION.** Kevin:
*"always go with the proper, transparent approach."* Every row in `DERIVATION`
carries a `count` and an `of` typed in `methods.js`, one file from the arithmetic
that makes them true. The new entries (`PRINTED`) type neither: they name the
three published fields and the path to the published `what`, and the page prints
that sentence. A test forbids a `count`/`of`/`what` key on any of them.

## ⭐⭐⭐ THE ONLY GATE HERE THAT IS NOT CIRCULAR — worth more than the other ten

Every other check on a door is computed from the same table the builder writes it
from. It proves the RENDERER works and says nothing about the AIM. **A door
pointing at the wrong derivation resolves, renders, and answers "where did that
come from?" by describing a different measurement — strictly worse than no
door.**

So one test reads the numbers off the **built copy** (Python substitution) and
off **`methods()`** (JavaScript), and requires the door's section to show a
number the copy shows. It caught a real one within the hour of being written.

⛔⛔⛔ **THREE MEASUREMENTS SHARE THE WORD "SLOT" AND I PAIRED TWO OF THEM WRONG,
AGAIN.** `slotGoals` is how often a shot from there goes in (11.4%); the card's
`slot` row is one CLUB's share of its own attempts; `slot.attempts` is the
LEAGUE's share of every located attempt (46.7%). The note under the drawing on
`slot.html` pointed at the club row — same definition, different population — so
46.7% would have opened on *r = 0.72 over 38 games*. See [[mechanize-the-review]]:
this is the third time that noun has cost something.

⚠️ **ONE DECLARED EXCEPTION, AND THE REASON IS ITSELF ASSERTED.** The `blocked`
card's "75 of 135" is counted in the ONE GAME it opens, so it cannot match an
archive figure. The door is still right — `m-attempts` is where the rule for an
attempt's ending lives — but the reader must be told the number is one game's, so
the test requires the card to still say *"in this game"*.

## ✅ THE REPLAY: RULES IN THE DESCRIPTORS, INDEXED BY THE METHODS PAGE

Kevin's ruling, 2026-09-24, after asking me to argue the contrary case: **the
rules live in the layer descriptors, rendered inline on the replay, and the
methods page INDEXES them** — not a section per layer written into that page,
which would be a second copy of `counts`/`credits` in a second language.

- `work: ['key', …]` joins `counts` and `credits` on each of the six layers. It
  is a LIST because Stoppages reports three measurements and one door would pick.
- `builders/layer-rules.mjs` asks the layers and writes `data/layer-rules.json` —
  the `learn-doors.mjs` arrangement. It **refuses** a layer with no `work`, an
  empty `counts`, or a key `methods.js` cannot explain, so those are build
  failures and not dead links.
- The door names the FIGURE, not "How we counted this": three identical links is
  a menu with nothing on it.
- ⭐ **The `where` line stopped being typed twice.** A layer records which figure
  it opens; the page inverts that document rather than being told again. `saves`
  carries no `where` at all — the Goaltending layer is its only surface.

⭐ **`src/lib/anchors.js` fell out of it, and `preview.html` is 17.6KB SMALLER
than before any of this started** (131,197 → 113,549). It was inlining the whole
of `methods.js` for one function, on the one page built to be pasted into a chat
window. One spelling of the anchor is unchanged; the file holding it went from
590 lines to 75.

## ✅ THE CENSUS DEBT IS CLOSED — all nine sub-objects publish a `what`

`whistles`, `shift`, `hits`, `state`, `faceoffZone`, `drawStrength` and `shooter`
joined `pace` and `endZone` on 2026-09-24. Each sentence carries the thing that
would otherwise be misread — `faceoffZone`'s O and D rows are the same draws
sorted by who won them; `hits` is counted by each home rink's own crew; `whistles`
are counts and not rates, and a power-play chance is not a penalty.

⭐⭐ **THE LIST IS NOW ASKED OF THE REDUCER, NOT TYPED.** The old test named the
two that were done and the seven that were not — a hand-written list cannot know
about a tenth sub-object, which is exactly how the first nine went unnoticed.

⭐⭐⭐ **A DESCRIPTION IS A PROPERTY OF THE MEASUREMENT, SO IT CANNOT DEPEND ON
WHETHER THE MEASUREMENT FOUND ANYTHING.** `shift` has an early return for an
empty archive and the first version wrote `what` into the populated return only —
so a document with no shift data published figures with nothing saying what they
are. The sentence now sits above the branch. Caught by the gate one minute later,
which is the argument for deriving the list rather than listing it.

⏭ **NOT LIVE UNTIL THE NEXT DERIVE** — Mondays 15:47 UTC. `data/measures.json` is
a CACHE of the published document, not the document. `census.faceoffZone` becomes
its own `PRINTED` entry then, and the Zone starts layer's door moves onto it.


## ✅ RE-OPENED AND CLOSED AGAIN BY A NEW SURFACE — 2026-10-07

The rule's own history is *"CLOSED is as of a DATE, not forever; every new surface
re-opens it"*, and the player block is the newest instance — **handled on the way
in rather than caught afterwards**, which is the first time that has happened.

Four new figures (a player's goals, assists, shots on goal, shot attempts per
game) meant four new rows printing numbers. The build REFUSED them until they
were explained:

- `EXPLAINS` gained the four row keys, all mapping to ONE derivation
  (`playerRate`) — they are the same division with four numerators, so four
  sections would be one explanation printed four times with a word changed.
- `DERIVATION.playerRate` carries the division, the why and the caveat.
- `methods.js` emits the section and `how-we-measure.html` draws it.

⭐ **THE GATES DID THE WORK, IN ORDER.** *"EXPLAINS declares a derivation for a
row the card cannot draw"* fired first (the rows had to be DECLARED, not just
invented), then *"the methods page renders a section for every figure"* (the page
had to grow one), then *"every work door the card writes lands on a section that
exists"*. ⚠️ And the neighbour-prose gate caught my `why` saying *"the totals are
printed beside it"* — a sentence about what sits next to a figure is true on at
most one of the three surfaces that draw it. Exactly the defect `attempts.why`
had, in the same week.
