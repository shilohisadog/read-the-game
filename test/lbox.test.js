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
import { readFileSync } from 'node:fs';
import { boot, app, PAGE_CSS, rich } from './helpers/page.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { danger } from '../src/lib/layers/danger.js';
import { shootingTeam } from '../src/lib/attribution.js';

const CTX = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
const AID = rich.teams.away.id, HID = rich.teams.home.id;
const pick = (a, l) => a.$$('#rg .pk').find(b => b.dataset.l === l).click();
const box = a => ({ a: a.$('lxA').textContent, k: a.$('lxK').textContent,
                    h: a.$('lxH').textContent, n: a.$('lxN').textContent,
                    as: a.$('lxAn').textContent, hs: a.$('lxHn').textContent });

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
 * ⭐ BLOCKS ARE COUNTED BY THE BLOCKER — the standard attribution.
 *
 * Kevin: "blocked shots is quite a common stat that gets broadcast on every
 * hockey platform possible, all of them attribute the block to the defending
 * team." Right, and the layer's own audit said so first:
 * `docs/blocked-shots-layer.md` §6 specifies the blocker is named and that
 * teammate blocks are excluded — which is only meaningful under blocker credit.
 * The box had been counting the shooting club, on a consistency rule invented a
 * day earlier, while the panel, the ice and every broadcast said the other one.
 *
 * THE PATH IS INDEPENDENT (H1): the expected pair comes from the library
 * reducer, never from the page's arithmetic.
 */
test('blocks are credited to the club that made them', () => {
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
  assert.equal(b.a, String(B.t[AID]), 'the away column is not the away club\'s blocks');
  assert.equal(b.h, String(B.t[HID]), 'the home column is not the home club\'s blocks');

  /* ⭐ AND THE OTHER ATTRIBUTION REALLY IS DIFFERENT IN THIS FIXTURE, so the
     check above can fail. Over 262 games the two readings name different clubs
     as leader in 245 of 247 decided games — but a test has to prove it of the
     game it actually runs on, or it is a tautology wearing a citation. */
  assert.notDeepEqual([B.t[AID], B.t[HID]], [byShooter[AID], byShooter[HID]],
    'the two attributions agree on this game, so this check cannot tell them apart');

  /* ⭐ AND THE GAME-LEVEL FACT NEEDS NO ATTRIBUTION AT ALL. How many attempts
     never got through belongs to the GAME, not to either club — which is what
     lets the layer teach the site's thesis without borrowing a club's column
     to do it. It is also why the two figures need not sum to it: a block by a
     teammate is credited to neither, 7.8% of blocks. */
  assert.match(b.n, new RegExp(`${B.counted.length} were stopped by a body`),
    'the line does not carry the count of attempts a body stopped');
  assert.match(a.$('lcap').innerHTML, /teammate is credited to neither/,
    'nothing explains why the two figures need not add up to the total');
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

  /* ⭐ EACH GOALTENDER UNDER HIS OWN CLUB'S FIGURE. Kevin: "it shows both goalies
     under the left hand count, where they should be separated and each under
     their specific count." The shared line spans the whole box, so anything
     club-specific written into it lands on the left — the grammar's fault, not
     the copy's. A layer with something to say about EACH club says it in that
     club's column. This is also where relief appears, in the 12.2% of games
     that use more than two goaltenders. */
  for (const gid of rich.goalies) {
    const p = rich.roster[gid];
    if (!p) continue;
    const mine = p.tid === AID ? b.as : b.hs, theirs = p.tid === AID ? b.hs : b.as;
    assert.ok(mine.includes(p.nm), `${p.nm} is not named under his own club's figure`);
    assert.ok(!theirs.includes(p.nm), `${p.nm} is named under the other club's figure`);
  }
  assert.equal(b.n, '', 'the shared line is also populated, so it stacks on the per-club names');
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
  /* ⭐ AND THE REASON THE COLUMNS ARE EMPTY IS IN THE CAPTION, not the box.
     It is a CONSTANT — true of every stoppage in every game — so it belongs to
     the lens (§27.1), and leaving it in the box left no room for the part that
     is DATA: "Offside" fits where "Goalie stopped play after a shot on goal"
     clips. The deploy gate found that on the reference game after a local pass
     on a different one, which is also why this asserts both halves. */
  assert.match(b.n, /Most recently|has not stopped/,
    'the box does not name the stoppage, which is the only part of this that changes');
  assert.match(a.$('lcap').innerHTML, /never a team|no club/i,
    'nothing explains why this layer has no per-club figures');
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
