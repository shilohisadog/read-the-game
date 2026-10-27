---
name: feedback-transparency-and-requirements-first
description: "Kevin's two standing process demands on SpendGuard — requirements before code, and radical transparency with a private-data boundary"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52b8cc4c-25fa-461f-9d24-a8c6247fda06
---

Two standing commitments Kevin set on 2026-07-09, both carried over as lessons learned from the trading system.

**1. Requirements before development. No bolted-on bits.** Everything discrete and testable gets written down and assigned to a build before we go further down the development arc. Accepted amendment he adopted: for a security tool, **derive requirements from a threat model — don't brainstorm a feature list.** Every requirement traces back to a threat it defeats and forward to a test that proves it. If a requirement can't name its test, it's a wish, and it goes in "open questions" rather than getting a number. Corollary he agreed with: ground-truth the x402 spec/SDK *before* writing any protocol-touching requirement, or I will confabulate field names fluently into the one document whose purpose is to be trusted.

**Why:** bolt-ons don't come from deciding too little up front — they come from deciding the *reversible* things and deferring the *irreversible* ones. Sort decisions by cost of reversal; spend all the care on the expensive end.

**2. Radical transparency, with one boundary.** Open code, open reasoning, open failures — including flaws we later find in our own guard (fix, release, *then* disclose in full; coordinated timing, never secrecy).

**The boundary, in Kevin's words: "data that stays private has to be kept private, everything else gets published."** Concretely — private = the user's runtime data (wallet addresses, payment destinations, amounts, domains, decision logs, `policy.yaml` contents), secrets (keys, tokens), and Kevin's other work (the trading system). Everything else publishes: code, threat model, requirements, decision records, research findings, dead ends.

**How to apply:** *Transparent about the tool, private about the user.* The code is maximally open; the runtime is maximally closed-mouthed — no egress, no telemetry, not opt-out but **absent**, and verifiable precisely because the core is small enough to read. Also disclose plainly in the repo that a human and an AI wrote this together, next to a ~1,000-line core that makes the claim checkable.

**Publication coupling (flagged, not decided):** whether v1 gets published is still open. Learning accrues either way; the credential, distribution, and the entire reason MIT was chosen accrue only from a public repo — a license grants permission to people who can't see the code. So "private for now" is cheap **only if we keep the repo publishable on a day's notice** (no secrets, no addresses in history, transparency artifacts written as we go). Build-as-if-public costs nothing extra.

Related: [[project-x402-spendguard]], [[feedback-x402-option-not-investment]].
