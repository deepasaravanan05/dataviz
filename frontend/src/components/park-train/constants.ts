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
  boiler: "#4f8f52",
  boilerDark: "#3a6b3d",
  smokestack: "#2b2b28",
  smokestackTrim: "#d9b45a",
  chassis: "#c23b3b",
  chassisDark: "#9c2e2e",
  roof: "#f2ead8",
  rail: "#e8e2d0",
  post: "#9c2e2e",
  seat: "#cfe066",
  wheelTire: "#232323",
  wheelRim: "#e6e6e6",
  wheelHub: "#4f8f52",
  driverShirt: "#2f5fbf",
  driverSkin: "#f1c27d",
  driverCap: "#1e3f8a",
  /** Heidi-inspired carriage accents. */
  carFrame: "#2b2e33",
  carFrameDark: "#1c1e22",
  woodPanel: "#8a6238",
  woodPanelDark: "#6b4a28",
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
export const RAIL_GAUGE = 2.4;
export const RAIL_RADIUS = 0.1;
export const RAIL_Y = 0.08;
export const TIE_SPACING = 2.6;

/**
 * Locomotive + 4 open-air passenger cars, 5 seats each (20 total) — a
 * compact, unmistakably train-shaped consist (a real engine up front
 * pulling a short line of open cars) rather than a long flatbed chain, per
 * the requested realistic open-view 20-seat amusement-park train. Each
 * car is a single across-the-width bench row so every rider is visible
 * from outside on both sides, not just from above.
 */
export const CARRIAGE_COUNT = 4;
export const SEATS_PER_CARRIAGE = 5;
export const RIDER_COUNT = CARRIAGE_COUNT * SEATS_PER_CARRIAGE;

export const CAR_WIDTH = 3.6;
export const CAR_LENGTH = 2.8;
export const CAR_SPACING = 4.2;
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
