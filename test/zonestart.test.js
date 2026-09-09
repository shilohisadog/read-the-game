/**
 * Zone starts — the reducer, built 2026-09-09, NOT yet wired to the page.
 *
 * ⚠️ THE PAGE WIRING WAS BUILT AND REVERTED THE SAME EVENING, and the reason is
 * recorded rather than hidden: with the layer's draw call added to `render()`,
 * the WHISTLE layer stopped drawing its on-ice marks — 1 ring across the
 * reference sweep became 0 — and the cause was not found. The reducer is
 * exonerated by the probe that narrowed it: `whistle.reduce` still places 44 of
 * 44 stoppages and `marks()` still returns its mark when called directly, so
 * whatever moved is in the page and not in either layer. Shipping a lens that
 * silently costs another lens its marks is the defect class this project spends
 * most of its effort on, so it did not ship.
 *
 * WHAT IS VERIFIED HERE is the half that is finished: the counting rule, the
 * zone attribution, and the two ways a draw can fail to be placed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zonestart } from '../src/lib/layers/zonestart.js';
import { attackZone } from '../src/lib/rink.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const GAMES = ['../data/rich.json',
               './fixtures/extracts/2025030214.json',
               './fixtures/extracts/2025030223.json'].map(load);
const ctxOf = g => ({ roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id });

test('⭐ every event is either counted or excluded — the layer conserves', () => {
  /* THE CONTRACT ALL SIX LAYERS SHARE, and the one that makes the work panel a
     single panel rather than five. A layer that dropped an event on the floor
     would show a reader a total that does not add up to the game. */
  for (const g of GAMES) {
    const L = zonestart.reduce(g.events, ctxOf(g));
    assert.equal(L.counted.length + L.excluded.length, g.events.length,
      'the layer neither counted nor excluded some event');
  }
});

test('⭐ it counts every faceoff and nothing else', () => {
  for (const g of GAMES) {
    const L = zonestart.reduce(g.events, ctxOf(g));
    const draws = g.events.filter(e => e.type === 'faceoff' && e.pt !== 'SO').length;
    assert.equal(L.counted.length, draws, 'the count is not the faceoffs');
    for (const id of L.counted)
      assert.equal(g.events[id].type, 'faceoff', 'something that is not a draw was counted');
    assert.ok(draws > 40, 'a fixture with almost no faceoffs makes this vacuous');
  }
});

test('⛔ THE ZONE IS FROM THE WINNER\'S POINT OF VIEW, which is the whole rule', () => {
  /* The same dot is an attacking start for one club and a defending start for
     the other, so a zone with no owner is meaningless. This is asserted by
     flipping the winner on real events and requiring O and D to swap — a check
     that a version reading the HOME club's direction unconditionally would fail,
     which is the mistake actually available to make. */
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const L = zonestart.reduce(g.events, ctx);
  const flipped = zonestart.reduce(g.events.map(e =>
    e.type === 'faceoff' && e.own != null
      ? { ...e, own: e.own === ctx.homeId ? ctx.awayId : ctx.homeId }
      : e), ctx);

  let swaps = 0;
  for (const id of L.counted) {
    const a = L.zones[id], b = flipped.zones[id];
    if (a == null || b == null) continue;
    if (a === 'N') { assert.equal(b, 'N', 'a neutral-zone draw changed zone when the winner did'); continue; }
    assert.equal(b, a === 'O' ? 'D' : 'O',
      'flipping the winner did not swap the zone — the zone is not read from the winner');
    swaps++;
  }
  assert.ok(swaps > 30, `only ${swaps} end-zone draws exercised this`);
});

test('the zone agrees with the geometry the ice is painted from', () => {
  /* ⭐ DERIVED, NOT RESTATED. `attackZone` is the same function the archive
     census used to produce the 1.163 / 0.52 figures the layer's caption quotes,
     so the mark and the sentence answer with one rule. A local `x > 25` here
     would be a second answer free to disagree with the number it illustrates. */
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const L = zonestart.reduce(g.events, ctx);
  for (const id of L.counted) {
    const e = g.events[id];
    if (L.zones[id] == null) continue;
    const dir = e.own === ctx.homeId ? 1 : -1;
    assert.equal(L.zones[id], attackZone(e.x, dir),
      'the layer and the rink disagree about which zone a point is in');
  }
});

test('⭐ the per-zone tallies add up to the draws each club won', () => {
  for (const g of GAMES) {
    const ctx = ctxOf(g);
    const L = zonestart.reduce(g.events, ctx);
    for (const tid of [ctx.homeId, ctx.awayId]) {
      const z = L.z[tid];
      assert.equal(z.O + z.N + z.D, L.t[tid], `the zone split for ${tid} does not sum to its total`);
    }
    assert.equal(L.t[ctx.homeId] + L.t[ctx.awayId] + L.unplaced.length, L.counted.length,
      'the two clubs and the unplaced do not account for every draw counted');
  }
});

test('⛔ a draw with no recorded winner is COUNTED and credited to nobody', () => {
  /* THE WHISTLE LAYER'S OWN ANSWER TO THE SAME QUESTION: "we know this happened
     and cannot place it" is a different claim from "nothing happened". Dropping
     it would make the game's faceoff total quietly wrong; defaulting it to a club
     would invent a fact. Measured on a real stream with one field removed. */
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const base = zonestart.reduce(g.events, ctx);
  const first = base.counted[0];
  const bent = g.events.map((e, i) => i === first ? { ...e, own: null } : e);
  const L = zonestart.reduce(bent, ctx);

  assert.equal(L.counted.length, base.counted.length, 'the draw stopped being counted');
  assert.ok(L.unplaced.includes(first), 'it was not recorded as unplaced');
  assert.equal(L.t[ctx.homeId] + L.t[ctx.awayId], base.counted.length - 1,
    'it was credited to a club anyway');
  assert.match(L.surprising.find(s => s.id === first).why, /did not record which club/);
});

test('⛔ …and a draw with no coordinate is counted, credited, and placed nowhere', () => {
  // THE OTHER FAILURE, and it is a different one: we know who won and not where.
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const base = zonestart.reduce(g.events, ctx);
  const first = base.counted[0];
  const bent = g.events.map((e, i) => i === first ? { ...e, x: null } : e);
  const L = zonestart.reduce(bent, ctx);

  assert.equal(L.counted.length, base.counted.length);
  assert.ok(L.unplaced.includes(first));
  assert.equal(L.zones[first], undefined, 'a zone was invented for a draw with no coordinate');
  assert.match(L.surprising.find(s => s.id === first).why, /no coordinate/);
});

test('⛔ the shootout is not play, and its draws are not zone starts', () => {
  /* Every other layer excludes the shootout on the `play` dimension and this one
     must use the same word for the same thing — a dimension meaning one thing in
     five layers and another in the sixth is the drift that cost a day when `play`
     meant two things in `blocked.js`. */
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const base = zonestart.reduce(g.events, ctx);
  const so = { ...g.events.find(e => e.type === 'faceoff'), pt: 'SO', per: 5, s: 99999 };
  const L = zonestart.reduce([...g.events, so], ctx);
  assert.equal(L.counted.length, base.counted.length, 'a shootout draw was counted');
  const x = L.excluded.find(e => e.id === g.events.length);
  assert.ok(x && x.dims.play, 'the shootout draw was excluded on the wrong dimension');
});

test('the even-strength filter reaches this layer, because a draw is worth more on a power play', () => {
  /* `census.drawStrength` says 4.302x on the power play against 1.273x at even
     strength (ARCHIVE, n=22,790 / 190,144) — a bigger effect than the zone one.
     A reader who turns Even strength on is asking the right question and must not
     get a total that quietly mixes the two. */
  const g = GAMES[0];
  const ctx = ctxOf(g);
  const all = zonestart.reduce(g.events, { ...ctx, evenOnly: false });
  const even = zonestart.reduce(g.events, { ...ctx, evenOnly: true });
  assert.ok(even.counted.length < all.counted.length,
    'the strength filter changed nothing, so it is not wired to this layer');
  for (const x of even.excluded.filter(e => g.events[e.id].type === 'faceoff'))
    assert.ok(x.dims.strength || x.dims.play, 'a draw was excluded without saying why');
});
