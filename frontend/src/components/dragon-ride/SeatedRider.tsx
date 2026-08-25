"use client";

import { Html } from "@react-three/drei";
import { PALETTE } from "./constants";
import { SEAT_COLOR_HEX, riderLabelLines, type DragonRider } from "./riders";

/**
 * An employee strapped into a seat on the dragon ship. Rendered as a child of
 * the swinging hull, so it stays locked to its seat through the whole arc with
 * no per-rider animation of its own.
 */
export function SeatedRider({ rider, showLabel }: { rider: DragonRider; showLabel: boolean }) {
  const hex = SEAT_COLOR_HEX[rider.seatColor];

  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.44, 4, 10]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.8} />
      </mesh>

      {showLabel && (
        <Html position={[0, 1.35, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
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
