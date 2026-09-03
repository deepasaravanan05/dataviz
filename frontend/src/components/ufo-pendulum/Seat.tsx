"use client";

import {
  FOOTREST_DEPTH,
  FOOTREST_DROP,
  HARNESS_DROP,
  HARNESS_RADIUS,
  SEAT_BACK_HEIGHT,
  SEAT_BACK_THICKNESS,
  SEAT_DEPTH,
  SEAT_SCALE,
  SEAT_THICKNESS,
  SEAT_WIDTH,
} from "./constants";
import { MATERIAL, liveryMaterial } from "./parts";

/**
 * ONE SEAT ON THE RIM, FACING OUT.
 *
 * Drawn at real human dimensions — `SEAT_WIDTH` and `SEAT_BACK_HEIGHT` come
 * from `world/scale.ts`, the same figures every other chair in this park is
 * built from — and then scaled up as a whole by SEAT_SCALE. Scaling the
 * assembled chair rather than each dimension separately is what keeps it a
 * chair: a seat made wide without being made deep is a bench, and at six
 * hundred metres the difference between the two is the difference between
 * reading as people and reading as a stripe.
 *
 * LOCAL +Z IS OUTWARD. The seat ring places each chair with its own +Z
 * pointing away from the hub, so the back panel is behind the rider at -Z, the
 * footrest ahead at +Z, and the rider looks out over the park. Nothing here
 * knows which seat it is; it is handed a colour and it faces forward.
 */
export function Seat({ color }: { color: string }) {
  const halfW = SEAT_WIDTH / 2;

  return (
    <group scale={SEAT_SCALE}>
      {/* The hanger that carries the seat off the rim above it. */}
      <mesh position={[0, SEAT_BACK_HEIGHT * 0.9, -SEAT_DEPTH * 0.55]}>
        <boxGeometry args={[SEAT_WIDTH * 0.9, SEAT_BACK_HEIGHT * 1.4, 0.07]} />
        <primitive object={MATERIAL.seatFrame} attach="material" />
      </mesh>

      {/* Seat pan. */}
      <mesh castShadow>
        <boxGeometry args={[SEAT_WIDTH, SEAT_THICKNESS, SEAT_DEPTH]} />
        <primitive object={MATERIAL.seatCushion} attach="material" />
      </mesh>

      {/* Back panel — this is the piece that carries the seat's livery. */}
      <mesh
        position={[0, SEAT_BACK_HEIGHT / 2, -SEAT_DEPTH / 2 + SEAT_BACK_THICKNESS / 2]}
        castShadow
      >
        <boxGeometry args={[SEAT_WIDTH, SEAT_BACK_HEIGHT, SEAT_BACK_THICKNESS]} />
        <primitive object={liveryMaterial(color)} attach="material" />
      </mesh>

      {/* Shoulder harness, closed across the rider — this ride goes over the top. */}
      <mesh
        position={[0, SEAT_BACK_HEIGHT - HARNESS_DROP, SEAT_DEPTH * 0.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[HARNESS_RADIUS, HARNESS_RADIUS, SEAT_WIDTH * 0.95, 8]} />
        <primitive object={MATERIAL.harness} attach="material" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * halfW * 0.7, SEAT_BACK_HEIGHT * 0.62, SEAT_DEPTH * 0.05]}
          rotation={[Math.PI / 2.4, 0, 0]}
        >
          <cylinderGeometry args={[HARNESS_RADIUS, HARNESS_RADIUS, SEAT_BACK_HEIGHT * 0.9, 8]} />
          <primitive object={MATERIAL.harness} attach="material" />
        </mesh>
      ))}

      {/* Footrest, out in front where the rider's feet dangle. */}
      <mesh position={[0, -FOOTREST_DROP, SEAT_DEPTH * 0.5 + FOOTREST_DEPTH / 2]}>
        <boxGeometry args={[SEAT_WIDTH * 0.85, 0.06, FOOTREST_DEPTH]} />
        <primitive object={MATERIAL.seatFrame} attach="material" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * halfW * 0.72, -FOOTREST_DROP / 2, SEAT_DEPTH * 0.35]}
        >
          <boxGeometry args={[0.05, FOOTREST_DROP, 0.05]} />
          <primitive object={MATERIAL.seatFrame} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
