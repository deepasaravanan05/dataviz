/**
 * Dimensions and palette for the Monster Ride.
 *
 * Colours are sampled from the reference "Parkitect Mod - Monster Ride" by
 * SirMaverick34 (Sketchfab): a dark-brown timber tower topped by a glowing
 * golden faceted sphere, pale-gray arched arms lined with white bulbs, and
 * brown tub gondolas with gold trim bands and red accent lamps.
 *
 * The reference declares no licence, so this is an original recreation in
 * Three.js — no asset is copied.
 */
export const PALETTE = {
  timber: "#6b4630",
  timberDark: "#4e3222",
  gold: "#d4a12a",
  goldDark: "#9c7418",
  sphere: "#e8b93a",
  steel: "#b9bec6",
  steelDark: "#878d96",
  bulb: "#fff4d6",
  redLamp: "#e0342c",
  tub: "#7a5236",
  tubDark: "#563723",
  seatFrame: "#3f3126",
  shirt: "#3b82f6",
  skin: "#f1c27d",
} as const;

/** Five arms, four gondolas each, three seats per gondola = 60 seats. */
export const ARM_COUNT = 5;
export const GONDOLAS_PER_ARM = 4;
export const SEATS_PER_GONDOLA = 3;
export const SEAT_COUNT = ARM_COUNT * GONDOLAS_PER_ARM * SEATS_PER_GONDOLA;

/** Central structure. */
export const TOWER_HEIGHT = 13;
export const TOWER_RADIUS = 1.8;
export const SPHERE_RADIUS = 2.1;
export const BASE_RADIUS = 5.2;
export const BASE_HEIGHT = 1.1;

/** Arms: attach near the top of the tower and arch out and down. */
export const ARM_ATTACH_HEIGHT = 9.4;
export const ARM_LENGTH = 14.5;
export const ARCH_RISE = 4.2;
export const ARM_END_DROP = 5.6;
export const ARM_BULBS = 15;

/** Spider carrying the gondolas at the end of each arm. */
export const SPIDER_RADIUS = 4.3;
export const GONDOLA_RADIUS = 1.55;
export const GONDOLA_HEIGHT = 1.25;

/** Motion (radians per second / cycle rates). */
export const HUB_SPIN = 0.22;
export const SPIDER_SPIN = 0.55;
export const UNDULATION_RATE = 0.85;

/**
 * The arm's tilt oscillates in [CENTER - SWING, CENTER + SWING]. This range
 * is NOT symmetric about level (0): with this arm geometry, tilting to -6deg
 * already brings a cart to within ~0.94 world units of the ground and -6.8deg
 * is the exact point it touches ground+0.75 clearance (see
 * groundClearance.ts), so the low end sits at -6deg for margin while the
 * high end is free to swing further, giving a visibly larger "up" excursion
 * than "down" — which also reads as more physically correct, since a real
 * arm ride's downswing is the one constrained by the ground.
 */
export const UNDULATION_CENTER_TILT = (7 * Math.PI) / 180;
export const UNDULATION_SWING = (13 * Math.PI) / 180;

/** Where the ride sits relative to the Ferris Wheel at the park origin. */
export const MONSTER_ORIGIN: [number, number, number] = [8, 0, 50];

/** Overall horizontal reach, used for clearance checks against other rides. */
export const RIDE_REACH = ARM_LENGTH + SPIDER_RADIUS + GONDOLA_RADIUS;
