/**
 * `tools/edge-fetch.sh` — the one way this repo asks a fresh deployment for a page.
 *
 * ⛔⛔⛔ THE RULE IN IT HAS BEEN WRONG TWICE BY BEING NARROWED, and on 2026-09-24
 * a deploy failed because the rule had been applied to one of the two places
 * that fetch from a candidate. `/preview.html` answered 404 while
 * `/preview.html?game=...` — same deployment, same step, seconds earlier —
 * answered 200. Both served 200 minutes later.
 *
 * ⭐⭐ AND THE FIRST CHECK I WROTE FOR IT PROVED NOTHING. It pointed the helper
 * at production and asked for a path that does not exist, expecting the 404
 * branch: `readthegame.co` answers **200** for any missing path, so the branch
 * under test was never entered and the check passed on the wrong evidence. The
 * only way to exercise a 404 is to serve one, which is what this does.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const sh = promisify(execFile);
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** A server whose first `n404` requests 404 and whose rest answer `body`. */
function serve(n404, body) {
  let seen = 0;
  const srv = createServer((req, res) => {
    seen++;
    if (seen <= n404) { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(body);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1',
    () => r({ srv, port: srv.address().port, hits: () => seen })));
}

/* ⛔ ASYNC, AND THAT IS NOT A STYLE CHOICE. The first version used
   `execFileSync`, which blocks this process's event loop — so the server above
   could never accept the connection the child was waiting on, and the test hung
   until it was killed. A synchronous child and an in-process server are a
   deadlock, always. */
const run = async (port, args) => {
  try {
    const { stdout, stderr } = await sh('bash',
      ['-c', `. tools/edge-fetch.sh; edge_fetch ${args}`],
      { cwd: ROOT, env: { ...process.env, URL: `http://127.0.0.1:${port}`, EDGE_WAIT: '0' } });
    return { out: stdout + stderr, code: 0 };
  } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.code }; }
};

test('⭐ it waits out a 404 and returns the page that arrives late', async () => {
  const { srv, port, hits } = await serve(2, '<html>late</html>');
  try {
    const r = await run(port, `"thing.html" /tmp/edge-a.html retry404`);
    assert.equal(r.code, 0, `gave up on a 404 that cleared: ${r.out}`);
    assert.equal(hits(), 3, `asked ${hits()} times — it did not retry twice and then succeed`);
    assert.match(r.out, /attempt 1: HTTP 404/);
  } finally { srv.close(); }
});

test('⛔ without retry404 a 404 is reported at once, not waited out', async () => {
  const { srv, port, hits } = await serve(99, '');
  try {
    const r = await run(port, `"thing.html" /tmp/edge-b.html`);
    assert.equal(r.code, 1, 'a 404 with no retry asked for did not fail');
    assert.equal(hits(), 1, `asked ${hits()} times — it retried when it was told not to`);
    assert.match(r.out, /::error::\/thing\.html returned HTTP 404/);
  } finally { srv.close(); }
});

test('⛔ and it gives up eventually rather than hanging, naming the path', async () => {
  const { srv, port, hits } = await serve(99, '');
  try {
    const r = await run(port, `"thing.html" /tmp/edge-c.html retry404`);
    assert.equal(r.code, 1, 'a 404 that never cleared was reported as success');
    assert.equal(hits(), 12, `asked ${hits()} times — the attempt bound has moved`);
    assert.match(r.out, /never became available \(last HTTP 404\)/);
  } finally { srv.close(); }
});
