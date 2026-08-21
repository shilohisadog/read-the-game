# C1 — Discovery: a date path into the archive

**Status: audited and designed, nothing built.** This is the artifact for
CHENG's review. Written 2026-08-21. Every number below was read from the live
catalog or measured in a browser against production, not recalled.

---

## 1. ⚠️ The build list's premise for C1 is false, and it has to go first

`docs/status.md` says C1 is *"the largest structural gap on the site — three
paths reach a game and **4,553 cannot be asked for**."* Checked against the
shipped code, that is wrong.

`build_index.py` already ships a **team browse**: `?team=XXX&season=YYYY`, a
colour chip per club, season tabs, and each season's games newest-first with
opponent, score and shots on the row. Refused games are listed too, greyed, with
the check that stopped them.

| | |
|---|---|
| published | **4,417** |
| reachable today by team browse | **4,119 — 93.3%**, in three clicks (chip → season → row) |
| not reachable | **298** |

And the 298 are not an oversight. They are **preseason (287), all-star (3),
Olympics (6) and the 4 Nations Face-Off (2)**, excluded everywhere by
`inScope()`, and the front door says so in as many words: *"Preseason, the
Olympics and the 4 Nations Face-Off are in the archive and are deliberately left
out of every number here."*

> **So C1 is not "games cannot be reached". It is "there is only one way in."**
> That is a smaller claim and a truer one, and it changes what gets built.

This entry was inherited and never re-derived — the same failure mode as the
blocked-shot flip. See `verify-inherited-claims`.

## 2. What is genuinely missing

1. **A date path.** 665 in-scope nights, and no way to ask for any of them.
   *"What happened last night"* is the most ordinary question a fan has and the
   site cannot answer it.
2. **Any typed input.** No `<input>` exists on the site outside the rink
   controls. The understood query parameters are `at`, `ends`, `game`, `layer`,
   `preview`, `strength`, plus `team`/`season` on the front door.
3. **Filtered lists that carry their base rate.** The standing rule was written
   for a feature that does not exist yet.

**This document proposes only (1).** (2) is argued down in §7; (3) is a teaching
feature wearing discovery's clothes and belongs nearer C7.

## 3. Calendar or list? The data decides it, and it decides differently per surface

A calendar and a list are not two tastes. They are the right shapes for two
different densities, and both densities are measurable.

**A team's season as a calendar is a worse list:**

| | games | span | cells filled | max per cell |
|---|---|---|---|---|
| BUF 2024-25 | 78 | 196 days | 78 (**39.8%**) | **1** |
| COL 2025-26 | 92 | 232 days | 92 (**39.7%**) | **1** |
| VGK 2025-26 | 103 | 250 days | 103 (**41.2%**) | **1** |

**Max one game per cell, 60% of the grid empty.** The cell can carry one bit —
*did they play* — and to say more it needs text, in a **46 px** cell (measured:
390 px viewport, seven columns, real gaps). The existing list row already carries
opponent, result, score and shots. The calendar would cost more and say less.

**The league as a calendar is the opposite:**

```
4,119 games over 979 days -> 665 cells filled (67.9%)
games per night: median 5, max 16
```

The cell carries a **count**, which is what a small box is good at, and the
variation is itself information — a 15-game Saturday reads differently from a
1-game Tuesday.

### ⭐ Which dissolves the List/Calendar toggle

They are not alternatives. **They are two levels of one path**, and the site
already has this shape:

```
team chips  ->  that team's season, as a list  ->  the game
calendar    ->  that night's games, as a list  ->  the game
```

The list is **what is inside a cell**, not a competing view of it. So the reader
gets the list either way, one level down, and nobody has to choose a UI mode
before they get to hockey. A toggle would offer the team page a view the data
says is strictly worse — spending the reader's attention on a decision that has a
wrong answer. Same reasoning as **B2**, pointed at the objective function: a
novice on a phone.

## 4. ⭐ What does a cell COUNT? Doctrine 9 answers it

Refusals are not spread evenly, so this is not a rounding question:

- **69 of 667 in-scope nights (10.3%) contain at least one refused game.**
- **2 nights are refused ENTIRELY.**

A cell counting only what we can *show* would print `0` — or vanish — on two
nights when hockey was played and we hold the feed. That is precisely *"a
schedule that hid them would be a map of our successes"*, which the team browse
already refuses to be.

> **Proposed: the cell counts games we HOLD; the leaf list marks which cannot be
> shown and why**, exactly as the team page already does. The count is a fact
> about the archive, not a claim about our success rate.

## 5. ⭐ Does the calendar show the out-of-scope games? The sharpest question here

298 published games sit outside `inScope()` — and:

- they fall on **52 dates**, of which **50 have no in-scope game at all**;
- so those 50 dates are **invisible on every surface the site has**.

**The case for including them.** A calendar's claim is *"what we hold on this
date"* — a fact about the archive, not an average across competitions. Excluding
them makes an October 2023 preseason night read as *no hockey*, which is false,
and it keeps 298 games we hold permanently unreachable. Doctrine 9 again.

**The case against.** The front door promises they are *"left out of every number
here,"* and a cell count is a number. Mixing a preseason game into a count beside
a regular-season one is the first step of exactly the averaging that sentence
forbids.

**CC's lean: include, labelled, and never mixed into a rate.** The doctrine is
about *averaging across competitions*, not about listing what happened — and the
calendar computes no rate at all. But the wording of the front-door sentence
would need to follow, and **CC does not want to rewrite a disclosure to fit a
feature.** This is the question CC most wants ruled.

## 6. ⭐ Where it lives — and the real question is not "how much calendar"

Measured on the live home page:

| | 390 px (the phone) | 1100 px |
|---|---|---|
| whole page | **2,426 px — 2.9 screens** | 2,070 px |
| team chips block | top 895, **330 px tall** | top 1071, 152 px |
| a 7-column grid cell would be | **46 px** | 147 px |

A month grid is six rows plus a header — **roughly 320 px**, almost exactly the
height of the team chips. So the home page can physically hold it, at ~3.3
screens.

> **But the question is not space, it is that the chips and the calendar are BOTH
> INDEXES.** Two full indexes stacked on one page, each answering *"how do I find
> a game"* a different way, is the divided attention behind B2 — not a clutter
> problem, an *ordering* problem: the reader must now choose which index to use
> before using either.

Three shapes, and CC recommends the third:

1. **Both on the home page.** Physically fine, ~3.3 screens. Two indexes competing.
2. **Chips, plus a compact "recent nights" strip, plus a door to a full calendar.**
   Smaller, but the archive ends **14 June 2026** and the freshness line already
   says *"No games in the last 14 days"* — so a *recent* strip is a nearly empty
   object at the top of the page.
3. **⭐ The calendar is its own page, and the home page gains one door to it.**
   The home page's job is *"here is a game worth watching"* (the hero) and *"find
   your team"* (the chips). A date is a **browsing** want, not a first-visit want:
   a novice arriving for the first time has no date in mind. Walking back through
   **30 months** is the calendar's actual job and it needs a page to do it on.

Kevin's instinct was the home page, and (1) is genuinely affordable — this is a
recommendation against it on attention grounds, not space grounds, and CC holds
it loosely.

## 7. What is deliberately NOT proposed

**Search.** With 33 colour chips already on screen, typing a team name saves
nobody anything. Search earns its place only for matchups or scores, which is a
narrower want than "search" makes it sound, and it would be the first typed input
on the site. Not now.

**Anything server-side.** The catalog is already a static file the browser holds
— 4,553 rows, all of `d`, `h`, `a`, `hs`, `as`, `hsh`, `ash`, `t`, `v`, `r`. So
every one of these is `Array.filter`. **No index service, no query API, no
database.** Stating that up front is what stops anyone proposing infrastructure.

## 8. Shape of the build

**URL.** `?date=YYYY-MM-DD` for a night, `?month=YYYY-MM` for the grid — parsed
the way the front door already parses `team` and `season`
(`build_index.py:623`), a regex over `location.search`, not `src/lib/deeplink.js`
(which is the game page's vocabulary and has no business knowing about dates).

**Empty months are real.** 4 of the 34 months in the span have no hockey at all,
and three more have fewer than 20 games (`2024-06` 9, `2025-06` 6, `2026-06` 6).
A stepper that skips empty months hides the offseason, which is a true and
ordinary fact about hockey. **Proposed: step through them and show them empty.**

**The base-rate rule.** *Any filtered list shows its base rate* — written for
outcome-filtered lists like *"games where the outshot team won"*. **A date slice
selects on nothing and makes no claim**, so CC reads the rule as not applying,
and putting a rate under a night would invent a comparison the reader did not
ask for. Worth a ruling, because getting this wrong in the permissive direction
is the C7 defect.

## 9. What CC would like ruled

1. **§5** — does the calendar show the 298 out-of-scope games? Include-and-label,
   or keep `inScope()` and leave 50 dates invisible?
2. **§6** — own page, or the home page? CC recommends its own page on attention
   grounds and holds it loosely.
3. **§8** — does a date slice need a base rate? CC says no; the rule is about
   selection on an outcome.
4. Is the count-what-we-hold rule of **§4** right, or should a refused game be
   counted separately in the cell (`12 · 2 unshowable`) rather than silently?
