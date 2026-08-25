import {
  BRAKE_OVERSHOOT,
  DROP_HEIGHT,
  GONDOLA_BOTTOM_Y,
  GONDOLA_TOP_Y,
  PHASE_BRAKE,
  PHASE_DWELL_BOTTOM,
  PHASE_FALL,
  PHASE_HOLD_TOP,
  PHASE_LIFT,
  PHASE_SETTLE,
  RIDE_CYCLE_SECONDS,
} from "./constants";

/**
 * Pure vertical kinematics for the Drop Tower.
 *
 * This module is the single source of truth for the ride's motion: the
 * renderer sets the gondola's Y from `gondolaY` and nothing else, and the
 * verification script sweeps these same functions — so what is proved is what
 * is drawn.
 *
 * The profile is a real machine cycle rather than a lerp:
 *   dwell (board + lock) -> winch up -> hold -> free fall -> brake -> settle.
 */

export type RidePhase = "BOARDING" | "LIFTING" | "HOLD_TOP" | "FALLING" | "BRAKING" | "SETTLING";

/** Cumulative phase boundaries within one cycle. */
const T_DWELL_END = PHASE_DWELL_BOTTOM;
const T_LIFT_END = T_DWELL_END + PHASE_LIFT;
const T_HOLD_END = T_LIFT_END + PHASE_HOLD_TOP;
const T_FALL_END = T_HOLD_END + PHASE_FALL;
const T_BRAKE_END = T_FALL_END + PHASE_BRAKE;

/**
 * Free-fall acceleration implied by the geometry, solved rather than chosen.
 *
 * Over the fall the car covers 0.5*a*tf^2; the brake then bleeds off its speed
 * v = a*tf over tb, covering a further v*tb/2. Those must together equal the
 * drop height less the brake overshoot:
 *
 *     a * (0.5*tf^2 + tf*tb/2) = DROP_HEIGHT - BRAKE_OVERSHOOT
 *
 * With the phase durations in constants.ts this lands at ~10.5 u/s^2 — within a
 * few percent of real gravity, which is exactly what a drop tower should feel
 * like, and it falls out of the numbers instead of being dialled in by eye.
 */
export const FALL_ACCELERATION =
  (DROP_HEIGHT - BRAKE_OVERSHOOT) / (0.5 * PHASE_FALL * PHASE_FALL + (PHASE_FALL * PHASE_BRAKE) / 2);

/** Speed at the instant the brakes bite, and the deceleration they apply. */
export const PEAK_FALL_SPEED = FALL_ACCELERATION * PHASE_FALL;
export const BRAKE_DECELERATION = PEAK_FALL_SPEED / PHASE_BRAKE;

/** Distance covered before the brakes engage. */
const FREE_FALL_DISTANCE = 0.5 * FALL_ACCELERATION * PHASE_FALL * PHASE_FALL;

function cycleTime(t: number): number {
  return ((t % RIDE_CYCLE_SECONDS) + RIDE_CYCLE_SECONDS) % RIDE_CYCLE_SECONDS;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Quintic smoothstep: zero velocity AND zero acceleration at both ends. */
function smootherstep(p: number): number {
  const x = clamp01(p);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Classic cubic smoothstep, for the restraint bars. */
function smoothstep(p: number): number {
  const x = clamp01(p);
  return x * x * (3 - 2 * x);
}

export function ridePhase(t: number): RidePhase {
  const c = cycleTime(t);
  if (c < T_DWELL_END) return "BOARDING";
  if (c < T_LIFT_END) return "LIFTING";
  if (c < T_HOLD_END) return "HOLD_TOP";
  if (c < T_FALL_END) return "FALLING";
  if (c < T_BRAKE_END) return "BRAKING";
  return "SETTLING";
}

/**
 * Height of the gondola's seat-deck plane above the ground.
 *
 * Continuous everywhere, and continuous in velocity at every phase boundary:
 * the lift starts and ends at rest, the fall starts at rest from the top, the
 * brake picks up exactly the speed the fall left behind, and the settle starts
 * from rest at the overshoot height.
 */
export function gondolaY(t: number): number {
  const c = cycleTime(t);

  if (c < T_DWELL_END) return GONDOLA_BOTTOM_Y;

  if (c < T_LIFT_END) {
    return GONDOLA_BOTTOM_Y + DROP_HEIGHT * smootherstep((c - T_DWELL_END) / PHASE_LIFT);
  }

  if (c < T_HOLD_END) return GONDOLA_TOP_Y;

  if (c < T_FALL_END) {
    const tau = c - T_HOLD_END;
    return GONDOLA_TOP_Y - 0.5 * FALL_ACCELERATION * tau * tau;
  }

  if (c < T_BRAKE_END) {
    const sigma = c - T_FALL_END;
    const covered = PEAK_FALL_SPEED * sigma - 0.5 * BRAKE_DECELERATION * sigma * sigma;
    return GONDOLA_TOP_Y - FREE_FALL_DISTANCE - covered;
  }

  // Damped settle onto the resting height, starting from rest at the overshoot.
  // y = A*e^(-z*s) * (cos(w*s) + (z/w)*sin(w*s)) has y'(0) = 0 exactly.
  const s = c - T_BRAKE_END;
  const zeta = 4;
  const omega = 7;
  const decay = Math.exp(-zeta * s);
  return (
    GONDOLA_BOTTOM_Y +
    BRAKE_OVERSHOOT * decay * (Math.cos(omega * s) + (zeta / omega) * Math.sin(omega * s))
  );
}

/** Vertical velocity in u/s (negative = falling). Used for checks and effects. */
export function gondolaVelocity(t: number, h = 1e-4): number {
  return (gondolaY(t + h) - gondolaY(t - h)) / (2 * h);
}

/**
 * Shoulder-restraint position: 0 fully open for boarding, 1 locked down.
 * Locks late in the dwell and releases only once the car has settled.
 */
export function restraintLock(t: number): number {
  const c = cycleTime(t);

  if (c < T_DWELL_END) {
    return smoothstep((c / PHASE_DWELL_BOTTOM - 0.45) / 0.45);
  }
  if (c < T_BRAKE_END) return 1;

  const s = (c - T_BRAKE_END) / PHASE_SETTLE;
  return 1 - smoothstep((s - 0.55) / 0.45);
}

/**
 * Tiny structural tremor through the fall and the braking, so the mast reads as
 * a working machine. Amplitude is deliberately sub-decimetre — it is a detail,
 * not a physics simulation.
 */
export function structuralShake(t: number): number {
  const phase = ridePhase(t);
  if (phase !== "FALLING" && phase !== "BRAKING" && phase !== "SETTLING") return 0;

  const intensity = phase === "BRAKING" ? 1 : phase === "SETTLING" ? 0.35 : 0.45;
  return Math.sin(t * 46) * 0.035 * intensity;
}
