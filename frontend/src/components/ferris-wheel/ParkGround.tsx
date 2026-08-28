"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { GRASS_NORMAL_SCALE, grassMapsFor } from "@/components/world/grassTexture";

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
 * The scattered perimeter planting and the paved walkway that used to run from
 * the gate up to the plaza were both removed at the user's request; the park
 * now reads as open grassland with a single paved circle at its heart.
 *
 * THE GRASS IS A SURFACE, NOT A COLOUR. The plane is the same plane it always
 * was — one geometry, the same size, in the same place — but its material now
 * carries a generated lawn: blade grain, tuft clumping and broad lighter and
 * darker sweeps in the colour map, and the matching relief in a normal map so
 * the park's low sun rakes across the grass instead of lighting a flat sheet.
 * See `world/grassTexture.ts`, which builds both.
 *
 * `grassColor` still owns the value and the mood, exactly as before: the
 * colour map averages to one, so multiplying by the theme's colour lands on
 * that colour and varies around it. Sunset, sunrise and night each keep their
 * own ground; what changed is that all three are now made of grass.
 */
export function ParkGround({
  size = 140,
  plazaRadius = 19,
  plazaCenter = [0, 0],
  grassColor = "#3f7d3f",
  plazaColor = "#9a9a94",
  plazaRimColor = "#7d7d76",
}: ParkGroundProps = {}) {
  /* Tiled to the plane's own extent, so one tile is the same patch of ground
     whether this is the whole park or the small proof-of-concept plot. */
  const lawn = useMemo(() => grassMapsFor(size), [size]);
  const relief = useMemo(
    () => new THREE.Vector2(GRASS_NORMAL_SCALE, GRASS_NORMAL_SCALE),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={grassColor}
          roughness={1}
          map={lawn?.map ?? null}
          normalMap={lawn?.normalMap ?? null}
          normalScale={relief}
        />
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
