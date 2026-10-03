/**
 * THE PUBLISHED MEASUREMENT AGAINST THE PUBLISHED ARCHIVE.
 *
 * `tools/measured-through.mjs` is the half `measure.mjs` cannot do: its own
 * guards run at WRITE time against the catalog of their own run, and the two
 * documents then drift apart by design, because `measures.json` is rebuilt
 * weekly and `catalog.json` nightly. For four days in October the published
 * measurement covered 8 games of the season while the published archive held 21.
 *
 * ⚠️ EVERY FIXTURE HERE IS BUILT BY HAND AND THAT IS NOT LAZINESS. Every other
 * fixture in this repo derives its distributions FROM its own games, so measured
 * and held agree by construction and no existing fixture can exhibit the defect.
 * The ones below give the two documents different contents on purpose.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spans, judge } from '../tools/measured-through.mjs';

/** A published, in-scope catalog row. */
const row = (id, d) => ({ id, v: 1, t: 2, d });
const cat = (...games) => ({ games });

/** A measures.json with the stamps the check reads and nothing else. */
const meas = (through, perGame) => ({ dataThrough: through,
  perGame: Object.fromEntries(Object.entries(perGame).map(([y, [d, n]]) =>
    [y, { dataThrough: d, corsi: { n } }])) });

const verdict = (c, m, i) => judge(spans(c, m, i));

test('⭐ it is silent when the measurement describes the archive — the control', () => {
  /* The paired half, and it is not optional: "it refuses" is satisfied by a
     check that refuses always, which inside the nightly would be a red every
     night of the season and switched off within a week. */
  const c = cat(row(2026020001, '2026-10-01'), row(2026020002, '2026-10-02'));
  const m = meas('2026-10-02', { 2026: ['2026-10-02', 2] });
  assert.deepEqual(verdict(c, m, { dataThrough: '2026-10-02' }), []);
});

test('⭐⭐ THE DEFECT ITSELF: 21 published, 8 measured, and the dates say so', () => {
  /* ⛔⛔⛔ THE SENTENCE A READER WAS GIVEN. Kevin, 2026-10-03: *"we hold 21 games
     and say 8 games."* The archive published games of the season through
     2026-10-02; the measurement stopped at 2026-09-30 and its `n` was 8. Both
     documents were internally correct and nothing compared them.
     MUTATION: change the per-season `!==` to a `>=`, or drop the per-season loop
     and keep only the document-level equality, and this test is the one that
     goes — the document-level span can match while a season's does not, which is
     the next shape of this defect. */
  const rows = [];
  for (let k = 1; k <= 21; k++)
    rows.push(row(2026020000 + k, k <= 8 ? '2026-09-30' : '2026-10-02'));
  // 2025 is finished and agrees, so the fault is isolated to the season in play.
  rows.push(row(2025030417, '2026-06-14'));
  const c = cat(...rows);
  const m = meas('2026-10-02',                  // the DOCUMENT-level span matches
                 { 2025: ['2026-06-14', 1394], 2026: ['2026-09-30', 8] });
  const bad = verdict(c, m, { dataThrough: '2026-10-02' });
  assert.equal(bad.length, 1, `expected exactly the season fault, got: ${bad.join(' | ')}`);
  assert.match(bad[0], /2026: measured through 2026-09-30 \(8 game\(s\)\)/);
  assert.match(bad[0], /publishes 21 through 2026-10-02/);
});

test('⛔ a document-level span behind the archive is a refusal', () => {
  const c = cat(row(2026020001, '2026-10-01'), row(2026020002, '2026-10-02'));
  const m = meas('2026-10-01', { 2026: ['2026-10-01', 1] });
  const bad = verdict(c, m, { dataThrough: '2026-10-02' });
  assert.ok(bad.some(b => /does not describe the published archive/.test(b)));
});

test('⛔ a season the archive publishes and the measurement has never seen', () => {
  /* The state the overlay falls back to a BORROWED yardstick in. It is not a
     crash and nothing on the page says it happened, which is why it has to be
     said here. */
  const c = cat(row(2025030417, '2026-06-14'), row(2026020001, '2026-10-02'));
  const m = meas('2026-10-02', { 2025: ['2026-06-14', 1394] });
  const bad = verdict(c, m, { dataThrough: '2026-10-02' });
  assert.ok(bad.some(b => /no entry for that season at all/.test(b)), bad.join(' | '));
});

test('⭐⭐ AN INDEX NEWER THAN THE MEASUREMENT IS CORRECT, and the spec said otherwise', () => {
  /* ⛔⛔⛔ THE ONE LINE OF THE SPEC THAT WAS UNSOUND, measured before it was
     built. docs/status.md §0.00 wrote the check as a three-way equality ending
     `== index.json dataThrough`. That field is the newest game date over EVERY
     game held — `fetch_nhl.py`: *"NOTHING HERE FILTERS ON IT — everything the
     league calls final is ingested, including exhibition hockey."* Of the 4,639
     games in the index, 385 are preseason and 41 more are All-Star or exhibition
     sides; the measurement covers the 4,213 that are in scope and published.

     Between 2026-09-26 and 2026-10-01 the newest game HELD was a preseason game
     of 2026-09-26 while the newest game in scope was 2026-06-14 — three and a
     half months apart, and both correct. An equality would have been red for the
     whole of preseason, which is an alarm that gets switched off.

     ⭐ So this test exists to stop the check being "tightened" into the shape
     the spec asked for. The fixture is that preseason week.
     MUTATION: make the direction an `!==` and this is the test that goes. */
  const c = cat(row(2025030417, '2026-06-14'));
  const m = meas('2026-06-14', { 2025: ['2026-06-14', 1394] });
  assert.deepEqual(verdict(c, m, { dataThrough: '2026-09-26' }), [],
    'a preseason game in the index was read as the measurement being stale');
});

test('⛔ …but a measurement AHEAD of the index is a corrupt handoff, not staleness', () => {
  /* The other half of the direction. The index covers a superset, so it can only
     be newer or equal; a measurement ahead of it means we have measured hockey
     the ingest has no record of holding. */
  const c = cat(row(2026020001, '2026-10-02'));
  const m = meas('2026-10-02', { 2026: ['2026-10-02', 1] });
  const bad = verdict(c, m, { dataThrough: '2026-10-01' });
  assert.ok(bad.some(b => /no record of|corrupt handoff/.test(b)), bad.join(' | '));
});

test('⛔ an input that is absent or undated is a refusal, never an agreement', () => {
  /* ⛔⛔⛔ THE SHAPE THIS PROJECT HAS ALREADY PAID FOR. A `sed` the shell refused
     exited 0, `$desc` came back empty, `case "" in *[0-9]*)` matched nothing, and
     a deploy guard that read NOTHING approved everything, green, for days. ANY
     check with an extraction step needs an assertion that the extraction found
     something — `undefined === undefined` is the most agreeable comparison there
     is.
     MUTATION: delete any one of the four `faults.push` calls in `spans` and the
     corresponding case here starts passing with nothing read. */
  const good = meas('2026-10-02', { 2026: ['2026-10-02', 1] });
  const c = cat(row(2026020001, '2026-10-02'));
  const idx = { dataThrough: '2026-10-02' };

  assert.ok(verdict(cat(), good, idx).some(b => /lists no games/.test(b)),
    'an empty catalog was read as agreeing');
  assert.ok(verdict(cat({ id: 2026020001, v: 1, t: 2 }), good, idx)
    .some(b => /not one\s+carries a date|not one carries a date/.test(b)),
    'a catalog with no dates was read as agreeing');
  assert.ok(verdict(c, { perGame: {} }, idx).some(b => /carries no `dataThrough`/.test(b)),
    'a measures.json with no stamp was read as agreeing');
  assert.ok(verdict(c, good, {}).some(b => /index\.json carries no/.test(b)),
    'an index with no stamp was read as agreeing');

  /* AND A FAULT STOPS THE REST BEING REPORTED, because a span derived from a
     document that could not be read is not evidence about anything. */
  assert.equal(verdict(cat(), good, idx).length, 1,
    'it reported comparisons it had no inputs for');
});

test('⭐ out-of-scope and refused rows are excluded from the archive’s span', () => {
  /* ⛔ WITHOUT THIS THE NIGHTLY IS RED THROUGH EVERY SEPTEMBER. The catalog holds
     385 preseason games; they are not measured and must not set the archive's
     span. Dated LATER than every in-scope game on purpose, so a scope rule that
     was dropped could not pass this.
     MUTATION: remove either condition from the `published` filter and this fires. */
  const c = cat(row(2026020001, '2026-10-01'),
                { id: 2026010099, v: 1, t: 1, d: '2026-12-25' },   // preseason
                { id: 2026020099, v: 0, t: 2, d: '2026-12-26' });  // refused
  const m = meas('2026-10-01', { 2026: ['2026-10-01', 1] });
  assert.deepEqual(verdict(c, m, { dataThrough: '2026-12-26' }), []);
  assert.equal(spans(c, m, { dataThrough: '2026-12-26' }).archive, '2026-10-01');
});
