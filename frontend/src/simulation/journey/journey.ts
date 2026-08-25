import { classifyDelay } from "@/simulation/classification";
import { formatSimTime } from "@/simulation/clock";
import { rideForDepartment, type DepartmentRideId } from "@/components/park/departments";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_DETOUR_RADIUS,
  rideById,
} from "@/components/park/layout";
import { EMPLOYEE_DATASET, type DatasetRow } from "./dataset";
import {
  CHECK_IN_BANDS,
  CHECK_IN_DWELL,
  FOOD_COURT_DOOR,
  FOOD_COURT_DWELL_MAX,
  FOOD_COURT_DWELL_MIN,
  FOOD_COURT_SHARE,
  FOOD_COURT_TABLES,
  GATE_INNER_Z,
  GATE_X,
  GATE_Z,
  LANE_COUNT,
  LANE_SPACING,
  LOOP_LEAD_IN,
  LOOP_TAIL,
  QUEUE_SPACING,
  QUEUE_WAIT_MIN,
  QUEUE_WAIT_SPAN,
  SPAWN_Z,
  WALK_UNITS_PER_MINUTE,
  WALK_UNITS_PER_MINUTE_MAX,
  foodCourtToWorld,
} from "./constants";

/**
 * The employee journey, built from the EXACT dataset the brief supplies.
 *
 * The 50 rows in `dataset.ts` fix every employee's name, ID, department,
 * check-in time, delay and actual work-start time. This module derives the
 * MOVEMENT that honours those times: the walk in from outside is anchored so
 * the employee is at the gate at their exact check-in minute, and the walk to
 * their department ride is paced so they are standing at it when their given
 * work-start minute arrives. Pace, not data, is what flexes — an employee
 * with six minutes between gate and desk walks briskly (never faster than
 * 1.9 m/s), one with thirty-five queues at the ride until their time comes.
 * Nobody teleports, and no dataset time is ever adjusted.
 *
 * Reuses the park's existing modules rather than cloning them: department
 * destinations come from `rideForDepartment`, ride positions from the park
 * layout solver, the fountain geometry from the layout, the delay banding from
 * `classifyDelay()`, and clock formatting from `formatSimTime()`.
 */

/** Colour band an employee wears, decided purely by when they checked in. */
export type CheckInColor = "GREEN" | "YELLOW" | "RED";

export const CHECK_IN_COLOR_HEX: Record<CheckInColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

export const CHECK_IN_BAND_LABEL: Record<CheckInColor, string> = {
  GREEN: "9:00 – 9:30 AM",
  YELLOW: "9:30 – 10:00 AM",
  RED: "10:00 – 10:30 AM",
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
  | "WORKING";

export const PHASE_LABEL: Record<JourneyPhase, string> = {
  APPROACHING: "Walking to the entrance",
  QUEUED: "Waiting at the gate",
  CHECKING_IN: "Checking in at the main gate",
  ENTERING: "Entering the park",
  TO_FOOD_COURT: "Walking to the food court",
  IN_FOOD_COURT: "In the food court",
  TO_RIDE: "Walking to their department ride",
  AT_RIDE: "Arrived at their department ride",
  WORKING: "Work started",
};

/** Check-in time decides the colour, exactly as the brief specifies. */
export function checkInColor(checkInMinutes: number): CheckInColor {
  if (checkInMinutes < CHECK_IN_BANDS.greenEnd) return "GREEN";
  if (checkInMinutes < CHECK_IN_BANDS.yellowEnd) return "YELLOW";
  return "RED";
}

interface Waypoint {
  x: number;
  z: number;
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

  visitsFoodCourt: boolean;
  foodCourtEntry: number | null;
  foodCourtExit: number | null;

  rideArrival: number;
  workStart: number;
  delayMinutes: number;
  /** The park's existing delay banding, applied to the real delay. */
  delayCategory: ReturnType<typeof classifyDelay>;

  /** Metres per simulated minute this employee walks inside the park. */
  walkSpeed: number;

  /** First moment the figure is on screen. */
  spawnTime: number;
  route: Waypoint[];
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

  const stand: Pt = [
    cx + ux * (reach + 14 + back) + px * lateral,
    cz + uz * (reach + 14 + back) + pz * lateral,
  ];
  const approach: Pt = [
    cx + ux * (reach + 58) + px * lateral * 0.4,
    cz + uz * (reach + 58) + pz * lateral * 0.4,
  ];
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

/** Local seat for a diner, spread across the court's real tables. */
function tableFor(index: number): Pt {
  return foodCourtToWorld(FOOD_COURT_TABLES[index % FOOD_COURT_TABLES.length]);
}

/**
 * Walking distance from the gate to the stand, through the food court or not.
 * Used both to pick who can afford a food-court stop and to pace the walk.
 */
function insideDistance(gate: Pt, gateInner: Pt, stand: Pt, approach: Pt, table: Pt | null): number {
  let d = legLength(gate, gateInner);
  if (table) {
    d += legLength(gateInner, FOOD_COURT_DOOR as Pt);
    d += legLength(FOOD_COURT_DOOR as Pt, table);
    d += legLength(table, FOOD_COURT_DOOR as Pt);
    d += legLength(FOOD_COURT_DOOR as Pt, approach);
  } else {
    d += legLength(gateInner, approach);
  }
  d += legLength(approach, stand);
  return d;
}

function build(): JourneyEmployee[] {
  const rand = mulberry32(0x10aded);
  const rows = EMPLOYEE_DATASET;

  // The dataset is the source of truth — prove it is internally consistent
  // before building anything on top of it.
  for (const row of rows) {
    if (row.workStart - row.checkIn !== row.delayMinutes) {
      throw new Error(
        `Dataset row ${row.id}: workStart - checkIn = ${row.workStart - row.checkIn}, ` +
          `but delay says ${row.delayMinutes}. The dataset must not be altered to fit.`,
      );
    }
  }

  // Per-ride seat counting, so a department's crowd fans out realistically.
  const perRideTotal: Record<string, number> = {};
  for (const row of rows) {
    const rideId = rideForDepartment(row.department).rideId;
    perRideTotal[rideId] = (perRideTotal[rideId] ?? 0) + 1;
  }
  const perRideIndex: Record<string, number> = {};

  /*
   * Who stops for food: the brief asks for roughly 35%, and the times are
   * fixed, so eligibility comes first — an employee can only take a break if
   * the walk through the court plus the minimum sit-down still gets them to
   * their ride before their own work-start. Among the eligible, a ranked
   * deterministic key picks exactly the target count, so the share is pinned
   * rather than left to chance.
   */
  const pick = mulberry32(0xf00d);
  const keys = rows.map(() => pick());
  const geometry = rows.map((row, i) => {
    const dept = rideForDepartment(row.department);
    const seatIndex = perRideIndex[dept.rideId] ?? 0;
    perRideIndex[dept.rideId] = seatIndex + 1;

    const laneOffset = ((i % LANE_COUNT) - (LANE_COUNT - 1) / 2) * LANE_SPACING;
    const spawn: Pt = [GATE_X + laneOffset * 1.15, SPAWN_Z + (i % 5) * 9];
    const gateWait: Pt = [GATE_X + laneOffset * 0.6, GATE_Z + 30];
    const gate: Pt = [GATE_X + laneOffset * 0.42, GATE_Z];
    const gateInner: Pt = [GATE_X + laneOffset * 0.8, GATE_INNER_Z];
    const { stand, approach } = ridePoints(dept.rideId, seatIndex, perRideTotal[dept.rideId]);
    const table = tableFor(seatIndex);

    const direct = insideDistance(gate, gateInner, stand, approach, null);
    const viaFood = insideDistance(gate, gateInner, stand, approach, table);
    // Minutes of slack left over if they walked the food-court route at the
    // BASE pace and sat for the minimum stay.
    const slack =
      row.workStart -
      row.checkIn -
      CHECK_IN_DWELL -
      MIN_BOARDING -
      viaFood / WALK_UNITS_PER_MINUTE -
      FOOD_COURT_DWELL_MIN;
    return { dept, seatIndex, spawn, gateWait, gate, gateInner, stand, approach, table, direct, viaFood, slack };
  });

  const foodTarget = Math.round(rows.length * FOOD_COURT_SHARE);
  const eligible = rows
    .map((_, i) => i)
    .filter((i) => geometry[i].slack > 0)
    .sort((a, b) => keys[a] - keys[b]);
  const foodVisitors = new Set(eligible.slice(0, foodTarget));

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

  return rows.map((row, i) => buildOne(row, i, geometry[i], queue[i], foodVisitors.has(i), rand));
}

interface Geometry {
  dept: ReturnType<typeof rideForDepartment>;
  seatIndex: number;
  spawn: Pt;
  gateWait: Pt;
  gate: Pt;
  gateInner: Pt;
  stand: Pt;
  approach: Pt;
  table: Pt;
  direct: number;
  viaFood: number;
  slack: number;
}

function buildOne(
  row: DatasetRow,
  index: number,
  g: Geometry,
  q: { wait: number; depth: number },
  visitsFoodCourt: boolean,
  rand: () => number,
): JourneyEmployee {
  const route: Waypoint[] = [];
  const color = checkInColor(row.checkIn);

  // Food-court stay, clipped so even the longest sit-down cannot make this
  // employee miss their own work-start at the base walking pace.
  const dwell = visitsFoodCourt
    ? FOOD_COURT_DWELL_MIN +
      rand() * (Math.min(FOOD_COURT_DWELL_MAX, FOOD_COURT_DWELL_MIN + g.slack) - FOOD_COURT_DWELL_MIN)
    : 0;

  // Pace the inside walk to the fixed work-start: base pace when there is
  // time, brisk when there is not, never faster than a person walks.
  const walkDistance = visitsFoodCourt ? g.viaFood : g.direct;
  const budget = row.workStart - row.checkIn - CHECK_IN_DWELL - dwell - MIN_BOARDING;
  const needed = walkDistance / Math.max(budget, 1e-6);
  const walkSpeed = Math.min(
    WALK_UNITS_PER_MINUTE_MAX,
    Math.max(WALK_UNITS_PER_MINUTE, needed),
  );

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

  if (visitsFoodCourt) {
    walkTo(FOOD_COURT_DOOR as Pt, "TO_FOOD_COURT");
    foodCourtEntry = t;
    walkTo(g.table, "IN_FOOD_COURT");
    // Sit until the stay is up, then step back out of the door.
    const backOut = legLength(g.table, FOOD_COURT_DOOR as Pt) / walkSpeed;
    const eatUntil = foodCourtEntry + dwell - backOut;
    route[route.length - 1].depart = eatUntil;
    t = eatUntil;
    walkTo(FOOD_COURT_DOOR as Pt, "IN_FOOD_COURT");
    foodCourtExit = t;
  }

  walkTo(g.approach, "TO_RIDE");
  walkTo(g.stand, "TO_RIDE");
  const rideArrival = t;

  if (rideArrival > row.workStart) {
    throw new Error(
      `${row.id} cannot reach ${g.dept.rideName} by their work-start ` +
        `(${formatSimTime(row.workStart)}) even at the maximum walking pace. ` +
        `Arrived ${formatSimTime(rideArrival)}.`,
    );
  }

  // Queueing and boarding at the ride fills whatever time the dataset left,
  // and the WORKING state begins at exactly the given minute.
  route.push({ x: g.stand[0], z: g.stand[1], arrive: rideArrival, depart: row.workStart, phase: "AT_RIDE" });
  route.push({
    x: g.stand[0],
    z: g.stand[1],
    arrive: row.workStart,
    depart: Number.POSITIVE_INFINITY,
    phase: "WORKING",
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
    rideArrival,
    workStart: row.workStart,
    delayMinutes: row.delayMinutes,
    delayCategory: classifyDelay(row.delayMinutes),
    walkSpeed,
    spawnTime,
    route,
  };
}

export const JOURNEY_EMPLOYEES: JourneyEmployee[] = build();

export const EMPLOYEE_BY_ID: Record<string, JourneyEmployee> = Object.fromEntries(
  JOURNEY_EMPLOYEES.map((e) => [e.id, e]),
);

/** The simulated day runs from just before the first arrival to just after the last work start. */
export const LOOP_START =
  Math.min(...JOURNEY_EMPLOYEES.map((e) => e.spawnTime)) - LOOP_LEAD_IN;
export const LOOP_END = Math.max(...JOURNEY_EMPLOYEES.map((e) => e.workStart)) + LOOP_TAIL;
export const LOOP_MINUTES = LOOP_END - LOOP_START;

export interface JourneySample {
  x: number;
  z: number;
  /** Heading in radians, for facing the direction of travel. */
  facing: number;
  /** True while actually walking, so the gait only animates on the move. */
  moving: boolean;
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
  if (simTime < route[0].arrive) return null;

  for (let i = 0; i < route.length; i++) {
    const w = route[i];

    if (simTime <= w.depart || i === route.length - 1) {
      if (simTime >= w.arrive) {
        // Standing at this waypoint.
        const next = route[i + 1];
        const facing = next
          ? Math.atan2(next.x - w.x, next.z - w.z)
          : Math.atan2(GATE_X - w.x, GATE_Z - w.z);
        return { x: w.x, z: w.z, facing, moving: false, phase: w.phase };
      }
      // Walking towards it from the previous waypoint.
      const prev = route[i - 1];
      const span = w.arrive - prev.depart;
      const k = span > 0 ? (simTime - prev.depart) / span : 1;
      const dx = w.x - prev.x;
      const dz = w.z - prev.z;
      return {
        x: prev.x + dx * k,
        z: prev.z + dz * k,
        facing: Math.atan2(dx, dz),
        moving: true,
        phase: w.phase,
      };
    }
  }

  const last = route[route.length - 1];
  return { x: last.x, z: last.z, facing: 0, moving: false, phase: last.phase };
}

/** Human-readable time, or a dash when the employee never went. */
export function timeOrDash(minutes: number | null): string {
  return minutes === null ? "—" : formatSimTime(minutes);
}
