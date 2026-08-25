"use client";

import {
  PALETTE,
  STATION_DECK_Y,
  STATION_INNER_R,
  STATION_OUTER_R,
} from "./constants";

/**
 * The boarding station: an annular deck around the foot of the mast, ringed by
 * a guard rail with boarding gates, plus a switchback queue laid out on the
 * deck itself so it never spills onto the park's paths or toward any
 * neighbouring ride.
 *
 * The deck's inner radius clears the foundation, and its top sits 1.0u below
 * the gondola's resting seat height, so riders step across into the seats
 * rather than climbing to them.
 */

const RAIL_POSTS = 40;
const GATE_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

/** Switchback queue lanes, laid out as arcs on the deck. */
const QUEUE_LANES = [
  { radius: STATION_OUTER_R - 0.9, from: 0.55, to: 2.2 },
  { radius: STATION_OUTER_R - 2.0, from: 0.55, to: 2.2 },
  { radius: STATION_OUTER_R - 3.1, from: 0.55, to: 2.2 },
];

const LANE_SEGMENTS = 14;

export function Station() {
  return (
    <group>
      {/* ---------- Deck ---------- */}
      <mesh position={[0, STATION_DECK_Y - 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[STATION_OUTER_R, STATION_OUTER_R, 0.3, 48]} />
        <meshStandardMaterial color={PALETTE.foundation} roughness={0.9} />
      </mesh>
      {/* Dark tread surface, inset so the deck edge reads as a kerb */}
      <mesh position={[0, STATION_DECK_Y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[STATION_INNER_R, STATION_OUTER_R - 0.25, 48]} />
        <meshStandardMaterial color={PALETTE.machinery} roughness={0.85} side={2} />
      </mesh>

      {/* Skirt down to the ground */}
      <mesh position={[0, (STATION_DECK_Y - 0.3) / 2, 0]} receiveShadow>
        <cylinderGeometry args={[STATION_OUTER_R, STATION_OUTER_R + 0.3, STATION_DECK_Y - 0.3, 48, 1, true]} />
        <meshStandardMaterial color={PALETTE.towerSteelDark} metalness={0.3} roughness={0.6} side={2} />
      </mesh>

      {/* ---------- Perimeter guard rail, broken by four boarding gates ---------- */}
      {Array.from({ length: RAIL_POSTS }, (_, i) => {
        const a = (i / RAIL_POSTS) * Math.PI * 2;
        const nearGate = GATE_ANGLES.some((g) => {
          const d = Math.abs(((a - g + Math.PI) % (Math.PI * 2)) - Math.PI);
          return d < 0.22;
        });
        if (nearGate) return null;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * (STATION_OUTER_R - 0.35), STATION_DECK_Y + 0.55, Math.cos(a) * (STATION_OUTER_R - 0.35)]}
            castShadow
          >
            <boxGeometry args={[0.09, 1.1, 0.09]} />
            <meshStandardMaterial color={PALETTE.towerSteel} metalness={0.45} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, STATION_DECK_Y + 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[STATION_OUTER_R - 0.35, 0.06, 8, 56]} />
        <meshStandardMaterial color={PALETTE.towerSteel} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* ---------- Switchback queue on the deck ---------- */}
      {QUEUE_LANES.map((lane, li) =>
        Array.from({ length: LANE_SEGMENTS }, (_, i) => {
          const a = lane.from + ((lane.to - lane.from) * i) / (LANE_SEGMENTS - 1);
          return (
            <mesh
              key={`${li}-${i}`}
              position={[Math.sin(a) * lane.radius, STATION_DECK_Y + 0.48, Math.cos(a) * lane.radius]}
              castShadow
            >
              <boxGeometry args={[0.07, 0.95, 0.07]} />
              <meshStandardMaterial color={PALETTE.canopyEdge} metalness={0.35} roughness={0.5} />
            </mesh>
          );
        }),
      )}

      {/* ---------- Steps up from the park path ---------- */}
      <group position={[0, 0, STATION_OUTER_R + 1.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.24 + i * 0.42, 1.2 - i * 0.6]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 0.42, 0.6]} />
            <meshStandardMaterial color={PALETTE.foundation} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ---------- Operator booth ---------- */}
      <group position={[Math.sin(-0.9) * (STATION_OUTER_R - 2.4), STATION_DECK_Y, Math.cos(-0.9) * (STATION_OUTER_R - 2.4)]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 2.4, 1.8]} />
          <meshStandardMaterial color={PALETTE.canopy} metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[2.6, 0.18, 2.2]} />
          <meshStandardMaterial color={PALETTE.canopyEdge} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
