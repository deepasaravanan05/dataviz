import { loweredSeatMount } from "@/world/scale";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import { PARK_LAYOUT } from "@/components/park/layout";
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
/**
 * The car's own width, in track units, named up here because the train's body
 * scale is now solved FROM it — see below. The export stays where it always
 * was, with the rest of the car's dimensions.
 */
const CAR_WIDTH_UNITS = 3.6;

/**
 * HOW WIDE THE TRACK IS — "the train track must be *20 wide".
 *
 * Twenty times is not available, and the reason is measurable rather than a
 * matter of taste: the gauge was 26.6 m across, so twenty times is 531 m, and
 * the loop's own radii are 478 and 458 m. A 531 m gauge puts the inner rail
 * 265 m inside the centre line — through the middle of the park, across every
 * ride in it. The railway would not be a railway.
 *
 * SO THE TRACK IS AS WIDE AS THE GROUND WILL TAKE, which was the choice made.
 * The loop clears the nearest ride footprint by 36.4 m, and the park's own
 * margin to a ride is 12 m, so the rails may reach 24.4 m either side of the
 * centre line — a 46.4 m gauge, which leaves that margin exact. That is 1.7x
 * the old track, and it is the widest number in this file that does not run
 * the train through a ride.
 * `verify-park-train.ts` re-measures both figures against the real layout.
 *
 * AND THE TRAIN IS BUILT TO SPAN IT. A gauge is only wide if the thing running
 * on it is: rails 48.8 m apart under a 28 m carriage would read as a carriage
 * on outriggers. So the body scale is no longer a chosen 1.5 — it is whatever
 * makes a car exactly as wide as its own track, and the wheels follow the
 * gauge as they already did.
 */
export const TRACK_GAUGE_METRES = 46.4;
export const TRAIN_BODY_SCALE = TRACK_GAUGE_METRES / (CAR_WIDTH_UNITS * TRAIN_SCALE);

/**
 * The car's own dimensions stay in the train's own space, because that is the
 * space they are DRAWN in — every vehicle is rendered inside one group scaled
 * by TRAIN_BODY_SCALE, so scaling them here as well would size the train twice.
 * What does scale here is everything OUTSIDE that group: the rails the train
 * runs on, and the spacing the kinematics keeps between vehicles.
 */

/**
 * TEN METRES WIDER, as was asked at the time — since superseded by the width
 * solved above, which this note is kept beneath because the reasoning about
 * where the wheels sit is still the reasoning that applies.
 *
 * A number in this file is in TRACK space, and the whole railway is mounted
 * under `<group scale={TRAIN_SCALE}>` in ParkScene, so a track unit is 4.6
 * world metres. Ten metres of real width is therefore 10 / TRAIN_SCALE here —
 * written that way rather than as the arithmetic's answer so that the ten is
 * still readable, and so that it stays ten if the park is ever rescaled.
 *
 * The gauge goes from 16.56 m across to 26.56 m.
 *
 * IT ALSO FIXES SOMETHING. The train's wheels were already outboard of its
 * own rails — a carriage's wheels sat 4.8 m outside them and the locomotive's
 * 2.1 m outside — so the railway read as a narrow line drawn under a wide
 * train rather than as track the train runs on. A ten-metre-wider gauge lands
 * within 0.17 m of where the carriage wheels already were, which is almost
 * certainly why this is the width that looked wrong. The wheels are now
 * derived from this constant in Locomotive.tsx and Carriage.tsx, so they sit
 * on the rails exactly and cannot drift apart again.
 */
export const RAIL_GAUGE = TRACK_GAUGE_METRES / TRAIN_SCALE;
/** What that widening amounts to against the train's own authored gauge. */
export const GAUGE_WIDENING_METRES = TRACK_GAUGE_METRES - 2.4 * TRAIN_BODY_SCALE * TRAIN_SCALE;

/**
 * Where a wheel sits, in the BODY space the vehicles are drawn in.
 *
 * The rails are laid in track space and the wheels are drawn inside the group
 * scaled by TRAIN_BODY_SCALE, so getting from one to the other is a division —
 * which is exactly the step the two hard-coded wheel positions used to skip.
 */
export const WHEEL_X = RAIL_GAUGE / 2 / TRAIN_BODY_SCALE;

/**
 * Half the ground the railway physically covers, in WORLD metres.
 *
 * Measured to the end of a sleeper rather than to the rail, because a sleeper
 * is the outermost thing the track is made of, and expressed in world metres
 * because everything that has to keep away from the railway — the planting,
 * the signage — works in world space.
 *
 * It exists because widening the gauge is not only a change to the train: the
 * plants and the signboards were laid out around a track half this wide, and a
 * shrub that was beside the railway before is between the rails afterwards.
 * They read this rather than a number of their own, so the next change to the
 * gauge carries them with it.
 */
export const TRACK_HALF_WIDTH_METRES = ((RAIL_GAUGE + 0.3) / 2) * TRAIN_SCALE;

/**
 * THE LOOP IS FITTED TO THE PARK, not typed against it.
 *
 * It used to be a hand-checked ellipse — centre (34, 26), radii 92 and 88 —
 * with a comment listing the ride footprints it had been measured against by
 * hand. That was true of a park whose rides never moved. Every ride is now
 * built to one common height, the layout solver re-placed all five to fit them
 * with clear sky between their silhouettes, and the hand-measured loop ran
 * straight through the Ferris Wheel and the Dragon Ride.
 *
 * So the railway now READS the layout it circles: the loop is the box that
 * contains every ride, pushed out by a standoff, in the ride's own world
 * metres and then divided back into track units. Move a ride, resize the park,
 * or add a sixth box, and the railway goes round the outside of whatever it
 * finds — which is the relationship a railway has to a park anyway.
 *
 * THE STANDOFF is thirty metres of clear grass from the outermost rail to the
 * nearest ride, so it is measured from the RAIL rather than from the centre
 * line — a 46 m gauge is 23 m of track either side, and a standoff that
 * forgot it would have laid the near rail on the ride's doorstep.
 *
 * The main gate sits outside the result, which is not luck: the gate stands
 * well beyond the deepest ride, and the loop only reaches as far as the rides
 * do. `verify-journey.ts` re-checks it from the other side.
 */
export const RAIL_STANDOFF_METRES = 30;

const RIDE_BOUNDS = PARK_LAYOUT.reduce(
  (b, r) => ({
    minX: Math.min(b.minX, r.minX),
    maxX: Math.max(b.maxX, r.maxX),
    minZ: Math.min(b.minZ, r.minZ),
    maxZ: Math.max(b.maxZ, r.maxZ),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);

export const TRACK_CENTER: [number, number] = [
  (RIDE_BOUNDS.minX + RIDE_BOUNDS.maxX) / 2 / TRAIN_SCALE,
  (RIDE_BOUNDS.minZ + RIDE_BOUNDS.maxZ) / 2 / TRAIN_SCALE,
];
/**
 * AND IT IS AN ELLIPSE, so it is fitted to the CORNERS rather than to the box.
 *
 * An ellipse whose radii are the bounding box's half-extents touches that box
 * only at four points and cuts inside it everywhere else — which is exactly
 * where the corner rides stand. Fitted that way the loop came out running
 * through the Roller Coaster and the Monster Ride with nothing between them.
 *
 * So every ride box is inflated by the standoff and the near rail's own half
 * width, and the ellipse is grown by the single factor that puts the furthest
 * inflated corner exactly on it. One factor, both axes, so the loop keeps the
 * park's own proportions instead of becoming a circle round its longest side.
 */
const LOOP_HALF_X = (RIDE_BOUNDS.maxX - RIDE_BOUNDS.minX) / 2;
const LOOP_HALF_Z = (RIDE_BOUNDS.maxZ - RIDE_BOUNDS.minZ) / 2;
const LOOP_MARGIN = RAIL_STANDOFF_METRES + TRACK_HALF_WIDTH_METRES;

const LOOP_FIT = Math.max(
  ...PARK_LAYOUT.flatMap((r) =>
    [
      [r.minX - LOOP_MARGIN, r.minZ - LOOP_MARGIN],
      [r.maxX + LOOP_MARGIN, r.minZ - LOOP_MARGIN],
      [r.minX - LOOP_MARGIN, r.maxZ + LOOP_MARGIN],
      [r.maxX + LOOP_MARGIN, r.maxZ + LOOP_MARGIN],
    ].map(([px, pz]) =>
      Math.hypot(
        (px - (RIDE_BOUNDS.minX + RIDE_BOUNDS.maxX) / 2) / LOOP_HALF_X,
        (pz - (RIDE_BOUNDS.minZ + RIDE_BOUNDS.maxZ) / 2) / LOOP_HALF_Z,
      ),
    ),
  ),
);

export const TRACK_RADIUS_X = (LOOP_HALF_X * LOOP_FIT) / TRAIN_SCALE;
export const TRACK_RADIUS_Z = (LOOP_HALF_Z * LOOP_FIT) / TRAIN_SCALE;
export const TRACK_SAMPLES = 480;
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

export const CAR_WIDTH = CAR_WIDTH_UNITS;
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
