"use client";

import { Text } from "@react-three/drei";
import {
  CHECK_IN_BAND_LABEL,
  CHECK_IN_COLOR_HEX,
  type CheckInColor,
} from "@/simulation/journey/journey";
import {
  GATE_ARCH_Y,
  GATE_HEIGHT,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_PILLAR_HEIGHT,
  GATE_X,
  GATE_Z,
  LANE_COUNT,
  LANE_SPACING,
} from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";
import { Bin, Bollard, LampPost, MAT, Planter, Railing } from "@/components/world/kit";

/**
 * The park's single main entrance.
 *
 * Rebuilt at human scale. The opening was 104 m across — the span of a
 * stadium — which is why the gate dwarfed a park of correctly-sized rides
 * behind it. It is now a 26 m frontage carrying twelve turnstile lanes, which
 * is what a real venue uses to admit a workforce, and the arch clears a person
 * by about nine metres rather than forty.
 *
 * It is built as a working piece of infrastructure rather than an arch on
 * grass: a drop-off road, a queue yard with lane barriers, a canopy over the
 * turnstile line, security booths either side, lighting, planting and
 * wayfinding. All of it sits outside the railway, so not one ride, rail or
 * footprint is disturbed.
 *
 * The three colour plates on the beam are the legend for the whole
 * visualisation — they state, in the park itself, which check-in window each
 * employee category stands for.
 */

const PILLAR_X = GATE_OPENING / 2 + GATE_PILLAR_HALF;
const BEAM_HALF = PILLAR_X + GATE_PILLAR_HALF;

const STONE = "#cfd6de";
const ACCENT = "#f2b134";

const BANDS: CheckInColor[] = ["GREEN", "YELLOW", "RED"];

/** One lane per turnstile, matching the walking lanes the employees use. */
const TURNSTILE_COUNT = 12;
const LANE_PITCH = GATE_OPENING / TURNSTILE_COUNT;
const CANOPY_Z = 6.5;

function Pillar({ side }: { side: 1 | -1 }) {
  const half = GATE_PILLAR_HALF;
  return (
    <group position={[PILLAR_X * side, 0, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[half * 2 + 1.4, 0.9, half * 2 + 1.4]} />
        <meshStandardMaterial color="#98a3b0" roughness={0.92} />
      </mesh>
      <mesh position={[0, GATE_PILLAR_HEIGHT / 2 + 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[half * 2, GATE_PILLAR_HEIGHT, half * 2]} />
        <meshStandardMaterial color={STONE} roughness={0.8} />
      </mesh>
      {/* Recessed panel, so the shaft is not a bare slab */}
      <mesh position={[0, GATE_PILLAR_HEIGHT / 2 + 1.1, half + 0.06]}>
        <boxGeometry args={[half * 1.1, GATE_PILLAR_HEIGHT - 3.4, 0.14]} />
        <meshStandardMaterial color="#2f4562" roughness={0.65} />
      </mesh>
      <mesh position={[0, GATE_PILLAR_HEIGHT + 1.45, 0]} castShadow>
        <boxGeometry args={[half * 2 + 1, 0.8, half * 2 + 1]} />
        <meshStandardMaterial color="#98a3b0" roughness={0.88} />
      </mesh>
      <mesh position={[0, GATE_HEIGHT + 1.1, 0]} castShadow>
        <coneGeometry args={[1.35, 2.4, 6]} />
        <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.35} />
      </mesh>
      {/* Wall lantern at head height plus a bit */}
      <mesh position={[-side * (half + 0.25), 4.2, half - 0.4]}>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#fff3cf" emissive="#ffd98a" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

/** A turnstile lane: two pedestals, a scanner post and a status light. */
function Turnstile({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      {[-PROP.turnstileLaneWidth / 2, PROP.turnstileLaneWidth / 2].map((z, i) => (
        <group key={z} position={[z, 0, 0]}>
          <mesh position={[0, PROP.turnstileHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.3, PROP.turnstileHeight, 1.5]} />
            <meshStandardMaterial color="#3d3f45" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, PROP.turnstileHeight + 0.03, 0]}>
            <boxGeometry args={[0.34, 0.06, 1.54]} />
            <meshStandardMaterial color="#9aa3ad" roughness={0.35} metalness={0.6} />
          </mesh>
          {i === 0 && (
            <>
              {/* Scanner pillar with a reader panel and a go light */}
              <mesh position={[0, 1.32, 0.55]} castShadow>
                <boxGeometry args={[0.26, 0.55, 0.2]} />
                <meshStandardMaterial color="#23262b" roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.42, 0.66]}>
                <boxGeometry args={[0.16, 0.2, 0.03]} />
                <meshStandardMaterial color="#2ee08a" emissive="#2ee08a" emissiveIntensity={0.9} />
              </mesh>
            </>
          )}
        </group>
      ))}
      {/* Retractable arm across the lane */}
      <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, PROP.turnstileLaneWidth * 0.85, 8]} />
        <meshStandardMaterial color={ACCENT} metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A glazed security kiosk beside the gate line. */
function SecurityBooth({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * (BEAM_HALF + 5.4), 0, 2.4]} rotation={[0, side > 0 ? -0.3 : 0.3, 0]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.24, 3.6]} />
        <meshStandardMaterial color="#8e8f8a" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.6, 3.2]} />
        <meshStandardMaterial color="#e6dccb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, 1.62]}>
        <boxGeometry args={[3.2, 1.5, 0.06]} />
        <primitive object={MAT.glass} attach="material" />
      </mesh>
      <mesh position={[0, 2.95, 0]} castShadow>
        <boxGeometry args={[4.8, 0.22, 3.8]} />
        <meshStandardMaterial color="#40474f" roughness={0.6} />
      </mesh>
      <Text position={[0, 3.35, 0]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        SECURITY
      </Text>
    </group>
  );
}

export function MainGate() {
  const lanes = Array.from({ length: TURNSTILE_COUNT }, (_, i) => (i - (TURNSTILE_COUNT - 1) / 2) * LANE_PITCH);
  const queueLanes = Array.from({ length: LANE_COUNT + 1 }, (_, i) => (i - LANE_COUNT / 2) * LANE_SPACING);

  return (
    <group position={[GATE_X, 0, GATE_Z]}>
      {/* Forecourt paving, and the queue yard beyond it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 12]} receiveShadow>
        <planeGeometry args={[BEAM_HALF * 2 + 26, 54]} />
        <primitive object={MAT.paving} attach="material" />
      </mesh>
      {/* Concourse inside the gate. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -16]} receiveShadow>
        <planeGeometry args={[GATE_OPENING + 16, 34]} />
        <primitive object={MAT.paving} attach="material" />
      </mesh>

      {/* Drop-off road across the front, with kerb and centre line. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 40]} receiveShadow>
        <planeGeometry args={[190, PROP.roadLaneWidth * 2]} />
        <primitive object={MAT.asphalt} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 40]}>
        <planeGeometry args={[190, 0.14]} />
        <primitive object={MAT.paint} attach="material" />
      </mesh>
      <mesh position={[0, 0.07, 40 - PROP.roadLaneWidth - 0.2]} receiveShadow>
        <boxGeometry args={[190, 0.14, 0.4]} />
        <primitive object={MAT.concrete} attach="material" />
      </mesh>
      {[-26, -13, 0, 13, 26].map((x) => (
        <Bollard key={x} position={[x, 0, 35.4]} />
      ))}

      <Pillar side={1} />
      <Pillar side={-1} />
      <SecurityBooth side={1} />
      <SecurityBooth side={-1} />

      {/* Arch beam across the opening. */}
      <mesh position={[0, GATE_ARCH_Y + 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[BEAM_HALF * 2, 2.2, GATE_PILLAR_HALF * 2]} />
        <meshStandardMaterial color={STONE} roughness={0.8} />
      </mesh>
      <mesh position={[0, GATE_ARCH_Y - 0.12, 0]}>
        <boxGeometry args={[BEAM_HALF * 2 + 0.7, 0.36, GATE_PILLAR_HALF * 2 + 0.7]} />
        <meshStandardMaterial color={ACCENT} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Crown sign board. */}
      <mesh position={[0, GATE_HEIGHT - 1.4, 0]} castShadow>
        <boxGeometry args={[BEAM_HALF * 1.6, 3.3, 0.45]} />
        <meshStandardMaterial color="#2f4562" roughness={0.55} />
      </mesh>
      <Text
        position={[0, GATE_HEIGHT - 0.85, 0.3]}
        fontSize={1.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.035}
        outlineColor="#0b1b2e"
      >
        EMPLOYEE CHECK-IN
      </Text>
      <Text position={[0, GATE_HEIGHT - 2.35, 0.3]} fontSize={0.58} color={ACCENT} anchorX="center" anchorY="middle">
        MAIN ENTRANCE · WORK-START THEME PARK
      </Text>

      {/* The check-in colour key, stated on the gate itself. */}
      {BANDS.map((band, i) => {
        const x = (i - 1) * 8.6;
        return (
          <group key={band} position={[x, GATE_ARCH_Y + 1.15, GATE_PILLAR_HALF + 0.14]}>
            <mesh>
              <boxGeometry args={[8, 1.55, 0.2]} />
              <meshStandardMaterial color={CHECK_IN_COLOR_HEX[band]} roughness={0.55} />
            </mesh>
            <Text position={[0, 0, 0.16]} fontSize={0.62} color="#10202f" anchorX="center" anchorY="middle">
              {CHECK_IN_BAND_LABEL[band]}
            </Text>
          </group>
        );
      })}

      {/* Canopy over the turnstile line. */}
      <group position={[0, 0, CANOPY_Z]}>
        <mesh position={[0, 5.2, 0]} castShadow>
          <boxGeometry args={[GATE_OPENING + 4, 0.28, 9]} />
          <primitive object={MAT.canopy} attach="material" />
        </mesh>
        {[-1, 1].map((sz) =>
          [-1, 0, 1].map((sx) => (
            <mesh key={`${sx}:${sz}`} position={[sx * (GATE_OPENING / 2 + 1), 2.6, sz * 4]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 5.2, 8]} />
              <primitive object={MAT.steel} attach="material" />
            </mesh>
          )),
        )}
      </group>

      {/* Twelve turnstile lanes. */}
      {lanes.map((x) => (
        <Turnstile key={x} x={x} />
      ))}

      {/* Queue yard: barrier lanes leading up to the turnstiles. */}
      {queueLanes.map((x) => (
        <Railing key={x} position={[x, 0, 20]} rotation={Math.PI / 2} length={16} />
      ))}

      {/* Lighting, planting and bins around the forecourt. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <LampPost position={[s * (BEAM_HALF + 13), 0, 14]} double />
          <LampPost position={[s * (BEAM_HALF + 13), 0, 30]} double />
          <Planter position={[s * (BEAM_HALF + 3), 0, 26]} w={7} d={3} />
          <Bin position={[s * (GATE_OPENING / 2 + 2.6), 0, 13]} />
        </group>
      ))}

      {/* Wayfinding pylon inside the gate. */}
      <group position={[GATE_OPENING / 2 + 5, 0, -10]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[0.28, 3.2, 0.28]} />
          <primitive object={MAT.steelDark} attach="material" />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[3.2, 1.5, 0.12]} />
          <meshStandardMaterial color="#2f4562" roughness={0.6} />
        </mesh>
        <Text position={[0, 3.2, 0.09]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
          FOOD COURT  →
        </Text>
        <Text position={[0, 2.75, 0.09]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
          DEPARTMENTS  ↑
        </Text>
      </group>
    </group>
  );
}
