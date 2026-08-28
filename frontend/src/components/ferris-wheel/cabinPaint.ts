import * as THREE from "three";
import { CABIN_COUNT } from "./constants";

/**
 * A COLOUR FOR EVERY BOX ON THE WHEEL — forty cabins, forty different colours.
 *
 * The wheel's steel stays the ride's blue. The gondolas hanging off it do not:
 * the user asked for each and every box to have its own colour, which is also
 * what a real fairground wheel looks like from the ground.
 *
 * TWO THINGS HAVE TO BE TRUE AT ONCE, and they pull against each other.
 *
 *  1. All forty colours should be as far apart as forty colours can be. The
 *     best any arrangement can do is an even sweep: 360 / 40 = 9 degrees
 *     between the closest pair, and nothing beats it.
 *  2. Boxes that hang NEXT to each other must not look alike. Walking that
 *     even sweep in order fails this badly — neighbours would be 9 degrees
 *     apart and the rim would read as one slow gradient.
 *
 * Both are satisfied by keeping the even sweep and visiting it out of order.
 * Box `i` takes hue slot `(i * STRIDE) mod 40`. Because STRIDE is coprime with
 * 40, every slot is used exactly once, so the closest pair anywhere is still
 * the theoretical best 9 degrees. Because STRIDE is just over half of 40,
 * consecutive boxes land almost opposite each other on the colour wheel — 171
 * degrees apart, near-complementary. `verify-ferris-wheel.ts` re-proves both
 * numbers rather than trusting this note.
 *
 * Saturation and lightness are fixed, so the forty read as one designed set
 * rather than forty unrelated paints, and so none of them can come out so pale
 * that it looks white or so dark that it looks black against the sky.
 */

/**
 * Step through the hue slots this many at a time. Must be coprime with
 * CABIN_COUNT so every slot is visited exactly once, and close to half of it
 * so consecutive boxes come out near-complementary. 21 against 40 is both.
 */
const STRIDE = 21;

const BODY_SATURATION = 0.62;
const BODY_LIGHTNESS = 0.52;
/** Roof, floor edge and corner posts: the same hue, deepened. */
const TRIM_LIGHTNESS = 0.31;

function hex(hue: number, saturation: number, lightness: number): string {
  return `#${new THREE.Color().setHSL(hue, saturation, lightness).getHexString()}`;
}

/** Hue of box `i`, as a fraction of a turn. */
export function cabinHue(index: number): number {
  return ((index * STRIDE) % CABIN_COUNT) / CABIN_COUNT;
}

/** The painted body of each box, indexed by the cabin's manifest index. */
export const CABIN_BODY: string[] = Array.from({ length: CABIN_COUNT }, (_, i) =>
  hex(cabinHue(i), BODY_SATURATION, BODY_LIGHTNESS),
);

/** Roof, floor rim and corner posts of each box — the body's hue, deepened. */
export const CABIN_TRIM: string[] = Array.from({ length: CABIN_COUNT }, (_, i) =>
  hex(cabinHue(i), BODY_SATURATION, TRIM_LIGHTNESS),
);

/**
 * The box at `index`, wrapping if a caller ever asks past the end so a cabin
 * can never render untextured black.
 */
export function cabinPaint(index: number): { body: string; trim: string } {
  const i = ((index % CABIN_COUNT) + CABIN_COUNT) % CABIN_COUNT;
  return { body: CABIN_BODY[i], trim: CABIN_TRIM[i] };
}
