import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEPARTMENTS, RIDE_DEPARTMENTS } from "../src/components/park/departments";
import {
  CAMERA_PLACES,
  UNREACHABLE_RIDES,
  type CameraPlace,
} from "../src/components/world/cameraPlaces";
import { EMPLOYEE_DATASET } from "../src/simulation/journey/dataset";
import { JOURNEY_EMPLOYEES, LOOP_END, LOOP_START } from "../src/simulation/journey/journey";
import { departmentOverview, overviewTotals } from "../src/simulation/journey/overview";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const page = readFileSync(join(root, "src", "app", "dashboard", "page.tsx"), "utf8");
/*
 * The overview table and the calendar now live in shared components so the
 * Main Entrance can render the same dashboard over the 3D park. The checks
 * below are about the dashboard UI as a whole, so they read every file that
 * draws it rather than the page alone.
 */
const overviewCmp = readFileSync(
  join(root, "src", "components", "dashboard", "DepartmentOverview.tsx"),
  "utf8",
);
const calendarCmp = readFileSync(
  join(root, "src", "components", "dashboard", "CalendarCard.tsx"),
  "utf8",
);
const entranceCmp = readFileSync(
  join(root, "src", "components", "entrance", "EntranceDashboard.tsx"),
  "utf8",
);
const dashboardUi = [page, overviewCmp, calendarCmp, entranceCmp].join("\n");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

// ============ 1. The rows are the dataset's departments, in its order ============
const start = departmentOverview(LOOP_START);
check(
  "one row per dataset department, in dataset order",
  start.length === DEPARTMENTS.length &&
    start.every((r, i) => r.department === DEPARTMENTS[i].department),
  start.map((r) => r.department).join(", "),
);
check(
  "department sizes come from the real roster and sum to the whole roster",
  start.reduce((s, r) => s + r.size, 0) === EMPLOYEE_DATASET.length &&
    start.every(
      (r) => r.size === EMPLOYEE_DATASET.filter((e) => e.department === r.department).length,
    ),
  start.map((r) => `${r.department} ${r.size}`).join(", "),
);

// ============ 2. The counts follow the clock, from empty to complete ============
check(
  "before the first arrival every count is zero",
  start.every((r) => r.checkedIn === 0 && r.delayed === 0 && r.started === 0),
  "the morning starts empty",
);
const end = departmentOverview(LOOP_END);
check(
  "after the last work start everyone has checked in AND started — delayed drains to zero",
  end.every((r) => r.checkedIn === r.size && r.started === r.size && r.delayed === 0),
  end.map((r) => `${r.department} ${r.started}/${r.size}`).join(", "),
);

{
  let broken = 0;
  let nonMonotonic = 0;
  let prev = start;
  for (let t = LOOP_START; t <= LOOP_END + 1; t += 0.5) {
    const rows = departmentOverview(t);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // The invariant the whole table hangs on: delayed is exactly the gap.
      if (r.delayed !== r.checkedIn - r.started || r.started > r.checkedIn) broken++;
      if (r.checkedIn < prev[i].checkedIn || r.started < prev[i].started) nonMonotonic++;
    }
    prev = rows;
  }
  check(
    "at every instant, delayed = checked-in − started",
    broken === 0,
    "the three columns can never disagree",
  );
  check(
    "check-in and work-start counts only ever rise as the clock runs",
    nonMonotonic === 0,
    "no count ever goes backwards mid-morning",
  );
}

// Spot instants against the raw dataset, independently recounted.
for (const t of [9 * 60 + 30, 10 * 60, 10 * 60 + 30]) {
  const rows = departmentOverview(t);
  const okAll = rows.every((r) => {
    const staff = EMPLOYEE_DATASET.filter((e) => e.department === r.department);
    return (
      r.checkedIn === staff.filter((e) => e.checkIn <= t).length &&
      r.started === staff.filter((e) => e.workStart <= t).length
    );
  });
  check(
    `counts at ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")} match an independent recount of the dataset`,
    okAll,
    "every cell re-derived from the raw rows",
  );
}

// ============ 3. Totals and averages ============
{
  const t = 10 * 60;
  const rows = departmentOverview(t);
  const totals = overviewTotals(rows);
  check(
    "the TOTAL row is the exact column sums",
    totals.checkedIn === rows.reduce((s, r) => s + r.checkedIn, 0) &&
      totals.delayed === rows.reduce((s, r) => s + r.delayed, 0) &&
      totals.started === rows.reduce((s, r) => s + r.started, 0) &&
      totals.size === EMPLOYEE_DATASET.length,
    `at 10:00 — ${totals.checkedIn} in, ${totals.delayed} delayed, ${totals.started} started`,
  );
  const avgOk = rows.every((r) => {
    const staff = JOURNEY_EMPLOYEES.filter((e) => e.department === r.department);
    const avg = staff.reduce((s, e) => s + e.delayMinutes, 0) / staff.length;
    return Math.abs(avg - r.avgDelay) < 1e-9;
  });
  check("per-department average delay matches an independent recompute", avgOk, "to the minute");
}

// ============ 4. The dashboard UI renders the real module, chart-free ============
check(
  "the dashboard reads departmentOverview — it never re-derives its own counts",
  /departmentOverview/.test(dashboardUi) && /overviewTotals/.test(dashboardUi),
  "one source of numbers for park, dashboard and entrance alike",
);
check(
  "no chart library and no chart markup — the table IS the visualization",
  // Package names are matched as imports, not substrings — "#34d399" is a
  // colour, not a d3 dependency.
  !/from ["'](d3|recharts|chart\.js|plotly)/i.test(code(dashboardUi)) &&
    !/<(BarChart|PieChart|LineChart|Doughnut)/i.test(code(dashboardUi)),
  "standing instruction: no charts",
);
check(
  "the dashboard adds no 3D of its own",
  !/@react-three|three|<Canvas/.test(code(dashboardUi)),
  "a plain HTML page beside the park",
);
check(
  "the concept image's fabricated departments do not appear",
  !/Human Resources|Marketing|Sales|Customer Support|Quality Assurance|Procurement/.test(dashboardUi),
  "only the dataset's six departments are shown",
);

// ============ 5. The dashboard is embedded in the Main Entrance ============
check(
  "the Main Entrance renders the SAME overview table and calendar components",
  /DepartmentOverview/.test(entranceCmp) && /CalendarCard/.test(entranceCmp),
  "reused, not reimplemented",
);
check(
  "the Main Entrance omits the Morning Summary",
  !/Morning summary/i.test(entranceCmp) &&
    !/AVERAGE_DELAY|WORST_DELAY|DELAY_BY_BAND/.test(entranceCmp),
  "no average-delay / longest-wait / arrivals cards at the entrance",
);
check(
  "the entrance overlay reads the clock but never winds it",
  // Comments are stripped: the overlay documents WHY it must not wind the clock.
  /useJourneyStore/.test(code(entranceCmp)) && !/advanceJourneyClock/.test(code(entranceCmp)),
  "the park's JourneyClock is the only driver — a second one would double the speed",
);
{
  const entrancePage = readFileSync(join(root, "src", "app", "entrance", "page.tsx"), "utf8");
  check(
    "the old entrance delay charts are gone, the dashboard is in their place",
    !/JourneyHud/.test(entrancePage) && /EntranceDashboard/.test(entrancePage),
    "charts removed, no empty space left behind",
  );
  /* ---- The top navigation bar ---- */
  {
    /* Rebuilt the way PlaceNav renders it: park, then facility, then department. */
    const groups: CameraPlace["group"][] = ["park", "facility", "department"];
    const nav = groups.flatMap((g) =>
      CAMERA_PLACES.filter((p) => p.group === g).map((p) =>
        g === "department" ? p.label.split(" — ")[0] : p.label,
      ),
    );
    const expected = [
      "Full overview",
      "Mid park",
      "Ground level",
      "Main entrance",
      "Food court",
      "Tech",
      "Cyber Security",
      "IT Support · UI/UX",
      "ERP",
      "Data Engineering",
    ];
    check(
      "the navigation reads in the exact requested order",
      nav.length === expected.length && nav.every((n, i) => n === expected[i]),
      nav.join(" | "),
    );
    check(
      "Central plaza is gone and Data Engineering is last",
      !nav.includes("Central plaza") && nav[nav.length - 1] === "Data Engineering",
      "one chip removed, one moved to the end",
    );
    check(
      "reordering the chips did not reorder the park itself",
      RIDE_DEPARTMENTS.map((d) => d.rideId).join(",") === "coaster,dragon,ferris,tower,monster",
      "RIDE_ORDER untouched — paving, panel and dashboard unaffected",
    );
    check(
      "every ride is still reachable after the reorder",
      UNREACHABLE_RIDES.length === 0,
      "no attraction dropped out of fast travel",
    );
  }

  /* ---- The collapsible left column ---- */
  {
    const shell = readFileSync(
      join(root, "src", "components", "entrance", "EntranceDashboard.tsx"),
      "utf8",
    );
    check(
      "both left-hand panels are hidden by default",
      /useState\(false\)[\s\S]*useState\(false\)/.test(shell) &&
        !/useState\(true\)/.test(shell),
      "calendar and department overview both start closed",
    );
    check(
      "the two panels toggle independently",
      /setCalendarOpen\(\(v\) => !v\)/.test(shell) &&
        /setDepartmentsOpen\(\(v\) => !v\)/.test(shell) &&
        (shell.match(/useState\(false\)/g) ?? []).length === 2,
      "a piece of state each — one can never close the other",
    );
    check(
      "the buttons are named and iconned as asked",
      /label="Calendar"/.test(shell) &&
        /label="Department-wise Count"/.test(shell) &&
        /CalendarIcon/.test(shell) &&
        /DepartmentIcon/.test(shell),
      "Calendar and Department-wise Count, each with its own icon",
    );
    check(
      "the calendar keeps its July 2026 opening month and month navigation",
      /OPENING_YEAR = 2026/.test(shell) &&
        /OPENING_MONTH = 6/.test(shell) &&
        /navigable/.test(shell),
      "same CalendarCard props as before — nothing redesigned",
    );
    check(
      "the department overview is the existing component, still fed the live clock",
      /<DepartmentOverview simTime={simTime} compact \/>/.test(shell),
      "counts and calculations untouched",
    );
    check(
      "the column stays on the left and never grows over the park",
      /absolute inset-y-0 left-0/.test(shell) && /w-\[21rem\]/.test(shell),
      "same left column width the panels always had",
    );
  }

  /*
   * The two navigation links have been replaced by the employee-data upload.
   * They are no longer a loss: PlaceNav already reaches every part of the park
   * from the top bar, so the corner was carrying a duplicate route.
   */
  check(
    "the Main Entrance's Full Park and Theme Park links are gone",
    !/href="\/roller-coaster"/.test(entrancePage) && !/href="\/"/.test(entrancePage),
    "both links removed from the top-right corner",
  );
  check(
    "one upload control stands in their place",
    /import \{ EmployeeDataUpload \}/.test(entrancePage) &&
      (entrancePage.match(/<EmployeeDataUpload\s*\/>/g) ?? []).length === 1,
    "imported and rendered exactly once — a single control, not one per format",
  );
  {
    const upload = readFileSync(
      join(root, "src", "components", "entrance", "EmployeeDataUpload.tsx"),
      "utf8",
    );
    check(
      "the upload is a single input accepting Excel and CSV together",
      (upload.match(/type="file"/g) ?? []).length === 1 &&
        (upload.match(/<button/g) ?? []).length === 1,
      "one file input, one button",
    );
    check(
      "the upload sits top-right and cannot cover the park or the left column",
      /absolute right-4 top-16/.test(upload) && /w-\[15\.5rem\]/.test(upload),
      "same corner the links used, capped narrow",
    );
    check(
      "the upload states a loading step and reports the filename back",
      /status === "loading"|const loading/.test(upload) && /fileName/.test(upload),
      "loading state and filename readout present",
    );
  }
  {
    const parser = readFileSync(
      join(root, "src", "simulation", "journey", "employeeUpload.ts"),
      "utf8",
    );
    check(
      "the parser returns the EXISTING dataset row type, so the swap is a drop-in",
      /DatasetRow/.test(parser) && /from "\.\/dataset"/.test(parser),
      "parses to DatasetRow[], the shape EMPLOYEE_DATASET already has",
    );
    check(
      "Excel reads the first worksheet, CSV is read directly",
      /SheetNames\[0\]/.test(parser) && /parseCsv\(await file\.text\(\)\)/.test(parser),
      "first sheet for workbooks, direct read for CSV",
    );
    check(
      "no roster is hard-coded in the upload path",
      !/EMP0\d\d/.test(parser),
      "every row comes from the uploaded file",
    );
  }
  {
    const store = readFileSync(join(root, "src", "store", "employeeDataStore.ts"), "utf8");
    check(
      "the built-in dataset still runs the park when nothing is uploaded",
      /rows\s*\?\?\s*EMPLOYEE_DATASET/.test(store),
      "activeDataset() falls back to EMPLOYEE_DATASET",
    );
  }
  {
    /* The upload must stay inert for the running simulation. */
    const journey = readFileSync(join(root, "src", "simulation", "journey", "journey.ts"), "utf8");
    check(
      "the journey builder is untouched by the upload",
      !/employeeDataStore|employeeUpload/.test(journey) && /EMPLOYEE_DATASET/.test(journey),
      "employee animation and simulation still read the built-in dataset",
    );
  }
}

console.log(
  failures === 0 ? "\nOK: dashboard overview verified." : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
