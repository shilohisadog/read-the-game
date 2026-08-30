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
    innerHTML: '', value: '',
    /* ⭐ `textContent` COERCES, BECAUSE A REAL ONE DOES.
       It was a plain field, so `el.textContent = 34` stored the NUMBER 34 while
       a browser stores "34". Every assertion here then had to know which side of
       the fence it was on, and a test comparing against a string failed on a
       page that is correct — the fake being MORE PERMISSIVE than the DOM, which
       is the direction that hides defects rather than inventing them. */
    _text: '',
    get textContent() { return this._text; },
    /* ⚠️ AND IT DECODES ENTITIES, because a real `textContent` does. The row
       copy contains `&mdash;`; a browser hands the page an em dash and the fake
       was handing it the seven literal characters, which the page then escaped
       into `&amp;mdash;`. The fake being able to produce a string the DOM never
       would is the same fidelity gap as it storing a number where the DOM
       stores a string — a defect invented by the harness, or hidden by it. */
    set textContent(v) {
      this._text = v == null ? '' : String(v)
        .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
        .replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
        .replace(/&times;/g, '\u00d7').replace(/&amp;/g, '&');
    },
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
    // The next-play ring. Its buttons carry the real labels, because `syncCue`
    // copies the pressed one into the drawer's summary — a fake with empty text
    // would let a summary that says nothing pass as a summary that says what is on.
    '#rg .cbtn': [['on', 'Show the shading'], ['off', 'No shading']]
      .map(([c, textContent]) => Object.assign(el(), { dataset: { c }, textContent })),
    '#rg .lrow': ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock'].map(id => {
      if (!byId.has(id)) byId.set(id, el());
      return byId.get(id);
    }),
    // THE SELECTOR UNDER THE SCRUBBER. Six radios keyed by `data-l`, and the ids
    // are shared with byId so a test can drive one and read the others.
    /* ⚠️ AND THE CHIPS CARRY THEIR REAL LABELS, read out of the built page.
       They were bare stubs with an empty `textContent`, and the caption test
       compared the fake's empty label against the fake's empty output — so a
       build that named the wrong thing passed. The mutation applied, the suite
       stayed green, and that is what a mirror looks like from the inside. */
    '#rg .pk': ['none', 'corsi', 'slot', 'blocked', 'goaltending', 'whistle'].map(l => {
      const key = 'pk:' + l;
      if (!byId.has(key)) {
        /* ⭐ THE CHIP'S NAME IS IN `.pkl` NOW, because each metric chip carries a
           live count beside it and `capFor` must read the NAME alone -- a chip
           whose `textContent` is "Slot33" would compose "**Slot33** — attempts
           from within 33 ft". The fake models the same split, so a test cannot
           pass on a structure the page does not have. */
        const m = new RegExp(`<button class="pk"[^>]*data-l="${l}"[^>]*>(?:<span class="pkl">)?([^<]*)<`).exec(app);
        const label = m ? m[1] : '';
        const node = Object.assign(el(), { dataset: { l } });
        /* ⚠️ AND THE CHIP'S OWN `textContent` CARRIES THE COUNT, because a real
           one does — it is the concatenation of the chip's children, and
           `.pkn` is a child. The fake stored the LABEL there, which made the
           two readings identical and the whole defect class invisible: the
           panel heading shipped "How Goaltending10 is counted" while every
           test here compared the fake's label against the fake's label. A
           harness that cannot tell `.pkl` from the whole chip cannot check the
           one seam that has now decided four designs. `n_<layer>` is the
           element `drawChipCounts` writes to, so this reads what the app
           actually put on screen rather than a number the fake invented. */
        Object.defineProperty(node, 'textContent', { configurable: true,
          get: () => label + (byId.has('n_' + l) ? byId.get('n_' + l).textContent : '') });
        node.querySelector = sel => (sel === '.pkl' ? { textContent: label } : null);
        byId.set(key, node);
      }
      return byId.get(key);
    }),
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
    /* ⭐ SINGLE-ELEMENT QUERIES, ANSWERED FROM THE BUILT MARKUP.
       The caption under the selector reads the words out of the parked layer
       rows and the parked legend — that is the whole point of it, so a fake that
       returned empty stubs would let a caption test pass against a page that
       says nothing. These answers carry the REAL strings from the built page.
       Anything not modelled throws, as above: a fake that silently returns null
       turns "the app asked for something new" into "the feature did nothing". */
    querySelector(sel) {
      const row = /^#rg \.lrow\[data-pick="([a-z]+)"\]$/.exec(sel);
      if (row) {
        const m = new RegExp(`<button class="lrow" [^>]*data-pick="${row[1]}"[\\s\\S]*?</button>`).exec(app);
        if (!m) return null;
        return { querySelector: s2 => {
          const t = new RegExp(`<span class="${s2.slice(1)}">([^<]*)<`).exec(m[0]);
          return t ? { textContent: t[1] } : null;
        } };
      }
      /* THE SELECTOR'S OWN HEADING, from the built markup. The base view's prompt
         names the control rather than pointing at a direction — "Pick a lens
         ABOVE" went stale the day the row moved below — so it READS this, and
         the fake has to answer with the real word or the test is comparing the
         fake's silence to the fake's silence. */
      if (sel === '#rg .pklab') {
        const m = /<span class="pklab">([^<]*)</.exec(app);
        return m ? { textContent: m[1] } : null;
      }
      const pk = /^#rg \.pk\[data-l="([a-z]+)"\]$/.exec(sel);
      if (pk) return GROUPS['#rg .pk'].find(b => b.dataset.l === pk[1]) || null;
      if (sel === '#rg .zref .legend') {
        const m = /<div class="legend">([\s\S]*?)<\/div>/.exec(app);
        if (!m) return null;
        const parts = m[1].split('</span></span>').filter(x => x.trim());
        return { children: parts.map(x => ({ outerHTML: x + '</span></span>' })) };
      }
      assert.fail(`the page asked this fake for "${sel}", which it does not model`);
    },
  };
  return { document, byId, GROUPS, $: id => document.getElementById(id),
           // Group queries by selector, for controls that are one-of-N rather
           // than one element with an id -- the selector under the scrubber.
           $$: sel => document.querySelectorAll(sel) };
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
  /* `navigator` joined when the share control did. It is part of the environment
     the bundle runs in — the clipboard lives there — and without it every press
     took the "clipboard refused" fallback, so the success path was structurally
     untestable and the fake would have been MORE PERMISSIVE than a browser. */
  const names = ['document', 'matchMedia', 'setTimeout', 'clearTimeout',
                 'localStorage', 'location', 'window', 'navigator'];
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
    /* `pathname` too: the share control builds an absolute URL from it, and a
       fake without it produces "https://xundefined?game=…" — a string that
       every assertion about the query would still pass on. */
    location: { search, origin: 'https://x', pathname: '/game' },
    navigator: { clipboard: { writeText: v => { dom.copied = v; return Promise.resolve(); } } },
    window: win });
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
    /* ⚠️ A GETTER, BECAUSE THE SPREAD ABOVE IS A SNAPSHOT. The share control
       writes to the clipboard when a test presses it, which is long after this
       object is built — read through `...dom` it is forever undefined, and an
       assertion on it would fail for a reason that has nothing to do with the
       page. */
    get copied() { return dom.copied; },
    /* THE CLIPBOARD WRITE IS ASYNC, so the confirmation is composed in a
       microtask. A test that reads the status line straight after the press is
       reading the frame before it. `setImmediate` lands after every queued
       microtask, which is the guarantee `Promise.resolve()` does not give. */
    settle: () => new Promise(r => setImmediate(r)),
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
    location: { search, origin: 'https://x', pathname: '/game' },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
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
                html: dom.$('caption').innerHTML,
                // ⭐ THE ICE SPEAKS TOO. A goal's moment moved out of the pill
                // on 2026-08-25 -- `drawLabel` already named the scorer and the
                // assists, so the pill repeated it -- and `dwell` still gives a
                // goal its extra time. Measuring speech by the caption alone
                // therefore reported a frame that was long and silent, which is
                // exactly the defect the invariant below exists to forbid.
                goal: (dom.$('labels').innerHTML.match(/🚨 GOAL[^<]*/) || [''])[0] });
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
  // A frame SPOKE if the caption changed, or a goal ARRIVED on the ice. An
  // arrival and not any change: the label group is rewritten every frame, so the
  // goal branch empties again one frame later and "did it differ" would count
  // that clearing as a second, silent-but-long frame.
  rows.forEach((r, k) => {
    const prev = rows[k - 1];
    r.spoke = k > 0 && ((r.goal && r.goal !== prev.goal) || r.html !== prev.html);
  });
  return { dom, rows };
}
