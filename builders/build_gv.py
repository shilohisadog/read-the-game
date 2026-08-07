import json
D=json.load(open('goalie_sub.json'))
T=r'''<style>
#gv{--bg:#05090e;--ink:#e9f0f6;--muted:#8ba0ae;--save:#4aa3e0;--goal:#ff4d5e;--ice:#16extcc;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:radial-gradient(120% 90% at 50% 0%,#0d1a26,#05090e 65%);color:var(--ink);min-height:100vh;padding:clamp(16px,3.5vw,32px) clamp(12px,4vw,20px)}
#gv .wrap{max-width:920px;margin:0 auto}
#gv .eyebrow{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#gv h1{font-size:clamp(1.5rem,3.4vw,2.1rem);letter-spacing:-.02em;font-weight:800;margin:0 0 8px}
#gv .cap{font-size:.9rem;color:var(--muted);margin:0 0 14px;max-width:66ch}#gv .cap b{color:var(--ink);font-weight:600}
#gv .pick{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
#gv .gb{font:inherit;font-size:.85rem;font-weight:700;border-radius:9px;border:1px solid #24384a;background:#0e1b27;color:var(--muted);padding:9px 15px;cursor:pointer}
#gv .gb[aria-pressed="true"]{color:#fff}
#gv .gb.min[aria-pressed="true"]{border-color:#34d399;color:#34d399}#gv .gb.buf[aria-pressed="true"]{border-color:#f3c249;color:#f3c249}
#gv .stat{margin-left:auto;font-size:.82rem;color:var(--muted)}#gv .stat b{color:var(--ink);font-family:ui-monospace,Menlo,monospace;font-size:1.1rem}
#gv .stage{position:relative;border:1px solid #1c2c3a;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,#0a1520,#060b11);box-shadow:0 20px 60px rgba(0,0,0,.5)}
#gv canvas{display:block;width:100%;height:60vh;min-height:380px;touch-action:none;cursor:grab}
#gv canvas:active{cursor:grabbing}
#gv .mask{position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 100% at 50% 42%,transparent 46%,rgba(3,6,10,.55) 78%,rgba(3,6,10,.92) 100%)}
#gv .cage{position:absolute;inset:0;pointer-events:none;opacity:.14}
#gv .hint{position:absolute;bottom:12px;right:16px;font-size:.72rem;color:var(--muted);pointer-events:none}
#gv .legend{display:flex;gap:18px;flex-wrap:wrap;font-size:.8rem;color:var(--muted);margin:12px 2px 0}
#gv .legend i{width:11px;height:11px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:-1px}
#gv .k-s{background:var(--save)}#gv .k-g{background:var(--goal)}
#gv .foot{font-size:.77rem;color:var(--muted);margin-top:13px;max-width:66ch}#gv .foot em{font-style:normal;color:var(--ink)}
#gv .ctl{display:flex;gap:10px;margin-top:12px;align-items:center;flex-wrap:wrap}
#gv .ctl button{font:inherit;font-size:.8rem;font-weight:600;border-radius:8px;border:1px solid #24384a;background:#0e1b27;color:var(--ink);padding:8px 12px;cursor:pointer}
</style>
<div id="gv"><div class="wrap">
<p class="eyebrow">Prototype · the goalie's-eye view — real shots, honest limits</p>
<h1>Standing in the crease, looking out</h1>
<p class="cap">Every mark is a <b>real shot's origin</b> — where on the ice it was actually taken from — <b style="color:#4aa3e0">saved</b> or <b style="color:#ff4d5e">scored</b>. Close, dangerous shots <b>loom large</b>, the way they do for a goalie. <b>Drag to look around.</b> We do <b>not</b> draw the puck's path, its height, or where in the net it went — none of that is in the data, so we don't invent it. What's real: where they shot from, and what happened.</p>
<div class="pick">
  <button class="gb" id="g0" aria-pressed="true">Goalie A</button>
  <button class="gb" id="g1" aria-pressed="false">Goalie B</button>
  <span class="stat" id="stat"></span>
</div>
<div class="stage">
  <canvas id="cv"></canvas>
  <svg class="cage" viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#cfe3f2" stroke-width=".5" fill="none">
    <path d="M0,30 Q50,22 100,30 M0,50 Q50,44 100,50 M0,70 Q50,64 100,70"/>
    <path d="M30,0 Q22,50 30,100 M50,0 Q44,50 50,100 M70,0 Q64,50 70,100"/></g></svg>
  <div class="mask"></div>
  <div class="hint">drag to look around</div>
</div>
<div class="legend"><span><i class="k-s"></i>save</span><span><i class="k-g"></i>goal</span><span>size = how close / dangerous</span></div>
<div class="ctl"><button id="reset">Reset view</button><button id="hd" aria-pressed="false">Highlight high-danger</button></div>
<p class="foot"><em>Why it's honest:</em> the position of every mark is a real shot coordinate; the color is the real outcome. The mask cage is decorative. We show <em>where</em> and <em>what</em>, never a fabricated <em>how</em>.</p>
</div></div>
<script>
const D=__DATA__, R=D.roster, MINID=D.teams.away.id, BUFID=D.teams.home.id;
const cv=document.getElementById('cv'), ctx=cv.getContext('2d'), DPR=Math.min(devicePixelRatio||1,2);
let W,H,cx,cy,FOCAL,gi=0,hdOn=false;
const cam={d:-8,w:0,h:5.2,yaw:0,pitch:0.02};
function fit(){const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);cx=W/2;cy=H*0.46;FOCAL=H*0.9;}
function proj(d,w,hgt){let vd=d-cam.d,vw=w-cam.w,vh=hgt-cam.h;
 let d1=vd*Math.cos(cam.yaw)+vw*Math.sin(cam.yaw), w1=-vd*Math.sin(cam.yaw)+vw*Math.cos(cam.yaw), h1=vh;
 let d2=d1*Math.cos(cam.pitch)+h1*Math.sin(cam.pitch), h2=-d1*Math.sin(cam.pitch)+h1*Math.cos(cam.pitch), w2=w1;
 if(d2<1.2)return null;return{x:cx+FOCAL*w2/d2,y:cy-FOCAL*h2/d2,s:FOCAL/d2,depth:d2};}
function line(d1,w1,d2,w2,col,wd){const a=proj(d1,w1,0),b=proj(d2,w2,0);if(!a||!b)return;ctx.strokeStyle=col;ctx.lineWidth=wd||1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function dist(x,y){return Math.hypot(89-Math.abs(x),y);}
function shots(){const gid=D.goalies[gi];return D.gshots.filter(s=>s.g===gid).map(s=>({d:89-Math.abs(s.x),w:s.y,out:s.out,hd:dist(s.x,s.y)<=33&&Math.abs(s.y)<=22}));}
function draw(){ctx.clearRect(0,0,W,H);
 // ice fill (trapezoid to horizon)
 const c=[proj(0,-42.5,0),proj(120,-42.5,0),proj(120,42.5,0),proj(0,42.5,0)].filter(Boolean);
 if(c.length===4){ctx.beginPath();ctx.moveTo(c[0].x,c[0].y);for(let i=1;i<4;i++)ctx.lineTo(c[i].x,c[i].y);ctx.closePath();const g=ctx.createLinearGradient(0,cy-40,0,H);g.addColorStop(0,'#0c1f2e');g.addColorStop(1,'#0a161f');ctx.fillStyle=g;ctx.fill();}
 // reference lines
 line(0,-42.5,0,42.5,'#c8102e88',1.2);           // goal line
 line(64,-42.5,64,42.5,'#3f6bd688',1.4);          // near blue line
 line(89,-42.5,89,42.5,'#c8102e66',1.4);          // center
 line(0,-42.5,120,-42.5,'#24455f',1);line(0,42.5,120,42.5,'#24455f',1); // boards
 for(const wy of[-22,22]){const p=proj(20,wy,0);if(p){ctx.strokeStyle='#c8102e77';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,p.s*1.2,p.s*0.5,0,0,7);ctx.stroke();}} // zone dots
 // shots sorted far->near
 const S=shots().sort((a,b)=>b.d-a.d);
 for(const s of S){const p=proj(s.d,s.w,0.4);if(!p)continue;
   const col=s.out==='goal'?'#ff4d5e':'#4aa3e0';const r=Math.max(3,Math.min(p.s*0.85,26))*(s.hd&&hdOn?1.25:1);
   ctx.save();ctx.shadowColor=col;ctx.shadowBlur=s.out==='goal'?16:(s.hd&&hdOn?14:7);ctx.fillStyle=col;
   ctx.globalAlpha=s.out==='goal'?1:.9;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.restore();
   if(s.hd&&hdOn){ctx.strokeStyle='#f0c060';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,r+2.5,0,7);ctx.stroke();}
 }
 // crease hint at feet
 const cr=proj(3,0,0);if(cr){ctx.strokeStyle='#5aa0d055';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cr.x,cr.y,cr.s*3,cr.s*1.1,0,Math.PI,2*Math.PI);ctx.stroke();}
}
function updStat(){const gid=D.goalies[gi],p=R[gid],ab=p.tid===MINID?'MIN':'BUF';const S=D.gshots.filter(s=>s.g===gid);
 const sv=S.filter(s=>s.out==='save').length,gl=S.filter(s=>s.out==='goal').length,f=sv+gl;
 document.getElementById('stat').innerHTML=`${p.nm} (${ab}) faced <b>${f}</b> · saved <b>${sv}</b> · sv% <b>${(sv/f).toFixed(3).replace(/^0/,'')}</b>`;
 document.getElementById('g0').textContent=R[D.goalies[0]].nm; document.getElementById('g1').textContent=R[D.goalies[1]].nm;
 for(const[id,k]of[['g0',0],['g1',1]]){const b=document.getElementById(id);const t=R[D.goalies[k]].tid;b.className='gb '+(t===MINID?'min':'buf');b.setAttribute('aria-pressed',k===gi);}
}
let drag=false,px,py;
cv.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(!drag)return;cam.yaw=Math.max(-0.9,Math.min(0.9,cam.yaw+(e.clientX-px)*0.004));cam.pitch=Math.max(-0.25,Math.min(0.4,cam.pitch-(e.clientY-py)*0.003));px=e.clientX;py=e.clientY;draw();});
cv.addEventListener('pointerup',()=>drag=false);
document.getElementById('g0').onclick=()=>{gi=0;updStat();draw();};
document.getElementById('g1').onclick=()=>{gi=1;updStat();draw();};
document.getElementById('reset').onclick=()=>{cam.yaw=0;cam.pitch=0.02;draw();};
document.getElementById('hd').onclick=()=>{hdOn=!hdOn;document.getElementById('hd').setAttribute('aria-pressed',hdOn);draw();};
addEventListener('resize',()=>{fit();draw();});
fit();updStat();draw();
</script>'''
open('goalie-eye-view.html','w').write(T.replace('__DATA__',json.dumps(D,separators=(',',':'))))
print("wrote goalie-eye-view.html",len(open('goalie-eye-view.html').read()),"bytes")
