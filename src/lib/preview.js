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
 * rows that do settle are CLUB rows.
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
 * ⭐ THE ROWS THAT SETTLE, AND THE GAMES EACH ONE NEEDS.
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
/* ⭐ RE-EXPORTED, NOT RE-STATED. `leagueRows` moved to `league-rows.js` so the
   replay can carry it without this file (see that header). Every caller that
   already read it from here still does, and this is two statements rather than
   `export … from` because the builders' inliner strips the import line and would
   leave the rest dangling. */
import { leagueRows } from './league-rows.js';
export { leagueRows };

/**
 * ⭐⭐⭐ WHAT THE NUMBER COUNTS, IN WORDS — and it is a FIELD because the card
 * could not be read without it.
 *
 * Kevin, 2026-10-03, reading the live card: *"on the shot attempts by defensemen
 * section, I don't know what the 35 and 37 mean at the right side of the line
 * graph, no idea."* He wrote the ruling this card was built from. If the author
 * cannot read it, the novice it is for never could.
 *
 * ⛔⛔⛔ AND THE REASON IS NOT THAT A UNIT WAS MISSING. THESE THREE ROWS LOOK
 * IDENTICAL AND ARE TWO DIFFERENT KINDS OF SHARE:
 *
 *   level5   the denominator is BOTH CLUBS' attempts — so the league figure is
 *            50% by construction, and the two clubs in a game would sum to 100
 *            if they had played each other.
 *   dmen     the denominator is THIS CLUB'S OWN attempts — league 31%.
 *   slot     the denominator is THIS CLUB'S OWN located attempts — league 50%
 *            this season, which is a coincidence and reads exactly like level5's
 *            50%, which is not.
 *
 * A reader cannot tell those apart from a bar and a number, and nothing on the
 * card distinguished them. So each row states its own denominator in a sentence,
 * here, once — the same rule `archive.js::perGame` already follows for the
 * replay's lenses: *"a summary that says '55 goaltending' is a label nobody
 * wrote, and one that reaches for its own wording is a second vocabulary."*
 *
 * ⚠️ "of every 100", NOT "%". The house split: a chart AXIS is read as percent,
 * and prose for a novice says "of every 100" — the form the league tiles on this
 * same page already use.
 */
export const CLUB_ROWS = [
  { key: 'level5', label: '5-on-5 CF% while the score was level',
    /* ⚠️ "BOTH SIDES" MEANS THIS CLUB AND ITS OPPONENTS, NOT THE TWO CLUBS ON
       THIS CARD, and the first draft of this sentence said "the two clubs took
       between them" — which reads as WSH against TBL. They have not played each
       other: each figure is that club's own season so far, and on this card both
       were one game against somebody else. A sentence that invites a reader to
       add 40 and 25 and expect 100 is worse than no sentence. */
    says: 'Of every 100 shot attempts at 5-on-5 with the score level in this '
        + 'team\u2019s own games — both sides counted — this many were its own.',
    /* ⭐⭐⭐ THE NOUN ON THE SECOND NUMBER, AND IT IS DIFFERENT ON EVERY ROW.
       Kevin, reading the live card on 2026-10-03: *"I noticed 10 attempts, 43
       attempts and 34 attempts, obviously those are all different numbers and it
       confuses me why that's the case."* All three were ARITHMETICALLY RIGHT and
       all three said `attempts`, so the only route from the figure to the
       population it counts was to read `says` and carry it down to a footnote
       that repeated none of its words.

       `counts` is that bridge, and the words here are deliberately the words of
       `says` above: the reader's only way across is recognising them twice.
       ⚠️ IT IS WORDED FOR BOTH TEAMS AT ONCE ("each team"), because the footnote
       prints it ONCE and then both teams' counts after it. It read "its own
       games" while each team had its own line, and two lines carrying the same
       seventy characters is half of what made the card a wall of text.
       ⚠️ "BOTH SIDES" AGAIN MEANS THIS CLUB AND ITS OPPONENTS. Spelling it "both
       clubs" would read as WSH against TBL — the trap the note above already
       names, arriving one line lower. */
    counts: 'attempts by both sides in each team\u2019s own games, at 5-on-5 with the score level',
    /* THE ONE INDUSTRY LABEL ON THE SITE, and it may only sit on strict 5-on-5
       (`1551`) — score-close and score-adjusted CF% are different defined terms.
       The level condition is not decoration: every trailing club pushes, so a
       season's raw CF% flatters whoever trails more. */
    of: t => ({ count: t.level5.for, n: t.level5.for + t.level5.against }),
    /* ⭐ THE SAME ROW, PER GAME — and it is here so the rule is stated ONCE. The
       pipeline measures how many games the row needs by splitting club-seasons in
       half, which needs the per-game form; a second statement of it in the driver
       is the copy this project keeps almost making. */
    ofGame: (g, side) => ({ count: g.lvl5[side], n: g.lvl5.h + g.lvl5.a }),
    unit: 'share', group: 'possession', fields: ['lvl5'] },
  /* The possession group: views of the same thing as the row above, kept because
     each settles and each is something a newcomer can see happen. */
  { key: 'sogShare', label: 'share of the shots on goal',
    short: 'shots-on-goal share',
    says: 'Of every 100 shots on goal in this team\u2019s own games \u2014 both sides '
        + 'counted \u2014 this many were its own.',
    counts: 'shots on goal by both sides in each team\u2019s own games',
    // A table or record written before these fields existed adds 0 of 0.
    of: t => (t.sog ? { count: t.sog.for, n: t.sog.for + t.sog.against } : { count: 0, n: 0 }),
    ofGame: (g, side) => g.sog && Number.isFinite(g.sog.h) && Number.isFinite(g.sog.a)
      ? { count: g.sog[side], n: g.sog.h + g.sog.a } : { count: 0, n: 0 },
    unit: 'share', group: 'possession', fields: ['sog'] },
  { key: 'attemptsAgainst', label: 'shot attempts against, per game',
    short: 'attempts against',
    says: 'How many shot attempts the other team aimed at this team\u2019s net, per '
        + 'game \u2014 the other side of having the puck.',
    counts: 'Attempts aimed at each team\u2019s net',
    of: t => (t.attempts ? { count: t.attempts.against, n: t.games } : { count: 0, n: 0 }),
    ofGame: (g, side) => (g.attempts ? { count: g.attempts[side === 'h' ? 'a' : 'h'], n: 1 }
                                     : { count: 0, n: 0 }),
    unit: 'perGame', group: 'possession', fields: ['attempts'] },
  /* `blocks` is credited to the team that did the blocking, which is the
     defending team (`measureGame`). */
  { key: 'blocks', label: 'shot attempts blocked, per game',
    short: 'blocked attempts',
    says: 'How many of the other team\u2019s shot attempts this team got in front of '
        + 'before they reached the net, per game.',
    counts: 'Attempts each team blocked',
    of: t => (t.blocks ? { count: t.blocks.count, n: t.games } : { count: 0, n: 0 }),
    ofGame: (g, side) => (g.blocks ? { count: g.blocks[side] || 0, n: 1 } : { count: 0, n: 0 }),
    unit: 'perGame', group: 'possession', fields: ['blocks'] },
  { key: 'dmen', label: 'shot attempts taken by defencemen',
    says: 'Of every 100 shot attempts this team took, this many came from one of '
        + 'its own defencemen.',
    counts: 'attempts each team took',
    of: t => ({ count: t.dmen.count, n: t.dmen.n }),
    ofGame: (g, side) => ({ count: g.dAtt[side], n: g.attempts[side] }),
    unit: 'share', fields: ['dAtt', 'attempts'] },
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
    /* ⚠️ THE DENOMINATOR IS THE LOCATED ATTEMPTS, NOT ALL OF THEM, and the
       sentence says so: a blocked shot's coordinate is the BLOCK POINT, so an
       attempt a body stopped has no shot location and is in neither part. */
    says: 'Of every 100 shot attempts this team took from a spot the feed records, '
        + 'this many came from the slot.',
    /* ⚠️ AND THIS IS WHY 34 IS SMALLER THAN THE DEFENCEMEN ROW'S 43 IN THE SAME
       GAME: nine of that club's attempts were blocked, and a blocked shot's
       coordinate is the BLOCK POINT, so a blocked attempt has no shot location
       at all. Without the noun the two numbers read as a contradiction. */
    counts: 'attempts each team took from a spot the feed records',
    of: t => ({ count: t.slot.count, n: t.slot.n }),
    ofGame: (g, side) => ({ count: g.slot[side], n: g.located[side] }),
    unit: 'share', fields: ['slot', 'located'] },
  /* Seconds over shifts, skaters only. Settles in about a dozen games and moves
     independently of the rows above (|r| <= 0.07, docs/what-settles.md §2a). */
  { key: 'shiftLength', label: 'average shift length',
    says: 'How long this team\u2019s skaters stay on the ice each time they go out, '
        + 'on average, in seconds.',
    counts: 'Skaters\u2019 time on the ice',
    of: t => (t.shifts ? { count: t.shifts.secs, n: t.shifts.n } : { count: 0, n: 0 }),
    ofGame: (g, side) => (g.shifts ? { count: g.shiftSecs[side], n: g.shifts[side] }
                                   : { count: 0, n: 0 }),
    unit: 'seconds', fields: ['shifts', 'shiftSecs'] },
];

/** Does a nightly record carry every field the club rows read? One written
 *  before a field existed is skipped whole, so no row's denominator outgrows
 *  its numerator. */
export function complete(g) {
  return CLUB_ROWS.every(r => r.fields.every(f => g[f] != null));
}

/**
 * ⭐⭐ THE MEASURES WE DELIBERATELY DO NOT SHOW, DEFINED SO THE CARD CAN SAY WHY.
 *
 * Kevin, 2026-09-23: *"as long as we quantify what 'possession family' means (so
 * a novice can connect the dots), then yes, I'm good with showing it once."*
 *
 * Corsi and Fenwick are separate names in public hockey analysis and each clears
 * our admission rule on its own. They are not on the card because they are the
 * same measurement as the CF% row, with nothing a newcomer could see happen that
 * the possession group does not already show. `reliability.agreement` computes how
 * tightly they move with the shown rows, over the same club-seasons and with the
 * same centring.
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
 * The player block's pick: each team's leading goalscorer this season among the
 * skaters who can be shown to be playing. For a game already played that is its
 * own dressed roster (`dressed`, a set of player ids); otherwise it is whoever
 * dressed for the team's last game (`last === lastGame[ab]`). A document without
 * those dates names nobody rather than a player who may be out.
 *
 * Ties go to the lower player id: a stable tiebreak, not a judgement.
 * Nothing from the previewed game feeds the figures; `dressed` only filters.
 */
export function watchFor(players, awayAb, homeAb, dressed = null) {
  if (!players || !players.clubs) return null;
  const lastGame = players.lastGame || {};
  const playing = ab => dressed
    ? r => dressed.has(r.p)
    : r => !!r.last && r.last === lastGame[ab];
  const pick = ab => {
    const roster = (players.clubs[ab] || []).filter(playing(ab));
    if (!roster.length) return null;
    return roster.slice().sort((x, y) => y.g - x.g || x.p - y.p)[0];
  };
  const away = pick(awayAb), home = pick(homeAb);
  if (!away || !home) return null;          // one side missing is no comparison
  // `basis` is what the card says about why we believe each man is playing.
  const basis = dressed ? { game: true }
    : { game: false, away: lastGame[awayAb], home: lastGame[homeAb] };
  return { season: players.season, through: players.through || null,
           range: players.range, need: players.need,
           away, home, basis,
           rows: PLAYER_ROWS.map(r => ({
             ...r,
             range: players.range ? players.range[r.fig] : null,
             need: players.need ? players.need[r.fig] : null,
             away: rate(away, r.fig), home: rate(home, r.fig) })) };
}

/** The catalog-row view of a published extract, or null when there is none. */
export function heldFrom(extract, gid) {
  const g = extract && extract.game;
  if (!g || Number(g.id) !== gid) return null;
  const q = extract.quoted || {};
  return { id: gid, a: extract.teams.away.ab, h: extract.teams.home.ab, d: g.date, t: g.type,
           v: 1, as: (q.away || {}).score, hs: (q.home || {}).score };
}

/** The skaters an extract says dressed; an empty set when it is missing, so a
 *  played game whose lineup we cannot read names nobody. */
export function dressedIn(extract) {
  const roster = (extract && extract.roster) || {};
  return new Set(Object.entries(roster).filter(([, r]) => r.pos !== 'G').map(([p]) => Number(p)));
}

/** One player's per-game rate for one figure, with the counts that made it. */
function rate(p, fig) {
  if (!p.gp) return null;
  const out = { value: p[fig] / p.gp, count: p[fig], n: p.gp };
  // Where the league's boxscores give a different season figure, carry it and
  // the games they differ on, so the card can show both (archive.js).
  if (p.lg && p.lg[fig] != null) {
    out.league = p.lg[fig];
    out.off = (p.lgOff || []).filter(o => o.fig === fig);
  }
  return out;
}

/**
 * ⭐⭐⭐ THE FOUR PLAYER ROWS — Kevin, 2026-10-07: *"for a novice, I think they
 * would be most engaged with the 'standard' metrics: attempts, shots on goal,
 * assists and goals."*
 *
 * ⭐ ALL FOUR WERE MEASURED BEFORE THEY WERE DRAWN, by the instrument the club
 * rows are admitted under (`reliability.js`, at the declared TARGET of 0.7):
 * attempts repeat at 6 games, shots on goal at 10, assists at 24, goals at 33 --
 * every one inside the 41-game admission, and three of the four faster than any
 * club row we publish. The published `need` is recomputed from the archive by
 * `archive.js::playerSeasons`; these numbers are the reason the rows exist, not
 * the source of anything drawn.
 *
 * ⚠️ `fig` IS THE KEY IN THE PUBLISHED DOCUMENT and `key` is the row's own, for
 * the reason `EXPLAINS` exists at all: a row key and a storage key are not the
 * same namespace, and the day they diverge a string match would silently pair a
 * row with the wrong derivation.
 */
/* ⛔ "PER GAME", NOT "A GAME" — Kevin, 2026-10-07, reading the live card:
   *"that's more standard terminology."* ⭐ AND THE CARD WAS ALREADY DISAGREEING
   WITH ITSELF ABOUT IT: the goals row's own sentence has said *"per game
   played"* since the day it shipped, directly under a heading that said *"goals
   a game"*. One quantity, two phrasings, two lines apart — the same shape as
   `club`/`team` ([[house-vocabulary]]), and it took a reader to hear it. */
export const PLAYER_ROWS = [
  { key: 'playerGoals', fig: 'g', label: 'goals per game', noun: 'goals',
    says: 'How many of this team\u2019s goals he has scored himself, per game played.' },
  { key: 'playerAssists', fig: 'a', label: 'assists per game', noun: 'assists',
    says: 'The passes the league credited to him on somebody else\u2019s goal.' },
  { key: 'playerShots', fig: 's', label: 'shots on goal per game', noun: 'shots on goal',
    says: 'Pucks he put on net that the goaltender had to deal with.' },
  { key: 'playerAttempts', fig: 'c', label: 'shot attempts per game', noun: 'shot attempts',
    says: 'Every puck he put at the net \u2014 on goal, missed, or blocked by a body.' },
];

/** The possession group and the measures withheld beside it, as one list, so
 *  the agreement figure covers every pair. */
export const POSSESSION_FAMILY = [...CLUB_ROWS.filter(r => r.group === 'possession'), ...WITHHELD];

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
    if (seasonOf(g.id) !== season || !complete(g)) continue;
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

/**
 * How closely each shown possession row moves with the group's first row, from
 * the published `settle.family` (centred, full club-seasons). Null when the
 * document predates it or fewer than two of the group are shown.
 */
export function possessionGroup(measures, needs) {
  const fam = measures && measures.settle && measures.settle.family;
  const shown = CLUB_ROWS.filter(r => r.group === 'possession' && (!needs || needs[r.key]));
  if (!fam || !fam.pairs || shown.length < 2) return null;
  const head = shown[0].key;
  const pairs = shown.slice(1).map(r => {
    const pr = fam.pairs.find(x => (x.a === head && x.b === r.key) || (x.b === head && x.a === r.key));
    return pr && Number.isFinite(pr.r) ? { key: r.key, short: r.short, r: pr.r } : null;
  });
  if (pairs.some(x => !x)) return null;
  const size = pairs.map(x => Math.abs(x.r));
  return { head, clubSeasons: fam.clubSeasons, pairs,
           min: Math.min(...size), max: Math.max(...size) };
}

/** A club's season row, plus the games played since the weekly table was built. */
/**
 * A team's regular-season record as `teams.json` counts it from our games,
 * through `teams.through`, with the league's standings beside it where they
 * differ. Null before the team has a regular-season result.
 */
export function recordFor(ab, season, teams) {
  const base = ((teams && teams.seasons && teams.seasons[season]) || {})[ab];
  const r = base && base.record && base.record.reg;
  if (!r || r.w + r.l + r.otl === 0) return null;
  const out = { w: r.w, l: r.l, otl: r.otl, through: (teams && teams.through) || null };
  const st = teams && teams.standings;
  const lg = st && st.season === season && st.teams && st.teams[ab];
  if (lg && (lg[0] !== r.w || lg[1] !== r.l || lg[2] !== r.otl)) {
    out.league = { w: lg[0], l: lg[1], otl: lg[2], date: st.date };
  }
  return out;
}

function rowsFor(ab, season, teams, recent, league, needs) {
  const base = ((teams && teams.seasons && teams.seasons[season]) || {})[ab] || null;
  /* ⛔⛔ NO CURRENT SEASON MEANS NO FIGURES, AND NOTHING BORROWED. Our numbers
     exclude preseason, so from June until the season opens there is no row here
     at all — and last season's row describes a different roster. Kevin and CHENG
     both ruled silence: a stale figure presented as current is the stale-date
     defect chosen on purpose. The rows still appear, saying they have nothing
     yet, because the card's shape may not change from one week to the next. */
  const tally = CLUB_ROWS.filter(r => !needs || needs[r.key] != null)
    .map(r => ({ key: r.key, label: r.label, says: r.says, counts: r.counts,
      unit: r.unit, group: r.group || null,
      need: needs ? needs[r.key].need : null,
      range: needs ? needs[r.key].range : null,
      count: 0, n: 0 }));
  let games = 0;
  if (base) {
    games = base.games;
    tally.forEach(t => { const v = CLUB_ROWS.find(r => r.key === t.key).of(base);
      t.count = v.count; t.n = v.n; });
  }

  /* ⭐ THE NIGHTLY TAIL. `teams.json` is republished on any night the archive
     changes and `recent.json` every night, so in season the table is up to a day
     and ~1 game short — on a card whose entire honesty device is a game count.
     ⚠️ IT SAID "up to seven days and ~3 games" UNTIL 2026-10-07 and that was a
     stale cadence, not a stale number: the nightly `measure` job has rebuilt
     this document since 2026-10-03. The tail is still right and still needed —
     the gap is smaller, never zero, and in the offseason it is weekly again.
     THE DATES DECIDE IT, not a
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
    if (!complete(g)) continue;
    games += 1;
    for (const t of tally) {
      const v = CLUB_ROWS.find(r => r.key === t.key).ofGame(g, side);
      t.count += v.count; t.n += v.n;
    }
  }

  return { ab, games, record: recordFor(ab, season, teams), rows: tally.map(t => ({ ...t, games,
    league: (league && league[t.key]) ?? null,
    /* A SHARE IS COUNT OVER COUNT and the row carries both, so the card can print
       its own evidence: "320 of 1,000 attempts" beside the league's figure. */
    value: t.n > 0 ? t.count / t.n : null,
    // A row whose target the archive could not measure never claims to be settled.
    settled: t.need != null && games >= t.need })) };
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
  // The game's published extract is the witness that it was played, not the
  // clock: derive publishes one only for a game it accepted.
  const held = heldFrom(d.game, gid);

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
  /* ⭐ HOW MANY GAMES A ROW MAY NEED AND STILL BE SHOWN AS A CLUB ROW. Published
     by `reliability.js` and carried here because the page says it OUT LOUD: the
     league rows above the clubs are league rows precisely because they need more
     than this, and the sentence under them used to call that "mostly luck". */
  const settles = ((d.measures || {}).settle || {}).admission;
  return { state, game, result, counting: countingFrom(d.schedule, now),
    settles: settles == null ? null : settles,
    clubs: { away: rowsFor(away, season, d.teams, d.recent, shares, needs),
             home: rowsFor(home, season, d.teams, d.recent, shares, needs) },
    league: leagueRows(d.measures),
    possession: possessionGroup(d.measures, needs),
    /* ⭐ WHO TO WATCH, OR NULL. Built here rather than in the renderer so the
       SELECTION -- the one judgement on this block -- is a function of published
       data that a test can drive, not a branch inside a DOM builder. */
    watch: watchFor(d.players, away, home, state === 'played' ? dressedIn(d.game) : null) };
}
