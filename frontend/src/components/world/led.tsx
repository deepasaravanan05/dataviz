"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * The park's architectural lighting.
 *
 * Every light in this world is an emissive surface, not a light source. That
 * is a deliberate performance decision: a park with this much illumination
 * would need hundreds of dynamic lights, each one a full extra render pass for
 * shadows, and it would not run. Emissive geometry costs nothing per light,
 * survives any distance, and — because it is drawn rather than cast — it is
 * exactly what keeps the rides readable from the far overview.
 *
 * The chase animation runs entirely on the GPU. Each LED carries a `phase`
 * attribute for its position along the run, and the shader mixes two colours
 * and a travelling pulse against a single clock uniform. Animating ten
 * thousand LEDs therefore costs one uniform write per frame rather than ten
 * thousand matrix updates.
 */

export interface LedLook {
  /** The two colours the run mixes between. */
  colorA: string;
  colorB: string;
  /** Chase cycles per second. Kept slow — nothing here should strobe. */
  speed: number;
  /** How many colour cycles fit along the run. */
  cycles: number;
  /** Constant brightness floor, and how much the travelling pulse adds. */
  base: number;
  gain: number;
}

/**
 * One clock for every LED in the park.
 *
 * Each material references this same object, so animating the whole park's
 * lighting is a single number written once per frame rather than a uniform
 * write per light run. It also keeps every chase in phase with every other.
 */
const LED_TIME = { value: 0 };

interface LedUniforms {
  uTime: { value: number };
  uA: { value: THREE.Color };
  uB: { value: THREE.Color };
  uSpeed: { value: number };
  uCycles: { value: number };
  uBase: { value: number };
  uGain: { value: number };
}

function makeLedMaterial(look: LedLook, additive: boolean, opacity: number) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
    transparent: true,
    opacity,
    depthWrite: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    // Fog still applies, so distant lights haze into the night like real ones.
    fog: true,
  });

  const uniforms: LedUniforms = {
    uTime: LED_TIME,
    uA: { value: new THREE.Color(look.colorA) },
    uB: { value: new THREE.Color(look.colorB) },
    uSpeed: { value: look.speed },
    uCycles: { value: look.cycles },
    uBase: { value: look.base },
    uGain: { value: look.gain },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "attribute float aPhase;\nvarying float vPhase;\n" +
      shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vPhase = aPhase;");
    shader.fragmentShader =
      `uniform float uTime;
       uniform vec3 uA;
       uniform vec3 uB;
       uniform float uSpeed;
       uniform float uCycles;
       uniform float uBase;
       uniform float uGain;
       varying float vPhase;\n` +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         float wave = 0.5 + 0.5 * sin((vPhase * uCycles - uTime * uSpeed) * 6.2831853);
         // A narrow travelling crest on a steady base — a chase, never a strobe.
         float crest = pow(wave, 7.0);
         diffuseColor.rgb *= mix(uA, uB, wave) * (uBase + uGain * crest);`,
      );
  };

  return material;
}

/** Advances the shared LED clock. Mounted once for the whole park. */
export function LedClock() {
  useFrame((state) => {
    LED_TIME.value = state.clock.elapsedTime;
  });
  return null;
}

export interface LedStripProps {
  /** The run of lights, in the strip's parent space. */
  points: THREE.Vector3[];
  look: LedLook;
  /** Radius of each lamp, in metres. */
  size?: number;
  /** Draw a soft additive halo around each lamp — a cheap stand-in for bloom. */
  halo?: boolean;
  haloScale?: number;
}

/**
 * A run of LEDs along a path.
 *
 * The path comes from the ride's own geometry — its track curve, its rim
 * radius, its lattice bays — so the lighting explains the architecture rather
 * than sitting beside it.
 */
export function LedStrip({ points, look, size = 0.22, halo = true, haloScale = 3.4 }: LedStripProps) {
  const meshes = useMemo(() => {
    if (points.length === 0) return null;

    const phase = new Float32Array(points.length);
    for (let i = 0; i < points.length; i++) phase[i] = i / Math.max(points.length - 1, 1);
    const attribute = new THREE.InstancedBufferAttribute(phase, 1);

    const dummy = new THREE.Object3D();

    function build(radius: number, material: THREE.Material) {
      const geometry = new THREE.SphereGeometry(radius, 6, 5);
      geometry.setAttribute("aPhase", attribute);
      const mesh = new THREE.InstancedMesh(geometry, material, points.length);
      points.forEach((p, i) => {
        dummy.position.copy(p);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      // The runs wrap whole rides, so a per-instance bound is not worth the cost.
      mesh.frustumCulled = false;
      return mesh;
    }

    return {
      core: build(size, makeLedMaterial(look, false, 1)),
      glow: halo ? build(size * haloScale, makeLedMaterial(look, true, 0.22)) : null,
    };
  }, [points, look, size, halo, haloScale]);

  if (!meshes) return null;

  return (
    <group>
      <primitive object={meshes.core} />
      {meshes.glow && <primitive object={meshes.glow} />}
    </group>
  );
}

/** Evenly spaced points around a circle in the XZ plane, at height y. */
export function ringPoints(radius: number, count: number, y: number, cx = 0, cz = 0): THREE.Vector3[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return new THREE.Vector3(cx + Math.cos(a) * radius, y, cz + Math.sin(a) * radius);
  });
}

/** Evenly spaced points along a straight run. */
export function linePoints(
  from: [number, number, number],
  to: [number, number, number],
  count: number,
): THREE.Vector3[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    return new THREE.Vector3(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  });
}
