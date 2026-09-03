import { MAX_FLIGHT_RISE, STAIR_RISE } from "@/simulation/journey/boardingStair";
import { DECK_Y, PLINTH_HEIGHT } from "./constants";

/**
 * THE CLIMB UP TO THE GALLERY, solved once and used twice.
 *
 * `Platform.tsx` builds the steps from this and `verify-dumbo-ride.ts`
 * measures them from it, so the flight that is checked is the flight that is
 * drawn — the same arrangement the Tea Cups next door use.
 *
 * The step is the PARK'S step, from `boardingStair.ts`: sized from the people
 * who climb it, so this stair matches every other one in the park rather than
 * inventing a rise of its own. That module also says how tall a single flight
 * may get before it has to break, and on this ride that rule matters — the
 * gallery is level with the howdahs, which are on the elephants' backs, which
 * hang clear of the ground, so there is a real climb here and it comes out as
 * a switchback rather than one straight run.
 */

export const STATION_TOTAL_RISE = DECK_Y - PLINTH_HEIGHT;
export const STATION_STEPS = Math.max(1, Math.round(STATION_TOTAL_RISE / STAIR_RISE));
export const STATION_RISE = STATION_TOTAL_RISE / STATION_STEPS;
export const STATION_STEPS_PER_FLIGHT = Math.max(1, Math.floor(MAX_FLIGHT_RISE / STAIR_RISE));
export const STATION_FLIGHTS: number[] = (() => {
  const count = Math.max(1, Math.ceil(STATION_STEPS / STATION_STEPS_PER_FLIGHT));
  const base = Math.floor(STATION_STEPS / count);
  const extra = STATION_STEPS - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
})();
