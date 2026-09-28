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
 * reach. `mostUnusual` now calls this, so there is one answer and two callers.
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
 * which is not a number anybody chose. See `mostUnusual` for why a cutoff here
 * would be a parameter with no source in the data.
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

export function judgeable(dists, counts) {
  if (!dists || !counts) return 0;
  let n = 0;
  for (const [lens, d] of Object.entries(dists))
    if (d && d.n && d.noun && Number.isInteger(counts[lens])) n++;
  return n;
}

/**
 * ⚠️ AND `mostUnusual` RETURNING NULL IS TWO DIFFERENT FACTS. "Every count was
 * ordinary" and "no lens could be judged at all" are not the same statement, and
 * a caller that cannot tell them apart will say the game was ordinary without
 * having checked — which is what shipped for one commit, because the page
 * guarded on `some(d => d.n)`, a NEIGHBOUR of the question rather than the
 * question. `judgeable` above is the question: how many lenses could be judged.
 * The verdict card already makes this distinction for the curve (undefined =
 * never asked, null = asked and did not arrive, two different true sentences);
 * this is the same distinction one measure over.
 */
export function mostUnusual(dists, counts) {
  if (!dists || !counts) return null;
  let best = null, outside = 0;
  for (const [lens, d] of Object.entries(dists)) {
    const v = counts[lens];
    /* ⚠️ AND A DISTRIBUTION WITH NO `noun` IS UNUSABLE, not a finding with a gap
       in it. `perGame` welds the noun to the number precisely so a sentence
       cannot reach for its own wording — and a document derived before nouns
       existed would otherwise have produced "55 whistle", a lens id shown to a
       reader. Skipped, because there is no honest way to say it. */
    if (!Number.isInteger(v)) continue;
    /* ⏹ THE JUDGEMENT ITSELF MOVED TO `standing` ON 2026-09-28, unchanged, so
       the overlay and this card cannot come to mean different things by
       "unusual". What stays here is the CHOICE BETWEEN lenses, which is this
       function's own job and nobody else's. */
    const st = sitsIn(d, v);
    // Ordinary by definition, and therefore not a finding.
    if (!st || st.inside) continue;
    /* ⚠️ HOW MANY WERE UNUSUAL, because the sentence wanted to end "and nothing
       else about it was unusual" and that is a claim about the FOUR LENSES THIS
       FUNCTION DISCARDED. Reporting the furthest one says nothing about the
       others, so the caller is given the count and can only say what it holds. */
    outside++;
    if (!best || st.far > best.far)
      best = { lens, count: st.count, high: st.high, n: st.beat, of: st.of,
               far: st.far, noun: st.noun };
  }
  return best && { ...best, outside };
}
