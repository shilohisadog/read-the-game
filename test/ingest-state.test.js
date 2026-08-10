/**
 * What the front page says about its own data — the five states plus the edges.
 *
 * The reason this is a module with tests rather than a few lines of template is
 * that it makes claims to a reader about how current our data is, and a wrong
 * claim there is worse than no claim: "data through 8 August" on a pipeline that
 * died in July is exactly the confident-and-wrong failure this project treats as
 * the most expensive kind.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { describe, formatDate, daysBetween, STALE_HOURS } from '../src/lib/ingest-state.js';

const NOW = '2026-01-15T12:00:00Z';
const idx = (o = {}) => ({
  dataThrough: '2026-01-14',
  lastRun: '2026-01-15T11:00:00Z',
  halted: null,
  coverage: { windowDays: 14, finalInWindow: 7, heldInWindow: 7,
              erroredInWindow: 0, refusedInWindow: 0, unknownStateInWindow: 0,
              asOf: '2026-01-15T11:00:00Z' },
  games: [],
  ...o,
});

const text = r => r.lines.join(' ');

test('a date is formatted without letting a timezone move it', () => {
  // Date.parse('2026-01-14') is UTC midnight; rendering it in a western
  // timezone would show the 13th. The date has no time, so it gets none.
  assert.equal(formatDate('2026-01-14'), '14 January 2026');
  assert.equal(formatDate('2023-11-10'), '10 November 2023');
  assert.equal(formatDate('nonsense'), null);
  assert.equal(formatDate(undefined), null);
});

test('healthy and current: the data date, and nothing else', () => {
  const r = describe(idx(), NOW);
  assert.equal(r.state, 'current');
  assert.equal(text(r), 'Data through 14 January 2026.');
  assert.doesNotMatch(text(r), /checked/i, 'nobody needs telling the job ran an hour ago');
});

test('healthy with no hockey: says so, and is NOT reported as stale', () => {
  // The offseason case that motivated the whole redesign. A single field made
  // this indistinguishable from a dead pipeline; here they are different states
  // with different sentences.
  const r = describe(idx({ dataThrough: '2023-11-10',
    coverage: { windowDays: 14, finalInWindow: 0, heldInWindow: 0,
                erroredInWindow: 0, refusedInWindow: 0 } }), NOW);
  assert.equal(r.state, 'quiet');
  assert.match(text(r), /Data through 10 November 2023\./);
  assert.match(text(r), /No games in the last 14 days\./);
  assert.doesNotMatch(text(r), /paused|checked/i);
});

test('a dead pipeline is a different state from a quiet one', () => {
  const dead = describe(idx({ lastRun: '2026-01-11T11:00:00Z' }), NOW);
  const quiet = describe(idx({ coverage: { windowDays: 14, finalInWindow: 0, heldInWindow: 0 } }), NOW);
  assert.equal(dead.state, 'stalled');
  assert.equal(quiet.state, 'quiet');
  assert.notEqual(text(dead), text(quiet), 'the two must not read the same');
});

test('stale carries the cadence, because a gap means nothing without one', () => {
  // Doctrine §8 turned on our own reliability: "last checked 4 days ago" is
  // uninterpretable unless the reader knows what normal is.
  const r = describe(idx({ lastRun: '2026-01-11T11:00:00Z' }), NOW);
  assert.equal(r.state, 'stalled');
  assert.match(text(r), /Checked daily\./, 'the base rate ships with the number');
  assert.match(text(r), /Last checked 4 days ago\./);
  assert.match(text(r), /Data through 14 January 2026\./, 'the data date is still shown');
});

test('the staleness threshold is a boundary, not a vibe', () => {
  const at = h => describe(idx({
    lastRun: new Date(Date.parse(NOW) - h * 3600000).toISOString() }), NOW).state;
  assert.equal(at(STALE_HOURS - 1), 'current', 'just inside is not stale');
  assert.equal(at(STALE_HOURS + 1), 'stalled', 'just outside is');
});

test('behind: the count of what we have against what was played', () => {
  const r = describe(idx({ coverage: {
    windowDays: 14, finalInWindow: 7, heldInWindow: 3, erroredInWindow: 4, refusedInWindow: 0 } }), NOW);
  assert.equal(r.state, 'behind');
  assert.match(text(r), /We have 3 of the 7 games played in the last 14 days\./);
});

test('behind never says "still loading"', () => {
  // It promises progress we cannot guarantee — a claim about a future rather
  // than a count, the same class of error as "Buffalo had stopped trying to
  // score". A refused game will never load, and telling a novice to wait for it
  // is worse than saying nothing.
  const r = describe(idx({ coverage: {
    windowDays: 14, finalInWindow: 7, heldInWindow: 3, erroredInWindow: 3, refusedInWindow: 1 } }), NOW);
  assert.doesNotMatch(text(r), /still loading|loading|coming soon|shortly/i);
  assert.match(text(r), /1 is not published/, 'a refusal is named as a refusal');
});

test('a refused game is reported separately from a missing one', () => {
  const refused = describe(idx({ coverage: {
    windowDays: 14, finalInWindow: 7, heldInWindow: 6, erroredInWindow: 0, refusedInWindow: 1 } }), NOW);
  const errored = describe(idx({ coverage: {
    windowDays: 14, finalInWindow: 7, heldInWindow: 6, erroredInWindow: 1, refusedInWindow: 0 } }), NOW);
  assert.match(text(refused), /not published/);
  assert.doesNotMatch(text(errored), /not published/,
    'a fetch that may retry must not be described as a refusal');
});

test('a night we could not read never reports as "no games"', () => {
  // THE FALSE SENTENCE. `finalInWindow` counts games we RECOGNISED as final, so
  // a window where every game sits in a state we don't know gives zero — and the
  // page said "No games in the last 14 days" while the league played 56. That is
  // not a missing claim, it is a wrong one, generated entirely by our own
  // ignorance, and it was guaranteed to ship the moment preseason was ingested:
  // all 56 preseason games are in state FINAL, which we had never seen.
  const r = describe(idx({
    coverage: { windowDays: 14, gamesInWindow: 56, finalInWindow: 0, heldInWindow: 0,
                erroredInWindow: 0, refusedInWindow: 0, unknownStateInWindow: 56 },
  }), NOW);
  assert.equal(r.state, 'behind', 'games were played; this is not a quiet night');
  assert.doesNotMatch(text(r), /No games in the last/,
    'the league played 56 games — saying otherwise is a false claim about the world');
  assert.match(text(r), /0 of the 56 games/);
  assert.match(text(r), /56 .*state we don't recognise/);
});

test('the denominator is what the league played, not what we understood', () => {
  // The old sentence compared what we hold against what we managed to read,
  // which flatters us exactly when we are doing worst: 10 of 10, while 90 more
  // were played and silently dropped. A reader asking "how much of the hockey do
  // you have" is asking about the hockey.
  const r = describe(idx({
    coverage: { windowDays: 14, gamesInWindow: 100, finalInWindow: 10, heldInWindow: 10,
                erroredInWindow: 0, refusedInWindow: 0, unknownStateInWindow: 90 },
  }), NOW);
  assert.equal(r.state, 'behind');
  assert.match(text(r), /10 of the 100 games/);
});

test('a genuinely quiet window still reads as quiet', () => {
  // MUTATION GUARD. If the fix above were "never say quiet", the offseason — the
  // state the live site is in right now — would start reporting a shortfall
  // against zero games. Nothing was played, so nothing is missing.
  const r = describe(idx({
    coverage: { windowDays: 14, gamesInWindow: 0, finalInWindow: 0, heldInWindow: 0,
                erroredInWindow: 0, refusedInWindow: 0, unknownStateInWindow: 0 },
  }), NOW);
  assert.equal(r.state, 'quiet');
  assert.match(text(r), /No games in the last 14 days/);
});

test('an index written before gamesInWindow existed still renders truthfully', () => {
  // The live index has no `gamesInWindow` and will not until the next run. The
  // fallback must be derived from what such an index does carry, not assumed to
  // be zero — assuming would reintroduce the false sentence on exactly the
  // indexes that predate the fix.
  const r = describe(idx({
    coverage: { windowDays: 14, finalInWindow: 4, heldInWindow: 4,
                erroredInWindow: 0, refusedInWindow: 0, unknownStateInWindow: 3 },
  }), NOW);
  assert.equal(r.state, 'behind');
  assert.match(text(r), /4 of the 7 games/, 'reconstructed as final + unknown');
});

test('refused and unreadable are different facts and get different sentences', () => {
  // Refused: we hold the bytes and the event vocabulary defeated us.
  // Unknown state: we never fetched, because we could not tell the game was over.
  // Folding them together would report a cause we have not established.
  const r = describe(idx({
    coverage: { windowDays: 14, gamesInWindow: 10, finalInWindow: 8, heldInWindow: 6,
                erroredInWindow: 0, refusedInWindow: 2, unknownStateInWindow: 2 },
  }), NOW);
  const t = text(r);
  assert.match(t, /6 of the 10 games/);
  assert.match(t, /2 are not published/);
  assert.match(t, /2 .*state we don't recognise/);
});

test('halted explains itself, and outranks staleness', () => {
  const r = describe(idx({
    halted: { since: '2026-01-09T11:00:00Z', reason: "gameState 'PPD' in 4 games" },
    lastRun: '2026-01-15T11:00:00Z' }), NOW);
  assert.equal(r.state, 'halted');
  assert.match(text(r), /Updates paused 9 January 2026\./);
  assert.match(text(r), /stopped rather than guess/);
});

test('halted AND stale says both, because they are different facts', () => {
  const r = describe(idx({
    halted: { since: '2026-01-09T11:00:00Z', reason: 'x' },
    lastRun: '2026-01-10T11:00:00Z' }), NOW);
  assert.equal(r.state, 'halted', 'the halt is the more informative label');
  assert.match(text(r), /Updates paused/);
  assert.match(text(r), /Last checked 5 days ago/, 'and the pipeline also stopped running');
});

test('no line ever states a diagnosis', () => {
  // The rule the whole module exists to hold. Every state, checked at once.
  const states = [
    describe(null, NOW),
    describe(idx(), NOW),
    describe(idx({ lastRun: '2026-01-01T00:00:00Z' }), NOW),
    describe(idx({ halted: { since: '2026-01-09T11:00:00Z', reason: 'x' } }), NOW),
    describe(idx({ coverage: { windowDays: 14, finalInWindow: 7, heldInWindow: 2 } }), NOW),
    describe(idx({ lastRun: undefined }), NOW),
  ];
  for (const r of states) {
    assert.doesNotMatch(text(r), /broken|failed|error|sorry|apologi|unfortunately|oops/i,
      `${r.state}: "${text(r)}"`);
    assert.ok(r.lines.length > 0 && r.lines.every(l => l.endsWith('.')),
      `${r.state}: every line is a complete sentence`);
  }
});

test('a missing lastRun says unknown rather than substituting the old field', () => {
  // The migration case. Falling back to `lastIngest` would silently reassert the
  // conflation the new schema exists to end, and would claim a freshness we
  // cannot support.
  const r = describe({ dataThrough: '2026-01-14', lastIngest: '2026-01-15T11:00:00Z' }, NOW);
  assert.equal(r.state, 'unknown');
  assert.match(text(r), /When we last checked is unknown\./);
  assert.doesNotMatch(text(r), /Checked daily/);
});

test('no index at all is a state, not a crash', () => {
  for (const bad of [null, undefined, '', 0]) {
    const r = describe(bad, NOW);
    assert.equal(r.state, 'empty');
    assert.equal(text(r), 'No data loaded yet.');
  }
});

test('an index with no games yet still renders', () => {
  const r = describe({ lastRun: '2026-01-15T11:00:00Z', games: [] }, NOW);
  assert.equal(text(r).startsWith('No games loaded yet.'), true);
});

test('daysBetween is whole days and refuses nonsense', () => {
  assert.equal(daysBetween('2026-01-11T11:00:00Z', NOW), 4);
  assert.equal(daysBetween('2026-01-15T11:00:00Z', NOW), 0);
  assert.equal(daysBetween('nope', NOW), null);
});
