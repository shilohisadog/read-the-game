/**
 * The fixtures themselves — are they still what they claim to be?
 *
 * ⚠️⚠️ WRITTEN BECAUSE FIVE OF THEM WERE NOT. `test/fixtures/extracts/README.md`
 * opens with the claim these files are *"published extracts, copied byte-for-byte
 * from https://data.readthegame.co/extract/<id>.json"*. On 2026-09-01, five of the
 * seven were copies of an OLDER extractor's output: same games, same raw feeds
 * (`game.src` hashes identical), missing the top-level `sides` key and missing
 * `pen`, `min`, `sev`, `zone`, `drew` on every penalty and `miss` on every missed
 * shot.
 *
 * ⭐ AND IT HAD ALREADY PRODUCED A FALSE TEST. `render-penalties.test.js` asserted
 * that a fewer-skaters goal in `2023020207` was NOT short-handed — the pulled-goalie
 * trap. With the correct extract it IS short-handed: a Toronto goal at 4-on-5 with a
 * Toronto player in the box. The stale file had no penalty durations, so `stints()`
 * computed an empty box, so the goal looked like the trap it was being used as. **The
 * test asserted the opposite of correct behaviour and stayed green for as long as the
 * data was wrong.**
 *
 * ⭐ THE CHECK IS CROSS-FIXTURE CONSISTENCY, WHICH NEEDS NO NETWORK AND NO STAMP.
 * A version marker would have to be bumped by hand — a constant that drifts, which
 * this repo has named as a failure mode. Byte-comparing against the live archive is
 * the strongest check and belongs where the archive is walked (`derive.yml`), not in
 * a unit test that must not fetch.
 *
 * What CAN be seen from here is that the fixtures disagree with EACH OTHER: a field
 * that every event of a type carries in one file and no event of that type carries in
 * another is not a fact about those two games, it is two vintages of extractor in one
 * directory. That is precisely the signature of this defect, and it fires the moment a
 * fresh fixture joins stale ones — which is the normal way the drift arrives.
 *
 * ⛔ ITS ONE BLIND SPOT, STATED: if every fixture were stale at the same vintage this
 * says nothing. Mixing is what it catches, and mixing is how fixtures are added.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('fixtures/extracts/', import.meta.url);
const FILES = readdirSync(DIR).filter(f => /^\d+\.json$/.test(f)).sort();
/* ⭐⭐ THE TWO REFERENCE GAMES JOIN THE COMPARISON, 2026-09-10. `data/rich.json`
   and `data/rich-ot.json` are extracts committed into a repo of INPUTS and read
   by the BUILD — the learn page's doors come from them — which is the exact
   shape that let five fixtures sit at an older vintage for months with every
   test green. `rich-ot.json` was fetched from the published origin the day the
   overtime card was built; the day the extractor changes, this says so instead
   of the page quietly opening a game described by an older schema. */
const REFS = [new URL('../data/rich.json', import.meta.url),
              new URL('../data/rich-ot.json', import.meta.url)];

/** For each file: type -> { n, k: {field: count of events carrying it non-null} }. */
const shape = f => {
  const j = JSON.parse(readFileSync(f instanceof URL ? f : new URL(f, DIR), 'utf8'));
  const c = {};
  for (const e of j.events) {
    const t = (c[e.type] = c[e.type] || { n: 0, k: {} });
    t.n++;
    for (const k of Object.keys(e)) if (e[k] !== null) t.k[k] = (t.k[k] || 0) + 1;
  }
  return { top: new Set(Object.keys(j)), byType: c };
};

test('⭐ every fixture was extracted by the same extractor — no field drift', () => {
  assert.ok(FILES.length >= 3, `${FILES.length} fixtures — too few to compare against each other`);
  const per = Object.fromEntries([...FILES, ...REFS].map(f => [String(f), shape(f)]));

  /* ⭐ UNIVERSAL-IN-ONE, ABSENT-IN-ANOTHER — not "present somewhere". The weaker
     form false-positives on fields that are genuinely occasional: `srv` (served-by)
     rides only on bench minors and goalie penalties, so it is absent from most games
     for a real reason. A field carried by EVERY event of a type in one game and by
     NONE in another cannot be explained by what happened on the ice. */
  const types = new Set(Object.values(per).flatMap(p => Object.keys(p.byType)));
  const drift = [];
  let compared = 0;
  for (const t of types) {
    const fields = new Set(Object.values(per).flatMap(p => p.byType[t] ? Object.keys(p.byType[t].k) : []));
    for (const k of fields) {
      const all = [], none = [];
      for (const [f, p] of Object.entries(per)) {
        const c = p.byType[t];
        if (!c || !c.n) continue;
        const got = c.k[k] || 0;
        if (got === c.n) all.push(f); else if (got === 0) none.push(f);
      }
      if (all.length && none.length) drift.push(`${t}.${k}: every event has it in ${all.length} `
        + `fixture(s) (${all[0]}) and none has it in ${none.length} (${none[0]})`);
      compared++;
    }
  }
  // NON-VACUITY: this must actually have had pairs to compare.
  assert.ok(compared > 40, `only ${compared} type/field pairs examined — the scan found nothing to check`);
  assert.deepEqual(drift, [],
    'these fixtures were produced by different vintages of builders/extract.py. Re-copy the '
    + 'stale ones from https://data.readthegame.co/extract/<id>.json, which is what '
    + 'fixtures/extracts/README.md says they are');
});

test('⭐ every fixture carries the same top-level keys', () => {
  /* THE COARSER HALF OF THE SAME DEFECT, and the one that showed first: the five
     stale files had no `sides` at all — the ends-switching data B1 is built on — so
     any test reading them was reasoning about a game whose orientation is unknown. */
  const per = Object.fromEntries([...FILES, ...REFS].map(f => [String(f), shape(f).top]));
  const union = new Set(Object.values(per).flatMap(s => [...s]));
  assert.ok(union.size >= 6, `only ${union.size} top-level keys across every fixture`);
  for (const [f, keys] of Object.entries(per)) {
    const missing = [...union].filter(k => !keys.has(k));
    assert.deepEqual(missing, [],
      `${f} is missing ${missing.join(', ')}, which every other fixture has`);
  }
});

/* ───────────────── A FIXTURE BUILT ON THE WALL CLOCK IS NOT A FIXTURE ────────
 * ⛔⛔ 2026-09-24. `homepage.test.js` built a stale index four days before
 * `Date.now()` and asserted the page said "4 days ago". `ago()` floors on 24
 * hours, so exactly four days sits ON the floor boundary: the assertion held
 * only while the instant the page rendered at was >= the instant the file was
 * loaded at. The wall clock is not monotonic, and a backwards correction of any
 * size between the two reads makes the page say "3 days ago" — correctly. It
 * went red under `clock-sweep` and green on identical code in the same UTC
 * minute. Pinning it (`at` in that harness) is the fix; this is the net that
 * stops the spelling coming back.
 *
 * ⭐⭐ THE SCAN DOES NOT PARSE JAVASCRIPT, AND THAT IS DELIBERATE. The first
 * draft walked the source stripping comments so the token could be found in
 * code alone. It desynced on line 34 of `homepage.test.js` — a REGEX LITERAL
 * containing a double quote, which opened a string that swallowed the next
 * ninety lines — and reported two files that were clean. Deciding whether `/`
 * opens a regex or divides is the one thing a hand-rolled scanner cannot do,
 * and a check that needs a parser it does not have is a check that reports
 * confidently about the wrong text.
 *
 * ⭐ SO IT CLASSIFIES LINES, NOT SYNTAX: a line is prose if it begins with `*`,
 * `//` or an opening block comment, which is this repo's JSDoc style without
 * exception. The token is forgiven there and nowhere else.
 *
 * ⚠️ WHAT THIS PROVES, EXACTLY, AND THE THREE THINGS IT DOES NOT:
 *   - it proves no test source writes `Date.now()` on a line that is not
 *     comment prose. The three surviving mentions in this repo are all in the
 *     comments explaining the removal, which is the trap in the other direction
 *     and the reason the classifier exists at all.
 *   - `new Date()` with no arguments is still allowed: three fixtures here
 *     legitimately mean "now" and sit 36 hours clear of the only threshold that
 *     reads them. ARITHMETIC is what puts a value on a boundary, not the read.
 *   - a clock captured into a variable and subtracted from later escapes it.
 *   - a continuation line of a multi-line string beginning with `*` would be
 *     forgiven as prose. Nothing in this repo is written that way.
 */
const isProse = line => /^\s*(\*|\/\/|\/\*)/.test(line);

test('the prose classifier forgives comment lines and nothing else', () => {
  /* ⭐ THE SPECIMEN IS A MARKER THE WORLD CAN NEVER SEND, so this cannot be
     satisfied by a real file drifting into the right shape — and it is not the
     banned token, so writing the cases out does not trip the scan below. */
  for (const line of [' * ZZQX', '   // ZZQX', '/* ZZQX', '/** ZZQX', '\t* ZZQX'])
    assert.equal(isProse(line), true, `prose was read as code: ${JSON.stringify(line)}`);
  for (const line of ['const x = ZZQX;', '  return ZZQX;', '  const x = 1; // ZZQX',
                      'ZZQX * 2', '  }); /* ZZQX'])
    assert.equal(isProse(line), false, `code was forgiven as prose: ${JSON.stringify(line)}`);
});

/* ⚠️ THE NAME SPELLS THE TOKEN OUT IN THE COMMENT ABOVE AND NOT HERE, because
   a test name is a code line and this scan reads its own file too — which is
   the point: a violation in this file is a violation. */
test('⭐ no test builds a fixture out of the wall clock', () => {
  const root = new URL('./', import.meta.url);
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(new URL(e.name + '/', dir))
      : /\.(m?js)$/.test(e.name) ? [new URL(e.name, dir)] : []);
  const files = walk(root);
  assert.ok(files.length > 40, `only ${files.length} test sources scanned — the walk found nothing`);

  const offenders = [];
  for (const f of files) {
    const name = String(f).split('/test/')[1];
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes('Date' + '.now()') && !isProse(line)) offenders.push(`${name}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [],
    'a fixture whose value is arithmetic on the wall clock is a fixture nothing in this '
    + 'repo controls, and one of them sat exactly on a rounding boundary for a day. Pin '
    + 'the instant instead — `at` in homepage.test.js, the `Date` parameter in '
    + 'preview-page.test.js — and give the offset margin off the boundary');
});
