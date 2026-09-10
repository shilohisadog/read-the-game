/**
 * WHO IS ON THE ICE, ON THE PAGE — shown at rest and gone while the play runs.
 *
 * ⛔ A LIST, NEVER A FORMATION. Kevin asked the question that decided this before
 * any of it existed: *"are you planning on just overlaying them in their
 * 'generic' locations during a pause?"* DOCTRINE §5 says no — real skater
 * coordinates are not public and we do not fake them — and on this canvas the
 * refusal matters more than on a rule diagram, because every other token here
 * sits on a measured coordinate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot } from './helpers/page.js';
import { onIce } from '../src/lib/onice.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const CSS = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

test('⛔⛔ DEFAULT OFF — a toggle at rest, not a panel on every pause', () => {
  /* KEVIN'S SECOND RULING ON THIS SURFACE, from the live page: *"I'd rather have
     a toggle that turns that on/off on pause, not have it display at every
     pause."* He is right twice: the roster is 165px of names, so showing it
     unbidden clutters the frame AND shoves the Play button down the page —
     which is the jitter this project killed once and has re-introduced twice
     since, both times through a feature that looked harmless. */
  const a = boot(rich, null, '?at=2-10:00');
  const btn = a.$('onIceBtn'), box = a.$('onIce');
  assert.equal(box.hidden, true, 'the roster is on screen without being asked for');
  assert.equal(btn.hidden, false, 'no control is offered at rest');
  assert.equal(btn.getAttribute('aria-pressed'), 'false', 'the control does not report its state');

  btn.click();
  assert.equal(box.hidden, false, 'the toggle does not reveal the roster');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');

  /* ⭐ AND IT REMEMBERS FOR THE VISIT. A reader who wanted the roster at this
     pause wants it at the next one; making them ask again every time is the
     same complaint in a different costume. */
  a.$('play').click();
  assert.equal(box.hidden, true, 'the roster survived the press of Play');
  assert.equal(btn.hidden, true, 'the control is offered while the replay runs');
  a.$('play').click();
  assert.equal(box.hidden, false, 'the toggle forgot between two pauses');

  btn.click();
  assert.equal(box.hidden, true, 'the toggle does not turn it off again');
  assert.equal(box.innerHTML, '', 'the markup is left behind when it is turned off');
});

test('⛔ the control\'s row is RESERVED, so arriving at rest moves nothing', () => {
  /* The button exists only at rest. Without a reserved row it would appear on
     pause and push the Play button down — a two-line fix for the exact defect
     the panel itself was just corrected for. */
  const rule = /#rg \.oiwrap\{([^}]*)\}/.exec(CSS);
  assert.ok(rule, 'the control has no row of its own');
  assert.match(rule[1], /min-height:\s*[\d.]+/,
    'the control\'s row reserves no height — it will move the transport when it appears');
});

test('⭐ the roster is on screen at rest, on every frame that has one', () => {
  const a = boot(rich);
  a.$('onIceBtn').click();            // ⛔ DEFAULT OFF: ask for it, then walk
  const states = a.every(d => d.$('onIce').hidden);
  const shown = states.filter(h => !h).length;
  assert.ok(states.length > 200, `only ${states.length} frames walked`);
  assert.ok(shown / states.length > 0.95,
    `the roster is on screen for only ${shown} of ${states.length} resting frames`);
});

test('⛔ it names the players `onIce` names, and marks the goaltender', () => {
  const a = boot(rich);
  a.$('onIceBtn').click();
  const htmls = a.every(d => d.$('onIce').innerHTML);
  const k = 40;
  const html = htmls[k];
  assert.ok(html, 'no roster was rendered at a mid-game frame');
  /* ⭐ CHECKED AGAINST THE REDUCER, not against a remembered list: the page and
     the module must name the same people or one of them is inventing. */
  const frames = a.every(d => d.$('per').textContent);
  assert.ok(frames.length === htmls.length, 'the two walks disagree about the timeline');
  const ev = rich.events.filter(e => e.x != null);
  // Find the event this frame is about by matching the names it printed.
  const named = [...html.matchAll(/#(\d+)<\/span> ([^<&]+)/g)].map(m => m[2].trim());
  assert.ok(named.length >= 8, `only ${named.length} names on the roster panel`);
  const hit = ev.find(e => {
    const on = onIce(rich, e);
    const all = [...on.away.skaters, ...on.away.goalies, ...on.home.skaters, ...on.home.goalies]
      .map(p => p.nm);
    return all.length === named.length && all.every(n => named.includes(n));
  });
  assert.ok(hit, 'the names on the panel match no second in the shift chart');
  assert.match(html, /goal<\/div>/, 'the goaltender is not set apart from the skaters');
  assert.match(html, /shift chart/, 'the panel does not say where the list comes from');
  assert.match(html, /can .{0,10}show six/,
    'the panel no longer warns that a change in progress shows six');
});

test('⛔ it goes away the moment Play is pressed, not at the next frame', () => {
  /* ⚠️ THE GOLDEN CAUGHT THE DEFECT: neither transition produces a frame of its
     own, so pressing Play left a stale roster up for as long as one dwell —
     3600ms — while the players it names are already changing.

     ⛔⛔ AND THE FIRST VERSION OF THIS TEST COULD NOT SEE IT. It walked to the
     END of the game and pressed Play there, which takes `play()`'s reset branch
     back to frame 0 — and at second ZERO no shift satisfies `s < t`, so the
     panel empties for a reason that has nothing to do with playback. TWO
     mutations (dropping the `playing` guard, and dropping the hide from
     `play()`) both LANDED and neither failed. A deep link puts the page on a
     real resting frame instead, which is the only state the claim is about. */
  const a = boot(rich, null, '?at=2-10:00');
  a.$('onIceBtn').click();
  assert.equal(a.$('onIce').hidden, false,
    'the deep-linked resting frame shows no roster — this test has no subject');
  a.$('play').click();
  assert.equal(a.$('onIce').hidden, true, 'the roster survived the press of Play');
});

test('⭐ the opening faceoff lists the line that is STARTING, not nobody', () => {
  /* ⚠️ THIS TEST USED TO ASSERT THE OPPOSITE, and it was pinning a defect. Under
     one rule for every frame, second zero matched no shift at all and the
     opening faceoff showed an empty panel — which I recorded as "the interval
     rule being honest". It was the interval rule being WRONG at a boundary, and
     the screenshot that found the faceoff defect found this with it. */
  const a = boot(rich, null, '?at=1-20:00');
  a.$('onIceBtn').click();
  assert.equal(a.$('onIce').hidden, false, 'the opening faceoff still shows nobody');
  const html = a.$('onIce').innerHTML;
  const names = [...html.matchAll(/#(\d+)<\/span>/g)].length;
  assert.ok(names >= 10, `only ${names} players listed at the opening faceoff`);
});

test('⛔⛔ never in the PREVIEW, and `hidden` actually hides — the deploy gate caught both', () => {
  /* ⛔ THE REGRESSION THAT WENT RED, 2026-09-10. The hero is a 390x273 shop
     window with no transport and no reader; `playing` is false between its
     frames, so the roster rendered there and pushed 165px of names into a box
     sized for a rink. The gate's probe returned `HERO -Infinity` and the deploy
     failed. **1,200 green unit tests could not see it, because a fake document
     has no layout.**

     ⛔ AND `hidden` WAS A NO-OP, which is the quieter half. `#rg .onice`
     contains an id, so its `display:grid` outranks the user agent's
     `[hidden]{display:none}` — the element stayed laid out and `el.hidden =
     true` did nothing, with no error anywhere. Any future block with a
     `display` on an id-bearing selector has the same hole. */
  const a = boot(rich, null, '?preview=1&at=2-10:00');
  a.$('onIceBtn').click();            // even when asked for, the hero refuses
  assert.equal(a.$('onIce').hidden, true, 'the roster renders inside the preview hero');
  assert.equal(a.$('onIceBtn').hidden, true, 'the hero offers a control nobody can use');
  assert.equal(a.$('onIce').innerHTML, '', 'the preview hero carries roster markup');

  const rule = /#rg \.onice\[hidden\]\{([^}]*)\}/.exec(CSS);
  assert.ok(rule, '`#rg .onice[hidden]` has no rule — `hidden` is outranked and does nothing');
  assert.match(rule[1], /display:\s*none/, 'the hidden rule does not turn the element off');
});

test('⭐ the panel is a LIST — no absolute positioning, nothing over the rink', () => {
  /* THE STRUCTURAL FORM OF DOCTRINE §5. A rule about where players are drawn is
     only as good as the thing that stops the next person drawing them: this
     block must not be able to sit on the ice. */
  const rule = /#rg \.onice\{([^}]*)\}/.exec(CSS);
  assert.ok(rule, 'the roster panel has no styling of its own');
  assert.doesNotMatch(rule[1], /position:\s*absolute|position:\s*fixed/,
    'the roster panel is positioned over the page — it is a list, not a formation');
  assert.match(rule[1], /grid-template-columns/, 'the two benches are not two columns');
  // AND IT MUST WRAP RATHER THAN WIDEN on the 360px viewport the deploy gate measures.
  assert.match(rule[1], /minmax\(0,\s*1fr\)/,
    'a long surname can widen the grid past a phone viewport');
});
