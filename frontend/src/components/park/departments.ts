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
 * The dataset has THIRTEEN departments and the park has five department rides,
 * and the user's standing instruction is that employees whose department has no
 * ride of its own are converted to one of the EXISTING rides — never to a new
 * destination. So every department below lands on one of the five attractions
 * that are already in the park, and several of them share.
 *
 * WHAT THE SIGNS SAY IS A SEPARATE QUESTION. The user gave the park its own
 * names for two of the rides — the Roller Coaster is "Testing" and the Ferris
 * Wheel is "Developers" — and those live in RIDE_SIGN_NAME below. They are
 * DISPLAY names only. The mapping here, the dataset rows, and every place a
 * PERSON's own department is shown are untouched, so a "testing" employee
 * rides the Roller Coaster and still reads as "testing" in the employee panel,
 * the food court list and the dashboard table.
 *
 * No ride is added, removed, moved or resized to fit a department. If a future
 * roster brings a fourteenth department it joins an existing ride here, and
 * nothing in the park changes.
 */

/**
 * The ids the park layout uses for the attractions employees are routed to.
 *
 * The Giga Coaster joined them at the user's word — "the devops employees only
 * go and sit on the giga coaster ride". It was already standing on its own ring
 * slot as an attraction nobody boarded; it did not move, resize or change to
 * take the department. What it gained is a place in `PARK_LAYOUT`, seat poses,
 * a boarding stair and the stop-load-run-unload schedule the other five have.
 */
export type DepartmentRideId = "coaster" | "dragon" | "ferris" | "ufo" | "monster" | "giga";

/** One department, spelled exactly as the dataset spells it. */
export interface DepartmentInfo {
  department: string;
  rideId: DepartmentRideId;
  rideName: string;
}

/**
 * WHERE EACH DEPARTMENT RIDES. Written out, never shuffled.
 *
 * NO RIDE ASSIGNMENT WAS CHANGED to make this table. It is the mapping the park
 * already had, applied to the workbook's own spelling of the same departments,
 * plus `resolveDepartmentRides`'s own round-robin for the ones the park had
 * never heard of — written out rather than computed so that a department's
 * destination cannot depend on which date happens to be on screen.
 *
 * THE SIX THE PARK ALREADY KNEW keep exactly the ride they had. The workbook
 * writes them in lower case and in short form, and two of them are named by the
 * ride signs the user chose rather than by the old dataset's wording:
 *
 *   dev         -> ferris   the wheel's own sign reads "Developers"
 *   testing     -> coaster  the coaster's own sign reads "Testing"
 *   cyber       -> dragon   was "Cyber Security"
 *   erp         -> monster  was "ERP"
 *   data        -> ufo      was "Data Engineering"
 *   it support  -> ferris   was "IT Support"
 *   design      -> ferris   was "UI/UX", which shared the wheel then too
 *
 * DEVOPS WAS GIVEN A RIDE OF ITS OWN — the Giga Coaster, at the user's word.
 * It is the only department here that was not absorbed into a ride that already
 * had one, and it took nothing from the park to do it: the Giga Coaster was
 * already standing on its own ring slot with nobody riding it.
 *
 * THE FIVE OTHERS THAT ARE NEW — risk, pm, ml, admin, finance — are absorbed by
 * the existing attractions in the order they first appear in the workbook,
 * round-robin through RIDE_ORDER, which is precisely what
 * `resolveDepartmentRides` below does with a department it does not recognise.
 * Nothing is renamed, moved or resized to carry them.
 */
const DEPARTMENT_MAPPING: Record<string, DepartmentRideId> = {
  /* The departments the park already served, in the workbook's spelling. */
  dev: "ferris",
  testing: "coaster",
  cyber: "dragon",
  erp: "monster",
  data: "ufo",
  "it support": "ferris",
  design: "ferris",

  /*
   * DEVOPS RIDES THE GIGA COASTER. Asked for by name — "the giga coaster is
   * for devops team", and confirmed as real boarding rather than a signboard:
   * "the devops employees only go and sit on the giga coaster ride". It is the
   * one department here that was given its ride rather than absorbed into one.
   */
  devops: "giga",

  /* New departments, absorbed by existing rides in first-seen order. */
  risk: "dragon",
  pm: "ferris",
  ml: "ufo",
  admin: "monster",
  finance: "coaster",
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

/**
 * Rides that announce a name of the user's choosing rather than the department
 * names underneath them.
 *
 * The Roller Coaster is signed "Testing" and the Ferris Wheel "Developers" —
 * the names the user gave them — and both now serve the workbook department of
 * that name as well as the others sharing the ride. The other three carry their
 * departments' own names, so they are absent here and fall through to the join
 * below.
 *
 * Nothing that counts, colours, seats or routes an employee reads this map, so
 * a ride's roster, its queue and its arithmetic are identical either way.
 */
const RIDE_SIGN_NAME: Partial<Record<DepartmentRideId, string>> = {
  coaster: "Testing",
  ferris: "Developers",
};

/**
 * What a ride prints as its department — its sign name if it has one, else its
 * departments joined the way every surface in the park joins them.
 *
 * Takes the department list as an argument so the live roster (an upload can
 * rename or re-split a department) resolves through exactly the same rule as
 * the built-in dataset does. This is the single rule; no surface joins names
 * for itself, or the plaza sign and the click-through panel would disagree
 * after an upload.
 */
export function departmentDisplayName(rideId: DepartmentRideId, departments: string[]): string {
  return RIDE_SIGN_NAME[rideId] ?? departments.join(" · ");
}

/** A ride together with every department it serves. */
export interface DepartmentRide {
  rideId: DepartmentRideId;
  /** All departments this ride serves, in dataset order. */
  departments: string[];
  /** What signs and panels print: the ride's sign name, else its departments joined. */
  department: string;
  /** The ride's existing name, taken from the park layout. */
  rideName: string;
}

/**
 * The routing destinations, in the order the park has always listed them, with
 * the Giga Coaster appended.
 *
 * APPENDED RATHER THAN INSERTED, deliberately. This order is what
 * `resolveDepartmentRides` deals unknown departments round-robin from, so
 * putting the new id anywhere but the end would silently re-home departments
 * that already have a ride.
 */
export const RIDE_ORDER: DepartmentRideId[] = [
  "coaster",
  "dragon",
  "ferris",
  "ufo",
  "monster",
  "giga",
];

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
    department: departmentDisplayName(rideId, departments),
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
  /* Every department the workbook contains has a destination, and every
     destination is a ride that was already in the park. The COUNT is the
     dataset's business, not this module's — it was six and is now thirteen —
     so what is asserted is the property, not the number. */
  console.assert(
    DEPARTMENTS.length === DATASET_DEPARTMENTS.length,
    `Expected every dataset department to be mapped, found ${DEPARTMENTS.length} of ${DATASET_DEPARTMENTS.length}`,
  );
  console.assert(
    DEPARTMENTS.every((d) => RIDE_ORDER.includes(d.rideId)),
    "A department is mapped to a ride the park does not have",
  );
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
