---
name: base-layer-shading
description: SHIPPED 2026-08-25 as slot + blue-line furniture; ⛔ 2026-09-18 the BLUE-LINE BAND LEFT THE BASE ICE and now follows the zone-starts layer — the slot alone is the base layer. Carries the archive census that priced every decision, and the rule defect that drawing them exposed.
metadata:
  node_type: memory
  type: project
---

**LIVE at readthegame.co since 2026-08-25.** Kevin: *"I think that and the slot
shadowing make up the new base layer... it really focuses the viewer's eyes on
some key areas of the rink."* He approved the opacity on his phone.

## ⛔⛔ 2026-09-18: THE BLUE-LINE BAND IS NO LONGER ON THE BASE ICE

Kevin, from the live site: *"the more I watch replays, the less important that
area becomes… I don't think it's important enough to show a novice and have them
question why the shading is there."* It now appears **only with the zone-starts
layer** — the one layer whose claim is about zones. The slot stays.

⭐⭐ **THE REASON IS NOT IMPORTANCE, IT IS THAT IT COULD NOT BE CHECKED — and the
code had been saying so all along.** `rinkart.js` distinguishes them in its own
words: the slot is *"a geometric rule of ours"*, the band *"an aesthetic argument
about where the game is contested"*. The slot pays its way because
`HIGH_DANGER_FT` and `SLOT_HALF_WIDTH` are the same two constants
`isHighDanger()` tests, so **a mark inside the tint is a mark the layer counted**.
Everything else on that ice resolves to something too — the nine dots to the
archive, the five lines to the league. The band resolved only to an opinion, and
on a site whose pitch is *check our work* it was the one tint a curious novice
could not follow to an answer. **The 6.2% below is why no measurement could ever
settle it in either direction** — which makes it unfalsifiable, not vindicated.

⛔⛔ **AND THE KEY THAT EXPLAINED IT WAS ALREADY PARKED — found by being refused.**
The first build also gated the *"Either blue line"* card; `park.test.js` rejected
the rule because **a descendant cannot un-hide itself**: the whole *"What the
marks mean"* block sits under `#rg .zref{display:none}`, parked when Kevin cut
the page to its core. **So the band had been shipping as furniture with nothing
on the page naming it**, which is most of why a novice would have to ask. A
tripwire in `rink.test.js` now fails if that block is ever unparked.

⚠️ **Two of my own tests went red because a comment QUOTED markup.** `app.css` is
inlined into the page, so a literal disclosure tag written in an explanatory
comment was counted as one by the zone checks. Fifth instance in this stylesheet
— [[mechanize-the-review]].

## ⭐ THE PRINCIPLE THAT DECIDED EVERY CHOICE

**Each tint borrows the colour of the mark it explains.** The slot is `--hd`,
the high-danger ring's colour, so turning that layer on lands its marks inside a
region the viewer has been watching. The blue-line band is `--blue`, the line's
own. The palette does not grow, and the two cannot be read as one thing.

⭐ **AND THE SHAPES CARRY THE MEANING: the slot is a PLACE, the blue line is a
THRESHOLD.** A lozenge in front of a net versus a full-width strip across the
ice. Shading them alike would teach that they are the same kind of important,
which is the misconception rather than the lesson.

⭐ **EVERY EDGE LANDS ON A FACE-OFF DOT, so a viewer can check it by eye.**
`SLOT_HALF_WIDTH` is 22 and the end-zone dots sit at |y| 22; `ZONE_BAND_FT` is
the blue-line-to-neutral-dot distance (25 − 20 = 5 ft). **Both are coincidences
of the paint, not definitions** — the legend copy depends on them, so a test
reads the dots out of the DRAWN markup and checks one sits where the copy claims.
Five feet chosen by eye would have been a model wearing a UI control.

Opacities: slot `.09`, band `.055` — the band covers far more ice and must be
fainter. Both are visual judgements, both looked at, at 390 and 1100.

## ⭐ DRAWING THE RULE FOUND A DEFECT IN THE RULE

`isHighDanger` was a radius and a band, **and a radius does not stop at the goal
line** — so the painted region reached past the net to the end boards. Kevin:
*"I don't consider the slot to be valid behind the net."* Nobody had seen it
because **nobody had asked the rule to draw itself.**

Priced before it changed, over 4,192 games: **4,249 of 262,539 attempts (1.62%)
and 171 of 19,304 high-danger goals (0.89%)** — about one mark a game. Nothing
archive-wide moved: neither `measure.mjs` nor `archive.js` reads that function.
`DOCTRINE.md` §7 now states three clauses, all geometric.

## ⚠️ I USED RECORDING SILENCE AS EVIDENCE ABOUT HOCKEY — TWICE IN ONE DAY

Only **6.2%** of located plays fall within 5 ft of a blue line, and I offered
that against Kevin's "battleground" argument. **Holding the line produces no
recordable event.** The feed records where countable things happen, not where the
puck is contested — the same caveat that forbids a heat map of the neutral zone,
which I had written down myself. Kevin's push found it. *Absence of evidence in a
feed that only records events is not evidence about the game.*

## THE CENSUS — 4,192 games, three seasons, reuse these

- ⚠️⚠️ **THE SLOT'S GOAL SHARE IS 75.4%, NOT THE 79.4% THIS LINE USED TO SAY.**
  Corrected 2026-08-26. `archive.js::slotShare` now publishes it — **19,304 of
  25,597 goals over the same 4,192 games**, computed by `danger.js` itself (the
  shipped rule, over the shipped reducer) and cross-checking exactly against
  `attemptMix.byType.goal`. It is live in `measures.json` and the slot card reads
  it at render time, so **quote the published figure and never this file.**
  ⭐ **The 79.4% came from an ad-hoc census I cannot reproduce, and it had been
  copied into `docs/below-the-rink-2.md` §7.2 as though settled.** Four points of
  error, one hop from being typed onto the page — [[verify-inherited-claims]],
  and the reason the card COMPUTES its sentence instead of carrying a constant.
  The attempts figure (56.8%) and the blue-line figures below come from that same
  census and are **equally unverified**: treat them as unpublished until a
  measurement carries them.
- Near the attacking blue line (±10 ft): 8.2% of attempts, 3.3% of goals — the
  point shot is not a danger area, which is why the band is a threshold and not a
  second slot. ⚠️ Unverified, see above.
- **Why play stops** (186,048): goalie stopped a shot 34.6% · **icing 19.3%** ·
  puck in netting 11.8% · **offside 10.2%** (4.5/game). ⭐ *Icing stops play
  nearly twice as often as offside, and icing is about the CENTRE and GOAL lines.*
- **Where the next event lands, by current type** (within 25 ft, continuous play,
  n=869,617): blocked 29.7% · shot 28.4% · missed 23.1% · faceoff 22.4% ·
  takeaway 16.5% · giveaway 15.9% · hit 14.0% · **ALL 22.2%**.
  ⚠️ A one-game version of this table (n=266) had the ORDER right and every
  magnitude inflated 1.5–1.7×. "After a shot, play stays near the net about half
  the time" is **28%**.
  ⚠️ `penalty` reads 90.7% and is an ARTIFACT: 97.6% of those are penalty→penalty,
  coincidental minors from one scrum recorded at the same spot.

Related: [[hockey-legibility-build]] · [[looking-at-pixels]] ·
[[replay-motion-open]] (the arrivals shipped from that thread).


## ⛔⛔⛔ THE SLOT BOUNDARY HAS NO SOURCE — established 2026-09-28

`HIGH_DANGER_FT = 33` and `SLOT_HALF_WIDTH = 22` arrived in the **initial commit**
`be8bc01` (2026-08-07). **No file, doc or commit message in the repo says where
they came from.** Kevin: *"I don't remember if we made it up or borrowed it from a
high-danger definition on one of the analytics sites… either way, it's definitely
not a rule."*

⚠️ **DOCTRINE §7 IS NOT THE PROVENANCE, THOUGH IT READS LIKE IT.** It says
high-danger is *"a geometric rule — distance to net ≤ 33 ft, |y| ≤ 22 … because a
rule is inspectable and a viewer can verify it with a ruler."* That defends the
KIND of definition — a stated threshold — against a FITTED MODEL (xG). It says
nothing about where the two numbers came from. ⭐ **A sentence that justifies the
form of a choice is not a record of the choice.**

⭐⭐ **SO IT IS A POLICY, NOT A MEASUREMENT** — Kevin's own distinction — and that
decides what the collapse is for. Not deduplication: every surface that states the
boundary has to declare it as OURS.

- `printed.js` ✅ *"The boundary is also **ours** — 33 feet from the net and 22
  from centre."*
- `layers/danger.js` ⛔ *"within 33 ft of the net, **between the face-off dots**"*
  — presents our choice as the rink's own paint.

⛔ **AND THE DOTS AGREED BY COINCIDENCE OF TWO LITERALS.** `rinkart.js` puts the
end-zone dots at `|y| = 22` from measurement (2,134 draws across 39 games land on
nine coordinates); `SLOT_HALF_WIDTH = 22` is typed separately in `rink.js` with no
source. If the measured dot ever moved, *"between the face-off dots"* would go
quietly false.

## ✅ CLOSED 2026-09-28 — every surface declares the boundary as ours

`why.js` already had the voice and **contradicted itself three lines apart**: its
chip said *"(within the faceoff dots)"* while its rule statement said *"within ±22
ft of the middle … this is our own geometric rule, not a model and not anybody
else's statistic."* `danger.js` and `printed.js` now match the rule statement.
**Nothing says "between the face-off dots" any more.**

⭐⭐ **`printed.js`'s copy was DELETED, NOT DERIVED.** The shape is already stated
by the slot layer's own `counts` on every surface that caveat reaches, and
deriving would have meant importing `rink.js` into a module inlined on
`how-we-measure.html` — 5.4KB gzipped to restate a number the page prints.
**Deleting a second copy beats deriving a second copy**, and the claim the
sentence existed for got sharper: *"the slot is a shape we chose and state, not
one the rulebook draws."*

⚠️⚠️ **AND THE OLD SENTENCE WAS INVISIBLE TO ITS OWN GATE, TWICE OVER.**
`prose-constants.test.js` declares that it anchors on the UNIT, so `22 from
centre` was out of reach by its own stated rule — fine, declared. But `33 ` ended
one concatenated string and `'feet from the net'` began the next, so **the
quantity existed only in the concatenation** and nothing reassembles one. That
half was UNDECLARED. ⭐ **An undeclared blind spot is the one that misleads,
because the file's silence reads as coverage.** Now refused rather than
reconstructed: a number and its unit may not sit across a `+`. A half-built
joiner would report confidently about text it assembled wrongly.
