// The shift-boundary convention, witnessed by EVERY event that names a player, split by event
// type. The convention is a property of the shift record, not of a side, so a hit or a
// takeaway witnesses it as well as a shot. Only cases where the named player's own (non-zero)
// shift starts or ends on the event's second can discriminate; zero-length rows (8,366 of
// 8,405 sit on a goal's second) are excluded as markers, not shifts.
//   node tools/probes/preview/witness-by-event.mjs DIR
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const S = process.argv[2];
const out = {};
for (const f of readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted) continue;
  const byP = {};
  for (const x of g.shifts) if (x.e > x.s) (byP[x.p] ||= []).push(x);
  for (const e of g.events) {
    if (e.pt === 'SO') continue;
    for (const [role, p] of [['actor', e.actor], ['blk', e.blk], ['drew', e.drew]]) {
      if (p == null || (g.roster[p] || {}).pos === 'G') continue;
      const mine = byP[p] || [];
      const ends = mine.some(x => x.e === e.s), starts = mine.some(x => x.s === e.s);
      if (!ends && !starts) continue;
      const c = (out[`${e.type}${role === 'actor' ? '' : ' (' + role + ')'}`] ||= { endsOnly: 0, startsOnly: 0, both: 0 });
      if (ends && starts) c.both++; else if (ends) c.endsOnly++; else c.startsOnly++;
    }
  }
}
console.log('event (named player)      n   shift ENDS there (s<t<=e has them)   STARTS there (s<=t<e has them)   back-to-back');
for (const [k, c] of Object.entries(out).sort((a, b) => (b[1].endsOnly + b[1].startsOnly) - (a[1].endsOnly + a[1].startsOnly))) {
  const n = c.endsOnly + c.startsOnly + c.both, pct = x => (100 * x / n).toFixed(1).padStart(5) + '%';
  console.log(`${k.padEnd(22)} ${String(n).padStart(6)}   ${String(c.endsOnly).padStart(6)} ${pct(c.endsOnly)}                     ${String(c.startsOnly).padStart(6)} ${pct(c.startsOnly)}              ${c.both}`);
}
