"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Locomotive } from "./Locomotive";
import { Carriage } from "./Carriage";
import {
  CARRIAGE_COUNT,
  CAR_SPACING,
  TRAIN_BODY_SCALE,
  TRAIN_SPEED_UNITS_PER_SEC,
} from "./constants";
import { TRACK_LENGTH } from "./trainTrack";
import { carTransform, createCarTransform } from "./trainKinematics";
import { validateRiders } from "./riders";

/**
 * Locomotive + carriages, all following the SAME closed curve at a fixed
 * arc-length spacing behind a single progress value — never moved
 * independently. Progress increases monotonically and wraps automatically
 * (u % 1), so the train loops the park continuously and indefinitely.
 */
export function ParkTrain({ showLabels = false }: { showLabels?: boolean }) {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  const scratch = useRef(createCarTransform());
  const validated = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateRiders();
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    progress.current = (progress.current + (delta * TRAIN_SPEED_UNITS_PER_SEC) / TRACK_LENGTH) % 1;
    const spacingU = CAR_SPACING / TRACK_LENGTH;

    group.children.forEach((car, i) => {
      const { position, quaternion } = carTransform(progress.current - i * spacingU, scratch.current);
      car.position.copy(position);
      car.quaternion.copy(quaternion);
    });

    if (!validated.current) {
      validated.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[ParkTrain] locomotive + ${CARRIAGE_COUNT} carriages on a ${TRACK_LENGTH.toFixed(1)}u loop`,
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/*
        EVERY VEHICLE IS DRAWN AT TRAIN_BODY_SCALE.

        The scale goes on each vehicle, not on the train as a whole, because the
        frame loop above places these children ON the track — scaling their
        parent would scale the positions it writes and lift the train off its
        rails. Scaling each one about its own origin makes the engine and the
        carriages bigger while every one of them stays exactly on the curve.
        The loop writes position and quaternion only, so the scale survives.
      */}
      <group scale={TRAIN_BODY_SCALE}>
        <Locomotive />
      </group>
      {Array.from({ length: CARRIAGE_COUNT }, (_, i) => (
        <group key={i} scale={TRAIN_BODY_SCALE}>
          <Carriage index={i} showLabels={showLabels} />
        </group>
      ))}
    </group>
  );
}
