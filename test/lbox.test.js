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
import { corsi } from '../src/lib/layers/corsi.js';
import { whistle } from '../src/lib/layers/whistle.js';
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
    const html = a.$('workPanel').innerHTML;

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
    assert.ok(html.includes(`<span class="n">${r.excluded.length}</span>`),
      `${token}'s panel does not show ITS excluded total (${r.excluded.length})`);

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
  assert.doesNotMatch(a.$('workPanel').innerHTML, /surprisingly/i,
    'stoppages is shown a "counted, surprisingly" card it has no data for');

  pick(a, 'corsi');
  assert.match(a.$('workPanel').innerHTML, /surprisingly/i,
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
  const asCorsi = a.$('workPanel').innerHTML;

  pick(a, 'slot');
  assert.equal(a.$('workPanel').hidden, false,
    'switching layers closed the panel instead of redrawing it');
  assert.notEqual(a.$('workPanel').innerHTML, asCorsi,
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
