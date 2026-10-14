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
 * It counts events and says where they were recorded.
 */
import { BLUE_LINE_X } from './rink.js';
import { corsiTeam } from './attribution.js';
import { framed } from './layer.js';
import { spokenGap } from './transition.js';

const CLOSES = new Set(['stoppage', 'goal', 'penalty', 'period-end', 'game-end']);

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

/** How a finished play ended. A goal outranks a penalty, and a penalty outranks the stoppage it was called at. */
export function endOf(events, play) {
  const first = type => events.slice(play.from + 1, play.to + 1).find(e => e.type === type);
  const goal = first('goal'), pen = first('penalty'), stop = first('stoppage');
  if (goal) return { kind: 'goal', team: goal.own };
  if (pen) return { kind: 'penalty', team: pen.own };
  if (stop) return { kind: 'stoppage', rsn: stop.rsn || null };
  return { kind: 'period' };
}

/**
 * The play's counts up to and including event `upto`.
 *   ctx {roster, homeId, awayId}. Home defends -x in the extract, every period (rink.js).
 */
export function playTally(events, play, upto, ctx) {
  const last = Math.min(upto, play.to);
  const t = { marks: 0, secs: 0, att: { a: 0, h: 0 }, onGoal: { a: 0, h: 0 }, end: { a: 0, h: 0, n: 0 } };
  let s0 = null, s1 = null;
  for (let n = play.from; n <= last; n++) {
    const e = events[n];
    if (!markable(e)) continue;
    t.marks++;
    if (s0 == null) s0 = e.s;
    s1 = e.s;
    t.end[e.x < -BLUE_LINE_X ? 'h' : e.x > BLUE_LINE_X ? 'a' : 'n']++;
    const team = corsiTeam(e, ctx.roster);
    const k = team === ctx.awayId ? 'a' : team === ctx.homeId ? 'h' : null;
    if (!k) continue;
    t.att[k]++;
    if (e.type === 'shot-on-goal' || e.type === 'goal') t.onGoal[k]++;
  }
  t.secs = s0 == null ? 0 : s1 - s0;
  return t;
}

const plural = (k, one) => `${k} ${one}${k === 1 ? '' : 's'}`;

/**
 * The play in one line, or '' when there is nothing yet to sum up.
 *   done: `endOf`'s answer for a finished play, null for the one running.
 *   names {a, h, awayId, homeId, reason}: abbreviations, ids, and a stoppage-reason namer.
 */
export function playLine(t, done, names) {
  if (!t || t.marks === 0 || (!done && t.marks < 2)) return '';
  const gap = spokenGap(t.secs);
  const parts = done ? ['Last play', gap || 'under a second'] : ['This play', `${gap || '0s'} since the faceoff`];
  const side = k => `${names[k]} ${plural(t.att[k], 'attempt')}${t.onGoal[k] ? ` (${t.onGoal[k]} on goal)` : ''}`;
  const other = k => `${names[k]} ${t.att[k]}`;
  if (t.att.a + t.att.h === 0) parts.push('no attempts');
  else parts.push(t.att.a >= t.att.h ? `${side('a')}, ${other('h')}` : `${side('h')}, ${other('a')}`);
  if (t.marks > 1) {
    const top = Object.entries(t.end).sort((x, y) => y[1] - x[1]);
    if (top[0][1] > top[1][1]) {
      const where = top[0][0] === 'n' ? 'the neutral zone' : `the ${names[top[0][0]]} end`;
      parts.push(`${top[0][1]} of ${plural(t.marks, 'event')} in ${where}`);
    }
  }
  if (done) parts.push('ended: ' + endSaid(done, names));
  return parts.join(' · ');
}

function endSaid(done, names) {
  const club = id => (id === names.awayId ? names.a : id === names.homeId ? names.h : '');
  if (done.kind === 'goal') return `${club(done.team)} goal`.trim();
  if (done.kind === 'penalty') return `${club(done.team)} penalty`.trim();
  if (done.kind === 'period') return 'end of the period';
  return done.rsn ? names.reason(done.rsn).toLowerCase() : 'whistle';
}
