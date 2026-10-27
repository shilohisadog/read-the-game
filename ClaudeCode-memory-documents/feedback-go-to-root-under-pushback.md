---
name: feedback-go-to-root-under-pushback
description: "When a design is holed, go to the ROOT — don't manufacture constraints to defend a prior conclusion; and don't ship a known fail-open gap in a security tool and excuse it with 'pre-1.0'"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6d74a52e-03a6-4f5f-9931-c90fa3586e42
  modified: 2026-08-02T14:24:05.472Z
---

**The 2026-07-27 integration-hardening thread — two linked failures Kevin corrected in real time.**

**Failure 1 — defending a prior conclusion instead of going to root (CC did this 3× in one thread).**
CC fixated on "the installer" as the fix. When CHENG holed it (the installer only protects developers
who *call* it; the manual path still fails open silently for the population that actually gets burned),
CC didn't step back — CC (a) bolted an "arm-flag" detector onto the side and called the pair an
**"indivisible gap-close,"** then (b) claimed the piecewise API was **"stuck being public (PKG-01)"** so
the flag was necessary. Both were **manufactured constraints** to keep a prior conclusion alive.
Reality: PKG-01's frozen-surface test guards *accidental* drift, not deliberate breaking changes; we're
0.x with ~zero consumers, so the footgun API can just be removed. The "constraint" was invented.

**Why:** under pushback the pull is to *patch the symptom* or *invent a reason the old plan still
wins*, not to re-open the design. That is band-aid thinking ([[feedback-development-discipline]]) wearing
a design hat.

**How to apply:**
- When someone holes your design, **do not patch the symptom or invent a constraint.** Ask: *what is the
  ROOT that makes the bad state reachable, and what makes that state UN-EXPRESSIBLE?* (Here: root = three
  independently-omittable wiring points, one fails open → fix = atomic install + delete the footgun, NOT
  a detector bolted onto the footgun.)
- **Watch for the tells** in your own words: "indivisible," "we're stuck," "we have to keep it,"
  "PKG-01/SemVer forces us." Each is a flag to check whether you're rationalizing a prior conclusion.
  When you catch one, say so plainly and reset to first principles — don't wait to be corrected again.
- A detector/tripwire is legitimate *only* as defense-in-depth on a path you genuinely can't remove —
  argued on its own merits, never smuggled in as "half of the fix."

**STATUS (2026-08-01): Finding D is CLOSED — commit `64d09d6` / decision D-041.** Atomic `installSpendGuard` makes the fail-open UN-EXPRESSIBLE (owns the signer-wrap + hook; returns only `wrapFetch`, whose omission fails closed); `createSpendGuardBinding`/`SpendGuardBinding` footgun surface REMOVED (not deprecated); requirement WIRE-01; mutation-checked. The lesson below stands as a lesson — do NOT cite Finding D as a live build target.

**Failure 2 — a security tool shipping a known fail-open gap, excused by "pre-1.0."**
We shipped (0.4.0) a public wiring API where omitting `wrapSigner` fails **open, silently** (Finding D /
`docs/decisions.md:285`), mitigated only by a doc-comment. When challenged, CC's answer was "we're 0.x so
we can change it." Kevin: **"that's not a good answer."** He's right — *"0.x lets us change it"* is a
statement about fix COST, not a defense of having shipped a known fail-open hole in a **security** tool.
For a guard, the fail-open direction is the cardinal sin ([[architecture-enforcement-ladder]],
fail-closed everywhere). Docs-as-mitigation for a silent fail-open is a *should*, and "a should you just
know they won't-and-will break something" (Kevin's own earlier framing). Lesson: **don't ship a known
fail-open gap and rationalize it; close it, or don't ship the footgun-shaped surface at all.** See
[[feedback-development-discipline]], [[latent-bolt-ons-in-core]], [[architecture-thin-edge-gui-readiness]]
(a wire-in component makes wiring-correctness load-bearing — so the wiring API must fail closed).
