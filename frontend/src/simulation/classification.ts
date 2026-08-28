import type { SeatColor } from "@/types/simulation";

/**
 * Configurable delay thresholds (§5 of the architecture spec).
 * Delay = Actual Work Start Time - Check-in Time.
 */
export const DELAY_THRESHOLDS = {
  greenMax: 15,
  yellowMax: 30,
};

export function classifyDelay(
  delayMinutes: number,
  thresholds = DELAY_THRESHOLDS,
): SeatColor {
  if (delayMinutes <= thresholds.greenMax) return "GREEN";
  if (delayMinutes <= thresholds.yellowMax) return "YELLOW";
  return "RED";
}

/**
 * WHEN SOMEBODY CLOCKED IN, banded.
 *
 * A different question from `classifyDelay` above, and deliberately kept in the
 * same module so the park has ONE place where a colour band is decided rather
 * than two competing ones. The delay bands say whether a person got to work on
 * time; these say how early in the morning they arrived, which is what the
 * employees' clothing shows.
 *
 * Configurable in exactly the way the delay thresholds are, and expressed as
 * minutes-of-day so they read the same units the dataset does.
 */
export const CHECK_IN_THRESHOLDS = {
  /** Checked in at or before this is GREEN. 09:45. */
  greenUntil: 9 * 60 + 45,
  /** Checked in at or before this is YELLOW. 10:00. */
  yellowUntil: 10 * 60,
};

export function classifyCheckIn(
  minutesOfDay: number,
  thresholds = CHECK_IN_THRESHOLDS,
): SeatColor {
  if (minutesOfDay <= thresholds.greenUntil) return "GREEN";
  if (minutesOfDay <= thresholds.yellowUntil) return "YELLOW";
  return "RED";
}
