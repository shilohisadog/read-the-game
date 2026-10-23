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
  trackTags, trackStops, trackFrameAt, trackClock, trackFeet, trackGoalAhead, trackGoals,
  trackHoldFrame, trackMarkup, trackPlace, TRACK_TAG_TENTHS, TRACK_TAG_EDGE, trackShot, trackLaneSay, TRACK_LANE_FT, TRACK_CARRY_FT,
} from '../src/lib/tracked.js';
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
  assert.equal(trackStrength({ sit: '1551', own: home }, G), '');
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

test('a goal from 30 feet or closer has a shot stop but no lane: the frame where the puck is at the recorded spot', () => {
  assert.equal(TRACK_LANE_FT, 30);
  const g = { ...GOAL, x: -62, y: -10 };                                  // 29 ft
  const near = trackPlan(FX.frames, g), S = trackShot(near, G.teams.home.id);
  assert.ok(S && S.lane === false, 'no shot, or a lane, on a 29-foot goal');
  const off = t => { const f = trackFeet(near.frames[t].onIce['1']); return Math.hypot(near.turn * f.x - g.x, near.turn * f.y - g.y); };
  for (let t = 0; t <= near.k; t++) assert.ok(off(S.j) <= off(t), `frame ${t} is nearer the recorded spot than the stop`);
  const tags = trackTags(near, trackWindow(near, EV));
  assert.ok(trackStops(near, tags, S.at).includes(S.at), 'the shot is not a stop');
  const m = trackMarkup(near, near.k, near.frames[near.k].timeStamp, { G, AX, AY, col: {}, tags, shot: S });
  assert.doesNotMatch(m, /tlane/, 'a lane on a close goal');
  const at30 = trackShot(trackPlan(FX.frames, { ...GOAL, x: -65, y: -18 }), G.teams.home.id);   // 30 ft
  assert.equal(at30.lane, false, 'beyond 30 feet means beyond it');
  assert.equal(trackShot(trackPlan(FX.frames, GOAL), G.teams.home.id).lane, true);
});

test('the lane follows the puck, faint, while it is in the scoring team\'s end beyond 30 feet; at the shot it freezes', () => {
  const S = trackShot(P, G.teams.home.id), tags = trackTags(P, trackWindow(P, EV));
  const col = { 15: '#c8102e', 26: '#111111' }, opt = { G, AX, AY, col, tags, shot: S };
  const mk = j => trackMarkup(P, j, P.frames[j].timeStamp, opt);
  const live = m => (m.match(/class="tlane live" points="([^"]+)"/) || [])[1];
  const held = m => (m.match(/class="tlane" points="([^"]+)"/) || [])[1];
  const pk = j => { const f = trackFeet(P.frames[j].onIce['1']); return { x: P.turn * f.x, y: P.turn * f.y }; };
  // LAK attacks -x: in its end is x < -25; beyond 30 feet of the net at -89.
  const inBand = j => { const p = pk(j); return p.x < -25 && Math.round(Math.hypot(89 + p.x, p.y)) > 30; };
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

test('the line says what the faint and the held triangle are, in plain words, naming the end', () => {
  const S = trackShot(P, G.teams.home.id);
  const say = trackLaneSay(P, G, S);
  assert.match(say, /light triangle runs from the puck to the posts while the puck is in the WSH end, more than 30 feet from the net/);
  assert.match(say, /At the shot it darkens and holds/);
  assert.doesNotMatch(say, /attacking zone|blue line/i, 'hockey speak');
  const close = trackShot(trackPlan(FX.frames, { ...GOAL, x: -62, y: -10 }), G.teams.home.id);
  assert.doesNotMatch(trackLaneSay(trackPlan(FX.frames, { ...GOAL, x: -62, y: -10 }), G, close), /darkens/, 'a close goal has no held lane to describe');
});
