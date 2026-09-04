/**
 * ⭐⭐ EVERY MARK ON THE ICE, CALLED DIRECTLY.
 *
 * This is the most-looked-at surface on the site and it spent its life inside a
 * 328-line function, reachable only by booting a page. Now it is a function that
 * takes events and returns SVG, so its rules can be stated as claims rather than
 * inferred from a rendered blob.
 *
 * `test/dom-golden.test.js` pins what it RENDERS across four walks. This asserts
 * what it MEANS — and one of these is a seam the extraction exposed rather than
 * created, which nothing anywhere was checking.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { eventMarks } from '../src/lib/marks.js';
import { isHighDanger, attackDirection } from '../src/lib/rink.js';
import { shootingTeam } from '../src/lib/attribution.js';

const G = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
const R = G.roster, HID = G.teams.home.id, AID = G.teams.away.id;

/* The three functions the module cannot compute for itself. Stand-ins, not the
   app's own — a test that reused `place` would be checking the page's transform
   rather than this module's use of one. */
const helpers = {
  place: e => (e.x == null ? null : { x: 100 + e.x, y: 42.5 - e.y }),
  tk: e => (e.own === AID ? 'a' : 'h'),
  isHD: e => {
    const t = shootingTeam(e, R);
    return isHighDanger(e.x, e.y, t == null ? 1 : attackDirection(t, HID));
  },
};
const game = { AID, HID, R, AWAYCOL: '#111', HOMECOL: '#eee', FIG_SZ: 9, FIG_BIG: 11.5 };
const VIEW = { hdOn: false, trails: 'off', asPlayed: true, reduced: true, t: 0 };

const draw = (n, view = {}, frame = {}) => {
  const evs = G.events.slice(0, n + 1);
  return eventMarks({ evs, i: n, cur: evs[n], moment: false, ...frame },
                    { ...VIEW, ...view }, game, helpers);
};
const count = h => (h.match(/class="[^"]*\bev\b/g) || []).length;

test('⭐ there is a game to draw', () => {
  assert.ok(G.events.length > 200, 'the fixture is not loading');
  assert.ok(count(draw(200, { trails: 'all' })) > 20, 'nothing is being drawn at all');
});

test('⭐⭐ every mark carries the index of the event it is drawn for', () => {
  /* ⛔ THE SEAM THIS EXTRACTION EXPOSED, AND NOTHING WAS CHECKING IT. The
     why-popup opens on `EV[+t.dataset.i]` — the index it reads out of the mark
     the viewer clicked. So `data-i` is not decoration: it is the join between two
     modules that no longer share a scope. A mark with the wrong index opens the
     wrong shot's popup, and every figure on the card would be internally
     consistent and about a different event entirely. Nothing about the page would
     look broken. */
  const n = 200, evs = G.events.slice(0, n + 1);
  const html = draw(n, { trails: 'all', hdOn: true });

  for (const m of html.matchAll(/data-i="(\d+)"[^>]*cx="(-?[\d.]+)"/g)) {
    const [, idx, cx] = m;
    const e = evs[+idx];
    assert.ok(e, `a mark carries data-i="${idx}", which is not an event in the slice`);
    assert.equal(+cx, +helpers.place(e).x.toFixed(1),
      `the mark with data-i="${idx}" is drawn at ${cx}, which is not where event ${idx} happened`);
  }
});

test('⭐ Current moment draws one event; Keep every mark draws the rest', () => {
  const one = count(draw(200));
  const all = count(draw(200, { trails: 'all' }));
  assert.ok(one <= 2, `"current moment" drew ${one} marks, so the filter is not applying`);
  assert.ok(all > 20, `"keep every mark" drew only ${all}`);
});

test('⛔ …and as-played clears the ice at a period change', () => {
  /* ⭐ THE BRANCH THAT HAD NEVER EXECUTED UNTIL 2026-09-04. `if (ASPLAYED &&
     trails==='all' && e.per !== cur.per) continue;` — no walk in the fixture ever
     moved the trails control off its default, so this line had no coverage of any
     kind. The rule it enforces is real: accumulated marks are team-attributed and
     direction-dependent, so keeping them across a period change draws one club's
     attempts at BOTH ends and the shot chart becomes a map of the building. */
  const n = G.events.findIndex(e => e.per === 2 && e.x != null);
  assert.ok(n > 0, 'the fixture has no second period, so this proves nothing');

  const asPlayed = draw(n, { trails: 'all', asPlayed: true });
  const fixed = draw(n, { trails: 'all', asPlayed: false });
  assert.ok(count(fixed) > count(asPlayed),
    `as-played drew ${count(asPlayed)} marks and fixed-ends drew ${count(fixed)}: the period `
    + 'scoping is not applying, so first-period attempts are being kept on a rink that turned over');

  for (const m of asPlayed.matchAll(/data-i="(\d+)"/g))
    assert.equal(G.events[+m[1]].per, 2,
      `a first-period mark survived into the second, at data-i="${m[1]}"`);
});

test('⭐ the slot layer rings a slot shot, and only when it is on', () => {
  const n = G.events.findIndex((e, k) => k > 0 && e.x != null && helpers.isHD(e));
  assert.ok(n > 0, 'no slot shot in the fixture');
  assert.match(draw(n, { hdOn: true }), /class="ring hd"/,
               'the slot layer is on and the shot is not ringed');
  assert.doesNotMatch(draw(n, { hdOn: false }), /class="ring hd"/,
                      'a slot ring was drawn with the layer off');
});

test('⭐ a blocked shot is ringed where the puck STOPPED, not where it was aimed', () => {
  const n = G.events.findIndex(e => e.type === 'blocked-shot' && e.x != null);
  assert.ok(n > 0, 'no blocked shot in the fixture');
  assert.match(draw(n), /class="ring blk"/, 'the blocked-shot ring is gone');
});
