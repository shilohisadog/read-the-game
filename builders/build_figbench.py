#!/usr/bin/env python3
"""Figure bench — two candidate player glyphs, side by side, same data.

A design comparison surface, not a data view. Both styles render the two
outcomes we actually have in the feed (save / goal) at the sizes the goalie's
eye view actually uses, and against a real cluster of shot coordinates so the
crowded case is judged honestly rather than in isolation.

  python3 builders/build_figbench.py   ->  src/figure-bench.html
"""
import json, pathlib, re, sys, tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from figures import FIGURES_JS
import sys, pathlib as _pl
sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import page as _page

ROOT = pathlib.Path(__file__).resolve().parent.parent
rich = json.loads((ROOT / "data" / "rich.json").read_text())

LEVI = 8482221  # BUF goalie; shots faced were taken by MIN
crowd = [
    {"d": 89 - abs(s["x"]), "w": s["y"], "out": s["out"]}
    for s in rich["gshots"] if s["g"] == LEVI
]
crowd.sort(key=lambda s: -s["d"])  # far first, near drawn last

TEMPLATE = r"""<title>Read the Game — figure bench</title>
<style>
body{background:#05090e;margin:0}
#fb{--bg:#05090e;--ink:#e9f0f6;--muted:#8ba0ae;--line:#1c2c3a;--save:#4aa3e0;--goal:#ff4d5e;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
 background:radial-gradient(120% 90% at 50% 0%,#0d1a26,#05090e 65%);color:var(--ink);
 min-height:100vh;padding:clamp(16px,3.5vw,32px) clamp(12px,4vw,20px)}
#fb .wrap{max-width:1080px;margin:0 auto}
#fb .eyebrow{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
#fb h1{font-size:clamp(1.5rem,3.4vw,2.1rem);letter-spacing:-.02em;font-weight:800;margin:0 0 8px}
#fb .cap{font-size:.9rem;color:var(--muted);margin:0 0 18px;max-width:70ch;line-height:1.55}
#fb .cap b{color:var(--ink);font-weight:600}
#fb .ctl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 18px;
 border:1px solid var(--line);border-radius:12px;padding:11px 14px;background:rgba(10,21,32,.6)}
#fb .ctl label{font-size:.8rem;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:7px}
#fb .ctl input[type=range]{width:150px;accent-color:#4aa3e0}
#fb .tg{font:inherit;font-size:.8rem;font-weight:600;border-radius:8px;border:1px solid #24384a;
 background:#0e1b27;color:var(--muted);padding:7px 12px;cursor:pointer}
#fb .tg[aria-pressed="true"]{border-color:#4aa3e0;color:#fff;background:#12283a}
#fb .sz{font-family:ui-monospace,Menlo,monospace;color:var(--ink);font-size:.8rem;min-width:3ch}
#fb .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:760px){#fb .grid{grid-template-columns:1fr}}
#fb .panel{border:1px solid var(--line);border-radius:16px;overflow:hidden;
 background:linear-gradient(180deg,#0a1520,#060b11);box-shadow:0 18px 50px rgba(0,0,0,.45)}
#fb .phead{display:flex;align-items:baseline;gap:9px;padding:13px 16px 11px;border-bottom:1px solid var(--line)}
#fb .tag{font-family:ui-monospace,Menlo,monospace;font-size:.72rem;font-weight:700;
 border-radius:5px;padding:3px 7px;background:#12283a;color:#7fc4f5}
#fb .pname{font-weight:800;font-size:1.02rem;letter-spacing:-.01em}
#fb .pnote{font-size:.78rem;color:var(--muted);padding:0 16px 11px;line-height:1.5}
#fb canvas{display:block;width:100%}
#fb .sect{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);
 margin:26px 0 10px;padding-top:18px;border-top:1px solid var(--line)}
#fb .foot{font-size:.78rem;color:var(--muted);margin-top:22px;max-width:72ch;line-height:1.6}
#fb .foot em{font-style:normal;color:var(--ink)}
#fb .verdict{margin-top:20px;border:1px solid var(--line);border-radius:12px;padding:14px 16px;
 background:rgba(10,21,32,.6);font-size:.83rem;color:var(--muted);line-height:1.6;max-width:72ch}
#fb .verdict b{color:var(--ink)}
</style>
<div id="fb"><div class="wrap">
<p class="eyebrow">Design bench &middot; pick the base figure</p>
<h1>Two candidate players, same ice</h1>
<p class="cap">The figure is a <b>marker</b> &mdash; it says &ldquo;a real shot came from here, and this is what happened.&rdquo;
It is never a claim about how anyone actually stood or moved. So the only thing to judge is
whether it <b>reads</b>: at a glance, at small sizes, and in a crowd. Both candidates render the
same two real outcomes &mdash; <b style="color:#4aa3e0">saved</b> (shooting) and <b style="color:#ff4d5e">scored</b> (arms up).</p>

<div class="ctl">
  <label>Size <input type="range" id="sz" min="30" max="140" value="92"><span class="sz" id="szv">92</span></label>
  <button class="tg" id="mo" aria-pressed="true">Idle motion</button>
  <button class="tg" id="gl" aria-pressed="true">Outcome glow</button>
  <button class="tg" id="bg" aria-pressed="false">Light ice</button>
</div>

<div class="grid">
  <div class="panel">
    <div class="phead"><span class="tag">A</span><span class="pname">Mascot</span></div>
    <p class="pnote">Big head, soft shapes, a face. Built to be legible small &mdash; the silhouette
      is a head on a bean, which survives shrinking. Warm, obviously a character, obviously not a claim.</p>
    <canvas id="cA"></canvas>
  </div>
  <div class="panel">
    <div class="phead"><span class="tag">B</span><span class="pname">Retro tabletop</span></div>
    <p class="pnote">The rod-hockey tin man: flat colour, heavy outline, stiff fused pose, standing on
      its peg. Reads as a <em>game piece</em> &mdash; a built-in admission that it&rsquo;s a token, not a person.</p>
    <canvas id="cB"></canvas>
  </div>
</div>

<p class="sect">The crowd test &mdash; __N__ real shots Devon Levi faced</p>
<div class="grid">
  <div class="panel"><div class="phead"><span class="tag">A</span><span class="pname">Mascot</span></div><canvas id="dA"></canvas></div>
  <div class="panel"><div class="phead"><span class="tag">B</span><span class="pname">Retro tabletop</span></div><canvas id="dB"></canvas></div>
</div>

<div class="verdict"><b>What to look for.</b> Can you tell a save from a goal without reading the legend?
Does the figure still say &ldquo;hockey player&rdquo; at the smallest size in the ramp? In the crowd, do
overlapping figures turn into mush, or do they stack into something you can still count?
That last one is where the shot map lives or dies &mdash; most of the shots in a real game are
far out and small.</div>

<p class="foot"><em>Honest about this page:</em> the crowd test uses <b>real shot coordinates</b> from
MIN&nbsp;@&nbsp;BUF, 2023-11-10 &mdash; distance from the net and lateral position are the actual
recorded values, and near shots are drawn larger because they were closer. The hero row and the
size ramp are <b>arranged for comparison</b>, not positioned by data. Nothing here estimates,
interpolates, or invents a player&rsquo;s posture: the two poses encode the two real outcomes and
nothing more.</p>
</div></div>
<script>
const CROWD=__CROWD__;
const MIN='#34d399', BUF='#f3c249';
const DPR=Math.min(devicePixelRatio||1,2);
const REDUCED=matchMedia('(prefers-reduced-motion:reduce)').matches;
let heroSize=92, motion=!REDUCED, glow=true, light=false, T=0;

__FIGURES__

/* ---------- canvas plumbing ------------------------------------------- */
const STYLE={A:FIG.mascot,B:FIG.tabletop};
function OPT(){return{t:T,motion:motion,glow:glow,light:light};}
const RAMP=[13,19,27,38,54];
const cvs={};
function grab(id,h){const cv=document.getElementById(id);cvs[id]={cv,g:cv.getContext('2d'),h};}
['cA','cB'].forEach(id=>grab(id,404)); ['dA','dB'].forEach(id=>grab(id,352));

function fitAll(){for(const k in cvs){const o=cvs[k];const w=o.cv.getBoundingClientRect().width;
 o.w=w;o.cv.style.height=o.h+'px';o.cv.width=Math.round(w*DPR);o.cv.height=Math.round(o.h*DPR);
 o.g.setTransform(DPR,0,0,DPR,0,0);}}

function field(g,w,h){
 if(light){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#e8f2fa');gr.addColorStop(1,'#c9dded');
  g.fillStyle=gr;}else{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0b1725');gr.addColorStop(1,'#060b11');
  g.fillStyle=gr;}
 g.fillRect(0,0,w,h);}

function label(g,x,y,txt,col){g.fillStyle=col||(light?'#5a7186':'#8ba0ae');
 g.font='600 11px system-ui,-apple-system,sans-serif';g.textAlign='center';g.fillText(txt,x,y);}

function renderBench(id,fn){
 const o=cvs[id],g=o.g,w=o.w,h=o.h; field(g,w,h);
 const base=258, slots=[[MIN,'save','MIN · saved'],[MIN,'goal','MIN · GOAL'],
                        [BUF,'save','BUF · saved'],[BUF,'goal','BUF · GOAL']];
 const step=w/4;
 slots.forEach((s,i)=>{const x=step*(i+0.5);
  fn(g,x,base,heroSize,s[0],s[1],OPT());
  label(g,x,base+26,s[2],s[1]==='goal'?'#ff8892':(light?'#3f7ba8':'#7fb8e0'));});
 g.strokeStyle=light?'rgba(0,0,0,.10)':'rgba(255,255,255,.07)';
 g.beginPath();g.moveTo(14,base+42);g.lineTo(w-14,base+42);g.stroke();
 label(g,w/2,base+62,'SIZE RAMP — how it holds up as shots get farther away');
 const rb=378; let x=w*0.14;
 RAMP.forEach(s=>{fn(g,x,rb,s,MIN,'save',OPT()); x+=Math.max(s*1.35,w*0.155);});
 label(g,w*0.80,rb-2,'← 13px');
}

function renderCrowd(id,fn){
 const o=cvs[id],g=o.g,w=o.w,h=o.h; field(g,w,h);
 g.strokeStyle=light?'rgba(0,0,0,.10)':'rgba(120,180,230,.12)';
 g.lineWidth=1; g.beginPath(); g.moveTo(0,h*0.30); g.lineTo(w,h*0.30); g.stroke();
 label(g,w/2,h*0.30-8,'far — point / blue line');
 for(const s of CROWD){
  const k=1/(1+s.d/24);
  const x=w/2+s.w*(w/95)*k*1.9;
  const y=h*0.30+(h*0.62)*k;
  fn(g,x,y,Math.max(11,120*k),MIN,s.out,OPT());
 }
 label(g,w/2,h-9,'__N__ real shots · nearer = closer to the net, drawn larger');
}

function drawAll(){renderBench('cA',STYLE.A);renderBench('cB',STYLE.B);
 renderCrowd('dA',STYLE.A);renderCrowd('dB',STYLE.B);}

const szEl=document.getElementById('sz'), szv=document.getElementById('szv');
szEl.addEventListener('input',()=>{heroSize=+szEl.value;szv.textContent=szEl.value;});
function tog(id,get,set){const b=document.getElementById(id);
 b.addEventListener('click',()=>{set(!get());b.setAttribute('aria-pressed',get());});}
tog('mo',()=>motion,v=>motion=v);
tog('gl',()=>glow,v=>glow=v);
tog('bg',()=>light,v=>{light=v;document.getElementById('bg').textContent=v?'Dark ice':'Light ice';});
addEventListener('resize',()=>{fitAll();drawAll();});
document.getElementById('mo').setAttribute('aria-pressed',motion);
fitAll();
(function loop(){T+=0.035;drawAll();requestAnimationFrame(loop);})();
</script>
"""

html = TEMPLATE.replace("__FIGURES__", FIGURES_JS).replace("__N__", str(len(crowd))).replace("__CROWD__", json.dumps(crowd, separators=(",", ":")))
out = ROOT / "src" / "figure-bench.html"
out.write_text(_page.document(html, title='Figure bench — Read the Game', description='A development tool: two player styles side by side on blank ice.'))

# extract the script for an external syntax check
script = re.search(r"<script>(.*)</script>", html, re.S).group(1)
chk = pathlib.Path(tempfile.gettempdir()) / "rtg.figbench.check.js"
chk.write_text(script)
print("wrote", out, len(html.encode()), "bytes;", len(crowd), "crowd shots")
