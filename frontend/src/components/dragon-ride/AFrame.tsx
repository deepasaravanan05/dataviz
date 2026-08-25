"use client";

import { Instance, Instances } from "@react-three/drei";
import {
  APEX_HEIGHT,
  FOOT_SPREAD_X,
  FOOT_SPREAD_Z,
  FOUNDATION_HEIGHT,
  FOUNDATION_SIZE,
  FRAME_HALF_SPAN,
  LEG_RADIUS,
  PALETTE,
  PIVOT_Y,
} from "./constants";
import { lerpPoint, strut, type Strut } from "./strut";

/**
 * The static support structure: two tall A-frames, one either side of the
 * ship, tied together above the swing and braced to concrete foundations.
 *
 * Nothing spans between the frames below the pivot — that volume belongs to
 * the swinging hull — so the lateral bracing lives above the axle and at
 * ground level, exactly as it does on a real swinging-ship ride.
 */

type Side = 1 | -1;

const APEX = (sx: Side): [number, number, number] => [sx * FRAME_HALF_SPAN, APEX_HEIGHT, 0];
const FOOT = (sx: Side, sz: Side): [number, number, number] => [
  sx * FOOT_SPREAD_X,
  0,
  sz * FOOT_SPREAD_Z,
];

const SIDES: Side[] = [1, -1];

/** The four main legs. */
const LEGS: { key: string; sx: Side; sz: Side; s: Strut }[] = SIDES.flatMap((sx) =>
  SIDES.map((sz) => ({
    key: `leg-${sx}-${sz}`,
    sx,
    sz,
    s: strut(`leg-${sx}-${sz}`, APEX(sx), FOOT(sx, sz)),
  })),
);

/** Lattice bracing inside each A-frame, between its two legs. */
const BRACE_LEVELS = [0.24, 0.46, 0.68, 0.86];

const BRACES: Strut[] = SIDES.flatMap((sx) => {
  const front = (t: number) => lerpPoint(APEX(sx), FOOT(sx, 1), t);
  const back = (t: number) => lerpPoint(APEX(sx), FOOT(sx, -1), t);
  const out: Strut[] = [];

  for (const t of BRACE_LEVELS) {
    out.push(strut(`h-${sx}-${t}`, front(t), back(t)));
  }
  for (let i = 0; i < BRACE_LEVELS.length - 1; i++) {
    const a = BRACE_LEVELS[i];
    const b = BRACE_LEVELS[i + 1];
    out.push(strut(`d1-${sx}-${i}`, front(a), back(b)));
    out.push(strut(`d2-${sx}-${i}`, back(a), front(b)));
  }
  return out;
});

/** Ground tie-beams joining the four foundations into one rigid base. */
const GROUND_TIES: Strut[] = [
  strut("tie-front", FOOT(1, 1), FOOT(-1, 1)),
  strut("tie-back", FOOT(1, -1), FOOT(-1, -1)),
  strut("tie-right", FOOT(1, 1), FOOT(1, -1)),
  strut("tie-left", FOOT(-1, 1), FOOT(-1, -1)),
].map((s) => ({ ...s, position: [s.position[0], FOUNDATION_HEIGHT * 0.7, s.position[2]] }));

/** Head beams above the swing, tying the two A-frames together. */
const HEAD_BEAMS: Strut[] = [
  strut("head-apex", APEX(1), APEX(-1)),
  strut("head-pivot", [FRAME_HALF_SPAN, PIVOT_Y, 0], [-FRAME_HALF_SPAN, PIVOT_Y, 0]),
  strut("head-d1", APEX(1), [-FRAME_HALF_SPAN, PIVOT_Y, 0]),
  strut("head-d2", APEX(-1), [FRAME_HALF_SPAN, PIVOT_Y, 0]),
];

/**
 * Bulb rows running the length of every leg, the signature detail of the
 * reference photograph. Instanced — one draw call for all of them.
 */
const BULBS_PER_LEG = 24;
const BULB_COLORS = [PALETTE.bulbRed, PALETTE.bulbBlue, PALETTE.bulbYellow];

const BULBS: { position: [number, number, number]; color: string }[] = LEGS.flatMap((leg, legIndex) =>
  Array.from({ length: BULBS_PER_LEG }, (_, i) => {
    const t = 0.06 + (i / (BULBS_PER_LEG - 1)) * 0.9;
    const p = lerpPoint(APEX(leg.sx), FOOT(leg.sx, leg.sz), t);
    return {
      // Nudged outward so the bulbs sit proud of the leg rather than inside it.
      position: [p[0] + leg.sx * LEG_RADIUS * 0.85, p[1], p[2] + leg.sz * LEG_RADIUS * 0.4] as [
        number,
        number,
        number,
      ],
      color: BULB_COLORS[(i + legIndex) % BULB_COLORS.length],
    };
  }),
);

/** The ship's-wheel ornament crowning the apex, as in the reference. */
function ApexWheel() {
  const spokes = 8;
  return (
    <group position={[0, APEX_HEIGHT + 2.1, 0]} rotation={[0, 0, 0]}>
      <mesh castShadow>
        <torusGeometry args={[1.5, 0.16, 10, 28]} />
        <meshStandardMaterial color={PALETTE.trimGold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 12]} />
        <meshStandardMaterial color={PALETTE.frameJoint} metalness={0.6} roughness={0.4} />
      </mesh>
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[0, 0, a]} castShadow>
            <boxGeometry args={[0.13, 3.4, 0.13]} />
            <meshStandardMaterial color={PALETTE.trimGold} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Handle pegs around the rim */}
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.85, Math.sin(a) * 1.85, 0]} rotation={[0, 0, a]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.7, 8]} />
            <meshStandardMaterial color={PALETTE.trimGold} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Bearing housings that carry the axle, plus the drive motor beside one of them. */
function BearingBlocks() {
  return (
    <group>
      {SIDES.map((sx) => (
        <group key={sx} position={[sx * (FRAME_HALF_SPAN - 1.6), PIVOT_Y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 2.4, 2.4]} />
            <meshStandardMaterial color={PALETTE.steelDark} metalness={0.8} roughness={0.32} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.25, 1.25, 1.7, 20]} />
            <meshStandardMaterial color={PALETTE.steel} metalness={0.85} roughness={0.28} />
          </mesh>
          {/* Vertical column tying the bearing up into the apex beam */}
          <mesh position={[0, (APEX_HEIGHT - PIVOT_Y) / 2, 0]} castShadow>
            <boxGeometry args={[1.0, APEX_HEIGHT - PIVOT_Y, 1.0]} />
            <meshStandardMaterial color={PALETTE.frameDark} metalness={0.3} roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Drive motor and hydraulic ram on the right-hand bearing */}
      <group position={[FRAME_HALF_SPAN - 0.4, PIVOT_Y - 1.4, 2.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.85, 0.85, 2.2, 16]} />
          <meshStandardMaterial color={PALETTE.hydraulic} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, -1.6, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 2.4, 12]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.9} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}

/** The queue and boarding platform, set well clear of the swing envelope. */
function BoardingPlatform() {
  return (
    <group position={[-16.5, 0, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 1.8, 13]} />
        <meshStandardMaterial color={PALETTE.foundation} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.85, 0]} receiveShadow>
        <boxGeometry args={[5.6, 0.16, 12.6]} />
        <meshStandardMaterial color={PALETTE.deck} roughness={0.8} />
      </mesh>
      {/* Queue railings down the outer edge */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-2.7, 2.4, (i - 4) * 1.5]} castShadow>
          <boxGeometry args={[0.1, 1.0, 0.1]} />
          <meshStandardMaterial color={PALETTE.frame} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-2.7, 2.85, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 12.4, 8]} />
        <meshStandardMaterial color={PALETTE.frame} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Steps up from the path */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[3.4 + i * 0.7, 0.3 + (2 - i) * 0.6, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.7, 0.6, 4]} />
          <meshStandardMaterial color={PALETTE.foundation} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function AFrame() {
  return (
    <group>
      {/* Concrete foundations under each leg */}
      {LEGS.map((leg) => {
        const f = FOOT(leg.sx, leg.sz);
        return (
          <mesh key={`found-${leg.key}`} position={[f[0], FOUNDATION_HEIGHT / 2, f[2]]} castShadow receiveShadow>
            <boxGeometry args={[FOUNDATION_SIZE, FOUNDATION_HEIGHT, FOUNDATION_SIZE]} />
            <meshStandardMaterial color={PALETTE.foundation} roughness={0.9} />
          </mesh>
        );
      })}

      {/* Main legs */}
      {LEGS.map((leg) => (
        <group key={leg.key}>
          <mesh position={leg.s.position} quaternion={leg.s.quaternion} castShadow receiveShadow>
            <cylinderGeometry args={[LEG_RADIUS * 0.8, LEG_RADIUS, leg.s.length, 16]} />
            <meshStandardMaterial color={PALETTE.frame} metalness={0.32} roughness={0.36} />
          </mesh>
          {/* Cast joint where the leg meets its foundation */}
          <mesh position={lerpPoint(APEX(leg.sx), FOOT(leg.sx, leg.sz), 0.97)} castShadow>
            <sphereGeometry args={[LEG_RADIUS * 1.5, 12, 12]} />
            <meshStandardMaterial color={PALETTE.frameJoint} metalness={0.55} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Lattice bracing + ground ties + head beams */}
      {[...BRACES, ...GROUND_TIES, ...HEAD_BEAMS].map((s) => (
        <mesh key={s.key} position={s.position} quaternion={s.quaternion} castShadow>
          <cylinderGeometry args={[0.22, 0.22, s.length, 10]} />
          <meshStandardMaterial color={PALETTE.frameDark} metalness={0.32} roughness={0.4} />
        </mesh>
      ))}

      {/* Apex joint caps */}
      {SIDES.map((sx) => (
        <mesh key={sx} position={APEX(sx)} castShadow>
          <sphereGeometry args={[LEG_RADIUS * 1.9, 14, 14]} />
          <meshStandardMaterial color={PALETTE.frameJoint} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      <BearingBlocks />
      <ApexWheel />
      <BoardingPlatform />

      {/* Bulb rows — a single instanced draw call for all four legs */}
      <Instances limit={BULBS.length} range={BULBS.length} castShadow={false}>
        <sphereGeometry args={[0.23, 8, 8]} />
        <meshStandardMaterial roughness={0.25} metalness={0.1} toneMapped={false} />
        {BULBS.map((b, i) => (
          <Instance key={i} position={b.position} color={b.color} />
        ))}
      </Instances>
    </group>
  );
}
