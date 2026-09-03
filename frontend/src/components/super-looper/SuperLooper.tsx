"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Loop } from "./Loop";
import { Structure } from "./Structure";
import { Train } from "./Train";
import { LOOP_CENTER_Y, validateSuperLooper } from "./constants";
import { CYCLE_SECONDS, trainStateAt } from "./loopMotion";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";

/**
 * THE SUPER LOOPER, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is set up: the chassis and its outriggers, the
 * two A-frames, the ring they carry, the drive tyres at the bottom of it, the
 * platform beside it, and the train on the rail.
 *
 * WHAT MOVES. One thing: the train. It is a single group of fifteen cars laid
 * out round the ring behind one another, and the frame loop turns that group —
 * so the train can never come apart, and a car cannot end up somewhere its
 * neighbours are not.
 *
 * WHERE THE ANGLE COMES FROM. `loopMotion.ts`, which integrates the real
 * machine once when it loads: pumped by the tyres at the bottom until it has
 * the energy to get over, four times round, then braked and jogged back to the
 * platform. The frame loop reads that table and does no physics of its own, so
 * a dropped frame cannot leave the train off its own phase, and the ride that
 * the verify script sweeps is literally the ride that is drawn.
 *
 * THE RIDE KEEPS ITS OWN CLOCK — real seconds since the page opened, wrapped
 * at the cycle length. It is not the park's simulation clock and not a store:
 * this is an attraction rather than a department ride, so nobody is dispatched
 * on it and it simply runs, exactly as the Flying Chairs do.
 *
 * WHERE IT STANDS. It positions itself from `RIDE_ORIGIN`, searched in
 * placement.ts for ground that was already clear, and turns its loop broadside
 * to the entrance so the ring reads as a ring rather than as a line. It is
 * mounted in world space with no offset and no scale of its own, adds no light
 * and no camera, and is not in the park layout — so nothing in the park had to
 * move, be resized or be re-solved to admit it.
 */
export function SuperLooper() {
  const train = useRef<Group>(null);
  const clock = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateSuperLooper();
  }, []);

  useFrame((_, delta) => {
    if (!train.current) return;
    clock.current = (clock.current + delta) % CYCLE_SECONDS;
    train.current.rotation.z = trainStateAt(clock.current).theta;
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      {/* Ground-fixed: the chassis, the frames, the tyres and the platform. */}
      <Structure />

      {/* The ring, and the train running inside it. */}
      <group position={[0, LOOP_CENTER_Y, 0]}>
        <Loop />
        <group ref={train}>
          <Train />
        </group>
      </group>
    </group>
  );
}
