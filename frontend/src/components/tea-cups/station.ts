import { MAX_FLIGHT_RISE, STAIR_RISE } from "@/simulation/journey/boardingStair";
import { DECK_Y } from "./constants";

/**
 * THE CLIMB UP ON TO THE PLATE, solved once and used twice.
 *
 * `Platform.tsx` builds the steps from this and `verify-tea-cups.ts` measures
 * them from it, so the flight that is checked is the flight that is drawn.
 *
 * The step itself is the PARK'S step: `boardingStair.ts` sizes a stair from the
 * people who climb it and every boarding stair in the park is built from those
 * figures, so this one matches the other five rather than inventing a rise of
 * its own. The same module says how tall a single flight may get before it has
 * to break, and that rule is what decides whether this ride needs one flight or
 * two — which changed when the ride was enlarged, because the plate it climbs
 * on to got thicker with everything else.
 */

export const STATION_STEPS = Math.max(1, Math.round(DECK_Y / STAIR_RISE));
export const STATION_RISE = DECK_Y / STATION_STEPS;
export const STATION_STEPS_PER_FLIGHT = Math.max(1, Math.floor(MAX_FLIGHT_RISE / STAIR_RISE));
export const STATION_FLIGHTS: number[] = (() => {
  const count = Math.max(1, Math.ceil(STATION_STEPS / STATION_STEPS_PER_FLIGHT));
  const base = Math.floor(STATION_STEPS / count);
  const extra = STATION_STEPS - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
})();
