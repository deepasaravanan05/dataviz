import { JOURNEY_EMPLOYEES, type CheckInColor, type JourneyEmployee } from "./journey";

/**
 * The delay analysis: how long each group waits between checking in and
 * actually starting work.
 *
 * This is the number the whole park exists to expose, so it lives in a plain
 * module the HUD renders and the verification script re-derives independently,
 * rather than being computed inside a component where it could not be checked.
 *
 * Every breakdown is a pure function of a roster, so the HUD can run them
 * over whichever roster is active — built-in or uploaded — while the module
 * constants below keep serving the built-in dataset to everything that quotes
 * it statically (and to the verify suite).
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

const BANDS: CheckInColor[] = ["GREEN", "YELLOW", "RED"];

/** Delay by check-in band — does arriving later also mean starting later? */
export function delayByBand(list: JourneyEmployee[]): DelayGroup[] {
  return BANDS.map((band) => group(band, band, list.filter((e) => e.color === band)));
}

/** Delay by department, in the order the departments appear in the roster. */
export function delayByDepartment(list: JourneyEmployee[]): DelayGroup[] {
  return Array.from(new Set(list.map((e) => e.department))).map((department) =>
    group(department, department, list.filter((e) => e.department === department)),
  );
}

/** The single worst wait in a roster. */
export function worstDelay(list: JourneyEmployee[]): JourneyEmployee {
  return list.reduce((worst, e) => (e.delayMinutes > worst.delayMinutes ? e : worst));
}

/** Longest bar in either breakdown, so both are drawn to one scale. */
export function maxGroupAverage(list: JourneyEmployee[]): number {
  return Math.max(
    ...delayByBand(list).map((d) => d.average),
    ...delayByDepartment(list).map((d) => d.average),
  );
}

/* The built-in dataset's breakdowns, exactly as before. */
export const AVERAGE_DELAY = averageDelay(JOURNEY_EMPLOYEES);
export const DELAY_BY_BAND: DelayGroup[] = delayByBand(JOURNEY_EMPLOYEES);
export const DELAY_BY_DEPARTMENT: DelayGroup[] = delayByDepartment(JOURNEY_EMPLOYEES);
export const WORST_DELAY: JourneyEmployee = worstDelay(JOURNEY_EMPLOYEES);
export const MAX_GROUP_AVERAGE = maxGroupAverage(JOURNEY_EMPLOYEES);
