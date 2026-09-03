"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";
import { Arm } from "./Arm";
import { Saucer } from "./Saucer";
import { Towers } from "./Towers";
import { ARM_LENGTH, BEARING_Y, UFO_RIDE_ID, validateUfoPendulum } from "./constants";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";
import { armAngle, spinAngle } from "./pendulum";

/**
 * THE UFO PENDULUM, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is erected: the pad, the two A-frames and the
 * bearing they carry; the arm hung from that bearing; the saucer bolted to the
 * bottom of the arm; the seats hung under the saucer's rim.
 *
 * WHAT MOVES, AND ABOUT WHAT.
 *
 * Two motions, stacked exactly as the machine stacks them:
 *
 *   1. The ARM turns about the bearing, the whole way round. The bearing's
 *      axis runs along the ride's local Z, so that is a rotation about Z, and
 *      the arm sweeps through local X. Its angle comes from `armAngle`, which
 *      solves the real machine from energy rather than sweeping it at a
 *      constant rate — it rushes through the bottom and hangs almost still
 *      over the top, which is the whole character of the ride.
 *
 *   2. The SAUCER spins about its own vertical axis, inside the arm's frame.
 *      Because it is nested in the arm rather than driven in world space, it
 *      tips with the arm exactly as a real gondola does: over the top the
 *      riders are upside down, looking down at the park past their own feet.
 *
 * BOTH ARE FUNCTIONS OF THE RIDE'S OWN CLOCK, not of accumulated frame deltas.
 * `rideAnimationSecondsNow` is the park's ride-operations clock: it reads zero
 * whenever this ride is not running, and zero is the pose the arm hangs
 * straight down in with the saucer unturned — which is now the pose the ride
 * LOADS in: the saucer at the bottom of its circle, low enough to be climbed
 * into off a short stair. So the machine genuinely STOPS to load, at the
 * bottom, rather than being frozen part-way round
 * or drifting off its phase after a slow frame, and the seated figures
 * `rideKinematics.ts` places are carried by the same two functions that carry
 * the saucer the viewer is watching.
 *
 * WHERE IT STANDS, AND WHICH WAY IT FACES. It holds the plot the Drop Tower
 * used to, taken from the park layout in placement.ts, turned so the arc reads
 * broadside from the entrance. Mounted in world space with no scale of its own
 * and adding no light and no camera, so it takes the park's existing sun, sky
 * and shadow rig unchanged.
 */
export function UfoPendulum() {
  const arm = useRef<Group>(null);
  const spin = useRef<Group>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateUfoPendulum();
  }, []);

  useFrame(() => {
    const t = rideAnimationSecondsNow(UFO_RIDE_ID);
    if (arm.current) arm.current.rotation.z = armAngle(t);
    if (spin.current) spin.current.rotation.y = spinAngle(t);
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      {/* Ground-fixed: the pad, the frames and the bearing. */}
      <Towers />

      {/* Everything below the bearing turns as one, all the way round. */}
      <group ref={arm} position={[0, BEARING_Y, 0]}>
        <Arm />

        {/* And the saucer spins on the end of it. */}
        <group ref={spin} position={[0, -ARM_LENGTH, 0]}>
          <Saucer />
        </group>
      </group>
    </group>
  );
}
