import {
  CHECK_IN_THRESHOLDS,
  classifyCheckIn,
  classifyDelay,
} from "@/simulation/classification";
import { formatSimTime } from "@/simulation/clock";
import {
  resolveDepartmentRides,
  type DepartmentInfo,
  type DepartmentRideId,
} from "@/components/park/departments";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_DETOUR_RADIUS,
  rideById,
} from "@/components/park/layout";
import { EMPLOYEE_DATASET, type DatasetRow } from "./dataset";
import {
  DEPARTMENT_RIDE_IDS,
  seatPose,
} from "./rideKinematics";
import {
  AT_RIDE_DWELL,
  buildRideSchedule,
  segmentAnimationSeconds,
  stairFor,
  type RideArrival,
  type RideRider,
  type RideSchedules,
  type RideSegment,
} from "./rideOps";
import { deckSpotFor, type BoardingStair } from "./boardingStair";
import {
  CHECK_IN_DWELL,
  FOOD_COURT_CHAIRS,
  FOOD_COURT_DOOR,
  GATE_INNER_Z,
  GATE_X,
  GATE_Z,
  LANE_COUNT,
  LANE_SPACING,
  LOOP_LEAD_IN,
  LOOP_TAIL,
  MIN_SIT_MINUTES,
  QUEUE_SPACING,
  QUEUE_WAIT_MIN,
  QUEUE_WAIT_SPAN,
  SPAWN_Z,
  WALK_UNITS_PER_MINUTE,
  WALK_UNITS_PER_MINUTE_MAX,
  foodCourtToWorld,
} from "./constants";

/**
 * The employee journey, built from the EXACT attendance dataset.
 *
 * The 30 rows in `dataset.ts` fix every employee's name, ID, department,
 * check-in time, delay, actual work-start time and check-out time. This module
 * derives the MOVEMENT that honours those times; it never adjusts them.
 *
 * THE STORY THIS ANIMATES is that checking in is not the same as starting
 * work. The delay column alone decides the shape of a person's morning:
 *
 *   delay = 0   gate -> straight to their department ride
 *   delay > 0   gate -> food court -> sit the delay out -> department ride
 *
 * Nothing else selects who eats. There is no share, no quota and no random
 * draw — a viewer watching someone sit down is watching that person's delay
 * being served, and the length of the sit IS the delay minus the walking it
 * takes to get there and on to the ride.
 *
 * WHAT IS ANCHORED, AND WHAT FLEXES. Every employee stands at the gate at
 * their exact check-in minute; that is walked backwards from, so they spawn
 * outside early enough to arrive on time. A delayed employee then leaves their
 * seat exactly late enough to reach their ride at their exact work-start
 * minute. Pace is what flexes in between — base 1.35 m/s, brisk 1.9 m/s when
 * the delay is tight — and nobody ever teleports or sprints.
 *
 * WHERE THE PARK ARGUES WITH THE SHEET. The gate is 400-700 m from the rides,
 * which is four to seven minutes' walk. An employee whose delay is zero has
 * work starting at the very minute they check in, so they cannot possibly be
 * standing at their ride by then: they walk there directly and start work when
 * they arrive, which is the only honest reading of "no delay, went straight to
 * work". Likewise a delay shorter than the walk cannot be spent sitting; those
 * employees still visit the court and still sit, and `LATE_ARRIVALS` records
 * by how much their ride arrival slips past the sheet. The sheet's own times
 * are never rewritten to hide either case.
 *
 * Reuses the park's existing modules rather than cloning them: department
 * destinations come from `rideForDepartment`, ride positions from the park
 * layout solver, the fountain geometry from the layout, the delay banding from
 * `classifyDelay()`, and clock formatting from `formatSimTime()`.
 */

/** Colour band an employee wears, decided purely by how late their work start was. */
export type CheckInColor = "GREEN" | "YELLOW" | "RED";

export const CHECK_IN_COLOR_HEX: Record<CheckInColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

/** Worded from CHECK_IN_THRESHOLDS so the labels cannot drift from the bands. */
export const CHECK_IN_BAND_LABEL: Record<CheckInColor, string> = {
  GREEN: `Checked in by ${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)}`,
  YELLOW: `${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)} – ${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)}`,
  RED: `After ${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)}`,
};

export type JourneyPhase =
  | "APPROACHING"
  | "QUEUED"
  | "CHECKING_IN"
  | "ENTERING"
  | "TO_FOOD_COURT"
  | "IN_FOOD_COURT"
  | "TO_RIDE"
  | "AT_RIDE"
  | "WAITING_AT_LADDER"
  | "WALKING_TO_LADDER"
  | "CLIMBING_LADDER"
  | "ON_PLATFORM"
  | "WALKING_TO_SEAT"
  | "BOARDING"
  | "SITTING_ON_RIDE"
  | "EXITING_RIDE"
  | "WORKING"
  | "LEAVING";

export const PHASE_LABEL: Record<JourneyPhase, string> = {
  APPROACHING: "Walking to the entrance",
  QUEUED: "Waiting at the gate",
  CHECKING_IN: "Checking in at the main gate",
  ENTERING: "Entering the park",
  TO_FOOD_COURT: "Walking to the food court",
  IN_FOOD_COURT: "In the food court",
  TO_RIDE: "Walking to their department ride",
  AT_RIDE: "Arrived at their department ride",
  WAITING_AT_LADDER: "Waiting in the line at the boarding stair",
  WALKING_TO_LADDER: "Walking to the boarding stair",
  CLIMBING_LADDER: "On the boarding stair",
  ON_PLATFORM: "On the boarding platform",
  WALKING_TO_SEAT: "Walking to their seat",
  BOARDING: "Getting into the seat",
  SITTING_ON_RIDE: "Seated on the ride",
  EXITING_RIDE: "Getting off the ride",
  WORKING: "Work started",
  LEAVING: "Checked out, walking to the gate",
};

/**
 * THE CHECK-IN CLOCK DECIDES THE COLOUR, and it is worn.
 *
 * This is the one thing an employee's clothing states: how early in the morning
 * they got here. Green before a quarter to ten, yellow up to ten, red after —
 * read straight off the dataset's own check-in column and banded by
 * `classifyCheckIn`, which lives beside the delay classifier so the park has a
 * single place where any band is decided.
 *
 * It is NOT the delay. The delay is a different fact about a different part of
 * the morning and still has its own banding — `delayCategory` on every employee
 * record, from the same `classifyDelay()` the Department Check-In Overview
 * reads — so the two are reported side by side rather than confused. What a
 * viewer sees on a shirt is arrival time, and nothing else.
 */
export function checkInColor(checkInMinutes: number): CheckInColor {
  return classifyCheckIn(checkInMinutes);
}

interface Waypoint {
  x: number;
  z: number;
  /**
   * Height above the ground. Zero everywhere a person is walking on it; only
   * the legs that climb into and out of a ride seat leave the ground.
   */
  y?: number;
  /** Sim-minute the employee reaches this point. */
  arrive: number;
  /** Sim-minute they leave it again. */
  depart: number;
  /** What they are doing while travelling here and waiting here. */
  phase: JourneyPhase;
}

export interface JourneyEmployee {
  id: string;
  name: string;
  department: string;
  rideId: DepartmentRideId;
  rideName: string;

  checkInTime: number;
  color: CheckInColor;

  /** True exactly when the dataset gives this employee a delay. */
  visitsFoodCourt: boolean;
  foodCourtEntry: number | null;
  foodCourtExit: number | null;
  /** Index into FOOD_COURT_CHAIRS, held for the length of the sit. */
  chairIndex: number | null;
  /** Minutes actually spent seated — the delay, less the walking it paid for. */
  sitMinutes: number;

  rideArrival: number;

  /* ---- The ride itself: which seat, and the minutes of that dispatch ---- */
  /** Seat this employee is given on their department ride. */
  rideSeatIndex: number;
  /** The stop at which they got on. */
  rideCycleIndex: number;
  /**
   * The stretches of their ride's own running that happen while they are in
   * their seat. A ride is interruptible, so this is a list rather than a single
   * window: it stops to take somebody else aboard and is released again, and
   * the rider stays put throughout.
   */
  rideSegments: RideSegment[];
  /** Their place in the line at the foot of the boarding stair. */
  queueSlot: number;
  /** Boarding opens: they leave the apron for the queue at the stair. */
  boardStart: number;
  /** Sets foot on the bottom step, with the one-person stair to themselves. */
  ladderAt: number;
  /** Steps off the top of the stair onto the boarding platform. */
  deckAt: number;
  /** Standing on the platform beside their own seat. */
  atSeatSpotAt: number;
  /** Seated, and attached to the seat from here. */
  seatedAt: number;
  /** The ride is released. */
  rideStart: number;
  /** The ride is back at rest, in the pose it started in. */
  rideEnd: number;
  /** Stands up out of the seat. */
  riseAt: number;
  /** Back at the head of the stair, ready to go down. */
  deckOutAt: number;
  /** Steps off the bottom of the stair, back on the ground. */
  groundAt: number;
  /** Back at their department's spot, clear of the ride. */
  rideExit: number;

  /** The dataset's work-start minute, untouched. */
  workStart: number;
  /**
   * When work actually begins on screen: the dataset minute, or later where the
   * park physically cannot deliver it — the walk from the gate, or the
   * department's ride still having to run.
   */
  workStartActual: number;
  /**
   * The minute work would have started if the ride were not part of the
   * commute — today's answer, kept so the two can be compared.
   */
  workStartBeforeRide: number;
  checkOut: number;
  delayMinutes: number;
  /** The park's existing delay banding, applied to the real delay. */
  delayCategory: ReturnType<typeof classifyDelay>;

  /** Metres per simulated minute this employee walks inside the park. */
  walkSpeed: number;

  /** First moment the figure is on screen. */
  spawnTime: number;
  /** Last moment they are on screen, having walked back out of the gate. */
  despawnTime: number;
  route: Waypoint[];
}

/**
 * Employees whose ride arrival could not be made to land on the sheet's
 * work-start minute, and by how many minutes it slips.
 *
 * Two causes, both physical rather than data errors: an employee with no delay
 * has no time at all in which to cross 400-700 m of park, and an employee whose
 * delay is shorter than that walk cannot spend it sitting. Recorded rather than
 * hidden, and asserted against in the verify suite so the list cannot grow
 * silently.
 */
export interface LateArrival {
  id: string;
  reason: "no-delay-walk" | "delay-shorter-than-walk";
  minutes: number;
}

/**
 * Everything one build of the journey produces: the employees, their lookup,
 * the physically-late arrivals, and the loop window that contains every route.
 *
 * The park always runs exactly one of these. The built-in dataset's build is
 * the module constants below; an uploaded roster produces another through the
 * same `buildJourney()`, so an upload obeys every rule the built-in cast does.
 */
export interface JourneyData {
  employees: JourneyEmployee[];
  byId: Record<string, JourneyEmployee>;
  lateArrivals: LateArrival[];
  /** Every department ride's stop-load-run-stop-unload day. */
  rideSchedules: RideSchedules;
  loopStart: number;
  loopEnd: number;
  loopMinutes: number;
  /**
   * The minute the playhead STARTS on, as distinct from the minute the day
   * starts on.
   *
   * `loopStart` is the moment before the first person appears outside the
   * gate, so landing on it means landing on an empty park: nobody has checked
   * in, there is nothing to look at, and the visitor has to sit through the
   * arrival before the visualisation shows them anything. That is what the
   * page was doing, and it read — correctly — as "there are no people".
   *
   * So the playhead opens on the fullest moment of the arrival story instead:
   * the minute, inside the arrival window, at which the largest number of
   * employees are inside the park while somebody is still walking. The whole
   * cast is on stage AND the park is visibly moving, which is what tells a
   * visitor at a glance that this is a simulation and not a still. The
   * scrubber still spans the whole day, so 9:27 is one drag away.
   */
  openingMinute: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

const dist = (a: readonly [number, number], b: readonly [number, number]) =>
  Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Push a point out of the fountain's detour circle, if it has landed in it.
 *
 * A ride's waiting apron and its approach are both set out from the ride's
 * centre along the line to the gate, at a distance that grows with the ride.
 * For a ride on the far side of the plaza that line runs THROUGH the fountain,
 * so a big enough ride puts its own approach point inside the detour circle —
 * which `fountainDetour` cannot bend a route around, because there is no way
 * round to a destination that is inside the obstacle. It threw instead.
 *
 * The comment on that function has always claimed these anchors were "solved to
 * clear" the circle. They were not: they cleared it by luck, and the luck ran
 * out the moment the rides grew 20%. This makes the claim true — a point inside
 * the circle is pushed radially out to its rim plus a margin, which moves it a
 * couple of metres and leaves every anchor that was already clear untouched.
 */
const FOUNTAIN_CLEARANCE = 2;

function clearFountain(p: Pt): Pt {
  const [fx, fz] = FOUNTAIN_CENTER;
  const dx = p[0] - fx;
  const dz = p[1] - fz;
  const d = Math.hypot(dx, dz);
  const need = FOUNTAIN_DETOUR_RADIUS + FOUNTAIN_CLEARANCE;
  if (d >= need) return p;
  /* Dead centre has no direction to push along; use the gate line. */
  if (d < 1e-6) return [fx, fz + need];
  return [fx + (dx / d) * need, fz + (dz / d) * need];
}

/**
 * Where an employee stands once they reach their department ride: on the side
 * of the ride that faces the gate, spread sideways so a whole department does
 * not stack into one spot. Read from the layout solver, so it tracks the ride
 * wherever the solver put it.
 */
function ridePoints(rideId: DepartmentRideId, index: number, total: number) {
  const r = rideById(rideId);
  const cx = r.center[0];
  const cz = r.center[1];
  const dx = GATE_X - cx;
  const dz = GATE_Z - cz;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  // Perpendicular, for the sideways spread.
  const px = -uz;
  const pz = ux;

  /*
   * The waiting group, at human spacing. Employees used to stand nine metres
   * apart, which read as a scattered line rather than a crowd and pushed the
   * ends of a big department clean off the paved apron. Two ranks at just
   * under two metres is what a group of people waiting actually looks like.
   */
  const reach = Math.max(r.halfX, r.halfZ);
  const rank = index % 2;
  const column = Math.floor(index / 2);
  const columns = Math.max(1, Math.ceil(total / 2));
  const lateral = (column - (columns - 1) / 2) * 1.9;
  const back = rank * 1.7;

  const stand: Pt = clearFountain([
    cx + ux * (reach + 14 + back) + px * lateral,
    cz + uz * (reach + 14 + back) + pz * lateral,
  ]);
  const approach: Pt = clearFountain([
    cx + ux * (reach + 58) + px * lateral * 0.4,
    cz + uz * (reach + 58) + pz * lateral * 0.4,
  ]);
  return { stand, approach };
}

/**
 * The centre line of a ride's arrival fan: where the paved approach and the
 * waiting apron belong. The park's path network is laid along these, so the
 * paving is always under the people rather than beside them.
 */
export function rideAnchor(rideId: DepartmentRideId) {
  return ridePoints(rideId, 0, 1);
}

/**
 * The centre of the park holds the fountain, not a walking lane. Any leg that
 * would cut through the fountain's detour circle is bent onto an arc around
 * it: the straight portion inside the circle is replaced by the shorter way
 * round its rim. Returns the intermediate points only (the endpoints stay),
 * or an empty array when the leg never comes near.
 *
 * Endpoints themselves must be outside the circle — the ride anchors and path
 * nodes were all solved to clear it, and this throws if that ever regresses.
 */
export function fountainDetour(a: readonly [number, number], b: readonly [number, number]): Pt[] {
  const [cx, cz] = FOUNTAIN_CENTER;
  const R = FOUNTAIN_DETOUR_RADIUS;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const A = dx * dx + dz * dz;
  if (A === 0) return [];
  const fx = a[0] - cx;
  const fz = a[1] - cz;
  const B = 2 * (fx * dx + fz * dz);
  const C = fx * fx + fz * fz - R * R;
  const disc = B * B - 4 * A * C;
  if (disc <= 0) return [];
  const s = Math.sqrt(disc);
  const t1 = (-B - s) / (2 * A);
  const t2 = (-B + s) / (2 * A);
  if (t2 <= 0 || t1 >= 1) return [];
  if (C < 0 || dist(b, FOUNTAIN_CENTER) < R) {
    throw new Error(
      `A route endpoint sits inside the fountain detour circle at (${a}) -> (${b}). ` +
        `Anchors must be solved to clear FOUNTAIN_DETOUR_RADIUS.`,
    );
  }

  const p1: Pt = [a[0] + t1 * dx, a[1] + t1 * dz];
  const p2: Pt = [a[0] + t2 * dx, a[1] + t2 * dz];
  const th1 = Math.atan2(p1[1] - cz, p1[0] - cx);
  const th2 = Math.atan2(p2[1] - cz, p2[0] - cx);
  let delta = th2 - th1;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  const steps = Math.max(2, Math.ceil(Math.abs(delta) / 0.22));
  const pts: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const th = th1 + (delta * k) / steps;
    pts.push([cx + R * Math.cos(th), cz + R * Math.sin(th)]);
  }
  return pts;
}

/** A leg as actually walked: endpoints plus any bend around the fountain. */
function walkedLeg(a: Pt, b: Pt): Pt[] {
  return [a, ...fountainDetour(a, b), b];
}

/** Metres actually covered walking a leg, detour included. */
function legLength(a: Pt, b: Pt): number {
  const pts = walkedLeg(a, b);
  let total = 0;
  for (let k = 1; k < pts.length; k++) total += dist(pts[k - 1], pts[k]);
  return total;
}

/** Cushion between reaching the ride and the given work-start, in minutes. */
const MIN_BOARDING = 0.25;

/** World position of one of the court's eighty real chairs. */
function chairPoint(chairIndex: number): Pt {
  return foodCourtToWorld(FOOD_COURT_CHAIRS[chairIndex].local);
}

/**
 * Walking distance from the gate to the stand, through the food court or not.
 * Used both to pick who can afford a food-court stop and to pace the walk.
 */
function insideDistance(gate: Pt, gateInner: Pt, stand: Pt, approach: Pt, seat: Pt | null): number {
  let d = legLength(gate, gateInner);
  if (seat) {
    d += legLength(gateInner, FOOD_COURT_DOOR as Pt);
    d += legLength(FOOD_COURT_DOOR as Pt, seat);
    d += legLength(seat, FOOD_COURT_DOOR as Pt);
    d += legLength(FOOD_COURT_DOOR as Pt, approach);
  } else {
    d += legLength(gateInner, approach);
  }
  d += legLength(approach, stand);
  return d;
}

export function buildJourney(rows: DatasetRow[]): JourneyData {
  const rand = mulberry32(0x10aded);

  // The dataset is the source of truth — prove it is internally consistent
  // before building anything on top of it.
  const seenIds = new Set<string>();
  for (const row of rows) {
    if (row.workStart - row.checkIn !== row.delayMinutes) {
      throw new Error(
        `Dataset row ${row.id}: workStart - checkIn = ${row.workStart - row.checkIn}, ` +
          `but delay says ${row.delayMinutes}. The dataset must not be altered to fit.`,
      );
    }
    if (seenIds.has(row.id)) {
      throw new Error(
        `Dataset row ${row.id} appears more than once. Employee IDs must be unique.`,
      );
    }
    seenIds.add(row.id);
  }
  if (rows.length === 0) {
    throw new Error("The roster is empty — there is nobody to animate.");
  }

  /*
   * Every department in THIS roster resolved to an existing ride: the known
   * six keep their mapping, and any new name is absorbed round-robin by the
   * existing attractions — never a new destination.
   */
  const rideMap = resolveDepartmentRides(rows.map((r) => r.department));

  // Per-ride seat counting, so a department's crowd fans out realistically.
  const perRideTotal: Record<string, number> = {};
  for (const row of rows) {
    const rideId = rideMap.get(row.department)!.rideId;
    perRideTotal[rideId] = (perRideTotal[rideId] ?? 0) + 1;
  }
  const perRideIndex: Record<string, number> = {};

  /*
   * WHO STOPS FOR FOOD: exactly the people the sheet says were delayed.
   *
   * This used to be a 35% quota filled by a seeded ranking, which meant a
   * viewer could not read anything from a person sitting down — some delayed
   * employees walked straight past the court and some undelayed ones ate. The
   * delay column is now the whole rule, so the food court IS the delay, made
   * visible.
   */
  const geometry = rows.map((row, i) => {
    const dept = rideMap.get(row.department)!;
    const standIndex = perRideIndex[dept.rideId] ?? 0;
    perRideIndex[dept.rideId] = standIndex + 1;

    const laneOffset = ((i % LANE_COUNT) - (LANE_COUNT - 1) / 2) * LANE_SPACING;
    const spawn: Pt = [GATE_X + laneOffset * 1.15, SPAWN_Z + (i % 5) * 9];
    const gateWait: Pt = [GATE_X + laneOffset * 0.6, GATE_Z + 30];
    const gate: Pt = [GATE_X + laneOffset * 0.42, GATE_Z];
    const gateInner: Pt = [GATE_X + laneOffset * 0.8, GATE_INNER_Z];
    const { stand, approach } = ridePoints(dept.rideId, standIndex, perRideTotal[dept.rideId]);
    return { dept, standIndex, spawn, gateWait, gate, gateInner, stand, approach };
  });

  /*
   * SEAT ALLOCATION, over the court's eighty real chairs.
   *
   * Diners are served in the order they reach the court and take the
   * lowest-numbered chair that is free at that moment; a chair is released the
   * instant its occupant stands up. Two people can therefore never share a
   * chair, and the assignment is pure bookkeeping — no randomness, so the same
   * dataset always seats the same people in the same places.
   *
   * The route length depends on WHICH chair, and the chair depends on the
   * arrival time, which depends on the route length. The circularity is broken
   * by measuring the walk to the court (which no chair affects) first, sorting
   * on that, and only then handing out seats.
   */
  const diners = rows
    .map((_, i) => i)
    .filter((i) => rows[i].delayMinutes > 0)
    .sort((a, b) => rows[a].checkIn - rows[b].checkIn || (a < b ? -1 : 1));

  /*
   * The order chairs are offered in: every table's first seat before any
   * table's second. Taking simply the lowest-numbered free chair is just as
   * correct — nobody ever shares — but it packs the whole lunch crowd onto the
   * first two tables while eighteen stand empty. Spreading one diner per table
   * first is what a real terrace looks like, and it reads far better from the
   * overview.
   */
  const chairPreference = FOOD_COURT_CHAIRS.map((_, i) => i).sort((a, b) => {
    const A = FOOD_COURT_CHAIRS[a];
    const B = FOOD_COURT_CHAIRS[b];
    return A.seat - B.seat || A.table - B.table;
  });

  const chairFreeAt: number[] = new Array(FOOD_COURT_CHAIRS.length).fill(-Infinity);
  const seating = new Map<number, { chairIndex: number; viaFood: number; sit: number; speed: number }>();

  for (const i of diners) {
    const row = rows[i];
    const g = geometry[i];
    /* Reaching the door is the same walk whichever chair they end up in. */
    const toDoor =
      legLength(g.gate, g.gateInner) + legLength(g.gateInner, FOOD_COURT_DOOR as Pt);
    const entryAtBase = row.checkIn + CHECK_IN_DWELL + toDoor / WALK_UNITS_PER_MINUTE;

    const chairIndex = chairPreference.find((c) => chairFreeAt[c] <= entryAtBase) ?? -1;
    if (chairIndex === -1) {
      /* Eighty chairs against fifteen diners; this is a guard, not a path. */
      throw new Error(
        `The food court is full at ${formatSimTime(entryAtBase)} — ${row.id} has nowhere to sit. ` +
          `All ${FOOD_COURT_CHAIRS.length} chairs are occupied.`,
      );
    }

    const seat = chairPoint(chairIndex);
    const viaFood = insideDistance(g.gate, g.gateInner, g.stand, g.approach, seat);

    /*
     * The sit absorbs whatever the delay does not spend on walking. Base pace
     * is preferred; the employee only walks briskly when that is the only way
     * to free up a visible sit, and never faster than WALK_UNITS_PER_MINUTE_MAX.
     */
    const budget = row.delayMinutes - CHECK_IN_DWELL - MIN_BOARDING;
    let speed = WALK_UNITS_PER_MINUTE;
    let sit = budget - viaFood / speed;
    if (sit < MIN_SIT_MINUTES) {
      const needed = viaFood / Math.max(budget - MIN_SIT_MINUTES, 1e-6);
      speed = Math.min(WALK_UNITS_PER_MINUTE_MAX, Math.max(WALK_UNITS_PER_MINUTE, needed));
      sit = Math.max(MIN_SIT_MINUTES, budget - viaFood / speed);
    }

    const entry = row.checkIn + CHECK_IN_DWELL + toDoor / speed;
    chairFreeAt[chairIndex] = entry + sit;
    seating.set(i, { chairIndex, viaFood, sit, speed });
  }

  /*
   * Gate queue bookkeeping, in check-in order: each lane admits one person at
   * a time, and anyone whose waiting spell overlaps a lane-mate's stands a
   * human spacing further back. With this dataset's arrival spacing the queue
   * is shallow — which is honest — but the mechanism guarantees no two people
   * ever share a spot, whatever the data says.
   */
  const order = rows.map((_, i) => i).sort((a, b) => rows[a].checkIn - rows[b].checkIn);
  const laneGateBusyUntil: number[] = new Array(LANE_COUNT).fill(-Infinity);
  const laneWaits: { from: number; to: number }[][] = Array.from({ length: LANE_COUNT }, () => []);
  const queue = new Array<{ wait: number; depth: number }>(rows.length);

  for (const i of order) {
    const row = rows[i];
    const laneIdx = i % LANE_COUNT;
    if (row.checkIn < laneGateBusyUntil[laneIdx]) {
      throw new Error(
        `Gate lane ${laneIdx} is still busy at ${row.id}'s check-in ` +
          `(${formatSimTime(row.checkIn)}). The dataset and the gate geometry conflict.`,
      );
    }
    laneGateBusyUntil[laneIdx] = row.checkIn + CHECK_IN_DWELL;

    const wait = QUEUE_WAIT_MIN + rand() * QUEUE_WAIT_SPAN;
    const g = geometry[i];
    const toGate = dist(g.gateWait, g.gate) / WALK_UNITS_PER_MINUTE;
    const from = row.checkIn - toGate - wait;
    const to = row.checkIn - toGate;
    const depth = laneWaits[laneIdx].filter((w) => w.from < to && w.to > from).length;
    laneWaits[laneIdx].push({ from, to });
    queue[i] = { wait, depth };
  }

  const lateArrivals: LateArrival[] = [];

  /*
   * PASS ONE: the commute, as far as the boarding area.
   *
   * Everything up to the moment somebody is standing at their department ride
   * is exactly what it always was — the gate, the food court, the pace that
   * makes a delayed employee's sit come out at their delay, and the same
   * arrival minute. The ride cannot be scheduled before this, because a ride
   * waits for its department and the schedule is solved from when they turn up.
   */
  const approaches = rows.map((row, i) =>
    buildApproach(row, geometry[i], queue[i], seating.get(i) ?? null, lateArrivals),
  );

  /*
   * PASS TWO: each ride's day, from the minutes its own department arrives.
   */
  const arrivalsByRide = Object.fromEntries(
    DEPARTMENT_RIDE_IDS.map((id) => [id, [] as RideArrival[]]),
  ) as Record<DepartmentRideId, RideArrival[]>;
  for (const a of approaches) {
    arrivalsByRide[a.rideId].push({
      employeeId: a.id,
      /* They are available for a seat once the moment of arrival has passed. */
      at: a.rideArrival + AT_RIDE_DWELL,
      stand: a.stand,
      walkSpeed: a.walkSpeed,
    });
  }
  const rideSchedules = Object.fromEntries(
    DEPARTMENT_RIDE_IDS.map((id) => [id, buildRideSchedule(id, arrivalsByRide[id])]),
  ) as RideSchedules;

  const boarding = new Map<string, { stopIndex: number; rider: RideRider; segments: RideSegment[] }>();
  for (const id of DEPARTMENT_RIDE_IDS) {
    const schedule = rideSchedules[id];
    for (const stop of schedule.stops) {
      for (const employeeId of stop.boarding) {
        const rider = schedule.riders[employeeId];
        boarding.set(employeeId, {
          stopIndex: stop.index,
          rider,
          /* Every stretch of running that happens while they are seated. */
          segments: schedule.segments.filter((g) => g.to > rider.seatAt && g.from < rider.riseAt),
        });
      }
    }
  }

  /*
   * PASS THREE: board, ride, and stay there.
   *
   * `holdUntil` is how long the simulated day runs: the latest check-out the
   * sheet records, so the timeline still spans the working day it always did.
   * Nobody acts on it — it is simply the last minute anybody is drawn, and
   * every employee is in their seat when it arrives.
   */
  const holdUntil = Math.max(...rows.map((r) => r.checkOut)) + LOOP_TAIL;
  const employees = approaches.map((a) => {
    const seat = boarding.get(a.id);
    if (!seat) {
      throw new Error(`${a.id} arrived at ${a.rideName} but was never given a seat.`);
    }
    return finishJourney(a, seat.stopIndex, seat.rider, seat.segments, holdUntil);
  });

  /*
   * The simulated day, from just before the first person appears outside the
   * gate to just after the last one has walked back out of it. Both ends are
   * read off the routes themselves, so the window can never be shorter than
   * the journeys it has to contain.
   */
  const loopStart = Math.min(...employees.map((e) => e.spawnTime)) - LOOP_LEAD_IN;
  const loopEnd = Math.max(...employees.map((e) => e.despawnTime)) + LOOP_TAIL;

  return {
    employees,
    byId: Object.fromEntries(employees.map((e) => [e.id, e])),
    lateArrivals,
    rideSchedules,
    loopStart,
    loopEnd,
    loopMinutes: loopEnd - loopStart,
    openingMinute: solveOpeningMinute(employees, loopStart),
  };
}

/**
 * Where the playhead opens. Read off the routes, never typed.
 *
 * The arrival window runs from `loopStart` to the minute the last employee
 * actually starts work — after that the whole cast simply stands at its ride
 * until home time, and nothing moves for hours. Inside that window this picks
 * the minute with the most people in the park, requiring that at least one of
 * them is still walking so the opening frame is a moving one. Ties go to the
 * earliest such minute, so the opening is the first time the park is that
 * full rather than the last.
 *
 * The sweep is at quarter-minute resolution, which is finer than any waypoint
 * in a route, so it cannot step over a peak.
 */
function solveOpeningMinute(employees: JourneyEmployee[], loopStart: number): number {
  const lastWorkStart = Math.max(...employees.map((e) => e.workStartActual));

  let bestMinute = loopStart;
  let bestPresent = -1;
  for (let t = loopStart; t <= lastWorkStart; t += 0.25) {
    let present = 0;
    let moving = 0;
    for (const e of employees) {
      const s = sampleJourney(e, t);
      if (!s) continue;
      present++;
      if (s.moving) moving++;
    }
    if (moving > 0 && present > bestPresent) {
      bestPresent = present;
      bestMinute = t;
    }
  }
  return bestMinute;
}

interface Geometry {
  dept: DepartmentInfo;
  standIndex: number;
  spawn: Pt;
  gateWait: Pt;
  gate: Pt;
  gateInner: Pt;
  stand: Pt;
  approach: Pt;
}

/** What the seat allocator decided for one delayed employee. */
interface Seating {
  chairIndex: number;
  viaFood: number;
  sit: number;
  speed: number;
}

/**
 * Everything an employee's commute produces before the ride takes over: the
 * finished record minus the ride legs, plus the few pieces of geometry the
 * ride legs still need.
 */
interface Approach
  extends Omit<
    JourneyEmployee,
    | "rideSeatIndex"
    | "rideCycleIndex"
    | "rideSegments"
    | "queueSlot"
    | "boardStart"
    | "ladderAt"
    | "deckAt"
    | "atSeatSpotAt"
    | "seatedAt"
    | "rideStart"
    | "rideEnd"
    | "riseAt"
    | "deckOutAt"
    | "groundAt"
    | "rideExit"
    | "workStartActual"
    | "checkOut"
    | "despawnTime"
  > {
  /** Today's answer for when work starts, before the ride is accounted for. */
  workStartBeforeRide: number;
  /** Their own spot on the boarding apron, and the fan they walk in through. */
  stand: Pt;
  approach: Pt;
  spawn: Pt;
  gate: Pt;
  gateInner: Pt;
  /** The dataset's own check-out minute, before the ride can push it. */
  rowCheckOut: number;
}

function buildApproach(
  row: DatasetRow,
  g: Geometry,
  q: { wait: number; depth: number },
  seating: Seating | null,
  lateArrivals: LateArrival[],
): Approach {
  const route: Waypoint[] = [];
  const color = checkInColor(row.checkIn);
  const visitsFoodCourt = seating !== null;

  /*
   * An employee with no delay has nothing to spend and nowhere to wait, so
   * they simply walk at a normal pace and start work the moment they arrive.
   * A delayed one walks at whatever pace the seat allocator settled on, which
   * is what makes their sit land exactly on their work-start minute.
   */
  const dwell = seating ? seating.sit : 0;
  const walkSpeed = seating ? seating.speed : WALK_UNITS_PER_MINUTE;

  // The approach from outside, anchored backwards from the check-in minute.
  const queuePos: Pt = [g.gateWait[0], g.gateWait[1] + q.depth * QUEUE_SPACING];
  const toGate = dist(queuePos, g.gate) / WALK_UNITS_PER_MINUTE;
  const toQueue = dist(g.spawn, queuePos) / WALK_UNITS_PER_MINUTE;
  const spawnTime = row.checkIn - toGate - q.wait - toQueue;

  route.push({ x: g.spawn[0], z: g.spawn[1], arrive: spawnTime, depart: spawnTime, phase: "APPROACHING" });
  route.push({
    x: queuePos[0],
    z: queuePos[1],
    arrive: spawnTime + toQueue,
    depart: row.checkIn - toGate,
    phase: "QUEUED",
  });
  route.push({
    x: g.gate[0],
    z: g.gate[1],
    arrive: row.checkIn,
    depart: row.checkIn + CHECK_IN_DWELL,
    phase: "CHECKING_IN",
  });

  // Inside the park, every leg is walked at this employee's pace, bending
  // around the central fountain wherever a straight line would cross it.
  let t = row.checkIn + CHECK_IN_DWELL;
  let at: Pt = g.gate;
  const walkTo = (target: Pt, phase: JourneyPhase) => {
    const pts = walkedLeg(at, target);
    for (let k = 1; k < pts.length; k++) {
      t += dist(pts[k - 1], pts[k]) / walkSpeed;
      route.push({ x: pts[k][0], z: pts[k][1], arrive: t, depart: t, phase });
    }
    at = target;
  };

  walkTo(g.gateInner, "ENTERING");

  let foodCourtEntry: number | null = null;
  let foodCourtExit: number | null = null;

  if (seating) {
    /* Into the court, to a chair of their own, and back out of the same door. */
    walkTo(FOOD_COURT_DOOR as Pt, "TO_FOOD_COURT");
    foodCourtEntry = t;
    const seat = chairPoint(seating.chairIndex);
    walkTo(seat, "IN_FOOD_COURT");
    /*
     * Seated. They rise early enough that walking back to the door still puts
     * their whole visit — door in to door out — at the intended length, so the
     * sit itself is what the delay bought.
     */
    const backOut = legLength(seat, FOOD_COURT_DOOR as Pt) / walkSpeed;
    const riseAt = foodCourtEntry + dwell - backOut;
    route[route.length - 1].depart = riseAt;
    t = riseAt;
    walkTo(FOOD_COURT_DOOR as Pt, "IN_FOOD_COURT");
    foodCourtExit = t;
  }

  walkTo(g.approach, "TO_RIDE");
  walkTo(g.stand, "TO_RIDE");
  const rideArrival = t;

  /*
   * When work begins on screen.
   *
   * Normally the dataset's minute, with the wait at the ride absorbing any
   * slack. But the park is 400-700 m deep, so an employee whose work-start
   * equals their check-in — the sheet's "No Delay" — is physically still
   * walking at that minute. Rather than teleport them or quietly rewrite the
   * sheet, work starts when they actually arrive, and the slip is recorded.
   */
  const workStartBeforeRide = Math.max(rideArrival, row.workStart);
  if (workStartBeforeRide > row.workStart + 1e-6) {
    lateArrivals.push({
      id: row.id,
      reason: row.delayMinutes === 0 ? "no-delay-walk" : "delay-shorter-than-walk",
      minutes: workStartBeforeRide - row.workStart,
    });
  }

  /*
   * The moment of arrival at the boarding area. The WAIT that follows it is a
   * waypoint of its own, because it is no longer slack to be filled — it is
   * the employee holding for their department ride to be ready for them, and
   * how long it lasts is decided by the ride, not by this function.
   */
  route.push({
    x: g.stand[0],
    z: g.stand[1],
    arrive: rideArrival,
    depart: rideArrival + AT_RIDE_DWELL,
    phase: "AT_RIDE",
  });

  return {
    id: row.id,
    name: row.name,
    department: row.department,
    rideId: g.dept.rideId,
    rideName: g.dept.rideName,
    checkInTime: row.checkIn,
    color,
    visitsFoodCourt,
    foodCourtEntry,
    foodCourtExit,
    chairIndex: seating ? seating.chairIndex : null,
    sitMinutes: dwell,
    rideArrival,
    workStart: row.workStart,
    workStartBeforeRide,
    delayMinutes: row.delayMinutes,
    delayCategory: classifyDelay(row.delayMinutes),
    walkSpeed,
    spawnTime,
    route,
    stand: g.stand,
    approach: g.approach,
    spawn: g.spawn,
    gate: g.gate,
    gateInner: g.gateInner,
    rowCheckOut: row.checkOut,
  };
}

/**
 * The ride, and the working day on the other side of it.
 *
 * WHAT THE EMPLOYEE ACTUALLY DOES, in the order a viewer sees it: they wait at
 * the boarding area for their ride to be ready; they walk from their waiting
 * spot to their own seat and climb into it; they stay attached to that seat
 * for the whole dispatch, so the ride carries them rather than leaving them
 * standing where they were; they get out when it has come to rest; and they
 * walk back to their department's spot, which is where work starts.
 *
 * NOTHING IS TELEPORTED. Every leg here is a real leg of a real length walked
 * at that employee's own pace, including the step up into the seat and the
 * step back down out of it, which is why the ride's schedule waits for the
 * slowest of its riders before it is released.
 *
 * WHEN WORK STARTS. The sheet's minute, or the minute they are off the ride if
 * the ride could not physically be over by then — the same rule the walk from
 * the gate already obeys, extended to the last leg of the commute. The
 * dataset's own Actual Work Start is carried through untouched on `workStart`,
 * which is what the ride panel prints.
 */
/**
 * The climb itself, as waypoints on the real stair.
 *
 * The path is the one `boardingStair.ts` solved — the foot of the first step,
 * every landing, and the head of the last flight — so a figure walking it is on
 * the treads the whole way and turns at each landing the way a person on a
 * switchback does. Times are spread by distance along it, which makes the pace
 * constant, and the same path is walked in reverse on the way down.
 *
 * There is deliberately no waypoint per step: the noses of one flight are
 * collinear, so a waypoint at each would trace exactly the same line. What
 * makes the motion read as stepping rather than sliding is the character's
 * Climb clip, not the path.
 */
function pushStairPath(
  route: Waypoint[],
  stair: BoardingStair,
  from: number,
  to: number,
  descending: boolean,
  /* The last point of an ascent is the boarding deck itself, so that step off
     the top tread is where the climb ends and the platform begins. */
  finalPhase: JourneyPhase = "CLIMBING_LADDER",
): void {
  const points = descending ? [...stair.path].reverse() : stair.path;
  const spans: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
      points[i][2] - points[i - 1][2],
    );
    spans.push(d);
    total += d;
  }
  let covered = 0;
  for (let i = 1; i < points.length; i++) {
    covered += spans[i - 1];
    /* The last point of the climb is the platform head (or the foot of the
       stair going down), which the caller pushes itself. */
    if (i === points.length - 1) break;
    const t = from + (to - from) * (total > 0 ? covered / total : 1);
    route.push({
      x: points[i][0],
      y: points[i][1],
      z: points[i][2],
      arrive: t,
      depart: t,
      phase: "CLIMBING_LADDER",
    });
  }
  const last = points[points.length - 1];
  route.push({
    x: last[0],
    y: last[1],
    z: last[2],
    arrive: to,
    depart: to,
    phase: finalPhase,
  });
}

function finishJourney(
  a: Approach,
  stopIndex: number,
  rider: RideRider,
  segments: RideSegment[],
  holdUntil: number,
): JourneyEmployee {
  const route = a.route;
  const walkSpeed = a.walkSpeed;

  const stair = stairFor(a.rideId);

  /* Holding on the apron until the ride opens for boarding. */
  route.push({
    x: a.stand[0],
    z: a.stand[1],
    arrive: a.rideArrival + AT_RIDE_DWELL,
    depart: rider.boardAt,
    phase: "WAITING_AT_LADDER",
  });

  /*
   * Into the line at the foot of the stair, and standing in it.
   *
   * The stair is one person wide, so the queue is real: the head of it climbs
   * while the rest wait their turn, each of them in their own numbered place
   * rather than milling about at the bottom.
   */
  const slot = stair.queue[Math.min(rider.queueSlot, stair.queue.length - 1)];
  const toQueue = dist(a.stand, slot as Pt) / walkSpeed;
  const toFoot = dist(slot as Pt, stair.base as Pt) / walkSpeed;
  route.push({
    x: slot[0],
    z: slot[1],
    arrive: rider.boardAt + toQueue,
    depart: rider.ladderAt - toFoot,
    phase: "WAITING_AT_LADDER",
  });

  /* Their turn: the walk from the queue to the bottom step. */
  route.push({
    x: stair.base[0],
    z: stair.base[1],
    arrive: rider.ladderAt,
    depart: rider.ladderAt,
    phase: "WALKING_TO_LADDER",
  });

  /* Up the flights, landing by landing, and off the top step onto the deck. */
  pushStairPath(route, stair, rider.ladderAt, rider.deckAt, false, "ON_PLATFORM");

  /* Across the platform to their own seat's place at its edge. */
  const spot = deckSpotFor(stair, rider.seatIndex);
  route.push({
    x: spot[0],
    y: spot[1],
    z: spot[2],
    arrive: rider.atSeatSpotAt,
    depart: rider.atSeatSpotAt,
    phase: "WALKING_TO_SEAT",
  });

  /*
   * Down into the seat — and that is where the journey ends.
   *
   * THE SEAT IS THE LAST WAYPOINT. An employee who has reached their
   * department ride and sat down stays there, moving with the ride, for the
   * rest of the day: they do not climb back down, do not walk to a desk and do
   * not go home. The route therefore has nothing after this, so there is
   * nothing that could put them back on the ground.
   *
   * The stored position is the seat's place while the ride stands at rest,
   * which is where it really is for the climb in; from the moment they are
   * seated `sampleJourney` reads the seat's LIVE pose instead, so they travel
   * with the machine for as long as it runs.
   */
  const rest = seatPose(a.rideId, rider.seatIndex, 0);
  route.push({
    x: rest.x,
    y: rest.y,
    z: rest.z,
    arrive: rider.seatAt,
    depart: rider.seatAt,
    phase: "BOARDING",
  });
  route.push({
    x: rest.x,
    y: rest.y,
    z: rest.z,
    arrive: rider.seatAt,
    depart: holdUntil,
    phase: "SITTING_ON_RIDE",
  });

  /*
   * WORK HAS STARTED once they are in the seat — the sheet's own minute, or
   * the minute they sat down if the walk and the climb could not physically be
   * over by then. The dataset's Actual Work Start is carried through untouched
   * on `workStart`, which is what the ride panel prints.
   */
  const workStartActual = Math.max(a.workStartBeforeRide, rider.seatAt);

  return {
    id: a.id,
    name: a.name,
    department: a.department,
    rideId: a.rideId,
    rideName: a.rideName,
    checkInTime: a.checkInTime,
    color: a.color,
    visitsFoodCourt: a.visitsFoodCourt,
    foodCourtEntry: a.foodCourtEntry,
    foodCourtExit: a.foodCourtExit,
    chairIndex: a.chairIndex,
    sitMinutes: a.sitMinutes,
    rideArrival: a.rideArrival,
    rideSeatIndex: rider.seatIndex,
    rideCycleIndex: stopIndex,
    rideSegments: segments,
    queueSlot: rider.queueSlot,
    boardStart: rider.boardAt,
    ladderAt: rider.ladderAt,
    deckAt: rider.deckAt,
    atSeatSpotAt: rider.atSeatSpotAt,
    seatedAt: rider.seatAt,
    /* The first and last moments the ride turns with them aboard. */
    rideStart: segments.length ? segments[0].from : rider.seatAt,
    /*
     * Clamped to the end of the day. Rides now turn whenever nobody is getting
     * on them, so the last stretch of running a seated employee is aboard for
     * carries on past closing — but they leave the stage at `holdUntil`, and a
     * ride that turns with them aboard after that is not something the journey
     * can be sampled for.
     */
    rideEnd: Math.min(
      holdUntil,
      segments.length ? segments[segments.length - 1].to : rider.riseAt,
    ),
    riseAt: rider.riseAt,
    deckOutAt: rider.deckOutAt,
    groundAt: rider.groundAt,
    rideExit: rider.offAt,
    workStart: a.workStart,
    workStartActual,
    workStartBeforeRide: a.workStartBeforeRide,
    /* The sheet's own check-out minute, carried through untouched. Nothing
       acts on it any more: they are still in their seat when it passes. */
    checkOut: a.rowCheckOut,
    delayMinutes: a.delayMinutes,
    delayCategory: a.delayCategory,
    walkSpeed,
    spawnTime: a.spawnTime,
    /* They never leave, so they are on stage until the day ends. */
    despawnTime: holdUntil,
    route,
  };
}

/**
 * The built-in roster's journey — EMPLOYEE_DATASET through the same builder an
 * upload goes through. These module constants are what the park boots with,
 * what the verify suite asserts against, and what `reset` restores.
 */
export const BUILTIN_JOURNEY: JourneyData = buildJourney(EMPLOYEE_DATASET);

export const JOURNEY_EMPLOYEES: JourneyEmployee[] = BUILTIN_JOURNEY.employees;

export const EMPLOYEE_BY_ID: Record<string, JourneyEmployee> = BUILTIN_JOURNEY.byId;

export const LATE_ARRIVALS: LateArrival[] = BUILTIN_JOURNEY.lateArrivals;

export const LOOP_START = BUILTIN_JOURNEY.loopStart;
export const LOOP_END = BUILTIN_JOURNEY.loopEnd;
export const LOOP_MINUTES = BUILTIN_JOURNEY.loopMinutes;
/** The minute the built-in roster's playhead opens on. See `JourneyData`. */
export const OPENING_MINUTE = BUILTIN_JOURNEY.openingMinute;

export interface JourneySample {
  x: number;
  z: number;
  /** Height above the ground. Zero for every leg walked on it. */
  y: number;
  /** Heading in radians, for facing the direction of travel. */
  facing: number;
  /**
   * Tilt imposed by whatever the employee is attached to. Zero on the ground;
   * on a ride it is the seat's own pitch and roll, which is what makes a rider
   * lean with the machine instead of standing bolt upright inside it.
   */
  pitch: number;
  roll: number;
  /** True while actually walking, so the gait only animates on the move. */
  moving: boolean;
  /** True while strapped into a ride seat — seated, and carried by the ride. */
  onRide: boolean;
  /**
   * True once this employee's work has actually started.
   *
   * It used to be a phase of its own, because work began when they reached
   * their ride and they then walked home. They now stay in their seat for the
   * rest of the day, so "working" is no longer somewhere they stand — it is a
   * fact about the clock, and this is it.
   */
  working: boolean;
  phase: JourneyPhase;
}

/**
 * Where an employee is at a given sim time, or null if they have not arrived
 * outside the gate yet. Position is linearly interpolated along the leg, which
 * is what makes the walk constant-speed: leg durations were themselves derived
 * from leg lengths.
 */
export function sampleJourney(e: JourneyEmployee, simTime: number): JourneySample | null {
  const route = e.route;
  /* Not yet arrived outside the gate, or already gone home for the night. */
  if (simTime < route[0].arrive || simTime > e.despawnTime) return null;

  /*
   * The first waypoint this employee has not yet left, found by bisection.
   *
   * Departure times increase along a route, so the scan this used to do is a
   * binary search wearing a disguise — and routes grew from forty waypoints to
   * nearly three hundred when the boarding stairs put every tread on them.
   * Same answer, found in nine steps instead of three hundred.
   */
  let lo = 0;
  let hi = route.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (route[mid].depart >= simTime) hi = mid;
    else lo = mid + 1;
  }

  for (let i = lo; i < route.length; i++) {
    const w = route[i];

    if (simTime <= w.depart || i === route.length - 1) {
      if (simTime >= w.arrive) {
        /*
         * Seated on the ride: the seat itself is what moves, so the employee's
         * place is read off the ride's live geometry rather than off a fixed
         * waypoint. While the ride is stopped this returns exactly the resting
         * pose the waypoint stores, so the climb in and the climb out join up.
         */
        if (w.phase === "SITTING_ON_RIDE") {
          const t = segmentAnimationSeconds(e.rideId, e.rideSegments, simTime);
          const seat = seatPose(e.rideId, e.rideSeatIndex, t);
          return {
            x: seat.x,
            y: seat.y,
            z: seat.z,
            facing: seat.yaw,
            pitch: seat.pitch,
            roll: seat.roll,
            moving: false,
            onRide: true,
            working: simTime >= e.workStartActual,
            phase: w.phase,
          };
        }
        // Standing at this waypoint.
        const next = route[i + 1];
        const facing = next
          ? Math.atan2(next.x - w.x, next.z - w.z)
          : Math.atan2(GATE_X - w.x, GATE_Z - w.z);
        return {
          x: w.x,
          y: w.y ?? 0,
          z: w.z,
          facing,
          pitch: 0,
          roll: 0,
          moving: false,
          onRide: false,
          working: simTime >= e.workStartActual,
          phase: w.phase,
        };
      }
      // Walking towards it from the previous waypoint.
      const prev = route[i - 1];
      const span = w.arrive - prev.depart;
      const k = span > 0 ? (simTime - prev.depart) / span : 1;
      const dx = w.x - prev.x;
      const dz = w.z - prev.z;
      const py = prev.y ?? 0;
      const dy = (w.y ?? 0) - py;
      return {
        x: prev.x + dx * k,
        y: py + dy * k,
        z: prev.z + dz * k,
        facing: Math.atan2(dx, dz),
        pitch: 0,
        roll: 0,
        /* Climbing into or out of a seat is not a walk — the feet are off the
           ground — so the gait must not be driven by it. */
        moving: Math.hypot(dx, dz) > 1e-6,
        onRide: false,
        working: simTime >= e.workStartActual,
        phase: w.phase,
      };
    }
  }

  const last = route[route.length - 1];
  return {
    x: last.x,
    y: last.y ?? 0,
    z: last.z,
    facing: 0,
    pitch: 0,
    roll: 0,
    moving: false,
    onRide: false,
    working: simTime >= e.workStartActual,
    phase: last.phase,
  };
}

/** Human-readable time, or a dash when the employee never went. */
export function timeOrDash(minutes: number | null): string {
  return minutes === null ? "—" : formatSimTime(minutes);
}
