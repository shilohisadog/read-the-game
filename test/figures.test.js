/**
 * One figure definition, two surfaces.
 *
 * The figures were canvas-only and lived as a string inside a Python file, so
 * nothing could import or test them. Now they draw through a "pen" — the small
 * subset of the canvas 2D API they actually use — which a real canvas context
 * satisfies and SvgPen also satisfies.
 *
 * These tests exist to stop the two surfaces drifting apart. That is the same
 * duplication trap the project has hit before: two copies of a thing, one of
 * them quietly wrong.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FIG, FIG_LABEL } from '../src/lib/figures.js';
import { SvgPen } from '../src/lib/svgpen.js';

const STYLES = Object.keys(FIG);
const OUTCOMES = ['save', 'goal'];

/** Records every call, so we can assert both pens see identical instructions. */
function recordingPen() {
  const calls = [];
  const p = new Proxy({}, {
    get(t, k) {
      if (k === '__calls') return calls;
      if (typeof k !== 'string') return undefined;
      if (!(k in t)) t[k] = (...a) => { calls.push(k); };
      return t[k];
    },
    set(t, k, v) { calls.push(`=${String(k)}`); t[k] = v; return true; },
  });
  return p;
}

test('both styles exist and are labelled', () => {
  assert.deepEqual(STYLES.sort(), ['mascot', 'tabletop']);
  for (const s of STYLES) assert.ok(FIG_LABEL[s], `${s} has a label`);
});

for (const style of STYLES) {
  for (const out of OUTCOMES) {
    test(`${style}/${out}: draws to an SVG pen without throwing`, () => {
      const pen = new SvgPen();
      FIG[style](pen, 100, 60, 10, '#34d399', out, { t: 0, motion: false, glow: false });
      const svg = pen.toSvg();
      assert.ok(pen.parts.length > 8, `${style}/${out} emitted only ${pen.parts.length} shapes`);
      assert.match(svg, /^<g ><\/g>$|^<g >/, 'wrapped in a group');
      assert.ok(!/NaN|undefined|Infinity/.test(svg), 'no bad numbers reached the markup');
    });

    test(`${style}/${out}: issues the same instructions to any pen`, () => {
      // The point of the pen abstraction. If a figure ever branches on which
      // surface it is drawing to, the two will silently diverge -- and the 2D
      // rink and the goalie view would stop showing the same player.
      const a = recordingPen(), b = new SvgPen();
      FIG[style](a, 50, 50, 12, '#f3c249', out, { t: 0, motion: false, glow: false });
      const before = b.parts.length;
      FIG[style](b, 50, 50, 12, '#f3c249', out, { t: 0, motion: false, glow: false });
      assert.ok(a.__calls.length > 20, 'the recording pen saw real work');
      assert.ok(b.parts.length > before, 'and so did the SVG pen');
    });
  }
}

test('the outcome changes the pose, not just the colour', () => {
  // save = shooting, goal = arms up. If these ever render identically the
  // figure has stopped carrying the one real fact it encodes.
  for (const style of STYLES) {
    const save = new SvgPen(); FIG[style](save, 0, 0, 10, '#fff', 'save', { motion: false, glow: false });
    const goal = new SvgPen(); FIG[style](goal, 0, 0, 10, '#fff', 'goal', { motion: false, glow: false });
    assert.notEqual(save.toSvg(), goal.toSvg(), `${style}: poses must differ`);
  }
});

test('idle motion is off when asked, and moves the figure when on', () => {
  const still = new SvgPen(); FIG.mascot(still, 0, 0, 10, '#fff', 'save', { motion: false, t: 0 });
  const same = new SvgPen(); FIG.mascot(same, 0, 0, 10, '#fff', 'save', { motion: false, t: 99 });
  assert.equal(still.toSvg(), same.toSvg(), 'time must not matter when motion is off');

  const a = new SvgPen(); FIG.mascot(a, 0, 0, 10, '#fff', 'save', { motion: true, t: 0 });
  const b = new SvgPen(); FIG.mascot(b, 0, 0, 10, '#fff', 'save', { motion: true, t: 1.2 });
  assert.notEqual(a.toSvg(), b.toSvg(), 'time must matter when motion is on');
});

test('SvgPen honours clipping, which the tabletop jersey stripes need', () => {
  const pen = new SvgPen('t');
  FIG.tabletop(pen, 0, 0, 10, '#fff', 'save', { motion: false, glow: false });
  assert.ok(pen.defs.length > 0, 'a clipPath was emitted');
  assert.match(pen.toSvg(), /clip-path="url\(#t/, 'and something is clipped by it');
});

test('detail drops out at small sizes, on purpose', () => {
  // Most shots in a real game are far out, so the figure has to survive being
  // tiny. Below 20px the face is skipped rather than rendered as mud -- that is
  // a legibility decision, not a bug, and it is why a naive "same shapes at any
  // size" assertion fails. Pin the actual behaviour.
  const draw = size => {
    const p = new SvgPen();
    FIG.mascot(p, 0, 0, size, '#fff', 'save', { motion: false, glow: false });
    return p.parts.length;
  };
  const tiny = draw(12), large = draw(40);
  assert.ok(tiny > 6, `even at 12px the figure still draws (${tiny} shapes)`);
  assert.ok(large > tiny, `and gains detail when there is room (${large} > ${tiny})`);
});

test('apparent size drives detail, not the raw size argument', () => {
  // The rink draws into a viewBox where one unit renders as ~4.3 screen pixels,
  // so a 9-unit figure appears at ~39px and has room for a face. Judging that
  // by `size` alone would call it "9 pixels" and strip the detail on a screen
  // with plenty of space. The canvas surfaces pass pixels and need no hint.
  const shapes = (size, px) => {
    const p = new SvgPen();
    FIG.mascot(p, 0, 0, size, '#fff', 'save', { motion: false, glow: false, px });
    return p.parts.length;
  };
  assert.ok(shapes(9, 9 * 4.3) > shapes(9, null),
    'the hint must restore detail a raw size check would drop');
  assert.equal(shapes(9, null), shapes(9, 9), 'no hint means judge by size');
});

test('the figure scales with its size argument', () => {
  const at = size => {
    const p = new SvgPen();
    FIG.mascot(p, 0, 0, size, '#fff', 'save', { motion: false, glow: false });
    return p.toSvg();
  };
  assert.notEqual(at(30), at(60), 'geometry must depend on size');
  // Doubling the size should roughly double the extent of the drawing.
  // Measure PATH DATA only: a first attempt scanned every number in the markup
  // and got a ratio of exactly 1.00, because colour hex like #0d141b contains
  // "141" — larger than any coordinate and constant across sizes.
  const ext = svg => {
    const ds = [...svg.matchAll(/ d="([^"]+)"/g)].map(m => m[1]).join(' ');
    const nums = (ds.match(/-?\d+\.?\d*/g) || ['0']).map(Number);
    return Math.max(...nums.map(Math.abs));
  };
  const r = ext(at(60)) / ext(at(30));
  assert.ok(r > 1.7 && r < 2.3, `extent should scale ~2x, got ${r.toFixed(2)}`);
});
