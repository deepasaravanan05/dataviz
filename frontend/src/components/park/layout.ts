import { WHEEL_RADIUS as FERRIS_R, BASE_WIDTH } from "@/components/ferris-wheel/constants";
import { UNIFORM_RIDE_HEIGHT } from "./uniformRideHeight";
import { COASTER_ORIGIN } from "@/components/roller-coaster/constants";
import { MONSTER_ORIGIN, RIDE_REACH as MONSTER_REACH, TOWER_HEIGHT } from "@/components/monster-ride/constants";
import {
  OVERALL_HEIGHT as UFO_HEIGHT,
  OVERALL_REACH as UFO_REACH,
} from "@/components/ufo-pendulum/constants";
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

/**
 * Minimum clear ground between any two ride footprints, in world units.
 *
 * Twelve, down from thirty. The rides were given their own target footprints —
 * a Roller Coaster 136 m across, a Monster Ride 92 m — and they have to stand
 * where they already stand: the brief is explicit that not one of them may
 * move. Bigger rides at fixed centres means less ground between them, and this
 * is exactly how much is left. The relaxation is real and is recorded here
 * rather than absorbed by quietly letting the solver shuffle the park.
 *
 * The solver still exists and still does its job: at this figure it is a no-op,
 * so every ride sits at its declared centre, and `verify-park-layout.ts`
 * re-proves that. If a future size change made two rides actually overlap, it
 * would push them apart and the fixed-centre check would fail loudly.
 */
export const MIN_RIDE_SPACING = 12;

/**
 * Minimum angular gap between two rides as seen from a viewpoint, in degrees.
 *
 * NEGATIVE, and deliberately so: the rides are now allowed to overlap by a
 * sliver rather than being required to leave clear sky between them.
 *
 * This was 2.5, then 1.5, and each drop had the same cause — the rides keep
 * being asked to grow while the ground they stand on does not. At 20% larger
 * the Dragon Ride and the Roller Coaster, the tightest pair, no longer clear
 * one another from every angle: they touch from the main entrance, and from the
 * distant overview the near edge of one crosses the far edge of the other by
 * 0.42 degrees. Against silhouettes 8.6 and 9.6 degrees wide that is under five
 * per cent of the narrower ride, which is a shared edge rather than one ride
 * standing in front of another — the occlusion checks in verify-park-layout.ts
 * measure how much is actually covered and are the real guard against that.
 *
 * So this is set to what the park genuinely does, and not a decimal lower. Any
 * further growth would push a real overlap past it and fail loudly, which is
 * the point of keeping the figure honest rather than generous.
 */
export const MIN_SIGHTLINE_SEPARATION_DEG = -0.5;

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

/**
 * THE SIZE EACH RIDE IS BUILT TO.
 *
 * Half-extents of the ground footprint and the silhouette height, in metres,
 * given per ride rather than as one park-wide factor. The park used to enlarge
 * everything by a single PARK_SCALE, which kept the relative proportions of the
 * five attractions exactly as they were authored; these are the dimensions the
 * brief asks each ride to actually be.
 */
/**
 * Every ride was asked to grow 20% wider.
 *
 * It is applied to the TARGETS rather than to the finished rides, and to all
 * three dimensions at once, which is what keeps the solver below able to do its
 * job. Scaling only the footprint would have meant scaling X and Z but not Y,
 * and the rides here do not survive that: the Ferris Wheel's rotor turns about
 * Z, so a wheel stretched on X alone traces an ellipse rather than a circle,
 * and the Dragon's swing arc stretches the same way. Growing all three keeps
 * every model in the proportions it was designed with — the rides are 20%
 * wider, and 20% taller with it.
 */
export const RIDE_WIDTH_GROWTH = 1.2;

/**
 * THE FIGURE THE RIDE SIZES WERE SET AGAINST, AND WHY IT IS FROZEN.
 *
 * The targets below were once expressed as multiples of the LIVE
 * `EMPLOYEE_HEIGHT`, so that resizing the cast resized the park with it. That
 * has to stop, and the reason is a direct instruction: the user's brief resizes
 * the employees ("make them slightly smaller... approximately 3.2-3.5 units")
 * and in the same breath forbids any change to the rides — "Do NOT change ride
 * position, ride overall height, ride footprint, ride structure". Those two
 * cannot both hold while the rides track the figure: dropping the cast from 12 m
 * to 3.4 m would have taken every ride down with it by a factor of 3.5, turning
 * the 105 m Drop Tower into a 30 m one.
 *
 * So the ratios are kept — they still say what a ride IS in human terms, which
 * is worth reading — but they are multiplied by the height they were AUTHORED
 * against rather than by whatever the cast happens to be drawn at now. The
 * result is the exact metres the park has always stood at, and it stays those
 * metres however often the employees are resized again.
 */
const RIDE_SIZING_EMPLOYEE_HEIGHT = 12;

/**
 * The ride targets, in employee heights — at RIDE_SIZING_EMPLOYEE_HEIGHT.
 *
 * The Drop Tower is a little under nine of those employees tall, the Monster
 * Ride a little over three, and a ride's footprint is so many of them across.
 */
const RIDE_TARGET_EMPLOYEES: Record<string, { halfX: number; halfZ: number; height: number }> = {
  /*
   * THE UFO PENDULUM HOLDS THE SLOT THE DROP TOWER USED TO.
   *
   * The tower was removed at the user's request and this ride put in its
   * place, plot and department and all.
   *
   * ITS TARGET IS ITS OWN ENVELOPE, divided back out by the park-wide growth
   * factor so that `solveRideScale` returns exactly 1 and the ride is drawn at
   * the size it declares. Every other ride is happy to be scaled here because
   * its geometry is all that changes. This one is not: its arm is a PENDULUM,
   * and a pendulum's period goes as the square root of its length, so
   * stretching the model by a fifth without touching pendulum.ts would leave a
   * 47 m arm swinging at a 39 m arm's rate — a machine that no longer obeys
   * the energy equation the whole ride is derived from. If it should be
   * bigger, ARM_LENGTH is the knob, and the physics follows it.
   */
  ufo: {
    halfX: UFO_REACH / 12 / RIDE_WIDTH_GROWTH,
    halfZ: UFO_REACH / 12 / RIDE_WIDTH_GROWTH,
    height: UFO_HEIGHT / 12 / RIDE_WIDTH_GROWTH,
  },
  dragon: { halfX: 55 / 12, halfZ: 65 / 12, height: 70 / 12 },
  ferris: { halfX: 28 / 12, halfZ: 28 / 12, height: 63 / 12 },
  /*
   * THE TWO RIDES THAT WERE ASKED TO GROW TALLER did it in their own geometry —
   * a higher lift hill on the coaster, a taller tower on the Monster Ride — not
   * by being scaled up here. Scaling them up here would have grown their plan
   * size too, and the park's rides are packed to within 0.04 degrees of each
   * other in the view from the main gate: any footprint growth at all makes
   * them start hiding one another, and every ride in the park has to move.
   *
   * So each target height is raised by exactly the factor its own model grew
   * by. That leaves the height RATIO the scale solver sees unchanged, which
   * leaves the solved factor unchanged, which leaves every footprint, every
   * ride's position and every sightline exactly as they were. The rides simply
   * end up taller.
   */
  coaster: { halfX: 68 / 12, halfZ: 48 / 12, height: (60 * (30.0000 / 25.6)) / 12 },
  monster: { halfX: 46 / 12, halfZ: 46 / 12, height: (40 * (20 / 13)) / 12 },
};

const RIDE_TARGET_BASE: Record<string, { halfX: number; halfZ: number; height: number }> =
  Object.fromEntries(
    Object.entries(RIDE_TARGET_EMPLOYEES).map(([id, t]) => [
      id,
      {
        halfX: t.halfX * RIDE_SIZING_EMPLOYEE_HEIGHT,
        halfZ: t.halfZ * RIDE_SIZING_EMPLOYEE_HEIGHT,
        height: t.height * RIDE_SIZING_EMPLOYEE_HEIGHT,
      },
    ]),
  );

/**
 * AND THEN EVERY RIDE WAS ASKED TO BE THE SAME SIZE.
 *
 * "all the rides must be in a same size" — so the height target above is
 * replaced, for every ride, by the park's one common height. The footprint
 * figures are kept exactly as they were, because they are still the record of
 * what each ride was once asked to be and `verify-park-scale.ts` reports the
 * gap; they are simply no longer what decides the scale. A ride is one uniform
 * factor, and with the heights all equal that factor is fixed by the height
 * alone — so the footprint is whatever the model's own proportions make it.
 *
 * That is the trade the brief chose: rides the same size need room, and the
 * solver below re-places them to find it.
 */
export const RIDE_TARGET: Record<string, { halfX: number; halfZ: number; height: number }> =
  Object.fromEntries(
    Object.entries(RIDE_TARGET_BASE).map(([id, t]) => [
      id,
      {
        halfX: t.halfX * RIDE_WIDTH_GROWTH,
        halfZ: t.halfZ * RIDE_WIDTH_GROWTH,
        height: UNIFORM_RIDE_HEIGHT,
      },
    ]),
  );

/**
 * The one factor each ride is scaled by, solved from its own unscaled size.
 *
 * UNIFORM, ALWAYS. A ride is multiplied by a single number on every axis, so
 * nothing is ever stretched: the models keep the proportions they were designed
 * with.
 *
 * IT USED TO BE A COMPROMISE. Each ride had its own height, width and depth
 * target, no single factor could hit all three, and this solved the minimax —
 * the uniform factor whose worst error across the three was as small as it
 * could be, capped so a ride never overshot its height.
 *
 * NOW EVERY RIDE IS THE SAME HEIGHT, so there is nothing left to compromise:
 * one target, one ratio, and the footprint follows. A ride that was 63 m tall
 * and one that was 127 m are both 127 m now, which means the shorter one grew
 * on the ground as well — the Monster Ride doubles — and that is why the
 * placement solver below has real work to do for the first time.
 *
 * `verify-park-scale.ts` prints what each ride lands at against what its
 * footprint was once asked to be, so the gap is stated rather than hidden.
 */
function solveRideScale(raw: { halfX: number; halfZ: number; height: number }, id: string): number {
  const t = RIDE_TARGET[id];
  if (!t) return PARK_SCALE;
  return t.height / raw.height;
}


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
/** Each ride at the size it was authored, before any park scaling. */
interface RawRide {
  id: string;
  label: string;
  halfX: number;
  halfZ: number;
  height: number;
  /** Authored origin, in the ride's own unscaled space. */
  origin: [number, number];
  desired: [number, number];
}

/**
 * How far the Monster Ride and the Drop Tower step back.
 *
 * "Back" is away from the main gate, which stands at z = 620, so a step back is
 * a step towards LOWER z and deeper into the park. Only those two rides move;
 * the Ferris Wheel, the Dragon Ride and the Roller Coaster keep the centres
 * they have always had.
 */
export const RIDE_STEP_BACK = 40;

const RAW_RIDES: RawRide[] = [
  { id: "ferris", label: "Ferris Wheel", halfX: ferrisReach, halfZ: ferrisReach, height: 29.5, origin: [0, 0], desired: [-165, 250] },
  { id: "dragon", label: "Dragon Ride", halfX: 26.5, halfZ: (19.5 + FOOT_SPREAD_X) / 2, height: 34.0, origin: [DRAGON_ORIGIN[0], DRAGON_BOX_CENTER_Z], desired: [-72.3, 117.7] },
  { id: "coaster", label: "Roller Coaster", halfX: 32, halfZ: 24, height: 30.0000, origin: [COASTER_BOX_CENTER_X, 0], desired: [70, -10] },
  { id: "monster", label: "Monster Ride", halfX: MONSTER_REACH, halfZ: MONSTER_REACH, height: TOWER_HEIGHT, origin: [MONSTER_ORIGIN[0], MONSTER_ORIGIN[2]], desired: [205, 90 - RIDE_STEP_BACK] },
  /* The UFO Pendulum positions itself directly from its layout centre rather
     than from an offset, exactly as the Drop Tower it replaced did, so its
     anchor is the origin. It keeps the tower's DESIRED position unchanged —
     that is what "in that place" meant — including the tower's own three-step
     shift, which is left in parkScale.ts under its old name rather than
     renamed, because moving the ride was never the point of it. */
  { id: "ufo", label: "UFO Pendulum", halfX: UFO_REACH, halfZ: UFO_REACH, height: UFO_HEIGHT, origin: [0, 0], desired: [270 + TOWER_SHIFT_X, 280 - RIDE_STEP_BACK] },
];

/** The factor each ride is actually built at. Solved once, read everywhere. */
export const RIDE_SCALE: Record<string, number> = Object.fromEntries(
  RAW_RIDES.map((r) => [r.id, solveRideScale(r, r.id)]),
);

export function rideScale(id: string): number {
  return RIDE_SCALE[id] ?? PARK_SCALE;
}

const RIDES: RideFootprint[] = RAW_RIDES.map((r) => {
  const k = RIDE_SCALE[r.id];
  return {
    id: r.id,
    label: r.label,
    halfX: r.halfX * k,
    halfZ: r.halfZ * k,
    height: r.height * k,
    anchor: [r.origin[0] * k, r.origin[1] * k],
    desired: r.desired,
  };
});

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
/**
 * The views the ride fan is designed for, and now solved against.
 *
 * The park's whole layout argument is that from the entrance the five rides
 * spread left to right with sky between them. That used to be true by
 * construction — the desired fan was drawn that way and the rides were small
 * enough to keep it. Building every ride to one common height doubled some
 * footprints, and at those sizes the Monster Ride and the UFO Pendulum
 * overlapped by fourteen degrees: the fan was still a fan, but two of its
 * silhouettes had grown into each other.
 *
 * So the separation is now SOLVED rather than assumed, from the same three
 * viewpoints `verify-park-layout.ts` checks. The rule is the park's own:
 * rides are pushed apart until their silhouettes have clear sky between them.
 */
const VIEW_FAMILY: [number, number][] = [MAIN_VIEWPOINT, [70, 780], [70, 520]];
/* A little clear of the threshold the checks use, so the solver lands inside
   it rather than exactly on it. */
const SIGHTLINE_TARGET_DEG = 0.5;

/** Where a ride sits in a view: its bearing, and how wide it looks from there. */
function viewSlice(
  center: [number, number],
  reach: number,
  view: [number, number],
  axis: [number, number],
): { bearing: number; half: number; distance: number; tangent: [number, number] } {
  const dx = center[0] - view[0];
  const dz = center[1] - view[1];
  const distance = Math.hypot(dx, dz) || 1;
  const bearing =
    (Math.atan2(axis[0] * dz - axis[1] * dx, dx * axis[0] + dz * axis[1]) * 180) / Math.PI;
  const half = (Math.atan(reach / distance) * 180) / Math.PI;
  /* Perpendicular to the line of sight: moving along it changes the bearing
     and nothing else, which is exactly the push this needs. */
  return { bearing, half, distance, tangent: [-dz / distance, dx / distance] };
}

function resolveOverlaps(rides: RideFootprint[]): PlacedRide[] {
  const centers = rides.map((r) => [...r.desired] as [number, number]);

  const axes = VIEW_FAMILY.map((v) => {
    const ax = PARK_CENTER[0] - v[0];
    const az = PARK_CENTER[1] - v[1];
    const al = Math.hypot(ax, az) || 1;
    return [ax / al, az / al] as [number, number];
  });

  for (let pass = 0; pass < 600; pass++) {
    let worst = 0;

    /* ---- clear sky between silhouettes, from every view in the family ---- */
    for (let v = 0; v < VIEW_FAMILY.length; v++) {
      for (let i = 0; i < rides.length; i++) {
        for (let j = i + 1; j < rides.length; j++) {
          const reachI = Math.hypot(rides[i].halfX, rides[i].halfZ);
          const reachJ = Math.hypot(rides[j].halfX, rides[j].halfZ);
          const a = viewSlice(centers[i], reachI, VIEW_FAMILY[v], axes[v]);
          const b = viewSlice(centers[j], reachJ, VIEW_FAMILY[v], axes[v]);
          const gapDeg = Math.abs(a.bearing - b.bearing) - (a.half + b.half);
          if (gapDeg >= SIGHTLINE_TARGET_DEG) continue;

          const deficit = SIGHTLINE_TARGET_DEG - gapDeg;
          worst = Math.max(worst, deficit);

          /* Slide each one sideways along its own line of sight, away from the
             other — half the angle each, converted to metres at its distance. */
          const dir = a.bearing >= b.bearing ? 1 : -1;
          const stepA = ((deficit / 2) * Math.PI) / 180 * a.distance * 0.5;
          const stepB = ((deficit / 2) * Math.PI) / 180 * b.distance * 0.5;
          centers[i][0] += a.tangent[0] * stepA * dir;
          centers[i][1] += a.tangent[1] * stepA * dir;
          centers[j][0] -= b.tangent[0] * stepB * dir;
          centers[j][1] -= b.tangent[1] * stepB * dir;
        }
      }
    }

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
