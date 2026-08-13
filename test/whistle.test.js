/**
 * The whistle layer — what the stoppages say.
 *
 * THIS IS THE FIRST HONEST TEST OF THE LAYER CONTRACT (CHENG). Corsi and
 * goaltending were built together; the strength filter is a dimension of an
 * existing reducer. This is the first genuinely independent layer, and it inverts
 * the others — they count attempts and discard stoppages, this counts stoppages
 * and discards attempts. If the contract is a real abstraction that works; if it
 * was a description of two things that happened to look alike, it will not.
 *
 * AND IT IS THE FIRST LAYER MADE OF SENTENCES, which is the risk. Every number on
 * this site has a check that can fail; prose had none, and the defect that started
 * this was mine — "they aren't allowed to change TIRED players", written in the
 * same message where I said that line was easy to cross. Three of those clauses
 * are the rulebook. `tired` is a state of these players on this shift that the
 * feed never recorded.
 *
 * The standard is positive, because a banned-word list is a blacklist over an open
 * vocabulary and a green one reads as "the copy was checked":
 *
 *     Every sentence's subject is a rule, a recorded field, or a count.
 *     Never a player, a team, or a moment.
 *
 * Enforced by requiring provenance on every row. The word list survives only as a
 * regression test for the one defect we actually shipped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { whistle, WHY, marks, latest } from '../src/lib/layers/whistle.js';

const HOME = 10, AWAY = 20;
const CTX = { roster: { 1: { nm: 'A', tid: AWAY, pos: 'C' } },
              homeId: HOME, awayId: AWAY, homeAb: 'HME', awayAb: 'AWY' };

const ev = (type, o = {}) => ({ type, per: 1, s: 100, rem: '18:20',
                                pt: 'REG', sit: '1551', own: null, actor: null,
                                x: null, y: null, ...o });
const stop = (rsn, o = {}) => ev('stoppage', { rsn, ...o });
const faceoff = (x, y) => ev('faceoff', { actor: 1, own: AWAY, x, y });

const run = events => whistle.reduce(events, CTX);

test('stoppages are the subject; everything else is excluded with a reason', () => {
  // The inversion. Every other layer treats a stoppage as "not a play"; here the
  // shot is the thing that is not the point.
  const events = [stop('icing'), faceoff(-69, 22), ev('shot-on-goal', { actor: 1 })];
  const r = run(events);
  assert.deepEqual(r.counted, [0]);
  assert.equal(r.excluded.length, 2);
  assert.match(r.excluded.find(x => x.id === 2).why, /shot|play|not a whistle/i);
});

test('every event is accounted for exactly once', () => {
  const events = [ev('period-start'), stop('icing'), faceoff(-69, 22),
                  ev('hit', { actor: 1 }), stop('offside'), faceoff(69, -22),
                  ev('goal', { actor: 1, own: AWAY }), ev('period-end')];
  const r = run(events);
  const ids = [...r.counted, ...r.excluded.map(x => x.id)].sort((a, b) => a - b);
  assert.deepEqual(ids, events.map((_, i) => i));
});

test('a recognised reason gets its sentence and the rule it comes from', () => {
  // This test first asserted "length of the ice", which is how I described icing
  // to Kevin in prose. The rule is from behind the CENTRE LINE past the far goal
  // line — a shorter distance and a different rule. Writing the copy as data
  // forced the precision that the casual sentence did not have, which is a small
  // instance of the whole argument for this file existing.
  const r = run([stop('icing'), faceoff(-69, 22)]);
  const w = r.whistles[0];
  assert.match(w.say, /centre line/i);
  assert.match(w.say, /goal line/i);
  assert.match(w.from, /^rule:/, 'the sentence must name where it comes from');
});

test('an unrecognised reason renders as itself — never a guess, never silence', () => {
  // The draft layer did `if (!copy) continue`. Two 2025-26 games already produced
  // reasons the reference game never had, and at 1,312 games a season nobody
  // would ever notice them vanishing.
  const r = run([stop('a-reason-nobody-has-seen'), faceoff(0, 0)]);
  assert.equal(r.counted.length, 1, 'it is still counted');
  const w = r.whistles[0];
  assert.equal(w.rsn, 'a-reason-nobody-has-seen');
  assert.equal(w.say, null, 'we do not invent a sentence for it');
  assert.equal(w.known, false, 'and the page can tell that we could not explain it');
});

test('a whistle is stamped with the clock a viewer reads — remaining, never elapsed', () => {
  // CAUGHT BY test/clock.test.js, not by me. This layer first carried `clock`,
  // which is elapsed, so the panel would have said 01:40 beside a scoreboard
  // reading 18:20. The guard is written over the shipped bundle, so it only fired
  // once the layer reached the page — a reducer with no renderer is a reducer
  // nothing checks. Pinned here too, at the source of the field.
  const r = run([stop('icing', { rem: '04:12', clock: '15:48' }), faceoff(-69, 22)]);
  assert.equal(r.whistles[0].rem, '04:12');
  assert.equal(r.whistles[0].clock, undefined,
    'elapsed must not ride along either — a display site would eventually reach for it');
});

test('a second reason is surfaced when the feed gives one', () => {
  const r = run([stop('icing', { rsn2: 'tv-timeout' }), faceoff(-69, 22)]);
  assert.equal(r.whistles[0].rsn2, 'tv-timeout');
});

test('a whistle is placed by the faceoff that restarts play', () => {
  // The stoppage carries no coordinates — 0 of 43 in a real game. The faceoff
  // does, 63 of 63. What from the stoppage, where from the restart.
  const r = run([stop('icing'), faceoff(-69, 22)]);
  assert.deepEqual([r.whistles[0].x, r.whistles[0].y], [-69, 22]);
  assert.equal(r.whistles[0].placed, true);
});

test('an intervening event does not break the placement', () => {
  // 43 of 1,279 real stoppages have a penalty between them and the restart.
  const r = run([stop('high-stick'), ev('penalty', { actor: 1, own: AWAY }),
                 faceoff(0, 0)]);
  assert.equal(r.whistles[0].placed, true);
});

test('a whistle that ends a period is UNPLACED, and says so', () => {
  // CHENG'S COUNTEREXAMPLE, and it is real: 3 of 8,400 stoppages across 185 games
  // have no faceoff before the period ends — an icing at the horn. Thirty games
  // did not contain one, which is why this fixture is SYNTHESISED. A test that
  // depends on finding the case in the corpus passes for a reason unrelated to
  // the code.
  const r = run([stop('icing'), ev('period-end'), ev('game-end')]);
  const w = r.whistles[0];
  assert.equal(w.placed, false);
  assert.equal(w.x, null);
  assert.match(w.unplaced, /period ended/i,
    'we know it happened and cannot place it — that is not the same as nothing');
});

test('placement never reaches past the end of a period', () => {
  // MUTATION GUARD. Without the period-end stop, the search would run on into the
  // next period and put a third-period icing on a first-period faceoff dot.
  const r = run([stop('icing'), ev('period-end'), ev('period-start', { per: 2 }),
                 faceoff(69, -22)]);
  assert.equal(r.whistles[0].placed, false, 'the next period is not this whistle');
});

test('the layer names no team, because the feed does not say who', () => {
  // A stoppage carries `reason` AND NOTHING ELSE — no team, no player. "Buffalo
  // iced the puck" is not something we know; only that an icing happened. The
  // sentence that started all this named a team AND a state of its players.
  const r = run([stop('icing'), faceoff(-69, 22)]);
  assert.doesNotMatch(r.whistles[0].say, /HME|AWY/, 'no team is attributable here');
  for (const row of Object.values(WHY)) {
    assert.doesNotMatch(row.say, /\b(they|their|his|her)\b/i,
      `"${row.say}" has a pronoun, so it is about somebody rather than a rule`);
  }
});

test('a delayed penalty belongs to this layer', () => {
  // The referee's arm up, play continuing, the whistle waiting until the
  // offending team touches the puck. That is a RULE, which is what this layer
  // teaches; corsi has no opinion about it.
  const r = run([ev('delayed-penalty'), ev('penalty', { actor: 1, own: AWAY }),
                 faceoff(0, 0)]);
  assert.equal(r.counted.length, 1);
  assert.match(r.whistles[0].say, /arm|signal|until/i);
});

test('a game with no whistles says nothing happened rather than reaching', () => {
  const r = run([ev('shot-on-goal', { actor: 1 }), ev('hit', { actor: 1 })]);
  assert.deepEqual(r.counted, []);
  assert.deepEqual(r.whistles, []);
  assert.deepEqual(r.tally, {});
});

test('the tally counts what it saw, by reason', () => {
  const r = run([stop('icing'), faceoff(0, 0), stop('icing'), faceoff(0, 0),
                 stop('offside'), faceoff(0, 0)]);
  assert.deepEqual(r.tally, { icing: 2, offside: 1 });
});

test('EVERY copy row states what it derives from', () => {
  // The positive standard, mechanised. A sentence with no source is the one to
  // look at hardest, and requiring the source is what makes the standard
  // enforceable rather than remembered.
  for (const [k, row] of Object.entries(WHY)) {
    assert.ok(row.say && row.say.length > 20, `${k}: no sentence`);
    assert.match(row.from, /^(rule|field|count):/,
      `${k}: provenance must be a rule, a recorded field, or a count — got "${row.from}"`);
  }
});

/* ------------------------------------------------------------------ *
 * What gets DRAWN. The reducer was right and invisible for a day; these
 * cover the half that decides what a viewer actually sees.
 * ------------------------------------------------------------------ */

test('with trails off the ice shows the current moment and nothing else', () => {
  const r = run([stop('icing'), faceoff(-69, 22), stop('offside'), faceoff(69, -22)]);
  const m = marks(r, { trails: 'off' });
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].x, m[0].y], [69, -22], 'the newest whistle, not the first');
  assert.equal(m[0].now, true);
});

test('an unplaced newest whistle draws nothing, and does not fall back to the last placed one', () => {
  // THE FALLBACK IS THE BUG. Drawing the previous whistle would leave a mark on
  // the ice for a stoppage that is no longer the one being explained — a dot in
  // the right place for the wrong event, which reads as perfectly correct.
  const r = run([stop('offside'), faceoff(69, -22), stop('icing'), ev('period-end')]);
  assert.equal(latest(r).placed, false, 'the fixture must actually end unplaced');
  assert.deepEqual(marks(r, { trails: 'off' }), []);
});

test('whistles that share a faceoff dot are ONE mark carrying its count', () => {
  // Nine dots, forty-three stoppages. Drawn one per whistle, eight icings at the
  // same dot look exactly like one icing — the ice would be showing a number it
  // is not saying.
  const r = run([stop('icing'), faceoff(-69, 22),
                 stop('icing'), faceoff(-69, 22),
                 stop('goalie-stopped-after-sog'), faceoff(-69, 22),
                 stop('offside'), faceoff(69, -22)]);
  const m = marks(r, { trails: 'all' });
  assert.equal(m.length, 2, 'two dots were used, so two marks');
  const left = m.find(g => g.x === -69);
  assert.equal(left.n, 3);
  assert.deepEqual(left.reasons, ['icing', 'goalie-stopped-after-sog'],
    'each distinct reason once, in the order it first happened');
  assert.equal(left.now, false);
  assert.equal(m.find(g => g.x === 69).now, true, 'the newest is still marked as now');
});

test('unplaced whistles never reach the ice, however trails are set', () => {
  const r = run([stop('icing'), ev('period-end'), ev('period-start', { per: 2 }),
                 stop('offside'), faceoff(0, 0)]);
  const all = marks(r, { trails: 'all' });
  assert.equal(all.length, 1, 'only the placed one is drawable');
  assert.deepEqual([all[0].x, all[0].y], [0, 0]);
});

test('no whistles is an empty ice and an explicit nothing', () => {
  const r = run([ev('shot-on-goal', { actor: 1 })]);
  assert.equal(latest(r), null, 'null, so the page can say "no whistle yet"');
  assert.deepEqual(marks(r, { trails: 'all' }), []);
  assert.deepEqual(marks(r, { trails: 'off' }), []);
});

test('the words we actually shipped once do not come back', () => {
  // REGRESSION ONLY, and deliberately not the gate: a blacklist over an open
  // vocabulary misses `gassed`, `worn down`, `looking for a change`, and a green
  // one reads as "the copy was checked". The rule above is the standard; this
  // catches the literal recurrence of the defect that started it.
  const banned = /\b(tired|gassed|worn down|desperate|momentum|pressure|dominat\w*|deserved|unlucky|lucky)\b/i;
  for (const [k, row] of Object.entries(WHY)) {
    assert.doesNotMatch(row.say, banned, `${k}: "${row.say}" narrates the moment`);
  }
});

test('the offside sentence claims only what holds for EVERY offside', () => {
  // MEASURED, not assumed. Over 240 games and 1,094 offsides restarting with
  // nothing in between: 89.8% at the neutral-zone dot, 5.3% at centre ice, 4.9%
  // in an end zone. The shipped copy said "the faceoff goes back outside", which
  // is wrong about one offside in ten — and at 4.6 a game, a viewer with this
  // layer on would meet a restart contradicting the sentence most nights.
  const say = WHY.offside.say;
  assert.match(say, /blue line ahead of the puck/, 'the rule itself is still taught');
  assert.doesNotMatch(say, /goes back outside|neutral zone|outside the blue line/,
    'the sentence must not say where the faceoff goes — it varies');
});

test('the icing sentence MAY say where the faceoff goes, because that one holds', () => {
  // The mirror of the test above, and the reason it is not a blanket ban:
  // 2,019 of 2,019 icings in the same 240 games restart at an end-zone dot.
  assert.match(WHY.icing.say, /faceoff comes back to the offending\s+end/);
});

/* ------------------------------------------------------------------ *
 * WHERE, in the terms the rules use. Kevin: icing and offside are the
 * two hardest concepts for a novice, and they happen 13 times a game —
 * twice as often as a goal. Measured over 240 games: 8.4 icings and 4.6
 * offsides, against 6.4 goals and 7.1 penalties.
 * ------------------------------------------------------------------ */

test('the restart names a zone, from the coordinate and the blue line', () => {
  // Coordinates are normalized so HOME defends -x. No threshold of ours: a zone
  // begins at the blue line, which is where the rink says it begins.
  const inHome = run([stop('icing'), faceoff(-69, 22)]).whistles[0];
  const inAway = run([stop('icing'), faceoff(69, -22)]).whistles[0];
  const neutral = run([stop('offside'), faceoff(-20, 22)]).whistles[0];
  assert.equal(inHome.zone, 'HME');
  assert.equal(inAway.zone, 'AWY');
  assert.equal(neutral.zone, null, 'the neutral zone belongs to nobody');
});

test('an icing lights the centre line and the FAR goal line', () => {
  // Rule 81's geometry. Which goal line follows from which end play restarted
  // in — 2,019 of 2,019 icings across 240 games restart at an end-zone dot.
  // Nothing draws a path: the feed records no trajectory and Doctrine §4 forbids
  // inventing one. These are the two lines the rulebook refers to.
  assert.deepEqual(run([stop('icing'), faceoff(-69, 22)]).whistles[0].lines, [0, 89],
    'restart in the home end — the puck crossed the away goal line');
  assert.deepEqual(run([stop('icing'), faceoff(69, -22)]).whistles[0].lines, [0, -89],
    'and the mirror');
});

test('an offside lights ONE blue line, and only when it can know which', () => {
  // 89.8% of offsides restart at a neutral-zone dot, where the nearest blue line
  // is unambiguous. The other 10% restart at centre ice or inside an end zone —
  // there we cannot say which line it was, so nothing is lit rather than the
  // nearer of two guesses.
  assert.deepEqual(run([stop('offside'), faceoff(-20, 22)]).whistles[0].lines, [-25]);
  assert.deepEqual(run([stop('offside'), faceoff(20, -22)]).whistles[0].lines, [25]);
  assert.deepEqual(run([stop('offside'), faceoff(0, 0)]).whistles[0].lines, [],
    'centre ice names no blue line');
  assert.deepEqual(run([stop('offside'), faceoff(-69, 22)]).whistles[0].lines, [],
    'nor does an end-zone restart, which is 4.9% of them');
});

test('a whistle with no restart has no zone and no lines', () => {
  // Both are read from the restart coordinate, so both must be absent when there
  // is no restart to read — and absent is not the same as zero.
  const w = run([stop('icing'), ev('period-end')]).whistles[0];
  assert.equal(w.placed, false);
  assert.equal(w.zone, null);
  assert.deepEqual(w.lines, []);
});

test('other stoppages light nothing, because their rules name no line', () => {
  for (const r of ['puck-frozen', 'high-stick', 'goalie-stopped-after-sog']) {
    assert.deepEqual(run([stop(r), faceoff(-69, 22)]).whistles[0].lines, [],
      `${r} lit a line it has no rule about`);
  }
});
