"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { seatPosition } from "@/simulation/waypoints";
import type { SeatColor } from "@/types/simulation";

const COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  RED: "#ef4444",
};

/**
 * Each seat subscribes only to its own occupied/color primitives, so a
 * single seat changing doesn't re-render the other 59 (§42 — avoid
 * unnecessary React re-renders).
 */
function SeatMesh({ seatId }: { seatId: string }) {
  const occupied = useSimulationStore(
    (s) => s.ride.seats.find((seat) => seat.id === seatId)?.occupied ?? false,
  );
  const color = useSimulationStore(
    (s) => s.ride.seats.find((seat) => seat.id === seatId)?.color ?? "GREEN",
  );
  const [x, , z] = seatPosition(seatId);

  return (
    <mesh position={[x, 0.25, z]} castShadow>
      <boxGeometry args={[0.55, 0.5, 0.55]} />
      <meshStandardMaterial color={COLOR_HEX[color]} opacity={occupied ? 1 : 0.35} transparent />
    </mesh>
  );
}

export function Seats() {
  const seatIds = useMemo(() => useSimulationStore.getState().ride.seats.map((s) => s.id), []);
  return (
    <group>
      {seatIds.map((id) => (
        <SeatMesh key={id} seatId={id} />
      ))}
    </group>
  );
}
