"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Canopy } from "./Canopy";
import { Cup, Saucer } from "./Cup";
import { Plate, Platform } from "./Platform";
import { CUP_BASE_HEIGHT, DECK_Y, validateTeaCups } from "./constants";
import { CUP_PLACEMENTS } from "./cupRing";
import { CYCLE_SECONDS, cupsStateAt } from "./motion";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";

/**
 * THE TEA CUPS, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is set up: the apron and its rail, the plinth,
 * the column and the ceiling it carries, the plate, and six cups on saucers
 * bolted to the plate.
 *
 * WHAT MOVES, AND ABOUT WHAT. Two rotations stacked exactly as the machine
 * stacks them:
 *
 *   1. The PLATE carries the cups round, at the manufacturer's 3.8 rpm.
 *   2. Each CUP spins the other way on its own saucer, INSIDE the plate's
 *      frame — so it is carried and spun at once, which is the whole
 *      sensation of a tea cup ride.
 *
 * The ceiling is outside both: it hangs on a fixed column and the plate turns
 * underneath it.
 *
 * BOTH RATES COME FROM ONE DRIVE RAMP in motion.ts, because the machine has
 * one drive: the cups are geared off the plate that carries them and cannot be
 * spinning while it is stopped. And it does stop — this ride loads off its own
 * plate, so it comes to a stand, people walk on across the deck, and it winds
 * back up.
 *
 * THE RIDE KEEPS ITS OWN CLOCK — real seconds since the page opened, wrapped
 * at the cycle length. It is an attraction rather than a department ride, so
 * nobody is dispatched on it and it simply runs, exactly as the Flying Chairs
 * and the Super Looper do.
 *
 * WHERE IT STANDS. It positions itself from `RIDE_ORIGIN`, solved in
 * placement.ts as a distance out along the gate's own line of sight through
 * the UFO Pendulum — behind the Data Engineering ride, which is what was
 * asked. Mounted in world space with no offset and no scale of its own,
 * adding no light and no camera, and not in the park layout.
 */
export function TeaCups() {
  const plate = useRef<Group>(null);
  const cups = useRef<(Group | null)[]>([]);
  const clock = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateTeaCups();
  }, []);

  useFrame((_, delta) => {
    if (!plate.current) return;
    clock.current = (clock.current + delta) % CYCLE_SECONDS;
    const state = cupsStateAt(clock.current);

    plate.current.rotation.y += state.plateRate * delta;
    for (const cup of cups.current) {
      if (cup) cup.rotation.y += state.cupRate * delta;
    }
  });

  return (
    <group position={RIDE_ORIGIN} rotation={[0, RIDE_FACING, 0]}>
      {/* Ground-fixed: the apron, the rail, the steps, the column and ceiling. */}
      <Platform />
      <Canopy />

      {/* The plate, and the cups it carries round. */}
      <group ref={plate}>
        <Plate />
        {CUP_PLACEMENTS.map((placement) => (
          <group
            key={placement.index}
            position={[placement.position[0], DECK_Y, placement.position[1]]}
          >
            <Saucer />
            <group
              ref={(group) => {
                cups.current[placement.index] = group;
              }}
              position={[0, CUP_BASE_HEIGHT * 0.3, 0]}
            >
              <Cup color={placement.color} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
