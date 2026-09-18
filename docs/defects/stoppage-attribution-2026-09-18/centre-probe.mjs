/* What is around a centre-ice offside restart? Look, do not theorise. */
import { readFileSync, writeFileSync } from 'node:fs';
const S='/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const ids=readFileSync(`${S}/centre-ids.txt`,'utf8').trim().split('\n');
const want=new Map();
for(const row of JSON.parse(readFileSync(`${S}/centre-rows.json`,'utf8'))){
  if(!want.has(String(row.id))) want.set(String(row.id),[]);
  want.get(String(row.id)).push(row.s);
}
const out=[]; let done=0; const failed=[];
async function one(id){
  for(let t=0;t<3;t++){
    try{
      const r=await fetch(`https://data.readthegame.co/extract/${id}.json`);
      if(!r.ok)throw new Error('HTTP '+r.status);
      const g=await r.json(); const ev=g.events||[];
      const H=g.teams.home.id, A=g.teams.away.id;
      for(const secs of want.get(String(id))){
        const i=ev.findIndex(e=>e.type==='stoppage'&&/^offside$/.test(e.rsn||'')&&e.s===secs);
        if(i<0){failed.push([id,'stoppage not found']);continue;}
        const before=ev.slice(Math.max(0,i-6),i).map(e=>({t:e.type,rsn:e.rsn||null,own:e.own,x:e.x,s:e.s}));
        const after=ev.slice(i+1,i+4).map(e=>({t:e.type,rsn:e.rsn||null,own:e.own,x:e.x,s:e.s}));
        out.push({id,secs,H,A,rsn2:ev[i].rsn2||null,per:ev[i].per,before,after});
      }
      return;
    }catch(e){if(t===2)failed.push([id,String(e.message)]);}
  }
}
let next=0;
await Promise.all(Array.from({length:10},async()=>{while(next<ids.length){await one(ids[next++]);if(++done%200===0)process.stderr.write(`  ${done}/${ids.length}\n`);}}));
writeFileSync(`${S}/centre-context.json`,JSON.stringify({out,failed}));
process.stderr.write(`done: ${out.length} contexts, ${failed.length} failed\n`);
