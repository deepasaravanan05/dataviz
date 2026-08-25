import { create } from "zustand";
import {
  departmentFor,
  type DepartmentRide,
  type DepartmentRideId,
} from "@/components/park/departments";

/**
 * Which ride the user has clicked, and which one the cursor is over.
 *
 * ADD-ONLY: a separate store from `useSimulationStore`, so selecting a ride
 * cannot touch the clock, the employees, the queues or the dispatch logic.
 * Nothing in the simulation reads this store, and nothing here writes to the
 * simulation — the panel is purely an informational layer over the park.
 */

interface RideSelectionState {
  /** The single selected ride, or null. Selecting replaces any previous one. */
  selected: DepartmentRide | null;
  /** The ride currently under the cursor, for the hover highlight. */
  hoveredId: DepartmentRideId | null;

  select: (rideId: DepartmentRideId) => void;
  clear: () => void;
  setHovered: (rideId: DepartmentRideId | null) => void;
}

export const useRideSelectionStore = create<RideSelectionState>((set) => ({
  selected: null,
  hoveredId: null,

  // Assigning rather than pushing is what guarantees only one panel is ever
  // open: there is nowhere for a second selection to live.
  select: (rideId) => set({ selected: departmentFor(rideId) }),

  clear: () => set({ selected: null }),

  setHovered: (rideId) => set({ hoveredId: rideId }),
}));
