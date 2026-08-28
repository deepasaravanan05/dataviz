/**
 * Dimensions for the standalone Ferris Wheel showcase.
 *
 * The wheel radius was originally driven by a 60-cabin requirement: 60 cabins
 * around 2*PI*R must not touch, so R was chosen so the arc spacing (~1.36)
 * comfortably exceeded the cabin width (~1.05). The wheel is UNCHANGED at 40
 * cabins — the same rim, the same radius, the same height — so the only thing
 * that moved is that each cabin now has 2.04 of arc to itself instead of 1.36.
 */
import { loweredSeatMount } from "@/world/scale";
export const WHEEL_RADIUS = 13;
export const INTERMEDIATE_RADIUS = 9;
export const INNER_RIM_RADIUS = 5;

export const RIM_TUBE_RADIUS = 0.24;
export const INTERMEDIATE_TUBE_RADIUS = 0.13;
export const INNER_TUBE_RADIUS = 0.16;

/** Half-depth of the wheel truss: rings are doubled at +/- this z. */
export const RIM_Z = 0.62;

export const HUB_RADIUS = 1.6;
export const HUB_DEPTH = 2.4;
export const AXLE_RADIUS = 0.42;
export const AXLE_LENGTH = 4.6;

/** 28 major spokes, mirrored on both truss planes (§16: 24-32). */
export const SPOKE_COUNT = 28;
export const SPOKE_THICKNESS = 0.15;
export const BRACE_THICKNESS = 0.075;

/**
 * FORTY CABINS, DOWN FROM SIXTY.
 *
 * The user asked every ride for a realistic 30-40 seat capacity, 40 preferred.
 * A Ferris Wheel cabin is this ride's seat, so the count of them IS the
 * capacity, and forty is taken by thinning the ring rather than by changing
 * anything about the wheel: `cabinManifest.ts` still places them from the index
 * alone, at 2*PI/CABIN_COUNT apart, so they stay perfectly even and every one
 * of them is still bolted to the rim it was always bolted to.
 */
export const CABIN_COUNT = 40;
export const CABIN_WIDTH = 1.05;
export const CABIN_HEIGHT = 1.25;
export const CABIN_DEPTH = 0.9;
export const ARM_LENGTH = 0.75;


/**
 * Hub height clears the lowest cabin over the base platform: the bottom cabin
 * hangs (ARM_LENGTH + CABIN_HEIGHT) below a mount at WHEEL_CENTER_HEIGHT -
 * WHEEL_RADIUS, which must stay above BASE_HEIGHT.
 */
export const WHEEL_CENTER_HEIGHT = 16.5;

/**
 * HOW FAR THE CABIN HANGS BELOW ITS RIM MOUNT, after the seat lowering.
 *
 * A Ferris Wheel has no seat pan to drop: the cabin itself is the seat, so
 * "lower the passenger seat/cabin position slightly" means the cabin hangs
 * further down its suspension. The 12.5% is taken out of the height the cabin
 * FLOOR stands at when that cabin is at the bottom of the rim — the step-up a
 * boarding passenger actually meets — so the reduction is measured against
 * something real rather than against the 0.75 hanger.
 *
 * The wheel itself does not move. Its rim, radius, hub height and overall
 * 29.5 m crown are all exactly as they were; only the cabins ride 0.19 m lower
 * on their yokes, which still leaves the lowest cabin comfortably clear of the
 * base platform — re-proved in verify-ferris-wheel.ts.
 */
const CABIN_FLOOR_AT_BOTTOM = WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT;
export const CABIN_LOWER = CABIN_FLOOR_AT_BOTTOM - loweredSeatMount(CABIN_FLOOR_AT_BOTTOM);
/** Total hang from the rim mount down to the cabin's roof line. */
export const CABIN_HANG = ARM_LENGTH + CABIN_LOWER;


export const SUPPORT_SPREAD = 9;
export const SUPPORT_Z_OFFSET = HUB_DEPTH / 2 + 0.45;
export const SUPPORT_THICKNESS = 0.42;

export const BASE_WIDTH = 23;
export const BASE_DEPTH = 7;
export const BASE_HEIGHT = 0.5;

/** Radians per second — slow and realistic (§25). */
export const ROTATION_SPEED = 0.1;
