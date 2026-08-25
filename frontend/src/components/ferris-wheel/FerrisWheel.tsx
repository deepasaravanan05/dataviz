"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { Cabins } from "./Cabins";
import { WheelStructure } from "./WheelStructure";
import { Supports } from "./Supports";
import { ROTATION_SPEED, WHEEL_CENTER_HEIGHT } from "./constants";

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

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * ROTATION_SPEED;
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
