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
 * ⭐ THE FRAMES AT WHICH A PENALTY WAS KILLED — the moment the feed does not
 * record.
 *
 * Kevin, watching a replay event by event: *"I was wondering why don't we say
 * when the penalty expires."* Measured across 60 archive games: **308 power
 * plays end, and 78.6% of them end because the penalty simply ran out — with no
 * event in the feed and nothing on the page saying so.** A penalty expiring
 * produces no play; the situation code just changes on the next recorded event.
 *
 * ⭐ `endedBy` IS WHY THIS TAKES THE STINTS RATHER THAN LOOKING FOR A GOAL.
 * `box.js` already derives early release — a minor dies when the other team
 * scores on it — and it is the tested rule for the exact distinction this
 * sentence makes: KILLED versus SCORED ON. The alternative was "no goal within
 * N frames", and N would be a constant with no source in the data. (For the
 * record, it would also have been wrong: the power-play goal sits one frame
 * before the change 19.3% of the time, on the same frame 1.5%, and three frames
 * back once in 327.)
 *
 * ⛔ IT IS DELIBERATELY NOT BUILT ON `windows()`. That answers "when was play
 * not even", which is a question about the whole interval; this one is about a
 * single boundary and the two frames either side of it. Bending one into the
 * other would give both a shape that suits neither.
 *
 * THE THREE REFUSALS, each a case where the sentence would be false:
 *   an INTERMISSION between the two frames — a penalty can carry across it, so
 *     nothing expired (4 of 327);
 *   the short side did NOT gain a skater — 5-on-4 going to 4-on-4 is a SECOND
 *     penalty cancelling the advantage, not a kill (26 of 327, 8.0%);
 *   the stint ended by a GOAL — the power play was scored on, and the goal
 *     caption owns that frame anyway (69 of 327, 21.1%).
 *
 * ⭐ VALIDATED AGAINST A SECOND, INDEPENDENT PATH. Over 60 archive games this
 * finds 205 kills; a "no goal within three frames" heuristic finds 208, and the
 * two disagree on 15 — in BOTH directions, which is what makes the comparison
 * worth anything. Nine are the heuristic announcing a kill while somebody is
 * still in the box (coincidental majors: two men off, five a side on the ice);
 * six are a goal by the club on the advantage that did NOT end the penalty,
 * because it was a major. This rule is right in both directions, and it is right
 * because `box.js` already knew.
 *
 * @param {Array} events   the PLAYABLE timeline; `at` indexes into it
 * @param {Array} boxStints  `box.js::stints`, computed over ALL events
 * @returns {Array<{at, killedBy, aside}>} `killedBy` is the club that was short;
 *   `aside` is the skaters each side now has, READ from the code rather than
 *   assumed to be five, so the sentence cannot outlive the situations we know.
 *
 * ⚠️ AND `aside` IS UNTESTABLE TODAY — A WEAK MUTATION, NOT A HOLE, WRITTEN DOWN
 * SO NOBODY HUNTS FOR THE TEST. Replacing `now.home` with the literal `5`
 * survives the whole suite, and no test could kill it: every power play in
 * `KNOWN_SITUATIONS` is five-on-four, so a kill always lands on five-on-five and
 * the two are behaviourally identical on every frame the archive contains. It is
 * read from the code anyway because the alternative is a constant that becomes
 * a lie the day `KNOWN_SITUATIONS` learns four-on-three — which is the same
 * defence `situation()` itself is built on.
 */
export function powerPlayOver(events, boxStints, ctx) {
  const out = [];
  for (let i = 1; i < events.length; i++) {
    const was = situation(events[i - 1].sit, ctx), now = situation(events[i].sit, ctx);
    if (was == null || now == null) continue;
    if (was.kind !== POWER_PLAY || now.kind !== EVEN) continue;
    if (events[i].per !== events[i - 1].per) continue;

    // WHO WAS KILLING IT: the club that did NOT have the extra skater.
    const shortId = was.advantage === ctx.homeId ? ctx.awayId : ctx.homeId;
    const isHome = shortId === ctx.homeId;
    // ⭐ A RELATIONSHIP, NOT THE CODE `1551`. What makes this a kill is that the
    // short side GAINED a skater — their penalised player came back. Pinning the
    // literal code would state the same thing in a form that says nothing about
    // why, and would quietly exclude any future strength the league invents.
    if (!((isHome ? now.home : now.away) > (isHome ? was.home : was.away))) continue;

    /* ⚠️ THE WINDOW IS CLOSED AT BOTH ENDS, AND A MUTATION IS WHY. It was
       `s.end > events[i-1].s`, which makes the window EMPTY whenever two
       consecutive frames share a second — and that is precisely what a goal and
       its restarting faceoff do. In the reference game both penalties killed by
       a goal sit at 1170 and 3147 with the goal and the faceoff on the same
       second, so `ended` came back empty and the transition was refused by "no
       stint ended here" instead of by `endedBy === 'goal'`. Right answer, wrong
       reason — and it left the guard that does the real work unexercised, which
       is how a mutation disabling it survived a green suite. `>=` is safe: the
       previous frame's own code still says the club was short, so a stint
       ending on that second had not yet been reflected. */
    const ended = boxStints.filter(s => s.team === shortId
      && s.start <= events[i - 1].s && s.end >= events[i - 1].s && s.end <= events[i].s);
    if (!ended.length) continue;
    /* ⭐⭐ THE GOAL-ENDED CASE IS RETURNED NOW RATHER THAN REFUSED, and this
       docstring's third refusal is why it had to change. It read "the stint
       ended by a GOAL — the power play was scored on, AND THE GOAL CAPTION OWNS
       THAT FRAME ANYWAY (69 of 327, 21.1%)". The first half is a fact about
       hockey and stands. The second half was an assumption about presentation
       living inside a reducer, and it was wrong: the goal caption owning the
       frame is exactly why nothing ever says the power play ended, and one in
       five endings went by in silence.

       Kevin found it from the other side — a power play, then a goal, then the
       pill dark with nothing connecting them: "nothing shows the power play is
       now over, that's a gap I think." He is right, and he is also evidence of
       how big the gap is: he read that sequence as the GOAL ending the penalty,
       and on that specimen it had actually expired on the clock four seconds
       earlier. A page silent about a rule lets a viewer who knows the sport cold
       infer the wrong one.

       WHICH FRAME IT IS SAID ON IS THE CALLER'S PROBLEM. This reports what
       happened and when the strength changed; app.js decides that a goal keeps
       its own frame and the strength change lands on the next one. A reducer
       that skipped a fact because of what some page might draw is the shape
       being removed here, not repeated. */
    const by = ended.every(s => s.endedBy === 'time') ? 'time'
             : ended.every(s => s.endedBy === 'goal') ? 'goal' : null;
    // MIXED IS REFUSED, not guessed. Two penalties ending on one boundary by
    // different causes has no single true sentence, and inventing one is worse
    // than the silence this change exists to remove.
    if (by == null) continue;
    /* ⭐ `sayAt` — THE FRAME THE SENTENCE GOES ON, WHICH IS NOT ALWAYS `at`.
       A goal is the biggest thing that happens in hockey and its caption owns
       its own frame; a strength change arriving in the same breath is thrown
       away, which is the silence Kevin found. So when the transition surfaces ON
       a goal, the sentence waits one frame — the goal keeps its moment and the
       strength change lands where the badge actually goes dark, which is roughly
       what a broadcast does: call the goal, then note the strength.

       ONE FRAME, NEVER MORE, AND NEVER ACROSS A PERIOD. Deferring repeatedly
       would let a sentence drift away from the thing it describes, and across an
       intermission it would be describing a different situation entirely.
       If the next frame is ANOTHER goal there is nowhere honest to put it and it
       stays where it is rather than chasing.

       ⭐ IT LIVES HERE, NOT IN app.js, BECAUSE IT IS TESTABLE HERE. Which frame
       carries a sentence is a fact about the timeline, and the reference game
       cannot express this case at all — none of its six transitions lands on a
       goal, so a check driven through the page could only ever assert the
       branch that does nothing. Constructed events reach it; a fixture cannot. */
    const nxt = events[i + 1];
    const defer = events[i].type === 'goal' && nxt && nxt.type !== 'goal'
                  && nxt.per === events[i].per;
    /* ⭐ BOTH CLUBS, BECAUSE THE TWO SENTENCES HAVE DIFFERENT SUBJECTS.
       "Penalty killed" is about the club that HELD — the short one. "Power play
       over" is about the club that HAD the advantage. Returning only `killedBy`
       forced the caption to chip the penalised club under both, so a power play
       scored on read as "BUF · Power play over" when the power play was MIN's —
       the chip naming the opposite club from its own verb's subject.
       That is the exact defect `relativeTo` above exists to prevent, found by
       reading the rendered pill rather than by any test. */
    out.push({ at: i, sayAt: defer ? i + 1 : i,
               killedBy: shortId, advantage: was.advantage, aside: now.home, by });
  }
  return out;
}

/**
 * The power play RAN OUT — a kill, which is `powerPlayOver` filtered to the clock.
 *
 * ⭐ ONE WALK, TWO VIEWS. A power play that expires is a kill; one that is
 * SCORED ON is the opposite of a kill, and calling both by one name would put
 * the shield on a team that just conceded. They keep different names and
 * different sentences, and share every line of the derivation — the transition,
 * the skater-gained relationship, and all three refusals — because that is one
 * claim about the situation code and a second copy is where the two would drift.
 */
export const penaltyKilled = (events, boxStints, ctx) =>
  powerPlayOver(events, boxStints, ctx).filter(k => k.by === 'time');

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
