import { parseClockTime, type DatasetRow } from "./dataset";

/**
 * Reading an employee roster out of an uploaded spreadsheet.
 *
 * ADD-ONLY, and deliberately a module of its own: nothing here is imported by
 * the journey builder, the rides, the clock or the department panel, so an
 * upload cannot disturb a park that is already running. The one thing this
 * file promises is its RETURN TYPE — it produces `DatasetRow[]`, the exact
 * shape `EMPLOYEE_DATASET` already has, so the parsed roster is a drop-in for
 * the built-in one whenever the swap is wired up. That is the whole point of
 * parsing to the existing type rather than inventing a new one.
 *
 * The built-in dataset stays the source of truth until then: with no file
 * uploaded, nothing in this module ever runs.
 */

/** The formats the single upload control accepts. */
export const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

/** The `accept` attribute for the file input — one control, all three formats. */
export const UPLOAD_ACCEPT = [
  ".xlsx",
  ".xls",
  ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
].join(",");

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function isSupportedFile(fileName: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}

/** A parse that failed for a reason worth showing the user verbatim. */
export class EmployeeUploadError extends Error {}

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
  /** Missing optional columns are filled in rather than rejected. */
  optional?: boolean;
}

const COLUMNS: ColumnSpec[] = [
  { key: "id", label: "Employee ID", aliases: ["employeeid", "empid", "id"] },
  { key: "name", label: "Employee Name", aliases: ["employeename", "name", "empname"] },
  { key: "department", label: "Department", aliases: ["department", "dept"] },
  {
    key: "checkIn",
    label: "Check-in Time",
    aliases: ["checkintime", "checkin", "checkintimestamp"],
  },
  {
    key: "delayMinutes",
    label: "Delay Time",
    aliases: ["delaytime", "delay", "delayminutes", "delaymins"],
  },
  {
    key: "workStart",
    label: "Actual Work Start Time",
    aliases: ["actualworkstarttime", "workstarttime", "workstart", "actualworkstart"],
  },
  {
    key: "checkOut",
    label: "Check-out Time",
    aliases: ["checkouttime", "checkout", "checkedout"],
    /* Optional: a roster that only covers the morning is still a valid roster. */
    optional: true,
  },
];

/** A working day, used when a file carries no check-out column. */
const DEFAULT_WORKDAY_MINUTES = 8 * 60;

function mapColumns(header: unknown[]): Record<keyof DatasetRow, number> {
  const normalised = header.map((h) => normaliseHeader(String(h ?? "")));
  const found = {} as Record<keyof DatasetRow, number>;
  const missing: string[] = [];

  for (const col of COLUMNS) {
    const index = normalised.findIndex((h) => h.length > 0 && col.aliases.includes(h));
    if (index === -1) {
      /* -1 is a real signal downstream: "this column was not in the file". */
      if (col.optional) found[col.key] = -1;
      else missing.push(col.label);
    } else found[col.key] = index;
  }
  if (missing.length) {
    throw new EmployeeUploadError(
      `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
    );
  }
  return found;
}

/* ---------------- Value parsing ---------------- */

/**
 * A clock time, however the file happens to spell it.
 *
 * The built-in dataset's strict "HH:MM AM" parser is tried first so an export
 * of that data round-trips exactly. Beyond it, a spreadsheet may hand over a
 * real time cell — which arrives as a fraction of a day, 0.5 being noon — or a
 * Date, or any of the looser spellings people type.
 */
export function parseUploadTime(value: unknown, label: string, row: number): number {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();

  if (typeof value === "number" && Number.isFinite(value)) {
    /* Excel stores a time as a fraction of a day; a datetime adds whole days. */
    const dayFraction = value - Math.floor(value);
    return Math.round(dayFraction * 24 * 60) % (24 * 60);
  }

  const text = String(value ?? "").trim();
  if (!text) throw new EmployeeUploadError(`Row ${row}: ${label} is empty`);

  try {
    return parseClockTime(text);
  } catch {
    /* Fall through to the tolerant form below. */
  }

  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i.exec(text);
  if (!m) throw new EmployeeUploadError(`Row ${row}: cannot read ${label} "${text}"`);

  const minutes = Number(m[2]);
  let hours = Number(m[1]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem) hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);

  if (hours > 23 || minutes > 59) {
    throw new EmployeeUploadError(`Row ${row}: ${label} "${text}" is not a real time`);
  }
  return hours * 60 + minutes;
}

/** Spellings a sheet uses for "this person was not delayed at all". */
const NO_DELAY = new Set(["nodelay", "none", "nil", "na", "n/a", "-", "--", ""]);

function parseMinutes(value: unknown, row: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);

  const text = String(value ?? "").trim();
  /*
   * "No Delay" is a value, not a blank. The attendance sheet spells zero that
   * way on half its rows, and reading it as an error would reject exactly the
   * employees whose story is that they went straight to work.
   *
   * The wordy-spelling test only applies to text WITHOUT digits: normalising
   * strips digits, so a CSV's plain "18" would otherwise collapse to "" and
   * read as No Delay — every numeric delay in the file silently zeroed.
   */
  if (!/\d/.test(text) && NO_DELAY.has(text.toLowerCase().replace(/[^a-z/-]/g, ""))) return 0;

  /* "12", "12 min", "12 minutes" all mean the same thing. */
  const m = /^(-?\d+(?:\.\d+)?)/.exec(text);
  if (!m) throw new EmployeeUploadError(`Row ${row}: cannot read Delay Time "${text}"`);
  return Math.round(Number(m[1]));
}

function requireText(value: unknown, label: string, row: number): string {
  const text = String(value ?? "").trim();
  if (!text) throw new EmployeeUploadError(`Row ${row}: ${label} is empty`);
  return text;
}

/* ---------------- CSV ---------------- */

/**
 * A CSV reader that understands quoting.
 *
 * Employee names and departments are exactly the fields likely to contain a
 * comma, so splitting on commas alone would silently shift every later column
 * on those rows — a corruption that looks like valid data.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  /* Strip a UTF-8 BOM: Excel writes one, and it would poison the first header. */
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

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
    else if (c === ",") { row.push(field); field = ""; }
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

/* ---------------- Sheet -> rows ---------------- */

/** Turn a grid of cells — from either format — into validated dataset rows. */
export function rowsFromGrid(grid: unknown[][]): DatasetRow[] {
  const header = grid.findIndex((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (header === -1) throw new EmployeeUploadError("The file has no readable rows");

  const columns = mapColumns(grid[header]);
  const out: DatasetRow[] = [];

  for (let i = header + 1; i < grid.length; i++) {
    const cells = grid[i];
    /* Trailing blank rows are ordinary in a spreadsheet, not an error. */
    if (!cells || cells.every((c) => String(c ?? "").trim() === "")) continue;

    /* The row number the user sees in their spreadsheet, not the array index. */
    const rowNumber = i + 1;
    const workStart = parseUploadTime(cells[columns.workStart], "Actual Work Start Time", rowNumber);
    out.push({
      id: requireText(cells[columns.id], "Employee ID", rowNumber),
      name: requireText(cells[columns.name], "Employee Name", rowNumber),
      department: requireText(cells[columns.department], "Department", rowNumber),
      checkIn: parseUploadTime(cells[columns.checkIn], "Check-in Time", rowNumber),
      delayMinutes: parseMinutes(cells[columns.delayMinutes], rowNumber),
      workStart,
      checkOut:
        columns.checkOut === -1
          ? workStart + DEFAULT_WORKDAY_MINUTES
          : parseUploadTime(cells[columns.checkOut], "Check-out Time", rowNumber),
    });
  }

  if (!out.length) throw new EmployeeUploadError("The file has a header but no employee rows");
  return out;
}

/* ---------------- The entry point ---------------- */

/**
 * Read an uploaded file into dataset rows.
 *
 * SheetJS is imported only when an Excel file actually arrives, so the park
 * page never pays for a spreadsheet parser it may never use — the 3D scene is
 * what the entrance is for, and it should not wait on this bundle to start.
 */
export async function parseEmployeeFile(file: File): Promise<DatasetRow[]> {
  const extension = extensionOf(file.name);

  if (!isSupportedFile(file.name)) {
    throw new EmployeeUploadError(
      `Unsupported file type "${extension || file.name}". Upload ${SUPPORTED_EXTENSIONS.join(", ")}.`,
    );
  }

  if (extension === ".csv") {
    return rowsFromGrid(parseCsv(await file.text()));
  }

  const XLSX = await import("xlsx");
  const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });

  /* The first worksheet, as specified — never a guess at which sheet is meant. */
  const firstSheet = book.SheetNames[0];
  if (!firstSheet) throw new EmployeeUploadError("The workbook has no worksheets");

  const grid = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[firstSheet], {
    header: 1,
    blankrows: false,
    defval: "",
  });
  return rowsFromGrid(grid);
}
