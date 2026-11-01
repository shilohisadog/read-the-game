/**
 * Post-goal reading hold: a fixed pause after a goal, the same at every speed, with a
 * three-line countdown under centre ice. Lines of about equal length, right-justified,
 * capital R in Replay; the first names the main button, which reads Pause during the hold.
 */

/** Fixed post-goal reading pause, ms. Does not scale with the speed gear. */
export const GOAL_READ_MS = 20000;

/**
 * Countdown copy for the hold. Three faint lines under centre ice.
 * `msLeft` is milliseconds still to wait; at or below zero there is nothing to
 * say. Whole seconds, ceil, so 20000 → "20 seconds" and (0, 1000] → "1 second".
 */
export function goalReadLines(msLeft) {
  if (!(msLeft > 0)) return null;
  const n = Math.ceil(msLeft / 1000);
  return {
    tap: 'Tap Pause to stay,',
    mid: 'otherwise the Replay',
    or: n === 1
      ? 'continues in 1 second'
      : `continues in ${n} seconds`,
  };
}
