/**
 * The blocked-shot attribution defect, pinned.
 *
 * This is the first test in the project, and it exists because the app shipped
 * a wrong Corsi count on its flagship claim for its entire life. Two kinds of
 * assertion here, and the distinction matters:
 *
 *   - SYMPTOM tests pin the number the defect produced. They catch a
 *     reintroduced flip.
 *   - INVARIANT tests pin what has to be true about the feed for our
 *     attribution to be right at all. They catch the case the symptom test
 *     cannot: a future feed that genuinely credits the blocker, where the
 *     flip-detector still passes while the app silently goes wrong again.
 *
 * Both, or this test is theatre.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsiTeam, shootingTeam, ATTEMPT_TYPES } from '../src/lib/attribution.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const R = rich.roster;
const HID = rich.teams.home.id;   // BUF
const AID = rich.teams.away.id;   // MIN

function tally(events) {
  const t = { [HID]: 0, [AID]: 0 };
  for (const e of events) {
    const c = corsiTeam(e, R);
    if (c != null) t[c]++;
  }
  return t;
}

test('Corsi pins the raw pair, not the ratio', () => {
  const t = tally(rich.events);
  // The pair, not 59.3% -- a ratio can be right for compensating wrong reasons.
  assert.equal(t[AID], 80, 'MIN attempts');
  assert.equal(t[HID], 55, 'BUF attempts');
  assert.equal(t[AID] + t[HID], 135, 'total attempts');
});

test('the old flip would produce the old wrong numbers (mutation check)', () => {
  // Reintroduce the exact defect and prove the expected numbers move.
  const flipped = { [HID]: 0, [AID]: 0 };
  for (const e of rich.events) {
    if (!ATTEMPT_TYPES.has(e.type)) continue;
    flipped[e.type === 'blocked-shot' ? (HID + AID - e.own) : e.own]++;
  }
  assert.equal(flipped[AID], 72, 'the shipped-but-wrong MIN count');
  assert.equal(flipped[HID], 63, 'the shipped-but-wrong BUF count');
  const correct = tally(rich.events);
  assert.notDeepEqual(correct, flipped, 'the flip must change the answer');
});

test('INVARIANT: the feed credits blocked shots to the shooter', () => {
  // The claim our attribution depends on. If a future feed ever credits the
  // blocker, this fails -- even though the flip-detector above would still pass.
  const blocks = rich.events.filter(e => e.type === 'blocked-shot');
  assert.equal(blocks.length, 44, 'blocked shots in the reference game');
  for (const e of blocks) {
    assert.equal(shootingTeam(e, R), e.own,
      `block at P${e.per} ${e.clock}: actor's team must equal eventOwnerTeamId`);
  }
});

test('INVARIANT: every attempt resolves to a known player', () => {
  // corsiTeam returns null on an unknown actor rather than guessing. If that
  // ever starts happening, attempts vanish silently -- so pin it at zero.
  const unresolved = rich.events.filter(
    e => ATTEMPT_TYPES.has(e.type) && shootingTeam(e, R) == null);
  assert.deepEqual(unresolved, [], 'attempts with an unresolvable shooter');
});

test('attribution never depends on the flipped-team arithmetic', () => {
  // A blocked shot and a shot on goal by the same team must be credited alike.
  const blk = rich.events.find(e => e.type === 'blocked-shot');
  assert.equal(corsiTeam(blk, R), R[blk.actor].tid);
  const sog = rich.events.find(e => e.type === 'shot-on-goal');
  assert.equal(corsiTeam(sog, R), R[sog.actor].tid);
});

test('non-attempts are not credited to anyone', () => {
  for (const type of ['hit', 'faceoff', 'giveaway', 'takeaway', 'stoppage']) {
    const e = rich.events.find(x => x.type === type);
    if (e) assert.equal(corsiTeam(e, R), null, `${type} must not count`);
  }
});
