/**
 * The standing condition on the scoreboard — 2026-08-31.
 *
 * Kevin: *"we announce the penalty, but we don't retain the 'power play' on the
 * caption pill, maybe we should?"* — and then, on where it goes: *"the power
 * play pill should be in the bottom center, which is just empty space now, due
 * to reserving the left and right hand side for penalty information."*
 *
 * ⭐ WHAT THIS FILE CAN AND CANNOT PROVE. The reason this change exists at all
 * is layout, and this harness has no CSS and no layout. Every geometric claim
 * below was measured in a real Chromium at 390 and 1100 and lives in the
 * comments beside the rules it justifies; nothing here can see a pixel. Three
 * things in this change were caught ONLY by looking and could not have been
 * caught here: the pill at 189px grew the board 151 -> 176 on a phone; the
 * middle column widened 150 -> 343 on a laptop because `min-width` is a floor
 * and not a cap; and a stray `*​/` left a comment open, so the whole rule was
 * swallowed as a bogus selector and `display` computed as plain `inline` while
 * every assertion in this file would have passed.
 *
 * ⭐ SO WHAT IS CHECKED HERE IS WHAT ROTS SILENTLY: that the element is where
 * the positioning assumes, that the two CSS declarations which only work as a
 * PAIR are both present, that the badge names the right club, that it wears
 * that club's colour, and that it goes out again — the last of which is the one
 * a fresh boot per assertion would never catch.
 *
 * ⛔ THE EXPECTATIONS ARE READ FROM THE FEED'S OWN DIGITS, NOT FROM
 * `standing()`. `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie], so
 * `1451` means the HOME side has five against four and `0651` means the AWAY
 * net is empty. Both are decided here by hand from the string and the fixture's
 * team table. Asking `standing()` what to expect would make every test below a
 * mirror of the function under test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app, PAGE_CSS, boot, rich } from './helpers/page.js';
import { stints } from '../src/lib/box.js';
import { readFileSync } from 'node:fs';

const HOME = rich.teams.home.ab;   // BUF
const AWAY = rich.teams.away.ab;   // MIN

/**
 * The rule body for a selector — WITH ITS COMMENTS STRIPPED.
 *
 * ⚠️ THE STRIP IS THE POINT, AND A MUTATION IS WHAT FOUND IT. Without it,
 * `assert.match(ruleFor('#rg .ppill'), /line-height:1/)` passed against a rule
 * whose declaration had been mutated to `line-height:normal` — because the
 * comment INSIDE that rule contains the words `line-height:1` while explaining
 * why it is load-bearing. That is the project's own rule broken again: a check
 * that cannot tell code from the WORDS ABOUT the code is not a check about
 * code. Ten of eleven mutations died here; this one lived, and the test that
 * let it live was the one written to prevent exactly this.
 */
const ruleFor = (sel) => {
  const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = re.exec(PAGE_CSS);
  assert.ok(m, `no rule for ${sel} — this guard has lost its subject`);
  return m[1].replace(/\/\*[\s\S]*?\*\//g, '');
};
/** Drive the playhead the way the transport does. */
const at = (a, i) => a.$('scrub').oninput({ target: { value: String(i) } });

test('the pill is inside the clock line, which is what the layout assumes', () => {
  // Both widths depend on it being INLINE CONTENT of `.gs`: at 390 it sits
  // beside the clock in the 167px of spare that row has, at 1100 it wraps onto
  // its own line inside the middle column. Moved out to `.mid` or the board it
  // becomes a sibling of the clock rather than part of its line, and both
  // behaviours change while every other assertion here keeps passing.
  assert.match(app, /<div class="gs">[\s\S]{0,200}?<span class="ppill" id="ppill" hidden><\/span><\/div>/,
    'the pill is no longer the last child of the clock line');
  assert.doesNotMatch(app, /class="ppill"[^>]*\sonclick=/,
    'an inline handler, which this page’s CSP refuses');
});

test('⭐ `[hidden]` is restated for the pill — the UA rule alone loses', () => {
  // THE PAIR THAT ONLY WORKS TOGETHER. `#rg .ppill` sets a display, and that
  // beats the UA sheet's `[hidden]{display:none}` on specificity. Without the
  // second line the `hidden` attribute is set, `p.hidden` reads true, every
  // behavioural test below still passes — and the chip sits on the scoreboard
  // through even-strength play, which is the whole of what it must not do.
  assert.match(ruleFor('#rg .ppill'), /display:flex/, 'the pill has no display of its own');
  assert.match(PAGE_CSS, /#rg \.ppill\[hidden\]\{display:none\}/,
    'hiding the pill now depends on a UA rule that its own display overrides');
});

test('⭐ the two widths get opposite layouts, because the free space is opposite', () => {
  // Measured, not chosen: at 1100 `.mid` is a 150px column with ~36px of empty
  // band below the clock and 0px spare beside it; at 390 `.mid` becomes the
  // full-width `state` row with 167px spare beside the clock and nothing below.
  // One inline rule for both put the board 151 -> 176 on the phone.
  assert.match(ruleFor('#rg .ppill'), /margin:5px auto 0/,
    'the desktop pill no longer takes its own line under the clock');
  assert.match(PAGE_CSS, /#rg:not\(\.preview\) \.ppill\{display:inline-flex;margin:0\}/,
    'the phone override is gone — on its own line there it grows the board');
  // AND THE LINE BOX IS PINNED. At the inherited line-height the pill stands
  // 21px inside a 19px line and the board grew and shrank by 2px every time a
  // power play started or ended.
  assert.match(ruleFor('#rg .ppill'), /line-height:1/,
    'the pill can grow the clock line again, which shifts the board');
});

test('the team chip is the penalty box’s, not a second implementation', () => {
  // Two ways to draw a club chip is two things to keep in step with the club
  // colours, and they drift apart the first time either is touched.
  assert.match(ruleFor('#rg .ppill::before'), /content:attr\(data-ab\)/);
  assert.match(PAGE_CSS, /#rg \.pb::before\{content:attr\(data-ab\)/,
    'the pattern this borrows from has moved');
  assert.match(PAGE_CSS, /#rg \.ppill\.a::before\{background:var\(--away\)/);
  assert.match(PAGE_CSS, /#rg \.ppill\.h::before\{background:var\(--home\)/);
});

test('⭐ the badge is off in the preview, and not by luck', () => {
  // The hero hides `.pens`, so a power-play chip there would be an effect with
  // its cause removed. It measured 0x0 in a real hero before this rule existed
  // — because that hero's loop happens to sit at even strength today. The
  // opening frame is derived (`hl`) and moves with the archive, so "invisible
  // right now" is a property of the playhead, not of the page.
  assert.match(PAGE_CSS, /#rg\.preview \.ppill,/,
    'the strength pill is no longer in the preview hide list');
  assert.match(PAGE_CSS, /#rg\.preview \.pens\{display:none!important\}/,
    'the penalty box it is being kept consistent with has moved');
});

test('the badge is dark at even strength', () => {
  const a = boot();
  assert.equal(a.$('ppill').hidden, true, 'lit before the game has started');
  at(a, 0);                                    // sit 1551 — five on five
  assert.equal(a.$('ppill').hidden, true, 'lit at five on five');
  at(a, 112);                                  // sit 1441 — four on four IS even
  assert.equal(a.$('ppill').hidden, true, 'four-on-four is even strength, not an advantage');
});

test('⭐ the badge names the club with the extra skater, and wears ITS colour', () => {
  // `1451` — away 4, home 5 — so this is the HOME club, and the class must be
  // `h`. Getting the side wrong paints the badge in the opponent's colours,
  // which is the worst available failure for a chip whose entire job is WHO.
  const a = boot();
  at(a, 2);
  const p = a.$('ppill');
  assert.equal(p.hidden, false, 'dark on a power play');
  assert.equal(p.dataset.ab, HOME, `the feed says home is up a skater; the badge says ${p.dataset.ab}`);
  assert.ok(p.className.split(/\s+/).includes('h'),
    `"${p.className}" — the badge is wearing the away club's colour`);
  assert.equal(p.textContent, 'power play');

  // The mirror image, so neither side passes by being the default.
  at(a, 52);                                   // sit 1541 — away 5, home 4
  assert.equal(p.dataset.ab, AWAY, 'the away power play names the wrong club');
  assert.ok(p.className.split(/\s+/).includes('a'), `"${p.className}" — wrong side`);
});

test('⭐ and it goes out again — the change cache must not stick', () => {
  // `drawPill` skips the DOM unless the condition CHANGED, which is what keeps
  // it from rewriting the chip on all 269 frames. A cache that never clears
  // leaves the badge lit for the rest of the game, and a test that boots afresh
  // for each assertion cannot see it: every boot starts with an empty cache.
  const a = boot();
  at(a, 2);
  assert.equal(a.$('ppill').hidden, false);
  at(a, 9);                                    // back to 1551
  assert.equal(a.$('ppill').hidden, true, 'the badge stayed lit after the power play ended');
  at(a, 52);                                   // a DIFFERENT club’s advantage
  assert.equal(a.$('ppill').dataset.ab, AWAY, 'it never lit again for the other club');
});

test('an empty net is badged as an empty net, and names the club that pulled', () => {
  // `0651` — the leading 0 is the AWAY goalie, so the away club pulled. A
  // pulled goalie is not a power play and must not be labelled one: 6-on-5
  // with a net empty is desperation, and the two belong in different boxes.
  const a = boot();
  at(a, 254);
  const p = a.$('ppill');
  assert.equal(p.hidden, false);
  assert.equal(p.textContent, 'net empty');
  assert.equal(p.dataset.ab, AWAY, 'code[0]=0 is the away net');
  assert.ok(p.className.split(/\s+/).includes('a'));
});

/* ═══ THE PENALTY KILL — the moment the feed does not record ═══
 *
 * Kevin, watching a replay event by event: *"I was wondering why don't we say
 * when the penalty expires."* A penalty running out produces no play, so there
 * is no event to hang a caption on; the situation code simply changes on the
 * next thing that happens. Across 60 archive games, 78.6% of the 308 power
 * plays that end, end this way, and the page said nothing about any of them.
 *
 * ⛔ EVERY EXPECTATION BELOW COMES FROM `box.js`'s STINT TABLE, WHICH NEVER
 * READS `sit`. The reference game's eight penalties, hand-checked:
 *
 *   MIN Eriksson Ek  tripping        25 → 145   time   → killed, P1 17:17
 *   BUF Peterka      holding        785 → 905   time   → killed, P1 04:48
 *   BUF Johnson      cross-checking 1114 → 1170 GOAL   → refused
 *   MIN Bogosian     kneeing       1452 → 1572  time   → refused, BUF still serving
 *   BUF Mittelstadt  double-minor  1497 → 1737  time   → killed, P2 10:41
 *   MIN Kaprizov     interference  2364 → 2484  time   → killed, P3 18:09
 *   MIN Faber        holding       2967 → 3087  time   → refused, BUF still serving
 *   BUF Greenway     interference  3050 → 3147  GOAL   → refused
 */
const KILL_MOMENTS = [[1, '17:17'], [1, '04:48'], [2, '10:41'], [3, '18:09']];

test('⭐ the caption names the club that was SHORT — the opposite of every other one', () => {
  // Every other caption on this page is about the event's own team: the scorer,
  // the offender, the shooter. This one is about the club that killed it, which
  // by definition does not own the frame it lands on — a shot, a faceoff, a hit
  // belonging to whoever happened to be playing. Reusing `e.own` would have
  // credited the kill to the club that had just been on the power play.
  // ⚠️ STEPPED ONTO, NOT DRAGGED THROUGH. Captions fire only on a MOMENT — the
  // whole subject of "the difference between arriving at a frame and seeing a
  // moment again" in render-transport.test.js. Scrubbing with `oninput` found
  // zero kills on a page that renders four, because a drag is deliberately
  // silent. The kill is a caption and inherits that, which is correct.
  const a = boot();
  const seen = [];
  let last = a.$('caption').innerHTML;
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    const cap = a.$('caption').innerHTML;
    if (cap !== last && /🛡 Penalty killed/.test(cap)) seen.push(cap);
    last = cap;
  }
  assert.equal(seen.length, KILL_MOMENTS.length, `found ${seen.length} kills`);
  // MIN killed two and BUF killed two, per the table above — so a caption that
  // always named one club, or always named the club on the advantage, fails.
  const tags = seen.map(h => /<span class="tag (\w)">(\w+)<\/span>/.exec(h).slice(1));
  assert.deepEqual(tags.map(t => t[1]), ['MIN', 'BUF', 'BUF', 'MIN'],
    'the kills are credited to the wrong clubs, or in the wrong order');
  // AND THE COLOUR FOLLOWS THE CLUB, not the frame's own team.
  for (const [side, ab] of tags)
    assert.equal(side, ab === rich.teams.home.ab ? 'h' : 'a', `${ab} wearing side "${side}"`);
});

test('⭐ "a side" is read from the feed, never asserted to be five', () => {
  const a = boot();
  // STEPPED ONTO — a drag is silent, see the note in the test above.
  a.$('scrub').oninput({ target: { value: '8' } });
  a.$('fwd').click();                                   // frame 9, P1 17:17, MIN killed it
  const h = a.$('caption').innerHTML;
  assert.match(h, /🛡 Penalty killed/);
  // The reference game returns to 1551 every time, so the rendered number is 5 —
  // but it must come from the CODE. `sit[1]` and `sit[2]` are the skater counts.
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = rich.events.filter(e => !SKIP.has(e.type));
  assert.equal(EV[9].sit, '1551', 'the fixture frame moved');
  assert.match(h, new RegExp(`· ${EV[9].sit[2]} a side`),
    'the caption does not quote the skater count the feed reports');
});

test('⭐ a power play SCORED ON is not a kill, and box.js is what knows', () => {
  // Johnson's cross-check and Greenway's interference both die to a goal. A
  // "no goal within N frames" test would need an N with no source in the data —
  // and would still be wrong, because a goal does not end a MAJOR. Over 60
  // archive games the two approaches disagree on 15 power plays, in both
  // directions, and this rule is right in both.
  const ctx = { roster: rich.roster, homeId: rich.teams.home.id, awayId: rich.teams.away.id };
  const ST = stints(rich.events, ctx);
  const byGoal = ST.filter(s => s.endedBy === 'goal');
  assert.equal(byGoal.length, 2, 'the reference game no longer contains a penalty killed by a goal');

  /* ⚠️ THIS TEST WAS VACUOUS ON ITS FIRST WRITING AND PASSED. It drove the page
     with `oninput` and asserted the caption did NOT say "Penalty killed" — but a
     drag never fires a caption at all, so the assertion held on a page that
     renders nothing. It could not have failed. The walk below STEPS, which is
     the only way a caption appears, and every kill it finds is then matched to
     the stint that produced it — so the claim is positive (each kill has a
     time-ended cause) rather than an absence that silence satisfies. */
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = rich.events.filter(e => !SKIP.has(e.type));
  const a = boot();
  const found = [];
  let last = a.$('caption').innerHTML;
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    const cap = a.$('caption').innerHTML;
    if (cap !== last && /🛡 Penalty killed/.test(cap)) found.push(+a.$('scrub').value);
    last = cap;
  }
  assert.equal(found.length, KILL_MOMENTS.length,
    `the walk found ${found.length} kills — if it found none this test proves nothing`);

  for (const n of found) {
    // The stint this kill claims: the same club's, ending at or before this
    // frame and after the one before it.
    const cause = ST.filter(s => s.end > EV[n - 1].s && s.end <= EV[n].s);
    assert.equal(cause.length, 1, `P${EV[n].per} ${EV[n].rem}: ${cause.length} stints could have caused this`);
    assert.equal(cause[0].endedBy, 'time',
      `P${EV[n].per} ${EV[n].rem}: a power play that was SCORED ON was captioned as killed`);
  }
  // AND NEITHER GOAL-ENDED PENALTY PRODUCED ONE.
  for (const s of byGoal)
    assert.ok(!found.some(n => s.end > EV[n - 1].s && s.end <= EV[n].s),
      `the penalty ended by a goal at ${s.end}s was captioned as a kill`);
});

test('⭐ the kill outranks the slot shot, on a game where that actually happens', () => {
  /* ⚠️ THE REFERENCE GAME CANNOT TEST THIS AND A MUTATION PROVED IT. Swapping
     the two branches so the slot shot wins survived a green suite of 861,
     because none of `rich.json`'s four kills lands on a high-danger shot. That
     is luck: across 60 archive games **14.8% of kills do** — about one every
     two games with the slot layer on. So the check moves to a fixture that
     contains the collision rather than staying where it is comfortable.
     `2025030214` is already in the repo for the penalty clock; its kill at
     frame 81 is also a shot from the slot. */
  const KILLED_GAME = JSON.parse(readFileSync(
    new URL('fixtures/extracts/2025030214.json', import.meta.url), 'utf8'));
  const a = boot(KILLED_GAME, null, '?layer=slot');
  a.$('scrub').oninput({ target: { value: '80' } });
  a.$('fwd').click();
  const h = a.$('caption').innerHTML;
  assert.match(h, /🛡 Penalty killed/,
    'the slot shot took the frame and the penalty kill went unsaid');
  assert.doesNotMatch(h, /Shot from the slot/, 'both captions rendered at once');
});

test('⭐ a kill is a captioned frame, so the pace gives it room', () => {
  // THE SEAM. `captioned` is the one predicate `render` and `dwell` share, and
  // that shared-ness is what makes a caption with no pause behind it impossible.
  // A caption wired into `render` alone would appear and vanish inside an
  // ordinary frame — the same defect docs/event-timing.md exists about, running
  // backwards. This asserts the predicate itself carries the kill.
  assert.match(app, /function captioned\(e\)\{return[^}]*KILLED\.has\(e\)/,
    'the kill is captioned by the renderer but invisible to `dwell`');
  // AND IT IS ONE MAP, COMPUTED ONCE — a per-frame recomputation would re-derive
  // every stint on all 269 frames.
  assert.match(app, /const KILLED=new Map\(penaltyKilled\(EV,PBOX,CTX\)/,
    'the kills are no longer derived once from the game');
});

test('⭐ the badge lags the penalty by one frame, and the page says why', () => {
  // `render` refuses to name the power play in the penalty caption because at
  // that frame nobody is short yet — "a claim about the future dressed as a
  // description". The badge reads the frame's own `sit`, so it inherits the
  // refusal instead of restating it, and this pins that it still does.
  const a = boot();
  const pen = rich.events.filter(e => e.type === 'penalty');
  assert.ok(pen.length, 'the reference game has no penalties');
  at(a, 1);                                    // the penalty at P1 19:35, sit still 1551
  assert.equal(a.$('ppill').hidden, true,
    'the badge lit at the call, before the offending club was a skater short');
  at(a, 2);
  assert.equal(a.$('ppill').hidden, false, 'and it never lit on the next frame');
});
