"use client";

import {
  BAY_COUNT,
  BAY_HEIGHT,
  BRACE_RADIUS,
  BUTTRESS_HEIGHT,
  BUTTRESS_SPREAD,
  CHORD_RADIUS,
  FOUNDATION_HEIGHT,
  FOUNDATION_RADIUS,
  GONDOLA_TOP_Y,
  PALETTE,
  TOWER_HALF,
  TOWER_HEIGHT,
} from "./constants";
import { strut, type Strut } from "./strut";

/**
 * The static mast: a square yellow steel lattice on a heavy foundation, with
 * splayed buttress legs at the base, guide rails up two opposite faces, and the
 * winch house crowning the top.
 *
 * Every beam is generated from its two end points, so joints meet exactly and
 * nothing floats. All of it is computed once at module scope — the tower never
 * changes shape, so there is nothing to recompute per frame.
 */

type Sign = 1 | -1;
const SIGNS: Sign[] = [1, -1];

/** The four corner chords, running the full height. */
const CORNERS: [number, number][] = [
  [TOWER_HALF, TOWER_HALF],
  [TOWER_HALF, -TOWER_HALF],
  [-TOWER_HALF, -TOWER_HALF],
  [-TOWER_HALF, TOWER_HALF],
];

/**
 * Lattice bracing. Each of the four faces gets a horizontal tie at every bay
 * boundary plus an alternating diagonal, which is what gives the mast its
 * woven look from any angle.
 */
const LATTICE: Strut[] = (() => {
  const out: Strut[] = [];

  for (let face = 0; face < 4; face++) {
    const a = CORNERS[face];
    const b = CORNERS[(face + 1) % 4];

    for (let bay = 0; bay <= BAY_COUNT; bay++) {
      const y = bay * BAY_HEIGHT;
      if (y > TOWER_HEIGHT) break;
      out.push(strut(`tie-${face}-${bay}`, [a[0], y, a[1]], [b[0], y, b[1]]));
    }

    for (let bay = 0; bay < BAY_COUNT; bay++) {
      const y0 = bay * BAY_HEIGHT;
      const y1 = Math.min((bay + 1) * BAY_HEIGHT, TOWER_HEIGHT);
      if (y0 >= TOWER_HEIGHT) break;
      // Alternate the diagonal direction bay by bay for a true zig-zag.
      const flip = (bay + face) % 2 === 0;
      out.push(
        flip
          ? strut(`dia-${face}-${bay}`, [a[0], y0, a[1]], [b[0], y1, b[1]])
          : strut(`dia-${face}-${bay}`, [b[0], y0, b[1]], [a[0], y1, a[1]]),
      );
    }
  }

  return out;
})();

/** Splayed buttress legs tying the mast down to the foundation ring. */
const BUTTRESSES: Strut[] = CORNERS.map(([x, z], i) =>
  strut(
    `buttress-${i}`,
    [Math.sign(x) * BUTTRESS_SPREAD, FOUNDATION_HEIGHT, Math.sign(z) * BUTTRESS_SPREAD],
    [x, BUTTRESS_HEIGHT, z],
  ),
);

/** The winch house and sheaves at the crown. */
function Crown() {
  return (
    <group position={[0, TOWER_HEIGHT, 0]}>
      {/* Machine deck */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[TOWER_HALF * 2.9, 1.8, TOWER_HALF * 2.9]} />
        <meshStandardMaterial color={PALETTE.machinery} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Sheave wheels the lift cables run over */}
      {SIGNS.map((s) => (
        <mesh key={s} position={[s * TOWER_HALF * 0.85, 2.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.95, 0.22, 10, 22]} />
          <meshStandardMaterial color={PALETTE.guideRail} metalness={0.88} roughness={0.25} />
        </mesh>
      ))}
      {/* Housing over the winch gear */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[TOWER_HALF * 2.2, 1.6, TOWER_HALF * 2.2]} />
        <meshStandardMaterial color={PALETTE.towerSteelDark} metalness={0.45} roughness={0.45} />
      </mesh>
      {/* Aircraft-warning mast */}
      <mesh position={[0, 5.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 2.6, 8]} />
        <meshStandardMaterial color={PALETTE.machinery} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 6.9, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color={PALETTE.canopyEdge}
          emissive={PALETTE.canopyEdge}
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Tower() {
  return (
    <group>
      {/* ---------- Foundation ---------- */}
      <mesh position={[0, FOUNDATION_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNDATION_RADIUS, FOUNDATION_RADIUS + 0.6, FOUNDATION_HEIGHT, 32]} />
        <meshStandardMaterial color={PALETTE.foundation} roughness={0.92} />
      </mesh>
      {/* Anchor blocks under each buttress foot */}
      {CORNERS.map(([x, z], i) => (
        <mesh
          key={i}
          position={[Math.sign(x) * BUTTRESS_SPREAD, FOUNDATION_HEIGHT + 0.35, Math.sign(z) * BUTTRESS_SPREAD]}
          castShadow
        >
          <boxGeometry args={[1.7, 0.9, 1.7]} />
          <meshStandardMaterial color={PALETTE.machinery} metalness={0.5} roughness={0.55} />
        </mesh>
      ))}

      {/* ---------- Corner chords ---------- */}
      {CORNERS.map(([x, z], i) => (
        <mesh key={i} position={[x, TOWER_HEIGHT / 2, z]} castShadow receiveShadow>
          <cylinderGeometry args={[CHORD_RADIUS, CHORD_RADIUS, TOWER_HEIGHT, 14]} />
          <meshStandardMaterial color={PALETTE.towerSteel} metalness={0.5} roughness={0.38} />
        </mesh>
      ))}

      {/* ---------- Lattice bracing ---------- */}
      {LATTICE.map((s) => (
        <mesh key={s.key} position={s.position} quaternion={s.quaternion} castShadow>
          <cylinderGeometry args={[BRACE_RADIUS, BRACE_RADIUS, s.length, 8]} />
          <meshStandardMaterial color={PALETTE.towerBrace} metalness={0.45} roughness={0.42} />
        </mesh>
      ))}

      {/* ---------- Buttress legs ---------- */}
      {BUTTRESSES.map((s) => (
        <mesh key={s.key} position={s.position} quaternion={s.quaternion} castShadow>
          <cylinderGeometry args={[0.26, 0.3, s.length, 10]} />
          <meshStandardMaterial color={PALETTE.towerSteelDark} metalness={0.5} roughness={0.42} />
        </mesh>
      ))}

      {/* ---------- Guide rails the gondola runs on ---------- */}
      {SIGNS.map((s) => (
        <group key={s}>
          <mesh position={[s * (TOWER_HALF + 0.42), TOWER_HEIGHT / 2, 0]} castShadow>
            <boxGeometry args={[0.34, TOWER_HEIGHT, 0.7]} />
            <meshStandardMaterial color={PALETTE.guideRail} metalness={0.9} roughness={0.22} />
          </mesh>
          {/* Brake fins along the lower third, where the magnetic brakes bite */}
          <mesh position={[s * (TOWER_HALF + 0.42), GONDOLA_TOP_Y * 0.22, 0]} castShadow>
            <boxGeometry args={[0.5, GONDOLA_TOP_Y * 0.44, 1.15]} />
            <meshStandardMaterial color={PALETTE.machinery} metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      <Crown />
    </group>
  );
}
