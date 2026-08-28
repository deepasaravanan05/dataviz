import { RIDE_PAINT } from "@/world/ridePaint";

/**
 * Dimensions and palette for the Giant Drop Tower.
 *
 * ADD-ONLY: nothing here is imported by, or alters, any existing ride.
 *
 * Colours are taken from the user's reference photograph: a bright yellow
 * lattice tower, a red structural "spider" carrying the gondola, navy-blue
 * outward-facing seats with black over-the-shoulder restraints, dark footrest
 * plates, and a dark navy polygonal canopy edged in red.
 *
 * Scale reference — this is by a wide margin the tallest thing in the park:
 *   Ferris Wheel top ....... 29.5u
 *   Dragon A-frame apex .... 34.0u
 *   Drop Tower crown ....... 62.0u   <- new park landmark
 * A seated employee is ~1.3u tall, so a person at the base is about 1/48th the
 * height of the tower.
 */
import { TOWER_CENTER } from "@/components/park/layout";
import { RIDE_SEAT_SCALE, loweredSeatMount } from "@/world/scale";

export const PALETTE = {
  /** Painted steel lattice — the tower is the park's purple ride. */
  towerSteel: RIDE_PAINT.tower.light,
  towerSteelDark: RIDE_PAINT.tower.dark,
  towerBrace: RIDE_PAINT.tower.mid,
  guideRail: RIDE_PAINT.tower.mid,
  /** Gondola structure, painted with the tower it rides on. */
  spider: RIDE_PAINT.tower.light,
  spiderDark: RIDE_PAINT.tower.dark,
  /** Navy seats. */
  seatShell: "#2c4a7c",
  seatShellDark: "#1e3557",
  /** Black restraints and dark footrests. */
  restraint: "#23262b",
  restraintPad: "#3a3d42",
  footrest: "#3a3d42",
  /** Canopy. */
  canopy: RIDE_PAINT.tower.dark,
  canopyEdge: RIDE_PAINT.tower.light,
  /** Machinery, foundations, riders. */
  machinery: RIDE_PAINT.tower.dark,
  cable: RIDE_PAINT.tower.dark,
  foundation: "#b0aca4",
  shirt: "#3b82f6",
  skin: "#f1c27d",
} as const;

/**
 * World placement, in front of the Dragon Ride on the entrance (+Z) side, so
 * the order through the park is
 * PARK -> DROP TOWER -> DRAGON RIDE -> ROLLER COASTER.
 *
 * Two things set this position:
 *
 *  1. The park was expanded by PARK_SCALE. Every other ride grew and moved
 *     outward with it; the tower keeps its original SIZE, so it has to take the
 *     scaled version of its old spot to hold the same place in the layout.
 *     Leaving it at (58, 92) would have put it inside the enlarged Dragon
 *     Ride's footprint.
 *  2. On top of that it is nudged three pedestrian steps to the left (-X).
 *
 * Both terms are derived from the shared park config rather than typed in, and
 * verify-drop-tower.ts re-proves every clearance at the new position.
 */
export const TOWER_BASE_ORIGIN: [number, number, number] = [58, 0, 92];

/**
 * The tower's spot is now assigned by the park layout solver, which places
 * every ride on its own bearing from the main gate so none can hide behind
 * another. The three-step-left nudge is folded into that ride's desired
 * position, so it survives the re-layout.
 */
export const TOWER_ORIGIN: [number, number, number] = [TOWER_CENTER[0], 0, TOWER_CENTER[1]];

/** ---------------- Tower ---------------- */
/*
 * 105 m. The Drop Tower is the park's vertical landmark and the one ride whose
 * height costs nothing in ground: its footprint is a 4.2 m lattice mast, so it
 * can stand as tall as a real one — Zumanjaro is 126 m, Falcon's Fury 102 m —
 * without moving a single neighbour. It is deliberately the tallest thing in
 * the park, which is what lets it read from the far overview.
 */
export const TOWER_HEIGHT = 105;
/** Half-width of the square lattice mast (corner chord centres). */
export const TOWER_HALF = 2.1;
export const CHORD_RADIUS = 0.34;
export const BRACE_RADIUS = 0.15;
/** Vertical spacing of the horizontal ties / bracing bays. */
export const BAY_HEIGHT = 3.875;
export const BAY_COUNT = Math.round(TOWER_HEIGHT / BAY_HEIGHT);

export { FOUNDATION_RADIUS } from "./gondolaBreadth";
export const FOUNDATION_HEIGHT = 1.2;
/** Splayed buttress legs at the base. */
export const BUTTRESS_SPREAD = 6.2;
export const BUTTRESS_HEIGHT = 11;

/** ---------------- Gondola ---------------- */
/**
 * Travel limits for the gondola's origin, which is the seat-pan plane.
 *
 * The bottom is set so the ride genuinely meets its station: seat pans come to
 * rest 1.0u above the boarding deck (STATION_DECK_Y), every part that hangs
 * below the pan — seat posts, spider hoops, footrests — still clears the deck,
 * and the collar stops above the foundation instead of intersecting it.
 */
export const GONDOLA_BOTTOM_Y = 2.9;
/* Kept at the same fraction of the mast as before, so the ride still stops
 * short of the head frame rather than running into it. */
export const GONDOLA_TOP_Y = 80;
export const DROP_HEIGHT = GONDOLA_TOP_Y - GONDOLA_BOTTOM_Y;

/**
 * The gondola's breadth, the boarding deck that follows it, and the ride's
 * footprint all live in `gondolaBreadth.ts` — a leaf module, so `park/layout.ts`
 * can read the footprint without importing this file, which imports the layout
 * back for the tower's solved centre. Re-exported here so every drawing module
 * keeps its existing import.
 */
export {
  GONDOLA_BREADTH_SCALE,
  COLLAR_INNER_R,
  COLLAR_OUTER_R,
  INNER_HOOP_R,
  OUTER_HOOP_R,
  SEAT_RING_R,
  FOOTREST_R,
  CANOPY_R,
  STATION_INNER_R,
  STATION_OUTER_R,
} from "./gondolaBreadth";

export const STATION_DECK_Y = 1.9;
export const CANOPY_Y = 3.6;
/** Radial arms of the spider, each carrying two seats. */
export const ARM_COUNT = 20;

/** ---------------- Seats ---------------- */
/**
 * 40 individual outward-facing seats in one ring, matching the reference's
 * single circular deck.
 *
 * FORTY, DOWN FROM SIXTY, to meet the user's 30-40 capacity for every ride —
 * and the ring is better for it. At SEAT_RING_R the arc spacing is now
 * 2*PI*9/40 = 1.41u against a 0.82u seat, where at sixty it was 0.94u and the
 * drawn seats (which are scaled up for the people who sit in them) ran into one
 * another. The gondola, the spider, the canopy and the mast are untouched; the
 * ring simply carries twenty pairs instead of thirty, one pair per spider arm,
 * so every seat is still bolted to a real radial arm.
 */
export const SEAT_COUNT = 40;
export const SEAT_WIDTH = 0.82;
export const SEAT_ANGLE_STEP = (Math.PI * 2) / SEAT_COUNT;

/**
 * WHERE A RIDER ACTUALLY SITS, and the one place that decides it.
 *
 * `Gondola.tsx` draws the seat and `rideKinematics.ts` places the employee in
 * it; both read these, so the two can never disagree about where the pan is.
 *
 * SEAT_SURFACE_Y is the top of the pan, lowered by SEAT_LOWER_FRACTION of its
 * rise above the footrest plate a rider's feet stand on — the 10-15% the user
 * asked for, taken out of the seat and not out of the ride. The mast, the
 * gondola's travel, the station deck and the 105 m crown are all unchanged.
 */
/** Footrest plate: the floor of this vehicle, on the gondola's own plane. */
const FOOTREST_Y = -0.45;
/** Half the 0.14-deep pan: the pan top, in the seat's own unscaled frame. */
export const SEAT_PAN_TOP_LOCAL = 0.07;
const SEAT_RISE = SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE - FOOTREST_Y;
export const SEAT_SURFACE_Y = FOOTREST_Y + loweredSeatMount(SEAT_RISE);
/** Where the seat GROUP is mounted so its pan top lands on SEAT_SURFACE_Y. */
export const SEAT_MOUNT_Y = SEAT_SURFACE_Y - SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE;

/** ---------------- Motion ---------------- */
/**
 * Phase durations, in seconds, of one complete ride cycle.
 *
 * Retimed for the 105 m mast. The drop is now 77 m rather than 44, and the old
 * 2.1 s fall over that distance would have implied 2.4 g on the way down and
 * 5.1 g in the brakes — a ride nobody could sit in. The fall and brake phases
 * are solved back from the geometry instead:
 *
 *   a * (0.5*tf^2 + tf*tb/2) = DROP_HEIGHT - BRAKE_OVERSHOOT
 *
 * At tf = 3.1 s and tb = 1.6 s that lands at 10.6 m/s^2 — 1.08 g, a true
 * gravity drop — reaching 118 km/h and braking at about 2 g. Real towers of
 * this height run 140 km/h, so this is conservative rather than fanciful.
 *
 * The lift is longer than it was for the same reason: hoisting 77 m in 4.5 s
 * would be 17 m/s, roughly triple what a real winch does. At 8 s it is 9.6 m/s,
 * and the whole cycle is 16.7 s — still far quicker than the 26.9 s this ride
 * started at, just no longer physically impossible.
 */
export const PHASE_DWELL_BOTTOM = 2.0;
export const PHASE_LIFT = 8.0;
export const PHASE_HOLD_TOP = 1.0;
export const PHASE_FALL = 3.1;
export const PHASE_BRAKE = 1.6;
export const PHASE_SETTLE = 1.0;
export const RIDE_CYCLE_SECONDS =
  PHASE_DWELL_BOTTOM + PHASE_LIFT + PHASE_HOLD_TOP + PHASE_FALL + PHASE_BRAKE + PHASE_SETTLE;

/**
 * The brakes catch the gondola slightly above its resting height; the last
 * fraction of a unit is given up as a short damped settle, which is what makes
 * the car read as heavy rather than as a value snapping to a number.
 */
export const BRAKE_OVERSHOOT = 0.2;

/** How far the shoulder restraints swing between open and locked, in radians. */
export const RESTRAINT_TRAVEL = (62 * Math.PI) / 180;

/**
 * Worst-case horizontal footprint, used for park-placement checks. Re-derived
 * from the real geometry in verify-drop-tower.ts rather than trusted here.
 */
/** Overall horizontal reach, used for clearance checks against other rides. */
export { TOWER_REACH as RIDE_REACH } from "./gondolaBreadth";
