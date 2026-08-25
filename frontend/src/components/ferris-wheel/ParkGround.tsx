"use client";

interface ParkGroundProps {
  /** Side length of the grass plane. */
  size?: number;
  /** Radius of the paved plaza under the Ferris Wheel. */
  plazaRadius?: number;
  /** Where the plaza sits, in world x/z. Defaults to the origin. */
  plazaCenter?: [number, number];
  /** Surface colours. Defaulted to the original daylight palette. */
  grassColor?: string;
  plazaColor?: string;
  plazaRimColor?: string;
}

/**
 * Grass, and the paved plaza the rides are arranged around.
 *
 * The scattered perimeter trees and the paved walkway that used to run from
 * the gate up to the plaza were both removed at the user's request; the park
 * now reads as open grassland with a single paved circle at its heart.
 */
export function ParkGround({
  size = 140,
  plazaRadius = 19,
  plazaCenter = [0, 0],
  grassColor = "#3f7d3f",
  plazaColor = "#9a9a94",
  plazaRimColor = "#7d7d76",
}: ParkGroundProps = {}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={grassColor} roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plazaCenter[0], 0.01, plazaCenter[1]]}
        receiveShadow
      >
        <circleGeometry args={[plazaRadius, 56]} />
        <meshStandardMaterial color={plazaColor} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[plazaCenter[0], 0.015, plazaCenter[1]]}>
        <ringGeometry args={[plazaRadius - 0.8, plazaRadius, 56]} />
        <meshStandardMaterial color={plazaRimColor} roughness={0.9} />
      </mesh>
    </group>
  );
}
