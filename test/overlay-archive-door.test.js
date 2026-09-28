/**
 * `IS THAT A LOT?` — THE ARCHIVE DOOR OVER THE RINK.
 *
 * Kevin, 2026-09-25: *"It takes 3 or 4 mouse clicks to get to 'how we counted
 * this' from a replay-layer and it takes us away from the replay page."* And
 * 2026-09-26: *"I want both is that a lot and how we counted to overlay the
 * rink, same space, different overlays."*
 *
 * ⛔⛔⛔ THE DEFECT THIS FILE EXISTS FOR, AND I SHIPPED IT INTO THE TREE. The
 * panel was built against `printed.js` alone. Four of the seven layer doors land
 * on the OTHER kind of figure — one whose numerator and denominator are prose in
 * `derivation.js` — so opening the overlay on the Control layer put that layer's
 * name in the heading and drew an empty body. Every test passed. It was found by
 * opening the page in a browser and looking at it.
 *
 * ⭐⭐ THE ROOT CAUSE WAS A NOTE WRITTEN FROM THE DOORS' NAMES rather than from
 * what renders them: `memory/work-door-over-the-rink.md` said "the layer's `work`
 * sections, one to three", which is true and says nothing about there being two
 * renderers. So the check below is not "the overlay works"; it is the INVARIANT
 * whose violation produced the empty panel — every anchor a layer's door names
 * is answered by one of the two tables. That is checkable without a browser and
 * fails the day a seventh door is added to a table that does not exist yet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { printed } from '../src/lib/printed.js';
import { sitsIn } from '../src/lib/distribution.js';
import { leagueFigures } from '../src/lib/derivation.js';
import { boot, rich } from './helpers/page.js';

const RULES = JSON.parse(readFileSync(new URL('../data/layer-rules.json', import.meta.url), 'utf8'));
/**
 * The real published document, because this is a claim about what the ARCHIVE
 * answers — not about formatting. `data/measures.json` is a cache of what the
 * pipeline published, and using an invented one here would let every assertion
 * below pass against a shape the site never serves.
 */
const MEASURES = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));

/** The page as a reader meets it: a real game, and the rates the shell fetches. */
const page = () => boot(rich, MEASURES);

test('⛔⛔⛔ EVERY LAYER DOOR IS ANSWERED BY ONE OF THE TWO TABLES', () => {
  /* ⚠️ NOT CIRCULAR, AND THAT IS THE WHOLE VALUE OF IT. The left-hand side is
     `data/layer-rules.json`, which node wrote by importing the real layer
     descriptors; the right-hand side is the two tables resolved against the real
     published document. Neither is derived from the other, so they can disagree
     — and on 2026-09-26 they did, for four doors out of seven.
     MUTATION: drop `leagueFigures` from the union and this fires with the exact
     four anchors the overlay rendered nothing for. */
  const answered = new Set([
    ...printed(MEASURES).map(e => e.anchor),
    ...leagueFigures(MEASURES).map(r => r.anchor),
  ]);
  const orphans = [];
  let doors = 0;
  for (const l of RULES.layers) {
    for (const w of l.work) {
      doors++;
      if (!answered.has(w.anchor)) orphans.push(`${l.id} → ${w.anchor} (${w.label})`);
    }
  }
  /* ⛔ AND THE COUNT IS ASSERTED, because "no orphans" is also what an empty
     `RULES.layers` says. A check that passes when there is nothing to check is
     this project's most expensive habit. */
  assert.ok(doors >= 7, `only ${doors} layer doors found — the descriptors have shrunk`);
  assert.deepEqual(orphans, [], 'a layer door names a figure neither table can answer, so the '
    + 'overlay opens on that layer and draws nothing:\n  ' + orphans.join('\n  '));
});

test('⭐⭐ BOTH KINDS ARE REACHED, so a renderer cannot be dropped and go unnoticed', () => {
  /* The test above passes if one table answers everything — which is exactly the
     world the defect lived in, seen from the other side. The panel needs BOTH
     renderers, so both tables must be load-bearing for the doors.
     MUTATION: point every layer's `work` at a printed figure and this fires. */
  const printedAnchors = new Set(printed(MEASURES).map(e => e.anchor));
  const leagueAnchors = new Set(leagueFigures(MEASURES).map(r => r.anchor));
  const all = RULES.layers.flatMap(l => l.work.map(w => w.anchor));
  assert.ok(all.some(a => printedAnchors.has(a)),
    'no layer door lands on a published figure — `printedSection` is dead code');
  assert.ok(all.some(a => leagueAnchors.has(a)),
    'no layer door lands on a league row — `figureSection` is dead code in the overlay');
});

/* ------------------------------------------------------- THE PANEL'S BEHAVIOUR */

/** Turn a layer on through the one-of-N selector the page actually listens to. */
const pick = (a, id) => a.$$('#rg .pk').find(b => b.dataset.l === id).click();

/** Which sections the archive panel is currently showing.

    ⚠️ READ OFF `_kids`, WHICH IS THE HARNESS'S OWN MODEL OF CHILDREN, because
    `innerHTML` cannot answer this: the fake's `createElement` renders a tag with
    a fixed attribute list that does not include `id`. Asserting on innerHTML
    here would be asking a question the stand-in answers differently from the
    thing it stands in for — the defect `test/helpers/page.js` names twice in its
    own comments. */
const showing = a => (a.$('alotBody')._kids || []).map(n => n.id).filter(Boolean);

test('⛔⛔ ONE OWNER FOR THE OVERLAY SPACE — opening one door closes the other', () => {
  /* ⭐ KEVIN'S AUGUST RULING, KEPT BY STRUCTURE RATHER THAN BY EACH BUTTON
     MINDING THE OTHER: *"let's overlay it over the ice, make them mutually
     exclusive."* Two panels writing one `working` class is how the ice ends up
     hidden with nothing over it — the defect `setWork`'s own header records from
     the first time this had two ways to close.
     MUTATION: give `#alot` its own toggle that does not touch `#workPanel` and
     the second assertion fires with both panels open at once. */
  const a = page();
  pick(a, 'corsi');
  a.$('work').click();
  assert.equal(a.$('workPanel').hidden, false, 'the ledger did not open');
  assert.equal(a.$('alotPanel').hidden, true, 'the archive opened uninvited');

  a.$('alot').click();
  assert.equal(a.$('alotPanel').hidden, false, 'the archive did not open');
  assert.equal(a.$('workPanel').hidden, true, 'BOTH overlays are open in one space');
  assert.equal(a.$('rg').classList.contains('working'), true, 'the ice is showing under a panel');

  a.$('alot').click();
  assert.equal(a.$('alotPanel').hidden, true, 'the archive did not close');
  assert.equal(a.$('rg').classList.contains('working'), false,
    'the ice is still hidden with no panel over it');
});

test('⭐ each door says what pressing it does, and flips to say how to undo it', () => {
  /* The two labels are Kevin's and they name two different QUESTIONS rather than
     two phrasings of one — which is what `Show me the work` beside `How we
     counted this` would have been. A reader who cannot tell two adjacent buttons
     apart presses neither. */
  const a = page();
  pick(a, 'corsi');
  assert.equal(a.$('work').textContent, 'How we counted');
  assert.equal(a.$('alot').textContent, 'Is that a lot?');
  a.$('alot').click();
  assert.equal(a.$('alot').textContent, 'Hide');
  assert.equal(a.$('work').textContent, 'How we counted', 'the other door changed its offer');
  a.$('alotClose').click();
  assert.equal(a.$('alot').textContent, 'Is that a lot?', 'the door did not reset');
});

test('⛔ EVERY LAYER DRAWS SOMETHING — the empty panel, caught where it happened', () => {
  /* ⚠️ WHAT THIS HARNESS CAN SEE. It has no CSS and no layout, and its
     `createElement` renders a tag without its text — so this cannot assert what
     a reader READS. It can assert that sections were appended at all, which is
     precisely the half that was wrong: the heading rendered, the body did not.
     The words themselves are checked on the methods page, by the same renderer,
     in `test/methods.test.js`.
     MUTATION: render only the printed figures and this fires for corsi, blocked
     and whistle. */
  const a = page();
  const empty = [];
  for (const l of RULES.layers) {
    pick(a, l.id);
    if (!a.$('alotPanel').hidden) a.$('alot').click();   // close, so each press opens
    a.$('alot').click();
    const body = a.$('alotBody');
    if (!/<section/.test(String(body.innerHTML || ''))) empty.push(l.id);
    a.$('alot').click();
  }
  assert.deepEqual(empty, [], 'these layers open the archive door onto nothing: ' + empty.join(', '));
});

test('⛔⛔⛔ THE ARCHIVE PANEL FOLLOWS THE SELECTOR — Kevin’s own sequence', () => {
  /* ⛔ SHIPPED, AND HE FOUND IT FROM THE LIVE SITE. Kevin, 2026-09-27: *"I had
     clicked on zone starts first, hence zone starts in the panel. then I moved to
     attempts."* The page showed Attempts pressed, Attempts’ description in the
     sidebar, and ZONE STARTS’ derivation over the rink — numbers about a
     different layer from the counts on screen.

     ⭐⭐ AND THE RULE WAS ALREADY WRITTEN DOWN, ONE LINE AWAY. `syncPick` has
     carried it since August for the ledger: *"any other change redraws it against
     the layer that is now on."* I put a second panel in that space and did not
     add it to that line. A rule kept in one branch of a two-branch decision is a
     rule that has not been kept.

     ⚠️ REDRAWN, NOT CLOSED, which is a different claim and worth its own
     assertion: shutting the door on a reader who switched layers would be
     "correct" by a narrower reading and is not what the ledger does.
     MUTATION: drop `if(archOpen)renderAlot()` from `syncPick` and the section id
     stays `m-zoneStarts` while the chip says Attempts. */
  const a = page();
  pick(a, 'zonestart');
  a.$('alot').click();
  assert.deepEqual(showing(a), ['m-zoneStarts'], 'the archive did not draw the zone-start figure');

  pick(a, 'corsi');
  assert.equal(a.$('alotPanel').hidden, false, 'switching layers SHUT the door instead of redrawing it');
  assert.deepEqual(showing(a), ['m-attempts'],
    'the panel still explains the layer that is no longer on');

  /* ⛔ AND THE BASE VIEW CLOSES IT, because `Just events` has no work to show —
     the other half of the same branch, and the half that was right. */
  pick(a, 'none');
  assert.equal(a.$('alotPanel').hidden, true, 'the base view left a panel explaining nothing');
  assert.equal(a.$('rg').classList.contains('working'), false, 'the ice is hidden with no panel over it');
});

test('⭐ the open state is a variable, not a question asked of the DOM', () => {
  /* The ledger’s state is `workOpen`; the archive’s was read back off
     `$('alotPanel').hidden` — a SECOND statement of the same fact, living in the
     document, free to disagree with the owner the day either one moves. That is
     the argument `setOverlay`’s own header makes about the `working` class, and
     it was broken in the same commit that made it.
     MUTATION: toggle `hidden` anywhere but in `setOverlay` and the two diverge. */
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  assert.match(src, /\blet archOpen\b/, 'the archive panel has no owned open state');
  const reads = src.match(/\$\('alotPanel'\)\.hidden/g) || [];
  assert.equal(reads.length, 1,
    `\`alotPanel.hidden\` is touched ${reads.length} times; exactly one owner may write it`);
});

/* ------------------------------------ THE QUESTION ON THE BUTTON, ANSWERED */

test('⛔⛔⛔ THE PANEL ANSWERS `IS THAT A LOT?` BEFORE IT EXPLAINS ANYTHING', () => {
  /* Kevin, 2026-09-28: *"Is that a lot should definitely answer the question of
     'is that a lot', no? now when the stoppages layer is active and is that a lot
     is pressed, the first bit a viewer sees in the panel is 'how many penalties a
     team takes', which doesn't quite align."* Two faults in one: the panel never
     named tonight's number, and what it led with was a COMPONENT of the layer
     rather than the layer.
     MUTATION: append the lead instead of prepending it and the order assertion
     fires; drop it and the first assertion does. */
  const a = page();
  pick(a, 'whistle');
  a.$('alot').click();
  const kids = (a.$('alotBody')._kids || []);
  const classes = kids.map(n => n.className).filter(Boolean);
  assert.ok(classes.includes('walot'), 'the panel does not answer its own button at all');
  /* ⭐ THE ORDER IS THE CLAIM. `walot` must come before the first `.hmf`, because
     "which doesn't quite align" was about what a reader meets FIRST. */
  assert.ok(classes.indexOf('walot') < kids.findIndex(n => n.className === 'hmf'),
    'a component section is still the first thing in the panel');
});

test('⛔⛔ A PARTIAL COUNT IS NEVER RANKED AGAINST FINISHED GAMES', () => {
  /* The chip says `Stoppages 16` SO FAR and the population is of FINISHED games.
     Ranking one against the other is the "two numbers about different things
     wearing one label" defect this page has paid for twice — and printing the
     finished total mid-replay would spoil the game a reader is watching.
     ⭐ THE REFERENCE CLASS IS NOT WITHHELD WITH IT: what a finished night holds is
     always true and always said. Two different facts, two different guards.
     MUTATION: drop the `i>=EV.length-1` test and the mid-replay panel starts
     naming a final total. */
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const fn = src.slice(src.indexOf('function renderAlot('), src.indexOf('function cardsFor('));
  assert.match(fn, /atEnd\s*=\s*i>=EV\.length-1/,
    'the lead no longer waits for the horn before naming this game\u2019s figure');
  assert.match(fn, /evenOnly:false/,
    'the judged count is filtered while the population it is judged against is not');
});

test('⭐⭐ THE ANSWER IS DERIVED FROM THE PUBLISHED TABLE, never typed', () => {
  /* Kevin, 2026-09-28: *"we have all of the data (somewhere in the software),
     isn't there a way to programmatically (and automatically) extract the answer
     to 'is that a lot' and surface that answer?"* This is that, checked: every
     figure in the sentence is a walk of `perGame`, so a layer measured for the
     first time next spring gets an answer with no edit to the page.
     ⚠️ NOT CIRCULAR: the left side is the LAYER IDS the selector offers, the
     right is the keys the published document happens to carry. Neither is
     derived from the other, and today they disagree by exactly one. */
  const seasons = Object.keys(MEASURES.perGame || {});
  assert.ok(seasons.length, 'the published document carries no per-game distributions');
  const latest = seasons.sort().pop();
  const answered = Object.keys(MEASURES.perGame[latest])
    .filter(k => sitsIn(MEASURES.perGame[latest][k], null));
  const layers = RULES.layers.map(l => l.id);
  const unanswerable = layers.filter(l => !answered.includes(l));
  /* ⛔ AND THE GAP IS NAMED RATHER THAN TOLERATED SILENTLY. A layer with no
     per-game distribution published carries no lead — which is honest and is
     also a hole in the feature. This asserts the hole CANNOT GROW.
     ⚠️ IT READS THE CACHE, so it can only see what the last derive published.
     `zonestart` was fixed in `perGame` on 2026-09-28 and this test kept passing
     with the hole still in it until a derive republished `measures.json` — which
     is exactly why the CODE-level version lives in `test/measure.test.js`
     instead, where it goes red at commit time. Both are needed and neither is
     the other: this one is about the DOCUMENT the browser fetches. */
  const known = ['zonestart'];
  const grown = unanswerable.filter(l => !known.includes(l));
  assert.deepEqual(grown, [],
    'a layer the archive used to answer for has lost its distribution: ' + grown.join(', '));
  /* And every one it CAN answer for has the three things the sentence needs. */
  for (const k of answered) {
    const r = sitsIn(MEASURES.perGame[latest][k], null);
    assert.ok(r.noun, `${k} has no noun, so the sentence would print a lens id`);
    assert.ok(r.population, `${k} has no population, so the season cannot be named`);
    assert.ok(r.lo <= r.hi && r.min <= r.lo && r.hi <= r.max, `${k}'s quartiles are not inside its range`);
  }
});

/**
 * ⛔⛔⛔ THE PROSE IN THE OVERLAY DOES NOT POINT AT THINGS THE OVERLAY HIDES.
 *
 * THE DEFECT, 2026-09-28. The Zone starts section read *"It prices the blue-line
 * band"* and *"which is what the shaded band is drawn around"*. Both surfaces
 * that print it make those referents unavailable: `how-we-measure.html` has no
 * rink at all, and this overlay covers the one it has — measured on production,
 * `visibility:hidden` on both the band and the ice while those sentences were on
 * screen. Kevin read the card with the layer ON and concluded the shading had
 * been removed. ⭐ A reader whose referent is invisible does not conclude *I
 * cannot see it*; they conclude *it is not there*.
 *
 * ⚠️⚠️ THIS CHECK IS NARROWER THAN THE DEFECT, AND SAYS SO RATHER THAN DRESSING
 * IT UP. The general property — *a sentence must be readable without seeing the
 * surface* — is not decidable from a string. The two other phrases a keyword
 * sweep flags here are both fine (*"the shaded patch in front of the net"*
 * carries its own location; *"the figure on screen"* is the broadcast's, not
 * ours), so a regex tuned to fire on this instance and not those would be a
 * check announcing a class while testing an example — the failure mode this
 * project logs most often. This is a REGRESSION TEST for two sentences, by name.
 * The class is closed by a habit and not by this file: open the surface and read
 * it in the order a reader would, once per surface.
 */
test('⛔ the zone-starts prose names its subject instead of pointing at the ice', () => {
  /* MUTATION: put either phrase back into `PRINTED.zoneStarts` and this fires. */
  const e = printed(MEASURES).find(x => x.anchor === 'm-zoneStarts');
  assert.ok(e, 'the zone-starts figure is no longer published under that anchor');
  const prose = [e.why, e.caveat].join(' ');
  for (const dead of ['the blue-line band', 'shaded band', 'drawn around']) {
    assert.ok(!prose.includes(dead),
      `the zone-starts prose says "${dead}", which names something this panel is covering up`);
  }
  /* AND IT STILL SAYS THE TWO THINGS THE SENTENCES WERE FOR: what the figure
     prices, and the question it cannot answer. Removing the pointer must not
     remove the point — a caveat that lost its subject is worse than a vague one. */
  assert.match(e.why, /where a draw happens|place a face-off is taken/i,
    'the why no longer says what the figure prices');
  assert.match(e.caveat, /contest AT the blue line/,
    'the caveat no longer names the question this measurement cannot answer');
});

/**
 * ⛔⛔ AND THE CROSS-REFERENCE IS NOT THE FIRST THING A READER MEETS.
 *
 * `Where this appears:` led every section until 2026-09-28, so the first line in
 * the overlay over the rink was a list of OTHER pages — offered to somebody
 * standing on one of them who has just asked a question. Provenance is not an
 * answer. It now sits after the figure, its source, its point and its caveat.
 */
test('⛔ `Where this appears` sits at the foot of a section, not at its head', () => {
  /* MUTATION: move the `hmwhere` append back above `const box` in sections.js.
     ⚠️ THROUGH THE PAGE, NOT A STAND-IN. This is a claim about the order a
     reader meets things in the overlay, so it is read off the overlay. */
  const a = page();
  pick(a, 'zonestart');
  a.$('alot').click();
  const sec = (a.$('alotBody')._kids || []).find(n => n.id === 'm-zoneStarts');
  assert.ok(sec, 'the zone-starts section is not in the archive panel');
  const classes = (sec._kids || []).map(k => k.className || k.tagName);
  const where = classes.indexOf('hmwhere');
  assert.ok(where >= 0, 'the section stopped saying where the reader met this figure');
  for (const after of ['hmev', 'hmwhy', 'hmcav']) {
    const i = classes.indexOf(after);
    assert.ok(i >= 0 && i < where,
      `"${after}" is not above the cross-reference — a reader meets the other pages first`);
  }
});
