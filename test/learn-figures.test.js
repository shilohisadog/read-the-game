/**
 * The rule diagrams — the ice, with nobody's game on it.
 *
 * Kevin, 2026-08-31: *"the learning cards don't have to be specific replay
 * events… we have some discretion in what we overlay onto the ice for
 * explanatory purposes"*, and then the constraint: *"it's the same ice rink, but
 * the graphics are noticeably and obviously different between the learning cards
 * and the game pages."* Both halves of that sentence are load-bearing and both
 * are asserted here — the SAME rink, and NOT the same marks.
 *
 * ⭐ WHAT THESE TESTS ARE FOR, since a diagram has no data to be wrong about.
 * The risk is not an incorrect number, it is a drawing that gets mistaken for a
 * recorded play. So the claims are about PROVENANCE and about the two surfaces
 * not drifting apart, which is what a fixture of the figure's own bytes could
 * never tell you.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { furniture } from '../src/lib/rinkart.js';
import { TEAMS, NEUTRAL } from '../src/lib/teams.js';
import { boot } from './helpers/page.js';

const learn = readFileSync(new URL('../src/what-you-can-see.html', import.meta.url), 'utf8');
const figures = JSON.parse(readFileSync(new URL('../data/learn-figures.json', import.meta.url)));

/** Every painted line and spot in a chunk of rink markup, as comparable strings. */
const paint = svg => [
  ...svg.matchAll(/<line class="ln [^"]*"[^>]*>/g),
  ...svg.matchAll(/<circle class="(?:ln [^"]*|fdot(?: ctr)?)"[^>]*>/g),
  ...svg.matchAll(/<rect class="boards"[^>]*>/g),
].map(m => m[0]).sort();

test('⭐ the diagram and the replay are the SAME RINK, line for line', () => {
  /* THE CLAIM KEVIN'S "same ice rink" ACTUALLY MAKES, and the reason `furniture`
     was pulled out of app.js at all. These two strings arrive by completely
     different routes -- the game's is built by JS at render time inside boot,
     the diagram's was drawn by node into a committed JSON file and inlined by
     Python -- so this is not a function compared with itself. If either surface
     grows its own idea of where a blue line goes, they stop matching here.

     ⭐ AND IT IS NOT A MIRROR (docs/status.md H1). The expectation is read out
     of the RENDERED GAME PAGE, not recomputed from `furniture()`: the only way
     to satisfy it is for both surfaces to actually agree. */
  const game = paint(boot().$('rink').innerHTML);
  const diagram = paint(figures.offside.svg);
  assert.ok(game.length >= 15, `the game rink painted only ${game.length} things`);
  assert.deepEqual(diagram, game,
    'the learn page is drawing a different rink from the one the game draws');
});

test('⭐ no figure is filled in a club colour — the provenance grammar', () => {
  /* ⭐⭐ THIS IS THE SIGNAL, AND THE ARROW IS NOT (CHENG).
     It is tempting to guard "the replay never draws an arrow, so an arrow means
     diagram" -- true today, and it stops being true the moment anything
     directional lands on the game ice, which is live work. What actually carries
     provenance is: FILLED IN A CLUB'S COLOUR = recorded, OUTLINED NEUTRAL =
     illustrative. So that is what is asserted, and it survives whatever the
     replay surface grows next. */
  const colours = new Set();
  for (const t of Object.values(TEAMS)) {
    for (const v of Object.values(t)) {
      if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) colours.add(v.toLowerCase());
    }
  }
  assert.ok(colours.size >= 25, `only ${colours.size} distinct club colours found — the probe has lost its subject`);
  for (const [id, fig] of Object.entries(figures)) {
    const svg = fig.svg.toLowerCase();
    for (const c of colours) {
      assert.ok(!svg.includes(c),
        `the ${id} figure paints ${c}, a club's colour — a diagram that borrows a club's `
        + 'identity is a diagram that can be read as a recorded play');
    }
  }
});

test('a figure names no club, no player and no game', () => {
  // The weaker sibling of the colour test, and it catches the other way in: a
  // figure captioned "TOR" is a claim about Toronto whatever colour it is drawn in.
  const abs = Object.keys(TEAMS).filter(a => a.length === 3);
  assert.ok(abs.length >= 30, `only ${abs.length} clubs — the probe has lost its subject`);
  for (const [id, fig] of Object.entries(figures)) {
    const words = [...fig.svg.matchAll(/>([^<]+)</g)].map(m => m[1].trim()).filter(Boolean);
    for (const w of words) {
      assert.ok(!abs.includes(w), `the ${id} figure writes "${w}" on the ice`);
    }
  }
});

test('⭐ every token animates in from a place it is actually drawn', () => {
  /* ⭐ THE ACCUMULATE RULE, MADE CHECKABLE. A still frame of any animation must
     be true on its own, which here means: the element's own coordinates are its
     FINAL position, a dashed ghost marks where it began, and the keyframe offset
     is exactly the distance between the two. Get that wrong and the token slides
     in from empty ice while the ghost sits somewhere else -- which looks fine in
     motion and is nonsense the instant anyone turns motion off.

     Three separate outputs have to agree for this to pass: the ghost element,
     the token element, and the text of the @keyframes. Moving any one of them
     alone goes red. */
  let checked = 0;
  for (const [id, fig] of Object.entries(figures)) {
    const ghosts = [...fig.svg.matchAll(/class="[^"]*\bdgghost\b[^"]*"[^>]*cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)]
      .map(m => ({ x: +m[1], y: +m[2] }));
    const moves = [...fig.svg.matchAll(
      /class="dgmove (dgm-[a-z]+)"><circle[^>]*cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)];
    assert.ok(moves.length, `the ${id} figure has no moving token`);
    for (const [, cls, ex, ey] of moves) {
      const key = new RegExp(`\\.dgfig\\.\\w+ \\.${cls}\\{animation:(\\S+) `).exec(fig.css);
      assert.ok(key, `${id}/${cls} animates with no keyframes named`);
      const kf = new RegExp(`@keyframes ${key[1]}\\{0%,\\d+%\\{transform:translate\\((-?[\\d.]+)px,(-?[\\d.]+)px\\)`)
        .exec(fig.css);
      assert.ok(kf, `${id}/${cls}'s keyframes do not start with a translate`);
      const from = { x: +ex + +kf[1], y: +ey + +kf[2] };
      assert.ok(ghosts.some(g => Math.abs(g.x - from.x) < 0.05 && Math.abs(g.y - from.y) < 0.05),
        `${id}/${cls} animates in from (${from.x}, ${from.y}), where nothing is drawn — `
        + `the ghosts are at ${JSON.stringify(ghosts)}`);
      checked++;
    }
  }
  assert.ok(checked >= 2, `only ${checked} moving tokens were checked`);
});

test('⭐ the keyframes come to REST, so motion-off is the finished picture', () => {
  // The other half of the rule above: a loop that ends anywhere but translate(0,0)
  // leaves the reduced-motion frame disagreeing with the animation's own ending.
  for (const [id, fig] of Object.entries(figures)) {
    const ends = [...fig.css.matchAll(/@keyframes \S+\{[^}]*\}[^}]*?(\d+)%,100%\{transform:translate\(([^)]*)\)\}\}/g)];
    assert.ok(ends.length, `the ${id} figure's keyframes never state a resting position`);
    for (const [, , rest] of ends) {
      assert.equal(rest.replace(/\s/g, ''), '0,0',
        `a ${id} token rests at translate(${rest}) — reduced motion would show it mid-story`);
    }
  }
});

test('⭐ reduced motion stops ANIMATION, not only transitions', () => {
  /* ⚠️ THE RULE WAS WRONG FOR AS LONG AS IT EXISTED and nothing could tell.
     It read `*{transition:none!important}` on pages that carried ZERO @keyframes,
     so the gap was unreachable and looked exactly like a working guard -- until a
     figure animated. `docs/status.md` §H: a check with no instrument for the axis
     in question is not a check.
     THE PAIR MATTERS. Asserting the rule alone would pass on a page with nothing
     to stop, so the second half asserts the page does have animation to stop. */
  const m = /@media \(prefers-reduced-motion:reduce\)\{\*\{([^}]*)\}/.exec(learn);
  assert.ok(m, 'the learn page carries no reduced-motion rule at all');
  assert.match(m[1], /animation:none!important/,
    'reduced motion does not stop animation, and the rule diagrams animate');
  assert.ok(/@keyframes /.test(learn),
    'the page has no animation to stop, so the rule above proves nothing');
});

test('⭐ a diagram carries no tint of ours — the rulebook does not borrow our claims', () => {
  /* THE LEARN PAGE SPLITS THE LEAGUE'S RULES FROM WHAT WE COUNT, on purpose and
     with a visual difference, so our measurements cannot borrow the rulebook's
     authority. The slot lozenge and the blue-line band are OURS -- a geometric
     rule of ours in the first case, an argument about where the game is
     contested in the second -- and the first offside figure had both glowing
     inside it. Found by LOOKING; no test in the suite could see it, and none
     could have, because nothing had ever claimed they must not be there. */
  for (const [id, fig] of Object.entries(figures)) {
    assert.ok(!/class="slotzone"/.test(fig.svg),
      `the ${id} rule diagram paints the slot, which is a measurement of ours`);
    assert.ok(!/class="zoneband"/.test(fig.svg),
      `the ${id} rule diagram paints the blue-line band, which is a measurement of ours`);
  }
  // AND THE PAIR: `furniture` must still be ABLE to draw them, or the assertions
  // above are satisfied by a function that lost the feature altogether.
  assert.match(furniture('', true), /class="slotzone"/,
    'furniture can no longer draw the slot at all, so the refusals above prove nothing');
});

test('⭐ the clip ids are namespaced, or the second figure steals the first one\'s shape', () => {
  /* Five diagrams share one document. `url(#slotband)` resolves to the FIRST
     matching id in the page, so duplicate ids make every figure after the first
     clip to the wrong rink -- no error, no warning, just a wrong drawing.
     TESTED ON `furniture` DIRECTLY, because no figure turns tints on yet: an
     assertion against the current figures would be satisfied by markup that
     contains no clip paths at all, which is coverage that proves nothing. */
  const a = furniture('one-', true), b = furniture('two-', true);
  const ids = s => [...s.matchAll(/<clipPath id="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids(a).length >= 3, 'the slot tint stopped using clip paths');
  assert.deepEqual(ids(a).filter(i => ids(b).includes(i)), [],
    'two figures emit the same clipPath id, so one of them clips to the other');
  for (const s of [a, b]) {
    for (const ref of [...s.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1])) {
      assert.ok(ids(s).includes(ref), `a clip references #${ref}, which this figure never defines`);
    }
  }
});

test('the figure sits inside its card, after the title and before the words', () => {
  // The teaching order: name the rule, draw the rule, say it, then offer the real
  // instance. It is inside the card's <a> so that tapping the picture lands on
  // the same rule happening in a game.
  const card = /<a class="card" id="offside"[\s\S]*?<\/a>/.exec(learn);
  assert.ok(card, 'the offside card has gone');
  const t = card[0].indexOf('<p class="t">');
  const f = card[0].indexOf('<figure class="dgfig');
  const p = card[0].indexOf('</figure><p>');
  /* ⭐ EACH PIECE IS ASSERTED TO EXIST BEFORE THEIR ORDER IS. `indexOf` returns
     -1 for a thing that is absent, and `f > -1` is true -- so the ordering check
     alone PASSED against a card whose title had been deleted outright. A
     mutation found it: "the figure is drawn before the title" survived, because
     removing the title satisfies "the figure comes after it". Comparing
     positions without first establishing that both things are there is a check
     that reads as ordering and is really nothing at all. */
  assert.ok(t >= 0, 'the card no longer names the rule');
  assert.ok(f >= 0, 'the card carries no figure');
  assert.ok(p >= 0, 'the card carries no blurb after its figure');
  assert.ok(f > t, 'the figure is drawn before the card names the rule');
  assert.ok(f < p, 'the figure comes after the blurb rather than before it');
});

test('the offside blurb says the LIMIT, not the rule the picture already draws', () => {
  /* Kevin's direction is teaching, and three tellings of one fact is not
     teaching. With the figure present the words shrank to the half no drawing
     can carry: zero of 4,160 offside stoppages carry a coordinate, a zone or a
     player, so this is the one rule we can name and never show. */
  const card = /<a class="card" id="offside"[\s\S]*?<\/a>/.exec(learn)[0];
  const blurb = /<\/figure><p>([\s\S]*?)<\/p>/.exec(card);
  assert.ok(blurb, 'the offside card lost its blurb');
  assert.match(blurb[1], /never the crossing/, 'the blurb stopped stating the limit');
  assert.doesNotMatch(blurb[1], /ahead of the puck/,
    'the blurb repeats what the figure and its steps both already say');
});

test('the NEUTRAL colour is what a figure may use, and it is not any club\'s', () => {
  // Guards the premise of the colour test above rather than the figures: if
  // NEUTRAL ever became some club's actual hex, "no club colour" would start
  // forbidding the one colour these drawings are supposed to use.
  const clubs = new Set(Object.values(TEAMS)
    .flatMap(t => Object.values(t))
    .filter(v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v))
    .map(v => v.toLowerCase()));
  assert.ok(!clubs.has(NEUTRAL.toLowerCase()),
    `NEUTRAL ${NEUTRAL} is a club's colour now`);
});
