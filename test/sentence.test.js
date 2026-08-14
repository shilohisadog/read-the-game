/**
 * The per-game sentence.
 *
 * This is the first surface on the site made mostly of PROSE that carries
 * numbers, and the doc it comes from (docs/game-sentence.md) recorded a defect
 * in its own drafting: a figure used five times in the design argument, `88 of
 * 214`, was one I invented and never marked as invented — and CHENG's review
 * computed a confidence band around it as though it were measured. The real
 * value at that cutoff is 243 of 708, and it points the OTHER WAY against the
 * base rate.
 *
 * So every number below is either supplied by the caller in a fixture or read
 * from the published curve. Nothing in this file may contain a plausible-looking
 * figure that came from nowhere.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sentenceFor, describeType } from '../src/lib/sentence.js';

const HOME = 10, AWAY = 20;
const base = {
  homeAb: 'BUF', awayAb: 'MIN', homeId: HOME, awayId: AWAY,
  gameId: 2023020204,
  attempts: { [HOME]: 55, [AWAY]: 47 },
  levelCounts: { [HOME]: 30, [AWAY]: 18 },
  diff: 12,
  score: { h: 2, a: 3 },
  curve: [{ k: 1, n: 3855, count: 1527 }, { k: 12, n: 708, count: 243 }],
};
const say = o => sentenceFor({ ...base, ...o });
const whole = r => [r.lead, r.rate, r.absent].filter(Boolean).join(' ');

test('the leader of the level count is named, with both numbers and the result', () => {
  const r = say({});
  assert.match(r.lead, /BUF led the attempts 55–47/);
  assert.match(r.lead, /led 30–18 while the score was level/);
  assert.match(r.lead, /BUF lost\./);
  assert.equal(r.rate, 'Of the games where a team led that count by 12 or more, '
                     + 'it lost 243 of 708.');
});

test('when the two measures DISAGREE the sentence says so, because that is the lesson', () => {
  // The site's whole thesis at single-game scale: 54.5% of games are lost by the
  // team with more attempts, against 39.6% by the team that controlled play while
  // level. A game where the two point at different clubs is the instructive one,
  // and a sentence carrying only the second would hide it (CHENG).
  const r = say({ attempts: { [HOME]: 40, [AWAY]: 60 } });
  assert.match(r.lead, /MIN led the attempts 60–40, but BUF led 30–18/);
});

test('the winner is stated as plainly as the loser, and carries the same rate', () => {
  // Showing the comparison only when the story is surprising is selective
  // honesty, which Doctrine §9 calls worse than none because it looks rigorous.
  const lost = say({ score: { h: 2, a: 3 } });
  const won = say({ score: { h: 3, a: 2 } });
  assert.match(lost.lead, /BUF lost\./);
  assert.match(won.lead, /BUF won\./);
  assert.equal(lost.rate, won.rate, 'the same reference class either way');
});

test('no edge is a real answer, and 264 games have one', () => {
  const r = say({ diff: 0 });
  assert.equal(r.lead, 'Neither team controlled play while the score was level.');
  assert.equal(r.rate, null, 'there is no edge to have a rate about');
  assert.equal(r.absent, null, 'and nothing is missing that needed explaining');
});

test('the rate is ALWAYS a fraction and never a bare percentage', () => {
  // The rule that removes the need for a minimum-n threshold. At the far end of
  // the curve the archive says "0 of 4" — which as a percentage reads "0%, teams
  // that dominant never lose", and is four coin flips.
  const thin = say({ diff: 35, curve: [{ k: 35, n: 4, count: 0 }] });
  assert.match(thin.rate, /it lost 0 of 4\./);
  for (const r of [say({}), thin, say({ diff: 1, curve: [{ k: 1, n: 3855, count: 1527 }] })]) {
    assert.doesNotMatch(whole(r), /\d\s*%/, 'a percentage reached the sentence');
    assert.doesNotMatch(whole(r), /\d+\.\d/, 'and so did a decimal');
  }
});

test('NO CAUSAL CONNECTIVE joins the game to the rate', () => {
  // CHENG offered this as a precaution; the confound gives it a mechanism.
  // `level` counts attempts taken WHILE the score was level, so its size depends
  // on how long the game stayed level — a team up 3-0 early has few available.
  // The reference class is therefore selected on a variable related to the
  // outcome, and a causal reading is not merely unsupported but wrong.
  // THE GATE MUST WALK EVERY BRANCH, not the ones the fixtures happen to reach.
  // The first version of this test used four fixtures that all had a winner, so
  // it never saw the drawn-game clause — and a mutation dropping "so the count
  // told the story" into exactly that clause passed unharmed. A copy gate that
  // covers some of the copy is a copy gate over nothing in particular.
  const banned = /\b(so|therefore|which means|because|thus|hence|proving|shows that|meaning)\b/i;
  const MATRIX = [
    { diff: 0 },                                              // no edge
    {},                                                       // led both, lost
    { score: { h: 3, a: 2 } },                                // led both, won
    { score: { h: 2, a: 2 } },                                // ended level
    { attempts: { [HOME]: 40, [AWAY]: 60 } },                 // the two disagree
    { attempts: { [HOME]: 50, [AWAY]: 50 } },                 // attempts even
    { diff: -12, levelCounts: { [HOME]: 18, [AWAY]: 30 } },   // the visitor led
    { gameId: 2023010001 },                                   // out of scope
    { gameId: 2024190001 },                                   // out of scope, other
    { curve: null },                                          // rates absent
    { curve: null, noCurveReason: 'this page makes no network requests' },
    { diff: 9, curve: [{ k: 9, n: 0, count: 0 }] },           // empty population
    { diff: 35, curve: [{ k: 35, n: 4, count: 0 }] },         // the thin tail
    { shootout: true },                                       // decided in a shootout
    { shootout: true, score: { h: 3, a: 2 } },                // ... the other way
  ];
  const seen = new Set();
  for (const o of MATRIX) {
    const r = say(o);
    seen.add(whole(r));
    assert.doesNotMatch(whole(r), banned, `"${whole(r)}" argues instead of reporting`);
  }
  // And the matrix must actually be reaching different copy, or it is one test
  // repeated thirteen times.
  assert.equal(seen.size, MATRIX.length,
    `${MATRIX.length} fixtures produced only ${seen.size} distinct sentences`);
  // And structurally: the two are separate strings, so no edit can join them
  // with a conjunction without deleting a field.
  const r = say({});
  assert.ok(r.lead && r.rate && !r.lead.includes(r.rate));
});

test('a shootout is never reported as what the PLAY produced', () => {
  // MEASURED, on game 2023020510: DET 7 PHI 6 on the scoreboard, 6-6 in play,
  // and this sentence said "DET won." Every count on the site already excludes
  // the shootout; the OUTCOME clause did not, because it reads the league's
  // final score — which in these games IS the shootout result.
  //
  // The mirror case is the damaging one and it is asserted below: had the
  // control leader lost the shootout, the page would have said "DET lost" and
  // recruited a coin-flip tiebreaker as evidence for the site's own thesis.
  const lostIt = say({ shootout: true });                    // BUF led level, 2-3
  const wonIt = say({ shootout: true, score: { h: 3, a: 2 } });

  for (const r of [lostIt, wonIt]) {
    assert.match(r.lead, /The game was level when play ended/);
    assert.doesNotMatch(r.lead, /BUF (won|lost)\./,
      'the control leader is never said to have won or lost a shootout game');
    assert.doesNotMatch(r.lead, /MIN (won|lost)\.$/);
    // The game still says what it WAS — the counts are unaffected, and they are
    // the honest part.
    assert.match(r.lead, /BUF led the attempts 55–47/);
    assert.match(r.lead, /led 30–18 while the score was level/);
  }
  // And the shootout's winner is named, because it is a fact and the reader can
  // see it on the scoreboard. MIN won 3-2 in the first, BUF won 3-2 in the second.
  assert.match(lostIt.lead, /MIN won the shootout\./);
  assert.match(wonIt.lead, /BUF won the shootout\./);

  // A NON-SHOOTOUT GAME IS UNTOUCHED. Without this the fix could have been
  // "never say won or lost", which would delete the sentence's whole point.
  assert.match(say({}).lead, /BUF lost\./);
  assert.match(say({ score: { h: 3, a: 2 } }).lead, /BUF won\./);
});

test('the shootout clause is never reached by the period NUMBER', () => {
  // Period 5 is a shootout in the regular season and a THIRD OVERTIME in the
  // playoffs, so the number cannot tell them apart — which is why the extract
  // carries `pt` at all. This module is handed the answer rather than deriving
  // it, and the guard is that it takes no period input to get wrong.
  // COMMENTS STRIPPED FIRST. The first version of this ran over the whole file
  // and matched `per` inside the phrase "per-game sentence" in the doc comment —
  // a gate that fires on prose is a gate nobody can keep green, and it would
  // have been "fixed" by loosening the pattern until it caught nothing.
  const src = readFileSync(new URL('../src/lib/sentence.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(src, /\bper\b|periodDescriptor|[=!]= *5\b/,
    'sentence.js must not reason about periods');
  assert.match(src, /shootout/, 'and the stripper did not just delete the file');
  // Absent or false both mean "not a shootout", and neither may invent the clause.
  for (const o of [{}, { shootout: false }, { shootout: undefined }])
    assert.doesNotMatch(say(o).lead, /shootout/i);
});

test('an out-of-scope game gets its own numbers and is TOLD why there is no rate', () => {
  // A bare number with no reference class is what Doctrine §8 warns about, and
  // silence about an omission is the failure the ingest-state work spent two
  // rounds fixing (CHENG). Pooling a preseason game into a rate measured over the
  // regular season and playoffs is the error archive.js exists to prevent.
  const pre = say({ gameId: 2023010001 });
  assert.match(pre.lead, /BUF led the attempts 55–47/, 'the game keeps its own numbers');
  assert.equal(pre.rate, null);
  assert.match(pre.absent, /No comparison shown — this is a preseason game/);
  assert.match(pre.absent, /regular season and playoffs/);

  // 19 is six games between CAN, FIN, SWE and USA in the published catalog.
  const fourNations = say({ gameId: 2024190001 });
  assert.match(fourNations.absent, /not an NHL league game/);
});

test('a missing archive is stated, never a spinner and never a silent zero', () => {
  for (const [curve, expect] of [[null, /could not be loaded/],
                                 [[], /could not be loaded/],
                                 [[{ k: 1, n: 3855, count: 1527 }], /no other game with a lead this large/]]) {
    const r = say({ curve });
    assert.equal(r.rate, null);
    assert.match(r.absent, expect);
    assert.match(r.lead, /BUF/, 'the game still says what it was');
  }
});

test('a rate is never printed against an empty population', () => {
  // "0 of 0" is not a base rate. Only reachable for a game measured since the
  // last derive run, which is a real state between a nightly and a weekly.
  const r = say({ diff: 9, curve: [{ k: 9, n: 0, count: 0 }] });
  assert.equal(r.rate, null);
  assert.match(r.absent, /no other game with a lead this large/);
});

test('the sign of the differential is read, never assumed', () => {
  // MUTATION GUARD. `diff` is HOME minus away; a sentence that assumed the home
  // side led would name the wrong club in every game the visitors controlled,
  // and would still read perfectly.
  const visitorLed = say({ diff: -12, levelCounts: { [HOME]: 18, [AWAY]: 30 } });
  assert.match(visitorLed.lead, /MIN led 30–18 while the score was level/);
  assert.match(visitorLed.lead, /MIN won\./, 'MIN won 3-2, and MIN led the level count');
});

test('game types are read from the id, not from a lookup we would have to maintain', () => {
  assert.equal(describeType(2023020204), null, 'regular season is in scope');
  assert.equal(describeType(2024030416), null, 'so are the playoffs');
  assert.equal(describeType(2023010001), 'a preseason game');
  assert.equal(describeType(2024040001), 'not an NHL league game', 'All-Star squads');
  assert.equal(describeType(2025090030), 'not an NHL league game', 'national sides');
  assert.equal(describeType(2024190001), 'not an NHL league game', 'four nations');
});

test('why the comparison is missing is the caller\'s fact, not a default', () => {
  // The inlined page makes NO network requests, so "the archive's rates could not
  // be loaded" is a small untruth on the one page whose whole claim is that it
  // reaches nothing.
  const never = say({ curve: null,
                      noCurveReason: 'this page carries a single game and makes no network requests' });
  assert.match(never.absent, /makes no network requests/);
  assert.doesNotMatch(never.absent, /could not be loaded/);

  const failed = say({ curve: null });
  assert.match(failed.absent, /could not be loaded/, 'and the default still covers a real failure');
});

test('the row that produced the sentence is handed back, never re-derived', () => {
  // The game page draws this rate as well as saying it. The alternatives were a
  // second `curve.find` on the page — one domain rule in two places, which is the
  // shape this project keeps removing — or pulling all of archive.js into the
  // game bundle for five lines.
  const r = say({});
  assert.deepEqual(r.row, { k: 12, n: 708, count: 243 });
  // And the row must be the one the SENTENCE used, not merely a row: the prose
  // says 243 of 708, so anything else here is two numbers for one fact.
  assert.match(r.rate, new RegExp(`${r.row.count} of ${r.row.n}`));

  // NO ROW WHERE THERE IS NO RATE — every branch that suppresses the comparison
  // must suppress the picture too, or the page draws a chart of nothing.
  for (const o of [{ diff: 0 }, { curve: null }, { gameId: 2023010001 },
                   { diff: 9, curve: [{ k: 9, n: 0, count: 0 }] }]) {
    const x = say(o);
    assert.equal(x.rate, null, 'fixture no longer suppresses the rate');
    assert.ok(!x.row || !x.row.n, `a row survived on a game with no rate: ${JSON.stringify(x.row)}`);
  }
});
