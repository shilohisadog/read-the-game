---
name: refusal-gap-32-games
description: "SOLVED 2026-08-21 - never one population: 73 refused because the LEAGUE disagrees with itself, 63 are stub feeds. NARROWED 2026-08-20 — the 136 refusals are THREE populations, and the date-clustering hypothesis is DEAD (stratified null, consistent with scatter in every game type). Olympics 30/30, preseason exactly 6.0x, and 106 that are EVENT-shaped. The next instrument is per-GAME, not per-date."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-11T08:15:13.826Z
---

**Opened 2026-08-11. UPDATED the same day after the 2023-24 and 2024-25 backfills
landed** — the archive is now 4,553 games across three seasons and the gap scaled
with it: **136 refused, 135 of them the same `SOG reproduces boxscore` check.**

**THE NEW EVIDENCE, and it is the first structural clue we have:** the refusal
rate is not uniform. Olympics 30/30 (settled). **Preseason 33/320 = 10.3%.**
Regular season 68/3,936 = 1.7%. Playoffs 5/256 = 2.0%. Preseason fails at SIX
TIMES the regular-season rate, which makes it a population rather than a scatter —
plausibly thinner scorekeeping on games that do not count. That is a description,
not yet a hypothesis, and per the trap below it must be tested against the
preseason games that PASS before it becomes one.

In the scope that matters for any calculation (`gameType` 2 and 3) we publish
4,119 of 4,192 — **98.3%**.

Part of [[hockey-legibility-build]]. The live numbers are in
`https://data.readthegame.co/index.json` under `extracts` — trust that over this file.

## The gap

`derive` publishes **1,463 of 1,534** games (95.4%). Of the 71 refused:

- **39 are settled and permanently correct** — truncated feeds. 9–20 plays and 2–7
  shifts against a boxscore reporting a full game. 30 are the 2026 Winter Olympics
  (`gameType` 9, national teams, Milano) and 9 are ordinary games whose
  play-by-play simply is not there. These are not a problem awaiting a fix; the
  gate working is the end state.
- **32 are UNEXPLAINED.** All fail one check: `SOG reproduces boxscore`, our count
  high by exactly one on exactly one team-side.

The two populations are told apart by **direction and sidedness**, which is the
diagnostic that made any of this tractable: a truncated feed is low by 14–37 on
BOTH sides; the unexplained ones are high by exactly 1 on ONE side. Nothing falls
in between.

## Ruled out, with evidence — do not re-run these

- **Own goals** — 0 across all 41 non-Olympic refusals.
- **Shooterless / awarded goals** — 0.
- **Penalty shots** — 0 of 41 carry a regulation one-shooter-one-goalie code.
- **Shootouts** — only 3 of 41 reached one.
- **Empty-net goals excluded from SOG** — REFUTED. The Cup final (`2025030416`)
  contains one, counts it, and reconciles at 23–22. **56 of 160 sampled published
  games (35%) contain an empty-net goal and every one reconciles WITH it counted.**
  The rule would have broken ~500 games to explain 9.
- **The play-by-play's own running SOG counter as a third witness** — NOT RELIABLE.
  It agrees with our count in the 20 failures it was meant to explain, but
  disagrees with the boxscore in **6 of 90 published games** — the same ~7% rate as
  the disagreement it was supposed to diagnose. Probably my method (I read the last
  event *carrying* a counter, which may be a stale snapshot rather than the final
  tally), not the feed.

## THE TRAP, and it caught me twice in twenty minutes

**Both dead hypotheses were fitted to the failures and never tested against the
successes.** A rule derived from data with no counterexample in it reads as
confirmation and is actually silence. The second one happened one message after I
had finished describing the first one in exactly those words.

So: **before any hypothesis about the 32 goes near the gate, test it against the
1,463 games that pass.** If it would break a passing game, it is wrong, and that
test is cheap — the Cup final alone killed the first one.

Same shape as the shifts cross-check agreeing only 82% (spread evenly across 23 of
25 games → the measurement, not the feed) and as every allowlist in
[[mechanize-the-review]]. **A rule calibrated on a sample cannot be validated by
that sample** — CHENG's phrasing, and the best one-line statement of it we have.

## Position, deliberately held

**Do not widen the gate.** 95.4% published with a stated reason beats 100% with a
check nobody trusts. The 32 stay refused and named in the ledger (`refusedGames`,
`blocking`, `failedChecks`) so the work is actionable from the published artifact
rather than from a CI log.

The honest next step is NOT another hypothesis. It is checking whether the
measurement is broken: **is the last counter-carrying event actually the game's
last shot?** That is a question about our method, which is the pattern behind both
failures.


# ⭐ MEASURED 2026-08-20 — THE SHAPE IS NOW KNOWN, AND IT IS NOT DATES

CHENG proposed the date-covering probe — *"one probe per date across all 715
dates, exactly the instrument that found the 2023 preseason outage immediately"* —
on the theory that 135 refusals beside a 6× preseason rate is a clustered-
phenomenon signature.

**The probe ran and killed the hypothesis.** It was run from the PUBLIC CATALOG,
not the raw feeds: the catalog already carries a date and a refusal gate for all
4,553 games, so it is date-covering by construction and costs one fetch.

## Three populations, not one mystery

| population | count | rate |
|---|---|---|
| **Olympics** (gameType 9) | 30 of 30 | **100%** — documented and correct: 9 plays against a boxscore claiming 62 shots |
| **Preseason** (gameType 1) | 33 of 320 | **10.3%** against 1.7% regular season = **exactly 6.0×** |
| **Everything else** | 106 | **event-shaped** |

## ⭐ The clustering test, stratified, with a control

Against a random-scatter null drawn from the same games, per game type:

| stratum | refusals | dates touched | random predicts | verdict |
|---|---|---|---|---|
| preseason | 33 | 24 | 24 (20–27) | **consistent with scatter** |
| regular season | 68 | 64 | 63 (60–66) | **consistent with scatter** |
| playoffs | 5 | 5 | 5 (4–5) | **consistent with scatter** |

**Consistent with scatter in every stratum.** A type-blind null was run first and
was also negative, but preseason games concentrate on September dates and have a
6× refusal rate, so a type-blind test could manufacture apparent clustering. The
stratified version is the honest one.

## What this changes

- **The date/season hypothesis is dead**, tested against a control rather than
  fitted to the failures — which is the discipline the two earlier hypotheses
  lacked (see above).
- **D2's preseason effect is a RATE population, not a date cluster.** Merging D1
  and D2 into one investigation was right; the merge splits them differently than
  expected.
- **The next instrument is per-GAME.** All 106 fail `SOG reproduces boxscore` —
  the extract counts one more or one fewer shot on goal than the league does — so
  the question is what those individual games share. 6× in preseason says the
  property is commoner where coverage is thinner.

Tracked as **D1** in `docs/status.md`, the build list.


# SOLVED - 2026-08-21. One symptom, two unrelated causes.

All 136 failed `SOG reproduces boxscore`, which is why it read as one mystery.

**73 were refused WRONGLY** - 68 regular season, 5 playoff, including **both 2024
conference finals** (FLA@NYR 22 May, DAL@EDM 27 May). Median **317 plays**
against 331 for a published control. The witness is the league's **own running
shot counter**, carried on every shot-on-goal play and previously dropped:

```
our shot events == the league's running counter   73/73     control 25/25
our total       == the play-by-play's own total   73/73     control 25/25
our total       == the BOXSCORE                    0/73     control 25/25
play-by-play total == the BOXSCORE                 0/73     control 25/25
```

**We reproduce the NHL's event log exactly and the NHL's boxscore disagrees with
the NHL's event log by one shot.** The event log is the document a replay *is*.

**63 were refused CORRECTLY** - preseason 33/33 and gameType 9 30/30 carry goals
and **no shot events at all**, a median of 12-15 plays against a boxscore
claiming forty shots. A summary wearing a play-by-play's name.

**The fix, with no chosen threshold.** Refuse when our count disagrees with the
league's own counter (*ours* to fix); refuse when the boxscore disagrees **and**
the event log holds no shots (nothing to replay); **record** the rest. Stated as
presence, never magnitude - and *not* simply "no shot events", because a game
where every shot on goal went in has none and is perfectly consistent.

Published games carry `unreconciled` on the artifact, `u` on the catalog row so a
LIST can mark it without opening an extract, and a count in the ledger. **The
disclosure is ONE standing sentence**, not a patch at each site: the shot count
reaches a reader in more than one place. 37px on a phone, after the first wording
came in at 75px - the ends disclosure made that same mistake at 176px.

**Archive: 4,417 -> 4,490 published, 136 -> 63 refused.** Base rates moved <=0.2pp
(attempts leader lost 54.5% of 4,029 -> **54.3% of 4,100**). WARNING: **do not
quote these from memory** - `docs/status.md`'s health block is generated now; run
`node builders/health.mjs`.
