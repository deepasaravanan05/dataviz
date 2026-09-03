import { SWEEP_BUDGET, VEHICLE_COUNT, ARM_PITCH_RADIANS, howdahColor } from "./constants";

/**
 * WHERE THE SIXTEEN ARMS ARE, AND HOW EACH ONE IS FLOWN — solved once.
 *
 * This is the array the ride maps over and the array the verify script sweeps,
 * so an arm that is checked is an arm that is drawn.
 *
 * THE ARMS are the easy half: sixteen of them, evenly round the hub.
 *
 * THE FLYING is the half that makes a Dumbo a Dumbo. Sixteen riders work
 * sixteen levers, so no two elephants should ever be at the same height — but
 * they all have to be DOWN at the start of the run and down again at the end
 * of it, because that is what the arms coming to rest on the gallery means.
 * Both at once leaves exactly one shape of answer: every vehicle flies a whole
 * number of sweeps over the run, and the variety between them is in HOW MANY
 * and HOW HIGH rather than in a phase offset.
 *
 * So the ring is dealt alternately: the odd arms take ONE long climb to near
 * the top, the even arms PUMP TWICE at a little over half the height. Within
 * each of those two groups the amplitudes are then fanned out so that no two
 * vehicles anywhere on the ride share one. Every allowance is scaled by
 * SWEEP_BUDGET, the hydraulic limit from constants.ts, so no rider can outfly
 * the machine however the deal comes out.
 */

export interface ArmPlacement {
  index: number;
  /** Angle around the hub. Arm 0 points along +X. */
  azimuth: number;
  /** How many complete up-and-downs this rider takes during the run. */
  sweeps: number;
  /** How high they take it, as a fraction of the full excursion. */
  amplitude: number;
  /** This vehicle's howdah livery. */
  color: string;
}

/** The tallest sweep of `k` climbs the hydraulics will allow. */
export function maxAmplitude(sweeps: number): number {
  return Math.min(1, SWEEP_BUDGET / sweeps);
}

export const ARM_PLACEMENTS: ArmPlacement[] = Array.from(
  { length: VEHICLE_COUNT },
  (_, index) => {
    const sweeps = (index % 2) + 1;
    /* Position within this vehicle's own group, so the fan covers each group
       evenly rather than the ring as a whole. */
    const groupSize = VEHICLE_COUNT / 2;
    const withinGroup = Math.floor(index / 2);
    const fan = 0.62 + 0.38 * (withinGroup / (groupSize - 1));
    return {
      index,
      azimuth: index * ARM_PITCH_RADIANS,
      sweeps,
      amplitude: maxAmplitude(sweeps) * fan,
      color: howdahColor(index),
    };
  },
);

/** Straight-line distance between two neighbouring vehicles on the ring. */
export function neighbourGap(radius: number): number {
  return 2 * radius * Math.sin(ARM_PITCH_RADIANS / 2);
}
