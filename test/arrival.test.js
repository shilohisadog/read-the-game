/**
 * THE MOMENT OF ARRIVAL — does each kind of play land in its own way?
 *
 * Every event used to arrive identically: one `pop`, 0.34s, one easing, with a
 * single exception for the goal. A hit, a giveaway, a takeaway and a blocked
 * shot all simply appeared, and those four feel nothing alike in a building.
 *
 * TWO THINGS HAVE TO BE TRUE AND ONLY ONE OF THEM IS ABOUT THE MARKUP. A class
 * naming an animation that the stylesheet does not define is a page that renders
 * NOTHING while every DOM assertion about it passes — this project has shipped
 * that exact shape before (an SVG mask whose probe read `opacity="0.42"` off an
 * element drawing nothing at all). So the classes are checked against the CSS,
 * not only against the renderer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, rich, PAGE_CSS } from './helpers/page.js';

/**
 * ⭐ HAND-WRITTEN, NOT READ OUT OF `ARRIVE`.
 *
 * Parsing the map out of app.js and then checking the page agrees with it would
 * be a mirror — one path to the expected value, straight through the code under
 * test, and any mutation moves both sides together. This table is the intent,
 * stated once, in a second place, by a person. Everything absent from it must
 * land on `pop`.
 */
const EXPECT = {
  goal: 'flare',            // the biggest thing the renderer does
  hit: 'jolt',              // lands hard and recoils
  'blocked-shot': 'halt',   // comes in fast and stops dead
  takeaway: 'snatch',       // pulled inward, decisive
  giveaway: 'slip',         // the only one with no snap at all
};
const NAMES = [...new Set([...Object.values(EXPECT), 'pop'])];

/** The animation token on the mark being played this frame. */
function arrivalOf(d) {
  const cls = [...d.$('events').innerHTML.matchAll(/class="(ev[^"]*)"/g)].map(m => m[1]);
  const cur = cls.filter(c => /\bcur\b/.test(c));
  if (cur.length !== 1) return null;          // no current mark drawn this frame
  const hit = NAMES.filter(n => new RegExp(`\\b${n}\\b`).test(cur[0]));
  return hit.length === 1 ? hit[0] : `AMBIGUOUS:${cur[0]}`;
}

test('every arrival the renderer names is actually defined in the stylesheet', () => {
  for (const n of NAMES) {
    assert.match(PAGE_CSS, new RegExp(`#rg \\.${n}\\{animation:${n} `),
      `nothing binds the \`${n}\` class to an animation — the mark would arrive silently`);
    assert.match(PAGE_CSS, new RegExp(`@keyframes ${n}\\{`),
      `\`${n}\` names keyframes that do not exist — the class is decoration`);
  }
});

test('each kind of play lands in its own way, across the whole game', () => {
  // COVERAGE, NOT A SAMPLE. A spot check on one hit says nothing about whether
  // the mapping holds; walking the game means every type present in the fixture
  // is exercised, and the tally below proves the walk actually reached them.
  const a = boot();
  a.$('play').click();
  const EV = rich.events.filter(e => !['stoppage', 'period-start', 'period-end',
    'game-end', 'delayed-penalty'].includes(e.type));
  const seen = {};
  for (let k = 0; k < EV.length; k++) {
    if (!a.advance(1)) break;
    const i = Number(a.$('scrub').value);
    if (i < 0 || !EV[i]) continue;
    const type = EV[i].type, want = EXPECT[type] || 'pop', got = arrivalOf(a);
    if (got === null) continue;               // unlocated play: nothing on the ice
    assert.equal(got, want,
      `a ${type} arrived as \`${got}\` — it should land as \`${want}\``);
    seen[type] = (seen[type] || 0) + 1;
  }
  // THE TRIPWIRE ON THE WALK ITSELF. Every assertion above is inside a loop that
  // a dead play loop would skip entirely, and a test that asserts nothing passes.
  for (const type of Object.keys(EXPECT))
    assert.ok(seen[type] > 0, `the walk never reached a ${type} — it proved nothing about one`);
  assert.ok(Object.keys(seen).length > Object.keys(EXPECT).length,
    'the walk never reached a play that should fall through to `pop`');
});
