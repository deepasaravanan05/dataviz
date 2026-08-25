import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEPARTMENTS } from "../src/components/park/departments";
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
  "department sizes come from the real roster and sum to 50",
  start.reduce((s, r) => s + r.size, 0) === 50 &&
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
      totals.size === 50,
    `at 10:00 — ${totals.checkedIn} in, ${totals.delayed} delayed, ${totals.started} started`,
  );
  const avgOk = rows.every((r) => {
    const staff = JOURNEY_EMPLOYEES.filter((e) => e.department === r.department);
    const avg = staff.reduce((s, e) => s + e.delayMinutes, 0) / staff.length;
    return Math.abs(avg - r.avgDelay) < 1e-9;
  });
  check("per-department average delay matches an independent recompute", avgOk, "to the minute");
}

// ============ 4. The page renders the real module, chart-free ============
check(
  "the page reads departmentOverview — it never re-derives its own counts",
  /departmentOverview/.test(page) && /overviewTotals/.test(page),
  "one source of numbers for park and dashboard alike",
);
check(
  "no chart library and no chart markup — the table IS the visualization",
  // Package names are matched as imports, not substrings — "#34d399" is a
  // colour, not a d3 dependency.
  !/from ["'](d3|recharts|chart\.js|plotly)/i.test(code(page)) &&
    !/<(BarChart|PieChart|LineChart|Doughnut)/i.test(code(page)),
  "standing instruction: no charts",
);
check(
  "the dashboard adds no 3D of its own",
  !/@react-three|three|<Canvas/.test(code(page)),
  "a plain HTML page beside the park",
);
check(
  "the concept image's fabricated departments do not appear",
  !/Human Resources|Marketing|Sales|Customer Support|Quality Assurance|Procurement/.test(page),
  "only the dataset's seven departments are shown",
);

console.log(
  failures === 0 ? "\nOK: dashboard overview verified." : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
