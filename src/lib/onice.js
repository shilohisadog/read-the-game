/**
 * WHO WAS ON THE ICE AT A GIVEN SECOND.
 *
 * ⭐⭐ THE INTERVAL CONVENTION IS THE WHOLE MODULE, AND IT FAILS QUIETLY.
 * A shift record is `{p, t, s, e}`, and at an event the play stops, so one shift
 * ends and the next begins ON THE SAME SECOND. Measured over 224 games and
 * 1,413 goals (`docs/layer-ideas.md` §4.2), the three readings differ like this:
 *
 *   `s <= t <= e`   plausible count 5.7%    names the right players 98.0%
 *   `s <= t <  e`   plausible count 95.9%   names the right players ⛔ 16.2%
 *   `s <  t <= e`   plausible count 97.9%   names the right players 97.4%
 *
 * ⚠️ THE MIDDLE ROW IS THE DANGEROUS ONE. It produces a correct-LOOKING strength
 * — five a side nearly everywhere — and the wrong five names one time in six.
 * A page built on it would be plausible and wrong, and no check on the COUNT
 * could catch it. The instrument that separates them is asking whether the
 * players the event ITSELF names are in the set, which is what
 * `test/onice.test.js` does rather than counting heads.
 *
 * ⛔⛔ AND THE CONVENTION DEPENDS ON WHETHER THE SECOND IS A BOUNDARY, which
 * §4.2 could not have found: it measured GOALS only, and every goal is mid-play.
 * A FACEOFF is the boundary itself — the chart ends the old line at `t` and
 * starts the new one at `t` — so the players who are on the ice FOR the draw are
 * the ARRIVING ones. Measured over 87 games, by whether the player the event
 * names is in the set:
 *
 *                        in play        at a faceoff
 *   `s <  t <= e`        0.1% absent    ⛔ 57.6% absent
 *   `s <= t <  e`        5.4% absent       0.0% absent
 *
 * ⚠️ BOTH GIVE A PLAUSIBLE COMPLEMENT ON 100% OF FRAMES, which is the same trap
 * one level down: counting heads cannot choose between them and the page would
 * have contradicted itself on more than half of all faceoff frames — the
 * active-player line naming a man the list below said was not out there. **It
 * was found by LOOKING at a 360px screenshot, not by any test.**
 *
 * ⛔ AND THE SECOND IS ABSOLUTE GAME SECONDS. `event.s` already is — period two
 * opens at 1200 and period three at 2400 — and adding `(per - 1) * 1200` to it
 * resolved only 65.6% of attempts to a plausible complement before that was
 * found on 2026-09-10. The shift chart uses the same clock.
 *
 * ⛔ THIS KNOWS NOTHING ABOUT WHERE ANYBODY IS, and cannot be made to.
 * DOCTRINE §5: *"players are arranged by role, not by tracked position — real
 * skater coordinates aren't public, so we don't fake them."* The return value is
 * a LIST because that is the shape of what we know.
 */
/**
 * @param game  the extract
 * @param ev    the EVENT, not a second — the interval convention depends on
 *              whether this second is a boundary, so the caller cannot be
 *              trusted to have chosen one. Accepts `{s, type}`.
 */
export function onIce(game, ev) {
  const sec = ev && typeof ev === 'object' ? ev.s : ev;
  /* AT A FACEOFF THE ARRIVING LINE IS THE ONE ON THE ICE. Everywhere else the
     line that is finishing at this second is. */
  const arriving = !!(ev && ev.type === 'faceoff');
  const holds = arriving
    ? (r) => r.s <= sec && sec < r.e
    : (r) => r.s < sec && sec <= r.e;
  const out = {
    away: { skaters: [], goalies: [] },
    home: { skaters: [], goalies: [] },
  };
  if (!game || !Array.isArray(game.shifts) || sec == null) return out;
  const homeId = game.teams?.home?.id;
  /* ⛔ DEDUPED BY PLAYER, because a player can carry TWO overlapping rows and
     `s < t <= e` matches both — the row he is finishing and the row he is
     starting. Found by the test, not by reading: a naive push listed him twice,
     which on screen is a sixth skater who does not exist. A count check would
     have called that a line change and been satisfied. */
  const seen = new Set();
  for (const r of game.shifts) {
    if (!holds(r)) continue;
    if (seen.has(r.p)) continue;
    const p = game.roster?.[r.p];
    if (!p) continue;                       // a name we cannot print is not a name
    seen.add(r.p);
    const side = r.t === homeId ? out.home : out.away;
    (p.pos === 'G' ? side.goalies : side.skaters).push({ id: r.p, n: p.n, nm: p.nm, pos: p.pos });
  }
  /* SORTED BY SWEATER NUMBER, which is the only order a viewer can check against
     a broadcast. Position would need a vocabulary the card does not teach, and
     roster order is an accident of the feed. */
  for (const s of [out.away, out.home]) {
    s.skaters.sort((a, b) => a.n - b.n);
    s.goalies.sort((a, b) => a.n - b.n);
  }
  return out;
}
