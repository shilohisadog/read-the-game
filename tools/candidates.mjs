#!/usr/bin/env node
/**
 * Every candidate club row, measured the way the card's own rows are: games to
 * settle at TARGET under both splits (reliability.js), the venue check, and how
 * closely each tracks the three rows the card shows (agreement). A measurement:
 * writes nothing. The definitions are docs/what-settles.md §2's 47.
 *
 *   node tools/candidates.mjs <dir-with-extract/> [--json]
 *
 * Venue: for each building-season, the home club's figure in its home games
 * against its visitors' figure in the same games, correlated (season-centred).
 * High means the arena's scorer moves both. A share of both clubs is -1 by
 * construction and says nothing, so it is not reported.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { measureGame } from '../builders/measure.mjs';
import { inScope, isPlayoff, season } from '../src/lib/archive.js';
import { reliability, agreement, TARGET, ADMISSION } from '../src/lib/reliability.js';
import { CLUB_ROWS } from '../src/lib/preview.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { corsiTeam } from '../src/lib/attribution.js';
import { attackZone, attackDirection, distanceToNet, isHighDanger } from '../src/lib/rink.js';
import { situation, POWER_PLAY } from '../src/lib/strength.js';

const SHOT = new Set(['goal', 'shot-on-goal', 'missed-shot']);
const p = (count, n) => ({ count, n });

/** Per game: {key: {h: {count, n}, a: {count, n}}}. */
export function candidatesOf(g) {
  const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                homeAb: g.teams.home.ab, awayAb: g.teams.away.ab };
  const m = measureGame(g);
  const sideOf = id => (id === ctx.homeId ? 'h' : id === ctx.awayId ? 'a' : null);
  const idOf = s => (s === 'h' ? ctx.homeId : ctx.awayId);
  const opp = s => (s === 'h' ? 'a' : 'h');
  const z = () => ({ h: 0, a: 0 });
  const t = {
    att: z(), att5: z(), unb: z(), unb5: z(), unb5L: z(), sogEv: z(), sog5: z(), g5: z(),
    d: z(), d5: z(), miss: z(), pp: z(), hits: z(), take: z(), give: z(), pen: z(),
    oz: z(), dz: z(), nz: z(), oz5: z(), dz5: z(), nzWon: z(), dzWon: z(), feet: z(), located: z(),
    slot5: z(), loc5: z(),
  };
  let draws = 0;
  const attempts = new Set(corsi.reduce(g.events, { ...ctx, evenOnly: false }).counted);
  let hs = 0, as = 0;   // the running score, before each event
  g.events.forEach((e, i) => {
    if (e.pt === 'SO') return;
    const at5 = e.sit === '1551', level = hs === as;
    if (attempts.has(i)) {
      const s = sideOf(corsiTeam(e, g.roster));
      if (s) {
        t.att[s]++; if (at5) t.att5[s]++;
        const pos = (g.roster[e.actor] || {}).pos;
        if (pos === 'D') { t.d[s]++; if (at5) t.d5[s]++; }
        if (e.type === 'missed-shot') t.miss[s]++;
        const sit = situation(e.sit, ctx);
        if (sit && sit.kind === POWER_PLAY && sit.advantage === idOf(s)) t.pp[s]++;
        if (SHOT.has(e.type)) {
          t.unb[s]++; if (at5) { t.unb5[s]++; if (level) t.unb5L[s]++; }
          if (e.x != null && e.y != null) {
            const dir = attackDirection(idOf(s), ctx.homeId);
            t.feet[s] += distanceToNet(e.x, e.y, dir); t.located[s]++;
            if (at5) { t.loc5[s]++; if (isHighDanger(e.x, e.y, dir)) t.slot5[s]++; }
          }
        }
        if (e.type === 'goal' || e.type === 'shot-on-goal') { t.sogEv[s]++; if (at5) t.sog5[s]++; }
        if (e.type === 'goal' && at5) t.g5[s]++;
      }
    }
    const own = sideOf(e.own);
    if (e.type === 'hit' && own) t.hits[own]++;
    if (e.type === 'takeaway' && own) t.take[own]++;
    if (e.type === 'giveaway' && own) t.give[own]++;
    if (e.type === 'penalty' && own && e.min) t.pen[own]++;
    if (e.type === 'faceoff' && e.x != null && e.y != null) {
      draws++;
      for (const s of ['h', 'a']) {
        const zone = attackZone(e.x, attackDirection(idOf(s), ctx.homeId));
        if (zone === 'O') { t.oz[s]++; if (at5) t.oz5[s]++; }
        if (zone === 'D') { t.dz[s]++; if (at5) t.dz5[s]++; if (own === s) t.dzWon[s]++; }
        if (zone === 'N') { t.nz[s]++; if (own === s) t.nzWon[s]++; }
      }
    }
    if (e.type === 'goal') { if (sideOf(e.own) === 'h') hs++; else if (sideOf(e.own) === 'a') as++; }
  });

  const shifts = {}, secs = {};
  if (Array.isArray(g.shifts) && g.shifts.length) {
    for (const sh of g.shifts) {
      const s = sideOf(sh.t);
      if (!s || (g.roster[sh.p] || {}).pos === 'G') continue;
      shifts[s] = (shifts[s] || 0) + 1; secs[s] = (secs[s] || 0) + (sh.e - sh.s);
    }
  }
  const sc = m.score, qs = m.sog;
  const won = s => (s === 'h' ? sc.h > sc.a : sc.a > sc.h);
  const out = {};
  const both = (key, f) => { out[key] = { h: f('h'), a: f('a') }; };
  const share = (x, s) => p(x[s], x.h + x.a);
  const rowOf = key => CLUB_ROWS.find(r => r.key === key);

  both('avgShiftLen', s => p(secs[s] || 0, shifts[s] || 0));
  both('shiftsPerGame', s => p(shifts[s] || 0, shifts[s] ? 1 : 0));
  both('attemptDiffPerGame', s => p(t.att[s] - t.att[opp(s)], 1));
  both('dmen', s => rowOf('dmen').ofGame(m, s));
  both('corsi5v5', s => share(t.att5, s));
  both('attemptsForPerGame', s => p(t.att[s], 1));
  both('fenwickShare', s => share(t.unb, s));
  both('dmen5v5', s => p(t.d5[s], t.att5[s]));
  both('hitsAgainstPerGame', s => p(t.hits[opp(s)], 1));
  both('fenwick5v5', s => share(t.unb5, s));
  both('attemptsAgainstPerGame', s => p(t.att[opp(s)], 1));
  both('blocksPerGame', s => p(m.blocks[s] || 0, 1));
  both('level5', s => rowOf('level5').ofGame(m, s));
  both('ozStartShare', s => p(t.oz[s], t.oz[s] + t.dz[s]));
  both('sogShare', s => (Number.isFinite(qs.h) && Number.isFinite(qs.a) ? share(qs, s) : p(0, 0)));
  both('sogShareEvents', s => share(t.sogEv, s));
  both('slot', s => rowOf('slot').ofGame(m, s));
  both('ozStartShare5v5', s => p(t.oz5[s], t.oz5[s] + t.dz5[s]));
  both('sog5v5', s => share(t.sog5, s));
  both('takeawaysPerGame', s => p(t.take[s], 1));
  both('unblockedAgainstPerGame', s => p(t.unb[opp(s)], 1));
  both('hitsPerGame', s => p(t.hits[s], 1));
  both('fenwick5v5Level', s => share(t.unb5L, s));
  both('ozStartOfAll', s => p(t.oz[s], draws));
  both('slot5v5', s => p(t.slot5[s], t.loc5[s]));
  both('goalDiffPerGame', s => p(sc[s] - sc[opp(s)], 1));
  both('slotAgainst', s => p(m.slot[opp(s)], m.located[opp(s)]));
  both('sogAgainstPerGame', s => (Number.isFinite(qs[opp(s)]) ? p(qs[opp(s)], 1) : p(0, 0)));
  both('shotDistance', s => p(t.feet[s], t.located[s]));
  both('pointsPct', s => p(won(s) ? 2 : (m.end !== 'REG' ? 1 : 0), 2));
  both('puckWinShare', s => p(t.take[s], t.take[s] + t.give[s]));
  both('dmenAgainst', s => p(t.d[opp(s)], t.att[opp(s)]));
  both('goalsForPerGame', s => p(sc[s], 1));
  both('goalsForShare5v5', s => share(t.g5, s));
  both('giveawaysPerGame', s => p(t.give[s], 1));
  both('drawsPerGame', () => p(draws, 1));
  both('goalsAgainstPerGame', s => p(sc[opp(s)], 1));
  both('giveawayShare', s => share(t.give, s));
  both('shotDistanceAgainst', s => p(t.feet[opp(s)], t.located[opp(s)]));
  both('takeawayShare', s => share(t.take, s));
  both('nzFaceoffWin', s => p(t.nzWon[s], t.nz[s]));
  both('dzFaceoffWin', s => p(t.dzWon[s], t.dz[s]));
  both('missed', s => p(t.miss[s], t.att[s]));
  both('ppAttemptShare', s => p(t.pp[s], t.att[s]));
  both('shootPct5v5', s => p(t.g5[s], t.sog5[s]));
  both('penaltyDiffShare', s => share({ h: t.pen.a, a: t.pen.h }, s));
  both('savePct5v5', s => p(t.sog5[opp(s)] - t.g5[opp(s)], t.sog5[opp(s)]));
  return { id: g.game.id, date: g.game.date, homeAb: ctx.homeAb, awayAb: ctx.awayAb, c: out };
}

/** Keys whose two sides are complements of one share: venue is -1 by construction. */
const SHARES = new Set(['corsi5v5', 'fenwickShare', 'fenwick5v5', 'level5', 'sogShare',
  'sogShareEvents', 'sog5v5', 'fenwick5v5Level', 'goalsForShare5v5', 'giveawayShare',
  'takeawayShare', 'penaltyDiffShare', 'attemptDiffPerGame', 'goalDiffPerGame',
  'ozStartShare', 'ozStartShare5v5', 'pointsPct', 'drawsPerGame']);

function centred(values, seasons) {
  const sum = {}, n = {};
  values.forEach((v, i) => { sum[seasons[i]] = (sum[seasons[i]] || 0) + v; n[seasons[i]] = (n[seasons[i]] || 0) + 1; });
  return values.map((v, i) => v - sum[seasons[i]] / n[seasons[i]]);
}
function pearson(x, y) {
  const n = x.length; if (n < 3) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let a = 0, b = 0, c = 0;
  for (let i = 0; i < n; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; }
  return b > 0 && c > 0 ? a / Math.sqrt(b * c) : null;
}

/**
 * The club's figure against its opponents' in the same games, per club-season:
 * at HOME (`where` 'h') or on the ROAD ('a'). A figure the arena's scorer moves
 * couples at home only; one both teams share within any game (the stoppages that
 * end both teams' shifts) couples on the road just as much.
 */
export function venue(records, key, where = 'h') {
  const finished = new Set(records.filter(g => isPlayoff(g.id)).map(g => season(g.id)));
  const by = new Map();
  for (const g of records) {
    const yr = season(g.id);
    if (!finished.has(yr) || isPlayoff(g.id)) continue;
    const k = yr + ':' + (where === 'h' ? g.homeAb : g.awayAb);
    const b = by.get(k) || by.set(k, { yr, h: [0, 0], a: [0, 0] }).get(k);
    const v = g.c[key], me = v[where], them = v[where === 'h' ? 'a' : 'h'];
    b.h[0] += me.count; b.h[1] += me.n; b.a[0] += them.count; b.a[1] += them.n;
  }
  const rows = [...by.values()].filter(b => b.h[1] > 0 && b.a[1] > 0);
  const yrs = rows.map(b => b.yr);
  return pearson(centred(rows.map(b => b.h[0] / b.h[1]), yrs), centred(rows.map(b => b.a[0] / b.a[1]), yrs));
}

export function measure(records) {
  const keys = Object.keys(records[0].c);
  const rows = keys.map(key => ({ key, ofGame: (g, s) => g.c[key][s] }));
  const rel = reliability(records, rows);
  const shown = ['level5', 'dmen', 'slot'];
  const ag = agreement(records, rows);
  const with3 = {};
  for (const pr of ag.pairs) {
    for (const [x, y] of [[pr.a, pr.b], [pr.b, pr.a]]) {
      if (shown.includes(y)) (with3[x] ||= {})[y] = pr.r;
    }
  }
  return keys.map(key => {
    const r = rel.rows[key] || {};
    return { key, games: r.games ?? null, r: r.r ?? null,
             alternate: (r.alternate && r.alternate.games) ?? null,
             venue: SHARES.has(key) ? null : venue(records, key, 'h'),
             road: SHARES.has(key) ? null : venue(records, key, 'a'),
             with: with3[key] || {} };
  }).sort((a, b) => (a.games ?? 1e9) - (b.games ?? 1e9));
}

function main(argv) {
  const dir = argv[0];
  if (!dir) { console.error('usage: node tools/candidates.mjs <dir-with-extract/> [--json]'); process.exit(2); }
  const ex = join(dir, 'extract');
  const records = [];
  for (const f of readdirSync(ex)) {
    const g = JSON.parse(readFileSync(join(ex, f), 'utf8'));
    if (inScope(g.game.id) && g.quoted) records.push(candidatesOf(g));
  }
  const out = measure(records);
  if (argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); return; }
  const f = v => (v == null ? '   —' : (v >= 0 ? ' ' : '') + v.toFixed(2));
  const g = v => (v == null ? '  —' : String(v).padStart(4));
  console.log(`  target r=${TARGET}, admission ${ADMISSION} games; ${records.length} games`);
  console.log('  ' + 'candidate'.padEnd(25) + 'chrono  alt   home   road  ~level5  ~dmen  ~slot');
  for (const c of out) {
    console.log('  ' + c.key.padEnd(25) + g(c.games) + '  ' + g(c.alternate) + ' ' + f(c.venue) + '  ' + f(c.road)
      + '   ' + f(c.with.level5) + '   ' + f(c.with.dmen) + '  ' + f(c.with.slot));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
