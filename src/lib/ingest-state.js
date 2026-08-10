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
 * @param index  the parsed index.json, or null if it could not be loaded
 * @param now    ISO instant, injected so this is testable and deterministic
 * @returns {{state, lines: string[]}}
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
    if (c.finalInWindow === 0) {
      lines.push(`No games in the last ${c.windowDays} days.`);
      return { state: 'quiet', lines };
    }
    if (held < c.finalInWindow) {
      // "Still loading" would promise progress we cannot guarantee — a claim
      // about a future rather than a count. The duller sentence is the true one.
      lines.push(`We have ${held} of the ${c.finalInWindow} games played in ` +
        `the last ${c.windowDays} days.`);
      if (c.refusedInWindow > 0) {
        lines.push(`${c.refusedInWindow} ${c.refusedInWindow === 1 ? 'is' : 'are'} ` +
          `not published — the league's feed contains something we don't recognise.`);
      }
      return { state: 'behind', lines };
    }
  }

  return { state: 'current', lines };
}
