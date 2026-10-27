---
name: doc-claim-integrity
description: Docs rot silently because review is diff-scoped; the fix is a corpus-wide claim audit + a mutation-proven doc-integrity check + a pre-release checklist.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52b8cc4c-25fa-461f-9d24-a8c6247fda06
---

Kevin found real integrity defects in README then THREAT_MODEL "without looking hard" and asked why our diligent process let them through. Diagnosis (evidenced by a 16-agent corpus audit, 2026-07-18): **our review is diff-scoped (CHENG reviews deltas) and code-claim-scoped (traceability proves REQUIREMENTS↔tests). Neither re-reads whole early-written docs against current reality, so state-describing prose rots — it is never in a diff.** The clean docs were machine-generated (TRACEABILITY), just-touched (README), or append-only (CHANGELOG); the rotted ones described evolving state and were written once (SECURITY said "cannot yet stop a real payment" — false; releasing said "held at 0.1.4"; roadmap said 0.2.0).

**Rot taxonomy that mechanizable review must target:** count drift ("nine invariants" was eight); version-relative rot ("new in 0.2.0", "armed but not fired"); phantom citations (an unlocatable credit — appeared in 3 files); overclaims contradicting a caveat in the same doc; dead internal links/anchors; shipped author-notes/TODOs ("belongs in the README verbatim").

**Why:** for a tool whose value is "trust it because you can check it," a false/unverifiable doc claim attacks the product's core. Doc accuracy IS the product's credibility (esp. SECURITY.md/THREAT_MODEL — first place an evaluator looks).

**How to apply:** DONE end-to-end (main `6e4c27b`). (1) 22-finding content scrub across 3 batches (destale-state, kill-phantom-citation, fix-internal-refs), each fix verified vs ground truth by CHENG. (2) **Durable fix SHIPPED:** `test/docs-integrity.test.ts` in the default `npm test` gate — 3 mutation-proven checks (internal link+anchor resolver; README `## Status` states package.json version; README property-test/invariant counts == live suite, self-maintaining from either side). CHENG independently re-ran all mutation-proofs + added the false-negative probe (a genuinely dead anchor must go RED) and code-side count drift — all caught. Plus `docs/doc-audit-checklist.md` (judgment classes: re-read state-prose, scan shipped author-notes/TODOs, citation locatability), wired into releasing.md step 1. Known latent edge (commented): slugifier doesn't dedupe GitHub `-1`/`-2` duplicate-heading anchors (none in corpus; fails safe). Bar met (CHENG): a doc-lint that can't fail is worthless — each check proven RED per rot class. Reviewer hygiene: `git fetch` before diffing origin/main (stale-local-main false-alarmed 3 reviews). See [[feedback-development-discipline]], [[testing-stack]].


---

## 2026-08-25 — refcheck v2: RESOLUTION IS NOT CORRECTNESS

⭐ **A line number always lands somewhere.** `docs/deep-link-seam.md` cited
`build_main.py:279` for `const PREVIEW=/[?&]preview=1\b/…`; that address resolved
to `(want?Promise.resolve(want):grab(…))` and **version one called it `ok`**.

Three citation forms now, and the third is the one a design doc needs:

```
src/app.js:894                       resolves only — counted as debt
src/app.js:894 "function set("       the line must CONTAIN that text
29f4c30:build_main.py:279 "const PREVIEW="    pinned to a REVISION
```

⭐ **SOME BROKEN CITATIONS BROKE BY BEING FIXED.** All 11 were exactly right at
the commit that INTRODUCED their document; `914e638` moved the renderer out of
`build_main.py` and left dated descriptions pointing into a 403-line file. The
three hand-written `location.search` reads were replaced by `deeplink.js`; the
raw title-cased feed key was repaired when `WHY` gained `name`. **Re-aiming those
at today's code would make a description of a DEFECT appear to describe the
CURRENT code** — worse than a number that does not resolve.

⚠️ **DO NOT GENERATE ANCHORS FROM THE LINES THEY CHECK.** Two lines of script,
and it freezes an already-wrong citation in as truth — `:279` is the live proof.
**The anchor comes from the CLAIM the sentence makes.** That is why 51 unanchored
citations are left as counted, printed debt rather than swept, and the warning
lives in the tool's own docstring.

**It is a gate as of 2026-08-25** (`npm run refcheck` inside `npm run gates`),
canaried: a bad anchor gives exit 1 on both. **68 citations, 0 broken.**
⚠️ Needs `fetch-depth: 0` — see [[mechanize-the-review]] for the shallow-clone
failure and why the tool exits **3**, not 1, when the environment is at fault.
