/**
 * DOES THE PUBLISHED MEASUREMENT DESCRIBE THE PUBLISHED ARCHIVE?
 *
 *   node tools/measured-through.mjs              # the live documents
 *   node tools/measured-through.mjs --dir ingest # a local tree, before it is published
 *
 * ⛔⛔⛔ WHY IT EXISTS, AND IT IS THE HALF `measure.mjs` STRUCTURALLY CANNOT DO.
 * `archiveIsWhole` and `measuredThrough` run at WRITE time, against the catalog
 * written by their own run, so they are correct and blind in one direction:
 * nothing re-asks afterwards. `measures.json` is rebuilt WEEKLY and
 * `catalog.json` is rewritten NIGHTLY, so from the Monday derive the two
 * documents drift apart by design and no instrument compared them. On
 * 2026-10-02 the published measurement covered 8 games of the season while the
 * published archive held 21, and a reader on the Capitals' opener was told
 * *"the 8 games we have measured for this season"* — the figure was right about
 * the measurement, said nothing about when the measuring stopped, and was the
 * only number on the page. Kevin: *"we hold 21 games and say 8 games."*
 *
 * ⭐ ONE DERIVATION, EVERY SIDE. The archive's span is reduced by
 * `archive.js::dataThrough`, the same function that stamps `measures.json` and
 * that `team-season.js` reads `through` from — so "newest" cannot come to mean
 * two things in two places. That is why this is a Node tool and not the Python
 * its sibling `measures_fresh.py` is: a second `max()` over dates in a second
 * language is exactly the drift this whole build is repairing.
 *
 * ⚠️⚠️ AND IT IS NOT THE THREE-WAY EQUALITY THE SPEC ASKED FOR, BECAUSE THAT
 * COMPARISON IS UNSOUND — measured 2026-10-03 before it was built.
 *
 *   docs/status.md §0.00 wrote the check as
 *       derive(catalog rows) == measures dataThrough == index dataThrough
 *
 * `index.json`'s `dataThrough` is the newest game date over EVERY game held, and
 * `fetch_nhl.py` says so in its own comment: *"NOTHING HERE FILTERS ON IT —
 * everything the league calls final is ingested, including exhibition hockey on
 * half-AHL rosters that we may well never show."* The index holds 4,639 games of
 * which 385 are preseason, 30 All-Star and 10 more exhibition sides. The
 * measurement holds the 4,213 that are in scope and published.
 *
 * So the two fields count DIFFERENT POPULATIONS, and they are equal today only
 * because the newest game happens to be a regular-season one. Between
 * 2026-09-26 and 2026-10-01 the newest game held was a PRESEASON game of
 * 2026-09-26 while the newest in-scope game was 2026-06-14 — three and a half
 * months apart, both correct. An equality there would have been red for the
 * whole of preseason, and red for a reason that is not a fault is an alarm that
 * gets switched off.
 *
 * ⭐⭐ THAT IS THE DEFECT WE ARE FIXING, WEARING ITS OTHER FACE: two quantities
 * over different populations, compared as though one label covered both. So the
 * invariant is between the two documents that DO describe the same population,
 * and the index enters as a DIRECTION rather than an equation:
 *
 *   1. derive(catalog published in scope)  ==  measures.json dataThrough
 *      Equality, per ruling 4. Same population, same reducer, no tolerance.
 *   2. per season, the same equality — which is the 8-versus-21 defect in the
 *      shape it actually had, and it is possible for the document-level span to
 *      match while a season's does not.
 *   3. index.json dataThrough  >=  measures.json dataThrough
 *      Not a tolerance: the index covers a SUPERSET, so it can only ever be
 *      newer or equal. If the measurement is ever ahead, we have measured
 *      hockey the ingest has no record of holding, which is a different and
 *      worse fault than being behind.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inScope, season, dataThrough } from '../src/lib/archive.js';

const DATA = process.env.RTG_DATA || 'https://data.readthegame.co';

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const DIR = opt('--dir', null);

async function doc(name) {
  if (DIR) return JSON.parse(readFileSync(join(DIR, name), 'utf8'));
  const r = await fetch(`${DATA}/${name}`, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${DATA}/${name} — HTTP ${r.status}`);
  return r.json();
}

/**
 * ⛔⛔⛔ EVERY EXTRACTION MUST FIND SOMETHING, AND THIS REPO HAS PAID FOR THE
 * LESSON IN A WORKFLOW. A `sed` the shell refused exited 0, `$desc` came back
 * empty, `case "" in *[0-9]*)` matched nothing, and a deploy guard that read
 * NOTHING approved everything, green, for days. A check whose inputs can be
 * absent needs to say so rather than compare `undefined` to `undefined` and
 * find them agreeable.
 */
export function spans(cat, measures, index) {
  const faults = [];
  const rows = (cat && cat.games) || [];
  if (!rows.length) faults.push('catalog.json lists no games at all');
  const published = rows.filter(g => g.v === 1 && inScope(g.id));
  if (rows.length && !published.length)
    faults.push(`catalog.json lists ${rows.length} rows and publishes none in scope`);
  // The SAME reducer as the stamp, fed the catalog's spelling of the field.
  const archive = dataThrough(published.map(g => ({ date: g.d })));
  if (published.length && archive === null)
    faults.push(`catalog.json publishes ${published.length} game(s) in scope and not one `
      + 'carries a date, so the archive has no span to compare against (the row field is `d`)');
  const measured = measures && measures.dataThrough;
  if (!measured)
    faults.push('measures.json carries no `dataThrough` — it cannot say what it covers, '
      + 'which is the state this check was built to end');
  const held = index && index.dataThrough;
  if (!held) faults.push('index.json carries no `dataThrough`');

  /* THE ARCHIVE'S SPAN PER SEASON, from the rows. A histogram destroys which
     dates went into it, which is the whole reason the entries are stamped. */
  const bySeason = {};
  for (const g of published) {
    if (!g.d) continue;
    const y = season(g.id);
    (bySeason[y] ||= []).push(g);
  }
  const perSeason = Object.keys(bySeason).sort().map(y => ({
    season: y,
    rows: bySeason[y].length,
    archive: dataThrough(bySeason[y].map(g => ({ date: g.d }))),
    measured: (measures && measures.perGame && measures.perGame[y]
               && measures.perGame[y].dataThrough) || null,
    /* THE COUNT IS REPORTED AND NOT ASSERTED. `measureAll` skips a published
       game with no quoted boxscore, so measured may legitimately be one short
       of the rows — but it cannot be short a DATE, because the newest game
       either entered the histogram or it did not. The count is here because
       "8 against 21" is the sentence a human recognises. */
    n: (measures && measures.perGame && measures.perGame[y]
        && measures.perGame[y].corsi && measures.perGame[y].corsi.n) || null,
  }));

  return { faults, archive, measured, held, perSeason, published: published.length };
}

/** The faults, as sentences. Separated from `spans` so the judging is testable. */
export function judge(s) {
  const bad = [...s.faults];
  if (s.faults.length) return bad;        // nothing below can be read yet

  // 1. THE INVARIANT. Equality, per ruling 4, between the two documents that
  //    describe the same population.
  if (s.archive !== s.measured) {
    bad.push(`measures.json is measured through ${s.measured} while catalog.json publishes `
      + `${s.published} in-scope game(s) through ${s.archive} — the published measurement `
      + 'does not describe the published archive, so every figure a reader is placed '
      + 'against is current to a date the page does not state.');
  }
  // 2. PER SEASON, which is the shape the defect actually had.
  for (const r of s.perSeason) {
    if (r.measured === null) {
      bad.push(`catalog.json publishes ${r.rows} game(s) of ${r.season} through ${r.archive} `
        + 'and measures.json has no entry for that season at all — a game of it has no '
        + 'reference class and falls back to a borrowed one.');
    } else if (r.measured !== r.archive) {
      bad.push(`${r.season}: measured through ${r.measured} (${r.n} game(s)) while the archive `
        + `publishes ${r.rows} through ${r.archive}`);
    }
  }
  // 3. THE DIRECTION. See the header: the index covers a superset, so it may be
  //    newer. It may never be OLDER.
  if (s.measured && s.held && s.held < s.measured) {
    bad.push(`measures.json is measured through ${s.measured} but index.json holds games only `
      + `through ${s.held} — the measurement describes hockey the ingest has no record of, `
      + 'which is not staleness but a corrupt handoff.');
  }
  return bad;
}

async function main() {
  const where = DIR || DATA;
  const [cat, measures, index] = await Promise.all(
    [doc('catalog.json'), doc('measures.json'), doc('index.json')]);
  const s = spans(cat, measures, index);
  console.log(`measured through, from ${where}`);
  console.log(`  archive   ${s.archive}   (${s.published} published in scope)`);
  console.log(`  measured  ${s.measured}`);
  console.log(`  held      ${s.held}   (index.json, every game including exhibition)`);
  for (const r of s.perSeason) {
    const flag = r.measured === r.archive ? ' ' : '⛔';
    console.log(`  ${flag} ${r.season}  archive ${String(r.rows).padStart(5)} through ${r.archive}`
      + `   measured ${String(r.n === null ? '—' : r.n).padStart(5)} through ${r.measured || '—'}`);
  }
  const bad = judge(s);
  if (bad.length) {
    for (const b of bad) console.error(`::error::${b}`);
    process.exit(1);
  }
  console.log('  ✅ the published measurement describes the published archive');
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
