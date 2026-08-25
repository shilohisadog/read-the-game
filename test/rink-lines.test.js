/**
 * Every line painted on the ice stops at the boards
 *
 * Kevin, looking at the pre-game frame: "the goal lines extend beyond the
 * playing surface, can you have those terminate right at the edge of the rink."
 * They did — y=3..82 where the boards at that x are at y=7.02..77.98, so about
 * four feet of red line stuck out through the corner at each end, twice.
 *
 * ⭐ THE INSTRUMENT DOES NOT RUN `boardsY`. It parses the boards rect and the
 * lines out of the markup the renderer actually produced, and asserts each
 * endpoint lies ON that outline. If it recomputed the endpoints with the
 * function under test, the two would move together and the test would be a
 * mirror — the check would survive any change to the rule, including a wrong
 * one. (docs/status.md H1.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers/page.js';

const ink = () => {
  const a = boot();
  const svg = a.$('rink').innerHTML;
  const r = svg.match(/<rect class="boards" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)"/);
  assert.ok(r, 'the rink drew no boards — this test has lost its subject');
  const [, x, y, w, h, rad] = r.map(Number);
  const lines = [...svg.matchAll(/<line class="ln ([^"]+)" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)]
    .map(m => ({ cls: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5] }));
  assert.ok(lines.length >= 5, `expected the five painted lines, found ${lines.length}`);
  return { board: { L: x, R: x + w, T: y, B: y + h, r: rad }, lines };
};

/** Distance from a point to the rounded-rect outline, 0 when it sits on it. */
function offBoards(p, b) {
  const inCorner = p.x < b.L + b.r || p.x > b.R - b.r;
  if (!inCorner) return Math.min(Math.abs(p.y - b.T), Math.abs(p.y - b.B));
  const cx = p.x < b.L + b.r ? b.L + b.r : b.R - b.r;
  const cy = p.y < (b.T + b.B) / 2 ? b.T + b.r : b.B - b.r;
  return Math.abs(Math.hypot(p.x - cx, p.y - cy) - b.r);
}

test('no painted line reaches past the boards, at either end', () => {
  const { board, lines } = ink();
  for (const l of lines) {
    for (const [end, p] of [['top', { x: l.x1, y: l.y1 }], ['bottom', { x: l.x2, y: l.y2 }]]) {
      const off = offBoards(p, board);
      assert.ok(off < 0.02,
        `the ${l.cls} line at x=${l.x1} misses the boards by ${off.toFixed(2)} at its ${end} end ` +
        `(${p.x},${p.y})`);
    }
  }
});

test('the goal line is inset because it sits in a corner — the blue line is not', () => {
  // THE CONTROL, and without it the test above is satisfied by a rink with no
  // corners at all. These two lines must land differently, and the reason is
  // geometric: the goal line is 11 units from the end boards, inside a radius of
  // 27, while the blue line is 75 units in and nowhere near one.
  const { board, lines } = ink();
  const goal = lines.find(l => l.x1 === 11);
  const blue = lines.find(l => l.cls === 'blue' && l.x1 === 75);
  assert.ok(goal && blue, 'the goal line or the blue line is not where this test looks');

  assert.ok(goal.y1 > board.T + 1,
    `the goal line starts at y=${goal.y1}, which is not inset from the top board`);
  assert.equal(blue.y1, board.T, 'the blue line is inset, and nothing in the corner rule asks it to be');
  assert.equal(blue.y2, board.B);

  // And the inset is the arc's, not a number somebody liked: at x=11 the corner
  // centre is (28,28) with r=27, so the chord half-height is sqrt(27^2-17^2).
  const expect = 28 - Math.sqrt(27 * 27 - 17 * 17);
  assert.ok(Math.abs(goal.y1 - expect) < 0.02,
    `the goal line stops at ${goal.y1}, the boards are at ${expect.toFixed(2)}`);
});

test('both goal lines get it, not just the one somebody looked at', () => {
  const { lines } = ink();
  const goals = lines.filter(l => l.cls === 'red' && (l.x1 === 11 || l.x1 === 189));
  assert.equal(goals.length, 2, 'expected a goal line at each end');
  assert.equal(goals[0].y1, goals[1].y1, 'the two ends of the rink disagree');
  assert.equal(goals[0].y2, goals[1].y2);
});
