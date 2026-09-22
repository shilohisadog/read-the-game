// Preview probe: per-club profiles over 2025-26 regular season, with split-half
// reliability (odd vs even games of each club) and tonight's clubs vs the middle half.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const R = new URL('../../../', import.meta.url).pathname;
const { measureGame } = await import(R + 'builders/measure.mjs');
const { corsi } = await import(R + 'src/lib/layers/corsi.js');
const { corsiTeam } = await import(R + 'src/lib/attribution.js');
const { situation, POWER_PLAY } = await import(R + 'src/lib/strength.js');
const { icingRestarts, offsideRestarts } = await import(R + 'src/lib/layers/whistle.js');

const S = process.argv[2];
const sched = JSON.parse(readFileSync(join(S, 'schedule.json')));
const tonight = new Set(sched.upcoming.flatMap(g => [g.away, g.home]));

// per club, per game rows: {pens, ppg, slot, located, dAtt, att, trailAtt, trailOpp, levelAtt, levelOpp, icing, offside}
const rows = {}; let mism = 0;
const files = readdirSync(join(S, 'ex')).filter(f => f.endsWith('.json')).sort();
for (const f of files) {
  const g = JSON.parse(readFileSync(join(S, 'ex', f)));
  if (!g.quoted) continue;
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const rec = measureGame(g);
  const side = { [ctx.homeId]: 'h', [ctx.awayId]: 'a' };
  const ab = { h: ctx.homeAb, a: ctx.awayAb };
  const r = { h: blank(), a: blank() };
  r.h.slot = rec.slot?.h ?? NaN; r.a.slot = rec.slot?.a ?? NaN;
  // located comes from measureGame's own record if present
  if (rec.located) { r.h.located = rec.located.h; r.a.located = rec.located.a; }

  // penalties taken (box.js's admission rule, minus the NOT_BOX nuance: any penalty with minutes)
  for (const e of g.events) {
    if (e.type === 'penalty' && e.min && e.own != null && side[e.own]) r[side[e.own]].pens++;
  }
  // attempts: corsi's counted set, corsi's attribution; D share via roster pos (census rule);
  // score state at each attempt from the running non-shootout goal count BEFORE the event
  const counted = new Set(corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted);
  let gh = 0, ga = 0;
  g.events.forEach((e, i) => {
    if (counted.has(i)) {
      const t = corsiTeam(e, g.roster); const s = side[t];
      if (s) {
        const o = s === 'h' ? 'a' : 'h';
        r[s].att++;
        if ((g.roster[e.actor] || {}).pos === 'D') r[s].dAtt++;
        const mine = s === 'h' ? gh : ga, theirs = s === 'h' ? ga : gh;
        if (mine < theirs) r[s].trailAtt++;
        else if (mine > theirs) r[o].trailOpp++;   // o is trailing and this attempt is against it
        else { r[s].levelAtt++; r[o].levelOpp++; }
      }
    }
    if (e.type === 'goal' && e.pt !== 'SO' && e.own != null) {
      const s = side[e.own];
      if (s) {
        const sit = situation(e.sit, ctx);
        if (sit && sit.kind === POWER_PLAY && sit.advantage === e.own) r[s].ppg++;
        if (s === 'h') gh++; else ga++;
      }
    }
  });
  if (r.h.att !== rec.attempts.h || r.a.att !== rec.attempts.a) mism++;
  for (const x of icingRestarts(g.events, ctx)) if (x.offender) r[x.offender === ab.h ? 'h' : 'a'].icing++;
  for (const x of offsideRestarts(g.events, ctx)) if (x.offender) r[x.offender === ab.h ? 'h' : 'a'].offside++;

  for (const s of ['h', 'a']) (rows[ab[s]] ||= []).push({ id: g.game.id, ...r[s] });
}
function blank() { return { pens: 0, ppg: 0, slot: 0, located: 0, dAtt: 0, att: 0,
  trailAtt: 0, trailOpp: 0, levelAtt: 0, levelOpp: 0, icing: 0, offside: 0 }; }

// PUSH is a difference of SHARES, not of rates: attempts per game while trailing is confounded by
// how long a club spent trailing. trailing share = trailAtt / (trailAtt + trailOpp), where trailOpp
// is the opponent's attempts while this club trailed (credited from the leader's side above);
// level share likewise. push = trailing share - level share.

const MEASURES = {
  'penalties taken / game':   rs => sum(rs, 'pens') / rs.length,
  'power-play goals / game':  rs => sum(rs, 'ppg') / rs.length,
  'slot share of located':    rs => sum(rs, 'slot') / sum(rs, 'located'),
  'defencemen share of att':  rs => sum(rs, 'dAtt') / sum(rs, 'att'),
  'push: trail share - level share': rs => sum(rs, 'trailAtt') / (sum(rs, 'trailAtt') + sum(rs, 'trailOpp'))
                                          - sum(rs, 'levelAtt') / (sum(rs, 'levelAtt') + sum(rs, 'levelOpp')),
  'icings committed / game':  rs => sum(rs, 'icing') / rs.length,
  'offsides committed / game': rs => sum(rs, 'offside') / rs.length,
};
function sum(rs, k) { return rs.reduce((t, r) => t + r[k], 0); }
function q(sorted, p) { const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }
function pearson(x, y) { const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my);
  sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }

const clubs = Object.keys(rows).sort();
const nGames = files.length;
console.log(`attempt mismatches vs measureGame: ${mism}`);
console.log(`games ${nGames}, clubs ${clubs.length}, games/club ${Math.min(...clubs.map(c => rows[c].length))}-${Math.max(...clubs.map(c => rows[c].length))}`);
console.log(`tonight: ${[...tonight].sort().join(' ')} (${tonight.size})\n`);
const flags = {};
for (const [name, fn] of Object.entries(MEASURES)) {
  const v = Object.fromEntries(clubs.map(c => [c, fn(rows[c])]));
  const s = Object.values(v).sort((a, b) => a - b);
  const lo = q(s, 0.25), hi = q(s, 0.75);
  // split half: each club's games in date order, odd vs even
  const odd = clubs.map(c => fn(rows[c].filter((_, i) => i % 2 === 0)));
  const even = clubs.map(c => fn(rows[c].filter((_, i) => i % 2 === 1)));
  const r = pearson(odd, even), sb = 2 * r / (1 + r);   // Spearman-Brown to full season
  const out = [...tonight].sort().filter(c => v[c] < lo || v[c] > hi);
  for (const c of out) (flags[c] ||= []).push(`${name.split(' ')[0]}${v[c] > hi ? '+' : '-'}`);
  const f = x => (Math.abs(x) < 1 ? x.toFixed(3) : x.toFixed(2));
  console.log(`${name}\n  clubs min ${f(s[0])}  mid-half ${f(lo)}..${f(hi)}  max ${f(s[s.length - 1])}`
    + `\n  split-half r ${r.toFixed(2)} (full-season est ${sb.toFixed(2)})`
    + `\n  tonight outside mid-half: ${out.length}/16  ${out.map(c => c + (v[c] > hi ? '+' : '-')).join(' ')}\n`);
}
console.log('per matchup (items flagged, all measures):');
for (const g of sched.upcoming) {
  const a = flags[g.away] || [], h = flags[g.home] || [];
  console.log(`  ${g.away} at ${g.home}: ${a.length + h.length} items  | ${g.away}: ${a.join(', ') || '-'}  | ${g.home}: ${h.join(', ') || '-'}`);
}
