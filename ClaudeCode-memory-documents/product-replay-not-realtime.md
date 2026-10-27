---
name: product-replay-not-realtime
description: "Read the Game is a REPLAY resource, never real-time (Kevin, 2026-08-07). Public multi-game site, nightly ingestion of the previous day's games, date-selectable, hosted with a real backend."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-07T15:14:31.691Z
---

**Kevin, 2026-08-07: "we are absolutely a *replay*, not a real-time educational resource."**

This is a positioning rule, not a roadmap note, and it does more architectural work than anything else in the platform design. Treat a request for live/in-game data as a scope change that contradicts settled positioning — surface it, don't absorb it.

**The rest of the direction, set the same day:**
- **Multi-game**, nightly job pulls the **previous day's** games, prepares datasets, **date-selectable**.
- **Public-facing, hosted website, real backend**, aiming for real traffic. GitHub Pages is retired as a target.

**Why replay-only earns its keep:**
- A game is ingested once, complete, and never mutates → every extract is immutable and infinitely cacheable.
- No provisional-honesty problem: we never have to explain that a number is mid-flight. Doctrine §2 (deterministic) holds trivially because the inputs are frozen.
- No polling, websockets, or live invalidation.
- The teaching case is stronger anyway — "MIN outshot BUF 35–25 and lost" is not sayable in the second period.

**How to apply:**
- **Reducers NEVER run server-side.** The server ingests, stores, indexes, serves; the browser derives every metric. Doctrine §2 says numbers must be recomputable by the viewer, which is only true if the computing happens where the asking happens — and it also makes traffic cost ~flat, since we serve immutable static JSON via CDN. Expect the first performance complaint to propose server-side precomputation; the answer must already exist.
- **Never fetch from the NHL at render time.** Ingest and keep. A feed change then breaks tomorrow's ingestion, never yesterday's page. The archive is both product and insurance.
- Full design, scale numbers, ingestion/vocabulary gate, and open questions: `docs/platform-architecture.md`. Phases 0–2 of [[builders-are-the-source]]'s companion (`docs/main-app-rework.md`) are unchanged and prerequisite.

Related: [[hockey-legibility-build]] (the name is sport-agnostic on purpose — MLB later), [[verify-inherited-claims]] (the vocabulary gate exists because feed values drift silently).
