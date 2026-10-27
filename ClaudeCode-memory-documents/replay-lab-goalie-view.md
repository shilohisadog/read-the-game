---
name: replay-lab-goalie-view
description: "THE TRACKED GOAL's design history and every Kevin ruling (2026-10-19 → 21: ½→¼ speed, no trail, own the goal, plain-English recorded events, NO possession tags, labels 0.8 s game time at the recorded spot, first frame held 1.5 s, Pause/resume, Prev/Next stops, purple selected) — now LIVE in production (src/lib/tracked.js + app.js trk*). Also the LAB (lab branch → lab.read-the-game.pages.dev; ⚠️ still carries its own older copy of the tracked goal — strip before merging main) and the 3D goalie view, ⛔ STOPPED 2026-10-18 (docs/see-the-shot-3d.md)."
metadata:
  type: project
---

**The lab** (Kevin: prototype without touching production): branch `lab`, workflow
`.github/workflows/lab.yml` (exists only on that branch) builds, runs
`.github/lab_prep.py` (adds `/lab/lab.js` to the replay pages, loosens CSP: script-src
'self', style-src 'self' 'unsafe-inline' — hashes would forbid inline), deploys
`--branch lab`. Reads production data (R2 CORS allows *.read-the-game.pages.dev),
writes nothing. Index: `/lab/`. app.js on lab has two hooks: `window.LAB.frame()` at the
end of render and `window.LAB.extra(e)` in `dwell`. Never merge lab wholesale.

**Batch 2 built:** `viz=follow` (camera zooms to the zone), `viz=crease` inset;
`src/lab/shot.html` + `shot3d.js` = three.js (0.160.0 via jsdelivr importmap) full
rink in feet, shooter at recorded spot/height/handedness posed by recorded SHOT TYPE,
line of fire fading at the 6 ft crease, release then cut to SAVE/GOAL. Data:
`lab/prep_shots.mjs` from the league feed (frame from `homeTeamDefendingSide`).

**Kevin's rulings 2026-10-17:** realistic, nothing invented; line of fire must NOT reach
the goalie (tips/screens/height unknown — feed DOES tag tip-in/deflected, coordinate
= where tipped, median 13 ft vs wrist 32); mannequin figure does not work; production =
longer hold on goals + toggle to "goalie view" overlay; goals only.

**⏭ Before production:** licensed rigged hockey-player model + shot-type motions
(bring 2–3 candidates, licence, cost); keep `shotType` in extract.py (same re-extract
as ruling 7's `losingPlayerId`); hand/height nightly; self-host three.js (CSP); verify
LEFT/RIGHT against a highlight (Washe 55 ft goal, "30 ft to the goalie's right");
reconcile feed 28 vs extract 27 shots vs DiPietro.

**⛔ Trap I hit:** cleaning generated pages with `git checkout -- src/` REVERTED
uncommitted edits in src/lab and src/app.js. Clean only `'src/*.html'` + robots.txt,
and commit work before building. Also: `page()` window size ≠ viewport ([[looking-at-pixels]]).
Related: [[hockey-legibility-build]], [[measures-list]] (ruling 7).

**2026-10-18 update:** Kevin: the crease ("goalie's eyes") view does not reflect enough
realism AND implies a clean sight line — we don't know where the other skaters were
(true; situationCode gives only COUNTS). BROADCAST is the view now; crease seat removed;
"Behind the net" kept. Shooter = Quaternius Universal Base Characters (CC0, Standard
free tier via itch; `src/lab/models/ubc/`, LICENSE.txt) dressed in gear that follows
bones (`src/lab/player.js`, two-bone IK from POSES). Kevin: "the broadcast view was also
lacking a goalie" → `makeGoalie`: the recorded goalie (height, catching hand from
/player/{id}/landing), in his crease 2.5 ft out squared to the shooter, ready stance,
never a save motion (position not recorded; disclosed in "What's real?"). On screen:
"5-on-5 · the other 9 skaters were on the ice too; where isn't recorded." Button renamed
"▶ See the shot" (name still Kevin's call). Kevin's plan: implement, THEN decide whether
it's worth keeping. ⛔ I once built on MAIN by mistake after switching back — check
`git branch --show-current` before writing lab files. The league API 429s bursts:
prep_shots.mjs throttles.

**⛔ 2026-10-18 CONCLUDED — STOPPED.** Kevin, on the broadcast screenshot (McQueen 4 ft backhand,
shooter and goalie drawn inside each other): *"we gave it a good try and it just doesn't work
for us … it was worth the time and excursion."* Why (docs/see-the-shot-3d.md §3): every figure
is an invention (goalie position, empty lane), close shots are where goals cluster, realism
costs paid/branded assets, and the NHL highlight (93.4% of goals) is one tap away.
**KEPT (status §0.00):** (1) `shotType` in extract.py + said by the color line — rides with
ruling 7's re-extract; (2) distance labelled on the 2D goal line. The lab branch and its
deploy stay up as the place for future prototypes.

## ✅ 2026-10-19 — THE TRACKED GOAL (iteration 1, lab only, `src/lab/tracked.js`)
Kevin: "it just happens", ½ speed, OVERLAID on the same rink (not a switch). While playing, on the step into the
~9 s before a goal, the league's tracked players + puck are drawn over the rink, play marks + the replay's own
goaltenders dim, the clock counts down, in-window events are tagged ("Shot on goal"), then it jumps to the goal
frame (in-window events are not replayed). Stepping/scrubbing/reduced motion → "▶ See it tracked" button.
Lab hooks added to app.js (lab only): `LAB.next(i)` in step(), `LAB.extra(e, base)`, `AX/AY` passed to frame.
Finds a goal's file via `track/<game>/goals.json` (period+clock+scorer → event). Away team = WHITE dots with a
coloured rim (the away team wears white; fixes TBL-vs-NYR both-blue). ⚠️ The replay itself has that same-colour
clash (AWAYCOL/HOMECOL are raw colourOf) — flagged to Kevin, not fixed. 10 fps CONFIRMED: timeStamp is epoch
tenths (2025020002 frame 0 = 00:42 UTC 2025-10-08). Test: lab /game?game=2026020010&at=1-14:50, press Play.
**Iteration 2 (2026-10-20):** Kevin chose (a) OWN IT — name line "Tracked · #93 Zibanejad's goal", commentary "The last
9 seconds before the goal … NYR has a power play: 5 skaters to TBL's 4." (empty net / short-handed too, from the
goal's `sit`). Kevin: the PP is the obvious teaching moment I MISSED, and must be in PROSE not just the scoreboard.
His "it hit the post" was a SAVE + REBOUND per the record (shot-on-goal 5:32, puck back out 18 ft, goal 1.6 s later;
a post is missed-shot reason "hit-post"); tracking can't say pad vs post. ⏭ Kevin watches varied goals (lab index:
"tracked goals to watch", 14 picks by category) BEFORE we choose teaching moments. Also wants it in the HERO game.
Dots: skater 2.7 ft / goalie 3.4 ft across vs ~1.7–2 ft / ~3 ft real — centres exact, size ~1.4× for a legible
number (told Kevin it's NOT exactly to scale). No smoothing (invention) — Kevin agrees.
Season 2026-27 tracked goals (n=1,171 in 199 games): 804 even, 284 PP, 27 SH, 56 empty net, 107 rebounds ≤3 s,
131 tips/deflections, 115 from 45+ ft.

**2026-10-21:** puck trail REMOVED (Kevin: "snail trail … distracting" — show only the puck). Lab merged
the mirror fix, so the tracked goal plays the league's way round; `lab/tracking.html` fixed too
(`SX(-f*p.x)`). Lab app.js hooks: `LAB.next(i)`, `LAB.extra(e, base)`, `AX/AY` in `LAB.frame`.

**2026-10-21 (later):** ¼ speed (Kevin: a novice needs time); the play's numbers (.evn/.whn/.zsn/.shotft) are
HIDDEN during tracking (Kevin: focus on the play). **GOALS MODE** built on the lab (Kevin's idea — the text
replay's novice value is weak; tracking may be the core): `Replay: All events | Goals` beside Play, `?replay=goals`,
`tracked.js` `goals` object, no new app.js hooks (Prev/Next caught in capture phase on their .grp; scrubber
oninput/onchange wrapped to snap to goals; jumps go through the goal ticks). Verified by CDP probe on
2026020144 (LAK 5-2 WSH). ⚠️ A lab link with NO `at=` lands at pre-game (i=-1) and `goalAhead` read EV[-1].per
→ the shell error page, while a text-only probe read healthy DOM underneath: SCREENSHOT, not just DOM reads.
Open for Kevin: default mode? production? the held event's dim label + scorer name overlap a dot.
**2026-10-21 (Goals mode, round 2):** selected mode/speed text PURPLE (#7c3aed, like "Replay"), others black;
Goals mode hides all event numbers and REMOVES (not dims) the play's marks while tracking; `Speed: ¼|½|Real time`
(restarts the current goal at the new speed). ⛔ RULED OUT (Kevin agreed): "X has the puck" possession tags from
tracking — nearest-to-puck is not possession, any threshold is ours ("walking a fine line"). INSTEAD: the line names
the league's RECORDED events in the tracked seconds in plain English ("Recorded by the league in these 10 seconds:
a hit by #14 Laferriere (LAK) behind the WSH net."), or "The league recorded nothing else in these N seconds: watch
the puck."; labels last 1.5 s of GAME time; kept inside the boards. Kevin: plain English, never "hockey speak".
Case: Panarin 19:58 P1 (2026020144) — Kevin saw a WSH turnover; the league logged NONE (raw feed checked).
⚠️ GitHub sometimes never starts the lab run on push — dispatch `gh workflow run lab.yml --ref lab` and curl
the served file for a marker before probing.
**Handover (2026-10-21):** the held event before tracking was 11–46 s before the goal (5 of 7 goals ≥28 s) and
the green next-play cue marks the next RECORDED event (often the goal itself), not where tracking starts. Goals
mode now opens each goal on the first tracked frame held still 1.5 s ("10 seconds before the goal. The black dot
is the puck."), cue never drawn; All events hides the cue (`labnocue`) on the frame tracking takes over from —
re-asked when the file arrives (it was loading DURING that frame's pause), file prefetched across face-offs.
Labels: 0.8 s game time (Kevin: half), at the event's RECORDED spot, anchored away from the nearest boards.
**PRODUCTION 2026-10-21:** ported (not merged) — lab's `src/lab/tracked.js` + hooks became `src/lib/tracked.js` (pure)
+ `app.js` `trk*` (state near REDUCED, functions after `$('play').onclick`), controls in build_main.py markup
(`#trkMode/#trkSpeed`, `<g id="track">`), CSS in app.css (`--track:#7c3aed`, classes `trk/trkgoals/trknocue`).
Line now says "as the league tracked them". The lab branch still carries its own copy — don't merge main into lab
blindly any more (two overlays would run); retire the lab copy or keep lab for new prototypes only.

**2026-10-26 — ONE GOAL, ONE STOP (Kevin, `284b2ae`):** the goal happened at the crossing frame, so a goal-line stop
followed by a goal-frame stop showed it twice. In GOALS mode the goal frame is the goal's only stop and holds the
tracking's goal-line picture (`trkRest`, class `trkrest` — not `trk`, nothing runs); banner moved to the puck via
`drawLabel(e,at)`; the goal-line stop is filtered out of `run.stops` in Goals. Walk: first → events → shot → GOAL →
next goal. No tracking file → old goal frame. ALL EVENTS deliberately unchanged (event-by-event view). Open: the big
goal banner can sit over a tracked dot or two.

**2026-10-26 — GOALS IS THE DEFAULT on a PLAIN VISIT (Kevin, `be30e48`):** plain = a game link with no `at=` and no
`summary=1` (home page, hero, team pages, calendar, Other games, a bare pasted link) — defined by the LINK, not the
referrer. Moment links (every lesson door, shared moments) keep All events unless `replay=goals`; `replay=all` forces
All events (written on choosing it on a plain visit; pre-game share in All events writes it). No tracked goals →
All events (`trkControl`). Greeting is mode-aware (Kevin approved the Goals wording). Same day: banner on the goal
stop moved to the other half, no leader (`840917f`); scrubber no longer snaps to goals in Goals mode; lanes from
20 ft (`TRACK_LANE_FT`=20 visual; `TRACK_RELEASE_FT`=30 decides the moment rule, `ae277e9`).
