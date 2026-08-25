"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { Group, Object3D } from "three";
import { Cabin } from "./Cabin";
import { CABINS, validateCabins } from "./cabinManifest";
import type { SeatColor } from "@/types/simulation";

/** Tag written onto each mounted cabin pivot so validation can count real objects. */
interface CabinUserData {
  isCabin?: true;
  cabinColor?: SeatColor;
}

/**
 * Walks the live Three.js scene graph and asserts that the rendered result —
 * not just the source manifest — contains exactly 60 cabins split 20/20/20
 * (§4, §29). Runs once, on the first frame after mount.
 */
function assertMountedCabins(root: Object3D) {
  const cabins: Object3D[] = [];
  root.traverse((obj) => {
    if ((obj.userData as CabinUserData).isCabin) cabins.push(obj);
  });

  const colorOf = (o: Object3D) => (o.userData as CabinUserData).cabinColor;
  const green = cabins.filter((c) => colorOf(c) === "GREEN");
  const yellow = cabins.filter((c) => colorOf(c) === "YELLOW");
  const red = cabins.filter((c) => colorOf(c) === "RED");

  console.assert(
    cabins.length === 60,
    `Expected exactly 60 cabins, found ${cabins.length}`,
  );
  console.assert(green.length === 20, `Expected 20 green cabins, found ${green.length}`);
  console.assert(yellow.length === 20, `Expected 20 yellow cabins, found ${yellow.length}`);
  console.assert(red.length === 20, `Expected 20 red cabins, found ${red.length}`);
  console.assert(
    green.length + yellow.length + red.length === 60,
    `Color totals do not sum to 60`,
  );

  console.info(
    `[FerrisWheel] ${cabins.length} cabins mounted — ` +
      `${green.length} green / ${yellow.length} yellow / ${red.length} red`,
  );
}

/**
 * All 60 cabin mounts. Each mount is a child of the rotating wheel assembly,
 * so it orbits with the wheel; the pivot inside it is driven to the negation
 * of the assembly's rotation every frame, keeping the gondola upright through
 * the full revolution (§12). One useFrame drives all 60 pivots.
 */
export function Cabins({ rotorRef }: { rotorRef: RefObject<Group | null> }) {
  const groupRef = useRef<Group>(null);
  const validated = useRef(false);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const spin = rotorRef.current?.rotation.z ?? 0;
    for (const mount of group.children) {
      const pivot = mount.children[0];
      if (pivot) pivot.rotation.z = -spin;
    }

    if (!validated.current) {
      validated.current = true;
      if (process.env.NODE_ENV !== "production") {
        validateCabins();
        assertMountedCabins(group);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {CABINS.map((spec) => (
        <group key={spec.index} position={spec.mount}>
          <group userData={{ isCabin: true, cabinColor: spec.color }}>
            <Cabin color={spec.color} />
          </group>
        </group>
      ))}
    </group>
  );
}
