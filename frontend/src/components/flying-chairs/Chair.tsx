"use client";

import { useMemo } from "react";
import type { Group } from "three";
import {
  BACK_PANEL_HEIGHT,
  CHAIR_SCALE,
  BACK_PANEL_THICKNESS,
  BACK_PANEL_WIDTH,
  CHAIN_HALF_SPREAD,
  CHAIN_LENGTH,
  CHAIN_LINK_PITCH,
  FLARE_ANGLE,
  FOOTREST_DEPTH,
  FOOTREST_DROP,
  LAP_BAR_DROP,
  LAP_BAR_RADIUS,
  SEAT_BACK_HEIGHT,
  SEAT_BACK_THICKNESS,
  SEAT_DEPTH,
  SEAT_THICKNESS,
  SEAT_WIDTH,
} from "./constants";
import { GEOMETRY, MATERIAL, panelMaterial } from "./parts";

/**
 * One flying chair: a hanger, two chains and a single-person seat.
 *
 * The chair itself is drawn at `CHAIR_SCALE` — larger than life, uniformly,
 * because a life-sized flying chair is a couple of pixels from anywhere in the
 * park. See constants.ts for what that trade costs.
 *
 * ORIENTATION. Inside this component the ride's radius runs along +X and the
 * direction of travel along Z, so a chain hanging straight down lies along -Y
 * and swinging OUT means rotating about +Z. The rider faces outward along the
 * radius, which puts the two chains at the chair's left and right and leaves
 * every seat clearly visible from outside the ring.
 *
 * THE CHAIN IS A CHAIN — real torus links, alternating a quarter turn so
 * consecutive links interlock the way steel chain does, pitched at the link
 * spacing rather than smeared along a rod. They are drawn but do not cast: a
 * 0.1 m link's shadow is not legible from where this ride is seen, and thirty
 * of them on each of forty chains would be twelve hundred shadow draws.
 */

const LINK_COUNT = Math.round(CHAIN_LENGTH / CHAIN_LINK_PITCH);

function Chain({ topZ, bottomZ }: { topZ: number; bottomZ: number }) {
  const links = useMemo(
    () =>
      Array.from({ length: LINK_COUNT }, (_, i) => {
        const t = (i + 0.5) / LINK_COUNT;
        return {
          key: i,
          y: -t * CHAIN_LENGTH,
          z: topZ + (bottomZ - topZ) * t,
          turned: i % 2 === 0,
        };
      }),
    [topZ, bottomZ],
  );

  return (
    <group>
      {links.map((l) => (
        <mesh
          key={l.key}
          position={[0, l.y, l.z]}
          /* A link stands in a VERTICAL plane; consecutive links sit a quarter
             turn apart about the chain's own axis. */
          rotation={l.turned ? [0, 0, 0] : [0, Math.PI / 2, 0]}
        >
          <primitive object={GEOMETRY.chainLink} attach="geometry" />
          <primitive object={MATERIAL.steel} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 0, topZ]}>
        <primitive object={GEOMETRY.shackle} attach="geometry" />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      <mesh position={[0, -CHAIN_LENGTH, bottomZ]}>
        <primitive object={GEOMETRY.shackle} attach="geometry" />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The chair itself, built about its own seat pan.
 *
 * The pan is this component's ORIGIN. It used to carry the chain's drop
 * itself — a `position={[0, -CHAIN_LENGTH, 0]}` on this group — and that was
 * wrong in a way nothing caught: the group is rendered inside the CHAIR_SCALE
 * group, so the 6 m drop was scaled to 13.2 m along with the chair, and every
 * chair in the park hung seven metres below the end of its own chains. From
 * the far side of the park, where this ride had only ever been looked at, a
 * detached chair reads as a chair. It shows the moment the sweep comes down to
 * head height, which is what the loading gallery is for.
 *
 * So the drop now lives OUTSIDE the scale, on the caller's side, where it
 * belongs: the chains are 6 m of chain whatever size the chair is. That also
 * makes the render agree with the arithmetic — SEAT_FLIGHT_Y, `seatRing.ts`
 * and everything derived from them always described a pan one chain length
 * below the hanger, and now that is where the pan actually is.
 */
function Seat({ color }: { color: string }) {
  const halfWidth = SEAT_WIDTH / 2;
  const backX = -SEAT_DEPTH / 2 + SEAT_BACK_THICKNESS / 2;

  return (
    <group>
      {/* Steel seat frame — the part the chains are pinned to. */}
      <mesh position={[0, -SEAT_THICKNESS * 0.7, 0]}>
        <boxGeometry args={[SEAT_DEPTH + 0.06, SEAT_THICKNESS * 0.5, SEAT_WIDTH + 0.08]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      {/* Seat pan and cushion — the body of the chair, so it casts. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[SEAT_DEPTH, SEAT_THICKNESS, SEAT_WIDTH]} />
        <primitive object={MATERIAL.seatBody} attach="material" />
      </mesh>
      <mesh position={[0, SEAT_THICKNESS * 0.75, 0]}>
        <boxGeometry args={[SEAT_DEPTH * 0.9, SEAT_THICKNESS * 0.55, SEAT_WIDTH * 0.9]} />
        <primitive object={MATERIAL.seatCushion} attach="material" />
      </mesh>

      {/* Backrest with a padded panel and a brass cap rail. */}
      <mesh position={[backX, SEAT_BACK_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[SEAT_BACK_THICKNESS, SEAT_BACK_HEIGHT, SEAT_WIDTH]} />
        <primitive object={MATERIAL.seatBody} attach="material" />
      </mesh>
      <mesh position={[backX + SEAT_BACK_THICKNESS * 0.7, SEAT_BACK_HEIGHT * 0.55, 0]}>
        <boxGeometry args={[SEAT_BACK_THICKNESS * 0.5, SEAT_BACK_HEIGHT * 0.62, SEAT_WIDTH * 0.86]} />
        <primitive object={MATERIAL.seatCushion} attach="material" />
      </mesh>
      <mesh position={[backX, SEAT_BACK_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, SEAT_WIDTH, 8]} />
        <primitive object={MATERIAL.seatTrim} attach="material" />
      </mesh>

      {/* THE PAINTED BACK PANEL. A real flying chair carries the ride's livery
          on a board standing above the seat, and it is the part of a chair you
          can actually see from across the park — so it is the part that casts,
          and the part that is coloured. */}
      <mesh
        position={[backX, SEAT_BACK_HEIGHT + BACK_PANEL_HEIGHT / 2, 0]}
        castShadow
      >
        <boxGeometry args={[BACK_PANEL_THICKNESS, BACK_PANEL_HEIGHT, BACK_PANEL_WIDTH]} />
        <primitive object={panelMaterial(color)} attach="material" />
      </mesh>
      <mesh position={[backX, SEAT_BACK_HEIGHT + BACK_PANEL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, BACK_PANEL_WIDTH * 1.05, 8]} />
        <primitive object={MATERIAL.seatTrim} attach="material" />
      </mesh>

      {/* Side rails the chains pin into — the chair's hard points. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, SEAT_THICKNESS * 1.6, side * halfWidth]}>
          <boxGeometry args={[SEAT_DEPTH * 0.92, SEAT_THICKNESS * 0.5, 0.06]} />
          <primitive object={MATERIAL.seatTrim} attach="material" />
        </mesh>
      ))}

      {/* Lap restraint, closed across the rider. */}
      <mesh position={[SEAT_DEPTH * 0.42, LAP_BAR_DROP, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LAP_BAR_RADIUS, LAP_BAR_RADIUS, SEAT_WIDTH * 0.94, 8]} />
        <primitive object={MATERIAL.seatTrim} attach="material" />
      </mesh>

      {/* Footrest, slung below the front edge on two stirrups. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[SEAT_DEPTH * 0.4, -FOOTREST_DROP / 2, side * halfWidth * 0.7]}
        >
          <cylinderGeometry args={[0.025, 0.025, FOOTREST_DROP, 6]} />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>
      ))}
      <mesh position={[SEAT_DEPTH * 0.4, -FOOTREST_DROP, 0]}>
        <boxGeometry args={[FOOTREST_DEPTH, 0.05, SEAT_WIDTH * 0.88]} />
        <primitive object={MATERIAL.seatTrim} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * One complete chair at its place on the ring.
 *
 * The flare comes from the conical-pendulum solution in constants.ts, so every
 * chair sits at the angle this geometry at this speed actually produces — and
 * it leans outward along the radius, which is why reversing the ride to
 * clockwise moves the chairs round without changing how they hang.
 */
export function Chair({
  azimuth,
  hangerRadius,
  hangerY,
  color,
  flareRef,
}: {
  azimuth: number;
  hangerRadius: number;
  hangerY: number;
  color: string;
  /**
   * The group everything below the pivot hangs from. The ride hands each chair
   * a handle to it so the frame loop can set the flare to whatever the SPEED
   * OF THE MOMENT produces — plumb while the sweep is down loading, the full
   * documented angle at cruise. It is built at the cruise angle, so a chair
   * that is never animated still stands in the ride's canonical pose.
   */
  flareRef?: (group: Group | null) => void;
}) {
  return (
    <group rotation={[0, -azimuth, 0]}>
      <group position={[hangerRadius, hangerY, 0]}>
        {/* The hanger bracket bolted to the canopy soffit. */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.4, CHAIN_HALF_SPREAD * 2 + 0.4]} />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>

        {/* Everything below the pivot flies out together. */}
        <group ref={flareRef} rotation={[0, 0, FLARE_ANGLE]}>
          <Chain topZ={CHAIN_HALF_SPREAD} bottomZ={(SEAT_WIDTH * CHAIR_SCALE) / 2} />
          <Chain topZ={-CHAIN_HALF_SPREAD} bottomZ={-(SEAT_WIDTH * CHAIR_SCALE) / 2} />
          {/* THE CHAIR IS BUILT LARGER THAN LIFE, uniformly. Every dimension
              inside `Seat` is a real one derived from the park's 1.75 m figure,
              so it is scaled here as a whole rather than edited apart — that
              way the back still matches the pan and the footrest still matches
              both. The scale grows the chair about its own seat pan, and the
              chain's drop is applied HERE, outside it, so that scaling the
              chair up can never lengthen the chain it hangs on. */}
          <group position={[0, -CHAIN_LENGTH, 0]} scale={CHAIR_SCALE}>
            <Seat color={color} />
          </group>
        </group>
      </group>
    </group>
  );
}
