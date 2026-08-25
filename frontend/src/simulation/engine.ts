import type { Employee, Ride } from "@/types/simulation";
import { classifyDelay } from "./classification";
import { findFreeSeat } from "./ride";

export interface TickResult {
  employees: Employee[];
  ride: Ride;
}

/**
 * Advances every employee's state machine (§11) and the ride's queue/
 * dispatch logic (§8, §9, §10) to `simTime`. Pure function: takes the
 * current snapshot and simulated clock time, returns the next snapshot.
 * The frontend (store + components) owns turning this into smooth
 * animation and rendering — this module only decides *what happened*.
 */
export function tick(employees: Employee[], ride: Ride, simTime: number): TickResult {
  const nextEmployees = employees.map((e) => ({ ...e }));
  const nextRide: Ride = {
    ...ride,
    seats: ride.seats.map((s) => ({ ...s })),
    queue: [...ride.queue],
    runningRiders: [...ride.runningRiders],
  };

  const byId = new Map(nextEmployees.map((e) => [e.id, e]));

  for (const emp of nextEmployees) {
    switch (emp.state) {
      case "ARRIVED":
        if (simTime >= emp.checkInTime) {
          transition(emp, "AT_GATE", simTime);
        }
        break;

      case "AT_GATE":
        if (simTime - emp.stateEnteredAt >= 1) {
          transition(emp, "TICKET_RECEIVED", simTime);
        }
        break;

      case "TICKET_RECEIVED":
        if (simTime - emp.stateEnteredAt >= 1) {
          transition(emp, "ENTERED_PARK", simTime);
        }
        break;

      case "ENTERED_PARK":
        if (simTime - emp.stateEnteredAt >= 1) {
          transition(emp, "VISITING_PARK", simTime);
        }
        break;

      case "VISITING_PARK":
        if (simTime - emp.stateEnteredAt >= emp.visitDwellMinutes) {
          transition(emp, "GOING_TO_DEPARTMENT", simTime);
        }
        break;

      case "GOING_TO_DEPARTMENT":
        if (simTime - emp.stateEnteredAt >= 2) {
          transition(emp, "WAITING_FOR_RIDE", simTime);
          emp.queueJoinedAt = simTime;
          nextRide.queue.push(emp.id);
          if (nextRide.queueFirstJoinedAt === null) {
            nextRide.queueFirstJoinedAt = simTime;
          }
          if (nextRide.status === "IDLE") {
            nextRide.status = "WAITING";
          }
        }
        break;

      case "WAITING_FOR_RIDE":
        // Advancement out of this state is entirely owned by ride dispatch
        // below — an employee never self-promotes out of the queue.
        break;

      case "SEAT_ASSIGNED":
        if (
          simTime - emp.stateEnteredAt >= 0.5 &&
          nextRide.status === "RUNNING" &&
          nextRide.runningRiders.includes(emp.id)
        ) {
          transition(emp, "RIDE_RUNNING", simTime);
        }
        break;

      case "RIDE_RUNNING":
        // Completion is applied to the whole boarded group at once, below.
        break;

      case "RIDE_COMPLETED":
        if (simTime - emp.stateEnteredAt >= 0.5) {
          const delayMinutes = simTime - emp.checkInTime;
          transition(emp, "WORK_STARTED", simTime);
          emp.workStartTime = simTime;
          emp.delayMinutes = delayMinutes;
          emp.finalColor = classifyDelay(delayMinutes);
        }
        break;

      case "WORK_STARTED":
        break;
    }
  }

  dispatchRide(nextRide, byId, simTime);
  completeRide(nextRide, byId, simTime);

  return { employees: nextEmployees, ride: nextRide };
}

function transition(emp: Employee, next: Employee["state"], simTime: number) {
  emp.state = next;
  emp.stateEnteredAt = simTime;
}

/** Rule 6/7 (§8, §10): dispatch once >=5 are waiting, or the wait timeout is hit. */
function dispatchRide(ride: Ride, byId: Map<string, Employee>, simTime: number) {
  if (ride.status !== "WAITING" || ride.queue.length === 0) return;

  const waited = ride.queueFirstJoinedAt !== null ? simTime - ride.queueFirstJoinedAt : 0;
  const shouldDispatch = ride.queue.length >= ride.minStartCount || waited >= ride.maxWaitMinutes;
  if (!shouldDispatch) return;

  const capacityLeft = ride.capacity - ride.runningRiders.length;
  const boarding = ride.queue.splice(0, Math.min(capacityLeft, ride.queue.length));

  for (const empId of boarding) {
    const emp = byId.get(empId);
    if (!emp) continue;

    const provisionalDelay = simTime - emp.checkInTime;
    const preferredColor = classifyDelay(provisionalDelay);
    const seat = findFreeSeat(ride, preferredColor);
    if (!seat) continue;

    seat.occupied = true;
    seat.employeeId = emp.id;
    emp.seatId = seat.id;
    emp.seatColor = seat.color;
    transition(emp, "SEAT_ASSIGNED", simTime);
    ride.runningRiders.push(emp.id);
  }

  ride.queueFirstJoinedAt = ride.queue.length > 0 ? simTime : null;
  ride.status = "RUNNING";
  ride.runStartedAt = simTime;
  ride.dispatchCount += 1;
}

function completeRide(ride: Ride, byId: Map<string, Employee>, simTime: number) {
  if (ride.status !== "RUNNING" || ride.runStartedAt === null) return;
  if (simTime - ride.runStartedAt < ride.runDurationMinutes) return;

  for (const empId of ride.runningRiders) {
    const emp = byId.get(empId);
    if (emp && (emp.state === "RIDE_RUNNING" || emp.state === "SEAT_ASSIGNED")) {
      transition(emp, "RIDE_COMPLETED", simTime);
    }
    const seat = ride.seats.find((s) => s.id === emp?.seatId);
    if (seat) {
      seat.occupied = false;
      seat.employeeId = null;
    }
    if (emp) emp.seatId = null;
  }

  ride.runningRiders = [];
  ride.runStartedAt = null;
  ride.status = ride.queue.length > 0 ? "WAITING" : "IDLE";
}
