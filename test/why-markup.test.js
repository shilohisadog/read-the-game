/**
 * ⭐⭐ THE WHY-POPUP, CALLED DIRECTLY — and this file is the reason the extraction
 * was worth doing at all.
 *
 * CHENG, on why decomposition earns its risk: *"coverage tells you a line ran;
 * mutation score tells you a test would notice if it were wrong."* ⚠️ **And that
 * argument has a precondition he did not state, which is what this file
 * satisfies.** `test/helpers/page.js` runs the bundle through `new Function` on
 * the BUILT HTML, so a mutant introduced into a source module never executes in
 * any test that boots a page — the artifact is a stale file from the last build.
 * An extracted cluster becomes reachable by mutation testing **only if a test
 * imports it**, which makes this file load-bearing rather than a nicety. Without
 * it the extraction produced a file boundary and no new ability.
 *
 * `test/why-popup.test.js` remains, and it does something different: it greps the
 * BUILT PAGE to check the rule's SENTENCE names every clause. That is a claim
 * about words. This is a claim about behaviour, over real events, and it could
 * not be written before the markup was a function anyone could call.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { whyMarkup } from '../src/lib/why.js';
import { isHighDanger, distanceToNet, HIGH_DANGER_FT, SLOT_HALF_WIDTH, NET_X } from '../src/lib/rink.js';
import { attackDirection } from '../src/lib/rink.js';
import { shootingTeam } from '../src/lib/attribution.js';

const G = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url), 'utf8'));
const R = G.roster, HID = G.teams.home.id, AID = G.teams.away.id;
const CTX = { dir: 1, AID, AAB: G.teams.away.ab, HAB: G.teams.home.ab,
              AWAYCOL: '#111111', HOMECOL: '#eeeeee', R };

/** Every placed shot in the reference game, with the direction its team attacks. */
const shots = G.events
  .filter(e => e.x != null && e.y != null && e.own != null)
  .map(e => {
    const t = shootingTeam(e, R);
    return { e, dir: t == null ? 1 : attackDirection(t, HID) };
  });

test('⭐ there is a corpus to test against', () => {
  assert.ok(shots.length > 100, `only ${shots.length} placed shots — the fixture is not loading`);
  const hd = shots.filter(s => isHighDanger(s.e.x, s.e.y, s.dir));
  assert.ok(hd.length > 20, `only ${hd.length} slot shots — nothing to check the popup against`);
});

test('⭐⭐ every factor row agrees with the rule the page applies', () => {
  /* THE POPUP'S OWN HEADING IS "The rule, and you can check it", so the one thing
     it may never do is disagree with `isHighDanger`. It has done exactly that
     before — the sentence named two of three clauses — and the check that caught
     it could only read words out of the built page. This reads the RENDERED
     VERDICTS for every real shot and compares each against the rule's own clause,
     which is the check that was not available until the markup was a function. */
  let checked = 0;
  for (const { e, dir } of shots) {
    if (!isHighDanger(e.x, e.y, dir)) continue;          // the popup only opens on these
    const html = whyMarkup(e, { ...CTX, dir });
    checked++;

    const lateral = /class="fv">(Slot|Wide)</.exec(html);
    const side = /class="fv">(Front|Behind)</.exec(html);
    const shown = /class="fv">(\d+) ft</.exec(html);
    assert.ok(lateral && side && shown, 'the popup no longer shows its three verdict rows');

    assert.equal(lateral[1], Math.abs(e.y) <= SLOT_HALF_WIDTH ? 'Slot' : 'Wide',
      `the lateral verdict disagrees with SLOT_HALF_WIDTH at y=${e.y}`);
    assert.equal(side[1], e.x * dir <= NET_X ? 'Front' : 'Behind',
      `the goal-line verdict disagrees with NET_X at x=${e.x}, dir=${dir}`);
    assert.equal(+shown[1], Math.round(distanceToNet(e.x, e.y, dir)),
      'the distance shown is not the distance the rule measured');

    /* ⭐ AND THE DIAGRAM SAYS IT TOO, so both have to be checked. A mutant that
       moved only the label inside the SVG survived every other assertion here —
       the third "printed twice, asserted once" in this one small file, which is
       what a surface built to be verified by a reader looks like from inside. */
    const drawn = /font-weight="700">(\d+) ft<\/text>/.exec(html);
    assert.ok(drawn, 'the diagram no longer labels the distance');
    assert.equal(drawn[1], shown[1],
      'the diagram and the factor row disagree about the same shot\'s distance');
  }
  assert.ok(checked > 20, `only ${checked} popups rendered — the loop is not reaching the corpus`);
});

test('⭐ the thresholds are the rule\'s own constants, in BOTH places they appear', () => {
  /* ⚠️⚠️ THE FIRST VERSION OF THIS TEST WAS SATISFIED BY THE WRONG OCCURRENCE, and
     a mutant found it inside a minute of this module becoming reachable — which
     is the entire case for the extraction, demonstrated on the extraction itself.

     The distance threshold is printed TWICE: once in the factor row ("Our rule:
     ≤ 33 ft.") and once in the closing sentence ("≤ 33 ft from the net"). The
     assertion was a bare /≤ 33 ft/, so replacing the factor row's constant with a
     literal 34 left the sentence's copy to satisfy it and the test stayed green.
     Two instances of one string, one assertion — this repo's "two mechanisms, one
     observable" in its smallest possible form. Both are named now. */
  const s = shots.find(x => isHighDanger(x.e.x, x.e.y, x.dir));
  const html = whyMarkup(s.e, { ...CTX, dir: s.dir });

  assert.match(html, new RegExp(`Our rule: ≤ ${HIGH_DANGER_FT} ft`),
               'the distance FACTOR ROW does not state the rule\'s threshold');
  assert.match(html, new RegExp(`≤ ${HIGH_DANGER_FT} ft from the net`),
               'the closing SENTENCE does not state the rule\'s threshold');
  assert.match(html, new RegExp(`±${SLOT_HALF_WIDTH} ft of the middle`),
               'the lateral threshold is not the rule\'s');
});

test('⛔ …and the verdicts hold ON the boundary, where the corpus never lands', () => {
  /* A SECOND MUTANT SURVIVED THE CORPUS AND IT WAS NOT THE TEST'S FAULT.
     Turning `e.x*dir <= NET_X` into `<` changes the answer only for a shot
     exactly on the goal line, and no event in the reference game sits there — an
     equivalent mutant for that data, and a real defect for a game that has one.
     A corpus is a sample; a boundary has to be asked for. Both clauses are
     inclusive in `isHighDanger`, so both are asked here. */
  const on = (x, y) => whyMarkup({ x, y, own: AID, per: 1, rem: '10:00', type: 'shot-on-goal', actor: null },
                                 { ...CTX, dir: 1 });
  assert.match(on(NET_X, 0), /class="fv">Front</,
               'a shot exactly ON the goal line reads as behind it — the rule says in front');
  assert.match(on(80, SLOT_HALF_WIDTH), /class="fv">Slot</,
               'a shot exactly on the slot\'s edge reads as wide — the rule includes it');
  assert.match(on(80, SLOT_HALF_WIDTH + 0.1), /class="fv">Wide</,
               'a shot outside the slot reads as in it');
});

test('⭐ the header takes the shooting club\'s side and colour', () => {
  /* ⛔ `own` MEANS FOUR DIFFERENT THINGS ACROSS THIS FEED and the popup reads it
     as "the club that took the shot". Both branches are exercised, because a
     two-tone header tested on one team is a test of a constant. */
  const away = shots.find(s => s.e.own === AID && isHighDanger(s.e.x, s.e.y, s.dir));
  const home = shots.find(s => s.e.own !== AID && isHighDanger(s.e.x, s.e.y, s.dir));
  assert.ok(away && home, 'the corpus has slot shots from only one team, so this proves nothing');

  const a = whyMarkup(away.e, { ...CTX, dir: away.dir });
  const h = whyMarkup(home.e, { ...CTX, dir: home.dir });
  assert.match(a, /class="whyhd a"/, 'an away shot is not headed as the away team');
  assert.match(h, /class="whyhd h"/, 'a home shot is not headed as the home team');
  assert.match(a, /fill="#111111"/, 'the away colour did not reach the diagram');
  assert.match(h, /fill="#eeeeee"/, 'the home colour did not reach the diagram');
});

test('⛔ the goal wording is earned by the event, not by the layer', () => {
  const goal = shots.find(s => s.e.type === 'goal' && isHighDanger(s.e.x, s.e.y, s.dir));
  const shot = shots.find(s => s.e.type !== 'goal' && isHighDanger(s.e.x, s.e.y, s.dir));
  assert.ok(goal && shot, 'no goal-and-shot pair in the slot to compare');
  assert.match(whyMarkup(goal.e, { ...CTX, dir: goal.dir }), /A GOAL from the slot/);
  assert.doesNotMatch(whyMarkup(shot.e, { ...CTX, dir: shot.dir }), /A GOAL from the slot/);
});
