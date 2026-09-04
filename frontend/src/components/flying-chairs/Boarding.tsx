"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  HANGER_RADIUS,
  LADDER_CAGE_FROM_Y,
  LADDER_CAGE_PITCH,
  LADDER_CAGE_RADIUS,
  LADDER_GATE_ARC,
  LADDER_RADIUS,
  LADDER_RUNG_COUNT,
  LADDER_RUNG_PITCH,
  LADDER_RUNG_RADIUS,
  LADDER_STILE_RADIUS,
  LADDER_TOP_Y,
  LADDER_WIDTH,
  PLATFORM_INNER_RADIUS,
  PLATFORM_LEG_COUNT,
  PLATFORM_LEG_RADIUS,
  PLATFORM_OUTER_RADIUS,
  PLATFORM_THICKNESS,
  PLATFORM_Y,
  RAIL_HEIGHT,
  RAIL_POST_COUNT,
  RAIL_RADIUS,
} from "./constants";
import { LADDER_AZIMUTH } from "./placement";
import { LAY_FLAT, MATERIAL } from "./parts";

/**
 * THE LOADING GALLERY AND THE LADDER — how a rider gets on and off.
 *
 * The sweep comes down the mast to load (see liftCycle.ts), and it stops where
 * the mast's own stiffening lets it stop, which is about seven metres up. So
 * the gallery is up there with it: a ring of boards under the hanger circle,
 * wide enough to stand under the chair you are getting into, railed on both
 * edges, carried on legs — and a caged ladder from the grass, facing the main
 * gate, because that is the side a visitor walks in from.
 *
 * NOTHING HERE TURNS. The gallery and the ladder are bolted to the ground, in
 * the same fixed frame as the plinth and the column; only the sweep above them
 * moves. And nothing here reaches further out than the chairs already swept,
 * so the ride's footprint — the thing its whole placement was solved against —
 * is exactly what it was.
 *
 * THE SHADOW BUDGET. This ride's rule is that a part casts only if its shadow
 * is legible from where the ride is seen. The deck is a 48 m ring and casts.
 * Rails, legs, rungs and cage hoops are centimetres of steel: they are drawn
 * and they do not cast. See parts.ts.
 */

/* ------------------------------------------------------------------ *
 * THE GALLERY
 * ------------------------------------------------------------------ */

/**
 * The deck is a single lathed annulus rather than a disc.
 *
 * A disc would be a floor slab straight through the column and its gussets;
 * what is wanted is a ring with a hole in the middle, and revolving the
 * board's cross-section is the one-mesh way to get one. The profile is closed
 * back to its start so the ring has a top, an outer edge, an underside and an
 * inner edge — all four are seen, the underside most of all, from below.
 */
function useDeckGeometry() {
  return useMemo(() => {
    const profile = [
      new THREE.Vector2(PLATFORM_INNER_RADIUS, 0),
      new THREE.Vector2(PLATFORM_OUTER_RADIUS, 0),
      new THREE.Vector2(PLATFORM_OUTER_RADIUS, PLATFORM_THICKNESS),
      new THREE.Vector2(PLATFORM_INNER_RADIUS, PLATFORM_THICKNESS),
      new THREE.Vector2(PLATFORM_INNER_RADIUS, 0),
    ];
    return new THREE.LatheGeometry(profile, 72);
  }, []);
}

/**
 * A hand rail as one hoop, with a gap in it where required.
 *
 * A torus is authored in its own XY plane and is laid flat here by LAY_FLAT,
 * which sends its parameter angle `a` to the world azimuth `-a`. Spinning it
 * about its own axis first by `gapTurn` therefore puts the arc's missing wedge
 * at the world azimuth this component is asked for. The euler is applied Z
 * then Y then X, so that spin happens while the hoop is still upright and
 * lands correctly once it is laid down — which is exactly the sort of
 * reasoning that is easy to get backwards, so verify-flying-chairs.ts builds
 * this same euler with three's own matrix code and measures where the gap
 * actually ends up.
 */
function RailHoop({
  radius,
  y,
  arc,
  gapCenter,
}: {
  radius: number;
  y: number;
  arc: number;
  gapCenter: number;
}) {
  const gapTurn = (Math.PI * 2 - arc) / 2 - gapCenter;
  return (
    <mesh position={[0, y, 0]} rotation={[LAY_FLAT[0], 0, gapTurn]}>
      <torusGeometry args={[radius, RAIL_RADIUS, 5, 120, arc]} />
      <primitive object={MATERIAL.deckTrim} attach="material" />
    </mesh>
  );
}

function Gallery() {
  const deck = useDeckGeometry();
  const legHeight = PLATFORM_Y - PLATFORM_THICKNESS;

  const posts = useMemo(
    () => Array.from({ length: RAIL_POST_COUNT }, (_, i) => (i / RAIL_POST_COUNT) * Math.PI * 2),
    [],
  );
  const legs = useMemo(
    () =>
      Array.from({ length: PLATFORM_LEG_COUNT }, (_, i) => (i / PLATFORM_LEG_COUNT) * Math.PI * 2),
    [],
  );

  /* Is this azimuth inside the opening left for the ladder? */
  const inGate = (a: number) => {
    let d = a - LADDER_AZIMUTH;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) < LADDER_GATE_ARC / 2;
  };

  return (
    <group>
      {/* The boards. */}
      <mesh position={[0, PLATFORM_Y - PLATFORM_THICKNESS, 0]} castShadow receiveShadow>
        <primitive object={deck} attach="geometry" />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>
      {/* Edge mouldings, the livery carried round both edges of the ring. */}
      <mesh position={[0, PLATFORM_Y, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PLATFORM_OUTER_RADIUS, 0.16, 6, 72]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>
      <mesh position={[0, PLATFORM_Y, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[PLATFORM_INNER_RADIUS, 0.14, 6, 72]} />
        <primitive object={MATERIAL.brass} attach="material" />
      </mesh>

      {/* Legs on the hanger circle, and the ring beam they carry. */}
      {legs.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * HANGER_RADIUS, legHeight / 2, Math.sin(a) * HANGER_RADIUS]}
        >
          <cylinderGeometry args={[PLATFORM_LEG_RADIUS * 0.8, PLATFORM_LEG_RADIUS, legHeight, 10]} />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, legHeight - 0.3, 0]} rotation={LAY_FLAT}>
        <torusGeometry args={[HANGER_RADIUS, 0.22, 6, 72]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>

      {/* Guard rails: a full hoop outside, and one inside broken for the
          ladder. The posts follow the same twenty-fold division as the chairs
          above them, so the gallery reads as part of the same machine. */}
      {posts.map((a, i) => (
        <group key={i}>
          <mesh
            position={[
              Math.cos(a) * PLATFORM_OUTER_RADIUS,
              PLATFORM_Y + RAIL_HEIGHT / 2,
              Math.sin(a) * PLATFORM_OUTER_RADIUS,
            ]}
          >
            <cylinderGeometry args={[RAIL_RADIUS, RAIL_RADIUS, RAIL_HEIGHT, 8]} />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
          {!inGate(a) && (
            <mesh
              position={[
                Math.cos(a) * PLATFORM_INNER_RADIUS,
                PLATFORM_Y + RAIL_HEIGHT / 2,
                Math.sin(a) * PLATFORM_INNER_RADIUS,
              ]}
            >
              <cylinderGeometry args={[RAIL_RADIUS, RAIL_RADIUS, RAIL_HEIGHT, 8]} />
              <primitive object={MATERIAL.steel} attach="material" />
            </mesh>
          )}
        </group>
      ))}
      {[RAIL_HEIGHT, RAIL_HEIGHT * 0.55].map((h) => (
        <group key={h}>
          <RailHoop radius={PLATFORM_OUTER_RADIUS} y={PLATFORM_Y + h} arc={Math.PI * 2} gapCenter={0} />
          <RailHoop
            radius={PLATFORM_INNER_RADIUS}
            y={PLATFORM_Y + h}
            arc={Math.PI * 2 - LADDER_GATE_ARC}
            gapCenter={LADDER_AZIMUTH}
          />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * THE LADDER
 * ------------------------------------------------------------------ */

/**
 * A fixed caged ladder from the grass to the gallery.
 *
 * Inside this component the ride's radius runs along +X, exactly as it does in
 * `Chair`, so the climber faces +X — outward, towards the gallery edge — and
 * the cage hoops stand behind their back. The stiles carry on a grab height
 * above the boards, as a real fixed ladder does, and a short landing plate
 * bridges the standoff between the ladder and the deck's inner edge.
 */
function Ladder() {
  const rungs = useMemo(
    () => Array.from({ length: LADDER_RUNG_COUNT }, (_, i) => (i + 1) * LADDER_RUNG_PITCH),
    [],
  );
  const hoops = useMemo(() => {
    const out: number[] = [];
    for (let y = LADDER_CAGE_FROM_Y; y < PLATFORM_Y - 0.2; y += LADDER_CAGE_PITCH) out.push(y);
    return out;
  }, []);
  const half = LADDER_WIDTH / 2;
  const landingRun = PLATFORM_INNER_RADIUS - LADDER_RADIUS;

  return (
    <group rotation={[0, -LADDER_AZIMUTH, 0]}>
      <group position={[LADDER_RADIUS, 0, 0]}>
        {/* Stiles, ground to grab height. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, LADDER_TOP_Y / 2, side * half]}>
            <cylinderGeometry
              args={[LADDER_STILE_RADIUS, LADDER_STILE_RADIUS, LADDER_TOP_Y, 8]}
            />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
        ))}
        {/* Rungs. */}
        {rungs.map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[LADDER_RUNG_RADIUS, LADDER_RUNG_RADIUS, LADDER_WIDTH, 6]} />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
        ))}
        {/* Back hoops, and the straps tying them together. */}
        {hoops.map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={LAY_FLAT}>
            <torusGeometry args={[LADDER_CAGE_RADIUS, 0.022, 4, 20]} />
            <primitive object={MATERIAL.steelDark} attach="material" />
          </mesh>
        ))}
        {hoops.length > 1 &&
          [Math.PI * 0.72, Math.PI, Math.PI * 1.28].map((a) => {
            const from = hoops[0];
            const to = hoops[hoops.length - 1];
            return (
              <mesh
                key={a}
                position={[
                  Math.cos(a) * LADDER_CAGE_RADIUS,
                  (from + to) / 2,
                  Math.sin(a) * LADDER_CAGE_RADIUS,
                ]}
              >
                <cylinderGeometry args={[0.022, 0.022, to - from, 5]} />
                <primitive object={MATERIAL.steelDark} attach="material" />
              </mesh>
            );
          })}
        {/* The landing plate onto the gallery, and its kerb. */}
        <mesh position={[landingRun / 2, PLATFORM_Y - 0.05, 0]}>
          <boxGeometry args={[landingRun, 0.1, LADDER_WIDTH + 0.4]} />
          <primitive object={MATERIAL.deck} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

/** Everything a rider touches on the ground: the gallery and the way up to it. */
export function Boarding() {
  return (
    <group>
      <Gallery />
      <Ladder />
    </group>
  );
}
