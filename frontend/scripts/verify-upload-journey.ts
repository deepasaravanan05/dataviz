/**
 * The upload path, proven on rosters the park has never seen.
 *
 * The upload feature routes an arbitrary spreadsheet through the SAME
 * `buildJourney()` the built-in dataset uses, so everything the other verify
 * scripts prove about the built-in cast is inherited — IF the builder really
 * is a pure function of its rows. That is what this script establishes:
 *
 *   1. a synthetic roster (unknown departments included) obeys the journey
 *      invariants — gate crossing, delay ⟺ food court, unique chairs, loop
 *      bounds, existing rides only;
 *   2. unknown departments land round-robin on the EXISTING rides,
 *      deterministically — the standing never-a-new-destination rule;
 *   3. building a foreign roster leaves the built-in constants untouched —
 *      repeated builds share no module state;
 *   4. rosters the park cannot honestly animate THROW instead of rendering
 *      nonsense, which is what the upload store shows as the error message;
 *   5. the wiring exists: the store activates the build, the figures/HUD/
 *      timeline read the ACTIVE journey, and the journey builder still knows
 *      nothing about the upload.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUILTIN_JOURNEY,
  buildJourney,
  JOURNEY_EMPLOYEES,
  LATE_ARRIVALS,
  sampleJourney,
} from "../src/simulation/journey/journey";
import { EMPLOYEE_DATASET, type DatasetRow } from "../src/simulation/journey/dataset";
import { RIDE_ORDER, rideForDepartment } from "../src/components/park/departments";
import {
  FOOD_COURT_CHAIRS,
  GATE_Z,
  MIN_SIT_MINUTES,
  SPAWN_Z,
} from "../src/simulation/journey/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}
const read = (...p: string[]) => readFileSync(join(__dirname, "..", ...p), "utf8");

function row(
  id: string,
  name: string,
  department: string,
  checkIn: number,
  delayMinutes: number,
  checkOut: number,
): DatasetRow {
  return { id, name, department, checkIn, delayMinutes, workStart: checkIn + delayMinutes, checkOut };
}

/* ---------- 1. A synthetic roster through the real builder ---------- */

const M = (h: number, m: number) => h * 60 + m;

/** Twelve rows: the six known departments plus two the park has never heard of. */
const SYNTHETIC: DatasetRow[] = [
  row("UP2001", "Asha Rao", "IT Support", M(8, 50), 0, M(17, 30)),
  row("UP2002", "Vikram Das", "Cyber Security", M(8, 58), 18, M(17, 45)),
  row("UP2003", "Nila Devi", "ERP", M(9, 6), 0, M(18, 0)),
  row("UP2004", "Rahul Jain", "Tech", M(9, 14), 33, M(18, 15)),
  row("UP2005", "Sara Ali", "Data Engineering", M(9, 22), 7, M(18, 30)),
  row("UP2006", "Dev Anand", "UI/UX", M(9, 30), 0, M(18, 45)),
  row("UP2007", "Kiran Bala", "Finance", M(9, 38), 25, M(19, 0)),
  row("UP2008", "Tara Sen", "Finance", M(9, 46), 0, M(19, 10)),
  row("UP2009", "Omar Khan", "Legal", M(9, 54), 44, M(19, 20)),
  row("UP2010", "Lena Paul", "Legal", M(10, 2), 12, M(19, 30)),
  row("UP2011", "Ravi Teja", "Tech", M(10, 10), 0, M(19, 40)),
  row("UP2012", "Mira Nair", "IT Support", M(10, 18), 39, M(19, 50)),
];

const built = buildJourney(SYNTHETIC);
const employees = built.employees;

check(
  "one employee per uploaded row, fields verbatim",
  employees.length === SYNTHETIC.length &&
    SYNTHETIC.every((r, i) => {
      const e = employees[i];
      return (
        e.id === r.id &&
        e.name === r.name &&
        e.department === r.department &&
        e.checkInTime === r.checkIn &&
        e.delayMinutes === r.delayMinutes &&
        e.workStart === r.workStart
      );
    }),
  `${employees.length} rows in, ${employees.length} figures out`,
);

check(
  "delay > 0 ⟺ food-court visit with a real chair and a real sit",
  employees.every((e) =>
    e.delayMinutes > 0
      ? e.visitsFoodCourt && e.chairIndex !== null && e.sitMinutes >= MIN_SIT_MINUTES
      : !e.visitsFoodCourt && e.chairIndex === null && e.sitMinutes === 0,
  ),
  "the delay column alone decides who sits",
);

check(
  "no two overlapping diners share a chair",
  (() => {
    const seated = employees.filter((e) => e.chairIndex !== null);
    for (let a = 0; a < seated.length; a++)
      for (let b = a + 1; b < seated.length; b++) {
        const A = seated[a];
        const B = seated[b];
        if (
          A.chairIndex === B.chairIndex &&
          A.foodCourtEntry! < B.foodCourtExit! &&
          B.foodCourtEntry! < A.foodCourtExit!
        )
          return false;
      }
    return true;
  })(),
  `${employees.filter((e) => e.chairIndex !== null).length} diners over ${FOOD_COURT_CHAIRS.length} chairs`,
);

check(
  "every route starts outside the gate and ends in a ride seat",
  employees.every((e) => {
    const first = e.route[0];
    const last = e.route[e.route.length - 1];
    /* They no longer walk home. An employee who has boarded stays aboard, so a
       route ends at the seat rather than back outside the gate. */
    return first.z >= SPAWN_Z && first.z > GATE_Z && last.phase === "SITTING_ON_RIDE";
  }),
  "spawn beyond the gate line, and the seat as the last waypoint",
);

check(
  "everyone is at the gate line at their exact check-in minute",
  employees.every((e) => {
    const s = sampleJourney(e, e.checkInTime + 1e-9);
    return s !== null && Math.abs(s.z - GATE_Z) < 1;
  }),
  "CHECKING_IN lands on the sheet's minute",
);

check(
  "the loop window contains every journey",
  built.loopStart < Math.min(...employees.map((e) => e.spawnTime)) &&
    built.loopEnd > Math.max(...employees.map((e) => e.despawnTime)),
  `${built.loopStart.toFixed(1)} .. ${built.loopEnd.toFixed(1)} min-of-day`,
);

check(
  "sampleJourney is live exactly between spawn and despawn",
  employees.every(
    (e) =>
      sampleJourney(e, e.spawnTime - 0.5) === null &&
      sampleJourney(e, e.spawnTime + 0.01) !== null &&
      sampleJourney(e, e.despawnTime - 0.01) !== null &&
      sampleJourney(e, e.despawnTime + 0.5) === null,
  ),
  "no figure exists outside its own day",
);

/* ---------- 2. Unknown departments → existing rides, deterministically ---------- */

check(
  "every assigned ride is one of the park's five existing rides",
  employees.every((e) => (RIDE_ORDER as string[]).includes(e.rideId)),
  `rides used: ${[...new Set(employees.map((e) => e.rideId))].join(", ")}`,
);

check(
  "known departments keep their existing mapping",
  employees
    .filter((e) => ["IT Support", "Cyber Security", "ERP", "Tech", "Data Engineering", "UI/UX"].includes(e.department))
    .every((e) => e.rideId === rideForDepartment(e.department).rideId),
  "the six known names are untouched by the round-robin",
);

check(
  "unknown departments land round-robin in first-seen order",
  employees.find((e) => e.department === "Finance")!.rideId === RIDE_ORDER[0] &&
    employees.find((e) => e.department === "Legal")!.rideId === RIDE_ORDER[1],
  `Finance → ${RIDE_ORDER[0]}, Legal → ${RIDE_ORDER[1]} (never a new destination)`,
);

check(
  "the same roster always builds the same journey",
  JSON.stringify(buildJourney(SYNTHETIC)) === JSON.stringify(built),
  "two builds are deep-equal — no randomness leaks between builds",
);

/* ---------- 3. Builds share no module state ---------- */

const rebuiltBuiltIn = buildJourney(EMPLOYEE_DATASET);
check(
  "building a foreign roster leaves the built-in journey untouched",
  JSON.stringify(rebuiltBuiltIn.employees) === JSON.stringify(JOURNEY_EMPLOYEES) &&
    rebuiltBuiltIn.lateArrivals.length === LATE_ARRIVALS.length &&
    BUILTIN_JOURNEY.employees === JOURNEY_EMPLOYEES,
  "the builder is a pure function of its rows",
);

/* ---------- 4. Pathological rosters throw instead of rendering nonsense ---------- */

function throws(label: string, rows: DatasetRow[], expect: RegExp) {
  let threw: string | null = null;
  try {
    buildJourney(rows);
  } catch (err) {
    threw = err instanceof Error ? err.message : String(err);
  }
  check(label, threw !== null && expect.test(threw), threw ? `"${threw.slice(0, 90)}"` : "did not throw");
}

throws(
  "inconsistent delay arithmetic is rejected",
  [{ ...row("BAD1", "Bad Row", "Tech", M(9, 0), 10, M(18, 0)), workStart: M(9, 5) }],
  /must not be altered to fit/,
);

throws(
  "duplicate employee ids are rejected",
  [row("DUP1", "First", "Tech", M(9, 0), 0, M(18, 0)), row("DUP1", "Second", "ERP", M(9, 30), 0, M(18, 30))],
  /more than once/,
);

throws("an empty roster is rejected", [], /empty/);

throws(
  "a gate lane that cannot admit everyone is rejected, not queued into overlap",
  /*
   * Lanes are dealt round-robin by row index, so rows i and i+LANE_COUNT(9)
   * share a lane. Give row 9 a check-in DURING row 0's turnstile dwell.
   */
  Array.from({ length: 10 }, (_, i) =>
    row(`LANE${i}`, `Lane ${i}`, "Tech", i === 9 ? M(9, 0) : M(9, 0) + i * 20, 0, M(18, 0) + i),
  ),
  /still busy/,
);

throws(
  "a food court beyond its 80 chairs is rejected",
  Array.from({ length: 100 }, (_, i) =>
    // One shared check-in minute would trip the lane guard first, so spread
    // arrivals a minute apart with delays long enough that nobody has left
    // their chair by the time the hundredth diner reaches the door.
    row(`FULL${i}`, `Diner ${i}`, "Tech", M(9, 0) + i, 300, M(20, 0) + i),
  ),
  /full|nowhere to sit/,
);

/* ---------- 5. The wiring is present, and the builder stays clean ---------- */

const journeySrc = read("src", "simulation", "journey", "journey.ts");
const storeSrc = read("src", "store", "employeeDataStore.ts");
const figuresSrc = read("src", "components", "park", "journey", "Employees.tsx");
const timelineSrc = read("src", "components", "hud", "TimelineControls.tsx");
const activeSrc = read("src", "simulation", "journey", "activeJourney.ts");

check(
  "the journey builder still knows nothing about the upload",
  !/employeeDataStore|employeeUpload/.test(journeySrc) && /EMPLOYEE_DATASET/.test(journeySrc),
  "the dependency points store → builder, never back",
);
check(
  "the upload store builds and ACTIVATES the roster — the missing wire",
  /buildJourney\(rows\)/.test(storeSrc) && /activateJourney\(/.test(storeSrc),
  "parse → build → activate, with the throw caught before activation",
);
check(
  "reset returns to the built-in journey through the same swap path",
  /activateJourney\(BUILTIN_JOURNEY, "builtin"\)/.test(storeSrc),
  "one path in, one path back",
);
check(
  "the walking figures render the ACTIVE roster",
  /useActiveJourneyStore\(\(s\) => s\.employees\)/.test(figuresSrc),
  "an upload respawns the cast",
);
check(
  "the timeline spans the ACTIVE roster's day",
  /useActiveJourneyStore\(\(s\) => s\.loopStart\)/.test(timelineSrc) && /min=\{LOOP_START\}/.test(timelineSrc),
  "slider range follows the roster",
);
check(
  "a swap re-bounds the shared clock and releases selection and camera",
  /setJourneyClockBounds\(/.test(activeSrc) && /release\(\)/.test(activeSrc) && /reset\(\)/.test(activeSrc),
  "no stale follow target, no clock outside the new day",
);

console.log(
  failures === 0
    ? "\nOK: the upload path verified — any valid roster becomes a lawful park."
    : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
