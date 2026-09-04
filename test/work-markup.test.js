/**
 * ⭐⭐ THE SHOW-ME-THE-WORK PANEL, CALLED DIRECTLY — and this file is what makes
 * extracting it worth the risk.
 *
 * CHENG's case for step 2 is mutation testing: *coverage tells you a line ran;
 * mutation score tells you a test would notice if it were wrong.* ⚠️ And that has
 * a precondition — `test/helpers/page.js` runs the bundle through `new Function`
 * on the BUILT HTML, so a mutant in a source module never executes through a
 * booted page. An extracted cluster becomes reachable only if a test imports it.
 * `test/dom-golden.test.js` pins what this panel RENDERS; this asserts what it
 * CLAIMS, over real ledgers, and the two answer different questions.
 *
 * ⭐ THE PANEL'S OWN CLOSING SENTENCE IS THE PROPERTY WORTH TESTING. It ends
 * *"…which is every event in the game so far. Nothing is dropped quietly."* That
 * is the project's promise in one line, and it is arithmetic: the numbers it
 * prints must add up to the events it was given. `layer.js` proves conservation
 * for the REDUCER; nothing proved it for the SENTENCE, which is what a reader
 * actually checks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { workMarkup } from '../src/lib/work.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { danger } from '../src/lib/layers/danger.js';
import { blocked } from '../src/lib/layers/blocked.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { whistle } from '../src/lib/layers/whistle.js';

const G = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
const CTX = { roster: G.roster, homeId: G.teams.home.id, awayId: G.teams.away.id,
              homeAb: G.teams.home.ab, awayAb: G.teams.away.ab, evenOnly: false };

/** The same id→module map `app.js` holds, so a layer added there is added here. */
const LENS = { corsi, slot: danger, blocked, goaltending, whistle };

const panelFor = (id, n = G.events.length, over = {}) => {
  const sl = G.events.slice(0, n);
  const L = LENS[id].reduce(sl, CTX);
  return {
    L, sl,
    html: workMarkup({
      id, L, sl, name: id, lds: 'what this layer counts', lat: '',
      box: { a: String(L.counted.length), k: 'counted', h: '0', n: '' },
      cards: '', mode: 'all situations', when: 'pre-game', evenOnly: false,
      AAB: CTX.awayAb, HAB: CTX.homeAb, ...over,
    }),
  };
};

test('⭐ there is a ledger to render', () => {
  assert.ok(G.events.length > 200, `only ${G.events.length} events — the fixture is not loading`);
  assert.deepEqual(Object.keys(LENS).sort(),
                   ['blocked', 'corsi', 'goaltending', 'slot', 'whistle'],
                   'the layer set here has drifted from the one the app renders');
});

test('⭐⭐ the panel\'s arithmetic closes, for every layer', () => {
  /* THE ACCOUNTABILITY CLAIM, ASSERTED AS ARITHMETIC. The footer prints
     "N counted + M other = T events, which is every event in the game so far".
     A panel whose sum did not close would be this project failing at the one
     thing it says it does, on the surface built to demonstrate it. */
  for (const id of Object.keys(LENS)) {
    const { html, sl } = panelFor(id);
    const m = /<b>(\d+)<\/b> events/.exec(html);
    assert.ok(m, `${id}: the panel no longer states a total`);
    assert.equal(+m[1], sl.length,
      `${id}: the panel says ${m[1]} events where the slice held ${sl.length} — `
      + 'the closing sentence claims to cover every event and does not');

    /* ⚠️ PARSED FROM THE FOOTER, NOT FROM THE WHOLE PANEL. The first version of
       this assertion summed every "N other" in the markup and got 505 against
       320, because the standalone exclusion line says "185 other events were not
       this kind of play" and the footer says "+ 185 other" as well. The same
       number twice is not two numbers — and the panel was right. */
    const foot = /<p class="wfoot">([\s\S]*?)<\/p>/.exec(html);
    assert.ok(foot, `${id}: the panel has lost its conservation footer`);
    const sum = /<em>[^<]*<\/em>[^0-9]*([\d +a-z]*?)=/.exec(foot[1]);
    assert.ok(sum, `${id}: the footer no longer shows its addition`);
    const parts = [...sum[1].matchAll(/(\d+)/g)].map(x => +x[1]);
    assert.ok(parts.length >= 2, `${id}: the footer adds fewer than two numbers`);
    assert.equal(parts.reduce((a, b) => a + b, 0), sl.length,
      `${id}: the footer's own addition (${parts.join(' + ')}) does not reach the `
      + `${sl.length} events it claims to cover`);
  }
});

test('⭐⭐ the counted figure agrees with the layer box under the rink', () => {
  /* ⛔ THE SEAM THIS EXTRACTION CREATED, AND IT HAD NO INSTRUMENT. `lboxFor`
     feeds BOTH the layer box below the ice and this panel, and the two must
     agree: a reader who sees 36 under the rink, opens the panel expecting 36 and
     finds 33 has caught us contradicting ourselves. They agreed by construction
     while both lived in one function. Now one of them is a module taking the
     other's output as an argument, and construction is no longer the reason. */
  for (const id of Object.keys(LENS)) {
    const { L, html } = panelFor(id, 200, {});
    const box = /<em>([^<]*)<\/em>/.exec(html);
    assert.ok(box, `${id}: the panel no longer echoes the box figures`);
    const shown = /(\d+) counted/.exec(html);
    assert.equal(+shown[1], L.counted.length,
      `${id}: the panel's counted figure is not the ledger's own count`);

    /* ⭐ AND THE HEADING PRINTS IT A SECOND TIME. "Counted <span class="n">135</span>"
       above, "135 counted + …" in the footer — one truth, two places, and a
       mutant that moved only the heading survived every other assertion here.
       Third instance of that pattern in a day, so it is checked rather than
       noticed: the two must agree with each other AND with the ledger. */
    const head = /class="wc"><h3>Counted <span class="n">(\d+)<\/span>/.exec(html);
    assert.ok(head, `${id}: the panel's Counted heading has gone`);
    assert.equal(+head[1], L.counted.length,
      `${id}: the heading says ${head[1]} where the ledger counted ${L.counted.length}`);
    assert.equal(head[1], shown[1],
      `${id}: the heading and the footer disagree about the same count`);
  }
});

test('⛔ a club with none of something is still named', () => {
  /* ⚠️ A REAL DEFECT THIS PANEL SHIPPED: "none of something was falsy and
     vanished — the footer read '1 WSH.' on a 1-0 slot count, silently omitting
     the club that had none." On a surface whose closing sentence is "nothing is
     dropped quietly", that is the one number that must never go missing. */
  /* ⚠️ NUMBERS, NOT STRINGS, AND THAT IS THE WHOLE TEST. The first version passed
     `a: '0'` — a non-empty string, truthy either way — so replacing `has` with a
     plain truthiness check changed nothing and the mutant survived. `lboxFor`
     returns `a: c[AID]` straight out of `byShooter`, which is a NUMBER, and the
     number zero is falsy. Testing the shape the caller cannot produce is testing
     nothing. */
  const { html } = panelFor('slot', 40, { box: { a: 0, k: 'from the slot', h: 1, n: '' } });
  assert.match(html, new RegExp(`0 ${CTX.awayAb}`),
               'a club with zero is missing from the footer, which is how this broke before');
  assert.match(html, new RegExp(`1 ${CTX.homeAb}`), 'the other club is missing too');
});

test('⛔ …and an EMPTY figure is not the same as a zero', () => {
  /* Stoppages shows no club figures at all, because there the fields are empty
     strings — a real absence, which is a different thing from zero. A `has()`
     that tested truthiness would collapse the two and print "0 MIN + 0 BUF" for
     a layer that counts nothing per club. */
  const { html } = panelFor('whistle', 200, { box: { a: '', k: 'stoppages', h: '', n: '' } });
  assert.doesNotMatch(html, new RegExp(`0 ${CTX.awayAb}`),
    'an absent per-club figure was rendered as a zero, which is a claim we cannot make');
});

test('⭐ the even-strength footnote appears only when the filter is on', () => {
  assert.match(panelFor('corsi', 200, { evenOnly: true }).html, /Even strength only/);
  assert.doesNotMatch(panelFor('corsi', 200, { evenOnly: false }).html, /Even strength only/);
});
