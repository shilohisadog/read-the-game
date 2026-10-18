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

/* -------------------------------------------------------------------------
 * A player's season face-off share — the Face-offs chip's `Is that a lot?`.
 * ------------------------------------------------------------------------- */
import { playersIn } from '../src/lib/league.js';
import { playerSeasons, REGULAR_TAKER } from '../src/lib/archive.js';
import { boot, rich, pickLayer } from './helpers/page.js';

test('a player row counts the face-offs he won and took, both players named, shootout out', () => {
  const rows = playersIn(G);
  const named = draws.filter(e => e.actor != null && e.lose != null);
  assert.equal(rows.reduce((n, r) => n + r.fw, 0), named.length, 'every named face-off has one winner');
  assert.equal(rows.reduce((n, r) => n + r.ft, 0), 2 * named.length, 'and two players who took it');
  const one = named[0].actor;
  const mine = named.filter(e => e.actor === one || e.lose === one);
  const r = rows.find(x => x.p === one);
  assert.deepEqual([r.fw, r.ft], [mine.filter(e => e.actor === one).length, mine.length]);
});

test('the season table carries every taker, the axis only regular takers of finished seasons', () => {
  const sk = (p, fw, ft) => ({ p, t: 'AAA', nm: `P${p}`, n: p, pos: 'C', g: 0, a: 0, s: 0, c: 0, fw, ft });
  const recs = [];
  // #1 a regular taker at 60%, #2 a winger who takes one a game, both two games, a finished season.
  for (const id of [2023020001, 2023030001]) recs.push({ id, players: [sk(1, 6, 10), sk(2, 1, 1)] });
  recs.push({ id: 2026020001, players: [sk(3, 9, 10)] });
  const out = playerSeasons(recs, 2);
  assert.deepEqual(out.fo.seasons['2023'], { 1: [12, 20, 2], 2: [2, 2, 2] });
  assert.deepEqual(out.fo.seasons['2026'], { 3: [9, 10, 1] }, 'the open season is published, for its own games');
  assert.equal(out.fo.regular, REGULAR_TAKER);
  assert.equal(out.fo.range.n, 1, 'the winger at one a game and the open season stay off the axis');
  assert.equal(out.fo.range.median, 0.6);
  assert.ok(!('fw' in out.clubs.AAA[0]), 'the preview rows do not carry the face-off fields');
});

/** Everything the fake DOM holds under a node, as text. */
const RATES = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url)));
const textOf = n => (n._text || '') + (n._html || '') + (n._kids || []).map(textOf).join('');

test('the Face-offs panel places tonight’s busiest takers by their season share', async () => {
  const season = String(rich.game.id).slice(0, 4);
  const busiest = Object.entries(faceoffs.reduce(rich.events,
    { homeId: rich.teams.home.id, awayId: rich.teams.away.id, roster: rich.roster }).by)
    .sort((x, y) => (y[1].w + y[1].l) - (x[1].w + x[1].l))[0][0];
  const asked = [];
  const doc = name => { asked.push(name); return Promise.resolve({ season: '2099', qualify: 41,
    fo: { regular: 5, need: 29, range: { min: 0.35, max: 0.65, median: 0.51, n: 450 },
          seasons: { [season]: { [busiest]: [300, 500, 60] } } } }); };
  const a = boot(rich, RATES, '', null, doc);
  pickLayer(a, 'faceoffs');
  a.at(+a.$('scrub').max, () => {});
  assert.deepEqual(asked, [], 'nothing is fetched until the reader asks');
  a.$('alot').click();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(asked, ['players.json']);
  const t = textOf(a.$('alotBody'));
  assert.match(t, /How often a player wins his face-offs/);
  assert.match(t, /60% of 500 face-offs in 60 games/, 'the season share, with its count and its games');
  assert.match(t, /450 full seasons by regular takers/);
  assert.match(t, /playoffs included/, 'a finished season says what it counts');
});

test('with no way to fetch, the Face-offs panel says so and asks for nothing', () => {
  const a = boot(rich, RATES);
  pickLayer(a, 'faceoffs');
  a.at(+a.$('scrub').max, () => {});
  a.$('alot').click();
  assert.match(textOf(a.$('alotBody')), /season figures could not be read/);
});
