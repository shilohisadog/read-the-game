/**
 * The whistle — why play stopped, and where it restarted.
 *
 * THE INVERSION. Every other layer treats a stoppage as "not a play" and discards
 * it; roughly one event in six. This layer makes them the subject and discards the
 * shots. It is the first genuinely independent reducer — corsi and goaltending were
 * built together, and the strength filter is a dimension of an existing one — so it
 * is also the first real evidence that the layer contract is an abstraction rather
 * than a description of two things that happened to look alike.
 *
 * IT NEEDS NO MEASUREMENT AND NO BASE RATE. Corsi, danger and control-while-level
 * each required deciding what to count and then defending it. An icing is not a
 * metric; it is a rule a novice has watched a hundred times and never had named.
 * That makes this the cheapest genuinely novice-facing thing we can build, and the
 * most exposed to the one failure this file is really about.
 *
 * WHAT THE FEED ACTUALLY GIVES US, because it is less than it feels like:
 *
 *   a stoppage carries `reason` AND NOTHING ELSE. No team, no player, no
 *   coordinates (0 of 43 in a real game). So "Buffalo iced the puck" is not
 *   something we know — only that an icing happened.
 *
 *   the faceoff that restarts play carries coordinates (63 of 63). So a whistle
 *   can be placed: WHAT from the stoppage, WHERE from the restart.
 *
 *   and sometimes there is no restart. 3 of 8,400 stoppages across 185 games end
 *   a period — an icing at the horn. Those are UNPLACED, which is a first-class
 *   answer and not a fallback: "we know this happened and cannot place it" is a
 *   different claim from "nothing happened".
 *
 * THE COPY IS DATA, NOT CODE, and that is the point. This layer is made almost
 * entirely of sentences, and sentences were the one artifact here with no gate on
 * them. The defect that produced this design was a sentence of mine — "they aren't
 * allowed to change TIRED players" — where three clauses are the rulebook and one
 * is a state of those players on that shift that the feed never recorded.
 *
 *     Every sentence's subject is a rule, a recorded field, or a count.
 *     Never a player, a team, or a moment.
 *
 * Enforced by `from` on every row: a sentence that cannot name its source is the
 * one to look at hardest. A banned-word list cannot be the gate — it is a
 * blacklist over an open vocabulary, and a green one reads as "the copy was
 * checked" — so it survives in the tests only as a regression guard.
 */
import { NOT_A_PLAY } from '../layer.js';

/** reason -> what it means, and where that meaning comes from. */
export const WHY = {
  icing: {
    say: 'Icing — the puck was sent from behind the centre line all the way past '
       + 'the far goal line untouched. The faceoff comes back to the offending '
       + 'end, and that team may not change players before it.',
    from: 'rule: NHL Rule 81',
  },
  offside: {
    say: 'Offside — an attacking player crossed the blue line ahead of the puck, '
       + 'so the zone entry does not count and the faceoff goes back outside.',
    from: 'rule: NHL Rule 83',
  },
  'goalie-stopped-after-sog': {
    say: 'The goaltender caught or covered the puck after a shot, which stops play '
       + 'and brings a faceoff.',
    from: 'field: rsn',
  },
  'puck-frozen': {
    say: 'The puck was covered and play stopped.',
    from: 'field: rsn',
  },
  'skater-puck-frozen': {
    say: 'A skater, not the goaltender, froze the puck against the boards or the '
       + 'net, and play stopped.',
    from: 'field: rsn',
  },
  'puck-in-netting': {
    say: 'The puck was shot out of play into the netting above the glass.',
    from: 'field: rsn',
  },
  'puck-in-crowd': {
    say: 'The puck left the ice into the crowd.',
    from: 'field: rsn',
  },
  'puck-in-benches': {
    say: 'The puck went into a player bench and play stopped.',
    from: 'field: rsn',
  },
  'hand-pass': {
    say: 'Hand pass — the puck was directed to a teammate with a hand in a zone '
       + 'where that is not allowed, so possession does not carry.',
    from: 'rule: NHL Rule 79',
  },
  'high-stick': {
    say: 'The puck was played with a stick above shoulder height, which is not '
       + 'allowed, so play stopped.',
    from: 'rule: NHL Rule 80',
  },
  'net-dislodged-defensive-skater': {
    say: 'The net came off its moorings, and play stopped.',
    from: 'field: rsn',
  },
  'referee-or-linesman': {
    say: 'The puck struck an official, and play stopped.',
    from: 'field: rsn',
  },
  'tv-timeout': {
    say: 'A scheduled broadcast break. Play was already stopped.',
    from: 'field: rsn',
  },
  'video-review': {
    say: 'The play was reviewed on video before the result was confirmed.',
    from: 'field: rsn',
  },
  'delayed-penalty': {
    say: 'A penalty has been signalled and play continues until the offending team '
       + 'touches the puck — which is why the arm stays up and no whistle comes '
       + 'yet. The other side may pull its goaltender for an extra skater until '
       + 'then.',
    from: 'rule: NHL Rule 15.2',
  },
};

/** Events that stop play, or announce that it is about to. */
const SUBJECT = new Set(['stoppage', 'delayed-penalty']);

/** These end the search for a restart: the next faceoff is not this whistle's. */
const CLOSES_PLAY = new Set(['period-end', 'game-end', 'period-start']);

export const whistle = {
  id: 'whistle',
  label: '＋ Why play stopped',

  /**
   * @param events  the whole game, in order
   * @param ctx     { homeId, awayId, ... } — unused for attribution ON PURPOSE:
   *                a stoppage names no team and we must not supply one.
   */
  reduce(events, ctx) {
    const counted = [], excluded = [], whistles = [], tally = {};

    events.forEach((e, id) => {
      if (!SUBJECT.has(e.type)) {
        excluded.push({
          id,
          why: NOT_A_PLAY[e.type] && e.type !== 'stoppage'
            ? NOT_A_PLAY[e.type]
            : `${e.type} — play on the ice, not a whistle`,
          dims: { type: `not a stoppage (${e.type})` },
        });
        return;
      }

      // A delayed penalty has no `rsn`; the event type IS the reason.
      const rsn = e.type === 'delayed-penalty' ? 'delayed-penalty' : e.rsn;
      const copy = rsn ? WHY[rsn] : null;

      // WHERE. Walk forward to the faceoff that restarts play, stopping dead at a
      // period boundary. Without that stop, a whistle at the horn would be placed
      // on the first faceoff of the NEXT period -- a plausible dot in the wrong
      // period, which is the worst kind of wrong.
      //
      // NO WINDOW. An earlier draft searched "the next five events" because 1,279
      // of 1,279 sampled restarts were within five. That number is a fact about
      // the sample, not a rule, and encoding it would have been a threshold with
      // no source.
      let spot = null, unplaced = null;
      for (let j = id + 1; j < events.length; j++) {
        const t = events[j].type;
        if (CLOSES_PLAY.has(t)) {
          unplaced = 'the period ended before play restarted, so there is no '
                   + 'faceoff to place this on';
          break;
        }
        if (t === 'faceoff') {
          if (events[j].x == null) {
            unplaced = 'the restarting faceoff has no recorded location';
          } else {
            spot = events[j];
          }
          break;
        }
      }
      if (!spot && !unplaced) {
        unplaced = 'no faceoff follows this whistle in the recorded events';
      }

      counted.push(id);
      tally[rsn || 'unrecorded'] = (tally[rsn || 'unrecorded'] || 0) + 1;
      whistles.push({
        id,
        per: e.per,
        clock: e.clock,
        rsn: rsn || null,
        rsn2: e.rsn2 || null,
        // NULL, NOT A GUESS. The draft mapped reason -> copy and did
        // `if (!copy) continue`, which would have silently dropped
        // `tv-timeout`-as-primary and `puck-in-penalty-benches` -- both real, both
        // absent from the reference game. At 1,312 games a season nobody notices.
        say: copy ? copy.say : null,
        from: copy ? copy.from : null,
        known: Boolean(copy),
        placed: Boolean(spot),
        x: spot ? spot.x : null,
        y: spot ? spot.y : null,
        unplaced,
      });
    });

    return { counted, excluded, whistles, tally };
  },
};
