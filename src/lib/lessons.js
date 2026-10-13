/**
 * The lessons' moments: for each lesson on the learn page, the rule that finds
 * its moment in a game, and the replay link that opens it.
 *
 * Two readers: `builders/learn-doors.mjs` (the reference game, at build time)
 * and `builders/lessons.mjs` (the nightly pick across the newest games).
 */
import { format } from './deeplink.js';
import { playable } from './layer.js';
import { corsi } from './layers/corsi.js';
import { danger } from './layers/danger.js';
import { goaltending } from './layers/goaltending.js';
import { zonestart } from './layers/zonestart.js';
import { periodLabel } from './period.js';
import { situation, POWER_PLAY } from './strength.js';


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

/**
 * ⭐⭐ THE BIGGEST GROUP OF SKATERS TO CHANGE **WHILE THE PLAY WAS RUNNING**.
 *
 * The shift card's subject is that skaters come off during live play, so the
 * door has to be a change on the fly rather than the tidy one at a whistle that
 * every sport has. "During play" is defined by the EVENTS — a second lying
 * strictly between two consecutive playable frames with no stoppage, faceoff or
 * period marker between them — so there is no time window chosen by us.
 *
 * ⛔ AND IT IS NOT THE GAME'S LONGEST SHIFT, which was the first rule tried and
 * is worse in two ways: in this game the longest ends at the final buzzer, so
 * it is an artifact of the game ending, and a door onto the longest shift would
 * point a reader at the EXCEPTION while the card states the median. A card that
 * says 46 seconds should not open on 150.
 *
 * ⭐ "LARGEST" IS A DEFINITION, NOT A THRESHOLD — the same standard the
 * situations door reached for by taking a LAST.
 */
function biggestChangeDuringPlay(game, events) {
  const PLAY = playable(events);
  const starts = {};
  for (const r of (game.shifts || [])) {
    if ((game.roster?.[r.p] || {}).pos === 'G') continue;
    (starts[r.s] ||= []).push(r.p);
  }
  const idx = new Map(events.map((e, i) => [e, i]));
  const BREAKS = ['stoppage', 'faceoff', 'period-end', 'period-start'];
  const live = new Set();
  for (let k = 0; k < PLAY.length - 1; k++) {
    const a = idx.get(PLAY[k]), b = idx.get(PLAY[k + 1]);
    if (PLAY[k].per !== PLAY[k + 1].per) continue;
    let broke = false;
    for (let j = a + 1; j < b; j++) if (BREAKS.includes(events[j].type)) broke = true;
    if (broke) continue;
    for (let sec = PLAY[k].s + 1; sec < PLAY[k + 1].s; sec++) live.add(sec);
  }
  let best = null;
  for (const [sec, who] of Object.entries(starts)) {
    if (!live.has(+sec)) continue;
    if (!best || who.length > best.n || (who.length === best.n && +sec < best.s))
      best = { s: +sec, n: who.length };
  }
  if (!best) return { index: -1, n: 0 };
  const frame = PLAY.find(e => e.s >= best.s);
  /* ⭐ THE COUNT IS PUBLISHED, not just used. A door that says "the biggest
     group of skaters to change while the play was running" and does not say how
     many is asking to be trusted — and it is what makes the goaltender
     exclusion testable at all: deleting that filter moved no FRAME on this
     game, so the line was decoration until the number was in the artifact. */
  return { index: frame ? events.indexOf(frame) : -1, n: best.n };
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

/**
 * ⭐⭐ THE SECOND GAME, AND WHY THERE HAS TO BE ONE.
 *
 * Kevin, 2026-09-10: *"let's find another game, teaching that there is such a
 * thing as overtime in hockey is needed."* The reference game — MIN at BUF —
 * never leaves regulation, and the build refuses a card without a moment
 * (`no moment in this game for:` below). That refusal is right and predates
 * this: a card that promises something the game does not contain was the
 * original defect the doors were built to fix.
 *
 * ⛔ SO THE GAME MOVES, NOT THE RULE. `data/rich-ot.json` is a second reference
 * game, and the overtime door is resolved against ITS playable timeline with the
 * same `format()` every other door uses — the href carries its own `game=`, so
 * nothing downstream needs to know there are two.
 *
 * ⚠️ AND IT COSTS THE PAGE'S "ALL FROM ONE NIGHT" SENTENCE, which is a real
 * loss and is stated rather than quietly dropped: `build_index.py` now says all
 * but one, and names the other. A sentence that is true of eleven cards out of
 * twelve is exactly the shape §0.00's audit exists to catch.
 */

/** The first third-period event where a team that is behind (the score before
 *  the event) has its goalie pulled. `sit` is away goalie, away skaters, home
 *  skaters, home goalie. */
function firstPullWhileBehind(events, ctx) {
  let hg = 0, ag = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.per === 3 && e.sit && ((e.sit[0] === '0' && ag < hg) || (e.sit[3] === '0' && hg < ag))) return i;
    if (e.type === 'goal') { if (e.own === ctx.homeId) hg++; else if (e.own === ctx.awayId) ag++; }
  }
  return -1;
}

/**
 * Every lesson's moment in one game: `found` is [id, layers, index, rule,
 * strength?] with index -1 where the game does not contain it; `changed` is the
 * size of the biggest line change during play (the shifts card prints it).
 */
export function momentsOf(game) {
  const events = game.events;
  const ctx = { homeId: game.teams.home.id, awayId: game.teams.away.id,
                roster: game.roster, evenOnly: false };

  const icing = firstWhere(events, e => e.rsn === 'icing');
  const bigChange = biggestChangeDuringPlay(game, events);

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
    // "Losing late": a delayed penalty also pulls a goalie, for seconds, at any score.
    ['empty-net', [], firstPullWhileBehind(events, ctx),
     'the first event in the third period whose situation code shows a goalie pulled '
     + 'by a team that is behind'],
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
     'the first draw the Zone starts layer places in a team\'s offensive zone'],
    /* ⭐ THE SCORE CARD OPENS ON THE FIRST ATTEMPT A TRAILING CLUB TAKES, which
       is the earliest frame where the card's subject EXISTS: before the first
       goal no club is behind, so there is nothing on the scoreboard for the
       sentence to be about. That makes "first" a definition here rather than a
       convenience — the same standard the situations door had to reach for by
       taking a LAST.

       ⛔ THE SCORE IS READ BEFORE THE EVENT, never after, for the reason
       `census.js` gives at the same seam: the attempt that IS the goal was
       taken in the state that existed before it went in, and crediting it to
       the lead it created would let a club's own goal decide it was chasing.

       ⛔⛔ AND IT IS AN EVEN-STRENGTH ATTEMPT, WITH THE FILTER ON, because the
       card states an even-strength rate. The first version took any attempt and
       landed on `1541` — a POWER-PLAY attempt — so the card would have said
       "per 60 minutes of even-strength play" directly above a door opening the
       one situation it excludes. The door asks the layer with `evenOnly` set, so
       the moment and the sentence are selected by the same rule rather than by
       two that happen to agree. */
    /* ⛔ NO LAYER. Nothing here is toggled, and there is nothing to draw: the
       site shows no skaters, which is precisely why the card has to SAY this
       rather than show it. The empty-net card's precedent. */
    ['shifts', [], bigChange.index,
     'the frame after the biggest group of skaters to change while the play was running'],
    ['score', ['corsi'], firstWhileTrailing(corsi, events, { ...ctx, evenOnly: true }),
     'the first attempt the Control layer counts at even strength for a team that is behind',
     'even'],
    /* OVERTIME: the goal that ends it. `periodLabel()` renders "Overtime · 3-on-3"
       for it from recorded fields, so the frame says what the rule is. */
    ['overtime', [], events.findIndex(e => e.pt === 'OT' && e.type === 'goal'),
     'the goal that ended this game in overtime'],
  ];
  return { found, changed: bigChange.n };
}

/**
 * The replay door for one moment: the frame a viewer can stand on, or null when
 * the moment is absent or has no playable frame after it.
 */
export function doorAt(game, [id, layers, index, rule, strength = 'all']) {
  if (index < 0) return null;
  const events = game.events;
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
  /* ⭐ A DOOR MAY CARRY ITS OWN STRENGTH, and exactly one does. Every other card
     is measured over all situations and opens that way; the score-effects card
     states an EVEN-STRENGTH rate, so a door that opened the replay unfiltered
     would put the card's sentence beside a count the sentence is not about.
     Defaulting rather than requiring it keeps the eleven that do not care
     silent. */
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
    if (k < 0) return null;
    const e = PLAY[k];
    /* ⭐ THE LABEL COMES FROM THE PAGE'S OWN FUNCTION. A card's footer names the
       moment its door opens, and the first overtime footer said "Period 4" while
       the page said "Overtime · 3-on-3" — two artifacts describing one frame in
       different words. `periodLabel` moved into `src/lib/period.js` so both read
       it, rather than build_index learning a second naming rule. */
    return { href: format({ game: game.game.id, events: PLAY, index: k, layers, strength }),
                per: e.per, rem: e.rem, type: e.type, layers, rule, strength,
                label: periodLabel(e),
                ...(via ? { via } : {}) };
}

/** The lessons in the order of the learn page; the nightly pick goes in it. */
export const LESSON_ORDER = ['icing', 'faceoffs', 'offside', 'penalties', 'overtime',
  'empty-net', 'control', 'blocked', 'slot', 'goaltending', 'situations', 'zones',
  'shifts', 'score'];

/**
 * THE NIGHTLY PICK. Each lesson, in `LESSON_ORDER`, takes the newest game in
 * which its moment happens and which no earlier lesson took.
 *
 * @param gameAt  i => the i-th newest game's extract (or null to skip it), for
 *                i = 0..count-1; called lazily, at most once per game
 * @returns {id: {game, date, away, home, ...door}}; a lesson no game holds is absent
 */
export function pickLessons(gameAt, count, order = LESSON_ORDER) {
  const cache = new Map(), taken = new Set(), out = {};
  const at = i => {
    if (!cache.has(i)) {
      const g = gameAt(i);
      cache.set(i, g ? { g, m: momentsOf(g) } : null);
    }
    return cache.get(i);
  };
  for (const id of order) {
    for (let i = 0; i < count; i++) {
      if (taken.has(i)) continue;
      const hit = at(i);
      if (!hit) continue;
      const entry = hit.m.found.find(f => f[0] === id);
      const door = entry && doorAt(hit.g, entry);
      if (!door) continue;
      taken.add(i);
      const g = hit.g;
      out[id] = { game: g.game.id, date: g.game.date || null,
                  away: g.teams.away.ab, home: g.teams.home.ab, ...door,
                  ...(id === 'shifts' ? { changed: hit.m.changed } : {}) };
      break;
    }
  }
  return out;
}
