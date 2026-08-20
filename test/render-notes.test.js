/**
 * Legend keys, the empty-net note, the verdict card and the first-visit greeting
 *
 * Split out of test/render.test.js, which had reached 3,678 lines and 129 tests
 * because it owned the only harness able to run the shipped bundle. The harness
 * is now test/helpers/page.js and this file is one subject.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { corsi } from '../src/lib/layers/corsi.js';
import { rich, app, PAGE_CSS, prose, boot, CURVE_AND_MIX } from './helpers/page.js';

const CONDITIONAL_KEYS = { 'lk-hd': 'slot', 'lk-blk': 'blocked' };
/**
 * And the keys gated on the GAME's state rather than on a button.
 *
 * Kept separate because the button test below drives a control, and `lk-ends`
 * has no control to drive — folding it into the map above would have made that
 * test look for a `lyEnds` that does not exist. The stylesheet claim is the
 * same for both, so that one iterates over the pair.
 */
const GAME_STATE_KEYS = { 'lk-ends': 'endskey' };

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
