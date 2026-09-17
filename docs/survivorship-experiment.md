# The survivorship experiment — what the checks catch when a defect is planted

**Run 2026-09-16, written 2026-09-17. A frozen record, not a live ledger.**
Step 3 of the plan in `docs/status.md` §0.00. It answers the question
`docs/defect-corpus.md` could not: the commit history says the unit suite found
**0 of the 201** defects that reached the live site, and a history of what
escaped cannot say whether that suite is useless or quietly preventing a great
deal. So defects were planted, and every check was run against each one.

**FOR A READER ARRIVING COLD.** This repo builds an NHL replay-teaching site.
Kevin is its owner; CC is the developer model that ran this experiment; CHENG is
a second model that reviews the developer's work and is the same base model as
CC, which is why a human reviewed part of it blind (§5). Every figure below is
printed by

    python3 docs/defects/survivorship-2026-09-16/scripts/tabulate.py

from the committed data alone, and §9 says what each data file is.

---

## 1. The answer, in five lines

1. **The suite prevents most planted defects** — 58% in the calculation modules,
   75% in the replay page, 76% in the feed interpreter. *"0 of 201"* was
   **structural**: a check that runs before release cannot appear among defects
   found after it.
2. ⛔ **The weak seam is calculation → published figures.** Five planted defects
   changed `measures.json` or `teams.json` with every test green, and nothing
   anywhere asserts on those files.
3. ⛔ **Redundancy is thin.** Remove the one test file that caught a defect and no
   other test catches it; only a change detector (the DOM golden) remains.
4. ⛔ **Nineteen reader-facing changes got past every detector** — found only by
   reading the code, in states the probes never visited.
5. ⭐ **A person is a poor spotter and a good judge.** Kevin noticed 7 of 13 real
   visual differences, and picked the wrong one of a pair only once in 7.

## 2. Method

### 2.1 Three functions, one mutation each

| function | code mutated | population |
|---|---|---:|
| **calculate** | `src/lib/**/*.js` — pure modules | 90 |
| **display** | `src/app.js` — the replay page | 60 |
| **interpret** | `builders/extract.py` — reads the league's feed | 37 |

Each mutant is **one token changed** at a site chosen by a seeded random draw
from every eligible site — a lexer for JavaScript, Python's own tokenizer for
Python, so no site sits inside a string or a comment. Six kinds: boundary
(`<`↔`<=`), equality (`===`↔`!==`), logical (`&&`↔`||`), negation (drop a `!`),
arithmetic (`+`↔`-`, `*`↔`/`), literal (`0`↔`1`, `n`→`n+1`, `x.y`→`2·x.y`). Two
disjoint samples, seeds `20260916` (n=125) and `916` (n=62): **n=187.**

### 2.2 The detectors

| detector | what it sees |
|---|---|
| the build | a generator throws, or the bundle does not parse |
| `node --test test/*.test.js` | the JS suite, including `dom-golden.test.js` |
| `python3 -m unittest` + `extract.py --verify/--validate/--vocab` | the Python suite and the feed gates (interpret only) |
| `conservation()` on **52 real published games** | the layer invariant — imported from the untouched repo, so a mutant inside it cannot disarm it |
| reducers and `measureAll` over the same 52 | any computed number that moves |
| `builders/measure.mjs` end to end | a fingerprint per top-level key of the `measures.json` / `teams.json` it publishes |
| real Chrome, **37 replay deep-link states** × 1400×900 and 844×390 | the document (scripts stripped), `innerText`, and screenshots |
| real Chrome, **10 self-contained pages** × both widths | the rule diagrams, learn, goalie view, workshop, terrain |

The browser probes ran on every mutant the suites did **not** catch, and again on
a subset they did (§3.4). The CSP was stripped from baseline and mutant alike —
it pins script hashes, so otherwise *it* would have been the detector.

### 2.3 Outcomes, first match wins

**caught** (a build error or a real test failure) → **golden only** (only
`dom-golden.test.js`, a change detector that fails on *any* DOM change, right or
wrong) → **escaped** (nothing fired, and a published number or a visible pixel
changed) → **nothing observable**.

### 2.4 Hand-written mutants, beside the random ones

- **8 historical** — past defects from the commit history, re-planted.
- **6 check** — a gate or a test broken instead of the code.
- **5 claim** — a false *sentence*, with the code left correct.
- **3 browser controls** — a deliberate visible change, to prove the probes can see one.

## 3. Results

### 3.1 By function

| function | n | caught | golden only | ESCAPED | nothing observable |
|---|---:|---:|---:|---:|---:|
| calculate | 90 | **52 (58%)** | 13 — 9 visibly wrong | **6** — 5 published numbers, 1 diagram | 19 |
| display | 60 | **45 (75%)** | 4 — 2 visibly wrong | 0 | 11 |
| interpret | 37 | **28 (76%)** + 3 by the feed gates | — | not probed | 6 |

⚠️ **Interpret has no browser or numbers probe.** Its 6 are *unobserved*, not
*unobservable*.

### 3.2 By kind of change

| kind | caught |
|---|---|
| negation | 15 of 17 |
| equality | 27 of 30 |
| logical | 19 of 24 |
| arithmetic | 34 of 51 |
| boundary | 6 of 12 |
| **literal** | **24 of 53** |

**Literals are least caught.** A constant moved by one — a pixel offset, a
threshold, a bucket count — is exactly what a test asserting *a* value rather
than *the* value lets through.

### 3.3 The six escapes

| mutant | change | what moved, all tests green |
|---|---|---|
| `s20260916-3` | `census.js:510` `-`→`+` | `measures.json` census |
| `s20260916-19` | `team-season.js:147` `+`→`-` | `teams.json` archive |
| `s916-4` | `team-season.js:147` `+`→`-` (other occurrence) | `teams.json` archive |
| `s20260916-20` | `distribution.js:81` `-`→`+` | `measures.json` goalieNight, perGame, reach |
| `s916-3` | `archive.js:275` `+`→`-` | `measures.json` attemptMix, `teams.json` archive |
| `s916-26` | `rinkart.js:475` `+`→`-` | the penalties diagram, visibly |

⭐ **Three or four of the five number escapes break a property the published file
should always have**, which a check could assert without knowing any right answer:

- a count and a share went **negative** (`slotShare.n` −4,641);
- a share came out at **8.7**;
- a sentence became **`"NaN(n counts SHOTS FACED…"`**;
- and, arguably, a histogram gained buckets.

The fifth (`census.hits.r` 0.183 → 0.209) breaks nothing checkable without an
independent answer. **That is a hypothesis for the architecture, not a result**:
no such check was built and run.

### 3.4 Redundancy — remove the one test file that caught it

Every seed-`20260916` mutant caught by **exactly one** test file (ignoring the
golden) was re-run with that file deleted: n=39.

| function | n | golden only | a number changes, nothing fires | nothing observable anywhere |
|---|---:|---:|---:|---:|
| calculate | 18 | 8 | 4 | 6 |
| display | 18 | 10 | 0 | 8 |
| interpret | 3 | — the Python suite still catches all 3 | | |

⛔ **For JavaScript, no second test caught any of the 36.** The only second line
is the DOM golden, and a change detector cannot tell a defect from an intended
edit. ⛔ **Snapshots cannot stand in for the node tests either: 14 of those 36
test-proven defects changed nothing in the DOM golden, 47 browser page states at
two widths, or the numbers.** And §4 shows the node tests cannot stand in for a browser. The
layers are complements, not substitutes.

### 3.5 The hand-written mutants

| group | caught | what escaped |
|---|---|---|
| **historical** | **8 of 8** | — every re-planted past defect fails a test today |
| **check** | 3 of 6 | the ledger gate disarmed **and** its test re-derived from the broken check (`CH1b`); a test broken alone with the code correct (`CH1c`, `CH2c`) |
| **claim** | **1 of 5** | the footer (`K2`) was caught; the front page saying the feed records the puck's whole path (`K3`), a docstring saying the opposite of its code (`K1`), a doc's arithmetic (`K4`), and a constant's comment (`K5`) were not |
| **browser controls** | seen | see §7 for the one CSS made invisible |

⛔ **Nothing checks the checks.** `CH1b` is the shape this project has shipped
before: a gate stops failing, and its test was written from the gate's own logic,
so both agree. And **a false sentence about hockey is almost never caught**,
though the corpus counts false claims as its second-largest class (84 of 420).

## 4. The 30 "nothing observable" — read, not run

A mutant no detector saw is either **equivalent** (no input behaves differently)
or **real outside what the detectors visited**. Of the 30 (19 calculate, 11
display), CC's calls were sealed; CHENG answered blind from a packet,
`docs/defects/code-reading-2026-09-16.md`; disagreements were adjudicated by
reading the code.

| code | meaning | n |
|---|---|---:|
| `RV` | real, and a reader could see it | **18** |
| `RN` | real, a number | **1** |
| `RU` | real only for input real data never produces | 5 |
| `E` | equivalent | 4 |
| `RI` | real, no reader could see it | 1 |
| `U` | unresolved — `s20260916-12` needs a count of declined skater codes in the archive | 1 |

⛔ **Nineteen reader-facing changes (18 `RV` + 1 `RN`) passed every detector in §2.2.**
They cluster in three blind spots:

- **the non-default `Tabletop` figure style**, which no probe state selects;
- **animation timing**, which the probes disable (`reducedMotion: 'reduce'`, one settled frame);
- **gestures**, which no probe performs.

**Agreement with the adjudication:** CC 23 of 30, CHENG 24 of 30; the two agreed
with each other on 19.

⚠️ **Three limits on that table:**

1. **The adjudicator was CC**, one of the two readers.
2. **The 19 agreements were not independently checked** — two readings from the
   same base model agreeing is weak evidence (the corpus's §4.1 is the measured case).
3. ⛔ **CC misread which token changed** in two of its own sealed calls (#8 and
   #25) — the reader making the error that the packet's own format
   (`the line as written` / `the line as changed`) exists to prevent.

CHENG called two of the planted changes (#8, #23) *live defects* in the site;
they were planted and never shipped.

## 5. Kevin's blind review

`docs/defects/review-2026-09-16/review.md` — pairs **A** and **B** in random
order, one the site as it is and one with a planted defect, with CC's key sealed
until the sheet came back.

**Visual, n=14:**

- 12 escaped or golden-only mutants, cropped from real Chrome;
- the text control (`"missed"` → `"wide"` in the replay's shot-attempt box);
- an identical pair.

| | result |
|---|---|
| noticed a difference | **7 of 13** real differences |
| of those, judged the planted one wrong | **6 of 7** |
| the identical pair | correctly *no difference* |
| the text control | ⛔ **missed** |

**Size did not predict noticing.** Noticed: 21, 28, 57, 131, 223, 1,033 and 2,083
changed pixels. Missed: 18, 56, 93, 308 and 4,214.

**Numbers, n=5** (published values, clean versus planted):

- **2 picked the planted one;**
- **1 picked the clean one** — ⚠️ possibly the sheet's fault: absent histogram
  buckets were printed as `undefined`, so the clean side looked broken;
- **2 no call.**

⭐⭐ **A person is a poor spotter and a good judge.** Asked to *find* a difference
he found half; shown one, he judged it right almost every time. **A review step
should show the mechanical diff and ask *"is this wrong?"*** — never ask a person
to find it. That is the division of labour the data supports: a machine detects,
a person judges.

## 6. What this means for the architecture

For step 5 of the plan — the test-program architecture for CHENG. These are
consequences of the measurements, not rulings.

1. **Keep the node suite as the first stage.** It catches most planted defects,
   8 of 8 historical ones, and there is no evidence anything else would.
2. **Add a stage on the published output.** Nothing asserts on `measures.json`
   or `teams.json`; property checks (counts ≥ 0, shares in [0, 1], no `NaN` in
   any string) would likely have caught 3–4 of 5 escapes. Build and re-run the
   escapes to find out.
3. **A browser stage for what the node suite cannot see** — non-default styles,
   motion, gestures — and it complements the node suite rather than replacing
   any of it (§3.4).
4. **Checks need checking.** A mutation run like this one, on a schedule, is the
   only instrument here that found a disarmed gate.
5. **Claims need a stage of their own**, and it is probably a person judging a
   diff of sentences, since 4 of 5 false claims passed every machine.
6. ⛔ **None of this measures churn.** Every mutant here was a *defect*: the
   experiment counts tests that stay green when they should fail. The failure
   Kevin raised on 2026-09-17 is the opposite — **tests that fail on an intended
   change they are not about**, as when deleting the penalty band under the ice
   (`c44373b`) failed three test files about other things (`docs/test-architecture.md`
   §2). ⭐ **Agreed with Kevin: the architecture's acceptance test replays
   intended changes too** — that deletion, a change to the period label's wording
   (11 failing tests, 9 about other things, `docs/frame-model.md` §2.4), and the
   `.counters`/`.cbar` removal — and must show only on-subject failures **while
   catching at least what this experiment's mutants are caught by today.**

## 7. Five defects in the instruments, all found before the results were reported

1. **The DOM hash included inline `<script>`**, so every mutant to the bundle
   "changed the document". Scripts are stripped; the baseline was re-taken.
2. **The invariant checker imported the mutated `conservation()`**, so a mutant
   inside it could disarm its own detector. It imports from the untouched repo.
3. **The numbers probe never ran `measure.mjs main()`**, so it missed everything
   the publication step itself computes. `docs/defects/survivorship-2026-09-16/scripts/probe-publish.mjs` was added.
4. **`terrain-3d` screenshots vary under load** (WebGL timing). A pixel-only
   change on that page alone is not counted.
5. **Deleting a test file tripped `doc-paths.test.js`**, since docs cite test
   files by path — a false "another test caught it". That failure is excluded, and
   the 20 affected sites were re-probed.

And one control failed its purpose: the first text control (`"Period"` →
`"PERIOD"`) was invisible, because CSS already upper-cases that label. The
second (`"missed"` → `"wide"`) replaced it, and the probes saw it.

## 8. Limits

- **One run of single-token mutants.** Real defects are often larger, and
  several tokens at once.
- **The probes' reach is the result's reach.** 37 replay states and 10 pages,
  motion off, default style, no gestures, no front page in the static set; 52
  games for the numbers.
- **Interpret was never probed downstream**, so its 76% is a floor on detection
  and says nothing about escapes.
- **n=187 supports "most" and "few", not a second decimal.** The per-function
  rows are 37 to 90 each.
- **The review had one human, n=14 visual and n=5 number items.**
- **Two model readers of one base model** — §4's limits.

## 9. The record

`docs/defects/survivorship-2026-09-16/`:

- **`scripts/`** — the engine as run:
  - `docs/defects/survivorship-2026-09-16/scripts/mutate.mjs` samples and runs, with `docs/defects/survivorship-2026-09-16/scripts/jslex-pos.mjs` as its lexer;
  - `docs/defects/survivorship-2026-09-16/scripts/probe-numbers.mjs`, `docs/defects/survivorship-2026-09-16/scripts/probe-publish.mjs`, `docs/defects/survivorship-2026-09-16/scripts/probe-browser.mjs` and
    `docs/defects/survivorship-2026-09-16/scripts/probe-static.mjs` are the detectors;
  - `docs/defects/survivorship-2026-09-16/scripts/publish-run.mjs` runs the publication detector alone;
  - `docs/defects/survivorship-2026-09-16/scripts/make-pairs.mjs` built the review sheet;
  - `queue*.sh` ordered the runs;
  - `docs/defects/survivorship-2026-09-16/scripts/analyze.py` is the first classifier.

  ⚠️ **They point at a scratch directory, two clones and a Playwright install
  that no longer exist.** They are the method, not a runnable harness; re-running
  needs those paths and the 52 extracts listed in `docs/defects/survivorship-2026-09-16/data/games-sample.json`.
  `docs/defects/survivorship-2026-09-16/scripts/tabulate.py` was written afterwards and runs from `data/` alone.
- **`data/`:**
  - `mutants-*.json` — what was planted;
  - `results-*.jsonl` and `publish-*.jsonl` — what each detector said;
  - `base-*.json` — the unmutated fingerprints;
  - **`docs/defects/survivorship-2026-09-16/data/final-syntactic.json`** — the 187 random mutants with their final outcome,
    merged across runs. The golden-only visible / not-seen split in it was made
    from `results-B-probes.jsonl` and `results-A-rerun.jsonl`.
  - `code-reading-*.json` and `docs/defects/survivorship-2026-09-16/data/cheng-answers.json` — §4;
  - `docs/defects/survivorship-2026-09-16/data/review-key-SEALED.json` and `docs/defects/survivorship-2026-09-16/data/review-scored.json` — §5.

`docs/defects/review-2026-09-16/` — Kevin's filled sheet and its 28 crops.
