import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { walkPage } from './walk.mjs';
const ROOT = '/home/twojandk/projects/read-the-game';
const S = '/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const WORK = '/tmp/rtg-walk-measure';
const BUILD = 'export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null';
const adj = JSON.parse(readFileSync(join(ROOT, 'docs/defects/survivorship-2026-09-16/data/code-reading-adjudicated.json'), 'utf8'));
const esc = new Set(adj.filter(r => ['RV','RN'].includes(r.adjudicated)).map(r => r.id));
const alive = JSON.parse(readFileSync(join(S, 'reloc-head.json'), 'utf8')).filter(m => esc.has(m.id) && m.status !== 'gone');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const head = git('rev-parse','HEAD').trim();
if (existsSync(WORK)) { try { git('worktree','remove','--force',WORK); } catch {} rmSync(WORK,{recursive:true,force:true}); }
git('worktree','add','-q','--detach',WORK,head);
const sh = c => execFileSync('bash',['-c',c],{cwd:WORK,maxBuffer:1<<28}).toString();
const page = join(WORK,'src/read-the-game.html');
sh(BUILD);
const control = await walkPage(page);
console.log(`control: ${control.length} rows\n`);
const rows = [];
for (const m of alive) {
  sh('git checkout -q -- . && git clean -fdq');
  const p = join(WORK, m.file), src = readFileSync(p,'utf8');
  if (src.slice(m.at, m.at+m.from.length) !== m.from) { console.log(`${m.id} TOKEN MOVED`); continue; }
  writeFileSync(p, src.slice(0,m.at)+m.to+src.slice(m.at+m.from.length));
  let ok = true; try { sh(BUILD); } catch { ok = false; }
  const now = ok ? await walkPage(page) : null;
  let diff = [];
  if (now) for (let i=0;i<Math.max(control.length,now.length);i++) if (control[i]!==now[i]) diff.push(control[i]?control[i].split(' ').slice(0,2).join(' '):`row${i}`);
  const by = {};
  for (const d of diff) { const k = d.split(' ')[0]; by[k]=(by[k]||0)+1; }
  rows.push({ id:m.id, file:m.file, chg:`${m.from}→${m.to}`, built:ok, diffs:diff.length, by });
  console.log(`${m.id.padEnd(16)} ${m.file.padEnd(20)} ${(`${m.from}→${m.to}`).padEnd(9)} ${!ok?'BUILD FAILED':diff.length?`${diff.length} frame-states differ: ${JSON.stringify(by)}`:'IDENTICAL in every frame of every layer'}`);
}
sh('git checkout -q -- . && git clean -fdq'); git('worktree','remove','--force',WORK);
writeFileSync(join(S,'walk-measure.json'), JSON.stringify({head,rows},null,1));
console.log(`\n${rows.filter(r=>r.diffs>0).length} of ${rows.length} change the DOM somewhere in the walk.`);
