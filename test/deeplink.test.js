/**
 * The deep-link seam: the parser and the resolver, before either exists.
 *
 * Written first, and every assertion below is red against `main` — the page
 * reads `?game=` and nothing else. That ordering is deliberate: the out-of-range
 * behaviour is the one thing here that today's code appears to get right by
 * accident (the replay already opens at event 0), so a test written after the
 * fix would have gone green without ever exercising the fix.
 *
 * THE TEST THIS FILE REFUSES TO BE. The tempting shape is: build a URL from an
 * event, resolve it, assert you get that event back. That is a round trip
 * through the resolver's own assumptions — it passes on a resolver that only
 * understands the events its own generator produced, and it would NOT have
 * caught the faceoff result in docs/deep-link-seam.md §4, because a generator
 * emits the disambiguator and the bare-clock path never runs. It is the fourth
 * instance of a check built from the implementation's own model of its input.
 *
 * So the round trip appears exactly once, at the bottom, labelled with what it
 * cannot see. Everything above it asserts a property of REAL GAMES that the
 * resolver has to survive, chosen because the property surprised me.
 *
 * WHAT THIS FILE MAY NOT DO. Five of these six games were picked for being
 * adversarial (test/fixtures/extracts/README.md). A RATE measured here would be
 * meaningless. Properties only; the archive-wide numbers belong to measure.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse, resolve, format } from '../src/lib/deeplink.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { danger } from '../src/lib/layers/danger.js';
import { whistle } from '../src/lib/layers/whistle.js';

const FIX = new URL('./fixtures/extracts/', import.meta.url);
const GAMES = readdirSync(FIX).filter(f => f.endsWith('.json')).sort()
  .map(f => ({ id: f.slice(0, -5), ...JSON.parse(readFileSync(new URL(f, FIX))) }));
GAMES.push({ id: '2023020204',
  ...JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url))) });

const byId = id => GAMES.find(g => g.id === id);

test('the corpus is the corpus we think it is', () => {
  // Published extracts plus `rich.json`. It went from 5+1 to 6+1 on 2026-08-27
  // when `2025030214` arrived — a double minor killed by a goal 176 seconds
  // early, which is what the penalty clock is tested against; to 7+1 when
  // `2025030223` arrived with a short-handed goal and a bench minor; and to 8+1
  // on 2026-09-01 when `2024020543` arrived carrying the PULLED-GOALIE TRAP
  // twice. That last one replaced a case `2023020207` only appeared to hold
  // while its extract was stale — see fixtures/extracts/README.md.
  assert.equal(GAMES.length, 9);
  assert.ok(GAMES.every(g => g.events.length > 250));
});

/* ------------------------------------------------------------------ fixtures
   A fixture is only worth its bytes while it still discriminates. The hero
   test on the homepage passed a mutation because its fixture's featured team
   happened to be the home team, so the wrong side read the right number. These
   two games exist to tell a period number from a period TYPE, and if a re-copy
   ever costs them that, the pair goes on quietly proving nothing. */

test('the fixture pair still discriminates: period 5 means two different things', () => {
  const so = byId('2023020207').events.filter(e => e.per === 5);
  const ot = byId('2023030222').events.filter(e => e.per === 5);
  assert.ok(so.length > 0 && ot.length > 0, 'both games must reach a fifth period');
  assert.ok(so.every(e => e.pt === 'SO'), '2023020207 P5 is a shootout');
  assert.ok(ot.every(e => e.pt === 'OT'), '2023030222 P5 is a third overtime');
});

/* ----------------------------------------------------------- the resolver
   Properties of how the LEAGUE records hockey, which the resolver has to
   survive. These are not rates and they are not about our code. */

test('no faceoff is ever the first event at its clock, in any of the six', () => {
  for (const g of GAMES) {
    const first = new Map();
    g.events.forEach((e, i) => {
      const k = e.per + '|' + e.rem;
      if (!first.has(k)) first.set(k, i);
    });
    const offenders = g.events
      .map((e, i) => ({ e, i }))
      .filter(({ e, i }) => e.type === 'faceoff' && first.get(e.per + '|' + e.rem) === i);
    assert.deepEqual(offenders.map(o => o.i), [],
      `${g.id}: a faceoff was recorded before the stoppage that caused it`);
  }
});

test('so a bare clock naming a faceoff never lands on the faceoff — it lands earlier', () => {
  // The consequence of the property above, stated as resolver behaviour. This
  // is the assertion that would have failed on a "nearest event" heuristic.
  let checked = 0;
  for (const g of GAMES) {
    for (const [i, e] of g.events.entries()) {
      if (e.type !== 'faceoff') continue;
      const r = resolve(g.events, { per: e.per, rem: e.rem, n: 1 });
      assert.notEqual(r.index, i, `${g.id}: bare clock resolved to a faceoff at ${i}`);
      assert.ok(r.index < i, `${g.id}: bare clock should land before the draw`);
      checked++;
    }
  }
  // Derived, not chosen. A literal here would be a constant that drifts the
  // moment a fixture is re-copied, and it would drift DOWNWARDS silently --
  // a test that keeps passing while covering less.
  const draws = GAMES.reduce((n, g) => n + g.events.filter(e => e.type === 'faceoff').length, 0);
  assert.equal(checked, draws, 'every draw in the corpus must have been put through this');
  assert.ok(draws > 300, `a corpus of six games should hold hundreds of draws, not ${draws}`);
});

test('an ordinal reaches the faceoff the bare clock could not', () => {
  for (const g of GAMES) {
    for (const [i, e] of g.events.entries()) {
      if (e.type !== 'faceoff') continue;
      const n = g.events.filter((x, j) => j <= i && x.per === e.per && x.rem === e.rem).length;
      assert.equal(resolve(g.events, { per: e.per, rem: e.rem, n }).index, i);
    }
  }
});

test('the worst second in the archive is addressable event by event', () => {
  // 2024030413: fifteen events at one clock, thirteen of them penalties.
  const g = byId('2024030413');
  const counts = new Map();
  for (const e of g.events) {
    const k = e.per + '|' + e.rem;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const [key, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
  assert.ok(n >= 15, `expected a 15-event second, found ${n}`);
  const [per, rem] = [Number(key.split('|')[0]), key.split('|')[1]];
  const want = g.events.map((e, i) => ({ e, i })).filter(({ e }) => e.per === per && e.rem === rem);
  for (const [k, { i }] of want.entries()) {
    const r = resolve(g.events, { per, rem, n: k + 1 });
    assert.equal(r.index, i, `ordinal ${k + 1} of ${n}`);
    assert.equal(r.exact, true);
  }
});

/* -------------------------------------------------- out of range, three ways
   docs/deep-link-seam.md §7. The page's set() clamps to EV.length-1, so the
   naive resolver -- "the last event at or before that moment" -- answers a
   period the game never reached with the FINAL EVENT of the game: final score,
   finished counters, the shootout notice. That is not a blank rink, it is a
   spoiler that looks like a working page.

   Each case asserts the landing AND the word, because asserting the landing
   alone passes on today's silent clamp. */

test('a period the game never reached lands at the opening faceoff, with a word', () => {
  const g = byId('2023020105');              // regulation only: no period 4
  assert.equal(Math.max(...g.events.map(e => e.per)), 3);
  const r = resolve(g.events, { per: 4, rem: '03:00', n: 1 });
  assert.equal(r.index, 0);
  assert.ok(r.why, 'must carry a sentence the page can print');
  // Stated separately so it cannot be satisfied by coincidence: THE SPOILER.
  assert.notEqual(r.index, g.events.length - 1);
});

test('a clock before the game starts lands at the opening faceoff, with a word', () => {
  const g = byId('2023020105');
  const r = resolve(g.events, { per: 1, rem: '25:00', n: 1 });
  assert.equal(r.index, 0);
  assert.ok(r.why);
});

test('an ordinal past the end of a shared clock takes the last one, WITHOUT a word', () => {
  // We got the second right; there is nothing to apologise for.
  const g = byId('2024030413');
  const counts = new Map();
  for (const e of g.events) counts.set(e.per + '|' + e.rem, (counts.get(e.per + '|' + e.rem) || 0) + 1);
  const key = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  const [per, rem] = [Number(key.split('|')[0]), key.split('|')[1]];
  const last = g.events.reduce((acc, e, i) => (e.per === per && e.rem === rem ? i : acc), -1);
  const r = resolve(g.events, { per, rem, n: 99 });
  assert.equal(r.index, last);
  assert.equal(r.why, null, 'landing on the right second needs no apology');
  assert.equal(r.exact, false);
});

test('a moment between events lands on the last event before it, without a word', () => {
  const g = byId('2023020105');
  const has = new Set(g.events.map(e => e.per + '|' + e.rem));
  let per = 2, rem = null;
  for (let s = 0; s < 1200 && rem === null; s++) {
    const cand = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    if (!has.has(per + '|' + cand)) rem = cand;
  }
  const r = resolve(g.events, { per, rem, n: 1 });
  assert.equal(r.why, null);
  assert.equal(r.exact, false);
  const landed = g.events[r.index];
  assert.ok(landed.per < per || (landed.per === per && toSec(landed.rem) > toSec(rem)),
    'must land at or before the moment named, never after it');
});

test('no `at` at all opens at the opening faceoff, and that is not a failure', () => {
  const g = byId('2023020105');
  const r = resolve(g.events, null);
  assert.equal(r.index, 0);
  assert.equal(r.why, null);
});

const toSec = mmss => Number(mmss.split(':')[0]) * 60 + Number(mmss.split(':')[1]);

/* -------------------------------------------------------------- the parser
   One function, and the ugly inputs go straight at it. Each must have a
   STATED behaviour rather than a fallthrough. */

test('the ordinary link', () => {
  const s = parse('?game=2023020204&at=2-14:32&layer=whistle,corsi&strength=even');
  assert.equal(s.game, '2023020204');
  assert.deepEqual(s.at, { per: 2, rem: '14:32', n: 1 });
  assert.deepEqual([...s.layers].sort(), ['corsi', 'whistle']);
  assert.equal(s.strength, 'even');
  assert.deepEqual(s.problems, []);
});

test('the ordinal is 1-based and rides on a dot, because `+` decodes to a space', () => {
  // The artifact proposed `at=2-14:32+1`. In a query string `+` IS a space:
  // any consumer using URLSearchParams -- including a browser, a link
  // shortener, or anything that re-encodes -- hands back "2-14:32 1". The
  // grammar had a latent encoding bug and this is the test that pins it.
  assert.deepEqual(parse('?at=2-14:32.3').at, { per: 2, rem: '14:32', n: 3 });
  assert.equal(parse('?at=2-14:32').at.n, 1, 'omitted means the first, not the zeroth');
  assert.equal(parse('?at=2-14:32 1').at, null, 'a space is not a grammar we accept');
});

test('period 4 and 5 parse as numbers, because overtime is a period like any other', () => {
  assert.equal(parse('?at=4-01:12').at.per, 4);
  assert.equal(parse('?at=5-00:00').at.per, 5);
});

for (const [q, why] of [
  ['?at=banana', 'not a clock'],
  ['?at=2-14', 'no seconds'],
  ['?at=2-1:32', 'minutes not padded'],
  ['?at=0-14:32', 'there is no period zero'],
  ['?at=2-14:99', 'no such second'],
  ['?at=', 'empty'],
]) {
  test(`a malformed \`at\` is refused and reported: ${q} (${why})`, () => {
    const s = parse(q);
    assert.equal(s.at, null);
    assert.ok(s.problems.some(p => /at/.test(p)), `expected a problem naming \`at\`, got ${JSON.stringify(s.problems)}`);
  });
}

test('an unknown layer token is dropped and reported, and the known ones survive', () => {
  const s = parse('?layer=corsi,gubbins,whistle');
  assert.deepEqual([...s.layers].sort(), ['corsi', 'whistle']);
  assert.ok(s.problems.some(p => /gubbins/.test(p)));
});

test('an empty or absent layer list means no layers, and is not a problem', () => {
  for (const q of ['?layer=', '?game=1', '?layer=,,']) {
    const s = parse(q);
    assert.deepEqual([...s.layers], []);
    assert.deepEqual(s.problems.filter(p => /layer/.test(p)), []);
  }
});

test('tokens are case-insensitive and space-tolerant, because people type them', () => {
  assert.deepEqual([...parse('?layer=CORSI, Whistle').layers].sort(), ['corsi', 'whistle']);
  assert.equal(parse('?strength=EVEN').strength, 'even');
});

test('a repeated parameter takes the first, and says it saw two', () => {
  const s = parse('?game=111&game=222');
  assert.equal(s.game, '111');
  assert.ok(s.problems.some(p => /game/.test(p)));
});

test('garbage strength falls back to the page default and is reported', () => {
  const s = parse('?strength=sideways');
  assert.equal(s.strength, 'all', 'the replay counts every attempt unless told otherwise');
  assert.ok(s.problems.some(p => /strength/.test(p)));
});

test('`at` without a game is legal — the shell picks the game, the clock still applies', () => {
  const s = parse('?at=2-14:32');
  assert.equal(s.game, null);
  assert.deepEqual(s.at, { per: 2, rem: '14:32', n: 1 });
  assert.deepEqual(s.problems, []);
});

test('preview is read by the same parser as everything else', () => {
  // Not a new feature: it removes the third hand-written regex over
  // location.search, two of which were the same test spelled twice.
  assert.equal(parse('?preview=1').preview, true);
  assert.equal(parse('?game=1').preview, false);
  assert.equal(parse('?preview=11').preview, false, 'the word-boundary the old regex had');
});

/* ------------------------------------------------------------- layer tokens
   SET EQUALITY, not a spot check. The CSP test that missed a whole unhashed
   stylesheet did so by asking "is this one thing present" of a document that
   had two. A layer added without a URL token would be unreachable by link and
   nothing would say so. */

test('every layer has a URL token and every token is a layer', () => {
  const ids = [corsi, goaltending, danger, whistle].map(l => l.id).sort();
  const tokens = [...parse('?layer=' + ids.join(',')).layers].sort();
  assert.deepEqual(tokens, ids);
  assert.deepEqual(parse('?layer=' + ids.join(',')).problems, []);
});

test('the slot layer is `slot` in the URL, not the term we removed', () => {
  // A URL outlives page copy: it survives copy-paste, screenshots and forum
  // posts. Shipping `danger` and renaming later is a broken bookmark, and an
  // id is not exempt from carrying somebody else's definition just because it
  // is not rendered.
  assert.equal(danger.id, 'slot');
  assert.deepEqual([...parse('?layer=slot').layers], ['slot']);
  assert.deepEqual([...parse('?layer=danger').layers], [],
    'the old term must not be a working alias');
});

/* ------------------------------------------------------------- generated links
   `format` is what a "copy link to this moment" button emits. */

test('a generated link omits the ordinal when the clock names one event', () => {
  const g = byId('2023020105');
  const counts = new Map();
  for (const e of g.events) counts.set(e.per + '|' + e.rem, (counts.get(e.per + '|' + e.rem) || 0) + 1);
  // FOUND, NOT ASSUMED. This game has no (period, clock, TYPE) collision, which
  // is not the same as no (period, clock) collision -- three of its events can
  // still share a second. Picking an index by hand assumed the stronger fact.
  const sole = g.events.findIndex(e => counts.get(e.per + '|' + e.rem) === 1);
  assert.ok(sole > 0);
  const q = format({ game: g.id, events: g.events, index: sole, layers: [], strength: 'all' });
  assert.ok(!/\./.test(new URLSearchParams(q).get('at')), `expected no ordinal in ${q}`);
});

test('a generated link carries the ordinal whenever the clock is shared', () => {
  const g = byId('2024030413');
  const counts = new Map();
  for (const e of g.events) counts.set(e.per + '|' + e.rem, (counts.get(e.per + '|' + e.rem) || 0) + 1);
  let shared = 0;
  for (const [i, e] of g.events.entries()) {
    if (counts.get(e.per + '|' + e.rem) < 2) continue;
    const at = new URLSearchParams(format({ game: g.id, events: g.events, index: i, layers: [], strength: 'all' })).get('at');
    assert.match(at, /\.\d+$/, `event ${i} shares its clock and must be disambiguated`);
    shared++;
  }
  assert.ok(shared > 20, `expected many shared clocks in this game, saw ${shared}`);
});

test('the mode is always in the link, because the mode is part of the number', () => {
  // Every counted number on the page is measured under a strength mode; the
  // scoreboard carries MODE() beside it for exactly this reason. A link that
  // drops it is a screenshot cropped above the label.
  const g = byId('2023020105');
  for (const strength of ['even', 'all']) {
    const q = format({ game: g.id, events: g.events, index: 10, layers: ['corsi'], strength });
    assert.equal(new URLSearchParams(q).get('strength'), strength);
  }
});

test('ROUND TRIP — and what it cannot see', () => {
  // This validates the generator against the resolver and NOTHING ELSE. It
  // cannot see a bare-clock bug (the generator always disambiguates), it cannot
  // see a wrong sentence attached to a right link, and it would have passed
  // while the faceoff defect above shipped. It earns its place only because
  // every test before it starts from the game rather than from our own output.
  for (const g of GAMES) {
    for (const [i] of g.events.entries()) {
      const q = format({ game: g.id, events: g.events, index: i, layers: [], strength: 'all' });
      const s = parse('?' + q.replace(/^\?/, ''));
      const r = resolve(g.events, s.at);
      assert.equal(r.index, i, `${g.id} event ${i} did not survive its own link`);
      assert.equal(r.exact, true);
      assert.equal(r.why, null);
    }
  }
});

/**
 * ⭐ WHICH RINK — the `ends` vocabulary (B1).
 *
 * as-played is the ruled DEFAULT and `fixed` is the control CHENG held must
 * survive. The parser is the only thing that knows the words, so this is where
 * they are pinned: a default that drifts silently would change what every
 * unadorned visit draws.
 */
test('ends defaults to as-played, which is the ruling', () => {
  assert.equal(parse('').ends, 'as-played');
  assert.equal(parse('?game=123').ends, 'as-played');
});

test('ends=fixed reaches the control, and is not an error', () => {
  const p = parse('?ends=fixed');
  assert.equal(p.ends, 'fixed');
  assert.deepEqual(p.problems, [], 'the control is a supported destination, not a mistake');
});

test('an unreadable ends is named and defaulted, never silently repaired', () => {
  const p = parse('?ends=sideways');
  assert.equal(p.ends, 'as-played', 'a bad value must fall back to the ruled default');
  assert.equal(p.problems.length, 1);
  assert.match(p.problems[0], /ends: "sideways" is not as-played or fixed/);
});

test('ends is case- and space-tolerant, like strength', () => {
  assert.equal(parse('?ends=%20FIXED%20').ends, 'fixed');
});

/**
 * ⭐ THE ROUND TRIP IS THE INVARIANT — format → parse → resolve returns the frame
 * it started from, for every moment a viewer can share.
 *
 * CHENG asked for exactly this when the copy control was designed, and asked it
 * of the SHOOTOUT in particular: the shootout's events are excluded from every
 * count and its coordinates are not positions, so a link landing there was
 * expected to resolve somewhere odd or need refusing.
 *
 * ⭐ MEASURED, AND THE FINDING IS REFUTED. Over 160,012 shareable moments in 607
 * games (this corpus plus a stratified 600-game archive sample), 0 land on a
 * different event — including all 319 shootout attempts. The whole shootout
 * shares ONE clock, `5-00:00`, with up to 25 events on it, and the ordinal
 * carries them exactly. Ordinals are not a shootout special case: 28.8% of ALL
 * shareable moments need one, and the largest seen is `.27`.
 *
 * THE PATH IS INDEPENDENT: the expectation is the index the walk started from,
 * and the answer comes back through the parser a visitor's browser runs.
 */
test('every shareable moment round-trips to the frame it was copied from', () => {
  const dir = new URL('./fixtures/extracts/', import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  assert.ok(files.length >= 5, 'the fixture corpus has shrunk — this check needs games');
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  let checked = 0, shootout = 0, ordinals = 0;
  for (const f of files) {
    const g = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    for (let n = 0; n < g.events.length; n++) {
      if (SKIP.has(g.events[n].type)) continue;          // the transport cannot stop here
      const q = format({ game: g.game.id, events: g.events, index: n, layers: ['slot'] });
      const back = parse(new URLSearchParams(q));
      assert.equal(resolve(g.events, back.at).index, n,
        `${f}: the link for event ${n} (${g.events[n].type}) opens somewhere else — ${q}`);
      checked++;
      if (g.events[n].pt === 'SO') shootout++;
      if (/\.\d+$/.test(back.at.raw || q.match(/at=([^&]*)/)[1])) ordinals++;
    }
  }
  assert.ok(checked > 1000, `only ${checked} moments were round-tripped`);
  // ⭐ AND THE HARD CASES WERE ACTUALLY IN IT. Without these the check above is
  // satisfied by a corpus of games where every clock is unique.
  assert.ok(shootout > 0, 'no shootout moment was tested — the case CHENG raised');
  assert.ok(ordinals > 0, 'no moment needed an ordinal, so the shared-clock path never ran');
});

/**
 * ⭐ THE LINK IS READ BY PEOPLE, so the clock in it is a clock.
 *
 * `URLSearchParams.toString()` percent-encodes the colon, and a control whose
 * whole purpose is producing something to paste in public was emitting
 * `at=1-07%3A45.2` where `at=1-07:45.2` reads as a time. Kevin pasted a real
 * one and it was the first thing either of us looked at.
 *
 * RFC 3986 §3.4 admits `:` in a query unencoded, and the decoded value is
 * identical — which is asserted here rather than argued, both ways round, so a
 * link already shared in the encoded form is proven to still work.
 */
test('a shared link carries a readable clock, and both spellings resolve alike', () => {
  const g = JSON.parse(readFileSync(new URL('./fixtures/extracts/2023020105.json', import.meta.url), 'utf8'));
  const SKIP = new Set(['stoppage', 'period-start', 'period-end', 'game-end', 'delayed-penalty']);
  let checked = 0;
  for (let n = 0; n < g.events.length; n++) {
    if (SKIP.has(g.events[n].type)) continue;
    const q = format({ game: g.game.id, events: g.events, index: n, layers: ['slot'] });
    assert.doesNotMatch(q, /%3A/, `event ${n}: the clock is percent-encoded — ${q}`);
    assert.match(q, /at=\d+-\d\d:\d\d/, `event ${n}: the clock is not a clock — ${q}`);

    // ⭐ AND THE OLD SPELLING STILL LANDS IN THE SAME PLACE. Links shared before
    // this change carry `%3A`; if this ever stops holding, every one of them
    // breaks silently and nobody finds out from us.
    const old = q.replace(/:/g, '%3A');
    assert.notEqual(old, q, 'the two spellings are identical, so this proves nothing');
    assert.equal(resolve(g.events, parse(new URLSearchParams(old)).at).index,
                 resolve(g.events, parse(new URLSearchParams(q)).at).index,
                 `event ${n}: the encoded and readable forms open different frames`);
    checked++;
  }
  assert.ok(checked > 100, `only ${checked} links were checked`);
});
