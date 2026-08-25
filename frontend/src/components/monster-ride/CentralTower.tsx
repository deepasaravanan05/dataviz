"use client";

import {
  ARM_ATTACH_HEIGHT,
  BASE_HEIGHT,
  BASE_RADIUS,
  PALETTE,
  SPHERE_RADIUS,
  TOWER_HEIGHT,
  TOWER_RADIUS,
} from "./constants";

const NECK_BULBS = 12;

/**
 * The stationary centre: an octagonal gold base, a dark timber column, a ring
 * of white bulbs at the neck, and the glowing golden faceted sphere that
 * crowns the reference model.
 */
export function CentralTower() {
  const neckY = ARM_ATTACH_HEIGHT + 1.5;

  return (
    <group>
      {/* Octagonal base platform */}
      <mesh position={[0, BASE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS * 1.05, BASE_HEIGHT, 8]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.6} roughness={0.42} />
      </mesh>
      <mesh position={[0, BASE_HEIGHT + 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[BASE_RADIUS * 0.94, BASE_RADIUS * 0.94, 0.12, 8]} />
        <meshStandardMaterial color={PALETTE.goldDark} metalness={0.5} roughness={0.55} />
      </mesh>

      {/* Timber column */}
      <mesh position={[0, BASE_HEIGHT + TOWER_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[TOWER_RADIUS * 0.82, TOWER_RADIUS, TOWER_HEIGHT, 12]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.8} metalness={0.08} />
      </mesh>
      {/* Vertical timber staves for the panelled look */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * TOWER_RADIUS * 0.92,
              BASE_HEIGHT + TOWER_HEIGHT / 2,
              Math.sin(a) * TOWER_RADIUS * 0.92,
            ]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, TOWER_HEIGHT * 0.96, 0.3]} />
            <meshStandardMaterial color={PALETTE.timberDark} roughness={0.85} />
          </mesh>
        );
      })}

      {/* Bulb ring at the neck */}
      {Array.from({ length: NECK_BULBS }, (_, i) => {
        const a = (i / NECK_BULBS) * Math.PI * 2;
        return (
          <mesh
            key={`neck-${i}`}
            position={[Math.cos(a) * (TOWER_RADIUS + 0.25), neckY, Math.sin(a) * (TOWER_RADIUS + 0.25)]}
          >
            <sphereGeometry args={[0.17, 8, 8]} />
            <meshStandardMaterial
              color={PALETTE.bulb}
              emissive={PALETTE.bulb}
              emissiveIntensity={1.9}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      <mesh position={[0, neckY, 0]} castShadow>
        <cylinderGeometry args={[TOWER_RADIUS + 0.1, TOWER_RADIUS + 0.1, 0.5, 12]} />
        <meshStandardMaterial color={PALETTE.goldDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Golden faceted crown sphere */}
      <mesh position={[0, neckY + SPHERE_RADIUS + 0.7, 0]} castShadow>
        <icosahedronGeometry args={[SPHERE_RADIUS, 1]} />
        <meshStandardMaterial
          color={PALETTE.sphere}
          metalness={0.85}
          roughness={0.25}
          emissive={PALETTE.gold}
          emissiveIntensity={0.55}
          flatShading
        />
      </mesh>
      <pointLight
        position={[0, neckY + SPHERE_RADIUS + 0.7, 0]}
        color={PALETTE.gold}
        intensity={70}
        distance={40}
        decay={2}
      />
    </group>
  );
}
