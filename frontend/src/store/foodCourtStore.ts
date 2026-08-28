import { create } from "zustand";
import { useRideSelectionStore } from "./rideSelectionStore";

/**
 * Whether the food court's panel is open, and who is inside it right now.
 *
 * ADD-ONLY, and a store of its own for the same reason the ride selection has
 * one: nothing in the simulation reads it and nothing here writes to the
 * simulation. Clicking the food court cannot touch the clock, the walkers, the
 * rides or the dataset — the panel is an informational layer over a park that
 * behaves identically whether it is open or not.
 *
 * `occupants` holds employee IDS, not copies of their rows. The dataset stays
 * the single source of truth: the panel looks each id up in the active roster
 * when it draws, so nothing here can drift from it or outlive an upload.
 *
 * It is published from the frame loop ONLY WHEN THE SET CHANGES — see
 * `FoodCourtOccupancy` — so the panel re-renders on somebody walking in or out
 * and at no other time, rather than sixty times a second or on a coarse
 * once-a-minute tick that would leave a diner listed after they had left.
 */
interface FoodCourtState {
  /** True while the food court's panel is open. */
  selected: boolean;
  /** True while the cursor is over the food court. */
  hovered: boolean;
  /** Employee ids currently inside, in the order they walked in. */
  occupants: string[];

  select: () => void;
  clear: () => void;
  setHovered: (hovered: boolean) => void;
  setOccupants: (ids: string[]) => void;
}

export const useFoodCourtStore = create<FoodCourtState>((set, get) => ({
  selected: false,
  hovered: false,
  occupants: [],

  /* Only one panel is ever open: opening this one closes the ride's. */
  select: () => {
    useRideSelectionStore.getState().clear();
    set({ selected: true });
  },

  clear: () => set({ selected: false }),

  setHovered: (hovered) => set({ hovered }),

  /*
   * A no-op unless somebody has actually entered or left. Comparing before
   * setting is what keeps this off the render path: the store is written a
   * couple of dozen times over a simulated day rather than every frame.
   */
  setOccupants: (ids) => {
    const current = get().occupants;
    if (current.length === ids.length && current.every((id, i) => id === ids[i])) return;
    set({ occupants: ids });
  },
}));
