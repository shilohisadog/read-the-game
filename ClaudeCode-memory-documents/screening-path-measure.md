---
name: screening-path-measure
description: Kevin's screening teaching moment for the tracked goal (2026-10-22) — the doctrine-safe framing (players in the puck's path, never "attempting to screen") and the measurement over this season's tracked goals. Open before building it.
metadata:
  type: project
---

Kevin's idea: highlight players screening the goalie / placed to tip. ⛔ "attempting to screen" is INTENT (same
trap as "has the puck"). Framing agreed in principle: the triangle puck → both posts at the shot moment; ring every
skater inside (both teams; shooter and goaltenders excluded); say who stood between the puck and the net.

**Measured 2026-10-22** (scratchpad `screen.mjs`; 1,229 of 1,252 tracked 2026-27 goals; 21 no plan, 2 no location):
- Shot moment = tracked frame with the puck nearest the recorded shot spot: median 1.2 ft apart, 90.6% within 3 ft —
  the two records agree. Median 0.4 s before the goal line.
- Anyone in the path: 16.6% (centre strictly inside) / 22.5% (within 1 ft). Attacker 8.3% / 11.3%; defender
  12.9% / 19.0%.
- STEEP by distance: under 15 ft 4.3%; 15–30 19.5%; 30–45 46.7%; 45+ ft 62.4% (attacker 46.2%). Slap shots 49%,
  backhands/tips ~5%.
- ⚠️ Goals only (no tracking for saved shots) → can never say screens HELP goals go in.
Policies the page must declare: the shot-moment rule, the 0 vs 1 ft margin.
**✅ LIVE 2026-10-23 (`c384944`) — Kevin's design:** a see-through triangle (no rings: the viewer infers who is
inside; no 0/1 ft policy needed), FIXED at the shot moment until the goal line (doesn't change shape while
stepping), goals with recorded distance > 30 ft only; the shot is a Goals-mode Prev/Next stop. `trackShot` in
tracked.js. ⛔ The "nearest frame to the recorded spot" rule was WRONG on Panarin (picked 0.7 s early, mid-carry;
real release 8 ft from the league's spot) — the 1.2 ft median above was partly an artifact. Shipped rule: the
release (puck carry ≤3.5 ft/tenth → faster, or a >45° turn while fast) nearest the recorded spot: within 3 ft on
79% / 6 ft on 90% of the 323 goals beyond 30 ft. 3.5, 45 and 30 are declared choices. ⚠️ The in-path % above
used the nearest rule; with releases they rise (any-in-path 33% at 1 ft overall) — re-measure before quoting.
**2026-10-23 (`de99908`, Kevin: consistency):** a shot stop on EVERY located goal. <=30 ft = the frame nearest the recorded spot (the release rule fails close in: slow pokes/rebounds; nearest is within 3 ft on 88% of 908, median 0.3 s before the line); >30 ft = the release. Lane only >30 ft (`shot.lane`).
**2026-10-23 (`72ced43`):** LIGHT LANE (Kevin: see a screen develop / an unused lane): dashed, light (`.tlane.live`), follows the puck while it is in the scoring team's end (past the blue line) AND > 30 ft from the net (`trackLaneAt`); darkens and holds at a long goal's shot. Line names the end in plain words ("in the WSH end", never "attacking zone"). First version was too faint (fill .08) — raised to .11 after looking.
Related: [[replay-lab-goalie-view]], [[hockey-legibility-build]].
