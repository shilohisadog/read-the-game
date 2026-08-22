/**
 * The blocked-shots card, row by row, and the lines a whistle rule names
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { WHY, whistle } from '../src/lib/layers/whistle.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich, app, boot, panel, CURVE_AND_MIX } from './helpers/page.js';

function rowsOf(html) {
  const out = {};
  html.split('<div class="mix ').slice(1).forEach(seg => {
    out[seg.slice(0, seg.indexOf('"'))] = seg;
  });
  return out;
}

/**
 * A row's KEY paragraph, and nothing after it.
 *
 * `keyOf(row)` ran to the END OF THE PANEL, so the moment a sentence
 * was added below the game row its numbers were counted as bar segments — three
 * tests failed claiming the bar had stopped drawing three of them. The defect was
 * in the reading, not the page. Bounded at the closing tag it cannot recur.
 */
function keyOf(row) {
  const m = row.match(/<p class="mixkey">([\s\S]*?)<\/p>/);
  assert.ok(m, 'a row lost its key');
  return m[1];
}

test('the GAME row states its share as a fraction and the ARCHIVE row as a percentage', () => {
  // THE RULE IS ABOUT THE DENOMINATOR, NOT THE SYMBOL. A percentage on sixteen
  // attempts swings fifty points and asserts precision that is not there — it was
  // deleted from this card for exactly that, the third instance of a defect the
  // control bar and the goalie card had each already had removed. On 491,971
  // attempts it is the honest form. So the two rows must differ, and the test is
  // that they differ rather than that either one is a particular string.
  //
  // WALKED, NOT GREPPED: the claim is about what a reader sees at every frame,
  // and both rows are assembled at render time from numbers the source does not
  // contain.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const games = new Set(), archs = new Set();
  a.every(d => {
    const r = rowsOf(d.$('blockPanel').innerHTML);
    if (r.game) games.add(r.game);
    if (r.arch) archs.add(r.arch);
    return null;
  });
  assert.ok(games.size > 5, `only ${games.size} distinct game rows — the walk saw nothing change`);
  for (const t of games) {
    assert.doesNotMatch(t, /%/, `the game row carries a percentage: "${t.replace(/<[^>]*>/g, ' ')}"`);
  }
  // THE CONTROL, and it checks the archive row CARRIES a percentage rather than
  // that its element exists — asserting the element survived a mutation that
  // gutted the text and left the tag.
  assert.equal(archs.size, 1, 'the archive row changed during the game, which it cannot');
  assert.match([...archs][0], /\d+\.\d%/,
    'the archive row lost its percentage, so this test now reads as "no percentages anywhere"');
});

test('the game row names the whole it is a split OF, in counts', () => {
  // The first build of this card drew the three segments and dropped the headline
  // — "over half never reach the goalie" — which is the number the whole layer
  // exists to make checkable. A composition with no total is a chart with no axis.
  // The panel's win-rate test caught it on the archive side; this is the game side,
  // which nothing else was watching.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const SHAPE = /(\d+)<\/b> of <b>(\d+) attempts?<\/b> never reached the goalie/;
  let checked = 0;
  a.every(d => {
    const h = d.$('blockPanel').innerHTML;
    const m = h.match(SHAPE);
    if (!m) return null;
    const [, never, att] = m;
    // The claim must be the sum of the two segments the bar draws as "not
    // reached", read back out of the key rather than recomputed here.
    const key = keyOf(rowsOf(h).game);
    const nums = [...key.matchAll(/<b>(\d+)<\/b>/g)].map(x => +x[1]);
    assert.equal(nums.length, 3, 'the game row stopped drawing three segments');
    assert.equal(+never, nums[1] + nums[2],
      `"${never} of ${att} never reached" disagrees with ${nums[1]} blocked + ${nums[2]} missed`);
    assert.equal(+att, nums[0] + nums[1] + nums[2],
      `the total ${att} is not the three segments (${nums.join(' + ')})`);
    checked++;
    return null;
  });
  assert.ok(checked > 5, `the headline was only checkable on ${checked} frames`);
});

test('the BAR draws the counts — the widths are the numbers', () => {
  // THE MUTATION THAT FOUND THIS: give every segment the same width. Every other
  // test still passed, because they all read the LABELS. The bar is the whole
  // claim of this card and nothing was looking at it — a picture whose geometry
  // is unchecked is decoration.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  let checked = 0;
  a.every(d => {
    const row = rowsOf(d.$('blockPanel').innerHTML).game;
    if (!row) return null;
    const rects = [...row.matchAll(/<rect class="(\w)" x="([\d.]+)" y="0" width="([\d.]+)"/g)]
      .map(m => ({ k: m[1], x: +m[2], w: +m[3] }));
    const counts = [...keyOf(row).matchAll(/<b>(\d+)<\/b>/g)].map(m => +m[1]);
    assert.equal(rects.length, 3, 'the bar stopped drawing three segments');
    const tot = counts.reduce((t, n) => t + n, 0);
    let x = 0;
    rects.forEach((r, i) => {
      assert.ok(Math.abs(r.w - 100 * counts[i] / tot) < 0.01,
        `segment ${r.k} is ${r.w}% wide for ${counts[i]} of ${tot}`);
      assert.ok(Math.abs(r.x - x) < 0.01, `segment ${r.k} starts at ${r.x}, not ${x}`);
      x += r.w;
    });
    assert.ok(Math.abs(x - 100) < 0.01, `the segments cover ${x}% of the bar, not 100`);
    checked++;
    return null;
  });
  assert.ok(checked > 5, `the bar was only checkable on ${checked} frames`);
});

test('what counts as REACHING the goalie is the feed’s own event types', () => {
  // Internal consistency is not correctness: classifying a goal as blocked keeps
  // "never = blocked + missed" and "total = the three segments" both true, and a
  // mutation doing exactly that survived every other test here.
  //
  // So the expected split is derived INDEPENDENTLY — the same ledger the page
  // uses, classified here rather than read back from the page's own answer.
  const ctx = { roster: rich.roster, homeId: rich.teams.home.id,
                awayId: rich.teams.away.id, evenOnly: false };
  const want = { r: 0, b: 0, m: 0 };
  corsi.reduce(rich.events, ctx).counted.forEach(id => {
    const t = rich.events[id].type;
    if (t === 'blocked-shot') want.b++;
    else if (t === 'missed-shot') want.m++;
    else want.r++;
  });
  assert.ok(want.r > 0 && want.b > 0 && want.m > 0, 'the reference game misses a category');
  // A goal must be on the REACHED side, or this test cannot see the mutation
  // that motivated it.
  assert.ok(rich.events.some(e => e.type === 'goal'), 'the reference game has no goal');

  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const scrub = a.$('scrub');
  scrub.value = String(+scrub.max);
  scrub.oninput({ target: { value: scrub.value } });
  const counts = [...keyOf(rowsOf(a.$('blockPanel').innerHTML).game)
    .matchAll(/<b>(\d+)<\/b>/g)].map(m => +m[1]);
  assert.deepEqual(counts, [want.r, want.b, want.m],
    'at the final frame the card splits the attempts differently than their event types do');
});

test('each row states its own scope, because the two can disagree', () => {
  // The game row honours `Even strength only`; the archive figure has no strength
  // split and is all situations. The OLD card had that mismatch too and said
  // nothing — and putting the two side by side turns an unstated mismatch into an
  // invited comparison, which is worse.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  // Away from the opening frames: at zero attempts there is no game row to read a
  // scope off, and the first draft of this test crashed there rather than
  // failing, which is the same thing wearing a worse message.
  const scrub = a.$('scrub');
  scrub.value = String(+scrub.max);
  scrub.oninput({ target: { value: scrub.value } });
  const read = () => {
    const r = rowsOf(a.$('blockPanel').innerHTML);
    assert.ok(r.game && r.arch, 'a row is missing at the frame this test reads');
    return { game: r.game.split('</p>')[0], arch: r.arch.split('</p>')[0] };
  };
  const all = read();
  assert.match(all.game, /all situations/, 'the game row does not say what it counted');
  assert.match(all.arch, /all situations/, 'the archive row does not say what it counted');

  a.GROUPS['#rg .sbtn'][1].click();          // Even strength only
  const even = read();
  assert.match(even.game, /even strength/, 'the game row ignored the strength filter');
  assert.match(even.arch, /all situations/,
    'the archive row followed the strength filter, which it cannot — there is no such archive figure');
  assert.notEqual(even.game, all.game, 'the two strength states render identically');
});

test('the card says so before a single attempt exists, and stops once one does', () => {
  // A CONDITION at the playhead, exactly like the whistle card's "No whistle yet"
  // branch — there is no bar to draw and no fraction to state, and the empty state
  // must not survive into frames where there is.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  let empty = 0, drawn = 0, overlap = 0;
  a.every(d => {
    const h = d.$('blockPanel').innerHTML;
    const isEmpty = /Nothing shot yet/.test(h);
    const hasRow = !!rowsOf(h).game;
    if (isEmpty) empty++;
    if (hasRow) drawn++;
    if (isEmpty && hasRow) overlap++;
    return null;
  });
  assert.ok(empty > 0, 'the empty state never appeared in the walk');
  assert.ok(drawn > 0, 'the game row never appeared in the walk');
  assert.equal(overlap, 0, 'the empty state and the bar were on screen at the same time');
});

test('both rows state their claim in the SAME frame, and each names its denominator', () => {
  // Kevin: "this game shows 5 of 12 and the archive shows a percentage — two
  // different units expressing the information." The units cannot be unified —
  // 12 and 491,971 do not take the same one — so the FRAME is unified instead,
  // and each row states the denominator that forces its unit.
  //
  // The test is the RELATIONSHIP: whatever the numbers are, both headlines parse
  // with one pattern, and the value differs in kind while the frame does not.
  const FRAME = /^(.+?) of ([\d,]+ attempts?) never reach(?:ed)? the goalie$/;
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const scrub = a.$('scrub');
  scrub.value = String(+scrub.max);
  scrub.oninput({ target: { value: scrub.value } });

  const claim = row => {
    const m = row.match(/<p class="mixcl">([\s\S]*?)<\/p>/);
    assert.ok(m, 'a row lost its claim');
    return m[1].replace(/<[^>]*>/g, '');
  };
  const r = rowsOf(a.$('blockPanel').innerHTML);
  const g = claim(r.game).match(FRAME), c = claim(r.arch).match(FRAME);
  assert.ok(g, `the game claim does not fit the shared frame: "${claim(r.game)}"`);
  assert.ok(c, `the archive claim does not fit the shared frame: "${claim(r.arch)}"`);

  // The units differ, and that is the point rather than an oversight: a count on
  // the row whose denominator cannot carry a percentage, a percentage on the one
  // that can. Asserting they differ is what stops a later "tidy-up" unifying them
  // and reintroducing the defect deleted from this card the day before.
  assert.match(g[1], /^\d+$/, `the game claim carries "${g[1]}" where a plain count belongs`);
  assert.match(c[1], /^\d+\.\d%$/, `the archive claim carries "${c[1]}" where a percentage belongs`);

  // And the denominators are the real ones, not decoration. The game's is checked
  // against the bar's own segments; the archive's against the published n.
  const segs = [...keyOf(r.game).matchAll(/<b>(\d+)<\/b>/g)].map(m => +m[1]);
  assert.equal(+g[2].replace(/[^\d]/g, ''), segs.reduce((t, n) => t + n, 0),
    `the game claim says "${g[2]}" while its own bar draws ${segs.join(' + ')}`);
  assert.match(c[2], /^491,971 attempts$/, 'the archive denominator is not the archive n');
});

test('nothing on the blocked card is a bare percentage — every number names its OF', () => {
  // THE CAVEAT THAT SAID "a share of the attempts taken, not a rate of winning"
  // is gone, and this is what replaced it. It existed because a bare `27.8%`
  // beside two team names can be read as a win rate, which is the misreading
  // CHENG's ruling on this panel exists to prevent. It is safe to delete only
  // while every figure states its own denominator — so that is the thing tested,
  // not the sentence.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const scrub = a.$('scrub');
  scrub.value = String(+scrub.max);
  scrub.oninput({ target: { value: scrub.value } });
  const r = rowsOf(a.$('blockPanel').innerHTML);

  // Each row's CLAIM carries "of <n>", checked by the shared-frame test above.
  // Here it is the KEYS, which are the other place numbers appear: a percentage
  // there is read against the row's own stated denominator, so the row must have
  // one on screen at the same time.
  for (const [name, row] of Object.entries(r)) {
    const key = keyOf(row);
    if (!/%/.test(key)) continue;
    assert.match(row, /of <b>[\d,]+ attempts?<\/b>/,
      `the ${name} row shows percentages with no denominator anywhere on it`);
  }
  // And the doctrine the deleted line carried has to still be somewhere.
  const v = a.$('blockPanel').innerHTML;
  assert.match(v, /4,119 games/, 'the archive lost its games count with the caveat');
  assert.match(v, /NHL regular season and playoffs/, 'the archive lost its population');
});

test('the card says WHY it matters, as a disagreement rather than an implication', () => {
  // Kevin: "we provide the data but we don't offer why it could matter." The one
  // shape that survives this project's constraints is not "this predicts the
  // winner" but "this counts something the familiar number does not" — always
  // available, never a forecast, and a CONDITION at the playhead so it moves as
  // the game moves (docs/why-it-matters.md §2).
  //
  // THE TEST IS THE RELATIONSHIP: both numbers in the sentence must be the card's
  // own, read back out of the bar it sits under. A sentence carrying numbers
  // nobody can check is the thing this site exists as an alternative to.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const SHAPE = /A box score would show <b>(\d+)<\/b> shots?\. This game has had <b>(\d+)<\/b> attempts?\./;
  let checked = 0;
  a.every(d => {
    const h = d.$('blockPanel').innerHTML;
    const m = h.match(SHAPE);
    const row = rowsOf(h).game;
    if (!row) { assert.equal(m, null, 'the sentence outlived the bar it describes'); return null; }
    assert.ok(m, 'the game row is drawn and nothing says why it matters');
    const segs = [...keyOf(row).matchAll(/<b>(\d+)<\/b>/g)].map(x => +x[1]);
    assert.equal(+m[1], segs[0],
      `the sentence says a box score shows ${m[1]} where the bar draws ${segs[0]} reaching the goalie`);
    assert.equal(+m[2], segs.reduce((t, n) => t + n, 0),
      `the sentence says ${m[2]} attempts where the bar draws ${segs.join(' + ')}`);
    // AND IT IS A DISAGREEMENT, not an implication: no outcome anywhere in it.
    assert.doesNotMatch(m[0], /\bwin|\blos|\bshould|\blikely|\bexpect/i,
      'the why-it-matters sentence turned into a forecast');
    checked++;
    return null;
  });
  assert.ok(checked > 5, `the sentence was only checkable on ${checked} frames`);
});

test('and it says nothing at even strength, because a box score has no such column', () => {
  // With the filter on, the reached-the-goalie count is the EVEN-STRENGTH shots
  // on goal, and no box score reports that — so the sentence would be false about
  // the very number it names. Silence is the same answer the whistle layer gets
  // in the audit, for the same reason: we hold no figure that makes it true.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const scrub = a.$('scrub');
  scrub.value = String(+scrub.max);
  scrub.oninput({ target: { value: scrub.value } });
  assert.match(a.$('blockPanel').innerHTML, /A box score would show/, 'it is absent at all situations too');

  a.GROUPS['#rg .sbtn'][1].click();                       // Even strength only
  assert.doesNotMatch(a.$('blockPanel').innerHTML, /A box score would show/,
    'the sentence survived into even strength, where it is false about its own number');
  assert.ok(rowsOf(a.$('blockPanel').innerHTML).game, 'the bar went with it, which was not the claim');

  a.GROUPS['#rg .sbtn'][0].click();                       // and back
  assert.match(a.$('blockPanel').innerHTML, /A box score would show/, 'it did not come back');
});

test('the whistle layer actually draws the line its rule names', () => {
  // THE SOURCE-GREP VERSION OF THIS SURVIVED COMMENTING THE DRAW OUT, because
  // `class="rulel` was still present inside the comment. Only the rendered SVG
  // can tell markup from a mention of markup, so the claim lives here and the
  // legend half lives in whistle.test.js.
  //
  // `linesFor()` lights the centre line and a goal line for an icing, and a blue
  // line for an offside — the only visual answer we have for offside at all,
  // since the feed records the call and nothing else.
  const a = boot();
  a.$('lyWhistle').click();
  const drawn = a.every(d => d.$('whistles').innerHTML).join('\n');
  // ANCHORED TO `<line`, NOT TO THE CLASS NAME. The fake document keeps
  // innerHTML as a string and parses nothing, so `class="rulel` matches happily
  // inside `<!--line class="rulel ...-->`. Commenting the draw out survived this
  // test until the regex required the element to actually open.
  const lines = (drawn.match(/<line class="rulel/g) || []).length;
  assert.ok(lines > 0,
            'the whistle layer never lit a line — the rule geometry is not on the ice');

  // AND ONLY WHILE THE LAYER IS ON. A line left behind after the layer is off
  // would be unexplained geometry: its legend key is hidden with the group.
  const b = boot();
  const off = b.every(d => d.$('whistles').innerHTML).join('\n');
  assert.ok(!/<line class="rulel/.test(off),
            'the rule line is drawn with the whistle layer off, where nothing explains it');
});

test('the restart faceoff says which rule it is restarting after', () => {
  // THE ONLY THING THE ICE CAN HONESTLY SAY ABOUT AN OFFSIDE. The stoppage
  // carries a reason and a time and nothing else — no coordinates, no zone, no
  // players — so the infraction cannot be drawn. The restart IS recorded, and so
  // is the fact that it belongs to that whistle, which makes this a recorded
  // relationship rather than an inference.
  //
  // Driven from the reducer, never from a literal: whatever this game stopped
  // for, the faceoff the layer paired with a whistle must carry that whistle's
  // written name.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.every(d => d.$('labels').innerHTML).join('\n');
  const said = [...seen.matchAll(/ after ([^<·]+)/g)].map(m => m[1].trim());
  assert.ok(said.length > 0, 'no restart ever named the rule that caused it');

  // Every reason it named must be one the vocabulary actually holds — a raw
  // feed key leaking onto the ice is the defect WHY was built to end.
  const names = new Set(Object.values(WHY).map(v => v.name).filter(Boolean));
  for (const s of said) {
    assert.ok(names.has(s) || s === 'an unrecorded stoppage',
              `the ice named "${s}", which is not a written reason`);
  }

  // AND ONLY THE FACEOFFS THAT ACTUALLY RESTART A WHISTLE. Taking "the most
  // recent whistle" instead of the paired one survived every check above,
  // because at a restart they are usually the same event. They come apart at a
  // faceoff that follows a GOAL: play stopped for the goal, not for a whistle,
  // so that dot must say nothing — and the loose version would hand it whatever
  // stopped play last, several minutes earlier.
  const wctx = { roster: rich.roster, homeId: rich.teams.home.id,
                 awayId: rich.teams.away.id, evenOnly: false };
  const paired = new Set(whistle.reduce(rich.events, wctx).whistles
    .map(w => w.spotId).filter(x => x != null));
  const afterGoal = rich.events.findIndex((e, k) =>
    e.type === 'faceoff' && k > 0 && rich.events[k - 1].type === 'goal');
  assert.ok(afterGoal > 0, 'this game has no faceoff following a goal to test with');
  assert.ok(!paired.has(afterGoal),
            'the reducer paired a whistle with the faceoff after a goal');

  // ONE LABEL PER PAIRED RESTART, EXACTLY. This is the assertion that separates
  // the right answer from a coincidental one. `i` indexes EV (the playable
  // events, 269 of this game's 320) and `spotId` indexes the whole game, so
  // `spotId === i` compares two different spaces -- and still matched often
  // enough to produce plausible labels and survive three mutations. Counting
  // them catches it: the coincidences do not add up to the real total.
  const placed = whistle.reduce(rich.events, wctx).whistles.filter(w => w.spotId != null);
  const labelled = a.every(d => d.$('labels').innerHTML).filter(h => / after /.test(h)).length;
  assert.equal(labelled, placed.length,
    `${labelled} frames name a restarting rule but ${placed.length} whistles were placed`);

  const c = boot();
  c.$('lyWhistle').click();
  const atGoalRestart = c.at(afterGoal, d => d.$('labels').innerHTML);
  assert.ok(!/ after /.test(atGoalRestart),
            `the faceoff after a goal claims to be restarting a whistle: ${atGoalRestart}`);

  // AND ONLY WITH THE LAYER ON, like the ring and the legend key it belongs to.
  const b = boot();
  const off = b.every(d => d.$('labels').innerHTML).join('\n');
  assert.ok(!/ after /.test(off),
            'the restart names its rule with the whistle layer off');
});

test('the stoppage card says how far back it is looking', () => {
  // Kevin: "when I tap next play the rink activity moves forward, but the card
  // stays on Last Stoppage, creating a bit of a disconnect." The card was never
  // wrong — it is a median 29 seconds behind the playhead and more than five
  // behind on 78% of frames — but the distance was left as arithmetic between a
  // card reading 15:02 and a scoreboard reading 14:12.
  const a = boot();
  a.$('lyWhistle').click();
  const stamps = a.every(d => {
    const at = d.$('whistlePanel').innerHTML.match(/class="at">([^<]*)</);
    return at ? at[1] : null;
  }).filter(Boolean);

  assert.ok(stamps.some(s => /earlier/.test(s)),
            'the card never says how far back the stoppage was');
  // AT THE STOPPAGE ITSELF THERE IS NO DISTANCE TO STATE, and saying "0s
  // earlier" would be noise dressed as precision.
  assert.ok(stamps.some(s => !/earlier/.test(s)),
            'every frame claims a gap, including the ones with none');

  // THE GAP MUST BE THE RIGHT ONE, not merely present and varying. Publishing
  // `s: 0` from the reducer makes the card show time-into-the-period instead of
  // time-since-the-whistle — always positive, always changing, and always wrong.
  // Only checking it against the page's own clock catches that, so this compares
  // two surfaces a reader can compare themselves: the stoppage's timestamp on
  // the card and the scoreboard's running clock.
  const toSec = t => { const [m, s2] = t.split(':').map(Number); return m * 60 + s2; };
  let checked = 0;
  a.every(d => {
    const at = d.$('whistlePanel').innerHTML.match(/class="at">· P(\d+) (\d+:\d+)([^<]*)</);
    if (!at) return null;
    const shown = /· (?:(\d+):)?(\d+)s? earlier/.exec(at[3]);
    if (!shown) return null;
    const board = d.$('clk').textContent;
    const gap = toSec(at[2]) - toSec(board);        // both are time REMAINING
    const said = (shown[1] ? +shown[1] * 60 : 0) + +shown[2];
    assert.equal(said, gap,
      `the card says ${said}s since the whistle at ${at[2]}, but the clock reads ${board}`);
    checked++;
    return null;
  });
  assert.ok(checked > 20, `only ${checked} frames carried a gap to check`);
});

test('a line a rule names is marked wider than the line it marks', () => {
  // Kevin: "the highlighting isn't obvious like it is on the end zone line."
  // The mark was about the weight of the rink lines themselves, so it read as a
  // highlight over the THIN goal line and vanished into the THICK centre line.
  // The invariant is not a chosen width — it is that the band must exceed
  // anything it is drawn over, which is a relationship the stylesheet can hold.
  const band = /#rg \.rulel\{[^}]*stroke-width:([\d.]+)/.exec(app);
  assert.ok(band, 'the rule line has no width of its own');
  const widths = [...app.matchAll(/stroke-width[:=]"?([\d.]+)/g)]
    .map(m => +m[1]).filter(w => w > 0 && w < 4.6);
  assert.ok(widths.length > 3, 'no rink line widths found to compare against');
  assert.ok(+band[1] > Math.max(...widths),
    `the rule band is ${band[1]} but something on the ice is drawn at ${Math.max(...widths)}`);
});

/* ---------------------------------------------------------------------------
   B4 — ONE NARRATOR, MANY LEDGERS. CHENG's ruling: no per-event card; what is
   defensible is "the most recent event of the active layer, headed
   retrospectively, exactly as the whistle card is now."
   --------------------------------------------------------------------------- */

test('⭐ the blocked panel names the LAST block and says how far back it is', () => {
  // WHY IT EXISTS, measured on this game rather than asserted: the most recent
  // blocked shot is a MEDIAN 50 SECONDS behind the playhead, p90 153s, and more
  // than five seconds behind on 92% of frames — worse than the 36s/84% that
  // earned the whistle card its retrospective kicker. Every other figure on
  // this panel is an aggregate over the whole game, so nothing said WHEN.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const seen = a.every(d => (d.$('blockPanel').innerHTML.match(
    /<p class="whsay bklast">[\s\S]*?<\/p>/) || [''])[0]);
  const lines = seen.filter(Boolean);
  assert.ok(lines.length > 100, `the ledger line rendered on only ${lines.length} frames`);
  assert.ok(seen.some(s => !s), 'it must be ABSENT before the first block, not a zero');

  // It is headed retrospectively, and it says how far back — the two halves of
  // the whistle fix. Currency was never wrong here; it was invisible.
  assert.ok(lines.every(s => /Last blocked shot/.test(s)));
  const withGap = lines.filter(s => /earlier<\/span>/.test(s));
  assert.ok(withGap.length > lines.length / 2,
    `only ${withGap.length} of ${lines.length} frames said how far back`);
  assert.match(lines.join(''), /· \d+s earlier|· \d+:\d\d earlier/);
});

test('the gap is ABSENT when the last block is the current event', () => {
  // Without this, "says how far back" is satisfied by a line that prints
  // "0s earlier" on the frame the block happens — a false clause, and the
  // easiest one to write.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const onBlockFrames = a.every(d => {
    const m = d.$('blockPanel').innerHTML.match(/<span class="at">·[^<]*<\/span>/);
    const cap = d.$('caption').innerHTML;
    return m ? { at: m[0], cap } : null;
  }).filter(Boolean);
  assert.ok(onBlockFrames.some(x => !/earlier/.test(x.at)),
    'no frame ever showed the block as current — the gap clause is unconditional');
  // (?<!\d) — because /0s earlier/ alone also matches "10s earlier", and the
  // first version of this assertion failed on a correct page for that reason.
  assert.ok(!onBlockFrames.some(x => /(?<!\d)0s earlier/.test(x.at)),
    '"0s earlier" was printed, which is not a thing that is true');
});

test('⭐ the panel quotes the NARRATOR — one sentence, not two wordings', () => {
  // The on-ice label and this panel say the same thing about the same event
  // because they call the same function. Two wordings would drift, and the "it
  // had no antecedent" fix (`VGK · Blocked it` — "but what is 'it'?") would
  // have to be made twice. The layer names the blocker; the base view never
  // names a person, so the two surfaces differ in that ONE stated way.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const pairs = a.every(d => {
    const p = d.$('blockPanel').innerHTML.match(/<span class="rsn">([^<]*)<\/span>/);
    const l = d.$('labels').innerHTML.match(/class="plabel"[^>]*>([^<]*)</);
    return p && l && /blocked a shot|Blocked/.test(l[1]) ? [p[1], l[1]] : null;
  }).filter(Boolean);
  assert.ok(pairs.length > 5, `only ${pairs.length} frames showed both surfaces`);
  // On the frame where the label IS the current block, the two must agree.
  const agree = pairs.filter(([a2, b2]) => a2 === b2);
  assert.ok(agree.length > 0, `the two surfaces never matched: ${JSON.stringify(pairs.slice(0, 3))}`);
});
