"use client";

import { useMemo } from "react";
import {
  ARM_BAYS,
  ARM_CHORD_RADIUS,
  ARM_DEPTH,
  ARM_DIAGONAL_RADIUS,
  ARM_LENGTH,
  ARM_WIDTH_BOTTOM,
  ARM_WIDTH_TOP,
  COUNTERWEIGHT_LENGTH,
  COUNTERWEIGHT_RADIUS,
} from "./constants";
import { MATERIAL } from "./parts";

/**
 * THE ARM — the pendulum itself.
 *
 * Drawn hanging straight DOWN from the origin, so the origin is the bearing
 * and local -Y is the direction of the arm. `UfoPendulum.tsx` then rotates
 * this whole group about the bearing's axis by whatever angle the pendulum
 * solver says, which means the arm's geometry and the arm's motion never have
 * to agree about anything except where the origin is.
 *
 * It is a tapered box truss: four chords running the length, wide at the
 * bearing where the bending moment is greatest and narrow at the hub where it
 * is not, cross-braced in nine bays. That taper is what a real pendulum ride's
 * arm looks like, and it is also what stops a thirty-nine metre arm reading as
 * a drinking straw from across the park.
 *
 * ABOVE THE BEARING sits a counterweight, as every real one carries — the
 * thing that makes a hundred-tonne gondola something a motor can start.
 */

/** One chord: a long thin cylinder from the bearing down to the hub. */
function Chord({ x, z, tilt }: { x: number; z: number; tilt: number }) {
  return (
    <group rotation={[0, 0, tilt]}>
      <mesh position={[x, -ARM_LENGTH / 2, z]} castShadow receiveShadow>
        <cylinderGeometry args={[ARM_CHORD_RADIUS, ARM_CHORD_RADIUS, ARM_LENGTH, 8]} />
        <primitive object={MATERIAL.armLight} attach="material" />
      </mesh>
    </group>
  );
}

export function Arm() {
  const bays = useMemo(
    () =>
      Array.from({ length: ARM_BAYS }, (_, i) => {
        const f = (i + 0.5) / ARM_BAYS;
        const y = -ARM_LENGTH * f;
        const width = ARM_WIDTH_TOP + (ARM_WIDTH_BOTTOM - ARM_WIDTH_TOP) * f;
        return { key: i, y, width };
      }),
    [],
  );

  /*
   * The chords converge as they descend, so each is drawn vertically at its
   * MEAN half-width and given the small lean that closes the taper. The lean
   * is an angle, not an offset: the arm has to be a truss whichever way up the
   * swing has it.
   */
  const meanHalf = (ARM_WIDTH_TOP + ARM_WIDTH_BOTTOM) / 4;
  const taperLean = Math.atan2((ARM_WIDTH_TOP - ARM_WIDTH_BOTTOM) / 2, ARM_LENGTH);
  const halfDepth = ARM_DEPTH / 2;

  return (
    <group>
      {/* Four chords, one at each corner of the truss. */}
      <Chord x={-meanHalf} z={-halfDepth} tilt={taperLean} />
      <Chord x={-meanHalf} z={halfDepth} tilt={taperLean} />
      <Chord x={meanHalf} z={-halfDepth} tilt={-taperLean} />
      <Chord x={meanHalf} z={halfDepth} tilt={-taperLean} />

      {/* Cross-ties and diagonals, one set per bay. */}
      {bays.map((b) => (
        <group key={b.key} position={[0, b.y, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[ARM_DIAGONAL_RADIUS, ARM_DIAGONAL_RADIUS, b.width, 6]}
            />
            <primitive object={MATERIAL.armMid} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 3.2]}>
            <cylinderGeometry
              args={[
                ARM_DIAGONAL_RADIUS * 0.8,
                ARM_DIAGONAL_RADIUS * 0.8,
                (ARM_LENGTH / ARM_BAYS) * 1.25,
                6,
              ]}
            />
            <primitive object={MATERIAL.armDark} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 3.2]}>
            <cylinderGeometry
              args={[
                ARM_DIAGONAL_RADIUS * 0.8,
                ARM_DIAGONAL_RADIUS * 0.8,
                (ARM_LENGTH / ARM_BAYS) * 1.25,
                6,
              ]}
            />
            <primitive object={MATERIAL.armDark} attach="material" />
          </mesh>
        </group>
      ))}

      {/* The head plate that grips the bearing shaft. */}
      <mesh castShadow>
        <boxGeometry args={[ARM_WIDTH_TOP * 1.15, 3.2, ARM_DEPTH * 1.6]} />
        <primitive object={MATERIAL.armMid} attach="material" />
      </mesh>

      {/* Counterweight, on a stub above the bearing. */}
      <mesh position={[0, COUNTERWEIGHT_LENGTH / 2, 0]}>
        <cylinderGeometry args={[1.1, 1.1, COUNTERWEIGHT_LENGTH, 10]} />
        <primitive object={MATERIAL.armDark} attach="material" />
      </mesh>
      <mesh position={[0, COUNTERWEIGHT_LENGTH, 0]} castShadow>
        <cylinderGeometry
          args={[COUNTERWEIGHT_RADIUS, COUNTERWEIGHT_RADIUS, COUNTERWEIGHT_RADIUS * 1.5, 14]}
        />
        <primitive object={MATERIAL.armDark} attach="material" />
      </mesh>
    </group>
  );
}
