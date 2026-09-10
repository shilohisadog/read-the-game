/**
 * The learn page's doors: nine moments in one game, each one a real link.
 *
 * THIS FILE IS A DRIVER AND NOTHING ELSE, for the same reason `measure.mjs` is.
 * The URL grammar — the clock is REMAINING, the ordinal appears only when a
 * moment is ambiguous, the layer vocabulary IS the layer ids — lives in
 * `src/lib/deeplink.js`. Restating any of it in `build_index.py` would be a
 * second implementation of a shared rule in a second language, which is the
 * defect measure.mjs exists to prevent. So Python renders the cards and node
 * decides the moments, and the two meet over one committed document.
 *
 * WHY THE MOMENTS ARE ASKED FOR RATHER THAN CHOSEN. The first version of this
 * took "the first event of the right type". It put THREE cards on one event and
 * sent the slot card to a point shot at x=29 that the slot layer does not count.
 * Only half of that was visible: a wrong slot example can be caught by looking,
 * and three cards sharing a moment has no symptom at all — if the three had
 * happened to be legitimate, the template smell would have shipped unnoticed.
 *
 * So a MEASUREMENT card's moment is the first index in that layer's own
 * `counted`, and a RULE card's moment is the first event carrying that reason in
 * the feed. Neither is a judgement, and neither can drift away from the layer it
 * illustrates.
 *
 *   node builders/learn-doors.mjs            ->  data/learn-doors.json
 *   node builders/learn-doors.mjs --verify   ->  exit 1 if the file is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from '../src/lib/deeplink.js';
import { NOT_A_PLAY, playable } from '../src/lib/layer.js';
import { corsi } from '../src/lib/layers/corsi.js';
import { danger } from '../src/lib/layers/danger.js';
import { goaltending } from '../src/lib/layers/goaltending.js';
import { zonestart } from '../src/lib/layers/zonestart.js';
import { situation, POWER_PLAY } from '../src/lib/strength.js';
import { stable } from './measure.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The first event this layer's own reducer counted. */
/**
 * The last attempt `layer` counts inside the game's FIRST power play — the frame
 * where that power play's effect on the count is already visible.
 *
 * ⚠️ THE RUN ENDS WHEN THE ADVANTAGE DOES, not merely when a single event is not
 * a power play. Reading `kind !== POWER_PLAY` alone would end the run at any
 * event the situation code cannot classify and start a "second" power play out
 * of the remainder of the first. The advantage holding is what makes it one.
 */
function lastOfFirstPowerPlay(layer, events, ctx) {
  const adv = i => { const s = situation(events[i].sit, ctx);
                     return s && s.kind === POWER_PLAY ? s.advantage : null; };
  let start = -1;
  for (let i = 0; i < events.length; i++) if (adv(i) != null) { start = i; break; }
  if (start < 0) return -1;
  const club = adv(start);
  let end = start;
  while (end + 1 < events.length && adv(end + 1) === club) end++;
  const counted = new Set(layer.reduce(events, ctx).counted);
  for (let i = end; i >= start; i--) if (counted.has(i) && events[i].own === club) return i;
  return -1;
}

/** The first draw `zonestart` places in the winner's OFFENSIVE zone. */
function firstZoneStart(events, ctx) {
  const { counted, zones } = zonestart.reduce(events, ctx);
  for (const i of counted) if (zones[i] === 'O') return i;
  return -1;
}

/** The first attempt `layer` counts whose club is BEHIND when it is taken. */
function firstWhileTrailing(layer, events, ctx) {
  const counted = new Set(layer.reduce(events, ctx).counted);
  let hg = 0, ag = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (counted.has(i) && e.own != null) {
      const mine = e.own === ctx.homeId ? hg : ag;
      const theirs = e.own === ctx.homeId ? ag : hg;
      if (mine < theirs) return i;
    }
    if (e.type === 'goal') { if (e.own === ctx.homeId) hg++; else if (e.own === ctx.awayId) ag++; }
  }
  return -1;
}

function firstCounted(layer, events, ctx, keep) {
  const { counted } = layer.reduce(events, ctx);
  for (const i of counted) if (!keep || keep(events[i])) return i;
  return -1;
}

/** The first event the FEED marks this way. Read, never decided. */
function firstWhere(events, fn, from = -1) {
  for (let i = from + 1; i < events.length; i++) if (fn(events[i], i)) return i;
  return -1;
}

export function doors(game) {
  const events = game.events;
  const ctx = { homeId: game.teams.home.id, awayId: game.teams.away.id,
                roster: game.roster, evenOnly: false };

  const icing = firstWhere(events, e => e.rsn === 'icing');

  // Each entry states the RULE that found it, and the rule is what a test
  // drives — a literal index here would be a constant standing in for a
  // relationship, which is the shape this project keeps paying for.
  const found = [
    ['icing', ['whistle'], icing,
     "the first event the feed marks rsn='icing'"],
    // THE RESTART, not another icing. This is the only door defined relative to
    // another door, and it is the pair that teaches the rule: same clock,
    // different ordinal, and a dot deep in the offending team's own end.
    ['faceoffs', ['whistle'], firstWhere(events, e => e.type === 'faceoff', icing),
     'the first faceoff after that icing — the restart it forces'],
    ['offside', ['whistle'], firstWhere(events, e => e.rsn === 'offside'),
     "the first event the feed marks rsn='offside'"],
    ['penalties', ['whistle'], firstWhere(events, e => e.type === 'delayed-penalty'),
     "the first event of type 'delayed-penalty'"],
    // NO LAYER, DELIBERATELY. An empty net is not a stoppage, so the whistle
    // layer has nothing to say about it, and `goaltending` counts shots a goalie
    // faced — at a pulled-goalie moment its subject is not on the ice. The base
    // view already tells the whole story: build_main gates the glyph on `sit`,
    // so the goalie is simply not drawn. Five skaters, no goalie, nothing
    // toggled. (CHENG.)
    ['empty-net', [], firstWhere(events, e => e.sit && (e.sit[0] === '0' || e.sit[3] === '0')),
     'the first event whose situation code shows a goalie pulled'],
    ['control', ['corsi'], firstCounted(corsi, events, ctx),
     'the first event the Control layer counts'],
    ['slot', ['slot'], firstCounted(danger, events, ctx),
     'the first event the slot layer counts'],
    ['goaltending', ['goaltending'], firstCounted(goaltending, events, ctx),
     'the first event the goaltending layer counts'],
    // The same layer as Control and a different moment, because the lesson is
    // that this one COUNTS: a blocked shot never reaches the goalie and is an
    // attempt anyway.
    ['blocked', ['corsi'], firstCounted(corsi, events, ctx, e => e.type === 'blocked-shot'),
     'the first blocked shot the Control layer counts'],
    /* ⭐ THE SITUATIONS CARD OPENS AT THE END OF THE FIRST POWER PLAY, not at
       its start, and the difference is the lesson. The card says a power play is
       a different game; the frame that shows that is the one where the count has
       already moved, not the one where it is about to.

       ⛔ AND IT MUST NOT BE THE FRAME THE CONTROL CARD OPENS. The first version
       took the first power-play attempt and landed on `1-18:40.1` — byte for
       byte the Control door — because in THIS game the opening attempt happens
       to be a 5-on-4. Two cards, one screen, and a reader clicking the second
       one would think the site was broken. ⚠️ That collision was a property of
       the reference game and not of the design, so it could appear or vanish
       with the fixture: the fix is a rule that cannot land there, not a check
       that this game does not.

       LAST IS A DEFINITION, NOT A THRESHOLD. "Deep into a power play" would need
       a number chosen by us, which is the thing `docs/below-the-rink-2.md` §31
       refuses; the final attempt of the first power play is decided by the feed. */
    ['situations', ['corsi'], lastOfFirstPowerPlay(corsi, events, ctx),
     'the last attempt the Control layer counts inside this game\'s first power play'],
    /* ⭐ THE ZONE CARD OPENS ON A DRAW, WITH THE LAYER THAT PLACES IT — and the
       frame already carries the lesson, which is why this one is a FIRST where
       the situations door had to be a LAST. Zone starts rings the dot as the
       draw happens, so at this frame the count has moved; Control's box would
       not have.

       ⛔ AND IT IS AN OFFENSIVE-ZONE DRAW RATHER THAN ANY END-ZONE DRAW, to
       keep it off a frame two other cards already own. The icing restart is an
       end-zone draw by construction — deep in the offending team's end is what
       Rule 81 means — and it is the frame BOTH the icing and faceoffs cards
       open on, a pairing Kevin ruled stays. A third card there would be three
       lessons on one screen. `zones[i] === 'O'` is the layer's own vocabulary,
       decided by the winner's attacking direction and the sign of x, so this is
       read from the feed rather than chosen.

       ⚠️ THIS RULE DOES NOT MAKE THE COLLISION IMPOSSIBLE, only unlikely, and
       that is worth saying out loud: another game could open with an offensive-
       zone draw that is also some other card's moment. The shared-frame guard
       in `test/learn.test.js` is what actually holds, and it holds for every
       pair rather than for the one I thought of. */
    ['zones', ['zonestart'], firstZoneStart(events, ctx),
     'the first draw the Zone starts layer places in a club\'s offensive zone'],
    /* ⭐ THE SCORE CARD OPENS ON THE FIRST ATTEMPT A TRAILING CLUB TAKES, which
       is the earliest frame where the card's subject EXISTS: before the first
       goal no club is behind, so there is nothing on the scoreboard for the
       sentence to be about. That makes "first" a definition here rather than a
       convenience — the same standard the situations door had to reach for by
       taking a LAST.

       ⛔ THE SCORE IS READ BEFORE THE EVENT, never after, for the reason
       `census.js` gives at the same seam: the attempt that IS the goal was
       taken in the state that existed before it went in, and crediting it to
       the lead it created would let a club's own goal decide it was chasing. */
    ['score', ['corsi'], firstWhileTrailing(corsi, events, ctx),
     'the first attempt the Control layer counts for a club that is behind'],
  ];

  const missing = found.filter(([, , i]) => i < 0).map(([id]) => id);
  if (missing.length) {
    throw new Error(`no moment in this game for: ${missing.join(', ')} — a card `
                  + 'cannot promise something the game does not contain');
  }

  /* ⭐⭐ A DOOR NAMES A FRAME A VIEWER CAN STAND ON, and until now it did not.
   *
   * `format` counts an event's occurrence within the list it is HANDED, and this
   * handed it every event; the app resolves that ordinal against the PLAYABLE
   * timeline, which drops stoppages, delayed penalties and the period markers.
   * The two lists disagree, so the ordinals meant different things:
   *
   *   faceoffs asked for occurrence 2 at P1 15:02 where the replay has ONE frame
   *     — the app clamped, and the icing card and the faceoffs card opened the
   *     IDENTICAL frame. That is the "cards sharing a moment has no symptom at
   *     all" defect this file's own header was written to prevent, arriving
   *     through the ordinal instead of through the choice.
   *   icing, offside and penalties each name an event that is NOT PLAYABLE, so
   *     they landed on whatever the arithmetic happened to reach. Twice that was
   *     the right frame by luck; once (penalties) the clock has NO playable frame
   *     at all and the app fell forward to the next one.
   *
   * ⭐ SO THE MAPPING IS STATED INSTEAD OF INFERRED. A rule that fires on an
   * unplayable event resolves FORWARD to the first frame that follows it, which
   * for a stoppage is the restart it forces — the only frame a viewer could ever
   * be standing on when that rule is what they came to see. `via` records that a
   * hop happened, so the artifact says what it did rather than hiding it.
   *
   * AND `type` IS THE FRAME'S, NOT THE RULE'S. It used to record the type of the
   * event the rule matched — `stoppage`, `delayed-penalty` — for a door that
   * opens something else entirely, which made the committed document assert
   * something untrue about where it goes. */
  const PLAY = playable(events);
  const out = {};
  for (const [id, layers, index, rule] of found) {
    const found_e = events[index];
    let k = PLAY.indexOf(found_e);
    let via = null;
    if (k < 0) {
      // Forward to the first playable frame after the rule's own event.
      for (let j = index + 1; j < events.length; j++) {
        const p = PLAY.indexOf(events[j]);
        if (p >= 0) { k = p; via = found_e.type; break; }
      }
    }
    if (k < 0) {
      throw new Error(`the ${id} door found a ${found_e.type} with no playable frame `
                    + 'after it — nothing a viewer can be shown');
    }
    const e = PLAY[k];
    out[id] = { href: format({ game: game.game.id, events: PLAY, index: k, layers }),
                per: e.per, rem: e.rem, type: e.type, layers, rule,
                ...(via ? { via } : {}) };
  }
  // THE ONE FIGURE ON THE PAGE, AND IT IS THIS GAME'S. The archive number —
  // 51.9% of attempts never reach the goalie — is written weekly into
  // measures.json, and a copy of it pasted here would be a constant that rots.
  // LIMITS already shipped a stale claim inside the block whose whole job is
  // stating limits. This one is recomputed from the same file the doors come
  // from, so it cannot drift, and it carries its denominator.
  const mix = { 'shot-on-goal': 0, 'goal': 0, 'missed-shot': 0, 'blocked-shot': 0 };
  const { counted } = corsi.reduce(events, ctx);
  for (const i of counted) if (events[i].type in mix) mix[events[i].type]++;
  const n = counted.length;

  return {
    game: { id: game.game.id, date: game.game.date,
            away: game.teams.away.ab, home: game.teams.home.ab },
    doors: out,
    figures: {
      // "Reached the goalie" is shots on goal plus goals; the other two never
      // did. Same partition `attemptMix` publishes over the archive.
      unreached: { count: mix['missed-shot'] + mix['blocked-shot'], n,
                   what: 'shot attempts in this game that never reached the goalie' },
    },
  };
}

function main(argv) {
  const src = join(ROOT, 'data', 'rich.json');
  const out = join(ROOT, 'data', 'learn-doors.json');
  const body = stable(doors(JSON.parse(readFileSync(src, 'utf8')))) + '\n';

  if (argv.includes('--verify')) {
    const have = readFileSync(out, 'utf8');
    if (have === body) { console.log(`  learn-doors.json BYTE-IDENTICAL`); return 0; }
    console.error('  learn-doors.json DIFFERS from a fresh build -- gate FAILED');
    return 1;
  }
  writeFileSync(out, body);
  console.log(`wrote ${out} ${body.length} bytes`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv));
