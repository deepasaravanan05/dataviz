/**
 * Dimensions for the standalone Ferris Wheel showcase.
 *
 * The wheel radius is driven by the 60-cabin requirement: 60 cabins around
 * 2*PI*R must not touch, so R is chosen so the arc spacing (~1.36) comfortably
 * exceeds the cabin width (~1.05). Shrinking the wheel would force tiny
 * cabins, which the spec explicitly forbids.
 */
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

export const CABIN_COUNT = 60;
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

export const SUPPORT_SPREAD = 9;
export const SUPPORT_Z_OFFSET = HUB_DEPTH / 2 + 0.45;
export const SUPPORT_THICKNESS = 0.42;

export const BASE_WIDTH = 23;
export const BASE_DEPTH = 7;
export const BASE_HEIGHT = 0.5;

/** Radians per second — slow and realistic (§25). */
export const ROTATION_SPEED = 0.1;
