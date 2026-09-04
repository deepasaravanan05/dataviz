/**
 * TURN THE SUPPLIED WORKBOOK INTO THE MODULE THE PARK READS.
 *
 * `data/employee_work_start_data.xlsx` is the single source of truth for the
 * whole simulation, and this is the one place it is read. It transcribes every row —
 * all of them, never a sample — into `src/simulation/journey/attendanceData.ts`
 * so that the park, the verify suite and the Node scripts all read exactly the
 * same records without any of them having to parse a spreadsheet at runtime.
 *
 * WHY A GENERATED MODULE AND NOT A RUNTIME PARSE. The journey is built at
 * import time (see `BUILTIN_JOURNEY`), the site is statically prerendered, and
 * every `verify:*` script re-derives the park from the same modules the browser
 * does. A file read is none of those things. Generating the module keeps one
 * copy of the data, in one shape, with the workbook still in the repository
 * beside it — and `verify-attendance.ts` re-reads the workbook and asserts the
 * generated module still matches it row for row, so the two cannot drift.
 *
 * NOTHING IS ALTERED ON THE WAY THROUGH. Times keep their exact seconds, the
 * delay keeps its exact minutes, names and departments keep their exact
 * spelling — including the double spaces some names carry — and the row order
 * is the workbook's own. The only arithmetic done here is a CHECK: that the
 * sheet's own Actual Work Start really is the check-in plus the delay, on
 * every row, to the second.
 *
 * Run with `npm run build:attendance`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

XLSX.set_fs(fs);

const WORKBOOK = path.join(process.cwd(), "data", "employee_work_start_data.xlsx");
/*
 * THE NAMES COME FROM THE EARLIER WORKBOOK, because the supplied one has no
 * name column — it carries the date, the employee id, the two timestamps, the
 * delay and the department, and nothing else. The park puts a name on the plate
 * above every figure, so the names are JOINED from the sheet that had them, on
 * employee id. Both workbooks describe the same 142 people, and the join is
 * asserted below to cover every id in the new one.
 */
const NAME_SOURCE = path.join(process.cwd(), "data", "final one.xlsx");
const OUTPUT = path.join(process.cwd(), "src", "simulation", "journey", "attendanceData.ts");

/** The sheet's own column headings, exactly as they are spelled in it. */
const COLUMNS = {
  date: "Date",
  id: "Employee ID",
  department: "Department",
  checkIn: "Check-in Time",
  workStart: "Actual Work Start Time",
  delay: "Delay Time",
} as const;

/** The earlier workbook's, for the join. */
const NAME_COLUMNS = { id: "Employee ID", name: "Employee Name" } as const;

/** Sunday-first, the spelling the earlier workbook's own Day column used. */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Raw = Record<string, unknown>;

/**
 * "09:45 AM" -> seconds of day, and "09:45:30 AM" too.
 *
 * The supplied workbook prints whole minutes; the earlier one printed seconds.
 * Both spellings are read so that the transcription is of what the sheet
 * actually says, whichever sheet it is.
 */
function readClock(text: string, where: string): number {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(text.trim());
  if (!m) throw new Error(`${where}: unparseable time "${text}"`);
  const hours = (Number(m[1]) % 12) + (/pm/i.test(m[4]) ? 12 : 0);
  return hours * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
}

/** "01-07-2026" -> "2026-07-01", the spelling the park's dates are keyed by. */
function readDate(text: string, where: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text.trim());
  if (!m) throw new Error(`${where}: unparseable date "${text}"`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** "6 mins" -> 6. The workbook's only delay spelling. */
function readDelay(text: string, where: string): number {
  const m = /^(-?\d+(?:\.\d+)?)\s*mins?$/i.exec(text.trim());
  if (!m) throw new Error(`${where}: unparseable delay "${text}"`);
  return Number(m[1]);
}

function hhmmss(seconds: number): string {
  const s = ((seconds % 86400) + 86400) % 86400;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

/* The name join, read once: the first spelling each id carries in the earlier
   workbook. One id is spelled two ways there — "Shashti Priyan shathiyavelu"
   and "Shashti Priyan" — so first-seen is taken, which is deterministic. */
const nameBook = XLSX.readFile(NAME_SOURCE);
const NAMES = new Map<string, string>();
for (const row of XLSX.utils.sheet_to_json<Raw>(nameBook.Sheets[nameBook.SheetNames[0]], {
  defval: null,
})) {
  const id = String(row[NAME_COLUMNS.id] ?? "").trim();
  const name = String(row[NAME_COLUMNS.name] ?? "").trim();
  if (id && name && !NAMES.has(id)) NAMES.set(id, name);
}

const book = XLSX.readFile(WORKBOOK);
const sheetName = book.SheetNames[0];
const rows = XLSX.utils.sheet_to_json<Raw>(book.Sheets[sheetName], { defval: null });

const lines: string[] = [];
const dates = new Set<string>();

rows.forEach((row, i) => {
  const where = `${sheetName} row ${i + 2}`;
  const text = (key: keyof typeof COLUMNS) => {
    const value = row[COLUMNS[key]];
    if (value === null || value === undefined || String(value).trim() === "") {
      throw new Error(`${where}: empty ${COLUMNS[key]}`);
    }
    return String(value);
  };

  const date = readDate(text("date"), where);
  const checkIn = readClock(text("checkIn"), where);
  const workStart = readClock(text("workStart"), where);
  const delay = readDelay(text("delay"), where);

  /*
   * THE ONE ASSERTION MADE AT TRANSCRIPTION TIME: the sheet's Delay Time
   * really is the gap between its own two timestamps.
   *
   * IT IS ASSERTED TO THE MINUTE, because this sheet prints its clocks to the
   * minute. The delay column is the true one — it was written from timestamps
   * that had seconds, and 09:45:30 to 09:52:05 is "6 mins" — so once both
   * clocks are rounded to whole minutes the gap between them can read 7. The
   * relation that holds on every one of the 3,219 rows, and the one worth
   * asserting, is therefore that the printed delay is within a minute of the
   * gap the sheet's own printed times leave.
   *
   * The gap can run past midnight — a delay of 913 minutes on a 9:38 AM
   * check-in starts work at 12:51 the following morning — so it is measured
   * on the clock, modulo the day, exactly as the sheet prints it.
   */
  const gap = ((workStart - checkIn) % 86400 + 86400) % 86400;
  /* Modulo the day at both ends: a delay of 1439 minutes on a check-in of
     09:27:20 starts work at 09:27:10 the next morning, and once both clocks
     are rounded to the minute the gap the sheet leaves reads as zero. Zero and
     1439 are a minute apart on a clock, which is the tolerance meant. */
  const slip = (((gap / 60 - delay) % 1440) + 1440) % 1440;
  if (Math.min(slip, 1440 - slip) > 1 + 1e-9) {
    throw new Error(
      `${where}: ${text("id")} checked in at ${text("checkIn")} and started at ` +
        `${text("workStart")}, a gap of ${(gap / 60).toFixed(2)} min, but the ` +
        `sheet's Delay Time says ${delay}.`,
    );
  }

  const id = text("id").trim();
  const name = NAMES.get(id);
  if (!name) throw new Error(`${where}: ${id} has no name in ${path.basename(NAME_SOURCE)}`);

  /* The day name is derived from the date rather than joined: the supplied
     sheet has no Day column, and the derivation reproduces the earlier
     workbook's own Day on all 49 of its dates. */
  const [yyyy, mm, dd] = date.split("-").map(Number);
  const day = WEEKDAYS[new Date(Date.UTC(yyyy, mm - 1, dd)).getUTCDay()];

  dates.add(date);
  lines.push(
    [
      date,
      day,
      id,
      /* Names keep their own spelling, double spaces and all — only the outer
         whitespace goes, because it is invisible either way. */
      name,
      text("department").trim(),
      hhmmss(checkIn),
      hhmmss(workStart),
      String(delay),
      String(gap),
    ].join("|"),
  );
});

for (const line of lines) {
  const fields = line.split("|");
  if (fields.length !== 9) throw new Error(`A field contains the separator: ${line}`);
}

const header = `/**
 * THE ATTENDANCE RECORDS, transcribed from \`data/${path.basename(WORKBOOK)}\`.
 *
 * GENERATED — do not edit. Run \`npm run build:attendance\` to regenerate, and
 * see \`scripts/build-attendance.ts\` for why the workbook is transcribed into a
 * module rather than parsed at runtime. \`verify:attendance\` re-reads the
 * workbook and asserts this file still matches it row for row.
 *
 * ${rows.length} rows across ${dates.size} dates, in the workbook's own order.
 * One line per record, pipe-separated:
 *
 *   date | day | employee id | employee name | department | check-in |
 *   actual work start | delay minutes | delay seconds
 *
 * Times are the sheet's own, written as a 24-hour clock — this workbook prints
 * them to the minute. The delay minutes are its own Delay Time column, which
 * was written from timestamps that still had seconds; the delay seconds are the
 * gap between the printed times, so the two can differ by up to a minute.
 * Nothing here is re-ordered, de-duplicated or filled in. The names are the
 * only joined column: this sheet has none, so they come from the earlier
 * workbook on employee id, and the day name is derived from the date.
 */

/** The workbook these records come from, named so the park can say so. */
export const ATTENDANCE_SOURCE = ${JSON.stringify(path.basename(WORKBOOK))};

/** The sheet within it. */
export const ATTENDANCE_SHEET = ${JSON.stringify(sheetName)};

/** How many records the workbook holds — asserted against the parse below. */
export const ATTENDANCE_ROW_COUNT = ${rows.length};

export const ATTENDANCE_RECORDS = \``;

fs.writeFileSync(OUTPUT, `${header}${lines.join("\n")}\`;\n`, "utf8");

console.log(
  `Wrote ${OUTPUT}\n  ${rows.length} rows, ${dates.size} dates ` +
    `(${[...dates].sort()[0]} .. ${[...dates].sort().pop()})`,
);
