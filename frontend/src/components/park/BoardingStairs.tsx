"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Instance, Instances } from "@react-three/drei";
import {
  LANDING_DEPTH,
  STAIR_RAIL_HEIGHT,
  STAIR_RISE,
  STAIR_WIDTH,
  type BoardingStair,
  type StairFlight,
} from "@/simulation/journey/boardingStair";
import { BOARDING_STAIRS } from "@/simulation/journey/rideOps";
import { DEPARTMENT_RIDE_IDS } from "@/simulation/journey/rideKinematics";
import { PROP } from "@/world/scale";

/**
 * THE BOARDING STAIRS — one per department ride, drawn where the solver put
 * them.
 *
 * ADD-ONLY, and outside every ride. These are world-space objects rendered
 * alongside the gate and the food court; not one line of any ride module is
 * touched, no ride is moved, resized or recoloured, and nothing here is inside
 * a ride's own group. What the solver decides — which side of which ride, how
 * high, how many flights — is read from `boardingStair.ts`, so the steps that
 * are drawn are exactly the steps the employees walk on.
 *
 * Each stair is a real one: treads on closed risers between two stringers,
 * a handrail on both sides carried on posts, a landing at every turn of the
 * switchback, and a railed boarding platform at the top with an opening on the
 * side the seats are.
 *
 * Instanced, because the Dragon Swing Ship's stair alone is sixty-two steps:
 * every tread in the park is one draw call, and so is every riser, post and
 * baluster.
 */

/*
 * BRIGHT GALVANISED STEEL AND PALE TREAD PLATE.
 *
 * The stairs sit against two backgrounds that both used to swallow them: green
 * grass, and the rides' own dark structure. Mid-grey steel at #9aa1aa is close
 * enough in value to both to disappear at distance, and the old tread brown was
 * darker still.
 *
 * Everything is therefore lifted a couple of stops, to the value real hot-dip
 * galvanising and mill-finish tread plate actually have when they are new — the
 * brightest genuinely metal things on a ride. Nothing here emits light and
 * nothing is saturated; the readability comes from VALUE contrast against the
 * grass and the ride behind, which is what carries at distance, and from the
 * rails being a lighter tone than the stringers so the two do not merge into
 * one bar.
 */
const STEEL = new THREE.MeshStandardMaterial({
  color: "#cfd6de",
  metalness: 0.66,
  roughness: 0.34,
});
const STEEL_DARK = new THREE.MeshStandardMaterial({
  color: "#8b939d",
  metalness: 0.68,
  roughness: 0.42,
});
/** Non-slip tread plate — the one warm note, so the steps read against the steel. */
const TREAD = new THREE.MeshStandardMaterial({
  color: "#e0aa62",
  metalness: 0.28,
  roughness: 0.66,
});
const DECK = new THREE.MeshStandardMaterial({
  color: "#b08d63",
  metalness: 0.16,
  roughness: 0.78,
});

/*
 * SECTION SIZES, thickened so the stair reads from the main camera.
 *
 * Every one of these was drawn at true building scale and vanished at viewing
 * distance: a 120 mm tread edge-on and a 70 mm handrail are less than a pixel
 * from the overview. Doubling the treads and tripling the rails puts them back
 * in the picture without turning the stair into a cartoon — the result is the
 * section of a real outdoor access stair, heavier than an indoor one because
 * it is galvanised steel out in the weather.
 */
const TREAD_THICKNESS = 0.24;
const STRINGER_THICKNESS = 0.4;
const RAIL_RADIUS = 0.19;
const POST_RADIUS = 0.15;
/** Posts along a flight's rail, one every few treads. */
const POST_EVERY = 4;

interface Placed {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}

/** Yaw that points +Z along a flight's direction of travel. */
function flightYaw(f: StairFlight): number {
  return Math.atan2(f.to[0] - f.from[0], f.to[2] - f.from[2]);
}

function flightRun(f: StairFlight): number {
  return Math.hypot(f.to[0] - f.from[0], f.to[2] - f.from[2]);
}

/**
 * Every piece of every stair, worked out once. Kept out of the render path
 * because none of it changes: the stairs are as fixed as the rides they serve.
 */
function buildPieces(stairs: BoardingStair[]) {
  const treads: Placed[] = [];
  const risers: Placed[] = [];
  const stringers: Placed[] = [];
  const rails: Placed[] = [];
  const posts: Placed[] = [];
  const slabs: Placed[] = [];
  const balusters: Placed[] = [];

  for (const stair of stairs) {
    for (const f of stair.flights) {
      const yaw = flightYaw(f);
      const run = flightRun(f);
      const rise = f.to[1] - f.from[1];
      const stepRun = run / f.steps;
      const stepRise = rise / f.steps;
      const ux = Math.sin(yaw);
      const uz = Math.cos(yaw);
      const px = Math.cos(yaw);
      const pz = -Math.sin(yaw);

      for (let i = 0; i < f.steps; i++) {
        /* The nose of step i sits one going and one rise along from the last. */
        const d = (i + 0.5) * stepRun;
        const y = f.from[1] + (i + 1) * stepRise;
        treads.push({
          position: [f.from[0] + ux * d, y - TREAD_THICKNESS / 2, f.from[2] + uz * d],
          rotation: [0, yaw, 0],
          scale: [STAIR_WIDTH, TREAD_THICKNESS, stepRun],
        });
        risers.push({
          position: [
            f.from[0] + ux * (i * stepRun),
            y - stepRise / 2 - TREAD_THICKNESS / 2,
            f.from[2] + uz * (i * stepRun),
          ],
          rotation: [0, yaw, 0],
          scale: [STAIR_WIDTH * 0.98, Math.abs(stepRise), 0.08],
        });

        if (i % POST_EVERY === 0) {
          for (const side of [-1, 1]) {
            posts.push({
              position: [
                f.from[0] + ux * d + px * side * (STAIR_WIDTH / 2),
                y + STAIR_RAIL_HEIGHT / 2,
                f.from[2] + uz * d + pz * side * (STAIR_WIDTH / 2),
              ],
              rotation: [0, 0, 0],
              scale: [1, STAIR_RAIL_HEIGHT, 1],
            });
          }
        }
      }

      /* Two stringers carrying the treads, and a handrail over each. */
      const slope = Math.atan2(rise, run);
      const length = Math.hypot(run, rise);
      const midX = (f.from[0] + f.to[0]) / 2;
      const midZ = (f.from[2] + f.to[2]) / 2;
      const midY = (f.from[1] + f.to[1]) / 2;
      for (const side of [-1, 1]) {
        stringers.push({
          position: [
            midX + px * side * (STAIR_WIDTH / 2 + STRINGER_THICKNESS / 2),
            midY - STAIR_RISE * 0.9,
            midZ + pz * side * (STAIR_WIDTH / 2 + STRINGER_THICKNESS / 2),
          ],
          rotation: [-slope, yaw, 0],
          scale: [STRINGER_THICKNESS, STAIR_RISE * 2.2, length],
        });
        rails.push({
          position: [
            midX + px * side * (STAIR_WIDTH / 2),
            midY + STAIR_RAIL_HEIGHT,
            midZ + pz * side * (STAIR_WIDTH / 2),
          ],
          rotation: [Math.PI / 2 - slope, yaw, 0],
          scale: [1, length, 1],
        });
      }
    }

    /* Landings at every turn of a switchback. */
    for (const l of stair.landings) {
      slabs.push({
        position: [l.at[0], l.at[1] - TREAD_THICKNESS / 2, l.at[2]],
        rotation: [0, Math.atan2(stair.outward[0], stair.outward[1]), 0],
        scale: [STAIR_WIDTH * 2 + 0.4, TREAD_THICKNESS, LANDING_DEPTH + 0.4],
      });
    }

    /* The boarding platform. */
    const deckYaw = Math.atan2(stair.outward[0], stair.outward[1]);
    slabs.push({
      position: [stair.deck[0], stair.deckY - TREAD_THICKNESS / 2, stair.deck[1]],
      rotation: [0, deckYaw, 0],
      scale: [stair.deckHalfAlong * 2, TREAD_THICKNESS, stair.deckHalfOut * 2],
    });

    /*
     * A rail along the platform's OUTER edge only. The inner edge is where the
     * seats are and has to stay open, and the two ends are where people arrive
     * from the stair.
     */
    const n = Math.max(2, Math.round((stair.deckHalfAlong * 2) / 1.6));
    for (let i = 0; i <= n; i++) {
      const a = -stair.deckHalfAlong + (i / n) * stair.deckHalfAlong * 2;
      balusters.push({
        position: [
          stair.deck[0] + stair.along[0] * a + stair.outward[0] * stair.deckHalfOut,
          stair.deckY + PROP.railHeight,
          stair.deck[1] + stair.along[1] * a + stair.outward[1] * stair.deckHalfOut,
        ],
        rotation: [0, 0, 0],
        scale: [1, PROP.railHeight * 2, 1],
      });
    }
    rails.push({
      position: [
        stair.deck[0] + stair.outward[0] * stair.deckHalfOut,
        stair.deckY + PROP.railHeight * 2,
        stair.deck[1] + stair.outward[1] * stair.deckHalfOut,
      ],
      rotation: [Math.PI / 2, deckYaw + Math.PI / 2, 0],
      scale: [1, stair.deckHalfAlong * 2, 1],
    });
  }

  return { treads, risers, stringers, rails, posts, slabs, balusters };
}

function Boxes({ items, material }: { items: Placed[]; material: THREE.Material }) {
  if (items.length === 0) return null;
  return (
    <Instances limit={items.length} range={items.length} castShadow receiveShadow material={material}>
      <boxGeometry args={[1, 1, 1]} />
      {items.map((p, i) => (
        <Instance key={i} position={p.position} rotation={p.rotation} scale={p.scale} />
      ))}
    </Instances>
  );
}

function Tubes({
  items,
  radius,
  material,
}: {
  items: Placed[];
  radius: number;
  material: THREE.Material;
}) {
  if (items.length === 0) return null;
  return (
    <Instances limit={items.length} range={items.length} castShadow material={material}>
      <cylinderGeometry args={[radius, radius, 1, 8]} />
      {items.map((p, i) => (
        <Instance key={i} position={p.position} rotation={p.rotation} scale={p.scale} />
      ))}
    </Instances>
  );
}

export function BoardingStairs() {
  const pieces = useMemo(
    /*
     * The Giga Coaster is not drawn here. It boards through its own station —
     * boards, canopy, rails and one straight flight, all drawn by
     * `giga-coaster/Station.tsx` — and `boardingStair.ts` reads that station
     * rather than solving a deck for it, so drawing one here would put a
     * second platform on top of the first.
     */
    () => buildPieces(DEPARTMENT_RIDE_IDS.filter((id) => id !== "giga").map((id) => BOARDING_STAIRS[id])),
    [],
  );

  return (
    <group>
      <Boxes items={pieces.slabs} material={DECK} />
      <Boxes items={pieces.treads} material={TREAD} />
      <Boxes items={pieces.risers} material={STEEL_DARK} />
      <Boxes items={pieces.stringers} material={STEEL_DARK} />
      <Tubes items={pieces.rails} radius={RAIL_RADIUS} material={STEEL} />
      <Tubes items={pieces.posts} radius={POST_RADIUS} material={STEEL} />
      <Tubes items={pieces.balusters} radius={POST_RADIUS} material={STEEL} />
    </group>
  );
}
