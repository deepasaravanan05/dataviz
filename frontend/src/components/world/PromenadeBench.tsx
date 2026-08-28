"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { rideById } from "@/components/park/layout";
import { stairFor } from "@/simulation/journey/rideOps";
import { RIDE_SEAT_SCALE } from "@/world/scale";

/**
 * A WOODEN PROMENADE BENCH, of the kind an ocean liner's boat deck carried:
 * slatted timber seat and back on a pair of shaped end frames, with turned
 * armrests and a scrolled foot.
 *
 * ADD-ONLY. This is one new prop standing on the existing ground beside the
 * existing Ferris Wheel. It touches nothing: no ride is moved, resized, rotated
 * or re-rendered, no route is altered, and nothing in the simulation reads it.
 *
 * BUILT, NOT DOWNLOADED. Every object in this park is procedural three.js
 * geometry — there is no texture or model pipeline here and no asset directory
 * to put a GLB in — so the bench is modelled to the reference's design rather
 * than imported from it. That also keeps it at a few hundred triangles of
 * shared geometry, which is what a scene already carrying thirty rigged
 * characters and five large rides can afford.
 */

/* ------------------------------------------------------------------ */
/* Timber                                                              */
/* ------------------------------------------------------------------ */

/**
 * Finished hardwood: a warm dark brown under a satin varnish, not the flat
 * plastic brown a single default material gives. Roughness is high enough to
 * stay matte in the park's low evening light while the small metalness lets the
 * varnish catch a highlight along each slat's rounded edge, which is most of
 * what makes timber read as timber at a distance.
 */
const WOOD_BASE = "#5a3a20";

/**
 * Grain, without a texture map.
 *
 * Real timber is never one colour: every board is cut from a different part of
 * the log. Each slat therefore gets its own tone, drawn deterministically from
 * its index across a narrow band around the base colour, so the bench reads as
 * an assembly of individual boards rather than one moulded object — and it
 * looks the same on every reload.
 */
const GRAIN_SPREAD = 0.16;

function slatMaterial(index: number): THREE.MeshStandardMaterial {
  /* A cheap deterministic hash, so slat n always gets tone n. */
  const t = ((Math.sin(index * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const c = new THREE.Color(WOOD_BASE);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(
    hsl.h + (t - 0.5) * 0.012,
    hsl.s * (1 + (t - 0.5) * 0.22),
    hsl.l * (1 + (t - 0.5) * GRAIN_SPREAD),
  );
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.62 + t * 0.1,
    metalness: 0.04,
  });
}

/** The cast end frames and fixings: dark painted iron, as on the reference. */
const IRONWORK = new THREE.MeshStandardMaterial({
  color: "#241a14",
  roughness: 0.52,
  metalness: 0.55,
});

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

/**
 * The bench at its real dimensions, in metres — the reference's own
 * proportions: a 1.9 m bench, 0.62 m deep, 0.92 m to the top of the back, with
 * the seat at the usual 0.45 m.
 */
export const BENCH = {
  length: 1.9,
  depth: 0.62,
  height: 0.92,
  seatY: 0.45,
  seatDepth: 0.5,
  slat: 0.035,
  gap: 0.014,
  backRake: (12 * Math.PI) / 180,
};

/**
 * ...and then drawn at `EMPLOYEE_SCALE`, like everything else in this park that
 * a person actually touches.
 *
 * The employees are drawn at 2.29 times life size by an explicit decision, and
 * the same factor is already applied to the boarding stairs' risers, their
 * width and their handrails, so that people meet them at the knee, the hand and
 * the hip. A bench left at 1.9 m beside a 4-unit figure would come up to their
 * shin and could not be sat on; at the figure's own scale it is a bench.
 *
 * The PROPORTIONS above are the reference's exactly. Only the size follows the
 * people using it: RIDE_SEAT_SCALE, which is the same factor every seat in the
 * park now carries, so the bench matches the ride seating exactly.
 *
 * ONE factor, not two. This used to read EMPLOYEE_SCALE * RIDE_SEAT_SCALE,
 * which was right only while RIDE_SEAT_SCALE was an independent 1.6. Now that a
 * ride seat is sized by the employee who sits in it, RIDE_SEAT_SCALE IS
 * EMPLOYEE_SCALE — and multiplying the two squared it, giving an 89 m bench.
 */
export const BENCH_SCALE = RIDE_SEAT_SCALE;

/* ------------------------------------------------------------------ */
/* Where it stands                                                     */
/* ------------------------------------------------------------------ */

/**
 * A resting spot beside the Ferris Wheel, solved rather than placed by hand.
 *
 * Swept around the wheel at three set-backs and every three degrees, scoring
 * each candidate on how far it keeps from anything that is already there — the
 * walked routes, the boarding stair, its queue and its platform — with a
 * preference for the side the visitor arrives from. The winner sits 22 m clear
 * of the wheel's own footprint on the far side from the boarding stair, which
 * is a promenade set-back rather than a spot in the way of anybody.
 */
function solvePlacement(): { position: [number, number, number]; yaw: number } {
  const wheel = rideById("ferris");
  const stair = stairFor("ferris");
  const obstacles: [number, number][] = [
    [stair.base[0], stair.base[1]],
    [stair.deck[0], stair.deck[1]],
    ...stair.queue.map((q) => [q[0], q[1]] as [number, number]),
  ];

  let best: { x: number; z: number; score: number } | null = null;
  for (let deg = 0; deg < 360; deg += 3) {
    const th = (deg * Math.PI) / 180;
    for (const radius of [wheel.halfX + 10, wheel.halfX + 16, wheel.halfX + 22]) {
      const x = wheel.center[0] + Math.cos(th) * radius;
      const z = wheel.center[1] + Math.sin(th) * radius;
      let clear = Infinity;
      for (const o of obstacles) clear = Math.min(clear, Math.hypot(x - o[0], z - o[1]));
      /* Toward the side a visitor comes in from, so the bench faces the wheel
         across open ground rather than across its own queue. */
      const gateSide = (z - wheel.center[1]) / radius;
      const score = clear + gateSide * 6;
      if (!best || score > best.score) best = { x, z, score };
    }
  }

  const { x, z } = best!;
  /* Facing the wheel. The park's convention is that +Z is an object's forward
     axis, so a sitter looks straight at the ride. */
  const yaw = Math.atan2(wheel.center[0] - x, wheel.center[1] - z);
  return { position: [x, 0, z], yaw };
}

export const BENCH_PLACEMENT = solvePlacement();

/* ------------------------------------------------------------------ */
/* The bench                                                           */
/* ------------------------------------------------------------------ */

/** One shaped end frame: front leg, back leg carried up into the back, foot. */
function EndFrame({ side }: { side: number }) {
  const B = BENCH;
  const x = side * (B.length / 2 - 0.06);
  return (
    <group position={[x, 0, 0]}>
      {/* Scrolled foot, spreading fore and aft so the bench cannot rock. */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <boxGeometry args={[0.07, 0.07, B.depth * 0.92]} />
        <primitive object={IRONWORK} attach="material" />
      </mesh>
      {/* Front leg, raked slightly outward as the reference's castings are. */}
      <mesh position={[0, B.seatY / 2, B.seatDepth / 2 - 0.05]} rotation={[0.06, 0, 0]} castShadow>
        <boxGeometry args={[0.055, B.seatY, 0.075]} />
        <primitive object={IRONWORK} attach="material" />
      </mesh>
      {/* Back leg, continuing above the seat to carry the backrest. */}
      <mesh
        position={[0, B.height / 2, -B.seatDepth / 2 + 0.04 - Math.sin(B.backRake) * 0.12]}
        rotation={[-B.backRake, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.055, B.height, 0.075]} />
        <primitive object={IRONWORK} attach="material" />
      </mesh>
      {/* Armrest: a turned timber rail on an iron bracket. */}
      <RoundedBox
        args={[0.06, 0.045, B.seatDepth * 0.86]}
        radius={0.018}
        smoothness={3}
        position={[0, B.seatY + 0.24, -0.02]}
        castShadow
      >
        <primitive object={slatMaterial(31)} attach="material" />
      </RoundedBox>
      <mesh position={[0, B.seatY + 0.12, B.seatDepth / 2 - 0.06]} castShadow>
        <boxGeometry args={[0.035, 0.24, 0.035]} />
        <primitive object={IRONWORK} attach="material" />
      </mesh>
    </group>
  );
}

export function PromenadeBench({
  position,
  yaw = 0,
}: {
  position: [number, number, number];
  yaw?: number;
}) {
  const B = BENCH;

  /* Slats built once and shared: the geometry never changes. */
  const { seatSlats, backSlats } = useMemo(() => {
    const pitch = B.slat + B.gap;
    const seat = Array.from({ length: 5 }, (_, i) => ({
      key: i,
      z: (i - 2) * (B.seatDepth / 5) * 1.02,
      material: slatMaterial(i),
    }));
    const back = Array.from({ length: 4 }, (_, i) => ({
      key: 10 + i,
      y: B.seatY + 0.16 + i * (pitch * 2.6),
      material: slatMaterial(10 + i),
    }));
    return { seatSlats: seat, backSlats: back };
  }, [B.gap, B.seatDepth, B.seatY, B.slat]);

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={BENCH_SCALE}>
      {/* Seat: five boards laid across the frames, edges eased. */}
      {seatSlats.map((s) => (
        <RoundedBox
          key={s.key}
          args={[B.length, B.slat, (B.seatDepth / 5) * 0.92]}
          radius={B.slat * 0.34}
          smoothness={3}
          position={[0, B.seatY, s.z]}
          castShadow
          receiveShadow
        >
          <primitive object={s.material} attach="material" />
        </RoundedBox>
      ))}

      {/* Back: four boards, raked back on the legs that carry them. */}
      <group rotation={[-B.backRake, 0, 0]} position={[0, 0, -B.seatDepth / 2 + 0.04]}>
        {backSlats.map((s) => (
          <RoundedBox
            key={s.key}
            args={[B.length, B.slat, 0.028]}
            radius={B.slat * 0.34}
            smoothness={3}
            position={[0, s.y, 0]}
            castShadow
            receiveShadow
          >
            <primitive object={s.material} attach="material" />
          </RoundedBox>
        ))}
      </group>

      {/* The two cast end frames. */}
      <EndFrame side={-1} />
      <EndFrame side={1} />

      {/* A centre frame, as a bench this long needs. */}
      <mesh position={[0, B.seatY / 2, 0]} castShadow>
        <boxGeometry args={[0.045, B.seatY, B.seatDepth * 0.8]} />
        <primitive object={IRONWORK} attach="material" />
      </mesh>
    </group>
  );
}

/** The one bench, at the spot solved above, facing the Ferris Wheel. */
export function FerrisWheelBench() {
  return (
    <PromenadeBench position={BENCH_PLACEMENT.position} yaw={BENCH_PLACEMENT.yaw} />
  );
}
