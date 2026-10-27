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

test('⭐ a plain visit opens in Goals; a link to a moment, or replay=all, opens in All events', async () => {
  const mode = async q => { const a = boot(rich, null, q, null, served(), MOTION); await settle(); await settle();
    assert.ok(shown(a), 'the controls stayed hidden');
    return { goals: a.$('trkGoals').getAttribute('aria-pressed') === 'true', all: a.$('trkAll').getAttribute('aria-pressed') === 'true',
      cls: a.$('rg').classList.contains('trkgoals'), q: a.$('trkQ').getAttribute('aria-pressed'), a }; };
  const plain = await mode('');
  assert.ok(plain.goals && !plain.all && plain.cls, 'a plain visit is not in Goals');
  assert.equal(plain.q, 'true', '¼ is not the speed');
  assert.match(plain.a.$('newcomer').innerHTML, /watch this game's goals/, 'the greeting describes All events in Goals');
  const at = TL[40], moment = await mode(`?at=${at.per}-${at.rem}`);
  assert.ok(moment.all && !moment.goals, 'a link to a moment did not open in All events');
  const all = await mode('?replay=all');
  assert.ok(all.all && !all.goals, 'replay=all did not open in All events');
  assert.match(all.a.$('newcomer').innerHTML, /every event/, 'the greeting describes Goals in All events');
  const goalsAt = await mode(`?at=${at.per}-${at.rem}&replay=goals`);
  assert.ok(goalsAt.goals, 'replay=goals on a moment link was ignored');
  // Choosing All events on a plain visit is written into the address, so a reload keeps it.
  plain.a.$('trkAll').click();
  assert.ok(plain.a.$('trkAll').getAttribute('aria-pressed') === 'true');
});

test('a plain visit to a game with no tracked goals stays in All events', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null), MOTION);
  await settle(); await settle();
  assert.equal(a.$('rg').classList.contains('trkgoals'), false, 'Goals with nothing to show');
  assert.match(a.$('newcomer').innerHTML, /every event/);
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
  a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, first.k, 'after the tracking, not the goal frame');
  assert.equal(a.$('rg').classList.contains('trk'), false, 'the tracking is still running on the goal');
  // ⭐ ONE GOAL, ONE STOP: the goal frame holds the tracked picture of the puck in the net.
  assert.ok(a.$('rg').classList.contains('trkrest'), 'the goal stop does not hold the tracked picture');
  assert.match(a.$('track').innerHTML, /class="tpk"/, 'no puck in the held picture');
  assert.match(a.$('labels').innerHTML, /GOAL/, 'the goal stop does not say GOAL');
});

test('Goals: Prev and Next step within a goal\'s tracking, and pause there', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  a.at(0, () => {});
  a.$('fwd').click(); await settle(); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'Next did not open the next goal\'s tracking');
  const first = a.$('clk').textContent;
  a.$('fwd').click(); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'one Next left a goal with a shot stop');
  const second = a.$('clk').textContent;
  assert.notEqual(second, first, 'Next did not move within the goal');
  a.$('back').click(); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'Prev left the tracking');
  assert.notEqual(a.$('clk').textContent, second, 'Prev did not move back');
  assert.equal(a.$('play').textContent.includes('Pause'), false, 'stepping did not pause');
  // One thing at a time: the note under the rink is the triangle's line or nothing; the account is in the panel.
  assert.match(a.$('playline').textContent, /^(|Anyone inside the (light|shaded) triangle .*)$/, 'the whole account is under the rink');
  assert.match(a.$('pwtrk').textContent, /10 times a second/, 'the panel does not carry the tracked goal\'s account');
});

test('⭐ Goals: one goal is one stop: Next goes from the shot to the goal, which holds the puck in the net', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  const [g0, g1, g2] = GOALS;
  a.at(g0.k, () => {}); await settle(); await settle();
  const trk = () => a.$('rg').classList.contains('trk'), rest = () => a.$('rg').classList.contains('trkrest');
  const at = () => +a.$('scrub').value, clk = () => a.$('clk').textContent;
  const next = async () => { a.$('fwd').click(); await settle(); await settle(); };
  const prev = async () => { a.$('back').click(); await settle(); await settle(); };
  assert.equal(at(), g0.k);
  assert.ok(rest(), 'the first goal does not hold its tracked picture');
  // The banner sits at centre ice (Kevin), clear of the goal moment, with no leader line to the puck.
  const x = +(a.$('labels').innerHTML.match(/class="glab" x="([\d.]+)"/) || [])[1];
  const puckX = +(a.$('track').innerHTML.match(/class="tpk" cx="([\d.]+)"/) || [])[1];
  assert.equal(x, 100, 'the banner is not at centre ice');
  assert.ok(Number.isFinite(puckX) && Math.abs(puckX - x) > 60, `banner at ${x}, puck at ${puckX}: on the goal moment`);
  assert.doesNotMatch(a.$('labels').innerHTML, /<line/, 'a leader line across the play');
  await next();
  assert.ok(trk() && !rest(), 'Next did not open the second goal\'s tracking');
  const seen = [];
  for (let n = 0; n < 8 && trk(); n++) { seen.push(clk()); await next(); }
  assert.equal(at(), g1.k, 'the stops did not end on the goal frame');
  assert.ok(rest() && !trk(), 'the goal frame does not hold the tracked picture');
  assert.equal(new Set(seen).size, seen.length, `a stop repeated: ${seen}`);
  await next();
  assert.ok(trk() && !rest(), 'from the goal, Next did not open the next goal');
  await prev();
  assert.equal(at(), g1.k, 'Prev from the next goal\'s first frame did not land on the previous goal');
  assert.ok(rest());
  await prev();
  assert.ok(trk(), 'Prev from the goal did not go back into its tracking');
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
  const a = boot(rich, null, '?replay=all', null, served(), MOTION);
  await settle(); await settle();
  a.at(GOALS[0].k, () => {});
  a.$('share').onclick(); await settle();
  let q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('replay'), null, 'a link to a moment opens in All events without saying so');
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

test('⭐ in Goals the scrubber goes where it is tapped, the very start and end included', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  const last = TL.length - 1, mid = Math.floor((GOALS[0].k + GOALS[1].k) / 2);
  for (const k of [0, mid, last]) {
    a.$('scrub').value = String(k);
    a.$('scrub').onchange({ target: { value: String(k) } }); await settle();
    assert.equal(+a.$('scrub').value, k, `a tap at ${k} moved to ${a.$('scrub').value}`);
  }
});

test('a pre-game link copied in All events says so, since a link with no moment opens in Goals', async () => {
  const a = boot(rich, null, '?replay=all', null, served(), MOTION);
  await settle(); await settle();
  a.$('share').onclick(); await settle();
  assert.equal(new URLSearchParams(a.copied.split('?')[1]).get('replay'), 'all');
});
