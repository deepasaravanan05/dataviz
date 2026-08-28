"use client";

import {
  ARM_LENGTH,
  HULL_WIDTH,
  PALETTE,
  ROW_SPACING,
  DECK_Y,
  SEATS_PER_ROW,
  SEAT_MOUNT_Y,
  SEAT_ROWS,
  SEAT_SPACING,
} from "./constants";
import { BULWARK_GEOMETRY, BULWARK_INSET_X, HULL_GEOMETRY, KEEL_BAND_GEOMETRY } from "./hullGeometry";
import { DragonHead } from "./DragonHead";
import { DragonTail } from "./DragonTail";
import { NECK_MOUNT, TAIL_MOUNT } from "./dragonProfile";
import { DRAGON_RIDERS } from "./riders";
import { SEAT_GREY, SEAT_GREY_DARK, SEAT_METALNESS, SEAT_ROUGHNESS } from "@/world/seatColor";
import { RIDE_SEAT_SCALE } from "@/world/scale";
import { strut, type Strut } from "./strut";

/**
 * The swinging ship: carrier arms, timber hull, open deck, forty seats and the
 * dragon.
 *
 * The component's origin IS the swing pivot, so the parent only has to set
 * `rotation.x` — every part of the ship, riders included, is a descendant and
 * therefore swings as one rigid body around the correct physical point.
 */

/** Carrier arms hang from the axle down to the hull, splaying slightly outward. */
const ARM_TOP_X = 2.3;
const ARM_BOTTOM_X = 3.95;
const ARM_BOTTOM_Y = -ARM_LENGTH + 0.6;

const ARMS: Strut[] = [1, -1].map((s) =>
  strut(`arm${s}`, [s * ARM_TOP_X, -0.2, 0], [s * ARM_BOTTOM_X, ARM_BOTTOM_Y, 0]),
);

/** Cross-bracing keeps the two arms rigid, as on a real carrier frame. */
const ARM_BRACES: Strut[] = (() => {
  const out: Strut[] = [];
  const levels = [-4.5, -9.5, -14.5];
  for (const y of levels) {
    const f = (y + 0.2) / (ARM_BOTTOM_Y + 0.2);
    const x = ARM_TOP_X + (ARM_BOTTOM_X - ARM_TOP_X) * f;
    out.push(strut(`brace-h${y}`, [-x, y, 0], [x, y, 0]));
  }
  for (let i = 0; i < levels.length - 1; i++) {
    const yA = levels[i];
    const yB = levels[i + 1];
    const fA = (yA + 0.2) / (ARM_BOTTOM_Y + 0.2);
    const fB = (yB + 0.2) / (ARM_BOTTOM_Y + 0.2);
    const xA = ARM_TOP_X + (ARM_BOTTOM_X - ARM_TOP_X) * fA;
    const xB = ARM_TOP_X + (ARM_BOTTOM_X - ARM_TOP_X) * fB;
    out.push(strut(`brace-d${i}a`, [-xA, yA, 0], [xB, yB, 0]));
    out.push(strut(`brace-d${i}b`, [xA, yA, 0], [-xB, yB, 0]));
  }
  return out;
})();

/** Seat grid, centred on the deck. */
const SEAT_X = Array.from({ length: SEATS_PER_ROW }, (_, c) => (c - (SEATS_PER_ROW - 1) / 2) * SEAT_SPACING);
const SEAT_Z = Array.from({ length: SEAT_ROWS }, (_, r) => (r - (SEAT_ROWS - 1) / 2) * ROW_SPACING);


/** One seat. Grey, like every seat in the park — see world/seatColor.ts. */
function Seat() {
  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.42, 0.36, 0.42]} />
        <meshStandardMaterial color={PALETTE.seatFrame} roughness={0.65} metalness={0.15} />
      </mesh>
      {/* Cushion */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.18, 0.82]} />
        <meshStandardMaterial color={SEAT_GREY} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
      </mesh>
      {/* Backrest, tipped back slightly */}
      <mesh position={[0, 0.85, -0.42]} rotation={[-0.16, 0, 0]} castShadow>
        <boxGeometry args={[0.92, 0.8, 0.16]} />
        <meshStandardMaterial color={SEAT_GREY_DARK} roughness={SEAT_ROUGHNESS} metalness={SEAT_METALNESS} />
      </mesh>
      {/* Head cushion */}
      <mesh position={[0, 1.3, -0.5]} rotation={[-0.16, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.34, 0.18]} />
        <meshStandardMaterial color={PALETTE.seatFrame} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** One lap-bar restraint spanning a whole row of four seats. */
function RestraintBar() {
  const span = SEAT_X[SEATS_PER_ROW - 1] - SEAT_X[0] + 0.9;
  return (
    <group position={[0, DECK_Y + 0.95, 0.42]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, span, 10]} />
        <meshStandardMaterial color={PALETTE.restraint} metalness={0.75} roughness={0.28} />
      </mesh>
      {SEAT_X.map((x, i) => (
        <mesh key={i} position={[x, -0.34, -0.2]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.72, 8]} />
          <meshStandardMaterial color={PALETTE.restraint} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

export function Ship({ showLabels }: { showLabels: boolean }) {
  /* Kept so the ride pages' label toggle still type-checks; the deck no longer
     carries permanent passengers for it to label. */
  void showLabels;
  return (
    <group>
      {/* ---------- Carrier arms + axle bearing ---------- */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 3.2, 20]} />
        <meshStandardMaterial color={PALETTE.steelDark} metalness={0.85} roughness={0.3} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 1.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.15, 1.15, 0.7, 20]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.8} roughness={0.32} />
        </mesh>
      ))}

      {[...ARMS, ...ARM_BRACES].map((s) => (
        <mesh key={s.key} position={s.position} quaternion={s.quaternion} castShadow>
          <cylinderGeometry
            args={[
              s.key.startsWith("arm") ? 0.34 : 0.15,
              s.key.startsWith("arm") ? 0.34 : 0.15,
              s.length,
              12,
            ]}
          />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* ---------- Hull, at the bottom of the arms ---------- */}
      <group position={[0, -ARM_LENGTH, 0]}>
        {/* Timber hull */}
        <mesh geometry={HULL_GEOMETRY} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.hull} roughness={0.62} metalness={0.05} />
        </mesh>
        {/* Gold band wrapping the keel */}
        <mesh geometry={KEEL_BAND_GEOMETRY} castShadow>
          <meshStandardMaterial color={PALETTE.hullKeel} roughness={0.32} metalness={0.45} />
        </mesh>

        {/* Open deck floor */}
        <mesh position={[0, DECK_Y, 0]} receiveShadow>
          <boxGeometry args={[HULL_WIDTH - 0.9, 0.24, 25.4]} />
          <meshStandardMaterial color={PALETTE.deck} roughness={0.78} />
        </mesh>

        {/* Low bulwarks — the deck stays open so every rider is visible */}
        {[1, -1].map((s) => (
          <mesh key={s} geometry={BULWARK_GEOMETRY} position={[s * BULWARK_INSET_X, 0, 0]} castShadow>
            <meshStandardMaterial color={PALETTE.bulwark} roughness={0.66} />
          </mesh>
        ))}

        {/* Decorative red-and-gold panels along both outer flanks */}
        {[1, -1].map((s) =>
          Array.from({ length: 9 }, (_, i) => {
            const z = (i - 4) * 2.5;
            return (
              <group key={`${s}-${i}`} position={[s * (HULL_WIDTH / 2 + 0.06), -1.0, z]}>
                <mesh castShadow>
                  <boxGeometry args={[0.12, 1.0, 1.5]} />
                  <meshStandardMaterial color={PALETTE.trimRed} roughness={0.4} metalness={0.2} />
                </mesh>
                <mesh position={[s * 0.05, 0, 0]}>
                  <boxGeometry args={[0.08, 0.42, 0.85]} />
                  <meshStandardMaterial color={PALETTE.trimGold} roughness={0.3} metalness={0.6} />
                </mesh>
              </group>
            );
          }),
        )}

        {/* Gold rubbing strake along the sheer */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * (HULL_WIDTH / 2 + 0.02), -0.18, 0]} castShadow>
            <boxGeometry args={[0.18, 0.3, 22]} />
            <meshStandardMaterial color={PALETTE.trimGold} roughness={0.3} metalness={0.6} />
          </mesh>
        ))}

        {/*
          ---------- Seats ----------

          Empty until a real employee climbs into one. The deck used to carry
          permanently-seated figures, which made every seat look occupied
          whether anybody was in it or not — so a rider who had walked back down
          the stair left a figure sitting exactly where they had been. The seats
          themselves, their grey, their spacing and their restraints are
          untouched.
        */}
        {DRAGON_RIDERS.map((rider) => (
          <group key={rider.seatId} position={[SEAT_X[rider.col], SEAT_MOUNT_Y, SEAT_Z[rider.row]]}>
            {/* Sized for the people who sit in it — see RIDE_SEAT_SCALE. */}
            <group scale={RIDE_SEAT_SCALE}>
              <Seat />
            </group>
          </group>
        ))}

        {/* One restraint bar per row */}
        {SEAT_Z.map((z, i) => (
          <group key={i} position={[0, 0, z]}>
            <RestraintBar />
          </group>
        ))}

        {/* ---------- Dragon at the bow ---------- */}
        <group position={NECK_MOUNT}>
          <DragonHead />
        </group>

        {/* ---------- Dragon's tail at the stern ---------- */}
        <group position={TAIL_MOUNT}>
          <DragonTail />
        </group>
      </group>
    </group>
  );
}
