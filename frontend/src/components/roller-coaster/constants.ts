import { RIDE_SEAT_SCALE, loweredSeatMount } from "@/world/scale";
import { RIDE_PAINT } from "@/world/ridePaint";

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
  rail: RIDE_PAINT.coaster.light,
  railDark: RIDE_PAINT.coaster.dark,
  spine: RIDE_PAINT.coaster.light,
  centreStrip: "#e8d94a",
  tie: RIDE_PAINT.coaster.mid,
  support: RIDE_PAINT.coaster.light,
  supportDark: RIDE_PAINT.coaster.dark,
  carBody: RIDE_PAINT.coaster.light,
  carBodyDark: RIDE_PAINT.coaster.dark,
  seat: "#8d9299",
  seatDark: "#6b7076",
  restraint: RIDE_PAINT.coaster.mid,
  stationFrame: RIDE_PAINT.coaster.dark,
  stationRoof: RIDE_PAINT.coaster.mid,
  stationColumn: RIDE_PAINT.coaster.light,
  platform: "#a8a9a4",
} as const;

/** Track cross-section. */
export const RAIL_GAUGE = 1.5;
export const RAIL_RADIUS = 0.15;
export const SPINE_SIZE = 0.34;
export const TIE_SPACING = 1.35;

/** Number of samples used for rails, frames and support placement. */
export const TRACK_SEGMENTS = 900;

/**
 * Train: 10 cars x 4 seats = 40 seats.
 *
 * FORTY, DOWN FROM SIXTY. The user asked every ride in the park for a realistic
 * 30-40 seat capacity, with 40 preferred, and the coaster reaches it by
 * shortening the train rather than by re-spacing it: the 2x2 block inside a car
 * is untouched, CAR_SPACING is untouched, and the five cars that come off the
 * back simply leave the consist. Nothing about the track, the station, the
 * supports or the ride's speed changes.
 */
export const CAR_COUNT = 10;
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

/* ---------------- Seat height ---------------- */
/**
 * WHERE A RIDER ACTUALLY SITS IN A CAR, and the one place that decides it.
 *
 * `Car.tsx` draws the seat and `simulation/journey/rideKinematics.ts` places the
 * employee, and until now each carried its own arithmetic — the drawing scaled
 * the seat by RIDE_SEAT_SCALE and the kinematics did not, so a rider sat a seat
 * pan's worth away from the pan they were supposed to be on. Both now read
 * these two numbers, so they cannot disagree.
 *
 * SEAT_SURFACE_Y is the top of the pan, lowered by SEAT_LOWER_FRACTION of its
 * own rise above the car's chassis deck — the 10-15% the user asked for, taken
 * out of the seat and not out of the ride, which keeps the car body, the
 * chassis, the wheels and the track exactly where they were.
 */
/** Top of the chassis plate the seats stand on, in the car's local frame. */
const CHASSIS_TOP_Y = -0.19;
/** Half the 0.14-deep pan: how far the seat's top surface is above its group. */
export const SEAT_PAN_TOP_LOCAL = 0.07;
/** The pan top's original rise above the chassis, at the drawn seat size. */
const SEAT_RISE = 0.36 + SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE - CHASSIS_TOP_Y;
/** Top of the seat pan, after the lowering. */
export const SEAT_SURFACE_Y = CHASSIS_TOP_Y + loweredSeatMount(SEAT_RISE);
/** Where the seat GROUP is hung so its pan top lands on SEAT_SURFACE_Y. */
export const SEAT_MOUNT_Y = SEAT_SURFACE_Y - SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE;
