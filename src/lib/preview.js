/**
 * The preview card — what is worth watching for in a game nobody has played yet.
 *
 * `docs/preview-and-corsi.md` settled WHAT it says, over three seasons and two
 * rounds of review; `docs/preview-page.md` settled where it lives. The short of
 * it, because the reason is the whole design:
 *
 * ⭐⭐ A ROW IS A CLUB ROW ONLY IF IT SETTLES INSIDE HALF A SEASON. Measured over
 * 3,936 regular-season games (96 club-seasons, split chronologically), the
 * club-to-club differences in penalties (73 games), offside (85) and every
 * power-play measure (PP% 150, PK% 383) do not settle within a season at all.
 * Presented as a trait, such a row tells a novice something false — the
 * differences are mostly luck. Kevin: *"we are a teaching centric site, at the
 * core."* So those three became LEAGUE rows that teach what is normal, and the
 * three that do settle stayed CLUB rows.
 *
 * ⛔ NOTHING HERE FORECASTS. The site's own headline is that the club with more
 * shot attempts LOSES 2,228 of 4,100 games; a card implying who will win would
 * contradict the page it is linked from. Every row is a fact with its n, and the
 * copy that surrounds it says what to watch for, never what will happen.
 *
 * ⛔ AND NO FIGURE IS TYPED. The league rows are counted where the archive is
 * walked (`census.js`, published in measures.json) and the club rows are summed
 * where the seasons are (`team-season.js`, published in teams.json). What this
 * module does is divide, once, and say what each figure is drawn from.
 */

/**
 * ⭐ THE THREE ROWS THAT SETTLE, AND THE GAMES EACH ONE NEEDS.
 *
 * `need` is the number of games a club must have played before its figure
 * describes the club rather than the sample — reliability 0.7, derived from the
 * three-season chronological split in `docs/preview-and-corsi.md` §11.2.
 *
 * ⚠️ IT IS PINNED FOR THE SEASON AND RE-DERIVED EACH SUMMER, which is CHENG's
 * P2 ruling: re-deriving inside a season moves the labels for a reason no reader
 * can see, and pinning from ONE season inherits its flattery. The estimate is
 * pooled across every season in the archive and it is deliberately the
 * CONSERVATIVE one — alternate-game halves share a season's opponents and
 * schedule, which inflates reliability and would let a row say *settled* before
 * it has earned it.
 *
 * ⛔ 41 IS THE ADMISSION RULE (`preview-and-corsi.md` §12), not a target: a row
 * that needs more than half a season is a LEAGUE row. Adding a club row with a
 * `need` above 41 is the drift that rule exists to stop, and a test holds it.
 */
export const CLUB_ROWS = [
  { key: 'level5', label: '5-on-5 CF% while the score was level',
    /* THE ONE INDUSTRY LABEL ON THE SITE, and it may only sit on strict 5-on-5
       (`1551`) — score-close and score-adjusted CF% are different defined terms.
       The level condition is not decoration: every trailing club pushes, so a
       season's raw CF% flatters whoever trails more. */
    of: t => ({ count: t.level5.for, n: t.level5.for + t.level5.against }),
    /* ⭐ THE SAME ROW, PER GAME — and it is here so the rule is stated ONCE. The
       pipeline measures how many games the row needs by splitting club-seasons in
       half, which needs the per-game form; a second statement of it in the driver
       is the copy this project keeps almost making. */
    ofGame: (g, side) => ({ count: g.lvl5[side], n: g.lvl5.h + g.lvl5.a }) },
  { key: 'dmen', label: 'shot attempts taken by defencemen',
    of: t => ({ count: t.dmen.count, n: t.dmen.n }),
    ofGame: (g, side) => ({ count: g.dAtt[side], n: g.attempts[side] }) },
  { key: 'slot', label: 'shot attempts from the slot',
    of: t => ({ count: t.slot.count, n: t.slot.n }),
    ofGame: (g, side) => ({ count: g.slot[side], n: g.located[side] }) },
];

/** The season a game id belongs to, the way every other reader of an id reads it. */
function seasonOf(id) {
  return String(id).slice(0, 4);
}

/**
 * ⭐ WHAT THE LEAGUE IS DOING THIS SEASON, for the club rows to sit beside.
 *
 * A share with no base rate loses the argument — 32 of every 100 attempts means
 * nothing to a novice until the league's own figure is next to it. It is summed
 * over THIS season's clubs rather than taken from the archive block, because the
 * club figure beside it is this season's: comparing a club's October to three
 * seasons of everybody would be two populations wearing one label.
 */
function leagueShares(season, teams, recent) {
  const bucket = (teams && teams.seasons && teams.seasons[season]) || {};
  const tot = {};
  for (const r of CLUB_ROWS) tot[r.key] = { count: 0, n: 0 };
  for (const t of Object.values(bucket)) {
    for (const r of CLUB_ROWS) { const v = r.of(t); tot[r.key].count += v.count; tot[r.key].n += v.n; }
  }
  // the same tail the club rows get, so the two are current to the same night
  for (const g of (recent && recent.games) || []) {
    if (!g || typeof g.date !== 'string' || g.date <= ((teams && teams.through) || '')) continue;
    if (seasonOf(g.id) !== season || !g.dAtt || !g.lvl5 || !g.slot || !g.located) continue;
    for (const side of ['h', 'a']) {
      for (const r of CLUB_ROWS) { const v = r.ofGame(g, side); tot[r.key].count += v.count; tot[r.key].n += v.n; }
    }
  }
  const out = {};
  for (const r of CLUB_ROWS) out[r.key] = tot[r.key].n > 0 ? tot[r.key].count / tot[r.key].n : null;
  return out;
}

/**
 * ⭐ HOW MANY GAMES EACH ROW NEEDS — MEASURED, NEVER TYPED.
 *
 * These were three numbers I had measured by hand and written into this file.
 * Kevin, 2026-09-23: *"there should never be hard coded values, anywhere."* They
 * are now computed over the archive by `reliability.js`, published in
 * measures.json, and read here.
 *
 * ⛔ AND THE ADMISSION RULE IS APPLIED TO WHAT WAS MEASURED, not to what was
 * assumed: a row whose measured count exceeds half a season is not a club row at
 * all, and it is dropped rather than shown with a target no club reaches inside a
 * season. That is `preview-and-corsi.md` §12 made to run rather than remembered.
 */
function needsFrom(measures) {
  const s = (measures && measures.settle) || null;
  if (!s || !s.rows) return null;
  const out = {};
  for (const r of CLUB_ROWS) {
    const need = (s.rows[r.key] || {}).games;
    if (need != null && need <= (s.admission || Infinity)) out[r.key] = need;
  }
  return out;
}

/** A club's season row, plus the games played since the weekly table was built. */
function rowsFor(ab, season, teams, recent, league, needs) {
  const base = ((teams && teams.seasons && teams.seasons[season]) || {})[ab] || null;
  /* ⛔⛔ NO CURRENT SEASON MEANS NO FIGURES, AND NOTHING BORROWED. Our numbers
     exclude preseason, so from June until the season opens there is no row here
     at all — and last season's row describes a different roster. Kevin and CHENG
     both ruled silence: a stale figure presented as current is the stale-date
     defect chosen on purpose. The rows still appear, saying they have nothing
     yet, because the card's shape may not change from one week to the next. */
  const tally = CLUB_ROWS.filter(r => !needs || needs[r.key] != null)
    .map(r => ({ key: r.key, label: r.label, need: needs ? needs[r.key] : null,
      count: 0, n: 0 }));
  let games = 0;
  if (base) {
    games = base.games;
    tally.forEach(t => { const v = CLUB_ROWS.find(r => r.key === t.key).of(base);
      t.count = v.count; t.n = v.n; });
  }

  /* ⭐ THE NIGHTLY TAIL. `teams.json` is rebuilt weekly and `recent.json` every
     night, so in season the table is up to seven days and ~3 games short — on a
     card whose entire honesty device is a game count. THE DATES DECIDE IT, not a
     set of ids: `through` is the newest game the table contains, so anything
     after it is a game the table has not seen. A merge on id-presence would need
     the table to list its games, which it does not and should not. */
  const through = (teams && teams.through) || '';
  for (const g of (recent && recent.games) || []) {
    if (!g || typeof g.date !== 'string' || g.date <= through) continue;
    if (seasonOf(g.id) !== season) continue;
    const side = g.homeAb === ab ? 'h' : g.awayAb === ab ? 'a' : null;
    if (!side) continue;
    /* ⚠️ A RECORD FROM BEFORE THESE FIELDS EXISTED CANNOT BE ADDED, and it does
       not move the game count either. Counting the game while dropping its
       numerators would grow a denominator without its numerator, which makes a
       share quietly wrong — worse than being a game behind. */
    if (!g.dAtt || !g.lvl5 || !g.slot || !g.located) continue;
    games += 1;
    for (const t of tally) {
      const v = CLUB_ROWS.find(r => r.key === t.key).ofGame(g, side);
      t.count += v.count; t.n += v.n;
    }
  }

  return { ab, games, rows: tally.map(t => ({ ...t, games,
    league: (league && league[t.key]) ?? null,
    /* A SHARE IS COUNT OVER COUNT and the row carries both, so the card can print
       its own evidence: "320 of 1,000 attempts" beside the league's figure. */
    value: t.n > 0 ? t.count / t.n : null,
    // A row whose target the archive could not measure never claims to be settled.
    settled: t.need != null && games >= t.need })) };
}

/**
 * ⭐ WHAT IS NORMAL, ONCE, ABOVE BOTH CLUBS.
 *
 * CHENG's Q10: a league figure inside a club's column READS as a club figure —
 * `3.6` under each of two clubs says the clubs are equal on penalties, which
 * neither number claims. So these are a frame, not content, and the renderer
 * prints them once.
 *
 * ⛔ AND THEY COME FROM THE CENSUS, which walks every game in the archive. A
 * document written before those counters existed has no `whistles` block, and
 * this returns NOTHING rather than inventing a figure — the same degradation the
 * front door makes when fixtures carry no date.
 */
function leagueRows(measures) {
  const c = (measures && measures.census) || null;
  const w = c && c.whistles;
  if (!c || !w || !c.games) return [];
  const perClubGame = n => n / (2 * c.games);
  return [
    { key: 'powerplay', games: c.games,
      /* ⛔⛔ POWER-PLAY GOALS, NOT GOALS SCORED DURING A POWER PLAY. The census
         counts both; the second includes the short-handed ones and reads three
         points higher than the league's own figure. */
      goals: w.ppGoals, chances: w.ppChances, rate: w.ppGoals / w.ppChances,
      chancesPerClubGame: perClubGame(w.ppChances) },
    { key: 'penalties', games: c.games, count: w.penalties,
      perClubGame: perClubGame(w.penalties) },
    { key: 'offside', games: c.games, count: w.offsides,
      perClubGame: perClubGame(w.offsides) },
  ];
}

/**
 * @param id       the game this card is about
 * @param docs     {schedule, teams, measures, recent, catalog} — all published
 * @param now      ISO instant, injected so this is testable and deterministic
 *
 * @returns {{state, game, result, clubs, league}}
 *   state   'before' | 'underway' | 'played' | 'unknown'
 *   game    {id, away, home, startTimeUTC, date, preseason} or null
 *   result  {score, watch} once the archive holds it, else null
 *   clubs   {away, home} — each {ab, games, rows}
 *   league  the frame, or [] when the census predates it
 */
export function preview(id, docs, now) {
  const gid = Number(id);
  const d = docs || {};
  const fix = (((d.schedule || {}).upcoming) || []).find(g => g && Number(g.id) === gid) || null;
  /* ⭐ THE CATALOG IS THE WITNESS THAT A GAME WAS PLAYED, not the clock. A
     postponed game whose start has passed is not a game we hold, and deciding
     from `now` would open a replay that does not exist. */
  const held = (((d.catalog || {}).games) || []).find(g => g && Number(g.id) === gid) || null;

  if (!fix && !held) return { state: 'unknown', game: null, result: null, clubs: null, league: [] };

  const away = fix ? fix.away : held.a;
  const home = fix ? fix.home : held.h;
  const season = seasonOf(gid);
  const game = { id: gid, away, home,
    startTimeUTC: fix ? fix.startTimeUTC : null,
    date: fix ? fix.date : held.d,
    // The league's own type, quoted: 1 is preseason, which our numbers exclude.
    preseason: (fix ? fix.gameType : held.t) === 1 };

  let state = 'before', result = null;
  if (held && held.v) {
    state = 'played';
    result = { score: { a: held.as, h: held.hs }, watch: `game.html?game=${gid}` };
  } else if (fix && fix.startTimeUTC && !(fix.startTimeUTC > now)) {
    state = 'underway';
  }

  const shares = leagueShares(season, d.teams, d.recent);
  const needs = needsFrom(d.measures);
  return { state, game, result,
    clubs: { away: rowsFor(away, season, d.teams, d.recent, shares, needs),
             home: rowsFor(home, season, d.teams, d.recent, shares, needs) },
    league: leagueRows(d.measures) };
}
