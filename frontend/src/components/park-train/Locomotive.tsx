"use client";

import { PALETTE, WHEEL_RADIUS, WHEEL_X } from "./constants";

/* Across the track from the gauge, along it as the engine was always drawn. */
const WHEEL_POSITIONS: [number, number][] = [
  [-WHEEL_X, 1.85],
  [WHEEL_X, 1.85],
  [-WHEEL_X, -1.2],
  [WHEEL_X, -1.2],
];

/** Local y=0 is the axle line (rail height + WHEEL_RADIUS) — see constants.ts. */
function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 18]} />
        <meshStandardMaterial color={PALETTE.wheelTire} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[WHEEL_RADIUS * 0.65, WHEEL_RADIUS * 0.65, 0.04, 18]} />
        <meshStandardMaterial color={PALETTE.wheelRim} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[WHEEL_RADIUS * 0.3, WHEEL_RADIUS * 0.3, 0.04, 12]} />
        <meshStandardMaterial color={PALETTE.wheelHub} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * The locomotive: a large green cylindrical boiler with a dark smokestack, a
 * red chassis and driver's cab, a small canopy over the driver only (not a
 * passenger compartment, so it keeps its roof), and a blue-uniformed driver
 * standing at the controls. Local forward (+Z) points toward the front (the
 * boiler/smokestack end) — an unmistakable engine silhouette pulling a
 * short line of open passenger cars behind it.
 */
export function Locomotive() {
  const floorY = WHEEL_RADIUS * 0.62;

  return (
    <group>
      {WHEEL_POSITIONS.map(([x, z], i) => (
        <Wheel key={i} x={x} z={z} />
      ))}

      {/* Chassis */}
      <mesh position={[0, floorY, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.5, 5.4]} />
        <meshStandardMaterial color={PALETTE.chassisDark} roughness={0.6} />
      </mesh>

      {/* Boiler (front half) */}
      <mesh
        position={[0, floorY + 0.9, -0.8]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[1.0, 1.0, 3.5, 22]} />
        <meshStandardMaterial color={PALETTE.boiler} metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, floorY + 0.9, -2.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.17, 22]} />
        <meshStandardMaterial color={PALETTE.boilerDark} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Smokestack */}
      <mesh position={[0, floorY + 2.2, -2.3]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 1.5, 16]} />
        <meshStandardMaterial color={PALETTE.smokestack} roughness={0.6} />
      </mesh>
      <mesh position={[0, floorY + 3.05, -2.3]} castShadow>
        <cylinderGeometry args={[0.46, 0.36, 0.26, 16]} />
        <meshStandardMaterial color={PALETTE.smokestackTrim} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Cab floor + rear wall */}
      <mesh position={[0, floorY + 0.9, 2.0]} castShadow>
        <boxGeometry args={[2.3, 1.3, 0.26]} />
        <meshStandardMaterial color={PALETTE.chassis} roughness={0.55} />
      </mesh>

      {/* Canopy posts + roof (driver's canopy only — not a passenger compartment) */}
      {[-1.15, 1.15].map((x) =>
        [0.5, 2.5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, floorY + 1.67, z]} castShadow>
            <boxGeometry args={[0.15, 1.67, 0.15]} />
            <meshStandardMaterial color={PALETTE.post} roughness={0.6} />
          </mesh>
        )),
      )}
      <mesh position={[0, floorY + 2.58, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.17, 2.7]} />
        <meshStandardMaterial color={PALETTE.roof} roughness={0.7} />
      </mesh>

      {/* Driver */}
      <group position={[0, floorY + 0.9, 1.25]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.34, 0.68, 4, 10]} />
          <meshStandardMaterial color={PALETTE.driverShirt} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[0.32, 14, 14]} />
          <meshStandardMaterial color={PALETTE.driverSkin} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow>
          <sphereGeometry args={[0.34, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={PALETTE.driverCap} roughness={0.6} />
        </mesh>
      </group>

      {/* Coupling hook to the first carriage */}
      <mesh position={[0, floorY + 0.03, 2.85]} castShadow>
        <boxGeometry args={[0.23, 0.17, 0.65]} />
        <meshStandardMaterial color={PALETTE.smokestack} roughness={0.7} />
      </mesh>
    </group>
  );
}
