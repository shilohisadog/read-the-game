/**
 * Zone starts — the reducer, built 2026-09-09, and the ice marks it draws.
 *
 * ⚠️⚠️ THIS HEADER SAID "NOT yet wired to the page" UNTIL 2026-09-18, and it was
 * wrong — `drawZoneStarts` runs from `render()` and the layer is on the row under
 * the scrubber. The wiring landed after the note below was written and nobody
 * came back to it, which is this repo's own warning about inherited claims: a
 * sentence in a header is not evidence, and the file that states it is the last
 * place anyone looks. What follows is the history, kept because the defect it
 * describes is real; it is no longer the current state.
 *
 * ⚠️ THE PAGE WIRING WAS BUILT AND REVERTED THE SAME EVENING (2026-09-09), and the
 * reason is recorded rather than hidden: with the layer's draw call added to `render()`,
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
import { boot, pickLayer } from './helpers/page.js';

const APP_JS = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

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

/**
 * ⭐ EVERY RING CARRIES ITS COUNT, AND THE LONE DRAW IS THE POINT — 2026-09-18.
 *
 * Kevin: "we don't show the number 1 when there's only 1 draw on a face-off dot
 * ... I think we should show the number, even if it's 1."
 *
 * ⛔ WHAT THE OLD RULE WAS, AND WHY IT WENT. `drawZoneStarts` wrote the number
 * only when `n > 1`, on the reasoning that a count exists because the marks STACK
 * — nine dots hold every draw in a game — so a ring with one draw says one
 * already. That makes ABSENCE carry meaning, and the only place the convention
 * was ever stated is the layer's own help text ("no number means one"), which is
 * a rule about our drawing and not a fact about hockey.
 *
 * ⚠️ AND NOTHING TESTED THE COUNT AT ALL BEFORE THIS. `render-ends.test.js` reads
 * the ring to check it turns over with the rink; no test had ever read `.zsn`. The
 * digit on the ice was an untested claim, which is why the change is landing with
 * a check rather than after one.
 *
 * ⭐ THE FRAME WITH A LONE DRAW IS FOUND, NOT ASSUMED. A test that only asserted
 * "as many numbers as rings" would pass on a page that still hid the 1 — the
 * counts and the rings would simply both be zero at that moment. So this walks the
 * replay, requires that a dot with exactly one draw really occurs, and reads the
 * digit off the ice at that frame.
 */
test('every zone-start ring shows its count, and a single draw shows a 1', () => {
  const a = boot();
  pickLayer(a, 'zonestart');
  const rings = html => [...html.matchAll(/<circle class="zs(?: now)?"/g)].length;
  const nums  = html => [...html.matchAll(/<text class="zsn"[^>]*>(\d+)</g)].map(m => +m[1]);

  let sawLone = 0, frames = 0;
  a.every(d => {
    const h = String(d.$('draws').innerHTML);
    const r = rings(h), n = nums(h);
    if (!r) return;
    frames++;
    assert.equal(n.length, r,
      `${r} ring(s) on the ice and ${n.length} number(s) — a ring without its count is back`);
    sawLone += n.filter(x => x === 1).length ? 1 : 0;
  });

  assert.ok(frames > 0, 'no frame ever drew a zone-start ring, so this proves nothing');
  assert.ok(sawLone > 0,
    'no dot in the whole replay ever held exactly one draw, so the case Kevin asked '
    + 'about was never exercised — this test would pass with the old n>1 rule');
});

/**
 * ⭐ AND THE HELP TEXT MAY NOT OUTLIVE THE RULE IT DESCRIBES. The sentence "no
 * number means one" was true of the drawing and is now false; a layer whose copy
 * teaches a convention the ice no longer uses is the same defect as a legend
 * naming a mark nothing paints.
 */
test('the zone-start copy no longer teaches the convention that was removed', () => {
  /* ⚠️ THE COPY STRING, NOT THE FILE — and the first version of this test got that
     wrong in the way this repo keeps re-learning. Scanning all of `app.js` for the
     phrase turned red on the COMMENT above `drawZoneStarts`, which quotes it to
     explain why it went. A check that cannot tell code from the words about the
     code is not a check about code; `layer-copy.test.js` reads the layer's copy
     the same way, by pulling the string out first. */
  const copy = /\bzonestart:'((?:[^'\\]|\\.)*)'/.exec(APP_JS);
  assert.ok(copy, 'the zone-start copy is gone, so this check has lost its subject');
  assert.doesNotMatch(copy[1], /no number means one/i,
    'the help text still says an absent number means one draw, and every ring now '
    + 'carries its count');
  assert.match(copy[1], /number inside it is how many draws/,
    'the copy stopped explaining what the number on a ring is');
});
