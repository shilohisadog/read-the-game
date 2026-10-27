---
name: data-model-review
description: "2026-10-12 whole data-model review (docs/data-model-review.md) — Kevin: 'get our arms wrapped around everything then start fixing'. Items 1–5 and 9 done and verified live; the MEANING half (the measures audit + list of measures) is [[measures-list]]. Open: item 6 (gshots, app.js:216 fallback — waits on Kevin), 7, 8, 10, 11, 12 (reduced motion — waits on Kevin)."
metadata:
  type: project
---

Kevin asked for a review of the data model (efficient, accurate, aware, and — his addition — CORRECT) and ruled: review everything first, then fix. The review is `docs/data-model-review.md` (commit `0db34f5`/`e6a335e`), built from an inventory + three read-only passes (duplicates, correctness register, bytes), headline claims re-checked by hand.

Already fixed that day (`b71e107`): "Last night" emptied by the 08:17 run (slate now = newest catalog night in window, `newestNight` in measure.mjs); dead `coverage.refusedInWindow`. Raw archive (`data.readthegame.co/raw/`) is PUBLIC — Kevin chose to add a Cloudflare dashboard WAF rule himself (name `readthegame: raw league archive is not public`); then run `r2-raw-private.yml` with apply=false to verify. The token lacks WAF:Edit.

Kevin's framings to keep: duplicates are accidental (eliminate) / cache (guard) / witness (protect); correctness = "what independent thing could prove this field wrong" (107 fields: 12 hard, 43 none). He rejected the `status.json` stopgap as a band-aid — the root is ONE PUBLISHED DOCUMENT PER PAGE instead of five pages each downloading the 483 KB catalog.

Top of the fix list: D1 slot rule (layer + published figures use 2 clauses, the ice draws 3 — Kevin's behind-the-goal-line clause); catalog `u` false shot asterisk on faceoff-only games; typed "7.8%" vs 8.36% from published counts; ~600 KB of comments in game.html, which the home hero iframes (home 564 KB). See [[second-witness-league-figures]], [[mechanize-the-review]].

## Progress (2026-10-13)

- ✅ 1 slot rule `bd9d559` + re-measure `137f0c8` (46.7%→45.6%, 75.4%→74.8%, 11.4%→11.6%). `ingest.yml` dispatch input `remeasure` forces the measure job after a rule change in code.
- ✅ 2 catalog `us` (shot dispute) vs `u` (any, the ledger's) `0aef016`; shipped via a BRANCH re-derive first so no page ever read a missing flag. `teams.archive` deleted.
- ✅ 3 built pages stripped of comments `6c4e2f4` (`P.strip` → `tools/strip-comments.mjs`, lexer opt-in `{comments:true}`), before CSP hashing.
- ✅ raw archive private (Kevin's dashboard WAF rule, verified 403).
- Added: item 11 (strip narrative from SOURCE comments, file by file) and item 12 (replay reduced motion: 12 animations, only the pulse stops — needs Kevin's ruling).
- Kevin rejected `status.json` as a band-aid → item 4 is the root fix.
- ✅ 4 (2026-10-13) `f7d0c2e` publish → `0b047a7` switch pages + drop `no-store` → `f558ba7` release-gate tools. `front.json`, `team/{AB}.json`, `calendar/{YYYY-MM}.json` are verbatim projections (`src/lib/page-docs.js`), checked byte-for-byte FROM THE BUCKET after upload. Preview reads the game's extract (present = played). Home data ~86→~12 KB, team ~86→~6, calendar 61→~2. Unchanged docs answer 304.
  - ⛔ The classifier BLOCKED an automatic delete of refused games' extracts from R2 → shipped a READ-ONLY check instead (0 of 67 today). Deleting production objects is Kevin's call.
  - ⚠️ Deviations I reported: all pages switched in one deploy (not one at a time); measures.json fetched in parallel on the front door, not "after the hero plays" (the frame posts within seconds, so same bytes).

- ✅ 5 (2026-10-13) `60e13b6` + full re-derive. MEASURE FIRST paid again: goals/assists/saves agree on all 4,281 games; shots +1 only inside the 74 asterisked games; power play differed by DEFINITION. Kevin ruled: (a) league's PP definitions; (D6) count from the play-by-play AND show the league's boxscore figure wherever they differ ("transparency + check our work"). PP now 4,280/4,281 (box) and 87/89 opportunities, 592=592 (rail). League rules found by data: double minor = 2 opportunities, a penalty at the final horn = 0, equal penalties at one stoppage cancel; a PPG is decided by penalty advantage with pulled goalies discounted (on-ice count is NOT the league's rule — tried, 29 worse).
  - ⭐ Design: Python only COPIES league figures (SCHEMA 6 `quoted.players`, `quoted.pp`); the JS that makes the site's numbers does the comparing (`src/lib/league.js`) — no second implementation of a counting rule in Python.
  - Live: preview player row "Bouchard 18 in 5 games (the league's boxscores say 17; the two differ on 1 October 2026 against Vancouver Canucks)"; methods page PP working shows both counts; game page note names the player and goalie.
  - ⛔ I pushed a docs-only commit WITHOUT running gates and main went red (doc-paths test). Run gates on every commit, docs included.
- ✅ 2026-10-13 records KEPT and shown (Kevin): the preview's team section opens "Edmonton Oilers 4–0–1 and Los Angeles Kings 0–2–2 this regular season, through 12 October 2026. The record says who won; the rows below say how each team plays." Witness: `builders/standings.py` copies the league's standings for our newest regular-season date into teams.json (32/32 agree); a difference shows both. Same day: the front door's "Tonight · N games" links to `calendar.html?date=`, which now lists the date's scheduled games as preview doors.

**2026-10-15/17 update.** Kevin: the measures audit is "another aspect of our data model
review" — so the review now has two halves: STORAGE (this file, §1–6 of the doc) and
MEANING ([[measures-list]], `docs/measures-audit.md`, linked from the review as §5a).
Item 9 done (`ac829b2`, Kevin moved it up): derive 31 min → 3 min 14 s by caching the raw
archive and uploading only changed extracts. Still open: the nightly's measure job
downloads every extract (6–9 min a run) — a smaller cousin of item 9.

