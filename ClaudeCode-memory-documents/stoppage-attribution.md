---
name: stoppage-attribution
description: "✅ SHIPPED 2026-09-18: the site names who iced it and who was offside, from the RESTART DOT plus the rulebook — the feed carries `own: null` on every stoppage. Over all 4,490 games: icing 99.99% nameable, offside 94.40%. ⭐⭐ Checked against a rules prediction in BOTH directions. ⛔ Two fallbacks for the last 5.60% were killed by running them against the cases we CAN name (54.38% = a coin flip). ⭐⭐ Kevin sent the first build back: a mark on this rink asserts a PLACE and an icing has no coordinate."
metadata:
  type: project
---

## The question, and where the answer comes from

Kevin, 2026-09-18, from the live site: *"'Offside — a skater crossed the blue line ahead
of the puck', do we know which team was offside? I'm not sure a casual fan would know what
was happening there (same with icing) unless we say which team was offside (or iced the
puck)."*

**The feed does not say.** Every stoppage in the archive carries `own: null`, no actor, no
coordinates. **The restart dot does, via the rulebook** — `offendingTeam` in
`src/lib/layers/whistle.js`:

- **Rule 81.1** — an icing draw is at the end face-off spot in the OFFENDING team's
  defending zone, so the club whose end it is, iced it.
- **Rule 83.2** — an offside draw is outside the blue line of the zone ENTERED, so the
  offender is the club ATTACKING it. ⛔ **THE SIGN IS THE OPPOSITE OF ICING'S.** An
  *intentional* offside goes back to the offender's own end and reads like an icing (5.97%).
- `builders/extract.py::_norm` normalises every coordinate so **the home team always
  defends −x**, so the sign names a club with no possession inference anywhere. Calibrated
  first: 691 of 719 attempts at the end their team attacks, **49 of 49 goals**.

**Over all 4,490 published games, 58,379 stoppages, 0 failed:** icing 38,140 (8.49/game)
**99.99% nameable**; offside 20,239 (4.51/game) **94.40%**. `docs/stoppage-attribution.md`.

## ⭐⭐ The check that made it believable — a rules prediction, in BOTH directions

A short-handed team **may ice the puck legally**, so a club we name as icing it should
almost never be short-handed. Offside has no such exemption and the team entering the zone
is usually the one on the power play, so the same check must come out the *other way*.

| | offender short-handed | other team |
|---|---:|---:|
| icing | **0.43%** | 1.30% |
| offside | 1.93% | **9.71%** |

Reversed, both rows would contradict the rulebook. ⭐ *One prediction could be luck; two
pointing opposite ways is the argument.*

⛔⛔ **AND THE FIRST VERSION OF THAT CHECK CONTRADICTED THE RULE at 4.91%** — it read
"short-handed" off the skater counts in `sit`, which is the trap this repo had already
written down (*a short-handed goal is not "fewer skaters"*): **5.62% of icings happen with
a goalie PULLED**, an endgame dump-in. Against the real penalty box (`box.js` stints/
occupants) it resolved. ⭐⭐ **A PROXY THAT DISAGREES WITH A RULE IS EVIDENCE ABOUT THE
PROXY FIRST** — I nearly concluded the mapping was backwards.

## ⛔⛔ Two fallbacks for the last 5.60%, both killed by a CONTROL

The unnameable ones are centre-ice restarts. **Not disallowed goals** (157 of 1,133 have a
goal anywhere in the six preceding events). And *"the last located play says which end the
rush was heading into"* — **tested against the 3,816 offsides the dot ALREADY names** —
agreed **54.38%** of the time, and got WORSE the deeper that play was (50.4% at |x| 75–100),
because the play before an offside is usually where the rush STARTED, in the other end.

⭐⭐ **WITHOUT THAT CONTROL IT WOULD HAVE SHIPPED** and named the wrong club about half the
time, on a page that exists to teach the rule. *A hypothesis fitted to the cases you cannot
check must be tested against the cases you can* — same discipline as [[refusal-gap-32-games]].

## ⭐⭐ Kevin sent the first build back, and his reason was better than mine

The first build made the restart ONE frame about the whistle: ice label, mark and pill all
naming the offender. He looked at it: *"the ice also shows CAR Iced the puck and pointing at
the faceoff dot… icing and the faceoff occur at the same clock time, [as] two different
events. I'd rather keep the popup the way it is … and change the ice description to who won
the faceoff."*

⭐⭐ **A MARK ON THIS RINK ASSERTS A PLACE.** The ice label hangs off a mark with a leader
line, and an icing has **no coordinate at all** — the dot is where the RESTART is. Labelling
it with the offender made a location claim the feed cannot support (Doctrine §5, the same
rule that forbids a figure on a face-off). **I had collapsed two events into one subject;
they are two facts, and each surface narrates one:**

- the **caption pill** → the stoppage, offending club on its chip, or *"— a centre-ice draw
  names neither club"*
- the **ice label + mark** → the face-off, and the club that won it
- the **line under the rink** → the player who won the draw

⭐ **The cost that decided it was measured:** the objection to taking the club off the ice is
that the pill only writes on a MOMENT. Dragging is silent (`oninput` → `set(v,'')`) but
**releasing fires `'jump'`** (`onchange`), as do the step buttons and a double-click — so
every way a viewer lands on a frame shows the pill. The revert also gave back the draw's
narration on **13.0 frames a game** and let `render-whistle`'s *"exactly one surface names
the stoppage"* stand whole instead of narrowed.

## What the build found that the design did not

- ⛔ **THE MARK, THE LABEL AND THE LINE ARE ONE SURFACE.** With the ice naming the offender
  and the line still leading with the face-off WINNER, `active-player.test.js` went red on
  three frames — *"text says CAR, visual shows Vegas"*. **The draw is won by the offending
  club only 45.1% of the time after an icing and 50.0% after an offside** (600 games).
- ⚠️ **A HOLE LEFT OPEN AND WRITTEN DOWN:** nothing but the DOM golden asserts which club a
  face-off mark is painted for — a planted revert left 107 tests green, and the golden is a
  change detector, not a catcher. Belongs with test-program row 7.

Related: [[defect-corpus-evidence]], [[mechanize-the-review]], [[rule-diagrams]], [[hockey-legibility-build]]
