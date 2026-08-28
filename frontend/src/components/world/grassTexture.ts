import * as THREE from "three";

/**
 * THE LAWN.
 *
 * The park's ground was one 14 km plane painted a single flat colour. A flat
 * colour is the one thing real grass never is: a lawn is thousands of blades
 * lying at every angle, in a spread of greens, clumped into patches that catch
 * the light differently — and with none of that, the surface reads as painted
 * card, whatever colour it is painted.
 *
 * So the surface is generated rather than tinted. Two maps are built once, in
 * the browser, from a value-noise field:
 *
 *   - a COLOUR map carrying blade streaks, patch mottling and a spread of
 *     greens from dry yellow-green to lush blue-green;
 *   - a matching NORMAL map derived from the same height field, so the low sun
 *     actually rakes across the blades instead of lighting a mirror-flat sheet.
 *
 * The colour map averages to one in luminance, so multiplying it by a theme's
 * grass colour lands on that colour and varies around it. The theme therefore
 * still owns the value and the mood — sunset, sunrise and night all keep their
 * own ground — while the texture owns the material.
 *
 * Nothing is fetched. There is no image file, no CDN, no loader and no
 * suspense boundary: the maps are drawn into an offscreen canvas at module
 * level on first use and cached, which costs a few milliseconds once.
 *
 * The generator is deterministic — the same lawn comes back on every reload,
 * exactly as the planting does.
 */

/** How much ground one tile of the texture covers, in metres. */
export const GRASS_TILE_METRES = 24;

/** Texture resolution. 1024 over 24 m is ~43 px per metre — blade scale. */
const SIZE = 1024;

/** Strength of the blade relief. High enough to catch a low sun, not to churn. */
export const GRASS_NORMAL_SCALE = 0.85;

export interface GrassMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
}

/* ------------------------------------------------------------------ */
/* Deterministic value noise.                                          */
/* ------------------------------------------------------------------ */

function hash2(x: number, y: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Smoothstep, so the noise has no visible lattice. */
const fade = (t: number) => t * t * (3 - 2 * t);

/**
 * Value noise on a WRAPPING lattice. Wrapping is what lets the tile repeat
 * across 14 km without a seam down every edge.
 */
function noise(x: number, y: number, period: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const wrap = (v: number) => ((v % period) + period) % period;
  const xa = wrap(x0);
  const xb = wrap(x0 + 1);
  const ya = wrap(y0);
  const yb = wrap(y0 + 1);
  const n00 = hash2(xa, ya);
  const n10 = hash2(xb, ya);
  const n01 = hash2(xa, yb);
  const n11 = hash2(xb, yb);
  return (
    n00 * (1 - fx) * (1 - fy) + n10 * fx * (1 - fy) + n01 * (1 - fx) * fy + n11 * fx * fy
  );
}

/** Several octaves of the above, still wrapping. */
function fbm(x: number, y: number, cells: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * cells * freq, y * cells * freq, cells * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/* ------------------------------------------------------------------ */
/* The lawn itself.                                                    */
/* ------------------------------------------------------------------ */

/**
 * The height field the colour and the normals are both read from.
 *
 * Three scales, because a lawn has three:
 *   BLADES  — very high frequency, stretched along one axis so the grain runs
 *             the way cut grass lies rather than reading as gravel.
 *   CLUMPS  — a metre or two across: the tufts and bald patches that make a
 *             lawn a surface rather than a fill.
 *   PATCHES — ten metres across: the broad lighter and darker sweeps that stop
 *             the tile from announcing itself when it repeats.
 */
function buildHeight(): { height: Float32Array; clump: Float32Array } {
  const height = new Float32Array(SIZE * SIZE);
  const clump = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      /* Stretched 4:1, so the grain lies down instead of speckling. */
      const blades = fbm(u * 4, v, 256, 2);
      const tufts = fbm(u, v, 48, 3);
      const patches = fbm(u, v, 6, 3);
      const i = y * SIZE + x;
      clump[i] = tufts * 0.55 + patches * 0.45;
      height[i] = blades * 0.56 + tufts * 0.29 + patches * 0.15;
    }
  }
  return { height, clump };
}

/**
 * Colour and normals from that field.
 *
 * The colour is written as a multiplier around one rather than as an absolute
 * green, so the theme's grass colour survives: the mean of the field is
 * measured and divided out, which guarantees `themeColour x map` averages to
 * the theme colour exactly. A standing green bias is folded in on top — the
 * blue channel held back, the green lifted — so the surface reads as grass
 * even under the night theme's near-neutral dark ground.
 */
function draw(): GrassMaps {
  const { height, clump } = buildHeight();

  let mean = 0;
  for (let i = 0; i < height.length; i++) mean += height[i];
  mean /= height.length;

  const colour = new Uint8ClampedArray(SIZE * SIZE * 4);
  const normal = new Uint8ClampedArray(SIZE * SIZE * 4);

  /** How far the lightest blade sits above the darkest, as a fraction. */
  const CONTRAST = 0.62;
  /**
   * The standing green bias, per channel.
   *
   * Not decoration: the park's key light is a low sun at `#ffb478`, and orange
   * light on green grass comes back olive — measured off a render, a lawn of
   * albedo #3c6a34 arrived on screen at rgb(65,61,17), with red and green
   * level. Holding the blue channel well back and lifting the green here
   * shifts the surface far enough into green to survive that light in all
   * three themes, without any theme having to carry a neon albedo.
   */
  const BIAS = [0.9, 1.08, 0.78];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      /* Centred on one: mean height renders the theme colour untouched. */
      const f = 1 + (height[i] - mean) * 2 * CONTRAST;

      /*
       * Hue rides the clump field: lush tufts pull towards blue-green, the
       * thin ground between them towards a dry yellow-green. This is the
       * difference between "green" and "grass".
       */
      const lush = clump[i] - 0.5;
      const r = f * BIAS[0] * (1 - lush * 0.26);
      const g = f * BIAS[1] * (1 + lush * 0.06);
      const b = f * BIAS[2] * (1 + lush * 0.34);

      const o = i * 4;
      colour[o] = r * 255;
      colour[o + 1] = g * 255;
      colour[o + 2] = b * 255;
      colour[o + 3] = 255;

      /* Central differences on the wrapped height field -> tangent normal. */
      const xl = height[y * SIZE + ((x - 1 + SIZE) % SIZE)];
      const xr = height[y * SIZE + ((x + 1) % SIZE)];
      const yu = height[((y - 1 + SIZE) % SIZE) * SIZE + x];
      const yd = height[((y + 1) % SIZE) * SIZE + x];
      const nx = (xl - xr) * 6;
      const ny = (yu - yd) * 6;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      normal[o] = ((nx / len) * 0.5 + 0.5) * 255;
      normal[o + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      normal[o + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      normal[o + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(colour, SIZE, SIZE, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.DataTexture(normal, SIZE, SIZE, THREE.RGBAFormat);

  for (const t of [map, normalMap]) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    /*
     * Anisotropy is what keeps a lawn seen at a grazing angle from turning
     * into moire at the horizon. Sixteen is the common hardware maximum and
     * is clamped by the renderer to whatever the device actually supports.
     */
    t.anisotropy = 16;
    t.needsUpdate = true;
  }

  return { map, normalMap };
}

let cached: GrassMaps | null = null;

/**
 * The shared lawn maps, built on first use.
 *
 * Returns null where there is no renderer to build for — server rendering —
 * so the caller falls back to the flat theme colour for that one pass and
 * picks the real surface up on hydration.
 */
export function grassMaps(): GrassMaps | null {
  if (typeof window === "undefined") return null;
  if (!cached) cached = draw();
  return cached;
}

/**
 * The same maps, repeated to cover a surface `metres` across. Textures share
 * their image data through `clone()`, so a second surface at a different size
 * costs a descriptor rather than another megabyte.
 */
export function grassMapsFor(metres: number): GrassMaps | null {
  const base = grassMaps();
  if (!base) return null;
  const repeat = Math.max(1, Math.round(metres / GRASS_TILE_METRES));
  const map = base.map.clone();
  const normalMap = base.normalMap.clone();
  for (const t of [map, normalMap]) {
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
  }
  return { map, normalMap };
}
