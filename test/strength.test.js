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
import { situation, isEven, whyNotEven, standing, windows, KNOWN_SITUATIONS, EVEN, POWER_PLAY, EMPTY_NET } from '../src/lib/strength.js';
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

test('the skater counts are stated from the named team\'s side', () => {
  // CHENG's finding. The sentence names one team, then quotes two numbers; if
  // those are in the feed's away-then-home order the first number belongs to
  // the named team only by luck. It did not, for 36 of this game's exclusions:
  // "BUF were on the power play -- 4 skaters against 5", where BUF had 5.
  //
  // Exhaustive over KNOWN_SITUATIONS rather than over the codes this game
  // happens to contain -- 1560, 1450 and 1540 never occur here, and those are
  // exactly the branches nobody would notice were wrong.
  for (const code of KNOWN_SITUATIONS) {
    const s = situation(code, base);
    if (s.kind === EVEN) continue;

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
  for (const code of KNOWN_SITUATIONS) {
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
  // minutes. `1331` (3-on-3 overtime) and `1531` (five-on-three) are real codes
  // from the archive that `KNOWN_SITUATIONS` does not carry; the badge must go
  // dark on them rather than fall back to a guess.
  assert.equal(standing('1551', base), null, '5v5 is not a condition worth a badge');
  assert.equal(standing('1441', base), null, '4v4 is even strength');
  assert.equal(standing('1331', base), null, '3-on-3 overtime is unreadable, not even');
  assert.equal(standing('1531', base), null, 'five-on-three is unreadable, not a power play');
  assert.equal(standing(undefined, base), null);
});

test('⭐ the badge and the ledger name the SAME team and quote the SAME counts', () => {
  // THE ONE-READER GUARANTEE, as a relationship rather than two lists of
  // constants. Both callers go through `relativeTo`; if anyone re-implements
  // either side, these two stop agreeing and this fails — which is the only
  // way to catch a second copy that happens to be right on the codes the
  // reference game contains and backwards on the four it does not.
  let checked = 0;
  for (const code of KNOWN_SITUATIONS) {
    const s = situation(code, base);
    if (s.kind === EVEN) continue;
    const b = standing(code, base);
    const [, ab, own, opp] = whyNotEven({ sit: code }, base)
      .match(/^(\w+) .*— (\d+) skaters against (\d+)/);
    assert.equal(b.ab, ab, `${code}: badge says ${b.ab}, ledger says ${ab}`);
    assert.equal(b.count, `${own} on ${opp}`,
      `${code}: badge says "${b.count}", ledger says ${own} against ${opp}`);
    checked++;
  }
  assert.ok(checked >= 6, `only ${checked} non-even codes compared`);
});

test('the badge never says a team on the power play has fewer skaters', () => {
  for (const code of KNOWN_SITUATIONS) {
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
