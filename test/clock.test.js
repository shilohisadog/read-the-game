/**
 * The clock counts DOWN.
 *
 * Every hockey broadcast a novice has ever seen counts down from 20:00. This
 * app showed elapsed time counting up from 00:00, which matches nothing, in a
 * tool whose entire purpose is helping someone read a game they're watching.
 *
 * The countdown is stored (`rem`), not derived. Deriving it would mean
 * hardcoding period length, and overtime is 5:00 rather than 20:00 -- so a
 * derived clock would be silently wrong the first time we ingest an OT game.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const app = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const toSecs = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };

test('every event carries a countdown clock', () => {
  const missing = rich.events.filter(e => !e.rem);
  assert.deepEqual(missing, [], 'events without `rem`');
});

test('elapsed and remaining are complements within the period', () => {
  // The feed gives us both. If they ever disagree, one of them is wrong and we
  // would rather find out here than on screen.
  for (const e of rich.events) {
    const elapsedInPeriod = e.s - (e.per - 1) * 1200;
    assert.equal(toSecs(e.rem), 1200 - elapsedInPeriod,
      `P${e.per} ${e.clock}: remaining ${e.rem} must complement elapsed`);
  }
});

test('a period starts at 20:00 and ends at 00:00', () => {
  for (const per of [1, 2, 3]) {
    const inPeriod = rich.events.filter(e => e.per === per);
    assert.equal(inPeriod[0].rem, '20:00', `period ${per} opens at 20:00`);
    assert.equal(inPeriod[inPeriod.length - 1].rem, '00:00', `period ${per} ends at 00:00`);
  }
});

test('the pulled-goalie window really is the last 1:40', () => {
  // Pins the fact that made the empty-net finding credible, now that the clock
  // can express it the way a viewer would read it.
  const pulled = rich.events.filter(e => e.sit && (e.sit[0] === '0' || e.sit[3] === '0'));
  assert.ok(pulled.length > 0, 'the window exists');
  assert.ok(pulled.every(e => e.per === 3), 'all in the third period');
  assert.ok(toSecs(pulled[0].rem) <= 100, `starts with ${pulled[0].rem} left, not mid-game`);
});

test('the app displays remaining time, never elapsed', () => {
  // Five display sites: scoreboard, its initial state, event tooltips, the
  // show-me-the-work header, and the why-popup. A mixed clock would be worse
  // than a consistently wrong one.
  assert.ok(!/cur\.clock|e\.clock/.test(app),
    'no display site may read the elapsed field');
  assert.ok(app.includes("$('clk').textContent=cur?cur.rem:'20:00'"),
    'the scoreboard reads `rem`');
  assert.ok(app.includes('<span class="cl" id="clk">20:00</span>'),
    'and its pre-game state is 20:00, not 00:00');
});
