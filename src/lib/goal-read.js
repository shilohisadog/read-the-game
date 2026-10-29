/**
 * Post-goal reading hold — a fixed pause after a goal so the viewer can read
 * the board, the banner, the caption and the notes.
 *
 * Kevin, 2026-10-29: a goal frame already waited frameMs + CAPTION_BONUS once it
 * was on screen (6300 ms at the default gear), for both tracked and untracked
 * goals. That pause still scaled with the speed gear, and nothing on the ice
 * named it as reading time. He asked for a flat pause after the goal, the same
 * at every speed, with a faint countdown at centre ice. Tuned the same day:
 * 4 s → 10 s → 20 s after he watched each live; 10 s was still too short. The
 * hold is now a soft pause: the Play control reads Play, tapping it continues
 * at once, and otherwise the replay continues when the countdown reaches 0 —
 * so readers set their own pace.
 *
 * CAPTION_BONUS stays for every other captioned frame. Goals use this instead:
 * one number, not gear-scaled, so Faster does not rush the read and Slower does
 * not pad it.
 */

/** Fixed post-goal reading pause, ms. Does not scale with the speed gear. */
export const GOAL_READ_MS = 20000; // 2026-10-29: 10 s was still too short; 20 s plus tap-to-continue so readers set their own pace

/**
 * Countdown copy for the hold. Two faint lines under centre ice.
 * `msLeft` is milliseconds still to wait; at or below zero there is nothing to
 * say. Whole seconds, ceil, so 20000 → "20 seconds" and (0, 1000] → "1 second".
 */
export function goalReadLines(msLeft) {
  if (!(msLeft > 0)) return null;
  const n = Math.ceil(msLeft / 1000);
  return {
    tap: 'Tap Play to continue',
    or: n === 1
      ? 'or the replay continues in 1 second'
      : `or the replay continues in ${n} seconds`,
  };
}

/** Joined form of `goalReadLines` (newline between the two lines). */
export function goalReadLabel(msLeft) {
  const L = goalReadLines(msLeft);
  return L ? `${L.tap}\n${L.or}` : '';
}

/**
 * How long a goal frame waits: the fixed read hold, plus any leftover tracking
 * still attached to this frame (same shape as `dwell`'s `base + trkExtra`).
 */
export function goalReadDwell(trkLeft = 0) {
  return GOAL_READ_MS + Math.max(0, trkLeft);
}
