/**
 * Archive figures quoted in the analysis tier, checked against the published file.
 *
 * ⚠️⚠️ WRITTEN BECAUSE SIX OF THEM HAD GONE STALE AND NOTHING NOTICED.
 * `sentence.js` opened by arguing from "1,527 of 3,855 games" while
 * `data/measures.json` — the file a reader can fetch and check us with — said
 * 1,560 of 3,925. `archive.js` and `blocked.js` both cited an attempts-leader
 * loss rate of 54.5% against a published 54.3%. Every one was correct when it
 * was written and none had been re-examined after a derive run.
 *
 * ⭐ THE PROJECT HAD ALREADY NOTICED AND NOT ACTED. `docs/measurement-cards.md`
 * says, in its own words, "the attempts null at 54.5% when the published file
 * says 54.3%". A drift recorded in prose and alarmed on by nobody is the exact
 * gap `_vocabulary_seen` in derive.py was written to close, one tier over.
 *
 * ⭐ WHY THIS IS NOT A CONSTANT THAT DRIFTS. Every expected value is READ FROM
 * `measures.json` at test time and formatted the way the comment states it.
 * Nothing here is typed. A test holding last month's percentage would be the
 * defect it is checking for.
 *
 * ⛔⛔⛔ AND THE SENTENCE THAT USED TO FOLLOW WAS A TREADMILL. It read: *"when the
 * archive is re-derived and a rate moves, this goes red naming the file and both
 * figures, and somebody updates the sentence — which is the entire point."* That
 * was true while `measures.json` moved WEEKLY and a person regenerated it. On
 * 2026-10-03 a NIGHTLY `measure` job began regenerating and committing it, and on
 * the first night it ran for real BOTH ingests failed here — an unattended machine
 * standing in a loop that had been designed for a human, three comment figures
 * blocking the commit of the data the job exists to keep fresh.
 *
 * ⭐⭐ SO THE FIGURES ARE NOW WRITTEN, NOT RETYPED. `tools/quoted-figures.mjs`
 * rewrites them from the published file, in the same job step that regenerates
 * the snapshot banners, and THIS FILE IS THE CHECK ON THAT WRITER. The claim list
 * is imported from it rather than restated: two enumerations of the same seven
 * sentences would agree right up until one of them was fixed.
 *
 * ⛔ ITS LIMIT, STATED. The claim SITES are enumerated by hand: these are the
 * places the analysis tier argues from an archive-wide figure, found by reading.
 * A new one added tomorrow is not covered. That is a real gap and the honest
 * mitigation is that `src/lib` is small and these are its only such claims — not
 * that the enumeration is complete by construction.
 *
 * ⛔ AND `docs/` IS DELIBERATELY OUT OF SCOPE. Those documents are dated
 * arguments, not descriptions of the current archive; their figures carry the
 * `n` they were measured over, and `docs/README.md` says a document there is a
 * moment unless it says otherwise. Rewriting a historical measurement to
 * today's value would destroy the record rather than maintain it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { claims, survey, measures } from '../tools/quoted-figures.mjs';

const M = measures();

test('⭐ every archive figure src/lib argues from matches the published file', () => {
  /* MUTATION: retype any of the seven by hand and this names the file, what it
     reads, and what the published document says. */
  const rows = survey(M);
  /* ⛔ THE LIST MUST NOT HAVE EMPTIED. A refactor that renamed a field, or a
     `claims()` that returned [], passes every assertion below while checking
     nothing — the shape this repo pays for most. */
  assert.ok(rows.length >= 7, `only ${rows.length} quoted figures enumerated`);
  const stale = rows.filter(r => !r.ok).map(r =>
    `src/lib/${r.file} argues from "${r.now}" where measures.json says "${r.want}"`
    + ` — ${r.what}`);
  assert.deepEqual(stale, [], 'the archive moved and the reasoning did not. '
    + '`node tools/quoted-figures.mjs` writes these:\n  ' + stale.join('\n  '));
});

test('⛔ a claim whose pattern finds nothing is a FAILURE, never a pass', () => {
  /* ⭐⭐ THE WRITER'S OWN HAZARD, and it is this repo's most expensive shape: an
     extraction step that quietly matched nothing. A `sed` the shell refused still
     exits 0, so a guard that read nothing approved everything. Here it would be
     worse than silent — the writer would report "every figure already matches"
     while the sentence it was meant to maintain had been reworded out of reach.
     MUTATION: reword any of the seven sentences so its pattern no longer matches
     and this fires, even though the FIGURE in it may still be correct. */
  for (const r of survey(M))
    assert.equal(r.hits, 1,
      `the pattern for ${r.what} matches src/lib/${r.file} ${r.hits} times. `
      + 'At zero the writer silently maintains nothing; above one it would rewrite '
      + 'a sentence nobody listed.');
});

test('⛔ the writer refuses rather than writing nonsense', () => {
  /* The one claim that is a SUBTRACTION rather than a published field: an archive
     in which every game had a control edge would make it zero, and "0 of 4,226
     games — one in sixteen" is a sentence that reads as fact and is not one. */
  const impossible = JSON.parse(JSON.stringify(M));
  impossible.baseRates.moreLevelControlLost.n = impossible.measured;
  const guarded = claims(impossible).filter(c => c.guard);
  assert.ok(guarded.length >= 1, 'no claim guards its own derivation any more');
  for (const c of guarded)
    assert.equal(typeof c.guard(), 'string',
      `${c.what} accepted a measures.json that makes its sentence false`);
});
