"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PROP } from "@/world/scale";

/**
 * The park's fittings kit.
 *
 * One set of real-world-sized street furniture, shared by the entrance, the
 * food court, the department zones and the open environment. Having a single
 * kit is what keeps the world consistent: a bench is the same bench everywhere,
 * at the same 0.45 m seat height, so no corner of the park quietly drifts to a
 * different scale.
 *
 * Everything is built from shared geometries and materials created once at
 * module load, so scattering several hundred props across the park costs a
 * handful of materials rather than several hundred.
 */

/*
 * The night palette.
 *
 * Surfaces are dark but never black: a park at night is lit by its own
 * fittings, so paving reads as damp charcoal picking up nearby light rather
 * than as a void. Roughness is dialled down on the hard surfaces so they catch
 * a sheen from the moon and the LEDs, which is most of what sells wet-looking
 * asphalt without paying for real reflections.
 */
export const MAT = {
  concrete: new THREE.MeshStandardMaterial({ color: "#3a3d44", roughness: 0.9 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: "#2a2d33", roughness: 0.92 }),
  asphalt: new THREE.MeshStandardMaterial({ color: "#15171d", roughness: 0.62, metalness: 0.12 }),
  paving: new THREE.MeshStandardMaterial({ color: "#2e3138", roughness: 0.66, metalness: 0.08 }),
  paint: new THREE.MeshStandardMaterial({ color: "#b9bec8", roughness: 0.75 }),
  /* Road edge markings. Faintly emissive so the lines still read once the park
     is lit only by its own architecture, without glowing like a light source. */
  roadLine: new THREE.MeshStandardMaterial({
    color: "#f2f4f8",
    roughness: 0.8,
    emissive: "#cdd3dc",
    emissiveIntensity: 0.22,
  }),
  steel: new THREE.MeshStandardMaterial({ color: "#5b6675", roughness: 0.38, metalness: 0.7 }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#242a32", roughness: 0.45, metalness: 0.6 }),
  navy: new THREE.MeshStandardMaterial({ color: "#1a2740", roughness: 0.6 }),
  amber: new THREE.MeshStandardMaterial({ color: "#f2b134", roughness: 0.42, metalness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: "#4a3320", roughness: 0.88 }),
  woodDark: new THREE.MeshStandardMaterial({ color: "#332314", roughness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#8fb6d6",
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.62,
  }),
  render: new THREE.MeshStandardMaterial({ color: "#4a4438", roughness: 0.9 }),
  roofTile: new THREE.MeshStandardMaterial({ color: "#2e1a14", roughness: 0.88 }),
  canopy: new THREE.MeshStandardMaterial({ color: "#4a525e", roughness: 0.55, side: THREE.DoubleSide }),
  /*
   * Leaf colour for the hand-placed planting — the entrance beds, the planters
   * and the food-court borders. These three used to sit between #13291a and
   * #22432a, which is a green so dark and so desaturated that it reads as
   * black shrubbery against dark ground. They now run the same range the
   * park's own planting does: a deep shade green, a mid park green and a lit
   * one, so a bed has depth instead of a single silhouette.
   */
  foliageDeep: new THREE.MeshStandardMaterial({ color: "#1c4020", roughness: 0.96 }),
  foliageMid: new THREE.MeshStandardMaterial({ color: "#2a5f2a", roughness: 0.96 }),
  foliageLight: new THREE.MeshStandardMaterial({ color: "#3d7d34", roughness: 0.96 }),
  /* Bark, warmed slightly off near-black so a trunk reads as wood. */
  bark: new THREE.MeshStandardMaterial({ color: "#37281d", roughness: 0.97 }),
  soil: new THREE.MeshStandardMaterial({ color: "#241c15", roughness: 1 }),
  /* Street lighting: emissive, so a few hundred lamps cost nothing. */
  lampGlow: new THREE.MeshBasicMaterial({ color: "#ffdca8", toneMapped: false }),
  lampHalo: new THREE.MeshBasicMaterial({
    color: "#ffca7a",
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }),
};

const GEO = {
  lampPost: new THREE.CylinderGeometry(0.075, 0.11, PROP.lampHeight, 8),
  lampArm: new THREE.BoxGeometry(0.9, 0.09, 0.09),
  lampHead: new THREE.BoxGeometry(0.52, 0.13, 0.28),
  lampBase: new THREE.CylinderGeometry(0.2, 0.24, 0.3, 8),
  lampHalo: new THREE.SphereGeometry(0.95, 8, 6),

  railPost: new THREE.CylinderGeometry(0.035, 0.04, PROP.railHeight, 6),
  railBar: new THREE.BoxGeometry(1, 0.05, 0.05),

  benchSeat: new THREE.BoxGeometry(PROP.benchLength, 0.06, 0.46),
  benchBack: new THREE.BoxGeometry(PROP.benchLength, 0.36, 0.05),
  benchLeg: new THREE.BoxGeometry(0.06, PROP.benchSeatY, 0.4),

  binBody: new THREE.CylinderGeometry(0.26, 0.22, PROP.binHeight, 10),
  binLid: new THREE.CylinderGeometry(0.29, 0.29, 0.06, 10),

  bollard: new THREE.CylinderGeometry(0.08, 0.09, 0.9, 8),

  planterWall: new THREE.BoxGeometry(1, 0.45, 0.12),
  planterSoil: new THREE.BoxGeometry(1, 0.06, 1),

  fencePost: new THREE.BoxGeometry(0.1, PROP.fenceHeight, 0.1),
  fenceMesh: new THREE.BoxGeometry(2.4, PROP.fenceHeight - 0.3, 0.03),

  trunk: new THREE.CylinderGeometry(0.16, 0.26, 1, 7),
  canopyBall: new THREE.SphereGeometry(1, 8, 6),
  canopyCone: new THREE.ConeGeometry(1, 1, 8),
  shrub: new THREE.SphereGeometry(1, 6, 5),
};

/**
 * The kit's shared geometries, exposed so a caller that has HUNDREDS of one
 * fitting can instance it instead of mounting the component that many times.
 *
 * The components above are the right thing for the tens of props an entrance
 * or a food court places. They are the wrong thing for the park's street
 * lighting: a lamp is six meshes, the ring path and the perimeter road want
 * some five hundred lamps between them, and three thousand draw calls for the
 * street lighting is more than the whole rest of the park costs. Same
 * geometry, same materials, one InstancedMesh per part — see
 * `ParkEnvironment.tsx`.
 */
export const KIT_GEO = GEO;

export function LampPost({
  position,
  rotation = 0,
  double = false,
}: {
  position: [number, number, number];
  rotation?: number;
  double?: boolean;
}) {
  const arms = double ? [1, -1] : [1];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.lampBase} material={MAT.concreteDark} position={[0, 0.15, 0]} />
      <mesh geometry={GEO.lampPost} material={MAT.steelDark} position={[0, PROP.lampHeight / 2, 0]} castShadow />
      {arms.map((side) => (
        <group key={side} position={[side * 0.45, PROP.lampHeight - 0.15, 0]}>
          <mesh geometry={GEO.lampArm} material={MAT.steelDark} />
          <mesh geometry={GEO.lampHead} material={MAT.lampGlow} position={[side * 0.4, -0.1, 0]} />
          {/* Soft halo, standing in for bloom without a post-processing pass. */}
          <mesh geometry={GEO.lampHalo} material={MAT.lampHalo} position={[side * 0.4, -0.1, 0]} />
        </group>
      ))}
    </group>
  );
}

/** A run of queue barrier or handrail, `length` metres long. */
export function Railing({
  position,
  rotation = 0,
  length,
}: {
  position: [number, number, number];
  rotation?: number;
  length: number;
}) {
  const posts = useMemo(() => {
    const spacing = 1.6;
    const n = Math.max(2, Math.round(length / spacing));
    return Array.from({ length: n + 1 }, (_, i) => -length / 2 + (i * length) / n);
  }, [length]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {posts.map((x) => (
        <mesh key={x} geometry={GEO.railPost} material={MAT.steel} position={[x, PROP.railHeight / 2, 0]} />
      ))}
      {[PROP.railHeight - 0.05, PROP.railHeight * 0.45].map((y) => (
        <mesh key={y} geometry={GEO.railBar} material={MAT.steel} position={[0, y, 0]} scale={[length, 1, 1]} />
      ))}
    </group>
  );
}

export function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.benchSeat} material={MAT.wood} position={[0, PROP.benchSeatY, 0]} castShadow />
      <mesh geometry={GEO.benchBack} material={MAT.wood} position={[0, PROP.benchSeatY + 0.2, -0.2]} castShadow />
      {[-PROP.benchLength / 2 + 0.15, PROP.benchLength / 2 - 0.15].map((x) => (
        <mesh key={x} geometry={GEO.benchLeg} material={MAT.steelDark} position={[x, PROP.benchSeatY / 2, 0]} />
      ))}
    </group>
  );
}

export function Bin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={GEO.binBody} material={MAT.steelDark} position={[0, PROP.binHeight / 2, 0]} castShadow />
      <mesh geometry={GEO.binLid} material={MAT.steel} position={[0, PROP.binHeight + 0.03, 0]} />
    </group>
  );
}

export function Bollard({ position }: { position: [number, number, number] }) {
  return <mesh geometry={GEO.bollard} material={MAT.steelDark} position={[position[0], 0.45, position[2]]} />;
}

/** A raised planting bed, `w` by `d` metres. */
export function Planter({
  position,
  w,
  d,
  rotation = 0,
}: {
  position: [number, number, number];
  w: number;
  d: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.planterWall} material={MAT.concrete} position={[0, 0.225, d / 2]} scale={[w, 1, 1]} />
      <mesh geometry={GEO.planterWall} material={MAT.concrete} position={[0, 0.225, -d / 2]} scale={[w, 1, 1]} />
      <mesh
        geometry={GEO.planterWall}
        material={MAT.concrete}
        position={[-w / 2, 0.225, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[d, 1, 1]}
      />
      <mesh
        geometry={GEO.planterWall}
        material={MAT.concrete}
        position={[w / 2, 0.225, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[d, 1, 1]}
      />
      <mesh geometry={GEO.planterSoil} material={MAT.soil} position={[0, 0.4, 0]} scale={[w - 0.24, 1, d - 0.24]} />
      <mesh
        geometry={GEO.shrub}
        material={MAT.foliageMid}
        position={[0, 0.6, 0]}
        scale={[w * 0.36, 0.34, d * 0.36]}
        castShadow
      />
    </group>
  );
}

/** A run of perimeter fence, `length` metres long. */
export function Fence({
  position,
  rotation = 0,
  length,
}: {
  position: [number, number, number];
  rotation?: number;
  length: number;
}) {
  const bays = Math.max(1, Math.round(length / 2.4));
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: bays + 1 }, (_, i) => -length / 2 + (i * length) / bays).map((x) => (
        <mesh key={x} geometry={GEO.fencePost} material={MAT.steelDark} position={[x, PROP.fenceHeight / 2, 0]} />
      ))}
      {Array.from({ length: bays }, (_, i) => -length / 2 + ((i + 0.5) * length) / bays).map((x) => (
        <mesh
          key={x}
          geometry={GEO.fenceMesh}
          material={MAT.steel}
          position={[x, PROP.fenceHeight / 2, 0]}
          scale={[length / bays / 2.4, 1, 1]}
        />
      ))}
    </group>
  );
}

export type TreeKind = "broadleaf" | "conifer" | "palm" | "ornamental";

/**
 * A tree, at a real height in metres. Four silhouettes with per-instance
 * variation, so a planting never reads as the same object repeated.
 */
export function Tree({
  position,
  height,
  kind,
  seed = 0,
}: {
  position: [number, number, number];
  height: number;
  kind: TreeKind;
  seed?: number;
}) {
  const wobble = ((Math.sin(seed * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const lean = (wobble - 0.5) * 0.09;
  const foliage = [MAT.foliageDeep, MAT.foliageMid, MAT.foliageLight][Math.floor(wobble * 3) % 3];

  if (kind === "conifer") {
    const trunkH = height * 0.18;
    return (
      <group position={position} rotation={[lean, wobble * 6.2, 0]}>
        <mesh geometry={GEO.trunk} material={MAT.bark} position={[0, trunkH / 2, 0]} scale={[height * 0.05, trunkH, height * 0.05]} castShadow />
        {[0, 1, 2].map((i) => {
          const y = trunkH + height * (0.16 + i * 0.24);
          const r = height * (0.26 - i * 0.06);
          const h = height * (0.4 - i * 0.07);
          return (
            <mesh key={i} geometry={GEO.canopyCone} material={foliage} position={[0, y + h / 2, 0]} scale={[r, h, r]} castShadow />
          );
        })}
      </group>
    );
  }

  if (kind === "palm") {
    const trunkH = height * 0.72;
    return (
      <group position={position} rotation={[lean * 2, wobble * 6.2, 0]}>
        <mesh geometry={GEO.trunk} material={MAT.bark} position={[0, trunkH / 2, 0]} scale={[height * 0.035, trunkH, height * 0.035]} castShadow />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + wobble;
          return (
            <mesh
              key={i}
              geometry={GEO.canopyBall}
              material={foliage}
              position={[Math.cos(a) * height * 0.13, trunkH + height * 0.06, Math.sin(a) * height * 0.13]}
              scale={[height * 0.15, height * 0.035, height * 0.06]}
              rotation={[0, -a, 0.22]}
              castShadow
            />
          );
        })}
      </group>
    );
  }

  const trunkH = height * (kind === "ornamental" ? 0.32 : 0.42);
  const crown = height - trunkH;
  return (
    <group position={position} rotation={[lean, wobble * 6.2, 0]}>
      <mesh geometry={GEO.trunk} material={MAT.bark} position={[0, trunkH / 2, 0]} scale={[height * 0.045, trunkH, height * 0.045]} castShadow />
      <mesh
        geometry={GEO.canopyBall}
        material={foliage}
        position={[0, trunkH + crown * 0.42, 0]}
        scale={[height * 0.3, crown * 0.5, height * 0.29]}
        castShadow
      />
      <mesh
        geometry={GEO.canopyBall}
        material={foliage}
        position={[height * 0.08 * (wobble - 0.5), trunkH + crown * 0.72, height * 0.07 * (wobble - 0.5)]}
        scale={[height * 0.21, crown * 0.34, height * 0.2]}
        castShadow
      />
    </group>
  );
}

export function Shrub({ position, size, seed = 0 }: { position: [number, number, number]; size: number; seed?: number }) {
  const w = ((Math.sin(seed * 78.233) * 43758.5453) % 1 + 1) % 1;
  const foliage = [MAT.foliageDeep, MAT.foliageMid, MAT.foliageLight][Math.floor(w * 3) % 3];
  return (
    <mesh
      geometry={GEO.shrub}
      material={foliage}
      position={[position[0], size * 0.42, position[2]]}
      scale={[size * (0.8 + w * 0.4), size * 0.55, size * (0.8 + (1 - w) * 0.4)]}
      castShadow
    />
  );
}
