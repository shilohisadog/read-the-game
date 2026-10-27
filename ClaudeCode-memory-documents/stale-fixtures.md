---
name: stale-fixtures
description: "⚠️⚠️ 2026-09-01 — FIVE OF SEVEN TEST FIXTURES WERE AN OLDER EXTRACTOR'S OUTPUT, and it had already produced a test that DEMANDED THE WRONG ANSWER and passed. The README predicted this failure and prescribed the fix, and none of it fired. Now instrumented by cross-fixture consistency."
metadata: 
  node_type: memory
  type: project
  originSessionId: 46d59bad-74f1-44f0-a5cb-e1367a6eae79
  modified: 2026-09-01T14:52:52.616Z
---

Found while auditing the penalties card: 62 of 98 penalties in
`test/fixtures/extracts/` carried no infraction name, and I was one step from
reporting `descKey` as a recent feed field. **It is not** — `2023020207` and the
reference game `2023020204` are the same night, 10 November 2023, and one had 0
of 5 named against 8 of 8.

## What was actually wrong
**Five of seven fixtures were an older extractor's output.** Same games, **same
raw feeds** (`game.src` hashes identical in every case), missing:
- the top-level **`sides`** key — the ends-switching data B1 is built on
- **`pen`, `min`, `sev`, `zone`, `drew`** on every penalty
- **`miss`** on every missed shot (B5's missed-shot reasons)

So two shipped features had **no fixture coverage at all** and nothing said so.

## ⭐⭐ AND IT HAD ALREADY PRODUCED A FALSE TEST
`render-penalties.test.js` asserted that `2023020207`'s fewer-skaters goal was
**NOT** short-handed — the pulled-goalie trap. **It is:** with the correct extract
there is a Toronto player in the box at 4-on-5. The stale file had no penalty
durations, so `stints()` computed an empty box, so a genuinely short-handed goal
looked like the trap it was being used as.

**The test demanded the wrong answer and stayed green for as long as the data was
wrong.**

No fixture held a real trap any more, so **`2024020543` was added** — two, both
at `sit=0651`. Re-derived over 46 published games: **247 goals in play, 17 with
fewer skaters, 7 short-handed, 10 the trap.** The naive `sit`-only rule is wrong
on the MAJORITY, not "four times in five" as the old comment had it from a
40-game set.

## ⭐⭐ A RULE WRITTEN DOWN AND THEN BROKEN IS UN-INSTRUMENTED, NOT UNDER-STATED
`fixtures/extracts/README.md` already opened with *"published extracts, copied
byte-for-byte"*, already named this failure mode — *"the tests keep passing
against a world that no longer exists. That is worse than going red, because it
still looks like coverage"* — and already prescribed *"when extract.py changes the
per-event shape, re-copy these"*. **None of that made anything fire.** Third
instance of the same lesson in this repo; see [[mechanize-the-review]].

## The gate: CROSS-FIXTURE CONSISTENCY (`test/fixtures.test.js`)
**A field that every event of a type carries in one fixture and no event carries
in another is two vintages of extractor in one directory.** Needs no network and
no version stamp — a stamp would have to be bumped by hand, which is a constant
that drifts. Proven both ways: red on the five stale files (6 drifted fields),
green after. Plus a coarser top-level-key check, which caught `sides` first.

⛔ **Its blind spot, stated in the test:** if EVERY fixture were stale at the same
vintage it says nothing. Mixing is what it catches, and mixing is how the drift
arrives. The stronger check — byte-comparing each fixture against the published
archive — belongs where the archive is walked (`derive.yml`), and is **not built**.

## ⚠️ THE HABIT THIS SHOULD CHANGE
`test/fixtures/` is a **frozen sample**, not the archive. Before measuring
anything about the feed from it, check it against a published extract — the
penalties audit measured the ARCHIVE (46 games fetched from
`data.readthegame.co`) precisely because the fixtures had already misled me once
in the same session.

Related: [[mechanize-the-review]] · [[guard-where-the-archive-is]] ·
[[verify-inherited-claims]] · [[rule-diagrams]]
