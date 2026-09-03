import {
  FOOTREST_DROP,
  SAUCER_RADIUS,
  SEAT_COUNT,
  SEAT_MOUNT_DROP,
  SEAT_PITCH_RADIANS,
  SEAT_SCALE,
  SEAT_WIDTH,
  seatColor,
} from "./constants";

/**
 * THE TWENTY-FOUR SEATS, SOLVED ONCE.
 *
 * This is the array the saucer maps over, so a seat that is checked here is a
 * seat that is drawn — there is no second, parallel description of the ring
 * anywhere for the two to drift apart.
 *
 * Every seat hangs under the rim at the same radius and the same drop, facing
 * straight outward. That is what a UFO pendulum's gondola does and it is also
 * what makes the ride legible: twenty-four riders all facing away from the
 * hub read as a ring of people, where twenty-four facing inward read as a
 * huddle.
 *
 * The coordinates are in the SAUCER's own frame — origin at the hub, +Y up
 * through the dome — so they are unaffected by where the arm happens to be.
 * The saucer's frame is carried by the arm and the arm by the swing, which is
 * exactly how the real machine stacks up.
 */

export interface SeatPlacement {
  index: number;
  /** Where round the rim, measured from the saucer's local +Z. */
  azimuth: number;
  /** Seat centre, in the saucer's own frame. */
  position: [number, number, number];
  /** This seat's livery. */
  color: string;
}

/**
 * Set in from the rim by half a seat, so the chair hangs UNDER the hull edge
 * rather than off the end of it — a seat cantilevered past the rim has
 * nothing above it and reads as floating.
 */
const SEAT_RADIUS = SAUCER_RADIUS - (SEAT_WIDTH * SEAT_SCALE) / 2;

export const SEAT_PLACEMENTS: SeatPlacement[] = Array.from(
  { length: SEAT_COUNT },
  (_, index) => {
    const azimuth = index * SEAT_PITCH_RADIANS;
    return {
      index,
      azimuth,
      position: [
        Math.sin(azimuth) * SEAT_RADIUS,
        -SEAT_MOUNT_DROP,
        Math.cos(azimuth) * SEAT_RADIUS,
      ] as [number, number, number],
      color: seatColor(index),
    };
  },
);

/** How far apart two neighbouring seats sit, centre to centre. */
export function neighbourGap(): number {
  const a = SEAT_PLACEMENTS[0].position;
  const b = SEAT_PLACEMENTS[1].position;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** The lowest point of a seat, in the saucer's frame — its footrest. */
export const SEAT_LOWEST_Y = -SEAT_MOUNT_DROP - FOOTREST_DROP * SEAT_SCALE;
