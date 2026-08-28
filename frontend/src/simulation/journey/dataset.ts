/**
 * The employee attendance dataset, exactly as supplied.
 *
 * These 30 rows are the source of truth for the whole journey simulation:
 * names, IDs, departments, check-in times, delays, actual work-start times and
 * check-out times are used verbatim — nothing here is generated, renamed or
 * re-timed. The journey builder derives movement to FIT these times; it never
 * adjusts them.
 *
 * Transcribed from `attendance_data.xlsx`, sheet "30 Employees": six
 * departments of five people each, fifteen of whom arrived to a delayed work
 * start and fifteen of whom started the moment they checked in. The delay is
 * what decides the whole shape of a person's morning — a delayed employee
 * spends it sitting in the food court, an on-time one walks straight to their
 * department ride — so `delayMinutes: 0` is not a missing value here, it is
 * the "No Delay" the sheet spells out.
 *
 * Each row is `[id, name, department, checkIn, delayMinutes, workStart,
 * checkOut]` with times in the sheet's own "HH:MM AM" spelling, parsed once
 * below. The verify suite asserts `delay === workStart - checkIn` on every row.
 */

export interface DatasetRow {
  id: string;
  name: string;
  department: string;
  /** Check-in, in minutes of day. */
  checkIn: number;
  delayMinutes: number;
  /** Actual work start, in minutes of day. */
  workStart: number;
  /** Check-out at the end of the working day, in minutes of day. */
  checkOut: number;
}

type RawRow = [string, string, string, string, number, string, string];

const RAW: RawRow[] = [
  ["EMP1001", "Karthik Sharma", "IT Support", "09:33 AM",  0, "09:33 AM", "06:18 PM"],
  ["EMP1002", "Krishna Iyer", "Cyber Security", "09:43 AM",  0, "09:43 AM", "07:10 PM"],
  ["EMP1003", "Riya Sharma", "ERP", "10:45 AM",  6, "10:51 AM", "07:26 PM"],
  ["EMP1004", "Reyansh Nair", "Tech", "10:34 AM",  0, "10:34 AM", "07:39 PM"],
  ["EMP1005", "Reyansh Gupta", "Data Engineering", "10:23 AM", 42, "11:05 AM", "07:52 PM"],
  ["EMP1006", "Priya Kumar", "UI/UX", "09:50 AM",  0, "09:50 AM", "06:41 PM"],
  ["EMP1007", "Ishaan Iyer", "IT Support", "09:57 AM",  0, "09:57 AM", "06:48 PM"],
  ["EMP1008", "Vivaan Sharma", "Cyber Security", "10:18 AM", 27, "10:45 AM", "07:53 PM"],
  ["EMP1009", "Ishaan Kumar", "ERP", "10:28 AM", 29, "10:57 AM", "07:32 PM"],
  ["EMP1010", "Riya Reddy", "Tech", "10:16 AM",  9, "10:25 AM", "06:57 PM"],
  ["EMP1011", "Naveen Nair", "Data Engineering", "10:07 AM",  0, "10:07 AM", "07:31 PM"],
  ["EMP1012", "Krishna Sharma", "UI/UX", "10:18 AM", 45, "11:03 AM", "08:26 PM"],
  ["EMP1013", "Diya Iyer", "IT Support", "10:17 AM", 22, "10:39 AM", "07:53 PM"],
  ["EMP1014", "Meena Sharma", "Cyber Security", "09:51 AM", 20, "10:11 AM", "06:51 PM"],
  ["EMP1015", "Myra Menon", "ERP", "10:04 AM",  0, "10:04 AM", "07:14 PM"],
  ["EMP1016", "Suresh Gupta", "Tech", "09:58 AM",  0, "09:58 AM", "07:21 PM"],
  ["EMP1017", "Manoj Kumar", "Data Engineering", "09:59 AM",  0, "09:59 AM", "07:20 PM"],
  ["EMP1018", "Ananya Menon", "UI/UX", "10:04 AM", 41, "10:45 AM", "08:11 PM"],
  ["EMP1019", "Suresh Rao", "IT Support", "09:57 AM",  0, "09:57 AM", "06:52 PM"],
  ["EMP1020", "Pooja Pillai", "Cyber Security", "09:48 AM", 20, "10:08 AM", "07:25 PM"],
  ["EMP1021", "Riya Gupta", "ERP", "10:03 AM",  0, "10:03 AM", "07:00 PM"],
  ["EMP1022", "Pooja Verma", "Tech", "10:21 AM", 13, "10:34 AM", "07:36 PM"],
  ["EMP1023", "Anika Sharma", "Data Engineering", "09:36 AM",  0, "09:36 AM", "06:15 PM"],
  ["EMP1024", "Karthik Iyer", "UI/UX", "10:24 AM", 29, "10:53 AM", "07:47 PM"],
  ["EMP1025", "Ishita Pillai", "IT Support", "10:37 AM", 40, "11:17 AM", "08:42 PM"],
  ["EMP1026", "Aarav Sharma", "Cyber Security", "10:38 AM",  0, "10:38 AM", "07:57 PM"],
  ["EMP1027", "Karthik Rao", "ERP", "09:44 AM", 15, "09:59 AM", "06:58 PM"],
  ["EMP1028", "Aarav Reddy", "Tech", "10:34 AM",  0, "10:34 AM", "07:36 PM"],
  ["EMP1029", "Sneha Reddy", "Data Engineering", "10:34 AM",  0, "10:34 AM", "07:13 PM"],
  ["EMP1030", "Meena Kumar", "UI/UX", "10:11 AM", 12, "10:23 AM", "07:52 PM"],
];

/** Parse the sheet's "HH:MM AM" spelling into minutes of day. */
export function parseClockTime(text: string): number {
  const m = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(text);
  if (!m) throw new Error(`Unparseable time in dataset: "${text}"`);
  const hours = (Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0);
  return hours * 60 + Number(m[2]);
}

export const EMPLOYEE_DATASET: DatasetRow[] = RAW.map(
  ([id, name, department, checkIn, delayMinutes, workStart, checkOut]) => ({
    id,
    name,
    department,
    checkIn: parseClockTime(checkIn),
    delayMinutes,
    workStart: parseClockTime(workStart),
    checkOut: parseClockTime(checkOut),
  }),
);

/** Every department name that appears in the dataset, in first-seen order. */
export const DATASET_DEPARTMENTS: string[] = EMPLOYEE_DATASET.reduce<string[]>(
  (list, row) => (list.includes(row.department) ? list : [...list, row.department]),
  [],
);
