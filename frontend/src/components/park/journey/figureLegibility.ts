import { EMPLOYEE_HEIGHT } from "@/world/scale";

/**
 * THE SIZE A PERSON HOLDS ON SCREEN.
 *
 * The park is 846 m across and is looked at from viewpoints 100 m to 900 m
 * back. A correctly-sized 1.75 m human at 900 m under the entrance page's 30°
 * lens covers about three pixels of a 813-pixel-tall viewport, so drawing the
 * cast at true scale from those viewpoints draws nothing a viewer can see —
 * which is exactly how a park with thirty people in it came to be reported as
 * having none.
 *
 * The park already solves this problem twice, for the two things that annotate
 * a person: the status marker grows with distance so it holds about nine
 * pixels, and the name plate grows so its ID line holds twelve. The PERSON was
 * the only one of the three still shrinking away. This module applies the same
 * rule to the figure itself.
 *
 * It is the projection equation solved for scale, not a tuned offset. A figure
 * of world height h at distance d, under a vertical field of view f, on a
 * viewport H pixels tall, covers
 *
 *     px(d) = h · H / (2 · d · tan(f/2))
 *
 * so holding it at `MIN_FIGURE_PX` needs
 *
 *     k(d) = MIN_FIGURE_PX · 2 · d · tan(f/2) / (h · H)
 *
 * clamped below at 1 — nobody is ever shrunk below true human scale — and
 * above at `MAX_FIGURE_SCALE`, past which a figure would start to read as a
 * giant rather than as a person far away.
 *
 * Both f and H come from the live camera and viewport, so one figure holds the
 * same apparent size on the entrance page's 30° lens and on the park's 46°
 * one, at any window size, with nothing hard-coded to a particular view.
 *
 * k is continuous and is exactly 1 for anyone close enough to see properly, so
 * walking a camera towards someone eases them back to true human scale rather
 * than popping them.
 */

/**
 * The smallest a person may appear, in pixels of standing height.
 *
 * Raised from 16 to 28, and now from 28 to 60.
 *
 * Sixteen pixels proved to be "visible" without being READABLE: you could tell
 * somebody was there, but not that they were a person walking. Twenty-eight
 * carried the silhouette, the gait and the shirt colour — but only where the
 * ceiling below did not bind first, and as the park grew it bound over more and
 * more of the ground. The user reported the figures as not visible at all, and
 * the measurement agreed: eleven pixels from the Full overview.
 *
 * At sixty pixels the face, the hair and the separate shirt, trousers and shoes
 * the rig has always carried finally resolve. The model was never the problem —
 * these figures have had eyes, brows, a nose, ears, six hair styles and tapered
 * skinned limbs throughout. They were simply being drawn too small to show any
 * of it.
 *
 * This is the only size knob there is, and deliberately so: it is expressed in
 * the units the requirement is actually about — how big a person looks — while
 * every employee stays exactly 1.75 m in the world, so nobody is out of scale
 * with the gate, the rides or the food court they are standing next to.
 */
export const MIN_FIGURE_PX = 60;

/**
 * THE CEILING, IN METRES RATHER THAN IN MULTIPLES.
 *
 * A figure being enlarged for legibility has to stop somewhere. The limit that
 * matters is a world height, so that is what is declared and the multiplier is
 * derived from it.
 *
 * IT IS NOW SET BY THE REQUIREMENT RATHER THAN BY TASTE. It used to be 10.5 m —
 * the most that could stand beside a ride without reading as a giant — and the
 * cost of that, recorded below in the old text, was that past about 570 m a
 * figure fell short of its target and reached 17.7 px at the far side of the
 * park. That cost turned out to be the whole complaint: the park's own Full
 * overview sits 915 m back, so the view a viewer lands on was the view the
 * ceiling hurt most.
 *
 * So it is now solved from the target instead. Holding MIN_FIGURE_PX at the
 * farthest viewpoint the park offers needs
 *
 *     h = MIN_FIGURE_PX · 2 · d · tan(f/2) / H
 *       = 60 · 2 · 915 · tan(23°) / 813
 *       = 57.3 m
 *
 * at that view's own lens and a reference 813-pixel viewport, so 58 m is the
 * smallest ceiling that meets the requirement everywhere. It is deliberately
 * not a metre higher: this is the figure at which a distant employee stops
 * being clipped, and any more would enlarge them for no gain in legibility.
 *
 * Stating it this way is what lets the drawn height of an employee change
 * without changing the size anybody holds on screen. The multiplier was 6 when
 * the figure was 1.75 units and 3 when it was 3.5; at 1.8 it is 5.83. In all
 * three cases the ceiling is the same 10.5 m, the distance at which the cap
 * starts to bind is the same, and `shownFigurePixels` returns the same number
 * at every distance and every lens.
 *
 * The cost is unchanged too: past about 570 m at the entrance lens the cap
 * binds and a figure falls short of the target, reaching 17.7 px at the far
 * side of the park rather than 28.
 */
export const FIGURE_CEILING_METRES = 58;

export const MAX_FIGURE_SCALE = FIGURE_CEILING_METRES / EMPLOYEE_HEIGHT;

/** Fallback lens, for the vanishingly unlikely non-perspective camera. */
export const DEFAULT_FIGURE_FOV = 46;

/** Pixels one world metre covers, at distance `d`, through this lens. */
export function pixelsPerMetre(distance: number, fovDegrees: number, viewportHeight: number): number {
  return viewportHeight / (2 * Math.max(distance, 1e-3) * Math.tan((fovDegrees * Math.PI) / 360));
}

/** How tall a true-scale person appears, in pixels, from `distance`. */
export function figurePixels(distance: number, fovDegrees: number, viewportHeight: number): number {
  return pixelsPerMetre(distance, fovDegrees, viewportHeight) * EMPLOYEE_HEIGHT;
}

/**
 * The scale a figure at `distance` must be drawn at to still read as a person.
 * 1 for anyone near enough, rising as `k(d)` above, capped.
 */
export function figureScale(distance: number, fovDegrees: number, viewportHeight: number): number {
  const px = figurePixels(distance, fovDegrees, viewportHeight);
  if (px >= MIN_FIGURE_PX) return 1;
  return Math.min(MAX_FIGURE_SCALE, MIN_FIGURE_PX / px);
}

/**
 * How tall the figure ACTUALLY appears once the scale above is applied. Equal
 * to `MIN_FIGURE_PX` everywhere the cap has not been reached, and to the true
 * projected size for anyone closer than that.
 */
export function shownFigurePixels(distance: number, fovDegrees: number, viewportHeight: number): number {
  return figurePixels(distance, fovDegrees, viewportHeight) * figureScale(distance, fovDegrees, viewportHeight);
}
