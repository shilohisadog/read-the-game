#!/usr/bin/env node
/**
 * `src/lib/attribution.js` -> `data/attribution.json`, for Python to read.
 *
 * ⭐ ONE TABLE, TWO LANGUAGES, AND THE JS IS THE SOURCE. `ATTRIBUTION` maps each
 * event type to the raw field its actor comes from AND to the sentence that says
 * what he did. The extractor needs the first half; the browser needs the second;
 * neither may have its own copy, because a `field` that drifts from its `say`
 * makes the sentence false with nothing going red (CHENG).
 *
 * Same seam as `learn-figures.mjs`: node writes a committed document, Python
 * reads it, and `--verify` in `npm run build` means a stale copy cannot ship.
 *
 *   node builders/attribution.mjs            ->  data/attribution.json
 *   node builders/attribution.mjs --verify   ->  exit 1 if the file is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATTRIBUTION } from '../src/lib/attribution.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'attribution.json');
// ONLY THE HALF PYTHON NEEDS. Emitting `say` too would put the sentence in two
// places, which is the drift this file exists to prevent.
const built = JSON.stringify(
  Object.fromEntries(Object.entries(ATTRIBUTION).map(([t, a]) => [t, a.field])),
  null, 1) + '\n';

if (process.argv.includes('--verify')) {
  let have = '';
  try { have = readFileSync(OUT, 'utf8'); } catch { /* absent counts as stale */ }
  if (have !== built) {
    console.error('attribution.json is stale — run: node builders/attribution.mjs');
    process.exit(1);
  }
  console.log('attribution.json is current');
} else {
  writeFileSync(OUT, built);
  console.log(`attribution.json: ${Object.keys(ATTRIBUTION).length} event type(s)`);
}
