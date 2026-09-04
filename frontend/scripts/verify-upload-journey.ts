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
 *      nothing about the upload;
 *   6. every roster section 4 proves the BUILDER rejects is accepted by the
 *      PARK, because `repairRoster()` runs in front of it and hands it rows it
 *      can honestly animate. Both halves have to hold at once: the builder
 *      must stay strict, and the upload must stop failing.
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
import { DEPARTMENTS, RIDE_ORDER, rideForDepartment } from "../src/components/park/departments";
import { repairRoster } from "../src/simulation/journey/rosterRepair";
import { parkIntake } from "../src/simulation/journey/rideOps";
import {
  detectDelimiter,
  parseCsv,
  rowsFromGrid,
} from "../src/simulation/journey/employeeUpload";
import {
  FOOD_COURT_CHAIRS,
  GATE_Z,
  LANE_COUNT,
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
  return {
    id,
    name,
    department,
    checkIn,
    delayMinutes,
    /* An upload has one delay figure, so the printed and exact delays are the
       same number. The workbook's own rows carry both. */
    reportedDelayMinutes: delayMinutes,
    workStart: checkIn + delayMinutes,
    checkOut,
  };
}

/* ---------- 1. A synthetic roster through the real builder ---------- */

const M = (h: number, m: number) => h * 60 + m;

/**
 * Twelve rows: six departments the park already serves — spelled as the
 * workbook spells them — plus two it has never heard of.
 */
const SYNTHETIC: DatasetRow[] = [
  row("UP2001", "Asha Rao", "it support", M(8, 50), 0, M(17, 30)),
  row("UP2002", "Vikram Das", "cyber", M(8, 58), 18, M(17, 45)),
  row("UP2003", "Nila Devi", "erp", M(9, 6), 0, M(18, 0)),
  row("UP2004", "Rahul Jain", "testing", M(9, 14), 33, M(18, 15)),
  row("UP2005", "Sara Ali", "data", M(9, 22), 7, M(18, 30)),
  row("UP2006", "Dev Anand", "design", M(9, 30), 0, M(18, 45)),
  row("UP2007", "Kiran Bala", "Legal", M(9, 38), 25, M(19, 0)),
  row("UP2008", "Tara Sen", "Legal", M(9, 46), 0, M(19, 10)),
  row("UP2009", "Omar Khan", "Facilities", M(9, 54), 44, M(19, 20)),
  row("UP2010", "Lena Paul", "Facilities", M(10, 2), 12, M(19, 30)),
  row("UP2011", "Ravi Teja", "testing", M(10, 10), 0, M(19, 40)),
  row("UP2012", "Mira Nair", "it support", M(10, 18), 39, M(19, 50)),
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
      ? e.visitsFoodCourt && e.chairIndex !== null && e.sitMinutes === e.delayMinutes
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
  "every route starts outside the gate and ends at the employee's department",
  employees.every((e) => {
    const first = e.route[0];
    const last = e.route[e.route.length - 1];
    /* They no longer walk home: an employee rides, gets off, and stays at
       their department for the rest of the day, so a route ends there rather
       than back outside the gate. */
    return first.z >= SPAWN_Z && first.z > GATE_Z && last.phase === "WORKING";
  }),
  "spawn beyond the gate line, and the department spot as the last waypoint",
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
    .filter((e) => DEPARTMENTS.some((d) => d.department === e.department))
    .every((e) => e.rideId === rideForDepartment(e.department).rideId),
  "a name the park already knows keeps its ride, untouched by the round-robin",
);

check(
  "unknown departments land round-robin in first-seen order",
  employees.find((e) => e.department === "Legal")!.rideId === RIDE_ORDER[0] &&
    employees.find((e) => e.department === "Facilities")!.rideId === RIDE_ORDER[1],
  `Legal → ${RIDE_ORDER[0]}, Facilities → ${RIDE_ORDER[1]} (never a new destination)`,
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
  "a gate that cannot admit everyone is rejected, not queued into overlap",
  /*
   * Turnstiles are handed out in check-in order to whichever one is free, so
   * the gate fails only when MORE people than there are lanes check in inside
   * one turnstile's dwell. That is what this builds: LANE_COUNT + 1 arrivals
   * on the same minute.
   */
  Array.from({ length: LANE_COUNT + 1 }, (_, i) =>
    row(`LANE${i}`, `Lane ${i}`, "testing", M(9, 0), 0, M(18, 0) + i),
  ),
  /turnstiles are busy/,
);

/*
 * THE FOOD COURT IS NOW THE PARK'S REAL CEILING, and the rides no longer are.
 *
 * This used to be two checks in tension. The court out-seated the whole park —
 * 120 chairs against 50 ride places — because a seat taken on a ride was a seat
 * kept for the rest of the day, so no legal roster could ever fill the court.
 *
 * Riders get off now, which is what lets a park of fifty places carry a working
 * day's whole attendance of ninety-six. There is no lifetime ride ceiling left
 * to trip, so the one resource that can genuinely run out is a chair — and
 * `rosterRepair` trims an oversized upload against exactly that number rather
 * than against the rides. Both halves are asserted here: the guard exists, and
 * the repair keeps any upload the right side of it.
 */
check(
  "the builder still refuses a court it cannot seat",
  /has nowhere to sit/.test(read("src", "simulation", "journey", "journey.ts")),
  "the guard is in journey.ts, and it is the food court's chairs that bound a roster",
);
throws(
  "and a roster with more simultaneous diners than chairs is rejected",
  Array.from({ length: FOOD_COURT_CHAIRS.length + 1 }, (_, i) =>
    /* All delayed by a whole day, so nobody's chair ever comes free. */
    row(`FULL${i}`, `Diner ${i}`, "testing", M(9, 0) + i / 10, 600, M(23, 0)),
  ),
  /nowhere to sit/,
);
/*
 * AND THE PROPERTY THAT USED TO BE READ OFF THE TWO NUMBERS is asserted
 * directly instead. It was written as `parkIntake() < chairs`, which held while
 * the park's simultaneous ride capacity was 50 against 120 chairs. The decks
 * now present every seat their rides can reach — which is what seats an
 * employee the minute they arrive instead of putting them in a line — so the
 * park takes 129 at once and the inequality reads the other way while the thing
 * it protected is unchanged: a roster is bounded by CHAIRS, never by ride
 * seats. So build one bigger than the whole park's intake and require it
 * through, with nobody delayed, so no chair is ever asked for.
 */
{
  const many = Array.from({ length: parkIntake() + 40 }, (_, i) =>
    row(`RIDE${i}`, `Rider ${i}`, "testing", M(9, 0) + i / 6, 0, M(9, 0) + i / 6),
  );
  let built = 0;
  let error = "";
  try {
    built = buildJourney(many).employees.length;
  } catch (e) {
    error = String(e);
  }
  check(
    "the park itself no longer caps a roster — seats come free behind their riders",
    built === many.length,
    error ||
      `${built} on-time employees ride a park that seats ${parkIntake()} at once, ` +
        `cycling a whole day's attendance through it`,
  );
}

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
  /buildJourney\(repaired\.rows\)/.test(storeSrc) &&
    /repairRoster\(parsed\.rows\)/.test(storeSrc) &&
    /activateJourney\(/.test(storeSrc),
  "parse → repair → build → activate, with the throw caught before activation",
);
check(
  "reset returns to the built-in journey through the same swap path",
  /activateJourney\(journeyForDate\(get\(\)\.date\), "builtin"\)/.test(storeSrc),
  "one path in, one path back — to the workbook's own records for the selected date",
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

/* ---------- 6. And the PARK accepts every one of them, repaired ---------- */

/*
 * Section 4 is the builder's contract and it must not soften: a roster whose
 * own arithmetic contradicts itself, or that seats two people in one chair,
 * cannot be drawn honestly and the builder is right to refuse it.
 *
 * But the upload was asked to accept whatever file is handed to it, and a
 * spreadsheet kept by hand breaks those rules constantly and innocently. So
 * `repairRoster()` sits in FRONT of the builder and turns each of those same
 * rosters into one it will take. Reusing section 4's rosters verbatim is the
 * point — anything the builder rejects, the park must still open with.
 */

function accepts(label: string, rows: DatasetRow[]) {
  const repaired = repairRoster(rows);
  let built: ReturnType<typeof buildJourney> | null = null;
  let threw: string | null = null;
  try {
    built = buildJourney(repaired.rows);
  } catch (err) {
    threw = err instanceof Error ? err.message : String(err);
  }
  check(
    label,
    threw === null && built !== null && built.employees.length === repaired.rows.length,
    threw
      ? `still threw: "${threw.slice(0, 80)}"`
      : `${built!.employees.length} employees walk` +
        (repaired.notes.length ? ` — ${repaired.notes.join("; ")}` : " — nothing needed fixing"),
  );
}

accepts("a self-contradicting delay is repaired, not refused", [
  { ...row("BAD1", "Bad Row", "Tech", M(9, 0), 10, M(18, 0)), workStart: M(9, 5) },
]);
accepts("a duplicated employee id is repaired, not refused", [
  row("DUP1", "First", "Tech", M(9, 0), 0, M(18, 0)),
  row("DUP1", "Second", "ERP", M(9, 30), 0, M(18, 30)),
]);
accepts(
  "a gate lane clash is repaired, not refused",
  Array.from({ length: 10 }, (_, i) =>
    row(`LANE${i}`, `Lane ${i}`, "Tech", i === 9 ? M(9, 0) : M(9, 0) + i * 20, 0, M(18, 0) + i),
  ),
);
accepts(
  `${FOOD_COURT_CHAIRS.length + 10} diners for ${FOOD_COURT_CHAIRS.length} chairs is repaired, not refused`,
  Array.from({ length: FOOD_COURT_CHAIRS.length + 10 }, (_, i) =>
    row(`FULL${i}`, `Diner ${i}`, "Tech", M(9, 0) + i, 300, M(20, 0) + i),
  ),
);
accepts(
  `a roster of 400 for a park that seats ${parkIntake()} is repaired, not refused`,
  Array.from({ length: 400 }, (_, i) =>
    row(`BIG${i}`, `Big ${i}`, RIDE_ORDER[i % RIDE_ORDER.length], M(9, 0) + i * 2, (i % 5) * 9, M(18, 0) + i),
  ),
);
accepts(
  "a whole department sent to one ride is repaired, not refused",
  Array.from({ length: 60 }, (_, i) =>
    row(`ITS${i}`, `IT ${i}`, "IT Support", M(9, 0) + i * 2, (i % 4) * 11, M(18, 0) + i),
  ),
);

/*
 * The repair is a repair, not a rewrite. An employee's DELAY is the whole
 * point of the park — it picks their seat colour and decides whether they sit
 * in the food court — so a row that was already consistent must come back with
 * the same delay it went in with, however far its clock had to move to clear a
 * turnstile.
 */
{
  const before = Array.from({ length: 40 }, (_, i) =>
    row(`KEEP${i}`, `Keep ${i}`, "Tech", M(9, 0) + (i % 3), (i % 7) * 6, M(18, 0) + i),
  );
  const after = repairRoster(before);
  const byId = new Map(after.rows.map((r) => [r.id, r]));
  const kept = before.every((r) => byId.get(r.id)?.delayMinutes === r.delayMinutes);
  const forward = before.every((r) => (byId.get(r.id)?.checkIn ?? 0) >= r.checkIn);
  check(
    "every delay survives the repair unchanged, and no clock ever runs backwards",
    kept && forward && after.rows.length === before.length,
    `${after.rows.length} rows kept; ${after.repairs.shiftedArrivals} arrivals moved, all forwards`,
  );
}

/* The upload panel must be able to say what it did. */
{
  const noisy = repairRoster([
    row("SAME", "One", "Tech", M(9, 0), 0, M(18, 0)),
    row("SAME", "Two", "Tech", M(9, 0), 0, M(18, 0)),
  ]);
  check(
    "and what it changed comes back in words the panel can show",
    noisy.notes.length > 0 && noisy.notes.every((n) => typeof n === "string" && n.length > 0),
    noisy.notes.join("; "),
  );
}

/* ---------- 7. The parser takes the file whatever it looks like ---------- */

/*
 * The grid-level parser is exercised directly here rather than through
 * `parseEmployeeFile`, which needs a browser `File`. `rowsFromGrid` is the
 * function every branch of that entry point funnels into, so a grid it reads
 * is a file the park reads.
 */

function reads(label: string, grid: unknown[][], expected: number) {
  const notes: string[] = [];
  const rows = rowsFromGrid(grid, notes);
  let threw: string | null = null;
  try {
    buildJourney(repairRoster(rows).rows);
  } catch (err) {
    threw = err instanceof Error ? err.message : String(err);
  }
  check(
    label,
    rows.length === expected && threw === null,
    `${rows.length}/${expected} rows` + (threw ? `, then threw "${threw.slice(0, 60)}"` : ", and the park opens"),
  );
}

reads(
  "a sheet with the columns named anything at all",
  [
    ["Staff No", "Full Name", "Team", "Swipe In", "Started Work", "Swipe Out"],
    ["A1", "Asha Rao", "Tech", "09:02", "09:02", "17:30"],
    ["A2", "Vikram Das", "Finance", "09:14", "09:41", "18:00"],
  ],
  2,
);
reads(
  "a sheet with no header row at all",
  [
    ["A1", "Asha Rao", "Tech", "09:02", "09:02", "17:30"],
    ["A2", "Vikram Das", "Finance", "09:14", "09:41", "18:00"],
  ],
  2,
);
reads(
  "a sheet with a title and a blank line before the table",
  [
    ["Attendance — March"],
    [],
    ["ID", "Name", "Department", "Check In", "Work Start", "Check Out"],
    ["A1", "Asha Rao", "Tech", "9:02 am", "9:02 am", "5:30 pm"],
    ["A2", "Vikram Das", "Finance", "9:14 am", "9:41 am", "6:00 pm"],
  ],
  2,
);
reads(
  "a sheet with nothing but names and times — no id, no department, no check-out",
  [
    ["Name", "In", "Start"],
    ["Asha Rao", "09:02", "09:02"],
    ["Vikram Das", "09:14", "09:41"],
  ],
  2,
);
reads(
  "a sheet with a delay column instead of a start time",
  [
    ["ID", "Name", "Department", "Check In", "Late By", "Check Out"],
    ["A1", "Asha Rao", "Tech", "09:02", "No Delay", "17:30"],
    ["A2", "Vikram Das", "Finance", "09:14", "27 min", "18:00"],
  ],
  2,
);
check(
  "a delimiter is worked out from the file, not from its name",
  detectDelimiter("a;b;c\n1;2;3\n") === ";" &&
    detectDelimiter("a\tb\tc\n1\t2\t3\n") === "\t" &&
    detectDelimiter("a,b,c\n1,2,3\n") === ",",
  "semicolon, tab and comma files all read",
);
check(
  "quoted commas inside a field do not split it",
  parseCsv('id,name\n"A1","Rao, Asha"\n')[1][1] === "Rao, Asha",
  "the CSV reader is quoting-aware",
);

console.log(
  failures === 0
    ? "\nOK: the upload path verified — any valid roster becomes a lawful park."
    : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
