/**
 * EVERY MARK ON THE ICE, AS SVG. The third cluster out of `boot()`, and the one
 * that measured what a declared interface actually costs.
 *
 * ⚠️⚠️ 57 LINES OF CODE, NINETEEN DECLARED INPUTS. The why-popup needed eight for
 * fifty lines and the work panel thirteen for a hundred and fifty; this needs one
 * input per three lines. That is not a failure of the split — it is the honest
 * measurement of how much of the world this code reads. Drawing one mark depends
 * on the event, which club took it, that club's colour, where the rink is facing,
 * whether the slot layer is on, whether the viewer asked for reduced motion, and
 * whether trails are accumulating. All of that was invisible while it sat inside
 * `render`, reaching for whatever it liked.
 *
 * ⭐ GROUPED INTO FOUR, BECAUSE NINETEEN LOOSE ARGUMENTS IS A LIST AND FOUR NAMED
 * GROUPS IS A SHAPE — and the grouping says something true: what is being drawn
 * (`frame`), what the page is showing (`view`), what is fixed about the game
 * (`game`), and the three functions this cannot compute for itself (`helpers`).
 *
 * ⭐ `helpers.place` RETURNS SCREEN COORDINATES, WHICH IS ALLOWED HERE AND WOULD
 * NOT BE IN A REDUCER. CHENG's ruling is that no module that COUNTS may resolve
 * the screen transform; this module counts nothing. It is presentation — the same
 * tier as `rinkart.js`, which produces markup and touches no document.
 *
 * ⛔ THE TEMPLATE LITERALS ARE COPIED BYTE FOR BYTE. `test/fixtures/dom-golden.json`
 * pins `#events` across the base walk, the slot layer, `trails=all` and
 * `ends=fixed` — 1,076 renderings of this loop.
 */
import { ATTEMPT_TYPES } from './attribution.js';
import { NET_X } from './rink.js';
import { SvgPen } from './svgpen.js';
import { FIG } from './figures.js';

const ATT = ATTEMPT_TYPES;

const ARRIVE={goal:'flare',hit:'jolt','blocked-shot':'halt',
              giveaway:'slip',takeaway:'snatch'};
const UNIT_PX=4.3;
const figStyle='mascot';

/**
 *   frame    {evs, i, cur, moment} — the events so far, the playhead, the event
 *            at it, and whether this render is a play/jump rather than a scrub
 *   view     {hdOn, trails, asPlayed, reduced, t} — what the page is showing
 *   game     {AID, HID, R, AWAYCOL, HOMECOL, ATT: attempts, FIG_SZ, FIG_BIG}
 *   helpers  {place, tk, isHD} — screen position, club key, and the slot rule,
 *            all three shared with other callers and so passed rather than moved
 */
export function eventMarks({ evs, i, cur, moment },
                           { hdOn, trails, asPlayed: ASPLAYED, reduced: REDUCED, t: T },
                           { AID, HID, R, AWAYCOL, HOMECOL, FIG_SZ, FIG_BIG },
                           { place, tk, isHD }) {
 const parts=[];
 for(let k=0;k<evs.length;k++){const e=evs[k];const pos=place(e);if(!pos)continue;
   if(trails==='off'&&k!==i)continue;
   /* ⭐ THE TRAIL ENDS WITH THE PERIOD, BUT ONLY WHEN THE ENDS DO (§5).
      A mark says "this team attempted from here". Accumulated on a rink that
      turns over, one team's attempts pile up at BOTH ends and the picture stops
      being a shot chart -- it becomes a map of the building with the team
      attribution scattered across it. §5 answered this before the flip existed:
      scope to the period, because the frame ended.
      NOT IN THE CONTROL. One-direction never changed frames, so the whole-game
      map is exactly what it claims to be -- and CHENG's condition 2 keeps that
      picture precisely because the Control layer has no other one.
      THE WHISTLE LAYER IS DELIBERATELY EXEMPT. Its marks carry no team and no
      direction: "play restarted at this dot" is a fact about a place, and
      `marks()` already keys on the arena position, so accumulating across
      periods counts one physical dot correctly. Only direction-dependent,
      team-attributed marks lose their meaning at a period change. */
   if(ASPLAYED&&trails==='all'&&cur&&e.per!==cur.per)continue;
   const hd=hdOn&&isHD(e);
   // A BLOCKED SHOT IS AN ATTEMPT, ANNOTATED, and the annotation is a separate
   // ring rather than the mark's own stroke. THE STROKE NOW CARRIES TEAM
   // IDENTITY: drawn the old way a visitor's blocked shot is a white dot with an
   // orange ring and no team colour anywhere on it, which on the ice reads as a
   // third club. Seen in a real game (SJS at CHI) and invisible to every test
   // here, because none of them can see a pixel.
   let cls=e.type==='goal'?'goal':ATT.has(e.type)?'att':'excl';
   if(e.type==='blocked-shot')cls+=' blkd';   // so the layer can dim what was NOT blocked
   // AND THE CURRENT PLAY IS NEVER DIMMED BY A LAYER. With trails on
   // "Current moment" -- the default -- the only mark on the ice IS the
   // current one, so a layer that dims everything it does not count leaves
   // the play a viewer is watching at 20% and the rink otherwise empty.
   // Found by rendering it, not by reading it: the node suite has no CSS.
   if(k===i)cls+=' cur';
   if(hd)cls+=' clickable';
   const r=e.type==='goal'?3.2:hd?2.2:ATT.has(e.type)?1.7:1;
   /* ⭐ THE MOMENT OF ARRIVAL, AND IT IS THE EVENT'S OWN.
      Until now every play arrived identically -- one `pop`, 0.34s, one easing --
      with a single exception, the goal, which got a flare. A hit, a giveaway, a
      takeaway and a blocked shot all simply APPEARED, and those four things feel
      nothing alike in a building. The goal treatment proved the idea and was
      never generalised.
      IT INVENTS NOTHING. The event TYPE is recorded, on every play, by the
      league; this renders a fact we already hold with the weight it actually
      carries. That is the opposite standing to anything drawn in the interval
      BETWEEN two events, where the honest answer is that we do not know.
      AND IT IS THE TEACHING, NOT DECORATION. A novice does not know that a
      takeaway is good and a giveaway is bad. The captions say so to whoever
      reads them; a snatch and a slip say so to everyone. Kevin's own framing --
      "teaching them how to watch the game" -- and the cheapest instance of it on
      the site.
      FIVE, NOT NINE. Everything unlisted keeps `pop`. The point is that the
      distinct things are distinct, and a rink where every mark has its own
      flourish is a rink where none of them mean anything. */
   const anim=(k===i&&moment)?' '+(ARRIVE[e.type]||'pop'):'';
   if(hd&&k===i&&moment)parts.push(`<circle class="hdring" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="4.5"/>`);
   const cx=pos.x, cy=pos.y, title=`<title>${e.rem} ${e.type}</title>`;
   // Annotations ride OUTSIDE the mark, so the mark keeps saying whose it is.
   // `data-i` on the ring as well as the mark: it says WHICH event this annotates,
   // so the pairing is in the DOM rather than inferred from two identical
   // coordinates -- and the current attempt is drawn as a figure, which has no
   // coordinates to infer from.
   if(e.type==='blocked-shot')parts.push(`<circle class="ring blk" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r+1).toFixed(1)}"/>`);
   if(hd&&e.type!=='goal')parts.push(`<circle class="ring hd" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r+2).toFixed(1)}"/>`);
   // WHOSE POSITION IS THIS? On every event but one the answer is the same team
   // that gets the count, so the question never came up. A BLOCKED SHOT SPLITS
   // THEM: the attempt is the shooter's and the COORDINATE IS THE BLOCKER'S --
   // measured across 39 archive games, a median 25.0 ft from the attacked net
   // against 34.3 for a shot on goal, because it is where the defender was
   // standing, not where the puck was shot from.
   //
   // Kevin found it on the ice: "text says CAR, visual shows Vegas." The label
   // names the blocker (his earlier call, and right) while the figure was drawn
   // in the SHOOTER's colours -- so a VGK player stood on a CAR defender's
   // skates, nine feet closer to the net than VGK actually shot from. The figure
   // is the one mark on this rink that depicts a PERSON, which is exactly the
   // claim Doctrine 5 governs, and the module's own comment already said a
   // figure means "someone was here".
   //
   // The dot keeps the shooter's colour deliberately. A dot marks an EVENT and
   // carries the attempt where Control counts it; a figure marks a PERSON and
   // has to stand in the right place. That is the distinction, and it is why
   // only one of the two moved.
   const bt=(e.type==='blocked-shot'&&e.blk!=null&&R[e.blk])?R[e.blk].tid:null;
   const ft=e.type!=='blocked-shot'?tk(e):(bt===AID?'a':bt===HID?'h':null);
   // NO BLOCKER RECORDED, NO FIGURE. Four blocked shots in 30,550 carry no
   // blocking player, and for those we cannot say whose position the coordinate
   // is -- so it stays a dot rather than becoming a guess with a face on it.
   if(ATT.has(e.type)&&k===i&&ft!==null){
     // Only the CURRENT attempt is a player. Once the shot has happened its
     // location goes back to being a dot, so the eye is drawn to what is
     // happening now rather than to a crowd of past figures — and one figure
     // per frame instead of 135 is roughly an eighth of the markup.
     //
     // Its feet stand on the real shot coordinate and its pose is the real
     // outcome: arms up for a goal, shooting otherwise. Non-attempts are never
     // figures, because a figure means "someone shot from here" and drawing one
     // for a faceoff would be a claim we cannot make (Doctrine §5).
     const pen=new SvgPen('cur');
     FIG[figStyle](pen,cx,cy,e.type==='goal'?FIG_BIG:FIG_SZ,ft==='a'?AWAYCOL:HOMECOL,
                   e.type==='goal'?'goal':'save',
                   {t:T,motion:!REDUCED,glow:false,px:(e.type==='goal'?FIG_BIG:FIG_SZ)*UNIT_PX});
     parts.push(pen.toSvg(`class="ev fig ${cls} ${ft}${anim}" data-i="${k}"`).replace('</g>',title+'</g>'));
   } else {
     parts.push(`<circle class="ev ${cls} ${tk(e)}${anim}" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}">${title}</circle>`);
     // A GOAL IS A BULLSEYE, not a slightly larger dot. Under the sweater
     // convention a visitor's goal and a visitor's attempt were both hollow
     // rings separated only by radius -- and the goal is the one mark on this
     // rink that must never be mistaken for anything else.
     if(e.type==='goal')parts.push(`<circle class="core ${tk(e)}" data-i="${k}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.15"/>`);
   }}
 return parts.join('');
}

/**
 * The line from a shot to the net it was aimed at, or ''.
 *
 * ⭐ ONLY FOR A SHOT THAT ARRIVED. A missed shot has no line, because the point
 * of the line is the path to the target and a miss did not take it; a blocked
 * shot has none either, since it stopped where its ring is drawn.
 *
 * ⚠️ `AX` ARRIVES AS AN ARGUMENT, AND THE FIRST VERSION OF THIS PARAGRAPH BLAMED
 * THE WRONG THING. It said the transform could not be imported because
 * `test/sx-scope.test.js` forbids `src/lib` from importing `rinkart.js`. That
 * check was over-broad and has since been narrowed — and narrowing it changed
 * nothing here, because **`AX` is not in `rinkart.js` and never was.** `SX` is
 * the pure screen transform; `AX` is `SX` composed with `DIR(per)`, which closes
 * over the game's `sides` and over whether the link asked for as-played ends.
 * That is page state, so it has no module to live in and passing it is the only
 * honest way in — dependency injection, not a workaround for a check.
 *
 * ⭐ The mistake is worth leaving on the record: a constraint was attributed to
 * the nearest rule that could plausibly have caused it, and the attribution went
 * unchecked for a day. See `docs/step2-decomposition.md` §0.5.
 */
export function shotLine(cur, cp, HID, AX) {
 if(!cp||!(cur.type==='shot-on-goal'||cur.type==='goal'))return '';
 const netx=(cur.own===HID)?NET_X:-NET_X;
 return `<line class="shotline" x1="${cp.x.toFixed(1)}" y1="${cp.y.toFixed(1)}" x2="${AX(netx,cur.per)}" y2="42.5"/>`;
}

/**
 * The puck at the current event, or '' where the event has no place.
 *
 * ⚠️ IT GOES WITH THE MARKS BECAUSE IT WAS THE THIRD SITE READING `e.x` DIRECTLY,
 * and a shootout attempt moved the puck to a place it had not been. `cp` comes
 * from the same `place()` every mark uses, which is what keeps them agreeing.
 */
export function puckMark(cp, moment) {
 return cp?`<circle class="puck${moment?' jump':''}" cx="${cp.x.toFixed(1)}" cy="${cp.y.toFixed(1)}" r="1.5"/>`:'';
}
