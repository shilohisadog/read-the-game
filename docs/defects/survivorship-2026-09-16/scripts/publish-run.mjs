// node publish-run.mjs <mutants.json> <out.jsonl> [ids...]  — calculate-population mutants only, on the SECOND clone
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const S = '/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const C2 = join(S, 'mut2');
const sh = cmd => spawnSync('bash', ['-lc', cmd], { cwd: C2, encoding: 'utf8', timeout: 180000 });
const base = JSON.parse(readFileSync(join(S, 'base-publish.json'), 'utf8'));
const [file, outFile, ...ids] = process.argv.slice(2);
const want = new Set(ids);
const done = new Set(existsSync(outFile) ? readFileSync(outFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id) : []);
for (const m of JSON.parse(readFileSync(file, 'utf8')).mutants) {
  const touchesLib = [m, ...(m.also || [])].some(x => x.file && x.file.startsWith('src/lib/'));
  if (!touchesLib || done.has(m.id) || (want.size && !want.has(m.id))) continue;
  sh('git checkout -q -- . && git clean -fdq');
  for (const x of [m, ...(m.also || [])]) {
    const p = join(C2, x.file); const src = readFileSync(p, 'utf8');
    if (x.find != null) writeFileSync(p, src.replace(x.find, x.replace));
    else if (x.at != null && x === m) writeFileSync(p, src.slice(0, m.at) + m.to + src.slice(m.at + m.from.length));
  }
  const r = sh(`node ${S}/probe-publish.mjs ${C2} ${S}/games/extract ${S}/pub-work2`);
  let res = { id: m.id };
  try {
    const P = JSON.parse(r.stdout);
    res.pubExit = P.exit;
    res.pubChanged = Object.keys(base.keys).filter(k => P.keys[k] !== base.keys[k]);
  } catch { res.pubProbe = r.status; }
  sh('git checkout -q -- . && git clean -fdq');
  appendFileSync(outFile, JSON.stringify(res) + '\n');
  console.log(m.id, m.file + ':' + (m.line || ''), 'exit', res.pubExit, 'changed', (res.pubChanged || []).join(' '));
}
