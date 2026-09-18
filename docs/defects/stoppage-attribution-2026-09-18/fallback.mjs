/**
 * A FALLBACK FOR THE OFFSIDES THE DOT CANNOT NAME — tested on the ones it CAN.
 *
 * ⛔ The candidate signal is LOCATION, never possession: an offside is called at a
 * blue line, so the play immediately before it was heading into one team's end.
 * `_norm` puts the home team defending -x, so a located play at x>0 is in the AWAY
 * team's end and the attacking (offending) side is HOME.
 *
 * The control is the 94.4% whose offender the restart dot already names.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const S='/tmp/claude-1000/-home-twojandk-projects-read-the-game/8f9d1658-c867-4634-b583-bc00a74d9ec7/scratchpad';
const cat=JSON.parse(readFileSync(`${S}/catalog.json`,'utf8'));
const ids=cat.games.filter(g=>g.v).map(g=>g.id).slice(-900);
const LOCATED=new Set(['shot-on-goal','goal','missed-shot','blocked-shot','hit','giveaway','takeaway','faceoff']);
const rows=[]; let done=0; const failed=[];

function dotSays(fx){
  if(fx==null||fx===0)return null;
  if(Math.abs(fx)===69)return fx<0?'home':'away';      // intentional: offender's own end
  if(Math.abs(fx)===20)return fx<0?'away':'home';      // outside the blue line entered
  return null;
}
async function one(id){
  for(let t=0;t<3;t++){
    try{
      const r=await fetch(`https://data.readthegame.co/extract/${id}.json`);
      if(!r.ok)throw new Error('HTTP '+r.status);
      const g=await r.json(), ev=g.events||[];
      for(let i=0;i<ev.length;i++){
        const e=ev[i];
        if(e.type!=='stoppage'||e.rsn!=='offside')continue;
        const nx=ev.slice(i+1).find(x=>x.type==='faceoff');
        // the last LOCATED play before the whistle, and how far back it was
        let prev=null, back=0;
        for(let j=i-1;j>=0&&i-j<=8;j--){
          if(LOCATED.has(ev[j].type)&&ev[j].x!=null){prev=ev[j];back=i-j;break;}
        }
        rows.push({id, dot: dotSays(nx&&nx.x!=null?nx.x:null),
                   prevX: prev?prev.x:null, prevType: prev?prev.type:null, back,
                   gap: prev?e.s-prev.s:null});
      }
      return;
    }catch(err){if(t===2)failed.push([id,String(err.message)]);}
  }
}
let next=0;
await Promise.all(Array.from({length:10},async()=>{while(next<ids.length){await one(ids[next++]);if(++done%200===0)process.stderr.write(`  ${done}/${ids.length}\n`);}}));
writeFileSync(`${S}/fallback.json`,JSON.stringify({games:ids.length,failed,rows}));
process.stderr.write(`done: ${rows.length} offsides from ${ids.length} games, ${failed.length} failed\n`);
