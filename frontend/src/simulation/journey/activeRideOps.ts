import type { DepartmentRideId } from "@/components/park/departments";
import { useActiveJourneyStore } from "./activeJourney";
import { currentSimTime } from "./clock";
import {
  occupiedSeatsAt,
  rideAnimationSecondsAt,
  rideStateAt,
  seatedCountAt,
  type RideState,
} from "./rideOps";

/**
 * The ride-operations view of whatever journey the park is animating.
 *
 * The rides themselves need three answers, sixty times a second: how far
 * through its own animation am I, what state am I in, and which of my seats
 * has a real employee in it. All three are functions of the active roster's
 * schedule and the simulated minute, so this module is a set of plain getters
 * over the two the park already holds — the active journey and the frame
 * clock — rather than any state of its own.
 *
 * Nothing here subscribes to React. A `useFrame` loop calls these exactly the
 * way it already calls `currentSimTime()`.
 */

function scheduleFor(rideId: DepartmentRideId) {
  return useActiveJourneyStore.getState().rideSchedules[rideId];
}

/**
 * The ride's own animation clock, in seconds, at the minute now showing.
 *
 * Zero whenever the ride is not running — which is, by construction, the pose
 * its seats are boarded from. A ride is therefore genuinely stopped between
 * dispatches rather than frozen part-way round.
 */
export function rideAnimationSecondsNow(rideId: DepartmentRideId): number {
  return rideAnimationSecondsAt(scheduleFor(rideId), currentSimTime());
}

export function rideStateNow(rideId: DepartmentRideId): RideState {
  return rideStateAt(scheduleFor(rideId), currentSimTime());
}

export function seatedCountNow(rideId: DepartmentRideId): number {
  return seatedCountAt(scheduleFor(rideId), currentSimTime());
}

/**
 * The seats a real employee is in at this minute.
 *
 * Every ride is built with its own sixty seated figures, which is part of the
 * ride's design and stays exactly as it is. While one of those seats is taken
 * by an employee walking the dataset's journey, the ride's own figure in it
 * steps aside — otherwise two people would occupy one seat.
 */
export function occupiedSeatsNow(rideId: DepartmentRideId): number[] {
  return occupiedSeatsAt(scheduleFor(rideId), currentSimTime());
}
