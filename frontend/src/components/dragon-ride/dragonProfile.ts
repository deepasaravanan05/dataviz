import { CatmullRomCurve3, Vector3 } from "three";
import { ARM_LENGTH, HULL_LENGTH } from "./constants";

/**
 * THE CARVED DRAGON'S SHAPE, AND HOW FAR IT REACHES.
 *
 * The neck at the bow and the tail at the stern are the two longest things on
 * this ride, and both stick out well past the hull box the swing maths used to
 * measure. That mattered the moment the tail was given real length: the ride's
 * ground clearance and its distance from every neighbour are proved by sweeping
 * the swing, and a sweep that only knows about the hull would have declared a
 * clearance the dragon does not actually have.
 *
 * So both curves live here rather than inside their components, the extent they
 * occupy is DERIVED from them by sampling rather than typed in, and
 * `swingKinematics.ts` folds that extent into the swept envelope. Lengthen the
 * tail and the clearance checks tighten by themselves; there is no second number
 * to remember to update.
 *
 * Coordinates are HULL-LOCAL: the origin is the middle of the deck, +Z points
 * over the bow, +Y is up. The hull group hangs at y = -ARM_LENGTH below the
 * swing pivot, which is the one number needed to lift these into pivot space.
 */

/** Where the neck grows out of the deck, at the bow. */
export const NECK_MOUNT: [number, number, number] = [0, 1.1, 12.2];
/** Where the tail leaves the deck, at the stern. */
export const TAIL_MOUNT: [number, number, number] = [0, 0.9, -11.8];

/**
 * The neck: out of the stem post, up and forward in one continuous sweep, so
 * the ship and the dragon read as a single carved object rather than a prop
 * bolted to the bow.
 */
export const NECK_CURVE = new CatmullRomCurve3(
  [
    new Vector3(0, -1.4, -0.4),
    new Vector3(0, 0.6, 0.0),
    new Vector3(0, 2.8, 0.3),
    new Vector3(0, 4.9, 1.0),
    new Vector3(0, 6.7, 2.1),
    new Vector3(0, 7.9, 3.3),
  ],
  false,
  "catmullrom",
  0.5,
);

/**
 * The tail: out of the stern, down along the transom, then a long rearward
 * sweep that rises and curls forward over itself at the tip — the shape a real
 * carved dragon-ship stern takes, and the reason the tail now reads as an
 * animal's tail rather than a decorative scroll.
 *
 * It stays ABOVE the deck line for its whole length. A tail that dipped below
 * the keel would become the lowest point of the ride and eat the ground
 * clearance the hull was designed around.
 */
export const TAIL_CURVE = new CatmullRomCurve3(
  [
    new Vector3(0, 0.1, 0.9),
    new Vector3(0, 0.4, -1.3),
    new Vector3(0, 1.2, -3.3),
    new Vector3(0, 2.6, -4.9),
    new Vector3(0, 4.5, -5.7),
    new Vector3(0, 6.4, -5.3),
    new Vector3(0, 7.9, -3.9),
    new Vector3(0, 8.7, -2.1),
  ],
  false,
  "catmullrom",
  0.5,
);

/** How many body segments each curve is drawn with. */
export const NECK_SAMPLES = 22;
export const TAIL_SAMPLES = 26;

/** Thickest and thinnest the tail gets, root to tip. */
export const TAIL_ROOT_RADIUS = 1.16;
export const TAIL_TIP_RADIUS = 0.13;

/** Head: how far the muzzle runs forward of the skull centre. */
export const MUZZLE_LENGTH = 3.2;
/** Radius of the skull sphere, before its per-axis squash. */
export const SKULL_RADIUS = 0.98;
/** How far the head is pitched down over the water. */
export const HEAD_PITCH = -0.34;
/** Where the head mounts on the neck. */
export const HEAD_ANCHOR = NECK_CURVE.getPointAt(1);


/**
 * THE DRAGON AS A SET OF SPHERES, not as a box.
 *
 * A single bounding box round the whole carving is far too pessimistic. The box
 * would put the snout — which is nineteen units forward and eight units UP —
 * at the same height as the neck's root down on the deck, and the swing sweep
 * would then report a ground clearance the ride does not actually lose. The
 * error is not small: it costs about two units of headroom.
 *
 * So the carving is published as the spheres it is actually built from: a
 * centre and a radius per body segment, in SWING-PIVOT space. Every sphere is a
 * real part of the model, so a clearance proved over all of them is a clearance
 * the dragon really has, and it is proved where the dragon really is.
 *
 * x is omitted because the ship rotates about the pivot's X axis: x is
 * unchanged by the swing, and the ride's width is bounded separately by the
 * A-frame's foot spread.
 */
export interface DragonSphere {
  /** Height relative to the swing pivot (negative — the ship hangs below it). */
  y: number;
  /** Fore-and-aft position relative to the ship's centre; +Z is the bow. */
  z: number;
  radius: number;
}

function sampleCurve(
  curve: CatmullRomCurve3,
  mount: [number, number, number],
  samples: number,
  radiusAt: (u: number) => number,
): DragonSphere[] {
  return Array.from({ length: samples }, (_, i) => {
    const u = i / (samples - 1);
    const p = curve.getPointAt(u);
    return {
      y: -ARM_LENGTH + mount[1] + p.y,
      z: mount[2] + p.z,
      radius: radiusAt(u),
    };
  });
}

/** Neck body radius at parameter `u`: thick at the hull, slim at the throat. */
export function neckRadius(u: number): number {
  return 1.3 - 0.68 * Math.pow(u, 0.85);
}

/** Tail body radius at parameter `u`: thick at the rump, a point at the tip. */
export function tailRadius(u: number): number {
  return TAIL_ROOT_RADIUS - (TAIL_ROOT_RADIUS - TAIL_TIP_RADIUS) * Math.pow(u, 0.78);
}

/**
 * Every sphere the carving occupies: the neck, the tail, the skull, the muzzle
 * running forward from it, and the horns standing back over the crown.
 */
export const DRAGON_SPHERES: DragonSphere[] = (() => {
  const out: DragonSphere[] = [
    ...sampleCurve(NECK_CURVE, NECK_MOUNT, NECK_SAMPLES, neckRadius),
    ...sampleCurve(TAIL_CURVE, TAIL_MOUNT, TAIL_SAMPLES, tailRadius),
  ];

  /* The head, mounted on the neck's tip and pitched down over the water. Walk
     the muzzle forward along the pitched axis so the snout is measured where it
     actually hangs, not where a box would put it. */
  const headY = -ARM_LENGTH + NECK_MOUNT[1] + HEAD_ANCHOR.y;
  const headZ = NECK_MOUNT[2] + HEAD_ANCHOR.z;
  out.push({ y: headY, z: headZ, radius: SKULL_RADIUS * 1.15 });

  const MUZZLE_STEPS = 10;
  for (let i = 1; i <= MUZZLE_STEPS; i++) {
    const d = SKULL_RADIUS * 0.55 + (MUZZLE_LENGTH * i) / MUZZLE_STEPS;
    out.push({
      y: headY + d * Math.sin(HEAD_PITCH),
      z: headZ + d * Math.cos(HEAD_PITCH),
      radius: 0.72 - 0.3 * (i / MUZZLE_STEPS),
    });
  }

  /* Horns: swept back and up over the crown. */
  for (let i = 1; i <= 3; i++) {
    out.push({ y: headY + 0.5 * i, z: headZ - 0.62 * i, radius: 0.24 });
  }

  return out;
})();

/** Arc length of a curve, by sampling — what "the tail is N units long" means. */
function arcLength(curve: CatmullRomCurve3, samples = 400): number {
  let total = 0;
  let previous = curve.getPointAt(0);
  for (let i = 1; i <= samples; i++) {
    const p = curve.getPointAt(i / samples);
    total += p.distanceTo(previous);
    previous = p;
  }
  return total;
}

export const NECK_LENGTH = arcLength(NECK_CURVE);
export const TAIL_LENGTH = arcLength(TAIL_CURVE);

/** How far fore-and-aft the carving reaches from the ship's centre. */
export const DRAGON_Z_HALF = Math.max(
  ...DRAGON_SPHERES.map((s) => Math.abs(s.z) + s.radius),
);

/** True for the reason the module exists: the dragon outruns the hull box. */
export const DRAGON_OUTREACHES_HULL = DRAGON_Z_HALF > HULL_LENGTH / 2;
