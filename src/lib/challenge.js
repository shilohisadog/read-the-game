/**
 * COACH'S CHALLENGES AND LEAGUE REVIEWS of a goal, read from the record, and the
 * sentence that says how each ended.
 *
 * The league records a review as a stoppage whose reason (or secondary reason) is
 * `chlg-{hm|vis|league}-{off-side|goal-interference|missed-stoppage}`. When a goal
 * comes off, the league DELETES the goal event, so the outcome is read from what is
 * left in that stretch of play:
 *   a goal by the other bench + `delaying-game-unsuccessful-challenge`  stood
 *   no goal, no penalty                                                came off
 *   the challenger's own goal, no penalty                              counts (awarded)
 *   no goal + the penalty                                              does not count (stayed off)
 * A league review has no challenger: a goal in the record stood, none came off.
 * Archive, 4,702 games: 793 reviews of a goal; the restart agrees with the reading
 * (centre ice after a goal that counts) on 771 of the 778 with a face-off.
 * Who scored a goal that came off is not recorded; nor which team's goal a league
 * review took off.
 */
import { framed } from './layer.js';

const KIND = /^chlg-(hm|vis|league)-(off-side|goal-interference|missed-stoppage)$/;
const LOST = 'delaying-game-unsuccessful-challenge';
// Rulings the league records after a missed-stoppage review, in plain words.
const RULING_WORDS = { 'high-stick': 'a high stick on the puck', 'hand-pass': 'a hand pass',
  'puck-in-benches': 'the puck went into a bench' };
const NOT_A_TARGET = new Set(['goal', 'game-end']);

/**
 * Every review of a goal in `ev`:
 *   {at, kind, who, challenger, scorer, outcome, ruling, goal, penalty, target, onGoal}
 * `at` is the stoppage's index; `target` the frame the outcome is said on (the first
 * frame of play after the review, or the goal itself when the game ends on it).
 */
export function challenges(ev, ctx) {
  const out = [];
  ev.forEach((e, n) => {
    if (e.type !== 'stoppage') return;
    const m = [e.rsn, e.rsn2].map(r => KIND.exec(r || '')).find(Boolean);
    if (!m) return;
    const [, who, kind] = m;
    const challenger = who === 'hm' ? ctx.homeId : who === 'vis' ? ctx.awayId : null;
    let from = n - 1;
    while (from >= 0 && ev[from].type !== 'faceoff' && ev[from].type !== 'period-start') from--;
    const same = [];
    for (let k = n + 1; k < ev.length && ev[k].per === e.per && ev[k].s === e.s; k++) same.push(k);
    const goal = [...ev.slice(from + 1, n).map((x, j) => x.type === 'goal' ? from + 1 + j : -1), ...same.filter(k => ev[k].type === 'goal')]
      .filter(k => k >= 0).pop();
    const penalty = same.find(k => ev[k].type === 'penalty' && ev[k].pen === LOST);
    const ruling = same.map(k => ev[k]).find(x => x.type === 'stoppage' && !KIND.test(x.rsn || '') && x.rsn !== 'tv-timeout');
    const g = goal != null ? ev[goal] : null;
    let outcome, scorer;
    if (challenger == null) { outcome = g ? 'stood' : 'off'; scorer = g ? g.own : null; }
    else if (g && g.own === challenger) { outcome = 'awarded'; scorer = challenger; }
    else if (g) { outcome = 'stood'; scorer = g.own; }
    else if (penalty != null) { outcome = 'stayed-off'; scorer = challenger; }
    else { outcome = 'off'; scorer = challenger === ctx.homeId ? ctx.awayId : ctx.homeId; }
    let target = null;
    for (let k = n + 1; k < ev.length && ev[k].per === e.per; k++)
      if (framed(ev[k]) && !NOT_A_TARGET.has(ev[k].type)) { target = k; break; }
    const onGoal = target == null && goal != null;
    out.push({ at: n, kind, who, challenger, scorer, outcome, ruling: ruling ? ruling.rsn : null,
      goal: goal ?? null, penalty: penalty ?? null, target: onGoal ? goal : target, onGoal });
  });
  return out;
}

const CLAIM = {
  'off-side': () => 'the play was offside before the goal',
  'goal-interference': s => `a ${s} player interfered with the goaltender`,
  'missed-stoppage': () => 'play should already have been stopped before the goal',
};
const FOUND = {
  'off-side': () => 'the play was offside',
  'goal-interference': s => `a ${s ? s + ' ' : ''}player interfered with the goaltender`,
  'missed-stoppage': (s, r) => `play should have been stopped${RULING_WORDS[r] ? ` (${RULING_WORDS[r]})` : ''}`,
};
const ABOUT = { 'off-side': 'offside', 'goal-interference': 'interference with the goaltender',
  'missed-stoppage': 'a missed stoppage' };

/**
 * The sentence for review `r`. `ab(id)` gives a team's abbreviation; `score` is
 * {teamId: goals} as the frame shows it. A penalty's consequence is the caller's.
 */
export function challengeSay(r, ab, score, ctx) {
  const S = r.scorer != null ? ab(r.scorer) : '', C = r.challenger != null ? ab(r.challenger) : '';
  const lost = ` and ${C} takes a two-minute penalty for losing the challenge.`;
  const h = score[ctx.homeId], a = score[ctx.awayId];
  const tally = h === a ? `The score stays tied, ${h}–${a}.`
    : `${h > a ? ctx.homeAb : ctx.awayAb} still leads ${Math.max(h, a)}–${Math.min(h, a)}.`;
  const cameOff = `The review determined ${FOUND[r.kind](S, r.ruling)}, so the goal came off. ${tally}`;
  if (r.who === 'league')
    return r.outcome === 'off' ? `The league reviewed a goal for ${ABOUT[r.kind]}. ${cameOff}`
      : `The league reviewed ${S}'s goal for ${ABOUT[r.kind]}. The review concluded the goal stands.`;
  if (r.outcome === 'off') return `${S} scored, but ${C} challenged that ${CLAIM[r.kind](S)}. ${cameOff}`;
  if (r.outcome === 'stood')
    return `${S} scored, and ${C} challenged that ${CLAIM[r.kind](S)}. The review concluded the goal stands`
      + (r.penalty != null ? `,${lost}` : '.');
  const own = `${C} challenged to have its goal count; the question was ${ABOUT[r.kind]}.`;
  return r.outcome === 'awarded' ? `${own} The review concluded the goal counts.`
    : `${own} The review concluded the goal does not count,${lost}`;
}
