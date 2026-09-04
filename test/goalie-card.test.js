/**
 * ⭐⭐ THE GOALTENDING CARDS, AND WHAT THEY REFUSE TO SAY.
 *
 * This is the surface where the site's whole argument is most exposed. A save
 * percentage is the number a reader expects and the number we will not print:
 * ".943" invites a comparison across a season, and one game cannot support one.
 * The card says "33 of 35" instead, and states its own limit.
 *
 * ⚠️ THOSE ARE CLAIMS, AND UNTIL NOW THEY WERE GUARDED ONLY BY A RENDERED DIFF.
 * `test/fixtures/dom-golden.json` pins `#goaliePanel` across 61 states, which
 * catches a card that CHANGED. It cannot catch a card that is WRONG, and it can
 * only ever see the two goaltenders in one game — both of whom faced plenty of
 * shots. The cases that matter most here are the thin ones, and no fixture we
 * own contains them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goalieCards } from '../src/lib/goalie-card.js';

const G = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
const AID = G.teams.away.id, AAB = G.teams.away.ab, HAB = G.teams.home.ab;
const CLUBS = { AID, AAB, HAB, mode: 'all situations' };

const card = (st, p = { nm: 'Levi', n: 73, tid: G.teams.home.id }) =>
  goalieCards(['g1'], { g1: p }, { g1: st }, CLUBS);

test('⭐ the real game renders both goaltenders', () => {
  const stats = Object.fromEntries(G.goalies.map(id => [id, { f: 30, s: 28, gl: 2, hf: 5, hs: 4 }]));
  const html = goalieCards(G.goalies, G.roster, stats, CLUBS);
  assert.equal((html.match(/class="gcard"/g) || []).length, G.goalies.length,
               'the panel is not drawing one card per goaltender');
  for (const id of G.goalies) assert.ok(html.includes(G.roster[id].nm), `${id} is missing`);
});

test('⛔ it prints a fraction and NEVER a save percentage', () => {
  /* ⭐ THE REFUSAL IS THE FEATURE. `.943` reads as a rate you can carry to
     another game; `33 of 35` cannot be carried anywhere, which is the honest
     shape for a single game. A card that started printing a decimal would be
     this site making the exact claim it was built to argue against. */
  const html = card({ f: 35, s: 33, gl: 2, hf: 0, hs: 0 });
  assert.match(html, /33 of 35/, 'the fraction is gone');
  assert.doesNotMatch(html, /\.9\d\d|0\.\d\d\d|\d\d\.\d%/,
    'a save percentage appeared on the goaltending card, which is the one number '
    + 'this surface exists to refuse');
});

test('⛔ …and the limit is on EVERY card, not only the thin ones', () => {
  /* ⚠️ SELECTIVE HONESTY IS WORSE THAN NONE — DOCTRINE §9. Showing the caveat
     only where the sample was small made a 35-shot game look like a rate you
     could compare. Both of these must carry it. */
  for (const st of [{ f: 2, s: 2, gl: 0, hf: 0, hs: 0 }, { f: 60, s: 57, gl: 3, hf: 0, hs: 0 }])
    assert.match(card(st), /one game — what happened, not how unusual it was/,
                 `a card with ${st.f} shots faced dropped its limit`);
});

test('⛔ no shots faced is an em dash, not a zero-of-zero', () => {
  /* A goaltender who has faced nothing has no fraction, and "0 of 0" is a
     claim about a measurement that did not happen — the same rule `archive.js`
     states for a rate over an empty population. */
  const html = card({ f: 0, s: 0, gl: 0, hf: 0, hs: 0 });
  assert.match(html, /class="gsv">—</, 'an unfaced goaltender is not shown a dash');
  assert.doesNotMatch(html, /0 of 0/, 'the card invented a fraction out of no shots');
});

test('⭐ the slot line appears only when slot shots were faced', () => {
  assert.match(card({ f: 20, s: 18, gl: 2, hf: 6, hs: 5 }), /from the slot 5 of 6/);
  assert.doesNotMatch(card({ f: 20, s: 18, gl: 2, hf: 0, hs: 0 }), /from the slot/,
    'a goaltender who faced nothing from the slot was given a slot line anyway');
});

test('⭐ the card takes its club\'s side, and both sides are exercised', () => {
  /* ⛔ A TWO-TONE CARD TESTED ON ONE TEAM IS A TEST OF A CONSTANT. */
  const away = card({ f: 1, s: 1, gl: 0, hf: 0, hs: 0 }, { nm: 'X', n: 1, tid: AID });
  const home = card({ f: 1, s: 1, gl: 0, hf: 0, hs: 0 }, { nm: 'Y', n: 2, tid: G.teams.home.id });
  assert.match(away, new RegExp(`class="gname a"[\\s\\S]*${AAB}`), 'the away card is not the away side');
  assert.match(home, new RegExp(`class="gname h"[\\s\\S]*${HAB}`), 'the home card is not the home side');
});

test('⭐ the strength mode is stated on the card, because it changes the count', () => {
  assert.match(goalieCards(['g1'], { g1: { nm: 'Z', n: 1, tid: AID } },
                           { g1: { f: 5, s: 5, gl: 0, hf: 0, hs: 0 } },
                           { ...CLUBS, mode: 'even strength' }), /\(even strength\)/,
    'the card does not say which situations its shots were counted under');
});

test('⛔ a goaltender the roster does not know is skipped, not half-drawn', () => {
  const html = goalieCards(['ghost'], {}, {}, CLUBS);
  assert.equal(html, '', 'an unknown id produced markup with no name in it');
});
