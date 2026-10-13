/**
 * The nightly pick of a game for each lesson on the learn page.
 *
 *   node builders/lessons.mjs <dir>   reads <dir>/catalog.json and <dir>/extract/,
 *                                     writes <dir>/lessons.json
 *
 * The rule (`src/lib/lessons.js::pickLessons`): each lesson, in the learn page's
 * order, takes the newest published game in which its moment happens and which
 * no earlier lesson took. The replay resolves `?lesson=<id>` through this
 * document, and falls back to the reference game's door when it is missing.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickLessons, LESSON_ORDER } from '../src/lib/lessons.js';
import { inScope } from '../src/lib/archive.js';
import { stable } from './measure.mjs';

export const RULE = 'Each lesson, in the order of the learn page, opens the newest game '
  + 'we hold in which its moment happens and which no earlier lesson took.';

/** Published, in-scope catalog rows, newest first (date, then id). */
export function newestFirst(catalog) {
  return (catalog.games || [])
    .filter(g => g.v === 1 && inScope(g.id) && g.d)
    .sort((a, b) => (a.d === b.d ? b.id - a.id : (a.d < b.d ? 1 : -1)));
}

export function build(dir) {
  const rows = newestFirst(JSON.parse(readFileSync(join(dir, 'catalog.json'), 'utf8')));
  const read = i => {
    const f = join(dir, 'extract', `${rows[i].id}.json`);
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  };
  const lessons = pickLessons(read, rows.length);
  return { rule: RULE, through: rows.length ? rows[0].d : null, lessons };
}

function main(argv) {
  const dir = argv[2];
  if (!dir) { console.error('usage: node builders/lessons.mjs <dir>'); return 2; }
  const doc = build(dir);
  writeFileSync(join(dir, 'lessons.json'), stable(doc));
  const got = LESSON_ORDER.filter(id => doc.lessons[id]);
  console.log(`  lessons: ${got.length} of ${LESSON_ORDER.length} picked, through ${doc.through}`
    + (got.length < LESSON_ORDER.length
       ? ` — none for ${LESSON_ORDER.filter(id => !doc.lessons[id]).join(', ')}` : ''));
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv));
