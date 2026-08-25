"use client";

import { MainGate } from "@/components/main-gate/MainGate";
import { FoodCourt } from "@/components/food-court/FoodCourt";
import { Employees } from "./Employees";
import { JourneyClock } from "./JourneyClock";

/**
 * The employee journey layer: one main entrance gate, one food court, and the
 * animated staff walking check-in → park → (food court) → department ride.
 *
 * ADD-ONLY. Everything here lives in unscaled world space alongside the rides
 * and never inside a ride's group, so no existing model, position, size,
 * animation or colour is touched.
 */
export function ParkJourney() {
  return (
    <group>
      <JourneyClock />
      <MainGate />
      <FoodCourt />
      <Employees />
    </group>
  );
}
