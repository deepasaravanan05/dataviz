import { JOURNEY_EMPLOYEES, type JourneyEmployee } from "./journey";

/**
 * The department check-in overview: the dashboard's numbers, derived live
 * from the SAME journey data the park animates.
 *
 * All three counts are functions of the simulated clock, so the table tells
 * the story as it happens rather than quoting an end-of-morning summary:
 *
 *   checkedIn — employees whose dataset check-in minute has passed
 *   delayed   — checked in, but their actual work start has not arrived yet
 *               (they are the people currently walking, eating or queueing —
 *               the delay, made visible as a headcount)
 *   started   — employees whose dataset actual-work-start minute has passed
 *
 * By construction checkedIn = delayed + started at every instant, and at the
 * end of the morning delayed drains to zero. Nothing here is invented: every
 * number is a count over the verbatim attendance dataset.
 */

export interface DepartmentOverviewRow {
  department: string;
  rideName: string;
  /** Total staff in this department, from the dataset. */
  size: number;
  checkedIn: number;
  delayed: number;
  started: number;
  /** Average delay across the department's whole roster, in minutes. */
  avgDelay: number;
}

export function departmentOverview(
  simTime: number,
  employees: JourneyEmployee[] = JOURNEY_EMPLOYEES,
): DepartmentOverviewRow[] {
  /*
   * Departments in first-seen roster order, each with the ride name the
   * builder actually assigned. For the built-in dataset this reproduces the
   * static department table exactly; for an uploaded roster it reports
   * whatever departments the upload brought.
   */
  const departments: { department: string; rideName: string }[] = [];
  for (const e of employees) {
    if (!departments.some((d) => d.department === e.department)) {
      departments.push({ department: e.department, rideName: e.rideName });
    }
  }
  return departments.map(({ department, rideName }) => {
    const staff = employees.filter((e) => e.department === department);
    const checkedIn = staff.filter((e) => e.checkInTime <= simTime).length;
    const started = staff.filter((e) => e.workStart <= simTime).length;
    return {
      department,
      rideName,
      size: staff.length,
      checkedIn,
      delayed: checkedIn - started,
      started,
      /* The sheet's own whole-minute Delay Time column, which is what every
         other surface prints, so the table cannot disagree with the panel. */
      avgDelay:
        staff.reduce((s, e) => s + e.reportedDelayMinutes, 0) / Math.max(1, staff.length),
    };
  });
}

export interface OverviewTotals {
  size: number;
  checkedIn: number;
  delayed: number;
  started: number;
}

export function overviewTotals(rows: DepartmentOverviewRow[]): OverviewTotals {
  return rows.reduce(
    (t, r) => ({
      size: t.size + r.size,
      checkedIn: t.checkedIn + r.checkedIn,
      delayed: t.delayed + r.delayed,
      started: t.started + r.started,
    }),
    { size: 0, checkedIn: 0, delayed: 0, started: 0 },
  );
}
