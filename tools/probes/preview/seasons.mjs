// CHENG's P2 and P3 (docs/preview-and-corsi.md §11), over every regular season in DIR.
//   P2  reliability per season and pooled; and whether alternating-game halves INFLATE it,
//       tested against a chronological split (first half of the season against the second).
//   P3  raw 5-on-5 CF% against 5-on-5 CF% at a level score (tiedControl's set narrowed to
//       `1551`), each against goal differential: does the trailing push make raw CF% mislead?
//   node tools/probes/preview/seasons.mjs DIR          (fetch.sh pulls 2025-26; see §11 for more)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { measureGame } = await import(R + 'builders/measure.mjs');
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { tiedControl } = await import(R + 'src/lib/layers/tied.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const { situation, POWER_PLAY } = await import(R + 'src/lib/strength.js');
const { offsideRestarts } = await import(R + 'src/lib/layers/whistle.js');
const S = process.argv[2];

const seasons = {};   // '2023' -> club -> [per-game rows, in date order]
for (const f of readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted || g.game.type !== 2) continue;
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const side = { [ctx.homeId]: 'h', [ctx.awayId]: 'a' }, ab = { h: ctx.homeAb, a: ctx.awayAb };
  const rec = measureGame(g);
  const r = { h: row(), a: row() };
  for (const s of ['h', 'a']) { r[s].slot = rec.slot[s]; r[s].located = rec.located[s]; }
  const counted = new Set(corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted);
  const level = new Set(tiedControl.reduce(g.events, ctx).counted);
  g.events.forEach((e, i) => {
    if (e.type === 'penalty' && e.min && side[e.own]) r[side[e.own]].pens++;
    if (counted.has(i)) {
      const s = side[corsiTeam(e, g.roster)];
      if (s) {
        const o = s === 'h' ? 'a' : 'h';
        r[s].att++; if ((g.roster[e.actor] || {}).pos === 'D') r[s].dAtt++;
        if (e.sit === '1551') { r[s].cf5++; r[o].ca5++; if (level.has(i)) { r[s].lf5++; r[o].la5++; } }
      }
    }
    if (e.type === 'goal' && e.pt !== 'SO' && side[e.own]) {
      const s = side[e.own], o = s === 'h' ? 'a' : 'h';
      r[s].gf++; r[o].ga++;
      const st = situation(e.sit, ctx);
      if (st && st.kind === POWER_PLAY && st.advantage === e.own) r[s].ppg++;
    }
  });
  for (const x of offsideRestarts(g.events, ctx)) if (x.offender) r[x.offender === ab.h ? 'h' : 'a'].offside++;
  const yr = String(g.game.id).slice(0, 4);
  for (const s of ['h', 'a']) ((seasons[yr] ||= {})[ab[s]] ||= []).push(r[s]);
}
function row() { return { pens: 0, ppg: 0, slot: 0, located: 0, dAtt: 0, att: 0, offside: 0,
  cf5: 0, ca5: 0, lf5: 0, la5: 0, gf: 0, ga: 0 }; }

const sum = (rs, k) => rs.reduce((t, x) => t + x[k], 0);
const M = {
  'penalties / game':         rs => sum(rs, 'pens') / rs.length,
  'power-play goals / game':  rs => sum(rs, 'ppg') / rs.length,
  'slot share':               rs => sum(rs, 'slot') / sum(rs, 'located'),
  'defencemen share':         rs => sum(rs, 'dAtt') / sum(rs, 'att'),
  'offsides / game':          rs => sum(rs, 'offside') / rs.length,
  '5-on-5 CF% (raw)':         rs => sum(rs, 'cf5') / (sum(rs, 'cf5') + sum(rs, 'ca5')),
  '5-on-5 CF% (level score)': rs => sum(rs, 'lf5') / (sum(rs, 'lf5') + sum(rs, 'la5')),
};
function pearson(x, y) { const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my);
  sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
// centre each season's values before pooling, so a league-wide shift between seasons is not read as a club trait
const centred = arr => { const m = arr.reduce((a, b) => a + b) / arr.length; return arr.map(v => v - m); };
const games = (r, half) => { const p1 = r / (half - (half - 1) * r); return R0 => R0 * (1 - p1) / (p1 * (1 - R0)); };

const yrs = Object.keys(seasons).sort();
console.log(`seasons ${yrs.join(', ')}; club-seasons ${yrs.reduce((t, y) => t + Object.keys(seasons[y]).length, 0)}`);
const allRows = yrs.flatMap(y => Object.values(seasons[y]).flat());
console.log('league, all seasons pooled: ' + Object.entries(M).map(([k, fn]) => `${k} ${fn(allRows).toFixed(3)}`).join(' | '));
console.log('\nP2 -- reliability of each measure. ALT = odd vs even games; CHRONO = first half vs second half.');
console.log('     per season (ALT) | pooled ALT r -> games to 0.7 | pooled CHRONO r -> games to 0.7');
for (const [name, fn] of Object.entries(M)) {
  const per = [], pa = [[], []], pc = [[], []];
  for (const y of yrs) {
    const cl = Object.keys(seasons[y]);
    const odd = cl.map(c => fn(seasons[y][c].filter((_, i) => i % 2 === 0)));
    const even = cl.map(c => fn(seasons[y][c].filter((_, i) => i % 2 === 1)));
    const h = c => Math.floor(seasons[y][c].length / 2);
    const first = cl.map(c => fn(seasons[y][c].slice(0, h(c))));
    const second = cl.map(c => fn(seasons[y][c].slice(h(c))));
    per.push(pearson(odd, even));
    pa[0].push(...centred(odd)); pa[1].push(...centred(even));
    pc[0].push(...centred(first)); pc[1].push(...centred(second));
  }
  const ra = pearson(...pa), rc = pearson(...pc);
  console.log(`  ${name.padEnd(26)} ${per.map(r => r.toFixed(2)).join(' ')} | ALT ${ra.toFixed(2)} -> ${games(ra, 41)(0.7).toFixed(0).padStart(3)}`
    + ` | CHRONO ${rc.toFixed(2)} -> ${rc > 0 ? games(rc, 41)(0.7).toFixed(0).padStart(3) : ' n/a'}`);
}

console.log('\nP3 -- raw vs level-score 5-on-5 CF%, against goal differential per game (club-seasons, centred by season)');
const raw = [], lvl = [], gd = [], gap = [];
let pairs = 0, disagree = 0, rawRight = 0, lvlRight = 0;
for (const y of yrs) {
  const cl = Object.keys(seasons[y]);
  const v = cl.map(c => { const rs = seasons[y][c];
    return { raw: M['5-on-5 CF% (raw)'](rs), lvl: M['5-on-5 CF% (level score)'](rs), gd: (sum(rs, 'gf') - sum(rs, 'ga')) / rs.length }; });
  raw.push(...centred(v.map(x => x.raw))); lvl.push(...centred(v.map(x => x.lvl))); gd.push(...centred(v.map(x => x.gd)));
  gap.push(...v.map(x => x.raw - x.lvl));
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    pairs++;
    const rOrd = Math.sign(v[i].raw - v[j].raw), lOrd = Math.sign(v[i].lvl - v[j].lvl), gOrd = Math.sign(v[i].gd - v[j].gd);
    if (rOrd !== lOrd) { disagree++; if (rOrd === gOrd) rawRight++; if (lOrd === gOrd) lvlRight++; }
  }
}
console.log(`  corr(raw CF5, goal diff)          ${pearson(raw, gd).toFixed(2)}`);
console.log(`  corr(level CF5, goal diff)        ${pearson(lvl, gd).toFixed(2)}`);
console.log(`  corr(raw - level, goal diff)      ${pearson(gap, gd).toFixed(2)}   (negative = raw inflates the clubs that are outscored)`);
console.log(`  club pairs in the same season: ${pairs}; raw and level disagree on which is higher: ${disagree} (${(100 * disagree / pairs).toFixed(1)}%)`);
console.log(`    of those, goal differential sides with raw ${rawRight}, with level ${lvlRight}`);
const byGd = gap.map((g, i) => [gd[i], g]).sort((a, b) => a[0] - b[0]);
const k = Math.floor(byGd.length / 4), mean = a => a.reduce((t, x) => t + x[1], 0) / a.length;
console.log(`  raw minus level, in CF% points: bottom quarter by goal diff ${(100 * mean(byGd.slice(0, k))).toFixed(2)}, top quarter ${(100 * mean(byGd.slice(-k))).toFixed(2)}`);
