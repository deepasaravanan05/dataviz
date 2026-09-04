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
  ringDetour,
  sampleJourney,
} from "../src/simulation/journey/journey";
import {
  ATTENDANCE_DATASET,
  ATTENDANCE_DATES,
  EMPLOYEE_DATASET,
} from "../src/simulation/journey/dataset";
import { BOWL_DEPTH, BOWL_RADIUS } from "../src/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_RIDE_CENTER } from "../src/components/ufo-pendulum/placement";
import {
  CHECK_IN_CLOSE,
  CHECK_IN_DWELL,
  CHECK_IN_OPEN,
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
import { EMPLOYEE_SCALE, HUMAN } from "../src/world/scale";
import { distanceToPaving } from "../src/components/world/paths";
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
import {
  GATE_RADIUS,
  PARK_ORIGIN,
  PARK_PAVED_EDGE,
  RIDE_RING_OUTER_EDGE,
  RIDE_SLOT_BEARING,
  FOOD_COURT_PATH_RADIUS,
  RADIAL_PATH_LENGTH,
  ringPoint,
  type RingRideId,
} from "../src/components/park/parkRing";

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

// ============ 1. The dataset — the EXACT rows the workbook supplies ============
/*
 * This section used to restate the thirty-row sheet verbatim, in its own
 * spellings, and compare it field for field against what the app loaded. The
 * source of truth is now `data/final one.xlsx` — 3,219 rows across 49 dates —
 * which cannot be restated in a source file and does not need to be:
 * `verify:attendance` re-reads the workbook itself and asserts the generated
 * module matches it row for row.
 *
 * So what belongs here is the half that check cannot make: that the JOURNEY
 * carries the dataset through untouched. Every employee the park animates is
 * one of the selected date's rows, in the sheet's own order, with every field
 * the sheet gave them — and the arithmetic the sheet states still holds.
 */
{
  let mismatches = 0;
  let example = "";
  for (let i = 0; i < EMPLOYEE_DATASET.length; i++) {
    const b = EMPLOYEE_DATASET[i];
    const e = JOURNEY_EMPLOYEES[i];
    if (
      !e ||
      e.id !== b.id ||
      e.name !== b.name ||
      e.department !== b.department ||
      e.checkInTime !== b.checkIn ||
      Math.abs(e.delayMinutes - b.delayMinutes) > 1e-9 ||
      e.reportedDelayMinutes !== b.reportedDelayMinutes ||
      Math.abs(e.workStart - b.workStart) > 1e-9
    ) {
      mismatches++;
      if (!example) {
        example = `${b.id}: got ${e?.name} / ${e?.department} / ${e?.checkInTime} / ${e?.delayMinutes}`;
      }
    }
  }
  check(
    "every id, name, department, check-in, delay and work-start is the workbook's own",
    mismatches === 0 && JOURNEY_EMPLOYEES.length === EMPLOYEE_DATASET.length,
    example || `all ${EMPLOYEE_DATASET.length} rows of ${EMPLOYEE_DATASET[0].date} carried through untouched`,
  );
  check(
    "the park animates one DATE of the workbook, and the whole of it",
    EMPLOYEE_DATASET.every((r) => r.date === EMPLOYEE_DATASET[0].date) &&
      ATTENDANCE_DATES.includes(EMPLOYEE_DATASET[0].date!) &&
      ATTENDANCE_DATASET.filter((r) => r.date === EMPLOYEE_DATASET[0].date).length ===
        EMPLOYEE_DATASET.length,
    `${EMPLOYEE_DATASET.length} employees on ${EMPLOYEE_DATASET[0].date}, ` +
      `one of ${ATTENDANCE_DATES.length} dates and ${ATTENDANCE_DATASET.length} rows`,
  );
  check(
    "the supplied delays are internally consistent: delay = work start − check-in on every row",
    ATTENDANCE_DATASET.every((b) => Math.abs(b.workStart - b.checkIn - b.delayMinutes) < 1e-9),
    `the workbook's own arithmetic holds on all ${ATTENDANCE_DATASET.length} rows`,
  );
  check(
    /* The printed Delay Time is the whole-minute part of the exact gap. That is
       the relation the workbook actually satisfies, and the one the park
       depends on: the printed column decides who was delayed, the exact gap
       decides how long they sit. */
    "and the printed Delay Time is those minutes, whole",
    ATTENDANCE_DATASET.every(
      (b) => Math.floor(b.delayMinutes + 1e-9) === b.reportedDelayMinutes,
    ),
    "every row's Delay Time column is the floor of its own two timestamps' gap",
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
  /* Banded on the sheet's own whole-minute Delay Time column, so a delay
     printed as "15 mins" bands as fifteen and not as the 15.4 behind it. */
  JOURNEY_EMPLOYEES.every((e) => e.delayCategory === classifyDelay(e.reportedDelayMinutes)),
  `${JOURNEY_EMPLOYEES.filter((e) => e.color !== e.delayCategory).length} of ` +
    `${JOURNEY_EMPLOYEES.length} employees arrive in one band and are delayed into another — ` +
    `which is the point of reporting both`,
);
check(
  /*
   * THE BANDS ARE HALF-OPEN, AND EXACT TO THE SECOND. The brief states them as
   * `checkin < 09:45:00` green, `09:45:00 <= checkin < 11:00:00` yellow,
   * `checkin >= 11:00:00` red, so each boundary belongs to the band ABOVE it —
   * and a second either side of one has to land in the right band, because the
   * workbook's own check-ins carry seconds (09:45:30 is yellow, not green).
   */
  "the band boundaries are CHECK_IN_THRESHOLDS, exact and half-open",
  checkInColor(CHECK_IN_THRESHOLDS.greenUntil - 1 / 60) === "GREEN" &&
    checkInColor(CHECK_IN_THRESHOLDS.greenUntil) === "YELLOW" &&
    checkInColor(CHECK_IN_THRESHOLDS.greenUntil + 1 / 60) === "YELLOW" &&
    checkInColor(CHECK_IN_THRESHOLDS.yellowUntil - 1 / 60) === "YELLOW" &&
    checkInColor(CHECK_IN_THRESHOLDS.yellowUntil) === "RED" &&
    checkInColor(CHECK_IN_THRESHOLDS.yellowUntil + 1 / 60) === "RED",
  `before ${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)} GREEN | up to ` +
    `${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)} YELLOW | from then on RED`,
);
check(
  /* And they are the boundaries the brief names, not merely self-consistent. */
  "and they are the boundaries the brief names — 9:45 and 11:00",
  CHECK_IN_THRESHOLDS.greenUntil === 9 * 60 + 45 && CHECK_IN_THRESHOLDS.yellowUntil === 11 * 60,
  `${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)} and ${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)}`,
);
check(
  "all three colour bands are actually populated",
  (["GREEN", "YELLOW", "RED"] as const).every((c) => JOURNEY_EMPLOYEES.some((e) => e.color === c)),
  (["GREEN", "YELLOW", "RED"] as const)
    .map((c) => `${c} ${JOURNEY_EMPLOYEES.filter((e) => e.color === c).length}`)
    .join(", "),
);
check(
  /*
   * ARRIVALS ARE THE SHEET'S, and the sheet packs them: a real attendance
   * record has fifteen people checking in inside one minute of a busy morning.
   * The property this was protecting is that the park does not invent a queue
   * by rounding everybody onto the same instant — so it is stated on the
   * SECONDS the workbook actually records, where the arrivals are all but
   * unique, rather than on the minute they fall in.
   */
  "arrivals are staggered, not simultaneous",
  new Set(checkIns).size >= JOURNEY_EMPLOYEES.length * 0.95,
  `${new Set(checkIns).size} distinct check-in times across ${JOURNEY_EMPLOYEES.length} people, ` +
    `falling in ${new Set(checkIns.map((t) => Math.round(t))).size} different minutes`,
);

// ============ 3. Delay is real arithmetic on the real times ============
check(
  "delay is work start minus check-in, to the minute",
  JOURNEY_EMPLOYEES.every((e) => Math.abs(e.delayMinutes - (e.workStart - e.checkInTime)) < 1e-9),
  "no employee's delay is stated independently of their own timeline",
);
check(
  "the delay band reuses the park's existing classifyDelay()",
  JOURNEY_EMPLOYEES.every((e) => e.delayCategory === classifyDelay(e.reportedDelayMinutes)) &&
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
  /* "Delayed" is the sheet's own Delay Time column, exactly as the brief
     states the rule — nineteen rows of the workbook print "0 mins" beside
     timestamps a few seconds apart, and the printed column is the one that
     decides. */
  JOURNEY_EMPLOYEES.every((e) => e.visitsFoodCourt === e.reportedDelayMinutes > 0),
  `${visitors.length} delayed all eat; ${direct.length} on-time all go straight to their ride`,
);
check(
  "the share is whatever the data says, not a target",
  visitors.length === EMPLOYEE_DATASET.filter((r) => r.reportedDelayMinutes! > 0).length,
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
 * THE SIT IS THE DELAY — all of it, and nothing else.
 *
 * It used to be the delay LESS the walking it paid for, so that a diner left
 * their chair early enough to reach their ride on the sheet's own work-start
 * minute. That is no longer what the brief asks for and no longer what the park
 * can honestly do: the wait in the food court must equal the Delay Time exactly
 * — it is the one number a viewer can check against the sheet by watching a
 * clock — and this park is big enough that the round trip through the middle
 * costs half an hour, which is longer than 83% of the delays in the workbook.
 *
 * So the walking is OUTSIDE the sit, the sit is the data, and the consequence
 * is recorded rather than hidden: an employee reaches their ride later than the
 * sheet's Actual Work Start by the length of a walk, and `LATE_ARRIVALS` says
 * by how much.
 *
 * THE SIT AND THE VISIT ARE STILL DIFFERENT LENGTHS. `foodCourtEntry` and
 * `foodCourtExit` are the moments they reach the door and leave it again, so
 * the VISIT is the walk in, plus the sit, plus the walk out across a 500 m
 * plaza.
 */
check(
  "time on the seat is the delay, exactly — to the second",
  visitors.every((e) => Math.abs(e.sitMinutes - e.delayMinutes) < 1e-9),
  `worst disagreement between a sit and its delay ` +
    `${Math.max(...visitors.map((e) => Math.abs(e.sitMinutes - e.delayMinutes))).toExponential(1)} min ` +
    `across sits of ${Math.min(...visitors.map((e) => e.sitMinutes)).toFixed(1)}–` +
    `${Math.max(...visitors.map((e) => e.sitMinutes)).toFixed(1)} min`,
);
check(
  "and the sheet's printed Delay Time is those minutes, whole",
  visitors.every((e) => Math.floor(e.sitMinutes + 1e-9) === e.reportedDelayMinutes),
  `every sit's whole minutes are the "N mins" the workbook prints`,
);
check(
  "the visit is the sit plus the walk in and out, never less",
  visitors.every((e) => e.foodCourtExit! - e.foodCourtEntry! >= e.sitMinutes - 1e-6),
  `visits run ${Math.min(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry! - e.sitMinutes)).toFixed(2)}–` +
    `${Math.max(...visitors.map((e) => e.foodCourtExit! - e.foodCourtEntry! - e.sitMinutes)).toFixed(2)} min ` +
    `longer than the sits inside them`,
);
check(
  /* Now that the sit is the delay itself, sit length reads as delay size with
     no tolerance at all: a strictly longer delay is a strictly longer sit. */
  "a longer delay always shows a longer sit",
  visitors
    .slice()
    .sort((a, b) => a.delayMinutes - b.delayMinutes)
    .every((e, i, sorted) => i === 0 || e.sitMinutes >= sorted[i - 1].sitMinutes - 1e-9),
  "sits rise with delays exactly, because they are the same number",
);
check(
  /* The floor that used to be here is gone with the arithmetic that needed it:
     a sit can no longer be squeezed to nothing by the walking, so the shortest
     sit in the park is simply the shortest delay in the data. */
  "every sit is long enough to actually see",
  visitors.every((e) => e.sitMinutes >= 1),
  `shortest sit ${Math.min(...visitors.map((e) => e.sitMinutes)).toFixed(2)} min, which is the ` +
    `shortest delay on this date`,
);

/*
 * ============ 4b. NO TWO EMPLOYEES OCCUPY THE SAME GROUND ============
 *
 * The brief asks that employees do not overlap each other, and on a roster this
 * size that is a real risk: the whole cast comes in through one gate, everybody
 * delayed passes through one food-court door, and a department's arrivals all
 * converge on one boarding apron.
 *
 * The park solves it structurally rather than by pushing figures apart at draw
 * time. Every employee has their own turnstile at their check-in minute, their
 * own lane on each shared stretch of paving, their own chair in the court, their
 * own spot on the apron and their own seat on the ride. So what is asserted is
 * the two halves of "no overlap":
 *
 *   1. NOBODY EVER STANDS INSIDE ANYBODY. Two figures that are both stationary
 *      are always at least a shoulder width apart. This is the strong one — a
 *      standing overlap is a permanent, visible defect.
 *
 *   2. AND NOBODY PASSES THROUGH ANYBODY. Two figures in motion do come close
 *      when their paths cross — people walking across a plaza do — but they
 *      never merge: the closest approach in the whole day is reported, and it
 *      has to stay clear of the point where two bodies would occupy one place.
 */
{
  const SHOULDER = HUMAN.shoulderWidth * EMPLOYEE_SCALE;
  const STEP = 0.05;
  let standingClash = 0;
  let worstStanding = Infinity;
  const contact = new Map<string, number>();

  for (let t = LOOP_START; t <= LOOP_END; t += STEP) {
    const here = JOURNEY_EMPLOYEES.map((e) => ({ e, s: sampleJourney(e, t) })).filter(
      (x) => x.s !== null && !x.s.onRide && (x.s.y ?? 0) < 0.5,
    );
    for (let i = 0; i < here.length; i++) {
      for (let j = i + 1; j < here.length; j++) {
        const a = here[i].s!;
        const b = here[j].s!;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (!a.moving && !b.moving) {
          worstStanding = Math.min(worstStanding, d);
          if (d < SHOULDER) standingClash++;
        } else if (d < SHOULDER) {
          const key = `${here[i].e.id}/${here[j].e.id}`;
          contact.set(key, (contact.get(key) ?? 0) + STEP);
        }
      }
    }
  }

  const longest = contact.size ? Math.max(...contact.values()) : 0;
  check(
    "no two employees ever stand inside one another",
    standingClash === 0,
    `the closest any two stationary figures come is ${worstStanding.toFixed(2)}u, ` +
      `against a ${SHOULDER.toFixed(2)}u shoulder width`,
  );
  check(
    /*
     * Moving figures DO come within a shoulder width of each other, and that is
     * a crowd rather than a fault: paths cross on the avenue, on the ring and
     * across the plaza, and the park has no pedestrian collision avoidance —
     * two people whose routes intersect pass through the same patch of ground
     * for a moment rather than stepping round one another.
     *
     * What must not happen is two figures WALKING TOGETHER inside one another,
     * which would read as one person with two heads for as long as it lasted.
     * So the property is that every such approach is a brush past: it lasts a
     * fraction of a minute and then they are clear again.
     */
    "and any close pass is a pass, not two figures travelling as one",
    longest < 0.5,
    contact.size === 0
      ? "no two figures come within a shoulder width of each other all day"
      : `${contact.size} pairs come within a shoulder width at some point; the longest any ` +
        `two are that close is ${longest.toFixed(2)} min, on crossing paths`,
  );
}

/*
 * ============ 4c. EVERY STEP INSIDE THE PARK IS ON PAVING ============
 *
 * The brief asks for a complete, visible walking path that does not pass
 * through rides, buildings or trees. The park answers it by construction: the
 * routes are laid along the avenue, the food court's circular path, the ring
 * and the radials, and the planting is kept off them. This measures it rather
 * than asserting it — every waypoint of every route, from the turnstile
 * inwards, has to be on the paved surface the environment actually draws.
 *
 * Waypoints on a boarding stair or in a ride seat are excluded, since they are
 * above the ground rather than on it, and the approach outside the gate is too:
 * that is the arrival road, which is a different surface.
 */
{
  let worst = 0;
  let where = "";
  let counted = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    for (const w of e.route) {
      if ((w.y ?? 0) > 0.5) continue;
      if (w.phase === "APPROACHING" || w.phase === "QUEUED" || w.phase === "CHECKING_IN") continue;
      counted++;
      const d = distanceToPaving(w.x, w.z);
      if (d > worst) {
        worst = d;
        where = `${e.id} ${w.phase}`;
      }
    }
  }
  check(
    "every step an employee takes inside the park lands on paving",
    worst <= 0,
    worst <= 0
      ? `all ${counted} ground waypoints across ${JOURNEY_EMPLOYEES.length} routes are on the paved surface`
      : `${where} stands ${worst.toFixed(2)}u off the paving`,
  );
}

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
      /*
       * NOR IS THE STRIDE ONTO THE STAIR. It is level, so the height test above
       * does not catch it, but it is the first move of a climb and is timed at
       * the climbing pace with the rest of it: an employee walks in to the
       * middle of the bottom step, because that is where their route was aimed
       * before the schedule knew which lane of the steps would be free, and
       * crosses to their own side of it as they start up. `verify-boarding`
       * checks the whole climb, that stride included, against the climbing pace.
       */
      if (b.phase === "CLIMBING_LADDER") continue;
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
 * THEY RIDE, THEY GET OFF, AND THEY STAY AT THEIR DEPARTMENT.
 *
 * The seat used to be the last waypoint on every route: an employee who sat
 * down was on the ride for the rest of the day. That capped a ride's whole day
 * at the ten seats its deck reaches — fifty across the park — and this workbook
 * puts up to ninety-six people through a single date, so the last half of a
 * morning had nowhere to sit.
 *
 * A rider now does what a rider does: stands up once the machine is at rest,
 * crosses the deck, walks back down the stair and returns to their department's
 * own spot, where their working day carries on. The seat comes free behind
 * them. So the guarantee this section makes is the new one, in the same strong
 * form: the route ends standing at the department, and nothing after the seat
 * ever puts them anywhere else.
 */
check(
  "every employee's route ends at their department, working",
  JOURNEY_EMPLOYEES.every((e) => {
    const last = e.route[e.route.length - 1];
    return (
      last.phase === "WORKING" &&
      Math.hypot(last.x - e.route[e.route.length - 1].x, last.z - last.z) === 0 &&
      last.depart >= e.despawnTime - 1e-9
    );
  }),
  "the last waypoint of every route is the department spot, held to the end of the day",
);
check(
  "and they are on their ride for exactly the stretch between sitting and rising",
  JOURNEY_EMPLOYEES.every((e) => {
    const seated = sampleJourney(e, (e.seatedAt + e.riseAt) / 2);
    const after = sampleJourney(e, e.rideExit + 0.5);
    return (
      seated !== null &&
      seated.onRide &&
      seated.phase === "SITTING_ON_RIDE" &&
      after !== null &&
      !after.onRide &&
      after.phase === "WORKING"
    );
  }),
  "aboard from the seat to the rise, and on the ground at their department afterwards",
);
/*
 * "NEVER AT GROUND LEVEL" WHILE THEY ARE ON THE RIDE.
 *
 * A seated rider used to be above y=0 at every moment of the day, so that was
 * a sound test for "still aboard". It is not sound on its own: the UFO Pendulum
 * is built to the park's common height, parks low enough to board off a single
 * flight of stairs, and swings into a BOWL — so a rider passing the bottom of
 * that swing is legitimately below ground, inside the ride's own excavation.
 * What must never happen is a rider ending up back on the walking surface
 * WHILE THEY ARE SUPPOSED TO BE ABOARD, so the test runs from the moment they
 * are seated to the moment they stand up again.
 */
check(
  "nobody touches the ground between sitting down and standing up",
  JOURNEY_EMPLOYEES.every((e) => {
    /* From the instant they are seated — at exactly `seatedAt` the sample is
       still the last frame of getting in. */
    for (let t = e.seatedAt + 1e-6; t < e.riseAt; t += 0.25) {
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
  "sampled across every seated minute: always aboard, and never below ground except inside " +
    "the pendulum's own bowl",
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
 *
 * MEASURED ON THE SIT, not on the visit. `foodCourtEntry` and `foodCourtExit`
 * are the moments they reach the court's door and leave it again, and across a
 * 500 m plaza those bracket the sit by most of a minute at each end — so two
 * diners can be inside the court together, one walking in and one walking out,
 * without ever being on the same chair. `sitStart` and `sitEnd` are when they
 * are actually on it, and that is the question this check asks.
 */
{
  let shared = "";
  for (let a = 0; a < visitors.length; a++) {
    for (let b = a + 1; b < visitors.length; b++) {
      const A = visitors[a];
      const B = visitors[b];
      if (A.chairIndex !== B.chairIndex) continue;
      if (A.sitStart! < B.sitEnd! && B.sitStart! < A.sitEnd!)
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
/*
 * THE RAILWAY USED TO BE SAMPLED HERE — a thousand points round the loop, a
 * distance-to-the-rails helper and a point-in-polygon test for "is this inside
 * the park". The train and its track have been removed at the user's request,
 * so all three are gone, and the questions they answered are asked against the
 * plan instead: the park's extent is `PARK_PAVED_EDGE`, and "inside the park"
 * is a radius rather than a winding number.
 */
const insidePark = (x: number, z: number) =>
  Math.hypot(x - PARK_ORIGIN[0], z - PARK_ORIGIN[1]) <= PARK_PAVED_EDGE;
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
/*
 * THE FOOD COURT IS THE PLAZA NOW, so "clears it" is the wrong question.
 *
 * This used to check that the court stood clear of the paved circle at the
 * middle of the park, because the court was a pavilion off to one side and the
 * plaza held a fountain. The brief has since made the court the centrepiece:
 * it occupies that circle, and PLAZA_RADIUS is its own plaza's radius. What is
 * worth asserting is what the check was protecting — that the court is on the
 * park's own centre and fills it exactly, rather than sitting somewhere near
 * it and overlapping the paving by an unstated amount.
 */
check(
  "the food court IS the plaza at the middle of the park",
  Math.abs(FOOD_COURT_CENTER[0] - PLAZA_CENTER[0]) < 1e-9 &&
    Math.abs(FOOD_COURT_CENTER[1] - PLAZA_CENTER[1]) < 1e-9 &&
    Math.abs(FOOD_COURT_HALF - PLAZA_RADIUS) < 1e-9,
  `a ${(PLAZA_RADIUS * 2).toFixed(0)}u plaza centred on (${PLAZA_CENTER.join(", ")})`,
);
check(
  "the food court really is inside the park",
  insidePark(...FOOD_COURT_CENTER),
  "at the very middle of it, in fact",
);
check(
  "the main gate is outside the paved park, where an entrance belongs",
  !insidePark(GATE_X, GATE_Z),
  `${(Math.hypot(GATE_X - PARK_ORIGIN[0], GATE_Z - PARK_ORIGIN[1]) - PARK_PAVED_EDGE).toFixed(0)}u beyond the outer path`,
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
  /* The sheet's own Delay Time column, in whole minutes — the panel prints
     what the workbook prints rather than the exact gap behind it. */
  "employee.reportedDelayMinutes",
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

/*
 * ============ 15. The centre, and how routes treat it ============
 *
 * THE CENTRE OF THE PARK HOLDS NO RIDE. That has been the rule through three
 * different centrepieces — a fountain, then a lake with a waterfall, and now
 * the grand food court — and it is the part worth keeping. What changed with
 * the food court is the second half: the middle used to be something you could
 * only walk AROUND, and it is now somewhere people actually go. So the routes
 * are checked in two parts below: nobody crosses the middle on their way
 * somewhere else, and a diner may walk into it.
 *
 * The FOUNTAIN_* names are the fountain's and have outlived all three; they
 * mean "the middle, and the circle routes bend around it".
 */
check(
  "the centre of the park is the centrepiece — and it holds no ride",
  FOUNTAIN_CENTER[0] === PLAZA_CENTER[0] &&
    FOUNTAIN_CENTER[1] === PLAZA_CENTER[1] &&
    FOUNTAIN_RADIUS <= PLAZA_RADIUS,
  `the ${FOUNTAIN_RADIUS}u food court plaza at (${FOUNTAIN_CENTER}), with no ride inside it`,
);
check(
  "no ride footprint reaches the fountain",
  PARK_LAYOUT.every((r) => boxDist(FOUNTAIN_CENTER[0], FOUNTAIN_CENTER[1], r) > FOUNTAIN_RADIUS + 10),
  `nearest ride ${PARK_LAYOUT.map((r) => boxDist(FOUNTAIN_CENTER[0], FOUNTAIN_CENTER[1], r).toFixed(0)).sort((a, b) => Number(a) - Number(b))[0]}u away`,
);
{
  /*
   * NOBODY CROSSES THE MIDDLE ON THEIR WAY SOMEWHERE ELSE.
   *
   * The rule used to be absolute — the middle was a fountain and then a lake,
   * and no route came near either. The middle is now the food court, which is
   * a destination, so the rule splits: a diner walks IN, and everybody else
   * still goes round. The phase says which is which, so the test can be honest
   * about both instead of being loosened for everyone.
   */
  let intrusions = 0;
  let closest = Infinity;
  let who = "";
  let dinersInside = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    for (let t = e.checkInTime; t <= e.workStart + 1; t += 0.05) {
      const smp = sampleJourney(e, t);
      if (!smp) continue;
      const d = Math.hypot(smp.x - FOUNTAIN_CENTER[0], smp.z - FOUNTAIN_CENTER[1]);
      const visiting =
        smp.phase === "TO_FOOD_COURT" || smp.phase === "IN_FOOD_COURT";
      if (visiting) {
        if (d < FOUNTAIN_CLEARANCE) dinersInside++;
        continue;
      }
      if (d < closest) {
        closest = d;
        who = e.id;
      }
      if (d < FOUNTAIN_CLEARANCE) intrusions++;
    }
  }
  check(
    "nobody crosses the food court on their way past — they walk AROUND it",
    intrusions === 0,
    `closest pass by a non-diner ${closest.toFixed(1)}u (${who}) vs a ${FOUNTAIN_CLEARANCE}u plaza`,
  );
  check(
    "and the diners do go inside it, because it is a destination now",
    dinersInside > 0,
    `${dinersInside} samples of employees inside the court, eating`,
  );
}
/*
 * THE DETOUR'S OWN GEOMETRY, exercised on two legs derived from the ring
 * rather than typed. The endpoints used to be a pair of hand-picked
 * coordinates, which stopped meaning anything the moment the park changed
 * size — (70, -100) was outside the old 22 m fountain circle and is inside the
 * 290 m ring path.
 *
 * The two cases are the two kinds of way the park is paved with. A leg between
 * points on DIFFERENT bearings has to come in to the ring path, go round it
 * and go back out, because there is no paving between one radius and another.
 * A leg between points on the SAME bearing is already on a radial way — an
 * avenue, a ride's spur — and must be left exactly as it is.
 */
{
  const a = ringPoint(0, RIDE_RING_OUTER_EDGE);
  const b = ringPoint(180, RIDE_RING_OUTER_EDGE);
  check(
    "a leg between two bearings is routed round the ring path",
    ringDetour(a, b).length >= 3,
    `${ringDetour(a, b).length} arc points inserted crossing the park`,
  );
  const near = ringPoint(90, FOOD_COURT_PATH_RADIUS + 20);
  const far = ringPoint(90, RIDE_RING_OUTER_EDGE);
  check(
    "a leg along one bearing is left perfectly straight",
    ringDetour(near, far).length === 0,
    "no detour on a radial way",
  );
}

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
 * The stay is not a configured window at all — it IS the delay. A dwell
 * constant would have been a second source of truth sitting next to the
 * dataset, and the two would eventually disagree.
 */
check(
  "the food-court stay is the delay itself, not a dwell constant",
  visitors.every((e) => {
    /* Measured on the seated window rather than on the door-to-door visit,
       which also contains the walk across the plaza. */
    const sat = e.sitEnd! - e.sitStart!;
    return Math.abs(sat - e.sitMinutes) < 1e-9 && Math.abs(sat - e.delayMinutes) < 1e-9;
  }) && !/FOOD_COURT_DWELL/.test(journeySrc),
  `sits ${Math.min(...visitors.map((e) => e.sitEnd! - e.sitStart!)).toFixed(1)}–${Math.max(...visitors.map((e) => e.sitEnd! - e.sitStart!)).toFixed(1)} min, each exactly its own delay`,
);

/*
 * WHERE THE PARK ARGUES WITH THE SHEET.
 *
 * NOBODY reaches their ride at the sheet's own Actual Work Start minute any
 * more, and that is a deliberate consequence rather than a regression.
 *
 * The brief asks for two things that a kilometre-wide park cannot both deliver:
 * a delayed employee must wait in the food court for EXACTLY their Delay Time,
 * and their Actual Work Start is their check-in plus that delay. The walk — in
 * to the middle of the park and back out to a ride on the ring — is a good half
 * hour on foot, and it has to happen somewhere. The old builder hid it inside
 * the delay by shortening the sit; the sit is the data now, so the walk shows.
 *
 * So what is asserted is the property that is actually true and actually
 * matters: an employee reaches their ride LATE, never early, and never by more
 * than the walk the plan makes them do. The sheet's own minute is carried
 * through untouched on `workStart` either way.
 *
 * THE ALLOWANCE IS MEASURED, NOT ACCUMULATED. The park is concentric and states
 * its own size: the entrance stands on the boundary and every ride is served
 * off the ring path, so the furthest anybody has to go is the avenue in, half
 * the food court's circular path, and one radial out. A delayed employee walks
 * that twice, which is why the diners' window is the round trip. It tightens by
 * itself if the park is ever drawn back in.
 */
const APPROACH_METRES =
  GATE_RADIUS -
  FOOD_COURT_PATH_RADIUS +
  Math.PI * FOOD_COURT_PATH_RADIUS +
  RADIAL_PATH_LENGTH;
const STEP_BACK_MINUTES = APPROACH_METRES / WALK_UNITS_PER_MINUTE;
check(
  "no delayed employee reaches their ride EARLY — the sit is served in full first",
  visitors.every((e) => e.rideArrival >= e.workStart - 1e-9),
  `earliest arrival relative to the sheet: ` +
    `${Math.min(...visitors.map((e) => e.rideArrival - e.workStart)).toFixed(2)} min`,
);
check(
  "and none of them is later than the walk the plan makes them do",
  visitors.every((e) => e.rideArrival - e.workStart < 2 * STEP_BACK_MINUTES + 1.0),
  `largest slip among the delayed: ${Math.max(...visitors.map((e) => e.rideArrival - e.workStart)).toFixed(2)} min, ` +
    `inside a ${(2 * STEP_BACK_MINUTES + 1.0).toFixed(2)} min window — a round trip through a food ` +
    `court ${APPROACH_METRES.toFixed(0)} m of walking from the gate`,
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
/*
 * WHY THIS NO LONGER CAPS THE COUNT AT ONE.
 *
 * The property being asserted is that nobody arrives late for a reason the
 * park is not responsible for: every late arrival is either an employee the
 * sheet records as having NO delay at all — who is therefore still walking at
 * the minute their work is said to start, whatever the park's size — or one
 * whose recorded delay is genuinely shorter than their own walk from the gate.
 *
 * That part is unchanged and is the real check. What went is the `<= 1` on the
 * second group. It was a guard against the number quietly creeping up, and it
 * has been overtaken by a deliberate change rather than by a regression: the
 * park is concentric now, the entrance stands on the boundary and the ride
 * ring is 400-550 m in from it, so the walk from gate to attraction is longer
 * for everybody and three employees' recorded delays fall short of it where
 * one did before.
 *
 * Capping the count would have been the wrong repair in either direction —
 * raising it to three re-freezes an arbitrary number, and leaving it at one
 * fails for a reason that is not a fault. So the classification is PROVED
 * instead: each of these employees must genuinely have a recorded delay
 * shorter than the slip their walk produces. That cannot be satisfied by a
 * bug, and it does not have to be edited every time the park is resized.
 */
check(
  "the only employees who cannot are the ones the park's size makes impossible",
  LATE_ARRIVALS.every((l) => {
    const e = EMPLOYEE_BY_ID[l.id];
    /* Whichever reason is recorded, the claim behind it is the same and it is
       MEASURED here rather than taken on trust: every minute this employee lost
       is a minute the PARK took — the scan at the turnstile and the walk across
       it — and never a minute of their own delay. So the slip is exactly the
       part of their morning that is not delay. */
    /*
     * MEASURED AT THE FOOT OF THE STEPS, which is where reaching the ride
     * happens. It used to be measured at `rideArrival`, and that was the same
     * instant until seats became immediate: arriving now means sitting down, so
     * `rideArrival` carries the climb as well and the identity below would be
     * out by the half-minute it takes to get up the stair. The slip these
     * employees are recorded with is the WALK, so the walk is what is checked.
     */
    const parkTime = e.boardStart - e.checkInTime - e.delayMinutes;
    return (
      (l.reason === "no-delay-walk"
        ? e.reportedDelayMinutes === 0 && !e.visitsFoodCourt
        : e.reportedDelayMinutes > 0 && e.visitsFoodCourt) &&
      Math.abs(l.minutes - parkTime) <= 1e-6
    );
  }),
  `${LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").length} on-time employees walking ` +
    `${Math.min(...LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").map((l) => l.minutes)).toFixed(1)}–` +
    `${Math.max(...LATE_ARRIVALS.filter((l) => l.reason === "no-delay-walk").map((l) => l.minutes)).toFixed(1)} min ` +
    `from gate to ride; ${LATE_ARRIVALS.filter((l) => l.reason === "walk-after-food-court").length} delayed ` +
    `employees whose walk out of the food court falls after their sit`,
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
 * THE RIDES HAVE MOVED AGAIN, AND THIS CHECK SAYS WHAT SURVIVED THE MOVE.
 *
 * It has been restated twice rather than re-baselined, and the history is the
 * point. It began as five frozen coordinates, because for a long stretch of
 * this park's life the standing instruction was that no ride ever moves. When
 * "every ride is to be the same size" superseded that, the coordinates went
 * and what they were protecting stayed: the FAN — from the main gate the five
 * read left to right in their designed order, Ferris Wheel, Dragon Ride,
 * Roller Coaster, Monster Ride, UFO Pendulum, with no two overlapping.
 *
 * The park is now concentric, and a ring has no left-to-right order to keep:
 * the attractions run all the way round the lake, so a bearing sort from the
 * gate returns whatever the ring's own order happens to be from that side. The
 * property underneath both earlier versions is that the plan is DELIBERATE and
 * SEPARATED — every ride in a known slot, and no two of them on top of one
 * another — so that is what is asserted, in the terms the plan now has: each
 * of the five is on its declared ring bearing, and every pair is clear on the
 * ground. The centres are printed rather than asserted, so a change to them is
 * visible in the log instead of frozen into it.
 */
{
  const offSlot = PARK_LAYOUT.filter((r) => {
    const dx = r.center[0] - PARK_ORIGIN[0];
    const dz = r.center[1] - PARK_ORIGIN[1];
    const bearing = (Math.atan2(dx, dz) * 180) / Math.PI;
    return Math.abs(bearing - RIDE_SLOT_BEARING[r.id as RingRideId]) > 1e-6;
  });
  check(
    "the five department rides each stand on their declared slot on the ring",
    offSlot.length === 0,
    PARK_LAYOUT.map(
      (r) =>
        `${r.label} ${RIDE_SLOT_BEARING[r.id as RingRideId]}deg (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`,
    ).join(", "),
  );

  let worst = Infinity;
  let pair = "";
  for (let i = 0; i < PARK_LAYOUT.length; i++) {
    for (let j = i + 1; j < PARK_LAYOUT.length; j++) {
      const a = PARK_LAYOUT[i];
      const b = PARK_LAYOUT[j];
      const g =
        Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]) -
        Math.hypot(a.halfX, a.halfZ) -
        Math.hypot(b.halfX, b.halfZ);
      if (g < worst) {
        worst = g;
        pair = `${a.label} / ${b.label}`;
      }
    }
  }
  check(
    "and no two of them overlap on the ground",
    worst > 0,
    `tightest pair ${pair}: ${worst.toFixed(1)}u of clear ground`,
  );
}
check(
  "no ride module knows the journey exists",
  /* Comments stripped: a ride's constants may NAME the journey module in prose
     — the seat heights are documented as being shared with it — without the
     ride depending on it. What must not appear is a real reference. */
  ["roller-coaster", "ferris-wheel", "monster-ride", "dragon-ride", "ufo-pendulum"].every(
    (dir) => !existsSync(join(root, "src", "components", dir)) ||
      !code(readFileSync(join(root, "src", "components", dir, "constants.ts"), "utf8")).includes("journey"),
  ),
  "rides cannot be gated or reordered by the employee layer",
);
check(
  "the journey renders outside every ride scale group",
  /<ParkJourney \/>/.test(scene) &&
    !/<group scale=\{PARK_SCALE\}>\s*<ParkJourney/.test(scene),
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
