"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  BRACE_RADIUS,
  BRACE_SPACING,
  RAIL_RADIUS,
  SPINE_DROP,
  SPINE_RADIUS,
  SUPPORT_FOOT_RADIUS,
  SUPPORT_MIN_HEIGHT,
  SUPPORT_RADIUS,
  SUPPORT_SPACING,
  SUPPORT_SPLAY,
  TIE_RADIUS,
  TIE_SPACING,
  TRACK_GAUGE,
} from "./constants";
import { TRACK_LENGTH } from "./trackCurve";
import { TRACK_FRAMES, frameAtDistance } from "./trackFrames";
import { MATERIAL } from "./parts";

/**
 * THE TRACK: two rails on a spine, ties between them, and the steel that holds
 * the whole thing off the ground.
 *
 * EVERYTHING IS BUILT FROM THE SAME FRAMES the train runs on — position,
 * tangent, and the banked up — so the rails cannot drift out of line with the
 * car, and a corner that is banked for the train is banked under it. There is
 * one description of where the track is and everything reads it.
 *
 * THE TIES AND THE SUPPORTS ARE SPACED ALONG THE TRACK, at a fixed number of
 * metres, rather than per control point. A coaster's control points are
 * bunched where it turns and stretched down the straights; laying furniture on
 * them would give a ride with sleepers every centimetre through the corners
 * and none down the lift hill.
 *
 * The ties are drawn as ONE instanced mesh. There are nearly three hundred of
 * them on a nine-hundred-metre circuit, and three hundred draw calls for a
 * detail nobody counts is how a park stops producing a frame.
 */

const UP = new THREE.Vector3(0, 1, 0);

function useRailGeometry(offset: number, radius: number, drop: number) {
  return useMemo(() => {
    /* One point every few metres is plenty for a tube; 1400 is not. */
    const STEP = 4;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < TRACK_FRAMES.length; i += STEP) {
      const f = TRACK_FRAMES[i];
      points.push(
        f.position
          .clone()
          .addScaledVector(f.right, offset)
          .addScaledVector(f.up, -drop),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return new THREE.TubeGeometry(curve, points.length * 2, radius, 8, true);
  }, [offset, radius, drop]);
}

function Rails() {
  const left = useRailGeometry(-TRACK_GAUGE / 2, RAIL_RADIUS, 0);
  const right = useRailGeometry(TRACK_GAUGE / 2, RAIL_RADIUS, 0);
  const spine = useRailGeometry(0, SPINE_RADIUS, SPINE_DROP);

  return (
    <group>
      <mesh castShadow>
        <primitive object={spine} attach="geometry" />
        <primitive object={MATERIAL.spine} attach="material" />
      </mesh>
      {[left, right].map((g, i) => (
        <mesh key={i} castShadow>
          <primitive object={g} attach="geometry" />
          <primitive object={MATERIAL.rail} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Ties() {
  const { geometry, count, matrices } = useMemo(() => {
    const count = Math.floor(TRACK_LENGTH / TIE_SPACING);
    const matrices: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const f = frameAtDistance(i * TIE_SPACING);
      /* A cylinder is authored along +Y; a tie lies across the track. */
      q.setFromUnitVectors(UP, f.right);
      const position = f.position.clone().addScaledVector(f.up, -SPINE_DROP * 0.5);
      matrices.push(new THREE.Matrix4().compose(position, q, scale));
    }
    return {
      geometry: new THREE.CylinderGeometry(TIE_RADIUS, TIE_RADIUS, TRACK_GAUGE, 5),
      count,
      matrices,
    };
  }, []);

  return (
    <instancedMesh
      args={[geometry, MATERIAL.tie, count]}
      ref={(mesh) => {
        if (!mesh) return;
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
      }}
    />
  );
}

/** One leg from the spine down to the ground, splayed and braced. */
function Support({ distance }: { distance: number }) {
  const frame = frameAtDistance(distance);
  const top = frame.position.clone().addScaledVector(frame.up, -SPINE_DROP);
  const height = top.y;
  const splay = height * SUPPORT_SPLAY;

  const legs = useMemo(() => {
    /* Two legs, splayed across the track, meeting the spine at the top. */
    return [-1, 1].map((side) => {
      const foot = new THREE.Vector3(
        top.x + frame.right.x * side * splay,
        0,
        top.z + frame.right.z * side * splay,
      );
      const dir = new THREE.Vector3().subVectors(top, foot);
      const length = dir.length();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
      const mid = new THREE.Vector3().addVectors(top, foot).multiplyScalar(0.5);
      return { key: side, position: mid, quaternion, length, foot };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance]);

  const braces = useMemo(() => {
    const out: { y: number; span: number }[] = [];
    for (let y = BRACE_SPACING; y < height - BRACE_SPACING * 0.5; y += BRACE_SPACING) {
      out.push({ y, span: 2 * splay * (1 - y / height) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance]);

  return (
    <group>
      {legs.map((l) => (
        <group key={l.key}>
          <mesh position={l.position} quaternion={l.quaternion} castShadow>
            <cylinderGeometry args={[SUPPORT_RADIUS * 0.8, SUPPORT_RADIUS, l.length, 8]} />
            <primitive object={MATERIAL.support} attach="material" />
          </mesh>
          <mesh position={[l.foot.x, 0.35, l.foot.z]} receiveShadow>
            <cylinderGeometry args={[SUPPORT_FOOT_RADIUS * 0.8, SUPPORT_FOOT_RADIUS, 0.7, 10]} />
            <primitive object={MATERIAL.footing} attach="material" />
          </mesh>
        </group>
      ))}
      {braces.map((b) => (
        <mesh
          key={b.y}
          position={[top.x, b.y, top.z]}
          quaternion={new THREE.Quaternion().setFromUnitVectors(UP, frame.right)}
        >
          <cylinderGeometry args={[BRACE_RADIUS, BRACE_RADIUS, Math.max(0.5, b.span), 6]} />
          <primitive object={MATERIAL.brace} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Supports() {
  const distances = useMemo(() => {
    const out: number[] = [];
    for (let d = 0; d < TRACK_LENGTH; d += SUPPORT_SPACING) {
      const f = frameAtDistance(d);
      if (f.position.y - SPINE_DROP > SUPPORT_MIN_HEIGHT) out.push(d);
    }
    return out;
  }, []);

  return (
    <group>
      {distances.map((d) => (
        <Support key={d} distance={d} />
      ))}
    </group>
  );
}

export function Track() {
  return (
    <group>
      <Supports />
      <Rails />
      <Ties />
    </group>
  );
}
