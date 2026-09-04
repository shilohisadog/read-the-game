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
| **[step2-decomposition.md](step2-decomposition.md)** | ⏸ **plan, for review** — decomposing `boot()`. Byte-identity does not survive it, and the interior still resists measurement. |
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
