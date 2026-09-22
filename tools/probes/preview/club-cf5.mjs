import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const S = process.argv[2];
const rows = {};
let all5 = 0, allSit = 0, tiedWin = 0;
for (const f of readdirSync(join(S, 'ex')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id, homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const c = { [ctx.homeId]: 0, [ctx.awayId]: 0 };
  for (const i of corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted) {
    allSit++; const e = g.events[i]; if (e.sit !== '1551') continue; all5++;
    const t = corsiTeam(e, g.roster); if (t in c) c[t]++;
  }
  for (const [tid, o] of [[ctx.homeId, ctx.awayId], [ctx.awayId, ctx.homeId]]) {
    const ab = tid === ctx.homeId ? ctx.homeAb : ctx.awayAb;
    (rows[ab] ||= []).push({ cf: c[tid], ca: c[o] });
  }
}
const fn = rs => { const f = rs.reduce((t, r) => t + r.cf, 0), a = rs.reduce((t, r) => t + r.ca, 0); return f / (f + a); };
const clubs = Object.keys(rows);
const v = clubs.map(k => fn(rows[k])).sort((a, b) => a - b);
const q = p => { const i = (v.length - 1) * p, lo = Math.floor(i); return v[lo] + (v[Math.ceil(i)] - v[lo]) * (i - lo); };
const odd = clubs.map(k => fn(rows[k].filter((_, i) => i % 2 === 0))), even = clubs.map(k => fn(rows[k].filter((_, i) => i % 2 === 1)));
const n = odd.length, mo = odd.reduce((a, b) => a + b) / n, me = even.reduce((a, b) => a + b) / n;
let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (odd[i] - mo) * (even[i] - me); sxx += (odd[i] - mo) ** 2; syy += (even[i] - me) ** 2; }
const r = sxy / Math.sqrt(sxx * syy), p1 = r / (41 - 40 * r), need = R => R * (1 - p1) / (p1 * (1 - R));
const per = all5 / 1312;
console.log(`5v5 attempts ${all5} of ${allSit} all-situation (${(100*all5/allSit).toFixed(1)}%), ${per.toFixed(1)} per game both clubs`);
console.log(`club 5v5 CF% min ${(100*v[0]).toFixed(1)} mid-half ${(100*q(.25)).toFixed(1)}..${(100*q(.75)).toFixed(1)} max ${(100*v[v.length-1]).toFixed(1)}`);
console.log(`split-half r ${r.toFixed(2)}, full-season ${(2*r/(1+r)).toFixed(2)}, games to 0.5: ${need(.5).toFixed(0)}, to 0.7: ${need(.7).toFixed(0)}`);
console.log(`mid-half gap in attempts per game: ${((q(.75)-q(.25))*per).toFixed(1)}; full range: ${((v[v.length-1]-v[0])*per).toFixed(1)}`);
