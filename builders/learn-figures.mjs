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

import { furniture, SX, SY } from '../src/lib/rinkart.js';
import { BLUE_LINE_X, NEUTRAL_DOT_X } from '../src/lib/rink.js';

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
const stamp = (x, y) => `<text class="dgstamp" x="${f(x)}" y="${f(y)}">Diagram</text>`;

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
  const DOT = { x: SX(-NEUTRAL_DOT_X), y: SY(-22) };  // where an offside restarts
  // ⭐ THE WHOLE RULE IS ONE COMPARISON, so the drawing has to win it at a
  // glance: measured in FEET, the skater finishes 18 ft INSIDE the zone and the
  // puck 11 ft OUTSIDE it. The first draft had 9 and 4, and at 256px -- the
  // binding width, which is the DESKTOP card -- a 4 ft gap was thinner than the
  // token's own outline and the puck read as sitting on the line.
  const P0 = { x: SX(12), y: SY(4) }, P1 = { x: SX(-14), y: SY(4) };
  const A0 = { x: SX(8), y: SY(-15) }, A1 = { x: SX(-43), y: SY(-15) };
  return {
    // From the far neutral-zone dot to the end boards: one blue line, the ice
    // either side of it, and both spots a draw could come back to.
    viewBox: `${f(SX(24))} 0 ${f(SX(-89) - SX(24) + 10)} 85`,
    label: 'Diagram: an attacking skater crosses the blue line ahead of the puck, '
         + 'so play stops and the face-off comes back outside the zone.',
    svg: defs(id)
      // NO TINTS. The slot lozenge and the blue-line band are measurements of
      // ours, and this figure is about the league's rulebook -- see rinkart.js.
      + `<g class="dgpaint">${furniture(id, false)}</g>`
      + `<g class="dgplay">`
      // ① both come up the ice — drawn where they START, and they stay drawn.
      + ghost(A0.x, A0.y) + puckGhost(P0.x, P0.y)
      + arrow(id, A0.x, A0.y, A1.x, A1.y) + arrow(id, P0.x, P0.y, P1.x, P1.y, 4)
      // ② the crossing. The line is lit where the rule is decided.
      + `<line class="dghot" x1="${f(BLUE)}" y1="1" x2="${f(BLUE)}" y2="84"/>`
      + `<g class="dgmove dgm-a">${tok(A1.x, A1.y)}</g>`
      + `<g class="dgmove dgm-p">${puck(P1.x, P1.y)}</g>`
      // ③ and the punishment, which is WHERE — the same claim the icing card makes.
      + `<circle class="dgspot" cx="${f(DOT.x)}" cy="${f(DOT.y)}" r="4.2"/>`
      // EACH BADGE SITS ON THE THING ITS LINE IS ABOUT: ① where they set off,
      // ② on the skater who has gone too far, ③ on the spot play comes back to.
      // The first draft put ② at the top of the blue line, nowhere near the
      // crossing, where it read as a label for the line itself.
      + badge(1, A0.x - 9, A0.y) + badge(2, A1.x, A1.y - 9)
      + badge(3, DOT.x, DOT.y + 9)
      + stamp(SX(18), SY(36))
      + `</g>`,
    steps: [
      'The attackers carry the puck toward the blue line.',
      'A skater crosses the line <b>before the puck does</b> &mdash; that is offside. '
      + 'The puck has to enter the zone first.',
      'Play stops, and the face-off comes back <b>outside</b> the zone.',
    ],
    // ⭐ THE MOTION IS EMITTED BESIDE THE GEOMETRY, from the same two points, so
    // a token cannot animate from somewhere it was never drawn. Each transform
    // is the token's start MINUS its end: the element sits at the end, and the
    // animation pushes it back to the start and lets it travel home. With
    // animation off it is simply at the end, which is the finished diagram.
    css: [
      `@keyframes ${id}a{0%,8%{transform:translate(${f(A0.x - A1.x)}px,${f(A0.y - A1.y)}px)}`
      + `55%,100%{transform:translate(0,0)}}`,
      `@keyframes ${id}p{0%,8%{transform:translate(${f(P0.x - P1.x)}px,${f(P0.y - P1.y)}px)}`
      + `55%,100%{transform:translate(0,0)}}`,
      `.dgfig.of .dgm-a{animation:${id}a 11s ease-in-out infinite}`,
      `.dgfig.of .dgm-p{animation:${id}p 11s ease-in-out infinite}`,
    ].join('\n'),
  };
}

const FIGURES = { offside: offside() };

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
