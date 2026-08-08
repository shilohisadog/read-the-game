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
 * Why this event is not even-strength play, in a sentence a novice can use.
 * Returns null when it IS even strength, or when the code is unreadable.
 */
export function whyNotEven(e, ctx) {
  const s = situation(e.sit, ctx);
  if (s == null) return `game state not recorded for this event`;
  if (s.kind === EVEN) return null;

  // THE COUNTS ARE STATED RELATIVE TO THE TEAM THE SENTENCE NAMES, not in the
  // feed's away-then-home order. Those coincide only when the named team is the
  // away team, so half of these read backwards: with code 1451 the away side has
  // 4 and the home side 5, and "BUF were on the power play -- 4 skaters against
  // 5" says the team on the advantage has FEWER players. 36 of this game's 103
  // strength exclusions were that sentence. Whoever reads it is a novice being
  // told why 49 attempts vanished, so it has to survive being read literally.
  const forTeam = id => id === ctx.homeId
    ? { ab: ctx.homeAb, own: s.home, opp: s.away }
    : { ab: ctx.awayAb, own: s.away, opp: s.home };

  if (s.kind === EMPTY_NET) {
    // Name the team that pulled, and count from their side.
    const { ab, own, opp } = forTeam(s.code[0] === '0' ? ctx.awayId : ctx.homeId);
    return `${ab} had pulled their goalie — ${own} skaters against ${opp} with an empty net`;
  }
  const { ab, own, opp } = forTeam(s.advantage);
  return `${ab} were on the power play — ${own} skaters against ${opp}`;
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
