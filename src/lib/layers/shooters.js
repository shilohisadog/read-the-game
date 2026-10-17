/**
 * WHO SHOOTS — of every shot attempt, the ones a defenceman took (Kevin's ruling
 * 5, 2026-10-17). Holds steady in 23 games and is nearly independent of who had
 * the puck (`docs/what-settles.md`). Same attempts as `corsi`; `counted` is the
 * defencemen's, and a forward's attempt is excluded on its own dimension.
 */
import { corsiTeam } from '../attribution.js';
import { NOT_A_PLAY, NOT_AN_ATTEMPT, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';
import { measure } from '../registry.js';

export const shooters = {
  work: ['dmenAttempts'],
  counts: 'every shot attempt a defenceman took — on goal, missed, or blocked — out of all of a team’s attempts',
  credits: 'Each attempt is credited to the team that shot it, and counted here when the shooter is listed as a defenceman.',
  id: 'shooters',
  label: measure('dmen').layer,

  reduce(events, ctx) {
    const { roster, homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 }, all = { [homeId]: 0, [awayId]: 0 };
    const counted = [], excluded = [];
    events.forEach((e, id) => {
      const notPlay = inShootout(e);
      const team = corsiTeam(e, roster);
      const notAttempt = team == null
        ? (NOT_AN_ATTEMPT[e.type] || NOT_A_PLAY[e.type] || `not an attempt (${e.type})`)
        : null;
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;
      const pos = (roster[e.actor] || {}).pos;
      const notD = notPlay || notAttempt || notEven || pos === 'D' ? null
        : pos ? 'taken by a forward' : 'the shooter\u2019s position is not on the roster';
      if (notPlay || notAttempt || notEven || notD) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notAttempt) dims.type = notAttempt;
        if (notEven) dims.strength = notEven;
        if (notD) dims.shooter = notD;
        excluded.push({ id, why: notPlay || notAttempt || notEven || notD, dims });
        if (notD) all[team]++;
        return;
      }
      t[team]++; all[team]++;
      counted.push(id);
    });
    return { t, all, counted, excluded };
  },
};
