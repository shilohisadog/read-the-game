/**
 * EVERY WORD THE LEAGUE HAS EVER SENT US, COUNTED OVER THE WHOLE ARCHIVE.
 *
 *   node tools/vocab-sweep.mjs                  # the published archive
 *   node tools/vocab-sweep.mjs --limit 200      # a slice, for working on this file
 *   node tools/vocab-sweep.mjs --json out.json  # the full tally, for a later question
 *
 * ⭐ WHY IT EXISTS, AND IT IS THE THIRD LIST. On 2026-10-02 eleven stoppage reasons
 * were found reaching readers as raw feed keys. They were found by counting one
 * season — 69 games — and the check written the same day compares
 * `KNOWN_STOPPAGES` against `WHY`, which are both files in this repo. Two lists in
 * the repo cannot see a word neither has heard of. Kevin: *"sweep the whole
 * archive."* This is that sweep, and it is the half `guard-where-the-archive-is`
 * calls the day-it-happens half.
 *
 * ⛔⛔⛔ IT KEEPS `reason` AND `secondaryReason` APART, AND THAT IS THE WHOLE POINT
 * OF REWRITING THE QUESTION. `extract.py::vocabulary` pools both into one bucket
 * called "stoppage reason", and `data/vocabulary-seen.json` inherits the pooling.
 * The two fields have OPPOSITE reader consequences: `rsn` is the heading on the
 * whistle card, in the layer box and on every restart ring; `rsn2` has no reader
 * at all — the secondary reason was removed from the card at Kevin's request and
 * nothing renders it.
 *
 * The cost of pooling them is on the record: `player-equipment` sat at the top of
 * `docs/status.md` for a day as a defect reaching readers, and it is a
 * `secondaryReason` that has never once been primary. A session was minutes from
 * writing reader-facing copy for a string no surface can display. **A bucket
 * shared by two fields with different consequences reports the union and means
 * neither.**
 *
 * ⚠️ WHAT THIS IS NOT. It is not a gate and it does not run in `npm run gates`:
 * it makes ~4,600 HTTPS requests against our own R2 bucket, which is minutes and
 * free egress, but it is not something to put in front of a commit. The gate is
 * `test/whistle.test.js` and `test/render-penalties.test.js`, which are the
 * edit-time half; this is what tells those lists they are out of date.
 *
 * ⛔ AND IT READS THE PUBLISHED ARCHIVE, not `data/`. `data/measures.json` is a
 * CACHE; the archive is what `catalog.json` lists and what the site actually
 * serves, which is the only population a claim about readers can be made over.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = process.env.RTG_DATA || 'https://data.readthegame.co';

/** How many extracts are in flight at once. Our own bucket, so this is politeness rather than a limit. */
const LANES = 16;

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const LIMIT = Number(opt('--limit', 0)) || 0;
const OUT = opt('--json', null);

async function json(url, tries = 3) {
  for (let k = 0; k < tries; k++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      /* ⛔ A 404 IS AN ANSWER AND A 5xx IS NOT. The catalog can list a game whose
         extract was never published; that is a finding, not a retry. */
      if (r.status === 404) return null;
    } catch { /* fall through to the retry */ }
    await new Promise(r => setTimeout(r, 250 * (k + 1)));
  }
  throw new Error(`${url} — unreachable after ${tries} tries`);
}

/**
 * ⭐ THE FIELDS ARE NAMED SEPARATELY, EVERY ONE OF THEM, and each says whether a
 * reader can see it. A field with no reader is still counted, because "nothing
 * renders this" is a fact worth being able to prove rather than remember.
 */
const FIELDS = [
  { id: 'stoppage rsn', reader: true, note: 'the whistle card heading, the layer box line, every restart ring' },
  { id: 'stoppage rsn2', reader: false, note: 'carried by the extractor and the layer; NO SURFACE RENDERS IT' },
  { id: 'penalty descKey', reader: true, note: 'the penalty card and the box' },
  { id: 'missed-shot reason', reader: false, note: 'carried; the page draws the miss, never its reason' },
  { id: 'event type', reader: true, note: 'captions and the not-a-play ledger' },
];

/**
 * ⛔⛔⛔ A FIELD THAT COLLECTED NOTHING IS A BUG IN THIS FILE, NOT A CLEAN ARCHIVE.
 *
 * The first run of this sweep reported `penalty descKey` and `missed-shot reason`
 * as "✅ every one of them has prose" over 40 games — because it read the LEAGUE'S
 * field names and the extract renames them (`descKey` → `pen`, `reason` → `miss`).
 * Zero values, zero unworded, a tick. A sweep whose whole purpose is to find words
 * nobody has read is worthless the moment it can report success by looking in the
 * wrong place, and nothing about the output said which had happened.
 *
 * So every field must produce something. Any hockey game has penalties, misses and
 * stoppages; a field that is empty across a real sample means the key moved.
 */
function assertCollected(tally, games) {
  if (!games) throw new Error('no extracts were read at all — the archive was not swept');
  const empty = FIELDS.filter(f => !(tally[f.id] || new Map()).size).map(f => f.id);
  if (empty.length) {
    throw new Error(`${empty.join(', ')} collected NOTHING across ${games} games. `
      + `That is this tool reading the wrong key, not an archive with none — check the `
      + `field names in builders/extract.py, which renames the league's.`);
  }
}

export function tallyGame(g, tally, id) {
  const bump = (field, value) => {
    if (!value) return;
    const t = (tally[field] ||= new Map());
    const row = t.get(value) || { n: 0, games: new Set(), first: id };
    row.n++;
    row.games.add(id);
    t.set(value, row);
  };
  for (const e of g.events || []) {
    bump('event type', e.type);
    if (e.type === 'stoppage') { bump('stoppage rsn', e.rsn); bump('stoppage rsn2', e.rsn2); }
    /* ⛔⛔ THE EXTRACT RENAMES THESE, AND THE FIRST DRAFT READ THE FEED'S NAMES.
       `descKey` becomes `pen` and the missed-shot `reason` becomes `miss` in
       `extract.py`, so a sweep written from the league's vocabulary report found
       ZERO of both and printed "every one of them has prose" over two fields it
       had never looked at. That is this project's most expensive shape, committed
       inside the tool written to catch it. `assertCollected` below is the part
       that makes the next one loud instead of reassuring. */
    if (e.type === 'missed-shot') bump('missed-shot reason', e.miss);
    if (e.type === 'penalty') bump('penalty descKey', e.pen);
  }
}

async function main() {
  const cat = await json(`${DATA}/catalog.json`);
  let ids = (cat.games || []).filter(g => g && g.v).map(g => g.id);
  if (LIMIT) ids = ids.slice(-LIMIT);
  process.stderr.write(`sweeping ${ids.length} published games from ${DATA}\n`);

  const tally = {};
  let done = 0, missing = 0;
  const queue = ids.slice();
  await Promise.all(Array.from({ length: LANES }, async () => {
    for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
      const g = await json(`${DATA}/extract/${id}.json`);
      if (!g) { missing++; continue; }
      tallyGame(g, tally, id);
      if (++done % 250 === 0) process.stderr.write(`  ${done}/${ids.length}\n`);
    }
  }));
  process.stderr.write(`read ${done} extracts, ${missing} listed but not published\n\n`);
  assertCollected(tally, done);

  /* The repo's own tables, imported rather than restated — a copy here would be
     the fourth list and would agree with nothing. */
  const { WHY } = await import('../src/lib/layers/whistle.js');
  const { PEN } = await import('../src/lib/penalties.js');
  const vetted = new Set([...readFileSync(new URL('../builders/extract.py', import.meta.url), 'utf8')
    .match(/KNOWN_STOPPAGES = \{([\s\S]*?)\n\}/)[1]
    .replace(/^\s*#.*$/gm, '').matchAll(/"([a-z0-9-]+)"/g)].map(m => m[1]));

  const worded = { 'stoppage rsn': k => Boolean(WHY[k]), 'penalty descKey': k => Boolean(PEN[k]) };

  const report = { sweptAt: new Date().toISOString(), games: done, missing, fields: {} };
  for (const f of FIELDS) {
    const t = tally[f.id] || new Map();
    const rows = [...t.entries()].sort((a, b) => b[1].n - a[1].n);
    const total = rows.reduce((a, [, r]) => a + r.n, 0);
    console.log(`\n═══ ${f.id} — ${rows.length} distinct, ${total.toLocaleString()} occurrences`);
    console.log(`    ${f.reader ? 'A READER SEES THIS' : 'no surface renders this'} — ${f.note}`);
    const has = worded[f.id];
    const bare = has ? rows.filter(([k]) => !has(k)) : [];
    if (has) {
      const n = bare.reduce((a, [, r]) => a + r.n, 0);
      console.log(bare.length
        ? `    ⛔ ${bare.length} of them have no prose — ${n.toLocaleString()} occurrences `
          + `(${(n / total * 100).toFixed(2)}% of the field) reach a reader as a raw key:`
        : `    ✅ every one of them has prose.`);
      for (const [k, r] of bare)
        console.log(`       ${String(r.n).padStart(5)}  ${k.padEnd(46)} ${r.games.size} game(s), e.g. ${r.first}`);
      const unvetted = rows.filter(([k]) => f.id === 'stoppage rsn' && !vetted.has(k));
      if (unvetted.length)
        console.log(`    ⚠️ ${unvetted.length} not in KNOWN_STOPPAGES: ${unvetted.map(([k]) => k).join(', ')}`);
    }
    report.fields[f.id] = { reader: f.reader, distinct: rows.length, total,
      values: Object.fromEntries(rows.map(([k, r]) => [k, { n: r.n, games: r.games.size, eg: r.first }])),
      unworded: bare.map(([k]) => k) };
  }

  /* ⭐ THE CROSS NOBODY COULD MAKE BEFORE: which values are ONLY ever secondary.
     These are the ones that look like defects in a pooled report and are not. */
  const prim = tally['stoppage rsn'] || new Map(), sec = tally['stoppage rsn2'] || new Map();
  const onlySecondary = [...sec.keys()].filter(k => !prim.has(k)).sort();
  console.log(`\n═══ only ever a SECONDARY reason — ${onlySecondary.length} values`);
  console.log('    These have no reader. Prose for them would be prose nothing can display,');
  console.log('    and a pooled vocabulary report cannot tell them from the ones above.');
  for (const k of onlySecondary) console.log(`       ${String(sec.get(k).n).padStart(5)}  ${k}`);
  report.onlySecondary = onlySecondary;

  if (OUT) { writeFileSync(OUT, JSON.stringify(report, null, 1)); process.stderr.write(`\nwrote ${OUT}\n`); }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
