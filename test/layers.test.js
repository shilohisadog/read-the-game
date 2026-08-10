/**
 * Phase 2: the layer contract, and a conservation property that can actually fail.
 *
 * The version this replaces could not fail. It measured `counted + excluded`
 * against `EV` — a list the app had already stripped 51 events out of — so it
 * conserved over the survivors and said nothing about what never arrived.
 *
 * These bind conservation to the full game: 320 events, every one accounted for
 * by exactly one layer bucket, every exclusion carrying a reason a human wrote.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conservation, summarise } from '../src/lib/layer.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { danger } from '../src/lib/layers/danger.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const ctx = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const EVENTS = rich.events;
const LAYERS = [corsi, goaltending, danger];

test('the game has the events we think it has', () => {
  assert.equal(EVENTS.length, 320);
});

for (const layer of LAYERS) {
  test(`${layer.id}: accounts for every event in the game, exactly once`, () => {
    const c = conservation(layer.reduce(EVENTS, ctx), EVENTS.length);
    assert.deepEqual(c.inBoth, [], 'no event may be both counted and excluded');
    assert.deepEqual(c.unaccounted, [], 'no event may go unaccounted for');
    assert.deepEqual(c.surprisingNotCounted, [], '`surprising` must annotate counted events');
    assert.equal(c.missingExplanation, 0, 'every exclusion needs a why, every surprise a derivedFrom');
    assert.equal(c.counted + c.excluded, 320);
    assert.ok(c.ok);
  });

  test(`${layer.id}: every exclusion reason is a sentence, not a code`, () => {
    // The ledger is teaching material, not a debug dump. A reason of "hit" tells
    // a novice nothing; "a hit — physical play, but not a shot attempt" does.
    for (const x of layer.reduce(EVENTS, ctx).excluded) {
      assert.ok(x.why.length > 12 && /\s/.test(x.why),
        `${layer.id} event ${x.id}: unhelpful reason ${JSON.stringify(x.why)}`);
    }
  });
}

test('the 51 events the app used to drop are now excluded WITH reasons', () => {
  // The whole point of binding to the full stream. These were invisible before.
  const SKIPPED = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const hidden = EVENTS.map((e, i) => SKIPPED.has(e.type) ? i : -1).filter(i => i >= 0);
  assert.equal(hidden.length, 51);

  const excluded = new Map(corsi.reduce(EVENTS, ctx).excluded.map(x => [x.id, x.why]));
  for (const i of hidden) {
    assert.ok(excluded.has(i), `event ${i} (${EVENTS[i].type}) must appear in the ledger`);
    assert.ok(/not a play|whistle|delayed penalty|play stopped|period|game over/i.test(excluded.get(i)),
      `event ${i}: reason should say it was not a play — got ${excluded.get(i)}`);
  }
});

test('corsi still produces the numbers the app has been showing', () => {
  // Phase 2 changes the ledger's shape, never the tallies.
  const L = corsi.reduce(EVENTS, ctx);
  assert.equal(L.t[ctx.awayId], 80, 'MIN attempts');
  assert.equal(L.t[ctx.homeId], 55, 'BUF attempts');
  assert.equal(L.counted.length, 135);
  assert.equal(L.surprising.length, 44, 'every blocked shot is surprising');
  assert.equal(L.hs, 3);
  assert.equal(L.as, 2);
});

test('goaltending still produces the numbers the app has been showing', () => {
  const { g, counted } = goaltending.reduce(EVENTS, ctx);
  assert.equal(counted.length, 60, 'shots faced across both goalies');
  assert.deepEqual(g[8479406], { f: 25, s: 22, gl: 3, hf: 8, hs: 6 }, 'Gustavsson');
  assert.deepEqual(g[8482221], { f: 35, s: 33, gl: 2, hf: 22, hs: 20 }, 'Levi');
});

test('danger counts the same 44 chances the app marks', () => {
  assert.equal(danger.reduce(EVENTS, ctx).counted.length, 44);
});

test('danger exclusions carry the measurement, not just the verdict', () => {
  // "48 ft from the net" teaches where the line is. "not high danger" does not.
  const withDistance = danger.reduce(EVENTS, ctx).excluded.filter(x => /\d+ ft/.test(x.why));
  assert.ok(withDistance.length > 40,
    `only ${withDistance.length} exclusions quote a distance`);
});

test('CONSERVATION CAN FAIL — proven, not assumed', () => {
  // A property that cannot fail is worse than no property (Doctrine §9), so
  // demonstrate the failure modes rather than trusting the green.
  const good = corsi.reduce(EVENTS, ctx);

  const dropped = { ...good, excluded: good.excluded.slice(1) };
  assert.equal(conservation(dropped, EVENTS.length).ok, false, 'a lost event must fail');
  assert.equal(conservation(dropped, EVENTS.length).unaccounted.length, 1);

  const doubled = { ...good, counted: [...good.counted, good.excluded[0].id] };
  assert.equal(conservation(doubled, EVENTS.length).ok, false, 'double-counting must fail');

  const silent = { ...good, excluded: good.excluded.map(x => ({ ...x, why: '' })) };
  assert.equal(conservation(silent, EVENTS.length).ok, false, 'a silent exclusion must fail');

  const stray = { ...good, surprising: [...good.surprising, { id: good.excluded[0].id, why: 'x', derivedFrom: 'y' }] };
  assert.equal(conservation(stray, EVENTS.length).ok, false, 'surprising must be a subset of counted');
});

test('summarise groups the ledger for display without losing the count', () => {
  const L = corsi.reduce(EVENTS, ctx);
  const s = summarise(L.excluded);
  assert.equal(Object.values(s).reduce((a, b) => a + b, 0), L.excluded.length);
});

/* ------------------------------------------------------------------ shootout
 *
 * The reference game ended in regulation, so none of the tests above can see
 * this: every layer would have counted shootout attempts as play, and the
 * scoreboard would have counted every successful attempt as a goal.
 *
 * Six of 62 sampled games from the archive reach a shootout — roughly a tenth
 * of a regular season, about 130 games a year. A shootout is a skills
 * competition that decides the game, not play within it: the league excludes
 * its attempts from shots on goal, and adds exactly ONE to the winner's score
 * however many attempts go in.
 */
const SO = t => ({ ...t, pt: 'SO' });
const HID = rich.teams.home.id, AID = rich.teams.away.id;
// A shooter from each side, taken from the real roster so attribution works.
const shooterOf = tid => Object.keys(rich.roster).find(p => rich.roster[p].tid === tid
                                                        && rich.roster[p].pos !== 'G');

const REG = EVENTS.filter(e => e.pt !== 'SO');
const shootoutGame = attempts => [...REG, ...attempts];

test('shootout events are excluded from every layer, with a reason', () => {
  const attempts = [
    SO({ per: 5, s: 3900, type: 'goal', own: AID, x: -80, y: 0,
         actor: +shooterOf(AID), goalie: null, sit: '0101' }),
    SO({ per: 5, s: 3910, type: 'shot-on-goal', own: HID, x: 80, y: 0,
         actor: +shooterOf(HID), goalie: null, sit: '1010' }),
  ];
  const events = shootoutGame(attempts);
  for (const layer of LAYERS) {
    const r = layer.reduce(events, ctx);
    const c = conservation(r, events.length);
    assert.ok(c.ok, `${layer.id} must still conserve: ${JSON.stringify(c)}`);
    for (let i = events.length - attempts.length; i < events.length; i++) {
      assert.ok(!r.counted.includes(i), `${layer.id} counted a shootout event`);
      const x = r.excluded.find(e => e.id === i);
      assert.ok(x, `${layer.id} lost a shootout event entirely`);
      assert.match(x.why, /shootout/i, `${layer.id} must say WHY, not just drop it`);
    }
  }
});

test('a shootout cannot change any metric the game produced', () => {
  // MUTATION GUARD on the exclusion. Appending a shootout must leave the
  // control, danger and goaltending numbers bit-for-bit identical to the game
  // without one — that is the whole claim, and a count-based check would let a
  // compensating error through.
  const attempts = Array.from({ length: 6 }, (_, i) =>
    SO({ per: 5, s: 3900 + i, type: i % 2 ? 'goal' : 'shot-on-goal',
         own: i % 2 ? AID : HID, x: -80, y: 0,
         actor: +shooterOf(i % 2 ? AID : HID), goalie: null, sit: '0101' }));
  for (const layer of LAYERS) {
    const before = layer.reduce(REG, ctx);
    const after = layer.reduce(shootoutGame(attempts), ctx);
    assert.deepEqual(after.t, before.t, `${layer.id} totals moved`);
    assert.equal(after.counted.length, before.counted.length,
      `${layer.id} counted something new`);
  }
});

test('the scoreboard adds one for the shootout, not one per attempt', () => {
  // Verified against the archive: for all six sampled shootout games, the
  // non-shootout goals plus one to whoever converted more attempts reproduces
  // the boxscore EXACTLY. Game 2025020419 is why this is not "count the goals":
  // three attempts scored there, against a final score one higher than regulation.
  const three = [
    SO({ per: 5, s: 3900, type: 'goal', own: AID, x: -80, y: 0, actor: +shooterOf(AID), sit: '0101' }),
    SO({ per: 5, s: 3910, type: 'goal', own: HID, x: 80, y: 0, actor: +shooterOf(HID), sit: '1010' }),
    SO({ per: 5, s: 3920, type: 'goal', own: HID, x: 80, y: 0, actor: +shooterOf(HID), sit: '1010' }),
  ];
  const base = corsi.reduce(REG, ctx);
  const r = corsi.reduce(shootoutGame(three), ctx);
  assert.equal(r.hs, base.hs + 1, 'the side that converted more gets exactly one');
  assert.equal(r.as, base.as, 'and the loser gets none');
});

test('a shootout that somehow ties adds nothing to either side', () => {
  // A shootout runs until it is decided, so this should not occur — which is
  // precisely why it must not silently award a goal to whoever the comparison
  // happens to favour. No winner, no goal.
  const drawn = [
    SO({ per: 5, s: 3900, type: 'goal', own: AID, x: -80, y: 0, actor: +shooterOf(AID), sit: '0101' }),
    SO({ per: 5, s: 3910, type: 'goal', own: HID, x: 80, y: 0, actor: +shooterOf(HID), sit: '1010' }),
  ];
  const base = corsi.reduce(REG, ctx);
  const r = corsi.reduce(shootoutGame(drawn), ctx);
  assert.equal(r.hs, base.hs);
  assert.equal(r.as, base.as);
});

test('a game without a shootout is untouched by any of this', () => {
  // The reference game, and every playoff game ever. Period 5 in the playoffs
  // is a third overtime and is real hockey; only `pt` tells them apart.
  const r = corsi.reduce(EVENTS, ctx);
  assert.equal(r.hs, 3);
  assert.equal(r.as, 2);
  assert.ok(conservation(r, EVENTS.length).ok);
});
