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
 * ⭐ WHY THIS IS NOT A CONSTANT THAT DRIFTS. Every expected value below is READ
 * FROM `measures.json` at test time and formatted the way the comment states it.
 * Nothing here is typed. When the archive is re-derived and a rate moves, this
 * goes red naming the file and both figures, and somebody updates the sentence
 * — which is the entire point. A test holding last month's percentage would be
 * the defect it is checking for.
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
import { readFileSync } from 'node:fs';

const M = JSON.parse(readFileSync(new URL('../data/measures.json', import.meta.url), 'utf8'));
const src = f => readFileSync(new URL(`../src/lib/${f}`, import.meta.url), 'utf8');

const n = v => v.toLocaleString('en-US');
const pc = r => `${(r * 100).toFixed(1)}%`;

test('⭐ the base rates the analysis tier argues from match the published file', () => {
  const att = M.baseRates.moreAttemptsLost;
  const lvl = M.baseRates.moreLevelControlLost;

  const claims = [
    { file: 'sentence.js',
      want: `**${n(lvl.count)} of ${n(lvl.n)} games**`,
      what: 'the finding the per-game sentence is built on' },
    { file: 'sentence.js',
      want: `${pc(att.rate)} of games are lost by the team with more attempts, against ${pc(lvl.rate)}`,
      what: 'the two-rate comparison CHENG required in one clause' },
    { file: 'archive.js',
      want: `leader loses ${pc(att.rate)}`,
      what: 'why a blocks-leader win rate is unpublishable' },
    { file: 'layers/blocked.js',
      want: `attempts leader loses ${pc(att.rate)}`,
      what: 'the same reasoning, restated where the layer needs it' },
  ];

  for (const c of claims) {
    assert.ok(src(c.file).includes(c.want),
      `${c.file} no longer quotes the published figure for ${c.what}.\n`
      + `  measures.json now says: ${c.want}\n`
      + '  Update the comment — the archive moved and the prose did not.');
  }
});

test('⭐ the no-edge count is the population minus the games that had one', () => {
  /* ⭐ DERIVED, NOT LOOKED UP. `measures.json` publishes how many games had a
     level-control edge, never how many did not, so the comment's figure is a
     subtraction — and stating it that way here is what makes this a check on
     the ARITHMETIC rather than a second copy of the answer. */
  const noEdge = M.measured - M.baseRates.moreLevelControlLost.n;
  assert.ok(noEdge > 0, 'every measured game had a control edge — the derivation is wrong');
  assert.ok(src('sentence.js').includes(`${n(noEdge)} of ${n(M.measured)} games`),
    `sentence.js quotes the wrong no-edge count: measures.json gives `
    + `${n(noEdge)} of ${n(M.measured)} (${n(M.measured)} measured − `
    + `${n(M.baseRates.moreLevelControlLost.n)} with an edge).`);
});

test('⭐ the blocked layer\'s opening sentence matches the attempt mix', () => {
  const mix = M.attemptMix;
  const t = mix.byType;
  /* "Never reach the goalie" is blocked PLUS missed — the two ways an attempt
     ends without the goaltender ever facing it. Computed from the type counts
     rather than read from a field, because no field says this. */
  const unreached = (t['blocked-shot'] + t['missed-shot']) / mix.blocked.n;
  const want = `${n(mix.blocked.n)} attempts in ${n(M.measured)} games — `
             + `**${pc(unreached)} of shot attempts never reach the`;
  assert.ok(src('layers/blocked.js').includes(want),
    `layers/blocked.js opens with a figure that no longer matches measures.json.\n`
    + `  expected: ${want}…\n`
    + '  This sentence is the layer\'s entire reason to exist, so it is the worst '
    + 'one to leave stale.');
  assert.ok(src('layers/blocked.js').includes(`and ${pc(mix.blocked.rate)} are blocked by a body`),
    `layers/blocked.js quotes the wrong blocked share; measures.json says ${pc(mix.blocked.rate)}.`);
});
