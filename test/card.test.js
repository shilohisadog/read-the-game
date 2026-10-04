/**
 * THE SHARING CARD — the one picture a stranger sees before they see anything
 *
 * ⭐⭐⭐ WHY IT EXISTS. Kevin, 2026-10-04, about to post the first public link to
 * this site: *"I was thinking of pasting the following link … onto X.com, what do
 * you think?"* The unfurl was correct, game-specific and spoiled no result — and
 * carried no image at all. A site whose whole argument is a picture, arriving in
 * public as a paragraph.
 *
 * ⚠️ WHAT THIS FILE CAN AND CANNOT SEE. It reads the ARTWORK (a pure function
 * returning SVG) and the SHIPPED FILE (a PNG, through enough of the format to
 * ask its size and its provenance stamp). **It cannot tell you the card looks
 * right** — that it is balanced, that nothing overlaps, that the type is legible
 * at the width a timeline renders it. Two of the three defects the first renders
 * had were exactly that kind, and both were found by LOOKING at the PNG:
 * the rink ran behind the footer type, and the ice carried blue-line bands the
 * product only draws under a layer. `docs/looking-at-pixels.md`'s division, on a
 * surface where it bites hardest, because nobody on the team ever opens this
 * file — it is for strangers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ALT, HEIGHT, HREF, PNG, STAMP, WIDTH,
  cardSvg, chunks, crc32, judgeCard, pngSize, pngText, sourceHash, withText,
} from '../tools/card.mjs';

const SRC = new URL('../src/', import.meta.url);
const pages = ['index.html', 'game.html', 'read-the-game.html', 'calendar.html', 'preview.html'];
const read = f => readFileSync(new URL(f, SRC), 'utf8');

test('⭐⭐⭐ the shipped card is a PNG of the size the markup promises', () => {
  /* ⛔ A PLATFORM TOLD ONE SIZE AND SERVED ANOTHER CROPS THE OTHER ONE, and the
     crop is the part with the wordmark in it. MUTATION: change WIDTH without
     re-rendering and this fires. */
  const buf = readFileSync(PNG);
  assert.deepEqual(judgeCard(buf), [], 'the shipped card does not pass its own judgement');
  assert.deepEqual(pngSize(buf), { w: WIDTH, h: HEIGHT });
});

test('⛔⛔ and it was made from the artwork that is in the repo now', () => {
  /* ⭐ THE FILE CARRIES ITS OWN PROVENANCE. `tools/card.mjs` is not part of
     `npm run build` — a rasteriser is not byte-identical across machines, so the
     PNG is a committed asset regenerated deliberately. The failure mode that
     creates is a card that no longer matches the artwork beside it, and nothing
     else in the repo would ever notice: nobody on the team looks at this file.
     So the PNG stores the hash of the SVG it was rendered from, and this is the
     check that the two still agree. */
  const made = pngText(readFileSync(PNG), STAMP);
  assert.ok(made, 'the card carries no provenance stamp at all');
  assert.equal(made, sourceHash(),
    'the card was rendered from different artwork than `cardSvg()` now produces — '
    + 'run `node tools/card.mjs`');
});

test('⛔ the judgement refuses every way this can be wrong', () => {
  /* Pushed at with files this test invents, so the rule can be checked without a
     browser and without the real card being the only case it has ever seen. */
  const real = readFileSync(PNG);
  assert.match(judgeCard(null)[0], /no card at src\/card\.png/);
  assert.match(judgeCard(Buffer.from('not a png at all'))[0], /is not a PNG/);
  /* A card of the wrong size, built by rewriting IHDR rather than by describing
     one — so the reader is exercised, not just the branch. */
  const wrong = Buffer.from(real);
  wrong.writeUInt32BE(800, chunks(real).length && 16);
  assert.ok(judgeCard(wrong).some(m => /declares 1200x630/.test(m)),
    'a card of the wrong size passed');
  /* ⛔ THE BLANK. A 1200x630 of nothing is a valid PNG of a few hundred bytes,
     which is what a failed font load or a mistimed shutter produces. */
  const tiny = Buffer.concat([real.subarray(0, 60), real.subarray(real.length - 12)]);
  assert.ok(judgeCard(tiny).some(m => /not a drawing/.test(m)), 'a blank card passed');
  /* AND A CARD FROM OLDER ARTWORK. */
  assert.ok(judgeCard(real, 'deadbeefdeadbeef').some(m => /not the picture in the repo/.test(m)),
    'a stale card passed');
});

test('⭐ the PNG reader and writer are each other\'s check', () => {
  /* ⚠️ NEITHER DIRECTION PROVES THE OTHER ALONE: a writer and a reader that
     share one wrong idea of the format agree perfectly. So the CRC is checked
     against a value computed independently of both — `crc32` of the empty buffer
     and of "123456789" are the two published test vectors for this polynomial. */
  assert.equal(crc32(Buffer.alloc(0)), 0);
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  const buf = withText(readFileSync(PNG), 'rtg-test', 'hello');
  assert.equal(pngText(buf, 'rtg-test'), 'hello');
  assert.equal(pngText(buf, STAMP), sourceHash(), 'adding a chunk lost the one already there');
  assert.deepEqual(pngSize(buf), { w: WIDTH, h: HEIGHT }, 'adding a chunk broke the header');
  assert.equal(chunks(buf)[chunks(buf).length - 1].type, 'IEND', 'IEND is no longer last');
  assert.deepEqual(chunks(Buffer.from('nope')), []);
});

test('⭐⭐ the card draws the ice the SITE draws, not a picture of it', () => {
  const svg = cardSvg();
  /* ⛔ THE BLUE-LINE BANDS ARE THE CASE THIS EXISTS FOR. `furniture(id, true)`
     paints them and `#rg .zoneband{display:none}` means the base ice does not —
     they appear only under the Zone starts layer. The first render of this card
     advertised a rink the site does not show until a reader turns something on.
     A second surface describing the first and disagreeing with it. */
  assert.doesNotMatch(svg, /zoneband/,
    'the card paints the blue-line bands, which the base ice does not draw');
  assert.match(svg, /class="slotzone"/, 'the card lost the slot, which is the one thing it is for');
  assert.match(svg, /class="boards"/, 'the card has no rink on it');
  /* ⛔⛔ AND NO MARKS ON THE ICE. The card sits beside a title naming ONE game,
     so any scatter of dots is read as that game's chart — by every link on the
     site, about games the picture knows nothing of. Inventing the positions
     would break the promise the card itself prints. */
  assert.doesNotMatch(svg, /class="ev |class="att|class="goal/,
    'the card draws shot marks, which a reader will take for the linked game');
  /* ⭐ THE SLOT IS PAINTED AT THE WEIGHT THE PRODUCT PAINTS IT. A poster that
     renders our own measurement more strongly than the site does is the site
     misrepresented in the one picture a stranger sees first. */
  const app = read('app.css');
  const want = /#rg \.slotzone\{[^}]*opacity:([\d.]+)/.exec(app);
  assert.ok(want, 'app.css no longer sets the slot opacity, so this compares nothing');
  assert.match(svg, new RegExp(`\\.slotzone\\{[^}]*opacity:${want[1].replace('.', '\\.')}\\}`),
    `the card paints the slot at a different opacity from the ice (${want[1]})`);
});

test('⛔ and it carries no club mark, which is the whole reason it may exist', () => {
  /* The constraint `builders/page.py` recorded for years as the reason there was
     no card at all: club marks are off the table by design. The card is allowed
     precisely because every line in it is ours — so that is asserted rather than
     assumed. `--home` and `--away` are the per-game sweater colours; the card
     must not reach for either. */
  const svg = cardSvg();
  assert.doesNotMatch(svg, /--home|--away|var\(--/,
    'the card reads a club colour, which changes per game and is not ours to ship');
  /* ⚠️ `url(` ALONE IS TOO WIDE, which the first run of this test proved by going
     red on a correct card: `furniture()` clips the slot lozenge with
     `clip-path="url(#cardslotband)"`, an INTERNAL reference to a shape defined
     four characters away. What must not appear is a reference that LEAVES the
     file. */
  assert.doesNotMatch(svg, /<image\b|xlink:href|url\((?!#)/,
    'the card pulls in an external asset');
  assert.match(svg, /url\(#card/, 'the slot is no longer clipped, so this check lost its subject');
});

test('⭐⭐⭐ every shareable page offers the card, at the size the file really is', () => {
  /* ⛔ `summary` IS A THUMBNAIL BESIDE TWO LINES OF TYPE. `summary_large_image`
     is the image, and a rink is legible only at that size — which is the entire
     reason this was built. MUTATION: put `summary` back and this fires on every
     page. */
  for (const f of pages) {
    const html = read(f);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/,
      `${f} still offers the small card, so the picture is a thumbnail`);
    for (const tag of ['og:image', 'twitter:image']) {
      const m = new RegExp(`<meta (?:property|name)="${tag}" content="([^"]*)"`).exec(html);
      assert.ok(m, `${f} has no ${tag}`);
      assert.equal(m[1], HREF, `${f}'s ${tag} points somewhere else`);
      /* ⛔ ABSOLUTE, ALWAYS. A crawler resolves these against nothing a relative
         path can rely on, and a card that 404s for the crawler is a card that
         does not exist — which looks exactly like having none. */
      assert.match(m[1], /^https:\/\//, `${f}'s ${tag} is not an absolute https URL`);
    }
    assert.match(html, new RegExp(`<meta property="og:image:width" content="${WIDTH}">`),
      `${f} declares a width the file does not have`);
    assert.match(html, new RegExp(`<meta property="og:image:height" content="${HEIGHT}">`),
      `${f} declares a height the file does not have`);
  }
});

test('⛔ the alt text describes the picture that is actually drawn', () => {
  /* ⚠️ ALT TEXT IS THE COPY NOBODY LOOKS AT, SO IT IS THE COPY THAT GOES STALE —
     and it did, for one render: it named "the zones either side of each blue
     line" while the artwork beside it had just stopped painting them. */
  assert.doesNotMatch(ALT, /blue line|zones either side/i,
    'the alt text describes the blue-line bands, which the card does not draw');
  assert.match(ALT, /slot/i, 'the alt text does not mention the one region the card shades');
  assert.match(ALT, /rink/i, 'the alt text does not say what the picture is');
  for (const f of pages) {
    const m = /<meta property="og:image:alt" content="([^"]*)"/.exec(read(f));
    assert.ok(m, `${f} ships the card with no alt text`);
    assert.equal(m[1], ALT, `${f}'s alt text is a second copy and has drifted`);
  }
});
