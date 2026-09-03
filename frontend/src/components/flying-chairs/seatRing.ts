import {
  CANOPY_SOFFIT_Y,
  CHAIN_LENGTH,
  FLARE_ANGLE,
  FOOTREST_DROP,
  HANGER_RADIUS,
  SEAT_COUNT,
  SEAT_PITCH_RADIANS,
} from "./constants";

/**
 * Where the twenty chairs are.
 *
 * The single source of the ring: `FlyingChairs` renders one chair per entry
 * and the verify script sweeps the same array, so the chairs that are checked
 * are literally the chairs that are drawn. There is no second copy of the
 * arithmetic to drift out of step with the first.
 *
 * These positions are in the RIDE's own frame, before the turntable's rotation
 * is applied — the ring as it is built. Where a chair is at a given moment is
 * that position turned by the ride's angle, which is what the direction check
 * in the verify script does.
 */

export interface SeatPlacement {
  index: number;
  /** Angle around the ring. Chair 0 sits on +X. */
  azimuth: number;
  /** The hanger bolted under the canopy: [x, y, z]. */
  hanger: [number, number, number];
  /** The chair itself, flown out at the solved flare: [x, y, z]. */
  seat: [number, number, number];
  /** Lowest point of the chair — the underside of the footrest. */
  lowestY: number;
}

const flightRadius = HANGER_RADIUS + CHAIN_LENGTH * Math.sin(FLARE_ANGLE);
const flightY = CANOPY_SOFFIT_Y - CHAIN_LENGTH * Math.cos(FLARE_ANGLE);

export const SEAT_PLACEMENTS: SeatPlacement[] = Array.from(
  { length: SEAT_COUNT },
  (_, index) => {
    const azimuth = index * SEAT_PITCH_RADIANS;
    const cos = Math.cos(azimuth);
    const sin = Math.sin(azimuth);
    return {
      index,
      azimuth,
      hanger: [HANGER_RADIUS * cos, CANOPY_SOFFIT_Y, HANGER_RADIUS * sin],
      seat: [flightRadius * cos, flightY, flightRadius * sin],
      lowestY: flightY - FOOTREST_DROP,
    };
  },
);

/** Straight-line distance between two neighbouring chairs on the ring. */
export function neighbourGap(): number {
  const a = SEAT_PLACEMENTS[0].seat;
  const b = SEAT_PLACEMENTS[1].seat;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
