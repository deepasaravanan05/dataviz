import type { SeatColor } from "@/types/simulation";
import { CAR_COUNT, SEAT_COUNT, SEATS_PER_CAR } from "./constants";

/** Same employee-status palette as the Ferris Wheel. */
export const SEAT_COLOR_HEX: Record<SeatColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

const PATTERN: SeatColor[] = ["GREEN", "YELLOW", "RED"];

export interface SeatSpec {
  index: number;
  car: number;
  /** 0 = front row, 1 = rear row. */
  row: number;
  /** -1 = left, +1 = right. */
  side: number;
  color: SeatColor;
}

/**
 * 60 seats across 15 cars (4 per car, matching the reference's 2x2 layout).
 * The colour cycles Green -> Yellow -> Red across the whole train, so with 4
 * seats per car the pattern shifts car to car and never clumps.
 */
export const SEATS: SeatSpec[] = Array.from({ length: SEAT_COUNT }, (_, index) => {
  const car = Math.floor(index / SEATS_PER_CAR);
  const withinCar = index % SEATS_PER_CAR;
  return {
    index,
    car,
    row: Math.floor(withinCar / 2),
    side: withinCar % 2 === 0 ? -1 : 1,
    color: PATTERN[index % PATTERN.length],
  };
});

export function seatsForCar(car: number): SeatSpec[] {
  return SEATS.filter((s) => s.car === car);
}

export function countSeatColor(color: SeatColor): number {
  return SEATS.filter((s) => s.color === color).length;
}

/** Dev-time validation of the 60 / 20-20-20 requirement. */
export function validateSeats(): void {
  const green = countSeatColor("GREEN");
  const yellow = countSeatColor("YELLOW");
  const red = countSeatColor("RED");

  console.assert(
    SEATS.length === SEAT_COUNT,
    `Expected exactly ${SEAT_COUNT} coaster seats, found ${SEATS.length}`,
  );
  console.assert(SEAT_COUNT === 60, `Seat total must be 60, got ${SEAT_COUNT}`);
  console.assert(green === 20, `Expected 20 green seats, found ${green}`);
  console.assert(yellow === 20, `Expected 20 yellow seats, found ${yellow}`);
  console.assert(red === 20, `Expected 20 red seats, found ${red}`);
  console.assert(
    green + yellow + red === 60,
    `Seat colours sum to ${green + yellow + red}, expected 60`,
  );
  console.assert(
    CAR_COUNT * SEATS_PER_CAR === 60,
    `${CAR_COUNT} cars x ${SEATS_PER_CAR} seats != 60`,
  );
}
