/**
 * The attendance dataset, row by row and employee by employee.
 *
 * The other journey checks prove the rules hold in aggregate. This one goes to
 * the source: it opens `data/final one.xlsx` itself, reads all 3,219 rows, and
 * asserts that the module the park actually imports says exactly the same thing
 * — every ID, name, department, date, check-in second, work-start second and
 * delay. A transcription slip cannot pass here by agreeing with itself, because
 * the two accounts come from different files.
 *
 * It then walks the animated date's employees one at a time and asks the
 * questions a person watching the park would ask of each figure: is that the
 * right name, did they really come through the gate, did they sit because they
 * were delayed, did they sit for exactly their delay, and did they end up at
 * their own department's ride.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import {
  EMPLOYEE_BY_ID,
  JOURNEY_EMPLOYEES,
  LOOP_END,
  LOOP_START,
  sampleJourney,
} from "../src/simulation/journey/journey";
import {
  ATTENDANCE_DATASET,
  ATTENDANCE_DATES,
  ATTENDANCE_SHEET,
  ATTENDANCE_SOURCE,
  EMPLOYEE_DATASET,
} from "../src/simulation/journey/dataset";
import { rideForDepartment } from "../src/components/park/departments";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import {
  FOOD_COURT_CHAIRS,
  FOOD_COURT_HALF,
  FOOD_COURT_CENTER,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
  foodCourtToWorld,
} from "../src/simulation/journey/constants";
import { formatSimTime } from "../src/simulation/clock";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

/* ---------- The workbook itself, as the independent source ---------- */
/*
 * It lives in the repository beside the app — `data/final one.xlsx` — so that
 * this check has a real spreadsheet to read rather than a copy of the
 * transcription it is supposed to be checking. If it is missing, say so and
 * stop: silently falling back to `dataset.ts` would defeat the whole purpose.
 */
const SHEET = join(__dirname, "..", "data", ATTENDANCE_SOURCE);
if (!existsSync(SHEET)) {
  console.error(`Cannot find the attendance workbook. Looked for:\n  ${SHEET}`);
  process.exit(1);
}
const wb = XLSX.read(readFileSync(SHEET), { type: "buffer" });
const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[ATTENDANCE_SHEET], {
  header: 1,
  blankrows: false,
  defval: "",
});

/** "09:45:30 AM" -> minutes of day, keeping the seconds. */
function readClock(text: string): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i.exec(text.trim());
  if (!m) throw new Error(`Unparseable time in the workbook: "${text}"`);
  const hours = (Number(m[1]) % 12) + (/pm/i.test(m[4]) ? 12 : 0);
  return hours * 60 + Number(m[2]) + Number(m[3]) / 60;
}
/** "6 mins" -> 6. */
function readDelay(text: string): number {
  const m = /^(-?\d+(?:\.\d+)?)\s*mins?$/i.exec(text.trim());
  if (!m) throw new Error(`Unparseable delay in the workbook: "${text}"`);
  return Number(m[1]);
}

interface SheetRow {
  date: string;
  day: string;
  id: string;
  name: string;
  department: string;
  checkIn: number;
  workStart: number;
  delay: number;
}
const SHEET_ROWS: SheetRow[] = grid.slice(1).map((r) => ({
  date: String(r[0]).trim(),
  day: String(r[1]).trim(),
  id: String(r[2]).trim(),
  name: String(r[3]).trim(),
  department: String(r[4]).trim(),
  checkIn: readClock(String(r[5])),
  workStart: readClock(String(r[6])),
  delay: readDelay(String(r[7])),
}));

console.log(
  `Reading ${SHEET_ROWS.length} rows straight from ${ATTENDANCE_SOURCE}, ` +
    `sheet "${ATTENDANCE_SHEET}"\n`,
);

// ============ 1. The workbook is internally consistent ============
check(
  "the workbook holds a real attendance record, not a sample of one",
  SHEET_ROWS.length === 3219 && new Set(SHEET_ROWS.map((r) => r.date)).size === 49,
  `${SHEET_ROWS.length} rows across ${new Set(SHEET_ROWS.map((r) => r.date)).size} dates, ` +
    `${new Set(SHEET_ROWS.map((r) => r.id)).size} distinct employees in ` +
    `${new Set(SHEET_ROWS.map((r) => r.department)).size} departments`,
);
check(
  /*
   * The two time columns and the delay column agree to the MINUTE, which is
   * the relation the sheet actually satisfies: a check-in of 09:45:30 and a
   * work start of 09:52:05 is a gap of 6 min 35 s and the sheet calls it
   * "6 mins". The park keeps both — the printed minutes decide who was delayed,
   * the gap to the second decides how long they wait — so both are asserted.
   */
  "Actual Work Start is Check-in plus Delay Time on every row of the workbook",
  SHEET_ROWS.every((r) => {
    const gap = (((r.workStart - r.checkIn) % 1440) + 1440) % 1440;
    return Math.floor(gap + 1e-9) === r.delay;
  }),
  "the arithmetic the whole visualisation rests on, on all 3,219 rows",
);
check(
  "every employee appears at most once on a date",
  new Set(SHEET_ROWS.map((r) => `${r.date}|${r.id}`)).size === SHEET_ROWS.length,
  "no date double-counts anybody",
);

// ============ 2. The transcription is exact ============
{
  let wrong = "";
  for (let i = 0; i < SHEET_ROWS.length && !wrong; i++) {
    const r = SHEET_ROWS[i];
    const d = ATTENDANCE_DATASET[i];
    if (!d) wrong = `row ${i + 2} missing from the generated module`;
    else if (d.id !== r.id) wrong = `row ${i + 2} id "${d.id}" != "${r.id}"`;
    else if (d.name !== r.name) wrong = `${r.id} name "${d.name}" != "${r.name}"`;
    else if (d.department !== r.department)
      wrong = `${r.id} department "${d.department}" != "${r.department}"`;
    else if (d.date !== r.date) wrong = `${r.id} date "${d.date}" != "${r.date}"`;
    else if (d.day !== r.day) wrong = `${r.id} day "${d.day}" != "${r.day}"`;
    else if (Math.abs(d.checkIn - r.checkIn) > 1e-9) wrong = `${r.id} check-in`;
    else if (d.reportedDelayMinutes !== r.delay)
      wrong = `${r.id} delay ${d.reportedDelayMinutes} != ${r.delay}`;
    else if (Math.abs((d.workStart % 1440) - r.workStart) > 1e-9) wrong = `${r.id} work start`;
  }
  check(
    "every field of every row matches the workbook exactly",
    wrong === "" && ATTENDANCE_DATASET.length === SHEET_ROWS.length,
    wrong || `${SHEET_ROWS.length} rows x 8 fields transcribed without a slip`,
  );
  check(
    "and the row ORDER is the workbook's own",
    ATTENDANCE_DATASET.every((d, i) => d.id === SHEET_ROWS[i].id && d.date === SHEET_ROWS[i].date),
    "no sorting, grouping or de-duplication happened on the way in",
  );
  check(
    "nothing was dropped: every date in the workbook is a date the park can show",
    ATTENDANCE_DATES.length === new Set(SHEET_ROWS.map((r) => r.date)).size &&
      ATTENDANCE_DATES.every((d) => SHEET_ROWS.some((r) => r.date === d)),
    `${ATTENDANCE_DATES.length} dates, ${ATTENDANCE_DATES[0]} to ${ATTENDANCE_DATES[ATTENDANCE_DATES.length - 1]}`,
  );
}

// ============ 3. Per-employee behaviour, for the animated date ============
/*
 * The park animates one DATE at a time — that is what a working morning is —
 * so this walks the whole of that date's roster. The rows come from the
 * workbook, not from the module, so an employee is checked against the
 * spreadsheet even here.
 */
const ANIMATED_DATE = EMPLOYEE_DATASET[0].date!;
const TODAY = SHEET_ROWS.filter((r) => r.date === ANIMATED_DATE);
const problems: string[] = [];
const gateRadius = 55;

for (const r of TODAY) {
  const e = EMPLOYEE_BY_ID[r.id];
  const say = (m: string) => problems.push(`${r.id} ${m}`);
  if (!e) { say("has no journey at all"); continue; }

  /* Identity and destination. */
  if (e.name !== r.name) say("carries the wrong name");
  if (e.department !== r.department) say("carries the wrong department");
  if (e.rideId !== rideForDepartment(r.department).rideId) say("walks to the wrong ride");
  if (e.reportedDelayMinutes !== r.delay) say("carries the wrong delay");
  if (Math.abs((e.workStart % 1440) - r.workStart) > 1e-9) say("carries the wrong work start");
  if (Math.abs(e.checkInTime - r.checkIn) > 1e-9) say("carries the wrong check-in");

  /* Spawned OUTSIDE the gate, never inside the park. */
  const first = e.route[0];
  if (first.z < GATE_Z + 30) say("spawns inside the park instead of outside the gate");
  if (Math.abs(first.z - SPAWN_Z) > 60) say("does not spawn on the arrival road");

  /* Crossed the gate, at the exact check-in second. */
  const atGate = e.route.find((w) => w.phase === "CHECKING_IN");
  if (!atGate) say("never checks in at the gate");
  else {
    if (Math.abs(atGate.arrive - r.checkIn) > 1e-9) say("does not reach the gate at their check-in minute");
    if (Math.hypot(atGate.x - GATE_X, atGate.z - GATE_Z) > gateRadius) say("checks in somewhere other than the gate");
  }
  /* Nobody may skip the gate: the route must cross the gate line inward. */
  const crossed = e.route.some((w, i) => i > 0 && e.route[i - 1].z > GATE_Z && w.z <= GATE_Z);
  if (!crossed) say("never physically crosses the entrance line");

  /* The delay rule, and the sit that follows from it. */
  if (r.delay === 0) {
    if (e.visitsFoodCourt) say("has no delay yet visits the food court");
    if (e.route.some((w) => w.phase === "IN_FOOD_COURT" || w.phase === "TO_FOOD_COURT"))
      say("has no delay yet routes through the court");
    if (e.chairIndex !== null) say("has no delay yet was given a chair");
  } else {
    if (!e.visitsFoodCourt) say("is delayed yet never visits the food court");
    if (e.chairIndex === null) say("is delayed yet was given no chair");
    else {
      /* Actually ON the chair — not hovering at the table, not near it. */
      const seat = foodCourtToWorld(FOOD_COURT_CHAIRS[e.chairIndex].local);
      const sat = e.route.find(
        (w) => w.phase === "IN_FOOD_COURT" && Math.hypot(w.x - seat[0], w.z - seat[1]) < 1e-6,
      );
      if (!sat) say("never actually reaches their own chair");
      else if (sat.depart - sat.arrive < 0.5) say("touches the chair without sitting on it");
      /* The chair is inside the food court, not out on the grass. */
      if (Math.hypot(seat[0] - FOOD_COURT_CENTER[0], seat[1] - FOOD_COURT_CENTER[1]) > FOOD_COURT_HALF)
        say("was given a chair outside the food court");
    }
    /*
     * THE SIT IS THE DELAY, EXACTLY — the wait in the food court equals the
     * Delay Time, which is the one number a viewer can check against the sheet
     * by watching a clock. It used to be the delay LESS the walking; the
     * walking is outside it now, which is why the visit is longer than the sit
     * rather than equal to it.
     */
    if (Math.abs(e.sitMinutes - (r.workStart - r.checkIn + 1440) % 1440) > 1e-9)
      say("does not sit for exactly their own delay");
    if (Math.floor(e.sitMinutes + 1e-9) !== r.delay) say("sits for a different number of minutes than the sheet prints");

    const visit = e.foodCourtExit! - e.foodCourtEntry!;
    if (visit < e.sitMinutes - 1e-6) say("the visit is shorter than the sit inside it");
    if (e.sitStart === null || e.sitEnd === null) say("has no seated window at all");
    else if (e.sitStart < e.foodCourtEntry! || e.sitEnd > e.foodCourtExit! + 1e-6)
      say("sits outside their own visit to the court");
  }

  /* Ends at their own ride, at the right time, and never early. */
  const own = rideById(e.rideId);
  const working = sampleJourney(e, e.workStartActual + 0.5);
  if (!working || !working.working) say("is not working just after their work start");
  else {
    const nearest = PARK_LAYOUT.reduce(
      (best, p) => {
        const d = Math.hypot(working.x - p.center[0], working.z - p.center[1]);
        return d < best.d ? { id: p.id, d } : best;
      },
      { id: "", d: Infinity },
    );
    if (nearest.id !== e.rideId) say(`works at ${nearest.id} instead of ${e.rideId}`);
    const reach = Math.max(own.halfX, own.halfZ);
    if (nearest.d > reach + 60) say("stands too far from their ride to be at it");
  }
  if (e.workStartActual < e.workStart - 1e-9) say("starts work before the sheet says");

  /*
   * And then off the ride again, back to their department's own spot.
   *
   * A seat used to be held for the rest of the day, which capped a ride's whole
   * day at the ten seats its deck reaches. This workbook puts up to ninety-six
   * people through one date, so seats have to come free.
   */
  if (sampleJourney(e, e.rideExit + 0.5)?.onRide !== false) say("never gets off their ride");
  const last = e.route[e.route.length - 1];
  if (last.phase !== "WORKING") say("does not end their day standing at their department");
  if (sampleJourney(e, e.despawnTime + 0.5) !== null) say("is still on screen after the day ends");

  /* The whole thing fits in the simulated day. */
  if (e.spawnTime < LOOP_START || e.despawnTime > LOOP_END) say("falls outside the loop window");
}

check(
  `all ${TODAY.length} employees of ${ANIMATED_DATE} behave exactly as their row says`,
  problems.length === 0,
  problems.length
    ? problems.slice(0, 8).join(" | ")
    : `identity, gate, delay, chair, seat, ride and exit — ${TODAY.length}/${TODAY.length}`,
);

// ============ 4. The story reads at a glance ============
const delayed = JOURNEY_EMPLOYEES.filter((e) => e.reportedDelayMinutes > 0);
const onTime = JOURNEY_EMPLOYEES.filter((e) => e.reportedDelayMinutes === 0);
check(
  "the two behaviours are the two halves of the roster",
  delayed.every((e) => e.visitsFoodCourt) &&
    onTime.every((e) => !e.visitsFoodCourt) &&
    delayed.length + onTime.length === TODAY.length,
  `${delayed.length} sit out a delay, ${onTime.length} walk straight to work`,
);
check(
  "check-in is visibly NOT work start for the delayed",
  delayed.every((e) => e.workStartActual - e.checkInTime >= e.delayMinutes - 1e-6),
  `delayed employees spend ${Math.min(...delayed.map((e) => e.reportedDelayMinutes))}–` +
    `${Math.max(...delayed.map((e) => e.reportedDelayMinutes))} min between checking in and starting`,
);
check(
  "the on-time half never waits anywhere on the way",
  onTime.every((e) =>
    e.route.every((w) => w.phase !== "IN_FOOD_COURT" && (w.phase !== "AT_RIDE" || w.depart - w.arrive < 0.3)),
  ),
  "no invented pauses between the gate and their ride",
);

/* ---------- Summary ---------- */
console.log(`\nEvery employee of ${ANIMATED_DATE}, as animated:`);
console.log("  id       name                        department   check-in  delay   sit     ride            work");
for (const e of JOURNEY_EMPLOYEES) {
  console.log(
    `  ${e.id} ${e.name.padEnd(27)} ${e.department.padEnd(12)} ${formatSimTime(e.checkInTime).padStart(8)}  ` +
      `${(e.reportedDelayMinutes ? `${e.reportedDelayMinutes}m` : "none").padStart(6)}  ` +
      `${(e.sitMinutes ? e.sitMinutes.toFixed(1) : "-").padStart(6)}  ` +
      `${e.rideName.padEnd(15)} ${formatSimTime(e.workStartActual).padStart(8)}`,
  );
}
console.log(
  `\nDay runs ${formatSimTime(LOOP_START)} to ${formatSimTime(LOOP_END)} ` +
    `(${(LOOP_END - LOOP_START).toFixed(0)} simulated minutes, ` +
    `${((LOOP_END - LOOP_START) / 60).toFixed(1)} min of real time at 60x).`,
);

console.log(
  failures === 0
    ? `\nOK: ${SHEET_ROWS.length} workbook rows verified, and all ${TODAY.length} employees of ${ANIMATED_DATE} animated from them.`
    : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
