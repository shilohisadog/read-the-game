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

import { furniture, boardsY, SX } from '../src/lib/rinkart.js';
import { TEAMS, NEUTRAL } from '../src/lib/teams.js';
import { boot } from './helpers/page.js';

const learn = readFileSync(new URL('../src/what-you-can-see.html', import.meta.url), 'utf8');
/* ⚠️ EVERY RULE PAGE, NOT THE FIRST ONE. These three page-level tests read
   `offside.html` alone until icing shipped, at which point a whole page was
   live and unchecked -- and the second figure is exactly when "the test reads
   THE page" stops being the same claim as "the test reads EVERY page". Keyed by
   figure id so a new diagram cannot arrive without its page being examined. */
const rulePages = Object.fromEntries(Object.keys(
  JSON.parse(readFileSync(new URL('../data/learn-figures.json', import.meta.url))))
  .map(id => [id, readFileSync(new URL(`../src/${id}.html`, import.meta.url), 'utf8')]));
const rule = rulePages.offside;
const figures = JSON.parse(readFileSync(new URL('../data/learn-figures.json', import.meta.url)));

/** Every painted line and spot in a chunk of rink markup, as comparable strings. */
const paint = svg => [
  ...svg.matchAll(/<line class="ln [^"]*"[^>]*>/g),
  ...svg.matchAll(/<circle class="(?:ln [^"]*|fdot(?: ctr)?)"[^>]*>/g),
  ...svg.matchAll(/<rect class="boards"[^>]*>/g),
].map(m => m[0]).sort();

/**
 * WHERE EVERY GOALTENDER ACTUALLY LANDS, translates included.
 *
 * ⭐ THE FIGURE IS PLACED BY A WRAPPER, SO READING ITS OWN COORDINATES IS A LIE.
 * `goalieGlyph` always builds him at y=42.5 — that is where a crease is — and a
 * `<g transform="translate(…)">` around him is what puts him anywhere else. A
 * regex over `cx`/`cy` would report the pulled goaltender standing in his crease
 * while the page shows him off the ice at the boards.
 *
 * So this walks the tags in order and composes the transforms, which is what a
 * renderer does. It is deliberately NOT a call into the builder: the point is to
 * compute the rendered position INDEPENDENTLY and compare, and asking the code
 * where it drew something is the mirror this file keeps refusing.
 *
 * ⚠️ IT COMPOSES THE SCALE TOO, because the goaltender carries one — a diagram
 * sizes him to its own tokens, not to the net. A walker that read only
 * `translate` would place him correctly and report him HALF SIZE, which is the
 * quiet kind of wrong: every assertion still passes and none of them means what
 * it says. Uniform scale only; anything else here throws rather than guesses.
 */
function goalies(svg) {
  const out = [];
  const stack = [{ s: 1, e: 0, f: 0 }];      // x' = s*x + e,  y' = s*y + f
  const top = () => stack[stack.length - 1];
  for (const m of svg.matchAll(/<(\/?)g\b([^>]*)>|<(rect|circle|line)\b([^>]*)>/g)) {
    const [, close, gattr, shape, sattr] = m;
    if (shape) {
      if (!out.length || !out[out.length - 1].open) continue;
      const a = k => { const v = new RegExp(`\\b${k}="(-?[\\d.]+)"`).exec(sattr); return v ? +v[1] : null; };
      let x1, x2, y1, y2;
      if (shape === 'rect') { x1 = a('x'); y1 = a('y'); x2 = x1 + a('width'); y2 = y1 + a('height'); }
      else if (shape === 'circle') { const r = a('r'); x1 = a('cx') - r; x2 = a('cx') + r; y1 = a('cy') - r; y2 = a('cy') + r; }
      else { x1 = Math.min(a('x1'), a('x2')); x2 = Math.max(a('x1'), a('x2')); y1 = Math.min(a('y1'), a('y2')); y2 = Math.max(a('y1'), a('y2')); }
      const t = top(), g = out[out.length - 1];
      for (const [px, py] of [[x1, y1], [x2, y2]]) {
        const X = t.s * px + t.e, Y = t.s * py + t.f;
        g.x1 = Math.min(g.x1, X); g.x2 = Math.max(g.x2, X);
        g.y1 = Math.min(g.y1, Y); g.y2 = Math.max(g.y2, Y);
      }
      continue;
    }
    if (close) {
      stack.pop();
      const g = out[out.length - 1];
      if (g && g.open && g.depth === stack.length) g.open = false;
      continue;
    }
    const tf = /transform="([^"]*)"/.exec(gattr);
    let s = 1, e = 0, fy = 0;
    if (tf) {
      const tr = /translate\((-?[\d.]+),(-?[\d.]+)\)/.exec(tf[1]);
      const sc = /scale\((-?[\d.]+)\)/.exec(tf[1]);
      assert.match(tf[1], /^(translate\([^)]*\)\s*)?(scale\([^)]*\))?$/,
        `a transform this walker cannot compose: ${tf[1]}`);
      if (tr) { e = +tr[1]; fy = +tr[2]; }
      if (sc) s = +sc[1];
    }
    const p = top();
    stack.push({ s: p.s * s, e: p.s * e + p.e, f: p.s * fy + p.f });
    if (/class="[^"]*\bdggk\b/.test(gattr)) {
      out.push({ x1: Infinity, x2: -Infinity, y1: Infinity, y2: -Infinity,
                 open: true, depth: stack.length - 1 });
    }
  }
  return out.map(g => ({
    x1: +g.x1.toFixed(2), x2: +g.x2.toFixed(2), y1: +g.y1.toFixed(2), y2: +g.y2.toFixed(2),
  }));
}

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

test('⭐ a cropped figure carries the net, which is what makes it an END of a rink', () => {
  /* Kevin, on the first offside page: *"we need a goal (at least, maybe even the
     goalie) to provide another level of orientation for the viewer... the rink
     snippet just doesn't look right without a net and goalie."*

     The full sheet has two nets and is obviously symmetric. A CROP has one end,
     and without the net that end is just more ice -- the blue line alone cannot
     say "this is the attacking zone" to someone who does not yet know what a
     blue line means, which is the entire audience for this page. So a figure
     that crops is a figure that must show the equipment.

     THE COLOUR IS ASSERTED SEPARATELY AND THAT IS THE POINT: `netGlyph` paints
     the frame in whatever it is handed, and on the game page that is the CLUB's
     colour -- the provenance signal these drawings must not borrow. */
  /* ⚠️ NO `if (cropped)` BRANCH, and that was the first draft. Exempting a
     full-sheet figure looked principled -- the crop is WHY the net matters -- but
     docs/status.md §H4 is exactly this: a test that branches on the data tests
     neither branch, and with one figure on disk only one branch would ever run.
     A rink has nets whatever is framed, so the rule has no exception to reason
     about and the viewBox check below carries the crop argument on its own. */
  for (const [id, fig] of Object.entries(figures)) {
    const box = fig.viewBox.split(/\s+/).map(Number);
    assert.match(fig.svg, /class="mesh"/, `the ${id} figure draws no net`);
    assert.match(fig.svg, /class="crease"/, `the ${id} figure draws a net with no crease`);
    // AND THE NET IS INSIDE THE CROP, or it is equipment nobody can see. `mesh`
    // carries the goal line's x, so the frame either contains it or does not.
    const xs = [...fig.svg.matchAll(/class="mesh" d="M ([\d.]+) /g)].map(m => +m[1]);
    assert.ok(xs.some(x => x >= box[0] && x <= box[0] + box[2]),
      `every net in the ${id} figure is outside its own viewBox ${fig.viewBox}: ${xs}`);
  }
});

test('⭐ a goaltender is drawn IFF the figure\'s own words name one', () => {
  /* ⚠️ THIS TEST USED TO SAY "every figure draws a goaltender", one line inside
     the net test above, and its failure message was *"draws a net with nobody in
     it"* -- the goalie swept into a sentence about EQUIPMENT. He is not
     equipment; he is a person, and a person on the ice is a claim about play.

     Kevin, twice. On face-offs: *"I'm not sure what the circles in front of the
     net are?"* On offside: *"there's the random circle in front of the net."*
     They were goaltenders, standing on four of five figures, and on three of
     those the words never mentioned a goaltender at all. The test put them
     there; nothing about the lessons did. That is the SIXTH time on these five
     figures that "every figure does X" turned out to mean "a figure that does X
     must do it correctly" (docs/status.md §H4).

     ⭐ THE RULE IS A BICONDITIONAL, WHICH IS WHY IT CANNOT GO VACUOUS. Drawn iff
     named: `empty-net` is the one figure whose subject IS the goaltender, and it
     is the one figure that draws him. Both branches carry figures (1 and 4), so
     neither side is an empty claim, and the FALSE side is the regression that
     actually happened -- a keeper appearing on a page that never says the word.

     ⭐ AND A GOALTENDER IS EITHER IN A CREASE OR OFF THE ICE — never loitering.
     That is the second half of Kevin's note: *"make sure the pulled goalie goes as
     far off the ice as he can... we need to ensure the viewer understands the
     goalie comes off the ice and another skater takes his place."* He used to stop
     at y=11, inside the rink, so the frame a reader rests on showed a goaltender
     standing in the neutral zone. Both states are asserted and both must occur, so
     neither branch is an empty claim. */
  const named = [], drawn = [];
  for (const [id, fig] of Object.entries(figures)) {
    const words = (fig.steps.join(' ') + ' ' + fig.label).replace(/<[^>]+>/g, '');
    const says = /goal(ie|tender)/i.test(words);
    const has = /class="dggk/.test(fig.svg);
    if (says) named.push(id);
    if (has) drawn.push(id);
    assert.equal(has, says, has
      ? `the ${id} figure draws a goaltender its own words never mention — that is `
        + 'the unlabelled figure a reader cannot identify'
      : `the ${id} figure talks about a goaltender and does not draw one`);
  }
  assert.ok(named.length >= 1 && named.length < Object.keys(figures).length,
    `${named.length} of ${Object.keys(figures).length} figures name a goaltender — `
    + 'one side of this biconditional is empty, so it proves nothing');
  assert.deepEqual(drawn, named);

  let inCrease = 0, offIce = 0;
  for (const [id, fig] of Object.entries(figures)) {
    for (const box of goalies(fig.svg)) {
      const creases = [...fig.svg.matchAll(
        /class="crease" d="M ([\d.]+) [\d.]+ A ([\d.]+) [\d.]+ 0 0 (\d) [\d.]+ [\d.]+"/g)]
        .map(m => ({ gx: +m[1], r: +m[2], dir: m[3] === '1' ? 1 : -1 }));
      const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2;
      const c = creases.find(k => Math.hypot(k.gx - cx, 42.5 - cy) < k.r
                                  && (cx - k.gx) * k.dir > 0);
      if (c) { inCrease++; continue; }
      /* ⭐ OFF THE ICE MEANS ALL OF HIM, and the boards say where that is. A
         goaltender half over the line is a goaltender standing on the boards. */
      const [top, bot] = boardsY(cx);
      assert.ok(box.y2 < top || box.y1 > bot,
        `${id}: a goaltender spans y ${box.y1}–${box.y2} at x=${cx}, where the ice `
        + `runs ${top}–${bot} — he is neither in a crease nor off the ice, which `
        + 'leaves him standing about in open play');
      offIce++;
    }
  }
  assert.ok(inCrease >= 1 && offIce >= 1,
    `${inCrease} goaltender(s) in a crease and ${offIce} off the ice — one of the `
    + 'two states this test distinguishes never occurs, so it distinguishes nothing');
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
    /* ⭐ A FIGURE MAY LEGITIMATELY NOT MOVE, and this used to forbid it. The
       face-off figure is a MAP — nine painted spots and which rule sends you to
       which — not a sequence, and animating it would be motion added because the
       harness expected motion, which is decoration this project refuses
       everywhere else. So the claim is CONSISTENCY rather than presence: a
       figure declares an animation if and only if it has something to animate.
       That still catches a figure silently losing its motion, which is what the
       old assertion was really protecting, and the `checked` count at the bottom
       keeps the whole test from going vacuous. */
    assert.equal(/\{animation:/.test(fig.css), moves.length > 0,
      moves.length
        ? `the ${id} figure has ${moves.length} moving token(s) and declares no animation`
        : `the ${id} figure declares an animation with nothing to move`);
    for (const [, cls, ex, ey] of moves) {
      const key = new RegExp(`\\.dgfig\\.\\w+ \\.${cls}\\{animation:(\\S+) `).exec(fig.css);
      assert.ok(key, `${id}/${cls} animates with no keyframes named`);
      const kf = new RegExp(`@keyframes ${key[1]}\\{0%\\{transform:translate\\((-?[\\d.]+)px,(-?[\\d.]+)px\\)`)
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
  let rested = 0;
  for (const [id, fig] of Object.entries(figures)) {
    const ends = [...fig.css.matchAll(/100%\{transform:translate\(([^)]*)\)/g)];
    // A STATIC FIGURE HAS NOTHING TO REST — see the face-off map. The claim is
    // about keyframes that exist, and the count below keeps it from going empty.
    for (const [, rest] of ends) {
      rested++;
      assert.equal(rest.replace(/\s/g, ''), '0,0',
        `a ${id} token rests at translate(${rest}) — reduced motion would show it mid-story`);
    }
  }
  assert.ok(rested >= 2, `only ${rested} resting positions across every figure`);
});

test('⭐ a figure opens on the FINISHED picture, not on frame zero', () => {
  /* ⭐ FOUND BY LOOKING, and it is the reader's very first impression. A
     screenshot of the first build caught frame 0 of the loop: every token
     sitting on top of its own ghost, both arrows pointing at empty ice. That is
     not a bad screenshot, it is what everyone sees at load -- the one frame of
     the cycle that teaches nothing.

     A DELAY WITH NO fill-mode IS THE WHOLE FIX. Until the delay elapses an
     element uses its own styles, and its own position IS the end of the story.
     `animation-fill-mode:backwards` would apply the 0% frame during the delay
     and put the bug straight back, so its ABSENCE is asserted, not just the
     delay's presence. */
  let delayed = 0;
  for (const [id, fig] of Object.entries(figures)) {
    /* ⚠️ EVERY DECLARATION, NOT THE WELL-FORMED ONES. This matched
       `animation:(\S+) (\S+) (\S+) (\S+) (\S+)` -- five tokens -- so a rule that
       had LOST its delay was four tokens and simply did not match. Removing the
       delay from one of two tokens left the other still matching, the loop still
       ran, and the mutation survived: an instrument that selects only the cases
       that already pass. The shorthand is now captured whole and read after. */
    const rules = [...fig.css.matchAll(/\{animation:([^}]+)\}/g)].map(m => m[1]);
    // Again: a figure with nothing to animate declares nothing, and that is not
    // a defect. `delayed` below is what stops this from passing on silence.
    for (const shorthand of rules) {
      delayed++;
      const times = shorthand.match(/(?:^|\s)[\d.]+m?s(?=\s|$)/g) || [];
      assert.equal(times.length, 2,
        `${id} declares ${times.length} time(s) in "animation:${shorthand}" — a duration and a `
        + 'delay are both required, and without the delay the figure opens on frame zero');
      assert.ok(parseFloat(times[1]) > 0, `${id}'s delay is ${times[1]}`);
    }
    assert.doesNotMatch(fig.css, /animation-fill-mode|\bbackwards\b|\bboth\b/,
      `${id} sets a fill-mode, which paints frame zero during the delay and undoes the fix`);
  }
  assert.ok(delayed >= 2, `only ${delayed} delayed animations across every figure`);
});

test('the loop hides its own wrap, so a reset does not read as a glitch', () => {
  // An infinite loop teleports 100% -> 0%. A token snapping the length of the
  // neutral zone every cycle looks like a bug; it fades out at rest and in at the
  // start instead. Motion off means none of this applies and the token is simply
  // drawn, fully opaque, where the story ends.
  for (const [id, fig] of Object.entries(figures)) {
    for (const kf of fig.css.match(/@keyframes[^\n]*/g) || []) {
      assert.match(kf, /0%\{[^}]*opacity:0\}/, `${id} fades in at neither end of its loop`);
      assert.match(kf, /100%\{[^}]*opacity:0\}/, `${id} snaps back visibly at the wrap`);
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
  /* ⭐⭐ SCOPED BY WHICH HALF OF THE PAGE THE FIGURE IS ON, and that is data
     rather than a branch I chose. The learn page keeps the league's rules apart
     from what WE count; a tint of ours on a RULES figure is our claim wearing
     the rulebook's clothes, and on the SLOT figure the same tint is the subject
     — it is the region `isHighDanger` tests, drawn from the same two constants,
     which is the whole of Doctrine 7.

     BOTH DIRECTIONS ARE ASSERTED, and both halves are checked non-empty, so this
     is not the §H4 shape where a branch on the data tests neither branch. The
     third figure taught me that lesson about motion; this is the same lesson
     about doctrine, caught before it shipped rather than after. */
  const rules = Object.entries(figures).filter(([, f]) => f.group === 'rules');
  const ours = Object.entries(figures).filter(([, f]) => f.group === 'ours');
  assert.ok(rules.length && ours.length,
    `figures are ${rules.length} rules and ${ours.length} ours — one half is untested`);
  for (const [id, fig] of rules) {
    assert.ok(!/class="slotzone"/.test(fig.svg),
      `the ${id} rule diagram paints the slot, which is a measurement of ours`);
    assert.ok(!/class="zoneband"/.test(fig.svg),
      `the ${id} rule diagram paints the blue-line band, which is a measurement of ours`);
  }
  // AND THE SLOT FIGURE MUST CARRY IT: its card says "a geometric rule of ours,
  // not a model", and a figure of that rule with the region missing shows nothing.
  const [, sl] = ours.find(([id]) => id === 'slot') || [];
  assert.ok(sl, 'the slot figure has gone');
  assert.match(sl.svg, /class="slotzone"/,
    'the slot figure does not draw the slot — the one thing it is a diagram of');
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

test('⭐ the card leads to the diagram, and the diagram leads to the game', () => {
  /* Kevin: *"I want the diagram in place of the game replay we currently get
     when the offside card is clicked."* The real moment must not be lost with
     it, so the door moves down a level rather than closing: card -> diagram ->
     "See it in a real game". Both hops are asserted, because a card that reaches
     a diagram which reaches nothing is the failure this replaces. */
  for (const [id, page] of Object.entries(rulePages)) {
    const c = new RegExp(`<a class="card" id="${id}" href="([^"]+)"`).exec(learn);
    assert.ok(c, `the ${id} card has gone`);
    assert.equal(c[1], `/${id}.html`, `the ${id} card no longer opens its diagram`);
    const d = /<a class="rgo" href="([^"]+)">([^<]+)</.exec(page);
    assert.ok(d, `the ${id} diagram carries no way through to the replay`);
    assert.match(d[1], /^\/game\.html\?game=\d+/, `${id}'s door points at ${d[1]}`);
  }
  const card = /<a class="card" id="offside" href="([^"]+)"/.exec(learn);
  const door = /<a class="rgo" href="([^"]+)">([^<]+)</.exec(rule);
  /* ⭐ THE DOOR MAY NOT PROMISE THE THING THIS PAGE JUST EXPLAINED WE CANNOT
     SHOW. Kevin: *"we say 'See it in a real game', which isn't consistent with
     what we are providing."* An offside stoppage carries no coordinate, no zone
     and no player, and stoppages are not on the playable timeline at all -- the
     link resolves to the FACE-OFF that restarts play. So the label names the
     restart, and the words that would over-promise are refused by name. */
  assert.match(door[2], /restart/i, `the offside door says "${door[2].trim()}", not what it opens`);
  assert.doesNotMatch(door[2], /a real game|the offside|the crossing/i,
    `the offside door promises "${door[2].trim()}", which is not what lies through it`);
  assert.match(door[1], /^\/game\.html\?game=\d+/, `the door points at ${door[1]}`);
  assert.match(door[1], /layer=whistle/, 'the door does not turn on the layer that marks the call');
});

test('⛔ no door says "real" or "live" — what lies through it is a recording', () => {
  /* Kevin, on the face-offs button: *"the link to a replay says '...a real
     face-off'. I want to avoid 'real' or 'live' or anything that suggests
     streaming or video, so can the button please say 'See a face-off in our
     replay' instead."*

     ⚠️ THE RULE ALREADY EXISTED AND WAS SCOPED TO ONE PAGE. The test above
     refuses "a real game" on the OFFSIDE door, written the day Kevin first
     raised it — and two other doors shipped saying "a real icing" and "a real
     face-off" because nothing looked at them. A rule written for the instance
     that provoked it is un-instrumented for every other instance
     (docs/status.md §H). So this reads every door there is.

     What lies through any of these is a game we recorded, replayed from a JSON
     file. "Real" and "live" both invite a reader to expect a broadcast, and the
     word buys nothing: "See a face-off in our replay" already says the thing and
     already says where. */
  const BANNED = /\b(real|live|stream(ing)?|video|footage|watch it happen)\b/i;
  let doors = 0;
  for (const [id, page] of Object.entries(rulePages)) {
    for (const m of page.matchAll(/<a class="rgo"[^>]*>([^<]+)</g)) {
      doors++;
      assert.doesNotMatch(m[1], BANNED,
        `the ${id} door says "${m[1].trim()}" — that word promises a broadcast, `
        + 'and what is through it is a recording');
      // AND IT STILL NAMES WHERE IT GOES, so the fix cannot be "delete the words".
      assert.match(m[1], /our replay/,
        `the ${id} door says "${m[1].trim()}" without saying it opens our replay`);
    }
  }
  assert.equal(doors, Object.keys(rulePages).length,
    `${doors} doors across ${Object.keys(rulePages).length} rule pages — one page has none, or two`);
});

test('the diagram page is the game\'s stage without the game\'s instruments', () => {
  /* Kevin: *"a similar layout, without the scoreboard, clock, controls, etc.,
     similar yet different enough not to be confusing."* The rink sits in the
     same ice-coloured frame the replay uses; a scoreboard with no game and a
     clock with no time would be fabrications, so none of that furniture is here.
     Asserted by ID, because those are the elements the game page actually uses. */
  for (const [name, page] of Object.entries(rulePages)) {
    for (const id of ['aSc', 'hSc', 'clk', 'per', 'scrub', 'play', 'ppill', 'pboxes']) {
      assert.ok(!new RegExp(`id="${id}"`).test(page),
        `the ${name} page carries the game page's #${id} — an instrument with nothing to measure`);
    }
    assert.match(page, /<figure class="dgfig/, `the ${name} page has no diagram`);
    assert.match(page, /class="dgsteps"/, `the ${name} page has no steps`);
  }
});

test('the figure comes after the rule is named and before the steps explain it', () => {
  for (const [name, page] of Object.entries(rulePages)) {
    const a = page.indexOf('<h1>'), b = page.indexOf('<figure class="dgfig');
    const c = page.indexOf('<ol class="dgsteps"');
    assert.ok(a >= 0 && b >= 0 && c >= 0, `${name}: h1 ${a}, figure ${b}, steps ${c}`);
    assert.ok(b > a && b < c, `${name} draws its figure out of order`);
  }
  const t = rule.indexOf('<h1>');
  const f = rule.indexOf('<figure class="dgfig');
  const o = rule.indexOf('<ol class="dgsteps"');
  // Each piece is asserted to EXIST before their order is: indexOf returns -1
  // for a thing that is absent, and `f > -1` is true -- which is how an earlier
  // version of this passed against a card whose title had been deleted.
  assert.ok(t >= 0 && f >= 0 && o >= 0, `h1 ${t}, figure ${f}, steps ${o}`);
  assert.ok(f > t, 'the figure is drawn before the page names the rule');
  assert.ok(f < o, 'the steps come before the figure they narrate');
});

test('the offside words say the LIMIT, not the rule the picture already draws', () => {
  /* Kevin's direction is teaching, and three tellings of one fact is not
     teaching. With the figure present the words shrank to the half no drawing
     can carry: zero of 4,160 offside stoppages carry a coordinate, a zone or a
     player, so this is the one rule we can name and never show. */
  const lede = /<p class="rlede">([\s\S]*?)<\/p>/.exec(rule);
  assert.ok(lede, 'the diagram page lost its opening sentence');
  assert.match(lede[1], /never the crossing/, 'the page stopped stating the limit');
  assert.doesNotMatch(lede[1], /ahead of the puck/,
    'the words repeat what the figure and its steps both already say');
});

test('⭐ offside: the puck ENDS SHORT of the line and the skater ends past it', () => {
  /* Kevin: *"we need to mention that the puck has to completely cross the blue
     line first, that's an important distinction that novices sometimes don't
     understand."* The words now say it, and words are the part that can be
     rewritten without anybody noticing the picture stopped agreeing.

     ⭐ SO THIS IS THE GEOMETRIC HALF, and it is the claim the figure is FOR: at
     the frame the diagram rests on, the teammate is inside the zone and the puck
     is NOT. Nothing asserted that before — the 9-ft margin lived only in a
     comment, and a puck nudged onto the line would have drawn the opposite rule
     with every test still green.

     ⭐ EVERY NUMBER IS READ FROM THE DRAWING. The threshold is the lit line's own
     x, the zone's direction is where the net is, and the margin is required to
     be visible at the rendered size rather than merely positive: `dghot` is the
     line the figure lights, and a puck within a token's width of it reads as ON
     it, which is the misconception. */
  const svg = figures.offside.svg;
  const line = /<line class="dghot blue" x1="([\d.]+)"/.exec(svg);
  assert.ok(line, 'the offside figure no longer lights the blue line');
  const bx = +line[1];
  const netx = [...svg.matchAll(/class="mesh" d="M ([\d.]+) /g)].map(m => +m[1])
    .filter(x => Math.abs(x - bx) < 90);   // the net this figure is cropped onto
  assert.equal(netx.length, 1, `the offside crop holds ${netx.length} nets, so "the zone" is ambiguous`);
  const into = Math.sign(netx[0] - bx);    // which way is INTO the attacking zone

  // The resting frame is where the tokens are drawn; the animation returns to it.
  const carrier = /<g class="dgmove dgm-c">\s*<circle class="dgtok" cx="([\d.]+)"[^>]*\/>\s*<circle class="dgpuck" cx="([\d.]+)"/.exec(svg);
  assert.ok(carrier, 'the carrier and his puck are no longer one drawn group');
  const mate = /<g class="dgmove dgm-t">\s*<circle class="dgtok" cx="([\d.]+)"/.exec(svg);
  assert.ok(mate, 'the offside figure no longer draws the teammate who went too far');
  const r = +/<circle class="dgtok" cx="[\d.]+" cy="[\d.]+" r="([\d.]+)"/.exec(svg)[1];

  const [puck, teammate] = [+carrier[2], +mate[1]];
  assert.ok((teammate - bx) * into > 2 * r,
    `the teammate is at x=${teammate} against a blue line at ${bx} — he is not `
    + 'clearly inside the zone, so the figure does not show an offside');
  assert.ok((bx - puck) * into > 2 * r,
    `the PUCK is at x=${puck} against a blue line at ${bx} — it is on or over the `
    + 'line, so the figure draws a legal entry and calls it offside');
  // AND THE CARRIER IS BEHIND HIS OWN PUCK, or the group has come apart.
  assert.ok((puck - +carrier[1]) * into > 0,
    `the puck at x=${carrier[2]} is behind its carrier at x=${carrier[1]}`);
});

test('⭐ no badge or stamp is drawn on top of a net', () => {
  /* ⚠️ FOUND BY LOOKING AT THE EMPTY-NET FIGURE, where it mattered most: badge ②
     sat at x=195, INSIDE the net's body (189–193), and ① was against the crease.
     Between them the goal — the one thing that figure is about — was invisible.
     A numbered badge is a label ABOUT the drawing and must not cover the drawing.

     ⛔ GHOSTS ARE NOT INCLUDED, deliberately. A dashed goaltender in the crease
     is exactly where a goaltender stands, and it is how the empty-net figure
     records that he WAS there; forbidding it would be forbidding the truthful
     drawing. The claim is about annotation, not about play. */
  const netBox = gx => gx < 100
    ? { x0: gx - 4, x1: gx, y0: 36.5, y1: 48.5 }
    : { x0: gx, x1: gx + 4, y0: 36.5, y1: 48.5 };
  let checked = 0;
  for (const [id, fig] of Object.entries(figures)) {
    const nets = [...fig.svg.matchAll(/<path class="mesh" d="M ([\d.]+)/g)].map(m => netBox(+m[1]));
    assert.ok(nets.length, `the ${id} figure draws no net`);
    const badges = [...fig.svg.matchAll(
      /<g class="dgbadge"><circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"/g)]
      .map(m => ({ x: +m[1], y: +m[2], r: +m[3] }));
    for (const b of badges) {
      for (const n of nets) {
        const over = b.x + b.r > n.x0 && b.x - b.r < n.x1
                  && b.y + b.r > n.y0 && b.y - b.r < n.y1;
        assert.ok(!over,
          `the ${id} figure puts a badge at (${b.x}, ${b.y}) on top of the net at x=${n.x0}`);
        checked++;
      }
    }
  }
  assert.ok(checked >= 10, `only ${checked} badge/net pairs were checked`);
});

test('⭐ annotation is the same SIZE on every figure, whatever each one frames', () => {
  /* ⭐⭐ THE RINK IS GEOMETRY AND EVERY TOKEN IS ANNOTATION. Lines, spots, boards,
     nets and the slot region are real things and must scale with the crop —
     that is what makes the diagram and the replay one rink. A dot standing for a
     player is a legibility choice, and at a fixed size in RINK units it grows as
     the frame tightens: the slot figure's goaltender came out 8.8 FEET across,
     beside a net that is 6, on a crop 99 units wide. Invisible on the full sheet,
     obvious the moment one figure zoomed in.

     ⭐ SO THE CLAIM IS ABOUT PIXELS, AND IT IS DERIVED. Every figure renders the
     same width on a page, so a radius in rink units times (200 / viewBox width)
     is its apparent size. Those must agree across all four — which is a real
     comparison between independently authored figures, not a constant restated. */
  const apparent = (fig, re) => {
    const box = fig.viewBox.split(/\s+/).map(Number);
    const m = re.exec(fig.svg);
    return m ? +(+m[1] * (200 / box[2])).toFixed(2) : null;
  };
  /* ⛔ `keeper` IS NO LONGER ONE OF THE KINDS, and removing it is the honest move
     rather than the convenient one. Exactly one figure draws a goaltender now
     (see the biconditional above), and "every figure sizes him the same" is a
     comparison with one term -- it would pass forever without ever comparing
     anything, which is the vacuous-claim failure this file keeps catching. He is
     still sized through `tok`'s helper in `learn-figures.mjs`, so the rule
     applies to him; what is gone is the EVIDENCE, and a test may not pretend to
     evidence it does not have. If a second figure ever earns a goaltender, put
     the kind back. */
  const kinds = {
    badge: /<g class="dgbadge"><circle[^>]*r="([\d.]+)"/,
    token: /<circle class="dgtok"[^>]*r="([\d.]+)"/,
  };
  for (const [kind, re] of Object.entries(kinds)) {
    const sizes = Object.entries(figures)
      .map(([id, f]) => [id, apparent(f, re)]).filter(([, v]) => v != null);
    assert.ok(sizes.length >= 2, `only ${sizes.length} figure carries a ${kind}`);
    /* ⭐ THE NON-VACUITY CONDITION IS TWO DIFFERENT CROPS, not a headcount. Only
       two figures carry a plain player token, and that is fine — what would make
       this test empty is every figure carrying it at the SAME crop, where sizing
       in rink units and sizing in pixels are indistinguishable. */
    const crops = new Set(sizes.map(([id]) => +figures[id].viewBox.split(/\s+/)[2]));
    assert.ok(crops.size >= 2,
      `every figure carrying a ${kind} has the same crop (${[...crops]}) — the two `
      + 'sizing rules are indistinguishable here, so this proves nothing');
    const [, first] = sizes[0];
    for (const [id, v] of sizes) {
      assert.ok(Math.abs(v - first) < 0.05,
        `the ${kind} is ${v} apparent units on ${id} and ${first} on ${sizes[0][0]} — `
        + 'annotation is being sized in rink units, so it grows as a figure zooms in');
    }
  }
  // AND THE FIGURES MUST ACTUALLY DIFFER IN CROP, or "they all agree" is trivial.
  const widths = new Set(Object.values(figures).map(f => +f.viewBox.split(/\s+/)[2]));
  assert.ok(widths.size >= 2, `every figure has the same crop (${[...widths]}) — this proves nothing`);
});

test('⭐ a ringed spot is one the rink actually paints, and face-offs rings them ALL', () => {
  /* ⚠️ FOUND BY A MUTATION: deleting one of the nine rings survived the whole
     suite. The face-offs card's entire claim is "nine spots on the ice and the
     rule picks one", and nothing checked that the figure showed nine.

     ⭐ BUT THE TEST IS NOT `=== 9`. The nine are a MEASUREMENT living in
     `furniture` — 2,134 draws across 39 games land on those coordinates and on
     nothing else — so the expectation is READ FROM THE PAINT. A magic 9 here
     would be a constant that stops agreeing with the rink the day the league
     moves a dot, and it would say nothing about whether the rings are in the
     right PLACES.

     TWO CLAIMS, and the first is universal: a ring must sit on a painted spot in
     ANY figure — icing's restart dot and offside's are real spots too, and a
     ring on blank ice reads as "something happened at this arbitrary point",
     which is the exact sentence rinkart.js uses about why the spots are drawn. */
  const paint = furniture('', false);
  const spots = [...paint.matchAll(/<circle class="fdot(?: ctr)?" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${+m[1]},${+m[2]}`);
  assert.equal(spots.length, 9, `the rink paints ${spots.length} face-off spots, not nine`);

  for (const [id, fig] of Object.entries(figures)) {
    const rings = [...fig.svg.matchAll(/<circle class="dgspot" cx="([-\d.]+)" cy="([-\d.]+)"/g)]
      .map(m => `${+m[1]},${+m[2]}`);
    for (const r of rings) {
      assert.ok(spots.includes(r),
        `the ${id} figure rings (${r}), where the rink paints no face-off spot`);
    }
  }
  // AND THE FACE-OFF MAP RINGS EVERY ONE, because its subject is the whole set.
  const fo = [...figures.faceoffs.svg.matchAll(/<circle class="dgspot" cx="([-\d.]+)" cy="([-\d.]+)"/g)]
    .map(m => `${+m[1]},${+m[2]}`);
  assert.deepEqual([...fo].sort(), [...spots].sort(),
    'the face-off figure does not ring exactly the spots the rink paints');
});

test('⭐ icing does not crop, because the rule IS the length of the ice', () => {
  /* THE CROP FOLLOWS THE RULE, which is Kevin's ruling: "no preference for full
     rink, 1/2 rink or whatever, as long as the teaching surface is sufficient to
     clearly explain the topic at hand." For offside that means zooming in — the
     rule happens at one line and a crop makes it bigger. For icing it means the
     opposite: a hundred and twenty feet of travel IS the subject, and a crop
     would remove it.
     The cost is real and is stated rather than hidden: at 359px a rink unit is
     1.79px here against 2.92 on offside, so every token is 61% the size. That
     was looked at before it was accepted. */
  const box = figures.icing.viewBox.split(/\s+/).map(Number);
  assert.deepEqual(box, [0, 0, 200, 85],
    `icing is drawn at ${figures.icing.viewBox} — a crop of the one rule whose subject is the whole sheet`);
  // AND THE PAIR: if every figure were full-sheet this would be satisfied by a
  // builder that had lost the ability to crop at all.
  const off = figures.offside.viewBox.split(/\s+/).map(Number);
  assert.ok(off[0] > 0 && off[2] < 200,
    'offside is no longer cropped, so "icing does not crop" claims nothing');
});

test('⭐ a lit line borrows the colour of the line it explains', () => {
  /* ⭐ THE RULE app.js ALREADY APPLIES to the slot tint and the zone band:
     "each tint borrows the colour of the mark it explains, so the palette does
     not grow." Found by LOOKING: the first icing figure lit the CENTRE LINE and
     a GOAL LINE — both red — in blue, which to a novice reads as "blue line",
     the one thing icing is not about. No test could have seen it; nothing had
     ever claimed the highlight had a colour to get wrong.
     ⭐ AND IT IS DERIVED, NOT LISTED. The expectation comes from the RINK: the
     blue lines are at |x|=25 and everything else painted vertically is red, so
     the class a highlight carries is checked against where it actually sits. */
  const BLUE_X = [SX(25), SX(-25)].map(v => +v.toFixed(2));
  let checked = 0;
  for (const [id, fig] of Object.entries(figures)) {
    // THE FACE-OFF MAP LIGHTS NONE, and correctly: it is about nine SPOTS, and
    // no line on the rink is what selects them. `checked` is the non-vacuity half.
    const lit = [...fig.svg.matchAll(/<line class="dghot (\w+)" x1="([-\d.]+)"/g)];
    for (const [, cls, x] of lit) {
      const want = BLUE_X.includes(+x) ? 'blue' : 'red';
      assert.equal(cls, want,
        `the ${id} figure lights x=${x} in ${cls}; a line at that spot is ${want}`);
      checked++;
    }
  }
  assert.ok(checked >= 3, `only ${checked} lit lines across every figure`);
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
