"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { AFrame } from "./AFrame";
import { Ship } from "./Ship";
import { DRAGON_ORIGIN, DRAGON_YAW, PIVOT_Y } from "./constants";
import { swingAngle } from "./swingKinematics";
import { validateRiders } from "./riders";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";

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

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  /*
   * The ship swings only while the ride is RUNNING a dispatch, off the ride's
   * own animation clock rather than an accumulating counter — which also
   * retires the backgrounded-tab guard, because a simulated clock cannot jump.
   *
   * That clock spans a whole number of half swing periods, and the ship's angle
   * is exactly zero at every one of them, so a stopped ship hangs level at the
   * bottom of its arc with the deck square to the boarding platform. The swing
   * itself — its pendulum shape, its amplitude envelope, its geometry — is
   * untouched.
   */
  useFrame(() => {
    const ship = shipRef.current;
    if (!ship) return;
    ship.rotation.x = swingAngle(rideAnimationSecondsNow("dragon"));
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
