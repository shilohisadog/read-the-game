/**
 * ⛔⛔ THE LIST PAGES DO NOT CARRY THE ARCHIVE, AND CANNOT QUIETLY START AGAIN.
 *
 * THE DEFECT, measured 2026-09-28. `index.html` and `calendar.html` each inlined
 * the whole of `archive.js` — every season-wide rate, histogram and base rate —
 * plus `rink.js` and `distribution.js`, which are in those lists only because
 * `archive.js` imports them. What the two pages actually called was `inScope`, a
 * one-line predicate, and three functions that print a disputed-shot note.
 * `summarise` and `slotShare` appear in `build_index.py` only inside COMMENTS,
 * which is how it went unnoticed.
 *
 * ⚠️⚠️ AND READING THE CODE COULD NOT SETTLE IT. `lib-closure.test.js` checks
 * that a page carries everything its modules NEED. Nothing checked the reverse —
 * that everything a page carries is needed — because an unused module is not
 * wrong, only heavy. The only way to find out whether the front door used
 * `archive.js` was to delete it and watch the page throw `inScope is not
 * defined`. ⭐ **A property nothing asserts is a property you can only learn by
 * breaking something.**
 *
 * ⭐ THE ASSERTION IS ABOUT SUBJECT, NOT SIZE. A byte ceiling alone would go red
 * on any honest growth and be raised until it meant nothing. What must stay true
 * is that these pages carry the PREDICATE and not the ARCHIVE — so the check
 * names archive-only symbols and requires their absence. The ceiling underneath
 * is a second, looser net with its headroom declared out loud.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const page = n => readFileSync(new URL(`../src/${n}`, import.meta.url), 'utf8');

/* Exports that exist ONLY in archive.js and that no list page has ever called.
   ⚠️ Named from the module's own export list rather than invented: if one of
   these is legitimately needed by a list page one day, the right move is to
   delete it from here deliberately, which is a decision with a diff. */
const ARCHIVE_ONLY = ['levelCurve', 'perGame', 'reachOf', 'goalieNight',
                      'saveShare', 'slotShare', 'summarise', 'rowFor'];

for (const name of ['index.html', 'calendar.html']) {
  test(`⛔ ${name} carries the scope predicate, not the whole archive`, () => {
    /* MUTATION: put "archive.js" back in that page's `_lib(...)` list in
       build_index.py, rebuild, and this fires naming the symbols it dragged in. */
    const html = page(name);
    const carried = ARCHIVE_ONLY.filter(s => new RegExp(`function ${s}\\b`).test(html));
    assert.deepEqual(carried, [],
      `${name} has inlined archive.js again — it is shipping season-wide measurement `
      + `to a page that lists games: ${carried.join(', ')}`);

    /* AND IT STILL HAS WHAT IT DOES USE, so this cannot be satisfied by a page
       that dropped the predicate along with the weight — which would build clean
       and throw at render time, the exact failure lib-closure.test.js exists for. */
    assert.match(html, /function inScope\b/, `${name} lost the scope predicate`);
    assert.match(html, /function disputedNote\b/, `${name} lost the disputed-shot note`);
  });
}

/**
 * ⚠️ A DECLARED POLICY, NOT A MEASUREMENT — Kevin's own distinction. Nothing
 * derives these numbers; they are a ceiling chosen with stated headroom, and the
 * headroom is the whole reason the figure is safe to assert. Measured after the
 * split on 2026-09-28: index 60,389 and calendar 33,894 gzipped bytes. The
 * ceilings are ~25% above that, so ordinary growth passes and a re-inlined
 * archive (which was +18.7KB and +18.6KB) cannot.
 */
test('⭐ neither list page has doubled back toward its pre-split weight', () => {
  const ceiling = { 'index.html': 75_000, 'calendar.html': 42_000 };
  for (const [name, max] of Object.entries(ceiling)) {
    const gz = gzipSync(Buffer.from(page(name))).length;
    assert.ok(gz < max,
      `${name} is ${gz.toLocaleString()} bytes gzipped, past its declared ceiling of `
      + `${max.toLocaleString()}. Either something large was inlined, or the ceiling `
      + `needs raising ON PURPOSE — which is a decision, not a test fix.`);
  }
});
