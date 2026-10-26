/**
 * Reviews of a goal in Goals mode (app.js): a goal that came off has no goal event,
 * so its stop is the first frame after the review; a goal that stood carries the
 * review on its own frame, since Goals mode never reaches the penalty frame after it.
 *
 * The reference game has no reviews, so two are written into a copy of it, each as
 * the league records one: MIN's goal at 19:30 of the first, challenged by BUF and
 * standing, and a BUF goal in the second taken off on MIN's offside challenge.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rich, boot } from './helpers/page.js';

const HOME = rich.teams.home.id, AWAY = rich.teams.away.id;
const buf = Object.entries(rich.roster).find(([, p]) => p.tid === HOME && p.pos !== 'G')[0];
const G = structuredClone(rich), E = G.events;
const at = (k, extra) => ({ per: E[k].per, s: E[k].s, clock: E[k].clock, rem: E[k].rem, pt: 'REG', sit: E[k].sit,
  x: null, y: null, own: null, actor: null, goalie: null, ...extra });
const MIN_GOAL = E.findIndex(e => e.type === 'goal' && e.own === AWAY);
const FO = E.findIndex((e, k) => k > 139 && e.type === 'faceoff' && e.per === 2 && e.x !== 0);
const OFF_FO = E[FO], GOAL = E[MIN_GOAL];
// Later index first, so the earlier one keeps its place.
E.splice(FO, 0, at(FO, { type: 'stoppage', rsn: 'chlg-vis-off-side' }), at(FO, { type: 'stoppage', rsn: 'offside' }));
E.splice(MIN_GOAL + 1, 0, at(MIN_GOAL, { type: 'stoppage', rsn: 'chlg-hm-goal-interference' }),
  at(MIN_GOAL, { type: 'penalty', own: HOME, actor: +buf, pen: 'delaying-game-unsuccessful-challenge', min: 2, sev: 'BEN' }));

const TL = boot(G).timeline;
const GOALS = TL.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO');
const ROWS = GOALS.map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
const served = name => name.endsWith('goals.json') ? Promise.resolve(ROWS) : Promise.resolve(null);
const settle = () => new Promise(r => setImmediate(r));
const frame = (x) => TL.findIndex(e => e && e.type === x.type && e.per === x.per && e.s === x.s);
const OFF = frame(OFF_FO), STOOD = frame(GOAL);
const ab = { [HOME]: rich.teams.home.ab, [AWAY]: rich.teams.away.ab };

test('the two written-in reviews read as the league would record them', () => {
  assert.ok(OFF > 0 && STOOD > 0);
  assert.equal(TL[OFF].type, 'faceoff');
});

test('⭐ Goals: a goal that came off is a stop of its own, between the goals around it', async () => {
  const a = boot(G, null, '?replay=goals', null, served);           // reduced motion: goal frame to goal frame
  await settle(); await settle();
  a.$('play').click();
  const seen = [];
  for (let n = 0; n < 12 && seen.length < GOALS.length + 1; n++) {
    a.advance(1); await settle(); await settle();
    const k = +a.$('scrub').value;
    if (seen.at(-1) !== k) seen.push(k);
  }
  const want = [...GOALS.map(g => g.k), OFF].sort((x, y) => x - y);
  assert.deepEqual(seen.slice(0, want.length), want, 'the stops are not the goals plus the goal that came off');
});

test('on that stop the name line says it, and the line under the rink says how', async () => {
  const a = boot(G, null, '?replay=goals', null, served);
  await settle(); await settle();
  a.at(OFF, () => {}); await settle();
  assert.equal(+a.$('scrub').value, OFF, 'the scrubber does not snap to the goal that came off');
  assert.equal(a.$('who').textContent, `Face-off after a review · ${ab[HOME]}'s goal came off`);
  assert.match(a.$('playline').textContent,
    new RegExp(`^${ab[HOME]} scored, but ${ab[AWAY]} challenged that ${ab[HOME]} was offside prior to the goal\\. The review determined`));
});

test('⭐ Goals: a goal that stood says so on its own frame; All events says it on the penalty after', async () => {
  const g = boot(G, null, '?replay=goals', null, served);
  await settle(); await settle();
  g.at(STOOD, () => {}); await settle();
  assert.equal(+g.$('scrub').value, STOOD);
  assert.match(g.$('playline').textContent,
    new RegExp(`${ab[AWAY]} scored, and ${ab[HOME]} challenged that a ${ab[AWAY]} player interfered with the goaltender\\. The review concluded the goal stands, and ${ab[HOME]} takes a two-minute penalty for losing the challenge\\.`));
  const all = boot(G, null, '?replay=all', null, served);
  await settle(); await settle();
  all.at(STOOD, () => {}); await settle();
  assert.doesNotMatch(all.$('playline').textContent, /challenged/, 'All events says it twice');
  all.at(STOOD + 1, () => {}); await settle();
  assert.match(all.$('playline').textContent, /The review concluded the goal stands/);
});
