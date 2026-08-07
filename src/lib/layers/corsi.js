/**
 * Control (Corsi) — shot attempts, as a reduction over the whole game.
 *
 * Corsi counts every attempt on goal: goals, shots on goal, shots that missed,
 * and shots that were blocked. It is a rough proxy for which team had the puck
 * in the other team's end, which is why the app calls it "control" rather than
 * its real name — a novice has no reason to know what a Corsi is.
 *
 * Phase 2: reduces the FULL event stream and accounts for every event. See
 * ../layer.js for why that matters.
 */
import { corsiTeam, ATTEMPT_TYPES } from '../attribution.js';
import { NOT_A_PLAY } from '../layer.js';

const NOT_AN_ATTEMPT = {
  hit: 'a hit — physical play, but not a shot attempt',
  faceoff: 'a faceoff — possession changes, no attempt on goal',
  giveaway: 'a giveaway — losing the puck is not a shot',
  takeaway: 'a takeaway — winning the puck is not a shot',
  penalty: 'a penalty — changes the game, but is not an attempt',
};

export const corsi = {
  id: 'corsi',
  label: '＋ Control (Corsi)',

  /**
   * @param events  the whole game, in order
   * @param ctx     { roster, homeId, awayId }
   */
  reduce(events, ctx) {
    const { roster, homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 };
    const counted = [], surprising = [], excluded = [];
    let hs = 0, as = 0;

    events.forEach((e, id) => {
      if (e.type === 'goal') (e.own === homeId ? hs++ : as++);

      const team = corsiTeam(e, roster);
      if (team == null) {
        excluded.push({
          id,
          why: NOT_AN_ATTEMPT[e.type] || NOT_A_PLAY[e.type] || `not an attempt (${e.type})`,
        });
        return;
      }
      t[team]++;
      counted.push(id);

      if (e.type === 'blocked-shot') {
        // The one place a novice's intuition points the wrong way — and the
        // place this project once shipped a wrong number with a confident
        // explanation attached. `derivedFrom` is what makes it checkable.
        const p = roster[e.actor];
        surprising.push({
          id,
          why: `blocked, but it still counts — an attempt belongs to the SHOOTER`
             + `${p ? `, ${p.nm}` : ''}, not the player who blocked it`,
          derivedFrom: `roster[event.actor].tid (actor=${e.actor})`,
        });
      }
    });

    return { t, counted, surprising, excluded, hs, as };
  },
};

/** Attempt types, re-exported so callers need not reach into attribution. */
export { ATTEMPT_TYPES };
