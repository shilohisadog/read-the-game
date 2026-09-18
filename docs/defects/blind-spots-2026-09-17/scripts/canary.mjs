import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { walkPage } from './walk.mjs';
const ROOT='/home/twojandk/projects/read-the-game', WORK='/tmp/rtg-canary';
const BUILD='export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null';
const CANARIES=[
 {n:'goal mark radius',      f:'src/lib/marks.js',   a:"e.type==='goal'?3.2:", b:"e.type==='goal'?6.4:"},
 {n:'figure shadow ellipse', f:'src/lib/figures.js', a:'u*2.7,u*0.75', b:'u*5.4,u*0.75'},
 {n:'figure bob amplitude',  f:'src/lib/figures.js', a:'*u*0.30:0', b:'*u*0.90:0'},
 {n:'bob t-multiplier (the survivorship escape)', f:'src/lib/figures.js', a:'Math.sin(t*1.7+', b:'Math.sin(t*3.4+'},
];
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,maxBuffer:1<<28}).toString();
const head=git('rev-parse','HEAD').trim();
if(existsSync(WORK)){try{git('worktree','remove','--force',WORK);}catch{} rmSync(WORK,{recursive:true,force:true});}
git('worktree','add','-q','--detach',WORK,head);
const sh=c=>execFileSync('bash',['-c',c],{cwd:WORK,maxBuffer:1<<28}).toString();
const page=join(WORK,'src/read-the-game.html');
sh(BUILD); const control=await walkPage(page);
for(const c of CANARIES){
  sh('git checkout -q -- . && git clean -fdq');
  const p=join(WORK,c.f), s=readFileSync(p,'utf8');
  if(!s.includes(c.a)){console.log(`${c.n}: TEXT NOT FOUND — canary could not be planted`);continue;}
  writeFileSync(p,s.replace(c.a,c.b)); sh(BUILD);
  const now=await walkPage(page);
  let d=0; for(let i=0;i<control.length;i++) if(control[i]!==now[i]) d++;
  console.log(`${c.n.padEnd(46)} ${d?`FIRED — ${d} of ${control.length} frame-states differ`:'SILENT — the walk cannot see this'}`);
}
sh('git checkout -q -- . && git clean -fdq'); git('worktree','remove','--force',WORK);
