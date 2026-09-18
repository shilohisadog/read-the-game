# Who iced it, who was offside — measured over the whole archive

Kevin, 2026-09-18, from the live site: *"'Offside — a skater crossed the blue line ahead
of the puck', do we know which team was offside? I'm not sure a casual fan would know
what was happening there (same with icing) unless we say which team was offside (or iced
the puck)."*

✅ **BUILT 2026-09-18** — the measurement is below, and what shipped is at the end.

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


---

# ✅ What shipped — Kevin's ruling, 2026-09-18

*"name the team when we know and for the 5.6% say something like 'Offsides — data not
conclusive'… Either in the pill or as an overlay on the ice. This is the first time we've
had this happen, so it's uncharted territory."*

⭐ **It was not uncharted: the site already had a form for it.** *"No comparison shown —
this is not a regular-season or playoff game"*; an unknown club gets **nobody's colour**
rather than `undefined`; the faceoff ring is **grey when two clubs are even**. The pattern
is to state the absence where the presence would go, with a reason about the world rather
than about our database — which is also why the copy is not *"data not conclusive"*: by
Kevin's own ruling on the penalties lede, a sentence about what OUR RECORD contains does
not belong on a teaching surface. The test is whether it teaches the rule.

⭐⭐ **AND KEVIN SENT THE FIRST BUILD BACK FROM THE LIVE SITE, correctly.** It had made
the restart *one* frame about the whistle — the ice label, the mark and the caption all
naming the offending club. He looked at it and said: *"the ice also shows CAR Iced the
puck and pointing at the faceoff dot… icing and the faceoff occur at the same clock time,
[as] two different events. I'd rather keep the popup the way it is, since it details the
icing event, and change the ice description to who won the faceoff."*

**His framing is better than the one it replaced, and the reason is stronger than the
duplication he pointed at: A MARK ON THIS RINK ASSERTS A PLACE.** The ice label hangs off
a mark with a leader line, and an icing has **no coordinate at all** — the stoppage
carries none. The dot is where the RESTART is, not where the puck was iced. Labelling it
"CAR · Iced the puck" made a location claim the feed cannot support, which is the same
rule that forbids drawing a player figure on a face-off (Doctrine §5).

**So each surface narrates one of the two events on that frame:**

| surface | what it says | when nobody can be named |
|---|---|---|
| the caption pill | the stoppage, with the offending club on its chip | no chip, plus *"— a centre-ice draw names neither club"* |
| the ice label and mark | the face-off, with the club that won it | unchanged — the draw always has a winner |
| the line under the rink | the player who won the draw | unchanged |

⭐ **The cost that decided it was measured, not assumed.** The objection to taking the club
off the ice is that the pill only writes on a *moment*, so a viewer who never presses play
might never see it. Measured in the code: dragging the scrubber is silent
(`oninput` → `set(v,'')`), but **releasing it fires a moment** (`onchange` → `'jump'`), as
do the step buttons and a double-click. Every way a viewer lands on a frame shows the
pill, so nothing is lost.

⏹ **What the first build cost, and got back:** it had to silence the line under the rink on
13.0 frames a game, because with the ice naming the offender and the line still leading
with the face-off WINNER they named different clubs — the draw is won by the offending
club only 45.1% of the time after an icing and 50.0% after an offside. Kevin's version
returns the draw's narration and lets `render-whistle`'s *"exactly one surface names the
stoppage"* rule stand whole instead of narrowed.

## ⛔ Three things the build found that the design did not

1. **The mark, the label and the line are ONE surface**, and the first build proved it the
   hard way: with the ice naming the offender and the line still leading with the face-off
   WINNER, `active-player.test.js` went red on three frames — ice `BUF` against line `MIN`,
   which is *"text says CAR, visual shows Vegas"*. That is what made the design suspect
   before Kevin ruled on it.
2. **A measured doctrine said the ice must NOT name a stoppage** — *"exactly one surface
   names the stoppage"*, because over 53 games the ice and the box named DIFFERENT
   stoppages on 3.5% of frames. The first build narrowed it; Kevin's version does not need
   to, and the rule stands whole.
3. **Reverting the mark's colour left 107 tests green** and was seen only by the DOM
   golden, which is a change detector and not a catcher. ⚠️ **That hole is still open for
   the ice**: nothing but the golden asserts which club a face-off mark is painted for.
   Worth closing when row 7 moves visibility claims to the browser.

The pill's cost was measured, because that is what the icing caption's own comment
demands: at **844×390** — the landscape phone Kevin's ruling makes the surface — every
caption on this pill is 3 lines and 25% of the ice, the new clause included. At 667×375
the clause reaches 4 lines and 53%, which is exactly what icing already cost there. It
never sets a new worst case.
