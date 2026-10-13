#!/usr/bin/env node
/**
 * Hold our per-game figures against the league's (`tools/league_figures.py`),
 * over every in-scope extract in a directory. A measurement: writes nothing.
 *
 *   node tools/league-witness.mjs <league.json> <dir-with-extract/>
 *
 * Ours comes from the code the site runs: `measureGame` (players, goalies) and
 * `censusGame` (power plays). A row the league does not carry is not compared;
 * a player absent on our side is 0. Each disagreement is counted with its sign,
 * because a one-directional gap is a definition, not noise.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { measureGame } from '../builders/measure.mjs';
import { censusGame } from '../src/lib/census.js';
import { inScope } from '../src/lib/archive.js';

const FIG = { goals: 'g', assists: 'a', sog: 's' };

export function compare(league, extracts) {
  const by = {};                      // season -> figure -> tally
  const tally = (yr, fig) => ((by[yr] ||= {})[fig] ||= {
    games: 0, gamesOff: 0, rows: 0, over: 0, under: 0, ours: 0, league: 0, eg: [] });
  for (const g of extracts) {
    const id = String(g.game.id);
    const L = league[id];
    if (!L || !inScope(g.game.id) || !g.quoted) continue;
    const yr = id.slice(0, 4);
    const m = measureGame(g);
    const mine = Object.fromEntries(m.players.map(r => [String(r.p), r]));
    const net = Object.fromEntries(m.goalies.map(k => [String(k.pid), k]));

    const rowsOf = [
      ...Object.keys(FIG).map(f => [f, L.skaters, (pid) => (mine[pid] || {})[FIG[f]] || 0, f]),
      ['saves', L.goalies, pid => (net[pid] || {}).saves || 0, 'saves'],
      ['shotsAgainst', L.goalies, pid => (net[pid] || {}).faced || 0, 'shotsAgainst'],
    ];
    for (const [fig, rows, oursOf, field] of rowsOf) {
      const t = tally(yr, fig);
      t.games++;
      let off = false;
      for (const [pid, row] of Object.entries(rows)) {
        if (!(field in row)) continue;
        const o = oursOf(pid), l = row[field];
        t.rows++; t.ours += o; t.league += l;
        if (o !== l) {
          off = true;
          if (o > l) t.over++; else t.under++;
          if (t.eg.length < 5) t.eg.push(`${id} ${pid} ours ${o} league ${l}`);
        }
      }
      if (off) t.gamesOff++;
    }

    const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id,
                  homeAb: g.teams.home.ab, awayAb: g.teams.away.ab, shifts: g.shifts };
    const w = censusGame(g.events, ctx).whistles;
    const boxPPG = Object.values(L.skaters).reduce((n, r) => n + (r.powerPlayGoals || 0), 0);
    const pairs = [['ppGoals vs boxscore', w.ppGoals, boxPPG]];
    if (L.rail) {
      pairs.push(['ppGoals vs rail', w.ppGoals, L.rail.home[0] + L.rail.away[0]]);
      pairs.push(['ppChances vs rail', w.ppChances, L.rail.home[1] + L.rail.away[1]]);
    }
    for (const [fig, o, l] of pairs) {
      const t = tally(yr, fig);
      t.games++; t.rows++; t.ours += o; t.league += l;
      if (o !== l) {
        t.gamesOff++;
        if (o > l) t.over++; else t.under++;
        if (t.eg.length < 5) t.eg.push(`${id} ours ${o} league ${l}`);
      }
    }
  }
  return by;
}

export function report(by) {
  const lines = [];
  const figs = [...new Set(Object.values(by).flatMap(s => Object.keys(s)))];
  for (const fig of figs) {
    lines.push(`\n  ${fig}`);
    lines.push(`    ${'season'.padEnd(8)}${'games'.padStart(7)}${'off'.padStart(6)}`
      + `${'rows'.padStart(8)}${'over'.padStart(6)}${'under'.padStart(7)}`
      + `${'ours'.padStart(9)}${'league'.padStart(9)}`);
    for (const yr of Object.keys(by).sort()) {
      const t = by[yr][fig];
      if (!t) continue;
      lines.push(`    ${yr.padEnd(8)}${String(t.games).padStart(7)}${String(t.gamesOff).padStart(6)}`
        + `${String(t.rows).padStart(8)}${String(t.over).padStart(6)}${String(t.under).padStart(7)}`
        + `${String(t.ours).padStart(9)}${String(t.league).padStart(9)}`);
    }
    const eg = Object.keys(by).sort().flatMap(yr => (by[yr][fig] || { eg: [] }).eg).slice(0, 6);
    for (const e of eg) lines.push(`      e.g. ${e}`);
  }
  return lines.join('\n');
}

function main([leaguePath, dir]) {
  if (!leaguePath || !dir) {
    console.error('usage: node tools/league-witness.mjs <league.json> <dir-with-extract/>');
    process.exit(2);
  }
  const league = JSON.parse(readFileSync(leaguePath, 'utf8'));
  const exDir = join(dir, 'extract');
  const extracts = (function* () {
    for (const f of readdirSync(exDir)) {
      if (f.endsWith('.json')) yield JSON.parse(readFileSync(join(exDir, f), 'utf8'));
    }
  })();
  const by = compare(league, extracts);
  if (!Object.keys(by).length) {
    console.log('::error::no game was compared — the measurement did not run');
    process.exit(1);
  }
  console.log(report(by));
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
