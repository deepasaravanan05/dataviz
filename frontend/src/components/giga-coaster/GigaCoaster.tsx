"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Station } from "./Station";
import { Track } from "./Track";
import { Train, type TrainHandle } from "./Train";
import { validateGigaCoaster } from "./constants";
import { runDistanceAt } from "./coasterMotion";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";
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
 * THE RIDE RUNS ON THE PARK'S SCHEDULE, not on a clock of its own.
 *
 * It used to keep its own — real seconds since the page opened — because it was
 * an attraction nobody was dispatched on. It is DevOps's ride now: employees
 * walk up to it, and the ride has to be standing still in its station when they
 * do. `rideAnimationSecondsNow` is the ride-operations clock, and it reads
 * exactly zero whenever the schedule says this ride is stopped — which is the
 * pose the train is drawn on its station mark in, and the pose the boarding
 * platform was solved against. So the train stands for each arrival, takes them
 * aboard, runs a whole number of circuits and comes home to the same mark.
 *
 * `runDistanceAt` is the circuit alone: the ride's own LOAD and UNLOAD dwell is
 * gone from it, because how long the train waits in the station is now the
 * employees' business rather than a constant.
 *
 * WHERE IT STANDS. It positions itself from `RIDE_ORIGIN` — its own slot on the
 * park ring — and turns its long side to the middle so the lift hill and the
 * drop read as a lift hill and a drop. Mounted in world space with no offset
 * and no scale of its own, adding no light and no camera. It has a place in the
 * park layout now, at exactly that slot and at exactly the size it declares, so
 * that employees can be routed to it; nothing about where it stands or how big
 * it is changed to get one.
 */
export function GigaCoaster() {
  const train = useRef<TrainHandle>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateGigaCoaster();
  }, []);

  useFrame(() => {
    train.current?.setDistance(runDistanceAt(rideAnimationSecondsNow("giga")));
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      <Track />
      <Station />
      <Train ref={train} />
    </group>
  );
}
