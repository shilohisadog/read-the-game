---
name: feedback-no-hardcoded-values
description: "Kevin, 2026-09-23: there should never be hard coded values, anywhere — everything derives from ingested, calculated or applicable variables. ⭐ The agreed split: a MEASUREMENT is always derived and published; a POLICY is a declared choice."
metadata:
  type: feedback
---

Kevin, watching the preview build: *"a couple of spots you say '...instead of a typed
constant...', there should never be hard coded values, anywhere, no? Everything should
derive from 1) ingested, 2) calculated, 3) applicable variables and never be hard coded."*

**The split he ratified** (I proposed it, he agreed — use it as the rule):

| | |
|---|---|
| **a MEASUREMENT** | anything the archive can answer. Derive it in the pipeline, publish it, read it. A typed measurement is a figure nobody re-derives and nobody can check. |
| **a POLICY** | a CHOICE nothing can derive — a reliability target, an admission rule, how many rows fit. Declared ONCE, named, with the reason beside it, so it can be argued with. |

**What triggered it:** `src/lib/preview.js` carried `need: 35 / 23 / 37` — how many games
each preview row takes to settle — measured by hand in a scratch probe and typed in.
Now `src/lib/reliability.js` derives them from the archive and `measure.mjs` publishes
them in `measures.json.settle`; the card reads what was published.

⭐⭐ **AND DERIVING CHANGED THE ANSWER.** Measured over 96 club-seasons the slot row needs
**42** games, not the 37 I had typed — past the half-season admission rule, so the rule
drops that row from the card by itself. **My typed number was the flattering one**, which
is the argument for the rule in one line.

**How to apply:** before typing any number into source, ask which kind it is. If the
archive could answer it, the pipeline computes it. If it is a choice, it gets a named
constant and a comment saying it is a choice. See [[preview-what-to-watch-for]],
[[verify-inherited-claims]].
