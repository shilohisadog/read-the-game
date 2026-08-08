/**
 * Does the app actually run?
 *
 * Every other test in this suite checks the modules or the text of the bundle.
 * None of them execute the app, and that gap shipped a regression: Phase 2
 * removed a variable the renderer still used, so `render()` threw ReferenceError
 * on every call. The script parsed. The modules were correct. All 43 tests
 * passed. The page was blank and the Play button did nothing, and the only
 * reason we found out is that Kevin opened it.
 *
 * A syntax check proves the script PARSES. This proves it RUNS.
 *
 * The DOM stub is deliberately dumb -- ids map to plain objects, and that is
 * enough, because the app's whole rendering strategy is assigning strings to
 * innerHTML/textContent. It is not a browser and does not pretend to be. What
 * it catches is the class of failure above: a reference that does not resolve,
 * a function that throws on first paint, an event handler wired to nothing.
 * Pixels remain Kevin's job; "does it execute at all" no longer is.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

/** Minimal DOM: same object every time for a given id, so state is inspectable.
 *  Listeners are recorded so a test can fire one -- otherwise every code path
 *  behind a button is unreachable, which is most of the app. */
function makeDom() {
  const nodes = new Map();
  const node = (id = '') => ({
    id, textContent: '', innerHTML: '', value: 0, max: 0, min: 0, hidden: false,
    style: {}, dataset: {}, onclick: null, oninput: null, _on: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener(ev, fn) { (this._on[ev] = this._on[ev] || []).push(fn); },
    click() { (this._on.click || []).forEach(f => f({})); if (this.onclick) this.onclick({}); },
    appendChild() {}, querySelectorAll: () => [],
  });
  // querySelectorAll must return real nodes for the selectors the app uses to
  // wire its pickers. Returning [] silently leaves every one of those buttons
  // unwired -- which is how the strength toggle would have shipped untested.
  const groups = {
    '#rg .sbtn': [{ s: 'all' }, { s: 'even' }],
    '#rg .fbtn': [{ f: 'mascot' }, { f: 'tabletop' }],
  };
  const made = {};
  for (const [sel, list] of Object.entries(groups)) {
    made[sel] = list.map(d => Object.assign(node(sel + JSON.stringify(d)), { dataset: d }));
    made[sel].forEach((n, k) => nodes.set(`${sel}[${k}]`, n));
  }
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, node(id));
      return nodes.get(id);
    },
    querySelectorAll: sel => made[sel] || [],
    createElement: () => node(),
    addEventListener() {},
  };
  return { document, nodes };
}

function run() {
  const { document, nodes } = makeDom();
  const noop = () => {};
  const fn = new Function(
    'document', 'addEventListener', 'setTimeout', 'clearTimeout',
    'requestAnimationFrame', 'matchMedia', 'console', script);
  fn(document, noop, noop, noop, noop, () => ({ matches: false }), console);
  return nodes;
}

test('the app executes without throwing', () => {
  assert.doesNotThrow(run, 'the bundle must run, not merely parse');
});

test('first paint puts the right numbers in the DOM', () => {
  // The app ends with set(EV.length-1) -- a full render at the end of the game.
  // Same numbers the golden fixture pins, read off the elements a viewer looks
  // at. String() because the app assigns numbers to textContent, and a real DOM
  // would coerce them.
  const n = run();
  assert.equal(String(n.get('cA').textContent), '80', 'MIN attempts counter');
  assert.equal(String(n.get('cH').textContent), '55', 'BUF attempts counter');
  assert.equal(String(n.get('aSc').textContent), '2', 'MIN score');
  assert.equal(String(n.get('hSc').textContent), '3', 'BUF score');
  assert.equal(String(n.get('pa').textContent), '59%', 'control share');
});

test('the scrubber is wired to the timeline', () => {
  const n = run();
  assert.equal(n.get('scrub').max, 268, 'scrubber spans the playable events');
});

test('turning on the Control layer renders the ledger, and it reconciles', () => {
  // Exercises the path behind the button, which is where renderWork lives and
  // where Phase 2's ledger is actually shown to anyone.
  const n = run();
  n.get('lyCorsi').click();   // add the Control layer
  n.get('work').click();      // then open "Show me the work"
  const w = String(n.get('workPanel').innerHTML);
  assert.ok(w.length > 200, 'the panel has content');
  assert.match(w, /whistle|not a play|period/i, 'the 51 non-plays appear with reasons');

  // The ledger must reconcile ON SCREEN, not merely in the reducer. Read the
  // numbers back out of the rendered panel and check they add up.
  //
  // The total is NOT 320. The panel shows the game "through" the last PLAYABLE
  // event, and both period-end and game-end sort after it. I asserted 320, then
  // 319, and was wrong both times -- so derive it from the data rather than
  // guessing, which is what I should have done first.
  const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
  const SKIP = new Set(['stoppage','period-start','period-end','game-end','delayed-penalty']);
  const lastPlayable = rich.events.reduce((acc, e, n) => SKIP.has(e.type) ? acc : n, -1);
  const expected = lastPlayable + 1;

  const counted = +w.match(/Counted <span class="n">(\d+)<\/span>/)[1];
  const notCounted = +w.match(/Not counted <span class="n">(\d+)<\/span>/)[1];
  const total = +w.match(/= <b>(\d+)<\/b> events/)[1];
  assert.equal(counted + notCounted, total, 'the panel\'s own arithmetic must close');
  assert.equal(total, expected, 'every event up to and including the last playable one');
  assert.equal(counted, 135, 'and the attempt count is the one we pin everywhere else');
});

test('the strength filter moves the numbers on screen, with the mode attached', () => {
  // The end-to-end proof of docs/strength-filter.md: all situations by default,
  // even-strength on demand, and the label travelling WITH the number so it
  // cannot be screenshotted away from its scope.
  const n = run();
  assert.equal(String(n.get('cA').textContent), '80', 'opens at all situations');
  assert.equal(String(n.get('mA').textContent), 'ALL SITUATIONS', 'and says so');

  n.get('#rg .sbtn[1]').click();          // "Even strength only"
  assert.equal(String(n.get('cA').textContent), '48', 'MIN drops to 48');
  assert.equal(String(n.get('cH').textContent), '38', 'BUF drops to 38');
  assert.equal(String(n.get('mA').textContent), 'EVEN STRENGTH', 'the label follows');

  n.get('#rg .sbtn[0]').click();          // back to "All situations"
  assert.equal(String(n.get('cA').textContent), '80', 'and it is reversible');
});

test('the ledger explains the filtered-out attempts, on screen', () => {
  const n = run();
  n.get('lyCorsi').click();
  n.get('work').click();
  n.get('#rg .sbtn[1]').click();
  const w = String(n.get('workPanel').innerHTML);
  assert.match(w, /even strength/i, 'the panel states the mode');
  assert.match(w, /power play/i, 'and names the power-play exclusions');
  assert.match(w, /pulled their goalie/i, 'and the empty-net ones');
  // The reconciliation must still close under the filter.
  const counted = +w.match(/Counted <span class="n">(\d+)<\/span>/)[1];
  const not = +w.match(/Not counted <span class="n">(\d+)<\/span>/)[1];
  const total = +w.match(/= <b>(\d+)<\/b> events/)[1];
  assert.equal(counted + not, total, 'nothing is lost by filtering');
});

test('the clock shows time remaining, not elapsed', () => {
  const n = run();
  // The last PLAYABLE event, not the period-end marker -- so a small remainder
  // rather than 00:00, and certainly not the 19:58 an elapsed clock would show.
  assert.equal(String(n.get('per').textContent), 'Period 3');
  assert.match(String(n.get('clk').textContent), /^00:0\d$/, 'counting down, near zero');
});
