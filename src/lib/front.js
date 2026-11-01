/**
 * The front door's selections from catalog rows. The pipeline runs these to
 * write `front.json`; the pages run the same functions until they read it.
 */
import { inScope } from './scope.js';
import { typeOf, isClubGame } from './competitions.js';

/** The teams the archive holds an in-scope game for; never a typed list. */
export function teamsIn(games) {
  const seen = {};
  for (const g of games || []) {
    if (!inScope(g.id)) continue;
    // A row whose boxscore was unreadable has no teams to name.
    if (g.a) seen[g.a] = 1;
    if (g.h) seen[g.h] = 1;
  }
  return Object.keys(seen).sort();
}

/**
 * The front-door game: the newest viewable club game with an `hl` (a first goal
 * the loop can end on), else the newest viewable. The hero plays that goal as
 * tracked, so how far into the game it came no longer matters (Kevin, 2026-11-01).
 * Preseason may be the hero (Kevin, 2026-09-21); `hl` is the real filter.
 */
export function heroOf(games) {
  const v = (games || []).filter(g => g.v && isClubGame(typeOf(g.id)));
  v.sort((a, b) => (a.d === b.d ? a.id - b.id : (a.d < b.d ? -1 : 1)));
  for (let k = v.length - 1; k >= 0; k--) {
    const g = v[k];
    if (typeof g.hl === 'number') return { game: g, toGoal: true };
  }
  return v.length ? { game: v[v.length - 1], toGoal: false } : null;
}

/** The newest viewable game of any kind: newest date, then highest id. */
export function newestOf(games) {
  let best = null;
  for (const g of games || []) {
    if (!g.v) continue;
    if (!best || g.d > best.d || (g.d === best.d && g.id > best.id)) best = g;
  }
  return best;
}
