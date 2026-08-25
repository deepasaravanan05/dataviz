"use client";

import { Html } from "@react-three/drei";
import { PALETTE } from "./constants";
import { SEAT_COLOR_HEX, riderLabelLines, type TrainRider } from "./riders";

/**
 * An employee seated on a carriage bench. Reuses the same shirt/skin tones as
 * the walking employees elsewhere in the park; the bench cushion carries the
 * provisional status colour (§5 — final status is decided later, at the
 * employee's department ride, not on this train).
 */
export function SeatedRider({ rider, showLabel }: { rider: TrainRider; showLabel: boolean }) {
  const hex = SEAT_COLOR_HEX[rider.provisionalColor];

  return (
    <group>
      <mesh position={[0, 0.04, 0.02]} castShadow>
        <capsuleGeometry args={[0.29, 0.55, 4, 10]} />
        <meshStandardMaterial color={PALETTE.driverShirt} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.66, 0.02]} castShadow>
        <sphereGeometry args={[0.26, 14, 14]} />
        <meshStandardMaterial color={PALETTE.driverSkin} roughness={0.8} />
      </mesh>

      {showLabel && (
        <Html position={[0, 1.5, 0]} center distanceFactor={16} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-center text-[10px] leading-tight text-white shadow">
            {riderLabelLines(rider).map((line, i) => (
              <div key={i} className={i === 0 ? "font-semibold" : "text-white/75"}>
                {line}
              </div>
            ))}
            <div className="mt-0.5 font-semibold" style={{ color: hex }}>
              {rider.provisionalColor} (provisional)
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
