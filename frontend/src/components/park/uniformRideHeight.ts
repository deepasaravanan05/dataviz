import { OVERALL_HEIGHT as TEACUPS_HEIGHT } from "@/components/tea-cups/constants";

/**
 * ONE HEIGHT FOR EVERY RIDE IN THE PARK.
 *
 * "all the rides must be in a same size" — so every ride here is built to the
 * same overall height, and each one gets there by ONE uniform factor on its own
 * geometry rather than by being stretched. A ride's footprint therefore grows
 * with its height, which is why the layout solver re-places the five rides it
 * owns: making everything the same size is a change that needs room.
 *
 * THE HEIGHT IS THE RISK RIDE'S. The Tea Cups were built at twenty times the
 * manufacturer's machine at the user's request, and everything since has been
 * measured against them — the Giga Coaster's 127 m crest already reads out of
 * this same constant. Taking the tallest as the common height is also the only
 * choice that takes nothing away: levelling down would undo the 20x.
 *
 * It is imported rather than typed, so if the Tea Cups are ever rescaled the
 * whole park follows them instead of quietly falling out of step.
 */
export const UNIFORM_RIDE_HEIGHT = TEACUPS_HEIGHT;
