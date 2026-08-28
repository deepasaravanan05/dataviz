import { loweredSeatMount } from "@/world/scale";
import { RIDE_PAINT } from "@/world/ridePaint";

/**
 * Palette and dimensions for the Park Train.
 *
 * The locomotive keeps the green-boiler carnival-engine look from the
 * original reference ("Children's Carnival Train Ride" by SPMech, Sketchfab
 * — no licence declared, original recreation). The passenger cars borrow
 * their palette from a second reference, "Heidi The Ride | Plopsaland" by
 * Brugpieper (Sketchfab, also no licence declared, also an original
 * recreation): a dark-metal chassis, wood-panel seat backs, and gold scroll
 * trim accents, applied here to open, multi-seat benches rather than
 * Heidi's single-seat pods, since this park's cars need real passenger
 * capacity per the brief.
 */
export const PALETTE = {
  boiler: RIDE_PAINT.train.light,
  boilerDark: RIDE_PAINT.train.dark,
  smokestack: "#2b2b28",
  smokestackTrim: "#d9b45a",
  chassis: RIDE_PAINT.train.light,
  chassisDark: RIDE_PAINT.train.dark,
  roof: "#f2ead8",
  rail: "#e8e2d0",
  post: RIDE_PAINT.train.mid,
  seat: "#cfe066",
  wheelTire: "#232323",
  wheelRim: RIDE_PAINT.train.mid,
  wheelHub: RIDE_PAINT.train.mid,
  driverShirt: "#2f5fbf",
  driverSkin: "#f1c27d",
  driverCap: "#1e3f8a",
  /** Heidi-inspired carriage accents. */
  carFrame: RIDE_PAINT.train.light,
  carFrameDark: RIDE_PAINT.train.dark,
  woodPanel: RIDE_PAINT.train.mid,
  woodPanelDark: RIDE_PAINT.train.dark,
  trimGold: "#d4a12a",
} as const;

/**
 * Closed elliptical loop around the whole park, clearing every existing
 * ride's keep-out footprint (verified numerically, see
 * verify-park-train.ts) — Ferris Wheel at (0,0,0) reach 13, Roller Coaster
 * at (50,0,0) footprint x:[20,84] z:[-24,24], Monster Ride at (8,0,50)
 * footprint x:[-16.4,32.4] z:[25.6,74.4]. The loop is far larger than the
 * train (565u circumference vs. ~60u train length), so its curvature stays
 * gentle relative to the train's own scale — no need to enlarge it further
 * just because the train grew; verified numerically for the new dimensions.
 */
export const TRACK_CENTER: [number, number] = [34, 26];
export const TRACK_RADIUS_X = 92;
export const TRACK_RADIUS_Z = 88;
export const TRACK_SAMPLES = 480;

/** Track gauge / rail geometry — widened again to suit the larger train. */
/**
 * HOW BIG THE TRAIN ITSELF IS.
 *
 * Everything the train is MADE of is multiplied by this — its gauge, its rails,
 * its wheels, its engine and its carriages. The loop is not: TRACK_RADIUS and
 * TRACK_CENTER below are untouched, so the railway runs exactly the line round
 * the park that it always did, and only the thing running on it grows.
 *
 * That separation is the whole point. The train and its track share one group
 * scale so the train can never leave its rails, so raising THAT would have
 * dragged the loop outward across the park — and enlarged the riders sitting in
 * the carriages along with it, since they are drawn in the same space. Scaling
 * the train's own dimensions instead leaves the loop and the people alone: the
 * carriages simply get bigger, and their seats and passengers stay the size
 * they are everywhere else in the park.
 */
export const TRAIN_BODY_SCALE = 1.5;

/**
 * The car's own dimensions stay in the train's own space, because that is the
 * space they are DRAWN in — every vehicle is rendered inside one group scaled
 * by TRAIN_BODY_SCALE, so scaling them here as well would size the train twice.
 * What does scale here is everything OUTSIDE that group: the rails the train
 * runs on, and the spacing the kinematics keeps between vehicles.
 */

export const RAIL_GAUGE = 2.4 * TRAIN_BODY_SCALE;
export const RAIL_RADIUS = 0.1 * TRAIN_BODY_SCALE;
export const RAIL_Y = 0.08 * TRAIN_BODY_SCALE;
export const TIE_SPACING = 2.6 * TRAIN_BODY_SCALE;

/**
 * Locomotive + 4 open-air passenger cars, 10 seats each (40 total) — a
 * compact, unmistakably train-shaped consist (a real engine up front
 * pulling a short line of open cars) rather than a long flatbed chain. Each
 * car is open on both sides so every rider is visible from outside, not just
 * from above.
 *
 * FORTY, UP FROM TWENTY, to meet the user's 30-40 capacity for every ride in
 * the park. The train reaches it WITHOUT growing: the consist is still four
 * cars behind one engine, each car is still CAR_WIDTH by CAR_LENGTH, and the
 * loop, the gauge and the speed are untouched. What changed is inside the car —
 * it now has two bench rows of five instead of one, facing the same way, which
 * is what a real open-air park train carries anyway.
 */
export const CARRIAGE_COUNT = 4;
export const SEAT_ROWS_PER_CARRIAGE = 2;
export const SEATS_PER_ROW = 5;
export const SEATS_PER_CARRIAGE = SEAT_ROWS_PER_CARRIAGE * SEATS_PER_ROW;
export const RIDER_COUNT = CARRIAGE_COUNT * SEATS_PER_CARRIAGE;

export const CAR_WIDTH = 3.6;
export const CAR_LENGTH = 2.8;
export const CAR_SPACING = 4.2 * TRAIN_BODY_SCALE;
export const TRAIN_SPEED_UNITS_PER_SEC = 7;

/**
 * Wheel radius sets the ONLY vertical reference for the whole train: the
 * kinematics places each car's group origin at RAIL_Y + WHEEL_RADIUS (see
 * CAR_RIDE_HEIGHT in trainKinematics.ts), and every wheel mesh in
 * Locomotive.tsx / Carriage.tsx is drawn at local y=0 — so the wheel bottom
 * sits at exactly RAIL_Y, on the rail, with no other offset layered on top.
 */
export const WHEEL_RADIUS = 0.65;

/** Low guard-rail height on the open passenger compartments (§3, §5). */
export const CAR_RAIL_HEIGHT = 0.55;

/* ---------------- Seat height ---------------- */
/**
 * The bench's rise above the carriage floor, after the seat lowering.
 *
 * The user asked for every ride's seat to come down 10-15%; on the train the
 * seat's whole world is the 0.09 m it stands proud of the deck, so the drop is
 * small in absolute terms and is applied for consistency rather than for
 * drama — nothing about the car, its rails, its wheels or the track moves.
 */
export const BENCH_RISE = loweredSeatMount(0.09);
