import type { SeatColor } from "@/types/simulation";
import { classifyDelay } from "@/simulation/classification";
import { PARK_START_MINUTES, formatSimTime } from "@/simulation/clock";
import { ARM_COUNT, GONDOLAS_PER_ARM, SEATS_PER_GONDOLA, SEAT_COUNT } from "./constants";

export const SEAT_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

export interface Rider {
  seatIndex: number;
  arm: number;
  gondola: number;
  /** 0..2 within the gondola. */
  seat: number;
  employeeId: string;
  /** Minutes-of-day. */
  checkInTime: number;
  rideArrivalTime: number;
  workStartTime: number;
  delayMinutes: number;
  /** Derived from delayMinutes via the simulation's own classifier. */
  color: SeatColor;
}

/** Deterministic PRNG so the roster is stable across reloads. */
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
 * Builds the 60-rider roster.
 *
 * Delays are drawn from three bands sized 20/20/20 that straddle the
 * simulation's configured thresholds (<=15 green, <=30 yellow, >30 red), so
 * running each rider's delay through the real classifyDelay() yields exactly
 * twenty of each colour rather than a hard-coded pattern.
 *
 * Seats are then interleaved so every gondola carries one green, one yellow
 * and one red rider — the colours are never grouped.
 */
function buildRiders(): Rider[] {
  const rand = mulberry32(0x4d0e5731);
  const bands: Array<[number, number]> = [
    [3, 15], // green band
    [17, 30], // yellow band
    [32, 58], // red band
  ];

  const pools: Rider[][] = bands.map((band, bandIndex) =>
    Array.from({ length: SEAT_COUNT / 3 }, (_, i) => {
      const [lo, hi] = band;
      const delayMinutes = Math.round(lo + rand() * (hi - lo));
      const checkInTime = PARK_START_MINUTES + Math.round(rand() * 45);
      const workStartTime = checkInTime + delayMinutes;
      // Riders reach this ride part-way through their delay.
      const rideArrivalTime = checkInTime + Math.round(delayMinutes * 0.55);
      return {
        seatIndex: -1,
        arm: -1,
        gondola: -1,
        seat: bandIndex,
        employeeId: `EMP${(bandIndex * 20 + i + 1).toString().padStart(3, "0")}`,
        checkInTime,
        rideArrivalTime,
        workStartTime,
        delayMinutes,
        color: classifyDelay(delayMinutes),
      };
    }),
  );

  const riders: Rider[] = [];
  let gondolaOrdinal = 0;

  for (let arm = 0; arm < ARM_COUNT; arm++) {
    for (let gondola = 0; gondola < GONDOLAS_PER_ARM; gondola++) {
      for (let seat = 0; seat < SEATS_PER_GONDOLA; seat++) {
        const base = pools[seat][gondolaOrdinal];
        riders.push({
          ...base,
          seatIndex: riders.length,
          arm,
          gondola,
          seat,
        });
      }
      gondolaOrdinal++;
    }
  }

  return riders;
}

export const RIDERS: Rider[] = buildRiders();

export function ridersForGondola(arm: number, gondola: number): Rider[] {
  return RIDERS.filter((r) => r.arm === arm && r.gondola === gondola);
}

export function countRiderColor(color: SeatColor): number {
  return RIDERS.filter((r) => r.color === color).length;
}

/** "EMP027 / IN 09:07 / RIDE 09:19 / DELAY 12 MIN" */
export function riderLabelLines(rider: Rider): string[] {
  return [
    rider.employeeId,
    `IN: ${formatSimTime(rider.checkInTime)}`,
    `RIDE: ${formatSimTime(rider.rideArrivalTime)}`,
    `DELAY: ${rider.delayMinutes} MIN`,
  ];
}

/** Dev-time validation of the 60 / 20-20-20 requirement. */
export function validateRiders(): void {
  const green = countRiderColor("GREEN");
  const yellow = countRiderColor("YELLOW");
  const red = countRiderColor("RED");

  console.assert(RIDERS.length === 60, `Expected 60 riders, found ${RIDERS.length}`);
  console.assert(green === 20, `Expected 20 green riders, found ${green}`);
  console.assert(yellow === 20, `Expected 20 yellow riders, found ${yellow}`);
  console.assert(red === 20, `Expected 20 red riders, found ${red}`);
  console.assert(
    RIDERS.every((r) => r.color === classifyDelay(r.delayMinutes)),
    "A rider's seat colour disagrees with classifyDelay()",
  );
}
