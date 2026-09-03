import { CUP_COUNT, CUP_PITCH_RADIANS, CUP_RADIUS, CUP_RING_RADIUS, cupColor } from "./constants";

/**
 * WHERE THE SIX CUPS ARE, solved once.
 *
 * This is the array the plate maps over and the array the verify script
 * sweeps, so a cup that is checked is a cup that is drawn — the arrangement
 * every other ring in this park uses. There is no second copy of the
 * arithmetic to drift out of step with the first.
 *
 * The coordinates are in the PLATE's own frame, before its rotation: the ring
 * as it is built. Where a cup is at any moment is that position turned by the
 * plate's angle.
 */

export interface CupPlacement {
  index: number;
  /** Angle around the ring. Cup 0 sits on +X. */
  azimuth: number;
  /** The cup's centre, in the plate's frame: [x, z]. */
  position: [number, number];
  /** This cup's glaze. */
  color: string;
}

export const CUP_PLACEMENTS: CupPlacement[] = Array.from({ length: CUP_COUNT }, (_, index) => {
  const azimuth = index * CUP_PITCH_RADIANS;
  return {
    index,
    azimuth,
    position: [Math.cos(azimuth) * CUP_RING_RADIUS, Math.sin(azimuth) * CUP_RING_RADIUS],
    color: cupColor(index),
  };
});

/** Centre-to-centre distance between two neighbouring cups. */
export function neighbourGap(): number {
  const a = CUP_PLACEMENTS[0].position;
  const b = CUP_PLACEMENTS[1].position;
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** The clear air between two neighbouring cups, rim to rim. */
export function neighbourClearance(): number {
  return neighbourGap() - CUP_RADIUS * 2;
}
