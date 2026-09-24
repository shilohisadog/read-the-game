/**
 * The replay's layers, as the rules they carry — asked of the layers themselves.
 *
 * ⭐⭐⭐ KEVIN'S RULING, 2026-09-24: the rules live in the layer descriptors,
 * rendered inline on the replay and INDEXED by the methods page. Not written
 * into the methods page as a section per layer, which would be a second copy of
 * `counts` and `credits` in a second language, free to drift from the reducer
 * that makes them true. So node asks the layers and writes one document, and
 * `build_index.py` renders it — the same arrangement `learn-doors.mjs` already
 * has, and for the same reason.
 *
 * ⛔ IT TAKES THE DESCRIPTOR AND NOT THE REDUCER. Nothing here runs a game;
 * `counts`, `credits` and `work` are properties of the RULE, so this is a
 * projection of six objects and has no data source at all. That is why it needs
 * no fixture and cannot go stale against one.
 *
 * ⚠️ `tiedControl` IS NOT HERE, AND THAT IS NOT AN OVERSIGHT. It is the archive
 * ranking measurement, not a layer a viewer can switch on — it carries no `＋`
 * label and appears in no chip. A list of "the replay's layers" that included it
 * would be describing a control that does not exist.
 *
 *   node builders/layer-rules.mjs            ->  data/layer-rules.json
 *   node builders/layer-rules.mjs --verify   ->  exit 1 if the file is stale
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { blocked } from '../src/lib/layers/blocked.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { danger } from '../src/lib/layers/danger.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { zonestart } from '../src/lib/layers/zonestart.js';
import { anchorOf } from '../src/lib/anchors.js';
import { EXPLAINED, PRINTED_KEYS, explainedLabel } from '../src/lib/methods.js';
import { stable } from './measure.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every layer the replay can switch on, in the order the chips carry them. */
export const LAYERS = [corsi, danger, blocked, goaltending, whistle, zonestart];

export function rules(explained) {
  return LAYERS.map(l => {
    /* ⛔ EVERY FIELD IS REQUIRED AND THE ABSENCE IS THE FAILURE. A layer that
       reached a viewer with no rule beside its number is the defect this whole
       field family exists against, and an empty string renders as a blank line
       rather than as a missing one. */
    for (const k of ['id', 'label', 'counts', 'credits']) {
      if (typeof l[k] !== 'string' || l[k].trim().length < 3) {
        throw new Error(`layer ${l.id}: \`${k}\` is missing or empty — a layer `
          + 'may not reach a viewer without the rule that made its number');
      }
    }
    if (!Array.isArray(l.work) || !l.work.length) {
      throw new Error(`layer ${l.id}: no \`work\` — every layer needs a door to `
        + 'the archive figure behind what it counts');
    }
    /* ⭐⭐ AND THE KEY MUST BE ONE THE METHODS PAGE CAN EXPLAIN, checked HERE
       rather than left to the rendered page. A door written from a typo
       resolves to nothing and looks completely normal; this names the layer and
       the key, which is what a person fixing it needs. */
    for (const k of l.work) {
      if (!explained.includes(k) || !explainedLabel(k)) {
        throw new Error(`layer ${l.id}: \`work\` names ${k}, and methods.js `
          + `explains no such figure (it has ${explained.join(', ')})`);
      }
    }
    return { id: l.id, label: l.label, counts: l.counts, credits: l.credits,
             /* ⭐ THE LABEL TRAVELS WITH THE DOOR. Stoppages opens three
                sections and three links reading "How we counted this" is a menu
                with nothing on it; the name is `methods.js`'s and is read from
                there rather than typed beside the layer. */
             work: l.work.map(k => ({ key: k, anchor: anchorOf(k),
                                      label: explainedLabel(k) })) };
  });
}

function main(argv) {
  const out = join(ROOT, 'data', 'layer-rules.json');
  const body = stable({ layers: rules([...EXPLAINED_KEYS()]) }) + '\n';

  if (argv.includes('--verify')) {
    if (readFileSync(out, 'utf8') === body) {
      console.log('  layer-rules.json BYTE-IDENTICAL'); return 0;
    }
    console.error('  layer-rules.json DIFFERS from a fresh build -- gate FAILED');
    return 1;
  }
  writeFileSync(out, body);
  console.log(`wrote ${out} ${body.length} bytes`);
  return 0;
}

/** Every figure the methods page has a section for — derivations and printed. */
function EXPLAINED_KEYS() { return [...EXPLAINED, ...PRINTED_KEYS]; }

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv));
