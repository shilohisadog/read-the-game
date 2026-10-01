/**
 * The per-game unfurl — `functions/_middleware.js`.
 *
 * ⚠️ WHAT THIS FILE CAN AND CANNOT PROVE, SAID OUT LOUD. `HTMLRewriter` is a
 * Cloudflare runtime global; node has no such thing, so the rewriting itself
 * cannot be executed here and this suite does not pretend to. What IS testable is
 * everything the rewriting depends on — which requests it fires for, what the
 * tags say, and the refusals — and those are the parts a mutation can break
 * silently.
 *
 * ⛔ THE UNTESTABLE HALF IS NOT LEFT UNCHECKED, IT IS CHECKED SOMEWHERE ELSE.
 * `deploy.yml` fetches the injected path on the CANDIDATE deployment before
 * production ships and asserts the title names the two clubs. That step is also
 * the only thing that can prove `functions/` is picked up at all when the deploy
 * command is `wrangler pages deploy src` — a placement question no unit test can
 * answer and the one most likely to be wrong.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { targetGame, tagsFor, dayOf } from '../functions/_middleware.js';

const G = (o = {}) => ({ away: 'BOS', home: 'WSH', date: '2026-09-25',
  preseason: false, played: false, ...o });

/* ------------------------------------------------------- WHICH PATHS IT TOUCHES */

test('⛔⛔ it fires for TWO paths with a game, and for NOTHING else', () => {
  /* THE CLAIM THE DEPLOY GATE DEPENDS ON. That gate compares every page's
     published bytes to its committed bytes and fetches each page with NO QUERY
     STRING, so if this predicate ever widened past `?game=`, the gate would start
     failing on pages nobody touched — or worse, would be weakened to accommodate
     it. The set of paths grew on 2026-10-02; the shape of the claim did not.
     MUTATION: drop the pathname test and the index/calendar cases fire; drop the
     `game=` test and the two bare-page cases do. */
  const U = 'https://readthegame.co';
  assert.deepEqual(targetGame(`${U}/preview.html?game=2026010049`, 'text/html'),
    { id: 2026010049, page: 'preview' });
  assert.deepEqual(targetGame(`${U}/preview?game=2026010049`, 'text/html'),
    { id: 2026010049, page: 'preview' },
    'Pages serves the extensionless route, and a pasted link can be either');
  assert.deepEqual(targetGame(`${U}/game.html?game=2026010049`, 'text/html'),
    { id: 2026010049, page: 'replay' },
    'the replay page is the one a reader actually posts, and it unfurled generically for months');
  assert.deepEqual(targetGame(`${U}/game?game=2026010049`, 'text/html'),
    { id: 2026010049, page: 'replay' });

  // the byte-diff gate's own requests — neither of these may be rewritten
  assert.equal(targetGame(`${U}/preview.html`, 'text/html'), null);
  assert.equal(targetGame(`${U}/game.html`, 'text/html'), null);
  assert.equal(targetGame(`${U}/index.html?game=2026010049`, 'text/html'), null);
  assert.equal(targetGame(`${U}/calendar.html?game=2026010049`, 'text/html'), null);
  assert.equal(targetGame(`${U}/read-the-game.html?game=2026010049`, 'text/html'), null,
    'the self-contained page carries its own game and must not be rewritten for another');
  assert.equal(targetGame(`${U}/`, 'text/html'), null);

  /* ⛔ AND THE TWO PAGES ARE TOLD APART, not merely both accepted. A table that
     returned the same answer for both would unfurl the replay with the preview's
     words — which promise a forecast the replay does not carry. */
  assert.notEqual(targetGame(`${U}/preview?game=1`, 'text/html').page,
    targetGame(`${U}/game?game=1`, 'text/html').page);
});

test('⛔ a non-HTML response is never rewritten, whatever the path says', () => {
  // An asset served from this path with a JSON or image type is not a document,
  // and running a rewriter over it would corrupt it rather than fail loudly.
  const U = 'https://readthegame.co/preview.html?game=2026010049';
  assert.equal(targetGame(U, 'application/json'), null);
  assert.equal(targetGame(U, 'image/png'), null);
  assert.equal(targetGame(U, ''), null);
  assert.equal(targetGame(U, null), null);
  assert.deepEqual(targetGame(U, 'text/html; charset=utf-8'), { id: 2026010049, page: 'preview' },
    'the real header still works');
});

test('⛔ a junk game id is a pass-through, not a crash and not a guess', () => {
  const U = 'https://readthegame.co/preview.html';
  for (const q of ['', '?game=', '?game=abc', '?game=0', '?game=-5', '?game=NaN']) {
    assert.equal(targetGame(U + q, 'text/html'), null, `"${q}" was accepted`);
  }
});

/* --------------------------------------------------------------- WHAT IT SAYS */

test('⭐ the tags name both clubs in full, from the same table the page uses', () => {
  /* MUTATION: type the club names into the middleware and this still passes —
     which is why the next assertion reads the shared table instead. */
  const t = tagsFor(G(), 'https://readthegame.co/preview?game=1');
  assert.equal(t.title, 'Boston Bruins at Washington Capitals — what to watch for');
  assert.match(t.description, /25 September 2026/);
  assert.equal(t.url, 'https://readthegame.co/preview?game=1');
});

test('⛔ the names come from src/lib/teams.js, not from a second table at the edge', () => {
  /* A club table written into the edge handler is free to drift from the one the
     page renders, which is this repo's most-repeated shape of defect. The check
     is mechanical: the middleware may not contain a club's full name as a
     literal. MUTATION: inline `'Boston Bruins'` and this fires. */
  const src = readFileSync(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
  assert.match(src, /from '\.\.\/src\/lib\/teams\.js'/, 'it must import the table');
  /* ⚠️ COMMENTS ARE STRIPPED FIRST, AND THE FIRST DRAFT OF THIS CHECK WAS NOT.
     It failed on the middleware's own comment — the one that says typing a club
     name here would be a second table — which is a guard finding the prose that
     explains it rather than the code it is about. Same shape as the scan that
     found `var when` inside the comment describing its removal. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(code.includes('nameOf('), 'the import must actually be USED, not just present');
  for (const name of ['Boston Bruins', 'Washington Capitals', 'Maple Leafs', 'Canadiens']) {
    assert.ok(!code.includes(name), `"${name}" is typed into the middleware`);
  }
});

test('⛔⛔ the unfurl promises no video and forecasts nothing', () => {
  /* Pre-render metadata is read BEFORE the page exists, so nothing beside it can
     explain that this is a replay of a game already played and that we hold no
     footage. `test/shell.test.js` holds this for the built pages; the middleware
     writes the same fields at the edge and is outside that file's reach, so the
     rule is restated here against the strings this one produces. */
  for (const g of [G(), G({ preseason: true }), G({ played: true }), G({ date: null })]) {
    const t = tagsFor(g, 'u');
    const said = t.title + ' ' + t.description;
    assert.ok(!/\b(stream|highlights|full game|watch the game|live)\b/i.test(said), said);
    assert.ok(!/\b(will win|favourite|favorite|predict|projected|odds|expected to)\b/i.test(said), said);
  }
});

test('preseason and a played game are each said, and neither invents the other', () => {
  assert.match(tagsFor(G({ preseason: true }), 'u').description, /^Preseason · 25 September 2026\./);
  assert.match(tagsFor(G({ played: true }), 'u').description, /^played 25 September 2026\./);
  const plain = tagsFor(G(), 'u').description;
  assert.ok(!/Preseason/.test(plain) && !/played/.test(plain), plain);
});

test('⚠️ a fixture with no league date loses the day and keeps the rest', () => {
  /* The same degradation the front door makes. A crawler in a datacentre and a
     reader in an unknown timezone cannot be given a clock face, so the unfurl
     names the DAY from the league's own date field or says nothing about when.
     MUTATION: fall back to `startTimeUTC` and a 03:30Z game unfurls a day late. */
  assert.equal(dayOf({ date: null }), null);
  assert.equal(dayOf({ date: '2026-9-5' }), null, 'a malformed date is not parsed leniently');
  const t = tagsFor(G({ date: null }), 'u');
  assert.ok(!/September/.test(t.description), t.description);
  assert.match(t.title, /Boston Bruins at Washington Capitals/, 'the clubs still name the card');
});

/* ------------------------------------------------- AND THE REPLAY PAGE'S OWN TAGS */

/**
 * ⭐ THE REPLAY IS THE PAGE PEOPLE POST — built 2026-10-02, and it is the larger
 * half of this feature by a long way. `/preview` is a page a reader may never
 * open; `/game` is the one they have just watched, and all 4,559 of them unfurled
 * as *"An NHL game, replayed event by event."*
 */
test('⭐ the replay names its two clubs and the night it was played', () => {
  const t = tagsFor(G({ played: true }), 'u', 'replay');
  assert.equal(t.title, 'Boston Bruins at Washington Capitals — 25 September 2026');
  /* AND IT IS NOT THE PREVIEW'S SENTENCE. The preview promises what each club does
     more than the league; the replay holds one game's events. One `tagsFor`
     returning one string for both would have been the cheap version of this. */
  assert.notEqual(t.description, tagsFor(G({ played: true }), 'u').description);
  assert.doesNotMatch(t.description, /what each club does|normal in hockey/i,
    'the replay is unfurling with the preview page\'s promises');
});

/**
 * ⛔⛔ AND IT MAY NOT SPOIL THE GAME, which is the rule that outranks every other
 * wording question here. The verdict card is hidden behind `.ended` and the third
 * door is hidden with it because *"a button reading 'What this game was' is a
 * spoiler on a replay the reader is still watching"* — a share card is read
 * BEFORE the page, by someone who has not chosen to see anything at all.
 *
 * ⭐ THE CHECK IS THAT NO FIGURE SURVIVES, not that a particular phrase is absent.
 * A banned-word list over an open vocabulary is the gate `whistle.js` refuses in
 * its own header; a digit is mechanical, and the only numbers a game legitimately
 * puts in an unfurl are its date.
 */
test('⛔⛔ the replay unfurl carries no result, and no figure but the date', () => {
  for (const g of [G({ played: true }), G({ played: true, preseason: true })]) {
    const t = tagsFor(g, 'u', 'replay');
    assert.doesNotMatch(t.description, /\d/,
      `a figure reached the replay's description, which is read before the page: ${t.description}`);
    /* The title carries the day and nothing else numeric: strip the date and no
       digit may remain, so a score added beside it goes red. */
    assert.doesNotMatch(t.title.replace(/\d+ [A-Z][a-z]+ \d{4}/, ''), /\d/,
      `a figure reached the replay's title beside its date: ${t.title}`);
    const said = `${t.title} ${t.description}`;
    assert.ok(!/\b(won|lost|beat|defeated|shutout|final score)\b/i.test(said), said);
    /* The preview's two standing refusals hold here too. */
    assert.ok(!/\b(stream|highlights|full game|watch the game|live)\b/i.test(said), said);
    assert.ok(!/\b(will win|favourite|favorite|predict|projected|odds|expected to)\b/i.test(said), said);
  }
});

/**
 * ⛔ A GAME THAT HAS NOT BEEN PLAYED HAS NO REPLAY, so the generic document stands.
 * ⭐ AND THE PAIRED HALF IS WHAT MAKES THIS A RULE RATHER THAN A SILENCE: the same
 * fixture on the PREVIEW path must still unfurl, because that page is built for
 * exactly this game. A refusal keyed to the game instead of the page would have
 * passed the first assertion and quietly broken the feature that already shipped.
 */
test('⛔ an unplayed game gets no replay tags, and the preview still gets its own', () => {
  assert.equal(tagsFor(G({ played: false }), 'u', 'replay'), null,
    'the replay page advertised a game whose extract does not exist yet');
  const p = tagsFor(G({ played: false }), 'u');
  assert.ok(p && /what to watch for/.test(p.title),
    'the fixture lost the preview unfurl that was built for it');
  /* AND THE DEFAULT IS THE PREVIEW, so an un-passed `page` cannot silently become
     the replay's rules on the path that shipped first. */
  assert.deepEqual(tagsFor(G({ played: false }), 'u'), tagsFor(G({ played: false }), 'u', 'preview'));
});

/**
 * ⚠️ A PLAYED GAME WITH NO LEAGUE DATE KEEPS ITS CLUBS. The same degradation the
 * preview makes, asserted here because the replay's title is BUILT from the day
 * rather than appending it — so a null date is a different code path, not the
 * same one with an empty string in it.
 */
test('⚠️ the replay title survives a game the league gave no date', () => {
  const t = tagsFor(G({ played: true, date: null }), 'u', 'replay');
  assert.equal(t.title, 'Boston Bruins at Washington Capitals');
  assert.doesNotMatch(t.title, /—|undefined|null/, t.title);
});
