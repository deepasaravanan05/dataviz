import {
  FOOD_COURT_PATH_RADIUS,
  FOOD_COURT_PLAZA_RADIUS,
  GATE_RADIUS,
  LAKE_CLEARANCE_RADIUS,
  PARK_ORIGIN,
  PLOT_GAP,
  RIDE_PLOT_RADIUS,
  RIDE_RING_CENTER,
  ringPoint,
  type RingRideId,
} from "./parkRing";
import { RIDE_FOOTPRINTS, type RideFootprint } from "./rideFootprints";

export { RIDE_SCALE, RIDE_TARGET, RIDE_WIDTH_GROWTH, rideScale } from "./rideFootprints";
export type { RideFootprint } from "./rideFootprints";

/**
 * WHERE THE FIVE DEPARTMENT RIDES STAND.
 *
 * The park is a ring now (see `parkRing.ts`), so this file no longer SOLVES
 * anything: the structure module owns every position in the park, department
 * ride or not, and this places the five footprints it is responsible for on
 * the slots it was given. What is left here is what the rest of the project
 * reads out of the layout — the placed boxes, the offsets the scene applies,
 * and the sightline arithmetic the cameras and the signage still use.
 *
 * WHAT WENT: the ride fan and the two solvers that maintained it. The old plan
 * spread the rides across bearings from the main gate and pushed them apart
 * until no silhouette overlapped another from the entrance. A concentric park
 * cannot keep that property and is not meant to — half its attractions are on
 * the far side of the lake, behind the near half by construction — so the
 * separation rule the park now keeps is the one it can: clear GROUND between
 * neighbouring attractions, checked in `verify-park-layout.ts` around the
 * whole ring rather than in one view.
 */

/** Minimum clear ground between any two attractions. Owned by the ring. */
export const MIN_RIDE_SPACING = PLOT_GAP;

/**
 * Where a guest stands coming in the main gate. Camera framing and the
 * sightline reports below are measured from here.
 */
export const MAIN_VIEWPOINT: [number, number] = ringPoint(0, GATE_RADIUS - 60);

/** What every viewpoint looks at: the middle of the park, which is the lake. */
export const PARK_CENTER: [number, number] = [...PARK_ORIGIN] as [number, number];

/**
 * The plaza is now the GRAND FOOD COURT'S OWN PLAZA — the paved circle the
 * pavilion, the stalls, the colonnade and the seating all stand on. It keeps
 * its old name because half the park reads `PLAZA_CENTER` / `PLAZA_RADIUS` to
 * mean "the paved ground in the middle", which is still exactly what it is;
 * what stands on that ground has changed from a fountain to a lake to a food
 * court, and the name has outlived all three.
 */
export const PLAZA_CENTER: [number, number] = [...PARK_ORIGIN] as [number, number];
export const PLAZA_RADIUS = FOOD_COURT_PLAZA_RADIUS;

/**
 * THE MIDDLE OF THE PARK — the thing every route bends around.
 *
 * It has been a fountain, then a lake with a waterfall, and it is now the
 * grand food court. The names below are the fountain's and they have been kept
 * through both changes, because the journey's detour logic, the planting
 * keep-outs and the checks all read them to mean one thing: "the middle, which
 * you walk AROUND rather than through". That has been true of all three.
 *
 * The DETOUR radius is the food court's own circular path. A walker crossing
 * from one ride to another goes out to that path and round it, which is both
 * the shortest way in a radial park and the way the plan is built to be
 * walked.
 */
export const FOUNTAIN_CENTER: [number, number] = [...PARK_ORIGIN] as [number, number];
export const FOUNTAIN_RADIUS = FOOD_COURT_PLAZA_RADIUS;
/** No route sample or standing point may come closer to the centre than this. */
export const FOUNTAIN_CLEARANCE = LAKE_CLEARANCE_RADIUS;
/** Radius of the walking arc routes follow around the food court. */
export const FOUNTAIN_DETOUR_RADIUS = FOOD_COURT_PATH_RADIUS;

export const WALKWAY_WIDTH = 14;

/** The circular platform every ride stands on. Identical for all of them. */
export const RIDE_PLATFORM_RADIUS = RIDE_PLOT_RADIUS;

/** Gap between two axis-aligned footprints; negative means they overlap. */
export function footprintGap(a: PlacedRide, b: PlacedRide): number {
  const dx = Math.max(b.minX - a.maxX, a.minX - b.maxX);
  const dz = Math.max(b.minZ - a.maxZ, a.minZ - b.maxZ);
  if (dx >= 0 && dz >= 0) return Math.hypot(dx, dz);
  return Math.max(dx, dz);
}

export interface PlacedRide extends RideFootprint {
  center: [number, number];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Translation the scene applies to move the ride from `anchor` to `center`. */
  offset: [number, number];
}

function place(r: RideFootprint, center: [number, number]): PlacedRide {
  return {
    ...r,
    center,
    minX: center[0] - r.halfX,
    maxX: center[0] + r.halfX,
    minZ: center[1] - r.halfZ,
    maxZ: center[1] + r.halfZ,
    offset: [center[0] - r.anchor[0], center[1] - r.anchor[1]],
  };
}

export const PARK_LAYOUT: PlacedRide[] = RIDE_FOOTPRINTS.map((r) =>
  place(r, RIDE_RING_CENTER[r.id as RingRideId]),
);

export function rideById(id: string): PlacedRide {
  const r = PARK_LAYOUT.find((p) => p.id === id);
  if (!r) throw new Error(`Unknown ride in park layout: ${id}`);
  return r;
}

/** Layout offset the scene applies to a ride, as an R3F position triple. */
export function offsetFor(id: string): [number, number, number] {
  const { offset } = rideById(id);
  return [offset[0], 0, offset[1]];
}

export interface ViewAngle {
  id: string;
  label: string;
  height: number;
  /** Signed angle off the view axis, in degrees. */
  bearingDeg: number;
  /** Half the angle the ride subtends from this viewpoint. */
  halfWidthDeg: number;
  distance: number;
}

/**
 * Where each ride falls in the frame from an arbitrary viewpoint.
 *
 * The angle is measured off the axis from the viewpoint to `lookAt`, so this
 * is correct from any side of the park. Still used by the camera framing and
 * by the signage, which needs to know which way a board is being read from;
 * it is no longer used to PLACE anything.
 */
export function viewAngles(
  view: readonly [number, number],
  lookAt: readonly [number, number] = PARK_CENTER,
  rides: PlacedRide[] = PARK_LAYOUT,
): ViewAngle[] {
  const fx = lookAt[0] - view[0];
  const fz = lookAt[1] - view[1];
  const flen = Math.hypot(fx, fz) || 1;
  const ux = fx / flen;
  const uz = fz / flen;

  return rides.map((r) => {
    const dx = r.center[0] - view[0];
    const dz = r.center[1] - view[1];
    const distance = Math.hypot(dx, dz) || 1;
    const along = dx * ux + dz * uz;
    const across = ux * dz - uz * dx;
    return {
      id: r.id,
      label: r.label,
      height: r.height,
      bearingDeg: (Math.atan2(across, along) * 180) / Math.PI,
      halfWidthDeg: (Math.atan(Math.max(r.halfX, r.halfZ) / distance) * 180) / Math.PI,
      distance,
    };
  });
}

/** Angular gap between the two closest silhouettes from a viewpoint. */
export function tightestSightline(
  view: readonly [number, number],
  lookAt: readonly [number, number] = PARK_CENTER,
): { separationDeg: number; pair: string } {
  const angles = viewAngles(view, lookAt);
  let separationDeg = Infinity;
  let pair = "";
  for (let i = 0; i < angles.length; i++) {
    for (let j = i + 1; j < angles.length; j++) {
      const sep =
        Math.abs(angles[i].bearingDeg - angles[j].bearingDeg) -
        (angles[i].halfWidthDeg + angles[j].halfWidthDeg);
      if (sep < separationDeg) {
        separationDeg = sep;
        pair = `${angles[i].label} / ${angles[j].label}`;
      }
    }
  }
  return { separationDeg, pair };
}

/** Bearing and angular half-width from the main entrance viewpoint. */
export function sightline(r: PlacedRide): ViewAngle {
  return viewAngles(MAIN_VIEWPOINT, PARK_CENTER, [r])[0];
}
