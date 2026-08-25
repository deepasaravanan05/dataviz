/**
 * Palette and dimensions for the roller coaster.
 *
 * Colors are sampled from the reference model "Roller Coaster" by FrankiArt
 * (Sketchfab, CC-BY 4.0) — pale seafoam-teal support lattice, gray running
 * rails over a teal spine with a yellow centre strip, mustard-yellow train
 * cars with gray bucket seats and cyan over-shoulder restraints, and a
 * dark-gray station with a flat teal roof.
 */
export const PALETTE = {
  rail: "#9ea4ab",
  railDark: "#6f757c",
  spine: "#2fb3b8",
  centreStrip: "#e8d94a",
  tie: "#33bfc4",
  support: "#93c7c7",
  supportDark: "#6ea8aa",
  carBody: "#d9d24f",
  carBodyDark: "#b3ad3e",
  seat: "#8d9299",
  seatDark: "#6b7076",
  restraint: "#3fc7d4",
  stationFrame: "#4a4f55",
  stationRoof: "#3fb3b8",
  stationColumn: "#3aa5aa",
  platform: "#a8a9a4",
} as const;

/** Track cross-section. */
export const RAIL_GAUGE = 1.5;
export const RAIL_RADIUS = 0.15;
export const SPINE_SIZE = 0.34;
export const TIE_SPACING = 1.35;

/** Number of samples used for rails, frames and support placement. */
export const TRACK_SEGMENTS = 900;

/** Train: 15 cars x 4 seats = the 60 seats the park concept requires. */
export const CAR_COUNT = 15;
export const SEATS_PER_CAR = 4;
export const SEAT_COUNT = CAR_COUNT * SEATS_PER_CAR;
export const CAR_LENGTH = 1.7;
/**
 * Spacing is measured along the arc, but neighbouring cars are separated by
 * the straight-line chord, which shortens through tight curvature. The loop
 * compresses the chord to roughly 63% of the arc spacing, so this must stay
 * comfortably above CAR_LENGTH / 0.63 to keep cars from intersecting there.
 */
export const CAR_SPACING = 2.95;

/** Fraction of the full circuit the train advances per second. */
export const TRAIN_SPEED = 0.035;

/** Supports are dropped roughly every this many samples where track is high. */
export const SUPPORT_EVERY = 34;
export const SUPPORT_MIN_HEIGHT = 2.2;

/** Where the coaster sits relative to the Ferris Wheel at the origin. */
export const COASTER_ORIGIN: [number, number, number] = [50, 0, 0];
