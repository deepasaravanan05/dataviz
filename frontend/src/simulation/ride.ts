import type { Ride, Seat, SeatColor } from "@/types/simulation";

const SEAT_COLORS: SeatColor[] = ["GREEN", "YELLOW", "RED"];
const SEATS_PER_COLOR = 20;

export function createRide(): Ride {
  const seats: Seat[] = [];
  for (const color of SEAT_COLORS) {
    for (let i = 0; i < SEATS_PER_COLOR; i++) {
      seats.push({
        id: `${color}-${i + 1}`,
        color,
        occupied: false,
        employeeId: null,
      });
    }
  }
  return {
    id: "RIDE-OPERATIONS-01",
    name: "Pirate Ship",
    department: "Operations",
    capacity: 60,
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
