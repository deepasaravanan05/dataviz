"use client";

import type { Segment2D } from "./geometry";

interface BeamProps {
  seg: Segment2D;
  thickness?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
}

/** A straight structural member rendered as a thin box between two points. */
export function Beam({
  seg,
  thickness = 0.16,
  color = "#71717a",
  metalness = 0.75,
  roughness = 0.35,
}: BeamProps) {
  return (
    <mesh position={seg.position} rotation={[0, 0, seg.rotationZ]} castShadow receiveShadow>
      <boxGeometry args={[seg.length, thickness, thickness]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}
