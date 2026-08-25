import { ExtrudeGeometry, Shape } from "three";
import { BULWARK_HEIGHT, HULL_WIDTH } from "./constants";

/**
 * Hull geometry for the Dragon Swing Ship.
 *
 * The hull is a genuinely boat-shaped extrusion, not a box: a side profile
 * (curved keel, upswept bow and stern) drawn in the shape plane and extruded
 * across the ship's beam, with bevelled edges so the timber reads as carved
 * rather than faceted.
 *
 * Shape space -> ship space:
 *   shape X -> ship Z (bow/stern), shape Y -> ship Y (up), extrusion -> ship X.
 * Each geometry below is pre-rotated and re-centred here so the components can
 * use it directly with no further transforms.
 */

function toShipSpace(geometry: ExtrudeGeometry, depth: number): ExtrudeGeometry {
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(depth / 2, 0, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/** Deck level is y = 0; the keel hangs below it. */
const HALF_LENGTH = 13;

function hullOutline(): Shape {
  const s = new Shape();
  s.moveTo(-HALF_LENGTH, 0);
  // Stern falls away to the keel.
  s.quadraticCurveTo(-HALF_LENGTH - 0.5, -1.6, -10.5, -2.9);
  // Long curved keel through midships.
  s.quadraticCurveTo(-6, -3.7, 0, -3.5);
  s.quadraticCurveTo(6, -3.7, 10.5, -2.9);
  // Bow rises back to deck level.
  s.quadraticCurveTo(HALF_LENGTH + 0.5, -1.6, HALF_LENGTH, 0);
  s.lineTo(-HALF_LENGTH, 0);
  return s;
}

/**
 * The gold band wrapping the bottom of the hull, as in the reference photo.
 * It traces exactly the same keel curve as the hull itself but is extruded
 * slightly wider, so it shows as a proud band along both sides and underneath
 * without ever poking through the timber above it.
 */
function keelBandOutline(): Shape {
  const s = new Shape();
  s.moveTo(-10.5, -2.9);
  s.quadraticCurveTo(-6, -3.7, 0, -3.5);
  s.quadraticCurveTo(6, -3.7, 10.5, -2.9);
  s.lineTo(10.5, -1.5);
  s.lineTo(-10.5, -1.5);
  s.lineTo(-10.5, -2.9);
  return s;
}

/**
 * Bulwark: the low side wall around the open deck, with a sheer line that
 * sweeps up at bow and stern. Low enough at midships that every seated
 * employee stays visible from outside the ship.
 */
function bulwarkOutline(): Shape {
  const s = new Shape();
  s.moveTo(-13.4, 0);
  s.lineTo(13.4, 0);
  s.lineTo(13.4, 3.6);
  s.quadraticCurveTo(8, 1.7, 2, BULWARK_HEIGHT);
  s.lineTo(-2, BULWARK_HEIGHT);
  s.quadraticCurveTo(-8, 1.7, -13.4, 3.6);
  s.lineTo(-13.4, 0);
  return s;
}

export const HULL_GEOMETRY = toShipSpace(
  new ExtrudeGeometry(hullOutline(), {
    depth: HULL_WIDTH,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.22,
    bevelSegments: 3,
    curveSegments: 24,
  }),
  HULL_WIDTH,
);

const KEEL_BAND_WIDTH = HULL_WIDTH + 0.34;
export const KEEL_BAND_GEOMETRY = toShipSpace(
  new ExtrudeGeometry(keelBandOutline(), {
    depth: KEEL_BAND_WIDTH,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.12,
    bevelSegments: 2,
    curveSegments: 24,
  }),
  KEEL_BAND_WIDTH,
);

const BULWARK_THICKNESS = 0.36;
export const BULWARK_GEOMETRY = toShipSpace(
  new ExtrudeGeometry(bulwarkOutline(), {
    depth: BULWARK_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.07,
    bevelSegments: 2,
    curveSegments: 20,
  }),
  BULWARK_THICKNESS,
);

export const BULWARK_INSET_X = HULL_WIDTH / 2 - BULWARK_THICKNESS / 2;
