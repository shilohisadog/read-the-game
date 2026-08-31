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
/* ONE FIGURE, AND `figTabletop` IS NOT DEAD CODE. The picker is gone from this
   page; `src/goalie-eye-view.html` still offers both and carries its own copy of
   the module, so the alternative figure has a live caller and a live test. What
   went is the CONTROL and the cross-page `rtg.fig` preference it wrote -- a
   setting made on another page, applied here through a control this page no
   longer has, is a state nothing on screen accounts for. */
const figStyle='mascot';
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
/* ⭐ THE FRAMES AT WHICH A PENALTY WAS KILLED — Kevin, watching a replay event
   by event: "I was wondering why don't we say when the penalty expires."
   Measured across 60 archive games: 308 power plays end and 78.6% of them end
   because the penalty ran out, with NO EVENT IN THE FEED and nothing on the page
   saying so. The scoreboard pill goes dark and that is the whole announcement.

   ⭐ COMPUTED ONCE, AND KEYED BY THE EVENT OBJECT. `captioned` takes one event
   and nothing else -- it is the single predicate `dwell` and `render` share, and
   that shared-ness is the mechanism that makes a caption with no pause behind it
   impossible (docs/event-timing.md). A kill depends on the PREVIOUS frame, so
   widening `captioned`'s signature would have split the two readers apart. A Map
   from the event object answers in O(1) without touching it, for the same reason
   `PBOX` above is computed once: a penalty being killed is a property of the
   GAME, and only the query is a property of the moment. */
const KILLED=new Map(penaltyKilled(EV,PBOX,CTX).map(k=>[EV[k.at],k]));
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
const BOARD={x:1,y:1,w:198,h:83,r:27};
/**
 * Where the boards are at an SVG x — the top and bottom of the playing surface
 * at that point. Straight section: the full height. Inside a corner: on the arc.
 */
function boardsY(sx){
 const L=BOARD.x,R=BOARD.x+BOARD.w,T=BOARD.y,B=BOARD.y+BOARD.h,r=BOARD.r;
 const cx=sx<L+r?L+r:sx>R-r?R-r:null;
 if(cx===null)return[T,B];
 const dy=Math.sqrt(Math.max(0,r*r-(sx-cx)*(sx-cx)));
 return[T+r-dy,B-r+dy];
}
function drawRink(per){if(per===rinkPer)return;rinkPer=per;const P=[];P.push(`<rect class="boards" x="${BOARD.x}" y="${BOARD.y}" width="${BOARD.w}" height="${BOARD.h}" rx="${BOARD.r}"/>`);
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
/**
 * ⭐ THE STANDING CONDITION ON THE SCOREBOARD — a power play or a pulled goalie,
 * for as long as it is true. Kevin: "we announce the penalty, but we don't
 * retain the power play on the caption pill, maybe we should?"
 *
 * ⭐ WHY THIS IS NOT THE CAPTION PILL, MEASURED. Across 60 archive games, 77.6%
 * of power-play windows contain at least one caption-worthy event (a goal, a
 * penalty, a shot from the slot) -- the power play is exactly when those happen.
 * A standing fact parked in the page's busiest transient surface would be
 * fighting for it precisely when both matter. So the CONDITION sits here and the
 * CHANGE stays on the caption: the split box.js already draws between occupancy
 * and strength, one surface each.
 *
 * ⭐ AND IT IS `standing()`, WHICH SHARES `relativeTo` WITH THE LEDGER'S
 * SENTENCE. Whose skaters is the only part of this that has ever been wrong --
 * it shipped backwards once, in 36 of one game's 103 exclusions -- and a badge
 * that sits on screen for a two-minute power play is wrong for longer than a
 * ledger line nobody scrolls to.
 *
 * ONLY ON CHANGE, for `drawNetmen`'s reason one function up: this is read on
 * every frame of a ~250-event game and touching the DOM each time would restart
 * whatever the chip ever animates with.
 */
let pillIs=null;
function drawPill(e){
 // NO CODE MEANS NO CLAIM. Before the first event there is no `sit` at all, and
 // an unreadable one (five-on-three, 3-on-3 overtime, the shootout -- 1.4% of
 // coded events) is refused by `situation` rather than guessed. Both arrive here
 // as null, and a badge that stays lit on a state we cannot read is worse than
 // no badge, because it is wrong for minutes rather than for a frame.
 const b=e?standing(e.sit,CTX):null;
 const now=b?`${b.id}|${b.said}|${b.count}`:'';
 if(now===pillIs)return;
 pillIs=now;
 const p=$('ppill');
 if(!b){p.hidden=true;return;}
 p.className='ppill '+(b.id===AID?'a':'h');
 p.dataset.ab=b.ab;
 /* ⭐ THE STATE, NOT THE ARITHMETIC — and the pixels are what found the reason.
    `WSH POWER PLAY · 5 ON 4` measures 189px in a real browser. The clock row has
    167px of spare beside it at 390 and the middle column is 150px at 1100, so at
    189 the board GREW 151->176 on a phone and the middle column widened 150->343
    on a laptop, eating the team columns. `power play` alone is 135px and clears
    both. That is the constraint; this is why the answer is also right:
    `b.count` is carried by `standing()` and spent ONCE, by the caption, at the
    frame the power play begins. A badge that repeats "5 on 4" for two minutes is
    the wallpaper this surface exists to avoid -- the CONDITION reminds, the
    CHANGE explains. */
 p.textContent=b.said;
 p.hidden=false;}
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
/* WHO IS SITTING, at one instant — ON THE SCOREBOARD, the way a rink shows it.
   Kevin, 2026-08-27: the penalty boxes under the ice "are (now) rather wasted
   space... let's display penalties on the scoreboard, with the offending party
   being identified under the applicable team, maybe what they went off for and
   some sort of timer that counts down."

   MEASURED FIRST, over 40 games and every rendered event:
       both boxes empty   80.4%      three or more   0.7%
       exactly one        17.7%      six, once
       two                 1.2%      both boxes at once 3.7%
   So the block is ABSENT four times in five -- no reserved space, which was the
   complaint -- and it is built for one. TWO SEATS ARE SHOWN AND THE REST ARE
   COUNTED: two covers 99.3% of events and is also what a real arena scoreboard
   has. Kevin chose the `+N`.

   ⭐ THE CLOCK COUNTS THE ASSESSED TIME, AND THAT IS NOT A DETAIL.
   `box.js` derives early release -- a minor dies when the other team scores on
   it -- so every stint already knows its TRUE end. Counting down to that would
   LEAK THE FUTURE: a clock reading 0:40 on a penalty that a goal is about to
   kill tells the viewer a goal is coming, which is the spoiler the verdict card
   and the game line already refuse. So the number shown is
   `start + min*60 - now`, the referee's clock, exactly what the arena shows --
   and the seat empties on the ICE's schedule, because `occupants` uses the true
   end. Kevin's earlier ruling on this surface ("the assessed time, not a
   countdown") is kept, not overturned: it is the assessed clock that is ticking.

   IT STEPS RATHER THAN TICKS, because the playhead is at events. A jump of two
   minutes of game time moves it two minutes, like everything else here.

   ⚠️ AND THIS IS NOT A POWER-PLAY DISPLAY. A ten-minute misconduct puts a man
   in the box and takes nobody off the ice (23 of 332 penalties measured). `sit`
   answers strength; this answers occupancy, and box.js is emphatic that the two
   are different questions. */
const SEATS = 2;
function mmss(sec){const m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`;}
function drawBoxes(secs){
 for(const [tm,id] of [[AID,'penA'],[HID,'penH']]){
   const el=$(id);if(!el)continue;
   const men=secs==null?[]:occupants(PBOX,secs,tm);
   const rows=men.slice(0,SEATS).map(s=>{
     const p=s.player==null?null:R[s.player];
     /* ⭐ A BENCH MINOR IS NAMED AS ONE, not as an em-dash. `sev: 'BEN'` -- ten
        too-many-men, two unsuccessful challenges and one bench unsportsmanlike
        in 40 games -- has no committing player in the feed, and a placeholder
        would read as "we lost his name" rather than "the league did not record
        one, because there is not one". The seat is real either way: the team is
        short two minutes and somebody serves it. */
     const who=s.player==null?'Bench':(p?p.nm:'—');
     // The assessed clock, never the served one -- see above.
     const left=Math.max(0,(s.start+s.min*60)-secs);
     return `<span class="pen${s.player==null?' pbench':''}"><span class="pw">${ESC(who)}</span>`
           +`<span class="pf">${ESC(penName(s.pen))}</span>`
           +`<span class="pt">${mmss(left)}</span></span>`;}).join('');
   const more=men.length>SEATS
     ? `<span class="pen pmore">+${men.length-SEATS} more in the box</span>`:'';
   el.innerHTML=rows+more;}}

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

/* ⭐ WHERE TO LOOK NEXT — a five-foot circle on the spot the next event will
   happen, drawn before it happens.
   THE PROBLEM IT ANSWERS, in Kevin's words: "when I do next event / prev event
   I can at least grasp what's happening on the ice, but the continuous event
   stream tells me nothing." Stepping works because the eye is already braced;
   streaming does not because every mark lands somewhere on a 200-foot sheet and
   the eye spends the interval SEARCHING rather than reading. Measured over eight
   games: the median jump between consecutive marks is 45 ft and the p90 is
   137 ft, which at a 390px viewport is 220 pixels -- more than half the screen,
   every fifth frame.

   ⭐ IT USES KNOWLEDGE OF THE NEXT EVENT, AND THAT IS THE WHOLE COST.
   The standing rule was "foreknowledge may set the pace and choose the clip; it
   may not point at the ice", and this points at the ice. Kevin spent it
   deliberately on 2026-08-28, on the argument that we are a teaching product:
   annotated chess prints the winning line. The spoiler rule is untouched --
   what is protected is the RESULT, and where to look is structure.

   ⚠️ NO SUPPRESSION ON GOALS, and the reason is not squeamishness. If the
   circle preceded every event except a goal, then its ABSENCE would announce
   one -- the same side-channel leak `drawBoxes` refuses when it declines to
   count a penalty clock down to its true end.

   IT IS GREEN BECAUSE NOTHING ON THE ICE IS. Red and blue are lines, amber is
   the slot, and the two greys are the clubs; every one of those means something
   about hockey. This means something about US, so it takes a colour that has no
   hockey job -- the `display:` provenance category, in paint.

   ⭐ `place()` IS THE ONE READER OF WHERE A MARK GOES, and the circle asks it
   the same question the mark does. Given its own coordinate arithmetic the two
   could disagree -- the circle promising a spot the mark then misses -- which is
   the one failure that would make this worse than nothing. It also inherits
   `place`'s refusals for free: an unlocated event and a shootout attempt both
   come back null, and a circle is drawn on neither.

   FIVE FEET, SHADED, AND NOT OUTLINED. The first build was a soft-edged
   18-to-32-foot gradient -- "its size is its honesty", always wider than a
   position. Kevin, looking at it: "I can't tell which area the next event is
   going to be. I just ain't seeing it." A region that can never be mistaken for
   a position cannot be read as a PLACE either, and the fix was the SIZE. A
   stroke was added at the same time and outlived its reason; see the note in
   src/app.css, where the edge is argued off on doctrine rather than on taste. */
const CUE_FT=5;
/* ⭐ AND IT CAN BE SWITCHED OFF, WHICH IS A DOCTRINE MATTER RATHER THAN A
   PREFERENCE ONE. This is the only thing on the site that uses knowledge of
   what happens next. Having spent that deliberately, the honest complement is
   letting a viewer decline it: a page whose whole claim is "nothing is invented"
   has to offer a replay with the one lookahead removed.
   ON BY DEFAULT, because the novice is who it was built for and the complaint it
   answers -- "the continuous event stream tells me nothing" -- is theirs. */
let cueOn=true;
function drawCue(i){
 const el=$('cue');if(!el)return;
 const pos=cueOn?place(EV[i+1]):null;
 if(!pos){el.innerHTML='';return;}
 el.innerHTML=`<circle class="cuef" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${CUE_FT}"/>`;}
function render(i,how){
 const moment=how==='play'||how==='jump';
 // `evs` is the PLAYABLE prefix, used to draw the marks on the timeline.
 // `lens(i)` reduces the FULL stream up to the same moment. Two different
 // slices on purpose: the ice shows plays, the ledger accounts for everything.
 const evs=EV.slice(0,i+1),L=lens(i),cur=EV[i];
 const PER=cur?cur.per:1;     // pre-game shows the first period's arrangement
 drawRink(PER);
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
 drawCue(i);
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
 /* ⭐ AND THE OTHER BRANCH IS NO LONGER EMPTY. All three of these notes used to
    say nothing until their control had already been used -- so `Tabletop` was
    explained only once you had chosen `Tabletop`, and `Even strength only`
    described itself only after you were in it. That is the 2026-08-16 principle
    (a sentence belongs beside the thing it is about, AT THE MOMENT OF USE)
    applied to a CONTROL, where it is wrong: a button has to be predictable
    before the click or it is a dare. The default branch now describes what the
    other choice would do; the active branch still carries the live count, which
    is a fact about the ice and belongs to the moment. */
 $('nSit').textContent=evenOnly
   ?`${dropped} ${dropped===1?'attempt has':'attempts have'} dropped out so far. Power plays and an empty net are still hockey — but they aren't even hockey.`
   :'Even strength only drops the attempts made on a power play or against an empty net, and says how many it dropped.';
 // THE NOTE FOLLOWS THE MODE, because the old sentence promised a whole-game
 // chart and as-played cannot deliver one.
 $('nTrails').textContent=trails!=='all'
   ?'Current moment shows the latest event only. Keep every mark leaves the attempts on the ice as they happen.'
   :ASPLAYED
   ?'Every attempt in this period stays on the ice. It clears when the teams change ends, because after that they are shooting the other way.'
   :'Every attempt stays on the ice, which builds into a shot chart by the third period — good to study, busy to watch.';
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
 drawPill(cur);
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
 drawLBox(i,L);
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
     if(!place(cur))caption(cur,'goal');}
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
   /* ⭐ THE KILL SITS BELOW GOAL AND PENALTY AND ABOVE THE SLOT SHOT, and the
      order is an argument rather than a preference. A goal or a penalty ON this
      frame is the bigger news and both already have a sentence; a penalty here
      also contradicts the kill, since a second infraction is what makes it
      four-on-four rather than an expiry. The slot shot loses because it happens
      many times a game and a kill happens 3.4 times, and because the slot layer
      has the ice to say it with while this has nothing at all. */
   else if(cur&&KILLED.has(cur)){captionKill(cur);}
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
 /* THE FRAME BEING DRAWN IS PASSED, NOT READ. `render`'s parameter shadows the
    module-level playhead, so a bare `i` inside `renderWork` would be whichever
    frame the transport last settled on -- one behind the one being drawn during
    a step. Same trap `drawLBox` names in its own comment. */
 if(workOpen)renderWork(L,cur,i);
}
function flash(id){const el=$(id);el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
/* ⭐ A SHORT-HANDED GOAL, AND THE TEST FOR ONE IS NOT "FEWER SKATERS".
   ⚠️ NAMED IN BOTH PLACES A GOAL IS ANNOUNCED, because there are two. A goal the
   feed placed is announced by its LABEL ON THE ICE; only an unplaced one falls
   through to the caption pill (`if(!place(cur))caption(...)`). Putting the tag
   in the caption alone would have shipped a feature that never appeared on a
   located goal -- which is most of them -- and a probe driving the scrubber
   would have shown nothing either way, because neither announcement fires
   unless the playhead ARRIVES at the moment.
   Kevin, 2026-08-27, having found one by scrubbing a random game: it "needs
   special emphasis (different than a power-play or even strength goal)."

   ⚠️ THE OBVIOUS IMPLEMENTATION IS WRONG FOUR TIMES IN FIVE. Over 40 published
   games there are 246 goals in play and 26 where the scoring team had FEWER
   skaters — of which only SIX had anybody in their own box. The other TWENTY are
   the opposite situation: the other team pulled its goaltender, so the scorers
   are 5 against 6 while shooting at an empty net. A badge reading SHORT-HANDED
   on an empty-net goal is not a near-miss, it is backwards, and `sit` alone
   cannot tell them apart. box.js says it in one line: fewer skaters is not the
   same as penalised.

   So both conditions, and the second is the one that carries it:
     1. the scoring team had fewer skaters (`sit`, read not predicted)
     2. the scoring team actually had somebody in the box

   ⚠️ AND THE BOUNDARY IS INCLUSIVE ON PURPOSE. `occupants` is `end > secs`, and
   the release rule sets a released stint's `end` to the goal's own second — so
   at the instant of a POWER-PLAY goal the box it just emptied already reads
   empty. Counted the other way, power-play goals came to 6 instead of 51 against
   box.js's documented 52. It does not move the short-handed number (a team's own
   goal never releases its own penalty) and it is written this way so the next
   reader does not have to rediscover why. */
function shortHanded(e){
 if(!e||e.type!=='goal'||e.pt==='SO'||!e.sit||e.sit.length!==4||e.own==null)return false;
 const home=e.own===HID;
 const mine=+e.sit[home?2:1], theirs=+e.sit[home?1:2];
 if(!(mine<theirs))return false;
 return PBOX.some(s=>s.team===e.own&&s.start<=e.s&&s.end>=e.s);}
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
 // The tag is a fact about the goal, so it sits with the label and not with the
 // scorer: "GOAL · SHORT-HANDED · #16 Name" reads as one sentence about one shot.
 const sh=kind==='goal'&&shortHanded(e)?'<span class="shg">short-handed</span>':'';
 sayCaption(side,ab,label,`${sh} · ${who}`,e);}
/* ⭐ ONE WRITER FOR THE PILL, because there are now two callers and they differ
   in WHOSE club the tag names. Every caption above is about the event's own
   team (`e.own` -- the scorer, the offender, the shooter); a penalty kill is
   about the club that was SHORT, which is by definition not the club that owns
   the frame it lands on. Building a second innerHTML for that would have put the
   pill's markup and its duration in two places, and the duration is the half
   that matters: it comes from `dwell(e)`, which reads `captioned(e)`, which is
   the seam that keeps a caption from outliving or undercutting its own frame. */
function sayCaption(side,ab,label,rest,e){const c=$('caption');
 c.innerHTML=`<span class="tag ${side}">${ab}</span><b>${label}</b>${rest}`;
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
/* ⭐ THE PENALTY IS OVER, AND NOTHING IN THE FEED SAYS SO. The pill names the
   club that KILLED it -- the one that was short -- which is the opposite of
   every other caption on this page, and the reason `sayCaption` exists.
   ⛔ `a side` IS READ, NEVER ASSUMED. `aside` comes off the situation code, so
   the sentence cannot quietly become false the day the league invents a strength
   we do not yet know: it says what the feed says the ice now holds. */
/* ⚠️ THE COPY IS AS SHORT AS IT IS BECAUSE OF A 320px PHONE. `.caption` is
   `white-space:nowrap`, so its `max-width:92%` cannot shrink it below its own
   text -- it overflows and the whole PAGE scrolls sideways. Measured at 320:
   "back to 5 a side" is 324px against a 320px viewport and the document went to
   322 (the penalty caption already shipping is 242 and fine). "5 a side" is
   270px. This is the longest caption the page can produce, so it is the one
   that sets the budget, and no test we have can see it. */
function captionKill(e){const k=KILLED.get(e);const tid=k.killedBy;
 sayCaption(tid===AID?'a':'h',tid===AID?AAB:HAB,'🛡 Penalty killed',
  ` · ${k.aside} a side`,e);}
let workOpen=false;
/**
 * ⭐ SHOW ME THE WORK — ONE PANEL, DRIVEN BY THE LAYER CONTRACT.
 *
 * It was written for Attempts and parked with everything else on 2026-08-27.
 * Bringing it back raised the shape question: one panel or five? Checked rather
 * than guessed, over the reference game's 320 events:
 *
 *     layer         counted  surprising  excluded   counted+excluded
 *     Attempts          135          44       185   = 320  every event
 *     Slot               44          14       276   = 320
 *     Blocked            44           4       276   = 320
 *     Goaltending        60           5       260   = 320
 *     Stoppages          44           —       276   = 320
 *
 * ⭐ ALL FIVE CONSERVE, so this is ONE panel. That is also the first broad
 * evidence the layer contract is an abstraction rather than a description of
 * two things that happened to look alike — it had been demonstrated once, by
 * the whistle layer being built without touching the others.
 *
 * ⭐ AND ITS WORDS ARE READ FROM THE PAGE, NEVER RETYPED (§27.2), for the same
 * reason the caption is: the layer's name comes from its chip and what it
 * counts comes from its own row, so a rename moves both and a second copy
 * cannot drift from the first. Only the ARITHMETIC is computed here.
 *
 * ⚠️ STOPPAGES HAS NO `surprising` BUCKET and must not be given an empty card
 * that reads as "none were surprising" — a claim the layer never made. The
 * section is absent when the bucket is.
 */
/* ⭐ THE LEDGER OF THE LAYER THAT IS ON, not the one `render` happens to hold.
   `render` computes the CORSI lens for the scoreboard and passed it here, which
   was right while this panel only ever explained Attempts -- and silently wrong
   the moment it became generic: it read the right NAME off the chip and the
   wrong NUMBERS off corsi, for every layer. Caught by a test that took its
   expected totals from each reducer rather than from the page. */
/* Plurals for the collapsed line. A TABLE, for the reason `PEN` and `WHY` are
   tables: `type+'s'` gives "period-starts" and "shot-on-goals", and a name the
   league controls is never inflected by us. */
const PLURAL={faceoff:'faceoffs',hit:'hits',giveaway:'giveaways',takeaway:'takeaways',
 penalty:'penalties',stoppage:'whistles',goal:'goals','shot-on-goal':'shots on goal',
 'missed-shot':'missed shots','blocked-shot':'blocked shots','period-start':'period starts',
 'period-end':'period ends','game-end':'the final horn','delayed-penalty':'delayed penalties'};
/* ⭐ THE CHIP'S NAME, AND ONE READER OF IT — the fourth design this seam has
   decided, and the first one it decided TWICE. Each metric chip carries a live
   count beside its label, so `chip.textContent` reads "Goaltending10". `capFor`
   was taught to read `.pkl` when the counts landed; this panel's heading was the
   other reader of the same seam and was not, so the fix for the caption shipped
   the identical defect one surface down. A seam that keeps biting does not want
   a second correction, it wants one reader — so both callers come through here
   and a new one cannot get it wrong by default. The fallback is the whole chip,
   which is what a chip with no label element would have to be. */
function chipLabel(id){
 const chip=document.querySelector(`#rg .pk[data-l="${id}"]`);
 if(!chip)return id;
 const lab=chip.querySelector('.pkl');
 return lab?lab.textContent:chip.textContent;}
const LEDGER={corsi:sl=>corsi.reduce(sl,CTX),slot:sl=>danger.reduce(sl,CTX),
 blocked:sl=>blocked.reduce(sl,CTX),goaltending:sl=>goaltending.reduce(sl,CTX),
 whistle:sl=>whistle.reduce(sl,CTX)};
function renderWork(_,cur,at){
 const id=whichPick();
 if(id==='none'||!LEDGER[id]||at<0){$('workBody').innerHTML='';return;}
 const sl=upto(at), L=LEDGER[id](sl);
 const row=document.querySelector(`#rg .lrow[data-pick="${id}"]`);
 const lds=row&&row.querySelector('.lds');
 /* ⭐ HOW THE LAYER ATTRIBUTES WHAT IT COUNTS, and this panel is where that
    belongs: it is the verification surface, and attribution is the thing two
    layers can legitimately disagree about. Attempts credits a blocked shot to
    the SHOOTER; Blocked credits it to the BLOCKER. Both are right for their own
    question, and a reader who meets them without this reads a contradiction.
    The old panel hard-coded "All credited to the shooter." for Attempts, which
    `build.test.js` follows as a CLAIM rather than a string -- it went red the
    moment this panel became generic, which is the check working. */
 const lat=row&&row.querySelector('.lat');
 const name=chipLabel(id);
 /* ⭐ ONE EXAMPLE PER GROUP, so a categorical reason keeps a real measurement
    beside it. CHENG on the specific form: "36 against 33 teaches the rule
    better than the rule statement does" -- right, and the way to keep that
    without a 49-row wall is to say the rule once and show one shot that met it.
    `detail` is set only where the reducer has a per-event measurement, so
    layers without one render exactly as before. */
 const rows=g=>Object.entries(g).sort((a,b)=>b[1].n-a[1].n)
   .map(([why,{n,eg}])=>`<div><b>${n}&times;</b> ${ESC(why)}`
     +(eg?` <span class="weg">e.g. ${ESC(eg)}</span>`:'')+`</div>`).join('');
 /* ⭐ THE LEDGER STOPS PRETENDING TO TEACH. Kevin: "what is the Not Counted
    column teaching the new viewer? That faceoffs, giveaways, period starts are
    NOT shots from the slot? I don't think there's much value there." Measured
    and he is right: over the reference game, 100% of the exclusions for
    Attempts, Goaltending and Stoppages are events that were never candidates.

    ⭐ CHENG'S RULE DECIDES WHAT STAYS: an exclusion teaches when a viewer could
    plausibly have expected it to COUNT -- the exact mirror of the `surprising`
    admission rule. It is not derivable from the events, but it IS derivable
    from the DIMENSION that rejected them, which is what `dims` is for: `type`
    means a different kind of event entirely, and everything else means a real
    candidate that failed a test.

    ⚠️ CONSERVATION IS NOT WEAKENED, AND MUST NOT BE (Doctrine §9 -- selective
    honesty is worse than none). The collapsed line carries its own count and
    the footer still closes over every event, so a reader adds three numbers
    instead of two. Nothing is hidden; the bookkeeping stops occupying the
    position that teaching should have. */
 /* ⭐ THE RULE IS `isNearMiss` IN layer.js, WHICH IS WHERE IT BELONGS. It was
    written here as "has any dimension that is not `type`" and restated a second
    time in the test that guards it; the version in the library says what `type`
    disqualifying means and why, and both readers now share it. */
 const isNear=isNearMiss;
 const near=L.excluded.filter(isNear), plain=L.excluded.filter(x=>!isNear(x));
 const exc=rows(summarise(near));
 /* AND THE COLLAPSED LINE STILL NAMES WHAT IS IN IT, from the events rather
    than from prose -- CHENG's one defence of the noise is that a novice might
    think a hit counts toward "controlling play", and that survives as three
    named kinds rather than ten rows. */
 const kinds={};
 for(const x of plain){const e=sl[x.id]; if(e)kinds[e.type]=(kinds[e.type]||0)+1;}
 const top=Object.entries(kinds).sort((a,b)=>b[1]-a[1]);
 const named=top.slice(0,3).map(([t,n])=>`${n} ${PLURAL[t]||t}`);
 const restN=top.slice(3).reduce((a,[,n])=>a+n,0);
 const plainLine=plain.length
   ? `${plain.length} other event${plain.length===1?'':'s'} ${plain.length===1?'was':'were'} not this kind of play at all`
     +(named.length?` — ${named.join(', ')}${restN?`, and ${restN} more`:''}`:'')+'.'
   : '';
 /* ⚠️ SURPRISING IS NOT GROUPED, AND EXCLUDED IS, because the reducers author
    them differently and it shows the moment you try. An EXCLUDED reason names a
    RULE -- "a hit — physical play, but not a shot attempt" -- so nine rules
    cover 183 events. A SURPRISING reason names the EVENT, player and all:
    "blocked, but it still counts — an attempt belongs to the SHOOTER, Kaprizov,
    not the player who blocked it". Grouping those produced TWENTY near-identical
    rows, one per shooter, which is a wall wearing the shape of detail.
    So: the total, and ONE case labelled as an example. The old panel printed
    `surprising[0].why` beside the number 44 with no such label, which reads as
    though all 44 were that one thing -- the defect this avoids without
    reintroducing the wall. */
 const sur=L.surprising&&L.surprising.length?L.surprising[0].why:null;
 const when=cur?`through P${cur.per} ${cur.rem}`:'pre-game';
 const b=lboxFor(id,at,corsi.reduce(upto(at),CTX));
 /* ⚠️ ZERO IS A FIGURE, AND `&&` DROPPED IT. `b.h` is a NUMBER, so a club with
    none of something was falsy and vanished: the footer read "1 WSH." on a
    1-0 slot count, silently omitting the club that had none. On a panel whose
    closing sentence is "nothing is dropped quietly", that is the one number
    that must never go missing. Stoppages still shows no figures, because there
    the fields are EMPTY STRINGS -- a real absence, which is a different thing
    from zero and is now distinguished by the test rather than by truthiness. */
 const has=v=>v!==''&&v!=null;
 /* ⭐ JOINED WITH A PLUS, BECAUSE THEY ADD UP — Kevin, looking at Goaltending:
    the two club figures sat behind a slash and a full stop, orphaned from the
    arithmetic in the same line that they are the parts of. They are not a list;
    they are the parts of the counted number.

    ⚠️ AND THAT IS WHY TWO LAYERS NEEDED MORE THAN A NEW SEPARATOR. A slash
    promises nothing and a plus is an equation, so both places where the club
    figures do not account for everything counted became visible the moment the
    separator changed: Goaltending shows FRACTIONS, where the denominators sum
    to the counted events and a reader adding numerators is one short per goal;
    Blocked credits a teammate's block to NEITHER club, 7.8% of them. So a layer
    says what its figures add to (`sums`) and what is credited to nobody
    (`rest`), and the one thing a `+` may never do here is invite a sum that
    does not close. */
 const fig=[has(b.a)&&`${b.a} ${AAB}`,has(b.h)&&`${b.h} ${HAB}`,
   ...(has(b.a)||has(b.h)?(b.rest||[]).map(r=>`${r.n} ${r.say}`):[])]
   .filter(Boolean).join(' + ');
 $('workBody').innerHTML=
  `<h2>How ${ESC(name)} is counted <span class="wsub">(${MODE()}, ${when})</span></h2>`
 +`<div class="wg">`
 +`<div class="wc"><h3>Counted <span class="n">${L.counted.length}</span></h3>`
 /* ⚠️ AND THE SENTENCE IS CLOSED HERE. `.lds` is a FRAGMENT -- it is written to
    follow "Slot &mdash; " in the caption, which supplies the full stop -- so in
    this card it ran straight into the attribution line: "between the face-off
    dots Credited to the club that shot." The caption already appends the stop;
    this does the same rather than 15 copies of the row text gaining one. */
 +`<p>${lds?ESC(lds.textContent)+'.':''}</p>`
 +(lat?`<p class="wattr">${ESC(lat.textContent)}</p>`:'')+`</div>`
 +(sur?`<div class="wc flag"><h3>Counted, surprisingly <span class="n">${L.surprising.length}</span></h3>`
   /* ⚠️ AND THIS SENTENCE IS CLOSED TOO — the same fragment defect `.lds` had one
      card to the left, seen in the same screenshot. A reducer's `why` is a
      CLAUSE ("…so neither club is credited with the block"), so it ran straight
      into the line below it: "…credited with the block The other one carries
      its own reason." The stop is added HERE rather than in fifteen reasons,
      and only when the clause has not already ended itself. */
   +`<p><em>For example:</em> ${ESC(sur)}${/[.!?]$/.test(sur)?'':'.'}</p>`
   /* ⚠️ AND IT AGREES WITH ITSELF WHEN THERE IS ONE. "The other 1 each carry
      their own reason" is what a plural written once and never re-read looks
      like — and it is the COMMONEST case, not an edge: the surprising bucket
      opens at two the moment a second one lands, so every layer passes through
      it. Seen in a 360px screenshot of the very card this session was tidying,
      on both the layers that were open. */
   +(L.surprising.length>1?`<p class="wexc">${L.surprising.length===2
     ?'The other one carries its own reason, written by the layer that counted it.'
     :`The other ${L.surprising.length-1} each carry their own reason, written by the layer that counted them.`}</p>`:'')
   +`</div>`:'')
 +(near.length?`<div class="wc"><h3>Close, but not counted <span class="n">${near.length}</span></h3>`
   +`<p class="wexc">${exc}</p></div>`:'')+`</div>`
 +(plainLine?`<p class="wplain">${plainLine}</p>`:'')
/* ⚠️ ONE `=` IN THE LINE, AND A DASH WHERE THE SECOND ONE WANTED TO GO. Written
   as `A + B = 10 counted + 35 other = 45 events`, a chain of equals asserts
   10 = 45 — and the conservation sentence is the one place on this page that
   cannot afford arithmetic a reader can catch out. The dash reads "that is",
   the club figures stay welded to the number they are the parts of, and the
   single equation left standing is the one Doctrine §9 is about. */
 +`<p class="wfoot">${fig?`<em>${ESC(fig)}</em> &mdash; `:''}`
 +`${L.counted.length} ${b.sums||'counted'}${near.length?` + ${near.length} close`:''}`
 +` + ${plain.length} other = `
 +`<b>${L.counted.length+L.excluded.length}</b> events, which is every event in `
 +`the game so far. Nothing is dropped quietly.`
 +`${evenOnly?' <b>Even strength only</b> &mdash; the power-play and empty-net '
   +'events are in the not-counted list above, with the situation that removed '
   +'each one.':''}</p>`
 /* ⭐ THE WAY BACK OUT, AND UNTIL NOW THE TRIP WAS ONE-WAY. Kevin: "aligning
    show me the work with learning cards, and making them bi-directional." Nine
    cards deep-link INTO a game, each carrying `&layer=`; the game linked back
    only through the site header, to the top of a page with no anchors on it at
    all. A reader who met "Blocked credits the blocker" here and wanted to know
    why had nowhere to go.

    ⭐ EVERY CARD FOR THIS LAYER, NOT ONE PICKED. The map is 9 cards onto 5
    layers -- Stoppages is taught by four of them (icing, offside, faceoffs,
    penalties) and Attempts by two -- so choosing one would mean choosing
    inside a set the data does not rank. Listing them all dissolves that, and
    says what else this layer teaches.

    ⚠️ AND IT IS ABSENT, NOT EMPTY, WHEN A LAYER HAS NO CARD. `Blocked` has
    none: the card called "blocked" opens the Attempts layer, because its door
    is the first blocked shot the CONTROL reducer counts. An empty "Learn More"
    row would advertise a gap; no row says nothing, which is true. The gap
    itself is a content question, not a layout one.

    ⭐ AND IT SITS BELOW THE LEDGER, which is Kevin's call and the right one:
    this panel is a VERIFICATION surface and the link is the first thing in it
    that is not evidence. It goes after the arithmetic closes, never beside it. */
 +cardsFor(id);}
/* The learn-card row for a layer, or '' when the layer has none. `LEARNCARDS`
   is built by `builders/build_main.py::_learn_by_layer` out of the two
   documents that already own the answer -- never restated here. */
function cardsFor(id){const cs=LEARNCARDS[id];
 if(!cs||!cs.length)return '';
 return `<p class="wlearn"><span class="wll">Learn More</span>`
  +cs.map(c=>`<a href="/what-you-can-see.html#${ESC(c.id)}">${ESC(c.title)}</a>`).join('')
  +`</p>`;}

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

   PACE IS A TASTE AND IS HERE TO BE LOOKED AT. Kevin reported the default too
   fast; 1800 is his call to move, and the consequence of moving it is the
   replay's length (about 8.5 minutes for a 281-event game) and the number of
   events in the home page's loop, which runs on this same function. */
/* ⭐ SPEED IS A STEPPER, NOT THREE GEARS TO PICK FROM. Kevin, 2026-08-25: "I
   thought that faster would play at X (default) + 1, then hitting slower would
   move back to X, then slower again would move to X-1, faster back to X."

   That is what removes the middle button without losing the middle STATE, which
   is the objection the three-button version was answering. Two controls, three
   paces, all of them reachable -- and it is the idiom the transport already
   teaches one row up: `Prev`/`Next` step and go dead at the ends of the game.

   THE END STATE IS THE READOUT. With no pressed label to say where you are, the
   disable is what says it: both live means the default pace, `Slower` dead means
   the slowest, `Faster` dead means the fastest. Three states, distinguishable,
   and EVERY press changes something visible -- which a two-button toggle pair
   without the disable would not have given. The paces are unchanged; see
   docs/event-timing.md for where the three constants come from. */
/* ⭐ HALVED, 2026-08-29. Kevin, watching a replay: "the events populate way too
   quickly now and don't give the casual viewer a chance to really grasp what's
   going on... reduce playback by 1/2 or more."
   THE STRUCTURE IS UNCHANGED AND THAT IS DELIBERATE. Three gears, one constant
   each, no ranking of events by importance -- §7.2 of docs/event-timing.md
   argued that tiering encodes an editorial judgement this site refuses, and
   halving does not reintroduce one. Pacing by DISTANCE was drafted, prototyped
   and set aside at Kevin's call the same day: "let's make a constant update
   rate for the events."
   ⭐ AND CAPTION_BONUS DOES NOT SCALE. It buys reading time for words, and the
   words are the same length at every gear -- 900 ms of extra reading is 900 ms
   of extra reading. Doubling it would be a constant tracking another constant
   for no reason either of them states. */
const PACE=[5200,3600,2000];let gear=1;
const CAPTION_BONUS=900;
let i=EV.length-1,playing=false,timer=null,frameMs=PACE[gear];
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
/* ⚠️ AND THE PENALTY KILL IS IN HERE, WHICH IS THE WHOLE POINT OF THE SEAM. A
   caption added to `render` alone would fire on a frame this function calls
   silent, so `dwell` would give it an ordinary frame's time -- a sentence that
   appears and is gone before it is read, which is the exact defect this
   predicate was extracted to make impossible, running in the other direction. */
function captioned(e){return !!e&&(e.type==='goal'||e.type==='penalty'||KILLED.has(e)||(hdOn&&isHD(e)));}
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
function setGear(g){gear=Math.max(0,Math.min(PACE.length-1,g));frameMs=PACE[gear];
 $('slower').disabled=gear===0;$('faster').disabled=gear===PACE.length-1;}
$('slower').onclick=()=>setGear(gear-1);
$('faster').onclick=()=>setGear(gear+1);
setGear(gear);
/* ⭐ OPENING THE WORK STOPS THE REPLAY — 2026-08-31, and it is the other half of
   making the two MUTUALLY EXCLUSIVE. The panel now covers the ice, so a replay
   left running would advance behind it: the counters would move, the caption
   would fire, and the reader would come back to a game that had gone on without
   them. Kevin's framing is the argument -- "show it to them in the same view
   they are currently watching" -- and you cannot watch and read the same
   rectangle at once.
   IT DOES NOT AUTO-RESUME. Pressing Play again is one tap and is the reader's
   decision; a replay that restarts itself when a panel closes is the page
   moving under someone, which is the thing this change exists to remove. */
/* ⭐ AND THE ICE IS HIDDEN, NOT MERELY COVERED — found by LOOKING, not reading.
   The panel is opaque and paints over the rink, so the first build looked
   correct at a glance. It was not: at 1100 the card is 523 tall, the panel 366,
   and the ice 373 -- so a SEVEN-PIXEL STRIPE of rink showed below the panel's
   bottom edge, an arc and three face-off dots, reading as a rendering fault
   rather than a design. No unit test could ever have seen it; the node document
   has no layout, and both elements were individually correct.
   `visibility`, NEVER `display`. Collapsing the svg would collapse the card the
   panel is positioned inside, which is the shift this whole change removes. */
/* ⭐ ONE OWNER FOR THE OPEN STATE, AND THAT IS THE WHOLE REASON THIS IS A
   FUNCTION. There are TWO ways the panel closes -- this button, and `closeWork`
   when the lens goes back to `none` -- and the overlay adds a third thing that
   has to be undone: the class that HIDES THE ICE. Toggled in the button handler
   alone, picking `Just events` while the work was open would have left the rink
   invisible with nothing over it. The same shape as `place()` and `chipLabel`:
   remove the opportunity to disagree rather than add a second correct line. */
function setWork(open){
 workOpen=open;
 $('workPanel').hidden=!open;
 document.getElementById('rg').classList.toggle('working',open);
 $('work').setAttribute('aria-expanded',open);
 $('work').textContent=open?'Hide the work':'Show me the work';
 if(open&&playing)stop();}
$('work').onclick=()=>{setWork(!workOpen);if(workOpen)render(i,'');};
/* THE OVERLAY'S CLOSER DELEGATES rather than calling `setWork` itself, so there
   is exactly one closer and no way for two call sites to drift about what
   closing means. `#work` is still the control; this is the copy of it that is
   reachable while the overlay covers the original. */
$('workClose').onclick=()=>$('work').click();
/* AND THE SHUT STATE IS ESTABLISHED BY THE SAME OWNER AT BOOT, the way
   `setGear` establishes the pace. The markup carries `hidden` so the page reads
   correctly before JS runs; without this line that attribute would be a SECOND
   statement of the closed state, free to disagree with `setWork` the day either
   one moves. Same argument as the mode label two rows down. */
setWork(false);
$('aAb').textContent=AAB;$('hAb').textContent=HAB;
/* ⭐ THE DIRECTION INDICATOR IS GONE, AND THE QUESTION THAT CREATED IT IS NOT.
   Kevin, 2026-08-25: "remove both 'attacks' and the arrows completely. They are
   becoming a headache for very little visual or educational gain... the hero
   game without them really cleans up the scoreboard."
   It was added for his own earlier question — reading a blocked shot at the far
   end, "I don't understand how Toronto would have a shot blocked in the
   offensive zone?" — and it had drifted into THREE renderings of one object: no
   indicator in the hero, an arrow on a phone, a word and an arrow on a laptop.
   None of those differences was ever a decision about what a reader needs; each
   one was a space budget. Three variants for one fact is the cost side, and the
   gain was one glyph nothing in the legend ever named.
   WHAT STILL ANSWERS THE ORIGINAL QUESTION: the goaltenders. Two figures in two
   creases in two colours say which end is whose without words, which is where
   the answer came from before this existed. `attackDirection` is untouched and
   still drives the slot layer, goaltending and `shotDir` — only the readout is
   gone, never the derivation. */
/* THE STANDING KEY'S WORDS COME FROM THE MODE, and only its VISIBILITY is a
   per-frame question. Written once here rather than each frame: a sentence that
   cannot change during a visit should not be rebuilt three hundred times. */
(()=>{const k=$('endsKey');if(!k)return;const K=ENDS_KEY[ENDSMODE];
 k.textContent=K.rule||K.display;})();
/* ⭐ THE SLOT'S SENTENCE IS COMPUTED, NEVER TYPED.
   The legend said only WHERE the shading is -- "within 33 ft of the net,
   between the dots" -- which is a definition, not a reason. The reason is the
   share of goals scored from inside it, and the figure a design document had
   been quoting was in NO published artifact at all: the archive now measures it
   (`archive.js::slotShare`) and this reads it.

   SILENT WHEN IT DOES NOT HAVE IT, rather than falling back to a number. A page
   built from a single game never asks for the archive, and a derive that has not
   run yet has no share to give; in both cases the card keeps its geometry and
   loses its clause, which is the `noCurveReason` rule applied one block down.
   A typed constant here would go stale the next time the archive is re-derived
   and nobody would ever see it happen. */
(()=>{const el=$('slotSay');if(!el)return;
 const S=RATES&&RATES.slot;if(!S||S.rate==null||!S.n)return;
 el.textContent=`${Math.round(S.rate*100)}% of goals are scored from inside it — ${S.count.toLocaleString()} of ${S.n.toLocaleString()} across the archive.`;})();
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
 /* ⭐ AND HOW THIS GAME SAT IN ITS SEASON — the per-game summary, §32.6, and the
    payoff of the distributions `measures.json` gained on 2026-08-28.
    §31.7b's taxonomy is why it belongs on THIS card and not beside a counter:
    "Show me the work" answers *where did 34 come from*, this is the other half
    of Doctrine §8 — *how unusual is 34* — and the two are one thing split by
    scope. The card already fires at the horn, which is the moment the question
    can be asked at all.

    ⭐ THE COUNTS ARE THE CHIPS' OWN, at the full-game slice: the same
    `counted.length` from the same reducers `perGame` measured, so the number
    compared and the number distributed are one quantity. A second way of
    counting here would be the CONTROL-versus-shots-on-goal defect rebuilt
    inside its own answer.

    ⚠️ SILENT WHEN THERE IS NOTHING TO COMPARE AGAINST, which is the verdict
    card's standing rule and is the LIVE state until the pipeline next derives:
    `perGame` is absent from the published document today, and the inlined page
    never asks for the archive at all. One absent-comparison sentence on a card
    is enough — the curve's, above — and a second apology beside it would be
    noise about a feature the reader has not been promised. */
 const season=String((G.game&&G.game.id)||'').slice(0,4);
 const dists=RATES&&RATES.perGame&&RATES.perGame[season];
 const LENSCOUNTS={
   corsi:all.counted.length,
   slot:danger.reduce(G.events,{...CTX,evenOnly:false}).counted.length,
   blocked:blocked.reduce(G.events,{...CTX,evenOnly:false}).counted.length,
   goaltending:goaltending.reduce(G.events,{...CTX,evenOnly:false}).counted.length,
   whistle:whistle.reduce(G.events,{...CTX,evenOnly:false}).counted.length};
 const U=mostUnusual(dists,LENSCOUNTS);
 /* ⚠️ THE GUARD ASKS THE QUESTION, not a neighbour of it. It was
    `some(d => d.n)` — distributions exist — which is not the same as "a lens
    could be judged": a document carrying `perGame` without `noun` has
    distributions, judges nothing, and would have been told it was an ordinary
    night by every lens. Two different facts behind one null. */
 if(judgeable(dists,LENSCOUNTS)){
  /* A FRACTION, NEVER A PERCENTAGE (levelCurve's rule): "more than 182 of the
     200 nights" is self-limiting where "the 91st percentile" is not, and it
     needs no minimum-n guard — early in a season the sentence says so itself. */
  /* ⚠️ AND THE EXTREME READS AS A SENTENCE, NOT AS A BUG. A count above every
     game in the population produced "more than 200 of the 200 games this
     season" — precise, self-checking, and it looks like arithmetic that has
     gone wrong. Same figure, said the way a person would. Seen in a browser on
     the Cup Final; no test here could have called it. */
  const nights=n=>`${n} of the ${U?U.of:0} game${(U?U.of:0)===1?'':'s'} this season`;
  const beat=U&&U.n===U.of
    ?`${U.high?'higher':'lower'} than all ${U.of} game${U.of===1?'':'s'} this season`
    :`${U&&U.high?'more than':'fewer than'} ${nights(U?U.n:0)}`;
  p.push(`<span class="rate season">${U
    ?`<b>${U.count} ${ESC(U.noun)}</b> — ${beat}.`
      /* ⚠️ AND THE CLAUSE ABOUT THE OTHERS ONLY SAYS WHAT WAS COUNTED. It was
         written as "Nothing else about it was unusual", which is a claim about
         the four lenses `mostUnusual` had just discarded and never checked. */
      /* ⚠️ AND "one of 5 counts" WHEN IT IS ALL FIVE is true and weak — the
         stronger true sentence is that nothing about the game was ordinary. */
      +(U.outside>=5
        ?' Every count here sat outside the middle half — an unusual game by every lens.'
        :U.outside>1
        ?` One of ${U.outside} counts here that sat outside the middle half of the season.`
        :' Every other count sat inside the middle half of the season.')
    :'Every count in this game sat inside the middle half of the season — '
      +'an ordinary night by every lens here.'}</span>`);}
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
/* NARRATION IS NO LONGER A CONTROL (Kevin, 2026-08-26: "for display options, I
   vote to remove players and narration"). The ice names every event, always.

   THE PILL'S GOAL BRANCH SURVIVES, WHICH IS WHY THIS IS A DELETION AND NOT AN
   ORPHANING. Turning labels off used to be the one state where the caption
   announced a goal, and enumerating that before the removal was the point: the
   guard is `!place(cur)`, and `place()` returns nothing for a SHOOTOUT event.
   So the branch is still reachable on the ~6% of games decided in a shootout,
   and the test that covers it now boots a shootout fixture rather than pressing
   a control that no longer exists. */
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
    // ⭐ THE DURATION IS SPELLED IN ONE PLACE NOW. This was the second spelling
    // of it in this file (`mmss` is the other, and they disagree on purpose --
    // "0:28" against "28s"). K1 would have made a third, which is the point at
    // which nobody can say which is canonical, so the shared one moved to
    // src/lib/transition.js and both readers import it.
    const w=spokenGap(g);if(w)d=' · '+w+' earlier';
  }
  return `· P${ev.per} ${ESC(ev.rem)}${d}`;
}

function drawLabel(e){const g=$('labels');const p=place(e);if(!p){g.innerHTML='';return;}
 const lx=p.x,ly=p.y;
 if(e.type==='goal'){const tid=e.own,col=tid===AID?AWAYCOL:HOMECOL,ab=tid===AID?AAB:HAB,p=R[e.actor];
   const as=[R[e.a1],R[e.a2]].filter(Boolean).map(x=>x.nm).join(', ');
   let tx=lx>100?lx-5:lx+5,anc=lx>100?'end':'start',ty=Math.max(15,ly-6);
   g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${col}" stroke-width=".4" opacity=".55"/><text class="glab" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}" fill="${col}">🚨 GOAL${shortHanded(e)?' · SHORT-HANDED':''} — ${p?p.nm:ab}</text><text class="plabsub" x="${tx.toFixed(1)}" y="${(ty+4).toFixed(1)}" text-anchor="${anc}">${as?'assists: '+as:'unassisted'}</text></g>`;return;}
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
 /* ⛔ THE ICE NO LONGER NAMES THE STOPPAGE — REMOVED 2026-08-27, and the
    measurement is why. CHENG, on a screenshot: "three surfaces are describing
    two different events at one moment, and the caption is the one carrying
    both… the same fact appears in both a narrating surface and a ledger, and
    they'll separate."

    ⚠️ THEY DO NOT SEPARATE LATER. THEY DISAGREE NOW. Measured over 53 games:
    the clause fired on 2,354 faceoffs and on 83 of them — 3.5%, one in thirty —
    the box named a DIFFERENT stoppage at the same frame. Two whistles before one
    faceoff is all it takes: the ice showed the whistle the reducer PAIRED with
    that dot, the box shows the LATEST one. `ice "delayed-penalty" box
    "tv-timeout"`, `ice "icing" box "referee-or-linesman"`. Both statements true,
    read as a contradiction.

    ⭐ AND THE FIX IS THE RULE THIS PROJECT ALREADY HAS: one narrator, many
    ledgers. The rink says what is happening NOW — VGK won the faceoff. What
    stopped play is a CONDITION at the playhead and belongs to the box, which
    already states it. Removing the clause leaves exactly one surface naming a
    stoppage, and the 3.5% disagreement has nowhere to appear.

    ⚠️ AND THE COMMIT BEFORE THIS ONE FIXED THIS SENTENCE'S GRAMMAR. Every
    `WHY[].name` read wrong composed into "Won the faceoff after …", so a third
    authored form was added to the table. That work was one level too shallow: I
    corrected the wording of a composition instead of asking whether the
    composition should happen. `clause` is gone with the sentence — a field
    nobody displays is a field nobody checks. */
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
 /* ⏸ K1's SENTENCE IS BUILT AND IS NOT DRAWN HERE — `src/lib/transition.js`.
    The rule is done and mutation-checked; the SURFACE is Kevin's to choose,
    because the obvious one is the one he already closed. `.plabsub` on an event
    was retired on 2026-08-16 at his own request -- "I think we can retire the
    subtext on the event displayed on the ice, it still looks crowded to me" --
    and `render-labels.test.js` is the guard he asked for. It fired on the first
    build of this, which is the suite doing exactly its job.
    WHAT IS DIFFERENT NOW, and it is his call whether it matters: that ruling
    retired a subline under EVERY event, and K1's fires on 18.4% of transitions,
    47 a game. A line on fewer than one frame in five is not the thing he was
    looking at. Until he says so, the ice keeps one label. */
 g.innerHTML=`<g class="plabgrp"><line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty-1).toFixed(1)}" stroke="var(--ink)" stroke-width=".3" opacity=".35"/><text class="plabel" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anc}">${ESC(playSaid(e))}${hd}</text></g>`;}

/* ⭐ WHAT THIS PLAY IS, IN WORDS — the one place the words are chosen.
   Extracted when the share control needed to name the moment it had just
   copied: a confirmation reading "opens at WSH · Won the faceoff" and a rink
   reading something else would be two surfaces describing one event, which is
   the disagreement this page has already paid for twice (the whistle clause at
   3.5%, the caption saying "from the slot" twice).
   THE RICHER FORMS STAY WHERE THEY BELONG. A goal on the ice carries its
   assists on a second line and a blocked shot goes through `blockedSay`, which
   is shared; what is centralised here is WHICH WORDS NAME THE PLAY, and the
   surfaces differ only in how much they then add. */
function playSaid(e){
 const lab=e.own===AID?AAB:e.own===HID?HAB:null;
 if(e.type==='blocked-shot')return blockedSay(e,blockOn);
 if(e.type==='goal'){const p=R[e.actor];
   return `${lab?lab+' · ':''}GOAL${shortHanded(e)?' · short-handed':''} — ${p?p.nm:(lab||'')}`;}
 const info=e.type==='missed-shot'?missSay(e):LAB[e.type];
 if(!info)return lab||'';
 return `${lab?lab+' · ':''}${info}`;}

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
/* ⚠️ A DECLARATION, NOT A `const` ARROW, AND THE DIFFERENCE BROKE THE PAGE. This
   sat at line 1805 while the verdict card runs immediately at 1361, so the
   per-game summary's first call to it threw `Cannot access 'ESC' before
   initialization` — which aborted boot, left every `let` below it in its own
   dead zone, and surfaced later as `Cannot access 'hdOn'` on the first scrub.
   A pure escaping helper the whole file reaches for should be available to the
   whole file; a function declaration hoists and a `const` does not. */
function ESC(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
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
/* ⭐ THE PITCH NAMES THE CONTROL, AND NEVER ITS POSITION. The layer menu moved
   above the rink on 2026-08-26 and this paragraph did not follow it: measured at
   390 it is 279px tall, so above the ice it would have put the play button at
   y=1036 against a fold of 844 -- the exact defect that split this greeting in
   two in the first place. So the halves are no longer adjacent, and the reader
   is given the one thing that survives a layout change: the control's own label,
   quoted verbatim, the same way the other half quotes `▶ Play from start`.
   It is a constant read by a test against the summary in the built page, so the
   day someone renames the control this sentence fails rather than lying. */
const LAYER_MENU='Add a metric layer';
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
 // ⭐ THE GREEN RING IS NAMED HERE BECAUSE THIS IS WHERE A NEWCOMER IS.
 // The legend under "What the marks mean" defines it and the control switches
 // it, but both sit behind a summary a first-time visitor has not opened.
 // Kevin: "we need to identify what the green circle represents somewhere
 // (obvious, so the viewer knows what they are looking at/for)".
 // THIS SENTENCE IS THE ONLY ONE OF THE THREE THAT SAYS WHAT TO DO WITH IT --
 // watch it -- so it is not a third copy of the definition.
 el.innerHTML=`<b>New here?</b> Press <b>▶ Play from start</b> and just watch — every event `
  +`is named as it happens, and goals are called with the <b>scorer and assists</b>. `
  +`The <b class="ncue">green shading</b> shows you where the next play happens, so you are `
  +`looking in the right place when it does. `
  +`Nothing is invented: every number here comes from the league's own record of the game.`
  +`<button class="ndone" id="nDone">I have got the hang of it — hide this</button>`;
 const w=$('newcomerWhy');
 if(w)w.innerHTML=`<b>Why add a layer?</b> Because the obvious reading of a game is often `
  +`the wrong one.`+why
  +`<span class="nwhy">Every layer shows its work — the events it counted, the ones it did `
  +`not, and why. Open <b>${LAYER_MENU}</b> to switch one on.</span>`;
 $('nDone').addEventListener('click',()=>{
  // An explicit dismissal outranks the counter, and it is remembered. A tip you
  // cannot turn off is an advert.
  try{localStorage.setItem('rtg.seen',new Date().toISOString().slice(0,10)+'|99');}catch(e){}
  document.getElementById('rg').classList.remove('newcomer');});}
document.getElementById('rg').classList.toggle('newcomer',NEWCOMER);
drawNewcomer();
let corsiOn=false,hdOn=false,goalieOn=false,whistleOn=false,blockOn=false;
/* ⚠️ AND IT LIVES HERE, NOT BESIDE THE THING IT DRAWS. `zoneState()` runs at
   BOOT, one line below its own definition, and it calls `syncPick` -- so with
   this block further down the file `let picking` was still in its temporal
   dead zone and every page threw. 180 tests, one error. The selector belongs
   with the five booleans it is a view of, which is also where it reads best. */
/* ⭐ ONE ROW, ONE ACTIVE ITEM. Kevin: "build the one row, one active item and
   place it right below the scrubber." The five booleans above are still the
   state -- this is a VIEW of them and a way to set them, not a sixth variable
   that has to agree with the other five.

   ⭐ SO `syncPick` READS THE BOOLEANS AND NEVER REMEMBERS A CHOICE. Every path
   that changes a layer already ends in `lyrState`, which now calls it: the row
   below the scrubber, a deep link, and the parked menu if it is ever unparked.
   A `current` variable set alongside the booleans is the same defect as a
   drift alarm built from the implementation's own model of its input -- it
   agrees until one path forgets to update it, and then it is confidently wrong.

   `none` IS A REAL CHOICE and not the absence of one. It is the base view the
   site is built on -- §6, "the base view is just the game" -- so it is on the
   row, first, and checked when nothing else is. */
const PICKS=[['corsi',()=>corsiOn,v=>{corsiOn=v;setCorsi();}],
             ['slot',()=>hdOn,v=>{hdOn=v;setHd();}],
             ['blocked',()=>blockOn,v=>{blockOn=v;setBlock();}],
             ['goaltending',()=>goalieOn,v=>{goalieOn=v;setGoalie();}],
             ['whistle',()=>whistleOn,v=>{whistleOn=v;setWhistle();}]];
let picking=false;
function pick(want){
 // GUARDED because each setter calls lyrState -> syncPick, and syncPick reads
 // booleans that are mid-update. Without this the row would paint four times
 // per press, each time from a state no reader ever sees.
 if(picking)return; picking=true;
 for(const [id,get,set] of PICKS){const on=id===want; if(get()!==on)set(on);}
 picking=false; syncPick(); ack(want);}
/**
 * ⭐ THE CHIP CONFIRMS ITS OWN PRESS, and it exists because of a distance.
 *
 * CHENG, on the box under the ice: at 390 the box and the selector cannot be on
 * screen together, so the first toggle produces NO VISIBLE FEEDBACK NEAR YOUR
 * THUMB -- the layer's output changes 300px above the fold you are looking at.
 * Kevin: "I like the chip briefly confirming."
 *
 * ⭐ AND `aria-checked` ALREADY CHANGES THE CHIP'S COLOUR, which is exactly why
 * that is not the answer. A stateful change on the element you were already
 * looking at when you pressed it reads as "this button is selected", not as
 * "something happened". The confirmation has to be TRANSIENT to be a report
 * about an event rather than a description of a state.
 *
 * ⛔ AND IT IS NOT A LABEL CHANGE, on a mechanical ground rather than taste.
 * `capFor()` composes the caption from `chip.textContent` -- that is the §27.2
 * rule that the caption's words are READ from the page and never retyped -- so a
 * chip that said "Done" would make the caption read "Done — every shot attempt
 * the league recorded". The coupling is real, so the confirmation must not touch
 * the text. `test/render-notes.test.js` pins it.
 *
 * ONLY ON A PRESS. `syncPick()` also runs at boot and after a deep link, and a
 * page that pulses a control nobody touched is claiming an interaction happened.
 * So this is called from `pick()` and from nowhere else.
 *
 * Reduced motion is handled globally -- `#rg *{animation:none!important}` under
 * `prefers-reduced-motion:reduce` -- so this degrades to no feedback rather than
 * to a jarring one, which is the correct degradation for a confirmation.
 */
function ack(want){
 const chips=document.querySelectorAll('#rg .pk');
 // ⚠️ CLEARED FROM EVERY CHIP, NOT JUST RE-ADDED TO THIS ONE. Removing it only
 // from the target left the previously-pressed chip carrying `ack` for the rest
 // of the session -- inert today, because the animation has already run to a
 // transparent ring and does not repeat, but a class that says "just pressed"
 // sitting on a chip nobody has touched in ten minutes is a lie waiting for the
 // next rule that reads it. Found by a test asserting the set, not the target.
 chips.forEach(b=>b.classList.remove('ack'));
 const chip=[...chips].find(b=>b.dataset&&b.dataset.l===want);
 if(!chip)return;
 // Force a reflow between remove and add: re-adding a class an element already
 // carries does not restart an animation. Same three lines as `flash()`.
 void chip.offsetWidth;chip.classList.add('ack');}
/* ⭐ WHERE THE LAYER'S INFORMATION LIVES — and the selector answered it.
   Kevin, 2026-08-27: "I think we now can figure out where the layer information
   lives (once the toggle is selected)..... I've (we've) struggled with that."

   The struggle had one cause: FIVE layers could be on at once, so five notes
   needed somewhere to sit, and every home we tried was either far from the ice
   or grew the page by five blocks. ONE ACTIVE CHOICE makes it one line. There is
   never more than one layer to explain, so the page needs one slot, not five.

   IT SITS UNDER THE SELECTOR, NOT UNDER THE ICE, and the division is the point:
     · this line says what the LENS is        -> beside the control that picks it
     · the panels say what it is showing NOW  -> beside the ice, where they are
   Pressing a chip therefore changes something in the reader's own line of sight
   even when the rink is off screen, which is CHENG's control-to-effect distance
   answered where it actually bites rather than by moving the rink.

   ⭐ AND THE WORDS ARE READ FROM THE PARKED ROWS, NOT RETYPED. `.lds` (what it
   counts) and `.lon` (what appears on the ice) have been shipping hidden since
   §20; this is their home. So nothing was rewritten, the parked markup stops
   being dead weight, and a test compares the caption to the row it came from --
   which a second copy of the sentences could never be checked against. */
function capFor(id){
 if(id==='none'){
  // THE BASE VIEW GETS A KEY AT LAST. `Just events` is not the absence of a
  // layer, it is the whole recorded game -- and since §20 parked the reference
  // zone the marks it draws have had nothing naming them. The legend is still in
  // the markup; this is where it shows.
  const leg=document.querySelector('#rg .zref .legend');
  if(!leg)return '';
  // ⚠️ JOINED WITH A REAL SEPARATOR, NOT PASTED AS ONE BLOB. The legend's markup
  // has NO WHITESPACE between its entries, and each entry is `nowrap` so its own
  // words stay with their swatch -- so `innerHTML` produced a single unbreakable
  // run 1,166px wide inside a 390px phone. Inline boxes with nothing between
  // them offer no wrap opportunity; the ` · ` puts one back and is visible.
  const keys=[...leg.children].map(x=>x.outerHTML).join(' · ');
  return `<b>Just events</b> — every event the league recorded, in order. ${keys}`;}
 const row=document.querySelector(`#rg .lrow[data-pick="${id}"]`);
 if(!row)return '';
 // ⚠️ THE NAME COMES FROM THE CHIP, NOT THE ROW. The parked rows still carry the
 // names they had when Kevin trimmed them -- `Corsi`, `Slot shots` -- and the
 // chips say `Attempts`, `Slot`. Reading the row's `<b>` printed a caption that
 // named something the reader had not pressed. The label a reader just touched
 // is the one the sentence has to open with.
 const lds=row.querySelector('.lds'), lon=row.querySelector('.lon');
 /* ⭐ AND THE SECOND CLAUSE IS TRUE AGAIN, WHICH IT WAS NOT FOR ONE COMMIT.
    `.lon` says what the layer PUTS ON SCREEN. With every layer's output parked
    it described counters and goaltender cards that were not drawn -- the page
    instructing a viewer to watch things that do not exist, found by LOOKING
    while every test passed. It was suppressed for those two layers behind a set
    with a stated end condition, and this is that condition: the box below the
    ice gives both an output, so the set is GONE rather than emptied. A temporary
    mechanism that outlives its reason is how a workaround becomes the design. */
 /* ⚠️ THE LABEL, NOT THE WHOLE CHIP. Each metric chip now carries a live count
    beside its name, so `chip.textContent` reads "Slot33" -- and this composes
    the caption from it, which would have shipped "**Slot33** — attempts from
    within 33 ft". Third time this seam has decided a design: it ruled out a
    "Done" label on the acknowledgement and forced the count out of the chip's
    text here. Then it decided a FOURTH — the work panel's heading shipped "How
    Goaltending10 is counted", because this caller was fixed and the other one
    was not. The read lives in `chipLabel` now, and every caller uses it. */
 return `<b>${chipLabel(id)}</b> — ${lds?lds.textContent:''}. `
       +`<span class="cap2">${lon?lon.textContent:''}</span>`;}
/**
 * ⭐ THE LAYER'S OUTPUT, IN ONE FIXED GRAMMAR -- docs/below-the-rink-2.md §31.
 *
 * A figure for each club, what is being counted, and one line naming the
 * POPULATION OR CONDITION those figures were counted under. Every layer fills
 * the same four slots, which is what makes the box a constant height and the
 * layers comparable to each other.
 *
 * ⚠️ AND A COLUMN IS COUNTED THE WAY HOCKEY COUNTS IT (§31.4c), which is not
 * one rule for all five. Attempts and Slot belong to the SHOOTER. Blocks belong
 * to the BLOCKER -- the stat every broadcast shows, the one our own ice names,
 * and the one this layer's audit specified before a consistency rule invented
 * later overrode it. A save is by definition against the other club's shot.
 *
 * ⭐ THE RULE THAT REPLACED "EVERY COLUMN IS THE SHOOTER" is narrower and holds:
 * a column carries the club hockey would put it under, the caption says so
 * wherever that reads the opposite way round, and any fact belonging to the GAME
 * rather than to either club goes in the line, where it needs no attribution.
 *
 * ⭐ GOALTENDING IS THE ONE LAYER THAT CANNOT OBEY IT, since a save is by
 * definition against the other club's shot. So it does not pretend to: the
 * label says SAVES BY and the line names the goaltenders, which is also where
 * relief shows up -- 12.2% of games use more than two goaltenders, one in eight,
 * so a form that assumed two would be wrong more often than a shootout happens.
 *
 * ⭐ AND STOPPAGES DEGRADES TO THE CENTRE COLUMN ALONE. A stoppage carries
 * `rsn` and nothing else -- no team, no player, no coordinates -- so a per-club
 * figure would be an attribution the feed does not contain. The form holds and
 * the content admits it has no sides, which is better than a form that lies.
 */
/**
 * ⭐ A LIVE COUNT ON EVERY LENS — what each one would show you, while you watch.
 *
 * Kevin: "let's say an event occurs on the rink… flash the updated metric; if
 * it's not currently shown, flash the control button, which indicates the event
 * applied to that layer" -- and CHENG's improvement on the flash: a COUNT
 * reports where a pulse invites, persists so `prefers-reduced-motion` gets the
 * whole lesson rather than none of it, and is cumulative, so looking away and
 * back still tells you which lens has been busy.
 *
 * ⛔ AND NOT "THE MOST SPECIFIC LAYER LIGHTS", which was my proposal and was
 * wrong. Measured over 262 games and 69,661 frames: Attempts COUNTS 45.0% of
 * frames and would have flashed on 5.8% -- a 7.8x disagreement between the chip
 * and the counter about one quantity, which is this project's signature bug in
 * a new medium. It also asserts the lenses are disjoint when Slot and Blocked
 * are both subsets of Attempts.
 *
 * ⭐ THE COUNTS TEACH CONTAINMENT FOR FREE. Attempts ticks whenever Slot ticks
 * AND at other times, so the subset relation is learned by watching rather than
 * by a label nobody reads. That is what made CHENG's two-strength flash
 * unnecessary: the frequency IS the information.
 */
function drawChipCounts(at){
 const sl=at<0?null:upto(at);
 for(const id of Object.keys(LEDGER)){
  const el=$('n_'+id); if(!el)continue;
  // Pre-game every lens is honestly at zero: nothing has happened to count.
  const n=sl?LEDGER[id](sl).counted.length:0;
  if(String(n)===el.textContent)continue;
  el.textContent=n;
  // The sanctioned motion: a counter moving because a real event happened.
  el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick');}}
function drawLBox(k,L){
 const el=$('lbox'); if(!el)return;
 const id=whichPick();
 // ⚠️ `i` IS THE MODULE-LEVEL PLAYHEAD and this is called from two places: from
 // `render()` with the frame it is drawing, and from `syncPick()` with nothing,
 // where the playhead is the only truth available. Reading it unconditionally
 // would make the box lag the frame render() is mid-way through drawing.
 const at=k==null?i:k, lens=L||(at<0?null:corsi.reduce(upto(at),CTX));
 const b=lboxFor(id,at,lens);
 drawChipCounts(at);
 el.classList.toggle('empty',id==='none');
 /* ⚠️ A FRACTION IS A LONGER STRING THAN A COUNT, and at 360 two of them plus
    the centre label did not fit across the box -- the figures wrapped and the
    box clipped, with the SENTENCE fitting fine. Found by measuring, after two
    rounds of shortening copy that was never the problem. The layer says it is
    wide rather than the stylesheet sniffing the text for " of ", because a rule
    that reads a value's shape breaks the day a club is called `of`. */
 el.classList.toggle('wide',!!b.wide);
 el.classList.toggle('split',!!b.split);
 $('lxA').textContent=b.a;$('lxK').textContent=b.k;$('lxH').textContent=b.h;
 $('lxAn').textContent=b.as||'';$('lxHn').textContent=b.hs||'';
 $('lxN').textContent=b.n;}
/** Split a reducer's counted ids into per-club totals BY THE SHOOTING CLUB. */
function byShooter(ids,slice){
 const t={[AID]:0,[HID]:0};
 for(const id of ids){const e=slice[id]; if(!e)continue;
  const tm=shootingTeam(e,R); if(t[tm]!=null)t[tm]++;}
 return t;}
function lboxFor(id,at,L){
 const none={a:'',k:'',h:'',n:''};
 if(id==='none'){
  /* A SENTENCE ABOUT THE INTERFACE, NOT A METRIC. Shots on goal was proposed
     for this slot and refused (§31.6): `Just events` means no metric, so a
     number here would mislabel the chip.

     ⭐ AND IT NAMES THE CONTROL, NEVER A DIRECTION. It said "Pick a lens ABOVE"
     and the selector is below — the second time in two days a direction word
     went stale, after the caption told viewers to watch "the counters above the
     rink" while those counters were parked. A sentence that points with a
     direction is a sentence that rots the next time anything moves, and this
     page has moved that row three times.
     THE HEADING IS READ FROM THE PAGE, never retyped, which is §27.2's rule
     applied to a second surface: if the selector is renamed the prompt renames
     itself, and if the heading disappears the fallback still makes sense. */
  const lab=document.querySelector('#rg .pklab');
  const w=lab&&lab.textContent?lab.textContent.trim():null;
  return {...none,n:w?`Choose a metric under ${w} and this fills in as the replay runs.`
                    :'Choose a metric and this fills in as the replay runs.'};}
 if(at<0){
  // BEFORE THE FIRST EVENT THERE IS NOTHING TO COUNT, and zeroes would be a
  // claim rather than a blank. Same rule as the split bar refusing to draw a
  // proportion of an empty population.
  const k=LBK[id]; return {a:'',k:k?k(null,null):'',h:'',n:'Press play — nothing has been counted yet.'};}
 const sl=upto(at);
 if(id==='corsi'){
  const a=L.t[AID],h=L.t[HID];
  return {a,k:'SHOT ATTEMPTS',h,n:`On goal, missed or blocked · ${MODE()}.`};}
 if(id==='slot'){
  const c=byShooter(danger.reduce(sl,CTX).counted,sl), tot=L.t[AID]+L.t[HID];
  return {a:c[AID],k:'SHOTS FROM THE SLOT',h:c[HID],
   n:`Of ${tot} attempt${tot===1?'':'s'} so far · ${MODE()}.`};}
 if(id==='blocked'){
  /* ⭐ COUNTED BY THE BLOCKER — the standard attribution, and this REVERSES the
     rule §31.4b laid down a day earlier. Kevin: "blocked shots is quite a common
     stat that gets broadcast on every hockey platform possible, all of them
     attribute the block to the defending team."

     He is right, and the layer's OWN AUDIT already said so before I overrode it:
     `docs/blocked-shots-layer.md` §6 specifies "it marks the block point and
     says so, WITH THE BLOCKER NAMED" and "a per-game count per team, TEAMMATE
     BLOCKS EXCLUDED and stated" -- and excluding teammate blocks is only
     meaningful under blocker credit. The panel tallies by blocker, the ice names
     the blocker, every broadcast names the blocker, and the box named the other
     club. That is one page saying two things.

     ⚠️ AND MY DEFENCE OF THE SHOOTER COUNT WAS AIMED AT THE WRONG TARGET. The
     "gritty defence wins" risk is what §5 of that audit rules on, and what §5
     forbids is publishing a BLOCKS-LEADER WIN RATE. We publish no such rate. A
     bare count is what every broadcast shows, and the inversion it warns about
     (the blocks leader is the attempts trailer 81.7% of the time) is an argument
     against an outcome rate, not against a count.

     ⭐ AND THE TWO THINGS THE LAYER WAS DOING AT ONCE COME APART CLEANLY. Where
     blocks happen is a DEFENSIVE fact and belongs to the blocker; how many
     attempts never got through is a fact about the GAME and belongs to neither,
     so it goes in the line where it needs no attribution at all. */
  const B=blocked.reduce(sl,CTX), tot=L.t[AID]+L.t[HID], n=B.counted.length;
  /* ⭐ AND THE BLOCKS CREDITED TO NOBODY ARE NAMED, because the ledger line now
     joins the club figures with a `+`. Under a slash they were two figures side
     by side and 18 + 22 against 44 counted was nobody's claim; under a plus it
     is an equation, and 7.8% of blocks are by a TEAMMATE — a point shot off
     your own winger's shin — which this layer counts and credits to neither
     club, deliberately and out loud. The caption says why; the line has to say
     where they went, or the arithmetic a reader can do comes up short. */
  const rest=[[B.teammate.length,'by a teammate'],
              [B.unknown.length,'with no blocker recorded']]
    .filter(([k])=>k).map(([k,say])=>({n:k,say}));
  return {a:B.t[AID],k:'BLOCKS',h:B.t[HID],rest,
   n:`Of ${tot} attempt${tot===1?'':'s'} so far, ${n} were stopped by a body.`};}
 if(id==='goaltending'){
  const gs=goalieStats(at), per={[AID]:[],[HID]:[]};
  for(const gid of G.goalies){const p=R[gid]; if(!p||per[p.tid]==null)continue;
   const st=gs[gid]; if(!st||!st.f)continue;
   per[p.tid].push({nm:p.nm,s:st.s,f:st.f});}
  const sum=t=>per[t].reduce((x,g)=>[x[0]+g.s,x[1]+g.f],[0,0]);
  const [sa,fa]=sum(AID),[sh,fh]=sum(HID);
  // A FRACTION, NEVER A RATE, so no minimum-n threshold is needed to be honest
  // -- the same rule the goaltender card already states in its own comment.
  /* EACH CLUB'S GOALTENDER UNDER THAT CLUB'S FIGURE. `then` is what relief
     looks like, and it needs no special case -- 12.2% of games use more than
     two goaltenders, so this is the normal path once every eight games. */
  const say=t=>per[t].map(g=>g.nm).join(' then ');
  /* ⭐ WHAT THESE TWO FIGURES ADD UP TO, because it is not what they look like.
     Every other layer shows a count per club and `a + h` is the counted total.
     Here they are fractions: the denominators sum to the counted events (shots
     faced) and the numerators sum to the saves, so a ledger line reading
     `5 of 5 WSH + 4 of 5 VGK = 10 counted` invites 5 + 4 = 9 against a 10 on
     screen. The layer names the sum; the panel prints the name it is given. */
  return {wide:true,split:true,a:fa?`${sa} of ${fa}`:'—',k:'SAVES BY',h:fh?`${sh} of ${fh}`:'—',
   as:say(AID),hs:say(HID),sums:'shots faced',
   /* ⭐ THE NAMES ONLY, AND THE FLIP MOVED TO THE CAPTION. This was the one
      sentence in the box whose LENGTH IS DATA -- two goaltender names, plus
      "then X" on a relief -- so it ran to three lines at 360 and 390 and was
      CLIPPED by the fixed height while the other five fitted in two. No amount
      of trimming a constant fixes a variable.
      §27.1 already says where each half belongs: the caption under the selector
      says what the LENS IS, and "a save is against the other club's shot" is a
      property of the lens, true before the puck drops. The box says what is true
      NOW, which is who is in net -- and that is also where relief shows up, in
      the 12.2% of games that use more than two goaltenders. */
   n:(sa+sh+fa+fh)?'':'No shot has reached a goaltender yet.'};}
 if(id==='whistle'){
  const W=whistle.reduce(sl,CTX), n=W.whistles.length, w=latest(W);
  const nm=w?(WHY[w.rsn]&&WHY[w.rsn].name)||w.rsn:null;
  return {a:'',k:`${n} STOPPAGE${n===1?'':'S'}`,h:'',
   /* ⭐ THE VARIABLE STATE ONLY — the third time this rule has been paid for.
      The clause about a stoppage having no club is a CONSTANT and belongs to the
      lens, so it lives in the caption (§27.1). Leaving it here made the line
      `Most recently: <reason>` plus a fixed sentence, and a reason is DATA:
      "Offside" fits and "Goalie stopped play after a shot on goal" does not.
      The deploy gate caught it on the reference game after a local pass on the
      Cup Final — two games, two string lengths, and the gate was measuring the
      one I was not.
      ⭐ THE RULE, now that it has bitten three times (the goaltending flip, the
      blocked attribution, this): THE BOX'S LINE CARRIES ONLY WHAT CHANGES;
      every constant explanation belongs in the caption. A fixed box cannot hold
      a constant sentence AND an unbounded one. */
   /* ⭐ AND HOW LONG AGO, THROUGH `sinceLine` RATHER THAN A SECOND COPY OF IT.
      Kevin: "didn't we used to have a time associated with the most recent
      event?" We did -- it was built for his own complaint that the card and the
      rink described different moments (the card ran a median 29s behind the
      playhead), and it went dark with the panel. It already knows the one rule
      that matters: across a period break the difference in `s` is not an
      elapsed time, so it says nothing rather than computing a wrong one. */
   n:nm?`Most recently: ${nm} ${sinceLine(w)}`.trim().replace(/\s+·/g,' ·')
       :'Play has not stopped yet in what you have watched.'};}
 return none;}
/** The centre label alone, for the pre-game frame where there is nothing to count. */
const LBK={corsi:()=>'SHOT ATTEMPTS',slot:()=>'SHOTS FROM THE SLOT',
 blocked:()=>'BLOCKS',goaltending:()=>'SAVES BY',whistle:()=>'STOPPAGES'};
function syncPick(){
 if(picking)return;
 const on=PICKS.filter(([,get])=>get()).map(([id])=>id);
 // ⭐ MORE THAN ONE ON IS NOT REPRESENTABLE ON THIS ROW, and it is reachable --
 // `?layer=corsi,slot` is a URL anyone can type. The row shows the FIRST in
 // this file's order rather than showing nothing, because a control that goes
 // blank is a control that says the page is off when it is not.
 const cur=whichPick();
 document.querySelectorAll('#rg .pk').forEach(b=>
  b.setAttribute('aria-checked',String(b.dataset.l===cur)));
 const cap=$('lcap');if(cap)cap.innerHTML=capFor(cur);
 // The box is a view of the same choice, so it is refreshed from the same
 // place. It also refreshes every frame from `render()`; this call is what
 // makes a TOGGLE change it without waiting for the next event.
 drawLBox();
 // The base view has no work to show, so the panel closes with the last layer;
 // any other change redraws it against the layer that is now on.
 if(cur==='none'){if(workOpen)closeWork();}
 else if(workOpen)render(i,'');}
/** The one active layer, or `none`. The single reader of the five booleans. */
function whichPick(){
 const on=PICKS.filter(([,get])=>get()).map(([id])=>id);
 return on.length?on[0]:'none';}
document.querySelectorAll('#rg .pk').forEach(b=>{
 b.onclick=()=>pick(b.dataset.l);});
/* ⭐ A LAYER BUTTON IS A ROW NOW, SO ITS LABEL IS NOT ITS textContent.
   Each setter used to write `(on?'✓ ':'＋ ')+name` over the whole button, which
   would erase the mark, the description and the state pill the row is made of.
   The state lives in one element and the setter writes only that. Same three
   things still change together -- class, aria-pressed, visible state -- and
   render-preview's check that the preview goes THROUGH setCorsi rather than past
   it is retargeted at the element that now carries the answer. */
function lyrState(id,on){const n=$(id);if(n)n.textContent=on?'On':'Off';zoneState();}
/* ⭐ A COLLAPSED CONTROL MUST STILL REPORT ITS STATE. Every zone is a disclosure
   now, and without the badge marks appear on the ice with nothing on screen
   accounting for them.

   ⭐ THE AUTO-OPEN IS GONE, AND POSITION REPLACED IT. It existed for one reason:
   the menu sat 1,219px down a phone page, so a deep link landing with a layer on
   -- eight of the learn page's nine doors do -- put the only way to turn that
   layer off behind a closed drawer far below the fold. CHENG's one-way trip.
   The menu is now the third element on the page, 46px above the rink, measured
   at y=459 on a first visit at 390 and y=222 on a return: ON SCREEN WITHOUT
   SCROLLING IN BOTH VISITOR STATES, with the badge naming the layer on its face.
   Reachability no longer depends on the drawer being open.

   And keeping both cost the whole hero. Measured at 390 with `?layer=whistle`:
   the opened list is 600px tall, so it pushed the rink top to y=830 and a
   visitor arriving at a door met a first screen with NO ICE ON IT AT ALL. The
   mechanism that made the collapse safe in one position makes it unusable in
   this one; the badge is the half that travels.

   DERIVED FROM THE DOM, NOT FROM A LIST OF LAYERS. `[aria-pressed="true"]` on a
   row IS the on-state, so a sixth layer is covered the day it is added and a
   layer that stops setting the attribute stops being counted -- rather than a
   second enumeration here that agrees with the rows until someone edits one. */
function zoneState(){
 let on=0;document.querySelectorAll('#rg .lrow').forEach(r=>{
  if(String(r.getAttribute('aria-pressed'))==='true')on++;});
 const b=$('zLayersOn');if(b)b.textContent=on?`${on} layer${on===1?'':'s'} on`:'';
 syncPick();}
zoneState();
function setCorsi(){document.getElementById('rg').classList.toggle('corsi',corsiOn);$('lyCorsi').setAttribute('aria-pressed',corsiOn);lyrState('stCorsi',corsiOn);}
/* ⭐ THE WORK PANEL FOLLOWS THE SELECTOR, NOT ONE LAYER. It used to close itself
   inside `setCorsi`, which was right while it only ever explained Attempts:
   turning that layer off left a panel explaining nothing. Now it explains
   whichever layer is on, so switching Attempts → Slot must REDRAW it, not shut
   it -- and `setCorsi` turning false is exactly what happens on that switch.
   The condition is therefore the SELECTOR's state, not any one boolean. */
function closeWork(){setWork(false);}
function setHd(){document.getElementById('rg').classList.toggle('slot',hdOn);$('lyHd').setAttribute('aria-pressed',hdOn);lyrState('stHd',hdOn);render(i,'');}
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
/* ⭐ TRAILS IS BEHIND A DISCLOSURE TOO, SO ITS SUMMARY CARRIES ITS SETTING.
   The same rule the layer menu follows: a control you cannot see must still be
   able to say what it is doing, or the ice fills with marks and nothing on
   screen accounts for them. The badge quotes the PRESSED BUTTON'S OWN LABEL
   rather than re-deriving one from `trails` -- the label is written by
   `trailsLabel` and changes with the ends mode, and two spellings of one state
   is how a readout starts disagreeing with the thing it reports. */
function syncTrails(){let lab='';
 document.querySelectorAll('#rg .tbtn').forEach(b=>{const on=b.dataset.t===trails;
  b.setAttribute('aria-pressed',on);if(on)lab=b.textContent;});
 const z=$('zTrailsOn');if(z)z.textContent=lab.toLowerCase();}
document.querySelectorAll('#rg .tbtn').forEach(b=>b.addEventListener('click',()=>{
 trails=b.dataset.t;syncTrails();render(i,'');}));
syncTrails();
/* THE RING'S CONTROL, IN THE SAME GRAMMAR as trails and situations: two buttons
   that each NAME A STATE OF THE ICE rather than a switch position, a summary
   that carries the live setting because the drawer is closed, and a note whose
   default branch describes what the OTHER choice would do -- the 2026-08-16
   rule, since a button has to be predictable before the click or it is a dare. */
function syncCue(){let lab='';
 document.querySelectorAll('#rg .cbtn').forEach(b=>{const on=(b.dataset.c==='on')===cueOn;
  b.setAttribute('aria-pressed',on);if(on)lab=b.textContent;});
 const z=$('zCueOn');if(z)z.textContent=lab.toLowerCase();
 const n=$('nCue');if(n)n.textContent=cueOn
  ?'A patch of green shades where the next play happens, a moment before it does. It is the one thing on this ice we know because we read ahead — No shading removes it.'
  :'Nothing is drawn ahead of the play. Show the shading marks the next event’s spot before the play arrives, so your eye is already there.';}
document.querySelectorAll('#rg .cbtn').forEach(b=>b.addEventListener('click',()=>{
 cueOn=b.dataset.c==='on';syncCue();render(i,'');}));
syncCue();
$('lyHd').addEventListener('click',()=>{hdOn=!hdOn;setHd();});
function goalieStats(k){return goaltending.reduce(upto(k),CTX).g;}
function setGoalie(){document.getElementById('rg').classList.toggle('goalie',goalieOn);$('lyGoalie').setAttribute('aria-pressed',goalieOn);lyrState('stGoalie',goalieOn);render(i,'');}
$('lyGoalie').addEventListener('click',()=>{goalieOn=!goalieOn;setGoalie();});
function setWhistle(){document.getElementById('rg').classList.toggle('whistle',whistleOn);$('lyWhistle').setAttribute('aria-pressed',whistleOn);lyrState('stWhistle',whistleOn);render(i,'');}
$('lyWhistle').addEventListener('click',()=>{whistleOn=!whistleOn;setWhistle();});
function setBlock(){document.getElementById('rg').classList.toggle('blocked',blockOn);$('lyBlock').setAttribute('aria-pressed',blockOn);lyrState('stBlock',blockOn);render(i,'');}
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

/**
 * ⭐ COPY A LINK TO THIS MOMENT — the write side of a seam that has only ever
 * been read.
 *
 * `deeplink.js::format` says in its own docstring that it is "the link a copy
 * this moment control emits", and until now nothing emitted one: the page never
 * wrote its position anywhere, so `?at=` could only be hand-typed off the
 * scoreboard. Kevin, looking at his own address bar: it holds `?game=…` and
 * nothing else however far you scrub.
 *
 * ⭐ THE CONFIRMATION NAMES THE EVENT THE LINK RESOLVES TO, which is CHENG's
 * design and a better one than a warning beside the button: the caveat worth
 * stating is that a link lands on the nearest RECORDED moment, and the way to
 * state it is to say which one, checkable by the person who just pressed. So the
 * URL is built, PARSED BACK, and resolved through the same functions a visitor's
 * browser will use — and the moment reported is the moment that resolved, never
 * the moment we meant.
 *
 * ⚠️ AND THAT ROUND TRIP IS THE INVARIANT, asserted over 160,012 shareable
 * moments in 607 games: format → parse → resolve returns the frame it started
 * from, 0 failures. It includes every shootout attempt, which is where CHENG
 * expected a bad link — the whole shootout shares ONE clock, `5-00:00`, with up
 * to 25 events on it, and the ordinal carries them exactly. Ordinals are not a
 * shootout special case at all: 28.8% of all shareable moments need one.
 *
 * ⭐ WHAT TRAVELS WITH THE MOMENT. The LENS, because "watch this shot get
 * counted" is the site's argument and a link that arrives with it on delivers it
 * (the learn doors already work this way). The STRENGTH always, which is
 * `format`'s existing ruling and I am keeping it against CHENG's suggestion to
 * omit the default: a link is read long after it is written, and one that omits
 * the mode inherits whatever the default becomes. The ENDS mode only when it is
 * NOT the default, and the asymmetry is principled rather than aesthetic —
 * strength changes every COUNT on the page, ends changes only the drawing and
 * the page discloses it in words at each period break.
 */
function shareUrl(){
 const n=i<0?null:EVI[i];
 const pick=whichPick();
 const q=n==null
   // PRE-GAME IS A STATE, NOT A PLAY (A11), so there is no moment to name and
   // the link carries none — it opens where an unadorned visit opens.
   ?'?'+new URLSearchParams({game:String(G.game.id)}).toString()
   :format({game:G.game.id,events:G.events,index:n,
            layers:pick==='none'?[]:[pick],strength:evenOnly?'even':'all'});
 // The ends mode is appended rather than passed, because `format` does not carry
 // it and only a non-default is worth the noise. See the note above.
 return q+(ENDSMODE!==DEFAULT_ENDS?'&ends='+ENDSMODE:'');}

const shareBtn=$('share'),shareSaid=$('sharesaid');
if(shareBtn)shareBtn.onclick=()=>{
 const q=shareUrl();
 const url=location.origin+location.pathname+q;
 /* RESOLVED THROUGH THE VISITOR'S OWN PATH, not through the index we started
    from. If those two ever disagree the confirmation says what the LINK does,
    which is the fact the sharer needs. */
 const back=parse(new URLSearchParams(q));
 const r=resolve(G.events,back.at);
 const e=back.at?G.events[r.index]:null;
 const where=e?`<b>P${e.per} ${e.rem}</b> · ${ESC(playSaid(e))}`
             :'<b>the start of the game</b>';
 const done=ok=>{shareSaid.innerHTML=ok
   ?`Copied — it opens at ${where}.`
   // ⚠️ A REFUSED CLIPBOARD IS NOT A FAILED FEATURE. Permission can be denied
   // and there is nothing to retry, so the link itself goes on screen where it
   // can be selected by hand — the same move as naming the game we could not
   // publish instead of printing an HTTP code.
   :`Copy this: ${ESC(url)}`;};
 try{navigator.clipboard.writeText(url).then(()=>done(true),()=>done(false));}
 catch(_){done(false);}};
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
