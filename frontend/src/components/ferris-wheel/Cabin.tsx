"use client";

import { RoundedBox } from "@react-three/drei";
import { CABIN_COLOR_HEX } from "./cabinManifest";
import { ARM_LENGTH, CABIN_DEPTH, CABIN_HEIGHT, CABIN_WIDTH } from "./constants";
import type { SeatColor } from "@/types/simulation";

const FRAME = "#3a3f47";
const METAL = "#aeb4bd";

/**
 * A passenger gondola built from multiple parts (§9): suspension yoke, roof,
 * main colored body, window band, floor pan and side rails — never a bare box.
 * Rendered in the cabin's own upright space; the pivot above it cancels the
 * wheel's rotation.
 */
export function Cabin({ color }: { color: SeatColor }) {
  const hex = CABIN_COLOR_HEX[color];
  const bodyY = -ARM_LENGTH - CABIN_HEIGHT / 2;

  return (
    <group>
      {/* --- Suspension: pivot pin, twin hanger bars, yoke --- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, CABIN_DEPTH * 0.9, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * CABIN_WIDTH * 0.34, -ARM_LENGTH / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.07, ARM_LENGTH, 0.07]} />
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -ARM_LENGTH + 0.04, 0]} castShadow>
        <boxGeometry args={[CABIN_WIDTH * 0.78, 0.08, 0.09]} />
        <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
      </mesh>

      <group position={[0, bodyY, 0]}>
        {/* --- Main body --- */}
        <RoundedBox
          args={[CABIN_WIDTH, CABIN_HEIGHT, CABIN_DEPTH]}
          radius={0.14}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={hex} metalness={0.18} roughness={0.42} />
        </RoundedBox>

        {/* --- Passenger compartment: glazed window band --- */}
        <mesh position={[0, CABIN_HEIGHT * 0.1, 0]}>
          <boxGeometry
            args={[CABIN_WIDTH * 1.01, CABIN_HEIGHT * 0.4, CABIN_DEPTH * 1.01]}
          />
          <meshPhysicalMaterial
            color="#cfe6ff"
            metalness={0.05}
            roughness={0.08}
            transmission={0.6}
            thickness={0.2}
            transparent
            opacity={0.72}
          />
        </mesh>

        {/* --- Roof --- */}
        <RoundedBox
          args={[CABIN_WIDTH * 1.12, 0.16, CABIN_DEPTH * 1.12]}
          radius={0.06}
          smoothness={3}
          position={[0, CABIN_HEIGHT / 2 + 0.05, 0]}
          castShadow
        >
          <meshStandardMaterial color={FRAME} metalness={0.55} roughness={0.45} />
        </RoundedBox>

        {/* --- Floor pan --- */}
        <RoundedBox
          args={[CABIN_WIDTH * 1.06, 0.14, CABIN_DEPTH * 1.06]}
          radius={0.05}
          smoothness={3}
          position={[0, -CABIN_HEIGHT / 2 - 0.03, 0]}
          castShadow
        >
          <meshStandardMaterial color={FRAME} metalness={0.55} roughness={0.45} />
        </RoundedBox>

        {/* --- Side corner posts --- */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[(side * CABIN_WIDTH) / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, CABIN_HEIGHT * 0.94, CABIN_DEPTH * 0.98]} />
            <meshStandardMaterial color={FRAME} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}

        {/* --- Front safety rail across the opening --- */}
        <mesh position={[0, -CABIN_HEIGHT * 0.16, CABIN_DEPTH / 2 + 0.02]} castShadow>
          <boxGeometry args={[CABIN_WIDTH * 0.9, 0.07, 0.06]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}
