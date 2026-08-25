import {
  ARM_LENGTH,
  BULWARK_HEIGHT,
  HULL_DEPTH,
  HULL_LENGTH,
  MIN_AMPLITUDE_FRACTION,
  PIVOT_Y,
  RIDE_CYCLE_SECONDS,
  SWING_MAX,
  SWING_PERIOD,
} from "./constants";

/**
 * Pure swing kinematics for the Dragon Swing Ship.
 *
 * This module is the single source of truth for the ride's motion: the
 * renderer calls `swingAngle` every frame and does nothing else to the ship's
 * transform, and the verification script sweeps these same functions, so the
 * numbers that are checked are the numbers that are drawn.
 */

/**
 * Motor envelope: the ship winds up from a gentle rock to the full arc, holds,
 * then eases back down, on a loop. Built from a raised cosine so amplitude and
 * its derivative are both continuous at the cycle boundary — no visible jolt
 * when the cycle restarts.
 */
export function swingAmplitudeFraction(timeSeconds: number): number {
  const p = ((timeSeconds % RIDE_CYCLE_SECONDS) + RIDE_CYCLE_SECONDS) % RIDE_CYCLE_SECONDS;
  const rise = 0.5 - 0.5 * Math.cos((2 * Math.PI * p) / RIDE_CYCLE_SECONDS);
  return MIN_AMPLITUDE_FRACTION + (1 - MIN_AMPLITUDE_FRACTION) * rise;
}

/**
 * Swing angle in radians about the pivot axis, positive = bow rising.
 *
 * The carrier is a true harmonic pendulum at the period derived from the arm
 * length, so speed peaks at the bottom of the arc and falls to zero at each
 * extreme — the heavy, momentum-driven feel of a real swinging-ship ride,
 * rather than a constant-rate rotation.
 */
export function swingAngle(timeSeconds: number): number {
  return (
    SWING_MAX *
    swingAmplitudeFraction(timeSeconds) *
    Math.sin((2 * Math.PI * timeSeconds) / SWING_PERIOD)
  );
}

/** Angular velocity (rad/s), used only for checks — never for rendering. */
export function swingAngularVelocity(timeSeconds: number, h = 1e-4): number {
  return (swingAngle(timeSeconds + h) - swingAngle(timeSeconds - h)) / (2 * h);
}

/**
 * Conservative hull bounding box in the ship's local frame, measured from the
 * pivot. The real hull is a curved boat that fits strictly inside this box, so
 * any clearance proved for the box holds for the hull.
 */
export const HULL_LOCAL = {
  yBottom: -(ARM_LENGTH + HULL_DEPTH),
  yTop: -ARM_LENGTH + BULWARK_HEIGHT,
  halfLength: HULL_LENGTH / 2,
} as const;

/**
 * Lowest world-space Y reached by the hull at a given swing angle.
 *
 * The ship rotates about the pivot's X axis, so for a local point (y, z):
 *   y_world = PIVOT_Y + y*cos(theta) - z*sin(theta)
 * Over the box, cos(theta) > 0 across the whole swing range, so the minimum is
 * always the keel (y = yBottom) at whichever end the rotation is driving down.
 */
export function lowestHullY(theta: number): number {
  return (
    PIVOT_Y + HULL_LOCAL.yBottom * Math.cos(theta) - HULL_LOCAL.halfLength * Math.abs(Math.sin(theta))
  );
}

/** Farthest horizontal distance the hull reaches from the ride's centre line. */
export function maxHullHorizontalReach(theta: number): number {
  return (
    Math.abs(HULL_LOCAL.yBottom) * Math.abs(Math.sin(theta)) +
    HULL_LOCAL.halfLength * Math.cos(theta)
  );
}
