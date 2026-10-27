---
name: feedback-converge-before-recording
description: "Kevin's rule — nothing reaches the repo without convergence first; findings and decisions have different clocks"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52b8cc4c-25fa-461f-9d24-a8c6247fda06
---

Kevin corrected me on 2026-07-09 when I called it "backwards" that the research wasn't yet in the repo. **"I don't think we go from prompt → response → repo without a convergence on what we decided, right?"** He was right and I retracted it.

**The rule: converge, decide, then record.** A repo filling with unratified artifacts is *worse* than an empty one — it manufactures the appearance of settled decisions out of one party's drafts. A `THREAT_MODEL.md` written before we'd agreed the v1 scope, before we'd read the prior art, and while two of Kevin's questions were still open, would not have been transparency. It would have been a faster way to be wrong in a versioned file.

**The distinction I collapsed, and must not collapse again — two objects, two clocks:**
- **Findings are perishable and not up for decision.** That the x402 signature covers `{from,to,value,validAfter,validBefore,nonce}` and never the resource URL is true whether or not we agree. Same for arXiv numbers, CVEs, competitor line numbers. These live in context and transcripts that get cleaned up ⇒ **capture them promptly, in memory.**
- **Decisions are not perishable and are entirely Kevin's.** They cannot evaporate, because they don't exist until he makes them ⇒ **never pre-commit them to the repo.**

**How to apply:** verified external facts → memory (or scratchpad), immediately, with citations. Decisions, scope, claims, published artifacts → only after Kevin converges. "Build as if public" means *keep the repo publishable*, not *publish early*. When I feel urgency to write something down, ask which of the two objects it is.

Compatible with, and downstream of, [[feedback-transparency-and-requirements-first]] — requirements before code, and convergence before requirements.
