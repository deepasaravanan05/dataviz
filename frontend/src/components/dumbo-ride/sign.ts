import {
  MIN_SIGN_CLEARANCE,
  clearanceAt,
  hidesAnotherRide,
  type TeamSign,
} from "@/components/park/rideSigns";
import { GATE_X, GATE_Z } from "@/simulation/journey/constants";
import {
  OVERALL_REACH,
  DUMBO_RIDE_ID,
  DUMBO_RIDE_NAME,
  DUMBO_TEAM_NAME,
} from "./constants";
import { RIDE_CENTER } from "./placement";

/**
 * THE DUMBO RIDE'S TEAM SIGN — "the dumpo ride is for finance".
 *
 * A board on open ground beside the ride, in the park's own sign vocabulary,
 * placed the way every other sign in the park is: offset sideways from the
 * line back to the gate, out past the ride, taking the closest spot that is
 * still comfortably clear of everything.
 *
 * IT IS A LABEL AND NOTHING ELSE. Finance is not a department in the roster,
 * so there is nobody to route and nothing in the simulation changes — the same
 * as the Park Train's DevOps board and the Tea Cups' Risk board. Naming a team
 * against a ride relabels the ride's board in this park, and never the roster.
 *
 * It lives in this module rather than in `rideSigns.ts` for a dependency
 * reason: this ride's placement reads RIDE_SIGNS out of there, so a value
 * import back the other way would be a circle.
 */
function solveDumboSign(): TeamSign {
  const [cx, cz] = RIDE_CENTER;

  const ax = GATE_X - cx;
  const az = GATE_Z - cz;
  const al = Math.hypot(ax, az) || 1;
  const ux = ax / al;
  const uz = az / al;
  const px = -uz;
  const pz = ux;

  let best: { position: [number, number]; clearance: number; score: number } | null = null;

  for (const side of [1, -1]) {
    /* The window reaches further than it used to: every ride in the park is
       built to one height now, so the ground beside a ride is both further
       away and more crowded than when eighty metres was ample. */
    for (let out = OVERALL_REACH + 8; out <= OVERALL_REACH + 200; out += 2) {
      for (let along = -80; along <= 90; along += 5) {
        const x = cx + px * side * out + ux * along;
        const z = cz + pz * side * out + uz * along;

        if (hidesAnotherRide(x, z, DUMBO_RIDE_ID)) continue;

        const ownRide = Math.hypot(x - cx, z - cz) - OVERALL_REACH;
        const clearance = Math.min(clearanceAt(x, z), ownRide);
        if (clearance < MIN_SIGN_CLEARANCE) continue;

        const score = Math.min(clearance, 26) * 0.8 - out + along * 0.15;
        if (!best || score > best.score) best = { position: [x, z], clearance, score };
      }
    }
  }

  if (!best) throw new Error("No ground beside the Dumbo Ride will take its signboard");

  return {
    rideId: DUMBO_RIDE_ID,
    department: DUMBO_TEAM_NAME,
    departments: [DUMBO_TEAM_NAME],
    rideName: DUMBO_RIDE_NAME,
    position: best.position,
    facing: Math.atan2(GATE_X - best.position[0], GATE_Z - best.position[1]),
    clearance: best.clearance,
  };
}

export const DUMBO_SIGN: TeamSign = solveDumboSign();
