import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { stints, occupants } from '../src/lib/box.js';
import { PEN, penName } from '../src/lib/penalties.js';
import { playable } from '../src/lib/layer.js';
import { app, PAGE_CSS, boot, rich } from './helpers/page.js';

const mmssOf = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

const KILLED = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2025030214.json', import.meta.url), 'utf8'));

/**
 * The renderer's body, for the few claims below that no fixture can pose.
 *
 * ⚠️ THE PARAMETER LIST IS DELIBERATELY NOT PART OF THE PATTERN. Three tests here
 * matched `function drawBoxes(secs){…}` literally and all three went red the day
 * the function gained a second argument — a change no viewer could see. §0.00-a
 * finding 5: *a test anchored on a source file breaks on a move while the page is
 * unchanged.* Everything that CAN be asked of the rendered seat now is; what is
 * left needs a game with three men in one box, which no fixture we own contains.
 */
const DRAW = /function drawBoxes\([^)]*\)\{[\s\S]*?\n\}/.exec(app)[0];

/**
 * ⭐ THE CLOCK COUNTS THE REFEREE'S TIME, NOT THE TIME HE ACTUALLY SERVED.
 *
 * `box.js` derives early release — a minor dies when the other team scores on
 * it — so every stint already knows its TRUE end. Counting down to that end
 * would ANNOUNCE A GOAL THAT HAS NOT HAPPENED: the same thing the verdict card
 * and the game line already refuse to do.
 *
 * This fixture is where the two numbers are furthest apart in the sample: a
 * double minor whose assessed clock reads 4:00 at the moment its served
 * remaining is 1:04. A page counting the served time would be telling the
 * viewer, 176 seconds early, that a goal is coming.
 */
test('the penalty clock cannot announce a goal that has not happened', () => {
  const ctx = { homeId: KILLED.teams.home.id, awayId: KILLED.teams.away.id };
  const st = stints(KILLED.events, ctx);
  const early = st.filter(s => s.endedBy === 'goal');
  assert.ok(early.length, 'this fixture no longer contains a penalty killed by a goal');

  // ⭐ THE TWO NUMBERS MUST DIFFER, OR THIS TEST PROVES NOTHING. Two mechanisms
  // and one observable is the shape that has fooled this project before: if
  // assessed and served happened to agree, both implementations would pass.
  const s = early.reduce((a, b) =>
    (a.start + a.min * 60 - a.end) > (b.start + b.min * 60 - b.end) ? a : b);
  const cut = (s.start + s.min * 60) - s.end;
  assert.ok(cut > 60, `the gap is only ${cut}s — too small to tell the two clocks apart`);

  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = KILLED.events.filter(e => !SKIP.has(e.type));
  const at = EV.find(e => e.s >= s.start && e.s < s.end);
  assert.ok(at, 'no frame the replay shows falls inside the penalty');

  const assessedLeft = (s.start + s.min * 60) - at.s;
  const servedLeft = s.end - at.s;
  assert.notEqual(assessedLeft, servedLeft);

  const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  /* ⭐ ASKED OF THE PAGE, NOT OF THE SOURCE TEXT. This block used to pull
     `function drawBoxes(secs){…}` out of the bundle with a regex and match the
     arithmetic inside it — which is finding 5 of §0.00-a exactly: *a test
     anchored on a source file breaks on a move while the page is unchanged*. It
     did break, on a signature change that altered nothing a viewer sees. What
     the claim is actually about is the string in the seat, and the fixture is
     chosen so the two candidate strings CANNOT COINCIDE (the `cut > 60` guard
     above), so reading the rendered clock decides between them outright. */
  const a = boot(KILLED, {});
  const scrub = a.$('scrub');
  const k = EV.indexOf(at);
  scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
  const seat = a.$(s.team === KILLED.teams.away.id ? 'penA' : 'penH').innerHTML;
  assert.ok(seat.includes(mmss(assessedLeft)),
    `the seat reads ${JSON.stringify(seat)} and not the assessed ${mmss(assessedLeft)}`);
  assert.ok(!seat.includes(mmss(servedLeft)),
    `the seat is counting down to the SERVED end (${mmss(servedLeft)}), which `
    + `announces the goal that ends it ${cut}s early`);

  // AND THE SEAT STILL EMPTIES ON THE ICE'S SCHEDULE — `occupants` uses the true
  // end, so the player vanishes when the goal kills it, exactly as in a rink.
  assert.equal(occupants(st, s.end - 1, s.team).some(x => x.player === s.player), true);
  assert.equal(occupants(st, s.end, s.team).some(x => x.player === s.player), false,
    'the player is still in the box after the goal that released him');
});

/**
 * ⭐ TWO SEATS AND A COUNT, because six is the real maximum and one is the case.
 *
 * Measured over 40 published games, at frames the replay actually shows:
 * empty 82.3%, one 15.9%, two 1.1%, three or more 0.7%, six once. Two seats
 * cover 99.3% and are what a rink's scoreboard has. Kevin chose the `+N`.
 */
test('the scoreboard seats two and counts the rest', () => {
  const a = boot();
  assert.equal(a.$('penA').innerHTML, '', 'somebody is in the box before the game starts');

  assert.match(app, /const SEATS ?= ?2/, 'the seat count moved and this test did not');
  const src = DRAW;
  assert.match(src, /slice\(0, ?SEATS\)/, 'every occupant is rendered — six names in a scoreboard');
  assert.match(src, /men\.length ?> ?SEATS/, 'nothing counts the occupants beyond the seats');
  assert.match(src, /\+\$\{men\.length ?- ?SEATS\}/, 'the overflow is not counted, so it is hidden');

  // ⚠️ THIS ASSERTED `:empty{display:none}` FOR ONE COMMIT. Collapsing when empty
  // is what made the board resize the moment somebody went off — Kevin reported
  // it the same day. The seat is held open now; the claim that replaced this one
  // lives in "the seat is reserved and the columns align at the top".
  assert.doesNotMatch(PAGE_CSS, /#rg \.pens:empty\{display:none\}/,
    'the block collapses when empty again, which is the resize that was reported');
  /* ⭐ DELETED BEATS PARKED. This required `#rg .pboxes{display:none}` to still be
     in the stylesheet — the old penalty band under the ice, parked since
     `b22156b` moved penalties onto the scoreboard at Kevin's word: *"the penalty
     boxes under the ice are (now) rather wasted space... let's display penalties
     on the scoreboard, with the offending party identified under the applicable
     team."* The band was deleted on 2026-09-15, so the park rule went with it and
     asserting the rule would now fail for the right reason in the wrong
     direction. The claim that replaces it is stronger: a parked row comes back by
     one changed selector, a deleted one cannot come back at all. */
  assert.doesNotMatch(app, /class="[^"]*\bpboxes\b/,
    'the old penalty-box row is back under the ice — penalties belong on the scoreboard');
  assert.doesNotMatch(PAGE_CSS, /\.pboxes/,
    'the deleted row has rules again');
});

/**
 * ⭐ THE LEAGUE'S WORD, NEVER A DE-HYPHENATION.
 *
 * `whistle.js` paid for this: `String(rsn).replace(/-/g,' ')` shipped for weeks
 * and rendered "Goalie Stopped After Sog" into every heading.
 */
test('a penalty descriptor is looked up, never inflected', () => {
  assert.equal(penName('delaying-game-puck-over-glass'), 'Delay of game — puck over the glass');
  assert.equal(penName('interference-goalkeeper'), 'Goaltender interference');

  // ⭐ AN UNSEEN KEY COMES BACK RAW. The fallback is the honest branch: visible
  // and fixable beats invented and invisible.
  assert.equal(penName('spearing-with-intent-to-injure'), 'spearing-with-intent-to-injure');
  assert.equal(penName(''), '');
  assert.equal(penName(null), '');

  /* AND THE RENDERER USES IT — asked of the SEAT, because the page can answer it.
     The reference game's first penalty is `tripping`, whose looked-up words and
     whose raw key differ in case, so the two candidates cannot coincide. */
  const a = boot();
  const scrub = a.$('scrub');
  scrub.value = '3'; scrub.oninput({ target: { value: '3' } });
  const seat = a.$('penA').innerHTML + a.$('penH').innerHTML;
  assert.ok(seat.includes(penName('tripping')),
    `the seat reads ${JSON.stringify(seat)} — the descriptor is not being looked up`);
  assert.ok(!seat.includes('>tripping<'), 'the raw feed key is being rendered directly');

  // ⚠️ THE DURATION IS NOT SAID TWICE. The clock beside the name already reads
  // 4:00; "High-sticking (double minor)" repeats it in words.
  for (const [key, words] of Object.entries(PEN))
    if (/double-minor|-major$/.test(key))
      assert.doesNotMatch(words, /minor|major|double/i,
        `${key} says its length in words as well as on the clock beside it`);
});

const SHORTY = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2025030223.json', import.meta.url), 'utf8'));
/* ⚠️⚠️ THIS WAS `2023020207`, AND THE FIXTURE WAS LYING. That file was a copy of an
   older extractor's output with no penalty durations, so `stints()` computed an empty
   box and its 4-on-5 Toronto goal looked like the pulled-goalie trap this test needs.
   It is not: with the correct extract there is a Toronto player in the box and the goal
   is genuinely short-handed. **The assertion below was demanding the code give the
   WRONG answer, and it passed for as long as the data was wrong.**

   ⭐ SO THE TRAP CASE IS A GAME THAT ACTUALLY CONTAINS ONE, and it contains TWO — both
   at `sit=0651`, the away goalie pulled for a sixth skater while the home team scores
   with five. Measured over the 46-game sample that settled this: 247 goals in play, 17
   with fewer skaters, 7 genuinely short-handed and **10 of them this trap** — so it is
   the commoner of the two, which is exactly why a badge driven by `sit` alone would be
   wrong more often than right. */
const PULLED = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2024020543.json', import.meta.url), 'utf8'));

/** The rule the page uses, restated here from the two facts it reads. */
function shortHandedIn(g, e) {
  const ctx = { homeId: g.teams.home.id, awayId: g.teams.away.id };
  const st = stints(g.events, ctx);
  const home = e.own === ctx.homeId;
  const mine = +e.sit[home ? 2 : 1], theirs = +e.sit[home ? 1 : 2];
  return mine < theirs && st.some(s => s.team === e.own && s.start <= e.s && s.end >= e.s);
}
const goalsIn = g => g.events.filter(e => e.type === 'goal' && e.pt !== 'SO' && e.sit && e.sit.length === 4);
const fewerIn = (g, e) => {
  const home = e.own === g.teams.home.id;
  return +e.sit[home ? 2 : 1] < +e.sit[home ? 1 : 2];
};

/**
 * ⭐ A SHORT-HANDED GOAL IS NOT "FEWER SKATERS", AND THE PAIR IS THE POINT.
 *
 * Over 40 published games: 246 goals in play, 26 with fewer skaters, and only
 * SIX with anybody in the scoring team's own box. The other twenty are the
 * opposite situation — the other side pulled its goaltender — so a badge driven
 * by `sit` alone would read SHORT-HANDED on an empty-net goal, four times in
 * five, backwards.
 *
 * Neither fixture proves this alone: one shows the tag firing, the other shows
 * it staying silent on the case that looks identical to the naive rule.
 *
 * ⚠️ RE-DERIVED 2026-09-01 AGAINST 46 PUBLISHED GAMES, because the numbers above came
 * from a set of 40 and the fixture that was supposed to prove the silent half turned
 * out to be a stale extract (see the `PULLED` binding). The shape holds and the
 * conclusion is unchanged: 247 goals in play, 17 with fewer skaters, 7 short-handed
 * and 10 the pulled-goalie trap — so the naive rule is wrong on the MAJORITY, not
 * merely four times in five.
 */
test('the short-handed tag fires on a short-handed goal and not on a pulled goaltender', () => {
  const sh = goalsIn(SHORTY).filter(e => shortHandedIn(SHORTY, e));
  assert.equal(sh.length, 1, 'this fixture no longer contains exactly one short-handed goal');

  const trap = goalsIn(PULLED).filter(e => fewerIn(PULLED, e));
  assert.ok(trap.length >= 2,
    `2024020543 now holds ${trap.length} fewer-skaters goal(s) — the trap case needs at least two, `
    + 'so a single mislabelled event cannot be the whole claim');
  for (const e of trap)
    assert.equal(shortHandedIn(PULLED, e), false,
      `a goal with fewer skaters and nobody in the box was called short-handed — sit ${e.sit}`);

  // ⭐ AND THE PAGE MUST NAME IT IN BOTH PLACES A GOAL IS ANNOUNCED. A located
  // goal is announced by its LABEL ON THE ICE; only an unplaced one falls
  // through to the caption pill. A tag in the caption alone never appears on a
  // located goal, which is most of them.
  // The label's words are `playSaid`'s since 2026-09-17, so the question moved
  // there; that the tag is DRAWN on a real short-handed goal is walked in
  // render-labels.test.js ("a goal on the ice reads TEAM · GOAL — scorer").
  const label = /function drawLabel\(e\)\{[\s\S]*?glab[\s\S]*?return;\}/.exec(app)[0];
  assert.match(label, /playSaid\(e\)/, 'a located goal no longer says what playSaid says');
  const said = /function playSaid\(e\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(said, /shortHanded\(e\)/, 'a located goal is never told it was short-handed');
  const cap = /function caption\(e,kind\)\{[\s\S]*?\n \/\*/.exec(app)[0];
  assert.match(cap, /shortHanded\(e\)/, 'an unplaced goal is never told it was short-handed');
  // ⛔⛔ AND THE LINE ABOVE IS A GREP, WHICH IS WHY A PLANTED DEFECT WALKED PAST IT.
  // `s916-...`/`s20260916-81` inverted `kind==='goal'` to `kind!=='goal'` in exactly
  // that function: `shortHanded(e)` is still spelled there, so this assertion — and
  // every other detector — stayed green while the tag was silently unreachable.
  // A check that cannot tell code from the WORDS ABOUT the code is not a check about
  // code. The behavioural version is the test below.

  // AND THE TEST FOR IT ASKS BOTH QUESTIONS.
  const fn = /function shortHanded\(e\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(fn, /mine<theirs/, 'the skater comparison is gone');
  assert.match(fn, /PBOX\.some/, 'nothing checks the scoring team actually had somebody in the box');
});

/**
 * ⭐ A BENCH MINOR FILLS A SEAT AND HAS NO NAME TO PUT IN IT.
 *
 * Kevin: "we definitely need to capture that on the scoreboard, just without an
 * identified person." 13 of 347 penalties across 40 games carry `sev: 'BEN'`
 * and no `actor` — ten for too many men — and `box.js` dropped every one of
 * them, so the box was empty while the team was genuinely short.
 */
test('a bench minor gets a seat, and the condition is the severity', () => {
  const ctx = { homeId: SHORTY.teams.home.id, awayId: SHORTY.teams.away.id };
  const st = stints(SHORTY.events, ctx);
  const bench = st.filter(s => s.player == null);
  assert.equal(bench.length, 1, 'this fixture no longer carries a bench minor');
  assert.equal(bench[0].sev, 'BEN');
  assert.ok(bench[0].end > bench[0].start, 'the bench minor serves no time');

  // ⭐ THE CONDITION IS `sev === 'BEN'`, NOT "the actor is missing". A future
  // penalty type that also loses its actor would be admitted by accident under
  // the weaker rule, and it would arrive with no name and no explanation.
  const src = readFileSync(new URL('../src/lib/box.js', import.meta.url), 'utf8');
  assert.match(src, /e\.sev === 'BEN'/, 'the admission test is not the severity');
  assert.doesNotMatch(src, /if \(e\.type === 'penalty' && e\.min && e\.actor != null/,
    'the old actor-only admission test is back, and bench minors are dropped again');

  // And the page says what it is rather than showing a placeholder.
  assert.match(DRAW, /s\.player==null\?'Bench'/, 'an unnamed server renders as an em-dash, not as a bench minor');
});

/**
 * ⭐ THE BOARD DOES NOT RESIZE WHEN SOMEBODY GOES OFF.
 *
 * Kevin: "the scoreboard adjusts heights when the penalty is being displayed,
 * that shouldn't happen." Measured over one heavily-penalised game it took four
 * heights — 117 / 161 / 195 / 213 at 390 — and the rink stepped down each time.
 */
test('the seat is reserved and the columns align at the top', () => {
  // A seat held open covers 0 -> 1, which is 98.2% of frames archive-wide.
  assert.match(PAGE_CSS, /#rg \.pens\{[^}]*min-height:\d+px/,
    'nothing reserves the seat, so the board grows the moment somebody goes off');
  assert.doesNotMatch(PAGE_CSS, /#rg \.pens:empty\{display:none\}/,
    'the block collapses when empty again, which is the resize Kevin reported');

  // ⚠️ AND THE COLUMNS ALIGN AT THE TOP. `align-items:center` centres each team
  // column, so one side having a penalty and the other not put the two badges at
  // different heights — "notice how VGK is shifted above WSH too". Reserving a
  // seat does not fix that case; top alignment does, at any number of rows.
  assert.match(PAGE_CSS, /#rg \.board\{align-items:start\}/,
    'the team columns are centred again, so their badges drift apart when one side is penalised');
  assert.match(PAGE_CSS, /#rg \.mid\{align-self:center\}/,
    'the clock lost its centred position when the columns went top-aligned');

  // ⚠️ AND THE NAMED GRID AREA ONLY EXISTS INSIDE THE QUERY THAT DEFINES IT.
  // `grid-area:game` on the wide board — which has no `grid-template-areas` —
  // dropped the game line to 178px down a 159px card.
  //
  // ⚠️ AND THE SLICE HAD TO BE THE RULES THAT APPLY, NOT THE TEXT BEFORE THE
  // FIRST QUERY. This read `split('@media(max-width:520px)')[0]`, which drops
  // every rule written AFTER the query — including the one under test — so the
  // mutation that put `grid-area:game` back on the wide board changed nothing
  // and the suite stayed green. The narrow blocks are removed instead.
  const wide = (() => {
    let out = '', depth = 0, i = 0;
    while (i < PAGE_CSS.length) {
      const m = PAGE_CSS.indexOf('@media(max-width:', i);
      if (m < 0) { out += PAGE_CSS.slice(i); break; }
      out += PAGE_CSS.slice(i, m);
      let j = PAGE_CSS.indexOf('{', m);
      depth = 1; j++;
      while (j < PAGE_CSS.length && depth) { if (PAGE_CSS[j] === '{') depth++;
        else if (PAGE_CSS[j] === '}') depth--; j++; }
      i = j;
    }
    return out;
  })();
  assert.ok(wide.includes('.board .foot{'), 'the slice lost the rule it is about');
  assert.doesNotMatch(wide, /\.board \.foot\{[^}]*grid-area:game/,
    'the game line claims a grid area the wide board does not define');
});

/**
 * ⭐⭐ THE INTERRUPTED COUNTDOWN — B6, and the hazard is timing rather than words.
 *
 * A penalty that runs out teaches itself: 0:07, then the seat is empty. One that
 * a goal kills does not — the clock reads 1:04 and the man is gone, which reads
 * as a bug and is Rule 16.2. Measured over 294 published games and 2,230 stints:
 * 343 end on a goal, 15.4%, with a median of 62 seconds still showing.
 *
 * ⛔⛔ THE DANGEROUS FAILURE IS ONE FRAME EARLY, NOT ONE FRAME LATE. The comment
 * above `SEATS` refuses to count the clock down to the served end because that
 * announces a goal before it happens; a note explaining the release is the same
 * hazard wearing words. So the second test below is the one that matters, and it
 * is asked of EVERY frame in the game rather than of the frame before.
 */
test('a penalty a goal ended says so, on the goal\'s own frame', () => {
  const ctx = { homeId: rich.teams.home.id, awayId: rich.teams.away.id };
  const killed = stints(rich.events, ctx).filter(s => s.endedBy === 'goal');
  assert.ok(killed.length, 'the reference game no longer contains a penalty killed by a goal');

  const a = boot();
  const scrub = a.$('scrub'), N = +scrub.max;
  const at = k => { scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } }); };

  // ⭐ THE EXPECTED VALUES COME FROM THE REDUCER, NOT FROM THE RENDERER. `stints`
  // is a different path to the same fact, which is what stops this being a mirror.
  const s = killed[0];
  const box = s.team === rich.teams.away.id ? 'penA' : 'penH';
  const scorer = s.team === rich.teams.away.id ? rich.teams.home.ab : rich.teams.away.ab;
  const unserved = (s.start + s.min * 60) - s.end;

  let found = null;
  for (let k = 0; k <= N; k++) { at(k); if (a.$(box).innerHTML.includes('pout')) { found = k; break; } }
  assert.ok(found != null, 'no frame in the whole game explains a penalty that a goal ended');

  const seat = a.$(box).innerHTML;
  assert.ok(seat.includes(`${scorer} scored`),
    `the seat reads ${JSON.stringify(seat)} — it does not name the club that scored`);
  // ⚠️ AND IT IS NOT THE PENALISED CLUB. A chip on this site once named the club
  // opposite its own verb's subject; the scorer is the OTHER team by construction.
  const penalised = s.team === rich.teams.away.id ? rich.teams.away.ab : rich.teams.home.ab;
  assert.ok(!seat.includes(`${penalised} scored`),
    'the note says the penalised team scored on its own power play');
  assert.ok(seat.includes(mmssOf(unserved)),
    `the unserved time ${mmssOf(unserved)} is not shown, so nothing says what he did not serve`);
});

test('⛔ and it can never appear before the goal that causes it', () => {
  const ctx = { homeId: rich.teams.home.id, awayId: rich.teams.away.id };
  const killed = stints(rich.events, ctx).filter(s => s.endedBy === 'goal');
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = rich.events.filter(e => !SKIP.has(e.type));

  const a = boot();
  const scrub = a.$('scrub'), N = +scrub.max;
  const at = k => { scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } }); };

  const notes = [];
  for (let k = 0; k <= N; k++) {
    at(k);
    if ((a.$('penA').innerHTML + a.$('penH').innerHTML).includes('pout')) notes.push(k);
  }
  assert.ok(notes.length, 'the note never renders at all, so this proves nothing');

  for (const k of notes) {
    const e = EV[k];
    assert.equal(e.type, 'goal',
      `the release note is on frame ${k}, which is a ${e.type} — a viewer is being told `
      + 'a penalty ended before anything on screen says a goal was scored');
    assert.ok(killed.some(s => s.end === e.s),
      `frame ${k} explains a release that box.js did not make`);
  }
  // AND EVERY GOAL-ENDED PENALTY IS ACCOUNTED FOR, or the note is decoration.
  assert.equal(notes.length, killed.length,
    `${killed.length} penalties ended on a goal and ${notes.length} frames say so`);
});

test('a penalty that simply ran out is left alone', () => {
  /* THE CONTROL. The note exists because the expiring case teaches itself; if it
     rendered there too it would be noise on 84.5% of endings, and the test above
     would still be green. */
  const ctx = { homeId: rich.teams.home.id, awayId: rich.teams.away.id };
  const expired = stints(rich.events, ctx).filter(s => s.endedBy !== 'goal');
  assert.ok(expired.length, 'no penalty in the reference game runs its full time');

  const a = boot();
  const scrub = a.$('scrub'), N = +scrub.max;
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = rich.events.filter(e => !SKIP.has(e.type));
  for (let k = 0; k <= N; k++) {
    if (!expired.some(s => EV[k] && EV[k].s === s.end)) continue;
    scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
    assert.ok(!(a.$('penA').innerHTML + a.$('penH').innerHTML).includes('pout'),
      `frame ${k} explains a penalty that nobody interrupted`);
  }
});

test('the explained seat is exactly as tall as an occupied one', () => {
  /* ⚠️ THE LAYOUT BELOW THE RINK STOPPED MOVING ON 2026-09-07 and a note that
     adds a third line for one frame puts the jitter straight back. The grid has
     two rows and the released seat uses the same three cells, so the claim is
     that NO NEW GRID ROW EXISTS rather than that the pixels match — the fake DOM
     has no layout, and this is the honest half it can check. */
  assert.match(PAGE_CSS, /#rg \.pf\{grid-column:1\/-1;grid-row:2\}/,
    'the infraction line moved off row 2 and the seat height is no longer fixed');
  /* Scoped to the seat's own selectors: `.lxw` legitimately uses row 3 in the
     layer box, and a stylesheet-wide scan would report it forever. */
  const seatRules = PAGE_CSS.split('\n').filter(l => /#rg \.p(en|w|t|f|out|more|bench)\b/.test(l)).join('\n');
  assert.ok(seatRules.length > 100, 'the seat rules are not being read at all');
  assert.doesNotMatch(seatRules, /grid-row:\s*[3-9]/,
    'a third grid row exists in the seat, which is a one-frame jump in the board');
  assert.match(DRAW, /class="pen pout"/, 'the released seat is not marked, so CSS cannot reach it');
  assert.doesNotMatch(DRAW, /class="pen pout"[\s\S]{0,200}class="px"/,
    'the released seat renders a fourth cell the grid has no row for');
});

/**
 * ⭐⭐ THE CASE NO FIXTURE WE OWN CONTAINS: a penalty that expires on the exact
 * second a goal is scored.
 *
 * ⚠️ FOUND BY MUTATION, NOT BY THOUGHT. Dropping `endedBy === 'goal'` from the
 * renderer's condition — leaving only "a stint ends at this second" — passed
 * every test above, because in the reference game no expiry lands on a goal. The
 * mutation is not hypothetical: `tools/box-witness.mjs` puts this collision at
 * 3 of 176 power-play goals across 150 published games, and it is the whole of
 * the disagreement between our box and the league's own code.
 *
 * ⭐ SO THE GAME IS CONSTRUCTED RATHER THAN FOUND, which is §0.00-a finding 3 in
 * its plainest form: *a function you can call takes any argument; a page you must
 * boot takes only the game it was given.* The penalty belongs to the team that
 * SCORES, so `box.js` correctly leaves `endedBy: 'time'` — a team does not get a
 * man back for scoring short-handed — and the seat must empty in silence.
 */
test('a penalty that expires on a goal\'s own second is still not "ended by" it', () => {
  const g = JSON.parse(JSON.stringify(rich));
  const goal = g.events.find(e => e.type === 'goal' && e.s > 400);
  assert.ok(goal, 'the reference game has no goal late enough to hang a penalty on');

  const scorer = goal.own;                       // the penalty goes on the SCORING team
  const start = goal.s - 120;
  g.events.push({ type: 'penalty', s: start, per: goal.per, own: scorer,
                  actor: goal.actor, min: 2, sev: 'MIN', pen: 'hooking',
                  x: 0, y: 0 });
  g.events.sort((a, b) => a.s - b.s);

  const ctx = { homeId: g.teams.home.id, awayId: g.teams.away.id };
  const planted = stints(g.events, ctx).find(s => s.start === start);
  assert.ok(planted, 'the planted penalty never reached the box');
  assert.equal(planted.end, goal.s, 'the planted penalty does not expire on the goal');
  assert.equal(planted.endedBy, 'time',
    'box.js released a man for scoring short-handed, which is not a rule');

  /* ⚠️ SCOPED TO THE PLANTED SEAT. A first draft scanned both boxes across the
     whole game and went red on the LEGITIMATE note 400 seconds earlier — a test
     that reports the feature working as a defect. The question is about one box
     on one frame: the scoring team's, at the goal. */
  const a = boot(g, {});
  const scrub = a.$('scrub'), N = +scrub.max;
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = g.events.filter(e => !SKIP.has(e.type));
  const k = EV.indexOf(goal);
  assert.ok(k > 0 && k <= N, 'the goal is not a frame the replay plays');
  scrub.value = String(k); scrub.oninput({ target: { value: scrub.value } });
  const html = a.$(scorer === g.teams.away.id ? 'penA' : 'penH').innerHTML;
  const said = html.includes('pout') ? html : null;
  assert.equal(said, null,
    'the page says a goal ended a penalty that simply ran out beside it — the '
    + 'renderer is keying on "a stint ends here" rather than on box.js\'s own '
    + `endedBy. It rendered: ${JSON.stringify(said)}`);
});

/**
 * ⛔⛔ THE UNPLACED GOAL'S TAG, EXERCISED RATHER THAN GREPPED.
 *
 * A located goal is announced by its label on the ice; only a goal the feed did
 * not place falls through to `caption(e,'goal')` and the pill. That branch had
 * no behavioural test, and a planted inversion of its `kind==='goal'` guard
 * escaped every detector in the survivorship experiment — the assertion above
 * matched the function's TEXT and could not see the condition around it.
 *
 * ⭐ THE COORDINATES ARE REMOVED ON PURPOSE, AND THAT IS NOT AN INVENTED CASE.
 * `place()` returning false IS the branch's entry condition — the feed omits
 * coordinates on some goals and the page has this path because of it. Taking a
 * real short-handed goal and dropping `x`/`y` produces exactly the input the
 * branch exists for, without inventing a strength, a penalty box or a scorer.
 * (0 of the 49 goals across the 8 extract fixtures are unplaced, which is why
 * the condition has to be made rather than found — and is itself worth knowing
 * about how rare the branch is.)
 */
function unplace(game, pick) {
  const copy = JSON.parse(JSON.stringify(game));
  const e = copy.events.find(pick);
  assert.ok(e, 'the fixture no longer holds the event this test is about');
  e.x = null; e.y = null;
  return { game: copy, at: e };
}

test('⭐ an unplaced SHORT-HANDED goal still says so, and an unplaced even-strength one does not', () => {
  // ⚠️ THE PILL IS WRITTEN ON A MOMENT, NOT ON A SCRUB (`how==='play'||'jump'` in
  // render), so the replay is STEPPED — the same way render-transport.test.js
  // drives it — and `writes` counts the assignment rather than a changed string.
  const short = e => e.type === 'goal' && e.s === 2159;   // CAR, sit 1451, short-handed
  const even  = e => e.type === 'goal' && e.s === 2828;   // CAR, sit 1551, even strength

  for (const [name, pick, want] of [['short-handed', short, true], ['even strength', even, false]]) {
    const { game } = unplace(SHORTY, pick);
    const a = boot(game, null);
    const cap = a.$('caption');
    const said = [];
    let seen = cap.writes;
    a.$('scrub').oninput({ target: { value: '0' } });
    for (let k = 0; k < +a.$('scrub').max; k++) {
      a.$('fwd').click();
      if (cap.writes > seen) { seen = cap.writes; said.push(cap.innerHTML); }
    }
    const goals = said.filter(c => /GOAL/.test(c));
    assert.equal(goals.length, 1,
      `${goals.length} goal pills for the ${name} goal — the unplaced branch was not entered exactly once, `
      + 'so this test measured nothing');
    assert.equal(/short-handed/.test(goals[0]), want,
      `the ${name} goal's pill reads "${goals[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}"`);
  }
});

test('⭐ …and no pill that is not a goal ever carries the tag', () => {
  // The other half of the inverted guard: with `kind!=='goal'` the tag would be
  // offered to every penalty and slot caption instead. Nothing else may wear it.
  const a = boot(SHORTY, null);
  const cap = a.$('caption');
  const wrong = [];
  let seen = cap.writes;
  a.$('scrub').oninput({ target: { value: '0' } });
  for (let k = 0; k < +a.$('scrub').max; k++) {
    a.$('fwd').click();
    if (cap.writes > seen) {
      seen = cap.writes;
      if (/short-handed/.test(cap.innerHTML) && !/GOAL/.test(cap.innerHTML))
        wrong.push(cap.innerHTML.replace(/<[^>]*>/g, ' ').trim().slice(0, 60));
    }
  }
  assert.deepEqual(wrong, [], 'a pill that is not a goal is wearing the short-handed tag');
});

/**
 * ⛔⛔ THE PROSE TABLE AND THE VETTED LIST MUST NAME THE SAME PENALTIES.
 *
 * Two lists in two languages describe one set: `PEN` in `src/lib/penalties.js`
 * turns a descriptor into words, and `KNOWN_PENALTIES` in `builders/extract.py`
 * is what the archive-wide vocabulary alarm forgives. Nothing enforced that they
 * agree until 2026-09-20, and each way they can disagree is a real defect with
 * no symptom:
 *
 *   - **vetted but no prose** — the alarm stays silent and the page renders the
 *     raw `delaying-game-face-off-violation` at a reader. `extract.py` says it
 *     out loud: *"Raw on screen is survivable; unnoticed is not."*
 *   - **prose but not vetted** — the descriptor renders beautifully and is
 *     HIDDEN from the drift report, which is exactly the trap `penalties.js`
 *     warns about when it says adding a plausible `spearing` would hide it.
 *
 * ⭐ THIS IS NOT A COUNT. A count passes when one is added to each side and the
 * two additions are different words — the failure a list-length check invites.
 * The sets are compared by name, in both directions.
 *
 * Found by the four preseason descriptors that halted the ingest on 2026-09-19
 * and 2026-09-20: the lists were in sync then (29 and 29), so this is written
 * against a passing state rather than a bug — and proven able to fail by
 * removing one name from either side.
 */
test('⛔ every vetted penalty has prose, and every prose entry is vetted', () => {
  const py = readFileSync(new URL('../builders/extract.py', import.meta.url), 'utf8');
  const block = /KNOWN_PENALTIES = \{([\s\S]*?)\n\}/.exec(py);
  assert.ok(block, 'KNOWN_PENALTIES is gone from extract.py — this check has lost half its subject');
  // ⚠️ COMMENTS OUT FIRST. The block carries prose explaining each arrival, and a
  // scanner that reads the explanation as data is a trap this repo has hit six
  // times; `# "spearing"` in a comment must not read as a vetted value.
  const vetted = new Set([...block[1].replace(/#[^\n]*/g, ' ').matchAll(/"([a-z0-9-]+)"/g)].map(m => m[1]));
  const prose = new Set(Object.keys(PEN));

  assert.ok(vetted.size > 25, `only ${vetted.size} vetted penalties parsed — the scan is not working`);
  const noProse = [...vetted].filter(k => !prose.has(k)).sort();
  const notVetted = [...prose].filter(k => !vetted.has(k)).sort();

  assert.deepEqual(noProse, [],
    `vetted in extract.py with no prose in penalties.js, so the vocabulary alarm forgives them `
    + `and the page shows a reader the raw descriptor: ${noProse.join(', ')}`);
  assert.deepEqual(notVetted, [],
    `given prose in penalties.js but not vetted in extract.py, so they render nicely and are `
    + `HIDDEN from the drift report — the trap that table's own comment names: ${notVetted.join(', ')}`);
});

/**
 * ⭐⭐ A DOUBLE MINOR IS NAMED WHERE IT HAPPENS — 2026-09-20.
 *
 * Kevin: *"a novice won't know what a 'double minor' is unless we explain it…
 * we should say it's a double minor at occurrence and move on."*
 *
 * ⛔ WHAT MADE IT NECESSARY. `penalties.js` deliberately drops the phrase from
 * the NAME — `high-sticking-double-minor` renders "High-sticking" — because "the
 * clock beside the name already says 4:00". The box chip renders `left`, the
 * time REMAINING, so it says 4:00 for one instant; scrub into the middle of one
 * and the page reads "High-sticking 3:12" with nothing saying this penalty was
 * twice the usual length. **The assessed duration reached no surface at all.**
 *
 * ⭐ BOTH DIRECTIONS, OR IT PROVES NOTHING. "The tag appears" is satisfied by a
 * page that tags every penalty; "it is absent" by one that tags none. The
 * reference game carries one four-minute penalty and seven two-minute ones, so
 * the pair is real rather than constructed.
 */
test('⭐ the caption says "double minor" on a four-minute penalty, and only there', () => {
  const EV = playable(rich.events);
  const pens = EV.map((e, k) => ({ e, k })).filter(x => x.e.type === 'penalty');
  const four = pens.filter(x => x.e.min === 4);
  const two = pens.filter(x => x.e.min === 2);
  assert.ok(four.length >= 1, 'the reference game has no four-minute penalty — this cannot fail');
  assert.ok(two.length >= 2, 'the reference game has too few ordinary penalties to contrast with');

  const a = boot();
  const captionAt = k => {
    // STEPPED ONTO, NOT DRAGGED TO: `oninput` is a scrub and captions are silent
    // on one. `fwd` is the control a reader actually presses.
    a.$('scrub').oninput({ target: { value: String(k - 1) } });
    a.$('fwd').click();
    return String(a.$('caption').innerHTML);
  };

  for (const x of four) {
    const h = captionAt(x.k);
    assert.match(h, /⛔ Penalty/, `frame ${x.k} is a penalty and the caption said something else: ${h}`);
    assert.match(h, /class="dmn">double minor</,
      `frame ${x.k} is a ${x.e.min}-minute penalty and the caption never says so: ${h}`);
  }
  for (const x of two) {
    const h = captionAt(x.k);
    assert.doesNotMatch(h, /double minor/,
      `frame ${x.k} is an ordinary ${x.e.min}-minute penalty and the caption called it a double minor: ${h}`);
  }
});

/**
 * ⛔⛔ THE DURATION AND THE DESCRIPTOR MUST AGREE, AND THE CAPTION TRUSTS THE
 * DURATION.
 *
 * `min === 4` is the trigger, not `pen.endsWith('-double-minor')`: four minutes
 * IS two minors by rule, and a duration cannot drift when the league invents a
 * spelling — which it just did. `roughing-double-minor` halted the nightly
 * ingest on 2026-09-19 and appears in none of the 4,553 games archived before
 * it. Sampled 60 published games / 464 penalties: every four-minute penalty
 * carried a `-double-minor` key and every such key was four minutes.
 *
 * ⚠️ THAT SAMPLE HELD ONLY FIVE DOUBLE MINORS, so this pins the agreement over
 * the fixtures rather than trusting it. If the two ever part company that is a
 * finding about the feed, not a test to relax.
 */
test('⛔ every four-minute penalty is a double minor by name, and every double minor is four minutes', () => {
  const files = readdirSync(new URL('fixtures/extracts/', import.meta.url)).filter(f => f.endsWith('.json'));
  let seen = 0;
  for (const f of [...files.map(f => `fixtures/extracts/${f}`), '../data/rich.json']) {
    const g = JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
    for (const e of g.events || []) {
      if (e.type !== 'penalty' || e.pen == null || e.min == null) continue;
      const named = e.pen.includes('double-minor');
      if (named || e.min === 4) seen++;
      assert.equal(e.min === 4, named,
        `${f}: "${e.pen}" is ${e.min} minutes — the descriptor and the duration disagree, `
        + 'so the caption trigger and the penalty name are telling a reader different things');
    }
  }
  assert.ok(seen >= 3, `only ${seen} double minor(s) across the fixtures — this check has too little to bite on`);
});
