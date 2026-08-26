/**
 * Rink geometry, and the `Math.abs(x)` distance defect.
 *
 * The defect measured to the NEARER net rather than the ATTACKING net. It never
 * changed a high-danger classification in the reference game, because every
 * mis-measured shot also failed the slot test independently -- the count was
 * right by luck. These tests pin the distances, not just the count, so the luck
 * is not what we are relying on.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attackDirection, distanceToNet, isHighDanger,
         NET_X, HIGH_DANGER_FT, SLOT_HALF_WIDTH,
         BLUE_LINE_X, NEUTRAL_DOT_X, ZONE_BAND_FT } from '../src/lib/rink.js';
import { shootingTeam, SHOT_TYPES } from '../src/lib/attribution.js';
import { boot, PAGE_CSS } from './helpers/page.js';

const rich = JSON.parse(readFileSync(new URL('../data/rich.json', import.meta.url)));
const R = rich.roster;
const HID = rich.teams.home.id;   // BUF, defends -x, attacks +x
const AID = rich.teams.away.id;   // MIN, defends +x, attacks -x

const dirOf = e => attackDirection(shootingTeam(e, R), HID);

test('INVARIANT: normalization exactly matches the feed\'s ends-switch rule', () => {
  // Everything else here depends on normalization. If extraction ever stops
  // undoing the ends switch, every distance silently becomes wrong.
  //
  // The obvious assertion -- "every BUF shot has x > 0" -- is WRONG, and the
  // first run of this test proved it. 90 of 91 shots obey it; one does not:
  // P3 11:33, a BUF shot-on-goal at x = -70 from BUF's own end, which the raw
  // feed independently marks zoneCode 'D'. Teams really do shoot from their own
  // half. An earlier project note claimed the stronger version was "verified";
  // it was not, and this test is the correction.
  //
  // So pin the actual rule instead: flip (x,y) when the home team defends
  // 'right', leave it otherwise. Exact, and it catches a regression the
  // statistical version would sleep through.
  const raw = JSON.parse(readFileSync(new URL('../data/pbp_2023020204.json', import.meta.url)));
  assert.equal(rich.events.length, raw.plays.length, 'extraction is lossless');

  let checked = 0;
  rich.events.forEach((e, i) => {
    const p = raw.plays[i];
    const d = p.details || {};
    if (d.xCoord == null || e.x == null) return;
    const flip = p.homeTeamDefendingSide === 'right';
    // `|| 0` collapses -0 to 0: negating a zero coordinate yields -0, and
    // strictEqual compares with Object.is, which treats -0 and 0 as different.
    // JSON has no -0 either, so the extract can only ever hold 0.
    const ex = (flip ? -d.xCoord : d.xCoord) || 0;
    const ey = (flip ? -d.yCoord : d.yCoord) || 0;
    assert.equal(e.x, ex, `x at index ${i} (P${e.per} ${e.clock})`);
    assert.equal(e.y, ey, `y at index ${i} (P${e.per} ${e.clock})`);
    checked++;
  });
  assert.ok(checked > 200, `checked ${checked} coordinate pairs`);
});

test('a shot from a team\'s own end is real data, not a normalization bug', () => {
  // Guarding the finding above so nobody "fixes" it later. The feed marks this
  // one zoneCode 'D' with the home team defending left, so x = -70 is exactly
  // where it says the shot happened: BUF, 159 feet from the net it was aimed at.
  const e = rich.events.find(x => x.per === 3 && x.clock === '11:33' && x.type === 'shot-on-goal');
  assert.ok(e, 'the long shot exists');
  assert.equal(e.own, HID);
  assert.equal(e.x, -70);
  assert.ok(distanceToNet(e.x, e.y, attackDirection(e.own, HID)) > 150,
    'and it is genuinely a very long shot');
});

test('distance measures to the attacking net, not the nearer one', () => {
  // The three events the old code got wrong, with both answers.
  const cases = [
    { per: 3, clock: '11:33', app: 39.8, real: 162.8 },
    { per: 3, clock: '00:35', app: 34.7, real: 156.0 },
    { per: 2, clock: '06:29', app: 45.2, real: 143.4 },
  ];
  for (const c of cases) {
    const e = rich.events.find(x => x.per === c.per && x.clock === c.clock && x.x != null);
    assert.ok(e, `event at P${c.per} ${c.clock} exists`);
    const correct = distanceToNet(e.x, e.y, dirOf(e));
    const buggy = Math.hypot(NET_X - Math.abs(e.x), e.y);   // the old code
    assert.ok(Math.abs(correct - c.real) < 0.5,
      `P${c.per} ${c.clock}: expected ~${c.real} ft, got ${correct.toFixed(1)}`);
    assert.ok(Math.abs(buggy - c.app) < 0.5, 'the old value, for the record');
    assert.ok(correct > buggy + 90, 'the defect understated distance badly');
  }
});

test('high-danger count is unchanged by the fix, and that is a coincidence', () => {
  const hd = e => SHOT_TYPES.has(e.type) && e.x != null && isHighDanger(e.x, e.y, dirOf(e));
  const buggyHd = e => SHOT_TYPES.has(e.type) && e.x != null &&
    Math.hypot(NET_X - Math.abs(e.x), e.y) <= HIGH_DANGER_FT && Math.abs(e.y) <= SLOT_HALF_WIDTH;
  const now = rich.events.filter(hd).length;
  assert.equal(rich.events.filter(buggyHd).length, now,
    'same count both ways -- every mis-measured shot also failed the slot test');
  assert.ok(now > 0, 'and the count is not trivially zero');
});

test('the geometric rule holds exactly at its boundaries', () => {
  // Doctrine section 7: a rule a viewer can check with a ruler, so the edges
  // must be exact rather than approximately right.
  assert.equal(distanceToNet(NET_X - HIGH_DANGER_FT, 0, 1), HIGH_DANGER_FT);
  assert.ok(isHighDanger(NET_X - HIGH_DANGER_FT, 0, 1), 'exactly 33 ft counts');
  assert.ok(!isHighDanger(NET_X - HIGH_DANGER_FT - 0.01, 0, 1), 'just beyond does not');
  assert.ok(isHighDanger(NET_X - 10, SLOT_HALF_WIDTH, 1), 'exactly |y|=22 counts');
  assert.ok(!isHighDanger(NET_X - 10, SLOT_HALF_WIDTH + 0.01, 1), 'just outside does not');
});

test('direction is symmetric between the two ends', () => {
  assert.equal(attackDirection(HID, HID), 1);
  assert.equal(attackDirection(AID, HID), -1);
  // Mirrored shots are equidistant from the nets they are aimed at.
  assert.equal(distanceToNet(70, 12, 1), distanceToNet(-70, 12, -1));
});

/**
 * ⭐ THE SLOT IS NOT BEHIND THE NET — the third clause, added 2026-08-25.
 *
 * The first two clauses are a radius and a band, and a radius does not stop at
 * the goal line. Nobody had noticed because nobody had asked the rule to draw
 * itself; the moment the slot became furniture on the ice, the region reached
 * past the net to the end boards. Kevin: "I don't consider the slot to be valid
 * behind the net."
 *
 * BOTH SIDES OF THE LINE, and both attacking directions. A one-sided test is
 * satisfied by a rule that rejects everything, and a one-direction test is
 * satisfied by a clause that forgot to multiply by `dir` — which would silently
 * delete the whole slot at one end of the ice.
 */
test('the slot stops at the goal line, at both ends', () => {
  for (const dir of [1, -1]) {
    const at = ft => ft * dir;          // feet along the attack, signed for the frame
    assert.ok(isHighDanger(at(NET_X - 5), 0, dir),
      `five feet out is the slot (dir ${dir})`);
    assert.ok(isHighDanger(at(NET_X), 0, dir),
      `ON the goal line still counts (dir ${dir})`);
    assert.ok(!isHighDanger(at(NET_X + 0.01), 0, dir),
      `a hair behind the goal line does not (dir ${dir})`);
    // The point that made this necessary: a wrap-around three feet behind the
    // net passes the radius and the band, and is not a shot from the slot.
    assert.ok(distanceToNet(at(NET_X + 3), 0, dir) <= HIGH_DANGER_FT,
      'the fixture must still pass the radius, or it proves nothing');
    assert.ok(!isHighDanger(at(NET_X + 3), 0, dir),
      `a wrap-around from behind the net is not the slot (dir ${dir})`);
  }
});

/**
 * ⭐ AND THE PAINT ON THE ICE IS THE RULE, NOT A SHAPE THAT RESEMBLES IT.
 *
 * The whole justification for making the slot permanent furniture is that a
 * viewer can check a mark against it — which is only true while the drawing is
 * parameterised by the same constants `isHighDanger` tests. A tint hand-tuned to
 * look right would drift from the rule the first time either moved, and the
 * disagreement would appear exactly at the marks people argue about.
 *
 * THE EXPECTED NUMBERS ARE IMPORTED FROM rink.js, so changing a constant moves
 * the assertion with it and this cannot pass by agreeing with a literal.
 */
test('the slot painted on the ice is drawn from the rule\'s own constants', () => {
  const rink = String(boot().$('rink').innerHTML);
  assert.match(rink, /class="slotzone"/, 'the slot is not painted at all');

  const r = [...rink.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"\/>/g)]
    .filter(m => Number(m[3]) === HIGH_DANGER_FT);
  assert.equal(r.length, 2,
    `expected one slot arc per end at r=${HIGH_DANGER_FT}, found ${r.length}`);

  // The band is |y| <= SLOT_HALF_WIDTH, so its height is twice that.
  const band = /<clipPath id="slotband"><rect x="0" y="([\d.]+)" width="200" height="([\d.]+)"/.exec(rink);
  assert.ok(band, 'the |y| band is missing — the arcs would be full circles');
  assert.equal(Number(band[2]), SLOT_HALF_WIDTH * 2, 'the band is not the rule\'s width');

  // ⚠️ AND THE CLIP HAS TO BE *APPLIED*, NOT MERELY DEFINED. This asserted the
  // two `<clipPath>` elements existed, and a mutation that deleted the
  // `clip-path=` attribute from the group left both definitions sitting there
  // unused — the tint went back over the goal line and the test stayed green.
  // A definition is not a use, and only the use is the claim.
  for (const [id, rect] of [['slotfrontA', `<rect x="${100 - NET_X}" y="0" width="200"`],
                            ['slotfrontB', `<rect x="0" y="0" width="${100 + NET_X}"`]]) {
    assert.ok(rink.includes(`<clipPath id="${id}">${rect}`),
      `the ${id} half-plane is not the goal line`);
    assert.ok(rink.includes(`clip-path="url(#${id})"`),
      `${id} is defined but never applied — the tint spills behind the net`);
  }
  assert.ok(rink.includes('clip-path="url(#slotband)"'),
    'the band is defined but never applied');
});

/**
 * ⭐ THE BLUE-LINE BAND, AND THE ONE CLAIM THAT MAKES ITS WIDTH HONEST.
 *
 * Kevin: "offense wants to hold play in, defense wants to keep play out, a
 * battleground if you will." The band exists to teach that, and a band needs an
 * edge — five feet picked by eye would be a model wearing a UI control.
 *
 * IT DOES NOT PICK ONE. `ZONE_BAND_FT` is the distance from the blue line to the
 * neutral-zone face-off dot, and `drawRink` records those nine spots as MEASURED
 * from the archive rather than remembered from a rulebook. So the band reaches
 * from the line to the dots, and a viewer can see that it does. That relationship
 * is what this pins: break it and the width becomes arbitrary again, silently.
 */
test('the blue-line band reaches exactly to the neutral-zone dots', () => {
  assert.equal(ZONE_BAND_FT, BLUE_LINE_X - NEUTRAL_DOT_X,
    'the band width stopped being the line-to-dot distance');
  assert.ok(ZONE_BAND_FT > 0, 'a band of no width teaches nothing');

  const rink = String(boot().$('rink').innerHTML);
  const bands = [...rink.matchAll(/<rect class="zoneband" x="([-\d.]+)" y="1" width="([\d.]+)"/g)]
    .map(m => ({ x: Number(m[1]), w: Number(m[2]) }));
  assert.equal(bands.length, 2, `expected one band per blue line, found ${bands.length}`);

  // SX(x) = 100 - x, so a band centred on the line at `b` starts at SX(b + half).
  for (const b of [BLUE_LINE_X, -BLUE_LINE_X]) {
    const want = { x: 100 - (b + ZONE_BAND_FT), w: ZONE_BAND_FT * 2 };
    assert.ok(bands.some(z => z.x === want.x && z.w === want.w),
      `no band centred on the blue line at ${b} (wanted x=${want.x} w=${want.w})`);
  }

  // AND THE EDGE LANDS ON A DOT THAT IS REALLY DRAWN THERE — read out of the
  // same markup, so the claim is about the picture and not about my arithmetic.
  const dots = [...rink.matchAll(/<circle class="fdot" cx="([-\d.]+)"/g)].map(m => Number(m[1]));
  for (const z of bands) {
    const inner = Math.abs(z.x - 100) < Math.abs(z.x + z.w - 100) ? z.x : z.x + z.w;
    assert.ok(dots.includes(inner),
      `the band edge at ${inner} does not land on a face-off dot (dots at ${[...new Set(dots)].sort((a,b)=>a-b)})`);
  }
});

/**
 * The two regions must not be read as the same kind of important. The slot is a
 * PLACE and the blue line is a THRESHOLD, and the only thing carrying that
 * distinction is that they look different — a different shape and a different
 * colour, each borrowed from the mark it explains.
 */
test('the slot and the blue-line band are visibly different kinds of thing', () => {
  const css = PAGE_CSS;
  const slot = /#rg \.slotzone\{fill:var\(--([a-z]+)\);opacity:([\d.]+)\}/.exec(css);
  const band = /#rg \.zoneband\{fill:var\(--([a-z]+)\);opacity:([\d.]+)\}/.exec(css);
  assert.ok(slot && band, 'one of the two regions has lost its styling');
  assert.notEqual(slot[1], band[1],
    'both regions are tinted the same colour — they read as the same kind of area');
  assert.equal(slot[1], 'hd', 'the slot no longer borrows the high-danger colour');
  assert.equal(band[1], 'blue', 'the band no longer borrows the blue line\'s colour');
  assert.ok(Number(band[2]) < Number(slot[2]),
    'the band covers far more ice than the slot and must be fainter, not louder');
});

/**
 * ⭐ THE LEGEND DESCRIBES THE REGIONS THAT ARE ACTUALLY DRAWN.
 *
 * The two tints are the only marks on the base view a visitor did not ask for,
 * and until now the legend named every other mark and not these. Copy is the one
 * kind of claim on this site that nothing checks by default: a number in a
 * sentence drifts from the constant it describes in total silence, and the
 * sentence keeps reading correctly.
 *
 * BOTH LANDMARKS ARE REAL AND BOTH ARE CHECKABLE BY EYE — which is why the copy
 * uses them instead of a second set of numbers. The slot's half-width IS the
 * end-zone face-off dots' y, and the band reaches the neutral-zone dots. Those
 * are coincidences of the paint rather than definitions, so if either stops
 * being true the sentence has to change, and this is what says so.
 */
test('the legend says what the two painted regions really are', () => {
  // ⭐ IT READS `.areas`, NOT `.legend`, AS OF 2026-08-26. The two painted
  // regions left the key list for cards of their own — they are the only two
  // rows that needed a sentence rather than a name, and mixing them with five
  // one-word marks is what made the block read as a wall. The claim is
  // unchanged and is the one worth keeping: THE COPY MUST AGREE WITH THE
  // CONSTANTS THE RINK IS DRAWN FROM, so a change to `HIGH_DANGER_FT` cannot
  // leave the page describing a shape it no longer paints.
  const areas = /<div class="areas">([\s\S]*?)<\/div>\s*<div class="legend">/.exec(
    readFileSync(new URL('../src/game.html', import.meta.url), 'utf8'));
  assert.ok(areas, 'the area cards are gone — this check has lost its subject');
  const text = areas[1].replace(/<[^>]*>/g, ' ');

  // Case-insensitive: the region is a card TITLE now rather than a phrase inside
  // a key, so it is capitalised. What is being asserted is that it is named.
  assert.match(text, /\bthe slot\b/i, 'the slot is painted on the ice and unexplained');
  assert.match(text, /blue line/i, 'the blue-line zone is painted and unexplained');

  const ft = /within (\d+) ft of the net/.exec(text);
  assert.ok(ft, 'the slot key stopped stating its distance');
  assert.equal(Number(ft[1]), HIGH_DANGER_FT,
    `the legend says ${ft[1]} ft and the rule uses ${HIGH_DANGER_FT}`);

  // "between the face-off dots" — true only while the slot's half-width is the
  // dots' own y. `drawRink` places the end-zone dots at +-22.
  const rink = String(boot().$('rink').innerHTML);
  const dotY = [...rink.matchAll(/<circle class="fdot" cx="([-\d.]+)" cy="([-\d.]+)"/g)]
    .map(m => Math.abs(Number(m[2]) - 42.5));           // SY(y) = 42.5 - y
  assert.ok(dotY.some(y => Math.abs(y - SLOT_HALF_WIDTH) < 0.001),
    `no face-off dot sits at |y| = ${SLOT_HALF_WIDTH}, so "between the face-off dots" is false`);

  // "out to the neutral-zone dots" — the band's own claim, stated in copy here
  // and asserted geometrically in the test above.
  assert.match(text, /neutral-zone dots/, 'the band key stopped naming its edge');
  assert.equal(ZONE_BAND_FT, BLUE_LINE_X - NEUTRAL_DOT_X);
});
