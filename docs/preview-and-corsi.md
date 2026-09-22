# What to watch for, and naming Corsi — a game preview built from the archive

**Written 2026-09-21 for CHENG's review.** Nothing here is built. Four points are
already ruled by Kevin and are stated as rulings (§1); the open questions are
numbered in §7. Every figure is measured, with the probe that
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
   mean by Corsi*; the attempts layer named so it carries the term; the one-game
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

Per-player Corsi needs who was on the ice at each attempt, from the shift
records. Measured:

- **Every game carries skater shifts**: 1,312 of 1,312.
- **The ice reconstructs.** 99.2% of the 121,073 strict 5-on-5 attempts resolve
  to exactly five skaters a side, which is a check against the league's own
  situation code rather than against ourselves.
- ⭐⭐ **THE BOUNDARY RULE IS DECIDED BY A WITNESS, NOT CHOSEN.** On **8.6%** of
  attempts (10,450) a line change and the attempt share a second, and the two
  candidate rules — a shift ending at *t* includes *t*, or a shift starting at
  *t* does — name different skaters while **both** still count five a side. The
  count cannot tell them apart. The shooter must be on the ice: of the 9,363
  boundary cases with a usable shooter, **end-inclusive puts the shooter on the
  ice 99.9%** of the time, start-inclusive 55.7%. The wrong rule would credit the
  wrong line on about one attempt in twelve, and pass the five-a-side check.
- ⚠️ **HALF-WITNESSED.** The shooter confirms the SHOOTING side. That the
  defending side follows the same convention is assumed. A blocked shot's
  blocker, if the feed names one, would witness it; not yet checked. The 1,087
  blocked shots were excluded from the witness because which field names the
  shooter on them was not re-verified for this probe.
- **Spread**: 685 of 940 skaters were on the ice for ≥500 strict 5-on-5 attempts;
  their CF% runs **37.7–61.9%**, middle half **46.9–52.2%**.

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
node tools/probes/preview/on-ice.mjs DIR               # §6: 99.2% and the player spread
node tools/probes/preview/shift-boundary.mjs DIR       # §6: the boundary witness
```

The probes import the site's own reducers — `corsi` for which events are
attempts, `corsiTeam` for whose attempt it is (a blocked shot credited to the
shooter), `measureGame` for slot and located counts, `situation()` for
power-play goals, `icingRestarts`/`offsideRestarts` for who committed the
stoppage — so no domain rule is restated. ⭐ **`tools/probes/preview/club-profiles.mjs` cross-checks its
attempt count against `measureGame`'s own record on every game: 0 mismatches in
1,312.** The §5 games-to-reliability figures are arithmetic on the split-half r
values printed by the probes (per-game reliability ρ₁ = r / (41 − 40r); games
to target R = R(1 − ρ₁) / (ρ₁(1 − R))). `schedule.json` changes nightly, so
"tonight's flags" reproduce only on the night they were run (2026-09-21).
