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
import { standing, POWER_PLAY } from './strength.js';
import { occupants } from './box.js';
import { NET_X, GOAL_POST_Y, BLUE_LINE_X, ZONE_BAND_FT, attackDirection, distanceToNet } from './rink.js';

/** Replay speeds for the tracking: [factor, button label, words for the line]. */
export const TRACK_SPEEDS = [[0.25, '¼', 'at a quarter of real speed'],
  [0.5, '½', 'at half speed'], [1, 'Real time', 'in real time']];
export const TRACK_SPEED = 0.25;           // Kevin: a novice needs time to take it in
/** Start loading a goal's file this far ahead, in game seconds. */
export const TRACK_LOOKAHEAD_S = 40;
/** Goals mode opens each goal on its first tracked frame, held still this long. */
export const TRACK_STILL_MS = 1500;
/** An assist's name line stays up this much GAME time (tenths). */
export const TRACK_ASSIST_TENTHS = 16;
/** A tip and the shot are the same touch when they fall within this many tenths. */
export const TRACK_SAME_SHOT = 3;
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
/** The goal line, feet from centre ice. */
const GOAL_LINE = 89;
/** Radius of the puck dot. The tracked point is its centre, so the dot has not fully crossed a line until the centre is this far past it. */
export const PUCK_R = 0.6;
/** Radius of a skater dot, as drawn. */
export const SKATER_R = 1.35;

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

const abOf = (G, tid) => (tid === G.teams.home.id ? G.teams.home.ab : G.teams.away.ab);

/** The name line: "Tracked · goal by #9 Kempe (LAK)". */
export function trackWho(P, G) {
  const p = G.roster[P.e.actor] || {};
  return `Tracked · goal by #${p.n || ''} ${p.nm || ''} (${abOf(G, P.e.own)})`;
}
/** The line while the first frame is held still. */
export const trackFirst = P => `${Math.round(P.before)} seconds before the goal. The black dot is the puck.`;

/** The stops Prev/Next move between: the first frame, the shot (`shotAt`), each assist, the goal line. */
export function trackStops(P, shotAt = null, assists = []) {
  const t0 = P.frames[0].timeStamp, tGoal = P.frames[P.k].timeStamp;
  // An assist that is the shot itself (a tip at the release, a rebound) is the shot's stop.
  const passes = assists.filter(a => !(a.shot && shotAt != null && Math.abs(a.at - shotAt) <= TRACK_SAME_SHOT)).map(a => a.at);
  const mid = [shotAt, ...passes].filter(v => v != null && v > t0 && v < tGoal);
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
/** Tenths of a second from the shot (`trackShot`) to the goal line, or null. */
export const trackFlight = (P, S) => (P && S ? P.k - S.j : null);
/** "The puck reached the goal line about 0.4 seconds after the shot." The file is 10 frames a second, hence "about". */
export function trackFlightSay(tenths) {
  if (tenths == null || tenths < 1) return '';
  const t = tenths === 1 ? 'about a tenth of a second' : `about ${(tenths / 10).toFixed(1)} seconds`;
  return `The puck reached the goal line ${t} after the shot.`;
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
/** The note while frame `j` plays: the triangle's one-line reading while one is drawn, else "". */
export function trackLaneLine(P, j, tt, shot, homeId) {
  if (shot && shot.lane && tt >= shot.at) return 'Anyone inside the shaded triangle was between the shot and the net.';
  return trackLaneAt(P, j, homeId) ? 'Anyone inside the light triangle stands between the puck and the net.' : '';
}

/** "Onside: the puck crossed the blue line before any LAK player did." */
export const trackEntrySay = ab => `Onside: the puck crossed the blue line before any ${ab} player did.`;
const COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
/** The ticks and the ?s, said: who was behind the line, and why the tracking cannot settle the rest. */
function entryMarks(behind, unsure) {
  const tick = behind === 1 ? ' The ticked player was behind the line.' : behind > 1 ? ' The ticked players were behind the line.' : '';
  if (!unsure) return tick;
  const them = unsure === 1 ? 'the one marked ?' : `the ${COUNT[unsure] || unsure} marked ?`;
  return `${tick} Offside depends on a player’s skates, and the tracking only follows the middle of each player, `
    + `so it can’t tell for ${them}.`;
}
/**
 * When the tracking cannot show the puck went first. A clip exists only for a goal that counted, so the
 * entry stood; `behind` players are ticked, `unsure` ones marked ?.
 */
export const trackEntryRuled = (ab, behind, unsure) => `Onside: the officials ruled ${ab}’s entry onside.${entryMarks(behind, unsure)}`;
/** An attacker well ahead of the puck while carrying it: allowed. */
export const trackEntryCarried = (who, behind, unsure) =>
  `Onside: ${who} crossed the blue line ahead of the puck while carrying it, which is allowed: the player with the puck may go in first.${entryMarks(behind, unsure)}`;
/** An attacker well ahead of the puck and not carrying it. The tracking's accuracy is not published, so this says only what is certain. */
export const TRACK_ENTRY_CALLED = 'The puck crosses the blue line: no offside was called, and the goal counted.';

/** Feet along the attack, positive toward the net being attacked, or null when `o` has no location. */
const trackAx = (P, o, dir) => {
  if (!o || o.x == null || o.y == null) return null;
  const f = trackFeet(o);
  return P.turn * f.x * dir;
};

/**
 * The frame the puck's dot clears the attacking blue line, or null when the clip does not show it.
 * With every attacking skater behind the line the caption says the puck went first; with some within a
 * dot's radius past it, it names the officials' ruling and says which ones the tracking cannot settle.
 * One further ahead is legal only carrying the puck, which it says; anyone else further ahead, it says
 * only that no offside was called and marks no one (Kevin, 2026-11-01).
 *   {j, at, from, ids, unsure, say} — `from` is the first frame of the approach, `ids` the skaters
 *   behind the line (ticked), `unsure` those too close to call (marked ?).
 */
export function trackEntry(P, homeId, roster, ab) {
  if (!P || !P.e || homeId == null) return null;
  const dir = attackDirection(P.e.own, homeId), own = Number(P.e.own);
  const axAt = j => trackAx(P, P.frames[j] && P.frames[j].onIce && P.frames[j].onIce['1'], dir);
  // A skater counts as across once his tracked centre passes the line: the point cannot say where his skates are.
  const puckClear = BLUE_LINE_X + PUCK_R, skaterClear = BLUE_LINE_X;
  let prev = null, hit = null;
  for (let j = 0; j <= P.k; j++) {
    const ax = axAt(j);
    if (ax == null) { prev = null; continue; }
    // The last crossing. The puck can leave the zone and come back.
    if (prev != null && prev <= puckClear && ax > puckClear) hit = j;
    prev = ax;
  }
  if (hit == null) return null;
  const ids = [], unsure = [], ahead = [];
  for (const o of Object.values(P.frames[hit].onIce || {})) {
    if (!o.playerId || Number(o.teamId) !== own) continue;
    const r = roster && roster[o.playerId];
    if (r && r.pos === 'G') continue;
    const ax = trackAx(P, o, dir);
    if (ax == null) return null;
    // Past a dot's radius the skater is across, skates and all; only carrying the puck makes that onside.
    (ax > skaterClear + SKATER_R ? ahead : ax > skaterClear ? unsure : ids).push(Number(o.playerId));
  }
  if (!ids.length && !unsure.length && !ahead.length) return null;
  const holder = ahead.length ? Number(trackHolders(P)[hit]) : null;
  const carried = ahead.length === 1 && ahead[0] === holder;
  let from = hit;
  for (let j = hit - 1; j >= 0; j--) {
    const ax = axAt(j);
    if (ax == null || ax <= BLUE_LINE_X - ZONE_BAND_FT || ax > puckClear) break;
    from = j;
  }
  const at = P.frames[hit].timeStamp;
  if (ahead.length && !carried) return { j: hit, at, from, ids: [], unsure: [], say: TRACK_ENTRY_CALLED };
  const p = carried && roster && roster[holder];
  const say = carried ? trackEntryCarried(p ? `#${p.n} ${p.nm}` : `the ${ab} player`, ids.length, unsure.length)
    : unsure.length ? trackEntryRuled(ab, ids.length, unsure.length) : trackEntrySay(ab);
  return { j: hit, at, from, ids, unsure, say };
}

/** The frame shown at file time `tt` (tenths), never past the goal line. */
export function trackFrameAt(P, tt) {
  let j = 0;
  while (j < P.k && P.frames[j + 1].timeStamp <= tt) j++;
  return j;
}
/** Seconds left in the period on the goal's own clock. */
const goalRem = P => { const [m, s] = String(P.e.rem || '0:0').split(':').map(Number); return m * 60 + s; };
/** Seconds left in the period at frame `j`, counted back from the goal's own clock. */
export function trackRem(P, j) {
  return Math.max(0, Math.floor(goalRem(P) + (P.frames[P.k].timeStamp - P.frames[j].timeStamp) / 10));
}
/** The scoreboard clock at frame `j`. */
export function trackClock(P, j) {
  const r = trackRem(P, j);
  return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
}
/** Elapsed game seconds at frame `j` — the same instant trackClock shows, for the box. */
export function trackSecs(P, j) {
  return P.e.s + goalRem(P) - trackRem(P, j);
}
/** The strength code to show during a tracked clip: the last recorded one, or null (no
 *  badge) once the short-handed team's box is empty. Only ever drops a power play, because
 *  box.js records who is in the box, not strength. */
export function trackClipSit(holdSit, secs, box, ctx) {
  const b = standing(holdSit, ctx);
  if (!b || b.kind !== POWER_PLAY) return holdSit;
  const shortId = b.id === ctx.homeId ? ctx.awayId : ctx.homeId;
  // A misconduct does not shorten the team (box.js), so only other seats keep the power play.
  return occupants(box, secs, shortId).some(o => o.sev !== 'MIS') ? holdSit : null;
}

/**
 * Frame `j` as SVG: every tracked player (the home side in its colour, the visitor
 * in white with a coloured rim, as road teams dress), the scorer's name, the puck,
 * and the label of any recorded event within its moment at `tt`. `col` maps a team
 * id to its colour; AX/AY are the replay's own placement.
 */
export function trackMarkup(P, j, tt, { G, AX, AY, col, shot = null, entry = null, blue = null }) {
  const per = P.e.per, at = o => { const p = trackFeet(o); return { x: AX(P.turn * p.x, per), y: AY(P.turn * p.y, per) }; };
  const stars = new Set([P.e.actor, P.e.a1, P.e.a2].filter(Boolean).map(Number));
  const F = P.frames[j].onIce, out = [];
  // The attacking blue line, faint while the puck approaches and held on the frame it clears.
  if (entry && blue && j >= entry.from && j <= entry.j)
    out.push(`<line class="onside${j < entry.j ? ' approach' : ''}" x1="${blue.x.toFixed(2)}" y1="${blue.y1.toFixed(2)}" x2="${blue.x.toFixed(2)}" y2="${blue.y2.toFixed(2)}"/>`);
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
    out.push(`<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${gk ? 1.7 : star ? 1.6 : SKATER_R}" fill="${fill}" stroke="${rim}" stroke-width="${away ? (star ? .7 : .45) : (star ? .55 : .25)}"/>`
      + `<text class="tn" x="${s.x.toFixed(2)}" y="${s.y.toFixed(2)}" fill="${ink}">${ESC(o.sweaterNumber)}</text>`);
    if (entry && j === entry.j && entry.ids.includes(Number(o.playerId)))
      out.push(`<text class="tck" x="${(s.x + 2.2).toFixed(2)}" y="${(s.y - 1.5).toFixed(2)}" fill="${c}">\u2713</text>`);
    if (entry && j === entry.j && (entry.unsure || []).includes(Number(o.playerId)))
      out.push(`<text class="tck unsure" x="${(s.x + 2.2).toFixed(2)}" y="${(s.y - 1.5).toFixed(2)}" fill="${c}">?</text>`);
    if (Number(o.playerId) === Number(P.e.actor))
      out.push(`<text class="tsc" x="${s.x.toFixed(2)}" y="${(s.y - 2.6).toFixed(2)}" fill="${c}">${ESC(r.nm || '')}</text>`);
  }
  const pk = F['1'];
  if (pk) {
    const s = at(pk);
    out.push(`<circle class="tpk" cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${PUCK_R}"/>`);
  }
  return out.join('');
}
