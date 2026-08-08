/**
 * High danger — a geometric RULE, not a model.
 *
 * Doctrine §7: inside 33 feet of the attacking net and inside the slot (|y| ≤ 22).
 * A rule, because a viewer can check it with a ruler; expected goals is a model
 * and is the thing this project exists as an alternative to.
 *
 * The exclusions carry the measurement, not just the verdict — "48 ft from the
 * net" teaches where the line is, "not high danger" teaches nothing.
 */
import { shootingTeam, SHOT_TYPES } from '../attribution.js';
import { attackDirection, distanceToNet, HIGH_DANGER_FT, SLOT_HALF_WIDTH } from '../rink.js';
import { NOT_A_PLAY } from '../layer.js';
import { whyNotEven } from '../strength.js';

export const danger = {
  id: 'danger',
  label: '＋ High-danger',

  reduce(events, ctx) {
    const counted = [], surprising = [], excluded = [];

    const push = (id, dims) =>
      excluded.push({ id, why: dims.type || dims.strength, dims });

    events.forEach((e, id) => {
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;
      if (!SHOT_TYPES.has(e.type) || e.x == null) {
        push(id, { type: e.type === 'blocked-shot'
                 ? 'blocked before it got there — no shot location on the net'
                 : NOT_A_PLAY[e.type] || `not a shot on the net (${e.type})`,
                   ...(notEven ? { strength: notEven } : {}) });
        return;
      }
      if (notEven) { push(id, { strength: notEven }); return; }
      const team = shootingTeam(e, ctx.roster);
      if (team == null) {
        push(id, { type: 'shooter not identified in the feed' });
        return;
      }

      const d = distanceToNet(e.x, e.y, attackDirection(team, ctx.homeId));
      const near = d <= HIGH_DANGER_FT;
      const central = Math.abs(e.y) <= SLOT_HALF_WIDTH;

      if (near && central) {
        counted.push(id);
        if (e.type === 'missed-shot') {
          surprising.push({
            id,
            why: 'it missed the net and still counts — danger is about where the '
               + 'chance came from, not whether it went in',
            derivedFrom: `distance=${d.toFixed(1)}ft, |y|=${Math.abs(e.y)}`,
          });
        }
        return;
      }
      push(id, {
        type: !near && !central
               ? `${d.toFixed(0)} ft out and wide of the slot (|y|=${Math.abs(e.y)} ft)`
           : !near
               ? `${d.toFixed(0)} ft from the net — outside the ${HIGH_DANGER_FT} ft line`
               : `in close but wide — |y|=${Math.abs(e.y)} ft, outside the ${SLOT_HALF_WIDTH} ft slot`,
      });
    });

    return { counted, surprising, excluded };
  },
};
