/**
 * Where a frame sits on the scrub track.
 *
 * ⭐ THIS IS HERE RATHER THAN IN `app.js` BECAUSE IT IS THE PART THAT CAN BE
 * WRONG WITHOUT LOOKING WRONG. The two numbers below decide where a goal tick
 * lands, and both of them have an off-by-one that draws a perfectly tidy row of
 * marks in the wrong place — the failure mode this project spends most of its
 * effort on. The page's fake DOM cannot report an element's computed `left`, so
 * a test driving the page could only ever count the ticks, not check them. As a
 * pure function it is checked directly.
 *
 * ⚠️ THE RANGE STARTS AT -1, AND THAT IS NOT AN OFF-BY-ONE TO BE TIDIED AWAY.
 * The playhead floor is a real frame — index -1 draws the rink, both
 * goaltenders, a 0-0 board and two empty boxes — so the scrubber's range is
 * `-1 .. n-1` and its length is `n`, not `n-1`. The fraction of the track for
 * frame k is therefore `(k + 1) / n`. Using `k / (n - 1)` puts every tick one
 * frame to the left, which on a 300-event game is under a pixel at the start and
 * still under a pixel at the end: invisible, and wrong everywhere.
 */

/** Every goal in a playable event list, with its fraction of the scrub track. */
export function goalTicks(events) {
  const n = events.length;
  const out = [];
  if (!n) return out;
  events.forEach((e, k) => {
    if (e && e.type === 'goal') out.push({ k, f: (k + 1) / n });
  });
  return out;
}

/**
 * The CSS `left` for a tick at fraction `f`, as a `calc()` over one variable.
 *
 * ⛔⛔ A NATIVE RANGE'S THUMB DOES NOT TRAVEL 0 → 100%. It is inset by half a
 * thumb width at each end, so the thumb's centre at fraction f is at
 *
 *     thumb/2 + f x (track - thumb)
 *
 * which rearranges to `f x 100% + thumb x (0.5 - f)` — the form below, so one
 * `calc()` reads one variable and the thumb width stays a single named number.
 * Placing ticks at a bare `f x 100%` is wrong by `thumb x (0.5 - f)`: zero at
 * mid-game and a full half-thumb at either end, which is exactly where an
 * empty-net goal sits.
 *
 * ⚠️ `--scrub-thumb` IS AN ASSUMPTION, NOT A MEASUREMENT, and `app.css` carries
 * the reason: the thumb's width cannot be read from script. Synthetic clicks do
 * not drive a native range (an untrusted event never starts the internal drag),
 * and `getComputedStyle(el, '::-webkit-slider-thumb')` returns the input's own
 * box. Being wrong by d pixels misplaces a tick by `d x |0.5 - f|` — at most
 * d/2 — so the error degrades gently, and clicking never depends on it: a tick
 * carries its frame index.
 */
export const tickLeft = f =>
  `calc(${(f * 100).toFixed(3)}% + var(--scrub-thumb) * ${(0.5 - f).toFixed(5)})`;
