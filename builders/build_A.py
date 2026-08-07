import json
G=json.load(open('rich.json'))
T=r'''<style>
#pa{--ice:#eef4f8;--ink:#0f1a23;--muted:#5d6f7c;--edge:#cdd9e1;--min:#12885a;--buf:#c79212;--red:#c8102e;--blue:#3a5a9c;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#f4f7fa;min-height:100vh;padding:clamp(16px,3.5vw,34px) clamp(12px,4vw,22px);line-height:1.5}
#pa .wrap{max-width:920px;margin:0 auto}
#pa .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#pa h1{font-size:clamp(1.5rem,3.4vw,2rem);letter-spacing:-.02em;font-weight:800;margin:0 0 8px}
#pa .cap{font-size:.92rem;color:var(--muted);margin:0 0 16px;max-width:64ch}
#pa .cap b{color:var(--ink);font-weight:600}
#pa .rinkbox{background:var(--ice);border:1px solid var(--edge);border-radius:14px;padding:10px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
#pa svg{display:block;width:100%;height:auto}
#pa .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#pa .ln{fill:none;stroke-linecap:round}#pa .ln.red{stroke:var(--red);stroke-width:.7;opacity:.45}#pa .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.45}#pa .ln.thick{stroke-width:1.1;opacity:.55}
#pa .dot{fill:var(--red);opacity:.5}
#pa .readout{display:flex;align-items:center;gap:12px;margin:14px 0 4px;min-height:34px;font-size:1.02rem}
#pa .pill{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:.9rem;padding:3px 9px;border-radius:7px;color:#fff}
#pa .who{font-weight:600}#pa .who .num{font-family:ui-monospace,Menlo,monospace;opacity:.6;margin-right:4px}
#pa .ev{color:var(--muted)}
#pa .transport{display:flex;align-items:center;gap:12px;margin-top:8px}
#pa button{font:inherit;font-size:.85rem;font-weight:600;color:#fff;background:var(--ink);border:0;border-radius:8px;padding:9px 15px;cursor:pointer}
#pa input[type=range]{flex:1;accent-color:var(--ink);cursor:pointer}
#pa .foot{font-size:.78rem;color:var(--muted);margin-top:14px;max-width:64ch}#pa .foot em{font-style:normal;color:var(--ink)}
#pa text{font-family:ui-monospace,Menlo,monospace}
</style>
<div id="pa"><div class="wrap">
<p class="eyebrow">Prototype A · event-anchored — real positions only</p>
<h1>Active play: follow the puck and who touched it</h1>
<p class="cap">Every marker is a <b>real event at its real coordinate</b> — a shot, hit, faceoff, or goal — with the <b>actual player</b> who made it. Goalies sit at their creases (we know where the nets are). The puck jumps between real events; we <b>don't draw a path between them</b>, because that path isn't tracked and we won't invent it. Scrub to watch play develop.</p>
<div class="rinkbox"><svg id="svg" viewBox="0 0 200 92" preserveAspectRatio="xMidYMid meet"><g id="rink"></g><g id="trail"></g><g id="live"></g></svg></div>
<div class="readout" id="readout"><span class="ev">Press play</span></div>
<div class="transport"><button id="play">▶ Play</button><input id="scrub" type="range" min="0" max="1" value="0"></div>
<p class="foot"><em>What it teaches:</em> where play develops and who's involved — the flow of a game as real touches. <em>The honest line:</em> only the puck-carrier and goalies are placed; the other skaters aren't, because their positions aren't in public data.</p>
</div></div>
<script>
const G=__DATA__, R=G.roster, MIN=G.teams.away.id, BUF=G.teams.home.id;
const EV=G.events.filter(e=>e.type!=='stoppage'&&e.type!=='period-start'&&e.type!=='period-end'&&e.type!=='game-end'&&e.type!=='delayed-penalty');
const SX=x=>x+100, SY=y=>42.5-y;
const COL={[MIN]:'#12885a',[BUF]:'#c79212'};
const NAMES={'shot-on-goal':'shot on goal','missed-shot':'missed shot','blocked-shot':'blocked shot','goal':'GOAL','hit':'hit','faceoff':'faceoff win','giveaway':'giveaway','takeaway':'takeaway','penalty':'penalty'};
function rink(){const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
 for(const gx of[-89,89])P.push(`<line class="ln red" x1="${SX(gx)}" y1="3" x2="${SX(gx)}" y2="82"/>`);
 for(const bx of[-25,25])P.push(`<line class="ln blue" x1="${SX(bx)}" y1="1" x2="${SX(bx)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/>');
 P.push('<circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 for(const zx of[-69,69])for(const zy of[-22,22])P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15"/>`);
 P.push('<circle class="dot" cx="100" cy="42.5" r="1.2"/>');
 document.getElementById('rink').innerHTML=P.join('');}
function goalies(){ // MIN defends +x (right), BUF defends -x (left)
 return [[85,MIN],[-85,BUF]].map(([gx,tid])=>`<g><rect x="${SX(gx)-2.4}" y="${SY(0)-4}" width="4.8" height="8" rx="1.5" fill="${COL[tid]}" stroke="#fff" stroke-width=".5"/><text x="${SX(gx)}" y="${SY(0)+1.4}" font-size="3.4" fill="#fff" text-anchor="middle" font-weight="700">G</text></g>`).join('');}
function render(i){
 const cur=EV[i];
 // trail: last 5 events with coords
 let tp=[];
 for(let k=Math.max(0,i-5);k<i;k++){const e=EV[k];if(e.x==null)continue;const age=(i-k)/6;tp.push(`<circle cx="${SX(e.x)}" cy="${SY(e.y)}" r="1.4" fill="${COL[e.own]||'#999'}" opacity="${0.5*(1-age)}"/>`);} 
 document.getElementById('trail').innerHTML=tp.join('');
 // live: goalies + current event actor + puck
 let L=goalies();
 if(cur&&cur.x!=null){
   const p=R[cur.actor]; const tid=p?p.tid:cur.own; const c=COL[tid]||'#666';
   const isGoal=cur.type==='goal';
   L+=`<circle cx="${SX(cur.x)}" cy="${SY(cur.y)}" r="${isGoal?5:3.4}" fill="${c}" stroke="#fff" stroke-width=".8"/>`;
   if(p)L+=`<text x="${SX(cur.x)}" y="${SY(cur.y)+1.3}" font-size="3.4" fill="#fff" text-anchor="middle" font-weight="700">${p.n}</text>`;
   L+=`<circle cx="${SX(cur.x)}" cy="${SY(cur.y)}" r="${isGoal?7.5:5.5}" fill="none" stroke="${c}" stroke-width=".7" opacity=".55"/>`;
 }
 document.getElementById('live').innerHTML=L;
 // readout
 const ro=document.getElementById('readout');
 if(cur){const p=R[cur.actor];const tid=p?p.tid:cur.own;const ab=tid===MIN?'MIN':'BUF';
   ro.innerHTML=`<span class="pill" style="background:${COL[tid]}">P${cur.per} ${cur.clock}</span>`+
     (p?`<span class="who"><span class="num">#${p.n}</span>${p.nm}</span>`:`<span class="who">${ab}</span>`)+
     `<span class="ev">— ${NAMES[cur.type]||cur.type}</span>`;}
}
let i=0,playing=false,timer=null;
const sc=document.getElementById('scrub');sc.max=EV.length-1;
function set(v){i=Math.max(0,Math.min(EV.length-1,v));sc.value=i;render(i);}
function play(){if(i>=EV.length-1)set(0);playing=true;document.getElementById('play').textContent='⏸ Pause';clearInterval(timer);timer=setInterval(()=>{if(i>=EV.length-1){stop();return;}set(i+1);},420);}
function stop(){playing=false;document.getElementById('play').textContent='▶ Play';clearInterval(timer);}
document.getElementById('play').onclick=()=>playing?stop():play();
sc.oninput=e=>{stop();set(+e.target.value);};
rink();set(0);
</script>'''
open('active-play.html','w').write(T.replace('__DATA__',json.dumps(G,separators=(',',':'))))
print("wrote active-play.html",len(open('active-play.html').read()),"bytes")
