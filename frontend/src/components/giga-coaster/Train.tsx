"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import {
  CAR_COUNT,
  CAR_LENGTH,
  CAR_PITCH,
  CAR_RIDE_HEIGHT,
  CAR_WIDTH,
  HARNESS_RADIUS,
  ROWS_PER_CAR,
  ROW_PITCH,
  SEATS_PER_ROW,
  SEAT_BACK_HEIGHT,
  SEAT_PAN_Y,
  SEAT_WIDTH,
  TRACK_GAUGE,
  carColor,
} from "./constants";
import { frameAtDistance } from "./trackFrames";
import { MATERIAL, liveryMaterial } from "./parts";

/**
 * THE TRAIN: eight cars, four riders each, running the circuit.
 *
 * ONE CAR is a chassis, two rows of two seats with over-the-shoulder
 * restraints, and the wheels that keep it on the rail — above it, below it and
 * against its side, which is what makes a coaster train captive and lets it go
 * over a crest at walking pace.
 *
 * HOW IT IS PLACED. Each car sits at its own distance along the track, one car
 * pitch behind the one in front, and takes its position and its orientation
 * from the SAME frames the rails are drawn from. So the train is banked with
 * the track through every corner, and no car can drift off the rail its own
 * wheels are drawn gripping.
 *
 * THE WHOLE TRAIN IS DRIVEN BY ONE NUMBER — where the lead car is — which the
 * ride's frame loop sets from the run table. Nothing here integrates anything.
 */

export interface TrainHandle {
  /** Put the lead car this far along the track; the rest follow it. */
  setDistance: (distance: number) => void;
}

function Car({ color }: { color: string }) {
  const rows = useMemo(
    () =>
      Array.from({ length: ROWS_PER_CAR }, (_, r) =>
        Array.from({ length: SEATS_PER_ROW }, (_, s) => ({
          key: `${r}-${s}`,
          x: (r - (ROWS_PER_CAR - 1) / 2) * ROW_PITCH,
          z: (s - (SEATS_PER_ROW - 1) / 2) * SEAT_WIDTH,
        })),
      ).flat(),
    [],
  );

  return (
    <group>
      {/* Chassis and the painted body panel that carries the livery. */}
      <mesh position={[0, CAR_RIDE_HEIGHT * 0.55, 0]} castShadow>
        <boxGeometry args={[CAR_LENGTH, CAR_RIDE_HEIGHT * 0.5, CAR_WIDTH]} />
        <primitive object={MATERIAL.carBody} attach="material" />
      </mesh>
      <mesh position={[0, CAR_RIDE_HEIGHT + SEAT_PAN_Y * 0.4, 0]}>
        <boxGeometry args={[CAR_LENGTH * 0.96, SEAT_PAN_Y * 0.8, CAR_WIDTH * 1.02]} />
        <primitive object={liveryMaterial(color)} attach="material" />
      </mesh>

      {rows.map((seat) => (
        <group key={seat.key} position={[seat.x, CAR_RIDE_HEIGHT, seat.z]}>
          <mesh position={[0, SEAT_PAN_Y, 0]}>
            <boxGeometry args={[ROW_PITCH * 0.6, 0.1, SEAT_WIDTH * 0.86]} />
            <primitive object={MATERIAL.seatCushion} attach="material" />
          </mesh>
          <mesh position={[-ROW_PITCH * 0.26, SEAT_PAN_Y + SEAT_BACK_HEIGHT / 2, 0]}>
            <boxGeometry args={[0.12, SEAT_BACK_HEIGHT, SEAT_WIDTH * 0.86]} />
            <primitive object={MATERIAL.seatCushion} attach="material" />
          </mesh>
          {/* The over-the-shoulder restraint, closed. */}
          <mesh
            position={[-ROW_PITCH * 0.1, SEAT_PAN_Y + SEAT_BACK_HEIGHT * 0.78, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[HARNESS_RADIUS, HARNESS_RADIUS, SEAT_WIDTH * 0.8, 8]} />
            <primitive object={MATERIAL.harness} attach="material" />
          </mesh>
        </group>
      ))}

      {/*
        The wheels that make the train captive: one on top of the rail, one
        under it and one against its side, on both rails at both ends.
      */}
      {[-1, 1].map((end) =>
        [-1, 1].map((side) =>
          [0.35, -0.35].map((updown) => (
            <mesh
              key={`${end}${side}${updown}`}
              position={[
                end * CAR_LENGTH * 0.34,
                updown,
                (side * TRACK_GAUGE) / 2,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.22, 0.22, 0.18, 10]} />
              <primitive object={MATERIAL.wheel} attach="material" />
            </mesh>
          )),
        ),
      )}
    </group>
  );
}

export const Train = forwardRef<TrainHandle>(function Train(_, ref) {
  const cars = useRef<(Group | null)[]>([]);

  useImperativeHandle(ref, () => ({
    setDistance(distance: number) {
      for (let i = 0; i < CAR_COUNT; i++) {
        const car = cars.current[i];
        if (!car) continue;
        const frame = frameAtDistance(distance - i * CAR_PITCH);
        car.position.copy(frame.position);
        /* Local +X along the track, +Y out of it: exactly the car's own axes. */
        const basis = new THREE.Matrix4().makeBasis(
          frame.tangent,
          frame.up,
          new THREE.Vector3().crossVectors(frame.tangent, frame.up).normalize().negate(),
        );
        car.quaternion.setFromRotationMatrix(basis);
      }
    },
  }));

  return (
    <group>
      {Array.from({ length: CAR_COUNT }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            cars.current[i] = g;
          }}
        >
          <Car color={carColor(i)} />
        </group>
      ))}
    </group>
  );
});
