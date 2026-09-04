/**
 * WHICH ONE THING A FRAME ANNOUNCES — the precedence ladder, as a rule you can
 * call.
 *
 * ⭐⭐ IT IS ANALYSIS, NOT PRESENTATION, AND CHENG DREW THE LINE: *"what is most
 * true of this frame is a decision over recorded facts. Does it need to know how
 * anything LOOKS? A precedence rule needs to know that a goal outranks a slot
 * shot. That is a fact about hockey and about our own layer taxonomy — it would
 * be identical if the caption were rendered as audio."* So this decides, and
 * `app.js` composes: which sentence, in which treatment, on which surface, is
 * the caller's business and none of it is here.
 *
 * ⭐⭐ AND THE RULE WAS BEING STATED TWICE, WHICH IS WHY THIS MOVED. `render` held
 * the ordered chain and `captioned()` held the same six conditions as a
 * disjunction — one asked WHICH claim wins, the other asked WHETHER any did, and
 * both had to be edited together for the page to stay coherent. `captioned` is
 * the predicate `dwell()` shares with the renderer, and that shared-ness is the
 * mechanism that makes *a caption with no pause behind it* impossible
 * (docs/event-timing.md); a seventh condition added to the chain and forgotten in
 * the disjunction would have brought that defect straight back. CHENG named the
 * hazard while the two were still separate: *"what would be dangerous is a third
 * reader with a slightly different predicate."* There is now one rule and
 * `captioned` is `announcement(…) !== null`.
 *
 * ⚠️ ONE FRAME, ONE SENTENCE — that is the constraint the order exists to serve.
 * The caption pill is a single line and a frame lasts `dwell(e)` milliseconds, so
 * two facts cannot both be said. The ladder is which fact gets the moment.
 */

/** Every answer this can give, in rank order. `null` is a frame that says nothing. */
export const ANNOUNCEMENTS = ['goal', 'penalty', 'icing', 'offside', 'kill', 'slot'];

/**
 * The single claim `e` announces, or null.
 *
 *   isIcing    is this the restart an icing forced?
 *   isOffside  is this the restart an offside forced?
 *   isKill     did a penalty run out here? (`powerPlayOver`, keyed on `sayAt`)
 *   isSlot     was this attempt taken from the slot?
 *   slotOn     is the slot being drawn on the ice at all?
 *
 * ⭐ THE PREDICATES ARE HANDED IN, WHICH IS THE POINT. Three of them are Map
 * lookups over reductions of the whole game and the fourth is a geometric test;
 * taking them as arguments is what lets this rule be asked of any frame, of any
 * game, with the conditions set deliberately rather than whatever the page
 * happened to be booted into.
 *
 * ⚠️ `slotOn` IS A CONTROL, AND IT BELONGS IN THE RULE RATHER THAN AROUND IT.
 * A rule is not a metric — an icing applies whether or not anyone opted into
 * measuring it, so it always speaks. A slot shot is the opposite: the slot is a
 * region WE chose to paint, and with the layer off the page has never mentioned
 * it, so a pill naming it would be answering a question the viewer has not been
 * shown. `dwell` reads the same flag for the same reason: a slot shot with the
 * layer off is a frame that says nothing and must be PACED as one.
 */
export function announcement(e, { isIcing, isOffside, isKill, isSlot, slotOn }) {
  if (!e) return null;

  /* 1 — A GOAL. The largest thing that can happen, and the only event that
     changes the number the whole page is organised around. */
  if (e.type === 'goal') return 'goal';

  /* 2 — A PENALTY, which is the only event here that changes the CONDITIONS of
     the game rather than the count. It is why `Even strength only` exists as a
     control at all, and until 2026-08-31 the ice marked it exactly as loudly as
     a giveaway. It outranks a kill on the same frame for a reason that is not
     merely rank: a second infraction is what makes a sheet four-on-four rather
     than a power play expiring, so "penalty killed" on a frame that carries a
     penalty would be the wrong description as well as the smaller one. */
  if (e.type === 'penalty') return 'penalty';

  /* 3, 4 — AN ICING OR AN OFFSIDE RESTART. ⭐⭐ A WHISTLE OUTRANKS A CLOCK, AND
     THIS REVERSED A DECISION MADE ON 2026-08-31. Icing used to sit UNDER the
     kill, argued on rarity: a kill is rarer — 3.3 a game against 7.8 — and a
     power play ending is the bigger change of state. Both halves of that are
     still true and it was still the wrong order.

     THE PILL ALREADY CARRIES THE CONDITION. A power play ending turns the
     scoreboard badge dark, on screen, at that frame — so the kill caption
     AMPLIFIES a signal the page already gives. An icing or an offside has no
     other surface at all: the stoppage is not even a frame (`SKIP` drops it), so
     the restart is the only place the rule can ever be named. Given one pill and
     two facts, it goes to the fact with nowhere else to go.

     AND THE WRONG ORDER IS ACTIVELY MISLEADING, not merely a missed fact.
     "🛡 Penalty killed" on a face-off offers the reader an explanation for a
     whistle it did not cause — and no penalty expiry produces a face-off. Naming
     the offside is silent about the kill; naming the kill invites a false
     inference.

     ⚠️ THE COST, AS A COUNT AND NOT A RATE: in the reference game 1 of 4 kill
     captions lands on a rule restart and is displaced. **One game is not a rate,
     and it is quoted as what it is.** The collision is COINCIDENCE rather than
     structure — measured, because the opposite was assumed first: only 1 of those
     4 kills lands on a face-off at all, since a penalty usually expires during
     live play and the next recorded event is a hit or a shot. ⏭ Now that this is
     a function, that count is answerable over the whole archive instead of over
     one game; it has not been run, because the extracts are not in this repo.

     ⚠️ AND THE OLD ORDER WAS NEVER EXERCISED. 0 of 8 icing restarts in the
     reference game collide with a kill, so the branch that demoted icing had
     never once run. It read as a decision and was an untested preference. */
  if (isIcing(e)) return 'icing';
  if (isOffside(e)) return 'offside';

  /* 5 — A PENALTY KILLED. 78.6% of power plays end because the penalty ran out,
     with NO EVENT IN THE FEED: the scoreboard pill going dark was the entire
     announcement. It sits below the rule restarts for the reason above, and
     above the slot shot because a kill happens ~3.4 times a game while a slot
     shot happens many times — and because the slot layer has the ice to say it
     with and this has nothing at all. */
  if (isKill(e)) return 'kill';

  /* 6 — A SHOT FROM THE SLOT, last because it is the most frequent and the only
     one whose region is already painted where the viewer is looking. */
  if (slotOn && isSlot(e)) return 'slot';

  return null;
}
