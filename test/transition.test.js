/**
 * K1 — what happened BETWEEN two recorded events.
 *
 * ⭐ WHAT THIS FILE IS GUARDING, said first. The rule is one boolean and the
 * temptation is to test it by restating it, which proves only that the same
 * arithmetic was typed twice (§H: *name the path to the expectation*). So the
 * expectations here are built from HOCKEY — a coordinate a reader can find on
 * the ice — never from `BLUE_LINE_X` arithmetic.
 *
 * ⚠️ AND ONE CASE IS HERE BECAUSE IT ALREADY BIT ME, on the measurement rather
 * than in the code. A naive `(prev.x < 0) !== (cur.x < 0)` puts x === 0 on the
 * positive side, and x === 0 is the centre-ice face-off dot — 4.6% of timeline
 * events. That spelling reports 4,372 crossings against the true 3,803, so
 * **569 transitions would have been announced as "the other end" with one end
 * of them at centre ice.** `centreDotIsNotAnEnd` below is that case, and it
 * fails against the naive spelling.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { endToEnd, spokenGap, transitionSaid } from '../src/lib/transition.js';

/** An event, named by where it is on the ice rather than by a constant. */
const at = (x, s = 0, per = 1) => ({ x, y: 0, s, per });

// Landmarks, in feet from centre, as a reader would find them on the rink.
const TORONTO_END = -80;   // deep in one end, well past the paint
const OTHER_END = 81;      // deep in the other
const NEUTRAL = 12;        // inside the blue lines, between the zones
const CENTRE_DOT = 0;      // the face-off spot at centre ice
const JUST_INSIDE = 24;    // neutral side of the line
const ON_THE_LINE = 25;    // the blue line itself — 29 real events sit here
const JUST_OUTSIDE = 26;   // end-zone side of the line

test('end to end: the specimen that prompted the work', () => {
  // Kevin's sequence — a WSH hit at -80, then a TOR shot at +81, 28s later.
  assert.equal(endToEnd(at(TORONTO_END, 1268), at(OTHER_END, 1296)), true);
});

test('end to end: both ends must be past a blue line', () => {
  // A play that crosses centre into the NEUTRAL zone has not gone end to end,
  // and saying so would overstate a quarter of all crossings (986 of 3,803).
  assert.equal(endToEnd(at(TORONTO_END), at(NEUTRAL)), false);
  assert.equal(endToEnd(at(-NEUTRAL), at(OTHER_END)), false);
});

test('end to end: the blue line itself is the neutral side', () => {
  // 24 ft is inside the zone boundary, 26 ft is beyond it.
  assert.equal(endToEnd(at(-JUST_OUTSIDE), at(JUST_INSIDE)), false);
  assert.equal(endToEnd(at(-JUST_OUTSIDE), at(JUST_OUTSIDE)), true);
});

test('end to end: an event ON the blue line has not left the neutral zone', () => {
  // ⚠️ THIS CASE IS REACHABLE AND THE FIRST DRAFT MISSED IT. Testing 24 and 26
  // never touches the boundary, so loosening `<=` to `<` passed a green suite.
  // Measured: **29 of 15,543 located timeline events sit at exactly |x| = 25**,
  // 0.19% — rare, and rare is not absent. The line belongs to the neutral zone
  // because that is where the rulebook puts it: a puck is in the zone once it
  // has fully crossed, so ON the line is not yet across.
  assert.equal(endToEnd(at(-ON_THE_LINE), at(ON_THE_LINE)), false);
  assert.equal(endToEnd(at(-JUST_OUTSIDE), at(ON_THE_LINE)), false);
  assert.equal(endToEnd(at(-ON_THE_LINE), at(JUST_OUTSIDE)), false);
});

test('centreDotIsNotAnEnd — the trap the measurement walked into', () => {
  // A face-off at centre ice, then a shot at the far end. A sign test calls
  // this a crossing because 0 is not < 0. It is not one: centre ice is not an
  // end, and this fired 569 times in a 60-game sample.
  assert.equal(endToEnd(at(CENTRE_DOT, 100), at(OTHER_END, 120)), false);
  assert.equal(endToEnd(at(TORONTO_END, 100), at(CENTRE_DOT, 120)), false);
});

test('end to end: same end is not a transition', () => {
  assert.equal(endToEnd(at(-90), at(-60)), false);
  assert.equal(endToEnd(at(70), at(95)), false);
});

test('end to end: a period boundary is not a transition', () => {
  // Across a break the gap in `s` is not an elapsed time AND the teams have
  // swapped ends, so neither half of the sentence survives.
  assert.equal(endToEnd(at(TORONTO_END, 1190, 1), at(OTHER_END, 1210, 2)), false);
});

test('end to end: an event with no location says nothing', () => {
  assert.equal(endToEnd(at(null), at(OTHER_END)), false);
  assert.equal(endToEnd(at(TORONTO_END), at(null)), false);
  assert.equal(endToEnd(null, at(OTHER_END)), false);
  assert.equal(endToEnd(at(TORONTO_END), null), false);
});

test('spokenGap: seconds under a minute, the clock at and over', () => {
  assert.equal(spokenGap(28), '28s');
  assert.equal(spokenGap(59), '59s');
  assert.equal(spokenGap(60), '1:00');
  assert.equal(spokenGap(65), '1:05');
  assert.equal(spokenGap(145), '2:25');
});

test('spokenGap: nothing to say is said as nothing', () => {
  assert.equal(spokenGap(0), '');
  assert.equal(spokenGap(-3), '');
  assert.equal(spokenGap(NaN), '');
  assert.equal(spokenGap(undefined), '');
});

test('transitionSaid: the sentence, on the specimen', () => {
  assert.equal(
    transitionSaid(at(TORONTO_END, 1268), at(OTHER_END, 1296)),
    'the other end · 28s later');
});

test('transitionSaid: silent whenever the rule does not fire', () => {
  assert.equal(transitionSaid(at(TORONTO_END), at(NEUTRAL)), '');
  assert.equal(transitionSaid(at(CENTRE_DOT, 100), at(OTHER_END, 120)), '');
  assert.equal(transitionSaid(at(-90), at(-60)), '');
});

test('transitionSaid: still true when no time is recorded between them', () => {
  // Two events stamped at the same second still crossed the ice. The sentence
  // drops the clause rather than printing "0s later".
  assert.equal(transitionSaid(at(TORONTO_END, 500), at(OTHER_END, 500)),
    'the other end');
});

/**
 * ⛔ THE REFUSAL, ASSERTED. The sentence must never name a team.
 *
 * `own` means a different thing per event type — a hit credits the HITTER, who
 * by rule does not have the puck — so "Toronto now" would have been wrong on
 * the exact sequence that prompted this work. This is the one property of the
 * copy that cannot be allowed to drift, so it is checked against the function
 * rather than left to a comment.
 */
test('transitionSaid names no team, even when the events carry one', () => {
  const a = { ...at(TORONTO_END, 1268), own: 15, type: 'hit' };
  const b = { ...at(OTHER_END, 1296), own: 10, type: 'shot-on-goal' };
  const said = transitionSaid(a, b);
  assert.equal(said, 'the other end · 28s later');
  assert.ok(!/\d{1,2}\b(?!s)/.test(said.replace('28s', '')),
    'a team id has leaked into the sentence');
  for (const word of ['Toronto', 'TOR', 'WSH', 'Washington', 'now', 'possession']) {
    assert.ok(!said.includes(word), `the sentence names ${word}`);
  }
});
