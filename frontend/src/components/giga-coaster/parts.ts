import * as THREE from "three";
import { PALETTE } from "./constants";

/**
 * Shared materials for the Giga Coaster, and this ride's shadow budget.
 *
 * THE SHADOW RULE, kept by every ride in this park: a part casts only if its
 * shadow is legible from where the ride is seen. The rails, the spine and the
 * supports do — they are the ride's whole silhouette. Ties, wheels, harnesses
 * and handrails do not: they are centimetres of steel on a ride nine hundred
 * metres long, and there are hundreds of them.
 */

function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.08, roughness });
}
function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

export const MATERIAL = {
  rail: metal(PALETTE.rail, 0.9, 0.22),
  spine: paint(PALETTE.spine, 0.4),
  tie: paint(PALETTE.tie, 0.5),
  support: paint(PALETTE.support, 0.55),
  supportDark: paint(PALETTE.supportDark, 0.6),
  brace: paint(PALETTE.brace, 0.6),
  footing: paint(PALETTE.footing, 0.9),
  carBody: paint(PALETTE.carBody, 0.5),
  carTrim: paint(PALETTE.carTrim, 0.45),
  seatCushion: paint(PALETTE.seatCushion, 0.8),
  harness: metal(PALETTE.harness, 0.6, 0.4),
  wheel: paint(PALETTE.wheel, 0.9),
  deck: paint(PALETTE.deck, 0.85),
  deckTrim: paint(PALETTE.deckTrim, 0.5),
  canopy: paint(PALETTE.canopy, 0.6),
  station: paint(PALETTE.station, 0.85),
  rail_hand: metal("#cfd6de", 0.5, 0.45),
} as const;

/** One livery per car, cached so eight cars share three materials. */
const liveryCache = new Map<string, THREE.MeshStandardMaterial>();
export function liveryMaterial(color: string): THREE.MeshStandardMaterial {
  let m = liveryCache.get(color);
  if (!m) {
    m = paint(color, 0.42);
    liveryCache.set(color, m);
  }
  return m;
}
