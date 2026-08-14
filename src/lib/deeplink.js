/**
 * The deep-link seam: one place that reads the URL, one place that answers
 * "which moment is that?".
 *
 * WHY THIS IS A MODULE AND NOT FOUR LINES IN THE PAGE. Before this, the app
 * read `location.search` in three places with two hand-written regexes, one of
 * which was the same `preview=1` test spelled twice. Adding `at` and `layer` to
 * that is how a fourth and a fifth get written, and it is the same shape as
 * `place()` for the shootout and `page.csp()` for the hashes: one decision,
 * made once, upstream of every path that needs it.
 *
 * WHY A CLOCK AND NOT AN ARRAY INDEX (docs/deep-link-seam.md §3, §5). An index
 * points into an artifact we have committed in writing to regenerating --
 * derive.py's own docstring says "we fetch once and derive many times" -- and
 * three of extract.py's nine commits have changed the per-event shape. The
 * index has never moved, and nothing makes that true. A clock names a fact
 * about the GAME, survives any change to what the extract contains, and is
 * already printed on the scoreboard, so a reader can check they landed where
 * the sentence promised. When it is wrong it is wrong by one event inside one
 * second, not by five events in the third period.
 *
 * THE ORDINAL RIDES ON A DOT, NOT A PLUS. The design artifact proposed
 * `at=2-14:32+1`. In a query string `+` IS a space: URLSearchParams -- which is
 * to say a browser, a link shortener, or anything that re-encodes -- hands back
 * "2-14:32 1", and the disambiguator silently stops disambiguating, landing on
 * the wrong event of a shared clock. Which is precisely what it exists to
 * prevent. `.` is unreserved in RFC 3986 and is never re-encoded.
 *
 * `.` is safe only while a clock is strictly MM:SS. It is, in all 4,553
 * extracts -- and extract.py's --validate now asserts it per game, so a feed
 * that ever exposed tenths (`14:32.7`) fails loudly at ingest instead of
 * quietly resolving every link into that game to the wrong event.
 *
 * ORDINALS ARE 1-BASED. `at=2-14:32` is the first event at that clock and
 * `at=2-14:32.3` is the third. Teaching copy is hand-written, and `.1` meaning
 * "the second one" is a trap for whoever writes it.
 */
import { corsi } from './layers/corsi.js';
import { goaltending } from './layers/goaltending.js';
import { danger } from './layers/danger.js';
import { whistle } from './layers/whistle.js';

/**
 * The URL's vocabulary of layers IS the layers, derived and never restated.
 * A layer added without a token would be unreachable by link, and a token
 * naming no layer would be a dead string nobody could see was dead.
 */
export const LAYER_TOKENS = [corsi, goaltending, danger, whistle].map(l => l.id);

/** The page counts every attempt unless a link says otherwise. */
const DEFAULT_STRENGTH = 'all';
const STRENGTHS = ['all', 'even'];

/**
 * WHAT WE DID, NOT WHAT HAPPENED.
 *
 * Both sentences describe OUR resolution of a link, not an event on the ice,
 * which is the `display:` provenance category the shootout notice opened. Every
 * other tag we own (`rule:`, `field:`) points into the game or the feed; these
 * point at the renderer, and saying so is the difference between a statement
 * and an excuse.
 *
 * They exist because `set()` clamps to EV.length-1. Left alone, a link naming a
 * moment the game never reached does not blank the rink -- it renders the
 * finished game: final score, finished counters, the shootout notice. That is
 * not an obvious failure a reader reloads past. It looks like a working page,
 * and it hands over the ending, on the surface most likely to be pasted
 * somewhere by a person recommending us.
 */
export const LINK_NOTES = {
  outOfGame: {
    text: 'That moment isn’t in this game — starting from the opening faceoff.',
    from: 'display: the link named a period or a clock this game never reached',
  },
  unreadable: {
    text: 'That link named a moment we couldn’t read — starting from the opening faceoff.',
    from: 'display: the link’s `at` did not parse as a period and a clock',
  },
};

const secs = mmss => Number(mmss.slice(0, 2)) * 60 + Number(mmss.slice(3, 5));

/**
 * `at=<period>-<mm:ss>[.<n>]`, the clock being TIME REMAINING -- the hockey
 * convention, the feed's `rem`, and what the scoreboard already shows.
 *
 * Strict on purpose. A clock we half-understand resolves to a confident wrong
 * moment, so anything that is not exactly this shape is refused and reported
 * rather than repaired.
 */
function parseAt(raw, problems) {
  const m = /^(\d+)-(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(raw);
  if (!m) {
    problems.push(`at: "${raw}" is not <period>-<mm:ss>[.n]`);
    return null;
  }
  const per = Number(m[1]), ss = Number(m[3]), n = m[4] === undefined ? 1 : Number(m[4]);
  if (per < 1) { problems.push(`at: "${raw}" names period ${per}, and there is no period zero`); return null; }
  if (ss > 59) { problems.push(`at: "${raw}" names second ${ss}`); return null; }
  if (n < 1) { problems.push(`at: "${raw}" names ordinal ${n}, and ordinals start at one`); return null; }
  return { per, rem: m[2] + ':' + m[3], n };
}

/**
 * Read the whole query string once. Never throws, never repairs silently:
 * anything unusable is dropped, defaulted, and named in `problems`.
 */
export function parse(search) {
  const q = new URLSearchParams(search || '');
  const problems = [];
  const once = key => {
    const all = q.getAll(key);
    if (all.length > 1) problems.push(`${key}: given ${all.length} times; using the first`);
    return all.length ? all[0] : null;
  };

  const game = (() => {
    const raw = once('game');
    if (raw === null) return null;
    if (!/^\d+$/.test(raw)) { problems.push(`game: "${raw}" is not a game id`); return null; }
    return raw;
  })();

  const rawAt = once('at');
  const at = rawAt === null ? null
    : rawAt === '' ? (problems.push('at: empty'), null)
    : parseAt(rawAt, problems);

  const layers = [];
  const rawLayer = once('layer');
  for (const tok of (rawLayer || '').split(',').map(s => s.trim().toLowerCase())) {
    if (tok === '') continue;                       // "layer=" and "layer=,," mean none
    if (!LAYER_TOKENS.includes(tok)) { problems.push(`layer: "${tok}" is not a layer`); continue; }
    if (!layers.includes(tok)) layers.push(tok);
  }

  let strength = DEFAULT_STRENGTH;
  const rawStrength = once('strength');
  if (rawStrength !== null) {
    const s = rawStrength.trim().toLowerCase();
    if (STRENGTHS.includes(s)) strength = s;
    else problems.push(`strength: "${rawStrength}" is not ${STRENGTHS.join(' or ')}`);
  }

  return { game, at, layers, strength, preview: once('preview') === '1', problems };
}

/**
 * Which event a moment names.
 *
 *   {index, exact, why}
 *
 * `why` is non-null ONLY when we could not honour the link at all, and then
 * `index` is 0 -- the opening faceoff, with a sentence. `exact: false` on its
 * own is not a failure and must not produce a word: a clock nothing happened
 * at is a perfectly good moment, and the page shows the last thing that did
 * happen. An implementation that apologised for every inexact landing would
 * apologise on most honest links.
 *
 * THE TRAP THIS FUNCTION EXISTS TO AVOID. "The last event at or before that
 * moment" is the natural rule and it is wrong on its own: asked for period 4
 * of a game that ended in regulation, every event qualifies and it returns the
 * FINAL one. So the period is checked against the game before the clock is
 * consulted at all.
 */
export function resolve(events, at) {
  if (!at) return { index: 0, exact: true, why: null };

  let maxPer = 0;
  for (const e of events) if (e.per > maxPer) maxPer = e.per;
  if (at.per > maxPer) return { index: 0, exact: false, why: LINK_NOTES.outOfGame };

  const same = [];
  for (let i = 0; i < events.length; i++) {
    if (events[i].per === at.per && events[i].rem === at.rem) same.push(i);
  }
  if (same.length) {
    const k = Math.min(at.n, same.length) - 1;
    return { index: same[k], exact: at.n <= same.length, why: null };
  }

  // Nothing at that clock: the last event at or before it. Ordering by
  // (period ascending, remaining descending) needs no period LENGTH, which is
  // the point -- regulation is 20:00 and regular-season overtime is 5:00, and
  // hard-coding either would be a literal waiting to be wrong.
  const t = secs(at.rem);
  let best = -1;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.per < at.per || (e.per === at.per && secs(e.rem) >= t)) best = i;
  }
  if (best < 0) return { index: 0, exact: false, why: LINK_NOTES.outOfGame };
  return { index: best, exact: false, why: null };
}

/**
 * The link a "copy this moment" control emits.
 *
 * The ordinal appears only when the clock is shared, so the common case stays
 * readable and the rare case stays exact. The mode ALWAYS appears: every
 * counted number on the page is measured under a strength mode -- the
 * scoreboard carries it beside the number for exactly this reason -- so a link
 * that drops it is a screenshot cropped above the label.
 */
export function format({ game, events, index, layers = [], strength = DEFAULT_STRENGTH }) {
  const e = events[index];
  let n = 0, total = 0;
  for (let i = 0; i < events.length; i++) {
    if (events[i].per !== e.per || events[i].rem !== e.rem) continue;
    total++;
    if (i <= index) n = total;
  }
  const q = new URLSearchParams();
  if (game) q.set('game', String(game));
  q.set('at', e.per + '-' + e.rem + (total > 1 ? '.' + n : ''));
  if (layers.length) q.set('layer', layers.join(','));
  q.set('strength', strength);
  return '?' + q.toString();
}
