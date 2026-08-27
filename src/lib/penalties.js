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

  // ⚠️ THE DURATION IS IN THE KEY AND IS NOT REPEATED IN THE WORDS. The clock
  // beside the name already says 4:00, and "High-sticking (double minor) 4:00"
  // says the same thing twice -- the defect the slot caption hit when a rename
  // left both halves naming the slot.
  'high-sticking-double-minor': 'High-sticking',
  'butt-ending-double-minor': 'Butt-ending',

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
