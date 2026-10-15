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

## 6. For Kevin to rule — in this order

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
