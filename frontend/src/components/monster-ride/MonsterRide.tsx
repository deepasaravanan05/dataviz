"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Arm } from "./Arm";
import { CentralTower } from "./CentralTower";
import { ARM_ATTACH_HEIGHT, ARM_COUNT, BASE_HEIGHT, HUB_SPIN, MONSTER_ORIGIN } from "./constants";
import { validateRiders } from "./riders";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";
import { monsterArmTilt } from "@/simulation/journey/rideKinematics";

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

  const root = useRef<Group>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  /*
   * All three motions now run off the ride's own animation clock instead of
   * accumulating from the render clock, so the machine stands still between
   * dispatches and turns only while it is RUNNING one — and, because that
   * clock spans a whole number of rest-to-rest loops, it comes back to the
   * exact pose it left, with its gondolas at the boarding platform.
   *
   * The wave itself is unchanged in shape, centre, swing and phase offset;
   * `monsterArmTilt` is the same expression this loop used to hold inline,
   * moved so the seat geometry a boarding employee is attached to is derived
   * from the very same numbers that are drawn. See MONSTER_UNDULATION_RATE for
   * the one tempo adjustment that lets the three motions come home together.
   */
  useFrame(() => {
    const t = rideAnimationSecondsNow("monster");

    if (rotorRef.current) rotorRef.current.rotation.y = HUB_SPIN * t;

    for (let i = 0; i < ARM_COUNT; i++) {
      const tilt = monsterArmTilt(i, t);

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
    <group ref={root} position={MONSTER_ORIGIN}>
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
