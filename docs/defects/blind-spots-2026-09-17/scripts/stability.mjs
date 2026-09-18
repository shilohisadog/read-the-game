/* Is a states capture reproducible? Render every state N times at HEAD. */
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { capture, STATES } from '/home/twojandk/projects/read-the-game/tools/browser/states.mjs';

const N = +(process.argv[2] || 3);
const runs = [];
for (let i = 0; i < N; i++) {
  const dir = mkdtempSync('/tmp/rtg-stab-');
  cpSync('/home/twojandk/projects/read-the-game/src/read-the-game.html', join(dir, 'read-the-game.html'));
  const t = Date.now();
  runs.push(await capture({ dir }));
  process.stderr.write(`run ${i + 1}: ${((Date.now() - t) / 1000).toFixed(1)}s\n`);
  rmSync(dir, { recursive: true, force: true });
}
for (const s of STATES) {
  const k = s.key;
  const dom = new Set(runs.map(r => r[k]?.dom));
  const txt = new Set(runs.map(r => r[k]?.text));
  const notes = new Set(runs.map(r => r[k]?.note));
  console.log(`${k.padEnd(20)} dom ${dom.size === 1 ? 'STABLE' : `${dom.size} VALUES`}  text ${txt.size === 1 ? 'STABLE' : `${txt.size} VALUES`}  note=${[...notes].join(' | ')}`);
}
console.log('\nper-state dom hashes:');
for (const s of STATES) console.log(' ', s.key.padEnd(20), runs.map(r => String(r[s.key]?.dom).slice(0, 8)).join(' '));
