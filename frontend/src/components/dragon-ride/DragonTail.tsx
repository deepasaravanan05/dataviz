"use client";

import { Vector3 } from "three";
import { PALETTE } from "./constants";
import { TAIL_CURVE, TAIL_SAMPLES, tailRadius } from "./dragonProfile";

/**
 * The dragon's tail, at the stern.
 *
 * It replaces the seven stacked cylinders that used to curl off the transom.
 * Those read as a decorative scroll: same thickness top to bottom, no spine, no
 * fin, and only about three units of it. This is the same animal as the head at
 * the bow — one continuous body tapering from a thick rump to a point, with the
 * neck's dorsal spines carried all the way down it, the neck's cream belly
 * stripe carried along its underside, a pair of swimming fins where a real
 * beast's tail muscle ends, and a spade fluke at the tip.
 *
 * The curve, the sample count and the taper all come from `dragonProfile.ts`,
 * which is also what the swing kinematics measure the ride's ground clearance
 * and neighbour clearance against. Lengthening the tail here therefore tightens
 * those proofs automatically rather than quietly invalidating them.
 */

interface TailSegment {
  position: [number, number, number];
  radius: number;
  /** Dorsal spine: where it sits, how it is angled, how big it is. */
  ridgePosition: [number, number, number];
  ridgeRotation: number;
  ridgeSize: number;
  /** Cream belly stripe, on the opposite side of the body from the spine. */
  bellyPosition: [number, number, number];
  u: number;
}

const SEGMENTS: TailSegment[] = Array.from({ length: TAIL_SAMPLES }, (_, i) => {
  const u = i / (TAIL_SAMPLES - 1);
  const p = TAIL_CURVE.getPointAt(u);
  const t = TAIL_CURVE.getTangentAt(u);
  const radius = tailRadius(u);

  /* Dorsal direction: the tangent turned a quarter turn in the Y-Z plane, taken
     on the side that points up out of the rump at the root, so the spine runs
     along the OUTSIDE of the curl for the tail's whole length. */
  const dorsal = new Vector3(0, -t.z, t.y).normalize();
  const ridgeAt = p.clone().addScaledVector(dorsal, radius * 0.84);
  const bellyAt = p.clone().addScaledVector(dorsal, -radius * 0.66);

  return {
    position: [p.x, p.y, p.z],
    radius,
    ridgePosition: [ridgeAt.x, ridgeAt.y, ridgeAt.z],
    ridgeRotation: Math.atan2(dorsal.z, dorsal.y),
    /* Spines are tallest over the rump and shrink to nothing at the tip, the
       way they do on the neck — the two ends match because they are one animal. */
    ridgeSize: 0.5 * (1 - 0.8 * u) + 0.06,
    bellyPosition: [bellyAt.x, bellyAt.y, bellyAt.z],
    u,
  };
});

/** Where the swimming fins sit along the tail, and how big each pair is. */
const FIN_STATIONS = [
  { u: 0.44, length: 1.9, spread: 0.72, tilt: -0.5 },
  { u: 0.66, length: 1.35, spread: 0.5, tilt: -0.32 },
];

function Fin({ station }: { station: (typeof FIN_STATIONS)[number] }) {
  const p = TAIL_CURVE.getPointAt(station.u);
  const t = TAIL_CURVE.getTangentAt(station.u);
  const along = Math.atan2(t.z, t.y);

  return (
    <group position={[p.x, p.y, p.z]}>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * station.spread, 0, 0]}
          rotation={[along, 0, side * station.tilt]}
          scale={[0.28, 1, 1]}
          castShadow
        >
          <coneGeometry args={[station.length * 0.42, station.length, 7]} />
          <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The fluke at the very tip: two swept blades opening off the last vertebra,
 * so the tail finishes in a shape rather than simply stopping.
 */
function Fluke() {
  const p = TAIL_CURVE.getPointAt(1);
  const t = TAIL_CURVE.getTangentAt(1);
  const along = Math.atan2(t.z, t.y);

  return (
    <group position={[p.x, p.y, p.z]} rotation={[along, 0, 0]}>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.34, 0.62, 0]}
          rotation={[0, 0, side * 0.62]}
          scale={[0.22, 1, 1]}
          castShadow
        >
          <coneGeometry args={[0.66, 2.3, 7]} />
          <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.48} metalness={0.1} />
        </mesh>
      ))}
      {/* Gold cap where the two blades meet, tying the tail to the ship's trim. */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={PALETTE.trimGold} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

export function DragonTail() {
  return (
    <group>
      {SEGMENTS.map((seg, i) => (
        <group key={i}>
          {/* Body vertebra */}
          <mesh position={seg.position} castShadow>
            <sphereGeometry args={[seg.radius, 14, 12]} />
            <meshStandardMaterial color={PALETTE.dragonBody} roughness={0.52} metalness={0.05} />
          </mesh>

          {/* Cream belly stripe, matching the throat at the other end */}
          <mesh position={seg.bellyPosition} scale={[0.6, 0.9, 0.9]}>
            <sphereGeometry args={[seg.radius * 0.66, 10, 8]} />
            <meshStandardMaterial color={PALETTE.dragonBelly} roughness={0.6} />
          </mesh>

          {/* Dorsal spine */}
          {i > 0 && (
            <mesh position={seg.ridgePosition} rotation={[seg.ridgeRotation, 0, 0]} castShadow>
              <coneGeometry args={[seg.ridgeSize * 0.5, seg.ridgeSize * 1.9, 6]} />
              <meshStandardMaterial color={PALETTE.dragonFrill} roughness={0.5} />
            </mesh>
          )}

          {/* Darker scale plates banded down the body, every third vertebra */}
          {i % 3 === 1 && (
            <mesh position={seg.position} scale={[1.02, 0.42, 1.02]} castShadow>
              <sphereGeometry args={[seg.radius * 1.02, 12, 8]} />
              <meshStandardMaterial color={PALETTE.dragonBodyDark} roughness={0.58} />
            </mesh>
          )}
        </group>
      ))}

      {FIN_STATIONS.map((station, i) => (
        <Fin key={i} station={station} />
      ))}
      <Fluke />
    </group>
  );
}
