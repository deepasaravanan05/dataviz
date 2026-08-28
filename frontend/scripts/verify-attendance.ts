/**
 * The attendance dataset, employee by employee.
 *
 * The other journey checks prove the rules hold in aggregate. This one walks
 * all thirty rows individually and asks the questions a person watching the
 * park would ask of each figure: is that the right name, did they really come
 * through the gate, did they sit because they were delayed, did they sit for
 * as long as their delay, and did they end up at their own department's ride.
 *
 * The expected values are read straight out of the source spreadsheet rather
 * than from `dataset.ts`, so a transcription slip cannot pass by agreeing with
 * itself.
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
import { EMPLOYEE_DATASET, parseClockTime } from "../src/simulation/journey/dataset";
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

/* ---------- The spreadsheet itself, as the independent source ---------- */
/*
 * The workbook lives outside the app, so its exact location depends on how the
 * project was checked out. Look for it in the places it is actually kept
 * rather than assuming one, and say plainly where it was expected if it has
 * gone missing — this script is worthless without the real sheet, so silently
 * falling back to the transcription would defeat its whole purpose.
 */
const SHEET_CANDIDATES = [
  join(__dirname, "..", "..", "attendance_data.xlsx"),
  join(__dirname, "..", "..", "..", "attendance_data.xlsx"),
  join(__dirname, "..", "attendance_data.xlsx"),
];
const SHEET = SHEET_CANDIDATES.find((p) => existsSync(p));
if (!SHEET) {
  console.error(
    "Cannot find attendance_data.xlsx. Looked in:\n  " + SHEET_CANDIDATES.join("\n  "),
  );
  process.exit(1);
}
const wb = XLSX.read(readFileSync(SHEET), { type: "buffer" });
const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets["30 Employees"], {
  header: 1,
  blankrows: false,
  defval: "",
});
interface SheetRow {
  id: string; name: string; department: string;
  checkIn: number; delay: number; workStart: number; checkOut: number;
}
const SHEET_ROWS: SheetRow[] = grid.slice(1).map((r) => ({
  id: String(r[0]).trim(),
  name: String(r[1]).trim(),
  department: String(r[2]).trim(),
  checkIn: parseClockTime(String(r[3]).trim()),
  delay: String(r[4]).trim() === "No Delay" ? 0 : Number(/^(\d+) min$/.exec(String(r[4]).trim())![1]),
  workStart: parseClockTime(String(r[5]).trim()),
  checkOut: parseClockTime(String(r[6]).trim()),
}));

console.log(`Reading ${SHEET_ROWS.length} rows straight from attendance_data.xlsx\n`);

// ============ 1. The sheet is internally consistent ============
check(
  "the spreadsheet has exactly 30 employees in 6 departments of 5",
  SHEET_ROWS.length === 30 &&
    new Set(SHEET_ROWS.map((r) => r.department)).size === 6 &&
    [...new Set(SHEET_ROWS.map((r) => r.department))].every(
      (d) => SHEET_ROWS.filter((r) => r.department === d).length === 5,
    ),
  [...new Set(SHEET_ROWS.map((r) => r.department))].join(", "),
);
check(
  "work start is check-in plus delay on every row of the sheet",
  SHEET_ROWS.every((r) => r.workStart === r.checkIn + r.delay),
  "the arithmetic the whole visualisation rests on",
);
check(
  "check-out is after work start on every row",
  SHEET_ROWS.every((r) => r.checkOut > r.workStart),
  `check-outs run ${formatSimTime(Math.min(...SHEET_ROWS.map((r) => r.checkOut)))}–` +
    `${formatSimTime(Math.max(...SHEET_ROWS.map((r) => r.checkOut)))}`,
);

// ============ 2. The transcription is exact ============
{
  let wrong = "";
  for (const r of SHEET_ROWS) {
    const d = EMPLOYEE_DATASET.find((x) => x.id === r.id);
    if (!d) { wrong = `${r.id} missing from dataset.ts`; break; }
    if (d.name !== r.name) wrong = `${r.id} name "${d.name}" != "${r.name}"`;
    else if (d.department !== r.department) wrong = `${r.id} department "${d.department}" != "${r.department}"`;
    else if (d.checkIn !== r.checkIn) wrong = `${r.id} check-in`;
    else if (d.delayMinutes !== r.delay) wrong = `${r.id} delay ${d.delayMinutes} != ${r.delay}`;
    else if (d.workStart !== r.workStart) wrong = `${r.id} work start`;
    else if (d.checkOut !== r.checkOut) wrong = `${r.id} check-out`;
    if (wrong) break;
  }
  check(
    "every field of every row matches the spreadsheet exactly",
    wrong === "" && EMPLOYEE_DATASET.length === SHEET_ROWS.length,
    wrong || `${SHEET_ROWS.length} rows x 7 fields transcribed without a slip`,
  );
}

// ============ 3. Per-employee behaviour, all thirty ============
const problems: string[] = [];
const gateRadius = 55;

for (const r of SHEET_ROWS) {
  const e = EMPLOYEE_BY_ID[r.id];
  const say = (m: string) => problems.push(`${r.id} ${m}`);
  if (!e) { say("has no journey at all"); continue; }

  /* Identity and destination. */
  if (e.name !== r.name) say("carries the wrong name");
  if (e.department !== r.department) say("carries the wrong department");
  if (e.rideId !== rideForDepartment(r.department).rideId) say("walks to the wrong ride");
  if (e.delayMinutes !== r.delay) say("carries the wrong delay");
  if (e.workStart !== r.workStart) say("carries the wrong work start");
  if (e.checkOut !== r.checkOut) say("carries the wrong check-out");

  /* Spawned OUTSIDE the gate, never inside the park. */
  const first = e.route[0];
  if (first.z < GATE_Z + 30) say("spawns inside the park instead of outside the gate");
  if (Math.abs(first.z - SPAWN_Z) > 60) say("does not spawn on the arrival road");

  /* Crossed the gate, at the exact check-in minute. */
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
    /* The sit is the delay, less walking — and never longer than the delay. */
    if (e.sitMinutes >= r.delay) say("sits for longer than their whole delay");
    if (e.sitMinutes < 1) say("sits for less than a visible minute");
    const visit = e.foodCourtExit! - e.foodCourtEntry!;
    if (Math.abs(visit - e.sitMinutes) > 0.05) say("visit length and sit length disagree");
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
  if (e.workStartActual < r.workStart - 1e-9) say("starts work before the sheet says");

  /* And stays in the seat: no climb down, no walk home. */
  if (sampleJourney(e, r.checkOut + 0.5)?.onRide !== true) say("does not stay on their ride at check-out");
  const last = e.route[e.route.length - 1];
  if (last.phase !== "SITTING_ON_RIDE") say("has a waypoint after the seat they sat down in");
  if (sampleJourney(e, e.despawnTime + 0.5) !== null) say("is still on screen after going home");

  /* The whole thing fits in the simulated day. */
  if (e.spawnTime < LOOP_START || e.despawnTime > LOOP_END) say("falls outside the loop window");
}

check(
  "all thirty employees behave exactly as their row says",
  problems.length === 0,
  problems.length ? problems.slice(0, 8).join(" | ") : "identity, gate, delay, seat, ride, check-out — 30/30",
);

// ============ 4. The story reads at a glance ============
const delayed = JOURNEY_EMPLOYEES.filter((e) => e.delayMinutes > 0);
const onTime = JOURNEY_EMPLOYEES.filter((e) => e.delayMinutes === 0);
check(
  "the two behaviours are the two halves of the roster",
  delayed.every((e) => e.visitsFoodCourt) &&
    onTime.every((e) => !e.visitsFoodCourt) &&
    delayed.length + onTime.length === 30,
  `${delayed.length} sit out a delay, ${onTime.length} walk straight to work`,
);
check(
  "check-in is visibly NOT work start for the delayed",
  delayed.every((e) => e.workStartActual - e.checkInTime >= e.delayMinutes - 1e-6),
  `delayed employees spend ${Math.min(...delayed.map((e) => e.delayMinutes))}–` +
    `${Math.max(...delayed.map((e) => e.delayMinutes))} min between checking in and starting`,
);
check(
  "the on-time half never waits anywhere on the way",
  onTime.every((e) => e.route.every((w) => w.phase !== "IN_FOOD_COURT" && (w.phase !== "AT_RIDE" || w.depart - w.arrive < 0.3))),
  "no invented pauses between the gate and their ride",
);

/* ---------- Summary ---------- */
console.log("\nEvery employee, as animated:");
console.log("  id       name              department        check-in  delay   sit    ride            work      out");
for (const e of JOURNEY_EMPLOYEES) {
  console.log(
    `  ${e.id} ${e.name.padEnd(17)} ${e.department.padEnd(17)} ${formatSimTime(e.checkInTime).padStart(8)}  ` +
      `${(e.delayMinutes ? `${e.delayMinutes}m` : "none").padStart(5)}  ${(e.sitMinutes ? e.sitMinutes.toFixed(1) : "-").padStart(5)}  ` +
      `${e.rideName.padEnd(15)} ${formatSimTime(e.workStartActual).padStart(8)}  ${formatSimTime(e.checkOut).padStart(8)}`,
  );
}
console.log(
  `\nDay runs ${formatSimTime(LOOP_START)} to ${formatSimTime(LOOP_END)} ` +
    `(${(LOOP_END - LOOP_START).toFixed(0)} simulated minutes, ${((LOOP_END - LOOP_START) / 60).toFixed(1)} min of real time at 60x).`,
);

console.log(failures === 0 ? "\nOK: all 30 employees verified against the spreadsheet." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
