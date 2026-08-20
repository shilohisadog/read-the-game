/**
 * Club identity, annotation rings, and the base view a first visit gets
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEAMS, colourOf } from '../src/lib/teams.js';
import { whistle } from '../src/lib/layers/whistle.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich, app, PAGE_CSS, boot, rings, panel } from './helpers/page.js';

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
