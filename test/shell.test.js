/**
 * src/game.html — the same app, any game, fetched at load.
 *
 * This is the page a LINK points at. "35–25 and they lost, watch why" is the
 * shareable unit, so this is the page a stranger lands on first, and the one
 * that has to behave when the thing it depends on is missing.
 *
 * The property these tests exist to protect is that there is ONE renderer.
 * `game.html` and `read-the-game.html` are the same template: the whole app is
 * `boot(G)`, and the only difference is whether G arrives as a literal or over
 * the network. A second renderer is where the wrong number hides — this project
 * shipped a wrong Corsi count exactly that way — so the equality is asserted
 * rather than maintained by care.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SRC = new URL('../src/', import.meta.url);
const shell = readFileSync(new URL('game.html', SRC), 'utf8');
const inlined = readFileSync(new URL('read-the-game.html', SRC), 'utf8');
const scriptOf = h => h.match(/<script>([\s\S]*?)<\/script>/)[1];

test('the shell and the inlined page are the same renderer', () => {
  // Both scripts are `function boot(G){…}` plus a tail that calls it. Anchor on
  // boot's last statement rather than on a brace: the shell's tail contains its
  // own closing braces, so `lastIndexOf('}')` lands inside the bootstrap and
  // compares the wrong thing. (It did, on the first run of this test.)
  const END = 'drawRink();set(EV.length-1,false);';
  const body = s => {
    const at = s.indexOf(END);
    assert.notEqual(at, -1, 'boot must still end where this test thinks it does');
    return s.slice(0, at + END.length);
  };
  const a = body(scriptOf(shell)), b = body(scriptOf(inlined));
  assert.ok(a.length > 10000, 'the shared body is the whole app, not a stub');
  assert.equal(a, b, 'the two pages must share one renderer, byte for byte');
});

test('the shell ships no game inside it', () => {
  // If a game were compiled in, the page would be a lie by the next morning and
  // the archive could not grow without a deploy. Pages serves CODE, R2 serves
  // DATA.
  const s = scriptOf(shell);
  assert.doesNotMatch(s, /"rosterSpots"|"shifts":\[\{/, 'no embedded feed');
  assert.ok(shell.length < inlined.length / 1.5,
    `the shell is ${shell.length} bytes against ${inlined.length} inlined`);
});

test('the no-network promise is enforced by the browser, not by a grep', () => {
  const csp = shell.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'the shell fetches, so it must carry a policy');
  const p = csp[1];
  assert.match(p, /default-src 'none'/);
  assert.match(p, /connect-src 'self' https:\/\/data\.readthegame\.co/);
  assert.doesNotMatch(p, /unsafe-inline|unsafe-eval/);
});

test('the CSP hashes match the bytes actually shipped', () => {
  // A hash-pinned policy with a stale hash is a BLANK PAGE THAT PASSES A GREP.
  // Recompute from the shipped file rather than trusting the builder.
  const p = shell.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const [re_, directive] of [
    [/<script>([\s\S]*?)<\/script>/, 'script-src'],
    [/<style>([\s\S]*?)<\/style>/, 'style-src'],
  ]) {
    const want = `'sha256-${createHash('sha256').update(shell.match(re_)[1]).digest('base64')}'`;
    assert.equal(p.match(new RegExp(`${directive} ([^;]+)`))[1], want,
      `${directive} does not match what it ships`);
  }
});

/** Run the shell's script against fakes and record what it asks the network for. */
function run({ search = '', responses = {} } = {}) {
  const asked = [];
  const said = [];
  const el = { set textContent(v) { said.push(String(v)); }, setAttribute() {} };
  const document = { getElementById: () => el, querySelectorAll: () => [] };
  const fetch = url => {
    asked.push(url);
    const key = Object.keys(responses).find(k => url.includes(k));
    if (!key) return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({ ok: true, status: 200,
                             json: () => Promise.resolve(responses[key]) });
  };
  new Function('document', 'fetch', 'location', scriptOf(shell))(
    document, fetch, { search });
  return { asked, said, settle: () => new Promise(r => setTimeout(r, 0)) };
}

const CATALOG = { games: [
  { id: 2025020001, d: '2026-01-10', v: 1 },
  { id: 2025030416, d: '2026-06-14', v: 1 },
  { id: 2025090030, d: '2026-02-22', v: 0, r: 'validation' },
]};

test('with no game named, it asks the catalog and takes the most recent', () => {
  const r = run({ search: '', responses: { 'catalog.json': CATALOG } });
  return r.settle().then(() => {
    assert.equal(r.asked[0], 'https://data.readthegame.co/catalog.json');
    assert.match(r.asked[1], /extract\/2025030416\.json$/,
      'the Cup final is the most recent — and "most recent" is READ, never baked in');
  });
});

test('it will not land you on a game it cannot show', () => {
  // MUTATION GUARD. Refused games are in the catalog on purpose (a calendar
  // that hides them is a map of our successes). Sorting by date alone would
  // pick a refused game whenever one is newest, and open an empty theatre.
  const newestIsRefused = { games: [
    { id: 2025020001, d: '2026-01-10', v: 1 },
    { id: 2025090030, d: '2026-12-31', v: 0, r: 'validation' },
  ]};
  const r = run({ responses: { 'catalog.json': newestIsRefused } });
  return r.settle().then(() => {
    assert.match(r.asked[1], /extract\/2025020001\.json$/,
      'the newest VIEWABLE game, not the newest row');
  });
});

test('a named game is fetched directly, with no catalog round trip', () => {
  const r = run({ search: '?game=2023020204', responses: {} });
  return r.settle().then(() => {
    assert.equal(r.asked.length, 1, 'a permalink should cost one request');
    assert.match(r.asked[0], /extract\/2023020204\.json$/);
  });
});

test('a failure says something true instead of spinning', () => {
  // "Still loading" promises a future we cannot guarantee. The site has been
  // here before: a page that renders nothing and explains nothing is how the
  // CORS bug survived every check we owned.
  const r = run({ search: '?game=999', responses: {} });
  return r.settle().then(() => {
    const last = r.said[r.said.length - 1];
    assert.match(last, /could not be loaded/i);
    assert.match(last, /404/, 'and it names the reason, not just the fact');
    assert.doesNotMatch(r.said.join(' '), /still loading|please wait/i);
  });
});

test('an empty catalog is a stated condition, not a crash', () => {
  const r = run({ responses: { 'catalog.json': { games: [] } } });
  return r.settle().then(() => {
    assert.match(r.said[r.said.length - 1], /no game we can show/i);
  });
});
