---
name: feedback-too-smooth-run-the-seams
description: "Green unit tests prove units, not seams; a release that 'feels too smooth' is a prompt to run the real end-to-end + check version drift across ALL files"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6d74a52e-03a6-4f5f-9931-c90fa3586e42
  modified: 2026-08-03T08:30:13.946Z
---

**Kevin's pre-0.4.0 gut-check (2026-07-26):** the dashboard chapter went from D1→D2→D3→staged-release
fast and clean, and Kevin said *"seemed like things went too smoothly, lol — are we double and triple
sure everything aligned?"* Treating that as a real signal (not asking for reassurance) found **two real
gaps that all-green unit tests had hidden**, both fixed before the irreversible tag.

**Why:** green units prove the *units*, never the *seams*. The two gaps were both seams:
1. **`package-lock.json` stuck at `0.2.1`** — never bumped for 0.3.0 *or* 0.4.0. Hand-editing
   `package.json`'s version does NOT touch the lock; `npm version` would, but we bump by hand. It never
   surfaced because the lock isn't shipped (`files:["dist"]`) and `npm ci` tolerates a root-version
   mismatch (it checks the dep tree, not the version string). Silent for two releases.
2. **The viewer's DOM bootstrap had NEVER executed.** Every viewer test drove the pure render
   functions; the FileReader/drag-drop/detection/`innerHTML` block is `typeof document`-guarded, so a
   plain node-env unit run skips it entirely. "Green viewer tests" meant "render logic works," NOT
   "the page works."

**How to apply — before tagging any release, run the SEAMS, not just the suite:**
- **Real end-to-end, out-of-band:** construct the real objects and run the actual path a user runs
  (for 0.4.0: real policy file → `loadPolicyFile` → `guard.snapshot()` → `serializeSnapshot` → 0o600
  write → read-back → `parseSnapshotExport` → feed the on-disk file through the *shipped* viewer bytes).
  Hand fixtures pass because you built them to; the real path caught that my test harness even had the
  policy schema wrong (`halt`/`address`/`perDomain`). Run the thing, don't model it.
- **Version drift across ALL files, not just package.json:** grep every tracked file for the *old*
  version. Check `package-lock.json` especially (hand bumps miss it), plus any generated doc that
  embeds the version (TRACEABILITY.md does — its staleness gate caught that one in CI).
- **Any `typeof X`-guarded code is untested-by-default:** if a branch only runs when a global exists
  (`document`, a socket, a platform), a node unit run silently skips it. Execute it against a
  hand-rolled fake (no new dep) so the seam is real + regression-guarded. See [[testing-stack]] (TDD
  only tests what you thought of; testability is a requirement) and [[latent-bolt-ons-in-core]].
- **A fast, clean chapter is not evidence of correctness** — it's often evidence the tests only cover
  what you already believed. "Too smooth" → go looking for the seam you didn't test. Verify at the
  shipped edge (the registry, the browser, the tarball), the same discipline as
  [[npm-provenance-verification]] and the doc-review cold pass ([[feedback-doc-review-pipeline]]).
- **Never `rm package-lock.json` to add a dep — a full regen on ONE platform PRUNES the cross-platform optional-dep package entries (e.g. `@rollup/rollup-win32-x64-msvc`), so `npm ci` on Windows/Mac CI dies "Cannot find module".** (2026-07-27, PR #21: my lock-delete pruned the win32 rollup binary; local + Linux CI green, real **Windows CI** caught it — same seam-catcher as the D-035 separator bug.) FIX: `git checkout origin/main -- package-lock.json` then INCREMENTAL `npm install` (adds the new dep, keeps all ~25 platform entries; net lock diff shrinks to just the new dep). VERIFY with a REAL `npm ci` (not `--dry-run`) — it wipes+rebuilds node_modules from the lock exactly as CI does, so a pruned/broken lock (or a missing `.bin/vitest`) surfaces locally. Cross-platform install is a SEAM; a lock is a per-platform artifact unless you keep it whole.
- **Run `npm run verify` before EVERY push — it mirrors CI's `test` job; `npm test` alone cannot.** (2026-08-03: SECOND CI-only-seam bite. The LINT-01 slice added a requirement but didn't regenerate+commit the GENERATED `TRACEABILITY.md`; `npm test` passed 226/226 locally — the traceability *test* only checks that each req names an existing test — and CI failed on the *staleness gate* `npm run traceability && git diff --exit-code TRACEABILITY.md`. That gate writes a file then diffs the tree, so it structurally CANNOT live inside `npm test`.) FIX (shipped, slice/verify-composite): `npm run verify` = typecheck → test → traceability+diff → reason-codes+diff, the exact CI test-job sequence in one command; proven to have teeth (perturb REQUIREMENTS without regenerating → the diff gate exits 1). Rule: **any generated artifact with a CI staleness gate — `TRACEABILITY.md` (from REQUIREMENTS.md), `docs/reason-codes.md` (from the reason registry), `package-lock.json` — must be regenerated+committed in the same slice; `verify` catches the miss before push.** Same family as the package-lock drift below; the general antidote is "run the seam that lives outside `npm test`."
- **A static-analysis / security proof can be VACUOUS — plant a real violation and watch it FAIL before trusting any "X verified" green, especially the crown-jewel one.** (2026-08-01, D-042: the no-egress proof's import denylist matched module bans against *string-stripped* code — `stripCommentsAndStrings` removed the `"node:net"` specifier before the pattern ran — so a planted `import from "node:net"` in `src/` **falsely passed**. The whole import half was theater for the project's central differentiator; only call-shaped bans (`fetch(`) ever fired.) Caught by running-it-down before adding `child_process` to the array — adding to a vacuous denylist would have been "bless a hole with a test" ([[testing-stack]]). The retroactive sting: every prior "no-egress verified" GO (CC's and CHENG's) rested on a test that couldn't fail — the *conclusion* held (the code genuinely doesn't egress) but the *proof* didn't. FIX shape worth remembering: strip comments but KEEP strings for specifier matching, anchor patterns to `from|import|require` so a string *mentioning* the module doesn't false-positive (the opposite failure — a trigger-happy proof). Mutation-proven 6 ways (CC) + 5 forms (CHENG). Lesson: a green test is a claim; a green *security* test is a load-bearing claim — verify it catches what it says by making it go red on purpose. Pairs with [[feedback-argue-the-opposite]] (execution is the uncorrelated signal).
- **A user-facing artifact's job IS the experience — WATCH it, don't just verify its machinery.** The
  Layer-1 demo (2026-07-27) gave two more instances, both invisible to machinery review + CI + CHENG's
  read, both caught only when Kevin *ran/watched* it: (1) the pacing was invisible because Node
  block-buffers non-TTY stdout (fixed with `fs.writeSync`) — "the sleeps fire" ≠ "you can see them";
  (2) an incidental annotation overclaimed ("the max this agent can ever spend" — but the global cap
  is per-window + per-denomination, not a lifetime total). Lesson: **every printed word of a demo is a
  claim** (annotations included, same bar as a doc), and paced/animated output must be *watched as a
  stranger would*, including how it CAPTURES for a recording (asciinema under a PTY preserved it).
