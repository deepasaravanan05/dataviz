import * as THREE from "three";
import { CHAIN_LINK_RADIUS, CHAIN_WIRE_RADIUS, PALETTE } from "./constants";

/**
 * Shared materials and geometries, and this ride's shadow budget.
 *
 * THE SHADOW RULE. This ride joins a park that already carries five rides, a
 * railway and three thousand plants, and every shadow-casting mesh is a second
 * full draw into the shadow map each frame. Twenty chairs of a dozen parts
 * each, on chains of thirty-odd links, is a thousand meshes; casting from all
 * of them is enough to stop the park pages producing a frame at all.
 *
 * So a part casts only if its shadow is legible from where the ride is seen —
 * five hundred metres away, behind a 126 m tower. The column, the canopy, the
 * chairs and the plinth do. Chain links, bolt heads, window trim, hand rails
 * and lamp bulbs do not: they are centimetres across, and their shadows cost a
 * draw each to contribute nothing.
 *
 * The geometries are shared for the same reason — twenty identical chairs
 * should not mean twenty copies of the same handful of shapes.
 */

function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness });
}

export const MATERIAL = {
  steel: metal(PALETTE.steel, 0.85, 0.32),
  steelDark: metal(PALETTE.steelDark, 0.8, 0.4),
  steelShadow: metal(PALETTE.steelShadow, 0.72, 0.5),
  brass: metal(PALETTE.brass, 0.94, 0.24),
  brassDark: metal(PALETTE.brassDark, 0.9, 0.32),
  canopyCream: paint(PALETTE.canopyCream, 0.5),
  canopyRed: paint(PALETTE.canopyRed, 0.45),
  valance: paint(PALETTE.valance, 0.42),
  seatBody: paint(PALETTE.seatBody, 0.5),
  seatCushion: paint(PALETTE.seatCushion, 0.85),
  seatTrim: metal(PALETTE.seatTrim, 0.9, 0.3),
  deck: paint(PALETTE.deck, 0.85),
  deckTrim: paint(PALETTE.deckTrim, 0.5),
  lamp: new THREE.MeshStandardMaterial({
    color: PALETTE.lamp,
    emissive: new THREE.Color(PALETTE.lamp),
    emissiveIntensity: 1.4,
    metalness: 0,
    roughness: 0.4,
  }),
} as const;

export const GEOMETRY = {
  /** One link of a suspension chain, drawn as a real torus. */
  chainLink: new THREE.TorusGeometry(CHAIN_LINK_RADIUS, CHAIN_WIRE_RADIUS, 5, 10),
  /** The eye a chain hangs from, and the shackle it ends in. */
  shackle: new THREE.TorusGeometry(CHAIN_LINK_RADIUS * 1.6, CHAIN_WIRE_RADIUS * 1.6, 6, 12),
} as const;

/**
 * A torus is authored in the XY plane — standing up, facing +Z. Every ring on
 * this machine is a HORIZONTAL band around the column, so each is laid flat by
 * this rotation. Omitting it does not tilt a ring slightly: it leaves a 40 m
 * hoop standing vertically straight through the ride.
 */
export const LAY_FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

/**
 * The chairs' painted back panels, one material per livery colour.
 *
 * Cached so that twenty chairs share seven materials rather than creating
 * twenty of their own.
 */
const panelCache = new Map<string, THREE.MeshStandardMaterial>();
export function panelMaterial(color: string): THREE.MeshStandardMaterial {
  let m = panelCache.get(color);
  if (!m) {
    m = paint(color, 0.6);
    panelCache.set(color, m);
  }
  return m;
}
