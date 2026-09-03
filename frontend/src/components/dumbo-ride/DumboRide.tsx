"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Canopy, Hub, Mast } from "./Canopy";
import { Elephant } from "./Elephant";
import { Gallery, Plinth, Stair } from "./Platform";
import {
  ARM_HANGER,
  ARM_LENGTH,
  ARM_RADIUS,
  HUB_Y,
  SILL_ABOVE_FEET,
  validateDumboRide,
} from "./constants";
import { ARM_PLACEMENTS } from "./ring";
import { ARM_ANGLE_DOWN, CYCLE_SECONDS, armAngleAt, dumboStateAt } from "./motion";
import { MATERIAL } from "./parts";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";

/**
 * THE DUMBO RIDE, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is put up: the pad, the mast, the gallery
 * people board from and the stair up to it, then the turntable — hub, sixteen
 * arms, sixteen elephants — and the umbrella over the top.
 *
 * WHAT TURNS AND WHAT DOES NOT.
 *
 *   The MAST, the GALLERY, the STAIR and the PLINTH are ground-fixed. So is
 *   the CANOPY: it hangs on the mast, and the machine turns underneath it.
 *
 *   The TURNTABLE carries the hub, the arms and the elephants round.
 *
 *   Each ARM rises and falls on its own, and each vehicle is counter-rotated
 *   at the far end so that it stays LEVEL however high its arm is — which is
 *   what a real Dumbo's parallelogram linkage is for, and why an elephant
 *   climbing does not tip its riders out.
 *
 * ONE DRIVE RAMP does both, out of motion.ts: the arms are worked off the same
 * drive that turns the ride, so nothing flies while the machine is stopped.
 * And it does stop — this ride loads with every elephant down on the gallery,
 * so it comes to a stand, people step across into the howdahs, and it winds
 * back up.
 *
 * THE RIDE KEEPS ITS OWN CLOCK — real seconds since the page opened, wrapped
 * at the cycle length. It is an attraction rather than a department ride, so
 * nobody is dispatched on it and it simply runs, exactly as the Flying Chairs,
 * the Super Looper and the Tea Cups do.
 *
 * WHERE IT STANDS. It positions itself from `RIDE_ORIGIN`, solved in
 * placement.ts as a bearing and a distance out behind the UFO Pendulum — the
 * Data Engineering ride, which is what "behind the data engineers" asked for.
 * Mounted in world space with no offset and no scale of its own, adding no
 * light and no camera, and not in the park layout.
 */
export function DumboRide() {
  const turntable = useRef<Group>(null);
  const arms = useRef<(Group | null)[]>([]);
  const vehicles = useRef<(Group | null)[]>([]);
  const clock = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateDumboRide();
  }, []);

  useFrame((_, delta) => {
    if (!turntable.current) return;
    clock.current = (clock.current + delta) % CYCLE_SECONDS;
    const t = clock.current;
    const state = dumboStateAt(t);

    turntable.current.rotation.y += state.rotationRate * delta;

    ARM_PLACEMENTS.forEach((placement, i) => {
      const angle = armAngleAt(t, placement);
      const arm = arms.current[i];
      const vehicle = vehicles.current[i];
      if (arm) arm.rotation.z = angle;
      /* The linkage: whatever the arm does, the elephant stays level. */
      if (vehicle) vehicle.rotation.z = -angle;
    });
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      <Plinth />
      <Mast />
      <Gallery />
      <Stair />

      <group ref={turntable}>
        <Hub />
        {ARM_PLACEMENTS.map((placement, i) => (
          <group key={placement.index} rotation={[0, -placement.azimuth, 0]}>
            <group
              ref={(g) => {
                arms.current[i] = g;
              }}
              position={[0, HUB_Y, 0]}
              rotation={[0, 0, ARM_ANGLE_DOWN]}
            >
              {/* The arm itself, hinged at the hub and reaching out. */}
              <mesh position={[ARM_LENGTH / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[ARM_RADIUS * 0.8, ARM_RADIUS, ARM_LENGTH, 12]} />
                <primitive object={MATERIAL.steel} attach="material" />
              </mesh>

              <group position={[ARM_LENGTH, 0, 0]}>
                <group
                  ref={(g) => {
                    vehicles.current[i] = g;
                  }}
                  rotation={[0, 0, -ARM_ANGLE_DOWN]}
                >
                  {/* The hanger down from the arm's end onto the elephant's
                      back — the length that makes the gallery's height and the
                      howdah's floor the same number. */}
                  <mesh position={[0, -ARM_HANGER / 2, 0]} castShadow>
                    <cylinderGeometry args={[ARM_RADIUS * 0.55, ARM_RADIUS * 0.55, ARM_HANGER, 10]} />
                    <primitive object={MATERIAL.steel} attach="material" />
                  </mesh>
                  <group position={[0, -ARM_HANGER - SILL_ABOVE_FEET, 0]}>
                    <Elephant color={placement.color} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        ))}
      </group>

      <Canopy />
    </group>
  );
}
