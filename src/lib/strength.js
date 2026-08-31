/**
 * Game state — even strength, a power play, or an empty net.
 *
 * `situationCode` is four digits: [awayGoalie][awaySkaters][homeSkaters][homeGoalie].
 * A goalie digit of 0 means that net is empty. Until this was extracted the app
 * could not tell those three situations apart, and in the reference game that
 * mattered: 12 of Minnesota's 80 attempts came 6-on-5 with their own net empty,
 * which is the entire gap between 59.3% control and 55.8%.
 *
 * THE SET OF CODES IS KNOWN-INCOMPLETE. This game shows five. A real season adds
 * 3-on-3 overtime, 5-on-3, 4-on-3, penalty shots and both goalies pulled. So an
 * unrecognised code returns `null` and the caller must refuse to classify rather
 * than guess — the same gate `extract.py --vocab` applies at ingestion.
 *
 * ONE empty-net state, deliberately. A pulled goalie means opposite things
 * trailing late (desperation) and on a delayed penalty (free attack), but this
 * game contains no delayed-penalty pull, so a second state would be designed
 * against a case the data does not contain — which is exactly how the
 * blocked-shot flip got in. When a game shows one, it is distinguishable
 * without inference, because a `delayed-penalty` event is live in the stream.
 */

export const EVEN = 'even';
export const POWER_PLAY = 'power-play';
export const EMPTY_NET = 'empty-net';

/** Codes this module knows how to read. Anything else is a refusal, not a guess. */
export const KNOWN_SITUATIONS = new Set([
  '1551', '1541', '1451', '1441', '0651', '1560', '1450', '1540',
]);

/**
 * @returns {{kind, advantage, away, home, code}} or null if unrecognised.
 *   kind       EVEN | POWER_PLAY | EMPTY_NET
 *   advantage  team id with the extra skater, or null
 */
export function situation(code, ctx) {
  if (!code || !KNOWN_SITUATIONS.has(code)) return null;

  const awayGoalie = code[0] !== '0';
  const away = +code[1];
  const home = +code[2];
  const homeGoalie = code[3] !== '0';

  // An empty net dominates: 6-on-5 with a net empty is not a power play, and
  // calling it one would put desperation time in the same bucket as a penalty.
  if (!awayGoalie || !homeGoalie) {
    return { kind: EMPTY_NET, code, away, home,
             advantage: !awayGoalie ? ctx.awayId : ctx.homeId };
  }
  if (away === home) return { kind: EVEN, code, away, home, advantage: null };
  return { kind: POWER_PLAY, code, away, home,
           advantage: away > home ? ctx.awayId : ctx.homeId };
}

/** True when play was at even strength — 5v5, 4v4 or 3v3, both goalies in. */
export function isEven(code, ctx) {
  const s = situation(code, ctx);
  return s != null && s.kind === EVEN;
}

/**
 * WHICH TEAM A SENTENCE ABOUT THIS SITUATION IS ABOUT, and the counts stated
 * from that team's side.
 *
 * ⭐ ONE READER, because this seam shipped backwards once. The counts must be
 * relative to the team the sentence NAMES, not in the feed's away-then-home
 * order. Those coincide only when the named team is the away team, so half of
 * them read backwards: with code 1451 the away side has 4 and the home side 5,
 * and "BUF were on the power play -- 4 skaters against 5" says the team on the
 * advantage has FEWER players. 36 of the reference game's 103 strength
 * exclusions were that sentence. Whoever reads it is a novice, so it has to
 * survive being read literally.
 *
 * It is a function rather than two copies because there are now TWO callers --
 * the exclusion ledger and the scoreboard badge -- and a second statement of
 * this is a second chance to get it backwards.
 */
function relativeTo(s, ctx) {
  // A power play names the club with the extra skater; an empty net names the
  // club that pulled, which `code[0]` (the away goalie digit) identifies.
  const id = s.kind === EMPTY_NET
    ? (s.code[0] === '0' ? ctx.awayId : ctx.homeId)
    : s.advantage;
  return id === ctx.homeId
    ? { id, ab: ctx.homeAb, own: s.home, opp: s.away }
    : { id, ab: ctx.awayAb, own: s.away, opp: s.home };
}

/**
 * Why this event is not even-strength play, in a sentence a novice can use.
 * Returns null when it IS even strength, or when the code is unreadable.
 */
export function whyNotEven(e, ctx) {
  const s = situation(e.sit, ctx);
  if (s == null) return `game state not recorded for this event`;
  if (s.kind === EVEN) return null;

  const { ab, own, opp } = relativeTo(s, ctx);
  return s.kind === EMPTY_NET
    ? `${ab} had pulled their goalie — ${own} skaters against ${opp} with an empty net`
    : `${ab} were on the power play — ${own} skaters against ${opp}`;
}

/**
 * ⭐ THE CONDITION RIGHT NOW, for a badge that SITS on the scoreboard rather
 * than announcing itself. Returns null at even strength and on an unreadable
 * code — a badge that stays on screen must never claim a state we cannot read.
 *
 * ⭐ WHY THIS IS A SEPARATE FUNCTION FROM `whyNotEven` AND NOT A FORMATTING
 * FLAG. They differ in TENSE and in JOB, not in wording. `whyNotEven` explains,
 * in the past, why a counted thing was dropped from a ledger; this states, in
 * the present, what is true of the ice being drawn. They share the only part
 * that has ever been wrong — which team, and whose skaters — via `relativeTo`.
 *
 * ⚠️ IT READS THE FRAME'S OWN CODE, WHICH IS WHY IT LAGS THE PENALTY BY ONE
 * EVENT, and that is correct rather than a defect. `render` already documents
 * it at the penalty caption: at the frame the penalty is called the offending
 * team is not yet a skater short (`sit` still reads 1551), so a badge lit there
 * would be "a claim about the future dressed as a description." Measured across
 * 60 archive games: the strength code changes exactly one frame later, 0
 * seconds of game clock later, on 317 of 317 power plays.
 *
 * @returns {{kind, id, ab, own, opp, said, count}} or null
 */
export function standing(code, ctx) {
  const s = situation(code, ctx);
  if (s == null || s.kind === EVEN) return null;
  const { id, ab, own, opp } = relativeTo(s, ctx);
  return { kind: s.kind, id, ab, own, opp,
           said: s.kind === EMPTY_NET ? 'net empty' : 'power play',
           count: `${own} on ${opp}` };
}

/**
 * The windows in which play was not even strength, for marking a timeline.
 *
 * A penalty can carry across the intermission — in the reference game one runs
 * from P2 00:36 to P3 18:43 — so a window is NOT period-local and callers must
 * not assume it is.
 */
export function windows(events, ctx) {
  const out = [];
  let cur = null;
  events.forEach((e, id) => {
    if (!e.sit) return;
    const s = situation(e.sit, ctx);
    const kind = s == null ? null : s.kind;
    if (kind == null || kind === EVEN) { cur = null; return; }
    const key = `${kind}:${s.advantage}`;
    if (!cur || cur.key !== key) {
      cur = { key, kind, advantage: s.advantage, from: id, to: id,
              fromPer: e.per, fromRem: e.rem, toPer: e.per, toRem: e.rem };
      out.push(cur);
    } else {
      Object.assign(cur, { to: id, toPer: e.per, toRem: e.rem });
    }
  });
  return out;
}
