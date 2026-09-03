"use client";

import { useMemo } from "react";
import {
  ARM_COUNT,
  ARM_THICKNESS,
  ARM_TIP_DROP,
  BASE_HEIGHT,
  BASE_RADIUS,
  BASE_SKIRT_HEIGHT,
  BASE_SKIRT_RADIUS,
  CANOPY_SOFFIT_Y,
  COLUMN_BASE_RADIUS,
  COLUMN_BOTTOM_Y,
  COLUMN_HEIGHT,
  COLUMN_JOINT_FRACTIONS,
  COLUMN_TOP_RADIUS,
  COLUMN_TOP_Y,
  FLANGE_OVERHANG,
  FLANGE_THICKNESS,
  FOOT_RING_HEIGHT,
  FOOT_RING_RADIUS,
  GUSSET_COUNT,
  GUSSET_HEIGHT,
  GUSSET_LENGTH,
  GUSSET_RADIUS,
  GUSSET_THICKNESS,
  GUSSET_Y,
  HANGER_RADIUS,
  HUB_HEIGHT,
  HUB_RADIUS,
  HUB_Y,
} from "./constants";
import { LAY_FLAT, MATERIAL } from "./parts";

/** Column radius at a height fraction — the taper, evaluated once, everywhere. */
export function columnRadiusAt(fraction: number): number {
  return COLUMN_BASE_RADIUS + (COLUMN_TOP_RADIUS - COLUMN_BASE_RADIUS) * fraction;
}

/**
 * The plinth: a stepped deck rather than a disc, so the machine meets the
 * ground instead of being dropped onto it.
 */
function Plinth() {
  return (
    <group>
      <mesh position={[0, BASE_SKIRT_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[BASE_SKIRT_RADIUS, BASE_SKIRT_RADIUS + 0.4, BASE_SKIRT_HEIGHT, 64]} />
        <primitive object={MATERIAL.steelShadow} attach="material" />
      </mesh>
      <mesh position={[0, BASE_HEIGHT / 2 + BASE_SKIRT_HEIGHT * 0.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS, BASE_HEIGHT, 64]} />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>
      {/* Painted rim band, the livery carried down to the ground. */}
      <mesh
        position={[0, BASE_HEIGHT + BASE_SKIRT_HEIGHT * 0.5 - 0.18, 0]}
        rotation={LAY_FLAT}
      >
        <torusGeometry args={[BASE_RADIUS, 0.3, 6, 64]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The centre column: four tapered sections with a flanged joint between each,
 * an anchored foot ring, and gussets stiffening the base. Tapered because a
 * mast carries its greatest bending moment where it meets the ground.
 */
function Column() {
  const sections = useMemo(() => {
    const cuts = [0, ...COLUMN_JOINT_FRACTIONS, 1];
    return cuts.slice(0, -1).map((from, i) => {
      const to = cuts[i + 1];
      return {
        key: i,
        y: COLUMN_BOTTOM_Y + ((from + to) / 2) * COLUMN_HEIGHT,
        height: (to - from) * COLUMN_HEIGHT,
        bottomRadius: columnRadiusAt(from),
        topRadius: columnRadiusAt(to),
      };
    });
  }, []);

  return (
    <group>
      <mesh position={[0, COLUMN_BOTTOM_Y + FOOT_RING_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[FOOT_RING_RADIUS * 0.84, FOOT_RING_RADIUS, FOOT_RING_HEIGHT, 32]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      {/* The anchor ring, drawn as one collar rather than a circle of bolts:
          at this distance a bolt head is sub-pixel and would cost a draw. */}
      <mesh position={[0, COLUMN_BOTTOM_Y + FOOT_RING_HEIGHT + 0.16, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[FOOT_RING_RADIUS * 0.7, 0.22, 6, 24]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
      {/* The gussets, at the dimensions constants.ts now declares for them —
          the same plate as before, but the descending sweep is solved against
          it, so the numbers had to stop being literals. */}
      {Array.from({ length: GUSSET_COUNT }, (_, i) => {
        const a = (i / GUSSET_COUNT) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * GUSSET_RADIUS, GUSSET_Y, Math.sin(a) * GUSSET_RADIUS]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[GUSSET_LENGTH, GUSSET_HEIGHT, GUSSET_THICKNESS]} />
            <primitive object={MATERIAL.steelDark} attach="material" />
          </mesh>
        );
      })}

      {sections.map((s) => (
        <mesh key={s.key} position={[0, s.y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[s.topRadius, s.bottomRadius, s.height, 28]} />
          <primitive object={MATERIAL.steel} attach="material" />
        </mesh>
      ))}
      {COLUMN_JOINT_FRACTIONS.map((f) => (
        <mesh key={f} position={[0, COLUMN_BOTTOM_Y + f * COLUMN_HEIGHT, 0]} castShadow>
          <cylinderGeometry
            args={[
              columnRadiusAt(f) + FLANGE_OVERHANG,
              columnRadiusAt(f) + FLANGE_OVERHANG,
              FLANGE_THICKNESS,
              28,
            ]}
          />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>
      ))}
      {/* Brass collar where the column emerges above the canopy. */}
      <mesh position={[0, COLUMN_TOP_Y - 1.2, 0]} castShadow>
        <cylinderGeometry args={[COLUMN_TOP_RADIUS + 0.34, COLUMN_TOP_RADIUS + 0.4, 1.1, 24]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The rotating hub and its spider.
 *
 * Ten arms fan out from the hub to under the canopy rim, each backed by a
 * tension rod down to the column head — the standard way a cantilevered canopy
 * of this span is held up. The arms finish BELOW the canopy soffit so the
 * frame is actually visible from the ground rather than buried in the roof.
 */
export function Spider() {
  const arms = useMemo(
    () => Array.from({ length: ARM_COUNT }, (_, i) => (i / ARM_COUNT) * Math.PI * 2),
    [],
  );

  const armRun = HANGER_RADIUS + 1.0 - HUB_RADIUS;
  const armRise = CANOPY_SOFFIT_Y - ARM_TIP_DROP - (HUB_Y + HUB_HEIGHT * 0.18);
  const armLength = Math.hypot(armRun, armRise);
  const armPitch = Math.atan2(armRise, armRun);

  const rodTopY = HUB_Y + HUB_HEIGHT * 0.55;
  const rodGrip = 0.7;
  const rodEndR = HUB_RADIUS + armRun * rodGrip;
  const rodEndY = HUB_Y + HUB_HEIGHT * 0.18 + armRise * rodGrip;
  const rodRun = rodEndR - HUB_RADIUS * 0.4;
  const rodRise = rodEndY - rodTopY;
  const rodLength = Math.hypot(rodRun, rodRise);
  const rodPitch = Math.atan2(rodRise, rodRun);

  return (
    <group>
      <mesh position={[0, HUB_Y + HUB_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HUB_RADIUS, HUB_RADIUS * 1.06, HUB_HEIGHT, 28]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      <mesh position={[0, HUB_Y + HUB_HEIGHT * 0.5, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[HUB_RADIUS * 1.05, 0.22, 6, 24]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>

      {arms.map((a, i) => (
        <group key={i} rotation={[0, -a, 0]}>
          <group position={[HUB_RADIUS, HUB_Y + HUB_HEIGHT * 0.18, 0]} rotation={[0, 0, armPitch]}>
            <mesh position={[armLength / 2, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[armLength, ARM_THICKNESS * 1.9, ARM_THICKNESS]} />
              <primitive object={MATERIAL.steel} attach="material" />
            </mesh>
          </group>
          {/* A cylinder's axis is +Y, so the rod is turned a quarter turn to
              lie along its own local +X run. */}
          <group position={[HUB_RADIUS * 0.4, rodTopY, 0]} rotation={[0, 0, rodPitch]}>
            <mesh position={[rodLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[ARM_THICKNESS * 0.26, ARM_THICKNESS * 0.26, rodLength, 8]} />
              <primitive object={MATERIAL.steelDark} attach="material" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/** The part that stands still: the plinth and the column it all turns around. */
export function Tower() {
  return (
    <group>
      <Plinth />
      <Column />
    </group>
  );
}
