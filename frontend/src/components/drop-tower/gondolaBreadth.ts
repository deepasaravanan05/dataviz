/**
 * HOW BROAD THE DROP TOWER'S GONDOLA IS — the round thing that runs up and
 * down the mast.
 *
 * A leaf module on purpose. It imports nothing, so both `constants.ts` (which
 * draws the gondola) and `park/layout.ts` (which has to know the ride's
 * footprint to place it) can read the same numbers. `constants.ts` already
 * imports the layout for the tower's solved centre, so the footprint could not
 * live there without the two modules importing each other.
 *
 * The ride's height, its 77 m drop and its mast are untouched — the length of
 * the ride was never the problem. What was too small was the disc: a 22.4u
 * circle under a 105 m mast reads as a bead on a wire. Every radius of the
 * gondola is multiplied by ONE factor, so it grows as a single object and can
 * never end up with a canopy narrower than the seats it shelters.
 *
 * Two things follow from that, as consequences rather than choices:
 *
 *  - The boarding deck's outer edge tracks the gondola outward, so a rider
 *    still steps off the deck into a seat instead of over a drop. Its inner
 *    edge does not move, because that one is set by the foundation it has to
 *    clear, not by the gondola.
 *  - The ride's declared footprint follows too, so the park's layout keeps
 *    placing the tower by its true size.
 */

/** One factor for the whole disc. 1.35 takes it from 22.4u across to 30.2u. */
export const GONDOLA_BREADTH_SCALE = 1.35;

/** Inner collar clears the tower's diagonal (TOWER_HALF * sqrt(2) = 2.97). */
export const COLLAR_INNER_R = 3.5 * GONDOLA_BREADTH_SCALE;
export const COLLAR_OUTER_R = 4.6 * GONDOLA_BREADTH_SCALE;
/** Structural hoops of the spider. */
export const INNER_HOOP_R = 6.2 * GONDOLA_BREADTH_SCALE;
export const OUTER_HOOP_R = 9.9 * GONDOLA_BREADTH_SCALE;
/** Radius of the seat centres. */
export const SEAT_RING_R = 9.0 * GONDOLA_BREADTH_SCALE;
export const FOOTREST_R = 10.3 * GONDOLA_BREADTH_SCALE;
export const CANOPY_R = 11.2 * GONDOLA_BREADTH_SCALE;

/** Boarding deck: an annulus around the mast, clear of the foundation. */
export const STATION_INNER_R = 7.2;
export const STATION_OUTER_R = FOOTREST_R + 0.5;

/** Concrete pad the mast stands on. Unchanged — the gondola flies over it. */
export const FOUNDATION_RADIUS = 7.0;

/**
 * The ride's overall horizontal reach, derived from its widest part rather
 * than typed, so broadening the gondola can never leave it understated.
 */
export const TOWER_REACH = Math.max(FOUNDATION_RADIUS, STATION_OUTER_R, CANOPY_R) + 0.5;
