/**
 * Geometry and pacing for the employee journey.
 *
 * Every number here is either a placement the park layout left free, or a rate
 * chosen so the whole 9:00-to-work-start story plays out in a watchable loop.
 * Nothing in this file touches an existing ride: the gate sits outside the
 * train loop, and the food court sits in the one interior pocket that clears
 * every ride footprint, the rails, the plaza AND every ride's sightline from
 * the main gate. See scripts/verify-journey.ts, which re-derives all of that.
 */

import { EMPLOYEE_DATASET } from "./dataset";

/** The single main entrance. Every employee enters the park through this gate. */
export const GATE_X = 70;
export const GATE_Z = 620;

/** Clear opening between the two pillars, in world units. */
/*
 * Gate dimensions, at the scale a person actually meets them. The opening was
 * 104 m wide — the span of a stadium, not a gate — which is a large part of
 * why the entrance dwarfed the park behind it. Twelve turnstile lanes across
 * a 26 m frontage is what a real venue uses to admit a workforce.
 */
export const GATE_OPENING = 26;
export const GATE_PILLAR_HALF = 3.2;
export const GATE_PILLAR_HEIGHT = 10.5;
/** Underside of the arch beam — well over head height for the walk-through. */
export const GATE_ARCH_Y = 10.5;
export const GATE_HEIGHT = 16.5;

/** Where employees appear from the outside world, and their first step inside. */
export const SPAWN_Z = 790;
export const GATE_INNER_Z = 570;

/** One walking lane per turnstile, so arrivals fan out instead of queueing on one line. */
export const LANE_COUNT = 9;
export const LANE_SPACING = 2.4;

/**
 * The food court. Chosen by scanning the park interior for the point that
 * maximises clearance from every ride box, the train rails and the plaza while
 * staying inside the train loop and off every ride's sightline from the gate.
 */
export const FOOD_COURT_CENTER: [number, number] = [208, 464];
export const FOOD_COURT_HALF = 34;
/**
 * The court is laid out in its own local frame — +x to its right, +z toward
 * the gate — and then rotated to face the main entrance. The walkers and the
 * furniture both read these numbers, so a diner always ends up at a real table.
 */
export const FOOD_COURT_FACING = Math.atan2(
  GATE_X - FOOD_COURT_CENTER[0],
  GATE_Z - FOOD_COURT_CENTER[1],
);

/**
 * Local-space table centres inside the court.
 *
 * A real café terrace, laid out at a real table pitch — 3.4 m between centres
 * gives a person room to pull a chair out and walk behind it. The tables were
 * previously 12 m apart, which is what happens when furniture is sized for
 * 4 m-tall people.
 */
const TABLE_COLS = 5;
const TABLE_ROWS = 4;
const TABLE_PITCH_X = 3.6;
const TABLE_PITCH_Z = 3.4;

export const FOOD_COURT_TABLES: [number, number][] = Array.from(
  { length: TABLE_COLS * TABLE_ROWS },
  (_, i) => {
    const col = i % TABLE_COLS;
    const row = Math.floor(i / TABLE_COLS);
    return [
      (col - (TABLE_COLS - 1) / 2) * TABLE_PITCH_X,
      6 + (row - (TABLE_ROWS - 1) / 2) * TABLE_PITCH_Z,
    ] as [number, number];
  },
);

/** Local-space entry point, on the gate-facing edge of the terrace. */
export const FOOD_COURT_DOOR_LOCAL: [number, number] = [0, 22];

/** Turn a point in the court's local frame into world x/z. */
export function foodCourtToWorld(local: readonly [number, number]): [number, number] {
  const c = Math.cos(FOOD_COURT_FACING);
  const s = Math.sin(FOOD_COURT_FACING);
  // Three.js rotation about +Y: x' = x*cos + z*sin, z' = -x*sin + z*cos.
  return [
    FOOD_COURT_CENTER[0] + local[0] * c + local[1] * s,
    FOOD_COURT_CENTER[1] - local[0] * s + local[1] * c,
  ];
}

/** Where employees step in and out of the court, in world x/z. */
export const FOOD_COURT_DOOR: [number, number] = foodCourtToWorld(FOOD_COURT_DOOR_LOCAL);

/**
 * Simulated minutes per real second at 1x.
 *
 * One-sixtieth: at 1x the clock runs in real time, which is the only rate at
 * which a 1.35 m/s walk looks like a walk. Watching a whole morning at real
 * time takes a real morning, so the speed control carries the load — see
 * SPEED_OPTIONS in clock.ts. The pace of the world is honest at 1x and merely
 * fast-forwarded above it; nobody is ever teleported to keep up.
 */
export const SIM_MINUTES_PER_SECOND = 1 / 60;

/**
 * Metres a walking employee covers per simulated minute.
 *
 * 81 m/min is 1.35 m/s — an unhurried adult walking pace, and the same figure
 * declared in `HUMAN.walkSpeed`. Journey leg durations are derived from this
 * and the real distance, so the timings in the panel are the timings you watch.
 */
export const WALK_UNITS_PER_MINUTE = 81;

/**
 * The fastest any employee is allowed to walk: 114 m/min is 1.9 m/s, a brisk
 * power-walk. The dataset fixes both check-in and actual work start, so an
 * employee with a tight budget (EMP029 has six minutes gate-to-desk) walks
 * faster than the base pace — but never faster than a human. If a row cannot
 * be honoured even at this pace the journey builder throws rather than letting
 * anyone sprint or teleport.
 */
export const WALK_UNITS_PER_MINUTE_MAX = 114;

/** Minutes spent at the gate being checked in before stepping into the park. */
export const CHECK_IN_DWELL = 0.6;

/**
 * Queue behaviour outside the gate. Everyone pauses briefly at the queue line
 * before their turn (so arrivals visibly wait rather than gliding straight
 * through), and anyone whose lane is still busy stands this far behind the
 * person ahead — human queue spacing, not a shared point.
 */
export const QUEUE_WAIT_MIN = 0.5;
export const QUEUE_WAIT_SPAN = 0.8;
export const QUEUE_SPACING = 0.9;

/**
 * How long a food-court visit lasts, in simulated minutes (brief: "a
 * configurable amount of simulation time. Example: 2-5 minutes"). A visit can
 * be cut below the maximum when the employee's own work-start time leaves no
 * room for a long break — the dataset always wins.
 */
export const FOOD_COURT_DWELL_MIN = 2;
export const FOOD_COURT_DWELL_MAX = 5;

/** Check-in window, as minutes-of-day. 9:00 AM to 10:30 AM. */
export const CHECK_IN_OPEN = 9 * 60;
export const CHECK_IN_CLOSE = 10 * 60 + 30;

/**
 * Check-in colour bands (distinct from the delay classification the rides use).
 * Exactly as the brief specifies: GREEN 9:00-9:29, YELLOW 9:30-9:59,
 * RED 10:00-10:30.
 */
export const CHECK_IN_BANDS = {
  greenEnd: 9 * 60 + 30,
  yellowEnd: 10 * 60,
};

/**
 * How many employees are in the simulation: the size of the supplied dataset,
 * never a number of our own.
 */
export const EMPLOYEE_COUNT = EMPLOYEE_DATASET.length;

/** Share of employees who stop at the food court on the way in. */
export const FOOD_COURT_SHARE = 0.35;

/** Quiet margin either side of the busiest part of the day, in minutes. */
export const LOOP_LEAD_IN = 3;
export const LOOP_TAIL = 10;
