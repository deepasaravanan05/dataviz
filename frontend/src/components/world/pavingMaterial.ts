import * as THREE from "three";

/**
 * THE PARK'S PAVING: pale sandalwood pavers, laid in running bond.
 *
 * The roads used to be flat planes of one dark asphalt colour, which is what a
 * road looks like from four hundred metres and nothing at all from four. This
 * draws the actual paving — every brick its own tone, a recessed joint between
 * each one, and the wear that makes a laid surface read as laid.
 *
 * IN THE SHADER, NOT IN GEOMETRY. The park's path network is hundreds of metres
 * of thirty-metre carriageway; at a real 200 x 100 mm paver that is millions of
 * blocks, and instancing them would cost more than the rest of the scene put
 * together. The pattern is generated instead from the fragment's own WORLD
 * position, so:
 *
 *   - it costs one material and not one triangle;
 *   - it lines up across every link, node and junction automatically, because
 *     two stretches of road at the same world position get the same brick;
 *   - it has no seams, no UV layout and no texture to load;
 *   - and it keeps its detail at any distance the camera can reach, because it
 *     is evaluated per pixel rather than sampled from a fixed-resolution map.
 *
 * Depth comes from three things together: the joints are darker and narrow, the
 * normal is tilted away from each joint so a brick's edge catches the light like
 * a real chamfer, and the joints are rougher than the faces so they stay matte
 * while the brick takes a sheen. That is what stops it reading as a picture of
 * bricks printed on a plane.
 */

/* ------------------------------------------------------------------ */
/* The paver                                                           */
/* ------------------------------------------------------------------ */

/** A standard clay paver, in metres: 200 x 100, on a 12 mm joint. */
const PAVER_LENGTH = 0.2;
const PAVER_WIDTH = 0.1;
const JOINT = 0.012;

/**
 * The two ends of the paver's own colour range — SANDALWOOD.
 *
 * A pale, warm, slightly greyed beige rather than the red of clay brick: the
 * colour of sandalwood paste, which is what the walkway is asked to be. The
 * range between the two is what gives one paver a lighter face than its
 * neighbour, so the run reads as laid stone rather than as one flat tone.
 *
 * It sits much brighter than the terracotta it replaces, which matters in a
 * park lit mainly by its own architecture: a pale walkway carries the low sun
 * and the lamp light, so the roads stay legible after dusk instead of going to
 * shadow.
 */
const BRICK_LIGHT = "#d8c09b";
const BRICK_DARK = "#b1936e";
/** Sand-filled joint: a shade under the darkest paver, warm and never black. */
const JOINT_COLOUR = "#7d674c";

/** The border course and kerb: a cooler, paler cut stone. */
const STONE_LIGHT = "#8d8577";
const STONE_DARK = "#6e675c";
const STONE_JOINT = "#43403a";

function rgb(hex: string): string {
  const c = new THREE.Color(hex);
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
}

/**
 * The pattern, as GLSL. `bondOffset` is how far alternate courses are shifted:
 * a half brick is running bond, which is what the reference is laid in.
 */
function pavingChunk(opts: {
  length: number;
  width: number;
  light: string;
  dark: string;
  joint: string;
  bondOffset: number;
}): string {
  return /* glsl */ `
    float pavHash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    /* Which brick a world point falls on, and where inside it. */
    void pavCell(vec2 w, out vec2 cell, out vec2 local) {
      float row = floor(w.y / ${opts.width.toFixed(4)});
      float shift = mod(row, 2.0) * ${opts.bondOffset.toFixed(4)};
      float col = w.x / ${opts.length.toFixed(4)} - shift;
      cell = vec2(floor(col), row);
      local = vec2(fract(col), fract(w.y / ${opts.width.toFixed(4)}));
    }

    /* Metres from the nearest joint, in both directions. */
    vec2 pavJointDistance(vec2 local) {
      return vec2(
        min(local.x, 1.0 - local.x) * ${opts.length.toFixed(4)},
        min(local.y, 1.0 - local.y) * ${opts.width.toFixed(4)}
      );
    }
  `;
}

interface PavingOptions {
  length: number;
  width: number;
  light: string;
  dark: string;
  joint: string;
  bondOffset: number;
  roughness: number;
}

/**
 * A standard material that paints itself with paving.
 *
 * Built by patching the stock shader rather than writing one from scratch, so
 * the surface keeps every bit of the park's existing lighting: the same sun,
 * the same shadow map, the same environment, the same fog and the same tone
 * mapping. Nothing about the light rig changes.
 */
function pavingMaterial(o: PavingOptions): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: o.roughness,
    metalness: 0.02,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec3 vPavWorld;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vPavWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader =
      "varying vec3 vPavWorld;\n" +
      pavingChunk(o) +
      shader.fragmentShader
        /* Colour: the brick's own tone, darkening into the joint. */
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           vec2 pavC, pavL;
           pavCell(vPavWorld.xz, pavC, pavL);
           float pavH = pavHash(pavC);
           vec2 pavJ = pavJointDistance(pavL);
           float pavEdge = min(pavJ.x, pavJ.y);
           /* Sand joint, then a narrow shaded chamfer up onto the face. */
           float pavInJoint = smoothstep(0.0, ${JOINT.toFixed(4)}, pavEdge);
           float pavChamfer = smoothstep(${JOINT.toFixed(4)}, ${(JOINT * 3.2).toFixed(4)}, pavEdge);
           vec3 pavFace = mix(${rgb(o.dark)}, ${rgb(o.light)}, pavH);
           /* Every brick a little lighter or darker than its neighbour, and a
              touch of wear across the face so none of them is flat. */
           pavFace *= 0.9 + 0.2 * pavHash(pavC + 17.3);
           pavFace *= 0.94 + 0.06 * pavChamfer;
           diffuseColor.rgb *= mix(${rgb(o.joint)}, pavFace, pavInJoint);`,
        )
        /* Roughness: the joints stay matte while the faces take a sheen. */
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           roughnessFactor *= mix(1.12, 0.9 + 0.12 * pavH, pavChamfer);`,
        )
        /* Normal: tilted away from each joint, so a brick's edge catches the
           park's low sun the way a real chamfered paver does. */
        .replace(
          "#include <normal_fragment_begin>",
          `#include <normal_fragment_begin>
           float pavSlopeX = (pavL.x < 0.5 ? -1.0 : 1.0) * (1.0 - pavChamfer);
           float pavSlopeZ = (pavL.y < 0.5 ? -1.0 : 1.0) * (1.0 - pavChamfer);
           normal = normalize(normal + vec3(pavSlopeX, 0.0, pavSlopeZ) * 0.22);`,
        );
  };

  /* Two materials with different patterns must not share a compiled program. */
  material.customProgramCacheKey = () =>
    `paving:${o.length}:${o.width}:${o.light}:${o.joint}:${o.bondOffset}`;

  return material;
}

/* ------------------------------------------------------------------ */
/* The two surfaces the park is paved in                               */
/* ------------------------------------------------------------------ */

/** The carriageway: sandalwood pavers in running bond. */
export const PAVER_SURFACE = pavingMaterial({
  length: PAVER_LENGTH,
  width: PAVER_WIDTH,
  light: BRICK_LIGHT,
  dark: BRICK_DARK,
  joint: JOINT_COLOUR,
  bondOffset: 0.5,
  roughness: 0.82,
});

/**
 * The border course down each edge: larger cut stone, laid square rather than
 * in bond, in a cooler grey a few shades under the sandalwood — enough to draw
 * the line between walkway and planting without standing up as a wall.
 */
export const PAVER_BORDER = pavingMaterial({
  length: 0.6,
  width: 0.4,
  light: STONE_LIGHT,
  dark: STONE_DARK,
  joint: STONE_JOINT,
  bondOffset: 0.0,
  roughness: 0.9,
});

/** How wide the stone border runs down each side of a road, in metres. */
export const BORDER_WIDTH = 1.4;
