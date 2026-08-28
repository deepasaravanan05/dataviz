"use client";

import { useFrame } from "@react-three/fiber";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { currentSimTime } from "@/simulation/journey/clock";
import { sampleJourney } from "@/simulation/journey/journey";
import { useFoodCourtStore } from "@/store/foodCourtStore";

/**
 * WHO IS IN THE FOOD COURT, this instant.
 *
 * Read off the same journey the figures on screen are walking, from the same
 * frame clock, with the same `sampleJourney()` — so the list is not a parallel
 * account of the food court, it IS the food court. An employee appears in it
 * the moment their figure steps through the door and vanishes the moment it
 * steps back out, because both answers come from the same call.
 *
 * ONLY THE SIMULATED CLOCK IS CONSULTED, never a real-world timer, so the
 * panel tracks correctly at 1x, 5x, 10x and 60x, and a paused park holds a
 * frozen list: `currentSimTime()` stops advancing and the set stops changing.
 *
 * Sorted by the minute each employee entered, so the order in the panel is the
 * order they came through the door.
 *
 * ADD-ONLY: this component renders nothing at all. It is mounted beside the
 * walkers purely because a `useFrame` needs to be inside the canvas, and it
 * writes to one store that no part of the simulation reads.
 */
export function FoodCourtOccupancy() {
  const setOccupants = useFoodCourtStore((s) => s.setOccupants);

  useFrame(() => {
    const simTime = currentSimTime();
    const employees = useActiveJourneyStore.getState().employees;

    const inside: { id: string; entry: number }[] = [];
    for (const e of employees) {
      /* Nobody without a delay ever goes in, so nobody without one can be in. */
      if (!e.visitsFoodCourt || e.foodCourtEntry === null) continue;
      const at = sampleJourney(e, simTime);
      if (at?.phase !== "IN_FOOD_COURT") continue;
      inside.push({ id: e.id, entry: e.foodCourtEntry });
    }

    inside.sort((a, b) => a.entry - b.entry || (a.id < b.id ? -1 : 1));
    setOccupants(inside.map((i) => i.id));
  });

  return null;
}
