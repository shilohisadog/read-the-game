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
  const END = 'drawRink();set(0,false);';
  const body = s => {
    const at = s.indexOf(END);
    assert.notEqual(at, -1, 'boot must still end where this test thinks it does');
    return s.slice(0, at + END.length);
  };
  const a = body(scriptOf(shell)), b = body(scriptOf(inlined));
  assert.ok(a.length > 10000, 'the shared body is the whole app, not a stub');
  assert.equal(a, b, 'the two pages must share one renderer, byte for byte');
});

test('the shell ships no game inside it, and the inlined page does', () => {
  // If a game were compiled in, the page would be a lie by the next morning and
  // the archive could not grow without a deploy. Pages serves CODE, R2 serves
  // DATA.
  //
  // THIS TEST HAD TWO PROBLEMS AND THE RENAME SURFACED BOTH.
  //
  // One: it matched `"rosterSpots"|"shifts":[{`, and `"rosterSpots"` is a key
  // from the RAW feed. `rich.json` has no such key, so that half could never
  // match either page — dead weight sitting inside an assertion, reading as
  // coverage. Only the second pattern was working.
  //
  // Two: the size check was `shell < inlined / 1.5`, and 1.5 is a number we
  // chose. Both pages share the whole app, so as the app grows the ratio drifts
  // toward 1 and the test fails for reasons that have nothing to do with an
  // embedded game — it went red on a copy change that renamed a layer. Loosening
  // the constant would buy a few months and teach nothing.
  //
  // So the claim is asserted STRUCTURALLY instead, and PAIRED: the inlined page
  // must trip every check the shell must pass, or none of them discriminate.
  const s = scriptOf(shell), inl = scriptOf(inlined);

  assert.match(inl, /boot\(\{"game"/, 'the inlined page should carry its game as a literal');
  assert.doesNotMatch(s, /boot\(\{/, 'the shell compiles a game into itself');

  assert.match(inl, /"shifts":\[\{/, 'the inlined page should carry the shift charts');
  assert.doesNotMatch(s, /"shifts":\[\{/, 'the shell carries an embedded feed');

  // And the size gap is DERIVED from the artifact rather than chosen: the
  // difference between the two pages is the game, so it must be the same order
  // as the game. Half of it is a wide margin that still collapses to a failure
  // the moment a game is compiled in.
  const game = JSON.stringify(JSON.parse(
    readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8')));
  assert.ok(inlined.length - shell.length > game.length / 2,
    `the two pages differ by ${inlined.length - shell.length} bytes, `
    + `against a game of ${game.length} — the shell may be carrying one`);
});

test('the no-network promise is enforced by the browser, not by a grep', () => {
  const csp = shell.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'the shell fetches, so it must carry a policy');
  const p = csp[1];
  assert.match(p, /default-src 'none'/);
  assert.match(p, /connect-src 'self' https:\/\/data\.readthegame\.co/);
  assert.doesNotMatch(p, /unsafe-inline|unsafe-eval/);
});

test('the CSP pins EVERY block it ships, and pins nothing else', () => {
  // A hash-pinned CSP with a stale hash is a BLANK PAGE THAT PASSES A GREP.
  // Recompute the digests from the shipped file rather than trusting the
  // builder that wrote them -- a check that shares its input with the thing it
  // checks is testing one assumption twice.
  //
  // THIS USED TO READ THE FIRST <style> AND THE FIRST <script> AND COMPARE THE
  // DIRECTIVE TO IT EXACTLY, which encoded the same assumption as the builder it
  // was checking: that a document holds exactly one of each. The shared chrome
  // added a second <style> in <head>, the builder's `re.search` pinned that one
  // and left the page's own stylesheet unhashed, and a browser would have
  // refused it -- the page rendering completely unstyled.
  //
  // So this is now SET EQUALITY, which is strictly stronger than what it
  // replaces: every shipped block must be pinned (or the browser refuses it),
  // AND nothing may be pinned that is not shipped (or a stale hash survives,
  // which is the failure the original sentence above is about).
  const p = shell.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const [tag, directive] of [['script', 'script-src'], ['style', 'style-src']]) {
    const shipped = [...shell.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))]
      .map(m => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
    assert.ok(shipped.length, `no <${tag}> found to check`);
    const pinned = p.match(new RegExp(`${directive} ([^;]+)`))[1].trim().split(/\s+/);
    assert.deepEqual(new Set(pinned), new Set(shipped),
      `${directive} pins ${pinned.length} hashes for ${shipped.length} shipped <${tag}> blocks`);
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

test('no page hard-codes a fact about one particular game', () => {
  // THE DEFECT THE SHELL EXPOSED. The game line printed "Nov 10 2023" as a
  // literal. Invisible while one game was compiled into one page; a wrong date
  // on every game in the archive the moment a shell renders any of them.
  //
  // The same shape as the counter labels reading "MIN attempts" above a
  // Carolina–Vegas game. Both were noted days before this page existed and both
  // were harmless right up until they weren't.
  const code = h => scriptOf(h).replace(/boot\(\{[\s\S]*\}\);\s*$/, '');  // drop the inlined data
  for (const [name, html] of [['game.html', shell], ['read-the-game.html', inlined]]) {
    const s = code(html);
    assert.doesNotMatch(s, /Nov 10 2023|November 10, 2023/, `${name}: a typed date`);
    assert.doesNotMatch(s, /'MIN attempts'|"MIN attempts"|`MIN attempts`/,
      `${name}: a typed team label`);
    assert.match(s, /G\.game\s*&&\s*G\.game\.date|G\.game\.date/,
      `${name}: the date must come from the extract`);
  }
});

test('the static markup may hold placeholders, but the script overwrites them', () => {
  // The placeholder in the HTML is fine — it is what a reader sees for the few
  // milliseconds before boot runs, and the deploy's browser gate proves the
  // script executes. What matters is that nothing SURVIVES it.
  assert.match(shell, /MIN attempts/, 'the placeholder is still in the markup');
  const s = scriptOf(shell);
  assert.match(s, /\.cc\.a \.lb/, 'and the script rewrites it from the data');
  assert.match(s, /\.cc\.h \.lb/);
});

test('the deploy gate cannot pass on a blank expectation', () => {
  // THE HOLE THAT WAS IN IT. The gate derives what the page should say from
  // catalog.json, then greps the rendered line for it — which is right, and was
  // built precisely so no expectation is typed by hand. But the derivation ran
  // inside `$(...)` feeding `read`, and `read` succeeds on empty input: an empty
  // catalog threw, printed a traceback, and left the expectation blank. `case
  // "$line" in *""*` matches EVERY string, so the check below it became
  // vacuous. It went red anyway, on a different branch — correct by accident,
  // which is indistinguishable from correct by design until the accident stops.
  const wf = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const step = wf.slice(wf.indexOf('a visitor can actually watch a game'));
  assert.match(step, /would pass on anything/,
    'a blank expectation must be an error, not a match-all');
  const blank = step.indexOf('would pass on anything');
  const compare = step.indexOf('which does not contain');
  assert.ok(blank !== -1 && compare !== -1 && blank < compare,
    'and it must be rejected BEFORE the comparison it would defeat');
});
