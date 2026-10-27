---
name: front-door-tonight
description: "✅ BUILT 2026-09-22: the front door shows the whole NIGHT, dated by the league's own field that the upcoming copy loop was dropping. Fixed the 29-Sept defect (slate carried no forward look). ⛔ I read an EMPTY 308 body as a failed deploy."
metadata:
  type: project
---

Kevin, from the live site: *Next* named one game of eight. Full record:
`docs/front-door-tonight.md` (plan §3, CHENG §5, built §7).

⭐ **THE MOVE WORTH REUSING: the pipeline already held the answer and threw it away.**
`front-door.md` §12.3 had RULED that a night cannot be named — no UTC date does, since a
10:30pm Pacific game is 05:30Z the next day — so the block named one fixture. But
`classify()` attaches `week.date` (the league's own night) to every game, and the loop
building `upcoming` copied seven fields and not that one. **Before re-litigating a
ruling, check whether the fetch already carries what the ruling said we lacked.** Same
shape as `hl` and `drew`.

⛔ **The defect nobody would have seen until 29 September:** `slate` fires whenever
recent.json holds games and carried `next: null`. In preseason recent.json is empty, so
the forward look was visible; from the season's first morning it would have vanished on
every day with results. Season restarts keep doing this ([[season-restart-traps]]).

⛔⛔ **I DECLARED THE DEPLOY DEAD FROM AN EMPTY FILE.** `curl https://readthegame.co/index.html`
answers **308 with a zero-byte body** (the site serves `/`), so every grep matched nothing
and I read that as "production does not have the code" — against a deploy gate that had
already diffed the live site against the repo. **A disagreement with a passing gate is
evidence about my probe first.** See [[verify-inherited-claims]], [[looking-at-pixels]].

⚠️ Also: two new renderer tests PASSED BEFORE THE RENDERER EXISTED — "no row produces an
href" is true of a block with no rows. Both now assert the subject is present first.
`tools/pixels.sh` gained `RTG_PIXELS_TONIGHT` (invented fixtures) and `RTG_PIXELS_HEIGHT`
(the supported phone is LANDSCAPE; the harness was pinned at 900px tall).


## ⛔⛔ THE FIXTURE CLOCK IS IN THE READER'S ZONE, UNLABELLED — 2026-10-07

Found by an outside review ([[outside-review-grok]]) and **reproduced exactly**.
`clockOf` is `toLocaleTimeString(undefined, …)`, so the time is rendered in
whatever zone the reader's machine is in, with **no zone on it**. Rendering the
live front door under `TZ=UTC`:

```
PIT at WSH · 11:30 PM     COL at WPG · 11:30 PM     EDM at ANA · 2:00 AM
```

⭐⭐ **AND THE HEADING ABOVE IT SAYS "Tonight · 3 games"**, so for that reader one
of the three is **tomorrow**. This is the same seam this file already records —
the LEAGUE's date for the night against the READER's own calendar date — arriving
on the clock rather than on the date. ⚠️ A third nick: `7:30 PM` and `10:30pm` are
formatted two different ways on one page.

⏭ **OPEN.** The fix is not obviously "force Eastern": a reader's own start time is
useful. What is not defensible is an unlabelled time under a heading that names a
day the time may not be in.
