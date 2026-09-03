import * as THREE from "three";
import { PALETTE } from "./constants";

/**
 * Shared materials and geometry for the Dumbo Ride, and this ride's shadow
 * budget.
 *
 * SIXTEEN OF EVERYTHING is what makes this ride's costs different from its
 * neighbours': sixteen elephants, each with four legs, two ears, a trunk, two
 * eyes and a howdah. So the materials are made once and shared, and only the
 * parts whose shadow is legible from where this ride is seen — the bodies, the
 * howdahs, the arms, the canopy, the column and the plinth — cast at all. Ears,
 * eyes, tusks, lamps, valance scallops and rails are drawn and cost nothing in
 * the shadow map.
 */

function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness });
}
function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

export const MATERIAL = {
  hide: paint(PALETTE.hide, 0.72),
  hideShade: paint(PALETTE.hideShade, 0.74),
  ear: paint(PALETTE.ear, 0.68),
  eye: paint(PALETTE.eye, 0.3),
  pupil: paint(PALETTE.pupil, 0.35),
  howdahTrim: metal(PALETTE.howdahTrim, 0.8, 0.32),
  cushion: paint(PALETTE.cushion, 0.85),
  canopyCream: paint(PALETTE.canopyCream, 0.5),
  canopyRed: paint(PALETTE.canopyRed, 0.48),
  valance: metal(PALETTE.valance, 0.7, 0.36),
  column: paint(PALETTE.column, 0.5),
  columnTrim: paint(PALETTE.columnTrim, 0.46),
  steel: metal(PALETTE.steel, 0.8, 0.35),
  steelDark: metal(PALETTE.steelDark, 0.75, 0.45),
  plinth: paint(PALETTE.plinth, 0.9),
  plinthTrim: paint(PALETTE.plinthTrim, 0.6),
  deck: paint(PALETTE.deck, 0.86),
  brass: metal(PALETTE.brass, 0.9, 0.3),
  /* The lamps read as lamps at noon as well as at dusk, which is why they are
     emissive rather than lit — this ride adds no lights of its own. */
  lamp: new THREE.MeshStandardMaterial({
    color: PALETTE.lamp,
    emissive: new THREE.Color(PALETTE.lamp),
    emissiveIntensity: 1.5,
    metalness: 0,
    roughness: 0.4,
  }),
} as const;

/** One livery per howdah, cached so sixteen howdahs share five materials. */
const liveryCache = new Map<string, THREE.MeshStandardMaterial>();
export function liveryMaterial(color: string): THREE.MeshStandardMaterial {
  let m = liveryCache.get(color);
  if (!m) {
    m = paint(color, 0.42);
    liveryCache.set(color, m);
  }
  return m;
}

/**
 * A torus is authored standing up, in the XY plane; this lays one flat. A
 * LATHE does not need it — it is revolved about Y and comes out flat already,
 * which is worth saying because rotating one "flat" stands it on its edge, and
 * for a while the gallery deck on this ride was a six-metre wall.
 */
export const LAY_FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

/** An annular slab — a ring with a hole in it — revolved from its section. */
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
