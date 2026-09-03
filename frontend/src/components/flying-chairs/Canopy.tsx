"use client";

import { useMemo } from "react";
import {
  CANOPY_PEAK_Y,
  CANOPY_RADIUS,
  CANOPY_RIM_Y,
  CANOPY_SHELL,
  CANOPY_SOFFIT_Y,
  COLUMN_TOP_RADIUS,
  COLUMN_TOP_Y,
  CROWN_HEIGHT,
  CROWN_LAMP_COUNT,
  CROWN_RADIUS,
  FINIAL_HEIGHT,
  HANGER_RADIUS,
  SEAT_COUNT,
  VALANCE_DROP,
  VALANCE_RADIUS,
  VALANCE_SCALLOPS,
} from "./constants";
import { LAY_FLAT, MATERIAL } from "./parts";

/**
 * The decorative canopy: the roof, its scalloped valance and the lamp crown.
 *
 * The roof is a real shell — an outer skin, an inner soffit and a rim band
 * closing the gap — because the underside is exactly what a viewer sees from
 * the ground, and a single-sided cone shows as a paper edge there. The soffit
 * is also the surface the chairs are bolted to, so it has to be a surface.
 *
 * The panelling alternates cream and red on the same division as the chairs,
 * so the decoration and the machine agree: twenty panels for twenty chairs,
 * and twice as many scallops beneath them.
 */
function RoofPanels() {
  const wedges = useMemo(() => {
    const step = (Math.PI * 2) / SEAT_COUNT;
    return Array.from({ length: SEAT_COUNT }, (_, i) => ({
      key: i,
      start: i * step,
      material: i % 2 === 0 ? MATERIAL.canopyCream : MATERIAL.canopyRed,
    }));
  }, []);
  const slope = CANOPY_PEAK_Y - CANOPY_RIM_Y;

  return (
    <group position={[0, slope / 2, 0]}>
      {wedges.map((w) => (
        <mesh key={w.key} position={[0, CANOPY_RIM_Y, 0]} castShadow receiveShadow>
          <coneGeometry
            args={[CANOPY_RADIUS, slope, 20, 1, true, w.start, (Math.PI * 2) / SEAT_COUNT]}
          />
          <primitive object={w.material} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function Canopy() {
  const scallops = useMemo(
    () => Array.from({ length: VALANCE_SCALLOPS }, (_, i) => (i / VALANCE_SCALLOPS) * Math.PI * 2),
    [],
  );
  const lamps = useMemo(
    () => Array.from({ length: CROWN_LAMP_COUNT }, (_, i) => (i / CROWN_LAMP_COUNT) * Math.PI * 2),
    [],
  );

  return (
    <group>
      <RoofPanels />

      <mesh position={[0, CANOPY_SOFFIT_Y, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[CANOPY_RADIUS, CANOPY_RADIUS, CANOPY_SHELL, 64]} />
        <primitive object={MATERIAL.canopyCream} attach="material" />
      </mesh>
      {/* Rim band closing the shell — the roof has a thickness you can see. */}
      <mesh position={[0, (CANOPY_RIM_Y + CANOPY_SOFFIT_Y) / 2, 0]} castShadow>
        <cylinderGeometry
          args={[CANOPY_RADIUS, CANOPY_RADIUS, CANOPY_RIM_Y - CANOPY_SOFFIT_Y, 64, 1, true]}
        />
        <primitive object={MATERIAL.canopyRed} attach="material" />
      </mesh>
      {/* Brass edge moulding. */}
      <mesh position={[0, CANOPY_SOFFIT_Y, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[CANOPY_RADIUS, 0.26, 6, 64]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>

      {/* Scalloped valance hanging from the rim — the fairground signature. */}
      {scallops.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a) * CANOPY_RADIUS,
            CANOPY_SOFFIT_Y - VALANCE_DROP * 0.5,
            Math.sin(a) * CANOPY_RADIUS,
          ]}
        >
          <sphereGeometry args={[VALANCE_RADIUS, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <primitive object={i % 2 === 0 ? MATERIAL.valance : MATERIAL.canopyRed} attach="material" />
        </mesh>
      ))}

      {/* The ring of hanger pads the chairs bolt into. */}
      <mesh position={[0, CANOPY_SOFFIT_Y - CANOPY_SHELL * 0.5, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[HANGER_RADIUS, 0.2, 6, 48]} />
        <primitive object={MATERIAL.steel} attach="material" />
      </mesh>

      {/* Crown: a lit drum and a brass finial over the column head. */}
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[CROWN_RADIUS * 0.8, CROWN_RADIUS, CROWN_HEIGHT, 24]} />
        <primitive object={MATERIAL.canopyRed} attach="material" />
      </mesh>
      {lamps.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a) * CROWN_RADIUS * 0.94,
            CANOPY_PEAK_Y + CROWN_HEIGHT * 0.55,
            Math.sin(a) * CROWN_RADIUS * 0.94,
          ]}
        >
          <sphereGeometry args={[0.3, 8, 6]} />
          <primitive object={MATERIAL.lamp} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.32, 0]} castShadow>
        <coneGeometry args={[CROWN_RADIUS * 0.55, FINIAL_HEIGHT * 0.64, 18]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.8, 0]} castShadow>
        <sphereGeometry args={[0.62, 12, 10]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>

      {/* The column carries on up through the crown, as it must. */}
      <mesh position={[0, (COLUMN_TOP_Y + CANOPY_PEAK_Y) / 2, 0]} castShadow>
        <cylinderGeometry
          args={[
            COLUMN_TOP_RADIUS * 0.9,
            COLUMN_TOP_RADIUS,
            Math.max(0.2, COLUMN_TOP_Y - CANOPY_PEAK_Y),
            20,
          ]}
        />
        <primitive object={MATERIAL.steel} attach="material" />
      </mesh>
    </group>
  );
}
