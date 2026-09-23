# What settles, and what does not — the full measurement

**Read this before adding a row to the preview card, and before answering a
critic.** It is the evidence behind the club/league split, the arguments against
it, and which of those arguments are correct.

Measured 2026-09-23 over **4,192 games · 3,936 regular-season · 96 club-seasons ·
2023-24, 2024-25, 2025-26**. `half = 41`, `TARGET = 0.7`, `ADMISSION = 41`.
Every hockey rule imported from `src/lib`, never restated.

---

## 1. ⛔⛔⛔ The instrument was wrong until today, and the repo said so

`src/lib/reliability.js` pooled three seasons **without centring them**, while
§11.2 of `preview-and-corsi.md` specifies *"each season centred before pooling so
a league-wide shift is not read as a club trait."* Pool seasons whose league
levels differ and the correlation is partly measuring which season a point came
from.

**The gap was visible in our own documents for weeks.** The doc records the slot
row at 37 games; the code computed 42. `dmen` (23) and `level5` (35) matched
exactly — because their league level barely moves between seasons. Two agree, one
disagrees, and the one that disagrees is the one that drifts.

The league levels that moved, straight from the event stream, 1,312 games each:

| | 2023-24 | 2024-25 | 2025-26 |
|---|---|---|---|
| missed / attempt | 0.2215 | 0.2433 | **0.2547** (+15.0%) |
| giveaways per game | 15.42 | 30.00 | **30.77** (+94.6% in one off-season) |
| takeaways per game | 14.01 | 9.63 | 9.22 (−34.2%) |
| hits per game | 45.46 | 42.91 | 40.90 (−10.0%) |

Nobody thinks clubs doubled their turnovers in one summer. That is a recording
change, and an uncentred instrument reads it as club character.

**What it cost.** `missed` shipped as a club row on r = 0.748 / 33 games and was
pulled the same afternoon: centred it needs **113**. `slot` was dropped at 42 and
is restored at **38**. Fixed, with a test whose fixture makes the two answers
differ in SIGN — uncentred r = +0.95, centred negative.

---

## 2. Every candidate measured, ranked by centred games-to-settle

⭐ **The admission line is 41.** Above it the club-to-club differences over a
season are mostly luck, and presenting one as a trait would teach a novice that
luck is character.

⚠️ **`both-sides`** is the venue instrument described in §4: inside one
building-season, how strongly the home club's figure co-moves with its visitors'.
High means an off-ice human is judging it. A share of both clubs' totals is
−1.000 by construction and says nothing.

| measure | numerator / denominator | centred | pooled | r | club range | both-sides |
|---|---|---|---|---|---|---|
| `avgShiftLen` | seconds of skater ice time / skater shifts | **12** | 12 | 0.892 | 43.23 – 53.80 | 0.531 |
| `shiftsPerGame` | skater shifts / club-games whose extract carries a shift block | **14** | 15 | 0.873 | 333.61 – 412.15 | 0.513 |
| `attemptDiffPerGame` | the club’s attempts minus the opponent’s / club-games | **22** | 22 | 0.814 | -17.76 – 22.22 | -1.000 |
| `dmen` | — / — | **23** | 23 | 0.806 | 24.9% – 38.9% | -0.012 |
| `corsi5v5` | the club’s attempts at 1551 / both clubs’ attempts at 1551 | **24** | 24 | 0.806 | 43.7% – 59.8% | -1.000 |
| `attemptsForPerGame` | the club’s attempts / club-games | **24** | 23 | 0.806 | 49.30 – 70.99 | -0.489 |
| `fenwickShare` | the club’s unblocked attempts (on goal + missed + goals) / both clubs’ unblocked attempts | **28** | 28 | 0.776 | 42.3% – 58.5% | -1.000 |
| `dmen5v5` | attempts at 1551 by a rostered D / the club’s attempts at 1551 | **28** | 27 | 0.775 | 27.2% – 41.6% | -0.013 |
| `hitsAgainstPerGame` | the opponent’s hits / club-games | **29** | 31 | 0.772 | 16.94 – 30.80 | 0.449 |
| `fenwick5v5` | the club’s unblocked attempts at 1551 / both clubs’ unblocked attempts at 1551 | **30** | 30 | 0.766 | 43.3% – 58.9% | -1.000 |
| `attemptsAgainstPerGame` | the opponent’s attempts / club-games | **33** | 32 | 0.745 | 48.20 – 71.05 | -0.489 |
| `blocksPerGame` | blocks credited by blocked.js / club-games | **33** | 30 | 0.749 | 11.32 – 18.93 | -0.139 |
| `level5` | — / — | **35** | 35 | 0.735 | 42.8% – 61.7% | -1.000 |
| `ozStartShare` | draws taken in the club’s offensive zone (won or lost) / draws taken in the club’s offensive OR defensive zone | **35** | 35 | 0.738 | 43.4% – 58.5% | -1.000 |
| `sogShare` | the club’s shots on goal, quoted from the boxscore / both clubs’ shots on goal, quoted | **37** | 37 | 0.721 | 41.8% – 57.3% | -1.000 |
| `sogShareEvents` | shot-on-goal + goal events credited to the club / both clubs’ same | **37** | 37 | 0.722 | 41.8% – 57.3% | -1.000 |
| `slot` | — / — | **38** | 42 | 0.720 | 41.3% – 54.6% | 0.155 |
| `ozStartShare5v5` | draws at 1551 in the club’s offensive zone / draws at 1551 in its offensive or defensive zone | **40** | 40 | 0.707 | 43.4% – 59.9% | -1.000 |
| `sog5v5` | shot-on-goal + goal events at 1551 / both clubs’ same at 1551 | **42** | 42 | 0.696 | 42.9% – 57.7% | -1.000 |
| `takeawaysPerGame` | takeaway events / club-games | **42** | 14 | 0.700 | 4.02 – 8.85 | 0.824 |
| `unblockedAgainstPerGame` | the opponent’s unblocked attempts / club-games | **45** | 45 | 0.683 | 35.99 – 51.11 | -0.500 |
| `hitsPerGame` | hits by the census rule / club-games | **47** | 49 | 0.674 | 15.13 – 29.83 | 0.449 |
| `fenwick5v5Level` | the club’s unblocked attempts at 1551 with the score level / both clubs’ same | **48** | 49 | 0.666 | 42.8% – 60.4% | -1.000 |
| `ozStartOfAll` | draws in the club’s offensive zone / every placed draw in the game | **51** | 51 | 0.655 | 31.1% – 39.9% | -0.837 |
| `slot5v5` | attempts at 1551 inside the slot / located unblocked attempts at 1551 | **52** | 61 | 0.650 | 39.5% – 51.5% | 0.176 |
| `goalDiffPerGame` | goals for minus goals against / club-games | **52** | 52 | 0.651 | -1.83 – 120.7% | -1.000 |
| `slotAgainst` | the opponent’s located attempts inside the slot / the opponent’s located attempts | **53** | 56 | 0.647 | 40.8% – 53.8% | 0.155 |
| `sogAgainstPerGame` | the opponent’s shots on goal, quoted / club-games | **53** | 39 | 0.645 | 23.93 – 35.13 | -0.166 |
| `shotDistance` | summed feet / located unblocked attempts | **55** | 52 | 0.638 | 32.99 – 38.37 | 0.257 |
| `pointsPct` | standings points (2 win / 1 OT-SO loss / 0) / 2 per club-game | **55** | 55 | 0.637 | 28.7% – 73.8% | -0.955 |
| `puckWinShare` | the club’s takeaways / its takeaways + its giveaways | **57** | 4 | 0.628 | 20.7% – 62.0% | 0.959 |
| `dmenAgainst` | the opponent’s attempts taken by a D / the opponent’s attempts | **67** | 54 | 0.591 | 28.3% – 36.8% | -0.012 |
| `goalsForPerGame` | the club’s goals, quoted / club-games | **67** | 67 | 0.591 | 2.18 – 3.71 | -0.388 |
| `goalsForShare5v5` | the club’s goals at 1551 / both clubs’ goals at 1551 | **74** | 74 | 0.566 | 34.5% – 62.8% | -1.000 |
| `giveawaysPerGame` | giveaway events / club-games | **75** | 5 | 0.561 | 5.12 – 17.24 | 0.941 |
| `drawsPerGame` | placed draws in the game / club-games | **77** | 75 | 0.556 | 53.16 – 61.21 | 1.000 |
| `goalsAgainstPerGame` | the opponent’s goals, quoted / club-games | **91** | 94 | 0.513 | 2.33 – 4.04 | -0.388 |
| `giveawayShare` | the club’s giveaways / both clubs’ giveaways | **96** | 96 | 0.502 | 42.1% – 55.0% | -1.000 |
| `shotDistanceAgainst` | summed feet, opponent / the opponent’s located unblocked attempts | **96** | 80 | 0.501 | 33.66 – 38.08 | 0.257 |
| `takeawayShare` | the club’s takeaways / both clubs’ takeaways | **102** | 102 | 0.485 | 43.9% – 57.0% | -1.000 |
| `nzFaceoffWin` | neutral-zone draws won / every placed neutral-zone draw | **103** | 103 | 0.482 | 43.8% – 56.2% | -1.000 |
| `dzFaceoffWin` | defensive-zone draws won / every placed draw in that end | **106** | 107 | 0.475 | 44.0% – 57.3% | -0.548 |
| `missed` | — / — | **113** | 33 | 0.460 | 20.1% – 26.9% | 0.732 |
| `ppAttemptShare` | attempts taken on the power play / all the club’s attempts | **122** | 79 | 0.441 | 10.2% – 19.7% | 0.383 |
| `shootPct5v5` | the club’s 1551 goals / the club’s 1551 shots on goal | **177** | 142 | 0.351 | 7.0% – 11.3% | -0.038 |
| `penaltyDiffShare` | penalties the opponent took / penalties either club took | **195** | 197 | 0.329 | 43.8% – 55.5% | -1.000 |
| `savePct5v5` | the opponent’s 1551 shots on goal that were NOT goals / the opponent’s 1551 shots on goal | **219** | 175 | 0.305 | 89.0% – 93.7% | -0.038 |


*(`sogShareEvents`, the event-stream rebuild of SF%, differs from the league's
quoted shot line by **74 shots in 241,126** — 0.03%. A clean independent check on
the boxscore.)*

---

## 3. ⛔ Most of what qualifies is ONE measurement wearing different hats

Pearson between full-season club figures, n = 96:

```
                   level5 corsi5 fenwic fenw5v sogSha attFor attDif ozStrt  dmen  slot missed avgShf
level5               1.00  0.95   0.90   0.92   0.85   0.84   0.92   0.72   0.37  0.02  0.09  -0.06
corsi5v5             0.95  1.00   0.96   0.97   0.91   0.89   0.98   0.78   0.33  0.01  0.09  -0.15
fenwickShare         0.90  0.96   1.00   0.98   0.97   0.88   0.98   0.82   0.31  0.06  0.08  -0.15
sogShare             0.85  0.91   0.97   0.95   1.00   0.84   0.93   0.83   0.29  0.12 -0.00  -0.14
attemptDiffPerGame   0.92  0.98   0.98   0.95   0.93   0.89   1.00   0.81   0.32  0.02  0.07  -0.16
ozStartShare         0.72  0.78   0.82   0.79   0.83   0.72   0.81   1.00   0.32  0.04 -0.01  -0.11
dmen                 0.37  0.33   0.31   0.30   0.29   0.30   0.32   0.32   1.00 -0.09  0.07   0.01
slot                 0.02  0.01   0.06   0.03   0.12 -0.11   0.02   0.04  -0.09  1.00 -0.02   0.08
avgShiftLen         -0.06 -0.15  -0.15  -0.15  -0.14 -0.12  -0.16  -0.11   0.01  0.08  0.02   1.00
```

**Corsi, Fenwick, SF%, attempt differential and attempts-for are pairwise
0.84–0.98. They are one measurement.** Putting Fenwick beside Corsi on a teaching
card shows one piece of evidence twice, which is worse than showing it once.
`avgShiftLen ↔ shiftsPerGame = −1.00` exactly — total ice time per game is fixed,
so they are reciprocals and may never both appear.

⭐ **The card's three rows are already close to an orthogonal basis:** `level5`
(possession), `dmen` (who shoots), `slot` (from where) are pairwise |r| ≤ 0.37.

---

## 4. ⚠️ The venue instruments DISAGREE, so none of them is a gate yet

Four were built. Three are confounded and are not quoted as verdicts: a
visitors-in-a-building split-half (points percentage scores 0.42 on it, so it
mostly measures the home club being itself); road-only reliability (a club's road
halves visit largely the same divisional buildings); and season-over-season
persistence of the home−away gap (the positive control only reaches 0.215 —
underpowered).

⛔⛔ **AND THE TWO SURVIVORS ORDER THE ROWS DIFFERENTLY.** On `bothSides`,
`missed` is 0.732 against hits at 0.449. On the `building` variant in the same
results file, hits is 0.730 and `missed` 0.652 — the opposite ordering. Until it
is understood why, the judgement test may inform a decision but may not be
promoted to an automatic gate. Recorded so nobody ships it as one.

The `bothSides` ordering, for what it is worth: giveaways 0.949 / takeaways 0.775
/ **hits 0.449 (known scorer-judged control)** / missed 0.732 / slot 0.155 /
dmen −0.012 / shooting% 0.297 / save% 0.244.

---

## 5. The four criticisms, and which of them land

**The instrument, plainly.** Every club-season in a completed season (completed =
the archive holds a playoff game for it), split in half CHRONOLOGICALLY, each
half's figure computed, each season centred, then correlated across all 96
club-seasons. Spearman–Brown inverted to ask how many games reach r = 0.7. Two
declared policies, not measurements: **0.7** and **41 games**.

**1. "A chronological split is conservative — you under-credit everything."**
**CORRECT, deliberately, and here is the size of it.** Alternate-game halves share
a season's opponents, schedule and roster health, which inflates reliability;
chronological halves count real mid-season change as unreliability. At admission
41, **27 of 47** qualify on alternate games against **22** chronological.
`sogShare` goes 37 → 14, `hitsPerGame` 49 → 11, `dmen` 23 → 12. We keep
chronological because it is the question the card's label asks. But the honest
statement is a band: `dmen` is somewhere between 12 and 23 games and we publish 23.

**2. "r = 0.7 is arbitrary."** **CORRECT.** It is a declared policy and nothing
derives it. At admission 41: **34 of 47** qualify at r = 0.6, **22** at 0.7,
**9** at 0.8. `level5` needs 23 / 35 / 60 games at those thresholds.

**3. "41 games is arbitrary."** **PARTLY.** 41 is half of 82, so it is half of a
fact about the schedule rather than a tuned constant, and it moves if the league
changes the schedule. But choosing *half* is a choice. At admissions 20/41/61/82
the counts are 5/22/34/39.

**4. "Reliability is not usefulness."** **CORRECT, and it is the criticism we
agree with most.** Power plays score at 7.6 goals per 60 against 5.1 at even
strength, and no power-play measure settles inside a season. Reliability answers
one question — does this number describe this club? — and says nothing about
whether the thing matters. That is what the LEAGUE section is for.

**5. "Your split-half cannot see scorer bias — both halves share a home rink."**
**CORRECT, and it changed our answer.** It is why giveaways came out as the second
most reliable quantity in the archive at 5 games.

**6. "You pooled seasons without centring."** **CORRECT, and we found it
ourselves.** §1.

⭐ **And to "your bar is rigged against fancystats": it excludes the standings.**
Points percentage needs **55 games**, goal differential 52, save percentage at
5-on-5 **219**. The bar rejects the two numbers every broadcast leads with. It is
demanding, not partisan.

---

## 6. What could not be measured, plainly

- **Zone entries/exits, controlled-entry %.** Not in the feed at any level. The
  complete stored event vocabulary is `period-start faceoff stoppage hit giveaway
  shot-on-goal takeaway missed-shot blocked-shot goal penalty delayed-penalty
  period-end game-end shootout-complete`. A critic naming these is naming
  something the public feed cannot support.
- **xG, score-adjusted CF%, RAPM, GAR/WAR.** Modelled — DOCTRINE §7.
- **PDO.** A SUM of two rates, not a ratio, so the `{count, n}` contract cannot
  express it. Its components bound it: shooting% 177 games, save% 219. And PDO is
  *designed* to be luck — presenting it as a club trait inverts its own meaning.
- **Rush shots / rebounds.** Need a seconds-since-last-shot threshold. DOCTRINE §7.
- **Shot-type mix.** The league carries `shotType`; `builders/extract.py` does not
  store it. ⭐ The one candidate blocked by OUR pipeline rather than by the feed.
- **Anything per-60-of-5v5.** The industry's preferred denominator needs 5-on-5
  time on ice, derived by walking the situation code between timestamps with a new
  rule for the gaps. ⚠️ **The rate rows above use per-game denominators, which mix
  in special-teams time. That is the strongest remaining attack on these numbers
  and it is flagged rather than buried.**

---

## 7. ⏭ Open

- **`avgShiftLen` (12 games)** is the one genuinely new club row that survives
  every control: orthogonal (|r| ≤ 0.16 to the possession family), immune to the
  centring bug (league level flat: 47.89 / 47.85 / 48.24), home/away agreement
  0.950, road-only 8 games, and the extremes name the same clubs every year —
  shortest OTT 43.2 / 43.4, longest MIN 53.8 / 53.2 / 52.5. ⚠️ Needs per-club
  shift plumbing, and **57 consecutive 2024-25 games (2024021235–2024021291) carry
  no shift block** — they must be excluded from the denominator, not read as zero.
- **`ozStartShare` (35 games)** is a judgement call: a partly new axis but 0.82
  with Fenwick. Its honest label is "where its draws happen", not "where the coach
  starts it".
- **Do not add Fenwick / 5v5 Corsi / SF% / attempt differential.** They qualify and
  they are the row the card already has. Saying so is a stronger answer to a critic
  than adding four rows that agree with each other.
