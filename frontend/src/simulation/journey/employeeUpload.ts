import { parseClockTime, type DatasetRow } from "./dataset";

/**
 * Reading an employee roster out of an uploaded file.
 *
 * ADD-ONLY, and deliberately a module of its own: nothing here is imported by
 * the journey builder, the rides, the clock or the department panel, so an
 * upload cannot disturb a park that is already running. The one thing this
 * file promises is its RETURN TYPE — it produces `DatasetRow[]`, the exact
 * shape `EMPLOYEE_DATASET` already has, so the parsed roster is a drop-in for
 * the built-in one. That is the whole point of parsing to the existing type
 * rather than inventing a new one.
 *
 * IT ACCEPTS THE FILE. That is the rule this module is written around, and it
 * replaced a stack of five gates that each had the power to hand a file back:
 * the extension had to be one of three, the workbook's FIRST sheet had to be
 * the right one, seven columns had to be spelled in one of a short list of
 * ways, and any single unreadable cell in any single row failed the whole
 * upload. A roster is a human artefact — someone's export, someone's hand-kept
 * sheet — and every one of those gates rejected files that plainly contained a
 * roster.
 *
 * So nothing here throws for the shape of a file. Format is sniffed from the
 * BYTES rather than trusted to the extension, every worksheet is considered
 * rather than only the first, columns are found by name and then by what their
 * values actually look like, and a cell that cannot be read is filled in from
 * the rest of the row instead of taking the file down with it. What the parser
 * had to guess comes back in `notes`, so the guessing is visible rather than
 * silent.
 *
 * The single remaining failure is the honest one: a file with no table in it
 * at all yields no rows, and the caller says so.
 */

/** The formats the upload control suggests — a hint now, never a gate. */
export const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

/**
 * The `accept` attribute for the file input.
 *
 * EVERYTHING. A narrower list is what made the picker grey out a roster saved
 * as .txt, .tsv, .ods or with no extension at all, none of which this parser
 * has any trouble with.
 */
export const UPLOAD_ACCEPT = "*/*";

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

/** A parse that failed for a reason worth showing the user verbatim. */
export class EmployeeUploadError extends Error {}

/** What one upload produced, and what had to be guessed to produce it. */
export interface ParsedUpload {
  rows: DatasetRow[];
  /** Plain-language notes about anything inferred or filled in. */
  notes: string[];
}

/* ---------------- Column matching ---------------- */

/**
 * Headers are matched on letters and digits only, so "Check-in Time",
 * "check in time" and "CheckInTime" are the same column. Spreadsheets that
 * people maintain by hand never agree on punctuation.
 */
function normaliseHeader(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface ColumnSpec {
  key: keyof DatasetRow;
  label: string;
  /** Normalised spellings this column is known by. */
  aliases: string[];
}

/*
 * The aliases are deliberately generous. Every one of these is a spelling a
 * real export uses, and a header this list misses is not a rejection any more
 * — it falls through to the value-shape inference below.
 */
const COLUMNS: ColumnSpec[] = [
  {
    key: "id",
    label: "Employee ID",
    aliases: ["employeeid", "empid", "id", "employeenumber", "empno", "employeecode", "staffid", "code", "no", "sno", "srno"],
  },
  {
    key: "name",
    label: "Employee Name",
    aliases: ["employeename", "name", "empname", "fullname", "staffname", "employee", "person"],
  },
  {
    key: "department",
    label: "Department",
    aliases: ["department", "dept", "team", "division", "unit", "function", "departmentname"],
  },
  {
    key: "checkIn",
    label: "Check-in Time",
    aliases: ["checkintime", "checkin", "checkintimestamp", "intime", "in", "arrivaltime", "arrival", "entrytime", "entry", "swipein", "punchin", "login", "logintime", "timein"],
  },
  {
    key: "delayMinutes",
    label: "Delay Time",
    aliases: ["delaytime", "delay", "delayminutes", "delaymins", "delayinminutes", "latemins", "lateminutes", "late", "lateby", "latenessminutes", "lateness"],
  },
  {
    key: "workStart",
    label: "Actual Work Start Time",
    aliases: ["actualworkstarttime", "workstarttime", "workstart", "actualworkstart", "starttime", "start", "startedwork", "workbegin", "actualstart", "shiftstart"],
  },
  {
    key: "checkOut",
    label: "Check-out Time",
    aliases: ["checkouttime", "checkout", "checkedout", "outtime", "out", "departuretime", "departure", "exittime", "exit", "swipeout", "punchout", "logout", "logouttime", "timeout"],
  },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

/** Every column index, or -1 where the file simply has no such column. */
type ColumnMap = Record<keyof DatasetRow, number>;

/** A working day, used when a file carries no check-out column. */
const DEFAULT_WORKDAY_MINUTES = 8 * 60;

/** The hour a roster is assumed to start at when it records no arrival at all. */
const DEFAULT_CHECK_IN = 9 * 60;

/* ---------------- Value parsing ---------------- */

/**
 * A clock time, however the file happens to spell it — or null.
 *
 * NULL RATHER THAN A THROW, because this is used twice: once to read a cell,
 * and once to ask what a whole COLUMN looks like so an unlabelled sheet can
 * still be understood. A question about a column's shape cannot be answered by
 * an exception.
 *
 * The built-in dataset's strict "HH:MM AM" parser is tried first so an export
 * of that data round-trips exactly. Beyond it, a spreadsheet may hand over a
 * real time cell — which arrives as a fraction of a day, 0.5 being noon — or a
 * Date, or any of the looser spellings people type.
 */
export function readTime(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getHours() * 60 + value.getMinutes();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    /* Excel stores a time as a fraction of a day; a datetime adds whole days. */
    const dayFraction = value - Math.floor(value);
    return Math.round(dayFraction * 24 * 60) % (24 * 60);
  }

  const text = String(value ?? "").trim();
  if (!text) return null;

  try {
    return parseClockTime(text);
  } catch {
    /* Fall through to the tolerant forms below. */
  }

  /* "9:05", "09:05:30", "9:05 PM", "9.05 am", "0905" and "9 AM". */
  const m = /^(\d{1,2})[:.h]?(\d{2})(?:[:.](\d{2}))?\s*([ap])\.?m\.?$|^(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?$|^(\d{1,2})\s*([ap])\.?m\.?$/i.exec(
    text,
  );
  if (m) {
    const meridiem = (m[4] ?? m[9])?.toLowerCase();
    let hours = Number(m[1] ?? m[5] ?? m[8]);
    const minutes = Number(m[2] ?? m[6] ?? 0);
    if (meridiem) hours = (hours % 12) + (meridiem === "p" ? 12 : 0);
    if (hours <= 23 && minutes <= 59) return hours * 60 + minutes;
  }

  /* A full timestamp, e.g. "2024-05-06 09:33:00" or an ISO string. */
  const stamp = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?m\.?/i.exec(text);
  if (stamp) {
    const meridiem = stamp[3]?.toLowerCase();
    let hours = Number(stamp[1]);
    const minutes = Number(stamp[2]);
    if (meridiem) hours = (hours % 12) + (meridiem === "p" ? 12 : 0);
    if (hours <= 23 && minutes <= 59) return hours * 60 + minutes;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return d.getHours() * 60 + d.getMinutes();
  }

  return null;
}

/** The throwing form, kept for callers that want the file's own wording. */
export function parseUploadTime(value: unknown, label: string, row: number): number {
  const minutes = readTime(value);
  if (minutes === null) {
    const text = String(value ?? "").trim();
    throw new EmployeeUploadError(
      text ? `Row ${row}: cannot read ${label} "${text}"` : `Row ${row}: ${label} is empty`,
    );
  }
  return minutes;
}

/** Spellings a sheet uses for "this person was not delayed at all". */
const NO_DELAY = new Set(["nodelay", "none", "nil", "na", "n/a", "-", "--", "ontime", "punctual", ""]);

/**
 * A count of minutes, or null.
 *
 * "No Delay" is a value, not a blank. The attendance sheet spells zero that
 * way on half its rows, and reading it as an error would reject exactly the
 * employees whose story is that they went straight to work.
 *
 * The wordy-spelling test only applies to text WITHOUT digits: normalising
 * strips digits, so a CSV's plain "18" would otherwise collapse to "" and
 * read as No Delay — every numeric delay in the file silently zeroed.
 */
export function readMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);

  const text = String(value ?? "").trim();
  if (!/\d/.test(text) && NO_DELAY.has(text.toLowerCase().replace(/[^a-z/-]/g, ""))) return 0;

  /* "12", "12 min", "12 minutes", "0:12" all mean the same thing. */
  const clock = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const m = /^(-?\d+(?:\.\d+)?)/.exec(text);
  if (!m) return null;
  return Math.round(Number(m[1]));
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

/* ---------------- Delimited text ---------------- */

/**
 * A delimited reader that understands quoting.
 *
 * Employee names and departments are exactly the fields likely to contain the
 * delimiter, so splitting on it alone would silently shift every later column
 * on those rows — a corruption that looks like valid data.
 */
export function parseCsv(source: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  /* Strip a UTF-8 BOM: Excel writes one, and it would poison the first header. */
  const src = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }

    if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }

  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

/**
 * Which character the file separates its columns with.
 *
 * Whichever candidate appears most consistently across the first few lines
 * wins. Consistency rather than raw count, because a name column full of
 * commas can out-number the semicolons that are actually doing the separating.
 */
export function detectDelimiter(source: string): string {
  const lines = source.split(/\r?\n/).filter((l) => l.trim() !== "").slice(0, 12);
  if (!lines.length) return ",";

  let best = ",";
  let bestScore = -1;
  for (const candidate of [",", ";", "\t", "|"]) {
    const counts = lines.map((l) => l.split(candidate).length - 1);
    const max = Math.max(...counts);
    if (max === 0) continue;
    const modal = counts.filter((c) => c === max).length / counts.length;
    const score = max * modal;
    if (score > bestScore) { bestScore = score; best = candidate; }
  }
  return best;
}

/* ---------------- Finding the table in the grid ---------------- */

/** How many of a row's cells are recognisable column headings. */
function headerScore(cells: unknown[]): number {
  let score = 0;
  for (const cell of cells) {
    const key = normaliseHeader(text(cell));
    if (!key) continue;
    if (COLUMNS.some((c) => c.aliases.includes(key))) score++;
  }
  return score;
}

/**
 * Which row of the grid is the header — or -1 for a sheet with no header at
 * all, whose first row is already data.
 *
 * Scanned rather than assumed to be the first row, because a hand-kept sheet
 * routinely opens with a title, a date, or a blank line or two above the
 * actual column names.
 */
export function findHeaderRow(grid: unknown[][]): number {
  let best = -1;
  let bestScore = 0;
  const limit = Math.min(grid.length, 25);
  for (let i = 0; i < limit; i++) {
    const score = headerScore(grid[i] ?? []);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  if (best !== -1) return best;

  /* No recognisable heading anywhere. If the first non-empty row reads as
     data, the sheet is headerless; otherwise treat it as an unknown header. */
  const first = grid.findIndex((r) => (r ?? []).some((c) => text(c) !== ""));
  if (first === -1) return -1;
  const looksLikeData = (grid[first] ?? []).some((c) => readTime(c) !== null);
  return looksLikeData ? -1 : first;
}

/** What the values in one column look like, over a sample of the data rows. */
interface ColumnShape {
  index: number;
  filled: number;
  times: number;
  numbers: number;
  distinct: number;
  averageLength: number;
  spaces: number;
}

function shapeOf(index: number, dataRows: unknown[][]): ColumnShape {
  const values = dataRows.slice(0, 60).map((r) => (r ?? [])[index]);
  const filledValues = values.filter((v) => text(v) !== "");
  const seen = new Set(filledValues.map((v) => text(v)));
  return {
    index,
    filled: filledValues.length,
    times: filledValues.filter((v) => readTime(v) !== null).length,
    numbers: filledValues.filter((v) => readMinutes(v) !== null).length,
    distinct: seen.size,
    averageLength: filledValues.length
      ? filledValues.reduce((total: number, v) => total + text(v).length, 0) / filledValues.length
      : 0,
    spaces: filledValues.filter((v) => /\s/.test(text(v))).length,
  };
}

/**
 * Which column is which.
 *
 * Names first, then SHAPES. A column called nothing the alias list recognises
 * is not a missing column — it is a column whose heading this park has not met
 * before, and what its values look like says what it is: three columns of
 * clock times in reading order are the arrival, the start and the departure; a
 * column of bare numbers beside them is the delay; the most nearly unique
 * short text is the identifier; text with spaces in it is a person's name; and
 * text that repeats is the department, because departments are what a roster
 * has many people in.
 *
 * Anything still unfound is left at -1 and filled in per row.
 */
export function resolveColumns(header: unknown[], dataRows: unknown[][]): ColumnMap {
  const map = {} as ColumnMap;
  for (const key of COLUMN_KEYS) map[key] = -1;

  const normalised = header.map((h) => normaliseHeader(text(h)));
  const taken = new Set<number>();
  for (const col of COLUMNS) {
    const index = normalised.findIndex(
      (h, i) => h.length > 0 && !taken.has(i) && col.aliases.includes(h),
    );
    if (index !== -1) { map[col.key] = index; taken.add(index); }
  }

  const width = Math.max(header.length, ...dataRows.slice(0, 60).map((r) => (r ?? []).length), 0);
  const free: ColumnShape[] = [];
  for (let i = 0; i < width; i++) {
    if (taken.has(i)) continue;
    const shape = shapeOf(i, dataRows);
    if (shape.filled > 0) free.push(shape);
  }
  const claim = (key: keyof DatasetRow, shape: ColumnShape | undefined) => {
    if (!shape) return;
    map[key] = shape.index;
    const at = free.indexOf(shape);
    if (at !== -1) free.splice(at, 1);
  };

  /* Times, left to right, into whichever of the three are still missing. */
  const timeColumns = free
    .filter((s) => s.times / s.filled >= 0.7)
    .sort((a, b) => a.index - b.index);
  for (const key of ["checkIn", "workStart", "checkOut"] as const) {
    if (map[key] !== -1) continue;
    claim(key, timeColumns.find((s) => free.includes(s)));
  }

  /* A column of plain counts, not clock times, is the delay. */
  if (map.delayMinutes === -1) {
    claim(
      "delayMinutes",
      free
        .filter((s) => s.numbers / s.filled >= 0.7 && s.times / s.filled < 0.7)
        .sort((a, b) => a.index - b.index)[0],
    );
  }

  const wordy = free.filter((s) => s.numbers / s.filled < 0.7);

  /* The identifier: near-unique, short, and rarely has a space in it. */
  if (map.id === -1) {
    claim(
      "id",
      [...wordy]
        .filter((s) => s.distinct / s.filled >= 0.9 && s.spaces / s.filled < 0.5)
        .sort((a, b) => a.averageLength - b.averageLength || a.index - b.index)[0],
    );
  }

  /* The name: a person's, so it usually has a space and is rarely repeated. */
  if (map.name === -1) {
    claim(
      "name",
      free
        .filter((s) => s.numbers / s.filled < 0.7)
        .sort(
          (a, b) =>
            b.spaces / b.filled - a.spaces / a.filled ||
            b.distinct / b.filled - a.distinct / a.filled ||
            a.index - b.index,
        )[0],
    );
  }

  /* The department: text that repeats, because a roster has teams in it. */
  if (map.department === -1) {
    claim(
      "department",
      free
        .filter((s) => s.numbers / s.filled < 0.7)
        .sort((a, b) => a.distinct / a.filled - b.distinct / b.filled || a.index - b.index)[0],
    );
  }

  return map;
}

/* ---------------- Grid -> rows ---------------- */

/**
 * Turn a grid of cells — from any format — into dataset rows.
 *
 * NEVER THROWS FOR A CELL. Each field falls back to the rest of its own row
 * and then to a sensible default, so one unreadable time or one blank name
 * costs that field and nothing else. A row is only dropped when it carries no
 * usable content at all.
 */
export function rowsFromGrid(grid: unknown[][], notes: string[] = []): DatasetRow[] {
  const headerRow = findHeaderRow(grid);
  const dataRows = grid.slice(headerRow + 1).filter((r) => (r ?? []).some((c) => text(c) !== ""));
  if (!dataRows.length) return [];

  const columns = resolveColumns(headerRow === -1 ? [] : grid[headerRow] ?? [], dataRows);

  const guessed = COLUMNS.filter((c) => {
    if (columns[c.key] === -1) return false;
    const heading = normaliseHeader(text((grid[headerRow] ?? [])[columns[c.key]]));
    return !c.aliases.includes(heading);
  }).map((c) => c.label);
  if (guessed.length) notes.push(`Read by column shape: ${guessed.join(", ")}`);

  const missing = COLUMNS.filter((c) => columns[c.key] === -1).map((c) => c.label);
  if (missing.length) notes.push(`Filled in: ${missing.join(", ")}`);

  const cellAt = (cells: unknown[], index: number) => (index === -1 ? "" : cells[index]);
  const out: DatasetRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i] ?? [];
    /* The row number the user sees in their spreadsheet, not the array index. */
    const number = out.length + 1;

    /*
     * The three times and the delay are solved TOGETHER, because they
     * constrain each other: a sheet may record any two of them and leave the
     * third implied, and every combination is a roster somebody keeps.
     */
    const readCheckIn = readTime(cellAt(cells, columns.checkIn));
    const readStart = readTime(cellAt(cells, columns.workStart));
    const readOut = readTime(cellAt(cells, columns.checkOut));
    const readDelay = readMinutes(cellAt(cells, columns.delayMinutes));

    let checkIn = readCheckIn;
    let workStart = readStart;
    let delay = readDelay;

    if (checkIn === null && workStart !== null && delay !== null) checkIn = workStart - delay;
    if (workStart === null && checkIn !== null && delay !== null) workStart = checkIn + delay;
    if (checkIn === null) checkIn = workStart ?? DEFAULT_CHECK_IN;
    if (workStart === null) workStart = checkIn + Math.max(0, delay ?? 0);
    if (delay === null) delay = workStart - checkIn;

    const checkOut = readOut ?? workStart + DEFAULT_WORKDAY_MINUTES;

    out.push({
      id: text(cellAt(cells, columns.id)) || `EMP${String(number).padStart(4, "0")}`,
      name: text(cellAt(cells, columns.name)) || `Employee ${number}`,
      department: text(cellAt(cells, columns.department)) || "General",
      checkIn,
      delayMinutes: delay,
      workStart,
      checkOut,
    });
  }

  return out;
}

/* ---------------- The entry point ---------------- */

function looksLikeWorkbook(bytes: Uint8Array): boolean {
  /* PK.. is a zip, which is what .xlsx and .ods are; D0CF11E0 is old .xls. */
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return true;
  return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
}

/** Grids from every worksheet, best first — most data rows wins. */
function gridsFromWorkbook(
  XLSX: typeof import("xlsx"),
  buffer: ArrayBuffer,
): { name: string; grid: unknown[][] }[] {
  const book = XLSX.read(buffer, { type: "array", cellDates: true });
  return book.SheetNames.map((name) => ({
    name,
    grid: XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], {
      header: 1,
      blankrows: false,
      defval: "",
    }),
  }));
}

/**
 * Read an uploaded file into dataset rows.
 *
 * FORMAT COMES FROM THE BYTES. An extension is a naming convention, not a
 * fact about a file: a roster exported by a payroll system arrives as .txt or
 * .tsv as often as .csv, an .xls from an old system is frequently really an
 * HTML table, and a file downloaded from a browser may have no extension at
 * all. Each of those used to be handed straight back.
 *
 * SheetJS is imported only when the bytes actually look like a workbook, so
 * the park page never pays for a spreadsheet parser it may never use — the 3D
 * scene is what the entrance is for, and it should not wait on this bundle.
 */
export async function parseEmployeeFile(file: File): Promise<ParsedUpload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const notes: string[] = [];

  if (looksLikeWorkbook(bytes)) {
    const XLSX = await import("xlsx");
    const sheets = gridsFromWorkbook(XLSX, buffer);

    /*
     * EVERY WORKSHEET, not the first. A workbook whose first tab is a cover
     * sheet, a chart or a pivot is completely ordinary, and reading only sheet
     * one rejected the roster sitting on sheet two. The sheet that yields the
     * most employees is the roster.
     */
    let best: { name: string; rows: DatasetRow[]; notes: string[] } | null = null;
    for (const sheet of sheets) {
      const sheetNotes: string[] = [];
      const rows = rowsFromGrid(sheet.grid, sheetNotes);
      if (!best || rows.length > best.rows.length) {
        best = { name: sheet.name, rows, notes: sheetNotes };
      }
    }
    if (best && best.rows.length) {
      if (sheets.length > 1) notes.push(`Read the "${best.name}" sheet`);
      notes.push(...best.notes);
      return { rows: best.rows, notes };
    }
    /* A workbook with nothing readable in it still gets the text attempt. */
  }

  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const delimiter = detectDelimiter(decoded);
  const textRows = rowsFromGrid(parseCsv(decoded, delimiter), notes);
  if (textRows.length) {
    if (delimiter !== ",") {
      notes.push(`Read as ${delimiter === "\t" ? "tab" : `"${delimiter}"`}-separated text`);
    }
    return { rows: textRows, notes };
  }

  /*
   * Last resort: hand the bytes to SheetJS whatever they are. It reads HTML
   * tables, DIF, PRN and several other things people call a spreadsheet.
   */
  try {
    const XLSX = await import("xlsx");
    for (const sheet of gridsFromWorkbook(XLSX, buffer)) {
      const rows = rowsFromGrid(sheet.grid, notes);
      if (rows.length) return { rows, notes };
    }
  } catch {
    /* Nothing readable in it; fall through to the one honest failure. */
  }

  throw new EmployeeUploadError(
    `There is no table of employees in "${file.name}" — it holds no rows this park can read.`,
  );
}
