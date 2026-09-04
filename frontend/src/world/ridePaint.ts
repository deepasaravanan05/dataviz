/**
 * THE PAINT ON EACH RIDE'S STRUCTURE — one colour per ride, in one place.
 *
 * The park already gives every ride its own LED colour (see
 * `components/world/rideLighting.tsx`), but a light only reads at dusk. The
 * user asked for the rides themselves to be PAINTED a different colour each,
 * so that the Ferris Wheel is the blue ride and the Dragon Swing is the red
 * one at noon as well as at night.
 *
 * WHAT TAKES THE PAINT, and what does not. Only the ride's STRUCTURE is
 * painted — the steel lattice, the A-frames, the towers, the timber arches,
 * the station frame, the carriage chassis. The things that ride ON that
 * structure keep the colours they have always had: cars, cabins, gondolas,
 * the dragon and its hull, canopies, wheels, seats, restraints, and every
 * grey seat pan. Concrete pads, running rails and machinery stay unpainted
 * too, because that is what they are on a real ride.
 *
 * Three tones per ride rather than one, because a lattice needs a lit face, a
 * shaded face and a shadow line to read as three-dimensional at all. They are
 * the same hue at falling lightness, so a ride still reads as ONE colour.
 *
 * The hues are spaced around the wheel and `verify-night.ts` re-proves that
 * separation, so no two rides can drift into the same colour.
 */

export interface RidePaint {
  /** Lit faces: masts, main chords, the members that catch the sun. */
  light: string;
  /** Turned faces and secondary members. */
  mid: string;
  /** Bracing, joints and the shadow side. */
  dark: string;
}

export const RIDE_PAINT = {
  /** Ferris Wheel — blue, matching its blue/cyan LED run. */
  ferris: { light: "#2f8fd0", mid: "#2470a6", dark: "#17527a" },
  /** Roller Coaster — magenta, matching its blue/magenta LED run. */
  coaster: { light: "#d2409a", mid: "#a72f78", dark: "#7a2156" },
  /**
   * UFO Pendulum — purple, matching its purple/violet LED run.
   *
   * This is the Drop Tower's old slot, inherited whole when the pendulum
   * replaced it. The hue is kept rather than repicked because the park's six
   * identities were spaced around the wheel together: the pendulum's own
   * orange sits 12 degrees from the railway's amber and its saucer cyan a
   * degree from the Ferris Wheel's, so either would have collapsed a
   * separation the whole system depends on. The saucer keeps its seven-colour
   * skirt — that is where this ride's colour lives — and its STRUCTURE takes
   * the violet, which is exactly the split this module is for.
   */
  ufo: { light: "#7e4ad2", mid: "#6236a8", dark: "#46257a" },
  /** Dragon Swing Ship — red, matching its red/orange LED run. */
  dragon: { light: "#d93a2f", mid: "#ad2a21", dark: "#821e17" },
  /** Monster Ride — green, matching its green/teal LED run. */
  monster: { light: "#2fa35e", mid: "#237e48", dark: "#186033" },
  /*
   * The Park Train had an entry here — amber, held clear of the Dragon's red
   * on the hue wheel. The train and its track have been removed from the park,
   * so the paint has gone with them rather than being left for nothing to read.
   */
} as const satisfies Record<string, RidePaint>;

export type PaintedRideId = keyof typeof RIDE_PAINT;
