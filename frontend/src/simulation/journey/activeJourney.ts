import { create } from "zustand";
import {
  BUILTIN_JOURNEY,
  type JourneyData,
  type JourneyEmployee,
} from "./journey";
import { setJourneyClockBounds } from "./clock";
import { useJourneyStore } from "@/store/journeyStore";
import { useCameraStore } from "@/store/cameraStore";
import type { DepartmentRideId } from "@/components/park/departments";

/**
 * WHICH journey the park is animating right now.
 *
 * The journey builder is pure — `buildJourney(rows)` — and the park boots on
 * the built-in dataset's build. This store is the single switch between that
 * and an uploaded roster's build: every roster-dependent surface (the walking
 * figures, the timeline range, the HUD counts, the ride signs, the employee
 * panel) reads the active journey from here instead of the module constants,
 * so swapping the roster swaps all of them at once and none of them can
 * disagree about who is in the park.
 *
 * `revision` increments on every swap. The figure components key on it, which
 * force-remounts each walker so per-figure animation state (gait phase, eased
 * heading) restarts cleanly rather than carrying over between rosters.
 *
 * Per-frame consumers (`useFrame` loops) must NOT subscribe — they call the
 * plain getters below, exactly as they already read the frame clock.
 */

export type JourneySource = "builtin" | "upload";

interface ActiveJourneyState extends JourneyData {
  source: JourneySource;
  revision: number;
}

export const useActiveJourneyStore = create<ActiveJourneyState>(() => ({
  ...BUILTIN_JOURNEY,
  source: "builtin",
  revision: 0,
}));

/**
 * The one swap path, used by upload and reset alike.
 *
 * Order matters: the clock is re-bounded to the new day BEFORE the journey
 * store resets, so the reset's `resetJourneyClock()` lands on the new
 * roster's first minute rather than the old one's.
 */
export function activateJourney(data: JourneyData, source: JourneySource): void {
  setJourneyClockBounds(data.loopStart, data.loopEnd, data.openingMinute);
  useActiveJourneyStore.setState((s) => ({
    ...data,
    source,
    revision: s.revision + 1,
  }));
  // Selection, hover, pause and speed back to defaults — the person the panel
  // described may not exist in the new roster.
  useJourneyStore.getState().reset();
  useJourneyStore.getState().setHovered(null);
  // And the camera lets go of anyone it was following.
  useCameraStore.getState().release();
}

/** Frame-loop lookup: the active roster's employee, or undefined. */
export function activeEmployeeById(id: string): JourneyEmployee | undefined {
  return useActiveJourneyStore.getState().byId[id];
}

/**
 * The departments the ACTIVE roster sends to a ride, in first-seen order.
 * Signs and panels read this after an upload so the lettering names the
 * people actually walking there.
 */
export function activeDepartmentsForRide(rideId: DepartmentRideId): string[] {
  const out: string[] = [];
  for (const e of useActiveJourneyStore.getState().employees) {
    if (e.rideId === rideId && !out.includes(e.department)) out.push(e.department);
  }
  return out;
}
