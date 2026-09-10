/**
 * WHAT PERIOD THIS IS, IN THE GAME'S OWN WORDS.
 *
 * ⭐⭐ THIS LIVED IN `app.js` AND NOW LIVES HERE, because a second surface needed
 * it and the alternative was a second implementation. The learn page's overtime
 * card carries a footer naming the moment its door opens, and the first version
 * of that footer said **"Period 4"** while the page it opens said **"Overtime ·
 * 3-on-3"** — one artifact describing another in different words, which is the
 * seam `docs/status.md` §0.00's audit exists to find. `attackZone` in the
 * zone-start renderer is the same decision: the mark and the sentence answer
 * with one rule or they are free to disagree.
 *
 * `pt` and `sit` are both recorded fields, so none of this is inferred. THE
 * PERIOD NUMBER CANNOT DO THIS JOB: period 5 is a shootout in the regular season
 * and a third overtime in the playoffs.
 *
 * THE COUNT READS AWAY-THEN-HOME, which is the scoreboard's own order. Quoting
 * skater counts in one order while naming a team by another is a defect this
 * project has already shipped once, in 36 of 103 strength reasons; here no team
 * is named at all, and matching the scoreboard is what keeps the two readable
 * together.
 */
export function periodLabel(e) {
  if (!e) return 'Pre-game';
  if (e.pt === 'SO') return 'Shootout';
  if (e.pt !== 'OT') return 'Period ' + e.per;
  // Playoff games run 2OT, 3OT and beyond; regulation is three periods, so the
  // overtime's own number is the period minus three.
  const n = e.per - 3, name = n > 1 ? n + 'OT' : 'Overtime';
  const s = e.sit;
  return (s && s.length === 4) ? name + ' · ' + s[1] + '-on-' + s[2] : name;
}
