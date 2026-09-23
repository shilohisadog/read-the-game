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

/**
 * Each season's points shifted to a mean of zero, so pooling cannot read a
 * league-wide change between years as a difference between clubs.
 *
 * ⭐ IT CHANGES ONLY THE LEVEL, NEVER THE PAIRING. A club-season's two halves keep
 * their identity as one observation; all this removes is the season each one sat
 * in. A measure whose league level is flat across seasons is unaffected, which is
 * both the proof it is doing the right thing and the reason nobody noticed it was
 * missing: `dmen` and `level5` return the identical counts either way.
 */
function centre(values, seasons) {
  const sum = new Map(), n = new Map();
  for (let i = 0; i < values.length; i++) {
    const k = seasons[i];
    sum.set(k, (sum.get(k) || 0) + values[i]);
    n.set(k, (n.get(k) || 0) + 1);
  }
  return values.map((v, i) => v - sum.get(seasons[i]) / n.get(seasons[i]));
}

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

/** The spread, plus how many club-games are behind it — Kevin asked the caption
 *  to say what it was measured over, and a span with no n is the figure this
 *  project refuses everywhere else. */
function withGames(spread, games) {
  return spread ? { ...spread, games } : null;
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
 * ⭐ THE ONE WALK OF THE ARCHIVE THAT EVERY ESTIMATE IN THIS FILE IS BUILT ON.
 *
 * Three questions are asked of the same population — how well a measure repeats
 * across a season's halves, what the same estimate says under the OTHER splitting
 * of those halves, and how strongly two measures agree with each other. Building
 * the club-seasons three times would be three chances for the eligibility rule to
 * drift apart, and a difference between two of the answers would then be partly
 * about which games each one looked at. It is built once and shared.
 *
 * ⚠️ A SEASON IS COMPLETE WHEN THE ARCHIVE HOLDS A PLAYOFF GAME FOR IT. The
 * current season is therefore excluded until it ends, which is the pinning P2
 * asked for, and it happens with no date arithmetic and nothing to maintain.
 */
function clubSeasons(records) {
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

  /* ⛔ FOUR GAMES IS THE FLOOR AND IT IS ARITHMETIC, NOT A THRESHOLD: below it a
     "half" is one game, and a correlation between single games is a correlation
     between two nights. Applied here so all three estimates inherit it. */
  for (const [key, list] of [...by.entries()]) if (list.length < 4) by.delete(key);

  let half = 0;
  for (const list of by.values()) half = Math.max(half, Math.floor(list.length / 2));
  return { by, half, finished: [...finished].sort() };
}

/** The share a row holds over a slice of a club-season, or null if it has no
 *  denominator there — a game recorded before a field existed adds 0 to both. */
function shareOf(row, part) {
  let count = 0, n = 0;
  for (const { g, side } of part) { const v = row.ofGame(g, side); count += v.count; n += v.n; }
  return n > 0 ? count / n : null;
}

/**
 * ⭐⭐ THE TWO WAYS TO CUT A SEASON IN HALF, AND THE CHOICE IS THE FIRST THING A
 * CRITIC WILL ATTACK — so both are computed and both are published.
 *
 * `chronological` is what the card's counts are made of, and it is the
 * CONSERVATIVE one: the first half and the second half of a season differ in
 * opponent, roster health and form, so real mid-season change is charged against
 * the measure as unreliability. `alternate` hands each half the same schedule and
 * the same roster, which inflates every measure — and that is exactly why it is
 * here. It is the honest upper bound on our own numbers, and the difference
 * between the two is the size of the criticism rather than an answer to it.
 *
 * ⛔ BOTH ARE STEPPED UP FROM THE SAME `half`, so the two counts differ only by
 * the correlation and never by the arithmetic underneath it.
 */
const SPLITS = {
  chronological: list => [list.slice(0, Math.floor(list.length / 2)),
                          list.slice(Math.floor(list.length / 2))],
  alternate: list => [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)],
};

/**
 * ⭐ THE SENSITIVITY OF THE ANSWER TO THE POLICY THAT PRODUCED IT.
 *
 * `TARGET` is a declared choice and nothing derives it, which is a criticism we
 * concede rather than argue with (`docs/what-settles.md` §5.2). The only honest
 * response to "your threshold is arbitrary" is to publish what the answer would
 * be at other thresholds, so a reader can see how much of the conclusion rests on
 * the choice. These two bracket it and are declared here for the same reason
 * `TARGET` is: they are policy, stated once, out loud, so they can be argued with.
 */
export const PROBES = [0.6, 0.8];

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
 * @returns {{target, admission, probes, seasons, half, rows: {key: {r, games,
 *           clubSeasons, clubRange, alternate, atTarget}}}}
 */
export function reliability(records, rows) {
  const { by, half, finished } = clubSeasons(records);

  const out = {};
  for (const row of rows) {
    const cut = mode => {
      const first = [], second = [], seasons = [];
      for (const [key, list] of by.entries()) {
        const [x, y] = SPLITS[mode](list);
        const a = shareOf(row, x), b = shareOf(row, y);
        if (a == null || b == null) continue;
        first.push(a); second.push(b); seasons.push(key.slice(0, key.indexOf(':')));
      }
      return { r: pearson(centre(first, seasons), centre(second, seasons)), n: first.length };
    };

    const whole = [];
    let wholeGames = 0;            // club-games behind the spread, for the caption
    for (const [key, list] of by.entries()) {
      /* ⭐ THE SAME CLUB-SEASON, UNDIVIDED — AND IT IS WHAT THE CARD'S AXIS IS
         MADE OF. A bar needs a span, and the tempting span is a round number of
         points either side of the league, which is a constant nobody measured.
         This publishes the span the LEAGUE actually occupies: the full-season
         figures real clubs posted. The edge of the bar then means "the edge of
         what clubs do", which is the question a novice is really asking when
         they ask whether 52 is a lot. Same population as the reliability above,
         so it introduces no second rule about which club-seasons count. */
      const w = shareOf(row, list);
      if (w != null) { whole.push(w); wholeGames += list.length; }
    }
    /* ⛔⛔⛔ THIS COMMENT USED TO SAY CENTRING WAS NOT NEEDED, AND IT WAS WRONG —
       it is kept here in corrected form rather than deleted, because the
       reasoning that produced it is the trap.
       It read: *"a league-wide shift between years moves both halves of the same
       point together."* True, and that is precisely the MECHANISM of the bias
       rather than a reason there is none. Pool three seasons whose league levels
       differ and the Pearson partly measures WHICH SEASON a point came from, not
       whether a club's October describes its April.

       ⭐ AND THE REPO ALREADY KNEW. `docs/preview-and-corsi.md` §11.2 specifies
       the method in as many words — *"each season centred before pooling so a
       league-wide shift is not read as a club trait"* — and the code shipped
       without it. The gap was VISIBLE the whole time: the doc records the slot
       row at 37 games and this file computed 42, while `dmen` (23) and `level5`
       (35) matched exactly, because their league level barely moves between
       seasons and a share of both clubs' totals cannot move at all.

       ⛔ WHAT IT COST. `missed` measures 33 games pooled and 113 centred, because
       the league's miss rate rose 15% across the three seasons. It shipped as a
       club row on the strength of a number the drift produced. The admission rule
       now removes it by itself, which is the rule doing its job — and is the
       second time this month that deriving a figure rather than trusting one
       changed which rows exist. */
    const chrono = cut('chronological'), alt = cut('alternate');
    out[row.key] = { r: chrono.r, clubSeasons: chrono.n,
      games: gamesToTarget(chrono.r, half),
      clubRange: withGames(spreadOf(whole), wholeGames),
      /* ⭐ THE TWO SENSITIVITIES, PUBLISHED BESIDE THE ANSWER THEY QUALIFY. Both
         are the same row measured a different way, so a reader can see how much
         of "23 games" is the archive and how much is our two policies. Neither
         is used to draw anything; they exist to be read on the methods page and
         quoted at a critic. */
      alternate: { r: alt.r, clubSeasons: alt.n, games: gamesToTarget(alt.r, half) },
      atTarget: PROBES.map(t => ({ target: t, games: gamesToTarget(chrono.r, half, t) })) };
  }
  return { target: TARGET, admission: ADMISSION, probes: PROBES,
           seasons: finished, half, rows: out };
}

/**
 * ⭐⭐ HOW STRONGLY TWO MEASURES AGREE WITH EACH OTHER — the answer to "why is
 * there only one possession row?"
 *
 * Kevin, 2026-09-23, on showing the possession family once: *"as long as we
 * quantify what 'possession family' means (so a novice can connect the dots),
 * then yes."* This is that quantity. Corsi, Fenwick, shots-on-goal share and
 * shot-attempt differential are separate names in public hockey analysis, and
 * over full club-seasons they move together so tightly that printing four of them
 * shows one piece of evidence four times — which is worse than showing it once,
 * because a reader counts agreement as corroboration.
 *
 * ⛔ IT IS THE SAME CENTRING AND THE SAME POPULATION AS `reliability`. A pair
 * correlated across pooled seasons would be partly measuring which season a point
 * came from, exactly as the split-half was until 2026-09-23 — and a disclosure
 * computed with the defect we just fixed would be worse than no disclosure.
 *
 * ⚠️ AND IT IS FULL-SEASON FIGURES, NOT HALVES. The claim is that these are one
 * measurement, which is a claim about the quantity itself; halving it would drag
 * the measure's own noise into a number that is not about noise.
 *
 * @returns {{clubSeasons, pairs: [{a, b, r, n}]}} every unordered pair, once.
 */
export function agreement(records, rows) {
  const { by } = clubSeasons(records);
  const keys = [...by.keys()];
  const seasons = keys.map(k => k.slice(0, k.indexOf(':')));
  const vals = rows.map(row => keys.map(k => shareOf(row, by.get(k))));

  const pairs = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      // only the club-seasons where BOTH measures have a denominator
      const at = keys.map((_, k) => k).filter(k => vals[i][k] != null && vals[j][k] != null);
      const yr = at.map(k => seasons[k]);
      const r = pearson(centre(at.map(k => vals[i][k]), yr), centre(at.map(k => vals[j][k]), yr));
      pairs.push({ a: rows[i].key, b: rows[j].key, r, n: at.length });
    }
  }
  return { clubSeasons: keys.length, pairs };
}
