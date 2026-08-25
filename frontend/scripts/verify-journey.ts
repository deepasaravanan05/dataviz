import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECK_IN_COLOR_HEX,
  EMPLOYEE_BY_ID,
  JOURNEY_EMPLOYEES,
  LOOP_END,
  LOOP_MINUTES,
  LOOP_START,
  checkInColor,
  fountainDetour,
  sampleJourney,
} from "../src/simulation/journey/journey";
import { EMPLOYEE_DATASET, parseClockTime } from "../src/simulation/journey/dataset";
import {
  CHECK_IN_BANDS,
  CHECK_IN_CLOSE,
  CHECK_IN_DWELL,
  CHECK_IN_OPEN,
  FOOD_COURT_DWELL_MAX,
  FOOD_COURT_DWELL_MIN,
  FOOD_COURT_CENTER,
  FOOD_COURT_DOOR,
  FOOD_COURT_HALF,
  FOOD_COURT_TABLES,
  GATE_OPENING,
  GATE_X,
  GATE_Z,
  WALK_UNITS_PER_MINUTE,
  WALK_UNITS_PER_MINUTE_MAX,
  foodCourtToWorld,
} from "../src/simulation/journey/constants";
import { classifyDelay } from "../src/simulation/classification";
import { DEPARTMENTS, RIDE_DEPARTMENTS, rideForDepartment } from "../src/components/park/departments";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_CLEARANCE,
  FOUNTAIN_RADIUS,
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  rideById,
  viewAngles,
} from "../src/components/park/layout";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const employeesSrc = read("src", "components", "park", "journey", "Employees.tsx");
const gateSrc = read("src", "components", "main-gate", "MainGate.tsx");
const courtSrc = read("src", "components", "food-court", "FoodCourt.tsx");
const panelSrc = read("src", "components", "hud", "EmployeePanel.tsx");
const journeySrc = read("src", "simulation", "journey", "journey.ts");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

// ============ 1. The dataset — the EXACT 50 rows the brief supplies ============
/*
 * The brief's table is restated here verbatim and compared field-for-field
 * against what the app actually loads. If anyone renames a person, nudges a
 * time or "fixes" a delay, this is where it dies.
 */
const BRIEF_TABLE = `
EMP001|Arjun Mehta|Tech|09:02 AM|12|09:14 AM
EMP002|Priya Sharma|Finance|09:05 AM|18|09:23 AM
EMP003|Rahul Kumar|ERP|09:08 AM|25|09:33 AM
EMP004|Sneha Patel|Cyber Security|09:12 AM|31|09:43 AM
EMP005|Karthik Raj|Data Engineering|09:15 AM|10|09:25 AM
EMP006|Divya Nair|IT Support|09:18 AM|15|09:33 AM
EMP007|Vikram Singh|Operations|09:21 AM|22|09:43 AM
EMP008|Ananya Iyer|Tech|09:24 AM|8|09:32 AM
EMP009|Rohit Verma|Finance|09:27 AM|20|09:47 AM
EMP010|Meena Krishnan|ERP|09:29 AM|35|10:04 AM
EMP011|Sanjay Kumar|Cyber Security|09:31 AM|14|09:45 AM
EMP012|Kavya Reddy|Data Engineering|09:34 AM|11|09:45 AM
EMP013|Naveen Raj|IT Support|09:36 AM|27|10:03 AM
EMP014|Harini S|Operations|09:38 AM|9|09:47 AM
EMP015|Aditya Sharma|Tech|09:40 AM|30|10:10 AM
EMP016|Pooja Menon|Finance|09:42 AM|17|09:59 AM
EMP017|Manoj Kumar|ERP|09:44 AM|24|10:08 AM
EMP018|Aishwarya R|Cyber Security|09:46 AM|7|09:53 AM
EMP019|Suresh Babu|Data Engineering|09:48 AM|21|10:09 AM
EMP020|Keerthana V|IT Support|09:50 AM|13|10:03 AM
EMP021|Ajay Kumar|Operations|09:52 AM|29|10:21 AM
EMP022|Swetha R|Tech|09:54 AM|16|10:10 AM
EMP023|Dinesh Kumar|Finance|09:56 AM|26|10:22 AM
EMP024|Nithya Raj|ERP|09:58 AM|12|10:10 AM
EMP025|Praveen S|Cyber Security|10:00 AM|23|10:23 AM
EMP026|Lakshmi Devi|Data Engineering|10:02 AM|15|10:17 AM
EMP027|Arun Kumar|IT Support|10:04 AM|20|10:24 AM
EMP028|Deepak Raj|Operations|10:06 AM|34|10:40 AM
EMP029|Shalini P|Tech|10:08 AM|6|10:14 AM
EMP030|Gokul S|Finance|10:10 AM|30|10:40 AM
EMP031|Riya Kapoor|ERP|10:12 AM|13|10:25 AM
EMP032|Vishnu Kumar|Cyber Security|10:14 AM|18|10:32 AM
EMP033|Ramya S|Data Engineering|10:16 AM|16|10:32 AM
EMP034|Surya Prakash|IT Support|10:18 AM|9|10:27 AM
EMP035|Monika R|Operations|10:20 AM|17|10:37 AM
EMP036|Bala Murugan|Tech|10:22 AM|28|10:50 AM
EMP037|Ishita Sharma|Finance|10:24 AM|14|10:38 AM
EMP038|Hari Krishnan|ERP|10:26 AM|27|10:53 AM
EMP039|Swathi Nair|Cyber Security|10:28 AM|11|10:39 AM
EMP040|Ganesh R|Data Engineering|10:30 AM|22|10:52 AM
EMP041|Tanya Gupta|IT Support|09:07 AM|19|09:26 AM
EMP042|Mohan Das|Operations|09:16 AM|12|09:28 AM
EMP043|Reshma K|Tech|09:33 AM|15|09:48 AM
EMP044|Akash Verma|Finance|09:47 AM|33|10:20 AM
EMP045|Bhavya R|ERP|10:03 AM|8|10:11 AM
EMP046|Rakesh Kumar|Cyber Security|10:11 AM|13|10:24 AM
EMP047|Sangeetha P|Data Engineering|10:19 AM|20|10:39 AM
EMP048|Lokesh M|IT Support|09:43 AM|25|10:08 AM
EMP049|Janani S|Operations|09:55 AM|7|10:02 AM
EMP050|Yashwanth R|Tech|10:27 AM|18|10:45 AM
`.trim().split("\n").map((line) => {
  const [id, name, department, checkIn, delay, workStart] = line.split("|");
  return { id, name, department, checkIn: parseClockTime(checkIn), delayMinutes: Number(delay), workStart: parseClockTime(workStart) };
});

check(
  "exactly the brief's 50 employees are simulated",
  JOURNEY_EMPLOYEES.length === 50 && EMPLOYEE_DATASET.length === 50,
  `${JOURNEY_EMPLOYEES.length} employees`,
);
{
  let mismatches = 0;
  let example = "";
  for (let i = 0; i < BRIEF_TABLE.length; i++) {
    const b = BRIEF_TABLE[i];
    const e = JOURNEY_EMPLOYEES[i];
    if (
      !e ||
      e.id !== b.id ||
      e.name !== b.name ||
      e.department !== b.department ||
      e.checkInTime !== b.checkIn ||
      e.delayMinutes !== b.delayMinutes ||
      e.workStart !== b.workStart
    ) {
      mismatches++;
      if (!example) example = `${b.id}: got ${e?.name} / ${e?.department} / ${e?.checkInTime} / ${e?.delayMinutes} / ${e?.workStart}`;
    }
  }
  check(
    "every id, name, department, check-in, delay and work-start matches the brief verbatim",
    mismatches === 0,
    example || "all 50 rows byte-for-byte",
  );
  check(
    "the supplied delays are internally consistent: delay = work start − check-in on every row",
    BRIEF_TABLE.every((b) => b.workStart - b.checkIn === b.delayMinutes),
    "the brief's own arithmetic holds",
  );
}
check(
  "every employee id is unique",
  new Set(JOURNEY_EMPLOYEES.map((e) => e.id)).size === JOURNEY_EMPLOYEES.length,
  `${new Set(JOURNEY_EMPLOYEES.map((e) => e.id)).size} distinct ids`,
);
check(
  "every employee has a distinct name",
  new Set(JOURNEY_EMPLOYEES.map((e) => e.name)).size === JOURNEY_EMPLOYEES.length,
  `${new Set(JOURNEY_EMPLOYEES.map((e) => e.name)).size} distinct names`,
);
check(
  "every record carries the full set of fields the brief lists",
  JOURNEY_EMPLOYEES.every(
    (e) =>
      typeof e.id === "string" &&
      typeof e.name === "string" &&
      typeof e.department === "string" &&
      Number.isFinite(e.checkInTime) &&
      typeof e.visitsFoodCourt === "boolean" &&
      (e.visitsFoodCourt ? Number.isFinite(e.foodCourtEntry!) : e.foodCourtEntry === null) &&
      (e.visitsFoodCourt ? Number.isFinite(e.foodCourtExit!) : e.foodCourtExit === null) &&
      Number.isFinite(e.rideArrival) &&
      Number.isFinite(e.workStart) &&
      Number.isFinite(e.delayMinutes) &&
      typeof e.delayCategory === "string",
  ),
  "id, name, department, check-in, food-court flag and times, ride arrival, work start, delay, category",
);

// ============ 2. Check-in times and colours ============
const checkIns = JOURNEY_EMPLOYEES.map((e) => e.checkInTime);
check(
  "every check-in falls inside 9:00 AM – 10:30 AM",
  checkIns.every((t) => t >= CHECK_IN_OPEN && t <= CHECK_IN_CLOSE),
  `range ${Math.min(...checkIns).toFixed(1)} – ${Math.max(...checkIns).toFixed(1)} minutes-of-day`,
);
check(
  "colour is decided by check-in time and nothing else",
  JOURNEY_EMPLOYEES.every((e) => e.color === checkInColor(e.checkInTime)),
  "every employee's colour re-derives from their own check-in",
);
check(
  "GREEN is exactly 9:00–9:30",
  JOURNEY_EMPLOYEES.every((e) => (e.color === "GREEN") === (e.checkInTime < CHECK_IN_BANDS.greenEnd)),
  `${JOURNEY_EMPLOYEES.filter((e) => e.color === "GREEN").length} green`,
);
check(
  "YELLOW is exactly 9:30–10:00",
  JOURNEY_EMPLOYEES.every(
    (e) =>
      (e.color === "YELLOW") ===
      (e.checkInTime >= CHECK_IN_BANDS.greenEnd && e.checkInTime < CHECK_IN_BANDS.yellowEnd),
  ),
  `${JOURNEY_EMPLOYEES.filter((e) => e.color === "YELLOW").length} yellow`,
);
check(
  "RED is exactly 10:00–10:30",
  JOURNEY_EMPLOYEES.every((e) => (e.color === "RED") === (e.checkInTime >= CHECK_IN_BANDS.yellowEnd)),
  `${JOURNEY_EMPLOYEES.filter((e) => e.color === "RED").length} red`,
);
check(
  "the band boundaries land exactly where the brief draws them",
  checkInColor(9 * 60 + 29) === "GREEN" &&
    checkInColor(9 * 60 + 30) === "YELLOW" &&
    checkInColor(9 * 60 + 59) === "YELLOW" &&
    checkInColor(10 * 60) === "RED" &&
    checkInColor(10 * 60 + 30) === "RED",
  "9:29 GREEN | 9:30 YELLOW | 9:59 YELLOW | 10:00 RED | 10:30 RED",
);
check(
  "all three colour bands are actually populated",
  (["GREEN", "YELLOW", "RED"] as const).every((c) => JOURNEY_EMPLOYEES.some((e) => e.color === c)),
  (["GREEN", "YELLOW", "RED"] as const)
    .map((c) => `${c} ${JOURNEY_EMPLOYEES.filter((e) => e.color === c).length}`)
    .join(", "),
);
check(
  "arrivals are staggered, not simultaneous",
  new Set(checkIns.map((t) => Math.round(t))).size >= JOURNEY_EMPLOYEES.length * 0.6,
  `${new Set(checkIns.map((t) => Math.round(t))).size} distinct arrival minutes across ${JOURNEY_EMPLOYEES.length} people`,
);

// ============ 3. Delay is real arithmetic on the real times ============
check(
  "delay is work start minus check-in, to the minute",
  JOURNEY_EMPLOYEES.every((e) => Math.abs(e.delayMinutes - (e.workStart - e.checkInTime)) < 1e-9),
  "no employee's delay is stated independently of their own timeline",
);
check(
  "the delay band reuses the park's existing classifyDelay()",
  JOURNEY_EMPLOYEES.every((e) => e.delayCategory === classifyDelay(e.delayMinutes)) &&
    /classifyDelay/.test(journeySrc),
  "no second delay-classification system was written",
);
check(
  "no employee starts work before checking in",
  JOURNEY_EMPLOYEES.every((e) => e.workStart > e.checkInTime),
  `smallest delay ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.delayMinutes)).toFixed(1)} min`,
);

// ============ 4. The two paths ============
const visitors = JOURNEY_EMPLOYEES.filter((e) => e.visitsFoodCourt);
const direct = JOURNEY_EMPLOYEES.filter((e) => !e.visitsFoodCourt);
const share = visitors.length / JOURNEY_EMPLOYEES.length;
check(
  "both behaviours exist — some via the food court, some straight to the ride",
  visitors.length > 0 && direct.length > 0,
  `${visitors.length} via the food court, ${direct.length} direct`,
);
check(
  "the food-court share is a realistic minority, roughly 30–40%",
  share >= 0.25 && share <= 0.45,
  `${(share * 100).toFixed(0)}%`,
);
check(
  "food-court visitors have both an entry and an exit time, in that order",
  visitors.every((e) => e.foodCourtEntry! < e.foodCourtExit!),
  `dwell ${Math.min(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)}–${Math.max(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)} min`,
);
check(
  "non-visitors have no food-court times at all",
  direct.every((e) => e.foodCourtEntry === null && e.foodCourtExit === null),
  `${direct.length} employees show a dash, not a fabricated time`,
);
check(
  "the whole journey is in order: check-in → food court → ride → work start",
  visitors.every(
    (e) =>
      e.checkInTime < e.foodCourtEntry! &&
      e.foodCourtExit! < e.rideArrival &&
      e.rideArrival < e.workStart,
  ) && direct.every((e) => e.checkInTime < e.rideArrival && e.rideArrival < e.workStart),
  "no stage ever runs backwards",
);

// ============ 5. Departments come from the dataset, not at random ============
check(
  "every employee's ride is the ride their department maps to",
  JOURNEY_EMPLOYEES.every((e) => {
    const d = rideForDepartment(e.department);
    return d.rideId === e.rideId && d.rideName === e.rideName;
  }),
  "destination is looked up from the department mapping, never assigned ad hoc",
);
check(
  "all seven dataset departments are represented",
  DEPARTMENTS.every((d) => JOURNEY_EMPLOYEES.some((e) => e.department === d.department)),
  DEPARTMENTS.map(
    (d) => `${d.department} ${JOURNEY_EMPLOYEES.filter((e) => e.department === d.department).length}`,
  ).join(", "),
);
check(
  "no employee is sent to a ride that is not their department's",
  JOURNEY_EMPLOYEES.every((e) => rideById(e.rideId).label === e.rideName),
  "ride names re-read from the park layout",
);

// ============ 6. Everyone uses the ONE gate, and only after checking in ============
const openingHalf = GATE_OPENING / 2;
let widestGateOffset = 0;
let earlyEntry = 0;
let gateMisses = 0;

for (const e of JOURNEY_EMPLOYEES) {
  const at = sampleJourney(e, e.checkInTime);
  if (!at || Math.abs(at.z - GATE_Z) > 0.5) gateMisses++;
  if (at) widestGateOffset = Math.max(widestGateOffset, Math.abs(at.x - GATE_X));

  // Anywhere before check-in, the employee must still be outside the gate line.
  for (let t = e.spawnTime; t < e.checkInTime; t += 0.05) {
    const s = sampleJourney(e, t);
    if (s && s.z < GATE_Z - 1e-6) {
      earlyEntry++;
      break;
    }
  }
}
check(
  "every employee is standing at the gate line at their own check-in time",
  gateMisses === 0,
  `${JOURNEY_EMPLOYEES.length}/${JOURNEY_EMPLOYEES.length} at z = ${GATE_Z}`,
);
check(
  "every employee passes through the single opening",
  widestGateOffset <= openingHalf,
  `widest crossing ${widestGateOffset.toFixed(1)}u from centre; opening is +/-${openingHalf}u`,
);
check(
  "nobody is inside the park before they have checked in",
  earlyEntry === 0,
  "no employee crosses the gate line early",
);
check(
  "there is exactly one main gate in the scene",
  (scene.match(/<ParkJourney \/>/g) ?? []).length === 1 &&
    (read("src", "components", "park", "journey", "ParkJourney.tsx").match(/<MainGate \/>/g) ?? [])
      .length === 1,
  "one MainGate, mounted once",
);

// ============ 7. Nobody teleports — and nobody outruns a human ============
/*
 * The dataset fixes both ends of every journey, so pace is the only honest
 * degree of freedom: an employee with a tight budget walks briskly, but the
 * builder clamps everyone to WALK_UNITS_PER_MINUTE_MAX (1.9 m/s). Here the
 * observed motion is measured against each employee's OWN declared pace, and
 * that pace against the human ceiling.
 */
const STEP = 0.05;
let maxSpeed = 0;
let maxJump = 0;
let worst = "";
let overOwnPace = 0;
for (const e of JOURNEY_EMPLOYEES) {
  let own = 0;
  let prev = sampleJourney(e, e.spawnTime);
  for (let t = e.spawnTime + STEP; t <= e.workStart + 4; t += STEP) {
    const s = sampleJourney(e, t);
    if (!s || !prev) {
      prev = s;
      continue;
    }
    const d = Math.hypot(s.x - prev.x, s.z - prev.z);
    own = Math.max(own, d / STEP);
    if (d / STEP > maxSpeed) {
      maxSpeed = d / STEP;
      worst = `${e.id} at ${t.toFixed(1)}`;
    }
    maxJump = Math.max(maxJump, d);
    prev = s;
  }
  if (own > e.walkSpeed * 1.02) overOwnPace++;
}
check(
  "no employee ever exceeds their own declared pace — nobody teleports",
  overOwnPace === 0,
  `fastest observed ${maxSpeed.toFixed(1)} u/min (${worst})`,
);
check(
  "every declared pace is human: between the base walk and a 1.9 m/s brisk walk",
  JOURNEY_EMPLOYEES.every(
    (e) => e.walkSpeed >= WALK_UNITS_PER_MINUTE - 1e-9 && e.walkSpeed <= WALK_UNITS_PER_MINUTE_MAX + 1e-9,
  ),
  `paces ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.walkSpeed)).toFixed(1)}–${Math.max(...JOURNEY_EMPLOYEES.map((e) => e.walkSpeed)).toFixed(1)} u/min`,
);
check(
  "the path is continuous — no position jumps between frames",
  maxJump <= WALK_UNITS_PER_MINUTE_MAX * STEP * 1.02,
  `largest single step ${maxJump.toFixed(2)}u`,
);
{
  /*
   * Behavioural, not textual: every moving leg's duration must equal its
   * length divided by a sanctioned speed — the employee's own inside-the-park
   * pace, or the base pace used for the walk-up outside the gate.
   */
  let badLegs = 0;
  let sampleLeg = "";
  for (const e of JOURNEY_EMPLOYEES) {
    for (let i = 1; i < e.route.length; i++) {
      const a = e.route[i - 1];
      const b = e.route[i];
      const span = b.arrive - a.depart;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 1e-9 || span < 1e-9) continue;
      const v = len / span;
      const sanctioned =
        Math.abs(v - e.walkSpeed) < 0.5 || Math.abs(v - WALK_UNITS_PER_MINUTE) < 0.5;
      if (!sanctioned) {
        badLegs++;
        if (!sampleLeg) sampleLeg = `${e.id} leg ${i} at ${v.toFixed(1)} u/min`;
      }
    }
  }
  check(
    "every leg's duration is its real length divided by a declared walking speed",
    badLegs === 0,
    sampleLeg || "durations are derived from distances, not assigned",
  );
}

// ============ 8. The phases actually happen, in the park ============
const seen = new Map<string, Set<string>>();
for (const e of JOURNEY_EMPLOYEES) {
  const phases = new Set<string>();
  for (let t = e.spawnTime; t <= e.workStart + 2; t += 0.1) {
    const s = sampleJourney(e, t);
    if (s) phases.add(s.phase);
  }
  seen.set(e.id, phases);
}
check(
  "food-court visitors are actually shown inside the food court",
  visitors.every((e) => seen.get(e.id)!.has("IN_FOOD_COURT")),
  `${visitors.length} employees enter and leave the court`,
);
check(
  "employees who skip the food court are never shown inside it",
  direct.every((e) => !seen.get(e.id)!.has("IN_FOOD_COURT")),
  `${direct.length} go straight from the gate to their ride`,
);
check(
  "every employee is shown approaching, queueing, checking in, walking, arriving and starting work",
  JOURNEY_EMPLOYEES.every((e) => {
    const p = seen.get(e.id)!;
    return (
      p.has("APPROACHING") &&
      p.has("QUEUED") &&
      p.has("CHECKING_IN") &&
      p.has("TO_RIDE") &&
      p.has("AT_RIDE") &&
      p.has("WORKING")
    );
  }),
  "the full timeline is visible for all 50",
);
check(
  "diners sit at tables that really exist in the food court",
  visitors.every((e) =>
    e.route.some((w) =>
      FOOD_COURT_TABLES.some((tbl) => {
        const world = foodCourtToWorld(tbl);
        return Math.hypot(w.x - world[0], w.z - world[1]) < 1e-6;
      }),
    ),
  ),
  `${FOOD_COURT_TABLES.length} tables, shared by walkers and furniture from one constant`,
);

// ============ 9. Everyone ends up at their own ride ============
let wrongRide = 0;
for (const e of JOURNEY_EMPLOYEES) {
  const s = sampleJourney(e, e.workStart + 1)!;
  const own = rideById(e.rideId);
  const dOwn = Math.hypot(s.x - own.center[0], s.z - own.center[1]);
  const nearest = PARK_LAYOUT.reduce(
    (best, r) => {
      const d = Math.hypot(s.x - r.center[0], s.z - r.center[1]);
      return d < best.d ? { id: r.id, d } : best;
    },
    { id: "", d: Infinity },
  );
  if (nearest.id !== e.rideId) wrongRide++;
  if (dOwn > Math.max(own.halfX, own.halfZ) + 60) wrongRide++;
}
check(
  "every employee finishes at their own department's ride, and no other",
  wrongRide === 0,
  "closest ride to each finished employee is their assigned one",
);

// ============ 10. The new structures sit in free ground ============
const trackPts: [number, number][] = [];
for (let i = 0; i <= 1200; i++) {
  const p = TRACK_CURVE.getPointAt(i / 1200);
  trackPts.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
}
const trackDist = (x: number, z: number) =>
  trackPts.reduce((m, [px, pz]) => Math.min(m, Math.hypot(x - px, z - pz)), Infinity);
function insideLoop(x: number, z: number) {
  let inside = false;
  for (let i = 0, j = trackPts.length - 1; i < trackPts.length; j = i++) {
    const [xi, zi] = trackPts[i];
    const [xj, zj] = trackPts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
const boxDist = (x: number, z: number, r: (typeof PARK_LAYOUT)[number]) =>
  Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
const nearestRide = (x: number, z: number) =>
  PARK_LAYOUT.reduce((m, r) => Math.min(m, boxDist(x, z, r)), Infinity);

const fcRide = nearestRide(...FOOD_COURT_CENTER);
check(
  "the food court clears every ride footprint",
  fcRide > FOOD_COURT_HALF + 30,
  `${fcRide.toFixed(0)}u to the nearest ride, footprint half-size ${FOOD_COURT_HALF}u`,
);
check(
  "the food court clears the train's rails",
  trackDist(...FOOD_COURT_CENTER) > FOOD_COURT_HALF + 15,
  `${trackDist(...FOOD_COURT_CENTER).toFixed(0)}u to the rails`,
);
check(
  "the food court clears the plaza",
  Math.hypot(FOOD_COURT_CENTER[0] - PLAZA_CENTER[0], FOOD_COURT_CENTER[1] - PLAZA_CENTER[1]) -
    PLAZA_RADIUS >
    FOOD_COURT_HALF,
  `${(Math.hypot(FOOD_COURT_CENTER[0] - PLAZA_CENTER[0], FOOD_COURT_CENTER[1] - PLAZA_CENTER[1]) - PLAZA_RADIUS).toFixed(0)}u to the plaza edge`,
);
check(
  "the food court really is inside the park, not beyond the railway",
  insideLoop(...FOOD_COURT_CENTER),
  "inside the train loop",
);
check(
  "the main gate is outside the railway, where an entrance belongs",
  !insideLoop(GATE_X, GATE_Z) && trackDist(GATE_X, GATE_Z) > 60,
  `${trackDist(GATE_X, GATE_Z).toFixed(0)}u clear of the rails`,
);
check(
  "the main gate clears every ride",
  nearestRide(GATE_X, GATE_Z) > 100,
  `${nearestRide(GATE_X, GATE_Z).toFixed(0)}u to the nearest ride`,
);

// The food court must not stand in front of a ride from the main viewpoint.
const angles = viewAngles(MAIN_VIEWPOINT, PARK_CENTER);
const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
const ul = Math.hypot(ux, uz);
const dxFc = FOOD_COURT_CENTER[0] - MAIN_VIEWPOINT[0];
const dzFc = FOOD_COURT_CENTER[1] - MAIN_VIEWPOINT[1];
const fcDist = Math.hypot(dxFc, dzFc);
const fcBearing =
  (Math.atan2(((ux / ul) * dzFc - (uz / ul) * dxFc), dxFc * (ux / ul) + dzFc * (uz / ul)) * 180) /
  Math.PI;
const fcHalf = (Math.atan(FOOD_COURT_HALF / fcDist) * 180) / Math.PI;
const clashes = angles.filter(
  (a) =>
    fcBearing + fcHalf > a.bearingDeg - a.halfWidthDeg &&
    fcBearing - fcHalf < a.bearingDeg + a.halfWidthDeg,
);
check(
  "the food court hides no ride from the main gate",
  clashes.length === 0,
  `food court at ${fcBearing.toFixed(1)}deg +/-${fcHalf.toFixed(1)}; nearest ride ${angles
    .map((a) => `${a.label} ${a.bearingDeg.toFixed(0)}deg`)
    .join(", ")}`,
);

// ============ 11. No walking route cuts through a ride ============
let throughRide = 0;
let sample = "";
for (const e of JOURNEY_EMPLOYEES) {
  for (let t = e.checkInTime; t <= e.rideArrival; t += 0.05) {
    const s = sampleJourney(e, t);
    if (!s) continue;
    for (const r of PARK_LAYOUT) {
      if (r.id === e.rideId) continue;
      if (s.x > r.minX && s.x < r.maxX && s.z > r.minZ && s.z < r.maxZ) {
        throughRide++;
        sample = `${e.id} inside ${r.label}`;
      }
    }
  }
}
check(
  "no employee walks through a ride they are not assigned to",
  throughRide === 0,
  sample || "every route stays on open ground",
);

// ============ 12. The loop shows the whole story ============
check(
  "the loop starts before the first arrival",
  LOOP_START <= Math.min(...JOURNEY_EMPLOYEES.map((e) => e.spawnTime)),
  `loop opens at ${LOOP_START.toFixed(1)}, first arrival ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.spawnTime)).toFixed(1)}`,
);
check(
  "the loop runs past the last work start",
  LOOP_END >= Math.max(...JOURNEY_EMPLOYEES.map((e) => e.workStart)),
  `loop ends at ${LOOP_END.toFixed(1)}, last work start ${Math.max(...JOURNEY_EMPLOYEES.map((e) => e.workStart)).toFixed(1)}`,
);

// ============ 13. Clickable, with a panel that matches the data ============
check(
  "every employee figure is clickable",
  /onClick=\{\(e\) => \{[\s\S]*?select\(employee\.id\)/.test(employeesSrc),
  "the figure's group selects that employee",
);
check(
  "hovering an employee gives feedback",
  /onPointerOver/.test(employeesSrc) && /setHovered/.test(employeesSrc),
  "hover ring plus a pointer cursor",
);
check(
  "only one employee panel can be open at a time",
  /selectedId: string \| null/.test(read("src", "store", "journeyStore.ts")),
  "a single selection slot, so a second panel has nowhere to live",
);
for (const field of [
  "employee.id",
  "employee.name",
  "employee.department",
  "employee.checkInTime",
  "employee.color",
  "employee.visitsFoodCourt",
  "employee.foodCourtEntry",
  "employee.foodCourtExit",
  "employee.rideName",
  "employee.rideArrival",
  "employee.workStart",
  "employee.delayMinutes",
]) {
  check(`the panel shows ${field.replace("employee.", "")}`, panelSrc.includes(field), "present");
}
check(
  "the panel is real HTML, not a 3D object",
  !/@react-three|drei|<mesh|<group/.test(panelSrc),
  "no three.js import anywhere in the panel",
);
check(
  "the panel closes with X, Escape, or a click on empty park",
  /onClick=\{onClose\}/.test(panelSrc) &&
    /e\.key === "Escape"/.test(panelSrc) &&
    /clearEmployeeSelection\(\)/.test(scene),
  "three ways out",
);

// ============ 14. Colour travels with the employee ============
check(
  "the category is worn as clothing — a workwear shade, never the raw signal hex",
  /SHIRT_BY_BAND/.test(employeesSrc) &&
    !Object.values(CHECK_IN_COLOR_HEX).some((hex) =>
      new RegExp(`SHIRT_BY_BAND[\\s\\S]{0,400}${hex}`, "i").test(employeesSrc),
    ),
  "shirts come from muted per-band palettes (brief: green/yellow/red shirts, not glowing bodies)",
);
check(
  "skin, hair and trousers stay human — only the top carries the band",
  /SKIN_COLORS/.test(employeesSrc) && /HAIR_COLORS/.test(employeesSrc) && /TROUSERS/.test(employeesSrc),
  "the person is a person; the colour is their clothing",
);
check(
  "the category is carried redundantly, so it survives distance and shade",
  /STATUS_FLAT\[employee\.color\]/.test(employeesSrc) &&
    /STATUS_MARKER\[employee\.color\]/.test(employeesSrc),
  "shoulder band, ground disc and floating marker all carry it",
);
check(
  "the colour is unlit, so shadow cannot change what the data reads as",
  /MeshBasicMaterial[\s\S]*?toneMapped: false/.test(employeesSrc),
  "the disc is not shaded",
);
check(
  "the three colours are the park's existing green/yellow/red",
  CHECK_IN_COLOR_HEX.GREEN === "#22C55E" &&
    CHECK_IN_COLOR_HEX.YELLOW === "#FACC15" &&
    CHECK_IN_COLOR_HEX.RED === "#EF4444",
  "same hexes the ride seats already use",
);

// ============ 15. The fountain owns the centre; every route walks around it ============
check(
  "the fountain stands at the plaza centre — THE CENTRE OF THE PARK HOLDS NO RIDE",
  FOUNTAIN_CENTER[0] === PLAZA_CENTER[0] &&
    FOUNTAIN_CENTER[1] === PLAZA_CENTER[1] &&
    FOUNTAIN_RADIUS < PLAZA_RADIUS,
  `fountain r=${FOUNTAIN_RADIUS} inside the ${PLAZA_RADIUS}u plaza at (${FOUNTAIN_CENTER})`,
);
check(
  "no ride footprint reaches the fountain",
  PARK_LAYOUT.every((r) => boxDist(FOUNTAIN_CENTER[0], FOUNTAIN_CENTER[1], r) > FOUNTAIN_RADIUS + 10),
  `nearest ride ${PARK_LAYOUT.map((r) => boxDist(FOUNTAIN_CENTER[0], FOUNTAIN_CENTER[1], r).toFixed(0)).sort((a, b) => Number(a) - Number(b))[0]}u away`,
);
check(
  "the train's rails clear the fountain",
  trackDist(...FOUNTAIN_CENTER) > FOUNTAIN_RADIUS + 10,
  `${trackDist(...FOUNTAIN_CENTER).toFixed(0)}u to the rails`,
);
{
  let intrusions = 0;
  let closest = Infinity;
  let who = "";
  for (const e of JOURNEY_EMPLOYEES) {
    for (let t = e.checkInTime; t <= e.workStart + 1; t += 0.05) {
      const smp = sampleJourney(e, t);
      if (!smp) continue;
      const d = Math.hypot(smp.x - FOUNTAIN_CENTER[0], smp.z - FOUNTAIN_CENTER[1]);
      if (d < closest) {
        closest = d;
        who = e.id;
      }
      if (d < FOUNTAIN_CLEARANCE) intrusions++;
    }
  }
  check(
    "no employee ever steps inside the fountain's clearance — they walk AROUND the water",
    intrusions === 0,
    `closest pass ${closest.toFixed(1)}u (${who}) vs clearance ${FOUNTAIN_CLEARANCE}u`,
  );
}
check(
  "the detour geometry itself is exercised — a straight centre-line leg gets bent",
  fountainDetour([70, 570], [70, -100]).length >= 3,
  `${fountainDetour([70, 570], [70, -100]).length} arc points inserted on a leg through the centre`,
);
check(
  "clear legs are left perfectly straight",
  fountainDetour([300, 570], [300, -100]).length === 0,
  "no detour where none is needed",
);

// ============ 16. The gate queue: real spacing, real waiting ============
/*
 * §18 of the brief: employees arriving close together queue with human
 * spacing. Sweep the whole morning and demand that no two people in the gate
 * area ever share a spot.
 */
{
  let tooClose = 0;
  let closestPair = Infinity;
  let pair = "";
  for (let t = CHECK_IN_OPEN - 6; t <= CHECK_IN_CLOSE + 4; t += 0.05) {
    const here: { id: string; x: number; z: number }[] = [];
    for (const e of JOURNEY_EMPLOYEES) {
      const smp = sampleJourney(e, t);
      if (!smp) continue;
      if (smp.z > GATE_Z - 2 && smp.z < GATE_Z + 60) here.push({ id: e.id, x: smp.x, z: smp.z });
    }
    for (let i = 0; i < here.length; i++) {
      for (let j = i + 1; j < here.length; j++) {
        const d = Math.hypot(here[i].x - here[j].x, here[i].z - here[j].z);
        if (d < closestPair) {
          closestPair = d;
          pair = `${here[i].id}/${here[j].id} at ${t.toFixed(1)}`;
        }
        if (d < 0.5) tooClose++;
      }
    }
  }
  check(
    "no two employees ever share a spot in the gate queue",
    tooClose === 0,
    `closest pair ${closestPair.toFixed(2)}u (${pair})`,
  );
}
check(
  "everyone visibly waits before their turn at the gate",
  JOURNEY_EMPLOYEES.every((e) =>
    e.route.some((w) => w.phase === "QUEUED" && w.depart - w.arrive > 0.1),
  ),
  "each route carries a queue dwell outside the gate line",
);

// ============ 17. The dataset's own times drive the states ============
check(
  "the food-court stay is the configured 2–5 minutes",
  visitors.every((e) => {
    const dwell = e.foodCourtExit! - e.foodCourtEntry!;
    return dwell >= FOOD_COURT_DWELL_MIN - 1e-6 && dwell <= FOOD_COURT_DWELL_MAX + 1e-6;
  }),
  `stays ${Math.min(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)}–${Math.max(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)} min`,
);
check(
  "everyone reaches their ride BEFORE their given work-start — pace flexed, data did not",
  JOURNEY_EMPLOYEES.every((e) => e.rideArrival <= e.workStart),
  `tightest margin ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.workStart - e.rideArrival)).toFixed(2)} min`,
);
check(
  "WORK STARTED begins at exactly the dataset's actual-work-start minute",
  JOURNEY_EMPLOYEES.every(
    (e) =>
      sampleJourney(e, e.workStart + 1e-6)!.phase === "WORKING" &&
      sampleJourney(e, e.workStart - 1e-3)!.phase !== "WORKING",
  ),
  "the WORKING transition is the row's own time, to the minute",
);
check(
  "check-in happens at the gate at the row's exact minute, then a short scan dwell",
  JOURNEY_EMPLOYEES.every((e) => {
    const w = e.route.find((r) => r.phase === "CHECKING_IN")!;
    return w.arrive === e.checkInTime && Math.abs(w.depart - w.arrive - CHECK_IN_DWELL) < 1e-9;
  }),
  `dwell ${CHECK_IN_DWELL} min at the turnstile`,
);

// ============ 18. ADD-ONLY: the park is untouched ============
const EXPECTED_CENTRES: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [70, -10],
  monster: [205, 90],
  tower: [267.75, 280],
};
check(
  "every ride is still exactly where it was",
  PARK_LAYOUT.every((r) => {
    const e = EXPECTED_CENTRES[r.id];
    return e && Math.abs(r.center[0] - e[0]) < 1e-6 && Math.abs(r.center[1] - e[1]) < 1e-6;
  }),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
);
check(
  "no ride module knows the journey exists",
  ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride", "drop-tower"].every(
    (dir) => !existsSync(join(root, "src", "components", dir)) ||
      !readFileSync(join(root, "src", "components", dir, "constants.ts"), "utf8").includes("journey"),
  ),
  "rides cannot be gated or reordered by the employee layer",
);
check(
  "the journey renders outside every ride scale group",
  /<ParkJourney \/>/.test(scene) &&
    !/<group scale=\{(PARK_SCALE|TRAIN_SCALE)\}>\s*<ParkJourney/.test(scene),
  "employees, gate and food court are in world space",
);
check(
  "the department mapping was not rewritten",
  !/department:\s*"/.test(code(journeySrc)),
  "departments are read from the existing mapping, never re-declared",
);
check(
  "the gate and food court add no lights or camera of their own",
  // Element names only: the word "lighting" in a comment is not a light, and
  // the lamp posts are emissive materials rather than real light sources.
  !/<(ambient|directional|point|spot|hemisphere|rect)Light/i.test(code(gateSrc + courtSrc)) &&
    !/OrbitControls|PerspectiveCamera/.test(code(gateSrc + courtSrc)),
  "they inherit the park's existing sun, sky and controls",
);

// ============ Summary ============
const byDept = RIDE_DEPARTMENTS.map((d) => {
  const list = JOURNEY_EMPLOYEES.filter((e) => e.department === d.department);
  const avg = list.reduce((s, e) => s + e.delayMinutes, 0) / list.length;
  return `  ${d.department.padEnd(8)} ${d.rideName.padEnd(15)} ${String(list.length).padStart(2)} staff   avg delay ${avg.toFixed(1)} min`;
});
console.log("\nDepartment roster:");
console.log(byDept.join("\n"));
console.log(
  `\nCheck-in ${Math.min(...checkIns).toFixed(0)}–${Math.max(...checkIns).toFixed(0)} min-of-day; ` +
    `${visitors.length} of ${JOURNEY_EMPLOYEES.length} (${(share * 100).toFixed(0)}%) stop at the food court.`,
);
console.log(
  `Average delay ${(JOURNEY_EMPLOYEES.reduce((s, e) => s + e.delayMinutes, 0) / JOURNEY_EMPLOYEES.length).toFixed(1)} min; ` +
    `worst ${Math.max(...JOURNEY_EMPLOYEES.map((e) => e.delayMinutes)).toFixed(1)} min.`,
);
console.log(
  `Loop spans ${LOOP_MINUTES.toFixed(0)} simulated minutes. Gate at (${GATE_X}, ${GATE_Z}); ` +
    `food court at (${FOOD_COURT_CENTER[0]}, ${FOOD_COURT_CENTER[1]}), door (${FOOD_COURT_DOOR[0].toFixed(0)}, ${FOOD_COURT_DOOR[1].toFixed(0)}).`,
);
console.log(`Peak walking speed ${maxSpeed.toFixed(1)} u/min against a ${WALK_UNITS_PER_MINUTE} u/min pace.`);
console.log(`Employee lookup holds ${Object.keys(EMPLOYEE_BY_ID).length} records.`);

console.log(failures === 0 ? "\nOK: employee journey verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
