/**
 * WHO WAS ON THE ICE — and the only check that can tell a right answer from a
 * plausible one.
 *
 * ⛔⛔ COUNTING HEADS CANNOT DO IT. `s <= t < e` gives five a side on 95.9% of
 * goals and names the right five one time in six (`docs/layer-ideas.md` §4.2).
 * A page built on it would look correct on every frame a reader could check by
 * counting, and be wrong about the names — which are the only thing it shows.
 * So the instrument here asks whether the players THE EVENT ITSELF NAMES are in
 * the set, and it runs the two wrong conventions beside the right one so the
 * comparison is in the file rather than in a memory of it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { onIce } from '../src/lib/onice.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const DIR = new URL('../test/fixtures/extracts/', import.meta.url);
const GAMES = [rich, ...readdirSync(DIR).filter(f => /^\d+\.json$/.test(f))
  .map(f => JSON.parse(readFileSync(new URL(f, DIR), 'utf8')))]
  .filter(g => g.shifts && g.shifts.length);

/** The same resolution under an arbitrary interval rule, for the comparison. */
const under = (game, sec, keep) => {
  const ids = new Set();
  for (const r of game.shifts) if (keep(r, sec)) ids.add(r.p);
  return ids;
};
const RULES = {
  'closed  s <= t <= e': (r, t) => r.s <= t && t <= r.e,
  'half    s <= t <  e': (r, t) => r.s <= t && t < r.e,
  'ours    s <  t <= e': (r, t) => r.s < t && t <= r.e,
};

test('⛔⛔ the interval rule is chosen by WHOSE NAMES it gets right, not by the count', () => {
  const named = [];
  for (const g of GAMES)
    for (const e of g.events)
      if (e.type === 'goal' && e.actor != null && e.pt !== 'SO')
        named.push([g, e, [e.actor, e.a1, e.a2].filter(x => x != null)]);
  assert.ok(named.length >= 20, `only ${named.length} goals with named players — too few to choose a rule`);

  /* ⛔⛔ AND THE MODULE ITSELF IS ONE OF THE THREE, which the first draft of this
     test got wrong. It scored all three rules with the local `under()` helper —
     so it proved which convention is best and asserted NOTHING about the one
     `onIce` uses. Mutating the module to the catastrophic rule broke no test.
     A comparison that does not include the subject is a comparison about
     nothing. */
  const score = {};
  for (const [label, keep] of Object.entries(RULES)) {
    let right = 0;
    for (const [g, e, who] of named) {
      const on = under(g, e.s, keep);
      if (who.every(id => on.has(id))) right++;
    }
    score[label] = right / named.length;
  }
  let byModule = 0;
  for (const [g, e, who] of named) {
    const on = onIce(g, e);
    const ids = new Set([...on.away.skaters, ...on.away.goalies,
                         ...on.home.skaters, ...on.home.goalies].map(p => p.id));
    if (who.every(id => ids.has(id))) byModule++;
  }
  const mine = byModule / named.length;
  assert.ok(mine > 0.9,
    `onIce names every credited player on only ${(mine * 100).toFixed(1)}% of goals — `
    + 'it is not using the convention this test chose');
  assert.ok(Math.abs(mine - score['ours    s <  t <= e']) < 0.01,
    'onIce does not agree with `s < t <= e`, which is the rule it claims to implement');

  // ⭐ OURS IS THE BEST, AND THE HALF-OPEN RULE IS CATASTROPHICALLY WORSE —
  // which is the claim, because it is the one a reasonable person writes first.
  assert.ok(score['ours    s <  t <= e'] > 0.9,
    `our rule names every credited player on only ${(score['ours    s <  t <= e'] * 100).toFixed(1)}% of goals`);
  assert.ok(score['half    s <= t <  e'] < 0.5,
    `the half-open rule scored ${(score['half    s <= t <  e'] * 100).toFixed(1)}% — if it is no `
    + 'longer catastrophic this comparison has stopped being the reason for the choice');
  assert.ok(score['ours    s <  t <= e'] - score['half    s <= t <  e'] > 0.4,
    'the two conventions have converged, and the module comment is describing a world that ended');
});

test('⛔⛔ AT A FACEOFF the arriving line is the one on the ice — found by LOOKING, not by testing', () => {
  /* ⭐⭐ THE DEFECT A 360px SCREENSHOT FOUND AND NO TEST COULD. The active-player
     line read *"#14 Eriksson Ek won the draw"* and the roster below it did not
     contain him: at a faceoff the shift chart ENDS the old line at `t` and
     STARTS the new one at `t`, and `s < t <= e` picks the line that is leaving.
     Measured over 87 games — the player the event names is absent from
     **57.6%** of faceoffs under the mid-play rule and **0.0%** under the
     arriving one.

     ⚠️ AND BOTH GIVE A PLAUSIBLE COMPLEMENT ON 100% OF FRAMES. This is §4.2's
     trap one level down: no count check can choose between them, so the page
     would have contradicted itself on more than half of all faceoff frames
     while every head a reader could count came out right. */
  let n = 0, absent = 0, mid = 0;
  for (const g of GAMES)
    for (const e of g.events) {
      if (e.type !== 'faceoff' || e.actor == null || e.pt === 'SO') continue;
      const on = onIce(g, e);
      const ids = new Set([...on.away.skaters, ...on.away.goalies,
                           ...on.home.skaters, ...on.home.goalies].map(p => p.id));
      if (!ids.size) continue;
      n++;
      if (!ids.has(e.actor)) absent++;
      // The mid-play rule, run beside it so the reason for the split is IN the file.
      const midIds = under(g, e.s, (r, t) => r.s < t && t <= r.e);
      if (!midIds.has(e.actor)) mid++;
    }
  assert.ok(n > 100, `only ${n} faceoffs examined`);
  assert.ok(absent / n < 0.02,
    `the draw winner is missing from ${(absent / n * 100).toFixed(1)}% of faceoff rosters`);
  assert.ok(mid / n > 0.3,
    `the mid-play rule now misses only ${(mid / n * 100).toFixed(1)}% of draw winners — if the `
    + 'two conventions have converged, the split in onice.js is no longer earned');
});

test('⭐ the module returns a plausible complement, and says which side each name is on', () => {
  let frames = 0, plausible = 0;
  for (const g of GAMES)
    for (const e of g.events) {
      if (e.pt === 'SO' || e.x == null) continue;
      const on = onIce(g, e);
      frames++;
      const a = on.away.skaters.length, h = on.home.skaters.length;
      if (a >= 3 && a <= 6 && h >= 3 && h <= 6) plausible++;
      // NOBODY IS ON BOTH BENCHES, which a naive team test would allow.
      const ids = new Set([...on.away.skaters, ...on.home.skaters].map(p => p.id));
      assert.equal(ids.size, a + h, 'a player is listed twice, or for both clubs, at one second');
      /* ⛔ AND A GOALTENDER IS NEVER A SKATER, which the count check cannot see:
         folding him in gives six a side, and six a side is inside every
         plausible range because it is what a pulled goalie looks like. Proven by
         mutation — the count assertion above passed with goalies folded in. */
      for (const p of [...on.away.skaters, ...on.home.skaters])
        assert.notEqual(p.pos, 'G', `#${p.n} ${p.nm} is a goaltender listed as a skater`);
      for (const p of [...on.away.goalies, ...on.home.goalies])
        assert.equal(p.pos, 'G', `#${p.n} ${p.nm} is a skater listed as a goaltender`);
    }
  assert.ok(frames > 500, `only ${frames} frames examined`);
  assert.ok(plausible / frames > 0.9,
    `only ${(plausible / frames * 100).toFixed(1)}% of frames give 3-6 skaters a side`);
});

test('⛔ a second is ABSOLUTE game seconds — the bug that cost 33 points of coverage', () => {
  /* ⚠️ FOUND 2026-09-10: `event.s` is already absolute — period two opens at
     1200 — and adding `(per - 1) * 1200` to it resolved 65.6% of attempts to a
     plausible complement instead of 98.6%. A wrong clock produces an EMPTY set,
     not an error, so this pins the fact rather than trusting it. */
  const g = GAMES[0];
  const p2 = g.events.find(e => e.per === 2 && e.x != null);
  assert.ok(p2.s >= 1200, `period two events do not carry absolute seconds (s=${p2.s})`);
  const right = onIce(g, p2).home.skaters.map(x => x.id).sort().join(',');
  assert.ok(right.length, 'the absolute second finds nobody');
  /* ⚠️ AND THE NON-VACUITY HAD TO BE FIXED TOO: a doubled clock lands in a LATER
     PERIOD, which still has players on the ice, so "finds nobody" was never the
     symptom. The symptom is finding the WRONG people — silently. */
  const doubled = onIce(g, { ...p2, s: p2.s + 1200 }).home.skaters.map(x => x.id).sort().join(',');
  assert.notEqual(doubled, right,
    'a doubled clock returns the same players, so this test cannot detect the bug it names');
  // AND PAST THE FINAL BUZZER THERE IS NOBODY, which is the other direction.
  const last = Math.max(...g.shifts.map(r => r.e));
  assert.equal(onIce(g, { s: last + 60, type: 'shot-on-goal' }).home.skaters.length, 0,
    'players are on the ice after the game');
});

test('⛔ no shifts is an EMPTY list, never a wrong one', () => {
  // 3 of 87 published extracts carry no shifts. A surface must show nothing
  // rather than a confident wrong answer.
  const bare = { ...GAMES[0], shifts: [] };
  const on = onIce(bare, { s: 600, type: 'shot-on-goal' });
  assert.deepEqual(on.away.skaters, []);
  assert.deepEqual(on.home.goalies, []);
  assert.deepEqual(onIce(undefined, { s: 600 }).home.skaters, [], 'a missing game threw or guessed');
});
