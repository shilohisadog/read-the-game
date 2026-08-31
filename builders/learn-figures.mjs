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
const tok = (x, y, r = 4) => `<circle class="dgtok" cx="${f(x)}" cy="${f(y)}" r="${r}"/>`;
const ghost = (x, y, r = 4) => `<circle class="dgghost" cx="${f(x)}" cy="${f(y)}" r="${r}"/>`;
const puck = (x, y) => `<circle class="dgpuck" cx="${f(x)}" cy="${f(y)}" r="2.4"/>`;
const puckGhost = (x, y) => `<circle class="dgpuck dgghost" cx="${f(x)}" cy="${f(y)}" r="2.4"/>`;

/** An arrow from one point to another, stopping short so the head clears the token. */
function arrow(id, x1, y1, x2, y2, back = 5) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ex = x2 - (dx / len) * back, ey = y2 - (dy / len) * back;
  return `<line class="dgarrow" x1="${f(x1)}" y1="${f(y1)}" x2="${f(ex)}" y2="${f(ey)}"`
       + ` marker-end="url(#${id}head)"/>`;
}

/** The numbered badge that ties a place on the ice to a line of the caption. */
const badge = (n, x, y) =>
  `<g class="dgbadge"><circle cx="${f(x)}" cy="${f(y)}" r="4.6"/>`
  + `<text x="${f(x)}" y="${f(y)}" dy="1.9">${n}</text></g>`;

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

const stamp = (x, y) => `<text class="dgstamp" x="${f(x)}" y="${f(y)}">Diagram</text>`;

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
const keeper = (gx) =>
  // ITS POSITION IS ITS LABEL. Drawn in the diagram's own vocabulary -- outlined,
  // neutral, the same token every other player gets -- because a second style of
  // player token would be a second thing for a novice to decode. Nobody else
  // stands in the crease, so the crease says which one he is.
  `<circle class="dgtok dgkeep" cx="${f(gx < 100 ? gx + 4.5 : gx - 4.5)}" cy="42.5" r="4.4"/>`;

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
      + `<g class="dgplay">${keeper(SX(-NET_X))}</g>`
      + `<g class="dgplay">`
      // Where each of them set off — drawn faintly, and they stay drawn.
      + ghost(C0.x, C0.y) + puckGhost(C0.x + PUCK.x, C0.y + PUCK.y) + ghost(T0.x, T0.y)
      + arrow(id, C0.x, C0.y, C1.x, C1.y) + arrow(id, T0.x, T0.y, T1.x, T1.y)
      // The line is lit where the rule is decided.
      + hot(BLUE, 'blue')
      // ① THE CARRIER AND HIS PUCK ARE ONE GROUP, so they cannot drift apart in
      // the animation -- "controlling the puck" has to survive the motion.
      + `<g class="dgmove dgm-c">${tok(C1.x, C1.y)}${puck(C1.x + PUCK.x, C1.y + PUCK.y)}</g>`
      // ② the teammate, already inside the zone with the puck still outside.
      + `<g class="dgmove dgm-t">${tok(T1.x, T1.y)}</g>`
      // ③ and the punishment, which is WHERE — the same claim the icing card makes.
      + `<circle class="dgspot" cx="${f(DOT.x)}" cy="${f(DOT.y)}" r="4.2"/>`
      // EACH BADGE SITS ON THE THING ITS LINE IS ABOUT: ① on the carrier, ② on
      // the teammate who has gone too far, ③ on the spot play comes back to.
      + badge(1, C1.x - 3, C1.y + 9) + badge(2, T1.x, T1.y - 9)
      + badge(3, DOT.x, DOT.y - 9)
      + stamp(SX(20), SY(34))
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
    label: 'Diagram: a player shoots the puck from behind the centre line, it '
         + 'crosses the far goal line untouched, and the face-off comes all the '
         + 'way back to the shooting team’s end.',
    door: 'See a real icing in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">${keeper(SX(-NET_X))}${keeper(SX(NET_X))}`
      + ghost(S.x, S.y) + puckGhost(P0.x, P0.y)
      + arrow(id, P0.x, P0.y, P1.x, P1.y, 4)
      // THE TWO LINES RULE 81 NAMES, lit exactly as the game page lights them.
      + hot(100, 'red') + hot(SX(-89), 'red')
      + `<circle class="dgtok" cx="${f(S.x)}" cy="${f(S.y)}" r="4"/>`
      + `<g class="dgmove dgm-p">${puck(P1.x, P1.y)}</g>`
      + `<circle class="dgspot" cx="${f(DOT.x)}" cy="${f(DOT.y)}" r="4.2"/>`
      + badge(1, S.x - 8, S.y + 6) + badge(2, P1.x - 4, P1.y - 9)
      + badge(3, DOT.x, DOT.y - 9)
      + stamp(SX(60), SY(34))
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

const FIGURES = { icing: icing(), offside: offside() };

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
