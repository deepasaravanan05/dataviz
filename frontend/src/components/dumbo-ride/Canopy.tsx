"use client";

import { useMemo } from "react";
import {
  CANOPY_PEAK_Y,
  CANOPY_RADIUS,
  CANOPY_RIM_Y,
  COLUMN_RADIUS,
  CROWN_HEIGHT,
  CROWN_RADIUS,
  FINIAL_HEIGHT,
  HUB_HEIGHT,
  HUB_RADIUS,
  HUB_Y,
  LAMP_COUNT,
  LAMP_RADIUS,
  PLINTH_HEIGHT,
  VALANCE_DROP,
  VALANCE_SCALLOPS,
} from "./constants";
import { MATERIAL, annulus } from "./parts";

/**
 * THE CENTREPIECE: the column, the hub the arms are hinged to, and the striped
 * umbrella over the top.
 *
 * WHAT TURNS AND WHAT DOES NOT is the same division every carousel makes and
 * the reason this file is split the way it is:
 *
 *   `Mast`   — the column, from the plinth to the canopy. Bolted to the
 *              ground; the machine turns around it.
 *   `Hub`    — the drum the sixteen arms are hinged to. Turns.
 *   `Canopy` — the umbrella, its valance and its finial. Hangs on the mast,
 *              so it stands still while the ride runs underneath it.
 *
 * The rim's height is not chosen here: constants.ts sets it from how high an
 * ARM stands at the canopy's own radius when a rider has it all the way up.
 */

/** The fixed column, plinth to canopy. */
export function Mast() {
  return (
    <group>
      <mesh
        position={[0, (PLINTH_HEIGHT + CANOPY_RIM_Y) / 2, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[COLUMN_RADIUS * 0.82, COLUMN_RADIUS, CANOPY_RIM_Y - PLINTH_HEIGHT, 20]}
        />
        <primitive object={MATERIAL.column} attach="material" />
      </mesh>
      {/* Painted bands, the way a fairground column is always finished. */}
      {[0.28, 0.52, 0.76].map((t) => (
        <mesh
          key={t}
          position={[0, PLINTH_HEIGHT + (CANOPY_RIM_Y - PLINTH_HEIGHT) * t, 0]}
        >
          <cylinderGeometry args={[COLUMN_RADIUS * 1.06, COLUMN_RADIUS * 1.06, 0.5, 20]} />
          <primitive object={MATERIAL.columnTrim} attach="material" />
        </mesh>
      ))}
      {/* The collar the mast is footed in. */}
      <mesh position={[0, PLINTH_HEIGHT + 0.5, 0]}>
        <cylinderGeometry args={[COLUMN_RADIUS * 1.7, COLUMN_RADIUS * 2.1, 1.0, 20]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
    </group>
  );
}

/** The drum the arms hinge from. Carried by the turntable, so it turns. */
export function Hub() {
  return (
    <group position={[0, HUB_Y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[HUB_RADIUS, HUB_RADIUS * 1.08, HUB_HEIGHT, 24]} />
        <primitive object={MATERIAL.steel} attach="material" />
      </mesh>
      <mesh position={[0, HUB_HEIGHT / 2, 0]}>
        <primitive object={annulus(HUB_RADIUS * 0.4, HUB_RADIUS * 1.16, 0.35, 32)} attach="geometry" />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
      <mesh position={[0, -HUB_HEIGHT / 2, 0]}>
        <primitive object={annulus(HUB_RADIUS * 0.4, HUB_RADIUS * 1.16, 0.35, 32)} attach="geometry" />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The umbrella.
 *
 * Striped the way a real one is: sixteen gores, cream and red about, each a
 * wedge of the same cone rather than a decal on it — so the stripes run to the
 * point and meet at the rim, and the whole roof is still one shape.
 */
export function Canopy() {
  const height = CANOPY_PEAK_Y - CANOPY_RIM_Y;
  const gores = useMemo(
    () =>
      Array.from({ length: VALANCE_SCALLOPS }, (_, i) => ({
        key: i,
        start: (i * Math.PI * 2) / VALANCE_SCALLOPS,
        span: (Math.PI * 2) / VALANCE_SCALLOPS,
        red: i % 2 === 0,
      })),
    [],
  );

  const valance = useMemo(
    () =>
      Array.from({ length: VALANCE_SCALLOPS }, (_, i) => {
        const angle = ((i + 0.5) / VALANCE_SCALLOPS) * Math.PI * 2;
        return {
          key: i,
          x: Math.cos(angle) * CANOPY_RADIUS,
          z: Math.sin(angle) * CANOPY_RADIUS,
        };
      }),
    [],
  );

  const lamps = useMemo(
    () =>
      Array.from({ length: LAMP_COUNT }, (_, i) => {
        const angle = (i / LAMP_COUNT) * Math.PI * 2;
        return {
          key: i,
          x: Math.cos(angle) * CANOPY_RADIUS * 1.01,
          z: Math.sin(angle) * CANOPY_RADIUS * 1.01,
        };
      }),
    [],
  );

  return (
    <group>
      {/* The roof itself — the one part of this assembly worth a shadow. */}
      {gores.map((g) => (
        <mesh
          key={g.key}
          position={[0, CANOPY_RIM_Y + height / 2, 0]}
          castShadow={g.red}
        >
          <coneGeometry args={[CANOPY_RADIUS, height, 8, 1, false, g.start, g.span]} />
          <primitive
            object={g.red ? MATERIAL.canopyRed : MATERIAL.canopyCream}
            attach="material"
          />
        </mesh>
      ))}

      {/* Rim band. */}
      <mesh position={[0, CANOPY_RIM_Y, 0]}>
        <primitive
          object={annulus(CANOPY_RADIUS * 0.97, CANOPY_RADIUS * 1.04, 0.35, 48)}
          attach="geometry"
        />
        <primitive object={MATERIAL.valance} attach="material" />
      </mesh>

      {/* Scalloped valance hanging off the rim. */}
      {valance.map((v) => (
        <mesh key={v.key} position={[v.x, CANOPY_RIM_Y - VALANCE_DROP * 0.35, v.z]}>
          <sphereGeometry
            args={[VALANCE_DROP * 0.6, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
          />
          <primitive object={MATERIAL.valance} attach="material" />
        </mesh>
      ))}

      {/* Lamps round the rim — emissive, so the ride reads at dusk without
          adding a light of its own to the park's rig. */}
      {lamps.map((l) => (
        <mesh key={l.key} position={[l.x, CANOPY_RIM_Y - VALANCE_DROP * 0.9, l.z]}>
          <sphereGeometry args={[LAMP_RADIUS, 10, 8]} />
          <primitive object={MATERIAL.lamp} attach="material" />
        </mesh>
      ))}

      {/* Crown and finial. */}
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[CROWN_RADIUS * 0.8, CROWN_RADIUS, CROWN_HEIGHT, 16]} />
        <primitive object={MATERIAL.canopyCream} attach="material" />
      </mesh>
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.42, 0]} castShadow>
        <coneGeometry args={[CROWN_RADIUS * 0.72, FINIAL_HEIGHT * 0.85, 16]} />
        <primitive object={MATERIAL.canopyRed} attach="material" />
      </mesh>
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.9, 0]}>
        <sphereGeometry args={[CROWN_RADIUS * 0.3, 12, 10]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
    </group>
  );
}
