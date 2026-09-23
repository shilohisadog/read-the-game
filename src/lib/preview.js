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
  /* ⛔⛔⛔ `missed` WAS HERE FOR ABOUT FOUR HOURS ON 2026-09-23 AND IS NOT COMING
     BACK. It is recorded rather than deleted because the way it got here is the
     lesson, and the next person to find a fast-settling candidate needs it.

     It shipped on r = 0.748 / 33 games, and BOTH halves of that were artefacts:

     (1) THE INSTRUMENT WAS BIASED. `reliability.js` pooled three seasons without
         centring them, against its own specification in `preview-and-corsi.md`
         §11.2. The league's miss rate rose 15% across those seasons, so the
         pooled correlation was substantially measuring WHICH SEASON a point came
         from. Centred it needs 113 games — a league row, three times over.
     (2) THE VENUE CONTROL TESTED THE WRONG THING, and it was mine. "A club's home
         figure and its away figure differ by 0.14 of a point" is arithmetically
         right and answers a narrower question than it announced: a league-wide
         home−away gap CANCELS any bias that inflates both clubs in a building
         equally — which is exactly what one scorer's miss-versus-save threshold
         does. Asked properly (does the home club's figure co-move with its
         visitors' inside one building-season?) `missed` scores 0.732, against
         0.155 for the slot row, −0.012 for the defencemen row, and 0.449 for
         hits — the KNOWN scorer-judged positive control. It is nearly twice as
         building-dependent as the metric we already disclose a bias on.

     ⭐ WHETHER A MISS IS A MISS IS A HUMAN JUDGEMENT. Shot location is geometry
     and a defenceman is a roster row; "that one missed rather than being saved"
     is a person in the arena deciding. That is the line, and it is worth more
     than this row was. */
  { key: 'slot', label: 'shot attempts from the slot',
    of: t => ({ count: t.slot.count, n: t.slot.n }),
    ofGame: (g, side) => ({ count: g.slot[side], n: g.located[side] }) },
];

/**
 * ⭐⭐ THE MEASURES WE DELIBERATELY DO NOT SHOW, DEFINED SO THE CARD CAN SAY WHY.
 *
 * Kevin, 2026-09-23: *"as long as we quantify what 'possession family' means (so
 * a novice can connect the dots), then yes, I'm good with showing it once."*
 *
 * Corsi, Fenwick and shots-on-goal share are separate names in public hockey
 * analysis and each of them clears our admission rule on its own. They are not on
 * the card because they are **the same measurement as the CF% row** — over full
 * club-seasons they move together almost perfectly, and four rows that agree read
 * to a novice as four pieces of evidence rather than one. `reliability.agreement`
 * computes exactly how tightly, over the same club-seasons and with the same
 * centring, and the card prints that number instead of the rows.
 *
 * ⛔ THEY ARE HERE AND NOT IN THE PIPELINE, because a measure the site declines
 * to show is still a claim the site makes, and a claim belongs beside the rows it
 * is about. Nothing renders these; `measure.mjs` reads them to compute one figure.
 *
 * ⚠️ EVERY FIELD BELOW ALREADY EXISTS ON THE PER-GAME RECORD. Adding a withheld
 * measure that needed new plumbing would be paying for a row we are not going to
 * draw — if one ever does, that is a reason to argue about it, not to build it.
 */
const WITHHELD = [
  { key: 'corsi', label: 'shot-attempt share, all situations',
    of: g => ({ h: g.attempts.h, a: g.attempts.a }) },
  /* UNBLOCKED ATTEMPTS = a side's attempts minus the blocks CREDITED TO THE OTHER
     SIDE. `measureGame` credits a block to the team that made it, which is the
     defending team, so the away side's blocks are what removed home attempts. The
     first draft subtracted a side's own blocks and produced a Fenwick share that
     moved the wrong way; the fields are named for who did the blocking. */
  { key: 'fenwick', label: 'unblocked shot-attempt share',
    of: g => ({ h: g.attempts.h - (g.blocks.a || 0), a: g.attempts.a - (g.blocks.h || 0) }) },
  { key: 'sog', label: 'shots-on-goal share',
    of: g => ({ h: g.sog.h, a: g.sog.a }) },
].map(m => ({ key: m.key, label: m.label,
  /* A SHARE OF THE TWO SIDES' TOTAL, in the `{count, n}` contract every other row
     uses. A game whose boxscore carried no figure contributes 0 to both rather
     than a guess — the same degradation `rowsFor` makes. */
  ofGame: (g, side) => {
    const v = m.of(g);
    return Number.isFinite(v.h) && Number.isFinite(v.a) && v.h + v.a > 0
      ? { count: v[side], n: v.h + v.a } : { count: 0, n: 0 };
  } }));

/**
 * The CF% row and the three measures it stands in for, as one list — so the
 * agreement figure is computed over the shown row and the withheld ones together
 * and nobody has to compose that pairing at the call site.
 */
export const POSSESSION_FAMILY = [CLUB_ROWS.find(r => r.key === 'level5'), ...WITHHELD];

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
    const pub = s.rows[r.key] || {};
    const need = pub.games;
    if (need == null || need > (s.admission || Infinity)) continue;
    /* ⭐ THE AXIS TRAVELS WITH THE ROW. `clubRange` is the min/max of the
       full-season figures real clubs posted (`reliability.js`), and it is what
       the card's bar is drawn against — so the edge of the bar means the edge of
       what clubs do rather than a span somebody picked. A row published before
       that field existed carries `null` and the renderer prints the figure with
       no bar, which is the same degradation every other missing document gets. */
    out[r.key] = { need, range: pub.clubRange || null };
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
    .map(r => ({ key: r.key, label: r.label,
      need: needs ? needs[r.key].need : null,
      range: needs ? needs[r.key].range : null,
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
  ].concat(w.icings ? [{ key: 'icing', games: c.games, count: w.icings,
      perClubGame: perClubGame(w.icings) }] : [])
   .concat(extraLeagueRows(measures, c, perClubGame));
}

/**
 * ⭐ THE REST OF THE FRAME — MEASURED LONG AGO AND READ BY NOTHING.
 *
 * Kevin, 2026-09-23: *"I'd like to add what's feasible, even if we aren't
 * consistent in display characteristics."* Relaxing that changes nothing about
 * the CLUB rows — the binding constraint there is the 41-game admission rule and
 * only one candidate in the whole archive clears it — but the league frame has no
 * admission rule at all, which is the entire point of the split. So it can grow,
 * and every figure below was already being computed and published and never read.
 *
 * ⛔ EACH ROW GUARDS ITSELF AND VANISHES RATHER THAN GUESSING. A document written
 * before any of these counters existed returns the three original rows and
 * nothing else — the same degradation the whistles block already makes.
 *
 * ⛔ AND THE FRAME IS NOT A STAT DUMP. Every row here answers "watch for this" for
 * someone who has never seen a hockey game. A figure with no such answer belongs
 * in the archive pages, not on a card a novice reads before a puck drops.
 */
function extraLeagueRows(measures, c, perClubGame) {
  const out = [];

  /* WHERE A SHOT ATTEMPT ENDS. Three shares of one defined whole, which is the
     only figure on this card that can honestly be a stacked bar — and it is the
     frame the `missed` club row sits inside, the same arithmetic at two
     distances. `byType` sums to the attempt total exactly. */
  const mix = (measures && measures.attemptMix) || null;
  const t = mix && mix.byType;
  if (t && typeof t['shot-on-goal'] === 'number') {
    const goalie = (t['shot-on-goal'] || 0) + (t.goal || 0);
    const blocked = t['blocked-shot'] || 0, missed = t['missed-shot'] || 0;
    const total = goalie + blocked + missed;
    if (total > 0) out.push({ key: 'attempts', games: mix.games || c.games, total,
      parts: [{ k: 'goalie', label: 'reached the goalie', v: goalie },
              { k: 'blocked', label: 'blocked by a body', v: blocked },
              { k: 'missed', label: 'missed the net', v: missed }] });
  }

  /* HOW LONG A SHIFT IS. The single most bewildering thing about a first hockey
     game is that nobody stays on the ice, and the archive has answered it for
     three seasons in a field no surface reads. */
  const sh = c.shift;
  if (sh && sh.n > 0 && sh.median != null) out.push({ key: 'shift', n: sh.n,
    median: sh.median, p25: sh.p25, p75: sh.p75, underMinute: sh.underMinute });

  /* ⛔⛔ A MEASURED NULL, PUBLISHED AS ONE. `opposite` is the share of games in
     which the club that landed more hits had FEWER shot attempts — 0.481 is a
     coin flip, over every game in the archive. It is on the card because a novice
     will hear "they're really taking it to them physically" all night, and this
     is the site's answer: we looked, and it does not go with having the puck.
     ⚠️ THE HOME PREMIUM SHIPS WITH IT. Hits are counted by the home rink's own
     crew and carry a measured +4.1% home-ice premium; a figure that we know is
     scorer-dependent may not be printed as though it were clean. */
  const h = c.hits;
  if (h && h.n > 0 && typeof h.opposite === 'number' && h.totalHits) {
    out.push({ key: 'hits', games: h.n, perClubGame: h.totalHits / (2 * h.n),
      opposite: h.opposite, r: h.r });
  }
  return out;
}

/**
 * ⭐ WHEN THIS SEASON'S NUMBERS BEGIN — FROM THE LEAGUE, NOT FROM US.
 *
 * ⛔ THE CARD WAS A DEAD END FOR TEN DAYS AND SAID NOTHING ABOUT IT. Preseason
 * is excluded from every number here, so from the first preseason game until the
 * opener both columns read *"No games counted yet this season."* and stopped —
 * true, and to a reader it is indistinguishable from a page that is broken.
 * Kevin, from the live site on 23 September 2026, with exactly that screenshot.
 *
 * The repair is to say WHEN instead of only that there is nothing: `schedule.json`
 * already carries the league's own `regularSeasonStartDate`, so the sentence is
 * quoted from the feed and moves by itself every year. No date is typed, and a
 * document that predates the field degrades to the bare sentence rather than
 * inventing one.
 */
function countingFrom(schedule, now) {
  const startsOn = ((schedule || {}).season || {}).regularSeasonStartDate || null;
  const today = String(now || '').slice(0, 10);
  return { startsOn, started: !!(startsOn && today && today >= startsOn) };
}

/**
 * @param id       the game this card is about
 * @param docs     {schedule, teams, measures, recent, catalog} — all published
 * @param now      ISO instant, injected so this is testable and deterministic
 *
 * @returns {{state, game, result, clubs, league, counting}}
 *   state    'before' | 'started' | 'played' | 'unknown'
 *   game     {id, away, home, startTimeUTC, date, preseason} or null
 *   result   {score, watch} once the archive holds it, else null
 *   clubs    {away, home} — each {ab, games, rows}
 *   league   the frame, or [] when the census predates it
 *   counting {startsOn, started} — when this season's numbers begin
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

  /* ⛔⛔ 'started', NOT 'underway', AND THE RENAME IS THE FIX. A start time that
     has passed is all we know; a game is over about two and a half hours later
     and the next ingest is up to thirteen hours after that, so `underway` was a
     claim that went false on its own and stayed on the page — the shape of
     defect this project has now made three times (`next-play-shading`). It was
     also a REAL-TIME claim on a site whose whole position is that it is a replay
     and never live. `started` is a fact about the clock that cannot expire, and
     the renderer prints the start itself rather than a status. */
  let state = 'before', result = null;
  if (held && held.v) {
    state = 'played';
    result = { score: { a: held.as, h: held.hs }, watch: `game.html?game=${gid}` };
  } else if (fix && fix.startTimeUTC && !(fix.startTimeUTC > now)) {
    state = 'started';
  }

  const shares = leagueShares(season, d.teams, d.recent);
  const needs = needsFrom(d.measures);
  return { state, game, result, counting: countingFrom(d.schedule, now),
    clubs: { away: rowsFor(away, season, d.teams, d.recent, shares, needs),
             home: rowsFor(home, season, d.teams, d.recent, shares, needs) },
    league: leagueRows(d.measures) };
}
