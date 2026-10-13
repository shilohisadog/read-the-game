/**
 * The REFERENCE doors: each lesson's moment in the reference games, committed.
 * The replay opens these when the nightly pick (`builders/lessons.mjs`,
 * `lessons.json`) cannot be read; the rules themselves live in
 * `src/lib/lessons.js`.
 *
 * THIS FILE IS A DRIVER AND NOTHING ELSE, for the same reason `measure.mjs` is.
 * The URL grammar — the clock is REMAINING, the ordinal appears only when a
 * moment is ambiguous, the layer vocabulary IS the layer ids — lives in
 * `src/lib/deeplink.js`. Restating any of it in `build_index.py` would be a
 * second implementation of a shared rule in a second language, which is the
 * defect measure.mjs exists to prevent. So Python renders the cards and node
 * decides the moments, and the two meet over one committed document.
 *
 * WHY THE MOMENTS ARE ASKED FOR RATHER THAN CHOSEN. The first version of this
 * took "the first event of the right type". It put THREE cards on one event and
 * sent the slot card to a point shot at x=29 that the slot layer does not count.
 * Only half of that was visible: a wrong slot example can be caught by looking,
 * and three cards sharing a moment has no symptom at all — if the three had
 * happened to be legitimate, the template smell would have shipped unnoticed.
 *
 * So a MEASUREMENT card's moment is the first index in that layer's own
 * `counted`, and a RULE card's moment is the first event carrying that reason in
 * the feed. Neither is a judgement, and neither can drift away from the layer it
 * illustrates.
 *
 *   node builders/learn-doors.mjs            ->  data/learn-doors.json
 *   node builders/learn-doors.mjs --verify   ->  exit 1 if the file is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { momentsOf, doorAt } from '../src/lib/lessons.js';
import { stable } from './measure.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * The reference game's doors. The rules live in `src/lib/lessons.js`; this
 * throws where the reference game lacks a moment, because a committed door must
 * open something.
 */
export function doors(game, ot) {
  const { found, changed } = momentsOf(game);
  const regular = found.filter(f => f[0] !== 'overtime');
  const out = {};
  const missing = [];
  for (const entry of regular) {
    const door = doorAt(game, entry);
    if (door) out[entry[0]] = door; else missing.push(entry[0]);
  }
  if (missing.length) {
    throw new Error(`no moment in this game for: ${missing.join(', ')} — a card `
                  + 'cannot promise something the game does not contain');
  }
  if (out.shifts) out.shifts.changed = changed;
  if (ot) {
    const door = doorAt(ot, momentsOf(ot).found.find(f => f[0] === 'overtime'));
    if (!door) {
      throw new Error('the overtime reference game contains no overtime goal — '
                    + 'data/rich-ot.json is the wrong game');
    }
    out.overtime = { ...door, game: ot.game.id };
  }
  return {
    game: { id: game.game.id, date: game.game.date,
            away: game.teams.away.ab, home: game.teams.home.ab },
    ot: ot ? { id: ot.game.id, date: ot.game.date,
               away: ot.teams.away.ab, home: ot.teams.home.ab } : null,
    doors: out,
  };
}

function main(argv) {
  const src = join(ROOT, 'data', 'rich.json');
  const otSrc = join(ROOT, 'data', 'rich-ot.json');
  const out = join(ROOT, 'data', 'learn-doors.json');
  const body = stable(doors(JSON.parse(readFileSync(src, 'utf8')),
                            JSON.parse(readFileSync(otSrc, 'utf8')))) + '\n';

  if (argv.includes('--verify')) {
    const have = readFileSync(out, 'utf8');
    if (have === body) { console.log(`  learn-doors.json BYTE-IDENTICAL`); return 0; }
    console.error('  learn-doors.json DIFFERS from a fresh build -- gate FAILED');
    return 1;
  }
  writeFileSync(out, body);
  console.log(`wrote ${out} ${body.length} bytes`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv));
