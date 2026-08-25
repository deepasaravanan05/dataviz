"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FOUNTAIN_CENTER, FOUNTAIN_RADIUS } from "@/components/park/layout";

/**
 * The central circular fountain — the landmark at the heart of the park.
 *
 * THE CENTRE OF THE PARK HOLDS NO RIDE. This water feature occupies the paved
 * plaza circle instead: three stacked basins on a stone core, with sheets of
 * falling water between them. Every walking route in the journey simulation
 * bends around it (see `fountainDetour` in the journey module), so the crowd
 * flows past the water on the plaza paving, exactly as the brief asks.
 *
 * Rendering follows the park's night rules: the water "glow" is emissive
 * surface and additive haze, never a new light source, and the palette is
 * restrained cool white/cyan — a calm landmark, not more neon. All animation
 * runs in the shader against one module clock, the same trick the LED system
 * uses, so fifty walkers and a waterfall cost one uniform write per frame.
 */

/** One clock for all the water, shared by every patched material. */
const WATER_TIME = { value: 0 };

/** Radii/heights of the three basins, from the ground pool upward. */
const POOL = { radius: FOUNTAIN_RADIUS, wall: 1.1, water: 0.85 };
const TIERS = [
  { radius: 8.5, y: 3.2 },
  { radius: 5.0, y: 5.6 },
  { radius: 2.6, y: 7.6 },
];

const STONE = new THREE.MeshStandardMaterial({ color: "#3a4048", roughness: 0.9, metalness: 0.08 });
const STONE_DARK = new THREE.MeshStandardMaterial({ color: "#2c3138", roughness: 0.95, metalness: 0.05 });
const WATER_SURFACE = new THREE.MeshStandardMaterial({
  color: "#0e2f3c",
  emissive: "#1997b8",
  emissiveIntensity: 0.5,
  roughness: 0.18,
  metalness: 0.1,
});
const RIM_GLOW = new THREE.MeshBasicMaterial({
  color: "#bfeef8",
  toneMapped: false,
  transparent: true,
  opacity: 0.5,
  fog: true,
});
const HAZE = new THREE.MeshBasicMaterial({
  color: "#2ab7d8",
  transparent: true,
  opacity: 0.05,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  fog: true,
});

/** A sheet of falling water: additive, scrolling downward in the shader. */
function makeWaterSheet(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    color: "#9adfef",
    toneMapped: false,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: true,
  });
  material.defines = { USE_UV: "" };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = WATER_TIME;
    shader.fragmentShader =
      "uniform float uTime;\n" +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float flow = fract(vUv.y * 3.0 + uTime * 0.55 + vUv.x * 9.0);
        float streak = smoothstep(0.1, 0.5, flow) * smoothstep(1.0, 0.55, flow);
        float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
        diffuseColor.rgb *= 0.55 + 1.1 * streak;
        diffuseColor.a *= edge * (0.35 + 0.65 * streak);`,
      );
  };
  return material;
}

const WATER_SHEET = makeWaterSheet();

const GEO = {
  poolWall: new THREE.CylinderGeometry(POOL.radius, POOL.radius + 0.4, POOL.wall, 48, 1, true),
  poolRim: new THREE.TorusGeometry(POOL.radius + 0.2, 0.32, 10, 48),
  poolWater: new THREE.CircleGeometry(POOL.radius - 0.5, 48),
  column: new THREE.CylinderGeometry(1.6, 2.4, TIERS[2].y, 24),
  disc: new THREE.CylinderGeometry(1, 1, 0.5, 40, 1, false),
  rimRing: new THREE.TorusGeometry(1, 0.09, 8, 40),
  sheet: new THREE.CylinderGeometry(1, 1, 1, 40, 1, true),
  haze: new THREE.SphereGeometry(1, 20, 14),
  finial: new THREE.SphereGeometry(0.7, 18, 12),
};

/** One raised basin: stone dish, water surface, glowing rim, falling sheet. */
function Tier({ radius, y, dropTo }: { radius: number; y: number; dropTo: number }) {
  const drop = y - dropTo;
  return (
    <group>
      <mesh geometry={GEO.disc} material={STONE} position={[0, y - 0.25, 0]} scale={[radius, 1, radius]} castShadow />
      <mesh geometry={GEO.disc} material={WATER_SURFACE} position={[0, y - 0.1, 0]} scale={[radius - 0.35, 0.5, radius - 0.35]} />
      <mesh geometry={GEO.rimRing} material={RIM_GLOW} position={[0, y, 0]} scale={[radius, radius, 1]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh
        geometry={GEO.sheet}
        material={WATER_SHEET}
        position={[0, y - drop / 2, 0]}
        scale={[radius - 0.15, drop, radius - 0.15]}
      />
    </group>
  );
}

export function Fountain() {
  useFrame((state) => {
    WATER_TIME.value = state.clock.elapsedTime;
  });

  return (
    <group position={[FOUNTAIN_CENTER[0], 0, FOUNTAIN_CENTER[1]]}>
      {/* Ground pool */}
      <mesh geometry={GEO.poolWall} material={STONE_DARK} position={[0, POOL.wall / 2, 0]} castShadow />
      <mesh geometry={GEO.poolRim} material={STONE} position={[0, POOL.wall, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={GEO.poolWater} material={WATER_SURFACE} position={[0, POOL.water, 0]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* Stone core and the three basins */}
      <mesh geometry={GEO.column} material={STONE_DARK} position={[0, TIERS[2].y / 2, 0]} castShadow />
      <Tier radius={TIERS[0].radius} y={TIERS[0].y} dropTo={POOL.water} />
      <Tier radius={TIERS[1].radius} y={TIERS[1].y} dropTo={TIERS[0].y} />
      <Tier radius={TIERS[2].radius} y={TIERS[2].y} dropTo={TIERS[1].y} />

      {/* Crown: a soft lit finial, and a cool haze over the falling water */}
      <mesh geometry={GEO.finial} material={RIM_GLOW} position={[0, TIERS[2].y + 0.6, 0]} />
      <mesh geometry={GEO.haze} material={HAZE} position={[0, 3.4, 0]} scale={[FOUNTAIN_RADIUS * 0.9, 4.6, FOUNTAIN_RADIUS * 0.9]} />
    </group>
  );
}
