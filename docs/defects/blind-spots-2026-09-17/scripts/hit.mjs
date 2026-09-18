import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dumpDom, findChrome, serve } from '/home/twojandk/projects/read-the-game/tools/browser/lib.mjs';
const W = +(process.argv[2] || 1100), H = +(process.argv[3] || 900);
const PROBE = `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head><body style="margin:0">
<iframe id="f" src="read-the-game.html" style="width:${W}px;height:${H}px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
setTimeout(function(){
  var d=document.getElementById('f').contentDocument,s=d.getElementById('scrub'),L=[];
  d.querySelector('#rg .pk[data-l="slot"]').click();
  var tested=0, sum=0, worst=null;
  for(var k=0;k<=+s.max;k++){
    s.value=k;s.dispatchEvent(new Event('input'));
    var m=d.querySelector('#events .clickable'); if(!m)continue;
    var id=m.getAttribute('data-i'), b=m.getBoundingClientRect();
    if(b.width<1||b.height<1)continue;
    var hit=0,n=0;
    for(var gx=0;gx<9;gx++)for(var gy=0;gy<9;gy++){
      var x=b.left+b.width*(gx+0.5)/9, y=b.top+b.height*(gy+0.5)/9; n++;
      var el=d.elementFromPoint(x,y);
      if(el&&el.closest('[data-i]')&&el.closest('[data-i]').getAttribute('data-i')===id)hit++;
    }
    var pct=Math.round(hit/n*100); tested++; sum+=pct;
    if(worst===null||pct<worst.pct)worst={k:k,pct:pct,cls:m.getAttribute('class'),w:Math.round(b.width),h:Math.round(b.height),tag:m.tagName};
    L.push(k+' '+m.tagName+' '+Math.round(b.width)+'x'+Math.round(b.height)+' '+pct+'%');
  }
  document.getElementById('out').textContent='VIEWPORT ${W}x${H}\\nMARKS '+tested+' MEAN '+Math.round(sum/tested)+'% WORST '+JSON.stringify(worst)+'\\n'+L.join('\\n');
  document.title='ok';
},3000);
</script></body></html>`;
const dir=mkdtempSync('/tmp/rtg-hit-');
cpSync('/home/twojandk/projects/read-the-game/src/read-the-game.html',join(dir,'read-the-game.html'));
writeFileSync(join(dir,'p.html'),PROBE);
const server=await serve(dir);
const dom=await dumpDom(`${server.url}/p.html`,{chrome:findChrome(),budget:60000});
server.stop();
const m=/<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(dom);
const t=m?m[1].trim().split('\n'):['FAILED'];
console.log(t.slice(0,2).join('\n'));
const pcts=t.slice(2).map(r=>+r.split(' ').pop().replace('%','')).filter(Number.isFinite);
pcts.sort((a,b)=>a-b);
if(pcts.length) console.log(`n=${pcts.length}  min ${pcts[0]}%  p25 ${pcts[Math.floor(pcts.length*0.25)]}%  median ${pcts[Math.floor(pcts.length/2)]}%  p75 ${pcts[Math.floor(pcts.length*0.75)]}%  max ${pcts[pcts.length-1]}%`);
console.log('under 50%:', pcts.filter(p=>p<50).length, ' under 25%:', pcts.filter(p=>p<25).length);
