import {
  BRAKE_ACCEL,
  BRAKE_HOLD_SPEED,
  CREEP_SPEED,
  DRIVE_ACCEL,
  DRIVE_ARC,
  GRAVITY,
  LOAD_SECONDS,
  LOOP_RADIUS,
  LOOP_REVOLUTIONS,
  TOP_SPEED,
  TRAIN_CM_RADIUS,
  UNLOAD_SECONDS,
} from "./constants";

/**
 * HOW THE TRAIN GETS ROUND — integrated, not animated.
 *
 * A Super Loop is the one fairground machine whose whole character is a
 * CONTROL problem rather than a shape. The train is captive on a closed
 * circular rail with wheels above and below it, so it cannot fall off and does
 * not need to be going fast enough to hold itself on at the top. What it does
 * need is the ENERGY to get up there, and no drive can put that in from a
 * standstill in one push. So rubber tyres at the bottom of the loop shove it a
 * little every time it comes through, forward only; it swings higher up each
 * side on every pass; and when it finally has enough it carries straight over
 * the top and runs the loop. Then the same tyres take the energy back out and
 * it settles at the bottom to be unloaded.
 *
 * ALL OF THAT IS ONE INTEGRATION, run once when this module loads.
 *
 *     theta'' = -(g / R) sin theta  +  a_tangential / R
 *
 * — a pendulum on a rigid rod, with the drive tyres as a tangential force that
 * is only there while the train is in the arc at the bottom. It is stepped by
 * RK4 into a table, and the table is what the frame loop reads and what
 * scripts/verify-super-looper.ts sweeps. So the ride that is checked is the
 * ride that is drawn, and the numbers below — how many swings the pumping
 * takes, how fast it comes through the bottom, how long the whole cycle is —
 * are RESULTS. None of them is typed in anywhere.
 *
 * WHY NOT A CLOSED FORM. The pendulum solutions used elsewhere in this park
 * (the UFO Pendulum's, the Dragon Ship's) work because those machines conserve
 * energy: one amplitude, one elliptic integral, done. This one changes its
 * energy on every pass by design, so every swing is a different pendulum. An
 * integration is not a shortcut here; it is the honest way to solve a driven
 * machine, and the energy identity is checked against it afterwards over the
 * whole coasting phase, where energy IS conserved.
 */

/**
 * Energy per unit mass, with the train's lowest centre of mass as the datum.
 *
 * The two radii are not interchangeable and this is where it shows: every part
 * of the train runs at the RAIL's radius, so the kinetic term uses that, while
 * gravity acts on the centre of mass, which sits inside the circle — so the
 * potential term uses TRAIN_CM_RADIUS. See constants.ts.
 */
export function specificEnergy(theta: number, omega: number): number {
  const v = omega * LOOP_RADIUS;
  return 0.5 * v * v + GRAVITY * TRAIN_CM_RADIUS * (1 - Math.cos(theta));
}

/** What it takes to cross the top still doing TOP_SPEED. */
export const ENERGY_TO_LOOP =
  0.5 * TOP_SPEED * TOP_SPEED + GRAVITY * TRAIN_CM_RADIUS * 2;

/** Angle wrapped to (-pi, pi] — how far the train is from the bottom. */
function fromBottom(theta: number): number {
  let a = theta % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

type Mode = "pump" | "run" | "brake" | "creep" | "stopped";

/**
 * The tangential acceleration the tyres apply at this instant.
 *
 * They only reach the train in the arc at the bottom, they only ever push
 * FORWARD — which is what makes the ride always launch the same way round
 * rather than whichever way it happened to be going — and in braking they only
 * ever pull back.
 */
function driveAt(theta: number, omega: number, mode: Mode): number {
  if (Math.abs(fromBottom(theta)) > DRIVE_ARC) return 0;
  if (mode === "pump") return omega >= 0 ? DRIVE_ACCEL : 0;
  if (mode === "brake") return omega > 0 ? -BRAKE_ACCEL : omega < 0 ? BRAKE_ACCEL : 0;
  return 0;
}

function accel(theta: number, omega: number, mode: Mode): number {
  /*
   * Angular momentum about the loop's centre: the train's inertia is set by
   * the RAIL's radius and gravity's moment by the centre of mass's, so the
   * restoring term carries the ratio of the two.
   */
  return (
    ((-GRAVITY * TRAIN_CM_RADIUS) / (LOOP_RADIUS * LOOP_RADIUS)) * Math.sin(theta) +
    driveAt(theta, omega, mode) / LOOP_RADIUS
  );
}

const DT = 0.004;
const MAX_STEPS = 120_000;

export interface RunSample {
  theta: number;
  omega: number;
  mode: Mode;
}

/** The whole run, from the first shove to the train settling back at the bottom. */
function integrate(): RunSample[] {
  const out: RunSample[] = [{ theta: 0, omega: 0, mode: "pump" }];
  let theta = 0;
  let omega = 0;
  let mode: Mode = "pump";
  let launchTheta = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    /* Classic RK4 on (theta, omega). */
    const k1t = omega;
    const k1o = accel(theta, omega, mode);
    const k2t = omega + (DT / 2) * k1o;
    const k2o = accel(theta + (DT / 2) * k1t, omega + (DT / 2) * k1o, mode);
    const k3t = omega + (DT / 2) * k2o;
    const k3o = accel(theta + (DT / 2) * k2t, omega + (DT / 2) * k2o, mode);
    const k4t = omega + DT * k3o;
    const k4o = accel(theta + DT * k3t, omega + DT * k3o, mode);

    theta += (DT / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    omega += (DT / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);

    if (mode === "pump" && omega > 0 && specificEnergy(theta, omega) >= ENERGY_TO_LOOP) {
      /* Enough to get over. The tyres come off it and it coasts round. */
      mode = "run";
      launchTheta = theta;
    } else if (mode === "run" && theta - launchTheta >= Math.PI * 2 * LOOP_REVOLUTIONS) {
      mode = "brake";
    } else if (
      mode === "brake" &&
      Math.abs(omega) * LOOP_RADIUS < BRAKE_HOLD_SPEED &&
      Math.abs(fromBottom(theta)) < DRIVE_ARC
    ) {
      /*
       * THE BRAKE GRIPS. Once the train is slow and in the tyres' own arc,
       * they hold it rather than letting it rock to a stop — and then jog it
       * round to the platform, which is the `creep` below. The dynamics stop
       * here because the machine takes over from gravity, and pretending
       * otherwise would mean four minutes of decaying oscillation that the
       * real ride does not have.
       */
      mode = "creep";
    }

    if (mode === "creep") {
      const target = Math.round(theta / (Math.PI * 2)) * Math.PI * 2;
      const remaining = target - theta;
      const step = (CREEP_SPEED / LOOP_RADIUS) * DT;
      if (Math.abs(remaining) <= step) {
        theta = target;
        omega = 0;
        mode = "stopped";
        out.push({ theta, omega, mode });
        break;
      }
      omega = Math.sign(remaining) * (CREEP_SPEED / LOOP_RADIUS);
      theta += omega * DT;
    }

    out.push({ theta, omega, mode });
  }

  return out;
}

const RUN: RunSample[] = integrate();

/** How long the machine takes from the first shove to standing still again. */
export const RUN_SECONDS = (RUN.length - 1) * DT;
/** Dwell, run, dwell. The whole thing repeats on this. */
export const CYCLE_SECONDS = LOAD_SECONDS + RUN_SECONDS + UNLOAD_SECONDS;

/* ------------------------------------------------------------------ *
 * WHAT THE INTEGRATION CAME OUT AT — results, not settings
 * ------------------------------------------------------------------ */

function sampleAt(seconds: number): RunSample {
  const t = seconds / DT;
  if (t <= 0) return RUN[0];
  if (t >= RUN.length - 1) return RUN[RUN.length - 1];
  const i = Math.floor(t);
  const f = t - i;
  const a = RUN[i];
  const b = RUN[i + 1];
  return {
    theta: a.theta + (b.theta - a.theta) * f,
    omega: a.omega + (b.omega - a.omega) * f,
    mode: a.mode,
  };
}

/** Where the lead car is, and how fast, at a moment in the whole cycle. */
export function trainStateAt(seconds: number): {
  time: number;
  phase: Mode | "load" | "unload";
  theta: number;
  omega: number;
  speed: number;
  height: number;
} {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;
  let sample: RunSample;
  let phase: Mode | "load" | "unload";
  if (t < LOAD_SECONDS) {
    sample = RUN[0];
    phase = "load";
  } else if (t < LOAD_SECONDS + RUN_SECONDS) {
    sample = sampleAt(t - LOAD_SECONDS);
    phase = sample.mode;
  } else {
    sample = RUN[RUN.length - 1];
    phase = "unload";
  }
  return {
    time: t,
    phase,
    theta: sample.theta,
    omega: sample.omega,
    speed: Math.abs(sample.omega) * LOOP_RADIUS,
    height: LOOP_RADIUS * (1 - Math.cos(sample.theta)),
  };
}

/** How many times the train swung up and back before it could get over. */
export const PUMP_SWINGS = (() => {
  let crossings = 0;
  for (let i = 1; i < RUN.length; i++) {
    if (RUN[i].mode !== "pump") break;
    if (RUN[i - 1].omega > 0 && RUN[i].omega <= 0) crossings++;
  }
  return crossings;
})();

/** How long the pumping took, and when the loop proper starts. */
export const PUMP_SECONDS = RUN.findIndex((s) => s.mode === "run") * DT;
export const BRAKE_SECONDS =
  RUN_SECONDS - RUN.findIndex((s) => s.mode === "brake") * DT;
/** How long the tyres take to jog the train back onto the platform. */
export const CREEP_SECONDS = RUN_SECONDS - RUN.findIndex((s) => s.mode === "creep") * DT;

/** The fastest the train ever goes, and the speed it crosses the top at. */
export const MAX_SPEED = Math.max(...RUN.map((s) => Math.abs(s.omega))) * LOOP_RADIUS;
export const HIGHEST_SWING = Math.max(
  ...RUN.filter((s) => s.mode === "pump").map((s) => 1 - Math.cos(s.theta)),
) * LOOP_RADIUS;
export const TOP_PASS_SPEED = (() => {
  let slowest = Infinity;
  for (const s of RUN) {
    if (s.mode !== "run") continue;
    if (Math.abs(Math.abs(fromBottom(s.theta)) - Math.PI) < 0.02) {
      slowest = Math.min(slowest, Math.abs(s.omega) * LOOP_RADIUS);
    }
  }
  return slowest;
})();

/** The samples themselves, for the verify script to sweep. */
export const RUN_SAMPLES: readonly RunSample[] = RUN;
export const RUN_STEP = DT;
