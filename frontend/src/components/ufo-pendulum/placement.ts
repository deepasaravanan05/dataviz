import { MAIN_VIEWPOINT, rideById } from "@/components/park/layout";
import {
  STRUCTURE_HALF_ACROSS_SWING,
  STRUCTURE_HALF_ALONG_SWING,
  UFO_RIDE_ID,
} from "./constants";

/**
 * WHERE THE RIDE STANDS, AND WHICH WAY IT FACES.
 *
 * This lives apart from `constants.ts` for a plain dependency reason: the park
 * layout has to know how big this ride is in order to place it, and this ride
 * has to know where the layout put it. Splitting the two breaks the cycle —
 * `constants.ts` declares the envelope and imports nothing from the park;
 * `layout.ts` reads that envelope; this file reads the answer back.
 *
 * THE PLOT IS THE DROP TOWER'S. The ride was first built on the roomiest empty
 * ground in the park — the south-west gap between the Roller Coaster and the
 * Dragon Ride — and was then asked to stand where the tower stood instead. So
 * it is in the layout under its own id, in the slot the tower used to hold,
 * and the tower is gone. Nothing else in the layout changed: the other four
 * rides keep the boxes and the positions they already had.
 */

/** World position of the bearing's centre line, from the park layout. */
export const RIDE_CENTER: [number, number] = rideById(UFO_RIDE_ID).center;

/**
 * WHICH WAY THE ARC FACES.
 *
 * A pendulum swinging towards you reads as a dot going up and down; the same
 * pendulum swinging across you reads as the hundred-metre arc it is. So the
 * ride is turned to present its swing plane broadside to the park's main
 * viewpoint — the entrance — and the check that this actually holds measures
 * the angle between the swing direction and the line of sight rather than
 * trusting the trigonometry here.
 *
 * A group rotated by `alpha` about +Y carries its local +X to
 * (cos alpha, -sin alpha) in world x/z. Setting that equal to the left-hand
 * perpendicular of the view direction gives the angle below.
 */
const toRideX = RIDE_CENTER[0] - MAIN_VIEWPOINT[0];
const toRideZ = RIDE_CENTER[1] - MAIN_VIEWPOINT[1];
const toRideLength = Math.hypot(toRideX, toRideZ) || 1;

export const RIDE_FACING = Math.atan2(-toRideX / toRideLength, -toRideZ / toRideLength);

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * The solid structure's half-extents in WORLD axes, once the ride is turned.
 *
 * The frames are thin along the swing and deep across it (see
 * STRUCTURE_HALF_* in constants.ts), so how wide this ride looks depends on
 * which way it is facing. Rotating a box by `alpha` and taking its
 * axis-aligned bounds is the standard |cos| / |sin| combination, done once
 * here rather than in each place that needs it.
 */
const c = Math.abs(Math.cos(RIDE_FACING));
const s = Math.abs(Math.sin(RIDE_FACING));

export const STRUCTURE_HALF_X =
  c * STRUCTURE_HALF_ALONG_SWING + s * STRUCTURE_HALF_ACROSS_SWING;
export const STRUCTURE_HALF_Z =
  s * STRUCTURE_HALF_ALONG_SWING + c * STRUCTURE_HALF_ACROSS_SWING;
