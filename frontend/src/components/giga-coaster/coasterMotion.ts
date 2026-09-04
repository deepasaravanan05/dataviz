import {
  BRAKE_DECEL,
  CREST_SPEED,
  CREST_Y,
  GRAVITY,
  LIFT_SPEED,
  LOAD_SECONDS,
  STATION_SPEED,
  UNLOAD_SECONDS,
} from "./constants";
import {
  CREST_DISTANCE,
  TRACK_LENGTH,
  heightAtDistance,
  planRadiusAt,
} from "./trackCurve";

/**
 * HOW THE TRAIN GETS ROUND — run, not animated.
 *
 * A roller coaster is the one ride whose motion needs no invention at all. A
 * chain drags the train up the hill at a crawl, lets go at the crest, and from
 * there the train is a bead on a wire: its speed anywhere is whatever energy
 * it has left.
 *
 *     v(y) = sqrt(v_crest^2 + 2 g (CREST_Y - y))
 *
 * That is the whole model, and it is what makes the ride read as a coaster —
 * the train crawls over the crest, is flung through the valley, slows almost
 * to nothing over each airtime hill and accelerates out of it. A curve swept
 * at a constant rate looks nothing like it.
 *
 * NO DRAG TERM, and that is a deliberate simplification rather than an
 * oversight. A real train loses perhaps a tenth of its energy to friction over
 * a circuit and is designed with the headroom to arrive home anyway; modelling
 * the loss without modelling that headroom would leave the train quietly
 * stranded on the last hill. So it runs frictionless and the BRAKE RUN takes
 * the energy out at the end, where a real one does.
 *
 * THE PHASES, in the order an operator runs them:
 *
 *   LOAD    stopped in the station, riders getting in.
 *   LIFT    the chain, at a constant crawl, to the crest.
 *   COAST   gravity, all the way round to the brake run.
 *   BRAKE   pulled down to a walking pace on the home stretch.
 *   CREEP   back into the station, and stop.
 *   UNLOAD  stopped again.
 *
 * It is integrated once when this module loads, into a table the frame loop
 * reads and the verify script sweeps — so the ride that is checked is the ride
 * that is drawn, and every number below is a RESULT rather than a setting.
 */

/**
 * Where the brake run begins — SOLVED from what it has to stop, not chosen.
 *
 * The train arrives off the last hill doing whatever the energy equation says,
 * and pulling it down to a station crawl at BRAKE_DECEL takes `(v² - v_s²) /
 * 2a` of track. Given 78 m by hand, the brakes ran out of track and the train
 * came back into the station at a hundred and thirty km/h. So the run is as
 * long as the stop needs, with a quarter more in hand — which is what a real
 * one has.
 */
export const BRAKE_DISTANCE = (() => {
  /* Where the last hill leaves the train, near enough: the home stretch. */
  const arrival = coastingSpeedAt(TRACK_LENGTH - 40);
  const needed = (arrival * arrival - STATION_SPEED * STATION_SPEED) / (2 * BRAKE_DECEL);
  return TRACK_LENGTH - needed * 1.25;
})();

/** The speed the energy equation gives at a distance along the track. */
export function coastingSpeedAt(distance: number): number {
  const drop = CREST_Y - heightAtDistance(distance);
  return Math.sqrt(CREST_SPEED * CREST_SPEED + 2 * GRAVITY * Math.max(0, drop));
}

/**
 * WHERE THE TRIM COMES ON, and how hard — both solved from the layout.
 *
 * The rule is the honest one: the trim is placed where the circuit can no
 * longer take the speed. Walking forward from the crest, the first point where
 * the plan radius and the coasting speed together would pull more than
 * MAX_LATERAL_GEE is where the layout runs out — the trim goes on just before
 * it, and it is set so that the tightest corner left on the circuit is exactly
 * at that limit and no more.
 *
 * So the drop keeps every metre per second it is worth, the ride keeps its
 * headline speed, and nothing after the trim exceeds a force a person can take.
 * Move a control point and both numbers follow.
 */
export const MAX_LATERAL_GEE_ALLOWED = 4;

export const TRIM_DISTANCE = (() => {
  for (let d = CREST_DISTANCE; d < TRACK_LENGTH; d += 1) {
    const radius = planRadiusAt(d);
    if (radius === Infinity) continue;
    const v = coastingSpeedAt(d);
    if ((v * v) / radius > MAX_LATERAL_GEE_ALLOWED * GRAVITY) return Math.max(CREST_DISTANCE, d - 8);
  }
  return TRACK_LENGTH;
})();

/** The height the train is trimmed at, which sets its energy from there on. */
const TRIM_Y = heightAtDistance(TRIM_DISTANCE);

/**
 * And the speed it is trimmed TO: whatever the tightest corner still to come
 * will take at the allowed force, worked back through the energy equation to
 * the trim point.
 */
export const TRIM_SPEED = (() => {
  let slowest = Infinity;
  for (let d = TRIM_DISTANCE; d < TRACK_LENGTH; d += 1) {
    const radius = planRadiusAt(d);
    if (radius === Infinity) continue;
    /* The most this corner may be taken at... */
    const corner = Math.sqrt(MAX_LATERAL_GEE_ALLOWED * GRAVITY * radius);
    /* ...and what that means back at the trim point, which is higher or lower. */
    const drop = TRIM_Y - heightAtDistance(d);
    const atTrim = Math.sqrt(Math.max(0, corner * corner - 2 * GRAVITY * Math.max(0, drop)));
    slowest = Math.min(slowest, atTrim);
  }
  return Math.max(4, Math.min(slowest, coastingSpeedAt(TRIM_DISTANCE)));
})();

/** What the energy equation gives once the trim has taken its bite. */
function trimmedSpeedAt(distance: number): number {
  const drop = TRIM_Y - heightAtDistance(distance);
  return Math.sqrt(TRIM_SPEED * TRIM_SPEED + 2 * GRAVITY * Math.max(0, drop));
}

type Phase = "load" | "lift" | "coast" | "brake" | "creep" | "unload";

const DT = 0.01;
const MAX_STEPS = 60_000;

export interface RunSample {
  distance: number;
  speed: number;
  phase: Phase;
}

/** The whole run, from the chain taking hold to the train stopping again. */
function integrate(): RunSample[] {
  const out: RunSample[] = [{ distance: 0, speed: 0, phase: "lift" }];
  let distance = 0;
  let speed = LIFT_SPEED;
  let phase: Phase = "lift";

  for (let step = 0; step < MAX_STEPS; step++) {
    if (phase === "lift") {
      speed = LIFT_SPEED;
      if (distance >= CREST_DISTANCE) phase = "coast";
    }
    if (phase === "coast") {
      speed = coastingSpeedAt(distance);
      if (distance >= TRIM_DISTANCE) speed = Math.min(speed, trimmedSpeedAt(distance));
      if (distance >= BRAKE_DISTANCE) phase = "brake";
    }
    if (phase === "brake") {
      speed = Math.max(STATION_SPEED, speed - BRAKE_DECEL * DT);
      if (speed <= STATION_SPEED) phase = "creep";
    }
    if (phase === "creep") {
      speed = STATION_SPEED;
      if (distance >= TRACK_LENGTH) {
        /* Home. Park it exactly on the mark it started from. */
        out.push({ distance: TRACK_LENGTH, speed: 0, phase: "unload" });
        break;
      }
    }

    distance += speed * DT;
    if (distance >= TRACK_LENGTH) {
      /* Home, however it got here. Park it exactly on the mark it started from. */
      out.push({ distance: TRACK_LENGTH, speed: 0, phase: "unload" });
      break;
    }
    out.push({ distance, speed, phase });
  }

  return out;
}

const RUN: RunSample[] = integrate();

/** How long the circuit takes, from the chain to the stop. */
export const RUN_SECONDS = (RUN.length - 1) * DT;
/** Dwell, run, dwell. The whole thing repeats on this. */
export const CYCLE_SECONDS = LOAD_SECONDS + RUN_SECONDS + UNLOAD_SECONDS;

function sampleAt(seconds: number): RunSample {
  const t = seconds / DT;
  if (t <= 0) return RUN[0];
  if (t >= RUN.length - 1) return RUN[RUN.length - 1];
  const i = Math.floor(t);
  const f = t - i;
  const a = RUN[i];
  const b = RUN[i + 1];
  return {
    distance: a.distance + (b.distance - a.distance) * f,
    speed: a.speed + (b.speed - a.speed) * f,
    phase: a.phase,
  };
}

/** Where the train is, and how fast, at a moment in the whole cycle. */
export function trainStateAt(seconds: number): {
  time: number;
  phase: Phase;
  distance: number;
  speed: number;
  height: number;
} {
  const t = ((seconds % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;
  let sample: RunSample;
  let phase: Phase;
  if (t < LOAD_SECONDS) {
    sample = { distance: 0, speed: 0, phase: "load" };
    phase = "load";
  } else if (t < LOAD_SECONDS + RUN_SECONDS) {
    sample = sampleAt(t - LOAD_SECONDS);
    phase = sample.phase;
  } else {
    sample = { distance: TRACK_LENGTH, speed: 0, phase: "unload" };
    phase = "unload";
  }
  return {
    time: t,
    phase,
    distance: sample.distance,
    speed: sample.speed,
    height: heightAtDistance(sample.distance),
  };
}

/**
 * WHERE THE TRAIN IS `seconds` AFTER THE BRAKES CAME OFF.
 *
 * The circuit, and nothing but the circuit: the chain, the drop, the trim and
 * the brake run, wrapped at the length of the run so that the train is back on
 * its station mark at `RUN_SECONDS` exactly as it was at zero.
 *
 * THIS IS THE FUNCTION THE PARK'S RIDE OPERATIONS USE, and `trainStateAt`
 * above is not. The difference is what happens between circuits. `trainStateAt`
 * carries this ride's own LOAD and UNLOAD dwell, which is right for an
 * attraction that simply runs; the Giga Coaster is a department ride now, and
 * how long it stands in its station is decided by the employees walking up to
 * it — `rideOps.ts` stops it for each arrival, holds it while they climb in,
 * and releases it. Carrying a dwell of its own on top of that would have the
 * train standing still in the middle of somebody's ride.
 *
 * The drawn train and the simulated seats both read this one function, so they
 * cannot disagree about where a car is.
 */
export function runDistanceAt(seconds: number): number {
  const t = ((seconds % RUN_SECONDS) + RUN_SECONDS) % RUN_SECONDS;
  return sampleAt(t).distance;
}

/* ------------------------------------------------------------------ *
 * WHAT THE RUN CAME OUT AT — results, not settings
 * ------------------------------------------------------------------ */

export const LIFT_SECONDS = RUN.findIndex((s) => s.phase !== "lift") * DT;
export const TOP_SPEED = Math.max(...RUN.map((s) => s.speed));
export const BRAKE_SECONDS =
  RUN_SECONDS - RUN.findIndex((s) => s.phase === "brake") * DT;
/**
 * The speed the train ACTUALLY has at each point of the circuit.
 *
 * Not the coasting speed: on the lift the chain holds it to a crawl and on the
 * brake run the brakes pull it down, and both matter to anything that asks
 * "how fast is the train here" — the banking most of all. A corner taken at
 * two metres a second needs no bank at all, and treating it as though the
 * train arrived at coasting speed banks the station's own curve on its side.
 *
 * The train passes each point once per circuit, so the run table maps
 * distance to speed directly.
 */
const SPEED_BINS = 2048;
const SPEED_BY_DISTANCE: number[] = (() => {
  const out = new Array<number>(SPEED_BINS).fill(0);
  for (const s of RUN) {
    const bin = Math.min(SPEED_BINS - 1, Math.floor((s.distance / TRACK_LENGTH) * SPEED_BINS));
    out[bin] = Math.max(out[bin], s.speed);
  }
  /* Fill any bin the integration stepped over. */
  for (let i = 1; i < SPEED_BINS; i++) if (out[i] === 0) out[i] = out[i - 1];
  return out;
})();

export function speedAtDistance(distance: number): number {
  const d = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  return SPEED_BY_DISTANCE[Math.min(SPEED_BINS - 1, Math.floor((d / TRACK_LENGTH) * SPEED_BINS))];
}

/** The samples themselves, for the verify script to sweep. */
export const RUN_SAMPLES: readonly RunSample[] = RUN;
export const RUN_STEP = DT;
