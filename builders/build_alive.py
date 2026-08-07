import json
G=json.load(open('game_embed.json'))
T=r'''<style>
#rg{--ice:#eef4f8;--bg:#f4f7fa;--ink:#0f1a23;--muted:#5b6d7a;--edge:#ccd8e0;--min:#12885a;--buf:#bd8c12;--red:#c8102e;--blue:#3a5a9c;--flag:#d9662b;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3.5vw,36px) clamp(12px,4vw,22px);line-height:1.5}
#rg .wrap{max-width:900px;margin:0 auto}
#rg .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#rg h1{font-size:clamp(1.7rem,3.8vw,2.4rem);letter-spacing:-.025em;font-weight:800;margin:0 0 10px;text-wrap:balance}
#rg .lede{font-size:1.02rem;color:var(--muted);margin:0 0 18px;max-width:62ch}#rg .lede b{color:var(--ink);font-weight:600}
#rg .board{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;background:#fff;border:1px solid var(--edge);border-radius:13px;padding:12px 18px;box-shadow:0 5px 18px rgba(16,32,45,.07);margin-bottom:12px}
#rg .tm{display:flex;flex-direction:column;align-items:center}#rg .tm .ab{font-weight:800;letter-spacing:.05em;font-size:.9rem}
#rg .tm.a .ab{color:var(--min)}#rg .tm.h .ab{color:var(--buf)}
#rg .sc{font-family:ui-monospace,Menlo,monospace;font-size:2.2rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1}
#rg .mid{min-width:150px}#rg .gs{text-align:center;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px}#rg .gs .cl{color:var(--ink);font-family:ui-monospace,Menlo,monospace}
#rg .bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:var(--edge)}#rg .bar span{transition:width .35s ease}#rg .ba{background:var(--min)}#rg .bh{background:var(--buf)}
#rg .pct{display:flex;justify-content:space-between;font-size:.78rem;margin-top:5px;font-family:ui-monospace,Menlo,monospace;font-weight:600}
#rg .rinkbox{position:relative;background:var(--ice);border:1px solid var(--edge);border-radius:15px;padding:10px;box-shadow:0 6px 22px rgba(16,32,45,.08)}
#rg svg{display:block;width:100%;height:auto}
#rg .boards{fill:var(--ice);stroke:var(--edge);stroke-width:1.1}
#rg .ln{fill:none;stroke-linecap:round}#rg .ln.red{stroke:var(--red);stroke-width:.7;opacity:.42}#rg .ln.blue{stroke:var(--blue);stroke-width:.9;opacity:.42}#rg .ln.thick{stroke-width:1.1;opacity:.52}
#rg .rdot{fill:var(--red);opacity:.5}
#rg .ev{transform-box:fill-box;transform-origin:center}
#rg .att.a{fill:var(--min)}#rg .att.h{fill:var(--buf)}#rg .att{opacity:.82}
#rg .blk.a{fill:var(--min)}#rg .blk.h{fill:var(--buf)}#rg .blk{stroke:var(--flag);stroke-width:.8}
#rg .goal.a{fill:var(--min)}#rg .goal.h{fill:var(--buf)}#rg .goal{stroke:#fff;stroke-width:.7}
#rg .excl{fill:var(--muted);opacity:.22}
#rg .pop{animation:pop .34s cubic-bezier(.2,1.3,.4,1)}
@keyframes pop{0%{transform:scale(2.6);opacity:.3}100%{transform:scale(1);opacity:1}}
#rg .flare{animation:flare .6s ease-out}
@keyframes flare{0%{transform:scale(3.4);opacity:.2}60%{opacity:1}100%{transform:scale(1)}}
#rg .puck{fill:#0e1216;stroke:#fff;stroke-width:.55}#rg .puck.jump{animation:pj .3s ease}
@keyframes pj{0%{transform:scale(2)}100%{transform:scale(1)}}
#rg .shotline{stroke:var(--ink);stroke-width:.7;stroke-dasharray:2.2 2;opacity:.75;animation:sl .75s ease forwards}
@keyframes sl{to{opacity:0}}
#rg .goalbanner{position:absolute;top:12px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;font-weight:800;letter-spacing:.1em;padding:5px 16px;border-radius:99px;font-size:.85rem;opacity:0}
#rg .goalbanner.on{animation:gb 1.4s ease}
@keyframes gb{0%{opacity:0;transform:translateX(-50%) scale(.7)}15%{opacity:1;transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0}}
#rg .counters{display:flex;justify-content:space-between;padding:2px 6px;margin-top:8px}
#rg .cc{display:flex;align-items:baseline;gap:7px}#rg .cc .n{font-family:ui-monospace,Menlo,monospace;font-size:1.5rem;font-weight:700}#rg .cc.a .n{color:var(--min)}#rg .cc.h .n{color:var(--buf)}
#rg .cc .lb{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
#rg .bump{animation:bump .32s ease}@keyframes bump{40%{transform:scale(1.35);color:var(--flag)}}
#rg .transport{display:flex;align-items:center;gap:12px;margin:14px 0 4px}
#rg button{font:inherit;font-size:.85rem;font-weight:600;border-radius:8px;border:1px solid var(--edge);background:#fff;color:var(--ink);padding:9px 14px;cursor:pointer}
#rg .play{background:var(--ink);color:#fff;border-color:var(--ink)}
#rg .scrub{flex:1;accent-color:var(--ink);cursor:pointer}
#rg .legend{display:flex;flex-wrap:wrap;gap:7px 18px;font-size:.78rem;color:var(--muted);margin:6px 2px}
#rg .legend i{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:-1px}
#rg .k-a{background:var(--min)}#rg .k-blk{background:var(--buf);box-shadow:0 0 0 1.5px var(--flag)}#rg .k-p{background:#0e1216}
#rg .work{background:#fff;border:1px solid var(--edge);border-radius:13px;padding:18px;margin-top:14px;box-shadow:0 5px 18px rgba(16,32,45,.06)}
#rg .work h2{margin:0 0 10px;font-size:1.1rem}#rg .wg{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
#rg .wc{background:#f2f7fa;border:1px solid var(--edge);border-radius:10px;padding:13px}#rg .wc h3{margin:0 0 6px;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);display:flex;justify-content:space-between}#rg .wc h3 .n{font-family:ui-monospace,Menlo,monospace;font-size:1.2rem;color:var(--ink);font-weight:700}#rg .wc.flag{border-color:#e6b98f}#rg .wc.flag h3 .n{color:var(--flag)}#rg .wc p{margin:0;font-size:.87rem}
#rg .wfoot{margin-top:13px;font-size:.8rem;color:var(--muted);border-top:1px solid var(--edge);padding-top:11px}#rg .wfoot em{font-style:normal;color:var(--ink)}
#rg .foot{font-size:.78rem;color:var(--muted);margin-top:16px;text-align:center}
#rg text{font-family:ui-monospace,Menlo,monospace}
@media(prefers-reduced-motion:reduce){#rg *{animation:none!important;transition:none!important}}
</style>
<div id="rg"><div class="wrap">
<p class="eyebrow">Learn to read hockey · watch the number get made</p>
<h1>Corsi, coming to life</h1>
<p class="lede">“Corsi” is just <b>shot attempts</b> — who’s shooting more. Press play and watch the game happen: every attempt <b>ignites where it really occurred</b>, the puck hops from event to event, and the count climbs in front of you. Nothing here is smoothed or invented — the motion <b>is</b> the real events arriving in time. Open <em>Show me the work</em> to audit every one.</p>
<div class="board">
  <div class="tm a"><span class="ab" id="aAb">MIN</span><span class="sc" id="aSc">0</span></div>
  <div class="mid"><div class="gs"><span id="per">Pre-game</span> · <span class="cl" id="clk">00:00</span></div>
    <div class="bar"><span class="ba" id="ba" style="width:50%"></span><span class="bh" id="bh" style="width:50%"></span></div>
    <div class="pct"><span id="pa" style="color:var(--min)">50%</span><span style="color:var(--muted);font-size:.66rem;letter-spacing:.1em">CONTROL</span><span id="ph" style="color:var(--buf)">50%</span></div>
  </div>
  <div class="tm h"><span class="ab" id="hAb">BUF</span><span class="sc" id="hSc">0</span></div>
</div>
<div class="rinkbox"><svg viewBox="0 0 200 85"><g id="rink"></g><g id="lines"></g><g id="events"></g><g id="puck"></g></svg>
  <div class="goalbanner" id="banner">GOAL</div>
  <div class="counters"><div class="cc a"><span class="n" id="cA">0</span><span class="lb">MIN attempts</span></div><div class="cc h"><span class="lb">BUF attempts</span><span class="n" id="cH">0</span></div></div>
</div>
<div class="transport"><button class="play" id="play">▶ Play from start</button><input class="scrub" id="scrub" type="range" min="0" max="1" value="0"><button id="work" aria-expanded="false">Show me the work</button></div>
<div class="legend"><span><i class="k-a"></i>shot attempt (ignites where it happened)</span><span><i class="k-blk"></i>blocked — counts for the shooter</span><span><i class="k-p"></i>puck (jumps between real events)</span><span>dashed line = shot→net (straight; real path isn’t tracked)</span></div>
<div class="work" id="workPanel" hidden></div>
<div class="foot" id="gl">—</div>
</div></div>
<script>
const G=__DATA__, H=G.meta.home, A=G.meta.away;
const ATT=new Set(['goal','shot-on-goal','missed-shot','blocked-shot']);
const EV=G.events, SX=x=>x+100, SY=y=>42.5-y;
function corsi(e){if(!ATT.has(e.type))return null;return e.type==='blocked-shot'?(H.id+A.id-e.owner):e.owner;}
function tk(e){const c=corsi(e);return c===A.id?'a':c===H.id?'h':'x';}
function lens(evs){const t={[H.id]:0,[A.id]:0},counted=[],surprising=[],excluded={};let hs=0,as=0;
 for(const e of evs){if(e.type==='goal')(e.owner===H.id?hs++:as++);const c=corsi(e);if(c==null){excluded[e.type]=(excluded[e.type]||0)+1;continue;}t[c]++;(e.type==='blocked-shot'?surprising:counted).push(e);}
 return{t,counted,surprising,excluded,hs,as};}
const $=id=>document.getElementById(id);
function drawRink(){const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
 for(const g of[-89,89])P.push(`<line class="ln red" x1="${SX(g)}" y1="3" x2="${SX(g)}" y2="82"/>`);
 for(const b of[-25,25])P.push(`<line class="ln blue" x1="${SX(b)}" y1="1" x2="${SX(b)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/><circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 for(const zx of[-69,69])for(const zy of[-22,22])P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15"/>`);
 P.push('<circle class="rdot" cx="100" cy="42.5" r="1.1"/>');$('rink').innerHTML=P.join('');}
let prevA=0,prevH=0;
function render(i,newest){
 const evs=EV.slice(0,i+1),L=lens(evs),cur=EV[i];
 // events
 const parts=[];
 for(let k=0;k<evs.length;k++){const e=evs[k];if(e.x==null)continue;
   const cls=e.type==='goal'?'goal':e.type==='blocked-shot'?'blk':ATT.has(e.type)?'att':'excl';
   const r=e.type==='goal'?2.7:ATT.has(e.type)?1.8:1;
   const anim=(k===i&&newest)?(e.type==='goal'?' flare':' pop'):'';
   parts.push(`<circle class="ev ${cls} ${tk(e)}${anim}" cx="${SX(e.x).toFixed(1)}" cy="${SY(e.y).toFixed(1)}" r="${r}"><title>${e.clock} ${e.type}</title></circle>`);}
 $('events').innerHTML=parts.join('');
 // shot->net line for current shot/goal (honest: real origin -> known net)
 let lh='';
 if(cur&&(cur.type==='shot-on-goal'||cur.type==='goal')&&cur.x!=null){const netx=(cur.owner===H.id)?89:-89;
   lh=`<line class="shotline" x1="${SX(cur.x).toFixed(1)}" y1="${SY(cur.y).toFixed(1)}" x2="${SX(netx)}" y2="42.5"/>`;}
 $('lines').innerHTML=lh;
 // puck at current event
 if(cur&&cur.x!=null)$('puck').innerHTML=`<circle class="puck${newest?' jump':''}" cx="${SX(cur.x).toFixed(1)}" cy="${SY(cur.y).toFixed(1)}" r="1.5"/>`;
 // scoreboard
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
 const a=L.t[A.id],h=L.t[H.id],tot=a+h||1,pa=Math.round(100*a/tot);
 $('ba').style.width=pa+'%';$('bh').style.width=(100-pa)+'%';$('pa').textContent=pa+'%';$('ph').textContent=(100-pa)+'%';
 $('cA').textContent=a;$('cH').textContent=h;
 if(newest){if(a>prevA)flash('cA');if(h>prevH)flash('cH');if(cur&&cur.type==='goal')goalBanner();}
 prevA=a;prevH=h;
 $('per').textContent=cur?'Period '+cur.per:'Pre-game';$('clk').textContent=cur?cur.clock:'00:00';
 if(workOpen)renderWork(L,cur);
}
function flash(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function goalBanner(){const b=$('banner');b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}
let workOpen=false;
function renderWork(L,cur){const a=L.t[A.id],h=L.t[H.id],tot=a+h||1,pa=Math.round(100*a/tot);
 const ex=['hit','faceoff','giveaway','takeaway','penalty'],exL={hit:'hits',faceoff:'faceoffs',giveaway:'giveaways',takeaway:'takeaways',penalty:'penalties'};
 const rows=ex.filter(t=>L.excluded[t]).map(t=>`<div>${L.excluded[t]}× ${exL[t]}</div>`).join('');
 $('workPanel').innerHTML=`<h2>How “control” is computed <span style="color:var(--muted);font-weight:400">(${cur?'through P'+cur.per+' '+cur.clock:'pre-game'})</span></h2>
 <div class="wg"><div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3><p>Shots on goal, missed shots, and goals — every attempt, credited to the shooter.</p></div>
 <div class="wc flag"><h3>Counted, surprisingly <span class="n">${L.surprising.length}</span></h3><p>Blocked shots count as attempts — for the <b>shooter</b>, not the blocker. The feed credits the blocker; we flip it.</p></div>
 <div class="wc"><h3>Not counted</h3><p style="font-family:ui-monospace,Menlo,monospace;font-size:.82rem">${rows||'—'}</p><p style="margin-top:6px;color:var(--muted);font-size:.8rem">A hit feels like control, but it isn’t a shot attempt.</p></div></div>
 <p class="wfoot"><em>${a} MIN / ${h} BUF → ${pa}% / ${100-pa}%.</em> Every mark that pulsed on the ice is one of these counted events — the animation and this list are the same data. Computed live in your browser from the raw play-by-play.</p>`;}
let i=EV.length-1,playing=false,timer=null;
$('scrub').max=EV.length-1;
function set(v,newest){i=Math.max(0,Math.min(EV.length-1,v));$('scrub').value=i;render(i,newest);}
function play(){if(i>=EV.length-1){prevA=0;prevH=0;set(0,true);}playing=true;$('play').textContent='⏸ Pause';clearInterval(timer);
 timer=setInterval(()=>{if(i>=EV.length-1){stop();return;}set(i+1,true);},360);}
function stop(){playing=false;$('play').textContent=i>=EV.length-1?'▶ Replay from start':'▶ Play';clearInterval(timer);}
$('play').onclick=()=>playing?stop():play();
$('scrub').oninput=e=>{stop();set(+e.target.value,false);};
$('work').onclick=()=>{workOpen=!workOpen;$('workPanel').hidden=!workOpen;$('work').setAttribute('aria-expanded',workOpen);$('work').textContent=workOpen?'Hide the work':'Show me the work';if(workOpen)render(i,false);};
$('aAb').textContent=A.abbrev;$('hAb').textContent=H.abbrev;$('gl').textContent=`${A.abbrev} at ${H.abbrev} · ${G.meta.date} · final ${A.abbrev} ${A.score}–${H.score} ${H.abbrev}`;
drawRink();set(EV.length-1,false);
</script>'''
open('read-the-game.html','w').write(T.replace('__DATA__',json.dumps(G,separators=(',',':'))))
print("wrote read-the-game.html",len(open('read-the-game.html').read()),"bytes")
