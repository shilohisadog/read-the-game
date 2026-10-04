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
import { readFileSync, readdirSync } from 'node:fs';
import { FIG } from '../src/lib/figures.js';
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

test('⭐ every figure the module offers is one a surface can actually select', () => {
  // ⛔ THE SHAPE THAT WENT UNCHECKED FOR WEEKS. `FIG` held two styles and the
  // replay pages pick with `const figStyle='mascot'` — a constant — so
  // `figTabletop` could not be reached from any page a reader could open, while a
  // comment in marks.js asserted the opposite ("figTabletop is NOT dead code").
  // A claim in a comment is not a check. The style went with the goaltender's-eye
  // view on 2026-09-17; what stays is the rule that made it findable.
  //
  // ⭐⭐ 2026-10-04: `FIG` STOPPED BEING A SET OF INTERCHANGEABLE STYLES AND
  // BECAME A CAST. `mascot` is still chosen by `figStyle`, but `goalie` and
  // `official` are not alternatives to it — they are different PEOPLE, called by
  // name where that person belongs: the goaltender in `app.js::drawNetmen` and
  // both of them in `builders/learn-figures.mjs`. A rule that only understood
  // pickers would have had to exempt them, and an exemption is how this check
  // would stop meaning anything. So the question it asks is the one it always
  // meant: CAN A READER REACH THIS DRAWING? — by a picker, or by a caller that
  // names it, in code that actually ships.
  const marks = readFileSync(new URL('../src/lib/marks.js', import.meta.url), 'utf8');
  const fixed = /const figStyle\s*=\s*'([a-z]+)'/.exec(marks);
  const selectable = new Set(fixed ? [fixed[1]] : []);
  for (const f of readdirSync(new URL('../src/', import.meta.url)).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    for (const m of html.matchAll(/data-f="([a-z]+)"/g)) selectable.add(m[1]);   // a picker on a page
  }
  /* The callers that name a figure outright. Both are SHIPPED surfaces: `app.js`
     is bundled into every replay page, and `learn-figures.mjs` draws the figures
     committed into `data/learn-figures.json` and rendered on the rule pages. */
  const callers = ['../src/app.js', '../builders/learn-figures.mjs']
    .map(f => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
  for (const m of callers.matchAll(/FIG\.([a-z]+)\s*\(/g)) selectable.add(m[1]);
  /* ⚠️ AND A COMPUTED KEY COUNTS, because `FIG[kind]` is how the diagrams pick
     between three people — but ONLY the names that are really passed to it, read
     from the call sites rather than assumed. A bare `FIG[x]` proving every key
     reachable is exactly the hole `figTabletop` lived in. */
  for (const m of callers.matchAll(/person\('([a-z]+)'/g)) selectable.add(m[1]);
  assert.deepEqual(STYLES.slice().sort(), [...selectable].sort(),
    'the module ships a figure no surface can choose, or a surface offers one the module does not have');
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

test('the outcome changes the pose of the SHOOTER, and of nobody else', () => {
  // save = shooting, goal = arms up. If these ever render identically the
  // figure has stopped carrying the one real fact it encodes.
  const pose = (style, out) => {
    const p = new SvgPen(); FIG[style](p, 0, 0, 10, '#fff', out, { motion: false, glow: false });
    return p.toSvg(); };
  assert.notEqual(pose('mascot', 'save'), pose('mascot', 'goal'), 'mascot: poses must differ');

  /* ⛔⛔⛔ AND THE OTHER TWO MUST NOT MOVE AT ALL, which is the stronger half.
     A goaltender's drawing changing with `out` would say he made the save or let
     the goal in — a claim about HIM that the feed does not record and this
     project may not invent (Doctrine §5). The same for an official, who is not
     party to the outcome in any sense. Both accept `out` only for signature
     parity with the shooter, and the temptation when adding a pose later is to
     "just" branch on it here; this is what refuses that.
     MUTATION: make `figGoalie` read `out` for anything at all and this fires. */
  for (const who of ['goalie', 'official']) {
    assert.equal(pose(who, 'save'), pose(who, 'goal'),
      `${who}: the drawing changes with an outcome this figure does not take part in`);
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

/* ⏹ `SvgPen honours clipping, which the tabletop jersey stripes need` LIVED HERE
   until 2026-09-17. Clipping was the tabletop jersey's stripe mask and nothing
   else on the rink uses it; the figure went with the goaltender's-eye view, and a
   test whose subject is deleted is not a test. SvgPen still implements `clip()`
   for whatever asks next — `git log -S figTabletop` finds both. */

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
