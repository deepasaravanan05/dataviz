"use client";

import { Instance, Instances } from "@react-three/drei";
import type { RefObject } from "react";
import type { Group } from "three";
import {
  ARM_COUNT,
  CANOPY_R,
  CANOPY_Y,
  COLLAR_INNER_R,
  COLLAR_OUTER_R,
  FOOTREST_R,
  INNER_HOOP_R,
  OUTER_HOOP_R,
  PALETTE,
  SEAT_ANGLE_STEP,
  SEAT_RING_R,
  TOWER_HALF,
} from "./constants";
import { SeatedRider } from "./SeatedRider";
import { SEAT_COLOR_HEX, TOWER_RIDERS } from "./riders";

/**
 * The passenger gondola: a red structural spider clamped around the mast,
 * carrying sixty individual outward-facing seats in one ring beneath a
 * polygonal canopy.
 *
 * The component's origin is the seat-deck plane. Everything — structure,
 * seats, restraints and riders — is a descendant, so the parent only has to
 * move this group in Y and the whole car travels as one rigid body.
 *
 * `restraintsRef` is handed down from the ride so a single animation loop can
 * drive all sixty shoulder bars; each direct child of that group is one seat's
 * angular frame, whose own first child is the restraint pivot.
 */

const SEAT_ANGLES = TOWER_RIDERS.map((r) => r.seatIndex * SEAT_ANGLE_STEP);

/** Radial arms of the spider, each spanning two seats. */
const ARM_ANGLES = Array.from({ length: ARM_COUNT }, (_, i) => (i / ARM_COUNT) * Math.PI * 2);

/** Struts bracing the canopy back down to the collar. */
const CANOPY_STRUT_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function Hoop({ radius, tube, color }: { radius: number; tube: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[radius, tube, 8, 44]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.4} />
    </mesh>
  );
}

/** One seat's static shell: pan, back, side bolsters and its mounting post. */
function SeatShell({ color }: { color: string }) {
  return (
    <group>
      {/* Mounting post down to the spider arm */}
      <mesh position={[0, -0.42, -0.1]} castShadow>
        <boxGeometry args={[0.3, 0.62, 0.3]} />
        <meshStandardMaterial color={PALETTE.spiderDark} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Seat pan — carries the employee's status colour */}
      <mesh position={[0, 0, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.14, 0.72]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
      </mesh>
      {/* Navy backrest, tipped back slightly */}
      <mesh position={[0, 0.62, -0.36]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.82, 1.2, 0.16]} />
        <meshStandardMaterial color={PALETTE.seatShell} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Head/shoulder wings either side, as on the reference's moulded shells */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.39, 0.82, -0.28]} rotation={[-0.14, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.72, 0.34]} />
          <meshStandardMaterial color={PALETTE.seatShellDark} metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      {/* Side bolsters on the pan */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 0.1, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.26, 0.68]} />
          <meshStandardMaterial color={PALETTE.seatShellDark} metalness={0.2} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** The over-the-shoulder restraint that swings down over a rider. */
function Restraint() {
  return (
    <group>
      {/* Pivot housing */}
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.74, 10]} />
        <meshStandardMaterial color={PALETTE.restraintPad} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Shoulder yokes coming forward over the rider */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.3, -0.34, 0.2]} rotation={[0.5, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.62, 4, 8]} />
            <meshStandardMaterial color={PALETTE.restraint} metalness={0.35} roughness={0.55} />
          </mesh>
          <mesh position={[s * 0.24, -0.74, 0.44]} rotation={[0.95, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.42, 4, 8]} />
            <meshStandardMaterial color={PALETTE.restraint} metalness={0.35} roughness={0.55} />
          </mesh>
        </group>
      ))}
      {/* Chest pad bridging the two yokes */}
      <mesh position={[0, -0.86, 0.5]} rotation={[0.32, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.14]} />
        <meshStandardMaterial color={PALETTE.restraintPad} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Gondola({
  showLabels,
  restraintsRef,
}: {
  showLabels: boolean;
  restraintsRef: RefObject<Group | null>;
}) {
  return (
    <group>
      {/* ---------- Collar clamped around the mast ---------- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[COLLAR_OUTER_R, COLLAR_OUTER_R, 2.6, 24, 1, true]} />
        <meshStandardMaterial color={PALETTE.spider} metalness={0.5} roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <ringGeometry args={[COLLAR_INNER_R, COLLAR_OUTER_R, 24]} />
        <meshStandardMaterial color={PALETTE.spiderDark} metalness={0.5} roughness={0.42} side={2} />
      </mesh>

      {/* Guide shoes that run on the tower rails */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * (TOWER_HALF + 0.42), 0, 0]}>
          {[0.9, -0.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[1.0, 0.6, 1.5]} />
              <meshStandardMaterial color={PALETTE.machinery} metalness={0.85} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---------- Red spider: hoops + radial arms ---------- */}
      <group position={[0, -0.55, 0]}>
        <Hoop radius={INNER_HOOP_R} tube={0.22} color={PALETTE.spider} />
        <Hoop radius={OUTER_HOOP_R} tube={0.2} color={PALETTE.spider} />
        {ARM_ANGLES.map((a, i) => (
          <mesh
            key={i}
            rotation={[Math.PI / 2, 0, -a]}
            position={[(Math.sin(a) * (COLLAR_OUTER_R + OUTER_HOOP_R)) / 2, 0, (Math.cos(a) * (COLLAR_OUTER_R + OUTER_HOOP_R)) / 2]}
            castShadow
          >
            <boxGeometry args={[0.34, OUTER_HOOP_R - COLLAR_OUTER_R, 0.3]} />
            <meshStandardMaterial color={PALETTE.spider} metalness={0.45} roughness={0.42} />
          </mesh>
        ))}
      </group>

      {/* ---------- Footrest plates, instanced ---------- */}
      <Instances limit={SEAT_ANGLES.length} range={SEAT_ANGLES.length} castShadow>
        <boxGeometry args={[0.6, 0.09, 0.85]} />
        <meshStandardMaterial color={PALETTE.footrest} metalness={0.5} roughness={0.6} />
        {SEAT_ANGLES.map((a, i) => (
          <Instance
            key={i}
            position={[Math.sin(a) * FOOTREST_R, -0.45, Math.cos(a) * FOOTREST_R]}
            rotation={[0.22, a, 0]}
          />
        ))}
      </Instances>

      {/* ---------- Seats + riders ---------- */}
      {TOWER_RIDERS.map((rider) => {
        const a = rider.seatIndex * SEAT_ANGLE_STEP;
        return (
          <group key={rider.seatId} rotation={[0, a, 0]}>
            <group position={[0, 0, SEAT_RING_R]}>
              <SeatShell color={SEAT_COLOR_HEX[rider.seatColor]} />
              <group position={[0, 0.36, -0.06]}>
                <SeatedRider rider={rider} showLabel={showLabels} />
              </group>
            </group>
          </group>
        );
      })}

      {/*
        Restraints live in their own group so one loop can drive all sixty.
        Each direct child is a seat's angular frame; its first child is the
        pivot the animation rotates.
      */}
      <group ref={restraintsRef}>
        {TOWER_RIDERS.map((rider) => {
          const a = rider.seatIndex * SEAT_ANGLE_STEP;
          return (
            <group key={rider.seatId} rotation={[0, a, 0]}>
              <group position={[0, 1.22, SEAT_RING_R - 0.3]} rotation={[0, 0, Math.PI / 2]}>
                <Restraint />
              </group>
            </group>
          );
        })}
      </group>

      {/* ---------- Canopy ---------- */}
      <group position={[0, CANOPY_Y, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[CANOPY_R * 0.6, CANOPY_R, 1.35, 16]} />
          <meshStandardMaterial color={PALETTE.canopy} metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[CANOPY_R * 0.99, 0.2, 8, 32]} />
          <meshStandardMaterial color={PALETTE.canopyEdge} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Red struts bracing the canopy back to the collar */}
        {CANOPY_STRUT_ANGLES.map((a, i) => (
          <mesh
            key={i}
            position={[(Math.sin(a) * CANOPY_R) / 2, -1.4, (Math.cos(a) * CANOPY_R) / 2]}
            rotation={[Math.PI / 2 - 0.42, 0, -a]}
            castShadow
          >
            <cylinderGeometry args={[0.11, 0.11, CANOPY_R * 0.92, 8]} />
            <meshStandardMaterial color={PALETTE.canopyEdge} metalness={0.45} roughness={0.42} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
