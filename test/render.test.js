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

/**
 * EVERY stylesheet on the page, not the first one.
 *
 * This exists because a test below was reading `app.match(/<style>…/)[1]` and
 * getting the SHARED CHROME — 900 bytes of header and footer CSS that the page
 * gained in <head> some time after the test was written. It then looped over
 * rules looking for `.att`, `.tm`, `.ba` and friends, found none of them, and
 * asserted nothing at all. Green, and structurally incapable of failing.
 *
 * `builders/page.py::csp` was bitten by exactly this — `re.search` where
 * `re.findall` was meant — and the comment there says so. Same mistake, same
 * document, second instrument. Joining every block is also the stronger claim:
 * a team's colour must not be named in ANY stylesheet the page carries.
 */
const PAGE_CSS = [...app.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

/** The smallest document `boot()` will run against. */
function fakeDom() {
  const el = () => ({
    // `hidden` IS DELIBERATELY ABSENT, not `false`. A fake that invents the
    // default makes `assert.equal(el.hidden, false)` pass against a page that
    // never wrote the element at all -- the assertion reads as coverage and
    // proves nothing. Left undefined, the same assertion requires a real write.
    // (homepage.test.js already worked this way and says so at its heroShown.)
    innerHTML: '', textContent: '', value: '',
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
    // `document.body` is part of the document this bundle runs in -- preview
    // hides the shared chrome through a class on it -- so the fake models it
    // rather than the app defending against its absence.
    body: el(),
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
function boot(game, rates, search = '') {
  const dom = fakeDom();
  // `location` is part of the environment this bundle runs in — the preview loop
  // and the shell's game selector both read the query string — so the fake
  // models it rather than the code defending against its absence.
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: true }), () => 0, () => {},
    { getItem: () => null, setItem: () => {} }, { search });
  // `rates` is what the SHELL fetches and the inlined page never has. Without it
  // this harness can only ever see the "no comparison shown" branch, which is
  // how a test for the drawn rate first went red against a page structurally
  // incapable of having one.
  if (game || rates) b(game || rich, rates);
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
  let inspected = 0;
  for (const rule of PAGE_CSS.split('}')) {
    if (!/\.(att|blk|goal|cc|tm|ba|bh|k-a|k-h|sw\.[ah]|tag\.[ah]|whyhd\.[ah]|gname\.[ah])\b/.test(rule)) continue;
    inspected++;
    const lit = rule.match(/#[0-9a-f]{6}\b/i);
    // #fff is the visiting sweater, not a team's colour, and is allowed.
    assert.ok(!lit, `a team rule names its own colour: ${rule.trim().slice(0, 70)}`);
  }
  // THE LOOP MUST HAVE RUN. Without this the test passed for months against the
  // wrong stylesheet, matching nothing and reporting success — see PAGE_CSS.
  assert.ok(inspected >= 8, `only ${inspected} team-selecting rules found to inspect`);
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
  for (const id of ['lyCorsi', 'lyHd', 'lyGoalie', 'lyWhistle', 'lyBlock']) {
    assert.equal(a.$(id)['aria-pressed'], undefined,
      `${id} announced a state before anyone touched it`);
  }
  assert.equal(a.$('rg').classList.contains('corsi'), false, 'no control panel');
  assert.equal(a.$('rg').classList.contains('goalie'), false, 'no goalie cards');
  assert.equal(a.$('rg').classList.contains('whistle'), false, 'no whistle panel');
  assert.equal(a.$('rg').classList.contains('blocked'), false, 'no blocked-shots panel');
  assert.equal(a.$('blockPanel').innerHTML, '', 'the blocked panel wrote before it was asked');
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

/**
 * A SYNTHESISED shootout, and synthesised on purpose (CHENG).
 *
 * The reference game carries `pt: 'REG'` on all 320 events, so every local test,
 * every fixture and every mutation ever run here has been on a game with no
 * shootout — which is exactly why the defect survived. Reaching into the archive
 * for `2023020510` would fix that today and leave the test depending on a game
 * remaining published tomorrow. So the case is built here.
 *
 * The coordinates are the ones the feed really produces, taken from that game:
 * attempts at BOTH ends (+75, -73, +76, -83), which is the thing that cannot be
 * true — every shootout attempt is taken at one end.
 */
function withShootout() {
  const g = JSON.parse(JSON.stringify(rich));
  const shot = g.events.find(e => e.type === 'shot-on-goal' && e.x != null);
  const HID = g.teams.home.id, AID = g.teams.away.id;
  const at = [[75, 1, 'missed-shot', AID], [-73, 0, 'missed-shot', HID],
              [76, -1, 'goal', AID], [-83, -7, 'missed-shot', HID]];
  for (const [x, y, type, own] of at) {
    g.events.push({ ...shot, per: 5, pt: 'SO', type, own, x, y,
                    s: 4800, clock: '00:00', rem: '00:00' });
  }
  return { game: g, added: at.length };
}

test('overtime is NAMED, and says how many skaters are on the ice', () => {
  // Kevin: if overtime is not surfaced, show something for the fourth period.
  // Overtime IS surfaced — its events are real play, drawn and counted. What was
  // never said is that it is overtime, or the thing that actually changes:
  // measured over 219 raw feeds, regular-season overtime is 3-on-3 in 82.3% of
  // its events. Four skaters leave and the page said "Period 4".
  const g = JSON.parse(JSON.stringify(rich));
  const shot = g.events.find(e => e.type === 'shot-on-goal' && e.x != null);
  //                     per  pt     sit     what the label must say
  const CASES = [[4, 'OT', '1331', 'Overtime · 3-on-3'],
                 [4, 'OT', '1551', 'Overtime · 5-on-5'],   // playoff overtime
                 [4, 'OT', '1431', 'Overtime · 4-on-3'],   // a penalty in overtime
                 [5, 'OT', '1551', '2OT · 5-on-5'],        // playoffs run past one
                 [6, 'OT', '1551', '3OT · 5-on-5']];
  for (const [per, pt, sit, want] of CASES)
    g.events.push({ ...shot, per, pt, sit, s: 3600 + per * 60, rem: '05:00' });
  g.events.push({ ...shot, per: 5, pt: 'SO', sit: '1010', s: 4800, rem: '00:00' });

  const a = boot(g);
  const labels = a.every(d => d.$('per').textContent);
  const tail = labels.slice(-(CASES.length + 1));
  for (let k = 0; k < CASES.length; k++)
    assert.equal(tail[k], CASES[k][3], `period ${CASES[k][0]} ${CASES[k][2]}`);
  assert.equal(tail[CASES.length], 'Shootout', 'and the shootout is named, not "Period 5"');

  // REGULATION IS UNTOUCHED, and it carries no skater count — the strength layer
  // is what explains a power play, and two answers to one question is worse than
  // one. Without this the fix could have been "always append the situation".
  assert.equal(labels[0], 'Period 1');
  for (const l of labels.slice(0, -(CASES.length + 1)))
    assert.match(l, /^Period [123]$/, `regulation label became "${l}"`);

  // THE COUNT IS AWAY-THEN-HOME, the scoreboard's own order. `sit` is
  // [awayGoalie][awaySkaters][homeSkaters][homeGoalie], so 1431 is 4 away
  // skaters against 3 home — reading it the other way names the wrong side of a
  // power play, which this project has shipped once already.
  assert.equal(tail[2], 'Overtime · 4-on-3');
});

test('a shootout attempt NEVER becomes a mark on the ice', () => {
  // THE COUNTING PATHS ALREADY KNEW. `inShootout` lives in layer.js and its own
  // comment says it is there "because all three need it". Three reducers called
  // it; the DRAWING path never did, and painted attempts at coordinates that are
  // not positions on the ~6% of games that reach a shootout.
  const { game, added } = withShootout();
  const a = boot(game);
  const last = +a.$('scrub').max;
  // The four appended events are all drawable types, so they occupy the final
  // timeline slots. Identifying them by INDEX rather than by coordinate keeps
  // this from accidentally passing because a regulation play sat elsewhere.
  const soIdx = new Set(Array.from({ length: added }, (_, k) => String(last - k)));
  assert.equal(soIdx.size, added);

  const frames = a.every(d => d.$('events').innerHTML);
  for (const html of frames)
    for (const m of html.matchAll(/data-i="(\d+)"/g))
      assert.ok(!soIdx.has(m[1]), `a shootout attempt was drawn on the ice (data-i=${m[1]})`);

  // The puck is the third site that read a coordinate directly, so it moved to a
  // place the puck had not been.
  const pucks = a.every(d => d.$('puck').innerHTML);
  for (let k = last - added + 1; k <= last; k++)
    assert.equal(pucks[k], '', `the puck jumped to a shootout coordinate at frame ${k}`);
  assert.ok(pucks[last - added] !== '', 'and the puck is still drawn for real play');

  // AND THE ICE SAYS SO, rather than going quietly blank. Removing the marks
  // without a word would leave the replay ending level while the scoreboard
  // reads a goal higher, with nothing accounting for the difference.
  const notes = a.every(d => d.$('noplace').innerHTML);
  assert.equal(notes[last - added], '', 'nothing is said during ordinary play');
  for (let k = last - added + 1; k <= last; k++) {
    assert.match(notes[k], /skills competition that decides the game, not play in it/);
    assert.match(notes[k], /coordinates the feed records for them are not positions/,
      'the disclosure has to say what we did, not only what a shootout is');
  }
});

test('every face-off spot the feed uses is painted on the ice', () => {
  // Kevin: "the rink doesn't have face off circles in their zones." The four
  // end-zone CIRCLES were there; eight of the nine SPOTS were not, and a circle
  // with no dot in it is not what anyone recognises as a face-off circle.
  //
  // THE CLAIM IS ABOUT THE FEED, so the expectation is derived FROM the feed and
  // never typed. Across the archive every draw lands on one of nine coordinates —
  // 2,134 of them over 39 games spanning the three seasons — and the reference
  // game reaches eight of the nine, so the ninth would go unguarded if this test
  // only asked "is every spot used here drawn". It asks the containment the other
  // way round too: nothing is painted that the feed never uses.
  const a = boot();
  const rink = a.$('rink').innerHTML;
  const drawn = new Set([...rink.matchAll(/class="fdot[^"]*" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${100 - +m[1]},${42.5 - +m[2]}`));   // back through SX/SY into the data frame
  assert.equal(drawn.size, 9, `nine spots on an NHL rink, ${drawn.size} drawn`);

  // 1. EVERY SPOT THE REFERENCE GAME ACTUALLY USES IS DRAWN.
  const used = new Set(rich.events.filter(e => e.type === 'faceoff' && e.x != null)
    .map(e => `${e.x},${e.y}`));
  assert.ok(used.size >= 8, `the reference game should exercise most spots, got ${used.size}`);
  for (const spot of used) assert.ok(drawn.has(spot), `a draw happens at ${spot}, unpainted`);

  // 2. AND NOTHING IS DRAWN THAT THE FEED DOES NOT USE. Without this the test
  //    passes for a rink covered in dots. The ninth spot the reference game never
  //    reaches is named here, so the pair of checks pins the set exactly.
  const measured = new Set(['-69,-22', '-69,22', '69,-22', '69,22',
                            '-20,-22', '-20,22', '20,-22', '20,22', '0,0']);
  for (const spot of drawn) assert.ok(measured.has(spot), `${spot} is painted, and no draw happens there`);
  assert.equal([...measured].filter(s => !used.has(s)).length, 1,
    'exactly one measured spot is unused in the reference game — the case the archive covers and this game does not');

  // THE NEUTRAL ZONE HAS SPOTS AND NO CIRCLES, which is the rink's own
  // arrangement. Circling them would be tidier and wrong.
  const circles = new Set([...rink.matchAll(/class="ln (?:red|blue)" cx="([\d.]+)" cy="([\d.]+)" r="15"/g)]
    .map(m => `${100 - +m[1]},${42.5 - +m[2]}`));
  assert.equal(circles.size, 5, 'four end-zone circles and centre ice');
  for (const spot of ['-20,-22', '-20,22', '20,-22', '20,22'])
    assert.ok(!circles.has(spot), `${spot} is a neutral-zone spot and carries no circle`);
  for (const spot of ['-69,-22', '-69,22', '69,-22', '69,22', '0,0'])
    assert.ok(circles.has(spot), `${spot} should be circled`);
});

test('a whistle mark lands ON a painted spot, not on blank ice', () => {
  // This is why the spots are not decoration. The whistle layer places every mark
  // at the faceoff that RESTARTS play, so each mark should coincide with paint —
  // and the ones that were landing on nothing were the neutral-zone offsides,
  // 89.8% of all offside restarts across the archive.
  const a = boot();
  a.$('lyWhistle').click();
  const spots = new Set([...a.$('rink').innerHTML.matchAll(/class="fdot[^"]*" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${(+m[1]).toFixed(1)},${(+m[2]).toFixed(1)}`));
  const marks = new Set(a.every(d => [...d.$('whistles').innerHTML
    .matchAll(/class="wh[\s"][^>]*cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => `${m[1]},${m[2]}`)).flat());
  assert.ok(marks.size >= 5, `the layer should draw marks in several places, got ${marks.size}`);
  for (const m of marks) assert.ok(spots.has(m), `a whistle mark sits at ${m}, where there is no spot`);
  // And the neutral zone specifically, because those are the four that were bare.
  const NEUTRAL = new Set(['80.0,64.5', '80.0,20.5', '120.0,64.5', '120.0,20.5']);
  assert.ok([...marks].some(m => NEUTRAL.has(m)),
    'no mark landed in the neutral zone, so this test never covered the spots that were missing');
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

test('every mark the stylesheet cuts a key for is NAMED to the reader', () => {
  // AN UNEXPLAINED MARK ON THE ICE IS A DOCTRINE VIOLATION, and two were
  // shipping. `.k-blk` and `.k-hd` were both defined in the stylesheet and
  // appeared nowhere in the markup: the blocked-shot ring and the slot ring were
  // drawn on every game and named in no legend. CHENG confirmed `k-blk`
  // independently — "styled, drawn, and never named".
  //
  // The blocked-shot one was the worse of the two, because the mark is not where
  // a reader will think it is. See docs/blocked-shots-layer.md §3: the
  // coordinate on a blocked shot is the BLOCK POINT, a median 24.2 ft from the
  // net against 33.4 for a shot on goal, so the ring sits nearer the net than
  // the shot that produced it — around a mark whose label names the shooter.
  //
  // The rule is read off the stylesheet rather than kept in a list here, so a
  // key added for a mark nobody explains fails on the day it is added. That is
  // the only version of this check that closes; a hand-maintained list is the
  // same defect with more steps.
  const keys = [...new Set([...PAGE_CSS.matchAll(/\.(k-[a-z]+)\s*\{/g)].map(m => m[1]))];
  assert.ok(keys.length >= 7, `only ${keys.length} legend keys found — the sweep is broken`);
  for (const k of keys)
    assert.match(app, new RegExp(`class="${k}"`),
      `.${k} is styled and drawn, and the reader is never told what it means`);
});

test('the game page offers a way onward, and it is about THIS game', () => {
  // THE DEFECT THIS EXISTS FOR: game.html shipped with zero href attributes. It
  // is the LANDING page — the shareable unit of this site is a game — so a
  // stranger arriving from a shared link had no route to anything.
  //
  // CHENG's ruling put the funnel BELOW the rink rather than in a nav bar above
  // it: the stranger arrives before the game, the viewer exists during it, and
  // the moment that matters is when the game ENDS, at peak curiosity.
  const a = boot();
  const nav = a.$('nextup').innerHTML;
  const links = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length >= 3, `only ${links.length} ways onward from a game page`);

  // BOTH CLUBS IN THIS GAME, named — not a generic "browse teams". A visitor has
  // been given a reason to care about exactly two teams and these are they.
  const home = a.$('hAb').textContent, away = a.$('aAb').textContent;
  assert.ok(links.includes(`/?team=${home}`), `no route to more ${home} games`);
  assert.ok(links.includes(`/?team=${away}`), `no route to more ${away} games`);
  assert.match(nav, new RegExp(`More ${home} games`));
  assert.match(nav, new RegExp(`More ${away} games`));
  assert.ok(links.includes('/'), 'no route to the archive');

  // THE TEAMS ARE READ, NEVER ASSUMED. A block that hard-coded the reference
  // game's two clubs would satisfy everything above on this fixture and be wrong
  // on all 4,552 others — the same defect class as the hero game typed into a
  // builder as a literal.
  assert.doesNotMatch(app, /More BUF games|More MIN games/,
    'the club names are compiled in rather than read from the game');

  // And the swatches carry each club's own colour, so the two rows are
  // distinguishable without reading — the sweater convention, applied here.
  //
  // THREE HOPS, BECAUSE THE COLOUR NO LONGER TRAVELS IN THE MARKUP. It used to
  // be `style="background:#154734"`, which this page's CSP refuses — the live
  // swatches computed to rgba(0, 0, 0, 0). So the markup names a SIDE, the
  // stylesheet maps that side to a custom property, and `paint()` sets the
  // property to the club's colour. Each hop is checked here, because a chain
  // is only as good as the link nobody looked at.
  const sides = [...nav.matchAll(/class="sw ([ah])"/g)].map(m => m[1]);
  assert.deepEqual(sides, ['a', 'h'], 'the swatches do not name a side');
  assert.match(PAGE_CSS, /#rg \.nextup a \.sw\.a\{background:var\(--away\)\}/);
  assert.match(PAGE_CSS, /#rg \.nextup a \.sw\.h\{background:var\(--home\)\}/);
  const v = a.$('rg').style._v;
  assert.equal(v['--away'], colourOf(away));
  assert.equal(v['--home'], colourOf(home));
  assert.notEqual(colourOf(away), colourOf(home), 'this fixture cannot tell the two apart');
});

test('the game summary is a card, and its rate is DRAWN as well as said', () => {
  // Kevin: the summary is the best thing on the page and nobody can find it. It
  // was a small centred paragraph in muted type between the ledger and the
  // footer. And "Of the games where a team led that count by 12 or more, it lost
  // 243 of 708" is a true sentence a reader has to do arithmetic on to feel — so
  // it gets one dot on a 0–100 track with 50% marked, the same idiom the
  // homepage uses, rather than a second visual language for the same kind of
  // number.
  // The reference game's level-control differential, and a curve row for it. The
  // shell fetches this; the inlined page never does, so it is supplied here.
  const CURVE = [{ k: 12, n: 708, count: 243 }, { k: 1, n: 3855, count: 1527 }];
  const a = boot(rich, { levelCurve: CURVE });
  const v = a.$('verdict').innerHTML;
  assert.match(v, /class="vk">What this game was</, 'the card does not say what it is');
  assert.match(v, /class="lead"/);

  assert.match(v, /class="vpt[^"]*" id="vpt"/, 'the rate is stated but never drawn');
  // AND ITS POSITION COMES THROUGH THE CSSOM, not a style attribute the page's
  // own CSP refuses. Written as an attribute, this dot sat at the far left of
  // its track on every game in the archive while this test read the number it
  // was supposed to have. The markup was right and the pixels were wrong, which
  // is the only reason a defect that obvious survived — so the assertion now
  // reads the property the browser actually applies.
  const left = a.$('vpt').style.left;
  assert.ok(left, 'the dot was never positioned');
  // THE DOT IS THE FRACTION IN THE SENTENCE. Read both out of the page and
  // reconcile them, so a dot that drifts from its own prose fails here.
  const frac = v.match(/it lost (\d+) of (\d+)/);
  assert.ok(frac, 'the fraction left the sentence');
  assert.equal(left, (+frac[1] / +frac[2] * 100).toFixed(1) + '%',
    'the dot sits somewhere the sentence does not say');
  assert.match(v, /class="vhalf"/, '50% is not marked, which is the whole point of the track');

  // NO CONNECTING LINE — one point cannot have one, and the rule that forbids it
  // on the homepage is the same rule here.
  for (const tag of ['line', 'path', 'polyline'])
    assert.doesNotMatch(v, new RegExp(`<${tag}\\b`), `the card drew a <${tag}>`);
});

test('a game with no comparison gets no picture of one', () => {
  // The absent branch: a preseason game keeps its own numbers, is told why there
  // is no rate, and must not be given a track with nothing on it.
  const g = JSON.parse(JSON.stringify(rich));
  g.game = { ...(g.game || {}), id: 2023010001 };          // preseason
  const v = boot(g).$('verdict').innerHTML;
  assert.match(v, /No comparison shown — this is a preseason game/);
  assert.doesNotMatch(v, /class="vtrack"/, 'an empty track was drawn anyway');
  assert.match(v, /class="vk">What this game was</, 'and the card still says what it is');
});

test('PREVIEW hides everything but the game, and plays by itself', () => {
  // The homepage had no motion at all, on a site whose product is animation, so
  // a visitor had to click through to discover the thing existed (CHENG). This
  // is the five-second taste — and it is an iframe of THIS renderer rather than
  // a recorded video, so there is no second drawing path to keep in step.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  assert.ok(a.$('rg').classList.contains('preview'), 'the preview class never went on');

  // ONE RENDERER STILL: preview must be a class and a loop, not a different
  // drawing path. The rink and the marks are drawn by exactly the same code, so
  // they are present as usual.
  assert.match(a.$('rink').innerHTML, /class="mesh"/, 'the rink is not drawn in preview');
  assert.ok(a.$('netmen').innerHTML.length > 0, 'the goaltenders are missing');

  // And the ordinary page is NOT in preview, which is the paired half.
  const plain = boot();
  assert.equal(plain.$('rg').classList.contains('preview'), false);
});

// `the preview asks for nothing it does not show` used to live here as a regex
// over the shell's source, pinned to the exact expression that tested for
// preview. It now runs the bootstrap and watches the network instead — see
// test/shell.test.js. A behaviour a test can OBSERVE beats a spelling it has to
// recognise, and the move was forced by the spelling changing.


test('the preview is hidden by CSS, not by deleting the app', () => {
  // If preview removed elements rather than hiding them, every other test in
  // this file would be asserting against a page that no longer exists in the
  // shipped bundle. Pin the mechanism: one rule, hiding the controls.
  const hides = app.match(/#rg\.preview [^{]*\{display:none!important\}/);
  assert.ok(hides, 'preview does not hide the controls with CSS');
  for (const cls of ['.transport', '.layers', '.verdict', '.nextup', '.lede',
                     // Added when Kevin found the rink cropped: these are real
                     // height in a box sized for a rink, and neither is part of
                     // a five-second taste.
                     '.legend', '.goalies'])
    assert.ok(hides[0].includes(cls), `preview leaves ${cls} on screen`);
});

/* ------------------------------------------------- the preview's PACE
   Kevin, twice. On 115ms an event: "a blur of activity, looks like it's 100x
   real-time." On a slower chosen constant of 430ms: "definitely better, still
   2 or 3x too fast." The answer was never a third guess -- it was to stop
   choosing. The preview now waits `dwell(e)`, the same function the replay
   waits, so it cannot be fast or slow RELATIVE TO THE PRODUCT and it eases for
   the big moments instead of ticking.

   THIS TEST DOES NOT RESTATE dwell, and that is the point of it. A test
   asserting "the delay is 1300ms" would be a second copy of the pace, free to
   agree with a wrong first copy. So it measures the ORDINARY PLAY LOOP with the
   same recorder and asserts the preview draws from what it saw -- which stays
   true if dwell changes, and goes red the moment a constant reappears. */

/** Boot with a recording clock and return the delays the page asked for. */
function delaysOf(search, ticks) {
  const dom = fakeDom();
  const delays = [];
  let n = 0;
  const at = [];
  const timer = (fn, ms) => {
    delays.push(ms); at.push(+dom.$('scrub').value);
    if (n++ < ticks) fn();
    return 0;
  };
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: false }), timer, () => {},
    { getItem: () => null, setItem: () => {} }, { search });
  b(rich, null);
  return { dom, delays, at };
}

test('the preview waits on the replay, not on a number somebody picked', () => {
  const TICKS = 6;
  const preview = delaysOf('?preview=1', TICKS).delays;
  assert.ok(preview.length >= TICKS, `the preview never scheduled: ${preview}`);

  // What the ORDINARY transport waits over the same opening events, measured
  // with the same recorder. `play()` is what a viewer presses, so this is the
  // product's pace observed rather than described.
  // TICKS, not 0: the recorder's budget is what lets the transport STEP, and
  // with 0 it schedules once and stops -- one dwell value, which the preview's
  // second wait would then fail against for no reason but the harness.
  const plain = delaysOf('', TICKS);
  plain.dom.$('play').onclick();
  const replay = new Set(plain.delays);
  assert.ok(replay.size > 0, 'the ordinary play loop never scheduled anything');

  for (const d of preview.slice(0, TICKS)) {
    assert.ok(replay.has(d),
      `the preview waited ${d}ms, which the replay never waits: ${[...replay].join(', ')}`);
  }
});

test('and the preview is not a metronome — it eases, because dwell does', () => {
  // A single repeated value is exactly what a chosen constant looks like, and
  // is what both rejected versions produced.
  const preview = delaysOf('?preview=1', 14).delays.slice(0, 14);
  assert.ok(new Set(preview).size > 1,
    `every wait was ${preview[0]}ms — that is a constant wearing dwell's name`);
});

test('the preview is a taste: it restarts inside a quarter-minute', () => {
  // The pace tests above cannot see the WINDOW, and a mutation proved it --
  // replacing the time-derived window with a fixed 44 events survived them
  // both. At the replay's pace that is a 57-second loop on the front door: not
  // a blur, but not a taste either, and nothing said so.
  //
  // THE RESTART IS FOUND BY THE SCRUBBER GOING BACK TO ZERO, not by matching
  // the pause's value. Recognising it by `=== 1500` would put a second copy of
  // that constant in here, free to agree with a wrong first copy.
  //
  // A RANGE, NOT A VALUE. How long the loop runs is a visual judgement and the
  // one number left in the preview; pinning it exactly would just be that same
  // second copy. The bounds are what the thing has to be to be the thing: long
  // enough to read as hockey, short enough that a stranger sees it loop.
  const { delays, at } = delaysOf('?preview=1', 40);
  const back = at.findIndex((v, k) => k > 0 && v === 0);
  assert.ok(back > 0, `the preview never looped in 40 ticks: ${at.join(',')}`);
  assert.ok(back >= 4, `only ${back} events fit — that is a slideshow, not a replay`);
  const playing = delays.slice(0, back - 1).reduce((a, b) => a + b, 0);
  assert.ok(playing > 5000 && playing < 15000,
    `the preview window runs ${(playing / 1000).toFixed(1)}s before looping`);
});

/* ------------------------------------------- the preview CANNOT crop the rink
   Kevin: "the bottom 1/3 of the rink is clipped off within the frame."
   The frame is sized by aspect-ratio on the homepage, and that arithmetic
   cannot hold: the rink scales with WIDTH while the scoreboard's height is set
   in points, so at a narrow column the fixed chrome takes a bigger share of a
   smaller box and pushes the ice past the edge. A ratio measured at one width
   is a constant that drifts with the viewport.

   WHAT THESE TESTS CAN AND CANNOT SEE, stated so the green is not read as more
   than it is: the fake document has no CSS and no layout, so nothing here has
   ever seen a pixel. They pin the MECHANISM -- that the page is built to fit
   whatever box it is handed, rather than to be handed the right one -- and
   whether it looks right is a question for a browser and for Kevin. */

test('the preview fits the rink to its box instead of trusting the box', () => {
  // A viewBox with the default preserveAspectRatio letterboxes rather than
  // crops, so an svg told to fill a bounded height always draws the WHOLE rink.
  // The default rule is `height:auto`, which is exactly what cannot be bounded.
  assert.match(app, /#rg\.preview \.rinkbox svg\{[^}]*height:100%/,
    'the preview rink is still free to grow past its container');
  assert.match(app, /#rg\.preview \.rinkbox\{[^}]*min-height:0/,
    'a flex child without min-height:0 refuses to shrink, which is the crop');
  assert.match(app, /#rg\.preview \.wrap\{[^}]*flex-direction:column/,
    'nothing gives the rink box a bounded height to fit into');
});

test('preview takes the shared chrome off, from where the chrome is defined', () => {
  // The header and footer live in page.py and are OUTSIDE #rg, so no #rg rule
  // can reach them. The page sets a class on <body> and page.py owns the rule --
  // a .sitehdr selector inside build_main.py would be a second place chrome is
  // decided.
  assert.match(app, /body\.previewing \.sitehdr,body\.previewing \.sitefoot\{display:none\}/,
    'the chrome rule is missing or has moved out of page.py');
  const d = boot(null, null, '?preview=1');
  assert.ok(d.document.body.classList.contains('previewing'),
    'the page never told the document it was a preview');
  const plain = boot(null, null, '');
  assert.equal(plain.document.body.classList.contains('previewing'), false,
    'the ordinary page must keep its chrome — the paired half');
});

test('the preview chrome scales with the frame, so the ice cannot be crowded out', () => {
  // MEASURED IN A REAL BROWSER, then pinned here as a mechanism. At 200/108 the
  // scoreboard was 87px inside an 856px-wide frame and 87px inside a 287px one
  // -- the same absolute height in both, because its type is set in rem and rem
  // does not care how wide the frame is. The rink then shrank into what was
  // left: 96px of a 155px box on a phone.
  //
  // `min(Xvw, <today>)` is the shape that matters. vw inside the frame IS the
  // frame's width, so the chrome scales on the same axis the rink does; the cap
  // is today's value, so the desktop rendering cannot move. A plain vw would
  // have changed both, and only one of them was wrong.
  for (const sel of ['\\.sc', '\\.tm \\.ab', '\\.gs']) {
    const re = new RegExp(`#rg\\.preview [^{]*${sel}\\{[^}]*font-size:min\\(`);
    assert.match(app, re, `the preview does not scale ${sel} with its frame`);
  }
  assert.match(app, /#rg\.preview \.eyebrow\{display:none/,
    'the tagline is still introducing a five-second taste');
  assert.match(app, /#rg\.preview \.mid\{min-width:0\}/,
    'the middle column still has a px floor, which overflows a 360px frame');
  // A cap that is not a cap would let the desktop drift, so check one by value.
  assert.match(app, /#rg\.preview \.sc\{font-size:min\([^)]*,2\.2rem\)/,
    'the score is no longer capped at the size it renders today');
});

test('the homepage gives a narrow frame the extra height its rink needs', () => {
  const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  assert.match(index, /@media \(max-width:520px\)\{\.heroframe iframe\{aspect-ratio:200\/128\}\}/,
    'one aspect ratio cannot serve both — the chrome is 10% of a wide frame and 17% of a narrow one');
  assert.match(index, /\.heroframe iframe\{[^}]*aspect-ratio:200\/108/,
    'the wide frame lost its ratio');
});

/* ---------------------------------------------- what a play label may say
   Kevin: "we don't need the subtext on the event, just the event itself... the
   descriptive elements of the site should provide the clarifying details."
   True of six of nine. The three that stayed are not descriptions -- they say
   whether the event COUNTS, which is the only claim on the ice that a novice
   cannot get from the label. The rule is asserted rather than remembered,
   because the next row added to the table will be argued from whatever is
   already there. */

// A second line is earned ONLY by correcting a misreading of a counter the
// viewer can see moving. The attempts counter goes up on a block and on a miss,
// which is the surprise. `hit` was in this list and should not have been: there
// is no hits counter on the page, so "not a shot" answered a question nobody
// had -- explaining a metric we do not show is noise wearing the shape of rigour.
const COUNTS = ['blocked-shot', 'missed-shot'];

test('a play label carries a second line only when it says whether it counts', () => {
  const table = app.match(/const LAB=\{(.*?)\};/s)[1];
  const rows = [...table.matchAll(/'?([a-z-]+)'?:\[([^\]]*)\]/g)]
    .map(m => [m[1], m[2].split(',').length]);
  assert.ok(rows.length >= 8, `only ${rows.length} labels parsed`);
  for (const [type, fields] of rows) {
    const wanted = COUNTS.includes(type) ? 2 : 1;
    assert.equal(fields, wanted,
      COUNTS.includes(type)
        ? `${type} lost the line that says it still counts`
        : `${type} has a second line that only rephrases its label`);
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

test('on the ice: a faceoff draws one line, a blocked shot draws two', () => {
  // Through the real renderer, because the table is only half the claim -- the
  // other half is that an absent second line means no <text> at all rather than
  // an empty one taking up the same room.
  const a = boot();
  const seen = { faceoff: null, 'blocked-shot': null };
  a.every(d => {
    const cur = d.$('labels').innerHTML;
    for (const t of Object.keys(seen)) {
      if (seen[t] === null && new RegExp(t === 'faceoff' ? '>Faceoff<|· Faceoff<' : 'Shot blocked').test(cur)) {
        seen[t] = cur;
      }
    }
    return null;
  });
  assert.ok(seen.faceoff, 'no faceoff label was ever drawn');
  assert.ok(seen['blocked-shot'], 'no blocked-shot label was ever drawn');
  assert.doesNotMatch(seen.faceoff, /plabsub/, 'the faceoff still draws a second line');
  assert.match(seen['blocked-shot'], /plabsub[^>]*>still an attempt/,
    'the blocked shot lost the line that says it counts');
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

const CURVE_AND_MIX = {
  levelCurve: [{ k: 12, n: 708, count: 243 }, { k: 1, n: 3855, count: 1527 }],
  attemptMix: {
    games: 4119,
    byType: { goal: 25105, 'shot-on-goal': 211764, 'missed-shot': 118557, 'blocked-shot': 136545 },
    reachedTheGoalie: { n: 491971, count: 236869, rate: 236869 / 491971, population: 'NHL regular season and playoffs' },
    neverReachedTheGoalie: { n: 491971, count: 255102, rate: 255102 / 491971, population: 'NHL regular season and playoffs' },
    blocked: { n: 491971, count: 136545, rate: 136545 / 491971, population: 'NHL regular season and playoffs' },
  },
};

test('the blocked layer draws nothing until it is asked, then says who stopped what', () => {
  const a = boot(rich, CURVE_AND_MIX);
  assert.equal(a.$('blockPanel').innerHTML, '');
  a.$('lyBlock').click();
  assert.equal(String(a.$('lyBlock')['aria-pressed']), 'true');
  assert.ok(a.$('rg').classList.contains('blocked'), 'the panel is revealed by a class and the class is absent');

  const v = a.$('blockPanel').innerHTML;
  assert.match(v, /shots blocked/, 'the panel never says what its numbers are');
  // The two clubs, by their own abbreviations read from the game.
  const away = a.$('aAb').textContent, home = a.$('hAb').textContent;
  assert.match(v, new RegExp(`${away}[^<]*·[^<]*${home}`), 'the panel does not name the two clubs');
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
  // The inlined page carries one game and makes no network requests, so there is
  // no archive to compare against. "Could not be loaded" would be a small untruth
  // on the one page whose whole claim is that it reaches nobody — the same
  // distinction the verdict card draws with noCurveReason.
  const a = boot();                       // no rates at all
  a.$('lyBlock').click();
  const v = a.$('blockPanel').innerHTML;
  assert.match(v, /makes no network requests/, 'the reason given is not the true one');
  assert.doesNotMatch(v, /could not be loaded/);
});

test('the label names the BLOCKER once the layer is on, and says what the mark is', () => {
  // The defect this exists for: the coordinate is the BLOCK POINT — a median
  // 24.2 ft from the net against 33.4 for a shot on goal — and the label used to
  // name the shooter beside it, which invites reading the dot as his.
  const a = boot();
  a.$('lyBlock').click();
  const labels = a.every(d => d.$('labels').innerHTML)
                  .filter(h => /not where the shot was taken|neither team is credited/.test(h));
  assert.ok(labels.length > 0, 'no blocked shot ever labelled itself as a block point');
  // Somebody is named, and it is a person rather than a club abbreviation.
  assert.ok(labels.some(h => /blocked it|Blocked by a teammate/.test(h)),
    'the label never names who stopped it');
});

test('with the layer off, no label claims to be a block point', () => {
  // The corollary, and it is what makes the test above mean something: if the
  // block-point sentence appeared on every game regardless, it would be page
  // furniture rather than the layer's disclosure.
  const a = boot();
  const any = a.every(d => d.$('labels').innerHTML).join('');
  assert.doesNotMatch(any, /not where the shot was taken/);
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
const CONDITIONAL_KEYS = { 'lk-hd': 'slot', 'lk-blk': 'blocked' };

test('a legend key is hidden until the layer that draws its mark is on', () => {
  // The markup ships every key — this is a stylesheet decision, so the assertion
  // is on the rule, in the one instrument that can see it at build time.
  for (const [key, cls] of Object.entries(CONDITIONAL_KEYS)) {
    assert.match(app, new RegExp(`class="lkey ${key}"`), `${key} is not in the legend at all`);
    assert.match(PAGE_CSS, new RegExp(`#rg\\.${cls} \\.legend \\.${key}`),
      `${key} has no rule revealing it when the ${cls} layer is on`);
  }
  assert.match(PAGE_CSS, /#rg \.legend \.lkey\{display:none\}/,
    'conditional keys are not hidden by default, so they are not conditional');
});

test('the class each conditional key waits for is REALLY toggled by its button', () => {
  // The half that makes the rule above mean something. A key gated on a class
  // nothing sets is a key nobody ever sees — the mirror of the defect being
  // fixed, and exactly as invisible.
  const a = boot();
  for (const [, cls] of Object.entries(CONDITIONAL_KEYS))
    assert.equal(a.$('rg').classList.contains(cls), false, `${cls} is on before anyone asked`);

  a.$('lyHd').click();
  assert.ok(a.$('rg').classList.contains('slot'), 'the slot layer sets no class, so its key can never appear');
  a.$('lyBlock').click();
  assert.ok(a.$('rg').classList.contains('blocked'));

  a.$('lyHd').click();
  assert.equal(a.$('rg').classList.contains('slot'), false, 'the key would stay after its marks left');
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
  const order = ['class="transport"', 'class="verdict"', 'class="legend"', 'class="layers"', 'class="figpick"'];
  let at = -1;
  for (const marker of order) {
    const k = app.indexOf(marker);
    assert.ok(k > at, `${marker} is out of order — the card has slipped back below the controls`);
    at = k;
  }
});
