# A color-commentary script — first period, BOS at SJS, 13 October 2026

**Status: BUILT 2026-10-15** (`src/lib/color.js`, the line under the rink), after Kevin read the draft: *"Everything else looks real good … let's go with the verbose approach to start, then maybe we add a toggle that says Verbose / Minimal commentary."* The draft's "(all 47)" now reads "47 seconds each"; a penalty names the player who sits and says "power play" only when the record shows a side short; the score between periods opens the next period. Below, the table is regenerated from the built code. Kevin, 2026-10-15: the line under the
rink should be "more like the color guy and not the play by play guy", in plain
English, without inventing anything, because the mission is to help a viewer
understand hockey.

How it was made: `tools/color-script.mjs` runs `src/lib/color.js` — the code the
replay runs — over the league's record of game 2026020105. The middle column is a plain-English stand-in for what
the page already shows (the label on the ice and the name line).

## The story it tells, in the last three minutes

This is the case for the idea. Nothing here is invented; every clause is the
league's record, the rulebook, or the archive:

| Clock | Color |
|---|---|
| 02:09 | SJS iced the puck … SJS may not swap players — its 5 skaters stay on, 15 to 33 seconds into their shift. |
| 01:47 | The puck has stayed in the SJS end for 3 events in a row … |
| 01:36 | Every SJS skater on the ice has now been out more than 46 seconds (48 to 66). A typical shift lasts about 46 seconds … |
| 01:32 | That shot came from the slot … About 1 shot in 9 from there goes in; from farther out, about 1 in 30. |
| 01:17 | BOS now leads 2–1. The puck had stayed in the SJS end for 6 events in a row before it went in. |

A fan would say: SJS iced it, couldn't change, got pinned in their own end, and
tired skaters gave up a goal from in front. The script never says "tired" or
"pinned" — it gives the seconds and the count and lets the viewer see it.

## The draft rules

One note at a time, at most; silence is normal. When several apply, the first wins:

1. **A goal** — what it does to the score, and how many events in a row the puck
   had stayed in that end first.
2. **A penalty** — who goes to the box, for how long, what a power play is, and
   how often one ends in a goal (5,275 of 24,991 over three seasons: about 1 in 5).
3. **A restart** — on the faceoff after an icing: who iced it, that they may not
   change, how long their skaters have been out, and how many fresh skaters the
   other side sent. After an offside: what offside is. Any other reason for a
   whistle: explained the FIRST time it happens in the game, then silence.
4. **A shot from the slot** — the first one per team gets the base rate (19,626
   goals from 168,930 slot attempts, about 1 in 9; 6,634 from 201,723 farther
   out, about 1 in 30); later ones are counted.
5. **The shift clock** — when every skater of one team on the ice has been out
   longer than the typical shift, 46 seconds (the median of 3,144,854 shifts),
   said once per group of skaters.
6. **A zone stretch** — three or more events in a row in one end (our rule):
   "The puck has stayed in the SJS end for 4 events in a row; in that time SJS has
   3 shot attempts."
7. **The end of the period** — shots on goal, all shot attempts, shots from the slot.

⚠️ **One wording choice to rule on.** Kevin's example was "BOS has kept the puck in
the SJS end". The record cannot say who controlled the puck — some of those events
are SJS players hitting or blocking — so the script says "the puck has stayed in
the SJS end … in that time BOS has 3 shot attempts". Same plain English, and true.

## What reading it shows

- **35 of 78 frames (45%) carry a note.** Probably too many: the zone stretch speaks
  on every event while it lasts (08:24 to 07:05 is five notes in a row). It could
  speak once when it starts and once when it ends.
- **The first shift note is trivia.** At 19:13 the opening shift has simply run
  47 seconds; a shift clock during the first minute of a period says little.
- **"Why play stopped" works** because it speaks once per reason — the novice
  learns that a goalie covering the puck stops play, and is not told again.
- **The league records some blocks by the shooter's own teammate** (09:00, 12:06);
  the script says so plainly rather than inventing a blocker.
- **Penalty, then a broadcast break** (06:33): the timeout explanation lands on
  the faceoff right after the penalty note — two explanations in a row.

## The whole period

| Clock | What happened | Color |
|---|---|---|
| 20:00 | BOS won the faceoff (Lindholm) |  |
| 19:28 | BOS blocked a SJS shot (Mittelstadt) |  |
| 19:13 | SJS shot and missed the net (Cagnoni) | Every SJS skater on the ice has been out longer than a typical shift (about 46 seconds): 47 seconds each. |
| 18:51 | BOS lost the puck (Pastrnak) |  |
| 18:15 | BOS player hit an opponent (Zadorov) |  |
| 18:14 | SJS shot on goal, saved (Chernyshov) | That shot came from the slot, the area right in front of the net. About 1 shot in 9 from there goes in; from farther out, about 1 in 30. |
| 17:31 | SJS won the faceoff (Ostapchuk) | BOS may not change players for this faceoff: its 5 skaters stay on, 25 to 35 seconds into their shift. SJS sent out 3 fresh skaters. |
| 17:27 | BOS blocked a SJS shot (Peterka) |  |
| 17:02 | SJS shot and missed the net (Goodrow) | Another shot from the slot: SJS's 2nd of the game. |
| 16:46 | SJS shot on goal, saved (Graf) | The puck has stayed in the BOS end for 4 events in a row; in that time SJS has 3 shot attempts. |
| 16:24 | BOS shot and missed the net (McAvoy) |  |
| 16:12 | BOS shot on goal, saved (Kastelic) |  |
| 16:01 | BOS shot on goal, saved (Poitras) |  |
| 16:00 | SJS player hit an opponent (Orlov) |  |
| 15:56 | SJS won the faceoff (Smith) | Why play stopped: The goaltender caught or covered the puck after a shot, which stops play and brings a faceoff. |
| 15:18 | SJS shot on goal, saved (Nurse) |  |
| 15:16 | BOS penalty: High-sticking (Pastrnak) | Pastrnak sits in the penalty box for 2 minutes. BOS plays with fewer skaters until then: a "power play" for SJS. Over the last three seasons, about 1 power play in 5 ended in a goal. |
| 15:16 | BOS won the faceoff (Khusnutdinov) |  |
| 14:08 | BOS blocked a SJS shot (Borgen) | Every SJS skater on the ice has been out longer than a typical shift (about 46 seconds): 68 to 114 seconds each. |
| 13:46 | SJS lost the puck (Misa) | The puck has stayed in the BOS end for 3 events in a row; in that time SJS has 1 shot attempt. |
| 13:41 | SJS took the puck away (Orlov) |  |
| 13:28 | BOS blocked a SJS shot (McAvoy) |  |
| 13:23 | SJS won the faceoff (Ostapchuk) | Why play stopped: The puck was shot out of play into the netting above the glass. |
| 13:07 | SJS player hit an opponent (Sherwood) |  |
| 12:58 | SJS player hit an opponent (Graf) |  |
| 12:56 | SJS won the faceoff (Celebrini) | Why play stopped: The puck was covered and play stopped. |
| 12:51 | SJS lost the puck (Nurse) |  |
| 12:50 | SJS took the puck away (Smith) |  |
| 12:46 | BOS blocked a SJS shot (Lindholm) |  |
| 12:41 | BOS lost the puck (Pastrnak) |  |
| 12:32 | SJS shot on goal, saved (Celebrini) |  |
| 12:06 | A SJS shot hit a teammate (Chernyshov) | Every SJS skater on the ice has been out longer than a typical shift (about 46 seconds): 50 seconds each. |
| 11:04 | SJS won the faceoff (Wennberg) | Why play stopped: The puck struck an official, and play stopped. |
| 10:39 | BOS player hit an opponent (Brunet) |  |
| 10:26 | BOS player hit an opponent (Minten) |  |
| 10:09 | BOS player hit an opponent (McAvoy) |  |
| 10:07 | BOS won the faceoff (Poitras) |  |
| 09:28 | BOS player hit an opponent (Borgen) |  |
| 09:00 | A BOS shot hit a teammate (Zacha) |  |
| 08:29 | SJS blocked a BOS shot (Nurse) |  |
| 08:24 | SJS lost the puck (Smith) | The puck has stayed in the SJS end for 3 events in a row; in that time BOS has 2 shot attempts. |
| 08:18 | SJS lost the puck (Celebrini) | The puck has stayed in the SJS end for 4 events in a row; in that time BOS has 2 shot attempts. |
| 08:16 | SJS took the puck away (Celebrini) | The puck has stayed in the SJS end for 5 events in a row; in that time BOS has 2 shot attempts. |
| 07:10 | BOS shot on goal, saved (Mittelstadt) | The puck has stayed in the SJS end for 6 events in a row; in that time BOS has 3 shot attempts. |
| 07:05 | **BOS GOAL** (Minten) | That puts BOS ahead, 1–0. The puck had stayed in the SJS end for 7 events in a row before it went in. |
| 07:05 | BOS won the faceoff (Minten) |  |
| 06:40 | BOS lost the puck (Khusnutdinov) |  |
| 06:33 | BOS penalty: Hooking (Zadorov) | Zadorov sits in the penalty box for 2 minutes. BOS plays with fewer skaters until then: a "power play" for SJS. Over the last three seasons, about 1 power play in 5 ended in a goal. |
| 06:33 | BOS won the faceoff (Lindholm) | Why play stopped: A scheduled broadcast break. Play was already stopped. |
| 06:15 | BOS won the faceoff (Lindholm) |  |
| 05:18 | SJS shot on goal, saved (Smith) | Another shot from the slot: SJS's 3rd of the game. |
| 04:46 | BOS player hit an opponent (Borgen) |  |
| 04:40 | SJS won the faceoff (Ostapchuk) | Why play stopped: The puck went into a penalty bench and play stopped. |
| 04:31 | **SJS GOAL** (Trouba) | That ties the game, 1–1. |
| 04:31 | SJS won the faceoff (Ostapchuk) |  |
| 04:23 | SJS won the faceoff (Celebrini) |  |
| 04:20 | BOS shot on goal, saved (Lindholm) |  |
| 04:05 | SJS shot on goal, saved (Chernyshov) |  |
| 04:00 | BOS player hit an opponent (Zacha) | The puck has stayed in the BOS end for 3 events in a row; in that time SJS has 1 shot attempt and BOS 1. |
| 03:57 | SJS lost the puck (Smith) | The puck has stayed in the BOS end for 4 events in a row; in that time SJS has 1 shot attempt and BOS 1. |
| 03:37 | SJS player hit an opponent (Nurse) |  |
| 03:24 | BOS lost the puck (Zadorov) |  |
| 03:14 | BOS shot on goal, saved (Peterka) |  |
| 03:04 | BOS won the faceoff (Lindholm) | SJS may not change players for this faceoff: its 5 skaters stay on, 23 to 26 seconds into their shift. BOS sent out 5 fresh skaters. |
| 03:01 | BOS shot on goal, saved (Lohrei) |  |
| 02:09 | BOS won the faceoff (Minten) | SJS may not change players for this faceoff: its 5 skaters stay on, 15 to 33 seconds into their shift. |
| 01:49 | SJS player hit an opponent (Goodrow) |  |
| 01:47 | SJS player hit an opponent (Ostapchuk) | The puck has stayed in the SJS end for 3 events in a row; in that time BOS has no shot attempts. |
| 01:36 | SJS player hit an opponent (Goodrow) | Every SJS skater on the ice has been out longer than a typical shift (about 46 seconds): 48 to 66 seconds each. |
| 01:32 | BOS shot and missed the net (McAvoy) | That shot came from the slot, the area right in front of the net. About 1 shot in 9 from there goes in; from farther out, about 1 in 30. |
| 01:17 | **BOS GOAL** (McAvoy) | That puts BOS ahead, 2–1. The puck had stayed in the SJS end for 6 events in a row before it went in. |
| 01:17 | BOS won the faceoff (Poitras) |  |
| 01:06 | BOS lost the puck (Zadorov) |  |
| 00:47 | BOS player hit an opponent (Poitras) |  |
| 00:42 | BOS blocked a SJS shot (Kastelic) |  |
| 00:08 | BOS blocked a SJS shot (Brunet) | The puck has stayed in the BOS end for 3 events in a row; in that time SJS has 2 shot attempts. |
| 00:06 | BOS blocked a SJS shot (Lindholm) | The puck has stayed in the BOS end for 4 events in a row; in that time SJS has 3 shot attempts. |
