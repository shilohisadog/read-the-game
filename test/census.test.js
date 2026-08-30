/**
 * The census — four archive questions, and the arithmetic that folds them.
 *
 * ⭐ WHAT THIS FILE MAY AND MAY NOT ASSERT. The fixtures are adversarial, not
 * representative — their own README says "a test in this directory may assert a
 * property holds; it may never assert how often something happens." So nothing
 * here pins a rate. Every test below is about a PROPERTY of the arithmetic:
 * that the totals are integers, that they add exactly, that the control holds
 * the zone constant, that a refusal is a refusal. The numbers themselves belong
 * to the pipeline run over 4,553 extracts.
 *
 * ⚠️ AND I ALREADY BROKE THAT RULE ONCE THIS WEEK — I quoted `miss` at 33% and
 * `drew` at 39% off eight games, five of which were stale extracts predating the
 * fields. The correct figures are 100% and 93%. That is why this file asserts
 * shapes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { censusGame, censusAdd, censusRates, zoneOf, runAfter } from '../src/lib/census.js';
import { BLUE_LINE_X } from '../src/lib/rink.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const rich = load('../data/rich.json');
const ctxOf = g => ({ roster: g.roster,
  homeId: g.teams.home.id, awayId: g.teams.away.id,
  homeAb: g.teams.home.ab, awayAb: g.teams.away.ab });

const GAMES = ['../data/rich.json',
               './fixtures/extracts/2025030214.json',
               './fixtures/extracts/2025030223.json'].map(load);

test('the zone is the blue line, read from the same constant the ice is painted from', () => {
  /* A LITERAL 25 HERE WOULD BE A SECOND COPY of a number the rink already owns,
     free to agree with a wrong first one. `BLUE_LINE_X` is what `drawRink` uses
     for the zone band, so a reader can check a classification against the paint.
     Both directions, because attacking -x is half of every game. */
  assert.equal(zoneOf(BLUE_LINE_X + 1, 1), 'O');
  assert.equal(zoneOf(BLUE_LINE_X - 1, 1), 'N');
  assert.equal(zoneOf(-BLUE_LINE_X - 1, 1), 'D');
  assert.equal(zoneOf(-BLUE_LINE_X - 1, -1), 'O', 'attacking -x is not mirrored');
  assert.equal(zoneOf(BLUE_LINE_X + 1, -1), 'D');
  // ON the line is not in the zone: offside turns on crossing it, not touching it.
  assert.equal(zoneOf(BLUE_LINE_X, 1), 'N');
});

test('every tally is a whole number, so the archive folds exactly', () => {
  /* ⭐ THIS IS THE PROPERTY THE WHOLE DESIGN RESTS ON. A per-game RATE cannot be
     summed — a mean of means weights a 40-event game like an 80-event one — so
     the census carries counts and divides once at the end. A single float
     sneaking into a tally would make 4,553 additions lossy and the error would
     be invisible: the number would merely be slightly wrong. */
  const c = censusGame(rich.events, ctxOf(rich));
  const walk = (o, path = '') => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number') {
        assert.ok(Number.isInteger(v), `${path}${k} is ${v}, not an integer`);
      } else walk(v, `${path}${k}.`);
    }
  };
  walk(c);
});

test('adding games is addition — the total equals the sum of the parts', () => {
  // A fold that dropped or double-counted a branch would still produce plausible
  // output, so this compares the accumulated total against the same numbers
  // added by hand, key by key.
  const each = GAMES.map(g => censusGame(g.events, ctxOf(g)));
  const total = {};
  for (const c of each) censusAdd(total, c);
  assert.equal(total.games, GAMES.length);
  const sum = (pick) => each.reduce((s, c) => s + pick(c), 0);
  assert.equal(total.faceoffZone.O.n, sum(c => c.faceoffZone.O.n));
  assert.equal(total.faceoffZone.D.aw, sum(c => c.faceoffZone.D.aw));
  assert.equal(total.endZone.won.atk, sum(c => c.endZone.won.atk));
  assert.equal(total.state.pp.secs, sum(c => c.state.pp.secs));
  assert.equal(total.hitCorr.sxy, sum(c => c.hitCorr.sxy));
});

test('every faceoff with a place lands in exactly one zone', () => {
  // A classifier with a gap loses draws silently, and a total that is merely
  // smaller than it should be looks like a quiet season.
  for (const g of GAMES) {
    const c = censusGame(g.events, ctxOf(g));
    const placed = g.events.filter(e =>
      e.type === 'faceoff' && e.own != null && e.x != null && e.pt !== 'SO').length;
    const counted = c.faceoffZone.O.n + c.faceoffZone.N.n + c.faceoffZone.D.n;
    assert.equal(counted, placed,
      `${placed} placed draws went into ${counted} zone slots in game ${g.game.id}`);
  }
});

test('the run of play stops at something the league recorded, never at a number we chose', () => {
  /* ⚠️ NOTHING WAS TESTING THIS AND A MUTATION PROVED IT: capping the window at
     six events changed every faceoff figure and the suite stayed green. The
     window is the single most important choice in this file — a "next N events"
     or "next 20 seconds" rule would be a parameter with no source in the data,
     and the answer would move with the number chosen. Both ends have to be
     events the league recorded. */
  for (const g of GAMES) {
    for (let i = 0; i < g.events.length; i++) {
      if (g.events[i].type !== 'faceoff') continue;
      const run = runAfter(g.events, i);
      // nothing inside the run may be a boundary...
      for (const e of run) {
        assert.ok(!['stoppage', 'period-end', 'game-end', 'faceoff'].includes(e.type),
          `a ${e.type} was swallowed into the run after the draw at index ${i}`);
        assert.equal(e.per, g.events[i].per, 'the run crossed a period');
      }
      // ...and the event that ENDED it must be one, or the game must have run out.
      const after = g.events[i + run.length + 1];
      if (after) {
        const isBoundary = ['stoppage', 'period-end', 'game-end', 'faceoff'].includes(after.type)
          || after.per !== g.events[i].per;
        assert.ok(isBoundary,
          `the run after index ${i} stopped at a ${after.type}, which is not a boundary`);
      }
    }
  }
});

test('the control holds the zone constant and lets only the winner vary', () => {
  /* ⭐ THE CONFOUND THIS EXISTS FOR. In `faceoffZone` the SAME physical draw
     lands in the O row or the D row depending only on who won it, so that table
     cannot separate being in the attacking end from winning the puck there.
     `endZone` fixes the end — every draw in it is at the same place — and splits
     by whether the attacking club won. If the two buckets ever stopped covering
     the same population, the comparison would be between different games. */
  for (const g of GAMES) {
    const c = censusGame(g.events, ctxOf(g));
    const inEnd = g.events.filter(e =>
      e.type === 'faceoff' && e.own != null && e.x != null && e.pt !== 'SO'
      && Math.abs(e.x) > 60).length;
    assert.equal(c.endZone.won.n + c.endZone.lost.n, inEnd,
      'the two halves of the control do not cover the end-zone draws');

    /* ⚠️ AND COVERAGE ALONE PASSES A BROKEN CONTROL — proven by mutation.
       Defining the attacking club as `e.own` puts every draw in the `won`
       bucket, leaves `lost` empty, and still covers the population perfectly.
       That is the confound walking back in through the door built to keep it
       out, so the SPLIT is asserted independently: which end a draw is at comes
       from the sign of x, never from who won it. */
    const ctx = ctxOf(g);
    let won = 0, lost = 0;
    for (const e of g.events) {
      if (e.type !== 'faceoff' || e.own == null || e.x == null || e.pt === 'SO') continue;
      if (Math.abs(e.x) <= 60) continue;
      (e.own === (e.x > 0 ? ctx.homeId : ctx.awayId) ? won++ : lost++);
    }
    assert.equal(c.endZone.won.n, won, 'the control is not split by the attacking club');
    assert.equal(c.endZone.lost.n, lost);
    assert.ok(won > 0 && lost > 0,
      `game ${g.game.id} has ${won}/${lost} — one side of the control is empty, so it compares nothing`);
  }
});

test('a power-play draw was won BY the club with the advantage, and the gap is the refusal', () => {
  /* ⚠️ THE OBVIOUS IMPLEMENTATION IS WRONG AND IT IS WRONG QUIETLY. "A faceoff
     that happened during a power play" counts the SHORT-HANDED club's wins into
     the power-play bucket, which is a different question with a different answer
     — and the ratio would look entirely reasonable. Same shape as the
     short-handed goal rule, where "fewer skaters" is not "penalised".

     ⭐ AND THE INDEPENDENT COUNT DELIBERATELY DISAGREES WITH THE CENSUS, BY AN
     AMOUNT THIS TEST NAMES. The rule below reads `sit` directly and accepts any
     unequal-skaters code; the census asks `situation()`, which KNOWS EIGHT CODES
     and refuses the rest — so five-on-three draws are counted here and refused
     there. Reconciling the two by hand would have hidden that; requiring the
     difference to equal the refused draws exactly makes the blindness a
     measured, asserted quantity instead of a surprise in a season's numbers. */
  const KNOWN = new Set(['1551', '1541', '1451', '1441', '0651', '1560', '1450', '1540']);
  for (const g of GAMES) {
    const c = censusGame(g.events, ctxOf(g));
    const ctx = ctxOf(g);
    let byHand = 0, refused = 0;
    for (const e of g.events) {
      if (e.type !== 'faceoff' || e.own == null || e.x == null || e.pt === 'SO') continue;
      if (!e.sit || e.sit.length !== 4) continue;
      const aw = +e.sit[1], hm = +e.sit[2];
      if (e.sit[0] === '0' || e.sit[3] === '0' || aw === hm) continue;
      const advantage = aw > hm ? ctx.awayId : ctx.homeId;
      if (e.own !== advantage) continue;
      byHand++;
      if (!KNOWN.has(e.sit)) refused++;
    }
    assert.equal(c.drawStrength.pp.n, byHand - refused,
      `game ${g.game.id}: the census counted ${c.drawStrength.pp.n} power-play draws, ` +
      `the ice held ${byHand}, and ${refused} were refused for an unknown code`);
  }
});

test('five-on-three is in the archive and strength.js cannot read it', () => {
  /* ⭐ NOT A BUG BEING TOLERATED — a refusal being MEASURED. `KNOWN_SITUATIONS`
     lists eight codes and the feed carries more; `situation()` returns null
     rather than guessing, which is right. What was missing is anybody counting
     the cost. If this test ever fails because the count went to zero, the codes
     were added and the census can stop apologising; if it fails because the
     count grew, the league invented another one. Either way somebody looks. */
  const total = {};
  for (const g of GAMES) censusAdd(total, censusGame(g.events, ctxOf(g)));
  const r = censusRates(total);
  assert.ok(r.state.unknown.minutes > 0,
    'no fixture carries an unreadable situation code, so this proves nothing');
  const codes = new Set();
  for (const g of GAMES) for (const e of g.events) {
    if (e.sit && e.sit.length === 4 && e.sit[0] !== '0' && e.sit[3] !== '0'
        && Math.abs(+e.sit[1] - +e.sit[2]) > 1) codes.add(e.sit);
  }
  assert.ok(codes.size > 0,
    `no two-skater advantage in any fixture — the blindness is unproven here`);
});

test('the shootout is in none of it', () => {
  /* ⚠️ THE FIRST VERSION OF THIS TEST WAS STRUCTURALLY VACUOUS. It asserted that
     no shootout FACEOFF reached the zone tally — and a shootout contains no
     faceoffs at all, so it could not fail. Removing the guard entirely left it
     green. What a shootout does contain, in this fixture, is 3 goals and 5 shots
     on goal at a single second, every one of them unblocked and from the slot.
     THOSE are what must stay out: three goals against zero elapsed seconds
     would put an infinite goal rate into a per-60. */
  const so = load('./fixtures/extracts/2023020207.json');
  const soGoals = so.events.filter(e => e.pt === 'SO' && e.type === 'goal').length;
  assert.ok(soGoals > 0, 'that fixture no longer has shootout goals, so this proves nothing');

  const c = censusGame(so.events, ctxOf(so));
  const inPlayGoals = so.events.filter(e => e.type === 'goal' && e.pt !== 'SO').length;
  const counted = c.state.even.goals + c.state.pp.goals + c.state.en.goals + c.state.unknown.goals;
  assert.equal(counted, inPlayGoals,
    `${counted} goals reached the state clock and only ${inPlayGoals} were in play`);

  const inPlayAttempts = so.events.filter(e =>
    e.pt !== 'SO' && e.own != null &&
    ['shot-on-goal', 'missed-shot', 'blocked-shot', 'goal'].includes(e.type)).length;
  assert.ok(c.club.h.attempts + c.club.a.attempts <= inPlayAttempts,
    'a shootout attempt was credited to a club');
});

test('an unreadable situation code is carried, never folded into even strength', () => {
  /* ⭐ `strength.js` KNOWS EIGHT CODES AND THE ARCHIVE CONTAINS MORE — 1351 and
     1431 are five-on-three and four-on-three, and it refuses them by design.
     The census must carry that refusal as its own bucket: adding unreadable time
     to `even` would put five-on-three minutes into the even-strength goal rate,
     which is the exact number the power-play comparison rests on. */
  const total = {};
  for (const g of GAMES) censusAdd(total, censusGame(g.events, ctxOf(g)));
  assert.ok(total.state.unknown, 'there is no bucket for time we cannot classify');
  assert.ok(total.state.unknown.secs > 0,
    'no fixture contains an unreadable code, so this proves nothing');
  const r = censusRates(total);
  assert.ok(r.state.unknown.minutes > 0, 'the refusal is not reported');
});

test('a rate with no denominator is null, never zero', () => {
  /* A zero would be published as a fact — "teams never score at five-on-three" —
     when what happened is that no five-on-three occurred. Same standing
     `situation()` takes on a code it does not know. */
  const r = censusRates({});
  assert.equal(r.state.pp.per60, null);
  assert.equal(r.faceoffZone.O.winnerPerDraw, null);
  assert.equal(r.endZone.zoneWorth, null);
  assert.equal(r.hits.r, null);
  assert.equal(r.games, 0);
});

test('the correlation is computed from sums, so it does not depend on game order', () => {
  /* r cannot be averaged across games, which is why the census carries six
     additive sums instead. If the implementation ever reverted to a mean of
     per-game values, shuffling the games would move the answer. */
  const fwd = {}, rev = {};
  for (const g of GAMES) censusAdd(fwd, censusGame(g.events, ctxOf(g)));
  for (const g of [...GAMES].reverse()) censusAdd(rev, censusGame(g.events, ctxOf(g)));
  assert.deepEqual(censusRates(fwd).hits, censusRates(rev).hits);
});
