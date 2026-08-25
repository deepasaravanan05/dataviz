import type { SeatColor } from "@/types/simulation";
import { classifyDelay } from "@/simulation/classification";
import { PARK_START_MINUTES, formatSimTime } from "@/simulation/clock";
import { CARRIAGE_COUNT, RIDER_COUNT, SEATS_PER_CARRIAGE } from "./constants";

export const SEAT_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

export interface TrainRider {
  seatIndex: number;
  carriage: number;
  /** 0..SEATS_PER_CARRIAGE-1 within the carriage. */
  seat: number;
  employeeId: string;
  checkInTime: number;
  trainBoardTime: number;
  /** Projected — the train ride itself does NOT count as work-started. */
  projectedWorkStartTime: number;
  projectedDelayMinutes: number;
  /** Provisional colour only (§5): the employee's real status is decided later. */
  provisionalColor: SeatColor;
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
 * Employees shown riding the train during their park-visit / delay period
 * (§5, §29 of the architecture spec). Business rule: none of these riders
 * has `WORK_STARTED` — that only happens later at their assigned department
 * ride, so `provisionalColor` is explicitly a projection, not a final status.
 */
function buildRiders(): TrainRider[] {
  const rand = mulberry32(0x7a1e7 ^ 0x1caf);
  const riders: TrainRider[] = [];

  for (let carriage = 0; carriage < CARRIAGE_COUNT; carriage++) {
    for (let seat = 0; seat < SEATS_PER_CARRIAGE; seat++) {
      const index = carriage * SEATS_PER_CARRIAGE + seat;
      const checkInTime = PARK_START_MINUTES + Math.round(rand() * 40);
      const projectedDelayMinutes = 4 + Math.round(rand() * 34);
      const trainBoardTime = checkInTime + Math.round(projectedDelayMinutes * 0.4);
      const projectedWorkStartTime = checkInTime + projectedDelayMinutes;

      riders.push({
        seatIndex: index,
        carriage,
        seat,
        employeeId: `EMP${(index + 1).toString().padStart(3, "0")}`,
        checkInTime,
        trainBoardTime,
        projectedWorkStartTime,
        projectedDelayMinutes,
        provisionalColor: classifyDelay(projectedDelayMinutes),
      });
    }
  }

  return riders;
}

export const TRAIN_RIDERS: TrainRider[] = buildRiders();

export function ridersForCarriage(carriage: number): TrainRider[] {
  return TRAIN_RIDERS.filter((r) => r.carriage === carriage);
}

/** "EMP027 / CHECK-IN: 09:07 / TRAIN: 09:12 / WORK START: 09:19 / DELAY: 12 MIN" */
export function riderLabelLines(rider: TrainRider): string[] {
  return [
    rider.employeeId,
    `CHECK-IN: ${formatSimTime(rider.checkInTime)}`,
    `TRAIN: ${formatSimTime(rider.trainBoardTime)}`,
    `WORK START: ${formatSimTime(rider.projectedWorkStartTime)}`,
    `DELAY: ${rider.projectedDelayMinutes} MIN`,
  ];
}

export function validateRiders(): void {
  console.assert(
    TRAIN_RIDERS.length === RIDER_COUNT,
    `Expected ${RIDER_COUNT} train riders, found ${TRAIN_RIDERS.length}`,
  );
  console.assert(
    TRAIN_RIDERS.every((r) => r.trainBoardTime >= r.checkInTime && r.trainBoardTime <= r.projectedWorkStartTime),
    "A rider's train-board time falls outside [check-in, projected work-start]",
  );
}
