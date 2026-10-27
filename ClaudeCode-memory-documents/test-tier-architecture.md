---
name: test-tier-architecture
description: "✅ RESOLVED 2026-09-17 — the thread that started when deleting one <div> touched eleven files. `test/` was 30,464 lines and not a tier. ⭐⭐ COVERAGE IS VISIBLE TO READING; COUPLING IS ONLY VISIBLE TO DELETION. Outcome: frame-model CLOSED on option B; T1 BUILT in the harness (found 3 ghost tests); T2 NOT built, replaced by a hidden-reads ratchet (31→5); seam B built; .counters/.cbar removed. Still open: T3/T4 declared subjects, whether test/ is a tier with a boundary rule. See [[defect-corpus-evidence]]."
metadata:
  node_type: memory
  type: project
  originSessionId: 93e6fd35-9c6d-4b88-b317-618e5a2a3d81
  modified: 2026-09-16T11:47:15.396Z
---

# The test tier — the live thread

**Start at `docs/test-architecture.md` in the repo.** This file is the shape of
it and what to carry into the build.

Kevin, after a one-line deletion touched eleven files: *"I'm still not tracking
with why the removal of the penalty box touched so many files… I thought we just
went through an architecture cleanup effort and now this surfaces."* And the
standard: *"this is an open source project where any code (app centric or test
centric or whatever) smells are unacceptable."*

---

## ⭐⭐ The finding, and why an audit could not have produced it

| | lines |
|---|---:|
| all seven tiers `docs/architecture.md` declares | **20,063** |
| `test/` — not a tier, not counted, not checked | **30,464** across 85 files |

> **COVERAGE IS VISIBLE TO READING. COUPLING IS ONLY VISIBLE TO DELETION.**

The September audit *did* examine instruments — *"eight covered less than their
name implied"* — but it asked **does this assertion test what its name claims**,
never **what does it depend on that is not its subject**. Those need different
instruments: the first is a review, the second is a mutation.
`render-strength-pill.test.js` asserting *"the team chip is the penalty box's"*
reads as a GOOD test. Nothing about reading it says it breaks when penalties move
off the ice.

⛔⛔⛔ **AND THE HEADLINE: SIX test files document that the fake DOM invents ids —
`lbox`, `render-labels`, `deeplink-render`, `render-board`, `smoke`, `homepage` —
and ZERO checks enforce it.** `deeplink-render` warns that *"a fake that keeps
modelling a deleted control is how 23 tests drove a ghost for a day in August"*
**directly above a fake that models a deleted control.** Six independent
rediscoveries is a measurement, not an anecdote. See [[mechanize-the-review]].

## ⭐ The sizing, and why only a fourteenth is automatable

30,550 lines but **15,816 code** (the rest comment and blank — house style, not
bulk). The unit is the **3,892 assertions**. ~**320 candidates, 8%**:

| class | sites | decidable? |
|---|---:|---|
| looks up an id no page has | 2 | **yes** |
| reads an element no reader can see | 13 | **yes** |
| a number a reducer test already owns | ~9 | **yes** |
| anchored on SOURCE TEXT not behaviour | 107 | **no** |
| presence-not-content (`assert.ok` round a match) | 174 | **no** |
| assertion inside a data-dependent branch | 15 | partly |

⚠️ **THE TOP TWO ARE CANDIDATES, NOT DEFECTS.** `build.test.js` asserting against
the bundle **is** its subject. Source-anchoring is a smell only when the claim is
about BEHAVIOUR, and no regex separates those. **Reporting 320 as a defect count
would be the same error the document is about** — a number that never asked
whether its subject was really its subject.

## ✅ CHENG ruled all four (§7) — and three premises failed checking

He answered Q4 first *"because it decides whether any of the others survive
contact"*, which was right.

- **Q4 — the exception is a CATEGORY from a closed vocabulary**, never free text.
  *"Free text can't be audited; a closed set can."* The precedent is this repo's
  own vocabulary gate: known values get labels, unrecognised ones halt. ⭐ **And
  the exception count is itself a measurement** — one is healthy, twenty means
  the rule is wrong.
  ⛔ **MY OBJECTION, HIS OWN STANDARD TURNED AROUND:** his Q2 requires a declared
  subject be *checkable against the file's imports*, because an unverifiable
  declaration is a lie waiting to happen. **An annotation is exactly that.** So a
  file claiming `@reads-parked: subject` **must itself COMPUTE the parking
  model**. `park.test.js` does; a file that merely wants the exemption does not.
- **Q1 — `test/` becomes a tier.** ⭐ His sharpest point: **`test/helpers/page.js`
  is a DIFFERENT KIND OF OBJECT**, and its rules — *must not invent ids, must fail
  on absence* — are the **opposite** of the rules for tests. That is the root of
  the six-times-rediscovered defect.
  ⛔ **CHECKED: the obvious boundary rule is already violated** —
  `tools/dom-golden.mjs:56` imports the harness. **A tier without a boundary rule
  is a row in a table**; every other tier carries one.
- **Q2 — a DECLARED subject, not one derived from the filename**, because a
  declaration is checkable against imports and a filename against nothing. The
  evidence is this repo's scorecard: `KNOWN_SITUATIONS`, `FINAL_STATES`, the
  five-event window, the `LIB` check — **every one correct when written and
  silently wrong later.**
  ⛔ **CHECKED: not every test has one subject**, and `smoke.test.js` says so in
  its own header. Cross-cutting by design — it caught a blank page past 43 green
  tests. **Design the subject vocabulary before the 85-file sweep.**
- **Q3 — separate lists, derived one from the other.**
  ⛔ **CHECKED: the derivation has no source as stated.** `ENUMERATED` is keyed by
  **id**, not container. Hang it off **`darkClasses(CSS)`**.


## ⏸⏸ 2026-09-16 (later) — T1/T2 HELD: `docs/frame-model.md` is for CHENG

Kevin: *"are we truly cleansing the test/ architecture or are we simply cleaning
up the smells of the current architecture?"* **Honest answer: smells.** T1–T4
police coupling without asking why it exists. Measured, **TWO couplings, two
causes**:

- **VALUE** — tests read the page's WORDS to learn app state, because a frame is
  observable only as DOM. Mutating `periodLabel`'s wording failed **11 tests in 6
  files; 9 in 4 files were about something else** (ends, empty-net, clock, deep
  links) — they filter on `'Period 1'`. `periodLabel` has NO direct test.
  Parked `cA` read 11×/5 files; its visible replacement `lxA` 2×/1 file.
- **LAYOUT** — tests regex CSS/markup because the fake DOM has no stylesheet. 32
  test files read CSS text; 17 carry their own `display:none` regex.

⛔⛔ **THE COUNTERFACTUAL CUT AGAINST MY OWN PROPOSAL:** all five test files the
`.pboxes` deletion (`c44373b`) touched were LAYOUT coupling, zero read a value —
**a frame model would have changed none of the eleven files.** Said in the doc
BEFORE the proposal. Options put to CHENG: A rules only · B the harness hands
tests the frame (no app change; removes the 9) · C frame model in app.js
(`lboxFor` at app.js:3177 is the one existing model-shaped fn — and it reads the
DOM) · plus for LAYOUT: a browser (deploy.yml already runs system Chrome 10×).
My stated position: **T1 belongs in the harness under every option**; a
source-scanning T1 is ruled out (`render-teams.test.js:211` reaches 5 deleted ids
through a loop variable the §3 scan missed).

⚠️ **Not a prior proposal:** `docs/architecture.md` §2 declined a `render(state)`
STATE refactor (input side); this is the OUTPUT side, and §5's open row *"whether
wiring itself wants a shape"* is exactly this question. ⚠️ I computed a
lib-vs-inline provenance split (128/173 "inline") and **withdrew it** — the lexer
cannot follow a value through a local, so the label overclaimed.

## ⏭ Next, in CHENG's order

**T1** every id a test looks up exists in some built page (2 violations today:
`lyCorsi` in a ghost fixture, `nSit` in the ends-invariance comparison, which has
been `"" === ""` on that field since the id vanished).
**T2** no test reads an element no reader can see (13 today) — *"T2 landing
before any future parking is what makes the next `.pboxes` incident impossible
rather than documented."*

**T3/T4 wait on the subject vocabulary.**

## ⏭ And the `.counters`/`.cbar` removal, held WITH A SHAPE

⛔ **DO NOT RE-POINT THEM WHOLESALE** — that moves a smell. The 28 assertions:
**9 duplicated arithmetic** (delete; `layers.test.js:69`, `attribution.test.js:39`
and `strength.test.js:216` already assert 80/55 and 48/38 **on the reducer** — the
DOM copy is the *fourth* statement), **12 genuine rendering** (move to `#lbox`),
**7 playhead-position** (re-subject — they use `cA` as a handy readout; pointing
them at `lxA` preserves a coincidence, not a claim).

Related: [[mechanize-the-review]], [[looking-at-pixels]],
[[architecture-audit-2026-09]] (the audit this one is the sequel to),
[[red-on-red-ends]] (the deletion that started it).
