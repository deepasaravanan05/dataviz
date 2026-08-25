"use client";

import { Quaternion, Vector3 } from "three";
import { useMemo } from "react";
import { CAR_LENGTH, CAR_RAIL_HEIGHT, CAR_WIDTH, PALETTE, WHEEL_RADIUS } from "./constants";
import { ridersForCarriage } from "./riders";
import { SeatedRider } from "./SeatedRider";

const halfW = CAR_WIDTH / 2;
const halfL = CAR_LENGTH / 2;

const WHEEL_POSITIONS: [number, number][] = [
  [-halfW - 0.1, halfL - 0.75],
  [halfW + 0.1, halfL - 0.75],
  [-halfW - 0.1, -(halfL - 0.75)],
  [halfW + 0.1, -(halfL - 0.75)],
];

/** Local y=0 is the axle line — matches Locomotive.tsx and the kinematics height. */
function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[WHEEL_RADIUS * 0.78, WHEEL_RADIUS * 0.78, 0.26, 14]} />
      <meshStandardMaterial color={PALETTE.wheelTire} roughness={0.8} />
    </mesh>
  );
}

interface RailSpec {
  key: string;
  position: [number, number, number];
  quaternion: Quaternion;
  length: number;
}

const UP = new Vector3(0, 1, 0);

function railBetween(key: string, from: [number, number, number], to: [number, number, number]): RailSpec {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const length = dir.length();
  const quaternion = new Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  return {
    key,
    position: new Vector3().addVectors(a, b).multiplyScalar(0.5).toArray() as [number, number, number],
    quaternion,
    length,
  };
}

const POST_CORNERS: [number, number][] = [
  [-halfW, -halfL],
  [halfW, -halfL],
  [-halfW, halfL],
  [halfW, halfL],
  [-halfW, -halfL * 0.34],
  [halfW, -halfL * 0.34],
  [-halfW, halfL * 0.34],
  [halfW, halfL * 0.34],
];

const BENCH_Z = 0;
const COL_X = [-2, -1, 0, 1, 2].map((c) => c * (CAR_WIDTH / 5.5));

/**
 * A compact open-air passenger car: a flat floor, low dark-metal guard-rails
 * on gold-capped posts around the perimeter (Heidi-inspired accent), and a
 * single bench row of five individual bucket-style seats with wood-panel
 * backrests spanning the car's width — no roof, no canopy, no enclosing
 * walls, so every seated employee is visible from either side or above.
 * Local forward (+Z) points toward the locomotive.
 */
export function Carriage({ index, showLabels }: { index: number; showLabels: boolean }) {
  const riders = ridersForCarriage(index);
  const floorY = WHEEL_RADIUS * 0.62;

  const railBeams = useMemo<RailSpec[]>(
    () => [
      railBetween("side-top-l", [-halfW, CAR_RAIL_HEIGHT, -halfL], [-halfW, CAR_RAIL_HEIGHT, halfL]),
      railBetween("side-top-r", [halfW, CAR_RAIL_HEIGHT, -halfL], [halfW, CAR_RAIL_HEIGHT, halfL]),
      railBetween("side-mid-l", [-halfW, CAR_RAIL_HEIGHT * 0.5, -halfL], [-halfW, CAR_RAIL_HEIGHT * 0.5, halfL]),
      railBetween("side-mid-r", [halfW, CAR_RAIL_HEIGHT * 0.5, -halfL], [halfW, CAR_RAIL_HEIGHT * 0.5, halfL]),
      // Low end rails — open connection between cars, not a closed wall.
      railBetween("end-top-b", [-halfW, CAR_RAIL_HEIGHT, -halfL], [halfW, CAR_RAIL_HEIGHT, -halfL]),
      railBetween("end-top-f", [-halfW, CAR_RAIL_HEIGHT, halfL], [halfW, CAR_RAIL_HEIGHT, halfL]),
    ],
    [],
  );

  return (
    <group>
      {WHEEL_POSITIONS.map(([x, z], i) => (
        <Wheel key={i} x={x} z={z} />
      ))}

      {/* Floor */}
      <mesh position={[0, floorY, 0]} castShadow receiveShadow>
        <boxGeometry args={[CAR_WIDTH, 0.2, CAR_LENGTH]} />
        <meshStandardMaterial color={PALETTE.carFrameDark} roughness={0.55} metalness={0.2} />
      </mesh>
      {/* Dark-metal chassis skirt, so the wheels read as mounted under the car */}
      <mesh position={[0, floorY - 0.17, 0]} castShadow>
        <boxGeometry args={[CAR_WIDTH * 0.95, 0.14, CAR_LENGTH * 0.92]} />
        <meshStandardMaterial color={PALETTE.carFrame} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Low guard-rail posts, gold-capped (well below a seated employee's head) */}
      {POST_CORNERS.map(([x, z], i) => (
        <group key={i} position={[x, floorY, z]}>
          <mesh position={[0, CAR_RAIL_HEIGHT / 2, 0]} castShadow>
            <boxGeometry args={[0.09, CAR_RAIL_HEIGHT, 0.09]} />
            <meshStandardMaterial color={PALETTE.carFrame} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, CAR_RAIL_HEIGHT + 0.05, 0]} castShadow>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color={PALETTE.trimGold} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <group position={[0, floorY, 0]}>
        {railBeams.map((rail) => (
          <mesh key={rail.key} position={rail.position} quaternion={rail.quaternion} castShadow>
            <cylinderGeometry args={[0.045, 0.045, rail.length, 8]} />
            <meshStandardMaterial color={PALETTE.trimGold} metalness={0.55} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* Bench seat: single row of 5 across the car's width, wood-panel backrests, no roof above them */}
      <group position={[0, floorY + 0.12, BENCH_Z]}>
        <mesh castShadow>
          <boxGeometry args={[CAR_WIDTH * 0.88, 0.14, 1.0]} />
          <meshStandardMaterial color={PALETTE.seat} roughness={0.6} />
        </mesh>
        {/* Individual wood-panel backrests, one per seat, angled slightly like the reference's bucket seats */}
        {COL_X.map((x, c) => (
          <mesh key={c} position={[x, 0.42, -0.44]} rotation={[-0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.62, 0.72, 0.1]} />
            <meshStandardMaterial color={PALETTE.woodPanel} roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* Seated riders — nothing above them, fully visible from either side or above */}
      {riders.map((rider) => (
        <group key={rider.seatIndex} position={[COL_X[rider.seat], floorY + 0.19, BENCH_Z + 0.1]}>
          <SeatedRider rider={rider} showLabel={showLabels} />
        </group>
      ))}

      {/* Couplings */}
      <mesh position={[0, floorY - 0.1, -halfL - 0.2]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.45]} />
        <meshStandardMaterial color={PALETTE.carFrameDark} roughness={0.7} />
      </mesh>
      <mesh position={[0, floorY - 0.1, halfL + 0.2]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.45]} />
        <meshStandardMaterial color={PALETTE.carFrameDark} roughness={0.7} />
      </mesh>
    </group>
  );
}
