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

test('⛔ a page that embeds NHL video asks its reader for nothing', () => {
  /* ⭐⭐ THE RULE IS DERIVED FROM WHAT A PAGE CONTAINS, NEVER FROM A ROSTER.
     NHL terms permit embedded content and forbid it being used "for the purpose
     of gaining advertising, subscription, or other revenue, or for any commercial
     purpose". A donation link is not advertising, nothing is sold and the clip is
     not the draw — so this was never a violation on any reading. It was the one
     sentence a careful person could point at while a Brightcove player sat four
     blocks up the SAME page.

     ⚠️ AND THE FIRST FIX WAS TOO BROAD, WHICH KEVIN CAUGHT. I removed the tip jar
     from all fourteen pages; only TWO can ever show a clip. Kevin: "I think it's
     fair and reasonable to have the tip jar on the non-clip-capable pages." So the
     split is real, and a split that lives in somebody's head drifts the first time
     a page is added — this asks each ARTIFACT which kind it is.

     BOTH DIRECTIONS, because either alone is satisfied by a site-wide answer: a
     page with a player must make no ask, AND a page without one must still make
     it. The second half is what would catch the tip jar quietly disappearing
     everywhere again. */
  const ASK = /href="https:\/\/buymeacoffee\.com\//;
  const forbidden = /\b(subscribe|subscription|premium|pro plan|unlock|supporters? only|paywall(?!ed)|upgrade)\b/i;
  let embeds = 0, plain = 0;
  for (const f of PAGES) {
    const h = readFileSync(new URL(f, SRC), 'utf8');
    const foot = h.match(/<footer class="sitefoot">[\s\S]*?<\/footer>/)[0];
    const canPlay = h.includes('id="clipbox"');

    if (canPlay) {
      embeds++;
      assert.doesNotMatch(foot, ASK,
        `${f} embeds the league's video AND asks the reader for money`);
      assert.doesNotMatch(h, /\b(donate|donations?|tip jar|patreon|ko-?fi|buymeacoffee)\b/i,
        `${f} carries the ask somewhere outside its footer`);
    } else {
      plain++;
      assert.match(foot, ASK, `${f} shows no clip and has lost its tip jar`);
      // Kevin's own constraint on the framing, kept: it supports the work and
      // never sells access. The risk was never the link, it was an ask that
      // reads as BUYING something.
      assert.doesNotMatch(foot, forbidden,
        `${f} offers a tier or gated access — this must read as a tip, not a product`);
      assert.ok(foot.indexOf('Not affiliated') < foot.search(ASK),
        `${f} asks for money above its own disclaimer`);
    }
    // The disclaimer is load-bearing on every page of either kind.
    assert.match(h, /Not affiliated with/, `${f} lost its not-affiliated sentence`);
  }
  assert.ok(embeds >= 2, `only ${embeds} pages can play a clip — this has lost half its subject`);
  assert.ok(plain >= 10, `only ${plain} pages carry the tip jar — the removal went too wide again`);
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

test('⭐ BOTH ways into the archive are in the chrome, or neither is', () => {
  // C1 shipped the calendar with ONE entry point — a line under the chips on
  // the front door — and that ruling (docs/discovery.md §10.4) was about
  // whether the HOME PAGE should carry a second index. It was never about the
  // chrome, and the result was an asymmetry nobody chose: the team browse
  // reachable from every page and the date browse from none.
  //
  // THE ASSERTION IS THAT THEY MATCH, not that either one is present. Pinning
  // "the nav contains By date" is a test of today's answer; pinning that the
  // two siblings are treated alike is a test of the rule, and it fails whether
  // someone removes the date entry or the team one.
  for (const file of PAGES) {
    const html = readFileSync(new URL(file, SRC), 'utf8');
    const header = (html.match(/<header class="sitehdr">([\s\S]*?)<\/header>/) || [])[1];
    assert.ok(header, `${file} has no site header`);
    // The game pages carry MINIMAL chrome by ruling — one link, "What is this?"
    // — so they are exempt from carrying either, and the exemption is read off
    // the header rather than from a list of filenames.
    if (!/href="\/#teams"/.test(header) && !/href="\/calendar\.html"/.test(header)) continue;
    assert.match(header, /href="\/#teams"/, `${file} offers a date browse and no team browse`);
    assert.match(header, /href="\/calendar\.html"/, `${file} offers a team browse and no date browse`);
  }
});

test('the date browse is called the same thing everywhere it is offered', () => {
  // A third name for one destination is how a reader stops believing two links
  // go to the same place. The front door says "Or browse by date"; the nav says
  // "By date"; the page's own h1 says "Every night in the archive".
  const home = readFileSync(new URL('index.html', SRC), 'utf8');
  assert.match(home, /<a href="calendar\.html">Or browse by date/);
  assert.match(home, /<a href="\/calendar\.html"[^>]*>By date<\/a>/);
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
    /* ⛔ EVERY PAGE, AND THIS USED TO BE `if (!csp) continue`.
       The skip was commented "only the two hash-pinned pages", which was three
       weeks stale — eleven were pinned — and worse, it was a hole shaped exactly
       like the pages that fell into it. `read-the-game.html` (743 KB, HTTP 200
       live), `goalie-eye-view.html` and `terrain-3d.html` shipped with NO policy
       at all and this loop said nothing, because a page with no CSP had no
       assertion to fail. A page that LOST its policy in a refactor would have
       passed the same way. Found by checking the live site, not by this test.
       All three are pinned now, so the skip becomes the claim. */
    assert.ok(csp, `${f} ships with no Content-Security-Policy — `
      + 'every page this site deploys carries one, and a page that lost it '
      + 'would otherwise pass this check by having nothing to assert');
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


test('⛔ the CSP permits exactly the origin the renderer embeds, and no more', () => {
  /* ⚠️ THE GAP THIS CLOSES WAS PROVEN, NOT IMAGINED. Deleting
     `https://players.brightcove.net` from `frame-src` breaks the goal highlight
     completely — the section renders, the reader presses, the browser refuses the
     frame and a black box is the whole experience — and the entire suite stayed
     GREEN through it. The fake document has no CSP, so no unit test can see one;
     this is the only place the two halves can be compared.

     ⭐ THE EXPECTED ORIGIN IS DERIVED FROM `app.js`, NEVER TYPED HERE. A literal
     would pass the day the player moved and the policy did not — the mirror this
     project has killed four checks for. So the renderer's own URL is parsed and
     the policy is asked to name its origin: move either one and they must move
     together.

     ⛔ AND THE OTHER DIRECTION, which is the half that keeps a security policy a
     policy. `frame-src` must not have been widened past what the code uses — no
     bare `https:`, no wildcard — or a later "just let frames through" would be
     invisible here while satisfying everything above. */
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const embed = /https:\/\/players\.[A-Za-z0-9.-]+/.exec(src);
  assert.ok(embed, 'the renderer no longer embeds a player — if the highlight was '
    + 'removed, remove this check with it rather than leaving it pointing at nothing');
  const origin = embed[0];

  const pages = readdirSync(new URL('../src/', import.meta.url)).filter(f => f.endsWith('.html'));
  let checked = 0;
  for (const f of pages) {
    const h = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    const csp = h.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/);
    if (!csp) continue;
    const frame = /frame-src ([^;"]*)/.exec(csp[1]);
    assert.ok(frame, `${f}: the policy has no frame-src at all, so 'none' applies `
      + 'and the page cannot frame even its own preview');
    checked++;

    assert.ok(frame[1].includes(origin),
      `${f}: the renderer embeds ${origin} and frame-src does not permit it — `
      + `pressing the highlight loads nothing. frame-src is: ${frame[1].trim()}`);
    assert.ok(!/\bhttps:(?!\/\/)|\*/.test(frame[1]),
      `${f}: frame-src has been widened to a wildcard (${frame[1].trim()}), which `
      + 'permits every origin on the web to be framed by this page');
  }
  assert.ok(checked >= 2, `only ${checked} pages carry a policy — this has lost its subject`);
});
