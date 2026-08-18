/**
 * The penalty box.
 *
 * THE DEFECT THIS FILE EXISTS TO CATCH HAS NO VISIBLE SYMPTOM. A box drawn from
 * the assessed duration renders perfectly: a player sits, a clock runs out, he
 * leaves. It is simply the wrong player on the wrong ice for up to two minutes,
 * and nothing on screen looks broken. So these tests do not check that a box has
 * an occupant -- they check WHICH occupant, and WHEN he leaves, against the
 * league's own strength code.
 *
 * The synthetic fixtures here exist for cases the reference game does not
 * contain (a fight, a short-handed goal, a penalty shot). Where the reference
 * game DOES contain the case, it is used, because a fixture written by the same
 * hand as the implementation can only confirm what its author already believed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stints, occupants } from '../src/lib/box.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const CTX = { homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const HOME = CTX.homeId, AWAY = CTX.awayId;

/** A minimal event, so a fixture states only what it is about. */
const ev = (type, s, o = {}) => ({ type, s, per: 1, clock: '00:00', sit: '1551', ...o });
const pen = (s, team, player, o = {}) =>
  ev('penalty', s, { own: team, actor: player, min: 2, sev: 'MIN', pen: 'tripping', ...o });

test('the reference game: two minutes assessed, fifty-six seconds served', () => {
  // THE ONE THAT MAKES THE FILE NECESSARY. BUF are penalised at 18:34 of the
  // first period, MIN score at 19:30, and the next event reads even strength.
  const all = stints(rich.events, CTX);
  const p = rich.events.find(e => e.type === 'penalty' && e.per === 1 && e.clock === '18:34');
  const s = all.find(x => x.start === p.s);

  assert.equal(s.min, 2, 'two minutes were assessed');
  assert.equal(s.endedBy, 'goal');
  assert.equal(s.end - s.start, 56, 'and fifty-six seconds were served');
  // THE RELATIONSHIP, not the literal. A test pinning `end === 1170` passes
  // while the release stops being tied to the goal at all.
  const goal = rich.events.find(e => e.type === 'goal' && e.s > p.s);
  assert.equal(s.end, goal.s, 'he leaves exactly when the goal is scored');
  assert.ok(s.end < s.start + s.min * 60,
            'the whole point: earlier than the assessment');
  assert.notEqual(goal.own, s.team, 'and the goal was scored by the other team');
});

test('every penalty in the reference game becomes exactly one stint', () => {
  const all = stints(rich.events, CTX);
  const pens = rich.events.filter(e => e.type === 'penalty');
  assert.equal(all.length, pens.length);
  assert.equal(all.length, 8);
  for (const s of all) {
    assert.ok(s.player != null && s.team != null, 'a stint names a player and a box');
    assert.ok(s.end > s.start, 'and lasts a positive amount of time');
  }
  // Four delayed-penalty events carry a team and nothing else; none of them is
  // box time, and an off-by-four here would look entirely plausible.
  assert.equal(rich.events.filter(e => e.type === 'delayed-penalty').length, 4);
});

test('a SHORT-HANDED goal changes nothing — the scorer is the one serving', () => {
  // KEVIN'S CASE. The penalised team scores while down a man; their player stays
  // in the box. This fails condition 1, and it is the reason condition 1 is
  // about WHO scored rather than merely that a goal happened.
  const events = [
    pen(100, HOME, 11),
    // away 5, home 4 -- and HOME, the short team, scores.
    ev('goal', 130, { own: HOME, sit: '1541' }),
  ];
  const [s] = stints(events, CTX);
  assert.equal(s.endedBy, 'time');
  assert.equal(s.end, 100 + 120, 'the full two minutes are served');

  // The mirror, so the test discriminates rather than merely passing: the SAME
  // penalty, the SAME instant, scored by the OTHER team.
  const other = stints([pen(100, HOME, 11),
                        ev('goal', 130, { own: AWAY, sit: '1541' })], CTX);
  assert.equal(other[0].endedBy, 'goal');
  assert.equal(other[0].end, 130);
});

test('a short-handed goal releases nothing even when the OTHER team is also serving', () => {
  // THE TEST ABOVE PASSES FOR THE WRONG REASON ON ITS OWN, and a mutation proved
  // it: delete condition 1 entirely and it still goes green, because with only
  // one team serving there is no opponent penalty for the rule to wrongly reach
  // for -- condition 2 catches it first. That is a test arriving where it already
  // was.
  //
  // Here BOTH boxes are occupied and the SHORT side scores. Without condition 1
  // the rule releases the other team's man, on a goal scored against them.
  const events = [
    pen(100, HOME, 11),
    pen(110, AWAY, 21),
    pen(120, HOME, 12),
    ev('goal', 150, { own: HOME, sit: '1431' }),   // home 3, away 4 -- home scores
  ];
  const all = stints(events, CTX);
  assert.equal(all.find(s => s.player === 21).endedBy, 'time',
               'a goal by the SHORT side must not release the other team’s minor');
  assert.equal(all.find(s => s.player === 21).end, 110 + 120);
  for (const p of [11, 12]) {
    assert.equal(all.find(s => s.player === p).endedBy, 'time',
                 'and it does not release their own men either');
  }
  assert.equal(occupants(all, 151, HOME).length, 2, 'both still sitting');
  assert.equal(occupants(all, 151, AWAY).length, 1);
});

test('fewer skaters is not the same as penalised — a pulled goalie releases nobody', () => {
  // 15 of the 25 short-handed goals in a 39-game sample were `0651`/`1560`: a
  // goalie pulled for an extra attacker, no penalty anywhere on the ice. This is
  // condition 2, and without it the rule reaches for a penalty that is not there.
  const events = [
    pen(100, HOME, 11),
    ev('goal', 900, { own: AWAY, sit: '0651' }),   // away pulled its goalie: 6 v 5
  ];
  const [s] = stints(events, CTX);
  assert.equal(s.end, 220, 'the penalty was long over and is untouched');
  assert.equal(s.endedBy, 'time');
});

test('at four-on-four a goal ends neither penalty, because nobody is short', () => {
  // Coincidental minors put both teams down a skater. NEITHER side is on a power
  // play, so a goal releases nobody -- and the boundary is exactly `>=`, not `>`.
  // A mutation weakening it survived every other test in this file.
  const events = [
    pen(100, HOME, 11), pen(100, AWAY, 21),
    ev('goal', 150, { own: AWAY, sit: '1441' }),
  ];
  const all = stints(events, CTX);
  for (const s of all) {
    assert.equal(s.endedBy, 'time', 'even strength ends nothing early');
    assert.equal(s.end, s.start + 120);
  }
  assert.equal(occupants(all, 151, HOME).length, 1);
  assert.equal(occupants(all, 151, AWAY).length, 1);
});

test('a goal never ends a MAJOR, so a fight does not empty the box', () => {
  // Rule 20.4. The first version of this released any penalty by duration and
  // would have put a fighting major back on the ice on the next goal.
  const events = [
    pen(100, HOME, 11, { min: 5, sev: 'MAJ', pen: 'fighting' }),
    ev('goal', 160, { own: AWAY, sit: '1541' }),
  ];
  const [s] = stints(events, CTX);
  assert.equal(s.endedBy, 'time');
  assert.equal(s.end, 100 + 300, 'all five minutes');
});

test('coincidental majors: two men in the box and five a side on the ice', () => {
  // THE CASE THAT PROVES THIS IS NOT A STRENGTH MODEL. After a fight the ice is
  // at even strength and both boxes are occupied. Anything driven by `sit` shows
  // two empty boxes here, which is the exact failure this module exists to
  // avoid -- and it is why `sit` is consulted only about goals.
  const events = [
    pen(100, HOME, 11, { min: 5, sev: 'MAJ', pen: 'fighting' }),
    pen(100, AWAY, 21, { min: 5, sev: 'MAJ', pen: 'fighting' }),
  ];
  const all = stints(events, CTX);
  assert.equal(occupants(all, 200, HOME).length, 1);
  assert.equal(occupants(all, 200, AWAY).length, 1);
});

test('a penalty shot is not box time', () => {
  // `sev: 'PS'` carries no duration and belongs on the ice. A stint here would
  // put a player in the box for a penalty that never sent him there.
  assert.equal(stints([pen(100, HOME, 11, { sev: 'PS', min: null })], CTX).length, 0);
  assert.equal(stints([pen(100, HOME, 11, { sev: 'PS', min: 0 })], CTX).length, 0);
});

test('a PENALTY SHOT goal releases nobody, in regulation', () => {
  // KEVIN ASKED ABOUT PENALTY SHOTS AND THIS WAS A REAL BUG. `sit` on a penalty
  // shot reads `1010` -- one shooter, one goalie -- and condition 1 read that as
  // a five-skater advantage and released the other team's minor. Rule 24.2 says
  // it does not. It happens in REGULATION, not only a shootout, so `pt` cannot
  // catch it: game 2025020477 has one at 8:02 of the third.
  const events = [
    pen(100, AWAY, 21),
    ev('goal', 150, { own: HOME, sit: '1010', pt: 'REG' }),
  ];
  const [s] = stints(events, CTX);
  assert.equal(s.endedBy, 'time', 'the minor keeps running through a penalty shot');
  assert.equal(s.end, 220);

  // The other phase of the same shape, so the guard is not half-written.
  const other = stints([pen(100, HOME, 11),
                        ev('goal', 150, { own: AWAY, sit: '0101', pt: 'REG' })], CTX);
  assert.equal(other[0].endedBy, 'time');
});

test('the infraction that awards a penalty shot is not box time', () => {
  // `sev: 'PS'` carries `min: 0` in the feed -- observed on
  // `ps-holding-on-breakaway` -- so it is excluded twice over, by duration and
  // by type. The offender stays on the ice; the other team gets a shot instead.
  assert.equal(stints([pen(100, HOME, 11,
    { sev: 'PS', min: 0, pen: 'ps-holding-on-breakaway' })], CTX).length, 0);
  // A GAME MISCONDUCT IS AN EJECTION, not a seat in the box.
  assert.equal(stints([pen(100, HOME, 11, { sev: 'GAM', min: 10 })], CTX).length, 0);
  // And an UNFAMILIAR code with a duration still shows up, rather than silently
  // vanishing -- the exclusion list fails visible, which a whitelist would not.
  assert.equal(stints([pen(100, HOME, 11, { sev: 'XYZ', min: 2 })], CTX).length, 1);
});

test('a shootout goal releases nobody, because a shootout is not play', () => {
  // Defensive, and therefore tested: an untested guard is dead code. `pt: 'SO'`
  // is how every other reducer on the site refuses to count a shootout, and this
  // one agrees with them.
  const events = [
    pen(100, HOME, 11, { min: 5, sev: 'MAJ' }),
    ev('goal', 200, { own: AWAY, sit: '1541', pt: 'SO' }),
    ev('goal', 210, { own: AWAY, sit: '1541', pt: 'REG' }),
  ];
  const all = stints(events, CTX);
  assert.equal(all[0].endedBy, 'time', 'a major is untouched by either');
  const minor = stints([pen(100, HOME, 11),
                        ev('goal', 150, { own: AWAY, sit: '1541', pt: 'SO' })], CTX);
  assert.equal(minor[0].endedBy, 'time', 'and a shootout goal ends no minor');
  assert.equal(minor[0].end, 220);
});

test('he enters on the penalty and is gone the second it ends', () => {
  const all = stints([pen(100, HOME, 11)], CTX);
  assert.equal(occupants(all, 99, HOME).length, 0, 'not before');
  assert.equal(occupants(all, 100, HOME).length, 1, 'on the event itself');
  assert.equal(occupants(all, 219, HOME).length, 1, 'through the last second');
  assert.equal(occupants(all, 220, HOME).length, 0, 'and out when it expires');
  assert.equal(occupants(all, 150, AWAY).length, 0, 'the other box stays empty');
});

test('at five-on-three the goal releases the EARLIEST, and only one of them', () => {
  const events = [
    pen(100, HOME, 11), pen(140, HOME, 12),
    ev('goal', 180, { own: AWAY, sit: '1531' }),
  ];
  const all = stints(events, CTX);
  const first = all.find(s => s.player === 11), second = all.find(s => s.player === 12);
  assert.equal(first.endedBy, 'goal');
  assert.equal(first.end, 180);
  assert.equal(second.endedBy, 'time', 'the later penalty keeps running');
  assert.equal(second.end, 140 + 120);
  assert.equal(occupants(all, 181, HOME).length, 1, 'one man still sitting');
});

test('the band is OUTSIDE the rink’s viewBox, so the rink cannot shrink for it', () => {
  // MEASURED, NOT ASSUMED: the rink is 136px tall on a 390px phone against 373px
  // on a laptop, so a band placed inside the viewBox costs most where there is
  // least. The suite cannot see a pixel, but it can see containment -- and
  // containment is the property the measurement turned into a rule.
  const page = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
  const svg = page.slice(page.indexOf('<svg viewBox="0 0 200 85"'));
  const inner = svg.slice(0, svg.indexOf('</svg>'));
  assert.ok(page.includes('class="pboxes"'), 'the band is on the page at all');
  assert.ok(!inner.includes('pboxes'),
            'the penalty box must not live inside the rink svg');
  // And it is emitted unconditionally -- a band that appears only when occupied
  // moves everything below it twice a period.
  assert.ok(/<div class="pboxes"[^>]*>[\s\S]{0,220}?id="pbH"/.test(page),
            'both boxes are present in the markup, empty or not');
});

test('the occupancy the reference game actually shows, counted', () => {
  // A COUNT DISCRIMINATES WHERE A PREDICATE CANNOT. Every assertion above could
  // hold while the box was empty for most of the game; this pins how much box
  // time the game contains at all, on both sides.
  const all = stints(rich.events, CTX);
  const secs = t => rich.events.filter(e => occupants(all, e.s, t).length).length;
  assert.equal(all.filter(s => s.team === HOME).length, 4);
  assert.equal(all.filter(s => s.team === AWAY).length, 4);
  assert.ok(secs(HOME) > 0 && secs(AWAY) > 0,
            'both boxes are used, so a one-sided renderer cannot pass by luck');
  // Two of the eight end on a goal -- 18:34 of the first and 10:50 of the third,
  // both on a MIN goal at `1541`. Asserted as a PROPERTY of each rather than as
  // a total, because a count alone would survive the right number of releases
  // happening to the wrong penalties.
  const early = all.filter(s => s.endedBy === 'goal');
  assert.equal(early.length, 2);
  for (const s of early) {
    assert.ok(s.end < s.start + s.min * 60, 'released before the assessment');
    const goal = rich.events.find(e => e.type === 'goal' && e.s === s.end);
    assert.ok(goal, 'and released exactly on a goal');
    assert.notEqual(goal.own, s.team, 'scored by the team that was not serving');
    const short = goal.own === AWAY ? +goal.sit[2] : +goal.sit[1];
    const up = goal.own === AWAY ? +goal.sit[1] : +goal.sit[2];
    assert.ok(short < up, 'and the serving team really was short at that instant');
  }
});
