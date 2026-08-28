import {
  ARM_END_DROP,
  ARM_LENGTH,
  BASE_HEIGHT,
  ARM_ATTACH_HEIGHT,
  MIN_GROUND_CLEARANCE,
  MONSTER_ORIGIN,
  TIP_TO_TUB_BOTTOM,
} from "./constants";

/**
 * Ground-clearance model for the Monster Ride's undulating arms.
 *
 * The park's terrain is a flat plane, but this is written as a sampled
 * function of world (x, z) rather than a hardcoded 0 — if the ground ever
 * gains elevation, only this function needs to change (§1, §6 of the fix
 * request).
 */
// Kept as the terrain-sampling API contract (§1, §6 of the fix request); the
// park's ground has no elevation yet, so both parameters are currently unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function terrainHeightAt(worldX: number, worldZ: number): number {
  return 0;
}

/**
 * Minimum gap enforced between the lowest point of a cart and the ground.
 *
 * Owned by `constants.ts`, because the undulation's centre tilt is SOLVED from
 * it there — the wave is placed so its lowest point lands exactly on this
 * bound. Re-exported here so callers of this module keep their import.
 */
export { MIN_GROUND_CLEARANCE } from "./constants";

/** World height of the point where each arm pivots (the hub). */
const HUB_WORLD_Y = MONSTER_ORIGIN[1] + BASE_HEIGHT + ARM_ATTACH_HEIGHT;

/**
 * Fixed vertical distance from the arm tip down to the lowest point of a
 * gondola, measured in the "levelled" frame — this is exact and constant
 * regardless of arm tilt, because the spider assembly counter-rotates to
 * cancel the arm's tilt (see Arm.tsx's levelRef). Mirrors the literal offsets
 * used there: -1.85 for the spider group, then half the gondola's own height
 * down to its floor.
 */
const TOTAL_DROP_FROM_TIP = TIP_TO_TUB_BOTTOM;

/**
 * World-space height of the arm's tip as a function of its tilt angle.
 *
 * Derived from the exact transform chain in Arm.tsx: the arch's untilted tip
 * sits at local (ARM_LENGTH, -ARM_END_DROP) relative to the hub, and tilting
 * the whole arm by `tilt` around its own tangential (local Z) axis rotates
 * that point within the radial-vertical plane:
 *
 *   y' = ARM_LENGTH * sin(tilt) - ARM_END_DROP * cos(tilt)
 *
 * (This is the same rotation Three.js applies via the arm wrapper's
 * `rotation.z = tilt` in MonsterRide.tsx — reproduced here in closed form so
 * the safe range can be solved analytically instead of sampled.)
 */
export function armTipWorldY(tilt: number): number {
  return HUB_WORLD_Y + ARM_LENGTH * Math.sin(tilt) - ARM_END_DROP * Math.cos(tilt);
}

/** World-space height of a cart's lowest point (tub floor) for a given arm tilt. */
export function cartBottomWorldY(tilt: number): number {
  return armTipWorldY(tilt) - TOTAL_DROP_FROM_TIP;
}

/**
 * Solves cartBottomWorldY(tilt) == groundY + MIN_GROUND_CLEARANCE for the
 * smallest (most negative) tilt, using the identity
 * A*sin(t) + B*cos(t) = R*sin(t + phi). cartBottomWorldY is monotonically
 * increasing in tilt across the full operating range (its derivative,
 * ARM_LENGTH*cos(t) + ARM_END_DROP*sin(t), only turns negative past about
 * -69 degrees), so this root is the one and only boundary: any tilt below it
 * clips the ground, any tilt above it clears the ground.
 */
export function safeMinimumTilt(worldX: number, worldZ: number): number {
  const A = ARM_LENGTH;
  const B = -ARM_END_DROP;
  const R = Math.hypot(A, B);
  const phi = Math.atan2(B, A);

  const groundTarget = terrainHeightAt(worldX, worldZ) + MIN_GROUND_CLEARANCE;
  const constant = HUB_WORLD_Y - TOTAL_DROP_FROM_TIP;
  const k = Math.max(-1, Math.min(1, (groundTarget - constant) / R));

  return Math.asin(k) - phi;
}

/**
 * Defense-in-depth: clamps a tilt value so the resulting cart can never dip
 * below the ground, regardless of how the animation parameters are tuned.
 * The nominal undulation range (see UNDULATION_CENTER_TILT / UNDULATION_SWING
 * in constants.ts) is chosen to already sit safely above this bound with
 * margin, so in normal operation this clamp does not activate — it exists so
 * a future change to the amplitude, arm length, or hub height cannot
 * reintroduce ground clipping silently.
 */
export function clampTiltForGroundClearance(
  tilt: number,
  worldX: number,
  worldZ: number,
): number {
  return Math.max(tilt, safeMinimumTilt(worldX, worldZ));
}
