/**
 * ⛔⛔⛔ THE SITE SAYS "TEAM". IT NEVER SAYS "CLUB".
 *
 * Kevin, 2026-10-03: *"it just dawned on me, I think the description should be
 * 'team-seasons' and not 'club-seasons' (and all other similar phrases), I don't
 * think the hockey world uses the term 'club'."*
 *
 * ⭐⭐ AND THE SITE WAS ALREADY DISAGREEING WITH ITSELF ABOUT IT. The methods page
 * has explained a "team-season" since Kevin asked for that wording — *"we should
 * be crystal clear about what 'team-seasons' are, e.g. there are 32 teams and we
 * hold 3 seasons of data, hence 32 x 3 = 96"* — while the preview card, which is
 * the door into that page, said "club-seasons" one click earlier. One quantity,
 * two words, two surfaces, and nothing could see it: a vocabulary is exactly the
 * kind of claim that rots in opposite directions in two places at once, which
 * this repo has logged before and had no gate for.
 *
 * ⚠️ IT READS WHAT A READER SEES, WHICH IS WHY IT IS A SEPARATE FILE. The only
 * previous rule of this shape (`methods.test.js`, *the page is written for a
 * hockey fan, not for us*) covers ONE page, because it was written the day Kevin
 * stopped reading that one page. A word banned on one surface and printed on the
 * one that links to it is not banned.
 *
 * ⛔ THE SCANNER IS `tools/jslex.mjs` AND THAT IS LOAD-BEARING. Every file this
 * sweeps carries comments ABOUT the word — including this repo's write-ups of why
 * it went — and a regex over source text reports those as violations. That is the
 * monitor-armed-against-itself defect, now logged four times here. The lexer drops
 * comments by construction, so the question cannot be asked of one.
 *
 * ⚠️ IDENTIFIERS ARE OUT OF SCOPE AND THAT IS A DECISION, NOT AN OVERSIGHT.
 * `CLUB_ROWS`, `clubSeasons` and the published `clubRange` field are names a
 * reader never meets; renaming the published ones would mean reissuing
 * `measures.json`, which is a different job with a different risk. What stops
 * them leaking onto a page is this check, which reads the page.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { readerText } from '../tools/jslex.mjs';

const SRC = new URL('../src/', import.meta.url);
const PAGES = readdirSync(SRC).filter(f => f.endsWith('.html')).sort();

/* ⭐ `readerText` MOVED TO `tools/jslex.mjs` ON 2026-10-09, when the front
   door's *speaks no analyst* gate needed the same extraction. It was private
   here; a second copy would be one function in two spellings, and the first
   time one learned about a new way prose reaches a page the other would quietly
   stop seeing it. Its header carries why the lexer is load-bearing. */

test('⛔⛔⛔ no page calls a team a club', () => {
  /* MUTATION: put `club` back into any rendered sentence — a `says` line, a
     layer caption, the footer disclaimer — and this fires naming the page and
     quoting the phrase. */
  const WORD = /\bclubs?\b|\bclub-(?:season|game)s?\b/i;
  assert.ok(PAGES.length >= 10, `only ${PAGES.length} built pages — nothing to sweep`);
  const bad = [];
  let scanned = 0;
  for (const f of PAGES) {
    const text = readerText(readFileSync(new URL(f, SRC), 'utf8'));
    /* ⛔ THE EXTRACTION MUST HAVE FOUND PROSE, AND PER PAGE. A lexer change, a
       build that stops inlining, a renamed directory — any of those turns this
       into a check that passes on an empty corpus, which is the shape
       `prose-constants` and the `sed`-that-read-nothing both paid for. The floor
       is PER PAGE because a total would stay comfortably green while one small
       page went silent, and the small pages are the ones with nothing but a
       footer to lose. Measured 2026-10-03: the smallest is icing.html at 1,350
       and the whole corpus is 227,195. */
    assert.ok(text.length > 800,
      `${f} yielded ${text.length} characters of reader text — the sweep is not `
      + 'reaching that page, so it is exempt from this rule without saying so');
    scanned += text.length;
    for (const line of text.split('\n')) {
      const hit = line.match(WORD);
      if (hit) bad.push(`${f}: …${line.trim().slice(0, 100)}…`);
    }
  }
  assert.ok(scanned > 150_000,
    `only ${scanned} characters of reader text across ${PAGES.length} pages`);
  assert.deepEqual(bad, [], 'these pages speak a word the hockey world does not:\n  '
    + bad.join('\n  '));
});

test('⭐ the one quantity Kevin named is spelled the same on both surfaces', () => {
  /* ⛔ NOT A SECOND BANNED-WORD CHECK. The rule above says what we do not print;
     this says what we DO, because a page that deleted the sentence rather than
     rewording it would satisfy the rule above in silence. The preview card is
     the door and the methods page is what lies through it, so the words a reader
     carries from one to the other have to be the same words. */
  const card = readerText(readFileSync(new URL('preview.html', SRC), 'utf8'));
  const page = readerText(readFileSync(new URL('how-we-measure.html', SRC), 'utf8'));
  for (const [where, text] of [['the preview card', card], ['the methods page', page]])
    assert.match(text, /team-seasons/,
      `${where} no longer names a team-season, so the two surfaces can drift apart `
      + 'again without anything noticing');
});
