"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { Cabins } from "./Cabins";
import { WheelStructure } from "./WheelStructure";
import { Supports } from "./Supports";
import { ROTATION_SPEED, WHEEL_CENTER_HEIGHT } from "./constants";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";

/**
 * FerrisWheelRoot (ground level)
 *  |- Supports + Base .......... stationary, authored in ground space
 *  |- hub translate ............ moves the axle up to WHEEL_CENTER_HEIGHT
 *      |- WheelAssembly ........ the ONLY thing that rotates (§26)
 *          |- WheelStructure
 *          |- Cabins ........... orbit with the assembly, pivots stay upright
 */
export function FerrisWheel() {
  const rotorRef = useRef<Group>(null);

  /*
   * The wheel turns only while it is RUNNING a dispatch.
   *
   * Its rotation used to accumulate from the render clock, so it turned from
   * the moment the page opened and never stopped. It is now read from the
   * ride's own animation clock — driven by the SIMULATED time, which is what
   * keeps it in step with the walking employees at 1x and at 60x alike, and
   * which is zero between dispatches. Zero is one whole revolution's worth of
   * nothing, so a stopped wheel stands with its cabins at the platform.
   *
   * Nothing else about the ride changes: same speed, same direction, same
   * upright cabins.
   */
  useFrame(() => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z = ROTATION_SPEED * rideAnimationSecondsNow("ferris");
    }
  });

  return (
    <group>
      <Supports />
      <group position={[0, WHEEL_CENTER_HEIGHT, 0]}>
        <group ref={rotorRef}>
          <WheelStructure />
          <Cabins rotorRef={rotorRef} />
        </group>
      </group>
    </group>
  );
}
