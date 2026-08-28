import type { Seat, SeatColor } from "@/types/simulation";
import { createRide } from "@/simulation/ride";
import { DELAY_THRESHOLDS, classifyDelay } from "@/simulation/classification";
import { PARK_START_MINUTES, formatSimTime } from "@/simulation/clock";
import { SEATS_PER_ROW, SEAT_ROWS } from "./constants";

/**
 * Seat manifest for the Dragon Swing Ship.
 *
 * IMPORTANT — no new seat-colour or dispatch system is introduced here. The
 * seat ids and their GREEN / YELLOW / RED allocation bands all come straight
 * out of the park's existing `createRide()` factory, and every
 * rider's colour is produced by the existing `classifyDelay()` using the
 * existing `DELAY_THRESHOLDS`. This module only decides where each of those
 * existing seats sits inside the hull and what its floating time label reads.
 */

/** The live ride definition from the existing simulation module. */
export const RIDE_DEFINITION = createRide();

/** Re-exported so the UI shows the real numbers, not copies of them. */
export const RIDE_CAPACITY = RIDE_DEFINITION.capacity;
export const RIDE_MIN_START_COUNT = RIDE_DEFINITION.minStartCount;
export const RIDE_MAX_WAIT_MINUTES = RIDE_DEFINITION.maxWaitMinutes;
export const RIDE_RUN_DURATION_MINUTES = RIDE_DEFINITION.runDurationMinutes;

export const SEAT_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

export interface DragonRider {
  seatId: string;
  seatColor: SeatColor;
  /** Position in the hull. */
  row: number;
  col: number;
  employeeId: string;
  checkInTime: number;
  boardTime: number;
  /** This IS a department ride, so work starts once the ride completes. */
  workStartTime: number;
  delayMinutes: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Delay ranges that classify to each colour under the EXISTING thresholds.
 * Derived from DELAY_THRESHOLDS rather than hard-coded, so if the park ever
 * retunes its thresholds these riders follow automatically.
 */
const DELAY_BANDS: Record<SeatColor, [number, number]> = {
  GREEN: [2, DELAY_THRESHOLDS.greenMax],
  YELLOW: [DELAY_THRESHOLDS.greenMax + 1, DELAY_THRESHOLDS.yellowMax],
  RED: [DELAY_THRESHOLDS.yellowMax + 1, DELAY_THRESHOLDS.yellowMax + 28],
};

/**
 * The allocation cycle, running seat by seat across the whole deck rather than
 * column by column.
 *
 * Cycling over the flat seat index is what keeps the three bands even at ANY
 * seat count: at the deck's 40 seats it lands 14 / 13 / 13, where a fixed
 * six-column pattern truncated to four columns would have given 20 / 10 / 10
 * and drained one of `createRide()`'s pools dry. No two neighbours in a row
 * share a band, and consecutive rows are offset by one, so the interleaving the
 * old pattern gave is kept.
 *
 * Nothing is PAINTED with these: every seat on the deck is grey, and the band
 * only decides which seat is handed out first.
 */
const COLOR_CYCLE: SeatColor[] = ["GREEN", "YELLOW", "RED"];

function buildRiders(): DragonRider[] {
  const rand = mulberry32(0xd2a6);

  // Pools of the real seat objects, grouped by the colour createRide() gave them.
  const pools: Record<SeatColor, Seat[]> = {
    GREEN: RIDE_DEFINITION.seats.filter((s) => s.color === "GREEN"),
    YELLOW: RIDE_DEFINITION.seats.filter((s) => s.color === "YELLOW"),
    RED: RIDE_DEFINITION.seats.filter((s) => s.color === "RED"),
  };
  const taken: Record<SeatColor, number> = { GREEN: 0, YELLOW: 0, RED: 0 };

  const riders: DragonRider[] = [];

  for (let row = 0; row < SEAT_ROWS; row++) {
    for (let col = 0; col < SEATS_PER_ROW; col++) {
      const color = COLOR_CYCLE[(row * SEATS_PER_ROW + col) % COLOR_CYCLE.length];
      const seat = pools[color][taken[color]++];

      const [lo, hi] = DELAY_BANDS[color];
      const delayMinutes = lo + Math.round(rand() * (hi - lo));
      const checkInTime = PARK_START_MINUTES + Math.round(rand() * 45);
      const workStartTime = checkInTime + delayMinutes;
      // Boarding happens partway through the delay, before work actually starts.
      const boardTime = checkInTime + Math.max(1, Math.round(delayMinutes * 0.55));

      riders.push({
        seatId: seat.id,
        // Colour comes from the existing ride system, and is cross-checked
        // against the existing classifier in validateRiders().
        seatColor: seat.color,
        row,
        col,
        employeeId: `EMP${(riders.length + 1).toString().padStart(3, "0")}`,
        checkInTime,
        boardTime,
        workStartTime,
        delayMinutes,
      });
    }
  }

  return riders;
}

export const DRAGON_RIDERS: DragonRider[] = buildRiders();

export function countSeatColor(color: SeatColor): number {
  return DRAGON_RIDERS.filter((r) => r.seatColor === color).length;
}

/** "EMP014 / CHECK-IN: 9:12 AM / BOARD: 9:20 AM / WORK START: 9:26 AM / DELAY: 14 MIN" */
export function riderLabelLines(rider: DragonRider): string[] {
  return [
    rider.employeeId,
    `CHECK-IN: ${formatSimTime(rider.checkInTime)}`,
    `BOARD: ${formatSimTime(rider.boardTime)}`,
    `WORK START: ${formatSimTime(rider.workStartTime)}`,
    `DELAY: ${rider.delayMinutes} MIN`,
  ];
}

export function validateRiders(): void {
  console.assert(
    DRAGON_RIDERS.length === SEAT_ROWS * SEATS_PER_ROW,
    `Expected ${SEAT_ROWS * SEATS_PER_ROW} dragon riders, found ${DRAGON_RIDERS.length}`,
  );
  console.assert(
    DRAGON_RIDERS.every((r) => classifyDelay(r.delayMinutes) === r.seatColor),
    "A rider's delay does not classify to the colour of the seat it was given",
  );
  console.assert(
    new Set(DRAGON_RIDERS.map((r) => r.seatId)).size === DRAGON_RIDERS.length,
    "Two riders were assigned the same seat",
  );
}
