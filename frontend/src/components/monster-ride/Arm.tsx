"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Vector3, type Group } from "three";
import {
  ARCH_RISE,
  ARM_BULBS,
  ARM_END_DROP,
  ARM_LENGTH,
  GONDOLAS_PER_ARM,
  PALETTE,
  SPIDER_RADIUS,
  SPIDER_SPIN,
} from "./constants";
import { Gondola } from "./Gondola";
import type { TiltHandle } from "./MonsterRide";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";

/** The arch: leaves the hub, rises over, and comes back down to the spider. */
const ARCH_CURVE = new CatmullRomCurve3([
  new Vector3(0, 0, 0),
  new Vector3(ARM_LENGTH * 0.28, ARCH_RISE * 0.85, 0),
  new Vector3(ARM_LENGTH * 0.56, ARCH_RISE, 0),
  new Vector3(ARM_LENGTH * 0.82, ARCH_RISE * 0.35, 0),
  new Vector3(ARM_LENGTH, -ARM_END_DROP, 0),
]);

const BULB_POINTS = Array.from({ length: ARM_BULBS }, (_, i) =>
  ARCH_CURVE.getPointAt(i / (ARM_BULBS - 1)).toArray() as [number, number, number],
);

/**
 * One of the five arms. The arm group is tilted by the parent to create the
 * undulation; the spider at its tip is counter-tilted so the gondolas hang
 * level regardless of where the arm is in its wave, then spun on its own axis.
 */
export function Arm({
  index,
  showLabels,
  tiltRef,
}: {
  index: number;
  showLabels: boolean;
  tiltRef: TiltHandle;
}) {
  const levelRef = useRef<Group>(null);
  const spiderRef = useRef<Group>(null);

  useFrame(() => {
    // Cancel the arm's tilt so the gondola deck stays horizontal.
    if (levelRef.current) levelRef.current.rotation.z = -tiltRef.current;
    /* Off the ride's animation clock, like the hub and the wave, so the spider
       stops with the rest of the machine and comes home with it. */
    if (spiderRef.current) {
      spiderRef.current.rotation.y = SPIDER_SPIN * rideAnimationSecondsNow("monster");
    }
  });

  const tip = useMemo(() => ARCH_CURVE.getPointAt(1).toArray() as [number, number, number], []);

  return (
    <group>
      {/* Arch structure */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[ARCH_CURVE, 40, 0.34, 8, false]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={0.72} roughness={0.36} />
      </mesh>
      {/* Inner reinforcement rail */}
      <mesh castShadow>
        <tubeGeometry args={[ARCH_CURVE, 40, 0.14, 6, false]} />
        <meshStandardMaterial color={PALETTE.steelDark} metalness={0.75} roughness={0.4} />
      </mesh>

      {/* Bulb strip running along the top of the arch */}
      {BULB_POINTS.map((p, i) => (
        <mesh key={`bulb-${i}`} position={[p[0], p[1] + 0.42, p[2]]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color={PALETTE.bulb}
            emissive={PALETTE.bulb}
            emissiveIntensity={1.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Spider hub at the tip, kept level then spun */}
      <group position={tip}>
        <group ref={levelRef}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <cylinderGeometry args={[0.85, 1.0, 0.7, 12]} />
            <meshStandardMaterial color={PALETTE.steelDark} metalness={0.8} roughness={0.35} />
          </mesh>

          <group ref={spiderRef}>
            {Array.from({ length: GONDOLAS_PER_ARM }, (_, g) => {
              const a = (g / GONDOLAS_PER_ARM) * Math.PI * 2;
              const x = Math.cos(a) * SPIDER_RADIUS;
              const z = Math.sin(a) * SPIDER_RADIUS;
              return (
                <group key={g}>
                  {/* Spider spoke */}
                  <mesh
                    position={[x / 2, -0.42, z / 2]}
                    rotation={[0, -a, 0]}
                    castShadow
                  >
                    <boxGeometry args={[SPIDER_RADIUS, 0.16, 0.22]} />
                    <meshStandardMaterial
                      color={PALETTE.steel}
                      metalness={0.75}
                      roughness={0.38}
                    />
                  </mesh>
                  {/* Gondola hangs below the spoke tip */}
                  <group position={[x, -1.85, z]} rotation={[0, -a, 0]}>
                    <Gondola arm={index} gondola={g} showLabels={showLabels} />
                  </group>
                </group>
              );
            })}
          </group>
        </group>
      </group>
    </group>
  );
}
