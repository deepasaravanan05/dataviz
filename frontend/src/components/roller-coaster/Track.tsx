"use client";

import { useMemo } from "react";
import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from "three";
import { PALETTE, RAIL_GAUGE, RAIL_RADIUS, SPINE_SIZE, TIE_SPACING, TRACK_SEGMENTS } from "./constants";
import { TRACK_FRAMES, TRACK_LENGTH, TRACK_POINTS } from "./trackCurve";

/** Builds a closed curve offset laterally/vertically from the spine. */
function offsetCurve(lateral: number, vertical: number): CatmullRomCurve3 {
  const points: Vector3[] = [];
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const p = TRACK_POINTS[i];
    points.push(
      new Vector3()
        .copy(p)
        .addScaledVector(TRACK_FRAMES.binormals[i], lateral)
        .addScaledVector(TRACK_FRAMES.normals[i], vertical),
    );
  }
  return new CatmullRomCurve3(points, true, "catmullrom", 0.5);
}

interface TiePlacement {
  key: number;
  position: [number, number, number];
  quaternion: Quaternion;
}

/**
 * The running gear, matching the reference's cross-section: two gray rails
 * outboard, a teal box spine below centre, a yellow centre strip on top of
 * the spine, and teal cross ties tying the rails to the spine.
 */
export function Track() {
  const rails = useMemo(
    () => [offsetCurve(RAIL_GAUGE / 2, 0), offsetCurve(-RAIL_GAUGE / 2, 0)],
    [],
  );
  const spine = useMemo(() => offsetCurve(0, -0.42), []);
  const strip = useMemo(() => offsetCurve(0, -0.18), []);

  /** Cross ties spaced by arc length so they stay even through curves. */
  const ties = useMemo<TiePlacement[]>(() => {
    const count = Math.floor(TRACK_LENGTH / TIE_SPACING);
    const matrix = new Matrix4();

    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / count) * TRACK_SEGMENTS) % TRACK_SEGMENTS;
      const p = TRACK_POINTS[idx];
      const tangent = TRACK_FRAMES.tangents[idx];
      const normal = TRACK_FRAMES.normals[idx];
      const binormal = TRACK_FRAMES.binormals[idx];

      // Tie length runs across the track (binormal), thickness along the normal.
      matrix.makeBasis(binormal, normal, tangent);
      const quaternion = new Quaternion().setFromRotationMatrix(matrix);

      return {
        key: i,
        position: new Vector3()
          .copy(p)
          .addScaledVector(normal, -0.22)
          .toArray() as [number, number, number],
        quaternion,
      };
    });
  }, []);

  return (
    <group>
      {/* Running rails */}
      {rails.map((curve, i) => (
        <mesh key={`rail-${i}`} castShadow receiveShadow>
          <tubeGeometry args={[curve, TRACK_SEGMENTS, RAIL_RADIUS, 8, true]} />
          <meshStandardMaterial color={PALETTE.rail} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Teal box spine */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[spine, TRACK_SEGMENTS, SPINE_SIZE, 4, true]} />
        <meshStandardMaterial color={PALETTE.spine} metalness={0.45} roughness={0.45} />
      </mesh>

      {/* Yellow centre strip */}
      <mesh castShadow>
        <tubeGeometry args={[strip, TRACK_SEGMENTS, 0.14, 4, true]} />
        <meshStandardMaterial color={PALETTE.centreStrip} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Cross ties */}
      {ties.map((tie) => (
        <mesh key={tie.key} position={tie.position} quaternion={tie.quaternion} castShadow>
          <boxGeometry args={[RAIL_GAUGE + 0.12, 0.11, 0.16]} />
          <meshStandardMaterial color={PALETTE.tie} metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
