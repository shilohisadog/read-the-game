---
name: feedback-mechanism-not-policy
description: "Governing design razor for SpendGuard — the guard is mechanism, the user authors policy; the guard forms no opinions of its own"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52b8cc4c-25fa-461f-9d24-a8c6247fda06
---

Kevin's governing design principle, stated 2026-07-10, invoking Linus Torvalds' "policy belongs in userspace, not the kernel." **The guard is *mechanism*. The *policy* is the user's, authored in `policy.yaml` (userspace).** The guard deterministically enforces whatever the user configured — caps, allowlist, binding checks, halt — and holds **no opinion of its own** about what a good or suspicious payment is.

**The razor — apply to every "should the guard also do X?" question:**
- Does the control enforce a rule the **user explicitly authored, deterministically**? → **mechanism. Allowed.** (This is everything we build.)
- Does the control require the **guard to form its own judgment** about what's suspicious/unusual/bad? → **policy in the guard. Rejected.**

**What it killed:** **anomaly / spike detection** (à la Sentinel's spike detector) is **rejected on principle, not deferred** — it is the guard inventing policy at runtime via a heuristic the user never wrote. A guard that false-denies on a statistical guess also erodes the exact trust that is the product. Both Grok and Sentinel proposed it; we decline it, and say we *chose* rather than missed.

**What it clarified (survives the razor):** a **velocity/rate cap** ("max N payments per window") is *mechanism enforcing an explicit user rule* — the same shape as the spend caps — so it is legitimate; it's a **scope** question (fast-follow), not a principle one. Contrast with anomaly detection, which is heuristic.

**Why:** the whole product is trust, and trust comes from a small, auditable, deterministic core whose behavior is a pure function of (payment, challenge, policy, state). Any built-in heuristic opinion breaks determinism *and* the trust story.

**How to apply:** run every proposed feature through the razor before scoping it. Consistent with, and the generalization of, [[feedback-x402-option-not-investment]]'s "we don't decide policy good/bad" (the residual-risk "out of role" split). See [[threat-model-working-draft]], [[project-x402-spendguard]].
