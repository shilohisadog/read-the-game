/**
 * ⭐⭐ THE ONE MEMO KEYED ON A PROXY, AND THE PREMISE THAT MAKES IT SAFE.
 *
 * `render` calls `drawRink(PER)` on every frame and `drawRink` returns early when
 * the period has not changed. Measured across the reference game's 269 frames,
 * `#rink` has **2 distinct states** — so the memo turns 269 rewrites of the whole
 * rink, both nets included, into a handful.
 *
 * CHENG, 2026-09-04, splitting the three memos on this page into two kinds:
 *
 *   netmenAre / pillIs   memo on the CONTENT — `now === netmenAre`, self-validating
 *   rinkPer              memo on a PROXY     — `per === rinkPer`, and the period
 *                                              is not the content
 *
 * The content memos compare the string they are about to write against the one
 * they last wrote, so they cannot be wrong. `drawRink` asks a different question
 * and its output depends on three things, only one of which is in the test:
 * `per`, the arena transform `AX`, and the two club colours. The last two are
 * fixed for the life of a boot — so it is correct, **and correct by a fact nobody
 * had written down.**
 *
 * ⛔ AND ITS FAILURE MODE IS INVISIBLE TO EVERY OTHER INSTRUMENT HERE. A stale
 * rink renders identically on every pass, so `test/fixtures/dom-golden.json`
 * would pin the stale frame and agree with itself forever. That is the fifth
 * instance in this repo of an instrument covering less than its name implies —
 * after coverage not seeing `app.js`, the fit gate grading an error page, the
 * canary that proved the ruler instead of the subject, and a walk covering only
 * the states it was booted into.
 *
 * So the premise is asserted rather than described.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, SCRIPT } from './helpers/page.js';
import { walk } from '../tools/jslex.mjs';

/**
 * Every name the shipped script assigns to, tagged `:decl` or `:write`.
 *
 * ⚠️ THE FIRST DRAFT READ THE SECOND DECLARATOR OF EVERY MULTIPLE DECLARATION AS
 * A WRITE, because it only looked at the token before the name — and `const
 * AWAYCOL=colourOf(AAB), HOMECOL=colourOf(HAB);` puts a comma there. So it
 * reported `HOMECOL` as reassigned, which is the opposite of true. It was caught
 * by this file's own *"has lost its subject"* guard, which is the whole reason
 * that guard is written before the interesting assertion rather than after it.
 * A declaration runs from its keyword to the `;`, so that is what is tracked.
 */
function assignedNames(src) {
  const out = new Set();
  let prev = null, decl = false;
  walk(src, t => {
    if (t.t === 'id' && !t.member && ['const', 'let', 'var'].includes(t.v)) decl = true;
    else if (t.t === 'op' && (t.v === ';' || t.v === '{' || t.v === '}')) decl = false;
    /* `x =` but not `x ==`, `x =>`, `x ===`, and not `.x =` — the walk hands over
       operators as whole tokens, so those are different tokens rather than a
       lookahead this has to get right. */
    if (t.t === 'op' && t.v === '=' && prev && prev.t === 'id' && !prev.member && !prev.key)
      out.add(`${prev.v}:${decl ? 'decl' : 'write'}`);
    prev = t;
  });
  return out;
}

test('⭐⭐ the rink memo’s premise: everything else it draws from is a constant', () => {
  /* THE INVALIDATION RULE, AS A CHECK. `drawRink` may key on the period ALONE
     only while `AX` and the club colours cannot move under it. `AX` is built from
     `ASPLAYED` (the link's ends mode) and `SIDES` (the game's own record); the
     colours are read once from the clubs. All five are `const` and none is ever
     assigned again.

     ⭐ THIS IS THE CHECK THAT MATTERS, AND IT IS THE ONE THAT WOULD GO RED. The
     day somebody makes the ends mode a live control — a plausible thing to want,
     and `layers-off-the-watch-page` already contemplates moving controls around —
     `ASPLAYED` becomes a `let`, this fails, and whoever made the change is told
     that the rink now needs redrawing on something other than the period.
     Without it, the first symptom is a rink facing the wrong way on a real
     screen, seen by a person, in the one part of the page nobody re-reads. */
  /* ⭐ `AID` IS IN THIS LIST FOR A SECOND MEMO, and measuring is what put it here.
     `pillIs` turns out to be a THIRD kind, between the two CHENG named: its key is
     `${b.id}|${b.said}|${b.count}` — a digest of its INPUTS, not the markup it
     writes. That is safe while everything else the pill renders from is fixed, and
     the one thing the key omits is `AID`, which decides whether the badge takes the
     away side or the home one. Same premise, same check. */
  const names = assignedNames(SCRIPT);
  for (const n of ['ASPLAYED', 'SIDES', 'HOMECOL', 'AWAYCOL', 'DIR', 'AX', 'AID']) {
    assert.ok(names.has(`${n}:decl`),
      `${n} is not declared in the shipped bundle — this check has lost its subject`);
    assert.ok(!names.has(`${n}:write`),
      `${n} is assigned after its declaration, so it can change during a boot. `
      + 'drawRink() memoises on the period alone and would keep drawing a rink built '
      + 'from the old value — a stale frame that renders identically on every pass, '
      + 'which no golden walk can see. Read the comment above drawRink.');
  }
});

test('⭐ …and the memo redraws the rink when the period turns over, and never otherwise', () => {
  /* THE OTHER HALF, BEHAVIOURAL. The premise above is worthless if the memo has
     stopped firing at all, and a memo that never returns early is invisible —
     the page looks right and does 269x the work. `writes` is the fake's own
     count of assignments to `innerHTML`, so this reads the mechanism rather than
     a proxy for it. */
  const a = boot(null, null, '');
  const rows = a.every(d => ({ per: d.$('per').textContent,
                               writes: d.$('rink').writes,
                               html: d.$('rink').innerHTML }));
  assert.ok(rows.length > 200, `walked only ${rows.length} frames`);

  const periods = new Set(rows.map(r => r.per));
  assert.ok(periods.size >= 3, `the reference game showed ${periods.size} periods`);

  const turnovers = rows.filter((r, k) => k > 0 && r.per !== rows[k - 1].per).length;
  const redraws = rows.filter((r, k) => k > 0 && r.writes > rows[k - 1].writes).length;
  assert.equal(redraws, turnovers,
    `the rink was redrawn ${redraws} times across ${turnovers} period changes — `
    + 'either it is redrawing on something other than the period, or it has stopped '
    + 'redrawing when the period turns over');

  /* AND THE MEMO IS DOING SOMETHING, stated as a comparison rather than a
     threshold: far fewer writes than frames. Without this the assertion above is
     satisfied by a page that never draws a rink at all. */
  assert.ok(redraws < rows.length / 10,
    `${redraws} redraws over ${rows.length} frames — the memo is not memoising`);
});

test('⭐ the netmen memo is the self-validating kind: a write means the markup moved', () => {
  /* THE CONTRAST, ASSERTED RATHER THAN ASSUMED. `netmenAre` holds the exact string
     it last wrote and compares the next one against it, so a write implies a
     change and no premise about anything else is needed — that is what makes it a
     different KIND from the rink's memo, and the reason only the rink needed the
     check above. If it ever became keyed on a proxy, this goes red and it gets the
     same treatment.

     ⚠️ AND THE THREE MEMOS ARE NOT TWO KINDS BUT THREE, which measuring found and
     the review did not. `pillIs` is neither: its key is a digest of the pill's
     inputs rather than its markup, so it cannot be checked this way at all — its
     premise is `AID`, and it is asserted in the constants test above. Only
     `#netmen` is memoised on the literal bytes, which is why only it is here. */
  const a = boot(null, null, '');
  const rows = a.every(d => ({ writes: d.$('netmen').writes, html: d.$('netmen').innerHTML }));
  const wrote = rows.filter((r, k) => k > 0 && r.writes > rows[k - 1].writes);
  assert.ok(wrote.length > 0, '#netmen was never written in a whole game');
  for (const [k, r] of rows.entries())
    if (k > 0 && r.writes > rows[k - 1].writes)
      assert.notEqual(r.html, rows[k - 1].html,
        `#netmen was rewritten at frame ${k} with the markup it already had, so it is `
        + 'no longer keyed on its own content');
});
