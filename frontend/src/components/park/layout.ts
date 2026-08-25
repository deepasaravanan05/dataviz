import { WHEEL_RADIUS as FERRIS_R, BASE_WIDTH } from "@/components/ferris-wheel/constants";
import { COASTER_ORIGIN } from "@/components/roller-coaster/constants";
import { MONSTER_ORIGIN, RIDE_REACH as MONSTER_REACH } from "@/components/monster-ride/constants";
import { DRAGON_ORIGIN, FOOT_SPREAD_X } from "@/components/dragon-ride/constants";
import { PARK_SCALE, TOWER_SHIFT_X } from "./parkScale";

/**
 * Park layout and placement validation.
 *
 * Every ride must occupy its own clear visual zone: no two footprints may
 * overlap, and — just as importantly — no ride may sit on the sightline of
 * another from the park's main viewpoint, or it would hide behind the one in
 * front no matter how far apart they are on the ground.
 *
 * This module owns both rules. It declares each ride's real footprint (derived
 * from that ride's own constants, never re-typed), places them on a radial fan
 * of distinct bearings and distances from the entrance, then runs a
 * deterministic relaxation pass that pushes apart anything still too close.
 * The scene reads the result; nothing inside any ride module changes.
 */

/** Minimum clear ground between any two ride footprints, in world units. */
export const MIN_RIDE_SPACING = 30;

/** Minimum angular gap between two rides as seen from MAIN_VIEWPOINT, in degrees. */
export const MIN_SIGHTLINE_SEPARATION_DEG = 2.5;

/**
 * Where a guest stands coming in the main gate. Sightlines are judged from
 * here, and the ride fan is laid out around it.
 */
export const MAIN_VIEWPOINT: [number, number] = [70, 620];

/** The plaza the rides are arranged around, and the path back to the gate. */
export const PLAZA_CENTER: [number, number] = [70, 150];
export const PLAZA_RADIUS = 34;

/**
 * The central water feature: a circular multi-tier fountain in the middle of
 * the plaza. THE CENTRE OF THE PARK HOLDS NO RIDE — the fountain is the
 * landmark, and every walking route bends around it. The detour radius is
 * where the walkers' arc actually runs: outside the basins with human margin,
 * still well inside the paved plaza circle.
 */
export const FOUNTAIN_CENTER: [number, number] = PLAZA_CENTER;
export const FOUNTAIN_RADIUS = 14;
/** No route sample or standing point may come closer to the centre than this. */
export const FOUNTAIN_CLEARANCE = 20;
/** Radius of the walking arc routes follow around the fountain. */
export const FOUNTAIN_DETOUR_RADIUS = 22;
export const WALKWAY_WIDTH = 14;
export const WALKWAY_FROM_Z = 184;
export const WALKWAY_TO_Z = 400;

/** What every viewpoint looks at; the middle of the ride ring. */
export const PARK_CENTER: [number, number] = [52, 110];

const S = PARK_SCALE;

export interface RideFootprint {
  id: string;
  label: string;
  /** Half-extents of the ride's ground footprint, at final rendered scale. */
  halfX: number;
  halfZ: number;
  /**
   * Silhouette height at final rendered scale. Derived from the ride's own
   * unscaled height so it tracks PARK_SCALE instead of going stale the moment
   * the park is enlarged.
   */
  height: number;
  /**
   * Where the ride renders with no layout offset applied — its authored origin
   * multiplied by the park scale. Rides outside the scaled group have their
   * anchor at the origin, because their position is set directly.
   */
  anchor: [number, number];
  /** Desired centre in the fan, before validation. */
  desired: [number, number];
}

const ferrisReach = Math.max(FERRIS_R, BASE_WIDTH / 2);
/** The coaster's authored footprint is not centred on its origin. */
const COASTER_BOX_CENTER_X = COASTER_ORIGIN[0] + 2;
/** Nor is the dragon's, because its boarding platform hangs off one side. */
const DRAGON_BOX_CENTER_Z = DRAGON_ORIGIN[2] + (FOOT_SPREAD_X - 19.5) / 2;

/**
 * The ride fan.
 *
 * Every attraction gets its own bearing from the main gate and its own depth,
 * so from the entrance they spread left-to-right across the frame instead of
 * stacking up behind one another. The widest ride (the coaster) sits furthest
 * back, where it subtends the smallest angle for its size.
 *
 *   FERRIS      DRAGON        COASTER        MONSTER       TOWER
 *    -25deg      -11deg         0deg          +16deg       +27deg
 *   (bearings measured from the main gate; see the printed table below)
 *
 * Depth (Z) is staggered as well, so no two rides sit on one line — which is
 * what keeps them separable from the side views too.
 *
 * Note a geometric fact worth being explicit about: for ANY flat arrangement
 * of five objects there is some compass direction along which two of them line
 * up. Perfect angular separation from literally every angle is impossible.
 * What IS guaranteed here is that the rides are angularly separated across the
 * whole family of entrance/overview viewpoints, and that from any other angle
 * a ride behind another still clears it, because the rides differ in height and
 * the camera looks down on the park. verify-park-layout.ts checks both.
 */
const RIDES: RideFootprint[] = [
  {
    id: "ferris",
    label: "Ferris Wheel",
    halfX: ferrisReach * S,
    halfZ: ferrisReach * S,
    height: 29.5 * S,
    anchor: [0, 0],
    desired: [-165, 250],
  },
  {
    id: "dragon",
    label: "Dragon Ride",
    halfX: 26.5 * S,
    halfZ: ((19.5 + FOOT_SPREAD_X) / 2) * S,
    height: 34.0 * S,
    anchor: [DRAGON_ORIGIN[0] * S, DRAGON_BOX_CENTER_Z * S],
    desired: [-72.3, 117.7],
  },
  {
    id: "coaster",
    label: "Roller Coaster",
    halfX: 32 * S,
    halfZ: 24 * S,
    height: 25.6 * S,
    anchor: [COASTER_BOX_CENTER_X * S, 0],
    desired: [70, -10],
  },
  {
    id: "monster",
    label: "Monster Ride",
    halfX: MONSTER_REACH * S,
    halfZ: MONSTER_REACH * S,
    height: 13.0 * S,
    anchor: [MONSTER_ORIGIN[0] * S, MONSTER_ORIGIN[2] * S],
    desired: [205, 90],
  },
  {
    id: "tower",
    label: "Drop Tower",
    // The Drop Tower is the one ride that is NOT scaled, so its footprint is
    // its own RIDE_REACH exactly. Kept as a literal to avoid an import cycle
    // (drop-tower/constants reads its origin back out of this module);
    // verify-park-layout.ts asserts the two stay equal.
    halfX: 12,
    halfZ: 12,
    // Mirrors drop-tower/constants TOWER_HEIGHT. Kept as a literal to avoid an
    // import cycle (that module reads TOWER_CENTER back out of this one);
    // verify-park-layout.ts asserts the two stay equal.
    height: 105,
    anchor: [0, 0],
    desired: [270 + TOWER_SHIFT_X, 280],
  },
];

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

/**
 * Placement validation: if any pair is closer than MIN_RIDE_SPACING, push both
 * apart along whichever axis needs the least movement, and repeat until the
 * whole set is clear. Deterministic, and a no-op when the declared fan is
 * already valid — it exists so that changing a ride's size can never silently
 * produce an overlap.
 */
function resolveOverlaps(rides: RideFootprint[]): PlacedRide[] {
  const centers = rides.map((r) => [...r.desired] as [number, number]);

  for (let pass = 0; pass < 200; pass++) {
    let worst = 0;

    for (let i = 0; i < rides.length; i++) {
      for (let j = i + 1; j < rides.length; j++) {
        const a = place(rides[i], centers[i]);
        const b = place(rides[j], centers[j]);
        const gap = footprintGap(a, b);
        if (gap >= MIN_RIDE_SPACING) continue;

        const deficit = MIN_RIDE_SPACING - gap;
        worst = Math.max(worst, deficit);

        // Separate along the axis where the centres are already furthest apart,
        // so rides slide sideways rather than swapping places.
        const dxc = centers[j][0] - centers[i][0];
        const dzc = centers[j][1] - centers[i][1];
        const useX = Math.abs(dxc) >= Math.abs(dzc);
        const step = deficit / 2 + 0.01;

        if (useX) {
          const dir = dxc >= 0 ? 1 : -1;
          centers[i][0] -= dir * step;
          centers[j][0] += dir * step;
        } else {
          const dir = dzc >= 0 ? 1 : -1;
          centers[i][1] -= dir * step;
          centers[j][1] += dir * step;
        }
      }
    }

    if (worst === 0) break;
  }

  return rides.map((r, i) => place(r, centers[i]));
}

export const PARK_LAYOUT: PlacedRide[] = resolveOverlaps(RIDES);

export function rideById(id: string): PlacedRide {
  const r = PARK_LAYOUT.find((p) => p.id === id);
  if (!r) throw new Error(`Unknown ride in park layout: ${id}`);
  return r;
}

/**
 * The Drop Tower's final centre. It is not inside the scaled group, so it
 * positions itself directly from this rather than from an offset.
 */
export const TOWER_CENTER: [number, number] = rideById("tower").center;

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
 * is correct from any side of the park. An earlier version assumed the camera
 * always faced -Z, which silently reported the side views as clear when the
 * rides were in fact lined up behind one another.
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
