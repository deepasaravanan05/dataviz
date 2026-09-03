import {
  ARM_LENGTH,
  ARM_SWING,
  FLIGHT_RISE,
  HUB_Y,
  LOAD_SECONDS,
  ROTATION_RADIANS_PER_SEC,
  RUN_SECONDS,
  SPIN_DOWN_SECONDS,
  SPIN_UP_SECONDS,
  UNLOAD_SECONDS,
  VEHICLE_LOAD_Y,
} from "./constants";
import type { ArmPlacement } from "./ring";

/**
 * THE RIDE CYCLE — it comes down for the people, then flies.
 *
 * A Dumbo loads with every elephant on the gallery: the ride stops, the arms
 * are all the way down, and riders step into a vehicle whose floor is level
 * with the deck they are standing on. So the machine has to actually STOP with
 * its arms DOWN, and that is the first thing this module is for.
 *
 *   LOAD       still, and every elephant parked on the gallery.
 *   SPIN UP    the turntable winds on, arms still down.
 *   RUN        at speed, and only now do the levers come alive.
 *   SPIN DOWN  the arms are already down again; the turntable winds off.
 *   UNLOAD     still, riders out.
 *
 * WHY THE FLYING IS CONFINED TO THE RUN. An earlier version scaled the lift by
 * the drive ramp, so that a vehicle mid-sweep was hauled up or down as the ramp
 * came on and off — which, swept numerically, put an elephant through seven
 * metres a second against a two-and-a-half metre cap. The machine cannot do
 * that, and neither can a rider. What a real one does instead is exactly what
 * this does now: the levers only work while the ride is up to speed, and every
 * rider flies a whole number of sweeps, so the arms arrive back down at the end
 * of the run without anything having to pull them there. The rise and its rate
 * are then bounded in closed form rather than hoped for — see SWEEP_BUDGET in
 * constants.ts, and `verify-dumbo-ride.ts` sweeps the real functions to prove
 * the bound holds.
 */

export const CYCLE_SECONDS =
  LOAD_SECONDS + SPIN_UP_SECONDS + RUN_SECONDS + SPIN_DOWN_SECONDS + UNLOAD_SECONDS;

export const RUN_START = LOAD_SECONDS + SPIN_UP_SECONDS;
export const RUN_END = RUN_START + RUN_SECONDS;
const SPIN_DOWN_END = RUN_END + SPIN_DOWN_SECONDS;

/** Smoothstep: starts and finishes with zero rate, so nothing jerks. */
function ease(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

export type DumboPhase = "load" | "spin-up" | "run" | "spin-down" | "unload";

export interface DumboState {
  time: number;
  phase: DumboPhase;
  /** 0 stopped, 1 at working speed. */
  drive: number;
  rotationRate: number;
}

/** The state of the machine at a time in the cycle. Any time; it wraps. */
export function dumboStateAt(seconds: number): DumboState {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;

  let phase: DumboPhase;
  let drive: number;
  if (t < LOAD_SECONDS) {
    phase = "load";
    drive = 0;
  } else if (t < RUN_START) {
    phase = "spin-up";
    drive = ease((t - LOAD_SECONDS) / SPIN_UP_SECONDS);
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

  return { time: t, phase, drive, rotationRate: ROTATION_RADIANS_PER_SEC * drive };
}

/**
 * How far up its arc a given rider has flown, 0 at the gallery and 1 at the
 * top of the machine's reach.
 *
 * Zero everywhere outside the run, and zero at both ends of it — the whole
 * number of sweeps is what guarantees the second part, and it also makes the
 * rate zero there, so the arms settle rather than stop dead.
 */
export function liftFraction(seconds: number, plan: ArmPlacement): number {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;
  if (t <= RUN_START || t >= RUN_END) return 0;
  const u = (t - RUN_START) / RUN_SECONDS;
  return (plan.amplitude * (1 - Math.cos(2 * Math.PI * plan.sweeps * u))) / 2;
}

/** How high that vehicle is flying at that moment. */
export function vehicleHeightAt(seconds: number, plan: ArmPlacement): number {
  return VEHICLE_LOAD_Y + FLIGHT_RISE * liftFraction(seconds, plan);
}

/**
 * And the angle its arm is at, which is the same fact said the other way.
 *
 * The vehicle rides the end of the arm, so its height IS `HUB_Y + L sin(theta)`
 * — the angle is read back out of the height rather than animated separately,
 * which is what keeps the elephant on the end of the arm that carries it.
 */
export function armAngleAt(seconds: number, plan: ArmPlacement): number {
  return Math.asin((vehicleHeightAt(seconds, plan) - HUB_Y) / ARM_LENGTH);
}

/** The arm's angle when the ride is stopped: all the way down, on the gallery. */
export const ARM_ANGLE_DOWN = -ARM_SWING;

/** The fastest any rider is permitted to climb, in metres a second. */
export function peakClimbRate(plan: ArmPlacement): number {
  return (plan.amplitude * plan.sweeps * Math.PI * FLIGHT_RISE) / RUN_SECONDS;
}
