"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import { useSimulationStore } from "@/store/simulationStore";
import { RIDE_POSITION } from "@/simulation/waypoints";

/**
 * Ride animation is independent of dispatch (§40): the ride always turns,
 * just faster while RUNNING, regardless of whether/when employees board.
 */
export function RideMesh() {
  const topRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!topRef.current) return;
    const status = useSimulationStore.getState().ride.status;
    const spinSpeed = status === "RUNNING" ? 1.4 : 0.15;
    topRef.current.rotation.y += delta * spinSpeed;
  });

  const status = useSimulationStore((s) => s.ride.status);
  const name = useSimulationStore((s) => s.ride.name);
  const queueLength = useSimulationStore((s) => s.ride.queue.length);
  const dispatchCount = useSimulationStore((s) => s.ride.dispatchCount);

  return (
    <group position={RIDE_POSITION}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 1, 16]} />
        <meshStandardMaterial color="#4c1d95" />
      </mesh>
      <mesh ref={topRef} position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[3, 3, 1, 24]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      <Html position={[0, 5.5, 0]} center distanceFactor={16}>
        <div className="whitespace-nowrap rounded-lg bg-black/70 px-3 py-1.5 text-center text-xs text-white shadow">
          <div className="font-semibold">{name}</div>
          <div className="text-white/70">
            {status} &middot; waiting {queueLength} &middot; run #{dispatchCount}
          </div>
        </div>
      </Html>
    </group>
  );
}
