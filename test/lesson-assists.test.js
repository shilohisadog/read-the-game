/**
 * The assists lesson (src/lib/lessons.js, the card in builders/build_index.py): its door opens the first
 * goal the league credited with two assists, and the frame it opens is that goal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { momentsOf, doorAt, LESSON_ORDER } from '../src/lib/lessons.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const rich = load('../data/rich.json');

test('the assists moment is the first goal with two assists, and the door opens on that goal', () => {
  const entry = momentsOf(rich).found.find(f => f[0] === 'assists');
  const k = entry[2], e = rich.events[k];
  assert.equal(e.type, 'goal');
  assert.ok(e.a1 != null && e.a2 != null, 'not a goal with two assists');
  // A second path: walk the goals by hand.
  assert.equal(k, rich.events.findIndex(x => x.type === 'goal' && x.pt !== 'SO' && x.a1 != null && x.a2 != null));
  const door = doorAt(rich, entry);
  assert.equal(door.type, 'goal', 'the door does not open on the goal');
  assert.equal(door.via, undefined, 'the door hopped off the goal');
  assert.ok(LESSON_ORDER.includes('assists'), 'the nightly pick never looks for it');
});

test('a game whose only goals came in a shootout has no assists moment', () => {
  const g = structuredClone(rich);
  for (const e of g.events) if (e.type === 'goal') { e.pt = 'SO'; delete e.a1; delete e.a2; }
  assert.equal(momentsOf(g).found.find(f => f[0] === 'assists')[2], -1);
});

test('the learn page\'s doors document carries the assists door, and it names the goal\'s frame', () => {
  const d = load('../data/learn-doors.json').doors.assists;
  assert.ok(d && d.href.includes('game='), 'no assists door');
  assert.equal(d.type, 'goal');
});
