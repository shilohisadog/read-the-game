/**
 * Control (Corsi) — shot attempts, as a reduction over the event stream.
 *
 * Lifted out of the app unchanged in Phase 1. Behaviour is pinned frame-by-frame
 * against test/fixtures/phase1-golden.json, captured from the shipped
 * implementation before the move, so "the refactor preserves behaviour" is a
 * measurement rather than a belief.
 *
 * Corsi counts every attempt on goal: goals, shots on goal, shots that missed,
 * and shots that were blocked. It is a rough proxy for which team had the puck
 * in the other team's end, which is why the app calls it "control" rather than
 * its real name -- a novice has no reason to know what a Corsi is.
 *
 * Three things about the shape, all of which Phase 2 changes deliberately:
 *
 *   - `excluded` counts by type rather than listing event ids. Conservation over
 *     counts is weaker than conservation over ids, and Phase 2 fixes that.
 *   - The caller passes an already-filtered event list. The app drops 51 events
 *     upstream of this function, so the ledger here is honest about what it sees
 *     and silent about what it never saw. Phase 2 binds it to the full game.
 *   - `surprising` is populated by a hardcoded rule (blocked shots) rather than
 *     carrying its own explanation. Phase 2 gives it {id, why, derivedFrom}.
 *
 * None of that is fixed here on purpose: Phase 1 moves code, it does not change
 * what the screen says.
 */
import { corsiTeam } from '../attribution.js';

/**
 * @param events  the events to reduce, in order
 * @param ctx     { roster, homeId, awayId }
 * @returns { t, counted, surprising, excluded, hs, as }
 *   t           attempts per team id
 *   counted     attempts a novice would expect to count
 *   surprising  attempts that count but look like they shouldn't -- blocked
 *               shots, which belong to the SHOOTER (see attribution.js)
 *   excluded    { eventType: count } for everything that is not an attempt
 *   hs / as     goals, home and away, for the scoreboard
 */
export function corsiLens(events, ctx) {
  const { roster, homeId, awayId } = ctx;
  const t = { [homeId]: 0, [awayId]: 0 };
  const counted = [], surprising = [], excluded = {};
  let hs = 0, as = 0;

  for (const e of events) {
    if (e.type === 'goal') (e.own === homeId ? hs++ : as++);

    const team = corsiTeam(e, roster);
    if (team == null) {
      excluded[e.type] = (excluded[e.type] || 0) + 1;
      continue;
    }
    t[team]++;
    (e.type === 'blocked-shot' ? surprising : counted).push(e);
  }
  return { t, counted, surprising, excluded, hs, as };
}
