/**
 * Pipeline-time analysis: the archive, measured.
 *
 * THIS FILE IS A DRIVER AND NOTHING ELSE. It reads extracts, calls the SAME
 * reducers the browser calls, and writes one document. Every rule it applies —
 * what an attempt is, whose it is, what even strength means, what the shootout is
 * not — lives in src/lib and is imported, never restated.
 *
 * WHY THAT MATTERS ENOUGH TO CROSS A LANGUAGE BOUNDARY. The plan of record put
 * this computation in derive.py, in Python, which would have been a second
 * implementation of the domain rules in a second language. That is the defect
 * this project argued from in docs/catalog.md §3 to make the catalog quote the
 * boxscore — and it had already begun: the scratch script this grew out of opened
 * by promising to "mirror src/lib/strength.js exactly", which is a claim with no
 * check behind it. KNOWN_SITUATIONS has gained codes twice. See
 * docs/architecture.md §2.
 *
 * A Python copy plus a differential test was the tempting alternative and is
 * worse: a differential test validates on the games it runs, which is a rule
 * checked against a sample. One implementation cannot drift.
 *
 *   node builders/measure.mjs --out ingest
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { corsi } from '../src/lib/layers/corsi.js';
import { tiedControl } from '../src/lib/layers/tied.js';
import { inScope, summarise } from '../src/lib/archive.js';

/** One game's measurements, in the shape src/lib/archive.js consumes. */
export function measureGame(g) {
  const ctx = {
    roster: g.roster,
    homeId: g.teams.home.id, awayId: g.teams.away.id,
    homeAb: g.teams.home.ab, awayAb: g.teams.away.ab,
  };
  // Attempts at ALL strengths — this is the raw Corsi total, and the base rate
  // built on it is the one that inverts. evenOnly is deliberately off here and
  // deliberately not a parameter in tiedControl.
  const all = corsi.reduce(g.events, { ...ctx, evenOnly: false });
  const level = tiedControl.reduce(g.events, ctx);
  // WHAT THE ATTEMPTS WERE MADE OF, read back off corsi's OWN counted set.
  //
  // Not off `g.events` by type, and the difference is not cosmetic: corsi
  // decides what an attempt IS — it drops shootout attempts, delayed-penalty
  // events and everything else that is not a play. Counting raw types here
  // would be a second answer to a question src/lib already answers, which is
  // the one thing this file exists not to do. It would also silently include
  // the shootout, where every attempt is unblocked and from the slot.
  const mix = { goal: 0, 'shot-on-goal': 0, 'missed-shot': 0, 'blocked-shot': 0 };
  for (const id of all.counted) mix[g.events[id].type]++;
  return {
    id: g.game.id,
    homeAb: ctx.homeAb, awayAb: ctx.awayAb,
    mix,
    // THE LEAGUE'S OWN LINE, quoted from the boxscore and stored in the extract
    // so nothing here re-derives a score. If it is missing we do not guess.
    score: { h: g.quoted.home.score, a: g.quoted.away.score },
    sog: { h: g.quoted.home.sog, a: g.quoted.away.sog },
    attempts: { h: all.t[ctx.homeId], a: all.t[ctx.awayId] },
    level: level.diff,
  };
}

/**
 * A property of how the LEAGUE records hockey, watched across the whole archive.
 *
 * A faceoff always follows the stoppage that caused it, recorded at the SAME
 * second — so a faceoff is never the first event at its clock. 0 of 4,851 in
 * one sample and 0 of 4,874 in an independent playoff sample
 * (docs/deep-link-seam.md §4). The deep-link resolver relies on it: a bare
 * `?at=2-14:32` naming a draw lands on the stoppage, which is why the grammar
 * carries an ordinal at all.
 *
 * IT REPORTS AND DOES NOT REFUSE, and the distinction is the whole reason it
 * lives here rather than in extract.py's --validate. Every check in --validate
 * asks whether OUR EXTRACT is wrong about the game, and failing one means we
 * must not publish. This asks whether the LEAGUE'S RECORDING CONVENTION still
 * holds. A game that broke it would be perfectly good hockey, correctly
 * extracted, where only our link resolution degrades — and refusing to show it
 * would be exactly the overreach derive.py warns against: "a refusal is a
 * statement about what we can SHOW".
 */
export function firstAtClock(events) {
  const first = new Map();
  const offenders = [];
  events.forEach((e, i) => {
    const k = e.per + '|' + e.rem;
    if (!first.has(k)) first.set(k, i);
    else return;
    if (e.type === 'faceoff') offenders.push(i);
  });
  return offenders;
}

export function measureAll(dir) {
  const records = [];
  const skipped = [];
  const drawFirst = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const g = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    // Watched on EVERY extract, in scope or not: the recording convention is
    // not a rule about which games count, and a deep link into a preseason
    // game resolves through the same code as any other.
    const bad = firstAtClock(g.events);
    if (bad.length) drawFirst.push({ id: g.game.id, at: bad });
    // Out of scope is not a fault and not a skip — it is the settled rule that
    // preseason, the Olympics and the 4 Nations never enter a computed number.
    if (!inScope(g.game.id)) continue;
    if (!g.quoted) { skipped.push(g.game.id); continue; }
    records.push(measureGame(g));
  }
  return { records, skipped, drawFirst };
}

/** JSON with object keys sorted, so the file is a function of its input alone. */
export function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort()
      .map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function main(argv) {
  const i = argv.indexOf('--out');
  const out = i === -1 ? 'ingest' : argv[i + 1];
  const dir = join(out, 'extract');
  if (!existsSync(dir)) {
    console.error(`::error::no extracts at ${dir} — nothing to measure`);
    process.exit(1);
  }
  const { records, skipped, drawFirst } = measureAll(dir);
  const doc = { ...summarise(records), measured: records.length };
  // NO TIMESTAMP, and KEYS SORTED. Same extracts in, same bytes out, so any diff
  // on a re-run is a real change of opinion or of data — the same property
  // catalog.json holds through `sort_keys=True`. Freshness is index.json's job.
  writeFileSync(join(out, 'measures.json'), stable(doc));
  const r = doc.baseRates;
  console.log(JSON.stringify({
    measured: records.length,
    skippedNoQuote: skipped.length,
    featured: doc.featured[0],
    rates: Object.fromEntries(Object.entries(r).map(([k, v]) =>
      [k, v.rate == null ? null : `${(v.rate * 100).toFixed(1)}% of ${v.n}`])),
  }, null, 2));
  // LOUD, because a silent change here is a wrong landing on every teaching
  // link into the affected game rather than a missing number.
  if (drawFirst.length) {
    console.log(`::warning::a faceoff was recorded before its own stoppage in `
              + `${drawFirst.length} game(s) — deep links resolving on a bare `
              + `clock will land on the draw instead of the whistle: `
              + `${drawFirst.slice(0, 5).map(d => d.id).join(', ')}`);
  }
  if (skipped.length) {
    console.log(`  ${skipped.length} in-scope extracts carry no quoted boxscore `
              + `and were NOT measured: ${skipped.slice(0, 5).join(', ')}…`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
