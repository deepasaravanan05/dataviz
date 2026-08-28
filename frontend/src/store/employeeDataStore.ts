import { create } from "zustand";
import { DEPARTMENTS } from "@/components/park/departments";
import { EMPLOYEE_DATASET, type DatasetRow } from "@/simulation/journey/dataset";
import { BUILTIN_JOURNEY, buildJourney } from "@/simulation/journey/journey";
import { activateJourney } from "@/simulation/journey/activeJourney";
import {
  EmployeeUploadError,
  parseEmployeeFile,
} from "@/simulation/journey/employeeUpload";

/**
 * Which employee roster the park is showing, and the state of any upload.
 *
 * A store of its own, exactly like `journeyStore`. The rides never read it —
 * their seat simulation is untouched by the roster — but the employee journey
 * DOES: a successful upload is pushed through the pure `buildJourney()` and
 * activated via `activateJourney()`, which swaps the walking figures, the
 * timeline range, the HUD counts and the ride sign lettering all at once.
 *
 * The swap is transactional. `buildJourney` throws on any roster it cannot
 * honestly animate (inconsistent delay arithmetic, duplicate IDs, a gate lane
 * that cannot admit everyone, a full food court), and the throw is caught
 * HERE, before `activateJourney` runs — so a bad file leaves the park exactly
 * as it was, showing the error next to the upload control instead.
 */
export type UploadStatus = "idle" | "loading" | "ready" | "error";

interface EmployeeDataState {
  status: UploadStatus;
  /** The uploaded file's name, shown next to the control once it is read. */
  fileName: string | null;
  /** Parsed rows, or null while the built-in dataset is in use. */
  rows: DatasetRow[] | null;
  error: string | null;
  /**
   * Departments in the upload that no ride serves. Not fatal — the roster is
   * still parsed and kept — but worth saying, because these are the rows that
   * would have nowhere to walk to once the swap is live.
   */
  unmappedDepartments: string[];

  upload: (file: File) => Promise<void>;
  /** Drop the upload and go back to the built-in dataset. */
  reset: () => void;
}

/** Everything an upload result carries, back to nothing. A function, so each
 *  reset gets its own array rather than sharing one across resets. */
function cleared(): Pick<EmployeeDataState, "fileName" | "rows" | "error" | "unmappedDepartments"> {
  return { fileName: null, rows: null, error: null, unmappedDepartments: [] };
}

export const useEmployeeDataStore = create<EmployeeDataState>((set) => ({
  status: "idle",
  ...cleared(),

  upload: async (file) => {
    set({ status: "loading", ...cleared(), fileName: file.name });
    try {
      const rows = await parseEmployeeFile(file);
      /*
       * The swap itself. The uploaded rows go through the SAME builder the
       * built-in dataset does, so every rule — gate queueing, unique chairs,
       * sit-equals-delay, existing rides only — applies to an upload too. The
       * builder throws on a roster it cannot honestly animate, and in that
       * case `activateJourney` is never reached: the park keeps whatever it
       * was showing.
       */
      const built = buildJourney(rows);
      activateJourney(built, "upload");
      set({
        status: "ready",
        fileName: file.name,
        rows,
        error: null,
        unmappedDepartments: unmappedDepartments(rows),
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
              : "Could not read that file. Check it is a valid spreadsheet.",
      });
    }
  },

  reset: () => {
    set({ status: "idle", ...cleared() });
    // Back to the built-in roster: same swap path as an upload, no rebuild.
    activateJourney(BUILTIN_JOURNEY, "builtin");
  },
}));

/**
 * The roster the park should draw: the upload when one has been read, and the
 * built-in dataset otherwise. This is the function the journey builder calls
 * instead of importing `EMPLOYEE_DATASET` directly, when the swap is wired.
 */
export function activeDataset(): DatasetRow[] {
  return useEmployeeDataStore.getState().rows ?? EMPLOYEE_DATASET;
}

/**
 * Departments present in the upload that the park has no ride for.
 *
 * Checked against the department-to-ride mapping rather than against the
 * built-in roster's department names: the mapping is what actually decides
 * whether an employee has somewhere to walk to, and a name can be perfectly
 * ordinary yet still have no ride behind it.
 */
function unmappedDepartments(rows: DatasetRow[]): string[] {
  const known = new Set(DEPARTMENTS.map((d) => d.department));
  return [...new Set(rows.map((r) => r.department))].filter((d) => !known.has(d));
}
