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

import { furniture, netGlyph, goalieGlyph, skaterGlyph, officialGlyph, GK_H,
         boardsY, SX, SY } from '../src/lib/rinkart.js';
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

/**
 * A GOALTENDER, DRAWN AS ONE — the game's own figure, placed anywhere.
 *
 * ⭐ IT IS `goalieGlyph` FROM rinkart.js, NOT A SHAPE OF OUR OWN. Kevin: *"is
 * there any way to improve the goalie animation? like using the goalie figures
 * themselves, the circles don't look real good."* The game page has drawn a head,
 * a body and a stick since the goaltender view shipped; the diagrams were drawing
 * a plain circle beside it. One thing, two drawings, is the drift `furniture` was
 * extracted to end.
 *
 * ⭐ AND IT ALSO ANSWERS THE READABILITY PROBLEM UNDERNEATH. A goaltender who
 * LOOKS like a goaltender needs no crease to identify him and no badge to label
 * him, which is what the old circle needed and never had. It is now the one token
 * on these pages that is not a circle, and it is the one actor who is not a
 * skater — the drawing tells you which is which without a word.
 *
 * `goalieGlyph` builds him at y=42.5 because that is where a crease is, so a
 * static translate moves him; the animated class goes on an INNER group so the
 * keyframes and the placement cannot fight over one `transform`.
 */
/* ⭐⭐ AND HE IS SCALED TO THE ANNOTATION, NOT TO THE NET. On the game page the
   glyph is sized by a RELATIONSHIP — a goaltender defending a net has to fit
   inside its mouth — and GK_H is 4.6 units for that reason. A diagram's people
   are not to scale with anything: a skater token is r=4, so 8 units across, which
   is a legibility choice and about 8 feet of ice. Dropping the game's goaltender
   in beside them makes him HALF a skater's height, and the reader is looking at a
   child in a crease.
   So the diagram scales him to the token, and the scale is DERIVED from the token
   rather than picked: `GK_FIT` is what makes his height match a skater's
   diameter. The game's own relationship is untouched — it is a different claim on
   a different surface, and GK_H still drives it. */
/* ⚠️ A GHOST'S DASH IS SCALED TOO, AND AT 1.74x IT SHATTERED THE FIGURE. The
   stylesheet's `stroke-dasharray:1.1 .9` is a sensible pattern on an 8-unit
   circle and a catastrophe on a body 1.38 LOCAL units wide: the outline broke
   into four disconnected blobs and the bench ghost read as debris rather than as
   a skater. Same defect as the stroke width one line above, and the same fix --
   state what it should look like RENDERED and divide the scale out here, where
   the scale is known. */
const GHOST_DASH = [0.8, 0.65];
const dashes = (s, on) => on
  ? ` stroke-dasharray="${f(GHOST_DASH[0] / s)} ${f(GHOST_DASH[1] / s)}"` : '';
const GK_HOME = 42.5;
const GK_FIT = (4 * 2) / GK_H;
/** The weight every illustrated token carries — `.dgplay .dgtok` in FIGCSS. */
const TOK_STROKE = 1.1;
const gk = (gx, x, y, k = 1, cls = '', dash = false) => {
  const s = GK_FIT * k;
  // Scale about the figure's own home, then place: p -> (tx + s*px, ty + s*py).
  const [tx, ty] = [x - s * gx, y - s * GK_HOME];
  /* ⚠️ THE SCALE TAKES THE STROKE WITH IT, so the weight is divided out HERE and
     not restated in a stylesheet. Drawn at app.css's 0.4 inside a 1.74x group the
     goaltender rendered at 0.70 beside skater tokens stroked at 1.1 — a fainter
     figure, which reads as further away. Inherited from the wrapper it renders at
     TOK_STROKE whatever the scale is, and the one number that decides it lives
     next to the one that sets the scale. A CSS rule would be a second copy that
     silently stops matching the moment `GK_FIT` moves. */
  return `<g transform="translate(${f(tx)},${f(ty)}) scale(${f(s)})"`
       + ` stroke-width="${f(TOK_STROKE / s)}"${dashes(s, dash)}>`
       + goalieGlyph(gx, NEUTRAL, 'var(--ice)', `dggk ${cls}`.trim()) + '</g>';
};

/** An official, placed and weighted exactly as `gk` places a goaltender. */
const of_ = (gx, x, y, k = 1, cls = '') => {
  const s = GK_FIT * k;
  const [tx, ty] = [x - s * gx, y - s * GK_HOME];
  return `<g transform="translate(${f(tx)},${f(ty)}) scale(${f(s)})"`
       + ` stroke-width="${f(TOK_STROKE / s)}">`
       + officialGlyph(gx, NEUTRAL, 'var(--ice)', `dgof ${cls}`.trim()) + '</g>';
};

/** A skater, placed and weighted exactly as `gk` places and weights a goaltender. */
const sk = (gx, x, y, k = 1, cls = '', dir, dash = false) => {
  const s = GK_FIT * k;
  const [tx, ty] = [x - s * gx, y - s * GK_HOME];
  return `<g transform="translate(${f(tx)},${f(ty)}) scale(${f(s)})"`
       + ` stroke-width="${f(TOK_STROKE / s)}"${dashes(s, dash)}>`
       + skaterGlyph(gx, NEUTRAL, 'var(--ice)', `dgsk ${cls}`.trim(), dir) + '</g>';
};

/** ⛔ RETIRED — see the empty-net figure. A goaltender is drawn by `gk` now. */
const keeper = (gx, k = 1) =>
  /* ⚠️ "ITS POSITION IS ITS LABEL" WAS WRONG, AND KEVIN FALSIFIED IT TWICE.
     This used to read: drawn in the diagram's own vocabulary — outlined, neutral,
     the same token every other player gets — because nobody else stands in the
     crease, so the crease says which one he is. It went onto four of the five
     figures on that argument. Then, on face-offs: *"I'm not sure what the circles
     in front of the net are?"*, and on offside: *"there's the random circle in
     front of the net."*

     ⭐ THE ARGUMENT ASSUMED ITS OWN AUDIENCE. "The crease identifies him" is true
     for someone who already knows what a crease is — and the entire audience for
     these pages is someone who does not. Worse, the reasoning is self-defeating:
     the token is deliberately IDENTICAL to every labelled player token, and on
     four figures it was the only one carrying no number, so the page taught
     "circles are numbered actors" and then drew an unnumbered one.

     ⛔ SO HE IS DRAWN ONLY WHERE THE WORDS NAME HIM, which is `empty-net` alone —
     there he is the subject, he skates off, and the steps say so. Kevin's request
     that a CROP show equipment is met by the NETS, which every figure still draws:
     he asked for *"a goal (at least, maybe even the goalie)"*, and the goal was
     the part doing the work. A test asserts the biconditional, so a goaltender
     cannot reappear on a figure that never mentions one. */
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
/* ⭐ AND ONE ACTOR CAN WAIT FOR ANOTHER, WHICH IS A CLAIM ABOUT THE RULE. Kevin,
   on the empty net: *"a skater glyph coming from the bench (once the goalie gets
   there, not before)."* He is right that the ORDER is the lesson — a team may not
   have both men on, so the extra attacker steps over the boards after the
   goaltender is off, and two tokens sliding at once would draw a bench change
   that is not legal. `go` and `stop` are the percentages of the cycle this token
   is actually moving; everything before `go` it sits where it started, which for
   a skater is the bench, visible and waiting. A test reads these numbers back out
   of the stylesheet and asserts the gap, so the sequencing is not a comment. */
const CYCLE = '9s', DELAY = '2.5s';
const travel = (name, from, to, go = 8, stop = 55) =>
  `@keyframes ${name}{`
  + `0%{transform:translate(${f(from.x - to.x)}px,${f(from.y - to.y)}px);opacity:0}`
  + `8%{transform:translate(${f(from.x - to.x)}px,${f(from.y - to.y)}px);opacity:1}`
  + (go > 8 ? `${f(go)}%{transform:translate(${f(from.x - to.x)}px,${f(from.y - to.y)}px);opacity:1}` : '')
  + `${f(stop)}%{transform:translate(0,0);opacity:1}`
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
    /* ⚠️ THE LABEL NAMED THE WRONG TEST. It said the skater crosses "before the
       puck CARRIER does", which is the mistake this figure exists to correct:
       the rule is about the PUCK, not the man carrying it, and a carrier who is
       over the line with the puck still short of it has not put the puck in the
       zone. The drawing had it right all along (the puck ends 9 ft out, the
       carrier 15) and only the words were wrong -- so a reader on a screen
       reader got the misconception the picture refuses. */
        label: 'Diagram: an attacking skater is inside the blue line while the puck '
         + 'is still outside it, so play stops and the face-off comes back outside '
         + 'the zone.',
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
      // ⛔ NO GOALTENDER HERE EITHER — see `keeper` below. Kevin asked for "a goal
      // (at least, maybe even the goalie)" on this crop and got both; the NET is
      // what does the orientation work, and the goalie was the "maybe".
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
    /* ⭐ "COMPLETELY" IS THE WHOLE DISTINCTION, and it is Kevin's: *"we need to
       mention that the puck has to completely cross the blue line first, that's
       an important distinction that novices sometimes don't understand."*
       The blue line is a foot wide and it belongs to the NEUTRAL zone -- a puck
       sitting on the paint has not entered anything, so a skater who beats it
       across is offside even though the puck is touching the line. Step 2 said
       only "the puck has to enter the zone first", which a novice reads as
       "reach the line", and reaching the line is exactly the case the rule
       decides against. The figure already draws it (the puck ends 9 ft short);
       what was missing was the sentence saying the margin is required. */
    steps: [
      'The puck carrier comes up the ice toward the blue line.',
      'A teammate crosses the line <b>before the puck does</b> &mdash; that is offside. '
      + 'The puck has to cross the line <b>completely</b> first: touching it is '
      + 'not being in the zone.',
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
    door: 'See an icing in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      // ⛔ NO GOALTENDERS — see `keeper`. And on THIS figure they were worse than
      // unexplained: the puck slides the length of the ice "with nobody touching
      // it", past a goaltender drawn standing in its path. A goalie who plays
      // that puck waves the icing off, so the drawing was quietly posing a
      // question the three steps do not answer.
      + `<g class="dgplay">`
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
    // ⛔ NO "REAL" AND NO "LIVE" ON A DOOR (Kevin). What lies through it is a
    // recorded game replayed from the archive, and a button that says "real" or
    // "live" invites a reader to expect streaming video. The honest promise is
    // the thing plus where it is: a face-off, in our replay.
    door: 'See a face-off in our replay',
    /* ⛔ AND NO GOALTENDER, which is the whole reason Kevin could not read this
       figure: *"I'm not sure what the circles in front of the net are?"* Two
       outlined tokens stood in the creases, and this figure is a MAP — nothing
       in its three steps refers to a player, so the only person on the ice was
       there to answer no question at all. Worse, ① sits at the same y one token
       away from the left one, so a badge and an unexplained circle read as a
       pair. The NETS stay: step 1 says "two on either side of the net", so the
       equipment is load-bearing here and the goaltender never was. */
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">`
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
      // ⛔ NO GOALTENDER — see `keeper`. This figure is about a REGION of ice and
      // the shots taken from it; who is in the crease is not part of that claim.
      + `<g class="dgplay">`
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
  /* ⭐ HE LEAVES THE ICE, AND THE FRAME MAKES ROOM FOR HIM TO. Kevin: *"make sure
     the pulled goalie goes as far off the ice as he can, just to close the concept
     out, since we don't have player benches we need to ensure the viewer
     understands the goalie comes off the ice."* He used to stop at y=11, which is
     inside the rink — a goaltender standing in the neutral zone, doing nothing,
     for the whole resting frame. The boards at this x are `boardsY`'s top edge,
     and he now finishes clear ABOVE them, which needs frame outside the rink:
     hence the viewBox opening at -11 rather than 0. The width is untouched, so
     every apparent-size rule (which divides 200 by it) is unaffected. */
  const G0 = { x: PULLED, y: GK_HOME };      // his crease — where `goalieGlyph` builds him
  const [ICETOP] = boardsY(112);
  const G1 = { x: 112, y: ICETOP - 5 };      // off the ice entirely, past the boards
  /* ⭐ AND THE EXTRA ATTACKER COMES FROM THE SAME PLACE, WHICH IS THE POINT.
     Kevin: *"a skater glyph coming from the bench (once the goalie gets there, not
     before). That would complete the empty net process."* He used to fade in at
     (62, 57) — the middle of the ice, from nowhere, which drew a sixth skater
     APPEARING rather than a bench change. Now he starts beside the goaltender's
     landing spot, off the ice, and steps over the boards: the two of them at the
     bench are the swap, and the swap is the whole rule.
     ⛔ AND HE STOPS JUST INSIDE. Where he actually goes is not recorded and is not
     the lesson; skating him to a spot in the attacking zone would be the formation
     this figure's own header refuses. */
  const A0 = { x: 96, y: ICETOP - 5 };       // the bench, beside where the goalie lands
  const A1 = { x: 72, y: 24 };               // over the boards and onto the ice
  /* THE ORDER, AS PERCENTAGES OF ONE CYCLE. The goaltender is off before the
     skater moves; the gap is a beat, not a coincidence. */
  const GO_G = [8, 42], GO_A = [46, 78];
  return {
    viewBox: '0 -11 200 96',
    group: 'rules',
    label: 'Diagram: a team pulls its goaltender for an extra attacker, leaving '
         + 'its own net empty.',
    door: 'See a pulled goalie in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      /* ⛔ NOTHING STANDS IN THE OTHER CREASE. This drew `keeper(KEPT)` on a
         contrast argument — one net defended, one not. Kevin: *"the random goalie
         circle is on the other net, that needs removed."* The contrast was never
         carrying it: the empty net has a GHOST in its crease and an arrow leading
         away, which says "somebody was here and left" without a second club's
         goaltender who has nothing to do with this team's decision. */
      + `<g class="dgplay">`
      // ⭐ THE GHOST IS A GOALTENDER TOO, not a dashed circle. It marks the crease
      // he vacated, and it is the same figure so the eye reads one actor moving.
      // ⭐ BOTH GHOSTS ARE THE FIGURE THAT LEFT, not a dashed circle. The crease
      // and the bench each keep the shape of whoever vacated it, so the eye reads
      // two actors moving rather than four unrelated marks.
      + `<g class="dgghost">${gk(G0.x, G0.x, G0.y, 1, '', true)}`
      + `${sk(A1.x, A0.x, A0.y, 1, '', -1, true)}</g>`
      // ⚠️ EACH ARROW LEAVES ITS GHOST, not from inside it. The bench arrow used to
      // start on the skater's own outline, so the two read as one smudge.
      + arrow(id, G0.x, G0.y - 6, G1.x, G1.y)
      + arrow(id, A0.x - 1, A0.y + 5, A1.x, A1.y)
      + `<g transform="translate(${f(G1.x - G0.x)},${f(G1.y - G0.y)})">`
      + `<g class="dgmove dgm-g">${gk(G0.x, G0.x, G0.y, 1)}</g></g>`
      + `<g class="dgmove dgm-a">${sk(A1.x, A1.x, A1.y, 1, '', -1)}</g>`
      /* ⚠️ THE BADGES WERE SITTING ON THE EMPTY NET — the one thing this figure
         is about. ② was at x=195, which is INSIDE the net's body (189–193), and ①
         was against the crease; between them and the ghost, the goal was
         invisible. ① now marks the goaltender's path and ② sits clear above the
         mouth it is pointing at. */
      + badge(1, 150, 34, 1) + badge(2, PULLED - 3, 28, 1)
      + badge(3, A1.x, A1.y + 9, 1)
      + stamp(SX(60), SY(34), 1)
      + `</g>`,
    // ⭐ AND BACK THE OTHER WAY — see the penalties figure's `see` for why both.
    see: { to: 'penalties',
           say: 'This is not the only reason a goaltender leaves the ice' },
    /* ⛔ STEP 2 STOPS AT THE FACT. It used to add *"— any shot that reaches it
       goes in"*, and Kevin killed it: *"if we expand on that it can lead to
       'that's not true' type comments, since a defender can still guard the goal
       and '...any shot that reaches it goes in' isn't universally true."* He is
       right and it is the site's own rule in a new place — a sentence that
       overstates invites a correction, and the correction is about US rather than
       about the rule. The net being empty is the whole claim and it is exactly
       true. */
    steps: [
      'Losing late, a team sends its <b>goaltender to the bench</b>.',
      'Their own net is now <b>empty</b>.',
      'In his place comes an <b>extra attacker</b>: six skaters against five. '
      + 'Nothing is toggled on this site to show it &mdash; the goalie is simply '
      + 'no longer drawn.',
    ],
    css: [travel(id + 'g', G0, G1, ...GO_G), travel(id + 'a', A0, A1, ...GO_A),
      `.dgfig.em .dgm-g{animation:${id}g ${CYCLE} ease-in-out ${DELAY} infinite}`,
      `.dgfig.em .dgm-a{animation:${id}a ${CYCLE} ease-in-out ${DELAY} infinite}`,
    ].join('\n'),
  };
}


/* ── PENALTIES ──────────────────────────────────────────────────────────────
   ⭐ THE SIXTH FIGURE, AND THE ONE THE OTHER FIVE MADE NECESSARY. Kevin: *"that's
   the only card that links to a game. Would it provide more continuity if we used
   a diagram (somehow) to describe a delayed penalty (as well as detail the more
   common penalty types, can't forget the base case)?"* In the rules half it was
   four diagrams and one raw game link — the inconsistency sits in the half a
   novice reads first.

   ⚠️ AND THE CARD PROMISED A MOMENT THE FEED DOES NOT POPULATE. It said *"this is
   that gap — the delayed call, before the whistle"*, and measured over 46
   published games (109 delayed→penalty pairs) **79 of them, 72.5%, carry no event
   at all between the call and the whistle**. The gap exists in time — median 4s,
   p90 28s — and a replay that walks recorded events has nothing to put in it.
   Same family as offside's crossing: a rule we can draw and never replay.

   ⭐ TWO DRAWN STEPS, IN CHRONOLOGICAL ORDER, AND THE KINDS IN PROSE (CHENG).
   A third step naming restraint/stick/physical fouls was drawn first and ruled
   out: *"drawing the three kinds at the places those fouls happen would be
   inventing coordinates — the taxonomy is a naming of `descKey` values and it
   carries no geometry."* Hence `note`, and hence the rule it produced:
   **a figure draws what the ice can show.**

   ⭐ THE TWO DEPARTURES GO TO OPPOSITE SIDES, WHICH IS TRUE OF A REAL RINK. The
   benches are on one side and the penalty boxes on the other (Rule 3), so the
   goaltender leaves upward and the penalised skater downward. That is not a
   composition trick: it is the one fact that keeps two people walking off the ice
   in one drawing from reading as the same event twice.

   ⚠️ CHENG'S CONDITION ON DRAWING A GOALTENDER LEAVING TWICE — *"the two figures
   must differ in what's visible around the goalie… if the cause is legible in
   each, it's the lesson."* Here the cause is legible: an official with his arm up
   and the puck with the OTHER team, neither of which the empty-net figure has.
   ⛔ THE CONVERSE IS NOT ACHIEVABLE AND I OVERSTATED IT IN docs/penalties-card.md
   §5.2: the empty net's cause is "losing late", which needs a clock and a score —
   the one piece of the game page's furniture a diagram may not borrow. Its cause
   lives in its words. The test is that the two DRAWINGS differ, not that both
   causes are drawable. */
function penalties() {
  const id = 'pe-';
  const [ICETOP, ICEBOT] = boardsY(112);
  // The offender, and where he goes: down, to the box side.
  const P0 = { x: 138, y: 58 }, P1 = { x: 118, y: ICEBOT + 5 };
  // The goaltender of the team that did NOT offend, leaving for the bench above.
  const G0 = { x: SX(-NET_X), y: GK_HOME }, G1 = { x: 88, y: ICETOP - 5 };
  /* ⚠️ EVERY ONE OF THESE MOVED AFTER LOOKING AT THE FIRST RENDER, and each was
     sitting on something: the official stood INSIDE the end-zone circle with the
     goaltender's arrow passing through his badge, and the puck carrier stood in
     the middle of the centre circle. Between the two of them the two lines this
     figure is actually about — a departure up and a departure down — were the
     hardest things on the ice to follow. The official now sits between the two
     end-zone circles, 29 units clear of each and 21 below the arrow; the carrier
     is out on open ice in the half his team is attacking. */
  const REF = { x: 150, y: GK_HOME };       // clear ice between the end-zone circles
  const PUCKMAN = { x: 70, y: 60 };         // the other team, carrying the other way
  const GO_G = [8, 42], GO_P = [50, 82];    // the delay first, the whistle after
  return {
    viewBox: `0 ${f(-11)} 200 ${f(107)}`,
    group: 'rules',
    label: 'Diagram: an official signals a delayed penalty while the other team '
         + 'keeps the puck and pulls its goaltender; at the whistle the offending '
         + 'player leaves the ice for the penalty box.',
    door: 'See a penalty called in our replay',
    svg: defs(id)
      + `<g class="dgpaint">${furniture(id, false)}${nets(id)}</g>`
      + `<g class="dgplay">`
      // ① the signal, and the team that still has the puck
      + of_(REF.x, REF.x, REF.y, 1)
      + `${sk(PUCKMAN.x, PUCKMAN.x, PUCKMAN.y, 1, '', -1)}`
      + puck(PUCKMAN.x - 5.5, PUCKMAN.y + 1.4, 1)
      // the two who leave, each with the ghost of where they were
      + `<g class="dgghost">${gk(G0.x, G0.x, G0.y, 1, '', true)}`
      + `${sk(P0.x, P0.x, P0.y, 1, '', 1, true)}</g>`
      + arrow(id, G0.x, G0.y - 6, G1.x, G1.y)
      + arrow(id, P0.x, P0.y + 5, P1.x, P1.y)
      + `<g transform="translate(${f(G1.x - G0.x)},${f(G1.y - G0.y)})">`
      + `<g class="dgmove dgm-g">${gk(G0.x, G0.x, G0.y, 1)}</g></g>`
      + `<g transform="translate(${f(P1.x - P0.x)},${f(P1.y - P0.y)})">`
      + `<g class="dgmove dgm-p">${sk(P0.x, P0.x, P0.y, 1, '', 1)}</g></g>`
      + badge(1, REF.x + 9, REF.y - 2, 1) + badge(2, P1.x - 10, P1.y, 1)
      + stamp(SX(60), SY(34), 1)
      + `</g>`,
    steps: [
      'An official raises his arm and <b>play carries on</b> &mdash; until the '
      + 'offending team touches the puck. The other side keeps possession, and may '
      + 'even pull its goaltender for an extra skater.',
      /* ⚠️ THIS SAID "…a skater short UNTIL IT EXPIRES", and a minor very often does
         not expire: the other team scoring ends it on the spot. Measured over the
         same 46 games, 50 of 289 two-minute minors — 17.3% — end early on a goal,
         so the sentence was wrong about one penalty in six.
         ⭐ SECOND TIME IN TWO FIGURES, AND IT IS THE SAME MISTAKE. Kevin killed
         "any shot that reaches it goes in" on the empty net for exactly this: a
         sentence that overstates invites a correction, and the correction is about
         US rather than about the rule.
         ⭐ AND THE FIX TEACHES MORE THAN THE TRIM WOULD. Stopping at "plays a
         skater short" would be true and would drop a rule a novice needs — that a
         power-play goal ends the penalty is why the team that concedes stops
         killing it. Both endings are named, and "the time runs out" also retires
         an "it" whose referent was the box as easily as the penalty. */
      'At the whistle he goes to the penalty box and his team plays a skater short '
      + 'until the penalty is served &mdash; and a goal by the other team ends a '
      + '<b>minor</b> early.',
    ],
    /* ⭐ THE CROSS-LINK, AND IT RUNS BOTH WAYS ON PURPOSE. Kevin: *"then the
       cross-link for the delayed penalty (crossing over to the 'pull the goalie'
       learning card)."* The fact is symmetric — a goaltender leaves the ice for
       exactly two reasons — and until now the empty-net card taught only one of
       them, so a reader met the same picture twice with no way to know it had two
       causes. CHENG: *"you only learn that by seeing it twice and being told the
       causes differ."* */
    see: { to: 'empty-net',
           say: 'A goaltender leaves the ice for one other reason &mdash; and it is '
              + 'the more familiar one' },
    /* ⭐ THE KINDS ARE PROSE BECAUSE THEY ARE A CLASSIFICATION OF LANGUAGE. And
       they are NAMED, never ranked: which penalties exist is the league's, how
       often each occurs is ours, and that is the wall the faceoffs figure already
       refuses percentages for.
       ⚠️ AND THE NOTE GAINED THE EXCEPTION STEP 2 CANNOT CARRY. Kevin found "his
       team plays a skater short" stated as universal, and it is false on one
       penalty in five — 793 of 4,347 over 600 games come back to an EVEN restart.
       Step 2 keeps saying it, because step 2 describes the drawing and the ice
       here shows one penalised skater and no other: a figure draws what the ice
       can show, so a case the drawing does not contain cannot be qualified in a
       caption for it. The note is the slot that already holds what the drawing
       leaves out — the lengths went here for the identical reason — and it is
       the ONLY place the word "matching" appears: the blurb explains the idea in
       plain words, the note gives it its name.
       ⚠️ AND THE DEFINITION IS TWO CONDITIONS, NEITHER OF THEM THE INFRACTION.
       "Both teams penalised on the same whistle" was the first draft and is
       wrong — unequal time leaves a side short anyway (of coincident calls
       matching on count AND minutes, 534 of 588, 90.8%, restart even; of those
       that do not, 55 of 385, 14.3%). Then Kevin caught the second draft: *"there
       can be different minors penalized on the same play that offset."* 206 of
       588 offsetting pairs — 35% — name two DIFFERENT infractions, so a reader
       who hears "matching" as "the same foul" misreads a third of the real
       cases. Hence "whatever the two infractions were", stated out loud rather
       than left for the reader to infer from an absence. */
    note: 'Most penalties are one of three kinds: <b>restraint</b> &mdash; '
        + 'tripping, hooking, holding, interference; <b>stick</b> &mdash; slashing, '
        + 'high-sticking, cross-checking; and <b>physical</b> &mdash; roughing, '
        + 'boarding, charging. A few are none of those: delay of game, too many men. '
        + 'They are not all the same length either: <b>two minutes</b> for a minor, '
        + 'five for a major, and a <b>game misconduct</b> sends a player off for the '
        + 'rest of the night. Two calls that arrive together and carry the same time '
        + 'are <b>matching</b>, whatever the two infractions were &mdash; both '
        + 'players sit, and the sides stay even.',
    css: [travel(id + 'g', G0, G1, ...GO_G), travel(id + 'p', P0, P1, ...GO_P),
      `.dgfig.pe .dgm-g{animation:${id}g ${CYCLE} ease-in-out ${DELAY} infinite}`,
      `.dgfig.pe .dgm-p{animation:${id}p ${CYCLE} ease-in-out ${DELAY} infinite}`,
    ].join('\n'),
  };
}

const FIGURES = { 'empty-net': emptyNet(), faceoffs: faceoffs(), icing: icing(),
                  offside: offside(), penalties: penalties(), slot: slot() };

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
