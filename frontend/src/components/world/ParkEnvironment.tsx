"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PATH_LINKS, PATH_NODES } from "./paths";
import { BOUNDARY_TREES, PARK_SHRUBS, PARK_TREES, type Planting } from "./planting";
import { Bench, Bin, LampPost, MAT } from "./kit";
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
    mesh.receiveShadow = false;
    mesh.count = items.length;
    return mesh;
  }, [geometry, material, items, castShadow]);
}

const FOLIAGE = ["#2f5d33", "#3d7340", "#517f3f", "#446b38", "#5b8a45"].map((c) => new THREE.Color(c));

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
              <primitive object={MAT.paving} attach="material" />
            </mesh>
            {/* Kerb strips, so a path has an edge rather than fading into grass. */}
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]}
                position={[
                  l.from[0] + dx / 2 - (dz / length) * s * (l.width / 2 + 0.18),
                  0.055,
                  l.from[1] + dz / 2 + (dx / length) * s * (l.width / 2 + 0.18),
                ]}
              >
                <planeGeometry args={[length, 0.36]} />
                <primitive object={MAT.concrete} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}

      {PATH_NODES.map((n, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[n.at[0], 0.045, n.at[1]]} receiveShadow>
          <circleGeometry args={[n.radius, 26]} />
          <primitive object={MAT.paving} attach="material" />
        </mesh>
      ))}
    </group>
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

      if (t.species === "conifer") {
        const trunkH = t.height * 0.2;
        trunks.push({
          position: [t.x, trunkH / 2, t.z],
          scale: [t.height * 0.028, trunkH, t.height * 0.028],
          rotationY: rotY,
        });
        for (let i = 0; i < 3; i++) {
          const y = trunkH + t.height * (0.1 + i * 0.24);
          const r = t.height * (0.2 - i * 0.045);
          const h = t.height * (0.42 - i * 0.075);
          cones.push({ position: [t.x, y + h / 2, t.z], scale: [r, h, r], rotationY: rotY, color });
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
        balls.push({
          position: [t.x, trunkH + crown * 0.44, t.z],
          scale: [t.height * 0.26, crown * 0.55, t.height * 0.25],
          rotationY: rotY,
          color,
        });
        balls.push({
          position: [t.x + (wob - 0.5) * t.height * 0.1, trunkH + crown * 0.76, t.z + (0.5 - wob) * t.height * 0.09],
          scale: [t.height * 0.18, crown * 0.36, t.height * 0.17],
          rotationY: rotY,
          color,
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
          color: FOLIAGE[Math.floor(wob * FOLIAGE.length) % FOLIAGE.length],
        };
      }),
    [],
  );

  const geo = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.55, 1, 1, 6),
      ball: new THREE.SphereGeometry(1, 7, 5),
      cone: new THREE.ConeGeometry(1, 1, 7),
    }),
    [],
  );
  const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), []);

  const trunkMesh = useInstanced(geo.trunk, MAT.bark, trunks);
  const ballMesh = useInstanced(geo.ball, foliageMat, balls);
  const coneMesh = useInstanced(geo.cone, foliageMat, cones);
  const shrubMesh = useInstanced(geo.ball, foliageMat, shrubs, false);

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
        <planeGeometry args={[PROP.roadLaneWidth * 2 + 5, SPAWN_Z + 120 - GATE_Z]} />
        <primitive object={MAT.asphalt} attach="material" />
      </mesh>
      {/* Footway either side, so arrivals are not walking in the carriageway. */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[GATE_X + s * (PROP.roadLaneWidth + 4.6), 0.045, (GATE_Z + SPAWN_Z + 120) / 2]}
          receiveShadow
        >
          <planeGeometry args={[PROP.footpathWidth, SPAWN_Z + 120 - GATE_Z]} />
          <primitive object={MAT.paving} attach="material" />
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
      <StreetFurniture />
      <Vegetation />
      <Perimeter />
      <DistantLandscape />
    </group>
  );
}
