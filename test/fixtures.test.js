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

/** For each file: type -> { n, k: {field: count of events carrying it non-null} }. */
const shape = f => {
  const j = JSON.parse(readFileSync(new URL(f, DIR), 'utf8'));
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
  const per = Object.fromEntries(FILES.map(f => [f, shape(f)]));

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
  const per = Object.fromEntries(FILES.map(f => [f, shape(f).top]));
  const union = new Set(Object.values(per).flatMap(s => [...s]));
  assert.ok(union.size >= 6, `only ${union.size} top-level keys across every fixture`);
  for (const [f, keys] of Object.entries(per)) {
    const missing = [...union].filter(k => !keys.has(k));
    assert.deepEqual(missing, [],
      `${f} is missing ${missing.join(', ')}, which every other fixture has`);
  }
});
