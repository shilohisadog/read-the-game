/**
 * EVERY NAME THE CODE GIVES A MEASURE RESOLVES TO ONE ENTRY IN THE LIST.
 * Two paths: the keys and labels are read from the surfaces' own modules and the
 * built game page, never from the registry, and the registry must account for
 * every one of them. A wording a reader meets must be the entry's `name` or one of
 * its `words`, and every listed word must still be met somewhere, so a renamed
 * label fails here instead of drifting.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEASURES, UNITS, CREDITS, STATUS, claimOf } from '../src/lib/registry.js';
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

/** Every wording a reader meets, with the key that places it. */
const WORDINGS = [
  ...lenses.map(l => ({ system: 'lens', key: l.id, label: l.label })),
  ...chips.map(c => ({ system: 'lens', key: c.key, label: c.label })),
  ...[...CLUB_ROWS, ...PLAYER_ROWS].map(r => ({ system: 'row', key: r.key, label: r.label })),
  ...POSSESSION_FAMILY.map(r => ({ system: CLUB_ROWS.includes(r) ? 'row' : 'withheld', key: r.key, label: r.label })),
  ...EXPLAINED.map(k => ({ system: 'derivation', key: k, label: explainedLabel(k) })).filter(w => w.label),
  ...PRINTED_KEYS.map(k => ({ system: 'printed', key: k, label: PRINTED[k].label })),
];

test('the game page offers chips, so the wording check has something to read', () => {
  assert.ok(chips.length >= 6, `found ${chips.length} chips in src/game.html`);
});

test('every entry is complete and uses the declared vocabularies', () => {
  const ids = new Set();
  for (const m of MEASURES) {
    assert.ok(!ids.has(m.id), `two entries are called ${m.id}`); ids.add(m.id);
    for (const f of ['name', 'says', 'counts', 'of', 'credit', 'unit', 'strength', 'score', 'scopes', 'keys', 'words'])
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

test('every wording a reader meets is the entry’s name or one of its words', () => {
  const stray = [];
  for (const w of WORDINGS) {
    const m = claimOf(w.system, w.key);
    assert.ok(m, `${w.system}:${w.key} has no entry`);
    if (w.label !== m.name && !m.words.includes(w.label)) stray.push(`${m.id} ← "${w.label}" (${w.system}:${w.key})`);
  }
  assert.deepEqual(stray, []);
});

test('a word listed for an entry is met somewhere, so the list cannot carry dead wordings', () => {
  const met = new Set(WORDINGS.map(w => w.label));
  const dead = MEASURES.flatMap(m => m.words.filter(w => !met.has(w)).map(w => `${m.id}: "${w}"`));
  assert.deepEqual(dead, []);
});

test('the slot entries carry the slot boundary as our policy', () => {
  for (const id of ['slotShots', 'slotShare', 'slotGoals'])
    assert.match(MEASURES.find(m => m.id === id).policy || '', /ours/);
});
