/**
 * THE TRACKED GOAL — the league's tracking of the seconds before a goal, laid over
 * the replay's rink. This file is the arithmetic and the words; `app.js` fetches,
 * times and draws.
 *
 * The league publishes, for most goals, a file of every player's and the puck's
 * position ten times a second (`pptReplayUrl`, stored at `track/<game>/ev<id>.json`,
 * indexed per game by `track/<game>/goals.json`). Nothing here is invented: the
 * positions are the league's, the events named are the league's recorded events,
 * and where the league recorded nothing in those seconds the words say so.
 *
 * Coordinates: league feet = (x/12 - 100, 42.5 - y/12) — the file's y runs
 * opposite to the play-by-play's. `turn` is our extract's per-period rotation,
 * read off the goal's own sign; the replay's AX/AY then place a point on screen.
 */
import { inkOn, readableInk } from './teams.js';
import { ESC } from './esc.js';
import { NET_X, GOAL_POST_Y, attackDirection, distanceToNet } from './rink.js';

/** Replay speeds for the tracking: [factor, button label, words for the line]. */
export const TRACK_SPEEDS = [[0.25, '¼', 'at a quarter of real speed'],
  [0.5, '½', 'at half speed'], [1, 'Real time', 'in real time']];
export const TRACK_SPEED = 0.25;           // Kevin: a novice needs time to take it in
/** Start loading a goal's file this far ahead, in game seconds. */
export const TRACK_LOOKAHEAD_S = 40;
/** Goals mode opens each goal on its first tracked frame, held still this long. */
export const TRACK_STILL_MS = 1500;
/** An event's label stays up this much GAME time (tenths): Kevin, half of 1.5 s. */
export const TRACK_TAG_TENTHS = 8;
/** Half the longest label's width, in rink feet: nearer the boards, it runs away from them. */
export const TRACK_TAG_EDGE = 16;
/* Goals from beyond this many feet show the shot's lane. OUR choice, from the measure: someone stood in the
   path on about half the goals from 30 to 45 feet and most beyond, against 4% to 20% closer in (2026-10-22). */
export const TRACK_LANE_FT = 30;
/* A shot leaves the stick: the puck goes from carrying speed to faster than anyone skates (~24 mph, 3.5 ft
   a tenth of a second), or turns sharply while fast (a tip). Both numbers OUR choice; over the 323 goals
   beyond 30 feet, the release nearest the recorded spot is within 3 feet of it on 79%, 6 feet on 90%. */
export const TRACK_CARRY_FT = 3.5, TRACK_TURN_DEG = 45;
/** The goal line and the blue lines, feet from centre ice. */
const GOAL_LINE = 89, BLUE = 25;

/** Each recorded event's label on the ice, in plain English. */
export const TRACK_WORDS = { 'shot-on-goal': 'Shot on goal', 'missed-shot': 'Shot missed the net',
  'blocked-shot': 'Shot blocked', hit: 'Hit', giveaway: 'Gave the puck away',
  takeaway: 'Took the puck away', faceoff: 'Face-off' };

/** A tracked point in league feet. */
export const trackFeet = o => ({ x: o.x / 12 - 100, y: 42.5 - o.y / 12 });

/** The goals.json row for this goal: period, clock and scorer. */
export function trackRow(rows, e) {
  return (rows || []).find(r => r.per === e.per && r.clock === e.clock
    && (r.scorer == null || r.scorer === e.actor)) || null;
}

/**
 * A goal's plan: its frames, the frame `k` where the puck crosses the goal line,
 * the seconds of build-up `before`, and `turn`. Null when the file cannot be read
 * as this goal (no crossing, or no location to orient it by).
 */
export function trackPlan(frames, e) {
  if (!Array.isArray(frames) || !frames.length || e.x == null) return null;
  let k = -1;
  for (let j = 1; j < frames.length; j++) {
    const a = frames[j - 1].onIce && frames[j - 1].onIce['1'], b = frames[j].onIce && frames[j].onIce['1'];
    if (a && b && Math.abs(trackFeet(b).x) > GOAL_LINE && Math.abs(trackFeet(a).x) <= GOAL_LINE
        && Math.abs(trackFeet(b).y) <= 3.5) { k = j; break; }
  }
  if (k < 0) return null;
  const turn = Math.sign(e.x) === Math.sign(trackFeet(frames[k].onIce['1']).x) ? 1 : -1;
  return { e, frames, k, before: (frames[k].timeStamp - frames[0].timeStamp) / 10, turn };
}

/** Indexes of the goals in the timeline; shootout attempts are not goals in play. */
export const trackGoals = EV => EV.reduce((a, e, k) => (e.type === 'goal' && e.pt !== 'SO' ? (a.push(k), a) : a), []);

/** The goal ahead of frame `i` in the same stretch of play (no face-off between), or -1. */
export function trackGoalAhead(EV, i) {
  if (i < 0) return -1;
  for (let g = i + 1; g < EV.length; g++) {
    if (EV[g].per !== EV[i].per || EV[g].s - EV[i].s > TRACK_LOOKAHEAD_S) return -1;
    if (EV[g].type === 'goal') return g;
    if (EV[g].type === 'faceoff' || EV[g].type === 'stoppage') return -1;
  }
  return -1;
}

/** The last frame before goal `g`'s tracked seconds, no earlier than `floor`. */
export function trackHoldFrame(EV, g, P, floor = 0) {
  let j = g - 1;
  while (j > floor && EV[j].s >= EV[g].s - P.before) j--;
  return Math.max(j, floor);
}

/** The league's recorded events in the tracked seconds before the goal, oldest first. */
export function trackWindow(P, EV) {
  const gi = EV.indexOf(P.e);
  return EV.slice(0, gi < 0 ? 0 : gi)
    .filter(e => e.per === P.e.per && e.s >= P.e.s - P.before && TRACK_WORDS[e.type]);
}

/* Where an event happened, in words: behind a net, in a team's end, or the middle of
   the ice. Our extract has the home team defending -x in every period. */
export function trackPlace(e, G) {
  if (e.x == null) return '';
  const end = e.x < 0 ? G.teams.home.ab : G.teams.away.ab;
  if (Math.abs(e.x) > GOAL_LINE) return ` behind the ${end} net`;
  if (Math.abs(e.x) > BLUE) return ` in the ${end} end`;
  return ' in the middle of the ice';
}

const abOf = (G, tid) => (tid === G.teams.home.id ? G.teams.home.ab : G.teams.away.ab);
const named = (G, id) => { const p = G.roster[id]; return p ? `#${p.n} ${p.nm} (${abOf(G, p.tid)})` : null; };

/** " Recorded by the league in these 9 seconds: a hit by #14 Laferriere (LAK) behind the WSH net." */
export function trackRecorded(P, G, win) {
  const said = win.map(e => {
    const a = named(G, e.actor), at = trackPlace(e, G);
    if (!a) return null;
    switch (e.type) {
      case 'hit': return `a hit by ${a}${at}`;
      case 'giveaway': return `${a} gave the puck away${at}`;
      case 'takeaway': return `${a} took the puck away${at}`;
      case 'shot-on-goal': return `a shot by ${a} that the goaltender stopped`;
      case 'missed-shot': return `a shot by ${a} that missed the net`;
      case 'blocked-shot': { const b = named(G, e.blk); return b ? `a shot by ${a}, blocked by ${b}` : `a shot by ${a} that was blocked`; }
      case 'faceoff': return `a face-off${at}, won by ${a}`;
      default: return null;
    }
  }).filter(Boolean);
  const secs = Math.round(P.before);
  if (!said.length) return ` The league recorded nothing else in these ${secs} seconds: watch the puck.`;
  return ` Recorded by the league in these ${secs} seconds: ${said.join('; then ')}.`;
}

/** " NYR has a power play: 5 skaters to TBL's 4." from the goal's own situation code, or "". */
export function trackStrength(e, G) {
  const [ag, as, hs, hg] = String(e.sit || '').split('').map(Number);
  if (![ag, as, hs, hg].every(Number.isFinite)) return '';
  const home = e.own === G.teams.home.id, us = abOf(G, e.own), them = abOf(G, home ? G.teams.away.id : G.teams.home.id);
  const mine = home ? hs : as, theirs = home ? as : hs, theirG = home ? ag : hg;
  if (theirG === 0) return ` ${them} has pulled its goaltender: the net is empty.`;
  if (mine > theirs) return ` ${us} has a power play: ${mine} skaters to ${them}’s ${theirs}.`;
  if (mine < theirs) return ` ${us} is short-handed: ${mine} skaters to ${them}’s ${theirs}.`;
  return '';
}

/** The name line: "Tracked · goal by #9 Kempe (LAK)". */
export function trackWho(P, G) {
  const p = G.roster[P.e.actor] || {};
  return `Tracked · goal by #${p.n || ''} ${p.nm || ''} (${abOf(G, P.e.own)})`;
}
/** The line under the rink while the tracking plays. */
export function trackSay(P, G, win, speed) {
  const w = (TRACK_SPEEDS.find(x => x[0] === speed) || TRACK_SPEEDS[0])[2];
  return `The last ${Math.round(P.before)} seconds before the goal: every player and the puck as the league tracked them, `
    + `10 times a second, ${w}.${trackStrength(P.e, G)}${trackRecorded(P, G, win)}`;
}
/** The line while the first frame is held still. */
export const trackFirst = P => `${Math.round(P.before)} seconds before the goal. The black dot is the puck.`;

/** Each recorded event's moment in the file's time (tenths). */
export function trackTags(P, win) {
  const tGoal = P.frames[P.k].timeStamp;
  return win.map(e => ({ e, at: tGoal - (P.e.s - e.s) * 10 }));
}
/** The stops Prev/Next move between: the first frame, each recorded event, the shot (`shotAt`), the goal line. */
export function trackStops(P, tags, shotAt = null) {
  const t0 = P.frames[0].timeStamp, tGoal = P.frames[P.k].timeStamp;
  const mid = [...tags.map(t => t.at), shotAt].filter(v => v != null && v > t0 && v < tGoal);
  return [...new Set([t0, ...mid, tGoal])].sort((a, b) => a - b);
}

/**
 * THE SHOT'S LANE, for a goal from beyond TRACK_LANE_FT: the triangle from the puck at the moment
 * of the shot to the two posts. The moment is the release (see TRACK_CARRY_FT) nearest the spot the
 * league recorded for the shot; the nearest frame when the tracking shows no release. The distance
 * is the color line's. Null when there is no lane.
 *   {j, at, apex, posts, ft} — `apex` and `posts` in league feet.
 */
export function trackShot(P, homeId) {
  const e = P && P.e;
  if (!e || e.x == null || e.y == null) return null;
  const dir = attackDirection(e.own, homeId), ft = Math.round(distanceToNet(e.x, e.y, dir));
  if (!(ft > TRACK_LANE_FT)) return null;
  const at = t => { const pk = P.frames[t] && P.frames[t].onIce && P.frames[t].onIce['1'];
    if (!pk) return null; const f = trackFeet(pk); return { x: P.turn * f.x, y: P.turn * f.y }; };
  const pts = Array.from({ length: P.k + 1 }, (_, t) => at(t));
  const off = t => (pts[t] ? Math.hypot(pts[t].x - e.x, pts[t].y - e.y) : Infinity);
  const step = t => (pts[t] && pts[t + 1] ? { dx: pts[t + 1].x - pts[t].x, dy: pts[t + 1].y - pts[t].y } : null);
  const len = s => Math.hypot(s.dx, s.dy);
  const released = t => { const a = step(t - 1), b = step(t);
    if (!a || !b || len(b) <= TRACK_CARRY_FT) return false;
    if (len(a) <= TRACK_CARRY_FT) return true;
    return Math.acos(Math.max(-1, Math.min(1, (a.dx * b.dx + a.dy * b.dy) / (len(a) * len(b))))) * 180 / Math.PI > TRACK_TURN_DEG; };
  let j = -1;
  for (let t = 1; t < P.k; t++) if (released(t) && (j < 0 || off(t) < off(j))) j = t;
  if (j < 0) for (let t = 0; t <= P.k; t++) if (pts[t] && (j < 0 || off(t) < off(j))) j = t;
  if (j < 0) return null;
  const apex = pts[j];
  return { j, at: P.frames[j].timeStamp, apex, ft,
    posts: [{ x: NET_X * dir, y: -GOAL_POST_Y }, { x: NET_X * dir, y: GOAL_POST_Y }] };
}
/** The line's words for the lane, said once per goal that has one. */
export const TRACK_LANE_SAY = ' The shaded triangle runs from the puck to the posts at the moment of the shot: '
  + 'anyone inside it was between the shot and the net.';
/** The frame shown at file time `tt` (tenths), never past the goal line. */
export function trackFrameAt(P, tt) {
  let j = 0;
  while (j < P.k && P.frames[j + 1].timeStamp <= tt) j++;
  return j;
}
/** The scoreboard clock at frame `j`, counted back from the goal's own clock. */
export function trackClock(P, j) {
  const [m, s] = String(P.e.rem || '0:0').split(':').map(Number);
  const r = Math.max(0, Math.floor(m * 60 + s + (P.frames[P.k].timeStamp - P.frames[j].timeStamp) / 10));
  return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
}

/**
 * Frame `j` as SVG: every tracked player (the home side in its colour, the visitor
 * in white with a coloured rim, as road teams dress), the scorer's name, the puck,
 * and the label of any recorded event within its moment at `tt`. `col` maps a team
 * id to its colour; AX/AY are the replay's own placement.
 */
export function trackMarkup(P, j, tt, { G, AX, AY, col, tags, shot = null }) {
  const per = P.e.per, at = o => { const p = trackFeet(o); return { x: AX(P.turn * p.x, per), y: AY(P.turn * p.y, per) }; };
  const stars = new Set([P.e.actor, P.e.a1, P.e.a2].filter(Boolean).map(Number));
  const F = P.frames[j].onIce, out = [];
  // The lane, from the shot to the goal line, fixed where the shot was taken; under the players.
  if (shot && tt >= shot.at)
    out.push(`<polygon class="tlane" points="${[shot.apex, ...shot.posts].map(q => `${AX(q.x, per).toFixed(2)},${AY(q.y, per).toFixed(2)}`).join(' ')}"/>`);
  for (const o of Object.values(F)) {
    if (!o.playerId) continue;
    const s = at(o), r = G.roster[o.playerId] || {}, c = col[o.teamId] || '#5b6d7a';
    const gk = r.pos === 'G', star = stars.has(Number(o.playerId)), away = Number(o.teamId) === Number(G.teams.away.id);
    const fill = away ? '#fff' : c, rim = away ? c : (gk ? '#0f1a23' : '#fff'), ink = away ? readableInk(c) : inkOn(c);
    out.push(`<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${gk ? 1.7 : star ? 1.6 : 1.35}" fill="${fill}" stroke="${rim}" stroke-width="${away ? (star ? .7 : .45) : (star ? .55 : .25)}"/>`
      + `<text class="tn" x="${s.x.toFixed(2)}" y="${s.y.toFixed(2)}" fill="${ink}">${ESC(o.sweaterNumber)}</text>`);
    if (Number(o.playerId) === Number(P.e.actor))
      out.push(`<text class="tsc" x="${s.x.toFixed(2)}" y="${(s.y - 2.6).toFixed(2)}" fill="${c}">${ESC(r.nm || '')}</text>`);
  }
  const pk = F['1'];
  if (pk) {
    const s = at(pk);
    out.push(`<circle class="tpk" cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r=".6"/>`);
    for (const t of tags) {
      if (!(tt >= t.at && tt < t.at + TRACK_TAG_TENTHS)) continue;
      // At the spot the league recorded (the puck when it recorded none), running away from the nearest boards.
      const e = t.e, q = e.x != null ? { x: AX(e.x, per), y: AY(e.y, per) } : s;
      const anc = q.x > 200 - TRACK_TAG_EDGE ? 'end' : q.x < TRACK_TAG_EDGE ? 'start' : 'middle';
      const lx = q.x + (anc === 'end' ? -2.2 : anc === 'start' ? 2.2 : 0);
      const ly = anc !== 'middle' ? q.y + 0.9 : q.y > 78 ? q.y - 2.6 : q.y + 4;
      out.push(`<text class="tag" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anc}">${ESC(TRACK_WORDS[e.type] || '')}</text>`);
    }
  }
  return out.join('');
}
