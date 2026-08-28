import type { SeatColor } from "@/types/simulation";
import { CABIN_COUNT, WHEEL_RADIUS, RIM_TUBE_RADIUS } from "./constants";

/** Exact palette required by the spec (§5, §22) — do not darken. */
export const CABIN_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

/** Repeating Green -> Yellow -> Red so colors never clump (§6). */
const PATTERN: SeatColor[] = ["GREEN", "YELLOW", "RED"];

/** 40 cabins over 360 degrees = exactly 9 degrees of separation. */
export const ANGLE_STEP = (Math.PI * 2) / CABIN_COUNT;

/** Cabins hang just inside the outer rim so the arm meets the rim (§8). */
export const CABIN_RADIUS = WHEEL_RADIUS - RIM_TUBE_RADIUS;

export interface CabinSpec {
  index: number;
  color: SeatColor;
  angle: number;
  /** Mount point on the rim, in the wheel assembly's local space. */
  mount: [number, number, number];
}

/**
 * The single source of truth for all 40 cabins. Positions are computed
 * mathematically from the index — never hand-placed or randomized (§7), so
 * changing CABIN_COUNT re-spaces the ring evenly and nothing else has to move.
 */
export const CABINS: CabinSpec[] = Array.from({ length: CABIN_COUNT }, (_, index) => {
  const angle = index * ANGLE_STEP;
  return {
    index,
    color: PATTERN[index % PATTERN.length],
    angle,
    mount: [CABIN_RADIUS * Math.cos(angle), CABIN_RADIUS * Math.sin(angle), 0],
  };
});

export function countByColor(color: SeatColor): number {
  return CABINS.filter((c) => c.color === color).length;
}

/** Dev-time validation of the cabin count and its even colour allocation. */
export function validateCabins(): void {
  const green = countByColor("GREEN");
  const yellow = countByColor("YELLOW");
  const red = countByColor("RED");

  console.assert(
    CABINS.length === CABIN_COUNT,
    `Expected exactly ${CABIN_COUNT} cabins, found ${CABINS.length}`,
  );
  console.assert(
    CABIN_COUNT >= 30 && CABIN_COUNT <= 40,
    `A ride must carry 30-40 seats, this one carries ${CABIN_COUNT}`,
  );
  console.assert(
    green + yellow + red === CABIN_COUNT,
    `Color totals ${green + yellow + red} do not sum to ${CABIN_COUNT}`,
  );
  console.assert(
    Math.max(green, yellow, red) - Math.min(green, yellow, red) <= 1,
    `The three allocation bands are uneven: ${green} / ${yellow} / ${red}`,
  );
}
