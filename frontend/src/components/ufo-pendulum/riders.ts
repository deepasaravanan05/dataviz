import type { Seat, SeatColor } from "@/types/simulation";
import { createRide } from "@/simulation/ride";
import { DELAY_THRESHOLDS, classifyDelay } from "@/simulation/classification";
import { PARK_START_MINUTES, formatSimTime } from "@/simulation/clock";
import { SEAT_COUNT } from "./constants";

/**
 * Seat manifest for the UFO Pendulum.
 *
 * IMPORTANT — no new seat-colour or dispatch system is introduced here, for
 * exactly the reason the Dragon Ship's manifest says the same thing. The seat
 * ids and their GREEN / YELLOW / RED allocation bands come straight out of the
 * park's existing `createRide()` factory, and every rider's colour is produced
 * by the existing `classifyDelay()` against the existing `DELAY_THRESHOLDS`.
 * This module only decides which of those existing seats sits where on the rim
 * and what its floating time label reads.
 *
 * The ride took this obligation over from the Drop Tower along with the
 * department: a department ride in this park declares its thirty-odd seats in
 * three even bands, and `verify-park-scale.ts` checks that every one of them
 * does.
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

export interface UfoRider {
  seatId: string;
  seatColor: SeatColor;
  /** Which seat round the rim, 0 at the saucer's local +Z. */
  index: number;
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
 * The allocation cycle, running seat by seat round the rim.
 *
 * Cycling over the seat index keeps the three bands even at any seat count —
 * at thirty it lands exactly 10 / 10 / 10 — and no two neighbours round the
 * ring share a band, so the allocation is visible as an alternation rather
 * than as three blocks.
 *
 * Nothing is PAINTED with these: every seat pan on the saucer is the park's
 * grey, and the band only decides which seat is handed out first.
 */
const COLOR_CYCLE: SeatColor[] = ["GREEN", "YELLOW", "RED"];

function buildRiders(): UfoRider[] {
  const rand = mulberry32(0x0f0d);

  const pools: Record<SeatColor, Seat[]> = {
    GREEN: RIDE_DEFINITION.seats.filter((s) => s.color === "GREEN"),
    YELLOW: RIDE_DEFINITION.seats.filter((s) => s.color === "YELLOW"),
    RED: RIDE_DEFINITION.seats.filter((s) => s.color === "RED"),
  };
  const taken: Record<SeatColor, number> = { GREEN: 0, YELLOW: 0, RED: 0 };

  const riders: UfoRider[] = [];
  for (let index = 0; index < SEAT_COUNT; index++) {
    const color = COLOR_CYCLE[index % COLOR_CYCLE.length];
    const seat = pools[color][taken[color]++];

    const [lo, hi] = DELAY_BANDS[color];
    const delayMinutes = lo + Math.round(rand() * (hi - lo));
    const checkInTime = PARK_START_MINUTES + Math.round(rand() * 45);
    const workStartTime = checkInTime + delayMinutes;
    /* Boarding happens partway through the delay, before work actually starts. */
    const boardTime = checkInTime + Math.max(1, Math.round(delayMinutes * 0.55));

    riders.push({
      seatId: seat.id,
      seatColor: seat.color,
      index,
      employeeId: `EMP${(riders.length + 1).toString().padStart(3, "0")}`,
      checkInTime,
      boardTime,
      workStartTime,
      delayMinutes,
    });
  }
  return riders;
}

export const UFO_RIDERS: UfoRider[] = buildRiders();

export function countSeatColor(color: SeatColor): number {
  return UFO_RIDERS.filter((r) => r.seatColor === color).length;
}

/** "EMP014 / CHECK-IN: 9:12 AM / BOARD: 9:20 AM / WORK START: 9:26 AM / DELAY: 14 MIN" */
export function riderLabelLines(rider: UfoRider): string[] {
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
    UFO_RIDERS.length === SEAT_COUNT,
    `Expected ${SEAT_COUNT} UFO riders, found ${UFO_RIDERS.length}`,
  );
  console.assert(
    UFO_RIDERS.every((r) => classifyDelay(r.delayMinutes) === r.seatColor),
    "A rider's delay does not classify to the colour of the seat it was given",
  );
  console.assert(
    new Set(UFO_RIDERS.map((r) => r.seatId)).size === UFO_RIDERS.length,
    "Two riders were assigned the same seat",
  );
}
