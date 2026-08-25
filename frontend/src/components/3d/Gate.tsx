"use client";

import { GATE_POSITION } from "@/simulation/waypoints";

/** Phase 1 has a single entry gate (§4 will add the other three later). */
export function Gate() {
  return (
    <group position={GATE_POSITION}>
      <mesh position={[-1.3, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[1.3, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[3, 0.3, 0.3]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  );
}
