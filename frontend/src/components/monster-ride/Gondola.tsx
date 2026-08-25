"use client";

import { GONDOLA_HEIGHT, GONDOLA_RADIUS, PALETTE, SEATS_PER_GONDOLA } from "./constants";
import { ridersForGondola } from "./riders";
import { SeatedEmployee } from "./SeatedEmployee";

const LAMP_COUNT = 8;

/**
 * A tub gondola matching the reference: a brown timber tub with a gold trim
 * band top and bottom, red accent lamps around the skirt, and three seated
 * employees facing outward.
 */
export function Gondola({
  arm,
  gondola,
  showLabels,
}: {
  arm: number;
  gondola: number;
  showLabels: boolean;
}) {
  const riders = ridersForGondola(arm, gondola);

  return (
    <group>
      {/* Tub shell */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[GONDOLA_RADIUS, GONDOLA_RADIUS * 0.86, GONDOLA_HEIGHT, 10, 1, true]} />
        <meshStandardMaterial color={PALETTE.tub} roughness={0.75} metalness={0.1} side={2} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -GONDOLA_HEIGHT / 2 + 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[GONDOLA_RADIUS * 0.86, GONDOLA_RADIUS * 0.86, 0.12, 10]} />
        <meshStandardMaterial color={PALETTE.tubDark} roughness={0.85} />
      </mesh>

      {/* Gold trim bands */}
      {[GONDOLA_HEIGHT / 2, -GONDOLA_HEIGHT / 2 + 0.12].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <torusGeometry args={[GONDOLA_RADIUS * (i === 0 ? 1 : 0.88), 0.09, 8, 20]} />
          <meshStandardMaterial
            color={PALETTE.gold}
            metalness={0.75}
            roughness={0.3}
            emissive={PALETTE.goldDark}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {/* Red accent lamps around the skirt */}
      {Array.from({ length: LAMP_COUNT }, (_, i) => {
        const a = (i / LAMP_COUNT) * Math.PI * 2;
        return (
          <mesh
            key={`lamp-${i}`}
            position={[
              Math.cos(a) * GONDOLA_RADIUS * 0.93,
              -GONDOLA_HEIGHT * 0.12,
              Math.sin(a) * GONDOLA_RADIUS * 0.93,
            ]}
          >
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial
              color={PALETTE.redLamp}
              emissive={PALETTE.redLamp}
              emissiveIntensity={1.4}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* Seated employees, spread around the tub facing outward */}
      {riders.map((rider) => {
        const a = (rider.seat / SEATS_PER_GONDOLA) * Math.PI * 2 - Math.PI / 2;
        const r = GONDOLA_RADIUS * 0.44;
        return (
          <group
            key={rider.seatIndex}
            position={[Math.cos(a) * r, GONDOLA_HEIGHT * 0.22, Math.sin(a) * r]}
            rotation={[0, -a + Math.PI / 2, 0]}
          >
            <SeatedEmployee rider={rider} showLabel={showLabels} />
          </group>
        );
      })}

      {/* Hanger yoke up to the spider arm */}
      <mesh position={[0, GONDOLA_HEIGHT / 2 + 0.42, 0]} castShadow>
        <boxGeometry args={[0.14, 0.85, 0.14]} />
        <meshStandardMaterial color={PALETTE.steelDark} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}
