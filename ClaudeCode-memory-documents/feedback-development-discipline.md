---
name: feedback-development-discipline
description: "Kevin's development loop for SpendGuard — audit/think/plan/test-first/implement/verify, no band-aids, precise attack surface, a stopping rule"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52b8cc4c-25fa-461f-9d24-a8c6247fda06
---

Kevin's standing development discipline, agreed 2026-07-10 and recorded as **D-016** in `docs/decisions.md`. Applies to every development stroke.

**The loop:** `audit → think → plan → write the failing test → implement → verify`, with an explicit **return edge from implement back to think.**
- *Test-first is a named step*, or "implement" swallows it and we drift to test-after within a week.
- *Going back is the default, not a defeat.* Band-aids aren't a character flaw — they're what happens when you find mid-implementation that the plan was wrong and patching forward is cheaper than re-planning.

**Band-aid, defined so the rule is checkable:** *a change that makes a symptom disappear without changing the model that produced it.* E.g. a special case so a test passes; catching an exception to suppress rather than to deny; widening a type to accept a value that should be rejected. Code-side twin of *never weaken a test to go green* ⟹ **never widen the code to accept an input you should reject.** Affordable only because we have no users; with users it needs a documented hotfix→real-fix→regression-test exception path.

**Attack surface — Kevin proposed "every source line is an attack surface"; I pushed back and he accepted the refinement.** As stated it's *false and costly*: if every line is attack surface, none is, and scrutiny can't concentrate at the trust boundary. It also pushes toward validate-everywhere, which *increases* line count and therefore bugs. Replaced by two true statements:
1. **Every line is a liability** (you own/maintain/review it) ⟹ **write fewer lines** — which is exactly why the core must be readable in one sitting.
2. **Attack surface = where untrusted input meets a decision**, and it gets the paranoia: challenge parser, payload parser, amount parsing, cap arithmetic, policy loading, state-store boundary. Adversarial + property + fuzz tests concentrate there. Pure comparison logic downstream of a correct parse gets ordinary rigor.
Follow **parse, don't validate**: convert untrusted input to a trustworthy type once at the boundary; the interior trusts its own types.

**Stopping rule (definition of done):** the requirement's named test passes, the code is as small as it can be while passing, and no test was weakened to get there. **"Highest quality possible" is unbounded and is its own failure mode** for a deliberately cheap, bounded option — the stopping rule bounds it. Quality is defined by the threat model and the requirements.

**Change control — the defect-vs-decision distinction (ratified 2026-07-11, the "CCB of two"):** a *defect fix* — restores already-intended behavior, has a test — goes straight in, no ceremony. A *scope/requirement/design change* — a new knob, a changed requirement meaning, a rescope — must **converge/ratify FIRST**, even mid-session ([[feedback-converge-before-recording]]). Born from the CCB question: M2 (a CLOCK-01 requirement rescope) was landed solo when it should have been gated. This is the right-sized rule, not a formal board — pre-alpha two-person project doesn't need CCB *structure*, but it does need this one *seam*. When unsure which side a change is on, treat it as a decision and converge.

Composes with [[testing-stack]] (the honest stack; TDD's limit), [[feedback-mechanism-not-policy]] (the razor for *what* to build), and [[feedback-converge-before-recording]].
