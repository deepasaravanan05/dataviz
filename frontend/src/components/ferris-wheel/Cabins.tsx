"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { Group, Object3D } from "three";
import { Cabin } from "./Cabin";
import { CABINS, countByColor, validateCabins } from "./cabinManifest";
import { CABIN_COUNT } from "./constants";
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

  /*
   * WHAT WAS MOUNTED IS WHAT THE MANIFEST DECLARED.
   *
   * This used to assert the literal 60 / 20-20-20 the wheel was built with,
   * which made it a second, silently stale copy of the manifest's own rule the
   * moment the ride was re-capacitied to 40. It now compares the mounted
   * cabins against `cabinManifest.ts` — which is the only thing this function
   * was ever really for: proving that every cabin the manifest declares
   * actually reached the scene graph.
   */
  console.assert(
    cabins.length === CABIN_COUNT,
    `Expected exactly ${CABIN_COUNT} cabins, found ${cabins.length}`,
  );
  for (const [band, mounted] of [
    ["GREEN", green],
    ["YELLOW", yellow],
    ["RED", red],
  ] as const) {
    const declared = countByColor(band);
    console.assert(
      mounted.length === declared,
      `Expected ${declared} ${band.toLowerCase()} cabins, found ${mounted.length}`,
    );
  }
  console.assert(
    green.length + yellow.length + red.length === CABIN_COUNT,
    `Color totals do not sum to ${CABIN_COUNT}`,
  );

  console.info(
    `[FerrisWheel] ${cabins.length} cabins mounted — ` +
      `${green.length} green / ${yellow.length} yellow / ${red.length} red`,
  );
}

/**
 * Every cabin mount the manifest declares. Each mount is a child of the
 * rotating wheel assembly, so it orbits with the wheel; the pivot inside it is
 * driven to the negation of the assembly's rotation every frame, keeping the
 * gondola upright through the full revolution (§12). One useFrame drives every
 * pivot.
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
            <Cabin color={spec.color} index={spec.index} />
          </group>
        </group>
      ))}
    </group>
  );
}
