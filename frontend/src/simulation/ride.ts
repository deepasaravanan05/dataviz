import type { Ride, Seat, SeatColor } from "@/types/simulation";

const SEAT_COLORS: SeatColor[] = ["GREEN", "YELLOW", "RED"];

/**
 * HOW MANY SEATS A RIDE HAS.
 *
 * FORTY, DOWN FROM SIXTY. Every ride in the park was asked for a realistic
 * capacity between thirty and forty, with forty preferred, and each one now
 * carries exactly that many physical seats — forty cabins on the Ferris Wheel,
 * ten coaster cars of four, forty around the Drop Tower's ring, ten rows of
 * four on the Dragon's deck, twenty Monster tubs of two, and four train cars of
 * ten. This is the simulation's own declaration of the same number, so what the
 * ride pages print as "capacity" is the seating that is actually there.
 *
 * The three bands divide it as evenly as forty divides by three: 14 / 13 / 13.
 * They are an ALLOCATION order and not a paint job — every seat in the park is
 * grey (see `world/seatColor.ts`) — so `findFreeSeat()` still hands out a
 * matching seat first and falls back exactly as it always has; there is simply
 * one fewer of each to hand out.
 */
export const SEAT_COUNT = 40;

export function createRide(): Ride {
  const seats: Seat[] = [];
  /* Dealt round-robin so the bands come out 14 / 13 / 13 rather than
     20 / 20 / 0 — the count no longer divides by three. */
  const taken: Record<SeatColor, number> = { GREEN: 0, YELLOW: 0, RED: 0 };
  for (let i = 0; i < SEAT_COUNT; i++) {
    const color = SEAT_COLORS[i % SEAT_COLORS.length];
    seats.push({
      id: `${color}-${++taken[color]}`,
      color,
      occupied: false,
      employeeId: null,
    });
  }
  return {
    id: "RIDE-OPERATIONS-01",
    name: "Pirate Ship",
    department: "Operations",
    capacity: SEAT_COUNT,
    minStartCount: 5,
    maxWaitMinutes: 18,
    runDurationMinutes: 4,
    seats,
    queue: [],
    queueFirstJoinedAt: null,
    status: "IDLE",
    runningRiders: [],
    runStartedAt: null,
    dispatchCount: 0,
  };
}

/**
 * Seat fallback policy (§31): prefer the employee's classified color, then
 * fall back to the nearest-severity seat, then any open seat, logging a
 * color-mismatch by returning a seat whose color differs from preferred.
 */
export function findFreeSeat(ride: Ride, preferredColor: SeatColor): Seat | null {
  const preferred = ride.seats.find((s) => !s.occupied && s.color === preferredColor);
  if (preferred) return preferred;

  const fallbackOrder: Record<SeatColor, SeatColor[]> = {
    GREEN: ["YELLOW", "RED"],
    YELLOW: ["GREEN", "RED"],
    RED: ["YELLOW", "GREEN"],
  };

  for (const color of fallbackOrder[preferredColor]) {
    const seat = ride.seats.find((s) => !s.occupied && s.color === color);
    if (seat) return seat;
  }

  return ride.seats.find((s) => !s.occupied) ?? null;
}
