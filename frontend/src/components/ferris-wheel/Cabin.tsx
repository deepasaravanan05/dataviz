"use client";

import { RoundedBox } from "@react-three/drei";
import { SEAT_GREY, SEAT_METALNESS, SEAT_ROUGHNESS } from "@/world/seatColor";
import { RIDE_PAINT } from "@/world/ridePaint";
import { CABIN_DEPTH, CABIN_HANG, CABIN_HEIGHT, CABIN_WIDTH } from "./constants";
import { cabinPaint } from "./cabinPaint";
import type { SeatColor } from "@/types/simulation";

/* The suspension is part of the WHEEL, so it wears the wheel's blue. The box
   hanging under it does not — every box is its own colour, see cabinPaint.ts. */
const METAL = RIDE_PAINT.ferris.light;

/**
 * A passenger gondola built from multiple parts (§9): suspension yoke, roof,
 * main colored body, window band, floor pan and side rails — never a bare box.
 * Rendered in the cabin's own upright space; the pivot above it cancels the
 * wheel's rotation.
 */
export function Cabin({ color, index }: { color: SeatColor; index: number }) {
  /*
   * `color` is the manifest's allocation band — which delay group this cabin
   * belongs to — and is still what the cabin counts are validated against. It
   * does NOT decide what the cabin is painted: the paint comes from the box's
   * position on the wheel, so all forty boxes differ. The one grey surface is
   * the floor pan, which is the seat, and every seat in the park is grey.
   */
  void color;
  const paint = cabinPaint(index);
  /* CABIN_HANG, not ARM_LENGTH: the cabin now rides 12.5% lower on its yoke —
     see the seat-lowering note in constants.ts. The suspension below is drawn
     from the same number, so the bars still reach the cabin they carry. */
  const bodyY = -CABIN_HANG - CABIN_HEIGHT / 2;

  return (
    <group>
      {/* --- Suspension: pivot pin, twin hanger bars, yoke --- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, CABIN_DEPTH * 0.9, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * CABIN_WIDTH * 0.34, -CABIN_HANG / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.07, CABIN_HANG, 0.07]} />
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -CABIN_HANG + 0.04, 0]} castShadow>
        <boxGeometry args={[CABIN_WIDTH * 0.78, 0.08, 0.09]} />
        <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.3} />
      </mesh>

      <group position={[0, bodyY, 0]}>
        {/* --- Main body --- */}
        <RoundedBox
          args={[CABIN_WIDTH, CABIN_HEIGHT, CABIN_DEPTH]}
          radius={0.14}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={paint.body} metalness={SEAT_METALNESS} roughness={SEAT_ROUGHNESS} />
        </RoundedBox>

        {/* --- Passenger compartment: glazed window band --- */}
        <mesh position={[0, CABIN_HEIGHT * 0.1, 0]}>
          <boxGeometry
            args={[CABIN_WIDTH * 1.01, CABIN_HEIGHT * 0.4, CABIN_DEPTH * 1.01]}
          />
          <meshPhysicalMaterial
            color="#cfe6ff"
            metalness={0.05}
            roughness={0.08}
            transmission={0.6}
            thickness={0.2}
            transparent
            opacity={0.72}
          />
        </mesh>

        {/* --- Roof --- */}
        <RoundedBox
          args={[CABIN_WIDTH * 1.12, 0.16, CABIN_DEPTH * 1.12]}
          radius={0.06}
          smoothness={3}
          position={[0, CABIN_HEIGHT / 2 + 0.05, 0]}
          castShadow
        >
          <meshStandardMaterial color={paint.trim} metalness={0.55} roughness={0.45} />
        </RoundedBox>

        {/* --- Floor pan: the surface a rider actually sits on, so it keeps the
               park's neutral seat grey while the box around it is painted. --- */}
        <RoundedBox
          args={[CABIN_WIDTH * 1.06, 0.14, CABIN_DEPTH * 1.06]}
          radius={0.05}
          smoothness={3}
          position={[0, -CABIN_HEIGHT / 2 - 0.03, 0]}
          castShadow
        >
          <meshStandardMaterial color={SEAT_GREY} metalness={SEAT_METALNESS} roughness={SEAT_ROUGHNESS} />
        </RoundedBox>

        {/* --- Side corner posts --- */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[(side * CABIN_WIDTH) / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, CABIN_HEIGHT * 0.94, CABIN_DEPTH * 0.98]} />
            <meshStandardMaterial color={paint.trim} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}

        {/* --- Front safety rail across the opening --- */}
        <mesh position={[0, -CABIN_HEIGHT * 0.16, CABIN_DEPTH / 2 + 0.02]} castShadow>
          <boxGeometry args={[CABIN_WIDTH * 0.9, 0.07, 0.06]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}
