import {
  BACK_PANEL_HEIGHT,
  CANOPY_SOFFIT_Y,
  CHAIN_LENGTH,
  CHAIR_SCALE,
  FOOTREST_DEPTH,
  FOOTREST_DROP,
  HANGER_RADIUS,
  HUB_Y,
  LAP_BAR_DROP,
  LIFT_TRAVEL,
  ROTATION_RADIANS_PER_SEC,
  SEAT_BACK_HEIGHT,
  SEAT_DEPTH,
  SEAT_THICKNESS,
  solveFlareAngle,
} from "./constants";

/**
 * THE LOAD CYCLE — the sweep going down and coming back up.
 *
 * One function of time drives the whole machine, and it is the ONLY place the
 * ride's motion is described. `FlyingChairs` reads it every frame and
 * scripts/verify-flying-chairs.ts sweeps the same function at a millisecond
 * step, so the cycle that is checked is literally the cycle that is drawn —
 * the same arrangement the seat ring already has.
 *
 * THE FIVE PHASES, in the order a fairground operator runs them:
 *
 *   LOAD    sweep at the bottom, dead still. Riders climb the ladder, cross
 *           the gallery and get into the chairs.
 *   HOIST   the sweep climbs the mast. It only starts TURNING once it is well
 *           clear of the gallery, because a chair that flares out while it is
 *           still down there is a chair going through the hand rail.
 *   CRUISE  full height, full speed. This is the ride exactly as it was before
 *           it could move up and down: same canopy height, same 4.2 rpm, same
 *           25.9° flare, same everything.
 *   LOWER   the mirror of the hoist. It has wound down to a stop before it is
 *           back within reach of the gallery.
 *   UNLOAD  down and still again; riders get out and go back down the ladder.
 *
 * HOW FAST THE CHAINS FLY OUT IS NOT ANIMATED. The flare is re-solved from the
 * conical-pendulum balance at the speed of the moment, by the same function
 * that gives the cruise angle — so the chairs hang plumb while loading, swing
 * out as the ride winds up, and arrive at exactly the documented cruise angle
 * when the ride reaches working speed. This is a quasi-static treatment: a
 * real chain also swings a little about that angle as the speed changes, and
 * that transient is not modelled. What IS modelled is where the chains sit at
 * every speed, which is what decides whether anything is struck.
 */

/* ------------------------------------------------------------------ *
 * THE TIMETABLE
 * ------------------------------------------------------------------ */

export const LOAD_SECONDS = 8;
export const HOIST_SECONDS = 12;
export const CRUISE_SECONDS = 20;
export const LOWER_SECONDS = 12;
export const UNLOAD_SECONDS = 8;

export const CYCLE_SECONDS =
  LOAD_SECONDS + HOIST_SECONDS + CRUISE_SECONDS + LOWER_SECONDS + UNLOAD_SECONDS;

const LOAD_END = LOAD_SECONDS;
const HOIST_END = LOAD_END + HOIST_SECONDS;
const CRUISE_END = HOIST_END + CRUISE_SECONDS;
const LOWER_END = CRUISE_END + LOWER_SECONDS;

/**
 * How late in the hoist the drive is engaged, and how early in the descent it
 * is dropped: a quarter of the travel at each end. The sweep is a fifth of the
 * way up the mast before a chain is allowed to leave plumb, which puts the
 * chairs some twenty metres over the gallery rail before they start to fly.
 * The margin that actually results is measured over the whole cycle by the
 * verify script rather than argued for here.
 */
export const SPIN_ENGAGE_FRACTION = 0.25;

/** Smoothstep: starts and finishes with zero rate, so nothing jerks. */
function ease(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

export type SweepPhase = "load" | "hoist" | "cruise" | "lower" | "unload";

export interface SweepState {
  time: number;
  phase: SweepPhase;
  /** 0 at the loading gallery, 1 at cruise height. */
  liftFraction: number;
  /** What the lift group is offset by: -LIFT_TRAVEL when down, 0 at cruise. */
  liftY: number;
  /** 0 stopped, 1 at working speed. */
  spin: number;
  omega: number;
  /** The chain angle the speed of this moment actually produces. */
  flare: number;
  /** The canopy soffit, and the bottom of the hub, at this moment. */
  soffitY: number;
  hubBottomY: number;
  /** The seat pan: how far out it has flown, and how high it is. */
  seatRadius: number;
  seatY: number;
}

/** The state of the sweep at a time in the cycle. Any time; it wraps. */
export function sweepAt(seconds: number): SweepState {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;

  let phase: SweepPhase;
  let liftFraction: number;
  let spin: number;

  if (t < LOAD_END) {
    phase = "load";
    liftFraction = 0;
    spin = 0;
  } else if (t < HOIST_END) {
    phase = "hoist";
    const u = (t - LOAD_END) / HOIST_SECONDS;
    liftFraction = ease(u);
    spin = ease((u - SPIN_ENGAGE_FRACTION) / (1 - SPIN_ENGAGE_FRACTION));
  } else if (t < CRUISE_END) {
    phase = "cruise";
    liftFraction = 1;
    spin = 1;
  } else if (t < LOWER_END) {
    phase = "lower";
    const u = (t - CRUISE_END) / LOWER_SECONDS;
    liftFraction = 1 - ease(u);
    spin = ease((1 - SPIN_ENGAGE_FRACTION - u) / (1 - SPIN_ENGAGE_FRACTION));
  } else {
    phase = "unload";
    liftFraction = 0;
    spin = 0;
  }

  const liftY = -LIFT_TRAVEL * (1 - liftFraction);
  const omega = ROTATION_RADIANS_PER_SEC * spin;
  const flare = spin === 0 ? 0 : solveFlareAngle(omega);

  return {
    time: t,
    phase,
    liftFraction,
    liftY,
    spin,
    omega,
    flare,
    soffitY: CANOPY_SOFFIT_Y + liftY,
    hubBottomY: HUB_Y + liftY,
    seatRadius: HANGER_RADIUS + CHAIN_LENGTH * Math.sin(flare),
    seatY: CANOPY_SOFFIT_Y + liftY - CHAIN_LENGTH * Math.cos(flare),
  };
}

/* ------------------------------------------------------------------ *
 * WHERE THE METAL OF A CHAIR ACTUALLY IS
 * ------------------------------------------------------------------ */

/**
 * The corners of a chair, in the seat's own frame, at the size chairs are
 * built. These are the same offsets `Chair.tsx` draws its parts at — the pan,
 * the top of the painted back panel, the lap bar and the footrest board — so
 * the envelope below is the real chair rather than a box around a guess.
 *
 * x runs OUTWARD along the ride's radius, y up. The chair is symmetrical
 * across the third axis and nothing on this ride is near it sideways, so the
 * envelope is taken in the radial plane.
 */
const CHAIR_CORNERS: [number, number][] = [
  [-SEAT_DEPTH / 2, SEAT_THICKNESS / 2],
  [SEAT_DEPTH / 2, SEAT_THICKNESS / 2],
  [-SEAT_DEPTH / 2, SEAT_BACK_HEIGHT + BACK_PANEL_HEIGHT],
  [SEAT_DEPTH * 0.42, LAP_BAR_DROP],
  [SEAT_DEPTH * 0.4 - FOOTREST_DEPTH / 2, -FOOTREST_DROP - 0.05],
  [SEAT_DEPTH * 0.4 + FOOTREST_DEPTH / 2, -FOOTREST_DROP - 0.05],
];

export interface ChairEnvelope {
  minRadius: number;
  maxRadius: number;
  lowestY: number;
  highestY: number;
}

/**
 * The room a chair takes up at a moment in the cycle.
 *
 * The chair is rigid and swings about its hanger, so every corner is the
 * offset above — scaled, hung a chain length down — turned by the flare of the
 * moment. Rotating the corners rather than the bounding box matters: a tilted
 * chair's footrest swings OUTWARD and UPWARD, and treating it as an upright
 * box would report it lower and further in than it is.
 */
export function chairEnvelopeAt(state: SweepState): ChairEnvelope {
  const cos = Math.cos(state.flare);
  const sin = Math.sin(state.flare);
  let minRadius = Infinity;
  let maxRadius = -Infinity;
  let lowestY = Infinity;
  let highestY = -Infinity;

  for (const [cx, cy] of CHAIR_CORNERS) {
    /* Corner, relative to the hanger eye, before the chains swing out. */
    const x = cx * CHAIR_SCALE;
    const y = cy * CHAIR_SCALE - CHAIN_LENGTH;
    /* Swung out about the hanger by the flare. */
    const radius = HANGER_RADIUS + (x * cos - y * sin);
    const height = state.soffitY + (x * sin + y * cos);
    minRadius = Math.min(minRadius, radius);
    maxRadius = Math.max(maxRadius, radius);
    lowestY = Math.min(lowestY, height);
    highestY = Math.max(highestY, height);
  }

  return { minRadius, maxRadius, lowestY, highestY };
}
