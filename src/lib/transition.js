/**
 * What happened BETWEEN two recorded events.
 *
 * THE COMPLAINT THIS EXISTS FOR is the oldest one on the project. Kevin,
 * stepping through `?game=2025021245&at=2-18:52`: "the site shows several rather
 * disjointed events... a WSH hit, then play is at the other end of the ice for a
 * TOR shot on goal, and then a faceoff, without any connecting the dots to
 * attempt to explain how that sequence played out."
 *
 *     18:52  WSH  hit           x = -80     deep in Toronto's end
 *             ...28 seconds and 161 feet, recorded nowhere...
 *     18:24  TOR  shot on goal  x = +81     the other end
 *
 * A fan reads that instantly. A novice cannot, and the page says nothing.
 *
 * ⭐ MEASURED FIRST, 60 live games, 15,350 consecutive transitions inside a
 * period. The median gap between one recorded event and the next is NINE
 * SECONDS and forty-eight feet -- 93px of a 386px rink -- and 48.3% of
 * transitions span ten seconds or more. The replay renders every one of them as
 * a cut and says nothing about any of them.
 *
 * ⭐⭐ AND THE SAME MEASUREMENT SAYS DISTINCTNESS IS NOT WHAT IS MISSING.
 * 97.1% of frames move the mark more than five feet; every frame already differs
 * maximally from the last and not one of them is legible. So this module does
 * not add another distinction -- it states the one fact that makes two adjacent
 * frames read as one sequence: THE PLAY WENT FROM THERE TO HERE, AND THIS LONG.
 *
 * ⛔ WHAT IT REFUSES TO SAY, AND THIS IS THE LOAD-BEARING PART.
 *
 * The obvious sentence is "Toronto has it now" -- the acting team changes on
 * 45.0% of transitions. IT IS NOT SAFE, and Kevin's own specimen is the proof.
 * `own` is `eventOwnerTeamId`, and it means a DIFFERENT THING per event type.
 * Two of those meanings are already written down elsewhere in this repo: a
 * blocked shot credits the SHOOTER (attribution.js), a penalty credits the
 * OFFENDING team (extract.py). Add the rest -- a faceoff credits the WINNER, a
 * giveaway the team LOSING it, a takeaway the team GAINING it, and a hit the
 * HITTER, who by rule is the team WITHOUT the puck, since only the puck carrier
 * may be checked.
 *
 * So on the specimen, WSH-hit -> TOR-shot reads as "the team changed" while
 * Washington never had the puck at all: they checked the carrier and failed to
 * get it. Toronto had it throughout. 41.0% of all team-change transitions touch
 * a hit at one end or the other, and 7.6% are shot -> faceoff, where the flip
 * only means the other side won the draw.
 *
 *     A field whose meaning changes with the event type cannot be compared
 *     across two events. Never two wearing one label (docs/one-measure.md).
 *
 * WHAT IS SAFE is `x` -- a location on the ice, one meaning on every event type
 * -- and `s`, which is seconds on every event type. WHERE and HOW LONG, never
 * WHOSE.
 */

import { BLUE_LINE_X } from './rink.js';

/**
 * Did the play go end to end between these two events?
 *
 * ⭐ BOTH ENDS BEYOND A BLUE LINE, ON OPPOSITE SIDES -- and the blue line is
 * doing two jobs, only one of which is obvious.
 *
 * The obvious job is truthfulness. "Crossed centre ice" is 24.8% of
 * transitions, but a quarter of those land in the NEUTRAL ZONE, where the words
 * "the other end" would be an overstatement. Requiring both events beyond a
 * blue line makes the sentence literally true of every case it fires on:
 * 2,817 transitions, 18.4% of the total, 47 a game, median gap 16 seconds.
 *
 * ⚠️ THE SECOND JOB IS THE TRAP IT CLOSES, AND I WALKED INTO IT FIRST.
 * A naive `(prev.x < 0) !== (cur.x < 0)` puts x === 0 silently on the positive
 * side, and x === 0 is the CENTRE-ICE FACE-OFF DOT -- 716 of 15,546 timeline
 * events, 4.6%. Measured: that spelling reports 4,372 crossings against 3,803,
 * so **569 transitions would have been announced as "the other end" when one
 * end of them was the centre dot.** The blue-line guard makes x === 0
 * unreachable here, which is why there is no zero branch below: a dead branch
 * reads as coverage, and this file would rather carry the reason than the code.
 *
 * AND IT IS NOT A CHOSEN THRESHOLD. The blue line is painted on the ice, it is
 * the same `BLUE_LINE_X` the zone shading is drawn from, and a viewer can check
 * the claim against the paint. That is the same standing as the slot rule and
 * the whistle layer's pairing walk.
 *
 * SAME PERIOD ONLY. Across a period break the difference in `s` is not an
 * elapsed time and the teams have swapped ends, so neither half of the sentence
 * survives -- the same guard `sinceLine` already applies for the same reason.
 */
export function endToEnd(prev, cur) {
  if (!prev || !cur) return false;
  if (prev.per !== cur.per) return false;
  if (prev.x == null || cur.x == null) return false;
  if (Math.abs(prev.x) <= BLUE_LINE_X || Math.abs(cur.x) <= BLUE_LINE_X) return false;
  return (prev.x < 0) !== (cur.x < 0);
}

/**
 * An elapsed time, spoken.
 *
 * ⭐ EXTRACTED RATHER THAN WRITTEN. `app.js` already held TWO spellings of this
 * -- `mmss()` and an inline expression inside `sinceLine` -- which do not agree:
 * one says "0:28" and the other "28s". They are different jobs and both are
 * right, but a third spelling arriving with this module would have been the
 * point at which nobody could say which was canonical. `sinceLine` now reads
 * this, so the whistle card, the blocked panel and the transition line all
 * speak a duration the same way.
 *
 * Under a minute reads as seconds because that is how hockey is spoken; a
 * minute and over takes the clock's own form, which is the form the scoreboard
 * beside it is already using.
 */
export function spokenGap(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * The words, chosen in one place.
 *
 * Same argument as `playSaid` in app.js: the moment two surfaces spell a fact
 * differently is the moment a reader concludes we cannot count. Returns '' when
 * there is nothing true to say, so every caller's guard is this function.
 *
 * ⚠️ NO SUBJECT AND NO VERB OF POSSESSION. "The other end" is a statement about
 * the ICE. Any wording naming a team here would be the `own` composition this
 * module's header refuses -- and it would be wrong on the very sequence that
 * prompted the work.
 */
export function transitionSaid(prev, cur) {
  if (!endToEnd(prev, cur)) return '';
  const gap = spokenGap(cur.s - prev.s);
  return gap ? `the other end · ${gap} later` : 'the other end';
}
