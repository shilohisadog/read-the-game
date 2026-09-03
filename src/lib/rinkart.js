/**
 * The rink itself — the paint, with no game on it.
 *
 * WHY THIS IS A MODULE NOW. Every mark this project draws is a claim about a
 * game that happened, and the learn page needs the opposite: a DIAGRAM of a
 * rule, on ice nobody played on. Kevin: *"the learning cards don't have to be
 * specific replay events… we have some discretion in what we overlay onto the
 * ice for explanatory purposes"* — and then the constraint that makes it safe,
 * *"it's the same ice rink, but the graphics are noticeably and obviously
 * different between the learning cards and the game pages."*
 *
 * SAME ICE MEANS ONE IMPLEMENTATION OF THE ICE. A second rink drawn for the
 * diagrams would be a rule stated twice, and the day the two disagreed the
 * diagram would be teaching a rink the replay does not have — which is the
 * exact failure the transfer depends on not happening.
 *
 * ⭐ IT SPLITS WHERE app.js ALREADY SAID IT SHOULD. The slot comment below has
 * argued for a year that this is *"arena-frame furniture that never asks which
 * way anyone is attacking"*: the boards, the tints, the five lines, the nine
 * spots and the centre circle carry no game in them at all. Only the NETS need
 * a period and two club colours, so they are a separate call and the caller
 * supplies both. `drawRink` in app.js is what is left — three lines.
 *
 * THE EXTRACTION IS GUARDED BY BYTES, NOT BY READING. `test/rink-lines.test.js`
 * parses the markup the renderer actually produced, and `test/rinkart.test.js`
 * pins the whole string against a capture taken before the move: if one
 * character of the game's rink changed, both go red.
 */
import { NET_X, BLUE_LINE_X, ZONE_BAND_FT, NEUTRAL_DOT_X,
         SLOT_HALF_WIDTH, HIGH_DANGER_FT } from './rink.js';

// THE HOST DEFENDS THE RIGHT-HAND END, which is the arrangement a television
// viewer expects (Kevin) -- and it is ours to choose, because the feed does not
// have one: across 14 raw play-by-plays `homeTeamDefendingSide` in period one
// splits 7 left, 7 right. It is fixed to the arena, not to the league.
//
// It also removes a real confusion. The scoreboard reads away-then-host, so the
// host's badge sits on the RIGHT; with the host defending the left end, the same
// three letters appeared on opposite sides of one screen. Kevin read the pair as
// swapped and CHENG independently found the cause -- the rink and the scoreboard
// speaking one visual language with two meanings. Now they agree.
//
// A DISPLAY TRANSFORM AND NOTHING MORE. The extract keeps the host on -x, every
// reducer keeps reading it that way, and `distanceToNet` still measures to the
// net a team attacks. Only the mapping from rink feet to screen units is
// reflected, in this one line.
/**
 * ⭐⭐ THE SCREEN TRANSFORM, AND THE RULE ABOUT WHO MAY RESOLVE IT.
 *
 * CHENG, ruling on as-played ends and RESTATED 2026-09-03 in the terms that are
 * actually true:
 *
 *   > `SX` and `SY` must not be resolvable from any reducer's scope AT RUNTIME.
 *   > Today that holds because `rinkart` is emitted inside `boot`. Any build
 *   > change that moves it to top level breaks the guarantee, and the probe is
 *   > what says so.
 *
 * ⚠️ THE ORIGINAL WORDING DEPENDED ON A SCOPE MODEL THAT WAS WRONG. It said
 * "lexically unreachable from library scope, not merely unused, BECAUSE THE
 * MODULES SHARE ONE INLINED SCOPE" — and `test/render-ends.test.js` audited that
 * premise and found it half wrong: the modules share one SCRIPT, not one SCOPE.
 * `__LIB__` is emitted above `function boot(G,RATES){` and this file is injected
 * INSIDE boot's body, which a top-level declaration can never see into. The
 * guarantee was real; the reason given for it was not.
 *
 * WHY IT MATTERS: a reducer that reads screen coordinates is a reducer whose
 * counts move when the rink flips, which is the one thing as-played must not be
 * able to do.
 *
 * ⭐ TWO CHECKS, ONE PROPERTY, AND THE RUNTIME ONE IS THE AUTHORITY.
 *   `test/render-ends.test.js`  a probe in library position must THROW, and the
 *                               same probe inside boot must RESOLVE — the second
 *                               half is what stops "it threw" being satisfied by
 *                               a probe that was simply broken.
 *   `test/sx-scope.test.js`     no module under `src/lib/` imports this file.
 *                               A leading indicator: a static import is the
 *                               MECHANISM by which the runtime property would
 *                               break, so catching it earlier is cheaper.
 *
 * ⛔ AND THE TRANSFORM IS NOT ENCAPSULATED, WHICH WAS CONSIDERED AND MEASURED.
 * The obvious alternative — export only drawing functions and keep `SX` private
 * — would make the rule structural instead of positional. It fails on the data:
 * `builders/learn-figures.mjs` calls `SX`/`SY` **24 times** directly to place
 * blue lines, faceoff dots, glyph anchors and viewBox bounds, and
 * `test/learn-figures.test.js` uses `SX` to derive its expected blue-line
 * positions by a path independent of the code under test. Hiding the transform
 * would require replacing 24 call sites with bespoke helpers and would turn that
 * test into a mirror of the function it checks.
 */
export const SX=x=>100-x, SY=y=>42.5-y;

/* ⭐ THE BOARDS, AS NUMBERS RATHER THAN AS A STRING. Every line painted on the
   ice has to STOP at them, and until now each line carried its own hand-typed
   pair of y values -- so the goal lines ran y=3..82 while the boards at that x
   are at y=7.02..77.98, and the red line stuck four feet out through the
   corner at both ends. Kevin: "the goal lines extend beyond the playing
   surface, can you have those terminate right at the edge of the rink."
   The rink is a rounded rect, so how far a line reaches DEPENDS ON WHERE IT IS:
   in the straight section it runs the full height, and inside a corner it stops
   on the arc. `boardsY` is that one rule, and the boards rect below is drawn
   from the same four numbers, so the paint and the outline cannot disagree. */
export const BOARD={x:1,y:1,w:198,h:83,r:27};
/**
 * Where the boards are at an SVG x — the top and bottom of the playing surface
 * at that point. Straight section: the full height. Inside a corner: on the arc.
 */
export function boardsY(sx){
 const L=BOARD.x,R=BOARD.x+BOARD.w,T=BOARD.y,B=BOARD.y+BOARD.h,r=BOARD.r;
 const cx=sx<L+r?L+r:sx>R-r?R-r:null;
 if(cx===null)return[T,B];
 const dy=Math.sqrt(Math.max(0,r*r-(sx-cx)*(sx-cx)));
 return[T+r-dy,B-r+dy];
}

/**
 * Every fixed thing painted on an NHL sheet, as one SVG string.
 *
 * No period, no teams, no game — see the header. The caller appends the nets.
 *
 * ⭐ `id` NAMESPACES THE CLIP PATHS, and it is not decoration. The slot tint is
 * three `<clipPath>`s the paint refers to by id; one rink to a document, that is
 * fine. The learn page puts FIVE rule diagrams on one page, and five
 * `id="slotband"` would make every figure after the first resolve its clip to
 * the FIRST figure's — which does not error, does not warn, and quietly draws
 * the wrong shape. The default is empty so the game page's bytes do not move.
 */
/* ⭐ AND `tints` IS A DOCTRINE SWITCH, NOT A STYLE ONE.
   The slot lozenge and the blue-line bands are OUR MEASUREMENTS drawn as
   furniture -- a geometric rule of ours in the first case, an aesthetic argument
   about where the game is contested in the second. On the game ice that is
   honest: the page is ours and it says so. Inside a RULE diagram it is not, and
   looking at the first one made it obvious -- the learn page deliberately keeps
   the league's rules apart from what we count, so that our measurements cannot
   borrow the rulebook's authority, and a slot tint glowing inside the offside
   figure walks straight through that wall. The paint a diagram inherits is the
   paint the LEAGUE puts on the ice: boards, five lines, nine spots. */
export function furniture(id='',tints=true){
 /* `tints` is THREE-VALUED, and the third value exists because the slot figure
    needed one of ours and not the other. `true` draws both; `'slot'` draws the
    lozenge alone -- a diagram OF the slot rule should not also carry our
    blue-line shading, which is a different claim about a different part of the
    ice; anything falsy draws neither, which is what a league-rules figure gets. */
 const bands=tints===true;const P=[];P.push(`<rect class="boards" x="${BOARD.x}" y="${BOARD.y}" width="${BOARD.w}" height="${BOARD.h}" rx="${BOARD.r}"/>`);
 if(tints){
 /* ⭐ THE SLOT IS PAINTED ON THE ICE, BEFORE ANYTHING HAPPENS.
    Kevin: "we can measure, but we're not prioritizing the teaching... if we have
    areas that are similarly shaded, the viewer's eyes will start focusing on
    those areas during game play." A novice does not know the slot is where
    danger lives, and until now the site only said so at the moment a shot
    happened to land there -- which is after the point at which knowing it would
    have helped. Furniture teaches it before the puck moves.
    IT IS THE RULE, DRAWN, NOT A SHAPE THAT LOOKS LIKE IT. `HIGH_DANGER_FT` and
    `SLOT_HALF_WIDTH` are the same two constants `isHighDanger()` tests, so a
    viewer who wonders why a mark counted can look at where it sits. Drawing a
    prettier region than the rule would break the one promise Doctrine 7 makes:
    a geometric rule you can check with a ruler.
    INCLUDING THE ICE BEHIND THE NET, which looks odd and is correct. The rule
    is a radius, and it does not stop at the goal line -- a wrap-around from
    three feet out passes it. A tint that quietly excluded that would disagree
    with the layer at exactly the events people argue about.
    BOTH ENDS, AND THEREFORE NO FRAME AT ALL. The slot is symmetric about centre
    ice, so this is arena-frame furniture that never asks which way anyone is
    attacking -- it is untouched by the ends-switching machinery, which is the
    most expensive thing in this file to be near.
    NESTED CLIPS INTERSECT; a clipPath with two shapes would UNION them. One
    band for `|y| <= SLOT_HALF_WIDTH`, then a half-plane per end for the clause
    that says in front of the goal line. No boards clip is needed any more --
    that existed only to stop the old region spilling out of the rink behind the
    net, which is the ice this rule no longer claims. */
 P.push(`<clipPath id="${id}slotband"><rect x="0" y="${SY(SLOT_HALF_WIDTH)}" width="200" height="${SLOT_HALF_WIDTH*2}"/></clipPath>`
  +`<clipPath id="${id}slotfrontA"><rect x="${SX(NET_X)}" y="0" width="200" height="85"/></clipPath>`
  +`<clipPath id="${id}slotfrontB"><rect x="0" y="0" width="${SX(-NET_X)}" height="85"/></clipPath>`
  +`<g class="slotzone" clip-path="url(#${id}slotband)">`
  +`<g clip-path="url(#${id}slotfrontA)"><circle cx="${SX(NET_X)}" cy="${SY(0)}" r="${HIGH_DANGER_FT}"/></g>`
  +`<g clip-path="url(#${id}slotfrontB)"><circle cx="${SX(-NET_X)}" cy="${SY(0)}" r="${HIGH_DANGER_FT}"/></g>`
  +`</g>`);
 /* ⭐ AND THE BLUE LINES, WHICH ARE A DIFFERENT KIND OF IMPORTANT.
    Kevin: "offense wants to hold play in, defense wants to keep play out, a
    battleground if you will -- that's an aesthetic the casual fan needs to be
    exposed to." He is right, and the measurement that looked like it refuted him
    does not: only 6.2% of located plays fall within five feet of a blue line,
    but holding the line produces NO RECORDABLE EVENT. The feed records where
    countable things happen, not where the puck is contested, so its silence
    there is a property of the recording. (docs/status.md §U, and the same
    caveat that forbids a heat map of the neutral zone.)
    A DIFFERENT SHAPE AND A DIFFERENT COLOUR, ON PURPOSE. The slot is a PLACE --
    a lozenge in front of a net, tinted in the high-danger colour it belongs to.
    A blue line is a THRESHOLD, and the contest runs board to board, so this is a
    full-width strip in the line's OWN blue. Shading them alike would say they
    are the same kind of important, which is the misconception rather than the
    lesson. Each tint borrows the colour of the mark it explains, so the palette
    does not grow.
    ITS WIDTH HAS A SOURCE. `ZONE_BAND_FT` is the gap between the blue line and
    the neutral-zone face-off dot, which the archive measured; the band reaches
    from the line to the dots and you can see that it does. Five feet chosen by
    eye would be a model wearing a UI control.
    NO CLIP NEEDED. At |x| 20-30 the boards are straight -- the corner radius
    only bends the ice within 27 units of a corner -- so a plain rect is exact. */
 if(bands)for(const b of[BLUE_LINE_X,-BLUE_LINE_X])
  // `SX` DECREASES with x, so the band's left edge is the far side of it.
  P.push(`<rect class="zoneband" x="${SX(b+ZONE_BAND_FT)}" y="1" width="${ZONE_BAND_FT*2}" height="83"/>`);
 }
 /* ⭐ EVERY LINE ENDS ON THE BOARDS, and it is the same call for all of them.
    The blue lines and the centre line sit in the straight section, so `boardsY`
    hands back the 1..84 they were previously typed with -- byte-identical
    output, which is the point: the goal lines are not a special case being
    patched, they are the only lines that were ever WRONG under a rule the
    others already satisfied by accident of where they sit. */
 const line=(cls,x)=>{const[y1,y2]=boardsY(x);
  return `<line class="ln ${cls}" x1="${x}" y1="${y1.toFixed(2)}" x2="${x}" y2="${y2.toFixed(2)}"/>`;};
 for(const g of[-89,89])P.push(line('red',SX(g)));
 for(const b of[-25,25])P.push(line('blue',SX(b)));
 P.push(line('red thick',100)+'<circle class="ln blue" cx="100" cy="42.5" r="15"/>');
 // THE NINE FACE-OFF SPOTS, taken from the DATA rather than from the rulebook.
 // Every faceoff in the archive happens at one of nine coordinates: 2,134 draws
 // across 39 games spread over the three seasons land on these nine and on
 // nothing else, and none of them arrives without a coordinate. So this table is
 // a measurement, checkable against the feed, rather than a diagram I remembered.
 //
 //   end zone (+-69,+-22) 68.6%   centre (0,0) 19.5%   neutral (+-20,+-22) 11.9%
 //
 // ONLY FIVE OF THE NINE CARRY A CIRCLE -- the four end-zone spots and centre
 // ice. The neutral-zone spots are bare, which is the rink's own arrangement and
 // not an omission here; drawing circles on them would be tidier and wrong.
 //
 // AND THE SPOTS ARE NOT DECORATION. The whistle layer places every mark at the
 // faceoff that RESTARTS play, and offside restarts on a neutral-zone spot 89.8%
 // of the time -- so the four spots nobody had drawn are the four that layer uses
 // most. A ring on blank ice reads as "something happened at this arbitrary
 // point"; the same ring on a painted spot reads as "play restarted here".
 //
 // NO HASH MARKS. A real end-zone circle has them and nothing available here
 // gives their dimensions, so they stay off rather than being approximated.
 const ENDZONE=[],NEUTRAL=[];
 for(const zx of[-69,69])for(const zy of[-22,22])ENDZONE.push([zx,zy]);
 for(const zx of[-NEUTRAL_DOT_X,NEUTRAL_DOT_X])for(const zy of[-22,22])NEUTRAL.push([zx,zy]);
 for(const[zx,zy]of ENDZONE)P.push(`<circle class="ln red" cx="${SX(zx)}" cy="${SY(zy)}" r="15"/>`);
 // Spots go on LAST so a dot sits on top of its circle. Centre ice is blue and
 // the other eight are red, which is how the paint goes down. All nine are drawn
 // at one size: the eight outer spots are two feet across and this is that, while
 // the centre spot is smaller in a real rink and is drawn to match the rest
 // because at this scale the true size is under a pixel on a phone.
 for(const[zx,zy]of[...ENDZONE,...NEUTRAL])
  P.push(`<circle class="fdot" cx="${SX(zx)}" cy="${SY(zy)}" r="1"/>`);
 P.push('<circle class="fdot ctr" cx="100" cy="42.5" r="1"/>');
 return P.join('');}

 // nets: BUF(home) defends LEFT(-89), MIN(away) defends RIGHT(+89)
 // A NET DRAWN AS EQUIPMENT, not as a chip. It was a rounded rectangle filled
 // with the club colour and captioned in contrasting ink -- which is the
 // scoreboard badge's exact treatment, in mirrored positions, so the same visual
 // language meant "this team" at the top of the page and "this team's net" on the
 // ice with nothing distinguishing the two (CHENG). Kevin read the pair as
 // swapped, and he knows the sport cold.
 //
 // DRAWING IT PROPERLY FOUND A PLAIN ERROR. The old rectangles sat on the ICE
 // side of the goal line -- x = 11..15 at the near end -- and a real net stands
 // ON the line with its body BEHIND it. They were also 11 units across where a
 // net is 6 feet, nearly double. Both are fixed here: 6 wide, 4 deep, behind the
 // line, with the mouth facing centre ice, plus the crease it sits in.
 //
 // The sweater convention carries over: the host's mesh is filled with its
 // colour, the visitor's is white inside its own frame.
export const netGlyph=(id,gx,col)=>{
  // Which way is "behind" is read from where the goal line sits on screen, so a
  // reflection of SX carries the whole net with it and cannot leave one end
  // pointing the wrong way.
  const dir=gx<100?1:-1, back=gx-4*dir, top=42.5-3, bot=42.5+3;
  const body=`M ${gx} ${top} L ${back} ${top+0.8} L ${back} ${bot-0.8} L ${gx} ${bot} Z`;
  // NETTING, NOT A BLOCK. Filled with the club's colour the host's net rendered as
  // a solid slab -- the visitor's, being white inside its own frame, read far
  // better as equipment. So the sweater convention comes OFF the net: both are
  // open, both carry their colour in the frame and the strands, and the goalie
  // standing in front keeps the host-filled / visitor-white distinction where it
  // is doing identity work.
  let strands='';
  for(let k=1;k<=2;k++){const t=k/3, mx=gx+(back-gx)*t;
   strands+=`<line class="strand" x1="${mx.toFixed(1)}" y1="${(top+0.8*t).toFixed(1)}" `
          + `x2="${mx.toFixed(1)}" y2="${(bot-0.8*t).toFixed(1)}" stroke="${col}"/>`;}
  return `<g class="netg">`
   + `<path class="crease" d="M ${gx} ${42.5-6} A 6 6 0 0 ${dir>0?1:0} ${gx} ${42.5+6}"/>`
   + `<path class="mesh" d="${body}" fill="#fff" fill-opacity=".5" stroke="${col}"/>`
   + strands
   + `<line class="post" x1="${gx}" y1="${top}" x2="${gx}" y2="${bot}" stroke="${col}"/>`
   // THE FLASH IS ITS OWN ELEMENT, over the net rather than being it. The old
   // markup put the animation on a hidden duplicate; putting it on the net now
   // that the net is always visible would make the net VANISH and return on
   // every goal, because the keyframes run 0 -> .85 -> 0.
   + `<path id="${id}" class="flashpath" d="${body}" fill="${col}" opacity="0"/>`
   + `</g>`;};

/**
 * A GOALTENDER, DRAWN AS A GOALTENDER.
 *
 * ⭐ MOVED HERE FROM app.js SO THE DIAGRAMS CAN USE THE SAME FIGURE. Kevin, on
 * the empty-net page: *"is there any way to improve the goalie animation? like
 * using the goalie figures themselves, the circles don't look real good."* The
 * learn diagrams were drawing him as a plain outlined circle -- the same token a
 * skater gets -- while the game page had had a real one all along. Two drawings
 * of one thing is the drift `furniture` was extracted to end, and the fix is the
 * same fix: one definition, both surfaces.
 *
 * The game's markup is unchanged to the byte. `cls` defaults to the class app.js
 * has always emitted; a caller that wants its own hook passes one, which the
 * diagrams need because the learn pages already use `.gk` for a text label.
 */
// SIZED AGAINST THE NET, NOT PICKED. The first figure stood 8.1 units tall in
// front of a 6-foot goal mouth -- 135% of the thing it defends -- and it was not
// centred on the mouth either (figure centre 41.8, mouth centre 42.5), so it read
// large AND high. Kevin saw it in one look; nothing in a 317-test suite could.
//
// There is no measurement anywhere in the feed that sets the size of a glyph, and
// a number we simply chose is the shape CHENG calls a model wearing a UI control.
// What IS available is a RELATIONSHIP that can be checked: a goaltender defending
// a net has to fit inside it. So ONE constant drives every dimension below, and
// the test pins the relationship -- figure inside the mouth, centred on it,
// measured from the rendered markup against the rendered post -- rather than
// pinning these digits, which would only re-state what the code already says.
export const GK_H=4.6;                                    // full height, inside the 6ft mouth
export const goalieGlyph=(gx,col,fill,cls='gk')=>{
 const dir=gx<100?1:-1, x=gx+2.2*dir;
 const top=42.5-GK_H/2, bot=42.5+GK_H/2;           // CENTRED on the mouth
 const hr=GK_H*0.163, hcy=top+hr;                  // head
 const by=hcy+hr*0.6, bw=GK_H*0.5;                 // body, tucked just under it
 const n=v=>v.toFixed(2);
 return `<g class="${cls}">`
  + `<rect class="gkbody" x="${n(x-bw/2)}" y="${n(by)}" width="${n(bw)}" `
  + `height="${n(bot-by)}" rx="${n(bw*0.37)}" fill="${fill}" stroke="${col}"/>`
  + `<circle class="gkhead" cx="${n(x)}" cy="${n(hcy)}" r="${n(hr)}" fill="${fill}" stroke="${col}"/>`
  // The stick reaches out to the side and STOPS AT THE POST -- it is the one part
  // of a goaltender that genuinely extends across the mouth, so it is allowed the
  // full half-width and no more.
  + `<line class="gkstick" x1="${n(x+bw/2*dir)}" y1="${n(bot-0.5)}" `
  + `x2="${n(x+(bw/2+1.5)*dir)}" y2="${n(bot)}" stroke="${col}"/>`
  + `</g>`;};

/**
 * A SKATER — the goaltender's sibling, and the only other person on this rink.
 *
 * ⭐ IT DID NOT EXIST, AND THE THING THAT LOOKED LIKE IT WOULD HAVE LIED. Kevin,
 * on the empty-net diagram: *"can we please show a skater glyph (we should have
 * one somewhere)."* We have `figMascot` and `figTabletop` in src/lib/figures.js,
 * and they are the wrong thing twice over: they are SHOT markers whose pose
 * encodes the outcome the feed recorded — saved or scored — and they wear a
 * jersey, which is the provenance grammar's word for "recorded". A player
 * stepping over the boards has no shot and no club, so borrowing that figure
 * would draw two claims the moment does not make.
 *
 * ⭐ SO HE IS BUILT FROM `goalieGlyph`'S OWN CONSTANT, not from a second set of
 * digits. The two figures on this rink have to read as PEERS — same head, same
 * line, same height — differing only where a goaltender genuinely differs: he is
 * wide because of his pads and his stick stops at the post, while a skater is
 * narrow and his stick reaches. Two independent glyphs would drift into two
 * unrelated species the first time either was touched.
 */
export const skaterGlyph=(gx,col,fill,cls='sk',dir=gx<100?1:-1)=>{
  const top=42.5-GK_H/2, bot=42.5+GK_H/2;          // the same body a goalie has
  const hr=GK_H*0.163, hcy=top+hr;
  const by=hcy+hr*0.6, bw=GK_H*0.30;               // NARROW: no pads
  const n=v=>v.toFixed(2);
  return `<g class="${cls}">`
   + `<rect class="skbody" x="${n(gx-bw/2)}" y="${n(by)}" width="${n(bw)}" `
   + `height="${n(bot-by)}" rx="${n(bw*0.45)}" fill="${fill}" stroke="${col}"/>`
   + `<circle class="skhead" cx="${n(gx)}" cy="${n(hcy)}" r="${n(hr)}" fill="${fill}" stroke="${col}"/>`
   /* THE STICK IS THE TELL, and it stays LOW AND SHORT. A goaltender's stops at
      the post; a skater's carries out in front of him, which is the silhouette
      that says "not the goalie" at the size these are actually read at.
      ⚠️ THE FIRST ONE REACHED 2.6 UNITS FROM MID-BODY and rendered as a long
      diagonal spike -- at a glance it read as a second LEG, not a stick. Kept in
      the same low band the goaltender's occupies, it reads as equipment. */
   + `<line class="skstick" x1="${n(gx+bw/2*dir)}" y1="${n(bot-0.9)}" `
   + `x2="${n(gx+(bw/2+1.9)*dir)}" y2="${n(bot+0.15)}" stroke="${col}"/>`
   + `</g>`;};

/**
 * AN OFFICIAL WITH HIS ARM UP — the third and last person this rink draws.
 *
 * ⭐ THE SAME BODY, THE OPPOSITE LIMB, and that is the whole idea. A goaltender is
 * wide because of his pads and his stick stops at the post; a skater is narrow and
 * his stick reaches forward; an official is a skater whose arm goes UP. One
 * constant drives all three, so they read as three of a kind rather than three
 * unrelated shapes, and the one line that differs is the one that means something.
 *
 * ⛔ HE IS FOR THE DELAYED-PENALTY DIAGRAM AND NOTHING ELSE. The raised arm is a
 * SIGNAL, not a position: the feed records no official anywhere, so he must never
 * appear on the game page. A rule diagram may illustrate a signal the rulebook
 * defines; a replay may not place a person it did not record.
 */
export const officialGlyph=(gx,col,fill,cls='of')=>{
  const top=42.5-GK_H/2, bot=42.5+GK_H/2;
  const hr=GK_H*0.163, hcy=top+hr;
  const by=hcy+hr*0.6, bw=GK_H*0.30;          // a skater's build
  const n=v=>v.toFixed(2);
  return `<g class="${cls}">`
   + `<rect class="ofbody" x="${n(gx-bw/2)}" y="${n(by)}" width="${n(bw)}" `
   + `height="${n(bot-by)}" rx="${n(bw*0.45)}" fill="${fill}" stroke="${col}"/>`
   + `<circle class="ofhead" cx="${n(gx)}" cy="${n(hcy)}" r="${n(hr)}" fill="${fill}" stroke="${col}"/>`
   /* THE ARM, AND IT TOOK A ZOOM TO GET RIGHT. The first one ran from the
      shoulder to 1.5 units above the crown, half a unit out — and rendered as a
      SPUR ON THE HEAD: too short to read as a limb and close enough to the skull
      to merge with it. Two things fix it and both are about legibility rather
      than anatomy. It reaches a full figure-height above the shoulder, so it is
      the tallest thing on the token and cannot be mistaken for a stick held low;
      and it leans a unit clear of the head, so the two shapes never touch.
      ⭐ THE HAND IS WHAT MAKES IT A SIGNAL. A bare line is a stick; a line ending
      in a fist is an arm, and at 8 rendered units that one dot is the difference
      between "somebody is holding something up" and "somebody is pointing". */
   + `<line class="ofarm" x1="${n(gx+bw/2+0.1)}" y1="${n(by+0.6)}" `
   + `x2="${n(gx+bw/2+1.0)}" y2="${n(top-2.5)}" stroke="${col}"/>`
   + `<circle class="ofhand" cx="${n(gx+bw/2+1.0)}" cy="${n(top-2.5)}" `
   + `r="${n(hr*0.62)}" fill="${fill}" stroke="${col}"/>`
   + `</g>`;};
