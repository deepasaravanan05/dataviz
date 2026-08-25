"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Arm } from "./Arm";
import { CentralTower } from "./CentralTower";
import {
  ARM_ATTACH_HEIGHT,
  ARM_COUNT,
  ARM_LENGTH,
  BASE_HEIGHT,
  HUB_SPIN,
  MONSTER_ORIGIN,
  UNDULATION_CENTER_TILT,
  UNDULATION_RATE,
  UNDULATION_SWING,
} from "./constants";
import { clampTiltForGroundClearance } from "./groundClearance";
import { validateRiders } from "./riders";

/** Mutable holder for an arm's current tilt, shared with that arm each frame. */
export interface TiltHandle {
  current: number;
}

/**
 * MonsterRide
 *  |- CentralTower ............ stationary: base, column, bulb ring, sphere
 *  |- rotor (spins about Y) ... carries all five arms around the hub
 *      |- arm pivot x5 ........ each rocks about its own horizontal axis,
 *                               phase-offset by 2PI/5 to make the wave
 *          |- Arm ............. arch + levelled, spinning spider of gondolas
 *
 * The three motions are independent and continuous, so the ride loops without
 * any seam: the hub rotates, the arms undulate out of phase with one another,
 * and each spider spins on its own axis.
 */
export function MonsterRide({ showLabels = false }: { showLabels?: boolean }) {
  const rotorRef = useRef<Group>(null);
  const armRefs = useRef<(Group | null)[]>([]);

  // ARM_COUNT is a fixed 5 (the ride's defining shape, per the reference), so
  // these are five explicit hooks rather than a hook called in a loop.
  // useRef<number>(0) already IS a plain { current } container, so these
  // objects can be grouped into an array (no .current dereferenced here —
  // that only happens inside useFrame callbacks, both to write it below and
  // to read it in the Arm's own useFrame, which is exactly what refs are for).
  const tilt0 = useRef(0);
  const tilt1 = useRef(0);
  const tilt2 = useRef(0);
  const tilt3 = useRef(0);
  const tilt4 = useRef(0);

  // Indexed by arm, but never mutated through this array — only read, to hand
  // each Arm its own ref object as a prop. The linter treats index-mutation
  // through an array binding as suspect even when the elements are refs, so
  // the actual writes below go through the five named refs directly.
  const tiltRefs: TiltHandle[] = [tilt0, tilt1, tilt2, tilt3, tilt4];

  const elapsed = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;

    if (rotorRef.current) rotorRef.current.rotation.y += delta * HUB_SPIN;
    const rotorAngle = rotorRef.current?.rotation.y ?? 0;

    for (let i = 0; i < ARM_COUNT; i++) {
      // Phase-offset sine across the five arms produces the travelling wave:
      // as the hub turns, each arm rises and falls a fifth of a cycle apart.
      // The oscillation is centred above level (UNDULATION_CENTER_TILT) so
      // the low end of the swing has headroom above the ground by design.
      const placementAngle = (i / ARM_COUNT) * Math.PI * 2;
      const rawTilt =
        UNDULATION_CENTER_TILT +
        Math.sin(elapsed.current * UNDULATION_RATE + placementAngle) * UNDULATION_SWING;

      // Defense-in-depth: derive this arm's current world position and clamp
      // its tilt so the cart it carries can never dip through the ground,
      // even if the tuned range above is later changed (§10 of the fix).
      const worldAngle = rotorAngle + placementAngle;
      const armWorldX = MONSTER_ORIGIN[0] + Math.cos(worldAngle) * ARM_LENGTH;
      const armWorldZ = MONSTER_ORIGIN[2] + Math.sin(worldAngle) * ARM_LENGTH;
      const tilt = clampTiltForGroundClearance(rawTilt, armWorldX, armWorldZ);

      switch (i) {
        case 0: tilt0.current = tilt; break;
        case 1: tilt1.current = tilt; break;
        case 2: tilt2.current = tilt; break;
        case 3: tilt3.current = tilt; break;
        case 4: tilt4.current = tilt; break;
      }

      const arm = armRefs.current[i];
      if (arm) arm.rotation.z = tilt;
    }
  });

  return (
    <group position={MONSTER_ORIGIN}>
      <CentralTower />

      <group ref={rotorRef} position={[0, BASE_HEIGHT + ARM_ATTACH_HEIGHT, 0]}>
        {Array.from({ length: ARM_COUNT }, (_, i) => (
          <group key={i} rotation={[0, (i / ARM_COUNT) * Math.PI * 2, 0]}>
            <group
              ref={(node) => {
                armRefs.current[i] = node;
              }}
            >
              <Arm index={i} showLabels={showLabels} tiltRef={tiltRefs[i]} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
