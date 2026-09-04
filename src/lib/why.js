/**
 * THE WHY-POPUP'S MARKUP — the first cluster out of `boot()`, and it returns a
 * string rather than touching the document.
 *
 * ⭐ THAT SPLIT IS CHENG'S RULING AND IT IS THE WHOLE DESIGN. The tiers here are
 * not *pure* and *impure*: `src/lib` is analysis, `rinkart.js` produces markup
 * and touches nothing, and `app.js` reads and writes the live document. The
 * middle one was already there and unnamed. So the boundary is **`return markup`
 * versus `write to document`** — this file computes and composes, `showWhy` in
 * `app.js` performs the one `innerHTML` assignment, and the purity `tools/tiers.mjs`
 * verifies over this directory holds without an exception being carved for it.
 *
 * ⚠️ WHAT THIS MOVE IS AND IS NOT. It established the mechanism — extraction,
 * the golden DOM walk, the build — and it proves nothing about the risk, because
 * this cluster was chosen for being safe. The dangerous ones are still inside
 * `boot`. A green first cluster is not evidence that the approach is safe.
 *
 * ⛔ THE TEMPLATE LITERALS ARE COPIED BYTE FOR BYTE, INDENTATION INCLUDED. Their
 * continuation lines carry leading spaces that are part of the emitted string,
 * so re-indenting this file to taste would change what the page renders.
 * `test/fixtures/dom-golden.json` pins the result at all 44 slot shots.
 */
import { NET_X, SLOT_HALF_WIDTH, HIGH_DANGER_FT, distanceToNet } from './rink.js';

/**
 * The popup for one shot, as markup.
 *
 * `ctx` is written out rather than handed the whole of `boot`: naming the seven
 * things this needs is the point of the move, and it is the first statement any
 * part of that file has made about its own inputs.
 *
 *   dir      which way the shooting team attacks, +1 or -1
 *   AID      the away team's id, which decides the two-tone header
 *   AAB HAB  the two abbreviations
 *   AWAYCOL HOMECOL  the club colours
 *   R        the roster, for the shooter's number and name
 */
export function whyMarkup(e, { dir, AID, AAB, HAB, AWAYCOL, HOMECOL, R }) {
 /* The popup's own mini-rink, which is NOT the replay's transform: it folds both
    ends onto one (`Math.abs`) so a shot is always drawn attacking rightwards,
    into a 100x85 box rather than the 200x85 sheet. `SX`/`SY` would be wrong here
    and reaching for them is what CHENG's scope ruling exists to prevent. */
 const HX=x=>11+Math.abs(x), HY=y=>42.5-y;
 const _d=dir||1, dLine=NET_X-e.x*_d, dist=distanceToNet(e.x,e.y,_d), angle=Math.atan2(Math.abs(e.y),dLine)*180/Math.PI;
 const inSlot=Math.abs(e.y)<=SLOT_HALF_WIDTH, inFront=e.x*_d<=NET_X;
 const tid=e.own, ab=tid===AID?AAB:HAB, col=tid===AID?AWAYCOL:HOMECOL, p=R[e.actor], isGoal=e.type==='goal';
 const diag=`<svg viewBox="0 0 100 85"><rect x="1" y="1" width="98" height="83" rx="14" fill="#fff" stroke="var(--edge)"/>
   <polygon points="63,20.5 96,38 96,47 63,64.5" fill="var(--hd)" opacity=".3"/><text x="70" y="43.5" font-size="3.4" fill="#b07d17" text-anchor="middle">slot</text>
   <rect x="90" y="37" width="6" height="11" rx="1.5" fill="${col}" opacity=".55"/><line x1="96" y1="29" x2="96" y2="56" stroke="var(--red)" stroke-width="1" opacity=".7"/>
   <line x1="36" y1="1" x2="36" y2="84" stroke="var(--blue)" stroke-width=".8" opacity=".35"/>
   <line x1="${HX(e.x).toFixed(1)}" y1="${HY(e.y).toFixed(1)}" x2="95" y2="42.5" stroke="var(--ink)" stroke-dasharray="2 1.5" stroke-width=".7"/>
   <circle cx="${HX(e.x).toFixed(1)}" cy="${HY(e.y).toFixed(1)}" r="2.8" fill="${col}" stroke="#fff" stroke-width=".7"/>
   <text x="${Math.min(HX(e.x)+4,78).toFixed(1)}" y="${(HY(e.y)-2.5).toFixed(1)}" font-size="4.2" fill="var(--ink)" font-weight="700">${Math.round(dist)} ft</text></svg>`;
 return `<div class="whyhd ${tid===AID?'a':'h'}"><div><div class="t">${isGoal?'🚨 A GOAL from the slot':'⚡ Why this counts as a slot shot'}</div>
   <div class="s">${p?'#'+p.n+' '+p.nm:ab} · ${ab} · P${e.per} ${e.rem} · ${e.type.replace(/-/g,' ')}</div></div><button class="whyclose" onclick="hideWhy()">✕</button></div>
  <div class="whybody"><div class="whydiag">${diag}</div>
   <div class="factor"><span class="fv">${Math.round(dist)} ft</span><span class="fl">Distance to the net — <b>close</b>. Our rule: ≤ ${HIGH_DANGER_FT} ft. <span class="chk">✓</span></span></div>
   <div class="factor"><span class="fv">${Math.round(angle)}°</span><span class="fl">Angle off straight-on — ${angle<22?'<b>a clean look</b> at the net':'a slot-area angle'}. Lower = more net to shoot at.</span></div>
   <div class="factor"><span class="fv">${inSlot?'Slot':'Wide'}</span><span class="fl">Lateral position — ${inSlot?'<b>in the slot</b> (within the faceoff dots) <span class="chk">✓</span>':'outside the slot'}</span></div>
   <div class="factor last"><span class="fv">${inFront?'Front':'Behind'}</span><span class="fl">Side of the goal line — ${inFront?'<b>in front of the net</b> <span class="chk">✓</span>':'behind the net'}. A wrap-around is close, but it is not from the slot.</span></div>
   <div class="whyrule"><b>The rule, and you can check it:</b> a shot counts as <b>from the slot</b> when <b>all three</b> are true — it is <b>≤ ${HIGH_DANGER_FT} ft from the net</b>, <b>within ±${SLOT_HALF_WIDTH} ft of the middle</b>, and <b>in front of the goal line</b> (a wrap-around from behind the net is close, but it is not from the slot). All three true here. This is <b>our own geometric rule</b>, not a model and not anybody else's statistic — it says where the shot came from, and nothing about how likely it was to go in. Measure it yourself on the diagram.</div></div>`;
}
