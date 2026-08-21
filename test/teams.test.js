/**
 * The team table — reference data, and the only hand-entered table on the site.
 *
 * A colour cannot be "wrong" the way a count can, so these tests do not check
 * hues. They check the two things that CAN break silently:
 *
 *   COMPLETENESS   the page renders the team set read from the CATALOG. A team in
 *                  the archive with no entry here is a blank chip nobody notices
 *                  until a fan cannot find their club.
 *   READABILITY    a chip whose ink matches its background is invisible, and the
 *                  failure is per-team, so eyeballing two of them proves nothing.
 *
 * The completeness test is the one that matters, and it is a live check against
 * the fixture below rather than against my memory: Arizona relocated to Utah
 * INSIDE this archive's window, so the correct answer is 33 and "the NHL has 32
 * teams" would have been wrong on the first day.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEAMS, NOTES, inkOn, nameOf, colourOf, NEUTRAL, contrast } from '../src/lib/teams.js';

/**
 * Every team appearing in an in-scope game of the live archive, 2026-08-11.
 * Pinned as a fixture rather than fetched: a test that reaches the network fails
 * for reasons that are not about the code. When the league adds a team this list
 * is what has to change, deliberately, alongside TEAMS.
 *
 * ⚠️ AND THAT IS THE LIMIT OF WHAT THIS FILE CAN DO. A pinned list cannot notice
 * a club it has never been told about: an expansion team would arrive, render as
 * a grey chip, and leave every test here green until a human re-pinned the list
 * above. This is the EDIT-TIME half of the guard, and it was mistaken for the
 * whole of it — teams.js said so in a sentence that has now been corrected.
 * The day-it-happens half is in `builders/measure.mjs`, which walks the real
 * archive and exits non-zero on a club with no entry.
 */
const IN_ARCHIVE = [
  'ANA', 'ARI', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL', 'DET',
  'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR', 'OTT', 'PHI',
  'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'UTA', 'VAN', 'VGK', 'WPG', 'WSH',
];

test('every team in the archive can be rendered', () => {
  const missing = IN_ARCHIVE.filter(ab => !TEAMS[ab]);
  assert.deepEqual(missing, [], 'a team with no entry renders as a blank chip');
});

test('the archive contains 33 teams, because Arizona became Utah inside our window', () => {
  // Not trivia. This number is the reason the team set is read from the catalog
  // rather than typed, and the reason ARI is in the table at all.
  assert.equal(IN_ARCHIVE.length, 33);
  assert.ok(IN_ARCHIVE.includes('ARI') && IN_ARCHIVE.includes('UTA'));
});

test('a team the archive no longer has still explains itself', () => {
  // A fan clicking ARI finds one season and then nothing. An empty run of dates
  // is not an answer; the relocation is.
  assert.match(NOTES.ARI, /relocated to utah/i);
  assert.match(NOTES.UTA, /2024-25/);
});

test('no entry carries a league or club mark', () => {
  // Colours and abbreviations identify a team. Logos and wordmarks do not appear
  // on this site, and the front page says so — so this table must not become the
  // place one quietly arrives.
  const blob = JSON.stringify(TEAMS);
  assert.doesNotMatch(blob, /logo|svg|\.png|\.jpg|http/i);
});

test('every chip is legible — MEASURED, per team, not sampled', () => {
  // This asserted a Rec. 601 luma GAP of 0.35, which is a proxy for contrast and
  // not contrast. It passed while Anaheim's chip sat at 2.73:1 — under WCAG's
  // 3:1 floor for even large text — because the proxy and the standard disagree
  // in exactly the mid-luma region where the hard cases live. Assert the
  // published measure instead of a stand-in for it.
  for (const [ab, t] of Object.entries(TEAMS)) {
    assert.match(t.colour, /^#[0-9A-F]{6}$/, `${ab}: colour must be a 6-digit hex`);
    const c = contrast(inkOn(t.colour), t.colour);
    assert.ok(c >= 4.5,
      `${ab}: ${inkOn(t.colour)} on ${t.colour} is ${c.toFixed(2)}:1, under WCAG's 4.5`);
  }
});

test('the ink is the one that measurably contrasts more, with no threshold', () => {
  // A guard against a function that returns one constant and passes the loop
  // above by luck, and against the luma heuristic coming back. The three clubs
  // below are the ones the heuristic got wrong.
  assert.equal(inkOn('#FFB81C'), '#0f1a23', 'dark ink on a light chip');
  assert.equal(inkOn('#003087'), '#ffffff', 'light ink on a dark chip');
  for (const [ab, hex, was] of [['ANA', '#F47A38', 2.73], ['VGK', '#B4975A', 2.79],
                                ['PHI', '#F74902', 3.55]]) {
    const now = contrast(inkOn(hex), hex);
    assert.ok(now > was + 1,
      `${ab}: ${now.toFixed(2)}:1 is no better than the ${was}:1 the heuristic gave`);
  }
});

test('an unknown abbreviation degrades to itself rather than to nothing', () => {
  // The set comes from the catalog, so an abbreviation we have never seen is
  // possible. Rendering "undefined" would be worse than rendering the code.
  assert.equal(nameOf('ZZZ'), 'ZZZ');
  assert.equal(nameOf('BUF'), 'Buffalo Sabres');
});

test('a team the table cannot answer for gets nobody\'s colour, never undefined', () => {
  // 42 games in the archive are national sides or All-Star squads. They open on
  // the game page, and `undefined` reaching a CSS custom property is an INVISIBLE
  // MARK -- a failure that looks like a rendering choice.
  assert.equal(colourOf('FIN'), NEUTRAL);
  assert.equal(colourOf('MCD'), NEUTRAL);
  assert.equal(colourOf('WSH'), TEAMS.WSH.colour);
  for (const ab of Object.keys(TEAMS)) {
    assert.match(colourOf(ab), /^#[0-9A-F]{6}$/i, `${ab}: no colour`);
  }
});

test('the identical-colour matchups are real, so colour alone cannot carry identity', () => {
  // THE REASON THE GAME PAGE PAINTS THE VISITOR AS AN OUTLINE. Five matchups in
  // the archive have byte-identical primaries -- 45 games where a page that
  // distinguishes teams BY COLOUR distinguishes nothing at all. Pinned here so
  // that a future edit "fixing" one of these colours does not quietly remove the
  // only evidence for the design.
  const clashes = [['BOS', 'NSH'], ['DET', 'NJD'], ['EDM', 'WPG'],
                   ['FLA', 'WSH'], ['TOR', 'VAN']];
  for (const [x, y] of clashes) {
    assert.equal(colourOf(x), colourOf(y),
      `${x} and ${y} no longer share a colour — if that is a deliberate correction, `
      + `the second channel is still required for the others`);
  }
});
