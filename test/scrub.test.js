/**
 * The scrub track's geometry — the part of the goal ticks that can be wrong
 * without looking wrong.
 *
 * Kevin, 2026-09-18: "let's go with goal ticks only, I don't want to overcrowd
 * the scrubber area, so let's start small."
 *
 * ⭐ WHY THESE ARE UNIT TESTS AND NOT A WALK OF THE PAGE. The harness's fake DOM
 * cannot report an element's computed `left` — booting the page and reading
 * `#gticks` can count the ticks and read their labels, and that is all. A test
 * that counted five ticks and called the feature verified would be asserting a
 * narrower claim than its name, which is this repo's dominant failure mode. The
 * placement is therefore a pure function and is checked as one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goalTicks, tickLeft } from '../src/lib/scrub.js';
import { boot, PAGE_CSS } from './helpers/page.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));

test('a goal tick sits at (k+1)/n, because frame -1 is a real frame', () => {
  /* ⚠️ THE FLOOR IS THE POINT. The scrubber's range is -1 .. n-1, so its length
     is n. The obvious `k/(n-1)` is the same shape and wrong everywhere, and by
     less than a pixel — the kind of defect that ships. Both endpoints are pinned
     here because a formula can be right in the middle and wrong at the ends. */
  const evs = Array.from({ length: 10 }, (_, k) => ({ type: k === 0 || k === 9 ? 'goal' : 'hit' }));
  const t = goalTicks(evs);
  assert.deepEqual(t.map(x => x.k), [0, 9]);
  assert.equal(t[0].f, 0.1, 'the first frame is one step along a ten-step track, not zero');
  assert.equal(t[1].f, 1, 'the last frame is the end of the track');
  // and the naive form disagrees at both ends, which is what makes this a check
  assert.notEqual(t[0].f, 0 / 9);
  assert.notEqual(t[1].f, 9 / 9 - 0.0001);
});

test('only goals get a tick, and an empty list is not a crash', () => {
  assert.deepEqual(goalTicks([]), []);
  assert.deepEqual(goalTicks([{ type: 'hit' }, { type: 'faceoff' }]), []);
  assert.deepEqual(goalTicks([null, { type: 'goal' }]).map(x => x.k), [1],
    'a hole in the event list threw instead of being skipped');
});

test('⛔ the tick is placed by the INSET formula, not by a bare percentage', () => {
  /* The thumb of a native range travels `thumb/2 .. track - thumb/2`, so the
     correction is `thumb x (0.5 - f)`: zero at mid-game, half a thumb at either
     end. A bare `f x 100%` is the version that looks right and misplaces exactly
     the goals people care about — an empty-net goal sits at f ~ 1. */
  assert.match(tickLeft(0.5), /^calc\(50\.000% \+ var\(--scrub-thumb\) \* 0\.00000\)$/,
    'mid-track is not a pure percentage, so the correction has the wrong sign or scale');
  assert.match(tickLeft(0), /\+ var\(--scrub-thumb\) \* 0\.50000\)$/,
    'the start of the track is not pushed right by half a thumb');
  assert.match(tickLeft(1), /\+ var\(--scrub-thumb\) \* -0\.50000\)$/,
    'the end of the track is not pulled left by half a thumb');
  // ⭐ ONE VARIABLE, NAMED ONCE. If the thumb width ever becomes a measured fact
  // rather than a platform default, nothing but that variable changes.
  for (const f of [0, 0.25, 0.5, 0.75, 1])
    assert.equal((tickLeft(f).match(/var\(--scrub-thumb\)/g) || []).length, 1,
      'a tick reads the thumb width more than once, so the two could drift apart');
});

test('the page draws one tick per goal, each named in the board\'s own words', () => {
  /* What the fake DOM CAN see: that the strip is populated, once per goal, and
     that each carries the scoreboard's sentence rather than a second one written
     here. The count is checked against the events, not against a remembered 5. */
  const a = boot();
  const html = String(a.$('gticks').innerHTML);
  const ticks = [...html.matchAll(/<button[^>]*>/g)].length;
  const goals = rich.events.filter(e => e.type === 'goal').length;
  assert.ok(goals > 0, 'the fixture has no goals, so this proves nothing');
  assert.equal(ticks, goals, `${goals} goals in the game and ${ticks} ticks on the scrubber`);
  assert.match(html, / scored at .* of /,
    'a tick is not labelled with the board sentence, so the strip says nothing on hover');
});

/**
 * ⭐⭐ AND PRESSING ONE GOES THERE. The ticks exist to be navigation, so the claim
 * that matters is not that they are drawn but that they MOVE THE PLAYHEAD.
 *
 * ⚠️ FIRED AT THE CONTAINER WITH THE EVENT SHAPE THE HANDLER READS, which is the
 * same thing `markClick` does for the marks on the ice. The listener is delegated
 * — the strip is rebuilt and a tick is not permanent — so it reads `ev.target`,
 * and a probe that handed it the container itself would prove nothing.
 *
 * ⛔⛔ AND IT READS `#scrub`, NOT `frameOf()`, WHICH THE FIRST VERSION GOT WRONG.
 * `frameOf` sounds like "which frame is showing" and is not: it walks the scrub
 * from zero looking for the first frame whose clip box carries an id — the first
 * GOAL CLIP — so it answered 73 for every press, including presses that had moved
 * the page correctly. Worse, it MUTATES the page it is asked about, scrubbing
 * through every frame on the way. Both tests below passed against it while
 * proving nothing. `set()` writes the playhead to `#scrub`, so that is the
 * observable, and a name is not a specification.
 */
test('⭐ pressing a goal tick moves the playhead to that goal', () => {
  const a = boot();
  const press = i => a.$('gticks')._fire({
    target: {
      classList: { contains: c => c === 'gtick' },
      getAttribute: n => (n === 'data-k' ? String(i) : null),
    },
  });
  const ticks = (a.$('gticks')._kids || []).map(b => +b.getAttribute('data-k'));
  assert.ok(ticks.length >= 2, `only ${ticks.length} tick(s) — this needs at least two to mean anything`);

  for (const k of ticks) {
    press(k);
    assert.equal(+a.$('scrub').value, k,
      `pressing the tick for frame ${k} left the playhead at ${a.$('scrub').value}`);
  }
});

test('⛔ a press that is not on a tick is ignored', () => {
  /* The strip lies over the lower third of a 44px control. If the handler acted
     on anything that reached it, a drag that began there would jump the replay to
     whatever `data-k` happened to parse as — `NaN`, and `set` would clamp it to a
     frame the reader never asked for. */
  const a = boot();
  const before = a.$('scrub').value;
  a.$('gticks')._fire({ target: { classList: { contains: () => false }, getAttribute: () => null } });
  assert.equal(a.$('scrub').value, before, 'a press on the strip itself moved the playhead');
});

/**
 * ⛔⛔ THE TICK RULE MUST OUT-SPECIFY THE TRANSPORT'S BUTTON RULE.
 *
 * Found by LOOKING, in real Chromium, with 1,323 tests green. A tick is a
 * `<button>` inside `.transport`, so `#rg:not(.preview) .transport button`
 * claims it at specificity (1,2,1) — and the first version of the tick rule was
 * `#rg .gtick`, (1,1,0). The ticks rendered **20x44** instead of 14x9, wearing
 * the Prev/Next buttons' `min-height:44px` and their 10px side padding, and
 * nothing in the suite could see it: `npm test` is blind on layout.
 *
 * ⚠️ WHAT THIS CHECK IS AND IS NOT. It cannot measure a pixel, so it does not
 * claim to. It pins the two things that CAUSED the defect and are visible in the
 * source — the rule is scoped through `.transport`, and it resets `min-height`
 * by name — so the next edit cannot quietly drop back to a selector the
 * transport outranks. The rendered size is a browser's job.
 */
test('⛔ the goal tick out-specifies the transport button rule that once ate it', () => {
  const css = PAGE_CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rule = /#rg\s+\.transport\s+\.gticks\s+\.gtick\{([^}]*)\}/.exec(css);
  assert.ok(rule,
    'the tick rule is no longer scoped through .transport — `#rg:not(.preview) .transport '
    + 'button` is (1,2,1) and will take the ticks back, silently, at 20x44');
  assert.match(rule[1], /min-height:\s*0/,
    'the tick does not reset min-height, so the transport button rule makes it 44px tall');
  assert.match(rule[1], /padding:\s*0/,
    'the tick does not reset padding, so the transport button rule widens it');

  // AND THE STRIP MUST NOT EAT THE SCRUBBER. It lies over the lower third of a
  // 44px control; without `pointer-events:none` every drag starting there dies.
  const strip = /#rg\s+\.gticks\{([^}]*)\}/.exec(css);
  assert.ok(strip && /pointer-events:\s*none/.test(strip[1]),
    'the tick strip captures pointer events, so it swallows drags meant for the scrubber');
});
