/**
 * The nightly lesson pick (src/lib/lessons.js, builders/lessons.mjs): each
 * lesson takes the newest game holding its moment that no earlier lesson took.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickLessons, momentsOf, doorAt, LESSON_ORDER } from '../src/lib/lessons.js';
import { newestFirst } from '../builders/lessons.mjs';

const load = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const rich = load('rich.json'), richOt = load('rich-ot.json');
const at = list => i => list[i];

test('no two lessons open the same game', () => {
  // Fourteen copies of a game holding every moment but overtime, each its own id.
  const games = Array.from({ length: 14 }, (_, k) =>
    ({ ...rich, game: { ...rich.game, id: rich.game.id + k } }));
  const picked = pickLessons(at(games), games.length);
  const ids = Object.values(picked).map(l => l.game);
  assert.equal(ids.length, LESSON_ORDER.length - 1, 'every lesson but overtime is placed');
  assert.equal(new Set(ids).size, ids.length, 'two lessons share a game');
  assert.equal(picked.icing.game, rich.game.id, 'the first lesson takes the newest game');
});

test('lessons go in the page order, each to the newest game holding its moment', () => {
  /* richOt is the newest; icing (first in the order) takes it if it has an
     icing, and the next lesson must fall through to the older game. */
  const picked = pickLessons(at([richOt, rich]), 2);
  const first = LESSON_ORDER.find(id => doorAt(richOt, momentsOf(richOt).found.find(f => f[0] === id)));
  assert.equal(picked[first].game, richOt.game.id, `${first} did not take the newest game`);
  const second = LESSON_ORDER.slice(LESSON_ORDER.indexOf(first) + 1)
    .find(id => doorAt(rich, momentsOf(rich).found.find(f => f[0] === id)));
  assert.equal(picked[second].game, rich.game.id, `${second} did not fall through to the older game`);
  assert.equal(Object.keys(picked).length, 2, 'two games can place two lessons, no more');
});

test('a game without the moment is passed over, however new it is', () => {
  // The reference game has no overtime; the overtime game is older here.
  const picked = pickLessons(at([rich, richOt]), 2, ['overtime']);
  assert.equal(picked.overtime.game, richOt.game.id);
  assert.match(picked.overtime.label, /^Overtime/);
});

test('a missing extract is skipped, and a lesson no game holds is absent', () => {
  const picked = pickLessons(at([null, rich]), 2, ['overtime', 'icing']);
  assert.equal(picked.overtime, undefined);
  assert.equal(picked.icing.game, rich.game.id);
});

test('⛔ the empty-net moment is a team behind in the third, not a delayed-penalty pull', () => {
  /* A goalie also leaves for an extra skater during a delayed penalty, for
     seconds and at any score. The card says "losing late". MUTATION: drop the
     score or the period condition and the first game below matches. */
  const ev = (per, sit, type = 'faceoff', own = null) => ({ per, rem: '10:00', s: 0, sit, type, own });
  const g = (events) => ({ ...rich, events });
  const H = rich.teams.home.id;
  const empty = f => momentsOf(g(f)).found.find(x => x[0] === 'empty-net')[2];
  assert.equal(empty([ev(1, '1551'), ev(1, '1560')]), -1, 'a first-period pull at a level score');
  assert.equal(empty([ev(1, '1551'), ev(3, '1560')]), -1, 'a third-period pull while level');
  assert.equal(empty([ev(1, '1551', 'goal', H), ev(3, '1560')]), -1,
    'the home team pulled while LEADING — not losing');
  assert.equal(empty([ev(1, '1551', 'goal', H), ev(3, '0651')]), 1,
    'the away team pulled while behind in the third');
});

test('the catalog is read newest first, published and in scope only', () => {
  const rows = newestFirst({ games: [
    { id: 2025020001, d: '2026-01-10', v: 1 },
    { id: 2025020003, d: '2026-01-12', v: 1 },
    { id: 2025020002, d: '2026-01-12', v: 1 },
    { id: 2025020004, d: '2026-01-13', v: 0 },          // refused
    { id: 2025010004, d: '2026-01-14', v: 1 },          // preseason
  ] });
  assert.deepEqual(rows.map(r => r.id), [2025020003, 2025020002, 2025020001]);
});
