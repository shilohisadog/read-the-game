/**
 * Icing, said out loud — 2026-08-31.
 *
 * Kevin, on a real sequence (`?game=2025021245&at=2-15:26`): *"the current event
 * is TOR — Giveaway, the next event is WSH — Won the faceoff… What that doesn't
 * say is what happened in between. I know it was WSH icing the puck, but it's
 * not blindingly obvious for a novice, which is a current failure of the site."*
 *
 * And on the rule itself: *"the learn card tells the reader to watch where the
 * faceoff is, but we left out half of icing — the situation that CAUSED it."*
 *
 * So the frame now says both halves: the cause (from behind the centre line,
 * past the far goal line) and the punishment (which end the draw comes back to).
 * The cause is also LIT ON THE ICE — the two lines Rule 81 names — which had
 * been reachable only by turning on a layer a novice does not know exists.
 *
 * ⭐ WHAT IS CHECKED HERE. Two of the rule's branches cannot be reached from
 * `rich.json` at all: every icing in it is followed immediately by a faceoff
 * with no second whistle in between. Mutations deleting both guards survived a
 * green suite of 878, so those two are tested on constructed events. Everything
 * else is asserted against the real game.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { icingRestarts, offsideRestarts } from '../src/lib/layers/whistle.js';
import { boot, rich, PAGE_CSS } from './helpers/page.js';
import { readFileSync } from 'node:fs';

const CTX = { homeId: rich.teams.home.id, awayId: rich.teams.away.id,
              homeAb: rich.teams.home.ab, awayAb: rich.teams.away.ab };

const stop = (rsn) => ({ type: 'stoppage', rsn, per: 1, s: 100, x: null });
const draw = (x) => ({ type: 'faceoff', per: 1, s: 100, x });

test('⭐ the positive control — an icing, then the draw it forces', () => {
  // Every refusal below is a variation of this shape. Without it, a rule that
  // returned nothing at all would pass all three.
  const got = icingRestarts([stop('icing'), draw(-69)], CTX);
  assert.equal(got.length, 1);
  assert.equal(got[0].zone, CTX.homeAb, 'a restart at x=-69 is in the home end');
  assert.deepEqual(got[0].lines, [0, 89], 'the centre line and the FAR goal line');
});

test('⭐ the restart is the FACEOFF, not merely the next thing recorded', () => {
  // 468 of 469 archive icings are followed straight by a faceoff and one by a
  // penalty — so in `rich.json` "the next event" and "the next faceoff" are the
  // same event every time, and a mutation taking whatever came next survived.
  const got = icingRestarts(
    [stop('icing'), { type: 'penalty', per: 1, s: 100, x: 12 }, draw(69)], CTX);
  assert.equal(got.length, 1);
  assert.equal(got[0].zone, CTX.awayAb,
    'the penalty was read as the restart, so the sentence names the wrong end');
});

test('⭐ a SECOND whistle owns the next drop, and this icing is dropped', () => {
  // Otherwise this icing's sentence lands on a faceoff that is restarting
  // something else — the wrong rule named at the right-looking moment.
  assert.deepEqual(icingRestarts([stop('icing'), stop('offside'), draw(-69)], CTX), []);
  // AND THE PAIR: the same frames with no second whistle DO produce one.
  assert.equal(icingRestarts([stop('icing'), draw(-69)], CTX).length, 1);
});

test('a stoppage that is not an icing forces nothing', () => {
  assert.deepEqual(icingRestarts([stop('offside'), draw(-69)], CTX), []);
  assert.deepEqual(icingRestarts([stop('puck-frozen'), draw(69)], CTX), []);
});

test('⭐ the caption names the end the FEED puts the draw in, on every icing', () => {
  /* THE HOLE A MUTATION FOUND: pinning `zone` to the home club survived, because
     nothing read the sentence. The reference game ices into BOTH ends, so this
     cannot pass by accident — and the expectation is derived from the rink
     convention (coordinates are normalised so the HOME side defends -x) rather
     than by asking `zoneOf`, which is the function under test. */
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  const EV = rich.events.filter(e => !SKIP.has(e.type));
  const want = icingRestarts(rich.events, CTX).map(r => ({
    frame: EV.indexOf(r.event),
    ab: r.event.x < 0 ? CTX.homeAb : CTX.awayAb,   // the convention, not the rule
  }));
  assert.ok(want.length >= 4, `only ${want.length} icings`);
  assert.equal(new Set(want.map(w => w.ab)).size, 2,
    'every icing in the fixture goes to the same end — this test cannot fail');

  const a = boot();
  for (const w of want) {
    a.$('scrub').oninput({ target: { value: String(w.frame - 1) } });
    a.$('fwd').click();                                  // stepped onto: a drag is silent
    const h = a.$('caption').innerHTML;
    assert.match(h, /🧊 Icing/, `frame ${w.frame} is an icing restart and said nothing`);
    /* ⭐ THE CLUB MOVED TO THE CHIP ON 2026-09-18 and the claim did not change.
       Kevin: *"unless we say which team … iced the puck"*. By Rule 81.1 the club
       whose end the draw comes back to IS the club that iced it, so the caption
       now names it the way every other caption does — on `sayCaption`'s tag —
       and the clause says "their end" rather than printing the same three
       letters twice in one sentence. Both halves are still asserted, and the
       club is still derived from the CONVENTION here, never from `zoneOf`. */
    assert.match(h, new RegExp(`<span class="tag [ah]">${w.ab}</span>`),
      `frame ${w.frame}: the feed puts the draw in ${w.ab}'s end, so ${w.ab} iced it — `
      + `and the caption says "${h}"`);
    assert.match(h, /faceoff back in their end/,
      `frame ${w.frame}: the caption stopped saying where the draw went — "${h}"`);
    // AND THE CAUSE HALF IS THERE TOO — Kevin's point, not decoration.
    assert.match(h, /from behind centre, past the far goal line/,
      'the caption dropped the half that says what caused the icing');
  }
});

test('⭐ the caption pill can WRAP, which is what lets it teach', () => {
  /* `white-space:nowrap` meant `max-width:92%` could not shrink the pill below
     its own text: it overflowed and the whole PAGE scrolled sideways. Measured
     at 320 — the icing caption is the longest this page can produce and was
     324px against a 320px viewport. Every caption before it was a club, a label
     and a name; a caption that TEACHES is longer than one that labels.
     ⚠️ AND `box-sizing` IS THE OTHER HALF. The cap really was applying — the
     computed width was 294px — and the box still measured 324, because the
     element is `content-box` and 15px of padding each side sits outside the cap.
     Both declarations, or the page scrolls sideways again. */
  const m = /#rg \.caption\{([^}]*)\}/.exec(PAGE_CSS);
  assert.ok(m, 'the caption rule has moved');
  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(body, /white-space:\s*nowrap/,
    'the pill cannot wrap again, so a teaching caption overflows the page');
  assert.match(body, /box-sizing:border-box/,
    'the padding escapes max-width again — the cap applies and the box exceeds it');
  assert.match(body, /width:max-content/,
    'without this the pill shrink-to-fits into the half-card left of `left:50%`');
});

/* ---------------------------------------------------------------- OFFSIDE, AND THE CLUB
 * ⭐⭐ WHO WAS OFFSIDE — Kevin, 2026-09-18, from the live site: *"'Offside — a
 * skater crossed the blue line ahead of the puck', do we know which team was
 * offside? I'm not sure a casual fan would know what was happening there (same
 * with icing) unless we say which team was offside (or iced the puck)."*
 *
 * ⛔ AND THE BRANCH THAT CANNOT NAME ONE IS THE POINT OF THIS BLOCK. 5.60% of
 * offsides across all 4,490 published games restart at centre ice, which names
 * nobody (`docs/stoppage-attribution.md`). It is the first time this site has had
 * to surface an event it has INCOMPLETE information about, so the branch gets a
 * rendered test rather than a library one: the pill must say why, the ice must
 * name no club, and the mark must go neutral rather than pick a side.
 */
const OFF = JSON.parse(readFileSync(
  new URL('fixtures/extracts/2023030222.json', import.meta.url), 'utf8'));
const OFF_CTX = { homeId: OFF.teams.home.id, awayId: OFF.teams.away.id,
                  homeAb: OFF.teams.home.ab, awayAb: OFF.teams.away.ab };
const SKIP_T = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);

/** Step onto a frame the way a viewer does — the pill is written on a moment, not a drag. */
function stepTo(a, k) {
  a.$('scrub').oninput({ target: { value: String(k - 1) } });
  a.$('fwd').click();
}

test('⭐ an offside names the club ON THE PILL, on both sides of the ice', () => {
  const EV = OFF.events.filter(e => !SKIP_T.has(e.type));
  const named = offsideRestarts(OFF.events, OFF_CTX).filter(r => r.offender);
  assert.ok(named.length >= 4, `only ${named.length} nameable offsides in this fixture`);
  assert.equal(new Set(named.map(r => r.offender)).size, 2,
    'every nameable offside in the fixture blames the same club — this test cannot fail');

  const a = boot(OFF, null);
  for (const r of named) {
    const k = EV.indexOf(r.event);
    if (k < 1) continue;
    stepTo(a, k);
    assert.match(a.$('caption').innerHTML, new RegExp(`<span class="tag [ah]">${r.offender}</span>`),
      `the pill does not name ${r.offender} on the offside at frame ${k}`);
    /* ⭐⭐ AND THE ICE NARRATES THE FACE-OFF, WHICH IS THE OTHER EVENT ON THIS FRAME.
       Kevin, 2026-09-18, from the live site: *"icing and the faceoff occur at the
       same clock time, [as] two different events… I'd rather keep the popup the way
       it is, since it details the icing event, and change the ice description to who
       won the faceoff."* The reason is stronger than the duplication he pointed at:
       A MARK ON THIS RINK ASSERTS A PLACE, the ice label hangs off one with a leader
       line, and an icing has NO coordinate — the dot is where the restart is. So the
       ice may never say the stoppage here, and this is the half that keeps it out. */
    assert.doesNotMatch(a.$('labels').innerHTML, /Offside|Iced the puck/,
      `frame ${k}: the ice is naming the stoppage, whose place it does not know`);
  }
});

test('⭐⭐ a centre-ice draw names NOBODY, and the pill says why', () => {
  const EV = OFF.events.filter(e => !SKIP_T.has(e.type));
  const blind = offsideRestarts(OFF.events, OFF_CTX).filter(r => !r.offender);
  assert.ok(blind.length > 0, 'this fixture no longer holds an offside the dot cannot attribute');

  const a = boot(OFF, null);
  for (const r of blind) {
    const k = EV.indexOf(r.event);
    if (k < 1) continue;
    stepTo(a, k);
    const pill = a.$('caption').innerHTML;
    assert.match(pill, /🔵 Offside/, `the offside at frame ${k} said nothing at all`);
    assert.match(pill, /centre-ice draw names neither club/,
      `the pill is silent about WHY no club is named at frame ${k}: "${pill}"`);
    assert.doesNotMatch(pill, /<span class="tag/,
      `the pill wears a club chip on an offside nobody can be blamed for: "${pill}"`);
  }
});

test('⛔ the club on the pill is never the face-off WINNER', () => {
  /* Measured over 600 games: the draw after an offside is won by the offending club
     exactly 50.0% of the time and after an icing 45.1%, so reading `own` would be a
     coin flip. ⭐ THE FIXTURE IS CHECKED FOR THE DISAGREEMENT FIRST — on a game where
     the two never differ this test would pass on a page that read the winner. */
  const EV = OFF.events.filter(e => !SKIP_T.has(e.type));
  const named = offsideRestarts(OFF.events, OFF_CTX).filter(r => r.offender);
  const differ = named.filter(r =>
    (r.event.own === OFF_CTX.homeId ? OFF_CTX.homeAb : OFF_CTX.awayAb) !== r.offender);
  assert.ok(differ.length > 0,
    'in this fixture the draw winner and the offender never differ, so this test cannot fail');

  const a = boot(OFF, null);
  for (const r of differ) {
    const k = EV.indexOf(r.event);
    if (k < 1) continue;
    stepTo(a, k);
    const won = r.event.own === OFF_CTX.homeId ? OFF_CTX.homeAb : OFF_CTX.awayAb;
    assert.doesNotMatch(a.$('caption').innerHTML, new RegExp(`<span class="tag [ah]">${won}</span>`),
      `the pill blamed ${won}, who WON the draw, instead of ${r.offender}, who was offside`);
    // …and the ice DOES name the winner, because that is the event the dot is.
    assert.match(a.$('labels').innerHTML, new RegExp(`${won} · Won the faceoff`),
      `frame ${k}: the ice should narrate the draw ${won} won`);
  }
});
