/**
 * How many games a club must play before a figure describes the CLUB.
 *
 * ⛔⛔ WHY THIS IS COMPUTED AND NOT WRITTEN DOWN. The preview card's club rows
 * each carry a progress count — *"12 of 35 games"* — and 35 was measured once,
 * by hand, over three seasons, and typed into a source file. Kevin, 2026-09-23:
 * *"there should never be hard coded values, anywhere … everything should derive
 * from ingested, calculated, or applicable variables."* He is right, and the
 * distinction we settled is between a MEASUREMENT and a POLICY: a measurement is
 * derived from the archive, always; a policy is a choice, declared once with its
 * reason beside it. `TARGET` below is the only policy here.
 *
 * ⭐ WHAT IT MEASURES. Split each club's season in half CHRONOLOGICALLY, correlate
 * the first half against the second across every club-season, and step the result
 * up to a full season (Spearman–Brown). That answers the question the card's label
 * makes — *does this club's figure so far describe the same club later?* — and it
 * is the conservative instrument: alternating games share a season's opponents and
 * schedule, which inflates reliability and would let a row say `settled` before it
 * has earned the word (CHENG, `docs/preview-and-corsi.md` §11.1 P2).
 *
 * ⚠️ COMPLETED SEASONS ONLY, AND THAT IS WHAT PINS IT. P2 also ruled that the
 * counts may not move inside a season, for a reason no reader could see. A season
 * is complete when the archive holds a PLAYOFF game for it — read from the games
 * rather than from a clock, so the estimate re-derives by itself the first time
 * the pipeline runs after a Cup final and never between Tuesdays.
 */
import { season, isPlayoff } from './archive.js';

/**
 * ⭐ THE ONE POLICY NUMBER, AND IT IS A CHOICE RATHER THAN A MEASUREMENT.
 * 0.7 is the reliability at which we are willing to say a figure describes the
 * club. Nothing derives it; it is stated here once so it can be argued with.
 */
export const TARGET = 0.7;

/**
 * ⭐ AND THE ADMISSION RULE, WHICH IS ALSO A CHOICE. A row that needs more than
 * half a season is a LEAGUE row, not a club row (`preview-and-corsi.md` §12):
 * presented as a club trait it would tell a novice that luck is character. 41 is
 * half of the league's 82-game season — so it is half of a fact, not a tuned
 * threshold, and it moves if the league ever changes the schedule.
 */
export const SEASON_GAMES = 82;
export const ADMISSION = SEASON_GAMES / 2;

function pearson(x, y) {
  const n = x.length;
  if (n < 3) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

/**
 * Games needed to reach `target`, from a HALF-SEASON reliability.
 *
 * Spearman–Brown, inverted: a half-season of `half` games reliable at `r` implies
 * a single game reliable at `p1 = r / (half - (half - 1) r)`, and the number of
 * games at which that compounds to `target` is `target(1-p1) / (p1(1-target))`.
 * A measure with no signal (`r <= 0`) returns null — no number of games settles
 * it, which is the honest answer and the one that sends the row to the league
 * section.
 */
export function gamesToTarget(r, half, target = TARGET) {
  if (!(r > 0) || !(half > 1)) return null;
  const p1 = r / (half - (half - 1) * r);
  if (!(p1 > 0) || p1 >= 1) return null;
  return Math.ceil(target * (1 - p1) / (p1 * (1 - target)));
}

/**
 * ⭐ WHAT A FULL SEASON OF CLUBS LOOKS LIKE ON ONE MEASURE — the card's axis.
 *
 * ⛔ IT IS `min`..`max`, NOT A QUANTILE BAND, and that is the whole reason this
 * is honest. A p10–p90 axis would clip a fifth of the clubs off the ends of a
 * picture whose entire job is to say how far apart clubs get, and choosing WHICH
 * fifth is the tuned constant this repo refuses. The extremes are real
 * club-seasons; they are the edges by definition.
 *
 * `median` is carried for nothing but a label, and `n` because a span drawn from
 * four club-seasons is not the same claim as one drawn from ninety-six.
 */
export function spreadOf(values) {
  const xs = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  if (!xs.length) return null;
  return { min: xs[0], max: xs[xs.length - 1], median: xs[Math.floor(xs.length / 2)],
           n: xs.length };
}

/**
 * @param records  the per-game records `measureGame` produces, whole archive
 * @param rows     [{key, ofGame(record, side) -> {count, n}}] — the PER-GAME form
 *                 of the card's own rows, passed in so this file states no measure
 *                 of its own. ⚠️ `ofGame`, not `of`: the card's `of` reads a
 *                 SEASON total and this reads one game, and the first version of
 *                 this file called `of` — which every unit test accepted, because
 *                 the fixture defined whichever name the code asked for. It threw
 *                 on the first real record. A fake that answers any question
 *                 cannot fail the way production does.
 * @returns {{target, seasons, half, rows: {key: {r, games, clubSeasons}}}}
 */
export function reliability(records, rows) {
  /* A SEASON IS COMPLETE WHEN THE ARCHIVE HOLDS A PLAYOFF GAME FOR IT. The
     current season is therefore excluded until it ends, which is the pinning P2
     asked for, and it happens with no date arithmetic and nothing to maintain. */
  const finished = new Set();
  for (const g of records) if (isPlayoff(g.id)) finished.add(season(g.id));

  // club-season -> the club's games in date order, with the side it played
  const by = new Map();
  for (const g of records) {
    const yr = season(g.id);
    if (!finished.has(yr) || isPlayoff(g.id)) continue;   // regular season of a finished year
    for (const side of ['h', 'a']) {
      const ab = side === 'h' ? g.homeAb : g.awayAb;
      if (!ab) continue;
      const key = yr + ':' + ab;
      (by.get(key) || by.set(key, []).get(key)).push({ g, side });
    }
  }
  for (const list of by.values()) list.sort((a, b) => (a.g.date === b.g.date
    ? a.g.id - b.g.id : (a.g.date < b.g.date ? -1 : 1)));

  const out = {};
  let half = 0;
  for (const row of rows) {
    const first = [], second = [], whole = [];
    for (const list of by.values()) {
      if (list.length < 4) continue;
      const mid = Math.floor(list.length / 2);
      half = Math.max(half, mid);
      const share = part => {
        let count = 0, n = 0;
        for (const { g, side } of part) { const v = row.ofGame(g, side); count += v.count; n += v.n; }
        return n > 0 ? count / n : null;
      };
      const a = share(list.slice(0, mid)), b = share(list.slice(mid));
      if (a == null || b == null) continue;
      first.push(a); second.push(b);
      /* ⭐ THE SAME CLUB-SEASON, UNDIVIDED — AND IT IS WHAT THE CARD'S AXIS IS
         MADE OF. A bar needs a span, and the tempting span is a round number of
         points either side of the league, which is a constant nobody measured.
         This publishes the span the LEAGUE actually occupies: the full-season
         figures real clubs posted. The edge of the bar then means "the edge of
         what clubs do", which is the question a novice is really asking when
         they ask whether 52 is a lot. Same population as the reliability above,
         so it introduces no second rule about which club-seasons count. */
      const w = share(list);
      if (w != null) whole.push(w);
    }
    /* ⛔ CENTRED PER SEASON IS NOT NEEDED HERE and would be a second rule: every
       club-season is one point, and a league-wide shift between years moves both
       halves of the same point together. What it must not do is pool a club's
       two halves as if they were two clubs, which is why the pairing is kept. */
    const r = pearson(first, second);
    out[row.key] = { r, clubSeasons: first.length, games: gamesToTarget(r, half),
      clubRange: spreadOf(whole) };
  }
  return { target: TARGET, admission: ADMISSION, seasons: [...finished].sort(), half, rows: out };
}
