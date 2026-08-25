"use client";

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { PALETTE, SUPPORT_EVERY, SUPPORT_MIN_HEIGHT, TRACK_SEGMENTS } from "./constants";
import { TRACK_FRAMES, TRACK_POINTS } from "./trackCurve";

const UP = new Vector3(0, 1, 0);

interface Strut {
  key: string;
  position: [number, number, number];
  quaternion: Quaternion;
  length: number;
  thickness: number;
}

/** A cylinder spanning two points (cylinderGeometry runs along local +Y). */
function strut(key: string, from: Vector3, to: Vector3, thickness: number): Strut {
  const dir = new Vector3().subVectors(to, from);
  const length = dir.length();
  const quaternion = new Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  return {
    key,
    position: new Vector3().addVectors(from, to).multiplyScalar(0.5).toArray() as [
      number,
      number,
      number,
    ],
    quaternion,
    length,
    thickness,
  };
}

/**
 * Support towers placed along the circuit wherever the track runs above
 * ground. Each tower is a splayed A-frame in the plane across the track —
 * two legs to the ground, horizontal tie bars up the height, and X bracing
 * between tiers, matching the reference's thin tubular teal lattice.
 */
function buildSupports(): Strut[] {
  const struts: Strut[] = [];

  for (let i = 0; i < TRACK_SEGMENTS; i += SUPPORT_EVERY) {
    const top = TRACK_POINTS[i];
    if (top.y < SUPPORT_MIN_HEIGHT) continue;

    // Splay across the track, using the horizontal part of the binormal so
    // legs always land sensibly even where the track is banked or inverted.
    const across = new Vector3(TRACK_FRAMES.binormals[i].x, 0, TRACK_FRAMES.binormals[i].z);
    if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
    across.normalize();

    const splay = 0.16 * top.y + 0.7;
    const anchor = new Vector3(top.x, top.y - 0.55, top.z);
    const footL = new Vector3(top.x + across.x * splay, 0, top.z + across.z * splay);
    const footR = new Vector3(top.x - across.x * splay, 0, top.z - across.z * splay);

    struts.push(strut(`leg-l-${i}`, footL, anchor, 0.17));
    struts.push(strut(`leg-r-${i}`, footR, anchor, 0.17));

    // Horizontal tie bars + X bracing between tiers.
    const tiers = Math.max(1, Math.floor(top.y / 4.5));
    let prevL: Vector3 | null = null;
    let prevR: Vector3 | null = null;

    for (let t = 1; t <= tiers; t++) {
      const f = t / (tiers + 1);
      const l = new Vector3().lerpVectors(footL, anchor, f);
      const r = new Vector3().lerpVectors(footR, anchor, f);
      struts.push(strut(`tie-${i}-${t}`, l, r, 0.1));

      if (prevL && prevR) {
        struts.push(strut(`x1-${i}-${t}`, prevL, r, 0.07));
        struts.push(strut(`x2-${i}-${t}`, prevR, l, 0.07));
      }
      prevL = l;
      prevR = r;
    }

    // Base plates
    struts.push(strut(`base-l-${i}`, footL, new Vector3(footL.x, 0.28, footL.z), 0.42));
    struts.push(strut(`base-r-${i}`, footR, new Vector3(footR.x, 0.28, footR.z), 0.42));
  }

  return struts;
}

export function Supports() {
  const struts = useMemo(() => buildSupports(), []);

  return (
    <group>
      {struts.map((s) => (
        <mesh
          key={s.key}
          position={s.position}
          quaternion={s.quaternion}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[s.thickness, s.thickness, s.length, 8]} />
          <meshStandardMaterial
            color={s.key.startsWith("leg") ? PALETTE.support : PALETTE.supportDark}
            metalness={0.55}
            roughness={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}
