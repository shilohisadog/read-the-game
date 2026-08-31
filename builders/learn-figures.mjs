/**
 * The learn page's rule diagrams — the ice, with nobody's game on it.
 *
 * ⭐ WHY THIS IS ALLOWED AT ALL, since every other mark this project draws is a
 * claim about a game that happened. Kevin, 2026-08-31: *"the learning cards
 * don't have to be specific replay events… we have some discretion in what we
 * overlay onto the ice for explanatory purposes"* — and then the line that makes
 * it safe: *"it's the same ice rink, but the graphics are noticeably and
 * obviously different between the learning cards and the game pages."*
 *
 * A DIAGRAM IS NOT A MEASUREMENT. The honesty doctrine binds claims about what
 * happened; a diagram claims something about the RULEBOOK, which is true
 * independently of our archive. That is a different kind of statement and it
 * gets a different surface: these never appear on the game page.
 *
 * ⭐⭐ AND THE PROVENANCE GRAMMAR IS LOAD-BEARING, NOT STYLISTIC (CHENG).
 *
 *     filled, in a club's colour  =  recorded
 *     outlined, neutral           =  illustrative
 *
 * It was tempting to say "an arrow means diagram, because the replay never draws
 * one" — true today, and it stops being true the moment anything directional
 * lands on the game ice, which is live work. So the arrow is a diagram
 * CONVENTION and the outline is the diagram SIGNAL. Nothing here is ever filled
 * with a club colour, and `test/learn-figures.test.js` asserts it.
 *
 * ⭐ THE ACCUMULATE RULE — a still frame of any animation must be true on its
 * own. Steps ADD, they never replace, so `prefers-reduced-motion` lands on the
 * complete picture with no second code path to maintain. Every token's SVG
 * coordinates are its FINAL position and the animation offsets it backwards, so
 * "no animation" is "the end of the story", which is the whole story.
 *
 * It also caught a small dishonesty. The empty-net figure wanted the goalie to
 * VANISH; with motion off that reads as a goalie in the crease and an empty
 * crease at once. He skates to the bench instead — which is what actually
 * happens, so the accessibility rule produced the more truthful drawing.
 *
 *   node builders/learn-figures.mjs            ->  data/learn-figures.json
 *   node builders/learn-figures.mjs --verify   ->  exit 1 if the file is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { furniture, netGlyph, boardsY, SX, SY } from '../src/lib/rinkart.js';
import { BLUE_LINE_X, NEUTRAL_DOT_X, NET_X } from '../src/lib/rink.js';
import { NEUTRAL } from '../src/lib/teams.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── the drawing kit ────────────────────────────────────────────────────────
   Coordinates are SVG user units on the same 200x85 sheet the replay uses, so a
   diagram and the game are the same rink to the pixel. `SX`/`SY` convert from
   rink feet, and every figure below states its positions in FEET for the same
   reason the slot tint does: a reader can check them against the rulebook. */

const f = n => +n.toFixed(2);

/* ⭐⭐ EVERY TOKEN IS ANNOTATION, AND ONLY THE RINK IS GEOMETRY.
 *
 * The lines, the spots, the boards, the net and the slot region are real things
 * with real sizes and must scale with the crop — that is what makes the diagram
 * and the replay the same rink. A dot standing for a player is NOT: its size is
 * a legibility choice, so it should be a constant number of PIXELS across every
 * figure however tightly each one is framed.
 *
 * ⚠️ FOUND ON THE SLOT FIGURE, WHERE THE CROP IS TIGHTEST AND THE ERROR FINALLY
 * SHOWED. At `r = 4.4` rink units the goaltender token was 8.8 FEET across, beside
 * a net that is 6 — a goalie wider than the goal, on every figure, invisible on
 * the full sheet because everything there is small. `k` is the figure's
 * units-per-200, so one number of pixels serves all five.
 */
const tok = (x, y, k = 1, r = 4) =>
  `<circle class="dgtok" cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}"/>`;
const ghost = (x, y, k = 1, r = 4) =>
  `<circle class="dgghost" cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}"/>`;
const puck = (x, y, k = 1) =>
  `<circle class="dgpuck" cx="${f(x)}" cy="${f(y)}" r="${f(2.4 * k)}"/>`;
const puckGhost = (x, y, k = 1) =>
  `<circle class="dgpuck dgghost" cx="${f(x)}" cy="${f(y)}" r="${f(2.4 * k)}"/>`;

/** An arrow from one point to another, stopping short so the head clears the token. */
function arrow(id, x1, y1, x2, y2, back = 5) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ex = x2 - (dx / len) * back, ey = y2 - (dy / len) * back;
  return `<line class="dgarrow" x1="${f(x1)}" y1="${f(y1)}" x2="${f(ex)}" y2="${f(ey)}"`
       + ` marker-end="url(#${id}head)"/>`;
}

/**
 * The numbered badge that ties a place on the ice to a line of the caption.
 *
 * ⭐⭐ ANNOTATION IS SIZED IN SCREEN TERMS, GEOMETRY IN RINK TERMS, and the slot
 * figure is what forced the distinction. Every figure renders about 359px wide
 * on a phone whatever it FRAMES, so a badge of a fixed 4.6 rink units is 8px
 * across on the full sheet and 20px on the slot's 81-unit crop — the badges came
 * out bigger than the net. A blue line is a real thing 200 feet of ice wide and
 * must scale with the crop; a numbered marker is a label about the drawing and
 * must not. `k` is the figure's units-per-200, so `4.6 * k` is a constant number
 * of PIXELS no matter how tightly the figure is framed.
 */
const badge = (n, x, y, k = 1) =>
  `<g class="dgbadge"><circle cx="${f(x)}" cy="${f(y)}" r="${f(4.6 * k)}"/>`
  + `<text x="${f(x)}" y="${f(y)}" dy="${f(1.9 * k)}" font-size="${f(5.6 * k)}">${n}</text></g>`;

/** The arrowhead, namespaced — five figures on one page share a document. */
const defs = id =>
  `<defs><marker id="${id}head" viewBox="0 0 8 8" refX="6" refY="4"`
  + ` markerWidth="5" markerHeight="5" orient="auto-start-reverse">`
  + `<path class="dgheadp" d="M 0 0 L 8 4 L 0 8 z"/></marker></defs>`;

/**
 * ⭐ THE FIGURE SAYS WHAT IT IS, ON ITSELF.
 *
 * NOT THE GUARD, and the distinction matters. What keeps a diagram from being
 * read as a game is the outlined-neutral grammar and the fact that these live on
 * a different page entirely; a label is read by people who already know. This
 * earns its place for a different reason: the offside figure puts a skater at a
 * coordinate nobody recorded, and a page whose whole promise is "nothing
 * invented" should say plainly, on the drawing, which drawings are invented.
 * A label that thinks it is a guard is how the next figure ships without the
 * grammar.
 */
/**
 * The line a rule NAMES, lit — and it ends on the boards like every other line.
 *
 * ⭐ IT BORROWS THE COLOUR OF THE LINE IT EXPLAINS, which is the rule app.js
 * already applies to the slot tint and the zone band: "each tint borrows the
 * colour of the mark it explains, so the palette does not grow." The first
 * icing draft lit the CENTRE LINE and a GOAL LINE — both red — in blue, which
 * to a novice reads as "blue line", the one thing icing is not about.
 *
 * ⚠️ AND IT ASKS `boardsY` RATHER THAN CARRYING THE ANSWER. The first draft
 * typed `y1="7.02" y2="77.98"` for the goal line, which is `boardsY(189)`
 * spelled out — a second statement of the exact rule that function exists to be
 * the only copy of, and the defect its own comment in rinkart.js describes.
 */
const hot = (x, cls) => {
  const [y1, y2] = boardsY(x);
  return `<line class="dghot ${cls}" x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2)}"/>`;
};

const stamp = (x, y, k = 1) =>
  `<text class="dgstamp" x="${f(x)}" y="${f(y)}" font-size="${f(4.4 * k)}"`
  + ` letter-spacing="${f(0.09 * 4.4 * k)}">Diagram</text>`;

/* ── the equipment ──────────────────────────────────────────────────────────
   ⭐ A CROP OF ICE WITH NO NET IN IT DOES NOT READ AS AN END OF A RINK.
   Kevin, on the first offside page: *"we need a goal (at least, maybe even the
   goalie) to provide another level of orientation for the viewer... the rink
   snippet just doesn't look right without a net and goalie."*

   He is right, and the reason is that a crop removes the thing that tells you
   WHICH WAY the play is going. The full sheet has two nets and is obviously
   symmetric; a crop has one end, and without the net that end is just more ice.
   The blue line alone cannot say "this is the attacking zone" to someone who
   does not already know what a blue line means -- which is the entire audience
   for this page.

   BOTH NETS, AND THE CROP DECIDES WHAT IS SEEN. A figure that drew only the
   attacked net would need to know which end it had framed, which is a second
   place the crop is decided; the viewBox already owns that.

   ⭐ NEUTRAL, NOT A CLUB COLOUR, and imported rather than typed. `netGlyph`
   paints the frame and the strands in whatever colour it is handed, and on the
   game page that colour is the club's -- which is exactly the provenance signal
   these diagrams must not borrow. `teams.NEUTRAL` is the palette's own
   no-team grey, and a test asserts it has not become some club's actual hex. */
const nets = id =>
  netGlyph(`${id}netA`, SX(-NET_X), NEUTRAL) + netGlyph(`${id}netB`, SX(NET_X), NEUTRAL);

/** A goaltender, in the one place on the ice only a goaltender stands. */
const keeper = (gx, k = 1) =>
  // ITS POSITION IS ITS LABEL. Drawn in the diagram's own vocabulary -- outlined,
  // neutral, the same token every other player gets -- because a second style of
  // player token would be a second thing for a novice to decode. Nobody else
  // stands in the crease, so the crease says which one he is.
  `<circle class="dgtok dgkeep" cx="${f(gx < 100 ? gx + 4.5 : gx - 4.5)}" cy="42.5" r="${f(4.4 * k)}"/>`;

/* ── how a token travels ────────────────────────────────────────────────────
   ⭐ THE PAGE OPENS ON THE FINISHED PICTURE, THEN REPLAYS. Found by looking: a
   screenshot of the first build caught frame 0 of the loop, where every token
   sits ON TOP OF ITS OWN GHOST and both arrows point at empty ice. That is not
   a bad screenshot, it is what every reader sees at the moment the page loads --
   the pre-story frame, which is the one frame of the cycle that teaches nothing.
   The DELAY fixes it for free: with no `animation-fill-mode`, an element uses
   its own styles until the delay elapses, and its own position IS the end of the
   story. So the reader lands on the complete diagram, reads it, and only then
   watches it build. The delay applies to the first iteration only, which is
   exactly the one that matters.

   ⭐ AND THE WRAP IS HIDDEN. An infinite loop teleports from 100% back to 0%,
   and a token snapping the length of the neutral zone every cycle looks like a
   glitch rather than a lesson. It fades out where it came to rest and fades in
   where it starts, so the reset happens while nothing is on screen to see it.
   `opacity` is safe to animate here for the same reason the transform is: with
   motion off, none of it applies and the token is simply drawn, fully opaque, at
   the end of the story. */
const CYCLE = '9s', DELAY = '2.5s';
const travel = (name, from, to) =>
  `@keyframes ${name}{`
  + `0%{transform:translate(${f(from.x - to.x)}px,${f(from.y - to.y)}px);opacity:0}`
  + `8%{transform:translate(${f(from.x - to.x)}px,${f(from.y - to.y)}px);opacity:1}`
  + `55%{transform:translate(0,0);opacity:1}`
  + `94%{transform:translate(0,0);opacity:1}`
  + `100%{transform:translate(0,0);opacity:0}}`;

/* ── OFFSIDE ────────────────────────────────────────────────────────────────
   ⭐ THE ONE RULE THE SITE ADMITS IT CANNOT SHOW. The card's own words, live on
   production: *"The feed records the call and the restart, never the crossing —
   so watch the line, not the play."* Zero of 4,160 offside stoppages carry a
   coordinate, a zone or a player, so the crossing has never been drawable from
   data and never will be. A diagram is the only way this rule gets taught here,
   and the sentence above is why the figure belongs beside it: together they
   teach the rule AND the limit, which is the more useful pair.

   ⚠️ AND IT IS THE FIGURE THAT COMES CLOSEST TO A LINE WE DO NOT CROSS. It puts
   a skater at a coordinate nobody recorded — the thing `on-the-ice.html` refuses
   in its own banner. That is legitimate for a rule diagram and would be a
   violation as a game rendering, so the outlined-neutral grammar above is doing
   real work here rather than decorating.

   ATTACKING TOWARD SCREEN-RIGHT, which is the reading direction. `SX` decreases
   with rink x, so the attacked net is at rink -89 and the blue line the play is
   entering is rink -25. */
function offside() {
  const id = 'of-';
  const BLUE = SX(-BLUE_LINE_X);           // the line being entered
  const K = 123 / 200;   // this figure's crop, so annotation stays screen-sized
  const DOT = { x: SX(-NEUTRAL_DOT_X), y: SY(22) };   // where an offside restarts
  /* ⭐⭐ ① IS THE PUCK CARRIER AND ② IS THE TEAMMATE WHO BEATS HIM IN.
     Kevin, looking at the first draft: *"1) needs to be the player controlling
     the puck and then the arrow at the top needs to be 2), who would then move
     into the zone before the player carrying the puck 1)."*
     He is right twice over. The drawing had a BARE PUCK travelling up the ice
     with nobody carrying it, which is not a thing that happens and quietly made
     the rule look like it was about a loose puck; and the numbers were pinned to
     the wrong actors, so ① named the offender rather than the man he skated
     past. The puck now belongs to a player and moves as one object with him.

     ⭐ THE COMPARISON THE DRAWING HAS TO WIN AT A GLANCE, in feet, so it can be
     checked: the teammate finishes 18 ft INSIDE the zone and the PUCK 9 ft
     outside it. An earlier draft had 4 ft, and at 256px that gap was thinner
     than the token's own outline -- the puck read as sitting on the line, which
     is the opposite of the rule. And it is the PUCK's position that decides an
     offside, not the carrier's, so the puck is the thing kept clearly short. */
  const C0 = { x: SX(14), y: SY(-15) }, C1 = { x: SX(-10), y: SY(-15) };
  const T0 = { x: SX(18), y: SY(5) }, T1 = { x: SX(-43), y: SY(5) };
  const PUCK = { x: 5.5, y: 1.4 };         // carried just ahead of the stick
  return {
    // From the far neutral-zone dot to the end boards: one blue line, the ice
    // either side of it, and both spots a draw could come back to.
    viewBox: `${f(SX(24))} 0 ${f(SX(-89) - SX(24) + 10)} 85`,
    group: 'rules',
        label: 'Diagram: an attacking skater crosses the blue line before the puck '
         + 'carrier does, so play stops and the face-off comes back outside the zone.',
    /* ⭐ THE DOOR PROMISES WHAT IT ACTUALLY DELIVERS, AND EACH RULE DELIVERS
       SOMETHING DIFFERENT. Kevin: *"we say 'See it in a real game', which isn't
       consistent with what we are providing... something that ensures there
       isn't a misconception over '...a real game'."*
       He is right, and on THIS rule the mismatch is at its worst. An offside
       stoppage carries no coordinate, no zone and no player, and stoppages are
       not even on the playable timeline -- so the link resolves to the FACE-OFF
       that restarts play. "See it in a real game" promises the crossing, which
       is the one thing this page has just finished explaining we can never show.
       The restart is what there is, so the restart is what the button says. */
    door: 'See the restart in our replay',
    svg: defs(id)
      // NO TINTS. The slot lozenge and the blue-line band are measurements of
      // ours, and this figure is about the league's rulebook -- see rinkart.js.
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">${keeper(SX(-NET_X), K)}</g>`
      + `<g class="dgplay">`
      // Where each of them set off — drawn faintly, and they stay drawn.
      + ghost(C0.x, C0.y, K) + puckGhost(C0.x + PUCK.x, C0.y + PUCK.y, K) + ghost(T0.x, T0.y, K)
      + arrow(id, C0.x, C0.y, C1.x, C1.y) + arrow(id, T0.x, T0.y, T1.x, T1.y)
      // The line is lit where the rule is decided.
      + hot(BLUE, 'blue')
      // ① THE CARRIER AND HIS PUCK ARE ONE GROUP, so they cannot drift apart in
      // the animation -- "controlling the puck" has to survive the motion.
      + `<g class="dgmove dgm-c">${tok(C1.x, C1.y, K)}${puck(C1.x + PUCK.x, C1.y + PUCK.y, K)}</g>`
      // ② the teammate, already inside the zone with the puck still outside.
      + `<g class="dgmove dgm-t">${tok(T1.x, T1.y, K)}</g>`
      // ③ and the punishment, which is WHERE — the same claim the icing card makes.
      + `<circle class="dgspot" cx="${f(DOT.x)}" cy="${f(DOT.y)}" r="4.2"/>`
      // EACH BADGE SITS ON THE THING ITS LINE IS ABOUT: ① on the carrier, ② on
      // the teammate who has gone too far, ③ on the spot play comes back to.
      + badge(1, C1.x - 3, C1.y + 9, K) + badge(2, T1.x, T1.y - 9, K)
      + badge(3, DOT.x, DOT.y - 9, K)
      + stamp(SX(20), SY(34), K)
      + `</g>`,
    steps: [
      'The puck carrier comes up the ice toward the blue line.',
      'A teammate crosses the line <b>before the puck does</b> &mdash; that is offside. '
      + 'The puck has to enter the zone first.',
      'Play stops, and the face-off comes back <b>outside</b> the zone.',
    ],
    // ⭐ THE MOTION IS EMITTED BESIDE THE GEOMETRY, from the same two points, so
    // a token cannot animate from somewhere it was never drawn. Each transform
    // is the token's start MINUS its end: the element sits at the end, and the
    // animation pushes it back to the start and lets it travel home. With
    // animation off it is simply at the end, which is the finished diagram.
    css: [travel(id + 'c', C0, C1), travel(id + 't', T0, T1),
      `.dgfig.of .dgm-c{animation:${id}c ${CYCLE} ease-in-out ${DELAY} infinite}`,
      `.dgfig.of .dgm-t{animation:${id}t ${CYCLE} ease-in-out ${DELAY} infinite}`,
    ].join('\n'),
  };
}

/* ── ICING ──────────────────────────────────────────────────────────────────
   ⭐ THE ONE FIGURE THAT MUST NOT CROP, because the rule IS the length of the
   ice. Offside happens at one line and a crop makes it bigger; icing is a
   hundred and twenty feet of travel and cropping it would remove the subject.
   So this is the full sheet, both nets, both goaltenders — and it is the figure
   that pays for that in scale: at 359px wide a rink unit is 1.8px against
   offside's 2.9, so every token here is 61% the size of the same token there.
   Looked at before it was believed.

   THE TWO LINES ARE THE ONES THE CAPTION ALREADY NAMES. `linesFor('icing')`
   returns the centre line and the FAR goal line, and the live caption says "from
   behind centre, past the far goal line". The diagram lights the same two, so a
   reader meets one geometry in both places rather than two descriptions of it.

   ⛔ AND IT SHOWS NOBODY TOUCHING THE PUCK BY SHOWING NOBODY, which is the
   honest limit of a still drawing. "Untouched" is a negative and the steps carry
   it; drawing a defender reaching and missing would be inventing a play. */
function icing() {
  const id = 'ic-';
  // The shooter is BEHIND THE CENTRE LINE — screen-left of x=100 — and the draw
  // comes all the way back to an end-zone dot on that same side. In feet so it
  // can be checked: he shoots from 28 ft inside his own half.
  const S = { x: SX(28), y: SY(12) };
  const P0 = { x: S.x + 5.5, y: S.y };
  const P1 = { x: 196, y: S.y };             // past the far goal line, into the corner
  const DOT = { x: SX(69), y: SY(-22) };     // the offending team's own end-zone spot
  return {
    viewBox: '0 0 200 85',
    group: 'rules',
        label: 'Diagram: a player shoots the puck from behind the centre line, it '
         + 'crosses the far goal line untouched, and the face-off comes all the '
         + 'way back to the shooting team’s end.',
    door: 'See a real icing in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">${keeper(SX(-NET_X), 1)}${keeper(SX(NET_X), 1)}`
      + ghost(S.x, S.y) + puckGhost(P0.x, P0.y)
      + arrow(id, P0.x, P0.y, P1.x, P1.y, 4)
      // THE TWO LINES RULE 81 NAMES, lit exactly as the game page lights them.
      + hot(100, 'red') + hot(SX(-89), 'red')
      // THROUGH `tok`, NOT HAND-WRITTEN. This was a literal `r="4"` that
      // bypassed the helper entirely, so it would not have scaled with the crop
      // and nothing about it moved when the sizing rule changed.
      + tok(S.x, S.y, 1)
      + `<g class="dgmove dgm-p">${puck(P1.x, P1.y, 1)}</g>`
      + `<circle class="dgspot" cx="${f(DOT.x)}" cy="${f(DOT.y)}" r="4.2"/>`
      + badge(1, S.x - 8, S.y + 6, 1) + badge(2, P1.x - 4, P1.y - 9, 1)
      + badge(3, DOT.x, DOT.y - 9, 1)
      + stamp(SX(60), SY(34), 1)
      + `</g>`,
    steps: [
      'A player shoots the puck from <b>behind the centre line</b>.',
      'It crosses the <b>far goal line</b> with nobody touching it.',
      'Play stops, and the face-off comes all the way back to <b>the shooting '
      + 'team&rsquo;s own end</b> &mdash; that dot is the whole punishment.',
    ],
    css: [travel(id + 'p', P0, P1),
      `.dgfig.ic .dgm-p{animation:${id}p ${CYCLE} ease-in-out ${DELAY} infinite}`,
    ].join('\n'),
  };
}

/* ── FACE-OFFS ──────────────────────────────────────────────────────────────
   ⭐ THE ONE FIGURE THAT IS A MAP RATHER THAN A SEQUENCE, and it does not move.
   Offside and icing are plays that unfold, so they animate; "nine painted spots
   and the rule picks one" is a taxonomy, and there is nothing in it to travel.
   Adding motion because the other two have it would be decoration — the thing
   this project refuses everywhere else — so the test asserts CONSISTENCY (a
   figure animates iff it has something to animate) rather than presence.

   ⭐ THE NINE ARE A MEASUREMENT ALREADY IN THE PAINT. `furniture` draws them
   from the archive, not from the rulebook: 2,134 draws across 39 games spread
   over three seasons land on these nine coordinates and on nothing else, and
   none arrives without one. So this figure adds no geometry at all — it RINGS
   what the rink already paints and names the three kinds.

   ⛔ AND IT CARRIES NO PERCENTAGES, though they exist and are tempting (end zone
   68.6%, centre 19.5%, neutral 11.9%). This card sits in "The game itself — the
   league's rules", and the learn page keeps that apart from "what we count" so
   our measurements cannot borrow the rulebook's authority. The share of draws
   that land in an end zone is ours; the fact that there are nine spots is the
   league's. A figure in the rules half says the second and not the first — the
   same wall the slot tint was taken off these diagrams for. */
function faceoffs() {
  const id = 'fo-';
  const END = SX(69), NEU = SX(NEUTRAL_DOT_X), UP = SY(22), DOWN = SY(-22);
  const ring = (x, y) => `<circle class="dgspot" cx="${f(x)}" cy="${f(y)}" r="4.2"/>`;
  const spots = [];
  for (const x of [END, SX(-69)]) for (const y of [UP, DOWN]) spots.push([x, y]);
  for (const x of [NEU, SX(-NEUTRAL_DOT_X)]) for (const y of [UP, DOWN]) spots.push([x, y]);
  spots.push([100, 42.5]);
  return {
    viewBox: '0 0 200 85',
    group: 'rules',
        label: 'Diagram: the nine painted face-off spots — four in each end, four in '
         + 'the neutral zone, and one at centre ice.',
    door: 'See a real face-off in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">${keeper(SX(-NET_X), 1)}${keeper(SX(NET_X), 1)}`
      + spots.map(([x, y]) => ring(x, y)).join('')
      // ONE BADGE PER KIND, not per spot: the lesson is that there are three
      // kinds of place, and nine of them.
      /* EACH BADGE IN CLEAR ICE BESIDE THE GROUP IT NAMES, which took a look to
         get right: ① sat on the end-zone circle's own stroke and under the
         stamp, and ② sat between the two NEUTRAL spots where it read as labelling
         them rather than centre ice. ① now sits in the gap between the two
         end-zone circles, ② beside the centre spot, ③ under a neutral one. */
      + badge(1, END, 42.5, 1) + badge(2, 89, 42.5, 1) + badge(3, NEU, DOWN + 9, 1)
      + stamp(SX(48), SY(32), 1)
      + `</g>`,
    steps: [
      '<b>In each end</b> &mdash; four spots, two on either side of the net. '
      + 'An icing comes back to one of these, in the offending team&rsquo;s own end.',
      '<b>At centre ice</b> &mdash; where a period starts, and where play restarts '
      + 'after every goal.',
      '<b>In the neutral zone</b> &mdash; four more, just outside each blue line. '
      + 'A play called back out of the zone usually restarts here.',
    ],
    css: '',
  };
}

/* ── THE SLOT ───────────────────────────────────────────────────────────────
   ⭐⭐ THE ONE FIGURE WHERE THE DIAGRAM *IS* THE DEFINITION, and the only one so
   far that belongs to the OTHER half of the learn page. Icing, offside and the
   face-off spots are the league's rules; the slot is OURS — "a geometric rule of
   ours, not a model", as its card says — and the page keeps those two halves
   apart so our measurements cannot borrow the rulebook's authority.

   ⭐ SO IT KEEPS THE TINT, and every other figure refuses it. `furniture(id,
   true)` paints the exact region `isHighDanger` tests, from the same two
   constants, which is the whole of Doctrine 7: a rule you can check with a
   ruler. On a rules figure that tint would be our claim wearing the rulebook's
   clothes; on this one it is the subject. `group` is what carries that
   distinction into the tests, and build_index asserts it against the group the
   card is actually rendered in — two documents, one wall.

   ⭐ AND THE THREE MARKS ARE THE THREE CLAUSES. `isHighDanger` is an AND of
   three geometric tests, and the figure spends one mark on each: one that
   counts, one too wide, and one behind the goal line. That third clause exists
   because Kevin looked at the tint when it first shipped — "I don't consider the
   slot to be valid behind the net" — and the first two clauses had simply never
   been asked to draw themselves. Measured before it changed: 4,249 of 262,539
   attempts (1.62%) sat behind the goal line, and 171 of 19,304 high-danger goals
   (0.89%). About one mark a game. */
function slot() {
  const id = 'sl-';
  const NET = SX(-NET_X);
  // In FEET, checkable against `isHighDanger(x, y, dir)` by hand.
  //   ① -70,  5  -> 19.6 ft out, 5 wide, in front            COUNTS
  //   ② -80, 26  -> 27.5 ft out, 26 wide  ................... too wide
  //   ③ -93, 12  ->  5.7 ft out, 12 wide, BEHIND the line ... wrong side
  const K = 99 / 200;   // see `badge`: annotation is screen-sized, geometry is not
  const IN = { x: SX(-70), y: SY(5) };
  const WIDE = { x: SX(-80), y: SY(26) };
  const BEHIND = { x: SX(-93), y: SY(12) };
  /* ⭐ SOLID MEANS THE RULE ADMITS IT, HOLLOW MEANS IT DOES NOT — and both are
     token-sized, because a shot location is the same KIND of mark as a player.
     The first draft drew the refused ones dashed at half a token's size, and at
     this crop a 2-unit dash pattern on a 5px ring is noise rather than a
     distinction. STROKE WIDTH RIDES ON THE ELEMENT for the same reason the radius
     does: a width in rink units gets thicker as a figure zooms in, and this is
     annotation, not paint. */
  const mark = (p, out) =>
    `<circle class="dgmark${out ? ' out' : ''}" cx="${f(p.x)}" cy="${f(p.y)}"`
    + ` r="${f(4 * K)}" stroke-width="${f((out ? 1.1 : 0.6) * K)}"/>`;
  return {
    // Tighter than offside's: the subject is a 33-foot radius, and a wider frame
    // would spend the page on ice the rule says nothing about.
    viewBox: '100 0 99 85',
    group: 'ours',
    label: 'Diagram: the slot — within 33 feet of the net, between the face-off '
         + 'dots, and in front of the goal line.',
    door: 'See a shot from the slot in our replay',
    svg: defs(id)
      // TINTS ON, alone among the figures: this one IS the tint.
      + `<g class="dgpaint">${furniture(id, 'slot')}${nets(id)}</g>`
      + `<g class="dgplay">${keeper(NET, K)}`
      + mark(IN, false) + mark(WIDE, true) + mark(BEHIND, true)
      + badge(1, IN.x - 7, IN.y + 6, K) + badge(2, WIDE.x - 6, WIDE.y - 5, K)
      + badge(3, BEHIND.x, BEHIND.y - 6, K)
      + stamp(SX(-3), SY(36), K)
      + `</g>`,
    steps: [
      '<b>Close in</b> &mdash; within 33 feet of the net. This one counts.',
      '<b>And between the face-off dots.</b> The shaded band is exactly that '
      + 'wide, so you can check a mark against it: this one is too far out to the side.',
      '<b>And in front of the goal line.</b> A wrap-around from behind the net '
      + 'is close, and it is not a shot from the slot.',
    ],
    css: '',
  };
}

/* ── THE EMPTY NET ──────────────────────────────────────────────────────────
   ⚠️⚠️ THE FIGURE THAT COMES CLOSEST TO FAKING SOMETHING, AND THE SITE ALREADY
   KNEW THE ANSWER. `on-the-ice.html` carries this banner: *"players are arranged
   by role (goalie · defense · forwards), not by tracked position — real skater
   coordinates aren't public, so we don't fake them. What's real here is who is on
   the ice, and when."*

   Six attackers drawn in a shape is a FORMATION, and a formation is the one thing
   that banner refuses. It is also unnecessary: what changes when a goaltender is
   pulled is a COUNT and an empty crease, and neither of those is a position.

   ⭐ SO IT DRAWS THE CHANGE, NOT THE STATE. The goaltender leaves the crease for
   the bench — one token, both endpoints real — and ONE extra attacker comes on.
   Five more bodies would say nothing true that these two do not, and would say
   several things we cannot support.

   ⭐ AND IT IS THE FULL SHEET BECAUSE THE CONTRAST IS THE LESSON. One net still
   has a goaltender in it and one does not; a crop of the empty end shows an empty
   crease with nothing to compare it to, which is exactly the thing a novice does
   not yet know is unusual.

   ⭐ IT ALSO RESOLVES THE DISHONESTY THE ACCUMULATE RULE CAUGHT AT THE START. The
   first sketch had the goalie VANISH, which with motion off reads as a goalie in
   the crease and an empty crease at once. He skates to the bench instead, which
   is what actually happens — the accessibility rule producing the more truthful
   drawing. */
function emptyNet() {
  const id = 'en-';
  const PULLED = SX(-NET_X);            // the net that is emptied, screen-right
  const KEPT = SX(NET_X);               // the other end, still defended
  const G0 = { x: PULLED - 4.5, y: 42.5 };   // where `keeper` stands
  const G1 = { x: 112, y: 11 };              // the bench, along the boards at centre
  const A0 = { x: 62, y: 57 }, A1 = { x: 34, y: 57 };
  return {
    viewBox: '0 0 200 85',
    group: 'rules',
    label: 'Diagram: a team pulls its goaltender for an extra attacker, leaving '
         + 'its own net empty.',
    door: 'See a pulled goalie in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      // ONLY THE FAR NET KEEPS ITS GOALTENDER. The near crease is empty, which is
      // the whole subject, so nothing is drawn standing in it.
      + `<g class="dgplay">${keeper(KEPT, 1)}`
      + ghost(G0.x, G0.y, 1) + ghost(A0.x, A0.y, 1)
      + arrow(id, G0.x, G0.y, G1.x, G1.y) + arrow(id, A0.x, A0.y, A1.x, A1.y)
      + `<g class="dgmove dgm-g">${tok(G1.x, G1.y, 1)}</g>`
      + `<g class="dgmove dgm-a">${tok(A1.x, A1.y, 1)}</g>`
      /* ⚠️ THE BADGES WERE SITTING ON THE EMPTY NET — the one thing this figure
         is about. ② was at x=195, which is INSIDE the net's body (189–193), and ①
         was against the crease; between them and the ghost, the goal was
         invisible. ① now marks the goaltender's path and ② sits clear above the
         mouth it is pointing at. */
      + badge(1, 150, 34, 1) + badge(2, PULLED - 3, 28, 1)
      + badge(3, A1.x, A1.y + 9, 1)
      + stamp(SX(60), SY(34), 1)
      + `</g>`,
    steps: [
      'Losing late, a team sends its <b>goaltender to the bench</b>.',
      'Their own net is now <b>empty</b> &mdash; any shot that reaches it goes in.',
      'In his place comes an <b>extra attacker</b>: six skaters against five. '
      + 'Nothing is toggled on this site to show it &mdash; the goalie is simply '
      + 'no longer drawn.',
    ],
    css: [travel(id + 'g', G0, G1), travel(id + 'a', A0, A1),
      `.dgfig.em .dgm-g{animation:${id}g ${CYCLE} ease-in-out ${DELAY} infinite}`,
      `.dgfig.em .dgm-a{animation:${id}a ${CYCLE} ease-in-out ${DELAY} infinite}`,
    ].join('\n'),
  };
}

const FIGURES = { 'empty-net': emptyNet(), faceoffs: faceoffs(), icing: icing(),
                  offside: offside(), slot: slot() };

/* ── the artifact ───────────────────────────────────────────────────────── */
const OUT = join(ROOT, 'data', 'learn-figures.json');
const built = JSON.stringify(FIGURES, null, 1) + '\n';

if (process.argv.includes('--verify')) {
  let have = '';
  try { have = readFileSync(OUT, 'utf8'); } catch { /* absent counts as stale */ }
  if (have !== built) {
    console.error('learn-figures.json is stale — run: node builders/learn-figures.mjs');
    process.exit(1);
  }
  console.log('learn-figures.json is current');
} else {
  writeFileSync(OUT, built);
  console.log(`learn-figures.json: ${Object.keys(FIGURES).length} figure(s)`);
}
