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
