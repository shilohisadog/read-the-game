---
name: defect-corpus-evidence
description: "⭐⭐ THE TEST-PROGRAM RE-ARCHITECTURE — BUILT AND LIVE 2026-09-17. Evidence (defect corpus, blind relabel, survivorship experiment) → docs/test-program.md → built: release gate with preview, published-number range checks, pre-sync pipeline checks, T1, seam B (churn replays 9→0, 5→1), hidden-reads ratchet, counters removed, 2 expired hero rules dropped. Rows 5 and 8 DONE — row 8's measurement REFRAMED it (new states catch 2 of the 19). §8.2 RE-RUN 2026-09-18: 53/44/28, the untrusted number was RIGHT. Open: rows 7,9,10 + row 6's unmet exit (churn surface 20→21) + a SECOND SPECIMEN GAME. START at docs/status.md §0.00."
metadata:
  type: project
---

## ⏭ CURRENT STATE (2026-09-17) — read this, then `docs/status.md` §0.00

**Kevin's 7-step plan is COMPLETE.** Live and seen to work: the release gate (`deploy.yml` deploys
a `--branch candidate` preview when `src/` changed, 6 browser checks on it, then prod; skips when
unchanged); `tools/published_ranges.py` (gates over 8 fixtures + derive.yml pre-sync; 4/5 escapes);
pre-sync validation + post-sync read-back in derive.yml/ingest.yml (both run by hand green); T1 in the
harness; seam B (`{k,ev,n}`, `a.now()`); hidden-reads ratchet = 5; golden diffSize; `.counters`/`.cbar`
removed; `ha` and the preview's Attempts layer dropped; loop lead-in KEPT ("I don't mind a longer-ish
loop"). R2 CORS has `https://*.read-the-game.pages.dev` (R2 accepts it; look-alikes refused).

✅ **Row 5 REVIEW GALLERY built + exit met `e6b9a52`** (Kevin moved it to the front): `node tools/gallery.mjs`
(LAST..HEAD, `docs/reviews/`), batch 1 judged 1 item / 0 wrong. ✅ **ROW 8 DONE `5cab334` — AND MEASURING IT REFRAMED IT.** `docs/defects/blind-spots-2026-09-17/`.
**NINE of the 19 are gone with their code** (8 Tabletop + 1 on the deleted counters — NINE, not the 8 this file
said). Of the 10 still plantable, 0 are caught by a browser state and 0 change the DOM anywhere in an
**1,884 frame-state walk** (7 layers × 269 frames). They split **3 equivalent · 1 dead code · 1 another page ·
3 another SPECIMEN · 2 gestures — a new state reaches TWO.**
- ⭐⭐ **THERE IS NO ANIMATION LOOP.** `T` in src/app.js is `let T=0` and is never assigned again; the bob is a
  CONSTANT per-x offset. Its amplitude moves 938/1,884 frame-states; the escape on its `t` multiplier moves none
  and never can. **Both readers had called it "real, and a reader could see it".** Same for `shadowBlur` — the
  only caller passes `glow:false` AND SvgPen documents that it ignores it.
- ⭐⭐ **A PROBE THAT WALKS ONE GAME IS EVIDENCE ABOUT ONE GAME.** teams.js `contrast>=3` flips **exactly 1 of 33
  clubs** (PHI #F74902, 3.55; next VGK 2.79). Reference game is BUF at MIN. Two more need a short-handed goal and
  a goalie who faced+saved everything. ⏭ **Row 8's remainder is a SECOND SPECIMEN, not a 7th state.**
- ⛔ **MY FIRST states.mjs MEASURED NOTHING**: it sampled 0.55 of the scrub = frame 147, a FACEOFF, and marks.js
  draws a figure only for the CURRENT ATTEMPT (135 of 269 frames draw one; it entered none). Six clean
  reproducible hashes of a circle. **Rule: a state names its SUBJECT, seeks it, and goes RED if it never found
  one** — entering is the first claim. 6 planted defects turn the 6 states red.
- ⛔ **AN INLINE `style` ATTRIBUTE DOES NOTHING ON ANY PAGE HERE** — `style-src` is hash-pinned, no
  'unsafe-inline'. A canary planted as `style="pointer-events:none"` changed markup, passed the build, did
  NOTHING. Re-planted as the SVG attribute `pointer-events="none"` it fired. **A mutation that cannot land is
  not evidence** — [[mechanize-the-review]].
- ⚠️ **A mark drawn as a figure is 33% hittable** (44 marks, 32–35%, identical at 1100×900 and 844×390) — a stick
  figure in a square box. Pressing the box CENTRE hits a faceoff dot underneath and reports a broken door on a
  page whose door is fine. The probe sweeps and presses the first point that really is the mark; no `force`.
✅ **It found another `figTabletop`:** `droppedForStrength` (src/lib/layer.js) — **no caller since 2026-09-07**
(`4ed08c2`, Kevin's "no strength chips" removed the sentence it fed) under a comment still saying it was THE
number under the situations control. `builders/figures.py` too. ⚠️ **The unused-export sweep has its own hole:**
`disputedCount` looks equally orphaned and is ALIVE — build_index.py inlines it as a STRING into two pages.
Then row 7 (visibility claims → preview), row 9 (schedule the mutation run + check mutants), row 10 (perf budget).
⏭ **AND TWO RULES KEVIN ASKED FOR, DESIGNED NOT BUILT** (docs/status.md §0.00 has the full text): (1) an UNLISTED
page entry expires — date + review-by, red names "give it a door or delete it and its tests"; (2) a test may not
name a page that does not exist; (3) ⭐ the code-level rule is RUNTIME COVERAGE over a walk, not static analysis —
`FIG[figStyle]` is a computed key so every call-graph tool calls `figTabletop` referenced. Report + ratchet, never
auto-delete, because coverage is evidence about the states walked. ⏭ Kevin must rule on `terrain-3d.html` and
`read-the-game.html` (deployed, unreachable, 35 test files read it FROM DISK — which does not need publishing).

**Open, not started:** 7 visibility claims → preview · 9 weekly mutation run ·
10 perf budget · row 8's remainder = a SECOND SPECIMEN GAME. Plus Q7 closed-set off-subject categories, T3/T4 subjects, test/ tier boundary rule.
At beta: Kevin = required reviewer on prod deploy. Novice test parked until feature-complete.
Commit with `npm run gates > LOG 2>&1; rc=$?` — NEVER /dev/null. The sections below are the history.

⛔⛔ **THE ENGINE REPORTED FALSE CATCHES, AND §8.2's NUMBER IS NOT TRUSTED UNTIL RE-RUN.**
At `--workers 3` (three worktrees each running a build plus a 4-way suite) `tools/mutate.mjs`
called two mutants CAUGHT that are not: at `--workers 1` both come back `not-caught` and the
full suite passes with either planted. **A false CAUGHT is the worst error this engine can
make** — it reports detection the suite does not have, which is the claim the whole program
rests on. The engine now CONFIRMS a red by re-running just the files that failed; one that
does not reproduce is recorded as `flaky` and is not a catch. It is also row 9's first real
customer: a check on the checks.

✅ **RE-RUN 2026-09-18 WITH THE CONFIRMING ENGINE: 53 / 44 / 28, 0 lost, 2 gained**
(`docs/defects/mutation-rerun-2026-09-18/`). ⭐⭐ **THE NUMBER I DID NOT TRUST WAS RIGHT.**
52 / 43 / 28 was NOT inflated by the false catches — and I predicted the opposite out loud
before starting (both known false catches were `display` mutants, so I said 43 would come
DOWN; it went UP). *The engine's fault was real and the published figure was still correct;
those are different claims and only the second was ever measured.* Both gains are row-8's own
tests: `teams.test.js` on a contrast threshold, `render-penalties.test.js` on a short-handed
comparison. 14 mutants are `gone` with their code and **none of them had been caught**, so the
smaller denominators cost no detection — compare verdict-for-verdict, never raw totals.
⛔⛔ **ZERO FLAKY DEMOTIONS, so the run validates the NUMBERS and NOT THE FIX** — the confirm
step never had to fire. *A quiet run is not proof a guard works; it is a run with nothing for
the guard to do.* The evidence for the confirmation is still the manual `--workers 1` check.

⛔⛔ **ROW 6 IS MARKED ✅ AND ITS OWN §10 EXIT WAS NEVER EVALUATED.** That exit is *"ids-over-
three count, before and after"*. Measured 2026-09-18 on the SAME ruler at both trees it went
**20 → 21 — it rose** — and `#scrub` is driven by **18 test files then and 18 now, identical
sets, 133 → 135 call sites, not one migrated**. Seam B's mechanism is real and new tests use it
(21 files call `.every(`), but the migration §6 describes never happened, so the churn surface
has not moved. ⚠️ **Seam B's recorded win (churn replays 9→0, 5→1) is a DIFFERENT metric and
still stands** — the replay measured two specific commits; §6 announced a change in what tests
may ask the page for. *The check announced a wider claim than it tested.* Belongs with row 7.
⚠️ **Calibrate the ruler before believing a before/after**: my first three attempts disagreed
with the published `#rg`=27 / `#scrub`=20, and the honest comparison needed one ruler run on
BOTH trees, not my ruler against someone's remembered number.


Kevin (2026-09-16), after CC and CHENG both proposed test architectures: *"you and
CHENG are the same core model, so agreement on direction isn't weighted very
highly"* — then asked how to architect the test program from scratch, docs allowed.

**The answer was to turn the documented history into data first.** Seven extraction
agents → `docs/defects/` (frozen), `tools/defect-corpus.mjs` reproduces every figure,
`npm run corpus` in gates.

**Headline (commits, n=420; live n=201):** who found the 201 live: Kevin 102, model
review 66, browser-check 15, unit suite **0**. Oracle for live: human-eye 49,
real-browser 48, league/archive 29, repo 23, app-decision 22. The node-suite's
oracle (app-decision + definition) is ~16% of what shipped.

⛔ **Caveats that must travel with every quote:** survivorship (commits record what
ESCAPED); single-model labels (spot-check 16: found_by 15, oracle ~13); six UI-heavy
weeks; notes.jsonl cites files outside the repo.

**Two axes, both needed:** layers BY ORACLE (what a check can know) and pipeline
STAGES (when it gates) — Kevin supplied the second: *"unit through integration
through performance through regression through system testing, each had to pass
before being handed off."* Found: one branch, zero merges, every push to main
deploys to production, and 8 of 14 real-browser checks in deploy.yml run AFTER
release. Also: deploy.yml already has zero-dependency real-browser probes (iframe +
getBoundingClientRect + --dump-dom), written as JS inside YAML.

⚠️ **Extraction lesson:** parallel agents sharing a scratch folder overwrote each
other's same-named helper (`add.py`) and misrouted entries — give each agent a
private directory up front; verify counts + source scope per file after.


## ⛔⛔ STEP 2 RESULT (`60d4541`): THE ORACLE LABELS DID NOT SURVIVE A BLIND HUMAN RELABEL

Kevin labelled 30 random commit entries with my labels SEALED. found_by Kevin-vs-anyone
**20/26** (holds); found_by exact 9/26 (commit text sided with the extractor on 6 of 7
model-vs-automated disagreements — Kevin can't see which of CC's activities found
something); **oracle exact 2/25, coarse 14/25 — NOT REPRODUCIBLE.** Kevin: 8/30 not
clearly defects (extractors flagged 1).

⭐⭐ **THE LESSON: my same-model spot-check said oracle was "defensible on ~13 of 16".
A check made by the labeller agrees with the labeller.** I had already sized test
layers from oracle in conversation ("~half needed a browser or a human eye") — withdrawn
in the doc. ⭐ **A counterfactual label ("what COULD have caught it") cannot be labelled
reliably; it must be answered by EXPERIMENT** — on all 4 visual defects Kevin said a
browser could catch, the extractor said human eye only: exactly the browser-layer vs
review-layer line. ⭐ found_by needs splitting: PROMPTED-by vs DETECTED-by.


## ✅ STEP 3 — THE SURVIVORSHIP EXPERIMENT — **COMMITTED `22ab65c` (2026-09-17), NOT PUSHED at time of writing**

Write-up: `docs/survivorship-experiment.md`. Data + scripts in `docs/defects/survivorship-2026-09-16/`,
Kevin's sheet + 28 crops in `docs/defects/review-2026-09-16/`. ⭐ `scripts/tabulate.py` reprints EVERY
figure from `data/` alone — run it, never quote from memory. Engine scripts are archived as run
(paths into a dead scratch dir); `final-syntactic.json` is the merged per-mutant outcome.

Random single-token mutants, 2 disjoint seeds, n=187, every detector (suites, extract gates,
`conservation()` on 52 real games, full `measure.mjs` publication, Chrome on 37 replay states +
10 static pages ×2 widths):
- calculate 90: suite/build **52 (58%)**, DOM-golden-only 13 (9 visibly wrong), **ESCAPED 6 (5 wrong
  published numbers, 1 diagram)**, nothing observable 19
- display 60: suite **45 (75%)**, golden-only 4, escaped 0, nothing 11 · interpret 37: suite 28 (76%) + 3 gates
- ⭐ survivorship ANSWERED: the suite prevents most defects; "0 of 201" was structural.
- ⛔ weak seam = calculation → `measures.json`/`teams.json`: nothing asserts on published output.
- redundancy thin: remove the ONE catching test file → nothing else in the suite catches it.
- 8/8 historical defects caught today; **1/5 false claims** caught; broken checks undetected.
- snapshots ≠ node tests: 14 of 36 test-proven defects invisible in 47 page states.
- literals least caught (24/53).

**The 30 "nothing observable" — CHENG blind code-read, adjudicated against CODE:** 18 RV + 1 RN =
**19 reader-facing escapes**, 5 RU, 4 E, 1 RI, 1 U (#10 needs archive count). Blind spots: `Tabletop`
figure style, animation timing, gestures. Exact vs adjudication: **CC 23/30, CHENG 24/30** — ⛔ CC
MISREAD WHICH TOKEN CHANGED twice (#8, #25) in its own sealed calls. CHENG wrongly called #8/#23
"live defects" — they were planted and reverted.

**Kevin's blind A/B review:** noticed **7/13** visual diffs, picked the planted one 6/7, null control
right, **missed the text control** ("missed"→"wide"); 21px noticed, 4,214px missed. Numbers: 2/5.
⭐⭐ **A PERSON IS A POOR SPOTTER AND A GOOD JUDGE** → galleries must SHOW the mechanical diff and ask
"is this wrong". ⭐ 3–4 of 5 escaped numbers break a writable property (count<0, share∉[0,1], "NaN").

✅ docs/defect-corpus.md corrected in `22ab65c`: the zero is STRUCTURAL; `nature` never human-checked.

## ⭐⭐ KEVIN'S CHURN QUESTION (2026-09-17) — and the acceptance test it produced

Kevin: *"I haven't seen how these efforts will minimize the churn we encountered when removing the
penalty box."* **Honest answer: steps 1–3 don't.** They measure tests that stay GREEN on a DEFECT;
churn is tests that go RED on an INTENDED change they are not about — the opposite error. `c44373b`'s
eleven files = 4 generated + 2 the deletion + 2 box tests (correct to fail) + **3 off-subject**, all
reading stylesheet TEXT (fake DOM has no CSS). The fix lives in step 5 (outcome-phrased layout claims
in a real browser, one darkness model, declared subjects). **Agreed ("ok, proceed"): step 5's
acceptance test REPLAYS INTENDED CHANGES** — the band deletion, the period-label wording change (9
off-subject), the `.counters`/`.cbar` removal — and must show only on-subject failures WHILE catching
what step 3's mutants are caught by today. Step 3's contribution to churn is that detection baseline.

⛔ **My own counting slip, caught while writing it down:** I told Kevin `render-transport.test.js`
was the lone catcher of 1 mutant and `render-strength-pill` of 0 — I had counted the DOM GOLDEN as a
second catcher. Excluding the golden (a change detector, the doc's convention): 14 caught / 3 alone,
9 / 1 alone, `park.test.js` 0, of 101 mutants a non-golden JS test caught. **Decide whether a change
detector counts as a catcher BEFORE counting, and use the same rule in chat and in the doc.**
Also: my review sheet printed absent histogram buckets as `undefined`, which may be why Kevin picked
the CLEAN side on N3 — the instrument, not the judge.

**Kevin's plan, in order:** (1) ✅ commit corpus `5eb2542`; (2) a HUMAN relabels ~30
(the only uncorrelated check); (3) ✅ `22ab65c`; (4) ✅ 2026-09-17 a branch preview reads prod data (see below); ⏭
(5) architecture doc for CHENG (layers × stages) + the churn acceptance test above; (6) T1/T2, seam B, .counters wait.

Related: [[test-tier-architecture]], [[mechanize-the-review]], [[feedback-argue-the-opposite]]


## ✅ STEP 4 (2026-09-17) — a branch preview reads production data

CSP was never the obstacle; CORS was. Kevin added `https://*.read-the-game.pages.dev` in the R2
dashboard. ⭐ **R2 accepts the subdomain wildcard though its CORS docs are silent** — measured:
look-alikes (`evilread-the-game.pages.dev`, `…pages.dev.evil.com`, http, example.com) refused, so
`*` NOT needed and the 08-10 named-origin decision (my own, `14fa151`, not Kevin's) stands.
`r2-cors.yml` updated `4b69f4e`. A throwaway `preview-check` branch (own workflow, never on main)
deployed a preview; hash URL + alias both rendered data in Chrome; deleted via Pages API
(`DELETE …/deployments/<id>?force=true`), both 404, branch removed. ⚠️ No local Cloudflare creds —
wrangler only runs in CI. ⚠️ A remote branch `ten-second-hero` exists, so "one branch" is loose.
⛔ CHENG was wrong that a local path "adds nothing": `twojandk` first appeared in `22ab65c`; Kevin
left it. **Preview is for LOOKING at UI against prod data, never pipeline tests — and not yet
pre-release, since deploy.yml ships `--branch main` on every push. That is step 5's question.**


## ✅ STEP 5 (2026-09-17) — `docs/test-program.md` WRITTEN FOR CHENG, `1b686cf`; ⏸ awaiting Q1–Q7

Functions (6) + cross-cutting rows (claims, source rules, the checks) × levels (unit, integration,
system, perf, acceptance; regression is a property not a level) × stages S1 commit · S2 branch
preview · S3 acceptance by batch (a person judges MECHANICAL diffs) · S4 production · data pipeline
pre-sync gate · scheduled mutation + perf budget. Keeps node suite; seam B + T1; visibility → browser;
T2 proposed SUPERSEDED (Q5); DOM golden → S3 input, not a catcher; option C deferred.
⛔⛔ **`conservation()` over 52 games fired on 0 of 187 planted defects** — both models had called it
the best test; archive properties are NOT a tier to lean on. Measured today: JS 1,266 tests/85 files/
29,741 lines, 35 boot the page; Python 198/4; deploy.yml 3 Chrome steps before release, 6 after (2 of
those are localhost-only, just ordered late); 22 ids named by >3 test files (#rg 27, #scrub 20).
Acceptance = churn replay (0 off-subject), detection ≥52/45/28, re-plant escapes, ids>3 count, speed.
Q2's trunk alternative: push → deploy commit as PREVIEW → S2 → same commit to prod, no human gate.


## ✅ KEVIN'S FIVE-STEP PLAN — ALL BUILT 2026-09-17 (after CHENG's review of test-program.md)

Kevin asked for "a clear plan of action" after my long reply — ⭐ **condense to numbered steps + one
decision; he approved it verbatim.** Built: (1) doc `7856415`; (2+5) **release gate** `cbaedb2` —
deploy.yml deploys `--branch candidate` preview, 6 browser checks against it, then same commit to
prod; skips when `src/` unchanged vs last successful deploy run (`gh run list`, needs `actions: read`);
(3) `tools/published_ranges.py` `74bb241` — `npm run ranges` over 8 fixtures in gates + derive.yml
pre-sync; **4/5 escapes caught on 52 games AND 8 fixtures**, +1/23 others; 17/17 disarm sites red;
(4) pre-sync validation / post-sync read-back in derive.yml + ingest.yml `f774340`.
⛔ **My own slips caught on the way:** told Kevin the 2 "localhost" Chrome steps didn't need
production — they read pages the phone step DOWNLOADS FROM LIVE (hence 2+5 merged); per60 rule
failed 6 real rows (minutes published rounded to 0.1 → interval from rounding, not a tolerance);
4 checker failure sites had no test until disarmed. CHENG's byte gate (`build --verify`) can't route —
gates force build == committed; the signal is src/ vs production. `conservation()` = BOOKKEEPING;
witness vs range kinds (§3.1). Novice test is parked by Kevin until feature-complete, NOT blocked by
this program. ⏳ First real pipeline runs: ingest 2026-09-18 11:00 UTC, derive 2026-09-21 — CHECK THEM.
⏭ At beta: Kevin = required reviewer on prod deploy step. Q1, Q3–Q7 still with CHENG; step 6 next.


## ✅ STEP 6 BUILT (2026-09-17) + both pipelines run by hand, green

CHENG ruled Q1/Q3–Q7 (test-program.md §11.2); Kevin agreed with CC's 2 objections (Q1 builders' empty
cell reason is "none, open" not "byte identity stronger"; Q5 trigger NOT "commit adds display:none" —
52 commits did in 6 weeks — but the hidden-reads COUNT ratchet). frame-model.md CLOSED (B).
Built in order: churn baseline before B `6069b3e` (`docs/defects/churn-replay-2026-09-17/`); **T1** in
harness `ff87dd2` (throws on ids no page has; RUNTIME_IDS netHome/netAway) — found 3 GHOST TESTS
(ends-invariance clicked deleted ly* rows so "every layer on" = none, "" vs ""); hidden-reads ratchet in
park.test.js `86e883c`; golden diffSize `4f620e1` (1 char → 2,153 frames); **seam B** `1bdd89e`+`2ef986a`
(every/at/sweep pass {k,ev,n}; a.now(); timeline = lib playable(), length asserted vs #scrub);
**replays: period-label off-subject 9→0, counters 5→1** — B's falsifier came out as predicted;
**.counters/.cbar REMOVED** `c9aafaf`, shipped through the preview gate green. Ratchet 31→5.
⛔ My slips: `gates >/dev/null && commit -q` failed SILENTLY once (health count) — check git log after;
a leak plant via globalThis was shared by both fake pages and proved nothing; my non-vacuity guards
fired twice on my own rewrites (pre-game box empty) — good. `smoke.test.js`, `deeplink-render.test.js`
each carry their OWN fake DOM (no T1 there).
✅ **Kevin: "drop both rules" — `aa368ce`, shipped through the preview gate:** hero selector reads `hl`
alone, derive.py no longer publishes `ha`, preview runs the base view. Live check: hero = CAR at VGK
9 June 2026 (game 2025030414), `#rg` has no layer class, kicker "up to its first goal", no console errors.
⏸ **THIRD expired reason left for Kevin:** loop doesn't start AT the goal because "the counter is watched
from zero" (build_index.py, marked expired). ⛔ `npm run gates >/dev/null && git commit -q` failed
SILENTLY TWICE today (health count; then the flaky freshness test) — ALWAYS read `git log -1` after.
"the freshness line: stalled" failed once in a loaded full run, passes alone — watch for flakiness.

✅ Kevin kept the loop lead-in ("I don't mind a longer-ish loop") — `9a10da9`.
⛔⛔ **THE "FLAKY FRESHNESS TEST" WAS NEVER PROVEN** — n=1 failure mid-edit, message unsaved; 8 parallel
+ 10 sequential runs green; render path is promise-only (can't be reordered by load). Left unchanged.
I had called it flaky from ONE unsaved failure and nearly "fixed" a guess. **Rule now: gates output
always to a log file on every commit (`npm run gates > LOG; rc=$?`), never /dev/null** — the very next
commit failed on a stale tiers block that the silenced form would have hidden. Stale generated blocks
(`node builders/health.mjs`, `node tools/tiers.mjs`) are the usual silent failure after edits.


## ✅ ROW 5 — THE REVIEW GALLERY (2026-09-17, `e6b9a52`)

Kevin asked "is reviewing new?" — yes as a STEP; he always reviewed, informally on the live site (102/201).
Before beta: batch review AFTER release, nothing waits. Gallery: Playwright from /tmp/rtg-pixels, routes
readthegame.co → `git show <commit>:src/…` (CSP intact) and data origin → ONE shared snapshot; 50 states × 2
viewports; text/pixels/DOM ids+classes/console errors; sheet in the 2026-09-16 markdown format.
⛔ Lessons: **Playwright `clock.install` does NOT stop time** — needs `pauseAt`; terrain-3d gave 3 images in 5
renders until paused (10/10). **A sampled self-check is evidence about its sample** (1-in-5 missed it; then a
one-repeat check passed and still differed from BASE — the fix was the cause, not more repeats). **A height
change shifts everything below by a FRACTIONAL pixel → re-antialiased, up to 240/255 — no threshold works**;
split structurally (nonzero offset, same height = moved), blind spot declared. ⛔ My own slip: launched the
background run IN PARALLEL with a command that disarmed the tool + deleted its output dir — a race; stopped and
reran. Also `pkill -f <pattern>` killed its own shell (exit 144). Step-3 probes rendered `read-the-game.html`
only, never index.html/game.html as visitors get them. My claim "only 2 engine scripts archived" was a `head`
truncation — all 12 are there, as-run, dead paths.


## ⏭ ROW 7 — OPENED 2026-09-20/21, WITH A RULER AND A NAMED LEVER

**Row 7's exit was §8.1, the churn replay — and neither committed replay touches the
stylesheet, so the row had an exit its own subject could never move.** (A period-label
wording change and the `.counters` deletion; both sit at 0 and 1 after seam B.)

✅ **`tools/css-noop.mjs` is the ruler it needed.** Rewrite every `a{x;y;z}` as
`a{x}a{y;z}`: same selector, same specificity, same cascade order, same declarations in
the same order, so **every computed style is unchanged BY CONSTRUCTION** and every red is
off-subject with nobody's judgement in it — unlike §8's existing counts, which §8 itself
admits are *"CC's judgement … not checked by a second reader"*.

**Before: 20 tests across 15 files.** (292 rules split; `css-parse` and `css-orphans`
GREEN, which is the evidence the rewritten sheet is well-formed and orphans nothing.)

⛔ **RETIRING ASSERTIONS ONE AT A TIME CANNOT MOVE IT — measured, not assumed.** Two were
retired from `lbox.test.js` on 09-20 and the ruler still read 20, because **it counts
TESTS** and that file still reads CSS text for its other claims.
⭐ **THE LEVER IS A PARSER, NOT DELETION:** a helper answering *what does selector X
declare for property P* (last wins) would make `a{x;y}` and `a{x}a{y}` read alike and take
most of the 20 to zero **without weakening one claim**. Churn from a selector RENAME would
remain, and §6 says that is honest.

✅ **The named hole is closed.** Swapping `HOMECOL`/`AWAYCOL` in `drawZoneStarts` — every
face-off ring painted for the wrong club, on the layer whose claim is *who starts where*
— left **1,329 of 1,330 green**; the one red was the DOM golden moving a hash, which §6
already ruled is not a catcher. ⭐ The check reads the leading club **BY ITS COUNT, not by
its position in the tooltip**: the obvious version reads the same `d.h > d.a` twice and a
both-swapped mutant walks through it. Four mutants turn the pair red.

⚠️ **And the instrument row 7 migrates INTO was itself blind** — see [[looking-at-pixels]].
`stylesheet-settles` had been measuring a 0x0 box since 2026-09-13. Fixing it immediately
found a live defect (a layer sentence printing 14px past the rink card's bottom border at
568x320). **A migration target has to be measured before anything is migrated into it.**
