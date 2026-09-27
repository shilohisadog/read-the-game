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
