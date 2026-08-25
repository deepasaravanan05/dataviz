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
import { TRAIN_SCALE } from "./parkScale";
import { SIGN } from "@/world/scale";

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
function clearanceAt(x: number, z: number): number {
  let m = Infinity;
  for (const r of PARK_LAYOUT) m = Math.min(m, boxDistance(x, z, r));

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
function hidesAnotherRide(x: number, z: number, ownId: string): boolean {
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

  for (const side of [1, -1]) {
    for (let out = reach + 8; out <= reach + 60; out += 1.5) {
      for (let along = -30; along <= 40; along += 5) {
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
