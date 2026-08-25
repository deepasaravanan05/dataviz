"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { AFrame } from "./AFrame";
import { Ship } from "./Ship";
import { DRAGON_ORIGIN, DRAGON_YAW, PIVOT_Y } from "./constants";
import { swingAngle } from "./swingKinematics";
import { validateRiders } from "./riders";

/**
 * The Giant Dragon Swing Ship.
 *
 * ADD-ONLY: this component renders entirely inside its own group at
 * DRAGON_ORIGIN and reads nothing from, and writes nothing to, any other ride.
 * It adds no lights and no camera of its own, so it picks up the park's
 * existing sun, sky, environment and shadow rig unchanged.
 *
 * The only thing animated is `rotation.x` on the ship group, whose origin is
 * the physical pivot — so the hull, the seats, the restraints, the dragon and
 * all sixty riders swing together as one rigid body about the correct point.
 */
export function DragonRide({ showLabels = false }: { showLabels?: boolean }) {
  const shipRef = useRef<Group>(null);
  const elapsed = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  useFrame((_, delta) => {
    const ship = shipRef.current;
    if (!ship) return;
    // Guard against the large delta a backgrounded tab produces on resume.
    elapsed.current += Math.min(delta, 0.1);
    ship.rotation.x = swingAngle(elapsed.current);
  });

  return (
    <group position={DRAGON_ORIGIN} rotation={[0, DRAGON_YAW, 0]}>
      <AFrame />
      <group ref={shipRef} position={[0, PIVOT_Y, 0]}>
        <Ship showLabels={showLabels} />
      </group>
    </group>
  );
}
