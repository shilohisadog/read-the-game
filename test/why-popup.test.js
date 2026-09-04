/**
 * The why-popup states the rule the code actually applies.
 *
 * ⚠️⚠️ WRITTEN BECAUSE IT DID NOT, AND IT IS THE WORST SURFACE ON THE SITE TO BE
 * WRONG ON. Its own heading is "The rule, and you can check it". `isHighDanger`
 * has THREE clauses — within 33 ft of the net, within ±22 ft of centre, and in
 * front of the goal line. The popup named two and closed with "Both true here",
 * so a reader taking us up on the invitation and measuring a wrap-around got a
 * different answer than our own ice gives. The third clause had been added on
 * 2026-08-25, after Kevin looked at the drawn region: "I don't consider the slot
 * to be valid behind the net."
 *
 * The code was right the whole time and the words about it were wrong. No lint,
 * complexity, coverage or mutation score can see that, which is exactly why the
 * check has to be written by hand and aimed at the CLAIM.
 *
 * ⭐ THE CLAUSE COUNT IS COUNTED, NOT ASSUMED. Reading `isHighDanger` out of
 * `rink.js` and counting its `&&`-joined conditions means adding a fourth clause
 * to the rule turns this red until the sentence names it. Hard-coding "three"
 * would be a constant that drifts, and it would go stale in the direction that
 * caused the defect.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot } from './helpers/page.js';
import { whyMarkup } from '../src/lib/why.js';
import { HIGH_DANGER_FT, SLOT_HALF_WIDTH, NET_X, isHighDanger } from '../src/lib/rink.js';

/* ⭐ THE BUILT PAGE, NOT A SOURCE FILE — and moving the popup out of `app.js` is
   what taught this. These three tests read `src/app.js` by path, so extracting
   the markup into `src/lib/why.js` broke all of them at once while the page they
   are about had not changed by one byte. The claim here is *what a visitor
   reads*, and its subject is the artifact; a test pointed at whichever module
   currently holds the string is coupled to the filing, not to the claim, and
   goes red on every future decomposition for no reason. */
const APP = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const RINK = readFileSync(new URL('../src/lib/rink.js', import.meta.url), 'utf8');
const APP_SRC = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const EVENTS = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8')).events;

/** The body of `isHighDanger`, and the clauses it is made of. */
function clauses() {
  const body = /export function isHighDanger\([^)]*\)\s*\{([\s\S]*?)\n\}/.exec(RINK)[1];
  return body.replace(/^\s*return\s*/, '').split('&&').map(c => c.trim()).filter(Boolean);
}

test('⭐ the popup names every clause the slot rule applies', () => {
  const n = clauses().length;
  assert.equal(n, 3, `isHighDanger now has ${n} clauses — the sentence below must move with it`);

  const rule = /The rule, and you can check it:<\/b>([\s\S]*?)<\/div>/.exec(APP);
  assert.ok(rule, 'the why-popup no longer states a rule at all');
  const said = rule[1];

  // Each clause, in the words a reader gets rather than in code.
  assert.match(said, /from the net/, 'the distance clause is not stated');
  assert.match(said, /of the middle|of centre|of center/, 'the lateral clause is not stated');
  assert.match(said, /in front of the goal line|in front of the net/,
    'THE THIRD CLAUSE IS MISSING — a wrap-around checked against this sentence '
    + 'would come out as a slot shot, and the ice would disagree');

  /* ⚠️ AND THE COUNTING WORD HAS TO AGREE. "Both true here" was accurate about
     the sentence and false about the rule, and it is the phrase that made the
     omission read as complete rather than as an oversight. */
  assert.doesNotMatch(said, /\bBoth\b/i,
    'the sentence claims two clauses while the rule applies ' + n);
  assert.match(said, /all three/i, `the sentence must own its ${n} clauses out loud`);
});

test('⭐ the thresholds shown are the ones the rule uses, not copies of them', () => {
  /* The popup used to type `33` and `22` into its own prose while `rink.js`
     owned both — in a file that already resolves `attackDirection` from the same
     module. Interpolating the constants means a change to the rule reaches the
     sentence that explains it. */
  assert.match(APP, /≤ \$\{HIGH_DANGER_FT\} ft/,
    'the distance threshold is typed rather than taken from rink.js');
  assert.match(APP, /±\$\{SLOT_HALF_WIDTH\} ft/,
    'the lateral threshold is typed rather than taken from rink.js');
  assert.doesNotMatch(APP, /≤ 33 ft from the net/, 'a literal 33 is back in the rule text');
  assert.doesNotMatch(APP, /within ±22 ft of the middle/, 'a literal 22 is back in the rule text');
});

test('⭐ the popup computes distance with the same function the layer does', () => {
  // It re-implemented `Math.hypot(89 - x*dir, y)` beside a module that exports
  // exactly that. Two statements of one rule is the defect this repo removes
  // everywhere else; on a verification surface it is worse than elsewhere.
  assert.match(APP, /dist=distanceToNet\(e\.x,e\.y,_d\)/,
    'showWhy is deriving the distance itself again');
  assert.doesNotMatch(APP, /dist=Math\.hypot\(dLine,e\.y\)/, 'the hand-rolled distance is back');
});

test('⭐ and the rule the popup describes is the rule that admits the shot', () => {
  /* ⭐ THE PROPERTY, NOT THE PROSE. A shot behind the goal line but well inside
     the other two clauses is the case the missing sentence got wrong. If
     `isHighDanger` ever admits one, the popup's third clause is a lie about our
     own behaviour — so it is asserted here against the function rather than
     against the text. */
  const justBehind = NET_X + 3, y = 4;
  assert.equal(isHighDanger(justBehind, y, 1), false,
    'a shot from behind the goal line counts as the slot — the popup says it does not');
  assert.equal(isHighDanger(NET_X - 3, y, 1), true,
    'the mirrored shot in FRONT of the line does not count, so the check above proves nothing');

  // And the two thresholds still bound what they claim to bound.
  assert.equal(isHighDanger(NET_X - HIGH_DANGER_FT - 1, 0, 1), false, 'the distance clause is inert');
  assert.equal(isHighDanger(NET_X - 1, SLOT_HALF_WIDTH + 1, 1), false, 'the lateral clause is inert');
});

/**
 * ⭐ AND THE NET'S POSITION IS THE RULE'S POSITION.
 *
 * `app.js` drew both nets, both goaltenders and the shot line at a literal 89
 * while `rink.js` exported `NET_X = 89` — in a file that already resolved
 * `attackDirection` out of that module, so nothing was stopping it. A drawing
 * placed at a coordinate the rule does not own is a drawing that can quietly
 * stop agreeing with the mark it is drawn beside.
 *
 * ⛔ 42.5 IS DELIBERATELY NOT INCLUDED. It is the vertical centre of an SVG
 * viewBox, not a fact about a rink, and `rink.js` exports no such constant.
 * Sweeping it in would be a rule invented to make a check tidy.
 */
test('⭐ the net is drawn where rink.js says the net is', () => {
  assert.doesNotMatch(APP, /AX\(-?89,/, 'a net or goaltender is placed at a literal 89');
  assert.doesNotMatch(APP, /\?89:-89/, 'the shot line targets a literal 89');
  assert.match(APP, /AX\(-NET_X,/, 'the home net is not placed from NET_X');
  assert.match(APP, /AX\(NET_X,/, 'the away net is not placed from NET_X');
  assert.match(APP, /\?NET_X:-NET_X/, 'the shot line does not target NET_X');
});

/**
 * ⛔ THE ✕ NOW CLOSES THE POPUP, AND THE SEAM IT CREATED IS WHAT THIS GUARDS.
 *
 * It never closed anything: its markup carried `onclick="hideWhy()"`, which the
 * page's CSP blocks outright (a script hash authorises an element, never an
 * attribute) and which named a local of `boot` that global scope could not see.
 * `test/inline-handlers.test.js` is the general guard; this is the behaviour.
 *
 * ⭐ AND THE FIX PUT TWO HALVES IN TWO FILES. `src/lib/why.js` emits the button's
 * class; `src/app.js` delegates from the backdrop and asks for that class by
 * name. Two things that must agree, with a file boundary between them, which is
 * where every seam defect in this project has lived — so the class is READ OUT OF
 * THE LISTENER and required in the markup, rather than typed twice here.
 */
/**
 * A booted page with the popup open on the first shot that opens it.
 *
 * ⚠️ THE INDEX SPACE IS THE APP'S `EV`, NOT `data/rich.json`'s `events`, and the
 * first draft of these tests assumed they were the same list. They are not, and
 * the assumption failed as "the popup never opened" — which reads like a broken
 * feature rather than a broken test. So the frame is FOUND by clicking rather
 * than computed: walk until one opens, and say so loudly if none does.
 */
function openPopup() {
  const a = boot(null, null, '?layer=slot');
  for (let k = 0; k < 400; k++) {
    a.at(k, () => {});
    for (const fn of a.$('events')._on.click || []) fn({ target: { dataset: { i: String(k) } } });
    if (a.$('whyBk').classList.contains('on')) return a;
  }
  throw new assert.AssertionError({ message: 'no click anywhere in the game opened the why-popup' });
}

test('⭐⭐ the ✕ closes the popup, and the class it needs is the one the app listens for', () => {
  const listens = /classList\.contains\('([a-z]+)'\)/.exec(APP_SRC);
  assert.ok(listens, 'the backdrop listener no longer delegates by class — re-read this test');
  const cls = listens[1];

  const shot = EVENTS.find(e => e.x != null && isHighDanger(e.x, e.y, 1));
  const html = whyMarkup(shot, { dir: 1, AID: 1, AAB: 'AAA', HAB: 'HHH',
                                 AWAYCOL: '#000', HOMECOL: '#fff', R: {} });
  assert.match(html, new RegExp(`class="${cls}"`),
    `the popup's close button does not carry "${cls}", which is the only class the `
    + 'backdrop listener closes on — the button would be inert again');
  assert.doesNotMatch(html, /onclick=/, 'the close button went back to an inline handler');

  // The page itself: open the popup, press the ✕, and require it shut.
  const a = openPopup();

  const press = t => (a.$('whyBk')._on.click || []).forEach(fn => fn({ target: t }));
  press({ classList: { contains: c => c === cls } });
  assert.ok(!a.$('whyBk').classList.contains('on'), 'the ✕ did not close the popup');
});

test('⭐ …and a click on the card itself does NOT close it', () => {
  /* THE CONTROL. A listener that closes on every click would pass the test above
     and make the popup impossible to read — selecting the text would dismiss it. */
  const a = openPopup();

  (a.$('whyBk')._on.click || []).forEach(fn => fn({ target: { id: 'whyContent', classList: { contains: () => false } } }));
  assert.ok(a.$('whyBk').classList.contains('on'),
    'clicking inside the card closed it — reading the popup would dismiss it');
});
