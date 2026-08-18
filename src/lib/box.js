/**
 * The penalty box — who is sitting in it, and when he gets out.
 *
 * THIS IS NOT A STRENGTH MODEL, AND THE DISTINCTION IS THE WHOLE FILE.
 * `situationCode` already tells the app how many skaters each side has, and it
 * keeps that job. What it cannot tell you is WHO is in the box, or that anybody
 * is: coincidental majors after a fight put two players in the box and leave the
 * ice at five a side, so a box driven by `sit` would show an empty one during a
 * fight's aftermath. Measured over 39 archive games, a penalty queue predicts
 * `sit` at only 98.9% -- and the residual is Rule 19 manpower arithmetic that
 * this file deliberately does not attempt. Occupancy and strength are different
 * questions and the answer to one is not the answer to the other.
 *
 * WHAT IS RECORDED AND WHAT IS DERIVED, stated plainly because only one line
 * here is derived at all:
 *
 *   recorded   who took it (`actor`), whose box (`own`), what it was (`pen`),
 *              how long was assessed (`min`), how severe (`sev`)
 *   derived    ONE thing -- that a minor ends early when its team is scored on
 *
 * `min` IS WHAT WAS ASSESSED, NEVER WHAT WAS SERVED. In the reference game BUF
 * are penalised at 18:34 of the first period, MIN score at 19:30, and the next
 * event reads even strength: two minutes assessed, FIFTY-SIX SECONDS served. A
 * box driven by `min` alone holds a player on screen for another 64 seconds
 * while the ice shows him back over the boards.
 *
 * THE RELEASE RULE, and its second condition is the one that is easy to miss:
 *
 *   1. the scoring team had MORE skaters at that instant (from `sit` on the
 *      goal event itself -- read, not predicted)
 *   2. the OTHER team actually has a live minor in the box
 *   3. release the earliest of them
 *
 * Condition 1 is why a SHORT-HANDED goal changes nothing: the team serving the
 * penalty scored, so it fails immediately and the player stays. Verified across
 * 39 games -- 25 goals scored while short, ZERO releases; 52 scored with the
 * advantage, 45 releases.
 *
 * Condition 2 exists because FEWER SKATERS IS NOT THE SAME AS PENALISED. Of
 * those 25 short-handed goals, 15 were `0651` or `1560` -- a goalie pulled for
 * an extra attacker, no penalty anywhere. Without this condition the rule goes
 * looking for a penalty to release that does not exist. It was written only
 * because those cases showed up in a count.
 *
 * A MAJOR IS NEVER ENDED BY A GOAL (rule 20.4), which is why `sev` is consulted
 * rather than duration. The first version of this released any penalty and would
 * have emptied the box on a fighting major.
 */

/**
 * Penalty types that do NOT put a player in the box, despite carrying a record.
 *
 * NAMED AS AN EXCLUSION, NOT A WHITELIST. A list of types that DO count would
 * silently drop any code the league adds -- box time simply missing, with
 * nothing on screen to notice. Excluding the two known exceptions means an
 * unfamiliar code shows up in the box, where it is visible and can be fixed.
 * Both were observed in a 39-game sample: 231 MIN, 15 MAJ, 15 MIS, 1 GAM, 1 PS.
 */
const NOT_BOX = new Set([
  // Taken on the ice. Nobody sits -- and it carries `min: 0` in any case, so it
  // is excluded twice over.
  'PS',
  // An ejection. The dressing room, not the penalty box.
  'GAM',
]);

/** Only a MINOR can be ended early by a goal. */
const ENDS_ON_GOAL = 'MIN';

/**
 * Every stint in the box, in the order the penalties were called.
 *
 * @param {Array} events  the game's events, in play order
 * @param {{homeId:number, awayId:number}} ctx
 * @returns {Array<{player, team, start, end, min, sev, pen, endedBy}>}
 *   `start`/`end` are elapsed seconds; `endedBy` is 'time' or 'goal'.
 */
export function stints(events, ctx) {
  const { homeId, awayId } = ctx;
  const all = [];

  for (const e of events) {
    if (e.type === 'penalty' && e.min && e.actor != null && e.own != null) {
      // A penalty with no duration is not box time -- a penalty shot carries
      // `sev: 'PS'` and no `min`, and it belongs on the ice, not in here.
      if (e.sev && NOT_BOX.has(e.sev)) continue;
      all.push({
        player: e.actor, team: e.own, start: e.s, end: e.s + e.min * 60,
        min: e.min, sev: e.sev || null, pen: e.pen || null, endedBy: 'time',
      });
      continue;
    }

    if (e.type !== 'goal' || e.pt === 'SO') continue;
    // A shootout goal is not play and cannot release anybody.
    if (!e.sit || e.sit.length !== 4 || e.own == null) continue;

    const away = +e.sit[1], home = +e.sit[2];
    if (!Number.isFinite(away) || !Number.isFinite(home)) continue;
    // A PENALTY SHOT IS NOT A POWER PLAY, and `sit` does not say so in words:
    // it reads `1010` or `0101` -- one shooter against one goalie -- which
    // condition 1 would happily read as the largest advantage in hockey. Rule
    // 24.2: a goal scored on a penalty shot does NOT terminate a minor penalty
    // being served. The same one-against-one shape that `extract.py`'s
    // `situation_ok` recognises, and it occurs in REGULATION as well as a
    // shootout -- one in a 39-game sample, which released nothing only because
    // no minor happened to be live at the time. That is luck, not a guard.
    if ((away === 0 && home === 1) || (away === 1 && home === 0)) continue;

    const scored = e.own === awayId ? away : home;
    const against = e.own === awayId ? home : away;
    if (against >= scored) continue;                    // (1) short-handed goal

    const opp = e.own === awayId ? homeId : awayId;
    const live = all
      .filter(s => s.team === opp && s.sev === ENDS_ON_GOAL
                   && s.start <= e.s && s.end > e.s)
      .sort((a, b) => a.start - b.start || a.end - b.end);
    if (!live.length) continue;                         // (2) nobody to release

    live[0].end = e.s;                                  // (3) the earliest one
    live[0].endedBy = 'goal';
  }
  return all;
}

/**
 * Who is in a team's box at one instant.
 *
 * A player enters ON the penalty event -- `start <= secs` -- which is where a
 * viewer expects to see him go, even though `sit` on that same event still
 * reports the strength BEFORE the penalty takes effect.
 */
export function occupants(all, secs, teamId) {
  return all.filter(s => s.team === teamId && s.start <= secs && s.end > secs)
            .sort((a, b) => a.start - b.start);
}
