// Per-player Corsi rests on src/lib/onice.js -- the SHIPPED rule, imported, not restated.
// How often is the on-ice set at a strict 5-on-5 attempt sensitive to the one-second
// boundary at all, per side? Where the alternative convention names a different set on a
// side, that side's credit on that attempt rests on the convention rather than the record.
//   node tools/probes/preview/onice-uncertainty.mjs DIR
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { onIce } = await import(R + 'src/lib/onice.js');
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const S = process.argv[2];
const c = { n: 0, five: 0, goals: 0, att: { n: 0, sens: 0 }, def: { n: 0, sens: 0 } };
const pc = {};   // skater -> on-ice 5v5 attempts for / against, credited through onIce()
const ids = side => side.skaters.map(p => p.id).sort().join(',');
for (const f of readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted) continue;
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id, homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  for (const i of corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted) {
    const e = g.events[i]; if (e.sit !== '1551') continue;
    c.n++;
    const on = onIce(g, e);
    if (on.home.skaters.length === 5 && on.away.skaters.length === 5) {
      c.five++;
      const forHome = corsiTeam(e, g.roster) === ctx.homeId;
      for (const [side, isFor] of [['home', forHome], ['away', !forHome]])
        for (const p of on[side].skaters) { const x = (pc[p.id] ||= { cf: 0, ca: 0 }); if (isFor) x.cf++; else x.ca++; }
    }
    if (e.type === 'goal') { c.goals++; continue; }       // play ends: every shift closes on that second
    // the alternative reading of the same second: the arriving line
    const alt = onIce(g, { s: e.s, type: 'faceoff' });
    const shooterHome = corsiTeam(e, g.roster) === ctx.homeId;
    for (const [role, side] of [['att', shooterHome ? 'home' : 'away'], ['def', shooterHome ? 'away' : 'home']]) {
      c[role].n++; if (ids(on[side]) !== ids(alt[side])) c[role].sens++;
    }
  }
}
const p = (a, b) => `${a} of ${b} = ${(100 * a / b).toFixed(2)}%`;
console.log(`strict 5-on-5 attempts ${c.n}; onIce() gives exactly five a side on ${p(c.five, c.n)}`);
console.log(`goals ${c.goals} (play ends; convention witnessed at 100% by goals and penalties)`);
console.log(`non-goal attempts where the boundary changes the ATTACKING five: ${p(c.att.sens, c.att.n)}`);
console.log(`non-goal attempts where the boundary changes the DEFENDING five: ${p(c.def.sens, c.def.n)}`);
const ps = Object.values(pc).filter(x => x.cf + x.ca >= 500).map(x => x.cf / (x.cf + x.ca)).sort((a, b) => a - b);
const q = f => (100 * ps[Math.floor((ps.length - 1) * f)]).toFixed(1);
console.log(`skaters with >=500 on-ice strict 5-on-5 attempts: ${ps.length} of ${Object.keys(pc).length}; CF% ${q(0)}..${q(1)}, middle half ${q(.25)}..${q(.75)}`);
