/* Do the new browser states catch the two gesture escapes? */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { capture, judgeStates } from '/home/twojandk/projects/read-the-game/tools/browser/states.mjs';
const ROOT='/home/twojandk/projects/read-the-game', WORK='/tmp/rtg-gesture';
const S='/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const BUILD='export PYTHONDONTWRITEBYTECODE=1; node builders/attribution.mjs >/dev/null && node builders/learn-doors.mjs >/dev/null && node builders/learn-figures.mjs >/dev/null && python3 builders/build_main.py >/dev/null';
const rel=JSON.parse(readFileSync(join(S,'reloc-89e3504.json'),'utf8'));
const want=['s20260916-82','s916-50','s20260916-96'];
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,maxBuffer:1<<28}).toString();
const head=git('rev-parse','HEAD').trim();
if(existsSync(WORK)){try{git('worktree','remove','--force',WORK);}catch{} rmSync(WORK,{recursive:true,force:true});}
git('worktree','add','-q','--detach',WORK,head);
const sh=c=>execFileSync('bash',['-c',c],{cwd:WORK,maxBuffer:1<<28}).toString();
async function judge(){
  const dir=mkdtempSync('/tmp/rtg-g-');
  cpSync(join(WORK,'src/read-the-game.html'),join(dir,'read-the-game.html'));
  const seen=await capture({dir}); rmSync(dir,{recursive:true,force:true});
  return { bad: judgeStates(seen).filter(v=>!v.ok), seen };
}
sh(BUILD);
const base=await judge();
console.log(base.bad.length?`⛔ CONTROL RED (${base.bad.length})`:'control green\n');
for(const id of want){
  const m=rel.find(x=>x.id===id);
  sh('git checkout -q -- . && git clean -fdq');
  const p=join(WORK,m.file), src=readFileSync(p,'utf8');
  if(src.slice(m.at,m.at+m.from.length)!==m.from){console.log(id,'TOKEN MOVED');continue;}
  writeFileSync(p, src.slice(0,m.at)+m.to+src.slice(m.at+m.from.length));
  sh(BUILD);
  const {bad,seen}=await judge();
  console.log(`${id}  ${m.file}:${m.line}  ${m.from}→${m.to}`);
  console.log(`   ${bad.length?'CAUGHT by replay-states — '+bad.map(v=>v.why.split(':')[0]).join(', '):'not caught by replay-states'}`);
  if(bad.length) console.log(`   ${bad[0].why.slice(0,130)}`);
  else console.log(`   step-back ${seen['step-back'].scrubBefore}→${seen['step-back'].scrubAfter}, door ${seen['slot-door'].why}, hit ${seen['slot-door'].hitPct}%`);
}
sh('git checkout -q -- . && git clean -fdq'); git('worktree','remove','--force',WORK);
