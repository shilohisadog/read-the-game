# The measures audit — 2026-10-15

**Status: AUDIT ONLY. Nothing below is fixed.** Part of the data-model review
(`docs/data-model-review.md`): that review covered the *documents* — where a fact
is stored, how many copies, what a reader downloads. This covers the *meanings* —
what each measure is, and whether every surface means the same thing by it.

Kevin, 2026-10-15: the layers (August), the preview's team rows (September–October)
and the game summary were *"chosen at different times by different rules"*; audit
them, and say whether the August layers are still the best *"since our
understanding of what data is available has evolved."*

How it was made: four read-only inventories (layers, preview, summary + methods +
front door, feed vs measures), each citing file:line; the live preview and live
summary for MTL at WSH (2026020106) read as rendered text; then every headline claim
re-checked by hand. **✔ = checked by hand. Unmarked = from an inventory, not
re-checked.** Counts are as of 2026-10-15; re-measure before quoting.

---

## 1. The finding in one paragraph

There is no list of measures. Each surface defines its own, in its own file, and
the same label covers different quantities: **"Zone starts" names three different
counts, "Goaltending" ranks a count of shots under a caption about saves, "the
score was level" has two definitions, and the typical shift is a mean on one surface
and a median on another.** None of these is a wrong number — each is computed
correctly from its own definition. The defect is that a reader moving between
surfaces cannot tell the definitions changed, and nothing in the code would notice
if they drifted further.

---

## 2. Where the same name means different things

| # | name a reader sees | surface A | surface B | |
|---|---|---|---|---|
| 1 | **Goaltending** | summary row ranks **shots the club's goaltenders faced** (`measure.mjs:283`, `archive.js:335`) | caption under it: *"How often a goaltender makes the save"*; the box shows saves *of* shots (a fraction) | ✔ live: "Goaltending — MTL 23 · WSH 30" is shots faced |
| 2 | **Zone starts** | summary row: **face-offs WON**, every zone (`measure.mjs:246`, `archive.js:337`, `zonestart.js:226`) | box: **offensive-zone** starts; door: attempts per face-off in one end (`printed.js:245`); game-level scale: **all** face-offs | ✔ |
| 3 | **Slot** | box: *"Of N attempts so far"*, N **including blocked shots**, which can never be slot shots (`app.js:4547`) | preview + methods: share of attempts **with a recorded spot** (blocked excluded); front door / `slot.html`: **how often a slot shot goes in** | ✔ box denominator |
| 4 | **while the score was level** | verdict, front door, `levelCurve`, newcomer pitch: `tiedControl` — even strength **incl. 4-on-4 and 3-on-3** (`tied.js`) | preview + methods row *"5-on-5 CF% while the score was level"*: strict **5-on-5** (`measure.mjs:143–150`); the methods page prints the first's evidence under the second's label (`methods.js:113`) | ✔ |
| 5 | **a typical shift** | color line: *"about 46 seconds"* = archive **median** (`color.js:55`) | preview row: *"league 48.2 s"* = this season's **mean** | ✔ both live |
| 6 | **Blocked** | summary scale: **all** blocks, teammate and unrecorded blockers included | box + preview per-club: blocks **credited to a club** (those two left out) | |
| 7 | **Stoppages** | scale: stoppage **and** delayed-penalty events | doors: penalties / offsides / icings per team per game, from penalty events and stoppage reasons | |
| 8 | **holds steady after N games** | club rows: first half vs second half, centred per season | player rows: alternate games, not centred (`archive.js:834–838`) | |

Also measured once and written twice: per-club slot and shots-faced (in
`measure.mjs` and again in `app.js`); "the team with more attempts lost"
(`archive.js::rateOf` and `daily.js::attemptsTally` — ✔ same rule in practice,
two implementations); `color.js:57` re-derives "1 in N" instead of reading the
published rate.

## 3. Published and read by nobody

`measures.json` carries `featured`, `reach` and `goalieNight` ✔ with no reader on
any page, and `census.faceoffZone`, `census.shooter`, `census.drawStrength`,
`census.state` read only by the derive log. `rule` and `scope` are label strings
no page reads. Stale comment: `build_index.py:5788–5792` says the slot row is not on
the card; it is (need 39 since the 10-13 re-measure).

---

## 4. Are the August layers still the best layers?

The six chips, in order, with when each arrived, how many games a **club's** figure
needs before it holds steady (`docs/what-settles.md` §2 — a club-season test, so a
proxy for a one-game layer), and what the evidence says:

| layer (added) | settles in | what we now know |
|---|---|---|
| Attempts / Control (08-07) | 24 | The core possession measure. Its level-score version is the **same measurement** (r = 0.95, `what-settles.md` §3). |
| Slot shots (08-07) | 38–39 | **Independent of possession** (\|r\| ≤ 0.12). The slot boundary 33 ft / 22 ft is **our policy, unsourced** (`rink.js:59–60`). |
| Blocked (08-15) | 33 | The attempts event read from the other side (r = −0.61 with level possession). |
| Goaltending (08-07) | **219** | The worst-settling measure in the archive; the summary row ranks shots faced, not saves (§2 #1). |
| Stoppages (08-11) | not ranked | A rule, not a team measure — it never names a team. Its value is teaching. |
| Zone starts (09-09) | 35 | Partly possession again (r = 0.78–0.82). The losing centre cannot be named: `extract.py` drops `losingPlayerId`. |

**What the feed carries that no layer uses, ranked by the same test:**

- **Shift length — 12 games, the best-settling measure we hold**, unrelated to
  possession (\|r\| ≤ 0.07) and not an arena effect. On the preview since 10-13; a
  rink layer was declined (`layer-ideas.md` §4.4: a shift has no location and no
  outcome). The color line now speaks it on the ice, which is a third option.
- **Who shoots — defencemen's share of attempts, 23 games**, nearly independent of
  possession. Ruled an honest layer (`layer-ideas.md` §9.3), its accumulator built,
  **no layer file**.
- **Hits, takeaways, giveaways** — settle, but follow the **home scorer**, not the
  club (`what-settles.md` §2a). Ruled out for that reason; that reason still holds.
- **Shot type** and **the losing face-off player** — in the feed, dropped by **our**
  extract (`extract.py:131–135`). The only candidates blocked by us, not by the
  league.
- The feed has **no zone entries or exits**, at any level.

**Net:** of six chips, two are one measurement (attempts; zone starts mostly the
same family), one does not settle (goaltending), one is a rule (stoppages). The two
best-settling, independent quantities we hold — shift length and who shoots —
have no layer.

---

## 5. Proposal: one list of measures

This is the "consistent data model" question. The fix for §2 is not seven patches;
it is **one registry** — a single module every surface reads — holding, per measure:

- `id` and **one** plain-English name;
- the definition, as the reducer and filter that compute it (strength, score state,
  slot rule, who is credited);
- unit, and the scopes it is published at (this game / season / archive);
- its base-rate source in `measures.json`, and whether the base rate is a mean, a
  median or the middle half;
- its league witness, if any;
- how many games it needs to hold steady, measured by **one** instrument;
- whether it is a **measurement** or a **policy** (the slot boundary).

Surfaces then **pick** from the list; a surface that wants a different quantity
needs a different entry with a different name. One test walks every rendered label
on every surface and requires it to resolve to exactly one entry — the same shape as
the one non-circular gate we already trust (read the built page and `methods()`
independently, require a number in common).

The pieces exist and are scattered: `CLUB_ROWS` (preview), `LENS` + `layer-rules`
(replay), `league-rows`, `printed.js`, `anchors.js::EXPLAINS`. The registry is
mostly a merge of those, plus the definitions that are today implicit.

---

## 6. Kevin's rulings — 2026-10-15

1. **The list of measures: yes, first.** Items 2–6 land on it, one at a time.
2. **"Level" means strict 5-on-5, everywhere.** ✅ built 2026-10-17 as a DELETION (Kevin: is this something that should
   exist at all?): measured first over 4,310 games — 4-on-4 is 1.1% of level-score attempts,
   the leader-won figure moves 2,440/4,039 → 2,435/4,036, 17 verdicts flip. One definition
   now (`tiedControl` at `1551`); measure.mjs's second calculation is gone.
3. **The whole-game panel** (*"Every count in the whole game"*, the six scaled rows
   that open at the horn): Goaltending ranks **save percentage**; Zone starts ranks
   **offensive-zone face-offs**; the slot box divides by attempts **with a recorded
   spot**. ("yes to both") ✅ built 2026-10-15.
7. **Per-player face-off win %** — *"a widely followed statistic … consider adding
   to a player's page."* Needs `losingPlayerId`, which `extract.py` drops today, so
   it is an extract change + re-derive; and there is no player page yet (the
   preview's player block is the only player surface).
   ⏳ 2026-10-18, in progress. **The data:** `losingPlayerId` is on 264,681 of 264,681
   archive face-offs (`tools/feed_fields.py`); kept as `lose` at SCHEMA 7 (`b833903`),
   archive re-derived. **Kevin ruled a separate FACE-OFFS chip** (the eighth), independent
   of Zone starts, which keeps its name: Zone starts is the team and where play begins,
   Face-offs is the player and who wins the draw. **Does it settle? Yes:** 461
   centre-seasons (3 completed regular seasons, ≥41 games, ≥5 draws a game; 221,980
   draws), chronological split-half r = 0.684 at ~37 games a half → **40 games** to
   r = 0.7 (alternate-game halves: 27). Centre-season spread p10 44.0%, median 50.3%,
   p90 56.8%. The lesson beside it: the team winning more draws wins 50.4% of games.
4. **Typical shift: the mean**, everywhere ("no preference but probably mean"). ✅ built 2026-10-17:
   archive mean 47.8 s (150,727,738 ÷ 3,154,714), shown as a division on the methods page;
   median, middle half and the under-a-minute share DELETED (Kevin: one figure per lesson).
5. ✅ built 2026-10-17 — the tied-score count was ALREADY a filter on Attempts (the Counting
   control), so nothing to fold; Goaltending kept after a "should it exist?" pass (it answers
   "how is the goalie doing tonight", with the league's witness); the Attempts layer label is
   "Attempts", not "Control (Corsi)"; **Who shoots** is the seventh chip (`layers/shooters.js`),
   its panel row the per-team share, its archive figure `census.shooter` (32.5%).
   **Layers, agreed:** level possession folds into Attempts as a filter;
   Goaltending stays on the rink but is not ranked as a club figure; add **Who
   shoots**. Shift length stays off the rink.
6. **Unread `measures.json` keys: delete** (or name a reader). ✅ built 2026-10-17: removed `featured`, `reach`, `goalieNight`,
   `rule`, `scope`, `census.faceoffZone`, `census.drawStrength`, `census.state` — the file is
   39.7 → 32.8 KB. `faceoffZone` and `state` are still TALLIED, unpublished: tests cross-check
   `endZone`, `pace` and power-play goals against them. (`census.shift` and `census.shooter`
   gained readers in rulings 4 and 5.)

---

## 6a. As proposed (kept for the record)

1. **Adopt the registry?** (Recommended: yes, before any other change here, so each
   fix below lands once.)
2. **"Level" — which definition, everywhere?** Strict 5-on-5, or even strength
   including 4-on-4 and 3-on-3. (Recommend strict 5-on-5: it is what the preview's
   label already says, and it is the usual meaning in public hockey statistics.)
3. **The three summary rows.** Goaltending: rank save fraction, or rename the row to
   "shots faced". Zone starts: rank offensive-zone starts to match the box. Slot box:
   divide by attempts with a recorded spot, as the published share does.
4. **Typical shift: mean or median?** One figure on every surface.
5. **The layers.** Fold level possession into Attempts as a filter (it already is a
   rung, not a chip); keep Goaltending as an event layer but stop ranking it as a
   club figure; add **Who shoots** as a layer. Shift length stays off the rink (the
   color line carries it).
6. **Delete the unread `measures.json` keys** (§3), or name a reader for each.

---

## 7. The list itself — what each entry holds, and every entry

### 7.1 The fields

| field | what it holds | example (slot share) |
|---|---|---|
| `id` | one key, used by every surface, the published data and the methods anchor | `slotShare` |
| `name` | the ONE plain-English name a reader sees | *shot attempts from the slot* |
| `says` | one sentence for a novice | *Of every 100 attempts from a spot the feed records, this many came from the slot.* |
| `counts` | the events and the filter, as the reducer that computes it | unblocked attempts with a location, inside the slot |
| `of` | the denominator, or `game` / `60 min` for a rate | attempts with a recorded location |
| `credit` | whose figure it is: shooter's club, blocker's club, the goaltender, no team | shooter's club |
| `unit` | count · share · per game · per 60 · seconds | share |
| `strength` | all · 5-on-5 · power play | all |
| `score` | any · level | any |
| `scopes` | where it is published: this game (live), club-season, archive | club-season, archive |
| `typical` | the reference a value is read against: league figure · mean · median · middle half | league figure (sum over sum) |
| `witness` | the league document that checks it, if any | none |
| `holds` | games before a club (or player) figure holds steady — computed nightly by ONE instrument, never typed | 39 |
| `policy` | any number that is our choice, with the word *ours* | slot = 33 ft × 22 ft, ours |
| `surfaces` | where a reader meets it | preview row, methods page, slot lesson |
| `doors` | its *How this is counted* anchor and its lesson | `#slotShare`, *What the slot is* |
| `family` | measures that are the same measurement (shown together, never as separate evidence) | — |

### 7.2 Every entry, as of today

Rulings 2 and 4 applied (level = strict 5-on-5; typical shift = mean). *holds* is
the club figure unless marked; ✗ = does not hold steady inside a season.

**Possession — one family** (r 0.61–0.95 with each other)

| id | name | counts / of | credit | holds | witness |
|---|---|---|---|---|---|
| `attempts` | shot attempts | goals + on goal + missed + blocked | shooter's club | 24 | — |
| `level5` | 5-on-5 share of attempts while the score was level | own / both sides', strict 5-on-5, score level | shooter's club | 35 | — |
| `sogShare` | share of the shots on goal | own / both sides' | shooter's club | 37 | boxscore (quoted) |
| `attemptsAgainst` | shot attempts against, per game | opponent's attempts / games | defending club | 33 | — |
| `blocks` | shot attempts blocked, per game | blocks credited to a club / games | blocker's club | 33 | boxscore player rows |
| `zoneStarts` | offensive-zone face-offs (layer + whole-game panel) | face-offs in the attacking end / all | winner's club | 35 | — |

**Independent of possession**

| id | name | counts / of | credit | holds | witness |
|---|---|---|---|---|---|
| `slotShare` | shot attempts from the slot | slot attempts / attempts with a location | shooter's club | 39 | — · **policy 33×22, ours** |
| `dmen` | shot attempts taken by defencemen (the *Who shoots* layer) | by a D / own attempts | shooter's club | 23 | — |
| `shiftLength` | average shift length (**mean**) | skater seconds / skater shifts | club | 12 | — |

**Goaltending**

| id | name | counts / of | credit | holds | witness |
|---|---|---|---|---|---|
| `shotsFaced` | shots the goaltenders faced | on goal + goals, goalie in net | goaltender | — | boxscore |
| `saveFraction` | how often a goaltender makes the save | saves / shots faced | goaltender | ✗ 219 | boxscore |

**League rows** — archive-wide, never counted for a team (✗)

| id | name | counts / of | witness |
|---|---|---|---|
| `penalties` | penalties a team takes | penalty events / (2 × games) | — |
| `powerPlays` | power plays a team gets | the league's way / (2 × games) | boxscore + rail |
| `ppGoalRate` | power plays that produce a goal | PP goals / power plays | boxscore + rail |
| `offside` | times a team is offside | stoppages, reason offside / (2 × games) | — |
| `icing` | times a team ices the puck | stoppages, reason icing / (2 × games) | — |
| `stoppages` | why play stopped (layer) | stoppages + delayed penalties, by reason | no team |
| `attemptMix` | where a shot attempt ends | reached the goalie / blocked / missed, of all attempts | — |
| `slotGoals` | how often a slot shot goes in, and the share of goals from the slot | goals / attempts, inside vs outside | — · policy 33×22 |
| `endZoneWorth` | what a face-off in one end is worth | attempts per face-off | — |
| `pace` | attempts in an hour, by situation and by score | attempts / 60 min | — |
| `hits` | hits a team lands | league row, follows the home scorer | rail |

**Game outcomes and base rates**

| id | name | counts / of | witness |
|---|---|---|---|
| `record` | W–L–OTL | regular-season games | standings (nightly) |
| `leaderLost` | the team with more attempts lost | games with an edge, score not tied | — |
| `levelLeaderLost` (`levelCurve`) | of games led by k or more at 5-on-5 level, how many were lost | per k | — |

**Players** (per game played, current season; typical = **median** skater)

| id | name | holds (player) | witness |
|---|---|---|---|
| `playerGoals` | goals per game | computed nightly | boxscore |
| `playerAssists` | assists per game | computed nightly | boxscore |
| `playerShots` | shots on goal per game | computed nightly | boxscore |
| `playerAttempts` | shot attempts per game | computed nightly | — |

⚠️ The player *holds* figures are typed in a comment at `preview.js:337` (6/10/24/33)
and the live page computes 5/9/24/28 — the comment is stale, the page is right; the
list carries no typed figure. The player rows use a different steadiness instrument
from the club rows (§2 #8); the list will name one.

**Added after Kevin's read, 2026-10-15** (proposed; each measured before it is shown)

| id | name | from | note |
|---|---|---|---|
| `shotsOnGoal` | shots on goal, per game | boxscore (quoted) | the count beside `sogShare` |
| `faceoffWins` | face-offs won, and the share of draws | play-by-play (every draw, winner, spot) | team share is a coin flip for the result (50.4%, n = 819); zone splits need 103–106 games |
| `goalieRecord` | a goaltender's W–L–OT | the league's decision on the boxscore (⚠️ not yet kept — check the field) | not computed today |
| `paceByScore` | attempts in an hour when trailing / tied / leading, 5-on-5 | `census.pace` | score effects: 63.5 / 59.1 / 53.2 an hour |
| `paceByTime` | attempts in an hour by period / minute of the game | not computed | new |

`record` stores wins, losses and overtime losses as three counts (`teams.json`
`record.reg.{w,l,otl}`, plus playoffs) — the list carries one entry with three parts.

### 7.3 What the list will NOT carry

Values. The list is definitions; the values stay in `measures.json`, `teams.json`,
`players.json` and the extracts, computed by the same reducers as today. One file of
meanings, many files of numbers.
