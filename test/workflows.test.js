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
