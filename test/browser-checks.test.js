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
import { HIT_FLOOR, judgeStates, readState } from '../tools/browser/states.mjs';

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
import { judgeVerdict, judgeCanary, readVerdict, lostFrom, wantPct, MIN_TRACK } from '../tools/browser/verdict-dot.mjs';
import { sentenceFor } from '../src/lib/sentence.js';

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

/**
 * ⛔⛔⛔ THE PROBE READS THE VERDICT SENTENCE, AND NOTHING RAN ITS READER IN GATES.
 *
 * The pattern lived as a literal inside the injected page script — a template
 * literal, executed only in a browser, only in deploy. On 2026-09-30 the card
 * started printing its figures with thousands separators; `(\d+)` matched the
 * tail of `1,608 of 1,234` as `608 of 1`, the probe computed 60800% of the
 * track, and the deploy failed on a page that was working. The suite was green.
 *
 * ⚠️ AND THE TEST WRITTEN FOR THIS CHECKED THE OTHER HALF. `shell.test.js` asserts
 * the probe does not key on the game line's copy, and says so in its message:
 * *"if it keys on copy again, the next wording change fails the deploy on a
 * working site."* It did key on copy, twelve lines further down the same
 * function. A check whose claim is narrower than its message.
 *
 * ⭐⭐ NOT CIRCULAR: the left-hand side is `sentence.js` composing a real verdict,
 * the right-hand side is the probe's own pattern. Neither is derived from the
 * other, so a wording change on either side moves one of them and not both.
 *
 * MUTATION: drop the comma class from `LOST_RE` and the separated form returns
 * `608 of 1` — the exact figures that failed the deploy.
 */
test('⛔⛔ the probe can read the sentence the page actually writes', () => {
  const HOME = 10, AWAY = 20;
  const said = sentenceFor({
    homeAb: 'BUF', awayAb: 'MIN', homeId: HOME, awayId: AWAY, gameId: 2023020204,
    attempts: { [HOME]: 55, [AWAY]: 47 }, levelCounts: { [HOME]: 30, [AWAY]: 18 },
    diff: 12, score: { h: 2, a: 3 },
    /* FOUR DIGITS EITHER SIDE, because the separator only appears past a
       thousand and a three-figure fixture would pass with the old pattern. The
       archive's own curve rows are this size. */
    curve: [{ k: 12, n: 3386, count: 1334 }],
  });
  assert.ok(said.rate, 'the fixture produced no rate sentence, so this test has no subject');

  const got = lostFrom(said.rate);
  assert.deepEqual(got, { count: 1334, n: 3386 },
    `the deploy probe cannot read the sentence the card writes: ${JSON.stringify(said.rate)}`);

  /* ⭐ AND THE PLACE IT PUTS THE DOT, because reading two numbers is only half of
     it — a reader that swapped them would still parse. */
  assert.equal(wantPct(got.count, got.n).toFixed(1), (1334 / 3386 * 100).toFixed(1),
    'the probe would place the dot somewhere the sentence does not say');

  /* THE OLDER, SEPARATOR-FREE FORM STILL READS, so this is a widening and not a
     swap — pages deployed before today are still measurable by the same probe. */
  assert.deepEqual(lostFrom('..., it lost 243 of 708.'), { count: 243, n: 708 });

  /* ⛔⛔ AND IT READS THE LOSS FIGURE, NOT THE WIN FIGURE BESIDE IT — a hazard
     this sentence did not have until 2026-10-01. It used to carry ONE number
     before `of`; it now carries two ("it won 2,052 and lost 1,334 of 3,386"),
     so a pattern that drifted one noun to the left would still parse, still
     return a plausible count and a plausible n, and place the dot at the
     COMPLEMENT — 61.5% where the sentence says 38.5%. Right-looking and exactly
     backwards, which is the failure mode this whole file exists for.

     The win figure is named here explicitly so the assertion is about THAT
     number rather than about "not the other one". */
  const won = said.rate.match(/won ([\d,]+)/);
  assert.ok(won, 'the sentence no longer names the wins, so this guard has no subject');
  assert.equal(+won[1].replace(/,/g, ''), 3386 - 1334, 'the fixture is not what it claims');
  assert.notEqual(got.count, 3386 - 1334,
    'the probe is reading the WIN count — the dot would be drawn at the complement '
    + 'of what the sentence says, which is a number that looks right');
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

const ICE = { shut: 59, open: 79, rings: 1, text: 409, clipped: 0, heights: 1, clear: 6,
              boxh: 120, boxw: 391, capw: 30,
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

/**
 * ⛔⛔ AND THE THREE ABOVE ARE ALL TRUE OF A BOX THAT IS NOT THERE — which is not
 * hypothetical, it is what this check did.
 *
 * The probe framed the page at 360x900 from 2026-08-27. On 2026-09-13 `a1b6f33`
 * ruled portrait out: under `(orientation:portrait) and (max-width:560px)` the
 * page hides every child of `.wrap` but the rotate prompt and the board. From
 * that day `#lbox` measured 0x0 and the caption 0x0, so the probe reported ONE
 * distinct height (zero), NOTHING clipped (nothing to clip) and a pill clearing
 * by exactly 0 — three green judgements about an absence. `ae6901d` then moved
 * the check into `tools/browser/` and unit-tested `judgeIce` HERE, against
 * synthetic numbers, which cannot notice that the probe found no subject.
 *
 * ⭐ Measured 2026-09-20: re-framed at 740x360, the same mutation the `clear`
 * judgement exists for — dropping `var(--rinkpad)` from the caption's offset —
 * goes red, and under the old framing it did not. §7.2 wrote the rule four days
 * before this check was built: a state names the SUBJECT it needs and goes red
 * if it never found one.
 */
test('⛔⛔ a box that is not there satisfies all three, so the subject is judged first', () => {
  const blind = broke({ boxh: 0, boxw: 0, capw: 0, clipped: 0, heights: 1, clear: 0 });
  assert.equal(blind.length, 3,
    'the probe reported no box and no pill and this raised ' + blind.length
    + ' failure(s) — the three judgements below it are all satisfied by nothing');
  assert.match(blind[0], /claim about nothing/);
  assert.match(blind[2], /two empty rectangles/);
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
  const r = readIce('<title>ICE 59 79 1 409 BOX 0 1 6 SUBJ 120 391 30 HERO -14 -6 MOVED 1 VIS a|b HOST c|d</title>');
  assert.equal(r.rings, 1);
  assert.deepEqual([r.boxh, r.boxw, r.capw], [120, 391, 30],
    'the probe reports its subject and the reader drops it on the floor');
});

/* --------------------------------------------------------------- the replay's states
 * ⛔ THE FIRST VERSION OF THIS CHECK MEASURED NOTHING AND SAID SO CONFIDENTLY. It
 * sampled the scrub at 55%, which on the reference game is a faceoff, and faceoffs
 * are not drawn as figures — so the states written to exercise the figure code
 * reported clean hashes of a circle. Every case below is from that measurement or
 * from a defect that was live.
 */
const GOOD = {
  opening:          { entered: true, frame: 0,  label: 'MIN · Won the faceoff' },
  'attempt-figure': { entered: true, frame: 3,  label: 'BUF · Shot on goal' },
  'goal-figure':    { entered: true, frame: 73, label: '🚨 BUF · GOAL — Jokiharju' },
  'slot-door':      { entered: true, frame: 13, label: 'BUF · Shot on goal · from the slot',
                      land: 'path', why: 1, whyText: 897, hitPct: 33, box: '51x48' },
  'mark-swallows-step': { entered: true, frame: 13, label: 'BUF · Shot on goal',
                      land: 'path', why: 0, whyText: 0, hitPct: 33, box: '51x48',
                      scrubBefore: 13, scrubAfter: 12 },
  'step-back':      { entered: true, frame: 3, scrubBefore: 3, scrubAfter: 2, land: 'line.shotline' },
  'step-forward':   { entered: true, frame: 3, scrubBefore: 3, scrubAfter: 4, land: 'rect.boards' },
};
const stateBroke = over => judgeStates({ ...GOOD, ...over }).filter(v => !v.ok).map(v => v.why);

test('the seven states as the reference game actually renders them are a pass', () => {
  assert.deepEqual(stateBroke({}), []);
});

test('⭐⭐ NOT ENTERING IS THE FIRST FAILURE — a probe that never found its subject measured nothing', () => {
  const why = stateBroke({ 'attempt-figure': { entered: false, note: 'no frame in 269 draws .fig.att' } });
  assert.equal(why.length, 1);
  assert.match(why[0], /never entered its subject/);
  assert.match(why[0], /no frame in 269/, 'the report must carry the probe\'s own reason');
  assert.match(stateBroke({ 'goal-figure': undefined })[0], /never reported/);
});

test('the goal label must name the club, the word and the siren — Kevin found the club missing from the live site', () => {
  assert.match(stateBroke({ 'goal-figure': { ...GOOD['goal-figure'], label: '🚨 GOAL — Jokiharju' } })[0],
    /does not name the club/);
  assert.match(stateBroke({ 'goal-figure': { ...GOOD['goal-figure'], label: 'BUF · GOAL — Jokiharju' } })[0],
    /lost its siren/);
  assert.match(stateBroke({ 'goal-figure': { ...GOOD['goal-figure'], label: 'BUF · Shot on goal' } })
    .join(' '), /does not say GOAL/);
});

test('⛔ the door that was live-broken in BOTH readers: a goal is a <g>, so ev.target missed it', () => {
  const why = stateBroke({ 'slot-door': { ...GOOD['slot-door'], why: 0, whyText: 0 } });
  assert.equal(why.length, 2, 'the card not opening and the card being empty are separate sentences');
  assert.match(why[0], /did not open the why-card/);
});

test('⭐ a mark nobody can press is a different failure from a door that does not open', () => {
  // Planted `pointer-events="none"` on the figure: no point in its own box is it.
  assert.match(stateBroke({ 'slot-door': { ...GOOD['slot-door'], hitPct: 0, why: 0, whyText: 0 } })[0],
    /NO point inside the mark's own 51x48 box/);
  // ⚠️ And the canary BEFORE that one was inert: an inline `style` attribute does
  // nothing on these pages, because `style-src` is hash-pinned with no
  // 'unsafe-inline'. A mutation that cannot land is not evidence.
  assert.match(stateBroke({ 'slot-door': { ...GOOD['slot-door'], hitPct: 12 } })[0], /the target has thinned/);
  assert.equal(stateBroke({ 'slot-door': { ...GOOD['slot-door'], hitPct: HIT_FLOOR } }).length, 0,
    'the floor itself is allowed');
});

test('a double-click steps exactly one frame, each way', () => {
  assert.match(stateBroke({ 'step-back': { ...GOOD['step-back'], scrubAfter: 1 } })[0], /moved frame 3 to 1, not 2/);
  assert.match(stateBroke({ 'step-forward': { ...GOOD['step-forward'], scrubAfter: 5 } })[0], /not 4/);
  assert.equal(stateBroke({ 'step-back': { ...GOOD['step-back'], scrubAfter: 3 } }).length, 1,
    'a gesture that moved nothing is a failure, not a pass');
});

test('the probe reads its own report back', () => {
  const html = '<script type="text/plain" id="out">JSON {"entered":true,"frame":7}\nTEXT hello\nDOM <body></body></script>';
  const r = readState(html);
  assert.equal(r.entered, true);
  assert.equal(r.frame, 7);
  assert.equal(readState('<script type="text/plain" id="out">pending</script>'), null);
  assert.equal(readState('<html></html>'), null);
});

test('⭐ a mark with NO door must not swallow a double press — the one escape a state reached', () => {
  // `s20260916-82` widened `doorAt` from `hdOn && isHD(e)` to `||`, so with no
  // layer on a slot mark swallowed the gesture and the replay stopped answering.
  // Planted, the frame does not move at all: 13 → 13.
  const stuck = { ...GOOD['mark-swallows-step'], scrubAfter: 13 };
  assert.match(stateBroke({ 'mark-swallows-step': stuck })[0], /swallowed a gesture it has no door for/);
  // ⚠️ AND THE DIRECTION IS DATA. This mark sits on the ice's left half so it steps
  // BACK; a mark on the right steps forward. One frame either way is the claim.
  assert.equal(stateBroke({ 'mark-swallows-step': { ...GOOD['mark-swallows-step'], scrubAfter: 14 } }).length, 0,
    'a forward step is read as a failure — the check has welded itself to one side of the ice');
  assert.match(stateBroke({ 'mark-swallows-step': { ...GOOD['mark-swallows-step'], why: 1 } })[0],
    /a why-card opened with no layer on/);
});

/**
 * ⛔⛔ THE WINDOW AND THE PAGE'S PICK ARE DIFFERENT QUESTIONS — 2026-09-20.
 *
 * `recentGameIds` is a WINDOW of recent games and says so in its own docstring:
 * *"never a prediction of the page's pick."* `sitecopy` depended on it to be
 * exactly that anyway, because the copied extracts are what let the game page
 * boot. The two agreed for months and then stopped: the window filters to
 * `t === 2 || t === 3` (regular season, playoffs) and the page filters on
 * nothing but `v`. The first preseason games of 2026-27 published on 2026-09-19,
 * the page's default became a type-1 game whose extract nobody had copied, and
 * `phone-fit` found a game page with **no scoreboard on it**.
 *
 * ⭐ THE GATE WAS RIGHT AND THAT IS THE POINT. It refused to measure an empty
 * page rather than reporting "it fits" — *"this gate measured a page with
 * nothing on it, which is how a 25px overflow shipped."* An instrument that had
 * shrugged would have passed a page a visitor could not use.
 *
 * ⭐ SO THIS PINS THE DIFFERENCE, NOT EITHER FUNCTION ALONE. A catalog whose
 * newest viewable game is PRESEASON is the case that broke, and the two answers
 * must disagree on it: if they ever agree here, one of them has silently taken
 * on the other's rule.
 */
test('⛔ the page opens the newest viewable game even when the window will not carry it', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { defaultGameId, recentGameIds } = await import('../tools/browser/lib.mjs');

  const dir = mkdtempSync(join(tmpdir(), 'rtg-pick-'));
  const cat = { games: [
    { id: 2025030416, d: '2026-06-14', t: 3, v: 1 },   // a playoff game, older
    { id: 2026010008, d: '2026-09-20', t: 1, v: 1 },   // PRESEASON, newest viewable
    { id: 2026010009, d: '2026-09-21', t: 1, v: 0 },   // newer still and REFUSED
  ] };
  writeFileSync(join(dir, 'catalog.json'), JSON.stringify(cat));
  // The page's own rule, in the shape `defaultGameId` extracts it from the built page.
  writeFileSync(join(dir, 'game.html'), `<script>function pick(c){
  var v=c.games.filter(function(g){return g.v;});
  if(!v.length)throw new Error('the catalog lists no game we can show');
  v.sort(function(a,b){return a.d===b.d?a.id-b.id:(a.d<b.d?-1:1);});
  return v[v.length-1].id;
}</script>`);

  const opens = await defaultGameId(join(dir, 'catalog.json'), join(dir, 'game.html'));
  const win = await recentGameIds(join(dir, 'catalog.json'), 10);

  assert.equal(opens, 2026010008,
    'the page no longer opens the newest VIEWABLE game — a refused game or a type filter has crept in');
  assert.ok(!win.includes(opens),
    'the window now carries the preseason pick too, so this test no longer describes the case that '
    + 'broke — if that is a deliberate change to recentGameIds, re-argue this check rather than deleting it');
  assert.ok(win.includes(2025030416), 'the window lost the playoff game it is supposed to carry');
});

/* ────────────────────────────────────────────────────────────────────────────
   `tools/browser/door-row.mjs` — the doors under the rink, and the one that left.

   ⭐ THE JUDGING IS A FUNCTION, SO IT IS TESTED WITH NUMBERS INVENTED HERE
   rather than only by a browser in the release gate. Every case below is a
   measurement the probe could really return, and the first one is the geometry
   that was live on 2026-10-02.
   ──────────────────────────────────────────────────────────────────────────── */
import { CANARY, judgeDoors, openingLabel, readDoors, TOLERANCE } from '../tools/browser/door-row.mjs';

const DOOR = (over = {}) => ({ id: 'work', text: 'How we counted', visible: true,
  display: 'flex', align: 'center', justify: 'center', dx: 0, dy: 0, box: '290x44', ...over });
/* ⭐ THE SUMMARY'S DOOR IS SAMPLED SEPARATELY AND IS SOUND BY DEFAULT HERE, so the
   geometry cases below fail for geometry. It left this row on 2026-10-04 — see
   `the summary's door is judged where a reader LANDS` further down. */
/* ⭐ THE OPENING LABEL IS INVENTED HERE, LIKE EVERY OTHER NUMBER IN THIS FILE.
   The probe reads the real one off the built page — it held a third copy of the
   wording until 2026-10-04, so renaming the door correctly in both shipped
   places still failed the release gate. What the judge asserts is that the
   RENDERED door matches the label the page SHIPS, which these readings exercise
   without either of them being the real string. */
const OPENING = 'An invented door label';
const SIDEBAR = (over = {}) => ({ vis: 'visible', display: 'block', w: 230, h: 44,
  inRow: false, text: OPENING, ...over });
const ROW = (...doors) => ({ booted: true, ended: true, doors, summary: SIDEBAR() });
const doorRefusals = r => judgeDoors(r, { opening: OPENING }).filter(v => !v.ok).map(v => v.why);

test('⛔ THE DEFECT ITSELF: a door laid out differently from the one beside it', () => {
  /* The real measurement of 2026-10-02, when this row held three: all boxes
     290x44, and the odd one's label 5px from its left edge and 7px from its top,
     so its centre missed by 124x-7. The row holds two now and the SHAPE is
     unchanged — one door in it laid out unlike its neighbour. */
  const bad = ROW(DOOR(), DOOR({ id: 'alot', text: 'Is that a lot?', display: 'flex',
    align: 'normal', justify: 'normal', dx: -124, dy: -7 }));
  const why = doorRefusals(bad);
  assert.ok(why.some(w => /laid out differently/.test(w)),
    'the divergence in computed layout is not reported, which is what the defect WAS');
  assert.ok(why.some(w => /horizontal centre/.test(w)) && why.some(w => /vertical centre/.test(w)),
    'a label 124px off its own centre is not reported on both axes');
  assert.equal(doorRefusals(ROW(DOOR(), DOOR({ id: 'alot' }))).length, 0,
    'a row whose doors agree and whose labels are centred must pass');
});

test('⛔⛔⛔ the summary\u2019s door is judged where a reader LANDS, not where a layer puts it', () => {
  /* ⛔⛔⛔ KEVIN, FROM THE LIVE SITE, 2026-10-04: *"I'd rather have a separate
     button, in the sidebar, so a viewer doesn't have to enable a layer to get to
     it."* His premise was right and my measurement was wrong. The door sat in
     this row, and `#rg .lbox.empty .lxw{visibility:hidden}` hides the row until a
     layer is chosen — so a reader on `Just events`, the DEFAULT, had no route to
     the summary at all. I had reported it visible after reading `display` and a
     bounding box, both of which are true of an element nobody can see.
     ⭐ SO THE FIELD IS `visibility`, AND THE STATE IS BEFORE ANY LAYER. */
  const bad = r => doorRefusals({ ...ROW(DOOR(), DOOR({ id: 'alot' })), summary: r });
  assert.ok(bad(SIDEBAR({ vis: 'hidden' })).some(w => /visibility: hidden/.test(w)),
    'an invisible door is not reported — which is the defect, exactly');
  assert.ok(bad(SIDEBAR({ inRow: true })).some(w => /back inside/.test(w)),
    'a door returned to the layer-gated row is not reported');
  assert.ok(bad(SIDEBAR({ w: 0, h: 0 })).some(w => /rendered 0x0/.test(w)),
    'a door with no box at all is not reported');
  assert.ok(bad(SIDEBAR({ text: 'Hide' })).some(w => /before anyone pressed it/.test(w)),
    'a door already reading Hide means a panel is open, so this is not the landing state');
  assert.ok(bad(null).some(w => /no #sum on the page/.test(w)),
    'a missing door reads as a tidy pass');
  assert.equal(bad(SIDEBAR()).length, 0, 'a visible door in the sidebar must pass');
});

test('⭐ three doors drifting TOGETHER are still caught, because centring is judged separately', () => {
  /* ⛔ THE SHAPE THIS GUARDS: a picture checked only against its neighbour in the
     same picture. All three agree perfectly here and all three are wrong. */
  const together = ROW(DOOR({ align: 'normal', justify: 'normal', dx: -124, dy: -7 }),
    DOOR({ id: 'alot', align: 'normal', justify: 'normal', dx: -124, dy: -7 }));
  assert.ok(doorRefusals(together).some(w => /off the horizontal centre/.test(w)),
    'a row where every door is equally wrong passes the sameness check and must fail the centring one');
});

test('a page that did not boot, or never reached the horn, is NOT a tidy pass', () => {
  assert.ok(doorRefusals({ ...ROW(DOOR()), booted: false }).some(w => /never booted/.test(w)));
  assert.ok(doorRefusals({ ...ROW(DOOR(), DOOR()), ended: false }).some(w => /never reached the horn/.test(w)));
  assert.ok(judgeDoors(null).every(v => !v.ok), 'a silent probe is a failure, not a pass');
  assert.ok(judgeDoors({ err: 'boom' }).every(v => !v.ok), 'a probe that threw is a failure');
  /* ⛔ AND A JUDGE GIVEN NO LABEL TO HOLD THE DOOR TO SAYS SO, rather than
     quietly accepting whatever the button happens to read. */
  assert.ok(doorRefusals.length >= 0);
  assert.ok(judgeDoors({ ...ROW(), summary: SIDEBAR() }).filter(v => !v.ok)
    .some(w => /no label on #sum/.test(w.why)),
    'a judge with no shipped label to compare against passed the door anyway');
  /* ⭐ AND THE READER FINDS THE LABEL IN THE BUILT MARKUP. */
  assert.equal(openingLabel('<button class="share sumdoor" id="sum" type="button">Game metrics</button>'),
    'Game metrics');
  assert.equal(openingLabel('<p>no door here</p>'), null);
  /* ⛔ AND IT STOPS THERE. Reporting "the doors do not line up" about a page that
     never ran is a false statement about a working site. */
  assert.ok(!doorRefusals({ ...ROW(DOOR()), booted: false }).some(w => /centre/.test(w)),
    'geometry is being judged on a page that never booted');
});

test('⛔ hidden doors agree about nothing, and "Hide" is not the row Kevin reported on', () => {
  assert.ok(doorRefusals(ROW(DOOR({ visible: false }), DOOR())).some(w => /not visible/.test(w)),
    'a layer must be on — `.lbox.empty .lxw` hides the row, and hidden buttons measure identical');
  assert.ok(doorRefusals(ROW(DOOR({ id: 'alot', text: 'Hide' }), DOOR())).some(w => /a panel is open/.test(w)),
    'a door reading Hide means its panel is open; measuring that label is measuring a different row');
});

test('the canary restores the alignment properties too, or it cannot sing', () => {
  /* ⛔ ITS FIRST VERSION SET ONLY `display`, which left `align-items:center` from
     the live rule applying to the one door still `flex` — so the canary rendered
     CENTRED and passed. Reduced to a string check because the shape of the bug is
     an omission, and an omission is visible in the text. */
  assert.match(CANARY, /align-items:\s*normal/, 'the canary leaves the live centring in place on the flex door');
  assert.match(CANARY, /justify-content:\s*normal/, 'the canary leaves the live main-axis centring in place');
  assert.match(CANARY, /display:\s*block/, 'the canary no longer restores the UA button display its neighbour had');
  /* ⛔⛔ AND IT MUST NAME A SHAPE, NOT AN INSTANCE. The first canary restored the
     ORIGINAL defect declaration for declaration — `.lxw` as a block while `.lxwe`,
     the only door declaring its own display, stayed flex. When the summary's door
     moved to the sidebar `.lxwe` went with it, so that injection made every
     remaining door block TOGETHER: no divergence, probe green, canary accepted. A
     canary written against an instance dies with the instance. */
  assert.doesNotMatch(CANARY, /lxwe/,
    'the canary names a class that no longer exists, so it restores nothing');
  assert.match(CANARY, /\.lxw\s*\+\s*\.lxw/,
    'the canary hits every door equally, which is not a divergence and cannot be caught');
});

test('the probe reads nothing out of a page that never wrote its answer', () => {
  assert.equal(readDoors('<script type="text/plain" id="out">pending</script>'), null,
    '`pending` is the placeholder — reading it as an answer would grade an empty run');
  assert.equal(readDoors('<html>no probe here</html>'), null);
  assert.deepEqual(readDoors('<script type="text/plain" id="out">{"booted":true}</script>'), { booted: true });
  assert.ok(TOLERANCE > 0 && TOLERANCE < 5, 'the tolerance is a few pixels of rounding, not a licence');
});

/* ────────────────────────────────────────────────────────────────────────────
   `preview-marks` — the judgement, with no browser anywhere near it.

   The probe reads a rendered page; this file holds the RULE it applies, so the
   rule can be pushed at with rows this repo made up.

   ⛔⛔⛔ WHAT THE CARD PROMISES NOW, AND WHY. Kevin, over two readings of the live
   page on 2026-10-03: *"I am still having a hard time wrapping my head around a
   graph where the lines stop at the same point, but the numbers say 40 / 25."*
   Each club's mark was a BAR from the league figure to its value, so its length
   was the GAP — and with both clubs below the league every bar ended on the
   league tick. The axis starts at the lowest club-season rather than at zero, so
   a bar from the left edge could not be the fix either: it would give the lowest
   club no bar at all. A value on a truncated axis has one honest encoding, which
   is where it sits, and the promise is that it sits at its own number.
   ──────────────────────────────────────────────────────────────────────────── */
import { judgeMarks, fixture as markFixture, readMarks } from '../tools/browser/preview-marks.mjs';

/** A row as the probe reads it: axis, printed figure, mark position, pixels.
 *  ⚠️ `ink: 150` is the real reading for a mark WITH its outline, measured on the
 *  fixture — a healthy row, so these tests vary one thing at a time. The white
 *  notch a mark without an outline leaves reads about 20. */
const mark = (over = {}) => ({ label: 'shot attempts taken by defencemen',
  lo: 25, hi: 39, printed: 35, at: 100 * (35 - 25) / (39 - 25), w: 600, h: 17,
  wide: 1.8, ink: 150, ...over });

test('⭐⭐⭐ a mark at its own number passes, and one at the league does not', () => {
  /* ⛔ THE SECOND CASE IS THE CARD KEVIN COULD NOT READ. 35% on a 25–39 axis is
     71.4% along the track; anchored at the league figure of 31% it sits at 42.9%
     and every row on the card stops in the same place.
     MUTATION: drop the reconciliation and the second assertion goes. */
  assert.deepEqual(judgeMarks([mark()]), []);
  const anchored = judgeMarks([mark({ at: 100 * (31 - 25) / (39 - 25) })]);
  assert.equal(anchored.length, 1, 'a mark sitting at the league figure was accepted');
  assert.match(anchored[0], /the picture and the number disagree/i);
  assert.match(anchored[0], /prints 35% on an axis of 25–39%/);
});

test('⭐ rounding is tolerated and a real displacement is not', () => {
  /* The card prints whole percent, so the mark may be up to half a point of the
     axis away from where the printed figure says. On a 14-point axis that is 3.6%
     of the track, and the rule allows it plus the 2% tolerance. A displacement
     worth seeing is many times that. */
  assert.deepEqual(judgeMarks([mark({ at: 100 * (35.4 - 25) / (39 - 25) })]), [],
    'a mark inside its own rounding was called a disagreement');
  assert.ok(judgeMarks([mark({ at: 100 * (38 - 25) / (39 - 25) })]).length,
    'a mark three points off its number was accepted');
});

test('⛔ a mark that reconciles perfectly and cannot be seen is still a failure', () => {
  /* ⭐ THE FILL IS `games / need` — 1/35 on a preview in October — so the mark is
     nearly transparent and its outline is all that carries it. Position alone is
     satisfied by a mark drawn in white. That is the shape this repo logged as
     "verifying an ATTRIBUTE is not verifying VISIBILITY", and the only answer is
     to compare its pixels against the track beside it.
     MUTATION: delete the `r.ink` branch and this fires. */
  /* 20 is the measured reading for a mark whose outline has been deleted: the
     opaque backdrop still displaces the track, so a white NOTCH is left behind
     carrying none of the club's colour. That passed the first version of this
     rule, which only asked whether the mark differed from the track at all. */
  const faint = judgeMarks([mark({ ink: 20 })]);
  assert.equal(faint.length, 1, 'an invisible mark in the right place was accepted');
  assert.match(faint[0], /gone invisible/);
  /* AND A MARK WITH NO PIXEL READING IS NOT JUDGED ON IT — `null` is "could not
     ask", which is a different fact from "could not see". */
  assert.deepEqual(judgeMarks([mark({ ink: null })]), []);
});

/* ⏭ A TEST STOOD HERE REQUIRING THE SHADED BAND'S EDGES TO STAY VISIBLE. The
   band could be covered by an opaque mark, and the caption pointed the reader
   straight at it, so the boundary was drawn as its own mark on top — the league
   tick's own logged trap, which says *"it was invisible because it was drawn
   FIRST. SVG has no z-index; paint order is document order."*

   Kevin removed the band the same day: *"I don't think the shading is
   necessary."* The track is a rail, the league tick and the two club marks now,
   so there is no boundary left to lose and nothing for the rule to be about. It
   is recorded rather than kept green against an empty list, which is how a check
   comes to pass on a page that no longer has the thing it names. ⚠️ If a band
   ever comes back, so does this: `git log -S '#8fb0cc'` finds all of it. */

test('⛔ a probe that measured nothing is a FAILURE, never a pass', () => {
  /* ⛔⛔⛔ THE SHAPE THIS REPO PAYS FOR MOST. Every assertion above is vacuous on a
     page that drew nothing, and "no rows, no disagreements, all good" is exactly
     how a check comes to approve everything. */
  assert.ok(judgeMarks(null).length, 'a silent probe passed');
  assert.ok(judgeMarks([]).length, 'an empty reading passed');
  const missing = judgeMarks([mark({ printed: null })]);
  assert.ok(missing.length, 'a row with no printed figure was skipped quietly');
  assert.match(missing[0], /not being checked at all/);
  /* ⭐ AND A ROW THAT RECONCILES IS THE ONLY THING THAT CLEARS THE GUARD. With
     the band gone this is the single vacuity check left, so it carries the whole
     weight: a reading with rows in it that reconciles none of them is a probe
     that proved nothing, not a page that is fine. */
  const unreadable = judgeMarks([mark({ lo: 39, hi: 39 })]);
  assert.ok(unreadable.length, 'a zero-width axis was judged rather than reported');
  assert.match(unreadable[0], /the axis runs 39 to 39/);
});

test('⭐⭐ the fixture puts the league figure where the real card has it', () => {
  /* ⛔ AND THAT IS WHAT MAKES THE PICTURE HARD. `leagueShares` sums over every
     club in the season bucket, so a fixture holding only the two clubs in the
     game puts the league figure BETWEEN them — which is a card where nothing sits
     outside the band and the hardest shape is never drawn. The filler clubs exist
     to put it where the real card has it.
     ⚠️ ASSERTED, not trusted: it is four numbers a row and an edit would quietly
     flatten the fixture again. */
  const clubs = markFixture({})['teams.json'].seasons[2026];
  const sum = f => Object.values(clubs).reduce((a, t) => a + f(t), 0);
  assert.equal(Math.round(100 * sum(t => t.level5.for)
    / sum(t => t.level5.for + t.level5.against)), 50,
    'level5 league is not 50% — the fixture is not a league');
  assert.equal(Math.round(100 * sum(t => t.dmen.count) / sum(t => t.dmen.n)), 31);
  assert.equal(Math.round(100 * sum(t => t.slot.count) / sum(t => t.slot.n)), 50);
  /* AND THE TWO CLUBS IN THE GAME CARRY THE NUMBERS KEVIN WAS READING. */
  assert.equal(clubs.WSH.level5.for, 4);
  assert.equal(clubs.WSH.level5.for + clubs.WSH.level5.against, 10);
  assert.equal(clubs.TBL.level5.for, 2);
  assert.equal(clubs.TBL.level5.for + clubs.TBL.level5.against, 8);
});

test('⛔ the reader answers null when the page said nothing', () => {
  assert.equal(readMarks('<html><body><p>nothing here</p></body></html>'), null);
  assert.deepEqual(readMarks('<p id="marksout">MARKS [{"label":"x"}]</p>'), [{ label: 'x' }]);
});

/* ────────────────────────────────────────────────────────────────────────────
   `methods-deeplink` — the judgement, with no browser anywhere near it.

   ⛔⛔⛔ KEVIN, 2026-10-03: *"in the what is normal section, we provide a doorway
   into the how we measure page. but, each link just goes to the page header, not
   the specific section of each metric being explained."*

   ⚠️ NOTHING WAS WRONG WITH EITHER END. The preview writes
   `/how-we-measure.html#m-<key>`, the methods page gives each section
   `id="m-<key>"`, both call `anchorOf` so they cannot drift apart, and
   `methods.test.js` already proves every door has a section to land on. All
   true, all green, every door landing on the header — because the page is a
   shell whose sections are drawn after `measures.json` arrives, and the browser
   resolves the fragment while parsing, against an empty host.
   ──────────────────────────────────────────────────────────────────────────── */
import { judgeDeep, readDeep } from '../tools/browser/methods-deeplink.mjs';

/** A reading as the probe takes it: a door that landed, on a scrollable page. */
const deep = (over = {}) => ({ hash: 'm-powerplay', found: true, top: 4, scrolled: 1970,
  focused: 'm-powerplay', sections: 16, tall: 9000, view: 600, ...over });

test('⭐⭐⭐ a door that landed passes, and one left at the header does not', () => {
  /* The second case is the live site before the fix: the section exists, the
     href is right, and it is 1,975px below the fold because nothing ever scrolled.
     MUTATION: drop the `top` comparison and it goes. */
  assert.deepEqual(judgeDeep(deep()), []);
  const stuck = judgeDeep(deep({ top: 1975, scrolled: 0 }));
  assert.equal(stuck.length, 1, 'a door that never moved the page was accepted');
  assert.match(stuck[0], /1975px from the top of the viewport/);
  assert.match(stuck[0], /resolved the fragment against an empty page/);
});

test('⛔ a door that scrolled but left the keyboard behind is still a failure', () => {
  /* ⭐ THE PAGE CLAIMS THIS, so it is checked: the fix sets `tabIndex` and calls
     `focus`, and a claim nothing checks is a comment. Scrolling moves the eye; a
     reader on a keyboard is still at the top of the document and their next Tab
     proves it.
     MUTATION: delete the focus branch and this is the only thing that fires. */
  const eyesOnly = judgeDeep(deep({ focused: null }));
  assert.equal(eyesOnly.length, 1, 'a door that moved only the scrollbar was accepted');
  assert.match(eyesOnly[0], /a reader on a keyboard has not been taken anywhere/);
  /* AND IT IS NOT REPORTED WHEN THE LANDING ITSELF FAILED — focus is a second
     property of a door that arrived, not a second way of saying it did not. */
  const stuck = judgeDeep(deep({ top: 1975, focused: null }));
  assert.equal(stuck.length, 1, 'one fault was reported as two');
  assert.match(stuck[0], /from the top of the viewport/);
});

test('⛔ a probe that measured nothing is a FAILURE, never a pass', () => {
  /* ⛔⛔⛔ EVERY ASSERTION ABOVE IS VACUOUS ON A PAGE THAT DREW NOTHING, and
     "no sections, nothing below the fold, all good" is exactly how a check comes
     to approve everything. Four ways to end up with nothing, each one named. */
  assert.ok(judgeDeep(null).length, 'a silent probe passed');
  assert.ok(judgeDeep(deep({ hash: '' })).length, 'a reading with no fragment passed');
  const empty = judgeDeep(deep({ sections: 0 }));
  assert.ok(empty.length, 'a page that drew no sections passed');
  assert.match(empty[0], /drew no sections at all/);
  /* ⭐ AND THE PAGE MUST BE TALLER THAN THE VIEWPORT. On a document that fits on
     one screen every fragment "lands" without moving anything, so this check
     would pass on a site whose deep links are all broken. */
  const short = judgeDeep(deep({ tall: 620, view: 600 }));
  assert.ok(short.length, 'a page with nowhere to scroll was judged rather than reported');
  assert.match(short[0], /nowhere\s+to scroll to|nowhere to scroll to/);
  /* A fragment naming no section is a DEAD door, which is a different and worse
     fault than one that mis-lands, and it says so. */
  const dead = judgeDeep(deep({ found: false }));
  assert.match(dead[0], /names no section on the page/);
});

test('⛔ the reader answers null when the page said nothing', () => {
  assert.equal(readDeep('<html><body><p>nothing here</p></body></html>'), null);
  assert.deepEqual(readDeep('<p id="deepout">DEEP {"hash":"m-x"}</p>'), { hash: 'm-x' });
});

/* ────────────────────────────────────────────────────────────────────────────
   `one-tap` — the judgement, with no browser anywhere near it.

   ⭐⭐⭐ WHAT THE PROBE PROMISES. Kevin, 2026-10-04: *"when it plays continuously
   and event by event it plays fine, but when I tap the scrubber to a different
   time, the replay appears to go through two loops for each event."* A native
   range reports one tap TWICE — `input` at the press and `change` at the
   release, the same value, 108ms apart — and the page drew the frame once for
   each. The promise is that one tap arrives in ONE BEAT.

   ⚠️ THE RULE IS NOT "NO ANIMATION RAN TWICE", and the probe's first version was.
   Its canary caught that by PASSING: with the memo in place a frame drawn twice
   rewrites only the subtrees whose markup differs, so the label fades once and
   the mark simply appears and then pops a hold later. No name repeats and the
   reader still sees two beats. The SPREAD is the property the complaint is
   about, and these tests are what let that be said without a browser.
   ──────────────────────────────────────────────────────────────────────────── */
import { judgeTap, HOLD } from '../tools/browser/one-tap.mjs';

/** A landing as the probe reads it: the control's reports, and what animated when. */
const landing = (ats, ev = ['pointerdown=-1', 'input=110', 'change=110']) =>
  ({ ev, anim: ats.map(([name, at]) => ({ name, at })) });

/* The real reading from the fixed page, measured: eleven starts, one timestamp. */
const ONE_BEAT = landing([['cap', 300], ['pkn', 300], ['pkn', 300], ['pkn', 300],
  ['pop', 300], ['pj', 300], ['plfade', 300], ['gkin', 300]]);

test('⭐⭐⭐ one tap in one beat passes; the same tap in two does not', () => {
  assert.deepEqual(judgeTap(ONE_BEAT), []);
  /* ⛔ THE DEFECT, AS THE CANARY REPRODUCES IT AND AS THE PAGE SHIPPED: the
     counters, the label and the goaltenders at the press, then the caption, the
     mark's pop and the puck's jump a hold later. */
  const two = judgeTap(landing([['pkn', 300], ['plfade', 300], ['gkin', 300],
    ['cap', 388], ['pop', 388], ['pj', 388]]));
  assert.ok(two.length, 'a landing drawn twice was judged clean');
  assert.match(two[0], /arrived in 2 beats, 88ms apart/);
});

test('⭐ six counters ticking together are six elements, not six repeats', () => {
  /* ⚠️ THE RULE IS COUNTED IN TIME, NOT IN NAMES. Every lens counter moves on a
     jump across the game, so `pkn` legitimately starts six times at one instant
     — and a rule that forbade a repeated NAME would fail the correct page. */
  assert.deepEqual(judgeTap(ONE_BEAT), []);
  const restart = judgeTap(landing([['plfade', 300], ['plfade', 417]]));
  assert.ok(restart.some(m => /"plfade" ran 2 times/.test(m)),
    'an entrance animation restarting 117ms later is what a reader calls two loops');
});

test('⛔ the bound comes from the gesture the probe itself performs', () => {
  /* A press held for `hold` ms IS the gap between the two reports, so half of it
     is a bound no single draw can reach and no double draw can duck. Passing a
     different hold moves the bound with it rather than leaving a constant behind
     that no longer describes the experiment. */
  const spread = landing([['pop', 300], ['cap', 300 + HOLD / 2 + 10]]);
  assert.ok(judgeTap(spread).length, 'a spread past half the hold was allowed');
  assert.deepEqual(judgeTap(spread, (HOLD / 2 + 10) * 4), [],
    'a longer hold did not widen the bound, so the number is not derived at all');
});

test('⛔ and a page that drew nothing is reported, not passed', () => {
  /* THE SUBJECT MUST BE PRESENT: "no animation ran twice" is perfectly true of a
     blank rink, which is the shape `lib.mjs` warns about in its own header. */
  const blank = judgeTap({ ev: ['pointerdown=-1', 'input=110', 'change=110'], anim: [] });
  assert.ok(blank.length);
  assert.match(blank[0], /drew nothing/);
  const dead = judgeTap({ ev: [], anim: [] });
  assert.match(dead[0], /did not reach the control/);
  /* AND THE PAIR MUST HAVE ARRIVED. A probe that only ever delivered `input` is
     the blind spot this whole check exists to close, so it cannot be the thing
     that quietly makes it pass. */
  const half = judgeTap(landing([['pop', 300]], ['pointerdown=-1', 'input=110']));
  assert.ok(half.some(m => /only one of them arrived/.test(m)));
});
