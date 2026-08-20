# The build list — 2026-08-20

Kevin: *"a comprehensive status of everything we have discussed over the last
couple of days… a sort of build list, just so we can identify what's what."*

**This file is the single source of truth for what is built, decided, or open.**
Every number was read from the live site or the repo on 2026-08-19, not recalled.
Anything unverified says so.

**Health right now:** 4,553 archived · **4,417 published** · 136 refused ·
**567 JS + 130 Python tests** · gates green 2026-08-20.

⚠️ **This line is still typed, and it was already wrong when you read it: it said
561 + 126 at `f9e852b` while the repo was at 130 Python tests and `0ecb636`.**
That is C9 making its own case within a day of being written. Until C9 lands,
re-derive these before quoting them.

State key: **DONE** shipped and verified live · **READY** specified, nothing
blocking · **DECIDE** waiting on Kevin · **HOLD** waiting on the novice test ·
**OPEN** a known gap with no plan yet.

---

## A. Shipped in the last three days

| id | item | commit |
|---|---|---|
| A1 | Extract carries `sides` — which end the host defended, per period | `c1d19bd` |
| A2 | Extract carries penalty detail — `pen` `min` `sev` `drew` `srv` `zone` | `c1d19bd` |
| A3 | `--additive` gate learned to see new top-level keys | `c1d19bd` |
| A4 | **Penalty box** — occupancy, static label, four release rules | `175a1cd` |
| A5 | `VGK · Blocked a shot` — the pronoun had no antecedent | `e5da68c` |
| A6 | **Ends disclosure** at each period boundary — owed since §6, never built | `3ae88c6` |
| A7 | Preview fix — the boxes had rendered *beside* the ice on the front page | `539b273` |
| A8 | Hero shows the box as base layer, laid out rather than hidden | `0384500` |
| A9 | **Bench-minor repair** — my check had refused 864 games | `c815236` |
| A10 | **Blocked-shot figure is the blocker**, not the shooter | `f9e852b` |
| A11 | **⭐ C10 — the game opens BEFORE the first play**; the resting frame is a state, not a play | see below |

---

## B. Decisions waiting on Kevin — nothing is being built

| id | decision | state | what it needs |
|---|---|---|---|
| **B1** | **Ends switching → AS-PLAYED** | **RULED, ready** | Everything is in place for the first time. `sides` is carried (A1), the disclosure exists (A6), and the cost is a render-time transform — no reducer, count or base rate moves. **Every earlier argument compared one-direction *without* its mitigation.** CHENG changed his ruling to match: *replay theater that transforms the geometry isn't replaying.* **Two conditions he holds:** (1) an invariance test — every reducer's output byte-identical across the toggle — and `SX` made *lexically* unreachable from library scope, not merely unused, because the modules share one inlined scope. **⭐ THE `SX` HALF IS DONE, AND THE AUDIT SHOWED THE PREMISE WAS HALF WRONG:** the modules share one SCRIPT, not one SCOPE — `build_main.py` inlines `__LIB__` *above* `function boot(G,RATES){` and `SX` is a `const` in boot's body, so a top-level function can never see it. The guard already existed; what was missing was the instrument. **Now two-sided:** a probe in library position must throw `ReferenceError`, and the same probe inside `boot` must return 100 — without the second half, "it threw" would be satisfied by a probe that was simply broken. Mutation-checked by hoisting `SX` to library scope, which is the realistic change someone would make; exactly one test fires. **⭐ AND THE FLIP IS BUILT** — `?ends=as-played` (default) / `?ends=fixed` (the
control), the mode read only by `AX`/`AY`, applied at draw time downstream of
every count. Seven arena-frame sites; `showWhy` untouched because its frame is
attack-relative. **Both tests exist and BOTH were proven able to fail:** remove
the flip and the rotation test reddens while invariance stays green; move the
flip into a reducer and invariance reddens while the rotation test stays green.
Verified in a browser on CAR @ VGK (`{1:right, 2:left, 3:right}`): 91 and 86
frames rotated in periods 1 and 3, 97 unchanged in period 2, **0 frames moved
anywhere but the exact 180°**. **⭐ AND THE COPY OF §13.1 IS BUILT** — the rule split from the event. The
standing key is **ungated** in as-played (*"the teams switch ends every period,
as they do in the arena"*, a `rule:`) and stays earned-at-period-two in the
control (*"ends are held fixed…"*, a `display:`). The boundary note is one
caption sentence in as-played — it captions something the reader just watched —
and both sentences in the control, where nothing on screen shows the change and
the sentence carries all the load. Both mutation-checked. **Still open:
`trails`.** (2) **keep one-direction as a control**, since the whole-game shot map is the frame every other analytics surface uses. Only `trails` needs scoping to the period. |
| **B2** | **Layers: the controls FOLLOW the layer** | **RULED, ready** | Do **not** move them wholesale — the learn page's nine doors land with a layer already on, and stripping the controls makes a door a one-way trip: *that is the feature breaking, not a side effect.* CHENG's resolution answers your attention complaint anyway: **when a layer is active its control lives with it; the base view carries none.** The progressive-legend principle applied to controls — name what is on, nothing else. |
| **B3** | **Whistle layer → default OFF** | **RULED, ready** | §6: the base view is just the game and every metric is opt-in — the whistle layer is a metric by that definition even though it counts nothing. 63 faceoffs is a wall, and the base view is the one surface that has stayed clean. Cheap to reverse, which argues for shipping the doctrinal default and letting the tester move it. |
| **B4** | **Per-event card → NO. Generalise the existing one** | **RULED, ready** | The governing rule already exists: **one narrator, many ledgers.** The rink narrates *now*; anything below it is retrospective and never a competing "now". A second narrator is the drift we just spent a week removing — median 29s behind, 78% of frames over 5s. **What is defensible:** a card showing the most recent event *of the active layer*, headed retrospectively, exactly as the whistle card is now. If the answer is "every event", the caption already does that and does not drift. |
| **B5** | **Missed shot → carry the `reason`** | **DONE (`a849f22`), labels pending** | Settled by your own framing: **the event is a shot that did not force a save** — the league's typeDescKey, not a category of ours — and `reason` is that same event at finer resolution. One phrase was covering **six** outcomes and is false for two: a post *hit* the net, and `short` never reached it. Field now carried. **Labels still blocked** on the archive-wide vocabulary — see C2. |
| **B6** | **Penalty box: add the interrupted countdown later?** | **HOLD** | You ruled static now, evolve if necessary. The teaching case is real: a power-play goal ends the penalty early. |
| **B7** | **Benches on the ice** | **HOLD** | You ruled no for now — "we'll measure that when the time comes." Not a data limit: `shifts` gives roster-minus-on-ice. |

---

## C. Ready to build — specified, nothing blocking

| id | item | why it is ready | size |
|---|---|---|---|
| **C1** | **⭐ Discovery — search, calendar, date browse** | **The largest structural gap on the site.** Three paths reach a game and **4,553 cannot be asked for**. Nothing else on this list matters as much. No design exists yet. **Settle this before designing:** the catalog is already a static file the browser downloads, so search, calendar and date browse are `Array.filter` — **no index service, no query API, no database.** That constraint is the design's biggest gift and stating it up front stops anyone proposing infrastructure. And the standing rule carries over: **any filtered list shows its base rate** — *"games where the outshot team won"* teaches the opposite of the truth unless *"347 of 4,417 — 26%"* sits beside it. | large |
| **C2** | **Missed-shot `reason`** → `Shot went wide` / `Hit the post` / `Shot went high` | The feed carries `reason` on **31 of 31**; **2 of 31 hit a post**. Identical ten-line extract change to A2, then a label change. Gated on B5. | small |
| **C3** | **On-the-ice / zone starts** | Fully specified in `docs/on-the-ice.md`, CHENG-reviewed. **The coordinate *is* the dot** — 12,864 of 12,864 faceoffs, no threshold to choose. Kaprizov 80% OZ → 48/20 vs Power 29% → 22/29. Never an adjusted number. **⭐ AND IT NOW OWNS THE PRE-GAME LINEUP (Kevin, 2026-08-20, looking at A11's empty ice): "doesn't our data tell us who is on the ice?"** It does, cleanly — **25 of 25 random games hold exactly 6 per team at s=0, 5 skaters and 1 goaltender each**, by name and position. It does **not** hold WHERE: no skater has a coordinate at 20:00, `losingPlayerId` is a dropped field so the centre opposite the draw-winner cannot be placed, and position codes do not identify who took it (BUF dressed two `C` on the opening shift of 2025021213). Rule 76 *constrains* the other eight — outside the circle, own side of the restraining line — but does not determine them, so drawing them is choosing inside a permitted region: a picture, not a record. **The cost is not one wrong drawing, it is that a novice cannot tell an illustrative figure from a recorded one, so the first invented figure makes every honest one unverifiable.** What is buildable is the NAMES — "on the ice at the drop", six a side — which is C3's reducer at *t*=0 and belongs in it. **There is no shifts reducer in `src/lib/` at all today**; building the lineup before C3 writes that reducer in the wrong place and rewrites it later. | medium |
| **C4** | **Merge-hazard mechanism** | Ruled in principle — record it, don't fail. Unbuilt. | small |
| **C5** | **OZ/DZ faceoff split** | Aggregate faceoff share is the site's cleanest null (**50.4%**); the zone split is where a real effect could hide. Newly answerable because of C3's finding. **Not measured — assert nothing until it is.** | small |
| **C6** | **Offside rule diagram** | Parked for the novice test. | small |
| **C7** | **⭐ Two rates on one screen** (was D4) | ⚠️ **RE-DERIVE BEFORE BUILDING — the figures below do not reproduce.** *3,250 / 55.5%* appears exactly once in the whole repo: in this cell. It is not in `measures.json` (whose three base rates are 4,029/54.5%, 3,957/45.8%, 3,855/39.6%), not in any builder, not on any page; the nearest `levelCurve` row is n=3,327 at 39.3%. **And "front-door" is the wrong surface:** `#rg.preview .verdict` is in the hide list, so the verdict card cannot render in the hero frame. Where two rates genuinely co-occur is the GAME page — `#rg.newcomer .newcomer` and `#rg.ended .verdict` are independent classes, so a first-time visitor who watches to the end sees both. The defect shape is probably still real; the citation is not. Original text follows. ~~The hero says *4,029 / 54.5%*, the verdict card *3,250 / 55.5%* — two figures that look like one claim, differing in both numerator and denominator, with nothing saying they measure different populations. *A reader who notices concludes we cannot count.* Identical shape to CONTROL-vs-shots-on-goal and to MIN 18–BUF 15 with no mode label, and the fix that worked twice works here: **the population is welded to the number, on the same line, not adjacent to it.**~~ | small |
| **C9** | **Regenerate the health line** | The reconciliation that caught A9. A typed number that can drift from the live site is the defect; make the top of this file a build artifact. | small |
| **C8** | **Missed-shot labels** | **UNBLOCKED — the archive vocabulary is measured.** **Ten values, not six.** Over 2,574 missed shots in 89 games: wide-left 38.3%, wide-right 35.0%, above-crossbar 5.6%, high-and-wide-right 5.4%, high-and-wide-left 5.0%, hit-left-post 2.7%, hit-right-post 2.6%, short 2.5%, **hit-crossbar 2.0%**, failed-bank-attempt 0.9%. **Iron is 7.3% and `short` another 2.5% — about one missed shot in ten is something "missed the net" describes falsely.** Kevin predicted `hit-crossbar` from its absence in a 31-event sample and the derive found it. `failed-bank-attempt` is **behind the net** — 23 of 24 at or past the goal line, median 3 ft past and 8 ft off centre, against 1.4% for every other miss — and it is **season-bounded**: zero in 2023 across 881 missed shots, then 9 and 15. *The league's vocabulary changes under us.* Rare values render raw rather than earning hand-written copy. Then: caption **describes** the moment — *Hit the post · Shot went wide · Over the crossbar · Shot came up short* — and the ledger **classifies**, keeping the universal clause *"no goalie faced it"*, which is true for all six values. One narrator, many ledgers, applied to a label. Known values get written labels; unknown ones render raw. | small |

---

## D. Known gaps and risks

| id | item | state |
|---|---|---|
| **D1** | **136 refusals — measured 2026-08-19, and the shape is now known** | **Three populations, not one mystery.** (a) **Olympics: 30 of 30, 100%** — documented and correct, 9 plays against a boxscore claiming 62 shots. (b) **Preseason: 33 of 320 = 10.3% against 1.7% in the regular season — exactly 6.0×.** A real population. (c) The remaining **106 are event-shaped, not date-shaped.** **The date-covering probe was run and it killed the clustering hypothesis, stratified by game type:** preseason refusals touch 24 dates where random scatter predicts 24 (20–27); regular season 64 against 63 (60–66); playoffs 5 against 5. *Consistent with scatter in every stratum.* So the next instrument is per-GAME, not per-date — all 106 fail `SOG reproduces boxscore`, and the question is what those individual games have in common. Preseason at 6× says the property is commoner where coverage is thinner. |
| **D3** | **Soft 404** — unknown URLs return 200 with the home page | Status-based link checks are useless; the build-time filesystem check is what protects, and it is canaried. |
| **D5** | **Rule 19 coincidental-penalty manpower** | **Deliberately not modelled.** A penalty queue predicts `sit` at only 98.9% over 39 games. The box reads occupancy; `sit` keeps strength. Written down so nobody "fixes" it into a model. |
| **D6** | Dropped feed fields — `shotType`, `zoneCode` outside penalties, `losingPlayerId`, `hitteePlayerId` | Deliberate. Raw feeds are archived, so nothing is lost. |
| **D7** | `homeTeamDefendingSide` alternation at archive scale | **Now covered** by a per-game `validate()` check (A1). Previously an open risk. |

---

## E. Held for the novice test

She reviews **on her phone** while you use a laptop. That is the objective
function for every below-the-rink trade, and it has already reversed one call.
**390×844 is an unverified proxy — her actual device is unknown.**

B1 ends default · B2 layers on the game page · B6 countdown · B7 benches ·
C6 offside diagram · and the below-rink layout generally, which is the
"visual gymnastics" complaint behind B2.

**E2 — the novice test must include the ONE-DIRECTION control, not only the
as-played default (CHENG, 2026-08-20).** The control's sentence carries all the
load, because nothing on screen shows the ends changing — and its weakness would
be invisible in a test that only ran the default. See `docs/ends-switching.md`
§13.3.

**E1 — names on the pre-game frame (Kevin, 2026-08-20).** Looking at A11's
empty ice: *"doesn't our data tell us who is on the ice?"* It does — 6 per team
at s=0, 25 of 25 games. **Figures are refused on doctrine** (see C3: no
coordinate exists, and the first invented figure makes every honest one
unverifiable). **The NAMES are a record and were still declined, for now**, on
three grounds: twelve surnames are unusable by a reader who knows none of them,
and they land on the one frame we just cleared of a premature sentence; the
starting six is a 35-second shift, so calling it "the lineup" implies a
permanence hockey does not have; and the value pays off DURING play, where a
name arrives attached to a mark — which is C3's continuous version, not this.
**It is on this list rather than C because it is the objective-function trap:**
a fan wants the starting units and can use them; the stated reader is a novice
on a phone who has heard of none of them. If she opens the page and asks *"who
are these guys?"*, that is a measurement and it gets built that afternoon.

---

## F. What this week cost — four defects reached production

None was caught by the suite. The through-line is one sentence.

1. **A7 — the penalty boxes rendered beside the ice on the front page.**
   `.rinkbox` is `display:flex` in preview. I measured `game.html` at two widths
   and never opened the hero. *The same component had two layout modes and I
   rendered one.* **Kevin found it.**
2. **A6 — the ends disclosure was 176px on a phone**, taller than the rink above
   it, on a page Kevin had just called overcrowded. Caught by measuring, before
   he saw it. Now 78px.
3. **A9 — 864 games refused by my own new check.** Verified 8-of-8 on the
   reference game and shipped across 4,553. **A bench minor has no committing
   player**, and the reference game contains none.
4. **A10 — the figure wore the shooter's sweater at the blocker's position.**
   Two individually-correct decisions that contradicted each other on screen.
   **Kevin found it.**

> **A check that passes on the sample cannot see the case the sample does not
> contain.** It applies identically to test fixtures, to layout modes, and to the
> reference game.

**A stated policy, not a habit:** Kevin found two of the four (A7, A10) and
**both were visual**. Neither is findable from code and the suite is structurally
blind to both. So — **any change that alters what is on screen gets LOOKED AT, at
both widths, before it is called done**, and A7's specific lesson rides with it:
*the same component had two layout modes and I rendered one.*

**And the document caught the fifth.** Reconciling a live 3,574 against a
remembered 4,417 found what a green pipeline did not. Which argues for one cheap
change: **the health line should be regenerated, not typed** — a number in this
file that disagrees with the live site is exactly the reconciliation that just
paid off, and automating it makes it pay off every time. Tracked as C9.

Two tests this week were wrong before they were right, and both said so out loud
rather than passing quietly: the blocked-figure test read the CSS class and never
the sweater colour (Kevin's exact symptom, green), and its count guard **failed
first** because the reference game blocks 22–22 — what separates blocker from
shooter is the *distributions*, 22–22 against 26–18.
