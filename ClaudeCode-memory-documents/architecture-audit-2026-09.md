---
name: architecture-audit-2026-09
description: "The September run. Decomposition DONE on CONTRIBUTING rule 9. ⭐⭐⭐ 2026-09-07: THREE of the status rows were WRONG ABOUT THEIR OWN SUBJECT, each disproved in under a minute by BOOTING THE PAGE, and EIGHT instruments covered less than their name implied. ⭐⭐⭐ 2026-09-08/09: the NHL goal highlight shipped end to end, and THREE TIMES ON ONE FEATURE a claim about a HIT TARGET survived a check it could not fail — one of them exposing a months-old live bug in the slot why-card. **Kevin is right from the live site every time, and what he is usually right about is that my evidence was about a PART.**"
metadata:
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-08T00:00:00.000Z
---

# 2026-09-08/09 — THE DAY THE SITE STARTED CARRYING SOMEBODY ELSE'S VIDEO

Twelve commits. **B6** (the interrupted penalty countdown), the **Workshop link**
closed, the **NHL goal highlight end to end**, the **tip-jar split**, and a
**hit-target bug that had been live for months**.

## ⭐⭐⭐ THE PATTERN OF THE DAY: EVERY CLAIM ABOUT A TARGET WAS UNTESTABLE

Three times on one feature, a check was green and the thing a person presses was
dead — see [[mechanize-the-review]] for the table. **A test that constructs the
ideal event tests the handler's arithmetic and never its hit path.** Kevin found
each of them by clicking, exactly as 2026-09-07 was found by looking.

⭐ And the third one exposed a **pre-existing live defect**: the slot layer's
"click a ring to see why" has never worked on a **goal**, because a goal is drawn
as a figure and the handler read `ev.target`. Ordinary marks are a bare circle, so
everything except goals worked and nobody looked.

## ⭐⭐ WHAT KEVIN CAUGHT THAT I HAD WRONG

Four in two days, and none was a bug — all four were **scope or evidence**:

1. **Two already-declined recommendations** in one session — [[verify-inherited-claims]].
2. **The tip jar removed from 14 pages when only 2 needed it.** *"I think it's fair
   and reasonable to have the tip jar on the non-clip-capable pages."*
3. **"The page doesn't scroll down"** — twice, and the second time the real cause
   was the hit target, not the scroll.
4. **The hero-loop "problem" I raised was not one.**

⭐ **He is right from the live site every single time**, and the thing he is
usually right about is that **my evidence was about a part.**

## ⭐⭐ AND ONE THING I GOT RIGHT BY DISBELIEVING MYSELF

I reported the embed player had no ad plugin, read off its static configuration.
**Loading it proved the opposite** — a full Google ad stack and a pre-roll — and I
reversed my own recommendation on it. Kevin then overruled the reversal with the
argument that mattered (*the visitor does not leave our site*), which is why it
shipped **collapsed, with the advertisement named before the press**.
[[nhl-highlight-embed]] carries the terms, the measurements and the CSP change.

## ⭐ THE STRUCTURAL FINDING

`extract.SCHEMA` — *an extract is a pure function of (raws, extractor), and only
half of that was tracked.* ⚠️ Defensive, not a live bug, and I corrected my own
overstatement of it before committing. [[mechanize-the-review]].


**`docs/status.md` §0 is the live pick-up point; this is the reasoning behind it.**
Kevin drove all of it by refusing every answer smaller than the question.

## ✅ WHERE IT ENDED — 2026-09-04/05, and the stopping rule is the deliverable

| | before | now |
|---|---|---|
| `src/app.js` | 3,368 | **3,183** |
| `render()` | 328 | **208** (187 at the low point) |
| modules out of `boot` | 0 | **7** — why, esc, work, marks, notes, goalie-card, **announce** |
| JS suite | 984 | **1,064** |

⭐⭐ **`render` went BACK UP and that is the finding.** The last four items were
answered by writing down reasons that had never been written down. **The line
count was never the thing** — now `CONTRIBUTING.md` **rule 9**: *move code only
when a caller gains a question it could not ask; a refactor ends when the last
unstated invariant gets an instrument, not when the file gets small.* CHENG:
*"that is your own test applied against your own preference, and it holds."*

Step 1 (make it a module) and six extractions all landed with the **rendered DOM
identical**. ⭐ **The split is `return markup` vs `write to document`** — CHENG's
ruling — and it needed no new tier: `rinkart.js` was already presentation and
nobody had named it.

## ✅ THE LAST CLUSTER — and it was a rule STATED TWICE
The **caption chain** is `src/lib/announce.js`; CHENG ruled precedence is
**analysis** (*"it would be identical if the caption were rendered as audio"*).
⭐⭐ **The find nobody expected: `captioned()` — the predicate `dwell()` shares
with the renderer — held the SAME SIX CONDITIONS as a disjunction.** Two
statements of one rule; a seventh added to the ladder and forgotten there is a
caption with no pause behind it. Now `announcement(…)!==null`.

⭐ **It shrank nothing: 66 in, 66 out, net zero; 11 lines of code, 96 of comment.**
What it bought is that the ladder can be asked **all fifteen** of its pairwise
collisions — the reference game contains **one**.

## ✅ THE `SX` GUARD (Q5) — narrowed, but NOT the way the question assumed
It walks the dependency graph down from each layer's `reduce()` now. ⚠️ **It did
NOT replace the directory ban, because measuring said not to:** the six layers'
closures are **10 of 26 modules**, and `census.js` — where every published archive
figure is counted — is outside them. ⚠️ **And "strictly stronger" was wrong**: the
old check was transitively sound *because* it was over-broad. ⚠️ **The `AX`
workaround was never the guard's doing** — `AX` is `SX` composed with `DIR(per)`,
which closes over page state, so it has no module to live in.

## ⭐⭐ THE FIVE THINGS THE WORK TAUGHT
1. **A walk covers the state it was booted into, and nothing else.** Three times
   the golden did not cover the cluster about to move — a **click**
   (`#whyContent`), a **choice** (`#workBody`), a **control off its default**
   (the marks loop's period branch). **Check coverage BEFORE the move**; that
   habit was worth more than any single test.
2. **Cohesion predicts interface width.** `marks.js` 19 inputs/57 lines vs
   `notes.js` 7/3 functions. **Width measures the cluster, not the method.**
3. ⭐⭐ **THE REAL CASE FOR DECOMPOSITION — not "comments become checks":**
   *a function you can call takes any argument; a page you must boot takes only
   the game it was given.* `iceNote` has 3 outcomes, the game has 1; the goalie
   card's honest cases are the THIN ones no fixture contains.
4. **A cluster is a function plus only the helpers nothing else uses** — **41 of
   boot's 79 functions have 2+ callers.** `lboxFor` is shared with the layer box;
   `cardsFor` cannot leave (reads a builder-injected constant).
5. ⚠️ **A test anchored on a source file breaks on a move while the page is
   unchanged** — three of them (`why-popup`, `learn`, `layers`), all re-aimed at
   the rendered page.

## ⚠️ MISTAKES WORTH KEEPING
- **ASI**: a bare `return` on its own line returns `undefined`. All five layers
  rendered empty **and produced the same hash**, which is what gave it away.
- ⛔ **Unreachable code is invisible to a parser, a probe AND an output diff.**
  Only reading the generated file found it.
- ⚠️ **A test was a mirror twice on six lines** — "where the line starts", then
  "different nets"; a sign flip survived both. Third draft derives the answer from
  `attackDirection`. **Weak properties read like strong ones until something mutates.**
- ⚠️ **Line counts typed into two commit messages before measuring.** Fix is
  ORDER, not care: measure, then write the sentence around the number.

## THE INSTRUMENTS BUILT
`tools/dom-golden.mjs` + `test/dom-golden.test.js` — the rendered DOM at 269
frames × 86 elements, plus 5 layer walks, 3 control axes, 44 popup renders.
Deltas against the base so each walk **reads**. ⚠️ **A change detector, not a
correctness claim** — regenerating without reading what moved is how it dies.
⭐ **Two instruments, demonstrated complementary:** delete a full stop → every
unit test green, golden red at `#iceNote frame 254`.
`tools/jslex.mjs` — the lexer. **Never measure app.js with a regex.**

Related: [[mechanize-the-review]] · [[name-the-path-to-the-expectation]] ·
[[hockey-legibility-build]] · [[verify-inherited-claims]] · [[looking-at-pixels]]

## ⭐ THE GOLDEN'S FOURTH GAP — and the first caught BEFORE the move
Every walk drove the SCRUBBER, whose `oninput` passes an empty `how`, so `moment`
was false in **all 2,421 captured frames** and the entire `if(moment)` caption
chain had **never executed**. Two play passes were added *first*; the pill moves
through **15** states in the default replay and **29** with the slot layer on.
⚠️ **And the first draft of that pass was DECORATIVE** — captured, stored, never
compared, so the tool printed *"rendered DOM unchanged"* while holding 538 new
frames. The trap is documented in the function directly above it.

## ⭐ WHAT `render` STILL HOLDS — four things that were never wiring
`docs/render-residue.md`, measured line by line. **A `moment` / `how==='play'`
distinction** (a deep link captions but must NOT flash the counters — nothing was
just attempted); **`prevA`/`prevH` written even on a scrub**, which is what
re-bases the flash after a drag; **an analysis computation inline in a renderer**
(moved to `layer.js` as `droppedForStrength`); and **three memos that are a DOM
cache**. Three of the four wanted comments and checks, not moves.

⭐ **THE MEMOS ARE THREE KINDS, NOT TWO** — CHENG said content-keyed vs
proxy-keyed; measuring found `pillIs` keys on a **digest of its inputs**, so it
needs a premise too, and the one thing its key omits is `AID`. `rinkPer` keys on
the PERIOD while what it draws also depends on `AX` and the club colours — safe
**by circumstance**, and ⛔ **its failure mode is invisible to a golden walk,
because a stale frame renders identically on every pass.** The premise is asserted
now (`test/rink-memo.test.js`), not described.

## ✅ 09-05 → 09-07 — THE THREE CLEANUPS, AND THE ORDER WAS THE WORK
`lastHD` (dead, 26→25 bindings) · **Q11** · the parked menu **deleted**.
⭐⭐ **Deleting the menu FIRST — which is what I told Kevin was safe — would have
blanked the layer definitions in show-me-the-work, thrown the page at boot, and
taken the strength control with it.** Copy out, control out, then machinery.

**Q11, ruled by CHENG and built:** `counts` and `credits` are properties of the
LAYER object now (beside `id`, `label`, `reduce`); **what a layer DRAWS stayed
with the renderer**, which was his own caveat and right — *"an amber ring marks
each one" is a fact about this renderer.* His argument that killed my hesitation:
**`label` has been user-facing prose in the analysis tier all along.**

⛔ **`zoneState` is the one to remember.** It counted on-layers from
`aria-pressed` **on the hidden rows**, praised in its own comment as *"derived
from the DOM, not from a list"* — correct when the rows were the control, and by
the end **the visible picker was repainting through a derivation running on
invisible markup.** *A derivation is only as good as the thing it derives from is
real.*

## ⛔⛔ THE INSTRUMENT LIST — six, and it is a property now
coverage can't see `app.js` · the golden never entered `if(moment)` (2,421 frames)
· the fit gate graded an error page · the canary proved the ruler · **the fake DOM
cannot fail on absence** · the golden can't read a stylesheet · and
`layers.test.js` (blind to ancestry) + `park.test.js` (only sees ids) **left the
strength control in the gap between them.**

⭐⭐ **AND TWICE THE INSTRUMENT FIRED AND WAS WAVED THROUGH** — `#nSit` ledgered
with a reason while its control was unreachable; `.lds` recorded as serving
`.zref` and blanket-stripped anyway. **Enumerating is not reading what you
enumerated.**


---

# ⭐⭐⭐ 2026-09-07 — THE DAY EVERY REQUEST BECAME A CORRECTION OF THE RECORD

Ten commits, all live. `docs/status.md` §0.00-δ/ε/ζ/η carry the detail; this is
the pattern, which the repo does not state anywhere.

**Kevin asked for six things. Three of them turned out to rest on a claim in our
own record that had stopped being true.**

| the row said | the page said |
|---|---|
| *"sweep its `.zon` CSS"* | `.zon` is the one class in that block that had to STAY — `#zTrailsOn` and `#zCueOn` wear it |
| the slot tip is *"the one interaction a novice would never guess"* | the caption had been teaching it since 2026-08-27, unconditionally, from frame one |
| `active-player.md`: *"the line does not wrap on a phone"* | measured `"Surname #NN"` — the NAME, not the SENTENCE. The blocked form was 46ch against a 39ch budget |

⭐ **Each took under a minute to disprove by BOOTING THE PAGE.** None was
disprovable by reading. That is the whole lesson: *the instrument for a claim
about the page is the page.*

## ⚠️⚠️ AND I PROPAGATED ONE INTO THE CODE THE SAME MORNING

Sweeping CSS at 10am I wrote into `app.css` that *"the amber ring is named in the
`.hint` line and almost nowhere else"* — lifted from the status row, never
checked. By afternoon Kevin's own instruction sent me to look, and it was false.
**A claim in the record is not evidence, and the shortest path to laundering one
into fact is quoting it in a comment.** See [[verify-inherited-claims]].

## ⭐⭐ THE TWO MISTAKES THAT WERE MINE HAVE ONE SHAPE

Both were **reasoning from something true about a part**:

1. **The note overlay.** I proposed `position:absolute` for the ends note quoting
   the page's own precedent correctly — the work panel's *"the flow is untouched
   and nothing below the card moves when it opens."* True. And wrong here: at 390
   the rink is 164px tall and the note is 59px, so it covered the ice it was a
   caption FOR. ⭐ **The work panel is a surface a reader OPENS; these arrive
   unbidden.** A precedent transfers with its conditions.
2. **The `▶ Play` label.** Offered as the jitter fix having measured ONE of its
   three states. `▶ Play` is 76px and fits; `⏸ Pause` (87) and `▶ Replay` (95)
   rewrap. The 54px jump moved from the pre-game frame to the same click.

⭐ **And a third, caught before reporting:** I read `textContent` off the
power-play pill and nearly filed a bug — `hidden` leaves text in the DOM.
*Read visibility when visibility is the question.*

## ⛔ THE INSTRUMENT LIST IS EIGHT NOW

Added 2026-09-07, both caught BEFORE shipping rather than after:

- **`tools/jslex.mjs` dropped template text.** A scan for prose would have matched
  **0 of the corpus's 19 feet-phrases** and reported it clean forever — every one
  is a template literal. `walk` emits `tstr` now.
- **`layer-copy.test.js`'s `app.includes(l.counts)`** compared an EVALUATED string
  against the bundle's SOURCE text, so what it enforced was *a layer description
  may never be computed* — **it went red on the fix to the defect its own header
  describes.** ⭐ *A check that forbids the correction to the problem it describes
  is worth more as a lesson than as a check.*

## ⭐ WHAT SHIPPED, and the rulings inside it

- **`prose-constants.test.js`** — a number the code owns must not be typed into the
  sentence describing it. Found `HIGH_DANGER_FT` typed on **five surfaces across
  three tiers**, ⚠️ including eighteen lines below its own `import`, under a
  comment claiming the relocation had fixed exactly that. **Proximity is not a
  check.**
- **`css-orphans.test.js`** — 12 orphans, only 6 from the menu; the others dead
  1–4 weeks. 29 rules, 8.8 KB. Proven inert by a **pixel-identical** before/after.
- **The active-player line moved under the drawing** (479px → 11–169px at 390) and
  **leads with the BLOCKER** on a blocked shot — Kevin's call, and the ice already
  agreed: the label and the figure name the blocker, the line was the last holdout.
  ⛔ `field` stays `shootingPlayerId` — that is what Control counts from.
- **The ice stopped moving.** `#endnote` was shoving the rink 69px on 15 of 269
  frames. Now one position, zero spread, at 360/390/1920.
- **Four of Kevin's calls in one commit** — `◀ Prev`/`Next ▶` (kills the last
  transport jitter AND saves 54px at 360), the **Situations chips removed** (the
  filter stays; `?strength=even` reaches it), a goal renders **nothing** on the
  line, and the surprising column **states a rule** instead of one example plus a
  false promise of N others.
- ⛔ **`box.js` released the wrong penalties** — see [[mechanize-the-review]].
