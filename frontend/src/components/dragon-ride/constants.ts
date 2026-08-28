import { RIDE_SEAT_SCALE, loweredSeatMount } from "@/world/scale";
import { RIDE_PAINT } from "@/world/ridePaint";

/**
 * Dimensions and palette for the Giant Dragon Swing Ship.
 *
 * ADD-ONLY: nothing in this module is imported by, or alters, any existing
 * ride. Colours are taken from the user's reference photograph of a
 * dragon-head swinging ship: a white painted-steel A-frame studded with rows
 * of red / blue / yellow bulbs, a varnished timber hull with a gold keel band
 * and red-and-gold decorative side panels, and a green dragon with gold horns,
 * magenta neck frills and amber eyes.
 *
 * Scale reference — this is deliberately the largest attraction in the park:
 *   Ferris Wheel top .... 29.5u (centre 16.5 + radius 13)
 *   Monster Ride tower .. 13.0u
 *   Dragon A-frame apex . 34.0u   <- tallest structure in the park
 * A seated employee is ~1.3u tall, so a person beside the foundations reads
 * as roughly 1/26th the height of the ride.
 */
export const PALETTE = {
  /** A-frame: painted amusement-park steel — the ship is the park's red ride. */
  frame: RIDE_PAINT.dragon.light,
  frameDark: RIDE_PAINT.dragon.mid,
  frameJoint: RIDE_PAINT.dragon.dark,
  /** Bulb rows that run down every leg in the reference photo. */
  bulbRed: "#e0342c",
  bulbBlue: "#2f6fd0",
  bulbYellow: "#f2c230",
  /** Hull: painted, darker below the rubbing strake. The carved dragon and
      the timber deck are left alone — you do not paint over either. */
  hull: RIDE_PAINT.dragon.light,
  hullDark: RIDE_PAINT.dragon.dark,
  hullKeel: "#e8b93a",
  deck: "#a97440",
  bulwark: RIDE_PAINT.dragon.mid,
  trimRed: RIDE_PAINT.dragon.light,
  trimGold: "#d4a12a",
  /** Dragon. */
  dragonBody: "#3f9e56",
  dragonBodyDark: "#2c7440",
  dragonBelly: "#e5d08a",
  dragonHorn: "#e8d9a8",
  dragonFrill: "#c9407e",
  dragonEye: "#f2b01e",
  dragonPupil: "#1a1a1a",
  dragonTooth: "#f7f4ea",
  dragonMouth: "#8c2f3f",
  /** Mechanical parts — painted with the ride, like the rest of its steel. */
  steel: RIDE_PAINT.dragon.mid,
  steelDark: RIDE_PAINT.dragon.dark,
  hydraulic: RIDE_PAINT.dragon.dark,
  foundation: "#b0aca4",
  /** Seats + riders (matches the tones used elsewhere in the park). */
  seatFrame: "#3f3126",
  restraint: "#d0d4da",
  shirt: "#3b82f6",
  skin: "#f1c27d",
} as const;

/**
 * World placement: 38u in front of the roller coaster's near edge, on the
 * entrance (+Z) side, so the walking order through the park is
 * ENTRANCE -> EXISTING PARK -> DRAGON RIDE -> ROLLER COASTER.
 *
 * Found by a numeric sweep over the whole park (see verify-dragon-ride.ts,
 * which re-proves the clearances): every other ride's footprint and the park
 * train's loop stay at least 8u clear of this ride's full swing envelope.
 * The roller coaster is NOT moved — this space was empty ground.
 */
export const DRAGON_ORIGIN: [number, number, number] = [67, 0, 62];

/**
 * Yaw so the ship swings across the line of sight from the park entrance,
 * showing the full arc rather than swinging toward/away from the viewer, and
 * so the dragon's bow points toward the roller coaster it leads into.
 */
export const DRAGON_YAW = -Math.PI / 2;

/** ---------------- A-frame ---------------- */
export const APEX_HEIGHT = 34;
/** The swing axle sits just below the apex, carried in the bearing block. */
export const PIVOT_Y = 30;
/** Half-spacing of the two A-frames, one either side of the ship. */
export const FRAME_HALF_SPAN = 9;
/** Feet splay outward in both axes, like the reference's four-legged pyramid. */
export const FOOT_SPREAD_X = 12;
export const FOOT_SPREAD_Z = 14;
export const LEG_RADIUS = 0.62;
export const FOUNDATION_SIZE = 3.4;
export const FOUNDATION_HEIGHT = 0.9;

/** ---------------- Ship ---------------- */
/** Distance from the pivot down to the deck plane. */
export const ARM_LENGTH = 19;
export const HULL_LENGTH = 28;
export const HULL_WIDTH = 8;
/** Keel depth below the deck — the lowest part of the hull. */
export const HULL_DEPTH = 3.5;
export const BULWARK_HEIGHT = 1.5;

/** ---------------- Seats ---------------- */
/**
 * 10 rows of 4 = 40 seats.
 *
 * FORTY, DOWN FROM SIXTY, to meet the user's 30-40 capacity for every ride. The
 * rows are untouched — same count, same 2.3 m pitch down a 28 m hull — and the
 * two seats that come off each row are the outermost pair, so the remaining
 * four sit further inboard of the bulwarks with more room between them. The
 * hull, the deck, the A-frame, the swing and the ride's 34 m apex are all
 * exactly as they were.
 */
export const SEAT_ROWS = 10;
export const SEATS_PER_ROW = 4;
export const SEAT_COUNT = SEAT_ROWS * SEATS_PER_ROW;
export const ROW_SPACING = 2.3;
export const SEAT_SPACING = 1.15;

/**
 * WHERE A RIDER ACTUALLY SITS ON THE DECK, and the one place that decides it.
 *
 * `Ship.tsx` draws the seat and `rideKinematics.ts` places the employee in it;
 * both read these, so the drawn cushion and the seated figure cannot drift
 * apart — which they previously did, because only the drawing scaled the seat
 * by RIDE_SEAT_SCALE.
 *
 * SEAT_SURFACE_Y is the top of the cushion, lowered by SEAT_LOWER_FRACTION of
 * its rise above the deck plank — the 10-15% the user asked for. Nothing about
 * the hull or the ride's motion changes.
 */
/** The deck plank the seats are bolted through, in the hull's own frame. */
export const DECK_Y = 0.12;
/** Cushion centre 0.42 + half its 0.18 depth, in the seat's unscaled frame. */
export const SEAT_PAN_TOP_LOCAL = 0.51;
const SEAT_RISE = SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE;
export const SEAT_SURFACE_Y = DECK_Y + loweredSeatMount(SEAT_RISE);
/** Where the seat GROUP is mounted so its cushion top lands on SEAT_SURFACE_Y. */
export const SEAT_MOUNT_Y = SEAT_SURFACE_Y - SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE;

/** ---------------- Motion ---------------- */
/**
 * Peak swing amplitude, raised from 55 to 65 degrees each side of vertical for
 * a bigger, more energetic arc.
 *
 * This costs nothing in ground clearance: the lowest the hull ever reaches is
 * at ~32 degrees (where the keel swings under the pivot), which was already
 * inside the old range, so the worst-case clearance is unchanged at 3.50u.
 * Verified by sweep in verify-dragon-ride.ts.
 */
export const SWING_MAX = (65 * Math.PI) / 180;

/**
 * Natural pendulum period from the real geometry: T = 2*PI*sqrt(L/g) for
 * L = ARM_LENGTH and g = 9.81, treating one world unit as one metre. At L=19
 * that is ~8.7s per full swing.
 */
export const GRAVITY = 9.81;
export const NATURAL_SWING_PERIOD = 2 * Math.PI * Math.sqrt(ARM_LENGTH / GRAVITY);

/**
 * The ship is motor-driven, not free-swinging, so the drive is geared to run it
 * at twice its natural rate — a fast, powerful commercial ride rather than a
 * lazy pendulum. The motion keeps its pendulum *shape* (fastest through the
 * bottom, momentarily still at each extreme, smooth acceleration either way);
 * only the rate changes.
 */
export const SWING_SPEED_MULTIPLIER = 2;
export const SWING_PERIOD = NATURAL_SWING_PERIOD / SWING_SPEED_MULTIPLIER;

/**
 * One full ride cycle: the motor winds the ship up to the full arc, holds it,
 * then eases back before the next load. Halved along with everything else so
 * the ride reaches its big swings far sooner.
 */
export const RIDE_CYCLE_SECONDS = 36;
/**
 * Amplitude floor, raised so the ship is always visibly working — even at its
 * quietest it still swings +/-23 degrees, and it never appears frozen.
 */
export const MIN_AMPLITUDE_FRACTION = 0.35;

/**
 * Worst-case horizontal reach of the whole ride, used for park-placement
 * clearance checks. The swinging hull corner is the farthest-travelling point;
 * this is re-derived numerically in verify-dragon-ride.ts from the real
 * kinematics rather than trusted as a constant.
 */
export const RIDE_REACH = 30;
