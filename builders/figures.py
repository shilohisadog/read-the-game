#!/usr/bin/env python3
"""The player figure — one canonical source, inlined into every app.

The apps are single self-contained files with no network access, so sharing
code means sharing it at build time: every builder imports FIGURES_JS from
here and injects it. There is exactly one definition of the mascot and one of
the tabletop player, and changing either changes every app that draws them.

Two styles ship, and which one you see is a viewer setting:

  mascot    the default. Big head, soft shapes, a face. Reads at small sizes
            and reads as friendly — the on-ramp for someone new to the game.
  tabletop  the rod-hockey tin man. Flat colour, heavy outline, stiff fused
            pose, standing on its peg. Reads as a game piece.

Both are MARKERS, not claims. A figure says "a real shot came from here, and
this is what happened to it". The pose encodes the outcome we actually have in
the feed (saved / scored) and nothing else. Neither style asserts anything
about how a player stood, moved, or skated — we don't have that data, so we
don't draw it.

Call signature (identical for both, so they are interchangeable):

  FIG[style](g, px, py, size, jersey, out, o)

  g       canvas 2d context      px,py  the figure's FEET, in canvas px
  size    height in px           jersey team colour
  out     'goal' | 'save'        o      { t, motion, glow, light }
"""

FIGURES_JS = r"""
/* ---- the player figure — see builders/figures.py ---------------------- */
/* A stick blade, taped. The blade used to be drawn in near-black on near-black
   ice, which made it vanish — you couldn't tell the sticks had blades at all.
   White tape is what a real blade actually wears, so it reads as hockey rather
   than as a highlight: dark edge underneath, tape over most of it. */
function _blade(g,x1,y1,x2,y2,u,w){
 const cap=g.lineCap; g.lineCap='butt';
 g.strokeStyle='#0f151a'; g.lineWidth=u*w;
 g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
 const dx=(x2-x1)*0.09, dy=(y2-y1)*0.09;
 g.strokeStyle='#eef4f8'; g.lineWidth=u*w*0.52;
 g.beginPath(); g.moveTo(x1+dx,y1+dy); g.lineTo(x2-dx,y2-dy); g.stroke();
 g.lineCap=cap;
}

function _rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);
 g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

function figMascot(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, glow=o.glow!==false, light=!!o.light;
 const u=size/10, goal=out==='goal', ink='#0d141b', skin='#f7dcb4', pants='#1d2a36';
 g.save(); g.lineCap='round'; g.lineJoin='round';
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.40)';
 g.beginPath(); g.ellipse(px,py+u*0.35,u*2.7,u*0.75,0,0,7); g.fill();
 const bob=motion?Math.sin(t*1.7+px*0.02)*u*0.30:0;
 g.translate(px,py+bob); g.rotate(goal?-0.03:0.10);
 g.strokeStyle=pants; g.lineWidth=u*1.5;
 g.beginPath(); g.moveTo(-u*1.15,-u*0.3); g.lineTo(-u*1.35,-u*2.8);
 g.moveTo(u*1.15,-u*0.3); g.lineTo(u*1.5,-u*2.8); g.stroke();
 g.strokeStyle='#cfe0ee'; g.lineWidth=u*0.40;
 g.beginPath(); g.moveTo(-u*2.1,0); g.lineTo(-u*0.5,0); g.moveTo(u*0.5,0); g.lineTo(u*2.3,0); g.stroke();
 if(glow){g.shadowColor=goal?'#ff5566':'#4aa3e0'; g.shadowBlur=goal?u*5.0:u*2.4;}
 g.fillStyle=jersey; _rr(g,-u*2.15,-u*5.9,u*4.3,u*3.5,u*1.6); g.fill();
 g.shadowBlur=0;
 g.fillStyle='rgba(255,255,255,.80)'; _rr(g,-u*2.1,-u*3.05,u*4.2,u*0.5,u*0.22); g.fill();
 g.strokeStyle=jersey; g.lineWidth=u*1.25;
 if(!goal){
  g.beginPath(); g.moveTo(-u*1.5,-u*5.0); g.lineTo(u*1.5,-u*4.3); g.lineTo(u*3.2,-u*3.5); g.stroke();
  g.fillStyle=jersey; g.strokeStyle=ink; g.lineWidth=u*0.26;
  g.beginPath(); g.arc(u*3.3,-u*3.4,u*0.92,0,7); g.fill(); g.stroke();
  g.strokeStyle='#8a5c33'; g.lineWidth=u*0.46;
  g.beginPath(); g.moveTo(u*2.5,-u*4.3); g.lineTo(u*5.45,-u*0.48); g.stroke();
  _blade(g,u*5.20,-u*0.46,u*7.30,-u*0.08,u,0.80);
  g.fillStyle='#0b0f13'; g.beginPath(); g.ellipse(u*8.15,-u*0.08,u*0.52,u*0.26,0,0,7); g.fill();
 }else{
  g.beginPath(); g.moveTo(-u*1.7,-u*5.2); g.lineTo(-u*3.5,-u*8.7);
  g.moveTo(u*1.7,-u*5.2); g.lineTo(u*3.5,-u*8.7); g.stroke();
  g.fillStyle=jersey; g.strokeStyle=ink; g.lineWidth=u*0.26;
  g.beginPath(); g.arc(-u*3.6,-u*9.0,u*0.92,0,7); g.fill(); g.stroke();
  g.beginPath(); g.arc(u*3.6,-u*9.0,u*0.92,0,7); g.fill(); g.stroke();
  g.strokeStyle='#8a5c33'; g.lineWidth=u*0.42;
  g.beginPath(); g.moveTo(u*3.7,-u*9.1); g.lineTo(u*6.35,-u*11.55); g.stroke();
  _blade(g,u*6.20,-u*11.42,u*7.95,-u*12.55,u,0.74);
 }
 g.fillStyle=skin; g.beginPath(); g.arc(0,-u*7.9,u*2.55,0,7); g.fill();
 g.fillStyle=jersey;
 g.beginPath(); g.arc(0,-u*8.1,u*2.72,Math.PI*1.02,Math.PI*2-0.02); g.fill();
 g.beginPath(); g.arc(-u*2.35,-u*7.75,u*0.72,0,7); g.fill();
 g.beginPath(); g.arc(u*2.35,-u*7.75,u*0.72,0,7); g.fill();
 if(size>20){
  g.fillStyle=ink;
  g.beginPath(); g.arc(-u*0.95,-u*7.95,u*0.34,0,7); g.fill();
  g.beginPath(); g.arc(u*0.95,-u*7.95,u*0.34,0,7); g.fill();
  g.fillStyle='rgba(255,255,255,.92)';
  g.beginPath(); g.arc(-u*0.82,-u*8.10,u*0.12,0,7); g.fill();
  g.beginPath(); g.arc(u*1.08,-u*8.10,u*0.12,0,7); g.fill();
  if(goal){g.fillStyle='#41202a'; g.beginPath(); g.ellipse(0,-u*6.85,u*0.58,u*0.78,0,0,7); g.fill();}
  else{g.strokeStyle=ink; g.lineWidth=u*0.24;
       g.beginPath(); g.arc(0,-u*7.25,u*0.85,0.28,Math.PI-0.28); g.stroke();}
 }
 g.restore();
}

function figTabletop(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, glow=o.glow!==false, light=!!o.light;
 const u=size/10, goal=out==='goal', ink='#080b0e', pants='#e7edf2', skin='#f2d3ad';
 g.save(); g.lineJoin='miter'; g.lineCap='butt';
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.42)';
 g.beginPath(); g.ellipse(px,py+u*0.55,u*3.0,u*0.85,0,0,7); g.fill();
 const wob=motion?Math.sin(t*1.25+px*0.03)*0.055:0;
 g.translate(px,py); g.rotate(wob);
 const O=(fill,lw)=>{g.fillStyle=fill;g.fill();g.strokeStyle=ink;g.lineWidth=u*(lw||0.52);g.stroke();};
 g.fillStyle='#22323f'; g.beginPath(); g.ellipse(0,u*0.28,u*2.35,u*0.68,0,0,7); g.fill();
 g.fillStyle='#33485c'; g.beginPath(); g.ellipse(0,u*0.06,u*1.95,u*0.52,0,0,7); g.fill();
 g.beginPath(); g.moveTo(-u*1.72,u*0.05); g.lineTo(-u*0.38,u*0.05);
 g.lineTo(-u*0.52,-u*3.4); g.lineTo(-u*1.62,-u*3.4); g.closePath(); O(pants);
 g.beginPath(); g.moveTo(u*0.38,u*0.05); g.lineTo(u*1.72,u*0.05);
 g.lineTo(u*1.62,-u*3.4); g.lineTo(u*0.52,-u*3.4); g.closePath(); O(pants);
 if(glow){g.shadowColor=goal?'#ff5566':'#4aa3e0'; g.shadowBlur=goal?u*4.6:u*2.2;}
 g.beginPath(); g.moveTo(-u*1.78,-u*3.2); g.lineTo(u*1.78,-u*3.2);
 g.lineTo(u*2.52,-u*6.55); g.lineTo(-u*2.52,-u*6.55); g.closePath(); O(jersey);
 g.shadowBlur=0;
 g.save(); g.clip();
 g.fillStyle='rgba(255,255,255,.88)';
 g.fillRect(-u*3,-u*4.62,u*6,u*0.38); g.fillRect(-u*3,-u*4.02,u*6,u*0.38);
 g.restore();
 g.save(); g.globalAlpha=0.42; g.strokeStyle='#ff4d5e'; g.lineWidth=u*0.26;
 g.beginPath(); g.moveTo(-u*2.02,-u*3.44); g.lineTo(u*1.54,-u*3.44);
 g.lineTo(u*2.28,-u*6.79); g.lineTo(-u*2.76,-u*6.79); g.closePath(); g.stroke(); g.restore();
 const arm=(x1,y1,x2,y2)=>{
  g.lineCap='round';
  g.strokeStyle=ink; g.lineWidth=u*1.52; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  g.strokeStyle=jersey; g.lineWidth=u*0.92; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  g.lineCap='butt';};
 if(!goal){
  arm(-u*2.15,-u*5.95, u*1.55,-u*4.65);
  arm(u*2.15,-u*5.95, u*3.35,-u*3.95);
  g.lineCap='round';
  g.strokeStyle=ink; g.lineWidth=u*0.86;
  g.beginPath(); g.moveTo(u*0.85,-u*5.15); g.lineTo(u*5.75,-u*0.28); g.stroke();
  g.strokeStyle='#c98b45'; g.lineWidth=u*0.40;
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.34); g.stroke();
  _blade(g,u*5.30,-u*0.30,u*7.40,-u*0.04,u,0.98);
  g.lineCap='butt';
 }else{
  arm(-u*2.25,-u*6.15, -u*4.05,-u*9.35);
  arm(u*2.25,-u*6.15, u*4.05,-u*9.35);
 }
 g.beginPath(); g.arc(0,-u*7.85,u*1.55,0,7); O(skin,0.46);
 g.beginPath(); g.arc(0,-u*7.95,u*1.63,Math.PI,0); g.closePath(); O(jersey,0.46);
 if(size>20){
  g.fillStyle=ink;
  g.beginPath(); g.arc(-u*0.56,-u*7.55,u*0.19,0,7); g.fill();
  g.beginPath(); g.arc(u*0.56,-u*7.55,u*0.19,0,7); g.fill();
 }
 g.restore();
}

const FIG={mascot:figMascot,tabletop:figTabletop};
const FIG_LABEL={mascot:'Mascot',tabletop:'Tabletop'};
/* ---- end figure module ------------------------------------------------ */
"""

# The picker, so every app offers the same choice with the same words.
PICKER_CSS = r"""
#gv .figpick{display:flex;gap:7px;align-items:center;margin-top:11px;flex-wrap:wrap}
#gv .figpick .fl{font-size:.8rem;color:var(--muted);font-weight:700}
#gv .fbtn{font:inherit;font-size:.82rem;font-weight:600;border-radius:8px;border:1px solid #24384a;
 background:#0e1b27;color:var(--muted);padding:8px 12px;cursor:pointer}
#gv .fbtn[aria-pressed="true"]{border-color:#4aa3e0;color:#fff;background:#12283a}
#gv .fwhy{font-size:.75rem;color:var(--muted);margin:7px 2px 0;max-width:66ch;line-height:1.5}
"""

PICKER_HTML = r"""<div class="figpick"><span class="fl">Players:</span>
<button class="fbtn" data-f="mascot" aria-pressed="true">Mascot</button>
<button class="fbtn" data-f="tabletop" aria-pressed="false">Tabletop</button></div>
<p class="fwhy">Same shots, same outcomes, same math &mdash; only the drawing changes.
<b>Tabletop</b> is the rod-hockey player you grew up with.</p>"""

PICKER_JS = r"""
let figStyle=(function(){try{return localStorage.getItem('rtg.fig')||'mascot'}catch(e){return 'mascot'}})();
if(!FIG[figStyle])figStyle='mascot';
function syncFig(){document.querySelectorAll('#gv .fbtn').forEach(b=>
 b.setAttribute('aria-pressed',b.dataset.f===figStyle));}
document.querySelectorAll('#gv .fbtn').forEach(b=>b.addEventListener('click',()=>{
 figStyle=b.dataset.f; try{localStorage.setItem('rtg.fig',figStyle)}catch(e){} syncFig(); draw();}));
syncFig();
"""
