/**
 * The Park Train's team label.
 *
 * The park's five attractions each stand for a department, and that mapping —
 * `DepartmentRideId` in `departments.ts` — is what the whole simulation is
 * built on: the walking network, the boarding aprons, the stairs, the seat
 * manifests and the dispatch all index by it. The Park Train is deliberately
 * NOT one of those. It is the scenic loop that rings the property, riders
 * board it during their wait, and it never counts as work started.
 *
 * The user's mapping gives the train the DevOps name. That is a LABEL, not a
 * destination: nobody's route changes, no ride moves, and the train is not
 * added to `DepartmentRideId`, to `RIDE_ORDER` or to the park layout — putting
 * a ride whose track encircles the entire park into the footprint and
 * sightline solvers would make every existing ride move to accommodate it.
 *
 * So the name lives here, in the park-composition layer with no dependencies,
 * and the surfaces that show a team name read it from here.
 */

/** The train's own id, kept distinct from every `DepartmentRideId`. */
export const TRAIN_TEAM_ID = "train" as const;
export type TrainTeamId = typeof TRAIN_TEAM_ID;

/** The team the Park Train stands for. */
export const TRAIN_TEAM_NAME = "DevOps";

/** The train's existing name, spelled as the rest of the park spells it. */
export const TRAIN_RIDE_NAME = "Park Train";
