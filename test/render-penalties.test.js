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

  // The block is ABSENT when nobody is sitting — that was the whole complaint
  // about the row it replaced, which said "empty · empty" 82% of the time.
  assert.match(PAGE_CSS, /#rg \.pens:empty\{display:none\}/,
    'the penalty block holds space when the box is empty, which is what was wrong with the old one');
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
