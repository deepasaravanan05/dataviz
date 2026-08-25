"use client";

import { CatmullRomCurve3, Vector3 } from "three";
import { PALETTE } from "./constants";

/**
 * The dragon that forms the ride's front identity.
 *
 * It is not a prop bolted onto the bow: the neck grows out of the stem post
 * inside the hull and sweeps up and forward in one continuous curve, so the
 * ship and the dragon read as a single carved object. Local +Z points forward
 * over the bow, +Y is up, and the origin sits on the deck at the stem.
 *
 * All placement maths is done once at module scope — the geometry is fixed, so
 * there is nothing to recompute per frame or per render.
 */

const NECK_CURVE = new CatmullRomCurve3(
  [
    new Vector3(0, -1.4, -0.4),
    new Vector3(0, 0.6, 0.0),
    new Vector3(0, 2.8, 0.3),
    new Vector3(0, 4.9, 1.0),
    new Vector3(0, 6.7, 2.1),
    new Vector3(0, 7.9, 3.3),
  ],
  false,
  "catmullrom",
  0.5,
);

const NECK_SAMPLES = 20;

interface NeckSegment {
  position: [number, number, number];
  radius: number;
  /** Dorsal scale ridge: offset position and rotation about X. */
  ridgePosition: [number, number, number];
  ridgeRotation: number;
  ridgeSize: number;
}

const NECK_SEGMENTS: NeckSegment[] = Array.from({ length: NECK_SAMPLES }, (_, i) => {
  const u = i / (NECK_SAMPLES - 1);
  const p = NECK_CURVE.getPointAt(u);
  const t = NECK_CURVE.getTangentAt(u);

  // Taper from a thick base where it meets the hull to a slim throat.
  const radius = 1.3 - 0.68 * Math.pow(u, 0.85);

  // Dorsal direction = tangent rotated a quarter turn backwards in the Y-Z plane.
  const dorsal = new Vector3(0, t.z, -t.y).normalize();
  const ridgeAt = p.clone().addScaledVector(dorsal, radius * 0.82);

  return {
    position: [p.x, p.y, p.z],
    radius,
    ridgePosition: [ridgeAt.x, ridgeAt.y, ridgeAt.z],
    ridgeRotation: Math.atan2(dorsal.z, dorsal.y),
    ridgeSize: 0.42 * (1 - 0.45 * u),
  };
});

/** Where the head mounts, and how far it is pitched down over the water. */
const HEAD_ANCHOR = NECK_CURVE.getPointAt(1);
const HEAD_PITCH = -0.34;

/** Teeth along one jaw, front to back. */
const TEETH = [0.0, 0.34, 0.68, 1.02, 1.36];

function Horn({ side }: { side: 1 | -1 }) {
  // Three tapering segments swept back and outward, so the horn curves
  // rather than sticking out as a single straight spike.
  const parts: { pos: [number, number, number]; rot: [number, number, number]; r0: number; r1: number; len: number }[] = [
    { pos: [side * 0.52, 0.72, -0.18], rot: [0.55, side * 0.2, -side * 0.28], r0: 0.2, r1: 0.13, len: 0.95 },
    { pos: [side * 0.78, 1.16, -0.78], rot: [0.95, side * 0.26, -side * 0.34], r0: 0.13, r1: 0.075, len: 0.85 },
    { pos: [side * 0.99, 1.4, -1.44], rot: [1.32, side * 0.3, -side * 0.36], r0: 0.075, r1: 0.012, len: 0.7 },
  ];

  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot} castShadow>
          <cylinderGeometry args={[p.r1, p.r0, p.len, 10]} />
          <meshStandardMaterial color={PALETTE.dragonHorn} roughness={0.42} metalness={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function CheekFrill({ side }: { side: 1 | -1 }) {
  // A magenta fan of three flattened spines, as on the reference's dragon.
  return (
    <group position={[side * 0.62, 0.12, -0.62]} rotation={[0, 0, -side * 0.5]}>
      {[-0.42, 0, 0.42].map((tilt, i) => (
        <mesh
          key={i}
          position={[side * 0.24, 0, tilt * 0.5]}
          rotation={[tilt, 0, -side * 0.55]}
          scale={[1, 1, 0.32]}
          castShadow
        >
          <coneGeometry args={[0.3, 1.5, 8]} />
          <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function Eye({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * 0.62, 0.34, 0.52]}>
      {/* Brow ridge */}
      <mesh position={[0, 0.3, -0.05]} rotation={[0.3, 0, -side * 0.35]} castShadow>
        <coneGeometry args={[0.24, 0.6, 8]} />
        <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.55} />
      </mesh>
      {/* Amber eyeball */}
      <mesh castShadow>
        <sphereGeometry args={[0.29, 16, 16]} />
        <meshStandardMaterial
          color={PALETTE.dragonEye}
          roughness={0.15}
          metalness={0.25}
          emissive={PALETTE.dragonEye}
          emissiveIntensity={0.28}
        />
      </mesh>
      {/* Slit pupil */}
      <mesh position={[side * 0.17, 0, 0.13]} scale={[0.42, 1, 0.5]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={PALETTE.dragonPupil} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Jaw({ upper }: { upper: boolean }) {
  const sign = upper ? 1 : -1;
  const pitch = upper ? -0.06 : 0.36; // the mouth hangs open
  const len = upper ? 2.5 : 2.1;
  const rBack = upper ? 0.68 : 0.5;
  const rFront = upper ? 0.34 : 0.26;

  return (
    <group position={[0, sign * 0.2, 0.55]} rotation={[pitch, 0, 0]}>
      <mesh position={[0, 0, len / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[rFront, rBack, len, 10]} />
        <meshStandardMaterial
          color={upper ? PALETTE.dragonBody : PALETTE.dragonBelly}
          roughness={0.5}
          metalness={0.06}
        />
      </mesh>

      {/* Teeth, alternating slightly in size along the jaw */}
      {TEETH.map((z, i) => {
        const scale = i % 2 === 0 ? 1 : 0.72;
        return [-1, 1].map((s) => (
          <mesh
            key={`${i}-${s}`}
            position={[s * (rFront + (rBack - rFront) * (1 - z / len)) * 0.72, -sign * 0.2, 0.55 + z]}
            rotation={[0, 0, upper ? Math.PI : 0]}
            castShadow
          >
            <coneGeometry args={[0.09 * scale, 0.42 * scale, 6]} />
            <meshStandardMaterial color={PALETTE.dragonTooth} roughness={0.3} />
          </mesh>
        ));
      })}

      {/* Nostril flare on the upper jaw only */}
      {upper &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.22, 0.24, len - 0.35]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={PALETTE.dragonPupil} roughness={0.6} />
          </mesh>
        ))}
    </group>
  );
}

export function DragonHead() {
  return (
    <group>
      {/* ---- Neck: a tapering chain following one continuous curve ---- */}
      {NECK_SEGMENTS.map((seg, i) => (
        <group key={i}>
          <mesh position={seg.position} castShadow>
            <sphereGeometry args={[seg.radius, 16, 14]} />
            <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.52} metalness={0.05} />
          </mesh>
          {/* Cream belly stripe down the front of the throat */}
          <mesh position={[seg.position[0], seg.position[1], seg.position[2] + seg.radius * 0.72]} scale={[0.55, 1, 0.35]}>
            <sphereGeometry args={[seg.radius * 0.72, 12, 10]} />
            <meshStandardMaterial color={PALETTE.dragonBelly} roughness={0.6} />
          </mesh>
          {/* Dorsal scale ridge */}
          {i > 1 && (
            <mesh position={seg.ridgePosition} rotation={[seg.ridgeRotation, 0, 0]} castShadow>
              <coneGeometry args={[seg.ridgeSize * 0.55, seg.ridgeSize * 1.7, 6]} />
              <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}

      {/* ---- Head ---- */}
      <group position={[HEAD_ANCHOR.x, HEAD_ANCHOR.y, HEAD_ANCHOR.z]} rotation={[HEAD_PITCH, 0, 0]}>
        {/* Skull */}
        <mesh scale={[0.92, 0.95, 1.15]} castShadow>
          <sphereGeometry args={[0.98, 20, 18]} />
          <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.5} metalness={0.06} />
        </mesh>

        {/* Sculpted scale plates over the crown */}
        {[
          [0, 0.86, 0.1, 0.3],
          [0.34, 0.72, -0.3, 0.24],
          [-0.34, 0.72, -0.3, 0.24],
          [0, 0.7, -0.72, 0.26],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.5, 1]} castShadow>
            <sphereGeometry args={[r, 10, 8]} />
            <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.55} />
          </mesh>
        ))}

        {/* Dark open mouth cavity between the jaws */}
        <mesh position={[0, 0, 1.35]} castShadow>
          <boxGeometry args={[0.85, 0.6, 1.9]} />
          <meshStandardMaterial color={PALETTE.dragonMouth} roughness={0.75} />
        </mesh>

        <Jaw upper />
        <Jaw upper={false} />

        <Eye side={1} />
        <Eye side={-1} />

        <Horn side={1} />
        <Horn side={-1} />

        <CheekFrill side={1} />
        <CheekFrill side={-1} />
      </group>
    </group>
  );
}
