"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Object3D } from "three";
import { Car } from "./Car";
import { CAR_COUNT, CAR_SPACING, SEATS_PER_CAR, TRAIN_SPEED } from "./constants";
import { TRACK_LENGTH } from "./trackCurve";
import { carTransform, createCarTransform } from "./trainKinematics";
import { validateSeats } from "./seatManifest";
import { rideAnimationSecondsNow } from "@/simulation/journey/activeRideOps";

/**
 * Places each car on the circuit and orients it from the track frame, so the
 * train pitches up on the lift hill, pitches down through the drop, yaws
 * through turns and goes fully inverted at the top of the loop — all derived
 * from the curve tangent rather than fixed rotations.
 *
 * Cars are spaced by arc length so spacing stays constant through curves.
 */
export function Train() {
  const groupRef = useRef<Group>(null);
  const validated = useRef(false);
  const scratch = useMemo(() => createCarTransform(), []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    /*
     * The train's place on the circuit comes from the ride's own animation
     * clock rather than from an accumulating counter, so the coaster stands in
     * its station between dispatches and runs a whole number of laps when it
     * is released — ending exactly where it started, which is what puts the
     * cars back at the platform for the next group. Its speed, spacing and
     * banking are untouched.
     */
    const progress = ((TRAIN_SPEED * rideAnimationSecondsNow("coaster")) % 1 + 1) % 1;
    const spacingU = CAR_SPACING / TRACK_LENGTH;

    group.children.forEach((car: Object3D, i: number) => {
      const { position, quaternion } = carTransform(progress - i * spacingU, scratch);
      car.position.copy(position);
      car.quaternion.copy(quaternion);
    });

    if (!validated.current) {
      validated.current = true;
      if (process.env.NODE_ENV !== "production") {
        validateSeats();
        console.assert(
          group.children.length === CAR_COUNT,
          `Expected ${CAR_COUNT} cars, found ${group.children.length}`,
        );
        console.info(
          `[RollerCoaster] ${group.children.length} cars x ${SEATS_PER_CAR} seats = ` +
            `${group.children.length * SEATS_PER_CAR} seats on a ${TRACK_LENGTH.toFixed(1)}u circuit`,
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: CAR_COUNT }, (_, i) => (
        <group key={i}>
          <Car index={i} />
        </group>
      ))}
    </group>
  );
}
