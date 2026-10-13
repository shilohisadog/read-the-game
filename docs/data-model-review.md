# Data-model review — 2026-10-12

**Status: REVIEW ONLY. Nothing below has been fixed except where it says so.**
Kevin, 2026-10-12: *"let's get our arms wrapped around everything then start
fixing."* This is the whole picture; the fix list at the end is a proposal to
discuss, in order.

How it was made: an inventory of every document, then three independent passes —
duplicates, correctness, efficiency — each read-only, each citing file:line, and
the headline claims of each re-checked by hand before they were written here
(marked ✔). Counts are as measured on 2026-10-12; **re-measure before quoting.**

Already fixed the same day, from the inventory, and not repeated below:
"Last night" lost every morning (`b71e107`, verified live), and
`coverage.refusedInWindow`, a field that was always 0 (`b71e107`).
Raw-archive privacy: ✅ 2026-10-13, a Cloudflare WAF rule Kevin added in the dashboard; `r2-raw-private.yml` (verify-only) confirms `/raw/` answers 403 while `/extract/` and `catalog.json` answer 200.

---

## 1. What we publish

| document | who writes it | who reads it | wire / decoded |
|---|---|---|---|
| `raw/{gid}/{sha}/{feed}.json` + its `raw/{gid}/latest.json` pointer | fetch_nhl.py | derive.py, two dispatch-only tools | ~426 KB a game, **public today** ✔ |
| `extract/{gid}.json` | derive.py (from extract.py) | game page, measure.mjs | ~14 KB / ~80 KB |
| `catalog.json` | derive.py | home, team, calendar, preview, game page (no id) | 75 KB / 483 KB |
| `index.json` | fetch_nhl.py, then derive.py | home + team (4 fields), pipeline | 13 KB / 383 KB |
| `measures.json` | measure.mjs (nightly when a game changes, and weekly) | game page, home, preview, methods page; committed copy bakes static pages | 10 KB / 34 KB |
| `teams.json`, `players.json` | measure.mjs (+ mugs.py rewrites players) | preview | 14 KB / 75 KB, 6 KB / 28 KB |
| `recent.json` | measure.mjs `--slate` | home "Last night", preview tail | <1 KB |
| `schedule.json` | fetch_nhl.py | home, preview | 2 KB / 13 KB |

---

## 2. Facts kept in more than one place

Every copy classified as **accidental** (two implementations — eliminate),
**cache** (a stored copy — keep only if it earns it, and check it) or **witness**
(an independent observation — protect it).

| fact | copies | verdict |
|---|---|---|
| final score | boxscore → catalog `as/hs` and extract `quoted` (caches, two parsers of one field); event log (witness, checked on the TOTAL only, per side only against the pbp running score); `app.js:216` fallback (accidental — **counts shootout goals**, unreachable today) | keep caches; delete or fix the fallback; check per side |
| shots on goal | catalog, `quoted` (caches); event log and pbp running count (witnesses, checked) | keep |
| hits / takeaways / blocked | event log; rail `quoted.team`; boxscore `quoted.box` (witnesses, noted) | keep — this is the second witness |
| **"blocked"** | `attemptMix.blocked` 141,585 (every block) vs `teams.archive.blocksCredited` 129,754 (opponent blocks only) ✔ | two definitions under one word; the text beside the second says the gap is "7.8%" and the published counts give **8.36%** ✔ |
| slot share of attempts | `measures.slot` (archive.js) and `teams.archive.slotShare` (team-season.js), two implementations, same numbers today | accidental — and **`teams.archive` has no page reader at all**; delete the block |
| save fraction | one function published twice (measures and `teams.archive`) | cache with no reader — goes with `teams.archive` |
| game counts | index, catalog, measures, perGame, teams — all agree today (4,704 / 4,637 / 4,278) | caches; **nothing checks index `games[]` against catalog rows** — add one |
| date, game type | schedule → index → catalog → extract (caches); game type ALSO read from the id digits by `inScope` | nothing compares id-type with schedule-type; 0 of 4,704 disagree today — add a check |
| season from id | `scope.js::season` plus five restated copies (archive.js, preview.js, app.js ×2, build_index.py returning a Number) | accidental — collapse to one |
| team abbreviation | boxscore (catalog), pbp (extract), schedule | caches of three league documents, unchecked, agree in samples |
| committed `measures.json` | cache of the published one, checked by `measures_fresh.py` | keep — the static pages cannot fetch |
| committed fixtures | `data/rich-ot.json` and 8 fixtures are schema 1; two carry the **old game-end `sit`** the schema-3 fix replaced; their README says "copied byte-for-byte" | stale caches — re-copy, and guard the vintage |
| `unreconciled` → catalog `u` | cache — **but `u` means ANY disagreement and its readers say "shot count"**: 4 preseason games disagree only on faceoffs and carry the shot-count asterisk ✔ | bug |
| hero loop `hl` | Python in derive.py, JS in app.js (forced by the language split) | keep — tested against each other |
| inside an extract | `gshots` re-derivable from events, **read by nothing** (~3 KB a game); `goalies`, `s` read | delete `gshots` |
| `recent.json` | carries the newest night AND whatever the run re-derived; home reads only the newest night, preview reads it as "games since teams.json" | two jobs in one document; preview silently undercounts if `teams.json` lags more than a night |

---

## 3. Correctness — does each field mean what we say?

107 fields and policies reviewed. Witness for each: **12 hard** (a check that
refuses the game) · **13 note** (a disagreement published to the reader) ·
**24 test-only** · **15 one-off** · **43 none**.

A witness is something independent that could prove the field wrong: another
league document, a second derivation, the rulebook. A test whose expectation
comes from the same code is not one.

### Defects found

| # | what | evidence | reader impact |
|---|---|---|---|
| D1 | **The slot layer and every published slot figure use the 2-clause rule; the slot drawn on the ice uses 3** — the "not behind the goal line" clause Kevin added is in `isHighDanger` (rink.js:138) and not in `danger.reduce` (danger.js:158-162) ✔. The comment beside it says "nothing archive-wide moves", which is false: `danger.reduce` feeds measure.mjs. | 1.62% of slot attempts were behind the line when the clause was added; 43 of 1,211 (3.6%) in a 30-game 2025 sample | the Slot shots count includes marks outside the painted slot; published slot shares rest on a rule the ice does not show |
| D2 | power-play chances and goals are not the league's quantities (a 6-on-4 goal with the net pulled is not counted as a power-play goal; a 5-on-3 is one chance, the league says two), and the rail's own `powerPlay` was declined as a witness for a reason that no longer holds | 36 games vs the rail: chances 192 vs 199, goals 45 vs 46 | small, but our copy compares the rate to the league's |
| D3 | `app.js:216` fallback score counts shootout goals | 2025020207: 9 goal events, final 4-3 | none today (unreachable); wrong the day it is reached |
| D4 | the scrubber's goal ticks include shootout goals under "the coloured lines are goals" | same game: 9 ticks | wording question |
| D5 | penalty `zone` has no documented perspective (it is the offender's, 8/8) and no reader | — | a trap, the shape `own` once was |
| D6 | season totals carry event-log figures silently where a game's note says the league differs | Lankinen faced 132, league 131, from one noted game | disclosure gap |
| D7 | a boxscore note's "its event log says N" is the count after unwitnessed goaltenders are removed | extract.py box witness | wording |
| D8 | `test_extract_schema.py:52` describes `unreconciled` wrongly | — | documentation |
| — | the "7.8%" teammate-block figure (above) is typed in five places and published in teams.json; the counts give 8.36% | ✔ | a wrong number in published text |
| — | catalog `u` marks faceoff-only disagreements as shot disagreements | ✔ | 4 games carry a false asterisk |

### Unwitnessed, by what a reader would be told wrong

1. **Slot counts and shares** — unsourced by declaration (33/22 is our policy) and applied inconsistently (D1).
2. **Player goals, assists, shots on the preview** — every boxscore row carries them; not wired. 54/54 agree in a sample.
3. **Goaltender shots faced and saves** — the boxscore goalie rows are a witness, not wired. 62/63 agree.
4. **Power-play rate** (D2).
5. **`sit`, the situation code** — every strength badge and the even-strength filter rest on its digit order, witnessed by 8 penalties in one test game.
6. **Attempts** — the missed-shot component has no witness.
7. **Team records** — the league's standings are a witness, not wired. 32/32 agree.

The register in full, with file:line for each row, is reproducible from the
inventory method; it is summarised here rather than pasted.

---

## 4. Efficiency — what a reader downloads

Measured in a real browser, first visit, wire bytes.

| page | total | of which |
|---|---|---|
| home | **564 KB** | hero preview loads the whole game page (375 KB); catalog 75 KB; index 13 KB |
| game | 411 KB | the page itself 375 KB — **about 600 KB of its 784 KB of script is comments** ✔ |
| team (`?team=`) | 175 KB | catalog 75 KB (needs ~4 KB); measures and recent downloaded and not read |
| calendar | 121 KB | catalog 75 KB (needs <1 KB) |
| preview | 186 KB | catalog 75 KB for one row; teams 14 KB for ~1 KB |

1. **Comments in the built pages** are the largest cost on the site: the game page would be ~97 KB stripped (~63 KB minified), and the home page falls from 564 KB to ~286 KB with that alone, because the hero loads the game page. *(Estimated with esbuild; whether any test reads comments in built HTML is not yet checked.)*
2. **One document per page** instead of the whole catalog: home needs ~2 KB gzipped of everything it now fetches across five documents (~100 KB). With 1, home is ~140 KB.
3. **Nothing is cheaper on a second visit**: the home page fetches with `cache:'no-store'` and the HTML carries no validator, so a returning reader pays 540 KB again. The game page's data already revalidates to ~300 bytes.

### What the pipeline moves

| run | moves | note |
|---|---|---|
| every ingest | 4,704 pointers in, ~35 MB of league feeds fetched uncompressed (no `Accept-Encoding`) to hash and discard; catalog and index re-uploaded even when nothing changed | — |
| measure job | **pulls all 376 MB of extracts to re-measure 11 games** | runs whenever one game changes |
| weekly derive | 2.0 GB down, all 4,637 extracts re-uploaded | expected for a full re-derive |

---

## 5. Fields whose meaning depends on context

Fifteen, documented in code; the ones that have bitten or could:
`own` (a different team per event type), `actor` (the shooter on a blocked shot,
not the blocker), `x/y` (a blocked shot's position is the blocker's), `sit` (the
horn's code is replaced by the last play's), `per` 5 (shootout or third OT —
read `pt`), `min` (assessed, not served), measures `slot` (headline is GOALS,
sub-count is attempts), `through` (archive for teams, latest season for players),
`heldInWindow` (includes games derive later refuses), penalty `zone` (D5).

---

## 6. Proposed fix list — to discuss, in this order

**Progress** (each verified on the live site, not by a green run):
- ✅ 1 — `bd9d559` + re-measure `137f0c8`: the layer and every published slot
  figure use the three-clause slot. Slot attempts 46.7% → 45.6%, slot goals
  75.4% → 74.8%, conversion 11.4% → 11.6%; the live lesson shows them.
- ✅ 2 — `0aef016`: catalog `us` marks shot disputes only (78 `u`, 74 `us`,
  the four faceoff-only preseason games now unmarked on the live calendar);
  `teams.archive` and its wrong "7.8%" deleted (it had no reader).
- ✅ 3 — built pages ship without comments (script, CSS, HTML); the source
  keeps them. The game page is 238 KB decoded, down from 1,021 KB. Stripping
  them exposed two tests that had been passing on COMMENT text.

- ✅ 4 — `f7d0c2e` publishes `front.json`, `team/{AB}.json` (52) and
  `calendar/{YYYY-MM}.json` (32), each a verbatim projection of the catalog and
  index (`src/lib/page-docs.js`), written and uploaded with the catalog by both
  pipelines and re-checked byte for byte from the bucket. `0b047a7` + `f558ba7`
  switch the pages and drop `no-store`. Verified live 2026-10-13: no page
  fetches `catalog.json` or `index.json` (the game page only on its refusal
  error path); unchanged documents answer 304. Data per first visit, gzipped:
  home ~86 KB → ~12 KB (measures.json 9.5 KB of it), team view ~86 → ~6 KB,
  calendar 61 → ~2 KB, preview loses the 61 KB catalog. Both pipelines also
  fail if a refused game still has a published extract (read-only; deleting
  one is Kevin's call).

- ✅ 5 — `60e13b6` + full re-derive, verified live. Measured first (`league-witness.yml`, 4,281 games): goals, assists and
  saves agree with the boxscore on every game; skater shots and goalie shots
  faced are ours +1 on 73 and 60 player-games, all inside the 74 games already
  carrying the shot asterisk; power plays differed by DEFINITION. Kevin ruled
  (2026-10-13): count power plays the league's way, and keep counting from the
  play-by-play while showing the league's boxscore figure wherever it differs.
  Power plays now match the boxscore on 4,280 of 4,281 games and the rail's
  opportunities on 87 of 89 (592 = 592). SCHEMA 6 copies the league's player
  rows and the rail's power play into each extract; the comparing is the
  site's own JS (`src/lib/league.js`), shown on the preview's player rows, the
  methods page's power-play working and the game page's disputed-shot note.
  Team records (W-L-OTL) had no reader; Kevin asked for them on the preview, so
  they now open its team section, witnessed nightly by the league's standings
  (32 of 32 agree on 2026-10-12).

Ordered by what a reader is told wrong first, then bytes, then hygiene.

1. **D1 slot rule** — one rule for the ice, the layer and the published figures (decision: which rule — Kevin's three-clause rule is the one he asked for).
2. **Catalog `u` false asterisk** and **the 7.8% figure** (derive it from the two published counts).
3. **Comments out of the built pages** (largest byte saving; check first that nothing reads them).
4. **One document per page** in place of the whole catalog, and drop `no-store`.
5. **Wire the free witnesses**: boxscore rows for player goals/assists/shots and goaltender saves; standings for records; rail `powerPlay` (D2).
6. **Delete what has no reader**: `teams.archive`, `gshots`, the `app.js:216` fallback.
7. **Collapse the season-from-id copies**; add the index-vs-catalog and id-type-vs-schedule-type checks.
8. **Re-copy the stale fixtures** and guard their vintage.
9. **Pipeline**: measure incrementally rather than pulling 376 MB; send `Accept-Encoding` to the league; skip uploads when nothing changed.
10. Wording: D4, D7, D8; `recent.json`'s two jobs.
11. **Comments out of the source** (Kevin, 2026-10-12: *"don't think (excessive)
    narrative belongs in code comments"*). 71–81% of `src/` and `builders/` is
    comment. File by file, largest first: keep WHAT and a one-line why or trap;
    move narrative to the commit or `docs/` after checking it is there; fix
    `tools/quoted-figures.mjs`, which writes figures INTO `src/lib` comments.
12. **Reduced motion on the replay** — found while stripping comments: the
    game page has twelve animations and its reduced-motion rule stops only the
    play-button pulse. What reduced motion should do to the replay is a ruling.
