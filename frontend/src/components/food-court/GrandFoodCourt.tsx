"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { FoodCourt } from "./FoodCourt";
import {
  FOOD_COURT_COLONNADE_RADIUS,
  FOOD_COURT_PLANTING_RADIUS,
  FOOD_COURT_PLAZA_RADIUS,
  FOOD_COURT_STALL_RADIUS,
  PARK_ORIGIN,
} from "@/components/park/parkRing";
import { MAT } from "@/components/world/kit";

/**
 * THE GRAND FOOD COURT — the centrepiece of the park.
 *
 * It replaces the lake and its waterfall at the middle of the plan, and it is
 * the largest single thing in the park: a paved circular plaza 500 m across,
 * against ride plots of 363 m. That is what makes it read as the centre from
 * the air rather than as one more attraction that happens to be in the middle.
 *
 * It is built in concentric bands, outward from the middle, and each band does
 * a different job:
 *
 *   0..45    THE PAVILION — the domed hall, its kiosks and its terrace. This is
 *            the existing `FoodCourt`, rendered unchanged inside this one; the
 *            building was never the problem, its surroundings were.
 *   60..95   THE STALLS — twelve kiosks on a ring, facing outward, each with a
 *            lit sign and an awning. What you actually queue at.
 *   120      THE COLONNADE — the circular building that frames the court. Forty
 *            columns carrying an entablature and a lit cornice, open on every
 *            side so the plaza reads as one space rather than a walled yard.
 *   152..200 THE SEATING — thirty tables on two rings, drawn by the pavilion
 *            from the shared constants, so a diner always sits somewhere real.
 *   228      THE PLANTING — a ring of trees and clipped hedge in the outer band.
 *   250      THE PLAZA EDGE, where the court's own circular path begins.
 *
 * WHAT IT COSTS TO DRAW. Everything repeated is instanced: the columns, the
 * stalls' bodies and awnings, the lamps, the trees and the hedge are one draw
 * call each however many there are. A circular building of forty columns is
 * cheaper here than a single ride.
 */

/* ------------------------------------------------------------------ *
 * PALETTE
 * ------------------------------------------------------------------ */

const STONE = new THREE.MeshStandardMaterial({ color: "#e6dcc6", roughness: 0.86 });
const STONE_DARK = new THREE.MeshStandardMaterial({ color: "#b9ad91", roughness: 0.9 });
const ROOF = new THREE.MeshStandardMaterial({ color: "#8c3b23", roughness: 0.82 });
const TEAL = new THREE.MeshStandardMaterial({ color: "#2a7f74", roughness: 0.6 });
const GOLD = new THREE.MeshStandardMaterial({
  color: "#e0a52c",
  roughness: 0.4,
  metalness: 0.35,
});

/**
 * The court's own light: emissive surface, never a new light source. The park
 * is lit almost entirely by its own architecture, and a hundred point lights
 * in the middle of it would cost more than every ride put together.
 */
const CORNICE_GLOW = new THREE.MeshBasicMaterial({ color: "#ffe2ac", toneMapped: false });
const FESTOON = new THREE.MeshBasicMaterial({ color: "#ffd88f", toneMapped: false });

const BAND_LIGHT = new THREE.MeshStandardMaterial({ color: "#cdbfa2", roughness: 0.92 });
const BAND_DARK = new THREE.MeshStandardMaterial({ color: "#8e8267", roughness: 0.94 });

const FOLIAGE = new THREE.MeshStandardMaterial({ color: "#2f6b28", roughness: 0.96 });
const HEDGE = new THREE.MeshStandardMaterial({ color: "#27581f", roughness: 0.98 });

/* ------------------------------------------------------------------ *
 * DIMENSIONS
 * ------------------------------------------------------------------ */

/** The colonnade: tall enough to read from the air, open enough to walk through. */
const COLUMN_COUNT = 40;
const COLUMN_HEIGHT = 20;
const COLUMN_RADIUS = 1.5;
const ENTABLATURE_HEIGHT = 3.2;

/** The stalls. */
const STALL_COUNT = 12;
const STALL_WIDTH = 11;
const STALL_DEPTH = 7;
const STALL_HEIGHT = 5.4;
const AWNING_OUT = 3.4;

/** The lamp ring around the plaza edge, and the planting inside it. */
const PLAZA_LAMP_COUNT = 36;
const PLAZA_LAMP_HEIGHT = 9;
const TREE_COUNT = 44;
const HEDGE_COUNT = 72;

/** One instanced mesh from a list of transforms. */
function useInstanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  items: { position: [number, number, number]; rotationY: number; scale?: [number, number, number] }[],
  castShadow = true,
  receiveShadow = false,
) {
  return useMemo(() => {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(items.length, 1));
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(0, item.rotationY, 0);
      dummy.scale.set(...(item.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.count = items.length;
    return mesh;
  }, [geometry, material, items, castShadow, receiveShadow]);
}

/** Deterministic noise, so the court is the same court on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points evenly round a circle, with the transform a thing on it needs. */
function onRing(count: number, radius: number, y: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((i + offset) / count) * Math.PI * 2;
    return {
      position: [Math.sin(a) * radius, y, Math.cos(a) * radius] as [number, number, number],
      /* Facing outward: a group turned by this carries its local +Z along the
         radius, which is the way a stall's counter and a sign have to look. */
      rotationY: a,
      angle: a,
    };
  });
}

/* ------------------------------------------------------------------ *
 * THE PARTS
 * ------------------------------------------------------------------ */

/**
 * THE COLONNADE — the circular building.
 *
 * Forty columns on a stylobate, carrying a continuous entablature and a lit
 * cornice. It is drawn as four rings and one instanced column rather than as
 * forty little buildings, which is what makes a 240 m diameter piece of
 * architecture cost five draw calls.
 */
function Colonnade() {
  const columns = useMemo(
    () => onRing(COLUMN_COUNT, FOOD_COURT_COLONNADE_RADIUS, COLUMN_HEIGHT / 2 + 0.6),
    [],
  );
  const geo = useMemo(
    () => ({
      column: new THREE.CylinderGeometry(COLUMN_RADIUS * 0.86, COLUMN_RADIUS, COLUMN_HEIGHT, 12),
      capital: new THREE.CylinderGeometry(COLUMN_RADIUS * 1.35, COLUMN_RADIUS * 1.1, 1.1, 12),
      base: new THREE.CylinderGeometry(COLUMN_RADIUS * 1.3, COLUMN_RADIUS * 1.45, 1.2, 12),
    }),
    [],
  );
  const capitals = useMemo(
    () => onRing(COLUMN_COUNT, FOOD_COURT_COLONNADE_RADIUS, COLUMN_HEIGHT + 1.15),
    [],
  );
  const bases = useMemo(() => onRing(COLUMN_COUNT, FOOD_COURT_COLONNADE_RADIUS, 0.6), []);

  const shafts = useInstanced(geo.column, STONE, columns);
  const caps = useInstanced(geo.capital, STONE_DARK, capitals);
  const foots = useInstanced(geo.base, STONE_DARK, bases);

  const R = FOOD_COURT_COLONNADE_RADIUS;
  return (
    <group>
      {/* Stylobate: the raised ring the colonnade stands on. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} receiveShadow>
        <ringGeometry args={[R - 5.5, R + 5.5, 96]} />
        <primitive object={STONE_DARK} attach="material" />
      </mesh>

      <primitive object={foots} />
      <primitive object={shafts} />
      <primitive object={caps} />

      {/* Entablature: one solid ring beam carried on the columns. */}
      <mesh position={[0, COLUMN_HEIGHT + 1.7 + ENTABLATURE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[R + 3.2, R + 3.2, ENTABLATURE_HEIGHT, 96, 1, true]}
        />
        <primitive object={STONE} attach="material" />
      </mesh>
      <mesh position={[0, COLUMN_HEIGHT + 1.7 + ENTABLATURE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[R - 3.2, R - 3.2, ENTABLATURE_HEIGHT, 96, 1, true]} />
        <primitive object={STONE} attach="material" />
      </mesh>
      {/* The roof of the colonnade walk, and its lit cornice. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, COLUMN_HEIGHT + 1.7 + ENTABLATURE_HEIGHT, 0]}
        receiveShadow
      >
        <ringGeometry args={[R - 3.4, R + 3.4, 96]} />
        <primitive object={ROOF} attach="material" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, COLUMN_HEIGHT + 1.68, 0]}
      >
        <ringGeometry args={[R + 3.2, R + 4.6, 96]} />
        <primitive object={CORNICE_GLOW} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, COLUMN_HEIGHT + 1.68, 0]}>
        <ringGeometry args={[R - 4.6, R - 3.2, 96]} />
        <primitive object={CORNICE_GLOW} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * THE FOOD STALLS — twelve kiosks on a ring, facing outward.
 *
 * Bodies, counters, awnings and sign panels are four instanced meshes; only
 * the twelve lit sign faces are individual, because each one carries different
 * lettering.
 */
const STALL_NAMES = [
  "NOODLES",
  "GRILL",
  "COFFEE",
  "BAKERY",
  "CURRY",
  "PIZZA",
  "SALAD",
  "TACOS",
  "SWEETS",
  "JUICE",
  "BIRYANI",
  "ICE CREAM",
];

function Stalls() {
  const ring = useMemo(() => onRing(STALL_COUNT, FOOD_COURT_STALL_RADIUS, 0), []);
  const geo = useMemo(
    () => ({
      body: new THREE.BoxGeometry(STALL_WIDTH, STALL_HEIGHT, STALL_DEPTH),
      counter: new THREE.BoxGeometry(STALL_WIDTH * 0.92, 1.1, 1.2),
      awning: new THREE.BoxGeometry(STALL_WIDTH, 0.35, AWNING_OUT),
      fascia: new THREE.BoxGeometry(STALL_WIDTH * 0.86, 1.5, 0.3),
    }),
    [],
  );

  const bodies = useMemo(
    () => ring.map((r) => ({ ...r, position: [r.position[0], STALL_HEIGHT / 2, r.position[2]] as [number, number, number] })),
    [ring],
  );
  const counters = useMemo(
    () =>
      ring.map((r) => ({
        ...r,
        position: [
          Math.sin(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.6),
          1.1,
          Math.cos(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.6),
        ] as [number, number, number],
      })),
    [ring],
  );
  const awnings = useMemo(
    () =>
      ring.map((r) => ({
        ...r,
        position: [
          Math.sin(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + AWNING_OUT / 2),
          STALL_HEIGHT - 0.6,
          Math.cos(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + AWNING_OUT / 2),
        ] as [number, number, number],
      })),
    [ring],
  );
  const fascias = useMemo(
    () =>
      ring.map((r) => ({
        ...r,
        position: [
          Math.sin(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.2),
          STALL_HEIGHT + 0.9,
          Math.cos(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.2),
        ] as [number, number, number],
      })),
    [ring],
  );

  const bodyMesh = useInstanced(geo.body, STONE, bodies, true, true);
  const counterMesh = useInstanced(geo.counter, TEAL, counters);
  const awningMesh = useInstanced(geo.awning, ROOF, awnings);
  const fasciaMesh = useInstanced(geo.fascia, GOLD, fascias);

  return (
    <group>
      <primitive object={bodyMesh} />
      <primitive object={counterMesh} />
      <primitive object={awningMesh} />
      <primitive object={fasciaMesh} />
      {ring.map((r, i) => (
        <Text
          key={i}
          position={[
            Math.sin(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.4),
            STALL_HEIGHT + 0.9,
            Math.cos(r.angle) * (FOOD_COURT_STALL_RADIUS + STALL_DEPTH / 2 + 0.4),
          ]}
          rotation={[0, r.angle, 0]}
          fontSize={0.95}
          color="#fff6e6"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          {STALL_NAMES[i % STALL_NAMES.length]}
        </Text>
      ))}
    </group>
  );
}

/**
 * DECORATIVE LIGHTING.
 *
 * Lamp standards round the plaza edge, and a festoon of bulbs strung between
 * every pair of colonnade columns. All emissive, all instanced: the whole
 * court's lighting is four draw calls and no light sources at all.
 */
function CourtLighting() {
  const lamps = useMemo(
    () => onRing(PLAZA_LAMP_COUNT, FOOD_COURT_PLAZA_RADIUS - 9, PLAZA_LAMP_HEIGHT / 2),
    [],
  );
  const heads = useMemo(
    () => onRing(PLAZA_LAMP_COUNT, FOOD_COURT_PLAZA_RADIUS - 9, PLAZA_LAMP_HEIGHT + 0.5),
    [],
  );
  /* Two bulbs in each bay between columns, so the festoon reads as a line of
     light round the colonnade rather than as one bulb per column. */
  const bulbs = useMemo(
    () => onRing(COLUMN_COUNT * 2, FOOD_COURT_COLONNADE_RADIUS, COLUMN_HEIGHT - 1.4, 0.5),
    [],
  );

  const geo = useMemo(
    () => ({
      post: new THREE.CylinderGeometry(0.16, 0.24, PLAZA_LAMP_HEIGHT, 8),
      head: new THREE.SphereGeometry(0.85, 10, 8),
      bulb: new THREE.SphereGeometry(0.42, 8, 6),
    }),
    [],
  );

  const posts = useInstanced(geo.post, MAT.steelDark, lamps);
  const globes = useInstanced(geo.head, MAT.lampGlow, heads, false);
  const festoon = useInstanced(geo.bulb, FESTOON, bulbs, false);

  return (
    <group>
      <primitive object={posts} />
      <primitive object={globes} />
      <primitive object={festoon} />
    </group>
  );
}

/**
 * LANDSCAPING — a ring of trees in the outer band, and clipped hedge blocks
 * between them, so the plaza has greenery in it rather than being all paving.
 */
function CourtPlanting() {
  const { trunks, crowns, hedges } = useMemo(() => {
    const rand = mulberry32(0xf00d);
    const trunks: Parameters<typeof useInstanced>[2] = [];
    const crowns: Parameters<typeof useInstanced>[2] = [];
    const hedges: Parameters<typeof useInstanced>[2] = [];

    for (let i = 0; i < TREE_COUNT; i++) {
      const a = (i / TREE_COUNT) * Math.PI * 2;
      const r = FOOD_COURT_PLANTING_RADIUS + (rand() - 0.5) * 8;
      const h = 9 + rand() * 5;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      trunks.push({ position: [x, h * 0.22, z], rotationY: a, scale: [1, h * 0.44, 1] });
      crowns.push({
        position: [x, h * 0.72, z],
        rotationY: rand() * Math.PI * 2,
        scale: [h * 0.34, h * 0.4, h * 0.34],
      });
    }

    for (let i = 0; i < HEDGE_COUNT; i++) {
      const a = ((i + 0.5) / HEDGE_COUNT) * Math.PI * 2;
      const r = FOOD_COURT_PLANTING_RADIUS - 16;
      hedges.push({
        position: [Math.sin(a) * r, 1.1, Math.cos(a) * r],
        rotationY: a,
        scale: [1, 1, 1],
      });
    }
    return { trunks, crowns, hedges };
  }, []);

  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.3, 0.45, 1, 7),
      crown: new THREE.SphereGeometry(1, 9, 7),
      hedge: new THREE.BoxGeometry(7, 2.2, 2.4),
    }),
    [],
  );

  const trunkMesh = useInstanced(geo.trunk, MAT.bark, trunks);
  const crownMesh = useInstanced(geo.crown, FOLIAGE, crowns, true, true);
  const hedgeMesh = useInstanced(geo.hedge, HEDGE, hedges, true, true);

  return (
    <group>
      <primitive object={trunkMesh} />
      <primitive object={crownMesh} />
      <primitive object={hedgeMesh} />
    </group>
  );
}

/** The inner edge of the seating band, used by the floor pattern. */
const FOOD_COURT_TABLE_BAND_INNER = 138;

/**
 * The plaza's own surface decoration: concentric bands of paler and darker
 * stone, so a 500 m disc reads as a designed floor rather than as one flat
 * colour. The disc itself is drawn by `ParkGround`, which already paves the
 * plaza circle; these sit on top of it.
 */
function PlazaFloor() {
  const bands = useMemo(
    () => [
      { inner: FOOD_COURT_PLAZA_RADIUS - 6, outer: FOOD_COURT_PLAZA_RADIUS, mat: BAND_DARK },
      { inner: FOOD_COURT_PLAZA_RADIUS - 26, outer: FOOD_COURT_PLAZA_RADIUS - 22, mat: BAND_LIGHT },
      { inner: FOOD_COURT_TABLE_BAND_INNER, outer: FOOD_COURT_TABLE_BAND_INNER + 3, mat: BAND_LIGHT },
      { inner: FOOD_COURT_STALL_RADIUS + 16, outer: FOOD_COURT_STALL_RADIUS + 19, mat: BAND_DARK },
    ],
    [],
  );
  return (
    <group>
      {bands.map((b, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
          <ringGeometry args={[b.inner, b.outer, 96]} />
          <primitive object={b.mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function GrandFoodCourt() {
  return (
    <group>
      {/*
        The court's own bands, drawn about the middle of the park. Everything
        in here is in the court's local frame, so a radius in this file is a
        radius from the centre of the plaza.
      */}
      <group position={[PARK_ORIGIN[0], 0, PARK_ORIGIN[1]]}>
        <PlazaFloor />
        <Stalls />
        <Colonnade />
        <CourtLighting />
        <CourtPlanting />
      </group>

      {/*
        The pavilion, its kiosks, its terrace, its thirty tables and the WELCOME
        marker where the avenue arrives.
        
        A SIBLING, not a child: `FoodCourt` positions itself in world space from
        FOOD_COURT_CENTER, so nesting it inside the group above would apply the
        offset twice and put the building 250 m past the plaza it belongs to.
      */}
      <FoodCourt />
    </group>
  );
}
