/**
 * The world's unit system.
 *
 * ONE WORLD UNIT IS ONE METRE. Everything in the park is measured against
 * that, and against the person standing in it.
 *
 * This module exists because the park had drifted into two conflicting unit
 * systems. The rides were built at true metre scale — a 62 m drop tower, a
 * 50 m Ferris wheel, a park 846 x 810 m across, all correct for a real
 * attraction — while the people walking between them were 4.4 m tall. Every
 * correctly-sized ride therefore read as a toy, because the only object a
 * viewer measures a world against is the human figure in it.
 *
 * So the fix is not to enlarge the rides. It is to make the people real, and
 * to give the camera a way to get close enough to see them. Anything sized for
 * a human to touch — a chair, a turnstile, a handrail, a signboard — is
 * declared here, once, at its real dimension.
 */

/** Metres per world unit. Changing this would rescale the entire park. */
export const METRE = 1;

/** A person. Every human-scale prop below is derived from this figure. */
export const HUMAN = {
  /** Total standing height, crown to floor. */
  height: 1.75 * METRE,
  /** Hip joint — where the legs pivot. */
  hipY: 0.88 * METRE,
  /** Shoulder joint — where the arms pivot. */
  shoulderY: 1.4 * METRE,
  /** Centre of the head. */
  headY: 1.6 * METRE,
  headRadius: 0.112 * METRE,
  shoulderWidth: 0.44 * METRE,
  torsoDepth: 0.23 * METRE,
  /** Comfortable personal space when queueing. */
  queueSpacing: 0.75 * METRE,
  /** Unhurried walking pace, in metres per second of real time. */
  walkSpeed: 1.35 * METRE,
};

/**
 * Furniture and fittings, at the dimensions a person actually meets them.
 * These are ordinary real-world measurements, not artistic choices.
 */
/**
 * THE ROAD WIDTH.
 *
 * Every carriageway, promenade, ride spur and apron link in the park is laid
 * at this one figure, so the whole network reads as a single consistent
 * system rather than a hierarchy of wide and narrow ways. Change it here and
 * every road, its edge markings, its lamp and bench setback, and the planting
 * keep-out beside it all follow — nothing downstream carries its own width.
 */
export const ROAD_WIDTH = 30.0 * METRE;

export const PROP = {
  tableTopY: 0.74 * METRE,
  tableRadius: 0.42 * METRE,
  chairSeatY: 0.45 * METRE,
  chairBackY: 0.92 * METRE,
  chairWidth: 0.46 * METRE,
  /** Spacing between the centres of two café tables. */
  tablePitch: 2.6 * METRE,
  parasolRadius: 1.35 * METRE,
  parasolY: 2.25 * METRE,

  benchLength: 1.8 * METRE,
  benchSeatY: 0.45 * METRE,
  binHeight: 0.95 * METRE,

  /** Street and path lighting. */
  lampHeight: 5.0 * METRE,
  /** Handrails and queue barriers. */
  railHeight: 1.05 * METRE,
  fenceHeight: 2.2 * METRE,

  /** A doorway, and the storey height of a building. */
  doorHeight: 2.1 * METRE,
  doorWidth: 1.0 * METRE,
  storeyHeight: 3.4 * METRE,

  /**
   * Ways and roads, all at ROAD_WIDTH. The three names are kept because they
   * say what a stretch IS — a ride spur, the spine, a carriageway — but they
   * are no longer different sizes.
   */
  footpathWidth: ROAD_WIDTH,
  promenadeWidth: ROAD_WIDTH,
  /** Half a carriageway: the arrival road and the gate drop-off are both ROAD_WIDTH overall. */
  roadLaneWidth: ROAD_WIDTH / 2,

  /** A turnstile lane at a gate. */
  turnstileLaneWidth: 1.1 * METRE,
  turnstileHeight: 1.05 * METRE,
};

/**
 * HOW TALL AN EMPLOYEE IS DRAWN.
 *
 * 3.4 units, crown to floor, for every one of the thirty — set by the user as
 * the middle of a requested 3.2-3.5 band, with a requested 0.8 x 0.6 footprint
 * to go with it.
 *
 * THE FIGURE IS SCALED UNIFORMLY TO REACH IT, never stretched. The rig is built
 * at the anatomical 1.75 m and multiplied by one number on all three axes, so
 * what is drawn is a correctly proportioned person at 1.94 times life size
 * rather than a distorted one. The requested box falls out of that scaling
 * almost exactly: `EMPLOYEE_TARGET_WIDTH` lands at 0.77 and
 * `EMPLOYEE_TARGET_DEPTH` at 0.60, both inside the band that was asked for.
 *
 * NOW 3.4 METRES, DOWN FROM TWELVE. Twelve was set when the complaint was that
 * the cast could not be seen at all from the overview; it fixed that by making
 * everybody nearly seven times life size, which is why an employee met no piece
 * of the park's furniture at the hip. The distance problem is not solved by
 * this number at all — it is solved by `figureLegibility.ts`, whose ceiling is
 * a world height in metres, so a distant employee holds exactly the same number
 * of pixels at 3.4 as at 12. What shrinking back to 3.4 buys is everything the
 * near and middle views were paying for: a person who fits a ride seat, a
 * boarding stair and a café chair instead of towering over all three.
 *
 * At 3.4 m an employee is about twice a real person, which is what keeps them
 * unmistakable next to a 105 m Drop Tower without being absurd beside a 2.1 m
 * doorway.
 */
export const EMPLOYEE_HEIGHT = 3.4 * METRE;

/**
 * The bounding box the whole cast is drawn at. Height is exact by
 * construction; the other two are what uniform scaling of a human silhouette
 * produces, and are measured from the real rig by the verify suite rather than
 * asserted here.
 */
/*
 * The requested bounding box, as PROPORTIONS of the height rather than as
 * metres.
 *
 * The brief that set these asked for "4.0 x 0.9 x 0.7" — one box, at one
 * height. Written as bare metres they silently stopped meaning anything the
 * moment the height moved, which it has now done three times. Held as ratios of
 * EMPLOYEE_HEIGHT they keep saying what the brief actually said: a figure a
 * fifth as wide as it is tall, and a sixth as deep.
 */
export const EMPLOYEE_TARGET_WIDTH = EMPLOYEE_HEIGHT * (0.9 / 4.0);
export const EMPLOYEE_TARGET_DEPTH = EMPLOYEE_HEIGHT * (0.7 / 4.0);

/**
 * The one number every employee is multiplied by, on all three axes.
 *
 * Uniform, and identical for all thirty: no employee has a scale of their own,
 * so none can drift from the rest.
 */
export const EMPLOYEE_SCALE = EMPLOYEE_HEIGHT / HUMAN.height;

/**
 * Distances at which an employee stops being a person and becomes a data
 * marker. At true human scale a figure is under two metres tall, so beyond a
 * couple of hundred metres it covers well under a pixel — drawing limbs there
 * costs frame time and shows nothing. Past LOD_MID only the status marker is
 * drawn, which is also what makes the colour readable from the overview.
 */
export const LOD_NEAR = 70 * METRE;
export const LOD_MID = 220 * METRE;

/**
 * Radius of the floating status marker. Deliberately larger than the person:
 * it is not a body, it is the employee's check-in category rendered at a size
 * that survives distance.
 */
export const STATUS_MARKER_RADIUS = 1.15 * METRE;

/** A signboard a person reads while walking past it. */
export const SIGN = {
  boardWidth: 4.6 * METRE,
  boardHeight: 1.9 * METRE,
  /** Underside of the board — above head height, below the eye line. */
  boardBottom: 2.6 * METRE,
  postRadius: 0.09 * METRE,
};

/**
 * HOW MUCH BIGGER THE RIDE SEATS AND THE PARK BENCHES ARE DRAWN.
 *
 * The park's seating was modelled at real dimensions — a 0.82 m drop-tower pan,
 * a 0.92 m dragon cushion, a 0.34 m coaster bucket — for a real 1.75 m person.
 * The employees are drawn larger than that, so every seat read as child-sized
 * furniture beside them.
 *
 * IT IS THE EMPLOYEE'S OWN SCALE, not a chosen number. A seat is furniture a
 * person meets, and this project's rule is that anything a person meets derives
 * from EMPLOYEE_SCALE — the boarding stair's risers, its width and its
 * handrails already do. The seat does too, so an employee sits ON the seat at
 * any drawn height.
 *
 * The compromise this used to carry is gone. At the old 12 m figure the factor
 * was 6.86, which made every seat pan wider than the pitch it was set at, so a
 * ring of sixty seats read as one continuous bench. At 3.4 m it is 1.94, and
 * each ride's seats now fit inside their own pitch with daylight between
 * neighbours — helped further by every ride dropping from sixty seats to forty.
 * `scripts/verify-visibility.ts` measures the remaining clearances.
 */
export const RIDE_SEAT_SCALE = EMPLOYEE_SCALE;

/**
 * HOW MUCH A RIDE SEAT WAS LOWERED, as a fraction of its own height above the
 * floor of the vehicle carrying it.
 *
 * The user asked for every ride's seat to come down "approximately 10-15%" so
 * that a rider sits INTO the machine rather than perched on top of it, while
 * the ride's overall height, structure and proportions stay exactly as they
 * are. 12.5% is the middle of that band.
 *
 * It is applied in one place per ride — the height the seat group is mounted at
 * — and `simulation/journey/rideKinematics.ts` reads the same lowered mount, so
 * the seat a person is placed in is always the seat that is drawn. Nothing
 * else about any ride moves: the mast, the rim, the deck, the arms and the
 * track are all untouched.
 */
export const SEAT_LOWER_FRACTION = 0.125;

/** A seat mount that stood `height` above its vehicle floor, lowered. */
export function loweredSeatMount(height: number): number {
  return height * (1 - SEAT_LOWER_FRACTION);
}
