/**
 * THE PLAYBACK DOOR (docs/replay-playback.md): one calculated clock, one driver at a time, and every
 * failure with a set outcome. The harness's clock is the page's (`performance.now`), its frames are
 * delivered by the test, and `later(ms)` is a browser that stopped drawing for that long.
 *
 * The reference game's goals are served the real tracking of one real goal (Panarin, 2026020144),
 * as in test/tracked-page.test.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rich, boot } from './helpers/page.js';
import { GOAL_READ_MS } from '../src/lib/goal-read.js';

const FX = JSON.parse(readFileSync(new URL('./fixtures/tracked-2026020144-ev202.json', import.meta.url), 'utf8'));
const TL = boot(rich).timeline;
const GOALS = TL.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO');
const ROWS = GOALS.map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
const settle = () => new Promise(r => setImmediate(r));
const served = name => name.endsWith('goals.json') ? Promise.resolve(ROWS) : Promise.resolve(FX.frames);

async function goals(opts = {}, fetch = served) {
  const a = boot(rich, null, '?replay=goals', null, fetch, { motion: true, ...opts });
  await settle(); await settle();
  return a;
}
const trk = a => a.$('rg').classList.contains('trk');
const rest = a => a.$('rg').classList.contains('trkrest');
const playing = a => /Pause/.test(a.$('play').textContent);
const at = a => +a.$('scrub').value;
const pic = a => a.$('clk').textContent + '|' + a.$('track').innerHTML;
async function intoClip(a) {
  a.$('play').click();
  for (let n = 0; n < 8 && !trk(a); n++) { a.advance(1); await settle(); }
  assert.ok(trk(a), 'the first goal’s tracking never started');
}
const line = a => a.$('playline').textContent;

/* ---------------------------------------------------------------- the clock */

test('⭐ the picture is the clock’s: frames that stop and resume land where steady frames do', async () => {
  const steady = await goals(), stalled = await goals();
  await intoClip(steady); await intoClip(stalled);
  const start = pic(steady);
  assert.equal(pic(stalled), start);
  steady.run(9000);
  stalled.later(8999); stalled.run(1);          // nine seconds with one frame at the end
  assert.notEqual(pic(steady), start, 'nine seconds did not move the tracking');
  assert.equal(pic(stalled), pic(steady), 'the picture depends on which frames arrived');
});

test('⛔ a frame that repeats the last one’s time does not end the tracking (the &trace=1 freeze)', async () => {
  const q = [], flush = () => { const fs = q.splice(0); fs.forEach(f => f(4716)); return fs.length; };
  const a = await goals({ raf: fn => { q.push(fn); return q.length; } });
  await intoClip(a);
  flush(); flush();                              // two frames, one time
  assert.equal(q.length, 1, 'a repeated frame time ended the loop');
  const before = pic(a);
  a.later(3000); flush();
  assert.notEqual(pic(a), before, 'the tracking did not move after the repeat');
});

test('⛔ Pause and Play over a frame still pending leave one loop, not two', async () => {
  const q = [], flush = () => { const fs = q.splice(0); fs.forEach(f => f()); return fs.length; };
  const a = await goals({ raf: fn => { q.push(fn); return q.length; } });
  await intoClip(a);
  a.$('play').click(); a.$('play').click();       // the first booking is still in the queue
  assert.equal(q.length, 2);
  flush();
  assert.equal(q.length, 1, 'the stale frame booked a second loop');
});

test('⭐ one clock: while a goal’s tracking plays no timer runs, and nothing moves on until its frames reach the goal line', async () => {
  const a = await goals();
  await intoClip(a);
  const held = at(a);
  assert.equal(a.wait, null, 'a timer runs beside the tracking');
  a.later(10 * 60 * 1000);                        // ten minutes with no frame: a stalled or slow browser
  assert.equal(at(a), held, 'the replay moved on without the tracking');
  assert.ok(trk(a));
  a.run(1); await settle();
  assert.equal(at(a), GOALS[0].k, 'one frame past the goal line did not land on the goal');
  assert.ok(rest(a) && !trk(a));
  assert.equal(a.wait, GOAL_READ_MS, 'the goal frame does not hold for its reading pause');
});

/* ---------------------------------------------------------------- the transitions */

test('⭐ Pause freezes a goal’s tracking where it is; Play carries on from there', async () => {
  const a = await goals();
  await intoClip(a);
  a.run(6000);
  a.$('play').click();
  const frozen = pic(a);
  assert.ok(!playing(a));
  assert.equal(a.queued, 0, 'a paused tracking still draws');
  assert.equal(a.wait, null, 'a paused tracking has a timer');
  a.later(60000);
  a.$('play').click();
  assert.equal(pic(a), frozen, 'Play did not carry on from where Pause left it');
  assert.ok(a.queued > 0);
  a.run(2000);
  assert.notEqual(pic(a), frozen, 'Play did not move the tracking');
});

test('⭐ a speed change carries the goal on from the same moment (Kevin, 2026-11-03)', async () => {
  const a = await goals();
  await intoClip(a);
  const first = a.$('clk').textContent;
  a.run(12000);
  const now = a.$('clk').textContent;
  assert.notEqual(now, first, 'the clip did not move, so this cannot see a restart');
  a.$('trkH').click();
  assert.equal(a.$('trkH').getAttribute('aria-pressed'), 'true');
  assert.equal(a.$('clk').textContent, now, 'the speed change restarted the goal');
  assert.ok(playing(a) && trk(a) && a.queued > 0, 'the speed change stopped the tracking');
});

test('the scrubber ends a tracking on screen and leaves nothing running', async () => {
  const a = await goals();
  await intoClip(a);
  a.$('scrub').value = '5'; a.$('scrub').onchange({ target: { value: '5' } });
  assert.equal(at(a), 5);
  assert.ok(!trk(a) && !playing(a));
  assert.equal(a.queued, 0);
  assert.equal(a.wait, null);
});

test('the goal pause: its countdown and its move-on read one end', async () => {
  const a = await goals();
  await intoClip(a);
  a.advance(1); await settle();
  assert.ok(rest(a));
  assert.equal(a.wait, GOAL_READ_MS);
  assert.equal(a.$('greadOr').textContent, `continues in ${GOAL_READ_MS / 1000} seconds`);
});

/* ---------------------------------------------------------------- a hidden tab */

test('⭐ a hidden tab pauses a goal’s tracking, and showing it carries on where it was', async () => {
  const a = await goals();
  await intoClip(a);
  a.run(4000);
  const was = pic(a);
  a.hide();
  assert.ok(!playing(a));
  assert.equal(a.queued, 0);
  assert.equal(a.wait, null);
  a.later(120000);
  a.show();
  assert.ok(playing(a), 'showing the tab did not carry on');
  assert.equal(pic(a), was, 'the tracking moved while nobody could see it');
  assert.ok(a.queued > 0);
});

test('⭐ a hidden tab pauses the goal pause too, and it carries on with what was left', async () => {
  const a = await goals();
  await intoClip(a);
  a.advance(1);
  assert.equal(a.wait, GOAL_READ_MS);
  a.later(7000);
  a.hide();
  assert.equal(a.wait, null);
  a.later(120000);
  a.show();
  assert.equal(a.wait, GOAL_READ_MS - 7000, 'the goal pause did not keep what was left of it');
  assert.equal(a.$('greadOr').textContent, `continues in ${(GOAL_READ_MS - 7000) / 1000} seconds`);
});

test('a hidden tab pauses the event walk, which carries on with what was left of its frame', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null), { motion: true });
  await settle(); await settle();
  a.$('play').click();
  const w = a.wait;
  a.later(1000);
  a.hide();
  assert.equal(a.wait, null);
  a.show();
  assert.equal(a.wait, w - 1000);
  assert.ok(playing(a));
});

test('a paused replay stays paused when its tab is shown again', async () => {
  const a = await goals();
  await intoClip(a);
  a.$('play').click();
  a.hide(); a.show();
  assert.ok(!playing(a));
  assert.equal(a.queued, 0);
});

/* ---------------------------------------------------------------- failures */

function failDrawing(a, times) {
  const el = a.$('track');
  let html = el.innerHTML || '';
  Object.defineProperty(el, 'innerHTML', { configurable: true, get: () => html,
    set: v => { if (v && times-- > 0) throw new Error('draw failed'); html = v; } });
}

test('a frame that fails to draw is skipped, and the tracking carries on to its goal', async () => {
  const a = await goals();
  await intoClip(a);
  failDrawing(a, 1);
  a.advance(1); await settle();
  assert.equal(at(a), GOALS[0].k);
  assert.ok(rest(a), 'one failed frame cost the goal its picture');
  assert.doesNotMatch(line(a), /could not be drawn/);
});

test('⭐ a tracking that cannot be drawn goes to its goal and says so, and the replay carries on', async () => {
  const a = await goals();
  await intoClip(a);
  failDrawing(a, Infinity);
  a.run(5000); await settle(); await settle();
  assert.equal(at(a), GOALS[0].k, 'a tracking that fails every frame did not hand over to its goal');
  assert.ok(!trk(a) && !rest(a));
  assert.match(line(a), /The tracking could not be drawn\.$/);
  assert.ok(playing(a));
  assert.equal(a.wait, GOAL_READ_MS);
});

test('⭐ a tracking file that never arrives gives up after a time, and the goal says there is none', async () => {
  const never = name => name.endsWith('goals.json') ? Promise.resolve(ROWS) : new Promise(() => {});
  const a = await goals({}, never);
  a.$('play').click();
  for (let n = 0; n < 100 && at(a) !== GOALS[0].k; n++) { a.advance(1); await settle(); }
  assert.equal(at(a), GOALS[0].k, 'Play waited for the file forever');
  assert.ok(a.clock >= 8000 && a.clock < 20000, `it gave up after ${a.clock} ms`);
  assert.match(line(a), /No tracking for this goal\.$/);
  assert.equal(a.wait, GOAL_READ_MS);
});

test('a file that arrives after the reader has moved on does nothing', async () => {
  let release;
  const late = new Promise(r => { release = r; });
  const a = await goals({}, name => name.endsWith('goals.json') ? Promise.resolve(ROWS) : late);
  a.at(0, () => {});
  a.$('fwd').click(); await settle();
  a.$('scrub').value = '5'; a.$('scrub').onchange({ target: { value: '5' } });
  release(FX.frames); await settle(); await settle();
  assert.equal(at(a), 5, 'the late file moved the replay');
  assert.ok(!trk(a), 'the late file opened a tracking');
});

/* ---------------------------------------------------------------- the rules, under random use */

test('⭐⭐ the rules hold under random use: playing has exactly one driver, paused has none', async () => {
  const actions = ['play', 'play', 'fwd', 'back', 'scrub', 'speed', 'run', 'run', 'advance', 'advance', 'hide'];
  for (const seed of [7, 2026, 1103]) {
    let s = seed;
    const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const a = await goals();
    const rules = what => {
      const tm = a.wait != null, loop = a.queued > 0;
      if (playing(a)) assert.equal((tm ? 1 : 0) + (loop ? 1 : 0), 1,
        `seed ${seed}, after ${what}: playing with ${tm ? 'a timer' : 'no timer'} and ${loop ? 'a drawing loop' : 'no drawing loop'}`);
      else assert.ok(!tm && !loop, `seed ${seed}, after ${what}: paused with a driver (timer ${tm}, frames ${a.queued})`);
    };
    const log = [];
    for (let n = 0; n < 120; n++) {
      const act = actions[Math.floor(rnd() * actions.length)];
      log.push(act);
      if (act === 'play') a.$('play').click();
      else if (act === 'fwd') a.$('fwd').click();
      else if (act === 'back') a.$('back').click();
      else if (act === 'scrub') { const k = String(Math.floor(rnd() * TL.length)); a.$('scrub').value = k; a.$('scrub').onchange({ target: { value: k } }); }
      else if (act === 'speed') a.$(['trkQ', 'trkH', 'trkR'][Math.floor(rnd() * 3)]).click();
      else if (act === 'run') a.run(Math.floor(rnd() * 8000));
      else if (act === 'advance') a.advance(1);
      else if (act === 'hide') { a.hide(); rules('hide'); a.later(Math.floor(rnd() * 30000)); a.show(); }
      await settle();
      rules(log.slice(-6).join(' → '));
    }
  }
});

/* ---------------------------------------------------------------- the runs that drive themselves */

test('"See it tracked" plays the goal’s tracking under reduced motion, then clears itself', async () => {
  const a = boot(rich, null, '?replay=goals', null, served);
  await settle(); await settle();
  a.at(GOALS[0].k, () => {}); await settle(); await settle();
  assert.match(a.$('who').innerHTML, /See it tracked/);
  a.$('who')._fire({ target: { closest: sel => (sel === '.wtrk' ? {} : null) } });
  assert.ok(trk(a), 'the button did not start the tracking');
  assert.ok(a.queued > 0, 'the tracking is not drawing');
  a.advance(1);                                   // its frames, to the goal line
  assert.ok(trk(a), 'it cleared at the goal line, before anyone could see it there');
  a.advance(1);                                   // the moment after
  assert.ok(!trk(a), 'it never cleared');
});
