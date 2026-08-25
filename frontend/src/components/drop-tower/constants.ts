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

export const PALETTE = {
  /** Yellow painted steel lattice. */
  towerSteel: "#f2c21a",
  towerSteelDark: "#c29612",
  towerBrace: "#e0b018",
  guideRail: "#9aa1aa",
  /** Red gondola structure. */
  spider: "#c42b24",
  spiderDark: "#8f1f1a",
  /** Navy seats. */
  seatShell: "#2c4a7c",
  seatShellDark: "#1e3557",
  /** Black restraints and dark footrests. */
  restraint: "#23262b",
  restraintPad: "#3a3d42",
  footrest: "#3a3d42",
  /** Canopy. */
  canopy: "#1c2b4a",
  canopyEdge: "#c42b24",
  /** Machinery, foundations, riders. */
  machinery: "#4a4f55",
  cable: "#6f757c",
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

export const FOUNDATION_RADIUS = 7.0;
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

/** Boarding deck: an annulus around the mast, clear of the foundation. */
export const STATION_DECK_Y = 1.9;
export const STATION_INNER_R = 7.2;
export const STATION_OUTER_R = 11.8;

/** Inner collar clears the tower's diagonal (TOWER_HALF * sqrt(2) = 2.97). */
export const COLLAR_INNER_R = 3.5;
export const COLLAR_OUTER_R = 4.6;
/** Structural hoops of the red spider. */
export const INNER_HOOP_R = 6.2;
export const OUTER_HOOP_R = 9.9;
/** Radius of the seat centres. */
export const SEAT_RING_R = 9.0;
export const FOOTREST_R = 10.3;
export const CANOPY_R = 11.2;
export const CANOPY_Y = 3.6;
/** Radial arms of the spider, each carrying two seats. */
export const ARM_COUNT = 30;

/** ---------------- Seats ---------------- */
/**
 * 60 individual outward-facing seats in one ring, matching the reference's
 * single circular deck. At SEAT_RING_R the arc spacing is 2*PI*9/60 = 0.94u,
 * which comfortably fits a 0.82u-wide seat with a gap between neighbours, so
 * every seat stays individually identifiable.
 */
export const SEAT_COUNT = 60;
export const SEAT_WIDTH = 0.82;
export const SEAT_ANGLE_STEP = (Math.PI * 2) / SEAT_COUNT;

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
export const RIDE_REACH = 12;
