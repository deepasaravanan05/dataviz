/**
 * The employee dataset, exactly as supplied in the brief.
 *
 * These 50 rows are the source of truth for the whole journey simulation:
 * names, IDs, departments, check-in times, delays and actual work-start times
 * are used verbatim — nothing here is generated, renamed or re-timed. The
 * journey builder derives movement to FIT these times; it never adjusts them.
 *
 * Each row is `[id, name, department, checkIn, delayMinutes, workStart]` with
 * times in the brief's own "HH:MM AM" spelling, parsed once below. The verify
 * suite asserts `delay === workStart − checkIn` on every row.
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
}

type RawRow = [string, string, string, string, number, string];

const RAW: RawRow[] = [
  ["EMP001", "Arjun Mehta", "Tech", "09:02 AM", 12, "09:14 AM"],
  ["EMP002", "Priya Sharma", "Finance", "09:05 AM", 18, "09:23 AM"],
  ["EMP003", "Rahul Kumar", "ERP", "09:08 AM", 25, "09:33 AM"],
  ["EMP004", "Sneha Patel", "Cyber Security", "09:12 AM", 31, "09:43 AM"],
  ["EMP005", "Karthik Raj", "Data Engineering", "09:15 AM", 10, "09:25 AM"],
  ["EMP006", "Divya Nair", "IT Support", "09:18 AM", 15, "09:33 AM"],
  ["EMP007", "Vikram Singh", "Operations", "09:21 AM", 22, "09:43 AM"],
  ["EMP008", "Ananya Iyer", "Tech", "09:24 AM", 8, "09:32 AM"],
  ["EMP009", "Rohit Verma", "Finance", "09:27 AM", 20, "09:47 AM"],
  ["EMP010", "Meena Krishnan", "ERP", "09:29 AM", 35, "10:04 AM"],
  ["EMP011", "Sanjay Kumar", "Cyber Security", "09:31 AM", 14, "09:45 AM"],
  ["EMP012", "Kavya Reddy", "Data Engineering", "09:34 AM", 11, "09:45 AM"],
  ["EMP013", "Naveen Raj", "IT Support", "09:36 AM", 27, "10:03 AM"],
  ["EMP014", "Harini S", "Operations", "09:38 AM", 9, "09:47 AM"],
  ["EMP015", "Aditya Sharma", "Tech", "09:40 AM", 30, "10:10 AM"],
  ["EMP016", "Pooja Menon", "Finance", "09:42 AM", 17, "09:59 AM"],
  ["EMP017", "Manoj Kumar", "ERP", "09:44 AM", 24, "10:08 AM"],
  ["EMP018", "Aishwarya R", "Cyber Security", "09:46 AM", 7, "09:53 AM"],
  ["EMP019", "Suresh Babu", "Data Engineering", "09:48 AM", 21, "10:09 AM"],
  ["EMP020", "Keerthana V", "IT Support", "09:50 AM", 13, "10:03 AM"],
  ["EMP021", "Ajay Kumar", "Operations", "09:52 AM", 29, "10:21 AM"],
  ["EMP022", "Swetha R", "Tech", "09:54 AM", 16, "10:10 AM"],
  ["EMP023", "Dinesh Kumar", "Finance", "09:56 AM", 26, "10:22 AM"],
  ["EMP024", "Nithya Raj", "ERP", "09:58 AM", 12, "10:10 AM"],
  ["EMP025", "Praveen S", "Cyber Security", "10:00 AM", 23, "10:23 AM"],
  ["EMP026", "Lakshmi Devi", "Data Engineering", "10:02 AM", 15, "10:17 AM"],
  ["EMP027", "Arun Kumar", "IT Support", "10:04 AM", 20, "10:24 AM"],
  ["EMP028", "Deepak Raj", "Operations", "10:06 AM", 34, "10:40 AM"],
  ["EMP029", "Shalini P", "Tech", "10:08 AM", 6, "10:14 AM"],
  ["EMP030", "Gokul S", "Finance", "10:10 AM", 30, "10:40 AM"],
  ["EMP031", "Riya Kapoor", "ERP", "10:12 AM", 13, "10:25 AM"],
  ["EMP032", "Vishnu Kumar", "Cyber Security", "10:14 AM", 18, "10:32 AM"],
  ["EMP033", "Ramya S", "Data Engineering", "10:16 AM", 16, "10:32 AM"],
  ["EMP034", "Surya Prakash", "IT Support", "10:18 AM", 9, "10:27 AM"],
  ["EMP035", "Monika R", "Operations", "10:20 AM", 17, "10:37 AM"],
  ["EMP036", "Bala Murugan", "Tech", "10:22 AM", 28, "10:50 AM"],
  ["EMP037", "Ishita Sharma", "Finance", "10:24 AM", 14, "10:38 AM"],
  ["EMP038", "Hari Krishnan", "ERP", "10:26 AM", 27, "10:53 AM"],
  ["EMP039", "Swathi Nair", "Cyber Security", "10:28 AM", 11, "10:39 AM"],
  ["EMP040", "Ganesh R", "Data Engineering", "10:30 AM", 22, "10:52 AM"],
  ["EMP041", "Tanya Gupta", "IT Support", "09:07 AM", 19, "09:26 AM"],
  ["EMP042", "Mohan Das", "Operations", "09:16 AM", 12, "09:28 AM"],
  ["EMP043", "Reshma K", "Tech", "09:33 AM", 15, "09:48 AM"],
  ["EMP044", "Akash Verma", "Finance", "09:47 AM", 33, "10:20 AM"],
  ["EMP045", "Bhavya R", "ERP", "10:03 AM", 8, "10:11 AM"],
  ["EMP046", "Rakesh Kumar", "Cyber Security", "10:11 AM", 13, "10:24 AM"],
  ["EMP047", "Sangeetha P", "Data Engineering", "10:19 AM", 20, "10:39 AM"],
  ["EMP048", "Lokesh M", "IT Support", "09:43 AM", 25, "10:08 AM"],
  ["EMP049", "Janani S", "Operations", "09:55 AM", 7, "10:02 AM"],
  ["EMP050", "Yashwanth R", "Tech", "10:27 AM", 18, "10:45 AM"],
];

/** Parse the brief's "HH:MM AM" spelling into minutes of day. */
export function parseClockTime(text: string): number {
  const m = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(text);
  if (!m) throw new Error(`Unparseable time in dataset: "${text}"`);
  const hours = (Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0);
  return hours * 60 + Number(m[2]);
}

export const EMPLOYEE_DATASET: DatasetRow[] = RAW.map(
  ([id, name, department, checkIn, delayMinutes, workStart]) => ({
    id,
    name,
    department,
    checkIn: parseClockTime(checkIn),
    delayMinutes,
    workStart: parseClockTime(workStart),
  }),
);

/** Every department name that appears in the dataset, in first-seen order. */
export const DATASET_DEPARTMENTS: string[] = EMPLOYEE_DATASET.reduce<string[]>(
  (list, row) => (list.includes(row.department) ? list : [...list, row.department]),
  [],
);
