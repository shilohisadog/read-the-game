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
import { situation, isEven, whyNotEven, standing, penaltyKilled, powerPlayOver, windows, SKATERS_MIN, SKATERS_MAX, EVEN, POWER_PLAY, EMPTY_NET, PENALTY_SHOT } from '../src/lib/strength.js';

/**
 * ⭐ THE READABLE CODES, DERIVED FROM THE DECODER RATHER THAN LISTED BESIDE IT.
 *
 * This was `KNOWN_SITUATIONS`, imported — so the exhaustive loops below walked
 * the very list that decided the answer, and every one of them was a mirror
 * (§H): the set under test and the set generating the expectation were one
 * object. It could not have caught a code being wrongly admitted OR wrongly
 * refused, which is the entire failure it was written to prevent.
 *
 * Enumerating all ten thousand and keeping what `situation` reads gives the same
 * exhaustiveness with an INDEPENDENT path, and it grows by itself: widen the
 * decoder and these loops cover the new codes without anyone remembering to.
 * It lives in the test rather than the module because the bundle ships to a
 * phone and ten thousand iterations at boot is a cost the page has no use for.
 */
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { danger } from '../src/lib/layers/danger.js';

const READABLE = new Set();
for (let n = 0; n < 10000; n++) {
  const c = String(n).padStart(4, '0');
  if (situation(c, { homeId: 1, awayId: 2 })) READABLE.add(c);
}

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

/**
 * ⭐ THE CODES THE ALLOWLIST WAS REFUSING, AND WHY EACH ONE IS NOW READ.
 *
 * Not "the decoder works" — each of these is a state the eight-code list dropped
 * on the floor, named, with the reason it was never a judgement call. Every one
 * is a real code counted in the fixtures.
 */
test('⭐ the states the eight-code list could not see', () => {
  // 3-on-3 overtime. Both goalies in, equal skaters — EVEN by the same clause
  // that reads 5v5 and 4v4, which were both on the old list. 44 events.
  assert.equal(situation('1331', base).kind, EVEN);
  assert.equal(situation('1331', base).advantage, null, 'nobody has an advantage at 3-on-3');
  assert.equal(isEven('1331', base), true,
    'isEven has documented "5v5, 4v4 or 3v3" the whole time it refused 3v3');

  // Five-on-three, both ways round. 15 events.
  assert.equal(situation('1351', base).kind, POWER_PLAY);
  assert.equal(situation('1351', base).advantage, base.homeId, 'home has five against three');
  assert.equal(situation('1531', base).advantage, base.awayId, 'and away, mirrored');

  // Four-on-three. 4 events.
  assert.equal(situation('1431', base).kind, POWER_PLAY);
  assert.equal(situation('1431', base).advantage, base.awayId);

  // An empty net alongside a two-man edge — the branch that needs BOTH rules.
  assert.equal(situation('1460', base).kind, EMPTY_NET,
    'a pulled goalie still outranks the skater count');
});

/**
 * ⭐⭐ THE REGULATION PENALTY SHOT — Kevin's correction, and the population it turns on.
 *
 * I refused this shape and argued the rule for it: a state designed against data
 * we do not hold is how the blocked-shot flip got in. Kevin: *"I am sure there
 * are penalty shots in regulation time, not frequent but enough to warrant a
 * valid condition."* He is right, and the evidence was already in the repo —
 * `extract.py` says the shape "blocks 44 games in REGULATION, because it is also
 * a PENALTY SHOT," naming game 2025010011. **The rule was sound and I applied it
 * to the wrong population:** seven fixtures are not the archive.
 *
 * ⚠️ WHICH IS WHY THIS TEST SAYS WHAT IT CANNOT SEE. No fixture holds a
 * regulation penalty shot, so the frames below are CONSTRUCTED. Green here means
 * the branch is right, not that it has ever met real recorded play — and the
 * archive guard is what will close that, not this file.
 */
test('⭐ a regulation penalty shot is a state, not a shrug', () => {
  const away = situation('0101', base);
  assert.equal(away.kind, PENALTY_SHOT);
  assert.equal(away.advantage, base.awayId, 'the side with one skater is shooting');
  const home = situation('1010', base);
  assert.equal(home.kind, PENALTY_SHOT);
  assert.equal(home.advantage, base.homeId, 'and mirrored');

  // NOT EVEN STRENGTH — the filtering is unchanged, only the words are new.
  assert.equal(isEven('0101', base), false);
  const why = whyNotEven({ sit: '0101' }, base);
  assert.match(why, /penalty shot/, 'the ledger names it');
  assert.doesNotMatch(why, /could not read/, 'it is no longer a refusal');
  assert.equal(why.startsWith(base.awayAb), true, 'and names the shooting club');

  /* ⭐ THE SHOOTOUT IS UNAFFECTED, which is the whole reason this is safe. Every
     one of the 26 such codes in our fixtures is `pt === 'SO'`, and `inShootout`
     removes those before strength is consulted — so reading the shape here
     cannot leak shootout attempts into a count. Proven, not asserted. */
  const so = EVENTS.map((e, i) => i === 5 ? { ...e, sit: '0101', pt: 'SO' } : e);
  const ev = corsi.reduce(so, even);
  const entry = ev.excluded.find(x => x.id === 5);
  assert.ok(entry, 'a shootout frame must still be excluded');
  assert.ok(entry.dims.play, 'and excluded on the PLAY dimension, before strength is asked');
  assert.doesNotMatch(JSON.stringify(entry.dims), /penalty shot/,
    'the shootout must never be described as a penalty shot');
  assert.match(entry.dims.strength, /shootout attempt/,
    'and the strength sentence names what it actually is');

  /* ⭐ THE SAME CODE, THE OTHER PERIOD — the pair that proves the period is what
     is doing the work. One assertion alone is satisfied by a branch that always
     returns the same string. */
  assert.match(whyNotEven({ sit: '0101', pt: 'REG' }, base), /penalty shot/);
  assert.match(whyNotEven({ sit: '0101', pt: 'SO' }, base), /shootout attempt/);
});

/**
 * ⛔ AND WHAT IS STILL REFUSED — the half that makes the change safe.
 *
 * Widening a decoder is only correct if the refusals that remain are the ones we
 * mean. Each of these is a DIFFERENT reason, so a single over-broad clause
 * cannot satisfy them all.
 */
test('⛔ the refusals that remain, one per reason', () => {
  assert.equal(situation('2551', base), null, 'a goalie digit above 1 is not our flag');
  assert.equal(situation('1552', base), null, 'nor at the other end');
  assert.equal(situation('1751', base), null, `${SKATERS_MAX} skaters is the ceiling`);
  assert.equal(situation('1251', base), null, `${SKATERS_MIN} is the floor`);
  assert.equal(situation('0660', base), null,
    'both nets empty names no club, so it states nothing');
  /* ⛔ THE PENALTY-SHOT SHAPE NEEDS BOTH HALVES. One skater against none is only
     a penalty shot when the shooter has no goalie and the defender does; a code
     that counts 1 and 0 any other way is a code we do not recognise, not a
     penalty shot we narrate. Without this the branch would swallow anything
     shaped vaguely like it. */
  assert.equal(situation('1101', base), null,
    'the shooter still has a goalie in net — not the penalty-shot arrangement');
  assert.equal(situation('0100', base), null, 'nobody is defending the net');
  assert.equal(situation('155', base), null, 'three digits');
  assert.equal(situation('15a1', base), null, 'not a number');
  assert.equal(situation(1551, base), null, 'a number, not the string the feed sends');
});

/**
 * ⭐⭐ THE SENTENCE THAT WAS A FALSE CLAIM ABOUT THE LEAGUE.
 *
 * `summarise` puts this string in the work panel, where a novice reads it. It
 * said "game state not recorded for this event" — but the state IS recorded: the
 * feed sent a code and `extract.py` stored it under `sit`. We could not read it.
 * Blaming the league for our own gap is precisely the class of claim this site
 * exists not to make, and no arithmetic check anywhere could have seen it.
 */
test('⭐ the refusal blames us, not the league', () => {
  const why = whyNotEven({ sit: '0660' }, { ...base, evenOnly: true });
  assert.ok(why, 'an unreadable code must cost the event its place, not buy one');
  assert.doesNotMatch(why, /not recorded|no record|missing/i,
    'the league recorded it — we could not read it');
  assert.match(why, /could not read/);

  // NULL MEANS EVEN AND ONLY EVEN — the property the old docstring described
  // backwards, and the one every `evenOnly` caller depends on.
  assert.equal(whyNotEven({ sit: '1551' }, base), null, 'even strength, and nothing else');
  assert.equal(whyNotEven({ sit: '1331' }, base), null, '3-on-3 is even too');
  assert.ok(whyNotEven({ sit: '9999' }, base), 'unreadable is a reason, never silence');
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
    assert.match(x.dims.strength, /power play|pulled their goalie|could not read/,
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

test('the skater counts are stated from the named team\'s side', () => {
  // CHENG's finding. The sentence names one team, then quotes two numbers; if
  // those are in the feed's away-then-home order the first number belongs to
  // the named team only by luck. It did not, for 36 of this game's exclusions:
  // "BUF were on the power play -- 4 skaters against 5", where BUF had 5.
  //
  // Exhaustive over KNOWN_SITUATIONS rather than over the codes this game
  // happens to contain -- 1560, 1450 and 1540 never occur here, and those are
  // exactly the branches nobody would notice were wrong.
  for (const code of READABLE) {
    const s = situation(code, base);
    // EVEN has no sentence, and a PENALTY SHOT deliberately quotes no counts —
    // "1 skater against 0" is arithmetic that teaches nothing. Both are asserted
    // on their own terms below rather than forced through this parser.
    if (s.kind === EVEN || s.kind === PENALTY_SHOT) continue;

    const msg = whyNotEven({ sit: code }, base);
    const m = msg.match(/^(\w+) .*— (\d+) skaters against (\d+)/);
    assert.ok(m, `unparseable reason for ${code}: ${msg}`);
    const [, ab, own, opp] = m;

    // Whose sentence is this? Empty net names the team that pulled; a power
    // play names the team with the extra skater.
    const expectAb = s.kind === EMPTY_NET
      ? (code[0] === '0' ? base.awayAb : base.homeAb)
      : (s.advantage === base.homeId ? base.homeAb : base.awayAb);
    assert.equal(ab, expectAb, `${code}: wrong team named — ${msg}`);

    const isHome = ab === base.homeAb;
    assert.equal(+own, +code[isHome ? 2 : 1],
      `${code}: "${msg}" quotes ${own} for ${ab}, who had ${code[isHome ? 2 : 1]}`);
    assert.equal(+opp, +code[isHome ? 1 : 2], `${code}: wrong opponent count — ${msg}`);
  }
});

test('a team on the power play never reads as having fewer skaters', () => {
  // The symptom, pinned separately from the rule above. This is the sentence a
  // novice actually reads, and it must not contradict itself no matter how the
  // ordering is implemented.
  for (const code of READABLE) {
    const s = situation(code, base);
    if (s.kind !== POWER_PLAY) continue;
    const [, own, opp] = whyNotEven({ sit: code }, base)
      .match(/— (\d+) skaters against (\d+)/);
    assert.ok(+own > +opp,
      `${code}: the team on the power play is quoted ${own} against ${opp}`);
  }
});

/* ═══ `standing` — the same facts as a CONDITION, for the scoreboard badge ═══
 *
 * A badge differs from the ledger's sentence in tense and in job, not in
 * wording, and the only part of either that has ever been wrong is WHICH TEAM
 * and WHOSE SKATERS. So the load-bearing test here is not that the badge says
 * something sensible — it is that it says the SAME thing the ledger does. */

test('the badge is dark at even strength and on a code we cannot read', () => {
  // It sits on screen rather than flashing, so a wrong badge is wrong for
  // minutes.
  assert.equal(standing('1551', base), null, '5v5 is not a condition worth a badge');
  assert.equal(standing('1441', base), null, '4v4 is even strength');
  assert.equal(standing('1331', base), null, '3-on-3 overtime is even strength');
  assert.equal(standing(undefined, base), null);
  assert.equal(standing('1991', base), null, 'nine skaters a side is not a state we read');
});

/**
 * ⭐⭐ THE ASSERTION THAT WOULD HAVE STAYED GREEN WHILE ITS MESSAGE WENT FALSE.
 *
 * The line above used to read `standing('1331') === null, '3-on-3 overtime is
 * UNREADABLE, not even'` — and after the decoder landed, 3-on-3 became EVEN,
 * for which `standing` also returns null. Same assertion, same green, opposite
 * reason, and nothing in the suite could tell the difference. A test whose
 * MESSAGE is the only thing that changed is a test that stopped describing the
 * code, so the fact has to be pinned where a wrong answer is a wrong VALUE.
 *
 * `1531` is the one that moved: five-on-three was refused and is now a power
 * play, so the badge that was dark must now be lit. That is a value, and it is
 * the direction of this whole change stated as one.
 */
test('⭐ five-on-three lights the badge it used to be blind to', () => {
  assert.equal(situation('1331', base).kind, EVEN,
    '3-on-3 overtime — both goalies in, equal skaters');
  const s = standing('1531', base);
  assert.ok(s, 'five-on-three is a condition, and the badge must say so');
  assert.equal(s.kind, POWER_PLAY);
  assert.equal(s.id, base.awayId, 'the away side has five against three');
  assert.equal(s.own, 5); assert.equal(s.opp, 3);
});

test('⭐ the badge and the ledger name the SAME team and quote the SAME counts', () => {
  // THE ONE-READER GUARANTEE, as a relationship rather than two lists of
  // constants. Both callers go through `relativeTo`; if anyone re-implements
  // either side, these two stop agreeing and this fails — which is the only
  // way to catch a second copy that happens to be right on the codes the
  // reference game contains and backwards on the four it does not.
  let checked = 0, shots = 0;
  for (const code of READABLE) {
    const s = situation(code, base);
    if (s.kind === EVEN) continue;
    const b = standing(code, base);
    const msg = whyNotEven({ sit: code }, base);

    /* ⭐ THE PENALTY SHOT IS HELD TO THE HALF OF THE GUARANTEE THAT APPLIES.
       WHICH TEAM is the part that has ever been wrong, and it is checked here
       exactly as for the other kinds. The counts are not compared because
       neither surface prints them — and THAT is asserted, so the day one of them
       starts quoting "1 on 0" this notices rather than skipping it. */
    if (s.kind === PENALTY_SHOT) {
      const [, ab] = msg.match(/^(\w+) /);
      assert.equal(b.ab, ab, `${code}: badge says ${b.ab}, ledger says ${ab}`);
      assert.doesNotMatch(msg, /\d/, `${code}: the ledger quoted a count — ${msg}`);
      assert.doesNotMatch(b.count, /\d/, `${code}: the badge quoted a count — ${b.count}`);
      shots++;
      continue;
    }

    const [, ab, own, opp] = msg.match(/^(\w+) .*— (\d+) skaters against (\d+)/);
    assert.equal(b.ab, ab, `${code}: badge says ${b.ab}, ledger says ${ab}`);
    assert.equal(b.count, `${own} on ${opp}`,
      `${code}: badge says "${b.count}", ledger says ${own} against ${opp}`);
    checked++;
  }
  assert.ok(checked >= 6, `only ${checked} non-even codes compared`);
  assert.equal(shots, 2, 'both penalty-shot codes must be reached, or the branch is untested');
});

test('the badge never says a team on the power play has fewer skaters', () => {
  for (const code of READABLE) {
    const s = situation(code, base);
    if (s.kind !== POWER_PLAY) continue;
    const b = standing(code, base);
    assert.equal(b.said, 'power play');
    const [own, opp] = b.count.split(' on ').map(Number);
    assert.ok(own > opp, `${code}: the badge reads "${b.ab} ${b.said} · ${b.count}"`);
  }
});

test('an empty net is badged as an empty net, and names the club that pulled', () => {
  const b = standing('0651', base);
  assert.equal(b.said, 'net empty', 'a pulled goalie is not a power play');
  assert.equal(b.ab, base.awayAb, 'code[0]=0 is the AWAY net');
  assert.equal(b.count, '6 on 5', 'counted from the side that pulled');
});

test('⭐ the badge lags the penalty by one event, and that is the point', () => {
  // `render` refuses to say "power play" in the penalty caption because at that
  // frame the offending team is not yet short — "a claim about the future
  // dressed as a description". The badge reads the frame's own code, so it
  // inherits that refusal instead of restating it. Asserted on the real game.
  const pens = EVENTS.map((e, n) => [e, n]).filter(([e]) => e.type === 'penalty');
  assert.equal(pens.length, 8, 'the reference game has eight penalties');
  let darkAtCall = 0;
  for (const [e, n] of pens) {
    const next = EVENTS.slice(n + 1).find(x => x.sit);
    assert.ok(next, 'every penalty is followed by a coded event');
    if (situation(e.sit, base).kind === EVEN) {
      assert.equal(standing(e.sit, base), null,
        `P${e.per} ${e.rem}: the badge lit at the call, before anyone was short`);
      assert.ok(standing(next.sit, base), `P${e.per} ${e.rem}: it never lit afterwards`);
      darkAtCall++;
    }
  }
  assert.equal(darkAtCall, 6, 'six of the eight are called at even strength');
});

test('⭐ a penalty DURING a power play darkens the badge — it is 4-on-4, not a second advantage', () => {
  // The other two of the eight, and the failure mode a caption alone cannot
  // avoid: BUF are up 5-on-4 (1451), a BUF player is boxed, and the code goes
  // to 1441 — four-on-four, which is EVEN. A surface that announced "penalty"
  // and left the old state standing would tell a novice Minnesota had just
  // gone on the power play. The badge going out is the correction.
  const during = EVENTS.map((e, n) => [e, n]).filter(([e]) =>
    e.type === 'penalty' && situation(e.sit, base)?.kind === POWER_PLAY);
  assert.equal(during.length, 2, 'two penalties are called while a power play is on');
  for (const [e, n] of during) {
    const next = EVENTS.slice(n + 1).find(x => x.sit);
    assert.equal(next.sit, '1441', `P${e.per} ${e.rem}: expected four-on-four`);
    assert.equal(standing(next.sit, base), null,
      `P${e.per} ${e.rem}: the badge stayed lit through a penalty that cancelled the advantage`);
  }
});

/* ═══ `penaltyKilled` — the three refusals, on frames the fixture cannot show ═══
 *
 * ⭐ WHY THESE ARE SYNTHETIC AND THE OTHERS ARE NOT. The reference game contains
 * eight power-play-to-even transitions and **zero** across a period boundary, so
 * that guard is unreachable from `rich.json` — a mutation deleting it survived a
 * green suite of 857. The archive has 4 in 327, which is exactly the rate at
 * which a real fixture will not carry one. Constructing the condition is the
 * only way to test a branch the data will not reach; every OTHER claim about
 * this rule is made against the real game.
 *
 * ⭐ AND EACH REFUSAL IS PAIRED WITH THE SAME SHAPE THAT SUCCEEDS. A test that
 * only ever asserts "no kill" is satisfied by a function that never returns one.
 */
const K = { homeId: 7, awayId: 30, homeAb: 'BUF', awayAb: 'MIN' };
//  sit = [awayGoalie][awaySkaters][homeSkaters][homeGoalie]; `1451` is BUF up
//  5-on-4, so MIN (the away club, id 30) is the one killing it.
const frame = (per, s, sit) => ({ per, s, sit, type: 'faceoff' });
const stint = (end, endedBy) => ({ team: 30, start: 0, end, endedBy, min: 2 });

test('⭐ a penalty that runs out IS a kill — the positive control for the three below', () => {
  const got = penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'time')], K);
  assert.equal(got.length, 1, 'the shape every refusal below is a variation of');
  /* BOTH CLUBS, and the shape is asserted whole rather than field by field so a
     new field cannot arrive unnoticed. `killedBy` is the club that HELD and
     `advantage` the club that had the extra skater — the two sentences have
     different subjects and the caption chips whichever its own verb is about. */
  assert.deepEqual(got[0],
    { at: 1, sayAt: 1, killedBy: 30, advantage: 7, aside: 5, by: 'time' });
});

/* ═══ THE OTHER WAY A POWER PLAY ENDS ═══════════════════════════════════════
 *
 * Kevin, on a live sequence: *"CAR is on a power play, then the next event is a
 * CAR goal, nothing shows the power play is now over (because the team scored),
 * that's a gap I think."*
 *
 * ⭐ HE IS RIGHT, AND HIS MISREADING IS THE EVIDENCE. On that specimen the
 * penalty had expired on the clock four seconds BEFORE the goal — so the page's
 * silence led a viewer who knows the sport cold to infer the wrong rule. A
 * novice would infer the same and learn something false.
 *
 * ⚠️ AND NONE OF THIS IS REACHABLE FROM `rich.json`. Its six transitions land on
 * faceoffs, hits, blocked shots and a shot on goal — not one of them on a GOAL —
 * so a check driven through the page could only ever exercise the branch that
 * does nothing. Constructed events reach it; the fixture cannot, and saying so
 * is the point of these four. */
const goalAt = (per, s, sit) => ({ per, s, sit, type: 'goal' });

test('⭐ a power play SCORED ON is returned now, and named as its own thing', () => {
  // It was REFUSED, on the reasoning that "the goal caption owns that frame
  // anyway" — an assumption about presentation living inside a reducer, and the
  // reason 21.1% of endings went by in silence.
  const got = powerPlayOver([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'goal')], K);
  assert.equal(got.length, 1, 'a power play scored on still says nothing');
  assert.equal(got[0].by, 'goal', 'it is not distinguished from a kill');
  // AND THE PAIR: `penaltyKilled` must still refuse it, or the shield ends up on
  // the team that just conceded.
  assert.deepEqual(penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'goal')], K), [], 'a power-play goal was captioned as a kill');
});

test('⭐ a transition ON a goal waits one frame, so the goal keeps its caption', () => {
  const got = powerPlayOver(
    [frame(1, 100, '1451'), goalAt(1, 110, '1551'), frame(1, 111, '1551')],
    [stint(105, 'time')], K);
  assert.equal(got.length, 1);
  assert.equal(got[0].at, 1, 'the strength changed on the goal frame');
  assert.equal(got[0].sayAt, 2, 'the sentence stayed on the goal frame and was thrown away');
});

test('...but never twice, never onto another goal, and never across a period', () => {
  // Each refusal is a case where deferring would put the sentence somewhere it
  // describes something else. Paired with the success above, which is the same
  // shape with the obstruction removed.
  const back2back = powerPlayOver(
    [frame(1, 100, '1451'), goalAt(1, 110, '1551'), goalAt(1, 111, '1551')],
    [stint(105, 'time')], K);
  assert.equal(back2back[0].sayAt, 1, 'it chased a second goal instead of standing still');

  const across = powerPlayOver(
    [frame(1, 100, '1451'), goalAt(1, 110, '1551'), frame(2, 111, '1551')],
    [stint(105, 'time')], K);
  assert.equal(across[0].sayAt, 1, 'the sentence crossed an intermission to a different situation');

  const noNext = powerPlayOver(
    [frame(1, 100, '1451'), goalAt(1, 110, '1551')], [stint(105, 'time')], K);
  assert.equal(noNext[0].sayAt, 1, 'it deferred to a frame that does not exist');
});

test('⭐ two penalties ending together by DIFFERENT causes is refused, not guessed', () => {
  // There is no single true sentence for "one ran out and one was scored on",
  // and inventing one is worse than the silence this whole change removes.
  const mixed = powerPlayOver([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'time'), stint(106, 'goal')], K);
  assert.deepEqual(mixed, [], 'a mixed ending was given one of the two sentences');
  // AND THE PAIR: the same two stints agreeing DO produce one.
  assert.equal(powerPlayOver([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'time'), stint(106, 'time')], K).length, 1,
    'two stints ending together is refused even when they agree');
});

test('⭐ no stint in the box record is no claim — the strength code is not enough', () => {
  // 7 of 327 archive endings look like a kill by the situation code while
  // `box.js` has nobody of that club in the box: a bench minor served by a
  // player the feed does not name, a delayed penalty, a record that disagrees
  // with itself. The code alone would let us announce a kill with no penalty
  // behind it, which is a sentence about a thing that may not have happened.
  assert.deepEqual(penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1551')], [], K), [],
    'a kill was claimed with an empty box record');
  assert.deepEqual(penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [{ team: 7, start: 0, end: 105, endedBy: 'time', min: 2 }], K), [],
    'the OTHER club’s penalty was read as this club’s kill');
});

test('⭐ an INTERMISSION is not a kill — a penalty can carry across it', () => {
  // `windows()` says so in its own header: one runs from P2 00:36 to P3 18:43 in
  // the reference game. Nothing expired at the horn, so nothing was killed.
  assert.deepEqual(penaltyKilled([frame(1, 1190, '1451'), frame(2, 1200, '1551')],
    [stint(1195, 'time')], K), [], 'the period boundary was captioned as a kill');
});

test('⭐ five-on-four going to FOUR-ON-FOUR is a second penalty, not a kill', () => {
  // 8.0% of power-play endings in the archive. The advantage is gone and the
  // club that was short is no better off — they did not get their skater back,
  // the other club lost one. Saying "penalty killed" would credit them for it.
  assert.deepEqual(penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1441')],
    [stint(105, 'time')], K), [], 'a cancelled advantage was captioned as a kill');
});

test('⭐ a power play SCORED ON is not a kill, and the stint is what says so', () => {
  // ⚠️ THIS BRANCH WAS UNEXERCISED AND A MUTATION DISABLING IT SURVIVED. In the
  // reference game both goal-ended penalties sit at a second the goal SHARES
  // with its restarting faceoff (1170 and 3147), and the window was open at the
  // lower end — so `ended` came back empty and the transition was refused by
  // "no stint ended here" rather than by `endedBy`. Right answer, wrong reason.
  // The window is closed at both ends now; this pins the guard that does the
  // work, on the identical frames as the control above.
  assert.deepEqual(penaltyKilled([frame(1, 100, '1451'), frame(1, 110, '1551')],
    [stint(105, 'goal')], K), [], 'a power-play goal was captioned as a kill');
  // AND THE SAME-SECOND CASE THE REFERENCE GAME ACTUALLY CONTAINS.
  assert.deepEqual(penaltyKilled([frame(1, 1170, '1541'), frame(1, 1170, '1551')],
    [{ team: 7, start: 1114, end: 1170, endedBy: 'goal', min: 2 }], K), [],
    'two frames on one second hide the stint, so the goal reads as an expiry');
});

test('⭐ and with the same two frames one second apart, that one IS a kill', () => {
  // The pair, so neither result comes from the frames rather than the rule.
  const got = penaltyKilled([frame(1, 1170, '1541'), frame(1, 1170, '1551')],
    [{ team: 7, start: 1114, end: 1170, endedBy: 'time', min: 2 }], K);
  assert.equal(got.length, 1, 'the same frames with a time-ended stint are a kill');
  assert.equal(got[0].killedBy, 7, 'BUF were the ones short at 1541');
});

for (const layer of LAYERS) {
  test(`${layer.id}: no exclusion reason contains a placeholder`, () => {
    // CHENG's suggested guard, and the class matters more than the instance.
    // Every existing test asks whether a reason EXISTS; none read one. That is
    // the same shape as the ESM leak guard -- checking structure while the
    // failure lives in content. An unresolved template variable is invisible to
    // a length check and glaring to a reader.
    for (const ctx of [base, even]) {
      for (const x of layer.reduce(EVENTS, ctx).excluded) {
        for (const [dim, reason] of Object.entries(x.dims || {})) {
          assert.doesNotMatch(String(reason), /undefined|\bnull\b|NaN|\[object/,
            `event ${x.id} ${dim}: ${reason}`);
        }
      }
    }
  });
}

test('the placeholder guard fires when the context is missing a field', () => {
  // TEST THE TEST'S REACH. The guard above passes on a correct build, which
  // proves nothing on its own. Withhold the abbreviations -- the exact shape of
  // a caller that reads the destructured `{ roster, homeId, awayId }` and
  // supplies only those -- and the reasons must go visibly wrong.
  const { homeAb, awayAb, ...starved } = even;
  const reasons = corsi.reduce(EVENTS, starved).excluded
    .filter(x => x.dims && x.dims.strength).map(x => x.dims.strength);
  assert.ok(reasons.length > 0, 'there are strength reasons to inspect');
  assert.ok(reasons.some(r => /undefined/.test(r)),
    'a missing abbreviation must show up in the copy, or this guard is inert');
});

test('an unreadable situation code is refused rather than assumed even', () => {
  // Reading the digits shrank this set — 3-on-3, 5-on-3 and 4-on-3 are states
  // now, not refusals — but it did not empty it, and the league can still send
  // something new. Treating an unknown code as "even" would silently fold a
  // state we do not understand into the number we are most careful about.
  const bogus = EVENTS.map((e, i) => i === 5 ? { ...e, sit: '7777' } : e);
  const ev = corsi.reduce(bogus, even);
  const entry = ev.excluded.find(x => x.id === 5);
  assert.ok(entry, 'the event is excluded, not counted');
  assert.match(entry.dims.strength, /could not read/, 'and says why');
  assert.equal(isEven('7777', base), false, 'never treated as even');
});
