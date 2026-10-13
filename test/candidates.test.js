/**
 * tools/candidates.mjs: every candidate is computed through the site's own
 * code, so the rows the card shows must equal the card's own figures, and a
 * share's two sides must partition their denominator.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { candidatesOf, venue } from '../tools/candidates.mjs';
import { measureGame } from '../builders/measure.mjs';
import { CLUB_ROWS } from '../src/lib/preview.js';

const G = JSON.parse(readFileSync(new URL('./fixtures/extracts/2025020501.json', import.meta.url), 'utf8'));
const c = candidatesOf(G).c;

test('the card’s three rows are the card’s own figures, not a second definition', () => {
  const m = measureGame(G);
  for (const r of CLUB_ROWS) {
    for (const s of ['h', 'a']) assert.deepEqual(c[r.key][s], r.ofGame(m, s), `${r.key} ${s}`);
  }
});

test('a share of both teams partitions its denominator', () => {
  for (const k of ['corsi5v5', 'fenwickShare', 'sogShareEvents', 'takeawayShare', 'giveawayShare']) {
    assert.equal(c[k].h.n, c[k].a.n, `${k}: the two sides count different totals`);
    assert.equal(c[k].h.count + c[k].a.count, c[k].h.n, `${k}: the two sides do not add up`);
  }
});

test('attempts for one side are attempts against the other', () => {
  assert.equal(c.attemptsForPerGame.h.count, c.attemptsAgainstPerGame.a.count);
  assert.equal(c.attemptDiffPerGame.h.count, -c.attemptDiffPerGame.a.count);
  assert.equal(c.attemptsForPerGame.h.count, measureGame(G).attempts.h);
});

test('the venue check reads the home club at home and the club on the road', () => {
  // Two building-seasons are too few for a correlation; the function answers null
  // rather than inventing one.
  const recs = [candidatesOf(G)];
  assert.equal(venue(recs, 'hitsPerGame', 'h'), null);
  assert.equal(venue(recs, 'hitsPerGame', 'a'), null);
});
