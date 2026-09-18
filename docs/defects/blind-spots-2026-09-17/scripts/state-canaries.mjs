import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync, cpSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { capture, judgeStates } from '/home/twojandk/projects/read-the-game/tools/browser/states.mjs';
const ROOT='/home/twojandk/projects/read-the-game', WORK='/tmp/rtg-state-canary';
const BUILD='export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null';
const C=[
 {n:'the goal label loses its siren',        f:'src/app.js', a:">🚨 ${ESC(playSaid(e))}<", b:">${ESC(playSaid(e))}<"},
 {n:'the goal label loses its club',         f:'src/app.js', a:"return `${lab?lab+' · ':''}GOAL", b:"return `${lab?'':''}GOAL"},
 {n:'the why-card reads ev.target again (the live defect)', f:'src/app.js', a:'const markAt=ev=>{', b:'const markAt=ev=>{if(1)return ev.target&&ev.target.dataset?(ev.target.dataset.i==null?null:+ev.target.dataset.i):null;'},
 {n:'a double-click steps two frames, not one', f:'src/app.js', a:'const DBL_BACK=-1,DBL_FWD=1;', b:'const DBL_BACK=-2,DBL_FWD=2;'},
 {n:'attempts stop being drawn as figures',  f:'src/lib/marks.js', a:'if(ATT.has(e.type)&&k===i&&ft!==null){', b:'if(false&&ATT.has(e.type)&&k===i&&ft!==null){'},
 {n:'marks stop taking the pointer',         f:'src/lib/marks.js', a:'class="ev fig ${cls}', b:'pointer-events="none" class="ev fig ${cls}'},
];
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,maxBuffer:1<<28}).toString();
const head=git('rev-parse','HEAD').trim();
if(existsSync(WORK)){try{git('worktree','remove','--force',WORK);}catch{} rmSync(WORK,{recursive:true,force:true});}
git('worktree','add','-q','--detach',WORK,head);
const sh=c=>execFileSync('bash',['-c',c],{cwd:WORK,maxBuffer:1<<28}).toString();
async function judge(){
  const dir=mkdtempSync('/tmp/rtg-sc-');
  cpSync(join(WORK,'src/read-the-game.html'),join(dir,'read-the-game.html'));
  const seen=await capture({dir});
  rmSync(dir,{recursive:true,force:true});
  return judgeStates(seen).filter(v=>!v.ok);
}
sh(BUILD);
const base=await judge();
console.log(base.length?`⛔ CONTROL IS RED (${base.length}) — nothing below means anything`:'control green\n');
for(const c of C){
  sh('git checkout -q -- . && git clean -fdq');
  const p=join(WORK,c.f), s=readFileSync(p,'utf8');
  if(!s.includes(c.a)){console.log(`${c.n}\n   COULD NOT PLANT — text not found\n`);continue;}
  writeFileSync(p,s.replace(c.a,c.b));
  let built=true; try{sh(BUILD);}catch{built=false;}
  const bad=built?await judge():[{why:'the build failed'}];
  console.log(`${c.n}\n   ${bad.length?'RED — '+bad.map(v=>v.why.split(':')[0]).join(', '):'⛔ STILL GREEN — the check cannot see this'}`);
  if(bad.length) console.log(`   first: ${bad[0].why.slice(0,150)}`);
  console.log();
}
sh('git checkout -q -- . && git clean -fdq'); git('worktree','remove','--force',WORK);
