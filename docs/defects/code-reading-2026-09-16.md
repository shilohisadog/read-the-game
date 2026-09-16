# Code-reading check — 30 planted changes nothing observed

**For CHENG, relayed by Kevin. Written 2026-09-16.** Blind: the developer's own call on each is sealed until you have answered.

**Context.** Read the Game (an NHL replay-teaching site) ran a mutation experiment: small, random, single-token changes were planted in its code, and for each one every detector was run — the JS and Python test suites, invariants over 52 real published games, the full pipeline step that writes the published figures, and real Chrome on 37 replay states and 10 static pages at two widths. **These 30 changes moved nothing any of those detectors could see.** Each is either *equivalent* (no behaviour change at all) or *real but outside what the detectors exercised*. The question is which.

**The code is JavaScript.** `src/app.js` is the replay page (one large function, many closures); `src/lib/*.js` are pure modules; `figures.js` draws player figures onto a canvas. You only have the snippet — where the answer depends on code you cannot see, say so rather than guess.

For each, answer with ONE code and one short sentence:

| code | meaning |
|---|---|
| `E` | **equivalent** — no input the code can receive behaves differently |
| `RV` | **real, visible** — a reader could see it in some state (text, drawing, animation, interaction); name the state |
| `RN` | **real, a number** — a computed or published figure changes; say which |
| `RI` | **real, invisible** — state or markup changes that no reader can see |
| `RU` | **real only for input real data never produces** — say what input |
| `U` | **cannot tell from the snippet** — say what you would need to see |

---

### 1. `src/lib/figures.js` line 75

```js
 g.translate(px,py+bob); g.rotate(goal?-0.03:0.10);
 g.strokeStyle=pants; g.lineWidth=u*1.5;
 g.beginPath(); g.moveTo(-u*1.15,-u*0.3); g.lineTo(-u*1.35,-u*2.8);
 g.moveTo(u*1.15,-u*0.3); g.lineTo(u*1.5,-u*2.8); g.stroke();
 g.strokeStyle='#cfe0ee'; g.lineWidth=u*0.40;
 g.beginPath(); g.moveTo(-u*2.1,0); g.lineTo(-u*0.5,0); g.moveTo(u*0.5,0); g.lineTo(u*2.3,0); g.stroke();
// ─── the line as written ───
 if(glow){g.shadowColor=goal?'#ff5566':'#4aa3e0'; g.shadowBlur=goal?u*5.0:u*2.4;}
// ─── the line as changed ───
 if(glow){g.shadowColor=goal?'#ff5566':'#4aa3e0'; g.shadowBlur=goal?u*6:u*2.4;}
 g.fillStyle=jersey; _rr(g,-u*2.15,-u*5.9,u*4.3,u*3.5,u*1.6); g.fill();
 g.shadowBlur=0;
 g.fillStyle='rgba(255,255,255,.80)'; _rr(g,-u*2.1,-u*3.05,u*4.2,u*0.5,u*0.22); g.fill();
 g.strokeStyle=jersey; g.lineWidth=u*1.25;
```

The change: `5.0` → `6`

**Answer →** 

### 2. `src/lib/onice.js` line 54

```js
 * @param game  the extract
 * @param ev    the EVENT, not a second — the interval convention depends on
 *              whether this second is a boundary, so the caller cannot be
 *              trusted to have chosen one. Accepts `{s, type}`.
 */
export function onIce(game, ev) {
// ─── the line as written ───
  const sec = ev && typeof ev === 'object' ? ev.s : ev;
// ─── the line as changed ───
  const sec = ev || typeof ev === 'object' ? ev.s : ev;
  /* AT A FACEOFF THE ARRIVING LINE IS THE ONE ON THE ICE. Everywhere else the
     line that is finishing at this second is. */
  const arriving = !!(ev && ev.type === 'faceoff');
  const holds = arriving
```

The change: `&&` → `||`

**Answer →** 

### 3. `src/lib/figures.js` line 164

```js
  g.beginPath(); g.moveTo(u*0.85,-u*5.15); g.lineTo(u*5.75,-u*0.28); g.stroke();
  g.strokeStyle='#c98b45'; g.lineWidth=u*0.40;
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.34); g.stroke();
  _blade(g,u*5.30,-u*0.30,u*7.40,-u*0.04,u,0.98);
  g.lineCap='butt';
 }else{
// ─── the line as written ───
  arm(-u*2.25,-u*6.15, -u*4.05,-u*9.35);
// ─── the line as changed ───
  arm(-u*2.25,-u*6.15, -u*8.1,-u*9.35);
  arm(u*2.25,-u*6.15, u*4.05,-u*9.35);
 }
 g.beginPath(); g.arc(0,-u*7.85,u*1.55,0,7); O(skin,0.46);
 g.beginPath(); g.arc(0,-u*7.95,u*1.63,Math.PI,0); g.closePath(); O(jersey,0.46);
```

The change: `4.05` → `8.1`

**Answer →** 

### 4. `src/app.js` line 3707

```js
    score is; `evenOnly:false` is stated for the same reason it is stated above.
    Same origin both ways -- the target is named rather than '*', and the parent
    checks the origin it came from. */
 if(window.parent!==window){
  const fin=corsi.reduce(G.events,{...CTX,evenOnly:false});
  window.parent.postMessage({rtg:'attempts',game:(G.game&&G.game.id)||0,
// ─── the line as written ───
   a:fin.t[AID]||0,h:fin.t[HID]||0},location.origin);}
// ─── the line as changed ───
   a:fin.t[AID]||1,h:fin.t[HID]||0},location.origin);}
 /* ⭐ AND IT BEGINS WHERE THE LAYER FIRST HAS SOMETHING TO SAY.
    Kevin refreshed the front door and the counter sat at 0-0 for the whole loop.
    Measured over 230 games rather than guessed at: the counter is still empty
    after 14 seconds in 6% of games -- but the hero is THE MOST RECENT GAME, and
```

The change: `0` → `1`

**Answer →** 

### 5. `src/lib/census.js` line 512

```js
       differential can be carried by a handful of blowouts. */
    hits: (() => {
      const c = t.hitCorr;
      if (!c || !c.n) return { n: 0, r: null, opposite: null };
      const num = c.n * c.sxy - c.sx * c.sy;
      const den = Math.sqrt(c.n * c.sxx - c.sx * c.sx) * Math.sqrt(c.n * c.syy - c.sy * c.sy);
// ─── the line as written ───
      return { n: c.n, r: den > 0 ? +(num / den).toFixed(3) : null,
// ─── the line as changed ───
      return { n: c.n, r: den >= 0 ? +(num / den).toFixed(3) : null,
               opposite: +(c.opposite / c.n).toFixed(3),
               totalHits: (t.club?.h?.hits || 0) + (t.club?.a?.hits || 0) };
    })(),
  };
```

The change: `>` → `>=`

**Answer →** 

### 6. `src/lib/census.js` line 450

```js
      const KEYS = ['even', 'ppFor', 'ppAgainst', 'lead', 'tied', 'trail',
                    'evenLead', 'evenTied', 'evenTrail'];
      const out = {};
      for (const k of KEYS) {
        const z = t.pace?.[k] || { a: 0, secs: 0 };
        out[k] = { attempts: z.a, minutes: +(z.secs / 60).toFixed(1),
// ─── the line as written ───
                   per60: z.secs > 0 ? +(z.a / (z.secs / 3600)).toFixed(3) : null };
// ─── the line as changed ───
                   per60: z.secs > 1 ? +(z.a / (z.secs / 3600)).toFixed(3) : null };
      }
      /* THE TWO SENTENCES, DERIVED HERE so no surface divides two published
         numbers and gets a third answer. Null when either side is missing —
         never 0, which would publish "no effect" as a finding. */
```

The change: `0` → `1`

**Answer →** 

### 7. `src/app.js` line 2148

```js
   door it had already opened. Asked, never acted on: this only reports whether a
   door is there, because the click handlers have already opened it. */
const doorAt=ev=>{const k=markAt(ev);
 return k!=null&&((hdOn&&isHD(EV[k]))||(EV[k]&&EV[k].clip!=null));};
$('events').addEventListener('dblclick',ev=>{if(doorAt(ev))ev.stopPropagation();});
$('labels').addEventListener('dblclick',ev=>{const b=$('clipbox');
// ─── the line as written ───
 if(b&&!b.hidden)ev.stopPropagation();});
// ─── the line as changed ───
 if(b&&b.hidden)ev.stopPropagation();});
/* ⛔⛔ AND stopPropagation IS NOT ENOUGH, WHICH ONLY LOOKING SHOWED.
   Measured on a 390px touchscreen against the built page: a double tap on a goal
   label left the highlight SHUT and stepped the replay back one play. On a 1400px
   laptop the identical gesture was correct. The cause is not the handler chain --
```

The change: `!` → `(removed)`

**Answer →** 

### 8. `src/app.js` line 3278

```js
      of trimming a constant fixes a variable.
      §27.1 already says where each half belongs: the caption under the selector
      says what the LENS IS, and "a save is against the other club's shot" is a
      property of the lens, true before the puck drops. The box says what is true
      NOW, which is who is in net -- and that is also where relief shows up, in
      the 12.2% of games that use more than two goaltenders. */
// ─── the line as written ───
   n:(sa+sh+fa+fh)?'':'No shot has reached a goaltender yet.'};}
// ─── the line as changed ───
   n:(sa+sh+fa-fh)?'':'No shot has reached a goaltender yet.'};}
 if(id==='whistle'){
  const W=whistle.reduce(sl,CTX), n=W.whistles.length, w=latest(W);
  const nm=w?(WHY[w.rsn]&&WHY[w.rsn].name)||w.rsn:null;
  return {a:'',k:`${n} STOPPAGE${n===1?'':'S'}`,h:'',
```

The change: `+` → `-`

**Answer →** 

### 9. `src/app.js` line 2145

```js
/* ⛔ AND THE SAME DOORS CONSUME A DOUBLE PRESS. The handlers above are on `click`
   only, so without these a double tap that happened to land on a goal would open
   the highlight AND step the replay past it -- the gesture reaching through a
   door it had already opened. Asked, never acted on: this only reports whether a
   door is there, because the click handlers have already opened it. */
const doorAt=ev=>{const k=markAt(ev);
// ─── the line as written ───
 return k!=null&&((hdOn&&isHD(EV[k]))||(EV[k]&&EV[k].clip!=null));};
// ─── the line as changed ───
 return k!=null&&((hdOn||isHD(EV[k]))||(EV[k]&&EV[k].clip!=null));};
$('events').addEventListener('dblclick',ev=>{if(doorAt(ev))ev.stopPropagation();});
$('labels').addEventListener('dblclick',ev=>{const b=$('clipbox');
 if(b&&!b.hidden)ev.stopPropagation();});
/* ⛔⛔ AND stopPropagation IS NOT ENOUGH, WHICH ONLY LOOKING SHOWED.
```

The change: `&&` → `||`

**Answer →** 

### 10. `src/lib/strength.js` line 114

```js
     one. Six codes fail that and are declined rather than narrated.

     THE FAMILY IS STATED HERE; MEMBERSHIP IS THE DECODER'S ANSWER. Typing the
     six out would be the allowlist habit again, and it would rot the moment the
     arrangement rule changed. */
  const odd = 'one skater against none, but not the penalty-shot arrangement — '
// ─── the line as written ───
            + 'a shooter has no goalie behind them and the defender has one';
// ─── the line as changed ───
            - 'a shooter has no goalie behind them and the defender has one';
  for (const [a, h] of [[1, 0], [0, 1]])
    for (const ag of [0, 1]) for (const hg of [0, 1]) {
      const c = `${ag}${a}${h}${hg}`;
      if (!situation(c, ctx)) out[c] = odd;
```

The change: `+` → `-`

**Answer →** 

### 11. `src/lib/daily.js` line 144

```js
       rather than throwing — so an unparseable instant would reach the front
       door as a sentence, not as an error. A value this module will not vouch
       for is not handed on. */
    .filter(g => g && typeof g.startTimeUTC === 'string' && g.startTimeUTC > now
      && Number.isFinite(Date.parse(g.startTimeUTC)))
    .sort((a, b) => (a.startTimeUTC === b.startTimeUTC
// ─── the line as written ───
      ? (a.id || 0) - (b.id || 0)
// ─── the line as changed ───
      ? (a.id || 0) + (b.id || 0)
      : (a.startTimeUTC < b.startTimeUTC ? -1 : 1)));
  return rows.length ? rows[0] : null;
}

```

The change: `-` → `+`

**Answer →** 

### 12. `src/lib/census.js` line 392

```js
         The defending club's attempts are attempts at the OTHER end — they are
         what getting the puck out and back up the ice looks like. So the pair
         says how strongly play tends to stay where the whistle put it, which is
         the reason a line worth holding is worth holding. */
      atkPerDraw: ezN > 0 ? +(ezAtk / ezN).toFixed(3) : null,
      defPerDraw: ezN > 0 ? +(ezDef / ezN).toFixed(3) : null,
// ─── the line as written ───
      zoneLift: ezDef > 0 ? +(ezAtk / ezDef).toFixed(3) : null,
// ─── the line as changed ───
      zoneLift: ezDef >= 0 ? +(ezAtk / ezDef).toFixed(3) : null,
      zoneWorth: lostPer == null ? null : +lostPer.toFixed(3),
      winningWorth: (wonPer == null || lostPer == null) ? null : +(wonPer - lostPer).toFixed(3),
      lift: (wonPer == null || lostPer == null || lostPer === 0) ? null
            : +((wonPer - lostPer) / lostPer).toFixed(3),
```

The change: `>` → `>=`

**Answer →** 

### 13. `src/lib/teams.js` line 200

```js
 *
 * Identity does not depend on this. The abbreviation chip carries the true colour
 * with `inkOn` deciding its ink, so a team whose gold cannot be read as text is
 * still shown IN gold — on a chip, where it has a background to be read against.
 */
export function readableInk(hex, on = '#ffffff') {
// ─── the line as written ───
  return contrast(hex, on) >= 3 ? hex : '#0f1a23';
// ─── the line as changed ───
  return contrast(hex, on) >= 4 ? hex : '#0f1a23';
}

```

The change: `3` → `4`

**Answer →** 

### 14. `src/lib/figures.js` line 123

```js
export function figTabletop(g,px,py,size,jersey,out,o){
 o=o||{}; const t=o.t||0, motion=o.motion!==false, glow=o.glow!==false, light=!!o.light;
 // How large the figure will actually APPEAR, which is not `size` when drawing
 // into a scaled SVG viewBox. Detail is dropped by apparent size, so a 9-unit
 // figure on a rink that renders 4.3px per unit keeps its face.
 // (Not named `px` -- that is already this function's x coordinate.)
// ─── the line as written ───
 const shownAt = o.px == null ? size : o.px;
// ─── the line as changed ───
 const shownAt = o.px != null ? size : o.px;
 const u=size/10, goal=out==='goal', ink='#080b0e', pants='#e7edf2', skin='#f2d3ad';
 g.save(); g.lineJoin='miter'; g.lineCap='butt';
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.42)';
 g.beginPath(); g.ellipse(px,py+u*0.55,u*3.0,u*0.85,0,0,7); g.fill();
```

The change: `==` → `!=`

**Answer →** 

### 15. `src/lib/figures.js` line 143

```js
 if(glow){g.shadowColor=goal?'#ff5566':'#4aa3e0'; g.shadowBlur=goal?u*4.6:u*2.2;}
 g.beginPath(); g.moveTo(-u*1.78,-u*3.2); g.lineTo(u*1.78,-u*3.2);
 g.lineTo(u*2.52,-u*6.55); g.lineTo(-u*2.52,-u*6.55); g.closePath(); O(jersey);
 g.shadowBlur=0;
 g.save(); g.clip();
 g.fillStyle='rgba(255,255,255,.88)';
// ─── the line as written ───
 g.fillRect(-u*3,-u*4.62,u*6,u*0.38); g.fillRect(-u*3,-u*4.02,u*6,u*0.38);
// ─── the line as changed ───
 g.fillRect(+u*3,-u*4.62,u*6,u*0.38); g.fillRect(-u*3,-u*4.02,u*6,u*0.38);
 g.restore();
 g.save(); g.globalAlpha=0.42; g.strokeStyle='#ff4d5e'; g.lineWidth=u*0.26;
 g.beginPath(); g.moveTo(-u*2.02,-u*3.44); g.lineTo(u*1.54,-u*3.44);
 g.lineTo(u*2.28,-u*6.79); g.lineTo(-u*2.76,-u*6.79); g.closePath(); g.stroke(); g.restore();
```

The change: `-` → `+`

**Answer →** 

### 16. `src/app.js` line 1645

```js
   if(workOpen)return;
   playing?stop():play();});
  ice.addEventListener('dblclick',ev=>{
   if(doorOpened){doorOpened=false;return;} // the gesture began on a door -- see doorDidOpen
   if(workOpen)return;
   const r=ice.getBoundingClientRect();
// ─── the line as written ───
   const back=r.width>0&&ev.clientX<r.left+r.width/2;
// ─── the line as changed ───
   const back=r.width>0&&ev.clientX<=r.left+r.width/2;
   stop();set((preI==null?i:preI)+(back?DBL_BACK:DBL_FWD),'jump');});}}
/**
 * ONE PLAY AT A TIME, IN EITHER DIRECTION — the control this transport did not
 * have, and the slider is measurably unable to substitute for.
```

The change: `<` → `<=`

**Answer →** 

### 17. `src/app.js` line 1304

```js
   and set aside at Kevin's call the same day: "let's make a constant update
   rate for the events."
   ⭐ AND CAPTION_BONUS DOES NOT SCALE. It buys reading time for words, and the
   words are the same length at every gear -- 900 ms of extra reading is 900 ms
   of extra reading. Doubling it would be a constant tracking another constant
   for no reason either of them states. */
// ─── the line as written ───
const PACE=[5200,3600,2000];let gear=1;
// ─── the line as changed ───
const PACE=[5201,3600,2000];let gear=1;
const CAPTION_BONUS=900;
let i=EV.length-1,playing=false,timer=null,frameMs=PACE[gear];
$('scrub').max=EV.length-1;
/* THE PLAYHEAD FLOOR IS -1, AND -1 IS A FRAME. Every read of the current event
```

The change: `5200` → `5201`

**Answer →** 

### 18. `src/lib/daily.js` line 110

```js
    if (!Number.isFinite(a.h) || !Number.isFinite(a.a)) continue;
    if (!Number.isFinite(s.h) || !Number.isFinite(s.a)) continue;
    if (a.h === a.a) continue;
    n += 1;
    const leaderScore = a.h > a.a ? s.h : s.a;
    const otherScore = a.h > a.a ? s.a : s.h;
// ─── the line as written ───
    if (leaderScore < otherScore) lost += 1;
// ─── the line as changed ───
    if (leaderScore <= otherScore) lost += 1;
  }
  return { n, lost };
}

```

The change: `<` → `<=`

**Answer →** 

### 19. `src/app.js` line 544

```js
      exactly that reading, so the club that scored is the grammatical subject
      and it is the OTHER team by construction, never `tm`. */
   const done=endedHere(tm,cur);
   const gone=done?(()=>{
     const p=done.player==null?null:R[done.player];
     const who=done.player==null?'Bench':(p?p.nm:'—');
// ─── the line as written ───
     const left=Math.max(0,(done.start+done.min*60)-done.end);
// ─── the line as changed ───
     const left=Math.max(1,(done.start+done.min*60)-done.end);
     return `<span class="pen pout"><span class="pw">${ESC(who)}</span>`
           +`<span class="pf">${ESC(tm===AID?HAB:AAB)} scored — penalty ends</span>`
           +`<span class="pt">${mmss(left)}</span></span>`;})():'';
   el.innerHTML=rows+more+gone;}}
```

The change: `0` → `1`

**Answer →** 

### 20. `src/app.js` line 988

```js
 // slot captions in a walked replay. The rename was verified by grepping for
 // the OLD term, which can prove a word is gone and cannot see that removing it
 // left a sentence saying the same thing in both halves. Found by watching the
 // layer play; the assertion below it is in `render-transport.test.js`.
 // The tag is a fact about the goal, so it sits with the label and not with the
 // scorer: "GOAL · SHORT-HANDED · #16 Name" reads as one sentence about one shot.
// ─── the line as written ───
 const sh=kind==='goal'&&shortHanded(e)?'<span class="shg">short-handed</span>':'';
// ─── the line as changed ───
 const sh=kind!=='goal'&&shortHanded(e)?'<span class="shg">short-handed</span>':'';
 sayCaption(side,ab,label,`${sh} · ${who}`,e);}
/* ⭐ ONE WRITER FOR THE PILL, because there are now two callers and they differ
   in WHOSE club the tag names. Every caption above is about the event's own
   team (`e.own` -- the scorer, the offender, the shooter); a penalty kill is
```

The change: `===` → `!==`

**Answer →** 

### 21. `src/lib/figures.js` line 160

```js
  arm(-u*2.15,-u*5.95, u*1.55,-u*4.65);
  arm(u*2.15,-u*5.95, u*3.35,-u*3.95);
  g.lineCap='round';
  g.strokeStyle=ink; g.lineWidth=u*0.86;
  g.beginPath(); g.moveTo(u*0.85,-u*5.15); g.lineTo(u*5.75,-u*0.28); g.stroke();
  g.strokeStyle='#c98b45'; g.lineWidth=u*0.40;
// ─── the line as written ───
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.34); g.stroke();
// ─── the line as changed ───
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.68); g.stroke();
  _blade(g,u*5.30,-u*0.30,u*7.40,-u*0.04,u,0.98);
  g.lineCap='butt';
 }else{
  arm(-u*2.25,-u*6.15, -u*4.05,-u*9.35);
```

The change: `0.34` → `0.68`

**Answer →** 

### 22. `src/lib/figures.js` line 132

```js
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.42)';
 g.beginPath(); g.ellipse(px,py+u*0.55,u*3.0,u*0.85,0,0,7); g.fill();
 const wob=motion?Math.sin(t*1.25+px*0.03)*0.055:0;
 g.translate(px,py); g.rotate(wob);
 const O=(fill,lw)=>{g.fillStyle=fill;g.fill();g.strokeStyle=ink;g.lineWidth=u*(lw||0.52);g.stroke();};
 g.fillStyle='#22323f'; g.beginPath(); g.ellipse(0,u*0.28,u*2.35,u*0.68,0,0,7); g.fill();
// ─── the line as written ───
 g.fillStyle='#33485c'; g.beginPath(); g.ellipse(0,u*0.06,u*1.95,u*0.52,0,0,7); g.fill();
// ─── the line as changed ───
 g.fillStyle='#33485c'; g.beginPath(); g.ellipse(0,u*0.06,u*1.95,u*0.52,1,0,7); g.fill();
 g.beginPath(); g.moveTo(-u*1.72,u*0.05); g.lineTo(-u*0.38,u*0.05);
 g.lineTo(-u*0.52,-u*3.4); g.lineTo(-u*1.62,-u*3.4); g.closePath(); O(pants);
 g.beginPath(); g.moveTo(u*0.38,u*0.05); g.lineTo(u*1.72,u*0.05);
 g.lineTo(u*1.62,-u*3.4); g.lineTo(u*0.52,-u*3.4); g.closePath(); O(pants);
```

The change: `0` → `1`

**Answer →** 

### 23. `src/lib/layer.js` line 172

```js
 * analysis computation over the ledger's own dimensions, in the binding tier, with
 * no test of its own and its correctness asserted only by the sentence it fed.
 * CHENG: *"the tier boundary being crossed quietly, and the one item that is a
 * genuine move rather than a note."*
 */
export const droppedForStrength = excluded =>
// ─── the line as written ───
  excluded.filter(x => x.dims?.strength && !x.dims.type && !x.dims.play).length;
// ─── the line as changed ───
  excluded.filter(x => x.dims?.strength || !x.dims.type && !x.dims.play).length;

/**
 * Does this result account for every event exactly once?
 *
```

The change: `&&` → `||`

**Answer →** 

### 24. `src/lib/figures.js` line 147

```js
 g.save(); g.clip();
 g.fillStyle='rgba(255,255,255,.88)';
 g.fillRect(-u*3,-u*4.62,u*6,u*0.38); g.fillRect(-u*3,-u*4.02,u*6,u*0.38);
 g.restore();
 g.save(); g.globalAlpha=0.42; g.strokeStyle='#ff4d5e'; g.lineWidth=u*0.26;
 g.beginPath(); g.moveTo(-u*2.02,-u*3.44); g.lineTo(u*1.54,-u*3.44);
// ─── the line as written ───
 g.lineTo(u*2.28,-u*6.79); g.lineTo(-u*2.76,-u*6.79); g.closePath(); g.stroke(); g.restore();
// ─── the line as changed ───
 g.lineTo(u*2.28,+u*6.79); g.lineTo(-u*2.76,-u*6.79); g.closePath(); g.stroke(); g.restore();
 const arm=(x1,y1,x2,y2)=>{
  g.lineCap='round';
  g.strokeStyle=ink; g.lineWidth=u*1.52; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  g.strokeStyle=jersey; g.lineWidth=u*0.92; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
```

The change: `-` → `+`

**Answer →** 

### 25. `src/app.js` line 99

```js
const LINK=parse(location.search),PREVIEW=LINK.preview;
/* A MOMENT NAMES AN EVENT IN THE GAME; THE SCRUBBER INDEXES THE PLAYABLE ONES.
   EV drops 51 of 320 -- stoppages among them -- so the whistle layer's own
   teaching case ("here is an icing, watch this one") names an event that has no
   frame of its own. It is shown in the window of the next playable event, which
   is exactly where `upto()` puts it, so that is where the link lands. */
// ─── the line as written ───
function frameOf(n){for(let k=0;k<EVI.length;k++)if(EVI[k]>=n)return k;return EV.length-1;}
// ─── the line as changed ───
function frameOf(n){for(let k=0;k<EVI.length;k++)if(EVI[k]>=n)return k;return EV.length-0;}
// `SX`/`SY` -- the pure screen transform, and the reasoning for which end the
// host defends -- moved to src/lib/rinkart.js, which is where the rink's paint
// lives now so the learn page's diagrams and the replay cannot draw two
// different rinks. They are in scope here: the bundle concatenates the libs.
```

The change: `1` → `0`

**Answer →** 

### 26. `src/app.js` line 416

```js
 // A team scores INTO the net it is attacking, which is the OTHER team's: a
 // visitor goal lights the HOST's net. Stated by role, so which side of the
 // screen that is stays a rendering question. Restarting the animation needs the
 // class off, a reflow, then on.
 const net=scorer===AID?$('netHome'):$('netAway');
 net.classList.remove('netflash');void net.offsetWidth;net.classList.add('netflash');}
// ─── the line as written ───
let prevA=0,prevH=0;
// ─── the line as changed ───
let prevA=0,prevH=1;
/**
 * WHAT JUST HAPPENED TO THE PLAYHEAD — which is not the same question as
 * "is this the newest event", and the two used to share one boolean.
 *
```

The change: `0` → `1`

**Answer →** 

### 27. `src/lib/figures.js` line 161

```js
  arm(u*2.15,-u*5.95, u*3.35,-u*3.95);
  g.lineCap='round';
  g.strokeStyle=ink; g.lineWidth=u*0.86;
  g.beginPath(); g.moveTo(u*0.85,-u*5.15); g.lineTo(u*5.75,-u*0.28); g.stroke();
  g.strokeStyle='#c98b45'; g.lineWidth=u*0.40;
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.34); g.stroke();
// ─── the line as written ───
  _blade(g,u*5.30,-u*0.30,u*7.40,-u*0.04,u,0.98);
// ─── the line as changed ───
  _blade(g,u*5.30,+u*0.30,u*7.40,-u*0.04,u,0.98);
  g.lineCap='butt';
 }else{
  arm(-u*2.25,-u*6.15, -u*4.05,-u*9.35);
  arm(u*2.25,-u*6.15, u*4.05,-u*9.35);
```

The change: `-` → `+`

**Answer →** 

### 28. `src/lib/figures.js` line 68

```js
 // (Not named `px` -- that is already this function's x coordinate.)
 const shownAt = o.px == null ? size : o.px;
 const u=size/10, goal=out==='goal', ink='#0d141b', skin='#f7dcb4', pants='#1d2a36';
 g.save(); g.lineCap='round'; g.lineJoin='round';
 g.fillStyle=light?'rgba(20,40,60,.20)':'rgba(0,0,0,.40)';
 g.beginPath(); g.ellipse(px,py+u*0.35,u*2.7,u*0.75,0,0,7); g.fill();
// ─── the line as written ───
 const bob=motion?Math.sin(t*1.7+px*0.02)*u*0.30:0;
// ─── the line as changed ───
 const bob=motion?Math.sin(t*3.4+px*0.02)*u*0.30:0;
 g.translate(px,py+bob); g.rotate(goal?-0.03:0.10);
 g.strokeStyle=pants; g.lineWidth=u*1.5;
 g.beginPath(); g.moveTo(-u*1.15,-u*0.3); g.lineTo(-u*1.35,-u*2.8);
 g.moveTo(u*1.15,-u*0.3); g.lineTo(u*1.5,-u*2.8); g.stroke();
```

The change: `1.7` → `3.4`

**Answer →** 

### 29. `src/app.js` line 826

```js
 $('puck').innerHTML=puckMark(cp,moment);
 drawNoPlace(cur);
 drawLabel(cur);
 drawNetmen(cur);
 drawPill(cur);
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
// ─── the line as written ───
 const a=L.t[AID],h=L.t[HID],tot=a+h,pa=tot?Math.round(100*a/tot):0;
// ─── the line as changed ───
 const a=L.t[AID],h=L.t[HID],tot=a+h,pa=tot?Math.round(100*a/tot):1;
 /* ⭐ NO BAR OVER AN EMPTY POPULATION, and this was a real defect on the front
    door. `tot=a+h||1` avoided the division by zero and then DREW THE RESULT
    ANYWAY: at 0-0 it made pa=0, so the whole bar rendered in the home colour and
    the opening faceoff of every game announced that one team had all of the
```

The change: `0` → `1`

**Answer →** 

### 30. `src/lib/figures.js` line 164

```js
  g.beginPath(); g.moveTo(u*0.85,-u*5.15); g.lineTo(u*5.75,-u*0.28); g.stroke();
  g.strokeStyle='#c98b45'; g.lineWidth=u*0.40;
  g.beginPath(); g.moveTo(u*1.00,-u*5.02); g.lineTo(u*5.62,-u*0.34); g.stroke();
  _blade(g,u*5.30,-u*0.30,u*7.40,-u*0.04,u,0.98);
  g.lineCap='butt';
 }else{
// ─── the line as written ───
  arm(-u*2.25,-u*6.15, -u*4.05,-u*9.35);
// ─── the line as changed ───
  arm(-u*4.5,-u*6.15, -u*4.05,-u*9.35);
  arm(u*2.25,-u*6.15, u*4.05,-u*9.35);
 }
 g.beginPath(); g.arc(0,-u*7.85,u*1.55,0,7); O(skin,0.46);
 g.beginPath(); g.arc(0,-u*7.95,u*1.63,Math.PI,0); g.closePath(); O(jersey,0.46);
```

The change: `2.25` → `4.5`

**Answer →** 
