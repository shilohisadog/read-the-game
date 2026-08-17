/**
 * The site index — the page Cloudflare Pages answers `/` with.
 *
 * Two classes of failure are possible here and neither shows up locally. A link
 * to a file that does not exist is a 404 only once the folder is served without
 * a directory listing, which `python3 -m http.server` was hiding all through
 * development. And a number typed into the landing copy is a claim about the
 * game that nothing was checking -- exactly the shape of the blocked-shot flip,
 * where a wrong figure propagated through four artifacts because every copy of
 * it agreed with every other copy.
 *
 * So these tests do not compare the page against a fixture of itself. They
 * re-derive every number on it from data/rich.json, and they resolve every link
 * against the filesystem.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { shootingTeam } from '../src/lib/attribution.js';

const SRC = new URL('../src/', import.meta.url);
const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const html = readFileSync(new URL('index.html', SRC), 'utf8');

/** Every href on the page, in document order. */
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const local = hrefs.filter(h => !/^(https?:|mailto:|#)/.test(h));

test('the site root is answered by a file, not a 404', () => {
  // Pages serves a folder verbatim. No index.html means `/` is a 404 and only
  // the deep links work -- which is precisely what would have shipped.
  assert.ok(existsSync(new URL('index.html', SRC)), 'src/index.html must exist');
});

test('every link on the index resolves to a file that exists', () => {
  assert.ok(local.length >= 6, `${local.length} local links found`);
  for (const h of local) {
    assert.ok(existsSync(new URL(h, SRC)), `index links to src/${h}, which does not exist`);
  }
});

test('the test can actually fail — a bogus link is caught', () => {
  // TEST THE TEST'S REACH. The check above passes trivially if the href regex
  // silently matches nothing, which is how a green suite has covered a blank
  // page before. Prove the mechanism fires.
  const bogus = html.replace('read-the-game.html', 'no-such-app.html');
  const found = [...bogus.matchAll(/href="([^"]+)"/g)].map(m => m[1])
    .filter(h => !/^(https?:|mailto:|#)/.test(h))
    .filter(h => !existsSync(new URL(h, SRC)));
  assert.deepEqual(found, ['no-such-app.html'], 'the broken-link check must detect it');
});

test('no page in src/ ships unlinked', () => {
  // An orphan page is published but unreachable, and nobody finds out. If a
  // page is deliberately unlisted, this test is where that decision gets made
  // explicitly rather than by omission.
  const pages = readdirSync(new URL(SRC)).filter(f => f.endsWith('.html') && f !== 'index.html');
  const linked = new Set(local);
  const orphans = pages.filter(p => !linked.has(p));
  assert.deepEqual(orphans, [], `unreachable page(s): ${orphans.join(', ')}`);
});

test('outside the workshop, the page names no game and no team', () => {
  // THE DEFECT THIS PAGE SHIPPED. It compiled MIN at BUF into the markup — the
  // score, the shot counts, the date, and "all 320 events in the game". Every one
  // was a claim that went stale the moment the archive held a second game, and
  // two earlier tests here re-derived those numbers to keep them honest. The
  // right fix was not better checking. It was to stop typing them.
  //
  // The workshop is exempt and that exemption is the point: those blurbs describe
  // frozen prototypes that genuinely are pinned to one game, so naming it there is
  // true. Everywhere else, a team abbreviation is a bug.
  // Two exemptions, both narrow and both named. The workshop blurbs describe
  // frozen prototypes that genuinely ARE pinned to one game. The inlined team
  // table is reference data listing all 33 clubs — it is not a claim about a
  // game, and cutting the whole script instead would stop this test noticing a
  // team hard-coded as a default, which is the failure mode it exists for.
  // The heading gained an id when Workshop moved behind the chrome nav, and this
  // marker is the section's identity rather than its exact markup — a literal
  // that describes one spelling of the thing is the defect this batch is full of.
  const workshopAt = html.search(/<h2[^>]*>Workshop<\/h2>/);
  assert.ok(workshopAt > -1, 'the workshop section must still exist');
  const cut = (s, from, to) => {
    const i = s.indexOf(from);
    if (i === -1) return s;
    return s.slice(0, i) + s.slice(s.indexOf(to, i) + to.length);
  };
  let page = html.slice(0, workshopAt) + html.slice(html.indexOf('</div>', workshopAt));
  page = cut(page, 'const TEAMS = {', '};');
  page = cut(page, 'const NOTES = {', '};');
  assert.ok(page.includes('drawTeam'), 'the script is still in scope after the cuts');
  // Comments may legitimately quote a date — the inlined date formatter documents
  // itself with "2023-11-10 -> 10 November 2023". Prose about code is not a claim
  // the page makes to a reader.
  page = page.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->/g, '');

  assert.doesNotMatch(page, /\b(MIN|BUF)\b(?![A-Z])/, 'a team abbreviation is typed in');
  assert.doesNotMatch(page, /10 November 2023|Nov 10 2023/, 'a date is typed in');
  assert.doesNotMatch(page, /all \d+ events/, 'a per-game event total is typed in');
  assert.doesNotMatch(page, /\d+ shots</, 'a shot count is typed in');
});

test('the teaching hook survives: more shots, fewer goals', () => {
  // The whole premise of the site is on this page. If a future game replaces
  // the reference data and this stops being true, the copy is now wrong and
  // this test is the thing that says so.
  const sog = {}, goals = {};
  for (const e of rich.events) {
    if (e.type !== 'shot-on-goal' && e.type !== 'goal') continue;
    const tid = shootingTeam(e, rich.roster);
    sog[tid] = (sog[tid] || 0) + 1;
    if (e.type === 'goal') goals[tid] = (goals[tid] || 0) + 1;
  }
  const a = rich.teams.away.id, h = rich.teams.home.id;
  assert.ok(sog[a] > sog[h], 'the away team took more shots');
  assert.ok(goals[a] < goals[h], 'and scored fewer goals');
});

test('the no-network claim is enforced by the browser, not asserted by us', () => {
  // This page fetches its own freshness from R2, so the old grep for `fetch(`
  // could no longer express the rule. It was the wrong shape anyway: a
  // blacklist over an open vocabulary, blind to import(), EventSource,
  // sendBeacon, new Image().src and window["fetch"] -- the same failure class
  // as the ESM guard that could only fail on inputs the builder had handled.
  //
  // `default-src 'none'` permits nothing by default and names exactly one
  // network destination, so a page trying to reach anywhere else is stopped by
  // the browser rather than by our confidence.
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'the page must carry a CSP');
  const p = csp[1];
  assert.match(p, /default-src 'none'/);
  assert.match(p, /connect-src 'self' https:\/\/data\.readthegame\.co/);
  assert.match(p, /base-uri 'none'/);
  assert.match(p, /form-action 'none'/);
  assert.doesNotMatch(p, /unsafe-inline|unsafe-eval|\*/,
    'nothing is allowed by being inline; everything is pinned');
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
  const p = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const [tag, directive] of [['script', 'script-src'], ['style', 'style-src']]) {
    const shipped = [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))]
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
  assert.deepEqual(conn, ["'self'", 'https://data.readthegame.co', 'https://cloudflareinsights.com'],
    `connect-src admits ${JSON.stringify(conn)}`);
});

test('the page never ships a baked-in freshness claim', () => {
  // Pages serves code, R2 serves data. A state compiled into the deployed page
  // would be a lie by the next morning, and the ingest deliberately does not
  // trigger a deploy -- so the placeholder must not assert anything.
  const el = html.match(/<p class="state"[^>]*>([^<]*)</)[1];
  assert.doesNotMatch(el, /\d{4}|through|checked \d/i,
    `the static placeholder must claim nothing: "${el}"`);
});

test('no league logos or marks are referenced', () => {
  // The constraint that becomes live the moment this is public: team colours
  // and three-letter abbreviations only.
  //
  // The first version of this test matched the bare word "logo" and failed on
  // the disclaimer that says no logos appear -- a check aimed at prose rather
  // than at the thing prose describes. What actually matters is whether an
  // asset is REFERENCED, so match URLs and file extensions, not vocabulary.
  assert.doesNotMatch(html, /\.(svg|png|jpe?g|webp|gif)\b/i, 'no image assets');
  assert.doesNotMatch(html, /\b(?:nhl|nhle)\.com/i, 'nothing served from league domains');
  assert.doesNotMatch(html, /data:image/i, 'no embedded image data either');
  assert.match(html, /Not affiliated with/i, 'and the disclaimer is present');
});

test('the prose does not characterise an effect size the page already prints', () => {
  // IT SAID "loses SLIGHTLY more often than it wins". The publication rule was
  // applied carefully to the digits — no sampled figure ships — and then walked
  // around by an adverb, which is the same assertion with the error bars removed
  // and no way for a reader to check it. CHENG caught it on the live page.
  //
  // The exact rate, its numerator, its denominator and its population render
  // three lines below that sentence. The number says how much; the sentence only
  // has to say which way.
  //
  // This test exists because the first fix SILENTLY DID NOTHING — the phrase was
  // split across two Python string literals, so a replace on the whole sentence
  // matched nothing, the build succeeded and every test still passed.
  const thesis = html.match(/<p class="lede" id="thesis">([\s\S]*?)<\/p>/)[1];
  assert.ok(thesis.length > 100, 'the thesis copy must still be there');
  assert.doesNotMatch(thesis, /\b(slightly|barely|marginally|hugely|dramatically|vastly)\b/i,
    'prose is asserting a magnitude that the measured figure beside it should carry');
});
