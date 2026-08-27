/**
 * ⭐ THE LAYER BOX — one grammar, five fillings. docs/below-the-rink-2.md §31.
 *
 * Kevin: "the layer information/counters should live [below the rink]. The
 * requirement is that the space utilization is consistent so the graphics don't
 * adjust based on which layer is selected."
 *
 * The strong reading of that requirement is not "reserve the tallest box" — the
 * five parked outputs ranged from two numbers to sixteen rows — it is that every
 * layer fills the SAME FOUR SLOTS: a figure per club, what is counted, and one
 * line naming the population or condition. Constant height then follows from
 * constant content rather than from a magic number, and the layers become
 * comparable to each other as a side effect.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, app, PAGE_CSS, rich } from './helpers/page.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { danger } from '../src/lib/layers/danger.js';
import { shootingTeam } from '../src/lib/attribution.js';

const CTX = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const AID = rich.teams.away.id, HID = rich.teams.home.id;
const pick = (a, l) => a.$$('#rg .pk').find(b => b.dataset.l === l).click();
const box = a => ({ a: a.$('lxA').textContent, k: a.$('lxK').textContent,
                    h: a.$('lxH').textContent, n: a.$('lxN').textContent });

test('every layer fills the same four slots, and the base view fills only the line', () => {
  const a = boot();
  a.$('play').click();                       // the box needs a playhead to count from
  for (const l of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle']) {
    pick(a, l);
    const b = box(a);
    assert.ok(b.k, `${l} does not say what it is counting`);
    assert.ok(b.n, `${l} does not name the population its figures were counted over`);
  }
  // ⛔ AND THE BASE VIEW CARRIES NO METRIC. Shots on goal was proposed for this
  // slot and refused (§31.6): `Just events` means NO METRIC, so a figure here
  // would mislabel the chip and turn Doctrine §6 from a structure into a
  // convention. The line is about the interface, which is a `display:` claim.
  pick(a, 'none');
  const b = box(a);
  assert.equal(b.a + b.k + b.h, '', 'the base view is showing a metric — `Just events` means none');
  assert.ok(b.n, 'the base view says nothing at all, so the box reads as broken rather than empty');
});

/**
 * ⭐ EVERY COLUMN IS COUNTED BY THE CLUB THAT SHOT THE PUCK (§31.4b) — and this
 * is the check that matters, because the wrong answer looks entirely right.
 *
 * `blocked.js` tallies by the BLOCKER's club, correct for its own panel. Over
 * 262 in-scope games the two readings name DIFFERENT clubs as leader in 245 of
 * 247 decided games — 99.2% — because your blocks are of their shots. So this
 * recomputes the expected split from the reducer's `counted` ids through
 * `shootingTeam`, and asserts the page agrees with THAT and not with `t`.
 *
 * THE PATH IS INDEPENDENT (H1): the expected values come from the library
 * reducer plus the attribution helper, never from the page's own arithmetic.
 */
test('blocked counts by the shooter, not by the blocker', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'blocked');

  const B = blocked.reduce(rich.events, CTX);
  const byShooter = { [AID]: 0, [HID]: 0 };
  for (const id of B.counted) {
    const t = shootingTeam(rich.events[id], rich.roster);
    if (byShooter[t] != null) byShooter[t]++;
  }
  const b = box(a);
  assert.equal(b.a, String(byShooter[AID]), 'the away column is not the away club\'s blocked attempts');
  assert.equal(b.h, String(byShooter[HID]), 'the home column is not the home club\'s blocked attempts');

  // ⭐ AND THE TWO READINGS REALLY DO DISAGREE IN THIS FIXTURE, so the check
  // above is capable of failing. Without this the test would pass on a game
  // where blocker and shooter happen to give the same pair.
  assert.notDeepEqual([B.t[AID], B.t[HID]], [byShooter[AID], byShooter[HID]],
    'the two attributions agree here, so this fixture cannot tell them apart — '
    + 'the check is a tautology on this game and needs a different one');

  // The columns SUM to the population, which the blocker reading cannot do:
  // a block by a teammate is credited to nobody, 8.3% of blocks archive-wide.
  assert.equal(byShooter[AID] + byShooter[HID], B.counted.length,
    'counted by shooter the columns no longer sum to the blocked attempts');
});

test('the slot counts by the shooter too, and names its denominator', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'slot');

  const D = danger.reduce(rich.events, CTX);
  const exp = { [AID]: 0, [HID]: 0 };
  for (const id of D.counted) {
    const t = shootingTeam(rich.events[id], rich.roster);
    if (exp[t] != null) exp[t]++;
  }
  const b = box(a);
  assert.equal(b.a, String(exp[AID]));
  assert.equal(b.h, String(exp[HID]));
  // A count with no denominator is the defect this project names everywhere
  // else; the line carries the attempts the slot shots are a subset of.
  assert.match(b.n, /Of \d+ attempts so far/, 'the slot figures name no population');
});

/**
 * ⭐ GOALTENDING IS THE ONE LAYER THAT CANNOT OBEY THE COLUMN RULE, and says so.
 *
 * A save is by definition against the OTHER club's shot. CHENG raised it as a
 * subject flip; the harder half is arithmetic — 12.2% ±1.4 of in-scope games use
 * more than two goaltenders (n=2,096), one in eight, so a form assuming two
 * would be wrong more often than a shootout happens. The row therefore counts
 * the CLUB's goaltending and the line names who was in net, which is where
 * relief shows up for free.
 */
test('goaltending counts the club, keeps a fraction, and says which way it reads', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'goaltending');
  const b = box(a);

  assert.match(b.a, /^\d+ of \d+$/, 'the away figure is not a fraction');
  assert.match(b.h, /^\d+ of \d+$/, 'the home figure is not a fraction');
  assert.doesNotMatch(b.a + b.h, /%|\.\d/, 'a rate reached the row — a fraction carries its own denominator');
  /* ⭐ AND THE FLIP IS STATED IN THE CAPTION, NOT IN THE BOX — checked HERE so
     the claim cannot simply vanish. It is a property of the LENS (true before
     the puck drops), and §27.1 puts those under the selector; the box says what
     is true NOW. The move was forced by measurement rather than chosen: this
     line's length is DATA (two names, plus "then X" on a relief), so it ran to
     three lines at 360 and was clipped by the fixed height. */
  assert.match(a.$('lcap').innerHTML, /opposite way round/i,
    'nothing tells the reader that the goaltending columns invert — it is not in '
    + 'the box (correctly) and now it is not in the caption either');
  assert.doesNotMatch(b.n, /opposite way round/i,
    'the flip warning is back in the box, whose sentence has to fit two lines at 360');

  // The goaltenders are NAMED, which is the only place relief can appear.
  for (const gid of rich.goalies) {
    const p = rich.roster[gid];
    if (p) assert.ok(b.n.includes(p.nm), `${p.nm} faced shots and is not named`);
  }
});

/**
 * ⭐ STOPPAGES DEGRADES TO THE CENTRE COLUMN, and the degradation is the honest
 * part. A stoppage carries `rsn` and nothing else — no team, no player, no
 * coordinates — so a per-club figure would be an attribution the feed does not
 * contain. The form holds while the content admits it has no sides.
 */
test('stoppages fills the centre alone and says why it has no sides', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'whistle');
  const b = box(a);
  assert.equal(b.a, '', 'a club figure appeared for stoppages, which carry no club');
  assert.equal(b.h, '', 'a club figure appeared for stoppages, which carry no club');
  assert.match(b.k, /^\d+ STOPPAGES?$/, 'the centre does not carry the count');
  assert.match(b.n, /no club|no sides/i, 'the row does not say why the columns are empty');
});

/**
 * ⭐ NOTHING IS COUNTED BEFORE THE FIRST EVENT. Zeroes would be a claim, not a
 * blank — the same rule that stops the split bar drawing a proportion over an
 * empty population, where 0 read as a finding.
 */
test('the pre-game frame counts nothing rather than counting zero', () => {
  const a = boot();
  pick(a, 'corsi');
  const b = box(a);
  assert.equal(b.a, '', 'the box asserts a count before a puck has been dropped');
  assert.equal(b.h, '');
  assert.ok(b.k, 'the box does not even say what it will count');
  assert.match(b.n, /nothing has been counted/i);
});

test('the box is a constant height and the caption clears it from one source', () => {
  assert.match(PAGE_CSS, /#rg\{--lboxh:\d+px;--rinkpad:\d+px\}/,
    'the box height and the rink padding are not both single named values');
  assert.match(PAGE_CSS, /#rg \.lbox\{[^}]*[;{]height:var\(--lboxh\)/,
    'the box does not take the shared height, so it can grow with its content');
  // ⚠️ AND `min-height` IS NOT `height`. The first version of this regex matched
  // inside `min-height:var(--lboxh)`, so the mutation that lets the box grow
  // with its content — the exact failure Kevin's requirement forbids — left this
  // test green. A separator before the property is what makes it a distinction.
  assert.doesNotMatch(PAGE_CSS, /#rg \.lbox\{[^}]*min-height:var\(--lboxh\)/,
    'the box has a MINIMUM height, not a fixed one — it will grow with the layer');
  // ⚠️ BOTH TERMS, BECAUSE ONE OF THEM WAS MISSING AND IT SHOWED. `bottom` is
  // measured from the padding box of `.rinkbox`, so clearing the layer box needs
  // the rink's own padding as well — without it the pill sat 4px INTO the box,
  // measured in a browser. Two named values, no arithmetic anyone has to redo.
  assert.match(PAGE_CSS, /#rg \.caption\{[^}]*bottom:calc\(var\(--lboxh\) \+ var\(--rinkpad\) \+ 6px\)/,
    'the caption pill does not clear the box by the box height plus the rink padding');
  assert.match(PAGE_CSS, /#rg \.rinkbox\{[^}]*padding:var\(--rinkpad\)/,
    'the rink box no longer takes the padding the caption is compensating for');
  // ⚠️ TWO LINES RESERVED, NOT ONE. "Constant" means across LAYERS at a width,
  // which is what was asked for; the population sentence wraps at 360 and not
  // at 1100, so one reserved line would make the box jump between widths and
  // clamping would truncate a sentence about the figures beside it.
  assert.match(PAGE_CSS, /#rg \.lxn\{[^}]*min-height:calc\(2 /,
    'the second line no longer reserves two lines, so a wrap changes the height');
  assert.doesNotMatch(PAGE_CSS, /#rg \.lxn\{[^}]*(line-clamp|text-overflow)/,
    'the population line truncates — a box that hides part of a sentence about '
    + 'the numbers beside it is worse than a taller box');
});

/**
 * ⚠️ AND THE BOX STAYS OFF THE FRONT DOOR.
 *
 * `.rinkbox` becomes a flex COLUMN in preview and `#rg.preview .rinkbox svg`
 * needs the svg to be a direct flex child — so a block added inside does not
 * stack under the rink, it becomes a flex sibling and eats the ice. Measured
 * before the rule existed: the box took **70px of a 90px ice at 390** on the
 * home page, and 168px afterwards. The stylesheet asks in capitals that anything
 * added inside `.rinkbox` answer this question; the answer only turned up by
 * LOOKING at the hero, which is why it is pinned here rather than remembered.
 *
 * The hero loses nothing: its scoreboard already carries the attempts on
 * `.cbar`, which is the same information in the space a 146px frame has.
 */
test('the layer box does not reach the front-door hero', () => {
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const hides = [...css.matchAll(/([^{}]*)\{[^}]*display:none[^}]*\}/g)]
    .flatMap(m => m[1].split(',').map(x => x.trim()));
  assert.ok(hides.includes('#rg.preview .lbox'),
    'the layer box is not hidden in preview — it becomes a flex sibling of the '
    + 'ice and letterboxes the hero');

  // ⭐ AND IT IS STILL SHOWN ON THE GAME PAGE, because "hidden in preview" is
  // also satisfied by hiding it everywhere — the mistake that would make this
  // whole build invisible while this assertion stayed green.
  assert.ok(!hides.includes('#rg .lbox'),
    'the box is hidden on the game page too, so the layer output is gone');
});
