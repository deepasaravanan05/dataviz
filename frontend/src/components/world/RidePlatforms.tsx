"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { RIDE_PLOTS } from "./paths";
import { MAT } from "./kit";
import { PARK_ORIGIN, RADIAL_PATH_WIDTH } from "@/components/park/parkRing";
import { rideById } from "@/components/park/layout";
import { CHAIRS_RIDE_NAME } from "@/components/flying-chairs/constants";
import { LOOPER_RIDE_NAME } from "@/components/super-looper/constants";
import { TEACUPS_RIDE_NAME } from "@/components/tea-cups/constants";
import { GIGA_RIDE_NAME } from "@/components/giga-coaster/constants";
import { DUMBO_RIDE_NAME } from "@/components/dumbo-ride/constants";

/**
 * THE RIDE PLATFORMS — ten identical circular plots, and ten identical
 * entrances.
 *
 * This is the piece that makes "same platform diameter, same surrounding
 * clearance, no ride larger or smaller than another" a thing you can SEE
 * rather than a number in a module. Every attraction in the park stands in the
 * middle of a paved disc of exactly the same size, ringed by the same kerb,
 * lit by the same eight lamps, and entered through the same gateway where its
 * radial path arrives.
 *
 * The machines themselves are ten different shapes and always will be — a
 * wheel is not a coaster — so what the plan equalises is the ground they stand
 * on. A small ride simply has more of its own platform showing, which is what
 * the landscaped bays and the seating on each plot are for.
 *
 * THE PAVING IS NOT DRAWN HERE. `paths.ts` publishes each plot as a path node
 * of the plot's radius, so the environment's paving layer already lays the
 * disc as part of one continuous surface running from the food court, down the
 * radial, and on to the boarding steps. What this adds is the kerb, the
 * entrance and the lighting — the things that make the disc read as a ride's
 * own ground.
 *
 * EVERY REPEATED PART IS INSTANCED. Ten gateways, eighty lamps and a hundred
 * and sixty bollards cost six draw calls between them.
 */

/** What each plot's gateway announces. */
const RIDE_NAMES: Record<string, string> = {
  teacups: TEACUPS_RIDE_NAME,
  giga: GIGA_RIDE_NAME,
  chairs: CHAIRS_RIDE_NAME,
  looper: LOOPER_RIDE_NAME,
  dumbo: DUMBO_RIDE_NAME,
};

function nameOf(id: string): string {
  /* The five department rides carry their name in the park layout; the other
     five publish their own. Neither is re-typed here. */
  return RIDE_NAMES[id] ?? rideById(id).label;
}

/* ------------------------------------------------------------------ *
 * PALETTE AND DIMENSIONS
 * ------------------------------------------------------------------ */

const KERB = new THREE.MeshStandardMaterial({ color: "#cbbfa6", roughness: 0.9 });
const KERB_EDGE = new THREE.MeshStandardMaterial({ color: "#8f846b", roughness: 0.95 });
/** The lit line round every platform: emissive surface, not a light source. */
const PLOT_GLOW = new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false });
const GATE_POST = new THREE.MeshStandardMaterial({ color: "#3c4351", roughness: 0.6, metalness: 0.4 });
const GATE_BEAM = new THREE.MeshStandardMaterial({ color: "#c22a3d", roughness: 0.7 });
const LAMP_GLOW = MAT.lampGlow;

/** The gateway, sized so the radial path passes cleanly through it. */
const GATE_SPAN = RADIAL_PATH_WIDTH + 6;
const GATE_HEIGHT = 9.5;
const GATE_POST_RADIUS = 0.6;
const GATE_BEAM_DEPTH = 1.1;

/** Lamps and bollards round each platform's edge. */
const LAMPS_PER_PLOT = 8;
const LAMP_HEIGHT = 8;
const BOLLARDS_PER_PLOT = 16;

/** One instanced mesh from a list of transforms. */
function useInstanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  items: { position: [number, number, number]; rotationY: number }[],
  castShadow = true,
) {
  return useMemo(() => {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(items.length, 1));
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(0, item.rotationY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = castShadow;
    mesh.count = items.length;
    return mesh;
  }, [geometry, material, items, castShadow]);
}

export function RidePlatforms() {
  /*
   * Every plot's furniture, gathered across all ten before anything is built,
   * so each KIND of part is one instanced mesh for the whole park rather than
   * one per plot.
   */
  const { posts, beams, lampPosts, lampHeads, bollards } = useMemo(() => {
    const posts: { position: [number, number, number]; rotationY: number }[] = [];
    const beams: { position: [number, number, number]; rotationY: number }[] = [];
    const lampPosts: { position: [number, number, number]; rotationY: number }[] = [];
    const lampHeads: { position: [number, number, number]; rotationY: number }[] = [];
    const bollards: { position: [number, number, number]; rotationY: number }[] = [];

    for (const plot of RIDE_PLOTS) {
      /* The gateway stands square across the radial, facing back down it. */
      const facing = (plot.bearingDeg * Math.PI) / 180;
      const [ex, ez] = plot.entrance;
      /* Perpendicular to the radius, which is the way the gateway spans. */
      const px = Math.cos(facing);
      const pz = -Math.sin(facing);

      for (const side of [-1, 1]) {
        posts.push({
          position: [ex + px * side * (GATE_SPAN / 2), GATE_HEIGHT / 2, ez + pz * side * (GATE_SPAN / 2)],
          rotationY: facing,
        });
      }
      beams.push({ position: [ex, GATE_HEIGHT + 0.2, ez], rotationY: facing });

      /*
       * Lamps and bollards round the platform edge, at the same count and the
       * same radius on every plot — the visible half of "same surrounding
       * clearance".
       */
      for (let i = 0; i < LAMPS_PER_PLOT; i++) {
        const a = (i / LAMPS_PER_PLOT) * Math.PI * 2 + facing;
        const r = plot.radius - 7;
        const x = plot.center[0] + Math.sin(a) * r;
        const z = plot.center[1] + Math.cos(a) * r;
        lampPosts.push({ position: [x, LAMP_HEIGHT / 2, z], rotationY: a });
        lampHeads.push({ position: [x, LAMP_HEIGHT + 0.45, z], rotationY: a });
      }
      for (let i = 0; i < BOLLARDS_PER_PLOT; i++) {
        const a = ((i + 0.5) / BOLLARDS_PER_PLOT) * Math.PI * 2 + facing;
        const r = plot.radius - 2.5;
        bollards.push({
          position: [
            plot.center[0] + Math.sin(a) * r,
            0.55,
            plot.center[1] + Math.cos(a) * r,
          ],
          rotationY: a,
        });
      }
    }
    return { posts, beams, lampPosts, lampHeads, bollards };
  }, []);

  const geo = useMemo(
    () => ({
      post: new THREE.CylinderGeometry(GATE_POST_RADIUS, GATE_POST_RADIUS * 1.25, GATE_HEIGHT, 10),
      beam: new THREE.BoxGeometry(GATE_SPAN + 2 * GATE_POST_RADIUS, 1.8, GATE_BEAM_DEPTH),
      lampPost: new THREE.CylinderGeometry(0.14, 0.2, LAMP_HEIGHT, 8),
      lampHead: new THREE.SphereGeometry(0.7, 10, 8),
      bollard: new THREE.CylinderGeometry(0.16, 0.2, 1.1, 8),
    }),
    [],
  );

  const postMesh = useInstanced(geo.post, GATE_POST, posts);
  const beamMesh = useInstanced(geo.beam, GATE_BEAM, beams);
  const lampPostMesh = useInstanced(geo.lampPost, MAT.steelDark, lampPosts);
  const lampHeadMesh = useInstanced(geo.lampHead, LAMP_GLOW, lampHeads, false);
  const bollardMesh = useInstanced(geo.bollard, GATE_POST, bollards, false);

  return (
    <group>
      {/*
        The kerb and the lit line round every platform. One ring each, at the
        same two radii on all ten — from the air this is what draws the ten
        equal circles the plan is built on.
      */}
      {RIDE_PLOTS.map((plot) => (
        <group key={plot.id} position={[plot.center[0], 0, plot.center[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
            <ringGeometry args={[plot.radius - 4, plot.radius, 84]} />
            <primitive object={KERB} attach="material" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
            <ringGeometry args={[plot.radius - 0.9, plot.radius, 84]} />
            <primitive object={KERB_EDGE} attach="material" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[plot.radius - 5.4, plot.radius - 4.6, 84]} />
            <primitive object={PLOT_GLOW} attach="material" />
          </mesh>
        </group>
      ))}

      <primitive object={postMesh} />
      <primitive object={beamMesh} />
      <primitive object={lampPostMesh} />
      <primitive object={lampHeadMesh} />
      <primitive object={bollardMesh} />

      {/*
        The name over each gateway, facing back down its own radial path — so
        the ride a path leads to is readable from the moment you leave the food
        court.
      */}
      {RIDE_PLOTS.map((plot) => {
        const inward = Math.atan2(
          PARK_ORIGIN[0] - plot.entrance[0],
          PARK_ORIGIN[1] - plot.entrance[1],
        );
        return (
          <Text
            key={plot.id}
            position={[plot.entrance[0], GATE_HEIGHT + 0.2, plot.entrance[1]]}
            rotation={[0, inward, 0]}
            fontSize={2.6}
            color="#fff3dd"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.07}
            /* Nudged just clear of the beam it is mounted on. */
            renderOrder={1}
          >
            {nameOf(plot.id).toUpperCase()}
            <meshBasicMaterial attach="material" color="#fff3dd" toneMapped={false} />
          </Text>
        );
      })}
    </group>
  );
}
