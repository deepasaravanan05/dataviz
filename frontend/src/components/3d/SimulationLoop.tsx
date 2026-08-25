"use client";

import { useFrame } from "@react-three/fiber";
import { useSimulationStore } from "@/store/simulationStore";

/** Non-visual: drives the simulation engine off the render loop's clock. */
export function SimulationLoop() {
  useFrame((_, delta) => {
    // Clamp so a dropped/backgrounded tab doesn't cause a huge time jump.
    useSimulationStore.getState().advance(Math.min(delta, 0.1));
  });
  return null;
}
