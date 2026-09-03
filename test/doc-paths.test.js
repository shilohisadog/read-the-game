/**
 * Repo paths named in the design record, checked against the repo.
 *
 * ⚠️⚠️ WRITTEN BECAUSE KEVIN ASKED WHETHER A COLD VISITOR WOULD FIND EVERYTHING
 * IN ORDER AND THE ANSWER WAS NO. Of 133 distinct repo paths cited across
 * `docs/`, seventeen did not exist — and SIX of those were created the same day,
 * by deleting `build_A/B/C.py` and three prototype pages without sweeping the
 * documents that named them. `docs/status.md` was still asserting, in the
 * present tense in the living build list, that `KNOWN_SITUATIONS` holds eight
 * codes — a symbol deleted hours earlier.
 *
 * `tools/refcheck.py` already checks CITATIONS — a file, a line number, and the
 * text that line must contain. It cannot see a path mentioned in a sentence, and
 * a sentence is where most of the record lives.
 *
 * ⭐ THE LIST IS OF WHAT IS GONE, NOT OF WHAT IS ALLOWED. An allowlist of
 * approved paths fails silently on anything it omits; this fails loudly and
 * makes the deletion the moment somebody writes down why. That is the same
 * inversion as `DECLINED` in `strength.js`, for the same reason.
 *
 * ⛔ WHAT IT DOES NOT CHECK, so green is not read as more than it is: whether
 * the SENTENCE around a live path is still true. A document can name a file that
 * exists and be wrong about everything it says about it. That is a reading
 * problem and this is not a reading instrument.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DOCS = new URL('../docs/', import.meta.url);
const ROOT = new URL('../', import.meta.url);

/**
 * Paths that are cited and do not exist, each with the reason it is not a bug.
 * A new entry here should be rare and deliberate; the usual answer to this test
 * failing is that something moved and a document did not move with it.
 */
const GONE = {
  // Earlier builders, named in the historical narrative of how the build chain
  // got here. They are the SUBJECT of those passages, not a live dependency.
  'build_alive3.py': 'an early prototype builder, removed long before this record was indexed',
  'build_css.py': 'folded into the page builders',
  'build_rules.py': 'the rule pages are built by build_index.py now',
  'builders/build_rules.py': 'same',
  // Removed 2026-09-03 with the three Workshop prototypes (commit 7b17715).
  // The documents that name them are dated arguments about those pages.
  'build_A.py': 'the active-play prototype builder, removed 2026-09-03',
  'build_B.py': 'the on-the-ice prototype builder, removed 2026-09-03',
  'builders/build_A.py': 'same',
  'builders/build_B.py': 'same',
  'src/active-play.html': 'prototype removed 2026-09-03; see status.md B8',
  'src/on-the-ice.html': 'prototype removed 2026-09-03; see status.md B8',
  // Renamed since the document that cites them was written.
  'deeplink-render.js': 'the suite file is test/deeplink-render.test.js',
  'test/ingest.test.js': 'now test/ingest-state.test.js',
  // Published artifacts on the data origin, not files in this repo. They are
  // cited by name because that is what the site fetches them as.
  'catalog.json': 'published at data.readthegame.co, not a repo file',
  'index.json': 'same',
  'schedule.json': 'same',
  'teams.json': 'same',
  // Hosting configuration that lives in the deploy workflow rather than on disk.
  'src/_headers': 'headers are set by the deploy workflow, not a checked-in file',
};

const PATH_RE =
  /`((?:src|builders|tools|test|data|\.github)\/[\w./-]+|[\w-]+\.(?:py|mjs|js|json|ya?ml))`/g;

/** Where a bare filename might live, so `build_index.py` resolves. */
const DIRS = ['', 'builders/', 'src/', 'tools/', 'test/', 'data/',
              'src/lib/', 'src/lib/layers/', '.github/workflows/'];

const cited = new Map();          // path -> Set(document)
for (const f of readdirSync(DOCS).filter(n => n.endsWith('.md'))) {
  const text = readFileSync(new URL(f, DOCS), 'utf8');
  for (const m of text.matchAll(PATH_RE)) {
    if (!cited.has(m[1])) cited.set(m[1], new Set());
    cited.get(m[1]).add(f);
  }
}

const exists = p => DIRS.some(d => existsSync(new URL(d + p, ROOT)));

test('⭐ every repo path named in docs/ exists, or is recorded as gone', () => {
  assert.ok(cited.size > 100,
    `only ${cited.size} paths parsed out of docs/ — the scan is not working`);

  const dead = [...cited.keys()].filter(p => !exists(p) && !(p in GONE)).sort();
  assert.deepEqual(dead, [],
    'these paths are named in the design record and are not in the repo. Either '
    + 'the document is describing something that moved — fix the document — or it '
    + 'is deliberately historical, in which case add it to GONE with the reason.\n'
    + dead.map(p => `  ${p}  (in ${[...cited.get(p)].join(', ')})`).join('\n'));
});

test('⭐ nothing on the GONE list has quietly come back', () => {
  /* ⭐ THE OTHER DIRECTION, AND IT IS THE ONE A LEDGER ALWAYS FORGETS. A list
     that only ever grows becomes a document describing a repo that no longer
     exists — `test/park.test.js` learned this about its own ledger and asserts
     the same thing. If a path is restored, its excuse must go. */
  const back = Object.keys(GONE).filter(exists).sort();
  assert.deepEqual(back, [],
    'these are on the GONE list and are present in the repo — delete their entries');
});

test('⭐ every GONE entry is actually cited by a document', () => {
  // An excuse for a path nobody mentions is dead weight that reads as coverage.
  const unused = Object.keys(GONE).filter(p => !cited.has(p)).sort();
  assert.deepEqual(unused, [],
    'these are excused and no document cites them — delete their entries');
});
