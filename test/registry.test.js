/**
 * EVERY NAME THE CODE GIVES A MEASURE RESOLVES TO ONE ENTRY IN THE LIST.
 * Two paths: the keys and labels are read from the surfaces' own modules and the
 * built game page, never from the registry, and the registry must account for
 * every one of them. Labels are read FROM the list, so the wording checks ask
 * the two things that can still go wrong: a surface typing its own text again, and
 * a page calling for an entry or field the list does not have.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEASURES, MEASURE_UNITS as UNITS, MEASURE_CREDITS as CREDITS, MEASURE_STATUS as STATUS, claimOf } from '../src/lib/registry.js';
import { CLUB_ROWS, PLAYER_ROWS, POSSESSION_FAMILY, leagueRows } from '../src/lib/preview.js';
import { EXPLAINED, PRINTED, PRINTED_KEYS, explainedLabel } from '../src/lib/methods.js';
import { LAYERS } from '../builders/layer-rules.mjs';
import { tiedControl } from '../src/lib/layers/tied.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const measures = JSON.parse(read('../data/measures.json'));
const lenses = [...LAYERS, tiedControl];
const chips = [...read('../src/game.html').matchAll(/data-l="([a-z-]+)"[^>]*><span class="pkl">([^<]+)</g)]
  .map(m => ({ key: m[1], label: m[2] })).filter(c => c.key !== 'none');

/** Every naming system, as the code itself enumerates it. */
const SYSTEMS = {
  lens: lenses.map(l => l.id),
  row: [...CLUB_ROWS, ...PLAYER_ROWS].map(r => r.key),
  withheld: POSSESSION_FAMILY.map(r => r.key).filter(k => !CLUB_ROWS.some(r => r.key === k)),
  league: leagueRows(measures).map(r => r.key),
  derivation: EXPLAINED,
  printed: PRINTED_KEYS,
};

test('the game page offers chips, so the wording check has something to read', () => {
  assert.ok(chips.length >= 6, `found ${chips.length} chips in src/game.html`);
});

test('every entry is complete and uses the declared vocabularies', () => {
  const ids = new Set();
  for (const m of MEASURES) {
    assert.ok(!ids.has(m.id), `two entries are called ${m.id}`); ids.add(m.id);
    for (const f of ['name', 'says', 'counts', 'of', 'credit', 'unit', 'strength', 'score', 'scopes', 'keys'])
      assert.ok(m[f] != null, `${m.id} has no ${f}`);
    assert.ok(UNITS.includes(m.unit), `${m.id}: unit ${m.unit}`);
    assert.ok(CREDITS.includes(m.credit), `${m.id}: credit ${m.credit}`);
    assert.ok(STATUS.includes(m.status || 'live'), `${m.id}: status ${m.status}`);
    for (const s of Object.keys(m.keys)) assert.ok(s in SYSTEMS, `${m.id} claims a key in an unknown system ${s}`);
  }
});

test('every key the code uses is claimed by exactly one entry', () => {
  const missing = [], doubled = [];
  for (const [system, keys] of Object.entries(SYSTEMS)) {
    for (const key of new Set(keys)) {
      const n = MEASURES.filter(m => m.keys[system] === key).length;
      // One derivation may explain several entries; any other key names one.
      if (n === 0) missing.push(`${system}:${key}`);
      if (n > 1 && system !== 'derivation') doubled.push(`${system}:${key}`);
    }
  }
  assert.deepEqual(missing, [], 'keys the code uses that no entry claims');
  assert.deepEqual(doubled, [], 'keys claimed by more than one entry');
});

test('every key an entry claims exists in the code', () => {
  const ghosts = MEASURES.flatMap(m => Object.entries(m.keys)
    .filter(([s, k]) => !SYSTEMS[s].includes(k)).map(([s, k]) => `${m.id} → ${s}:${k}`));
  assert.deepEqual(ghosts, []);
});

test('a proposed entry claims no key, and a live one is reachable', () => {
  for (const m of MEASURES) {
    if (m.status === 'proposed') assert.deepEqual(m.keys, {}, `${m.id} is proposed but claims keys`);
  }
});

const ROLES = ['name', 'says', 'heading', 'layer', 'chip', 'tile'];

test('every chip over the rink is the list\u2019s chip for that layer', () => {
  for (const c of chips) assert.equal(c.label, claimOf('lens', c.key)?.chip, `chip ${c.key}`);
});

test('every surface label is read from the list, the same text the list holds', () => {
  const pairs = [
    ...lenses.map(l => [l.label, claimOf('lens', l.id)?.layer, `layer ${l.id}`]),
    ...[...CLUB_ROWS, ...PLAYER_ROWS].map(r => [r.label, claimOf('row', r.key)?.name, `row ${r.key}`]),
    ...[...CLUB_ROWS, ...PLAYER_ROWS].map(r => [r.says, claimOf('row', r.key)?.says, `row ${r.key} says`]),
    ...POSSESSION_FAMILY.filter(r => !CLUB_ROWS.includes(r))
      .map(r => [r.label, claimOf('withheld', r.key)?.name, `withheld ${r.key}`]),
    ...PRINTED_KEYS.map(k => [PRINTED[k].label, claimOf('printed', k)?.heading, `printed ${k}`]),
    ...EXPLAINED.filter(k => explainedLabel(k)).map(k => [explainedLabel(k),
      MEASURES.find(m => m.keys.derivation === k)?.heading, `derivation ${k}`]),
  ];
  assert.deepEqual(pairs.filter(([a, b]) => a !== b).map(p => p[2]), []);
});

test('no page or builder types a wording the list owns', () => {
  const files = ['../builders/build_index.py', '../builders/build_main.py',
    ...['preview.js', 'printed.js', 'derivation.js', 'league-rows.js', 'methods.js', 'sections.js']
      .map(f => `../src/lib/${f}`),
    ...lenses.map(l => `../src/lib/layers/${l === tiedControl ? 'tied' : ({ slot: 'danger' }[l.id] || l.id)}.js`)];
  const owned = MEASURES.flatMap(m => ROLES.map(r => m[r]))
    .filter(w => typeof w === 'string' && w.length >= 16);
  const typed = [];
  for (const f of files) {
    const src = read(f);
    for (const w of owned) for (const q of [`'${w}'`, `"${w}"`, `>${w}<`]) if (src.includes(q)) typed.push(`${f}: ${q}`);
  }
  assert.deepEqual(typed, []);
});

test('every measure() call in a built page names an entry and a field it has', () => {
  const calls = [];
  for (const page of ['../src/preview.html', '../src/how-we-measure.html', '../src/game.html'])
    for (const m of read(page).matchAll(/measure\('(\w+)'\)\.(\w+)/g)) calls.push([page, m[1], m[2]]);
  assert.ok(calls.length >= 5, `found ${calls.length} calls`);
  const bad = calls.filter(([, id, f]) => typeof MEASURES.find(m => m.id === id)?.[f] !== 'string');
  assert.deepEqual(bad.map(c => c.join(' ')), []);
});

test('the slot entries carry the slot boundary as our policy', () => {
  for (const id of ['slotShots', 'slotShare', 'slotGoals'])
    assert.match(MEASURES.find(m => m.id === id).policy || '', /ours/);
});
