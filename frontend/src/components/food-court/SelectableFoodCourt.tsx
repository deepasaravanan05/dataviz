"use client";

import type { ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useFoodCourtStore } from "@/store/foodCourtStore";

/**
 * Makes the food court clickable without touching it.
 *
 * ADD-ONLY, and the same pattern `SelectableRide` already uses for the rides:
 * this wraps the existing group and does nothing but listen. React Three Fiber
 * events bubble up from descendant meshes, so a click anywhere on the hall, the
 * terrace, a kiosk or a table reaches this wrapper — the food court's model,
 * position, height, colours and layout are rendered exactly as they were, and
 * not one line inside `FoodCourt.tsx` changes.
 */
export function SelectableFoodCourt({ children }: { children: ReactNode }) {
  const select = useFoodCourtStore((s) => s.select);
  const setHovered = useFoodCourtStore((s) => s.setHovered);

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        /* Without this the click also counts as a miss on whatever is behind. */
        e.stopPropagation();
        select();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}
