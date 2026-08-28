"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PATH_LINKS, PATH_NODES } from "./paths";
import { BOUNDARY_TREES, PARK_SHRUBS, PARK_TREES, type Planting } from "./planting";
import { Bench, Bin, LampPost, MAT } from "./kit";
import { BORDER_WIDTH, PAVER_BORDER, PAVER_SURFACE } from "./pavingMaterial";
import { GATE_X, GATE_Z, SPAWN_Z } from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";

/**
 * The park itself — the ground between the attractions.
 *
 * The audit that prompted this put a number on the problem: 96.3% of the park
 * was bare grass. Rides and a gate standing on an empty plane read as objects
 * on a lawn no matter how well modelled they are, because there is nothing
 * between them for the eye to measure distance against. This layer is that
 * something: paving under the routes people walk, planting graded from formal
 * at the entrance to woodland at the boundary, lighting and seating along the
 * main ways, a real perimeter, and a landscape beyond it.
 *
 * Everything is instanced. Two and a half thousand trees and shrubs cost four
 * draw calls, and the fence around the whole property costs two — so density
 * here is paid for in memory, once, rather than in frame time forever.
 *
 * ADD-ONLY: not one ride is moved, resized or recoloured. The planting is
 * rejection-sampled against the ride footprints, the rails, the paths, the
 * food court, the entrance and the department signs, so it fills the gaps
 * around the park exactly as it already stands.
 */

/** Builds one InstancedMesh from a list of transforms, with per-instance colour. */
function useInstanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  items: { position: [number, number, number]; scale: [number, number, number]; rotationY: number; color?: THREE.Color }[],
  castShadow = true,
  receiveShadow = false,
) {
  return useMemo(() => {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(items.length, 1));
    const dummy = new THREE.Object3D();
    const hasColor = items.some((i) => i.color);
    if (hasColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(items.length * 3), 3);
    }
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(0, item.rotationY, 0);
      dummy.scale.set(...item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (hasColor && item.color) mesh.setColorAt(i, item.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.count = items.length;
    return mesh;
  }, [geometry, material, items, castShadow, receiveShadow]);
}

/**
 * THE FOLIAGE PALETTE.
 *
 * Wider and considerably richer than the five near-olives that stood here: a
 * real planting runs from the blue-green of a cedar through mid park greens to
 * the yellow-green of new growth, and it is that SPREAD, more than any one
 * colour, that stops two thousand instances of the same geometry reading as
 * two thousand instances of the same geometry.
 */
const FOLIAGE = [
  "#1f4a22",
  "#24551f",
  "#2f6b28",
  "#356f3a",
  "#3d7d2f",
  "#4a8c36",
  "#57993f",
  "#2b6042",
].map((c) => new THREE.Color(c));

/**
 * Where a mass of leaves sits in the crown, as a multiplier on its tree's own
 * colour. The top of a canopy is lit; the underside is in the tree's own
 * shade. Baking that gradient into the per-instance colour buys the whole
 * crown a sense of form for nothing — no extra light, no extra draw call, and
 * no extra triangle.
 */
function shade(base: THREE.Color, lift: number): THREE.Color {
  return base.clone().multiplyScalar(lift);
}

/**
 * Knocks a generated primitive out of true.
 *
 * A canopy is not a sphere and a conifer is not a cone, and the giveaway is
 * always the silhouette: a perfect outline reads as a primitive however it is
 * coloured. Displacing the shared geometry's vertices along their own normals
 * by a little deterministic noise gives every instance a lumpy, organic edge —
 * and because the geometry is SHARED, the whole park pays for it once, in
 * memory, rather than per tree. Instances differ from one another by their own
 * rotation, which turns the same lumps to face different ways.
 */
function roughen(geometry: THREE.BufferGeometry, amount: number, seed: number): THREE.BufferGeometry {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const h = Math.sin((v.x * 12.9898 + v.y * 78.233 + v.z * 37.719 + seed) * 43758.5453);
    const k = 1 + ((h % 1) + 1) % 1 * amount - amount * 0.5;
    pos.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Paving laid along every stretch people actually walk. */
function Paving() {
  return (
    <group>
      {PATH_LINKS.filter((l) => l.surface === "paving").map((l, i) => {
        const dx = l.to[0] - l.from[0];
        const dz = l.to[1] - l.from[1];
        const length = Math.hypot(dx, dz);
        if (length < 0.5) return null;
        return (
          <group key={i}>
            <mesh
              rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]}
              position={[l.from[0] + dx / 2, 0.04, l.from[1] + dz / 2]}
              receiveShadow
            >
              <planeGeometry args={[length, l.width]} />
              <primitive object={PAVER_SURFACE} attach="material" />
            </mesh>
          </group>
        );
      })}

      {PATH_NODES.map((n, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[n.at[0], 0.045, n.at[1]]} receiveShadow>
          <circleGeometry args={[n.radius, 26]} />
          <primitive object={PAVER_SURFACE} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A CUT-STONE BORDER COURSE down both sides of every road.
 *
 * This used to be a broken white line, which is what an asphalt carriageway
 * has. The park is paved in brick now, and a brick walkway is edged the way the
 * reference is: a continuous band of larger, paler stone separating the
 * paving from the planting.
 *
 * It is a band and not a kerb — laid flush at the road's own level, a couple of
 * centimetres proud so it reads as a different course rather than a step, so
 * nobody has to walk around it or over it and every existing route is
 * unaffected. One InstancedMesh carries every border in the park, which is one
 * draw call for the whole edge treatment, as the dashes were.
 */
function RoadBorders() {
  const bands = useMemo(() => {
    const out: { x: number; z: number; angle: number; length: number }[] = [];
    for (const l of PATH_LINKS) {
      if (l.surface !== "paving") continue;
      const dx = l.to[0] - l.from[0];
      const dz = l.to[1] - l.from[1];
      const length = Math.hypot(dx, dz);
      if (length < 1) continue;
      const ux = dx / length;
      const uz = dz / length;
      /* Perpendicular, for stepping out to each edge. */
      const px = -uz;
      const pz = ux;
      /* Centred on the road's own edge, so half the band laps the paving and
         half laps the grass — which is what makes the transition read. */
      const offset = l.width / 2 - BORDER_WIDTH / 2;
      if (offset <= 0) continue;
      for (const side of [-1, 1]) {
        out.push({
          x: l.from[0] + ux * (length / 2) + px * side * offset,
          z: l.from[1] + uz * (length / 2) + pz * side * offset,
          angle: -Math.atan2(dz, dx),
          length,
        });
      }
    }
    return out;
  }, []);

  const matrices = useMemo(() => {
    const m = new THREE.Object3D();
    return bands.map((b) => {
      m.position.set(b.x, 0.055, b.z);
      m.rotation.set(-Math.PI / 2, 0, b.angle);
      /* One unit-length plane, stretched to each run. */
      m.scale.set(b.length, 1, 1);
      m.updateMatrix();
      return m.matrix.clone();
    });
  }, [bands]);

  if (!bands.length) return null;
  return (
    <instancedMesh
      args={[undefined, undefined, bands.length]}
      ref={(inst) => {
        if (!inst) return;
        matrices.forEach((mx, i) => inst.setMatrixAt(i, mx));
        inst.instanceMatrix.needsUpdate = true;
      }}
      receiveShadow
    >
      <planeGeometry args={[1, BORDER_WIDTH]} />
      <primitive object={PAVER_BORDER} attach="material" />
    </instancedMesh>
  );
}

/** Every tree in the park and the woodland beyond it, in four draw calls. */
function Vegetation() {
  const all = useMemo(() => [...PARK_TREES, ...BOUNDARY_TREES], []);

  const { trunks, balls, cones } = useMemo(() => {
    const trunks: Parameters<typeof useInstanced>[2] = [];
    const balls: Parameters<typeof useInstanced>[2] = [];
    const cones: Parameters<typeof useInstanced>[2] = [];

    for (const t of all as Planting[]) {
      const wob = ((Math.sin(t.seed * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const color = FOLIAGE[Math.floor(wob * FOLIAGE.length) % FOLIAGE.length];
      const rotY = wob * Math.PI * 2;

      /* A second, independent per-tree value, so shape and colour do not
         vary in lockstep and two trees of the same green are not twins. */
      const wob2 = ((Math.sin(t.seed * 39.371 + 4.1) * 24634.6345) % 1 + 1) % 1;

      if (t.species === "conifer") {
        const trunkH = t.height * 0.2;
        trunks.push({
          position: [t.x, trunkH / 2, t.z],
          scale: [t.height * 0.028, trunkH, t.height * 0.028],
          rotationY: rotY,
        });
        /* Four tiers rather than three, each turned against the one below and
           each a shade lighter than it — a conifer is dark underneath and
           catches the light on its crown. */
        const TIERS = 4;
        for (let i = 0; i < TIERS; i++) {
          const y = trunkH + t.height * (0.08 + i * 0.185);
          const r = t.height * (0.21 - i * 0.037) * (0.92 + wob2 * 0.16);
          const h = t.height * (0.4 - i * 0.058);
          cones.push({
            position: [t.x, y + h / 2, t.z],
            scale: [r, h, r],
            rotationY: rotY + i * 1.31,
            color: shade(color, 0.78 + (i / (TIERS - 1)) * 0.42),
          });
        }
      } else {
        const isOrn = t.species === "ornamental";
        const trunkH = t.height * (isOrn ? 0.34 : 0.44);
        const crown = t.height - trunkH;
        trunks.push({
          position: [t.x, trunkH / 2, t.z],
          scale: [t.height * (isOrn ? 0.02 : 0.03), trunkH, t.height * (isOrn ? 0.02 : 0.03)],
          rotationY: rotY,
        });
        /*
         * A crown of three masses instead of two, each its own size and each
         * turned its own way: the low shaded skirt, the main body, and a
         * smaller lit cap set off to one side. Three is where the outline
         * stops reading as a ball on a stick and starts reading as a tree.
         */
        balls.push({
          position: [t.x + (0.5 - wob2) * t.height * 0.09, trunkH + crown * 0.3, t.z + (wob2 - 0.5) * t.height * 0.08],
          scale: [t.height * 0.25, crown * 0.4, t.height * 0.24],
          rotationY: rotY + 2.2,
          color: shade(color, 0.72),
        });
        balls.push({
          position: [t.x, trunkH + crown * 0.52, t.z],
          scale: [t.height * 0.26, crown * 0.52, t.height * 0.25],
          rotationY: rotY,
          color,
        });
        balls.push({
          position: [t.x + (wob - 0.5) * t.height * 0.12, trunkH + crown * 0.82, t.z + (0.5 - wob) * t.height * 0.11],
          scale: [t.height * 0.18, crown * 0.34, t.height * 0.17],
          rotationY: rotY + 4.1,
          color: shade(color, 1.24),
        });
      }
    }
    return { trunks, balls, cones };
  }, [all]);

  const shrubs = useMemo(
    () =>
      PARK_SHRUBS.map((s) => {
        const wob = ((Math.sin(s.seed * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          position: [s.x, s.size * 0.4, s.z] as [number, number, number],
          scale: [s.size * (0.85 + wob * 0.4), s.size * 0.55, s.size * (0.85 + (1 - wob) * 0.4)] as [number, number, number],
          rotationY: wob * Math.PI * 2,
          /* Low planting sits in its own shade and in everything else's, so
             it runs darker than the canopy above it, and varies plant to
             plant rather than repeating one green down a whole border. */
          color: shade(
            FOLIAGE[Math.floor(wob * FOLIAGE.length) % FOLIAGE.length],
            0.74 + wob * 0.34,
          ),
        };
      }),
    [],
  );

  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.55, 1, 1, 7),
      /* Rounder than the seven-by-five it was — a five-band sphere shows its
         bands on anything close — and then knocked out of true, so the crown
         has an outline rather than a circumference. */
      ball: roughen(new THREE.SphereGeometry(1, 9, 7), 0.34, 1.7),
      cone: roughen(new THREE.ConeGeometry(1, 1, 9), 0.22, 5.3),
    }),
    [],
  );
  /*
   * Leaves are matt and scatter light, so the canopy takes a full-rough
   * material — and now RECEIVES shadow as well as casting it, which is what
   * lets a crown shade its own underside and one tree fall across the next.
   * A planting where every leaf is lit from every side is the flattest thing
   * in a park.
   */
  const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), []);

  const trunkMesh = useInstanced(geo.trunk, MAT.bark, trunks);
  const ballMesh = useInstanced(geo.ball, foliageMat, balls, true, true);
  const coneMesh = useInstanced(geo.cone, foliageMat, cones, true, true);
  const shrubMesh = useInstanced(geo.ball, foliageMat, shrubs, false, true);

  return (
    <group>
      <primitive object={trunkMesh} />
      <primitive object={ballMesh} />
      <primitive object={coneMesh} />
      <primitive object={shrubMesh} />
    </group>
  );
}

/** Lamps, benches and bins along the main ways. */
function StreetFurniture() {
  const items = useMemo(() => {
    const lamps: { p: [number, number, number]; r: number }[] = [];
    const benches: { p: [number, number, number]; r: number }[] = [];
    const bins: [number, number, number][] = [];

    for (const l of PATH_LINKS) {
      if (!l.furnished) continue;
      const dx = l.to[0] - l.from[0];
      const dz = l.to[1] - l.from[1];
      const length = Math.hypot(dx, dz);
      const ux = dx / length;
      const uz = dz / length;
      const nx = -uz;
      const nz = ux;
      const heading = Math.atan2(ux, uz);
      const spacing = 30;
      const n = Math.max(1, Math.floor(length / spacing));

      for (let i = 1; i < n; i++) {
        const t = (i / n) * length;
        const cx = l.from[0] + ux * t;
        const cz = l.from[1] + uz * t;
        const off = l.width / 2 + 1.4;
        lamps.push({ p: [cx + nx * off, 0, cz + nz * off], r: heading });
        lamps.push({ p: [cx - nx * off, 0, cz - nz * off], r: heading + Math.PI });
        if (i % 2 === 0) {
          benches.push({ p: [cx + nx * (off + 1.6), 0, cz + nz * (off + 1.6)], r: heading + Math.PI / 2 });
        }
        if (i % 3 === 0) bins.push([cx - nx * (off + 1.2), 0, cz - nz * (off + 1.2)]);
      }
    }
    return { lamps, benches, bins };
  }, []);

  return (
    <group>
      {items.lamps.map((l, i) => (
        <LampPost key={`l${i}`} position={l.p} rotation={l.r} />
      ))}
      {items.benches.map((b, i) => (
        <Bench key={`b${i}`} position={b.p} rotation={b.r} />
      ))}
      {items.bins.map((p, i) => (
        <Bin key={`n${i}`} position={p} />
      ))}
    </group>
  );
}

/** The property boundary: a real fence around the whole park, with a gap for the road. */
function Perimeter() {
  const { posts, panels } = useMemo(() => {
    const posts: Parameters<typeof useInstanced>[2] = [];
    const panels: Parameters<typeof useInstanced>[2] = [];
    const cx = 150;
    const cz = 250;
    const rx = 655;
    const rz = 735;
    const STEPS = 900;

    for (let i = 0; i < STEPS; i++) {
      const a = (i / STEPS) * Math.PI * 2;
      const x = cx + Math.cos(a) * rx;
      const z = cz + Math.sin(a) * rz;
      // Leave the arrival road open.
      if (Math.abs(x - GATE_X) < 52 && z > GATE_Z) continue;

      const an = ((i + 1) / STEPS) * Math.PI * 2;
      const nx = cx + Math.cos(an) * rx;
      const nz = cz + Math.sin(an) * rz;
      const heading = Math.atan2(nx - x, nz - z);
      const seg = Math.hypot(nx - x, nz - z);

      posts.push({ position: [x, PROP.fenceHeight / 2, z], scale: [1, 1, 1], rotationY: heading });
      panels.push({
        position: [(x + nx) / 2, PROP.fenceHeight / 2 - 0.12, (z + nz) / 2],
        scale: [seg / 2.4, 1, 1],
        rotationY: heading + Math.PI / 2,
      });
    }
    return { posts, panels };
  }, []);

  const geo = useMemo(
    () => ({
      post: new THREE.BoxGeometry(0.1, PROP.fenceHeight, 0.1),
      panel: new THREE.BoxGeometry(2.4, PROP.fenceHeight - 0.36, 0.04),
    }),
    [],
  );

  const postMesh = useInstanced(geo.post, MAT.steelDark, posts, false);
  const panelMesh = useInstanced(geo.panel, MAT.steel, panels, false);

  return (
    <group>
      <primitive object={postMesh} />
      <primitive object={panelMesh} />
    </group>
  );
}

/**
 * The land beyond the park.
 *
 * The park floor stays dead flat, and deliberately so: every ride, path and
 * walking route is built at ground level, and real parks are graded flat for
 * exactly the same reason. The elevation the eye needs to read distance goes
 * outside the fence instead — berms in the woodland band, then hills and a
 * hazy skyline out in the fog, so the horizon closes with landscape rather
 * than with an edge.
 */
function DistantLandscape() {
  const { berms, hills, skyline } = useMemo(() => {
    let a = 0x51dea1;
    const rand = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const berms: Parameters<typeof useInstanced>[2] = [];
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2 + rand() * 0.1;
      const r = 700 + rand() * 220;
      const w = 60 + rand() * 90;
      berms.push({
        position: [150 + Math.cos(ang) * r, -1.5, 250 + Math.sin(ang) * r],
        scale: [w, 5 + rand() * 9, w * (0.6 + rand() * 0.5)],
        rotationY: rand() * Math.PI,
      });
    }

    const hills: Parameters<typeof useInstanced>[2] = [];
    for (let i = 0; i < 46; i++) {
      const ang = (i / 46) * Math.PI * 2 + rand() * 0.14;
      const r = 1900 + rand() * 1500;
      const w = 420 + rand() * 700;
      hills.push({
        position: [150 + Math.cos(ang) * r, -14, 250 + Math.sin(ang) * r],
        scale: [w, 70 + rand() * 190, w * (0.7 + rand() * 0.6)],
        rotationY: rand() * Math.PI,
      });
    }

    // A city on the horizon, so the park sits somewhere rather than nowhere.
    const skyline: Parameters<typeof useInstanced>[2] = [];
    for (let cluster = 0; cluster < 4; cluster++) {
      const base = (cluster / 4) * Math.PI * 2 + 0.6;
      for (let i = 0; i < 34; i++) {
        const ang = base + (rand() - 0.5) * 0.55;
        const r = 2350 + rand() * 700;
        const h = 60 + rand() * 240;
        skyline.push({
          position: [150 + Math.cos(ang) * r, h / 2 - 6, 250 + Math.sin(ang) * r],
          scale: [26 + rand() * 46, h, 26 + rand() * 46],
          rotationY: rand() * Math.PI,
        });
      }
    }
    return { berms, hills, skyline };
  }, []);

  const geo = useMemo(
    () => ({
      mound: new THREE.SphereGeometry(0.5, 12, 7),
      block: new THREE.BoxGeometry(1, 1, 1),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      // Graded toward the fog colour with distance, which is what makes depth read.
      berm: new THREE.MeshStandardMaterial({ color: "#3f6b3a", roughness: 1 }),
      hill: new THREE.MeshStandardMaterial({ color: "#6d87a0", roughness: 1 }),
      city: new THREE.MeshStandardMaterial({ color: "#8ba2ba", roughness: 0.9 }),
    }),
    [],
  );

  const bermMesh = useInstanced(geo.mound, mats.berm, berms, false);
  const hillMesh = useInstanced(geo.mound, mats.hill, hills, false);
  const cityMesh = useInstanced(geo.block, mats.city, skyline, false);

  return (
    <group>
      <primitive object={bermMesh} />
      <primitive object={hillMesh} />
      <primitive object={cityMesh} />
    </group>
  );
}

/** The approach road employees arrive along, outside the gate. */
function ApproachRoad() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GATE_X, 0.03, (GATE_Z + SPAWN_Z + 120) / 2]} receiveShadow>
        <planeGeometry args={[PROP.roadLaneWidth * 2, SPAWN_Z + 120 - GATE_Z]} />
        <primitive object={PAVER_SURFACE} attach="material" />
      </mesh>
      {/*
        Footway either side, so arrivals are not walking in the carriageway.
        Its centre is derived from the carriageway edge — half the carriageway,
        plus a 0.1 m kerb gap, plus half the footway — so the two surfaces stay
        flush but never overlap, whatever the road width is set to.
      */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            GATE_X + s * (PROP.roadLaneWidth + 0.1 + PROP.footpathWidth / 2),
            0.045,
            (GATE_Z + SPAWN_Z + 120) / 2,
          ]}
          receiveShadow
        >
          <planeGeometry args={[PROP.footpathWidth, SPAWN_Z + 120 - GATE_Z]} />
          <primitive object={PAVER_SURFACE} attach="material" />
        </mesh>
      ))}
      {Array.from({ length: 22 }, (_, i) => GATE_Z + 40 + i * 20).map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[GATE_X, 0.05, z]}>
          <planeGeometry args={[0.16, 8]} />
          <primitive object={MAT.paint} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function ParkEnvironment() {
  return (
    <group>
      <ApproachRoad />
      <Paving />
      <RoadBorders />
      <StreetFurniture />
      <Vegetation />
      <Perimeter />
      <DistantLandscape />
    </group>
  );
}
