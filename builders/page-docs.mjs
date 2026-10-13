#!/usr/bin/env node
/**
 * Write or verify the per-page documents (`src/lib/page-docs.js`).
 *
 *   node builders/page-docs.mjs <in> [<out>]    write them from <in>/catalog.json
 *                                               and <in>/index.json into <out>
 *                                               (default <in>)
 *   node builders/page-docs.mjs --verify <dir>  rebuild them and require that
 *                                               <dir> holds exactly those files,
 *                                               byte for byte, and no others
 *
 * Exit 1 on any difference, or when either input is missing.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pageDocs } from '../src/lib/page-docs.js';
import { stable } from './measure.mjs';

export const SLICE_DIRS = ['team', 'calendar'];

export function build(dir) {
  const read = f => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const docs = pageDocs(read('catalog.json'), read('index.json'));
  const out = {};
  for (const [path, doc] of Object.entries(docs)) out[path] = stable(doc);
  return out;
}

/** Every difference between what <dir> holds and what the inputs produce. */
export function differences(dir) {
  const want = build(dir);
  const have = new Set(['front.json']);
  for (const d of SLICE_DIRS) {
    if (!existsSync(join(dir, d))) continue;
    for (const f of readdirSync(join(dir, d))) if (f.endsWith('.json')) have.add(`${d}/${f}`);
  }
  const out = [];
  for (const [path, bytes] of Object.entries(want)) {
    const p = join(dir, path);
    if (!existsSync(p)) out.push(`missing  ${path}`);
    else if (readFileSync(p, 'utf8') !== bytes) out.push(`differs  ${path}`);
    have.delete(path);
  }
  for (const path of have) if (existsSync(join(dir, path))) out.push(`extra    ${path}`);
  return out.sort();
}

function main(argv) {
  const verify = argv[0] === '--verify';
  const dir = verify ? argv[1] : argv[0];
  const out = verify ? dir : (argv[1] || dir);
  if (!dir || !existsSync(join(dir, 'catalog.json')) || !existsSync(join(dir, 'index.json'))) {
    console.error(`::error::page-docs needs catalog.json and index.json in ${dir}`);
    process.exit(1);
  }
  if (verify) {
    const diff = differences(dir);
    for (const line of diff.slice(0, 20)) console.log(`  ${line}`);
    if (diff.length) {
      console.log(`::error::${diff.length} page document(s) are not the projection of the catalog and index`);
      process.exit(1);
    }
    console.log(`  page documents are the exact projection of the catalog and index (${Object.keys(build(dir)).length})`);
    return;
  }
  const docs = build(dir);
  for (const [path, bytes] of Object.entries(docs)) {
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), bytes);
  }
  console.log(`  page documents: ${Object.keys(docs).length} written`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
