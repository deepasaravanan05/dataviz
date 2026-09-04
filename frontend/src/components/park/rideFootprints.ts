import { WHEEL_RADIUS as FERRIS_R, BASE_WIDTH } from "@/components/ferris-wheel/constants";
import { UNIFORM_RIDE_HEIGHT } from "./uniformRideHeight";
import { COASTER_ORIGIN } from "@/components/roller-coaster/constants";
import {
  MONSTER_ORIGIN,
  RIDE_REACH as MONSTER_REACH,
  TOWER_HEIGHT,
} from "@/components/monster-ride/constants";
import {
  OVERALL_HEIGHT as UFO_HEIGHT,
  OVERALL_REACH as UFO_REACH,
} from "@/components/ufo-pendulum/constants";
import { DRAGON_ORIGIN, FOOT_SPREAD_X } from "@/components/dragon-ride/constants";
import { CREST_Y as GIGA_HEIGHT } from "@/components/giga-coaster/constants";
import { OVERALL_REACH as GIGA_REACH } from "@/components/giga-coaster/envelope";
import { PARK_SCALE } from "./parkScale";

/**
 * HOW BIG EACH DEPARTMENT RIDE IS — and nothing about where.
 *
 * This file used to be the first half of `layout.ts`. It was split out when
 * the park was rebuilt around a central lake, because the new structure module
 * (`parkRing.ts`) has to know how much ground each attraction takes up in
 * order to space the ring, and `layout.ts` reads the ring back to place the
 * rides. One of the two had to stop depending on the other, and size is the
 * half that genuinely does not need to know about position.
 *
 * Not one number here changed in the move. Every comment below is the comment
 * that was on it.
 */

/**
 * Every ride was asked to grow 20% wider.
 *
 * It is applied to the TARGETS rather than to the finished rides, and to all
 * three dimensions at once, which is what keeps the scale solver below able to
 * do its job. Scaling only the footprint would have meant scaling X and Z but
 * not Y, and the rides here do not survive that: the Ferris Wheel's rotor
 * turns about Z, so a wheel stretched on X alone traces an ellipse rather than
 * a circle, and the Dragon's swing arc stretches the same way. Growing all
 * three keeps every model in the proportions it was designed with — the rides
 * are 20% wider, and 20% taller with it.
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
 * against rather than by whatever the cast happens to be drawn at now.
 */
const RIDE_SIZING_EMPLOYEE_HEIGHT = 12;

/**
 * The ride targets, in employee heights — at RIDE_SIZING_EMPLOYEE_HEIGHT.
 */
const RIDE_TARGET_EMPLOYEES: Record<string, { halfX: number; halfZ: number; height: number }> = {
  /*
   * THE UFO PENDULUM HOLDS THE SLOT THE DROP TOWER USED TO.
   *
   * ITS TARGET IS ITS OWN ENVELOPE, divided back out by the park-wide growth
   * factor so that `solveRideScale` returns exactly 1 and the ride is drawn at
   * the size it declares. Its arm is a PENDULUM, and a pendulum's period goes
   * as the square root of its length, so stretching the model by a fifth
   * without touching pendulum.ts would leave a 47 m arm swinging at a 39 m
   * arm's rate. If it should be bigger, ARM_LENGTH is the knob.
   */
  /*
   * THE GIGA COASTER, WHICH JOINED THE ROUTING SYSTEM RATHER THAN THE PARK.
   *
   * It was already standing on ring slot `giga`, drawn from its own modules at
   * its own size, and it stays exactly there at exactly that size: its target
   * is its own envelope divided back out by the park-wide growth, and its
   * declared height IS the park's uniform height (its crest reads out of the
   * Tea Cups, which is where UNIFORM_RIDE_HEIGHT comes from), so
   * `solveRideScale` returns exactly 1 and nothing about the ride moves or
   * grows. What it gains by being listed here is a place in `PARK_LAYOUT` —
   * which is what lets DevOps employees be routed to it, board it and be found
   * standing at it.
   *
   * Its anchor is the origin, like the UFO Pendulum's: the ride positions
   * itself from `giga-coaster/placement.ts`, which reads the same ring slot
   * this places it on.
   */
  giga: {
    halfX: GIGA_REACH / 12 / RIDE_WIDTH_GROWTH,
    halfZ: GIGA_REACH / 12 / RIDE_WIDTH_GROWTH,
    height: GIGA_HEIGHT / 12 / RIDE_WIDTH_GROWTH,
  },
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
   * by being scaled up here. Each target height is raised by exactly the factor
   * its own model grew by, which leaves the height RATIO the scale solver sees
   * unchanged and therefore the solved factor unchanged.
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
 * gap; they are simply no longer what decides the scale.
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
 * with. Every ride is the same height, so there is nothing to compromise —
 * one target, one ratio, and the footprint follows.
 */
function solveRideScale(raw: { height: number }, id: string): number {
  const t = RIDE_TARGET[id];
  if (!t) return PARK_SCALE;
  return t.height / raw.height;
}

/** Each ride at the size it was authored, before any park scaling. */
interface RawRide {
  id: string;
  label: string;
  halfX: number;
  halfZ: number;
  height: number;
  /** Authored origin, in the ride's own unscaled space. */
  origin: [number, number];
}

const ferrisReach = Math.max(FERRIS_R, BASE_WIDTH / 2);
/** The coaster's authored footprint is not centred on its origin. */
const COASTER_BOX_CENTER_X = COASTER_ORIGIN[0] + 2;
/** Nor is the dragon's, because its boarding platform hangs off one side. */
const DRAGON_BOX_CENTER_Z = DRAGON_ORIGIN[2] + (FOOT_SPREAD_X - 19.5) / 2;

const RAW_RIDES: RawRide[] = [
  { id: "ferris", label: "Ferris Wheel", halfX: ferrisReach, halfZ: ferrisReach, height: 29.5, origin: [0, 0] },
  { id: "dragon", label: "Dragon Ride", halfX: 26.5, halfZ: (19.5 + FOOT_SPREAD_X) / 2, height: 34.0, origin: [DRAGON_ORIGIN[0], DRAGON_BOX_CENTER_Z] },
  { id: "coaster", label: "Roller Coaster", halfX: 32, halfZ: 24, height: 30.0000, origin: [COASTER_BOX_CENTER_X, 0] },
  { id: "monster", label: "Monster Ride", halfX: MONSTER_REACH, halfZ: MONSTER_REACH, height: TOWER_HEIGHT, origin: [MONSTER_ORIGIN[0], MONSTER_ORIGIN[2]] },
  /* The UFO Pendulum positions itself directly from its layout centre rather
     than from an offset, exactly as the Drop Tower it replaced did, so its
     anchor is the origin. */
  { id: "ufo", label: "UFO Pendulum", halfX: UFO_REACH, halfZ: UFO_REACH, height: UFO_HEIGHT, origin: [0, 0] },
  /* Likewise the Giga Coaster: it reads its own ring slot in placement.ts, so
     its anchor is the origin and the layout offset is its centre. */
  { id: "giga", label: "Giga Coaster", halfX: GIGA_REACH, halfZ: GIGA_REACH, height: GIGA_HEIGHT, origin: [0, 0] },
];

/** The factor each ride is actually built at. Solved once, read everywhere. */
export const RIDE_SCALE: Record<string, number> = Object.fromEntries(
  RAW_RIDES.map((r) => [r.id, solveRideScale(r, r.id)]),
);

export function rideScale(id: string): number {
  return RIDE_SCALE[id] ?? PARK_SCALE;
}

export interface RideFootprint {
  id: string;
  label: string;
  /** Half-extents of the ride's ground footprint, at final rendered scale. */
  halfX: number;
  halfZ: number;
  /** Silhouette height at final rendered scale. */
  height: number;
  /**
   * Where the ride renders with no layout offset applied — its authored origin
   * multiplied by the park scale.
   */
  anchor: [number, number];
}

/** The department rides, sized but not yet placed. */
export const RIDE_FOOTPRINTS: RideFootprint[] = RAW_RIDES.map((r) => {
  const k = RIDE_SCALE[r.id];
  return {
    id: r.id,
    label: r.label,
    halfX: r.halfX * k,
    halfZ: r.halfZ * k,
    height: r.height * k,
    anchor: [r.origin[0] * k, r.origin[1] * k],
  };
});

/** The radius of the circle that contains a footprint — what a neighbour meets first. */
export function footprintReach(f: { halfX: number; halfZ: number }): number {
  return Math.hypot(f.halfX, f.halfZ);
}
