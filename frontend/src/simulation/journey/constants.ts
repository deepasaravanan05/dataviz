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
import {
  FOOD_COURT_PATH_RADIUS,
  FOOD_COURT_PLAZA_RADIUS,
  FOOD_COURT_POINT,
  FOOD_COURT_TABLE_INNER_RADIUS,
  FOOD_COURT_TABLE_OUTER_RADIUS,
  GATE_INNER_RADIUS,
  GATE_POINT,
  SPAWN_RADIUS,
  ringPoint,
} from "@/components/park/parkRing";

/**
 * The single main entrance. Every employee enters the park through this gate.
 *
 * IT IS NO LONGER A PAIR OF TYPED COORDINATES. The park is concentric now, so
 * the gate is where the park's own axis of symmetry meets its boundary — the
 * bottom of the plan, on the line that runs straight through the lake — and
 * `parkRing.ts` works out where that is from the size of the attractions it
 * has to enclose. It moved out with the park: from z = 760 to the boundary of
 * a ring that reaches 726 m from the middle in every direction.
 *
 * Everything that reads the gate — the approach road, the spawn line, the
 * walking lanes, the entrance camera, the central avenue — is derived from
 * these two numbers and follows them out.
 */
export const GATE_X = GATE_POINT[0];
export const GATE_Z = GATE_POINT[1];

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
 * The opening is what the walk-through needs plus ceremony: even seventeen
 * walking lanes at 2.4 m occupy only the central 40.8 m, so the extra span is
 * architecture, not traffic.
 */
export const GATE_OPENING = 62;
export const GATE_PILLAR_HALF = 9.5;
export const GATE_PILLAR_HEIGHT = 26;
/** Underside of the arch beam — well over head height for the walk-through. */
export const GATE_ARCH_Y = 26;
export const GATE_HEIGHT = 47;

/** Where employees appear from the outside world, and their first step inside. */
export const SPAWN_Z = ringPoint(0, SPAWN_RADIUS)[1];
export const GATE_INNER_Z = ringPoint(0, GATE_INNER_RADIUS)[1];

/**
 * ONE WALKING LANE PER TURNSTILE, so arrivals fan out instead of queueing on
 * one line — and there have to be enough of them for the busiest minute the
 * data contains.
 *
 * It was nine, which suited a roster of thirty spread across a morning. The
 * workbook is a real attendance sheet: on 17 July 2026 fifteen people check in
 * inside the six-tenths of a minute one turnstile takes, and a gate with nine
 * of them cannot admit that morning without either making somebody share a
 * turnstile or moving a check-in time, and neither is allowed.
 *
 * Seventeen is that worst minute with headroom, and it is still architecture
 * the gate already has: seventeen lanes at 2.4 m occupy 40.8 m of a 62 m
 * opening, so nothing about the Peacock Gate moves to carry them.
 */
export const LANE_COUNT = 17;
export const LANE_SPACING = 2.4;

/**
 * THE GRAND FOOD COURT — the centrepiece, at the middle of the park.
 *
 * It has moved three times and each move was a change of role. It began as a
 * pavilion tucked into whichever interior pocket cleared every ride, the
 * railway and every sightline. When the park became concentric it took a plot
 * beside the entrance avenue. It is now the CENTRE — the thing the whole plan
 * radiates from — and it replaces the lake and its waterfall outright.
 *
 * There is nothing left to solve about where it goes: the middle of a radially
 * symmetric park is one point, and this is it.
 */
export const FOOD_COURT_CENTER: [number, number] = [...FOOD_COURT_POINT] as [number, number];
/**
 * THE COURT'S KEEP-OUT — a RADIUS now, not the half-extent of a square.
 *
 * It was 41 m, the half-width of a rectangular pavilion standing off to one
 * side of the park. The court is the park's centrepiece now: a circular plaza
 * 500 m across at the middle of the plan, with the pavilion, the stalls, the
 * colonnade and the seating all inside it. So the figure is the plaza's own
 * radius, read from `parkRing.ts` rather than typed here, and it is CIRCULAR —
 * a square keep-out of the same size would have reached 354 m at its corners,
 * a hundred metres out into the landscaped wedges the plan wants planted.
 *
 * The name is kept because a dozen modules and checks read it. What it means
 * has not changed: the ground the court occupies, that nothing else may use.
 */
export const FOOD_COURT_HALF = FOOD_COURT_PLAZA_RADIUS;
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
 * WHERE THE TABLES ARE: two concentric rings in the plaza.
 *
 * The court has been through three arrangements and each one was right for the
 * building it belonged to. Twenty tables in a five-by-four block filled a
 * terrace edge to edge with nowhere to walk. Five tables in one file, twenty
 * seats, suited the 80 m pavilion that replaced it — and twenty was already
 * generous, since the busiest minute of the whole simulated morning puts seven
 * people inside.
 *
 * Neither suits THIS building. The court is now a circular plaza a quarter of
 * a kilometre across and the centrepiece of the park, so its seating is laid
 * out the way the rest of the plan is: on concentric rings, evenly spaced, in
 * the band between the colonnade and the plaza's edge. An inner ring of twelve
 * and an outer ring of eighteen is thirty tables and a hundred and twenty
 * seats — a real food court's worth, and the open ground between the two rings
 * is the aisle diners move along.
 *
 * The radii come from `parkRing.ts`, so the seating cannot drift out of the
 * band the architecture leaves for it.
 */
const TABLE_RINGS: { radius: number; count: number }[] = [
  { radius: FOOD_COURT_TABLE_INNER_RADIUS, count: 12 },
  { radius: FOOD_COURT_TABLE_OUTER_RADIUS, count: 18 },
];

export const FOOD_COURT_TABLES: [number, number][] = TABLE_RINGS.flatMap((ring, r) =>
  Array.from({ length: ring.count }, (_, i) => {
    /* The outer ring is offset half a step, so a table never sits directly
       behind another on the same radius from the middle. */
    const a = ((i + (r % 2) * 0.5) / ring.count) * Math.PI * 2;
    return [Math.sin(a) * ring.radius, Math.cos(a) * ring.radius] as [number, number];
  }),
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

/**
 * Local-space entry point: where the central avenue meets the plaza.
 *
 * The court used to stand off the avenue and be entered through a door 22 m in
 * front of its pavilion. It is now the middle of the park and the avenue runs
 * straight at it, so the way in is where the avenue crosses the plaza's edge —
 * on the court's own axis, which is the park's axis.
 */
export const FOOD_COURT_DOOR_LOCAL: [number, number] = [0, FOOD_COURT_PLAZA_RADIUS];

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
 * WHERE THE COURT MEETS THE RING OF PATHS.
 *
 * The junction of the central avenue and the food court's own circular path —
 * the point a diner steps back out on to when they leave, and the point every
 * radial path is measured from. It used to be a spur out to a court that stood
 * off the avenue; now the court IS the middle, so this is simply where the
 * avenue ends and the circulation begins.
 */
export const AVENUE_JOIN: [number, number] = ringPoint(0, FOOD_COURT_PATH_RADIUS);

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
 * THE SIT IS THE DELAY, so there is no dwell constant here any more.
 *
 * A food-court visit lasts exactly as long as the employee's own Delay Time —
 * the gap between the sheet's check-in and its Actual Work Start, to the second
 * — and the walking to and from the court happens outside it. There used to be
 * a `MIN_SIT_MINUTES` floor here, from the days when the sit was the delay LESS
 * the walking and the shortest delays came out at nothing. Nothing floors the
 * sit now: it is the data, and a one-minute delay is a one-minute sit.
 */

/**
 * Check-in window, as minutes-of-day — the hours the gate is open.
 *
 * It used to be 9:00 to 11:00, an hour either side of a thirty-row sheet whose
 * arrivals all fell in one morning hour. `final one.xlsx` is a real attendance
 * record and does not: most of its 3,219 check-ins are between 9 and 11, but
 * 231 of them are before eight in the morning and a few are in the small hours.
 * The park animates what the sheet says rather than what a working day ought to
 * look like, so the window is the whole day.
 */
export const CHECK_IN_OPEN = 0;
export const CHECK_IN_CLOSE = 24 * 60;

/**
 * How many employees are in the simulation: the size of the supplied dataset,
 * never a number of our own.
 */
export const EMPLOYEE_COUNT = EMPLOYEE_DATASET.length;

/** Quiet margin either side of the busiest part of the day, in minutes. */
export const LOOP_LEAD_IN = 3;
export const LOOP_TAIL = 10;
