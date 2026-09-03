"use client";

import { useMemo } from "react";
import {
  DOME_HEIGHT,
  DOME_RADIUS,
  HUB_HEIGHT,
  HUB_RADIUS,
  RIM_LAMP_COUNT,
  RIM_TUBE_RADIUS,
  SAUCER_HALF_DEPTH,
  SAUCER_RADIUS,
  SEAT_PITCH_RADIANS,
  SKIRT_INNER_RADIUS,
  SKIRT_PANELS,
  UNDERDOME_HEIGHT,
  UNDERDOME_RADIUS,
  skirtColor,
} from "./constants";
import { GEOMETRY, LAY_FLAT, MATERIAL, liveryMaterial } from "./parts";
import { SEAT_PLACEMENTS } from "./seatRing";
import { Seat } from "./Seat";

/**
 * THE FLYING SAUCER — the gondola on the end of the arm.
 *
 * Built the way the reference model was described as being built, from
 * primitives: two shallow cones back to back for the hull, a torus for the
 * rim, a hemisphere for the canopy, a smaller one underneath, and a ring of
 * coloured panels around the skirt.
 *
 * WHY THE SKIRT IS PANELLED. The ride was asked to be more colourful, and a
 * single painted disc thirty metres across reads as one flat shape however
 * bright it is. Twenty-four separate panels in a run of seven liveries give
 * the hull an edge every fifteen degrees, so when the saucer spins you can
 * actually see that it is spinning — the colour is doing structural work, not
 * just decoration.
 *
 * ITS FRAME. Origin at the hub, +Y up through the canopy. The saucer knows
 * nothing about the arm that carries it or the swing that carries the arm;
 * `UfoPendulum.tsx` stacks the three.
 */

export function Saucer() {
  /*
   * The panels are placed rather than lathed: each is a thin box laid along
   * its own radius, which gives the same silhouette as a true annular sector
   * at a fraction of the geometry and lets every panel take its own material.
   */
  const panels = useMemo(
    () =>
      Array.from({ length: SKIRT_PANELS }, (_, i) => {
        const azimuth = i * SEAT_PITCH_RADIANS;
        const mid = (SAUCER_RADIUS + SKIRT_INNER_RADIUS) / 2;
        const span = SAUCER_RADIUS - SKIRT_INNER_RADIUS;
        /* Chord across one panel's share of the circle, at the mid radius. */
        const width = 2 * mid * Math.tan(SEAT_PITCH_RADIANS / 2);
        return { key: i, azimuth, mid, span, width, color: skirtColor(i) };
      }),
    [],
  );

  const lamps = useMemo(
    () =>
      Array.from({ length: RIM_LAMP_COUNT }, (_, i) => {
        const azimuth = (i / RIM_LAMP_COUNT) * Math.PI * 2;
        return {
          key: i,
          position: [
            Math.sin(azimuth) * SAUCER_RADIUS,
            0,
            Math.cos(azimuth) * SAUCER_RADIUS,
          ] as [number, number, number],
        };
      }),
    [],
  );

  return (
    <group>
      {/* Upper hull: a shallow cone from the rim up to the canopy ring. */}
      <mesh position={[0, SAUCER_HALF_DEPTH / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[SAUCER_RADIUS, SAUCER_HALF_DEPTH, 48, 1, true]} />
        <primitive object={MATERIAL.hullTop} attach="material" />
      </mesh>

      {/* Lower hull: the same cone inverted, so the two meet at the rim. */}
      <mesh
        position={[0, -SAUCER_HALF_DEPTH / 2, 0]}
        rotation={[Math.PI, 0, 0]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[SAUCER_RADIUS, SAUCER_HALF_DEPTH, 48, 1, true]} />
        <primitive object={MATERIAL.hullUnder} attach="material" />
      </mesh>

      {/* The rim band — the line that makes it read as a saucer at distance. */}
      <mesh rotation={LAY_FLAT} castShadow>
        <torusGeometry args={[SAUCER_RADIUS, RIM_TUBE_RADIUS, 10, 60]} />
        <primitive object={MATERIAL.rim} attach="material" />
      </mesh>

      {/* Coloured skirt panels, laid flat just above the rim. */}
      {panels.map((p) => (
        <mesh
          key={p.key}
          position={[
            Math.sin(p.azimuth) * p.mid,
            SAUCER_HALF_DEPTH * 0.16,
            Math.cos(p.azimuth) * p.mid,
          ]}
          rotation={[0, p.azimuth, 0]}
        >
          <boxGeometry args={[p.width, 0.3, p.span]} />
          <primitive object={liveryMaterial(p.color)} attach="material" />
        </mesh>
      ))}

      {/* Lamp bosses set round the rim between the seats. */}
      {lamps.map((l) => (
        <mesh key={l.key} position={l.position} geometry={GEOMETRY.rimLamp}>
          <primitive object={MATERIAL.lamp} attach="material" />
        </mesh>
      ))}

      {/* The canopy on top, and the ring it seats in. */}
      <mesh position={[0, SAUCER_HALF_DEPTH * 0.5, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[DOME_RADIUS, 0.6, 8, 32]} />
        <primitive object={MATERIAL.domeTrim} attach="material" />
      </mesh>
      <mesh position={[0, SAUCER_HALF_DEPTH * 0.5, 0]} scale={[1, DOME_HEIGHT / DOME_RADIUS, 1]} castShadow>
        <sphereGeometry args={[DOME_RADIUS, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={MATERIAL.domeGlass} attach="material" />
      </mesh>

      {/* The smaller dome underneath, which every flying saucer has. */}
      <mesh
        position={[0, -SAUCER_HALF_DEPTH * 0.5, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[1, UNDERDOME_HEIGHT / UNDERDOME_RADIUS, 1]}
      >
        <sphereGeometry args={[UNDERDOME_RADIUS, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={MATERIAL.hullUnder} attach="material" />
      </mesh>

      {/* The hub that clamps the saucer to the arm and spins it. */}
      <mesh position={[0, SAUCER_HALF_DEPTH * 0.5 + HUB_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[HUB_RADIUS * 0.8, HUB_RADIUS, HUB_HEIGHT, 16]} />
        <primitive object={MATERIAL.hub} attach="material" />
      </mesh>

      {/* Twenty-four seats, hung under the rim, every one facing out. */}
      {SEAT_PLACEMENTS.map((seat) => (
        <group key={seat.index} position={seat.position} rotation={[0, seat.azimuth, 0]}>
          <Seat color={seat.color} />
        </group>
      ))}
    </group>
  );
}
