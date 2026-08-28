"use client";

import { Stars } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SKY_THEMES } from "./skyThemes";
import { useSkyThemeStore } from "@/store/skyThemeStore";

/**
 * The night sky.
 *
 * A gradient dome rather than a solid clear colour, because a flat background
 * gives the eye nothing to read distance against — the horizon is where a
 * world's scale is established. This one runs from a warm city glow at the
 * skyline, through deep navy, to near-black overhead, with the glow banked
 * toward the city clusters sitting out in the fog.
 *
 * The dome is unlit, unfogged and rendered first with depth writing off, so it
 * costs one draw call and can never occlude anything.
 */

const DOME_RADIUS = 5200;

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uHorizon;
  uniform vec3 uMid;
  uniform vec3 uZenith;
  uniform vec3 uGlow;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 1.15 + 0.06, 0.0, 1.0);

    // Two-stage gradient: the lower half carries most of the colour change,
    // which is how a real night sky reads.
    vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.30, h));
    sky = mix(sky, uZenith, smoothstep(0.22, 0.85, h));

    // A low, wide band of city light sitting on the horizon.
    float band = pow(1.0 - clamp(h * 4.2, 0.0, 1.0), 2.2);
    sky += uGlow * band * 0.55;

    gl_FragColor = vec4(sky, 1.0);
    #include <colorspace_fragment>
  }
`;

export function NightSky() {
  const theme = useSkyThemeStore((s) => s.theme);
  const cfg = SKY_THEMES[theme];

  /* Rebuilt per theme rather than mutated, so the dome can never be left
     holding half of one palette and half of another. */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: {
          uHorizon: { value: new THREE.Color(cfg.dome.horizon) },
          uMid: { value: new THREE.Color(cfg.dome.mid) },
          uZenith: { value: new THREE.Color(cfg.dome.zenith) },
          uGlow: { value: new THREE.Color(cfg.dome.glow) },
        },
      }),
    [cfg],
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(DOME_RADIUS, 32, 20), []);

  return (
    <group>
      <mesh geometry={geometry} material={material} renderOrder={-1000} frustumCulled={false} />

      {/*
        Stars sit well inside the dome and outside the fog's reach. Kept sparse
        and unsaturated — a real night sky over a lit park shows a scattering,
        not a planetarium.
      */}
      {cfg.stars && (
        <Stars radius={3200} depth={900} count={2600} factor={26} saturation={0} fade speed={0.35} />
      )}

      {/* The moon at night, the sun at either end of the day — same disc, and
          always the source the key light is matched to. */}
      <group position={cfg.orb.position}>
        <mesh>
          <sphereGeometry args={[78, 24, 18]} />
          <meshBasicMaterial color={cfg.orb.core} toneMapped={false} fog={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[190, 20, 14]} />
          <meshBasicMaterial
            color={cfg.orb.halo}
            transparent
            opacity={cfg.orb.haloOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      </group>
    </group>
  );
}
