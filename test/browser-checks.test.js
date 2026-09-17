/**
 * THE BROWSER CHECKS' JUDGEMENT, TESTED WITHOUT A BROWSER.
 *
 * The checks that gate a release used to be bash and in-page JavaScript inside
 * `deploy.yml`: the only way to exercise one was to push, and the only way to see
 * it fail was to ship a defect. Moved into `tools/browser/`, the part that DECIDES
 * — is this state a failure, does this page have a subject, did the canary
 * overflow — is a function, and these are the cases that have actually happened.
 *
 * ⚠️ What a test here cannot do is prove the probe reads the right thing out of a
 * real page; that is what running it against a deployed site does, and the release
 * gate does it on every push.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, stateOf } from '../tools/browser/data-readable.mjs';
import { CHECKS } from '../tools/browser/run.mjs';

test('the freshness line is read out of the rendered page', () => {
  assert.equal(stateOf('<p id="state" class="x">Data through 14 June 2026.</p>'), 'Data through 14 June 2026.');
  assert.equal(stateOf('<p id="other">Data through</p>'), '', 'a different element must not answer for #state');
  assert.equal(stateOf('<html><body></body></html>'), '');
});

test('⭐ the CORS failure is a FAILURE, and an empty page is not a pass', () => {
  // The sentence the live site showed the day the data could not be read. A check
  // that only asked "did the page render" was green through it.
  assert.equal(judge('No data loaded yet').ok, false);
  assert.equal(judge('').ok, false, 'a page that rendered nothing is not a page that works');
  assert.equal(judge('Data through 14 June 2026. No games in the last 14 days.').ok, true);
});

test('every check named in deploy.yml exists, and every check here is used by it', () => {
  // ⛔ THE DRIFT THIS PREVENTS: a check renamed in the tool and left behind in the
  // workflow is a gate that stops running while the log still lists a step.
  const yml = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const named = [...yml.matchAll(/tools\/browser\/run\.mjs ([a-z-]+)/g)].map(m => m[1]);
  assert.ok(named.length > 0, 'deploy.yml runs no browser check through the runner — the move is not wired up');
  for (const n of named) assert.ok(CHECKS[n], `deploy.yml runs "${n}", which tools/browser/run.mjs does not have`);
  for (const n of Object.keys(CHECKS)) assert.ok(named.includes(n), `${n} exists but no deploy step runs it`);
});

/* ------------------------------------------------------- the pages fit a phone */
import { judgeFit, readFit, WIDTH } from '../tools/browser/phone-fit.mjs';

test('a page is only judged at the width the check CLAIMS', () => {
  // The defect this check was born with: it announced 360px and graded 500px,
  // because headless Chrome enforces a minimum window width.
  const at500 = { frame: 500, client: 485, scroll: 485, subject: 140 };
  assert.equal(judgeFit({ name: 'game.html', kind: 'real' }, at500).ok, false);
  assert.match(judgeFit({ name: 'game.html', kind: 'real' }, at500).why, /framed at 500px, not the 360px/);
});

test('⭐ a page with nothing on it does not FIT — it measures nothing', () => {
  // The 25px scoreboard overflow shipped while this gate framed an error page:
  // #rg hidden, height 0, no overflow, green.
  const blank = { frame: WIDTH, client: 345, scroll: 345, subject: 0 };
  assert.equal(judgeFit({ name: 'game.html', kind: 'real' }, blank).ok, false);
  assert.match(judgeFit({ name: 'game.html', kind: 'real' }, blank).why, /NO SUBJECT/);
  // And the same numbers are exactly what the no-subject canary must report.
  assert.equal(judgeFit({ name: 'gamenosubj.html', kind: 'nosubject' }, blank).ok, true);
  assert.equal(judgeFit({ name: 'gamenosubj.html', kind: 'nosubject' }, { ...blank, subject: 140 }).ok, false);
});

test('the overflow canary must overflow, and a real page must not', () => {
  const wide = { frame: WIDTH, client: 345, scroll: 900, subject: 0 };
  assert.equal(judgeFit({ name: 'canary.html', kind: 'overflow' }, wide).ok, true);
  assert.equal(judgeFit({ name: 'canary.html', kind: 'overflow' }, { ...wide, scroll: 345 }).ok, false);
  assert.equal(judgeFit({ name: 'game.html', kind: 'real' }, { ...wide, subject: 140 }).ok, false, 'a page needing 900px in 345px scrolls sideways');
  assert.equal(judgeFit({ name: 'game.html', kind: 'real' }, { frame: WIDTH, client: 345, scroll: 346, subject: 140 }).ok, true, 'one pixel is the rounding slack, not an overflow');
});

test('the four numbers are read back from the probe, and a silent probe is not a pass', () => {
  assert.deepEqual(readFit('<title>FIT 360 345 345 140</title>'), { frame: 360, client: 345, scroll: 345, subject: 140 });
  assert.equal(readFit('<title>pending</title>'), null);
  assert.equal(judgeFit({ name: 'index.html', kind: 'real' }, null).ok, false);
});

/* -------------------------------------------- the front door's preview fits */
import { judgePreview, readPreview } from '../tools/browser/preview-fits.mjs';

test('the preview is judged only once it has BOOTED', () => {
  const box = { w: 287, h: 184, kind: 'real' };
  const notBooted = { mode: 'newcomer+something', frameW: 287, frameH: 184, scrollW: 287, scrollH: 184, board: 0 };
  assert.equal(judgePreview(box, notBooted).ok, false);
  assert.match(judgePreview(box, notBooted).why, /never booted/);
  assert.equal(judgePreview(box, null).ok, false);
});

test('⭐ the scoreboard may not eat a third of the taste, at either size', () => {
  const phone = { w: 287, h: 184, kind: 'real' };
  // The defect: 87px of a 155px frame on a phone, 87px of 462px on a laptop.
  assert.equal(judgePreview(phone, { mode: 'preview', frameW: 287, frameH: 155, scrollW: 287, scrollH: 155, board: 87 }).ok, false);
  assert.equal(judgePreview({ w: 856, h: 462, kind: 'real' }, { mode: 'preview', frameW: 856, frameH: 462, scrollW: 856, scrollH: 462, board: 87 }).ok, true);
});

test('a cropped or sideways preview fails, and the canary must be rejected', () => {
  const box = { w: 287, h: 184, kind: 'real' };
  const fits = { mode: 'preview', frameW: 287, frameH: 184, scrollW: 287, scrollH: 184, board: 40 };
  assert.equal(judgePreview(box, fits).ok, true);
  assert.match(judgePreview(box, { ...fits, scrollH: 300 }).why, /taller than its frame/);
  assert.match(judgePreview(box, { ...fits, scrollW: 400 }).why, /scrolls sideways/);
  const canary = { w: 287, h: 60, kind: 'canary' };
  assert.equal(judgePreview(canary, { mode: 'preview', frameW: 287, frameH: 60, scrollW: 287, scrollH: 60, board: 40 }).ok, true, 'a 40px board in a 60px frame must be rejected, which passes the canary');
  assert.equal(judgePreview(canary, { mode: 'preview', frameW: 287, frameH: 60, scrollW: 287, scrollH: 60, board: 5 }).ok, false, 'a canary nothing objects to means the gate cannot fail');
  assert.deepEqual(readPreview('<title>PREV preview 287 184 287 184 40</title>'),
    { mode: 'preview', frameW: 287, frameH: 184, scrollW: 287, scrollH: 184, board: 40 });
});

/* ----------------------------------------------------------- the verdict dot */
import { judgeVerdict, judgeCanary, readVerdict, MIN_TRACK } from '../tools/browser/verdict-dot.mjs';

test('⭐ the dot must land where the sentence says, and a collapsed track is the defect', () => {
  // "it lost 243 of 708" is 34.3% of the track.
  const good = { booted: 1, hasTrack: 1, width: 541, pct: 34.3, count: 243, n: 708 };
  assert.equal(judgeVerdict(good).ok, true);
  assert.equal(judgeVerdict({ ...good, pct: 0 }).ok, false, 'the dot pinned to the left of the track is the live defect');
  assert.equal(judgeVerdict({ ...good, width: MIN_TRACK - 1 }).ok, false, 'an inline span has no width');
  assert.equal(judgeVerdict({ ...good, pct: 35.5 }).ok, true, 'a tolerance exists, because the dot has a radius');
});

test('no rate is not a failure, but nothing booting is', () => {
  assert.equal(judgeVerdict({ booted: 1, hasTrack: 0, width: 0, pct: 0, count: 0, n: 0 }).ok, null);
  assert.equal(judgeVerdict({ booted: 0, hasTrack: 0, width: 0, pct: 0, count: 0, n: 0 }).ok, false);
  assert.equal(judgeVerdict(null).ok, false);
});

test('the canary is the defect itself: an inline track must measure small, and must have booted', () => {
  assert.equal(judgeCanary({ booted: 1, hasTrack: 1, width: 12, pct: 0, count: 1, n: 2 }).ok, true);
  assert.equal(judgeCanary({ booted: 1, hasTrack: 1, width: 541, pct: 34, count: 1, n: 2 }).ok, false);
  assert.equal(judgeCanary({ booted: 0, hasTrack: 0, width: 0, pct: 0, count: 0, n: 0 }).ok, false);
  assert.equal(readVerdict('<title>VERD 1 1 541 34.3 243 708</title>').width, 541);
});

/* ------------------------------------------------- a visitor can watch a game */
import { expectation, gameLineOf, judgeLine } from '../tools/browser/watch-a-game.mjs';

test('what the page should say is DERIVED from the catalog it reads', () => {
  const cat = { games: [
    { id: 1, d: '2026-06-09', a: 'CAR', h: 'VGK', v: 1 },
    { id: 2, d: '2026-06-14', a: 'MTL', h: 'TOR', v: 1 },
    { id: 3, d: '2026-06-20', a: 'BUF', h: 'OTT', v: 0 },   // refused: never the answer
  ] };
  assert.deepEqual(expectation(cat), { id: 2, teams: 'MTL at TOR', date: '14 June 2026' });
  assert.throws(() => expectation({ games: [] }), /no viewable game/);
});

test('⭐ both halves are checked — the clubs AND the date', () => {
  const want = { teams: 'MTL at TOR', date: '14 June 2026' };
  assert.equal(judgeLine('MTL at TOR · 14 June 2026', want).ok, true);
  assert.equal(judgeLine('MTL at TOR · 13 June 2026', want).ok, false, 'a wrong date passed while only "something rendered" was checked');
  assert.equal(judgeLine('BUF at OTT · 14 June 2026', want).ok, false);
  assert.equal(judgeLine('This game could not be loaded — HTTP 404', want).ok, false);
  assert.equal(judgeLine('—', want).ok, false, 'the placeholder is not a game');
  assert.equal(judgeLine('', want).ok, false);
  assert.equal(gameLineOf('<p id="gl" class="x">MTL at TOR · 14 June 2026</p>'), 'MTL at TOR · 14 June 2026');
});

/* ------------------------------------------------------- the policy's verdict */
import { refusals, VIOLATION } from '../tools/browser/csp-refusal.mjs';

test('a refusal is the clause both Chrome wordings share, and a warning is not one', () => {
  const today = `[0917/151907:INFO:CONSOLE(1)] "Applying inline style violates the following Content Security Policy directive: style-src 'sha256-x'"`;
  const older = `[INFO:CONSOLE(1)] "Refused to apply inline style because it violates the following Content Security Policy directive"`;
  const warning = `[INFO:CONSOLE(1)] "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element"`;
  assert.equal(refusals(today).length, 1);
  assert.equal(refusals(older).length, 1, 'the older wording must still count — this is a check ON the browser');
  assert.equal(refusals(warning).length, 0, 'an informational message is not a denial');
  assert.equal(refusals(`${today}\n[INFO:CONSOLE(1)] "favicon.ico violates the following Content Security Policy"`).length, 1,
    'the browser-initiated favicon request is the one exception');
  assert.ok(VIOLATION.length > 10);
});

/* ------------------------------------------- the pages run under their policy */
import { breakHash } from '../tools/browser/pages-csp.mjs';
import { judgeRan } from '../tools/browser/index-runs.mjs';

test('the CSP canary breaks a hash the way a hand-edited page does', () => {
  const page = '<html><head><meta http-equiv="Content-Security-Policy" content="script-src \'sha256-x\'"></head><body><script>boot()</script></body></html>';
  const broken = breakHash(page);
  assert.notEqual(broken, page, 'a canary that changes nothing proves nothing');
  assert.match(broken, /<script>\/\*canary\*\//);
  assert.ok(broken.includes('boot()'), 'the page must still do what it did — only its bytes change');
});

test('the front door script must REPLACE the placeholder, not merely leave one', () => {
  assert.equal(judgeRan('Checking how current this data is…', 'No data loaded yet.').ok, true,
    'over file:// the fetch fails for its own reasons — that the script RAN is the claim here');
  assert.equal(judgeRan('Checking how current this data is…', 'Checking how current this data is…').ok, false);
  assert.equal(judgeRan('', '').ok, false, 'no placeholder at all means this check has lost its subject');
});

/* ------------------------------------------ what only a stylesheet can settle */
import { judgeIce, readIce, PILL_CEILING } from '../tools/browser/stylesheet-settles.mjs';

const ICE = { shut: 59, open: 79, rings: 1, text: 409, clipped: 0, heights: 1, clear: 0,
              heroPill390: -14, heroPill900: -6, moved: 1,
              visitor: 'rgb(255,255,255)|rgb(21,71,52)', host: 'rgb(0,48,135)|none' };
const broke = over => judgeIce({ ...ICE, ...over }).filter(v => !v.ok).map(v => v.why);

test('a page the stylesheet lays out correctly raises nothing', () => {
  assert.deepEqual(broke({}), []);
  assert.equal(judgeIce(null).length, 1, 'a silent probe is one failure, not a pass');
});

test('⭐ the caption pair: height alone and change alone are each satisfied by the defect', () => {
  assert.match(broke({ open: 0 })[0], /the CSS is hiding it/);
  assert.match(broke({ moved: 0 })[0], /never changed/);
  assert.match(broke({ text: 10 })[0], /explains nothing/);
  assert.match(broke({ shut: 0 })[0], /base view has no caption/);
});

test('the layer box must not clip, must be ONE height, and must not be overlapped', () => {
  assert.match(broke({ clipped: 3 })[0], /CLIPPED/);
  assert.match(broke({ heights: 4 })[0], /different heights/);
  assert.match(broke({ clear: -4 })[0], /overlaps the layer box by 4px/);
});

test('⭐ the hero pill is judged at BOTH widths — one of them would have described the wrong bug', () => {
  // Measured before the fix: 96% up the rink at 390 and 34% at 900.
  assert.equal(broke({ heroPill390: 96, heroPill900: 34 }).length, 2);
  assert.equal(broke({ heroPill390: 96 }).length, 1, 'the phone width alone must still fail');
  assert.equal(broke({ heroPill900: 34 }).length, 1, 'and so must the laptop width alone');
  assert.equal(broke({ heroPill390: PILL_CEILING }).length, 0, 'the ceiling itself is allowed');
});

test('the sweater convention is a PAIR: white visitor, and not both clubs alike', () => {
  assert.match(broke({ visitor: 'rgb(0,48,135)|none' })[0], /not white/);
  assert.match(broke({ visitor: 'absent' })[0], /no visitor mark was drawn/);
  const same = broke({ host: ICE.visitor });
  assert.equal(same.length, 1);
  assert.match(same[0], /painted identically/);
  assert.equal(readIce('<title>ICE 59 79 1 409 BOX 0 1 0 HERO -14 -6 MOVED 1 VIS a|b HOST c|d</title>').rings, 1);
});
