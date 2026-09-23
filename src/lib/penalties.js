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
