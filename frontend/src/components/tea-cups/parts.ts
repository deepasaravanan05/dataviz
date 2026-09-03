import * as THREE from "three";
import { PALETTE } from "./constants";

/**
 * Shared materials for the Tea Cups, and this ride's shadow budget.
 *
 * THE SHADOW RULE, kept by every ride in this park: a part casts only if its
 * shadow is legible from where the ride is seen. The ceiling, the plate, the
 * plinth and the cups do. Cornice scallops, lamp bulbs, hand wheels, rail
 * posts and saucers do not — they are drawn, and cost nothing in the shadow
 * map because they are not in it.
 *
 * The materials are shared for the same reason: six cups should not mean six
 * copies of the same handful of surfaces.
 */

function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness });
}
function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

export const MATERIAL = {
  canopyCream: paint(PALETTE.canopyCream, 0.5),
  canopyRose: paint(PALETTE.canopyRose, 0.46),
  cornice: metal(PALETTE.cornice, 0.75, 0.34),
  column: paint(PALETTE.column, 0.5),
  columnTrim: paint(PALETTE.columnTrim, 0.45),
  plinth: paint(PALETTE.plinth, 0.9),
  plinthTrim: paint(PALETTE.plinthTrim, 0.6),
  deck: paint(PALETTE.deck, 0.86),
  deckTrim: metal(PALETTE.deckTrim, 0.7, 0.4),
  rail: metal(PALETTE.rail, 0.4, 0.5),
  steel: metal(PALETTE.steel, 0.8, 0.35),
  steelDark: metal(PALETTE.steelDark, 0.75, 0.45),
  saucer: paint(PALETTE.saucer, 0.4),
  cushion: paint(PALETTE.cushion, 0.85),
  brass: metal(PALETTE.brass, 0.9, 0.3),
  /*
   * "RGB-LED light sources ... the color can be customized freely" is what the
   * manufacturer lights these with, so the lamps are emissive rather than lit:
   * a bulb reads as a bulb at noon as well as at dusk.
   */
  lamp: new THREE.MeshStandardMaterial({
    color: PALETTE.lamp,
    emissive: new THREE.Color(PALETTE.lamp),
    emissiveIntensity: 1.5,
    metalness: 0,
    roughness: 0.4,
  }),
} as const;

/** One glaze per cup, cached so six cups share six materials and no more. */
const glazeCache = new Map<string, THREE.MeshStandardMaterial>();
export function glazeMaterial(color: string): THREE.MeshStandardMaterial {
  let m = glazeCache.get(color);
  if (!m) {
    m = paint(color, 0.28);
    glazeCache.set(color, m);
  }
  return m;
}

/**
 * A torus is authored in the XY plane — standing up, facing +Z. Every ring on
 * this ride that is meant to lie FLAT is laid down by this rotation.
 */
export const LAY_FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

/** An annular slab — a ring with a hole in it — revolved from its own section. */
export function annulus(
  innerRadius: number,
  outerRadius: number,
  thickness: number,
  segments = 64,
): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(innerRadius, 0),
      new THREE.Vector2(outerRadius, 0),
      new THREE.Vector2(outerRadius, thickness),
      new THREE.Vector2(innerRadius, thickness),
      new THREE.Vector2(innerRadius, 0),
    ],
    segments,
  );
}
