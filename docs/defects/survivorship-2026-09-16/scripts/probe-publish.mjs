// Detector: run measure.mjs END TO END, as derive.yml does, and fingerprint what it publishes.
// usage: node probe-publish.mjs <clone-root> <games-dir> <work-dir>  -> JSON on stdout
import { readdirSync, readFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const [ROOT, GAMES, WORK] = process.argv.slice(2);
const h = v => createHash('sha1').update(v).digest('hex').slice(0, 16);
rmSync(WORK, { recursive: true, force: true }); mkdirSync(WORK, { recursive: true });
symlinkSync(GAMES, join(WORK, 'extract'));
// No catalog.json on purpose: archiveIsWhole() then accepts a partial tree, which is
// the documented way to run this by hand.
const r = spawnSync('node', [join(ROOT, 'builders/measure.mjs'), '--out', WORK], { encoding: 'utf8', timeout: 120000 });
const out = { exit: r.status === null ? 'TIMEOUT' : r.status, docs: {}, keys: {} };
for (const f of readdirSync(WORK).filter(f => f.endsWith('.json')).sort()) {
  const txt = readFileSync(join(WORK, f), 'utf8');
  out.docs[f] = h(txt);
  // one fingerprint per top-level key too, so a change can be located
  try { const j = JSON.parse(txt); for (const [k, v] of Object.entries(j)) out.keys[`${f}:${k}`] = h(JSON.stringify(v)); } catch {}
}
process.stdout.write(JSON.stringify(out));
