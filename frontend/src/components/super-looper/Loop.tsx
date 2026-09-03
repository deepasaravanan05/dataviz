"use client";

import { useMemo } from "react";
import {
  LAMP_COUNT,
  LAMP_RADIUS,
  LOOP_RADIUS,
  RAIL_RADIUS,
  SPINE_OFFSET,
  SPINE_RADIUS,
  TIE_COUNT,
  TIE_RADIUS,
  TRACK_GAUGE,
} from "./constants";
import { MATERIAL } from "./parts";

/**
 * THE LOOP: two rails, the spine that carries them, and the lights.
 *
 * EVERYTHING HERE IS AUTHORED IN THE LOOP'S OWN PLANE, which is the ride's
 * local X-Y. That is not a convenience — a torus is authored in exactly that
 * plane, so the rails and the spine ARE tori with no rotation applied at all,
 * and a circular rail drawn as a circle cannot come out slightly elliptical or
 * slightly tilted. The whole ring is then turned once, with the ride, to face
 * the entrance. See placement.ts.
 *
 * THE STRIPES are the fairground half of the machine. The spine is one orange
 * hoop, and every other segment of it is sleeved in a slightly fatter white
 * one — which gives a candy-striped ring without two coplanar surfaces
 * fighting over the same pixels, and without paying for two dozen shadow
 * casters to do it.
 */

const STRIPE_COUNT = 12;

export function Loop() {
  const ties = useMemo(
    () => Array.from({ length: TIE_COUNT }, (_, i) => (i / TIE_COUNT) * Math.PI * 2),
    [],
  );
  const lamps = useMemo(
    () => Array.from({ length: LAMP_COUNT }, (_, i) => (i / LAMP_COUNT) * Math.PI * 2),
    [],
  );
  const stripes = useMemo(
    () =>
      Array.from({ length: STRIPE_COUNT }, (_, i) => ({
        key: i,
        start: (i / STRIPE_COUNT) * Math.PI * 2,
      })).filter((_, i) => i % 2 === 0),
    [],
  );
  const spineRadius = LOOP_RADIUS + SPINE_OFFSET;

  return (
    <group>
      {/* The spine: the hoop that actually carries the loop. */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[spineRadius, SPINE_RADIUS, 10, 96]} />
        <primitive object={MATERIAL.spine} attach="material" />
      </mesh>
      {stripes.map((s) => (
        <mesh key={s.key} rotation={[0, 0, s.start]}>
          <torusGeometry
            args={[spineRadius, SPINE_RADIUS * 1.08, 8, 8, (Math.PI * 2) / STRIPE_COUNT]}
          />
          <primitive object={MATERIAL.loopWhite} attach="material" />
        </mesh>
      ))}

      {/* The two running rails, a gauge apart, either side of the spine. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0, (side * TRACK_GAUGE) / 2]} castShadow>
          <torusGeometry args={[LOOP_RADIUS, RAIL_RADIUS, 8, 96]} />
          <primitive object={MATERIAL.rail} attach="material" />
        </mesh>
      ))}

      {/*
        Ties across the gauge, and a post from each back to the spine. Drawn on
        the same division as the lamps so the ring reads as one built thing
        rather than two rings that happen to share a centre.
      */}
      {ties.map((a, i) => {
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        return (
          <group key={i} position={[cos * LOOP_RADIUS, sin * LOOP_RADIUS, 0]} rotation={[0, 0, a]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[TIE_RADIUS, TIE_RADIUS, TRACK_GAUGE, 6]} />
              <primitive object={i % 2 === 0 ? MATERIAL.loopWhite : MATERIAL.loopOrange} attach="material" />
            </mesh>
            <mesh position={[SPINE_OFFSET / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[TIE_RADIUS * 0.9, TIE_RADIUS * 0.9, SPINE_OFFSET, 6]} />
              <primitive object={MATERIAL.steelDark} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* Bulbs round the outside of the spine — a fairground ring is lit. */}
      {lamps.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(a) * (spineRadius + SPINE_RADIUS),
            Math.sin(a) * (spineRadius + SPINE_RADIUS),
            0,
          ]}
        >
          <sphereGeometry args={[LAMP_RADIUS, 8, 6]} />
          <primitive object={MATERIAL.lamp} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
