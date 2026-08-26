/**
 * The deep-link seam, on the shipped page rather than in the abstract.
 *
 * The resolver is unit-tested next door. This boots THE REAL BUNDLE with a
 * query string and reads back what a viewer would see, because the two things
 * that can go wrong here are not resolver bugs:
 *
 *   1. the page resolves correctly and renders somewhere else
 *   2. the page fails to resolve and says nothing about it
 *
 * The second is the dangerous one and it is why every assertion below checks
 * the WORD as well as the position. `set()` clamps to the final event, so an
 * unhonoured link does not blank the rink — it renders the finished game:
 * final score, finished counters, the shootout notice. That looks like a
 * working page, on the surface most likely to be pasted into a forum.
 *
 * AND IT CHECKS BOTH DIRECTIONS. The fake document hands back a fresh element
 * for ANY id asked of it, with `textContent: ''`, so asserting "the notice is
 * not hidden" would pass against a page that never wrote one. (`hidden` is
 * deliberately absent from the fake for the same reason -- see the element
 * factory below.) The assertions here are on the SENTENCE, and a good link must
 * leave it empty.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAYER_TOKENS } from '../src/lib/deeplink.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const app = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const SCRIPT = app.match(/<script>([\s\S]*)<\/script>/)[1];

function fakeDom() {
  const el = () => ({
    // `hidden` IS DELIBERATELY ABSENT, not `false`. A fake that invents the
    // default makes `assert.equal(el.hidden, false)` pass against a page that
    // never wrote the element at all -- the assertion reads as coverage and
    // proves nothing. Left undefined, the same assertion requires a real write.
    // (homepage.test.js already worked this way and says so at its heroShown.)
    innerHTML: '', textContent: '', value: '',
    style: { _v: {}, setProperty(k, v) { this._v[k] = v; }, getPropertyValue(k) { return this._v[k] || ''; } },
    dataset: {}, childNodes: [{ nodeValue: '' }], _on: {},
    classList: {
      _c: new Set(),
      add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); },
      toggle(c, on) { on ? this._c.add(c) : this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    click() { (this._on.click || []).forEach(fn => fn({ target: this })); },
  });
  const byId = new Map();
  const GROUPS = {
    '#rg .tbtn': ['off', 'all'].map(t => Object.assign(el(), { dataset: { t } })),
    '#rg .sbtn': ['all', 'even'].map(s => Object.assign(el(), { dataset: { s } })),
    '#rg .lrow': ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock'].map(id => {
      if (!byId.has(id)) byId.set(id, el());
      return byId.get(id);
    }),
    // THE SELECTOR UNDER THE SCRUBBER. Six radios keyed by `data-l`, and the ids
    // are shared with byId so a test can drive one and read the others.
    '#rg .pk': ['none', 'corsi', 'slot', 'blocked', 'goaltending', 'whistle'].map(l => {
      const key = 'pk:' + l;
      if (!byId.has(key)) byId.set(key, Object.assign(el(), { dataset: { l } }));
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
    getElementById(id) { if (!byId.has(id)) byId.set(id, el()); return byId.get(id); },
    querySelectorAll(sel) {
      assert.ok(GROUPS[sel], `the page queried "${sel}", which this fake does not model`);
      return GROUPS[sel];
    },
  };
  return { document, byId, GROUPS, $: id => document.getElementById(id) };
}

function open(search) {
  const dom = fakeDom();
  /* `window` is injected because the preview hands its attempt totals to the
     parent, and a harness that cannot express being framed cannot boot the page
     at all. Posting is accepted and discarded: this file is about the parser. */
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', 'window', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: true }), () => 0, () => {},
    { getItem: () => null, setItem: () => {} }, { search, origin: 'https://x' },
    { parent: { postMessage: () => {} } });
  b(rich, null);
  return dom;
}

/**
 * A shot that is the only thing recorded at its clock.
 *
 * A SHOT ON GOAL RATHER THAN "ANY EVENT", and read back through the SCOREBOARD
 * rather than the scrubber. The scrubber indexes the PLAYABLE events -- the
 * page drops stoppages and period markers -- so an index into the extract is
 * not an index into the control, and a test asserting one against the other is
 * asserting the app's internal mapping rather than anything a viewer can see.
 * The clock on the scoreboard is what the link promised and what the reader
 * checks, so that is what this asserts. A shot is chosen because it is
 * indisputably a frame of its own, without this file having to restate which
 * types the page skips.
 */
function soleClock(from = 30) {
  const counts = new Map();
  for (const e of rich.events) counts.set(e.per + '|' + e.rem, (counts.get(e.per + '|' + e.rem) || 0) + 1);
  for (let i = from; i < rich.events.length; i++) {
    const e = rich.events[i];
    if (e.type === 'shot-on-goal' && counts.get(e.per + '|' + e.rem) === 1) return { i, e };
  }
  throw new Error('the reference game has no uniquely-clocked shot, which cannot be');
}

/** Not pressed, without asking the fake to know markup it never parsed. */
const off = v => assert.notEqual(String(v), 'true');

test('the reference game is regulation only, so period 4 is genuinely out of range', () => {
  assert.equal(Math.max(...rich.events.map(e => e.per)), 3);
});

test('a link to a moment opens there, and says nothing', () => {
  const { e } = soleClock();
  const d = open(`?at=${e.per}-${e.rem}`);
  assert.equal(d.$('clk').textContent, e.rem, 'the scoreboard must show the clock the link named');
  assert.equal(d.$('per').textContent, 'Period ' + e.per, 'and the period it named');
  assert.equal(d.$('atnote').textContent, '', 'an honoured link has nothing to apologise for');
  assert.notEqual(+d.$('scrub').value, 0, 'a mid-game link is not the start of the game');
});

test('no link at all opens BEFORE the first play, silently', () => {
  // THE ABSENCE OF `at` IS NOT A REQUEST FOR THE FIRST PLAY. `resolve` answers
  // index 0 for both, so the page asks `LINK.at` -- was a moment named at all --
  // rather than reading the answer off the frame it resolved to. Silently: an
  // unadorned visit has nothing to explain.
  const d = open('');
  assert.equal(+d.$('scrub').value, -1);
  assert.equal(d.$('atnote').textContent, '');
});

test('a link to a period the game never reached opens at the START and says so', () => {
  const d = open('?at=4-03:00');
  assert.equal(+d.$('scrub').value, 0);
  // THE SPOILER, asserted separately so it cannot be met by coincidence.
  assert.notEqual(+d.$('scrub').value, rich.events.length - 1);
  const note = d.$('atnote').textContent;
  assert.ok(note.length > 10, `expected a sentence, got ${JSON.stringify(note)}`);
  assert.match(note, /start|opening/i);
});

test('a malformed link opens at the start and says so', () => {
  // AND IT LANDS SOMEWHERE DIFFERENT FROM THE TEST ABOVE IT, on purpose.
  // `?at=4-03:00` NAMED a moment we could resolve to the earliest one we hold,
  // so it lands on the opening draw with a sentence. `?at=banana` named nothing
  // readable, so there is no request to honour and it opens where every
  // unadorned visit opens -- and still says why it is not where it was sent.
  // Two honest answers to two different questions; do not make them uniform.
  const d = open('?at=banana');
  assert.equal(+d.$('scrub').value, -1);
  assert.ok(d.$('atnote').textContent.length > 10);
});

test('an inexact landing is not an apology: a moment between events says nothing', () => {
  // The opposite failure to the one above, and just as likely: an
  // implementation that prints the notice whenever it did not land exactly
  // would apologise on most honest links. A clock nothing happened at is a
  // perfectly good moment -- the page shows the last thing that did happen.
  const has = new Set(rich.events.map(e => e.per + '|' + e.rem));
  let rem = null;
  for (let s = 1; s < 1140 && rem === null; s++) {
    const c = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    if (!has.has('2|' + c)) rem = c;
  }
  const d = open(`?at=2-${rem}`);
  assert.equal(d.$('atnote').textContent, '');
  assert.notEqual(+d.$('scrub').value, 0, 'a mid-game clock is not the start of the game');
  assert.notEqual(+d.$('scrub').value, rich.events.length - 1);
});

/* --------------------------------------------------------------- the mode
   CHENG's framing: not "strength= is mandatory" but "the URL and the on-screen
   mode can never disagree", because the mode is part of the number's identity
   and the scoreboard already carries MODE() beside it. */

for (const [q, token, label] of [
  ['?strength=even', 'even', 'EVEN STRENGTH'],
  ['?strength=all', 'all', 'ALL SITUATIONS'],
  ['', 'all', 'ALL SITUATIONS'],                 // the page's own default
  ['?strength=sideways', 'all', 'ALL SITUATIONS'], // garbage falls back, visibly
]) {
  test(`the scoreboard states the mode the URL asked for: "${q}" -> ${label}`, () => {
    const d = open(q);
    assert.equal(d.$('pMode').textContent, label);
    assert.equal(d.$('mA').textContent, label, 'both scoreboard sides, not just one');
    assert.equal(d.$('mH').textContent, label);
    const pressed = d.GROUPS['#rg .sbtn'].filter(b => String(b['aria-pressed']) === 'true');
    assert.deepEqual(pressed.map(b => b.dataset.s), [token],
      'the button a viewer sees must agree with the URL that opened the page');
  });
}

/* -------------------------------------------------------------- the layers */

test('a link with a layer opens with that layer on, and the others off', () => {
  const d = open('?layer=whistle');
  assert.equal(String(d.$('lyWhistle')['aria-pressed']), 'true');
  assert.ok(d.$('rg').classList.contains('whistle'));
  for (const id of ['lyCorsi', 'lyHd', 'lyGoalie']) off(d.$(id)['aria-pressed']);
});

/* SET EQUALITY over the tokens, then one boot per token. Written out rather
   than inferred, so a layer that gains a URL token but no button -- or a button
   whose token nothing answers to -- is a red test rather than a link that
   silently does nothing. The whistle case above is the same claim in detail;
   this is the one that will notice the FIFTH layer. */
const BUTTON_OF = { corsi: 'lyCorsi', slot: 'lyHd', goaltending: 'lyGoalie', whistle: 'lyWhistle',
                    blocked: 'lyBlock' };

test('every layer token has a button, and every button a token', () => {
  assert.deepEqual(Object.keys(BUTTON_OF).sort(), [...LAYER_TOKENS].sort());
});

for (const [token, id] of Object.entries(BUTTON_OF)) {
  test(`?layer=${token} presses ${id} and nothing else`, () => {
    const d = open('?layer=' + token);
    assert.equal(String(d.$(id)['aria-pressed']), 'true');
    for (const other of Object.values(BUTTON_OF)) if (other !== id) off(d.$(other)['aria-pressed']);
  });
}

test('two layers at once, because a viewer can press two buttons', () => {
  const d = open('?layer=corsi,slot');
  assert.equal(String(d.$('lyCorsi')['aria-pressed']), 'true');
  assert.equal(String(d.$('lyHd')['aria-pressed']), 'true');
  off(d.$('lyWhistle')['aria-pressed']);
});

test('an unknown layer token opens the page anyway — a link is not an error page', () => {
  const { e } = soleClock();
  const d = open(`?layer=gubbins&at=${e.per}-${e.rem}`);
  off(d.$('lyCorsi')['aria-pressed']);
  assert.equal(d.$('atnote').textContent, '', 'an unreadable LAYER is not an unreadable moment');
  assert.equal(d.$('clk').textContent, e.rem, 'and the moment it did understand still applies');
});

test('preview still works, read through the one parser', () => {
  const d = open('?preview=1');
  assert.ok(d.$('rg').classList.contains('preview'));
});

test('a deep link and preview compose: the taste can start somewhere', () => {
  const { e } = soleClock();
  const d = open(`?preview=1&at=${e.per}-${e.rem}`);
  assert.ok(d.$('rg').classList.contains('preview'));
});
