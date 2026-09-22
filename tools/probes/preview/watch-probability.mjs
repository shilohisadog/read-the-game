// CHENG's Q1 (docs/preview-and-corsi.md §9): "watch for" is a claim about ONE game, so measure
// how often one game shows the thing -- for the club measures and for the two universal items.
//   node tools/probes/preview/watch-probability.mjs DIR
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const { measureGame } = await import(R + 'builders/measure.mjs');
const { BLUE_LINE_X } = await import(R + 'src/lib/rink.js');
const { situation, POWER_PLAY } = await import(R + 'src/lib/strength.js');
const S = process.argv[2];

// a whistle ends the run of play that a face-off starts (census.js's window: faceoff -> next whistle)
const ENDS = new Set(['stoppage', 'goal', 'penalty', 'period-end', 'game-end', 'faceoff']);

const rows = {};                      // club -> per-game rows
const draws = { all: blank(), five: blank() };
function blank() { return { n: 0, anyAtt: 0, firstByAttacker: 0, attackerMore: 0 }; }
const trail = { games: 0, out: 0, games5: 0, out5: 0, both: 0, pushed: 0 };

for (const f of readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted) continue;
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const side = { [ctx.homeId]: 'h', [ctx.awayId]: 'a' };
  const counted = new Set(corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted);
  const rec = measureGame(g);
  const r = { h: row(), a: row() };
  r.h.slot = rec.slot.h; r.a.slot = rec.slot.a; r.h.located = rec.located.h; r.a.located = rec.located.a;

  let gh = 0, ga = 0;
  g.events.forEach((e, i) => {
    if (e.type === 'penalty' && e.min && side[e.own]) r[side[e.own]].pens++;
    if (counted.has(i)) {
      const s = side[corsiTeam(e, g.roster)];
      if (s) {
        const o = s === 'h' ? 'a' : 'h';
        r[s].att++; if ((g.roster[e.actor] || {}).pos === 'D') r[s].dAtt++;
        if (e.sit === '1551') { r[s].cf5++; r[o].ca5++; }
        const mine = s === 'h' ? gh : ga, theirs = s === 'h' ? ga : gh;
        if (mine < theirs) r[s].trailAtt++; else if (mine > theirs) r[o].trailOpp++;
        else { r[s].levelAtt++; r[o].levelOpp++; }
      }
    }
    if (e.type === 'goal' && e.pt !== 'SO' && side[e.own]) {
      const st = situation(e.sit, ctx);
      if (st && st.kind === POWER_PLAY && st.advantage === e.own) r[side[e.own]].ppg++;
      if (side[e.own] === 'h') gh++; else ga++;
    }
    // Faceoff location: an END-ZONE draw, seen from the club ATTACKING that end.
    if (e.type === 'faceoff' && e.x != null && Math.abs(e.x) >= BLUE_LINE_X && e.pt !== 'SO') {
      const attacker = e.x <= -BLUE_LINE_X ? ctx.awayId : ctx.homeId;   // home defends -x
      let first = null, att = { [ctx.homeId]: 0, [ctx.awayId]: 0 };
      for (let k = i + 1; k < g.events.length; k++) {
        const x = g.events[k];
        if (ENDS.has(x.type) && !counted.has(k)) break;
        if (counted.has(k)) {
          const t = corsiTeam(x, g.roster); if (t in att) { att[t]++; if (first == null) first = t; }
          if (x.type === 'goal') break;
        }
      }
      const defender = attacker === ctx.homeId ? ctx.awayId : ctx.homeId;
      for (const b of e.sit === '1551' ? [draws.all, draws.five] : [draws.all]) {
        b.n++; if (first != null) b.anyAtt++; if (first === attacker) b.firstByAttacker++;
        if (att[attacker] > att[defender]) b.attackerMore++;
      }
    }
  });
  if (rec.attempts.h !== r.h.att || rec.attempts.a !== r.a.att) throw new Error('attempts disagree with measureGame ' + g.game.id);
  // the trailing push, per club-game: did the club out-attempt its opponent while trailing?
  for (const s of ['h', 'a']) {
    const x = r[s], n = x.trailAtt + x.trailOpp;
    if (n > 0) { trail.games++; if (x.trailAtt > x.trailOpp) trail.out++; }
    if (n >= 10) { trail.games5++; if (x.trailAtt > x.trailOpp) trail.out5++; }
    const nl = x.levelAtt + x.levelOpp;
    if (n >= 10 && nl >= 10) { trail.both++; if (x.trailAtt / n > x.levelAtt / nl) trail.pushed++; }
  }
  for (const s of ['h', 'a']) (rows[s === 'h' ? ctx.homeAb : ctx.awayAb] ||= []).push(r[s]);
}
function row() { return { pens: 0, ppg: 0, slot: 0, located: 0, dAtt: 0, att: 0, cf5: 0, ca5: 0,
  trailAtt: 0, trailOpp: 0, levelAtt: 0, levelOpp: 0 }; }

const sum = (rs, k) => rs.reduce((t, x) => t + x[k], 0);
const M = {
  'defencemen share':   [rs => sum(rs, 'dAtt') / sum(rs, 'att'), x => x.att ? x.dAtt / x.att : null],
  'club 5-on-5 CF%':    [rs => sum(rs, 'cf5') / (sum(rs, 'cf5') + sum(rs, 'ca5')), x => (x.cf5 + x.ca5) ? x.cf5 / (x.cf5 + x.ca5) : null],
  'slot share':         [rs => sum(rs, 'slot') / sum(rs, 'located'), x => x.located ? x.slot / x.located : null],
  'penalties taken':    [rs => sum(rs, 'pens') / rs.length, x => x.pens],
  'power-play goals':   [rs => sum(rs, 'ppg') / rs.length, x => x.ppg],
};
const all = Object.values(rows).flat();
console.log('Q1 -- in what share of a club\'s single games does the game land on the club\'s side of the league?');
console.log('     (clubs outside the middle half only; a game exactly AT the league value counts as not showing)');
for (const [name, [season, game]] of Object.entries(M)) {
  const league = season(all);
  const v = Object.entries(rows).map(([c, rs]) => [c, season(rs)]).sort((a, b) => a[1] - b[1]);
  const lo = v[8][1], hi = v[23][1];              // 32 clubs: outside ranks 9..24 is outside the middle half
  const shows = [];
  for (const [c, val] of v) {
    if (val > lo && val < hi) continue;
    const up = val > league;
    const gs = rows[c].map(game).filter(x => x != null);
    const k = gs.filter(x => (up ? x > league : x < league)).length;
    shows.push([c, k / gs.length, gs.length, val]);
  }
  shows.sort((a, b) => a[1] - b[1]);
  const med = shows[Math.floor(shows.length / 2)][1];
  const ext = [v[0], v[v.length - 1]].map(([c]) => shows.find(s => s[0] === c));
  const pct = x => (100 * x).toFixed(0) + '%';
  console.log(`  ${name.padEnd(18)} league ${league.toFixed(3)} | flagged clubs: min ${pct(shows[0][1])} median ${pct(med)} max ${pct(shows[shows.length - 1][1])}`
    + ` | most extreme: ${ext.map(s => `${s[0]} ${pct(s[1])} of ${s[2]}`).join(', ')}`);
}
const p = (a, b) => `${a} of ${b} = ${(100 * a / b).toFixed(1)}%`;
console.log('\nUniversal: the trailing push, per club-game');
console.log(`  out-attempted the opponent while trailing (any trailing time):   ${p(trail.out, trail.games)}`);
console.log(`  same, club-games with >=10 attempts while trailing:              ${p(trail.out5, trail.games5)}`);
console.log(`  share while trailing > share while level (>=10 attempts in each): ${p(trail.pushed, trail.both)}`);
console.log('\nUniversal: faceoff LOCATION, end-zone draws seen from the club attacking that end (window: draw -> next whistle)');
for (const [k, b] of Object.entries(draws)) {
  console.log(`  ${k === 'all' ? 'all situations' : 'strict 5-on-5 '}: draws ${b.n} | any attempt before the whistle ${p(b.anyAtt, b.n)}`
    + ` | first attempt by the attacker ${p(b.firstByAttacker, b.n)} (${(100 * b.firstByAttacker / b.anyAtt).toFixed(1)}% of runs with an attempt)`
    + ` | attacker out-attempts ${p(b.attackerMore, b.n)}`);
}
