import * as THREE from "three";
import { PALETTE, RIM_LAMP_RADIUS } from "./constants";
import { SEAT_GREY, SEAT_METALNESS, SEAT_ROUGHNESS } from "@/world/seatColor";

/**
 * Shared materials and geometries, and this ride's shadow budget.
 *
 * THE SHADOW RULE, inherited from the Flying Chairs and for the same reason.
 * This park already carries six rides, a railway and three thousand plants,
 * and every shadow-casting mesh is a second full draw into the shadow map each
 * frame. A saucer of twenty-four seats over twenty-four skirt panels and
 * forty-eight lamp bosses is several hundred meshes; casting from all of them
 * costs far more than it shows.
 *
 * So a part casts only if its shadow is legible from where the ride is seen —
 * six hundred metres away, across the park. The A-frames, the arm, the hull
 * and the domes do. Skirt panels, lamp bosses, harnesses and bracing do not:
 * they sit flat against something that is already casting, so their own
 * shadows land inside its.
 *
 * The materials are shared for the same reason twenty-four identical seats
 * should not mean twenty-four copies of the same three materials.
 */

function metal(color: string, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function paint(color: string, roughness: number) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.08, roughness });
}

export const MATERIAL = {
  towerLight: paint(PALETTE.towerLight, 0.45),
  towerMid: paint(PALETTE.towerMid, 0.5),
  towerDark: paint(PALETTE.towerDark, 0.55),
  armLight: paint(PALETTE.armLight, 0.4),
  armMid: paint(PALETTE.armMid, 0.45),
  armDark: metal(PALETTE.armDark, 0.6, 0.5),
  steel: metal(PALETTE.steel, 0.8, 0.38),
  steelDark: metal(PALETTE.steelDark, 0.75, 0.45),
  hullTop: paint(PALETTE.hullTop, 0.35),
  hullUnder: paint(PALETTE.hullUnder, 0.45),
  rim: paint(PALETTE.rim, 0.3),
  /*
   * The dome reads as canopy glass rather than as a painted lid: a little
   * transparency and a low roughness is enough at this distance, and it keeps
   * the ride from looking like a mushroom.
   */
  domeGlass: new THREE.MeshStandardMaterial({
    color: PALETTE.domeGlass,
    metalness: 0.15,
    roughness: 0.12,
    transparent: true,
    opacity: 0.62,
  }),
  domeTrim: paint(PALETTE.domeTrim, 0.4),
  hub: metal(PALETTE.hub, 0.7, 0.45),
  pad: paint(PALETTE.pad, 0.95),
  /* The inside of the loading well: the same concrete, in shadow. */
  padWell: paint(PALETTE.padShadow, 0.98),
  padTrim: paint(PALETTE.padTrim, 0.7),
  /*
   * THE PARK'S OWN SEAT GREY, not a colour of this ride's choosing.
   *
   * Every seat pan in the park is this one grey, because seat colour means
   * something here — it used to be dealt from the delay bands — and a ride
   * that paints its pans its own shade muddies that. The LIVERY goes on the
   * back panel instead, which is decoration and reads as decoration.
   */
  seatCushion: new THREE.MeshStandardMaterial({
    color: SEAT_GREY,
    metalness: SEAT_METALNESS,
    roughness: SEAT_ROUGHNESS,
  }),
  seatFrame: metal(PALETTE.seatFrame, 0.55, 0.5),
  harness: metal(PALETTE.harness, 0.7, 0.35),
  lamp: new THREE.MeshStandardMaterial({
    color: PALETTE.lamp,
    emissive: new THREE.Color(PALETTE.lamp),
    emissiveIntensity: 1.3,
    metalness: 0,
    roughness: 0.4,
  }),
} as const;

export const GEOMETRY = {
  /** One lamp boss in the rim — forty-eight of these share this sphere. */
  rimLamp: new THREE.SphereGeometry(RIM_LAMP_RADIUS, 8, 6),
} as const;

/**
 * The saucer's painted liveries, one material per colour in the run.
 *
 * Cached so that twenty-four panels and twenty-four seats share a dozen
 * materials between them rather than making forty-eight of their own.
 */
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
 * A cylinder is authored standing up the Y axis and a torus lying in the XY
 * plane. The rim band and the pad's edge are HORIZONTAL hoops, so each is laid
 * flat by this rotation; omitting it does not tilt a hoop slightly, it leaves
 * a thirty-metre ring standing on edge through the middle of the saucer.
 */
export const LAY_FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
