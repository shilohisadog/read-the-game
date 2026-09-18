# Who iced it, who was offside — measured over the whole archive

Kevin, 2026-09-18, from the live site: *"'Offside — a skater crossed the blue line ahead
of the puck', do we know which team was offside? I'm not sure a casual fan would know
what was happening there (same with icing) unless we say which team was offside (or iced
the puck)."*

**Not started. This is the measurement, not a design.**

## The feed does not say

Every stoppage in the archive carries `own: null`, no actor and no coordinates — icing
and offside included. The whistle layer already states the consequence as doctrine:
*"a stoppage names a rule and never a team."* So today's sentence is not omitting
something we know.

## The restart dot says, and the rulebook is why

**Rule 81.1** — after an icing the draw is *"at the end face-off spot in the offending
team's defending zone"*. **Rule 83.2** — after an offside it is at the neutral-zone dot
outside the blue line of the zone that was entered, which names the attacking team;
an *intentional* offside goes back to the offending team's end.

`builders/extract.py::_norm` normalises every coordinate so that **the home team always
defends −x**, so the dot's sign names a club with no possession inference anywhere.
⭐ Calibrated before it was used: across the 8 extract fixtures, 691 of 719 shot attempts
(96.1%) are at the end their team attacks — **49 of 49 goals, 244 of 245 missed shots**,
the 27 exceptions being long shots, whose coordinate is where the shot was TAKEN.

## The answer, over all 4,490 published games

| | n | per game | **offending team nameable** |
|---|---:|---:|---:|
| **icing** | 38,140 | 8.49 | **99.99%** (2 not) |
| **offside** | 20,239 | 4.51 | **94.40%** (1,133 not) |

Where the restart lands:

| dot | icing | offside |
|---|---:|---:|
| end-zone, \|x\|=69 | 99.89% | 5.97% (intentional offside) |
| neutral-zone, \|x\|=20 | 0.10% | 88.43% |
| **centre ice, x=0** | 0.01% | **5.60% — names nobody** |

Home and away are near even on both (icing 48.9% home; offside 50.5% home), which is
what a rule-based attribution should look like and what a possession guess would not.

## ⭐⭐ The attribution is checked against a prediction the rules make — in both directions

A **short-handed team may ice the puck legally**, so a team we name as icing it should
almost never be short-handed. There is no such exemption for offside, and the team
entering the zone is usually the one on the power play — so the same check must come out
the *other way round*. It does:

| | offender short-handed | the other team | ratio |
|---|---:|---:|---:|
| **icing** | **0.43%** | 1.30% | 3.0× the other way |
| **offside** | 1.93% | **9.71%** | 5.0× |

If the mapping were reversed, both rows would invert — and both would then contradict
the rulebook. One prediction could be luck; two pointing opposite ways is the argument.

⛔ **AND THE FIRST VERSION OF THIS CHECK USED THE WRONG INSTRUMENT AND CONTRADICTED THE
RULE.** Reading "short-handed" off the skater counts in `sit` put the icing offender at
**4.91%** — five times what the exemption allows. That is the trap this repo has already
documented (`test/render-penalties.test.js`: *a short-handed goal is not "fewer
skaters"*): **5.62% of icings happen with a goalie pulled**, which is an endgame dump-in,
not a penalty. Re-run against the real penalty box (`src/lib/box.js::stints` and
`occupants` — the audited rule, including bench minors) the contradiction disappears.
**A proxy that disagrees with a rule is evidence about the proxy first.**

## ⛔ The remaining 5.60% CANNOT be named, and a control is what proved it

Two hypotheses about the 1,133 centre-ice restarts, both tested, both dead:

1. **"They are disallowed goals."** No: only **157 of 1,133** have a goal anywhere in the
   six events before the whistle, and in the samples the goal is followed by its own
   centre-ice restart and then a separate offside.
2. **"The last located play before the whistle says which end the rush was going."**
   ⭐ **TESTED ON THE 94.4% THE DOT ALREADY NAMES, WHICH IS THE ONLY WAY TO KNOW.** Over
   900 games and 3,816 offsides with a known answer, that signal answers 3,584 of them
   and agrees with the dot **54.38% of the time** — a coin flip. It gets *worse* the
   deeper in the zone that play was (59.1% at |x| 0–25, **50.4% at |x| 75–100**), which is
   the opposite of what the hypothesis predicts: the play before an offside is usually
   where the rush STARTED, in the other end, not where it ended.

**Without the control this would have shipped.** Applied to the 1,133 it would have named
the wrong club about half the time, on a page whose purpose is teaching someone the rule.
⭐ *A hypothesis fitted to the cases you cannot check must be tested against the cases you
can* — the same discipline that killed the date-clustering theory in `refusal-gap-32-games`.

**So offside stands at 94.40% and the last 5.60% has no signal we have found.**

## What is still open

**The wording only.** Icing can name the club essentially always (99.99%); offside can
94.40% of the time and the rest is not recoverable. A sentence that sometimes names a team
and sometimes does not risks teaching a novice that the silence means something.

The walk is `docs/defects/stoppage-attribution-2026-09-18/derive.mjs`, run against the
public origin; it fetches every published game and reduces each to its icing and offside
stoppages. 0 of 4,490 games failed.
