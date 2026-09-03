/**
 * Park-wide scale configuration.
 *
 * The brief asked for every ride except the Drop Tower to become much larger,
 * while no ride is redesigned and none is shuffled around the map. Growing the
 * rides where they stand does not work: a numeric sweep of the existing layout
 * shows the Roller Coaster and the Monster Ride start intersecting at only
 * ~1.12x, because the gap between their footprints is 5.6u today.
 *
 * So the park is scaled homothetically instead — each ride's model AND its
 * distance from the park origin are multiplied by the same factor. That keeps
 * the layout map exactly as it was (identical bearings, identical ordering,
 * identical relative spacing) while every ride grows and the ground between
 * them grows to match, so clearances get larger rather than smaller.
 *
 * Applied as a single `<group scale>` wrapper in ParkScene, which means not one
 * line inside any existing ride's own module has to change: their geometry,
 * proportions, seat counts, colours and animations are all untouched.
 */

/**
 * How much larger every ride except the Drop Tower becomes.
 *
 * 1.7 puts the other attractions in the Drop Tower's league without letting any
 * of them overtake it as the park's landmark:
 *   Drop Tower ...... 62.0u (unchanged, the reference)
 *   Dragon Ride ..... 34.0 -> 57.8u
 *   Ferris Wheel .... 29.5 -> 50.2u
 *   Roller Coaster .. 25.6 -> 43.5u peak
 *   Monster Ride .... 13.0 -> 22.1u tower
 */
/*
 * 2.0 is the largest enlargement that keeps every ride at its exact existing
 * centre with the layout solver's 30 m minimum still satisfied — the binding
 * pair is the Roller Coaster and the Monster Ride, which run out of room at
 * 2.03. Going further would make the solver push rides apart, and the brief is
 * explicit that ride positions must not change. scripts/verify-night.ts
 * re-proves both the headroom and the fixed centres.
 */
export const PARK_SCALE = 2.0;

/**
 * The park train's loop is scaled harder than the rides it circles.
 *
 * Spreading the attractions far enough apart to give each one a clear visual
 * zone needs more ground than the 1.7x loop encloses, so the loop (and the
 * train riding it, which must scale with its own rails) grows further. The
 * train keeps its proportion to the track exactly as before.
 *
 * 4.6 -> 7.9 BECAUSE THE RIDES GREW. Every ride in the park is now built to one
 * common height, which grew their footprints with them, and at 4.6 the loop no
 * longer went round the park — it went THROUGH the Ferris Wheel, whose box
 * reached the rails exactly. Separating the enlarged silhouettes then spread
 * the fan wider still. 7.9 is the smallest scale at which the loop encircles
 * all five solver-placed rides and clears every one of them by thirty metres;
 * it is solved against the layout rather than chosen, and
 * `verify-park-train.ts` re-measures it.
 *
 * The loop is the only thing that moves here. Ride positions come from the
 * layout solver, and the railway is fitted around them, never the other way
 * about.
 */
export const TRAIN_SCALE = 7.9;

/**
 * "Three steps to the left" for the Drop Tower, in world units.
 *
 * A pedestrian pace is ~0.75u, so three steps is 2.25u — a nudge, not a
 * relocation. Left is -X, matching the park's default viewpoint looking in
 * from the +Z entrance side.
 */
export const PEDESTRIAN_STEP = 0.75;
export const TOWER_STEPS_LEFT = 3;
export const TOWER_SHIFT_X = -PEDESTRIAN_STEP * TOWER_STEPS_LEFT;

/** Scale a world point by the park factor (used for camera framing and checks). */
export function scalePoint(p: readonly [number, number, number]): [number, number, number] {
  return [p[0] * PARK_SCALE, p[1] * PARK_SCALE, p[2] * PARK_SCALE];
}

/** Scale a scalar distance by the park factor. */
export function scaleLength(v: number): number {
  return v * PARK_SCALE;
}
