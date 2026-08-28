"use client";

import { useMemo } from "react";
import { Beam } from "./Beam";
import { RIDE_PAINT } from "@/world/ridePaint";
import { polar, segment, type Segment2D } from "./geometry";
import {
  AXLE_LENGTH,
  AXLE_RADIUS,
  BRACE_THICKNESS,
  HUB_DEPTH,
  HUB_RADIUS,
  INNER_RIM_RADIUS,
  INNER_TUBE_RADIUS,
  INTERMEDIATE_RADIUS,
  INTERMEDIATE_TUBE_RADIUS,
  RIM_TUBE_RADIUS,
  RIM_Z,
  SPOKE_COUNT,
  SPOKE_THICKNESS,
  WHEEL_RADIUS,
} from "./constants";

/* Painted steel — the wheel is the park's blue ride. Cabins, hub bearings
   and the concrete pad are not painted; see world/ridePaint.ts. */
const STEEL = RIDE_PAINT.ferris.light;
const STEEL_MID = RIDE_PAINT.ferris.mid;
const STEEL_DARK = RIDE_PAINT.ferris.dark;

/** One ring, doubled on both truss planes so it reads as a 3D structure. */
function TrussRing({
  radius,
  tube,
  color,
  segments = 96,
}: {
  radius: number;
  tube: number;
  color: string;
  segments?: number;
}) {
  return (
    <>
      {[RIM_Z, -RIM_Z].map((z) => (
        <mesh key={z} position={[0, 0, z]} castShadow receiveShadow>
          <torusGeometry args={[radius, tube, 12, segments]} />
          <meshStandardMaterial color={color} metalness={0.78} roughness={0.34} />
        </mesh>
      ))}
    </>
  );
}

/**
 * The rotating wheel: three concentric truss rings (§15), 28 major spokes
 * mirrored across both planes (§16), zig-zag bracing between rings, lateral
 * cross members tying the two planes together, and a substantial hub (§17).
 */
export function WheelStructure() {
  const angles = useMemo(
    () => Array.from({ length: SPOKE_COUNT }, (_, i) => (i / SPOKE_COUNT) * Math.PI * 2),
    [],
  );

  /** Diagonal bracing between the outer and intermediate rings. */
  const outerBraces = useMemo(() => {
    const segs: Segment2D[] = [];
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const a = angles[i];
      const b = angles[(i + 1) % SPOKE_COUNT];
      for (const z of [RIM_Z, -RIM_Z]) {
        segs.push(segment(polar(WHEEL_RADIUS - RIM_TUBE_RADIUS, a), polar(INTERMEDIATE_RADIUS, b), z));
        segs.push(segment(polar(WHEEL_RADIUS - RIM_TUBE_RADIUS, b), polar(INTERMEDIATE_RADIUS, a), z));
      }
    }
    return segs;
  }, [angles]);

  /** Diagonal bracing between the intermediate and inner rings. */
  const innerBraces = useMemo(() => {
    const segs: Segment2D[] = [];
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const a = angles[i];
      const b = angles[(i + 1) % SPOKE_COUNT];
      for (const z of [RIM_Z, -RIM_Z]) {
        segs.push(segment(polar(INTERMEDIATE_RADIUS, a), polar(INNER_RIM_RADIUS, b), z));
      }
    }
    return segs;
  }, [angles]);

  return (
    <group>
      <TrussRing radius={WHEEL_RADIUS} tube={RIM_TUBE_RADIUS} color={STEEL} />
      <TrussRing radius={INTERMEDIATE_RADIUS} tube={INTERMEDIATE_TUBE_RADIUS} color={STEEL_MID} segments={72} />
      <TrussRing radius={INNER_RIM_RADIUS} tube={INNER_TUBE_RADIUS} color={STEEL_MID} segments={64} />

      {/* Major spokes, hub -> outer rim, mirrored on both planes */}
      {angles.map((angle, i) => (
        <group key={`spoke-${i}`}>
          {[RIM_Z, -RIM_Z].map((z) => (
            <Beam
              key={z}
              seg={segment(polar(HUB_RADIUS, angle), polar(WHEEL_RADIUS - RIM_TUBE_RADIUS, angle), z)}
              thickness={SPOKE_THICKNESS}
              color={STEEL}
            />
          ))}
        </group>
      ))}

      {/* Lateral cross members tying the front and back truss planes together */}
      {angles.map((angle, i) => {
        const [x, y] = polar(WHEEL_RADIUS - RIM_TUBE_RADIUS, angle);
        return (
          <mesh key={`cross-${i}`} position={[x, y, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, RIM_Z * 2]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.35} />
          </mesh>
        );
      })}

      {outerBraces.map((seg, i) => (
        <Beam key={`ob-${i}`} seg={seg} thickness={BRACE_THICKNESS} color={STEEL_MID} />
      ))}
      {innerBraces.map((seg, i) => (
        <Beam key={`ib-${i}`} seg={seg} thickness={BRACE_THICKNESS} color={STEEL_MID} />
      ))}

      {/* Hub: outer drum, inner drum, and the through axle */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HUB_RADIUS, HUB_RADIUS, HUB_DEPTH, 32]} />
        <meshStandardMaterial color={STEEL_MID} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[HUB_RADIUS * 0.62, HUB_RADIUS * 0.62, HUB_DEPTH + 0.5, 24]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[AXLE_RADIUS, AXLE_RADIUS, AXLE_LENGTH, 20]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Hub flange bolts, for mechanical detail */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const [x, y] = polar(HUB_RADIUS * 0.8, a);
        return (
          <mesh key={`bolt-${i}`} position={[x, y, HUB_DEPTH / 2 + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 6]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.9} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}
