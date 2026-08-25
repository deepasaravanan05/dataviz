export type SeatColor = "GREEN" | "YELLOW" | "RED";

export type EmployeeState =
  | "ARRIVED"
  | "AT_GATE"
  | "TICKET_RECEIVED"
  | "ENTERED_PARK"
  | "VISITING_PARK"
  | "GOING_TO_DEPARTMENT"
  | "WAITING_FOR_RIDE"
  | "SEAT_ASSIGNED"
  | "RIDE_RUNNING"
  | "RIDE_COMPLETED"
  | "WORK_STARTED";

export interface Employee {
  id: string;
  name: string;
  department: string;
  /** Simulated minutes-of-day, e.g. 545 = 09:05 AM. */
  checkInTime: number;
  state: EmployeeState;
  /** simTime at which the employee entered its current state. */
  stateEnteredAt: number;
  /** Randomized park-visit dwell time, fixed at spawn (minutes). */
  visitDwellMinutes: number;
  queueJoinedAt: number | null;
  seatId: string | null;
  /** Provisional color assigned at boarding time (§5, §31). */
  seatColor: SeatColor | null;
  workStartTime: number | null;
  delayMinutes: number | null;
  /** Final color recalculated from actual delay once work starts (§5). */
  finalColor: SeatColor | null;
}

export interface Seat {
  id: string;
  color: SeatColor;
  occupied: boolean;
  employeeId: string | null;
}

export type RideStatus = "IDLE" | "WAITING" | "RUNNING";

export interface Ride {
  id: string;
  name: string;
  department: string;
  capacity: number;
  minStartCount: number;
  maxWaitMinutes: number;
  runDurationMinutes: number;
  seats: Seat[];
  /** FIFO queue of employee ids waiting for a seat. */
  queue: string[];
  queueFirstJoinedAt: number | null;
  status: RideStatus;
  runningRiders: string[];
  runStartedAt: number | null;
  dispatchCount: number;
}
