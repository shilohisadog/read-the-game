/**
 * FACE-OFFS — every face-off, who won it, and both centres (Kevin's ruling 7,
 * 2026-10-18: its own chip, independent of Zone starts). `t` is face-offs won per
 * team; `by` is each player's face-offs won (`w`) and lost (`l`): `actor` is the
 * winner and `lose` the loser, recorded on every archive face-off since SCHEMA 7.
 * Zone starts asks WHERE play began; this asks WHO won the face-off.
 */
import { NOT_A_PLAY, inShootout } from '../layer.js';
import { whyNotEven } from '../strength.js';
import { NOT_A_DRAW } from './zonestart.js';

export const faceoffs = {
  work: [],
  counts: 'every face-off, credited to the team whose player won it',
  credits: 'Each face-off is credited to the team that won it; both players who took it are named.',
  id: 'faceoffs',

  reduce(events, ctx) {
    const { homeId, awayId } = ctx;
    const t = { [homeId]: 0, [awayId]: 0 }, by = {};
    const counted = [], excluded = [], unplaced = [];
    const tally = (pid, k) => { if (pid == null) return; (by[pid] ||= { w: 0, l: 0 })[k]++; };
    events.forEach((e, id) => {
      const notPlay = inShootout(e);
      const notDraw = e.type === 'faceoff' ? null
        : (NOT_A_DRAW[e.type] || NOT_A_PLAY[e.type] || `not a face-off (${e.type})`);
      const notEven = ctx.evenOnly ? whyNotEven(e, ctx) : null;
      if (notPlay || notDraw || notEven) {
        const dims = {};
        if (notPlay) dims.play = notPlay;
        if (notDraw) dims.type = notDraw;
        if (notEven) dims.strength = notEven;
        excluded.push({ id, why: notPlay || notDraw || notEven, dims });
        return;
      }
      counted.push(id);
      // A face-off the feed did not credit to either team is counted and said, never guessed.
      if (e.own == null || t[e.own] === undefined) { unplaced.push(id); return; }
      t[e.own]++;
      tally(e.actor, 'w');
      tally(e.lose, 'l');
    });
    return { t, by, counted, excluded, unplaced };
  },
};
