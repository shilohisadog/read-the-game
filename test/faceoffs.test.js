/* The Face-offs layer (ruling 7) and the figures it publishes. Each expectation is
   computed a second way here, from the raw events, never read back from the layer. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { faceoffs } from '../src/lib/layers/faceoffs.js';
import { censusGame, censusAdd, censusRates } from '../src/lib/census.js';

const G = JSON.parse(readFileSync(new URL('fixtures/extracts/2025020501.json', import.meta.url)));
const ctx = { homeId: G.teams.home.id, awayId: G.teams.away.id, roster: G.roster };
const draws = G.events.filter(e => e.type === 'faceoff' && e.pt !== 'SO');

test('each team is credited the face-offs it won, and every one names both players', () => {
  const r = faceoffs.reduce(G.events, ctx);
  for (const id of [ctx.homeId, ctx.awayId])
    assert.equal(r.t[id], draws.filter(e => e.own === id).length);
  assert.equal(r.counted.length, draws.length);
  const w = Object.values(r.by).reduce((a, v) => a + v.w, 0), l = Object.values(r.by).reduce((a, v) => a + v.l, 0);
  assert.equal(w, draws.length, 'every face-off has a winner');
  assert.equal(l, draws.length, 'every face-off has a loser (lose, SCHEMA 7)');
});

test('a player’s record is his wins as actor and his losses as lose', () => {
  const r = faceoffs.reduce(G.events, ctx);
  const [pid] = Object.entries(r.by).sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))[0];
  assert.deepEqual(r.by[pid], { w: draws.filter(e => String(e.actor) === pid).length,
                                l: draws.filter(e => String(e.lose) === pid).length });
});

test('a shootout attempt is not a face-off', () => {
  const ev = [{ type: 'faceoff', pt: 'SO', own: ctx.homeId, actor: 1, lose: 2, per: 5, s: 0 }];
  const r = faceoffs.reduce(ev, ctx);
  assert.equal(r.counted.length, 0);
  assert.equal(r.excluded[0].dims.play != null, true);
});

test('the run after a face-off: who took the 1st, 2nd, 3rd and later shot attempts', () => {
  const ATT = new Set(['shot-on-goal', 'missed-shot', 'blocked-shot', 'goal']);
  // Independently: walk each face-off to the next face-off or stoppage-type event.
  const want = { first: [0, 0], second: [0, 0], third: [0, 0], later: [0, 0] };
  const stopsRun = new Set(['faceoff', 'stoppage', 'period-end', 'game-end', 'goal', 'penalty']);
  G.events.forEach((e, i) => {
    if (e.type !== 'faceoff' || e.pt === 'SO' || e.own == null || e.x == null) return;
    let k = 0;
    for (let j = i + 1; j < G.events.length; j++) {
      const x = G.events[j];
      if (x.per !== e.per) break;
      if (ATT.has(x.type) && x.own != null) {
        const slot = want[['first', 'second', 'third'][k] || 'later']; slot[1]++; if (x.own === e.own) slot[0]++; k++;
      }
      if (stopsRun.has(x.type)) break;
    }
  });
  const got = censusRates(censusAdd({}, censusGame(G.events, ctx))).faceoffRun;
  for (const k of ['first', 'second', 'third', 'later']) assert.deepEqual([got[k].w, got[k].n], want[k], k);
  assert.ok(got.first.n > 0);
});

test('a team-game’s face-off share is its wins of all the face-offs, as a whole percent', async () => {
  const { perTeamGame } = await import('../src/lib/archive.js');
  const rec = (id, h, a) => ({ id, date: '2025-10-10', fo: { h, a } });
  const out = perTeamGame([rec(2025020001, 30, 20), rec(2025020002, 25, 25), { id: 2025020003, date: '2025-10-11' }]);
  const c = out['2025'].foShare;
  assert.equal(c.suffix, '%');
  assert.equal(c.n, 4, 'two games with face-offs give four team-games; a record without `fo` drops out');
  assert.deepEqual([c.min, c.max], [40, 60]);
});
