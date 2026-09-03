"use client";

import { useMemo } from "react";
import {
  CAR_COUNT,
  CAR_FLOOR_THICKNESS,
  CAR_LENGTH,
  CAR_PITCH,
  CAR_WIDTH,
  CAR_CENTER_OFFSET,
  HARNESS_RADIUS,
  HARNESS_Y,
  HEADREST_HEIGHT,
  LOOP_RADIUS,
  RAIL_RADIUS,
  RIDERS_PER_CAR,
  SEAT_BACK_HEIGHT,
  SEAT_PAN_Y,
  TRACK_GAUGE,
  carColor,
} from "./constants";
import { MATERIAL, liveryMaterial } from "./parts";

/**
 * ONE CAR, and the train of them.
 *
 * A car is two seats side by side facing the way it is going, with an
 * over-the-shoulder restraint each, on a chassis whose wheels grip the rail
 * from above, below and inside. Those up-stop wheels are the reason this ride
 * works at all: they are what makes the train captive, and a captive train can
 * crawl over the top of a loop at walking pace instead of needing to be thrown
 * over it. The ride's whole cycle in `loopMotion.ts` rests on that.
 *
 * ORIENTATION. Inside this component the car's local +Y points at the loop's
 * CENTRE — up, when the car is at the bottom of the loop, and straight down at
 * the top of it, which is where the riders end up hanging. Local +X is the
 * direction of travel and local Z runs across the track. The car is drawn once
 * in that frame and the ring does the rest: put it at an angle round the loop
 * and it tips exactly as the machine tips it.
 */

function Car({ color }: { color: string }) {
  const seats = useMemo(
    () =>
      Array.from({ length: RIDERS_PER_CAR }, (_, i) => ({
        key: i,
        z: (i - (RIDERS_PER_CAR - 1) / 2) * (CAR_WIDTH / RIDERS_PER_CAR),
      })),
    [],
  );

  return (
    <group>
      {/* The chassis, and the painted body panel that carries the livery. */}
      <mesh position={[0, CAR_FLOOR_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[CAR_LENGTH, CAR_FLOOR_THICKNESS, CAR_WIDTH]} />
        <primitive object={MATERIAL.carBody} attach="material" />
      </mesh>
      <mesh position={[0, CAR_FLOOR_THICKNESS + SEAT_PAN_Y * 0.42, 0]}>
        <boxGeometry args={[CAR_LENGTH * 0.98, SEAT_PAN_Y * 0.84, CAR_WIDTH * 1.02]} />
        <primitive object={liveryMaterial(color)} attach="material" />
      </mesh>

      {seats.map((s) => (
        <group key={s.key} position={[0, 0, s.z]}>
          {/* Pan, back and headrest, at the size of the person in them. */}
          <mesh position={[0, SEAT_PAN_Y, 0]}>
            <boxGeometry args={[CAR_LENGTH * 0.7, 0.1, CAR_WIDTH / RIDERS_PER_CAR - 0.12]} />
            <primitive object={MATERIAL.seatCushion} attach="material" />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.3, SEAT_PAN_Y + SEAT_BACK_HEIGHT / 2, 0]}>
            <boxGeometry args={[0.12, SEAT_BACK_HEIGHT, CAR_WIDTH / RIDERS_PER_CAR - 0.12]} />
            <primitive object={MATERIAL.seatCushion} attach="material" />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.3, SEAT_PAN_Y + HEADREST_HEIGHT, 0]}>
            <boxGeometry args={[0.16, 0.34, CAR_WIDTH / RIDERS_PER_CAR - 0.2]} />
            <primitive object={MATERIAL.carBody} attach="material" />
          </mesh>
          {/* The over-the-shoulder restraint, closed. */}
          <mesh
            position={[-CAR_LENGTH * 0.12, SEAT_PAN_Y + HARNESS_Y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[HARNESS_RADIUS, HARNESS_RADIUS, CAR_WIDTH / RIDERS_PER_CAR - 0.16, 8]}
            />
            <primitive object={MATERIAL.harness} attach="material" />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.24, SEAT_PAN_Y + HARNESS_Y + 0.2, 0]}>
            <boxGeometry args={[0.3, HARNESS_RADIUS * 2, HARNESS_RADIUS * 2]} />
            <primitive object={MATERIAL.harness} attach="material" />
          </mesh>
        </group>
      ))}

      {/*
        The wheels that make it captive: one running on top of the rail, one
        under it. Drawn on both rails, at both ends of the car.
      */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) =>
          [1, -1].map((updown) => (
            <mesh
              key={`${sx}${sz}${updown}`}
              position={[
                sx * CAR_LENGTH * 0.32,
                CAR_CENTER_OFFSET * -1 + updown * RAIL_RADIUS * 1.6,
                (sz * TRACK_GAUGE) / 2,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.2, 0.2, 0.16, 10]} />
              <primitive object={MATERIAL.steelDark} attach="material" />
            </mesh>
          )),
        ),
      )}
      {/* The bogie that carries those wheels down to the rail. It passes
          BETWEEN the rails rather than through them, which is what sets its
          width: the gauge, less a rail either side and a working gap. */}
      <mesh position={[0, -CAR_CENTER_OFFSET / 2, 0]}>
        <boxGeometry
          args={[CAR_LENGTH * 0.5, CAR_CENTER_OFFSET, TRACK_GAUGE - 2 * RAIL_RADIUS - 0.16]}
        />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The train, laid out round the ring behind its lead car.
 *
 * Each car is placed at its own angle — one car pitch of arc behind the one in
 * front — inside a single group. The ride then turns THAT group, so the whole
 * train moves as one and no car can ever drift out of step with its
 * neighbours. It is a train, not fifteen things that happen to be animated
 * together.
 */
export function Train() {
  const cars = useMemo(
    () =>
      Array.from({ length: CAR_COUNT }, (_, i) => ({
        key: i,
        /* Centred on the train's own middle, which is the point the motion
           solves for and the point that stops over the platform. */
        angle: ((i - (CAR_COUNT - 1) / 2) * CAR_PITCH) / LOOP_RADIUS,
        color: carColor(i),
      })),
    [],
  );

  return (
    <group>
      {cars.map((c) => (
        <group key={c.key} rotation={[0, 0, c.angle]}>
          {/* Down to the rail at the bottom of the ring, then up into the car. */}
          <group position={[0, -(LOOP_RADIUS - CAR_CENTER_OFFSET), 0]}>
            <Car color={c.color} />
          </group>
        </group>
      ))}
    </group>
  );
}
