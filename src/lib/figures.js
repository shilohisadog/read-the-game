/**
 * The player figure — one definition, two surfaces.
 *
 * Previously this lived as a JS string inside builders/figures.py, which meant
 * node could not import it and nothing could test it. It is now a real module,
 * and it draws through a PEN rather than a canvas context.
 *
 * A pen is the small subset of the canvas 2D API these figures actually use.
 * A real CanvasRenderingContext2D is a pen, so the goalie's-eye view passes its
 * context straight through. SvgPen (../svgpen.js) is also a pen, which is how
 * the same figures appear on the 2D rink — where events must stay real DOM
 * nodes, because "check our work" is made physical by being able to inspect
 * them, and because the why-popup hangs off click handlers.
 *
 * Two styles ship and which one you see is a viewer setting:
 *   mascot    the default — big head, soft shapes, a face. Legible small.
 *   tabletop  the rod-hockey tin man — flat colour, heavy outline, on its peg.
 *
 * Both are MARKERS, not claims (Doctrine §5). A figure says "a real shot came
 * from here, and this is what happened to it". The pose encodes the outcome the
 * feed records — saved or scored — and nothing else. Neither asserts anything
 * about how a player stood, moved or skated.
 *
 *   FIG[style](pen, px, py, size, jersey, out, { t, motion, glow, light })
 *
 * px,py is the figure's FEET. size is its height.
 */
/* A stick blade, taped. The blade used to be drawn in near-black on near-black
   ice, which made it vanish — you couldn't tell the sticks had blades at all.
   White tape is what a real blade actually wears, so it reads as hockey rather
   than as a highlight: dark edge underneath, tape over most of it. */
export function _blade(g,x1,y1,x2,y2,u,w){
 const cap=g.lineCap; g.lineCap='butt';
 g.strokeStyle='#0f151a'; g.lineWidth=u*w;
 g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
 const dx=(x2-x1)*0.09, dy=(y2-y1)*0.09;
 g.strokeStyle='#eef4f8'; g.lineWidth=u*w*0.52;
 g.beginPath(); g.moveTo(x1+dx,y1+dy); g.lineTo(x2-dx,y2-dy); g.stroke();
 g.lineCap=cap;
}

export function _rr(g,x,y,w,h,r){
 // Quadratic corners rather than arcTo: canvas supports both, and Q maps 1:1
 // onto SVG so one figure definition can drive either surface.
 g.beginPath();
 g.moveTo(x+r,y);            g.lineTo(x+w-r,y);      g.quadraticCurveTo(x+w,y,x+w,y+r);
 g.lineTo(x+w,y+h-r);        g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 g.lineTo(x+r,y+h);          g.quadraticCurveTo(x,y+h,x,y+h-r);
 g.lineTo(x,y+r);            g.quadraticCurveTo(x,y,x+r,y);
 g.closePath();}

export function figMascot(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, glow=o.glow!==false, light=!!o.light;
 // How large the figure will actually APPEAR, which is not `size` when drawing
 // into a scaled SVG viewBox. Detail is dropped by apparent size, so a 9-unit
 // figure on a rink that renders 4.3px per unit keeps its face.
 // (Not named `px` -- that is already this function's x coordinate.)
 const shownAt = o.px == null ? size : o.px;
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
 if(shownAt>20){
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

export function figTabletop(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, glow=o.glow!==false, light=!!o.light;
 // How large the figure will actually APPEAR, which is not `size` when drawing
 // into a scaled SVG viewBox. Detail is dropped by apparent size, so a 9-unit
 // figure on a rink that renders 4.3px per unit keeps its face.
 // (Not named `px` -- that is already this function's x coordinate.)
 const shownAt = o.px == null ? size : o.px;
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
 if(shownAt>20){
  g.fillStyle=ink;
  g.beginPath(); g.arc(-u*0.56,-u*7.55,u*0.19,0,7); g.fill();
  g.beginPath(); g.arc(u*0.56,-u*7.55,u*0.19,0,7); g.fill();
 }
 g.restore();
}

export const FIG={mascot:figMascot,tabletop:figTabletop};
export const FIG_LABEL={mascot:'Mascot',tabletop:'Tabletop'};
