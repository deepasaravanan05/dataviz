import {
  MIN_SIGN_CLEARANCE,
  clearanceAt,
  hidesAnotherRide,
  type TeamSign,
} from "@/components/park/rideSigns";
import { GATE_X, GATE_Z } from "@/simulation/journey/constants";
import {
  LOOPER_RIDE_ID,
  LOOPER_RIDE_NAME,
  LOOPER_TEAM_NAME,
  OVERALL_REACH,
} from "./constants";
import { RIDE_CENTER } from "./placement";

/**
 * THE SUPER LOOPER'S TEAM SIGN — "this ride is for UI/UX".
 *
 * A board on open ground beside the ride, in the park's own sign vocabulary,
 * placed the way every other sign in the park is placed: offset sideways from
 * the line back to the gate, out past the ride, taking the closest spot that
 * is still comfortably clear of everything.
 *
 * IT LIVES HERE RATHER THAN IN `rideSigns.ts`, WHICH IS A DEPENDENCY MATTER
 * AND NOT A STYLE ONE. This ride's placement search reads RIDE_SIGNS out of
 * that module so it can keep clear of the five department boards; if that
 * module then read this ride's position back, the two would import each other
 * in a circle. The solver is therefore on this side of the line, using the two
 * helpers `rideSigns.ts` exports, and the type it produces comes across as a
 * type only — which is erased before anything runs.
 *
 * The search is the Flying Chairs' one, for the same reason theirs was written
 * out separately: the shared `solve()` reads its subject from `PARK_LAYOUT`,
 * and this ride is deliberately not in it. Its own swept circle is an obstacle
 * too — a board stands beside a ride, not underneath one — and the layout
 * knows nothing about that either.
 */
function solveLooperSign(): TeamSign {
  const [cx, cz] = RIDE_CENTER;

  const ax = GATE_X - cx;
  const az = GATE_Z - cz;
  const al = Math.hypot(ax, az) || 1;
  const ux = ax / al;
  const uz = az / al;
  const px = -uz;
  const pz = ux;

  let best: { position: [number, number]; clearance: number; score: number } | null = null;

  /*
   * A RING SEARCH, because the band this used to walk ran out of park.
   *
   * It looked in a rectangle beside the ride — so far out, so far along — which
   * was ample when a ride was sixty metres across and its neighbours were a
   * long way off. Every ride is built to one common height now, and beside this
   * one there is no longer any ground in that rectangle that clears the
   * neighbours, the rails and the walking lanes at once: the board had nowhere
   * to stand at all.
   *
   * So the search is the whole ring around the ride, walked outward. What is
   * kept from the old shape is the PREFERENCE, not the window: nearest wins,
   * and among equals a board beside the ride beats one dead in front of the
   * arriving crowd, which is what the sideways term scores.
   */
  for (let out = OVERALL_REACH + 8; out <= OVERALL_REACH + 400; out += 3) {
    for (let step = 0; step < 72; step += 1) {
      const bearing = (step * Math.PI * 2) / 72;
      const x = cx + Math.cos(bearing) * out;
      const z = cz + Math.sin(bearing) * out;

      if (hidesAnotherRide(x, z, LOOPER_RIDE_ID)) continue;

      const ownRide = Math.hypot(x - cx, z - cz) - OVERALL_REACH;
      const clearance = Math.min(clearanceAt(x, z), ownRide);
      if (clearance < MIN_SIGN_CLEARANCE) continue;

      /* How far off the gate's line of sight this bearing stands, 0 in front
         of the ride and 1 square beside it. */
      const sideways = Math.abs(
        (Math.cos(bearing) * px + Math.sin(bearing) * pz),
      );
      const score = Math.min(clearance, 26) * 0.8 - out + sideways * 20;
      if (!best || score > best.score) best = { position: [x, z], clearance, score };
    }
    if (best) break;
  }

  if (!best) {
    throw new Error("No ground beside the Super Looper will take its signboard");
  }

  return {
    rideId: LOOPER_RIDE_ID,
    department: LOOPER_TEAM_NAME,
    departments: [LOOPER_TEAM_NAME],
    rideName: LOOPER_RIDE_NAME,
    position: best.position,
    facing: Math.atan2(GATE_X - best.position[0], GATE_Z - best.position[1]),
    clearance: best.clearance,
  };
}

export const LOOPER_SIGN: TeamSign = solveLooperSign();
