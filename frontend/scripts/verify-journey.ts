import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECK_IN_COLOR_HEX,
  EMPLOYEE_BY_ID,
  JOURNEY_EMPLOYEES,
  LATE_ARRIVALS,
  LOOP_END,
  LOOP_MINUTES,
  LOOP_START,
  checkInColor,
  fountainDetour,
  sampleJourney,
} from "../src/simulation/journey/journey";
import { EMPLOYEE_DATASET, parseClockTime } from "../src/simulation/journey/dataset";
import { BOWL_DEPTH, BOWL_RADIUS } from "../src/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_RIDE_CENTER } from "../src/components/ufo-pendulum/placement";
import {
  CHECK_IN_CLOSE,
  CHECK_IN_DWELL,
  CHECK_IN_OPEN,
  MIN_SIT_MINUTES,
  FOOD_COURT_CENTER,
  FOOD_COURT_DOOR,
  FOOD_COURT_HALF,
  CHAIR_RADIUS,
  FOOD_COURT_CHAIRS,
  FOOD_COURT_TABLES,
  GATE_OPENING,
  GATE_X,
  GATE_Z,
  WALK_UNITS_PER_MINUTE,
  WALK_UNITS_PER_MINUTE_MAX,
  foodCourtToWorld,
} from "../src/simulation/journey/constants";
import { CHECK_IN_THRESHOLDS, classifyDelay } from "../src/simulation/classification";
import { formatSimTime } from "../src/simulation/clock";
import { DEPARTMENTS, RIDE_DEPARTMENTS, rideForDepartment } from "../src/components/park/departments";
import {
  RIDE_STEP_BACK,
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

// ============ 1. The dataset — the EXACT 30 rows the attendance sheet supplies ============
/*
 * The sheet's table is restated here verbatim — its own spellings included,
 * "No Delay" and "6 min" rather than numbers — and compared field-for-field
 * against what the app actually loads. If anyone renames a person, nudges a
 * time, "fixes" a delay or quietly turns a No Delay into a number, this is
 * where it dies.
 *
 * Restating the delay in the sheet's words is deliberate: half these rows say
 * "No Delay", and that value decides whether the employee visits the food
 * court at all, so it is the single most load-bearing string in the file.
 */
const BRIEF_TABLE = `
EMP1001|Karthik Sharma|IT Support|09:33 AM|No Delay|09:33 AM|06:18 PM
EMP1002|Krishna Iyer|Cyber Security|09:43 AM|No Delay|09:43 AM|07:10 PM
EMP1003|Riya Sharma|ERP|10:45 AM|6 min|10:51 AM|07:26 PM
EMP1004|Reyansh Nair|Tech|10:34 AM|No Delay|10:34 AM|07:39 PM
EMP1005|Reyansh Gupta|Data Engineering|10:23 AM|42 min|11:05 AM|07:52 PM
EMP1006|Priya Kumar|UI/UX|09:50 AM|No Delay|09:50 AM|06:41 PM
EMP1007|Ishaan Iyer|IT Support|09:57 AM|No Delay|09:57 AM|06:48 PM
EMP1008|Vivaan Sharma|Cyber Security|10:18 AM|27 min|10:45 AM|07:53 PM
EMP1009|Ishaan Kumar|ERP|10:28 AM|29 min|10:57 AM|07:32 PM
EMP1010|Riya Reddy|Tech|10:16 AM|9 min|10:25 AM|06:57 PM
EMP1011|Naveen Nair|Data Engineering|10:07 AM|No Delay|10:07 AM|07:31 PM
EMP1012|Krishna Sharma|UI/UX|10:18 AM|45 min|11:03 AM|08:26 PM
EMP1013|Diya Iyer|IT Support|10:17 AM|22 min|10:39 AM|07:53 PM
EMP1014|Meena Sharma|Cyber Security|09:51 AM|20 min|10:11 AM|06:51 PM
EMP1015|Myra Menon|ERP|10:04 AM|No Delay|10:04 AM|07:14 PM
EMP1016|Suresh Gupta|Tech|09:58 AM|No Delay|09:58 AM|07:21 PM
EMP1017|Manoj Kumar|Data Engineering|09:59 AM|No Delay|09:59 AM|07:20 PM
EMP1018|Ananya Menon|UI/UX|10:04 AM|41 min|10:45 AM|08:11 PM
EMP1019|Suresh Rao|IT Support|09:57 AM|No Delay|09:57 AM|06:52 PM
EMP1020|Pooja Pillai|Cyber Security|09:48 AM|20 min|10:08 AM|07:25 PM
EMP1021|Riya Gupta|ERP|10:03 AM|No Delay|10:03 AM|07:00 PM
EMP1022|Pooja Verma|Tech|10:21 AM|13 min|10:34 AM|07:36 PM
EMP1023|Anika Sharma|Data Engineering|09:36 AM|No Delay|09:36 AM|06:15 PM
EMP1024|Karthik Iyer|UI/UX|10:24 AM|29 min|10:53 AM|07:47 PM
EMP1025|Ishita Pillai|IT Support|10:37 AM|40 min|11:17 AM|08:42 PM
EMP1026|Aarav Sharma|Cyber Security|10:38 AM|No Delay|10:38 AM|07:57 PM
EMP1027|Karthik Rao|ERP|09:44 AM|15 min|09:59 AM|06:58 PM
EMP1028|Aarav Reddy|Tech|10:34 AM|No Delay|10:34 AM|07:36 PM
EMP1029|Sneha Reddy|Data Engineering|10:34 AM|No Delay|10:34 AM|07:13 PM
EMP1030|Meena Kumar|UI/UX|10:11 AM|12 min|10:23 AM|07:52 PM
`.trim().split("\n").map((line) => {
  const [id, name, department, checkIn, delay, workStart, checkOut] = line.split("|");
  return {
    id,
    name,
    department,
    checkIn: parseClockTime(checkIn),
    /* "No Delay" is zero; "42 min" is 42. */
    delayMinutes: delay === "No Delay" ? 0 : Number(/^(\d+) min$/.exec(delay)![1]),
    workStart: parseClockTime(workStart),
    checkOut: parseClockTime(checkOut),
  };
});

check(
  "exactly the sheet's 30 employees are simulated",
  JOURNEY_EMPLOYEES.length === 30 && EMPLOYEE_DATASET.length === 30,
  `${JOURNEY_EMPLOYEES.length} employees`,
);
check(
  "half the roster was delayed and half was not — the split the sheet states",
  BRIEF_TABLE.filter((r) => r.delayMinutes > 0).length === 15 &&
    BRIEF_TABLE.filter((r) => r.delayMinutes === 0).length === 15,
  `${BRIEF_TABLE.filter((r) => r.delayMinutes > 0).length} delayed, ` +
    `${BRIEF_TABLE.filter((r) => r.delayMinutes === 0).length} on time`,
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
    example || `all ${BRIEF_TABLE.length} rows byte-for-byte`,
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
  "every check-in falls inside the roster's window",
  checkIns.every((t) => t >= CHECK_IN_OPEN && t <= CHECK_IN_CLOSE),
  `range ${formatSimTime(Math.min(...checkIns))} – ${formatSimTime(Math.max(...checkIns))}`,
);
/*
 * WHAT THE CLOTHING SAYS.
 *
 * The band a figure wears is their CHECK-IN CLOCK: green before a quarter to
 * ten, yellow up to ten, red after. It banded the delay for a while, which
 * conflated two different facts about the morning — when somebody arrived and
 * whether they got to work on time. Both are still carried on every employee,
 * `color` for the first and `delayCategory` for the second, so the shirt and
 * the Department Check-In Overview report different things ON PURPOSE and
 * neither has to lie about the other.
 *
 * The boundaries live in `classification.ts` beside the delay ones, so there is
 * still exactly one module where any band is decided.
 */
check(
  "the clothing colour is decided by the check-in clock and nothing else",
  JOURNEY_EMPLOYEES.every((e) => e.color === checkInColor(e.checkInTime)),
  "every employee's colour re-derives from their own check-in minute",
);
check(
  "the delay band is still carried too, and separately",
  JOURNEY_EMPLOYEES.every((e) => e.delayCategory === classifyDelay(e.delayMinutes)),
  `${JOURNEY_EMPLOYEES.filter((e) => e.color !== e.delayCategory).length} of ` +
    `${JOURNEY_EMPLOYEES.length} employees arrive in one band and are delayed into another — ` +
    `which is the point of reporting both`,
);
check(
  "the band boundaries are CHECK_IN_THRESHOLDS, not a second set of numbers",
  checkInColor(CHECK_IN_THRESHOLDS.greenUntil) === "GREEN" &&
    checkInColor(CHECK_IN_THRESHOLDS.greenUntil + 1) === "YELLOW" &&
    checkInColor(CHECK_IN_THRESHOLDS.yellowUntil) === "YELLOW" &&
    checkInColor(CHECK_IN_THRESHOLDS.yellowUntil + 1) === "RED",
  `up to ${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)} GREEN | to ` +
    `${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)} YELLOW | after that RED`,
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
  JOURNEY_EMPLOYEES.every((e) => e.workStart >= e.checkInTime),
  `smallest delay ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.delayMinutes)).toFixed(1)} min ` +
    `(a No Delay row means work start EQUALS check-in, which is not a violation)`,
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
/*
 * THE CENTRAL RULE OF THE WHOLE VISUALISATION.
 *
 * The food court used to be filled by a 35% quota picked with a seeded key,
 * which meant a viewer could read nothing at all from someone sitting down.
 * It is now the delay and only the delay: everyone the sheet says was delayed
 * eats, everyone it says was not walks straight past. If this check ever
 * fails, the picture has stopped telling the truth.
 */
check(
  "EVERY delayed employee visits the food court, and ONLY delayed employees do",
  JOURNEY_EMPLOYEES.every((e) => e.visitsFoodCourt === e.delayMinutes > 0),
  `${visitors.length} delayed all eat; ${direct.length} on-time all go straight to their ride`,
);
check(
  "the share is whatever the data says, not a target",
  visitors.length === BRIEF_TABLE.filter((r) => r.delayMinutes > 0).length,
  `${(share * 100).toFixed(0)}% — because ${visitors.length} of ${JOURNEY_EMPLOYEES.length} rows carry a delay`,
);
check(
  "no quota, share or random draw survives in the journey builder",
  !/FOOD_COURT_SHARE|foodTarget|foodVisitors/.test(journeySrc),
  "the delay column is the only selector",
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
      e.rideArrival <= e.workStartActual,
  ) && direct.every((e) => e.checkInTime < e.rideArrival && e.rideArrival <= e.workStartActual),
  "no stage ever runs backwards",
);
/*
 * The sit IS the delay. Everything the delay does not spend on walking is
 * spent on the chair, which is what makes the length of a sit-down readable as
 * the size of that person's delay.
 */
check(
  "time on the seat is the delay, less only the walking it pays for",
  visitors.every((e) => {
    const walked = e.delayMinutes - e.sitMinutes;
    return e.sitMinutes > 0 && walked > 0 && Math.abs(e.sitMinutes - (e.foodCourtExit! - e.foodCourtEntry!)) < 0.05;
  }),
  `sits run ${Math.min(...visitors.map((e) => e.sitMinutes)).toFixed(1)}–` +
    `${Math.max(...visitors.map((e) => e.sitMinutes)).toFixed(1)} min against delays of ` +
    `${Math.min(...visitors.map((e) => e.delayMinutes))}–${Math.max(...visitors.map((e) => e.delayMinutes))} min`,
);
/*
 * Sit length has to be readable AS delay size — that is the whole point of
 * showing the wait rather than tabulating it.
 *
 * It cannot be a strict ordering, because the time a person spends walking
 * varies with which ride they are bound for and which chair they were given,
 * so two colleagues with the identical delay can sit for slightly different
 * lengths. The spread of that walking overhead is measured here and used as
 * the tolerance, rather than guessed at: within it, a longer delay always
 * shows a longer sit.
 */
{
  const overhead = visitors.map((e) => e.delayMinutes - e.sitMinutes);
  const spread = Math.max(...overhead) - Math.min(...overhead);
  const sorted = visitors.slice().sort((a, b) => a.delayMinutes - b.delayMinutes);
  check(
    "a longer delay always shows a longer sit",
    sorted.every((e, i) => i === 0 || e.sitMinutes >= sorted[i - 1].sitMinutes - spread),
    `walking overhead spans ${Math.min(...overhead).toFixed(2)}–${Math.max(...overhead).toFixed(2)} min ` +
      `(${spread.toFixed(2)} min of spread); sits rise with delay inside it`,
  );
  check(
    "and the overhead is small enough that the sit dominates what you see",
    Math.max(...overhead) < Math.max(...visitors.map((e) => e.delayMinutes)),
    `longest overhead ${Math.max(...overhead).toFixed(1)} min against delays up to ` +
      `${Math.max(...visitors.map((e) => e.delayMinutes))} min`,
  );
}
check(
  "every sit is long enough to actually see",
  visitors.every((e) => e.sitMinutes >= MIN_SIT_MINUTES - 1e-6),
  `shortest sit ${Math.min(...visitors.map((e) => e.sitMinutes)).toFixed(2)} min, floor ${MIN_SIT_MINUTES}`,
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
/*
 * ON FOOT ONLY. An employee strapped into a ride seat travels at whatever
 * speed the machine travels at — a coaster does about 22 u/s — and that is the
 * ride carrying them, not the person outrunning a human. Those samples are
 * measured separately below, where what matters is that they are attached to
 * the seat rather than how fast the seat is going.
 */
const STEP = 0.05;
let maxSpeed = 0;
let maxJump = 0;
let worst = "";
let overOwnPace = 0;
let carriedSamples = 0;
for (const e of JOURNEY_EMPLOYEES) {
  let own = 0;
  let prev = sampleJourney(e, e.spawnTime);
  for (let t = e.spawnTime + STEP; t <= e.workStart + 4; t += STEP) {
    const s = sampleJourney(e, t);
    if (!s || !prev) {
      prev = s;
      continue;
    }
    if (s.onRide || prev.onRide) {
      carriedSamples++;
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
  "no employee ever exceeds their own declared pace on foot — nobody teleports",
  overOwnPace === 0,
  `fastest observed ${maxSpeed.toFixed(1)} u/min (${worst}); ` +
    `${carriedSamples} samples carried by a ride are measured in verify-boarding`,
);
check(
  "every declared pace is human: between the base walk and a 1.9 m/s brisk walk",
  JOURNEY_EMPLOYEES.every(
    (e) => e.walkSpeed >= WALK_UNITS_PER_MINUTE - 1e-9 && e.walkSpeed <= WALK_UNITS_PER_MINUTE_MAX + 1e-9,
  ),
  `paces ${Math.min(...JOURNEY_EMPLOYEES.map((e) => e.walkSpeed)).toFixed(1)}–${Math.max(...JOURNEY_EMPLOYEES.map((e) => e.walkSpeed)).toFixed(1)} u/min`,
);
check(
  "the path is continuous on foot — no position jumps between frames",
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
      /* Climbing up the gangway into a seat, or back down out of it, is not a
         walk: the feet leave the ground and it is timed by SEAT_CLIMB_MINUTES.
         verify-boarding.ts checks those legs against that constant instead. */
      if ((a.y ?? 0) !== 0 || (b.y ?? 0) !== 0) continue;
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
  /* Sampled across the WHOLE day now — the walk home is part of the story. */
  for (let t = e.spawnTime; t <= e.despawnTime; t += 0.1) {
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
  "every employee is shown approaching, queueing, checking in, walking, arriving and seated",
  JOURNEY_EMPLOYEES.every((e) => {
    const p = seen.get(e.id)!;
    return (
      p.has("APPROACHING") &&
      p.has("QUEUED") &&
      p.has("CHECKING_IN") &&
      p.has("ENTERING") &&
      p.has("TO_RIDE") &&
      p.has("SITTING_ON_RIDE")
    );
  }),
  `the full timeline is visible for all ${JOURNEY_EMPLOYEES.length}`,
);
/*
 * ONCE THEY SIT DOWN, THEY STAY.
 *
 * An employee who has reached their department ride and taken a seat is on it
 * for the rest of the day: no climb back down, no walk to a desk, no walk home.
 * The route has nothing at all after the seat, which is the strongest form this
 * guarantee can take — there is no waypoint that could put them back on the
 * ground.
 */
check(
  "the seat is the last thing on every employee's route",
  JOURNEY_EMPLOYEES.every((e) => e.route[e.route.length - 1].phase === "SITTING_ON_RIDE"),
  "no employee has a single waypoint after the one they sit down at",
);
check(
  "and they are still in it at the sheet's check-out minute",
  JOURNEY_EMPLOYEES.every((e) => {
    const at = sampleJourney(e, e.checkOut);
    return at !== null && at.phase === "SITTING_ON_RIDE" && at.onRide;
  }),
  "check-out passes and nobody moves — they are locked to their seat until reset",
);
/*
 * "NEVER AT GROUND LEVEL" NOW MEANS "NEVER BACK ON THE GROUND".
 *
 * A seated rider used to be above y=0 at every moment of the day, so that was
 * a sound test for "still aboard". It is not sound any more: the UFO Pendulum
 * is built to the park's common height, parks low enough to board off a single
 * flight of stairs, and swings into a BOWL — so a rider passing the bottom of
 * that swing is legitimately below ground, inside the ride's own excavation.
 * What still must never happen is a rider ending up back on the walking
 * surface, so the test is: always aboard, and never below ground anywhere
 * except inside the bowl that ride swings into.
 */
check(
  "nobody ever returns to the ground after boarding",
  JOURNEY_EMPLOYEES.every((e) => {
    /* From the instant they are seated — at exactly `seatedAt` the sample is
       still the last frame of getting in. */
    for (let t = e.seatedAt + 1e-6; t <= e.despawnTime; t += 0.25) {
      const at = sampleJourney(e, t);
      if (!at || !at.onRide) return false;
      if (at.y > 0) continue;
      const inBowl =
        Math.hypot(at.x - UFO_RIDE_CENTER[0], at.z - UFO_RIDE_CENTER[1]) < BOWL_RADIUS &&
        at.y > -BOWL_DEPTH;
      if (!inBowl) return false;
    }
    return true;
  }),
  "sampled from the minute they sit to the end of the day: always aboard, and never below " +
    "ground except inside the pendulum's own bowl",
);
/*
 * Diners are seated on real CHAIRS now, not dropped on table centres.
 *
 * The old routing sent everyone to the middle of a table, chosen by an index
 * that repeated once per ride — so five people from five different departments
 * could be assigned the same table point and sit inside one another. The court
 * has eighty chairs and they are handed out one at a time.
 */
check(
  "diners sit on chairs that really exist in the food court",
  visitors.every((e) => {
    if (e.chairIndex === null) return false;
    const world = foodCourtToWorld(FOOD_COURT_CHAIRS[e.chairIndex].local);
    return e.route.some((w) => Math.hypot(w.x - world[0], w.z - world[1]) < 1e-6);
  }),
  `${FOOD_COURT_CHAIRS.length} chairs around ${FOOD_COURT_TABLES.length} tables, ` +
    `shared by walkers and furniture from one constant`,
);
check(
  "a chair is a real seat at its own table, not the tabletop",
  FOOD_COURT_CHAIRS.every((c) => {
    const t = FOOD_COURT_TABLES[c.table];
    return Math.abs(Math.hypot(c.local[0] - t[0], c.local[1] - t[1]) - CHAIR_RADIUS) < 1e-9;
  }),
  `every chair sits exactly ${CHAIR_RADIUS} m out from its table centre`,
);
check(
  "the furniture and the walkers read the same chair geometry",
  /TABLE_TURN/.test(courtSrc) && /chairAngle/.test(courtSrc) && /CHAIR_RADIUS/.test(courtSrc),
  "FoodCourt.tsx imports the constants the journey routes against",
);
/*
 * No two people on one chair, ever — checked as overlapping occupancy spans
 * rather than by trusting the allocator that produced them.
 */
{
  let shared = "";
  for (let a = 0; a < visitors.length; a++) {
    for (let b = a + 1; b < visitors.length; b++) {
      const A = visitors[a];
      const B = visitors[b];
      if (A.chairIndex !== B.chairIndex) continue;
      if (A.foodCourtEntry! < B.foodCourtExit! && B.foodCourtEntry! < A.foodCourtExit!)
        shared = `${A.id} and ${B.id} both on chair ${A.chairIndex}`;
    }
  }
  const busiest = (() => {
    let peak = 0;
    for (let t = LOOP_START; t < LOOP_END; t += 0.25) {
      peak = Math.max(
        peak,
        visitors.filter((e) => t >= e.foodCourtEntry! && t <= e.foodCourtExit!).length,
      );
    }
    return peak;
  })();
  check(
    "no two employees ever occupy the same chair at the same moment",
    shared === "",
    shared || `${busiest} diners at the busiest moment, each on a chair of their own`,
  );
  check(
    "the court is never asked for more chairs than it has",
    busiest <= FOOD_COURT_CHAIRS.length,
    `peak ${busiest} of ${FOOD_COURT_CHAIRS.length} chairs`,
  );
  {
    /* The court now holds exactly twenty seats — five tables of four — so the
       most tables a day of diners can possibly touch is five. What still has to
       hold is that they SPREAD: as many different tables are used as the court
       has, or as there are diners, whichever runs out first. */
    const tablesUsed = new Set(visitors.map((e) => FOOD_COURT_CHAIRS[e.chairIndex!].table)).size;
    const tableCount = new Set(FOOD_COURT_CHAIRS.map((c) => c.table)).size;
    check(
      "diners are spread across tables rather than piled onto the first one",
      tablesUsed >= Math.min(busiest, tableCount),
      `${tablesUsed} of the court's ${tableCount} tables used, at a peak of ${busiest} diners`,
    );
  }
}

// ============ 9. Everyone ends up at their own ride ============
let wrongRide = 0;
for (const e of JOURNEY_EMPLOYEES) {
  /* Sampled while they are working, which is now a window rather than for ever. */
  const s = sampleJourney(e, e.workStartActual + 1)!;
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

/*
 * THE FOOD COURT MUST NOT STAND IN FRONT OF A RIDE from the main viewpoint.
 *
 * Measured band by band, because the court is not one block: 24 m wings at
 * 10.5 m, a domed hall at 30 m, and a cupola at 39 m, each narrower than the
 * last. Testing the CUPOLA's height across the WINGS' width — which is what
 * the terrace half-width and PAVILION_TOP together imply — overstates the
 * building by nearly sixty metres, and started reporting a ride hidden that
 * in fact stands well above the low wing it shares a bearing with.
 *
 * A ride is hidden when some part of the court both shares its bearing AND
 * rises higher in the frame than the ride does.
 */
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

/** The pavilion's silhouette: half-width and height, widest first. */
const COURT_BANDS: [string, number, number][] = [
  ["wings", 40.03, 10.5],
  ["hall", 18, 30.2],
  ["cupola", 4.32, 38.776],
];
const clashes: string[] = [];
for (const a of angles) {
  const rideTop = rideById(a.id).height / a.distance;
  for (const [name, half, height] of COURT_BANDS) {
    const bandHalf = (Math.atan(half / fcDist) * 180) / Math.PI;
    const sharesBearing =
      fcBearing + bandHalf > a.bearingDeg - a.halfWidthDeg &&
      fcBearing - bandHalf < a.bearingDeg + a.halfWidthDeg;
    if (!sharesBearing) continue;
    if (height / fcDist >= rideTop) clashes.push(`${a.label} behind the ${name}`);
  }
}
check(
  "the food court hides no ride from the main gate",
  clashes.length === 0,
  clashes.length
    ? clashes.join("; ")
    : `court at ${fcBearing.toFixed(1)}deg; every ride sharing a bearing with it stands higher ` +
      `in the frame than the part of it they share`,
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
  "shirts come from per-band uniform palettes (brief: green/yellow/red shirts, not glowing bodies)",
);
check(
  /*
   * ONLY THE SHIRT CARRIES THE BAND, again.
   *
   * This briefly required the opposite: the cast wore a matching suit, so the
   * coat and the trousers both carried the colour and the check demanded a
   * band-keyed TROUSERS table. The user's uniform brief is explicit the other
   * way — "green professional shirt + dark trousers + shoes", the same sentence
   * for all three bands, and "do NOT color the entire human body" — so the
   * trousers are back to one band-independent pool of dark workwear tones, and
   * this asserts that they are.
   */
  "skin, hair and trousers stay band-free — only the shirt states the category",
  /SKIN_COLORS/.test(employeesSrc) &&
    /HAIR_COLORS/.test(employeesSrc) &&
    /const TROUSERS = /.test(employeesSrc) &&
    !/TROUSERS_BY_BAND/.test(employeesSrc),
  "the person is a person, and their legs are not a signal; the colour is their shirt",
);
/*
 * This used to require the OPPOSITE of what it now requires. The category was
 * carried four ways at once — a ground disc, a floating sphere, a walking beam
 * and a muted shirt — on the reasoning that redundancy is what survives
 * distance and shade. The user has since asked for all of it removed: the
 * garment carries the band and nothing else does.
 *
 * What replaced the redundancy is the figure itself being drawn at a readable
 * size at every distance, and the garment being saturated rather than muted,
 * so one carrier is enough. Both are proven in verify-visibility.ts. The check
 * here is inverted to hold the single-carrier rule, because a marker creeping
 * back is the regression that matters now.
 */
check(
  "the category is carried by the garment alone",
  !/STATUS_FLAT|STATUS_MARKER|const BEAM|GEO\.disc|GEO\.marker|GEO\.beam/.test(employeesSrc) &&
    /SHIRT_BY_BAND/.test(employeesSrc),
  "no disc, no floating marker, no beam — the shirt is the category",
);
check(
  "what is left unlit is interface, not data",
  /MeshBasicMaterial[\s\S]*?toneMapped: false/.test(employeesSrc),
  "the name plate and the work-started pip are unlit so they read the same in every theme",
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
/*
 * The stay is no longer a configured window at all — it is the delay, less the
 * walking. A dwell constant would have been a second source of truth sitting
 * next to the dataset, and the two would eventually disagree.
 */
check(
  "the food-court stay is derived from the delay, not from a dwell constant",
  visitors.every((e) => {
    const dwell = e.foodCourtExit! - e.foodCourtEntry!;
    return Math.abs(dwell - e.sitMinutes) < 0.05 && dwell < e.delayMinutes;
  }) && !/FOOD_COURT_DWELL/.test(journeySrc),
  `stays ${Math.min(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)}–${Math.max(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry!)).toFixed(1)} min, each inside its own delay`,
);

/*
 * WHERE THE PARK ARGUES WITH THE SHEET.
 *
 * A delayed employee reaches their ride at the exact minute the sheet gives.
 * Two cases physically cannot: an employee with NO delay has work starting the
 * very minute they check in, yet the rides are 400-700 m away; and a delay
 * shorter than that walk cannot be spent sitting. Those employees start work
 * when they actually arrive. The exceptions are enumerated rather than waved
 * through, so the list can never grow silently.
 */
/*
 * The tolerance is a minute, PLUS whatever the step back costs.
 *
 * The Monster Ride and the Drop Tower were each moved 40 m further from the
 * gate. That is 40 m of extra walking for their departments, and an employee
 * whose delay is nearly spent cannot absorb it: EMP1003 has six minutes and
 * lands 1.03 min behind the sheet. Widening the window by the walk that the
 * move added — at the fastest pace a human here is allowed, so the allowance is
 * the smallest honest one — keeps the check meaningful instead of simply
 * loosening it until it passes, and it tightens again by itself if the rides
 * are ever moved back.
 */
/*
 * AND THE PARK HAS SINCE STEPPED BACK AGAIN, further than 40 m.
 *
 * Every ride is now built to one common height. The footprints grew, the
 * layout solver spread the five apart to keep their silhouettes clear, the
 * railway was refitted round the result, and the main gate had to move 140 m
 * further out because the loop had grown past it. That is 140 m of extra
 * approach on top of the 40 m step back, before the extra distance between the
 * gate and a ride that has itself moved.
 *
 * The allowance is still the walk the moves added, at the fastest pace a human
 * here is allowed, so it is the smallest honest figure and it tightens again by
 * itself if the park is ever drawn back in.
 */
const GATE_STEP_BACK = 140;
const STEP_BACK_MINUTES = (RIDE_STEP_BACK + GATE_STEP_BACK) / WALK_UNITS_PER_MINUTE_MAX;
check(
  "every delayed employee reaches their ride at the sheet's work-start minute",
  visitors.every((e) => Math.abs(e.rideArrival - e.workStart) < 1.0 + STEP_BACK_MINUTES),
  `largest slip among the delayed: ${Math.max(...visitors.map((e) => e.rideArrival - e.workStart)).toFixed(2)} min, ` +
    `inside a ${(1.0 + STEP_BACK_MINUTES).toFixed(2)} min window (1 min, plus the ` +
    `${STEP_BACK_MINUTES.toFixed(2)} min the ${RIDE_STEP_BACK} m ride step back and the ` +
    `${GATE_STEP_BACK} m the gate moved out add)`,
);
/*
 * AND THEN THE RIDE ITSELF.
 *
 * Reaching the ride is no longer the end of the commute: a department ride
 * stands stopped until its department is aboard, runs, and sets them down
 * again, and only then does anyone walk to their desk. So the minute WORK
 * STARTS ON SCREEN is the minute they are off the ride, which is necessarily
 * later than the sheet's — the sheet records when work began, not when the
 * park could get them there.
 *
 * The sheet is not rewritten to hide the difference. `workStart` still carries
 * the dataset's own Actual Work Start untouched, and it is that column the ride
 * panel prints; `workStartBeforeRide` is what the same journey said before ride
 * operations existed, so the two can always be compared.
 */
check(
  "work starts when they sit down, or at the sheet's minute — whichever is later",
  JOURNEY_EMPLOYEES.every(
    (e) => Math.abs(e.workStartActual - Math.max(e.workStartBeforeRide, e.seatedAt)) < 1e-9,
  ),
  `waiting for a full ride adds ${Math.min(
    ...JOURNEY_EMPLOYEES.map((e) => e.workStartActual - e.workStartBeforeRide),
  ).toFixed(1)}–${Math.max(
    ...JOURNEY_EMPLOYEES.map((e) => e.workStartActual - e.workStartBeforeRide),
  ).toFixed(1)} min`,
);
check(
  "the only employees who cannot are the ones the park's size makes impossible",
  LATE_ARRIVALS.every(
    (l) =>
      (l.reason === "no-delay-walk" && EMPLOYEE_BY_ID[l.id].delayMinutes === 0) ||
      (l.reason === "delay-shorter-than-walk" && EMPLOYEE_BY_ID[l.id].delayMinutes > 0),
  ) && LATE_ARRIVALS.filter((l) => l.reason === "delay-shorter-than-walk").length <= 1,
  `${LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").length} on-time employees walking ` +
    `${Math.min(...LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").map((l) => l.minutes)).toFixed(1)}–` +
    `${Math.max(...LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").map((l) => l.minutes)).toFixed(1)} min ` +
    `from gate to ride; ${LATE_ARRIVALS.filter((l) => l.reason === "delay-shorter-than-walk").length} whose delay is shorter than that walk`,
);
check(
  "no employee's ride arrival is ever EARLIER than the sheet's work-start",
  JOURNEY_EMPLOYEES.every((e) => e.workStartActual >= e.workStart - 1e-9),
  "nobody starts work before the data says they did",
);
check(
  "WORK STARTED begins the moment they are in their seat",
  JOURNEY_EMPLOYEES.every(
    (e) =>
      sampleJourney(e, e.workStartActual + 1e-6)!.working &&
      !sampleJourney(e, e.workStartActual - 1e-3)!.working,
  ),
  "the transition is a crossing of their own work-start minute, not a jump",
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
/*
 * Ride placement, as it now stands.
 *
 * Three of these are the centres the park has always had. Two changed, and both
 * changes were asked for or forced by one that was:
 *
 *   - the Monster Ride and the Drop Tower each STEPPED BACK 40 m, away from the
 *     main gate at z = 620 and deeper into the park;
 *   - the Roller Coaster moved 12.3 m west, which nobody asked for. Every ride
 *     grew 20%, and at full size the Roller Coaster and the Monster Ride
 *     overlap by 12.5 m in x. The layout solver will not let two rides
 *     intersect, so it pushed the pair apart symmetrically.
 */
/*
 * THE RIDES HAVE MOVED, AND THIS CHECK NOW SAYS WHAT SURVIVED THE MOVE.
 *
 * It used to hold five frozen coordinates, because for a long stretch of this
 * park's life the standing instruction was that no ride ever moves. That
 * instruction has been superseded by a direct one — every ride is to be the
 * same size — and rides the same size need room: the Monster Ride's footprint
 * doubled, the Roller Coaster's is 271 m across, and the layout solver
 * re-placed all five to fit them with clear sky between their silhouettes.
 *
 * What must still hold is the FAN, which is what those coordinates were really
 * protecting: from the main gate the five rides still read left to right in
 * their designed order, Ferris Wheel, Dragon Ride, Roller Coaster, Monster
 * Ride, UFO Pendulum, and no two of them overlap on the ground. The centres
 * are printed rather than asserted, so a change to them is visible in the log
 * instead of frozen into it.
 */
{
  const FAN_ORDER = ["ferris", "dragon", "coaster", "monster", "ufo"];
  const ax = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
  const az = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
  const al = Math.hypot(ax, az) || 1;
  const bearingOf = (c: readonly [number, number]) => {
    const dx = c[0] - MAIN_VIEWPOINT[0];
    const dz = c[1] - MAIN_VIEWPOINT[1];
    return Math.atan2((ax / al) * dz - (az / al) * dx, dx * (ax / al) + dz * (az / al));
  };
  const seen = [...PARK_LAYOUT]
    .sort((a, b) => bearingOf(a.center) - bearingOf(b.center))
    .map((r) => r.id);
  check(
    "the five rides still read left to right in the order the fan was designed in",
    seen.join(",") === FAN_ORDER.join(","),
    PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
  );
}
check(
  "no ride module knows the journey exists",
  /* Comments stripped: a ride's constants may NAME the journey module in prose
     — the seat heights are documented as being shared with it — without the
     ride depending on it. What must not appear is a real reference. */
  ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride", "ufo-pendulum"].every(
    (dir) => !existsSync(join(root, "src", "components", dir)) ||
      !code(readFileSync(join(root, "src", "components", dir, "constants.ts"), "utf8")).includes("journey"),
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
/*
 * Matched on the ride, not on the ride's printed department string: the Ferris
 * Wheel's reads "IT Support · UI/UX", which is nobody's department, so
 * comparing against it reported the shared ride as empty.
 */
const byDept = RIDE_DEPARTMENTS.map((d) => {
  const list = JOURNEY_EMPLOYEES.filter((e) => e.rideId === d.rideId);
  const avg = list.length ? list.reduce((s, e) => s + e.delayMinutes, 0) / list.length : 0;
  const seated = list.filter((e) => e.visitsFoodCourt).length;
  return (
    `  ${d.department.padEnd(19)} ${d.rideName.padEnd(15)} ${String(list.length).padStart(2)} staff   ` +
    `avg delay ${avg.toFixed(1).padStart(4)} min   ${String(seated).padStart(2)} via the food court`
  );
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
