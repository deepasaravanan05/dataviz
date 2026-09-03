"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  BEARING_LENGTH,
  BEARING_RADIUS,
  BEARING_Y,
  PAD_HEIGHT,
  LOAD_WELL_DEPTH,
  PAD_OPENING_RADIUS,
  PAD_RADIUS,
  TOWER_BRACE_FRACTIONS,
  TOWER_BRACE_RADIUS,
  TOWER_FOOT_SPREAD,
  TOWER_HEAD_HEIGHT,
  TOWER_LEG_RADIUS,
  TOWER_SPREAD,
} from "./constants";
import { LAY_FLAT, MATERIAL } from "./parts";

/**
 * THE GROUND-FIXED HALF OF THE MACHINE: the pad, the two A-frames, and the
 * bearing they carry between them.
 *
 * Nothing in this file moves. Everything that moves hangs from the bearing,
 * which is why the bearing's position is declared once in constants.ts and
 * read by both halves rather than being drawn here and guessed at there.
 *
 * THE FRAMES STRADDLE THE SAUCER, AND LEAN ALONG THE SWING. The arm turns in
 * the ride's local X, and the saucer bolted across its end sweeps everything
 * within its own radius of that plane, at every height from the pad upward —
 * so the two frames stand outside it, at local z = ±TOWER_SPREAD / 2, and each
 * one is an A standing IN the swing plane with its feet fore and aft.
 *
 * That is a correction, not a style. The feet used to splay across the swing
 * instead, which sent each frame's inner leg diving through the middle of the
 * machine — through the saucer itself, as it happens, which only went unseen
 * while the saucer hung thirty-four metres up. The ride now comes down to the
 * ground to load, and the corridor between the frames has to be empty.
 */

/** One leg: a tapered column from a splayed foot up to the frame's head. */
function Leg({ foot }: { foot: number }) {
  const height = BEARING_Y - PAD_HEIGHT;
  const length = Math.hypot(height, foot);
  /*
   * Lean the column so its foot lands at `foot` along the swing and its head
   * at the bearing. Rotating by `tilt` about Z carries the column's own +Y to
   * (-sin, cos), which is the foot-to-head direction when the foot is at +x.
   */
  const tilt = Math.atan2(foot, height);
  /*
   * The group's origin is the FOOT, not the middle of the leg. That is the
   * correction: the origin used to be half a splay from the frame's line, and
   * with the column then leaning by the same half splay the head came out
   * displaced instead of the foot — so the two legs of each frame crossed
   * above the middle and their heads stood a splay either side of the bearing
   * they were supposed to carry. Anchoring the foot and leaning the column
   * back to x = 0 puts the head exactly on the bearing, which is what makes it
   * an A-frame rather than an X.
   */
  return (
    <group position={[foot, PAD_HEIGHT, 0]} rotation={[0, 0, tilt]}>
      <mesh position={[0, length / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[TOWER_LEG_RADIUS * 0.62, TOWER_LEG_RADIUS, length, 12]}
        />
        <primitive object={MATERIAL.towerLight} attach="material" />
      </mesh>
      {/* The pad plate the leg is bolted down through. */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, -tilt]}>
        <cylinderGeometry args={[TOWER_LEG_RADIUS * 1.9, TOWER_LEG_RADIUS * 2.1, 0.7, 12]} />
        <primitive object={MATERIAL.towerDark} attach="material" />
      </mesh>
    </group>
  );
}

/** The pad's cross-section, revolved: an annulus with a hole for the belly. */
const PAD_GEOMETRY = new THREE.LatheGeometry(
  [
    new THREE.Vector2(PAD_OPENING_RADIUS, 0),
    new THREE.Vector2(PAD_RADIUS, 0),
    new THREE.Vector2(PAD_RADIUS, PAD_HEIGHT),
    new THREE.Vector2(PAD_OPENING_RADIUS, PAD_HEIGHT),
    new THREE.Vector2(PAD_OPENING_RADIUS, 0),
  ],
  56,
);

/** One A-frame: two splayed legs, horizontal ties, and a head. */
function Frame({ z }: { z: number }) {
  const height = BEARING_Y - PAD_HEIGHT;

  const braces = useMemo(
    () =>
      TOWER_BRACE_FRACTIONS.map((f) => {
        const y = PAD_HEIGHT + height * f;
        /* The legs converge linearly, so the tie's length does too. */
        const span = TOWER_FOOT_SPREAD * 2 * (1 - f);
        return { key: f, y, span };
      }),
    [height],
  );

  return (
    <group position={[0, 0, z]}>
      <Leg foot={-TOWER_FOOT_SPREAD} />
      <Leg foot={TOWER_FOOT_SPREAD} />

      {braces.map((b) => (
        <group key={b.key} position={[0, b.y, 0]}>
          {/* The ties run between the legs, which is now ALONG the swing. */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[TOWER_BRACE_RADIUS, TOWER_BRACE_RADIUS, b.span, 8]} />
            <primitive object={MATERIAL.towerMid} attach="material" />
          </mesh>
          {/* Diagonals to the next tie up, drawn as a shallow V. */}
          <mesh rotation={[0, 0, Math.PI / 2.6]}>
            <cylinderGeometry
              args={[TOWER_BRACE_RADIUS * 0.7, TOWER_BRACE_RADIUS * 0.7, b.span * 0.62, 6]}
            />
            <primitive object={MATERIAL.towerDark} attach="material" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 2.6]}>
            <cylinderGeometry
              args={[TOWER_BRACE_RADIUS * 0.7, TOWER_BRACE_RADIUS * 0.7, b.span * 0.62, 6]}
            />
            <primitive object={MATERIAL.towerDark} attach="material" />
          </mesh>
        </group>
      ))}

      {/* The head: a machined block above the bearing, and a little mast cap. */}
      <mesh position={[0, BEARING_Y + TOWER_HEAD_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry
          args={[BEARING_RADIUS * 2.2, TOWER_HEAD_HEIGHT, BEARING_RADIUS * 2.2]}
        />
        <primitive object={MATERIAL.towerMid} attach="material" />
      </mesh>
      <mesh position={[0, BEARING_Y + TOWER_HEAD_HEIGHT, 0]}>
        <coneGeometry args={[BEARING_RADIUS * 1.5, TOWER_HEAD_HEIGHT * 0.55, 10]} />
        <primitive object={MATERIAL.towerLight} attach="material" />
      </mesh>
    </group>
  );
}

export function Towers() {
  return (
    <group>
      {/* The concrete pad, with a painted edge band so it reads as a ride.
          It is a RING: the saucer's belly comes down into the middle of it,
          so the middle is an opening with a painted kerb round it rather than
          more concrete. Lathed from its own cross-section, which is the
          one-mesh way to get a slab with a hole in it. */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <primitive object={PAD_GEOMETRY} attach="geometry" />
        <primitive object={MATERIAL.pad} attach="material" />
      </mesh>
      <mesh position={[0, PAD_HEIGHT, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PAD_RADIUS, 0.5, 6, 48]} />
        <primitive object={MATERIAL.padTrim} attach="material" />
      </mesh>
      <mesh position={[0, PAD_HEIGHT, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PAD_OPENING_RADIUS, 0.42, 6, 40]} />
        <primitive object={MATERIAL.padTrim} attach="material" />
      </mesh>

      {/*
        THE WELL THE SAUCER COMES DOWN INTO.

        The pad has always had an opening for the belly. On a machine built to
        the park's common height the belly goes further than the opening — the
        saucer parks with its seats at a height one flight of stairs reaches,
        which puts its underside LOAD_WELL_DEPTH below the ground — so the
        opening is a well rather than a gap, and it is drawn as one: a lined
        shaft with a floor, so what a visitor sees is a saucer descending into
        the machine's own pit instead of sinking through the grass.
      */}
      {LOAD_WELL_DEPTH > 0 && (
        <group>
          <mesh position={[0, -LOAD_WELL_DEPTH / 2, 0]} receiveShadow>
            <cylinderGeometry
              args={[PAD_OPENING_RADIUS, PAD_OPENING_RADIUS, LOAD_WELL_DEPTH, 40, 1, true]}
            />
            <primitive object={MATERIAL.padWell} attach="material" />
          </mesh>
          <mesh position={[0, -LOAD_WELL_DEPTH, 0]} rotation={LAY_FLAT} receiveShadow>
            <circleGeometry args={[PAD_OPENING_RADIUS, 40]} />
            <primitive object={MATERIAL.padWell} attach="material" />
          </mesh>
        </group>
      )}

      <Frame z={-TOWER_SPREAD / 2} />
      <Frame z={TOWER_SPREAD / 2} />

      {/* The bearing itself: one shaft through both frames, along local Z. */}
      <mesh position={[0, BEARING_Y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[BEARING_RADIUS, BEARING_RADIUS, BEARING_LENGTH, 16]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      {/* Housings either side, so the shaft reads as carried rather than stuck. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, BEARING_Y, (side * TOWER_SPREAD) / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[BEARING_RADIUS * 1.5, BEARING_RADIUS * 1.5, 2.0, 16]} />
          <primitive object={MATERIAL.steel} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
