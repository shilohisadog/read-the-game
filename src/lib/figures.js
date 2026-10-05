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
 * ONE STYLE SHIPS: the mascot — big head, soft shapes, a face, legible small.
 * ⏹ A second (`tabletop`, the rod-hockey tin man) lived here until 2026-09-17 and
 * went with the goaltender's-eye view, the only surface that could select it.
 *
 * Both are MARKERS, not claims (Doctrine §5). A figure says "the player this
 * coordinate belongs to was here, and this is what happened". USUALLY that is
 * the shooter — but on a BLOCKED SHOT the coordinate is the BLOCKER's position,
 * a median 25.0 ft from the attacked net against 34.3 for a shot on goal, so the
 * figure is the blocker and wears his sweater. This sentence used to read "a
 * real shot came from here", which was false for every blocked shot on the site.
 * The pose encodes the outcome the feed records — saved or scored — and nothing
 * else; it does not claim the figure was shooting. Neither asserts anything
 * about how a player stood, moved or skated.
 *
 *   FIG.mascot(pen, px, py, size, jersey, out, { t, motion, glow, light })
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

/**
 * A GOALTENDER, IN THE SAME HAND AS THE SKATER.
 *
 * ⭐⭐⭐ WHY THIS EXISTS. Kevin, 2026-10-04: *"the stick figures on the penalties
 * and empty net diagrams just don't work for me anymore. We need to update them
 * to something more, I dunno, consistent with the replay figures?"* Photographing
 * the two side by side found something bigger than the diagrams: **the REPLAY
 * drew its own goaltenders with `rinkart.js::goalieGlyph`** — a circle, a capsule
 * and a line — so the live rink showed a mascot shooting past two wireframes
 * standing in the creases. One project, two drawings of a person, already side by
 * side in front of readers. See `docs/reviews/figures-2026-10-04/`.
 *
 * ⭐ IT IS BUILT ON THE MASCOT'S OWN GRID, not beside it. Same `u = size/10`,
 * same feet-at-`py` origin, same ink, same skin, same shadow, same
 * detail-by-apparent-size rule. The two must read as PEERS — the identical
 * objection `skaterGlyph` records about `goalieGlyph`, which is the reason that
 * glyph family was internally consistent and externally alien.
 *
 * ⛔ WHAT MAKES HIM A GOALTENDER IS THE SILHOUETTE, NOT THE DETAIL. At the size a
 * rink actually renders him he is: WIDE (leg pads), SQUARE (chest protector), and
 * CARRYING A PADDLE THAT STOPS LOW. Those three survive to 9 units; a mask cage
 * and a trapper's cuff do not, and are drawn only above the same `shownAt`
 * threshold the mascot's face uses.
 *
 * ⚠️ HE CLAIMS WHAT THE SKATER CLAIMS AND NO MORE (Doctrine §5): that a
 * goaltender defends this net, which the feed records. Not where he stood — the
 * crease is where the rulebook puts him, not where we guess he was — and the pose
 * encodes nothing about a save. `out` is accepted for signature parity with
 * `figMascot` and deliberately ignored: a goaltender's drawing must not change
 * with an outcome it did not take.
 *
 *   FIG.goalie(pen, px, py, size, jersey, out, { t, motion, light, px, dir })
 *
 * `dir` is +1 (facing right) or -1, because unlike the skater he is drawn at both
 * ends of one rink and must face the ice rather than the boards.
 */
export function figGoalie(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, light=!!o.light;
 const d=o.dir===-1?-1:1, shownAt=o.px==null?size:o.px;
 /* ⛔⛔⛔ THE PADS WERE NEAR-WHITE AND VANISHED ON THE RINK. `#eaf1f7` on ice of
    `#eef4f8` is four points of luminance: at the size of this comparison sheet
    the dark outline carried them and they looked like equipment, and at the size
    the REPLAY actually draws a goaltender — about 58px — the fill was the ice and
    all that survived was a 1px wire. He had gone back to being a wireframe by a
    different route. **A FIGURE CHECKED AT ONE SIZE IS NOT CHECKED**, which is the
    same lesson as the background, one axis over.
    ⭐ SO THE PADS WEAR THE CLUB'S COLOUR and the trim is white. It is what the
    equipment really looks like, it makes him legible at every size, and it tells
    a novice whose end this is — which the white version could not. */
 const u=size/10, ink='#0d141b', skin='#f7dcb4', trim='#f4f8fb';
 const X=v=>v*d;                       // the only asymmetric parts are his hands
 g.save(); g.lineCap='round'; g.lineJoin='round';
 /* WIDER THAN A SKATER'S, because the pads are. A shadow that matched the
    skater's would make him read as a narrow man standing behind big equipment. */
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.40)';
 g.beginPath(); g.ellipse(px,py+u*0.35,u*3.4,u*0.8,0,0,7); g.fill();
 /* ⚠️ HE BOBS LESS THAN A SKATER AND DOES NOT LEAN. A goaltender set in his
    crease is the one figure on this rink that is deliberately still, and tilting
    him would read as a save in progress -- a claim the feed does not make. */
 const bob=motion?Math.sin(t*1.3+px*0.02)*u*0.16:0;
 g.translate(px,py+bob);
 /* ⛔ THE PADS ARE A WALL, NOT LEGS, AND THE WHOLE FIGURE IS ONE SHAPE.
    Two renders got here. The first drew the pads narrow and tall and he read as a
    thin man in white trousers -- the same failure `skaterGlyph` records when a
    stick became a second leg. The second made them wide and he read as a white
    slab with eleven loose objects around it: a floating box, a floating circle,
    a separate paddle. **The mascot works because its SILHOUETTE IS ONE BLOB**,
    and a peer of it has to be built the same way, so everything here is tucked
    against the body and the part count is as low as the idea allows.
    ⚠️ Neither was reachable by reading. Both were found by rendering the figure
    and looking at it -- `docs/reviews/figures-2026-10-04/`. */
 g.fillStyle=jersey; g.strokeStyle=ink; g.lineWidth=u*0.26;
 _rr(g,-u*2.65,-u*3.95,u*2.5,u*3.95,u*0.62); g.fill(); g.stroke();
 _rr(g,u*0.15,-u*3.95,u*2.5,u*3.95,u*0.62); g.fill(); g.stroke();
 /* THE KNEE ROLL, one line per pad. Without it they are two blank slabs; with
    it they are equipment, and it costs two strokes. */
 g.strokeStyle=trim; g.lineWidth=u*0.42;
 g.beginPath(); g.moveTo(-u*2.45,-u*2.5); g.lineTo(-u*0.35,-u*2.5);
 g.moveTo(u*0.35,-u*2.5); g.lineTo(u*2.45,-u*2.5); g.stroke();
 g.strokeStyle='#cfe0ee'; g.lineWidth=u*0.40;
 g.beginPath(); g.moveTo(-u*2.5,0); g.lineTo(-u*0.8,0); g.moveTo(u*0.8,0); g.lineTo(u*2.5,0); g.stroke();
 /* THE CHEST sits ON the pads with no gap, so the two read as one body. */
 g.fillStyle=jersey; _rr(g,-u*3.0,-u*7.1,u*6.0,u*3.35,u*1.1); g.fill();
 g.fillStyle=trim; _rr(g,-u*2.95,-u*4.6,u*5.9,u*0.5,u*0.22); g.fill();
 /* ⚠️ THE HANDS ARE TUCKED AGAINST THE CHEST, not held out on arms. Held out,
    they read as two objects beside a goaltender; tucked, they read as his. */
 g.fillStyle=trim; g.strokeStyle=ink; g.lineWidth=u*0.24;
 _rr(g,d>0?u*2.55:-u*4.2,-u*6.6,u*1.65,u*2.1,u*0.32); g.fill(); g.stroke();   // blocker
 g.beginPath(); g.arc(X(-u*3.35),-u*5.5,u*1.2,0,7); g.fill(); g.stroke();     // trapper
 g.fillStyle='rgba(13,20,27,.16)'; g.beginPath(); g.arc(X(-u*3.35),-u*5.5,u*0.58,0,7); g.fill();
 /* THE STICK: a shaft out of the blocker and a blade ON the ice. A goaltender's
    is the one stick on this rink that stays low, and that is the tell. */
 g.strokeStyle='#8a5c33'; g.lineWidth=u*0.44;
 g.beginPath(); g.moveTo(X(u*3.35),-u*5.4); g.lineTo(X(u*4.15),-u*0.55); g.stroke();
 _blade(g,X(u*3.65),-u*0.12,X(u*5.75),-u*0.12,u,0.86);
 // HEAD, THEN MASK. The skin circle is the skater's, so the two heads are one size.
 g.fillStyle=skin; g.beginPath(); g.arc(0,-u*8.25,u*2.5,0,7); g.fill();
 g.fillStyle=jersey;
 g.beginPath(); g.arc(0,-u*8.35,u*2.70,Math.PI*0.86,Math.PI*2+0.14); g.fill();
 if(shownAt>20){
  /* THE CAGE, and it is the whole reason a mask reads as a mask. Three bars and
     a chin bar; below this size they merge into a smear and are dropped. */
  g.strokeStyle=ink; g.lineWidth=u*0.18;
  g.beginPath();
  g.moveTo(-u*1.55,-u*7.5); g.lineTo(u*1.55,-u*7.5);
  g.moveTo(-u*1.35,-u*6.85); g.lineTo(u*1.35,-u*6.85);
  g.moveTo(-u*0.55,-u*7.95); g.lineTo(-u*0.55,-u*6.5);
  g.moveTo(u*0.55,-u*7.95); g.lineTo(u*0.55,-u*6.5); g.stroke();
 }
 g.restore();
}

/**
 * AN OFFICIAL WITH HIS ARM UP — the third person, and the only one who is not
 * playing.
 *
 * ⛔ HE IS FOR THE DELAYED PENALTY AND NOTHING ELSE. The raised arm is a SIGNAL
 * with a meaning in the rulebook, so drawing him anywhere that signal is not
 * being made would be a sentence the picture says and the page does not. The
 * biconditional in `test/learn-figures.test.js` holds him to the figures whose
 * words name him, exactly as it holds the goaltender.
 *
 * ⭐ THE STRIPES ARE THE IDENTITY, and they are the one part that cannot be
 * dropped at small sizes — a neutral-sweatered man with his arm up is a player
 * celebrating. So the bands are drawn at every size and the FACE is what goes.
 *
 * ⚠️ HE TAKES NO `jersey`. An official wears no club's colour, and accepting one
 * would invite a caller to hand him a team's — which is the single most wrong
 * thing this figure could say. The argument is kept in the signature for parity
 * and ignored, like `out` on the goaltender.
 */
export function figOfficial(g,px,py,size,_jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, light=!!o.light;
 const d=o.dir===-1?-1:1, shownAt=o.px==null?size:o.px;
 const u=size/10, ink='#0d141b', skin='#f7dcb4', pants='#1d2a36';
 const stripe='#f2f6fa', dark='#141c24';
 g.save(); g.lineCap='round'; g.lineJoin='round';
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.40)';
 g.beginPath(); g.ellipse(px,py+u*0.35,u*2.7,u*0.75,0,0,7); g.fill();
 const bob=motion?Math.sin(t*1.7+px*0.02)*u*0.30:0;
 g.translate(px,py+bob);
 g.strokeStyle=pants; g.lineWidth=u*1.5;
 g.beginPath(); g.moveTo(-u*1.15,-u*0.3); g.lineTo(-u*1.35,-u*2.8);
 g.moveTo(u*1.15,-u*0.3); g.lineTo(u*1.5,-u*2.8); g.stroke();
 g.strokeStyle='#cfe0ee'; g.lineWidth=u*0.40;
 g.beginPath(); g.moveTo(-u*2.1,0); g.lineTo(-u*0.5,0); g.moveTo(u*0.5,0); g.lineTo(u*2.3,0); g.stroke();
 /* THE SWEATER: the skater's torso, banded. ⛔ THREE BANDS CAME OUT A DARK BLOB.
    The helmet's brim covers the top of the torso and both arms cover its sides,
    so three dark bands left almost no white showing and he read as a man in
    black with a stripe. TWO bands, thinner, placed where nothing overlaps them:
    the white has to WIN, because a dark figure with his arm up is a player
    celebrating and the stripes are the only thing that says otherwise. */
 g.fillStyle=stripe; _rr(g,-u*2.15,-u*5.9,u*4.3,u*3.5,u*1.6); g.fill();
 g.save(); _rr(g,-u*2.15,-u*5.9,u*4.3,u*3.5,u*1.6); g.clip();
 g.fillStyle=dark;
 for(let i=0;i<2;i++){ const y=-u*4.85+i*u*1.35; g.beginPath();
  g.moveTo(-u*2.2,y); g.lineTo(u*2.2,y); g.lineTo(u*2.2,y+u*0.52); g.lineTo(-u*2.2,y+u*0.52);
  g.closePath(); g.fill(); }
 g.restore();
 // the other arm stays down, so the raised one reads as deliberate
 g.strokeStyle=dark; g.lineWidth=u*1.25;
 g.beginPath(); g.moveTo(X0(d,-u*1.5),-u*5.0); g.lineTo(X0(d,-u*2.7),-u*3.4); g.stroke();
 g.fillStyle=skin; g.strokeStyle=ink; g.lineWidth=u*0.26;
 g.beginPath(); g.arc(X0(d,-u*2.85),-u*3.15,u*0.80,0,7); g.fill(); g.stroke();
 g.fillStyle=skin; g.beginPath(); g.arc(0,-u*7.9,u*2.55,0,7); g.fill();
 g.fillStyle=dark;
 g.beginPath(); g.arc(0,-u*8.1,u*2.72,Math.PI*1.02,Math.PI*2-0.02); g.fill();
 g.beginPath(); g.arc(-u*2.35,-u*7.75,u*0.72,0,7); g.fill();
 g.beginPath(); g.arc(u*2.35,-u*7.75,u*0.72,0,7); g.fill();
 if(shownAt>20){
  g.fillStyle=ink;
  g.beginPath(); g.arc(-u*0.95,-u*7.95,u*0.34,0,7); g.fill();
  g.beginPath(); g.arc(u*0.95,-u*7.95,u*0.34,0,7); g.fill();
  g.strokeStyle=ink; g.lineWidth=u*0.24;
  g.beginPath(); g.arc(0,-u*7.25,u*0.85,0.28,Math.PI-0.28); g.stroke();
 }
 /* ⛔⛔⛔ THE SIGNAL ARM IS DRAWN LAST, AND OUTSIDE THE HEAD. Two renders were
    wrong here and each was invisible for a different reason, which is why this
    is the most commented limb on the rink.
    FIRST it was the sweater's WHITE on near-white ice: perfect on the diagram's
    dark preview ground, a floating hand and no arm on the replay. **A COLOUR
    CHECKED ON ONE BACKGROUND IS NOT CHECKED.**
    THEN, dark and legible, it was drawn BEFORE the head and ran straight through
    it -- and the head is an opaque circle of radius 2.55, so it painted the arm
    out. The hand cleared the top and nothing joined it to the body, which looks
    exactly like the first bug and is not. **DRAW ORDER IS A VISIBILITY PROPERTY
    AND NOTHING BUT LOOKING WILL TELL YOU.**
    It now rises at x≈2.7-3.1, clear of the head, and is painted after it.
    ⭐ ONE ARM, STRAIGHT UP. Two raised arms is the mascot's GOAL pose. */
 g.strokeStyle=dark; g.lineWidth=u*1.3;
 g.beginPath(); g.moveTo(X0(d,u*1.9),-u*5.5); g.lineTo(X0(d,u*3.0),-u*10.4); g.stroke();
 g.strokeStyle=stripe; g.lineWidth=u*1.3;
 g.beginPath(); g.moveTo(X0(d,u*2.45),-u*7.9); g.lineTo(X0(d,u*2.58),-u*8.5); g.stroke();
 g.fillStyle=skin; g.strokeStyle=ink; g.lineWidth=u*0.26;
 g.beginPath(); g.arc(X0(d,u*3.1),-u*10.9,u*0.88,0,7); g.fill(); g.stroke();
 g.restore();
}
const X0=(d,v)=>v*d;

/* ⏹ `figTabletop` — THE ROD-HOCKEY FIGURE — WAS DELETED 2026-09-17 with the
   goaltender's-eye view, the only page that could draw it: `figStyle` is the
   constant 'mascot' everywhere else, so it had shipped unreachable in both replay
   pages for weeks. ⏭ IF THE GOALIE VIEW COMES BACK, so does its figure:
   `git log -S figTabletop` finds both, and `git show <this commit>^:src/lib/figures.js`
   is the whole module with both styles in it. See docs/status.md. */
/* ⭐⭐⭐ HOW TALL A PERSON IS ON THIS RINK, AND IT IS A DECLARED POLICY.
   The rink is drawn 200x85 units for 200x85 feet, so ONE UNIT IS ONE FOOT and a
   figure's `size` is its height in feet. That made every figure here checkable
   for the first time, and all of them were wrong: a skater was NINE FEET tall and
   a goaltender FOUR, a 2.25x mismatch between two men standing on one sheet.

   ⛔ IT WAS NOT A DRAWING BUG, IT WAS A MISSING SOURCE. The skater's 9 came from
   "a ~6 ft player is ~6 units, goals get a little more presence" — an exaggeration
   nobody had re-examined — and the goaltender's 4 came from fitting him inside the
   six-foot goal mouth, which is a rule about EQUIPMENT standing in for a rule
   about people. Kevin, 2026-10-05: *"is the net size scaled accurately to the rink
   size? Since the goalie is scaled to the net, the players appear quite a bit
   larger than the goalie, let's ensure the net scale is accurate, then work
   backwards to the size of the skaters."* The net was accurate but for its depth;
   the people were not, and this is the number they now come from.

   ⚠️ IT IS A POLICY, NOT A MEASUREMENT: the archive records no heights, so this is
   our declared choice — an NHL skater averages about 6'1", and on blades stands a
   little over six feet. Every surface derives from it so there is one place to
   argue with. */
export const PLAYER_FT = 6.2;
/* ⛔⛔ `size` IS NOT THE DRAWN HEIGHT, AND ASSUMING IT WAS PUT A 7.4-FOOT
   GOALTENDER ON THE ICE. The figures are laid out on a grid of `u = size/10` and
   reach about 11.9 of those units from the shadow under the skates to the crown
   of the head, so a figure asked for 6.2 draws 7.4. Measured, not guessed —
   mascot 1.197, goaltender 1.190 — and the two agree closely enough to share one
   number. **A PARAMETER NAMED FOR A QUANTITY IS NOT THE QUANTITY**, which is the
   same shape as `own` meaning four things: the only fix is to measure it once and
   convert in one place.
   ⚠️ THE RAISED-ARM POSES ARE LEGITIMATELY TALLER — the goal celebration reaches
   1.365 and the official 1.288 — because a person with his arms up IS taller.
   They are not corrected back down; that would draw a man who shrinks to
   celebrate. */
export const FIG_RISE = 1.19;
/** The `size` to ask for when a figure should stand `ft` feet tall. */
export const sizeFor = ft => ft / FIG_RISE;
/* ⏭ A GOAL USED TO BE DRAWN 28% LARGER — "goals get a little more presence" —
   and that exaggeration is now 1.0, because the scale it was measured against
   turned out to be wrong by half again and a bonus on top of a wrong number is
   not a decision anybody made. The goal figure is still unmistakable without it:
   the pose raises both arms, which makes it 14% taller on its own, and it carries
   the goal colour and glow. ⚠️ KEVIN CAN HAVE THE PRESENCE BACK WITH THIS ONE
   NUMBER, now that it would be an emphasis on an honest height rather than a
   second exaggeration hiding inside a first. */
export const GOAL_SCALE = 1;

export const FIG = { mascot: figMascot, goalie: figGoalie, official: figOfficial };
