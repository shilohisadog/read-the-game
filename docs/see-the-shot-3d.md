# See the shot in 3D — tried, and stopped

**2026-10-17/18. Status: STOPPED by Kevin.** The code is parked on the `lab` branch
(`src/lab/`, `lab/prep_shots.mjs`); nothing on `main` depends on it. Two findings are
kept and are on the to-do list (§5).

## 1. The question

Kevin: *"We know the coordinates where a shot on goal (and by extension a goal) occurs, I
would think we'd be able to show the shot from the goalie's perspective, with a high
level of realism."* The September goaltender's-eye page (deleted 2026-09-17) had been very
rough; this was the attempt to do it properly, without inventing anything.

## 2. What was built, in the lab

All of it at `lab.read-the-game.pages.dev` (the lab: a branch preview on production data
that writes nothing; `.github/workflows/lab.yml` exists only on the `lab` branch).

| Step | What | Verdict |
|---|---|---|
| 1 | Canvas rebuild of the goaltender's view (`crease.js`): full sheet, true-height figures, four seats | Far better than September; still flat |
| 2 | three.js scene (`shot3d.js`, `shot.html`): rink in feet, boards, glass, stands, both nets, arena light | Good — the environment was never the problem |
| 3 | Shooter at his recorded spot, height and handedness, posed by the recorded shot type; line of fire fading at the crease; cut from release to SAVE/GOAL | The idea holds; the hand-built figure was a mannequin |
| 4 | In the replay: a goal holds 3 s longer; a button beside the NHL highlight opens the shot | The flow worked |
| 5 | Broadcast seat first; crease seat removed | Better than the crease |
| 6 | A real rigged body (Quaternius Universal Base Characters, **CC0**) in hockey gear following its bones; two-bone IK poses; the goaltender who was in net added | Read as a hockey player at a distance; failed up close (§3) |

## 3. What we found

1. **The crease view implied something false.** An empty sight line says *the goalie had a
   clean look*. The feed records how many skaters were on the ice (`situationCode`) and
   never where they stood; skater coordinates are not public (Doctrine §5). Kevin: *"there
   could have been players in between the shot and the goalie, true?"* True — so the
   crease seat was dropped, and every shot stated the count on screen.
2. **Every figure is an invention, and the realer it looks the bigger the claim.** The
   goaltender's position, his stance, the shooter's technique: none is recorded. On
   McQueen's 4 ft backhand the shooter and the goaltender (placed 2.5 ft out, a guess)
   were drawn inside each other — and close shots are where goals cluster (six games,
   shots on goal: tip-ins median 13 ft, backhands 9 ft, wrist 32 ft, slap 49 ft).
3. **Realism has a cost we should not pay.** No free hockey-player model exists; the
   rigged NHL-style ones are paid, often editorial-only, and carry team branding. A
   CC0 body dressed in code still showed bare feet, a broken stick and boxy gear.
4. **The real thing is one tap away.** 93.4% of goals carry the league's own highlight
   video, beside the button. A reconstruction competes with footage on realism and loses.

Kevin, 2026-10-18: *"I think we gave it a good try and it just doesn't work for us … it
was worth the time and excursion."*

## 4. Things learned along the way that stand on their own

- **The feed records the shot type** (`details.shotType`: wrist, snap, slap, backhand,
  tip-in, deflected, wrap-around, bat). `extract.py` drops it today. A tip-in's coordinate
  is **where it was tipped**; the original shot is not a separate event, so its origin is
  lost.
- **Distance and angle are the one thing the view taught that is fully recorded.**
- The September goaltender's-eye code mirrored one net: it used `y` as left/right at both
  ends, so one goaltender's shots were drawn on the wrong side. The stored frame (home
  always defends x = −89, a rotation) makes the correct mapping trivial.
- `api-web.nhle.com` answers bursts with 429; anything fetching per player must throttle.
- Player records carry `shootsCatches` and `heightInInches`.
- Unresolved, for the record: the feed listed 28 shots on DiPietro (2026020120) where our
  extract has 27; and whether the feed's `y` matches the building's left/right was never
  checked against video.

## 5. Kept, and on the to-do list

1. **Shot type in the record.** Keep `shotType` in `extract.py` and let the color line
   say it (*"a wrist shot from the slot"*, *"tipped in front"*). Same re-extract and full
   re-derive as ruling 7's `losingPlayerId`, so one run carries both.
2. **Distance on the 2D rink.** The replay already draws the dashed line from a goal to
   the net; label it with the distance (*"55 ft"*). No person drawn, nothing invented.
