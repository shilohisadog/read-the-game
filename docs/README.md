# The design record

Most of what is here is **not documentation of the system**. It is the argument
that produced it — audits, proposals put up for adversarial review, the
measurements that settled them, and the findings that were **withdrawn** with
the evidence that killed them.

That is deliberate, and it is the most useful thing in the repo if you want to
know *why* something is the way it is. It is also the thing most likely to
mislead you if you read it as a description of the current site. **A document
here is a moment unless it says otherwise.**

Every file is listed below; `test/docs.test.js` fails if one is added or removed
without this index moving with it.

---

## Two names you will meet, and neither is a stranger to us

<!-- people: legend -->
These documents are arguments, and arguments have participants. Both names
appear throughout; neither is introduced anywhere else, which is a gap a reader
of this repo found rather than one we noticed.

- **Kevin** — Kevin Brown, who owns and directs the project. Quoted directly
  wherever a decision was his, because the wording usually carries the reason.
  When a document says *"Kevin ruled"*, that is the end of the argument.
- **CHENG** — the adversarial reviewer. Substantial designs are written up and
  put to CHENG to be argued against before they are built; the rulings are
  recorded with the reasoning, including the ones that killed a plan of ours or
  were themselves killed by a measurement. ⚠️ **CHENG and the author of most of
  this code are the same base model**, so their agreement is correlated and is
  deliberately worth less here than their disagreement. The review process
  exists to catch what one pass misses, not to manufacture a second opinion.
<!-- /people -->

## Start here

| | |
|---|---|
| **[architecture.md](architecture.md)** | 📐 **reference** — what the system is, the one place its shape breaks, and the decisions that look like oversights. Its sizes are generated and gated. |
| **[../DOCTRINE.md](../DOCTRINE.md)** | 📐 **reference** — what the site will and will not claim to a reader. The product bar. |
| **[../CONTRIBUTING.md](../CONTRIBUTING.md)** | 📐 **reference** — what counts as a valid check here. The engineering bar. |
| **[status.md](status.md)** | 📓 **living** — the build list and the single source of truth for what is built, decided or open. Long, and organised by state rather than date. Its health figures are generated. |
| **[site-purpose.md](site-purpose.md)** | 🧭 what the site is for and who it is for. The argument the rest is downstream of. |

## How the data is made

| | |
|---|---|
| **[platform-architecture.md](platform-architecture.md)** | 🏛 the multi-game platform argument. Partly superseded by `nightly-ingest.md`, which says so in its own header. |
| **[nightly-ingest.md](nightly-ingest.md)** | ✅ shipped — acquisition and convergence. `.github/workflows/ingest.yml`. |
| **[ingest-state.md](ingest-state.md)** | ✅ shipped — what the index records and what the front page says about staleness. Amends `nightly-ingest.md`. |
| **[catalog.md](catalog.md)** | ✅ shipped — the published catalog, and §6 records the four points CHENG argued. |
| **[event-timing.md](event-timing.md)** | 🕰 eight clocks, and why the speed control governs one. Citations pinned to an old revision **on purpose**. |
| **[ends-switching.md](ends-switching.md)** | ✅ shipped — coordinate normalization, and the paired test that made the flip provable. |

## What the numbers mean

| | |
|---|---|
| **[strength-filter.md](strength-filter.md)** | ✅ shipped — even strength as a view filter rather than a headline. ⚠️ Its `situationCode` handling was corrected 2026-09-03; the decoder now reads the digits. |
| **[blocked-shots-layer.md](blocked-shots-layer.md)** | ✅ shipped — the blocked-shot layer, and the attribution defect that preceded it. |
| **[whistle-layer.md](whistle-layer.md)** | ✅ shipped — §6 records what was built, including the thing the build found that the argument did not. |
| **[game-sentence.md](game-sentence.md)** | ⚠️ its figures predate the 4,417 → 4,490 archive correction; the header says so and gives the re-derived rates. |
| **[one-measure.md](one-measure.md)** | one measure on one screen — the hero's bar and its sentence. |
| **[why-it-matters.md](why-it-matters.md)** | 🧭 the one safe shape for "why this could matter" on a site that refuses to analyse. |
| **[measurement-cards.md](measurement-cards.md)** | ✅ pilot shipped (the slot); goaltending, blocked and control still queued. |

## The replay, and the page around it

| | |
|---|---|
| **[step1-review.md](step1-review.md)** | ⏸ **for review** — `src/app.js` became a module (shipped). What was done, the four guards, and the three places I think it is weakest. |
| **[step2-decomposition.md](step2-decomposition.md)** | ✅ **built** — decomposing `boot()`. Seven clusters out; byte-identity does not survive it, so a rendered-DOM walk replaced it. §0 carries CHENG's six rulings, §0.4–§0.5 what happened when they were built. |
| **[zlayers.md](zlayers.md)** | ⏸ **for review** — the parked layer menu is not dead: it holds live teaching copy, the load-bearing chain that repaints the visible picker, and ⛔ **the strength control, which no visitor can reach.** |
| **[render-residue.md](render-residue.md)** | ⏸ **for review** — what is left of `render`, counted. *"What remains is wiring"* turns out to be false in four places, and the question is whether the answer is code or checks. |
| **[sx-scope-question.md](sx-scope-question.md)** | ✅ **answered and built** — the `SX` ruling restated as a property of the artifact, and the answer that generalises: a static check can be two-sided. |
| **[app-state-phase1.md](app-state-phase1.md)** | ⛔ **superseded** — proposed removing the eight bindings that were never state. Absorbed into decomposition; see `status.md` §0. Its §1 (the file is one function) still holds. |
| **[app-state-phase2.md](app-state-phase2.md)** | ⛔ **superseded, and its §2 was wrong** — kept because the correction is the useful part. |
| **[main-app-rework.md](main-app-rework.md)** | 🏛 the audit that turned one HTML file into a program. Historical, and the origin of the current build chain. |
| **[deep-link-seam.md](deep-link-seam.md)** | ✅ shipped — URL vocabulary derived from the layer objects. Citations pinned on purpose. |
| **[restart-frames.md](restart-frames.md)** | ✅ shipped — what the replay does at a whistle. Two rounds of review. |
| **[event-index.md](event-index.md)** | going back to an event without scrubbing for it. |
| **[rink-and-card.md](rink-and-card.md)** | the rink and the card describing different moments. Citations pinned on purpose. |
| **[below-the-rink.md](below-the-rink.md)** | 🏛 the first audit of the area under the rink. Superseded by ↓. |
| **[below-the-rink-2.md](below-the-rink-2.md)** | ✅ shipped — the layer surface, distributions, summary and share links. The longest document here. |
| **[active-player.md](active-player.md)** | ✅ shipped — the named player on each frame, and why a bare name is ambiguous without its verb. |
| **[blocked-card.md](blocked-card.md)** | the blocked-shots card as a picture rather than prose. |
| **[scoreboard-mobile.md](scoreboard-mobile.md)** | ✅ shipped — the scoreboard on a phone. |
| **[test-architecture.md](test-architecture.md)** | ⏳ FOR REVIEW, nothing built — `test/` is **30,464 lines and not a tier**, 52% larger than the 20,063 the architecture model describes. Kevin, after one deleted `<div>` touched eleven files: *"I thought we just went through an architecture cleanup effort and now this surfaces."* ⛔⛔ **Coverage is visible to reading; COUPLING IS ONLY VISIBLE TO DELETION**, so a second audit would not catch the next one. Measured: **13 elements no reader can see are read by tests** (`cA`/`cH` by five files each), and **six files document the fake-DOM-invents-ids defect in prose with zero checks enforcing it**. ⭐ **SIZED: ~320 of 3,892 assertions (8%)** — but only ~24 are mechanically decidable; ~300 need triage, because source-anchoring is a smell only when the claim is about BEHAVIOUR and no regex separates those. Four proposed invariants, two cheap. |
| **[defect-corpus.md](defect-corpus.md)** | 🧪 **frozen evidence, 2026-09-16** — every documented defect as data: **420 from the commit history (201 reached the live site)** plus 1,148 from `docs/` and the developer's notes, each with who found it. **Of the 201 that shipped, Kevin found 102, model review 66, browser checks 15, the unit suite 0** — and ⛔ that last figure is survivorship-blind, which the document says before anything is deleted on it. ⛔ **A blind human relabel of 30 found the `oracle` labels not reproducible (2 of 25)**, so the layer sizing first drawn from them is withdrawn in the document itself. The largest class of fix is a defect in a CHECK (126 of 420). `node tools/defect-corpus.mjs` reproduces every figure. |
| **[test-program.md](test-program.md)** | ⏳ **FOR CHENG'S REVIEW, nothing built** — step 5 of the test re-architecture, and the answer to Kevin's *"unit through integration through … system testing, each had to pass before being handed off."* The six functions (ingest, interpret, store & publish, calculate, display, deliver) plus three rows no level holds (claims, source rules, the checks themselves) × five levels × **pipeline stages**: commit, **branch preview** (step 4 proved it reads production data), acceptance by batch, production, a pre-sync gate in the data pipeline, and a scheduled mutation run. Keeps the node suite (it catches most planted defects); moves visibility claims to a real browser and hands tests the frame instead of `#scrub`; closes the measured escapes (published numbers, 19 reader-facing changes) with checks that must be re-planted to count. ⛔ **`conservation()` fired on 0 of 187 planted defects**, so archive properties are not the tier they were proposed as. **Accepted only by measurement:** a churn replay of three intended changes, detection no worse than today, and the ids-named-by-more-than-three-files count (22). Argues against itself in §9 and asks seven questions. |
| **[stoppage-attribution.md](stoppage-attribution.md)** | 📐 **measured 2026-09-18, nothing built** — Kevin from the live site: *"do we know which team was offside… (same with icing)"*. The feed does **not**: every stoppage carries `own: null`. **The restart dot plus the rulebook does** — Rule 81 puts an icing draw in the offending team's end, and `extract.py::_norm` makes the home team always defend −x, so the sign names a club with no possession inference. Over all **4,490 published games / 58,379 stoppages**: **icing 99.99% nameable, offside 94.40%**. ⭐ Checked against a prediction the rules make **in both directions** — a short-handed team may ice legally, so the icing offender is short-handed **0.43%** against the other team's 1.30%, while for offside it flips to **1.93% against 9.71%**. ⛔ **Two fallbacks for the last 5.60% were tested and killed**, the second by running it against the 94.4% we can already name: it agreed **54.38%** of the time, and got worse the deeper the previous play was. ⛔ The first version of the short-handed check used skater counts and contradicted the rule at 4.91% — the pulled-goalie trap. |
| **[survivorship-experiment.md](survivorship-experiment.md)** | 🧪 **frozen evidence, run 2026-09-16** — step 3 of the test re-architecture: **187 random one-token defects planted** in the calculation modules, the replay page and the feed interpreter, each run past both suites, the feed gates, invariants and the publication step on 52 real games, and real Chrome on 47 page states. **The suite catches 58% / 75% / 76%**, so the corpus's *"0 of 201"* was structural. ⛔ **Five planted defects changed the published `measures.json`/`teams.json` with every test green**; removing the one test that caught a defect leaves only the DOM golden; **19 reader-facing changes passed every detector**; **1 of 5 false sentences was caught**. ⭐⭐ Kevin's blind review: **noticed 7 of 13, judged 6 of 7** — a person is a poor spotter and a good judge. ⛔ It measures missed defects only, not churn; the architecture's acceptance test must replay intended changes too. `docs/defects/survivorship-2026-09-16/scripts/tabulate.py` reprints every figure from the committed data. |
| **[preview-and-corsi.md](preview-and-corsi.md)** | ⭐ **PLAN OF RECORD §10 (converged with Kevin 2026-09-22): six fixed rows, both clubs, from game 1, each row labelled *still forming* / *settled*; a `detail` seam for per-player CF%. P1–P4 to CHENG. Nothing built.** Reviewed by CHENG in §9. Kevin, from the live front door: why does *Next* show one game when there are eight tonight? That became a preview of a club's next game — *what to watch for* — and naming Corsi. Measured over **1,312 games of 2025-26**: five club measures by split-half reliability (defencemen's share **0.91**, offsides 0.84, slot 0.83, penalties 0.76, power-play goals 0.66) plus club **5-on-5 CF% 0.90**; ⭐ the trailing push is **−0.03**, a law of hockey rather than a club trait; ⛔ the middle-half rule selects nothing over 32 clubs (3–8 items per matchup). Games-to-reliability makes the preview **additive**: CF% and defencemen unlock in November, power-play goals never within a season. ⭐ CHENG's Q1 — does ONE game show it? — measured: median flagged club **59–67%**, and both universals fail it too (trailing push **69.9%**, faceoff location **54.4%** at 5-on-5), so R1 proposes the rate as the WORDING rather than a gate. Per-player CF% rests on the shipped `onIce()` (**99.85%** five a side); ⛔ the first draft re-derived its boundary rule as new and overstated the risk from goals — corrected in §6 and §9.3. |
| **[frame-model.md](frame-model.md)** | ✅ **CLOSED 2026-09-17 — option B ruled, C deferred** (`test-program.md` §11.2). Was: ⏳ FOR REVIEW, nothing built, **and T1/T2 wait on it** — Kevin: *"are we truly cleansing the test/ architecture or are we simply cleaning up the smells of the current architecture?"* Measured: **two couplings with two causes.** VALUE — tests read the page's words to learn app state; one wording change to the period label failed **9 tests about other things**, and the parked `cA` carries 5.5× the assertions of its visible replacement. LAYOUT — tests regex the stylesheet because the fake DOM cannot see it; ⛔ **all five test files the `.pboxes` deletion touched were this kind, so a frame model would have changed none of them.** Asks CHENG to rule on rules-only, a harness that hands tests the frame, or a frame model in the app — and whether visibility claims belong in a browser. |
| **[mobile.md](mobile.md)** | 🔎 **open** — one measurement of the phone's first screen, taken before proposing anything. The drawing gets 19.4% of it; an empty box gets 14.2%. Three ways out, with the arithmetic, and the one that changes the ratio is unprototyped. |
| **[ten-second-hero.md](ten-second-hero.md)** | ✅ shipped 2026-08-25 — three changes to the front door, each claim naming its file and line. |

## Teaching surfaces

| | |
|---|---|
| **[learn-doors.md](learn-doors.md)** | ✅ shipped — every card becomes a link into a real game at a real frame. |
| **[penalties-card.md](penalties-card.md)** | ✅ shipped — the penalties page and its diagram. |
| **[on-the-ice.md](on-the-ice.md)** | ⛔ **describes a page removed 2026-09-03.** Kept for K3, and because its banner became DOCTRINE §5. |

## The front door and getting around

| | |
|---|---|
| **[home-page.md](home-page.md)** | 🏛 the first homepage argument. Superseded by ↓. |
| **[homepage.md](homepage.md)** | ✅ shipped — written against the live page, not against intentions. |
| **[site-chrome.md](site-chrome.md)** | ✅ shipped — the header, footer and nav that made a multi-page site possible. |
| **[discovery.md](discovery.md)** | ✅ shipped — C1, the calendar as the date index into the archive. |
| **[score-effects.md](score-effects.md)** | ✅ RULED and half BUILT — the archive published the answer to the site's own headline and no surface said it: the team with more attempts lost **2,228 of 4,100**, the team that controlled play while the score was **level** lost **1,560 of 3,925**. Both are on the front door now. CHENG: *the pair is an argument, not a curiosity.* ⛔ The proposed level-score CONTROL is blocked by Kevin's own 2026-09-07 removal of its sibling. |
| **[layer-ideas.md](layer-ideas.md)** | 📐 design, for review — the next two layers and one attribute. Zone starts (its base rate is already published over 165,420 draws), defencemen's attempts, and who was on the ice. Carries three traps: a blocked shot is recorded where it was STOPPED, the shift interval is `s < t <= e`, and a small sample erred in the flattering direction for the third time. |
| **[game-page-fold.md](game-page-fold.md)** | 📐 design, for review — the game page at a laptop's width, and a rule for which blocks may leave the ice: invariance under playhead movement. |
| **[front-door.md](front-door.md)** | 📐 design, for review — a page that changes every morning. Three defects shipped ahead of it; the daily block, the fold, and what the pipeline already throws away. |
| **[next-game.md](next-game.md)** | a card about the future on a site that refuses to forecast. |

## Method

| | |
|---|---|
| **[looking-at-pixels.md](looking-at-pixels.md)** | ⚠️ **read this before trusting a green suite about layout.** The unit tests are blind to it by construction, and this records the two ways the browser tool lied first. |
| **[asset-caching.md](asset-caching.md)** | ⏸ **open** — measured, nothing built, nothing decided. |

---

## Reading it honestly

**Citations pinned to old revisions are intentional.** Several documents pin
their line references to the commit they were written against, each carrying the
text that line must contain, and `tools/refcheck.py` checks both in the gates.
They point at history because the file they describe has since been split.

**Numbers in a document may be older than the archive, and that is the
convention rather than an oversight.** These are dated arguments: a figure here
carries the `n` it was measured over, and rewriting it to today's value would
destroy the record instead of maintaining it. Where a document's figures are
known to predate a correction, its own header says so — `game-sentence.md` is
the model.

**The figures that are *not* allowed to drift are gated**, and they are the ones
stated in the present tense:

| what | gated by |
|---|---|
| the suite and archive counts in `status.md` | `builders/health.mjs --check` |
| the tier table in `architecture.md` | `tools/tiers.mjs --check` |
| archive figures quoted in `src/lib` comments | `test/quoted-figures.test.js` |
| the snapshot banner on every dated document | `tools/snapshots.mjs --check` |

The third was added 2026-09-03 after six went stale: `sentence.js` argued from
*"1,527 of 3,855 games"* while the published `measures.json` said 1,560 of
3,925. The fourth puts a generated banner on all 16 documents that quote a
superseded figure, saying what the archive holds **now**. Both read their
expectations **from `measures.json` at test time**, so a re-derive turns them red
rather than leaving the prose behind.

⭐ **And no document's body is ever rewritten to match.** The figures in a dated
argument are the evidence it was made from; silently updating them would make
the record claim a case was argued from evidence nobody had yet. The measurement
is not the defect — an undated measurement read as a current one is.

**Withdrawn findings are left in place, not deleted.** A wrong conclusion with
the evidence that killed it beside it is more useful than a clean document, and
this project has published several — including a flagship number that shipped
wrong and propagated through four artifacts before anyone re-derived it.
