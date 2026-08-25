/* THE LIBRARY SITS OUTSIDE boot(), because the SHELL needs it too. It used to
   be inlined inside the function, which meant the bootstrap that chooses WHICH
   game to load could not use the same URL parser the renderer uses -- and so it
   grew its own regex, and then a second one for preview. Hoisting it is what
   makes "one place reads the URL" true of both pages rather than one. */
__LIB__
function boot(G,RATES){
// RATES ARRIVES AS AN ARGUMENT AND IS NEVER REQUESTED IN THIS FUNCTION. Both
// pages share this body byte for byte, and read-the-game.html carries its whole
// game inside it and must reach nothing -- the deploy greps the inlined pages for
// outbound calls, and that grep reads comments too, which is how this sentence
// came to be phrased around the word it is about. The shell requests
// measures.json in its own bootstrap and passes it down; the inlined page passes
// nothing, and the sentence then says the comparison is missing -- which is true
// of a page that makes no requests at all.
const R=G.roster, HID=G.teams.home.id, AID=G.teams.away.id, HAB=G.teams.home.ab, AAB=G.teams.away.ab;
const SKIP=new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
const EV=[],EVI=[];
G.events.forEach((e,n)=>{if(!SKIP.has(e.type)){EV.push(e);EVI.push(n);}});
// The timeline is the playable events; the LEDGER is the whole game. Layers get
// every event so the 51 non-plays are excluded with reasons instead of vanishing.
const upto=k=>k<0?[]:G.events.slice(0,EVI[k]+1);
/* THE URL, READ ONCE. Both pages behave identically when framed, because both
   run this line -- the inlined page can be previewed too, it is the same
   renderer and the same query string. There used to be three reads of
   location.search and two hand-written regexes, one of them the same preview
   test spelled twice; see src/lib/deeplink.js for why that became a module. */
const LINK=parse(location.search),PREVIEW=LINK.preview;
/* A MOMENT NAMES AN EVENT IN THE GAME; THE SCRUBBER INDEXES THE PLAYABLE ONES.
   EV drops 51 of 320 -- stoppages among them -- so the whistle layer's own
   teaching case ("here is an icing, watch this one") names an event that has no
   frame of its own. It is shown in the window of the next playable event, which
   is exactly where `upto()` puts it, so that is where the link lands. */
function frameOf(n){for(let k=0;k<EVI.length;k++)if(EVI[k]>=n)return k;return EV.length-1;}
const ATT=ATTEMPT_TYPES;
/* How each play LANDS. Paired opposites on purpose: a takeaway snatches inward
   and a giveaway slips loose; a hit jolts and a blocked shot halts dead. The
   names are the CSS animations in src/app.css. */
const ARRIVE={goal:'flare',hit:'jolt','blocked-shot':'halt',
              giveaway:'slip',takeaway:'snatch'};
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
const SX=x=>100-x, SY=y=>42.5-y;
/* ⭐ THE ARENA FRAME — B1. `SX`/`SY` are the pure screen transform and know
   nothing about which way anyone is facing. `AX`/`AY` add the one thing that
   varies, which is the PERIOD.
   `extract.py::_norm` rotates a period's coordinates 180 degrees when the host
   defended `right`, so the host always defends -x in storage. Applying the same
   rotation again puts a play back where it happened in the building -- which is
   all "as played" is. Both x and y, because _norm negates both: the rink is
   rotationally symmetric about centre ice, so this is a rotation and never a
   mirror.
   THE MODE IS A LINK PARAMETER (deeplink.js::ENDS). Kevin ruled as-played the
   default; CHENG held one-direction must survive as a control, because the
   whole-game shot map is the frame every other analytics surface uses.
   ONLY THESE TWO FUNCTIONS KNOW THE MODE. That is the whole invariance claim:
   the flip is applied at DRAW time, downstream of every count, so no reducer can
   see it. `test/render-ends.test.js` boots both modes and compares every count.
   ANYTHING DRAWN IN THE ATTACKING FRAME IS UNTOUCHED (CHENG). `showWhy`'s
   half-rink shows a shot with respect to the net being attacked, which is the
   frame the danger rule is DEFINED in; as-played is an arena-relative choice and
   has no meaning there. Only arena-frame drawings take AX/AY. */
const SIDES=G.sides||{};
const ASPLAYED=LINK.ends!=='fixed';
const ENDSMODE=ASPLAYED?'as-played':'fixed';
const DIR=per=>(ASPLAYED&&SIDES[per]==='right')?-1:1;
const AX=(x,per)=>SX(x*DIR(per)), AY=(y,per)=>SY(y*DIR(per));
// Rink is 200 units long for 200 feet, so one unit is one foot: a ~6 ft player
// is ~6 units. Goals get a little more presence.
// Only one figure is on the ice at a time, so it can afford presence and detail.
const FIG_SZ=9, FIG_BIG=11.5;
// The rink is 200 units wide and renders around 860px, so a unit is ~4.3px.
// This only drives the figure's drop-detail-when-small threshold, never its
// geometry, so an approximation is honest here -- but without it a 9-unit
// figure is judged as "9 pixels" and loses its face on a screen where there is
// plenty of room for one.
const UNIT_PX=4.3;
// THE TEAMS' OWN COLOURS, and this is the whole defect being fixed. These were
// literals -- Minnesota green and Buffalo gold, from the one game that used to be
// compiled into this page -- used as "the away colour" and "the home colour" for
// every game in the archive. Washington was green on this page and red on the
// front page, because on this page EVERY visitor was green. Buffalo was gold here
// and navy there, and neither page was reading the club's actual colour.
const AWAYCOL=colourOf(AAB), HOMECOL=colourOf(HAB);
(function paint(){const el=document.getElementById('rg');if(!el)return;
 // Two properties per team on purpose. The CHIP gets the true colour with ink
 // chosen for contrast against it; TEXT on white gets the colour only when it can
 // be read there, because six primaries cannot (Boston gold is 1.73:1).
 el.style.setProperty('--away',AWAYCOL);          el.style.setProperty('--home',HOMECOL);
 el.style.setProperty('--away-ink',inkOn(AWAYCOL));el.style.setProperty('--home-ink',inkOn(HOMECOL));
 el.style.setProperty('--away-text',readableInk(AWAYCOL));
 el.style.setProperty('--home-text',readableInk(HOMECOL));})();
let T=0, REDUCED=matchMedia('(prefers-reduced-motion:reduce)').matches;
let figStyle=(()=>{try{return localStorage.getItem('rtg.fig')||'mascot'}catch(e){return 'mascot'}})();
/* WHETHER THIS IS A FIRST VISIT — a fact the page has never had, and the reason
   230 words of teaching copy were either permanent furniture or absent.
   Kevin: "what they don't know, they have no idea what it means... they need to
   have their hand held for the first few times." CHENG arrived at the same gap
   from the other side: every one of those words is a FIRST-VISIT word, and the
   page could not tell.
   DISTINCT DAYS, NOT PAGE LOADS. Someone watching three games in one sitting is
   still on their first visit, and retiring the help mid-lesson is the failure
   this is built to avoid.
   STORAGE REFUSED MEANS NEWCOMER. Private browsing throws here, and the two
   errors are not equal: a returning viewer occasionally re-reading a tip costs
   them a glance, a novice shown nothing costs us the visitor. */
const NEWCOMER_DAYS=3;
let visits=1;
const NEWCOMER=(()=>{try{
  const today=new Date().toISOString().slice(0,10);
  const [day,n]=(localStorage.getItem('rtg.seen')||'').split('|');
  visits=+n||0;
  if(day!==today){visits++;localStorage.setItem('rtg.seen',today+'|'+visits);}
  return visits<=NEWCOMER_DAYS;
 }catch(e){return true;}})();
if(!FIG[figStyle])figStyle='mascot';
let finalA=0,finalH=0; for(const e of EV){if(e.type==='goal')(e.own===HID?finalH++:finalA++);}
function attemptTeam(e){return corsiTeam(e,R);}  // renamed: `corsi` is the layer object
function tk(e){const c=attemptTeam(e);return c===AID?'a':c===HID?'h':'x';}
function shotDir(e){const t=shootingTeam(e,R);return t==null?null:attackDirection(t,HID);}
let evenOnly=false;
// TRAILS. Every attempt used to persist for the rest of the game, which makes a
// permanent shot chart the base view shows by default -- and Doctrine §6 says the
// base view is just watch the game, every metric opt-in. `off` is the current
// moment; `all` is that older behaviour, chosen. There is deliberately no middle
// setting: it would need an N -- last ten attempts? last thirty seconds? -- and
// no N has a source in the data.
let trails='off';
// The mode is part of the CONTEXT, so every layer moves together. Filtering
// Corsi while leaving shots faced on all situations would put two scopes on one
// screen with no way for a viewer to reconcile them.
const CTX={roster:R,homeId:HID,awayId:AID,homeAb:HAB,awayAb:AAB,
           get evenOnly(){return evenOnly;}};
const MODE=()=>evenOnly?'even strength':'all situations';
// COMPUTED ONCE, because a stint is a property of the GAME and only the query is
// a property of the moment. A prefix would give the same answer -- any goal at
// or before the current second is already in it -- so this is a cost decision,
// not a correctness one, and it is written down that way rather than dressed up
// as a bug it does not fix.
const PBOX=stints(G.events,CTX);
// WHEN EACH PERIOD BEGAN, read from the events.
//
// AND NOT BECAUSE THE ARITHMETIC WOULD BE WRONG -- the first draft of this
// comment said `(per-1)*1200` would break in overtime, and that is false.
// `extract.py::_secs` BUILDS `s` as `(period-1)*1200 + elapsed`, so the two
// agree by construction, in overtime as everywhere else. Writing down a reason
// that sounds right and is not is worse than writing none.
//
// The real reason is smaller and true: this way the renderer does not need to
// know how `s` was constructed. If the extract's clock convention ever changes,
// this follows it instead of silently disagreeing with it.
const PSTART=(()=>{const m={};for(const e of G.events)
  if(m[e.per]==null||e.s<m[e.per])m[e.per]=e.s;return m;})();
function isHD(e){return isHighDangerEvent(e,CTX);}
function lens(k){return corsi.reduce(upto(k),CTX);}
const $=id=>document.getElementById(id);
/**
 * WHERE AN EVENT HAPPENED, in screen coordinates -- or null when the feed does
 * not record a position for it.
 *
 * ONE DECISION, UPSTREAM OF BOTH PATHS, and that is the whole point of it.
 * `inShootout` already existed in layer.js and its own comment says it lives
 * there "because all three need it and one of them getting it wrong is a wrong
 * number on screen". Three counting paths called it. The DRAWING path never did,
 * so shootout attempts were painted on the ice at coordinates that are not
 * positions: measured over 13 shootouts, the feed places attempts at BOTH ends
 * of the rink, and the split does not follow the shooting team either (94
 * attempts: away 27/18, home 20/29). Every shootout attempt is taken at one end.
 * Confirmed live on game 2023020510, which drew five of them at x = +75, -73,
 * +76, -83, +75.
 *
 * The reference game has no shootout -- `pt` is REG on all 320 events -- so no
 * local test, fixture or mutation could ever have seen it. ~6% of games reach a
 * shootout (13 of 219 sampled).
 *
 * THE STRUCTURAL LESSON (CHENG) is not "remember to filter in both places". It
 * is that the counting path and the drawing path were each given the rule
 * separately and only one got it -- the same shape as the conservation loophole,
 * where the ledger and the pre-filter disagreed about what "every event" meant.
 * So scope is decided ONCE, here, and the drawing path is not given the
 * opportunity to disagree: it cannot read a coordinate except through this.
 */
/**
 * WHAT PERIOD THIS IS, IN THE GAME'S OWN WORDS -- and the skater count when
 * overtime changes how many players are on the ice.
 *
 * The page said "Period 4". Overtime IS surfaced here: its events are real play
 * at real coordinates, drawn like any other and counted in the attempts. What
 * was never said is that it is overtime at all, or the thing that actually
 * changes -- MEASURED over 219 raw feeds, regular-season overtime is 3-on-3 in
 * **82.3%** of its events, while playoff overtime is 5-on-5 in **93.8%**. Four
 * skaters leave the ice and the page's only comment was to increment a number.
 *
 * `pt` and `sit` are both recorded fields, so none of this is inferred. The
 * period NUMBER cannot do this job: period 5 is a shootout in the regular season
 * and a third overtime in the playoffs.
 *
 * THE COUNT READS AWAY-THEN-HOME, which is the scoreboard's own order. Quoting
 * skater counts in one order while naming a team by another is a defect this
 * project has already shipped once, in 36 of 103 strength reasons; here no team
 * is named at all, and matching the scoreboard is what keeps the two readable
 * together.
 */
function periodLabel(e){
 if(!e)return 'Pre-game';
 if(e.pt==='SO')return 'Shootout';
 if(e.pt!=='OT')return 'Period '+e.per;
 // Playoff games run 2OT, 3OT and beyond; regulation is three periods, so the
 // overtime's own number is the period minus three.
 const n=e.per-3, name=n>1?n+'OT':'Overtime';
 const s=e.sit;
 return (s&&s.length===4)?name+' · '+s[1]+'-on-'+s[2]:name;
}
function place(e){
 if(!e||e.x==null)return null;
 if(inShootout(e))return null;
 return {x:AX(e.x,e.per),y:AY(e.y,e.per)};
}
let rinkPer=null;
/* REDRAWN ONLY WHEN THE PERIOD CHANGES, which is three times a game. Everything
   here except the nets is symmetric about centre ice, so the flip is a no-op on
   the boards, the lines, the circles and the dots -- they are rebuilt only
   because the nets share the group. */
function drawRink(per){if(per===rinkPer)return;rinkPer=per;const P=[];P.push('<rect class="boards" x="1" y="1" width="198" height="83" rx="27"/>');
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
 P.push(`<clipPath id="slotband"><rect x="0" y="${SY(SLOT_HALF_WIDTH)}" width="200" height="${SLOT_HALF_WIDTH*2}"/></clipPath>`
  +`<clipPath id="slotfrontA"><rect x="${SX(NET_X)}" y="0" width="200" height="85"/></clipPath>`
  +`<clipPath id="slotfrontB"><rect x="0" y="0" width="${SX(-NET_X)}" height="85"/></clipPath>`
  +`<g class="slotzone" clip-path="url(#slotband)">`
  +`<g clip-path="url(#slotfrontA)"><circle cx="${SX(NET_X)}" cy="${SY(0)}" r="${HIGH_DANGER_FT}"/></g>`
  +`<g clip-path="url(#slotfrontB)"><circle cx="${SX(-NET_X)}" cy="${SY(0)}" r="${HIGH_DANGER_FT}"/></g>`
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
 for(const b of[BLUE_LINE_X,-BLUE_LINE_X])
  // `SX` DECREASES with x, so the band's left edge is the far side of it.
  P.push(`<rect class="zoneband" x="${SX(b+ZONE_BAND_FT)}" y="1" width="${ZONE_BAND_FT*2}" height="83"/>`);
 for(const g of[-89,89])P.push(`<line class="ln red" x1="${SX(g)}" y1="3" x2="${SX(g)}" y2="82"/>`);
 for(const b of[-25,25])P.push(`<line class="ln blue" x1="${SX(b)}" y1="1" x2="${SX(b)}" y2="84"/>`);
 P.push('<line class="ln red thick" x1="100" y1="1" x2="100" y2="84"/><circle class="ln blue" cx="100" cy="42.5" r="15"/>');
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
 const netGlyph=(id,gx,col)=>{
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
 // dir points from the goal line toward CENTRE ice, so the body goes the other way.
 // Ids by ROLE, not by side. `netL`/`netR` were screen names for data facts, and
 // a reflection turns that kind of name into a lie without changing a character.
 P.push(netGlyph('netHome',AX(-89,per),HOMECOL));
 P.push(netGlyph('netAway',AX(89,per),AWAYCOL));
 // THE LABEL MOVES BEHIND THE GOAL LINE, into dead ice where there is room for
 // the word that was doing the disambiguating work. "CBJ" alone can be read as
 // "CBJ's net" or "where CBJ shoots", and those are opposites (CHENG); "CBJ net"
 // is what the original caption said before it was shortened to fit on a post.
 // THE TAGS FACE EACH OTHER ACROSS THE RINK (Kevin). The near net reads UP and
 // the far net reads DOWN, which puts the near tag's first letter at the BOTTOM
 // and the far tag's at the top.
 //
 // ESTABLISHED BY LOOKING, NOT BY DERIVING, and that is the note worth keeping. I
 // reasoned this out from the transform algebra twice -- SVG's y-axis points down,
 // a positive rotation is clockwise, so +90 carries a glyph's top toward +x -- and
 // shipped the opposite of what was asked for both times. The algebra is correct
 // and it answers a different question than the one a viewer is asking: which way
 // a label appears to face is not settled by where its ascenders point. Kevin read
 // the screen; the screen wins.
 // NO TEXT TAG. A goaltender standing in the crease says "this net is defended"
 // without a label, and the club's colour on the goalie and the net says whose --
 // which is how a viewer reads a real rink. The vertical "WSH net" was clutter
 // doing a job a figure does better (Kevin).
 $('rink').innerHTML=P.join('');}
/**
 * A goaltender in each crease -- unless the feed says one has been pulled.
 *
 * NOT DECORATION. `sit` is the situation code on every event,
 * [awayGoalie][awaySkaters][homeSkaters][homeGoalie], and it is the only honest
 * way to know a net is empty. In the reference game Minnesota pulls at 01:40 of
 * the third and the code reads 0651 for the last twenty events: six skaters, no
 * goalie. So the figure LEAVES THE ICE at the moment it really left, and the
 * emptiest net in hockey stops being something a novice has to be told about.
 *
 * WHAT THE FIGURE CLAIMS is that a goaltender defends this net, which the feed
 * records. It claims nothing about where they stood -- position is not tracked,
 * and the crease is where the rulebook puts them, not where we guess they were.
 * Same line the shooter figures already sit on the right side of (Doctrine §5).
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
const GK_H=4.6;                                    // full height, inside the 6ft mouth
const goalieGlyph=(gx,col,fill)=>{
 const dir=gx<100?1:-1, x=gx+2.2*dir;
 const top=42.5-GK_H/2, bot=42.5+GK_H/2;           // CENTRED on the mouth
 const hr=GK_H*0.163, hcy=top+hr;                  // head
 const by=hcy+hr*0.6, bw=GK_H*0.5;                 // body, tucked just under it
 const n=v=>v.toFixed(2);
 return `<g class="gk">`
  + `<rect class="gkbody" x="${n(x-bw/2)}" y="${n(by)}" width="${n(bw)}" `
  + `height="${n(bot-by)}" rx="${n(bw*0.37)}" fill="${fill}" stroke="${col}"/>`
  + `<circle class="gkhead" cx="${n(x)}" cy="${n(hcy)}" r="${n(hr)}" fill="${fill}" stroke="${col}"/>`
  // The stick reaches out to the side and STOPS AT THE POST -- it is the one part
  // of a goaltender that genuinely extends across the mouth, so it is allowed the
  // full half-width and no more.
  + `<line class="gkstick" x1="${n(x+bw/2*dir)}" y1="${n(bot-0.5)}" `
  + `x2="${n(x+(bw/2+1.5)*dir)}" y2="${n(bot)}" stroke="${col}"/>`
  + `</g>`;};
let netmenAre=null;
function drawNetmen(e){
 const sit=e&&e.sit;
 // Present unless the code says zero. A missing code is not evidence of an empty
 // net, and an empty net drawn on a guess would be the most dramatic thing on the
 // ice invented from nothing.
 const out=[];
 const gper=(e&&e.per)||1;
 if(!sit||sit[3]!=='0')out.push(goalieGlyph(AX(-89,gper),HOMECOL,HOMECOL));
 if(!sit||sit[0]!=='0')out.push(goalieGlyph(AX(89,gper),AWAYCOL,'#fff'));
 const now=out.join('');
 // ONLY ON CHANGE. Rewriting this every frame would rebuild both figures on every
 // event, restarting their entrance animation each time -- a goaltender flickering
 // three hundred times a game. Redrawing only when the situation code actually
 // changes also makes the animation mean something: it fires when a goalie
 // arrives or leaves, and at no other moment.
 if(now===netmenAre)return;
 netmenAre=now;$('netmen').innerHTML=now;}
function flashNet(scorer){
 // A team scores INTO the net it is attacking, which is the OTHER team's: a
 // visitor goal lights the HOST's net. Stated by role, so which side of the
 // screen that is stays a rendering question. Restarting the animation needs the
 // class off, a reflow, then on.
 const net=scorer===AID?$('netHome'):$('netAway');
 net.classList.remove('netflash');void net.offsetWidth;net.classList.add('netflash');}
let prevA=0,prevH=0;
/**
 * WHAT JUST HAPPENED TO THE PLAYHEAD — which is not the same question as
 * "is this the newest event", and the two used to share one boolean.
 *
 *   'play'  the replay advanced by one: mark the moment AND bump the counters.
 *   'jump'  the viewer went somewhere: mark the moment, and do NOT bump.
 *   ''      a redraw of the same frame — a layer toggled, the work panel
 *           opened, the scrubber dragged THROUGH here on the way somewhere
 *           else. Mark nothing.
 *
 * THE SPLIT IS NOT COSMETIC. `prevA`/`prevH` hold the attempt counts at the
 * previous frame, so `a>prevA` means "one more attempt than a moment ago" only
 * when the playhead moved a moment. Jump forward across a period and forty
 * attempts arrive at once, and the counter would flash exactly as it does for a
 * single shot -- a bump that says "that just happened" about something that
 * happened forty times, minutes ago. The caption is the opposite case: calling
 * the goal again is the whole reason to jump to it.
 */
/* WHO IS SITTING, at one instant. The names come from the penalty events and
   the seat is emptied by src/lib/box.js -- which consults `sit` about GOALS and
   about nothing else, because occupancy and strength are different questions.
   Coincidental majors after a fight fill both boxes at five a side, and a band
   driven by the strength code would show them empty.

   THE ASSESSED TIME, NOT A COUNTDOWN. `2:00` is what the referee gave him; what
   he serves can be less, and it is the ice that says so. Kevin ruled a static
   label for this build. */
function drawBoxes(secs){
 for(const [tm,id,ab] of [[AID,'pbA',AAB],[HID,'pbH',HAB]]){
   const el=$(id);if(!el)continue;
   const men=secs==null?[]:occupants(PBOX,secs,tm);
   el.setAttribute('data-ab',ab);
   el.classList.toggle('empty',!men.length);
   // The infraction is a raw feed key (`high-sticking-double-minor`) and stays
   // out of here; the caption already names it in words when the call is made.
   el.innerHTML=men.length
     ? men.map(s=>{const p=R[s.player];
         return `<span class="man">${ESC(p?p.nm:'—')}</span><span class="srv">${s.min}:00</span>`;}).join('')
     : '<span class="srv">empty</span>';}}

/* THE SENTENCE THE PAGE HAS OWED SINCE THE ENDS DECISION -- see rink.js.
   Two sentences, two kinds: the first is about hockey, the second is about what
   WE did to the data, and the `display:` tag says which. */
function drawEndsNote(e){
 const el=$('endnote');if(!el)return;
 if(!e||!endsNoteShowing(e,PSTART[e.per]??0)){el.innerHTML='';return;}
 // The `from` provenance string is deliberately NOT painted here -- see rink.js.
 // TWO SENTENCES IN ONE MODE AND ONE IN THE OTHER, because as-played captions
 // something the reader just watched and one-direction has to carry the whole
 // explanation on its own. The `from` provenance string is deliberately NOT
 // painted -- see rink.js; it cost 176px on a 390px phone.
 const N=ENDS_NOTE[ENDSMODE];
 el.innerHTML=ESC(N.rule)+(N.display?` <span class="disp">${ESC(N.display)}</span>`:'');}

function render(i,how){
 const moment=how==='play'||how==='jump';
 // `evs` is the PLAYABLE prefix, used to draw the marks on the timeline.
 // `lens(i)` reduces the FULL stream up to the same moment. Two different
 // slices on purpose: the ice shows plays, the ledger accounts for everything.
 const evs=EV.slice(0,i+1),L=lens(i),cur=EV[i];
 const PER=cur?cur.per:1;     // pre-game shows the first period's arrangement
 drawRink(PER);drawAtk(PER);
 drawBoxes(cur?cur.s:null);   // null before the first play: both boxes empty
 drawEndsNote(cur);
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
 $('events').innerHTML=parts.join('');
 if(whistleOn)drawWhistles(whistle.reduce(upto(i),CTX));
 else{$('whistles').innerHTML='';$('whistlePanel').innerHTML='';}
 // The replay is AT the end, not merely near it. `i` is the frame index and
 // EV.length-1 is the last playable event; a game paused one shot short has
 // no verdict, and saying so is the whole point.
 // THE SITUATIONS NOTE CARRIES A NUMBER, which is the difference between a
 // claim and evidence. "Watch which attempts drop out" asked the reader to go
 // and look; this says how many did, in the game in front of them, so far.
 // Counted as: excluded for STRENGTH and for no other reason -- an event that
 // was also not an attempt was never going to count, and including it would
 // inflate the number with things even strength did not remove.
 const dropped=L.excluded.filter(x=>x.dims&&x.dims.strength&&!x.dims.type&&!x.dims.play).length;
 $('nSit').textContent=evenOnly
   ?`${dropped} ${dropped===1?'attempt has':'attempts have'} dropped out so far. Power plays and an empty net are still hockey — but they aren't even hockey.`
   :'';
 // THE NOTE FOLLOWS THE MODE, because the old sentence promised a whole-game
 // chart and as-played cannot deliver one.
 $('nTrails').textContent=trails!=='all'?''
   :ASPLAYED
   ?'Every attempt in this period stays on the ice. It clears when the teams change ends, because after that they are shooting the other way.'
   :'Every attempt stays on the ice, which builds into a shot chart by the third period — good to study, busy to watch.';
 $('nFig').textContent=figStyle!=='mascot'
   ?'Same shots, same outcomes, same math — only the drawing changes.'
   :'';
 document.getElementById('rg').classList.toggle('ended',i>=EV.length-1);
 /* THE PRE-GAME FRAME IS THE ONLY ONE THAT NEEDS AN INSTRUCTION, and `i<0` is the
    whole test -- `play()` leaves the resting frame at once from either end, so a
    playing replay can never be at -1 and no `playing` term is needed here. Same
    shape as `ended` directly above: a class off the playhead, nothing remembered. */
 document.getElementById('rg').classList.toggle('atrest',i<0);
 /* AN EMPTY NET IS A STATE, NOT AN INSTANT, so the sentence explaining it lasts
    exactly as long as the fact. This is half of the permanent paragraph that
    used to sit under the controls saying a goaltender "leaves when the feed says
    the goalie was pulled" -- drawn on every game and every visit, and read at
    every moment except the one where it meant something. CHENG: "the place that
    sentence pays off is the moment someone watches it happen."
    `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie], the same code
    drawNetmen draws by, and a MISSING code is not evidence of an empty net --
    so no note either, on the same rule.
    ONE SENTENCE PER PULLED TEAM, mapped rather than branched. Both nets empty at
    once is legal and rare, and a `has`/`have` ternary for it would be a branch no
    game in the archive can reach, which is a branch no test can honestly kill. */
 const st=cur&&cur.sit, pulled=[];
 if(st&&st[0]==='0')pulled.push(AAB);
 if(st&&st[3]==='0')pulled.push(HAB);
 $('iceNote').textContent=pulled.length
   ?pulled.map(ab=>`${ab} has pulled the goaltender for an extra attacker.`).join(' ')
    +' An empty net here is the feed’s own situation code, never a guess.'
   :'';
 /* THE ENDS KEY, at the first moment the claim can be doubted. Every team
    attacks the same net all game here and switches every period in the arena,
    and the reader who NOTICES is the one who already knows hockey -- so the key
    arrives when the game leaves the first period, which is when the switch would
    have happened and did not. Before that, nothing has yet failed to occur. */
 document.getElementById('rg').classList.toggle('endskey',endsKeyShowing(ENDSMODE,cur));
 if(blockOn){const sl=upto(i);drawBlocked(blocked.reduce(sl,CTX),L,sl);}
 else $('blockPanel').innerHTML='';
 let lh='';
 const cp=place(cur);
 if(cp&&(cur.type==='shot-on-goal'||cur.type==='goal')){const netx=(cur.own===HID)?89:-89;
   lh=`<line class="shotline" x1="${cp.x.toFixed(1)}" y1="${cp.y.toFixed(1)}" x2="${AX(netx,cur.per)}" y2="42.5"/>`;}
 $('lines').innerHTML=lh;
 // THE PUCK GOES WITH THEM. It was the third drawing site reading `e.x`
 // directly, so a shootout attempt moved the puck to a place it had not been.
 $('puck').innerHTML=cp?`<circle class="puck${moment?' jump':''}" cx="${cp.x.toFixed(1)}" cy="${cp.y.toFixed(1)}" r="1.5"/>`:'';
 drawNoPlace(cur);
 drawLabel(cur);
 drawNetmen(cur);
 $('aSc').textContent=L.as;$('hSc').textContent=L.hs;
 const a=L.t[AID],h=L.t[HID],tot=a+h,pa=tot?Math.round(100*a/tot):0;
 /* ⭐ NO BAR OVER AN EMPTY POPULATION, and this was a real defect on the front
    door. `tot=a+h||1` avoided the division by zero and then DREW THE RESULT
    ANYWAY: at 0-0 it made pa=0, so the whole bar rendered in the home colour and
    the opening faceoff of every game announced that one team had all of the
    control before a puck had been shot. Seen only by looking -- it is a
    rendering, and the suite has no pixels.

    The rule already exists one file over. archive.js refuses a rate over an
    empty population and says why: "0 reads as a finding, and 'we measured
    nothing' is a different statement from 'it never happened'." A proportion of
    nothing drawn as certainty is that sentence in paint. Both segments stay at
    zero width, so what shows is the empty track -- which is what we know. */
 $('ba').style.width=(tot?pa:0)+'%';$('bh').style.width=(tot?100-pa:0)+'%';
 // A FRACTION, NOT A PERCENTAGE, and the bar carries the proportion (CHENG).
 // `58%` over nineteen attempts asserts three significant figures on a
 // denominator that moves 2.5 points per shot, and it swings visibly through
 // the first period looking like information. `11` beside `8` claims exactly
 // what it is. Same rule as the goalie card and the per-game sentence: no
 // minimum-n threshold is needed, because a fraction carries its own.
 $('pa').textContent=a;$('ph').textContent=h;
 $('cA').textContent=a;$('cH').textContent=h;
 if(how==='play'){if(a>prevA)flash('cA');if(h>prevH)flash('cH');}
 if(moment){
   /* ⭐ THE GOAL PILL IS NOT DRAWN WHEN THE ICE IS ALREADY SAYING IT.
      Kevin, looking at the front door: the pill "is redundant and doesn't add
      any information to the event". He is right about a goal -- `drawLabel` has
      its own branch for one, naming the SCORER AND THE ASSISTS, which is more
      than the pill carries. The same sentence twice, eight inches apart.
      AND ONLY A GOAL, WHICH IS THE PART WORTH SAYING OUT LOUD. The pill fires
      for three moments, and the other two are not duplicates: `LAB` has no
      `goal` key but it does have `penalty`, so the ice says "CAR · Penalty"
      while only the pill says WHO TOOK IT; and for a slot shot the ice says
      "CAR · Shot on goal" while only the pill says "⚡ Shot from the slot" --
      the one place the site names the region now painted on the ice.
      THE CONDITION IS drawLabel's OWN GUARD, not a copy of its reasoning.
      `labelsOn` is a control the viewer can switch off, and `place()` returns
      nothing for an unlocated event; in either case the ice says nothing and
      the pill is the goal's only announcement. Asking the same two questions
      here is what keeps "the ice already says it" true rather than assumed. */
   if(cur&&cur.type==='goal'){flashNet(cur.own);
     if(!(labelsOn&&place(cur)))caption(cur,'goal');}
   // THE PENALTY IS CALLED, and it is the only event here that changes the
   // CONDITIONS of the game rather than the count. It is why `Even strength
   // only` exists as a control at all, and until now the ice marked it exactly
   // as loudly as a giveaway -- a `LAB[]` label and nothing else. Found by
   // asking the index's question ("which events does this page give a moment of
   // their own?") of a renderer that turned out to have only two answers.
   //
   // `own` IS THE OFFENDING TEAM, checked rather than assumed: across the
   // reference game's eight penalties, the skater count in `sit` drops for
   // `own`'s side on the very next event, eight times out of eight. The caption
   // says who took it and stops there -- at THIS frame the team is not yet a
   // skater short (`sit` still reads 1551), so any sentence about the power play
   // would be a claim about the future dressed as a description.
   else if(cur&&cur.type==='penalty'){caption(cur,'penalty');}
   else if(cur&&hdOn&&isHD(cur)){lastHD=i;caption(cur,'hd');}}
 prevA=a;prevH=h;
 $('per').textContent=periodLabel(cur);$('clk').textContent=cur?cur.rem:'20:00';
 if(goalieOn){const gs=goalieStats(i);$('goaliePanel').innerHTML=G.goalies.map(id=>{const p=R[id];if(!p)return '';const tid=p.tid,side=tid===AID?'a':'h',ab=tid===AID?AAB:HAB;const st=gs[id]||{f:0,s:0,gl:0,hf:0,hs:0};
 // A FRACTION, ALWAYS, AND THE THRESHOLD IS GONE. This used to print .943 and
 // switch to "18/20" below twenty shots faced -- and twenty was a number we
 // chose, the same defect this project refuses everywhere else. A fraction
 // carries its own denominator, so it needs no cutoff to be honest at: 33 of 35
 // and 18 of 18 both say exactly what they are, and 1.000 does not.
 //
 // The limit is stated on EVERY card for the same reason. Showing it only when
 // the number was small was selective honesty (Doctrine §9) -- it made a
 // 35-shot game look like a rate you could compare, which is the belief the
 // whole site exists to correct. One game is one game.
 const faced=st.f?`${st.s} of ${st.f}`:'—';
 return `<div class="gcard"><div class="gname ${side}">${p.nm} <span class="sub">${ab} · #${p.n}</span></div><div class="gsv">${faced}</div><div class="gline">${st.s} saves · ${st.gl} goals · ${st.f} shots faced (${MODE()})${st.hf?` · from the slot ${st.hs} of ${st.hf}`:''}<br><span class="lim">one game — what happened, not how unusual it was</span></div></div>`;}).join('');}
 if(workOpen)renderWork(L,cur);
}
function flash(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function caption(e,kind){const c=$('caption');const tid=e.own;const ab=tid===AID?AAB:HAB;const side=tid===AID?'a':'h';
 const p=R[e.actor];const who=p?`<span class="num">#${p.n}</span>${p.nm}`:ab;
 const label=kind==='goal'?'🚨 GOAL':kind==='penalty'?'⛔ Penalty':'⚡ Shot from the slot';
 // THE TRAILING CLAUSE IS GONE, and it is the residue of a rename. When the
 // label read "⚡ High danger" a suffix naming the slot was the sentence's only
 // mention of it; after the rename to "Shot from the slot" the caption said it
 // twice -- "⚡ Shot from the slot · #16 Dorofeyev from the slot", on 31 of 31
 // slot captions in a walked replay. The rename was verified by grepping for
 // the OLD term, which can prove a word is gone and cannot see that removing it
 // left a sentence saying the same thing in both halves. Found by watching the
 // layer play; the assertion below it is in `render-transport.test.js`.
 c.innerHTML=`<span class="tag ${side}">${ab}</span><b>${label}</b> · ${who}`;
 /* THE CAPTION LASTS EXACTLY AS LONG AS THE FRAME IT DESCRIBES. It used to be
    `animation:cap 2.2s` in the stylesheet -- a second clock, beside the pace and
    unrelated to it, and the speed buttons moved one of them. Driving the
    duration from `dwell(e)` is what makes "coordinated with the captions" a
    property of the code rather than a pair of numbers somebody keeps in step.

    THROUGH THE CSSOM, WHICH THE CSP PERMITS. The policy refuses inline `style`
    attributes in the shipped markup (see docs and `document.test.js`); assigning
    to `.style` at runtime is how the verdict dot and the team colours already
    work. A duration living only in CSS would also be invisible to every test we
    have, because the render harness has no stylesheet. */
 c.style.animationDuration=dwell(e)+'ms';
 c.classList.remove('on');void c.offsetWidth;c.classList.add('on');}
let workOpen=false;
function renderWork(L,cur){const a=L.t[AID],h=L.t[HID],tot=a+h||1,pa=Math.round(100*a/tot);
 // Rendered from the ledger itself, not from a hand-written list. Every reason
 // below was written by the layer that excluded the event, so a new layer gets
 // this panel for free and a changed rule cannot leave stale copy behind.
 const byWhy=summarise(L.excluded), rows=Object.entries(byWhy).sort((x,y)=>y[1]-x[1])
   .map(([why,n])=>`<div><b>${n}×</b> ${why}</div>`).join('');
 const sTotal=L.surprising.length, sWhy=sTotal?L.surprising[0].why:'';
 $('workPanel').innerHTML=`<h2>How “control” is computed <span class="wsub">(${MODE()}${cur?', through P'+cur.per+' '+cur.rem:', pre-game'})</span></h2>
 <div class="wg"><div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3><p>Every attempt on goal — shots that hit the net, missed it, or were blocked. All credited to the shooter.</p></div>
 <div class="wc flag"><h3>Counted, surprisingly <span class="n">${sTotal}</span></h3><p>${sWhy||'—'}</p></div>
 <div class="wc"><h3>Not counted <span class="n">${L.excluded.length}</span></h3><p class="wexc">${rows||'—'}</p></div></div>
 <p class="wfoot"><em>${a} ${AAB} / ${h} ${HAB} → ${pa}% / ${100-pa}%.</em> ${L.counted.length} counted + ${L.excluded.length} not counted = <b>${L.counted.length+L.excluded.length}</b> events, which is every event in the game so far. Nothing is dropped quietly.${evenOnly?' <b>Even strength only</b> — the power-play and empty-net attempts are in the not-counted list above, with the situation that removed each one.':''}</p>`;}
/* THE PACE, AND IT IS ONE RULE INSTEAD OF FOUR TIERS.
   docs/event-timing.md carries the walk this came out of. What it measured, at
   Teaching, over 280 frames of a real replay:

     55 of 280 frames (19.6%) held 1.3x to 2.6x the base with NOTHING on screen
     to tell them apart, because `dwell` asked `isHD(e)` while the caption asked
     `hdOn && isHD(cur)`. A pause that exists to give a caption room, firing
     when there is no caption. Proven by contrast rather than argument: the same
     31 frame indices, 0 captioned in the base view and 31 at `?layer=slot`.

   Kevin: "I'm not sure we should linger on certain events longer than others...
   a consistent replay speed, and definitely coordinated with the captions."

   THE RULE IS NOW: A FRAME LASTS AS LONG AS WHAT IS ON IT TAKES TO READ.
   Which quantizes to two states, because the page has two -- a frame carries a
   caption or it does not. Both are OBSERVABLE PROPERTIES OF THE FRAME rather
   than a taxonomy someone chose, and the old ladder was the latter: a goal was
   worth 4.6 ordinary plays because somebody decided so.

   AND IT MAKES THE 19.6% STRUCTURALLY IMPOSSIBLE rather than guarded. The frame
   is long BECAUSE there is a caption, so a layer that is off cannot leave a
   pause behind -- `captioned()` is the single source both the schedule and the
   renderer read. Same move as `place()`: remove the opportunity to disagree
   instead of adding a third check that has to agree.

   FRAME_MS IS A TASTE AND IS HERE TO BE LOOKED AT. Kevin reported Teaching too
   fast; 1800 is his call to move, and the consequence of moving it is the
   replay's length (about 8.5 minutes for a 281-event game) and the number of
   events in the home page's loop, which runs on this same function. */
const FRAME_MS={sp0:2600,sp1:1800,sp2:1000};
const CAPTION_BONUS=900;
let i=EV.length-1,playing=false,timer=null,frameMs=FRAME_MS.sp1;
$('scrub').max=EV.length-1;
/* THE PLAYHEAD FLOOR IS -1, AND -1 IS A FRAME. Every read of the current event
   in `render` is already guarded, `upto(-1)` already answers `[]`, `drawBoxes`
   already empties both boxes on a null, `periodLabel(null)` already says
   'Pre-game' and `renderWork` already writes ', pre-game' -- so index -1 draws
   the rink, both goaltenders, a 0-0 board and two empty boxes. All of that was
   written and unreachable until this clamp stopped stopping at zero. */
function set(v,how){i=Math.max(-1,Math.min(EV.length-1,v));$('scrub').value=i;render(i,how);syncStep();}
/* THE ENDS ARE STATED BY THE CONTROL, not discovered by pressing it. `set`
   clamps, so a press at either end is already harmless -- but a button that
   accepts a press and does nothing is a button that says the page is broken. */
function syncStep(){$('back').disabled=i<=-1;$('fwd').disabled=i>=EV.length-1;}
/* WHICH FRAMES SPEAK. The ONE place that answers it -- `render` calls this to
   decide whether to caption, and `dwell` calls it to decide how long the frame
   lasts. Two readers, one answer, so they cannot drift: that drift is the whole
   subject of docs/event-timing.md. `hdOn` is in here on purpose; a slot shot
   with the layer off is a frame that says nothing, and it must be paced as one. */
function captioned(e){return !!e&&(e.type==='goal'||e.type==='penalty'||(hdOn&&isHD(e)));}
function dwell(e){return captioned(e)?frameMs+CAPTION_BONUS:frameMs;}
function step(){if(i>=EV.length-1){stop();return;}set(i+1,'play');timer=setTimeout(step,dwell(EV[i]));}
/* PLAY MEANS GO. A viewer who presses it has asked for the game, and resting on
   the pre-game frame for a full dwell would answer that with 1.8 seconds of empty
   ice. The opening frame is an orientation, not a countdown -- so Play leaves it
   at once, from either end. */
function play(){if(i>=EV.length-1||i<0){prevA=0;prevH=0;set(0,'play');}playing=true;$('play').textContent='⏸ Pause';clearTimeout(timer);timer=setTimeout(step,dwell(EV[i]));}
function stop(){playing=false;$('play').textContent=i<0?'▶ Play from start':i>=EV.length-1?'▶ Replay from start':'▶ Play';clearTimeout(timer);}
$('play').onclick=()=>playing?stop():play();
/* THE OVERLAY IS THE BUTTON. It calls `play()` directly rather than synthesising a
   click on `#play`, because a forwarded click is a second path to the same state
   that a test could satisfy without the real control working. There is no pause
   branch: it is only on screen at the resting frame, where `playing` is false. */
if($('pressplay'))$('pressplay').onclick=()=>play();
/**
 * ONE PLAY AT A TIME, IN EITHER DIRECTION — the control this transport did not
 * have, and the slider is measurably unable to substitute for.
 *
 * Measured in a real browser (docs/event-index.md §1): the scrub track is 166px
 * over 281 plays at a 360px viewport, so one pixel of drag is 1.7 plays and a
 * 40px fingertip spans 68 of them -- a quarter of the game. Landing on a chosen
 * play by dragging is not a matter of care; it is below the resolution of the
 * input device. On a desktop a mouse CAN address one play per pixel, and the
 * complaint survives anyway, because the track carries no marks: there is
 * nothing on it that says where the goals are, so the viewer drags, reads the
 * clock, overshoots and drags back. Two defects, both of which present as
 * "moving the slider back and forth" (Kevin).
 *
 * A STEP IS A JUMP, SO THE MOMENT IS CALLED AGAIN. That is the whole point of
 * pressing Back: not to arrive at a frame, but to see the goal called a second
 * time. One argument to `set`.
 */
function jump(d){stop();set(i+d,'jump');}
$('back').addEventListener('click',()=>jump(-1));
$('fwd').addEventListener('click',()=>jump(1));
/* A DRAG PASSES THROUGH PLAYS; A RELEASE LANDS ON ONE. `oninput` fires at every
   value the slider crosses, so calling the moment there would fire a hundred
   captions on one drag. `onchange` fires once, when the viewer lets go -- which
   is the frame they actually chose, and it gets called like any other jump. */
$('scrub').oninput=e=>{stop();set(+e.target.value,'');};
$('scrub').onchange=e=>{set(+e.target.value,'jump');};
/* THE SPEED CONTROL NOW GOVERNS THE CAPTION TOO, and until this change it did
   not govern anything but the frame. Measured: the caption ran 2067ms visible at
   every speed, because it was a CSS constant and the pace was a setTimeout, so a
   penalty frame (1300ms) let its caption finish ON THE NEXT PLAY six times out
   of six -- two plays later at Faster -- while a goal frame (6000ms) spent 3933ms
   with the caption already gone. Opposite directions, one missing relation.
   The id is passed rather than the number so there is one table, not two. */
function setSpeed(id){frameMs=FRAME_MS[id];['sp0','sp1','sp2'].forEach(x=>$(x).setAttribute('aria-pressed',x===id));}
$('sp0').onclick=()=>setSpeed('sp0');
$('sp1').onclick=()=>setSpeed('sp1');
$('sp2').onclick=()=>setSpeed('sp2');
$('work').onclick=()=>{workOpen=!workOpen;$('workPanel').hidden=!workOpen;$('work').setAttribute('aria-expanded',workOpen);$('work').textContent=workOpen?'Hide the work':'Show me the work';if(workOpen)render(i,'');};
$('aAb').textContent=AAB;$('hAb').textContent=HAB;
/* WHICH WAY EACH TEAM SHOOTS, because nothing said it and the answer is not
   guessable. Kevin, reading a blocked shot at the far end: "I don't understand
   how Toronto would have a shot blocked in the offensive zone?" — the mark was
   correct and the direction was inferable only from which crease a goaltender
   was standing in.
   IT IS CONSTANT, WHICH IS WHAT MAKES IT SAYABLE. extract.py normalizes every
   coordinate with `homeTeamDefendingSide`, so the host defends one end for the
   whole game and `extract --validate` checks that on every build. In the arena
   the teams switch each period; on this screen they do not, and the legend has
   always said so. See docs/ends-switching.md.
   DERIVED, NOT TYPED. The arrow comes from the same `attackDirection` the slot
   layer and the rule lines use, put through the same SX the ice is drawn with,
   so a change to either moves the arrow with it. */
const ATK=(t,per)=>AX(attackDirection(t,HID)*89,per)<100?'\u2190':'\u2192';
drawAtk(1);
/* THE STANDING KEY'S WORDS COME FROM THE MODE, and only its VISIBILITY is a
   per-frame question. Written once here rather than each frame: a sentence that
   cannot change during a visit should not be rebuilt three hundred times. */
(()=>{const k=$('endsKey');if(!k)return;const K=ENDS_KEY[ENDSMODE];
 k.textContent=K.rule||K.display;})();
/* ⭐ WHERE THE LEAGUE DISAGREES WITH ITSELF, SAID ONCE, COVERING EVERYWHERE.
   73 in-scope games reproduce the NHL's play-by-play exactly and differ from the
   NHL's own boxscore by one shot. We used to withhold them; now we show the
   event log -- which is the document a replay IS -- and state the disagreement.

   ONE SENTENCE RATHER THAN A PATCH AT EACH SITE. The shot count reaches the
   reader in more than one place (the blocked-shots panel says "a box score would
   show N"), and amending each one would leave the next one to be written
   unamended. A standing fact about the game covers every number derived from it.

   ABSENT WHEN THERE IS NOTHING TO SAY -- the verdict card's rule. `unreconciled`
   is only on the artifact when derive.py found a disagreement, so this is not a
   sentence a reader learns to skip. */
(()=>{const k=$('unrecKey');if(!k)return;
 const n=(G.unreconciled||[]).find(x=>x&&x.kind==='sog');if(!n)return;
 // Name the side that actually disagrees. Both are carried; usually one differs.
 const sides=[[HAB,n.home],[AAB,n.away]].filter(([,v])=>v&&v.ours!==v.league);
 if(!sides.length)return;
 // SHORT, BECAUSE THE READER IS ON A PHONE. The first wording ran to 75px at
 // 390px wide and pushed the legend from 173px to 248px -- the same mistake as
 // the ends disclosure, which shipped at 176px and had to come back to 78px.
 // Every fact survives the trim: which two documents, both numbers, whose, and
 // which one we chose.
 k.textContent='the league\u2019s boxscore says '
  +sides.map(([ab,v])=>`${v.league} shots on goal for ${ab}`).join(' and ')
  +'; its event log says '+sides.map(([,v])=>v.ours).join(' and ')
  +' \u2014 we show the event log';
 document.getElementById('rg').classList.add('unrec');})();
/* AND THE BUTTON SAYS WHAT IT DOES. "Keep every mark" is false under as-played,
   where the trail clears at each period change -- and a note explaining a label
   that contradicts itself is the decaying-disclaimer shape this project prefers
   an invariant to. The label states the truth instead. */
document.querySelectorAll('#rg .tbtn').forEach(b=>{
 if(b.dataset.t==='all')b.textContent=ASPLAYED?'Keep this period':'Keep every mark';});
function drawAtk(per){$('aAtk').textContent=ATK(AID,per);$('hAtk').textContent=ATK(HID,per);}
// Hand-formatted from the ISO date, never Date.parse: '2023-11-10' is UTC
// midnight and a western timezone would render it as the 9th.
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const GD=(G.game&&G.game.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
const WHEN=GD?`${+GD[3]} ${MON[+GD[2]-1]} ${GD[1]}`:'';
/* ⭐ THE GAME LINE DOES NOT SAY HOW IT ENDS.
   It read `... · final MIN 2–3 BUF`, which put the result on screen before the
   visitor had pressed anything -- on a page whose opening frame is chosen, twice
   over, precisely so that nothing is given away. It used to open on the last
   event ("defaulting to the end kinda spoils the surprise"), then on the opening
   faceoff (which named the winner of a draw before the game started), and both
   were moved earlier for this reason. Then this line printed the score anyway.
   Found by CHENG, and the incoherence is the argument: the fix is not new
   doctrine, it is the doctrine already applied one element to its left.
   NOTHING IS HIDDEN. The scoreboard fills in as the game plays -- from 0-0, the
   same reason the counter starts at zero -- and the verdict card states the
   result at the horn, where it happens. A replay of a game whose ending is on
   the title bar is a recap; the ending arriving when it arrived is a game. */
$('gl').textContent=`${AAB} at ${HAB}${WHEN?' · '+WHEN:''}`;
// THE PER-GAME SENTENCE. A summary of a FINISHED game, so it sits with the game
// line at the foot rather than beside the scoreboard, which counts up as the
// replay plays. It discloses nothing the page has not already said -- #gl states
// the result on first paint.
//
// The two clauses are written into SEPARATE ELEMENTS. That is not layout: it is
// what makes it impossible for a later edit to join the game's number to the
// archive's rate with a "so" or a "which means", and the reason that matters is
// mechanical rather than stylistic -- see src/lib/sentence.js.
(function verdict(){
 const all=corsi.reduce(G.events,{...CTX,evenOnly:false});
 const lvl=tiedControl.reduce(G.events,CTX);
 const q=G.quoted;
 const V=sentenceFor({homeAb:HAB,awayAb:AAB,homeId:HID,awayId:AID,
   diff:lvl.diff, attempts:all.t, levelCounts:lvl.t,
   // The LEAGUE'S OWN LINE when we hold it, which is what the archive's rows were
   // built from. Falling back to our own count keeps a game with no quoted
   // boxscore readable rather than blank.
   score:q?{h:q.home.score,a:q.away.score}:{h:finalH,a:finalA},
   // THE SAME PREDICATE THE COUNTS USE, and not `per===5`: period five is a
   // shootout in the regular season and a THIRD OVERTIME in the playoffs.
   shootout:G.events.some(inShootout),
   gameId:(G.game&&G.game.id)||0,
   // The one table, inlined by the builder from data/competitions.json --
   // so an all-star or Olympic game says WHICH competition it is rather
   // than only what it is not.
   names:COMPETITIONS,
   curve:(RATES&&RATES.levelCurve)||null,
   // undefined = never asked for (the inlined page, which reaches nothing);
   // null = asked for and did not arrive. Two different true sentences.
   noCurveReason:RATES===undefined
     ?'this page carries a single game and never asks for the archive'
     :undefined});
 const p=[`<span class="vk">What this game was</span>`,
          `<span class="lead">${V.lead}</span>`];
 if(V.rate)p.push(`<span class="rate">${V.rate}</span>`);
 if(V.absent)p.push(`<span class="rate">${V.absent}</span>`);
 // THE RATE, DRAWN AS WELL AS SAID. Only when there IS one: an absent
 // comparison gets its sentence and no picture, because a track with no dot on
 // it would be a chart of nothing.
 let pct=null;
 if(V.rate&&V.row&&V.row.n){
  pct=V.row.count/V.row.n*100;
  p.push(`<span class="vscale"><span class="vtrack"><span class="vhalf"></span>`
   + `<span class="vpt${pct>50?' hi':''}" id="vpt"></span></span>`
   + `<span class="vends"><span>0% — that team always won</span>`
   + `<span>always lost — 100%</span></span></span>`);}
 $('verdict').innerHTML=p.join('');
 // THE ONE POSITION HERE THAT IS GENUINELY CONTINUOUS, and the only one that
 // cannot become a class. Written through the CSSOM, which no policy restricts;
 // as a `style` attribute this page's own CSP refused it and the dot sat at 0%
 // on every game in the archive. It must come AFTER innerHTML -- the element
 // does not exist until then.
 if(pct!==null)$('vpt').style.left=pct.toFixed(1)+'%';})();
/**
 * WHERE TO GO NEXT, AND IT IS ABOUT THIS GAME.
 *
 * The shareable unit of this site is a game, so this page is where a stranger
 * arrives -- and until the chrome landed it had no links at all. The header
 * answers "where am I"; this answers "what else is here", and it sits BELOW the
 * rink on purpose.
 *
 * CHENG's ruling, and it dissolved a question asked badly. "Converting a
 * stranger versus interrupting a viewer" treats the two as simultaneous. They
 * are not: the stranger arrives BEFORE the game and the viewer exists DURING
 * it, and the moment that matters is neither -- it is when the game ENDS.
 * Someone who has just watched a replay and understood why twelve attempts did
 * not count is at peak curiosity, and that is here rather than in a navigation
 * bar above the ice.
 *
 * SPECIFIC TO THE GAME JUST WATCHED, which a generic nav cannot be. The two
 * clubs are already in scope, so their names cost nothing -- and they are the
 * only two teams this visitor has been given a reason to care about.
 *
 * BUILT AT RUNTIME, not by page.py: game.html learns its teams when it fetches,
 * so the shell can only supply the container. Both pages run this identically.
 *
 * Every destination exists today. A link to a page we have not built yet is a
 * 404 wearing a plan, which is the rule the chrome nav is held to as well.
 */
(function nextUp(){
 const el=$('nextup'); if(!el)return;
 const dot=s=>`<span class="sw ${s}"></span>`;
 el.innerHTML=[
  `<a href="/?team=${encodeURIComponent(AAB)}">${dot('a')}More ${AAB} games</a>`,
  `<a href="/?team=${encodeURIComponent(HAB)}">${dot('h')}More ${HAB} games</a>`,
  /* ⭐ U1. THE DATE INDEX, BECAUSE page.py's OWN COMMENT NAMES THIS PAGE AS THE
     VICTIM AND ITS FIX COULD NOT REACH IT.

     C1 added "By date" to `_NAV` for a reason stated there in as many words:
     "a reader on a team page or a game page could reach the team browse from
     any page on the site and the date browse from none." The game page runs
     the MINIMAL header -- deliberately, CHENG's ruling, because the moment
     that matters is when the game ENDS and that is below the rink rather than
     above it -- so it does not use `_NAV`, and the fix passed by the one page
     the comment names.

     THE DIAGNOSIS THIS ARRIVED WITH WOULD HAVE REVERSED A LIVE RULING. It was
     filed as "game.html opts out of the nav every other page has", i.e. put
     four links back in the header. It is ONE LINK, HERE: the two clubs above
     already reach the team browse, and only the date index was unreachable.

     THE WORDS ARE THE ONES THE READER ALREADY MET. The front door says "Or
     browse by date" and the chrome nav says "By date"; a third name for one
     destination is how a reader stops believing two links go to the same
     place. */
  `<a href="/calendar.html">Browse by date</a>`,
  `<a href="/">Every game in the archive</a>`,
 ].join('');})();
document.querySelectorAll('#rg .cc.a .lb').forEach(n=>n.childNodes[0].nodeValue=AAB+' attempts');
document.querySelectorAll('#rg .cc.h .lb').forEach(n=>n.childNodes[0].nodeValue=HAB+' attempts');

const HX=x=>11+Math.abs(x), HY=y=>42.5-y; let lastHD=null;
function showWhy(idx){const e=EV[idx];if(e==null||e.x==null)return;
 const _d=shotDir(e)||1, dLine=89-e.x*_d, dist=Math.hypot(dLine,e.y), angle=Math.atan2(Math.abs(e.y),dLine)*180/Math.PI;
 const inSlot=Math.abs(e.y)<=22, tid=e.own, ab=tid===AID?AAB:HAB, col=tid===AID?AWAYCOL:HOMECOL, p=R[e.actor], isGoal=e.type==='goal';
 const diag=`<svg viewBox="0 0 100 85"><rect x="1" y="1" width="98" height="83" rx="14" fill="#fff" stroke="var(--edge)"/>
   <polygon points="63,20.5 96,38 96,47 63,64.5" fill="var(--hd)" opacity=".3"/><text x="70" y="43.5" font-size="3.4" fill="#b07d17" text-anchor="middle">slot</text>
   <rect x="90" y="37" width="6" height="11" rx="1.5" fill="${col}" opacity=".55"/><line x1="96" y1="29" x2="96" y2="56" stroke="var(--red)" stroke-width="1" opacity=".7"/>
   <line x1="36" y1="1" x2="36" y2="84" stroke="var(--blue)" stroke-width=".8" opacity=".35"/>
   <line x1="${HX(e.x).toFixed(1)}" y1="${HY(e.y).toFixed(1)}" x2="95" y2="42.5" stroke="var(--ink)" stroke-dasharray="2 1.5" stroke-width=".7"/>
   <circle cx="${HX(e.x).toFixed(1)}" cy="${HY(e.y).toFixed(1)}" r="2.8" fill="${col}" stroke="#fff" stroke-width=".7"/>
   <text x="${Math.min(HX(e.x)+4,78).toFixed(1)}" y="${(HY(e.y)-2.5).toFixed(1)}" font-size="4.2" fill="var(--ink)" font-weight="700">${Math.round(dist)} ft</text></svg>`;
 $('whyContent').innerHTML=`<div class="whyhd ${tid===AID?'a':'h'}"><div><div class="t">${isGoal?'🚨 A GOAL from the slot':'⚡ Why this counts as a slot shot'}</div>
   <div class="s">${p?'#'+p.n+' '+p.nm:ab} · ${ab} · P${e.per} ${e.rem} · ${e.type.replace(/-/g,' ')}</div></div><button class="whyclose" onclick="hideWhy()">✕</button></div>
  <div class="whybody"><div class="whydiag">${diag}</div>
   <div class="factor"><span class="fv">${Math.round(dist)} ft</span><span class="fl">Distance to the net — <b>close</b>. Our rule: ≤ 33 ft. <span class="chk">✓</span></span></div>
   <div class="factor"><span class="fv">${Math.round(angle)}°</span><span class="fl">Angle off straight-on — ${angle<22?'<b>a clean look</b> at the net':'a slot-area angle'}. Lower = more net to shoot at.</span></div>
   <div class="factor last"><span class="fv">${inSlot?'Slot':'Wide'}</span><span class="fl">Lateral position — ${inSlot?'<b>in the slot</b> (within the faceoff dots) <span class="chk">✓</span>':'outside the slot'}</span></div>
   <div class="whyrule"><b>The rule, and you can check it:</b> a shot counts as <b>from the slot</b> when it is <b>≤ 33 ft from the net</b> AND <b>within ±22 ft of the middle</b>. Both true here. This is <b>our own geometric rule</b>, not a model and not anybody else's statistic — it says where the shot came from, and nothing about how likely it was to go in. Measure it yourself on the diagram.</div></div>`;
 $('whyBk').classList.add('on');}
function hideWhy(){$('whyBk').classList.remove('on');}
$('events').addEventListener('click',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.i!=null){const k=+t.dataset.i;if(hdOn&&isHD(EV[k]))showWhy(k);}});
/* THE CAPTION'S CLICK HANDLER IS GONE, AND IT HAD NEVER ONCE FIRED. `#rg
   .caption` carries `pointer-events:none` -- it has to, it floats over the ice
   and would otherwise swallow clicks meant for the marks underneath -- and
   nothing anywhere overrode it. So this listener was unreachable from the day
   it was written: dead weight that read as an affordance.
   Fourth instance of that shape (the dead `goal` row in `LAB`, `rosterSpots` in
   shell.test.js, an assertion on `undefined` in homepage.test.js), and the
   first one found by a stylesheet rather than by reading the script -- which is
   the same lesson `text-transform:capitalize` taught: the CSS is part of the
   program. It was also WRONG on its own terms, opening the why-card for the
   last slot shot no matter which event the caption was describing. */
$('whyBk').addEventListener('click',e=>{if(e.target.id==='whyBk')hideWhy();});


/* THE LABEL SAYS WHAT HAPPENED. A SECOND LINE IS ONLY EARNED BY SAYING WHETHER
   IT COUNTS.
   Kevin, watching the preview: "we don't need the subtext on the event, just the
   event itself I think is enough. It states what the event was, and the
   descriptive elements of the site should provide the clarifying details."
   True of six of the nine, and they are gone: "Faceoff / puck dropped",
   "Giveaway / lost the puck", "Takeaway / won the puck back", "Penalty / off to
   the box", "Shot on goal / a shot attempt" all say the label again in other
   words. On a phone they were the smallest text on the ice and they said
   nothing.
   THE TWO THAT STAY ARE NOT DESCRIPTIONS, THEY ARE THE THESIS. A novice
   watching "Shot blocked" appear while the attempts counter GOES UP has just met
   the site's whole argument, and the line is the only thing on screen that
   accounts for it -- and blocked-shot attribution is the exact defect that once
   shipped a wrong flagship number, so "for the shooter" is load-bearing rather
   than decorative. Same for a miss that still counts.
   HIT LOST ITS LINE TOO, and the reason sharpened the rule. I had kept it under
   "says whether it counts", but Kevin: "I don't think it adds any value (except
   to the 'hits' counter that we don't track anyway)". He is right, and the
   distinction is exact -- "not a shot" corrects a misreading of a number THAT IS
   NOT ON THE SCREEN. Nothing on this page ever suggested a hit might be an
   attempt, so the line answered a question nobody had.
   The rule, sharpened, so the next row is not argued from scratch: a second line
   is earned only when it corrects a misreading of a counter the viewer CAN SEE
   MOVING. Rephrasing the label is noise; explaining a metric we do not show is
   noise wearing the shape of rigour.
   `goal` is gone entirely. Goals take the branch above -- scorer and assists --
   so its row had never once rendered: dead weight inside a table, reading as
   coverage. Third instance of that shape (test/shell.test.js had a dead
   "rosterSpots" pattern, homepage.test.js an assertion that read undefined).

   AND THEN THE LAST TWO WENT, so `LAB` is strings rather than pairs. Kevin,
   looking at it again: "I think we can retire the subtext on the event displayed
   on the ice, it still looks crowded to me". The rule above survives him -- the
   two that stayed were the ones that DID correct a misreading of a moving
   counter -- but it was never the whole test. A line can be earned and still not
   be worth the crowding, and which of those is true is a judgement about pixels,
   which is his to make and not one this file can argue from.

   THE BLOCKED LAYER'S SECOND LINE WENT WITH THEM, and that one is not a
   judgement call: both halves of it were already said somewhere permanent. "where
   the puck stopped -- not where the shot was taken" is the legend key, verbatim
   ("blocked -- ringed where the puck was stopped"), and "nobody defended it, so
   neither team is credited" is a whole paragraph of the blocked panel. It was
   redundancy on the most crowded surface on the page.

   WHAT STAYS IS THE GOAL'S ASSISTS, and it stays because THE GREETING PROMISES
   IT BY NAME: "goals are called with the scorer and assists". Cutting it would
   have made a sentence elsewhere on the page false -- the same dependency that
   broke "start with the game at the top" and "Press Play below", and this time
   a test holds the two ends together rather than a comment. */
const LAB={faceoff:'Won the faceoff',hit:'Hit',giveaway:'Giveaway',takeaway:'Takeaway','missed-shot':'Missed shot','shot-on-goal':'Shot on goal',penalty:'Penalty'};
let labelsOn=true;
/**
 * WHAT THE ICE SAYS WHEN IT IS SHOWING NOTHING.
 *
 * Removing the shootout marks without saying so would trade a wrong mark for a
 * silent gap: the replay would reach the end of overtime level, the scoreboard
 * would read one goal higher, and nothing would account for the difference.
 * Silence about an omission is the failure the ingest-state work spent two
 * rounds fixing, and it is the same reason the per-game sentence states why a
 * comparison is missing rather than dropping it.
 *
 * TWO SENTENCES, TWO KINDS. The first is about hockey and its subject is a rule.
 * The second is about US -- what we did to the data and why -- which is a
 * category the copy table did not have: every provenance tag we own (`rule:`,
 * `field:`) points into the game or the feed, and this one points at the
 * renderer. It is the first `display:` row, and the normalization disclosure the
 * page still owes belongs in the same family.
 */
function drawNoPlace(e){
 const g=$('noplace');
 if(!e||!inShootout(e)){g.innerHTML='';return;}
 g.innerHTML=`<text class="npl" x="100" y="39">Shootout — a skills competition that decides the game, not play in it.</text>`
   + `<text class="nplsub" x="100" y="46">Attempts are not drawn: the coordinates the feed records for them are not positions.</text>`;}
/* ⭐ B4 — ONE NARRATOR, MANY LEDGERS. This sentence used to live inside
   drawLabel's SVG branch, which meant the ON-ICE label was the only surface
   that could say what a blocked shot was. The panel below the rink needed the
   same sentence for the LAST block, and the choice was to write it twice or to
   name it once. Naming it once is also what keeps the two from drifting: the
   "it had no antecedent" fix (Kevin, watching CAR–VGK: `VGK · Blocked it` --
   "but what is 'it'?") would otherwise have to be made in two places.

   `named` is the layer's own privilege, not a style: the base view labels events
   with a team and a play, never a person, and blocked shots do not get to be the
   exception. With the layer on, the blocker is named. */
function blockedSay(e,named){
  const b=R[e.blk],sh=R[e.actor];
  const bt=b?(b.tid===AID?AAB:b.tid===HID?HAB:null):null;
  const mate=b&&sh&&b.tid===sh.tid;
  // 7.8% of blocks across the archive are by the shooter's own side, so "the
  // other team blocked it" would be false about one block in thirteen.
  if(!b)return 'Blocked — no blocker recorded';
  if(mate)return named?`Blocked by a teammate — ${b.nm}`:'Blocked by a teammate';
  // The team is the one that DID the blocking and the verb is active, so
  // `VGK · Blocked a shot` cannot be read as VGK's shot being blocked.
  return `${bt?bt+' · ':''}${named?b.nm+' blocked a shot':'Blocked a shot'}`;
}

/* ⭐ HOW FAR BACK A LEDGER ENTRY IS, extracted from the whistle card so every
   ledger can say it. The rink narrates NOW; anything below it is retrospective
   and must say so, because the card was never wrong -- its CURRENCY was
   invisible (Kevin: "the card stays on Last Stoppage, creating a bit of a
   disconnect"). A reader had to compare a timestamp against the scoreboard to
   discover they were looking at history.
   MEASURED, on the reference game, as the gap between the playhead and the most
   recent event of each layer: stoppage 36s median and 84% of frames over five
   seconds -- and the layers WITHOUT this line are worse. Blocked shots are 50s
   median, p90 153s, 92% of frames over five seconds; shots on goal 42s and 86%.
   Corsi is 14s and is excluded on its own merits: its "most recent event" is
   almost every event, which the caption already narrates and which does not
   drift.
   Same period only: across a period break the difference in `s` is not an
   elapsed time, and saying nothing is cheaper than computing one. */
function sinceLine(ev){
  if(!ev)return '';
  const c=EV[i];
  let d='';
  if(c&&c.per===ev.per){
    const g=c.s-ev.s;
    if(g>0)d=' · '+(g<60?g+'s':Math.floor(g/60)+':'+String(g%60).padStart(2,'0'))+' earlier';
  }
  return `· P${ev.per} ${ESC(ev.rem)}${d}`;
}

function drawLabel(e){const g=$('labels');const p=place(e);if(!labelsOn||!p){g.innerHTML='';return;}
 const lx=p.x,ly=p.y;
 if(e.type==='goal'){const tid=e.own,col=tid===AID?AWAYCOL:HOMECOL,ab=tid===AID?AAB:HAB,p=R[e.actor];
   const as=[R[e.a1],R[e.a2]].filter(Boolean).map(x=>x.nm).join(', ');
   let tx=lx>100?lx-5:lx+5,anc=lx>100?'end':'start',ty=Math.max(15,ly-6);
   g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${col}" stroke-width=".4" opacity=".55"/><text class="glab" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}" fill="${col}">🚨 GOAL — ${p?p.nm:ab}</text><text class="plabsub" x="${tx.toFixed(1)}" y="${(ty+4).toFixed(1)}" text-anchor="${anc}">${as?'assists: '+as:'unassisted'}</text></g>`;return;}
 let tx=lx+4,anc='start';if(lx>150){tx=lx-4;anc='end';}let ty=ly-4.5;if(ty<11)ty=ly+8;
 // THE TEAM, IN WORDS. The figure on the ice is one colour and two clubs can
 // wear the same one, so the label says whose play it was rather than leaving
 // the answer to a hue. Costs nothing and works without colour vision.
 const lab=e.own===AID?AAB:e.own===HID?HAB:null;
 const hd=(hdOn&&isHD(e))?' · from the slot':'';
 // WHY THIS FACEOFF IS HAPPENING, on the ice rather than only under it.
 //
 // The rules a novice most needs are the ones the feed records LEAST: an offside
 // stoppage carries a reason and a time and nothing else -- no coordinates, no
 // zone, no players -- so the infraction itself can never be drawn. What IS
 // recorded is the restart, and that the restart belongs to that whistle. Naming
 // the rule on the dot is therefore a RECORDED RELATIONSHIP, not an inference,
 // and it is the only thing the ice can honestly say about an offside.
 //
 // The reducer already paired them to place the ring and now publishes `spotId`,
 // so the pairing is read here rather than worked out a second time.
 //
 // TWO INDEX SPACES, AND THE FIRST DRAFT CROSSED THEM. `i` indexes EV -- the
 // PLAYABLE events, which drops 51 of 320 in this game -- while the reducer runs
 // over `upto(i)`, a slice of G.events, so its `spotId` is a G.events index.
 // Comparing `spotId === i` matched anyway, often enough to look right and to
 // survive a mutation that swapped the field for another one. It was true by
 // coincidence. `EVI[i]` is the same moment expressed in the reducer's space.
 //
 // ONE LINE, NOT TWO. The first draft made it a `plabsub` and a test caught it:
 // Kevin retired on-ice subtext on 2026-08-16 for taking room, and this label
 // sits on a faceoff dot that already carries a ring and sometimes a count. It
 // rides the same suffix seam `hd` uses, so the ice gains a clause and not a row.
 const why=(()=>{
   if(!whistleOn||e.type!=='faceoff')return '';
   const w=whistle.reduce(upto(i),CTX).whistles.find(x=>x.spotId===EVI[i]);
   if(!w)return '';
   return ' after '+(w.rsn?RSN(w.rsn):'an unrecorded stoppage');})();
 // WITH THE LAYER ON, THE LABEL NAMES THE BLOCKER, and the reason is the mark's
 // position rather than a preference for one name over the other. A blocked
 // shot's (x, y) is the BLOCK POINT -- where the puck was stopped, between the
 // shooter and the net, a median 24.2 ft out against 33.4 for a shot on goal.
 // A label naming the shooter beside a dot that is the BLOCKER's position
 // invites the reading that the dot is the shooter's, which is the one thing
 // this mark must not say. Naming the blocker inverts it at no cost, and the
 // attribution of the ATTEMPT is untouched: it is still the shooter's, which is
 // corsi's business and correct there (CHENG).
 // IN EVERY VIEW, NOT ONLY WITH THE LAYER ON. The paragraph above was right and
 // was applied to half the page: the mark is the BLOCK POINT wherever it is
 // drawn, so a label naming the shooter beside it invites the same misreading in
 // the base view, where most visitors meet it. Kevin found it from the teams
 // page with no layer on -- "that means Toronto took the shot, but WSH blocked
 // it... that should say what team did the blocking" -- which is this comment's
 // own argument, arrived at from the screen.
 //
 // THE WORDING HAD TO INVERT WITH THE TEAM. "WSH · Shot blocked" would read as
 // WSH's shot being blocked, by the same grammar that makes "BUF · Shot on goal"
 // BUF's shot. Swapping the team without swapping the verb would have replaced
 // one wrong reading with another.
 //
 // The player's NAME stays layer-only: the base view labels events with a team
 // and a play, never a person, and blocked shots do not get to be the exception.
 if(e.type==='blocked-shot'){
   const head=blockedSay(e,blockOn);
     // "IT" HAD NO ANTECEDENT. Kevin, watching a CAR–VGK game: `VGK · Blocked
     // it` -- "but what is 'it'?" Nothing on the label says a SHOT, and the mark
     // beside it is a dot like every other mark on the ice. The pronoun was
     // carried over from a sentence that used to name the shooter first, and it
     // lost its referent when the wording inverted to name the blocker.
     //
   g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${ESC(head)}</text></g>`;
   return;}
 // AND THE TABLE NO LONGER CARRIES A BLOCKED ROW. It would never be reached, and
 // a dead row inside a table reads as coverage -- the fourth time this file has
 // paid for that shape.
 if(!LAB[e.type]){g.innerHTML='';return;}
 // C8: a missed shot says WHICH way it missed. `missSay` is in attribution.js
 // beside SHOT_TYPES, because what a shot event IS belongs with the vocabulary
 // of shot events and not in a table of page labels.
 const info=e.type==='missed-shot'?missSay(e):LAB[e.type];
 g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${lab?lab+" · ":""}${ESC(info)}${ESC(why)}${hd}</text></g>`;}
$('lbl').addEventListener('click',()=>{labelsOn=!labelsOn;$('lbl').setAttribute('aria-pressed',labelsOn);$('lbl').style.opacity=labelsOn?'1':'.5';drawLabel(EV[i]);});

// THE WHISTLE LAYER, DRAWN. What from the stoppage, where from the faceoff that
// restarts play -- and the sentence is the point, so it lives in a panel that
// stays put rather than in the caption, which animates away in two seconds.
//
// `marks` and `latest` are the layer's own, not this page's: a whistle mark on
// the wrong dot is the kind of wrong that looks completely right, so the grouping
// rule is tested in test/whistle.test.js rather than eyeballed here.
/* ONE LABEL TABLE, THREE SURFACES. The heading, the tally and the <title> on
   every ring all came through here, and here was `String(r).replace(/-/g,' ')`
   -- the raw feed key with its hyphens swapped. "Goalie Stopped After Sog",
   "Tv Timeout", "Net Dislodged Defensive Skater", and `Sog` unexpanded in front
   of the one audience that does not know the term.
   FIXING THE HEADING ALONE WOULD HAVE LEFT THE OTHER TWO, and nobody would have
   noticed the tooltip, because nobody hovers while watching (CHENG). So the
   written name goes in WHY beside `say` and `from`, and every surface reads it
   from the one place -- the same argument as `place()` and `page.csp`.
   AN UNKNOWN REASON STILL RENDERS RAW. The feed can emit one we have never seen
   and a label we invented for it would be a guess wearing our own voice. */
const RSN=r=>{if(!r)return 'unrecorded';const w=WHY[r];return w&&w.name?w.name:String(r).replace(/-/g,' ');};
const ESC=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function drawWhistles(W){
 const g=[];
 for(const m of marks(W,{trails:trails,dir:DIR})){const cx=SX(m.x),cy=SY(m.y);
  g.push(`<circle class="wh${m.now?' now':''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.4"><title>play restarted here — ${ESC(m.reasons.map(RSN).join(', '))}</title></circle>`);
  // A COUNT, BECAUSE THE MARKS STACK. Nine faceoff dots hold every restart in the
  // game, so eight icings at one dot draw as one circle and the ice would be
  // showing a number it is not saying.
  if(m.n>1)g.push(`<text class="whn" x="${cx.toFixed(1)}" y="${(cy+1.2).toFixed(1)}">${m.n}</text>`);}
 // THE LINES THE RULE NAMES, for the whistle being explained. A novice is told
 // an icing is about the centre line and the far goal line; this is the only way
 // to say WHICH lines those are on the ice in front of them. Nothing here draws a
 // path -- the feed records no puck trajectory, and Doctrine §4 forbids inventing
 // one -- so what is lit is rink geometry the rulebook refers to, selected by the
 // recorded restart coordinate.
 const cur=latest(W);
 if(cur&&cur.lines&&cur.lines.length){
  for(const lx of cur.lines)
   g.push(`<line class="rulel" x1="${AX(lx,cur.per)}" y1="2" x2="${AX(lx,cur.per)}" y2="83"/>`);}
 $('whistles').innerHTML=g.join('');
 const w=latest(W);
 if(!w){$('whistlePanel').innerHTML='<p class="whsay">No whistle yet — play has not stopped in what you have watched so far.</p>';return;}
 // An unfamiliar reason is carried verbatim and named as unexplained. The draft
 // dropped it; a guessed sentence would be worse than dropping it.
 const say=w.say?ESC(w.say)
   :`<span class="none">The feed recorded this stoppage as “${ESC(w.rsn||'no reason given')}”, which is one we have no sentence for. We are not guessing at one.</span>`;
 // THE ZONE, AND THIS IS A COMPOSITION worth naming. The layer was built saying
 // it must not supply a team, because a stoppage carries none -- and that was
 // right for the only input it had. The restart coordinate is a different input:
 // Rule 81 sends the faceoff to the offending team's end, and 2,019 of 2,019
 // icings across 240 games restart at an end-zone dot. So the page states the
 // RECORDED fact (which end the dot is in) beside the RULE (where that dot goes),
 // and leaves the reader to put them together. It does not assert who iced it.
 const zone=(w.rsn==='icing'&&w.zone)
   ?` The faceoff came back into ${ESC(w.zone)}'s end.`:'';
 const where=(w.placed?'Play restarted at the ringed faceoff dot.'
   :`Not shown on the ice — ${ESC(w.unplaced)}.`)+zone;
 $('whistlePanel').innerHTML=
   /* THE CARD SAYS IT IS LOOKING BACKWARDS, which is the whole of Kevin's
      complaint. Measured across a game: the event this card describes is a
      median 29 SECONDS behind the playhead, 102s at the 90th percentile, and
      more than five seconds behind on 78% of frames -- while the card sat in
      present tense, in the position of a caption, with a timestamp a reader had
      to compare against the scoreboard to discover was history.
      The card was never wrong. Its currency was invisible. "Last stoppage"
      states the relationship the timestamp only implied, and turns a surface
      competing with the rink for `now` into a ledger entry.
      THE KICKER IS NOT THE HEADING. The reason keeps the heading, because what
      stopped play is what the reader came to the card for; the kicker ranks it. */
   `<p class="whsay"><span class="wkick">Last stoppage</span>`
  /* HOW FAR BACK, BESIDE THE TIMESTAMP THAT ONLY IMPLIED IT. "Last stoppage"
     told the reader the card looks backwards; it never said how far, so the
     arithmetic -- card 15:02 against a scoreboard reading 14:12 -- was left to
     them while the rink moved on (Kevin: "the card stays on Last Stoppage,
     creating a bit of a disconnect"). Same period only: across a period break
     the difference in `s` is not an elapsed time, and saying so is cheaper than
     computing one. */
  +`<span class="rsn">${ESC(RSN(w.rsn))}</span> <span class="at">${sinceLine(w)}</span><br>${say}</p>`
  /* TRIMMED TO THE RESTART AND ITS SOURCE. Kevin, looking at the live offside
     card: "remove all text after 'Play restarted at the ringed faceoff dot.' We
     don't need 'TV timeout' or the 'Goalie covered the puck....' line."
     So the secondary reason, the running count and the whole tally row are gone.
     THE RULE CITATION STAYED, and that is a flag rather than a decision: it is
     provenance, test/render-whistle.test.js asserts "the provenance travels with it" as
     doctrine, and deleting it would have quietly weakened a check rather than
     answered it. One line removes it if that is the call. */
  +`<div class="whmeta">${where}${w.from?' · <span class="src">'+ESC(w.from)+'</span>':''}</div>`;}


// THE BLOCKED-SHOTS PANEL. Three things, in the order they are worth knowing:
// who stopped what, the teammate case when there is one, and the archive share
// that makes the per-game number mean anything.
//
// NO WIN RATE, AND THAT IS A RULING RATHER THAN AN OVERSIGHT. "The team that
// blocked more won X% of the time" is not publishable at any sample size: the
// blocks leader is the attempts trailer 81.7% of the time and the archive
// already says the attempts leader loses 54.5%, so the reference class is
// "teams that were being outshot" and the sentence teaches nothing once that is
// stated. What ships is a SHARE OF A POPULATION, which has no winner in it and
// so no causal reading to misread (CHENG, docs/blocked-shots-layer.md §5, §7).
/**
 * ONE PICTURE, TWICE — the game assembling, the archive settled.
 *
 * Kevin: "the shots blocked card needs to be trimmed down and somehow made more
 * impactful... 2½ lines of text that doesn't provide the educating moment."
 * Measured first (docs/blocked-card.md): the card was 26% of a 1100x900
 * viewport and 47% of a phone, and 30-38% of it was archive prose re-rendering
 * identically on all 281 frames.
 *
 * WHAT WAS MISSING WAS NOT STYLING, IT WAS THE OTHER HALF OF THE CLAIM. The
 * archive line asserts TWO things -- 51.9% never reach the goalie, 27.8% are
 * blocked -- and the game-scoped sentence mirrored only the smaller one. A
 * novice was told a startling number about 491,971 attempts and handed nothing
 * to check it against.
 *
 * AND THE MOMENT IS THE BAR, in the only form the EVENT/CONDITION rule allows.
 * A sentence re-reads identically at every frame; a bar MOVES when the thing it
 * measures happens -- the same grammar as the attempt counters bumping, which is
 * already how this page says "that just happened" without narrating it. Both
 * rows are conditions: recomputable from the state at the playhead alone.
 *
 * IT SAYS NOTHING ABOUT THE DIFFERENCE, and that is the load-bearing decision.
 * "Normal" was the obvious word and is the one word this cannot use: every card
 * here says one game is one game, and describing a game as pulling toward or
 * away from normal makes a gap read as a fact ABOUT THIS GAME -- at the fourth
 * attempt the share is 1 of 4 and the gap is noise. The data settles it too. In
 * game 2025030416 the headline matches to a third of a point (52.1 against
 * 51.9) while blocked runs 5.4 low and missed 5.7 high, in opposite directions.
 * Any sentence about converging would have had to pick a story and would have
 * picked the wrong one. Two aligned bars say all of it and claim none of it.
 *
 * COUNTS ON THE GAME ROW, PERCENTAGES ON THE ARCHIVE ROW, and the asymmetry is
 * the point rather than untidiness: a percentage on sixteen attempts swings
 * fifty points (it was deleted from this very card for that), and on 491,971 it
 * is the honest form. The row that can carry one does; the row that cannot does
 * not.
 *
 * EACH ROW STATES ITS OWN SCOPE, because they can disagree. `L` is the corsi
 * ledger and honours `Even strength only`; the archive figure has no strength
 * split and is all situations. The old card had that mismatch too and said
 * nothing -- putting the two side by side would have made an unstated mismatch
 * into an invited comparison.
 */
/* THE ROW'S TITLE IS THE CLAIM; THE BAR IS WHAT THE CLAIM IS MADE OF.
   The first build of this drew the three segments and DROPPED the headline --
   "over half never reach the goalie" -- which is the one number §4 of the audit
   says the card exists to make checkable. The split was visible and the thing it
   was a split OF had vanished. Caught by the panel's own win-rate test, which
   asks for `51.9%` by value; a design that shows a composition and never names
   the total it composes is the same defect as a chart with no axis. */
function mixRow(cls,title,claim,scope,parts){
 const tot=parts.reduce((t,p)=>t+p.v,0)||1;
 let x=0;
 const rects=parts.map(p=>{const w=100*p.v/tot;
   const r=`<rect class="${p.k}" x="${x.toFixed(3)}" y="0" width="${w.toFixed(3)}" height="8"/>`;
   x+=w;return r;}).join('');
 const keys=parts.map(p=>`<span><i class="${p.k}"></i>${p.pct
   ?`<b>${(100*p.v/tot).toFixed(1)}%</b> ${p.lab}`
   :`<b>${p.v}</b> ${p.lab}`}</span>`).join('');
 /* THE CLAIM GETS ITS OWN LINE, AND THE REASON IS WHO IS HOLDING THE DEVICE.
    Title, claim and scope in one wrapping flex gives four ragged lines on a
    phone. Both layouts were measured: inline is 320px at 1100 and 538 at 390;
    stacked is 341 and 516. The first version of this comment took the inline
    one because "Kevin's stated viewing perspective is the laptop" -- and then
    Kevin: "I use a laptop but my wife will use her phone to view the site."
    SHE IS THE NOVICE TESTER. The audience this whole site is built for is on the
    smaller screen, so 21px of laptop buys 22px of phone and the trade reverses.
    A layout optimised for the person who already understands the product is the
    wrong optimisation, and it was one question away from being caught. */
 return `<div class="mix ${cls}"><p class="mixhd">${title}<span class="n">${scope}</span></p><p class="mixcl">${claim}</p>`
  +`<div class="mixbar"><svg viewBox="0 0 100 8" preserveAspectRatio="none">${rects}</svg></div>`
  +`<p class="mixkey">${keys}</p></div>`;}
function drawBlocked(B,L,slice){
 const mate=B.teammate.length,unk=B.unknown.length;
 /* THE PER-TEAM COUNTER ROW IS GONE, AND ON MERIT RATHER THAN FOR SPACE (CHENG).
    `12 · 7 · SHOTS BLOCKED` is the confounded comparison rendered as a
    scoreboard. This layer's own audit established that blocks are a near-mirror
    of the attempt count -- the team blocking more was the team attempting fewer
    81.7% of the time -- so a reader seeing 12 against 7 concludes something about
    grit or defensive commitment when they are looking at the attempt
    differential backwards. That is the reading the audit spent its length
    killing, and cutting the row removes it structurally instead of disclaiming
    it. It was also the largest single saving on the list: 48px at every width. */
 // WHAT HAPPENED TO EVERY ATTEMPT, from the SAME ledger the counters come from,
 // classified by the feed's own event type. `reached the goalie` is a shot on
 // goal or a goal, which is exactly how the archive's `reachedTheGoalie` is
 // derived -- so the two rows are the same quantity and not two similar ones.
 const g={r:0,b:0,m:0};
 L.counted.forEach(id=>{const t=slice[id].type;
   if(t==='blocked-shot')g.b++;else if(t==='missed-shot')g.m++;else g.r++;});
 const att=L.counted.length;
 // THE SAME FRAME, EACH IN ITS OWN UNIT, AND BOTH NAMING THEIR DENOMINATOR.
 // Kevin: "this game shows 5 of 12 and the archive shows a percentage — two
 // different units expressing the information." True, and it cannot be fixed by
 // picking one unit: the denominators are 12 and 491,971, and a percentage lies
 // about the small one (one block moves it eight points; that exact defect was
 // deleted from this card a day earlier, its third instance) while a raw
 // fraction is unreadable on the big one.
 // So the FRAME is made identical -- `<value> of <n> attempts never reach...` in
 // both -- and each denominator is stated inside the claim rather than off in the
 // scope. The units then differ visibly BECAUSE the denominators do, which is the
 // thing worth teaching rather than a puzzle left for the reader.
 /* WHY IT COULD MATTER, AND IT IS A DISAGREEMENT RATHER THAN AN IMPLICATION.
    Kevin: "we provide the data but we don't offer why it could matter." The one
    shape that survives this project's constraints is not "this predicts the
    winner" but "this counts something the familiar number does not"
    (docs/why-it-matters.md §2). Both numbers are already on the card; the
    sentence is what turns a subtraction most readers will not perform into the
    point of the layer.
    THE NUMBER IS THE BOX SCORE'S OWN. The NHL's `shots on goal` is saves plus
    goals, which is `shot-on-goal + goal` -- exactly how this card already defines
    `reached the goalie`. So it is the same quantity, not a near-equivalent.
    ONLY AT ALL SITUATIONS. With the even-strength filter on, `g.r` is the
    even-strength shots on goal and no box score reports that, so the sentence
    would be false about the thing it names. It says nothing then rather than
    saying it loosely -- the same answer the whistle layer gets in §3 of the
    audit, for the same reason. */
 const why=(att&&!evenOnly)?`<p class="mixwhy">A box score would show <b>${g.r}</b> `
   +`${g.r===1?'shot':'shots'}. This game has had <b>${att}</b> `
   +`${att===1?'attempt':'attempts'}.</p>`:'';
 const game=att?mixRow('game','This game',
   `<b>${g.b+g.m}</b> of <b>${att} ${att===1?'attempt':'attempts'}</b> never reached the goalie`,
   `${MODE()}`,
   [{k:'r',lab:'reached the goalie',v:g.r},
    {k:'b',lab:'blocked by a body',v:g.b},
    /* ⭐ C8 — THE ROW LABEL WAS FALSE FOR 7.3% OF WHAT IT COUNTS. "missed the net"
       is the league's name for the CATEGORY and not a description of every event
       in it: hit-left-post, hit-right-post and hit-crossbar are 7.3% of missed
       shots across the archive, and a puck off the post did not miss the net.
       The caption now describes each one; this is the ledger, so it names the
       bucket in words true of everything inside it. */
    {k:'m',lab:'missed the net or hit the frame',v:g.m}])
  :`<p class="bksay">Nothing shot yet — no attempts in what you have watched so far.</p>`;
 // 7.8% of blocks across the archive are by the shooter's own side. It is real
 // hockey and it is the thing a novice has never considered, so it is stated
 // rather than folded into a total nobody can take apart.
 // AND THE WORDING HAD TO CHANGE WITH THE BAR, not just shorten. It said these
 // were "in neither total above", which was true of the two per-team counters
 // and is FALSE of the bar -- they ARE among its blocked shots. A sentence that
 // refers to another element by what it contains has a dependency nothing in a
 // text file can see; the bar arriving above it made the sentence wrong without
 // touching it.
 const mates=mate?`<p class="bkmate">${mate} of ${mate===1?'those blocks hit':'those blocks hit'} a teammate — `
   +`still blocked, but nobody defended ${mate===1?'it':'them'}, so neither bench is credited.</p>`:'';
 const un=unk?`<p class="bkmate">${unk} carried no blocker we could resolve, and ${unk===1?'is':'are'} in neither total.</p>`:'';
 // THE ARCHIVE ROW IS NO LONGER READ-ONCE PROSE, so it is no longer a candidate
 // for R's treatment: it is half the picture, and gating it would delete the
 // comparison rather than trim it. What shrank instead is its limit line, from a
 // paragraph to one line -- the population and the one caveat that a share of
 // attempts is not a rate of winning.
 // Absent on the inlined page, which reaches nothing -- and it says WHICH of
 // those two it is rather than implying a failure. Same rule as `noCurveReason`.
 const M=RATES&&RATES.attemptMix, BT=M&&M.byType;
 const arch=BT&&M.blocked&&M.blocked.n
  ?mixRow('arch','The archive',
    `<b>${(100*M.neverReachedTheGoalie.rate).toFixed(1)}%</b> of <b>${M.blocked.n.toLocaleString()} attempts</b> never reach the goalie`,
    `${M.games.toLocaleString()} games · ${ESC(M.blocked.population)} · all situations`,
    [{k:'r',lab:'reached the goalie',v:(BT['shot-on-goal']||0)+(BT.goal||0),pct:1},
     {k:'b',lab:'blocked by a body',v:BT['blocked-shot']||0,pct:1},
     {k:'m',lab:'missed the net or hit the frame',v:BT['missed-shot']||0,pct:1}])
   /* THE CAVEAT IS GONE, AND NOT FOR SPACE. "A share of the attempts taken, not
      a rate of winning" was compensating for an ambiguity THE NEW FRAME REMOVED.
      It was written when the line read "27.8% are blocked by a body" and never
      said what the 27.8% was OF -- a bare percentage beside two team names can be
      misread as a win rate, and CHENG's ruling on this panel exists because that
      misreading is the one a novice makes. `51.9% of 491,971 attempts never reach
      the goalie` cannot be read that way: every number on this card now names its
      own denominator. The guard survives it -- the panel's win-rate test is on
      the PROSE, and asks that no outcome verb appears here at all.
      What the line also carried -- the games count and the population -- was
      doctrine and has moved into the row's scope, where it is always visible
      rather than in a paragraph below the fold on a phone. */
  :`<p class="bkarch">No archive comparison shown — ${RATES===undefined?'this page carries a single game and never asks for the archive':'the archive shares could not be loaded'}.</p>`;
 /* ⭐ B4 — THE LEDGER SAYS WHEN, and this panel had no `when` at all. Every
    figure on it is an aggregate over the whole game so far, which is honest and
    is not what a viewer watching a dimmed rink wants to know: with the layer on,
    everything but blocks is faded, and nothing said how long ago the last one
    was. Measured on the reference game, the most recent block is a MEDIAN 50
    SECONDS behind the playhead, p90 153s, and more than five seconds behind on
    92% of frames -- worse than the 36s/84% that earned the whistle card its
    retrospective kicker.
    CHENG's ruling was NO to a per-event card and yes to this: "a card showing
    the most recent event of the active layer, headed retrospectively, exactly
    as the whistle card is now." One narrator, many ledgers -- so the sentence
    is the NARRATOR'S OWN, `blockedSay`, and not a second wording of it. */
 const bi=B.counted.length?B.counted[B.counted.length-1]:null;
 const lastB=(bi!=null&&slice[bi]&&slice[bi].type==='blocked-shot')?slice[bi]:null;
 const lastly=lastB
  ?`<p class="whsay bklast"><span class="wkick">Last blocked shot</span>`
   +`<span class="rsn">${ESC(blockedSay(lastB,true))}</span> `
   +`<span class="at">${sinceLine(lastB)}</span></p>`
  :'';
 $('blockPanel').innerHTML=lastly+game+why+mates+un+arch;}

/* WHAT A FIRST-TIME VIEWER IS TOLD, and it answers three questions Kevin
   predicted a casual fan would ask, in his words:
     "where should I click"          -> press play, then add a layer
     "why should I click there"      -> to see WHY one team was on top
     "what's corsi (and why do I care)" -> the archive's own inversion
   THE HOOK IS A FACT ABOUT HOCKEY, NOT ABOUT THIS GAME. "This game is unusual"
   was the earlier proposal and Kevin killed it: unusual is stated in a
   vocabulary a novice has not learned, and it is the LAST thing you learn, not
   the first. You learn what an attempt is, then that the team with more of them
   usually loses, and only then can you judge one game against that. So the line
   below is true of every game and needs no prior knowledge -- which is exactly
   what eventually lets a viewer decide for themselves what is unusual.
   THE COPY IS A DRAFT AND THE SEAM IS THE POINT (Kevin's own rule: mechanism,
   not policy). The novice test revises these words; it should not have to
   revise the machinery. */
function drawNewcomer(){
 const el=$('newcomer'); if(!el)return;
 const R2=RATES&&RATES.baseRates&&RATES.baseRates.moreAttemptsLost;
 // The site's whole reason to exist, stated on the page that DEMONSTRATES it.
 // It has been on the homepage and nowhere a visitor to this page could read it.
 const why=R2&&R2.n
   ?`<span class="nwhy">Across the whole archive, <b>the team with more shot `
    +`attempts loses more often than it wins</b> — ${R2.count.toLocaleString()} of `
    +`${R2.n.toLocaleString()} games. <b>Control</b> counts those attempts, so you can `
    +`watch it happen.<span class="lim">${ESC(R2.population)} · one game is still one game.</span></span>`
   :'';
 // SPLIT BY SUBJECT, and measuring is what forced it. Whole, above the rink,
 // this block ran to 478px on a 390px phone -- the rink ended at 899 and the
 // play button at 914, against a fold of 844. It told a first-time viewer to
 // press a button that was not on their screen.
 // So the instruction lives where PLAY is, and the reason to add a layer lives
 // where the LAYERS are. Same rule as the control notes, one level up: a
 // sentence belongs beside the thing it is about.
 // NO POSITIONAL WORD. It read "Press ▶ Play from start BELOW", and measured in
 // a browser that claim holds at 390x844 with 171px to spare and FAILS at
 // 360x640 by 21px -- the button entirely off screen for the one reader the
 // sentence addresses. Splitting this block was the fix for exactly that defect
 // at 390; nobody re-measured it smaller, and a margin that survives one
 // viewport is a constant that drifts with the next one.
 // The structural fix is to stop making the claim. The button's own label is
 // quoted verbatim, which is what a reader searches for, and a sentence that
 // asserts no position cannot have a stale one at any width. Same rule that
 // stopped this paragraph enumerating the layers.
 el.innerHTML=`<b>New here?</b> Press <b>▶ Play from start</b> and just watch — every play `
  +`is named as it happens, and goals are called with the <b>scorer and assists</b>. `
  +`Nothing is invented: every number here comes from the league's own record of the game.`
  +`<button class="ndone" id="nDone">I have got the hang of it — hide this</button>`;
 const w=$('newcomerWhy');
 if(w)w.innerHTML=`<b>Why add a layer?</b> Because the obvious reading of a game is often `
  +`the wrong one.`+why
  +`<span class="nwhy">Every layer shows its work — the events it counted, the ones it did `
  +`not, and why.</span>`;
 $('nDone').addEventListener('click',()=>{
  // An explicit dismissal outranks the counter, and it is remembered. A tip you
  // cannot turn off is an advert.
  try{localStorage.setItem('rtg.seen',new Date().toISOString().slice(0,10)+'|99');}catch(e){}
  document.getElementById('rg').classList.remove('newcomer');});}
document.getElementById('rg').classList.toggle('newcomer',NEWCOMER);
drawNewcomer();
let corsiOn=false,hdOn=false,goalieOn=false,whistleOn=false,blockOn=false;
function setCorsi(){document.getElementById('rg').classList.toggle('corsi',corsiOn);$('lyCorsi').setAttribute('aria-pressed',corsiOn);$('lyCorsi').textContent=(corsiOn?'✓ ':'＋ ')+'Control (Corsi)';if(!corsiOn&&workOpen){workOpen=false;$('workPanel').hidden=true;$('work').setAttribute('aria-expanded',false);$('work').textContent='Show me the work';}}
function setHd(){document.getElementById('rg').classList.toggle('slot',hdOn);$('lyHd').setAttribute('aria-pressed',hdOn);$('lyHd').textContent=(hdOn?'✓ ':'＋ ')+'Shots from the slot';render(i,'');}
$('lyCorsi').addEventListener('click',()=>{corsiOn=!corsiOn;setCorsi();});
// One code path owns the mode label, so the markup cannot drift from the state.
// The static HTML carries a default only so the page reads correctly before JS.
function syncStrength(){
 const v=evenOnly?'even':'all';
 document.querySelectorAll('#rg .sbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===v));
 // EVERY site that shows this quantity carries the mode. The scoreboard is the
 // prominent one and was the unqualified one -- same number, two places, one
 // of them saying what it was measured under (CHENG).
 const lbl=MODE().toUpperCase();$('mA').textContent=lbl;$('mH').textContent=lbl;$('pMode').textContent=lbl;}
function setStrength(v){evenOnly=(v==='even');syncStrength();render(i,'');}
document.querySelectorAll('#rg .sbtn').forEach(b=>b.addEventListener('click',()=>setStrength(b.dataset.s)));
syncStrength();
function syncTrails(){document.querySelectorAll('#rg .tbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===trails));}
document.querySelectorAll('#rg .tbtn').forEach(b=>b.addEventListener('click',()=>{
 trails=b.dataset.t;syncTrails();render(i,'');}));
syncTrails();
function syncFig(){document.querySelectorAll('#rg .fbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===figStyle));}
document.querySelectorAll('#rg .fbtn').forEach(b=>b.addEventListener('click',()=>{
 figStyle=b.dataset.f;try{localStorage.setItem('rtg.fig',figStyle)}catch(e){}syncFig();render(i,'');}));
syncFig();
$('lyHd').addEventListener('click',()=>{hdOn=!hdOn;setHd();});
function goalieStats(k){return goaltending.reduce(upto(k),CTX).g;}
function setGoalie(){document.getElementById('rg').classList.toggle('goalie',goalieOn);$('lyGoalie').setAttribute('aria-pressed',goalieOn);$('lyGoalie').textContent=(goalieOn?'✓ ':'＋ ')+'Goaltending';render(i,'');}
$('lyGoalie').addEventListener('click',()=>{goalieOn=!goalieOn;setGoalie();});
function setWhistle(){document.getElementById('rg').classList.toggle('whistle',whistleOn);$('lyWhistle').setAttribute('aria-pressed',whistleOn);$('lyWhistle').textContent=(whistleOn?'✓ ':'＋ ')+'Why play stopped';render(i,'');}
$('lyWhistle').addEventListener('click',()=>{whistleOn=!whistleOn;setWhistle();});
function setBlock(){document.getElementById('rg').classList.toggle('blocked',blockOn);$('lyBlock').setAttribute('aria-pressed',blockOn);$('lyBlock').textContent=(blockOn?'✓ ':'＋ ')+'Blocked shots';render(i,'');}
$('lyBlock').addEventListener('click',()=>{blockOn=!blockOn;setBlock();});
/* ⭐ THE GAME OPENS BEFORE THE FIRST PLAY -- on the state, not on a play.
   It used to open on the LAST event, which put the final score, the finished
   counters and -- on a shootout game -- the shootout notice on screen before a
   viewer had pressed anything. "Defaulting to the end kinda spoils the surprise"
   (Kevin), and it is worse than a spoiler on a replay site: the whole product is
   watching a count get MADE, and arriving at the made count is arriving after
   the thing you came for.
   It also fixed the shootout narrative appearing first on game 2025021235 --
   that notice belongs at the end of the replay because that is when it happens,
   and it was only ever early because the page started there.

   THEN IT OPENED ON THE OPENING FACEOFF, AND THAT WAS STILL ONE PLAY TOO FAR.
   Kevin, on a BUF @ WSH replay he had just opened: "we identify WSH as 'won the
   faceoff', even before the game has started." The board read PERIOD 1 · 20:00
   LEFT -- the clock a period carries before it starts -- and the ice already
   named the winner of the draw.
   NOTHING IN THAT PAIR IS FALSE, which is why it survived so long: the league
   stamps the opening faceoff at 00:00 elapsed and a real clock reads 20:00 until
   the puck is dropped, so the draw IS won at 20:00. Moving the clock to make the
   sentence sit better would be inventing a time. What was wrong is that this
   frame was the RESTING state -- handed to a visitor who had pressed nothing, so
   a play nobody asked for read as the state of the world. A page whose headline
   is "watch first" was opening on a result.
   THE RULE IS THE VERDICT CARD'S, and it is already written one screen up:
   absent until there is one. That card's own comment claims opening at the
   faceoff was "the same move" -- it was not. The card became absent; the caption
   did not.
   SO THE ABSENCE OF `at` IS NOT A REQUEST FOR THE FIRST PLAY. A link that names
   a moment is honoured exactly as before: the learn page's nine doors each ask
   for one, and landing them a frame early would open a door onto an empty rink.
   The preview keeps its own opening (below) for the same reason in reverse --
   five seconds of hockey on the front page cannot start with a blank rink.
   PERIODS 2 AND 3 ARE DELIBERATELY UNCHANGED. Their opening draws carry the same
   20:00 stamp, but they are reached by moving THROUGH time rather than by
   arriving, and the frame before them is the end of the previous period, so
   nothing there claims that nothing has happened. Whether they earn a beat of
   their own is a period-boundary question, which is B1's ground. */
drawRink(1);
/* THE LINK, APPLIED — and keyed off the layers' OWN ids, so a rename cannot
   leave this table pointing at a token nothing answers to. `?layer=slot` is the
   public name of the slot layer for the same reason the label is: a URL
   survives copy-paste and forum posts long after page copy changes. */
const LAYER_APPLY={
 [corsi.id]:()=>{corsiOn=true;setCorsi();},
 [danger.id]:()=>{hdOn=true;setHd();},
 [goaltending.id]:()=>{goalieOn=true;setGoalie();},
 [whistle.id]:()=>{whistleOn=true;setWhistle();},
 [blocked.id]:()=>{blockOn=true;setBlock();},
};
if(LINK.strength==='even'){evenOnly=true;syncStrength();}
LINK.layers.forEach(t=>{const f=LAYER_APPLY[t];if(f)f();});
const AT=resolve(G.events,LINK.at);
/* A SENTENCE ONLY WHEN WE COULD NOT HONOUR THE LINK. `exact:false` on its own
   is silent: a clock nothing happened at is a perfectly good moment and the
   page shows the last thing that did happen. Apologising for every inexact
   landing would apologise on most honest links. */
$('atnote').textContent=AT.why?AT.why.text
 :(LINK.problems.some(p=>/^at[:.]/.test(p))?LINK_NOTES.unreadable.text:'');
prevA=0;prevH=0;
/* WHERE THE PAGE OPENS. `resolve` answers index 0 both when a link asked for the
   first play and when no link asked for anything, so the question is put to
   `LINK.at` -- did a URL name a moment at all -- and never to the frame it
   resolved to. An `at=` we could not read leaves `LINK.at` null and has already
   written its own sentence into `atnote` above, so that visit opens where every
   unadorned visit opens and says why it is not where it was sent. */
/* NOT `|| PREVIEW`. The first draft carried one, on the reasoning that a blank
   rink must never reach the front page -- and a mutation proved the term was
   unobservable: `if(PREVIEW)` below sets its own opening frame synchronously in
   BOTH of its branches, before anything is painted. A test written to protect
   the term passed with the term removed, which is the check-with-no-instrument
   this project keeps finding. The hero's opening is the preview loop's business
   and is asserted there instead. */
const OPEN=LINK.at?frameOf(AT.index):-1;
set(OPEN,OPEN<0?'':'jump');
/* THE PREVIEW LOOP.
   Deliberately NOT the ordinary play loop: `dwell()` paces a game for someone
   watching it, easing for the big moments, and a taste has about five seconds.
   So preview steps at a fixed interval and restarts, and it starts where the
   game starts -- the same reason the page itself no longer opens at the final
   whistle.

   THE PACE IS NOT A NUMBER WE PICK. IT IS `dwell`, WHICH IS THE PRODUCT'S.

   Two wrong answers came first, and the second is the instructive one. The
   original fitted 44 events into five seconds -- 115ms each -- and Kevin read it
   exactly right: "a blur of activity, looks like it's 100x real-time". It was.
   A play-by-play event lands roughly every nine seconds of real hockey, so 115ms
   is about 78x, and eleven times this page's own teaching pace.

   The fix was a slower chosen constant, 430ms. Kevin again: "definitely better,
   still 2 or 3x too fast". Which lands almost exactly on `dwell` -- and that is
   the answer, not a third guess. A preview slower than the replay misrepresents
   it and a preview faster than the replay misrepresents it, so the preview runs
   at the replay's pace, full stop. `dwell` also EASES for the big moments, so
   five seconds of taste has the product's rhythm rather than a metronome's.

   THE COUNT IS THEN DERIVED, NOT CHOSEN. One number survives -- how long the
   loop runs before it restarts -- and the window is however many events fit in
   it at the real pace. Change `dwell` and the window follows on its own; the two
   can no longer drift apart, which is what a second constant would guarantee.

   BUDGET_MS is still a visual judgement and cannot be derived. It is here to be
   looked at, not proved. (docs/site-purpose.md 5.)

   RAISED 14s -> 30s BY KEVIN, LOOKING AT IT: "too short of a replay -- more time
   to process what's happening". What that buys, measured over 230 games at the
   real pace rather than argued: the median loop goes from 7 plays showing 3
   attempts to 16 plays showing 7. The counter stops being a number that twitches
   once and becomes one a stranger can watch accumulate, which is the entire
   reason a layer is running here.

   The upper limit this is still bounded by is the 57-second loop that a fixed
   44-event window once produced -- long enough to stop reading as a taste. Half
   a minute is a judgement between those two, and the test below states the range
   rather than this number, so the two cannot quietly become one constant twice.

   IT STOPS FOR prefers-reduced-motion. Doctrine 4 permits motion that traces a
   real event; it does not require inflicting it. Reduced motion gets a still
   frame partway in, so the rink is populated rather than blank. */
const BUDGET_MS=30000;
if(PREVIEW){
 $('rg').classList.add('preview');
 /* AND THE CHROME GOES, from the one place chrome is defined (page.py). The
    shared header and footer are real height inside a box sized for a rink. */
 document.body.classList.add('previewing');
 /* ⭐ THE PREVIEW RUNS WITH A LAYER ON, and Control is the one.

    THE HERO USED TO CONTRADICT THE HEADLINE ABOVE IT. The h1 promises "the
    counts built in front of you, so you can see where a number comes from" and
    the frame under it showed plays with no counts anywhere. The stated
    conversion is a visitor watching one game WITH ONE METRIC LAYER TURNED ON, so
    the front door was demonstrating the single configuration that is not it.

    IT STARTS AT ZERO ON PURPOSE, and the small number is the point rather than a
    cost. The persuasive Corsi sentence is "the scoreboard says 0-0, attempts say
    12-7" and none of it fits in seven plays -- but the headline does not promise
    a big number, it promises PROVENANCE, and a counter you join at 24-11 is a
    number you did not watch being built. Zero is the only honest place for
    "where a number comes from" to begin, which is the same reason the loop opens
    at the faceoff instead of the final whistle.

    CALLED THROUGH setCorsi() RATHER THAN SETTING THE CLASS. The layer's on-state
    is a class, a button label and an aria-pressed value, and reaching past the
    function for the one part the preview happens to need is how the two drift.

    THIS DELIBERATELY DOES NOT UNHIDE `.counters`. The board's `.cbar` carries the
    bar and both counts already and is outside the preview's hide list; the
    counters repeat the same two numbers larger, INSIDE the rink box, where the
    only thing they can spend is ice. And the board figures are counts, not a
    percentage -- CHENG's ruling that `11` beside `8` claims exactly what it is --
    so the compact form is not a rate that has lost its denominator. */
 corsiOn=true;setCorsi();
 /* ⭐ AND THE BOARD NAMES ITS UNIT, because in preview nothing else does.
    On the game page `.counters` says "MIN attempts / BUF attempts" and the unit
    is named; preview hides that element on purpose, so the board said CONTROL,
    the sentence below the rink said shots on goal, and NOTHING on screen said
    those were different quantities. Two unlabelled numbers that look like they
    contradict each other, which a reader takes for an error rather than a
    distinction (CHENG).
    ONLY IN PREVIEW, and only because that is the only place the companion label
    is missing. The game page keeps CONTROL, where the layer's own name is the
    useful word and the counters carry the unit two inches below. */
 $('pName').textContent='SHOT ATTEMPTS';
 /* ⭐ AND THE FRAME HANDS THE PARENT THE NUMBER IT ALREADY HAS.
    The home page describes this game in a sentence under the rink, and that
    sentence has to be about the SAME measure the bar above it shows -- Kevin:
    "they need to be the same measure". The parent cannot compute it: attempts
    are decided by `corsi`, the catalog is built in Python, and it carries the
    LEAGUE's quoted numbers rather than any of ours.

    IT DOES NOT NEED TO. This frame already holds the extract and has already run
    the reducer on it (CHENG). Storing attempts in the catalog would have cost
    2,378 bytes gzipped on every visit to both pages, and made the catalog carry
    one of our own computed metrics for the first time; the parent re-fetching
    the extract costs 13,023 gzipped whenever the cache misses, and with
    `loading="lazy"` on the frame the ordering that would make it hit is not ours
    to assume. A message costs nothing and assumes nothing.

    WHOLE GAME, NOT THE LOOP'S WINDOW. The sentence is about the game the way the
    score is; `evenOnly:false` is stated for the same reason it is stated above.
    Same origin both ways -- the target is named rather than '*', and the parent
    checks the origin it came from. */
 if(window.parent!==window){
  const fin=corsi.reduce(G.events,{...CTX,evenOnly:false});
  window.parent.postMessage({rtg:'attempts',game:(G.game&&G.game.id)||0,
   a:fin.t[AID]||0,h:fin.t[HID]||0},location.origin);}
 /* ⭐ AND IT BEGINS WHERE THE LAYER FIRST HAS SOMETHING TO SAY.
    Kevin refreshed the front door and the counter sat at 0-0 for the whole loop.
    Measured over 230 games rather than guessed at: the counter is still empty
    after 14 seconds in 6% of games -- but the hero is THE MOST RECENT GAME, and
    between June and October that is one frozen fixture, so a 6% tail is 100% of
    the experience for four months. This game opens with EIGHT plays that count
    for nothing: faceoffs, hits and giveaways.

    THE START IS THE FIX, NOT THE LENGTH, and the measurement is unambiguous. At
    the same 14s budget this hero goes from a counter of 0 to a counter of 4;
    stretching the loop to 30 seconds from the faceoff only reaches 4 as well. The
    start rule buys more than doubling the loop and costs no wall time at all.
    (Kevin's other idea, the whole first period, is 2.7 minutes at the median --
    and running the preview faster to fit it is the one thing settled above as
    never allowed.)

    NOTHING COUNTED IS SKIPPED, so the provenance argument survives intact: by
    construction no attempt happened before the first attempt, and the counter is
    still 0-0 on the opening frame and still moves in front of you. What IS given
    up is the game's opening dead air, and that trade should be said out loud --
    the taste shows hockey slightly denser than hockey is. It stands because the
    frame is already 14 seconds standing for two and a half hours, with `Watch the
    whole game` underneath it.

    DERIVED FROM THE LAYER, NOT A CHOSEN OFFSET. There is no "start two plays
    early" constant here, because a chosen constant drifts. The definition is
    THE LAST FRAME ON WHICH THE COUNT IS STILL ZERO -- one before the layer's
    first counted event -- and that is the frame the provenance argument actually
    needs. Opening ON the first attempt would show a counter that reads 1 before
    a viewer has seen anything happen, which is the number-you-did-not-watch-being
    -built problem in miniature. Opening one frame earlier means the first thing
    on screen is 0-0 and the very next thing is it moving.

    One reduce over the whole game, the same call `lens` makes per frame, so the
    index cannot disagree with the number the board shows when it gets there. */
 const START=(()=>{const c=new Set(corsi.reduce(G.events,CTX).counted);
  for(let k=0;k<EV.length;k++)if(c.has(EVI[k]))return Math.max(0,k-1);
  return 0;})();
 let acc=0,W=START;
 while(W<EV.length-1&&acc+dwell(EV[W])<=BUDGET_MS){acc+=dwell(EV[W]);W++;}
 const BUDGETED=Math.max(START,W);
 /* ⭐ AND THE LOOP ENDS ON THE GOAL WHEN THERE IS ONE IN REACH.
    Kevin: "let's end the hero replay right after the goal". BUDGET_MS stops
    being the loop's length and becomes its BOUND -- the taste now ends on the
    one event this renderer gives a real moment to, instead of wherever thirty
    seconds happened to run out. Build-up, payoff, restart.

    THE LENGTH IS THEREFORE THE DATA'S, NOT A NUMBER WE PICK, which is the same
    move START made at the other end: the opening frame is the last one on which
    the count is still zero, and the closing frame is the first goal. Two ends,
    both derived, and BUDGET_MS is left holding only the case where the archive
    hands us a game with no goal nearby.

    THE HERO IS CHOSEN SO THIS FIRES. builders/build_index.py picks the most
    recent game whose first goal is 3 to 8 plays after the opening frame -- about
    six to fifteen seconds at this pace. When it cannot (a small archive, a run
    of goalless openings) the fallback is the newest game, this search finds
    nothing, and the loop runs its budget exactly as it did before. */
 const GOAL=(()=>{for(let k=START;k<=BUDGETED;k++)
   if(EV[k]&&EV[k].type==='goal')return k;return -1;})();
 const WINDOW=GOAL>=0?GOAL:BUDGETED;
 if(REDUCED){set(WINDOW,'');}
 else{let k=START;
  /* THE RESTART PAUSE USED TO BE DEAD CODE. It read
       set(k);k++;if(k>WINDOW){k=0;}
       setTimeout(tick,k>WINDOW?900:115)
     -- and k had already been reset to 0 by the time the ternary asked, so the
     900 never fired once. The loop restarted at full speed, which is its own
     small contribution to the blur. Decide the wait BEFORE moving k. */
  /* THE LAST FRAME IS HELD LONGER WHEN IT IS A GOAL, because the goal's own
     moment is still running: the flare is 0.7s, the net flash 1.3s, and the
     siren caption 2.2s (`@keyframes cap`, src/app.css). Restarting at 1500 would
     cut the caption off mid-sentence and the loop would swallow the payoff it
     was just rebuilt to deliver. Guarded by a test that reads the duration out
     of the stylesheet rather than restating it here. */
  const GOAL_HOLD_MS=2600;
  const tick=()=>{
   const shown=EV[k],last=k>=WINDOW,
    wait=last?(GOAL>=0?GOAL_HOLD_MS:1500):dwell(shown);
   set(k,k>0?'play':'');
   if(last){k=START;prevA=0;prevH=0;}else{k++;}
   setTimeout(tick,wait);};
  tick();}}
}
__BOOT__
