import { CREST_Y, SUPPORT_FOOT_RADIUS } from "./constants";
import { TRACK_REACH } from "./trackCurve";
import { METRE } from "@/world/scale";

/**
 * WHAT THE RIDE OCCUPIES, which needs both halves of it.
 *
 * The height is the crest of the lift hill and the reach is the farthest the
 * track gets from the ride's own origin — one from the constants, one from the
 * finished curve. `trackCurve.ts` reads the constants, so the constants cannot
 * read it back without the two importing each other in a circle; this module
 * is where they meet, and it is what the park's placement, planting and camera
 * all ask for the ride's size.
 */

/** The top of the ride: the crest of the lift hill. */
export const OVERALL_HEIGHT = CREST_Y;

/**
 * Everything the ride claims on the ground, as a radius.
 *
 * The track's farthest point from the origin, plus the room a support's
 * splayed feet take beyond it. A circuit is a long flat thing and one radius
 * overstates it across its narrow way — but it is still the right figure for
 * placement, because it is what nothing else may stand inside, and taking the
 * larger of the two is the safe way round.
 */
export const OVERALL_REACH = TRACK_REACH + SUPPORT_FOOT_RADIUS + 2 * METRE;
