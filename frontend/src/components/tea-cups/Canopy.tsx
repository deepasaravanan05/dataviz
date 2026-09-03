"use client";

import { useMemo } from "react";
import {
  CANOPY_PEAK_Y,
  CANOPY_RADIUS,
  CANOPY_RIM_Y,
  CANOPY_SHELL,
  COLUMN_RADIUS,
  CORNICE_DROP,
  CORNICE_SCALLOPS,
  CROWN_HEIGHT,
  CROWN_RADIUS,
  CUP_COUNT,
  FINIAL_HEIGHT,
  LAMP_RADIUS,
  RIM_LAMP_COUNT,
} from "./constants";
import { LAY_FLAT, MATERIAL } from "./parts";

/**
 * THE CEILING — "patterns of cornices and middle screens, ceilings, lights".
 *
 * The manufacturer sells this part as the customisable one, and it is what
 * makes a tea cup ride look like a fairground ride rather than a turntable: a
 * panelled roof, a scalloped cornice hanging off its rim, a run of RGB lamps,
 * and a crown and finial over the middle.
 *
 * IT DOES NOT TURN. The ceiling and its column are fixed and the plate
 * revolves underneath, which is how these machines are built and what makes
 * the motion read from outside — a still roof over a moving floor.
 *
 * The roof is a real shell: an outer skin, an inner soffit and a rim band
 * closing the gap, because the underside is exactly what a rider on the plate
 * sees, and a single-sided cone shows as a paper edge from under it. The
 * panelling alternates on the same division as the cups, so the decoration and
 * the machine agree.
 */
function RoofPanels() {
  const wedges = useMemo(() => {
    const step = (Math.PI * 2) / (CUP_COUNT * 2);
    return Array.from({ length: CUP_COUNT * 2 }, (_, i) => ({
      key: i,
      start: i * step,
      material: i % 2 === 0 ? MATERIAL.canopyCream : MATERIAL.canopyRose,
    }));
  }, []);
  const slope = CANOPY_PEAK_Y - CANOPY_RIM_Y;

  return (
    <group position={[0, slope / 2, 0]}>
      {wedges.map((w) => (
        <mesh key={w.key} position={[0, CANOPY_RIM_Y, 0]} castShadow receiveShadow>
          <coneGeometry
            args={[CANOPY_RADIUS, slope, 24, 1, true, w.start, (Math.PI * 2) / (CUP_COUNT * 2)]}
          />
          <primitive object={w.material} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function Canopy() {
  const scallops = useMemo(
    () =>
      Array.from({ length: CORNICE_SCALLOPS }, (_, i) => (i / CORNICE_SCALLOPS) * Math.PI * 2),
    [],
  );
  const lamps = useMemo(
    () => Array.from({ length: RIM_LAMP_COUNT }, (_, i) => (i / RIM_LAMP_COUNT) * Math.PI * 2),
    [],
  );
  const soffitY = CANOPY_RIM_Y - CANOPY_SHELL;

  return (
    <group>
      {/* The column the whole ceiling hangs on, up through the middle. */}
      <mesh position={[0, CANOPY_RIM_Y / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[COLUMN_RADIUS * 0.86, COLUMN_RADIUS, CANOPY_RIM_Y, 20]} />
        <primitive object={MATERIAL.column} attach="material" />
      </mesh>
      {[0.3, 0.62].map((f) => (
        <mesh key={f} position={[0, CANOPY_RIM_Y * f, 0]} rotation={LAY_FLAT}>
          <torusGeometry args={[COLUMN_RADIUS * 1.08, COLUMN_RADIUS * 0.13, 6, 20]} />
          <primitive object={MATERIAL.columnTrim} attach="material" />
        </mesh>
      ))}

      <RoofPanels />

      {/* Soffit and rim band, so the roof has an underside and a thickness. */}
      <mesh position={[0, soffitY, 0]} receiveShadow>
        <cylinderGeometry args={[CANOPY_RADIUS, CANOPY_RADIUS, CANOPY_SHELL, 48]} />
        <primitive object={MATERIAL.canopyCream} attach="material" />
      </mesh>
      <mesh position={[0, soffitY, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[CANOPY_RADIUS, CANOPY_SHELL * 0.9, 6, 48]} />
        <primitive object={MATERIAL.cornice} attach="material" />
      </mesh>

      {/* The scalloped cornice hanging from the rim. */}
      {scallops.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a) * CANOPY_RADIUS,
            soffitY - CORNICE_DROP * 0.5,
            Math.sin(a) * CANOPY_RADIUS,
          ]}
        >
          <sphereGeometry args={[CORNICE_DROP * 0.62, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <primitive object={i % 2 === 0 ? MATERIAL.cornice : MATERIAL.canopyRose} attach="material" />
        </mesh>
      ))}

      {/* The RGB lamp run, between the scallops. */}
      {lamps.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a + Math.PI / RIM_LAMP_COUNT) * (CANOPY_RADIUS - LAMP_RADIUS),
            soffitY - LAMP_RADIUS * 1.4,
            Math.sin(a + Math.PI / RIM_LAMP_COUNT) * (CANOPY_RADIUS - LAMP_RADIUS),
          ]}
        >
          <sphereGeometry args={[LAMP_RADIUS, 8, 6]} />
          <primitive object={MATERIAL.lamp} attach="material" />
        </mesh>
      ))}

      {/* Crown and finial over the peak. */}
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[CROWN_RADIUS * 0.78, CROWN_RADIUS, CROWN_HEIGHT, 18]} />
        <primitive object={MATERIAL.canopyRose} attach="material" />
      </mesh>
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.34, 0]} castShadow>
        <coneGeometry args={[CROWN_RADIUS * 0.56, FINIAL_HEIGHT * 0.68, 16]} />
        <primitive object={MATERIAL.cornice} attach="material" />
      </mesh>
      <mesh position={[0, CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT * 0.82, 0]}>
        <sphereGeometry args={[CROWN_RADIUS * 0.3, 12, 10]} />
        <primitive object={MATERIAL.cornice} attach="material" />
      </mesh>
    </group>
  );
}
