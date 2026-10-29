/**
 * The tracked goal's arithmetic and words (src/lib/tracked.js), on a real goal:
 * #10 Panarin, LAK at WSH, 2026-10-20, with 2 seconds left in the first — the
 * league's tracking file and the events our extract holds around it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  trackPlan, trackRow, trackWindow, trackRecorded, trackStrength, trackWho, trackSay, trackFirst,
  trackTags, trackStops, trackFrameAt, trackClock, trackRem, trackSecs, trackClipSit, trackFeet, trackGoalAhead, trackGoals,
  trackHoldFrame, trackMarkup, trackPlace, TRACK_TAG_TENTHS, TRACK_TAG_EDGE, trackShot, trackLaneSay, trackLaneLine, trackAssists, trackAssistSay, trackHolders, TRACK_REACH_FT, TRACK_LANE_FT, TRACK_RELEASE_FT, TRACK_CARRY_FT, TRACK_SAME_SHOT,
  trackEntry, trackEntrySay,
} from '../src/lib/tracked.js';
import { stints, occupants } from '../src/lib/box.js';
import { GOAL_POST_Y, NET_X } from '../src/lib/rink.js';

const FX = JSON.parse(readFileSync(new URL('./fixtures/tracked-2026020144-ev202.json', import.meta.url), 'utf8'));
const G = { game: FX.game, teams: FX.teams, roster: FX.roster, events: FX.events };
const EV = FX.events;
const GOAL = EV.find(e => e.type === 'goal' && e.s === 1198);
const P = trackPlan(FX.frames, GOAL);
// The replay's own placement with the ends as the league draws them (app.js `AX`/`AY`, DIR 1).
const AX = x => 100 + x, AY = y => 42.5 - y;

test('the goals index names this goal by period, clock and scorer', () => {
  const row = trackRow(FX.goals, GOAL);
  assert.equal(row && row.ev, 202);
  assert.equal(trackRow(FX.goals, { ...GOAL, clock: '19:57' }), null, 'a different clock is a different goal');
});

test('the plan finds the frame where the puck crosses the goal line', () => {
  assert.ok(P, 'no plan');
  const at = trackFeet(P.frames[P.k].onIce['1']), was = trackFeet(P.frames[P.k - 1].onIce['1']);
  assert.ok(Math.abs(at.x) > 89 && Math.abs(was.x) <= 89, 'frame k is not the crossing');
  assert.ok(Math.abs(at.y) <= 3.5, 'the puck crossed outside the posts');
  assert.ok(P.before > 8 && P.before < 11, `${P.before} s of build-up`);
  assert.equal(trackPlan(FX.frames, { ...GOAL, x: null }), null, 'a goal with no location cannot be oriented');
});

test('⭐ the tracking and the league\'s record put the same player in the same place', () => {
  /* A SECOND PATH TO THE ORIENTATION. `turn` is read off the goal's sign; the hit's
     location is the league's play-by-play, written down independently. At the hit's
     moment the hitter (#14 Laferriere) must stand where the league recorded the hit.
     MUTATION: flip `turn`, or the file's y (`42.5 - y/12`), and he is 20+ feet away. */
  const win = trackWindow(P, EV), hit = win.find(e => e.type === 'hit');
  assert.ok(hit, 'the fixture lost its hit');
  const tag = trackTags(P, win).find(t => t.e === hit);
  const o = Object.values(P.frames[trackFrameAt(P, tag.at)].onIce).find(x => x.playerId === hit.actor);
  const f = trackFeet(o), d = Math.hypot(P.turn * f.x - hit.x, P.turn * f.y - hit.y);
  assert.ok(d < 6, `the hitter is ${d.toFixed(1)} ft from where the league recorded the hit`);
});

test('the line names the recorded events in plain English, with each player\'s team', () => {
  const win = trackWindow(P, EV);
  assert.equal(trackRecorded(P, G, win),
    ' Recorded by the league in these 10 seconds: a hit by #14 Laferriere (LAK) behind the WSH net.');
  assert.equal(trackRecorded(P, G, []),
    ' The league recorded nothing else in these 10 seconds: watch the puck.');
  assert.equal(trackWho(P, G), 'Tracked · goal by #10 Panarin (LAK)');
  assert.match(trackSay(P, G, win, 0.25), /^The last 10 seconds before the goal: every player and the puck as the league tracked them, 10 times a second, at a quarter of real speed\. Recorded/);
  assert.match(trackSay(P, G, win, 1), /in real time\./);
  assert.equal(trackFirst(P), '10 seconds before the goal. The black dot is the puck.');
});

test('a place is behind a net, in an end, or the middle of the ice', () => {
  // The home club (WSH) defends -x in our extract.
  assert.equal(trackPlace({ x: -97 }, G), ' behind the WSH net');
  assert.equal(trackPlace({ x: 60 }, G), ' in the LAK end');
  assert.equal(trackPlace({ x: 10 }, G), ' in the middle of the ice');
  assert.equal(trackPlace({ x: null }, G), '');
});

test('the strength says who has the extra skater, from the goal\'s own code', () => {
  const home = G.teams.home.id, away = G.teams.away.id;
  assert.equal(trackStrength({ sit: '1451', own: home }, G), ' WSH has a power play: 5 skaters to LAK’s 4.');
  assert.equal(trackStrength({ sit: '1451', own: away }, G), ' LAK is short-handed: 4 skaters to WSH’s 5.');
  assert.equal(trackStrength({ sit: '1560', own: away }, G), ' WSH has pulled its goaltender: the net is empty.');
  // The club that pulled is the one named, whichever side scored. 1560 is the
  // home goalie out; 0651 is the away goalie out. Both used to read as a power play
  // when the pulling team was the one that scored.
  assert.equal(trackStrength({ sit: '1560', own: home }, G), ' WSH has pulled its goaltender: the net is empty.');
  assert.equal(trackStrength({ sit: '0651', own: away }, G), ' LAK has pulled its goaltender: the net is empty.');
  assert.equal(trackStrength({ sit: '0651', own: home }, G), ' LAK has pulled its goaltender: the net is empty.');
  assert.equal(trackStrength({ sit: '1551', own: home }, G), '');
  assert.equal(trackStrength({ sit: '0101', own: away }, G), '', 'a penalty shot is not a power play and not an empty net');
});

test('the stops are the first frame, each recorded event, and the goal line', () => {
  const tags = trackTags(P, trackWindow(P, EV)), stops = trackStops(P, tags);
  assert.deepEqual(stops, [P.frames[0].timeStamp, tags[0].at, P.frames[P.k].timeStamp]);
  assert.equal(trackClock(P, P.k), '00:02', 'at the goal line the clock reads the goal\'s own');
  assert.equal(trackClock(P, 0), '00:11');
  assert.equal(trackFrameAt(P, 9e15), P.k, 'never past the goal line');
});

test('the goal ahead is in the same stretch of play, and the frame held is before its tracking', () => {
  const g = EV.indexOf(GOAL), gs = trackGoals(EV);
  assert.ok(gs.includes(g));
  const faceoff = EV.findIndex(e => e.type === 'faceoff');
  assert.equal(trackGoalAhead(EV, faceoff), g);
  assert.equal(trackGoalAhead(EV, faceoff - 1), -1, 'a face-off stands between, so no');
  assert.equal(trackGoalAhead(EV, -1), -1, 'pre-game has no stretch to be in');
  const j = trackHoldFrame(EV, g, P);
  assert.ok(EV[j].s < GOAL.s - P.before && EV[j + 1].s >= GOAL.s - P.before);
});

test('the frame draws twelve skaters and the puck, the visitor in white, the label inside the boards', () => {
  const col = { [G.teams.home.id]: '#C8102E', [G.teams.away.id]: '#111111' };
  const tags = trackTags(P, trackWindow(P, EV)), at = tags[0].at;
  const svg = trackMarkup(P, trackFrameAt(P, at), at, { G, AX, AY, col, tags });
  const dots = svg.match(/<circle cx/g) || [];
  assert.ok(dots.length >= 10 && dots.length <= 13, `${dots.length} players`);
  assert.match(svg, /class="tpk"/, 'no puck');
  assert.match(svg, /fill="#fff" stroke="#111111"/, 'the visitor is not in white');
  assert.match(svg, /fill="#C8102E"/, 'the host is not in its colour');
  const tag = /<text class="tag" x="([\d.]+)"[^>]*text-anchor="(\w+)">Hit</.exec(svg);
  assert.ok(tag, 'the hit is not labelled at its moment');
  // Behind the WSH net, which is at the LEFT boards in this orientation: anchored at its
  // start, so the word runs into the ice; and it stays at the hit (x = 100 - 97 = 3).
  assert.equal(tag[2], 'start');
  assert.ok(+tag[1] < TRACK_TAG_EDGE && +tag[1] > 3, `the label is at x=${tag[1]}, not beside the hit`);
  const later = trackMarkup(P, trackFrameAt(P, at + TRACK_TAG_TENTHS), at + TRACK_TAG_TENTHS, { G, AX, AY, col, tags });
  assert.doesNotMatch(later, />Hit</, 'the label outlasts its moment');
});

test('⭐ the shot\'s lane opens where the puck leaves the stick, the release nearest the spot the league recorded', () => {
  const S = trackShot(P, G.teams.home.id);
  assert.ok(S && S.lane, 'a 38-foot goal has no lane');
  assert.equal(S.ft, 38, 'not the distance the color line says');
  const pk = t => { const f = trackFeet(P.frames[t].onIce['1']); return { x: P.turn * f.x, y: P.turn * f.y }; };
  const stepAt = t => Math.hypot(pk(t + 1).x - pk(t).x, pk(t + 1).y - pk(t).y);
  // A RELEASE BY THE TRACKING ALONE: carried into the frame, faster than anyone skates out of it.
  assert.ok(stepAt(S.j - 1) <= TRACK_CARRY_FT && stepAt(S.j) > TRACK_CARRY_FT, `frame ${S.j} is not where the puck leaves the stick`);
  // A SECOND PATH: the league recorded the shot at (-65, -30), independently; the release is near it, not elsewhere on the ice.
  assert.ok(Math.hypot(S.apex.x - GOAL.x, S.apex.y - GOAL.y) < 10, 'the release is nowhere near the recorded shot');
  assert.ok(S.j < P.k, 'the shot is not before the goal line');
  // LAK, the visitor, attacks the -x net; the posts are the goal mouth's, 6 feet apart.
  assert.deepEqual(S.posts, [{ x: -NET_X, y: -GOAL_POST_Y }, { x: -NET_X, y: GOAL_POST_Y }]);
  assert.equal(GOAL_POST_Y * 2, 6);
});

test('every located goal has a shot stop; the lane is held beyond 20 feet; the release rule finds the moment only beyond 30', () => {
  assert.equal(TRACK_LANE_FT, 20);
  assert.equal(TRACK_RELEASE_FT, 30);
  const shotOf = g => { const P2 = trackPlan(FX.frames, g); return { P2, S: trackShot(P2, G.teams.home.id) }; };
  const nearestTo = (P2, g) => { let b = -1, d = Infinity;
    for (let t = 0; t <= P2.k; t++) { const f = trackFeet(P2.frames[t].onIce['1']), dd = Math.hypot(P2.turn * f.x - g.x, P2.turn * f.y - g.y); if (dd < d) { d = dd; b = t; } }
    return b; };
  // 15 ft: a stop, no lane, the frame nearest the recorded spot.
  const g15 = { ...GOAL, x: -75, y: -5 }, a = shotOf(g15);
  assert.ok(a.S && a.S.lane === false && a.S.ft === 15);
  assert.equal(a.S.j, nearestTo(a.P2, g15));
  const tags = trackTags(a.P2, trackWindow(a.P2, EV));
  assert.ok(trackStops(a.P2, tags, a.S.at).includes(a.S.at), 'the shot is not a stop');
  assert.doesNotMatch(trackMarkup(a.P2, a.P2.k, a.P2.frames[a.P2.k].timeStamp, { G, AX, AY, col: {}, tags, shot: a.S }), /class="tlane"/);
  // 29 ft: the lane is held, and the moment is still the frame nearest the recorded spot.
  const g29 = { ...GOAL, x: -62, y: -10 }, b = shotOf(g29);
  assert.ok(b.S.lane, 'no lane at 29 feet');
  assert.equal(b.S.j, nearestTo(b.P2, g29), 'the release rule ran inside 30 feet');
  // Exactly 20 feet is not beyond it.
  assert.equal(shotOf({ ...GOAL, x: -73, y: -12 }).S.lane, false, `20 ft: ${shotOf({ ...GOAL, x: -73, y: -12 }).S.ft}`);
  assert.equal(trackShot(trackPlan(FX.frames, GOAL), G.teams.home.id).lane, true);
});

test('the lane follows the puck, faint, while it is in the scoring team\'s end beyond 30 feet; at the shot it freezes', () => {
  const S = trackShot(P, G.teams.home.id), tags = trackTags(P, trackWindow(P, EV));
  const col = { 15: '#c8102e', 26: '#111111' }, opt = { G, AX, AY, col, tags, shot: S };
  const mk = j => trackMarkup(P, j, P.frames[j].timeStamp, opt);
  const live = m => (m.match(/class="tlane live" points="([^"]+)"/) || [])[1];
  const held = m => (m.match(/class="tlane" points="([^"]+)"/) || [])[1];
  const pk = j => { const f = trackFeet(P.frames[j].onIce['1']); return { x: P.turn * f.x, y: P.turn * f.y }; };
  // LAK attacks -x: in its end is x < -25; beyond 20 feet of the net at -89.
  const inBand = j => { const p = pk(j); return p.x < -25 && Math.round(Math.hypot(89 + p.x, p.y)) > 20; };
  let sawLive = 0, sawOut = 0;
  for (let j = 0; j < S.j; j++) {
    const m = mk(j);
    assert.equal(held(m), undefined, `frame ${j}: the held lane before the shot`);
    if (inBand(j)) {
      sawLive++;
      const apex = live(m).split(' ')[0].split(',').map(Number), p = pk(j);
      assert.deepEqual(apex, [+AX(p.x).toFixed(2), +AY(p.y).toFixed(2)], `frame ${j}: the live lane is not at the puck`);
    } else { sawOut++; assert.equal(live(m), undefined, `frame ${j}: a lane with the puck outside the end or inside 30 feet`); }
  }
  assert.ok(sawLive > 0 && sawOut > 0, 'the fixture does not exercise both sides of the band');
  const at = mk(S.j), late = mk(P.k);
  assert.ok(held(at), 'no held lane at the shot');
  assert.equal(held(late), held(at), 'the held lane changed shape on the way to the goal line');
  assert.equal(live(at), undefined, 'two lanes at once');
  assert.ok(at.indexOf('tlane') < at.indexOf('<circle'), 'the lane is drawn over the players');
  assert.ok(trackStops(P, tags, S.at).includes(S.at), 'the shot is not a stop');
});

test('the note under the rink reads the triangle that is drawn, and is empty when none is', () => {
  const S = trackShot(P, G.teams.home.id), home = G.teams.home.id, tt = j => P.frames[j].timeStamp;
  assert.equal(trackLaneLine(P, S.j, tt(S.j), S, home), 'Anyone inside the shaded triangle was between the shot and the net.');
  let live = 0, none = 0;
  for (let j = 0; j < S.j; j++) {
    const line = trackLaneLine(P, j, tt(j), S, home), drawn = trackMarkup(P, j, tt(j), { G, AX: x => x, AY: y => y, col: {}, tags: [], shot: S });
    assert.equal(!!line, /tlane/.test(drawn), `frame ${j}: the line and the drawing disagree`);
    if (line) { live++; assert.match(line, /light triangle/); } else none++;
  }
  assert.ok(live > 0 && none > 0, 'the fixture does not exercise both a drawn and an undrawn lane');
});

test('the line says what the faint and the held triangle are, in plain words, naming the end', () => {
  const S = trackShot(P, G.teams.home.id);
  const say = trackLaneSay(P, G, S);
  assert.match(say, /light triangle runs from the puck to the posts while the puck is in the WSH end, more than 20 feet from the net/);
  assert.match(say, /At the shot it darkens and holds/);
  assert.doesNotMatch(say, /attacking zone|blue line/i, 'hockey speak');
  const close = trackShot(trackPlan(FX.frames, { ...GOAL, x: -75, y: -5 }), G.teams.home.id);
  assert.doesNotMatch(trackLaneSay(trackPlan(FX.frames, { ...GOAL, x: -75, y: -5 }), G, close), /darkens/, 'a close goal has no held lane to describe');
});

/* THE ASSISTS on an assisted goal: #7 Toews, TBL at COL, 2026-10-23, from #88 Necas and #29 MacKinnon.
   Read frame by frame by a separate script (nearest skater within 4 ft): #29 carries the puck 5.6–7.6 s
   into the file, #88 has it 8.2–9.0 s, Toews shoots at 9.8 s. */
const TX = JSON.parse(readFileSync(new URL('./fixtures/tracked-2026020167-ev67.json', import.meta.url), 'utf8'));
const TG = { game: TX.game, teams: TX.teams, roster: TX.roster, events: TX.events };
const TGOAL = TX.events.find(e => e.type === 'goal');
const TP = trackPlan(TX.frames, TGOAL);
const secs = a => (a.at - TP.frames[0].timeStamp) / 10;

test('⭐ the assists come from the league\'s record; the tracking says when the puck left each', () => {
  const A = trackAssists(TP);
  assert.deepEqual(A.map(a => [a.rank, a.pid]), [[2, TGOAL.a2], [1, TGOAL.a1]], 'not the league\'s two assists, secondary first');
  const [a2, a1] = A;
  assert.ok(secs(a2) >= 7.4 && secs(a2) <= 7.9, `the secondary assist at ${secs(a2)} s, not the end of #29's carry`);
  assert.ok(secs(a1) >= 8.9 && secs(a1) <= 9.3, `the primary assist at ${secs(a1)} s, not the end of #88's carry`);
  assert.ok(!a1.shot && !a2.shot, 'a pass called a shot');
  // At each moment he is the nearest player to the puck, and within reach.
  for (const a of A) {
    const o = TP.frames[a.j].onIce, pk = trackFeet(o['1']), me = Object.values(o).find(v => v.playerId === a.pid);
    const d = q => Math.hypot(trackFeet(q).x - pk.x, trackFeet(q).y - pk.y);
    assert.ok(d(me) <= TRACK_REACH_FT, `#${me.sweaterNumber} is ${d(me).toFixed(1)} ft from the puck`);
    assert.ok(Object.entries(o).every(([k, v]) => k === '1' || v.playerId == null || d(v) >= d(me)), 'someone else was nearer');
  }
  assert.equal(trackAssistSay(a1, TG), '#88 Necas passes · the league credits him with the primary assist');
  assert.equal(trackAssistSay(a2, TG), '#29 MacKinnon passes · the league credits him with the secondary assist');
});

test('the assists are Prev/Next stops, between the first frame and the shot', () => {
  const A = trackAssists(TP), S = trackShot(TP, TG.teams.home.id);
  const stops = trackStops(TP, [], S && S.at, A);
  for (const a of A) assert.ok(stops.includes(a.at), `no stop at the ${a.rank === 1 ? 'primary' : 'secondary'} assist`);
  assert.ok(A.every(a => a.at < S.at), 'an assist after the shot');
});

test('an assist that is the shot itself is the shot\'s stop, not a second one', () => {
  const home = TG.teams.home.id;
  const tip = trackPlan(TX.frames, { ...TGOAL, st: 'tip-in' });
  const S = trackShot(tip, home);
  const A = trackAssists(tip, home), a1 = A.find(a => a.rank === 1);
  assert.ok(S, 'the tip has no recorded release');
  assert.ok(Math.abs(a1.at - S.at) > TRACK_SAME_SHOT,
    `the primary touch is ${Math.abs(a1.at - S.at)} tenths from the release`);
  assert.equal(a1.shot, false, 'a touch well before the release is not the shot');
  assert.match(trackAssistSay(a1, TG), /^#88 Necas passes · the league credits him with the primary assist$/);
  assert.ok(trackStops(tip, [], S.at, A).includes(a1.at), 'a pass before the shot lost its stop');
  // Move that frame onto the release. Copy it so the fixture's own timestamps stay put.
  const frames = tip.frames.map((f, i) => i === a1.j ? { ...f, timeStamp: S.at - 2 } : f);
  const close = trackPlan(frames, { ...TGOAL, st: 'tip-in' });
  const C = trackAssists(close, home), c1 = C.find(a => a.rank === 1);
  const shotAt = trackShot(close, home).at;
  assert.ok(Math.abs(c1.at - shotAt) <= TRACK_SAME_SHOT, 'the moved touch is not inside the release window');
  assert.equal(c1.shot, true, 'a tip within three tenths of the release is not his shot');
  assert.match(trackAssistSay(c1, TG), /^#88 Necas shoots · the league credits him with the primary assist$/);
  assert.ok(!trackStops(close, [], shotAt, C).includes(c1.at), 'the shot and the assist are two stops');
});

test('an unassisted goal has no assists, and a recorded assist the tracking never sees is left out', () => {
  assert.equal(GOAL.a1, undefined);
  assert.deepEqual(trackAssists(P), []);
  const ghost = trackPlan(TX.frames, { ...TGOAL, a1: 1, a2: TGOAL.a2 });
  assert.deepEqual(trackAssists(ghost), [], 'a primary assist who never has the puck still got a moment');
  assert.equal(trackHolders(TP).length, TP.k + 1);
});

/* A clip in league feet, already oriented (turn 1, home attacking +x). */
const dot = (x, y, id, team) => ({ x: (x + 100) * 12, y: (42.5 - y) * 12, playerId: id || '', teamId: team ?? '', sweaterNumber: '' });
const clip = rows => {
  const frames = rows.map((row, i) => {
    const onIce = { '1': dot(row.puck, row.py || 0) };
    for (const s of row.sk) onIce[s.id] = dot(s.x, 0, s.id, s.team);
    return { timeStamp: i * 10, onIce };
  });
  return { e: { own: 1, x: 65, y: 0, per: 1, actor: 11 }, frames, k: frames.length - 1, turn: 1 };
};
const ROSTER = { 11: { pos: 'C' }, 12: { pos: 'D' }, 31: { pos: 'G' }, 21: { pos: 'C' } };
const sk = (x, id, team = 1) => ({ x, id, team });

test('the puck clears the blue line before the attacking skaters', () => {
  const C = clip([
    { puck: 10, sk: [sk(4, 11), sk(0, 12), sk(-80, 31), sk(40, 21, 2)] },
    { puck: 22, sk: [sk(8, 11), sk(2, 12), sk(-80, 31), sk(40, 21, 2)] },
    { puck: 30, sk: [sk(14, 11), sk(6, 12), sk(-80, 31), sk(50, 21, 2)] },
    { puck: 80, sk: [sk(40, 11), sk(20, 12), sk(-80, 31), sk(60, 21, 2)] },
    { puck: 92, sk: [sk(70, 11), sk(40, 12), sk(-80, 31), sk(70, 21, 2)] },
  ]);
  const en = trackEntry(C, 1, ROSTER, 'LAK');
  assert.equal(en.j, 2, 'not the frame the puck\'s dot clears the line');
  assert.equal(en.from, 1, 'the approach does not start in the band before the line');
  assert.deepEqual(en.ids, [11, 12]);
  assert.equal(en.say, 'Onside: the puck crossed the blue line before any LAK player did.');
  assert.doesNotMatch(en.say, /too close/i);
  // A centre just past the line has not cleared the skater dot.
  const on = clip([
    { puck: 24, sk: [sk(25.4, 11)] },
    { puck: 28, sk: [sk(25.4, 11)] },
  ]);
  assert.equal(trackEntry(on, 1, ROSTER, 'LAK').j, 1);
});

test('a clip that does not show the entry is left blank', () => {
  const already = clip([
    { puck: 40, sk: [sk(20, 11)] },
    { puck: 70, sk: [sk(40, 11)] },
    { puck: 92, sk: [sk(60, 11)] },
  ]);
  assert.equal(trackEntry(already, 1, ROSTER, 'LAK'), null, 'the puck was already in the zone');
  const ahead = clip([
    { puck: 10, sk: [sk(40, 11), sk(0, 12)] },
    { puck: 30, sk: [sk(40, 11), sk(4, 12)] },
  ]);
  assert.equal(trackEntry(ahead, 1, ROSTER, 'LAK'), null, 'an attacking skater had already cleared the line');
  const real = trackEntry(P, G.teams.home.id, G.roster, 'LAK');
  const late = { ...P, frames: P.frames.slice(real.j), k: P.k - real.j };
  assert.equal(trackEntry(late, G.teams.home.id, G.roster, 'LAK'), null, 'the clip starts with the puck already across');
});

test('the real clip shows LAK entering onside, and the checks are only on that frame', () => {
  const en = trackEntry(P, G.teams.home.id, G.roster, 'LAK');
  assert.ok(en, 'the Panarin clip shows no entry');
  assert.equal(en.say, trackEntrySay('LAK'));
  assert.ok(en.ids.includes(GOAL.actor), 'the scorer is not marked');
  const gk = Object.values(P.frames[en.j].onIce).find(o => G.roster[o.playerId] && G.roster[o.playerId].pos === 'G' && Number(o.teamId) === Number(GOAL.own));
  assert.ok(gk && !en.ids.includes(Number(gk.playerId)), 'the goaltender is marked');
  const opt = { G, AX, AY, col: {}, tags: [], entry: en, blue: { x: 75, y1: 1, y2: 84 } };
  const at = trackMarkup(P, en.j, en.at, opt);
  assert.equal([...at.matchAll(/class="tck"/g)].length, en.ids.length);
  assert.match(at, /class="onside"/);
  assert.doesNotMatch(trackMarkup(P, en.from, P.frames[en.from].timeStamp, opt), /class="tck"/);
  assert.match(trackMarkup(P, en.from, P.frames[en.from].timeStamp, opt), /class="onside approach"/);
  assert.doesNotMatch(trackMarkup(P, en.j, en.at, { G, AX, AY, col: {}, tags: [] }), /class="tck"|class="onside/);
});

test('trackSecs matches the goal\'s own s at the goal line, and counts back with the clock', () => {
  assert.equal(trackSecs(P, P.k), GOAL.s, 'at the goal line the box clock is the goal\'s s');
  assert.equal(trackRem(P, P.k), 2);
  assert.equal(trackRem(P, 0), 11);
  assert.equal(trackSecs(P, 0), GOAL.s - 9, 'nine seconds earlier on both clocks');
});

test('⭐ a tracked clip drops the box and the PP once the minor has expired between events', () => {
  /* Couturier, PHI at WSH 2026-10-28, ev482: Hutson\'s holding at 2:13 of P2 expires at
     4:13; the clip opens at 4:27 with no event in between, so the hold frame still
     carries the PP sit. The box and badge must follow the clip clock. */
  const HOME = 15, AWAY = 4; // WSH home, PHI away — ids only matter as a pair
  const ctx = { homeId: HOME, awayId: AWAY, homeAb: 'WSH', awayAb: 'PHI' };
  const penAt = 1200 + 2 * 60 + 13;   // 2:13 of P2
  const clipAfter = 1200 + 4 * 60 + 27; // 4:27 — after expiry
  const clipInside = 1200 + 4 * 60;     // 4:00 — still inside the minor
  const events = [
    { type: 'penalty', s: penAt, per: 2, own: HOME, actor: 91, min: 2, sev: 'MIN', pen: 'holding', sit: '1551' },
    { type: 'takeaway', s: 1200 + 3 * 60 + 52, per: 2, own: AWAY, sit: '1541' }, // PHI PP
    { type: 'goal', s: 1200 + 4 * 60 + 36, per: 2, own: AWAY, sit: '1551', rem: '15:24' },
  ];
  const box = stints(events, ctx);
  const holdSit = '1541';
  assert.equal(occupants(box, clipInside, HOME).length, 1, 'fixture: still in the box at 4:00');
  assert.equal(occupants(box, clipAfter, HOME).length, 0, 'fixture: out by 4:27');
  assert.equal(trackClipSit(holdSit, clipInside, box, ctx), holdSit, 'PP stays while the minor is live');
  assert.equal(trackClipSit(holdSit, clipAfter, box, ctx), null, 'PP drops once the box is empty');
  // Never invent a PP the hold frame did not record.
  assert.equal(trackClipSit('1551', clipInside, box, ctx), '1551');
  assert.equal(trackClipSit('1560', clipAfter, box, ctx), '1560', 'an empty-net sit is left alone');
});
