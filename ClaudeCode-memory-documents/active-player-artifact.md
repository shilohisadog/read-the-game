---
name: active-player-artifact
description: "✅ SHIPPED AND LIVE — the active-player line renders on **97.6% of playable frames** (22,661 of 23,207 over 87 games): `app.js` writes `ATTRIBUTION[type].say` into `#who`, suppressed on goals (2.3%, where the pill names the scorer and the row offers the NHL highlight) and a plain label on 0.1%. ⛔⛔⛔ CC HAS REPORTED THIS AS UNBUILT TWICE — 2026-09-10 into `docs/status.md`, and AGAIN 2026-10-04 onto a todo list, because **the topic file was corrected in September and the MEMORY.md POINTER TO IT WAS NOT.** The index is the only part that loads, so a pointer contradicting its own file IS the claim. Kevin caught both in one sentence. ⭐ The risk that mattered was never coverage: `actor` means a DIFFERENT relationship per event type, so the name never appears without its VERB, from one {field, verb} table (CHENG)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T12:28:21.864Z
---

## ✅ SHIPPED — and this file was wrong about that for a while

`app.js::who()` renders the line into `#who` on every playable frame:
`ATTRIBUTION[e.type].say` with `{a}` replaced by `#NN Surname`. Measured over 87
games, 23,207 playable frames:

| | |
|---|---:|
| a NAMED line | **22,661 (97.6%)** |
| goals — suppressed, NHL highlight offered instead | 528 (2.3%) |
| plain label fallback | 18 (0.1%) |

`test/active-player.test.js` guards it, including the reserved `min-height` that
stops the row from moving the Play button.

## ⛔⛔⛔ THE LESSON IS THE STALENESS — AND IT HAPPENED A SECOND TIME, 2026-10-04

**This file was corrected on 2026-09-10 and the MEMORY.md POINTER TO IT WAS NOT.**
The index line still read *"written up, NOT built — 92.8% of frames carry a player
the page never shows"* twenty-four days later, and on 2026-10-04, picking up from a
compact, CC put it to Kevin AGAIN as an unbuilt item on the todo list. Kevin: *"I
think 4 was closed a while ago, no?"* — the second time he has corrected the same
claim from the same source, in one sentence, without looking anything up.

⭐⭐⭐ **THE INDEX IS A SECOND SURFACE, AND IT IS THE LOAD-BEARING ONE.** `MEMORY.md`
is what enters context every session; the topic file is opened only if the pointer
makes it look worth opening. **So a pointer that contradicts its own file is not a
cosmetic lag — it is the only version anyone reads.** Fixing the file and leaving
the pointer is [[mechanize-the-review]] #65–#66 exactly: the fix applied to the
thing and not to the key that describes it. Nothing can go red here; there is no
suite over memory. The only defence is that **a correction is not finished until
the pointer is re-read.**

## ⛔⛔ THE ORIGINAL STALENESS, 2026-09-10

CC told Kevin on 2026-09-10 that this was *"built and unwired, showing nothing"*
and wrote it into `docs/status.md` as one of four remaining unturned stones — in
an inventory whose entire method was **grep what a surface actually reads**.
Eleven fields were checked against the code; the twelfth was taken from this
file. **A memory note is a claim about the past tense of a codebase.** See
[[verify-inherited-claims]].

## ⭐ WHAT THE REAL RISK WAS, AND IT WAS NEVER COVERAGE

`actor` does not mean "who did this" — it means whatever the type's row says: the
faceoff WINNER, the HITTER, the SHOOTER on a blocked shot whose coordinate
belongs to the blocker. Rendering a bare name publishes a field's VALUE without
its MEANING. CHENG's ruling: one `{field, verb}` structure, never two tables that
have to agree. That is why the name never appears without its verb.
