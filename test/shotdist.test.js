/**
 * Distance bands: the same unblocked, located attempts the slot measure uses,
 * cut into 5-foot spans, and the sentence Goals puts under a located goal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich } from './helpers/page.js';
import {
  BAND_FT, MIN_BAND_N, bandFrom, countBands, distanceSentence, shotDistance,
} from '../src/lib/shotdist.js';

const ctx = {
  roster: rich.roster,
  homeId: rich.teams.home.id,
  awayId: rich.teams.away.id,
};

test('a band is five feet wide, and the caption\'s rounded feet pick it', () => {
  assert.equal(BAND_FT, 5);
  assert.equal(bandFrom(13), 10);
  assert.equal(bandFrom(15), 15);
  assert.equal(bandFrom(0), 0);
});

test('blocked shots are not counted, and a located goal is', () => {
  const counted = corsi.reduce(rich.events, { ...ctx, evenOnly: false }).counted;
  const rows = countBands(rich.events, counted, ctx);
  const n = rows.reduce((s, r) => s + r[2], 0);
  const goals = rows.reduce((s, r) => s + r[1], 0);
  const blocked = counted.filter(id => rich.events[id].type === 'blocked-shot').length;
  assert.ok(blocked > 0, 'the fixture has no blocked shot to exclude');
  assert.ok(n < counted.length, 'blocked shots were counted as if the feed knew where they were taken');
  assert.ok(goals > 0, 'no located goal was counted');
  for (const [from, g, k] of rows) {
    assert.equal(from % BAND_FT, 0);
    assert.ok(g <= k);
  }
});

test('the sentence quotes the rate, and refuses a band under the floor', () => {
  const doc = {
    bandFt: BAND_FT, minN: MIN_BAND_N,
    bands: [
      { from: 10, to: 15, goals: 12, n: 100, rate: 0.12 },
      { from: 170, to: 175, goals: 1, n: 4, rate: 0.25 },
    ],
  };
  assert.equal(distanceSentence(13, doc),
    'Shots from 10–15 feet go in about 12.0% of the time (n = 100), '
    + 'in 5-foot bands, every situation, blocked shots left out.');
  assert.match(distanceSentence(172, doc), /too few to quote/);
  assert.match(distanceSentence(172, doc), /under 30/);
  assert.equal(distanceSentence(13, null), '');
});

test('archive rows sum, and a record without bands does not invent a zero', () => {
  const doc = shotDistance([
    { dist: [[10, 2, 20], [15, 1, 10]] },
    { dist: [[10, 3, 30]] },
    {},
  ]);
  assert.equal(doc.games, 2);
  assert.equal(doc.bandFt, 5);
  assert.equal(doc.minN, 30);
  const ten = doc.bands.find(b => b.from === 10);
  assert.equal(ten.goals, 5);
  assert.equal(ten.n, 50);
  assert.equal(ten.rate, 5 / 50);
  assert.match(doc.what, /blocked/i);
  assert.match(doc.what, /30/);
});

test('the published bands are the same attempts as the slot measure', () => {
  const m = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
  const n = m.shotDistance.bands.reduce((s, b) => s + b.n, 0);
  const goals = m.shotDistance.bands.reduce((s, b) => s + b.goals, 0);
  assert.equal(n, m.slot.attempts.n, 'distance bands are not the unblocked located attempts');
  assert.equal(goals, m.attemptMix.byType.goal, 'a goal was left out of the bands');
  for (const b of m.shotDistance.bands) {
    assert.equal(b.to - b.from, m.shotDistance.bandFt);
    assert.equal(b.rate, b.goals / b.n);
    assert.ok(b.n >= m.shotDistance.minN, `${b.from}–${b.to} is under the floor and still quoted`);
  }
});
