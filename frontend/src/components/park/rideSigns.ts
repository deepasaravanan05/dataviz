import { RIDE_DEPARTMENTS, type DepartmentRideId } from "./departments";
import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  rideById,
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
import { TRACK_CURVE } from "@/components/park-train/trainTrack";
import { TRACK_CENTER } from "@/components/park-train/constants";
import { TRAIN_RIDE_NAME, TRAIN_TEAM_ID, TRAIN_TEAM_NAME, type TrainTeamId } from "./trainTeam";
import {
  CHAIRS_RIDE_NAME,
  CHAIRS_TEAM_ID,
  CHAIRS_TEAM_NAME,
  OVERALL_REACH as CHAIRS_REACH,
  RIDE_CENTER as CHAIRS_CENTER,
  type ChairsTeamId,
} from "@/components/flying-chairs/constants";
import { TRAIN_SCALE } from "./parkScale";
import { TRACK_HALF_WIDTH_METRES } from "@/components/park-train/constants";
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
 * boxes, `TRACK_CURVE` for the rails, the journey routes for the walking lanes
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

const trackPoints: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 600; i++) {
    const p = TRACK_CURVE.getPointAt(i / 600);
    pts.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
  }
  return pts;
})();

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

  for (const [px, pz] of trackPoints) {
    m = Math.min(m, Math.hypot(x - px, z - pz));
    if (m < MIN_SIGN_CLEARANCE) return m;
  }

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

function solve(rideId: DepartmentRideId): RideSign {
  const ride = rideById(rideId);
  const [cx, cz] = ride.center;

  // The gate-facing axis, and the perpendicular the sign is offset along. The
  // gate-facing axis itself is where the arriving crowd stands, so the sign
  // goes to one side of it rather than in front.
  const ax = GATE_X - cx;
  const az = GATE_Z - cz;
  const al = Math.hypot(ax, az) || 1;
  const ux = ax / al;
  const uz = az / al;
  const px = -uz;
  const pz = ux;

  const reach = Math.max(ride.halfX, ride.halfZ);

  let best: { position: [number, number]; clearance: number; score: number } | null = null;

  /*
   * THE SEARCH HAD TO WIDEN WHEN THE RIDES DID.
   *
   * It used to run to sixty metres out and forty along, which was ample beside
   * a ride sixty metres wide. Every ride in the park is now built to one common
   * height, so the Monster Ride's footprint has doubled and the Roller
   * Coaster's is two hundred and seventy metres across — and at those sizes the
   * old window fell entirely inside the crowd, the walking lanes and the
   * neighbouring rides, and the coaster's board had nowhere to stand. The
   * window is measured from the ride's own reach, so it grows with the ride;
   * what changed is how far past it the search is allowed to look.
   */
  for (const side of [1, -1]) {
    for (let out = reach + 8; out <= reach + 150; out += 2) {
      for (let along = -60; along <= 80; along += 5) {
        const x = cx + px * side * out + ux * along;
        const z = cz + pz * side * out + uz * along;

        if (hidesAnotherRide(x, z, rideId)) continue;
        const clearance = clearanceAt(x, z);
        if (clearance < MIN_SIGN_CLEARANCE) continue;

        /*
         * Proximity dominates. A sign is only useful if you can tell WHICH
         * ride it labels, so the search takes the closest offset that is still
         * comfortably clear rather than the roomiest spot in the park — hence
         * the cap on how much extra clearance can buy.
         */
        const score = Math.min(clearance, 26) * 0.8 - out + along * 0.15;
        if (!best || score > best.score) best = { position: [x, z], clearance, score };
      }
    }
  }

  if (!best) {
    throw new Error(
      `No clear spot for the ${rideId} department sign. Widen the search in rideSigns.ts, ` +
        `or reduce SIGN_HALF_WIDTH — do not place it by hand.`,
    );
  }

  const dept = RIDE_DEPARTMENTS.find((d) => d.rideId === rideId)!;
  return {
    rideId,
    department: dept.department,
    departments: dept.departments,
    rideName: dept.rideName,
    position: best.position,
    // Square on to the main gate, so it reads from the arrival view.
    facing: Math.atan2(GATE_X - best.position[0], GATE_Z - best.position[1]),
    clearance: best.clearance,
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
  rideId: TrainTeamId | ChairsTeamId | LooperRideId | TeacupsRideId | DumboRideId;
}

/** The loop's centre in world units — the axis the sign is pushed out along. */
const TRACK_CENTER_WORLD: [number, number] = [
  TRACK_CENTER[0] * TRAIN_SCALE,
  TRACK_CENTER[1] * TRAIN_SCALE,
];

/**
 * How far off the railway's CENTRE LINE the train's signboard has to stand.
 *
 * `MIN_SIGN_CLEARANCE` is a clearance from the thing itself, and for every
 * other sign in the park the thing is a ride with a footprint. The railway had
 * no footprint here — the board was placed 6 m from the centre line, which put
 * it between the rails even at the old gauge and would have buried it once the
 * track was widened by ten metres. Measuring from the sleeper ends instead
 * gives the same 6 m of clear ground every other sign gets.
 */
const MIN_RAIL_CLEARANCE = TRACK_HALF_WIDTH_METRES + MIN_SIGN_CLEARANCE;

function trackDistance(x: number, z: number): number {
  let m = Infinity;
  for (const [px, pz] of trackPoints) m = Math.min(m, Math.hypot(x - px, z - pz));
  return m;
}

/**
 * Clearance to everything EXCEPT the rails.
 *
 * `clearanceAt` above folds the track into the same minimum, which is right
 * for a ride whose sign must stay away from the railway and wrong for the
 * railway's own. The obstacle set is otherwise identical, and it is written
 * out rather than shared so the five existing signs keep their exact solved
 * positions — this function cannot move them.
 */
function clearanceIgnoringTrack(x: number, z: number): number {
  let m = Infinity;
  for (const r of PARK_LAYOUT) m = Math.min(m, boxDistance(x, z, r));

  m = Math.min(m, Math.abs(Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) - PLAZA_RADIUS));

  const fcx = Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0);
  const fcz = Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0);
  m = Math.min(m, Math.hypot(fcx, fcz));
  const gx = Math.max(Math.abs(x - GATE_X) - GATE_OPENING, 0);
  const gz = Math.max(Math.abs(z - GATE_Z) - 40, 0);
  m = Math.min(m, Math.hypot(gx, gz));

  for (const seg of WALK_SEGMENTS) {
    m = Math.min(m, segmentDistance(x, z, seg));
    if (m < MIN_SIGN_CLEARANCE) return m;
  }
  return m;
}

function solveTrainSign(): TeamSign {
  let best: { position: [number, number]; clearance: number; score: number } | null = null;

  for (const [px, pz] of trackPoints) {
    const nx = px - TRACK_CENTER_WORLD[0];
    const nz = pz - TRACK_CENTER_WORLD[1];
    const nl = Math.hypot(nx, nz) || 1;

    for (let out = MIN_RAIL_CLEARANCE; out <= MIN_RAIL_CLEARANCE + 40; out += 1) {
      const x = px + (nx / nl) * out;
      const z = pz + (nz / nl) * out;

      if (hidesAnotherRide(x, z, TRAIN_TEAM_ID)) continue;

      const rails = trackDistance(x, z);
      if (rails < MIN_RAIL_CLEARANCE) continue;
      const clearance = Math.min(clearanceIgnoringTrack(x, z), rails);
      if (clearance < MIN_SIGN_CLEARANCE) continue;

      /*
       * Same shape as the ride signs' score — proximity dominates, extra
       * clearance stops paying past 26 m — with `rails` standing in for the
       * sideways offset, plus a mild pull towards the gate so the board is on
       * a stretch of railway an arriving visitor is actually looking at.
       */
      const gate = Math.hypot(x - GATE_X, z - GATE_Z);
      const score = Math.min(clearance, 26) * 0.8 - rails - gate * 0.06;
      if (!best || score > best.score) best = { position: [x, z], clearance, score };
    }
  }

  if (!best) {
    throw new Error(
      "No clear spot beside the railway for the Park Train's team sign. Widen the outward " +
        "sweep in rideSigns.ts, or reduce SIGN_HALF_WIDTH — do not place it by hand.",
    );
  }

  return {
    rideId: TRAIN_TEAM_ID,
    department: TRAIN_TEAM_NAME,
    departments: [TRAIN_TEAM_NAME],
    rideName: TRAIN_RIDE_NAME,
    position: best.position,
    facing: Math.atan2(GATE_X - best.position[0], GATE_Z - best.position[1]),
    clearance: best.clearance,
  };
}

export const TRAIN_SIGN: TeamSign = solveTrainSign();

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
function solveChairsSign(): TeamSign {
  const [cx, cz] = CHAIRS_CENTER;

  const ax = GATE_X - cx;
  const az = GATE_Z - cz;
  const al = Math.hypot(ax, az) || 1;
  const ux = ax / al;
  const uz = az / al;
  const px = -uz;
  const pz = ux;

  let best: { position: [number, number]; clearance: number; score: number } | null = null;

  /*
   * A RING SEARCH, for the same reason the other team boards use one: the
   * rectangle beside the ride ran out of park. Every ride is built to one
   * common height now, this one's swept circle is half as wide again, and it
   * stands three hundred metres behind a food court that has itself been left
   * behind by the enlarged fan — there is no ground in that old window that
   * clears the neighbours and the walking lanes at once.
   *
   * The preference is unchanged: nearest wins, and among equals a board beside
   * the ride beats one dead in front of the arriving crowd.
   */
  for (let out = CHAIRS_REACH + 8; out <= CHAIRS_REACH + 400; out += 3) {
    for (let step = 0; step < 72; step += 1) {
      const bearing = (step * Math.PI * 2) / 72;
      const x = cx + Math.cos(bearing) * out;
      const z = cz + Math.sin(bearing) * out;

      if (hidesAnotherRide(x, z, CHAIRS_TEAM_ID)) continue;

      /* Its own ride is an obstacle too — a sign stands beside a ride, not
         under it — and the park layout knows nothing about this one. */
      const ownRide = Math.hypot(x - cx, z - cz) - CHAIRS_REACH;
      const clearance = Math.min(clearanceAt(x, z), ownRide);
      if (clearance < MIN_SIGN_CLEARANCE) continue;

      const sideways = Math.abs(Math.cos(bearing) * px + Math.sin(bearing) * pz);
      const score = Math.min(clearance, 26) * 0.8 - out + sideways * 20;
      if (!best || score > best.score) best = { position: [x, z], clearance, score };
    }
    if (best) break;
  }

  if (!best) {
    throw new Error(
      "No clear spot for the Flying Chairs' team sign. Widen the search in rideSigns.ts, " +
        "or reduce SIGN_HALF_WIDTH — do not place it by hand.",
    );
  }

  return {
    rideId: CHAIRS_TEAM_ID,
    department: CHAIRS_TEAM_NAME,
    departments: [CHAIRS_TEAM_NAME],
    rideName: CHAIRS_RIDE_NAME,
    position: best.position,
    facing: Math.atan2(GATE_X - best.position[0], GATE_Z - best.position[1]),
    clearance: best.clearance,
  };
}

export const CHAIRS_SIGN: TeamSign = solveChairsSign();

/** Every team board that is not one of the five department signs. */
export const TEAM_SIGNS: TeamSign[] = [TRAIN_SIGN, CHAIRS_SIGN];
