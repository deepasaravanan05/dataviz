import { CAR_RIDE_HEIGHT } from "./constants";
import { STATION_TRACK_Y } from "./trackCurve";

/**
 * WHERE THE PLATFORM SITS, which needs both halves of the ride.
 *
 * The boards have to be level with the car floor, the car floor rides a fixed
 * height above the rail, and the rail's height along the station straight is
 * something only the finished curve knows — `trackCurve.ts` corrects every
 * height on the circuit by a hair to land the crest exactly on the ride's
 * stated height, so the station straight moves with it.
 *
 * That module reads the ride's constants, so the constants cannot read it
 * back: the two would import each other in a circle and whichever loaded
 * second would see undefined. This module is where the two meet, and it is
 * imported by the station's geometry and by the verify script alike.
 */

/** The boards, level with the floor of a car standing in the station. */
export const PLATFORM_Y = STATION_TRACK_Y + CAR_RIDE_HEIGHT;
