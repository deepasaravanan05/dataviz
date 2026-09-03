"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  CUP_BASE_HEIGHT,
  CUP_BASE_RADIUS,
  CUP_FLOOR_Y,
  CUP_HANDLE_RADIUS,
  CUP_HANDLE_TUBE,
  CUP_HEIGHT,
  CUP_INNER_RADIUS,
  CUP_RADIUS,
  CUP_WALL,
  CUP_WHEEL_RADIUS,
  CUSHION_HEIGHT,
  SEATS_PER_CUP,
  SEAT_DEPTH,
  SEAT_PAN_Y,
  WHEEL_GRIP_Y,
} from "./constants";
import { MATERIAL, glazeMaterial } from "./parts";

/**
 * ONE TEACUP: a glazed cup with a handle, four seats round the inside, and the
 * hand wheel the riders spin themselves with.
 *
 * THE CUP IS ONE MESH, revolved from its own cross-section — up the outside,
 * over the rim, down the inside and across the floor. A cup drawn as a
 * cylinder has no rim and no thickness, and the rim is exactly what a viewer
 * looking down into it sees; lathing the section gives the real shape, the
 * wall's thickness and the floor for the price of a single geometry.
 *
 * THERE IS NO SEAT BACK, and that is deliberate: the cup's own wall is the
 * back, which is why the seats are set into it. The bench is a cushion on the
 * wall and a pan under the rider, and nothing stands proud of the rim — a
 * teacup with armchairs in it reads as four chairs on a saucer.
 */

function useCupGeometry() {
  return useMemo(() => {
    const outer = CUP_RADIUS;
    const inner = CUP_INNER_RADIUS;
    const foot = CUP_BASE_RADIUS;
    const profile = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(foot, 0),
      new THREE.Vector2(foot * 1.08, CUP_BASE_HEIGHT * 0.4),
      new THREE.Vector2(outer * 0.7, CUP_BASE_HEIGHT + CUP_FLOOR_Y * 0.4),
      new THREE.Vector2(outer * 0.92, CUP_HEIGHT * 0.6),
      new THREE.Vector2(outer, CUP_HEIGHT),
      new THREE.Vector2(outer - CUP_WALL, CUP_HEIGHT),
      new THREE.Vector2(inner * 0.88, CUP_HEIGHT * 0.58),
      new THREE.Vector2(inner * 0.64, CUP_BASE_HEIGHT + CUP_FLOOR_Y),
      new THREE.Vector2(0, CUP_BASE_HEIGHT + CUP_FLOOR_Y),
    ];
    return new THREE.LatheGeometry(profile, 40);
  }, []);
}

export function Cup({ color }: { color: string }) {
  const geometry = useCupGeometry();
  const floorY = CUP_BASE_HEIGHT + CUP_FLOOR_Y;
  const seats = useMemo(
    () =>
      Array.from({ length: SEATS_PER_CUP }, (_, i) => ({
        key: i,
        /* Four round the inside, with the handle between two of them. */
        azimuth: (i / SEATS_PER_CUP) * Math.PI * 2 + Math.PI / SEATS_PER_CUP,
      })),
    [],
  );

  return (
    <group>
      <mesh castShadow receiveShadow>
        <primitive object={geometry} attach="geometry" />
        <primitive object={glazeMaterial(color)} attach="material" />
      </mesh>

      {/* The handle. */}
      <mesh position={[CUP_RADIUS * 0.95, CUP_HEIGHT * 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CUP_HANDLE_RADIUS, CUP_HANDLE_TUBE, 10, 24, Math.PI * 1.3]} />
        <primitive object={glazeMaterial(color)} attach="material" />
      </mesh>

      {/* A painted band round the rim, so the cup reads as glazed china. */}
      <mesh position={[0, CUP_HEIGHT - CUP_WALL * 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CUP_RADIUS - CUP_WALL / 2, CUP_WALL * 0.44, 8, 44]} />
        <primitive object={MATERIAL.saucer} attach="material" />
      </mesh>

      {/* Four benches set into the wall, facing the middle. */}
      {seats.map((s) => (
        <group key={s.key} rotation={[0, -s.azimuth, 0]}>
          <mesh position={[CUP_INNER_RADIUS - SEAT_DEPTH / 2, floorY + SEAT_PAN_Y, 0]}>
            <boxGeometry args={[SEAT_DEPTH, SEAT_PAN_Y * 0.26, CUP_INNER_RADIUS * 0.8]} />
            <primitive object={MATERIAL.cushion} attach="material" />
          </mesh>
          <mesh
            position={[
              CUP_INNER_RADIUS - SEAT_DEPTH * 0.14,
              floorY + SEAT_PAN_Y + CUSHION_HEIGHT / 2,
              0,
            ]}
          >
            <boxGeometry args={[SEAT_DEPTH * 0.24, CUSHION_HEIGHT, CUP_INNER_RADIUS * 0.8]} />
            <primitive object={MATERIAL.cushion} attach="material" />
          </mesh>
        </group>
      ))}

      {/* The hand wheel: the reason a tea cup ride is a tea cup ride. */}
      <group position={[0, floorY + WHEEL_GRIP_Y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[CUP_WHEEL_RADIUS, CUP_WHEEL_RADIUS * 0.16, 8, 28]} />
          <primitive object={MATERIAL.brass} attach="material" />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} rotation={[0, (k / 4) * Math.PI * 2, Math.PI / 2]}>
            <cylinderGeometry
              args={[CUP_WHEEL_RADIUS * 0.09, CUP_WHEEL_RADIUS * 0.09, CUP_WHEEL_RADIUS * 2, 8]}
            />
            <primitive object={MATERIAL.brass} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, -WHEEL_GRIP_Y / 2, 0]}>
          <cylinderGeometry
            args={[CUP_WHEEL_RADIUS * 0.2, CUP_WHEEL_RADIUS * 0.26, WHEEL_GRIP_Y, 10]}
          />
          <primitive object={MATERIAL.steel} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

/** The saucer each cup turns on, bolted to the plate under it. */
export function Saucer() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[CUP_RADIUS * 1.14, CUP_RADIUS * 1.2, 0.1, 36]} />
        <primitive object={MATERIAL.saucer} attach="material" />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CUP_RADIUS * 1.14, 0.07, 6, 36]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
    </group>
  );
}
