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

/**
 * The single main entrance. Every employee enters the park through this gate.
 *
 * IT STEPPED BACK WITH THE PARK, from z = 620 to z = 760. Every ride is now
 * built to one common height; the layout solver spread the five to fit them,
 * the deepest of them now stands at z = 484 rather than z = 290, and the
 * railway that goes round the outside of all of them was refitted to match.
 * At 620 the gate was no longer outside that railway — it was inside the loop,
 * with the rails running between the entrance and the park.
 *
 * A gate inside the railway is not an entrance, so the entrance moved out.
 * Everything that reads the gate — the approach road, the spawn line, the
 * walking lanes, the entrance camera, the bearings the attractions are placed
 * on — is derived from these two numbers and follows them out.
 */
export const GATE_X = 70;
export const GATE_Z = 760;

/**
 * THE MAIN GATE — the Peacock Gate.
 *
 * A 100 m tower frontage — 148 m counting the arcade wings — rising 47 m to the
 * finials over a 62 m opening: nearly twelve employees tall and fifteen
 * abreast, against the 80 m by 36 m of the gate it replaces.
 *
 * The rule these are chosen against has not moved — an arch between six and
 * twelve drawn employees tall, so the entrance reads as an entrance without
 * competing with the rides behind it. This sits at 11.5, near the top of that
 * band, because the gate is meant to be the first thing the eye lands on and
 * the Drop Tower behind it is still more than twice its height.
 *
 * The drum stops at 26 m and the arch springs from it there; the remaining 21 m
 * is the onion dome and its finial, which is why the tower height and the gate
 * height are two different numbers.
 *
 * The opening is what the walk-through needs plus ceremony: nine walking lanes
 * at 2.4 m occupy only the central 21.6 m, so the extra span is architecture,
 * not traffic.
 */
export const GATE_OPENING = 62;
export const GATE_PILLAR_HALF = 9.5;
export const GATE_PILLAR_HEIGHT = 26;
/** Underside of the arch beam — well over head height for the walk-through. */
export const GATE_ARCH_Y = 26;
export const GATE_HEIGHT = 47;

/** Where employees appear from the outside world, and their first step inside. */
export const SPAWN_Z = 930;
export const GATE_INNER_Z = 710;

/** One walking lane per turnstile, so arrivals fan out instead of queueing on one line. */
export const LANE_COUNT = 9;
export const LANE_SPACING = 2.4;

/**
 * The food court. Chosen by scanning the park interior for the point that
 * maximises clearance from every ride box, the train rails and the plaza while
 * staying inside the train loop and off every ride's sightline from the gate.
 */
export const FOOD_COURT_CENTER: [number, number] = [208, 464];
/*
 * The court's keep-out half-extent: how much ground around the centre the
 * planting, the ride signs and the walked routes all stay off.
 *
 * Up from 34 with the pavilion, and now from 38 to 41 with its lengthening. The
 * ceiling on it is the park railway — the nearest rail runs 57 m from the court
 * centre, and verify-journey.ts requires 15 m of daylight between the rail and
 * the court's edge — so 41 is within a metre of the largest this can honestly
 * be while the train still has its own track to itself. The building grew along
 * its frontage and this had to grow with it, or the planting and the walked
 * routes would have been laid straight through the new wings.
 */
export const FOOD_COURT_HALF = 41;
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
 * FIVE TABLES OF FOUR — EXACTLY TWENTY SEATS, which is the number the user
 * asked the food court to hold. It was twenty tables of four, eighty seats, in
 * a five-by-four block; eighty was four times what the court has ever needed
 * (the busiest minute of the whole morning puts seven people inside) and the
 * block filled the terrace edge to edge with no room to walk between the files.
 *
 * They are set as ONE FILE ACROSS THE TERRACE, at a 6 m pitch, centred on the
 * court's own axis. That is the arrangement the lengthened building asks for:
 * the tables run along the frontage, in front of the serving kiosks, and the
 * terrace keeps a clear 8 m aisle in front of them and another behind, so a
 * diner walks in from the door, down an open aisle, and sits without squeezing
 * past anybody. Six metres between centres is wide by café standards and
 * deliberately so — these are parasol tables on an open terrace, not a canteen.
 */
const TABLE_COLS = 5;
const TABLE_ROWS = 1;
const TABLE_PITCH_X = 6.0;
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

/**
 * How far each table is turned, and the four chairs set around it.
 *
 * These numbers used to live only inside `FoodCourt.tsx`, which meant the
 * furniture the eye sees and the seat a walker is sent to were described in two
 * different places — a diner could be routed to a chair that had been rotated
 * out from under them. Both now read this, so the view and the simulation
 * cannot drift apart.
 */
export const TABLE_TURN = (index: number) => (index % 7) * 0.21;
/** Chairs sit this far out from the table centre, on the diagonals. */
export const CHAIR_RADIUS = 0.72;
export const CHAIRS_PER_TABLE = 4;
export const chairAngle = (k: number) => (k / CHAIRS_PER_TABLE) * Math.PI * 2 + Math.PI / 4;

export interface FoodCourtChair {
  /** Index of the table this chair belongs to. */
  table: number;
  /** 0-3 around that table. */
  seat: number;
  /** Seat position in the court's local frame. */
  local: [number, number];
  /** Local-frame heading that faces the diner in towards the table. */
  facing: number;
}

/**
 * Every chair in the court — five tables of four, TWENTY seats in all.
 *
 * A delayed employee is sent to one of THESE, not to a table centre. Sitting
 * people down on the table itself is what the journey used to do, and with more
 * than one diner per table they ended up inside one another.
 *
 * Twenty is comfortably more than the court ever has to hold: the journey
 * builder hands out the first free chair and releases it when the diner leaves,
 * and the busiest minute of the simulated morning has seven people inside.
 */
export const FOOD_COURT_CHAIRS: FoodCourtChair[] = FOOD_COURT_TABLES.flatMap(
  ([tx, tz], table) => {
    const turn = TABLE_TURN(table);
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    return Array.from({ length: CHAIRS_PER_TABLE }, (_, seat) => {
      const a = chairAngle(seat);
      /* The chair's offset in the table's own frame, then turned with the table. */
      const ox = Math.cos(a) * CHAIR_RADIUS;
      const oz = Math.sin(a) * CHAIR_RADIUS;
      return {
        table,
        seat,
        local: [tx + ox * c + oz * s, tz - ox * s + oz * c] as [number, number],
        /* Face back towards the table centre. */
        facing: Math.atan2(-(ox * c + oz * s), -(-ox * s + oz * c)),
      };
    });
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
 * The shortest sit-down that still reads as one, in simulated minutes.
 *
 * A food-court visit is no longer a configurable dwell: it lasts exactly as
 * long as the employee's own delay leaves once the walking is paid for, so the
 * time on the seat IS the delay being served. This floor exists only so the
 * very shortest delays still show a person sitting rather than touching the
 * chair and standing straight back up. Where a delay is too short to cover the
 * walk plus this floor, the employee walks faster; where even that is not
 * enough, the journey builder reports it rather than skipping the visit.
 */
export const MIN_SIT_MINUTES = 1.5;

/**
 * Check-in window, as minutes-of-day. The attendance sheet's own span, from
 * the earliest arrival (9:33 AM) to the latest (10:45 AM), with an hour of
 * headroom either side so a future roster is not rejected for being early.
 */
export const CHECK_IN_OPEN = 9 * 60;
export const CHECK_IN_CLOSE = 11 * 60;

/**
 * How many employees are in the simulation: the size of the supplied dataset,
 * never a number of our own.
 */
export const EMPLOYEE_COUNT = EMPLOYEE_DATASET.length;

/** Quiet margin either side of the busiest part of the day, in minutes. */
export const LOOP_LEAD_IN = 3;
export const LOOP_TAIL = 10;
