"use client";

import { Html } from "@react-three/drei";
import { PALETTE } from "./constants";
import { SEAT_COLOR_HEX, riderLabelLines, type Rider } from "./riders";

/**
 * A seated employee in a colour-coded seat. The figure reuses the same shirt
 * and skin tones as the walking employees elsewhere in the park so the
 * characters read as the same population; the seat itself carries the
 * green/yellow/red work-start status.
 */
export function SeatedEmployee({ rider, showLabel }: { rider: Rider; showLabel: boolean }) {
  const statusHex = SEAT_COLOR_HEX[rider.color];

  return (
    <group>
      {/* Seat pan + back, tinted with the employee's status colour */}
      <mesh position={[0, -0.28, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.12, 0.56]} />
        <meshStandardMaterial color={statusHex} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.02, -0.3]} castShadow>
        <boxGeometry args={[0.62, 0.6, 0.12]} />
        <meshStandardMaterial color={statusHex} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Seat frame */}
      <mesh position={[0, -0.36, -0.02]}>
        <boxGeometry args={[0.68, 0.06, 0.62]} />
        <meshStandardMaterial color={PALETTE.seatFrame} roughness={0.8} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.02, 0.02]} castShadow>
        <capsuleGeometry args={[0.17, 0.34, 4, 10]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0.02]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.8} />
      </mesh>
      {/* Thighs, so the figure reads as seated rather than standing */}
      <mesh position={[0, -0.19, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.3, 4, 8]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.75} />
      </mesh>
      {/* Lap bar */}
      <mesh position={[0, 0.02, 0.3]} castShadow>
        <boxGeometry args={[0.58, 0.07, 0.07]} />
        <meshStandardMaterial color={PALETTE.steelDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {showLabel && (
        <Html position={[0, 0.95, 0]} center distanceFactor={14} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-center text-[10px] leading-tight text-white shadow">
            {riderLabelLines(rider).map((line, i) => (
              <div key={i} className={i === 0 ? "font-semibold" : "text-white/75"}>
                {line}
              </div>
            ))}
            <div className="mt-0.5 font-semibold" style={{ color: statusHex }}>
              {rider.color}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
