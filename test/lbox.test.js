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
import { readFileSync, readdirSync } from 'node:fs';
import { boot, app, PAGE_CSS, rich } from './helpers/page.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { danger } from '../src/lib/layers/danger.js';
import { shootingTeam } from '../src/lib/attribution.js';
import { NOT_A_PLAY, isNearMiss, inShootout } from '../src/lib/layer.js';
import { parse, resolve } from '../src/lib/deeplink.js';

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

/**
 * ⭐ THE BASE PROMPT NAMES THE CONTROL, NEVER A DIRECTION.
 *
 * It read "Pick a lens ABOVE" while the selector sits below — the second stale
 * direction word in two days, after the caption told viewers to watch "the
 * counters above the rink" with those counters parked. This page has moved that
 * row three times; a sentence that points is a sentence that rots.
 *
 * So the prompt READS the selector's own heading (§27.2's rule on a second
 * surface), and this asserts the coupling rather than the string: rename the
 * heading and the prompt renames itself.
 */
test('the base prompt quotes the selector heading and points in no direction', () => {
  const a = boot();
  const n = a.$('lxN').textContent;
  const heading = /<span class="pklab">([^<]*)</.exec(app)[1];

  assert.ok(n.includes(heading),
    `the prompt does not name the control — it says "${n}" while the heading is "${heading}"`);
  assert.doesNotMatch(n, /\babove\b|\bbelow\b|\bunderneath\b|\bright\b|\bleft\b/i,
    'the prompt points in a direction, which goes stale the next time the row moves');
});

/**
 * ⭐ AND THE SHARED LINE IS CENTRED, BECAUSE IT BELONGS TO NO COLUMN.
 *
 * Kevin, on the blocked layer: "the only tweak I might suggest is to center the
 * text, instead of having it on the left (which implies association with the
 * number directly above it)." That was exactly the reading it invited. Alignment
 * is now the grammar: the shared line is centred because it is about the game,
 * and the per-club lines are aligned to their own columns because they are about
 * that club. Position says ownership.
 */
test('alignment says which column a line belongs to', () => {
  assert.match(PAGE_CSS, /#rg \.lxn\{[^}]*text-align:center/,
    'the shared line is not centred, so it reads as a caption for the away figure');
  assert.match(PAGE_CSS, /#rg \.lxan\{[^}]*text-align:left/);
  assert.match(PAGE_CSS, /#rg \.lxhn\{[^}]*text-align:right/);
});

/**
 * ⭐ AND THE STOPPAGE SAYS HOW LONG AGO, THROUGH THE FUNCTION THAT ALREADY KNOWS.
 *
 * Kevin: "didn't we used to have a time associated with the most recent event?"
 * We did — `sinceLine` was built for his earlier complaint that the card and the
 * rink described different moments (the card ran a median 29s behind the
 * playhead), and it went dark when the panel was parked. It already carries the
 * rule that matters: across a period break the difference in `s` is not an
 * elapsed time, so it says nothing rather than computing a wrong one.
 *
 * THE CHECK IS THAT THE BOX CALLS IT, not that a second copy produces the same
 * words — a re-implementation could never be checked against the first.
 */
test('the stoppage line says how long ago, and reuses the rule that knows', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'whistle');
  const n = a.$('lxN').textContent;
  assert.match(n, /P\d/, 'the stoppage line no longer says when it happened');
  assert.match(n, /\d+s earlier|\d+:\d\d earlier/,
    'the stoppage line does not say how long ago — the thing Kevin asked for');

  const body = /if\(id==='whistle'\)\{[\s\S]*?\n return none;/.exec(app);
  assert.ok(body, 'the whistle branch has moved — re-aim this check');
  assert.ok(body[0].includes('STOPPAGE'),
    'the slice does not contain the whistle branch it claims to be reading');
  assert.match(body[0], /sinceLine\(/,
    'the box computes its own elapsed time instead of calling the one function '
    + 'that knows a period break is not an interval');
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

/**
 * ⭐ SHOW ME THE WORK — ONE PANEL, DRIVEN BY THE LAYER CONTRACT.
 *
 * Measured over the reference game's 320 events before building it: all five
 * layers return `counted` + `excluded` that sum to every event, and four also
 * carry `surprising`. So this is ONE panel, not five — which is also the first
 * broad evidence the layer contract is an abstraction rather than a description
 * of two things that happened to look alike.
 */
test('the work panel explains whichever layer is on, from that layer\'s ledger', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });

  for (const [token, mod] of [['corsi', corsi], ['slot', danger],
                              ['blocked', blocked], ['whistle', whistle]]) {
    pick(a, token);
    a.$('work').click();
    /* ⚠️ `#workBody`, NOT `#workPanel` — changed 2026-08-31 when the panel became
       an overlay on the ice. The panel gained a static `Hide the work` button of
       its own (the card's copy is underneath the overlay), so `renderWork` now
       writes into a child rather than over the panel, which would delete its own
       closer on every frame. In a browser reading the parent would still see
       this markup; in this fake the two elements hold independent strings, so
       every read here had to follow the content. `hidden` is still read from
       `#workPanel`, because the PANEL is what opens and shuts. */
    const html = a.$('workBody').innerHTML;

    /* THE LEDGER COMES FROM THE REDUCER, NOT FROM THE PAGE (H1) — but the SLICE
       comes from the page, because the page decides how far the playhead has
       reached and the panel is explicitly "so far". The scrubber's last stop is
       the last PLAYABLE event, which in this game leaves two period-end records
       after it, so a full-game reduce is the wrong comparison and said so:
       320 against the panel's honest 318. What is under test is which layer's
       ledger the panel uses, and that is fully exercised on any slice. */
    const total = +/= <b>(\d+)<\/b> events/.exec(html)[1];
    const r = mod.reduce(rich.events.slice(0, total), { ...CTX, evenOnly: false });
    assert.equal(r.counted.length + r.excluded.length, total,
      `${token}: the slice taken from the panel does not close — wrong subject`);
    assert.ok(html.includes(`<span class="n">${r.counted.length}</span>`),
      `${token}'s panel does not show ITS counted total (${r.counted.length})`);

    /* ⭐ AND CONSERVATION STILL CLOSES ACROSS THE SPLIT. The excluded total is
       no longer one number on screen — the near-misses are promoted and the
       rest collapse to a count — so the check is that the three still add to
       every event, which is the claim the panel makes in words. Doctrine §9:
       the split may not weaken the accounting, only reorder it. */
    /* ⚠️ THE RULE IS IMPORTED, NOT RESTATED. This line was its own copy of
       "promoted unless `type`", so the page and the check guarding it could
       drift apart — and when the page's rule was corrected, this went red about
       the wrong thing. `isNearMiss` is the one statement, in layer.js.
       ⚠️ AND THE ARITHMETIC BELOW WAS A TAUTOLOGY: `plain` was defined as
       `excluded - near`, so the sum was `counted + excluded` however the split
       fell. It closes over the numbers THE PANEL PRINTS now, which is the claim
       the panel actually makes. */
    const near = r.excluded.filter(isNearMiss);
    const plain = r.excluded.length - near.length;
    const onPage = {
      near: +(/Close, but not counted <span class="n">(\d+)<\/span>/.exec(html) || [, 0])[1],
      plain: +(/(\d+) other events? (?:was|were) not this kind/.exec(html) || [, 0])[1],
      counted: +/Counted <span class="n">(\d+)<\/span>/.exec(html)[1],
    };
    assert.equal(onPage.counted + onPage.near + onPage.plain, total,
      `${token}: the panel's own three buckets do not close over every event`);
    if (near.length)
      assert.ok(html.includes(`<span class="n">${near.length}</span>`),
        `${token}'s panel does not show its near-miss count (${near.length})`);
    if (plain)
      assert.ok(html.includes(`${plain} other event`),
        `${token} drops ${plain} events without saying so — Doctrine §9`);

    /* ⭐ AND ITS WORDS ARE READ FROM THE ROW, NEVER RETYPED (§27.2). */
    const rowHtml = app.match(new RegExp(`<button class="lrow"[^>]*data-pick="${token}"[\\s\\S]*?</button>`))[0];
    for (const cls of ['lds', 'lat']) {
      const t = new RegExp(`<span class="${cls}">([^<]*)<`).exec(rowHtml);
      assert.ok(t, `${token}'s row has no .${cls}`);
      const words = t[1].replace(/&mdash;|&rsquo;/g, '').split(/\s+/).slice(0, 4).join(' ');
      assert.ok(html.includes(words.split(' ')[0]),
        `${token}'s panel does not quote its own row (.${cls})`);
    }
    a.$('work').click();
  }
});

/**
 * ⛔ AND STOPPAGES GETS NO "surprisingly" CARD, because it has no such bucket.
 * An empty card there would read as "none were surprising" — a claim the layer
 * never made, which is the difference between a gap and a finding.
 */
test('a layer with no surprising bucket is not given an empty one', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'whistle');
  a.$('work').click();
  assert.doesNotMatch(a.$('workBody').innerHTML, /surprisingly/i,
    'stoppages is shown a "counted, surprisingly" card it has no data for');

  pick(a, 'corsi');
  assert.match(a.$('workBody').innerHTML, /surprisingly/i,
    'no layer shows the card at all, so the check above proves nothing');
});

/**
 * ⭐ THE PANEL FOLLOWS THE SELECTOR, NOT ONE BOOLEAN. It used to close itself
 * inside `setCorsi` — right while it only explained Attempts, and wrong now:
 * switching Attempts → Slot turns `corsiOn` false, which would have shut a
 * panel that should have been redrawn against the new layer.
 */
test('the panel redraws on a layer change and closes only in the base view', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'corsi');
  a.$('work').click();
  assert.equal(a.$('workPanel').hidden, false, 'the panel did not open');
  const asCorsi = a.$('workBody').innerHTML;

  pick(a, 'slot');
  assert.equal(a.$('workPanel').hidden, false,
    'switching layers closed the panel instead of redrawing it');
  assert.notEqual(a.$('workBody').innerHTML, asCorsi,
    'the panel still explains the layer that is no longer on');

  pick(a, 'none');
  assert.equal(a.$('workPanel').hidden, true,
    'the base view has no work to show, and the panel stayed open');
});

/**
 * ⭐ THE VERIFICATION CONTROL IS REACHABLE, AND ONLY WHERE THERE IS WORK.
 *
 * ⚠️ It shipped `display:none` under four of five layers and nobody could see
 * it: `#work` still carried the rules from when it belonged to Attempts —
 * hidden by default, revealed under `.corsi`, parked with the rest. Found by
 * trying to CLICK it in a real browser, where `getComputedStyle().visibility`
 * reported "visible" beside a 0x0 box, which is what a display rule looks like
 * from a visibility check.
 *
 * ⚠️ And its first row was 8px tall, against this project's own 44px touch
 * floor — the one the R audit moved 21 of 21 controls above. A verification
 * affordance nobody can hit on a phone is the same as none.
 */
test('the work control is shown for every layer and hidden in the base view', () => {
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');

  assert.doesNotMatch(css, /#rg\.corsi #work/,
    'the work control still carries a rule keyed to one layer, so it is display:none '
    + 'under the other four');
  assert.doesNotMatch(css, /#rg [^{]*#work[^{]*\{[^}]*display:none/,
    'something hides the work control outright');

  // Hidden, not removed, in the base view — removing it would change the box's
  // height, which is the one thing the box may not do.
  assert.match(css, /#rg \.lbox\.empty \.lxw\{visibility:hidden\}/,
    'the base view either shows a control with nothing to show, or resizes the box');

  // A real target. `min-height`, so a wider font grows it rather than clipping.
  const rule = /#rg \.lxw\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the work control has no rule of its own');
  assert.match(rule[1], /min-height:(3[0-9]|[4-9][0-9])px/,
    'the work control is under the touch floor this project holds everything else to');
});

/**
 * ⚠️ ZERO IS A FIGURE. The footer built its club list with `b.h && …`, and `b.h`
 * is a NUMBER — so a club with none of something was falsy and vanished. On a
 * 1–0 slot count the line read "1 WSH." and the other club was simply not
 * there, on a panel whose closing sentence is "nothing is dropped quietly".
 *
 * THE PAIR MATTERS: Stoppages legitimately shows no club figures at all, so
 * "both clubs always appear" would be wrong. The distinction is EMPTY (a real
 * absence) against ZERO (a measured none), which truthiness cannot make.
 */
test('a club with none of something still appears in the ledger line', () => {
  const a = boot();
  // early in the game, so at least one club is on zero for the narrow layers
  a.$('scrub').oninput({ target: { value: '12' } });

  for (const token of ['corsi', 'slot', 'blocked']) {
    pick(a, token);
    a.$('work').click();
    const panel = a.$('workBody').innerHTML;
    const foot = /<p class="wfoot">([\s\S]*?)<\/p>/.exec(panel)[1];
    const b = { a: a.$('lxA').textContent, h: a.$('lxH').textContent };
    assert.ok(foot.includes(`${b.a} `), `${token}: the away figure is missing from the footer`);
    assert.ok(foot.includes(`${b.h} `), `${token}: the home figure is missing from the footer`);
    assert.match(foot, / \+ /, `${token}: the footer names only one club`);
    a.$('work').click();
  }

  // ⭐ AND STOPPAGES SHOWS NONE, because there the fields are EMPTY, not zero.
  pick(a, 'whistle');
  a.$('work').click();
  const foot = /<p class="wfoot">([\s\S]*?)<\/p>/.exec(a.$('workBody').innerHTML)[1];
  assert.doesNotMatch(foot, /^<em>/,
    'stoppages was given club figures, which the feed does not record');
});

/**
 * ⚠️ `.lds` IS A FRAGMENT — it is written to follow "Slot — " in the caption,
 * which supplies the full stop. In the panel it ran into the attribution line:
 * "between the face-off dots Credited to the club that shot."
 */
test('the panel closes the row fragment it quotes', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'slot');
  a.$('work').click();
  const html = a.$('workBody').innerHTML;
  const rowHtml = app.match(/<button class="lrow"[^>]*data-pick="slot"[\s\S]*?<\/button>/)[0];
  const lds = /<span class="lds">([^<]*)</.exec(rowHtml)[1];
  assert.ok(html.includes(lds + '.'),
    'the fragment is quoted without a full stop, so it runs into the line after it');
});

/**
 * ⚠️ `why` IS PROSE AND `derivedFrom` IS MATHS. "38 ft out and wide of the slot
 * (|y|=33 ft)" shipped absolute-value notation to a novice being taught what the
 * slot is. The notation belongs in the derivation, which is a different field
 * and is deliberately left alone — a verification surface that hides its
 * arithmetic is the opposite of the point.
 */
test('no reason a reader sees is written in maths', () => {
  const ctx = { ...CTX, evenOnly: false };
  for (const [name, mod] of [['slot', danger], ['blocked', blocked], ['attempts', corsi]]) {
    const r = mod.reduce(rich.events, ctx);
    for (const x of [...(r.excluded || []), ...(r.surprising || [])])
      assert.doesNotMatch(x.why, /\|y\||<=|>=|\babs\b/i,
        `${name} explains an event to a reader in notation: "${x.why}"`);
  }
});

/**
 * ⭐ ONE LAYER, ONE NAME. The parked row still said "Corsi" after the chip was
 * renamed "Attempts" — invisible, because the caption reads the CHIP, so the two
 * could disagree indefinitely. They are allowed to differ in length ("Slot"
 * against "Slot shots"); they are not allowed to be different words.
 */
test('each row carries the same name as its chip', () => {
  for (const token of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle']) {
    const rowHtml = app.match(new RegExp(`<button class="lrow"[^>]*data-pick="${token}"[\\s\\S]*?</button>`))[0];
    const rowName = /<b>([^<]*)<\/b>/.exec(rowHtml)[1];
    const chip = new RegExp(`<button class="pk"[^>]*data-l="${token}"[^>]*>(?:<span class="pkl">)?([^<]*)<`).exec(app)[1];
    assert.ok(rowName.toLowerCase().includes(chip.toLowerCase()),
      `the row calls this layer "${rowName}" and the chip calls it "${chip}"`);
  }
});

/**
 * ⭐ ATTRIBUTION AND LOCATION ARE DIFFERENT PROBLEMS, and the slot row said one
 * thing that implied the other.
 *
 * CHENG: the card read "Credited to the club that shot" beside "Blocked
 * attempts are excluded, because the coordinate the feed records is where the
 * puck STOPPED" — which together read as *we do not know whose it was*. But
 * Corsi credits a blocked shot to the shooter, verified 44 of 44 against
 * `rosterSpots`, and Attempts counts them. So a reader toggling Attempts → Slot
 * sees the same events counted in one and excluded from the other, with an
 * explanation that names the wrong reason. We know WHO shot it; we do not know
 * WHERE FROM.
 */
test('the slot row separates whose shot it was from where it was taken', () => {
  const row = app.match(/<button class="lrow"[^>]*data-pick="slot"[\s\S]*?<\/button>/)[0];
  const lat = /<span class="lat">([^<]*)</.exec(row)[1];
  assert.match(lat, /who shot it, but not from where/i,
    'the slot exclusion still reads as though the shooter were unknown, which '
    + 'contradicts Attempts counting the same events for that shooter');
});

/**
 * ⭐ NO SHOUTING IN RUNNING PROSE. CHENG: "this is the only all-caps word in
 * running prose, and it is in the panel that is meant to read as careful."
 * Right — and it was in four of the five rows, not the one he could see.
 * Emphasis on this page is weight or colour; these strings reach the panel
 * through `textContent`, which carries no markup, so the answer is to write
 * sentences that do not need it.
 */
test('no attribution line shouts', () => {
  for (const token of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle']) {
    const row = app.match(new RegExp(`<button class="lrow"[^>]*data-pick="${token}"[\\s\\S]*?</button>`))[0];
    const lat = /<span class="lat">([^<]*)</.exec(row)[1];
    const shouted = lat.match(/\b[A-Z]{2,}\b/g) || [];
    assert.deepEqual(shouted, [],
      `${token}'s attribution line shouts: ${shouted.join(", ")}`);
  }
});

/**
 * ⭐ A LIVE COUNT ON EVERY LENS — what each one would show you, while you watch.
 *
 * Kevin: "let's say an event occurs on the rink… flash the updated metric; if
 * it's not currently shown, flash the control button, which indicates the event
 * applied to that layer." CHENG's improvement on the flash: a COUNT reports
 * where a pulse invites, PERSISTS so `prefers-reduced-motion` gets the whole
 * lesson rather than none, and is cumulative, so looking away and back still
 * says which lens has been busy.
 *
 * ⛔ AND NOT "the most specific layer lights", which was my proposal. Measured
 * over 262 games and 69,661 frames: Attempts COUNTS 45.0% of frames and would
 * have flashed on 5.8% — the chip and the counter disagreeing 7.8-fold about
 * one quantity.
 */
test('every lens carries a live count of what it has seen', () => {
  const a = boot();
  const chipCount = l => a.$('n_' + l).textContent;

  // Pre-game every lens is honestly at zero: nothing has happened to count.
  for (const l of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle'])
    assert.equal(chipCount(l), '0', `${l} claims a count before the puck drops`);

  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  // The slice the page reached, taken from the panel's own closing arithmetic.
  pick(a, 'corsi');
  a.$('work').click();
  const total = +/= <b>(\d+)<\/b> events/.exec(a.$('workBody').innerHTML)[1];
  a.$('work').click();

  // THE EXPECTED VALUES COME FROM THE REDUCERS (H1), on the slice the page reached.
  const slice = rich.events.slice(0, total);
  for (const [l, mod] of [['corsi', corsi], ['slot', danger], ['blocked', blocked],
                          ['goaltending', goaltending], ['whistle', whistle]])
    assert.equal(chipCount(l), String(mod.reduce(slice, { ...CTX, evenOnly: false }).counted.length),
      `${l}'s chip count is not what that layer counted`);

  /* ⛔ AND THE BASE VIEW CARRIES NO COUNT. `Just events` is not a metric, and
     §31.6 refused a number in the box for exactly that reason.
     ⚠️ The first version of this compared `a.$('n_none')` to a function
     returning `a.$('n_none')` — a check that could not fail. The fake mints an
     element for any id asked of it, so the claim has to be made against the
     MARKUP, where the absence is real. */
  const noneChip = /<button class="pk" id="pkNone"[\s\S]*?<\/button>/.exec(app)[0];
  assert.doesNotMatch(noneChip, /class="pkn"/,
    'the base view chip carries a count, which makes `Just events` a lens');
  const slotChip = /<button class="pk"[^>]*data-l="slot"[\s\S]*?<\/button>/.exec(app)[0];
  assert.match(slotChip, /class="pkn"/,
    'no chip carries a count at all, so the check above proves nothing');
});

/**
 * ⭐ THE CONTAINMENT IS WHAT THE COUNTS TEACH, and it is a real property rather
 * than a presentational one: Attempts ticks whenever any other lens ticks, and
 * at other times too. That is the subset relation learned by watching instead
 * of by a label nobody reads — and it is why CHENG's two-strength flash was
 * unnecessary, because the frequency IS the information.
 *
 * Asserted over every fixture game, not just the reference one: the shootout,
 * overtime and bench-minor games are where a containment claim would break.
 */
test('Attempts contains every other lens, in every fixture game', () => {
  const dir = new URL('./fixtures/extracts/', import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  assert.ok(files.length >= 5, 'the fixture corpus has shrunk — this check needs games');
  for (const f of files) {
    const g = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id };
    const all = new Set(corsi.reduce(g.events, ctx).counted);
    for (const [nm, mod] of [['slot', danger], ['blocked', blocked], ['goaltending', goaltending]]) {
      const out = mod.reduce(g.events, ctx).counted.filter(i => !all.has(i));
      assert.deepEqual(out, [],
        `${f}: ${out.length} ${nm} events are not counted as Attempts, so the chip `
        + 'counts teach a containment that does not hold');
    }
  }
});

/**
 * ⚠️ THE HEADING NAMED THE LENS AND ITS COUNT — "How Goaltending10 is counted".
 *
 * `capFor` was taught to read `.pkl` when the live counts landed on the chips,
 * because `chip.textContent` had become "Slot33". The work panel's heading is
 * the OTHER reader of the same seam and was not taught, so the fix for the
 * caption shipped the identical defect one surface down. Both now go through
 * `chipLabel`, which is what a seam that has decided four designs is owed.
 *
 * ⭐ AND THE HARNESS HAD TO LEARN THE DIFFERENCE FIRST. The fake chip stored the
 * label in its own `textContent`, so the two readings were identical and this
 * test would have passed against the broken page — a check with no instrument
 * for the axis in question. `helpers/page.js` now concatenates the count the
 * way a browser does, which is why the second assertion below can fail.
 */
test('the work panel heads with the lens name, never the name plus its count', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  for (const l of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle']) {
    pick(a, l);
    a.$('work').click();
    const head = /<h2>([\s\S]*?)<span class="wsub">/.exec(a.$('workBody').innerHTML)[1];
    const chip = a.$$('#rg .pk').find(b => b.dataset.l === l);
    const label = chip.querySelector('.pkl').textContent;
    const count = a.$('n_' + l).textContent;

    assert.equal(head.trim(), `How ${label} is counted`,
      `${l}: the heading does not name the lens the reader pressed`);
    // The count is what makes the two readings differ. Without it the assertion
    // above is satisfied by the whole chip and proves nothing.
    assert.ok(count && +count > 0,
      `${l}: no count reached the chip, so this test cannot see its own subject`);
    assert.ok(!head.includes(label + count),
      `${l}: the heading reads "${label + count}" — it is composed from the whole `
      + 'chip instead of `.pkl`');
    a.$('work').click();
  }
});

/**
 * ⭐ THE FIGURES ARE JOINED WITH A PLUS, SO THEY HAVE TO ADD UP.
 *
 * Kevin, looking at Goaltending: the two club figures sat behind a slash and a
 * full stop, orphaned from the arithmetic they are the parts of. Joining them
 * with `+` is right — and it makes a promise the slash never did, which four
 * layers keep trivially and the fifth cannot: `5 of 5 WSH + 4 of 5 VGK` sums to
 * 9 by numerator and 10 by denominator, against a 10 on screen. Two figures
 * that look like one claim, this project's signature defect, in a sentence
 * whose entire job is that nothing is dropped quietly.
 *
 * So the layer names what its figures add to and the panel prints that name.
 * THE PATH IS INDEPENDENT: the figures come from `lboxFor`, the count comes
 * from the reducer's own `counted.length` by way of the Counted heading.
 */
test('whatever a reader adds in the ledger line is the number it is printed against', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  let checked = 0;
  for (const l of ['corsi', 'slot', 'blocked', 'goaltending']) {
    pick(a, l);
    a.$('work').click();
    const panel = a.$('workBody').innerHTML;
    const foot = /<p class="wfoot">([\s\S]*?)<\/p>/.exec(panel)[1];
    const m = /<em>([^<]*)<\/em> &mdash; (\d+) ([a-z ]+?)(?: \+|,|\.)/.exec(foot);
    assert.ok(m, `${l}: the ledger line does not read "figures — N noun"`);
    const [, em, n, noun] = m;
    const counted = +/Counted <span class="n">(\d+)<\/span>/.exec(panel)[1];
    assert.equal(+n, counted, `${l}: the ledger line and the Counted column disagree`);

    // What a reader adds. A fraction contributes its DENOMINATOR, because that
    // is the population being counted — and the noun has to say so.
    /* Two clubs, plus any part credited to NEITHER — 7.8% of blocks are by a
       teammate, so Blocked closes on three terms and the other layers on two.
       The count of terms is not the claim; that they add up is. */
    const parts = em.split(' + ');
    assert.ok(parts.length >= 2, `${l}: the ledger line names ${parts.length} club`);
    const val = s => {
      const f = /^(\d+) of (\d+) /.exec(s);
      if (f) return +f[2];
      const p = /^(\d+) /.exec(s);
      assert.ok(p, `${l}: "${s}" is joined with a + and is not a number`);
      return +p[1];
    };
    assert.equal(parts.reduce((t, s) => t + val(s), 0), counted,
      `${l}: "${em}" is joined with a + and does not add to ${counted}`);

    /* ⭐ AND A FRACTION MAY NOT SIT UNDER THE BARE WORD "counted". The sum
       closes on the denominators, so the noun must name them; left as
       "counted", a reader adding the numerators gets 9 against a 10 and
       concludes we cannot count. This is the assertion that fails if the
       `sums` field is dropped from the goaltending box. */
    if (/\d+ of \d+/.test(em))
      assert.notEqual(noun, 'counted',
        `${l}: fractions are summed under the word "counted", so the numbers a `
        + 'reader adds are not the number on screen');
    checked++;
    a.$('work').click();
  }
  assert.equal(checked, 4, 'a layer with club figures went unchecked');
});

/**
 * ⚠️ "The other 1 each carry their own reason" — a plural written once and
 * never re-read, on the commonest case rather than an edge one. The surprising
 * bucket reaches exactly two the moment a second event lands in it, so every
 * layer that has one passes through this sentence. Found in a 360px screenshot
 * of the card, on both layers that were open; no test could have flagged it,
 * because each half of the sentence is individually valid English.
 */
test('the surprising bucket says "the other one" when there is one', () => {
  const a = boot();
  let seen = 0;
  // Walk the replay rather than picking a moment: the bucket passes through 2
  // at some point in every game, and which frame that is, is data.
  for (const l of ['blocked', 'goaltending']) {
    for (let f = 10; f <= +a.$('scrub').max; f += 10) {
      a.$('scrub').oninput({ target: { value: String(f) } });
      pick(a, l);
      a.$('work').click();
      const w = a.$('workBody').innerHTML;
      const n = +(/Counted, surprisingly <span class="n">(\d+)<\/span>/.exec(w) || [, 0])[1];
      a.$('work').click();
      assert.doesNotMatch(w, /The other 1 each carry/,
        `${l}: the sentence disagrees with its own number`);
      if (n === 2) {
        assert.match(w, /The other one carries its own reason/,
          `${l}: two surprising events, and the sentence does not say "the other one"`);
        seen++;
        break;
      }
    }
  }
  assert.equal(seen, 2, 'no frame in this game puts a layer at exactly two '
    + 'surprising events, so this check never reached its subject');
});

/**
 * ⭐ A THING THAT WAS NEVER A CANDIDATE IS NOT A NEAR MISS — Kevin, reading the
 * Blocked card: "the description under 'Close, but not counted' doesn't make
 * sense, none of them are close to a blocked shot, they are random events."
 *
 * The panel promoted an exclusion carrying ANY dimension other than `type`,
 * which is not the same claim as "no `type` dimension": an event can fail on
 * `type` AND on something else, and the something else promoted it. Two live
 * consequences —
 *
 *   Blocked, every game   51 whistles and period starts, which this layer
 *                         records as `play` AND `type` where the other three
 *                         record `type` alone — so the extra dimension promoted
 *                         them
 *   Attempts, evenOnly    a stoppage during a power play carries `type` AND
 *                         `strength`, so every whistle was promoted the moment
 *                         a reader pressed "Even strength only"
 *
 * The corpus figure: 428 NOT_A_PLAY events promoted across the fixtures and
 * both strength modes, now 0.
 *
 * ⚠️ THE RULE ONLY WORKS IF EVERY LAYER RECORDS `type` WHEN THE EVENT IS NOT A
 * PLAY, whatever else it also records — an event missing that dimension is
 * promoted on whatever remains. Blocked recorded it and danger.js did not: its
 * shootout branch returned on `play` before asking the type question, which put
 * the shootout's own period-start and period-end under "Close, but not counted"
 * on the Slot layer, 12 across the corpus.
 */
test('a not-a-play event carries the type dimension in every layer', () => {
  const dir = new URL('./fixtures/extracts/', import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  assert.ok(files.length >= 5, 'the fixture corpus has shrunk — this check needs games');

  // ⭐ THE LAYER SET IS DERIVED FROM THE PANEL'S OWN TABLE, not typed here: a
  // layer added to `LEDGER` and not to this list would go unchecked, which is
  // exactly how blocked.js drifted from the other three in the first place.
  const names = /const LEDGER=\{([\s\S]*?)\};/.exec(app)[1].match(/(\w+):/g).map(s => s.slice(0, -1));
  const MODS = { corsi, slot: danger, blocked, goaltending, whistle };
  assert.deepEqual(names.sort(), Object.keys(MODS).sort(),
    'the panel shows a layer this check does not exercise');

  let seen = 0, dims = new Set();
  for (const f of files) {
    const g = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    const ctx = { roster: g.roster, homeId: g.teams.home.id, awayId: g.teams.away.id };
    for (const [nm, mod] of Object.entries(MODS)) {
      for (const evenOnly of [false, true]) {
        for (const x of mod.reduce(g.events, { ...ctx, evenOnly }).excluded) {
          const t = g.events[x.id].type;
          if (NOT_A_PLAY[t]) {
            assert.ok(x.dims?.type,
              `${f} ${nm} evenOnly=${evenOnly}: a ${t} is excluded as `
              + `${Object.keys(x.dims || {}).join('+')} with no \`type\` — the panel `
              + 'will promote it into "Close, but not counted"');
            /* ⭐ AND `play` MEANS OUTSIDE PLAY ALTOGETHER — the shootout, the one
               exclusion here a viewer could plausibly expect to count. Blocked
               recorded `play` on every period start and whistle as well, where
               the other three record `type` alone; that cost nothing once
               `isNearMiss` was fixed, which is exactly why it needs saying out
               loud rather than left to be rediscovered. A dimension that means
               one thing in four layers and another in the fifth is the drift
               that fed the defect above. */
            assert.ok(!x.dims.play || inShootout(g.events[x.id]),
              `${f} ${nm}: a ${t} outside the shootout is dimension \`play\` — `
              + 'that word means outside play altogether, not "not a play"');
            seen++;
          }
          for (const k of Object.keys(x.dims || {})) dims.add(k);
        }
      }
    }
  }
  assert.ok(seen > 1000, `only ${seen} not-a-play exclusions were checked`);
  // ⭐ AND THE VOCABULARY IS CLOSED. A dimension nobody has ruled on would be
  // promoted by default, under a heading that claims the event nearly counted.
  assert.deepEqual([...dims].sort(), ['geometry', 'limit', 'play', 'strength', 'type'],
    'a layer invented an exclusion dimension that §32.4 has not ruled on');
});

/**
 * ⭐ AND THE SAME CLAIM AT THE SURFACE, where Kevin met it. The check above is
 * about the reducers; this one reads what the panel actually renders, in both
 * strength modes, because the evenOnly defect is invisible in the default.
 */
test('nothing that was never a candidate appears under "Close, but not counted"', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  const NEVER = [/play stopped/, /period start/, /period end/, /game over/, /delayed penalty/];
  let checked = 0;
  for (const evenOnly of [false, true]) {
    a.$$('#rg .sbtn')[evenOnly ? 1 : 0].click();
    for (const l of ['corsi', 'slot', 'blocked', 'goaltending', 'whistle']) {
      pick(a, l);
      a.$('work').click();
      const w = a.$('workBody').innerHTML;
      const m = /Close, but not counted[\s\S]*?<p class="wexc">([\s\S]*?)<\/p>/.exec(w);
      if (m) for (const re of NEVER)
        assert.doesNotMatch(m[1], re,
          `${l} (evenOnly=${evenOnly}): "${re.source}" is filed as a near miss`);
      checked++;
      a.$('work').click();
    }
  }
  assert.equal(checked, 10, 'a layer or a strength mode went unchecked');
  // The section still EXISTS where it should — otherwise this passes by the
  // panel having stopped rendering near misses at all.
  a.$$('#rg .sbtn')[0].click();
  pick(a, 'slot');
  a.$('work').click();
  assert.match(a.$('workBody').innerHTML, /Close, but not counted/,
    'no layer shows a near-miss section any more, so the check above is vacuous');
});

/**
 * ⚠️ A REASON PRINTED UNDER A HEADING THAT SAYS **COUNTED** MAY NOT READ AS
 * THOUGH THE EVENT WAS NOT. Kevin: "the 'counted, surprisingly' says neither
 * team is credited with the block, but the header says 'counted'."
 *
 * Every word of the old sentence was true — "no defender stopped this one and
 * neither team is credited with the block" — and against that heading it said
 * the opposite of it. The two facts are different: a body stopped the shot, so
 * it IS one of the blocks this layer counts; no DEFENDER did, so no club's
 * column gets it. The caveat had been shipping without the fact.
 *
 * This is a copy pin, and it says so: what it defends is that BOTH halves are
 * present, not the particular wording of either.
 */
test('a surprising reason says what it was counted in, not only what it is denied', () => {
  /* THE SENTENCE ITSELF IS PINNED IN test/layers.test.js, which owns the
     reducer's claim. What is checked HERE is the thing Kevin actually saw: the
     reason and the heading above it, on one card, agreeing. */
  const B = blocked.reduce(rich.events, CTX);
  assert.ok(B.teammate.length, 'no teammate block in this fixture — no subject');
  const a = boot();
  a.$('scrub').oninput({ target: { value: a.$('scrub').max } });
  pick(a, 'blocked');
  a.$('work').click();
  const card = /Counted, surprisingly[\s\S]*?<\/div>/.exec(a.$('workBody').innerHTML)[0];
  assert.match(card, /counted/i,
    'the card headed "Counted, surprisingly" shows a reason that never says so');

  /* ⚠️ AND THE EXAMPLE CLOSES ITS OWN SENTENCE. A reducer's `why` is a CLAUSE,
     so it ran into the line beneath it — "…credited with the block The other
     one carries its own reason." The identical fragment defect `.lds` had one
     card to the left, and it was found the same way: by looking at a 360px
     render, not by a test. */
  const eg = /<p><em>For example:<\/em>([\s\S]*?)<\/p>/.exec(card)[1];
  assert.match(eg.trim(), /[.!?]$/,
    'the example runs into the paragraph after it, with no full stop');
});

/**
 * ⭐ THE WRITE SIDE OF THE DEEP-LINK SEAM. Kevin, looking at his own address bar
 * on a game scrubbed into period 1: it reads `?game=2025021213` and nothing
 * else, however far he moves. `deeplink.js::format` has said in its own
 * docstring since it was written that it is "the link a copy this moment
 * control emits", and nothing had ever emitted one — so a shared link could only
 * be hand-typed off the scoreboard.
 *
 * ⭐ AND THE CONFIRMATION NAMES THE EVENT THE LINK RESOLVES TO (CHENG), which is
 * a better design than a caveat beside the button: what is worth saying is that
 * a link lands on the nearest RECORDED moment, and the way to say it is to name
 * which one — checkable by the person who just pressed.
 */
test('the copy control emits a link to this moment, and says which moment', async () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '120' } });
  pick(a, 'slot');
  a.$('share').onclick();
  await a.settle();

  const url = a.copied;
  assert.ok(url, 'nothing was written to the clipboard');
  assert.match(url, /^https:\/\/x\/game\?/, 'the link is not absolute — it cannot be pasted anywhere');
  const q = new URLSearchParams(url.split('?')[1]);
  assert.equal(q.get('game'), String(rich.game.id), 'the link names the wrong game, or none');
  assert.equal(q.get('layer'), 'slot', 'the lens the sharer was watching did not travel');
  assert.equal(q.get('strength'), 'all', 'the mode the counts were measured under did not travel');

  /* ⭐ THE MOMENT IS THE PLAYHEAD'S, DERIVED INDEPENDENTLY. The expectation
     comes from the game data at the frame the scrubber is on; the answer comes
     back through the parser and resolver a visitor's browser runs. */
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const visitable = rich.events.map((e, n) => n).filter(n => !SKIP.has(rich.events[n].type));
  const want = rich.events[visitable[120]];
  assert.equal(resolve(rich.events, parse(q).at).index, visitable[120],
    'the link does not open on the frame it was copied from');

  const said = a.$('sharesaid').innerHTML;
  assert.match(said, /^Copied/, 'the press was not confirmed');
  assert.ok(said.includes(`P${want.per} ${want.rem}`),
    `the confirmation does not name the moment (P${want.per} ${want.rem}): ${said}`);
});

/**
 * ⭐ THE CONFIRMATION AND THE ICE NAME THE PLAY THE SAME WAY. Two surfaces
 * describing one event is a disagreement this page has already paid for twice —
 * the whistle clause at 3.5% of frames, and the caption saying "from the slot"
 * in both halves of one sentence. `playSaid` is the one place the words are
 * chosen, so this asserts they arrive in both.
 */
test('the copied moment is described in the words the rink uses', async () => {
  const a = boot();
  // Walk to a frame whose label the rink actually draws, rather than assuming
  // any given index has one: `place()` returns null for an event with no
  // coordinates and the label is then empty.
  for (let f = 30; f < 200; f += 1) {
    a.$('scrub').oninput({ target: { value: String(f) } });
    const onIce = a.$('labels').innerHTML;
    const m = /<text class="plabel"[^>]*>([^<]*)</.exec(onIce);
    if (!m || !m[1].includes('·')) continue;
    a.$('share').onclick();
    await a.settle();
    const said = a.$('sharesaid').innerHTML;
    assert.ok(said.includes(m[1]),
      `frame ${f}: the ice says "${m[1]}" and the confirmation says "${said}"`);
    return;
  }
  assert.fail('no frame in this range drew a labelled play, so nothing was compared');
});

/**
 * ⛔ PRE-GAME IS A STATE, NOT A PLAY (A11), so there is no moment to name and the
 * link carries none rather than naming the opening faceoff — which would be a
 * link to a play the sharer was not looking at.
 */
test('before the first play the link carries no moment', async () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '-1' } });
  a.$('share').onclick();
  await a.settle();
  const q = new URLSearchParams(a.copied.split('?')[1]);
  assert.equal(q.get('at'), null, 'a link was written to a play nobody was watching');
  assert.equal(q.get('game'), String(rich.game.id), 'the game did not travel either');
  assert.match(a.$('sharesaid').innerHTML, /start of the game/,
    'the confirmation does not say where the link opens');
});
