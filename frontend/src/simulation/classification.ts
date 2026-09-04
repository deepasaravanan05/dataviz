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
 * THE BOUNDARIES ARE EXACT AND HALF-OPEN, to the second:
 *
 *   check-in  <  09:45:00              GREEN
 *   09:45:00 <= check-in <  11:00:00   YELLOW
 *   check-in >= 11:00:00               RED
 *
 * Both of those matter. Half-open means 09:45:00 exactly is YELLOW and not
 * green, and 11:00:00 exactly is RED and not yellow — the bands touch without
 * overlapping, so no clock time can fall in two of them or in neither. To the
 * second means the comparison is made on the check-in the sheet actually
 * prints: `final one.xlsx` records 09:45:30, and rounding that down to 09:45
 * would have dressed a yellow arrival in green.
 *
 * Configurable in exactly the way the delay thresholds are, and expressed as
 * minutes-of-day so they read the same units the dataset does.
 */
export const CHECK_IN_THRESHOLDS = {
  /** Checked in BEFORE this is GREEN. 09:45. */
  greenUntil: 9 * 60 + 45,
  /** Checked in before this and not before `greenUntil` is YELLOW. 11:00. */
  yellowUntil: 11 * 60,
};

export function classifyCheckIn(
  minutesOfDay: number,
  thresholds = CHECK_IN_THRESHOLDS,
): SeatColor {
  if (minutesOfDay < thresholds.greenUntil) return "GREEN";
  if (minutesOfDay < thresholds.yellowUntil) return "YELLOW";
  return "RED";
}
