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
import { rich, boot, app } from './helpers/page.js';
import { corsiTeam } from '../src/lib/attribution.js';
import { bandFrom, distanceSentence, shotFeet } from '../src/lib/shotdist.js';

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
const shown = a => !a.$('trkSpeed').hidden;

test('with no fetcher there are no tracking controls and nothing is asked for', async () => {
  const a = boot();
  await settle();
  assert.equal(a.$('trkSpeed').hidden, true);
});

test('a game whose index lists no goals offers no controls', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null));
  await settle(); await settle();
  assert.equal(shown(a), false, 'controls for a game with nothing tracked');
});

test('⭐ a game with tracked goals is Goals only: a plain visit, a link to a moment and replay=all all open it', async () => {
  const goals = async q => { const a = boot(rich, null, q, null, served(), MOTION); await settle(); await settle();
    assert.ok(shown(a), 'the speed control stayed hidden');
    return { on: a.$('rg').classList.contains('trkgoals'), a }; };
  const plain = await goals('');
  assert.ok(plain.on, 'a plain visit is not in Goals');
  assert.equal(plain.a.$('trkQ').getAttribute('aria-pressed'), 'true', '¼ is not the speed');
  assert.match(plain.a.$('newcomer').innerHTML, /watch this game's goals/);
  assert.doesNotMatch(app, /id="trk(All|Goals|Mode)"/, 'there is still a switch to All events');
  const at = TL[40], moment = await goals(`?at=${at.per}-${at.rem}`);
  assert.ok(moment.on, 'a link to a moment stayed in the event walk');
  assert.equal(+moment.a.$('scrub').value, 40, 'Goals moved the linked moment');
  assert.ok((await goals('?replay=all')).on, 'replay=all still opens the event walk');
});

test('a link that carries a layer opens a tracked game in Goals with every layer off', async () => {
  const at = TL[40];
  const a = boot(rich, null, `?at=${at.per}-${at.rem}&layer=whistle`, null, served(), MOTION);
  await settle(); await settle();
  const chip = l => a.$$('#rg .pk').find(b => b.dataset.l === l);
  assert.ok(a.$('rg').classList.contains('trkgoals'), 'the tracked game is not in Goals');
  assert.equal(chip('none').getAttribute('aria-checked'), 'true', 'Goals kept the linked layer on');
  assert.equal(chip('whistle').getAttribute('aria-checked'), 'false', 'the layer stayed on in Goals');
  assert.ok(a.$('lbox').classList.contains('empty'), 'the layer box still holds a count');
});

test('a link that carries a layer to a game with no tracked goals keeps it', async () => {
  const at = TL[40];
  const a = boot(rich, null, `?at=${at.per}-${at.rem}&layer=whistle`, null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null), MOTION);
  await settle(); await settle();
  assert.equal(a.$('rg').classList.contains('trkgoals'), false);
  assert.equal(a.$$('#rg .pk').find(b => b.dataset.l === 'whistle').getAttribute('aria-checked'), 'true', 'the lesson link lost its layer');
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
  // One thing at a time: the note under the rink is this frame's line, or nothing.
  assert.match(a.$('playline').textContent, /^(|Anyone inside the (light|shaded) triangle .*)$/, 'the whole account is under the rink');
});

test('Goals mode shows the color line with no tap target', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  assert.equal(a.$('rg').classList.contains('trkgoals'), true, 'not in Goals');
  const k = a.every(d => d.$('playline').textContent).findIndex(Boolean);
  assert.ok(k > 0, 'Goals has no color line');
  a.at(k, () => {});
  assert.ok(a.$('playline').textContent, 'the color line is missing');
  assert.match(app, /#rg\.trkgoals \.playline\{cursor:default;pointer-events:none\}/, 'Goals still offers the line as a tap target');
  assert.equal(a.$('pwrow').hidden && a.$('pwshift').hidden && a.$('pwrun').hidden, true, 'the source note is showing in Goals');
  assert.equal(a.$('playd').open, false);
  assert.equal(a.$('playline').tabIndex, -1, 'Goals still tabs to the disclosure');
  assert.equal(a.$('playline').getAttribute('title'), null, 'Goals still names it as a disclosure');
  a.$('playd').open = true;
  a.at(k, () => {});
  assert.equal(a.$('playd').open, false, 'Goals reopened the source note');
});

test('Goals mode says how often shots from that distance go in', async () => {
  const k0 = rich.events.findIndex(e => e.type === 'goal' && e.x != null);
  const goal = rich.events[k0];
  const ft = shotFeet(goal, corsiTeam(goal, rich.roster), rich.teams.home.id);
  const from = bandFrom(ft);
  const quoted = { bandFt: 5, minN: 30, bands: [
    { from, to: from + 5, goals: 12, n: 100, rate: 0.12 }] };
  const thin = { bandFt: 5, minN: 30, bands: [
    { from, to: from + 5, goals: 1, n: 4, rate: 0.25 }] };
  const show = async doc => {
    const a = boot(rich, { shotDistance: doc }, '?replay=goals', null, served(), MOTION);
    await settle(); await settle();
    const k = a.timeline.findIndex(e => e && e.type === 'goal' && e.x != null);
    a.at(k, () => {});
    return a;
  };
  const a = await show(quoted);
  assert.equal(a.$('playdist').hidden, false);
  assert.equal(a.$('playdistSay').textContent, distanceSentence(ft, quoted));
  assert.equal(a.$('playdistDoor').hidden, false, 'a quoted rate has no door to its working');
  assert.match(a.$('playdistDoor').href, /\/how-we-measure\.html#m-shotDistance$/);
  const few = await show(thin);
  assert.match(few.$('playdistSay').textContent, /^Too few shots/);
  assert.equal(few.$('playdistDoor').hidden, true, 'a band too thin to quote opened a door to a line the page does not print');
});

test('Goals shows the onside entry', async () => {
  const home = rich.teams.home.id, away = rich.teams.away.id, ab = rich.teams.home.ab;
  const dot = (x, id, team) => ({ x: (x + 100) * 12, y: (42.5 - 0) * 12, playerId: id || '', teamId: team ?? '', sweaterNumber: '' });
  const rows = [
    { puck: 22, sk: [[11, 8], [12, 2], [31, -80], [21, 40, away]] },
    { puck: 30, sk: [[11, 14], [12, 6], [31, -80], [21, 50, away]] },
    { puck: 50, sk: [[11, 28], [12, 16], [31, -80], [21, 55, away]] },
    { puck: 80, sk: [[11, 50], [12, 30], [31, -80], [21, 60, away]] },
    { puck: 92, sk: [[11, 70], [12, 40], [31, -80], [21, 70, away]] },
  ];
  const frames = rows.map((row, i) => {
    const onIce = { '1': dot(row.puck) };
    for (const [id, x, team] of row.sk) onIce[id] = dot(x, id, team || home);
    return { timeStamp: i * 10, onIce };
  });
  const game = structuredClone(rich);
  game.roster[11] = { n: 11, nm: 'One', pos: 'C', tid: home };
  game.roster[12] = { n: 12, nm: 'Two', pos: 'D', tid: home };
  game.roster[31] = { n: 31, nm: 'Keep', pos: 'G', tid: home };
  game.roster[21] = { n: 21, nm: 'Them', pos: 'C', tid: away };
  const tl = boot(game).timeline;
  const goals = tl.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO');
  const index = goals.map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
  const fetch = name => Promise.resolve(name.endsWith('goals.json') ? index : frames);

  const g = boot(game, null, '?replay=goals', null, fetch, MOTION);
  await settle(); await settle();
  g.at(0, () => {});
  g.$('fwd').click(); await settle(); await settle();
  assert.ok(g.$('rg').classList.contains('trk'), 'Goals did not open the tracking');
  assert.match(g.$('track').innerHTML, /class="onside approach"/, 'the line does not glow as the puck approaches');
  assert.doesNotMatch(g.$('playline').textContent, /Onside/);
  let said = g.$('playline').textContent;
  for (let n = 0; n < 6 && !/Onside:/.test(said); n++) {
    g.$('fwd').click(); await settle(); await settle();
    said = g.$('playline').textContent;
  }
  assert.equal(said, `Onside: the puck crossed the blue line before any ${ab} player did.`);
  assert.equal([...g.$('track').innerHTML.matchAll(/class="tck"/g)].length, 2);
  assert.doesNotMatch(g.$('track').innerHTML + said, /too close/i);
});

test('an empty-net goal in Goals says the net was empty, not a rate', async () => {
  const game = JSON.parse(JSON.stringify(rich));
  const goal = game.events.find(e => e.type === 'goal' && e.x != null);
  const shooter = corsiTeam(goal, game.roster);
  goal.sit = shooter === game.teams.home.id ? '0651' : '1650';
  const a = boot(game, { shotDistance: { bandFt: 5, minN: 30, bands: [
    { from: 0, to: 5, goals: 12, n: 100, rate: 0.12 }] } }, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  const k = a.timeline.findIndex(e => e && e.type === 'goal' && e.x != null);
  a.at(k, () => {});
  assert.equal(a.$('playdistSay').textContent, 'The net was empty, so there\u2019s no goalie to beat.');
  assert.equal(a.$('playdistDoor').hidden, true);
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

test('⭐ a copied link carries the speed, not a mode, and the confirmation says so', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  a.at(GOALS[0].k, () => {});
  a.$('share').onclick(); await settle();
  let q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('replay'), null, 'the link names a mode, and there is only one');
  assert.equal(q.get('speed'), '0.25', 'a game with tracked goals always carries its speed');
  assert.match(a.$('sharesaid').innerHTML, /, tracked goals at ¼ speed\./);
  a.$('trkH').click(); await settle();
  a.$('share').onclick(); await settle();
  q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('speed'), '0.5');
  assert.match(a.$('sharesaid').innerHTML, /tracked goals at ½ speed/);
  // And the link opens that way.
  const b = boot(rich, null, '?' + q.toString(), null, served(), MOTION);
  await settle(); await settle();
  assert.ok(b.$('rg').classList.contains('trkgoals'));
  assert.equal(b.$('trkH').getAttribute('aria-pressed'), 'true');
});

test('a game with no tracked goals carries neither', async () => {
  const a = boot(rich, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null));
  await settle(); await settle();
  a.at(10, () => {});
  a.$('share').onclick(); await settle();
  assert.doesNotMatch(a.copied, /replay=|speed=/);
});

test('⭐ the front door\'s hero loops its first goal as Goals plays it: the tracking, the goal at rest, again', async () => {
  const a = boot(rich, null, '?preview=1', null, served(), MOTION);
  await settle(); await settle();
  const first = GOALS[0], trk = () => a.$('rg').classList.contains('trk'), rest = () => a.$('rg').classList.contains('trkrest');
  assert.ok(a.posted.some(p => p.msg.rtg === 'tracked' && p.msg.game === rich.game.id), 'the front door is not told the goal is tracked');
  assert.ok(trk(), 'the hero walks events before the tracking');
  const held = +a.$('scrub').value;
  assert.ok(held > 0 && held < first.k, 'the tracking is not laid over the frame before the goal');
  assert.match(a.$('who').textContent, /^Tracked · goal by/);
  assert.ok(a.wait > 1500, 'the hero does not wait out the clip');
  a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, first.k, 'the tracking does not hand over to the goal frame');
  assert.ok(!trk() && rest(), 'the goal frame is not the tracking at rest');
  a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, held, 'the loop does not go back to the tracking');
  assert.ok(trk() && !rest());
});

test('⭐ the hero tells the front door what its goal was scored at, the archive\'s rate included', async () => {
  const g = structuredClone(rich), k = g.events.findIndex(e => e.type === 'goal' && e.pt !== 'SO'), goal = g.events[k];
  const away = Object.entries(rich.roster).find(([, p]) => p.tid === rich.teams.away.id && p.pos !== 'G');
  goal.sit = '1451';                                       // home scores with an away skater in the box
  g.events.splice(k, 0, { ...goal, type: 'penalty', own: rich.teams.away.id, actor: +away[0], pen: 'tripping', sev: 'MIN', min: 2, s: goal.s - 1, sit: '1551' });
  const rates = { census: { games: 4418, whistles: { ppGoals: 5275, ppChances: 24991 } } };
  const a = boot(g, rates, '?preview=1', null, served(), MOTION);
  await settle(); await settle();
  const m = a.posted.map(p => p.msg).find(m => m.rtg === 'goal');
  assert.ok(m && m.game === rich.game.id, 'the front door is not told');
  assert.equal(m.says, `${rich.teams.home.ab} had 5 skaters to ${rich.teams.away.ab}'s 4, because ${away[1].nm} was in the penalty box for tripping: a "power play". Across the 4,418 games we have measured, about 1 power play in 5 ended in a goal.`);
  // The paired half: an even-strength first goal says nothing.
  const b = boot(rich, rates, '?preview=1', null, served(), MOTION);
  await settle(); await settle();
  assert.ok(!b.posted.some(p => p.msg.rtg === 'goal'));
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

test('⭐ Goals: Next steps onto each assist, and the name line gives the league\'s credit', async () => {
  // The Toews goal's tracking, under the reference game's first goal given that goal's scorer and assists.
  const TX = JSON.parse(readFileSync(new URL('./fixtures/tracked-2026020167-ev67.json', import.meta.url), 'utf8'));
  const tg = TX.events.find(e => e.type === 'goal'), R = structuredClone(rich);
  const g = R.events.find(e => e.type === 'goal' && e.pt !== 'SO');
  Object.assign(g, { actor: tg.actor, a1: tg.a1, a2: tg.a2, x: tg.x, y: tg.y, st: tg.st });
  for (const id of [tg.actor, tg.a1, tg.a2]) R.roster[id] = { ...TX.roster[id], tid: g.own };
  const tl = boot(R).timeline, rows = tl.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO')
    .map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
  const a = boot(R, null, '?replay=goals', null,
    name => Promise.resolve(name.endsWith('goals.json') ? rows : TX.frames), MOTION);
  await settle(); await settle();
  a.at(0, () => {});
  const said = [];
  for (let n = 0; n < 10 && !said.some(s => /primary/.test(s)); n++) {
    a.$('fwd').click(); await settle(); await settle();
    said.push(a.$('who').textContent);
  }
  const two = said.findIndex(s => s === '#29 MacKinnon passes · the league credits him with the secondary assist');
  const one = said.findIndex(s => s === '#88 Necas passes · the league credits him with the primary assist');
  assert.ok(two >= 0, `Next never stopped on the secondary assist: ${JSON.stringify(said)}`);
  assert.ok(one > two, 'the primary assist is not the stop after the secondary');
  assert.ok(a.$('rg').classList.contains('trk'), 'the assist stop left the tracking');
});

test('⛔ Goals: Play does not hold the opening face-off for a frame\'s reading time', async () => {
  const a = boot(rich, null, '?replay=goals', null, served(), MOTION);
  await settle(); await settle();
  a.$('play').click();
  assert.equal(+a.$('scrub').value, 0, 'Play did not start the game over');
  assert.ok(a.wait <= 400, `the opening face-off is held ${a.wait} ms before the first goal`);
  a.advance(1); await settle();
  assert.ok(a.$('rg').classList.contains('trk'), 'the first goal\'s tracking did not follow the face-off');
});

test('⛔ Goals: a goal whose file has not arrived waits a moment and asks again, not a frame\'s reading time', async () => {
  let release;
  const late = new Promise(r => { release = r; });
  const a = boot(rich, null, '?replay=goals', null,
    name => name.endsWith('goals.json') ? Promise.resolve(ROWS) : late, MOTION);
  await settle(); await settle();
  a.$('play').click();
  a.advance(1); await settle();
  assert.equal(a.$('rg').classList.contains('trk'), false, 'tracking with no file');
  assert.ok(a.wait <= 400, `waiting for the file holds ${a.wait} ms`);
  release(FX.frames);
});

/* A game settled by a shootout: CAR at PHI, 2025-12-13, tied after overtime, CAR's one shootout goal the only
   one. And a playoff game whose period 5 is overtime, not a shootout: CAR at NYR, 2024-05-07. */
const XG = id => JSON.parse(readFileSync(new URL(`./fixtures/extracts/${id}.json`, import.meta.url), 'utf8'));
function goalsOf(game) {
  const tl = boot(game).timeline;
  const rows = tl.map((e, k) => ({ e, k })).filter(({ e }) => e && e.type === 'goal' && e.pt !== 'SO')
    .map(({ e, k }) => ({ ev: 1000 + k, per: e.per, clock: e.clock, scorer: e.actor }));
  return { tl, fetch: name => Promise.resolve(name.endsWith('goals.json') ? rows : FX.frames) };
}

test('⭐ Goals: a game settled by a shootout stops on its first attempt and says so, then the horn', async () => {
  const game = XG('2025020501'), { tl, fetch } = goalsOf(game);
  const so = tl.findIndex(e => e && e.pt === 'SO'), last = tl.map((e, k) => e && e.type === 'goal' && e.pt !== 'SO' ? k : -1).filter(k => k >= 0).pop();
  const a = boot(game, null, '?replay=goals', null, fetch);              // reduced motion: stop to stop
  await settle(); await settle();
  a.at(last, () => {}); await settle();
  a.$('fwd').click(); await settle(); await settle();
  assert.equal(+a.$('scrub').value, so, 'Next went from the last goal past the shootout');
  assert.equal(a.$('who').textContent, "The shootout's first attempt · overtime ended without a goal");
  assert.equal(a.$('playline').textContent, 'Overtime ended without a goal, so a shootout decided the game. '
    + 'CAR won the shootout 1–0, and the team that wins a shootout is credited with one goal on the final score.');
  a.$('play').click(); a.advance(1); await settle();
  assert.equal(+a.$('scrub').value, tl.length - 1, 'Play did not go from the shootout to the horn');
  const all = boot(game, null, '', null, name => Promise.resolve(name.endsWith('goals.json') ? [] : null));
  await settle(); await settle();
  all.at(so, () => {}); await settle();
  assert.doesNotMatch(all.$('playline').textContent + all.$('who').textContent, /overtime ended without a goal/i, 'the event walk took the Goals stop\'s words');
});

test('a playoff game whose fifth period is overtime has no shootout stop', async () => {
  const game = XG('2023030222'), { tl, fetch } = goalsOf(game);
  assert.equal(tl.findIndex(e => e && e.pt === 'SO'), -1);
  const a = boot(game, null, '?replay=goals', null, fetch);
  await settle(); await settle();
  for (let k = -1; k < tl.length; k++) { a.at(k, () => {}); assert.doesNotMatch(a.$('who').textContent + a.$('playline').textContent, /shootout/, `frame ${k}`); }
});
