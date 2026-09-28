/**
 * What a player went off for — the league's own word for it, in ours.
 *
 * WHY A TABLE AND NOT `replace(/-/g,' ')`. `docs/whistle-layer.md` and the
 * comment above `WHY` in layers/whistle.js already paid for this lesson: that
 * one line shipped for weeks and rendered "Goalie Stopped After Sog" and "Tv
 * Timeout" into every heading. A feed key is a machine identifier and the words
 * inside it are not a sentence -- `delaying-game-puck-over-glass` de-hyphenates
 * to "delaying game puck over glass", which is not what anybody in a rink says.
 *
 * ⭐ KNOWN KEYS ONLY, AND AN UNKNOWN ONE RENDERS RAW. Same rule as `WHY`, for
 * the same reason: the league can add a descriptor tomorrow, and inventing a
 * label for one we have never seen is the guess this project refuses. Raw is
 * visible and fixable; a guessed label is invisible and wrong. The fallback is
 * the honest branch, not the default one.
 *
 * ⚠️ THE SET IS STRICTLY WHAT HAS BEEN OBSERVED -- 29 descriptors: 28 counted
 * across 40 published games, plus `kneeing`, which is in `data/rich.json` and in
 * NONE of the forty. That one is the argument for the archive-wide sweep in a
 * sentence: a forty-game sample did not contain a word the reference fixture
 * did. Adding a plausible `spearing` here would HIDE it from the vocabulary
 * alarm in `extract.py` -- the same trap the `missed-shot reason` comment names
 * one file over. The rest arrive from the drift report, never from memory.
 *
 * `from` is provenance, in the same shape the whistle layer uses: every entry
 * here is the feed's own `descKey` re-worded, never a rule we looked up.
 */
export const PEN = {
  // Straight already: the key IS the word a rink uses. Capitalised, nothing else.
  roughing: 'Roughing',
  tripping: 'Tripping',
  'cross-checking': 'Cross-checking',
  'high-sticking': 'High-sticking',
  interference: 'Interference',
  slashing: 'Slashing',
  hooking: 'Hooking',
  holding: 'Holding',
  elbowing: 'Elbowing',
  boarding: 'Boarding',
  kneeing: 'Kneeing',
  embellishment: 'Embellishment',
  misconduct: 'Misconduct',
  'game-misconduct': 'Game misconduct',
  'holding-the-stick': 'Holding the stick',
  'unsportsmanlike-conduct': 'Unsportsmanlike conduct',
  /* ⭐ ARRIVED FROM THE DRIFT REPORT, 2026-09-19/20 — the first preseason games
     of the new season halted the nightly ingest with four descriptors the
     archive had never held. That is `guard-where-the-archive-is` working: the
     league invents vocabulary and only an archive-wide sweep sees it. `fighting`
     is what preseason produces, and none of the four had appeared in 4,553
     games. ⭐ `instigator` stays BARE. This table's rule is the feed's own
     descKey RE-WORDED and never a rule we looked up, so explaining that it is
     the player who started the fight would be us writing rulebook copy here. */
  fighting: 'Fighting',
  instigator: 'Instigator',
  'throwing-equipment': 'Throwing equipment',
  /* ⭐ AND TWO MORE THE NEXT NIGHT, 2026-09-21 — which is the shape of this
     rather than a one-off. Preseason keeps producing infractions the regular
     season rarely does, so the archive keeps meeting its first one. Neither
     appears in the 4,567 games walked before them.
     `instigator-misconduct` renders as `Instigator` for the same reason
     `roughing-double-minor` renders as `Roughing`: the suffix names the
     PUNISHMENT, not the infraction, and the punishment is already on screen —
     the replay tags a double minor where it happens and the box shows a man
     sitting. Writing it into the name would say it twice in one line. */
  'illegal-equipment': 'Illegal equipment',
  'instigator-misconduct': 'Instigator',

  // These are the ones the table exists for. Each is a phrase a broadcast uses
  // and a de-hyphenation does not produce.
  'interference-goalkeeper': 'Goaltender interference',
  'delaying-game': 'Delay of game',
  'delaying-game-puck-over-glass': 'Delay of game — puck over the glass',
  'delaying-game-face-off-violation': 'Delay of game — faceoff violation',
  'delaying-game-illegal-play-by-goalie': 'Delay of game — illegal play by the goaltender',
  'delaying-game-unsuccessful-challenge': 'Delay of game — unsuccessful challenge',
  'closing-hand-on-puck': 'Closing his hand on the puck',
  'too-many-men-on-the-ice': 'Too many men on the ice',
  'goalie-removed-own-mask': 'Goaltender removed his own mask',
  'unsportsmanlike-conduct-bench': 'Unsportsmanlike conduct — bench',

  /* 2026-09-23, the third preseason night to halt the nightly, over 4,585 games.
     Both take the league's own key as their words rather than an interpretation
     of the rulebook: `delaying-game-equipment` could be read as adjusting
     equipment or as leaving it on the ice, and this table's job is to render a
     phrase a broadcast uses, not to adjudicate which rule was called. The
     `— bench` suffix already has a precedent one line up. */
  'delaying-game-equipment': 'Delay of game — equipment',
  'interference-bench': 'Interference — bench',

  /* 2026-09-25, the FOURTH preseason night to halt the nightly, over 4,600
     games — and `charging` is the one worth stopping on. It is a common
     infraction, called in most weeks of a season, and it appears in none of the
     three full seasons this archive holds. That is not a rare event; either the
     regular-season feed spells it differently or the league changed its
     descriptors this preseason. Recorded here so the next person asking has the
     question in front of them. See docs/status.md §0.00.

     ⭐ THE SUFFIX RULE, THIRD APPLICATION. `roughing-double-minor` renders as
     `Roughing` because the suffix names the PUNISHMENT, which is already on
     screen. `removing-opponents-helmet` names what he DID, so it stays — the
     same distinction `interference-bench` makes one line up. */
  charging: 'Charging',
  'head-butting': 'Head-butting',
  /* ⭐ `aggressor` ARRIVED ON THE FIRST RUN AFTER THE HALT WAS REMOVED, and it
     is the pair to `instigator` two blocks up: the instigator starts the fight
     and the aggressor is the one still throwing when it is over. Preseason
     again. ⭐⭐ IT IS ALSO THE PROOF THE FIX WORKS — the archive published to
     `dataThrough 2026-09-24` on the same run that reported this, where every
     night before it the word cost the whole sync. */
  aggressor: 'Aggressor',
  'roughing-removing-opponents-helmet':
    'Roughing \u2014 removing an opponent\u2019s helmet',

  // ⚠️ THE DURATION IS IN THE KEY AND IS NOT REPEATED IN THE WORDS. The clock
  // beside the name already says 4:00, and "High-sticking (double minor) 4:00"
  // says the same thing twice -- the defect the slot caption hit when a rename
  // left both halves naming the slot.
  'high-sticking-double-minor': 'High-sticking',
  'butt-ending-double-minor': 'Butt-ending',
  'roughing-double-minor': 'Roughing',

  // Not box time at all -- a penalty shot is taken on the ice. It is in the
  // table because it is in the feed, and `box.js` is what keeps it out of a seat.
  'ps-slash-on-breakaway': 'Slash on a breakaway — penalty shot',

  /* ⭐⭐⭐ TWENTY-NINE AT ONCE, 2026-09-28, AND THAT NUMBER IS THE FINDING.
     This table grew by one, two, two, two and one across five preseason nights,
     each arriving because a descriptor had halted the nightly ingest. The halt
     was removed on 2026-09-25 so that derive publishes in full and the RUN goes
     red afterwards. The first archive-wide sweep under the new contract reported
     twenty-nine unseen descriptors in one list.

     ⭐⭐ THEY WERE ALL THERE THE WHOLE TIME. The pipeline stopped at the FIRST
     unknown word every time, so every previous report was a report of one. Four
     nights were spent fixing one word each and concluding the vocabulary had
     drifted by one word. It had drifted by twenty-nine, and the halt is what
     made the size unknowable. `memory/ingest-delivery-target.md` asks, on a
     second occurrence, *what did I fix, and what did I pay* — the answer is that
     the fix was correct four times and the cost was never counting.

     ⛔ AND ONE ENTRY WAS WRITTEN HERE AND TAKEN BACK OUT, a minute apart:
     `head-butting-double-minor`. It is plausible — `head-butting` is in the
     table and three other infractions carry a `-double-minor` key — and the
     sweep did not report it. Plausible is the disqualifier. A key added because
     the pattern suggests it is a key the alarm can never tell us about, and this
     paragraph exists because the rule was quoted and then broken in the same
     edit.

     ⭐ AND `spearing` IS IN HERE, which the header above names as the example of
     what must NOT be added on a hunch: *"Adding a plausible `spearing` here
     would HIDE it from the vocabulary alarm."* That was right. It is added now
     for the only reason this table accepts — the archive-wide sweep reported it,
     so it is OBSERVED and no longer plausible.

     ⚠️ MEASURED BEFORE IT WAS FIXED, so the size of the defect is on the record
     rather than assumed: 175 games sampled across the published archive carry
     1,274 penalties, of which 8 had no words — 0.6% of penalties, landing in 8
     of the 175 games, or 4.6%. About one game in twenty-two showed a viewer a
     machine identifier. `illegal-check-to-head` is half of them.

     THE THREE RULES THE HEADER SETS ARE WHAT DECIDED EVERY LINE BELOW: the
     feed's own descKey re-worded and never a rulebook lookup; a suffix naming
     the PUNISHMENT dropped because it is already on screen, a suffix naming what
     he DID kept; and the duration never written into the words. */
  'abuse-of-officials': 'Abuse of officials',
  'abusive-language': 'Abusive language',
  'broken-stick': 'Playing with a broken stick',
  'checking-from-behind': 'Checking from behind',
  clipping: 'Clipping',
  'illegal-check-to-head': 'Illegal check to the head',
  'illegal-stick': 'Illegal stick',
  'ineligible-player': 'Ineligible player',
  'playing-without-a-helmet': 'Playing without a helmet',
  spearing: 'Spearing',
  'tripping-obstruction': 'Tripping — obstruction',

  /* THE GOALTENDER'S OWN, worded like `goalie-removed-own-mask` above rather
     than each inventing a voice. ⚠️ `participation` IS KEPT AS THE FEED'S WORD.
     "played the puck beyond centre" would be an interpretation of which act was
     called, and this table does not adjudicate that — the same refusal
     `delaying-game-equipment` is recorded for. */
  'goalie-leave-crease': 'Goaltender left his crease',
  'goalie-participation-beyond-center': 'Goaltender participating beyond centre',

  /* THE BENCH SUFFIX, fourth and fifth applications of the pattern
     `unsportsmanlike-conduct-bench` set. */
  'delaying-game-bench': 'Delay of game — bench',
  'delaying-game-bench-face-off-violation': 'Delay of game — bench faceoff violation',
  'delaying-game-smothering-puck': 'Delay of game — smothering the puck',
  'game-misconduct-head-coach': 'Game misconduct — head coach',
  bench: 'Bench penalty',

  /* ⛔ THE SUFFIX RULE AGAIN, AND IT COLLAPSES THREE KEYS ONTO TWO NAMES.
     `20-minute-game-misconduct` and `spearing-double-minor` name the punishment
     in the key; the clock beside the name already carries it. `instigator` and
     `instigator-misconduct` have rendered as one word since September for
     exactly this reason, so two keys sharing a name is the established shape
     rather than a collision. */
  '20-minute-game-misconduct': 'Game misconduct',
  'spearing-double-minor': 'Spearing',
  'match-penalty': 'Match penalty',

  /* THE PENALTY SHOTS. `ps-slash-on-breakaway` is directly above and set the
     form: the infraction first, the outcome after the dash, because the
     infraction is what happened on the ice and the shot is what follows.
     ⚠️ `penalty-shot-minor` RENDERS AS `Penalty shot` — the suffix is the
     punishment, and a reader watching a shot being set up does not need the
     paperwork. */
  'penalty-shot': 'Penalty shot',
  'penalty-shot-minor': 'Penalty shot',
  'ps-covering-puck-in-crease': 'Covering the puck in the crease — penalty shot',
  'ps-holding-on-breakaway': 'Holding on a breakaway — penalty shot',
  'ps-hooking-on-breakaway': 'Hooking on a breakaway — penalty shot',
  'ps-tripping-on-breakaway': 'Tripping on a breakaway — penalty shot',
  'ps-net-displaced': 'Displacing the net — penalty shot',
  'ps-throwing-object-at-puck': 'Throwing an object at the puck — penalty shot',
};

/**
 * The words for a descriptor, or the descriptor itself.
 *
 * Never throws and never guesses: an unseen key comes back as it arrived, which
 * is how it becomes visible enough to add.
 */
export function penName(key) {
  return (key && PEN[key]) || key || '';
}
