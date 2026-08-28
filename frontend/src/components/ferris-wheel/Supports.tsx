"use client";

import { Beam } from "./Beam";
import { segment } from "./geometry";
import {
  BASE_DEPTH,
  BASE_HEIGHT,
  BASE_WIDTH,
  SUPPORT_SPREAD,
  SUPPORT_THICKNESS,
  SUPPORT_Z_OFFSET,
  WHEEL_CENTER_HEIGHT,
} from "./constants";
import { RIDE_PAINT } from "@/world/ridePaint";

/* The A-frames carry the same paint as the wheel they hold up. */
const STEEL = RIDE_PAINT.ferris.light;
const STEEL_DARK = RIDE_PAINT.ferris.dark;
const CONCRETE = "#9c9ea3";

function lerp2(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * One A-frame tower, authored in GROUND space: legs start on the base platform
 * (y = BASE_HEIGHT) and converge on the hub at y = WHEEL_CENTER_HEIGHT.
 * This component must therefore be mounted at the root, NOT inside the group
 * that is translated up to the hub.
 */
function SupportTower({ z }: { z: number }) {
  const top: [number, number] = [0, WHEEL_CENTER_HEIGHT];
  const left: [number, number] = [-SUPPORT_SPREAD, BASE_HEIGHT];
  const right: [number, number] = [SUPPORT_SPREAD, BASE_HEIGHT];

  const tiers = [0.26, 0.52, 0.76].map((t) => ({
    l: lerp2(left, top, t),
    r: lerp2(right, top, t),
  }));

  return (
    <group>
      {/* Main legs */}
      <Beam seg={segment(left, top, z)} thickness={SUPPORT_THICKNESS} color={STEEL} />
      <Beam seg={segment(right, top, z)} thickness={SUPPORT_THICKNESS} color={STEEL} />

      {/* Horizontal tie beams */}
      {tiers.map((tier, i) => (
        <Beam key={`tie-${i}`} seg={segment(tier.l, tier.r, z)} thickness={0.2} color={STEEL_DARK} />
      ))}

      {/* Diagonal lattice between tiers */}
      {tiers.slice(0, -1).map((tier, i) => (
        <group key={`lat-${i}`}>
          <Beam seg={segment(tier.l, tiers[i + 1].r, z)} thickness={0.11} color={STEEL_DARK} />
          <Beam seg={segment(tier.r, tiers[i + 1].l, z)} thickness={0.11} color={STEEL_DARK} />
        </group>
      ))}
      <Beam seg={segment(left, tiers[0].r, z)} thickness={0.11} color={STEEL_DARK} />
      <Beam seg={segment(right, tiers[0].l, z)} thickness={0.11} color={STEEL_DARK} />

      {/* Footings */}
      {[left, right].map((foot, i) => (
        <mesh key={i} position={[foot[0], BASE_HEIGHT + 0.2, z]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.4, 1.4]} />
          <meshStandardMaterial color={CONCRETE} metalness={0.1} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Base platform, both A-frames, and the cross bracing that ties them together. */
export function Supports() {
  const bearingY = WHEEL_CENTER_HEIGHT;

  return (
    <group>
      {/* Large rectangular base platform (§19) */}
      <mesh position={[0, BASE_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#8f9298" metalness={0.15} roughness={0.85} />
      </mesh>
      <mesh position={[0, BASE_HEIGHT + 0.03, 0]} receiveShadow>
        <boxGeometry args={[BASE_WIDTH * 0.97, 0.06, BASE_DEPTH * 0.9]} />
        <meshStandardMaterial color="#7e8187" metalness={0.15} roughness={0.9} />
      </mesh>

      <SupportTower z={SUPPORT_Z_OFFSET} />
      <SupportTower z={-SUPPORT_Z_OFFSET} />

      {/* Cross supports tying the two A-frames front-to-back */}
      <mesh position={[0, bearingY, 0]} castShadow>
        <boxGeometry args={[1.1, 0.5, SUPPORT_Z_OFFSET * 2]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.85} roughness={0.3} />
      </mesh>
      {[-SUPPORT_SPREAD * 0.55, SUPPORT_SPREAD * 0.55].map((x, i) => (
        <mesh key={i} position={[x, BASE_HEIGHT + 2.2, 0]} castShadow>
          <boxGeometry args={[0.24, 0.24, SUPPORT_Z_OFFSET * 2]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.35} />
        </mesh>
      ))}

      {/* Axle bearing blocks either side of the hub (§18) */}
      {[SUPPORT_Z_OFFSET, -SUPPORT_Z_OFFSET].map((z) => (
        <mesh key={z} position={[0, bearingY, z]} castShadow>
          <boxGeometry args={[1.5, 1.5, 0.6]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.88} roughness={0.26} />
        </mesh>
      ))}
    </group>
  );
}
