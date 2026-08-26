/**
 * Play labels on the ice, and the blocked-shots layer
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rich, app, PAGE_CSS, prose, boot, panel, CURVE_AND_MIX } from './helpers/page.js';

test('a play label is a NAME and nothing else — the table cannot hold a second line', () => {
  // Kevin, 2026-08-16: "I think we can retire the subtext on the event displayed
  // on the ice, it still looks crowded to me." Six of the nine went earlier for
  // saying the label again in other words; the last two went for taking room.
  //
  // THE TABLE'S SHAPE IS THE GUARD. It holds strings, not pairs, so there is
  // nowhere to put a second line without changing the renderer too — which is
  // stronger than counting fields and finding one.
  const table = app.match(/const LAB=\{(.*?)\};/s)[1];
  const rows = [...table.matchAll(/'?([a-z-]+)'?:('[^']*'|\[[^\]]*\])/g)];
  // SEVEN, NOT EIGHT. `blocked-shot` left the table when the blocker label
  // started running in every view: its row could never be reached again, and a
  // dead row inside a table reads as coverage. The floor moved with the fact.
  assert.ok(rows.length >= 7, `only ${rows.length} labels parsed`);
  for (const [, type, value] of rows) {
    assert.ok(!value.startsWith('['),
      `${type} is a list again — the label table has grown a second line`);
  }
});

test('the goal row is gone, and goals still get their scorer and assists', () => {
  // It had never rendered: goals take an earlier branch. Dead weight inside a
  // table reads as coverage -- the third instance of that shape here.
  assert.doesNotMatch(app, /const LAB=\{[^}]*goal:\[/,
    'the dead goal row is back in the label table');
  assert.match(app, /🚨 GOAL — /, 'goals lost their own label');
  assert.match(app, /assists: /, 'goals lost their assists');
});

test('on the ice, the ONLY second line left is a goal\u2019s assists', () => {
  // Through the real renderer and across every frame, because the table is only
  // half the claim: the goal takes an earlier branch and never reads `LAB` at
  // all, so a table of plain strings does not by itself empty the ice.
  //
  // A RELATIONSHIP, not a list of types. Whatever the game holds, a second line
  // on the ice must always be the assists line and never anything else.
  // ACROSS EVERY LAYER STATE, because a layer can draw its own label: the
  // blocked layer replaces the whole thing, and a mutation restoring ITS second
  // line survived a walk that had left the layer switched off. The base view is
  // walked too, or turning every layer on would hide a regression in neither.
  const LAYERS = ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock'];
  for (const on of [[], LAYERS]) {
    const a = boot();
    on.forEach(id => a.$(id).click());
    const subs = new Set();
    const heads = new Set();
    a.every(d => {
      const h = d.$('labels').innerHTML;
      for (const m of h.matchAll(/class="plabsub"[^>]*>([^<]*)</g)) subs.add(m[1]);
      for (const m of h.matchAll(/class="(?:plabel|glab)"[^>]*>([^<]*)</g)) heads.add(m[1]);
      return null;
    });
    const where = on.length ? 'with every layer on' : 'in the base view';
    assert.ok(heads.size > 4, `only ${heads.size} distinct labels were ever drawn ${where}`);
    assert.ok(subs.size > 0, `no second line at all ${where} — the goal lost its assists`);
    for (const t of subs) {
      assert.match(t, /^(assists: |unassisted$)/,
        `"${t}" is a second line on the ice ${where} that is not a goal\u2019s assists`);
    }
  }
});

test('the greeting promises assists, and the ice is what has to deliver them', () => {
  // THE DEPENDENCY THAT NEARLY COST THE ASSISTS LINE. Retiring every second line
  // on the ice would have made a sentence at the top of the page false, and
  // nothing in a text file can see that. So the two ends are held together here
  // rather than by a comment — the same failure that broke "start with the game
  // at the top" and "Press Play below", where the fix was to stop making the
  // claim. Here the claim is worth keeping, so the test is.
  const a = boot(rich, CURVE_AND_MIX);
  const promise = a.$('newcomer').innerHTML;
  assert.match(promise, /scorer and assists/, 'the greeting stopped promising assists');
  // THE NAMES, NOT THE COUNT. Counting goals-with-an-assist survived a mutation
  // that dropped the SECOND assist entirely: how many goals have an `a1` does not
  // change when `a2` stops being read.
  const want = rich.events.filter(e => e.type === 'goal')
    .map(e => [rich.roster[e.a1], rich.roster[e.a2]].filter(Boolean).map(x => x.nm).join(', '))
    .filter(Boolean);
  assert.ok(want.length > 0, 'no goal in the reference game has an assist to print');
  assert.ok(want.some(t => t.includes(', ')),
    'no goal in the reference game has TWO assists, so this test cannot see a dropped one');
  const drawn = [];
  a.every(d => {
    for (const m of d.$('labels').innerHTML.matchAll(/class="plabsub"[^>]*>assists: ([^<]*)</g))
      if (!drawn.includes(m[1])) drawn.push(m[1]);
    return null;
  });
  assert.deepEqual(drawn.sort(), want.sort(),
    'the ice named different assists than the game records');
});

test('preview drops the second line entirely, including the three that keep it', () => {
  // 2.8 SVG units is about 6 real pixels once the rink is scaled into a phone
  // frame. The counting claims are for the replay, where someone is reading.
  assert.match(app, /#rg\.preview \.plabsub\{display:none\}/,
    'the preview still draws label subtext nobody can read at that size');
  // PAIRED: the game page must still carry them, or this is a deletion wearing
  // a media query.
  const a = boot();
  let sub = null;
  a.every(d => { const h = d.$('labels').innerHTML;
                 if (sub === null && /plabsub/.test(h)) sub = h; return null; });
  assert.ok(sub, 'the ordinary replay lost its counting lines too');
});

/* ------------------------------------------------------ the blocked-shots layer
 *
 * The reducer's arithmetic is tested in layers.test.js. These are about what
 * reaches the reader — which is where this layer's actual risk lives, because
 * the mark it annotates is NOT where a reader will assume it is.
 */


test('the blocked layer draws nothing until it is asked, then says who stopped what', () => {
  const a = boot(rich, CURVE_AND_MIX);
  assert.equal(a.$('blockPanel').innerHTML, '');
  a.$('lyBlock').click();
  assert.equal(String(a.$('lyBlock')['aria-pressed']), 'true');
  assert.ok(a.$('rg').classList.contains('blocked'), 'the panel is revealed by a class and the class is absent');

  const v = a.$('blockPanel').innerHTML;
  assert.match(v, /blocked by a body/, 'the panel never says what its numbers are');

  // AND IT NAMES NEITHER CLUB, which is the point of the cut rather than an
  // omission. `12 · 7 · SHOTS BLOCKED` was the confounded comparison rendered as
  // a scoreboard: the team blocking more was the team attempting fewer 81.7% of
  // the time, so a reader saw grit where the attempt differential was showing
  // through backwards. Removing the row kills that reading structurally; this
  // assertion is what stops it coming back as a convenience.
  const away = a.$('aAb').textContent, home = a.$('hAb').textContent;
  assert.doesNotMatch(v, new RegExp(`${away}[^<]{0,40}·[^<]{0,40}${home}`),
    'the per-team block counter is back, and with it the reading it invites');
});

test('THE PANEL PUBLISHES NO WIN RATE — the whole design turns on this', () => {
  // CHENG's ruling: "the team that blocked more won X% of the time" is
  // uninterpretable, not merely uncertain, because the blocks leader is the
  // attempts trailer 81.7% of the time. A share of a population is publishable;
  // an outcome rate is not. If one ever appears here it will arrive as a
  // plausible-sounding sentence, so the test is on the PROSE.
  const a = boot(rich, CURVE_AND_MIX);
  a.$('lyBlock').click();
  const v = a.$('blockPanel').innerHTML;
  assert.doesNotMatch(v, /\bwon\b|\blost\b|\bwins\b|\bloses\b|win rate/i,
    'the blocked-shots panel is describing an outcome');
  // And the archive number it DOES publish carries its n and its scope.
  assert.match(v, /491,971 attempts/, 'the archive share ships without its n');
  assert.match(v, /4,119 games/, 'the archive share ships without its population size');
  assert.match(v, /NHL regular season and playoffs/, 'the archive share ships without its scope');
  assert.match(v, /51\.9%/, 'the never-reached share is not stated');
  assert.match(v, /27\.8%/, 'the blocked share is not stated');
});

test('a page that reaches nothing says SO, rather than implying a failure', () => {
  // The inlined page carries one game and NEVER ASKS FOR THE ARCHIVE, so there
  // is no comparison to show. "Could not be loaded" would be a small untruth —
  // the same distinction the verdict card draws with noCurveReason.
  //
  // IT USED TO SAY "makes no network requests" AND THAT STOPPED BEING TRUE.
  // Kevin turned Cloudflare Web Analytics on, so the edge injects a beacon into
  // every browser request and the page does reach somebody — just not for this.
  // The claim is now about what the PAGE asks for, which is what the sentence
  // was always there to explain and is true whatever the host adds.
  const a = boot();                       // no rates at all
  a.$('lyBlock').click();
  const v = a.$('blockPanel').innerHTML;
  assert.match(v, /never asks for the archive/, 'the reason given is not the true one');
  assert.doesNotMatch(v, /could not be loaded/);
  assert.doesNotMatch(v, /no network requests/,
    'the page claims it calls nobody, which the analytics beacon makes false');
});

test('the label names the BLOCKER once the layer is on', () => {
  // The defect this exists for: the coordinate is the BLOCK POINT — a median
  // 24.2 ft from the net against 33.4 for a shot on goal — and the label used to
  // name the shooter beside it, which invites reading the dot as his.
  const a = boot();
  a.$('lyBlock').click();
  const labels = a.every(d => d.$('labels').innerHTML)
                  .filter(h => /blocked a shot|Blocked by a teammate|no blocker recorded/.test(h));
  assert.ok(labels.length > 0, 'no blocked shot ever named who stopped it');
  // A person, rather than a club abbreviation.
  assert.ok(labels.some(h => /blocked a shot|Blocked by a teammate/.test(h)),
    'every blocked shot fell back to "no blocker recorded"');
});

test('with the layer off, no label names a blocker BY NAME', () => {
  // The corollary, and it is what makes the test above mean something: if the
  // blocker's name appeared on every game regardless, it would be page furniture
  // rather than the layer's disclosure.
  //
  // IT USED TO MATCH ON THE PHRASE, and the phrase stopped discriminating. The
  // base view now names the blocking TEAM — the mark is the block point in every
  // view, so the shooter's abbreviation beside it invited the same misreading
  // the layer was built to prevent — while the PERSON stays layer-only. Matching
  // /blocked a shot/ could no longer tell a team label from a named one, so the test
  // asks the question it always meant: does a player's name reach the ice?
  // PLAY LABELS ONLY. A goal names its scorer and assists in every view and
  // always has — that is `glab`/`plabsub`, a different surface with a different
  // rule. Scanning every label caught nine forwards and proved nothing.
  const a = boot();
  const any = a.every(d => (d.$('labels').innerHTML.match(
    /<text class="plabel"[^>]*>([^<]*)</g) || []).join(' ')).join(' ');
  const names = [...new Set(Object.values(rich.roster).map(r => r.nm))]
    .filter(n => n && n.length > 3);
  assert.ok(names.length > 20, `only ${names.length} surnames to look for`);
  const leaked = names.filter(n => any.includes(n));
  assert.deepEqual(leaked, [],
    `the base view named ${leaked.join(', ')} — a person, without the layer that discloses people`);

  // AND THE TEAM IS NAMED, which is the whole of the fix. Dropping the
  // abbreviation left every other assertion here green while removing the only
  // thing that answers "who blocked it" — the question that started this.
  const blocked = (any.match(/[^>]*Blocked a shot/g) || []);
  assert.ok(blocked.length > 0, 'the base view never says a shot was blocked');

  // WHICH team, not merely a team. Naming the SHOOTER's club instead of the
  // blocker's is the exact defect that started this, and it satisfies "an
  // abbreviation is present" perfectly. The two are separable only by count:
  // in this game one side blocked 18 and the other 22, so the wrong attribution
  // swaps the totals. Derived from the roster, never typed.
  const want = { [rich.teams.home.ab]: 0, [rich.teams.away.ab]: 0 };
  for (const e of rich.events) {
    if (e.type !== 'blocked-shot') continue;
    const b2 = rich.roster[e.blk], sh = rich.roster[e.actor];
    if (!b2 || (sh && b2.tid === sh.tid)) continue;      // teammate blocks say no club
    want[b2.tid === rich.teams.home.id ? rich.teams.home.ab : rich.teams.away.ab]++;
  }
  assert.notEqual(want[rich.teams.home.ab], want[rich.teams.away.ab],
    'this game blocks evenly, so the check below cannot tell blocker from shooter');
  for (const ab of Object.keys(want)) {
    const saw = blocked.filter(t => t.includes(ab)).length;
    assert.equal(saw, want[ab],
      `${saw} labels credit ${ab} with a block; the roster says ${want[ab]}`);
  }
});

test('the block-point fact survives the line that used to carry it', () => {
  // THE ICE LOST A SENTENCE AND SOMETHING HAD TO STILL SAY IT. The mark sits
  // where the puck was STOPPED, not where the shot was taken, and that is the one
  // thing about this layer a reader cannot guess. The ice label said it until
  // Kevin retired the second lines; the legend says it permanently and always
  // did, which is why deleting the duplicate was safe.
  //
  // The other half — a block by a teammate credits nobody — is a paragraph of
  // the blocked panel, so it is checked there too rather than assumed.
  assert.match(app, /blocked — ringed where the puck was <b>stopped<\/b>/,
    'the legend stopped saying where the blocked-shot mark actually is');
  assert.match(app, /nobody defended/,
    'the teammate-block disclosure went with the ice line instead of staying in the panel');
});

/**
 * ⭐ THE BLOCKED KEY WORE ONE CLUB'S COLOUR FOR A MARK THAT APPEARS IN BOTH.
 *
 * CHENG's find, and a correctness defect rather than a layout one:
 * `#rg .k-blk{background:var(--home)}` painted the HOST's colour, while on the
 * ice a blocked shot is a ring around the shot's own dot — which carries the
 * SHOOTER's colour. So a visitor's blocked shot is white-and-red on the rink and
 * gold in the key, on every game in the archive. `goal — either sweater` had
 * this exact problem two blocks up and solved it with TWO swatches.
 *
 * BOTH HALVES, because the markup half alone would let the key claim something
 * the game never shows: the second swatch is honest only if visitors really do
 * have shots blocked, so the fixture is asked, independently of the renderer.
 */
test('the blocked key carries both sweaters, because the ice draws both', () => {
  const legend = /<div class="legend">([\s\S]*?)<\/div>/.exec(app)[1];
  // The label sits in its own `.kn` since 2026-08-26 — the `<b>` inside it was
  // becoming a flex item and flying to the end of the row.
  const entry = /<span>((?:<i class="k-[a-z]*"><\/i>)+)<span class="kn">blocked —/.exec(legend);
  assert.ok(entry, 'the blocked key is not in the legend');
  assert.equal((entry[1].match(/<i /g) || []).length, 2,
    'the blocked key shows ONE sweater for a mark that appears in both');
  assert.match(PAGE_CSS, /#rg \.k-blk\{[^}]*background:var\(--home\)/,
    'the host swatch stopped being the host colour');
  assert.match(PAGE_CSS, /#rg \.k-blkv\{[^}]*background:#fff/,
    'the visitor swatch is not white, so the pair does not read as two sweaters');

  const owners = new Set(rich.events.filter(e => e.type === 'blocked-shot').map(e => e.own));
  assert.equal(owners.size, 2,
    'only one club has a shot blocked in this game, so "either sweater" is not demonstrated here');
});

test('the CURRENT play is marked as such, so no layer can dim it away', () => {
  // FOUND BY RENDERING IT, and not findable here — the fake document has no CSS,
  // so the defect was a computed opacity rather than anything in the markup.
  //
  // The blocked layer dims attempts it does not count, to make the stopped ones
  // carry the frame. With trails on "Current moment" — the DEFAULT — the only
  // mark on the ice is the current one, so the layer was dimming the very play
  // the viewer is watching to 20% and leaving the rink otherwise empty.
  //
  // The stylesheet exempts `.cur`. What this test can see is that the class is
  // there to be exempted, on exactly one mark, and that it is the right one.
  const a = boot();
  const frames = a.every(d => d.$('events').innerHTML);
  let seen = 0;
  for (const html of frames) {
    const marks = [...html.matchAll(/class="([^"]*\b(?:att|goal)\b[^"]*)"/g)].map(m => m[1]);
    if (!marks.length) continue;
    const cur = marks.filter(c => /\bcur\b/.test(c));
    assert.ok(cur.length <= 1, `${cur.length} marks claim to be the current play`);
    if (cur.length) seen++;
  }
  assert.ok(seen > 20, `only ${seen} frames marked a current play — the class is not being written`);

  // And the stylesheet must actually spend it, or the class is decoration.
  assert.match(PAGE_CSS, /#rg\.blocked \.att:not\(\.blkd\):not\(\.cur\)/,
    'the dimming rule does not exempt the current play');
});

/* ------------------------------------------------------- the legend, progressively
 *
 * CHENG's ruling on R Q2: a legend naming a mark that is not drawn is the legend
 * ASSERTING A PROPERTY OF THE ICE THAT THE ICE DOES NOT HAVE — the same defect
 * as a check that cannot fail, in a different medium. "From the slot, once that
 * layer is on" was conditional copy in a permanent list. A key that appears with
 * its layer is a STRONGER claim than a permanent one, and unlike prose it can be
 * tested.
 */

/** Every legend key, with the layer class that must be present for it to show. */

/* ---------------------------------------------------------------------------
   C8 — the missed-shot vocabulary. One phrase stood for ten outcomes and was
   false for about one in ten of them.
   --------------------------------------------------------------------------- */
import { readFileSync } from 'node:fs';
import { MISS_SAID, missSay } from '../src/lib/attribution.js';

/**
 * The gate's own set, PARSED FROM extract.py rather than retyped.
 *
 * `KNOWN_MISSES` is what turns the derive run red when the league invents a
 * value, and this table is what a reader sees. Two lists of the same vocabulary
 * in two languages is exactly what `measure.mjs` exists to prevent, so the seam
 * is asserted: a value the gate accepts and nobody has written prose for would
 * otherwise ship silently as a raw key.
 */
const KNOWN_MISSES = (() => {
  const py = readFileSync(new URL('../builders/extract.py', import.meta.url), 'utf8');
  const block = py.match(/KNOWN_MISSES = \{([\s\S]*?)\}/)[1];
  return new Set([...block.matchAll(/"([a-z-]+)"/g)].map(m => m[1]));
})();

test('⭐ every value the gate accepts has prose, and no prose invents a value', () => {
  assert.ok(KNOWN_MISSES.size >= 10, `parsed only ${KNOWN_MISSES.size} from extract.py`);
  assert.deepEqual([...Object.keys(MISS_SAID)].sort(), [...KNOWN_MISSES].sort(),
    'the labels and the vocabulary gate disagree about what a missed shot can be');
});

test('the phrase that was FALSE is gone from the events it was false about', () => {
  // 7.3% of missed shots hit iron and 2.5% came up short. "Missed shot" is
  // wrong about all of them, and it was the only thing the page ever said.
  for (const iron of ['hit-left-post', 'hit-right-post', 'hit-crossbar']) {
    assert.match(missSay({ miss: iron }), /Hit the (post|crossbar)/);
    assert.doesNotMatch(missSay({ miss: iron }), /missed|Missed/);
  }
  assert.equal(missSay({ miss: 'short' }), 'Shot came up short');
});

test('an unknown value renders the league’s own word, never a guess', () => {
  // The window between the league minting a value and a human naming it.
  // extract.py's vocabulary gate is red throughout it; the page must still read.
  assert.equal(missSay({ miss: 'deflected-out-of-play' }), 'deflected out of play');
  // And no `miss` at all is a DIFFERENT case — an extract predating the field.
  assert.equal(missSay({}), 'Missed shot');
  assert.equal(missSay(null), 'Missed shot');
});

test('left and right are not repeated to a reader who can see the mark', () => {
  // The rink already shows which side it went. Saying it again is the defect
  // the "Shot from the slot · … from the slot" rename left behind.
  assert.equal(missSay({ miss: 'wide-left' }), missSay({ miss: 'wide-right' }));
  assert.equal(missSay({ miss: 'high-and-wide-left' }), missSay({ miss: 'high-and-wide-right' }));
  assert.equal(missSay({ miss: 'hit-left-post' }), missSay({ miss: 'hit-right-post' }));
});

test('⭐ the shipped page says it, on real missed shots, in the base view', () => {
  // The lib being right proves nothing about whether the page calls it. 31
  // missed shots in the reference game, and the label is a BASE-VIEW label:
  // no layer has to be on for a novice to stop being told something false.
  const a = boot(rich, CURVE_AND_MIX);
  const said = new Set();
  a.every(d => {
    const m = d.$('labels').innerHTML.match(/class="plabel"[^>]*>([^<]*)</);
    if (m) said.add(m[1]);
  });
  const misses = [...said].filter(s => /wide|post|crossbar|short|Missed|bank/i.test(s));
  assert.ok(misses.length >= 2, `only saw ${JSON.stringify(misses)}`);
  assert.ok(misses.some(s => /went wide/.test(s)), `no "went wide" in ${JSON.stringify(misses)}`);
  assert.ok(!misses.some(s => /Missed shot/.test(s)),
    `the generic phrase is still being shown: ${JSON.stringify(misses)}`);
});
