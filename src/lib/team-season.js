/**
 * Every team's season, counted -- the document a next-opponent card reads.
 *
 * ITS OWN FILE, AND THE REASON IS THE FRONT DOOR. build_index.py inlines
 * archive.js into the home page as real source, so anything living there is
 * downloaded by every visitor on the site's most-measured surface. This
 * aggregator is 3.6 KB gzipped that the home page never calls -- 16% of that
 * page's transfer, paid by a novice on a phone to run nothing. The home page was
 * just cut from 5.58 screens to 2.87; quietly handing a sixth of that back in
 * dead code is the same regression by a different route.
 *
 * The rules it needs stay in archive.js and are imported, never restated: what
 * is in scope, what a season is, and the one sanctioned save fraction.
 */
import { inScope, isPlayoff, season, share, saveShare, POPULATION } from './archive.js';

/** A team's season, before anything has been added to it. */
function blankTeam() {
  return {
    games: 0,
    // W-L-OTL is the league's own form and it is TYPE-SPECIFIC: a regular-season
    // game lost after regulation is an overtime loss, and the same game in the
    // playoffs is a loss. Splitting the record is not tidiness — pooling them
    // would invent a fourth kind of result the league does not recognise.
    //
    // `undecided` exists so the conservation check is exact. An NHL game always
    // has a winner, so this can only ever be non-zero if the data is wrong — and
    // silently bucketing a corrupt game as a loss is how a wrong number ships.
    record: { reg: { w: 0, l: 0, otl: 0, undecided: 0 }, post: { w: 0, l: 0, undecided: 0 } },
    attempts: { for: 0, against: 0 },
    slot: { count: 0, n: 0 },
    blocks: { count: 0, n: 0 },
    saves: { count: 0, n: 0 },
    goalies: {},                        // pid -> row; becomes a sorted array below
  };
}

/**
 * Every team's season, counted — the document a next-opponent card reads.
 *
 * SCOPE IS PER SEASON AND NEVER POOLED, which is the standing rule for every
 * base rate here and is load-bearing rather than tidy on this document: the
 * ruling that produced it was that last season describes a roster that no
 * longer exists. Two seasons in one bucket would smuggle that back in.
 *
 * THE ARCHIVE BASELINE IS COMPUTED FROM THE SAME RECORDS, in the same pass, by
 * the same functions. A card puts a team's fraction beside the archive's, and
 * the two are only comparable if they mean the same thing — the lesson
 * extract.py's SOG check paid for. Shipping the baseline in a second document
 * computed by a second path is the shape this project keeps repairing.
 *
 * @param records  per-game measurements from builders/measure.mjs
 */
export function teamSeasons(records) {
  const games = records.filter(g => inScope(g.id));
  const seasons = {};

  for (const g of games) {
    const yr = season(g.id);
    const bucket = seasons[yr] || (seasons[yr] = {});
    const post = isPlayoff(g.id);

    for (const side of ['h', 'a']) {
      const opp = side === 'h' ? 'a' : 'h';
      const ab = side === 'h' ? g.homeAb : g.awayAb;
      if (!ab) continue;
      const t = bucket[ab] || (bucket[ab] = blankTeam());
      t.games++;

      const mine = g.score[side], theirs = g.score[opp];
      const book = post ? t.record.post : t.record.reg;
      if (mine > theirs) book.w++;
      else if (mine === theirs) book.undecided++;
      // The OTL bucket exists only in the regular season. `end` is read from the
      // league's own period type, never inferred from a period number.
      else if (!post && g.end !== 'REG') book.otl++;
      else book.l++;

      t.attempts.for += g.attempts[side];
      t.attempts.against += g.attempts[opp];

      // WHAT SHARE OF THE SHOTS AIMED AT THEM DID THEY BLOCK. The denominator is
      // the OPPONENT's attempts, because that is the population being blocked —
      // and it makes the figure comparable to the archive's blocked share, which
      // is the same quantity counted from the other side.
      if (g.blocks) { t.blocks.count += g.blocks[side]; t.blocks.n += g.attempts[opp]; }

      // THE SLOT DENOMINATOR IS NOT ALL ATTEMPTS, and this is a fact about the
      // feed rather than a choice. A blocked shot's (x, y) is the BLOCK POINT,
      // not where the shot was taken, so a blocked attempt has no shot location
      // at all — `SHOT_TYPES` excludes it for exactly this reason. Counting slot
      // shots over all attempts would divide a number that can only be known for
      // unblocked shots by a population that includes shots whose origin is
      // unknowable.
      if (g.slot) { t.slot.count += g.slot[side]; t.slot.n += g.located[side]; }

      for (const k of g.goalies || []) {
        if (k.side !== side) continue;
        t.saves.count += k.saves; t.saves.n += k.faced;
        const row = t.goalies[k.pid] || (t.goalies[k.pid] =
          { pid: k.pid, nm: k.nm, faced: 0, saves: 0, games: 0, last: null });
        row.faced += k.faced; row.saves += k.saves; row.games++;
        // LAST APPEARANCE, ON EVERY ROW — not only on the ones we can tell moved.
        // A goalie who was traded, one who is injured and one who is out of
        // favour are indistinguishable in what we hold, so a rule that dates only
        // departures has to classify a row before it can render it, and misses
        // the case it is most needed for: last seen in December, never seen
        // again, still listed as though available. Dating every row states the
        // observation and claims no reason for it.
        if (k.date && (!row.last || k.date > row.last)) row.last = k.date;
      }
    }
  }

  // A goalie who tended net for two teams in one season — 3 of 90 in a quarter
  // sample of 2023-24. Stated only because we WATCHED him play elsewhere; the
  // reverse is never stated, because an absence has no observation behind it.
  for (const bucket of Object.values(seasons)) {
    const where = new Map();                       // pid -> the teams he tended for
    for (const [ab, t] of Object.entries(bucket)) {
      for (const row of Object.values(t.goalies)) {
        if (!where.has(row.pid)) where.set(row.pid, []);
        where.get(row.pid).push(ab);
      }
    }
    for (const [ab, t] of Object.entries(bucket)) {
      t.goalies = Object.values(t.goalies)
        // Sorted by SHOTS FACED, which is the fact. Sorting by rate would be a
        // ranking, and a ranking is a claim the feed did not make. Ties broken
        // by pid so the document is a function of its input alone.
        .sort((x, y) => y.faced - x.faced || x.pid - y.pid)
        .map(row => {
          const also = (where.get(row.pid) || []).filter(x => x !== ab);
          return also.length ? { ...row, alsoFor: also.sort() } : row;
        });
    }
  }

  return {
    scope: POPULATION,
    // The reference class for every fraction on a team's row, computed from the
    // same games in the same pass. See the note above.
    archive: {
      saveFraction: saveShare(games),
      slotShare: share(
        games.reduce((n, g) => n + (g.slot ? g.slot.h + g.slot.a : 0), 0),
        games.reduce((n, g) => n + (g.located ? g.located.h + g.located.a : 0), 0),
        'of the unblocked attempts whose location the feed records, this many came '
        + 'from the slot (n counts ATTEMPTS, not games — a blocked shot has no shot '
        + 'location and is in neither part)'),
      blocksCredited: share(
        games.reduce((n, g) => n + (g.blocks ? g.blocks.h + g.blocks.a : 0), 0),
        games.reduce((n, g) => n + g.attempts.h + g.attempts.a, 0),
        'of all shot attempts, this many were blocked by an OPPONENT and credited '
        + 'to them — lower than the blocked share in attemptMix, which also counts '
        + 'the 7.8% of blocks made by a teammate and credited to nobody '
        + '(n counts ATTEMPTS, not games)'),
    },
    seasons,
  };
}
