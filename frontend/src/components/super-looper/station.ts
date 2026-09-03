import { MAX_FLIGHT_RISE, STAIR_RISE } from "@/simulation/journey/boardingStair";
import { PLATFORM_Y } from "./constants";

/**
 * THE CLIMB UP TO THE PLATFORM, solved once and used twice.
 *
 * `Structure.tsx` builds the steps from this and `verify-super-looper.ts`
 * measures them from it, so the flight that is checked is the flight that is
 * drawn — the same arrangement the seat rings and the motion tables on this
 * park's other rides already use.
 *
 * The step itself is the PARK'S step, not this ride's: `boardingStair.ts`
 * sizes a stair from the people who climb it and every boarding stair in the
 * park is built from those figures, so this one matches the other five rather
 * than inventing a rise of its own. The same module says how tall a single
 * flight may get before it has to break, and that rule is what decides whether
 * this ride needs one flight or two.
 */

/** Steps of the park's own rise, as many as the platform's height needs. */
export const STATION_STEPS = Math.max(1, Math.round(PLATFORM_Y / STAIR_RISE));
/** The actual rise per step, so the top step lands exactly on the boards. */
export const STATION_RISE = PLATFORM_Y / STATION_STEPS;
/** The most steps one flight may carry. */
export const STATION_STEPS_PER_FLIGHT = Math.max(1, Math.floor(MAX_FLIGHT_RISE / STAIR_RISE));
/** The flights, as evenly divided as whole steps allow. */
export const STATION_FLIGHTS: number[] = (() => {
  const count = Math.max(1, Math.ceil(STATION_STEPS / STATION_STEPS_PER_FLIGHT));
  const base = Math.floor(STATION_STEPS / count);
  const extra = STATION_STEPS - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
})();
