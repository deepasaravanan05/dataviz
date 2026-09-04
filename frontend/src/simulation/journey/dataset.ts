import {
  ATTENDANCE_RECORDS,
  ATTENDANCE_ROW_COUNT,
  ATTENDANCE_SHEET,
  ATTENDANCE_SOURCE,
} from "./attendanceData";

/**
 * The employee attendance dataset, exactly as supplied.
 *
 * `data/final one.xlsx` is the SINGLE SOURCE OF TRUTH for the whole journey
 * simulation. Every name, ID, department, date, check-in time, actual work
 * start and delay animated in the park comes from it verbatim: the journey
 * builder derives MOVEMENT to fit these records and never adjusts them, never
 * invents a delay, and never fills a blank.
 *
 * All 3,219 rows are here — see `attendanceData.ts`, transcribed from the
 * workbook by `npm run build:attendance` — spanning 49 dates. The park animates
 * ONE date at a time, because a date is what a working morning is: `ROWS_BY_DATE`
 * groups them and `rowsForDate()` hands the builder the roster for whichever
 * date the visitor has chosen.
 *
 * WHAT THE TWO DELAY NUMBERS ARE FOR. The sheet prints a whole number of
 * minutes ("6 mins") beside two timestamps that are a whole number of SECONDS
 * apart (09:45:30 to 09:52:05 is 6 min 35 s). Both are kept, because they
 * answer different questions and rounding either one away would lose something:
 *
 *   `reportedDelayMinutes` is the sheet's own Delay Time column. It decides
 *   WHO was delayed — and therefore who goes to the food court — and it is what
 *   the panels print, so the park never shows a number the sheet does not.
 *
 *   `delayMinutes` is the exact gap between the two timestamps. It decides HOW
 *   LONG a delayed employee waits, so they resume at precisely the Actual Work
 *   Start Time the sheet gives them.
 *
 * The two agree to the minute on every row, and `build-attendance.ts` asserts
 * it at transcription time.
 *
 * Times are minutes-of-day and may carry a fraction, because the sheet's own
 * times carry seconds and the colour bands are decided on exact boundaries.
 * `workStart` is `checkIn + delayMinutes` and so can run past 1440 — a delay of
 * 913 minutes on a 9:38 AM check-in starts work at 12:51 the following morning,
 * which is what the sheet says and what the park animates.
 */

export interface DatasetRow {
  id: string;
  name: string;
  department: string;
  /**
   * The Date (IST) this record belongs to, "YYYY-MM-DD". Absent on an uploaded
   * roster that carries no date column — the park then treats it as one day.
   */
  date?: string;
  /** The sheet's own weekday abbreviation for that date. */
  day?: string;
  /** Check-in, in minutes of day, to the second. */
  checkIn: number;
  /** Actual work start minus check-in, exactly. See above. */
  delayMinutes: number;
  /**
   * The sheet's own Delay Time column, whole minutes. Optional so an uploaded
   * roster — which has only one delay figure — needs no second column; read it
   * through `reportedDelay()` rather than directly.
   */
  reportedDelayMinutes?: number;
  /** Actual work start, in minutes of day. May exceed 1440 — see above. */
  workStart: number;
  /**
   * Check-out at the end of the working day, in minutes of day, or null where
   * the source has no such column. `final one.xlsx` does not: it records the
   * START of the working day and nothing about its end, so the park says
   * nothing about it either rather than inventing an hour.
   */
  checkOut: number | null;
}

/**
 * The delay AS THE SOURCE PRINTS IT — whole minutes, and the number that
 * decides whether an employee was delayed at all.
 *
 * Nineteen rows of the workbook print "0 mins" beside timestamps up to 58
 * seconds apart. The sheet says they were not delayed, so the park sends them
 * straight to their ride: the Delay Time column is the rule, exactly as the
 * brief states it, and never the arithmetic behind it.
 */
export function reportedDelay(row: DatasetRow): number {
  return row.reportedDelayMinutes ?? row.delayMinutes;
}

/** Parse the sheet's "HH:MM AM" spelling into minutes of day. */
export function parseClockTime(text: string): number {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))? ?(AM|PM)$/i.exec(text.trim());
  if (!m) throw new Error(`Unparseable time in dataset: "${text}"`);
  const hours = (Number(m[1]) % 12) + (/pm/i.test(m[4]) ? 12 : 0);
  return hours * 60 + Number(m[2]) + Number(m[3] ?? 0) / 60;
}

/** Parse the generated module's 24-hour "HH:MM:SS" into minutes of day. */
function parse24(text: string): number {
  const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(text);
  if (!m) throw new Error(`Unparseable time in attendance data: "${text}"`);
  return Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60;
}

/**
 * Every record in the workbook, in its own order.
 *
 * `workStart` is rebuilt as `checkIn + delayMinutes` rather than read back off
 * the clock, so a work start that falls after midnight stays AFTER the check-in
 * it belongs to instead of wrapping round to the small hours of the same
 * morning. Modulo the day it is the sheet's own printed time, which is what the
 * generator asserts and what `formatSimTime` prints.
 */
export const ATTENDANCE_DATASET: DatasetRow[] = ATTENDANCE_RECORDS.split("\n").map(
  (line, i) => {
    const f = line.split("|");
    if (f.length !== 9) throw new Error(`Malformed attendance record on line ${i + 1}`);
    const [date, day, id, name, department, checkIn, , delayMinutes, delaySeconds] = f;
    const checkInMinutes = parse24(checkIn);
    const exactDelay = Number(delaySeconds) / 60;
    return {
      id,
      name,
      department,
      date,
      day,
      checkIn: checkInMinutes,
      delayMinutes: exactDelay,
      reportedDelayMinutes: Number(delayMinutes),
      workStart: checkInMinutes + exactDelay,
      checkOut: null,
    };
  },
);

if (ATTENDANCE_DATASET.length !== ATTENDANCE_ROW_COUNT) {
  throw new Error(
    `The attendance data claims ${ATTENDANCE_ROW_COUNT} rows but parsed ` +
      `${ATTENDANCE_DATASET.length}. Re-run \`npm run build:attendance\`.`,
  );
}

export { ATTENDANCE_SOURCE, ATTENDANCE_SHEET, ATTENDANCE_ROW_COUNT };

/** Every Date (IST) in the workbook, earliest first. */
export const ATTENDANCE_DATES: string[] = [
  ...new Set(ATTENDANCE_DATASET.map((r) => r.date!)),
].sort();

/** The roster of each date, keyed by the sheet's own "YYYY-MM-DD". */
export const ROWS_BY_DATE: Record<string, DatasetRow[]> = ATTENDANCE_DATASET.reduce<
  Record<string, DatasetRow[]>
>((acc, row) => {
  (acc[row.date!] ??= []).push(row);
  return acc;
}, {});

/** The sheet's weekday for a date, e.g. "Wed". */
export const DAY_OF_DATE: Record<string, string> = Object.fromEntries(
  ATTENDANCE_DATES.map((d) => [d, ROWS_BY_DATE[d][0].day!]),
);

/**
 * The date the park opens on: the first working day the workbook records.
 * Every other date is one click away in the entrance calendar.
 */
export const DEFAULT_DATE = ATTENDANCE_DATES[0];

export function rowsForDate(date: string): DatasetRow[] {
  const rows = ROWS_BY_DATE[date];
  if (!rows) throw new Error(`The dataset has no records for ${date}.`);
  return rows;
}

/**
 * The roster the park boots with — the default date's own records.
 *
 * The name is kept because the journey builder, the verify suite and the
 * upload path all read it as "the roster the park starts from". What changed is
 * what it holds: one date out of the workbook rather than a hand-transcribed
 * sheet of thirty.
 */
export const EMPLOYEE_DATASET: DatasetRow[] = rowsForDate(DEFAULT_DATE);

/**
 * Every department name that appears ANYWHERE in the workbook, in first-seen
 * order — not merely on the opening date.
 *
 * The department-to-ride mapping has to be the same on all 49 dates, or an
 * employee's destination would depend on which morning you happened to be
 * watching. So it is solved once over the whole dataset.
 */
export const DATASET_DEPARTMENTS: string[] = ATTENDANCE_DATASET.reduce<string[]>(
  (list, row) => (list.includes(row.department) ? list : [...list, row.department]),
  [],
);
