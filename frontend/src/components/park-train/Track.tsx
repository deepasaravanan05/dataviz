"use client";

import { useMemo } from "react";
import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from "three";
import { RAIL_GAUGE, RAIL_RADIUS, RAIL_Y, TIE_SPACING, TRACK_SAMPLES } from "./constants";
import { TRACK_CURVE, TRACK_LENGTH } from "./trainTrack";

const RAIL_COLOR = "#8a8f96";
const TIE_COLOR = "#5c4530";

function offsetCurve(lateral: number): CatmullRomCurve3 {
  const points: Vector3[] = [];
  for (let i = 0; i < TRACK_SAMPLES; i++) {
    const u = i / TRACK_SAMPLES;
    const p = TRACK_CURVE.getPointAt(u);
    const t = TRACK_CURVE.getTangentAt(u);
    t.y = 0;
    t.normalize();
    const right = new Vector3(-t.z, 0, t.x);
    points.push(p.addScaledVector(right, lateral));
  }
  return new CatmullRomCurve3(points, true, "catmullrom", 0.5);
}

interface TiePlacement {
  key: number;
  position: [number, number, number];
  quaternion: Quaternion;
}

/**
 * Two rails plus evenly spaced ties and a ballast bed, following the same
 * flat loop the train rides — sits on top of the terrain, never below it,
 * since it is rendered directly at RAIL_Y with no vertical variation.
 */
export function Track() {
  const rails = useMemo(() => [offsetCurve(RAIL_GAUGE / 2), offsetCurve(-RAIL_GAUGE / 2)], []);

  const ties = useMemo<TiePlacement[]>(() => {
    const count = Math.floor(TRACK_LENGTH / TIE_SPACING);
    const matrix = new Matrix4();
    const up = new Vector3(0, 1, 0);

    return Array.from({ length: count }, (_, i) => {
      const u = i / count;
      const p = TRACK_CURVE.getPointAt(u);
      const t = TRACK_CURVE.getTangentAt(u);
      t.y = 0;
      t.normalize();
      const right = new Vector3(-t.z, 0, t.x);

      matrix.makeBasis(right, up, t);
      return {
        key: i,
        position: [p.x, RAIL_Y - 0.03, p.z] as [number, number, number],
        quaternion: new Quaternion().setFromRotationMatrix(matrix),
      };
    });
  }, []);

  return (
    <group>
      {rails.map((curve, i) => (
        <mesh key={i} castShadow receiveShadow>
          <tubeGeometry args={[curve, TRACK_SAMPLES, RAIL_RADIUS, 8, true]} />
          <meshStandardMaterial color={RAIL_COLOR} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {ties.map((tie) => (
        <mesh key={tie.key} position={tie.position} quaternion={tie.quaternion} castShadow>
          <boxGeometry args={[RAIL_GAUGE + 0.3, 0.06, 0.22]} />
          <meshStandardMaterial color={TIE_COLOR} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
