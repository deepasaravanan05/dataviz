"use client";

import { Html } from "@react-three/drei";
import { PALETTE } from "./constants";
import { SEAT_COLOR_HEX, riderLabelLines, type TowerRider } from "./riders";

/**
 * An employee strapped into a gondola seat, facing outward. Rendered as a
 * descendant of the gondola group, so it rides up, falls and brakes with the
 * car without any per-rider animation of its own.
 */
export function SeatedRider({ rider, showLabel }: { rider: TowerRider; showLabel: boolean }) {
  const hex = SEAT_COLOR_HEX[rider.seatColor];

  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.4, 4, 10]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.8} />
      </mesh>
      {/* Legs dangling forward over the footrest */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.11, -0.34, 0.16]} rotation={[0.5, 0, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.36, 4, 8]} />
          <meshStandardMaterial color={PALETTE.seatShellDark} roughness={0.8} />
        </mesh>
      ))}

      {showLabel && (
        <Html position={[0, 1.25, 0]} center distanceFactor={26} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-center text-[10px] leading-tight text-white shadow">
            {riderLabelLines(rider).map((line, i) => (
              <div key={i} className={i === 0 ? "font-semibold" : "text-white/75"}>
                {line}
              </div>
            ))}
            <div className="mt-0.5 font-semibold" style={{ color: hex }}>
              {rider.seatColor}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
