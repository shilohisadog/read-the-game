/**
 * ⭐⭐ THE THREE SENTENCES THE PAGE SAYS ABOUT ITS OWN STATE.
 *
 * Each is a claim a reader is invited to check, which is this project's entire
 * product — and until 2026-09-04 none could be tested without booting a page and
 * reading a DOM node, because all three were inline in `render`.
 *
 * ⭐ AND THE EXTRACTION BOUGHT SOMETHING THE GOLDEN CANNOT. `iceNote` has three
 * outcomes: away pulled, home pulled, both pulled. The reference game contains
 * exactly one of them — twenty events at `0651`, the away goaltender out — so the
 * rendered walk covers a third of the function and no fixture we own could cover
 * the rest. **A function you can call takes any argument; a page you must boot
 * takes only the game it was given.** That is the concrete answer to what
 * decomposition is for, and it is smaller and more defensible than "the comments
 * become checks".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iceNote, situationsNote, trailsNote } from '../src/lib/notes.js';

const G = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));

test('⭐ the away goaltender out — the only case this game contains', () => {
  const real = [...new Set(G.events.filter(e => e.sit).map(e => e.sit))]
    .filter(s => s[0] === '0' || s[3] === '0');
  assert.deepEqual(real, ['0651'],
    'the reference game now contains a pulled-goalie code this test does not know about');
  assert.match(iceNote('0651', 'MIN', 'BUF'), /^MIN has pulled the goaltender/);
  assert.doesNotMatch(iceNote('0651', 'MIN', 'BUF'), /BUF has pulled/);
});

test('⛔ …and the two cases no game in the archive has ever given us', () => {
  /* `sit` is [awayGoalie][awaySkaters][homeSkaters][homeGoalie]. The home half is
     the mirror of the away half and had never been rendered by anything. */
  assert.match(iceNote('1560', 'MIN', 'BUF'), /^BUF has pulled the goaltender/);
  assert.doesNotMatch(iceNote('1560', 'MIN', 'BUF'), /MIN has pulled/);

  /* Both nets empty at once is legal, rare, and absent from our data. The code
     handles it by MAPPING rather than branching, precisely so there is no
     has/have ternary that no game could exercise — so the sentence is two
     sentences, and that is worth pinning rather than assuming. */
  const both = iceNote('0550', 'MIN', 'BUF');
  assert.match(both, /MIN has pulled/);
  assert.match(both, /BUF has pulled/);
  assert.equal((both.match(/has pulled/g) || []).length, 2);
});

test('⛔ silence when no goaltender is out, and when the feed says nothing', () => {
  /* ⭐ A MISSING CODE IS NOT EVIDENCE OF AN EMPTY NET, which is the same rule
     `drawNetmen` draws by. Inventing a note from absent data is exactly the
     claim this site refuses to make. */
  assert.equal(iceNote('1551', 'MIN', 'BUF'), '');
  assert.equal(iceNote(null, 'MIN', 'BUF'), '');
  assert.equal(iceNote(undefined, 'MIN', 'BUF'), '');
  assert.equal(iceNote('', 'MIN', 'BUF'), '');
});

test('⭐ and it says where the empty net came from', () => {
  /* DOCTRINE, not decoration: the page states that an empty net is the feed's own
     situation code rather than something we inferred. Losing that sentence would
     leave a claim about the ice with no provenance. */
  assert.match(iceNote('0651', 'MIN', 'BUF'), /the feed’s own situation code, never a guess/);
});

test('⭐⭐ the strength control describes the OTHER choice when it is off', () => {
  /* THE ASYMMETRY IS THE POINT AND IT WAS ONCE THE BUG. Both controls used to say
     nothing until they had already been used, so "Even strength only" described
     itself only once you were in it. A sentence belongs beside the thing it is
     about at the moment of use — right for a caption, wrong for a CONTROL,
     because a button has to be predictable before the click or it is a dare. */
  const off = situationsNote(false, 0);
  assert.match(off, /Even strength only drops/, 'the off state no longer says what pressing it does');
  assert.doesNotMatch(off, /dropped out so far/, 'the off state is reporting a live count');

  const on = situationsNote(true, 3);
  assert.match(on, /^3 attempts have dropped out so far/, 'the on state lost its live count');
});

test('⭐ …and it counts in English', () => {
  assert.match(situationsNote(true, 1), /^1 attempt has dropped/);
  assert.match(situationsNote(true, 2), /^2 attempts have dropped/);
  assert.match(situationsNote(true, 0), /^0 attempts have dropped/);
});

test('⭐ the trails note follows the ends mode, not just the control', () => {
  /* ⚠️ THE OLD SENTENCE PROMISED A WHOLE-GAME SHOT CHART AND AS-PLAYED CANNOT
     DELIVER ONE — the marks clear at every period change, because after it the
     teams are shooting the other way. Two true sentences for two arrangements. */
  assert.match(trailsNote('off', true), /Current moment shows the latest event only/);
  assert.match(trailsNote('off', false), /Current moment shows the latest event only/);

  assert.match(trailsNote('all', true), /in this period/,
               'as-played no longer says the ice clears at a period change');
  assert.match(trailsNote('all', true), /shooting the other way/);

  assert.match(trailsNote('all', false), /shot chart by the third period/,
               'fixed ends no longer promises the whole-game chart it can actually deliver');
  assert.doesNotMatch(trailsNote('all', false), /in this period/,
                      'fixed ends is claiming the as-played limitation it does not have');
});
