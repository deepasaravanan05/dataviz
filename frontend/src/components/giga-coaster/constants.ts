import { OVERALL_HEIGHT as TEACUPS_HEIGHT } from "@/components/tea-cups/constants";
import { HUMAN, METRE, PROP } from "@/world/scale";

/**
 * THE GIGA COASTER — a lift hill, a drop, and a mile of steel.
 *
 * A recreation of the machine in the Sketchfab model "Animated Roller Coaster
 * Ride" by Shahzy_S (CC Attribution): "a fully animated roller coaster ...
 * detailed track design and smooth ride animation". Nothing is imported from
 * it. Like every other ride in this park it is an original build in code — a
 * complete circuit, a train that runs it under gravity, and the structure that
 * holds the track up.
 *
 * THE BRIEF:
 *
 *   "the size of this ride should be equal to the teacup ride"
 *                       → CREST_Y is read out of the Tea Cups' own height, so
 *                         the two are the same to the last digit and this one
 *                         follows if that one ever changes.
 *   "placed near the teacup ride"
 *                       → placement.ts. The nearest ground to the Tea Cups
 *                         that clears every margin the park keeps.
 *
 * A 127 m lift hill puts this in the GIGA class — the real ones are Steel
 * Dragon at 97 m and Kingda Ka at 139 — and that one number sets the rest of
 * the ride. The drop off it decides how fast the train is going at the bottom,
 * the speed at the bottom decides how big the following hills can be, and
 * nothing on this page is a number chosen to look right. See coasterMotion.ts,
 * which runs the circuit rather than animating it.
 *
 * NOTHING ALREADY IN THE PARK MOVES. The ride is not handed to the layout
 * solver — a sixth box would re-solve all five existing positions and shift
 * the whole park — so it is placed in ground that was already clear.
 */

/* ------------------------------------------------------------------ *
 * WHAT IT IS CALLED
 * ------------------------------------------------------------------ */

/** This ride's own id, kept distinct from every `DepartmentRideId`. */
export const GIGA_RIDE_ID = "giga" as const;
export type GigaRideId = typeof GIGA_RIDE_ID;

/** The ride's own name. The park's other coaster keeps "Roller Coaster". */
export const GIGA_RIDE_NAME = "Giga Coaster";
/** The ride it was told to match, and to stand near. */
export const SIZE_MATCH_ID = "teacups";

/* ------------------------------------------------------------------ *
 * HOW BIG — "equal to the teacup ride"
 * ------------------------------------------------------------------ */

/**
 * The crest of the lift hill, which is the top of the ride.
 *
 * Read from the Tea Cups rather than typed, so the two are the same height by
 * construction. Every other height on the circuit below is a fraction of it,
 * so the whole ride is one number deep: change what this matches and the
 * drop, the hills and the speeds all follow.
 */
export const CREST_Y = TEACUPS_HEIGHT;

/**
 * The station deck, and the datum the circuit is measured from.
 *
 * Three metres, which is what it takes for the platform beside it to be
 * reachable by ONE straight flight of the park's own steps. It was eight, and
 * eight put the boards nine and a half metres up and the climb into six
 * flights of switchbacks — on a ride whose train comes to the rider rather
 * than the other way about.
 */
export const STATION_Y = 3 * METRE;
/** The lowest the track gets, at the bottom of the first drop. */
export const VALLEY_Y = 2 * METRE;

/* ------------------------------------------------------------------ *
 * THE TRACK
 * ------------------------------------------------------------------ */

/** Two running rails at a gauge, on a spine, with ties between. */
export const TRACK_GAUGE = 1.7 * METRE;
export const RAIL_RADIUS = 0.18 * METRE;
export const SPINE_RADIUS = 0.55 * METRE;
export const SPINE_DROP = 1.05 * METRE;
export const TIE_RADIUS = 0.11 * METRE;
/** Ties are laid at a fixed spacing ALONG the track, not per control point. */
export const TIE_SPACING = 3.2 * METRE;

/** How finely the curve is sampled for drawing and for running the train. */
export const TRACK_SAMPLES = 1400;

/* ------------------------------------------------------------------ *
 * THE SUPPORTS
 * ------------------------------------------------------------------ */

/**
 * A leg every so often along the track, from the spine down to the ground.
 *
 * Spaced along the CURVE rather than per control point, so the spacing is
 * even whatever the layout does, and skipped where the track is already low —
 * a support half a metre tall is a stub nobody would build.
 */
export const SUPPORT_SPACING = 13 * METRE;
export const SUPPORT_MIN_HEIGHT = 3.5 * METRE;
export const SUPPORT_RADIUS = 0.5 * METRE;
export const SUPPORT_FOOT_RADIUS = 1.5 * METRE;
/** Cross-bracing between the legs of a tall support, every this far up. */
export const BRACE_SPACING = 11 * METRE;
export const BRACE_RADIUS = 0.2 * METRE;
/** How far the legs splay at the foot, per metre of height. */
export const SUPPORT_SPLAY = 0.14;

/* ------------------------------------------------------------------ *
 * THE TRAIN
 * ------------------------------------------------------------------ */

/**
 * Thirty-two riders in eight cars, which is this park's own rule about how
 * many a ride carries — and, as it happens, exactly what a real giga
 * coaster's train holds.
 */
export const ROWS_PER_CAR = 2;
export const SEATS_PER_ROW = 2;
export const CAR_COUNT = 8;
export const SEAT_COUNT = CAR_COUNT * ROWS_PER_CAR * SEATS_PER_ROW;

/** A car, sized from the people in it and then built larger than life. */
export const CAR_SCALE = 2.2;
export const SEAT_WIDTH = PROP.chairWidth * CAR_SCALE;
export const ROW_PITCH = 0.82 * CAR_SCALE * METRE;
export const CAR_LENGTH = ROWS_PER_CAR * ROW_PITCH + 0.5 * CAR_SCALE * METRE;
export const CAR_WIDTH = SEATS_PER_ROW * SEAT_WIDTH + 0.3 * CAR_SCALE * METRE;
export const CAR_GAP = 0.35 * CAR_SCALE * METRE;
export const CAR_PITCH = CAR_LENGTH + CAR_GAP;
export const TRAIN_LENGTH = CAR_COUNT * CAR_PITCH;
/** How far the car's floor sits above the rail it runs on. */
export const CAR_RIDE_HEIGHT = 0.62 * CAR_SCALE * METRE;
export const SEAT_PAN_Y = PROP.chairSeatY * CAR_SCALE;
/**
 * Where a RIDER sits, above the car's own origin — the floor height plus the
 * pan on top of it.
 *
 * Every ride in this park publishes one of these and the boarding system reads
 * exactly it, so the seat a person is placed in is the seat that is drawn. The
 * two numbers it adds are the same two `Train.tsx` composes when it draws the
 * cushion, which is why this is a sum here rather than a figure of its own.
 */
export const SEAT_SURFACE_Y = CAR_RIDE_HEIGHT + SEAT_PAN_Y;
export const SEAT_BACK_HEIGHT = (HUMAN.shoulderY - PROP.chairSeatY) * CAR_SCALE;
export const HARNESS_RADIUS = 0.055 * CAR_SCALE * METRE;

/* ------------------------------------------------------------------ *
 * HOW IT RUNS — physics, not animation
 * ------------------------------------------------------------------ */

export const GRAVITY = 9.80665;

/**
 * THE CHAIN LIFT, and then gravity.
 *
 * A coaster is the one ride where the motion needs no invention at all: a
 * chain drags the train up the hill at a constant crawl, lets go at the crest,
 * and from there the train is a bead on a wire. Its speed anywhere on the
 * circuit is whatever energy it has left:
 *
 *     v(y) = sqrt(v_crest^2 + 2 g (CREST_Y - y))
 *
 * There is no drag term. A real train loses perhaps a tenth of its energy to
 * friction over a circuit, and modelling that would mean the ride quietly
 * failing to get home — so the honest simplification is a frictionless one,
 * stated here, with the brake run taking the energy out at the end where a
 * real one does.
 */
export const LIFT_SPEED = 4.2 * METRE;
/** The speed it rolls over the crest at, before the drop takes over. */
export const CREST_SPEED = 2.6 * METRE;
/**
 * How hard the brake run pulls the train down at the end of the circuit.
 *
 * Nine metres per second squared — a shade under one g, which is what a real
 * magnetic brake run does. It has to be that: a train arriving off a 127 m
 * drop is doing forty metres a second, and stopping it takes `v^2 / 2a` of
 * track. `coasterMotion.ts` sizes the brake run from exactly that, so the
 * brakes and the length of track they are given can never disagree.
 */
export const BRAKE_DECEL = 9.0 * METRE;
/*
 * THE TRIM BRAKE is not here: where it sits and how hard it bites are both
 * solved from the layout — see `coasterMotion.ts`. A real giga coaster has
 * one, and for the reason this ride needs one: a train leaving a 127 m drop is
 * doing a hundred and seventy-six km/h, and every corner after it costs
 * `v^2 / R` sideways.
 */

/** And the speed it creeps back into the station at. */
export const STATION_SPEED = 2.0 * METRE;

/** Dwell in the station, either side of the run. */
export const LOAD_SECONDS = 12;
export const UNLOAD_SECONDS = 8;

/* ------------------------------------------------------------------ *
 * THE STATION
 * ------------------------------------------------------------------ */

export const PLATFORM_HALF_LENGTH = TRAIN_LENGTH / 2 + 4 * METRE;
export const PLATFORM_WIDTH = 4.5 * METRE;
export const PLATFORM_THICKNESS = 0.34 * METRE;
export const RAIL_HEIGHT = PROP.railHeight;
/*
 * The platform's HEIGHT is not here: it has to be level with the rail the
 * train really stops on, which only `trackCurve.ts` knows — and that module
 * reads this one, so the dependency has to run one way. See `station.ts`.
 */
/** A roof over the platform, as every station has. */
export const CANOPY_HEIGHT = 5.2 * METRE;
export const CANOPY_OVERHANG = 1.6 * METRE;

/*
 * WHAT THE RIDE OCCUPIES is not here either. Its height is the crest and its
 * reach is the farthest the track gets from the ride's origin — and the track
 * is drawn by a module that reads THIS one, so the dependency has to run one
 * way. See `envelope.ts`.
 */

/* ------------------------------------------------------------------ *
 * THE PALETTE
 * ------------------------------------------------------------------ */

/**
 * Track in a hot orange-red on white supports, which is the livery no other
 * ride in this park wears.
 *
 * The five department rides take their structural paint from
 * `world/ridePaint.ts`, one hue each, and `verify-night.ts` re-proves that
 * those five stay separated on the hue wheel. This is an attraction rather
 * than a department ride, so — like the Flying Chairs, the Super Looper and
 * the Tea Cups — it carries its own livery here and adds nothing to that
 * registry.
 */
export const PALETTE = {
  rail: "#e8e4dc",
  spine: "#e2452f",
  tie: "#c2381f",
  support: "#f2efe8",
  supportDark: "#b9b3a6",
  brace: "#d8d2c6",
  footing: "#9aa0a6",
  carBody: "#1d2a3a",
  carTrim: "#e2452f",
  seatCushion: "#dfe4ea",
  harness: "#ffcf3d",
  wheel: "#2a2a30",
  deck: "#6f5a48",
  deckTrim: "#e2452f",
  canopy: "#2f4562",
  station: "#cfc7b8",
  lamp: "#fff2c0",
} as const;

/** The train's cars, dealt a run of liveries so the train reads as a train. */
export const CAR_COLORS = ["#e2452f", "#f0a02c", "#f2d64b"] as const;

export function carColor(index: number): string {
  return CAR_COLORS[index % CAR_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateGigaCoaster(): void {
  console.assert(
    SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
    `Every ride in this park carries 30-40; this one carries ${SEAT_COUNT}`,
  );
  console.assert(
    Math.abs(CREST_Y - TEACUPS_HEIGHT) < 1e-12,
    "The crest is not the height the ride was told to match",
  );
  console.assert(VALLEY_Y < STATION_Y, "The first drop does not go below the station");
  console.assert(
    CREST_SPEED > 0 && LIFT_SPEED > 0,
    "The train would stall on the lift hill",
  );
}
