# What to watch for, and naming Corsi — a game preview built from the archive

**Written 2026-09-21 for CHENG's review; reviewed 2026-09-22 (§9). The design
converged with Kevin (§10), CHENG ruled on it, and three seasons of measurement
reshaped it — ⭐ §11 IS THE CURRENT CARD and supersedes §10.1's six club rows.** Nothing here is built. Four points are already ruled by
Kevin and are stated as rulings (§1); the original questions are numbered in §7. Every figure is measured, with the probe that
produced it named beside it (§8), over the **2025-26 regular season: 1,312
games, 32 clubs, 82 games each**.

**WHAT PROMPTED IT, for a reader arriving cold.** This repo builds a replay
site for NHL games aimed at a novice fan. We never show a game until it is
final; a game we have not replayed has no page. The front door has a block
that looks forward — tonight it read *"Next: BUF at PIT, Monday, September 21
at 7:00 PM"* — and Kevin, from the live site, asked why one game when there
were eight. It is one by design (`nextFixture` in `src/lib/daily.js` returns
`rows[0]`), and pulling that thread became three questions: how upcoming games
should reach the club pages, what a **preview** of a club's next game should
say, and whether the site should finally **name Corsi**, which it has computed
on every frame since August and never called by its name.

---

## 1. What is already ruled (Kevin, 2026-09-21)

1. **A preview is about the game coming up.** Its EVIDENCE is the archive; its
   SUBJECT is tonight. My first framing — "a preview can only be about games we
   already hold" — confused the two and was corrected. The working name is
   *what to watch for*: two or three things a novice can look for while watching
   tonight, most likely on TV, then check against our replay tomorrow.
2. **It is additive across the season.** It should say more in February than in
   October, because the season has measured more.
3. **Five club measures are the test case** (§3), chosen by how stable a club
   trait they are. The sixth candidate, club 5-on-5 CF%, arrived after that
   ruling and is in §4.
4. **Corsi gets named, under one rule:** *the label "Corsi" or "CF%" appears only
   on a figure that meets the standard definition, strict 5-on-5.* Where our
   figure is all-situations, or our "even strength" (which also admits 4-on-4 and
   3-on-3), it keeps its own name. Proposed and agreed: a learn card *What people
   mean by Corsi*; the attempts layer named so it carries the term (⛔ **reversed
   by CHENG's Q5, §9.1** — no filter is strict 5-on-5, so the layer keeps its
   name); the one-game
   figure stays a fraction and the percentage is TAUGHT as what that fraction is
   called, never printed in its place.

## 2. What this is NOT

⛔ **Not a forecast.** The front door's own headline is that the club with more
shot attempts **loses 2,228 of 4,100 games**. A preview implying who will win
would contradict the site's lead claim. "Watch for" is permitted; "expect" is not.

⛔ **Not head-to-head records.** Tonight's eight matchups have met 9–16 times
each since 2023, which is a record like 7–4 across three seasons of different
rosters. A novice reads that as "Washington owns Philadelphia". Excluded.

⛔ **Not face-offs.** The club that wins more draws wins **50.4%** of games; the
census shows that null is cancellation across zones (a won offensive-zone draw is
worth 2.395x the opponent's attempts, a defensive one 0.712x). Pointing a novice
at the face-off count would teach something false.

⛔ **Not goalie pulls.** Kevin: it does not tell a novice much.

## 3. The five club measures, measured

Each item a preview could carry must pass three tests, and the third one came
out of the measurement rather than out of design:

- **Visible** — it names something a person can see on a screen.
- **A trait** — it describes the club, not noise. Measured by split-half
  reliability: each club's 82 games in date order, odd games against even, the
  correlation across 32 clubs, stepped up to a full season (Spearman–Brown).
- **Big enough to see in ONE game** — a stable difference of a fraction of an
  attempt per game passes the second test and fails this one.

| Measure | Club range (middle half) | Reliability, half → full season | Seen in one game? |
|---|---|---|---|
| Defencemen's share of attempts | 27.4–37.5% (30.7–33.3) | 0.84 → **0.91** | ~5 attempts/game across the range |
| Offsides committed / game | 1.71–2.73 (1.83–2.33) | 0.73 → **0.84** | ~1/game |
| Slot share of located attempts | 44.3–54.6% (46.5–49.1) | 0.71 → **0.83** | ⛔ middle half < 1 attempt/game |
| Penalties taken / game | 3.10–5.18 (3.32–3.86) | 0.61 → **0.76** | ~2/game across the range |
| Power-play goals / game | 0.44–0.84 (0.51–0.67) | 0.49 → **0.66** | ~0.4/game |
| *Icings committed / game* | 3.28–5.15 (3.88–4.37) | 0.30 → 0.46 | — |
| *Trailing push* (share of attempts while trailing − while level) | +2.4 to +9.8 pts | **−0.01 → −0.03** | — |

⭐⭐ **THE TRAILING PUSH IS A LAW OF HOCKEY, NOT A CLUB TRAIT.** Every trailing
club pushes, by about the same amount, and the club-to-club differences are
noise (r ≈ 0). It moves out of the club items and into the **universal** items —
things to watch for in any game: *"when a team falls behind, watch it start
throwing pucks at the net."* It is also the mechanism behind the front door's
headline. Icing, at 0.46, leans the same way.

⛔ **THE MIDDLE-HALF RULE DOES NOT TRANSFER FROM GAMES TO CLUBS.** The layer
surface uses "outside the middle half" over a distribution of GAMES and it is
selective there. Over 32 clubs, half of every measure's clubs sit outside the
middle half **by construction**: tonight it flagged 5–8 of 16 clubs per measure
and **3 to 8 items per matchup** (PHI at WSH and MIN at CHI: 8 each). It selects
nothing. The selection mechanism is open — §7 Q2.

⚠️ **Caveats a reviewer should weigh.** One season. Split halves share the same
season's opponents and schedule, so every reliability here is somewhat
flattering. Power-play goals conflate chances drawn with conversion. Penalties
taken counts every penalty with minutes, misconducts included. The three
shares use the site's own reducers (below); the per-game counts are probe code.

## 4. The sixth candidate: club CF% at strict 5-on-5

Strict 5-on-5 is situation code `1551` (a goalie and five skaters a side).
It carries **121,073 of 152,957** attempts (79.2%), **92.3 per game** for both
clubs together.

| | |
|---|---|
| club range (middle half) | **44.8–59.8%** (48.2–51.8) |
| reliability, half → full season | 0.82 → **0.90** |
| games to reach 0.5 / 0.7 | **9 / 21** |
| seen in one game | full range ≈ **13.8 attempts/game**; middle half ≈ 3.3 |

It is the strongest club measure in the probe, it passes all three tests at
the extremes, and it is the one number a broadcast actually quotes. ⭐ It also
completes a lesson the front door half-teaches: raw attempts pick the LOSER
(2,228 of 4,100) because of the trailing push; counting only attempts while the
score is level flips it (**wins 2,365 of 3,925**) — which is exactly why analysts
use score-close Corsi. The site teaches that correction and never names it.

## 5. Additive: when each club item first means something

From the per-game reliability each half-season figure implies, the number of
games a club needs before its current-season figure reaches a target
reliability follows directly (Spearman–Brown inverted). **The target is the only
policy number; everything else is derived.**

| Measure | Games to 0.5 / **0.7** | ≈ first date a club qualifies at 0.7 |
|---|---|---|
| Defencemen's share | 8 / **18** | ~10 November |
| Club 5-on-5 CF% | 9 / **21** | ~17 November |
| Offsides | 15 / **35** | ~21 December |
| Slot share | 17 / **39** | ~30 December |
| Penalties taken | 26 / **61** | ~late February |
| Power-play goals | 43 / **100** | **never within one season** |

Dates assume 82 games spread evenly from 29 September to mid-April (≈2.9 per
week); they are approximate by that assumption.

So the preview has a natural arc: **opening night carries universal items
only**; defencemen and CF% unlock in November; offside and slot by New Year;
penalties late in the winter; power-play goals never, from the current season
alone. It says more as the season has measured more, and the reader can be told
why — which is the site's pitch (*check our work*) applied to time.

⭐ **Preseason falls out of the same mechanism**: zero current-season games, no
club items. No special case.

## 6. Per-player CF% — the data supports it; the reader question is open

> ⛔ **REWRITTEN 2026-09-22.** The first version of this section presented the
> shift-boundary rule as a new finding, "decided by a witness, not chosen". It
> was not new: `builders/extract.py` and `src/lib/onice.js` already state it,
> with CHENG's own earlier ruling in the comment and the faceoff exception
> beside it. The probes had REIMPLEMENTED a rule the site owns, and its figures
> — "99.9% against 55.7%", "the wrong line on about one attempt in twelve" —
> were dominated by goals and overstated the risk. Those probes are deleted.
> What follows uses the shipped `onIce()`. The correction is §9.3.

Per-player Corsi needs who was on the ice at each attempt. The site already
answers that: `src/lib/onice.js::onIce(game, event)`, live behind the replay's
*on the ice* toggle. Measured with it:

- **Every game carries skater shifts**: 1,312 of 1,312.
- **The ice reconstructs.** `onIce()` gives exactly five skaters a side on
  **99.85%** of the 121,073 strict 5-on-5 attempts (120,888) — a check against the
  league's own situation code rather than against ourselves.
- **The convention is the shipped one, re-confirmed over a full season.** At an
  event that ENDS play the finishing line is on the ice — goals **6,405 of 6,405**,
  penalties **9,048 of 9,048**; at a FACEOFF the arriving line is — the winner's
  shift starts on the draw's second **43,039 of 44,158 (97.5%)**. `onice.js`
  measured the faceoff half over 87 games; this is 1,312.
- **Where the one-second resolution leaves a set uncertain.** Of the 115,711
  non-goal strict 5-on-5 attempts, the alternative reading of the second names a
  different ATTACKING five on **3.90%** (4,513) and a different DEFENDING five on
  **0.80%** (928). Mid-play witnesses lean to the shipped reading — shooter
  **117 of 123**, giveaway 168 of 169 — and more weakly on the defending side:
  hits 39 of 52, blockers 11 of 19.
- **Spread**: 687 of 940 skaters were on the ice for ≥500 strict 5-on-5 attempts;
  their CF% runs **37.7–61.8%**, middle half **46.9–52.2%**.
- *Incidental*: 8,405 of 992,876 shift rows have zero length and 8,366 of them
  sit on a goal's second — markers, not shifts. `onIce()` never matches them
  (both its intervals are open at one end) and the census drops rows with no
  duration, so nothing shipped reads them.

The open problems are about the reader, not the data:

1. **Raw player CF% mostly measures the club** — the reason analysts use CF%
   *relative* (on-ice minus off-ice). Raw is the same trap as raw Corsi.
2. **All five skaters get identical credit.** "Corsi is a line stat, not a
   shooter stat" may be the most useful thing a novice can learn about it, and a
   replay can SHOW it: highlight the five on every attempt.
3. **One game is small**: a forward is on for perhaps 15–25 attempts. A count,
   never a rating.
4. **The site has no player surface.** Season player CF% needs a page, which is
   scope, not a preview item.

My read: pull forward the **line-level lesson** (the five on the ice, on the
replay) and defer season player CF% until there is a place for it, after its
own reliability probe. The case against me: player Corsi is what a curious
novice will look up next, and "we compute it and chose not to show it" is the
disservice argument Kevin made about club CF%. The difference is that club CF%
needs no new page.

## 7. Questions for CHENG

**Q1. The three tests (§3) — are they the right gate, and is the third
measurable?** "Big enough to see in one game" is stated here as attempts per
game across the club range. Is that the right instrument, or should it be the
probability a single game shows the club's direction at all?

**Q2. What selects the club items, now that the middle half cannot?** Candidates:
(a) a fixed number of the most extreme clubs per measure; (b) a gap from the
league value larger than the noise the reliability implies for that club's n;
(c) a cap of one or two items per matchup, chosen by (b). (b) derives from the
data and carries no tuned constant beyond the reliability target; that is my
lean.

**Q3. The 0.7 reliability target — right number, and should it be stated to the
reader?** It is the one policy value in §5.

**Q4. Early season: silence or borrow?** Before an item unlocks, the preview can
say nothing about that club, or borrow last season's figure — which describes a
different roster. My lean is silence, because silence is what makes the growth
visible and never states a stale trait as current. The case against: October is
when a new fan most needs help.

**Q5. Does the 5-on-5 rule hold everywhere the label appears?** In particular,
the attempts layer's name. If the layer can run at all strengths, can it carry
the word "Corsi" at all, or only when strict 5-on-5 is selected — and is a label
that changes with a filter legible to a novice?

**Q6. Percentage taught, never printed — does that survive contact?** The
proposal is "54 of the 85 attempts — analysts call that a Corsi-for of 64%".
That prints the percentage in the teaching sentence. Is that the adjacency
problem (`docs/front-door.md` §5.2) arriving through the learn card, or is a
percentage the reader is TOLD how to compute different from one placed beside
an archive rate?

**Q7. Per-player: line-level lesson now, season figures later — agree?** And is
the defending-side half of the boundary witness required before the lesson
ships, given that the lesson highlights both sides' skaters?

**Q8. Adopting an industry label is a permanent cost.** Once "Corsi" is on the
site, a definitional slip reads as "they got Corsi wrong" rather than "their
own honest measure". Is that cost worth paying, and what check would guard the
label — a test that every surface printing the word computes over `1551` only?

## 8. How to reproduce every figure

```sh
sh tools/probes/preview/fetch.sh DIR                   # 1,312 extracts + schedule, ~110 MB, read-only
node tools/probes/preview/club-profiles.mjs DIR        # §3, including tonight's flags per matchup
node tools/probes/preview/club-cf5.mjs DIR             # §4 and the CF% row of §5
node tools/probes/preview/onice-uncertainty.mjs DIR    # §6: 99.85%, the per-side uncertainty, the player spread
node tools/probes/preview/witness-by-event.mjs DIR     # §6: the convention by event type
node tools/probes/preview/watch-probability.mjs DIR    # §9.2: Q1, club items and the two universals
sh tools/probes/preview/fetch.sh DIR3 "2023 2024 2025" # three seasons, into a DIFFERENT dir (see fetch.sh)
node tools/probes/preview/seasons.mjs DIR3             # §11.2: chronological settle counts, raw vs level CF%
node tools/probes/preview/power-play.mjs DIR3          # §11.2: every power-play metric
```

The probes import the site's own reducers — `corsi` for which events are
attempts, `corsiTeam` for whose attempt it is (a blocked shot credited to the
shooter), `onIce()` for who was on the ice, `measureGame` for slot and
located counts, `situation()` for
power-play goals, `icingRestarts`/`offsideRestarts` for who committed the
stoppage — so no domain rule is restated. ⭐ **`tools/probes/preview/club-profiles.mjs` cross-checks its
attempt count against `measureGame`'s own record on every game: 0 mismatches in
1,312.** The §5 games-to-reliability figures are arithmetic on the split-half r
values printed by the probes (per-game reliability ρ₁ = r / (41 − 40r); games
to target R = R(1 − ρ₁) / (ρ₁(1 − R))). `schedule.json` changes nightly, so
"tonight's flags" reproduce only on the night they were run (2026-09-21).

## 9. CHENG's review (2026-09-22), what it prompted, and what goes back

### 9.1 Ruled

CHENG verified one claim in the code before ruling: the strength control offers
`all`, `even` and `level` (`builders/build_main.py`), **no strict 5-on-5 setting
exists**, and `even` admits `1331` and `1441` — `isEven`'s docstring has said
*5v5, 4v4 or 3v3* throughout. Checked, and it holds.

| Q | Ruling |
|---|---|
| **Q1** | The third test is the **probability a single game shows the club's direction**, not effect size at the extremes: a viewer sees one draw from the distribution, and a *watch for* that fails four nights in ten is a failed forecast from the reader's chair. |
| **Q2** | **(b) selects, (c) caps, Q1 fills the cap** — the items most likely to be visible tonight. |
| **Q3** | State the consequence, not the coefficient: *in October we say little about clubs; by February, more, because the season has measured more.* The number stays in `docs/`. |
| **Q4** | **Silence.** Opening night is club-silent, not silent. Borrowing last season's figure is the stale-date defect as a design choice. ⭐ Adds a second universal item: **faceoff LOCATION** (wins stay out). |
| **Q5** | ⛔ **The attempts layer keeps its name under every filter.** Neither fix is free — a fourth strength setting on a row compressed to fit 360px, or redefining `even` and undoing the `1331` fix — and a label that changes with a filter is the mode-label problem in reverse. Corsi lives only where the figure is over `1551` by construction: the learn card and the preview. This reverses §1.4's "the attempts layer named so it carries the term". |
| **Q6** | A percentage derived from the fraction beside it is a **translation**, not adjacency. Rule: a taught one-game percentage never appears in the same breath as a season or archive rate. |
| **Q7** | Agree on the line-level lesson; **gate it on a defending-side witness** via `blk`. |
| **Q8** | The label names the variant: **"5-on-5 CF%"**, and *unadjusted* on the learn card — CF% is quoted score-adjusted, venue-adjusted and both. The guard is the D10 shape: scan every surface for the label, assert each computes over `1551`, so a new surface fails on arrival. |

### 9.2 Q1, measured — and it disqualifies the universals too

`tools/probes/preview/watch-probability.mjs`. For each club outside the middle
half, the share of its 82 games that land on its side of the league value:

| Measure | Median flagged club | Range over flagged clubs | Most extreme clubs |
|---|---|---|---|
| Defencemen's share | **67%** | 57–83% | COL 83%, LAK 79% |
| Club 5-on-5 CF% | **63%** | 57–87% | CAR 87%, TOR 76% |
| Slot share | **62%** | 54–78% | DAL 78%, BOS 65% |
| Penalties taken | **59%** | 49–67% | TBL 66%, NJD 62% |
| Power-play goals | **59%** | 48–67% | CGY 67%, DAL 61% |

The two universals, under the same test:

- **The trailing push**: the trailing club out-attempts its opponent while
  trailing in **1,241 of 1,776** club-games (**69.9%**); 69.5% with ≥10 attempts
  while trailing; 69.8% judged as trailing share above level share.
- **Faceoff location**, end-zone draws seen from the club attacking that end,
  draw to next whistle: the attacker takes the first attempt on **29,973 of
  50,870** (58.9%) at all strengths and **20,064 of 36,901 (54.4%)** at strict
  5-on-5; **one draw in five** reaches the whistle with no attempt at all; the
  attacker out-attempts the defender over the run on 46.1% at 5-on-5.
  ⚠️ So the proposed sentence — *"a draw in a team's own end usually means the
  other team is about to shoot"* — overstates it at 5-on-5. The census's 2.395x
  is a TOTAL over draws won, not a per-draw probability: the distinction Q1
  itself draws.

⭐ **By Q1's own example — four nights in ten is a failure — the median club
item fails, and so do both universals.** Any pass mark would be a tuned constant,
which Q2 was ruled to avoid.

### 9.3 Q7, and my corrections

The gate as ruled cannot work, and the premise it answered was mine and wrong.

1. **The boundary rule was not new** — see the note heading §6. CHENG ruled on it
   once already, in `builders/extract.py`, and `src/lib/onice.js` carries the
   faceoff exception. I restated it in a probe instead of importing it.
2. **My 99.9% was mostly goals**: 4,046 of the cases where the two readings
   disagreed about the shooter were goals, where every shift closes on the goal's
   second.
3. **"One attempt in twelve" overstated the risk the gate was built against.**
   Through the shipped function the defending five is boundary-sensitive on
   **0.80%** of non-goal 5v5 attempts, not 8.6%.
4. **The blocker cannot witness it.** Only **19** blocked shots have the blocker's
   own shift boundary on the attempt's second, split **11 to 8** — a coin at that n.
   Defending-side witnesses pooled (hits and blockers) lean to the shipped reading
   **50 of 71**.
5. **The lesson's surface already exists**: the *on the ice* toggle.

### 9.4 Back to CHENG — two questions

**R1. Probability as WORDING, not as a gate?** Proposal: every *watch for* states
its own rate — *"When a team falls behind, it usually starts outshooting the
other team — in about 7 games of 10."* A sentence that carries its frequency is
never wrong about tonight, needs no pass mark, and is carry-your-n applied to the
preview. The probability still orders items within the cap (Q2). The case
against: a novice may read "7 in 10" as a forecast of this game after all, and a
rate on every line is heavier copy.

**R2. Ship the line-level lesson with the limit disclosed, rather than gated?**
The defending five rests on the convention rather than the record on about **1
non-goal attempt in 125**, and no witness in the feed can settle those at a
one-second resolution. Proposal: ship, and say so where the lesson is taught. The
alternative is marking those frames — which needs its own rule for *which* reading
to draw.

## 10. Converged with Kevin, 2026-09-22 — THE PLAN OF RECORD

Kevin, after §9: *"I'm not sure we are aiming at the right type of 'what to watch
for' lessons"* — and then, rejecting a curriculum ("lesson of the night") that I
proposed in its place: *"after let's say 10 games, WSH plays whoever on their 11th
game, the preview card will provide data centric information … centered around
the 5 items … that's the same approach we'll take when we are discussing game 82.
Consistent throughout the season, the only thing that changes is the data becomes
more and more telling."*

### 10.1 The card

- **Six fixed rows, every game, both clubs**, from each club's CURRENT season
  (regular season and playoffs only — `inScope`, the same population as every
  computed number on the site):

  | Row | Count shown | League beside it | Settles at (§5, 0.7) |
  |---|---|---|---|
  | Penalties | penalties taken, per games played | per game | 61 games |
  | Power-play goals | goals with the extra skater, per games played | per game | **never within a season** — kept anyway (Kevin: a novice notices power plays more than anything on the list) |
  | Shots from the slot | slot attempts of located attempts | of every 100 | 39 |
  | Defencemen shooting | attempts by defencemen of all attempts | of every 100 | 18 |
  | Offside | offsides committed, per games played | per game | 35 |
  | 5-on-5 CF% | 5-on-5 attempts for, of both clubs' — then *"a 5-on-5 CF% of N"* as its translation (§9.1 Q6, Q8) | 50 by definition | 21 |

- **Every row carries its n and the league figure**, and a *watch for* line that
  names something visible on a screen. No row says what will happen tonight.
- **From each club's first game onward.** ⚠️ *Before* its first game a club has
  n = 0: proposed, the rows show the league figure and the watch-for line, with
  "has not played yet" in the club's column — the card still teaches what to look
  at on opening night.
- **Each row labels itself *still forming* until the club reaches that row's game
  count, then *settled*.** The labels change row by row; the card never changes
  shape. This replaces §9.1 Q4's silence: early rows SPEAK, and say how much they
  can be trusted.

### 10.2 Why the label is required, not decoration

PHI 2025-26, after 10 games against after 82 (`tools/probes/preview/`):

| | after 10 | after 82 |
|---|---|---|
| penalties / game | **5.2** | 3.93 |
| offsides / game | **2.9** | 2.24 |
| power-play goals / game | **0.60** (league average) | 0.44 (**last**) |
| slot, of every 100 | 52 | 50 |
| defencemen, of every 100 | 30.7 | 30.5 |
| 5-on-5 CF% | 47.4 | 47.7 |

And WSH's 5-on-5 CF% went **55.4 → 49.4**. Early figures are not merely noisy;
some are confidently wrong, and the rows that moved are the ones §5 says settle
late. The label is how a card that speaks from game 1 stays honest.

### 10.3 What this retires

- **§9.1 Q2 (selection)** — nothing is selected; all six rows always show. The
  middle-half problem (§3) and the Q1 probability gate (§9.2) no longer have a job.
- **§9.1 Q4 (silence)** — replaced by the label, above.
- **§9.4 R1** — there is no claim about tonight to phrase.
- Kept whole: the Corsi rules (§9.1 Q5, Q6, Q8) and the reliability arithmetic.

### 10.4 A gateway to per-player CF%, built as a seam

Kevin: *"we might be adding per player Corsi for % in the not too distant future,
so this panel needs to provide a gateway."* The 5-on-5 CF% row is the natural
door: a club's CF% is the sum over its skaters' on-ice attempts, so *"who drives
this number"* is the question the row itself raises.

Proposed, on the mechanism-not-policy line: each row is a record, and a record
has an OPTIONAL `detail` target. The CF% row's target is the club's per-player
on-ice 5-on-5 CF% (raw and relative, §6), computed through the shipped `onIce()`.
**Until that surface exists the slot is empty and nothing is drawn** — no dead
link, no "coming soon". The seam costs a field; the door appears the day there is
a room behind it. §9.4 R2 (the defending five uncertain on ~1 non-goal 5v5 attempt
in 125) belongs to that future surface, not to this card.

### 10.5 For CHENG

**P1.** Is *still forming / settled* by a per-row game count the right honesty
device for a card that speaks from game 1 — or should an early row show its
uncertainty directly (a range), and what does a novice read either as?

**P2.** The game counts come from ONE season's split halves, which flatter (§3).
Re-derive them each season from the archive and let the labels move, or pin them
and re-examine yearly?

**P3.** Two clubs side by side is two populations side by side. The adjacency rule
(`docs/front-door.md` §5.2) was about a one-game figure beside an archive rate;
two season-to-date figures of the same kind, each beside the league value, is the
comparison the card exists to invite. Agree that this is not the adjacency case —
and is the case different when one club has played 12 games and the other 9?

**P4.** The `detail` seam for per-player CF%: right place, and right to draw
nothing until the surface exists?

## 11. CHENG on §10, three seasons of measurement, and the card as ruled (2026-09-22)

### 11.1 CHENG's rulings on P1–P4

| | Ruling |
|---|---|
| **P1** | The label, **without the cliff**: a binary *still forming → settled* invents a discontinuity at game 61 that the data does not have. Show progress — *"10 of 61 games — still forming"*. It also answers the 12-games-against-9 case: *12 of 35* beside *9 of 35* says both are forming and how far each has come. A range was rejected: a novice reads `3.4–7.0` as its midpoint or not at all. |
| **P2** | **Pool every season in the archive, pin the counts for the season, re-examine yearly.** And the bias runs the dangerous way: alternating-game halves share a season's opponents and schedule, which INFLATES reliability and makes the settle counts TOO SMALL — labels that tell a reader to trust a figure early. |
| **P3** | Not adjacency for the trait rows — comparing clubs is the point. **But for 5-on-5 CF% it is partly the trap:** strict `1551` spans every score state, every trailing club pushes (§3), so season CF% is biased toward the club that trails more. Prefer **5-on-5 CF% at a level score**. |
| **P4** | Right, and **exercise the seam before the room exists**: an optional field that is always empty is a code path that never runs. A fixture record with a `detail` target and one test that it draws a door. |

### 11.2 Measured over three seasons

`tools/probes/preview/seasons.mjs` and `tools/probes/preview/power-play.mjs`, over **2023-24, 2024-25
and 2025-26: 3,936 regular-season games, 96 club-seasons**, each season centred
before pooling so a league-wide shift is not read as a club trait.

**P2 — confirmed, and larger than stated.** A CHRONOLOGICAL split (first half of
the season against the second) gives lower reliability than alternate games on
six of seven measures. And 2025-26 alone was the flattering season for two of
them (offside 0.73 against 0.51 and 0.51; power-play goals 0.49 against 0.32 and
0.41). Games to reach 0.7:

| Measure | §5 (2025-26, alternate) | three seasons, alternate | **three seasons, chronological** |
|---|---|---|---|
| Defencemen shooting | 18 | 12 | **23** |
| 5-on-5 CF%, raw | 21 | 17 | **23** |
| 5-on-5 CF%, level score | — | 27 | **35** |
| Shots from the slot | 39 | 37 | **37** |
| Penalties taken | 61 | 44 | **73** |
| Offside | 35 | 68 | **85 — never within a season** |
| Power-play goals | 100 | 145 | **160 — never** |

The chronological counts are the ones the card promises — *does the early figure
describe the club's later self* — and they are the conservative direction CHENG
asked for. Their one flaw is the honest one: they also count real mid-season
change (trades, injuries) as unreliability.

**P3 — the direction is right; the size is small.** Raw minus level-score CF%
correlates **−0.30** with goal differential, so raw does flatter the outscored
club: **+0.28 points** for the bottom quarter by goal differential, **−0.49** for
the top. Both correlate with goal differential about equally (raw **0.63**, level
**0.65**). They disagree on which of two clubs is higher in **175 of 1,488**
same-season pairs (11.8%), and there goal differential sides with the level-score
figure **100** times to raw's **74**. At a season's scale the push moves CF% by
about half a point; in ONE game it is what makes the attempts leader lose 54% of
the time.

**No power-play metric settles in a season** — asked by Kevin, *is there an
industry power-play metric we can lean into?* League figures match the NHL's own
(a **21.9%** power play on **2.71** chances per club per game):

| Metric | League | Club range | Games to 0.7 (chrono) |
|---|---|---|---|
| PP goals / game | 0.60 | 0.31–0.85 | 160 |
| **PP%** | 21.9% | 11.6–32.2% | **150** |
| PP opportunities / game | 2.71 | 2.11–3.33 | 235 |
| PP goals / 60 PP min | 7.06 | 3.5–11.2 | 180 |
| **PP shot attempts / 60 PP min** | 95 | 73–121 | **78** |
| PP shots on goal / 60 PP min | 48.6 | 36.6–63.4 | 105 |
| **PK%** | 78.1% | 68.8–85.9% | **383** |
| PK attempts against / 60 PK min | 95 | 67–116 | 86 |

PP% and PK% — the numbers a broadcast quotes — are close to noise at the club
level over a season. What a club controls is how much it shoots with the extra
skater, and even that needs 78 games.

### 11.3 Kevin's principle, and the card it produces

Kevin: *"we are a teaching centric site, at the core. If a data element doesn't
settle during a season … what are we telling the novice reader?"* A row that never
settles is not a row about an irrelevant thing — power plays score at **7.6 goals
per 60 against 5.1** at even strength — it is a row where the differences between
clubs are mostly luck over a season. Presented as a trait, it teaches something
false.

So the six rows split in two, and the card keeps its shape:

**CLUB ROWS — settle in-season, so they describe the club.** Both clubs, current
season, count with its n and the league figure, and a progress count (P1):

| Row | Settles at | League (3 seasons) |
|---|---|---|
| **5-on-5 CF%, score tied** — Kevin chose the level-score variant (P3); the label names it (§9.1 Q8) | 35 games | 50 by definition |
| **Defencemen shooting** | 23 games | 32.5 of every 100 attempts |
| **Shots from the slot** | 37 games | 46.8 of every 100 located attempts |

**LEAGUE ROWS — do not settle, so they teach what is normal.** The same every
game, true every night, and each with something to watch tonight:

| Row | What it says | Why a league row |
|---|---|---|
| **Power play** | scores about **1 time in 5** (21.9%) from about **2.7** chances per team per game; over a season which teams do better is mostly luck — what a team controls is how much it shoots with the extra skater | nothing in §11.2 settles |
| **Penalties** | about **3.6** per team per game — and each is the other team's power play | Kevin: *"penalties naturally tie into power plays"* — each one IS an opportunity, and opportunities never settle (235) |
| **Offside** | about **2.1** per team per game — watch the blue line on the way in | 85 games |

⭐ **P1's never-finishing progress bar disappears with the split**: every club row
settles inside a season (23, 35, 37), so every progress count can reach its end.

**What changes from §10:** three club rows became league rows; CF% is the
level-score variant, label *"5-on-5 CF%, score tied"*; the `detail` seam (§10.4)
stays on the CF% row and gets a fixture test now (P4); the counts are pinned from
the three-season chronological estimate and re-derived each summer (P2).

### 11.4 For CHENG

**Q9.** The level-score variant as a *club* row: 35 games to settle on a smaller n
than raw. Agree that the label *"5-on-5 CF%, score tied"* satisfies Q8 — and
that "score tied" (level throughout regulation, `tiedControl`) is the right
English for a novice, given the industry's "score-close" means something else?

**Q10.** League rows repeat identically on every card. Is a row that never
changes still worth its space on a card whose point is *this game*, or does it
belong once, above both clubs, as the frame the club rows sit inside?
