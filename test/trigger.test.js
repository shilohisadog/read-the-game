/**
 * THE INGEST TRIGGER — the Worker that makes the nightly's start time ours.
 *
 * ⭐ WHAT A TEST CAN PROVE HERE AND WHAT IT CANNOT. Nothing in this file reaches
 * GitHub, so none of it proves a dispatch works; the first real evidence of that
 * is an `ingest` run whose event is `workflow_dispatch` at the cron's minute.
 * What IS provable without a network is the half that has broken every
 * integration in this repo so far: that the thing being pointed at is the thing
 * that exists. The URL names this repository and a workflow file on disk, that
 * workflow still declares the `workflow_dispatch` trigger the Worker depends on,
 * and the config that deploys it is referenced by a workflow that runs.
 *
 * ⛔ THE FAILURE THIS IS MOSTLY FOR: `ingest.yml` losing its `workflow_dispatch:`
 * block. The Worker would 422 every morning, nothing would page anyone, the
 * GitHub crons would keep the site current at the old 90%, and the fix we built
 * this for would be dead with every gate green.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import worker, { dispatchRequest, fire, OWNER, REPO, WORKFLOW, REF, DISPATCH_OK }
  from '../worker/trigger.js';

const at = p => fileURLToPath(new URL(p, import.meta.url));
const read = p => readFileSync(at(p), 'utf8');
const TOML = read('../worker/wrangler.toml');

const ok = { status: DISPATCH_OK, text: async () => '' };
const refused = (status, body) => ({ status, text: async () => body });

test('with no token it says which secret is missing, rather than posting without one', () => {
  assert.throws(() => dispatchRequest(''), /GITHUB_TOKEN/);
  assert.throws(() => dispatchRequest(undefined), /wrangler secret put/);
});

test('⭐ the URL names THIS repository, read from the remote rather than trusted', () => {
  /* ⛔ THE HOLE THIS CLOSES. `OWNER` and `REPO` are typed constants in a file
     nothing else imports, which is the shape this repo has already been bitten
     by: a constant that drifts and a gate that reads it back to itself. The
     remote is the one statement of the repository's identity that is not ours
     to type. */
  const remote = execFileSync('git', ['remote', 'get-url', 'origin'],
    { cwd: at('..'), encoding: 'utf8' }).trim();
  assert.ok(remote, 'no origin remote — this check proved nothing');
  const m = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote);
  assert.ok(m, `the origin remote is not a GitHub URL: ${remote}`);
  assert.equal(`${OWNER}/${REPO}`, `${m[1]}/${m[2]}`,
    'the Worker would dispatch to a repository this checkout is not');
});

test('⭐ the workflow it dispatches exists AND still accepts a dispatch', () => {
  const p = `../.github/workflows/${WORKFLOW}`;
  assert.ok(existsSync(at(p)), `${WORKFLOW} is not in .github/workflows`);
  /* The trigger block, not the word: `workflow_dispatch` appears in prose in
     several of these files, and a grep for the bare token would pass on a
     comment explaining that it was removed. It has to be a key at the top level
     of `on:`, which in this file is two spaces of indent followed by a colon. */
  assert.match(read(p), /^ {2}workflow_dispatch:/m,
    `${WORKFLOW} no longer declares workflow_dispatch — every dispatch would 422`);
});

test('⭐⭐ the body carries the ref and NOTHING else', () => {
  /* The rule in trigger.js made mechanical: a Worker that computes nothing has
     nothing to say in the body. The day this grows an input is the day the
     window, or the delay, or a date exists in two places — and the copy in the
     Worker is the one no audit of the pipeline reads. */
  const [, init] = dispatchRequest('t0ken');
  assert.deepEqual(Object.keys(JSON.parse(init.body)), ['ref']);
  assert.equal(JSON.parse(init.body).ref, REF);
  assert.equal(init.method, 'POST');
});

test('the request carries a User-Agent, which GitHub refuses with a 403 without', () => {
  /* ⚠️ Named because the refusal reads as a permissions failure and sends you
     to the token, which is the wrong end of the problem entirely. */
  const [url, init] = dispatchRequest('t0ken');
  assert.ok(init.headers['User-Agent'], 'no User-Agent — GitHub answers 403');
  assert.equal(init.headers.Authorization, 'Bearer t0ken');
  assert.equal(url,
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`);
});

test('a refusal throws with the status in it, instead of passing for a success', async () => {
  let seen = null;
  await assert.rejects(
    () => fire({ GITHUB_TOKEN: 't0ken' }, async (u, i) => (seen = [u, i], refused(401, 'Bad credentials'))),
    /401.*Bad credentials/);
  assert.ok(seen, 'the fake fetch was never called, so this proved nothing');
  assert.equal(await fire({ GITHUB_TOKEN: 't0ken' }, async () => ok), DISPATCH_OK);
});

test('⛔ there is no HTTP door: the fetch handler answers 404 and dispatches nothing', async () => {
  /* An unauthenticated build trigger on the open internet is what this is not.
     ⭐ The stronger half is the second assertion: it is not enough that the
     ANSWER is 404, the handler must not have reached the network on the way to
     saying it. A handler that fired the dispatch and then returned 404 would
     satisfy a test that read only the status. */
  const before = globalThis.fetch;
  let called = 0;
  globalThis.fetch = async () => (called++, ok);
  try {
    const res = await worker.fetch(new Request('https://example.invalid/'));
    assert.equal(res.status, 404);
  } finally { globalThis.fetch = before; }
  assert.equal(called, 0, 'the fetch handler reached the network');
});

test('the cron entries are off the hour and the half hour, as both files say', () => {
  const crons = [...TOML.matchAll(/"(\d+) (\d+) \* \* \*"/g)].map(m => [+m[1], +m[2]]);
  assert.ok(crons.length >= 1, 'no cron triggers found in wrangler.toml — the Worker would never fire');
  for (const [min, hour] of crons) {
    assert.ok(min !== 0 && min !== 30,
      `${hour}:${String(min).padStart(2, '0')} is on the hour or the half hour, which is where the platform queues`);
  }
});

test('⭐ the Worker is actually deployed by something — code nobody ships is code nobody has', () => {
  /* This repo has shipped unreachable code before and deleted it later. A
     Worker with no deploy step is a file that passes every test here and has
     never run. */
  const wf = read('../.github/workflows/trigger.yml');
  assert.match(wf, /worker\/wrangler\.toml/, 'the deploy workflow does not name this config');
  assert.match(TOML, /^main = "trigger\.js"$/m);
  assert.ok(existsSync(at('../worker/trigger.js')), 'wrangler.toml points at a file that is not there');
});
