/**
 * Goaltending — save percentage, built as the game plays.
 *
 * The teaching point: Minnesota outshot Buffalo 35–25 and lost, because Levi
 * stopped 33 of 35 and Gustavsson stopped 22 of 25. The score is an outcome,
 * not a description of the game.
 *
 * A "shot faced" is shots on goal PLUS goals — the same trap as the SOG counter.
 * A goal is a shot the goalie faced and did not stop; counting only
 * shot-on-goal events understates every workload by the goals allowed.
 *
 * Doctrine §8 governs anything displayed from this: a save percentage without a
 * base rate is a story, not a measurement.
 */
import { shootingTeam, SHOT_TYPES } from '../attribution.js';
import { attackDirection, isHighDanger } from '../rink.js';
import { NOT_A_PLAY, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';

/** Geometric rule, measured to the ATTACKING net. */
export function isHighDangerEvent(e, ctx) {
  if (!SHOT_TYPES.has(e.type) || e.x == null) return false;
  const team = shootingTeam(e, ctx.roster);
  if (team == null) return false;
  return isHighDanger(e.x, e.y, attackDirection(team, ctx.homeId));
}

export const goaltending = {
  id: 'goaltending',
  label: '＋ Goaltending',

  reduce(events, ctx) {
    const g = {};
    const counted = [], surprising = [], excluded = [];

    events.forEach((e, id) => {
      // A shootout attempt IS a shot a goalie faced, which is exactly why this
      // has to come first: nothing about the event's type disqualifies it, and
      // counting it would put shootout attempts into a save percentage the
      // league does not compute that way.
      const notPlay = inShootout(e);
      const faced = (e.type === 'shot-on-goal' || e.type === 'goal') && e.goalie;
      const notFaced = faced ? null
        : e.type === 'missed-shot' ? 'missed the net — no goalie faced it'
        : e.type === 'blocked-shot' ? 'blocked by a skater — it never reached the goalie'
        : NOT_A_PLAY[e.type] || `not a shot the goalie faced (${e.type})`;
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;

      if (notPlay || notFaced || notEven) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notFaced) dims.type = notFaced;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notFaced || notEven, dims });
        return;
      }
      counted.push(id);

      const k = e.goalie;
      g[k] = g[k] || { f: 0, s: 0, gl: 0, hf: 0, hs: 0 };
      g[k].f++;
      const hd = isHighDangerEvent(e, ctx);
      if (e.type === 'goal') {
        g[k].gl++;
        if (hd) g[k].hf++;
      } else {
        g[k].s++;
        if (hd) { g[k].hf++; g[k].hs++; }
      }

      if (e.type === 'goal') {
        surprising.push({
          id,
          why: 'a goal counts as a shot faced — it is a shot the goalie did not stop',
          derivedFrom: `event.type === 'goal', goalie=${e.goalie}`,
        });
      }
    });

    return { g, counted, surprising, excluded };
  },
};
