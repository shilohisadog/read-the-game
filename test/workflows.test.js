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
