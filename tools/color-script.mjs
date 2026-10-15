/**
 * DRAFT color-commentary rules over one period of a real game, printed as a
 * markdown table for reading (docs/color-script.md). Not used by the site.
 *   node tools/color-script.mjs <extract.json> [period]
 */
import { readFileSync } from 'node:fs';
const RT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const { framed } = await import(`${RT}/src/lib/layer.js`);
const { isHighDangerEvent } = await import(`${RT}/src/lib/layers/goaltending.js`);
const { penName } = await import(`${RT}/src/lib/penalties.js`);
const { WHY } = await import(`${RT}/src/lib/layers/whistle.js`);
const M = JSON.parse(readFileSync(`${RT}/data/measures.json`));
const G = JSON.parse(readFileSync(process.argv[2]));
const PER = +(process.argv[3] || 1);
const R = G.roster, HID = G.teams.home.id, AID = G.teams.away.id, H = G.teams.home.ab, A = G.teams.away.ab;
const ab = id => (id === HID ? H : id === AID ? A : '?');
const other = id => (id === HID ? AID : HID);
const nm = p => (R[p] ? R[p].nm : 'a player');
const ctx = { roster: R, homeId: HID, awayId: AID };
const SHIFT = M.census.shift.median;                      // 46
const PP = M.census.whistles;                             // ppGoals / ppChances
const ATT = new Set(['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot']);
const endOf = x => (x < -25 ? HID : x > 25 ? AID : null); // whose end (home defends -x)
const shooter = e => (R[e.actor] ? R[e.actor].tid : null);

function onIce(t, tid) {
  return G.shifts.filter(r => r.s <= t && t < r.e && R[r.p] && R[r.p].tid === tid && R[r.p].pos !== 'G')
    .map(r => ({ p: r.p, on: t - r.s }));
}
function said(e) {
  const t = ab(e.own), p = nm(e.actor);
  switch (e.type) {
    case 'faceoff': return `${t} won the faceoff (${p})`;
    case 'shot-on-goal': return `${ab(shooter(e))} shot on goal, saved (${p})`;
    case 'missed-shot': return `${ab(shooter(e))} shot and missed the net (${p})`;
    case 'blocked-shot': { const b = R[e.blk] && R[e.blk].tid;
      return b === shooter(e) ? `A ${ab(b)} shot hit a ${ab(b)} teammate (${nm(e.blk)})` : `${ab(b)} blocked a ${ab(shooter(e))} shot (${nm(e.blk)})`; }
    case 'hit': return `${t} player hit an opponent (${p})`;
    case 'giveaway': return `${t} lost the puck (${p})`;
    case 'takeaway': return `${t} took the puck away (${p})`;
    case 'goal': return `**${ab(shooter(e))} GOAL** (${p})`;
    case 'penalty': return `${t} penalty: ${penName(e.pen)} (${p})`;
    case 'period-end': return 'End of the period';
    default: return e.type;
  }
}

const ev = G.events;
const rows = [];
let score = { [HID]: 0, [AID]: 0 }, run = null, slotSeen = {}, tiredSaid = new Set(), whySaid = new Set();
let tally = { att: { [HID]: 0, [AID]: 0 }, sog: { [HID]: 0, [AID]: 0 }, slot: { [HID]: 0, [AID]: 0 } };
for (let n = 0; n < ev.length; n++) {
  const e = ev[n];
  if (e.per !== PER || !framed(e) || e.type === 'period-start') continue;
  const notes = [];
  // the stoppage just before this faceoff, if any
  const prev = ev[n - 1];
  if (e.type === 'faceoff') run = null;
  // zone stretch: consecutive placed events in one end within the play
  if (e.x != null && e.type !== 'faceoff') {
    const end = endOf(e.x);
    if (run && run.end === end && end) { run.n++; } else run = { end, n: 1, att: { [HID]: 0, [AID]: 0 } };
    if (ATT.has(e.type) && shooter(e)) run.att[shooter(e)]++;
  } else if (e.type === 'faceoff' && e.x != null) run = { end: endOf(e.x), n: 1, att: { [HID]: 0, [AID]: 0 } };
  const slotShot = (e.type === 'shot-on-goal' || e.type === 'missed-shot' || e.type === 'goal') && isHighDangerEvent(e, ctx);
  if (slotShot) tally.slot[shooter(e)]++;
  if (ATT.has(e.type) && shooter(e)) { tally.att[shooter(e)]++; if (e.type !== 'blocked-shot' && e.type !== 'missed-shot') tally.sog[shooter(e)]++; }

  // 1. goal
  if (e.type === 'goal') {
    const t = shooter(e); score[t]++;
    const s = score[t], o = score[other(t)];
    const state = s === o ? 'That ties the game.' : s - o === 1 && o === s - 1 && s === 1 && o === 0 ? `That puts ${ab(t)} ahead.` : s > o ? `${ab(t)} now leads ${s}–${o}.` : `${ab(t)} pulls within ${o - s}.`;
    const before = run && run.n >= 3 && run.end === other(t) ? ` The puck had stayed in the ${ab(other(t))} end for ${run.n} events in a row before it went in.` : '';
    notes.push(state + before);
  }
  // 2. penalty
  if (!notes.length && e.type === 'penalty') {
    const t = e.own;
    notes.push(`${nm(e.actor)} of ${ab(t)} goes to the penalty box for ${e.min} minutes. ${ab(t)} plays with one skater fewer until he is back — a "power play" for ${ab(other(t))}. Over the last three seasons, about 1 power play in ${Math.round(PP.ppChances / PP.ppGoals)} ended in a goal.`);
  }
  // 3. restart after a whistle: explain the reason the first time it comes up
  if (!notes.length && e.type === 'faceoff') {
    let k = n - 1; while (k >= 0 && ev[k].type !== 'stoppage' && ev[k].type !== 'faceoff' && ev[k].type !== 'goal' && ev[k].type !== 'penalty' && ev[k].type !== 'period-start') k--;
    const stop = k >= 0 && ev[k].type === 'stoppage' ? ev[k] : null;
    if (stop && stop.rsn === 'icing') {
      const t = endOf(e.x); // the faceoff comes back to the icing team's end
      const mine = onIce(stop.s, t).map(x => x.on), fresh = onIce(stop.s + 1, other(t)).filter(x => x.on <= 1).length;
      notes.push(`${ab(t)} iced the puck: shot it from its own half all the way past the far goal line without anyone touching it. The faceoff comes back to the ${ab(t)} end, and ${ab(t)} may not swap players — its ${mine.length} skaters stay on, ${Math.min(...mine)} to ${Math.max(...mine)} seconds into their shift.${fresh ? ` ${ab(other(t))} sent out ${fresh} fresh skater${fresh > 1 ? 's' : ''}.` : ''}`);
    } else if (stop && stop.rsn === 'offside') {
      notes.push(`Play stopped for offside: an attacker crossed into the other team's end before the puck did. The faceoff moves out of that end.`);
    } else if (stop && !whySaid.has(stop.rsn)) {
      whySaid.add(stop.rsn);
      const w = WHY[stop.rsn];
      if (w && w.say) notes.push(`Why play stopped: ${w.say.replace(/\s+/g, ' ')}`);
    }
  }
  // 4. slot shot
  if (!notes.length && slotShot) {
    const t = shooter(e);
    if (!slotSeen[t]) { slotSeen[t] = 1;
      notes.push(`That shot came from the slot, the area right in front of the net. About 1 shot in ${Math.round(M.slot.scoredFromInside.n / M.slot.scoredFromInside.count)} from there goes in; from farther out, about 1 in ${Math.round(M.slot.scoredFromOutside.n / M.slot.scoredFromOutside.count)}.`);
    } else notes.push(`Another shot from the slot: ${ab(t)}'s ${tally.slot[t]}${['', 'st', 'nd', 'rd'][tally.slot[t]] || 'th'} tonight.`);
  }
  // 5. shift clock: every skater of one team past a typical shift
  if (!notes.length) for (const t of [HID, AID]) {
    const on = onIce(e.s, t); if (on.length < 4) continue;
    const least = Math.min(...on.map(x => x.on)), key = t + ':' + on.map(x => x.p).sort().join();
    if (least > SHIFT && !tiredSaid.has(key)) { tiredSaid.add(key);
      notes.push(`Every ${ab(t)} skater on the ice has now been out more than ${SHIFT} seconds (${least === Math.max(...on.map(x => x.on)) ? `all ${least}` : `${least} to ${Math.max(...on.map(x => x.on))}`}). A typical shift lasts about ${SHIFT} seconds; hockey is played in short bursts.`); break; }
  }
  // 6. zone stretch
  if (!notes.length && run && run.end && run.n >= 3 && e.type !== 'faceoff') {
    const atk = other(run.end), a = run.att[atk], d = run.att[run.end];
    notes.push(`The puck has stayed in the ${ab(run.end)} end for ${run.n} events in a row; in that time ${ab(atk)} has ${a || 'no'} shot attempt${a === 1 ? '' : 's'}${d ? ` and ${ab(run.end)} ${d}` : ''}.`);
  }
  // 7. end of period
  if (e.type === 'period-end') {
    notes.length = 0;
    notes.push(`After the period: shots on goal ${A} ${tally.sog[AID]}, ${H} ${tally.sog[HID]}; all shot attempts ${A} ${tally.att[AID]}, ${H} ${tally.att[HID]}; from the slot ${A} ${tally.slot[AID]}, ${H} ${tally.slot[HID]}.`);
  }
  rows.push([e.rem, said(e), notes[0] || '']);
}
rows.push(['00:00', 'End of the period', `After the period: shots on goal ${A} ${tally.sog[AID]}, ${H} ${tally.sog[HID]}; all shot attempts ${A} ${tally.att[AID]}, ${H} ${tally.att[HID]}; shots from the slot ${A} ${tally.slot[AID]}, ${H} ${tally.slot[HID]}.`]);
console.log(`| Clock | What happened | Color |\n|---|---|---|`);
for (const r of rows) console.log(`| ${r[0]} | ${r[1]} | ${r[2]} |`);
const spoken = rows.filter(r => r[2]).length;
console.error(`frames ${rows.length}, with a color note ${spoken} (${(100 * spoken / rows.length).toFixed(0)}%)`);
