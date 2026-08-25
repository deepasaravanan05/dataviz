import { JOURNEY_EMPLOYEES, type CheckInColor, type JourneyEmployee } from "./journey";

/**
 * The delay analysis: how long each group waits between checking in and
 * actually starting work.
 *
 * This is the number the whole park exists to expose, so it lives in a plain
 * module the HUD renders and the verification script re-derives independently,
 * rather than being computed inside a component where it could not be checked.
 *
 * Everything is derived once at module load. The dataset is static, so a
 * breakdown costs nothing per frame.
 */

export interface DelayGroup {
  key: string;
  label: string;
  count: number;
  /** Mean minutes from check-in to work start. */
  average: number;
  longest: number;
}

export function averageDelay(list: JourneyEmployee[]): number {
  if (list.length === 0) return 0;
  return list.reduce((sum, e) => sum + e.delayMinutes, 0) / list.length;
}

function group(key: string, label: string, list: JourneyEmployee[]): DelayGroup {
  return {
    key,
    label,
    count: list.length,
    average: averageDelay(list),
    longest: list.reduce((m, e) => Math.max(m, e.delayMinutes), 0),
  };
}

export const AVERAGE_DELAY = averageDelay(JOURNEY_EMPLOYEES);

const BANDS: CheckInColor[] = ["GREEN", "YELLOW", "RED"];

/** Delay by check-in band — does arriving later also mean starting later? */
export const DELAY_BY_BAND: DelayGroup[] = BANDS.map((band) =>
  group(band, band, JOURNEY_EMPLOYEES.filter((e) => e.color === band)),
);

/** Delay by department, in the order the departments appear in the roster. */
export const DELAY_BY_DEPARTMENT: DelayGroup[] = Array.from(
  new Set(JOURNEY_EMPLOYEES.map((e) => e.department)),
).map((department) =>
  group(department, department, JOURNEY_EMPLOYEES.filter((e) => e.department === department)),
);

/** The single worst wait in the roster. */
export const WORST_DELAY: JourneyEmployee = JOURNEY_EMPLOYEES.reduce((worst, e) =>
  e.delayMinutes > worst.delayMinutes ? e : worst,
);

/** Longest bar in either breakdown, so both are drawn to one scale. */
export const MAX_GROUP_AVERAGE = Math.max(
  ...DELAY_BY_BAND.map((d) => d.average),
  ...DELAY_BY_DEPARTMENT.map((d) => d.average),
);
