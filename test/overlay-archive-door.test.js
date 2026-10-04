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

/* ⭐ THE RAIL, WHEREVER IT SITS UNDER THE ROW. It was a direct child of the `li`
   until 2026-10-04, when a `.sscale` wrapper took over stating the width — the
   rail and its ends row each carried `max-width:34ch` and `ch` resolves against
   the element's OWN font-size, so the smaller ends row came out 78% as wide and
   its right-hand number stopped short of the rail it labels (Kevin, from the live
   site). A test that hard-codes the nesting depth asserts the MARKUP where it
   means to assert the PICTURE, and would have to be edited again the next time
   anything wraps anything. */
function under(node, cls) {
  for (const k of node._kids || []) {
    if (k.className === cls) return k;
    const deeper = under(k, cls);
    if (deeper) return deeper;
  }
  return null;
}
/* ⭐ THE DOOR'S LABEL IS READ OFF THE SHIPPED MARKUP, NOT RETYPED HERE. It is
   `SUM_DOOR` in `app.js` and the button's pre-script text in
   `builders/build_main.py` — two copies of one string, which is two chances to
   drift — so this asserts the RENDER agrees with what the page ships rather than
   adding a third copy to disagree with both. Same arrangement as `PLAY_REST`. */
const SUM_DOOR = (/<button class="share sumdoor" id="sum"[^>]*>([^<]+)</.exec(app) || [])[1];

const railIn = li => under(li, 'strack');
const endsIn = li => under(li, 'sends');
import { readFileSync } from 'node:fs';
import { printed } from '../src/lib/printed.js';
import { sitsIn } from '../src/lib/distribution.js';
import { leagueFigures } from '../src/lib/derivation.js';
import { boot, rich, app, PAGE_CSS } from './helpers/page.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { danger } from '../src/lib/layers/danger.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { zonestart } from '../src/lib/layers/zonestart.js';

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
  assert.match(fn, /atEnd\s*=\s*at>=EV\.length-1/,
    'the lead no longer waits for the horn before naming this game\u2019s figure');
  /* ⛔⛔ AND WAITING FOR THE HORN IS USELESS IF THE PANEL NEVER HEARS IT ARRIVE.
     This guard passed for two days on a panel that was drawn once, when the door
     opened, and never again: scrub to the end with it open and it still read
     "the replay has not reached the final horn" beside a verdict card already
     judging the finished game. A predicate the page computes on a frame it never
     recomputes is a guard about nothing. Behaviour, not source text, is asserted
     for that in `the door hears the horn` below. */
  assert.match(fn, /alotDrawnAtEnd=at>=EV\.length-1/,
    'the panel no longer records which side of the horn it was drawn on');
  assert.match(fn, /evenOnly:false/,
    'the judged count is filtered while the population it is judged against is not');
});

test('⛔⛔ THE DOOR HEARS THE HORN — and it did not, for two days, on the live site', () => {
  /* Kevin, 2026-09-30, from a game page with the door open and the scrubber
     dragged to the right-hand end: the panel read *"The replay has not reached
     the final horn"* while the verdict card a screen below already said
     `94 shot attempts — fewer than 1337 of the 1394`. Two surfaces, one screen,
     disagreeing about whether the game was over.

     ⭐⭐ THE PREDICATE WAS NEVER WRONG, WHICH IS WHY NO SOURCE GREP COULD SEE IT.
     `renderAlot` ran when the door opened and when the layer changed, and nowhere
     else — so the correct test was computed against a frame the reader had left.
     Closing the door and reopening it at that same frame printed the right
     sentence, which is how staleness was told apart from a wrong rule.

     ⚠️ SO IT IS DRIVEN, NOT READ. The guard above this one asserts the source
     text; this one moves the playhead and reads what the panel then says. A
     check that inspects a computation cannot see that nobody ran it.

     MUTATION: delete the `archOpen && alotDrawnAtEnd !== ...` line in `render`
     and the third assertion fires with the stale sentence still in place. */
  const txt = n => n.innerHTML ? n.innerHTML.replace(/<[^>]+>/g, '')
    : (n._kids && n._kids.length) ? n._kids.map(txt).join(' ') : (n.textContent || '');
  const a = page();
  pick(a, 'whistle');
  a.$('alot').click();
  const lead = () => {
    const n = (a.$('alotBody')._kids || []).find(x => x.className === 'walot');
    return n ? txt(n) : '';
  };

  const before = lead();
  assert.match(before, /has not reached the final horn/i,
    'the panel does not withhold this game\u2019s figure mid-replay, so this test '
    + 'is not looking at the case it is about');

  const scrub = a.$('scrub');
  scrub.value = String(scrub.max);
  scrub.oninput({ target: { value: scrub.value } });

  const after = lead();
  assert.doesNotMatch(after, /has not reached the final horn/i,
    'the panel still says the replay has not reached the horn at the last frame: ' + after);
  assert.match(after, /This game finished with \d/,
    'the panel never names this game\u2019s own figure once the horn has sounded: ' + after);
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

/**
 * ⛔⛔ TWO POPULATIONS IN ONE PANEL, AND EACH SAYS WHICH FIGURES IT BELONGS TO.
 *
 * THE DEFECT, found by reading the live panel on 2026-09-28. The lead ends *"the
 * middle half of the 1,394 games we hold for the 2025-26 season"* and the very
 * next line read *"Counted over 4,192 games."* — a bare count, attached to
 * nothing, one line under a different count. The nearer reading binds it upward,
 * so the panel appeared to give two answers to how many games it had counted.
 *
 * ⭐⭐ BOTH NUMBERS ARE RIGHT AND THE DIFFERENCE IS LOAD-BEARING. The lead is
 * season-scoped because pooling seasons moves a game's rank by 12.5 places
 * against a random-draw p50 of about 5 — the measurement that put the season key
 * in `perGame` in the first place. The sections are archive-wide census figures.
 * ⛔ So the repair is NOT to make the numbers equal. Equal numbers here would
 * mean one of the two measurements had been widened to match the other's prose,
 * which is the tidy false version of this panel.
 *
 * ⚠️ WHAT THIS CAN AND CANNOT CHECK. It cannot decide whether a sentence reads
 * ambiguously — that took a person looking at it. It CAN hold the structural
 * property that made the ambiguity possible: two population figures in one panel
 * where at least one named no subject. Both must now name theirs.
 */
test('⛔ neither population figure in the panel is a bare count', () => {
  /* MUTATION: put `'Counted over ' + n + ' games.'` back in `renderAlot` and the
     second assertion fires — which is exactly what shipped. */
  /* ⚠️ THE LEAD IS BUILT WITH `innerHTML` AND THE SECTIONS WITH `appendChild`, so
     one sentence is read off the markup and the other off the harness's node
     model. Asking either the wrong way returns an empty string and this test
     would pass by finding nothing — the shape `_kids` was introduced for at the
     top of this file. Both are asserted non-empty below for that reason. */
  const txt = n => n.innerHTML ? n.innerHTML.replace(/<[^>]+>/g, '')
    : (n._kids && n._kids.length) ? n._kids.map(txt).join(' ') : (n.textContent || '');
  const a = page();
  pick(a, 'whistle');
  a.$('alot').click();
  const kids = a.$('alotBody')._kids || [];
  const lead = kids.find(n => n.className === 'walot');
  const pop = kids.find(n => n.className === 'wpop');
  assert.ok(lead, 'the panel drew no lead, so this test is not looking at the case it is about');
  assert.ok(pop, 'the panel drew no population line');

  const leadText = txt(lead), popText = txt(pop);
  assert.ok(leadText.length > 40 && popText.length > 40,
    `one of the two sentences read back empty (${leadText.length} / ${popText.length} chars) — `
    + 'this test would then pass by finding nothing');

  /* THE LEAD'S FIGURE IS WELDED TO ONE SEASON, in the sentence, where it is read. */
  assert.match(leadText, /season/i,
    'the lead states a population without saying it is one season');

  /* AND THE SECTIONS' FIGURE SAYS WHICH FIGURES IT COUNTS, so it cannot be read
     as a correction of the sentence above it. */
  assert.match(popText, /figures below/i,
    'the population line is a bare count — it names no subject, so a reader binds '
    + 'it to the sentence above: ' + JSON.stringify(popText));
  assert.match(popText, /every season/i,
    'the population line does not say it spans more than one season, which is the '
    + 'whole reason its number is larger than the lead’s');

  /* ⭐⭐ AND EACH ONE SAYS WHAT IT IS MEASURED UP TO — Kevin's ruling 8,
     2026-10-03. The wording fix made both sentences say `we have measured`,
     which is true; a reader still could not ask how CURRENT either was, and on
     a season being played that is the whole question. Two populations, two
     dates, because they are measured over different sets of games.
     MUTATION: drop `SPAN()` from either call in app.js and this names which. */
  const UPTO = /, up to \d{1,2} [A-Z][a-z]+ \d{4}/;
  assert.match(leadText, UPTO,
    'the lead names a population and never says when the measuring stopped: '
    + JSON.stringify(leadText));
  assert.match(popText, UPTO,
    'the population line names a population and never says when the measuring '
    + 'stopped: ' + JSON.stringify(popText));

  /* ⭐ AND THE TWO REALLY ARE DIFFERENT NUMBERS, which is what makes the naming
     load-bearing rather than decorative. If a future change made them equal this
     goes red and should: it would mean one measurement had been re-scoped.
     ⚠️ THE DATE CLAUSE IS REMOVED BEFORE COUNTING FIGURES, and asserted above
     rather than merely tolerated. A year is four digits and this scan reads any
     run of three or more, so when the dates arrived the population line started
     reporting TWO figures and this went red on correct code — which is the right
     way round, and the repair is to say what a POPULATION figure is rather than
     to loosen the count. */
  const num = t => (t.replace(UPTO, '').match(/([\d,]{3,})/g) || [])
    .map(x => +x.replace(/,/g, ''));
  const inLead = num(leadText), inPop = num(popText);
  assert.ok(inPop.length === 1,
    `the population line prints ${inPop.length} figures: ${JSON.stringify(popText)}`);
  assert.ok(inLead.length && !inLead.includes(inPop[0]),
    'the lead and the population line now print the same figure — one of the two '
    + 'measurements has been re-scoped, and the panel no longer states two populations');
});

/**
 * ⏭ THE OVERLAY USES THIS GAME'S OWN SEASON, FINISHED OR NOT — Kevin's ruling,
 * 2026-10-02: *"I say next Monday is when we start using this season's data
 * (albeit a terrible small sample size, but we'll be able to watch all of the
 * data fill in over time)."*
 *
 * ⚠️ THIS TEST ASSERTED THE OPPOSITE FOR ONE DAY, and the inversion is the point
 * of keeping its history. `finishedSeason` was added on 2026-10-01 because
 * `perGame` gains a key for the season in progress as soon as the archive holds
 * one game of it, and both readers asked only whether the key EXISTED — so the
 * overlay would have swapped a 1,394-game yardstick for an 8-game one with no
 * decision behind it. What was wrong was that nobody had chosen. Kevin has, and
 * he has chosen the thin population on purpose, so this now pins his answer.
 *
 * ⭐ THE PAIRED SHAPE SURVIVES THE INVERSION, because half of it is still live:
 * the ruling is about OUR OWN season, and `near` — reached only when this game's
 * season has no histogram at all — still borrows from a FINISHED one. Asserting
 * only that the thin season is used would pass on a panel that had simply stopped
 * filtering anything, so the second half offers an unfinished season as the
 * NEAREST candidate and requires it to be refused.
 *
 * ⚠️ AND THE `n` IS READ BACK OUT OF THE SENTENCE. A small population is
 * acceptable here only because the prose says how small it is; a panel that used
 * eight games without naming them would be the percentile this feature was built
 * as a fraction to avoid.
 */
test('the overlay places a game in its own season even while that season is being played', () => {
  const txt = n => n.innerHTML ? n.innerHTML.replace(/<[^>]+>/g, '')
    : (n._kids && n._kids.length) ? n._kids.map(txt).join(' ') : (n.textContent || '');
  const y = +String(rich.game.id).slice(0, 4);
  const say = (n, counts, start, season) => ({ what: 'made up', unit: 'games', noun: 'stoppages',
    population: `NHL regular season and playoffs, ${season}-${String(season + 1).slice(2)}`,
    n, start, min: start, max: start + counts.length - 1, counts });
  // A broad season, wide enough that this game's stoppage count sits inside it.
  const big = s_ => ({ whistle: say(1400, Array.from({ length: 100 }, () => 14), 0, s_) });
  // EIGHT GAMES — the real shape of the season in progress the morning Kevin ruled.
  const thin = s_ => ({ whistle: say(8, [1, 1, 1, 1, 1, 1, 1, 1], 0, s_) });

  const lead = a => {
    pick(a, 'whistle');
    a.$('alot').click();
    const n = (a.$('alotBody')._kids || []).find(x => x.className === 'walot');
    assert.ok(n, 'the panel drew no lead, so this test is not looking at its own case');
    return txt(n);
  };

  /* THE RULING: this game's season holds eight games and no later season exists,
     so it is the season being played — and it is the one used. */
  const playing = lead(boot(rich, { ...MEASURES,
    perGame: { [String(y - 1)]: big(y - 1), [String(y)]: thin(y) } }));
  assert.match(playing, /8 game/,
    'the overlay still refuses the season being played — Kevin ruled it IN on 2026-10-02');
  assert.doesNotMatch(playing, /1,400/,
    'the overlay reached past this game\'s own season for last season\'s population');
  assert.doesNotMatch(playing, /has not been measured yet/i,
    'the overlay disclaimed a season it is now using');

  /* ⛔ THE HALF THAT IS STILL A REFUSAL. This game's season has no histogram at
     all, so a yardstick is BORROWED — and the nearest candidate by distance is an
     unfinished season one year back. It must be passed over for the finished one
     two years back, or `near` has simply stopped filtering. */
  const borrowed = lead(boot(rich, { ...MEASURES,
    perGame: { [String(y - 2)]: big(y - 2), [String(y - 1)]: thin(y - 1) } }));
  assert.match(borrowed, /1,400/,
    'the overlay borrowed a yardstick from a season that is still being played');
  assert.match(borrowed, new RegExp(`${y - 2}-${String(y - 1).slice(2)}`),
    'the borrowed season is not named, so a reader cannot tell it is not their own');
  assert.match(borrowed, /has not been measured yet/i,
    'the overlay borrowed a season without saying this game\'s own was not measured');
});

/**
 * ⭐⭐⭐ THE SUMMARY OVERLAY — Kevin, 2026-10-01: *"The overlay should contain (or
 * be) the What this game was information, so it'll replace the card."*
 *
 * ⚠️ THE ASSERTIONS ARE DRIVEN, NOT READ. Three of the four facts here are about
 * WHEN something happens — on arrival at the horn, once, and not over a panel
 * somebody opened — and a check that inspected `renderSum` could not see that
 * nobody ran it. That is the lesson the door-hears-the-horn test above was
 * written for, one surface over.
 */
test('the summary opens at the horn, and returns unless the reader turns it down', () => {
  const a = page();
  const toEnd = () => { const s = a.$('scrub'); s.value = String(s.max);
                        s.oninput({ target: { value: s.value } }); };
  const back = k => { const s = a.$('scrub'); s.value = String(k);
                      s.oninput({ target: { value: s.value } }); };

  assert.equal(a.$('sumPanel').hidden, true, 'the summary was open at the opening faceoff');
  toEnd();
  assert.equal(a.$('sumPanel').hidden, false, 'the horn did not open the summary');

  /* ⭐ IT IS THE VERDICT CARD, NOT A SECOND COMPOSITION OF IT. The same element,
     so `sentenceFor`, the dot and the live deploy gate all keep their reader. */
  assert.ok(a.$('verdict').innerHTML.includes('What this game was'),
    'the summary panel does not carry the card');

  /* AND EVERY LENS IS NAMED, which is the whole of Kevin's "only one piece": the
     card nominates one and `mostUnusual` discards the rest. Counted off the
     SELECTOR, so a seventh layer cannot be added and silently skipped here. */
  const rows = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  assert.ok(rows, 'the summary drew no counts at all');
  const chips = a.$$('#rg .pk').filter(b => b.dataset.l && b.dataset.l !== 'none');
  assert.equal((rows._kids || []).length, chips.length,
    `the summary names ${(rows._kids || []).length} counts and the selector offers ${chips.length}`);

  /* ⛔ IT CLOSES ON THE WAY BACK, because every figure in it is of a FINISHED
     game and leaving it open over the second period is six final counts above a
     replay that has not produced them. */
  back(3);
  assert.equal(a.$('sumPanel').hidden, true,
    'the summary stayed open over a game the reader scrubbed back into');

  /* ⛔⛔ AND IT COMES BACK, BECAUSE THE PAGE CLOSED IT AND NOT THE READER. This
     assertion used to demand the opposite, and it PASSED — the flag was set on
     first arrival, so reaching the horn, stepping back and coming forward again
     left the summary gone for the life of the page. Kevin found it on 2025020990
     inside an hour, doing the ordinary thing. The test agreed with the code
     because it was written from the code: the contract in the comment above the
     flag said DISMISSED and the implementation said SHOWN ONCE, and this is the
     check that should have told them apart. */
  toEnd();
  assert.equal(a.$('sumPanel').hidden, false,
    'the summary did not return to a horn the reader came back to — the page '
    + 'closed it on the way out, which is not the reader turning it down');

  /* AND A REAL DISMISSAL IS HONOURED. Pressing the door to close it is the
     reader's decision, and the only thing that counts as one. */
  a.$('sum').click();
  assert.equal(a.$('sumPanel').hidden, true, 'the door did not close the summary');
  back(3);
  toEnd();
  assert.equal(a.$('sumPanel').hidden, true,
    'the summary reappeared at the horn after the reader had turned it down');
  a.$('sum').click();
  assert.equal(a.$('sumPanel').hidden, false, 'the button no longer opens the summary');
});

/**
 * ⛔⛔ AND IT NEVER TAKES A PANEL THE READER CHOSE. Written because the first
 * version DID: `Is that a lot?` open, scrub to the horn, and the summary replaced
 * the one door whose entire purpose is to say "this game finished with 94" at
 * exactly that moment. The door-hears-the-horn test above went red and named it.
 */
test('the horn does not snatch an overlay the reader already opened', () => {
  for (const [door, panel] of [['alot', 'alotPanel'], ['work', 'workPanel']]) {
    const a = page();
    a.$(door).click();
    assert.equal(a.$(panel).hidden, false, `${door} did not open, so this proves nothing`);
    const s = a.$('scrub'); s.value = String(s.max);
    s.oninput({ target: { value: s.value } });
    assert.equal(a.$(panel).hidden, false,
      `the horn closed the ${door} panel the reader had open`);
    assert.equal(a.$('sumPanel').hidden, true,
      `the summary opened on top of ${door}, and the two cannot both own the space`);
  }
});

/**
 * ⭐⭐⭐ THE DOOR IS REACHABLE FROM EVERY STATE, AND THE RESULT IS STILL PROTECTED.
 *
 * It was hidden until `.ended` as an anti-spoiler rule: the panel names the
 * winner, so the door was withheld until there was one. Kevin, 2026-10-04:
 * *"having a button available instead of 'forcing' the viewer to scrub to the end
 * of the game might be a reasonable thing to offer."* The policy did not change —
 * what is protected is the RESULT, `test/smoke.test.js` still forbids it from
 * first paint, and the door's label states what lies through it while revealing
 * none of it. The old rule conflated BEING TOLD with BEING ABLE TO ASK.
 *
 * ⛔⛔⛔ AND THEN THE DOOR WAS STILL UNREACHABLE, WHICH I REPORTED AS FIXED. It
 * lived in `.lxws` under the rink, and `#rg .lbox.empty .lxw{visibility:hidden}`
 * hides that row until a layer is chosen — so a reader on `Just events`, the
 * DEFAULT, had no route to the summary at all. I had measured `display` and a
 * bounding box and told Kevin it was visible: **verifying an ATTRIBUTE is not
 * verifying VISIBILITY**, three times logged in this repo and done again while
 * asserting the opposite. He found it from the live site and named the cause
 * himself: *"so a viewer doesn't have to enable a layer to get to it."*
 *
 * ⭐ SO IT MOVED TO THE SIDEBAR, beside `Copy a link to this moment` — ONE control,
 * not two, because two routes to one panel teach a reader that the two are
 * different places. What is checkable HERE is where it sits and that nothing in
 * the hiding rule's reach can touch it; `tools/browser/door-row.mjs` owns whether
 * it is actually painted, because the fake document has no CSS and this file can
 * only ever read a rule.
 */
test('the summary door sits where no layer can hide it, and tells nobody anything until pressed', () => {
  const CSS = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');
  /* ① THE HIDING RULE STILL EXISTS AND STILL CANNOT REACH IT. Asserting the rule
     is here matters as much as asserting the door is out of it: if `.lbox.empty`
     stopped hiding anything, this test would pass for a reason that has nothing
     to do with the door. */
  assert.match(CSS, /#rg \.lbox\.empty \.lxw\{visibility:hidden\}/,
    'the ledger row no longer hides itself without a layer, so the rule this door '
    + 'was moved out of has gone and the move needs re-examining');
  const row = /<div class="lxws">([\s\S]*?)<\/div>/.exec(app);
  assert.ok(row, 'the ledger button row has gone from the markup');
  assert.ok(!/id="sum"/.test(row[1]),
    'the summary door is back inside `.lxws`, which is hidden until a layer is chosen');
  assert.match(app, /<div class="sumrow"><button class="share sumdoor" id="sum"/,
    'the summary door is not in the sidebar row built for it');
  /* ② AND THE SIDEBAR ROW IS NOT ITSELF HIDDEN by anything but the preview, which
     is the one surface where the question has no answer. */
  for (const m of CSS.matchAll(/([^{}]*\.sumrow[^{}]*)\{([^}]*)\}/g))
    if (/display:none|visibility:hidden/.test(m[2]))
      assert.match(m[1], /#rg\.preview/,
        `.sumrow is hidden by "${m[1].trim()}", which is not the preview`);

  const a = page();
  /* ③ ITS LABEL REVEALS NOTHING — the one thing the old anti-spoiler rule really
     protected. */
  assert.equal(a.$('sum').textContent, SUM_DOOR);
  const goals = rich.events.filter(e => e.type === 'goal' && e.pt !== 'SO');
  const hs = goals.filter(e => e.own === rich.teams.home.id).length;
  const as = goals.length - hs;
  assert.ok(hs !== as, 'the fixture must have a decided game or this proves nothing');
  for (const tell of [`${as}–${hs}`, `${as}-${hs}`, `${hs}–${as}`, `${hs}-${as}`])
    assert.ok(!a.$('sum').textContent.includes(tell),
      `the door itself states the result (${tell})`);

  /* ④ AND IT IS CLOSED UNTIL PRESSED, mid-replay, with no layer chosen. */
  const s = a.$('scrub');
  s.oninput({ target: { value: '50' } });
  assert.equal(a.$('sumPanel').hidden, true, 'the summary is open without anyone asking');
  a.$('sum').onclick();
  assert.equal(a.$('sumPanel').hidden, false, 'pressing the door did not open the summary');
  assert.equal(a.$('sum').textContent, 'Hide');

  /* ⑤ AND MOVING ON TAKES IT AWAY — otherwise the replay runs behind a panel. The
     SAME rule in `render` that takes the auto-opened one off at the horn; a second
     statement of it would be free to drift. */
  s.oninput({ target: { value: '51' } });
  assert.equal(a.$('sumPanel').hidden, true,
    'the summary stayed open over a replay that moved on without it');
  assert.equal(a.$('sum').textContent, SUM_DOOR);
});

/**
 * ⭐⭐⭐ EACH ROW DRAWS ITS OWN SCALE — Kevin, 2026-10-01: *"the what this game was
 * card needs said line graphs beside their specific metric… right now it's just a
 * blob of text that says the same thing."*
 *
 * ⭐ THE DRAWING AND THE SENTENCE ARE ONE CLAIM, and that is what is asserted
 * here rather than the mere presence of an element. The band IS the middle half
 * the row's words name, so a row reading "inside the middle half" must put its
 * dot INSIDE its own band and a row reading "fewer than N of them" must put it
 * outside and to the left. A picture free to disagree with the sentence beside it
 * is the defect that stopped a deploy on 0c8dc6f, one surface over.
 */
test('⭐⭐⭐ every row draws a mark per club, on the class that club belongs to', () => {
  /* ⛔⛔⛔ KEVIN, 2026-10-04: *"now we collapse the metrics into totals for the
     game and that doesn't really help understand 'what this game was'… maybe
     compare each team's metrics."*

     ⭐ AND THE REFERENCE CLASS HAD TO MOVE WITH THE MARK. `perGame` is a
     distribution of GAME totals — "by both teams in one game" in its own words —
     so a club's own 63 attempts placed on it would be two quantities wearing one
     label, this file's oldest and most expensive defect. `perTeamGame` is the
     same six lenses counted per TEAM-GAME: twice the n, half the magnitude.

     ⛔ THE STOPPAGES ROW IS THE EXCEPTION AND IT IS A FACT, NOT A GAP. A stoppage
     names a rule and never a team, so it has no per-team form, no entry in
     `perTeamGame`, and stays a GAME row on the game class. Two scales that look
     alike and mean different populations is exactly what this panel must not do,
     so the two are asserted apart below. */
  const a = page();
  const s = a.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const rows = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  assert.ok(rows && (rows._kids || []).length, 'no rows drew at all');

  const chips = a.$$('#rg .pk').filter(c => c.dataset && c.dataset.l);
  assert.ok(chips.length >= 2, 'no lens chips were found, so the mapping is empty');
  const lensFor = label => {
    const c = chips.find(x => (x.textContent || '').trim().startsWith(label));
    return c && c.dataset.l;
  };
  const yr = String(rich.game.id).slice(0, 4);
  const byGame = MEASURES.perGame[yr] || MEASURES.perGame[Object.keys(MEASURES.perGame).sort().pop()];
  const byTeam = MEASURES.perTeamGame[yr]
    || MEASURES.perTeamGame[Object.keys(MEASURES.perTeamGame).sort().pop()];
  assert.ok(byTeam, 'measures.json publishes no per-team-game class at all');
  const quart = (dd, q) => { const need = dd.n * q; let seen = 0;
    for (let k = 0; k < dd.counts.length; k++) { seen += dd.counts[k];
      if (seen >= need) return dd.start + k; }
    return dd.max; };

  let teamRows = 0, gameRows = 0;
  for (const li of rows._kids) {
    const kids = li._kids || [];
    const track = railIn(li);
    const text = (kids[0] && kids[0].innerHTML) || '';
    if (!track) continue;
    const band = (track._kids || []).find(n => n.className === 'sband');
    const marks = (track._kids || []).filter(n => (n.className || '').startsWith('spt'));
    assert.ok(band && marks.length, 'a scale drew without both a middle half and a position');

    /* THE CLUBS AND THEIR COUNTS, READ OFF THE ROW. A team row prints a chip per
       club; the stoppages row prints a total and says it is the whole game. */
    const pairs = [...text.matchAll(/<span class="stm s([ah])">([A-Z]{2,3}) ([\d,]+)<\/span>/g)]
      .map(m => ({ cls: 's' + m[1], ab: m[2], count: +m[3].replace(/,/g, '') }));
    const label = (/^<b>([^<0-9]+?)\s*[\d,]*<\/b>/.exec(text) || [])[1];
    assert.ok(label, `could not read the lens out of the row: ${text}`);
    const lens = lensFor(label.trim());
    assert.ok(lens, `the row is labelled "${label}", which is no chip on this page`);

    const perTeam = pairs.length > 0;
    const dist = perTeam ? byTeam[lens] : byGame[lens];
    assert.ok(dist && dist.max > dist.min, `no published range for ${lens}`);

    if (perTeam) {
      teamRows++;
      /* ⛔ A MARK PER CLUB, AND ONE EACH. Two clubs, two marks — a row that drew
         one would be placing a club on a scale and leaving its opponent off the
         picture the row exists to make. */
      assert.equal(marks.length, pairs.length,
        `${lens} prints ${pairs.length} club counts and draws ${marks.length} marks`);
      assert.equal(pairs.length, 2, `${lens} names ${pairs.length} clubs`);
      assert.ok(byTeam[lens], `${lens} has clubs on the row and no per-team-game class`);
      /* ⭐ COLOUR NAMES WHOSE, so each mark carries its own club's class and the
         two differ. It used to encode inside-versus-outside, which with two marks
         on one rail leaves a reader unable to tell them apart. */
      assert.deepEqual(marks.map(m => m.className.split(/\s+/).pop()).sort(),
        pairs.map(p => p.cls).sort(),
        `${lens}'s marks are not one per club`);
    } else {
      gameRows++;
      assert.equal(marks.length, 1, 'the game-level row drew more than one mark');
      assert.match(marks[0].className, /snone/,
        'the row that belongs to no club wears a club colour');
      assert.match(text.replace(/<[^>]+>/g, ''), /never a team/,
        'the row placed against GAMES does not say it is the whole game, so its '
        + 'rail reads as the same population as the five above it');
      assert.ok(!byTeam[lens], `${lens} says it has no per-team form and ${lens} is in perTeamGame`);
    }

    /* ⛔⛔ EVERY POSITION COMPUTED INDEPENDENTLY, FROM THE PUBLISHED DOCUMENT.
       Comparing a drawing against its neighbour in the same drawing has no path
       to the expected value — a mutant pinning every mark to the band's left edge
       once passed that. The expectation is the archive's own min/max and the
       count printed in the row. */
    const pc = v => parseFloat(v);
    const want = c => Math.max(0, Math.min(100, ((c - dist.min) / (dist.max - dist.min)) * 100));
    const counts = perTeam ? pairs.map(p => p.count)
      : [+((/<b>[^<]*?([\d,]+)<\/b>/.exec(text) || [])[1] || '').replace(/,/g, '')];
    for (let k = 0; k < marks.length; k++) {
      const at = pc(marks[k].style.left);
      assert.ok(!Number.isNaN(at), `a mark was never positioned: ${marks[k].style.left}`);
      const near = counts.map(want).some(w => Math.abs(at - w) < 0.15);
      assert.ok(near, `${lens}: a mark sits at ${at}% and the row's counts `
        + `(${counts.join(', ')}) belong at ${counts.map(c => want(c).toFixed(1)).join('%, ')}% `
        + `on a ${dist.unit} scale of ${dist.min}–${dist.max}`);
      assert.ok(at >= 0 && at <= 100, `the scale left its own rail (${at}%)`);
    }

    /* AND THE BAND IS THE MIDDLE HALF OF THE SAME CLASS. */
    const lo = pc(band.style.left);
    const wantLo = ((quart(dist, 0.25) - dist.min) / (dist.max - dist.min)) * 100;
    assert.ok(Math.abs(lo - wantLo) < 0.15,
      `${lens}: the middle half starts at ${lo}% and p25 of its ${dist.unit} class `
      + `is at ${wantLo.toFixed(1)}%`);

    /* ⭐⭐ AND THE ENDS ARE NAMED, which is the repair the preview card's axis
       already carries: the row no longer ends on a sentence saying where the mark
       sat, so a scale whose ends nobody states is a picture a reader can only
       guess at. They come from the SAME class the mark was placed on — printing
       the game class's ends under a team row would be the population swap this
       whole test exists to forbid, drawn in small grey type. */
    const ends = endsIn(li);
    assert.ok(ends, `${lens} drew a scale with no ends`);
    assert.deepEqual((ends._kids || []).map(n => n.textContent),
      [dist.min.toLocaleString(), dist.max.toLocaleString()],
      `${lens}'s axis does not name the ends of the class its marks were placed on`);
  }
  /* ⛔ BOTH KINDS MUST HAVE DRAWN. All-team rows would mean the stoppages row had
     silently acquired a per-club split it cannot have; all-game rows would mean
     the whole change did nothing. */
  assert.ok(teamRows >= 4, `${teamRows} rows drew a mark per club`);
  assert.equal(gameRows, 1, `${gameRows} rows were placed against GAMES, not 1`);
});

test('⛔⛔⛔ every class the summary rows wear is styled by the summary rows ALONE', () => {
  /* ⛔⛔⛔ KEVIN, FROM THE LIVE SITE, 2026-10-04: *"something is amiss with the font
     size."* Every "WSH 61 · TBL 63" on the card rendered at scoreboard scale,
     because the team chip was given `class="sc"` and `#rg .sc` is THE SCOREBOARD'S
     SCORE — `font-size:1.8rem; font-weight:800`, the big 1 and 3 beside the club
     abbreviations. The new rule set no size of its own, so it inherited one from a
     surface it has nothing to do with.

     ⭐⭐ A TWO-LETTER CLASS NAME IN A SHARED STYLESHEET IS A COLLISION WAITING TO
     HAPPEN, and the tell was already on screen: `css-orphans.test.js` reported
     `.sa` and `.snone` as unproduced and said NOTHING about `.sc` — which meant
     `.sc` was already known to the page. I read that asymmetry as noise. A check
     that answers about four of five names is telling you something about the
     fifth.

     ⭐ THE RULE IS POSITIVE AND IT IS ABOUT OWNERSHIP, not about a list of banned
     names: a class worn inside `.srows` must be reachable only through `.srows`.
     That is checkable, it generalises to any surface, and it is exactly what was
     violated — the chip's appearance was decided by a rule that never mentions
     the card it was drawn on. */
  const a = page();
  const s = a.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const rows = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  assert.ok(rows, 'no rows drew at all');

  /* THE CLASSES THE PAGE REALLY PUT ON, read off the rendered rows rather than
     listed here — a list would go stale the day a row gains an element.
     ⛔⛔ AND `innerHTML` IS HARVESTED TOO, which the first version of this check did
     not do — so it ran green against the very collision it was written for. The
     team chips are built as an HTML STRING, and the fake document does not parse
     one into child nodes: walking `className` saw the rail, the band, the marks
     and the ends, and never the one element that was wrong. A check that cannot
     see the defect it was written for is the shape this repo pays for most. */
  const worn = new Set();
  const walk = n => {
    for (const c of String(n.className || '').split(/\s+/)) if (c) worn.add(c);
    for (const m of String(n.innerHTML || '').matchAll(/class="([^"]+)"/g))
      for (const c of m[1].split(/\s+/)) if (c) worn.add(c);
    for (const k of (n._kids || [])) walk(k);
  };
  for (const li of rows._kids) walk(li);
  worn.delete('srows');
  assert.ok(worn.size >= 6, `only ${worn.size} classes found on the rows: ${[...worn]}`);
  /* ⛔ AND THE CHIP MUST BE AMONG THEM, or the harvest above has quietly stopped
     reaching the element this whole test is about. */
  assert.ok(worn.has('stm') || worn.has('sc'),
    `the team chip's class is not among ${[...worn]} — the harvest missed it`);

  /* ⛔ COMMENTS STRIPPED. The stylesheet records this defect and quotes `#rg .sc`
     to do it, so a scan of raw text would find the collision inside the
     explanation of its own removal — the monitor-armed-against-itself shape, now
     six times in this repo. */
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rules = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map(m => m[1].trim());
  assert.ok(rules.length > 200, `only ${rules.length} CSS rules parsed`);

  const stolen = [];
  for (const c of worn) {
    for (const sel of rules) {
      if (!new RegExp(`\\.${c}(?![\\w-])`).test(sel)) continue;
      if (/\.srows\b/.test(sel)) continue;
      /* A rule that only ever reaches this class THROUGH one of the row's own
         classes is the row's rule by another name, so the containers count. */
      if (/\.(strack|sband|spt|stm|sends)\b/.test(sel)) continue;
      stolen.push(`.${c} is styled by "${sel}"`);
    }
  }
  assert.deepEqual(stolen, [],
    'a class the summary rows wear is dressed by a rule belonging to another '
    + 'surface, so its appearance is decided somewhere that never names this card:'
    + `\n  ${stolen.join('\n  ')}`);

  /* ⭐ AND THE CHIP SETS ITS OWN SIZE. The ownership rule above is the invariant;
     this is the belt its stylesheet comment promises — an element carrying a
     figure a reader reads should not leave its scale to be decided by whatever
     rule happens to reach it. */
  const chip = rules.find(sel => /\.srows\s+\.stm\b/.test(sel) && !/::/.test(sel));
  assert.ok(chip, 'the team chip has no rule of its own at all');
  const body = new RegExp(`${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`)
    .exec(css);
  assert.match(body[1], /font-size:/,
    'the team chip declares no font-size, so its scale is inherited from whatever '
    + 'rule reaches it — which is how it rendered at scoreboard size');
});

test('⛔⛔⛔ a document with no per-team class draws GAME rows, never a club on a game scale', () => {
  /* ⛔⛔⛔ THIS SHIPPED, AND IT WAS LIVE FOR TWENTY MINUTES ON 2026-10-04. The first
     version read `by && perTeam ? perTeam[id] : own[id]` — so when the published
     document had no `perTeamGame`, each club's own count was drawn on the GAME
     class: 61 attempts against a scale of 88–144 two-club totals, clamped to the
     left edge, under an axis labelled with the wrong population. The exact defect
     the whole feature was built to prevent, reintroduced by its own fallback.

     ⭐⭐ AND THE GAP IS STRUCTURAL, WHICH IS WHY THIS TEST EXISTS RATHER THAN A
     FIXED LINE. `data/measures.json` is a build input committed WITH the code; the
     shell FETCHES the published document from the data origin, which the nightly
     rewrites hours later. Every new field is therefore absent on the live site for
     one night while present in every local test and every browser probe — so a
     fallback that degrades to a different population is invisible in exactly the
     place it is wrong. The only way to see it is to ask the page what it does
     without the field, which is what this does.

     ⭐ THE DEGRADED FORM IS THE OLD CARD: the game's total on the game class. A row
     that cannot say what each club did says what the game did. */
  const old = JSON.parse(JSON.stringify(MEASURES));
  delete old.perTeamGame;
  const a = boot(rich, old);
  const s = a.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const rows = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  assert.ok(rows && (rows._kids || []).length, 'no rows drew at all');

  const chips = a.$$('#rg .pk').filter(c => c.dataset && c.dataset.l);
  const lensFor = label => {
    const c = chips.find(x => (x.textContent || '').trim().startsWith(label));
    return c && c.dataset.l;
  };
  const byGame = MEASURES.perGame[String(rich.game.id).slice(0, 4)]
    || MEASURES.perGame[Object.keys(MEASURES.perGame).sort().pop()];

  let drew = 0;
  for (const li of rows._kids) {
    const kids = li._kids || [];
    const text = (kids[0] && kids[0].innerHTML) || '';
    /* ① NOT ONE ROW SPLITS. A club chip anywhere means a club count is on screen
       with no class of its own to be placed against. */
    assert.ok(!/class="stm s[ah]"/.test(text),
      `a row still names the clubs with no per-team class published: ${text}`);
    const track = railIn(li);
    if (!track) continue;
    drew++;
    const marks = (track._kids || []).filter(n => (n.className || '').startsWith('spt'));
    assert.equal(marks.length, 1, 'a game row drew more than one mark');
    assert.match(marks[0].className, /snone/,
      'a mark wears a club colour on a row that names no club');

    /* ② AND THE MARK IS THE GAME'S OWN COUNT ON THE GAME CLASS — checked against
       the published histogram, not against the row's neighbour. */
    const label = (/^<b>([^<0-9]+?)\s*[\d,]*<\/b>/.exec(text) || [])[1];
    const lens = lensFor((label || '').trim());
    const count = +((/<b>[^<]*?([\d,]+)<\/b>/.exec(text) || [])[1] || '').replace(/,/g, '');
    const dist = byGame[lens];
    assert.ok(dist && dist.max > dist.min, `no published game range for ${lens}`);
    const want = Math.max(0, Math.min(100, ((count - dist.min) / (dist.max - dist.min)) * 100));
    assert.ok(Math.abs(parseFloat(marks[0].style.left) - want) < 0.15,
      `${lens} ${count} belongs at ${want.toFixed(1)}% of its GAME class `
      + `${dist.min}–${dist.max} and was drawn at ${marks[0].style.left}`);
    const ends = endsIn(li);
    assert.deepEqual((ends._kids || []).map(n => n.textContent),
      [dist.min.toLocaleString(), dist.max.toLocaleString()],
      `${lens}'s axis names the ends of a class its mark was not placed on`);
  }
  assert.ok(drew >= 5, `only ${drew} rows drew a scale without the per-team class`);
});

test('⛔ the clubs\u2019 counts are the lens\u2019s own, and only ONE lens may fail to add up', () => {
  /* ⭐⭐ THE SECOND PATH. Above, the row is checked against the published
     distribution; here it is checked against the REDUCERS, which is where the
     numbers came from — so "the card prints what the layers counted" is asserted
     without either side being derived from the other.

     ⭐⭐⭐ AND THE SUM IS MEASURED, NOT ASSUMED. I told Kevin that two of the five
     would fail to add up to their game total — blocks credited to neither club,
     and draws the feed placed nowhere. Over all 4,226 games in `measures.json`
     the second never happens: Control, the slot, Goaltending and Zone starts each
     sum EXACTLY, in every season, and only Blocked carries a residual (7.3% of
     2026-27, 7.5/8.8/8.8% of the three before it) — the teammate blocks the layer
     credits to nobody and says so. So the rule is exact for four and bounded for
     one, which is a far stronger check than "they need not add up". */
  const a = page();
  const s = a.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const rows = (a.$('sumBody')._kids || []).find(n => n.className === 'srows');
  const CTX = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id,
                homeAb: rich.teams.home.ab, awayAb: rich.teams.away.ab, evenOnly: false };
  const LENS = { corsi, slot: danger, blocked, goaltending, whistle, zonestart };
  const chips = a.$$('#rg .pk').filter(c => c.dataset && c.dataset.l);
  const lensFor = label => {
    const c = chips.find(x => (x.textContent || '').trim().startsWith(label));
    return c && c.dataset.l;
  };
  let checked = 0, residuals = [];
  for (const li of rows._kids) {
    const text = ((li._kids || [])[0] || {}).innerHTML || '';
    const pairs = [...text.matchAll(/<span class="stm s[ah]">([A-Z]{2,3}) ([\d,]+)<\/span>/g)]
      .map(m => ({ ab: m[1], count: +m[2].replace(/,/g, '') }));
    if (!pairs.length) continue;
    const label = (/^<b>([^<0-9]+?)\s*[\d,]*<\/b>/.exec(text) || [])[1];
    const id = lensFor((label || '').trim());
    const total = LENS[id].reduce(rich.events, CTX).counted.length;
    const sum = pairs.reduce((n, p) => n + p.count, 0);
    assert.ok(sum > 0, `${id} printed two zeroes`);
    assert.ok(sum <= total, `${id}: the clubs total ${sum} out of a lens count of ${total}`);
    if (sum !== total) residuals.push(id);
    checked++;
  }
  assert.ok(checked >= 4, `only ${checked} club rows were reconciled`);
  /* ⛔ AND THE RESIDUAL BELONGS TO EXACTLY ONE LENS. A new one appearing means a
     layer started dropping events on the floor; this one disappearing means
     teammate blocks are being credited to a club, which is the attribution every
     broadcast gets right and this project once got wrong. */
  assert.deepEqual(residuals, ['blocked'],
    `the lenses whose clubs do not sum to their own count are ${residuals.join(', ')}`);
});

/**
 * ⭐ THE WAY TO THE LEAGUE'S VIDEO IS IN THE PANEL — Kevin: *"when the what this
 * game was card is surfaced, we no longer have a window to the game highlight
 * page, we have to scroll down and click the (non-obvious) 'External video clip'
 * area."*
 *
 * ⛔ AND IT IS A BUTTON, NOT AN EMBED. `drawClip`'s bargain is that the iframe,
 * its thirteen third-party hosts and the advertisement in front of the video are
 * reached only by someone who pressed; a player mounted in here would spend that
 * on every finished game. So what is asserted is that pressing OPENS THE EXISTING
 * BOX — one box, one offer — and that nothing was built beside it.
 */
test('the summary offers the league’s recap, and only when there is one', () => {
  const withRecap = boot({ ...rich, recap: 6405931176112 }, MEASURES);
  let s = withRecap.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  const btn = (withRecap.$('sumBody')._kids || []).find(n => n.className === 'srecap');
  assert.ok(btn, 'a game carrying a recap offers no way to it from the summary');
  assert.match(btn.textContent, /recap of this game/i, 'the button does not say what it opens');

  assert.equal(withRecap.$('clipbox').open, false, 'the clip box was open before anyone pressed');
  btn.onclick();
  assert.equal(withRecap.$('clipbox').open, true, 'the button did not open the clip box');
  assert.equal(withRecap.$('clipbox').hidden, false, 'the box opened while still hidden');

  /* ⚠️ AND A GAME ARCHIVED BEFORE THE FEED EXISTED OFFERS NOTHING, rather than a
     button that opens an empty player. Most of the archive is in this state until
     the recap backfill runs. */
  const without = boot({ ...rich, recap: undefined }, MEASURES);
  s = without.$('scrub'); s.value = String(s.max);
  s.oninput({ target: { value: s.value } });
  assert.ok(!(without.$('sumBody')._kids || []).some(n => n.className === 'srecap'),
    'a game with no recap still offered one');
});

/* ═══════════════════════════════════════════════════════════════════════════
   ⛔⛔⛔ A MEASUREMENT COUNT IS NOT WHAT THE ARCHIVE HOLDS — 2026-10-03.

   Kevin, from the live site on the Saturday after the Capitals' opener: *"Since
   we hold 21 games, we certainly shouldn't say '8 games we hold'."*

   THE DEFECT. `sitsIn` returns `of: d.n` — how many games the MEASUREMENT was
   built from. Two panels printed it as *"the N games **we hold** for that
   season"*, which is a claim about the ARCHIVE. Two different quantities wearing
   one label, and this project has paid for that shape before.

   ⭐ WHY IT SURVIVED FROM THE DAY IT WAS WRITTEN. The two numbers are EQUAL for
   every reference class the code had ever been pointed at, because a finished
   season's measurement is complete. Measured against the live archive:

       2023   archive 1,400   perGame 1,400
       2024   archive 1,398   perGame 1,398
       2025   archive 1,394   perGame 1,394
       2026   archive    21   perGame     8     ⛔

   On 2026-10-02 the season being played became a reference class. `measures.json`
   is rewritten weekly by `derive.yml` and the archive grows nightly, so from the
   first night onward the label was false and stayed false until Monday.

   ⛔⛔ AND NO TEST COULD HAVE CAUGHT IT, which is the part worth fixing properly.
   Every fixture in this repo builds its distributions FROM its fixture games, so
   `n` is the fixture count by construction — held and measured are the same
   number in every test that exists. **A mislabel between two quantities is
   invisible while every fixture makes them equal.** The fixture below makes them
   differ on purpose, which is the case that was missing rather than the assertion.
   ═══════════════════════════════════════════════════════════════════════════ */

/** A distribution over `n` games, deliberately fewer than the archive would hold. */
const measuredOver = (n, noun) => ({ what: 'made up', unit: 'games', noun,
  population: 'NHL regular season and playoffs, 2026-27',
  n, start: 0, min: 0, max: 1, counts: [Math.ceil(n / 2), Math.floor(n / 2)] });

/**
 * ⚠️ CHILDREN FIRST, THEN `innerHTML`. The first draft of this read `innerHTML`
 * when it was truthy — and the panel hosts carry a non-empty `innerHTML` AND
 * appended children, so it returned 42 characters of wrapper and reported *"the
 * panel never stated its population"* about a panel that had. A reader that can
 * return the wrong half of a node is a test that fails for the wrong reason, which
 * is a slower version of one that passes for the wrong reason.
 */
const panelText = (a, which) => {
  const walk = n => (n._kids && n._kids.length) ? n._kids.map(walk).join(' ')
    : String(n.innerHTML || n.textContent || '').replace(/<[^>]+>/g, '');
  return walk(a.$(which));
};

test('⛔⛔⛔ neither panel claims the ARCHIVE holds what the MEASUREMENT counted', () => {
  const y = String(rich.game.id).slice(0, 4);
  const LENSES = { corsi: 'shot attempts', slot: 'shots from the slot',
                   blocked: 'blocked shots', goaltending: 'shots the goaltenders faced',
                   whistle: 'stoppages', zonestart: 'face-offs' };
  /* EIGHT — the real shape of the morning Kevin found this, against an archive of
     21. The page cannot see the archive at all, which is exactly why it may not
     make a claim about it: the replay reads `measures.json` and its own extract,
     and `catalog.json` only to choose which game to open. */
  const thin = Object.fromEntries(Object.entries(LENSES).map(([k, n]) => [k, measuredOver(8, n)]));
  const a = boot(rich, { ...MEASURES, perGame: { [y]: thin } });
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });

  pick(a, 'corsi');
  a.$('alot').click();
  const alot = panelText(a, 'alotBody');
  a.$('alot').click();
  a.$('sum').click();
  const sum = panelText(a, 'sumBody');

  /* ⭐⭐ THE RULE IS POSITIVE, NOT A BANNED-WORD LIST, and the fourth instance is
     why. A first draft asserted only `doesNotMatch(/we hold/i)` and it caught the
     figures block by LUCK — that sentence read *"all 4,200 games in the archive"*
     and happened to carry "we hold" nine words later. A sentence saying "4,200
     games in the archive" alone would have passed a ban on the wrong phrase.
     So: EVERY population figure the panel prints must be labelled as a
     measurement within the clause that carries it. `whistle.js`'s own header
     makes the same argument about copy — a blacklist over an open vocabulary
     reads as "the copy was checked" when it has not been. */
  const POPULATIONS = [
    ['8', 'this season\u2019s reference class, from perGame'],
    [MEASURES.measured.toLocaleString(), 'the archive-wide census figure, from measures.json'],
  ];
  for (const [where, said] of [['Is that a lot?', alot], [SUM_DOOR, sum]]) {
    assert.ok(/\b8\b/.test(said), `${where}: the panel never stated its population, so this test saw nothing`);
    for (const [fig, what] of POPULATIONS) {
      /* Only judge a figure the panel actually prints — the summary carries the
         reference class and not the census block. */
      const at = said.indexOf(fig);
      if (at < 0) continue;
      const clause = said.slice(at, at + 60);
      assert.match(clause, /we have measured/,
        `${where}: "${fig}" (${what}) is printed without being called a measurement — the page `
        + `reads measures.json and cannot see the archive, so it may not describe one as the `
        + `other. Got: …${clause}…`);
    }
    assert.doesNotMatch(said, /we hold/i,
      `${where} claims the archive HOLDS something. Two quantities, one label — the shape that `
      + `was invisible while every finished season made them equal. Got: ${said.slice(0, 200)}`);
  }
});

/**
 * ⭐ AND THE PAIRED HALF, because "never say we hold" is satisfied forever by a
 * panel that says nothing at all. A FINISHED season — where held and measured
 * really are equal — must still print its population, in the same words. The fix
 * was a wording change and it must not have become a silence.
 */
test('⭐ a finished season still names its population, in the same words', () => {
  const y = String(rich.game.id).slice(0, 4);
  const big = Object.fromEntries(['corsi', 'slot', 'blocked', 'goaltending', 'whistle', 'zonestart']
    .map(k => [k, measuredOver(1394, 'shot attempts')]));
  const a = boot(rich, { ...MEASURES, perGame: { [y]: big, [String(+y + 1)]: big } });
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'corsi');
  a.$('alot').click();
  const said = panelText(a, 'alotBody');
  assert.match(said, /1,394 games we have measured/,
    'a finished season lost its population line, so the wording fix turned into a silence');
  assert.doesNotMatch(said, /we hold/i, 'the archive claim came back on the finished-season path');
});
