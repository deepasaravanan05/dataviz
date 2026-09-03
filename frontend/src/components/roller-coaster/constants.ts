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

/**
 * Number of samples used for rails, frames and support placement.
 *
 * TIED TO THE LENGTH OF THE CIRCUIT, not a bare count. 900 was chosen when the
 * circuit ran 201.6u, which is 4.46 samples per unit of track, and the rails,
 * the sleeper spacing, the support pitch and — through TRACK_FRAMES — the
 * interpolated banking a car reads at an arbitrary point all resolve at that
 * density. Leaving the count alone while the circuit grew by 39% would have
 * quietly coarsened every one of them; the cars gave it away first, their
 * chord through the lift crest closing from 1.71u to 1.67u against a 1.7u car.
 */
export const TRACK_SEGMENTS = 1250;

/**
 * Train: 15 cars x 2 seats = 30 seats.
 *
 * THIRTY, DOWN FROM FORTY, and the count is what decided the layout. Thirty is
 * not divisible by the 2x2 block the cars used to carry, so rather than leave a
 * short car on the back the block was halved: every car now carries ONE row of
 * two, and there are fifteen of them. The 2-across spacing inside a row is
 * untouched, CAR_LENGTH is untouched, and the car shell, its chassis, wheels
 * and nose cone are all drawn exactly as before — the change is that the rear
 * row is gone and five more cars are on the back.
 */
export const CAR_COUNT = 15;
export const SEATS_PER_CAR = 2;
export const SEAT_COUNT = CAR_COUNT * SEATS_PER_CAR;
/** Rows of two in a car. One, now that a car seats a pair. */
export const ROWS_PER_CAR = SEATS_PER_CAR / 2;
export const CAR_LENGTH = 1.7;
/**
 * Spacing is measured along the arc, but neighbouring cars are separated by
 * the straight-line chord, which shortens through tight curvature.
 *
 * OPENED FROM 2.95 TO 3.2, and the lift crest is why. A car rides
 * CAR_RIDE_HEIGHT above the spine along the track's own normal, so the chord
 * between two cars depends on where that normal points — and the normals come
 * from a rotation-minimising frame carried around the WHOLE closed circuit.
 * Rebuilding the return run therefore moved the normals everywhere, including
 * over the crest, and the chord there closed from 1.712u to 1.666u against a
 * 1.7u car: touching. At 3.2 it opens to 1.790u, which is the first real
 * clearance the crest has ever had. Anything below about 3.1 puts it back.
 */
export const CAR_SPACING = 3.2;

/* ---------------- Where a seat sits inside its car ---------------- */
/**
 * ONE PLACE DECIDES THIS, for the same reason SEAT_SURFACE_Y below does.
 *
 * `Car.tsx` draws the seats and `simulation/journey/rideKinematics.ts` puts the
 * riders in them, and each used to carry its own copy of these two offsets. A
 * copy that is only correct while the seating plan never changes is a bug
 * waiting for the plan to change, which is exactly what has now happened.
 */
/** How far a seat sits either side of the car's centreline. */
export const SEAT_X = 0.42;
/** Gap between the centres of two rows, back when a car carried two. */
export const ROW_PITCH = 0.88;

/**
 * Where row `row` sits along the car's forward axis, in the car's local frame.
 *
 * Rows are spread symmetrically about the car's centre, so a two-row car keeps
 * the +/-0.44 it has always had and a single-row car seats its pair in the
 * middle of the shell rather than pushed up against the nose.
 */
export function seatRowZ(row: number): number {
  return ((ROWS_PER_CAR - 1) / 2 - row) * ROW_PITCH;
}

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
