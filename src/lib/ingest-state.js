/**
 * What the front page says about its own data.
 *
 * This is the visible half of docs/ingest-state.md. A stalled pipeline becomes
 * something users and we can see, on a page we already control, with no
 * monitoring service in existence — Doctrine §3, honest limits stated on screen,
 * rather than a health check bolted on the side.
 *
 * EVERY LINE STATES A FACT, NEVER A DIAGNOSIS. "Last checked 4 days ago" is
 * observable. "The pipeline is broken" is a conclusion we would be drawing on
 * the reader's behalf, and it might be wrong — GitHub could be down, the season
 * could have ended, the league could have changed its feed. The reader can
 * conclude; we report. Same discipline as `whyNotEven` stating skater counts and
 * never intent.
 *
 * The cadence ships with the staleness for the same reason a save percentage
 * ships with the number of shots: "last checked 4 days ago" is uninterpretable
 * without knowing what normal is, and a rate without a base rate is a story
 * rather than a measurement (Doctrine §8). It applies to our own reliability as
 * much as to a goalie's.
 */

/** How long since a run before we say so. Policy, not a fact about hockey.
 *  The job runs every 24h, so 36 tolerates one missed run plus a delayed retry
 *  without crying wolf, and catches two consecutive failures. */
export const STALE_HOURS = 36;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/** "2023-11-10" -> "10 November 2023". Parsed by hand rather than with Date,
 *  which would apply the viewer's timezone to a date that has none and can slip
 *  a day westward. */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

/** Whole days between two instants, floored. */
export function daysBetween(then, now) {
  const a = Date.parse(then), b = Date.parse(now);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / 86400000);
}

function ago(then, now) {
  const h = (Date.parse(now) - Date.parse(then)) / 3600000;
  if (!Number.isFinite(h)) return 'at an unknown time';
  if (h < 1) return 'less than an hour ago';
  if (h < 48) return `${Math.floor(h)} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
}

/**
 * @param index     the parsed index.json, or null if it could not be loaded
 * @param now       ISO instant, injected so this is testable and deterministic
 * @returns {{state, lines: string[]}}
 *
 * ⚠️ THIS REPORTS ON THE PIPELINE AND ON NOTHING ELSE. It briefly also said when
 * the season reopens, which was the only forward-looking sentence on the page
 * and therefore landed in the only slot that existed at the time. `daily.js` is
 * that slot now, and CHENG's q4 ruling split the two: the season sentence goes
 * where a reader looks for what is next, the ledger half stays at the foot of
 * the page where a reader looks for what we hold. Printing both halves in both
 * places is what the ruling ruled against.
 *
 * `state` is a machine-readable label for styling; `lines` is what a reader
 * sees. The states are ordered by how much they tell you, not by severity:
 * a halt explains itself, so it outranks staleness, which is only a symptom.
 */
export function describe(index, now) {
  if (!index || typeof index !== 'object') {
    return { state: 'empty', lines: ['No data loaded yet.'] };
  }

  const lines = [];
  const through = formatDate(index.dataThrough);
  lines.push(through ? `Data through ${through}.` : 'No games loaded yet.');

  // A missing lastRun means an index written before this schema existed. Say so
  // rather than substituting the field it replaced -- reusing `lastIngest` here
  // would quietly reassert the conflation the schema exists to end.
  if (!index.lastRun) {
    lines.push('When we last checked is unknown.');
    return { state: 'unknown', lines };
  }

  const stale = daysBetween(index.lastRun, now) !== null &&
    (Date.parse(now) - Date.parse(index.lastRun)) / 3600000 >= STALE_HOURS;

  // A halt is the most informative thing we can tell a reader, and saying it
  // plainly reads as competence rather than apology: we noticed, and we stopped
  // rather than guess. Hiding it would mean knowing our data is incomplete and
  // not saying so, which is the one thing this project has never done.
  if (index.halted && index.halted.since) {
    const since = formatDate(String(index.halted.since).slice(0, 10));
    lines.push(`Updates paused${since ? ` ${since}` : ''}. The league's feed ` +
      `contains something we don't recognise yet, so we stopped rather than guess.`);
    if (stale) lines.push(`Checked daily. Last checked ${ago(index.lastRun, now)}.`);
    return { state: 'halted', lines };
  }

  if (stale) {
    lines.push(`Checked daily. Last checked ${ago(index.lastRun, now)}.`);
    return { state: 'stalled', lines };
  }

  const c = index.coverage;
  if (c && Number.isFinite(c.finalInWindow)) {
    const held = c.heldInWindow || 0;
    const unread = c.unknownStateInWindow || 0;

    // THE DENOMINATOR IS THE HOCKEY, NOT OUR COMPREHENSION OF IT.
    //
    // `finalInWindow` counts games we recognised as final, so games in a state
    // we cannot read are excluded from it — correctly, since we cannot claim
    // they are over. Using it as the denominator meant the page compared what we
    // hold against what we managed to understand, which flatters us exactly when
    // we are doing worst: "we have 10 of the 10 games played" with ninety more
    // played and dropped. At the limit it produced an outright false sentence —
    // every game unreadable gives zero, and the page announced "no games in the
    // last 14 days" over a full slate. Preseason guaranteed that: all 56 sit in
    // state FINAL, which we had never observed.
    //
    // Older indexes predate `gamesInWindow`, so reconstruct it rather than
    // defaulting to zero — defaulting would reintroduce the false sentence on
    // precisely the indexes written before the fix.
    // ⛔⛔ AND `gamesInWindow` IS NOT "PLAYED" EITHER — 2026-09-20, live.
    //
    // It counts every game the league LISTED, which on any evening includes the
    // ones starting later tonight. The front door read: "We have 8 of the 14
    // games played in the last 14 days. 6 are listed in a state we don't
    // recognise yet, so we haven't read them." Six of those fourteen were `LIVE`
    // or `FUT` — being played, or not started. We recognise both perfectly well,
    // and neither had been played.
    //
    // So the denominator moved once too far. `finalInWindow` was too small
    // because it excluded what we could not read; `gamesInWindow` is too large
    // because it includes what nobody has played. What belongs in it is every
    // game that is OVER as far as we can tell — the ones we read, plus the ones
    // we could not, which might be over and we cannot say. A game in progress is
    // neither held nor missing. It is not yet.
    //
    // Older indexes predate `pendingInWindow`, so it defaults to 0, which
    // reproduces the previous arithmetic exactly rather than inventing a
    // correction for a document that never carried the field.
    const pending = c.pendingInWindow || 0;
    const played = (Number.isFinite(c.gamesInWindow)
      ? c.gamesInWindow
      : c.finalInWindow + unread) - pending;

    if (played === 0) {
      /* ⚠️ AND "NO GAMES" WOULD BE A NEW FALSE SENTENCE ON OPENING NIGHT. Taking
         the unplayed games out of the denominator makes it zero on exactly the
         morning the league lists a full slate that starts this evening — 7
         games on 2026-09-19 — and "No games in the last 14 days" over a slate is
         the same shape of lie the denominator was changed to stop telling.
         The STATE stays `quiet`, because the observable it drives is still
         right: the daily card is carrying the next fixture, so this line has
         nothing to add and hides. Only the sentence has to be true. */
      lines.push(pending > 0
        ? `No games have finished in the last ${c.windowDays} days. `
          + `${pending} ${pending === 1 ? 'is' : 'are'} scheduled or being played now.`
        : `No games in the last ${c.windowDays} days.`);
      // ⭐ `quiet` MEANS THE LEAGUE LISTED NO GAMES -- we looked, recently, and
      // the window was empty -- so it is the one state where "no games" is a
      // fact about hockey rather than a symptom of us. That distinction is why
      // the season sentence could be attached here and to neither `stalled` nor
      // `halted`, which would have pinned a cheerful date onto a sentence about
      // our own failure with the reader unable to tell which half to believe.
      //
      // IT IS STILL NOT A DIAGNOSIS, which is this file's standing rule. The
      // page does not say "the season is over" -- that is a conclusion, and this
      // state is equally what a mid-season league-wide pause looks like.
      return { state: 'quiet', lines };
    }
    if (held < played) {
      // "Still loading" would promise progress we cannot guarantee — a claim
      // about a future rather than a count. The duller sentence is the true one.
      lines.push(`We have ${held} of the ${played} games played in ` +
        `the last ${c.windowDays} days.`);
      // Two different facts, so two sentences. Refused means we hold the bytes
      // and the event vocabulary defeated us; unreadable means we never fetched,
      // because the league lists the game in a state we cannot interpret as
      // over. Folding them together would report a cause we have not established.
      if (c.refusedInWindow > 0) {
        lines.push(`${c.refusedInWindow} ${c.refusedInWindow === 1 ? 'is' : 'are'} ` +
          `not published — the league's feed contains something we don't recognise.`);
      }
      if (unread > 0) {
        lines.push(`${unread} ${unread === 1 ? 'is' : 'are'} listed in a ` +
          `state we don't recognise yet, so we haven't read ${unread === 1 ? 'it' : 'them'}.`);
      }
      return { state: 'behind', lines };
    }
  }

  return { state: 'current', lines };
}
