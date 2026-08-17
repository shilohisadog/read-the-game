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
import { createHash } from 'node:crypto';

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

/**
 * Metadata is copy, and it is the copy nobody looks at.
 *
 * CHENG found the homepage's meta description still reading "A single NHL game"
 * long after the archive held three seasons — the IDENTICAL stale claim the
 * homepage audit was created to remove from the limits block, surviving one layer
 * out because it is invisible on the page. It is also the copy that appears in a
 * search result and in every shared link.
 *
 * It had in fact been corrected an hour earlier, but BY ACCIDENT, as a side
 * effect of moving the head into builders/page.py. Nothing would have caught it
 * and nothing would have caught it coming back. That is the whole argument for
 * this test existing rather than for being more careful.
 */
for (const f of PAGES) {
  const html = readFileSync(new URL(f, SRC), 'utf8');
  const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1];

  test(`${f} describes itself for a search result and a shared link`, () => {
    assert.ok(desc && desc.length > 40, 'no usable description');
    for (const p of ['og:title', 'og:description', 'twitter:card', 'twitter:title']) {
      assert.ok(html.includes(p), `no ${p} — a shared link arrives as a naked URL`);
    }
    const og = html.match(/property="og:description" content="([^"]+)"/)[1];
    assert.equal(og, desc, 'the two descriptions must not be able to disagree');
  });
}

test('the homepage does not describe an archive as one game', () => {
  // The page serves 4,553 games across three seasons. Any metadata claiming a
  // single game is the stale-claim bug, and it is worse in metadata than in the
  // body because no reader of the page can see it to notice.
  const html = readFileSync(new URL('index.html', SRC), 'utf8');
  const desc = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.doesNotMatch(desc, /\b(a single|one) (NHL )?game\b/i,
    `the homepage description claims one game: "${desc}"`);
  assert.match(desc, /seasons|archive|games/i, 'and it should say what it is');
});

/**
 * THE CHROME: a header and a footer no page can be without.
 *
 * `game.html` shipped with ZERO href attributes — not one link on the whole
 * page. It is the LANDING page, because the shareable unit of this site is a
 * game, so the stranger arriving from a shared link hit a dead end with no route
 * to the archive, to a team, or to any explanation of what they were looking at.
 * Two reviewers redesigned the homepage in the same week without noticing,
 * because each of us reviewed the page we were shown rather than asking which
 * page receives traffic.
 *
 * These live in `page.py::document` for the same reason the viewport tag does:
 * a rule that must be re-applied in every builder is the defect this whole file
 * exists to catch, one level up.
 */
test('every page carries the site header, with a route home', () => {
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    assert.match(h, /<header class="sitehdr">/, `${f} has no site header`);
    assert.match(h, /<a class="mark" href="\/">Read the Game<\/a>/,
      `${f} has no route back to the front page`);
  }
});

test('every page carries the footer, so the attribution is not optional', () => {
  // goalie-eye-view.html carried NO no-marks statement at all. Nobody found that
  // by looking; it fell out of the rule getting a home.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    assert.match(h, /<footer class="sitefoot">/, `${f} has no site footer`);
    assert.match(h, /No NHL or club logos, wordmarks or crests/,
      `${f} does not say that no club marks appear`);
    // THE CLAIM, NOT ONE SPELLING OF IT. This pinned a literal sentence, so
    // widening the disclaimer broke it — and a test that breaks when a
    // disclaimer gets STRONGER is pointing at the wrong thing. What must hold
    // is that all three refusals are made, and that they cover the clubs as
    // well as the league, because a club is not the league.
    for (const claim of [/not affiliated with/i, /endorsed by/i, /a product of/i])
      assert.match(h, claim, `${f} does not refuse: ${claim}`);
    assert.match(h, /National Hockey League|NHL/, `${f} does not name the league`);
    assert.match(h, /any club|or club/i, `${f} disclaims the league but not its clubs`);
    // AND A WAY TO BE TOLD THE WORK IS WRONG. A site whose whole trade is "read
    // our work" is incomplete without one, and it belongs to the same rule as
    // everything else here: in the chrome, so no page can lack it.
    assert.match(h, /href="mailto:[^"]+@[^"]+"/, `${f} offers no way to report a wrong number`);
  }
});

test('a page has ONE footer, so the attribution cannot disagree with itself', () => {
  // The home page carried two: the shared chrome's, and its own from before the
  // chrome existed. Both stated the attribution, in different words, and only
  // one of them was on the other eight pages — so the wording a reader saw
  // depended on which page they landed on, and only one version was under test.
  // Kevin: "please remove this section, since the footer contains the
  // disclaimer."
  //
  // A COUNT, NOT A SEARCH FOR THAT PARTICULAR LEFTOVER. Asserting the old
  // paragraph is absent would guard one spelling of the mistake; this forbids
  // the shape, which is the same trade as `no figure without a denominator`.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const n = (h.match(/<footer\b/g) || []).length;
    assert.equal(n, 1, `${f} carries ${n} footers — the attribution can disagree with itself`);
  }
});

test('the tip jar asks for support and never sells access', () => {
  // Kevin's constraint, verbatim: "it has to be 'donate' or 'buy me a coffee'
  // type of surface, so I minimize the chance of any scrutiny from the NHL."
  // The risk is not the link, it is a link that implies you are BUYING
  // something — so this asserts the framing, not just the href.
  const forbidden = /\b(subscribe|subscription|member(s|ship)?|premium|pro plan|unlock|supporters? only|paywall(?!ed)|upgrade)\b/i;
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const foot = h.match(/<footer class="sitefoot">[\s\S]*?<\/footer>/)[0];
    assert.match(foot, /href="https:\/\/buymeacoffee\.com\//, `${f} has no tip jar`);
    assert.doesNotMatch(foot, forbidden,
      `${f} offers a tier or gated access — this must read as a tip, not a product`);
    // It must come AFTER the not-affiliated sentence, so a reader meets the
    // disclaimer before the ask. Position is the whole of Kevin's constraint.
    assert.ok(foot.indexOf('Not affiliated') < foot.indexOf('buymeacoffee.com'),
      `${f} asks for money above its own disclaimer`);
  }
});

test('the tip jar is one link to one canonical URL, and it is not a script', () => {
  // The widget is a third-party script; the policy admits exactly one external
  // origin and it was spent on analytics deliberately. A refused donate button
  // is not hypothetical — the email decoder was refused the same afternoon.
  const urls = new Set();
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    for (const m of h.matchAll(/https:\/\/(?:www\.)?buymeacoffee\.com\/[^"']*/g)) urls.add(m[0]);
    assert.doesNotMatch(h, /<script[^>]+buymeacoffee/i, `${f} embeds the Buy Me a Coffee widget`);
  }
  assert.equal(urls.size, 1, `the site names ${urls.size} tip-jar URLs: ${[...urls].join(', ')}`);
  // Lowercase is the canonical path — the mixed-case form 301s to it, so
  // linking it directly saves every reader a redirect.
  assert.deepEqual([...urls], ['https://buymeacoffee.com/readthegameofhockey']);
});

test('the contact address is spelt one way, in one place', () => {
  // A second copy is a second thing to get wrong, and an address that differs
  // between pages is worse than none: it looks like a typo in the one you read.
  const seen = new Set();
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    for (const m of h.matchAll(/mailto:([^"?]+)/g)) seen.add(m[1]);
  }
  assert.equal(seen.size, 1, `the site names ${seen.size} addresses: ${[...seen].join(', ')}`);
});

test('NO PAGE IS A DEAD END — the one this work exists to fix', () => {
  // Asserted by counting, because "game.html has links now" is satisfied by one
  // broken anchor. It was exactly zero.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const links = (h.match(/href="/g) || []).length;
    assert.ok(links >= 3, `${f} offers ${links} links — a visitor who lands here is stuck`);
  }
});

test('every chrome link resolves to a page that exists', () => {
  // A nav link to a page we have not built is a 404 wearing a plan. This is what
  // stops the nav being extended ahead of its destinations.
  const have = new Set(PAGES);
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const chrome = h.match(/<header class="sitehdr">[\s\S]*?<\/header>/)[0]
                 + h.match(/<footer class="sitefoot">[\s\S]*?<\/footer>/)[0];
    for (const [, href] of chrome.matchAll(/href="([^"]+)"/g)) {
      // ANY SCHEME IS SOMEBODY ELSE'S NAMESPACE, not a path into this site.
      // It read `^https?:` and reported `mailto:…@gmail.com` as a missing page —
      // the check was right that it is not a file and wrong about what that
      // means. The address is asserted separately, by the test above that
      // requires one on every page and requires it to be spelt once.
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const path = href.split('#')[0].split('?')[0];
      if (path === '/' || path === '') continue;        // the front page
      assert.ok(have.has(path.replace(/^\//, '')), `${f} links to ${href}, which does not exist`);
    }
  }
});

test('THE CSP PINS EVERY INLINE BLOCK, not the first one it finds', () => {
  // THIS TEST EXISTS BECAUSE ADDING THE CHROME BROKE IT. `_csp` used re.search,
  // which silently assumed a document holds exactly one <style> and one
  // <script> — true of every page here until the shared chrome added a second
  // <style> in <head>. The policy then pinned the CHROME's 957 bytes and left
  // the page's own 14 KB stylesheet unhashed, and a real browser would have
  // refused it: the game page would have rendered completely unstyled.
  //
  // Nothing in the node suite could see that — the fake DOM has no CSS — and the
  // failure would have surfaced as "the site looks broken" after deploy. A
  // hash-pinned policy with a MISSING hash is the same failure as a stale one.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const csp = h.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/);
    if (!csp) continue;                       // only the two hash-pinned pages
    const pinned = new Set([...csp[1].matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map(m => m[1]));
    const blocks = [...h.matchAll(/<(style|script)[^>]*>([\s\S]*?)<\/\1>/g)];
    // AT LEAST THE CHROME CSS AND THE PAGE'S OWN. It read `>= 3` — chrome CSS,
    // page CSS, page script — which stopped being true when two sections of the
    // home page became pages of their own with nothing to run. The claim that
    // matters is not "three blocks exist", it is "every block present is
    // pinned", which the loop below asserts. `>= 2` keeps the guard against the
    // regex silently matching nothing.
    assert.ok(blocks.length >= 2, `${f} should carry chrome CSS and its own style`);
    for (const [, tag, body] of blocks) {
      const digest = createHash('sha256').update(body).digest('base64');
      assert.ok(pinned.has(digest),
        `${f}: a <${tag}> of ${body.length} bytes is not pinned by the CSP — the browser will refuse it`);
    }
  }
});

test('a page whose own policy forbids inline style carries none', () => {
  // THE DEFECT THIS CATCHES WAS LIVE, AND THE WHOLE SUITE WAS GREEN THROUGH IT.
  // `game.html` shipped thirteen `style=` attributes under a hash-pinned CSP.
  // Hashes cover <style> BLOCKS ONLY — there is no way to hash an attribute —
  // so `style-src 'sha256-…'` without `'unsafe-inline'` refuses every one of
  // them. The browser said so thirteen times in a console nobody was reading,
  // and the page rendered: the team swatches beside "More MIN games" computed to
  // rgba(0, 0, 0, 0), the control percentages lost their club colour, and the
  // verdict dot sat at the far left of its track on every game in the archive.
  //
  // Nothing in this suite could see it — the fake document has no CSS — and no
  // browser step could either, because both of them STRIP the policy in order to
  // frame the page. A defect can hide in the exact gap between two instruments.
  //
  // So the rule is read off the page rather than kept in a list here: if a
  // document names a `style-src` that does not permit inline, the document must
  // contain no inline style. Give another page a CSP and this starts holding it.
  // Static styling belongs in the stylesheet, dynamic styling goes through the
  // CSSOM (`el.style.x = y`), which no policy restricts.
  let checked = 0;
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const csp = h.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/);
    if (!csp) continue;
    const style = csp[1].match(/style-src-attr ([^;"]*)/) || csp[1].match(/style-src ([^;"]*)/);
    if (!style || style[1].includes("'unsafe-inline'")) continue;
    checked++;

    // `(?<![-\w])` so `font-style="italic"` on an SVG is not mistaken for one.
    const attrs = [...h.matchAll(/(?<![-\w])style\s*=\s*["'][^"']*["']/g)];
    assert.equal(attrs.length, 0,
      `${f}: ${attrs.length} inline style attribute(s) the browser will refuse — ` +
      `first is ${attrs[0] && attrs[0][0]}`);

    // The same refusal reached through a different door. `el.style.left = …` is
    // permitted; writing the whole attribute is the thing the policy stops.
    assert.doesNotMatch(h, /setAttribute\(\s*["']style["']/,
      `${f} sets a style attribute from script, which the policy refuses too`);
  }
  assert.ok(checked >= 2, `only ${checked} pages carry a restrictive style-src`);
});

test('the chrome CSS is INLINE, never a stylesheet the CSP would refuse', () => {
  // Promoted from a note in docs/site-chrome.md §12.4 at CHENG's suggestion: a
  // note is what gets violated the first time somebody wants to reuse it. The
  // CSP already makes this fail in a browser — which is after deploy.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    assert.doesNotMatch(h, /<link[^>]+rel="stylesheet"/i,
      `${f} links an external stylesheet, which default-src 'none' forbids`);
  }
});

test('NO NUMBER ON THIS SITE CAN BE TRUNCATED', () => {
  // CHENG, on the 360px screen neither reviewer can check: the drawn rate is a
  // dot on a track with a fraction beside it, and if something has to give at
  // narrow widths the track should go before the fraction does — because the
  // fraction is what carries the honesty. A rate without its denominator is the
  // thing this whole site teaches against.
  //
  // `text-overflow: ellipsis` is how that goes wrong silently: "1811 of 3957"
  // becomes "1811 of 39…" and still looks deliberate. Today no page uses it, so
  // this pins a property that already holds rather than repairing one that does
  // not — which is the cheapest moment to write a rule down.
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    assert.doesNotMatch(h, /text-overflow/i,
      `${f} can truncate text, and some of its text is measurements`);
  }
});

