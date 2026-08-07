/**
 * Goaltending — save percentage, built as the game plays.
 *
 * Lifted out of the app unchanged in Phase 1 and pinned frame-by-frame against
 * test/fixtures/phase1-golden.json.
 *
 * The teaching point this layer exists for: in the reference game Minnesota
 * outshot Buffalo 35-25 and lost, because Levi stopped 33 of 35 and Gustavsson
 * stopped 22 of 25. The score is an outcome, not a description of the game.
 *
 * Note what a "shot faced" is here, because it is the same trap as the SOG
 * counter: shots on goal PLUS goals. A goal is a shot the goalie faced and did
 * not stop. Counting only shot-on-goal events would understate every workload
 * by exactly the number of goals allowed.
 *
 * Doctrine section 8 applies to anything built on this: a save percentage
 * displayed without a base rate is a story, not a measurement. Levi's 18-for-18
 * at even strength is a normal night for a league-average goalie -- about one
 * start in five -- and rendering it as `1.000` would invite a novice to read a
 * rate where there is only a small sample.
 */
import { shootingTeam, SHOT_TYPES } from '../attribution.js';
import { attackDirection, isHighDanger } from '../rink.js';

/** Is this a high-danger chance? Geometric rule, measured to the ATTACKING net. */
export function isHighDangerEvent(e, ctx) {
  if (!SHOT_TYPES.has(e.type) || e.x == null) return false;
  const team = shootingTeam(e, ctx.roster);
  if (team == null) return false;
  return isHighDanger(e.x, e.y, attackDirection(team, ctx.homeId));
}

/**
 * @param events  the events to reduce, in order
 * @param ctx     { roster, homeId }
 * @returns { [goalieId]: { f, s, gl, hf, hs } }
 *   f   shots faced      (shots on goal + goals)
 *   s   saves
 *   gl  goals allowed
 *   hf  high-danger chances faced
 *   hs  high-danger saves
 */
export function goaltendingLens(events, ctx) {
  const g = {};
  for (const e of events) {
    if (!(e.type === 'shot-on-goal' || e.type === 'goal') || !e.goalie) continue;

    const id = e.goalie;
    g[id] = g[id] || { f: 0, s: 0, gl: 0, hf: 0, hs: 0 };
    g[id].f++;

    const hd = isHighDangerEvent(e, ctx);
    if (e.type === 'goal') {
      g[id].gl++;
      if (hd) g[id].hf++;
    } else {
      g[id].s++;
      if (hd) { g[id].hf++; g[id].hs++; }
    }
  }
  return g;
}
