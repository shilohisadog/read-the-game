/**
 * THE COLOR LINE: what a color analyst would add, in plain English, from three
 * sources only — the league's record of this game, the rulebook, and the
 * archive's base rates (Kevin, 2026-10-15: "more like the color guy and not the
 * play by play guy"). Drafted and read as `docs/color-script.md` first.
 *
 * One note at most per frame; silence is normal. When several apply, the first in
 * this order wins: goal, penalty, restart, slot shot, shift clock, zone stretch,
 * the score between periods. The order is our editorial choice, declared here.
 * A shot on goal, a miss or a goal also opens with its type and distance ("A wrist
 * shot from 34 feet."). A blocked shot never does: the league records neither its
 * type nor where it was taken, only where it was blocked.
 *
 * What it never says: who had the puck (`own` changes meaning by event type), why
 * anyone did anything, or a judgement such as "tired" — it gives the seconds and
 * the typical shift and lets the viewer see it.
 */
import { corsiTeam } from './attribution.js';
import { framed, inShootout } from './layer.js';
import { isHighDangerEvent } from './layers/goaltending.js';
import { WHY, icingRestarts } from './layers/whistle.js';
import { liveRun, playAt, plays, zoneRuns } from './stretch.js';
import { attackDirection, distanceToNet } from './rink.js';

/* The league's `shotType` (SCHEMA 7, `st`), in plain words; an unknown value reads "A shot". */
export const SHOT_WORDS = {
  wrist: 'A wrist shot', snap: 'A snap shot', slap: 'A slapshot', backhand: 'A backhand',
  'tip-in': 'A tipped shot', deflected: 'A deflected shot', 'wrap-around': 'A wraparound',
  bat: 'A puck batted out of the air', poke: 'A poke at the puck',
  'between-legs': 'A shot from between his legs', cradle: 'A lacrosse-style "Michigan"',
};
const SHOTS_TYPED = new Set(['shot-on-goal', 'missed-shot', 'goal']);

/** "A wrist shot from 34 feet." — feet from the league's coordinates to the net shot at. */
export function shotLead(e, shooter, homeId) {
  if (!SHOTS_TYPED.has(e.type) || shooter == null) return null;
  const what = (e.st && SHOT_WORDS[e.st]) || 'A shot';
  if (e.x == null || e.y == null) return e.st ? `${what}.` : null;
  const ft = Math.round(distanceToNet(e.x, e.y, attackDirection(shooter, homeId)));
  return `${what} from ${ft} ${ft === 1 ? 'foot' : 'feet'}.`;
}

const PERIOD_DONE = ['', 'After one period', 'After two periods', 'After three periods'];
const ORD = k => `${k}${k % 100 >= 11 && k % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th'}`;
const countOf = (k, one) => `${k} ${one}${k === 1 ? '' : 's'}`;
// Restarts the caption pill already explains; the color line adds only what it does not.
const PILL_SAYS = new Set(['icing', 'offside']);

/** Skaters of a team on the ice at event `e`, each with seconds into the shift. Same rule as onice.js. */
function skatersOn(game, e, tid) {
  const arriving = e.type === 'faceoff';
  const seen = new Map();
  for (const r of game.shifts || []) {
    if (r.t !== tid || !(arriving ? r.s <= e.s && e.s < r.e : r.s < e.s && e.s <= r.e)) continue;
    const p = (game.roster || {})[r.p];
    if (!p || p.pos === 'G') continue;
    if (!seen.has(r.p) || seen.get(r.p) < r.s) seen.set(r.p, r.s);
  }
  return [...seen.entries()].map(([p, s]) => ({ p, on: e.s - s }));
}

const secsSpan = xs => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return lo === hi ? `${lo} seconds each` : `${lo} to ${hi} seconds each`;
};

/**
 * Every note in the game, keyed by event index in `game.events`.
 *   ctx   {roster, homeId, awayId, homeAb, awayAb}
 *   rates measures.json, or null: notes needing a base rate then drop that clause
 */
export function colorNotes(game, ctx, rates) {
  const ev = game.events || [];
  const ab = id => (id === ctx.homeId ? ctx.homeAb : id === ctx.awayId ? ctx.awayAb : '');
  const other = id => (id === ctx.homeId ? ctx.awayId : ctx.homeId);
  const census = (rates && rates.census) || {};
  // The typical shift is the archive's mean (ruling 4), to the second.
  const SHIFT = census.shift && census.shift.mean != null ? Math.round(census.shift.mean) : null;
  const pp = census.whistles && census.whistles.ppGoals ? Math.round(census.whistles.ppChances / census.whistles.ppGoals) : null;
  const slot = rates && rates.slot && rates.slot.scoredFromInside && rates.slot.scoredFromOutside
    ? [Math.round(rates.slot.scoredFromInside.n / rates.slot.scoredFromInside.count),
       Math.round(rates.slot.scoredFromOutside.n / rates.slot.scoredFromOutside.count)] : null;
  const icing = new Map(icingRestarts(ev, ctx).map(r => [r.event, r]));
  const PLAYS = plays(ev);

  const notes = new Map();
  const score = { [ctx.homeId]: 0, [ctx.awayId]: 0 };
  const tally = { att: { [ctx.homeId]: 0, [ctx.awayId]: 0 }, sog: { [ctx.homeId]: 0, [ctx.awayId]: 0 },
                  slot: { [ctx.homeId]: 0, [ctx.awayId]: 0 } };
  const toldWhy = new Set(), toldShift = new Set(), toldSlot = new Set();
  let lastStop = null, endedPeriod = 0;

  ev.forEach((e, n) => {
    if (e.type === 'stoppage') lastStop = e;
    if (e.type === 'period-end' && e.pt !== 'SO') endedPeriod = e.per;
    if (!framed(e) || inShootout(e)) return;
    const shooter = corsiTeam(e, ctx.roster);
    const slotShot = (e.type === 'shot-on-goal' || e.type === 'missed-shot' || e.type === 'goal') && isHighDangerEvent(e, ctx);
    if (shooter) {
      tally.att[shooter]++;
      if (e.type === 'shot-on-goal' || e.type === 'goal') tally.sog[shooter]++;
      if (slotShot) tally.slot[shooter]++;
    }
    const play = playAt(PLAYS, n);
    const run = play && e.type !== 'faceoff' ? liveRun(zoneRuns(ev, play, n, ctx)) : null;
    const A = ctx.awayAb, H = ctx.homeAb, aid = ctx.awayId, hid = ctx.homeId;
    let say = null;

    // The score between periods, on the first frame after the break.
    if (endedPeriod && e.per > endedPeriod) {
      say = `${PERIOD_DONE[endedPeriod] || 'After overtime'}: shots on goal ${A} ${tally.sog[aid]}, ${H} ${tally.sog[hid]}; `
        + `all shot attempts ${A} ${tally.att[aid]}, ${H} ${tally.att[hid]}; shots from the slot ${A} ${tally.slot[aid]}, ${H} ${tally.slot[hid]}.`;
      endedPeriod = 0;
    }
    // 1. A goal: what it does to the score, and how long the puck had stayed in that end.
    if (!say && e.type === 'goal' && shooter) {
      score[shooter]++;
      const s = score[shooter], o = score[other(shooter)], t = ab(shooter);
      say = s === o ? `That ties the game, ${s}–${o}.` : s - o === 1 ? `That puts ${t} ahead, ${s}–${o}.`
        : s > o ? `${t} now leads ${s}–${o}.` : `${t} pulls within ${o - s}, ${s}–${o}.`;
      if (run && run.end === (shooter === aid ? 'h' : 'a'))
        say += ` The puck had stayed in the ${ab(other(shooter))} end for ${run.marks} events in a row before it went in.`;
    } else if (e.type === 'goal' && shooter) score[shooter]++;
    // 2. A penalty: what follows, said only as far as the record shows it.
    if (!say && e.type === 'penalty' && e.own != null) {
      const next = ev.slice(n + 1).find(x => x.sit && x.type !== 'penalty');
      const sit = next && next.sit;
      const short = sit && sit[1] !== sit[2] ? (+sit[1] < +sit[2] ? aid : hid) : null;
      const who = (ctx.roster[e.actor] || {}).nm;
      say = `${who ? who + ' sits' : 'A player sits'} in the penalty box for ${countOf(e.min || 2, 'minute')}.`;
      if (short != null) {
        say += ` ${ab(short)} plays with fewer skaters until then: a "power play" for ${ab(other(short))}.`;
        if (pp) say += ` Over the last three seasons, about 1 power play in ${pp} ended in a goal.`;
      } else if (sit) say += ' Both teams keep the same number of skaters.';
    }
    // 3. A restart: what the pill does not already say.
    if (!say && e.type === 'faceoff' && icing.has(e)) {
      const off = icing.get(e).offender, tid = off === A ? aid : off === H ? hid : null;
      if (tid != null) {
        const mine = skatersOn(game, e, tid).map(x => x.on);
        const fresh = skatersOn(game, e, other(tid)).filter(x => x.on === 0).length;
        // A skater at 0 seconds came on as the puck was iced, on the fly; the seconds would then
        // read as a contradiction of "may not change", so they are left out.
        const secs = mine.length && Math.min(...mine) > 0
          ? `: its ${mine.length} skaters stay on, ${secsSpan(mine).replace(' each', '')} into their shift` : '';
        if (mine.length) say = `${off} may not change players for this face-off${secs}.`
          + `${fresh ? ` ${ab(other(tid))} sent out ${countOf(fresh, 'fresh skater')}.` : ''}`;
      }
    } else if (!say && e.type === 'faceoff' && lastStop && lastStop.rsn && !PILL_SAYS.has(lastStop.rsn)
               && !toldWhy.has(lastStop.rsn) && WHY[lastStop.rsn] && WHY[lastStop.rsn].say
               && lastStop.per === e.per && lastStop.s === e.s) {
      toldWhy.add(lastStop.rsn);
      say = `Why play stopped: ${WHY[lastStop.rsn].say}`;
    }
    // 4. A shot from the slot: the base rate the first time, a count after.
    if (!say && slotShot && shooter) {
      if (!toldSlot.has(shooter) && slot) {
        toldSlot.add(shooter);
        say = `That shot came from the slot, the area right in front of the net. About 1 shot in ${slot[0]} from there goes in; from farther out, about 1 in ${slot[1]}.`;
      } else if (toldSlot.has(shooter)) say = `Another shot from the slot: ${ab(shooter)}'s ${ORD(tally.slot[shooter])} of the game.`;
    }
    // 5. The shift clock: every skater of one team out longer than a typical shift, once per group.
    if (!say && SHIFT) for (const tid of [hid, aid]) {
      const on = skatersOn(game, e, tid);
      if (on.length < 4 || Math.min(...on.map(x => x.on)) <= SHIFT) continue;
      const key = tid + ':' + on.map(x => x.p).sort().join();
      if (toldShift.has(key)) continue;
      toldShift.add(key);
      say = `Every ${ab(tid)} skater on the ice has been out longer than a typical shift (about ${SHIFT} seconds): ${secsSpan(on.map(x => x.on))}.`;
      break;
    }
    // 6. A zone stretch: the puck staying in one end, and the attempts in that time.
    if (!say && run) {
      if (run.end === 'n') say = `The puck has stayed in the neutral zone for ${run.marks} events in a row.`;
      else {
        const atk = run.end === 'h' ? 'a' : 'h', name = { a: A, h: H };
        say = `The puck has stayed in the ${name[run.end]} end for ${run.marks} events in a row; in that time ${name[atk]} has `
          + `${run.att[atk] ? countOf(run.att[atk], 'shot attempt') : 'no shot attempts'}${run.att[run.end] ? ` and ${name[run.end]} ${run.att[run.end]}` : ''}.`;
      }
    }
    const lead = shotLead(e, shooter, ctx.homeId);
    if (lead) say = say ? `${lead} ${say}` : lead;
    if (say) notes.set(n, say);
  });
  return notes;
}
