/**
 * The goalie's-eye view — the ice starts EMPTY.
 *
 * Kevin, reviewing the site: "default shots to 0 on the goalie view, and then
 * when they click Play the shots start appearing — the default just shows a mass
 * of figures in front of the goalie which doesn't create any interest."
 *
 * Same defect as the game page opening on the final whistle: arriving at the
 * finished picture is arriving after the thing you came for. This file boots the
 * SHIPPED page against a fake document and drives its real Play button, because
 * a builder constant is not evidence that the button works.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/goalie-eye-view.html', import.meta.url), 'utf8');
const SCRIPT = page.match(/<script>([\s\S]*)<\/script>/)[1];

function boot() {
  const els = new Map();
  const timers = [];
  const node = id => ({
    id, innerHTML: '', textContent: '', dataset: {}, _on: {}, style: {},
    setAttribute(k, v) { this[k] = v; }, getAttribute: () => null,
    addEventListener(t, f) { (this._on[t] = this._on[t] || []).push(f); },
    getBoundingClientRect: () => ({ width: 800, height: 500 }),
    // The canvas context is only exercised for its side effects here; nothing in
    // this file makes a claim about pixels, which it could not see anyway.
    getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }),
    setPointerCapture() {},
    click() { (this._on.click || []).forEach(f => f({})); if (this.onclick) this.onclick({}); },
  });
  const document = {
    getElementById(id) { if (!els.has(id)) els.set(id, node(id)); return els.get(id); },
    querySelectorAll: () => [], addEventListener() {},
  };
  new Function('document', 'matchMedia', 'devicePixelRatio', 'requestAnimationFrame',
               'addEventListener', 'setTimeout', 'clearTimeout', SCRIPT)(
    document, () => ({ matches: true }), 1, () => 0, () => {},
    f => { timers.push(f); return timers.length; }, () => {});
  return { $: id => document.getElementById(id), tick: n => { for (let k = 0; k < n; k++) (timers.pop() || (() => {}))(); } };
}

test('the ice starts empty, and says what is coming', () => {
  const a = boot();
  assert.match(a.$('stat').innerHTML, /shots to come\. Press play\./,
    'the line announces a finished save percentage before anything is drawn');
  assert.match(a.$('stat').innerHTML, /\d+ shots to come/, 'and it says how many');
  assert.match(a.$('play').textContent, /Play the shots/);
});

test('pressing play makes the shots arrive, and the save line BUILDS', () => {
  // The site's signature move, applied here: you watch the number get made
  // rather than being handed it. A fraction throughout — never a bare
  // percentage — because there is nothing to divide until a shot has been faced.
  const a = boot();
  a.$('play').click();
  a.tick(6);
  const line = a.$('stat').innerHTML;
  assert.match(line, /has faced <b>\d+<\/b> of \d+/, 'the count is not building');
  assert.match(line, /saved <b>\d+<\/b> of \d+/, 'the save line is not a fraction');
  assert.doesNotMatch(line, /sv%|\.\d{3}/, 'a finished save percentage is being shown');
  assert.match(a.$('play').textContent, /Pause/, 'the button does not offer to stop');
});

test('the page wears the site palette, not a black background of its own', () => {
  // It was a black page with dark chrome and read as a different site (Kevin).
  // The CANVAS keeps its dark arena — that is a rendered scene, not page
  // furniture — so this asserts the document, not the drawing.
  const css = page.match(/#gv\{[^}]*\}/)[0];
  assert.match(css, /background:var\(--bg\)/, 'the page still paints its own background');
  assert.match(css, /--bg:#f4f7fa/, 'and the ground is not the one the rest of the site uses');
  assert.match(css, /--ink:#0f1a23/);
  assert.doesNotMatch(page.match(/#gv \.gb\{[^}]*\}/)[0], /#0e1b27/, 'a dark button survived');
  assert.doesNotMatch(page.match(/#gv \.sb\{[^}]*\}/)[0], /#0e1b27/);
});
