import { DEPARTMENTS } from "@/components/park/departments";
import { JOURNEY_EMPLOYEES } from "./journey";

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
 * number is a count over the verbatim 50-row dataset.
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

export function departmentOverview(simTime: number): DepartmentOverviewRow[] {
  return DEPARTMENTS.map(({ department, rideName }) => {
    const staff = JOURNEY_EMPLOYEES.filter((e) => e.department === department);
    const checkedIn = staff.filter((e) => e.checkInTime <= simTime).length;
    const started = staff.filter((e) => e.workStart <= simTime).length;
    return {
      department,
      rideName,
      size: staff.length,
      checkedIn,
      delayed: checkedIn - started,
      started,
      avgDelay: staff.reduce((s, e) => s + e.delayMinutes, 0) / Math.max(1, staff.length),
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
