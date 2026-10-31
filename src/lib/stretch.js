/**
 * A PLAY: from one faceoff to the next.
 *
 * The replay shows one event at a time, so a viewer sees flashes rather than a
 * sequence. A play is the unit that makes them read as one: it begins at a
 * faceoff, which the league records at every restart, and runs to the event
 * before the next faceoff or to the end of the period. No threshold is chosen
 * here; both edges are recorded events.
 *
 * Over 10 games (2026-10-13 slate), all 562 faceoffs followed a stoppage, a goal,
 * a penalty or a period start, so the next faceoff always marks a whistle.
 *
 * What it refuses to say: who had the puck (`own` means a different team per
 * event type, see transition.js) and where the puck was between two events.
 * It counts events and says where they were recorded. A caller that has seen
 * the puck leave (`left`, from a goal's tracking) may pass that second in;
 * this file does not discover the crossing on its own.
 */
import { BLUE_LINE_X } from './rink.js';
import { corsiTeam } from './attribution.js';
import { framed } from './layer.js';


/** Every play in the game as `{from, to}`: indexes into `events`, faceoff to last event before the next restart. */
export function plays(events) {
  const out = [];
  let from = -1;
  const close = to => { if (from >= 0 && to >= from) out.push({ from, to }); from = -1; };
  events.forEach((e, n) => {
    if (e.pt === 'SO') { close(n - 1); return; }
    if (e.type === 'faceoff') { close(n - 1); from = n; return; }
    if (from >= 0 && (e.type === 'period-end' || e.type === 'game-end')) close(n);
  });
  close(events.length - 1);
  return out;
}

/** The play holding event index `n`, or null (before the first faceoff, or in a shootout). */
export function playAt(list, n) {
  for (const p of list) if (n >= p.from && n <= p.to) return p;
  return null;
}

/** An event the replay draws as a mark: a frame with a location. Only these are counted, so the count matches the marks. */
export const markable = e => framed(e) && e.x != null && e.pt !== 'SO';


/**
 * A ZONE STRETCH: events in a row, inside one play, recorded in the same zone.
 * Hockey flows by zones and the whistle cuts it; a stretch of ZONE_RUN or more is
 * when the line follows the zone instead of the play (Kevin, 2026-10-15).
 * ⚠️ ZONE_RUN IS OUR RULE, NOT THE LEAGUE'S: Kevin's "more than 2". Over 10 games
 * it gave 32.5 stretches a game, inside 47.5% of plays, covering 50.2% of events.
 * The seconds run from the first to the last event recorded there, never the time
 * the puck spent there: nobody records when it crossed the blue line.
 */
export const ZONE_RUN = 3;
const zoneAtX = x => (x < -BLUE_LINE_X ? 'h' : x > BLUE_LINE_X ? 'a' : 'n');

/**
 * The play's zone stretches up to event `upto`, oldest first: `{end, from, marks, secs, att, onGoal}`.
 * `left` is `{at, end}` when a goal's tracking has shown the puck outside `end` at elapsed second `at`,
 * or null. A mark in that end after `at` starts a new run: the stay broke when the puck left, and no
 * recorded event marks the crossing. Other ends are untouched — `left` is one end, not every zone.
 */
export function zoneRuns(events, play, upto, ctx, left = null) {
  const runs = [];
  let cur = null;
  for (let n = play.from; n <= Math.min(upto, play.to); n++) {
    const e = events[n];
    if (!markable(e)) continue;
    const end = zoneAtX(e.x);
    const broke = left && cur && cur.end === left.end && e.s > left.at && cur.s0 <= left.at;
    if (!cur || cur.end !== end || broke) { cur = { end, from: n, marks: 0, s0: e.s, secs: 0, att: { a: 0, h: 0 }, onGoal: { a: 0, h: 0 } }; runs.push(cur); }
    cur.marks++;
    cur.secs = e.s - cur.s0;
    const team = corsiTeam(e, ctx.roster);
    const k = team === ctx.awayId ? 'a' : team === ctx.homeId ? 'h' : null;
    if (k) { cur.att[k]++; if (e.type === 'shot-on-goal' || e.type === 'goal') cur.onGoal[k]++; }
  }
  return runs.map(({ s0, ...r }) => r);
}

/** The stretch the playhead is in, once it has ZONE_RUN events; else null. */
export const liveRun = runs => {
  const r = runs[runs.length - 1];
  return r && r.marks >= ZONE_RUN ? r : null;
};
