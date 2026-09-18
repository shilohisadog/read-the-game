# The number I did not trust was right — the 187 re-planted again, 2026-09-18

**Why this run exists, and it is not the same question as last time.** The
2026-09-17 re-run (`docs/defects/mutation-rerun-2026-09-17/`) published **52 / 43 / 28**
and was produced by `tools/mutate.mjs` *before* that engine was found to report
**false catches under load**: at `--workers 3`, `homepage.test.js` went red on two
mutants that are not caught by anything (`s20260916-82`, `s20260916-96`), both
confirmed `not-caught` at `--workers 1`. A false CAUGHT is the worst error this
engine can make — it reports detection the suite does not have, which is the claim
the whole test program rests on. So the number sat in the docs as published and
untrusted, and this run re-derives it with the confirming engine.

**The answer: the old number was not inflated. It was right, and it has gone up.**

| function | mutants | gone | re-plantable | caught then | caught now | lost | gained |
|---|---:|---:|---:|---:|---:|---:|---:|
| calculate (`src/lib`) | 90 | 9 | 81 | 52 | **53** | 0 | 1 |
| display (`src/app.js`) | 60 | 5 | 55 | 43 | **44** | 0 | 1 |
| interpret (`builders/extract.py`) | 37 | 0 | 37 | 28 | **28** | 0 | 0 |

⚠️ **I predicted the wrong direction, and it is recorded here because the prediction
was the reason for the run.** Both confirmed false catches were `display` mutants, so
I said before starting that 43 was the number most likely to come *down*. It went up.
The engine's fault was real and the published figure was still correct — those are
different claims, and only the second one was ever measured.

**The two gains are this session's own tests**, which is the first independent
evidence that the row-8 work closed something:

- `s916-14` — `src/lib/teams.js:200`, `3` → `4`, was `no-observable`, now caught by
  `teams.test.js` (the `readableInk` contrast tests).
- `s20260916-81` — `src/app.js:956`, `===` → `!==`, was `no-observable`, now caught by
  `render-penalties.test.js` (the behavioural short-handed tests that replaced greps).

**The denominators moved before any test ran, and that is not a detection loss.**
Fourteen mutants are `gone` — their code no longer exists: 9 in `calculate` with
`droppedForStrength` (deleted 2026-09-17, no caller since `4ed08c2`) and 5 in
`display` with the counters and the reverted stoppage labels. **None of the 14 had
been caught**, so nothing was lost by deleting them. Comparisons here are
verdict-for-verdict on the mutants that exist in both trees, never raw totals.

## The caveat that matters

⛔ **This run validates the NUMBERS. It does not validate the FIX.** There were
**zero flaky demotions** across all 173 — the confirm step never had to fire, because
nothing went red under load this time. The evidence that the confirmation works is
still the manual check that found the problem (`--workers 1`, plus running the full
suite with each mutant planted), recorded in `docs/defects/blind-spots-2026-09-17/`.
A quiet run is not a proof that the guard works; it is a run with nothing for the
guard to do.

⚠️ **And HEAD moved between the two runs**, so this is not a clean A/B of the engine
change — it measures today's suite. The two causes are separable by the record the
engine now keeps: a mutant going caught → not-caught **with** `flaky` set is the
confirmation correcting a false catch; **without** it, it is a genuine detection
change from code that landed since. Neither appears here: `lost` is empty in all
three populations.

**The two known false catches came back clean.** `s20260916-82` (`src/app.js:2142`,
`&&` → `||`) and `s20260916-96` (`src/app.js:1642`, `<` → `<=`) both recorded
`build:0, js:0, jsFail:[]` — `not-caught`, without the confirm step needing to
demote anything.

## How it was run

```
node tools/mutate.mjs relocate 2ef986a docs/defects/survivorship-2026-09-16/data \
     docs/defects/mutation-rerun-2026-09-18/relocated.json
node tools/mutate.mjs run relocated.json results.jsonl --workers 3
node tools/mutate.mjs report relocated.json results.jsonl
```

- **Same base, same recorded corpus, same worker count as 2026-09-17.** `--workers 3`
  was kept deliberately: it is the load condition the false catches appeared under, and
  running at 1 would have avoided the question rather than answered it.
- **The record is relocated, never re-sampled** — a mutant is (file, offset, token
  before, token after) carried through `git diff` line mapping onto today's tree, so
  the same defect is planted and not a new one that resembles it.
- **The control is green before anything is planted.** The run prints
  `control green at b879699`; a red afterwards is the mutant and not a pre-existing
  failure.
