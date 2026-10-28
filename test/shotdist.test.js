/**
 * Distance bands: the same unblocked, located attempts the slot measure uses,
 * cut into 5-foot spans, and the sentence Goals puts under a located goal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsiTeam } from '../src/lib/attribution.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich } from './helpers/page.js';
import {
  BAND_FT, MIN_BAND_N, atEmptyNet, bandFrom, countBands, distanceSentence, goalLine, shotDistance,
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
  const rows = countBands(rich.events, counted, ctx).rows;
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
    + 'in 5-foot bands, every situation, blocked shots and empty nets left out.');
  assert.match(distanceSentence(172, doc), /too few to quote/);
  assert.match(distanceSentence(172, doc), /under 30/);
  assert.equal(distanceSentence(13, null), '');
});

test('archive rows sum, and a record without bands does not invent a zero', () => {
  const doc = shotDistance([
    { dist: { rows: [[10, 2, 20], [15, 1, 10]], leftOut: { goals: 0, n: 0 } } },
    { dist: { rows: [[10, 3, 30]], leftOut: { goals: 1, n: 2 } } },
    {},
  ]);
  assert.equal(doc.games, 2);
  assert.equal(doc.bandFt, 5);
  assert.equal(doc.minN, 30);
  const ten = doc.bands.find(b => b.from === 10);
  assert.equal(ten.goals, 5);
  assert.equal(ten.n, 50);
  assert.equal(ten.rate, 5 / 50);
  assert.equal(doc.leftOut.goals, 1);
  assert.equal(doc.leftOut.n, 2);
  assert.match(doc.what, /blocked/i);
  assert.match(doc.what, /30/);
});

test('a shot at an empty net is left out; a shot taken with your own net empty stays', () => {
  const events = rich.events.map(e => ({ ...e }));
  const goal = events.find(e => e.type === 'goal' && e.x != null);
  const shooter = corsiTeam(goal, rich.roster);
  const counted = () => corsi.reduce(events, { ...ctx, evenOnly: false }).counted;
  const goalsOf = made => made.rows.reduce((s, r) => s + r[1], 0);
  const had = goalsOf(countBands(events, counted(), ctx));
  // The net being shot at is empty.
  goal.sit = shooter === ctx.homeId ? '0651' : '1650';
  assert.equal(atEmptyNet(goal, shooter, ctx), true);
  const atNet = countBands(events, counted(), ctx);
  assert.equal(goalsOf(atNet), had - 1);
  assert.equal(atNet.leftOut.goals, 1);
  // The shooter's own net is empty, so the shot is still at a goalie.
  goal.sit = shooter === ctx.homeId ? '1560' : '0651';
  assert.equal(atEmptyNet(goal, shooter, ctx), false);
  assert.equal(goalsOf(countBands(events, counted(), ctx)), had);
});

test('an empty-net goal says the net was empty, not a rate', () => {
  const goal = rich.events.find(e => e.type === 'goal' && e.x != null);
  const shooter = corsiTeam(goal, rich.roster);
  const e = { ...goal, sit: shooter === ctx.homeId ? '0651' : '1650' };
  const doc = { bandFt: 5, minN: 30, bands: [
    { from: bandFrom(10), to: 15, goals: 12, n: 100, rate: 0.12 }] };
  const line = goalLine(e, ctx, doc);
  assert.equal(line, 'The net was empty, so there\u2019s no goalie to beat.');
  assert.doesNotMatch(line, /%/);
});

test('the published bands leave empty nets out of the slot measure\u2019s attempts', () => {
  const m = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
  const n = m.shotDistance.bands.reduce((s, b) => s + b.n, 0);
  const goals = m.shotDistance.bands.reduce((s, b) => s + b.goals, 0);
  assert.equal(n + m.shotDistance.leftOut.n, m.slot.attempts.n,
    'a located unblocked attempt is neither in a band nor an empty-net exclusion');
  assert.equal(goals + m.shotDistance.leftOut.goals, m.attemptMix.byType.goal,
    'a goal is neither in a band nor an empty-net exclusion');
  assert.ok(m.shotDistance.leftOut.n > 0, 'no empty-net attempt was removed');
  assert.match(m.shotDistance.what, /empty net/i);
  for (const b of m.shotDistance.bands) {
    assert.equal(b.to - b.from, m.shotDistance.bandFt);
    assert.equal(b.rate, b.goals / b.n);
    assert.ok(b.n >= m.shotDistance.minN, `${b.from}–${b.to} is under the floor and still quoted`);
  }
});
