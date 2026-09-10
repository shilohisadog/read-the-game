/**
 * ⭐⭐ A LAYER DESCRIBES ITSELF — and the description cannot drift from the rule.
 *
 * Until 2026-09-07 the five layers' definitions lived as hidden markup inside the
 * parked layer menu, and `renderWork` read them back out with `querySelector`.
 * That put the slot's *"attempts from within 33 ft of the net, between the
 * face-off dots"* in one file and `HIGH_DANGER_FT` in another, with nothing
 * holding them together: change the constant and the sentence describing it does
 * not move.
 *
 * CHENG's ruling: *"the layer owns what it counts and why; the page owns how that
 * reads."* The objection that it puts user-facing prose in the analysis tier
 * dissolves on inspection — a layer object has carried `label` (`"＋ Control
 * (Corsi)"`) all along, `sentence.js` composes prose, `rinkart.js` returns SVG,
 * and the tier rule is *no DOM, no network, no filesystem*. A string is none of
 * those.
 *
 * ⭐ AND THE SPLIT IS HIS TOO, made against his own recommendation: `counts` and
 * `credits` are facts about the RULE and moved; **what a layer DRAWS did not**,
 * because "an amber ring marks each one" is a fact about this renderer. A second
 * surface drawing the same rule differently would need a different sentence and
 * the same reducer. So `DRAWS` stays in `app.js`.
 *
 * ⚠️⚠️ AND THE MOVE DID NOT ACHIEVE WHAT THE FIRST PARAGRAPH CLAIMS. It put the
 * sentence and the constant in one FILE; it did not make either derive from the
 * other, and `danger.counts` went on typing `33 ft` eighteen lines under an
 * `import { HIGH_DANGER_FT }` for a day. Proximity is not a check. The drift this
 * file's title promises is enforced by `test/prose-constants.test.js`, derived
 * from `rink.js` across every tier that states a distance in words — and the
 * third assertion below, which this file used to carry, turned out to FORBID
 * that fix. See the note where it stood.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { LAYER_TOKENS } from '../src/lib/deeplink.js';
import { app } from './helpers/page.js';

const LIB = new URL('../src/lib/layers/', import.meta.url);

/** Every layer object, resolved through node rather than listed. */
async function layers() {
  const out = [];
  for (const f of readdirSync(LIB).filter(f => f.endsWith('.js')))
    for (const v of Object.values(await import(new URL(f, LIB))))
      if (v && typeof v === 'object' && typeof v.reduce === 'function'
          && LAYER_TOKENS.includes(v.id)) out.push(v);
  /* ⚠️ SCOPED TO THE LAYERS THE PAGE OFFERS. `tied.js` exports `tiedControl`,
     which has a `reduce` and is NOT a pickable layer — it has no chip, no
     description to show, and nowhere to show one. Asking it for `counts` was the
     first draft's mistake: "everything with a reduce" is the right derivation for
     the SX guard, whose subject is anything that counts, and the wrong one here,
     whose subject is anything a reader can select. */
  return out;
}

test('⭐ every layer says what it counts and how it credits it', async () => {
  const ls = await layers();
  assert.ok(ls.length >= 5, `only ${ls.length} layers found`);
  for (const l of ls) {
    for (const f of ['counts', 'credits']) {
      assert.equal(typeof l[f], 'string', `${l.id} has no ${f}`);
      assert.ok(l[f].length > 25, `${l.id}.${f} is too short to be a description: "${l[f]}"`);
    }
    /* ⛔ IT IS A SENTENCE FRAGMENT ABOUT A RULE, NOT MARKUP. These go through
       `innerHTML`, so a tag here would be the analysis tier emitting DOM — the
       one thing the tier rule actually forbids. */
    assert.doesNotMatch(l.counts + l.credits, /[<>]|&[a-z]+;/,
      `${l.id} carries markup or an HTML entity in its description`);
  }
});

test('⭐⭐ …and the page has no second copy of any of it', async () => {
  /* THE WHOLE POINT OF THE MOVE. If the old spans survive in the markup, the
     description exists twice and the two can disagree — which is the state this
     replaced, not an improvement on it. */
  /* ⚠️ SCOPED TO THE LAYER ROWS, because `.lds` SERVES TWO SURFACES — the layer
     rows and the `.areas` reference cards, which have a different owner and were
     never part of this move. The first pass here asserted the class was gone from
     the page entirely, and the strip that satisfied it took two `.areas` cards
     with it; `test/render-notes.test.js` caught it with "the offside claim cites
     no rule". **park.test.js's own ledger had already said `.lds` appears inside
     `.zref`** and I read past it. Enumerate what a blanket edit matches. */
  const rows = app.match(/<button class="lrow"[\s\S]*?<\/button>/g) || [];
  assert.equal(rows.length, 0,
    'the parked layer menu is back — its rows were the OLD home of these '
    + 'descriptions, and two homes is the drift this move removed');
  for (const cls of ['lat', 'lon'])
    assert.doesNotMatch(app, new RegExp(`class="${cls}"`),
      `the page still ships a <span class="${cls}">, which nothing reads`);
  /* ⚠️ `.lds` IS NOT IN THAT LIST, and the reason is a mistake worth keeping: it
     serves the `.areas` reference cards TOO. A blanket strip of the class on
     2026-09-07 took two of those cards with it, and `park.test.js`'s own ledger
     had already recorded `.lds` inside `.zref`. Two surfaces, one class name. */

  /* ⛔⛔ AND A THIRD ASSERTION USED TO STAND HERE, `app.includes(l.counts)`, with
     the message *"the page is not reading the module"*. It never asked that. It
     compared the EVALUATED string against the bundle's SOURCE TEXT, which is the
     same thing only while every description is a literal — so what it actually
     enforced was that a layer's description may never be computed.

     It went red the day `danger.counts` started interpolating `HIGH_DANGER_FT`
     instead of typing 33 (see `test/prose-constants.test.js`), which is the fix
     for a defect this very file's header names. **A check that forbids the
     correction to the problem it describes is worth more as a lesson than as a
     check.** The claim it was reaching for is real and is asserted where it can
     be asked honestly: `test/render-notes.test.js` boots the page, presses each
     layer's chip and requires the RENDERED caption to carry `mod.counts` — the
     words reaching a reader, not a substring reaching a file. That is strictly
     stronger, and it stayed green through the change. */

  const ls = await layers();
  assert.ok(ls.length >= 5, `only ${ls.length} layers found — this check has lost its subject`);
});

test('⭐ DRAWS covers exactly the layers, so the map cannot drift from the set', () => {
  /* A map keyed by layer id in `app.js` is a SECOND ENUMERATION, and this repo's
     oldest recurring defect is a list that agrees with the code until someone
     adds the sixth thing. The layer vocabulary is derived in `deeplink.js` from
     the layer objects themselves, so it is the honest thing to check against. */
  const m = /const DRAWS=\{([\s\S]*?)\};\n/.exec(app);
  assert.ok(m, 'DRAWS has moved — this check has lost its subject');
  const keys = [...m[1].matchAll(/^\s*([a-z]+):/gm)].map(x => x[1]);
  assert.deepEqual(keys.sort(), [...LAYER_TOKENS].sort(),
    'DRAWS and the layer set disagree — a layer with no `draws` line renders an '
    + 'empty second clause, and a line with no layer is dead copy nobody can reach');
});

/* ------------------------------------------ ⛔ THE PICKER'S CHIPS ARE A LIST,
 * AND UNTIL 2026-09-09 NOTHING CHECKED IT.
 *
 * Kevin, watching a layer get added: *"why does adding a layer touch 4 different
 * areas, plus several guards? I thought we just went through a code cleanup."*
 *
 * ⭐ THE MEASUREMENT IS THE ANSWER, and it is worth keeping: adding `zonestart`
 * to `LENS` — the one place a lens id is typed — turned FOUR derived guards red,
 * each naming the exact next edit. The bundle refused to build, the tier list
 * said which module the pipeline had gained, the not-a-play sweep said it was
 * not exercising the new layer, and the distribution check said the selector
 * showed a lens with no per-game count behind it. **That is the architecture
 * working**: the cost is real but it is enumerated by machine, not by memory.
 *
 * ⛔ EXCEPT FOR ONE. The chip markup in `build_main.py` is hand-written HTML and
 * NOTHING FAILED WHEN IT WAS LEFT OUT. The layer was registered, bundled,
 * counted and distributed, and was unreachable from the interface — a lens that
 * exists everywhere except where a reader could turn it on. That is the shape
 * this project keeps paying for, so it gets the same treatment `DRAWS` and
 * `MODS` already have: derived from the layer set, and red on the day somebody
 * forgets.
 */
test('⛔ every lens on the page has a chip, and every chip is a lens', () => {
  const ids = /const LENS=\{([\s\S]*?)\};/.exec(app)[1].match(/(\w+):/g).map(s => s.slice(0, -1));
  const chips = [...app.matchAll(/class="pk"[^>]*data-l="(\w+)"/g)].map(m => m[1])
    .filter(id => id !== 'none');
  assert.deepEqual(chips.sort(), ids.sort(),
    'the picker and the lens registry disagree. A lens with no chip is reachable '
    + 'from a URL and from nowhere a reader can press; a chip with no lens turns '
    + 'on nothing.');
});

test('⛔ …and every chip carries the count element the renderer writes into', () => {
  /* THE PAIRED HALF. A chip can exist and still be wrong: `drawChipCounts` writes
     `#n_<id>` on every frame, so a chip whose span is missing or misnamed gives a
     silent `null` write — the layer looks present and its count never moves. */
  const ids = /const LENS=\{([\s\S]*?)\};/.exec(app)[1].match(/(\w+):/g).map(s => s.slice(0, -1));
  for (const id of ids)
    assert.match(app, new RegExp(`data-l="${id}"[^>]*>[\\s\\S]{0,200}?id="n_${id}"`),
      `the ${id} chip has no #n_${id} span, so its count is written to nothing`);
});


/**
 * ⛔ CHENG MADE THE COMPARISON A CONDITION OF THE LAYER, AND NOTHING WATCHED IT.
 *
 * *"Showing the winner without the comparison is where it would become who took
 * it"* — a different and much weaker lesson, since who wins draws is the
 * archive's cleanest null at 50.4%. The zone-start caption therefore has to
 * carry the ratio, and until this test it could have been edited away in a
 * copy pass with 1,176 tests still green. The layer shipped that way for a day.
 *
 * ⭐ AND IT IS CHECKED AGAINST THE PUBLISHED DOCUMENT, NOT AGAINST ITSELF. The
 * figures come from `measures.json`'s `census.endZone` — the same 165,420-draw
 * record the sentence is about — so the day `derive.yml` moves them, the caption
 * quoting the old ones goes red. A guard whose reference is a constant typed
 * beside it is the shape `LAYER_TOKENS` already taught this project.
 *
 * ⚠️ THE RATIO IS DERIVED, NEVER TYPED. `2.2` is `zoneWorth / winningWorth`
 * rounded to one place; asserting the string "2.2" against a literal 2.2 here
 * would be a check that cannot tell the caption from its own copy of the answer.
 */
test('⛔ the zone-start caption carries the archive comparison, from the archive', () => {
  const m = /const DRAWS=\{([\s\S]*?)\};\n/.exec(app);
  assert.ok(m, 'DRAWS has moved — this check has lost its subject');
  const line = /\bzonestart:'((?:[^'\\]|\\.)*)'/.exec(m[1]);
  assert.ok(line, 'the zone-start caption has moved or changed quoting');
  const say = line[1];

  const ez = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'))
    .census.endZone;
  for (const k of ['zoneWorth', 'winningWorth', 'n'])
    assert.ok(Number.isFinite(ez[k]), `census.endZone.${k} is missing — the reference is gone`);

  assert.ok(say.includes(String(ez.zoneWorth)),
    `the caption does not quote census.endZone.zoneWorth (${ez.zoneWorth})`);
  assert.ok(say.includes(String(ez.winningWorth)),
    `the caption does not quote census.endZone.winningWorth (${ez.winningWorth})`);

  const ratio = (ez.zoneWorth / ez.winningWorth).toFixed(1);
  assert.ok(say.includes(`${ratio} times`),
    `the caption must state the ratio the archive gives — ${ratio} times, from `
    + `${ez.zoneWorth} / ${ez.winningWorth} over ${ez.n.toLocaleString()} draws`);

  /* ⭐ AND THE DIRECTION, because a ratio with the operands swapped is still a
     number and still reads fluently. The claim is that being THERE outweighs
     WINNING there, which is what makes the layer worth building. */
  assert.ok(ez.zoneWorth > ez.winningWorth,
    'the archive no longer says being in the zone outweighs winning the draw — '
    + 'the caption is now telling a reader the opposite of the record');
});
