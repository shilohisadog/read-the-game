# Detection did not regress — the 187 re-planted, 2026-09-17

**The question** (`docs/test-program.md` §8.2): step 6 deleted tests, rewrote the counter
tests and removed 24 ids. Did the suite still catch what it caught before? The pass mark
was **52 / 45 / 28** — the defects caught by the build or a real test in the survivorship
experiment (`docs/survivorship-experiment.md`), per function.

**The answer: yes, verdict for verdict.** No mutant that was caught is uncaught, and none
that was uncaught is now caught. Three are caught by MORE test files than before.

| function | mutants | re-plantable | caught then | caught now | lost | gained |
|---|---:|---:|---:|---:|---:|---:|
| calculate (`src/lib`) | 90 | 90 | 52 | **52** | 0 | 0 |
| display (`src/app.js`) | 60 | 56 | 43 | **43** | 0 | 0 |
| interpret (`builders/extract.py`) | 37 | 37 | 28 | **28** | 0 | 0 |

⚠️ **Display's pass mark cannot be measured at 45.** Four mutants sit on lines deleted in
`c9aafaf` (the parked counters and the split bar): `prevA`, the counter tally, the bar
widths. Two of those four had been caught, so the most that can be re-planted is 43 — and
all 43 are still caught. **A defect whose code is gone is not a detection loss.**

**The other outcomes agree exactly**, which is the check that the run is measuring the
same thing: 19 caught only by the DOM golden (17 + 2 in step 3's finer split), 2 build
errors, 1 extract gate, and 40 not caught — step 3's 34 unobserved plus the 6 escapes it
found with probes this run does not have.

**Three gained a catcher** (same verdict, more tests red): `s20260916-45` and `s916-64` in
`render-labels.test.js` and `s20260916-61` in `render-transport.test.js` — today's goal
label walks every goal frame, so tokens near the label now break more than one test.

## How it was run

```
node tools/mutate.mjs relocate 2ef986a docs/defects/survivorship-2026-09-16/data \
     docs/defects/mutation-rerun-2026-09-17/relocated.json
node tools/mutate.mjs run relocated.json results.jsonl --workers 3
node tools/mutate.mjs report relocated.json results.jsonl
```

- **The record is relocated, never re-sampled.** A mutant is (file, offset, token before,
  token after) in the code of `2ef986a` — the last commit before the counters were removed,
  identified by checking every offset against every candidate commit. `src/lib` and
  `builders/extract.py` are byte-identical to it, so 127 mutants re-plant at their exact
  old offsets; 52 move with their line; 4 are gone. Lines are carried through `git diff`,
  and the mapping is checked line by line against git itself in `test/mutate.test.js`.
- **Commit-stage detectors only** — the build, the JS suite, the Python suite and the
  extract gates. That is precisely the population §8.2 counts. This run cannot tell an
  escape from a defect nothing could observe; step 3's browser and number probes did that.
- **The control runs first:** an unmutated worktree must be green, or the run refuses to
  start. It was green at `4366ebc`.
- Three git worktrees outside the repo, one mutant at a time each; 183 mutants.

**Files:** `relocated.json` (every mutant, its new position or why it is gone, and what it
did in step 3), `results.jsonl` (one line per mutant: exit codes, failing test files,
outcome).
