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

test('the scoreboard on the index is derived from the feed, not typed', () => {
  // Re-derive rather than assert a remembered number. Shots on goal are
  // shot-on-goal plus goal, attributed to the shooter's team -- a goal is a
  // shot that went in, and counting it separately would understate both totals.
  const sog = {}, goals = {};
  for (const e of rich.events) {
    if (e.type !== 'shot-on-goal' && e.type !== 'goal') continue;
    const tid = shootingTeam(e, rich.roster);
    assert.ok(tid != null, `event has no attributable team: ${JSON.stringify(e)}`);
    sog[tid] = (sog[tid] || 0) + 1;
    if (e.type === 'goal') goals[tid] = (goals[tid] || 0) + 1;
  }
  const away = rich.teams.away, home = rich.teams.home;

  const board = html.match(/<div class="board">[\s\S]*?<\/div>\s*<\/div>/)[0];
  const nums = [...board.matchAll(/>(\d+) shots</g)].map(m => +m[1]);
  const score = board.match(/class="sc">(\d+)&ndash;(\d+)</);

  assert.deepEqual(nums, [sog[away.id], sog[home.id]],
    `page shows ${nums} shots; feed gives ${sog[away.id]}/${sog[home.id]}`);
  assert.equal(+score[1], goals[away.id], 'away goals');
  assert.equal(+score[2], goals[home.id], 'home goals');

  assert.ok(board.includes(`>${away.ab}<`), 'away abbreviation');
  assert.ok(board.includes(`>${home.ab}<`), 'home abbreviation');
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

test('the event total quoted in the copy matches the feed', () => {
  const m = html.match(/all (\d+) events/);
  assert.ok(m, 'the copy states an event total');
  assert.equal(+m[1], rich.events.length, 'and it is the real one');
});

test('the page loads nothing from the network', () => {
  // Doctrine: nothing fetches at render time. External anchors are fine -- a
  // link to the repo is not a subresource -- but a stylesheet, script, font or
  // image pulled from another host would make the page depend on someone else
  // staying up, and would leak a visit to them.
  assert.doesNotMatch(html, /<script/i, 'the index needs no script at all');
  assert.doesNotMatch(html, /\bsrc=/i, 'no subresources');
  assert.doesNotMatch(html, /@import/i, 'no imported stylesheets');
  assert.doesNotMatch(html, /<link[^>]+stylesheet/i, 'CSS is inline');
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
