"use client";

import { PALETTE } from "./constants";

const STATION_Z = -12;
const STATION_X0 = -21;
const STATION_LENGTH = 18;
const PLATFORM_Y = 2.15;

/**
 * The station, following the reference: a concrete platform either side of
 * the track, a run of dark-gray portal gate frames along the queue edge, and
 * a flat teal roof carried on square teal columns.
 */
export function Station() {
  const centre = STATION_X0 + STATION_LENGTH / 2;

  return (
    <group>
      {/* Platform decks either side of the track */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[centre, PLATFORM_Y - 0.15, STATION_Z + side * 2.4]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[STATION_LENGTH, 0.3, 3]} />
          <meshStandardMaterial color={PALETTE.platform} roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {/* Platform skirts down to the ground */}
      {[-1, 1].map((side) => (
        <mesh
          key={`skirt-${side}`}
          position={[centre, PLATFORM_Y / 2 - 0.15, STATION_Z + side * 3.85]}
          receiveShadow
        >
          <boxGeometry args={[STATION_LENGTH, PLATFORM_Y, 0.2]} />
          <meshStandardMaterial color="#8b8c88" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}

      {/* Dark-gray portal gate frames along the queue edge */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = STATION_X0 + 1.6 + i * 2.6;
        const z = STATION_Z + 3.6;
        return (
          <group key={`gate-${i}`} position={[x, PLATFORM_Y, z]}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.85, 0.75, 0]} castShadow>
                <boxGeometry args={[0.18, 1.5, 0.18]} />
                <meshStandardMaterial color={PALETTE.stationFrame} roughness={0.7} metalness={0.3} />
              </mesh>
            ))}
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[1.88, 0.18, 0.18]} />
              <meshStandardMaterial color={PALETTE.stationFrame} roughness={0.7} metalness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Teal columns + flat roof */}
      {Array.from({ length: 4 }, (_, i) => {
        const x = STATION_X0 + 2 + i * 4.8;
        return [-1, 1].map((side) => (
          <mesh
            key={`col-${i}-${side}`}
            position={[x, PLATFORM_Y + 2.4, STATION_Z + side * 3.4]}
            castShadow
          >
            <boxGeometry args={[0.42, 4.8, 0.42]} />
            <meshStandardMaterial color={PALETTE.stationColumn} roughness={0.6} metalness={0.25} />
          </mesh>
        ));
      })}
      <mesh position={[centre, PLATFORM_Y + 4.95, STATION_Z]} castShadow receiveShadow>
        <boxGeometry args={[STATION_LENGTH + 2, 0.35, 8.4]} />
        <meshStandardMaterial color={PALETTE.stationRoof} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}
