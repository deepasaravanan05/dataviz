"use client";

import { Vector3 } from "three";
import { PALETTE } from "./constants";
import {
  HEAD_ANCHOR,
  HEAD_PITCH,
  MUZZLE_LENGTH,
  NECK_CURVE,
  NECK_SAMPLES,
  SKULL_RADIUS,
  neckRadius,
} from "./dragonProfile";

/**
 * The dragon that forms the ride's front identity.
 *
 * It is not a prop bolted onto the bow: the neck grows out of the stem post
 * inside the hull and sweeps up and forward in one continuous curve, so the
 * ship and the dragon read as a single carved object. Local +Z points forward
 * over the bow, +Y is up, and the origin sits on the deck at the stem.
 *
 * THE FACE. A head reads as an animal's face or as a lump, and the difference
 * is almost entirely in the muzzle. A short snout with the jaws hinged at the
 * front gives a frog; length in front of the eyes, a brow that overhangs them,
 * a jaw line that narrows toward the nose and a cheek where the jaw actually
 * hinges give a reptile. So the muzzle is long (MUZZLE_LENGTH, published for
 * the swing maths), it tapers along its length, it carries its own row of nasal
 * scale plates, the lower jaw has a beard of chin spines under it, and there is
 * a forked tongue inside the open mouth. None of it is a texture — every part
 * is geometry, because nothing here is loaded from an asset.
 *
 * All placement maths is done once at module scope: the geometry is fixed, so
 * there is nothing to recompute per frame or per render.
 */

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
  const radius = neckRadius(u);

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

/** Teeth along one jaw, front to back, spread over the longer muzzle. */
const TEETH = [0.15, 0.72, 1.29, 1.86, 2.43, 3.0];

function Horn({ side }: { side: 1 | -1 }) {
  /*
   * Four tapering segments swept back, out and up, so the horn curves like a
   * ram's rather than sticking out as a single straight spike. The last two are
   * thin enough to catch the light as a line, which is what makes a horn read
   * as horn and not as a cone.
   */
  const parts: { pos: [number, number, number]; rot: [number, number, number]; r0: number; r1: number; len: number }[] = [
    { pos: [side * 0.5, 0.74, -0.16], rot: [0.5, side * 0.18, -side * 0.26], r0: 0.22, r1: 0.16, len: 1.0 },
    { pos: [side * 0.76, 1.2, -0.76], rot: [0.92, side * 0.24, -side * 0.32], r0: 0.16, r1: 0.105, len: 0.95 },
    { pos: [side * 0.99, 1.46, -1.5], rot: [1.28, side * 0.28, -side * 0.35], r0: 0.105, r1: 0.06, len: 0.85 },
    { pos: [side * 1.14, 1.5, -2.18], rot: [1.62, side * 0.3, -side * 0.36], r0: 0.06, r1: 0.01, len: 0.72 },
  ];

  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot} castShadow>
          <cylinderGeometry args={[p.r1, p.r0, p.len, 10]} />
          <meshStandardMaterial color={PALETTE.dragonHorn} roughness={0.42} metalness={0.12} />
        </mesh>
      ))}
      {/* Growth rings near the base — the detail that says "grown", not "moulded". */}
      {[0.28, 0.52, 0.76].map((t, i) => (
        <mesh
          key={`ring-${i}`}
          position={[side * (0.34 + t * 0.5), 0.46 + t * 0.72, -0.02 - t * 0.86]}
          rotation={[0.5 + t * 0.5, 0, Math.PI / 2]}
          castShadow
        >
          <torusGeometry args={[0.2 - t * 0.07, 0.035, 6, 12]} />
          <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CheekFrill({ side }: { side: 1 | -1 }) {
  // A magenta fan of five flattened spines, longest in the middle.
  return (
    <group position={[side * 0.62, 0.1, -0.66]} rotation={[0, 0, -side * 0.5]}>
      {[-0.66, -0.33, 0, 0.33, 0.66].map((tilt, i) => {
        const length = 1.7 - Math.abs(tilt) * 0.9;
        return (
          <mesh
            key={i}
            position={[side * 0.24, 0, tilt * 0.55]}
            rotation={[tilt, 0, -side * 0.55]}
            scale={[1, 1, 0.3]}
            castShadow
          >
            <coneGeometry args={[0.28, length, 8]} />
            <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * The cheek: where the lower jaw actually hinges. Without it the jaws look
 * stuck onto the skull; with it the skull has a corner for them to swing from.
 */
function Cheek({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * 0.72, -0.18, -0.18]}>
      <mesh scale={[0.72, 0.86, 1.0]} castShadow>
        <sphereGeometry args={[0.54, 12, 10]} />
        <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.52} />
      </mesh>
      {/* Jaw-muscle plate, a shade darker */}
      <mesh position={[side * 0.16, 0.06, -0.2]} scale={[0.4, 0.66, 0.8]} castShadow>
        <sphereGeometry args={[0.44, 10, 8]} />
        <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.56} />
      </mesh>
    </group>
  );
}

function Eye({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * 0.64, 0.34, 0.56]}>
      {/* Heavy brow ridge, overhanging the eye — the single strongest cue that
          a face is a predator's rather than a toy's. */}
      <mesh position={[0, 0.32, 0.02]} rotation={[0.34, 0, -side * 0.35]} scale={[1, 1, 1.35]} castShadow>
        <coneGeometry args={[0.27, 0.72, 8]} />
        <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.55} />
      </mesh>
      {/* Bony socket rim the eyeball sits inside */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.7]} castShadow>
        <torusGeometry args={[0.31, 0.07, 8, 16]} />
        <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.6} />
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
      {/* Lower lid, a thin crescent that keeps the eye from reading as a ball
          glued to the skull. */}
      <mesh position={[0, -0.2, 0.08]} rotation={[-0.3, 0, side * 0.2]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.28, 12, 8]} />
        <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * The forked tongue, inside the open mouth. Small, but it is the part that
 * makes an open mouth read as a mouth rather than as a hole.
 */
function Tongue() {
  return (
    <group position={[0, -0.12, 1.15]} rotation={[0.22, 0, 0]}>
      <mesh position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.42]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.5, 8]} />
        <meshStandardMaterial color={PALETTE.dragonMouth} roughness={0.6} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.11, 0, 1.62]}
          rotation={[Math.PI / 2, 0, -side * 0.24]}
          scale={[1, 1, 0.42]}
          castShadow
        >
          <coneGeometry args={[0.1, 0.66, 6]} />
          <meshStandardMaterial color={PALETTE.dragonMouth} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Jaw({ upper }: { upper: boolean }) {
  const sign = upper ? 1 : -1;
  const pitch = upper ? -0.06 : 0.36; // the mouth hangs open
  const len = upper ? MUZZLE_LENGTH : MUZZLE_LENGTH - 0.4;
  const rBack = upper ? 0.68 : 0.5;
  const rFront = upper ? 0.3 : 0.23;

  /* The muzzle is built as a chain of tapering sections rather than one
     cylinder, so it can narrow toward the nose the way a snout does and carry
     scale plates that follow the taper. */
  const SECTIONS = 4;

  return (
    <group position={[0, sign * 0.2, 0.55]} rotation={[pitch, 0, 0]}>
      {Array.from({ length: SECTIONS }, (_, i) => {
        const a = i / SECTIONS;
        const b = (i + 1) / SECTIONS;
        const rA = rBack + (rFront - rBack) * a;
        const rB = rBack + (rFront - rBack) * b;
        return (
          <mesh
            key={i}
            position={[0, 0, ((a + b) / 2) * len]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[rB, rA, len / SECTIONS, 10]} />
            <meshStandardMaterial
              color={upper ? PALETTE.dragonBody : PALETTE.dragonBelly}
              roughness={0.5}
              metalness={0.06}
            />
          </mesh>
        );
      })}

      {/* Rounded nose cap, so the muzzle ends in a snout and not a cut cylinder */}
      <mesh position={[0, 0, len]} scale={[1, 0.86, 1.1]} castShadow>
        <sphereGeometry args={[rFront * 1.05, 12, 10]} />
        <meshStandardMaterial
          color={upper ? PALETTE.dragonBody : PALETTE.dragonBelly}
          roughness={0.5}
        />
      </mesh>

      {/* Nasal scale plates ridged along the top of the upper muzzle */}
      {upper &&
        [0.3, 0.62, 0.94].map((f, i) => (
          <mesh
            key={`plate-${i}`}
            position={[0, (rBack + (rFront - rBack) * f) * 0.72, f * len]}
            scale={[1, 0.4, 1.5]}
            castShadow
          >
            <sphereGeometry args={[0.2 - i * 0.03, 10, 8]} />
            <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.55} />
          </mesh>
        ))}

      {/* Chin beard on the lower jaw — three spines hanging under the throat */}
      {!upper &&
        [0.24, 0.5, 0.76].map((f, i) => (
          <mesh
            key={`beard-${i}`}
            position={[0, -(rBack + (rFront - rBack) * f) * 0.78, f * len]}
            rotation={[Math.PI - 0.5, 0, 0]}
            castShadow
          >
            <coneGeometry args={[0.11, 0.62 - i * 0.1, 6]} />
            <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} />
          </mesh>
        ))}

      {/* Teeth, alternating in size along the jaw */}
      {TEETH.map((z, i) => {
        const scale = i % 2 === 0 ? 1 : 0.72;
        const f = Math.min(z / len, 1);
        const halfWidth = (rBack + (rFront - rBack) * f) * 0.74;
        return [-1, 1].map((s) => (
          <mesh
            key={`${i}-${s}`}
            position={[s * halfWidth, -sign * 0.16, z]}
            rotation={[0, 0, upper ? Math.PI : 0]}
            castShadow
          >
            <coneGeometry args={[0.09 * scale, 0.46 * scale, 6]} />
            <meshStandardMaterial color={PALETTE.dragonTooth} roughness={0.3} />
          </mesh>
        ));
      })}

      {/* A longer pair of fangs at the front of each jaw */}
      {[-1, 1].map((s) => (
        <mesh
          key={`fang-${s}`}
          position={[s * rFront * 0.66, -sign * 0.2, len - 0.34]}
          rotation={[0, 0, upper ? Math.PI : 0]}
          castShadow
        >
          <coneGeometry args={[0.1, 0.72, 6]} />
          <meshStandardMaterial color={PALETTE.dragonTooth} roughness={0.28} />
        </mesh>
      ))}

      {/* Nostrils, set into the top of the snout and angled outward */}
      {upper &&
        [-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.19, rFront * 0.66, len - 0.42]}
            rotation={[0.4, 0, s * 0.3]}
            scale={[1, 0.5, 1.3]}
          >
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color={PALETTE.dragonPupil} roughness={0.7} />
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
          <sphereGeometry args={[SKULL_RADIUS, 20, 18]} />
          <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.5} metalness={0.06} />
        </mesh>

        {/* Sculpted scale plates over the crown */}
        {[
          [0, 0.86, 0.1, 0.3],
          [0.34, 0.72, -0.3, 0.24],
          [-0.34, 0.72, -0.3, 0.24],
          [0, 0.7, -0.72, 0.26],
          [0, 0.52, -1.12, 0.22],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.5, 1]} castShadow>
            <sphereGeometry args={[r, 10, 8]} />
            <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.55} />
          </mesh>
        ))}

        {/* Dark open mouth cavity between the jaws */}
        <mesh position={[0, 0, 1.55]} castShadow>
          <boxGeometry args={[0.85, 0.62, 2.4]} />
          <meshStandardMaterial color={PALETTE.dragonMouth} roughness={0.75} />
        </mesh>

        <Tongue />

        <Jaw upper />
        <Jaw upper={false} />

        <Cheek side={1} />
        <Cheek side={-1} />

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
