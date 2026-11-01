/**
 * THE COLOR LINE: what a color analyst would add, in plain English, from three
 * sources only — the league's record of this game, the rulebook, and the
 * archive's base rates (Kevin, 2026-10-15: "more like the color guy and not the
 * play by play guy"). Drafted and read as `docs/color-script.md` first.
 *
 * One note at most per frame; silence is normal. When several apply, the first in
 * this order wins: how a review of a goal ended, goal, penalty, restart, slot shot, long run, shift clock, zone
 * stretch, the score between periods. A long run waits for the first free frame. The order is our editorial choice, declared here.
 * A shot on goal, a miss or a goal also opens with its type and distance ("A wrist
 * shot from 34 feet."). A blocked shot never does: the league records neither its
 * type nor where it was taken, only where it was blocked.
 *
 * What it never says: who had the puck (`own` changes meaning by event type), why
 * anyone did anything, or a judgement such as "tired" — it gives the seconds and
 * the typical shift and lets the viewer see it.
 */
import { corsiTeam } from './attribution.js';
import { challenges, challengeSay } from './challenge.js';
import { framed, inShootout } from './layer.js';
import { isHighDangerEvent } from './layers/goaltending.js';
import { WHY, icingRestarts } from './layers/whistle.js';
import { liveRun, markable, playAt, plays, zoneRuns } from './stretch.js';
import { shotFeet } from './shotdist.js';
import { penaltyEdge } from './strength.js';
import { stints } from './box.js';
import { penName } from './penalties.js';

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
  const ft = shotFeet(e, shooter, homeId);
  if (ft == null) return e.st ? `${what}.` : null;
  return `${what} from ${ft} ${ft === 1 ? 'foot' : 'feet'}.`;
}

const PERIOD_DONE = ['', 'After one period', 'After two periods', 'After three periods'];
const ORD = k => `${k}${k % 100 >= 11 && k % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th'}`;
const clockOf = t => (t < 60 ? `${t} seconds` : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
const countOf = (k, one) => `${k} ${one}${k === 1 ? '' : 's'}`;

/**
 * The zone-stretch sentence. `had` is the goal's past tense, appended to the score;
 * `has` is the live sentence and carries the attempts recorded during the run.
 * `run` is null when the stretch is under ZONE_RUN, and the sentence is then absent.
 */
export function stayWords(run, ctx, form) {
  if (!run) return '';
  const A = ctx.awayAb, H = ctx.homeAb;
  if (form === 'had') {
    if (run.end === 'n') return '';
    return ` The puck had stayed in the ${run.end === 'h' ? H : A} end for ${run.marks} events in a row before it went in.`;
  }
  if (run.end === 'n') return `The puck has stayed in the neutral zone for ${run.marks} events in a row.`;
  const atk = run.end === 'h' ? 'a' : 'h', name = { a: A, h: H };
  const n = run.att[atk];
  return `The puck has stayed in the ${name[run.end]} end for ${run.marks} events in a row; in that time ${name[atk]} has `
    + `${n ? countOf(n, 'shot attempt') : 'no shot attempts'}${run.att[run.end] ? ` and ${name[run.end]} ${run.att[run.end]}` : ''}.`;
}

const STAY_HAD = / The puck had stayed in the \S+ end for \d+ events in a row before it went in\./;
/** The goal's note without its stay: Goals shows no events, so a count of them names nothing on screen (Kevin). */
export const dropStay = line => line.replace(STAY_HAD, '').replace(/ {2,}/g, ' ').trim();
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

/* What came just before a goal, each said only when it applies. The cut-offs are ours:
   a save this many seconds before with no whistle between, a face-off this recent, a shift this long. */
export const REBOUND_S = 3, OFF_DRAW_S = 10, LONG_SHIFT_S = 60;

/** " Markstrom had stopped a CBJ shot 2 seconds before, and play went on: a second chance, called a "rebound"." */
function reboundSay(ev, n, shooter, ctx, ab) {
  const e = ev[n];
  for (let k = n - 1; k >= 0 && ev[k].per === e.per && e.s - ev[k].s <= REBOUND_S; k--) {
    const x = ev[k];
    if (x.type === 'faceoff' || x.type === 'stoppage' || x.type === 'period-start') return '';
    if (x.type !== 'shot-on-goal' || corsiTeam(x, ctx.roster) !== shooter) continue;
    const g = (ctx.roster[x.goalie] || {}).nm, secs = e.s - x.s;
    const when = secs === 0 ? 'the same second' : `${countOf(secs, 'second')} before`;
    return ` ${g || 'The goalie'} had stopped a ${ab(shooter)} shot ${when}, and play went on: a second chance, called a "rebound".`;
  }
  return '';
}

/** " It came 6 seconds after the face-off, which DAL won." */
function drawSay(ev, n, ab) {
  const e = ev[n];
  for (let k = n - 1; k >= 0 && ev[k].per === e.per; k--) {
    const x = ev[k];
    if (x.type !== 'faceoff') continue;
    const secs = e.s - x.s;
    if (secs > OFF_DRAW_S || x.own == null) return '';
    return ` It came ${secs === 0 ? 'the same second as' : countOf(secs, 'second') + ' after'} the face-off, which ${ab(x.own)} won.`;
  }
  return '';
}

/** " 2 of the CBJ skaters had been on the ice over a minute (62 to 75 seconds each); a typical shift is about 48 seconds." */
function longShiftSay(game, e, tid, ab, SHIFT) {
  const long = skatersOn(game, e, tid).map(x => x.on).filter(t => t > LONG_SHIFT_S);
  if (!long.length || !SHIFT) return '';
  const who = long.length === 1 ? `1 ${ab(tid)} skater had` : `${long.length} of the ${ab(tid)} skaters had`;
  const secs = long.length === 1 ? `${long[0]} seconds` : secsSpan(long);
  return ` ${who} been on the ice over a minute (${secs}); a typical shift is about ${SHIFT} seconds.`;
}

const secsSpan = xs => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return lo === hi ? `${lo} seconds each` : `${lo} to ${hi} seconds each`;
};

/**
 * The strength each goal was scored at, in skaters, and who was in the box for it (Kevin, 2026-11-01):
 * a sentence per power-play or shorthanded goal, keyed by event index. A power play by the league's rule
 * (`penaltyEdge`, as the census counts it); the rates are the census's, and drop out with no archive.
 */
export function goalStrengths(game, ctx, rates) {
  const ev = game.events || [], out = new Map();
  const ab = id => (id === ctx.homeId ? ctx.homeAb : id === ctx.awayId ? ctx.awayAb : '');
  const other = id => (id === ctx.homeId ? ctx.awayId : ctx.homeId);
  const census = (rates && rates.census) || {}, w = census.whistles || {};
  const measuredOver = census.games ? `Across the ${census.games.toLocaleString('en-US')} games we have measured` : 'Across the games we have measured';
  const pp = w.ppGoals ? Math.round(w.ppChances / w.ppGoals) : null, shp = w.shGoals ? Math.round(w.ppChances / w.shGoals) : null;
  const BOX = stints(ev, ctx);
  ev.forEach((e, n) => {
    if (e.type !== 'goal' || inShootout(e)) return;
    const shooter = corsiTeam(e, ctx.roster), edge = shooter && penaltyEdge(e.sit, ctx), opp = other(shooter);
    if (!edge || edge[shooter] === edge[opp]) return;
    const up = edge[shooter] > edge[opp], short = up ? opp : shooter;
    const on = { [ctx.awayId]: +e.sit[1], [ctx.homeId]: +e.sit[2] };
    /* Who made the difference: the box at the goal (its end inclusive, since the goal ends a minor at its own
       second), less misconducts, which leave nobody short, and less penalties offset by one called at the
       same second for as long against the other side. Named only when that leaves exactly the skater gap.
       Which of two such penalties an offset cancels is not in the record, so a choice between them names nobody. */
    const inBox = t => BOX.filter(b => b.team === t && b.sev !== 'MIS' && b.start < e.s && b.end >= e.s);
    const offset = inBox(other(short)), gone = new Set(), key = b => b.start + '/' + b.min;
    const sat = inBox(short).filter(b => { const k = offset.findIndex(o => key(o) === key(b));
      if (k < 0) return true; offset.splice(k, 1); gone.add(key(b)); return false; });
    if (sat.length !== Math.abs(edge[shooter] - edge[opp]) || sat.some(b => gone.has(key(b)))) sat.length = 0;
    // The box holds its server: a goalie's or a bench penalty is served by a skater, and the sentence names both.
    const nm = id => (ctx.roster[id] || {}).nm;
    const name = b => nm(b.server) || `a ${ab(short)} player`;
    const why = b => { const p = penName(b.pen); return p.charAt(0).toLowerCase() + p.slice(1); };
    const whose = b => (b.player == null ? 'a bench penalty' : b.server !== b.player && nm(b.player) ? `${nm(b.player)}\u2019s penalty` : null);
    const one = b => (whose(b) ? `${name(b)} was in the penalty box, serving ${whose(b)} for ${why(b)}`
      : `${name(b)} was in the penalty box for ${why(b)}`);
    const box = sat.length === 1 ? `, because ${one(sat[0])}`
      : sat.length > 1 ? `, because ${sat.map(b => `${name(b)} (${whose(b) ? whose(b) + ', ' : ''}${why(b)})`).join(' and ')} were in the penalty box` : '';
    const pulled = (shooter === ctx.awayId ? e.sit[0] : e.sit[3]) === '0' ? ' (its goalie was off for an extra skater)' : '';
    const head = `${ab(shooter)} had ${on[shooter]} skaters to ${ab(opp)}'s ${on[opp]}${pulled}${box}`;
    out.set(n, up ? `${head}: a "power play".` + (pp ? ` ${measuredOver}, about 1 power play in ${pp} ended in a goal.` : '')
      : `${head}: a goal scored "shorthanded".`
        + (shp ? ` ${measuredOver}, about 1 power play in ${shp} ended in a goal for the team with fewer skaters.` : ''));
  });
  return out;
}

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
  // The archive's scope is the count of games measured; measures.json publishes no start date.
  const measuredOver = census.games ? `Across the ${census.games.toLocaleString('en-US')} games we have measured` : 'Across the games we have measured';
  const pp = census.whistles && census.whistles.ppGoals ? Math.round(census.whistles.ppChances / census.whistles.ppGoals) : null;
  const slot = rates && rates.slot && rates.slot.scoredFromInside && rates.slot.scoredFromOutside
    ? [Math.round(rates.slot.scoredFromInside.n / rates.slot.scoredFromInside.count),
       Math.round(rates.slot.scoredFromOutside.n / rates.slot.scoredFromOutside.count)] : null;
  // A run of play is long past what 3 in 4 runs reach (events), and very long past 9 in 10 (seconds).
  const RUN = census.runLength && census.runLength.events && census.runLength.secs
    ? { events: census.runLength.events.p75, secs: census.runLength.secs.p90 } : null;
  const icing = new Map(icingRestarts(ev, ctx).map(r => [r.event, r]));
  const PLAYS = plays(ev);
  const REVIEWS = challenges(ev, ctx), REVIEWED = new Set(REVIEWS.map(r => ev[r.at]));
  const reviewAt = new Map(REVIEWS.filter(r => r.target != null).map(r => [r.target, r]));
  // What a penalty leaves on the ice, from the next situation code the record carries.
  // `scoped`: the note has already named the games measured, so the rate says "In those games".
  const STRENGTH = goalStrengths(game, ctx, rates);
  const strengthAfter = (n, until, scoped = false) => {
    const next = ev.slice(n + 1).find(x => x.sit && x.type !== 'penalty');
    const sit = next && next.sit;
    const short = sit && sit[1] !== sit[2] ? (+sit[1] < +sit[2] ? ctx.awayId : ctx.homeId) : null;
    if (short != null) return ` ${ab(short)} plays with fewer skaters ${until}: a "power play" for ${ab(other(short))}.`
      + (pp ? ` ${scoped ? 'In those games' : measuredOver}, about 1 power play in ${pp} ended in a goal.` : '');
    return sit ? ' Both teams keep the same number of skaters.' : '';
  };

  const notes = new Map();
  const score = { [ctx.homeId]: 0, [ctx.awayId]: 0 };
  const tally = { att: { [ctx.homeId]: 0, [ctx.awayId]: 0 }, sog: { [ctx.homeId]: 0, [ctx.awayId]: 0 },
                  slot: { [ctx.homeId]: 0, [ctx.awayId]: 0 } };
  const toldWhy = new Set(), toldShift = new Set(), toldSlot = new Set(), toldRun = new Set();
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
    // 0. How a review of a goal ended, on the first frame of play after it.
    const review = reviewAt.get(n);
    if (!say && review && !review.onGoal) {
      say = challengeSay(review, ab, score, ctx, census.reviews && { ...census.reviews, games: census.games });
      if (review.penalty === n) say += strengthAfter(n, 'for those two minutes', /games we have measured/.test(say));
    }
    // 1. A goal: what it does to the score, and how long the puck had stayed in that end.
    if (!say && e.type === 'goal' && shooter) {
      score[shooter]++;
      const s = score[shooter], o = score[other(shooter)], t = ab(shooter);
      say = s === o ? `That ties the game, ${s}–${o}.` : s - o === 1 ? `That puts ${t} ahead, ${s}–${o}.`
        : s > o ? `${t} now leads ${s}–${o}.` : `${t} pulls within ${o - s}, ${s}–${o}.`;
      if (run && run.end === (shooter === aid ? 'h' : 'a')) say += stayWords(run, ctx, 'had');
      say += reboundSay(ev, n, shooter, ctx, ab) + drawSay(ev, n, ab) + longShiftSay(game, e, other(shooter), ab, SHIFT);
      if (STRENGTH.has(n)) say += ' ' + STRENGTH.get(n);
      if (review && review.onGoal) say += ` ${challengeSay(review, ab, score, ctx)}`;
    } else if (e.type === 'goal' && shooter) score[shooter]++;
    // 2. A penalty: what follows, said only as far as the record shows it.
    if (!say && e.type === 'penalty' && e.own != null) {
      const who = (ctx.roster[e.actor] || {}).nm, srv = e.srv != null && e.srv !== e.actor ? (ctx.roster[e.srv] || {}).nm : null;
      const mins = countOf(e.min || 2, 'minute');
      // A goalie or a bench penalty is served by a skater; the record names him (`srv`).
      say = !srv ? `${who ? who + ' sits' : 'A player sits'} in the penalty box for ${mins}.`
        : e.actor == null ? `${ab(e.own)} takes a bench penalty, so a skater serves it: ${srv} sits in the penalty box for ${mins}.`
        : (ctx.roster[e.actor] || {}).pos === 'G' ? `${who} takes a penalty. A goalie does not go to the penalty box, so a teammate serves it: ${srv} sits there for ${mins}.`
        : `${who} takes a penalty, and ${srv} serves it: he sits in the penalty box for ${mins}.`;
      say += strengthAfter(n, 'until then');
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
    } else if (!say && e.type === 'faceoff' && lastStop && lastStop.rsn && !PILL_SAYS.has(lastStop.rsn) && !REVIEWED.has(lastStop)
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
    // 5. A long run of play: once past 3 in 4 runs' events, again past 9 in 10 runs' seconds.
    if (!say && RUN && play && e.pt !== 'SO') {
      const k = ev.slice(play.from, n + 1).filter(markable).length, t = e.s - ev[play.from].s;
      const began = ev.slice(0, play.from).reverse().find(x => x.type !== 'faceoff');
      const since = began && began.type === 'period-start' ? 'since the period began' : 'since the last whistle';
      if (t > RUN.secs && !toldRun.has(play.from + ':2')) {
        toldRun.add(play.from + ':1'); toldRun.add(play.from + ':2');
        say = `Still no whistle after ${clockOf(t)} of play and ${k} events.`;
      } else if (k > RUN.events && !toldRun.has(play.from + ':1')) {
        toldRun.add(play.from + ':1');
        say = `${k} events and ${clockOf(t)} of play ${since}.`;
      }
    }
    // 6. The shift clock: every skater of one team out longer than a typical shift, once per group.
    if (!say && SHIFT) for (const tid of [hid, aid]) {
      const on = skatersOn(game, e, tid);
      if (on.length < 4 || Math.min(...on.map(x => x.on)) <= SHIFT) continue;
      const key = tid + ':' + on.map(x => x.p).sort().join();
      if (toldShift.has(key)) continue;
      toldShift.add(key);
      say = `Every ${ab(tid)} skater on the ice has been out longer than a typical shift (about ${SHIFT} seconds): ${secsSpan(on.map(x => x.on))}.`;
      break;
    }
    // 7. A zone stretch: the puck staying in one end, and the attempts in that time.
    if (!say && run) say = stayWords(run, ctx, 'has');
    const lead = shotLead(e, shooter, ctx.homeId);
    if (lead) say = say ? `${lead} ${say}` : lead;
    if (say) notes.set(n, say);
  });
  return notes;
}
