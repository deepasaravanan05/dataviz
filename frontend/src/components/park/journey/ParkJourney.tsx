"use client";

import { MainGate } from "@/components/main-gate/MainGate";
import { FoodCourt } from "@/components/food-court/FoodCourt";
import { SelectableFoodCourt } from "@/components/food-court/SelectableFoodCourt";
import { BoardingStairs } from "@/components/park/BoardingStairs";
import { Employees } from "./Employees";
import { JourneyClock } from "./JourneyClock";
import { FoodCourtOccupancy } from "./FoodCourtOccupancy";

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
      {/* Clickable, and nothing more: the food court itself is untouched. */}
      <SelectableFoodCourt>
        <FoodCourt />
      </SelectableFoodCourt>
      {/* Publishes who is inside it, off the simulated clock. Renders nothing. */}
      <FoodCourtOccupancy />
      {/* One boarding stair per department ride, beside the ride it serves. */}
      <BoardingStairs />
      <Employees />
    </group>
  );
}
