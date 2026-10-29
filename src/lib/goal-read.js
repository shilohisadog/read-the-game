/**
 * Post-goal reading hold — a fixed pause after a goal so the viewer can read
 * the board, the banner, the caption and the notes.
 *
 * Kevin, 2026-10-29: a goal frame already waited frameMs + CAPTION_BONUS once it
 * was on screen (6300 ms at the default gear), for both tracked and untracked
 * goals. That pause still scaled with the speed gear, and nothing on the ice
 * named it as reading time. He asked for a flat pause after the goal, the same
 * at every speed, with a faint countdown at centre ice. The first trial was
 * 4000 ms; watching it live he said it definitely needed to be longer, so it
 * is now 10000 ms — chosen by feel, and may be tuned again.
 *
 * CAPTION_BONUS stays for every other captioned frame. Goals use this instead:
 * one number, not gear-scaled, so Faster does not rush the read and Slower does
 * not pad it.
 */

/** Fixed post-goal reading pause, ms. Does not scale with the speed gear. */
export const GOAL_READ_MS = 10000; // 2026-10-29: raised from 4 s to 10 s after Kevin watched it live; 4 s was too short to read the goal frame

/**
 * Countdown copy for the hold. `msLeft` is milliseconds still to wait; at or
 * below zero there is nothing to say. Whole seconds, ceil, so 10000 → "10 seconds"
 * and (0, 1000] → "1 second".
 */
export function goalReadLabel(msLeft) {
  if (!(msLeft > 0)) return '';
  const n = Math.ceil(msLeft / 1000);
  return n === 1 ? 'Replay continues in 1 second' : `Replay continues in ${n} seconds`;
}

/**
 * How long a goal frame waits: the fixed read hold, plus any leftover tracking
 * still attached to this frame (same shape as `dwell`'s `base + trkExtra`).
 */
export function goalReadDwell(trkLeft = 0) {
  return GOAL_READ_MS + Math.max(0, trkLeft);
}
