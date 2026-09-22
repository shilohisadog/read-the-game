import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const S = process.argv[2];
let n = 0, differ = 0, shooterIn = { startIncl: 0, endIncl: 0 }, shooterKnown = 0, blockedSkipped = 0;
for (const f of readdirSync(join(S, 'ex')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  const sh = g.shifts.filter(r => (g.roster[r.p] || {}).pos !== 'G');
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id, homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  for (const i of corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted) {
    const e = g.events[i]; if (e.sit !== '1551') continue;
    const t = e.s;
    const A = new Set(sh.filter(r => r.s <= t && t < r.e).map(r => r.p));
    const B = new Set(sh.filter(r => r.s < t && t <= r.e).map(r => r.p));
    n++;
    const same = A.size === B.size && [...A].every(p => B.has(p));
    if (same) continue;
    differ++;
    // shooter witness: actor on a shot/miss/goal is the shooter; on blocked-shot, check which field is shooter
    if (e.type === 'blocked-shot') { blockedSkipped++; continue; }
    if (e.actor == null) continue;
    shooterKnown++;
    if (A.has(e.actor)) shooterIn.startIncl++;
    if (B.has(e.actor)) shooterIn.endIncl++;
  }
}
console.log(`5v5 attempts ${n}; the two rules name different skaters on ${differ} (${(100*differ/n).toFixed(1)}%)`);
console.log(`  of those, shooter witness usable on ${shooterKnown} (blocked skipped ${blockedSkipped})`);
console.log(`  shooter on ice under start-inclusive: ${shooterIn.startIncl} (${(100*shooterIn.startIncl/shooterKnown).toFixed(1)}%)`);
console.log(`  shooter on ice under end-inclusive:   ${shooterIn.endIncl} (${(100*shooterIn.endIncl/shooterKnown).toFixed(1)}%)`);
