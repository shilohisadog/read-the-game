/**
 * Strength as a filter, per docs/strength-filter.md.
 *
 * The design question I asked — "which number is the headline, 56% or 59%?" —
 * was malformed. It presupposes one headline, which is what the ledger exists
 * to avoid. Strength is a view-level FILTER: the app opens at all situations,
 * and even-strength moves 49 of 135 attempts from counted to excluded, each
 * carrying a reason, with the counter re-running in front of the viewer.
 *
 * Two properties do the real work here. Conservation must hold in BOTH modes —
 * a filter that loses events is worse than no filter. And strength is a second
 * DIMENSION of exclusion, not a second list: a hit on the power play is
 * excluded once, carrying both reasons.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conservation } from '../src/lib/layer.js';
import { situation, isEven, whyNotEven, windows, EVEN, POWER_PLAY, EMPTY_NET } from '../src/lib/strength.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { danger } from '../src/lib/layers/danger.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const EVENTS = rich.events;
const base = {
  roster: rich.roster,
  homeId: rich.teams.home.id, awayId: rich.teams.away.id,
  homeAb: rich.teams.home.ab, awayAb: rich.teams.away.ab,
};
const even = { ...base, evenOnly: true };
const LAYERS = [corsi, goaltending, danger];

test('situation codes are read, not guessed', () => {
  assert.equal(situation('1551', base).kind, EVEN, '5v5');
  assert.equal(situation('1441', base).kind, EVEN, '4v4 is still even');
  assert.equal(situation('1541', base).kind, POWER_PLAY);
  assert.equal(situation('1541', base).advantage, base.awayId, 'MIN has the extra skater');
  assert.equal(situation('1451', base).advantage, base.homeId, 'BUF has it');
  assert.equal(situation('0651', base).kind, EMPTY_NET, 'a pulled goalie is not a power play');
  assert.equal(situation('9999', base), null, 'an unknown code is refused, not guessed');
  assert.equal(situation(undefined, base), null);
});

test('an empty net outranks the skater count', () => {
  // 6-on-5 with a net empty is desperation, not a penalty. Bucketing it as a
  // power play would put the two in the same box, and in this game that is
  // the entire difference between 59.3% control and 55.8%.
  const s = situation('0651', base);
  assert.equal(s.kind, EMPTY_NET);
  assert.notEqual(s.kind, POWER_PLAY);
});

test('the filter removes exactly the 49 attempts the design predicts', () => {
  const all = corsi.reduce(EVENTS, base);
  const ev = corsi.reduce(EVENTS, even);
  assert.equal(all.counted.length, 135, 'all situations');
  assert.equal(ev.counted.length, 86, 'even strength only');
  assert.equal(all.counted.length - ev.counted.length, 49, 'the documented delta');
});

test('the numbers land where the design says: 80/55 becomes 48/38', () => {
  const all = corsi.reduce(EVENTS, base);
  const ev = corsi.reduce(EVENTS, even);
  assert.equal(all.t[base.awayId], 80); assert.equal(all.t[base.homeId], 55);
  assert.equal(ev.t[base.awayId], 48);  assert.equal(ev.t[base.homeId], 38);
});

test('the scoreboard is not a metric — the score never moves', () => {
  // Filtering is a lens on play, not on what happened. Buffalo won 3-2 in every
  // mode, and a filter that changed the score would be lying.
  for (const ctx of [base, even]) {
    const L = corsi.reduce(EVENTS, ctx);
    assert.equal(L.hs, 3, 'BUF goals');
    assert.equal(L.as, 2, 'MIN goals');
  }
});

for (const layer of LAYERS) {
  test(`${layer.id}: conservation holds under the filter too`, () => {
    // The property that makes a filter safe. A view that quietly drops events
    // it has filtered out would be exactly the failure Doctrine §9 names.
    const c = conservation(layer.reduce(EVENTS, even), EVENTS.length);
    assert.deepEqual(c.unaccounted, [], 'nothing lost');
    assert.deepEqual(c.inBoth, [], 'nothing counted twice');
    assert.equal(c.counted + c.excluded, 320);
    assert.ok(c.ok);
  });
}

test('strength is a DIMENSION of exclusion, not a second list', () => {
  // CHENG's requirement. A hit that happened on the power play is excluded for
  // being a hit AND for the strength state -- one entry, both reasons.
  const ev = corsi.reduce(EVENTS, even);
  const ids = ev.excluded.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length, 'no event appears twice');

  const both = ev.excluded.filter(x => x.dims && x.dims.type && x.dims.strength);
  assert.ok(both.length > 0, 'some events are excluded on both dimensions');
  for (const x of both) {
    assert.ok(x.dims.type.length > 8 && x.dims.strength.length > 8,
      `event ${x.id} must carry a readable reason for each dimension`);
  }
});

test('every strength exclusion names the situation in plain language', () => {
  const ev = corsi.reduce(EVENTS, even);
  const strength = ev.excluded.filter(x => x.dims && x.dims.strength);
  assert.ok(strength.length >= 49, `${strength.length} events cite a strength reason`);
  for (const x of strength) {
    assert.match(x.dims.strength, /power play|pulled their goalie|not recorded/,
      `event ${x.id}: ${x.dims.strength}`);
  }
});

test('the empty-net copy states counts, never intent', () => {
  // I wrote "Buffalo had stopped trying to score" in conversation, which is an
  // assertion about motive. A one-goal lead with 100 seconds left means icing
  // the puck and blocking shots -- competent play, not surrender.
  const ev = corsi.reduce(EVENTS, even);
  const net = ev.excluded.filter(x => x.dims?.strength?.includes('pulled'));
  assert.ok(net.length > 0);
  for (const x of net) {
    assert.doesNotMatch(x.dims.strength, /gave up|stopped trying|surrender|desperate/i,
      'no verb may describe anyone\'s intent');
    assert.match(x.dims.strength, /\d+ skaters against \d+/, 'state the counts');
  }
});

test('goaltending under the filter: Levi 18 faced, Gustavsson 15', () => {
  const g = goaltending.reduce(EVENTS, even).g;
  assert.equal(g[8482221].f, 18, 'Levi faced 18 at even strength');
  assert.equal(g[8482221].gl, 0, 'and allowed none');
  assert.equal(g[8479406].f, 15, 'Gustavsson faced 15');
  assert.equal(g[8479406].gl, 3);
});

test('the special-teams windows are found, and one crosses the intermission', () => {
  const w = windows(EVENTS, base);
  assert.ok(w.length >= 8, `${w.length} windows`);
  const crossing = w.filter(x => x.fromPer !== x.toPer);
  assert.equal(crossing.length, 1, 'exactly one carries over a period break');
  assert.equal(crossing[0].fromPer, 2);
  assert.equal(crossing[0].toPer, 3);
  assert.equal(crossing[0].kind, POWER_PLAY);
});

test('an unreadable situation code is refused rather than assumed even', () => {
  // The set is known-incomplete: a real season adds 3-on-3, 5-on-3, 4-on-3 and
  // both goalies pulled. Treating an unknown code as "even" would silently fold
  // a state we do not understand into the number we are most careful about.
  const bogus = EVENTS.map((e, i) => i === 5 ? { ...e, sit: '7777' } : e);
  const ev = corsi.reduce(bogus, even);
  const entry = ev.excluded.find(x => x.id === 5);
  assert.ok(entry, 'the event is excluded, not counted');
  assert.match(entry.dims.strength, /not recorded/, 'and says why');
  assert.equal(isEven('7777', base), false, 'never treated as even');
});
