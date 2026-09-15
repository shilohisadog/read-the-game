# The test tier — an architecture nobody declared

**Written 2026-09-15 for CHENG's review. Nothing here is built.**

Kevin, after deleting one `<div>` touched eleven files: *"I'm still not tracking
with why the removal of the penalty box touched so many files… I thought we just
went through an architecture cleanup effort and now this surfaces."* And then the
standard: *"this is an open source project where any code (app centric or test
centric or whatever) smells are unacceptable."*

**WHAT PROMPTED IT, for a reader arriving cold.** This repo builds a hockey
replay site: `builders/*.py` generate `src/*.html`, `src/lib/**` holds the pure
analysis modules, and `npm run gates` enforces the tier boundaries described in
`docs/architecture.md`. On 2026-09-15 a penalty-box band under the ice was
deleted — one line of markup, superseded three weeks earlier when penalties
moved onto the scoreboard. The change touched eleven files. Kevin asked why, and
the answer turned out not to be about penalties at all.

**THE CLAIM THIS DOCUMENT MAKES:** the test suite has an architecture, it has
never been declared, nothing checks it, and the coupling that made a one-line
deletion expensive is invisible to the kind of review this project already does
well. Every figure below is measured; the scripts are one-off and the numbers
are reproducible from the repo at this commit.

---

## 1. The gap, measured

| | lines |
|---|---:|
| everything `docs/architecture.md` names — seven tiers | **20,063** |
| `test/` — **not a tier, not modelled, not checked** | **30,464** across 85 files |

The tier model describes acquisition → interpretation → orchestration → analysis
→ measurement → presentation → the app. It is enforced on every `npm run gates`:
`tools/tiers.mjs` counts each tier from the filesystem, and
`test/app-imports.test.js` keeps the import direction honest.

**It has no opinion about the test suite at all** — and the test suite is 52%
larger than everything it describes.

⭐ **THE SEPTEMBER AUDIT WAS NOT WRONGLY DONE; IT WAS POINTED AT THE SMALLER
HALF.** It did examine instruments — its headline findings were *"eight
instruments covered less than their name implied"* and *"three status rows were
wrong about their own subject."* It asked **does this assertion test what its
name claims?** It never asked **what does this assertion depend on that is not
its subject?**

> ⛔⛔ **COVERAGE IS VISIBLE TO READING. COUPLING IS ONLY VISIBLE TO DELETION.**
> `render-strength-pill.test.js` asserting *"the team chip is the penalty box's,
> not a second implementation"* reads as a good test: it is a DRY check, it is
> well argued, and its name is honest. Nothing about reading it tells you it
> breaks when penalties move off the ice. You find that out by pulling.

So a second audit would not catch the next one either. The instrument for
coupling is a **standing mechanical invariant**, not a human read — which is this
project's own doctrine (`mechanize the review`) applied to a tier it never
covered.

## 2. What the eleven files actually were

The change that prompted this deleted **one line of markup** and its CSS.

| | files | authored |
|---|---:|---|
| generated — two built pages, two generated doc blocks | 4 | **none**; build output and `tiers.mjs`/`health.mjs` blocks |
| the deletion — `build_main.py`, `app.css` | 2 | one markup line, and its rules |
| tests | 5 | — |

And the five tests split two ways:

- **Two were tests OF the penalty box** (`box.test.js`). They die with it, correctly.
- **Three were tests of something else that used it as a landmark:**
  - `render-strength-pill.test.js` — about the **power-play pill**, anchored on `.pb`'s CSS pattern.
  - `render-transport.test.js` — about the **caption pill**, which named `.pboxes` as the container to check it was not inside.
  - `park.test.js` — used `pboxes` as the **sentinel** proving its darkness model still had a subject.

**None of those three is about penalties.** That is the coupling, and it is
invisible until something is removed.

## 3. Four mechanical questions, asked of the suite

### Q1 — does a test drive an element the page does not have?

`fakeDom`'s `getElementById` **invents** an element for any id, so a click on a
deleted control is a silent no-op. Across all 14 built pages (171 ids), test
files performing a DOM lookup for an id **no page has**: **4**, of which two are
false positives my first instrument could not see (`homepage.test.js` asserting
the id is *gone*, `lbox.test.js` naming one inside a comment).

Two are real: `deeplink-render.test.js` builds a fake `#rg .lrow` group out of
`lyCorsi`/`lyHd`/`lyGoalie`/`lyWhistle`/`lyBlock` — a layer menu deleted by
`70f41db` — and `render-ends.test.js` reads `nSit`, which no page has, as one of
ten observables in its ends-invariance comparison. That comparison has been
`"" === ""` on that field since the id vanished.

⚠️ **THE INSTRUMENT'S OWN NOISE IS A FINDING.** The first version matched `get(`
and flagged Map lookups and URL parameters, and compared against one page when
tests target fourteen. A check about the suite has to be as careful as a check
about the app, and this one was not until it was corrected.

### Q2 — does a test read an element no reader can see?

**Thirteen.** Ids sitting inside a container the stylesheet hides, read by tests:

| id | read by |
|---|---|
| `cA`, `cH` | **5 files each** — hero-loop, render-ends, render-preview, render-transport, render-whistle |
| `pa`, `ph`, `pMode`, `mA` | 2 files each |
| `mH`, `pName`, `ba`, `bh` | 1 file each |
| `nTrails`, `zTrailsOn`, `slotSay` | the reference and display zones — on `park.test.js`'s ledger deliberately |

**This is the arrangement that made deletion expensive.** Ten of those thirteen
belong to `.counters` and `.cbar`, parked at Kevin's word on 2026-08-27 —
*"let's hide (not remove, but temporarily hide)… I want to start fresh on how and
where we display the metrics/information"* — and superseded by `#lbox` four hours
later. For three weeks they were written every frame, visible to nobody, and
load-bearing for eleven test files.

⭐ **AND MOSTLY REDUNDANT.** `smoke.test.js` asserts `cA` reads `80`. So does
`layers.test.js:69`, on the reducer's own output. So does `attribution.test.js:39`.
`strength.test.js:216` is literally *"the numbers land where the design says:
80/55 becomes 48/38"*. The DOM copy is the **fourth** statement of that fact and
the weakest — through a span nobody can see.

### Q3 — does a test assert arithmetic a reducer test already owns?

Every reducer is already imported directly by 4–16 test files. The overlap above
is not an accident of one file; it is the predictable result of having no rule
about **where a claim belongs**.

### Q4 — which ids are landmarks?

Measured: **19 ids are named by 4 or more test files.** But the raw measure does
not separate the two cases, and saying so is more useful than the number:

- `scrub` (18 files), `play` (11), `rg` (8), `events` (8) — these are **drivers**.
  A test must be able to move the playhead; that is not coupling.
- The coupling is **asserting on a surface you are not about**.

> ⭐ **THE CUT IS DRIVE vs ASSERT, NOT BREADTH.** Any test may click any control.
> A test that reads a *value* off a surface outside its own subject is the thing
> that breaks when that surface moves. Q4 as first written would have condemned
> `scrub` and exonerated nothing.

## 4. The finding that ties it together

**Six test files carry prose documenting that the fake DOM invents ids** —
`lbox`, `render-labels`, `deeplink-render`, `render-board`, `smoke`, `homepage`.
`smoke.test.js` says it plainest: *"the fake invents an element for any id, so
the clicks silently did nothing rather than failing."* `deeplink-render.test.js`
warns in a comment that *"a fake that keeps modelling a deleted control is how 23
tests drove a ghost for a day in August"* — directly above a fake that models a
deleted control.

**Standing mechanical checks enforcing any of it: zero.**

> ⛔⛔⛔ **THE DEFECT HAS BEEN FOUND AND LOCALLY FIXED AT LEAST SIX TIMES AND NEVER
> INSTRUMENTED.** This project already has the sentence for that — *written down
> and then broken is UN-INSTRUMENTED* (`stale-fixtures`) — and *a defect fixed in
> one call site is not fixed; it is a search nobody ran.*

## 4b. How big is the cleanup, measured

Kevin: *"there are 30K SLOC in the test directory, this cleanup should be pretty
good-sized I would imagine."*

**Lines are the wrong unit — violations are.** The tier is 30,550 lines, but only
**15,816 are code**; 12,374 are comment and 2,360 blank, which is this project's
house style rather than bulk. What matters is the **3,892 assertions**.

| class | candidate sites | files | mechanically decidable? |
|---|---:|---:|---|
| a test looks up an id no page has (Q1) | 2 | 2 | **yes** |
| a test reads an element no reader can see (Q2) | 13 | 8 | **yes** |
| a numeric claim a reducer test already owns (Q3) | ~9 | 2 | **yes** |
| anchored on SOURCE TEXT rather than behaviour | **107** | 23 | no — see below |
| presence-not-content (`assert.ok` round a match) | **174** | 37 | no |
| assertions inside a data-dependent branch (§H4) | 15 | 9 | partly |

**≈320 of 3,892 assertions — about 8%.** So the answer to "is this good-sized" is
yes, and my first estimate of 0.6% was four questions' worth rather than the
suite's.

⚠️ **BUT THE TOP TWO ARE CANDIDATES, NOT DEFECTS, AND THE DIFFERENCE IS THE WHOLE
DIFFICULTY.** `build.test.js` asserting against the bundle IS its subject — source
text is what a build test is about. `park.test.js` scanning `APP_JS` for writes is
legitimate for the same reason. Source-anchoring is a smell only when the claim is
about BEHAVIOUR, and no regex separates those. The same is true of
presence-not-content: `assert.ok(x.includes(y))` is weak only when `y` is
trivially present, which needs reading `y`.

> ⭐ **SO THE WORK SPLITS IN TWO, AND ONLY ONE HALF IS AUTOMATABLE.** ~24 sites are
> decidable by a standing check and can be fixed now. ~300 need triage, one at a
> time, by someone reading what the assertion is *for*. Reporting 320 as a defect
> count would be the same error this document is about: a number that has not
> asked whether its subject is really its subject.

⭐ **ONE SIGNAL WORTH FOLLOWING.** `render-ends.test.js` carries the most
data-dependent branches (5), and is also the file whose ends-invariance test was
found this week to drive five phantom controls and compare `"" === ""` on a sixth
observable. Concentration is evidence; that file should be triaged first.

## 5. Proposed invariants

Each is mechanical, needs no judgement, and names the case it would have caught.

| # | invariant | would have caught |
|---|---|---|
| **T1** | Every id a test looks up must exist in some built page. | the `lyCorsi` ghost fixture; `nSit`; the 23 tests that drove a deleted control for a day in August |
| **T2** | No test may read an element inside a container the stylesheet hides, unless it is the test *of* that parking. | all 10 `.counters`/`.cbar` ids, **at the moment they were parked** rather than three weeks later |
| **T3** | A numeric claim about a reducer belongs in a test that imports the reducer. A page test asserts that the number is *shown*, not what it is. | `80`/`55`/`48`/`38` asserted four times over |
| **T4** | A test may DRIVE any control; it may ASSERT only on its own surface, or declare the cross-surface dependency with a reason. | the three tests that navigated by the penalty box |

**T1 and T2 are cheap and I would build them first.** `park.test.js` already
computes both halves of T2 — which containers are dark, and which ids sit inside
them — and simply never asks whether a *test* reads them. T1 is the twenty lines
in §3.

**T3 and T4 need a declared subject per test file** and are a larger piece of
work; T4 in particular cannot be derived from a filename without guessing.
⚠️ **Proposing them is not the same as proposing to enforce them tomorrow** — a
guard that fires on every run is a guard somebody switches off (`guard-where-the-archive-is`).

## 6. What I want ruled

1. **Does `test/` become a declared tier in `docs/architecture.md`**, counted by
   `tools/tiers.mjs` like the other seven — or does it stay outside the model
   with only T1/T2 enforcing it?
2. **T4 needs a notion of a test file's SUBJECT.** Derived from the filename, or
   declared in a header the file owns? The second is honest and costs 85 edits.
3. **Is T2's exception list the existing `park.test.js` ledger**, or its own?
   They answer adjacent questions and merging them may make one of them lie.
4. **What happens to a violation that is correct?** `park.test.js`'s sentinel
   must name a parked element by its nature. An invariant with no exception
   mechanism gets switched off; one with a free-text exception becomes a
   rubber stamp.
