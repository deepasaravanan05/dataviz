import { rideById } from "./layout";
import { DATASET_DEPARTMENTS } from "@/simulation/journey/dataset";

/**
 * Which existing ride each department is served by.
 *
 * ADD-ONLY: this is a lookup laid over the rides that are already in the park.
 * No ride is renamed, moved, resized or duplicated — `rideName` is read back
 * out of the shared park layout, so it can never drift from what the ride is
 * actually called elsewhere in the project.
 *
 * The dataset has SIX departments but the park has five rides, and the user's
 * standing instruction is that employees whose department has no ride of its
 * own are converted to one of the EXISTING rides — never to a new destination.
 * So the four departments with a ride each keep it, and UI/UX shares the
 * Ferris Wheel with IT Support. A shared ride carries both department names on
 * its sign, which is why the Ferris Wheel reads "IT Support · UI/UX".
 *
 * No ride is added, removed, moved or resized to fit a department. If a future
 * roster brings a seventh department it joins an existing ride here, and
 * nothing in the park changes.
 */

/** The ids the park layout already uses for its five attractions. */
export type DepartmentRideId = "coaster" | "dragon" | "ferris" | "tower" | "monster";

/** One department, spelled exactly as the dataset spells it. */
export interface DepartmentInfo {
  department: string;
  rideId: DepartmentRideId;
  rideName: string;
}

const DEPARTMENT_MAPPING: Record<string, DepartmentRideId> = {
  Tech: "coaster",
  "Cyber Security": "dragon",
  ERP: "monster",
  "Data Engineering": "tower",
  "IT Support": "ferris",
  "UI/UX": "ferris",
};

/** Every department, in the dataset's own order. */
export const DEPARTMENTS: DepartmentInfo[] = DATASET_DEPARTMENTS.map((department) => {
  const rideId = DEPARTMENT_MAPPING[department];
  if (!rideId) throw new Error(`Dataset department has no ride assigned: ${department}`);
  return { department, rideId, rideName: rideById(rideId).label };
});

export function rideForDepartment(department: string): DepartmentInfo {
  const found = DEPARTMENTS.find((d) => d.department === department);
  if (!found) throw new Error(`Unknown department: ${department}`);
  return found;
}

/** A ride together with every department it serves. */
export interface DepartmentRide {
  rideId: DepartmentRideId;
  /** All departments this ride serves, in dataset order. */
  departments: string[];
  /** The departments joined for display — what signs and panels print. */
  department: string;
  /** The ride's existing name, taken from the park layout. */
  rideName: string;
}

export const RIDE_ORDER: DepartmentRideId[] = ["coaster", "dragon", "ferris", "tower", "monster"];

/**
 * The department → ride mapping for an ARBITRARY roster, e.g. an upload.
 *
 * Known department names keep exactly the mapping above. A department the park
 * has never heard of still gets a destination — one of the EXISTING five
 * rides, assigned round-robin in the order the unknown names first appear in
 * the roster. That rule is deterministic (the same roster always maps the same
 * way) and honours the standing instruction that extra departments are
 * absorbed by existing rides, never given new destinations.
 */
export function resolveDepartmentRides(departments: string[]): Map<string, DepartmentInfo> {
  const map = new Map<string, DepartmentInfo>();
  let unknownCount = 0;
  for (const department of departments) {
    if (map.has(department)) continue;
    const known = DEPARTMENTS.find((d) => d.department === department);
    if (known) {
      map.set(department, known);
      continue;
    }
    const rideId = RIDE_ORDER[unknownCount % RIDE_ORDER.length];
    unknownCount += 1;
    map.set(department, { department, rideId, rideName: rideById(rideId).label });
  }
  return map;
}

export const RIDE_DEPARTMENTS: DepartmentRide[] = RIDE_ORDER.map((rideId) => {
  const departments = DEPARTMENTS.filter((d) => d.rideId === rideId).map((d) => d.department);
  return {
    rideId,
    departments,
    department: departments.join(" · "),
    rideName: rideById(rideId).label,
  };
});

/** Quick lookup by the layout's ride id. */
export const DEPARTMENT_BY_RIDE: Record<DepartmentRideId, DepartmentRide> = Object.fromEntries(
  RIDE_DEPARTMENTS.map((d) => [d.rideId, d]),
) as Record<DepartmentRideId, DepartmentRide>;

export function departmentFor(rideId: DepartmentRideId): DepartmentRide {
  const found = DEPARTMENT_BY_RIDE[rideId];
  if (!found) throw new Error(`No department mapped to ride: ${rideId}`);
  return found;
}

export function validateDepartments(): void {
  console.assert(DEPARTMENTS.length === 6, `Expected 6 departments, found ${DEPARTMENTS.length}`);
  console.assert(RIDE_DEPARTMENTS.length === 5, `Expected 5 department rides, found ${RIDE_DEPARTMENTS.length}`);
  console.assert(
    RIDE_DEPARTMENTS.every((d) => d.departments.length >= 1),
    "A ride serves no department",
  );
  console.assert(
    RIDE_DEPARTMENTS.every((d) => d.rideName.length > 0),
    "A ride is missing its name from the park layout",
  );
}
