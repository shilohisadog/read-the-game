/**
 * The one element on the front door whose content is a function of the date.
 *
 * docs/front-door.md §3 stated the finding as an invariant rather than a
 * preference: BEFORE THIS, NO ELEMENT ABOVE THE FOLD CHANGED FROM ONE DAY TO
 * THE NEXT. The hero moves when the archive gains a game, which in season is
 * most mornings and for four months is never; everything else on the page is a
 * fact about the collection. A visitor had no way to tell a return visit from a
 * first one, which is the whole of the recurrence problem.
 *
 * ⭐ THREE STATES, AND THE DATA PICKS WHICH — there is no empty state, because
 * every branch here is a real sentence. `recent.json` says what the nightly just
 * measured; `schedule.json` says what the league has listed ahead. Between them
 * there is always something true to say, and the fourth branch (`none`) is not a
 * state of hockey but the shape of a page whose documents did not load.
 *
 * ⛔ IT PRINTS COUNTS AND NEVER A RATE. This is CHENG's ruling of 2026-09-09 and
 * it is not the `a fraction never a percentage` convention, which guards
 * PRECISION a small n cannot carry. The danger here is ADJACENCY: put `5 of 8`
 * beside the archive's 54.3% and the reader performs the division we declined to
 * print, gets 62.5%, and concludes last night was unusual. Eight games cannot
 * support "unusual". The archive figure keeps its own home under the hero, where
 * its n is four thousand. Nothing in this file may ever compute a rate, and the
 * reason it may not is that the two figures would be one scroll apart.
 *
 * ⚠️ AND THE STALENESS CHECK TRAVELS WITH THE BLOCK THAT SAYS "LAST NIGHT".
 * `describe()` reports on the pipeline; this reports on the games. If they were
 * allowed to disagree — a stalled ingest at the bottom of the page and a
 * confident "last night" at the top — the page would carry its own contradiction
 * above its own admission of it. So the phrase "Last night" is earned from the
 * GAME DATES themselves and not from any timestamp: if the newest game we hold
 * was not played yesterday, the block names the day it was, and the claim
 * degrades instead of going false. That is the same instrument reporting a
 * different fact, rather than two instruments reporting the same one.
 */

import { formatDate } from './ingest-state.js';

/**
 * ⛔ HOW MANY DOORS THE BLOCK PRINTS, AND THE NUMBER IS A MEASUREMENT.
 *
 * The block sits in the sixth row of the hero's grid, and that row's height is
 * SLACK — what is left of column one after the frame has set the card's height.
 * Measured at 1900 with the real card: about 440px, of which the kicker and the
 * sentence take ~100 and each row is 42. So six rows fill it and the card keeps
 * the shape it has on a quiet night.
 *
 * ⚠️ WITHOUT A CAP THE LAYOUT FAILS ON THE ORDINARY CASE, and only looking found
 * it. A sixteen-game night — the league's maximum, and 13 January 2024 is a real
 * one — grew the card from 800px to 1,230px and left roughly 1,250 x 480 of
 * empty white beside the list, because the rink does not grow with it. Every
 * unit test was green through that, as they had to be: they cannot see a pixel.
 *
 * THE REST ARE NOT LOST. `calendar.html?date=` already renders a whole night and
 * shows more than this block can — the games we hold but cannot publish appear
 * there and can never appear here. So the tail is a better door than the rows it
 * replaces, not a truncation apologising for itself.
 */
export const SHOWN = 6;

/** "2026-06-14" one day earlier, in the same date-only arithmetic the league's
 *  own fields use. `Date` is deliberately kept out of it: a date with no
 *  timezone put through the viewer's offset can slip a day westward, and this
 *  comparison decides whether the page prints the word "Last night". */
function dayBefore(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const d = Date.UTC(+m[1], +m[2] - 1, +m[3]) - 86400000;
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * The games on the newest date the slate holds.
 *
 * `recent.json` is written from whatever the nightly's backwards window
 * happened to contain, which is up to fourteen days of games after a run that
 * caught up from a failure. "Last night" is a suffix of that list — `slateOf`
 * sorts by date for exactly this — and taking the whole file would report a
 * fortnight as a night.
 */
function newestDay(games) {
  const rows = (games || []).filter(g => g && typeof g.date === 'string');
  if (!rows.length) return { date: null, rows: [] };
  const date = rows.reduce((max, g) => (g.date > max ? g.date : max), rows[0].date);
  return { date, rows: rows.filter(g => g.date === date) };
}

/**
 * ⛔ COUNTS ONLY. Returns how many of these games had an attempts leader at all,
 * and how many times that leader lost. It returns no rate and the caller cannot
 * derive one it is willing to print — see this file's header.
 *
 * A GAME WITH THE ATTEMPTS TIED IS NOT A GAME THE CLAIM IS ABOUT, so it leaves
 * the denominator rather than being counted as a win for either side. That is
 * the same handling `archive.js` gives a tie, and it is why the sentence prints
 * its own n instead of reusing the night's game count: on a night where one game
 * ties, "5 of the 8" would be false and "5 of the 7" is not the headline number.
 */
function attemptsTally(rows) {
  let n = 0, lost = 0;
  for (const g of rows) {
    const a = g && g.attempts, s = g && g.score;
    if (!a || !s) continue;
    if (!Number.isFinite(a.h) || !Number.isFinite(a.a)) continue;
    if (!Number.isFinite(s.h) || !Number.isFinite(s.a)) continue;
    if (a.h === a.a) continue;
    n += 1;
    const leaderScore = a.h > a.a ? s.h : s.a;
    const otherScore = a.h > a.a ? s.a : s.h;
    if (leaderScore < otherScore) lost += 1;
  }
  return { n, lost };
}

/**
 * The next fixture the league has listed and we have not yet played past.
 *
 * ⚠️ THE FILTER IS `startTimeUTC > now`, NOT "everything in the document".
 * `upcoming` is rebuilt each run from the games the payload reported in a state
 * we could not read as final, and a game stuck in such a state does not leave
 * that list by being played. Announcing it as "next" would put a fixture from
 * last Tuesday on the front door under the word "next", which is the stale-date
 * failure `whenHockeyReturns` was written to avoid, arriving through the other
 * door.
 *
 * ⚠️ AND THE DATE IS NOT COMPUTED HERE. An NHL game starting at 7pm Eastern is
 * 23:00Z the same day; one starting at 10:30pm Pacific is 05:30Z the NEXT day.
 * So there is no UTC date that names "the night of the 29th", and any grouping
 * or day-name this module produced would be wrong for roughly half the slate.
 * The instant is returned verbatim and the RENDERER localises it, which is the
 * only place that knows the reader's timezone and is therefore the only place
 * that can be right.
 */
function nextFixture(schedule, now) {
  const rows = ((schedule && schedule.upcoming) || [])
    /* ⚠️ AND IT MUST PARSE. The renderer's only job with this value is
       `new Date(startTimeUTC).toLocaleString(...)`, which answers "Invalid Date"
       rather than throwing — so an unparseable instant would reach the front
       door as a sentence, not as an error. A value this module will not vouch
       for is not handed on. */
    .filter(g => g && typeof g.startTimeUTC === 'string' && g.startTimeUTC > now
      && Number.isFinite(Date.parse(g.startTimeUTC)))
    .sort((a, b) => (a.startTimeUTC === b.startTimeUTC
      ? (a.id || 0) - (b.id || 0)
      : (a.startTimeUTC < b.startTimeUTC ? -1 : 1)));
  return rows.length ? rows[0] : null;
}

/**
 * ⭐ WHEN HOCKEY COMES BACK, IN THE LEAGUE'S OWN WORDS.
 *
 * The league puts `preSeasonStartDate` and `regularSeasonStartDate` on every
 * schedule payload, INCLUDING the empty ones it answers with all summer, and the
 * nightly copies them into schedule.json. So this is a quotation, not a calendar
 * of ours and not a forecast: the one thing on this site that is about the
 * future is a date the league published.
 *
 * IT IS ALSO WHY THE DATE IS NEVER TYPED. `docs/next-game.md` recorded "the
 * regular season 2026-10-08" on 2026-08-17 from one week's payload; the league's
 * own field said 2026-09-29 three weeks later. A constant that goes wrong once a
 * year with nobody touching it is exactly what this project instruments against.
 *
 * ONLY DATES THAT HAVE NOT ARRIVED. A boundary in the past is not news, and
 * naming one would leave the front page announcing an opening night that already
 * happened.
 *
 * ⚠️ THE COMPARISON IS DATE-TO-DATE AND DELIBERATELY COARSE. The league's dates
 * carry no timezone and `now` is an instant, so a reader west of the venue can
 * see "opens 29 September" for a few hours of their 29 September. `>=` rather
 * than `>` for the same reason: dropping the sentence on the very day it becomes
 * true would be the worse error, and by the day games are actually played there
 * is a fixture in `upcoming` and this branch no longer runs.
 */
export function whenHockeyReturns(schedule, now) {
  const s = (schedule && schedule.season) || {};
  const today = String(now || '').slice(0, 10);
  const ahead = [
    ['preSeasonStartDate', 'preseason'],
    ['regularSeasonStartDate', 'the regular season'],
  ].filter(([k]) => typeof s[k] === 'string' && s[k] >= today && formatDate(s[k]))
    .sort((a, b) => (s[a[0]] < s[b[0]] ? -1 : 1));

  if (!ahead.length) return null;
  // The verb is stated once and the rest of the list hangs off it, so two dates
  // are one sentence rather than two: "Preseason opens 19 September 2026, the
  // regular season 29 September 2026."
  const [[firstKey, firstLabel], ...rest] = ahead;
  const head = firstLabel[0].toUpperCase() + firstLabel.slice(1);
  return `${head} opens ${formatDate(s[firstKey])}`
    + rest.map(([k, label]) => `, ${label} ${formatDate(s[k])}`).join('') + '.';
}

/**
 * @param recent    the parsed recent.json, or null if it could not be loaded
 * @param schedule  the parsed schedule.json, or null
 * @param now       ISO instant, injected so this is testable and deterministic
 *
 * @returns {{state, kicker, count, lines, games, next}}
 *   state   'slate' | 'upcoming' | 'offseason' | 'none'
 *   kicker  the label above the block, or null
 *   count   how many games the kicker's day holds, or null
 *   lines   COMPLETE sentences, ready to print as written
 *   games   the slate's rows to print, capped at `SHOWN` — see there for why
 *   more    how many of that night's games the cap left out, for the tail link
 *   date    the night the rows are from, for `calendar.html?date=`
 *   next    the fixture whose start instant only the browser can localise, or
 *           null. ⚠️ IT IS THE ONE PIECE `lines` DOES NOT CARRY — see
 *           `nextFixture` for why a date cannot be computed here — so a renderer
 *           that ignores it prints a state with no "when" in it.
 */
export function daily(recent, schedule, now) {
  const none = { state: 'none', kicker: null, count: null, lines: [], games: [],
    date: null, more: 0, next: null };

  const { date, rows } = newestDay(recent && recent.games);
  if (rows.length) {
    const yesterday = dayBefore(String(now || '').slice(0, 10));
    // The word is earned from the games, not from a clock. See the header.
    const kicker = date === yesterday ? 'Last night' : formatDate(date);
    if (!kicker) return none;
    const lines = [];
    const { n, lost } = attemptsTally(rows);
    // n === 0 means every game we hold for that day had the attempts tied or
    // arrived without them. There is no sentence to write, and the count plus
    // the list are still a real block.
    if (n > 0) {
      // ⛔ ONE FORM, AND IT DOES NOT SOFTEN AT THE EDGES. "lost 0 of the 8" is
      // duller than "won every one", and duller is the point: §5.2.1 requires
      // this to read as a tally rather than as a measurement moving, and a tally
      // that changes its wording when it hits zero reads as a different
      // instrument each morning. The only variation permitted is the clause
      // below, which exists because without it the sentence would be false.
      const tail = n === rows.length
        ? `the ${n}.`
        : `the ${n} where one team had more.`;
      lines.push(`The team with more shot attempts lost ${lost} of ${tail}`);
    }
    return { state: 'slate', kicker, count: rows.length, lines, date,
      games: rows.slice(0, SHOWN), more: Math.max(0, rows.length - SHOWN), next: null };
  }

  const next = nextFixture(schedule, now);
  if (next) {
    /* ⛔ IT DOES NOT SAY "NO GAMES LAST NIGHT", and the draft in
       docs/front-door.md §5.1 did. `measureAll` gates its records on `inScope`,
       so recent.json holds NHL regular season and playoff games and nothing
       else — an empty slate is therefore also what a night of PRESEASON looks
       like, and what the Olympic break looks like, and on those nights the
       sentence would be a false claim about hockey.
       ⭐ IT IS THE DENOMINATOR MISTAKE AGAIN, WHICH THIS PROJECT HAS PAID FOR
       ONCE. `describe()` used to divide by the games it had managed to read and
       announced "no games in the last 14 days" over a full preseason slate; the
       rule that came out of it is that THE DENOMINATOR IS THE HOCKEY, NOT OUR
       COMPREHENSION OF IT. Absence of a record is not absence of a game, so the
       block claims no absence at all and answers the question a reader on a dark
       night is actually asking, which is when the next one is. */
    return { state: 'upcoming', kicker: 'Next', count: null,
      lines: [], games: [], date: null, more: 0, next };
  }

  const back = whenHockeyReturns(schedule, now);
  if (back) {
    // NO "no games last night" HERE. In July that sentence is technically true
    // and reads as a fault report; the ledger line at the foot of the page
    // already states what we hold and that the window is empty, and this block's
    // job in the off-season is the half that looks forward. Splitting it that
    // way is CHENG's q4 ruling, and printing both halves in both places is what
    // it ruled against.
    return { state: 'offseason', kicker: 'Next', count: null,
      lines: [back], games: [], date: null, more: 0, next: null };
  }

  return none;
}