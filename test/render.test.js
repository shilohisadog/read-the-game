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
import { WHY } from '../src/lib/layers/whistle.js';
import { corsi } from '../src/lib/layers/corsi.js';

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
    // Reading back what was written. Absent returns null, as the real DOM does,
    // rather than undefined -- a fake that answers a question differently from
    // the thing it stands in for is a test that passes for its own reasons.
    getAttribute(k) { return k in this ? this[k] : null; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    // BOTH WAYS A HANDLER GETS ATTACHED, because the page uses both and this
    // fake only knew one. The layer buttons use addEventListener; the whole
    // TRANSPORT — play, the three speeds, the work toggle — assigns `.onclick`,
    // so `.click()` on any of them fired nothing at all. Not a vacuous
    // assertion: a test that pressed Play and then checked the page had not
    // started would have passed against a page that never started anything.
    click() {
      (this._on.click || []).forEach(fn => fn({ target: this }));
      if (typeof this.onclick === 'function') this.onclick({ target: this });
    },
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
function boot(game, rates, search = '', store = null) {
  const dom = fakeDom();
  /**
   * THE REPLAY CLOCK, CAPTURED RATHER THAN STUBBED OUT.
   *
   * `setTimeout` used to answer 0 and drop the callback, so `play()` set a
   * timer that never fired and the PLAY LOOP had never run once in this file —
   * every test drove the page by dragging the scrubber instead, which is a
   * different code path with different arguments to `render`. One slot, not a
   * queue: the page has exactly one timer in flight, and `clearTimeout` really
   * cancels it, so a queue would let a cancelled frame fire later.
   */
  let pending = null;
  const setTimeout_ = fn => { pending = fn; return 1; };
  const clearTimeout_ = () => { pending = null; };
  // `location` is part of the environment this bundle runs in — the preview loop
  // and the shell's game selector both read the query string — so the fake
  // models it rather than the code defending against its absence.
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: true }), setTimeout_, clearTimeout_,
    // A FAKE THAT CANNOT EXPRESS THE OTHER STATE MAKES ASSERTIONS ABOUT IT
    // VACUOUS — the same reason `hidden` is absent from `el()` rather than false.
    // This stub always answered null, so every boot was a first visit and
    // "a returning viewer sees no tips" could not have been tested. `store` is
    // a real object when a test needs the page to remember something.
    store || { getItem: () => null, setItem: () => {} }, { search });
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
     * Run the replay the way a viewer who presses Play does — the real loop,
     * `render(i,'play')`, one frame per `dwell`. Returns how many frames
     * actually advanced, so a test cannot mistake a dead timer for a finished
     * game.
     */
    advance(n) {
      let moved = 0;
      for (let k = 0; k < n; k++) { if (!pending) break; const f = pending; pending = null; f(); moved++; }
      return moved;
    },
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

test('every known stoppage is CALLED something, on all three surfaces', () => {
  // "Goalie Stopped After Sog" — the raw feed key with its hyphens swapped and
  // then title-cased by the stylesheet, in front of the one audience that does
  // not know what SOG means. `say` existed and was correct the whole time; it is
  // a full teaching sentence and the wrong length for a heading, which is why
  // WHY gained a third field rather than the heading being re-pointed at `say`.
  //
  // THREE SURFACES, AND ONLY ONE OF THEM IS THE HEADING (CHENG). The tally
  // repeats every reason in the game so far, and each ring carries a <title>.
  // A heading-only fix leaves two of the three rendering `Sog`, and nobody would
  // have found the tooltip, because nobody hovers while watching.
  const a = boot();
  a.$('lyWhistle').click();
  const seen = a.every(d => panel(d) + d.$('whistles').innerHTML).join('\n');

  // Whatever this game happened to contain, every reason it showed must be a
  // written label — read out of WHY rather than listed here, so a reason added
  // to the vocabulary without a name is caught rather than missed.
  const named = Object.entries(WHY).filter(([, v]) => v.name);
  assert.ok(named.length >= 12, `WHY carries ${named.length} written names`);
  for (const [key, v] of named) {
    if (!seen.includes(v.name) && !seen.includes(key.replace(/-/g, ' '))) continue;
    assert.ok(seen.includes(v.name),
      `${key} reached a surface as the raw key rather than "${v.name}"`);
    assert.ok(!seen.includes(key.replace(/-/g, ' ')),
      `${key} still renders as the raw feed key somewhere`);
  }
  // And the specific one from the screenshot, so this cannot pass vacuously on a
  // game that happens to contain none of the ugly keys.
  assert.match(seen, /Goaltender covered the puck/, 'the reference game has these stoppages');
  assert.doesNotMatch(seen, /goalie stopped after sog/i, 'and it still shows the key');
  assert.doesNotMatch(seen, /\bsog\b/i, 'unexpanded jargon reached the page');

  // THE STYLESHEET WAS DOING THE TITLE-CASING, and on a written label
  // `capitalize` gives "Goaltender Covered The Puck".
  assert.doesNotMatch(PAGE_CSS, /\.rsn\{[^}]*text-transform:capitalize/,
    'the heading still title-cases every word of a written label');
  assert.doesNotMatch(PAGE_CSS, /\.whtally\{[^}]*text-transform:capitalize/,
    'the tally still title-cases every word');
});

test('a reason we have never seen still renders, and renders raw', () => {
  // The fallback is the HONEST branch, not the default one: the feed can emit a
  // reason absent from WHY, and a label we invented for it would be a guess in
  // our own voice. Unreachable from the reference game, so the game is re-coded
  // — the same fix as the host-goalie branch on the game page.
  const g = JSON.parse(JSON.stringify(rich));
  let touched = 0;
  for (const e of g.events) if (e.type === 'stoppage' && e.rsn) { e.rsn = 'krakens-on-ice'; touched++; }
  assert.ok(touched > 5, `only ${touched} stoppages to re-code`);
  const a = boot(g);
  a.$('lyWhistle').click();
  const seen = a.every(d => panel(d)).join('\n');
  assert.match(seen, /krakens on ice/, 'an unknown reason vanished instead of falling back');
  assert.doesNotMatch(seen, /undefined|\[object/, 'and it fell back to something broken');
});

test('the card says it is looking BACKWARDS, because it usually is', () => {
  // Kevin: "the card becomes disjointed with the event by event action." Measured
  // live across a game: the event the card describes is a median 29 SECONDS
  // behind the playhead, 102s at the 90th percentile, and more than five seconds
  // behind on 78% of frames — while the card sat in present tense, in the
  // position of a caption, with a timestamp a reader had to compare against the
  // scoreboard to discover was history. The card was never wrong; its currency
  // was invisible.
  const a = boot();
  a.$('lyWhistle').click();
  //
  // AND THE EXEMPTION IS CHENG'S OWN RULE, NOT A HOLE IN THE TEST. Before the
  // first whistle the card reads "No whistle yet — play has not stopped in what
  // you have watched so far", which is a CONDITION: recomputable from the state
  // at the playhead, with no reference to when it started. It cannot drift, so
  // it needs no retrospective framing. Every card that names a past stoppage
  // does. The two are separated here by whether they name one.
  const frames = a.every(d => panel(d)).filter(Boolean);
  assert.ok(frames.length > 50, `only ${frames.length} frames carry a card`);
  const naming = frames.filter(p => /class="rsn"/.test(p));
  const waiting = frames.filter(p => !/class="rsn"/.test(p));
  assert.ok(naming.length > 40, `only ${naming.length} cards name a stoppage`);
  assert.ok(waiting.length > 0, 'the pre-whistle state is unreachable, so its arm is untested');
  for (const p of naming)
    assert.match(p, /Last stoppage/,
      'a card naming a past event competes with the scoreboard for "now"');
  for (const p of waiting) {
    assert.match(p, /No whistle yet/);
    assert.doesNotMatch(p, /Last stoppage/,
      'a condition that cannot drift was labelled as history');
  }
});

test('the whistle ring is NAMED, and only while the layer draws it', () => {
  // below-the-rink.md §3 found this for k-blk and k-hd and fixed those two; the
  // whistle layer kept drawing a ring on every game with nothing naming it. The
  // only naming was an SVG <title> — no hover on a phone, and nobody hovers
  // while watching, which is why it read as clutter beside a card that spent
  // three sentences on the same stoppage.
  assert.match(app, /class="lkey lk-wh"/, 'the ring has no legend key at all');
  assert.match(PAGE_CSS, /#rg\.whistle \.legend \.lk-wh/,
    'nothing reveals the key when the layer is on');
  assert.match(PAGE_CSS, /#rg \.k-wh\{/, 'the key has no swatch');

  const a = boot();
  assert.equal(a.$('rg').classList.contains('whistle'), false);
  a.$('lyWhistle').click();
  assert.ok(a.$('rg').classList.contains('whistle'), 'the key can never appear');
  a.$('lyWhistle').click();
  assert.equal(a.$('rg').classList.contains('whistle'), false,
    'the key would stay after its marks left');
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

test('the page still discloses that it holds the ends fixed', () => {
  // A REAL TRANSFORMATION OF RECORDED COORDINATES, undisclosed on a page whose
  // thesis is that nothing is transformed silently (CHENG). Teams switch ends
  // every period in the arena; here each attacks the same net all game.
  //
  // The sentence used to be a 128px permanent paragraph under the controls and
  // is now a legend key that arrives at the first period change — but THE CLAIM
  // MUST SURVIVE THE MOVE, which is what this asserts and the tests below do
  // not. Whitespace-collapsed, because HTML collapses it and the source wraps:
  // the first version of this test failed on a line break inside its own
  // sentence, which is a test asserting a fact about the source file rather
  // than the page.
  const said = prose.replace(/\s+/g, ' ');
  assert.match(said, /ends are held fixed/i, 'the transformation is no longer disclosed anywhere');
  assert.match(said, /switch each period/i, 'and what the arena does instead is not said');
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
  // AND THE RENDERED NOTES, now that the copy lives there. The notes moved out
  // of permanent markup into the moment of use (R Q3), so a gate reading only
  // the markup would have quietly stopped covering the sentences it was written
  // for. NOT a grep over the whole script: this file's own comment above says
  // why — the source comments legitimately discuss the app's history, and the
  // first version of this test failed on one. Read what a VISITOR is shown.

  // The explanation of what the control DOES is the good part, and it still
  // exists — but it is now shown when the control is USED rather than always.
  const a = boot();
  assert.equal(a.$('nTrails').textContent, '',
    'the trails note is present before anyone chose the setting it explains');
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  assert.match(a.$('nTrails').textContent, /every attempt stays on the ice/i,
    'flipping to Keep every mark explains nothing');
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'off').click();
  assert.equal(a.$('nTrails').textContent, '', 'the note stayed after the setting left');

  // Every note a visitor can actually be shown, in the state that shows it.
  const shown = [];
  a.GROUPS['#rg .tbtn'].find(b => b.dataset.t === 'all').click();
  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'even').click();
  a.GROUPS['#rg .fbtn'].find(b => b.dataset.f === 'tabletop').click();
  for (const id of ['nTrails', 'nSit', 'nFig']) shown.push(a.$(id).textContent);
  for (const text of shown) {
    assert.ok(text, 'a control was switched and explained nothing');
    assert.doesNotMatch(text, /used to|older behaviour|nobody asked for|no longer/i,
      `the changelog voice reached a visitor: "${text}"`);
  }
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

test('⭐ the preview runs with the Control layer ON, so the hero shows what the h1 promises', () => {
  // THE HEADLINE AND THE HERO USED TO DISAGREE. The h1 offers "the counts built
  // in front of you, so you can see where a number comes from" and the frame
  // below it ran with no layer at all -- the one configuration that is not the
  // stated conversion. Nothing failed; the front door simply advertised the
  // base view.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  assert.ok(a.$('rg').classList.contains('corsi'),
    'the preview is running the base view — the counts are nowhere on the hero');

  // THROUGH setCorsi, NOT PAST IT. The on-state is a class, a button label and
  // an aria value; a preview that set only the class would look right and leave
  // the other two saying the layer is off. This is the half that catches it.
  // String() because the fake stores what setCorsi passed -- a boolean -- while
  // a real DOM stores "true". Asserting either spelling would pin the harness
  // rather than the behaviour.
  assert.equal(String(a.$('lyCorsi').getAttribute('aria-pressed')), 'true');
  assert.match(a.$('lyCorsi').textContent, /^✓ /,
    'the layer button still says the layer is off');

  // EXACTLY ONE, because the conversion is stated as one metric layer turned on.
  // Three layers at once is a different claim about the product, and without
  // this the preview could quietly acquire them one at a time with nothing
  // failing -- which a mutation adding a second layer proved.
  for (const off of ['slot', 'goalie', 'whistle', 'blocked']) {
    assert.equal(a.$('rg').classList.contains(off), false,
      `the preview turned on ${off} as well — the taste is one layer, not a pile`);
  }

  // AND THE ORDINARY PAGE IS UNTOUCHED, which is the paired half: turning it on
  // for the hero must not turn it on for a visitor who opened a game to watch it.
  assert.equal(plainOff().$('rg').classList.contains('corsi'), false,
    'the full page now opens with a layer already applied');
});

test('⭐ the control bar claims nothing before anything has been counted', () => {
  // A REAL DEFECT, FOUND BY LOOKING AT THE FRONT DOOR. `tot=a+h||1` avoided the
  // division by zero and then drew the result anyway: at 0-0 it made pa=0, so
  // the whole bar rendered in the HOME colour and the opening faceoff announced
  // that one team held all of the control before a puck had been shot. It was
  // on the hero, in the first frame of every visit.
  //
  // NOT A PREVIEW BUG -- it is what the layer does at the start of any game, so
  // it is checked on the ordinary page where a visitor meets it.
  const a = boot();
  a.$('lyCorsi').click();
  // Numeric, because the fake stores what the page assigned -- a number -- and
  // a real DOM stores a string. Pinning either spelling would test the harness.
  assert.equal(+a.$('cA').textContent, 0, 'the fixture is past the opening faceoff');
  assert.equal(+a.$('cH').textContent, 0, 'and this test is no longer about zero');
  assert.equal(a.$('ba').style.width, '0%', 'the away segment claims a share of nothing');
  assert.equal(a.$('bh').style.width, '0%', 'the home segment claims a share of nothing');

  // THE PAIRED HALF: once there IS a population, the bar is drawn and the two
  // segments account for all of it. Without this the rule above is satisfied by
  // a bar that never renders at all.
  const sc = a.$('scrub');
  sc.value = sc.max;
  sc.oninput({ target: { value: sc.value } });
  assert.notEqual(+a.$('cA').textContent + +a.$('cH').textContent, 0,
    'nothing was counted, so the paired half proves nothing');
  const w = s => +String(s).replace('%', '');
  assert.equal(w(a.$('ba').style.width) + w(a.$('bh').style.width), 100,
    'the bar no longer accounts for the whole population');
});

/** A plain boot, named because two tests want the same negative half. */
function plainOff() { return boot(); }

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
  // `.lede` was here until the paragraph it named was replaced by the
  // first-visit block (it duplicated that block's job, went stale naming
  // four layers when there were five, and cost 245px above the rink).
  for (const cls of ['.transport', '.layers', '.verdict', '.nextup', '.newcomer',
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

/**
 * WALK THE REAL PLAY LOOP AND RECORD WHAT EACH FRAME WAS GIVEN.
 *
 * One row per scheduled frame: the wait the page asked for, the frame it was
 * asked for, the caption's animation duration at that moment, and the caption's
 * markup so a CHANGE identifies the frames that actually spoke. The recorder
 * fires before the callback runs, so every row describes the frame on screen.
 */
function paceOf(ticks, setup) {
  const dom = fakeDom();
  const rows = [];
  let n = 0;
  const timer = (fn, ms) => {
    rows.push({ ms, i: +dom.$('scrub').value,
                dur: dom.$('caption').style.animationDuration,
                html: dom.$('caption').innerHTML });
    if (n++ < ticks) fn();
    return 0;
  };
  const b = new Function('document', 'matchMedia', 'setTimeout', 'clearTimeout',
                         'localStorage', 'location', SCRIPT + '\nreturn boot;')(
    dom.document, () => ({ matches: false }), timer, () => {},
    { getItem: () => null, setItem: () => {} }, { search: '' });
  b(rich, null);
  if (setup) setup(dom);
  dom.$('play').onclick();
  // A frame SPOKE if the caption's markup differs from the frame before it.
  rows.forEach((r, k) => { r.spoke = k > 0 && r.html !== rows[k - 1].html; });
  return { dom, rows };
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

/* THIS GUARD MOVED OFF THE PREVIEW, AND THE REASON IS A MEASUREMENT.
 *
 * It used to read the preview's first 14 waits and assert they were not all the
 * same value -- "a constant wearing dwell's name". Under the tier list that was
 * robust: a shot on goal was enough to break the tie, and 43 of 59 games across
 * the archive (72.9%) carry one inside the preview's opening window.
 *
 * Under the pacing rule in docs/event-timing.md the frame is long only when it
 * carries a caption, and captions are goals and penalties. MEASURED over the
 * same 59 games: a goal or a penalty lands inside the first 7 plays in 9 of them
 * -- 15.3% -- and the median index of the first captioned event is 26, four
 * times the window. So on roughly six nights in seven the front door's loop is
 * legitimately uniform, and the old assertion would have failed for a page that
 * was working exactly as designed.
 *
 * It passed on the reference game, which has a penalty at index 2 -- the MINIMUM
 * of that distribution. A test that arrives where it already was is true for the
 * wrong reason, and this one would have been.
 *
 * THE PROPERTY IT PROTECTS IS REAL AND STILL WORTH A TEST: `dwell` must not
 * collapse to one number, because the test above (the preview draws from the
 * replay) passes trivially if both sides return the same constant. So the guard
 * now watches the WHOLE REPLAY, where a captioned frame is guaranteed by the
 * game rather than by luck of the opening. */
test('dwell does not collapse to a constant — the whole replay, not the opening', () => {
  const { rows } = paceOf(160);
  const seen = new Set(rows.map(r => r.ms));
  assert.ok(seen.size > 1,
    `every wait in the walk was ${rows[0].ms}ms — that is a constant wearing dwell's name`);
  // AND the two values must be the two the rule produces, not any two: a stray
  // third tier creeping back in is the thing this replaced.
  assert.equal(seen.size, 2,
    `the pace produced ${seen.size} distinct waits (${[...seen].sort((a, b) => a - b).join(', ')}); the rule has two states`);
});

test('⭐ the preview begins where the layer first counts something', () => {
  // KEVIN REFRESHED THE FRONT DOOR AND THE COUNTER SAT AT 0-0 FOR THE WHOLE LOOP.
  // Measured over 230 games: the counter is still empty after 14s in 6% of them
  // -- and the hero is the most recent game, so between June and October that is
  // one frozen fixture and the tail is the whole experience. The reference game
  // here opens with plays that count for nothing, exactly as the live one did.
  //
  // THE START IS THE FIX, NOT THE LENGTH: at the same budget the live hero went
  // from a counter of 0 to a counter of 4, while stretching the loop to 30s from
  // the faceoff also only reached 4.
  const { at } = delaysOf('?preview=1', 40);
  assert.ok(at[0] > 0,
    'the preview still opens at the faceoff — if the game happens to start with '
    + 'attempts this is vacuous, so the assertion below says it is not');

  // AND IT SKIPS NOTHING THE LAYER COUNTS, which is what keeps the counter
  // honest: it is still 0-0 on the first frame and still moves in front of you.
  const a = boot(rich, null, '?game=2023020204&preview=1');
  const sc = a.$('scrub');
  const countAt = k => { sc.value = String(k); sc.oninput({ target: { value: sc.value } });
                         return +a.$('cA').textContent + +a.$('cH').textContent; };

  // IT OPENS ON ZERO AND MOVES ON THE VERY NEXT FRAME. Both halves matter and
  // neither is sufficient: opening on the first attempt shows a counter reading
  // 1 before the viewer has seen anything happen, and opening any earlier is the
  // dead air this whole change exists to skip.
  assert.equal(countAt(at[0]), 0, 'the loop opens with the count already moved');
  assert.notEqual(countAt(at[0] + 1), 0,
    'the second frame still counts nothing — the start is not adjacent to the first attempt');
});

test('the preview is a taste: it restarts inside about half a minute', () => {
  // The pace tests above cannot see the WINDOW, and a mutation proved it --
  // replacing the time-derived window with a fixed 44 events survived them
  // both. At the replay's pace that is a 57-second loop on the front door: not
  // a blur, but not a taste either, and nothing said so.
  //
  // THE RESTART IS FOUND BY THE SCRUBBER GOING BACKWARDS, not by matching the
  // pause's value. Recognising it by `=== 1500` would put a second copy of that
  // constant in here, free to agree with a wrong first copy.
  //
  // It used to look for a return to ZERO, and that stopped being the marker when
  // the loop began starting at the layer's first counted event instead of the
  // opening faceoff. Zero was never the property -- going back was.
  //
  // A RANGE, NOT A VALUE. How long the loop runs is a visual judgement and the
  // one number left in the preview; pinning it exactly would just be that same
  // second copy. The bounds are what the thing has to be to be the thing: long
  // enough to read as hockey, short enough that a stranger sees it loop.
  const { delays, at } = delaysOf('?preview=1', 40);
  const back = at.findIndex((v, k) => k > 0 && v < at[k - 1]);
  assert.ok(back > 0, `the preview never looped in 40 ticks: ${at.join(',')}`);
  assert.ok(back >= 4, `only ${back} events fit — that is a slideshow, not a replay`);
  // AND IT RESTARTS WHERE IT BEGAN, not at the faceoff. A loop that rewinds past
  // its own start replays the dead plays the start rule exists to skip -- every
  // pass after the first -- and a mutation proved nothing else here noticed.
  assert.equal(at[back], at[0],
    `the loop restarts at ${at[back]} but began at ${at[0]} — it rewinds past its own start`);
  const playing = delays.slice(0, back - 1).reduce((a, b) => a + b, 0);
  // THE UPPER BOUND IS WHAT THIS TEST IS FOR, and it moved once, deliberately:
  // Kevin raised the budget from 14s to 30s because the loop was too short to
  // follow. The bound is not "the current value plus a bit" -- it is set to keep
  // rejecting the 57-second loop that a fixed 44-event window produced, which is
  // the drift that motivated the test in the first place.
  assert.ok(playing > 5000 && playing < 35000,
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
  assert.ok(rows.length >= 8, `only ${rows.length} labels parsed`);
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

const CURVE_AND_MIX = {
  levelCurve: [{ k: 12, n: 708, count: 243 }, { k: 1, n: 3855, count: 1527 }],
  // The published figures, copied from measures.json rather than invented — a
  // fixture with a made-up rate tests the formatting and nothing else.
  baseRates: {
    moreAttemptsLost: { what: 'the team with more shot attempts lost',
                        population: 'NHL regular season and playoffs',
                        n: 4029, count: 2194, rate: 2194 / 4029 },
  },
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
                  .filter(h => /blocked it|Blocked by a teammate|no blocker recorded/.test(h));
  assert.ok(labels.length > 0, 'no blocked shot ever named who stopped it');
  // A person, rather than a club abbreviation.
  assert.ok(labels.some(h => /blocked it|Blocked by a teammate/.test(h)),
    'every blocked shot fell back to "no blocker recorded"');
});

test('with the layer off, no label names a blocker', () => {
  // The corollary, and it is what makes the test above mean something: if the
  // blocker's name appeared on every game regardless, it would be page furniture
  // rather than the layer's disclosure.
  const a = boot();
  const any = a.every(d => d.$('labels').innerHTML).join('');
  assert.doesNotMatch(any, /blocked it|Blocked by a teammate/);
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
/**
 * And the keys gated on the GAME's state rather than on a button.
 *
 * Kept separate because the button test below drives a control, and `lk-ends`
 * has no control to drive — folding it into the map above would have made that
 * test look for a `lyEnds` that does not exist. The stylesheet claim is the
 * same for both, so that one iterates over the pair.
 */
const GAME_STATE_KEYS = { 'lk-ends': 'heldends' };

test('a legend key is hidden until the layer that draws its mark is on', () => {
  // The markup ships every key — this is a stylesheet decision, so the assertion
  // is on the rule, in the one instrument that can see it at build time.
  for (const [key, cls] of Object.entries({ ...CONDITIONAL_KEYS, ...GAME_STATE_KEYS })) {
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
  const a = boot();
  const frames = a.every(d => ({ per: d.$('per').textContent,
                                 key: d.$('rg').classList.contains('heldends') }));
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
  assert.equal(a.$('rg').classList.contains('heldends'), false,
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
  const order = ['class="transport"', 'class="verdict"', 'class="legend"', 'class="layers"', 'class="figpick"'];
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
  const a = boot();
  assert.equal(a.$('nSit').textContent, '', 'the note appears before even-strength is chosen');

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

  a.GROUPS['#rg .sbtn'].find(b => b.dataset.s === 'all').click();
  assert.equal(a.$('nSit').textContent, '', 'the note outlived the setting that produced it');
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
  assert.doesNotMatch(app, /class="lede"/, 'the game page still ships the old opening paragraph');
  // A returning viewer now meets the rink 245px sooner than a first-time one —
  // which is the right way round, and was not true of the paragraph it replaced.
  const veteran = boot(rich, CURVE_AND_MIX, '', { getItem: () => '1999-01-01|9', setItem: () => {} });
  assert.equal(veteran.$('rg').classList.contains('newcomer'), false);
});

test('each half of the greeting sits beside the thing it is about', () => {
  // The fix for a defect only a browser could show: whole and above the rink,
  // the block pushed the play button it names below the fold (rink ended 899,
  // button 914, fold 844 on a 390px phone). DOM order is the half checkable
  // here; the geometry is checked by looking.
  const order = ['id="newcomer"', 'class="transport"', 'id="newcomerWhy"', 'class="layers"'];
  let at = -1;
  for (const marker of order) {
    const k = app.indexOf(marker);
    assert.ok(k > at, `${marker} is out of order — a greeting has drifted from its subject`);
    at = k;
  }
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
const at = d => +d.$('scrub').value;

test('the transport can step ONE play, in both directions', () => {
  const a = boot();
  a.$('scrub').oninput({ target: { value: '40' } });
  const from = at(a);
  a.$('fwd').click();
  assert.equal(at(a), from + 1, 'Next moved by something other than one play');
  a.$('back').click();
  a.$('back').click();
  assert.equal(at(a), from - 1, 'Back does not undo Next');
});

test('the step buttons say where the game ends, instead of accepting a dead press', () => {
  const a = boot();
  const last = +a.$('scrub').max;

  a.$('scrub').oninput({ target: { value: '0' } });
  assert.equal(a.$('back').disabled, true, 'Back is live at the first play');
  assert.equal(a.$('fwd').disabled, false);
  // And pressing it anyway is harmless — `set` clamps.
  a.$('back').click();
  assert.equal(at(a), 0);

  a.$('scrub').oninput({ target: { value: String(last) } });
  assert.equal(a.$('fwd').disabled, true, 'Next is live at the last play');
  assert.equal(a.$('back').disabled, false);
  a.$('fwd').click();
  assert.equal(at(a), last);

  // The state is a FUNCTION of the playhead, not a thing set once at an end:
  // step off the edge and it must come back.
  a.$('back').click();
  assert.equal(a.$('fwd').disabled, false, 'Next stayed disabled after leaving the end');
});

test('stepping takes the replay off automatic', () => {
  const a = boot();
  a.$('play').click();
  assert.match(a.$('play').textContent, /Pause/, 'the harness never started the replay');
  a.$('fwd').click();
  assert.doesNotMatch(a.$('play').textContent, /Pause/,
    'the replay kept playing while the viewer was stepping through it by hand');
});

/**
 * WHICH FRAME CALLED SOMETHING — and it cannot be read off the caption's text.
 *
 * `caption()` writes innerHTML and NOTHING EVER CLEARS IT. In a browser the
 * `.on` animation fades it out after 2.2s and it is invisible; in the DOM the
 * words stay there for the rest of the game. So a test that asks "does the
 * caption say GOAL at this frame" is asking how long ago the last goal was, and
 * the first draft of these tests counted 84 goals in a game with five.
 *
 * A call is therefore a CHANGE, which is what the viewer sees too.
 */
function callsWhileStepping(a, read) {
  const out = [];
  let last = a.$('caption').innerHTML;
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    const now = a.$('caption').innerHTML;
    if (now !== last) out.push(read(now, a));
    last = now;
  }
  return out;
}

/**
 * THE DIFFERENCE BETWEEN ARRIVING AT A FRAME AND SEEING A MOMENT AGAIN.
 *
 * One argument to `set()`, and it is the reason to press Back at all. The same
 * frames reached two ways: dragged through (silent) and stepped onto (called).
 */
test('a step CALLS the moment again; dragging through it does not', () => {
  const goals = rich.events.filter(e => e.type === 'goal').length;
  assert.ok(goals > 1, 'the reference game should contain goals');

  const dragged = boot();
  const before = dragged.$('caption').innerHTML;
  dragged.every(d => d.$('caption').innerHTML);
  assert.equal(dragged.$('caption').innerHTML, before,
    'dragging the scrubber across the whole game called a moment');

  const stepped = boot();
  const called = callsWhileStepping(stepped, h => h);
  assert.equal(called.filter(h => /GOAL/.test(h)).length, goals,
    'stepping through the game called a different number of goals than it contains');
});

/** The scrub index of the first frame whose current mark is a goal. */
function firstGoalFrame(a) {
  // The space is load-bearing: `shot-on-goal` also ends in "goal", and without
  // it this helper found the first SHOT and the test then asserted that landing
  // on a shot called a goal — which it correctly did not.
  const k = a.every(d => /<title>[^<]* goal<\/title>/.test(d.$('events').innerHTML)).indexOf(true);
  assert.ok(k > 0, 'no frame in the reference game draws a goal');
  return k;
}

test('a deep link lands without pretending the whole game just happened', () => {
  // THE CASE THE SPLIT EXISTS FOR, and the first draft of this test missed it by
  // jumping to a frame it had already rendered — where `a > prevA` is false
  // whatever the code does, so the assertion held under the mutation too.
  //
  // `?at=` is the real one: boot zeroes prevA/prevH and then lands the playhead
  // in the third period, where fifty attempts are already on the board. Under
  // one shared boolean both counters flash on arrival — "that just happened" —
  // about fifty shots spread over an hour.
  const bumped = d => d.$('cA').classList.contains('bump') || d.$('cH').classList.contains('bump');
  const a = boot(rich, null, '?at=3-05:00');
  const arrived = +a.$('cA').textContent + +a.$('cH').textContent;
  assert.ok(arrived > 20,
    `the link landed on ${arrived} attempts — too few for this test to be about anything`);
  assert.equal(bumped(a), false, 'arriving somewhere bumped the counters as if a shot had just been taken');
  // And it is a JUMP, not a silent seek: the moment it lands on is still called.
  assert.ok(a.$('atnote').textContent !== undefined);

  // THE CONTROL, AND IT HAS TO BE THE REAL LOOP. Without it this passes against
  // a page whose counters never flash at any time, which is not the claim.
  // `advance` returns how many frames the play loop really ran, so a dead timer
  // cannot be mistaken for a quiet one.
  const player = boot();
  const far = Math.floor(+player.$('scrub').max * 0.8);
  player.$('play').click();
  assert.equal(player.advance(far), far, 'the replay did not run');
  assert.equal(bumped(player), true,
    'playing forward through 80% of a game never bumped a counter');
});

test('letting go of the scrubber calls the play you landed on', () => {
  // A drag passes THROUGH plays and lands on one. `oninput` fires at every value
  // the slider crosses, so the moment is called on `onchange` — once, when the
  // viewer lets go — and the frame they chose gets called like any other jump.
  const a = boot();
  const goal = firstGoalFrame(a);
  a.$('scrub').oninput({ target: { value: String(goal - 1) } });
  a.$('scrub').oninput({ target: { value: String(goal) } });
  const during = a.$('caption').innerHTML;
  a.$('scrub').onchange({ target: { value: String(goal) } });
  const after = a.$('caption').innerHTML;
  assert.notEqual(after, during, 'letting go of the scrubber on a goal called nothing');
  assert.match(after, /🚨 GOAL/, 'the release called something other than the goal it landed on');
});

test('a penalty is CALLED on the ice, like a goal and unlike a giveaway', () => {
  // The finding that came out of asking the index's question of the renderer:
  // a penalty is the one event that changes the CONDITIONS of the game — it is
  // why `Even strength only` exists — and it was marked exactly as loudly as a
  // giveaway. What follows is a RELATIONSHIP, not a list: whatever the game
  // holds, the events that get called must be exactly its goals and penalties.
  const a = boot();
  const marks = callsWhileStepping(a, (h) =>
    /🚨 GOAL/.test(h) ? 'goal' : /⛔ Penalty/.test(h) ? 'penalty' : 'other');
  const got = { goal: 0, penalty: 0, other: 0 };
  marks.forEach(m => got[m]++);
  const want = t => rich.events.filter(e => e.type === t).length;
  assert.deepEqual(got, { goal: want('goal'), penalty: want('penalty'), other: 0 },
    'with no layers on, exactly the goals and the penalties get a moment of their own');
  assert.ok(got.penalty > 0 && got.goal > 0, 'the walk found neither kind');
});

test('the penalty caption names the team that TOOK it', () => {
  // `own` is the offending team — checked against the situation code rather than
  // assumed: across the reference game's penalties the skater count drops for
  // `own`'s side on the very next event that carries one.
  const pens = rich.events.map((e, n) => [e, n]).filter(([e]) => e.type === 'penalty');
  assert.ok(pens.length >= 4, 'the reference game should carry several penalties');
  const side = e => (e.own === rich.teams.home.id ? 2 : 1);   // sit = [aG][aSk][hSk][hG]
  for (const [e, n] of pens) {
    const next = rich.events.slice(n + 1).find(x => x.sit);
    assert.ok(+next.sit[side(e)] < +e.sit[side(e)],
      `P${e.per} ${e.rem}: the skater count did not drop for the team the feed calls \`own\``);
  }
  // And the caption says so, in the same order the game does.
  const abs = { [rich.teams.home.id]: rich.teams.home.ab, [rich.teams.away.id]: rich.teams.away.ab };
  const called = callsWhileStepping(boot(), h => {
    const m = h.match(/<span class="tag ([ah])">([A-Z]{3})<\/span><b>⛔/);
    return m && m[2];
  }).filter(Boolean);
  assert.deepEqual(called, pens.map(([e]) => abs[e.own]),
    'the penalty captions name a different set of teams, or a different order, than the feed does');
  // BOTH clubs must appear, or a page that always printed the away side passes.
  assert.equal(new Set(called).size, 2, 'only one club ever took a penalty in this walk');
});

/* ------------------------------------------------------- THE PACE, MEASURED
   Both tests below pin a defect that was found by WALKING A REPLAY IN A BROWSER
   and was invisible to 496 passing tests. docs/event-timing.md carries the walk. */

test('no frame pauses without saying something', () => {
  // DEFECT ONE, and this is the invariant that makes it impossible rather than
  // guarded. Measured live at Teaching: 55 of 280 frames (19.6%) held 1.3x to
  // 2.6x the base with nothing on screen to tell them apart, because `dwell`
  // asked `isHD(e)` while the caption asked `hdOn && isHD(cur)`. The slot tier
  // fired with the layer OFF -- a pause built to give a caption room, arriving
  // without one.
  //
  // THE ASSERTION IS THE BICONDITIONAL, not "long frames are rare". A frame is
  // long if and only if it spoke.
  const { rows } = paceOf(160);
  const base = Math.min(...rows.map(r => r.ms));
  const long = rows.filter(r => r.ms > base);
  assert.ok(long.length > 0, 'no frame in the walk was ever given extra time');
  assert.ok(long.length < rows.length, 'every frame was long — there is no base pace left');
  for (const r of rows) {
    assert.equal(r.ms > base, r.spoke,
      r.spoke ? `frame ${r.i} carried a caption and got the ordinary ${r.ms}ms`
              : `frame ${r.i} paused for ${r.ms}ms with nothing on screen to explain it`);
  }
});

test('the caption lasts exactly as long as the frame it describes', () => {
  // DEFECT TWO. The caption was `animation:cap 2.2s` in the stylesheet and the
  // pace was a setTimeout, so they were never related and only one of them heard
  // the speed buttons. Measured: 2067ms visible at every speed, so a 1300ms
  // penalty frame let its caption finish ON THE NEXT PLAY (6 of 6, and two plays
  // later at Faster) while a 6000ms goal frame spent 3933ms with it already gone.
  //
  // ONE NUMBER, READ TWICE. Asserting a literal here would be a second copy of
  // the pace, free to agree with a wrong first copy -- the same reason the
  // preview test above measures the replay instead of restating dwell.
  const { rows } = paceOf(160);
  const spoke = rows.filter(r => r.spoke);
  assert.ok(spoke.length >= 3, `only ${spoke.length} frames spoke in the walk`);
  for (const r of spoke) {
    assert.equal(r.dur, r.ms + 'ms',
      `frame ${r.i} runs ${r.ms}ms and its caption runs ${r.dur} — two clocks again`);
  }
});

test('the speed control moves the caption too, not just the frame', () => {
  // The half of defect two the biconditional above cannot see: both could scale
  // together and still be wrong if the caption ignored the speed buttons, which
  // is precisely what shipped. Read at two settings and require BOTH to move.
  const at = id => {
    const { rows } = paceOf(160, dom => { if (id) dom.$(id).onclick(); });
    const spoke = rows.filter(r => r.spoke);
    return { frame: Math.min(...rows.map(r => r.ms)), cap: spoke[0].dur };
  };
  const teaching = at(null), faster = at('sp2');
  assert.ok(faster.frame < teaching.frame,
    `Faster waits ${faster.frame}ms and Teaching waits ${teaching.frame}ms`);
  assert.notEqual(faster.cap, teaching.cap,
    `the caption ran ${teaching.cap} at both speeds — it is a constant beside the pace again`);
});

test('no caption says the same thing twice', () => {
  // `⚡ Shot from the slot · #16 Dorofeyev from the slot` — 31 of 31 slot
  // captions, live, and nothing in 496 tests read that string. The trailing
  // clause was written when the label said "high danger"; the rename left the
  // sentence naming the slot in both halves.
  //
  // CHENG's assertion, and the crudeness is the point: a rename is verified by
  // grepping for the term that LEFT, which cannot see the redundancy the
  // departure created. This reads the rendered output instead.
  //
  // EVERY LAYER STATE, because the defect only appeared with one of them on —
  // the caption for a slot shot does not exist until the slot layer does.
  const a = boot();
  const seen = [];
  for (const on of [false, true]) {
    if (on) a.$('lyHd').click();
    seen.push(...callsWhileStepping(a, h => h));
  }
  assert.ok(seen.length > 0, 'the walk found no captions at all');
  assert.ok(seen.some(h => /Shot from the slot/.test(h)),
    'the walk never turned the slot layer on — the defect this test exists for is unreachable');

  for (const html of seen) {
    // Words only: the tag element repeats the club abbreviation by design
    // (`<span class="tag">CAR</span>` beside `#53 Blake`), so this looks for a
    // repeated PHRASE, which is what a duplicated clause is.
    const words = html.replace(/<[^>]*>/g, ' ').replace(/[·#]/g, ' ')
                      .toLowerCase().split(/\s+/).filter(Boolean);
    const grams = new Map();
    for (let k = 0; k + 3 <= words.length; k++) {
      const g = words.slice(k, k + 3).join(' ');
      grams.set(g, (grams.get(g) || 0) + 1);
    }
    for (const [g, n] of grams) {
      assert.equal(n, 1, `a caption says "${g}" ${n} times: ${words.join(' ')}`);
    }
  }
});

test('the caption is not clickable, and nothing pretends it is', () => {
  // `#rg .caption` carries pointer-events:none — it floats over the ice and
  // would otherwise swallow clicks meant for the marks. A listener on it could
  // never fire, and one sat there unreachable until it was found by reading the
  // stylesheet rather than the script.
  const rule = PAGE_CSS.match(/#rg \.caption\{([^}]*)\}/);
  assert.ok(rule, 'the caption lost its rule');
  assert.match(rule[1], /pointer-events:\s*none/, 'the caption became clickable');
  assert.doesNotMatch(PAGE_CSS, /\.caption[^{]*\{[^}]*pointer-events:\s*(auto|all)/,
    'something re-enabled clicks on the caption');
  assert.doesNotMatch(SCRIPT, /\$\('caption'\)\.addEventListener/,
    'a listener was added to an element that cannot receive events');
});

test('the step buttons say what they step THROUGH, in words a reader can see', () => {
  // Kevin: "don't we need to state what the prev and next arrows are for?"
  // `◀ Back` beside a slider does not answer "back to what", and the answer was
  // only in an aria-label, which a sighted viewer never gets.
  const btn = id => app.match(new RegExp(`<button[^>]*id="${id}"[^>]*>([^<]*)<`))[1];
  for (const id of ['back', 'fwd']) {
    const visible = btn(id);
    assert.match(visible, /\bplay\b/,
      `#${id} reads "${visible}" — it names a direction but not what it moves through`);
    // The accessible name must not be poorer than the visible one, and the
    // arrow glyph must not be the only thing a screen reader is handed.
    const aria = app.match(new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="([^"]*)"`))[1];
    assert.match(aria, /\bplay\b/, `#${id}'s accessible name lost the unit`);
  }
  // And the unit is THE PAGE'S OWN WORD for an event, not a new one introduced
  // in the transport: a viewer who reads "Explain plays" and "every play is
  // named as it happens" must meet the same noun here.
  assert.match(app, /Explain plays/, 'the page stopped calling events "plays" elsewhere');
});

/**
 * The two rows, each cut off where the next one starts.
 *
 * Splitting on a row's OWN class (`<div class="mix game">`) matches once and
 * leaves everything after it — so "the game row" included the archive row, and a
 * test asserting the game row carries no percentage failed against a page where
 * it carries none. Splitting on the SHARED prefix is what makes the boundary
 * real, because `split` cuts at every delimiter rather than the first.
 */
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
