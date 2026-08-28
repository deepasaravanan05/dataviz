import type { Seat, SeatColor } from "@/types/simulation";
import { createRide } from "@/simulation/ride";
import { DELAY_THRESHOLDS, classifyDelay } from "@/simulation/classification";
import { PARK_START_MINUTES, formatSimTime } from "@/simulation/clock";
import { SEAT_COUNT } from "./constants";

/**
 * Seat manifest for the Drop Tower.
 *
 * No new seat-colour or dispatch system is introduced. The seat ids and the
 * GREEN / YELLOW / RED allocation bands come straight out of the park's
 * existing `createRide()` factory, and every rider's colour is produced by the
 * existing `classifyDelay()` against the existing `DELAY_THRESHOLDS`. This
 * module only decides which seat sits at which angle around the gondola.
 *
 * The ring now carries SEAT_COUNT = 40 rather than 60, so the cycle below draws
 * 14 / 13 / 13 out of `createRide()`'s pools instead of 20 / 20 / 20. The
 * factory itself is untouched.
 *
 * This deliberately mirrors the Dragon Ride's manifest rather than sharing a
 * helper with it: refactoring that ride's module would mean editing an existing
 * attraction, which this task forbids.
 */

export const RIDE_DEFINITION = createRide();

export const RIDE_CAPACITY = RIDE_DEFINITION.capacity;
export const RIDE_MIN_START_COUNT = RIDE_DEFINITION.minStartCount;
export const RIDE_MAX_WAIT_MINUTES = RIDE_DEFINITION.maxWaitMinutes;
export const RIDE_RUN_DURATION_MINUTES = RIDE_DEFINITION.runDurationMinutes;

export const SEAT_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

export interface TowerRider {
  seatId: string;
  seatColor: SeatColor;
  /** Index around the ring, 0..SEAT_COUNT-1. */
  seatIndex: number;
  employeeId: string;
  checkInTime: number;
  boardTime: number;
  /** This is a department ride, so work starts once the ride completes. */
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

/** Delay ranges that classify to each colour under the EXISTING thresholds. */
const DELAY_BANDS: Record<SeatColor, [number, number]> = {
  GREEN: [2, DELAY_THRESHOLDS.greenMax],
  YELLOW: [DELAY_THRESHOLDS.greenMax + 1, DELAY_THRESHOLDS.yellowMax],
  RED: [DELAY_THRESHOLDS.yellowMax + 1, DELAY_THRESHOLDS.yellowMax + 28],
};

/**
 * Colours cycle seat by seat around the ring, so no two neighbours share one —
 * the opposite of three large coloured sections. Nothing is PAINTED with them:
 * every seat on the ring is grey, and the band only decides allocation order.
 */
const COLOR_CYCLE: SeatColor[] = ["GREEN", "YELLOW", "RED"];

function buildRiders(): TowerRider[] {
  const rand = mulberry32(0x40b1);

  const pools: Record<SeatColor, Seat[]> = {
    GREEN: RIDE_DEFINITION.seats.filter((s) => s.color === "GREEN"),
    YELLOW: RIDE_DEFINITION.seats.filter((s) => s.color === "YELLOW"),
    RED: RIDE_DEFINITION.seats.filter((s) => s.color === "RED"),
  };
  const taken: Record<SeatColor, number> = { GREEN: 0, YELLOW: 0, RED: 0 };

  return Array.from({ length: SEAT_COUNT }, (_, i) => {
    const color = COLOR_CYCLE[i % COLOR_CYCLE.length];
    const seat = pools[color][taken[color]++];

    const [lo, hi] = DELAY_BANDS[color];
    const delayMinutes = lo + Math.round(rand() * (hi - lo));
    const checkInTime = PARK_START_MINUTES + Math.round(rand() * 45);
    const workStartTime = checkInTime + delayMinutes;
    const boardTime = checkInTime + Math.max(1, Math.round(delayMinutes * 0.55));

    return {
      seatId: seat.id,
      seatColor: seat.color,
      seatIndex: i,
      employeeId: `EMP${(i + 1).toString().padStart(3, "0")}`,
      checkInTime,
      boardTime,
      workStartTime,
      delayMinutes,
    };
  });
}

export const TOWER_RIDERS: TowerRider[] = buildRiders();

export function countSeatColor(color: SeatColor): number {
  return TOWER_RIDERS.filter((r) => r.seatColor === color).length;
}

/** "EMP014 / CHECK-IN: 9:12 AM / BOARD: 9:20 AM / WORK START: 9:26 AM / DELAY: 14 MIN" */
export function riderLabelLines(rider: TowerRider): string[] {
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
    TOWER_RIDERS.length === SEAT_COUNT,
    `Expected ${SEAT_COUNT} drop-tower riders, found ${TOWER_RIDERS.length}`,
  );
  console.assert(
    TOWER_RIDERS.every((r) => classifyDelay(r.delayMinutes) === r.seatColor),
    "A rider's delay does not classify to the colour of the seat it was given",
  );
  console.assert(
    new Set(TOWER_RIDERS.map((r) => r.seatId)).size === TOWER_RIDERS.length,
    "Two riders were assigned the same seat",
  );
}
