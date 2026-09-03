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
import { situation, POWER_PLAY } from '../src/lib/strength.js';
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

     ⭐⭐ THIS USED TO CARRY A CORRECTION TERM, AND THE CORRECTION IS NOW ZERO.
     The census asked `situation()`, which knew EIGHT LITERAL CODES and refused
     the rest, so five-on-three draws were counted by the hand-rule below and
     refused by the census. The test allowed for that by subtracting the refused
     ones — and to do it, it carried a NINTH copy of those eight codes right
     here. A test holding its own duplicate of the list under test is the drift
     it was written to detect, one file further along.

     `situation()` now reads the digits, so the two counts agree EXACTLY and the
     allowance is gone. That is strictly stronger: an exact equality has no slack
     for a future refusal to hide in, so the day the league sends a code we
     cannot read during a power-play draw, this fails and names it — which is the
     "somebody looks" the correction term was standing in for. The hand-rule
     stays fully independent: it reads `sit` and never asks `census.js`. */
  for (const g of GAMES) {
    const c = censusGame(g.events, ctxOf(g));
    const ctx = ctxOf(g);
    let byHand = 0;
    const seen = new Set();
    for (const e of g.events) {
      if (e.type !== 'faceoff' || e.own == null || e.x == null || e.pt === 'SO') continue;
      if (!e.sit || e.sit.length !== 4) continue;
      const aw = +e.sit[1], hm = +e.sit[2];
      if (e.sit[0] === '0' || e.sit[3] === '0' || aw === hm) continue;
      const advantage = aw > hm ? ctx.awayId : ctx.homeId;
      if (e.own !== advantage) continue;
      byHand++; seen.add(e.sit);
    }
    assert.equal(c.drawStrength.pp.n, byHand,
      `game ${g.game.id}: the census counted ${c.drawStrength.pp.n} power-play draws and ` +
      `the ice held ${byHand}. The codes involved were ${[...seen].sort().join(', ')} — ` +
      `if one of those is new, the decoder refused it and the census lost a draw.`);
  }
});

test('⭐ five-on-three is in the archive, and strength.js reads it now', () => {
  /* ⭐⭐ THIS TEST PREDICTED ITS OWN REPLACEMENT, AND THE PREDICTION IS WHY IT IS
     SAFE TO CHANGE IT. It used to assert `unknown.minutes > 0` and said why:
     "if this test ever fails because the count went to zero, the codes were
     added and the census can stop apologising; if it fails because the count
     grew, the league invented another one. Either way somebody looks."

     It went to zero. `situation()` decodes the digits instead of matching eight
     literals, so five-on-three, four-on-three and 3-on-3 overtime are states
     rather than refusals. Measured over the seven fixtures (2,793 events
     carrying a code — a FIXTURE figure, not an archive one): 91 refusals became
     27, and the census's unclassifiable TIME went to zero seconds.

     ⛔ THE 27 ARE NOT AN OVERSIGHT. Twenty-six are `0101`/`1010`, one skater
     against none — a shootout attempt, which the census already excludes — and
     one is `0660`, both nets empty, which names no club and so states nothing.

     So the assertion inverts: the two-skater advantage that was the CAUSE of the
     apology must now be READ, and named as a power play. */
  const seen = new Set();
  for (const g of GAMES) for (const e of g.events) {
    if (e.sit && e.sit.length === 4 && e.sit[0] !== '0' && e.sit[3] !== '0'
        && Math.abs(+e.sit[1] - +e.sit[2]) > 1) seen.add(e.sit);
  }
  assert.ok(seen.size > 0,
    'no two-skater advantage in any fixture — this proves nothing either way');

  const ctx = { homeId: 1, awayId: 2 };
  for (const code of seen) {
    const s = situation(code, ctx);
    assert.ok(s, `${code} is a two-skater advantage and the decoder still refuses it`);
    assert.equal(s.kind, POWER_PLAY, `${code} is a two-skater advantage, not ${s.kind}`);
    // The bigger side holds the advantage — the half a literal list never checked.
    assert.equal(s.advantage, +code[1] > +code[2] ? ctx.awayId : ctx.homeId,
      `${code}: the advantage is on the wrong side`);
  }
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
  /* ⭐ THE BUCKET MUST SURVIVE ITS OWN EMPTINESS. Adding unreadable time to
     `even` would put a state we do not understand into the even-strength goal
     rate, which is the exact number the power-play comparison rests on.

     ⚠️ AND THE INSTRUMENT IS NOW UNEXERCISED BY THE FIXTURES, which is the
     dangerous half of a defect being fixed. This asserted `unknown.secs > 0`,
     and that is the only thing that made it a check; with the decoder reading
     the digits, no fixture leaves unclassifiable TIME behind, so the same
     assertion inverted to `=== 0` would pass against a census that had deleted
     the bucket entirely. A test that cannot tell "nothing to classify" from
     "nothing being classified" is not a test about classification.

     So it does both: the real fixtures must leave the bucket EMPTY, and an
     injected code the decoder cannot read must land IN it. The second half is
     what keeps the first half meaningful. */
  const total = {};
  for (const g of GAMES) censusAdd(total, censusGame(g.events, ctxOf(g)));
  assert.ok(total.state.unknown, 'there is no bucket for time we cannot classify');
  assert.equal(total.state.unknown.secs, 0,
    'a fixture now carries time the decoder cannot read — the league sent something new');

  /* THE BUCKET, PROVEN ABLE TO FILL. `7777` is seven skaters a side, which is
     not hockey and never will be, so it can never collide with a real state. */
  const g = GAMES[0];
  const idx = g.events.findIndex((e, i) =>
    e.sit && i > 0 && i < g.events.length - 1 && e.pt !== 'SO');
  assert.ok(idx > 0, 'no mid-game event carries a code, so nothing can be injected');
  const bogus = g.events.map((e, i) => i === idx ? { ...e, sit: '7777' } : e);
  const hurt = censusGame(bogus, ctxOf(g));
  assert.ok(hurt.state.unknown.secs > 0,
    'an unreadable code left no time in the unknown bucket — it was folded somewhere');

  const clean = censusGame(g.events, ctxOf(g));
  assert.equal(clean.state.unknown.secs, 0, 'the same game, unhurt, classifies fully');
  assert.ok(hurt.state.even.secs < clean.state.even.secs
         || hurt.state.pp.secs < clean.state.pp.secs,
    'the unknown time was ADDED rather than taken from the state it came out of');
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
