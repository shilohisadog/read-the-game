# The test program — what each function is checked by, and when it gates

**For CHENG's review, relayed by Kevin. Written 2026-09-17.** Step 5 of the plan
in `docs/status.md` §0.00.

✅ **RULED 2026-09-17, after CHENG's first review — Kevin approved a five-step
plan:** (1) this document corrected (§3.1, §8, §9, §11); (2) the two `localhost`
Chrome steps moved before the deploy; (3) range checks on the published numbers,
verified by re-planting the five escapes; (4) the data pipeline's checks split
into before and after the sync; (5) **the release gate of §5.1**. Everything
else here is still for review.

**FOR A READER ARRIVING COLD.** This repo builds an NHL replay-teaching site,
live at readthegame.co. Kevin is its owner; CC is the developer model that wrote
this; CHENG is a second model that reviews CC's work. CHENG and CC are the same
base model, so their agreement is weak evidence — which is why this document is
built on measurements a human could check, and why §9 argues against it.

**What this supersedes, and what it does not.** `docs/test-architecture.md`
(rules T1–T4 for the existing `test/`) and `docs/frame-model.md` (whether tests
should read app state as data) were both written before the evidence below
existed. Both were answers about *how tests are written*. Kevin asked a
different question — *"unit through integration through performance through
regression through system testing, each had to pass before being handed off"* —
and neither document has a stage in it. §6 says what becomes of each ruling.

---

## 1. The evidence this is built on

| document | what it established |
|---|---|
| `docs/defect-corpus.md` | 420 defects fixed in commits, **201 reached the live site**; Kevin found 102, model review 66, browser checks 15. ⛔ Its *what could have known* labels failed a blind human relabel (2 of 25), so **no layer below is sized from them.** |
| `docs/survivorship-experiment.md` | 187 planted one-token defects. The suite catches **58%** in `src/lib`, **75%** in `app.js`, **76%** in `extract.py`. **5 changed the published numbers with every test green.** **19 reader-facing changes passed every detector.** Remove the one test file that caught a defect and no other test catches it. 1 of 5 false sentences caught. ⭐ **A person is a poor spotter and a good judge** (Kevin noticed 7 of 13 differences, judged 6 of 7). |
| step 4, `docs/status.md` §0.00 | **A Cloudflare Pages branch preview reads production data** under the current CORS and CSP, after one pattern was added to the bucket's policy. |
| `docs/test-architecture.md` §2 | The penalty-band deletion (`c44373b`) touched 11 files: 4 generated, 2 the deletion, 2 tests of the band, **3 tests about other things** — all reading stylesheet text. |
| `docs/frame-model.md` §2.4 | One wording change to the period label failed 11 tests, **9 about other things**. |

⛔ **And one measurement from step 3 that nobody has said out loud yet:**
`conservation()` — the archive invariant both CC and CHENG called the best test
in the repo — **was run over 52 real published games for every one of the 187
planted defects, and fired on none.** An archive property is not a tier to lean
on until something shows it catching what the suite misses.

## 2. What the software does

Kevin's list was *ingests, processes, stores, calculates, displays*. The repo's
own tiers (`docs/architecture.md`) split it into six functions, and the split
matters because each fails differently:

| function | code | runs |
|---|---|---|
| **1. Ingest** | `builders/fetch_nhl.py` — the league's bytes, never interpreted | nightly, CI |
| **2. Interpret** | `builders/extract.py` — feed → events, with vocabulary and boxscore gates | nightly and weekly, CI |
| **3. Store & publish** | `builders/derive.py`, `builders/ledger.py`, the R2 sync — publish or refuse | nightly and weekly, CI |
| **4. Calculate** | `src/lib/**` — the same reducers in the browser and over the archive (`builders/measure.mjs`) | browser and CI |
| **5. Display** | `builders/build_*.py` generate `src/*.html`; `src/app.js` renders the replay | build time and browser |
| **6. Deliver** | Cloudflare Pages, the data host, CSP, CORS, caching | production |

**And three rows that are not functions, because CHENG was right that the matrix
had nowhere to put them:**

| cross-cutting | the failure | its classical name |
|---|---|---|
| **A. Claims** | a sentence or figure is false while the code is right | validation, not verification |
| **B. Source rules** | two implementations of one rule disagree | differential testing |
| **C. The checks** | a check that cannot fail | test adequacy — what mutation analysis is for |

## 3. The two axes, and the third

A test program needs three things, and this project's discussion had supplied only the first:

- **What a check can know** — the level, and the oracle behind it.
- **When it gates** — the stage, and what must pass before the next handoff.
- **Whether it works** — shown by planting what it should catch.

**Levels, as they apply here:**

| level | here |
|---|---|
| **unit** | one module in isolation — a `src/lib` reducer, a builder function |
| **integration** | a function with its neighbours on real artifacts — a whole booted page, a whole extract reproduced |
| **system** | the whole site in a real browser, or the whole pipeline on real data |
| **performance** | size and time budgets |
| **acceptance** | a person judging |

**Regression is not a level.** It is the property that every stage re-runs
everything below it on every change, which this repo already has.

### 3.1 Three kinds of check, and why the favourite measured nothing

CHENG's review named the distinction the 0 of 187 exposed; step 3 added a third:

| kind | asks | example | can fail when |
|---|---|---|---|
| **bookkeeping** | does our arithmetic agree with our own arithmetic | `conservation()` (`src/lib/layer.js`) | an event is dropped, doubled or unexplained — and nothing else |
| **witness** | does our output agree with an **independent source** | the extract against the boxscore; blocked shots against `rosterSpots` | the data or our reading of it is wrong in any way the source can see |
| **range** | is the published output **possible at all** | a count ≥ 0, a share in [0, 1], no `NaN` in a sentence | the output broke the way step 3's escapes broke |

**Breadth is not power.** `conservation()` runs on every layer of every game and
fails only on bookkeeping, so a planted change to what is counted or drawn left
it balanced 187 times. ⚠️ **But "no independent source, so near-worthless" is
wrong too:** the published figures that escaped (`census.hits.r`, `slotShare`)
have no witness, and 3–4 of the 5 broke a range. **The test for keeping a check is
whether it can fail the way this output actually broke.** And a witness that
admission already filters on — *SOG reproduces the boxscore* — cannot fail over
the published games; it earns its place where new data arrives.

## 4. The matrix today — measured 2026-09-17

JS suite: **1,266 tests, 85 files, 29,741 lines**; 35 files boot the whole page.
Python: **198 tests, 4 files.** `deploy.yml` has 17 steps. `ingest.yml` and
`derive.yml` each check the archive after they publish it.

| | unit | integration | system | perf | acceptance |
|---|---|---|---|---|---|
| **1. Ingest** | ✅ fetch logic, network faked | — none against the real API, deliberately | ✅ nightly, **in production** | ❌ | — |
| **2. Interpret** | ⚠️ thin | ✅ `extract.py --verify` (byte-identical; *proves nothing about correctness*, CHENG's own docstring), `--validate` against the boxscore, `--vocab` | ✅ weekly over the archive | ❌ | — |
| **3. Store & publish** | ✅ derive and ledger, storage faked | ⚠️ nothing local touches R2 | ⚠️ ledger, per-team and measurement checks all run **after the sync** | ❌ | — |
| **4. Calculate** | ✅ **caught 52 of 90 planted defects** | ✅ `measure.test.js`, mostly one game | ⛔ **nothing asserts on published `measures.json`/`teams.json` — 5 escapes** | ❌ | ⚠️ figures read informally |
| **5. Display** | ⚠️ builders: none; `app.js` via extracted modules | ✅ the fake-DOM boot tests — **caught 45 of 60**; the DOM golden | ⚠️ real Chrome in `deploy.yml`: **3 steps before release, 6 after** | ❌ | Kevin **on the live site**: 102 of 201 |
| **6. Deliver** | — | ✅ CSP and network policy on built pages, before release | ✅ fetch back and diff, data readable — **after release** | ❌ | — |
| **A. Claims** | — | ⚠️ citations, doc paths, generated blocks — about the REPO | ⛔ **1 of 5 false sentences caught** | — | ⚠️ ad hoc |
| **B. Source rules** | — | ✅ where a differential exists (situation codes, JS vs Python) | — | — | — |
| **C. The checks** | — | ⛔ nothing; **a disarmed gate whose test mirrors it went unnoticed** | — | — | ⚠️ when someone notices |

⚠️ **Two of the six post-release Chrome steps do not need production at all.**
*The front door's preview fits its frame* and *the verdict dot lands where the
sentence says* serve built pages from `localhost` with data fetched from the
data host — they are ordered after the deploy step, not dependent on it.

⭐ **An empty cell is not automatically a gap** (CHENG). Ingest has no real-API
integration test on purpose, and interpret's unit level is thin because
`--validate` checks whole games against an independent answer. ⚠️ **But
`--verify` is not that answer** — byte identity reproduces a baked-in error — so
the builders' empty unit cell stays an open question, not a settled one.

## 5. The pipeline — stages, entries and exits

The principle Kevin described survived under a newer name, **the deployment
pipeline**: every stage runs on every change, in minutes, and nothing reaches
the next stage without passing this one. What changed since phased testing is
speed, not the gates.

**Today there is one stage.** Every push to `main` runs the gates and deploys to
production; most system checks and all acceptance happen after release. Step 4
showed the missing stage is buildable.

### 5.1 ✅ The release gate — RULED by Kevin, 2026-09-17

**No branches.** Work still lands on `main`, and the stage is inside the deploy:

- **Before beta:** a push to `main` that changes `src/` deploys **first as a
  preview**. The automatic checks that today run against the live site run
  against the preview; only if they pass does **the same commit** deploy to
  production. Kevin reviews what shipped **in batches, afterwards**. With no
  audience yet, the fallback when he is unavailable is **ship**.
- **At beta:** Kevin becomes the **required reviewer** on the production deploy
  (a GitHub deployment environment; this repo is public, where that is
  available). The fallback becomes **hold**. One configuration change, made the
  day beta starts.

⚠️ **A preview cannot show a changed NUMBER.** A change to `src/lib` changes
`src/`, so it gets a preview — but the published figures are rebuilt by the weekly
derive, so the preview shows the old ones. **For calculation changes the gate is
the range check (§7.1) before every sync, not the look.**

The table below is the full program; S2–S4 are what §5.1 builds first, without
the branch.

| stage | runs on | what runs | exit |
|---|---|---|---|
| **S1 · Commit** | every push, any branch | repo gates; the node and Python suites; `extract` gates; **published-output properties** (new, §7.1); the two `localhost` Chrome steps, moved here | all green → S2 |
| **S2 · Preview** | every push to a work branch | deploy a branch preview; run **against the preview** the checks that today run against live — data readable, the pages fit a phone, a visitor can watch a game, no policy refusal; **new browser states** for the blind spots (§7.2); publish the **review gallery** | all green → S3 |
| **S3 · Acceptance** | a batch, not a commit | Kevin (and CHENG) judge the gallery's **mechanical diffs** — *is this wrong?* — and use the preview | approval → promote |
| **S4 · Production** | promotion to `main` — **the same commit** that passed S1–S3 | deploy; fetch back and diff; data readable; what only production has (domain, redirects, edge rewrites, cache) | green, or roll back |
| **Data pipeline** | nightly `ingest.yml`, weekly `derive.yml` | **split every post-sync check in two**: validate the runner's output **before** the sync (a gate), read it back **after** (delivery) | a bad archive never reaches the bucket |
| **Scheduled** | weekly | a small **mutation run**, including check mutants, with its score tracked (§7.3); archive-wide properties; a **performance budget** — page weight, time to a drawn rink on a throttled connection | an alarm, not a gate |
| **Beta** | feature complete | the novice session | Kevin's judgement |

**The rule that makes regression mean something:** every defect that escapes a
stage gets a check at **the earliest stage that could have caught it**, and that
check lands only after it has been seen to fail on the defect.

⭐ **A preview is for LOOKING at a UI change against production data, never for
testing pipeline changes**, which would need data of their own
(`.github/workflows/r2-cors.yml` says so where the permission lives). Pipeline
changes are gated by the pre-sync half of the data pipeline instead.

## 6. What becomes of `test/`

**The node suite stays as S1.** It is the only instrument that caught most planted
defects, all 8 re-planted historical ones, and it is fast. Nothing measured
supports replacing it — not snapshots (14 of 36 test-proven defects showed
nothing in 47 page states), not properties (`conservation()` fired on 0 of 187).

**What changes is what a test may ask the page for**, because that is where
churn comes from:

| a test needs | today it | under this program |
|---|---|---|
| a frame | drives `#scrub` (named by **20** test files) | the harness hands it the frame — `docs/frame-model.md` option **B**, no app change |
| which period | reads `#per`'s words (7 files) | the harness hands it the event |
| a count | reads `#cA`'s text | imports the reducer |
| whether something is visible, or where | regexes the stylesheet (32 files read CSS text) | **S2, a real browser**, asked as an outcome — *the caption is visible* — never by container |
| a rule about the stylesheet as a file | regexes the stylesheet | **still a source check** — orphaned rules, no rule names a club colour. These still churn when a selector goes, and that is honest |

**Measured, and watchable:** of 171 ids in the built pages, test files name 103;
**22 are named by more than three files** (`#rg` 27, `#scrub` 20, `#play` 13,
`#events` 11). That number is the churn surface. It goes in the acceptance test
(§8) as before-and-after, with no target guessed.

**The held rulings:**

- **T1** (every id a test looks up exists in a built page) — **build it, in the
  harness.** Cheap; the fake DOM inventing ids is a defect regardless of
  architecture.
- **T2** (no test reads an element no reader can see) — ⚠️ **superseded if
  visibility moves to S2.** Building it first centralises a CSS parser this
  program retires. Proposed: do not build; migrate its 13 sites with the layout
  move. **For CHENG to rule (Q5).**
- **T3/T4** (declared subjects) — keep as a **review rule**, not a checker. The
  id-count metric above is the mechanical half.
- **The DOM golden** — **keep, but stop counting it as a catcher.** It caught 17
  planted defects no other test did, 11 of them visibly wrong. A change detector
  cannot tell those from an intended edit, so **its diff becomes an input to
  S3**, where a person judges it.
- **Frame model option C** (a frame model in `app.js`) — **not required by any
  measurement.** Deferred; B carries the landmark case.
- **`.counters`/`.cbar`** — proceeds in the shape `docs/status.md` already gives
  it, **after** B lands, as the third churn replay (§8).

## 7. The new checks, each from a measured escape

### 7.1 Range checks on the published output — calculate × system, S1 and pre-sync

Nothing asserts on `measures.json` or `teams.json`. Checks that need no right
answer (§3.1, the **range** kind): **every count ≥ 0, every share in [0, 1], no
`NaN` or `undefined` in any string, every histogram the length its definition
says.** Three or four of the five number escapes break one. **Verify by
re-planting the five** — a hypothesis until then.

### 7.2 Browser states for the blind spots — display × system, S2

The 19 reader-facing escapes cluster in states no probe visited:

- **the non-default `Tabletop` figure style** — a state, cheap;
- **animation timing** — two samples of one moving frame, or motion left on;
- **gestures** — a double-click journey.

**Verify by re-planting the 19.** How many a new state catches is the measurement.

### 7.3 Checks on checks — C × all, scheduled

A weekly mutation run on a small random sample, with **check mutants** (a gate
disarmed, a test that mirrors its subject) beside code mutants, and the caught
fraction tracked like a coverage figure. And `CONTRIBUTING.md` rule 3 — *a check
you have not seen fail is not a check* — becomes a stage rule: **a new check
names the mutant that turns it red, and S1 runs it once.**

### 7.4 Claims — A × acceptance, S3

4 of 5 planted false sentences passed every machine, and truth about hockey has
no mechanical oracle. **The gallery shows a sentence diff beside the pixel diff,
and a person judges it.** A claims ledger (every figure resolves to a measurement
with its n) stays proposed, not planned — Kevin ruled cards are
education-driven, not data-driven (`docs/penalties-card.md`), and a ledger pulls copy toward what can be
measured.

## 8. The acceptance test for this program

**It is accepted when these are measured, not when it reads well:**

1. **Churn replay.** Re-apply three intended changes and count failing tests
   about something else:

   | change | off-subject failures today |
   |---|---:|
   | the penalty-band deletion, `c44373b` | 3 files — ⚠️ **not replayable**: that commit already edited the tests that read the band, so replaying it on today's suite shows 0 whether or not anything improved |
   | the period-label wording change | **9 tests** (of 11 failing, 6 files) — re-measured 2026-09-17, unchanged |
   | the `.counters`/`.cbar` removal | **5 tests** off-subject + 2 cross-cutting (of 19 failing, 9 files) — measured 2026-09-17 |

   **The baseline is committed so the same change can be replayed after seam B:**
   `docs/defects/churn-replay-2026-09-17/` holds both patches and
   `docs/defects/churn-replay-2026-09-17/before-seam-b.json`, every failing test with its kind. ⚠️ The kinds are CC's
   judgement from what each test reads, not checked by a second reader.

   ~~**Target: zero off-subject.**~~ **Ruled a ratchet (§11.2 Q7):** the count
   falls on each replay, and each remaining one names a closed-set category.
2. **Detection does not regress.** Re-run the 187 step-3 mutants: caught per
   function **≥ 52 / 45 / 28**.
3. **The escapes close — reported PER FUNCTION** (CHENG): a program that improves
   calculate while display stays flat must not read as an overall gain. The 5
   number escapes against §7.1; the 19 reader-facing escapes against §7.2. Report
   the counts; no target is guessed. ⚠️ *Detection ≥ today* can be met by changing
   nothing; **this is the criterion that shows the program did something.**
4. **The churn surface.** Ids named by more than three test files: **22 today**,
   reported after.
5. **Speed.** S1 and S2 wall-clock, measured; a stage people wait on is a stage
   people route around.

## 9. Against it, as hard as it can be argued

1. **Branches change how work lands, and the loop is the project's engine.** A
   push reaches live in a few minutes today (today's deploy run took 2m0s). Branch, preview, human
   approval, promote — every step adds wait, and **zero merges in this repo's
   history** says the working style has never needed one. ✅ *Answered by §5.1:
   no branches, and no human wait before beta.*
2. **Pre-beta, production has no audience.** The 201 live defects cost Kevin's
   time and nobody else's; `readthegame.co` effectively *is* staging. The stages
   start paying at beta. *Counter:* Kevin's time is the scarcest resource, and S3
   exists to spend it on judging rather than spotting.
3. **A person as a gate is a bottleneck** — hence batches, not commits — and
   **approval fatigue is how galleries and goldens die.** A 40-image diff gets
   approved unread.
4. **Browser stages are where test programs go to rot.** Step 3 met WebGL noise
   on `terrain-3d`; `deploy.yml` records 522s on a cold hostname. *A guard that
   fires at random is a guard somebody switches off.*
5. **The zero-dependency promise meets gestures.** `deploy.yml`'s checks use the
   runner's Chrome and no npm package; step 3 used Playwright. A double-click
   journey without a driver may not be worth writing. **Q3.**
6. **Properties were the favourite and measured nothing.** 0 of 187. §7.1's
   properties are different in kind (they sit on output that demonstrably broke),
   but the same enthusiasm produced both.
7. **The evidence is narrow.** Single-token mutants; 52 games; 47 page states;
   one human reviewer; six UI-heavy weeks before the season opens on 29
   September. The mix will move toward data and claims.
8. **Don't build it now.** Every week spent here is a week not spent reaching
   feature-complete. ⚠️ **Corrected:** an earlier version said the *novice test*
   waits on this program. It does not — Kevin parked it until beta on 2026-09-15
   (*"on hold until we get a feature complete and everything locked and
   loaded"*). And the two answer different questions: a novice cannot tell a
   wrong share, which is the class that got past everything.

## 10. Order, if built — by attrition, each step with its own exit

| # | step | exit |
|---:|---|---|
| 1 | move the two `localhost` Chrome steps before the deploy step | they gate |
| 2 | published-output properties in S1 and before each sync | re-plant the 5 |
| 3 | split the data pipeline's checks into pre-sync and read-back | a planted bad archive stops before R2 |
| 4 | **S2**: work branches deploy previews; live checks retargeted at the preview; promotion by fast-forward | one real change goes branch → preview → `main` |
| 5 | the review gallery with mechanical diffs (pixels, sentences, the DOM golden) | Kevin judges one batch |
| 6 | harness seam B + T1 | ids-over-three count, before and after |
| 7 | visibility claims → S2, file by file, each move a churn replay | §8.1 |
| 8 | new browser states for the blind spots | re-plant the 19 |
| 9 | the weekly mutation run with check mutants | a planted disarmed gate is reported |
| 10 | the performance budget | an alarm on a planted heavy page |

Steps 1–3 need no new infrastructure and close the worst measured seam first.

✅ **Built 2026-09-17, in Kevin's approved order rather than this table's:**
rows 1 and 3, and row 4 **without branches** (§5.1) — the preview is inside the
deploy. Row 2's range check caught **4 of the 5** re-planted escapes. The record,
with commits and what each was seen to catch, is in `docs/status.md` §0.00.

## 11. What I want ruled

- **Q1 — the frame.** Six functions and three cross-cutting rows × five levels ×
  the stages of §5. Is that the organising axis, or does one of them not earn its
  place?
- ✅ **Q2 — RULED by Kevin: §5.1.** Trunk, a preview inside the deploy, no human
  wait before beta; a required reviewer from beta. CHENG proposed routing by
  *"`build --verify` says byte-identical"*; ⚠️ that gate compares a fresh build to
  the committed pages, which gates already force equal, so it cannot route — the
  signal is **`src/` against what production serves**.
- **Q3 — the browser tool.** The runner's Chrome and no dependency (can it
  double-click?), or a driver in test tooling only, with the shipped page still
  at zero?
- **Q4 — the DOM golden as S3 input rather than a gate.**
- **Q5 — T2: superseded, or built as an interim?**
- **Q6 — `docs/frame-model.md`: B now, C deferred** — so that document can close.
- **Q7 — §8's thresholds.** Zero off-subject failures is strict; is it the right
  bar, or does it force tests to stop asserting things they should?

### 11.1 CC's recommendations on the open six — for CHENG to rule, 2026-09-17

Kevin has read these and asked for them to be sent as they stand. Each carries
the strongest case against it.

- **Q1 — accept the frame.** It sorted every finding and drove the five builds.
  *Against:* the performance column is empty in every row; keep it, ranked last.
- **Q3 — stay zero-dependency.** Measured: `src/app.js` never checks `isTrusted`
  (0 uses), so an in-page probe can dispatch a double-click the handlers accept,
  and `deploy.yml` already drives controls that way. **Rule: dispatch to
  `document.elementFromPoint(x, y)`, never to the element by id** — otherwise
  the probe clicks through an overlay a person could not (the `force: true`
  trap). *Against:* multi-step drag and touch are painful by hand; revisit when a
  real check needs one.
- **Q4 — the DOM golden stays a gate until the review gallery exists.** It was
  the only catcher of 17 of the 187 planted defects, 11 visibly wrong; before
  beta, review happens after release, so demoting it now ships those.
  *Against:* it fails on intended edits and is regenerated unread — which is why
  it moves to S3 once the gallery exists.
- **Q5 — do not build T2; build T1 in the harness.** T2 is a CSS parser standing
  in for a browser, and two copies already exist (`park.test.js`, and the one
  written during the `.pboxes` fix). Visibility claims move to the preview stage
  file by file, asked as a visitor would, which never names a container.
  *Against:* that move takes weeks, and a new parking before it repeats the
  `.pboxes` incident. **Fallback: build T2 only if a parking happens first.**
- **Q6 — option B now, C deferred; `docs/frame-model.md` closes.** B removes the
  measured cause (`#scrub` named by 20 files, 9 off-subject failures) with no
  change to `app.js`; no measurement needs C. *Against:* CC and CHENG converged on
  B and are correlated; the churn replay (§8.1) is the independent test.
- **Q7 — not zero; a ratchet.** Off-subject failures must fall on each replay, and
  every one that remains names why it is legitimate. Zero pushes tests to stop
  asserting real cross-cutting claims (`smoke.test.js` caught a blank page past 43
  green tests). *Against:* "named reasons" can become an excuse list, so the count
  still has to fall.

### 11.2 ✅ RULED — CHENG, then Kevin, 2026-09-17

CHENG accepted all six and sharpened each; Kevin agreed with CC's two objections.

| Q | ruling | as built into step 6 |
|---|---|---|
| **Q1** | accept the frame; performance ranked last. **An empty cell carries its reason.** | ⚠️ the builders' unit cell's reason is **"none; correctness rests on the tests that read built markup — open"**, NOT "byte identity is stronger": `--verify` reproduces a baked-in error (CHENG's own docstring in `builders/extract.py`) |
| **Q3** | zero-dependency; dispatch at `elementFromPoint`. **A dispatch that lands on an unexpected element is a finding, not a retry** (CHENG) — after the page has settled, or animation becomes findings | when a gesture probe is written |
| **Q4** | the DOM golden stays a gate until the gallery exists; **report the size of its diff** (CHENG) | a count line on `tools/dom-golden.mjs` |
| **Q5** | build T1, not T2. ⚠️ **The trigger is NOT "a commit adds `display:none`"** (CHENG's proposal): measured, **52 commits added one in six weeks** and `src/app.css` holds 49 — it would fire daily and be switched off. **The trigger is the thing feared: test reads inside hidden containers, 13 today, may not grow**, counted with the darkness model `test/park.test.js` already computes | a ratchet test |
| **Q6** | option **B**; C deferred; `docs/frame-model.md` closed. **§8.1's replay is the falsifier: if `#scrub` (20 files) does not fall, B did not work** | seam B in the harness |
| **Q7** | a ratchet, and each remaining off-subject failure names a **category from a closed set** (`cross-cutting`, `harness`); an unknown category fails; counts per category are the measurement. ⚠️ **A category is a claim the author makes about their own test**, so `cross-cutting` is allowed only in files that declare no single subject | with the churn replay |

## 12. Corrections to the record, owed from the earlier thread

- *"49 of 85 test files boot the whole page"* did not reproduce: **35** call
  `boot(`, 37 import the harness.
- *"Move visibility to a browser and 32 files stop parsing CSS"* overstates it:
  several of the 32 check the stylesheet as a file, which a browser does not
  replace.
- The blocked-shot flip was said both to *die to an archive property* and to have
  *satisfied every property that existed*; the record supports the second.
- The penalty-band deletion's 11 files were mostly not churn: 6 were the deletion
  and its generated output, and 2 were tests that should have failed.
- *"The unit suite caught 0 of 201"* is structural, not a finding about the suite
  (`docs/defect-corpus.md` §4.2).
