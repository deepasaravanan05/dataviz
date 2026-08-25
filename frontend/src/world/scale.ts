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

  /** Pedestrian ways. */
  footpathWidth: 4.0 * METRE,
  promenadeWidth: 18.0 * METRE,
  roadLaneWidth: 3.5 * METRE,

  /** A turnstile lane at a gate. */
  turnstileLaneWidth: 1.1 * METRE,
  turnstileHeight: 1.05 * METRE,
};

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
