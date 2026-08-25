/**
 * Rink geometry.
 *
 * Coordinates in the extract are already normalized so the HOME team defends the
 * -x end and the AWAY team defends +x, in every period. (Teams switch ends each
 * period in the raw feed; extraction undoes that using `homeTeamDefendingSide`.)
 *
 * A team's *attacking* net therefore sits at x = +89 for home and x = -89 for
 * away, and distance has to be measured to the net a team is shooting AT.
 *
 * The bug this replaces used `89 - Math.abs(x)`, which measures to whichever net
 * is *nearer*. That is correct for shots taken in the attacking half and wrong
 * for every shot taken in a team's own half -- three events in the reference
 * game were mis-measured by up to 123 feet. It happened not to change any
 * high-danger classification, because all three also failed the slot test, so
 * the count was right by luck. Luck is not a test.
 */

export const NET_X = 89;
export const GOAL_LINE_X = 89;      // the same line; named for the rule that uses it
export const BLUE_LINE_X = 25;      // zone boundary, and what an offside is about
export const CENTRE_X = 0;
export const SLOT_HALF_WIDTH = 22;   // feet either side of centre
export const HIGH_DANGER_FT = 33;    // Doctrine section 7: a rule, not a model

/** +1 if this team attacks toward +x, -1 if toward -x. */
export function attackDirection(teamId, homeTeamId) {
  return teamId === homeTeamId ? 1 : -1;
}

/** Feet from (x,y) to the net this team is shooting at. */
export function distanceToNet(x, y, dir) {
  return Math.hypot(NET_X - x * dir, y);
}

/**
 * Doctrine section 7: high danger is a geometric RULE, not an expected-goals
 * model -- inside 33 feet, inside the slot, and IN FRONT OF THE NET -- so that a
 * viewer can check it with a ruler.
 *
 * ⭐ THE THIRD CLAUSE WAS FOUND BY DRAWING THE RULE, 2026-08-25.
 *
 * The slot became permanent furniture on the ice, and furniture has to be the
 * rule itself or the viewer cannot check a mark against it. Drawn faithfully,
 * the region reached PAST THE GOAL LINE to the end boards -- because a radius
 * does not stop at the net -- and Kevin, looking at the picture: "I don't
 * consider the slot to be valid behind the net."
 *
 * He is right about hockey, and a wrap-around from three feet out was never a
 * shot from the slot. The first two clauses had simply never been asked to draw
 * themselves, so nobody had seen what they admitted.
 *
 * WHAT IT COSTS, MEASURED BEFORE IT CHANGED, over 4,192 in-scope games:
 *   262,539 attempts met the old rule; 4,249 of them (1.62%) were behind the
 *   goal line. Of 19,304 high-danger goals, 171 (0.89%). About one mark a game.
 * Nothing archive-wide moves: neither builders/measure.mjs nor src/lib/archive.js
 * reads this function, so no published rate or base rate is derived from it.
 *
 * AND IT IS STILL A RULE YOU CAN CHECK WITH A RULER, which is the whole of
 * Doctrine 7. Three clauses, all geometric, none of them fitted to an outcome.
 */
export function isHighDanger(x, y, dir) {
  return distanceToNet(x, y, dir) <= HIGH_DANGER_FT
    && Math.abs(y) <= SLOT_HALF_WIDTH
    && x * dir <= NET_X;
}

/**
 * THE DISCLOSURE THE PAGE HAS OWED SINCE THE ENDS DECISION.
 *
 * `docs/ends-switching.md` committed to this sentence in §6, worked out its
 * wording in §7.5 and listed it as step 4 in §8. It was never built. What
 * shipped instead was the `ATTACKS →` indicator, which states the convention
 * WITHOUT the disclosure that makes it honest -- so the arrows made the
 * contradiction sharper rather than safer, and every argument since has compared
 * one-direction WITHOUT its mitigation against as-played.
 *
 * TWO SENTENCES, TWO KINDS, which is the pattern the shootout notice opened.
 * The first is about hockey and its subject is a rule; the second is about US --
 * what we did to the data and why. Every other provenance tag we own (`rule:`,
 * `field:`) points into the game or the feed. `display:` points at the renderer,
 * and saying which is which is the difference between a statement and an excuse.
 *
 * IT IS NOT AN ALTERNATIVE TO THE CONTROL, it is a prerequisite for it (CHENG).
 * Whichever way the default is eventually ruled, a reader has to be told what
 * the screen is doing, so this sentence is never thrown away. And it is easier
 * to write for as-played than for one-direction -- there it need only say what
 * just happened -- which is an argument the ends decision should weigh.
 *
 * `from` IS DATA, NOT COPY. Rendered on the ice it ran the note to 176px on a
 * 390px phone -- taller than the rink it sits above, on a page Kevin had just
 * called overcrowded. `LINK_NOTES`, the other member of this family, renders
 * only its `text` and keeps `from` for the tests and the record; that precedent
 * was right and this broke it. Measured, not guessed.
 *
 * WHEN, NOT WHETHER: a note appears when the thing it explains happens. The
 * moment a viewer asks "why didn't they switch?" is the start of the second
 * period, so that is where this appears, and it stands down again once the
 * period is under way. The arrows carry the convention permanently; this
 * carries the explanation, briefly, at the one instant it is the answer to a
 * question somebody is actually asking.
 */
export const ENDS_NOTE = {
  /* AS-PLAYED: A CAPTION ON SOMETHING VISIBLE. The rink has just turned over in
     front of the reader, so the sentence names what they saw and stops. There is
     no `display:` half because we did nothing to the geometry worth disclosing —
     following the record is not a transform. */
  'as-played': {
    rule: 'The teams have just changed ends, as they do every period.',
    from: 'rule: the feed records which end each team defended in each period, '
        + 'and the rink follows it',
  },
  /* ONE-DIRECTION: THE SENTENCE CARRIES ALL THE LOAD, and CHENG's point is that
     this makes it the harder of the two to write and the one whose weakness
     would be invisible in testing — because a test of the default never runs it.
     Nothing on screen shows the ends changing, so if this sentence fails, the
     silent transform is back and nothing else catches it. */
  fixed: {
    rule: 'The teams just changed ends, as they do every period.',
    display: 'We hold the rink the same way all game, so the marks stay comparable.',
    from: 'display: the feed records which end each team defended and the extract '
        + 'normalizes it away, so the rink is held in one direction',
  },
};

/**
 * THE STANDING KEY — the half of the disclosure that never expires.
 *
 * CHENG, splitting the rule from the event: a note about a switch cannot explain
 * an orientation that was set at the OPENING FACEOFF, and under as-played that is
 * the usual case — the host's raw period-one end is `right` in 38 of 60 games, so
 * its net is on the screen's left while its badge sits on the board's right,
 * before anything has changed.
 *
 * A time-boxed sentence also cannot cover a timeline a reader moves through
 * freely: a learn-page door lands at 3-01:40, and a scrub from 2-05:00 to
 * 3-01:40 turns the ice over with nothing said.
 *
 * So the RULE is permanent and the EVENT is time-boxed. The permanent half is a
 * fact about hockey rather than a disclaimer about us, which is why it can be
 * ungated: rules cards do not expire.
 */
export const ENDS_KEY = {
  'as-played': {
    rule: 'the teams switch ends every period, as they do in the arena',
    from: 'rule: a fact about hockey, not a claim about this page',
  },
  fixed: {
    display: 'ends are held fixed — in the arena the teams switch each period',
    from: 'display: the extract normalizes the switch away, so the rink is held '
        + 'in one direction',
  },
};

/**
 * Should the standing key be showing?
 *
 * ASYMMETRIC ON PURPOSE, and the asymmetry is the argument. Under as-played the
 * orientation is already unusual in the first period, so the key is ungated.
 * Under one-direction nothing has yet failed to occur until the game leaves the
 * first period — which is the gate's original reason, and it survives unchanged
 * for the mode it was written about.
 */
export function endsKeyShowing(mode, e) {
  if (mode === 'as-played') return true;
  return !!e && e.per > 1;
}

/** How long the disclosure stands, in seconds of play after a period begins. */
export const ENDS_NOTE_SECONDS = 90;

/**
 * Should the ends disclosure be showing at this moment?
 *
 * @param {{per:number, s:number}} e   the event being rendered
 * @param {number} periodStart         elapsed seconds at which `e`'s period began
 *
 * NOT IN THE FIRST PERIOD, because nothing has changed yet and a sentence about
 * a switch that has not happened is furniture. `periodStart` is passed in rather
 * than computed from the period number: regulation periods are 1200 seconds and
 * overtime is not, so deriving it would be a rule with no source in the data.
 */
export function endsNoteShowing(e, periodStart) {
  if (!e || !(e.per > 1)) return false;
  return e.s - periodStart < ENDS_NOTE_SECONDS;
}
