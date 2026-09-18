/* Hash every frame of the replay, in a real browser, in the default view and
   with each layer on. Exported so the measurement can call it per mutant. */
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromeRun, findChrome, serve } from '/home/twojandk/projects/read-the-game/tools/browser/lib.mjs';

export const LAYERS = ['none', 'corsi', 'slot', 'blocked', 'goaltending', 'whistle', 'zone'];
const PROBE = `<!doctype html><html><head><meta charset="utf-8"><title>pending</title></head><body style="margin:0">
<iframe id="f" src="read-the-game.html" style="width:1100px;height:900px;border:0"></iframe>
<script type="text/plain" id="out">pending</script>
<script>
setTimeout(function(){
  var d=document.getElementById('f').contentDocument, s=d.getElementById('scrub');
  var L=${JSON.stringify(LAYERS)}, rows=[];
  function snap(tag){
    for(var k=0;k<=+s.max;k++){
      s.value=k; s.dispatchEvent(new Event('input'));
      var rg=d.getElementById('rg');
      rows.push(tag+' '+k+' '+(rg?rg.innerHTML.length:0)+' '+hash(rg?rg.innerHTML:''));
    }
  }
  function hash(x){var h=5381,i=x.length;while(i)h=(h*33^x.charCodeAt(--i))>>>0;return h.toString(16);}
  L.forEach(function(l){
    var p=d.querySelector('#rg .pk[data-l="'+l+'"]');
    if(!p){rows.push('MISSING-LAYER '+l);return;}
    p.click(); snap(l);
  });
  var t=d.querySelector('#rg .tbtn[data-t="all"]'); if(t){t.click(); snap('trails');}
  document.getElementById('out').textContent=rows.join('\\n');
  document.title='ok';
},3000);
</script></body></html>`;

export async function walkPage(pageFile, chrome = findChrome()) {
  const dir = mkdtempSync('/tmp/rtg-walk-');
  cpSync(pageFile, join(dir, 'read-the-game.html'));
  writeFileSync(join(dir, 'p.html'), PROBE);
  const server = await serve(dir);
  try {
    const dom = (await chromeRun(['--headless','--no-sandbox','--disable-gpu','--virtual-time-budget=120000','--dump-dom',`${server.url}/p.html`], { chrome })).out;
    const m = /<script type="text\/plain" id="out">([\s\S]*?)<\/script>/.exec(dom);
    if (!m || m[1].trim() === 'pending') return null;
    return m[1].trim().split('\n');
  } finally { server.stop(); rmSync(dir, { recursive: true, force: true }); }
}
if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const r = await walkPage(process.argv[2]);
  console.log(r ? `${r.length} rows; sha ${createHash('sha1').update(r.join('\n')).digest('hex').slice(0,12)}` : 'FAILED');
  console.log(r.slice(0,3).join('\n'));
}
