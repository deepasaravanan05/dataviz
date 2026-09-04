import { create } from "zustand";
import { DEPARTMENTS, resolveDepartmentRides } from "@/components/park/departments";
import {
  ATTENDANCE_DATES,
  DAY_OF_DATE,
  DEFAULT_DATE,
  rowsForDate,
  type DatasetRow,
} from "@/simulation/journey/dataset";
import { BUILTIN_JOURNEY, buildJourney, type JourneyData } from "@/simulation/journey/journey";
import { activateJourney } from "@/simulation/journey/activeJourney";
import {
  EmployeeUploadError,
  parseEmployeeFile,
} from "@/simulation/journey/employeeUpload";
import { repairRoster } from "@/simulation/journey/rosterRepair";

/**
 * Which employee roster the park is showing, and the state of any upload.
 *
 * A store of its own, exactly like `journeyStore`. The rides never read it —
 * their seat simulation is untouched by the roster — but the employee journey
 * DOES: a successful upload is pushed through the pure `buildJourney()` and
 * activated via `activateJourney()`, which swaps the walking figures, the
 * timeline range, the HUD counts and the ride sign lettering all at once.
 *
 * THE UPLOAD ACCEPTS THE FILE. `buildJourney` is still strict — it throws on
 * any roster it cannot honestly animate — but it is no longer what an uploaded
 * file is judged by, because a spreadsheet somebody keeps by hand breaks those
 * rules constantly and innocently. `repairRoster` runs first and hands the
 * builder rows that satisfy its contract, so what used to come back as an
 * error about turnstile dwell now comes back as a park, plus a line saying how
 * many arrivals had to be spaced out to make it one.
 *
 * The swap is still transactional: the build is caught HERE, before
 * `activateJourney` runs, so nothing can leave the park half-swapped.
 */
export type UploadStatus = "idle" | "loading" | "ready" | "error";

/**
 * WHICH DATE THE PARK IS ANIMATING, and the build for it.
 *
 * The workbook holds 49 working days and the park shows one of them at a time,
 * because a date is what a working morning is. `buildJourney` is pure, so a
 * date change is simply another build pushed through the same `activateJourney`
 * an upload uses — and builds are remembered, so going back to a date already
 * watched is instant.
 */
const BUILDS = new Map<string, JourneyData>([[DEFAULT_DATE, BUILTIN_JOURNEY]]);

function journeyForDate(date: string): JourneyData {
  const cached = BUILDS.get(date);
  if (cached) return cached;
  const built = buildJourney(rowsForDate(date));
  BUILDS.set(date, built);
  return built;
}

interface EmployeeDataState {
  status: UploadStatus;
  /** The Date (IST) the park is animating, "YYYY-MM-DD". */
  date: string;
  /** The uploaded file's name, shown next to the control once it is read. */
  fileName: string | null;
  /** Parsed rows, or null while the built-in dataset is in use. */
  rows: DatasetRow[] | null;
  error: string | null;
  /**
   * What the reader had to guess and what the roster had to be repaired to do.
   *
   * NOT ERRORS. Every one of these is something the upload absorbed rather
   * than refused — a column recognised by the shape of its values, a repeated
   * ID made unique, arrivals spaced out to clear the turnstiles — and the
   * panel shows them so the absorbing is visible instead of silent.
   */
  notes: string[];

  upload: (file: File) => Promise<void>;
  /** Show another date out of the workbook. Drops any upload. */
  selectDate: (date: string) => void;
  /** Drop the upload and go back to the workbook's own records. */
  reset: () => void;
}

/** Every date the workbook records, and the weekday it fell on. */
export const SIMULATION_DATES = ATTENDANCE_DATES;
export const SIMULATION_DAY_OF_DATE = DAY_OF_DATE;

/** Everything an upload result carries, back to nothing. A function, so each
 *  reset gets its own array rather than sharing one across resets. */
function cleared(): Pick<EmployeeDataState, "fileName" | "rows" | "error" | "notes"> {
  return { fileName: null, rows: null, error: null, notes: [] };
}

export const useEmployeeDataStore = create<EmployeeDataState>((set, get) => ({
  status: "idle",
  date: DEFAULT_DATE,
  ...cleared(),

  selectDate: (date) => {
    if (!ATTENDANCE_DATES.includes(date) || get().date === date) return;
    /*
     * The same swap path as an upload — build, then activate — so the walking
     * figures, the timeline range, the HUD counts and the ride signs all change
     * together and none of them can disagree about who is in the park.
     */
    activateJourney(journeyForDate(date), "builtin");
    set({ status: "idle", date, ...cleared() });
  },

  upload: async (file) => {
    set({ status: "loading", ...cleared(), fileName: file.name });
    try {
      const parsed = await parseEmployeeFile(file);
      /*
       * Parse, REPAIR, build, activate. The repair is what makes the file the
       * park's problem rather than the user's: it settles identity, arithmetic
       * and spacing so the rows meet the builder's contract, and reports what
       * it did instead of refusing. The builder then applies every rule it
       * always has — gate queueing, unique chairs, sit-equals-delay, existing
       * rides only — to an upload exactly as it does to the built-in dataset.
       */
      const repaired = repairRoster(parsed.rows);
      const built = buildJourney(repaired.rows);
      activateJourney(built, "upload");
      set({
        status: "ready",
        fileName: file.name,
        rows: repaired.rows,
        error: null,
        notes: [...parsed.notes, ...repaired.notes, ...unmappedNote(repaired.rows)],
      });
    } catch (err) {
      set({
        status: "error",
        ...cleared(),
        error:
          err instanceof EmployeeUploadError
            ? err.message
            : err instanceof Error && err.message
              ? err.message
              : "Could not read that file.",
      });
    }
  },

  reset: () => {
    set({ status: "idle", ...cleared() });
    // Back to the workbook's own records for whichever date is selected: the
    // same swap path as an upload, and no rebuild if that date has been shown.
    activateJourney(journeyForDate(get().date), "builtin");
  },
}));

/**
 * The roster the park should draw: the upload when one has been read, and the
 * built-in dataset otherwise. This is the function the journey builder calls
 * instead of importing `EMPLOYEE_DATASET` directly, when the swap is wired.
 */
export function activeDataset(): DatasetRow[] {
  const state = useEmployeeDataStore.getState();
  return state.rows ?? rowsForDate(state.date);
}

/**
 * A word about departments the park has never heard of.
 *
 * NOT A WARNING THAT NOBODY HAS ANYWHERE TO GO — it used to read "No ride
 * serves: Finance", which was simply untrue: `resolveDepartmentRides` gives
 * every unknown department one of the five existing attractions, round-robin
 * in first-seen order, because the standing rule is that a department without
 * a ride of its own is absorbed by a ride that exists rather than given a new
 * destination. So the line says which ride took them.
 */
function unmappedNote(rows: DatasetRow[]): string[] {
  const known = new Set(DEPARTMENTS.map((d) => d.department));
  const names = [...new Set(rows.map((r) => r.department))].filter((d) => !known.has(d));
  if (!names.length) return [];
  const rides = resolveDepartmentRides(rows.map((r) => r.department));
  return [names.map((n) => `${n} → ${rides.get(n)!.rideName}`).join(", ")];
}
