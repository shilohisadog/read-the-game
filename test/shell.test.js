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
import { readFileSync, readdirSync } from 'node:fs';
import { TEAMS } from '../src/lib/teams.js';
import { boot } from './helpers/page.js';
import { createHash } from 'node:crypto';

const SRC = new URL('../src/', import.meta.url);
const shell = readFileSync(new URL('game.html', SRC), 'utf8');
const inlined = readFileSync(new URL('read-the-game.html', SRC), 'utf8');
const scriptOf = h => h.match(/<script>([\s\S]*?)<\/script>/)[1];

/**
 * Everything from the top of the script to the closing brace of `boot`.
 *
 * FOUND BY COUNTING BRACES, NOT BY A LITERAL. This used to anchor on boot's
 * last statement — `drawRink();set(0,false);` — which meant the test failed the
 * next time that statement changed, and failed with "boot must still end where
 * this test thinks it does" rather than with anything about the two pages. A
 * test whose anchor is a line of the implementation is a test that goes red for
 * edits it has no opinion about, and the temptation each time is to re-anchor
 * it, which is how a check quietly loses its subject.
 *
 * `lastIndexOf('}')` is not the answer either: the shell's tail carries its own
 * braces, so it lands inside the bootstrap and compares the wrong thing. (It
 * did, on the first run of this test.)
 */
function rendererOf(script) {
  const start = script.indexOf('function boot(');
  assert.notEqual(start, -1, 'no boot() in this page');
  let depth = 0;
  for (let i = script.indexOf('{', start); i < script.length; i++) {
    if (script[i] === '{') depth++;
    else if (script[i] === '}' && --depth === 0) return script.slice(0, i + 1);
  }
  throw new Error('boot() is never closed');
}

test('the shell and the inlined page are the same renderer', () => {
  const a = rendererOf(scriptOf(shell)), b = rendererOf(scriptOf(inlined));
  assert.ok(a.length > 10000, 'the shared body is the whole app, not a stub');
  assert.equal(a, b, 'the two pages must share one renderer, byte for byte');
  // The library is hoisted above boot() so the bootstrap can use the same URL
  // parser the renderer does; that hoist must not have left one page behind.
  for (const [name, s] of [['shell', a], ['inlined', b]])
    assert.ok(s.indexOf('src/lib/deeplink.js') < s.indexOf('function boot('),
      `${name}: the library must sit above boot(), where both halves can reach it`);
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

  // NO DIRECTIVE THAT A <meta> POLICY SILENTLY DROPS. The spec names exactly
  // three that are ignored outside an HTTP header, and we shipped one of them
  // for months: `frame-ancestors 'self'`, with a comment in page.py describing
  // it as protection against other sites framing us. It was doing nothing, and
  // Chrome said so on every page load — "ignored when delivered via a <meta>
  // element" — into a console nothing was reading.
  //
  // A directive that cannot take effect is the CSP-shaped version of a check
  // that cannot fail, and it is worse than an absent one: it reads as a promise.
  // If we want any of these, they have to be sent as headers.
  for (const dead of ['frame-ancestors', 'report-uri', 'sandbox'])
    assert.doesNotMatch(p, new RegExp(`\\b${dead}\\b`),
      `${dead} is ignored in a <meta> policy — it is a promise the browser drops`);
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
    const listed = p.match(new RegExp(`${directive} ([^;]+)`))[1].trim().split(/\s+/);
    // HASHES AND HOSTS ARE SEPARATE CLAIMS, and splitting them is what keeps
    // this test as strong as it was. `script-src` gained one host source when
    // Kevin turned Cloudflare Web Analytics on -- the beacon is a third-party
    // script the edge injects and the policy has to name it or the browser
    // refuses it. Counting every token as a hash reported "2 hashes for 1
    // block", which is the test being right about a change it could not
    // describe.
    const pinned = listed.filter(t => t.startsWith("'sha256-"));
    assert.deepEqual(new Set(pinned), new Set(shipped),
      `${directive} pins ${pinned.length} hashes for ${shipped.length} shipped <${tag}> blocks`);
    // AND THE HOSTS ARE ENUMERATED, so a second origin cannot arrive unnoticed.
    // This is the half that makes admitting one third party safe: the policy is
    // still a closed list, it just has one more name on it than it did.
    const hosts = listed.filter(t => !t.startsWith("'"));
    assert.deepEqual(hosts, directive === 'script-src' ? ['https://static.cloudflareinsights.com'] : [],
      `${directive} admits ${JSON.stringify(hosts)} — every host source must be named in this test`);
  }
  // connect-src is not hash-pinnable, so it is enumerated outright.
  const conn = p.match(/connect-src ([^;]+)/)[1].trim().split(/\s+/);
  // The analytics beacon reports SAME-ORIGIN (POST /cdn-cgi/rum), watched in a
  // browser — so no vendor origin belongs here. Enumerated, not pattern-matched.
  assert.deepEqual(conn, ["'self'", 'https://data.readthegame.co'],
    `connect-src admits ${JSON.stringify(conn)}`);
});

/** Run the shell's script against fakes and record what it asks the network for. */
function run({ search = '', responses = {} } = {}) {
  const asked = [];
  const said = [];
  // RICH ENOUGH FOR boot() TO FINISH. It used to be two properties, which was
  // all the bootstrap's error paths needed -- but a test that supplies an
  // extract makes the bootstrap call the real renderer, and the renderer
  // touches style, classList and the rest. With the thin element it threw, the
  // chain's own .catch reported "could not be loaded", and any assertion about
  // what was NOT fetched would have passed because nothing got that far.
  // ⭐ ONE ELEMENT PER ID, because D9 is a claim about WHICH element is hidden.
  // This used to hand the same object to every getElementById, which is fine
  // while every assertion is about text -- and useless the moment two elements
  // must be told apart, since `#rg` and `#shellmsg` would be ONE object and
  // `assert.equal(rg.hidden, true)` would pass on the message being hidden.
  const els = {};
  const mk = () => ({
    set textContent(v) { said.push(String(v)); }, get textContent() { return ''; },
    // `hidden` IS DELIBERATELY ABSENT, not `false`. A fake that invents the
    // default makes `assert.equal(el.hidden, false)` pass against a page that
    // never wrote the element at all -- the assertion reads as coverage and
    // proves nothing. Left undefined, the same assertion requires a real write.
    // (homepage.test.js already worked this way and says so at its heroShown.)
    innerHTML: '', value: '', dataset: {}, childNodes: [{ nodeValue: '' }],
    style: { setProperty() {}, getPropertyValue() { return ''; } },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {},
  });
  const el = mk();
  // `body` is modelled for the same reason as the rest: preview hides the
  // shared chrome through a class on it.
  const document = {
    body: el,
    getElementById: id => (els[id] || (els[id] = mk())),
    querySelectorAll: () => [],
    // Lenient like the line above -- this fake watches the NETWORK, not the DOM.
    querySelector: () => null,
  };
  const fetch = url => {
    asked.push(url);
    const key = Object.keys(responses).find(k => url.includes(k));
    if (!key) return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({ ok: true, status: 200,
                             json: () => Promise.resolve(responses[key]) });
  };
  // `matchMedia` is part of the browser this bundle runs in -- the renderer asks
  // it about prefers-reduced-motion -- so the fake supplies it rather than the
  // app defending against its absence.
  // The timers are NO-OPS on purpose: with the real ones the preview loop
  // reschedules itself forever and the runner never exits, which is a hang
  // rather than a failure and therefore worse.
  /* `window` is injected because a framed preview posts its attempt totals to
     the parent. `posted` is kept so a test can assert the shell -- the page a
     visitor is actually served -- really sends them, rather than only the
     inlined build doing so. */
  const posted = [];
  new Function('document', 'fetch', 'location', 'matchMedia', 'setTimeout', 'clearTimeout',
               'window', scriptOf(shell))(
    document, fetch, { search, origin: 'https://x' }, () => ({ matches: false }),
    () => 0, () => {}, { parent: { postMessage: (m, o) => posted.push({ m, o }) } });
  return { asked, said, posted, els, settle: () => new Promise(r => setTimeout(r, 0)) };
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
  // ⚠️ THIS TEST WAS NAMED FOR THE HAPPY PATH AND RAN THE FAILURE PATH.
  // Its fixture was `responses: {}` — so the extract 404'd and the assertion
  // counted the requests of a page that never loaded a game. It read as
  // coverage of the permalink cost and measured an error. It only looked right
  // because the old failure path did nothing at all; the moment the failure
  // path grew a request, the test that "proved" the happy path went red for
  // the happy path's sake.
  const r = run({ search: '?game=2023020204',
                  responses: { 'extract/2023020204.json': EXTRACT,
                               'measures.json': {} } });
  return r.settle().then(() => {
    // THE CLAIM IS ABOUT THE CATALOG, so that is what is asserted. An exact
    // request list would also be asserting how many microtask ticks `settle`
    // happens to flush, which is a fact about the harness and not about the
    // page -- the anchor-on-an-implementation-line mistake `rendererOf` above
    // already documents.
    assert.match(r.asked[0], /extract\/2023020204\.json$/,
      'the extract must be the FIRST thing a permalink asks for');
    assert.ok(!r.asked.some(u => /catalog\.json/.test(u)),
      'a permalink cost a catalog round trip');
  });
});

test('and the FAILURE path spends one more request, deliberately', () => {
  // ⭐ THE ASYMMETRY IS THE POINT, so it is asserted rather than left to be
  // rediscovered as a regression. "HTTP 404" is a developer's sentence; the
  // catalog holds the fact — every refused game keeps its row and carries the
  // gate that stopped it — so the error path buys the truth for one request
  // that the working path never spends.
  const r = run({ search: '?game=2025090030',
                  responses: { 'catalog.json': CATALOG } });
  return r.settle().then(() => {
    assert.ok(r.asked.some(u => /catalog\.json/.test(u)),
      'the failure never asked the archive what was actually wrong');
    const said = r.said.join(' | ');
    assert.match(said, /in the archive and we could not publish it/i);
    assert.match(said, /validation/, 'and it names the gate, from the row');
    assert.doesNotMatch(said.split('|').pop(), /HTTP 404/,
      'the final sentence should be about hockey, not about a status code');
  });
});

test('an id the archive has never heard of says exactly that', () => {
  // A DIFFERENT FACT AND A DIFFERENT SENTENCE. "we refused this game" and "no
  // such game" are not the same thing to a reader, and collapsing them is the
  // conflation D8 was made of, one layer up.
  const r = run({ search: '?game=1999020001',
                  responses: { 'catalog.json': CATALOG } });
  return r.settle().then(() => {
    assert.match(r.said.join(' '), /has no game with the id 1999020001/i);
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

test('A GAME THAT CANNOT LOAD DOES NOT RENDER THE APP', () => {
  // ⭐ D9. `game.html?game=2025090030` — a refused Olympic game, and all 30 are
  // — fetched a 404 and then drew the whole application anyway: rink, transport,
  // five layer buttons, and a scoreboard reading MIN 0 / BUF 0.
  //
  // THE FAILURE WAS ALREADY STATED. It was stated in `#gl`, which is the LAST
  // element of the app, measured at y=1222 on a 390x844 phone — a screen and a
  // half below a page that looked like it was working. Two individually correct
  // decisions contradicting each other on screen, which is A10's shape exactly.
  const r = run({ search: '?game=2025090030', responses: {} });
  // ⭐ BEFORE THE FETCH SETTLES, AND THIS ASSERTION IS NOT DECORATION.
  // Two independent mechanisms hide the app -- the synchronous hide at start
  // and the re-hide in the catch -- and a single post-settle assertion is
  // satisfied by EITHER. Mutation proved it: deleting one left 660 tests green,
  // because the other was still standing. Each has to be observed where only it
  // can be responsible, or one of them can rot untouched.
  assert.equal(r.els.rg.hidden, true,
    'the app was on screen while the game was still being fetched');
  return r.settle().then(() => {
    assert.equal(r.els.rg.hidden, true,
      'the app rendered for a game the archive does not hold');
    assert.equal(r.els.shellmsg.hidden, false, 'and nothing explained why');
    assert.match(r.said.join(' '), /could not be loaded/i);
  });
});

test('A FAILED PAGE IS NOT A DEAD END', () => {
  // ⭐ THE REGRESSION MY OWN FIX INTRODUCED, and only a screenshot found it.
  //
  // Hiding `#rg` hides `#nextup` with it — and `#nextup` is the funnel that
  // exists SPECIFICALLY so the game page is not a dead end. So the first cut of
  // D9 put a true sentence at the top of a cul-de-sac: a visitor following a
  // shared link to a game the archive no longer publishes got one sentence and
  // a footer. Every assertion above passed. The geometry said y=1222 -> y=56.
  //
  // That is the whole case for looking, and this is the guard so that looking
  // does not have to happen twice.
  const r = run({ search: '?game=2025090030', responses: { 'catalog.json': CATALOG } });
  return r.settle().then(() => {
    const out = r.els.shellout.innerHTML;
    assert.ok(out.length > 0, 'a failed page offered the visitor nowhere to go');
    for (const href of ['/calendar.html', '/#teams', '"/"'])
      assert.ok(out.includes(href.replace(/"/g, '"')) || out.includes(href),
        `the way out does not reach ${href}`);
  });
});

test('a game that loads and then fails to DRAW is put away again', () => {
  // ⭐ THE OTHER HIDE, isolated. This is the only path where `reveal()` has
  // already run and the page then fails: the extract arrives, the app is shown,
  // and boot() throws on it. Without the catch's re-hide the visitor keeps a
  // half-drawn rink under an error message -- the same plausible-looking wreck
  // in a smaller costume.
  //
  // AND IT IS A REAL CASE, not a contrivance for the test: a truncated or
  // half-written extract is exactly what a partial upload produces, and the
  // pipeline writes extracts and the catalog in separate passes.
  const r = run({ search: '?game=2023020204',
                  responses: { 'extract/2023020204.json': {},
                               'measures.json': {} } });
  return r.settle().then(() => {
    assert.equal(r.els.rg.hidden, true,
      'a page that could not draw stayed on screen half-built');
    assert.match(r.said.join(' '), /could not be loaded/i);
  });
});

test('boot() CANNOT RUN INSIDE THE HIDDEN SUBTREE', () => {
  // ⭐ CHENG's audit finding, 2026-08-24. The ordering was held by a COMMENT:
  // swapping to `boot(g,rates); reveal();` passed all 673 tests, and none of the
  // 26 mutations touched it. A fake DOM has no layout, so no test can catch it
  // by measuring — which is precisely why it would survive a refactor.
  //
  // Same shape as the `SX` scope guard: the rule was right, the instrument was
  // missing, and the rule was the only thing holding it.
  //
  // ⚠️ THIS TEST IS STRUCTURAL, AND THAT IS A LIMITATION, NOT A PREFERENCE.
  // When the order is CORRECT the guard is invisible — identical behaviour with
  // it and without it — so no behavioural test can distinguish a page that
  // carries the guard from one that has had it deleted. Mutation confirms it:
  // removing the throw leaves every behavioural assertion green. The wrong
  // ORDER is caught behaviourally (see the swap, below); only the guard's
  // EXISTENCE has to be asserted by reading the source. Saying so here, because
  // a structural check that reads as a behavioural one is the thing this file
  // has now been burned by twice.
  const s = scriptOf(shell);
  const at = s.indexOf('function draw(');
  assert.notEqual(at, -1, 'the shell has no draw() — the ordering guard is gone');
  const body = s.slice(at, s.indexOf('}', s.indexOf('boot(g,rates);', at)) + 1);
  assert.match(body, /APP\s*&&\s*APP\.hidden/,
    'draw() does not check whether the app is still hidden');
  assert.match(body, /throw new Error/,
    'draw() notices and continues — a guard that does not stop is a comment');

  // AND NOTHING ROUTES AROUND IT. The bootstrap must reach the renderer only
  // through draw(); a direct `boot(` call site is the guard deleted by other
  // means, and it is the mutation that survived until this line existed.
  // ⚠️ COMMENTS STRIPPED FIRST, AND THIS IS THE THIRD TIME TODAY. The first
  // version matched `boot(` across the bootstrap's own prose — which mentions
  // it repeatedly, because the prose is what explains the rule — and reported
  // a bypass that does not exist. The D9 placeholder test passed on a comment;
  // the D10 guard had to exclude them; and then this. A check that cannot tell
  // code from the words about the code is not a check about code.
  const codeOnly = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const bootstrap = codeOnly(s.slice(s.indexOf('var ORIGIN=')));
  // Cut draw()'s own body out too — the call inside it is the legitimate one,
  // and the whole point is that it must be the ONLY one.
  const outside = bootstrap.replace(codeOnly(body), '');
  assert.ok(!/\bboot\(/.test(outside),
    'the bootstrap calls boot() directly somewhere, bypassing the order guard');
  assert.match(outside, /draw\(g,\s*null\)/, 'the preview path must go through draw()');
  assert.match(outside, /draw\(g,\s*rates\)/, 'and so must the ordinary path');
});

test('and `hidden` is actually wired to display, not left to the UA sheet', () => {
  // The fake DOM sets a PROPERTY; only CSS makes it a box or not. Without this
  // the whole fix is one deleted rule away from a page that is "hidden" and
  // fully visible, and every assertion above would still pass.
  // The real instrument is a browser, and the deploy gate is one -- this is the
  // cheap half that catches the deletion before it gets that far.
  assert.match(shell, /#rg\[hidden\][^{]*\{[^}]*display:\s*none/,
    'nothing in the stylesheet makes a hidden app take up no space');
});

test('and the explanation is NOT inside the thing it is explaining', () => {
  // The trap in the obvious fix. `#gl` is inside `#rg`, so "hide the app" would
  // hide the sentence with it and leave a blank page — which is the CORS bug's
  // exact signature, and the reason `say()` had to move out of the app first.
  const markup = shell.replace(/<script[\s\S]*?<\/script>/g, '');
  const msg = markup.indexOf('id="shellmsg"');
  const app = markup.indexOf('<div id="rg"');
  assert.ok(msg !== -1, 'the shell has no status element');
  assert.ok(msg < app, 'the status line must sit ABOVE and OUTSIDE the app');
  const s = scriptOf(shell);
  assert.doesNotMatch(s.slice(s.indexOf('function say(')),
    /^function say\(m[^)]*\)\{[^}]*'gl'/,
    'say() must not write the failure into the game line at the bottom again');
});

test('a game that DOES load reveals the app — the paired half', () => {
  // ⭐ WITHOUT THIS, "the app is hidden" is satisfied by a page that never shows
  // anything at all, which is a worse bug than the one being fixed and would
  // pass every assertion above. The two tests must be able to fail in opposite
  // directions. (The ends-switching pair is where this pattern came from.)
  const r = run({ search: '?game=2023020204',
                  responses: { 'extract/2023020204.json': EXTRACT,
                               'measures.json': {} } });
  return r.settle().then(() => {
    assert.equal(r.els.rg.hidden, false, 'a good game left the app hidden');
    assert.equal(r.els.shellmsg.hidden, true, 'and the loading line never cleared');
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

test('NO PLACEHOLDER IN THE MARKUP IS A REAL CLUB', () => {
  // ⭐ D9, AND THIS TEST USED TO ASSERT THE DEFECT.
  //
  // It read: "The placeholder in the HTML is fine — it is what a reader sees
  // for the few milliseconds before boot runs, and the deploy's browser gate
  // proves the script executes. What matters is that nothing SURVIVES it."
  //
  // THE PREMISE IS THE THING THAT WAS WRONG. `boot` runs when the fetch
  // succeeds. `game.html?game=2025090030` is a refused Olympic game: it 404s,
  // boot never runs, and "a few milliseconds" is forever. The page then showed
  // MIN 0 / BUF 0 — two real clubs — for a game that has nothing to do with
  // either, and the single-fixture blind spot appeared as a FALLBACK, which is
  // the sharpest version of it: the failure silently displays the one game
  // everything was built from.
  //
  // ⭐ AND ITS INSTRUMENT COULD NOT SEE THE THING IT NAMED. `assert.match(shell,
  // /MIN attempts/)` passed against a 300 KB file — and after the markup was
  // fixed it STILL passed, on a COMMENT in app.js that happens to quote the old
  // label. A check that cannot tell markup from prose is not an instrument for
  // markup. So this reads the body with every <script> and <style> removed.
  //
  // AND THE FORBIDDEN SET IS THE LEAGUE'S OWN TABLE, not the two clubs that
  // happened to be wrong. A future placeholder reading "TOR" is the identical
  // defect, and a rule written against the case that bit is how the deploy
  // exemption, the night list and the front door's competition list all shipped.
  const clubs = Object.keys(TEAMS);
  assert.ok(clubs.length > 30, 'the club table is the instrument; it must be real');
  for (const [name, html] of [['game.html', shell], ['read-the-game.html', inlined]]) {
    const markup = html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    const board = markup.slice(markup.indexOf('<div class="board"'),
                               markup.indexOf('id="nextup"'));
    assert.ok(board.length > 200, `${name}: the board markup was not found`);
    for (const ab of clubs) {
      assert.ok(!new RegExp(`\\b${ab}\\b`).test(board),
        `${name}: the static board names a real club (${ab}) before any game is loaded`);
    }
  }
  // And the script still writes the real ones in, or the fix is a blank page.
  const s = scriptOf(shell);
  assert.match(s, /\.cc\.a \.lb/, 'the script fills the away label from the data');
  assert.match(s, /\.cc\.h \.lb/);
  assert.match(s, /\$\('aAb'\)\.textContent=AAB/, 'and the scoreboard abbreviations');
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

/* --------------------------------------------------------------- preview
   Moved here from render.test.js, where it was a regex over the shell's own
   source: /preview=1[^}]*\{boot\(g,null\);return null;\}/. That check knew one
   SPELLING of the branch, so it went red the moment the page started reading
   preview through the shared parser -- and it had never observed a request in
   its life. This runs the bootstrap and watches the network. */

const EXTRACT = JSON.parse(
  readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));

test('preview asks for nothing it does not show', () => {
  // measures.json exists to feed the verdict card, and the card is hidden in
  // preview -- so fetching it would be a request on a homepage for bytes nobody
  // reads.
  const r = run({ search: '?game=2023020204&preview=1',
                  responses: { 'extract/': EXTRACT, 'measures.json': { games: [] } } });
  return r.settle().then(() => {
    assert.ok(r.asked.some(u => /extract\//.test(u)), 'the game itself must still be fetched');
    assert.deepEqual(r.asked.filter(u => /measures\.json/.test(u)), [],
      'preview fetched the archive-wide measurement it does not render');
    // PAIRED, so the assertion above cannot be satisfied by the bootstrap
    // falling over before it got that far -- which is exactly how this test
    // would pass while telling us nothing.
    assert.deepEqual(r.said.filter(s => /could not be loaded/.test(s)), []);
  });
});

test('⭐ the SHELL posts its attempt totals, because the home page reads them', () => {
  // THE PAGE A VISITOR IS SERVED. The hero's sentence is about shot attempts and
  // only this frame can compute them -- so if the shipped shell does not post,
  // the front door has a silent empty sentence and nothing else notices. The
  // inlined build passing is not evidence about this one; they are two files.
  const r = run({ search: '?game=2023020204&preview=1',
                  responses: { 'extract/': EXTRACT } });
  return r.settle().then(() => {
    assert.equal(r.posted.length, 1, 'the framed preview posted nothing');
    const { m, o } = r.posted[0];
    assert.equal(m.rtg, 'attempts');
    assert.equal(m.game, 2023020204);
    // THE REFERENCE GAME'S OWN TOTALS: MIN 80, BUF 55, pinned in memory and in
    // test/rink.test.js. A message carrying zeroes would satisfy a shape check.
    assert.deepEqual({ a: m.a, h: m.h }, { a: 80, h: 55 },
      'the totals are not this game — the reducer ran on the wrong thing');
    assert.equal(o, 'https://x', 'posted to a wildcard target rather than our own origin');
  });
});

test('and without preview it does ask, which is the half that proves the above', () => {
  const r = run({ search: '?game=2023020204',
                  responses: { 'extract/': EXTRACT, 'measures.json': { games: [] } } });
  return r.settle().then(() => {
    assert.ok(r.asked.some(u => /measures\.json/.test(u)),
      'the ordinary page needs the rates for its verdict card');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   U1 — both ways into the archive, from every page.
   ───────────────────────────────────────────────────────────────────────── */

test('BOTH WAYS INTO THE ARCHIVE ARE REACHABLE FROM EVERY PAGE', () => {
  // ⭐ THE CLAIM page.py ALREADY MAKES, asserted for the first time.
  //
  // Its `_NAV` comment: "'BY DATE' SITS BESIDE 'TEAMS' BECAUSE THEY ARE THE
  // SAME KIND OF THING: the two ways into the archive... The result was an
  // asymmetry nobody chose: a reader on a team page or a game page could reach
  // the team browse from any page on the site and the date browse from none."
  //
  // C1 fixed that by adding "By date" to `_NAV` — and the game page runs the
  // MINIMAL header by CHENG's ruling, so it does not use `_NAV` at all. The one
  // page the comment names as the victim is the one page the fix could not
  // reach, and nothing noticed because every header is individually valid.
  //
  // ⚠️ AND THE FIRST VERSION OF THIS TEST PASSED ON THE WRONG EVIDENCE.
  // It grepped the whole file for `href="/#teams"`, and game.html contains one
  // — inside D9's `waysOut()`, which renders ONLY WHEN THE PAGE HAS FAILED. A
  // guard satisfied by markup that appears when the page is broken is not a
  // guard about a working page. So this reads the two surfaces a reader on a
  // working page actually has: the chrome header, and the funnel under the rink.
  const headerOf = html => {
    const m = html.replace(/<script[\s\S]*?<\/script>/g, '').match(/<header[\s\S]*?<\/header>/);
    return m ? [...m[0].matchAll(/href="([^"]+)"/g)].map(x => x[1]) : [];
  };
  // TO THE END OF THE IIFE, not a fixed window. The first cut sliced 2000
  // characters from `function nextUp(` and silently stopped short the moment a
  // comment was added above the new link — an instrument whose reach is a
  // constant somebody chose, which is the shape `rendererOf` above already had
  // to have beaten out of it.
  const funnelOf = html => {
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) return [];                       // a page with no script has no funnel
    const at = m[1].indexOf('function nextUp(');
    if (at === -1) return [];
    const end = m[1].indexOf("].join('');})();", at);
    assert.notEqual(end, -1, 'nextUp() is never closed — this probe lost its subject');
    return [...m[1].slice(at, end).matchAll(/href="([^"]*)/g)].map(x => x[1]);
  };
  // The team browse is reached by its index OR by a club page, which carries
  // "← All teams" — the funnel's two club links are strictly MORE specific
  // than the index and were never the missing half.
  const WAYS_IN = [
    { what: 'the team browse', ok: hrefs => hrefs.some(h => /^\/#teams|\?team=/.test(h)) },
    { what: 'the date browse', ok: hrefs => hrefs.some(h => /calendar\.html/.test(h)) },
  ];
  const pages = readdirSync(SRC).filter(f => f.endsWith('.html'));
  assert.ok(pages.length >= 10, 'the page list is the subject; it must be real');
  for (const name of pages) {
    const html = readFileSync(new URL(name, SRC), 'utf8');
    const reach = [...headerOf(html), ...funnelOf(html)];
    assert.ok(reach.length > 0, `${name}: neither a header nav nor a funnel`);
    for (const way of WAYS_IN)
      assert.ok(way.ok(reach),
        `${name} cannot reach ${way.what} from a WORKING page — the archive has `
        + `two front doors and this one offers one`);
  }
});

test('and the date link says the words the reader already met', () => {
  // A third name for one destination is how a reader stops believing two links
  // go to the same place. The front door says "Or browse by date", the chrome
  // nav says "By date"; the funnel must not invent a fourth.
  const s = scriptOf(shell);
  const funnel = s.slice(s.indexOf('function nextUp('), s.indexOf('function nextUp(') + 1600);
  assert.match(funnel, /Browse by date/, 'the funnel does not reach the date index');
  assert.doesNotMatch(funnel, /Schedule|By day|Calendar view/i,
    'the funnel invented a new name for the date index');
});

/**
 * ⭐ THE DEPLOY GATE'S IDEA OF "BOOTED" MUST MATCH WHAT THE PAGE ACTUALLY DRAWS.
 *
 * On 2026-08-25 the game line stopped printing `· final MIN 2–3 BUF`, because a
 * replay that states its ending before you press play is a recap. Two steps in
 * `.github/workflows/deploy.yml` decided whether a page had booted by testing
 * `#gl` for the word **final** — so every page measured as never-booted, and the
 * deploy failed against a site that was working perfectly.
 *
 * The gate was not wrong to fail; it was keyed to a SENTENCE, and a sentence is
 * not a property of the thing it exists to watch. Both now read `#rg`'s hidden
 * state, which `reveal()` owns — except the live-watch step, which greps a
 * dumped DOM and can only see text.
 *
 * THIS IS THE MISSING LINK BETWEEN THEM: the pattern that step greps for, read
 * out of the YAML, against the game line this page really renders. Two files,
 * two languages, one string, and nothing else compares them.
 */
test('the deploy gate greps for a game line this page actually renders', () => {
  const yml = readFileSync(
    new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

  // The live-watch step's success arm, e.g.  *" at "*) fail=0; break ;;
  const arm = /\*"([^"]+)"\*\)\s*fail=0;\s*break/.exec(yml);
  assert.ok(arm, 'the live-watch step no longer has a success pattern — '
    + 'this check has lost its subject');
  const needle = arm[1];

  const a = boot();
  const line = String(a.$('gl').textContent || '');
  assert.ok(line.includes(needle),
    `deploy.yml waits for ${JSON.stringify(needle)} in #gl, but the page renders `
    + `${JSON.stringify(line)} — the gate would call a working page dead`);

  // AND THE PLACEHOLDER MUST NOT MATCH IT, or the gate passes on a page that
  // never ran. `#gl` ships as an em-dash, so "not empty" was never the signal.
  const raw = readFileSync(new URL('../src/game.html', import.meta.url), 'utf8');
  const ph = /id="gl"[^>]*>([^<]*)</.exec(raw);
  assert.ok(ph, 'no #gl in the built markup — this check has lost its subject');
  assert.ok(!ph[1].includes(needle),
    `the un-booted placeholder ${JSON.stringify(ph[1])} already contains the `
    + `pattern the gate waits for, so the gate cannot tell boot from no-boot`);
});

/**
 * The other detector is structural, and this pins the mechanism it depends on:
 * `#rg` must ship hidden, so that "visible" means "reveal() ran".
 */
test('the probe gate can tell a booted page from an un-booted one', () => {
  const yml = readFileSync(
    new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  // ⚠️ COMMENTS STRIPPED FIRST, and this check caught itself doing the thing it
  // exists to prevent: the fix in deploy.yml QUOTES the old broken line in its
  // own explanation, so a raw scan finds `/final/.test(gl` in prose and fails on
  // a file that is correct. A check that cannot tell code from the words about
  // the code is not a check about code — the fourth instance in this project.
  // Both comment syntaxes: `#` is YAML's, and the embedded browser script has
  // its own `/* */`. The quote that tripped this was in the JavaScript one.
  const code = yml.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*#.*$/gm, '');
  assert.match(code, /var booted = rg && !rg\.hidden/,
    'the verdict probe no longer keys on #rg — if it keys on copy again, the '
    + 'next wording change fails the deploy on a working site');
  assert.doesNotMatch(code, /\/final\/\.test\(gl/,
    'the probe is keyed to the game line stating the result again');
});
