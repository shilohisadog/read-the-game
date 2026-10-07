/**
 * THE WORKFLOWS' OWN DEPENDENCIES — the one part of this repo that goes stale on
 * somebody else's schedule.
 *
 * ⛔ WHY THIS EXISTS. On 2026-09-18 every run was printing *"Node.js 20 is
 * deprecated. The following actions target Node.js 20 but are being forced to run
 * on Node.js 24"* — and had been for a while. Nothing was broken, nothing was
 * red, and the line scrolled past the top of a log nobody reads when the job is
 * green. Kevin caught it in a run summary and said *"let's do the Node bump now,
 * just so neither of us forget"*, which is the whole problem in one sentence: a
 * warning with no check behind it is a thing you remember or you do not.
 *
 * ⭐ THE LEDGER IS OF WHAT IS PINNED AND WHY, not a rule about version numbers.
 * "Use the latest" is not checkable and would be wrong anyway — the newest major
 * of each of these is three ahead of what we run, and the majors in between
 * change behaviour that has nothing to do with the runtime. What this holds is
 * the DECISION: each action sits at the first major that runs on Node 24, and
 * moving one is an edit here with a reason beside it.
 *
 * ⚠️ WHAT IT CANNOT SEE: whether GitHub has deprecated something new. It answers
 * "are we where we decided to be", not "is that still a good place to be". The
 * runner's own warnings remain the signal for the second question — this exists
 * so the answer to the first one cannot drift while nobody is looking.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const DIR = new URL('../.github/workflows/', import.meta.url);
const FILES = readdirSync(DIR).filter(f => f.endsWith('.yml'));

/**
 * Every `actions/*` this repo uses, at the major it is pinned to and why.
 * ⭐ THE REASON IS THE POINT. Each of these is the FIRST major that runs on
 * Node 24 — checked against the action's own `action.yml` at that tag — which is
 * the smallest change that clears the deprecation. Going further buys unrelated
 * breaking changes for nothing: `setup-node@v5` already carries one (it caches
 * automatically when `package.json` has a `packageManager` field), and it is
 * inert here only because this project has no dependencies, no lockfile and no
 * `npm ci` in any workflow. That is a fact about us, and it is why it is written
 * down rather than assumed.
 */
const PINNED = {
  'actions/checkout': { major: 'v5', why: 'first major on node24 (v4 is node20)' },
  'actions/setup-node': { major: 'v5', why: 'first major on node24; its auto-cache breaking change needs a packageManager field, which we do not have' },
  'actions/setup-python': { major: 'v6', why: 'first major on node24 (v5 is node20)' },
};

const usesIn = text => [...text.matchAll(/uses:\s*(actions\/[\w-]+)@(v\d+)/g)]
  .map(m => ({ action: m[1], major: m[2] }));

test('⭐ every GitHub action is pinned to the major this repo decided on', () => {
  const seen = new Set();
  let total = 0;
  for (const f of FILES) {
    for (const u of usesIn(readFileSync(new URL(f, DIR), 'utf8'))) {
      total++;
      seen.add(u.action);
      const want = PINNED[u.action];
      assert.ok(want,
        `${f} uses ${u.action}, which is not in this file's ledger. Add it with the major `
        + 'it is pinned to and the reason — an action nobody decided about is one nobody will '
        + 'notice going stale.');
      assert.equal(u.major, want.major,
        `${f} uses ${u.action}@${u.major} and this repo is pinned to ${want.major} — ${want.why}. `
        + 'If the pin should move, move it HERE first, with the reason.');
    }
  }
  assert.ok(total >= 10, `only ${total} action uses found across ${FILES.length} workflows — the scan is not working`);

  // ⛔ AND THE LEDGER MAY NOT OUTLIVE ITS SUBJECT. An entry for an action no
  // workflow uses is the same defect as an unlisted page: a written reason
  // standing where nothing is happening.
  for (const a of Object.keys(PINNED))
    assert.ok(seen.has(a), `the ledger pins ${a} and no workflow uses it — delete the entry`);
});

test('⛔ no workflow runs an action on a Node runtime GitHub has deprecated', () => {
  // The majors below are the ones whose `action.yml` declares `using: node20` or
  // older, read from the actions' own repositories on 2026-09-18. This is the
  // claim the deprecation warning was making, asserted rather than read in a log.
  const DEPRECATED = {
    'actions/checkout': ['v1', 'v2', 'v3', 'v4'],
    'actions/setup-node': ['v1', 'v2', 'v3', 'v4'],
    'actions/setup-python': ['v1', 'v2', 'v3', 'v4', 'v5'],
  };
  const bad = [];
  for (const f of FILES)
    for (const u of usesIn(readFileSync(new URL(f, DIR), 'utf8')))
      if ((DEPRECATED[u.action] || []).includes(u.major)) bad.push(`${f}: ${u.action}@${u.major}`);
  assert.deepEqual(bad, [],
    'these run on a deprecated Node runtime — every run prints a warning that nobody reads '
    + 'until the forced upgrade stops being forced and the job fails');
});

/* --------------------------- WHERE A DRIFT ALARM FIRES RELATIVE TO THE SYNC */

/**
 * ⛔⛔⛔ THE DEFECT THIS EXISTS FOR — 2026-09-25, and it cost 31 hours.
 *
 * `derive.py` alarms on a NAMING gap: a competition with no name, a feed value
 * we have never seen. None of them can change a number, every one of them fires
 * over an archive that is already written and correct, and both `derive.py`'s
 * docstring and `data/vocabulary-seen.json` said so in as many words — the exit
 * happens *"after publishing, because ... withholding the archive over a label
 * is the mistake the 73 refused games already were."*
 *
 * It was true of the function and false of the pipeline. `ingest.yml` ran derive
 * as an ordinary step, so a non-zero exit halted the job and `sync to R2` never
 * ran. Three new penalty descriptors stopped the site at `dataThrough
 * 2026-09-23` for five consecutive runs.
 *
 * ⭐⭐ AND THE SAME EXIT CODE MEANT THE OPPOSITE THING NEXT DOOR. `derive.yml`
 * piped derive through `tee` with the default shell, which has no `pipefail`, so
 * the step reported `tee`'s status and the weekly alarm had never fired once.
 * Two workflows, one exit code, three behaviours, none of them the documented
 * one — and the fix for the `tee` half was written out thirteen lines below the
 * step that needed it, applied to its neighbour.
 *
 * ⭐⭐⭐ SO THE CHECK IS ABOUT ORDER AND ABOUT THE PIPE, because those are what
 * were wrong. Both are invisible to every other test in this repo: the YAML
 * parses, the steps run, and the archive quietly does not publish.
 */
const yamlSteps = (file) => {
  const text = readFileSync(new URL(file, DIR), 'utf8');
  /* ⚠️ A DELIBERATELY SMALL PARSER, and it asserts what it found. Pulling in a
     YAML dependency for two fields is a larger change than the fix; a regex that
     silently matched nothing would make every assertion below vacuous, which is
     the shape this repo keeps paying for. So the step count is checked. */
  const steps = [...text.matchAll(/^      - name: (.+)$/gm)].map((m, i) => ({
    name: m[1].trim(), at: m.index, i,
  }));
  assert.ok(steps.length >= 8,
    `${file}: found ${steps.length} steps — the parser is not reading this file`);
  return { text, steps };
};

const find = (steps, re, file, what) => {
  const hit = steps.filter(s => re.test(s.name));
  assert.equal(hit.length, 1,
    `${file}: expected exactly one ${what} step, found ${hit.length} (${hit.map(h => h.name).join(' | ')})`);
  return hit[0];
};

test('⛔⛔⛔ a naming alarm fires AFTER the archive is published, in every workflow that derives', () => {
  /* MUTATION: move either `a label the feed invented` step above its sync and
     this fires. That move is exactly the defect, and it is silent otherwise. */
  for (const [file, syncRe] of [['ingest.yml', /^sync to R2$/],
                                ['derive.yml', /^sync the extracts, then the index$/]]) {
    const { steps } = yamlSteps(file);
    const sync = find(steps, syncRe, file, 'sync');
    const alarm = find(steps, /^a label the feed invented/, file, 'drift alarm');
    assert.ok(alarm.i > sync.i,
      `${file}: the drift alarm runs at step ${alarm.i + 1} and the sync at `
      + `${sync.i + 1}. A label would withhold the archive — the mistake `
      + 'data/vocabulary-seen.json names in its own header.');
  }
});

test('⛔⛔ the drift alarm reads derive’s code, and derive cannot halt on it', () => {
  /* ⭐ BOTH HALVES, because either one alone leaves the defect. An alarm that
     reads nothing never fires; a derive step that exits on 2 never reaches it.
     MUTATION: drop the `[ "$code" != 2 ]` guard and the second assertion fires;
     change the alarm's `if:` to a different code and the first does. */
  for (const file of ['ingest.yml', 'derive.yml']) {
    const { text, steps } = yamlSteps(file);
    const alarm = find(steps, /^a label the feed invented/, file, 'drift alarm');
    const body = text.slice(alarm.at, text.indexOf('\n      - name:', alarm.at + 1));
    assert.match(body, /steps\.derive\.outputs\.code == '2'/,
      `${file}: the drift alarm does not read derive's exit code`);

    const derive = find(steps, /^derive /, file, 'derive');
    const dbody = text.slice(derive.at, text.indexOf('\n      - name:', derive.at + 1));
    assert.match(dbody, /\[ "\$code" != 0 \] && \[ "\$code" != 2 \]/,
      `${file}: derive halts the job on any non-zero code, so a label still `
      + 'withholds the archive');
    assert.match(dbody, /echo "code=\$code" >> "\$GITHUB_OUTPUT"/,
      `${file}: derive does not publish its exit code, so the alarm reads nothing`);
  }
});

test('⛔⛔ no step lets a pipe swallow an exit code it is judged on', () => {
  /* ⭐ THE SHAPE, NOT THE INSTANCE. `derive.yml` piped derive through `tee`
     under the default `bash -e {0}`, which has no `-o pipefail`, so the step
     reported `tee`'s status — always 0. The weekly's vocabulary alarm had
     therefore never fired. The same trap is described in a comment in that file
     about `measure.mjs`, applied to one step and not its neighbour, which is why
     this is a rule rather than a second comment.
     MUTATION: remove `shell: bash` or the `PIPESTATUS` read from the derive
     step and this names it. */
  for (const file of FILES) {
    const text = readFileSync(new URL(file, DIR), 'utf8');
    const blocks = text.split(/^      - name: /m).slice(1);
    for (const b of blocks) {
      const name = b.split('\n')[0].trim();
      const piped = /^\s*(?:run:\s*)?[^#\n]*\|\s*tee\s/m.test(b);
      if (!piped) continue;
      /* ⚠️ THREE SPELLINGS OF ONE GUARANTEE, and accepting all three is not a
         weakening: `shell: bash` gets `-o pipefail` from the runner, `set -o
         pipefail` asks for it directly, and reading `PIPESTATUS` takes the code
         by hand. `trigger.yml` uses the second and `ingest.yml`'s fetch step the
         third — both were already careful, which is what makes the two that
         were not worth a gate rather than a comment. */
      const safe = /shell: bash/.test(b) || /PIPESTATUS/.test(b)
                || /set -o pipefail/.test(b);
      assert.ok(safe,
        `${file} / "${name}" pipes into tee under the default shell, so the step `
        + "reports tee's status and the real exit code is discarded. Name the "
        + 'shell for -o pipefail, or read PIPESTATUS.');
    }
  }
});

/**
 * ⛔⛔⛔ A `sed` EXPRESSION THE SHELL REFUSES STILL EXITS 0, AND THE STEP GOES GREEN.
 *
 * 2026-10-02, found by reading a PASSING deploy log. The replay unfurl's spoiler
 * guard reads `og:description` back off the live page and fails if it contains a
 * digit. It was written as `s:.*og:description…:\1:p` — a `:` delimiter in a
 * pattern that itself contains `og:description`. `sed` refused the expression,
 * printed `unknown option to \`s'` to stderr, and substituted nothing; `$desc`
 * came back EMPTY; and the `case "$desc" in *[0-9]*)` that follows matched nothing
 * and passed. A guard that read nothing approved everything, inside a step whose
 * own name says it checks the share card.
 *
 * ⭐ WHY THIS LIVES HERE RATHER THAN BEING FIXED AND FORGOTTEN. The bash inside a
 * workflow is the one layer this repo cannot unit-test — it runs only on a push,
 * which is exactly why the browser checks were moved out of YAML into
 * `tools/browser/`. What is left in YAML is extraction, and an extraction that
 * silently yields nothing is the whole failure mode. `sed` itself is the oracle:
 * ask it whether it would accept the expression at all.
 *
 * ⚠️ IT CHECKS ACCEPTANCE, NOT CORRECTNESS. A valid expression that matches the
 * wrong thing still passes here — that is what the empty-string refusal beside each
 * one in the workflow is for. Two different claims, both needed.
 */
test('⛔⛔ every sed expression in a workflow is one sed will actually accept', () => {
  const dir = new URL('../.github/workflows/', import.meta.url);
  const files = readdirSync(dir).filter(f => f.endsWith('.yml'));
  assert.ok(files.length, 'no workflows found, so this test is looking in the wrong place');
  let checked = 0;
  for (const f of files) {
    const yml = readFileSync(new URL(f, dir), 'utf8');
    for (const m of yml.matchAll(/sed -n '([^']*)'/g)) {
      const expr = m[1];
      checked++;
      const r = spawnSync('sed', ['-n', expr], { input: '<title>x</title>\n', encoding: 'utf8' });
      assert.equal(r.status, 0,
        `${f}: sed refuses this expression, so the step that uses it reads NOTHING and still `
        + `exits 0 — "${expr}": ${(r.stderr || '').trim()}`);
    }
  }
  /* ⛔ AND THE SWEEP MUST HAVE FOUND SOMETHING. A regex that stops matching the
     workflows' own shape would report every expression valid by finding none. */
  assert.ok(checked >= 3,
    `only ${checked} sed expressions found across ${files.length} workflow(s) — the pattern this `
    + `test greps for no longer matches how they are written, so it is checking nothing`);
});

/**
 * ⭐ AND A VALUE A STEP JUDGES MUST BE REFUSED WHEN IT IS EMPTY — the other half of
 * the same defect, because even a valid expression matches nothing on a page that
 * changed.
 *
 * ⛔⛔ THE CLAIM IS NARROWER THAN "EVERY `case` NEEDS A GUARD", AND THE FIRST DRAFT
 * OF THIS TEST GOT IT WRONG. A `case` ending in a catch-all `*)` that exits is
 * already safe: an empty string matches no specific arm, falls to the default and
 * fails loudly. What is NOT safe is a `case` whose arms are all FAILURE conditions
 * with no default — `case "$desc" in *[0-9]*) exit 1 ;; esac` — where an empty
 * value matches nothing at all and the step simply continues. That is the shape
 * that ran vacuously on 2026-10-02, and it is the only shape this asserts.
 *
 * ⚠️ The first draft flagged `$title`, whose `case` has a failing default and was
 * never at risk. A test that demands a guard where none is needed teaches people to
 * add noise, and the next real finding arrives in a file full of it.
 */
test('⛔ a workflow never judges a string it failed to extract', () => {
  const yml = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const blocks = [...yml.matchAll(/case "\$(\w+)" in\n([\s\S]*?)\n\s*esac/g)];
  assert.ok(blocks.length, 'no `case "$var" in … esac` found in deploy.yml — this test has lost its subject');
  let withoutDefault = 0;
  const unguarded = [];
  for (const [, v, body] of blocks) {
    /* A catch-all arm makes the empty string loud, whatever it is. Without one,
       an empty value matches no arm and the step carries on as though it passed. */
    if (/^\s*\*\)/m.test(body)) continue;
    withoutDefault++;
    const guarded = new RegExp(`if \\[ -z "\\$${v}" \\]`).test(yml)
                 || new RegExp(`\\$\\{${v}:\\?`).test(yml);
    if (!guarded) unguarded.push(v);
  }
  assert.deepEqual(unguarded, [],
    `${unguarded.length} variable(s) are judged by a \`case\` that has NO catch-all arm and no `
    + `empty check: ${unguarded.join(', ')}. If the extraction yields nothing, every pattern fails `
    + `to match and the step passes — which is how the replay unfurl's spoiler guard ran `
    + `vacuously on 2026-10-02.`);
  /* ⛔ AND THE TEST MUST HAVE HAD A SUBJECT. If every `case` in the file grew a
     default, this would pass by examining nothing — true today and worth knowing
     the day it stops being, which is why it says so rather than staying silent. */
  assert.ok(withoutDefault > 0,
    'every `case` in deploy.yml now has a catch-all, so this test examined nothing. That is a fine '
    + 'state for the workflow and means this check is no longer the one protecting it — re-argue it '
    + 'rather than leaving a green test that cannot fail.');
});

/* ────────────────────────────────────────────────────────────────────────────
   THE NIGHTLY MEASUREMENT — chained to the ingest, 2026-10-03.

   ⛔⛔⛔ WHAT IT IS FOR. `measures.json` was rebuilt WEEKLY by derive.yml while
   `catalog.json` is rewritten NIGHTLY by the ingest, so from each Monday the two
   published documents drifted apart by design. On 2026-10-02 the published
   measurement covered 8 games of the season while the archive held 21, and a
   reader was told *"the 8 games we have measured for this season"*. Kevin: *"we
   hold 21 games and say 8 games."*

   ⚠️ THIS IS THE LAYER THE REPO CANNOT UNIT-TEST — the bash runs only on a push,
   which is why the browser checks were moved out of YAML into `tools/browser/`.
   What stays in YAML is wiring, and these are the wiring facts the job's
   correctness rests on. Each one, if quietly edited, leaves a job that runs,
   goes green, and does not do what its name says.
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * One job's text, by name, WITH ITS COMMENT LINES REMOVED.
 *
 * Sliced from `jobs:` so `concurrency.group` and the other two-space keys above
 * it cannot be mistaken for a job.
 *
 * ⛔⛔⛔ AND THE COMMENTS ARE STRIPPED BECAUSE ONE OF THESE GATES WAS SATISFIED
 * BY ONE. The chain test asserted `/needs: ingest/` was present; commenting the
 * line out to `# needs: ingest` left the text in the file, the regex matched,
 * and the mutation passed — a job with no chain at all, approved. This repo has
 * logged the shape twice already in the other direction: a comment quoting a
 * live monitor's pattern arms the monitor against itself, and a dumped DOM turns
 * a comment into text a deploy gate then judges. Here the prose that EXPLAINS a
 * wiring fact was accepted as the fact.
 *
 * ⚠️ So every assertion below reads code, and a heavily commented job — which
 * this one is, on purpose — cannot talk a gate into passing.
 */
function jobText(file, name) {
  const text = readFileSync(new URL(file, DIR), 'utf8');
  const jobs = text.slice(text.search(/^jobs:$/m));
  const at = jobs.search(new RegExp(`^  ${name}:$`, 'm'));
  assert.ok(at >= 0, `${file} has no \`${name}\` job — this gate is reading the wrong file`);
  const rest = jobs.slice(at + 1);
  const next = rest.search(/^  [a-z][\w-]*:$/m);
  const job = rest.slice(0, next < 0 ? undefined : next);
  const code = job.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  /* THE STRIP MUST NOT EAT THE JOB. These blocks are more comment than code, so
     a bug here would leave an empty string that every `doesNotMatch` passes on
     and every `match` fails on — loud in one direction and silent in the other. */
  assert.ok(/^\s*runs-on:/m.test(code),
    `stripping comments from ${file} / ${name} left no job behind`);
  return code;
}

test('⭐⭐ the nightly measures the ARCHIVE, and `--slate` there would overwrite it', () => {
  /* ⛔⛔⛔ THE FOOTGUN `slateOf`'s HEADER WAS WRITTEN ABOUT, now one job closer.
     `measure.mjs --out ingest` writes measures.json, and the ingest's sync pass
     excludes only index.json, catalog.json, recent.json and *latest.json — so a
     nightly run in SLATE mode publishes a document describing one night over the
     archive-wide one, and the front door begins saying "Across 8 games in this
     archive". `archiveIsWhole` refuses that, which is exactly why this job has to
     pull the whole extract archive first rather than reuse the ingest's tree.
     MUTATION: add `--slate` to the measure step, or drop the extract pull, and
     this fires. The two halves are asserted together because either alone is
     satisfied by a job that does not measure at all. */
  const job = jobText('ingest.yml', 'measure');
  assert.match(job, /node builders\/measure\.mjs --out ingest/,
    'the nightly measure step is gone');
  assert.doesNotMatch(job, /measure\.mjs[^\n]*--slate/,
    'the nightly runs the SLATE over the archive-wide measurement');
  assert.match(job, /aws s3 sync "s3:\/\/\$\{BUCKET\}\/extract\/" ingest\/extract\//,
    'it measures without pulling the extracts, so archiveIsWhole can only refuse');
});

test('⭐⭐ the span is checked on BOTH sides of the publish, in that order', () => {
  /* ⭐ TWO DIFFERENT CLAIMS AND BOTH ARE NEEDED — the same reasoning as the
     naming alarm above, which fires AFTER the sync on purpose. Before: refuse to
     upload a document whose span disagrees with the catalog beside it. After:
     confirm that what a VISITOR is served agrees, over HTTPS through the CDN,
     because syncing and assuming it landed is not verification.
     ⛔ ORDER IS LOAD-BEARING. If the local check moved after the upload, a bad
     document is published first and withdrawn never.
     MUTATION: delete either call, or swap the local one past the upload. */
  const job = jobText('ingest.yml', 'measure');
  const local = job.indexOf('tools/measured-through.mjs --dir ingest');
  const upload = job.search(/aws s3 cp "ingest\/\$f"/);
  const live = job.search(/measured-through\.mjs(?!\s*--dir)\s*$/m);
  assert.ok(local >= 0, 'nothing checks the span before the measurement is published');
  assert.ok(live >= 0, 'nothing checks the span of the PUBLISHED documents');
  assert.ok(upload >= 0, 'the publish step is gone, so this ordering gate reads nothing');
  assert.ok(local < upload, 'the span is checked only after the document is already live');
  assert.ok(upload < live, 'the published-document check runs before anything is published');
});

test('⛔⛔ the committed build input cannot move without a deploy being asked for', () => {
  /* ⛔⛔⛔ A PUSH MADE WITH THE GITHUB_TOKEN DOES NOT TRIGGER A WORKFLOW. GitHub
     suppresses it to stop recursion, and `deploy.yml` triggers on
     `push: branches: [main]` — so the commit lands and the deploy never fires.
     `data/measures.json` is the build input for six learn pages that carry no
     scripts and cannot fetch the archive, so without the dispatch the history
     gains a commit saying the figures moved while the pages still print the old
     ones. That is worse than not committing at all, because the commit is the
     evidence someone would check.
     MUTATION: delete the dispatch step and this names it. */
  const job = jobText('ingest.yml', 'measure');
  assert.match(job, /cp ingest\/measures\.json data\/measures\.json/,
    'the learn pages’ build input is no longer refreshed');
  assert.match(job, /gh workflow run deploy\.yml/,
    'the build input is committed and no deploy is requested — a GITHUB_TOKEN push '
    + 'does not trigger one, so the learn pages would hold the old figures');
  // AND IT ASKS ONLY WHEN SOMETHING CHANGED, or every quiet night dispatches a
  // deploy of an identical tree.
  assert.match(job, /if: steps\.commit\.outputs\.pushed == '1'/,
    'the deploy is dispatched unconditionally, including on nights with no change');
  // The permissions the two steps need, named at the job. Without either, the
  // step fails at the end of a job that has already published correctly.
  /* ANCHORED TO THE START OF A LINE so a commented-out permission cannot
     satisfy this, and tolerant of a TRAILING comment, which both of these carry
     — the first spelling of this assertion rejected the real file. */
  assert.match(job, /^\s*contents: write\s*(#.*)?$/m, 'the job cannot commit');
  assert.match(job, /^\s*actions: write\s*(#.*)?$/m, 'the job cannot dispatch the deploy');

  /* ⛔⛔⛔ AND IT MAY NOT PUSH A TREE THAT DOES NOT PASS. Refreshing that one
     file cascades: `snapshots.mjs` rewrites a banner into sixteen design
     documents, `health.mjs` rewrites the block at the top of docs/status.md, and
     the learn pages and front door are rebuilt from it. Those are all generated,
     so the job regenerates them — but `test/quoted-figures.test.js` holds
     hand-written sentences in `sentence.js` and `blocked.js` to the published
     figures, and a count like "1,567 of 3,946 games" moves with every night of
     hockey. Sooner or later this step produces a tree that does not pass, and
     `deploy.yml` runs `npm run gates` before deploying — so a red push would
     fail the deploy it dispatches AND leave `main` red for the next person.
     ⭐ GATES BEFORE THE PUSH, AND THE ORDER IS THE ASSERTION. Running them
     afterwards would be a report about a commit that had already landed.
     MUTATION: move `npm run gates` below `git push`, or delete it, and this
     fires. */
  const gates = job.indexOf('npm run gates');
  const push = job.indexOf('git push');
  assert.ok(gates >= 0,
    'the nightly refreshes the build input and never checks the tree it is about to '
    + 'push; the dispatched deploy runs gates and would fail, with main left red');
  assert.ok(push >= 0, 'the commit step no longer pushes, so this ordering gate reads nothing');
  assert.ok(gates < push, 'gates run AFTER the push — that is a report, not a gate');
  /* AND THE GENERATED THINGS ARE REGENERATED, or gates fail every night on a
     staleness the job itself created. Named individually: each is a separate
     generator with its own `--check` in the gate. */
  for (const gen of [/node tools\/snapshots\.mjs/, /node builders\/health\.mjs/,
                     /npm run build/])
    assert.match(job, gen,
      `the job refreshes data/measures.json without re-running ${gen} — the gate for `
      + 'it will fail on a staleness this job created');
});

test('⭐ the measurement is CHAINED to the ingest, not a cron of its own', () => {
  /* ⭐ KEVIN'S RULING 5, AND IT IS THE REASON THE LAG IS ZERO RATHER THAN
     BOUNDED. The last game of a night ends about 01:30 ET, the ingest fires
     02:47 ET, the earliest puck drop is about 12:00 ET — so the archive is
     frozen for roughly ten hours and a job inside that window measures a still
     archive. A schedule of its own could drift out of the window; a `needs:`
     cannot. He corrected a hedge of mine to get here: *"we scheduled the derive,
     ingest, etc. in the middle of the night... for exactly that reason."*
     AND IT RUNS ON A RED INGEST, DELIBERATELY: that job's last two steps fail
     the run over a naming gap or one errored game, both on top of an archive
     that published correctly, and skipping the measurement for those would leave
     the exact drift this job closes.
     MUTATION: comment out `needs: ingest`, drop `!cancelled()`, or remove either
     output guard, and the chain is gone or the job is skipped on the nights it
     matters. */
  const job = jobText('ingest.yml', 'measure');
  assert.match(job, /^\s*needs: ingest\s*$/m,
    'the measurement is no longer chained to the ingest');
  assert.doesNotMatch(job, /^\s+schedule:/m, 'the measurement has a cron of its own now');
  assert.match(job, /!cancelled\(\)/,
    'the job is skipped whenever the ingest job is red, including for faults that '
    + 'sit on top of an archive that published correctly');
  assert.match(job, /needs\.ingest\.outputs\.synced == '1'/,
    'nothing requires the archive to have actually been published first');
  /* ⛔ AND A HALT STOPS IT. `code == 2` is a deliberate halt in fetch_nhl.py and
     nothing downstream of a halt should run — the same spelling the derive step
     uses. ⚠️ The build spec glossed 2 as "changed"; it is HALTED. */
  assert.match(job, /needs\.ingest\.outputs\.code != '2'/,
    'the measurement would run on top of a halted fetch');
  /* AND THE TWO OUTPUTS EXIST TO BE READ. A job condition naming an output the
     producing job never declares is `'' != '2'` — true — so the guard would read
     as present and gate on nothing. */
  const ing = jobText('ingest.yml', 'ingest');
  assert.match(ing, /^\s*code: \$\{\{ steps\.fetch\.outputs\.code \}\}\s*$/m,
    'the measure job gates on an output the ingest job does not declare');
  assert.match(ing, /^\s*synced: \$\{\{ steps\.sync\.outputs\.done \}\}\s*$/m,
    'the measure job gates on an output the ingest job does not declare');
});

test('⭐ the publish step names its two documents and re-uploads nothing else', () => {
  /* The job downloads ~0.4 GB of extracts to measure them. An `aws s3 sync
     ingest/` afterwards would push all of it back and rewrite every extract's
     cache headers — and extracts are served with headers chosen in the ingest's
     own sync, which this job must not relitigate.
     MUTATION: replace the loop with `aws s3 sync ingest/ s3://...` and this
     fires. */
  const job = jobText('ingest.yml', 'measure');
  assert.match(job, /for f in measures\.json teams\.json; do/,
    'the publish step no longer names exactly the two documents this job writes');
  const pushes = [...job.matchAll(/aws s3 sync [^\n]*ingest\/[^\n]*s3:/g)];
  assert.deepEqual(pushes.map(m => m[0]), [],
    'the job syncs its whole working tree back to the bucket, re-uploading the archive');
});

/**
 * ⛔⛔⛔ A REFERENCE TO A STEP THAT DOES NOT EXIST IS THE EMPTY STRING, AND THE
 * EMPTY STRING PASSES A GUARD.
 *
 * Found 2026-10-03 by mutating the job this file's block above was written for.
 * The `measure` job runs only `if: needs.ingest.outputs.synced == '1'`, and the
 * ingest job declares `synced: ${{ steps.sync.outputs.done }}`. Delete `id: sync`
 * from the step that sets it and GitHub resolves the expression to `''`, the
 * condition is false, and **the measurement silently never runs again** — no
 * error, no red, a skipped job in a workflow whose other job is green. The gates
 * written minutes earlier all passed: each one checked that the reference was
 * there, and none that it pointed at anything.
 *
 * ⭐ THE SHAPE IS THIS REPO'S MOST EXPENSIVE ONE, in a new place: a pair that
 * must agree, held in two spellings, with nothing crossing them. So this is
 * generic over every workflow rather than a patch to the one job — the next
 * output somebody wires up gets it for free.
 *
 * ⚠️ IT ASSERTS BOTH HALVES. That the step exists, AND that something in the job
 * actually writes that name into `$GITHUB_OUTPUT` — a step with the right id
 * that sets nothing resolves to the empty string in exactly the same way.
 */
test('⛔⛔⛔ every `steps.X.outputs.Y` in a workflow names a step that sets it', () => {
  let checked = 0;
  for (const file of FILES) {
    const text = readFileSync(new URL(file, DIR), 'utf8');
    const jobs = text.slice(text.search(/^jobs:$/m));
    // Each job, by its two-space key, so a reference is only ever matched
    // against the steps of the job it is written in.
    const names = [...jobs.matchAll(/^  ([a-z][\w-]*):$/gm)];
    assert.ok(names.length, `${file} declares no jobs — this scan is reading it wrong`);
    for (let k = 0; k < names.length; k++) {
      const from = names[k].index;
      const to = k + 1 < names.length ? names[k + 1].index : jobs.length;
      const job = jobs.slice(from, to);
      const code = job.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
      const ids = new Set([...code.matchAll(/^\s*id:\s*([\w-]+)\s*$/gm)].map(m => m[1]));
      for (const ref of code.matchAll(/steps\.([\w-]+)\.outputs\.([\w-]+)/g)) {
        checked++;
        const [, id, out] = ref;
        assert.ok(ids.has(id),
          `${file} / job \`${names[k][1]}\` reads \`steps.${id}.outputs.${out}\` and has no `
          + `step with \`id: ${id}\`. That resolves to the empty string, so the guard or `
          + 'output reading it is silently inert rather than failing.');
        /* THE STEP MUST ALSO SET IT. `echo "name=…" >> "$GITHUB_OUTPUT"` is the
           only way an output comes into being; a step with the right id that
           writes nothing is the same empty string by a longer route. */
        assert.match(code, new RegExp(`${out}=[^\\n]*>>[^\\n]*GITHUB_OUTPUT`),
          `${file} / job \`${names[k][1]}\` reads \`steps.${id}.outputs.${out}\` and no step `
          + `in it writes \`${out}=\` to $GITHUB_OUTPUT.`);
      }
    }
  }
  /* ⛔ AND THE SCAN MUST HAVE FOUND SOMETHING. A regex that matches nothing is
     the most agreeable gate there is — the lesson a `sed` the shell refused
     taught this repo at the cost of a guard that approved everything for days. */
  assert.ok(checked >= 4,
    `only ${checked} step-output references found across ${FILES.length} workflows — `
    + 'the scan is not reading them');
});

/**
 * ⛔⛔⛔ A JOB THAT RUNS THE FULL GATE NEEDS THE FULL HISTORY.
 *
 * Found by the first scheduled run of the nightly `measure` job, 2026-10-03. It
 * pulled the archive, measured it, checked the span, published the measurement
 * and verified it live — every one of those green — and then failed running
 * `npm run gates`, because `actions/checkout` defaults to a SHALLOW clone and
 * `npm run refcheck` reads revision-pinned citations out of the design docs. 17
 * of 117 citations could not be resolved at all.
 *
 * ⭐ THE TOOL SAVED THE AFTERNOON AND THE GATE SAVES THE RUN. `refcheck` prints
 * *"THIS CLONE IS SHALLOW, so no revision-pinned citation can be read at all.
 * The breaks above are almost certainly this and not the documents. Fix the
 * CHECKOUT, not the docs"* — with the YAML. That is a tool that knows which of
 * its own failures is an environment problem, and it is the reason this cost one
 * run. But nothing ASSERTED the precondition, so the way to find out was to run
 * it in CI against a live archive.
 *
 * ⚠️ `gates.yml` and `deploy.yml` had both carried `fetch-depth: 0` since they
 * were written — the knowledge existed in two files and in neither as a rule,
 * which is this repo's most-logged shape. The `ingest` job legitimately does not
 * need it: its own step named "gates" is the Python suite alone, not the
 * composite. So the rule is spelled against WHAT A JOB RUNS, not against a list
 * of jobs that need it.
 */
test('⛔⛔⛔ every job that runs `npm run gates` checks out the full history', () => {
  let checked = 0;
  for (const file of FILES) {
    const text = readFileSync(new URL(file, DIR), 'utf8');
    const jobs = text.slice(text.search(/^jobs:$/m));
    const names = [...jobs.matchAll(/^  ([a-z][\w-]*):$/gm)];
    for (let k = 0; k < names.length; k++) {
      const job = jobs.slice(names[k].index,
        k + 1 < names.length ? names[k + 1].index : jobs.length)
        .split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
      /* THE COMPOSITE GATE, NOT A STEP THAT HAPPENS TO BE CALLED "gates".
         `ingest`'s own gates step runs `python3 -m unittest` and needs no
         history; naming the command is what tells the two apart. */
      if (!/npm run gates/.test(job)) continue;
      checked++;
      const where = `${file} / job \`${names[k][1]}\``;
      assert.match(job, /uses: actions\/checkout@v\d+\s*\n\s*with:\s*\n\s*fetch-depth: 0/,
        `${where} runs \`npm run gates\` and checks out shallow. \`npm run refcheck\` `
        + 'reads revision-pinned citations from the docs and cannot resolve one in a '
        + 'shallow clone, so the gate fails naming 17 documents that are all fine. '
        + 'Add `with: fetch-depth: 0` to the checkout.');
    }
  }
  /* ⛔ AND IT MUST HAVE FOUND THEM. Three jobs run the composite gate today —
     gates, deploy and the nightly measure. A scan finding none would report that
     every workflow is correct, which is the vacuous-gate shape this file exists
     to stop. */
  assert.ok(checked >= 3,
    `only ${checked} jobs found running \`npm run gates\` — the scan is not reading them`);
});

/**
 * ⛔⛔⛔ THE BUILD COMES BEFORE THE HEALTH BLOCK, IN EVERY JOB THAT RUNS BOTH.
 *
 * `builders/health.mjs` RUNS THE SUITE to count it, and the suite reads the BUILT
 * pages. So a step that writes the health block before rebuilding is counting a
 * suite pointed at pages built from the previous document.
 *
 * ⛔ IT COST THE NIGHTLY ON 2026-10-04. The measure job refreshed
 * `data/measures.json`, wrote the snapshot banners, then ran `health.mjs` — and
 * one test compared a stale built page against the fresh document and failed. The
 * block recorded 1,623 PASSES where the real figure is 1,624; `npm run build` then
 * fixed the pages, the suite went green, and `health --check` failed on a
 * disagreement with itself. The archive, the publish and the measurement were all
 * correct. The only thing wrong was the order of two lines.
 *
 * ⚠️ IT IS SPELLED AGAINST WHAT A STEP RUNS, not against a list of jobs — the same
 * shape as the `fetch-depth` rule above, and for the same reason: a list of jobs
 * is a second place for the knowledge to live and rot.
 */
test('⛔⛔⛔ no job writes the health block before building the pages it counts', () => {
  let checked = 0;
  for (const file of FILES) {
    const text = readFileSync(new URL(file, DIR), 'utf8');
    /* COMMENTS STRIPPED, because this very test's reason is written beside the
       code it is about — and a scan that read prose would find `health.mjs` named
       in the paragraph explaining the ordering and judge the explanation. Fifth
       instance of that shape in this repo. */
    const code = text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
    const build = code.indexOf('npm run build');
    const health = code.search(/node builders\/health\.mjs(?!\s*--check)/);
    if (build < 0 || health < 0) continue;
    checked++;
    assert.ok(build < health,
      `${file} runs \`node builders/health.mjs\` at ${health} and \`npm run build\` at `
      + `${build}. health.mjs runs the suite, the suite reads the built pages, so the `
      + 'block would record a count taken against pages built from the last document.');
  }
  /* ⛔ AND IT MUST HAVE FOUND A JOB. A renamed script or a moved file turns this
     into a test that passes on an empty set forever. */
  assert.ok(checked >= 1,
    'no workflow runs both `npm run build` and the health writer, so this rule is '
    + 'guarding nothing — check the command names have not moved');
});

test('⭐⭐⭐ the measure job runs only when the run derived something', () => {
  /* ⛔⛔ KEVIN, 2026-10-05: *"there was a failed ingest at 3:18 eastern this
     afternoon, can you look into that please."* The `ingest` job was green through
     all seventeen steps; the `measure` job behind it never got a runner from
     GitHub, sat fifteen minutes to the second, and was cancelled, which takes the
     run red. **NOTHING HERE WOULD HAVE PREVENTED THAT** — that run derived a game
     and the job had real work. What this rule removes is the other kind: two of
     that day's six runs derived NOTHING and still pulled 373 MB of extracts, ran
     `npm run gates` and committed a file identical to the one already in the repo.

     ⭐ THE COST OF THOSE IS NOT THE MINUTES. Every pointless job is a fresh chance
     for an infrastructure cancellation to paint the ingest red for no reason, and
     a red ingest that means nothing teaches us to stop reading red ingests. This
     repo has already paid for that: a publish halt went unquestioned for 31 hours
     in September because the failure looked familiar.

     ⛔⛔⛔ AND I GOT THE SIGNAL WRONG TWICE BEFORE THIS, WHICH IS THE PART TO KEEP.
     First I read `nothing new this run — no index written` out of a run log and
     believed it: **a GitHub log contains the SHELL SOURCE of every step, so I had
     matched the text of an `echo` in a branch that never ran.** A string in a log
     is not a thing that happened. Then I gated on `ingest/index.json` existing,
     copying the ledger step above — but derive writes that index on EVERY run,
     including one that derived nothing, so the condition could never be false and
     would have shipped INERT. The only honest signal is the derive report's own
     count, and it is checked here against the shape that actually appears in the
     published document (`run.derived`).

     MUTATION: gate on the index file again, or drop `changed` from the `if`, and
     this fires. */
  const yml = readFileSync(new URL('ingest.yml', DIR), 'utf8');

  const outputs = /^\s*outputs:\s*$([\s\S]*?)^\s{4}steps:/m.exec(yml);
  assert.ok(outputs, 'the ingest job declares no outputs block any more');
  assert.match(outputs[1], /changed:\s*\$\{\{\s*steps\.sync\.outputs\.changed\s*\}\}/,
    'the ingest job no longer publishes a `changed` output');

  /* ⚠️ PINNED TO THE SOURCE, NOT THE NAME. Setting `changed` to `done`, or to the
     existence of a file written every run, would satisfy a check that only looked
     for the word — and both are mistakes already made here. */
  assert.match(yml, /\['run'\]\.get\('derived'/,
    '`changed` is no longer read from the derive report\'s own `run.derived` count');
  assert.doesNotMatch(yml, /if \[ -f ingest\/index\.json \]; then\s*\n\s*echo "changed=1"/,
    '`changed` is back to keying on the index file, which is written on every run '
    + 'including one that derived nothing — the condition could never be false');

  /* ⚠️ UNKNOWN MUST MEAN MEASURE. Skipping on a question we could not answer
     trades a wasted job for a silently unmeasured amendment, and only one of
     those is caught by anything downstream. */
  assert.match(yml, /\.get\('derived',\s*1\)/,
    'a missing `derived` key now defaults to skipping the measurement');
  assert.match(yml, /\|\| DERIVED=1/,
    'a failure to read the count no longer falls back to measuring');

  const cond = (/^\s{4}if:\s*\$\{\{([\s\S]*?)\}\}/m.exec(
    yml.slice(yml.indexOf('\n  measure:'))) || [])[1];
  assert.ok(cond, 'the measure job has no `if` at all, so it runs on every ingest');
  const flat = cond.replace(/\s+/g, ' ');
  for (const need of ["needs.ingest.outputs.changed == '1'",
                      "needs.ingest.outputs.synced == '1'",
                      "needs.ingest.outputs.code != '2'",
                      '!cancelled()']) {
    assert.ok(flat.includes(need),
      `the measure job's condition dropped \`${need}\`: ${flat}`);
  }
});

test('⛔⛔⛔ every document the measure step WRITES is published by some workflow', () => {
  /* ⛔ `players.json` SHIPPED INERT ON 2026-10-07 AND EVERY GATE WAS GREEN.
     `measure.mjs` wrote it, the suite passed, `derive.yml` reported success — and
     the site answered 404, because the publish list is a shell `for f in …` naming
     the documents that existed when somebody typed it. A new archive document is
     therefore invisible by default, and the only symptom is a feature that does
     nothing.

     ⭐ THE SET IS DERIVED FROM THE WRITER, which is the half that makes this a
     gate rather than a second list to keep in step: whatever `measure.mjs` writes
     into `--out` has to be published by SOMETHING, or named here as deliberately
     local. A document nobody publishes and nobody excepted is the defect.

     ⚠️ IT DOES NOT CARE WHICH WORKFLOW. `recent.json` is the nightly's and
     `players.json` is the weekly derive's, because one describes a slate and the
     other describes the archive — which workflow is a judgement about what the
     document MEANS. That it reaches the bucket at all is not.

     MUTATION: drop a name from either `for f in …` list and this fires. */
  const measure = readFileSync(new URL('../builders/measure.mjs', import.meta.url), 'utf8');
  const written = [...measure.matchAll(/join\(out, '([a-z.]+\.json)'\)/g)].map(m => m[1]);
  const docs = [...new Set(written)].sort();
  assert.ok(docs.length >= 4,
    `only ${docs.length} documents found in measure.mjs — the pattern has lost its subject`);

  const yml = ['derive.yml', 'ingest.yml']
    .map(f => readFileSync(new URL(`../.github/workflows/${f}`, import.meta.url), 'utf8'))
    .join('\n');
  /* ⚠️ READ OFF THE `for f in …` LISTS, not off the whole file. A name that
     appears only in a comment — or in a `--exclude` — is not a name that gets
     uploaded, and this gate exists precisely because the words about the code
     and the code disagreed. */
  const published = new Set(
    [...yml.matchAll(/for f in ([a-z0-9.\- ]+); do/g)]
      .flatMap(m => m[1].trim().split(/\s+/)));
  assert.ok(published.has('catalog.json'),
    `the publish lists were not found — parsed ${[...published].join(', ')}`);

  const missing = docs.filter(d => !published.has(d));
  assert.deepEqual(missing, [],
    `measure.mjs writes ${missing.join(', ')} and no workflow uploads it — the `
    + 'document is built, committed to nothing, and 404s for every reader');
});
