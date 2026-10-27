---
name: challenge-outcomes
description: "Coach's challenges / league reviews — the archive sweep (2026-10-21, 4,702 games, 793 goal reviews) proving the outcome is readable from the record + restart face-off, the two replay defects, and Kevin's wording rulings. Open before touching challenge copy."
metadata:
  node_type: memory
  type: project
  originSessionId: 770fcd09-9f69-4068-9894-d8760c1c3e01
  modified: 2026-10-21T21:30:00.667Z
---

**Sweep 2026-10-21** (all 4,702 published games; challenge in `rsn` OR `rsn2` — 101 are in `rsn2`,
behind "referee-or-linesman"): 806 reviews, 13 puck-over-glass (not goals), 793 on goals.
- came off (coach won): no goal event + no penalty — 484; restart NOT centre 476/484. Ruling stoppage
  follows at the same second for offside ("offside") and 14/20 missed stoppages (high-stick, hand-pass…);
  goaltender interference never names a ruling.
- stood (coach lost): other bench's goal + `delaying-game-unsuccessful-challenge` (2 min BEN, all 241) on
  the challenger — 208; centre 208/208.
- challenger's OWN goal now counts: 15 (centre 15/15); own goal stayed off: no goal + penalty — 30 (end
  dot 29/30). Goaltender interference only.
- league review: goal present = stood (28; 15 were OT winners, game over), absent = came off (26 — NO team
  can be named: no event, no challenger). 2 unclear (stood, centre, no penalty recorded).
- Coaches win 499/739 (68%). The centre-ice restart after a counted goal is the independent second witness.
- Out of reach: who scored a goal that came off (league deletes the event) and its tracking.

**Defects found:** the copy said "challenged the goal" about a goal never on the ice, no outcome, and the
ruling showed as a second whistle; `rsn2` challenges are never read by the page.

**Kevin's wording rulings (2026-10-21):** plain English — "ruled out on the ice" REJECTED (meaningless to
him); own-goal cases: "UTA challenged to have its goal count…". Verb: "The review determined / concluded…"
(overturning takes conclusive proof, so the language is specific). Stood: "concluded the goal stands",
never "found no interference". Score: "tied", never "level" [[feedback-hockey-lingo]].
**✅ LIVE 2026-10-21 (`ab8be92`)**: `src/lib/challenge.js` (`challenges`, `challengeSay`) + color.js note 0, said
on the first frame of play after the review (the penalty frame when a challenge failed, keeping the power-play
clause; the goal itself when the game ends on it). Kevin chose the VERBOSE own-goal form ("…to have its goal
count; the question was interference with the goaltender") — full disclosure over brevity. Verified live on
NSH@TOR 2026020044 and COL@PHI 2026020138. ⏭ Open: Goals mode says nothing of a challenge (option 3); the
coaches' success rate as an "Is that a lot?" (needs a published measure — publish order in [[measures-list]]).
**Kevin 2026-10-21 (quibble, right):** the challenge does not STOP play — play stopped for the GOAL and the
challenge followed; the league files that whistle under the chlg code. Stoppage card + "Most recently" now
read `reviewName/reviewSay` (challenge.js): "Goal, NSH challenged that TOR was offside prior to the goal" —
team abbreviations, never "home/visiting" (Kevin). LIVE `8c65d21`. Not yet looked at: one goal whistle can
count twice in the Stoppages total (the chlg stoppage + the ruling stoppage).
**✅ Goals mode LIVE 2026-10-22 (`c6e164a`):** `GOAL_STOPS` in app.js = goal frames + the restart face-off
after each goal that came off ("Face-off after a review · TOR's goal came off" — Kevin: name the frame for what it is, THEN why the replay stopped there; verbose preferred, `098640f`); a goal that stood/awarded carries the review
sentence on its own frame in Goals mode only. Kevin asked twice "are we inventing a stoppage?" — NO: every stop
is a recorded frame; only words are ours. Open: no scrubber tick for a goal that came off.
**✅ Success rate LIVE 2026-10-22 (`e5cd6d6`):** `census.reviews` {coach, coachWon, league, leagueOff} (counts,
in-scope games only: 490/726 coach won, 26/54 league took off — the 499/739 sweep included preseason). Said after
every coach's challenge: "Across the 4,345 games we have measured, coaches have won 490 of 726 challenges of a goal,
about 2 in 3." Game count, not a season, because measures.json publishes no start date (no hard-coded values).
⚠️ The power-play line's "Over the last three seasons" is hard-coded and now slightly wrong (census includes
2026-27) — flagged to Kevin, not changed. Derive drift fired (league amended games) → refreshed `0040744`, derive green.
Related: [[stoppage-attribution]], [[hockey-legibility-build]].
