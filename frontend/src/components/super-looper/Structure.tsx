"use client";

import { useMemo } from "react";
import {
  BASE_HALF_LENGTH,
  BASE_HALF_WIDTH,
  BASE_HEIGHT,
  BRACE_RADIUS,
  DRIVE_ARC,
  LEG_HALF_SPREAD,
  LEG_RADIUS,
  LEG_SPLAY,
  LOOP_CENTER_Y,
  LOOP_RADIUS,
  PLATFORM_HALF_LENGTH,
  PLATFORM_INNER_Z,
  PLATFORM_SIDE,
  PLATFORM_THICKNESS,
  PLATFORM_WIDTH,
  PLATFORM_Y,
  RAIL_HEIGHT,
  TRACK_GAUGE,
} from "./constants";
import { MATERIAL, member } from "./parts";
import { STAIR_GOING, STAIR_WIDTH } from "@/simulation/journey/boardingStair";
import { STATION_FLIGHTS, STATION_RISE } from "./station";

/**
 * THE GROUND-FIXED HALF: the chassis, the two A-frames, the drive tyres, and
 * the platform riders board from.
 *
 * THE FRAMES TAKE THE LOOP AT ITS OWN HARD POINTS — three o'clock and nine
 * o'clock, the widest points of the ring, which is where a real Super Loop is
 * trussed. Each frame is a pair of legs splaying back across the loop's plane
 * from that hard point down to the chassis, so the ring is braced sideways as
 * well as held up, and the whole of the loop's plane stays clear for the train.
 *
 * THE PLATFORM IS WHERE THE CAR FLOOR STOPS. The train comes to rest at the
 * bottom of the loop by itself — that is what a loop does — so the boards are
 * laid at the height the seats actually wait at and the steps are counted from
 * the ground to there. It comes out as one short straight flight, which is the
 * standing preference on this park: the ride brings itself to the people.
 *
 * The steps are the park's OWN stair dimensions, the ones every boarding stair
 * in the park is built from, so this flight matches the other five rather than
 * inventing a step of its own.
 */

function Chassis() {
  return (
    <group>
      <mesh position={[0, BASE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BASE_HALF_LENGTH * 2, BASE_HEIGHT, BASE_HALF_WIDTH * 2]} />
        <primitive object={MATERIAL.chassis} attach="material" />
      </mesh>
      {/* Painted band round the chassis, the livery carried to the ground. */}
      <mesh position={[0, BASE_HEIGHT - 0.28, 0]}>
        <boxGeometry args={[BASE_HALF_LENGTH * 2 + 0.2, 0.34, BASE_HALF_WIDTH * 2 + 0.2]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
      {/* Outriggers and feet, as a transportable ride stands on. */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * (BASE_HALF_LENGTH - 1.4), 0.35, sz * (BASE_HALF_WIDTH + 1.1)]}
          >
            <cylinderGeometry args={[1.0, 1.25, 0.7, 10]} />
            <primitive object={MATERIAL.steelDark} attach="material" />
          </mesh>
        )),
      )}
    </group>
  );
}

/** One A-frame: two legs from the chassis up to one hard point on the ring. */
function Frame({ side }: { side: number }) {
  const head: [number, number, number] = [side * LOOP_RADIUS, LOOP_CENTER_Y, 0];
  const legs = useMemo(
    () =>
      [-1, 1].map((sz) => ({
        key: sz,
        ...member(
          [side * (LOOP_RADIUS + LEG_SPLAY), BASE_HEIGHT, sz * LEG_HALF_SPREAD],
          head,
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [side],
  );

  return (
    <group>
      {legs.map((l) => (
        <mesh
          key={l.key}
          position={l.position}
          quaternion={l.quaternion}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[LEG_RADIUS * 0.7, LEG_RADIUS, l.length, 12]} />
          <primitive object={MATERIAL.truss} attach="material" />
        </mesh>
      ))}
      {/* Ties across the frame, at two heights, so it reads as a frame. */}
      {[0.34, 0.68].map((f) => {
        const y = BASE_HEIGHT + (LOOP_CENTER_Y - BASE_HEIGHT) * f;
        const x = side * (LOOP_RADIUS + LEG_SPLAY * (1 - f));
        return (
          <mesh key={f} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry
              args={[BRACE_RADIUS, BRACE_RADIUS, LEG_HALF_SPREAD * 2 * (1 - f), 8]}
            />
            <primitive object={MATERIAL.trussDark} attach="material" />
          </mesh>
        );
      })}
      {/* The bearing block where the frame meets the ring. */}
      <mesh position={head} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LEG_RADIUS * 1.5, LEG_RADIUS * 1.5, TRACK_GAUGE * 1.4, 12]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The drive tyres: the machine that makes this ride what it is.
 *
 * Two banks of them either side of the rail, along the arc at the bottom where
 * the train is pushed and later held — the same arc `loopMotion.ts` applies
 * the drive over, read from the same constant, so what is drawn is where the
 * force is.
 */
function DriveTyres() {
  const tyres = useMemo(() => {
    const count = 9;
    return Array.from({ length: count }, (_, i) => {
      const a = -DRIVE_ARC + ((i + 0.5) / count) * DRIVE_ARC * 2;
      /* Angles are measured from the BOTTOM of the loop, which is -Y. */
      const theta = a - Math.PI / 2;
      return { key: i, x: Math.cos(theta) * LOOP_RADIUS, y: Math.sin(theta) * LOOP_RADIUS, a };
    });
  }, []);

  return (
    <group position={[0, LOOP_CENTER_Y, 0]}>
      {tyres.map((t) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${t.key}${sz}`}
            position={[t.x, t.y, sz * (TRACK_GAUGE / 2 + 0.42)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.42, 0.42, 0.26, 12]} />
            <primitive object={MATERIAL.tyre} attach="material" />
          </mesh>
        )),
      )}
    </group>
  );
}

/** The boarding platform, its rail, and the flight of steps up to it. */
function Station() {
  const zNear = PLATFORM_SIDE * PLATFORM_INNER_Z;
  const zFar = PLATFORM_SIDE * (PLATFORM_INNER_Z + PLATFORM_WIDTH);
  const zMid = (zNear + zFar) / 2;

  /*
   * THE FLIGHTS.
   *
   * At the size Larson build this machine the car floor was three metres up
   * and one straight flight reached it. Built to the Dragon Ride's height it
   * is eight, which is more than a single flight may be — so the climb breaks
   * into a switchback, on the park's own rule about how tall a flight can get
   * and at the park's own rise and going. Two lanes side by side with a
   * landing at the turn, which is what every other boarding stair in the park
   * looks like, and what keeps an eight-metre climb from needing a
   * twelve-metre run.
   */
  const flights = STATION_FLIGHTS;
  const flightCount = flights.length;
  const rise = STATION_RISE;
  const run = Math.max(...flights) * STAIR_GOING;
  const lane = (STAIR_WIDTH + 0.25) / 2;
  const stairX = -PLATFORM_HALF_LENGTH + STAIR_WIDTH / 2 + lane;
  const zInner = zFar + PLATFORM_SIDE * 0.3;
  const zOuter = zInner + PLATFORM_SIDE * run;

  return (
    <group>
      {/* The boards. */}
      <mesh position={[0, PLATFORM_Y - PLATFORM_THICKNESS / 2, zMid]} castShadow receiveShadow>
        <boxGeometry args={[PLATFORM_HALF_LENGTH * 2, PLATFORM_THICKNESS, PLATFORM_WIDTH]} />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>
      <mesh position={[0, PLATFORM_Y, zNear]}>
        <boxGeometry args={[PLATFORM_HALF_LENGTH * 2, 0.16, 0.22]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
      {/* Legs under it. */}
      {[-1, -0.34, 0.34, 1].map((f) => (
        <mesh
          key={f}
          position={[
            f * (PLATFORM_HALF_LENGTH - 0.6),
            (PLATFORM_Y - PLATFORM_THICKNESS) / 2,
            zFar - PLATFORM_SIDE * 0.6,
          ]}
        >
          <cylinderGeometry args={[0.16, 0.18, PLATFORM_Y - PLATFORM_THICKNESS, 8]} />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>
      ))}
      {/* Back rail, so the platform is a platform and not a shelf. */}
      {[0, 1].map((k) => (
        <mesh key={k} position={[0, PLATFORM_Y + RAIL_HEIGHT * (k ? 1 : 0.55), zFar]}>
          <boxGeometry args={[PLATFORM_HALF_LENGTH * 2, 0.09, 0.09]} />
          <primitive object={MATERIAL.steel} attach="material" />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const x = -PLATFORM_HALF_LENGTH + ((i + 0.5) / 7) * PLATFORM_HALF_LENGTH * 2;
        return (
          <mesh key={i} position={[x, PLATFORM_Y + RAIL_HEIGHT / 2, zFar]}>
            <boxGeometry args={[0.08, RAIL_HEIGHT, 0.08]} />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
        );
      })}

      {/* The flights, laid out from the ground up, turning at each landing. */}
      {flights.map((steps, k) => {
        const below = flights.slice(0, k).reduce((a, n) => a + n, 0);
        const bottomY = below * rise;
        const forward = k % 2 === 0;
        const fromZ = forward ? zInner : zOuter;
        const toZ = forward ? zOuter : zInner;
        const x = stairX + (flightCount === 1 ? 0 : forward ? -lane : lane);
        const tread = rise * 0.24;
        const flightRun = steps * STAIR_GOING;
        return (
          <group key={k}>
            {Array.from({ length: steps }, (_, i) => (
              <mesh
                key={i}
                position={[
                  x,
                  bottomY + (i + 1) * rise - tread / 2,
                  fromZ + (toZ - fromZ) * ((i + 0.5) / steps),
                ]}
                receiveShadow
              >
                <boxGeometry args={[STAIR_WIDTH, tread, STAIR_GOING]} />
                <primitive object={MATERIAL.deck} attach="material" />
              </mesh>
            ))}
            {/* Stringer and handrails along this flight's own line. */}
            {[-1, 1].map((side) => (
              <group key={side}>
                <mesh
                  position={[
                    x + (side * STAIR_WIDTH) / 2,
                    bottomY + (steps * rise) / 2 + RAIL_HEIGHT * 0.8,
                    (fromZ + toZ) / 2,
                  ]}
                  rotation={[
                    Math.atan2(steps * rise, flightRun) * (toZ > fromZ ? -1 : 1),
                    0,
                    0,
                  ]}
                >
                  <boxGeometry args={[0.08, 0.08, Math.hypot(flightRun, steps * rise)]} />
                  <primitive object={MATERIAL.steel} attach="material" />
                </mesh>
                <mesh
                  position={[
                    x + (side * STAIR_WIDTH) / 2,
                    bottomY + (steps * rise) / 2 - 0.18,
                    (fromZ + toZ) / 2,
                  ]}
                  rotation={[
                    Math.atan2(steps * rise, flightRun) * (toZ > fromZ ? -1 : 1),
                    0,
                    0,
                  ]}
                >
                  <boxGeometry args={[0.14, 0.34, Math.hypot(flightRun, steps * rise)]} />
                  <primitive object={MATERIAL.steelDark} attach="material" />
                </mesh>
              </group>
            ))}
            {/* The landing this flight arrives on, if another one follows it. */}
            {k < flightCount - 1 && (
              <mesh
                position={[stairX, bottomY + steps * rise - 0.09, toZ]}
                receiveShadow
              >
                <boxGeometry args={[STAIR_WIDTH * 2 + 0.25, 0.18, STAIR_WIDTH]} />
                <primitive object={MATERIAL.deck} attach="material" />
              </mesh>
            )}
            {/* Legs under the landing and the flight's own head. */}
            <mesh position={[stairX, (bottomY + steps * rise) / 2, toZ]}>
              <cylinderGeometry args={[0.13, 0.15, bottomY + steps * rise, 8]} />
              <primitive object={MATERIAL.steelDark} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Everything that does not move. */
export function Structure() {
  return (
    <group>
      <Chassis />
      <Frame side={1} />
      <Frame side={-1} />
      <DriveTyres />
      <Station />
    </group>
  );
}
