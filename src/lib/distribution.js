/**
 * DISTRIBUTIONS — the shape of a count, and where one night sits in it.
 *
 * SPLIT OUT OF archive.js SO THE GAME PAGE CAN CARRY IT. `archive.js` is about
 * the COLLECTION — base rates, the featured list, team seasons — and the game
 * page inlines none of it: `sentence.js` reads the published `levelCurve`
 * directly rather than importing `rowFor`, and its own comment says so. The
 * per-game summary needs the same reading for `perGame`, and inlining the whole
 * archive tier to reach four functions would put every aggregation the browser
 * never runs into every game page.
 *
 * So the MECHANISM lives here, small enough to ship, and `archive.js` keeps the
 * aggregation that walks records. Same division as `rink.js` and `strength.js`:
 * a rule the browser and the pipeline both apply, in one place, imported by
 * both and restated by neither.
 */

/**
 * ⭐ WHAT A NORMAL NIGHT LOOKS LIKE — the distribution of each lens's count, per
 * game, and the one thing `measures.json` has never been able to say.
 *
 * Every figure in this file until now is a RATE: of all attempts, this share was
 * blocked; of games with an edge, this share were lost. None of them can answer
 * "is 94 attempts a lot", because a share of a population says nothing about
 * how one night compares to the others. That is §32.6's blocker, and it blocks
 * the per-game summary, the measurements page, and any sentence anywhere that
 * calls a game unusual.
 *
 * ⭐ A HISTOGRAM, NOT A MEAN AND A SPREAD, and the choice is the doctrinal one.
 * A mean invites "average", a standard deviation asserts a shape nobody has
 * checked, and both are summaries a reader cannot verify against anything. An
 * integer histogram is the raw material: every median, quartile and "more nights
 * than four in five" is DERIVED from it by `quantile`/`shareAtOrBelow` below, in
 * one place, and can be recomputed by anyone holding the published file. Publish
 * the mechanism and let the sentence be chosen on top of it.
 *
 * ⭐ AND THE UNIT IS THE CHIP'S OWN NUMBER. The selector puts a live count on
 * each lens and that count is `reducer.reduce(...).counted.length`; these
 * distributions count the same field from the same reducers, so the number on
 * screen and the reference class it is compared against are the same quantity by
 * construction rather than by coincidence. `test/measure.test.js` asserts that
 * identity against the page's own table.
 *
 * `n` COUNTS GAMES here — unlike `attemptMix`, whose n counts attempts. Both say
 * so in `what`, because the two units differ by a factor of about 120.
 *
 * ⭐ AND IT IS SCOPED PER SEASON, NEVER POOLED — measured, not assumed, because
 * every other figure in this file pools the three seasons and it would have been
 * the obvious thing to copy. Over a stratified 600-game sample, 200 per season,
 * the question asked was the one that matters: how far would a game's RANK move
 * if it were scored against the pooled archive instead of its own season?
 *
 *   lens          by season   random p50   random p95   verdict
 *   attempts          12.5          6.8          8.7    season matters
 *   blocked           15.0          4.7          7.5    season matters
 *   goaltending       13.0          5.5         11.0    season matters
 *   slot               3.8          5.3          7.3    within noise
 *   stoppages          4.7          5.0          8.2    within noise
 *
 * ⭐ THE CONTROL IS WHAT MAKES THAT READABLE: 200 random splits into groups of
 * the SAME SIZES, ignoring the season entirely. A 12-point gap means nothing
 * without knowing what 200 games of sampling noise produces on its own, and the
 * answer is 7–11 points at p95. Three of five clear it, so a pooled rank would
 * be wrong by more than a tenth of the archive on the lenses a reader looks at
 * most. Hockey is not stationary and this is the measurement that says so.
 *
 * The two within noise are published per season anyway, because a document whose
 * scoping depends on which lens you read is a document nobody can quote safely.
 */
/* THE POPULATION IS THE CALLER'S TO NAME, and it is not optional in practice:
   `perGame` passes a season-scoped one, because these figures are NARROWER than
   the archive-wide `POPULATION` every other measure in this repo carries. A
   default here would have quietly labelled a season as the league. */
export function distribution(values, what, population = null) {
  const v = values.filter(x => Number.isInteger(x)).sort((a, b) => a - b);
  // An empty population publishes no shape at all rather than a zero one, for
  // the reason `rateOf` returns a null rate: 0 reads as a finding.
  if (!v.length) return { what, population, unit: 'games', n: 0,
                          min: null, max: null, start: null, counts: [] };
  const min = v[0], max = v[v.length - 1];
  const counts = new Array(max - min + 1).fill(0);
  for (const x of v) counts[x - min]++;
  return { what, population, unit: 'games', n: v.length, min, max, start: min, counts };
}

/**
 * The value at a quantile, by the nearest-rank method over the published counts.
 *
 * NEAREST-RANK, NEVER INTERPOLATED: these are counts of events in a hockey game,
 * so every value in the distribution is a number that actually occurred, and an
 * interpolated median of 88.5 attempts is a night nobody played. The method is
 * named here because "the median" has several and they disagree on even n.
 */
export function quantile(d, q) {
  if (!d || !d.n) return null;
  const want = Math.max(1, Math.ceil(q * d.n));
  let seen = 0;
  for (let i = 0; i < d.counts.length; i++) {
    seen += d.counts[i];
    if (seen >= want) return d.start + i;
  }
  return d.max;
}

/**
 * The share of games at or below this value — the rank a sentence like "more
 * than four nights in five" is built from.
 *
 * AT OR BELOW, and the name says which. A game holding the exact median value is
 * not "above average", and a rule that split ties would have to choose a side of
 * one; this counts the ties in, once, and is stated so nobody has to guess.
 * Returns null over an empty population, never 0.
 */
export function shareAtOrBelow(d, value) {
  if (!d || !d.n) return null;
  let seen = 0;
  for (let i = 0; i < d.counts.length; i++) {
    if (d.start + i > value) break;
    seen += d.counts[i];
  }
  return seen / d.n;
}

/**
 * ⭐ THE ONE WAY THIS GAME WAS UNUSUAL — or nothing, which it must be able to say.
 *
 * "Three things to notice" was ruled publishable only as *three ways this game
 * was unusual*: a MEASURED distance from a base rate, with the dimensions chosen
 * ONCE IN PUBLIC rather than per game and invisibly, and able to report that
 * nothing stood out. This is that, at one dimension rather than three — the
 * lenses are the dimensions, published in `perGame`, and the game supplies which.
 *
 * ⭐ NO TUNED THRESHOLD, AND THAT IS THE WHOLE DIFFICULTY. "Unusual enough to
 * mention" wants a cutoff, and a cutoff here would be a parameter with no source
 * in the data — the shape CHENG named as a model wearing a UI control. What is
 * used instead is a DEFINITION: the middle half of nights, p25 to p75, which is
 * not a number anybody chose. A count inside it is ordinary by construction, and
 * when every count is inside it the answer is that nothing was unusual.
 *
 * ⭐ AND THE FINDING IS A FRACTION, NOT A PERCENTAGE — `levelCurve`'s rule,
 * earned there and load-bearing here for the same reason: "more than 182 of the
 * 200 nights" is self-limiting where "91st percentile" is not, and it needs no
 * minimum-`n` guard, which would be another parameter with no source. Early in a
 * season `n` is small and the sentence says so by construction.
 *
 * Returns null when there is nothing to compare against — no distributions, no
 * season, or an empty one. A caller must then say nothing at all, which is the
 * verdict card's standing rule.
 */
/**
 * ⭐⭐ WHERE ONE COUNT SITS IN ONE DISTRIBUTION — the whole judgement, once.
 *
 * ⚠️ NOT `standing`, WHICH IS `strength.js`'s AND MEANS THE SCORE STATE. The two
 * were about to be top-level names in one concatenated bundle, where a
 * redeclaration does not throw — the later one silently wins. `test/build.test.js`
 * caught it on the first run after this was written, which is the gate doing
 * exactly its job. The name here is this module's own header: *the shape of a
 * count, and where one night sits in it.*
 *
 * ⭐ IT EXISTS BECAUSE A SECOND SURFACE ASKED THE SAME QUESTION. The verdict card
 * has judged a night against its season since 2026-08-28; on 2026-09-28 Kevin's
 * `Is that a lot?` overlay had to judge THE LAYER THE READER IS LOOKING AT,
 * against the same distribution, in the same vocabulary. Written twice, the two
 * surfaces would be free to disagree about what "unusual" means — and one of
 * them would be the one a reader pressed a button labelled *is that a lot* to
 * reach. One answer, and every surface that judges a night reads it: the verdict
 * card's own sentence, the overlay, and the six rows of `#sumPanel`.
 *
 * ⭐ THE REFERENCE CLASS COMES BACK EVEN WITH NO COUNT, and that is the whole
 * reason the two halves are separable. Mid-replay the layer's count is PARTIAL —
 * the chip says 16 stoppages so far — and this population is of FINISHED games,
 * so ranking one against the other would be the "two numbers about different
 * things wearing one label" defect this file's own callers have paid for twice.
 * What is always true and always sayable is what a finished night holds. The
 * verdict waits for the horn; the reference class does not have to.
 *
 * ⚠️ `inside` IS A DEFINITION, NOT A THRESHOLD — p25 to p75, the middle half,
 * which is not a number anybody chose. A cutoff here (“unusual beyond 1.5 IQR”,
 * “the top decile”) would be a parameter with no source in the data, which is the
 * one thing this file exists to avoid.
 * ⚠️ AND `beat` IS STRICT, so a tie is never claimed as a difference.
 */
export function sitsIn(d, count) {
  if (!d || !d.n || !d.noun) return null;
  const lo = quantile(d, 0.25), hi = quantile(d, 0.75);
  /* ⭐ `population` TRAVELS, because a caller that needs to name the season must
     not construct the label. The first version of the overlay's sentence built
     one from the key — `2025` + `–` + `11` — and printed "the 2025–11 season".
     The document already carries "NHL regular season and playoffs, 2025-26";
     naming a thing the archive names is the archive's job. */
  const out = { noun: d.noun, of: d.n, lo, hi, min: d.min, max: d.max,
                population: d.population || null };
  if (!Number.isInteger(count)) return out;
  const high = count > hi;
  let beat = 0;
  for (let k = 0; k < d.counts.length; k++) {
    const at = d.start + k;
    if (high ? at < count : at > count) beat += d.counts[k];
  }
  return { ...out, count, inside: count >= lo && count <= hi, high, beat,
           /* Furthest from a typical night, for a caller choosing between
              lenses. `shareAtOrBelow` is the same walk the published document
              supports, so the ordering can be recomputed by anyone. */
           far: Math.abs(shareAtOrBelow(d, count) - 0.5) };
}

/**
 * IS THIS SEASON OVER? — answered without a number, from the archive's own keys.
 *
 * ⏭ WHAT IT IS FOR NOW, AND IT IS NARROWER THAN WHAT IT WAS BUILT FOR. It is
 * asked of a season we are thinking of BORROWING: `renderAlot` reaches for a
 * nearest-season yardstick only when this game's own season has no histogram at
 * all, and what it borrows from a different season should be settled.
 *
 * ⛔⛔ IT NO LONGER GATES A GAME'S OWN SEASON, and that is Kevin's ruling of
 * 2026-10-02 rather than a drift. For one day both surfaces asked it of the
 * season the game belongs to, so a game played in October was measured against
 * last season or not at all. He chose to use this season from the start — *"a
 * terrible small sample size, but we'll be able to watch all of the data fill in
 * over time"* — against a design that states its `n` in every sentence it prints.
 *
 * ⚠️ THE DEFECT IT WAS WRITTEN FOR IS STILL REAL, and it is worth keeping the
 * account because the ruling settles the trade and not the facts. `perGame`
 * publishes a histogram for every season the archive holds with no minimum n —
 * correctly, because withholding a measurement is how this project has lost data
 * before — and on 1 October the archive held 8 games of 2026. Both readers asked
 * only whether the key EXISTED, so the next derive would have swapped a
 * 1,394-game yardstick for an 8-game one with every test green. What was wrong
 * there was that nobody had DECIDED it. Now somebody has.
 *
 * ⭐ AND THE RULE CARRIES NO NUMBER. "Enough games" would be a threshold with no
 * source — the thing `sitsIn` and the middle half are both built to avoid. A
 * season is finished when the archive holds a game from a later one, which is a
 * fact the published document already states in its own keys. The current season
 * is always the highest key, so no October needs an edit.
 *
 * ⚠️ THE OPEN MEASUREMENT IS UNCHANGED by the ruling: the comment at the top of
 * this file prices cross-season ranking at 12.5–15 rank places against a control
 * of 7–11. That is what decides whether a BORROWED season is worth borrowing at
 * all, which is the one question this predicate still stands in front of.
 *
 * @param perGame  the published `perGame` block, keyed by season
 * @param season   the season the game belongs to, as a string or number
 */
export function finishedSeason(perGame, season) {
  if (!perGame || season == null || season === '') return false;
  const y = Number(season);
  if (!Number.isFinite(y)) return false;
  return Object.keys(perGame).some(k => Number(k) > y);
}

/* ⏭ `judgeable` AND `mostUnusual` STOOD HERE UNTIL 2026-10-02, and they went
   with their only caller.

   They answered *which single lens was this game's most unusual, and how many
   lenses could be judged at all* — one sentence on the verdict card. Kevin, from
   the live site: *"take the text off of the metric, I think the scales fix the
   visualization issue and the text just adds clutter."* `#sumPanel` now draws all
   six lenses with a scale each, so the sentence was summarising a picture the
   reader already had.

   ⭐ THEY ARE DELETED RATHER THAN LEFT EXPORTED. Both had unit tests and no
   reader could reach either: that is `workshop-inventory`'s shape exactly — code
   that ships, passes, and is reachable from nothing anybody can do. A function
   kept alive only by its own tests is not covered, it is unobserved.

   ⚠️ THE DISTINCTION THEY TAUGHT IS NOT DELETED, because `sitsIn` still carries
   it: "every count was ordinary" and "no lens could be judged at all" are two
   different facts, and a caller that cannot tell them apart will say a game was
   ordinary without having checked. `renderSum` keeps them apart structurally — a
   lens with no distribution draws a row with the count and no placement. */
