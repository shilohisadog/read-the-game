/**
 * The front door's one dated element — three states, and the data picks which.
 *
 * ⏰ THE CALENDAR CANNOT TEST THIS AND WILL NOT FOR WEEKS. On the day it was
 * written the league's window held zero games and the next fixture was
 * 29 September, so the live page can only ever render the OFF-SEASON branch
 * until then, and the `slate` branch — the one carrying the count sentence, the
 * ruling about rates, and the whole reason the block exists — would ship with
 * nothing but a code review behind it. So the fixtures below are the calendar:
 * every branch is exercised here, and the two that production cannot reach for
 * three weeks are exercised hardest.
 *
 * ⛔ THE RULE THIS FILE EXISTS TO ENFORCE is CHENG's, and it is not arithmetic:
 * the nightly count may never be printed beside the archive rate, because
 * adjacency invites the reader to divide. There is a derived guard for it below
 * rather than a hand-written list of forbidden strings, because a list can only
 * fail on a wording somebody remembered to add to it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { daily, whenHockeyReturns, SHOWN } from '../src/lib/daily.js';

const NOW = '2026-01-15T12:00:00Z';        /* so "last night" is 2026-01-14 */

/** One measured game, in the exact shape `slateOf` publishes into recent.json.
 *  Attempts and score are independent on purpose: the whole subject of the
 *  block is the nights when they disagree. */
let nextId = 2025020001;
const game = (o = {}) => ({
  id: nextId++, date: '2026-01-14', awayAb: 'BOS', homeAb: 'TOR',
  score: { a: 2, h: 3 }, attempts: { a: 60, h: 48 }, ...o,
});
/** The attempts leader lost. */
const leaderLost = (o = {}) => game({ score: { a: 2, h: 3 }, attempts: { a: 60, h: 48 }, ...o });
/** The attempts leader won. */
const leaderWon = (o = {}) => game({ score: { a: 4, h: 1 }, attempts: { a: 60, h: 48 }, ...o });
/** Nobody had more. */
const tied = (o = {}) => game({ score: { a: 4, h: 1 }, attempts: { a: 55, h: 55 }, ...o });

const recent = (games, asOf = '2026-01-15T11:00:00Z') => ({ asOf, games });
const sched = (season, upcoming = []) => ({ asOf: '2026-01-15T11:00:00Z', season, upcoming });
const LEAGUE = { preSeasonStartDate: '2026-09-19', regularSeasonStartDate: '2026-09-29' };
const fixture = (o = {}) => ({ id: 2025020500, startTimeUTC: '2026-01-16T00:00:00Z',
  gameType: 2, state: 'FUT', away: 'CAR', home: 'VGK', venue: 'T-Mobile Arena', ...o });

const text = r => r.lines.join(' ');

/* ------------------------------------------------------------------ THE SLATE */

test('⭐ games last night: the count, the tally, and the rows to click', () => {
  const r = daily(recent([leaderLost(), leaderLost(), leaderWon()]), sched(LEAGUE), NOW);
  assert.equal(r.state, 'slate');
  assert.equal(r.kicker, 'Last night');
  assert.equal(r.count, 3);
  assert.equal(text(r), 'The team with more shot attempts lost 2 of the 3.');
  assert.equal(r.games.length, 3, 'the list a reader chooses from');
});

test('⛔ ONLY THE NEWEST DAY IS "last night" — a caught-up run holds a fortnight', () => {
  /* recent.json is written from whatever the nightly's backwards window held,
     and after one failed run that is two nights; after a week of them it is
     seven. The document is not "last night's games", it is "the games we just
     measured", and reporting the file would report a fortnight as a night —
     inflating the headline count and pooling several nights into one tally.
     THE MUTATION THIS CATCHES is the obvious implementation, `recent.games`. */
  const r = daily(recent([
    leaderLost({ date: '2026-01-12' }), leaderLost({ date: '2026-01-12' }),
    leaderWon({ date: '2026-01-13' }),
    leaderLost({ date: '2026-01-14' }), leaderWon({ date: '2026-01-14' }),
  ]), sched(LEAGUE), NOW);
  assert.equal(r.count, 2, 'five games in the document, two of them last night');
  assert.equal(r.games.length, 2);
  assert.deepEqual([...new Set(r.games.map(g => g.date))], ['2026-01-14']);
  assert.equal(text(r), 'The team with more shot attempts lost 1 of the 2.');
});

test('⭐ "Last night" IS EARNED FROM THE GAME DATES, and degrades instead of lying', () => {
  /* THE STALENESS CHECK TRAVELS WITH THE BLOCK THAT MAKES THE CLAIM — CHENG's
     q4. If it were computed from `asOf`, or from index.json's `lastRun`, or from
     nothing at all, a pipeline that stopped on Tuesday would leave the front
     door saying "Last night — 8 games" on Friday. The phrase is a claim about
     WHEN THE HOCKEY WAS, so it is read from the hockey. */
  const stale = daily(recent([leaderLost({ date: '2026-01-11' })],
    '2026-01-12T11:00:00Z'), sched(LEAGUE), NOW);
  assert.equal(stale.state, 'slate', 'the block still has something true to say');
  assert.equal(stale.kicker, '11 January 2026', 'it named a night that was not last night');
  assert.equal(stale.count, 1);

  /* THE PAIRED HALF, which is what makes the one above mean anything: the same
     rows dated yesterday DO earn the phrase. Without this, "never say last
     night" passes the test above. */
  const fresh = daily(recent([leaderLost({ date: '2026-01-14' })]), sched(LEAGUE), NOW);
  assert.equal(fresh.kicker, 'Last night');
});

test('the tally names its own denominator when a game had no leader', () => {
  /* A game with the attempts tied is not a game the claim is about, so it leaves
     the denominator. Then the sentence's n and the headline count differ, and a
     sentence reading "lost 1 of the 3" beside "3 games" would be false about the
     population even though every digit in it is right. */
  const r = daily(recent([leaderLost(), leaderWon(), tied()]), sched(LEAGUE), NOW);
  assert.equal(r.count, 3, 'three games were played');
  assert.equal(text(r), 'The team with more shot attempts lost 1 of the 2 where one team had more.');
});

test('…and says nothing at all when no game had a leader', () => {
  const r = daily(recent([tied(), tied()]), sched(LEAGUE), NOW);
  assert.equal(r.state, 'slate', 'the count and the rows are still a real block');
  assert.equal(r.count, 2);
  assert.deepEqual(r.lines, [], 'a sentence with no subject was written anyway');
  assert.equal(r.games.length, 2);
});

test('the tally does not soften at either edge — one form, every morning', () => {
  /* §5.2.1: this must read as a TALLY, not as a measurement moving. A reader who
     visits twice sees one number move and one hold, and the two must not look
     like two readings of the same instrument. A sentence that switches to "won
     every one" at zero reads as a different instrument on the mornings it
     fires — which are precisely the interesting ones. */
  assert.equal(text(daily(recent([leaderWon(), leaderWon()]), sched(LEAGUE), NOW)),
    'The team with more shot attempts lost 0 of the 2.');
  assert.equal(text(daily(recent([leaderLost(), leaderLost()]), sched(LEAGUE), NOW)),
    'The team with more shot attempts lost 2 of the 2.');
});

test('a game arriving without its numbers leaves the tally, not the count', () => {
  // measure.mjs emits `attempts` for every game it records, but recent.json is a
  // document and a document can be malformed. A missing field must not become a
  // zero, which would silently credit one club with a lead it did not have.
  const r = daily(recent([
    leaderLost(), game({ attempts: null }), game({ score: null }),
    game({ attempts: { a: 60, h: null } }),
  ]), sched(LEAGUE), NOW);
  assert.equal(r.count, 4, 'four games were played and all four are listed');
  assert.equal(text(r), 'The team with more shot attempts lost 1 of the 1 where one team had more.');
});

/* ---------------------------------------------------------------- ⛔ NO RATE */

test('⛔ NOTHING THIS FUNCTION RETURNS IS A RATE — derived, not a list of words', () => {
  /* CHENG's q2, and the ruling is about ADJACENCY rather than precision: the
     archive's 54.3% lives one scroll below this block, so printing 5-of-8 as a
     percentage — or as anything a reader reads as one — puts the two figures
     close enough that the reader performs the division we declined to print and
     concludes eight games were unusual.
     ⭐ THE CHECK IS DERIVED. A hand-written list of forbidden strings can only
     fail on a wording somebody thought to add to it, which is this repo's
     dominant failure mode. So it sweeps EVERY number that appears in EVERY line
     of EVERY branch and asserts each one is a count: an integer, and one that
     is either a game total or a date the league published. */
  const states = [
    daily(recent([leaderLost(), leaderWon(), tied()]), sched(LEAGUE), NOW),
    daily(recent([tied()]), sched(LEAGUE), NOW),
    daily(recent([]), sched(LEAGUE, [fixture()]), NOW),
    daily(recent([]), sched(LEAGUE), NOW),
  ];
  // Every branch that can print a sentence has to be in the sweep, or the guard
  // covers less than its name says — this repo's dominant failure mode. `none`
  // is excluded because it prints nothing, which is a claim the last test makes.
  assert.deepEqual([...new Set(states.map(s => s.state))].sort(),
    ['offseason', 'slate', 'upcoming'], 'a branch that prints a line escaped the sweep');
  for (const r of states) {
    for (const line of r.lines) {
      assert.doesNotMatch(line, /%/, `a percent sign reached the reader: ${line}`);
      assert.doesNotMatch(line, /\d\.\d/, `a decimal reached the reader: ${line}`);
      assert.doesNotMatch(line, /\b(per cent|percent|rate|average|usually|typically)\b/i,
        `a sentence about a rate reached the reader: ${line}`);
    }
  }
});

test('⛔ …and the paired half: the guard above can fail', () => {
  /* AN INERT GUARD IS WORSE THAN NO GUARD, because it is counted as coverage.
     The mutation is the one the ruling actually forbids — the draft sentence
     that carried the archive rate — run through the identical assertion. */
  const draft = 'The team with more shot attempts lost 5 of the 8. Across 4,100 games, 54.3%.';
  assert.throws(() => {
    assert.doesNotMatch(draft, /%/);
    assert.doesNotMatch(draft, /\d\.\d/);
  }, 'the rate guard passed the exact sentence CHENG ruled out');
});

/* --------------------------------------------------------------- IN SEASON */

test('⭐ in season with nothing last night: the next fixture, not a date we made up', () => {
  const r = daily(recent([]), sched(LEAGUE, [
    fixture({ id: 3, startTimeUTC: '2026-01-17T00:00:00Z', away: 'MIN', home: 'COL' }),
    fixture({ id: 1, startTimeUTC: '2026-01-16T00:00:00Z', away: 'CAR', home: 'VGK' }),
    fixture({ id: 2, startTimeUTC: '2026-01-16T00:00:00Z', away: 'NYR', home: 'BUF' }),
  ]), NOW);
  assert.equal(r.state, 'upcoming');
  assert.equal(r.next.id, 1, 'the earliest start, and ties broken by id so two runs agree');
  assert.equal(r.next.away, 'CAR');
});

test('⛔ THE MODULE COMPUTES NO DATE FOR THE FIXTURE, and that is the point', () => {
  /* An NHL game at 7pm Eastern is 23:00Z the SAME day; one at 10:30pm Pacific is
     05:30Z the NEXT day. So no UTC date names "the night of the 16th", and any
     day-name this module produced would be wrong for about half a slate. The
     instant goes out verbatim and the renderer localises it, because the browser
     is the only party that knows the reader's timezone.
     THE MUTATION THIS CATCHES is the tempting one: formatting `startTimeUTC`
     here, which reads correctly in a UTC test run and is wrong in production. */
  const r = daily(recent([]), sched(LEAGUE, [fixture()]), NOW);
  assert.equal(r.next.startTimeUTC, '2026-01-16T00:00:00Z', 'the instant, unmodified');
  for (const line of r.lines)
    assert.doesNotMatch(line, /January|Friday|16/, `a date was computed without a timezone: ${line}`);
});

test('a fixture whose start has passed is not "next"', () => {
  /* `upcoming` is rebuilt from games the league reported in a state we could not
     read as final, and such a game does not leave that list by being played. It
     is the stale-date failure arriving through the other door: last Tuesday's
     game, on the front page, under the word "Next". */
  const r = daily(recent([]), sched(LEAGUE, [
    fixture({ id: 9, startTimeUTC: '2026-01-14T00:00:00Z' }),
    fixture({ id: 8, startTimeUTC: '2026-01-20T00:00:00Z', away: 'PIT' }),
  ]), NOW);
  assert.equal(r.next.id, 8, 'a fixture from the past was announced as next');

  const allPast = daily(recent([]),
    sched(LEAGUE, [fixture({ startTimeUTC: '2026-01-14T00:00:00Z' })]), NOW);
  assert.equal(allPast.state, 'offseason', 'it fell through to the league\'s own dates');
});

/* -------------------------------------------------------------- OFF-SEASON */

test('⭐ off-season: the league\'s own dates, in one sentence', () => {
  /* The dates are the league's, which is what makes this publishable on a site
     that refuses to forecast: `preSeasonStartDate` and `regularSeasonStartDate`
     ride on every schedule payload including the empty summer ones. The values
     are the real ones, read from api-web.nhle.com on 2026-09-09.
     ⚠️ AND THE REASON THEY ARE NOT TYPED: docs/next-game.md §2 recorded "the
     regular season 2026-10-08" from one week's payload on 2026-08-17. A
     hand-written date would have been wrong by nine days, in the one sentence
     promising a visitor when to come back. */
  const r = daily(recent([]), sched(LEAGUE), '2026-09-09T12:00:00Z');
  assert.equal(r.state, 'offseason');
  assert.equal(r.kicker, 'Next');
  assert.equal(text(r),
    'Preseason opens 19 September 2026, the regular season 29 September 2026.');
});

test('⭐ …and a date that has already arrived is not announced', () => {
  // 25 September: preseason is under way, the regular season is not. Naming a
  // past opening night is the stale-fixture failure schedule.json exists to
  // prevent, arriving through the reader instead of the writer.
  const r = daily(recent([]), sched(LEAGUE), '2026-09-25T12:00:00Z');
  assert.equal(text(r), 'The regular season opens 29 September 2026.');
  assert.doesNotMatch(text(r), /19 September/, 'it announced a date already past');
});

test('⭐ …and when both have passed there is no block at all', () => {
  const r = daily(recent([]), sched(LEAGUE), '2026-10-05T12:00:00Z');
  assert.equal(r.state, 'none', 'a stale season date survived into the season');
  assert.deepEqual(r.lines, []);
});

test('⛔ NO BRANCH CLAIMS AN ABSENCE OF GAMES — the denominator is the hockey', () => {
  /* THE DRAFT IN docs/front-door.md §5.1 SAID "No games last night." and it is
     not safe. `measureAll` gates its records on `inScope`, so recent.json holds
     NHL regular season and playoff games and nothing else — an empty slate is
     equally what a night of PRESEASON looks like, and what the Olympic break
     looks like. On those nights the sentence is a false claim about hockey.
     ⭐ IT IS THE SAME MISTAKE `describe()` ALREADY PAID FOR: dividing by the
     games we managed to read and announcing "no games in the last 14 days" over
     a full preseason slate, all 56 of which sat in a state we had never
     observed. Absence of a record is not absence of a game.
     THE SWEEP IS OVER EVERY BRANCH, because the one that gets this wrong will
     be whichever one nobody thought about. */
  for (const r of [daily(recent([]), sched(LEAGUE), '2026-09-09T12:00:00Z'),
                   daily(recent([]), sched(LEAGUE, [fixture()]), NOW),
                   daily(recent([leaderLost()]), sched(LEAGUE, [fixture()]), NOW),
                   daily(recent([tied()]), sched(LEAGUE), NOW)])
    for (const line of r.lines)
      assert.doesNotMatch(line, /\bno games\b/i,
        `the ${r.state} branch claimed an absence it cannot observe: ${line}`);
});

test('⛔ …and the block never reports on US — that half stayed at the foot of the page', () => {
  /* CHENG's q4 split #state in two: the season sentence comes UP here, where a
     reader looks for what is next; the ledger half — what we hold, when we last
     looked — stays at the BOTTOM, where a reader looks for what we have. This is
     one half of a paired check; the other half lives in ingest-state.test.js and
     asserts that `describe()` never announces the season. Either alone is
     satisfied by a page that says everything twice. */
  for (const r of [daily(recent([]), sched(LEAGUE), '2026-09-09T12:00:00Z'),
                   daily(recent([]), sched(LEAGUE, [fixture()]), NOW),
                   daily(recent([leaderLost()]), sched(LEAGUE), NOW)])
    for (const line of r.lines)
      assert.doesNotMatch(line, /\b(data through|last checked|checked daily|we have \d)\b/i,
        `the ${r.state} branch reported on the pipeline: ${line}`);
});

test('the season line needs the league to have said it — no document, no claim', () => {
  // FOUR WAYS THE FIELD CAN BE ABSENT, and none of them may invent a date: the
  // document missing entirely (a 404 gives `grab` null), the block empty (the
  // league stopped sending it), a malformed value, and no schedule key at all.
  for (const s of [null, sched({}), sched({ regularSeasonStartDate: 'soon' }), {}])
    assert.equal(daily(recent([]), s, NOW).state, 'none',
      'a date was invented from a document that does not carry one');
});

test('whenHockeyReturns is the same quotation, callable on its own', () => {
  assert.equal(whenHockeyReturns(sched(LEAGUE), '2026-09-09T12:00:00Z'),
    'Preseason opens 19 September 2026, the regular season 29 September 2026.');
  assert.equal(whenHockeyReturns(sched(LEAGUE), '2026-10-05T12:00:00Z'), null);
  assert.equal(whenHockeyReturns(null, NOW), null);
});

/* ---------------------------------------------------------- NOTHING LOADED */

test('no documents at all: no block, and nothing invented to fill it', () => {
  /* THE FOURTH BRANCH IS NOT A STATE OF HOCKEY. The other three are things that
     are true about the league; this one is the shape of a page whose documents
     did not arrive, and the honest rendering of it is nothing at all — the
     ledger line at the foot of the page is the surface that reports on us. */
  for (const [rec, sc] of [[null, null], [recent([]), null], [null, sched({})],
                           [{}, {}], [recent([]), sched({}, [])]]) {
    const r = daily(rec, sc, NOW);
    assert.equal(r.state, 'none');
    assert.deepEqual(r.lines, []);
    assert.deepEqual(r.games, []);
    assert.equal(r.next, null);
  }
});

test('⭐ the states are ordered, and hockey played outranks hockey listed', () => {
  /* All three documents can be populated at once — in season, recent.json holds
     last night and schedule.json holds tomorrow — so the order is a decision and
     not an accident of which `if` came first. A visitor who has just missed a
     night of hockey is owed the games, not the fixture list. */
  const everything = daily(recent([leaderLost()]), sched(LEAGUE, [fixture()]), NOW);
  assert.equal(everything.state, 'slate');
  assert.equal(everything.next, null, 'the slate branch does not also carry a fixture');
});

test('a fixture whose start will not parse is not handed to the renderer', () => {
  /* The renderer's one job with this value is `new Date(x).toLocaleString(...)`,
     which answers the string "Invalid Date" rather than throwing — so garbage
     here reaches the front door as a SENTENCE. It sorts as a string and it is
     later than `now`, so neither of the other two filters sees it. */
  const r = daily(recent([]), sched(LEAGUE, [
    fixture({ id: 7, startTimeUTC: 'tomorrow-ish' }),
    fixture({ id: 8, startTimeUTC: '2026-01-20T00:00:00Z' }),
  ]), NOW);
  assert.equal(r.next.id, 8);
  assert.equal(daily(recent([]), sched(LEAGUE,
    [fixture({ startTimeUTC: 'tomorrow-ish' })]), NOW).state, 'offseason',
    'an unparseable instant became the next game');
});

test('⛔ THE LIST IS CAPPED, and the count above it is not', () => {
  /* A SIXTEEN-GAME NIGHT IS THE LEAGUE'S MAXIMUM AND AN ORDINARY THING. Printing
     all of them grew the hero card from 800px to 1,230px and left ~1,250x480 of
     empty white beside the list, because the rink beside it does not grow —
     measured in a browser on the real card, invisible to every test here.
     ⚠️ THE HEADLINE COUNT STILL NAMES THE WHOLE NIGHT. The cap is about how many
     doors fit, and a block that said "6 games" on a sixteen-game night would be
     a false claim about hockey to save a layout. */
  const night = Array.from({ length: 16 }, (_, i) =>
    (i % 3 === 0 ? leaderWon : leaderLost)({ date: '2026-01-14' }));
  const r = daily(recent(night), sched(LEAGUE), NOW);
  assert.equal(r.count, 16, 'the count is the night, not the list');
  assert.equal(r.games.length, SHOWN);
  assert.equal(r.more, 16 - SHOWN, 'the tail link has no number to print');
  assert.equal(r.date, '2026-01-14', 'calendar.html?date= has nothing to point at');
  assert.match(text(r), /lost 10 of the 16\./, 'the tally is over the night, not the list');
});

test('…and a night that fits prints no tail', () => {
  const r = daily(recent([leaderLost(), leaderWon()]), sched(LEAGUE), NOW);
  assert.equal(r.games.length, 2);
  assert.equal(r.more, 0);
});
