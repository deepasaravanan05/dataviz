"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import { Tower } from "./Tower";
import { Station } from "./Station";
import { Gondola } from "./Gondola";
import {
  GONDOLA_TOP_Y,
  PALETTE,
  RESTRAINT_TRAVEL,
  TOWER_HEIGHT,
  TOWER_HALF,
  TOWER_ORIGIN,
} from "./constants";
import { gondolaY, restraintLock, structuralShake } from "./dropKinematics";
import { validateRiders } from "./riders";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";

/**
 * The Giant Drop Tower.
 *
 * ADD-ONLY: everything renders inside this component's own group at
 * TOWER_ORIGIN. It reads nothing from and writes nothing to any other ride, and
 * it adds no light, no environment and no camera of its own, so it inherits the
 * park's existing sun, sky, shadow rig and camera unchanged.
 *
 * A single animation loop drives the whole machine:
 *   - the gondola group's Y comes from `gondolaY`, so seats, restraints and all
 *     sixty riders travel as one rigid body;
 *   - the shoulder restraints are swung by walking one group's children, the
 *     same pattern the park train uses, rather than holding sixty refs;
 *   - the lift cables are stretched to follow the car;
 *   - a sub-decimetre tremor is added through the fall and the braking.
 */
export function DropTower({ showLabels = false }: { showLabels?: boolean }) {
  const gondolaRef = useRef<Group>(null);
  const restraintsRef = useRef<Group>(null);
  const cableLeft = useRef<Mesh>(null);
  const cableRight = useRef<Mesh>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  /*
   * The whole machine cycle now runs off the ride's own animation clock rather
   * than an accumulating counter — which also retires the backgrounded-tab
   * guard, because a simulated clock cannot jump. Between dispatches that clock
   * reads zero, and zero is the start of the dwell phase: the car sitting on
   * its station with the restraints open, which is exactly the state a group
   * boards in. The profile itself, its heights and its timings are untouched.
   */
  useFrame(() => {
    const t = rideAnimationSecondsNow("tower");

    const y = gondolaY(t);
    const shake = structuralShake(t);

    const gondola = gondolaRef.current;
    if (gondola) {
      gondola.position.y = y;
      gondola.position.x = shake;
    }

    const restraints = restraintsRef.current;
    if (restraints) {
      // Each child is one seat's angular frame; its first child is the pivot.
      const angle = -RESTRAINT_TRAVEL * (1 - restraintLock(t));
      for (const seat of restraints.children) {
        const pivot = seat.children[0];
        if (pivot) pivot.rotation.x = angle;
      }
    }

    // Lift cables run from the crown sheaves down to the car: scale and
    // recentre them so they always span exactly that gap.
    const span = Math.max(TOWER_HEIGHT - y, 0.01);
    for (const cable of [cableLeft.current, cableRight.current]) {
      if (!cable) continue;
      cable.scale.y = span;
      cable.position.y = y + span / 2;
    }
  });

  return (
    <group position={TOWER_ORIGIN}>
      <Tower />
      <Station />

      {/* Lift cables — unit-height cylinders stretched to the car each frame. */}
      {([1, -1] as const).map((s, i) => (
        <mesh
          key={s}
          ref={i === 0 ? cableLeft : cableRight}
          position={[s * TOWER_HALF * 0.85, GONDOLA_TOP_Y, 0]}
        >
          <cylinderGeometry args={[0.07, 0.07, 1, 6]} />
          <meshStandardMaterial color={PALETTE.cable} metalness={0.9} roughness={0.35} />
        </mesh>
      ))}

      <group ref={gondolaRef}>
        <Gondola showLabels={showLabels} restraintsRef={restraintsRef} />
      </group>
    </group>
  );
}
