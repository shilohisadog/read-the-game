/**
 * The other half of every layer: what reaches the ice.
 *
 * THE WHISTLE LAYER WAS CORRECT, TESTED AND INVISIBLE FOR A DAY. Twenty unit
 * tests said what `reduce` returns; not one of them could tell you whether the
 * page drew a single mark, because nothing here had ever run `boot()`. The
 * defect that closed the gap was found by an unrelated guard the moment the layer
 * entered the bundle — it carried elapsed time onto a page whose every other
 * clock shows remaining.
 *
 * So this boots THE SHIPPED BUNDLE, from src/read-the-game.html, against a fake
 * document, and drives the real controls: the buttons a viewer clicks and the
 * scrubber a viewer drags. Nothing is asked politely — every number below is read
 * back out of the markup the app wrote.
 *
 * WHAT THIS CANNOT SEE, stated so the green is not read as more than it is: the
 * fake document has no CSS and no layout, so `display:none` is invisible to it
 * and so is anything about size or position. A panel this test calls "rendered"
 * may still be hidden by a stylesheet. That claim belongs to the browser step in
 * deploy.yml, and it is checked there rather than assumed here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const SCRIPT = app.match(/<script>([\s\S]*)<\/script>/)[1];

/** The smallest document `boot()` will run against. */
function fakeDom() {
  const el = () => ({
    innerHTML: '', textContent: '', value: '', hidden: false,
    style: {}, dataset: {}, childNodes: [{ nodeValue: '' }],
    _on: {},
    classList: {
      _c: new Set(),
      add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); },
      toggle(c, on) { on ? this._c.add(c) : this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    },
    setAttribute(k, v) { this[k] = v; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    click() { (this._on.click || []).forEach(fn => fn({ target: this })); },
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

/** Boot the shipped app and hand back the controls. */
function boot() {
  const dom = fakeDom();
  new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout', 'localStorage',
               SCRIPT)(
    dom.document, () => ({ matches: true }), () => 0, () => {},
    { getItem: () => null, setItem: () => {} });
  const scrub = dom.$('scrub');
  assert.ok(+scrub.max > 100, `the reference game should have hundreds of plays, not ${scrub.max}`);
  return {
    ...dom,
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

const rings = d => (d.$('whistles').innerHTML.match(/class="wh[\s"]/g) || []).length;
const evMarks = d => (d.$('events').innerHTML.match(/data-i="/g) || []).length;
const panel = d => d.$('whistlePanel').innerHTML;

test('the shipped app boots, and the reference game is in it', () => {
  const a = boot();
  assert.match(a.$('gl').textContent, /at .* final/, 'the game line is written from the data');
});

test('NOTHING draws whistle marks until the layer is turned on', () => {
  // THE MUTATION, and it comes first: a page that drew whistle marks
  // unconditionally would satisfy every other assertion in this file. If this
  // one cannot fail, none of them mean anything.
  const a = boot();
  assert.deepEqual([...new Set(a.sweep(rings))], [0]);
  assert.equal(panel(a), '', 'and the panel says nothing at all');
});

test('turning the layer on puts marks on the ice and a sentence under it', () => {
  const a = boot();
  a.$('lyWhistle').click();
  const drawn = a.sweep(rings);
  assert.ok(Math.max(...drawn) >= 1,
    'the layer is on and never drew a mark anywhere in the game');
  const p = panel(a);
  assert.ok(p.length > 40, `the panel explained nothing: "${p}"`);
  assert.doesNotMatch(p, /undefined|null|NaN/, 'a hole in the copy is worse than no copy');
});

test('the sentence on screen is the rule, and it names where it comes from', () => {
  // The whole argument for the layer: a novice has watched a hundred icings and
  // never had one named. If the page shows the reason code and not the rule, the
  // layer has delivered nothing.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.sweep(panel).join('\n');
  assert.match(seen, /centre line|blue line ahead of the puck|goaltender/i,
    'no whistle in a whole NHL game produced a teaching sentence');
  assert.match(seen, /rule: NHL Rule|field: rsn/, 'and the provenance travels with it');
});

test('with trails off the ice holds the current moment and nothing else', () => {
  // Kevin's observation: by the third period the surface is a wall of dots. This
  // is the fix, asserted over the whole game rather than at a flattering moment.
  const a = boot();
  const drawn = a.sweep(evMarks);
  assert.ok(Math.max(...drawn) <= 1,
    `trails are off and up to ${Math.max(...drawn)} marks persisted`);
});

test('keep-every-mark really does keep them', () => {
  // The paired half. Without it, "trails off shows one mark" is also satisfied by
  // a renderer that has stopped drawing anything at all.
  const a = boot();
  const off = Math.max(...a.sweep(evMarks));
  a.GROUPS['#rg .tbtn'][1].click();          // data-t="all"
  const all = Math.max(...a.sweep(evMarks));
  assert.ok(all > 50, `keep-every-mark peaked at ${all} marks`);
  assert.ok(all > off, 'and it must be more than the current moment holds');
});

test('the trails control reports its own state to a screen reader', () => {
  const a = boot();
  const [offBtn, allBtn] = a.GROUPS['#rg .tbtn'];
  assert.equal(offBtn['aria-pressed'], true, 'the default is the current moment');
  allBtn.click();
  assert.equal(allBtn['aria-pressed'], true);
  assert.equal(offBtn['aria-pressed'], false);
});

test('the whistle layer changes no other layer\'s numbers', () => {
  // The recorded gate for a new layer: adding it touches nothing existing.
  const a = boot(), b = boot();
  b.$('lyWhistle').click();
  const read = d => [d.$('cA').textContent, d.$('cH').textContent,
                     d.$('aSc').textContent, d.$('hSc').textContent].join('/');
  assert.deepEqual(b.sweep(read), a.sweep(read));
});
