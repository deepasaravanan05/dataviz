import { facingCenter, inwardFrom, ringCenterOf } from "@/components/park/parkRing";

/**
 * WHERE THE FLYING CHAIRS STAND — a slot on the park ring.
 *
 * This ride used to search for its own ground: "behind the food court" was the
 * brief, and the placement walked out along the gate's bearing through the
 * court until it found the first spot that cleared every margin in the park.
 * That was the right method while the park was a loose fan of attractions with
 * pockets of unused ground between them. It is not the method any more: the
 * park is a ring, every attraction has a numbered slot on it, and the slots
 * are solved together in `parkRing.ts` so that neighbours cannot crowd each
 * other however the rides are resized.
 *
 * The search is gone rather than kept as a fallback, deliberately. Two rules
 * for where a ride stands is one rule too many, and a search that ran against
 * the ring would only ever rediscover the slot the ring already assigned.
 *
 * IT ALSO LIVES APART FROM `constants.ts` NOW, for a dependency reason: the
 * ring has to know how big this ride is in order to give it a slot, so a
 * module the ring reads cannot itself read the ring.
 */

/** World position of the column's centre line. */
export const RIDE_CENTER: [number, number] = ringCenterOf("chairs");

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/** Broadside to the middle of the park, which is the side people arrive from. */
export const RIDE_FACING = facingCenter(RIDE_CENTER);

/**
 * Bearing from the ride to the middle of the park — the side the ladder is
 * put on, because that is where the ring path and the queue are.
 *
 * It used to point at the main gate, on the argument that a visitor arrives
 * from that side. On a ring that is no longer true for eight rides out of ten:
 * the gate is behind the ones at the back. What IS true for all of them is
 * that people come off the ring path, and the ring path is inside.
 */
export const LADDER_AZIMUTH = (() => {
  const [ix, iz] = inwardFrom(RIDE_CENTER);
  return Math.atan2(iz, ix);
})();
