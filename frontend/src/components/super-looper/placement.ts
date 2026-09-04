import { facingCenter, ringCenterOf } from "@/components/park/parkRing";

/**
 * WHERE THE SUPER LOOPER STANDS — a slot on the park ring.
 *
 * This ride used to search for its own ground. It was asked for "near to the roller coaster", and the placement walked
 * outward from the coaster's footprint until it found ground that cleared every
 * margin the park keeps.
 * That was the right method while the park was a loose fan of attractions with
 * unused pockets between them; it is not the method any more. The park is a
 * ring, every attraction has a numbered slot on it, and the slots are solved
 * together in `parkRing.ts` so that neighbours cannot crowd one another
 * however the rides are resized — which is a guarantee a one-ride-at-a-time
 * search could never give, because each search only ever knew about the rides
 * that had already been placed.
 *
 * The search is gone rather than kept as a fallback, deliberately: two rules
 * for where a ride stands is one rule too many.
 */

/** World position of the ride's centre line. */
export const RIDE_CENTER: [number, number] = ringCenterOf("looper");

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * WHICH WAY IT FACES: broadside to the middle of the park.
 *
 * A loop seen edge-on is a line, so the ring is turned to present its plane
 * to the park.
 *
 * The rule is the one this ride always followed — present the interesting axis
 * to the people looking at it — with the viewpoint moved from the main gate to
 * the centre of the ring, because the ring path is where everybody now walks.
 */
export const RIDE_FACING = facingCenter(RIDE_CENTER);
