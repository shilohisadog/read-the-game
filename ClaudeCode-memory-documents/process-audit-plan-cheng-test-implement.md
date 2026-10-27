---
name: process-audit-plan-cheng-test-implement
description: "THE build process for Read the Game (Kevin, 2026-08-07): audit -> plan -> technical artifact for CHENG's review -> discuss his changes -> write tests -> implement. Do not skip to building."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-07T12:20:50.777Z
---

**The loop, stated by Kevin on 2026-08-07 to make sure we're on the same page:**

> `audit → plan → create a technical artifact for CHENG's review → CHENG reviews → we discuss whatever changes he suggests → you create the tests → implement`

This REFINES [[feedback-development-discipline]] (D-016: audit→think→plan→failing test→implement→verify). Two things D-016 didn't make explicit:
1. **The plan is a reviewable ARTIFACT for CHENG, not a note-to-self I act on.** CHENG = the other Opus instance (browser-based, same laptop); Kevin relays. See [[hockey-legibility-build]] for roles.
2. **Tests come AFTER the review settles**, not before the plan is reviewed. Writing tests against an unreviewed plan just cements the wrong design.

**Why:** I triggered this. Kevin asked whether stoppage/penalty events were in the datastream and said "I'd love to surface and explain those." I answered the data question and then wrote a ~300-line builder for a whole new view — teaching copy, new UI, and a brand-new doctrine category — in the same turn. He stopped me mid-turn: *"if you're building something, we have a process for that....please hold for discussion."* Nothing had been run, published, or committed, but the point stands.

**How to apply:**
- **A user expressing interest is not a ratification.** "I'd love to be able to X" opens a scope conversation; it does not authorize building X. Per D-016's change-control seam: defect fixes go straight in, scope/design changes converge FIRST. When unsure which side it's on, treat it as a decision.
- **Answering a factual question is always in bounds** — the data audit (what's in the feed, what the limits are) was the right work and Kevin valued it. The violation was continuing from the answer into implementation.
- Drafts are not wasted when stopped early: Kevin's response to the held draft was "at least we have drafts to work from." Stop before running/publishing/committing, keep the artifact, bring it to the discussion.
- Discuss in plain thread, never AskUserQuestion — [[feedback-discuss-in-thread]].

**Open items parked by this exchange (2026-08-07), for the CHENG discussion:**
- **The "derived" category** — my draft invented a third doctrine class between "real" and "we don't draw it," for conclusions that are *a rule applied to real data* (e.g. icing sends the draw back to the offending team's end, so the faceoff coordinate reveals who iced it). Kevin: *"CHENG definitely won't care for a 'derived' category (lol)"* — parked for them to settle. Do NOT ship it unratified.
- **Teaching copy** for the stoppage/penalty rules — drafts exist in `builders/build_rules.py` (written, never run, uncommitted). To be discussed, not shipped.
- **PRIORITY, set by Kevin:** rework the MAIN APP into a "real" program FIRST, before any new layer lands. See [[builders-are-the-source]] — it's 94KB assembled by a chain of five patch-builders.
