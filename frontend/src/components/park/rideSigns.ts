import { RIDE_DEPARTMENTS, type DepartmentRideId } from "./departments";
import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  viewAngles,
} from "./layout";
import { JOURNEY_EMPLOYEES } from "@/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_OPENING,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import {
  PARK_ORIGIN,
  RADIAL_PATH_WIDTH,
  RIDE_SLOT_BEARING,
  rideEntrance,
  type RingRideId,
} from "@/components/park/parkRing";
import {
  CHAIRS_RIDE_NAME,
  CHAIRS_TEAM_ID,
  CHAIRS_TEAM_NAME,
  OVERALL_REACH as CHAIRS_REACH,
  type ChairsTeamId,
} from "@/components/flying-chairs/constants";
import { RIDE_CENTER as CHAIRS_CENTER } from "@/components/flying-chairs/placement";
import { SIGN } from "@/world/scale";
/*
 * TYPE ONLY, and deliberately so. The Super Looper's placement reads
 * RIDE_SIGNS from this module, so a value import back the other way would be a
 * cycle; a type import is erased before anything runs and cannot be one.
 */
import type { LooperRideId } from "@/components/super-looper/constants";
import type { TeacupsRideId } from "@/components/tea-cups/constants";
import type { DumboRideId } from "@/components/dumbo-ride/constants";

/**
 * Where each ride's department signboard stands.
 *
 * The sign has to say which department a ride represents without getting in
 * anyone's way, and "beside the ride" is not a position — it is a constraint
 * problem. A sign must clear the ride itself, every other ride, the rails, the
 * plaza, the food court and the gate apron; it must stay off the lane the
 * arriving employees walk down and out of the crowd that gathers at the ride;
 * and, most restrictively, from the main gate it must not cover a DIFFERENT
 * ride, because the whole park layout was solved to keep those five silhouettes
 * angularly separate in the first place.
 *
 * So the placement is searched rather than typed. Everything it is measured
 * against is read from the modules that own it — `PARK_LAYOUT` for the ride
 * boxes, the journey routes for the walking lanes
 * — so a sign can never drift out of step with what it is avoiding.
 *
 * verify-legibility.ts re-checks every one of these constraints independently.
 */

/*
 * Board dimensions come from the world scale module, so the sign is the size a
 * person actually reads one at — 4.6 m across, hung 2.6 m up. It used to be a
 * 26 m board eleven metres in the air, which is a motorway gantry.
 */
/** Half-width of the board, and therefore the sign's visual footprint. */
export const SIGN_HALF_WIDTH = SIGN.boardWidth / 2;
export const SIGN_POST_HEIGHT = SIGN.boardBottom + SIGN.boardHeight;
/** Underside of the board. Clear of the 1.75 m figures walking beneath it. */
export const SIGN_BOARD_BOTTOM = SIGN.boardBottom;
export const SIGN_BOARD_HEIGHT = SIGN.boardHeight;

/** Minimum clear ground the search will accept around a sign, in metres. */
export const MIN_SIGN_CLEARANCE = 6;

export interface RideSign {
  rideId: DepartmentRideId;
  /** Joined display label — every department this ride serves. */
  department: string;
  /** The same departments as separate lines, for stacked lettering. */
  departments: string[];
  rideName: string;
  /** World x/z of the post. */
  position: [number, number];
  /** Heading so the board faces the main gate. */
  facing: number;
  /** Smallest distance to anything the sign had to avoid. */
  clearance: number;
}

/**
 * Every stretch of ground an employee actually walks along once inside the
 * park, taken straight from the built routes.
 */
const WALK_SEGMENTS: [number, number, number, number][] = (() => {
  const segs: [number, number, number, number][] = [];
  for (const e of JOURNEY_EMPLOYEES) {
    for (let i = 1; i < e.route.length; i++) {
      const a = e.route[i - 1];
      const b = e.route[i];
      if (a.x === b.x && a.z === b.z) continue;
      segs.push([a.x, a.z, b.x, b.z]);
    }
  }
  return segs;
})();

function boxDistance(x: number, z: number, r: (typeof PARK_LAYOUT)[number]): number {
  const dx = Math.max(r.minX - x, 0, x - r.maxX);
  const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

function segmentDistance(x: number, z: number, s: [number, number, number, number]): number {
  const [ax, az, bx, bz] = s;
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
}

/** Angular interval a point of the given half-width subtends from the main gate. */
function sightInterval(x: number, z: number, halfWidth: number) {
  const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
  const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
  const ul = Math.hypot(ux, uz) || 1;
  const dx = x - MAIN_VIEWPOINT[0];
  const dz = z - MAIN_VIEWPOINT[1];
  const distance = Math.hypot(dx, dz) || 1;
  const bearing =
    (Math.atan2((ux / ul) * dz - (uz / ul) * dx, dx * (ux / ul) + dz * (uz / ul)) * 180) / Math.PI;
  const half = (Math.atan(halfWidth / distance) * 180) / Math.PI;
  return { lo: bearing - half, hi: bearing + half };
}

const RIDE_ANGLES = viewAngles(MAIN_VIEWPOINT, PARK_CENTER);

/**
 * Distance from a candidate sign to everything it must not touch. Its own ride
 * is included: a sign should stand beside its ride, not against it.
 */
export function clearanceAt(x: number, z: number): number {
  let m = Infinity;
  for (const r of PARK_LAYOUT) m = Math.min(m, boxDistance(x, z, r));

  /*
   * The Flying Chairs are not in the layout — the solver does not place them —
   * but a board under their swept circle is still a board under a ride, and
   * with every ride in the park now built to one height that circle is 37.8 m
   * across rather than 25.7. They are also the one attraction that can be
   * measured here at all: every other one places itself AGAINST these signs,
   * so reading its position from this file would be a circle.
   */
  m = Math.min(m, Math.hypot(x - CHAIRS_CENTER[0], z - CHAIRS_CENTER[1]) - CHAIRS_REACH);

  /* The railway used to be measured here. It has been removed from the park,
     so there is nothing left to keep a board clear of. */

  m = Math.min(m, Math.abs(Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) - PLAZA_RADIUS));

  // Food court terrace and the gate apron.
  const fcx = Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0);
  const fcz = Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0);
  m = Math.min(m, Math.hypot(fcx, fcz));
  const gx = Math.max(Math.abs(x - GATE_X) - GATE_OPENING, 0);
  const gz = Math.max(Math.abs(z - GATE_Z) - 40, 0);
  m = Math.min(m, Math.hypot(gx, gz));

  for (const s of WALK_SEGMENTS) {
    m = Math.min(m, segmentDistance(x, z, s));
    if (m < MIN_SIGN_CLEARANCE) return m;
  }
  return m;
}

/** True if a sign here would cover a ride that is not its own, seen from the gate. */
export function hidesAnotherRide(x: number, z: number, ownId: string): boolean {
  const { lo, hi } = sightInterval(x, z, SIGN_HALF_WIDTH);
  return RIDE_ANGLES.some(
    (a) => a.id !== ownId && hi > a.bearingDeg - a.halfWidthDeg && lo < a.bearingDeg + a.halfWidthDeg,
  );
}

/**
 * WHERE A BOARD GOES — beside the ride's own entrance, on the ride's own plot.
 *
 * THE SEARCH IS GONE, and it is worth saying why rather than leaving a hole.
 * It used to sweep a window beside the ride for the nearest spot that cleared
 * every walking lane and every neighbour AND did not cover another ride seen
 * from the main gate. That last condition was the expensive one, and on a
 * radially symmetric park it can never be met: the ten attractions ring the
 * middle, so from the gate almost every bearing has a ride somewhere along it,
 * and the search rejected the whole park. It threw rather than choosing badly,
 * which was the right behaviour and the signal to change the rule.
 *
 * The plan answers the question the search was asking. Every ride is entered
 * at one place — the gateway where its radial path meets its platform — and
 * that is where a board belongs: you read it as you walk in, at the moment you
 * need to know which ride this is. So the position is CONSTRUCTED, one step to
 * the side of the gateway, and it is identical on all ten plots, which is
 * exactly the symmetry the rest of the plan is built on.
 *
 * The clearance is still MEASURED and still reported, so a board that ended up
 * somewhere silly would still be visible in the checks.
 */
export const SIGN_SIDE_OFFSET = RADIAL_PATH_WIDTH / 2 + SIGN_HALF_WIDTH + 5;

function signOnPlot(rideId: string): { position: [number, number]; facing: number; clearance: number } {
  const entrance = rideEntrance(rideId as RingRideId);
  const bearing = (RIDE_SLOT_BEARING[rideId as RingRideId] * Math.PI) / 180;
  /* Perpendicular to the radial, so the board stands beside the gateway
     rather than in the middle of the way in. */
  const px = Math.cos(bearing);
  const pz = -Math.sin(bearing);
  const position: [number, number] = [
    entrance[0] + px * SIGN_SIDE_OFFSET,
    entrance[1] + pz * SIGN_SIDE_OFFSET,
  ];
  return {
    position,
    /* Facing back down its own radial path, which is the way you arrive. */
    facing: Math.atan2(PARK_ORIGIN[0] - position[0], PARK_ORIGIN[1] - position[1]),
    clearance: clearanceAt(position[0], position[1]),
  };
}

function solve(rideId: DepartmentRideId): RideSign {
  const { position, facing, clearance } = signOnPlot(rideId);
  const dept = RIDE_DEPARTMENTS.find((d) => d.rideId === rideId)!;
  return {
    rideId,
    department: dept.department,
    departments: dept.departments,
    rideName: dept.rideName,
    position,
    facing,
    clearance,
  };
}

export const RIDE_SIGNS: RideSign[] = RIDE_DEPARTMENTS.map((d) => solve(d.rideId));

/* ------------------------------------------------------------------ *
 * THE PARK TRAIN'S TEAM SIGN
 * ------------------------------------------------------------------ */

/**
 * The same board, for a ride that has no footprint.
 *
 * The five department signs are placed by offsetting sideways from their
 * ride's bounding box. The train has no box — its track is a 200 m ring around
 * the whole property — so the search runs along the rails instead: every point
 * of the curve, pushed OUTWARD from the loop's centre, which is the only side
 * where a sign is not standing inside the park it is meant to be labelling.
 *
 * Everything else is the existing constraint set unchanged: the board must
 * clear every ride, the plaza, the food court, the gate apron and every lane
 * an employee walks, and from the main gate it must not cover any of the five
 * silhouettes the layout was solved to keep separate. The one difference is
 * that the rails are measured rather than avoided — a sign for the railway
 * wants to be NEXT to the railway — so the track distance is required to clear
 * MIN_SIGN_CLEARANCE and is then minimised rather than maximised.
 */
export interface TeamSign extends Omit<RideSign, "rideId"> {
  rideId: ChairsTeamId | LooperRideId | TeacupsRideId | DumboRideId;
}

/**
 * THE PARK TRAIN'S BOARD IS GONE, with the train.
 *
 * There was a long section here that placed a signboard for the railway: it
 * walked the track, pushed out past the rails on the loop's own outward
 * normal, and took the nearest spot that cleared everything — a board for a
 * railway wants to be NEXT to the railway, so the track distance was minimised
 * rather than maximised, which was the opposite of every other sign in the
 * park and the reason the section existed at all.
 *
 * The train, its track and its route have been removed at the user's request,
 * so the board went with them. The team it carried, DevOps, had no other home
 * in the park and is not shown anywhere now; giving it to another ride would
 * be a decision nobody asked for.
 */

/* ------------------------------------------------------------------ *
 * THE FLYING CHAIRS' TEAM SIGN
 * ------------------------------------------------------------------ */

/**
 * The Flying Chairs stand behind the sky tower and are signed "IT Support".
 *
 * They are a real object with a centre and a reach, so their board is placed
 * the way the five ride signs are — offset sideways from the gate-facing axis,
 * out past the ride, taking the closest spot that is still comfortably clear.
 *
 * The search is written out here rather than sharing `solve()` above, because
 * `solve()` reads its subject from `PARK_LAYOUT` and this ride is deliberately
 * not in it. Duplicating the search is the price of leaving the five existing
 * signs provably untouched: verify-departments.ts records their solved
 * positions and asserts none of them moved when this one was added.
 *
 * One term is added that `solve()` does not need: the ride's own swept circle.
 * `clearanceAt` measures against the park layout, which does not contain the
 * Flying Chairs, so without it a board could be placed underneath the chairs.
 */
/**
 * The Flying Chairs' team board, by exactly the same rule as the department
 * ones: beside its own gateway, on its own plot. It used to run a ring search
 * outward from the ride, and it fell to the same thing — on a full ring there
 * is no bearing from the gate that covers nothing.
 */
function solveChairsSign(): TeamSign {
  const { position, facing, clearance } = signOnPlot(CHAIRS_TEAM_ID);
  return {
    rideId: CHAIRS_TEAM_ID,
    department: CHAIRS_TEAM_NAME,
    departments: [CHAIRS_TEAM_NAME],
    rideName: CHAIRS_RIDE_NAME,
    position,
    facing,
    clearance,
  };
}

export const CHAIRS_SIGN: TeamSign = solveChairsSign();


/** Every team board that is not one of the five department signs. */
export const TEAM_SIGNS: TeamSign[] = [CHAIRS_SIGN];
