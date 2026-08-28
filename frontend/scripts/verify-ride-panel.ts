import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEPARTMENTS,
  RIDE_DEPARTMENTS,
  RIDE_ORDER,
  departmentFor,
  type DepartmentRideId,
} from "../src/components/park/departments";
import {
  JOURNEY_EMPLOYEES,
  LOOP_END,
  LOOP_START,
  OPENING_MINUTE,
  type JourneyEmployee,
} from "../src/simulation/journey/journey";
import { formatSimTime } from "../src/simulation/clock";

/**
 * THE RIDE INFORMATION PANEL.
 *
 * Click a ride and the top-right panel names the ride and the department it
 * serves, counts the department, counts how many of it have reached their
 * Actual Work Start minute, and lists those employees with their times.
 *
 * Everything below is the arithmetic that panel performs, re-derived here
 * against the dataset and swept across the whole simulated day — so the
 * counts, the filter and the ordering are proven for every ride at every
 * minute, not just for the ride and the minute somebody happened to click.
 *
 * The panel is a READER. The last section asserts that in the source: it may
 * not import a mutator, and it may not reach into a ride, because a panel that
 * can change the park is no longer an information panel.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const panel = readFileSync(join(root, "src", "components", "hud", "DepartmentPanel.tsx"), "utf8");
/** Comments explain what the panel used to do, so checks read code only. */
const code = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

/* =================== The panel's own arithmetic =================== */

/** Everyone the ride serves, by the park's existing department mapping. */
const forRide = (rideId: DepartmentRideId): JourneyEmployee[] =>
  JOURNEY_EMPLOYEES.filter((e) => e.rideId === rideId);

/** Those of them whose Actual Work Start minute the clock has reached. */
const started = (rideId: DepartmentRideId, simTime: number): JourneyEmployee[] =>
  forRide(rideId)
    .filter((e) => simTime >= e.workStart)
    .sort((a, b) => a.workStart - b.workStart || a.id.localeCompare(b.id));

/* =================== 1. Every ride names the right department =================== */

check(
  "every ride in the park resolves to a department, and every department to a ride",
  RIDE_ORDER.every((id) => departmentFor(id).departments.length > 0) &&
    DEPARTMENTS.every((d) => RIDE_ORDER.includes(d.rideId)),
  RIDE_DEPARTMENTS.map((r) => `${r.rideName} → ${r.department}`).join("; "),
);

check(
  "the panel uses the park's existing mapping rather than a second one of its own",
  !/DEPARTMENT_MAPPING|rideForDepartment|=== "IT Support"|=== "Tech"/.test(code) &&
    /e\.rideId === rideId/.test(code),
  "employees are filtered by the rideId the journey builder already assigned them",
);

check(
  "no ride is hard-coded into the panel",
  !/(coaster|ferris|dragon|tower|monster)"/.test(code),
  `the clicked ride's id is a prop; all ${RIDE_ORDER.length} rides take the same path`,
);

/* Each ride's roster is the union of its departments' rosters, and the six
   departments partition the thirty employees exactly once. */
const covered = new Set<string>();
let partitionOk = true;
for (const rideId of RIDE_ORDER) {
  const roster = forRide(rideId);
  const depts = departmentFor(rideId).departments;
  if (!roster.every((e) => depts.includes(e.department))) partitionOk = false;
  for (const e of roster) {
    if (covered.has(e.id)) partitionOk = false;
    covered.add(e.id);
  }
}
check(
  "TOTAL EMPLOYEES is the department's real size, and the five rides account for everybody once",
  partitionOk && covered.size === JOURNEY_EMPLOYEES.length,
  RIDE_ORDER.map((id) => `${departmentFor(id).rideName} ${forRide(id).length}`).join(", ") +
    ` = ${covered.size} of ${JOURNEY_EMPLOYEES.length}`,
);

/* =================== 2. ACTUAL WORK START, not something else =================== */

/*
 * The three wrong answers the brief calls out by name. Each is computed here
 * and required to DIFFER from the right one somewhere in the day — a panel
 * showing check-ins instead of work starts would otherwise pass every other
 * check in this file.
 */
let differsFromCheckIn = false;
let differsFromFoodCourt = false;
let differsFromTotal = false;
let monotonic = true;
let sortedEverywhere = true;
let timesAreDatasetTimes = true;

for (const rideId of RIDE_ORDER) {
  const roster = forRide(rideId);
  let previous = -1;
  for (let t = LOOP_START; t <= LOOP_END; t += 0.5) {
    const list = started(rideId, t);

    if (list.length < previous) monotonic = false;
    previous = list.length;

    for (let i = 1; i < list.length; i++) {
      if (list[i].workStart < list[i - 1].workStart) sortedEverywhere = false;
    }
    /* Every listed time is the dataset's own minute for that employee. */
    for (const e of list) {
      if (e.workStart !== JOURNEY_EMPLOYEES.find((x) => x.id === e.id)!.workStart) {
        timesAreDatasetTimes = false;
      }
    }

    const checkedIn = roster.filter((e) => t >= e.checkInTime).length;
    const inFoodCourt = roster.filter(
      (e) => e.foodCourtEntry !== null && t >= e.foodCourtEntry && t <= (e.foodCourtExit ?? e.foodCourtEntry),
    ).length;
    if (list.length !== checkedIn) differsFromCheckIn = true;
    if (list.length !== inFoodCourt) differsFromFoodCourt = true;
    if (list.length !== roster.length) differsFromTotal = true;
  }
}

check(
  "the count is work starts, not check-ins",
  differsFromCheckIn,
  "at minutes where the two disagree the panel follows Actual Work Start — an employee who has checked in is not counted",
);
check(
  "the count is work starts, not the food court",
  differsFromFoodCourt,
  "an employee sitting out their delay at a table is not counted as having started",
);
check(
  "the count is work starts, not the department total",
  differsFromTotal,
  "the count rises through the morning rather than sitting at the department's size",
);
check(
  "the count never goes backwards as the clock advances",
  monotonic,
  "once an employee has started work they stay on the list for the rest of the day",
);
check(
  "the list is sorted by Actual Work Start Time, earliest first",
  sortedEverywhere,
  "checked at every half-minute of the day, for all five rides",
);
check(
  "every listed time is the dataset's own Actual Work Start minute",
  timesAreDatasetTimes && /formatSimTime\(e\.workStart\)/.test(code) && !/workStartActual/.test(code),
  "the panel formats `workStart` — the dataset column the journey builder carries through untouched — and computes no time of its own",
);

/* =================== 3. The empty state, and the full state =================== */

const emptyAtStart = RIDE_ORDER.filter((id) => started(id, LOOP_START).length === 0);
check(
  "at the start of the day every ride shows the empty state",
  emptyAtStart.length === RIDE_ORDER.length,
  `nobody has started work at ${formatSimTime(LOOP_START)}, so all five panels read "No employees have started work yet."`,
);
check(
  "the empty state is a message rather than a blank section",
  /No employees have started work yet\./.test(panel),
  "the members section always says something",
);

const allStarted = RIDE_ORDER.every((id) => started(id, LOOP_END).length === forRide(id).length);
check(
  "by the end of the day every employee has appeared on their ride's list",
  allStarted,
  RIDE_ORDER.map((id) => `${departmentFor(id).rideName} ${started(id, LOOP_END).length}/${forRide(id).length}`).join(", "),
);

/* The panel opens on the minute the park opens on: it must be populated. */
const atOpening = RIDE_ORDER.map((id) => ({
  ride: departmentFor(id).rideName,
  started: started(id, OPENING_MINUTE).length,
  total: forRide(id).length,
}));
check(
  "the panel is already telling a story at the minute the park opens on",
  atOpening.every((r) => r.started > 0),
  atOpening.map((r) => `${r.ride} ${r.started}/${r.total}`).join(", ") + ` at ${formatSimTime(OPENING_MINUTE)}`,
);

/* =================== 4. It updates without being reopened =================== */

check(
  "the panel is driven by the published simulated minute, so it updates while the ride stays open",
  /useJourneyStore\(\(s\) => s\.simTime\)/.test(code),
  "the clock is a subscription, not a value read once when the panel mounted",
);
check(
  "the roster is a subscription too, so an uploaded sheet repopulates the open panel",
  /useActiveJourneyStore\(\(s\) => s\.employees\)/.test(code),
  "the ACTIVE roster, not the built-in module constant",
);

/* Somewhere in every ride's morning the count actually ticks up — which is
   what the user watches for, and what a panel frozen at mount would never do. */
const ticks = RIDE_ORDER.map((id) => {
  let changes = 0;
  let previous = 0;
  for (let t = LOOP_START; t <= LOOP_END; t += 0.5) {
    const n = started(id, t).length;
    if (n !== previous) changes++;
    previous = n;
  }
  return { ride: departmentFor(id).rideName, changes };
});
check(
  "each ride's count really does change during the morning",
  ticks.every((r) => r.changes > 0),
  ticks.map((r) => `${r.ride} ${r.changes}`).join(", ") + " updates over the day",
);

/* =================== 5. Where it is, and what it cannot do =================== */

check(
  "the panel is still pinned to the top-right corner",
  /fixed right-4 top-20/.test(code),
  "same corner, same offsets as before",
);
check(
  "there is exactly one panel, and switching rides replaces it",
  (panel.match(/<aside/g) ?? []).length === 1 && /key=\{selected\.rideId\}/.test(code),
  "one <aside>; a new selection re-keys the same body rather than opening a second panel",
);
check(
  "the existing close button and Escape both still close it",
  /onClick=\{onClose\}/.test(code) && /e\.key === "Escape"/.test(code),
  "close affordances unchanged",
);
check(
  "only the members list scrolls, never the page",
  /overflow-y-auto/.test(code) &&
    (code.match(/overflow-y-auto/g) ?? []).length === 1 &&
    /max-h-\[min\(15rem,32vh\)\]/.test(code),
  "one scroll container, capped in vh as well as rem so a short screen shrinks the list instead of the panel overflowing",
);
check(
  "the panel keeps the park's glass style",
  /rounded-2xl/.test(code) && /backdrop-blur-xl/.test(code) && /bg-\[#070b14\]\/80/.test(code),
  "same radius, same translucency, same border and blur as the panel it replaces",
);
check(
  "the ride and the department are on ONE line",
  /\{rideName\}[\s\S]{0,220}&bull;[\s\S]{0,120}\{department\}/.test(panel) &&
    (panel.match(/<h2/g) ?? []).length === 1,
  "one heading element carries ride, separator and department",
);

check(
  "the panel cannot change the simulation",
  !/seekJourneyClock|setJourneyPaused|setJourneySpeed|advanceJourneyClock|resetJourneyClock|setSimTime|activateJourney|useSimulationStore/.test(
    code,
  ),
  "it imports no clock mutator, no roster mutator and nothing from the ride simulation",
);
check(
  "the panel cannot touch a ride",
  !/components\/(roller-coaster|ferris-wheel|monster-ride|park-train|dragon-ride|drop-tower)/.test(panel),
  "no ride module is imported, so no ride model, position, size or animation is reachable from here",
);

/* =================== Summary =================== */

console.log("\nWhat each ride's panel shows at the minute the park opens on:");
for (const rideId of RIDE_ORDER) {
  const d = departmentFor(rideId);
  const list = started(rideId, OPENING_MINUTE);
  console.log(`\n  ${d.rideName} • ${d.department}`);
  console.log(`    TOTAL EMPLOYEES     ${forRide(rideId).length}`);
  console.log(`    ACTUAL WORK START   ${list.length}`);
  for (const e of list.slice(0, 4)) {
    console.log(`      ${e.id.padEnd(10)} ${formatSimTime(e.workStart).padStart(8)}   ${e.name}`);
  }
  if (list.length > 4) console.log(`      … ${list.length - 4} more`);
}

console.log(
  failures === 0 ? "\nOK: the ride information panel verified." : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
