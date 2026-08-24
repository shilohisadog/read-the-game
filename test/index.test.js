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
import { excludedCompetitions } from '../src/lib/competitions.js';

/** The one table, read from the file derive.py walks the whole archive against. */
const NAMES = JSON.parse(
  readFileSync(new URL('../data/competitions.json', import.meta.url))).names;

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
    // A LEADING SLASH IS STILL A PATH INTO src/. The nav gained root-relative
    // links when Workshop and "What you can see" became pages, and `new URL()`
    // resolves "/workshop.html" against the ORIGIN, not against SRC — so the
    // check looked in the wrong directory and reported a file that exists as
    // missing. Same shape as the chrome checker reading `mailto:` as a page.
    const rel = h.replace(/^\//, '');
    assert.ok(existsSync(new URL(rel, SRC)), `index links to src/${rel}, which does not exist`);
  }
});

test('the test can actually fail — a bogus link is caught', () => {
  // TEST THE TEST'S REACH. The check above passes trivially if the href regex
  // silently matches nothing, which is how a green suite has covered a blank
  // page before. Prove the mechanism fires.
  // `read-the-game.html` used to be the mutated link; the workshop list that
  // named it moved to its own page, so mutating it here changed nothing and the
  // canary would have reported the check was broken. The link has to be one the
  // page ACTUALLY carries — and the leading slash has to be stripped the same
  // way the check strips it, or every nav entry reads as missing.
  assert.ok(html.includes('href="game.html"'), 'the index no longer links to a game');
  const bogus = html.replace('href="game.html"', 'href="no-such-app.html"');
  const found = [...bogus.matchAll(/href="([^"]+)"/g)].map(m => m[1])
    .filter(h => !/^(https?:|mailto:|#)/.test(h))
    .map(h => h.replace(/^\//, ''))
    .filter(h => h.endsWith('.html'))
    .filter(h => !existsSync(new URL(h, SRC)));
  assert.deepEqual(found, ['no-such-app.html'], 'the broken-link check must detect it');
});

test('no page in src/ ships unlinked', () => {
  // An orphan page is published but unreachable, and nobody finds out. If a
  // page is deliberately unlisted, this test is where that decision gets made
  // explicitly rather than by omission.
  const pages = readdirSync(new URL(SRC)).filter(f => f.endsWith('.html') && f !== 'index.html');
  // LINKED FROM ANYWHERE THE READER CAN GET TO, not from the index alone. The
  // workshop list moved to its own page, so the prototypes are no longer named
  // on the front door — and they are not orphans, they are one click further.
  // Scanning only index.html would have called nine reachable pages unreachable.
  const linked = new Set();
  for (const f of readdirSync(new URL(SRC)).filter(f => f.endsWith('.html'))) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    for (const m of h.matchAll(/href="([^"#?]+)/g)) {
      const t = m[1].replace(/^\//, '');
      if (t.endsWith('.html')) linked.add(t);
    }
  }
  const orphans = pages.filter(p => !linked.has(p));
  assert.deepEqual(orphans, [], `unreachable page(s): ${orphans.join(', ')}`);
});

test('⭐ the limits block names EVERY competition the site excludes', () => {
  // THE DEFECT THIS EXISTS FOR SHIPPED AND STOOD FOR TWO AND A HALF YEARS. The
  // sentence read "Preseason, the Olympics and the 4 Nations Face-Off are in the
  // archive and are deliberately left out of every number here" — and the
  // archive has held four ALL-STAR games since February 2024, which it never
  // named. It is prose in a Python builder; nothing could compare it to
  // data/competitions.json except a person remembering to.
  //
  // THE ASSERTION IS AGAINST THE JS FUNCTION, NOT A LITERAL, and that is the
  // whole point: the page is generated by Python from the same table, so this
  // test is the SEAM between the two implementations. Pinning a string here
  // would test that today's answer is today's answer.
  const excluded = excludedCompetitions(NAMES);
  assert.ok(excluded.length >= 2, 'the table produced nothing to check against');
  const limits = html.match(/<ul class="limits">([\s\S]*?)<\/ul>/)[1];
  for (const name of excluded) {
    assert.ok(limits.includes(name),
      `the limits block never names "${name}", which the archive holds and no number counts`);
  }
  // And in the derived order, so the two sides agree on more than membership.
  const at = excluded.map(n => limits.indexOf(n));
  assert.deepEqual(at, [...at].sort((a, b) => a - b), 'the order disagrees with the table');
  // A league competition must NOT be listed as excluded — the other direction,
  // without which "name everything" would pass.
  for (const [type, name] of Object.entries(NAMES)) {
    if (Number(type) === 2 || Number(type) === 3) {
      assert.ok(!excluded.includes(name), `${name} is in scope and must not be excluded`);
    }
  }
});

test('the disclosure points at a surface that can actually show them', () => {
  // Until 2026-08-21 it promised those games were "in the archive" with nothing
  // anywhere that could display one. A limit a reader can go and inspect is a
  // different claim from one they must take on trust — and the link target is
  // already checked to exist by the link test above.
  const limits = html.match(/<ul class="limits">([\s\S]*?)<\/ul>/)[1];
  assert.match(limits, /href="calendar\.html"/);
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
  // THE WORKSHOP MOVED TO ITS OWN PAGE, so the exemption moves with it: this
  // reads the index, which no longer contains the blurbs, and the workshop page
  // is checked for the same property separately below. The rule is unchanged —
  // a team abbreviation outside the workshop is a bug.
  const workshopAt = html.length;
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
  // The analytics beacon reports SAME-ORIGIN (POST /cdn-cgi/rum), watched in a
  // browser — so no vendor origin belongs here. Enumerated, not pattern-matched.
  assert.deepEqual(conn, ["'self'", 'https://data.readthegame.co'],
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


/* ─────────────────────────────────────────────────────────────────────────
   D10 — the structural half. Behaviour tests cover the two surfaces that
   exist; this one covers the next one somebody writes.
   ───────────────────────────────────────────────────────────────────────── */

test('EVERY SURFACE THAT PRINTS THE LEAGUE SHOT COUNT CONSULTS THE FLAG', () => {
  // ⭐ THE GUARD D10 ACTUALLY NEEDED, and the reason the defect lasted months.
  //
  // `derive.py` wrote `u: 1` onto 73 catalog rows expressly so a LIST could mark
  // them, and then two list surfaces were built that print `ash`/`hsh` — the
  // league's BOXSCORE numbers — and neither one looked at `u`. Nothing could
  // notice: each renderer is individually correct, and the omission is only
  // visible by comparing a row against a page a click away.
  //
  // A behaviour test per surface fixes the two that exist and protects none of
  // the ones that do not. This asserts the RULE instead: if a line of the
  // builder renders the quoted shot count, the same expression must consult the
  // flag that says whether the league agrees with itself about it.
  //
  // Same shape as the deploy gate that had to stop exempting pages by filename
  // and start reading a property — a rule written against the cases that exist
  // is silently wrong when the next one arrives, and this project has now paid
  // for that four times.
  const src = readFileSync(new URL('../builders/build_index.py', import.meta.url), 'utf8');
  const lines = src.split('\n');
  const printers = lines
    .map((text, i) => ({ text, n: i + 1 }))
    // The rendering sites, not the prose: a comment mentioning `ash` is not a
    // surface. (The old placeholder test passed on a COMMENT; once is enough.)
    .filter(l => /\bg\.ash\b|\bg\.hsh\b/.test(l.text) && !/^\s*(#|\/\*|\*)/.test(l.text));
  assert.ok(printers.length >= 2,
    'the shot-count renderers were not found — this check has lost its subject');
  for (const l of printers) {
    // The flag is consulted on the same expression or within the two lines that
    // complete it; `assert` on the window rather than the line because the
    // renderers are wrapped.
    const window = lines.slice(l.n - 1, l.n + 2).join('\n');
    assert.match(window, /g\.u === 1|DISPUTED_MARK/,
      `build_index.py:${l.n} prints the league's shot count and never asks `
      + `whether the league agrees with itself about it (D10)`);
  }
});

test('and the wording is ONE wording, not one per surface', () => {
  // The rule the game page's standing sentence was built on: "amending each site
  // would leave the next one to be written unamended." Both lists must reach the
  // same function, or the two disclosures drift and only one gets fixed.
  const src = readFileSync(new URL('../builders/build_index.py', import.meta.url), 'utf8');
  const calls = (src.match(/disputedNote\(/g) || []).length;
  assert.equal(calls, 2, 'both list surfaces must call the shared note');
  assert.doesNotMatch(src, /event log and boxscore disagree/,
    'the sentence was re-typed into the builder instead of imported');
});

test('EVERY FIELD derive.py PUTS ON A CATALOG ROW HAS A READER', () => {
  // ⭐ CHENG's sweep, made standing rather than one-time (2026-08-24).
  //
  // D10 was a field written for a purpose it never served: `derive.py` put
  // `u: 1` on 73 rows expressly so a list could mark them, wrote a comment
  // saying so, and NO LIST READ IT. That is a new variant of the two-paths
  // class — one path did not exist at all — and it survived for months because
  // nothing anywhere compares the writer's output to the readers' input.
  //
  // His note: "u:1 is the second field found this way. Worth a one-time check
  // for others." A one-time grep finds today's; this finds the next one, on the
  // commit that introduces it, which is the difference between a sweep and a
  // gate. The whole catalog swept clean when this was written — `u` was the
  // only orphan — so it starts green and stays green only while it stays true.
  //
  // THE WRITER IS THE SOURCE OF THE FIELD LIST, not a fixture and not the live
  // catalog. A fixture is a copy that can disagree, and the live archive is a
  // network call; `derive.py` is the one thing that decides what a row carries.
  const derive = readFileSync(new URL('../builders/derive.py', import.meta.url), 'utf8');
  const rowSrc = derive.slice(derive.indexOf('row = {"id"'),
                              derive.indexOf('def _write_ledger'));
  const boxSrc = derive.slice(derive.indexOf('return {"a": b['), derive.indexOf('except (ValueError'));
  const fields = new Set([...(rowSrc + boxSrc).matchAll(/"([a-z]{1,3})":/g)].map(m => m[1]));
  // A tripwire on the extractor itself: if the source moves and the slice comes
  // back thin, this check would pass by finding nothing — the failure mode the
  // `mixnight` fixture and the blind CSP probe both had.
  assert.ok(fields.size >= 10,
    `only ${fields.size} row fields found — this check has lost its subject`);
  for (const must of ['id', 'd', 't', 'v', 'u', 'r', 'a', 'h'])
    assert.ok(fields.has(must), `the field scan missed \`${must}\``);

  const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const readers = readdirSync(new URL('../src/', import.meta.url))
    .filter(f => f.endsWith('.html'))
    .map(f => strip(readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')))
    .concat(readdirSync(new URL('../src/lib/', import.meta.url))
      .filter(f => f.endsWith('.js'))
      .map(f => strip(readFileSync(new URL(`../src/lib/${f}`, import.meta.url), 'utf8'))));

  for (const f of fields) {
    // The forms a row field is actually read by in this codebase: `g.u`, `r.v`,
    // `row.t`, `x.d`, or a bracket lookup.
    const pat = new RegExp(`\\b[a-z]\\w*\\.${f}\\b|\\['${f}'\\]|\\["${f}"\\]`);
    assert.ok(readers.some(src => pat.test(src)),
      `derive.py writes \`${f}\` onto every catalog row and NOTHING in src/ `
      + `reads it — a field written for a purpose it never served (D10)`);
  }
});
