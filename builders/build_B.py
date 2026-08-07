import json
import pathlib as _pl
_ROOT = _pl.Path(__file__).resolve().parent.parent
_D = lambda n: str(_ROOT / 'data' / n)
_S = lambda n: str(_ROOT / 'src' / n)

G=json.load(open(_D('rich.json')))
T=r'''<style>
#pb{--ice:#eef4f8;--ink:#0f1a23;--muted:#5d6f7c;--edge:#cdd9e1;--min:#12885a;--buf:#c79212;--red:#c8102e;--blue:#3a5a9c;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#f4f7fa;min-height:100vh;padding:clamp(16px,3.5vw,34px) clamp(12px,4vw,22px);line-height:1.5}
#pb .wrap{max-width:920px;margin:0 auto}
#pb .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#pb h1{font-size:clamp(1.5rem,3.4vw,2rem);letter-spacing:-.02em;font-weight:800;margin:0 0 8px}
#pb .cap{font-size:.92rem;color:var(--muted);margin:0 0 12px;max-width:66ch}#pb .cap b{color:var(--ink);font-weight:600}
#pb .banner{font-size:.78rem;background:#fff4d6;border:1px solid #e6c766;color:#6b5310;border-radius:8px;padding:8px 12px;margin:0 0 14px;max-width:66ch}
#pb .rinkbox{background:var(--ice);border:1px solid var(--edge);border-radius:14px;padding:10px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
#pb svg{display:block;width:100%;height:auto}
#pb .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#pb .ln{fill:none;stroke-linecap:round}#pb .ln.red{stroke:var(--red);stroke-width:.7;opacity:.4}#pb .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.4}#pb .ln.thick{stroke-width:1.1;opacity:.5}
#pb .strength{display:flex;justify-content:center;gap:16px;align-items:center;margin:12px 0 2px;font-size:1.05rem;font-weight:700}
#pb .strength .s{font-family:ui-monospace,Menlo,monospace;background:var(--ink);color:#fff;padding:3px 12px;border-radius:8px;letter-spacing:.05em}
#pb .strength .tm{font-weight:800}#pb .tm.min{color:var(--min)}#pb .tm.buf{color:var(--buf)}
#pb .ev{text-align:center;color:var(--muted);font-size:.9rem;min-height:20px;margin-top:4px}
#pb .transport{display:flex;align-items:center;gap:12px;margin-top:8px}
#pb button{font:inherit;font-size:.85rem;font-weight:600;color:#fff;background:var(--ink);border:0;border-radius:8px;padding:9px 15px;cursor:pointer}
#pb input[type=range]{flex:1;accent-color:var(--ink);cursor:pointer}
#pb .foot{font-size:.78rem;color:var(--muted);margin-top:14px;max-width:66ch}#pb .foot em{font-style:normal;color:var(--ink)}
#pb text{font-family:ui-monospace,Menlo,monospace}
</style>
<div id="pb"><div class="wrap">
<p class="eyebrow">Prototype B · real personnel — the line game</p>
<h1>On the ice: who's actually out there</h1>
<p class="cap">These are the <b>real players on the ice</b> at each moment, pulled from <b>actual shift data</b>. Scrub and watch the <b>lines change</b> — and the strength flip to a power play when someone's in the box. The player who makes the next event lights up.</p>
<p class="banner">⚠︎ Honest note: players are arranged <b>by role</b> (goalie · defense · forwards), <b>not by tracked position</b> — real skater coordinates aren't public, so we don't fake them. What's real here is <b>who is on the ice, and when</b>.</p>
<div class="strength" id="strength"></div>
<div class="rinkbox"><svg id="svg" viewBox="0 0 200 92" preserveAspectRatio="xMidYMid meet"><g id="rink"></g><g id="tokens"></g></svg></div>
<div class="ev" id="ev"></div>
<div class="transport"><button id="play">▶ Play</button><input id="scrub" type="range" min="0" max="1" value="0"></div>
<p class="foot"><em>What it teaches:</em> hockey is a <b>shift game</b> — five skaters and a goalie, rotating every 40-ish seconds, matchups and special teams. <em>Real:</em> the personnel and timing. <em>Not shown:</em> where they physically skate.</p>
</div></div>
<script>
const G=__DATA__, R=G.roster, MIN=G.teams.away.id, BUF=G.teams.home.id;
const SH=G.shifts, EV=G.events;
const maxS=Math.max(...EV.map(e=>e.s));
const SX=x=>x+100, SY=y=>42.5-y;
const COL={[MIN]:'#12885a',[BUF]:'#c79212'};
function rink(){const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
 for(const gx of[-89,89])P.push(`<line class="ln red" x1="${SX(gx)}" y1="3" x2="${SX(gx)}" y2="82"/>`);
 for(const bx of[-25,25])P.push(`<line class="ln blue" x1="${SX(bx)}" y1="1" x2="${SX(bx)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/>');
 P.push('<circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 document.getElementById('rink').innerHTML=P.join('');}
function onIce(t){const out={[MIN]:[],[BUF]:[]};for(const s of SH){if(s.s<=t&&t<s.e){const p=R[s.p];if(p&&out[s.t])out[s.t].push({...p,id:s.p});}}return out;}
function place(list,tid){const side=tid===BUF?-1:1;
 const Gl=list.filter(p=>p.pos==='G'),D=list.filter(p=>p.pos==='D'),F=list.filter(p=>p.pos!=='G'&&p.pos!=='D');
 const o=[];
 Gl.forEach(p=>o.push({...p,x:side*86,y:0}));
 D.forEach((p,k)=>o.push({...p,x:side*56,y:(k-(D.length-1)/2)*24}));
 F.forEach((p,k)=>o.push({...p,x:side*24,y:(k-(F.length-1)/2)*19}));
 return o;}
function curEvent(t){let best=null;for(const e of EV){if(e.s<=t&&(e.type!=='stoppage'))best=e;else if(e.s>t)break;}return best;}
function render(t){
 const oi=onIce(t); const cur=curEvent(t); const actor=cur?cur.actor:null;
 let T=[];
 for(const tid of [MIN,BUF]){
   for(const p of place(oi[tid],tid)){
     const hot=(p.id===actor);
     T.push(`<g>${hot?`<circle cx="${SX(p.x)}" cy="${SY(p.y)}" r="6.2" fill="none" stroke="${COL[tid]}" stroke-width="1"/>`:''}
       <circle cx="${SX(p.x)}" cy="${SY(p.y)}" r="4" fill="${COL[tid]}" stroke="#fff" stroke-width=".7"/>
       <text x="${SX(p.x)}" y="${SY(p.y)+1.4}" font-size="3.6" fill="#fff" text-anchor="middle" font-weight="700">${p.n}</text>
       <text x="${SX(p.x)}" y="${SY(p.y)+8}" font-size="3" fill="#33434f" text-anchor="middle">${p.nm}</text></g>`);
   }
 }
 document.getElementById('tokens').innerHTML=T.join('');
 const sM=oi[MIN].filter(p=>p.pos!=='G').length, sB=oi[BUF].filter(p=>p.pos!=='G').length;
 document.getElementById('strength').innerHTML=`<span class="tm min">MIN</span><span class="s">${sM} v ${sB}</span><span class="tm buf">BUF</span>`+
   (sM!==sB?`<span style="font-size:.8rem;color:#c8102e;font-weight:700">${sM>sB?'MIN':'BUF'} power play</span>`:'');
 const mm=String(Math.floor((t%1200)/60)).padStart(2,'0'),ss=String(t%60).padStart(2,'0');
 const per=Math.floor(t/1200)+1;
 document.getElementById('ev').textContent=cur?`P${per} ${mm}:${ss}  ·  last event: ${cur.type.replace(/-/g,' ')}`:`P${per} ${mm}:${ss}`;
}
let t=0,playing=false,timer=null;const sc=document.getElementById('scrub');sc.max=maxS;
function set(v){t=Math.max(0,Math.min(maxS,v));sc.value=t;render(t);}
function play(){if(t>=maxS)set(0);playing=true;document.getElementById('play').textContent='⏸ Pause';clearInterval(timer);timer=setInterval(()=>{if(t>=maxS){stop();return;}set(t+3);},90);}
function stop(){playing=false;document.getElementById('play').textContent='▶ Play';clearInterval(timer);}
document.getElementById('play').onclick=()=>playing?stop():play();
sc.oninput=e=>{stop();set(+e.target.value);};
rink();set(0);
</script>'''
open(_S('on-the-ice.html'),'w').write(T.replace('__DATA__',json.dumps(G,separators=(',',':'))))
print("wrote on-the-ice.html",len(open(_S('on-the-ice.html')).read().encode()),"bytes")
