/**
 * THE PAGE HARNESS — one fake document, one bundle, one boot.
 *
 * This was 220 lines living at the top of test/render.test.js, a file that had
 * grown to 3,678 lines and 129 tests because it owned the only way to run the
 * shipped bundle. Every claim about what reaches the screen had to be written
 * there, whatever its subject.
 *
 * THE SIZE WAS PRODUCING THE DEFECT THE FILE ITSELF COMPLAINS ABOUT. Its own
 * comments record "four hand-written fakes of one document at four fidelities"
 * and "a harness assembled twice is the same defect as a rule implemented
 * twice" — and the reason other suites grew their own fakes is that the good one
 * was not importable. It is now.
 *
 * WHAT THIS CANNOT SEE, stated so green is not read as more than it is: the fake
 * document has no CSS and no layout, so `display:none` is invisible to it and so
 * is anything about size or position. A panel this calls "rendered" may still be
 * hidden by a stylesheet. That claim belongs to the browser — tools/pixels.sh
 * locally and the browser step in deploy.yml — and is checked there rather than
 * assumed here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const rich = JSON.parse(readFileSync(new URL('../../data/rich.json', import.meta.url)));
export const app = readFileSync(new URL('../../src/read-the-game.html', import.meta.url), 'utf8');
export const SCRIPT = app.match(/<script>([\s\S]*)<\/script>/)[1];

/**
 * EVERY stylesheet on the page, not the first one.
 *
 * This exists because a test below was reading `app.match(/<style>…/)[1]` and
 * getting the SHARED CHROME — 900 bytes of header and footer CSS that the page
 * gained in <head> some time after the test was written. It then looped over
 * rules looking for `.att`, `.tm`, `.ba` and friends, found none of them, and
 * asserted nothing at all. Green, and structurally incapable of failing.
 *
 * `builders/page.py::csp` was bitten by exactly this — `re.search` where
 * `re.findall` was meant — and the comment there says so. Same mistake, same
 * document, second instrument. Joining every block is also the stronger claim:
 * a team's colour must not be named in ANY stylesheet the page carries.
 */
export const PAGE_CSS = [...app.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

/** The smallest document `boot()` will run against. */
export function fakeDom() {
  const el = () => ({
    // `hidden` IS DELIBERATELY ABSENT, not `false`. A fake that invents the
    // default makes `assert.equal(el.hidden, false)` pass against a page that
    // never wrote the element at all -- the assertion reads as coverage and
    // proves nothing. Left undefined, the same assertion requires a real write.
    // (homepage.test.js already worked this way and says so at its heroShown.)
    innerHTML: '', textContent: '', value: '',
    // The app paints each team's real colour onto #rg as a custom property at
    // boot, so the fake has to record them to be able to check them.
    style: { _v: {}, setProperty(k, v) { this._v[k] = v; },
             getPropertyValue(k) { return this._v[k] || ''; } },
    dataset: {}, childNodes: [{ nodeValue: '' }],
    _on: {},
    classList: {
      _c: new Set(),
      add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); },
      toggle(c, on) { on ? this._c.add(c) : this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    },
    setAttribute(k, v) { this[k] = v; },
    // Reading back what was written. Absent returns null, as the real DOM does,
    // rather than undefined -- a fake that answers a question differently from
    // the thing it stands in for is a test that passes for its own reasons.
    getAttribute(k) { return k in this ? this[k] : null; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    // BOTH WAYS A HANDLER GETS ATTACHED, because the page uses both and this
    // fake only knew one. The layer buttons use addEventListener; the whole
    // TRANSPORT — play, the three speeds, the work toggle — assigns `.onclick`,
    // so `.click()` on any of them fired nothing at all. Not a vacuous
    // assertion: a test that pressed Play and then checked the page had not
    // started would have passed against a page that never started anything.
    click() {
      (this._on.click || []).forEach(fn => fn({ target: this }));
      if (typeof this.onclick === 'function') this.onclick({ target: this });
    },
  });

  const byId = new Map();
  // Selector -> the buttons that selector really matches in the markup. Written
  // out rather than parsed, so a control that is renamed in the page but not here
  // shows up as a test that stops finding its button, instead of one that quietly
  // clicks nothing.
  const GROUPS = {
    '#rg .tbtn': ['off', 'all'].map(t => Object.assign(el(), { dataset: { t } })),
    '#rg .sbtn': ['all', 'even'].map(s => Object.assign(el(), { dataset: { s } })),
    '#rg .fbtn': ['mascot', 'tabletop'].map(f => Object.assign(el(), { dataset: { f } })),
    '#rg .cc.a .lb': [el()],
    '#rg .cc.h .lb': [el()],
  };
  const document = {
    // `document.body` is part of the document this bundle runs in -- preview
    // hides the shared chrome through a class on it -- so the fake models it
    // rather than the app defending against its absence.
    body: el(),
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, el());
      return byId.get(id);
    },
    querySelectorAll(sel) {
      assert.ok(GROUPS[sel], `the page queried "${sel}", which this fake does not model`);
      return GROUPS[sel];
    },
  };
  return { document, byId, GROUPS, $: id => document.getElementById(id) };
}

/**
 * Boot the shipped app and hand back the controls.
 *
 * `game` re-runs the SAME boot with different data. The script ends by calling
 * boot() on the game compiled into it, so it is handed back and called again --
 * which is the only way to put a matchup this page was never built around
 * (two clubs wearing the same hex) through the real renderer.
 */
/**
 * THE BUNDLE, CONSTRUCTED IN ONE PLACE.
 *
 * There were two of these, listing the injected globals separately, and they
 * drifted the moment the page reached for a new one: `window.parent` was added
 * so the preview could hand its attempt totals to the home page, `boot()` grew a
 * `window` and `delaysOf` did not, and three tests failed with "window is not
 * defined" against a page that was correct. A harness assembled twice is the
 * same defect as a rule implemented twice, and this file already carries the
 * scar of four fakes of one document at four fidelities.
 */
export function bundle(globals, src = SCRIPT, give = 'boot') {
  const names = ['document', 'matchMedia', 'setTimeout', 'clearTimeout',
                 'localStorage', 'location', 'window'];
  return new Function(...names, src + `\nreturn ${give};`)(...names.map(n => globals[n]));
}

export function boot(game, rates, search = '', store = null) {
  const dom = fakeDom();
  /**
   * THE REPLAY CLOCK, CAPTURED RATHER THAN STUBBED OUT.
   *
   * `setTimeout` used to answer 0 and drop the callback, so `play()` set a
   * timer that never fired and the PLAY LOOP had never run once in this file —
   * every test drove the page by dragging the scrubber instead, which is a
   * different code path with different arguments to `render`. One slot, not a
   * queue: the page has exactly one timer in flight, and `clearTimeout` really
   * cancels it, so a queue would let a cancelled frame fire later.
   */
  let pending = null;
  const setTimeout_ = fn => { pending = fn; return 1; };
  const clearTimeout_ = () => { pending = null; };
  // `location` is part of the environment this bundle runs in — the preview loop
  // and the shell's game selector both read the query string — so the fake
  // models it rather than the code defending against its absence.
  /* THE FRAME RELATIONSHIP, MODELLED RATHER THAN DEFENDED AGAINST.
     The preview hands the parent its attempt totals, and it asks `window.parent`
     whether it is framed at all. This fake had no `window`, so that expression
     threw -- and a harness that cannot express the state makes every assertion
     about it vacuous, which is the reason `localStorage` stopped being a stub
     that always answered null. `posted` records what was sent so a test can read
     it; `parent` is a DIFFERENT object from `window`, because the page decides
     whether it is framed by comparing them. */
  const posted = [];
  const win = { postMessage: () => { throw new Error('the page posted to itself'); } };
  win.parent = { postMessage: (msg, origin) => posted.push({ msg, origin }) };
  // A FAKE THAT CANNOT EXPRESS THE OTHER STATE MAKES ASSERTIONS ABOUT IT
  // VACUOUS — the same reason `hidden` is absent from `el()` rather than false.
  // `localStorage` always answered null, so every boot was a first visit and
  // "a returning viewer sees no tips" could not have been tested.
  const b = bundle({
    document: dom.document, matchMedia: () => ({ matches: true }),
    setTimeout: setTimeout_, clearTimeout: clearTimeout_,
    localStorage: store || { getItem: () => null, setItem: () => {} },
    location: { search, origin: 'https://x' }, window: win });
  // `rates` is what the SHELL fetches and the inlined page never has. Without it
  // this harness can only ever see the "no comparison shown" branch, which is
  // how a test for the drawn rate first went red against a page structurally
  // incapable of having one.
  if (game || rates) b(game || rich, rates);
  const scrub = dom.$('scrub');
  dom.posted = posted;
  assert.ok(+scrub.max > 100, `the reference game should have hundreds of plays, not ${scrub.max}`);
  return {
    ...dom,
    /**
     * Run the replay the way a viewer who presses Play does — the real loop,
     * `render(i,'play')`, one frame per `dwell`. Returns how many frames
     * actually advanced, so a test cannot mistake a dead timer for a finished
     * game.
     */
    advance(n) {
      let moved = 0;
      for (let k = 0; k < n; k++) { if (!pending) break; const f = pending; pending = null; f(); moved++; }
      return moved;
    },
    /**
     * Every frame in the game, for claims that need COVERAGE rather than a
     * sample — "the far goal line, at both ends" cannot be checked by a walk
     * that may only ever land on one end.
     */
    every(read) {
      const out = [];
      for (let k = 0; k <= +scrub.max; k++) {
        scrub.value = String(k);
        scrub.oninput({ target: { value: scrub.value } });
        out.push(read(dom));
      }
      return out;
    },
    /**
     * One named frame. `every` and `sweep` answer "across the game"; some
     * claims are about a SPECIFIC event — the faceoff after a goal is not the
     * faceoff after a whistle, and only that frame can tell them apart.
     */
    at(k, read) {
      scrub.value = String(k);
      scrub.oninput({ target: { value: scrub.value } });
      return read(dom);
    },
    /** Drag the scrubber the way a viewer does, and report what got drawn. */
    sweep(read) {
      const out = [];
      const n = +scrub.max;
      for (let k = 0; k <= 30; k++) {
        scrub.value = String(Math.round(n * k / 30));
        scrub.oninput({ target: { value: scrub.value } });
        out.push(read(dom));
      }
      return out;
    },
  };
}

export const rings = d => (d.$('whistles').innerHTML.match(/class="wh[\s"]/g) || []).length;
/**
 * How many EVENTS are on the ice — not how many elements.
 *
 * One event can now draw up to three: the mark, an annotation ring, and a goal's
 * core. Counting elements made "the ice holds one mark" mean "three", which the
 * trails test caught the moment annotations became separate nodes.
 */
export const evMarks = d => new Set(
  [...d.$('events').innerHTML.matchAll(/data-i="(\d+)"/g)].map(m => m[1])).size;
export const panel = d => d.$('whistlePanel').innerHTML;

export const prose = app.slice(app.indexOf('</style>'), app.indexOf('<script>'));

/**
 * THE RATES THE SHELL FETCHES, which the inlined page never has. Without them a
 * harness can only ever see the "no comparison shown" branch — which is how a
 * test for the drawn rate first went red against a page structurally incapable
 * of having one. Published figures copied from measures.json rather than
 * invented: a fixture with a made-up rate tests the formatting and nothing else.
 */
export const CURVE_AND_MIX = {
  levelCurve: [{ k: 12, n: 708, count: 243 }, { k: 1, n: 3855, count: 1527 }],
  // The published figures, copied from measures.json rather than invented — a
  // fixture with a made-up rate tests the formatting and nothing else.
  baseRates: {
    moreAttemptsLost: { what: 'the team with more shot attempts lost',
                        population: 'NHL regular season and playoffs',
                        n: 4029, count: 2194, rate: 2194 / 4029 },
  },
  attemptMix: {
    games: 4119,
    byType: { goal: 25105, 'shot-on-goal': 211764, 'missed-shot': 118557, 'blocked-shot': 136545 },
    reachedTheGoalie: { n: 491971, count: 236869, rate: 236869 / 491971, population: 'NHL regular season and playoffs' },
    neverReachedTheGoalie: { n: 491971, count: 255102, rate: 255102 / 491971, population: 'NHL regular season and playoffs' },
    blocked: { n: 491971, count: 136545, rate: 136545 / 491971, population: 'NHL regular season and playoffs' },
  },
};

/* ------------------------------------------------------------- THE CLOCK
 * Driving the replay by its own timer rather than by dragging the scrubber.
 * These were local to the preview tests, and the split is what showed they
 * were not: the transport tests reach for `paceOf` across a file boundary,
 * which is the difference between a subject and a harness.
 */
/** Boot with a recording clock and return the delays the page asked for. */
export function delaysOf(search, ticks) {
  const dom = fakeDom();
  const delays = [];
  let n = 0;
  const at = [];
  const timer = (fn, ms) => {
    delays.push(ms); at.push(+dom.$('scrub').value);
    if (n++ < ticks) fn();
    return 0;
  };
  const b = bundle({
    document: dom.document, matchMedia: () => ({ matches: false }),
    setTimeout: timer, clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    location: { search, origin: 'https://x' },
    window: { parent: { postMessage: () => {} } } });
  b(rich, null);
  return { dom, delays, at };
}

/**
 * WALK THE REAL PLAY LOOP AND RECORD WHAT EACH FRAME WAS GIVEN.
 *
 * One row per scheduled frame: the wait the page asked for, the frame it was
 * asked for, the caption's animation duration at that moment, and the caption's
 * markup so a CHANGE identifies the frames that actually spoke. The recorder
 * fires before the callback runs, so every row describes the frame on screen.
 */
export function paceOf(ticks, setup) {
  const dom = fakeDom();
  const rows = [];
  let n = 0;
  const timer = (fn, ms) => {
    rows.push({ ms, i: +dom.$('scrub').value,
                dur: dom.$('caption').style.animationDuration,
                html: dom.$('caption').innerHTML });
    if (n++ < ticks) fn();
    return 0;
  };
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: false }), timer, () => {},
    { getItem: () => null, setItem: () => {} }, { search: '' });
  b(rich, null);
  if (setup) setup(dom);
  dom.$('play').onclick();
  // A frame SPOKE if the caption's markup differs from the frame before it.
  rows.forEach((r, k) => { r.spoke = k > 0 && r.html !== rows[k - 1].html; });
  return { dom, rows };
}
