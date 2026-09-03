import * as THREE from "three";
import { PALETTE } from "./constants";

/**
 * Shared materials for the Super Looper, and this ride's shadow budget.
 *
 * THE SHADOW RULE, which every ride in this park keeps: a part casts only if
 * its shadow is legible from where the ride is seen. A 29 m loop, its spine,
 * the legs that hold it up and the chassis they stand on all do. Ties, rail
 * clips, lamp bulbs, harnesses and the tyres of the drive bank are centimetres
 * of steel and rubber: they are drawn, and they cost nothing in the shadow map
 * because they are not in it.
 *
 * The materials are shared for the same reason — fifteen identical cars should
 * not mean fifteen copies of the same handful of surfaces.
 */

function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.08, roughness });
}

export const MATERIAL = {
  loopOrange: paint(PALETTE.loopOrange, 0.42),
  loopWhite: paint(PALETTE.loopWhite, 0.45),
  rail: metal(PALETTE.rail, 0.9, 0.24),
  spine: paint(PALETTE.spine, 0.4),
  steel: metal(PALETTE.steel, 0.82, 0.34),
  steelDark: metal(PALETTE.steelDark, 0.76, 0.44),
  truss: paint(PALETTE.truss, 0.46),
  trussDark: paint(PALETTE.trussDark, 0.5),
  chassis: paint(PALETTE.chassis, 0.7),
  deck: paint(PALETTE.deck, 0.85),
  deckTrim: paint(PALETTE.deckTrim, 0.5),
  brass: metal(PALETTE.brass, 0.92, 0.28),
  carBody: paint(PALETTE.carBody, 0.55),
  seatCushion: paint(PALETTE.seatCushion, 0.8),
  harness: metal(PALETTE.harness, 0.6, 0.4),
  tyre: paint("#1b1b1f", 0.95),
  lamp: new THREE.MeshStandardMaterial({
    color: PALETTE.lamp,
    emissive: new THREE.Color(PALETTE.lamp),
    emissiveIntensity: 1.5,
    metalness: 0,
    roughness: 0.4,
  }),
} as const;

/**
 * The cars' liveries, one material per colour.
 *
 * Cached so that fifteen cars share four materials rather than making one
 * each.
 */
const liveryCache = new Map<string, THREE.MeshStandardMaterial>();
export function liveryMaterial(color: string): THREE.MeshStandardMaterial {
  let m = liveryCache.get(color);
  if (!m) {
    m = paint(color, 0.5);
    liveryCache.set(color, m);
  }
  return m;
}

/**
 * A cylinder laid between two points.
 *
 * The legs of this ride run diagonally in all three axes at once — out along
 * the loop's plane, back across it and up — so a pair of Euler angles is the
 * wrong tool and easy to get subtly wrong. Rotating the cylinder's own axis
 * onto the direction it has to lie in is the whole of it, and three's own
 * `setFromUnitVectors` does that exactly.
 */
export function member(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
): { position: [number, number, number]; quaternion: THREE.Quaternion; length: number } {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const length = dir.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return { position: [mid.x, mid.y, mid.z], quaternion, length };
}
