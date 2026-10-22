/**
 * The tracked goal on the page (app.js `trk*`): the Replay and Speed controls appear only
 * on a game with tracked goals, All events holds a goal's frame while its tracking plays,
 * Goals mode goes goal to goal, and Prev/Next step through a goal's stops.
 *
 * The reference game has no tracking files of its own, so the fetcher serves an index of
 * its goals and, for every goal, the real file of a real goal (Panarin, 2026020144).
 * Only the orientation depends on which goal a file belongs to, and that is checked on
 * the real pairing in test/tracked.test.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rich, boot } from './helpers/page.js';

const FX = JSON.parse(readFileSync(new URL('./fixtures/tracked-2026020144-ev202.json', import.meta.url), 'utf8'));
// Goals by their place on the page's own timeline (what the scrubber counts), via the harness.
const TL = boot(rich).timeline;
const GOALS = TL.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO');
const ROWS = GOALS.map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
const MOTION = { motion: true };
const settle = () => new Promise(r => setImmediate(r));
function served(asked = []) {
  return name => {
    asked.push(name);
    if (name === `track/${rich.game.id}/goals.json`) return Promise.resolve(ROWS);
    if (/^track\/\d+\/ev\d+\.json$/.test(name)) return Promise.resolve(FX.frames);
    return Promise.reject(new Error('not served: ' + name));
  };
}
const shown = a => !a.$('trkMode').hidden && !a.$('trkSpeed').hidden;

test('with no fetcher there are no tracking controls and nothing is asked for', async () => {
  const a = boot();
  await settle();
  assert.equal(a.$('trkMode').hidden, true);
  assert.equal(a.$('trkSpeed').hidden, true);
});

test('a game whose index lists no goals offers no controls', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null));
  await settle(); await settle();
  assert.equal(shown(a), false, 'controls for a game with nothing tracked');
});

test('a game with tracked goals offers Replay and Speed, All events and ¼ selected', async () => {
  const asked = [];
  const a = boot(rich, null, '', null, served(asked));
  await settle(); await settle();
  assert.ok(asked.includes(`track/${rich.game.id}/goals.json`), 'the index was never asked for');
  assert.ok(shown(a), 'the controls stayed hidden');
  assert.equal(a.$('trkAll').getAttribute('aria-pressed'), 'true');
  assert.equal(a.$('trkGoals').getAttribute('aria-pressed'), 'false');
  assert.equal(a.$('trkQ').getAttribute('aria-pressed'), 'true');
  a.$('trkGoals').click();
  assert.equal(a.$('trkGoals').getAttribute('aria-pressed'), 'true');
  assert.ok(a.$('rg').classList.contains('trkgoals'));
});

test('⭐ Goals: Play goes into the first goal\'s tracking, then lands on that goal', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  // From the resting frame (the horn), Play starts the game over; the scrubber would snap to a goal.
  a.$('play').click();
  // Play may wait a beat for the first goal's file; give it the chance to arrive.
  for (let n = 0; n < 6 && !a.$('rg').classList.contains('trk'); n++) { a.advance(1); await settle(); }
  assert.ok(a.$('rg').classList.contains('trk'), 'the tracking never started');
  const first = GOALS[0];
  assert.ok(+a.$('scrub').value < first.k, 'the frame under the tracking is not before the goal');
  assert.match(a.$('track').innerHTML, /class="tpk"/, 'no puck on the ice');
  const p = rich.roster[first.e.actor];
  assert.equal(a.$('who').textContent, `Tracked · goal by #${p.n} ${p.nm} (${first.e.own === rich.teams.home.id ? rich.teams.home.ab : rich.teams.away.ab})`);
  assert.match(a.$('playline').textContent, /seconds before the goal\. The black dot is the puck\./, 'the first frame is not held');
  a.advance(1);
  assert.equal(+a.$('scrub').value, first.k, 'after the tracking, not the goal frame');
  assert.equal(a.$('rg').classList.contains('trk'), false, 'the tracking outlived its goal');
});

test('Goals: Prev and Next step through a goal\'s stops, then to the next goal', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  a.at(0, () => {});
  a.$('fwd').click(); await settle(); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'Next did not open the first goal\'s tracking');
  const clocks = [a.$('clk').textContent];
  for (let n = 0; n < 3; n++) { a.$('fwd').click(); await settle(); clocks.push(a.$('clk').textContent); }
  // First frame -> the file's goal line (no recorded events of this game fall in its window)
  // -> the goal's own frame.
  assert.notEqual(clocks[0], clocks[1], 'Next did not move within the goal');
  a.$('back').click(); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'Prev left the tracking');
  assert.equal(a.$('play').textContent.includes('Pause'), false, 'stepping did not pause');
});

test('⭐ Goals: Next lands on the goal itself after its goal line, and Prev comes back the same way', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  a.at(0, () => {});                         // Goals snaps the scrubber to the first goal
  const [g0, g1, g2] = GOALS;
  const trk = () => a.$('rg').classList.contains('trk'), at = () => +a.$('scrub').value;
  const next = async () => { a.$('fwd').click(); await settle(); await settle(); };
  const prev = async () => { a.$('back').click(); await settle(); await settle(); };
  assert.equal(at(), g0.k);
  await next();
  assert.ok(trk(), 'Next did not open the second goal\'s tracking');
  for (let n = 0; n < 8 && trk(); n++) await next();
  assert.equal(at(), g1.k, 'past the goal line, Next skipped the goal frame');
  assert.equal(a.$('track').innerHTML, '', 'the tracking is still drawn over the goal frame');
  await next();
  assert.ok(trk(), 'from the goal frame, Next did not open the next goal');
  await prev();
  assert.equal(trk(), false, 'Prev from the first tracked frame stayed in the tracking');
  assert.equal(at(), g1.k, 'Prev from the next goal\'s first frame did not land on the previous goal');
  await prev();
  assert.ok(trk(), 'Prev from the goal frame did not go back into its tracking');
  assert.ok(g2, 'the reference game needs three goals for this walk');
});

test('All events: a tracked goal holds the frame before it while its tracking plays', async () => {
  const a = boot(rich, null, '', null, served(), MOTION);
  await settle(); await settle();
  const { e, k } = GOALS[0];
  // Start a few frames before the goal, in the same stretch of play, and let the file load.
  let from = k - 1;
  while (from > 0 && TL[from - 1].type !== 'faceoff' && TL[from].s > e.s - 30) from--;
  a.at(from, () => {});
  await settle(); await settle();
  a.$('play').click();
  let held = false;
  for (let n = 0; n < 40 && +a.$('scrub').value < k; n++) {
    a.advance(1); await settle();
    if (a.$('rg').classList.contains('trk')) { held = true; break; }
  }
  assert.ok(held, 'no frame was held for the tracking');
  assert.ok(+a.$('scrub').value < k);
  a.advance(1);
  assert.equal(+a.$('scrub').value, k, 'the tracking did not hand over to the goal frame');
});

test('under reduced motion Goals goes goal frame to goal frame, and offers the tracking instead', async () => {
  const a = boot(rich, null, '?replay=goals', null, served());
  await settle(); await settle();
  a.$('play').click();
  a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, GOALS[0].k, 'not the first goal frame');
  assert.equal(a.$('rg').classList.contains('trk'), false, 'it animated anyway');
  await settle(); await settle();
  assert.match(a.$('who').innerHTML, /See it tracked/, 'the tracking is not offered');
});

test('⭐ a copied link carries the replay mode and the speed, and the confirmation says so', async () => {
  const a = boot(rich, null, '', null, served(), MOTION);
  await settle(); await settle();
  a.at(GOALS[0].k, () => {});
  a.$('share').onclick(); await settle();
  let q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('replay'), null, 'All events is the default and is not written');
  assert.equal(q.get('speed'), '0.25', 'a game with tracked goals always carries its speed');
  assert.match(a.$('sharesaid').innerHTML, /, tracked goals at ¼ speed\./);
  a.$('trkGoals').click(); a.$('trkH').click(); await settle();
  a.$('share').onclick(); await settle();
  q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('replay'), 'goals');
  assert.equal(q.get('speed'), '0.5');
  assert.match(a.$('sharesaid').innerHTML, /in Goals mode at ½ speed/);
  // And the link opens that way.
  const b = boot(rich, null, '?' + q.toString(), null, served(), MOTION);
  await settle(); await settle();
  assert.equal(b.$('trkGoals').getAttribute('aria-pressed'), 'true');
  assert.equal(b.$('trkH').getAttribute('aria-pressed'), 'true');
});

test('a game with no tracked goals carries neither', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null));
  await settle(); await settle();
  a.at(10, () => {});
  a.$('share').onclick(); await settle();
  assert.doesNotMatch(a.copied, /replay=|speed=/);
});

test('⭐ the front door\'s hero plays the first goal as tracked, from the frame before its tracked seconds, then the goal', async () => {
  const a = boot(rich, null, '?preview=1', null, served(), MOTION);
  await settle(); await settle();
  const first = GOALS[0];
  assert.ok(a.posted.some(p => p.msg.rtg === 'tracked' && p.msg.game === rich.game.id), 'the front door is not told the goal is tracked');
  let held = null;
  for (let n = 0; n < 120 && held == null; n++) {          // the reference game's first goal is ~73 frames in
    a.advance(1); await settle();
    if (a.$('rg').classList.contains('trk')) held = +a.$('scrub').value;
  }
  assert.ok(held != null, 'the hero never played the tracking');
  assert.ok(held < first.k, 'the tracking is not laid over a frame before the goal');
  assert.match(a.$('who').textContent, /^Tracked · goal by/);
  a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, first.k, 'the tracking does not hand over to the goal frame');
  assert.equal(a.$('rg').classList.contains('trk'), false);
});

test('a hero whose first goal has no tracking file loops as before, and says nothing to the front door', async () => {
  const a = boot(rich, null, '?preview=1', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null), MOTION);
  await settle(); await settle();
  assert.ok(!a.posted.some(p => p.msg.rtg === 'tracked'));
  for (let n = 0; n < 120 && +a.$('scrub').value < GOALS[0].k; n++) { a.advance(1); await settle(); assert.equal(a.$('rg').classList.contains('trk'), false); }
  assert.equal(+a.$('scrub').value, GOALS[0].k);
});
