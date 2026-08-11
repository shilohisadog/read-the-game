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
import { TEAMS, NOTES, inkOn, nameOf } from '../src/lib/teams.js';

/**
 * Every team appearing in an in-scope game of the live archive, 2026-08-11.
 * Pinned as a fixture rather than fetched: a test that reaches the network fails
 * for reasons that are not about the code. When the league adds a team this list
 * is what has to change, deliberately, alongside TEAMS.
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

test('every chip is legible — checked per team, not sampled', () => {
  for (const [ab, t] of Object.entries(TEAMS)) {
    assert.match(t.colour, /^#[0-9A-F]{6}$/, `${ab}: colour must be a 6-digit hex`);
    const ink = inkOn(t.colour);
    const [r, g, b] = [1, 3, 5].map(i => parseInt(t.colour.slice(i, i + 2), 16));
    const bg = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const fg = ink === '#ffffff' ? 1 : 0.06;
    assert.ok(Math.abs(bg - fg) > 0.35,
      `${ab}: ${t.colour} on ${ink} is too close to read`);
  }
});

test('ink flips on both sides of the threshold', () => {
  // A guard against a function that returns one constant and passes the loop
  // above by luck. Boston gold and Buffalo navy are real cases from the table.
  assert.equal(inkOn('#FFB81C'), '#0f1a23', 'dark ink on a light chip');
  assert.equal(inkOn('#003087'), '#ffffff', 'light ink on a dark chip');
});

test('an unknown abbreviation degrades to itself rather than to nothing', () => {
  // The set comes from the catalog, so an abbreviation we have never seen is
  // possible. Rendering "undefined" would be worse than rendering the code.
  assert.equal(nameOf('ZZZ'), 'ZZZ');
  assert.equal(nameOf('BUF'), 'Buffalo Sabres');
});
