import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stints, occupants } from '../src/lib/box.js';
import { PEN, penName } from '../src/lib/penalties.js';
import { app, PAGE_CSS, boot } from './helpers/page.js';

const KILLED = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2025030214.json', import.meta.url), 'utf8'));

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
  // What the page must print, and what it must never print.
  assert.ok(app.includes('const SEATS'), 'the renderer this test describes is gone');
  const src = /function drawBoxes\(secs\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(src, /s\.start\s*\+\s*s\.min\s*\*\s*60\s*\)\s*-\s*secs/,
    `the clock is not the assessed one — at this fixture's frame it would read ` +
    `${mmss(servedLeft)} instead of ${mmss(assessedLeft)}, ${cut}s before the goal`);
  assert.doesNotMatch(src, /s\.end\s*-\s*secs/,
    'the clock counts down to the SERVED end, which announces the goal that ends it');

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

  const src = /function drawBoxes\(secs\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(app, /const SEATS ?= ?2/, 'the seat count moved and this test did not');
  assert.match(src, /slice\(0, ?SEATS\)/, 'every occupant is rendered — six names in a scoreboard');
  assert.match(src, /men\.length ?> ?SEATS/, 'nothing counts the occupants beyond the seats');
  assert.match(src, /\+\$\{men\.length ?- ?SEATS\}/, 'the overflow is not counted, so it is hidden');

  // ⚠️ THIS ASSERTED `:empty{display:none}` FOR ONE COMMIT. Collapsing when empty
  // is what made the board resize the moment somebody went off — Kevin reported
  // it the same day. The seat is held open now; the claim that replaced this one
  // lives in "the seat is reserved and the columns align at the top".
  assert.doesNotMatch(PAGE_CSS, /#rg \.pens:empty\{display:none\}/,
    'the block collapses when empty again, which is the resize that was reported');
  assert.match(PAGE_CSS, /#rg \.pboxes\{display:none\}/, 'the old penalty-box row is back under the ice');
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

  // AND THE RENDERER USES IT. A table nothing calls is a table that rots.
  const src = /function drawBoxes\(secs\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(src, /penName\(s\.pen\)/, 'the raw feed key is being rendered directly');

  // ⚠️ THE DURATION IS NOT SAID TWICE. The clock beside the name already reads
  // 4:00; "High-sticking (double minor)" repeats it in words.
  for (const [key, words] of Object.entries(PEN))
    if (/double-minor|-major$/.test(key))
      assert.doesNotMatch(words, /minor|major|double/i,
        `${key} says its length in words as well as on the clock beside it`);
});

const SHORTY = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2025030223.json', import.meta.url), 'utf8'));
const PULLED = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2023020207.json', import.meta.url), 'utf8'));

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
 */
test('the short-handed tag fires on a short-handed goal and not on a pulled goaltender', () => {
  const sh = goalsIn(SHORTY).filter(e => shortHandedIn(SHORTY, e));
  assert.equal(sh.length, 1, 'this fixture no longer contains exactly one short-handed goal');

  const trap = goalsIn(PULLED).filter(e => fewerIn(PULLED, e));
  assert.ok(trap.length, '2023020207 no longer contains a fewer-skaters goal — the trap case is gone');
  for (const e of trap)
    assert.equal(shortHandedIn(PULLED, e), false,
      `a goal with fewer skaters and nobody in the box was called short-handed — sit ${e.sit}`);

  // ⭐ AND THE PAGE MUST NAME IT IN BOTH PLACES A GOAL IS ANNOUNCED. A located
  // goal is announced by its LABEL ON THE ICE; only an unplaced one falls
  // through to the caption pill. A tag in the caption alone never appears on a
  // located goal, which is most of them.
  const label = /function drawLabel\(e\)\{[\s\S]*?glab[\s\S]*?return;\}/.exec(app)[0];
  assert.match(label, /shortHanded\(e\)/, 'a located goal is never told it was short-handed');
  const cap = /function caption\(e,kind\)\{[\s\S]*?\n \/\*/.exec(app)[0];
  assert.match(cap, /shortHanded\(e\)/, 'an unplaced goal is never told it was short-handed');

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
  const draw = /function drawBoxes\(secs\)\{[\s\S]*?\n\}/.exec(app)[0];
  assert.match(draw, /s\.player==null\?'Bench'/, 'an unnamed server renders as an em-dash, not as a bench minor');
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
