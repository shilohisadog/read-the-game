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
import { standing, EMPTY_NET, POWER_PLAY, PENALTY_SHOT } from './strength.js';
import { NET_X, GOAL_POST_Y, BLUE_LINE_X, attackDirection, distanceToNet } from './rink.js';

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
/** A tip and the shot are the same touch when they fall within this many tenths. */
export const TRACK_SAME_SHOT = 3;
/** Half the longest label's width, in rink feet: nearer the boards, it runs away from them. */
export const TRACK_TAG_EDGE = 16;
/* Beyond this many feet from the net the lane is drawn: light while it follows the puck, held from the shot
   on. OUR choice and a visual one (Kevin, 2026-10-26): closer in the triangle shrinks to a stub over the crease. */
export const TRACK_LANE_FT = 20;
/* Beyond this the moment of the shot is the release (TRACK_CARRY_FT); closer in it is the frame nearest the
   recorded spot, because close goals often go in too slowly for a release to show. Measured, 2026-10-23. */
export const TRACK_RELEASE_FT = 30;
/* A shot leaves the stick: the puck goes from carrying speed to faster than anyone skates (~24 mph, 3.5 ft
   a tenth of a second), or turns sharply while fast (a tip). Both numbers OUR choice; over the 323 goals
   beyond 30 feet, the release nearest the recorded spot is within 3 feet of it on 79%, 6 feet on 90%. */
export const TRACK_CARRY_FT = 3.5, TRACK_TURN_DEG = 45;
/* Within this many feet of a skater the puck is his: the tracking places the body, and a stick reaches past it.
   OUR choice. Over 367 goals (60 games, 2026-10-27) it finds the primary assist with the puck on 319 of 344
   assisted goals, and the next teammate to hold it is one the league did not credit on 11 of those 319. */
export const TRACK_REACH_FT = 5.5;
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

/** " WSH has a power play: 5 skaters to LAK’s 4." or "" at even strength.
 *  Read by standing(), the same decoder as the scoreboard, so the club that
 *  pulled its goalie is named for that — 6-on-5 at an empty net is not a power play. */
export function trackStrength(e, G) {
  const home = G.teams.home, away = G.teams.away;
  const s = standing(e && e.sit, {
    homeId: home.id, awayId: away.id, homeAb: home.ab, awayAb: away.ab,
  });
  if (!s || s.kind === PENALTY_SHOT) return '';
  if (s.kind === EMPTY_NET) return ` ${s.ab} has pulled its goaltender: the net is empty.`;
  if (s.kind !== POWER_PLAY) return '';
  const us = abOf(G, e.own), them = abOf(G, e.own === home.id ? away.id : home.id);
  if (s.id === e.own) return ` ${us} has a power play: ${s.own} skaters to ${them}’s ${s.opp}.`;
  return ` ${us} is short-handed: ${s.opp} skaters to ${them}’s ${s.own}.`;
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
/** The stops Prev/Next move between: the first frame, each recorded event, the shot (`shotAt`), each assist, the goal line. */
export function trackStops(P, tags, shotAt = null, assists = []) {
  const t0 = P.frames[0].timeStamp, tGoal = P.frames[P.k].timeStamp;
  // An assist that is the shot itself (a tip at the release, a rebound) is the shot's stop.
  const passes = assists.filter(a => !(a.shot && shotAt != null && Math.abs(a.at - shotAt) <= TRACK_SAME_SHOT)).map(a => a.at);
  const mid = [...tags.map(t => t.at), shotAt, ...passes].filter(v => v != null && v > t0 && v < tGoal);
  return [...new Set([t0, ...mid, tGoal])].sort((a, b) => a - b);
}

/**
 * THE MOMENT OF THE SHOT, a Prev/Next stop on every goal with a recorded location; on a goal from
 * beyond TRACK_LANE_FT it also holds the lane (`lane`), the triangle from the puck to the two posts.
 * Beyond TRACK_RELEASE_FT, the moment is the release (see TRACK_CARRY_FT) nearest the spot the league recorded:
 * long shots leave the stick fast, often after the shooter has carried the puck past that spot.
 * Closer in, it is the frame where the puck is nearest that spot: close goals often go in too slowly
 * for a release to show (88% of the 908 within 3 feet, a median 0.3 s before the line). The distance
 * is the color line's.
 *   {j, at, apex, posts, ft, lane} — `apex` and `posts` in league feet.
 */
export function trackShot(P, homeId) {
  const e = P && P.e;
  if (!e || e.x == null || e.y == null) return null;
  const dir = attackDirection(e.own, homeId), ft = Math.round(distanceToNet(e.x, e.y, dir));
  const lane = ft > TRACK_LANE_FT, release = ft > TRACK_RELEASE_FT;
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
  if (release) for (let t = 1; t < P.k; t++) if (released(t) && (j < 0 || off(t) < off(j))) j = t;
  if (j < 0) for (let t = 0; t <= P.k; t++) if (pts[t] && (j < 0 || off(t) < off(j))) j = t;
  if (j < 0) return null;
  const apex = pts[j];
  return { j, at: P.frames[j].timeStamp, apex, ft, lane,
    posts: [{ x: NET_X * dir, y: -GOAL_POST_Y }, { x: NET_X * dir, y: GOAL_POST_Y }] };
}
/** Per frame to the goal line: the player nearest the puck within TRACK_REACH_FT, or null. */
export function trackHolders(P) {
  const out = [];
  for (let j = 0; j <= P.k; j++) {
    const o = P.frames[j].onIce || {}, pk = o['1'];
    let best = null, bd = TRACK_REACH_FT;
    if (pk) { const p = trackFeet(pk);
      for (const [key, s] of Object.entries(o)) {
        if (key === '1' || s.playerId == null) continue;
        const f = trackFeet(s), d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d <= bd) { bd = d; best = s.playerId; } } }
    out.push(best);
  }
  return out;
}
/**
 * THE ASSISTS, WHO FROM THE LEAGUE'S RECORD AND WHEN FROM THE TRACKING: the last frame the primary assist
 * has the puck before the scorer's last touch, and the secondary's last before that. `shot` when the puck
 * went from him to the net, not to a teammate: a tip or deflection whose touch is the release (within
 * TRACK_SAME_SHOT tenths of trackShot), or a goaltender next to have it (a rebound). `homeId` places the
 * release; without it a tip stays a pass, because the release cannot be found.
 *   [{pid, rank, j, at, shot}], secondary first; [] when the goal is unassisted or he never has it here.
 */
export function trackAssists(P, homeId = null, H = trackHolders(P)) {
  const e = P.e;
  if (e.a1 == null) return [];
  const last = (pid, before) => { for (let j = before - 1; j >= 0; j--) if (H[j] === Number(pid)) return j; return -1; };
  const sc = last(e.actor, P.k + 1), r1 = last(e.a1, sc >= 0 ? sc : P.k + 1);
  if (r1 < 0) return [];
  const next = j => { for (let t = j + 1; t <= P.k; t++) if (H[t] != null && H[t] !== H[j]) return H[t]; return null; };
  const tip = /tip|deflect/.test(e.st || '');
  const shotAt = homeId == null ? null : (trackShot(P, homeId) || {}).at;
  const mk = (pid, rank, j) => {
    const at = P.frames[j].timeStamp;
    const release = rank === 1 && tip && shotAt != null && Math.abs(at - shotAt) <= TRACK_SAME_SHOT;
    return { pid: Number(pid), rank, j, at,
      shot: release || (next(j) != null && next(j) === Number(e.goalie)) };
  };
  const out = [mk(e.a1, 1, r1)];
  if (e.a2 != null) { const r2 = last(e.a2, r1); if (r2 >= 0) out.unshift(mk(e.a2, 2, r2)); }
  return out;
}
/** The name line at an assist: what he did, and the credit in the league's words. */
export function trackAssistSay(a, G) {
  const p = G.roster[a.pid] || {};
  return `#${p.n || ''} ${p.nm || ''} ${a.shot ? 'shoots' : 'passes'} · the league credits him with the ${a.rank === 1 ? 'primary' : 'secondary'} assist`;
}
/**
 * THE LIVE LANE at frame `j`: the triangle from the puck to the scoring team's posts while the puck is
 * in that team's end (beyond the blue line) and more than TRACK_LANE_FT from the net; null otherwise.
 * Elsewhere a shot is not on, and the triangle would cover half the rink.
 */
export function trackLaneAt(P, j, homeId) {
  const pk = P.frames[j] && P.frames[j].onIce && P.frames[j].onIce['1'];
  if (!pk) return null;
  const f = trackFeet(pk), p = { x: P.turn * f.x, y: P.turn * f.y }, dir = attackDirection(P.e.own, homeId);
  if (!(p.x * dir > BLUE_LINE_X) || !(Math.round(distanceToNet(p.x, p.y, dir)) > TRACK_LANE_FT)) return null;
  return { apex: p, posts: [{ x: NET_X * dir, y: -GOAL_POST_Y }, { x: NET_X * dir, y: GOAL_POST_Y }] };
}
/** The line's words for the lanes this goal shows: the light one while it follows the puck, the held one from the shot. */
export function trackLaneSay(P, G, shot) {
  const home = G.teams.home, away = G.teams.away, end = Number(P.e.own) === Number(home.id) ? away.ab : home.ab;
  let live = false;
  for (let j = 0; j <= P.k && !live; j++) live = !!trackLaneAt(P, j, home.id);
  const held = !!(shot && shot.lane);
  if (live) return ` The light triangle runs from the puck to the posts while the puck is in the ${end} end, more than `
    + `${TRACK_LANE_FT} feet from the net: anyone inside it stands between the puck and the net.`
    + (held ? ' At the shot it darkens and holds where the shot was taken.' : '');
  return held ? ' The shaded triangle runs from the puck to the posts at the moment of the shot: '
    + 'anyone inside it was between the shot and the net.' : '';
}
/** The note while frame `j` plays: the triangle's one-line reading while one is drawn, else "". */
export function trackLaneLine(P, j, tt, shot, homeId) {
  if (shot && shot.lane && tt >= shot.at) return 'Anyone inside the shaded triangle was between the shot and the net.';
  return trackLaneAt(P, j, homeId) ? 'Anyone inside the light triangle stands between the puck and the net.' : '';
}
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
  // The lane, under the players: held where the shot was taken from the shot to the goal line on a long
  // goal; before that, light, following the puck while it is in the scoring team's end beyond TRACK_LANE_FT.
  const lane = (cls, L) => `<polygon class="${cls}" points="${[L.apex, ...L.posts].map(q => `${AX(q.x, per).toFixed(2)},${AY(q.y, per).toFixed(2)}`).join(' ')}"/>`;
  if (shot && shot.lane && tt >= shot.at) out.push(lane('tlane', shot));
  else { const L = trackLaneAt(P, j, G.teams.home.id); if (L) out.push(lane('tlane live', L)); }
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
