/**
 * The archive figures quoted in `src/lib`'s reasoning, WRITTEN from the published
 * file rather than retyped into it.
 *
 * ⛔⛔⛔ WHY THIS EXISTS, AND IT IS A REGRESSION I SHIPPED. `test/quoted-figures
 * .test.js` holds seven hand-written sentences to `data/measures.json`, and its
 * own header says what happens when the archive moves: *"this goes red naming the
 * file and both figures, and somebody updates the sentence — which is the entire
 * point."* That was written when `measures.json` was rebuilt WEEKLY by
 * `derive.yml`, which does not commit it: the figures only went stale when a
 * person regenerated the file, and that person retyped them. On 2026-10-03 I
 * added a NIGHTLY `measure` job that regenerates and COMMITS it — and put an
 * unattended machine into a loop designed for a human. The first night it ran for
 * real, both ingests failed on these three numbers.
 *
 * ⭐⭐ A TREADMILL IS NOT A GUARD, and this repo already says so in
 * `test/prose-measurements.test.js`: *"a test that a typed number is STILL
 * CORRECT leaves a typed number… the only figure that cannot drift is the one
 * nobody wrote down."* These are derivable from a published document, so they are
 * derived — the same thing `tools/snapshots.mjs` does for the banners, in the
 * same step of the same job.
 *
 * ⭐ THE CLAIM LIST IS ONE OBJECT, read by the writer AND by the test. Two
 * enumerations of the same seven sentences would agree until one was fixed, which
 * is the shape this project keeps repairing. The test is now a check on this
 * writer rather than a chore ticket for a person.
 *
 * ⛔ ITS LIMIT, INHERITED AND UNCHANGED. The claim SITES are enumerated by hand:
 * these are the places the analysis tier argues from an archive-wide figure,
 * found by reading. A new one added tomorrow is not covered. `docs/` stays out of
 * scope — those are dated arguments, and rewriting a historical measurement to
 * today's value would destroy the record rather than maintain it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const n = v => v.toLocaleString('en-US');
const pc = r => `${(r * 100).toFixed(1)}%`;

/**
 * Every archive figure `src/lib` argues from: where it is, what it should read,
 * and the pattern that finds whatever it reads now.
 *
 * ⚠️ `find` MATCHES THE STALE TEXT AS WELL AS THE CURRENT TEXT, which is the only
 * reason a writer is possible: it is written in terms of the SHAPE of the figure
 * (digits, commas, a decimal percent) and never its value. A pattern that matched
 * only today's number could not find yesterday's to replace it.
 */
export function claims(M) {
  const att = M.baseRates.moreAttemptsLost;
  const lvl = M.baseRates.moreLevelControlLost;
  /* ⭐ DERIVED, NOT LOOKED UP. `measures.json` publishes how many games had a
     level-control edge, never how many did not, so this is a subtraction. */
  const noEdge = M.measured - lvl.n;
  const mix = M.attemptMix, t = mix.byType;
  /* "Never reach the goalie" is blocked PLUS missed — the two ways an attempt
     ends without the goaltender ever facing it. No field says this. */
  const unreached = (t['blocked-shot'] + t['missed-shot']) / mix.blocked.n;

  return [
    { file: 'sentence.js',
      what: 'the finding the per-game sentence is built on',
      find: /\*\*[\d,]+ of [\d,]+ games\*\*/,
      want: `**${n(lvl.count)} of ${n(lvl.n)} games**` },
    { file: 'sentence.js',
      what: 'the two-rate comparison CHENG required in one clause',
      find: /\d+\.\d+% of games are lost by the team with more attempts, against \d+\.\d+%/,
      want: `${pc(att.rate)} of games are lost by the team with more attempts, `
          + `against ${pc(lvl.rate)}` },
    { file: 'sentence.js',
      what: 'the games with no control edge at all',
      find: /[\d,]+ of [\d,]+ games(?= — one in)/,
      want: `${n(noEdge)} of ${n(M.measured)} games`,
      /* ⛔ AND THE SUBTRACTION MUST BE POSSIBLE. A measures.json where every game
         had an edge would make this zero or negative and the sentence nonsense,
         so it is refused rather than written. */
      guard: () => noEdge > 0 || 'every measured game had a control edge' },
    { file: 'archive.js',
      what: 'why a blocks-leader win rate is unpublishable',
      find: /leader loses \d+\.\d+%/,
      want: `leader loses ${pc(att.rate)}` },
    { file: 'layers/blocked.js',
      what: 'the same reasoning, restated where the layer needs it',
      find: /attempts leader loses \d+\.\d+%/,
      want: `attempts leader loses ${pc(att.rate)}` },
    { file: 'layers/blocked.js',
      what: "the layer's entire reason to exist",
      find: /[\d,]+ attempts in [\d,]+ games — \*\*\d+\.\d+% of shot attempts never reach the/,
      want: `${n(mix.blocked.n)} attempts in ${n(M.measured)} games — `
          + `**${pc(unreached)} of shot attempts never reach the` },
    { file: 'layers/blocked.js',
      what: 'the blocked share the layer draws',
      find: /and \d+\.\d+% are blocked by a body/,
      want: `and ${pc(mix.blocked.rate)} are blocked by a body` },
  ];
}

const ROOT = new URL('../', import.meta.url);
const pathOf = f => new URL(`src/lib/${f}`, ROOT);

export function measures() {
  return JSON.parse(readFileSync(new URL('data/measures.json', ROOT), 'utf8'));
}

/**
 * What each claim reads now, against what the published file says it should.
 *
 * ⛔ A CLAIM WHOSE `find` MATCHES NOTHING IS A FAILURE, NEVER A PASS. An
 * extraction step that quietly found nothing is the defect this repo has paid for
 * more than once — a `sed` the shell refused still exits 0, and the guard that
 * read nothing approved everything.
 */
export function survey(M = measures()) {
  const files = new Map();
  const read = f => {
    if (!files.has(f)) files.set(f, readFileSync(pathOf(f), 'utf8'));
    return files.get(f);
  };
  return claims(M).map(c => {
    const bad = c.guard && c.guard();
    const body = read(c.file);
    const hits = body.match(new RegExp(c.find.source, c.find.flags + 'g')) || [];
    return { ...c, now: hits[0] ?? null, hits: hits.length,
      refused: typeof bad === 'string' ? bad : null,
      ok: hits.length === 1 && body.includes(c.want) };
  });
}

/** Rewrite every stale figure in place. Returns what it changed. */
export function write(M = measures()) {
  const rows = survey(M);
  const stop = rows.filter(r => r.refused || r.hits !== 1);
  if (stop.length) {
    const why = stop.map(r => r.refused
      ? `${r.file}: refused — ${r.refused}`
      : `${r.file}: the pattern for ${r.what} matched ${r.hits} times, not once`);
    throw new Error('nothing was written:\n  ' + why.join('\n  '));
  }
  const edits = [];
  const byFile = new Map();
  for (const r of rows) {
    if (!byFile.has(r.file)) byFile.set(r.file, readFileSync(pathOf(r.file), 'utf8'));
    const before = byFile.get(r.file);
    const after = before.replace(r.find, r.want);
    if (after !== before) { byFile.set(r.file, after); edits.push(r); }
  }
  for (const [f, body] of byFile) writeFileSync(pathOf(f), body);
  return edits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const M = measures();
  if (process.argv.includes('--check')) {
    const bad = survey(M).filter(r => !r.ok);
    for (const r of bad)
      console.log(`::error::src/lib/${r.file} argues from "${r.now}" where `
        + `data/measures.json says "${r.want}" (${r.what})`);
    if (!bad.length) console.log(`  ${survey(M).length} quoted figures agree with the published file`);
    process.exit(bad.length ? 1 : 0);
  }
  const edits = write(M);
  if (!edits.length) console.log('  every quoted figure already matches the published file');
  for (const e of edits) console.log(`  src/lib/${e.file}: ${e.now}  ->  ${e.want}`);
}
