"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { RIDE_DEPARTMENTS } from "@/components/park/departments";
import { rideById } from "@/components/park/layout";
import { rideAnchor } from "@/simulation/journey/journey";
import { RIDE_LOOK } from "./rideLighting";
import { LedStrip, linePoints, ringPoints } from "./led";
import { Bin, LampPost, MAT, Railing } from "./kit";

/**
 * The entrance and forecourt of each ride.
 *
 * A ride standing on open ground reads as an object; a ride you walk up to
 * through a lit portal, past a queue and an operator's booth, reads as a
 * destination. Each plaza is built at the ride's own arrival point — the same
 * anchor the employees' routes are derived from — so the entrance is where the
 * crowd actually arrives rather than somewhere decorative.
 *
 * The portal carries the department name, lit in that ride's own colour, which
 * makes it the near-range half of the landmark system: colour identifies the
 * ride from a kilometre away, and the sign names it from fifty metres.
 */

const PORTAL_SPAN = 9;
const PORTAL_HEIGHT = 6.4;

function Plaza({ rideId }: { rideId: string }) {
  const dept = RIDE_DEPARTMENTS.find((d) => d.rideId === rideId)!;
  const ride = rideById(rideId);
  const { look, accent } = RIDE_LOOK[rideId];

  const { position, facing, queueLength } = useMemo(() => {
    const { stand, approach } = rideAnchor(rideId as never);
    const dx = ride.center[0] - approach[0];
    const dz = ride.center[1] - approach[1];
    const len = Math.hypot(dx, dz) || 1;
    // Set the portal a little back from the approach, on the way in.
    const back = 6;
    return {
      position: [approach[0] - (dx / len) * back, 0, approach[1] - (dz / len) * back] as [number, number, number],
      facing: Math.atan2(dx, dz),
      queueLength: Math.max(10, Math.hypot(stand[0] - approach[0], stand[1] - approach[1]) - 6),
    };
  }, [rideId, ride]);

  const header = useMemo(
    () => linePoints([-PORTAL_SPAN / 2, PORTAL_HEIGHT, 0], [PORTAL_SPAN / 2, PORTAL_HEIGHT, 0], 26),
    [],
  );
  const uprights = useMemo(
    () => [
      ...linePoints([-PORTAL_SPAN / 2, 0.3, 0], [-PORTAL_SPAN / 2, PORTAL_HEIGHT, 0], 14),
      ...linePoints([PORTAL_SPAN / 2, 0.3, 0], [PORTAL_SPAN / 2, PORTAL_HEIGHT, 0], 14),
    ],
    [],
  );
  const apron = useMemo(() => ringPoints(11, 30, 0.18), []);

  return (
    <group position={position} rotation={[0, facing, 0]}>
      {/* Paved forecourt in front of the portal. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -3]} receiveShadow>
        <planeGeometry args={[24, 22]} />
        <primitive object={MAT.paving} attach="material" />
      </mesh>

      {/* Portal structure */}
      {[-PORTAL_SPAN / 2, PORTAL_SPAN / 2].map((x) => (
        <mesh key={x} position={[x, PORTAL_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.55, PORTAL_HEIGHT, 0.55]} />
          <primitive object={MAT.steelDark} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, PORTAL_HEIGHT + 0.75, 0]} castShadow>
        <boxGeometry args={[PORTAL_SPAN + 1.6, 1.5, 0.5]} />
        <meshStandardMaterial color="#12161f" roughness={0.6} />
      </mesh>

      {/* Department name, lit in the ride's own colour. */}
      <Text
        position={[0, PORTAL_HEIGHT + 0.95, 0.28]}
        fontSize={Math.min(0.86, 8.4 / (dept.department.length * 0.55))}
        color={accent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#05070f"
      >
        {dept.department}
      </Text>
      <Text position={[0, PORTAL_HEIGHT + 0.05, 0.28]} fontSize={0.42} color="#c9d4e6" anchorX="center" anchorY="middle">
        {dept.rideName}
      </Text>

      {/* Edge lighting on the portal, matching the ride behind it. */}
      <LedStrip points={header} look={{ ...look, cycles: 2, base: 0.6, gain: 1.6 }} size={0.13} />
      <LedStrip points={uprights} look={{ ...look, cycles: 2, base: 0.45, gain: 1.2 }} size={0.11} halo={false} />
      <LedStrip points={apron} look={{ ...look, base: 0.3, gain: 0.9, cycles: 4 }} size={0.12} halo={false} />

      {/* Queue, running from the portal toward the boarding apron. */}
      {[-2.4, 2.4].map((x) => (
        <Railing key={x} position={[x, 0, queueLength / 2 + 1]} rotation={0} length={queueLength} />
      ))}

      {/* Operator booth beside the entrance. */}
      <group position={[PORTAL_SPAN / 2 + 3.2, 0, -1]}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 2.7, 2.2]} />
          <meshStandardMaterial color="#22262f" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.7, 1.12]}>
          <boxGeometry args={[1.9, 1.1, 0.06]} />
          <primitive object={MAT.glass} attach="material" />
        </mesh>
        <mesh position={[0, 2.82, 0]} castShadow>
          <boxGeometry args={[3, 0.18, 2.6]} />
          <primitive object={MAT.steelDark} attach="material" />
        </mesh>
        <Text position={[0, 3.15, 0]} fontSize={0.24} color="#8fa3c0" anchorX="center" anchorY="middle">
          RIDE OPERATOR
        </Text>
      </group>

      <LampPost position={[-PORTAL_SPAN / 2 - 3, 0, -4]} />
      <LampPost position={[PORTAL_SPAN / 2 + 3, 0, -6.5]} />
      <Bin position={[-PORTAL_SPAN / 2 - 1.6, 0, -2]} />
    </group>
  );
}

/**
 * Landmark masts: tall lit pylons flanking each ride's plaza.
 *
 * Theme parks use these for exactly the reason this world needs them — they
 * give a ride vertical presence in the skyline from far outside its own zone,
 * without touching the ride itself. They carry the ride's colour, so from the
 * overview each attraction has a pair of coloured verticals marking it even
 * when the structure behind is edge-on.
 */
function LandmarkMasts({ rideId }: { rideId: string }) {
  const ride = rideById(rideId);
  const { look } = RIDE_LOOK[rideId];
  const height = Math.max(28, ride.height * 0.62);

  const masts = useMemo(() => {
    const reach = Math.max(ride.halfX, ride.halfZ) + 9;
    const pts: THREE.Vector3[] = [];
    for (const [sx, sz] of [
      [1, 1],
      [-1, -1],
    ] as [number, number][]) {
      const x = ride.center[0] + sx * reach * 0.72;
      const z = ride.center[1] + sz * reach * 0.72;
      const steps = Math.round(height / 1.6);
      for (let i = 0; i <= steps; i++) pts.push(new THREE.Vector3(x, 1 + (i / steps) * height, z));
    }
    return pts;
  }, [ride, height]);

  return <LedStrip points={masts} look={{ ...look, cycles: 3, base: 0.42, gain: 1.9 }} size={0.28} haloScale={4.4} />;
}

export function RidePlazas() {
  return (
    <group>
      {RIDE_DEPARTMENTS.map((d) => (
        <group key={d.rideId}>
          <Plaza rideId={d.rideId} />
          <LandmarkMasts rideId={d.rideId} />
        </group>
      ))}
    </group>
  );
}
