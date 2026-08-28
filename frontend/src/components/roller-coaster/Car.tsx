"use client";

import { RoundedBox } from "@react-three/drei";
import { CAR_LENGTH, PALETTE, SEAT_MOUNT_Y } from "./constants";
import { seatsForCar } from "./seatManifest";
import { SEAT_GREY, SEAT_GREY_DARK, SEAT_METALNESS, SEAT_ROUGHNESS } from "@/world/seatColor";
import { RIDE_SEAT_SCALE } from "@/world/scale";

const SEAT_X = 0.42;
const ROW_Z = 0.44;

/**
 * One coaster car, following the reference: a bulbous mustard-yellow shell
 * with a 2x2 block of gray bucket seats and cyan over-shoulder restraints,
 * riding on a dark chassis with visible wheel assemblies.
 *
 * Ten of these make the train, four seats apiece — the 40 seats the ride now
 * carries. Every part of the seat is grey; the rider's own uniform is what
 * states their check-in band.
 */
export function Car({ index }: { index: number }) {
  const seats = seatsForCar(index);

  return (
    <group>
      {/* Chassis */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.22, CAR_LENGTH * 0.95]} />
        <meshStandardMaterial color={PALETTE.carBodyDark} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Wheel assemblies (upper, side and under-track wheels) */}
      {[-1, 1].map((side) =>
        [-1, 1].map((end) => (
          <mesh
            key={`${side}-${end}`}
            position={[side * 0.52, -0.34, end * CAR_LENGTH * 0.32]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.16, 0.16, 0.12, 10]} />
            <meshStandardMaterial color={PALETTE.carBodyDark} metalness={0.6} roughness={0.5} />
          </mesh>
        )),
      )}

      {/* Body shell */}
      <RoundedBox
        args={[1.12, 0.72, CAR_LENGTH]}
        radius={0.3}
        smoothness={4}
        position={[0, 0.08, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETTE.carBody} metalness={0.25} roughness={0.45} />
      </RoundedBox>

      {/* Nose cone on the lead car. The car's forward axis is +Z, matching
          the basis built in trainKinematics.ts — the nose must lead. */}
      {index === 0 && (
        <RoundedBox
          args={[0.95, 0.6, 0.8]}
          radius={0.28}
          smoothness={4}
          position={[0, 0.06, CAR_LENGTH * 0.66]}
          castShadow
        >
          <meshStandardMaterial color={PALETTE.carBodyDark} metalness={0.3} roughness={0.42} />
        </RoundedBox>
      )}

      {/* Side skirts */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.57, -0.06, 0]} castShadow>
          <boxGeometry args={[0.07, 0.34, CAR_LENGTH * 0.88]} />
          <meshStandardMaterial color={PALETTE.carBodyDark} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* Seats: 2 rows x 2 across */}
      {seats.map((seat) => {
        const x = seat.side * SEAT_X;
        // row 0 is the front row, so it sits toward +Z (direction of travel).
        const z = (seat.row === 0 ? 1 : -1) * ROW_Z;
        return (
          <group key={seat.index} position={[x, SEAT_MOUNT_Y, z]} scale={RIDE_SEAT_SCALE}>
            {/* Seat base */}
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.14, 0.36]} />
              {/* Grey, like every seat in the park — see world/seatColor.ts. */}
              <meshStandardMaterial color={SEAT_GREY} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
            </mesh>
            {/* Seat back */}
            <mesh position={[0, 0.22, -0.14]} castShadow>
              <boxGeometry args={[0.34, 0.42, 0.12]} />
              <meshStandardMaterial color={SEAT_GREY_DARK} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
            </mesh>
            {/* Headrest — grey too; nothing on a seat states a band. */}
            <mesh position={[0, 0.5, -0.13]} castShadow>
              <boxGeometry args={[0.3, 0.2, 0.14]} />
              {/* Grey, like every seat in the park — see world/seatColor.ts. */}
              <meshStandardMaterial
                color={SEAT_GREY_DARK}
                roughness={SEAT_ROUGHNESS}
                metalness={SEAT_METALNESS}
              />
            </mesh>
            {/* Cyan over-shoulder restraint */}
            <mesh position={[0, 0.34, 0.03]} rotation={[0.35, 0, 0]} castShadow>
              <torusGeometry args={[0.19, 0.035, 8, 16, Math.PI]} />
              <meshStandardMaterial color={PALETTE.restraint} metalness={0.55} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
