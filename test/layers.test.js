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
import { boot } from './helpers/page.js';
import { conservation, summarise } from '../src/lib/layer.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { danger } from '../src/lib/layers/danger.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { SHOT_TYPES, ATTEMPT_TYPES } from '../src/lib/attribution.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const ctx = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const EVENTS = rich.events;
const LAYERS = [corsi, goaltending, danger, blocked];

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

test('a blocked shot is NEVER from the slot, however slot-shaped its coordinate', () => {
  // THE BEHAVIOUR WAS ALREADY RIGHT AND THE REASON WAS INHERITED, which is how a
  // correct behaviour gets refactored away by somebody tidying up (CHENG). This
  // pins the reason.
  //
  // A blocked shot's (x, y) is where the puck was STOPPED, not where it was
  // shot — the block point sits between the shooter and the net, so it is
  // systematically nearer the net than the shot that produced it. Over an
  // 80-game random sample: median 24.2 ft against 33.4 for a shot on goal, and
  // only 6.1% beyond 50 ft, while the point shot is the most-blocked shot in
  // hockey and the blue line is ~64 ft out (docs/blocked-shots-layer.md §3).
  //
  // So the geometry can be satisfied by a coordinate that describes the BLOCKER.
  // The event below is the adversarial case: 20 ft out, dead centre, which the
  // slot rule would accept on any other attempt type. It must not be counted,
  // and the ledger must say why in words rather than dropping it silently.
  const shooter = EVENTS.find(e => e.type === 'blocked-shot' && e.actor);
  assert.ok(shooter, 'the fixture has no blocked shot to build from');
  const slotShaped = { ...shooter, x: 69, y: 0 };     // 20 ft from the net, centred

  const before = danger.reduce(EVENTS, ctx);
  const after = danger.reduce(EVENTS.map((e, i) => (i === EVENTS.indexOf(shooter) ? slotShaped : e)), ctx);
  assert.equal(after.counted.length, before.counted.length,
    'a blocked shot moved into the slot changed the count — the block point is being read as a shot origin');

  const why = new Map(after.excluded.map(x => [x.id, x.why]));
  const id = EVENTS.indexOf(shooter);
  assert.ok(why.has(id), 'the slot-shaped blocked shot vanished from the ledger instead of being excluded');
  assert.match(why.get(id), /block|reach|not a shot|type/i,
    `the exclusion must say it is a blocked shot, not merely that it missed the geometry — got "${why.get(id)}"`);

  // And the set itself, so the pin survives a rewrite of the layer.
  assert.ok(!SHOT_TYPES.has('blocked-shot'), 'SHOT_TYPES admitted blocked shots');
  assert.ok(ATTEMPT_TYPES.has('blocked-shot'), 'a blocked shot is still an ATTEMPT — that half must not move');
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
  assert.equal(Object.values(s).reduce((a, b) => a + b.n, 0), L.excluded.length);

  /* ⭐ AND IT CARRIES ONE EXAMPLE PER REASON, which is what lets a categorical
     rule keep a real measurement beside it. `detail` is optional -- corsi sets
     none, and every group here must therefore be example-less rather than
     carrying an empty one, because "e.g. " with nothing after it is worse than
     no example at all. */
  for (const [why, g] of Object.entries(s)) {
    assert.ok(g.n > 0, `${why} grouped to a non-positive count`);
    assert.ok(g.eg === undefined || g.eg,
      `${why} carries an empty example, which renders as a dangling "e.g."`);
  }

  /* ⭐ THE SLOT LAYER IS WHY THIS EXISTS. Its exclusions used to name THIS
     event's distance, so grouping did nothing: 276 exclusions became 49 rows,
     32 appearing exactly once, and the work panel reached 3,176px at 390px
     wide. The reason is the rule now and the measurement is the example. The
     number here is a ceiling on the WALL, not a pin on the copy — every other
     layer renders 10 to 13 rows. */
  const D = summarise(danger.reduce(EVENTS, ctx).excluded);
  const rows = Object.keys(D).length;
  const singles = Object.values(D).filter(g => g.n === 1).length;
  assert.ok(rows <= 20, `the slot exclusions group into ${rows} rows — the wall is back`);
  assert.ok(singles <= 3,
    `${singles} slot exclusion reasons appear exactly once, so they are naming `
    + 'the event rather than the rule and grouping cannot work');
  assert.ok(Object.values(D).some(g => g.eg),
    'no slot exclusion carries a measurement, so the rule lost the specificity '
    + 'that taught it — "36 against 33" is the thing worth keeping');
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

/* ------------------------------------------------------- the blocked-shots layer
 *
 * It re-reads an event corsi already counts, from the other side. The tests that
 * matter are about WHO GETS CREDIT, because that is the half a novice's
 * intuition gets wrong and the half this project has already shipped wrong once.
 */

test('a block is credited to the team that DEFENDED, never to the shooter\'s', () => {
  // THE INVERSION THAT MAKES THIS LAYER WORTH HAVING. `e.own` is the SHOOTING
  // team — corsi credits the attempt there and is right to. The block belongs to
  // the other bench. Getting this backwards is the blocked-shot flip that once
  // shipped a wrong flagship number, in mirror image.
  //
  // AND THE FIRST VERSION OF THIS TEST DID NOT CATCH IT. It looped the counted
  // set asserting `roster[e.blk].tid !== e.own` — which is a fact about the
  // DATA, not about the tally. It never read `L.t`, so replacing
  // `t[blocker.tid]++` with `t[e.own]++` left it green. A check built from the
  // input's own model, reading as coverage. The tally must be compared against
  // an expectation derived independently of the reducer, which is this:
  const L = blocked.reduce(EVENTS, ctx);
  const want = { [ctx.homeId]: 0, [ctx.awayId]: 0 };
  for (const e of EVENTS) {
    if (e.type !== 'blocked-shot' || e.pt === 'SO') continue;
    const b = rich.roster[e.blk], s = rich.roster[e.actor];
    if (!b || (s && b.tid === s.tid)) continue;      // unattributable, or a teammate
    want[b.tid]++;
  }
  assert.deepEqual(L.t, want,
    'the per-team tally is not the blocks each team actually made');
  assert.notDeepEqual(L.t, { [ctx.homeId]: want[ctx.awayId], [ctx.awayId]: want[ctx.homeId] },
    'the fixture is symmetric, so a flipped tally would be indistinguishable here');

  const credited = L.t[ctx.homeId] + L.t[ctx.awayId];
  assert.equal(credited + L.teammate.length + L.unknown.length, L.counted.length,
    'every counted block is either credited, a teammate block, or unattributable');
  assert.ok(credited > 0, 'no block was credited to anyone — the tally is dead');
});

test('every counted event is a blocked shot, and every blocked shot in play is counted', () => {
  const L = blocked.reduce(EVENTS, ctx);
  for (const id of L.counted)
    assert.equal(EVENTS[id].type, 'blocked-shot',
      `event ${id} is a ${EVENTS[id].type}, not a block`);

  // The other direction, which is the one that catches a filter that silently
  // drops events: a blocked shot in play may not go missing.
  const inPlay = EVENTS.map((e, i) => (e.type === 'blocked-shot' && e.pt !== 'SO') ? i : -1)
                       .filter(i => i >= 0);
  assert.deepEqual(L.counted, inPlay,
    'the counted set is not exactly the blocked shots that happened in play');
  assert.ok(inPlay.length > 20, `only ${inPlay.length} blocked shots — the fixture is too thin`);
});

test('a TEAMMATE block credits nobody, and says so in words', () => {
  // 7.8% of blocks across an 80-game sample (202 of 2,599) are by the shooter's
  // own teammate — a point shot hitting the winger screening the goalie. It is
  // a real block and a real attempt, but nobody DEFENDED it, so crediting the
  // shooting side would hand a team a defensive stop of its own shot.
  //
  // Built rather than hunted, so the test does not depend on the reference game
  // happening to contain one.
  const real = EVENTS.findIndex(e => e.type === 'blocked-shot' && e.blk && e.actor);
  assert.ok(real > 0, 'the fixture has no blocked shot to rebuild');
  const shooter = rich.roster[EVENTS[real].actor];
  const mate = Object.keys(rich.roster)
    .find(id => rich.roster[id].tid === shooter.tid && +id !== EVENTS[real].actor);
  assert.ok(mate, 'no teammate in the roster to attribute the block to');

  const evs = EVENTS.map((e, i) => i === real ? { ...e, blk: +mate } : e);
  const before = blocked.reduce(EVENTS, ctx);
  const after = blocked.reduce(evs, ctx);

  assert.ok(after.teammate.includes(real), 'a teammate block was not recognised as one');
  assert.equal(after.counted.length, before.counted.length,
    'a teammate block is still a blocked shot and must still be counted');
  assert.equal(after.t[ctx.homeId] + after.t[ctx.awayId],
               before.t[ctx.homeId] + before.t[ctx.awayId] - 1,
    'the teammate block was credited to a team anyway');

  const why = after.surprising.find(s => s.id === real);
  assert.ok(why, 'a teammate block is exactly the counter-intuitive case — it must be surprising');
  assert.match(why.why, /teammate/i);
  /* ⚠️ AND IT SAYS WHAT IT WAS COUNTED IN, not only what it is denied. Kevin,
     reading the card: "the 'counted, surprisingly' says neither team is
     credited with the block, but the header says 'counted'." Every word of the
     old sentence was true and against that heading it said the opposite of it,
     because the caveat had been shipping without the fact. Both halves, and in
     that order — the club word is the page's throughout ("the club that MADE
     it", "credited to neither club"), so the reducer uses it too. */
  assert.match(why.why, /counted/i,
    'the reason never says the block was counted, under a heading that says it was');
  assert.match(why.why, /neither club is credited/i,
    'the reader is not told that nobody got the block');
  assert.ok(why.why.indexOf('counted') < why.why.indexOf('neither club is credited'),
    'the caveat lands before the fact it is a caveat to');
  assert.match(why.derivedFrom, /roster\[event\.blk\]\.tid/,
    'the claim is not checkable against the data that produced it');
});

test('a block with no resolvable blocker is counted and NOT credited', () => {
  // `blk` was present on 2,599 of 2,599 blocked shots in the sample. "Always so
  // far" is not "always", and the failure mode of assuming it is a block silently
  // credited to whichever team the code reached for first.
  const real = EVENTS.findIndex(e => e.type === 'blocked-shot' && e.blk);
  const evs = EVENTS.map((e, i) => i === real ? { ...e, blk: undefined } : e);
  const after = blocked.reduce(evs, ctx);
  assert.ok(after.unknown.includes(real), 'a block with no blocker was not recorded as unattributable');
  assert.ok(after.counted.includes(real), 'it is still a blocked shot and must still be counted');
  const before = blocked.reduce(EVENTS, ctx);
  assert.equal(after.t[ctx.homeId] + after.t[ctx.awayId],
               before.t[ctx.homeId] + before.t[ctx.awayId] - 1,
    'a block with no known blocker was credited to somebody');
});

test('the shootout is not blocking, and even-strength filtering reaches this layer too', () => {
  const L = blocked.reduce(EVENTS, ctx);
  for (const id of L.counted)
    assert.notEqual(EVENTS[id].pt, 'SO', 'a shootout attempt was counted as a block');

  // The Situations toggle must do something here, or it silently lies on this
  // layer while working on the others.
  const even = blocked.reduce(EVENTS, { ...ctx, evenOnly: true });
  assert.ok(even.counted.length <= L.counted.length);
  assert.ok(even.excluded.some(x => x.dims && x.dims.strength),
    'even-strength-only excluded nothing for a strength reason — the toggle is inert here');
});

/* ---------------------------------------------------------------------------
   B2 — THE CONTROL FOLLOWS THE LAYER (CHENG's ruling, docs/status.md B2).
   "When a layer is active its control lives with it; the base view carries
   none." The progressive legend, applied to controls.
   --------------------------------------------------------------------------- */

const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const CSS = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

/**
 * Which CSS class each toggleable layer puts on `#rg`, DERIVED by joining two
 * facts in app.js rather than retyped.
 *
 * A hand-written map would be wrong the first time someone renames a class, and
 * silently: the mapping is NOT identity — `goaltending` toggles `goalie`. The
 * deeplink table gives layer id → variable, and `setX` gives variable → class.
 */
function classOfLayer() {
  const byVar = {};
  for (const m of APP.matchAll(/classList\.toggle\('([a-z]+)',\s*([A-Za-z]+)\)/g)) {
    byVar[m[2]] = m[1];
  }
  const out = {};
  for (const m of APP.matchAll(/\[(\w+)\.id\]:\s*\(\)\s*=>\s*\{\s*([A-Za-z]+)\s*=\s*true/g)) {
    out[m[1]] = byVar[m[2]];
  }
  return out;
}

test('⭐ Situations is offered by exactly the layers that READ the filter', () => {
  // THE RULE, NOT TODAY'S ANSWER. `evenOnly` is what "Even strength only"
  // changes, so the control belongs to every layer whose reducer reads it and
  // to no other. Derived from the reducer sources, so a layer that starts
  // reading the filter — or stops — turns this red instead of quietly offering
  // a control that does nothing.
  const map = classOfLayer();
  assert.ok(Object.keys(map).length >= 5, `only mapped ${JSON.stringify(map)}`);

  const want = new Set();
  for (const [mod, cls] of Object.entries(map)) {
    const file = mod === 'danger' ? 'danger' : mod === 'goaltending' ? 'goaltending' : mod;
    const src = readFileSync(new URL(`../src/lib/layers/${file}.js`, import.meta.url), 'utf8');
    if (/evenOnly/.test(src)) want.add(cls);
  }
  // Sanity: the split is real in both directions, or the assertion below is
  // satisfied by "every layer" or "no layer".
  assert.ok(want.size > 0 && want.size < Object.keys(map).length,
    `every layer or none reads the filter: ${[...want]}`);

  const rule = CSS.match(/([^\n}]*\.figpick\.sit[^{]*)\{display:flex\}/);
  assert.ok(rule, 'no rule shows Situations for any layer');
  const have = new Set([...rule[1].matchAll(/#rg\.([a-z]+)\s+\.figpick\.sit/g)].map(m => m[1]));
  assert.deepEqual([...have].sort(), [...want].sort(),
    'the layers offered the Situations control are not the layers that read it');
});

test('and the base view carries it not at all', () => {
  // The other half. Without this, "offered by exactly those layers" is
  // satisfied by a control that is always visible.
  assert.match(CSS, /#rg \.figpick\.sit\{display:none\}/);
});

test('the controls that DO reach the base view stay in it', () => {
  // CHENG refused moving them wholesale: the learn page's nine doors land with
  // a layer already on, and stripping the base view's controls makes a door a
  // one-way trip — the feature breaking, not a side effect. `trails` is read in
  // the base-view mark loop and the figures ARE the base view.
  /* ⭐ ASSERTED AS BEHAVIOUR, NOT AS A LINE OF SOURCE. This matched
     `if(trails==='off'&&k!==i)continue;` inside `src/app.js`, so moving the mark
     loop into `src/lib/marks.js` broke it while the page had not changed at all.
     Third test in three days coupled to which file holds a string rather than to
     its claim — and the claim here is about what a viewer GETS: in the base view,
     with no layer chosen, asking to keep every mark must actually keep them. */
  const off = boot(null, null, '');
  off.at(200, () => {});
  const before = (off.byId.get('events')._html.match(/class="ev/g) || []).length;

  const on = boot(null, null, '');
  on.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  on.at(200, () => {});
  const after = (on.byId.get('events')._html.match(/class="ev/g) || []).length;

  assert.ok(after > before + 10,
    `trails no longer reaches the base view: keeping every mark drew ${after} marks against `
    + `${before} for the current moment alone. If the control genuinely stopped applying here, `
    + 'it should move out of the base view too — but it has not, so this is a regression.');
  assert.doesNotMatch(CSS, /#rg \.figpick\.(fig|trail)\{display:none\}/);
});
