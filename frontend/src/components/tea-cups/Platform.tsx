"use client";

import { useMemo } from "react";
import {
  APRON_RADIUS,
  APRON_THICKNESS,
  GATE_WIDTH,
  PLATE_RADIUS,
  PLATE_THICKNESS,
  PLINTH_HEIGHT,
  RAIL_HEIGHT,
} from "./constants";
import { LAY_FLAT, MATERIAL } from "./parts";
import { STAIR_GOING, STAIR_WIDTH } from "@/simulation/journey/boardingStair";
import { STATION_FLIGHTS, STATION_RISE } from "./station";

/**
 * THE GROUND-FIXED HALF: the apron the machine stands in, the rail round it,
 * and the steps up.
 *
 * The apron is Beston's own "equipment size required: 8 x 8 m", drawn as the
 * ground the ride occupies rather than as a square of concrete nobody would
 * see the corners of.
 *
 * A tea cup ride loads off its own plate — it stops, the gate opens, and
 * people walk across the deck into a cup — so the only climb on the whole ride
 * is the plinth. It comes out at a couple of the park's own steps, which makes
 * this the shortest way onto any ride in the park. The steps are the PARK'S
 * step, from `boardingStair.ts`, so this flight matches the other five rather
 * than inventing a rise of its own.
 *
 * THE GATE FACES BACK TOWARDS THE ENTRANCE — local +X here — so somebody
 * walking round the pendulum this ride stands behind arrives at the steps
 * rather than at the back of the rail.
 */
export function Platform() {
  /*
   * The flights. One while the plate was a hand's breadth thick; two now that
   * the ride is built twenty times over and the plate with it. The split is
   * the park's own rule about how tall a flight may get — see station.ts.
   */
  const flights = STATION_FLIGHTS;
  const rise = STATION_RISE;
  const lane = (STAIR_WIDTH + 0.25) / 2;
  const stairX = PLATE_RADIUS + 0.9;
  const run = Math.max(...flights) * STAIR_GOING;

  const posts = useMemo(() => {
    const count = 32;
    const gateHalf = Math.atan2(GATE_WIDTH / 2, APRON_RADIUS);
    return Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2).filter((a) => {
      let d = a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return Math.abs(d) > gateHalf;
    });
  }, []);

  const railArc = Math.PI * 2 - 2 * Math.atan2(GATE_WIDTH / 2, APRON_RADIUS);

  return (
    <group>
      {/*
        The apron: the ground the machine occupies, laid as paving rather than
        as a step. It is deliberately thin — the rail stands on it and the
        stair rises from it, and a half-metre kerb here would bury the foot of
        both.
      */}
      <mesh position={[0, APRON_THICKNESS / 2, 0]} receiveShadow>
        <cylinderGeometry args={[APRON_RADIUS, APRON_RADIUS + 0.3, APRON_THICKNESS, 56]} />
        <primitive object={MATERIAL.plinth} attach="material" />
      </mesh>
      <mesh position={[0, PLINTH_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[PLATE_RADIUS + 0.4, PLATE_RADIUS + 0.7, PLINTH_HEIGHT, 56]} />
        <primitive object={MATERIAL.plinth} attach="material" />
      </mesh>
      <mesh position={[0, PLINTH_HEIGHT, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PLATE_RADIUS + 0.4, 0.16, 6, 56]} />
        <primitive object={MATERIAL.plinthTrim} attach="material" />
      </mesh>

      {/*
        The hand rail round the apron, broken for the gate. The arc is spun
        about the torus's own axis before it is laid flat, which puts the
        opening on local +X — the side the steps come up.
      */}
      {[RAIL_HEIGHT, RAIL_HEIGHT * 0.52].map((h) => (
        <mesh
          key={h}
          position={[0, APRON_THICKNESS + h, 0]}
          rotation={[LAY_FLAT[0], 0, (Math.PI * 2 - railArc) / 2]}
        >
          <torusGeometry args={[APRON_RADIUS, 0.06, 6, 80, railArc]} />
          <primitive object={MATERIAL.rail} attach="material" />
        </mesh>
      ))}
      {posts.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a) * APRON_RADIUS,
            APRON_THICKNESS + RAIL_HEIGHT / 2,
            Math.sin(a) * APRON_RADIUS,
          ]}
        >
          <cylinderGeometry args={[0.06, 0.06, RAIL_HEIGHT, 6]} />
          <primitive object={MATERIAL.rail} attach="material" />
        </mesh>
      ))}

      {/*
        The steps at the gate, on the park's own rise and going, turning at a
        landing if the climb needs more than one flight.
      */}
      {flights.map((steps, k) => {
        const below = flights.slice(0, k).reduce((a, n) => a + n, 0);
        const bottomY = below * rise;
        const outward = k % 2 === 0;
        const fromX = stairX + (outward ? run : 0);
        const toX = stairX + (outward ? 0 : run);
        const z = flights.length === 1 ? 0 : outward ? -lane : lane;
        const tread = rise * 0.26;
        const flightRun = steps * STAIR_GOING;
        return (
          <group key={k}>
            {Array.from({ length: steps }, (_, i) => (
              <mesh
                key={i}
                position={[
                  fromX + (toX - fromX) * ((i + 0.5) / steps),
                  bottomY + (i + 1) * rise - tread / 2,
                  z,
                ]}
                receiveShadow
              >
                <boxGeometry args={[STAIR_GOING, tread, STAIR_WIDTH]} />
                <primitive object={MATERIAL.deck} attach="material" />
              </mesh>
            ))}
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[
                  (fromX + toX) / 2,
                  bottomY + (steps * rise) / 2 + RAIL_HEIGHT * 0.8,
                  z + (side * STAIR_WIDTH) / 2,
                ]}
                rotation={[0, 0, Math.atan2(steps * rise, flightRun) * (toX > fromX ? 1 : -1)]}
              >
                <boxGeometry args={[Math.hypot(flightRun, steps * rise), 0.07, 0.07]} />
                <primitive object={MATERIAL.rail} attach="material" />
              </mesh>
            ))}
            {k < flights.length - 1 && (
              <mesh position={[toX, bottomY + steps * rise - 0.08, 0]} receiveShadow>
                <boxGeometry args={[STAIR_WIDTH, 0.16, STAIR_WIDTH * 2 + 0.25]} />
                <primitive object={MATERIAL.deck} attach="material" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** The large plate itself: the floor riders walk on, and what carries the cups. */
export function Plate() {
  return (
    <group position={[0, PLINTH_HEIGHT, 0]}>
      <mesh position={[0, PLATE_THICKNESS / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PLATE_RADIUS, PLATE_RADIUS, PLATE_THICKNESS, 64]} />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>
      <mesh position={[0, PLATE_THICKNESS, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PLATE_RADIUS, 0.13, 6, 64]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
    </group>
  );
}
