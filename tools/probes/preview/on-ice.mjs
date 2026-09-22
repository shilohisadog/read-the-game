// Can shifts tell us who was on the ice at each 5v5 attempt? Check against the sit code.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const S = process.argv[2];
const files = readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort();

let games = 0, noShifts = 0, att5 = 0;
const rules = { strict: 0, startIncl: 0, endIncl: 0 };   // on-ice counts exactly 5 v 5
let p2check = null;
const pc = {}; // player -> {cf, ca, team}
for (const f of files) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted) continue;
  games++;
  if (!p2check) p2check = g.events.find(e => e.per === 2 && e.type === 'faceoff');
  const sh = (g.shifts || []).filter(r => (g.roster[r.p] || {}).pos !== 'G');
  if (!sh.length) { noShifts++; continue; }
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const counted = corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted;
  for (const i of counted) {
    const e = g.events[i];
    if (e.sit !== '1551') continue;
    att5++;
    const t = e.s;
    const on = (test) => {
      const c = { [ctx.homeId]: [], [ctx.awayId]: [] };
      for (const r of sh) if (test(r) && c[r.t]) c[r.t].push(r.p);
      return c;
    };
    const variants = { strict: r => r.s < t && t < r.e, startIncl: r => r.s <= t && t < r.e, endIncl: r => r.s < t && t <= r.e };
    let chosen = null;
    for (const [k, fn] of Object.entries(variants)) {
      const c = on(fn);
      if (c[ctx.homeId].length === 5 && c[ctx.awayId].length === 5) { rules[k]++; if (k === 'endIncl') chosen = c; }
    }
    if (chosen) {
      const shooter = corsiTeam(e, g.roster);
      for (const tid of [ctx.homeId, ctx.awayId]) for (const p of chosen[tid]) {
        const x = (pc[p] ||= { cf: 0, ca: 0, team: tid });
        if (tid === shooter) x.cf++; else x.ca++;
      }
    }
  }
}
console.log('period-2 faceoff sample (is s game-elapsed?):', JSON.stringify(p2check));
console.log(`games ${games}, without skater shifts ${noShifts}, 5v5 attempts ${att5}`);
for (const [k, n] of Object.entries(rules)) console.log(`  ${k.padEnd(10)} exactly 5v5 on ice: ${n} of ${att5} = ${(100 * n / att5).toFixed(1)}%`);
const ps = Object.entries(pc).filter(([, x]) => x.cf + x.ca >= 500);
console.log(`players with >=500 on-ice 5v5 attempts (endIncl rule): ${ps.length} of ${Object.keys(pc).length}`);
const cf = ps.map(([, x]) => x.cf / (x.cf + x.ca)).sort((a, b) => a - b);
console.log(`  CF% range ${(100 * cf[0]).toFixed(1)}..${(100 * cf[cf.length - 1]).toFixed(1)}, middle half ${(100 * cf[Math.floor(cf.length / 4)]).toFixed(1)}..${(100 * cf[Math.floor(3 * cf.length / 4)]).toFixed(1)}`);
