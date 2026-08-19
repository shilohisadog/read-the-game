# The build list — 2026-08-19

Kevin: *"a comprehensive status of everything we have discussed over the last
couple of days… a sort of build list, just so we can identify what's what."*

**This file is the single source of truth for what is built, decided, or open.**
Every number was read from the live site or the repo on 2026-08-19, not recalled.
Anything unverified says so.

**Health right now:** 4,553 archived · **4,417 published** · 136 refused ·
**561 JS + 126 Python tests** · gates and deploy green at `f9e852b`.

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

---

## B. Decisions waiting on Kevin — nothing is being built

| id | decision | state | what it needs |
|---|---|---|---|
| **B1** | **Ends switching: as-played, or hold the rink?** | **DECIDE** | Everything is in place for the first time. `sides` is carried (A1), the disclosure exists (A6), and the cost is a render-time transform — no reducer, count or base rate moves. **Every earlier argument compared one-direction *without* its mitigation.** Only `trails` needs scoping to the period. |
| **B2** | **Move the layers off the "watch the game" page?** | **DECIDE / HOLD** | Your attention argument. **Blocker:** the learn page's nine doors link *into* the game with a layer already on — strip the controls and a door becomes a one-way trip. Decide where the control lives once a layer is active. |
| **B3** | **Whistle layer default on?** | **DECIDE** | Surfaced days ago, never settled. Cheap either way. |
| **B4** | **A per-event card below the rink?** | **DECIDE** | You asked *"isn't that an event-by-event card and not just stoppages?"* — never answered. Today it only speaks on stoppages. |
| **B5** | **Missed-shot wording** | **DECIDE** | You proposed "Missed net with shot". I recommend carrying the dropped `reason` field instead — see C2 — because *both* your wording and mine are wrong for the 2-in-31 that **hit the post**. Needs your ruling on which. |
| **B6** | **Penalty box: add the interrupted countdown later?** | **HOLD** | You ruled static now, evolve if necessary. The teaching case is real: a power-play goal ends the penalty early. |
| **B7** | **Benches on the ice** | **HOLD** | You ruled no for now — "we'll measure that when the time comes." Not a data limit: `shifts` gives roster-minus-on-ice. |

---

## C. Ready to build — specified, nothing blocking

| id | item | why it is ready | size |
|---|---|---|---|
| **C1** | **⭐ Discovery — search, calendar, date browse** | **The largest structural gap on the site.** Three paths reach a game and **4,553 cannot be asked for**. Nothing else on this list matters as much. No design exists yet. | large |
| **C2** | **Missed-shot `reason`** → `Shot went wide` / `Hit the post` / `Shot went high` | The feed carries `reason` on **31 of 31**; **2 of 31 hit a post**. Identical ten-line extract change to A2, then a label change. Gated on B5. | small |
| **C3** | **On-the-ice / zone starts** | Fully specified in `docs/on-the-ice.md`, CHENG-reviewed. **The coordinate *is* the dot** — 12,864 of 12,864 faceoffs, no threshold to choose. Kaprizov 80% OZ → 48/20 vs Power 29% → 22/29. Never an adjusted number. | medium |
| **C4** | **Merge-hazard mechanism** | Ruled in principle — record it, don't fail. Unbuilt. | small |
| **C5** | **OZ/DZ faceoff split** | Aggregate faceoff share is the site's cleanest null (**50.4%**); the zone split is where a real effect could hide. Newly answerable because of C3's finding. **Not measured — assert nothing until it is.** | small |
| **C6** | **Offside rule diagram** | Parked for the novice test. | small |

---

## D. Known gaps and risks

| id | item | state |
|---|---|---|
| **D1** | **135 games refused on `SOG reproduces boxscore`** | **OPEN.** Pre-existing, unexplained, and distinct from A9. Two hypotheses already killed — both fitted to the failures and never tested against the successes. **Read `refusal-gap-32-games` before hypothesising again.** |
| **D2** | **Preseason fails at ~6× the regular-season rate** | **OPEN.** A population, not a coincidence. |
| **D3** | **Soft 404** — unknown URLs return 200 with the home page | Status-based link checks are useless; the build-time filesystem check is what protects, and it is canaried. |
| **D4** | **Two different game counts on one screen** | The hero says *4,029 games / 54.5%*, the verdict card *3,250 / 55.5%*. Both honest, different documents, visible together. Unresolved. |
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

Two tests this week were wrong before they were right, and both said so out loud
rather than passing quietly: the blocked-figure test read the CSS class and never
the sweater colour (Kevin's exact symptom, green), and its count guard **failed
first** because the reference game blocks 22–22 — what separates blocker from
shooter is the *distributions*, 22–22 against 26–18.
