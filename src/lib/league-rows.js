/**
 * WHAT IS NORMAL IN HOCKEY — THE LEAGUE ROWS, COUNTED ACROSS THE ARCHIVE.
 *
 * ⭐⭐ WHY THIS LEFT `preview.js` — 2026-09-26. It was the preview card's, and it
 * still is; what changed is that a SECOND surface needs it. Kevin's `Is that a
 * lot?` overlay draws a layer's methods-page section over the rink, and four of
 * the seven doors — attempts, penalties, offsides, icings — are league rows.
 * Inlining the whole of `preview.js` to reach them would put the club-row
 * machinery, the schedule copy and the season logic on the replay, none of which
 * it draws.
 *
 * ⛔ AND "IT WOULD HAVE WORKED ANYWAY" IS NOT A REASON TO SHIP IT. Nothing the
 * replay calls would have touched the rest of that file — until somebody added
 * one call. A module whose correctness depends on which of its functions a page
 * happens to invoke is not a module; it is a bundle that has not failed yet.
 *
 * These read `measures.census` and nothing else, which is why the split is clean:
 * the boundary was already there in the data.
 */

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
export function leagueRows(measures) {
  const c = (measures && measures.census) || null;
  const w = c && c.whistles;
  if (!c || !w || !c.games) return [];
  const perClubGame = n => n / (2 * c.games);
  /* ⭐⭐⭐ `work` IS THE DIVISION ITSELF, CARRIED SO A CRITIC CAN SEE IT DONE.
     The methods page renders "30,827 ÷ 8,384 = 3.68" from this. It is built as
     the PRIMITIVE and the displayed figure is read back off it — `rate` is
     `pp.value`, not a second `w.ppGoals / w.ppChances` — because two spellings
     of one division is how a card and its own explanation come to disagree about
     what the card says.
     ⚠️ `count` IS NULL WHERE THERE IS NO DIVISION. A median is a percentile, not
     a ratio, and printing it as one would be a false arithmetic on the page whose
     job is showing true arithmetic. */
  const ratio = (count, n) => ({ count, n, value: n > 0 ? count / n : null });
  const pp = ratio(w.ppGoals, w.ppChances);
  const pen = ratio(w.penalties, 2 * c.games);
  const off = ratio(w.offsides, 2 * c.games);
  const ice = ratio(w.icings, 2 * c.games);
  return [
    { key: 'powerplay', games: c.games,
      /* ⛔⛔ POWER-PLAY GOALS, NOT GOALS SCORED DURING A POWER PLAY. The census
         counts both; the second includes the short-handed ones and reads three
         points higher than the league's own figure. */
      goals: w.ppGoals, chances: w.ppChances, rate: pp.value, work: pp,
      chancesPerClubGame: perClubGame(w.ppChances) },
    { key: 'penalties', games: c.games, count: w.penalties,
      perClubGame: pen.value, work: pen },
    { key: 'offside', games: c.games, count: w.offsides,
      perClubGame: off.value, work: off },
  ].concat(w.icings ? [{ key: 'icing', games: c.games, count: w.icings,
      perClubGame: ice.value, work: ice }] : [])
   .concat(extraLeagueRows(measures, c, perClubGame, ratio));
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
function extraLeagueRows(measures, c, perClubGame, ratio) {
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
      /* THE DIVISION THE TILE'S HEADLINE IS: the share that reached the goalie.
         The other two parts are on the card's bar and in the key beside it. */
      work: ratio(goalie, total),
      parts: [{ k: 'goalie', label: 'reached the goalie', v: goalie },
              { k: 'blocked', label: 'blocked by a body', v: blocked },
              { k: 'missed', label: 'missed the net', v: missed }] });
  }

  /* HOW LONG A SHIFT IS. The single most bewildering thing about a first hockey
     game is that nobody stays on the ice, and the archive has answered it for
     three seasons in a field no surface reads. */
  const sh = c.shift;
  if (sh && sh.n > 0 && sh.median != null) out.push({ key: 'shift', n: sh.n,
    /* ⛔ NO NUMERATOR, BECAUSE THERE IS NO DIVISION. The median is the middle
       value of 3.1 million shifts; writing it as a ratio would be arithmetic we
       did not do, on the page that exists to show the arithmetic we did. */
    work: { count: null, n: sh.n, value: sh.median },
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
    const hw = ratio(h.totalHits, 2 * h.n);
    out.push({ key: 'hits', games: h.n, perClubGame: hw.value, work: hw,
      opposite: h.opposite, r: h.r });
  }
  return out;
}
