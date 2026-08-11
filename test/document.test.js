/**
 * Every page is a complete, mobile-correct HTML document.
 *
 * THE INHERITED ASSUMPTION THAT STOPPED BEING TRUE. Every view here began as a
 * Claude artifact, and that host wraps whatever you give it in
 * `<!doctype html><html><head>…</head><body>`. The fragments were complete pages
 * *in that context*, so nobody thought about it. Copied into a real static site,
 * nothing wraps anything — and eight of nine pages shipped with no doctype, no
 * <head>, no <title> and no viewport meta.
 *
 * NONE OF IT FAILED. The pages rendered, every test passed, and a desktop browser
 * is forgiving enough that the only symptom appeared on a device the author was
 * not using: a phone laying the page out at ~980px and scaling it down until the
 * text is unreadable and every tap target is a third of its size. Kevin asked
 * about phones and that is what surfaced it.
 *
 * That is the shape worth naming: a defect that is invisible from where you work
 * needs a check, not more care. This is the check.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const SRC = new URL('../src/', import.meta.url);
const PAGES = readdirSync(SRC).filter(f => f.endsWith('.html'));

test('there are pages to check, so a broken glob cannot pass silently', () => {
  assert.ok(PAGES.length >= 8, `only ${PAGES.length} pages found`);
});

for (const f of PAGES) {
  const html = readFileSync(new URL(f, SRC), 'utf8');

  test(`${f} is a complete document`, () => {
    // No doctype means QUIRKS MODE — the browser deliberately emulates a 1990s
    // box model, which is not the one any of this CSS was written for.
    assert.match(html.slice(0, 40), /^<!doctype html>/i, 'no doctype — quirks mode');
    assert.match(html, /<html lang="[a-z]{2}"/, 'no lang — a screen reader guesses');
    assert.match(html, /<head>/, 'no head');
    assert.match(html, /<body>/, 'no body');
    assert.match(html, /<\/html>\s*$/, 'unterminated document');
  });

  test(`${f} tells a phone its real width`, () => {
    // THE LINE THE WHOLE FILE IS ABOUT, and the whole of the mobile problem.
    const m = html.match(/<meta name="viewport" content="([^"]+)"/);
    assert.ok(m, 'no viewport meta — a phone renders at ~980px and scales down');
    assert.match(m[1], /width=device-width/);
    // A page that forbids zoom fails a fan who needs to enlarge it, and this
    // site has no reason to want that.
    assert.doesNotMatch(m[1], /user-scalable=no|maximum-scale=1/,
      'zoom must not be disabled');
  });

  test(`${f} names itself in a tab and a shared link`, () => {
    const m = html.match(/<title>([^<]+)<\/title>/);
    assert.ok(m && m[1].trim().length > 8, 'no usable title — a tab shows the URL');
    assert.match(m[1], /Read the Game/, 'and it should say which site it is');
  });

  test(`${f} came through the shared shell, not a hand-written head`, () => {
    // One definition of "a complete document", in builders/page.py. Eight copies
    // of a head is eight places for the next missing meta to hide.
    const head = html.slice(0, html.indexOf('</head>'));
    assert.match(head, /<meta charset="utf-8">\n<meta name="viewport"/,
      'the head is not in the shared shell\'s shape');
  });
}

test('the shell is defined once', () => {
  const builders = new URL('../builders/', import.meta.url);
  const offenders = readdirSync(builders)
    .filter(f => f.endsWith('.py') && f !== 'page.py')
    .filter(f => /<!doctype html>/i.test(readFileSync(new URL(f, builders), 'utf8')));
  assert.deepEqual(offenders, [],
    'a builder writing its own doctype has forked the document shell');
});
