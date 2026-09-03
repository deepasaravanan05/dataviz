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
 * 30 seats across 15 cars, a single 2-across row apiece.
 *
 * The colour cycles Green -> Yellow -> Red across the whole train, so with two
 * seats per car the pair in any one car is always two different bands and the
 * pattern never clumps.
 *
 * The colours are an ALLOCATION order, not a paint job: every seat in the park
 * is grey (see `world/seatColor.ts`), and what a band decides is which seat
 * `findFreeSeat()` reaches for first. Thirty divides by three exactly, so the
 * cycle lands 10 / 10 / 10 — the same rule as before, at the new count.
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

/** Dev-time validation of the 30-seat requirement. */
export function validateSeats(): void {
  const green = countSeatColor("GREEN");
  const yellow = countSeatColor("YELLOW");
  const red = countSeatColor("RED");

  console.assert(
    SEATS.length === SEAT_COUNT,
    `Expected exactly ${SEAT_COUNT} coaster seats, found ${SEATS.length}`,
  );
  console.assert(
    SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
    `Seat total must be 30-40, got ${SEAT_COUNT}`,
  );
  console.assert(
    green + yellow + red === SEAT_COUNT,
    `Seat colours sum to ${green + yellow + red}, expected ${SEAT_COUNT}`,
  );
  console.assert(
    Math.max(green, yellow, red) - Math.min(green, yellow, red) <= 1,
    `The three allocation bands are uneven: ${green} / ${yellow} / ${red}`,
  );
  console.assert(
    CAR_COUNT * SEATS_PER_CAR === SEAT_COUNT,
    `${CAR_COUNT} cars x ${SEATS_PER_CAR} seats != ${SEAT_COUNT}`,
  );
}
