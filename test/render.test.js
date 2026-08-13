/**
 * The other half of every layer: what reaches the ice.
 *
 * THE WHISTLE LAYER WAS CORRECT, TESTED AND INVISIBLE FOR A DAY. Twenty unit
 * tests said what `reduce` returns; not one of them could tell you whether the
 * page drew a single mark, because nothing here had ever run `boot()`. The
 * defect that closed the gap was found by an unrelated guard the moment the layer
 * entered the bundle — it carried elapsed time onto a page whose every other
 * clock shows remaining.
 *
 * So this boots THE SHIPPED BUNDLE, from src/read-the-game.html, against a fake
 * document, and drives the real controls: the buttons a viewer clicks and the
 * scrubber a viewer drags. Nothing is asked politely — every number below is read
 * back out of the markup the app wrote.
 *
 * WHAT THIS CANNOT SEE, stated so the green is not read as more than it is: the
 * fake document has no CSS and no layout, so `display:none` is invisible to it
 * and so is anything about size or position. A panel this test calls "rendered"
 * may still be hidden by a stylesheet. That claim belongs to the browser step in
 * deploy.yml, and it is checked there rather than assumed here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEAMS, colourOf, contrast } from '../src/lib/teams.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const app = readFileSync(new URL('../src/read-the-game.html', import.meta.url), 'utf8');
const SCRIPT = app.match(/<script>([\s\S]*)<\/script>/)[1];

/** The smallest document `boot()` will run against. */
function fakeDom() {
  const el = () => ({
    innerHTML: '', textContent: '', value: '', hidden: false,
    // The app paints each team's real colour onto #rg as a custom property at
    // boot, so the fake has to record them to be able to check them.
    style: { _v: {}, setProperty(k, v) { this._v[k] = v; },
             getPropertyValue(k) { return this._v[k] || ''; } },
    dataset: {}, childNodes: [{ nodeValue: '' }],
    _on: {},
    classList: {
      _c: new Set(),
      add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); },
      toggle(c, on) { on ? this._c.add(c) : this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    },
    setAttribute(k, v) { this[k] = v; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    click() { (this._on.click || []).forEach(fn => fn({ target: this })); },
  });

  const byId = new Map();
  // Selector -> the buttons that selector really matches in the markup. Written
  // out rather than parsed, so a control that is renamed in the page but not here
  // shows up as a test that stops finding its button, instead of one that quietly
  // clicks nothing.
  const GROUPS = {
    '#rg .tbtn': ['off', 'all'].map(t => Object.assign(el(), { dataset: { t } })),
    '#rg .sbtn': ['all', 'even'].map(s => Object.assign(el(), { dataset: { s } })),
    '#rg .fbtn': ['mascot', 'tabletop'].map(f => Object.assign(el(), { dataset: { f } })),
    '#rg .cc.a .lb': [el()],
    '#rg .cc.h .lb': [el()],
  };
  const document = {
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, el());
      return byId.get(id);
    },
    querySelectorAll(sel) {
      assert.ok(GROUPS[sel], `the page queried "${sel}", which this fake does not model`);
      return GROUPS[sel];
    },
  };
  return { document, byId, GROUPS, $: id => document.getElementById(id) };
}

/**
 * Boot the shipped app and hand back the controls.
 *
 * `game` re-runs the SAME boot with different data. The script ends by calling
 * boot() on the game compiled into it, so it is handed back and called again --
 * which is the only way to put a matchup this page was never built around
 * (two clubs wearing the same hex) through the real renderer.
 */
function boot(game) {
  const dom = fakeDom();
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: true }), () => 0, () => {},
    { getItem: () => null, setItem: () => {} });
  if (game) b(game);
  const scrub = dom.$('scrub');
  assert.ok(+scrub.max > 100, `the reference game should have hundreds of plays, not ${scrub.max}`);
  return {
    ...dom,
    /**
     * Every frame in the game, for claims that need COVERAGE rather than a
     * sample — "the far goal line, at both ends" cannot be checked by a walk
     * that may only ever land on one end.
     */
    every(read) {
      const out = [];
      for (let k = 0; k <= +scrub.max; k++) {
        scrub.value = String(k);
        scrub.oninput({ target: { value: scrub.value } });
        out.push(read(dom));
      }
      return out;
    },
    /** Drag the scrubber the way a viewer does, and report what got drawn. */
    sweep(read) {
      const out = [];
      const n = +scrub.max;
      for (let k = 0; k <= 30; k++) {
        scrub.value = String(Math.round(n * k / 30));
        scrub.oninput({ target: { value: scrub.value } });
        out.push(read(dom));
      }
      return out;
    },
  };
}

const rings = d => (d.$('whistles').innerHTML.match(/class="wh[\s"]/g) || []).length;
/**
 * How many EVENTS are on the ice — not how many elements.
 *
 * One event can now draw up to three: the mark, an annotation ring, and a goal's
 * core. Counting elements made "the ice holds one mark" mean "three", which the
 * trails test caught the moment annotations became separate nodes.
 */
const evMarks = d => new Set(
  [...d.$('events').innerHTML.matchAll(/data-i="(\d+)"/g)].map(m => m[1])).size;
const panel = d => d.$('whistlePanel').innerHTML;

test('the shipped app boots, and the reference game is in it', () => {
  const a = boot();
  assert.match(a.$('gl').textContent, /at .* final/, 'the game line is written from the data');
});

test('NOTHING draws whistle marks until the layer is turned on', () => {
  // THE MUTATION, and it comes first: a page that drew whistle marks
  // unconditionally would satisfy every other assertion in this file. If this
  // one cannot fail, none of them mean anything.
  const a = boot();
  assert.deepEqual([...new Set(a.sweep(rings))], [0]);
  assert.equal(panel(a), '', 'and the panel says nothing at all');
});

test('turning the layer on puts marks on the ice and a sentence under it', () => {
  const a = boot();
  a.$('lyWhistle').click();
  const drawn = a.sweep(rings);
  assert.ok(Math.max(...drawn) >= 1,
    'the layer is on and never drew a mark anywhere in the game');
  const p = panel(a);
  assert.ok(p.length > 40, `the panel explained nothing: "${p}"`);
  assert.doesNotMatch(p, /undefined|null|NaN/, 'a hole in the copy is worse than no copy');
});

test('the sentence on screen is the rule, and it names where it comes from', () => {
  // The whole argument for the layer: a novice has watched a hundred icings and
  // never had one named. If the page shows the reason code and not the rule, the
  // layer has delivered nothing.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.sweep(panel).join('\n');
  assert.match(seen, /centre line|blue line ahead of the puck|goaltender/i,
    'no whistle in a whole NHL game produced a teaching sentence');
  assert.match(seen, /rule: NHL Rule|field: rsn/, 'and the provenance travels with it');
});

test('with trails off the ice holds the current moment and nothing else', () => {
  // Kevin's observation: by the third period the surface is a wall of dots. This
  // is the fix, asserted over the whole game rather than at a flattering moment.
  const a = boot();
  const drawn = a.sweep(evMarks);
  assert.ok(Math.max(...drawn) <= 1,
    `trails are off and up to ${Math.max(...drawn)} marks persisted`);
});

test('keep-every-mark really does keep them', () => {
  // The paired half. Without it, "trails off shows one mark" is also satisfied by
  // a renderer that has stopped drawing anything at all.
  const a = boot();
  const off = Math.max(...a.sweep(evMarks));
  a.GROUPS['#rg .tbtn'][1].click();          // data-t="all"
  const all = Math.max(...a.sweep(evMarks));
  assert.ok(all > 50, `keep-every-mark peaked at ${all} marks`);
  assert.ok(all > off, 'and it must be more than the current moment holds');
});

test('the trails control reports its own state to a screen reader', () => {
  const a = boot();
  const [offBtn, allBtn] = a.GROUPS['#rg .tbtn'];
  assert.equal(offBtn['aria-pressed'], true, 'the default is the current moment');
  allBtn.click();
  assert.equal(allBtn['aria-pressed'], true);
  assert.equal(offBtn['aria-pressed'], false);
});

test('the whistle layer changes no other layer\'s numbers', () => {
  // The recorded gate for a new layer: adding it touches nothing existing.
  const a = boot(), b = boot();
  b.$('lyWhistle').click();
  const read = d => [d.$('cA').textContent, d.$('cH').textContent,
                     d.$('aSc').textContent, d.$('hSc').textContent].join('/');
  assert.deepEqual(b.sweep(read), a.sweep(read));
});

/* ------------------------------------------------------------------ *
 * Team colour. Kevin: "WSH is Red on the home page, but then Green on
 * the game page." Every visitor was green, because the page carried
 * Minnesota's and Buffalo's colours as literals and used them as roles.
 * ------------------------------------------------------------------ */

test('the page paints THE TEAMS IN THIS GAME, not the two it was built from', () => {
  // The reference game is MIN at BUF. Minnesota's colour is forest green
  // (#154734) and Buffalo's is navy (#003087) -- and the page used to paint
  // #12885a and #bd8c12, which are neither club's colour and never changed
  // whoever was playing.
  const a = boot();
  const v = a.$('rg').style._v;
  assert.equal(v['--away'], TEAMS.MIN.colour, 'the visitor is Minnesota');
  assert.equal(v['--home'], TEAMS.BUF.colour, 'the host is Buffalo');
  assert.equal(colourOf('MIN'), '#154734');
  assert.equal(colourOf('BUF'), '#003087');
});

test('no team is painted from anything but the teams table', () => {
  // The literals had spread to the goal label and the figure jersey as well as
  // the stylesheet, so removing them from one place proves nothing.
  //
  // Buffalo's old gold must be gone outright. Minnesota's old green survives ONCE,
  // renamed `--ok`, because it was also doing duty as the why-popup's success tick
  // — which is exactly how a team's colour comes to mean "correct". The test is
  // therefore about ROLES, not about a hex disappearing.
  assert.ok(!app.includes('#bd8c12'), "Buffalo's stand-in gold is gone");
  assert.ok(!app.includes('MINCOL') && !app.includes('BUFCOL'),
    'and so are the variables that made two clubs into roles');
  assert.match(app, /--ok:#12885a/, 'the green that remains is named for its meaning');
  assert.ok(app.includes('const AWAYCOL=colourOf(AAB), HOMECOL=colourOf(HAB);'),
    'both colours are looked up from the abbreviation in the data');

  // No rule that selects a team may name a colour of its own.
  const css = app.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const rule of css.split('}')) {
    if (!/\.(att|blk|goal|cc|tm|ba|bh|k-a|k-h)\b/.test(rule)) continue;
    const lit = rule.match(/#[0-9a-f]{6}\b/i);
    // #fff is the visiting sweater, not a team's colour, and is allowed.
    assert.ok(!lit, `a team rule names its own colour: ${rule.trim().slice(0, 70)}`);
  }
});

test('two clubs wearing the SAME hex are still told apart on the ice', () => {
  // FLA and WSH are both #C8102E. Five such matchups exist, 45 games. A page that
  // separates teams by colour separates nothing in any of them, which is why the
  // visitor wears white.
  const clash = JSON.parse(JSON.stringify(rich));
  clash.teams.home.ab = 'WSH';
  clash.teams.away.ab = 'FLA';
  assert.equal(colourOf('WSH'), colourOf('FLA'), 'the fixture must actually clash');

  const a = boot(clash);
  const v = a.$('rg').style._v;
  assert.equal(v['--home'], v['--away'], 'and the page is holding one colour twice');

  // So identity has to come from somewhere else. Sweep for a frame that drew a
  // visitor mark and one that drew a host mark, and require them to differ.
  const seen = a.sweep(d => d.$('events').innerHTML).join('');
  assert.match(seen, /class="[^"]*\ba\b[^"]*"/, 'the visitor took a shot at some point');
  assert.ok(/fill:#fff|\.att\.a/.test(app) || app.includes('.att.a{fill:#fff'),
    'the visitor mark is white-filled in the stylesheet');
  assert.ok(app.includes('#rg .att.a{fill:#fff;stroke:var(--away)'),
    'and it carries the club colour as its outline, so the colour is still true');
});

test('a team the colour table cannot answer for still renders', () => {
  // 42 games in the archive are national sides or All-Star squads.
  const olympic = JSON.parse(JSON.stringify(rich));
  olympic.teams.home.ab = 'FIN';
  olympic.teams.away.ab = 'SWE';
  const a = boot(olympic);
  const v = a.$('rg').style._v;
  assert.match(v['--home'], /^#[0-9a-f]{6}$/i, 'a colour, not undefined');
  assert.equal(v['--home'], v['--away'], 'both neutral — we do not guess at flags');
});

test('the play label names the team, so identity never rests on a hue', () => {
  const a = boot();
  const labels = a.sweep(d => d.$('labels').innerHTML).join('');
  assert.match(labels, /MIN · |BUF · /, 'the label says whose play it was');
});

test('light primaries do not become unreadable text', () => {
  // Boston gold is 1.73:1 on white. Six clubs fail WCAG 2.1's 3:1, and the page
  // paints counters and percentages as text.
  const gold = JSON.parse(JSON.stringify(rich));
  gold.teams.home.ab = 'BOS';
  const a = boot(gold);
  const v = a.$('rg').style._v;
  assert.equal(v['--home'], TEAMS.BOS.colour, 'the chip still gets the true gold');
  assert.equal(v['--home-text'], '#0f1a23', 'the text does not');
  assert.equal(v['--home-ink'], '#0f1a23', 'and the chip ink is dark, on gold');
});

test('a goalie line is a fraction, on every card, with no chosen cutoff', () => {
  // The card used to print .943 and switch to a fraction below TWENTY shots
  // faced. Twenty was ours. A fraction carries its own denominator, so the
  // threshold dissolves rather than needing a better value (CHENG).
  const a = boot();
  a.$('lyGoalie').click();
  const cards = a.sweep(d => d.$('goaliePanel').innerHTML);
  const full = cards[cards.length - 1];
  assert.match(full, /\d+ of \d+/, 'the headline number is a fraction');
  assert.doesNotMatch(full, /class="gsv">\.\d/, 'never a bare save percentage');
  assert.ok(!app.includes('st.f<20'), 'and the cutoff itself is gone');

  // The limit is on EVERY card, not only the small ones. Stating it selectively
  // made a 35-shot game look like a rate you could compare.
  const cardCount = (full.match(/class="gcard"/g) || []).length;
  const limits = (full.match(/class="lim"/g) || []).length;
  assert.ok(cardCount >= 2, `both goalies should have a card, got ${cardCount}`);
  assert.equal(limits, cardCount, 'one stated limit per card');
});

/* ------------------------------------------------------------------ *
 * Found by LOOKING AT IT. Kevin sent a screen capture of SJS at CHI
 * and two marks near San Jose's zone belonged to no team: a visitor's
 * blocked shot was a white dot with an orange ring, because the
 * annotation had taken the stroke that now carries identity. Nothing
 * in this file could see it — a fake document has no pixels — so what
 * follows is the structural claim underneath the pixels.
 * ------------------------------------------------------------------ */

/**
 * Every element the ice drew, paired to the event it belongs to.
 *
 * BY `data-i`, NOT BY COORDINATE. The current attempt is drawn as a figure with
 * no cx/cy at all, so a coordinate match silently skips exactly the mark most
 * likely to be wrong — the one the viewer is looking at.
 */
const marksAt = html => {
  const out = [];
  for (const m of html.matchAll(/<(circle|g) class="([^"]+)"[^>]*data-i="(\d+)"/g)) {
    out.push({ cls: m[2], i: m[3] });
  }
  return out;
};

test('an annotation ring never carries a team, and never replaces the mark', () => {
  const a = boot();
  a.GROUPS['#rg .tbtn'][1].click();                 // keep every mark
  const html = a.sweep(d => d.$('events').innerHTML).pop();
  const all = marksAt(html);
  const blocked = all.filter(m => /\bring\b/.test(m.cls) && /\bblk\b/.test(m.cls));
  assert.ok(blocked.length > 5, `the reference game has blocked shots, found ${blocked.length}`);

  for (const ring of blocked) {
    // THE RING IS AN ANNOTATION. The mark under it still has to say whose it is.
    const mark = all.find(m => m.i === ring.i && /\bev\b/.test(m.cls));
    assert.ok(mark, `a blocked ring for event ${ring.i} with no mark under it`);
    assert.match(mark.cls, /\b(att|goal)\b/, 'a blocked shot is an ATTEMPT, annotated');
    assert.match(mark.cls, /\b[ah]\b/, `the mark for event ${ring.i} names no team`);
  }
  // And the ring itself must stay out of the identity business.
  for (const m of all.filter(x => /\bring\b/.test(x.cls))) {
    assert.doesNotMatch(m.cls, /\b[ah]\b/,
      `an annotation ring is wearing a team class: "${m.cls}"`);
  }
});

test('the high-danger ring is an annotation too, not a repainted mark', () => {
  const a = boot();
  a.$('lyHd').click();
  a.GROUPS['#rg .tbtn'][1].click();
  const html = a.sweep(d => d.$('events').innerHTML).pop();
  const all = marksAt(html);
  const hd = all.filter(m => /\bring\b/.test(m.cls) && /\bhd\b/.test(m.cls));
  assert.ok(hd.length > 0, 'the layer is on and no high-danger ring was drawn');
  for (const ring of hd) {
    const mark = all.find(m => m.i === ring.i && /\bev\b/.test(m.cls));
    assert.ok(mark && /\b[ah]\b/.test(mark.cls),
      `a high-danger ring for event ${ring.i} sits over a mark with no team`);
  }
});

test('a goal is a bullseye, so it cannot be read as an attempt', () => {
  // Under the sweater convention a visitor's goal and a visitor's attempt are
  // both hollow rings, separated only by radius.
  const a = boot();
  a.GROUPS['#rg .tbtn'][1].click();
  const html = a.sweep(d => d.$('events').innerHTML).pop();
  const all = marksAt(html);
  const goals = all.filter(m => /\bgoal\b/.test(m.cls) && /\bev\b/.test(m.cls));
  assert.ok(goals.length > 0, 'the reference game has goals');
  for (const g of goals) {
    const core = all.find(m => m.i === g.i && /\bcore\b/.test(m.cls));
    assert.ok(core, `the goal for event ${g.i} has no core — it is just a larger dot`);
    assert.match(core.cls, /\b[ah]\b/, 'and the core takes its colour from the team');
  }
});

test('the base view is the game — every layer off, no trails, at boot', () => {
  // CHENG could not tell from a screenshot whether Control and Keep-every-mark
  // were defaults or clicks, and "you probably clicked it" is not an answer.
  // Doctrine §6 and the page's own headline (watch first, add metrics after)
  // both depend on this, so it is asserted rather than remembered.
  const a = boot();
  for (const id of ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle']) {
    assert.equal(a.$(id)['aria-pressed'], undefined,
      `${id} announced a state before anyone touched it`);
  }
  assert.equal(a.$('rg').classList.contains('corsi'), false, 'no control panel');
  assert.equal(a.$('rg').classList.contains('goalie'), false, 'no goalie cards');
  assert.equal(a.$('rg').classList.contains('whistle'), false, 'no whistle panel');
  assert.equal(a.GROUPS['#rg .tbtn'][0]['aria-pressed'], true, 'trails: current moment');
  assert.equal(a.$('whistles').innerHTML, '', 'and nothing metric-specific is drawn');
});

test('no bare percentage survives on the scoreboard', () => {
  // The rule the goalie card and the per-game sentence already follow, applied
  // to the surface where the denominator is smallest and moves fastest: early in
  // a game one attempt swings the share ~2.5 points, and "58%" asserts a
  // precision that "11 – 8" does not claim (CHENG).
  const a = boot();
  a.$('lyCorsi').click();
  for (const [pa, ph, mode] of a.sweep(d => [d.$('pa').textContent, d.$('ph').textContent,
                                             d.$('pMode').textContent])) {
    assert.match(String(pa), /^\d+$/, `the control figure reads "${pa}"`);
    assert.match(String(ph), /^\d+$/, `the control figure reads "${ph}"`);
    assert.equal(mode, 'ALL SITUATIONS', 'every site carrying this number carries its mode');
  }
});

test('the strength mode reaches the scoreboard, not only the counters', () => {
  const a = boot();
  a.$('lyCorsi').click();
  a.GROUPS['#rg .sbtn'][1].click();                 // even strength only
  assert.equal(a.$('pMode').textContent, 'EVEN STRENGTH');
  assert.equal(a.$('mA').textContent, 'EVEN STRENGTH', 'and the two agree');
});

test('the page states that it holds the ends fixed', () => {
  // A REAL TRANSFORMATION OF RECORDED COORDINATES, undisclosed on a page whose
  // thesis is that nothing is transformed silently (CHENG). Teams switch ends
  // every period in the arena; here each attacks the same net all game.
  // Whitespace-collapsed, because HTML collapses it and the source wraps: the
  // first version of this test failed on a line break inside its own sentence,
  // which is a test asserting a fact about the source file rather than the page.
  const said = prose.replace(/\s+/g, ' ');
  assert.match(said, /Ends are held fixed/);
  assert.match(said, /switch every period/);
  assert.match(said, /A goaltender stands in each crease/,
    'the figure that replaced the text tag is explained');
  assert.match(said, /pulled for an extra attacker/,
    'including the one moment it is absent');
});

test('the legend shows the mark the ice actually draws', () => {
  // The legend advertised a siren for a goal. The ice draws a bullseye; the
  // siren appears only in the caption for the current event, so a viewer looking
  // for it on the rink is looking for something that is not there.
  const legend = app.match(/<div class="legend">([\s\S]*?)<\/div>/)[1];
  assert.doesNotMatch(legend, /🚨/, 'no mark the rink does not draw');
  assert.match(legend, /class="k-g"/, 'a swatch for the goal instead');
});

/**
 * What a VISITOR reads: the markup, with the stylesheet and the script removed.
 *
 * A copy gate over the whole file is a copy gate over the source comments, which
 * legitimately discuss the app's own history — the first version of the test
 * below failed on a comment explaining why trails have two settings.
 */
const prose = app.slice(app.indexOf('</style>'), app.indexOf('<script>'));

test('the controls explain themselves without referring to their own history', () => {
  // Changelog voice: "a shot chart nobody asked for", "that older behaviour, on
  // purpose". A first-time visitor has no idea there was an older behaviour
  // (CHENG). The explanation of what each control DOES was the good part and
  // stays; the apology for the past comes out.
  assert.doesNotMatch(prose, /used to stay on the ice|older behaviour|nobody asked for/,
    'the page is apologising to itself');
  assert.match(prose, /Keep every mark<\/b> leaves every attempt on the ice/,
    'and it still says what the control does');
});

test('a goaltender stands in each crease, and the sides agree with the scoreboard', () => {
  // THE FIGURE REPLACED THE TEXT. "WSH net" written up the post was clutter doing
  // a job a figure does better (Kevin): a goaltender in the crease says the net is
  // defended, and the club's colour says whose — which is how a viewer reads a
  // real rink rather than a labelled diagram.
  // AT THE FIRST EVENT, not at boot: the app opens on the LAST event of the game,
  // where Minnesota has already pulled its goalie — so reading the boot state
  // would have been reading the one frame in the game with an empty net.
  const a = boot();
  const opening = a.every(d => d.$('netmen').innerHTML)[0];
  const gks = [...opening.matchAll(
    /<rect class="gkbody" x="([-\d.]+)"[^>]*fill="([^"]+)" stroke="([^"]+)"/g)]
    .map(m => ({ x: +m[1], fill: m[2], stroke: m[3] })).sort((p, q) => p.x - q.x);
  assert.equal(gks.length, 2, 'both nets are defended at the opening faceoff');

  // The host is on the RIGHT, and so is the host's badge on the scoreboard. The
  // agreement is the point: the same club on the same side of one screen.
  const [visitor, host] = gks;
  assert.equal(host.fill, colourOf(a.$('hAb').textContent), "the host's own colour");
  assert.equal(visitor.fill, '#fff', 'the visitor wears white, like the sweaters');
  assert.equal(visitor.stroke, colourOf(a.$('aAb').textContent), 'trimmed in its club colour');
  assert.ok(host.x > 100 && visitor.x < 100, 'host right, visitor left');

  // And no text tag survives.
  assert.doesNotMatch(a.$('rink').innerHTML, /class="netlab"/, 'the vertical tag is gone');
  assert.doesNotMatch(app, /\$\{ab\} net</, 'and so is the copy that built it');
});

test('the goaltender LEAVES when the feed says the goalie was pulled', () => {
  // NOT DECORATION. `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie] on
  // every event — all 320 of them in the reference game — and Minnesota pulls at
  // 01:40 of the third, the code reading 0651 for the last twenty events. The
  // emptiest net in hockey stops being something a novice has to be told about.
  const a = boot();
  const counts = new Set(a.every(d =>
    (d.$('netmen').innerHTML.match(/class="gkbody"/g) || []).length));
  assert.ok(counts.has(2), 'both goalies are in net for most of the game');
  assert.ok(counts.has(1), 'and one net is empty at the end — the pull is in the data');
  assert.ok(!counts.has(0), 'never both, which no situation code in this game says');

  // The one that leaves is the VISITOR's, which is what 0651 means.
  const last = a.every(d => d.$('netmen').innerHTML).pop();
  assert.equal((last.match(/class="gkbody"/g) || []).length, 1);
  assert.match(last, new RegExp(`fill="${colourOf(a.$('hAb').textContent)}"`),
    'the host keeps its goaltender');
});

test('a missing situation code never empties a net', () => {
  // An empty net drawn on a guess would be the most dramatic thing on the ice
  // invented from nothing. Absent evidence is not evidence of absence.
  assert.match(app, /if\(!sit\|\|sit\[3\]!=='0'\)/, 'the host goalie stays when sit is missing');
  assert.match(app, /if\(!sit\|\|sit\[0\]!=='0'\)/, 'and so does the visitor');
});

test('the goal flash is its own element, so the net cannot vanish', () => {
  // The old markup put the flash animation on a HIDDEN duplicate of the net.
  // Once the net became always-visible, animating it would have run the net's
  // own opacity 0 -> .85 -> 0 on every goal: the net disappearing and coming
  // back, which reads as a rendering fault rather than a celebration.
  const a = boot();
  const rink = a.$('rink').innerHTML;
  for (const id of ['netHome', 'netAway']) {
    const m = rink.match(new RegExp(`<path id="${id}"[^>]*>`));
    assert.ok(m, `${id} must exist for flashNet to find`);
    assert.match(m[0], /class="flashpath"/, 'the flash is a separate path');
    assert.match(m[0], /opacity="0"/, 'and it starts invisible');
  }
  // The net's own body must NOT be the thing carrying the id.
  assert.doesNotMatch(rink, /<path class="mesh" id=/, 'the net itself is never flashed');
  // BY ROLE, NOT BY SIDE. `netL`/`netR` were screen names for data facts, and
  // reflecting the rink turns that kind of name into a lie without changing a
  // character of it.
  assert.match(app, /const net=scorer===AID\?\$\('netHome'\):\$\('netAway'\)/,
    "a visitor goal lights the HOST's net, whichever side that is drawn on");
});

test('the goaltenders are redrawn only when they change', () => {
  // Rewriting them every frame restarts the entrance animation on every event —
  // a goaltender flickering three hundred times a game. It also makes the
  // animation mean something: it fires when a goalie arrives or leaves, and at
  // no other moment.
  assert.match(app, /if\(now===netmenAre\)return;/, 'unchanged frames touch no DOM');

  // And the state still tracks the game: two, then one after the pull.
  const a = boot();
  const seen = a.every(d => (d.$('netmen').innerHTML.match(/class="gkbody"/g) || []).length);
  assert.deepEqual([...new Set(seen)].sort(), [1, 2],
    'exactly two states across the whole game');
  assert.equal(seen[0], 2);
  assert.equal(seen[seen.length - 1], 1);
});

test('the goaltender FITS INSIDE the net it defends, and is centred on the mouth', () => {
  // Kevin, from one screen capture: "the goalie figures are bigger than the net."
  // Measured, they were — 8.1 units tall in front of a 6-foot mouth, 135% of the
  // thing they defend, and centred at 41.8 against the mouth's 42.5, so high as
  // well as large. THIS IS THE THIRD TIME PIXELS FOUND WHAT THE SUITE COULD NOT.
  //
  // The size of a glyph has no source in the feed, so there is no number here to
  // assert as correct. The RELATIONSHIP is assertable: a goaltender defending a
  // net fits in it. Both sides of the comparison are read out of the rendered
  // markup — the mouth from the POST, the figure from its own parts — so this
  // cannot pass by agreeing with a constant it copied from the code.
  const a = boot();
  const posts = [...a.$('rink').innerHTML.matchAll(
    /class="post"[^>]*y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)]
    .map(m => ({ top: +m[1], bot: +m[2] }));
  assert.equal(posts.length, 2, 'two nets to be measured against');

  const opening = a.every(d => d.$('netmen').innerHTML)[0];
  const body = [...opening.matchAll(/class="gkbody"[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/g)]
    .map(m => ({ top: +m[1], bot: +m[1] + +m[2] }));
  const head = [...opening.matchAll(/class="gkhead"[^>]*cy="([\d.]+)" r="([\d.]+)"/g)]
    .map(m => ({ top: +m[1] - +m[2], bot: +m[1] + +m[2] }));
  const stick = [...opening.matchAll(/class="gkstick"[^>]*y1="([\d.]+)"[^>]*y2="([\d.]+)"/g)]
    .map(m => ({ top: Math.min(+m[1], +m[2]), bot: Math.max(+m[1], +m[2]) }));
  assert.equal(body.length, 2, 'both goaltenders present at the opening faceoff');
  assert.equal(head.length, 2);
  assert.equal(stick.length, 2);

  for (let i = 0; i < 2; i++) {
    const mouth = posts[i];
    const parts = [body[i], head[i], stick[i]];
    const top = Math.min(...parts.map(p => p.top));
    const bot = Math.max(...parts.map(p => p.bot));
    assert.ok(top >= mouth.top,
      `goaltender ${i} reaches ${top}, above the crossbar at ${mouth.top}`);
    assert.ok(bot <= mouth.bot,
      `goaltender ${i} reaches ${bot}, past the post at ${mouth.bot}`);
    // And it must be CLEARLY smaller, not merely non-overflowing — a figure that
    // exactly filled the mouth would pass the two checks above and still read as
    // a goaltender wearing the net.
    const fill = (bot - top) / (mouth.bot - mouth.top);
    assert.ok(fill < 0.9, `goaltender ${i} fills ${(fill * 100).toFixed(0)}% of the mouth`);
    // CENTRED. The old figure sat 0.68 high, which is what made it read as
    // standing above the net rather than in it.
    const off = Math.abs((top + bot) / 2 - (mouth.top + mouth.bot) / 2);
    assert.ok(off <= 0.2, `goaltender ${i} sits ${off.toFixed(2)} off the mouth's centre`);
  }
});

test('the net is equipment: behind the goal line, six feet across, with netting', () => {
  // THESE ASSERTIONS EXISTED AND I DELETED THEM, by rewriting the test they lived
  // in into the goaltender test above. They guard an error that was actually
  // shipped for the rink's whole life — the nets drawn on the ICE side of the
  // goal line, 11 feet across — so they get their own test now rather than riding
  // along inside one about something else.
  const rink = boot().$('rink').innerHTML;
  assert.match(rink, /class="mesh"/, 'the net has a body');
  assert.match(rink, /class="strand"/, 'with netting in it, not a solid slab');
  assert.match(rink, /class="post"/, 'and posts');
  assert.match(rink, /class="crease"/, 'and it stands in a crease');
  assert.doesNotMatch(rink, /class="crease" x=/, 'the rounded-rectangle chip is gone');

  // BOTH nets are open. Filled with the club colour the host's rendered as a solid
  // block while the visitor's read as equipment, so the sweater convention moved
  // to the goaltender, where it does identity work.
  const fills = [...rink.matchAll(/class="mesh"[^>]*fill="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(fills, ['#fff', '#fff'], 'neither net is a coloured slab');

  // BEHIND THE GOAL LINE. A net whose body reaches into the playing surface
  // swallows every shot mark in front of it.
  const bodies = [...rink.matchAll(/class="mesh" d="M ([\d.]+) [\d.]+ L ([\d.]+) /g)]
    .map(m => ({ mouth: +m[1], back: +m[2] })).sort((p, q) => p.mouth - q.mouth);
  assert.equal(bodies.length, 2, 'one body per net');
  assert.equal(bodies[0].mouth, 11, 'the left mouth is on the goal line');    // SX(89)
  assert.ok(bodies[0].back < bodies[0].mouth,
    `the left net reaches to ${bodies[0].back}, on the ice side of ${bodies[0].mouth}`);
  assert.equal(bodies[1].mouth, 189, 'the right mouth is on the goal line');  // SX(-89)
  assert.ok(bodies[1].back > bodies[1].mouth,
    `the right net reaches to ${bodies[1].back}, on the ice side of ${bodies[1].mouth}`);

  // Six feet across, which is what a net is. It was eleven.
  const across = rink.match(/class="post"[^>]*y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/);
  assert.equal(+across[2] - +across[1], 6, 'a net is 6 feet wide, not 11');
});
