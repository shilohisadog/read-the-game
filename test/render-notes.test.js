/**
 * Legend keys, the empty-net note, the verdict card and the first-visit greeting
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich, app, PAGE_CSS, prose, boot, CURVE_AND_MIX } from './helpers/page.js';

/**
 * ⭐ THE LAYER KEYS LEFT THE LEGEND ON 2026-08-25 — they did not stop existing.
 *
 * `docs/below-the-rink-2.md` §7.2: a layer's key IS its description, and drawing
 * them apart is what left five metric layers as five unexplained nouns in one
 * block and four unattached marks in another. One row now carries the mark, the
 * name, what it counts and its state.
 *
 * So the rule these tests are about is unchanged and its MECHANISM moved: from
 * `#rg.slot .legend .lk-hd` to `#rg .lrow[aria-pressed="true"] .lon`. Same
 * claim — a mark is named only while the ice is drawing it.
 */
const LAYER_ROWS = ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock'];
/**
 * And the keys gated on the GAME's state rather than on a button.
 *
 * Kept separate because the button test below drives a control, and `lk-ends`
 * has no control to drive — folding it into the map above would have made that
 * test look for a `lyEnds` that does not exist. The stylesheet claim is the
 * same for both, so that one iterates over the pair.
 */
const GAME_STATE_KEYS = { 'lk-ends': 'endskey', 'lk-unrec': 'unrec' };

/**
 * ⭐ ONE ROW, ONE ACTIVE ITEM — and "one" was a MEASUREMENT, not a preference.
 *
 * CHENG's question before any placement: does anyone want two layers on at once?
 * Counted over every layer link the site ships — the nine doors on
 * `what-you-can-see.html` and the rest — whistle 5, slot 4, corsi 2,
 * goaltending 1, and ZERO naming two. `deeplink.js` has been able to join on a
 * comma the whole time and we have never once used it.
 */
/**
 * ⭐ THE GAME PAGE CARRIES THE WHOLE NAV.
 *
 * Kevin, 2026-08-26: "the topmost header on the page, the area with Watch a
 * game, Teams, By Date, etc., I think that should be on the game page." That
 * overrules the `minimal` header CHENG had ruled for — his argument was about
 * the FUNNEL, and a nav is not a funnel: a game page reached from a shared link
 * is the one page here a stranger is most likely to land on cold.
 *
 * ⭐ COMPARED AGAINST THE FRONT PAGE'S OWN HEADER, not against a list typed
 * here. A test carrying its own copy of the five links passes the day someone
 * adds a sixth to `_NAV` and the game page quietly ships four of six.
 */
test('the game page ships the same nav as the front page', () => {
  const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  const nav = src => {
    const m = /<header class="sitehdr">([\s\S]*?)<\/header>/.exec(src.replace(/<!--[\s\S]*?-->/g, ''));
    return m && [...m[1].matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(x => `${x[2]} -> ${x[1]}`);
  };
  const g = nav(app), i = nav(index);
  assert.ok(g && g.length >= 5, `the game page header has ${g ? g.length : 0} links: ${JSON.stringify(g)}`);
  assert.deepEqual(g, i, 'the two headers have drifted apart');

  // AND THE LEDE IS BACK, in its own words rather than the front page's.
  assert.match(app.replace(/<!--[\s\S]*?-->/g, ''),
    /<h1 class="pagelede">Learn to read hockey[^<]*add metrics after<\/h1>/,
    'the game page lost the sentence that says what to do on it');

  // ⚠️ AND NOTHING SHIPPED A MARKER. `str.replace` cannot fail — it just does not
  // happen — and a `__PLACEHOLDER__` has reached a built page from this builder
  // before. The builder asserts it where the substitution is made; this asserts
  // the artifact. Kept when the shared-headline experiment was reverted, because
  // the guard was the half of that change worth keeping.
  for (const [name, src] of [['game.html', app], ['index.html', index]])
    assert.doesNotMatch(src, /__[A-Z_]{3,}__/, `${name} shipped an unsubstituted marker`);
});

test('the selector holds exactly one choice, and the base view is one of them', () => {
  const CHIPS = ['none', 'corsi', 'slot', 'blocked', 'goaltending', 'whistle'];
  const chip = (a, l) => a.$$('#rg .pk').find(b => b.dataset.l === l);
  const checked = a => a.$$('#rg .pk').filter(b => String(b.getAttribute('aria-checked')) === 'true')
                        .map(b => b.dataset.l);

  const a = boot();
  assert.deepEqual(checked(a), ['none'], 'the page opens with something other than the base view chosen');

  // ⭐ AND ITS LABEL DOES NOT CLAIM THE PAGE IS SHOWING NOTHING. Kevin: "it's not
  // really Nothing, shouldn't that say Just events?" With no metric on, the rink
  // is drawing every recorded event — the base view the header tells a reader to
  // watch FIRST. `Nothing` described the layer state and lied about the screen.
  const base = /<button class="pk" id="pkNone"[^>]*>([^<]+)</.exec(app)[1];
  assert.doesNotMatch(base, /^(nothing|none|off)$/i,
    `the base choice is labelled "${base}", which says the page is blank while it draws the whole game`);
  assert.match(base, /event/i,
    `the base choice is labelled "${base}" — it is the events, in the vocabulary the rest of the page uses`);

  // ⭐ THE INVARIANT, NOT A SEQUENCE OF EXPECTED VALUES. Whatever you press, the
  // row holds exactly one — which is the property a radiogroup claims, and the
  // one that a set of five independent booleans cannot be trusted to keep.
  for (const l of [...CHIPS, ...CHIPS.slice().reverse(), 'corsi', 'corsi']) {
    chip(a, l).click();
    assert.deepEqual(checked(a), [l], `pressing ${l} did not leave exactly ${l} checked`);
  }

  // AND THE CLASS ON THE ROOT IS WHAT DRAWS THE ICE, so it has to follow. A row
  // that reports a layer the rink is not drawing is the control-that-reports-an-
  // effect-it-is-not-having defect, which this repo has shipped before.
  const CLASS = { corsi: 'corsi', slot: 'slot', blocked: 'blocked', goaltending: 'goalie', whistle: 'whistle' };
  for (const [l, cls] of Object.entries(CLASS)) {
    chip(a, l).click();
    assert.ok(a.$('rg').classList.contains(cls), `${l} is checked and the ice is not drawing it`);
    const others = Object.entries(CLASS).filter(([k]) => k !== l).map(([, c]) => c);
    for (const o of others)
      assert.equal(a.$('rg').classList.contains(o), false,
        `${l} is checked and the ice is still drawing ${o} — two layers at once`);
  }
  chip(a, 'none').click();
  for (const cls of Object.values(CLASS))
    assert.equal(a.$('rg').classList.contains(cls), false, `Nothing left ${cls} on the ice`);
});

test('a deep link checks its own chip, and the row is never hidden', () => {
  // EIGHT OF THE NINE DOORS ARRIVE WITH A LAYER ON. The chip is not set by the
  // link handler — it is DERIVED from the same booleans the link sets, so a new
  // way to turn a layer on is covered the day it is added.
  for (const [token, cls] of [['whistle', 'whistle'], ['corsi', 'corsi'], ['slot', 'slot'],
                              ['goaltending', 'goalie']]) {
    const d = boot(null, null, `?game=2023020204&layer=${token}`);
    const on = d.$$('#rg .pk').filter(b => String(b.getAttribute('aria-checked')) === 'true')
                 .map(b => b.dataset.l);
    assert.deepEqual(on, [token], `?layer=${token} left the row showing ${on.join()}`);
    assert.ok(d.$('rg').classList.contains(cls));
  }

  // ⭐ AND A URL CAN ASK FOR TWO, because a person can type one. The row cannot
  // represent it; what it must not do is go blank, which would say the page is
  // off while the ice is drawing two layers.
  const both = boot(null, null, '?game=2023020204&layer=corsi,slot');
  const on = both.$$('#rg .pk').filter(b => String(b.getAttribute('aria-checked')) === 'true')
               .map(b => b.dataset.l);
  // ⚠️ `on.length === 1` WAS THE WHOLE ASSERTION AND IT COULD NOT FAIL. A build
  // that fell back to `none` also checks exactly one chip, so the count passed
  // while the row said the page was off with two layers drawing. Caught by
  // mutating the fallback and watching nothing go red. The claim is not "one
  // chip is lit", it is "the lit chip is one of the layers that is ON".
  assert.deepEqual(on, ['corsi'],
    `a two-layer link left the row showing ${on.join() || 'nothing at all'} while the ice drew two`);
  assert.ok(both.$('rg').classList.contains('corsi') && both.$('rg').classList.contains('slot'),
    'the link was silently reduced to one layer — the row is a view, not a gate');

  // The selector is the only control for layers now, so nothing may hide it.
  // ⚠️ SCOPED TO THE GAME PAGE, because `#rg.preview .pickrow{display:none}` is
  // correct and my first version of this assertion failed on it: the homepage
  // hero is an iframe of this page with every control hidden, and a check that
  // cannot tell "hidden in the hero" from "hidden for the reader" is not a check
  // about the reader. The rules are split on `.preview` before matching.
  const forTheReader = PAGE_CSS.split('\n').filter(l => !l.includes('.preview')).join('\n');
  assert.doesNotMatch(forTheReader, /\.pickrow[^{]*\{[^}]*display:none/,
    'the selector can be hidden — the menu it replaced is parked, so that is every control gone');
  assert.match(PAGE_CSS, /#rg\.preview \.pickrow\{display:none!important\}/,
    'the homepage hero would show the selector over its own rink');
  assert.match(app, /class="pickrow"[^>]*role="radiogroup"/,
    'the row is six unrelated buttons rather than a one-of-N group');

  // ⚠️ AND THE CHIPS ARE TAP TARGETS. The first draft was 38px and the probe
  // counted six controls under the floor where the page had none — a silent
  // give-back of the 21-of-21 → 0-of-17 result that §9 was measured on. The
  // suite cannot see a rendered height, so it pins the rule that sets it.
  assert.match(PAGE_CSS, /#rg \.pk\{[^}]*min-height:44px/,
    'the selector chips are under the 44px touch floor, on the surface whose reviewer is on a phone');
});

/**
 * ⭐ THE CHROME IS FLUSH AND THE GUTTER MOVED ONTO THE CONTENT.
 *
 * Kevin, 2026-08-27: "I much prefer the no padding, it tightens up the top of
 * the page, which looks better than the home page, let's default to that." The
 * game page had never carried the site's body rule — it ran on the browser's
 * default 8px margin — so the same header sat flush there and 44px down here.
 *
 * The padding is MOVED, not deleted: `body{padding:0}` on its own runs text into
 * the viewport edge on a phone, which is the version of this change that looks
 * tidy in a diff and is wrong on the device that matters.
 */
test('every page has flush chrome and a gutter on its content', () => {
  const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  // ⚠️ EVERY `body` RULE, NOT THE FIRST ONE. The first version took one match and
  // it found the shared chrome's `body{margin:0}` — which has no padding, so the
  // assertion passed while the page's OWN body rule two blocks later carried
  // 44px. Mutating the padding back in changed nothing and that is how it was
  // found: a check pointed at the wrong declaration reports on the wrong page.
  const rules = (src, sel) => [...src.replace(/<!--[\s\S]*?-->/g, '')
    .matchAll(new RegExp(`(?:^|[};\n])\\s*${sel}\\s*\\{([^}]*)\\}`, 'g'))].map(m => m[1]);
  for (const [name, src, wrapSel] of [['index.html', index, '\\.wrap'], ['game.html', app, '#rg \\.wrap']]) {
    const bodies = rules(src, 'body');
    assert.ok(bodies.length, `${name} has no body rule at all`);
    // ⚠️ THE VALUE IS PARSED, NOT PATTERN-MATCHED. `/padding:(?!0[;}])/` looked
    // right and failed on `padding:0` as the LAST declaration, because there is
    // no `;` or `}` inside the captured block for the lookahead to find. A
    // regex that has to know where a rule ends is doing the parser's job badly.
    for (const body of bodies) {
      const pad = /(?:^|;)\s*padding\s*:\s*([^;]+)/.exec(body);
      if (pad) assert.equal(pad[1].trim(), '0',
        `${name} has a body rule padded "${pad[1].trim()}" — its header is inset while another page's is flush`);
    }
    assert.ok(bodies.some(b => /margin:0/.test(b)), `${name}'s body relies on the browser's default margin`);
    const wraps = rules(src, wrapSel);
    assert.ok(wraps.some(w => /padding:/.test(w)),
      `${name} moved the padding off the body and gave the content none — the text runs into the edge on a phone`);
  }
});

/**
 * ⭐ A RULE BETWEEN THE BASE VIEW AND THE FIVE LENSES.
 *
 * Kevin: "should we have a faint vertical line between Just events and the
 * others? That'll differentiate the two distinct sets of toggles." Two kinds of
 * thing in one row — the game as recorded, and lenses over it.
 */
test('the selector separates the base view from the metrics', () => {
  const clean = app.replace(/<!--[\s\S]*?-->/g, '');
  const row = /<div class="pickrow"[\s\S]*?<\/div>/.exec(clean)[0];
  const order = [...row.matchAll(/data-l="([a-z]+)"|class="(pksep)"/g)]
                  .map(m => m[1] || m[2]);
  assert.deepEqual(order.slice(0, 3), ['none', 'pksep', 'corsi'],
    `the rule is not between the base view and the first metric: ${order.join(' ')}`);
  assert.equal(order.filter(x => x === 'pksep').length, 1,
    'more than one rule — the row has grown a grouping nobody decided on');
  assert.match(row, /<span class="pksep" aria-hidden="true">/,
    'the rule is announced to a screen reader as if it were content');

  // IT IS A FLEX ITEM, NOT A PSEUDO-ELEMENT ON THE NEXT CHIP. The row wraps at
  // 390; a `::before` on `Attempts` would hang at the left edge of whatever line
  // that chip happened to start.
  assert.match(PAGE_CSS, /#rg \.pksep\{flex:0 0 1px;align-self:stretch/,
    'the rule is not a flex item, so wrapping can strand it at the start of a line');
});

/**
 * ⭐ WHERE THE LAYER'S INFORMATION LIVES — one slot, because one layer.
 *
 * Kevin, 2026-08-27: "I think we now can figure out where the layer information
 * lives (once the toggle is selected)..... I've (we've) struggled with that."
 * The struggle had one cause: five layers could be on at once, so five notes
 * needed homes, and every home was either far from the ice or grew the page by
 * five blocks. A selector makes it ONE line, under the control that chose it.
 */
test('the caption says what the chosen lens is, in the words the rows carry', () => {
  const a = boot();
  const cap = () => a.$('lcap').innerHTML;
  const text = () => cap().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // ⭐ SOURCED FROM THE PARKED ROWS, NOT RETYPED. `.lds` and `.lon` have shipped
  // hidden since §20; this is their home. A second copy of the sentences could
  // never be checked against the first — this can.
  for (const [token, rowId] of [['corsi', 'lyCorsi'], ['slot', 'lyHd'], ['blocked', 'lyBlock'],
                                ['goaltending', 'lyGoalie'], ['whistle', 'lyWhistle']]) {
    a.$$('#rg .pk').find(b => b.dataset.l === token).click();
    const row = app.match(new RegExp(`<button class="lrow" id="${rowId}"[\\s\\S]*?</button>`))[0];
    const lds = /<span class="lds">([^<]+)</.exec(row)[1];
    const lon = /<span class="lon">([^<]+)</.exec(row)[1];
    assert.ok(text().includes(lds), `${token}'s caption does not carry the row's description`);
    assert.ok(text().includes(lon), `${token}'s caption does not say what appears on the ice`);

    // ⚠️ AND THE NAME IS THE CHIP'S, NOT THE ROW'S. The parked rows still carry
    // the names they had when Kevin trimmed them — `Corsi`, `Slot shots` — while
    // the chips say `Attempts`, `Slot`. The first build opened the sentence with
    // a name the reader had never pressed.
    const chip = a.$$('#rg .pk').find(b => b.dataset.l === token).textContent;
    assert.match(cap(), new RegExp(`<b>${chip}</b>`),
      `${token}'s caption opens with something other than the chip that was pressed`);
  }

  // ⭐ AND `Just events` GETS THE BASE KEY — the marks the rink draws whether or
  // not a layer is on, which have had nothing naming them since §20 parked the
  // reference zone. Same source rule: it is the legend's own entries.
  a.$$('#rg .pk').find(b => b.dataset.l === 'none').click();
  const legend = /<div class="legend">([\s\S]*?)<\/div>/.exec(app)[1];
  const names = [...legend.matchAll(/<span class="kn">([^<]+)</g)].map(m => m[1]);
  assert.ok(names.length >= 4, `the legend has only ${names.length} entries to draw on`);
  for (const n of names)
    assert.ok(text().includes(n), `the base view's key does not name "${n}"`);

  // ⚠️ AND THE ENTRIES ARE JOINED WITH A REAL SEPARATOR. The legend's markup has
  // no whitespace between entries and each is `nowrap`, so pasting its innerHTML
  // produced ONE unbreakable run 1,166px wide inside a 390px phone — the body
  // scrolled sideways, which this project forbids outright. Inline boxes with
  // nothing between them offer no wrap opportunity.
  assert.match(cap(), /<\/span> · <span/,
    'the base key is pasted as one blob — with nowrap entries that is a 1,166px line on a phone');
});

test('the page is parked at its base, and nothing was deleted to get there', () => {
  // ⏸ Kevin, 2026-08-26: "let's just remove all the extra stuff, for now, then we
  // can rebuild properly. Just have the header, scoreboard, rink, play controls
  // and then the footer. We need to start fresh on the layers."
  const row = id => app.match(new RegExp(`<button class="lrow" id="${id}"[\\s\\S]*?</button>`))[0];

  // ⭐ PARKED, NOT DELETED — the rebuild starts from working code, not from git log.
  for (const id of LAYER_ROWS) {
    assert.match(row(id), /<span class="lds">[^<]{20,}</, `${id}'s description was deleted rather than parked`);
    assert.match(row(id), /<span class="lon">[^<]{20,}</, `${id}'s on-the-ice note was deleted rather than parked`);
  }
  assert.match(PAGE_CSS, /#rg \.zlayers,#rg \.zref,#rg \.zdisp\{display:none\}/,
    'the base page is carrying the layer furniture again');
  // ⚠️ AND THE PITCH NEEDS ITS OWN RULE AT (1,2,0). `#rg.newcomer .newcomer` sets
  // display:block, so a rule at (1,1,0) reads as if it parked the block and does
  // nothing — it shipped that way and only the render showed it.
  assert.match(PAGE_CSS, /#rg\.newcomer \.nwhy2\{display:none\}/,
    'the "why add a layer" pitch is parked by a rule that loses to the greeting\'s own');

  // ⏸ THE ENDS LINE IS PARKED TOO, BY NAME. Kevin: "remove the orphaned '...switch
  // ends every period...'". ⚠️ It is a DISCLOSURE, which §20 argued is doctrine
  // rather than furniture — so this is an explicit override and it is debt. The
  // OTHER disclosure is untouched, and that asymmetry is the thing asserted:
  // parking one is a decision, parking both by accident is a defect.
  assert.match(PAGE_CSS, /#rg\.endskey \.lk-ends\{display:none\}/,
    'the ends line is back on the page');
  assert.doesNotMatch(PAGE_CSS, /\.lk-unrec\{display:none\}/,
    'the unrecorded-games disclosure was parked along with the ends line — nobody asked for that');
  for (const key of Object.keys(GAME_STATE_KEYS))
    assert.match(app, new RegExp(`class="disclose lkey ${key}"`), `${key} left the page`);
});

/**
 * ⭐ EVERY ZONE BELOW THE RINK IS A DISCLOSURE — AND A COLLAPSE IS ONLY SAFE
 * WITH BOTH SAFETY HALVES.
 *
 * Kevin, 2026-08-26: "I want LAYERS to be collapsible too, it looks a lot better
 * for consistency." The argument against was the conversion — the one thing the
 * site exists to get a visitor to do would start behind a closed drawer — and it
 * is answered by mechanism rather than by an exception:
 *
 *   1. the summary SAYS WHAT IS ON INSIDE IT, so marks cannot appear on the ice
 *      with nothing on screen accounting for them;
 *   2. the zone OPENS ITSELF when it arrives with a layer on, so a deep link can
 *      always turn off what it turned on.
 *
 * `what-you-can-see.html` enters this page nine times, EIGHT with a layer
 * already on, and CHENG's recorded ruling killed the last wholesale move of
 * these controls because it made a door a one-way trip.
 */
test('every zone below the rink is a disclosure, with a 44px summary', () => {
  const zones = app.match(/<details class="zone [a-z]+"/g) || [];
  assert.equal(zones.length, 4, `expected four collapsible zones, found ${zones.length}`);
  assert.match(PAGE_CSS, /#rg details\.zone>summary\{[^}]*min-height:44px/,
    'a summary is the only control in a closed zone and it is under the touch floor');
});

/**
 * ⭐ AND THE TWO DISCLOSURES ARE DELIBERATELY OUTSIDE EVERY ONE OF THEM.
 *
 * `#rg.unrec .lk-unrec` carries the sentence for the 73 games where the league's
 * boxscore contradicts the league's own event log. Its own note in the
 * stylesheet has said since it was written that "a disclosure a reader reaches
 * only by turning something on is not a disclosure" — and putting it inside a
 * panel that now starts CLOSED is that defect with a different lid. The ends
 * sentence is the same kind of thing. They were lifted out when the reference
 * panel became collapsible, and this is what stops them drifting back in.
 */
/**
 * ⭐ THE GAME LINE SAYS WHICH GAME IT IS.
 *
 * Kevin: "under Watch another game, the current game needs to be specified as
 * such, right now there's a disconnect between the date in that section and the
 * replay." Under that heading a bare `CAR at VGK · 14 June 2026` reads as one of
 * the games on OFFER, and it is the one date on the page a reader has no reason
 * to attach to what they are watching.
 *
 * THE LABEL IS A SEPARATE ELEMENT, on purpose. `#gl`'s text is what the deploy
 * gate greps out of the live page, and `shell.test.js` pins the two together —
 * so the fix adds a sibling rather than rewording the line, and the gate keeps
 * matching what it has always matched.
 */
test('the game line is part of the scoreboard, and the gate can still read it', () => {
  // ⭐ THREE HEADINGS BECAME TWO. Kevin, with a screenshot of `WATCHING` /
  // `WATCH ANOTHER GAME` / `NOW WATCHING` inside 220px: "somewhat cumbersome
  // when reading top to bottom... could we put the current game info into the
  // scoreboard? then we could remove that small section."
  //
  // The board already names both clubs, so the only NEW fact in that line is the
  // DATE — the one thing a reader arriving from a shared link is missing. In the
  // board it needs no label: nothing else there could be "CAR at VGK · 9 June".
  const clean = app.replace(/<!--[\s\S]*?-->/g, '');
  const board = /<div class="board">([\s\S]*?)\n<\/div>/.exec(clean)[1];
  assert.match(board, /id="gl"/, 'the game line is not in the scoreboard');
  assert.doesNotMatch(clean, /class="nowlab"/,
    'the "Now watching" label survived — that is the third heading this removed');
  const zone = /<details class="zone znext">[\s\S]*?<\/details>/.exec(clean)[0];
  assert.doesNotMatch(zone, /id="gl"/, 'the game line is in both places');

  // ⭐ THE CLAIM IS "ONE HEADING SAYS WATCH", NOT "THIS ONE DOES NOT SAY WATCHING".
  // The first version asserted `!/watching/i` on the zone and PASSED when the
  // heading went back to `Watch another game` — because that is `Watch`, not
  // `watching`. Found by mutation. What Kevin actually reported is a COUNT:
  // three variants of one word stacked in 220px. So the count is what is checked,
  // over every heading on the page rather than over one element.
  const headings = [...clean.matchAll(/<summary class="zh">([^<]*)|<span class="pklab">([^<]*)|<span class="nowlab">([^<]*)/g)]
    .map(m => (m[1] || m[2] || m[3]).trim()).filter(Boolean);
  const watchy = headings.filter(h => /watch/i.test(h));
  assert.deepEqual(watchy, ['Watching'],
    `${watchy.length} headings say "watch" — the stack Kevin measured was three: ${JSON.stringify(headings)}`);

  // ⚠️ AND THE LINE ITSELF IS UNTOUCHED, which is what keeps the deploy gate
  // honest. It greps `#gl` out of the live DOM and matches AWAY-at-HOME against
  // an em-dash placeholder to decide the shell booted — a structural signal with
  // no prose in the path, given that property after a gate keyed to the word
  // `final` failed a working site. Moving the element is safe; rewriting its
  // sentence is not.
  const a = boot();
  assert.match(a.$('gl').textContent, / at /,
    'the game line stopped naming both clubs, and the live-watch gate greps for it');
  assert.match(app, /id="gl">—<\/p>|id="gl">—<\/span>/,
    'the placeholder stopped being an em-dash, so the gate can no longer tell empty from unbooted');
});

test('a disclosure is never inside a collapsed zone', () => {
  for (const id of ['endsKey', 'unrecKey']) {
    const before = app.slice(0, app.indexOf(`id="${id}"`));
    const opens = (before.match(/<details/g) || []).length;
    const closes = (before.match(/<\/details>/g) || []).length;
    assert.equal(opens, closes,
      `#${id} sits inside a <details> — a reader meets it only by opening something`);
  }
});

test('a collapsed layer menu still says what is on, and sits above the rink', () => {
  const shut = boot();
  assert.equal(shut.$('zLayersOn').textContent, '', 'the badge claims a layer with none on');
  assert.notEqual(shut.$('zLayers').open, true, 'the menu is open before anyone asked');

  // ⭐ EIGHT OF THE NINE DOORS ARRIVE LIKE THIS, AND THE DRAWER STAYS SHUT.
  // It used to open itself, because the menu was 1,219px down a phone page and a
  // deep link would otherwise have left the only way to turn the layer off below
  // the fold — CHENG's one-way trip. The menu is now above the rink, and keeping
  // the auto-open there cost the entire hero: measured at 390, the opened list is
  // 600px tall and pushed the rink top to y=830, so a door landed on a first
  // screen with no ice on it. The badge is what makes the shut drawer safe.
  const door = boot(null, null, '?game=2023020204&layer=whistle');
  assert.notEqual(door.$('zLayers').open, true,
    'the drawer opened itself again — at 390 that puts the rink off the first screen');
  assert.equal(door.$('zLayersOn').textContent, '1 layer on',
    'a deep link put marks on the ice with nothing on screen naming them');

  // ⭐ AND THE POSITION IS NOW LOAD-BEARING, so it is asserted rather than assumed.
  // Reachability rests on the menu being on the first screen; the unit suite has
  // no layout, so what it can check is document order.
  //
  // ⭐ IT WENT ABOVE THE RINK FIRST, AND THAT WAS WRONG. CHENG, and Kevin
  // agreeing: this page's header says EVENT BY EVENT FIRST, ADD METRICS AFTER,
  // and five decisions between that sentence and the ice make the layout
  // contradict the copy. The menu now sits DIRECTLY BELOW the rink — after the
  // game, adjacent to the marks it changes, and still above the fold: measured
  // at 390 the ice starts at y=222 and the menu at y=464, 12px under the boards.
  // Both halves are pinned, because each one broke on its own: below the rink it
  // was 236px away behind the transport (the disconnect Kevin reported), and
  // above it, it preceded the ice.
  const board = app.indexOf('class="board"');
  const rink = app.indexOf('class="rinkbox"');
  const menu = app.indexOf('id="zLayers"');
  const transport = app.indexOf('class="transport"');
  assert.ok(board < rink && rink < menu,
    `the layer menu is not after the ice — the header says metrics come after (board ${board}, rink ${rink}, menu ${menu})`);
  assert.ok(menu < transport,
    `the layer menu fell below the transport, which is the 236px gap Kevin called disjointed (menu ${menu}, transport ${transport})`);

  // AND THE BADGE COUNTS, rather than saying "on". Two layers is a different
  // sentence from one, and singular/plural is where this kind of readout ships
  // broken — the ternary only ever runs one arm at a fixed number of layers.
  door.$('lyCorsi').click();
  assert.equal(door.$('zLayersOn').textContent, '2 layers on');
  door.$('lyCorsi').click(); door.$('lyWhistle').click();
  assert.equal(door.$('zLayersOn').textContent, '', 'the badge outlived the last layer');
});

test('the two game-state disclosures are still gated, and are no longer keys', () => {
  // They never were keys: neither has a swatch, and every other row in the
  // legend is a mark and its name. They are sentences about the GAME, so they
  // are drawn as sentences under the panel rather than among the marks.
  for (const [key, cls] of Object.entries(GAME_STATE_KEYS)) {
    assert.match(app, new RegExp(`class="disclose lkey ${key}"`),
      `${key} is not on the page at all`);
    assert.match(PAGE_CSS, new RegExp(`#rg\\.${cls} \\.${key}`),
      `${key} has no rule revealing it when ${cls} is true of the game`);
  }
  assert.match(PAGE_CSS, /#rg \.lkey\{display:none\}/,
    'the disclosures are not hidden by default, so they are not conditional');

  const legend = /<div class="legend">([\s\S]*?)<\/div>/.exec(app)[1];
  assert.doesNotMatch(legend, /lkey/,
    'a disclosure is back inside the key list, where a row with no swatch reads as a wall');
});

test('the state each layer row reports is REALLY the state of the layer', () => {
  // The half that makes the rule above mean something. A note gated on an
  // aria-pressed nothing sets is a note nobody ever sees — the mirror of the
  // defect being fixed, and exactly as invisible. And the state PILL is checked
  // beside the class, because a row that says "On" over a layer that is off is
  // the control-reporting-an-effect-it-is-not-having defect.
  const a = boot();
  for (const cls of ['slot', 'blocked'])
    assert.equal(a.$('rg').classList.contains(cls), false, `${cls} is on before anyone asked`);
  // THE RESTING STATE IS READ FROM THE MARKUP, not through the fake. No setter
  // runs at boot — the document ships every row saying `Off` — so asserting the
  // fake's element here would pin the harness rather than what a browser shows.
  for (const id of ['stCorsi', 'stHd', 'stGoalie', 'stWhistle', 'stBlock'])
    assert.match(app, new RegExp(`<span class="st" id="${id}">Off</span>`),
      `${id} does not ship saying the layer is off`);

  a.$('lyHd').click();
  assert.equal(a.$('stHd').textContent, 'On', 'the slot row does not say it is on');
  assert.equal(String(a.$('lyHd').getAttribute('aria-pressed')), 'true',
    'the row is pressed in fact but not in the attribute its note is gated on');
  a.$('lyHd').click();
  assert.equal(a.$('stHd').textContent, 'Off', 'the row keeps saying On after the layer left');

  a.$('lyHd').click();
  assert.ok(a.$('rg').classList.contains('slot'), 'the slot layer sets no class, so its key can never appear');
  a.$('lyBlock').click();
  assert.ok(a.$('rg').classList.contains('blocked'));

  a.$('lyHd').click();
  assert.equal(a.$('rg').classList.contains('slot'), false, 'the key would stay after its marks left');

  // ⭐ AND THE STATE IS DRAWN AS A SWITCH, WITHOUT THE WORD LEAVING THE PAGE.
  // Kevin: "I was thinking of the Metrics layers buttons as just toggles."  The
  // pill became a track with a ::after knob — so the text `lyrState` writes is
  // clipped, not deleted, and the assertions above still describe what a screen
  // reader hears. A visual-only state is this control shipping broken for the
  // reader who cannot see the knob move, which is why both halves are pinned.
  assert.match(PAGE_CSS, /#rg \.lrow \.st\{[^}]*text-indent:-9999px/,
    'the state text is not clipped, so the switch has the word OFF printed across it');
  assert.match(PAGE_CSS, /#rg \.lrow \.st::after\{content:""/,
    'the switch has no knob — the track is a bare grey pill with no state in it');
  assert.match(PAGE_CSS, /#rg \.lrow\[aria-pressed="true"\] \.st::after\{transform:translateX/,
    'the knob never moves, so the switch reports the same thing on and off');
  assert.match(PAGE_CSS, /prefers-reduced-motion:reduce\)\{#rg \.lrow \.st/,
    'the knob animates for a reader who asked the system for no motion');
});

/**
 * ⭐ THE SLOT'S REASON IS COMPUTED, AND ITS ABSENCE IS SILENT.
 *
 * The legend said only WHERE the shading is — a definition, not a reason. The
 * reason is the share of goals scored from inside it, and the figure a design
 * document had been quoting existed in NO published artifact: `archive.js`
 * measures it now and the card reads it.
 *
 * TWO HALVES, and the second is the one that matters. A typed constant would
 * pass the first and go stale the next time the archive is re-derived, with
 * nobody ever seeing it happen — so the card must also say NOTHING when the
 * archive is not there, rather than falling back to a number somebody wrote.
 */
test('the slot card states its share from the archive, and nothing without one', () => {
  const withArchive = boot(rich, { ...CURVE_AND_MIX,
    slot: { n: 25000, count: 18000, rate: 0.72, unplaced: 4,
            population: 'NHL regular season and playoffs', what: 'x' } });
  const said = withArchive.$('slotSay').textContent;
  assert.match(said, /72% of goals/, `the card does not state the share: "${said}"`);
  assert.match(said, /18,000 of 25,000/, 'a percentage with no counts behind it');

  // THE NUMBER IS NOT IN THE DOCUMENT. If it were, the assertion above would
  // pass against a page that ignores the archive entirely.
  assert.doesNotMatch(app.split('<script>')[0], /\d+% of goals/,
    'the share is typed into the markup, so a re-derive cannot move it');

  // A PAGE WITH NO ARCHIVE SAYS NOTHING. `read-the-game.html` carries a single
  // game and never asks for one; a derive that has not run yet has no share to
  // give. Both keep the geometry and lose the clause.
  assert.equal(boot(rich, undefined).$('slotSay').textContent, '',
    'a page with no archive invented a share');
  assert.equal(boot(rich, { ...CURVE_AND_MIX, slot: { n: 0, count: 0, rate: null } })
    .$('slotSay').textContent, '',
    'an archive that measured nothing was reported as a rate anyway');
});

/**
 * AND THE BLUE LINE SAYS WHY IT CARRIES NO NUMBER.
 *
 * Kevin: "the blue line, at least the way I think of it, is more of a contested
 * area, not necessarily offside-focused." He is right about the hockey and the
 * feed cannot see it — holding a line produces no recordable event, which
 * `drawRink`'s own comment has said since the shading was built. So the card
 * states the RULE, which is the league's, and then states the limit, which is
 * ours. Doctrine §3: honest limits stated ON SCREEN.
 *
 * This is what stops the next edit reaching for "hotly contested" — an
 * assertion about hockey we have no measurement for, and the same move as the
 * "the ice teams fight to hold" clause this round removed.
 */
test('the blue-line card cites a rule and states what we do not measure', () => {
  const areas = /<div class="areas">([\s\S]*?)<\/div>\s*<div class="legend">/.exec(app)[1];
  const card = areas.split('<div class="area">').find(c => /blue line/i.test(c));
  assert.ok(card, 'there is no blue-line card');
  assert.match(card, /NHL Rule 83/, 'the offside claim cites no rule');
  assert.match(card, /<span class="lim">[^<]{20,}</,
    'the card carries no statement of what is NOT measured there');
  assert.doesNotMatch(card, /contested|battleground|fight|fierce/i,
    'the card asserts a contest we have no measurement for');
});

test('the permanent keys are the marks the BASE view actually draws', () => {
  // The other direction: what is left in the permanent legend must be drawn
  // without any layer on, or it is the same defect the conditional keys just
  // stopped committing.
  const a = boot();
  const drawn = a.every(d => d.$('events').innerHTML).join('') + a.every(d => d.$('puck').innerHTML).join('');
  for (const [cls, why] of [['att', 'attempt marks'], ['blkd', 'blocked-shot marks'], ['puck', 'the puck']])
    assert.match(drawn, new RegExp(`\\b${cls}\\b`), `the legend names ${why}, and the base view never draws them`);
  // And no conditional mark is drawn with every layer off.
  assert.doesNotMatch(drawn, /\bring hd\b/, 'a slot ring is drawn with the slot layer off');
});

test('in as-played the standing key is up from the very first frame', () => {
  // IT CANNOT BE EARNED BY A SWITCH, because the orientation it explains was set
  // at the opening faceoff. The host's raw period-one end is `right` in 38 of 60
  // games, which puts its net on the screen's left while its badge sits on the
  // board's right -- before anything has changed. That is why the permanent half
  // is a RULE about hockey and not a disclosure about us: a rules card does not
  // need a moment to have arrived.
  const a = boot(null, null, '?ends=as-played');
  const frames = a.every(d => d.$('rg').classList.contains('endskey'));
  assert.ok(frames.length > 100, 'the walk must cover the game');
  assert.ok(frames.every(Boolean), 'the key went away at some point, so a reader can lose it');
  assert.match(a.$('endsKey').textContent, /switch ends/, 'and it says the hockey');
});

test('the ends key arrives at the first period the ends did NOT switch', () => {
  // CHENG's R Q3: a sentence with no moment of use belongs on a how-it-works
  // page, not under the rink. This one HAS a moment — the first period change,
  // when a reader who knows hockey expects the teams to swap and they do not.
  // Before that nothing has yet failed to happen, so there is nothing to defend.
  //
  // READ THROUGH THE SCOREBOARD, not through `cur.per`. The class is set from
  // the event's period, so asserting it against the same field would be the
  // check built from the implementation's own model of its input. `#per` is
  // written by `periodLabel`, a different function with its own rules for
  // overtime and the shootout, and it is what a viewer actually sees.
  // THE CONTROL, EXPLICITLY. This gate is one-direction's, and its reason -- that
  // nothing has yet failed to occur -- is true only of the mode that holds the
  // rink still. Booting the default here would test the wrong sentence.
  const a = boot(null, null, '?ends=fixed');
  const frames = a.every(d => ({ per: d.$('per').textContent,
                                 key: d.$('rg').classList.contains('endskey') }));
  const first = frames.filter(f => f.per === 'Period 1');
  const later = frames.filter(f => f.per !== 'Period 1');
  assert.ok(first.length > 20 && later.length > 20,
    `the walk needs both sides of a period change, got ${first.length}/${later.length}`);
  assert.ok(first.every(f => !f.key), 'the key is up in the first period, before anything is owed');
  assert.ok(later.every(f => f.key), 'the game left the first period and the key never came');

  // And scrubbing BACK takes it away again, or it is a one-way latch dressed as
  // a condition — the same defect the verdict card's own test guards against.
  const scrub = a.$('scrub');
  scrub.value = '0'; scrub.oninput({ target: { value: '0' } });
  assert.equal(a.$('rg').classList.contains('endskey'), false,
    'the key stayed after the replay went back to the first period');
});

test('the empty-net note is present exactly while a net is really empty', () => {
  // The other half of the paragraph that came out, and the half with the real
  // moment: a figure vanishes off the ice and a novice has a question. An empty
  // net is a STATE, so the sentence lasts as long as the fact rather than
  // flashing for one 1.3-second frame.
  //
  // THE INSTRUMENT IS THE OTHER RENDERER. `drawNetmen` decides how many
  // goaltenders to draw and the note decides what to say; they read the same
  // recorded field through separate code, so disagreement is a real defect.
  // Counting figures also cannot be satisfied by the note's own logic.
  const a = boot();
  const frames = a.every(d => ({
    note: d.$('iceNote').textContent,
    gks: (d.$('netmen').innerHTML.match(/class="gkbody"/g) || []).length,
    per: d.$('per').textContent, clk: d.$('clk').textContent }));

  const withNote = frames.filter(f => f.note);
  assert.ok(withNote.length > 5, `only ${withNote.length} frames carry the note — it never fires`);
  assert.ok(frames.length - withNote.length > 200, 'the note is up for most of the game');
  for (const f of frames)
    assert.equal(!!f.note, f.gks < 2,
      `${f.per} ${f.clk}: ${f.gks} goaltenders drawn and the note says "${f.note}"`);

  // WHERE THE WINDOW IS, derived from the raw file rather than from the page.
  // clock.test.js pins the same window independently: Minnesota pulls at 01:40
  // of the third, and the situation code reads 0651 to the horn.
  const toSecs = s => { const [m, x] = String(s).split(':').map(Number); return m * 60 + x; };
  assert.ok(withNote.every(f => f.per === 'Period 3'), 'the note appears outside the third period');
  assert.ok(withNote.every(f => toSecs(f.clk) <= 100),
    'the note appears earlier than the pull the feed records');

  // AND IT NAMES THE TEAM THAT PULLED. `sit` is 0651 here: the AWAY goalie is
  // out, so a note naming the host would be the note pointing at the wrong net.
  const away = a.$('aAb').textContent, home = a.$('hAb').textContent;
  for (const f of withNote) {
    assert.match(f.note, new RegExp(`^${away} has pulled the goaltender`),
      'the note does not name the team the code says pulled');
    assert.doesNotMatch(f.note, new RegExp(`\\b${home}\\b`), 'it names the team that did not');
    assert.match(f.note, /situation code/, 'the note claims an empty net and cites nothing');
  }

  // AND IT TAKES NO ROOM WHEN IT HAS NOTHING TO SAY. Invisible to a fake
  // document with no CSS, so the claim is made against the stylesheet — the
  // same instrument, and the same limit, as the verdict card's own gate.
  assert.match(PAGE_CSS, /#rg \.icenote:empty\{display:none\}/,
    'a note with no text still occupies the page for the other 300 events');
});

test('the note follows the situation code, whichever net the code empties', () => {
  // THE REFERENCE GAME ONLY EVER EMPTIES THE VISITOR'S NET. A mutation that
  // deleted the host branch entirely survived the test above, and would have
  // survived any test built only on `rich.json` — a branch no fixture can reach
  // is a branch no green can speak for. Host teams pull goaltenders constantly;
  // this game just never does.
  //
  // So the GAME is re-coded, not the renderer stubbed. `sit` is a recorded
  // four-character field, [awayGoalie][awaySkaters][homeSkaters][homeGoalie],
  // and every code below is one the league emits.
  const recoded = code => {
    const g = JSON.parse(JSON.stringify(rich));
    for (const e of g.events) if (e.sit) e.sit = code;
    return g;
  };
  const noteAtTheHorn = code => {
    const a = boot(recoded(code));
    const scrub = a.$('scrub');
    scrub.value = scrub.max; scrub.oninput({ target: { value: scrub.max } });
    return { note: a.$('iceNote').textContent,
             away: a.$('aAb').textContent, home: a.$('hAb').textContent };
  };

  const v = noteAtTheHorn('0651');                       // the visitor pulls
  assert.match(v.note, new RegExp(`^${v.away} has pulled`));
  assert.doesNotMatch(v.note, new RegExp(`\\b${v.home}\\b`));

  const h = noteAtTheHorn('1560');                       // the HOST pulls
  assert.match(h.note, new RegExp(`^${h.home} has pulled`),
    'a host that pulled its goaltender is not named');
  assert.doesNotMatch(h.note, new RegExp(`\\b${h.away}\\b`), 'and the visitor is named instead');

  // BOTH NETS EMPTY. Legal, vanishingly rare, and the reason the note is mapped
  // over the pulled teams rather than branched on a count: a `has`/`have`
  // ternary here would be a second unreachable arm, which is the defect this
  // whole test exists to close rather than to repeat.
  const b = noteAtTheHorn('0660');
  assert.match(b.note, new RegExp(`\\b${b.away}\\b`), 'both goalies are out and one is unmentioned');
  assert.match(b.note, new RegExp(`\\b${b.home}\\b`));
  assert.equal((b.note.match(/has pulled the goaltender/g) || []).length, 2,
    'two empty nets, and the page states it once');

  // The control: a code with both goaltenders in says nothing at all.
  assert.equal(noteAtTheHorn('1551').note, '',
    'the note fires on a game where nobody pulled anybody');
});

test('the amber-ring tip is absent until the slot layer draws an amber ring', () => {
  // 55px of permanent instruction about a mark that does not exist unless a
  // layer is on — the same defect the legend had before it went progressive,
  // in a different block. The fake document has no CSS, so the claim is made
  // against the stylesheet, and the class it keys on is the one `setHd` already
  // toggles under test above.
  assert.match(PAGE_CSS, /#rg \.hint\{display:none/,
    'the tip shows before its mark exists');
  assert.match(PAGE_CSS, /#rg\.slot \.hint\{display:block\}/,
    'nothing brings the tip back when the layer is on');
  assert.match(prose, /class="hint"/, 'the tip is not on the page at all');
});

test('there is NO VERDICT until the replay reaches the end', () => {
  // CHENG's reframe of R Q1. The card is not a metric, it is the CONCLUSION —
  // and a game in the first period does not have one. Position on the page and
  // position in TIME are different axes, and the audit conflated them: the
  // objection to moving the card up was that the page would read result-first,
  // which stops being true once there is nothing to read until the end.
  //
  // The fake document has no CSS, so `display:none` is invisible to it. What it
  // CAN see is the class the stylesheet keys on — and the rule that spends it.
  const a = boot();
  assert.match(PAGE_CSS, /#rg \.verdict\{display:none\}/,
    'the card is visible before the game has produced a verdict');
  assert.match(PAGE_CSS, /#rg\.ended \.verdict\{display:block/,
    'nothing reveals the card once the game HAS produced one');

  const scrub = a.$('scrub'), last = +scrub.max;
  const at = k => { scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
                    return a.$('rg').classList.contains('ended'); };
  assert.equal(at(0), false, 'the opening faceoff already has a verdict');
  assert.equal(at(Math.floor(last / 2)), false, 'a game at the midpoint already has a verdict');
  assert.equal(at(last - 1), false, 'one event short of the end is not the end');
  assert.equal(at(last), true, 'the game ended and the card never arrived');
  assert.equal(at(3), false, 'the card stayed after scrubbing back into the game');
});

test('the card sits above the controls, not below them', () => {
  // The other half of Q1, and it is a claim about DOM order rather than pixels,
  // so it is checkable here. It was next-to-last: 1,156px below the rink on a
  // phone, screen 2.18 of 2.99, behind 230 words of read-once prose.
  // ⭐ LEGEND AND LAYERS SWAPPED ON 2026-08-25 and the swap is the point: the
  // conversion sits directly under the transport and the marks-reference is a
  // read surface below it.
  //
  // NEXT MOVED BACK BELOW DISPLAY ON 2026-08-26, which is not a reversal of the
  // reason it went up. That reason was that four real destinations had been
  // ranked below `Mascot` and `Tabletop`; once every zone is a collapsed bar,
  // nothing is meaningfully ranked below a 44px summary, and the reason no
  // longer applies. Kevin's ordering, and the argument for the old one expired
  // rather than being overruled.
  //
  // LAYERS LEFT THIS STACK ON 2026-08-26 — it is above the rink now, and its
  // order is asserted against the board and the rink in the deep-link test above.
  const order = ['class="transport"', 'class="verdict"',
                 'class="legend"', 'class="zone zdisp"', 'class="zone znext"'];
  let at = -1;
  for (const marker of order) {
    const k = app.indexOf(marker);
    assert.ok(k > at, `${marker} is out of order — the card has slipped back below the controls`);
    at = k;
  }
});

test('the even-strength note counts what actually dropped out, and agrees with the ledger', () => {
  // "Switch and watch which attempts drop out" asked the reader to go and look.
  // The note now says HOW MANY did, in the game in front of them — a claim with
  // its own evidence attached, which is the difference the whole site trades on.
  //
  // And the number is reconciled against the ledger rather than recomputed here:
  // a test that re-derived it from the events would be a second implementation
  // agreeing with the first, which is the defect measure.mjs exists to avoid.
  // ⭐ AND THE DEFAULT BRANCH IS NO LONGER EMPTY (2026-08-25). It used to be
  // required empty, which explained `Even strength only` only to a reader who
  // had already chosen it. What must NOT leak into the default is the live
  // count, because that is a fact about the ice at a moment — so the two are
  // checked apart: the default describes the control, the chosen state counts.
  const a = boot();
  const resting = a.$('nSit').textContent;
  assert.ok(resting, 'the situations control explains itself only after it is used');
  assert.doesNotMatch(resting, /\d/,
    'the resting note carries a number, so it is claiming something about a game nobody has filtered');

  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'even').click();
  const scrub = a.$('scrub');
  scrub.value = scrub.max; scrub.oninput({ target: { value: scrub.value } });

  const note = a.$('nSit').textContent;
  const n = +(note.match(/^(\d+)/) || [])[1];
  assert.ok(n > 0, `the note reports ${n} attempts dropped over a whole game at even strength only`);

  // RECONCILED AGAINST THE COUNTERS THE PAGE ITSELF SHOWS, in both modes, at the
  // same frame. Not against a re-derivation from the events: a test that
  // recomputed the number would be a second implementation agreeing with the
  // first, which is the defect measure.mjs exists to avoid. The attempts the
  // page stops counting when even-strength is chosen ARE the attempts the note
  // says dropped out.
  const total = d => +d.$('cA').textContent + +d.$('cH').textContent;
  const even = total(a);
  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'all').click();
  const all = total(a);
  assert.equal(all - even, n,
    `the note says ${n} dropped, but the counters fall by ${all - even} (${all} → ${even})`);
  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'even').click();

  // SINGULAR AND PLURAL, BOTH SEEN. "1 attempts have dropped out" is the kind of
  // thing that ships and then gets screenshotted, and a ternary read at ONE
  // frame only ever exercises one of its branches — the reference game drops 49,
  // so the singular arm was never run and a mutation collapsing it survived.
  // Walk to the frame where exactly one has gone.
  assert.match(note, /attempts have dropped out/, 'plural, at the end of the game');
  let sawOne = false;
  for (let k = 0; k <= +scrub.max; k++) {
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    const t = a.$('nSit').textContent;
    if (/^1 /.test(t)) { assert.match(t, /^1 attempt has dropped out/, 'singular is written as a plural'); sawOne = true; break; }
  }
  assert.ok(sawOne, 'no frame in this game drops exactly one attempt — the singular arm is untested');
  scrub.value = scrub.max; scrub.oninput({ target: { value: scrub.value } });

  // AND THE COUNT LEAVES WITH THE SETTING even though the note does not. This is
  // the half that keeps the §4.2 fix from becoming a stale-number bug: the
  // resting note describes the control, and must not go on reporting a figure
  // about a filter nobody has applied.
  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'all').click();
  const back = a.$('nSit').textContent;
  assert.ok(back, 'the note left with the setting instead of going back to describing the control');
  assert.doesNotMatch(back, /dropped out/,
    'the count outlived the setting that produced it');
});

/* --------------------------------------------------------------- the first visit
 *
 * Kevin: "she'll visit and say 'well, where should I click', 'why should I click
 * there', 'what's corsi (and why do I care)'. We absolutely need the first-visit
 * mechanism in place before showing it to a casual fan."
 *
 * And the reason that is not merely nice: he PREDICTED those responses. A test
 * whose outcome you can write down in advance produces no information — and a
 * first visit is not renewable, so spending the one novice we have on a page
 * with no orientation buys a finding that was free.
 */

/** A localStorage the page can actually remember things in. */
const memStore = (seed = {}) => {
  const m = { ...seed };
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m };
};

test('a first-time viewer is told where to click, and why', () => {
  const a = boot(rich, CURVE_AND_MIX);
  assert.ok(a.$('rg').classList.contains('newcomer'), 'a page with no memory greets nobody');
  // SPLIT BY SUBJECT: the instruction sits with the play button, the reason sits
  // with the layer buttons. Whole and above the rink it ran to 478px on a phone
  // and pushed the play button itself below the fold — the block told a first-
  // time viewer to press something that was not on their screen.
  const t = a.$('newcomer').innerHTML, w = a.$('newcomerWhy').innerHTML;
  assert.match(t, /Play from start/, 'never says where to click');
  assert.match(w, /Why add a layer\?/, 'never says why to click there');
  // "What's Corsi and why do I care" — answered with the archive's own inversion,
  // which is the site's reason to exist and had appeared NOWHERE a visitor to
  // this page could read it: three matches in game.html, all source comments.
  assert.match(w, /more shot attempts loses more often than it wins/,
    "the site's flagship finding is still absent from the page that demonstrates it");
  assert.match(w, /2,194 of 4,029/, 'the claim ships without its count');
  assert.match(w, /NHL regular season and playoffs/, 'the claim ships without its scope');
  assert.match(w, /one game is still one game/, 'the limit is dropped');
});

test('a returning viewer is not greeted', () => {
  const store = memStore({ 'rtg.seen': '1999-01-01|9' });
  const a = boot(rich, CURVE_AND_MIX, '', store);
  assert.equal(a.$('rg').classList.contains('newcomer'), false,
    'the ninth visit still gets the beginner tips');
});

test('the greeting survives a second game on the same day, and retires after a few days', () => {
  // DISTINCT DAYS, NOT PAGE LOADS. Watching three games in one sitting is still
  // one visit, and retiring the help mid-lesson is the defect this avoids.
  const store = memStore();
  const first = boot(rich, CURVE_AND_MIX, '', store);
  assert.ok(first.$('rg').classList.contains('newcomer'));
  const after = store._m['rtg.seen'];
  const again = boot(rich, CURVE_AND_MIX, '', store);
  assert.ok(again.$('rg').classList.contains('newcomer'), 'a second game the same day retired the tips');
  assert.equal(store._m['rtg.seen'], after, 'the same day was counted twice');

  const old = boot(rich, CURVE_AND_MIX, '', memStore({ 'rtg.seen': '1999-01-01|3' }));
  assert.equal(old.$('rg').classList.contains('newcomer'), false,
    'the counter never retires the tips');
});

test('the tips can be dismissed, and stay dismissed', () => {
  // A tip you cannot turn off is an advert.
  const store = memStore();
  const a = boot(rich, CURVE_AND_MIX, '', store);
  assert.ok(a.$('rg').classList.contains('newcomer'));
  a.$('nDone').click();
  assert.equal(a.$('rg').classList.contains('newcomer'), false, 'dismissing did nothing');
  const back = boot(rich, CURVE_AND_MIX, '', store);
  assert.equal(back.$('rg').classList.contains('newcomer'), false,
    'the dismissal was forgotten on the next visit');
});

test('storage refused means NEWCOMER, because the two errors are not equal', () => {
  // Private browsing throws. A returning viewer re-reading a tip loses a glance;
  // a novice shown nothing is the visitor we lose.
  const hostile = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const a = boot(rich, CURVE_AND_MIX, '', hostile);
  assert.ok(a.$('rg').classList.contains('newcomer'),
    'a browser that refuses storage turns every novice into a veteran');
});

test('a page that reaches no archive still says where to click', () => {
  // The inlined page has no rates, so it cannot quote the inversion. The
  // orientation must survive without it rather than vanishing with it.
  const a = boot();
  const t = a.$('newcomer').innerHTML;
  assert.match(t, /Play from start/);
  assert.doesNotMatch(t, /loses more often/, 'an archive claim was made with no archive');
});

test('the opening paragraph is the first-visit block, and it carries what the lede carried', () => {
  // KEVIN'S CALL: "they both give intro type info and I like the new bits much
  // better than the existing phrasing." Measured before agreeing — the block was
  // at y=953 on a 390px phone against a fold of 844, so the orientation a
  // newcomer needs was BELOW the game they had not been told how to start. And
  // the lede had gone stale: it named four layers when there were five.
  //
  // Two things it said that the block did not, and both had to survive.
  const a = boot(rich, CURVE_AND_MIX);
  const t = a.$('newcomer').innerHTML, w = a.$('newcomerWhy').innerHTML;
  assert.match(t, /scorer and assists/, 'the lede said what a goal call contains; nothing does now');
  assert.match(t, /Nothing is invented/, 'the trust claim died with the paragraph that carried it');
  assert.match(w, /shows its work/, 'the layers no longer promise to show their work');

  // AND IT MAY NEVER ENUMERATE THE LAYERS AGAIN. That list is what rotted: prose
  // naming four layers survived the arrival of a fifth because nothing checked
  // it. The block says "add a layer below" and lets the buttons be the list.
  const named = ['goaltending', 'why play stopped', 'shots from the slot']
    .filter(x => (t + w).toLowerCase().includes(x.toLowerCase()));
  assert.deepEqual(named, [], `the opening paragraph enumerates layers again: ${named}`);

  // AND IT MAY NOT SAY WHERE ANYTHING IS. Same family, found by the sweep CHENG
  // asked for after the #start defect: a sentence that refers to another element
  // has a dependency on that element, and no test can see it.
  // "Press ▶ Play from start BELOW" was true at 390x844 with 171px to spare and
  // FALSE at 360x640 by 21px, with the button entirely off screen for the one
  // reader it addresses. A margin measured at one viewport is a constant that
  // drifts with the next, which is this project's oldest recorded mistake.
  // The button's label is quoted verbatim; that is what a reader looks for.
  const positional = ['below', 'above', 'at the top', 'at the bottom', 'to the right', 'to the left']
    .filter(x => (t + w).toLowerCase().includes(x));
  assert.deepEqual(positional, [],
    `the greeting tells a newcomer where to look, and layout decides whether that is true: ${positional}`);
});

test('the lede is gone, for everyone, and nothing still points at it', () => {
  /* ⭐ COMMENTS STRIPPED FIRST, and it took a false positive to earn the line.
     This asserted over the whole document, so it fired on an HTML comment that
     merely NAMED the forbidden class while explaining why a new element had
     been given a different one — a correct page, failed by prose about the
     page. Third time in this repo (docs/status.md H1): the D9 placeholder test
     passed on a comment, the `draw()` bypass scan reported a bypass that did
     not exist, and the arrivals CSS scan had to strip block comments for the
     same reason. The CLAIM is about shipped markup, so the instrument should
     only ever have been looking at markup. */
  const markup = app.replace(/<!--[\s\S]*?-->/g, '');
  assert.doesNotMatch(markup, /class="lede"/, 'the game page still ships the old opening paragraph');
  // A returning viewer now meets the rink 245px sooner than a first-time one —
  // which is the right way round, and was not true of the paragraph it replaced.
  const veteran = boot(rich, CURVE_AND_MIX, '', { getItem: () => '1999-01-01|9', setItem: () => {} });
  assert.equal(veteran.$('rg').classList.contains('newcomer'), false);
});

test('each half of the greeting names the thing it is about', () => {
  // The fix for a defect only a browser could show: whole and above the rink,
  // the block pushed the play button it names below the fold (rink ended 899,
  // button 914, fold 844 on a 390px phone). DOM order is the half checkable
  // here; the geometry is checked by looking.
  const order = ['id="newcomer"', 'class="transport"', 'id="newcomerWhy"'];
  let at = -1;
  for (const marker of order) {
    const k = app.indexOf(marker);
    assert.ok(k > at, `${marker} is out of order — a greeting has drifted from its subject`);
    at = k;
  }

  // ⭐ AND THE SECOND HALF NO LONGER SITS BESIDE ITS SUBJECT, so it names it.
  // The layer menu moved above the rink; this paragraph is 279px tall at 390 and
  // could not follow without putting the play button at y=1036 against an 844
  // fold. What it can carry instead is the control's own label — quoted, never
  // its position, because a position is a constant that drifts with the next
  // viewport. Read from the BUILT SUMMARY rather than typed here twice: rename
  // the control and this fails instead of the sentence quietly going stale.
  const summary = /<summary class="zh">([^<]+)</.exec(
    app.slice(app.indexOf('id="zLayers"')))[1].trim();
  const a2 = boot();
  assert.ok(summary.length > 4, `the layer menu summary is not a label: "${summary}"`);
  assert.ok(a2.$('newcomerWhy').innerHTML.includes(summary),
    `the pitch does not name the control it is asking for — it says nothing matching "${summary}"`);
  assert.doesNotMatch(a2.$('newcomerWhy').innerHTML, /\b(above|below|beneath|under) the rink\b/i,
    'the pitch asserts a position, which is the constant that drifted at 360px');
  // Both halves retire together: one class, one dismissal, no half-greeted state.
  const a = boot(rich, CURVE_AND_MIX);
  assert.ok(a.$('newcomer').innerHTML && a.$('newcomerWhy').innerHTML);
  a.$('nDone').click();
  assert.equal(a.$('rg').classList.contains('newcomer'), false,
    'dismissing left one half of the greeting on screen');
});

/* ────────────────────────────────────────────────────────────────────────────
   THE TRANSPORT CAN BE AIMED

   Kevin, watching: "once an event fires, there's no easy way to go back to that
   event, we'd have to move the slider back and forth". The measurement behind
   these tests is in docs/event-index.md §1 and it is not a usability opinion —
   at a 360px viewport the scrub track is 166px over 281 plays, so a 40px
   fingertip spans 68 of them. Nothing here can see a pixel, so what is checked
   below is the BEHAVIOUR the geometry made necessary.
   ──────────────────────────────────────────────────────────────────────────── */

/** Read the playhead the way the page publishes it, rather than from a closure. */


/* ---------------------------------------------------------------------------
 * WHERE THE LEAGUE DISAGREES WITH ITSELF
 *
 * 73 in-scope games reproduce the NHL's play-by-play exactly and differ from the
 * NHL's own boxscore by one shot. They were being withheld; they are now
 * published with the disagreement stated. `unreconciled` rides on the artifact
 * and is ABSENT when there is nothing to say.
 * ------------------------------------------------------------------------- */

const UNREC = {
  ...rich,
  unreconciled: [{ check: 'SOG reproduces boxscore: home 37==36, away 31==31',
                   kind: 'sog',
                   home: { ours: 37, league: 36 },
                   away: { ours: 31, league: 31 } }],
};

test('a game the league cannot reconcile says so, with both numbers and the side', () => {
  const a = boot(UNREC, CURVE_AND_MIX);
  assert.ok(a.$('rg').classList.contains('unrec'), 'the stylesheet gate must be open');
  const t = a.$('unrecKey').textContent;
  assert.match(t, /boxscore/, 'it must name which document');
  assert.match(t, /36 shots on goal for BUF/, "the league's number, against the side it is about");
  assert.match(t, /event log says 37/, 'and ours, so the reader can see the size of it');
});

test('the side that AGREES is not named, or the sentence teaches the wrong thing', () => {
  // MUTATION GUARD. Printing both sides unconditionally would pass the test
  // above — it looks for BUF and would find it — while telling a reader the
  // visitor's count is disputed when it is not. 31==31 is not a disagreement.
  const t = boot(UNREC, CURVE_AND_MIX).$('unrecKey').textContent;
  assert.doesNotMatch(t, /MIN/, 'the agreeing side must not appear');
  assert.doesNotMatch(t, /31/, 'nor its numbers');
});

test('a reconciled game carries no class and no sentence', () => {
  // ABSENT UNTIL THERE IS ONE. Without this the test above is satisfied by a
  // sentence printed on every game in the archive, which a reader learns to
  // skip — and a disclosure nobody reads is not a disclosure.
  const a = boot(rich, CURVE_AND_MIX);
  assert.equal(rich.unreconciled, undefined, 'the fixture must be a clean game');
  assert.ok(!a.$('rg').classList.contains('unrec'));
  assert.equal(a.$('unrecKey').textContent, '');
});

test('a note of some OTHER kind does not open the shots sentence', () => {
  const a = boot({ ...rich, unreconciled: [{ check: 'something else', kind: 'clock' }] },
                 CURVE_AND_MIX);
  assert.ok(!a.$('rg').classList.contains('unrec'));
  assert.equal(a.$('unrecKey').textContent, '');
});

test('the shots note is found wherever it sits in the list', () => {
  /* THE TEST ABOVE DOES NOT PROVE THIS, and I checked rather than assumed:
     replacing `find(kind === 'sog')` with `unreconciled[0]` left the whole suite
     green. With one non-sog note, both readings return nothing and the outcome
     is identical — so the test passed without exercising the thing it names.

     `unreconciled` is a LIST because the vocabulary will grow, and the failure
     `[0]` produces is the quiet one: a real shots disagreement, silently not
     disclosed, because something unrelated happened to be recorded first. */
  const a = boot({ ...rich, unreconciled: [
    { check: 'something else', kind: 'clock' },
    { check: 'SOG reproduces boxscore: home 37==36, away 31==31', kind: 'sog',
      home: { ours: 37, league: 36 }, away: { ours: 31, league: 31 } },
  ] }, CURVE_AND_MIX);
  assert.ok(a.$('rg').classList.contains('unrec'), 'a later note must still be found');
  assert.match(a.$('unrecKey').textContent, /36 shots on goal for BUF/);
});

test('a shots note whose sides all AGREE prints nothing', () => {
  /* The other guard the suite was not reaching. derive.py only records the note
     when a side differs, so this artifact should not exist — which is exactly
     why the renderer must not build a sentence out of it. Deleting the guard
     also left the suite green, and it produces "its boxscore reports  , its
     event log ." on screen. */
  const a = boot({ ...rich, unreconciled: [
    { check: 'SOG reproduces boxscore: home 30==30, away 20==20', kind: 'sog',
      home: { ours: 30, league: 30 }, away: { ours: 20, league: 20 } },
  ] }, CURVE_AND_MIX);
  assert.ok(!a.$('rg').classList.contains('unrec'));
  assert.equal(a.$('unrecKey').textContent, '');
});
