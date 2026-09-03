"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Station } from "./Station";
import { Track } from "./Track";
import { Train, type TrainHandle } from "./Train";
import { validateGigaCoaster } from "./constants";
import { CYCLE_SECONDS, trainStateAt } from "./coasterMotion";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";

/**
 * THE GIGA COASTER, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is: the supports, the track they carry, the
 * ties between the rails, the station beside the straight, and the train on
 * the rail.
 *
 * WHAT MOVES. One thing: the train, and it moves along ONE number — how far the
 * lead car is round the circuit. Every car takes its own position and its own
 * banked orientation from the same frames the rails are drawn from, so the
 * train can neither come apart nor leave the track.
 *
 * WHERE THAT NUMBER COMES FROM. `coasterMotion.ts`, which runs the real machine
 * once when it loads: the chain at a crawl to the crest, gravity from there —
 * `v = sqrt(v_crest^2 + 2g(CREST_Y - y))` — a trim brake wherever the layout
 * can no longer take the speed, and the brake run sized from the stop it has
 * to make. The frame loop reads that table and does no physics of its own, so
 * a dropped frame cannot leave the train off its own phase.
 *
 * THE RIDE KEEPS ITS OWN CLOCK — real seconds since the page opened, wrapped
 * at the cycle length. It is an attraction rather than a department ride, so
 * nobody is dispatched on it and it simply runs, as the park's other
 * attractions do.
 *
 * WHERE IT STANDS. It positions itself from `RIDE_ORIGIN`, searched in
 * placement.ts for the nearest ground to the Tea Cups that clears every margin
 * the park keeps, and turns its long side to the entrance so the lift hill and
 * the drop read as a lift hill and a drop. Mounted in world space with no
 * offset and no scale of its own, adding no light and no camera, and not in
 * the park layout.
 */
export function GigaCoaster() {
  const train = useRef<TrainHandle>(null);
  const clock = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateGigaCoaster();
  }, []);

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE_SECONDS;
    train.current?.setDistance(trainStateAt(clock.current).distance);
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      <Track />
      <Station />
      <Train ref={train} />
    </group>
  );
}
