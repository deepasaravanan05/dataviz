"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { useSimulationStore } from "@/store/simulationStore";
import { getTargetPosition, SPAWN_POSITION } from "@/simulation/waypoints";
import { formatSimTime, formatDelay } from "@/simulation/clock";
import type { SeatColor } from "@/types/simulation";

const STATUS_HEX: Record<SeatColor, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  RED: "#ef4444",
};

/**
 * The engine (§simulation/engine.ts) is the sole source of truth for state
 * and position targets. This component only interpolates the visual mesh
 * smoothly toward that target every frame (§13 — backend decides state,
 * frontend animates), reading the store imperatively to avoid a React
 * re-render on every one of the ~60 position updates per second.
 */
export function EmployeeAvatar({ employeeId }: { employeeId: string }) {
  const groupRef = useRef<Group>(null);
  const targetVec = useRef(new Vector3());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useSimulationStore.getState();
    const emp = state.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const queueIndex = state.ride.queue.indexOf(emp.id);
    const [x, y, z] = getTargetPosition(emp, queueIndex);
    targetVec.current.set(x, y, z);
    group.position.lerp(targetVec.current, Math.min(1, delta * 2));
  });

  const arrived = useSimulationStore(
    (s) => s.employees.find((e) => e.id === employeeId)?.state !== "ARRIVED",
  );
  if (!arrived) return null;

  return (
    <group ref={groupRef} position={SPAWN_POSITION}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.85, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#f1c27d" />
      </mesh>
      <Html position={[0, 2.15, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <EmployeeLabel employeeId={employeeId} />
      </Html>
    </group>
  );
}

function EmployeeLabel({ employeeId }: { employeeId: string }) {
  const emp = useSimulationStore((s) => s.employees.find((e) => e.id === employeeId));
  const simTime = useSimulationStore((s) => s.simTime);
  if (!emp) return null;

  const isWorkStarted = emp.state === "WORK_STARTED";
  const timeLabel = isWorkStarted ? "WORK STARTED" : formatSimTime(simTime);
  const color = emp.finalColor ?? emp.seatColor;

  return (
    <div className="pointer-events-none flex flex-col items-center whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-[11px] leading-tight text-white shadow">
      <span className={isWorkStarted ? "font-semibold text-emerald-400" : "font-semibold"}>
        {timeLabel}
      </span>
      <span className="text-white/70">{emp.id}</span>
      {color && (
        <span style={{ color: STATUS_HEX[color] }}>
          {color}
          {emp.delayMinutes !== null ? ` ${formatDelay(emp.delayMinutes)}` : ""}
        </span>
      )}
    </div>
  );
}
