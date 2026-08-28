"use client";

import {
  GONDOLA_HEIGHT,
  GONDOLA_RADIUS,
  PALETTE,
  SEATS_PER_GONDOLA,
  SEAT_MOUNT_Y,
} from "./constants";
import { SEAT_GREY, SEAT_GREY_DARK, SEAT_METALNESS, SEAT_ROUGHNESS } from "@/world/seatColor";
import { RIDE_SEAT_SCALE } from "@/world/scale";

const LAMP_COUNT = 8;

/**
 * A tub gondola matching the reference: a brown timber tub with a gold trim
 * band top and bottom and red accent lamps around the skirt. Its two seats
 * stand empty until an employee climbs into one.
 *
 * `arm`, `gondola` and `showLabels` are kept in the signature because the arm
 * addresses its gondolas by them and the ride pages still pass the label
 * toggle down; nothing inside reads them now that the tub carries no permanent
 * passengers.
 */
export function Gondola({
  arm,
  gondola,
  showLabels,
}: {
  arm: number;
  gondola: number;
  showLabels: boolean;
}) {
  void arm;
  void gondola;
  void showLabels;

  return (
    <group>
      {/* Tub shell */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[GONDOLA_RADIUS, GONDOLA_RADIUS * 0.86, GONDOLA_HEIGHT, 10, 1, true]} />
        <meshStandardMaterial color={PALETTE.tub} roughness={0.75} metalness={0.1} side={2} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -GONDOLA_HEIGHT / 2 + 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[GONDOLA_RADIUS * 0.86, GONDOLA_RADIUS * 0.86, 0.12, 10]} />
        <meshStandardMaterial color={PALETTE.tubDark} roughness={0.85} />
      </mesh>

      {/*
        Gold trim bands, wrapping the tub.

        THE ROTATION IS NOT OPTIONAL. `TorusGeometry` is built in the XY plane,
        so a torus with no rotation STANDS UP like a wheel instead of lying flat
        like a band. These two were unrotated, which put a 1.55u ring on edge
        through each tub, hanging 1.5u below its floor — far enough that the
        rings ploughed through the grass at the bottom of the wave, which is
        what "the cups go into the soil" was. Lying flat, the lowest thing on a
        gondola is its own floor again.
      */}
      {[GONDOLA_HEIGHT / 2, -GONDOLA_HEIGHT / 2 + 0.12].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[GONDOLA_RADIUS * (i === 0 ? 1 : 0.88), 0.09, 8, 20]} />
          <meshStandardMaterial
            color={PALETTE.gold}
            metalness={0.75}
            roughness={0.3}
            emissive={PALETTE.goldDark}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {/* Red accent lamps around the skirt */}
      {Array.from({ length: LAMP_COUNT }, (_, i) => {
        const a = (i / LAMP_COUNT) * Math.PI * 2;
        return (
          <mesh
            key={`lamp-${i}`}
            position={[
              Math.cos(a) * GONDOLA_RADIUS * 0.93,
              -GONDOLA_HEIGHT * 0.12,
              Math.sin(a) * GONDOLA_RADIUS * 0.93,
            ]}
          >
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial
              color={PALETTE.redLamp}
              emissive={PALETTE.redLamp}
              emissiveIntensity={1.4}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/*
        THE TUB'S TWO SEATS, standing empty until an employee climbs in.

        This gondola used to carry permanently-seated figures, and the
        seats were part of those figures — so removing the passengers took the
        seating with them. The seats are back, on their own, grey like every
        other seat in the park and sized for the people who use them.
      */}
      {Array.from({ length: SEATS_PER_GONDOLA }, (_, seat) => {
        const a = (seat / SEATS_PER_GONDOLA) * Math.PI * 2 - Math.PI / 2;
        const r = GONDOLA_RADIUS * 0.44;
        return (
          <group
            key={seat}
            position={[Math.cos(a) * r, SEAT_MOUNT_Y, Math.sin(a) * r]}
            rotation={[0, -a + Math.PI / 2, 0]}
            scale={RIDE_SEAT_SCALE}
          >
            {/* Pan */}
            <mesh position={[0, -0.28, -0.02]} castShadow receiveShadow>
              <boxGeometry args={[0.62, 0.12, 0.56]} />
              <meshStandardMaterial color={SEAT_GREY} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
            </mesh>
            {/* Back */}
            <mesh position={[0, 0.02, -0.3]} castShadow>
              <boxGeometry args={[0.62, 0.6, 0.12]} />
              <meshStandardMaterial color={SEAT_GREY_DARK} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
            </mesh>
            {/* Frame under the pan */}
            <mesh position={[0, -0.36, -0.02]}>
              <boxGeometry args={[0.68, 0.06, 0.62]} />
              <meshStandardMaterial color={PALETTE.seatFrame} roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Hanger yoke up to the spider arm */}
      <mesh position={[0, GONDOLA_HEIGHT / 2 + 0.42, 0]} castShadow>
        <boxGeometry args={[0.14, 0.85, 0.14]} />
        <meshStandardMaterial color={PALETTE.steelDark} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}
