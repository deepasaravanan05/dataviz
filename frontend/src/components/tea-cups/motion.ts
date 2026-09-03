import {
  CUP_RADIANS_PER_SEC,
  CUP_ROTATION_SIGN,
  LOAD_SECONDS,
  PLATE_RADIANS_PER_SEC,
  RUN_SECONDS,
  SPIN_DOWN_SECONDS,
  SPIN_UP_SECONDS,
  UNLOAD_SECONDS,
} from "./constants";

/**
 * THE RIDE CYCLE — it stops for the people, then runs.
 *
 * A tea cup ride loads off its own plate: it comes to a stand, the gate opens,
 * and people walk across the deck into a cup. So the machine has to actually
 * STOP, and stopping is the first thing this module is for.
 *
 *   LOAD       dead still. Riders cross the deck and get into the cups.
 *   SPIN UP    both rotations wind on together, from nothing to working speed.
 *   RUN        the plate one way, the cups the other.
 *   SPIN DOWN  the mirror of the wind-up.
 *   UNLOAD     still again; riders get out and off.
 *
 * ONE RAMP DRIVES BOTH ROTATIONS, which is not a shortcut — it is how the
 * machine works. The ride has one drive; the cups are geared off the same
 * plate that carries them, so they cannot be turning while it is stopped. The
 * verify script asserts that rather than assuming it.
 */

export const CYCLE_SECONDS =
  LOAD_SECONDS + SPIN_UP_SECONDS + RUN_SECONDS + SPIN_DOWN_SECONDS + UNLOAD_SECONDS;

const LOAD_END = LOAD_SECONDS;
const SPIN_UP_END = LOAD_END + SPIN_UP_SECONDS;
const RUN_END = SPIN_UP_END + RUN_SECONDS;
const SPIN_DOWN_END = RUN_END + SPIN_DOWN_SECONDS;

/** Smoothstep: starts and finishes with zero rate, so nothing jerks. */
function ease(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

export type CupsPhase = "load" | "spin-up" | "run" | "spin-down" | "unload";

export interface CupsState {
  time: number;
  phase: CupsPhase;
  /** 0 stopped, 1 at working speed. Both rotations are scaled by it. */
  drive: number;
  plateRate: number;
  cupRate: number;
}

/** The state of the machine at a time in the cycle. Any time; it wraps. */
export function cupsStateAt(seconds: number): CupsState {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;

  let phase: CupsPhase;
  let drive: number;
  if (t < LOAD_END) {
    phase = "load";
    drive = 0;
  } else if (t < SPIN_UP_END) {
    phase = "spin-up";
    drive = ease((t - LOAD_END) / SPIN_UP_SECONDS);
  } else if (t < RUN_END) {
    phase = "run";
    drive = 1;
  } else if (t < SPIN_DOWN_END) {
    phase = "spin-down";
    drive = 1 - ease((t - RUN_END) / SPIN_DOWN_SECONDS);
  } else {
    phase = "unload";
    drive = 0;
  }

  return {
    time: t,
    phase,
    drive,
    plateRate: PLATE_RADIANS_PER_SEC * drive,
    cupRate: CUP_ROTATION_SIGN * CUP_RADIANS_PER_SEC * drive,
  };
}
