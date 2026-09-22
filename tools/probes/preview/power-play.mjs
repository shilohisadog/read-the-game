// Kevin, 2026-09-22: power-play goals never settle within a season -- is there an industry
// power-play metric, computable from what we hold, that does? Reliability per metric over every
// regular season in DIR, split chronologically (first half against second) and by alternate game.
//   node tools/probes/preview/power-play.mjs DIR
//
// ⚠️ TIME IN A STATE is known at an event and assumed to hold until the next event in the same
// period -- census.js's stated assumption, for census.js's reason: the things that change strength
// (a penalty, a goal, a pulled goalie) are themselves events. An OPPORTUNITY is each entry into a
// power play for the club from any other state, so a 5-on-4 that becomes 5-on-3 is one, not two.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const { situation, POWER_PLAY } = await import(R + 'src/lib/strength.js');
const S = process.argv[2];

const seasons = {};
for (const f of readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted || g.game.type !== 2) continue;
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const side = { [ctx.homeId]: 'h', [ctx.awayId]: 'a' }, ab = { h: ctx.homeAb, a: ctx.awayAb };
  const r = { h: row(), a: row() };
  const counted = new Set(corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted);
  const ev = g.events.filter(e => e.pt !== 'SO');
  let prevAdv = null;                                  // club holding the advantage at the previous event
  ev.forEach((e, k) => {
    const st = situation(e.sit, ctx);
    const adv = st && st.kind === POWER_PLAY ? e.sit && side[st.advantage] : null;
    if (adv && adv !== prevAdv) r[adv].opp++;
    if (e.type !== 'period-start') prevAdv = adv;      // a new period does not open a new opportunity by itself
    const nx = ev[k + 1];
    if (adv && nx && nx.per === e.per && nx.s > e.s) { r[adv].ppSecs += nx.s - e.s; r[adv === 'h' ? 'a' : 'h'].pkSecs += nx.s - e.s; }
    const i = g.events.indexOf(e);
    if (counted.has(i) && adv) {
      const s = side[corsiTeam(e, g.roster)];
      if (s === adv) { r[s].ppAtt++; if (e.type === 'goal' || e.type === 'shot-on-goal') r[s].ppSog++; }
      else if (s) r[s].shAtt++;                         // an attempt BY the short-handed club
    }
    if (e.type === 'goal' && adv && side[e.own] === adv) { r[adv].ppg++; r[adv === 'h' ? 'a' : 'h'].pkGa++; }
  });
  const yr = String(g.game.id).slice(0, 4);
  for (const s of ['h', 'a']) {
    const o = s === 'h' ? 'a' : 'h';
    r[s].pkOpp = r[o].opp; r[s].pkAttAg = r[o].ppAtt;
    ((seasons[yr] ||= {})[ab[s]] ||= []).push(r[s]);
  }
}
function row() { return { opp: 0, ppg: 0, ppSecs: 0, ppAtt: 0, ppSog: 0, shAtt: 0, pkSecs: 0, pkGa: 0, pkOpp: 0, pkAttAg: 0 }; }

const sum = (rs, k) => rs.reduce((t, x) => t + x[k], 0);
const M = {
  'PP goals / game (the row today)': rs => sum(rs, 'ppg') / rs.length,
  'PP opportunities / game':         rs => sum(rs, 'opp') / rs.length,
  'PP% (goals / opportunities)':     rs => sum(rs, 'ppg') / sum(rs, 'opp'),
  'PP goals / 60 PP minutes':        rs => 3600 * sum(rs, 'ppg') / sum(rs, 'ppSecs'),
  'PP attempts / 60 PP minutes':     rs => 3600 * sum(rs, 'ppAtt') / sum(rs, 'ppSecs'),
  'PP shots on goal / 60 PP min':    rs => 3600 * sum(rs, 'ppSog') / sum(rs, 'ppSecs'),
  'PK% (1 - goals against / opps)':  rs => 1 - sum(rs, 'pkGa') / sum(rs, 'pkOpp'),
  'PK attempts against / 60 PK min': rs => 3600 * sum(rs, 'pkAttAg') / sum(rs, 'pkSecs'),
};
function pearson(x, y) { const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my);
  sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
const centred = a => { const m = a.reduce((t, v) => t + v) / a.length; return a.map(v => v - m); };
const need = r => { if (!(r > 0)) return null; const p1 = r / (41 - 40 * r); return 0.7 * (1 - p1) / (p1 * 0.3); };
const yrs = Object.keys(seasons).sort();
const all = yrs.flatMap(y => Object.values(seasons[y]).flat());
console.log(`seasons ${yrs.join(', ')}; club-seasons ${yrs.reduce((t, y) => t + Object.keys(seasons[y]).length, 0)}; league PP minutes per club-game ${(sum(all, 'ppSecs') / all.length / 60).toFixed(2)}, opportunities per club-game ${(sum(all, 'opp') / all.length).toFixed(2)}`);
console.log('metric                              league     club range (all seasons)   ALT r  CHRONO r  -> games to 0.7 (CHRONO)');
for (const [name, fn] of Object.entries(M)) {
  const pa = [[], []], pc = [[], []], vals = [];
  for (const y of yrs) {
    const cl = Object.keys(seasons[y]);
    vals.push(...cl.map(c => fn(seasons[y][c])));
    pa[0].push(...centred(cl.map(c => fn(seasons[y][c].filter((_, i) => i % 2 === 0)))));
    pa[1].push(...centred(cl.map(c => fn(seasons[y][c].filter((_, i) => i % 2 === 1)))));
    const h = c => Math.floor(seasons[y][c].length / 2);
    pc[0].push(...centred(cl.map(c => fn(seasons[y][c].slice(0, h(c))))));
    pc[1].push(...centred(cl.map(c => fn(seasons[y][c].slice(h(c))))));
  }
  const ra = pearson(...pa), rc = pearson(...pc), n = need(rc);
  const f = x => (Math.abs(x) < 1 ? x.toFixed(3) : x.toFixed(2));
  console.log(`${name.padEnd(34)} ${f(fn(all)).padStart(7)}   ${f(Math.min(...vals))}..${f(Math.max(...vals))}`.padEnd(72)
    + ` ${ra.toFixed(2).padStart(5)}  ${rc.toFixed(2).padStart(7)}  -> ${n == null ? 'never' : n.toFixed(0)}`);
}
