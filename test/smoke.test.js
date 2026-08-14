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
import { corsi } from '../src/lib/layers/corsi.js';

/** The feed, for computing what the counter OUGHT to say at any point. */
const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));

const html = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

/** Minimal DOM: same object every time for a given id, so state is inspectable.
 *  Listeners are recorded so a test can fire one -- otherwise every code path
 *  behind a button is unreachable, which is most of the app. */
function makeDom() {
  const nodes = new Map();
  const node = (id = '') => {
    const n = {
    id, textContent: '', innerHTML: '', value: 0, max: 0, min: 0, hidden: false,
    // setProperty because the app paints the two teams' real colours onto #rg as
    // custom properties at boot. Recorded rather than ignored, so a test can read
    // back WHICH colour was set.
    style: { _v: {}, setProperty(k, v) { this._v[k] = v; },
             getPropertyValue(k) { return this._v[k] || ''; } },
    dataset: {}, onclick: null, oninput: null, _on: {}, _cls: new Set(),
    // A REAL class list, not a no-op. The stubbed version accepted every call
    // and answered `false` to every question, so any behaviour the app expresses
    // by toggling a class was untestable and looked fine -- the same shape as
    // querySelectorAll returning [] and leaving every picker unwired.
    classList: {
      add(c) { this._o._cls.add(c); },
      remove(c) { this._o._cls.delete(c); },
      toggle(c, on) { const s = this._o._cls; const want = on === undefined ? !s.has(c) : on;
                      want ? s.add(c) : s.delete(c); return want; },
      contains(c) { return this._o._cls.has(c); },
    },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener(ev, fn) { (this._on[ev] = this._on[ev] || []).push(fn); },
    click() { (this._on.click || []).forEach(f => f({})); if (this.onclick) this.onclick({}); },
    appendChild() {}, querySelectorAll: () => [],
    };
    n.classList._o = n;   // the class list needs a handle on the node it belongs to
    return n;
  };
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

/**
 * Drive the app to the final event, the way a viewer who watched it would.
 *
 * The page now BOOTS AT THE OPENING FACEOFF rather than the final whistle
 * (Kevin: defaulting to the end spoils the surprise), so first paint is
 * legitimately all zeros. The golden numbers below are still the point of this
 * file, so they are asserted after a full render at the END — which is the same
 * claim the old test made, reached deliberately instead of by accident of where
 * the app happened to start.
 */
function toEnd(nodes) {
  const scrub = nodes.el('scrub');
  scrub.value = String(scrub.max);
  scrub.oninput({ target: { value: scrub.value } });
  return nodes;
}

function run() {
  const { document, nodes } = makeDom();
  const noop = () => {};
  const fn = new Function(
    'document', 'addEventListener', 'setTimeout', 'clearTimeout',
    'requestAnimationFrame', 'matchMedia', 'console', script);
  fn(document, noop, noop, noop, noop, () => ({ matches: false }), console);
  // `nodes` only holds ids the app has already asked for. Tests that drive the
  // app need to reach elements it touches lazily -- #rg is only looked up when a
  // layer is toggled -- so hand back the accessor too, not just the map.
  nodes.el = id => document.getElementById(id);
  return nodes;
}

test('the app executes without throwing', () => {
  assert.doesNotThrow(run, 'the bundle must run, not merely parse');
});

test('first paint is the OPENING faceoff, not the final score', () => {
  // The page used to open on the last event, so the final score and the finished
  // counters were on screen before a viewer pressed anything. This pins the new
  // behaviour rather than leaving it to be re-broken quietly.
  const n = run();
  assert.equal(String(n.get('cA').textContent), '0', 'a counter is already running');
  assert.equal(String(n.get('cH').textContent), '0');
  assert.equal(String(n.get('aSc').textContent), '0', 'the score is already shown');
  assert.equal(String(n.get('hSc').textContent), '0');
  assert.equal(String(n.el('scrub').value), '0', 'the scrubber is not at the start');
});

test('a full render at the end puts the right numbers in the DOM', () => {
  // Same claim the old 'first paint' test made — a complete render producing the
  // golden numbers — now reached deliberately rather than by accident of where
  // the app happened to start. String() because the app assigns numbers to
  // textContent, and a real DOM would coerce them.
  const n = toEnd(run());
  assert.equal(String(n.get('cA').textContent), '80', 'MIN attempts counter');
  assert.equal(String(n.get('cH').textContent), '55', 'BUF attempts counter');
  assert.equal(String(n.get('aSc').textContent), '2', 'MIN score');
  assert.equal(String(n.get('hSc').textContent), '3', 'BUF score');
  // THE BAR CARRIES THE PROPORTION; THE NUMBERS CARRY THE COUNT. This asserted
  // '59%' until the scoreboard stopped printing a bare percentage over a
  // denominator it did not show (CHENG). What replaces it is stronger: the two
  // numbers must be the same two the counters show, and the bar must be the
  // proportion they make — so the picture and the arithmetic cannot drift.
  assert.equal(String(n.get('pa').textContent), '80', 'control, visitor side');
  assert.equal(String(n.get('ph').textContent), '55', 'control, host side');
  assert.equal(n.get('ba').style.width, `${Math.round(100 * 80 / 135)}%`,
    'the bar is the proportion of the numbers beside it');
  assert.equal(n.get('bh').style.width, `${100 - Math.round(100 * 80 / 135)}%`);
  assert.equal(String(n.get('pMode').textContent), 'ALL SITUATIONS',
    'and it says what it was measured under, like the counters below it');
});

test('the scrubber is wired to the timeline', () => {
  const n = run();
  assert.equal(n.get('scrub').max, 268, 'scrubber spans the playable events');
});

test('turning on the Control layer renders the ledger, and it reconciles', () => {
  // Exercises the path behind the button, which is where renderWork lives and
  // where Phase 2's ledger is actually shown to anyone.
  const n = toEnd(run());   // these read a WATCHED game, so drive it there
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
  const n = toEnd(run());   // these read a WATCHED game, so drive it there
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
  const n = toEnd(run());   // these read a WATCHED game, so drive it there
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
  const n = toEnd(run());   // these read a WATCHED game, so drive it there
  // The last PLAYABLE event, not the period-end marker -- so a small remainder
  // rather than 00:00, and certainly not the 19:58 an elapsed clock would show.
  assert.equal(String(n.get('per').textContent), 'Period 3');
  assert.match(String(n.get('clk').textContent), /^00:0\d$/, 'counting down, near zero');
});

test('a metric added mid-replay catches up, tracks forward, and tears down', () => {
  // Kevin's specification, 2026-08-09: "hit play and the software just works.
  // During replay, if the user toggles on a metric, the software should catch
  // up at that point to surface the actual values at that time of the game,
  // and then keep track going forward. Toggle it off and it just goes away."
  //
  // That is what ships, and it was untested -- the existing coverage turns the
  // layer on at the END of the game, where catching up and starting fresh are
  // indistinguishable. Every number here is checked against the ledger computed
  // independently over the same slice, so a "fix" that rebuilt from zero, or
  // froze the counter at the join, or double-counted the events before the
  // toggle, fails rather than merely looking different.
  const n = run();
  const el = n.el;
  const scrub = el('scrub');
  const at = k => { scrub.value = k; scrub.oninput({ target: { value: k } }); };
  const shown = () => ({ a: +el('cA').textContent, h: +el('cH').textContent });
  const visible = () => el('rg').classList.contains('corsi');

  // The playable timeline, and the ledger truth at any point on it.
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EVI = [];
  rich.events.forEach((e, idx) => { if (!SKIP.has(e.type)) EVI.push(idx); });
  const CTX = {
    roster: rich.roster,
    homeId: rich.teams.home.id, awayId: rich.teams.away.id,
    homeAb: rich.teams.home.ab, awayAb: rich.teams.away.ab,
  };
  const truth = k => {
    const L = corsi.reduce(rich.events.slice(0, EVI[k] + 1), CTX);
    return { a: L.t[CTX.awayId], h: L.t[CTX.homeId] };
  };

  assert.equal(visible(), false, 'no metric layer on load — press play and just watch');

  // Watch a while with nothing on, THEN get curious.
  at(120);
  el('lyCorsi').click();
  assert.equal(visible(), true, 'the layer appears');
  assert.deepEqual(shown(), truth(120), 'and shows the count as it stood at that moment');

  // Keep going: it must track, not freeze at the join.
  for (const k of [150, 200, 268]) {
    at(k);
    assert.deepEqual(shown(), truth(k), `tracks forward through event ${k}`);
  }

  // Open the ledger, then turn the metric off: the whole layer goes away, and
  // the button that opens the ledger resets rather than stranding "Hide the
  // work" over a panel that is no longer reachable.
  el('work').click();
  assert.equal(el('workPanel').hidden, false, 'the ledger opens');
  el('lyCorsi').click();
  assert.equal(visible(), false, 'the layer is gone');
  assert.equal(el('workPanel').hidden, true, 'and it takes the ledger with it');
  assert.match(String(el('work').textContent), /Show me the work/, 'the button resets');

  // Turning it back on somewhere else catches up again — not resumes from where
  // it was, which would show a count that never happened.
  at(60);
  el('lyCorsi').click();
  assert.deepEqual(shown(), truth(60), 're-entry catches up to the new position');
});
