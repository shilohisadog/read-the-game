# Where we actually are — 2026-08-19

Kevin: *"We've been kinda hopping around these past few days and I think we need
to come up with a complete, no kidding itemized document of what our current
status is."*

Every number here was read from the live site or the repo on 2026-08-19, not
recalled. Anything I could not verify says so.

---

## 0. In flight right now

| # | item | state |
|---|---|---|
| 0.1 | **`derive.yml` re-running to restore 843 games** | **dispatched, running** |

**This is a live defect I caused and it is the only thing degrading the site.**
The `penalties credited to the offending team` check I added on 2026-08-18
refused **864 games** — a bench minor (too many men) has no
`committedByPlayerId`, so `team_of.get(None)` never matched a team id. The fix is
committed (`c815236`); the derive run is what puts the games back.

Until it finishes: **3,574 of 4,553 published** instead of ~4,417.

---

## 1. What is live and working

| # | item | evidence |
|---|---|---|
| 1.1 | Site at **readthegame.co**, data at **data.readthegame.co** | verified on the wire |
| 1.2 | **4,553 games archived**, three seasons (2023, 2024, 2025) | `catalog.json` |
| 1.3 | **559 JS + 126 Python tests**, gates + deploy green | `npm run gates` |
| 1.4 | Front door states the thesis, with the archive's own number | live |
| 1.5 | Six layers: Control, slot, goaltending, blocked, whistle, tied | live |
| 1.6 | Learn page = **nine generated doors** into real moments | live |
| 1.7 | `teams.json` — per-team per-season records, goalies, baselines | live |
| 1.8 | Deep-link seam `?game=&at=&layer=&strength=` | live |
| 1.9 | **Penalty box** — occupancy, static label, on the game page and the hero | shipped this week |
| 1.10 | **Ends disclosure** at each period boundary | shipped this week |

---

## 2. Open decisions — yours, nothing is being built

| # | decision | state |
|---|---|---|
| 2.1 | **Ends switching: as-played or one-direction?** | **the big one.** Data now carried (`sides` per period). The disclosure sentence is built, so for the first time the comparison is fair — every earlier argument weighed one-direction *without* its mitigation. Cost is a render-time transform; no reducer, count or base rate moves. |
| 2.2 | **Layers off the "watch the game" page?** | Your 2026-08-18 proposal. Noted, not started. **Blocker to resolve first:** the learn page's nine doors link *into* the game with a layer already on — remove the controls and the door becomes a one-way trip. |
| 2.3 | **Benches on the ice?** | You ruled *no, for now* — "we'll measure that when the time comes." Not a data limit: `shifts` gives roster-minus-on-ice. |
| 2.4 | **Should the whistle layer default on?** | Surfaced, never settled. |
| 2.5 | **A per-event card below the rink?** | You asked *"isn't that an event-by-event card and not just stoppages?"* — never answered. |
| 2.6 | **Penalty box: add the interrupted countdown later?** | You said static now, evolve if necessary. The teaching case exists (a power-play goal ends the penalty early). |

---

## 3. Build backlog — agreed or obvious, not started

| # | item | why it is ready |
|---|---|---|
| 3.1 | **⭐ Discovery: no search, no calendar, no date browse** | **the largest structural gap on the site.** Three paths reach a game; 4,553 cannot be asked for. Nothing else on this list matters as much. |
| 3.2 | **Missed-shot `reason`** → `Shot went wide` / `Hit the post` / `Shot went high` | You raised the wording. The feed carries `reason` on **31 of 31**, and **2 of 31 hit a post** — so "missed the net" is wrong for them. Same ten-line extract change as the penalty detail. |
| 3.3 | **On-the-ice / zone starts** | Fully specified in `docs/on-the-ice.md`, CHENG-reviewed. The coordinate *is* the dot — 12,864 of 12,864 faceoffs. Kaprizov 80% OZ → 48/20 vs Power 29% → 22/29. |
| 3.4 | **Merge-hazard mechanism** | Ruled in principle (record it, don't fail); unbuilt. |
| 3.5 | **OZ/DZ faceoff split** | Newly answerable. Aggregate faceoff share is a null (50.4%); the zone split is where a real effect could hide. Cheap. Not measured — do not assert anything until it is. |
| 3.6 | **Offside rule diagram** | Parked for the novice test. |

---

## 4. Known gaps and risks

| # | item | state |
|---|---|---|
| 4.1 | **~135 games refused on `SOG reproduces boxscore`** | pre-existing and unexplained, distinct from 0.1. Two hypotheses already killed — both were fitted to the failures and never tested against the successes. **Read `refusal-gap-32-games` before hypothesising again.** |
| 4.2 | **Preseason fails at ~6× the regular-season rate** | a population, not a coincidence. Unexplained. |
| 4.3 | **Soft 404** — unknown URLs return 200 with the home page | status-based link checks are useless; the build-time filesystem check is what protects. |
| 4.4 | **Two different game counts on one screen** | the hero says *4,029 games / 54.5%*, the verdict card says *3,250 / 55.5%*. Both honest, different documents, and a reader can see them together. Unresolved. |
| 4.5 | **Coincidental-penalty manpower (Rule 19)** | a penalty queue predicts `sit` at only 98.9% over 39 games. **Deliberately not modelled** — the box reads occupancy, `sit` keeps strength. Documented so nobody "fixes" it into a model. |
| 4.6 | **The extract carries no `shotType`, no `zoneCode` outside penalties** | dropped on purpose, recoverable — raw feeds are archived. |

---

## 5. Held for the novice test

She reviews **on her phone** while you use a laptop. That is the objective
function for every below-the-rink trade, and it has already changed one call.
**390×844 is an unverified proxy — her actual device is unknown.**

- 2.1 ends switching default
- 2.2 layers on the game page
- 2.3 benches
- 3.6 the offside diagram
- below-rink layout generally, and the "visual gymnastics" complaint behind 2.2

---

## 6. Shipped in the last three days

| commit | what |
|---|---|
| `c1d19bd` | extract carries `sides` per period + full penalty detail |
| `175a1cd` | the penalty box: occupancy, four release rules, 16 tests |
| `e5da68c` | `VGK · Blocked a shot` — "it" had no antecedent |
| `3ae88c6` | the ends disclosure, owed since §6 and never built |
| `539b273` | preview fix — the boxes had rendered *beside* the ice on the front page |
| `0384500` | the hero shows the box as base layer, laid out rather than hidden |
| `c815236` | **the bench-minor repair** — see 0.1 |

---

## 7. What this week actually cost, honestly

Three defects reached production, and none was caught by 559 tests:

1. **The penalty boxes rendered beside the ice on the front page.** `.rinkbox` is
   `display:flex` in preview; I measured `game.html` at two widths and never
   opened the hero. **The same component had two layout modes and I rendered
   one.** You found it.
2. **The ends disclosure was 176px on a phone** — taller than the rink above it,
   on a page you had just called overcrowded. Caught by measuring, before you saw
   it.
3. **864 games refused by my own new check**, verified 8-of-8 on one game and
   shipped across 4,553. The reference game has no bench minor.

The through-line is one sentence: **a check that passes on the sample cannot see
the case the sample does not contain.** It applies to test fixtures, to layout
modes, and to the reference game equally.
