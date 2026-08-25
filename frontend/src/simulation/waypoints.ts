import type { Employee } from "@/types/simulation";

export type Vec3 = [number, number, number];

export const SPAWN_POSITION: Vec3 = [-22, 0, 0];
export const GATE_POSITION: Vec3 = [-16, 0, 0];
export const PARK_POSITION: Vec3 = [-7, 0, 0];
export const QUEUE_BASE_POSITION: Vec3 = [3, 0, 4];
export const RIDE_POSITION: Vec3 = [11, 0, 0];
export const WORK_START_POSITION: Vec3 = [11, 0, -7];

const SEAT_ROW_Z: Record<string, number> = {
  GREEN: -5,
  YELLOW: -3,
  RED: -1,
};

/** Seats are laid out as three 20-wide rows (one per color) at the ride's base. */
export function seatPosition(seatId: string): Vec3 {
  const [color, indexStr] = seatId.split("-");
  const index = Number(indexStr) - 1;
  const x = RIDE_POSITION[0] + (index - 9.5) * 0.9;
  const z = RIDE_POSITION[2] + (SEAT_ROW_Z[color] ?? 0);
  return [x, 0, z];
}

function queuePosition(queueIndex: number): Vec3 {
  const col = queueIndex % 5;
  const row = Math.floor(queueIndex / 5);
  return [QUEUE_BASE_POSITION[0] + col * 0.9, 0, QUEUE_BASE_POSITION[2] + row * 0.9];
}

/** Maps an employee's current state to where it should be standing (§13). */
export function getTargetPosition(employee: Employee, queueIndex: number): Vec3 {
  switch (employee.state) {
    case "ARRIVED":
      return SPAWN_POSITION;
    case "AT_GATE":
    case "TICKET_RECEIVED":
      return GATE_POSITION;
    case "ENTERED_PARK":
    case "VISITING_PARK":
      return PARK_POSITION;
    case "GOING_TO_DEPARTMENT":
      return QUEUE_BASE_POSITION;
    case "WAITING_FOR_RIDE":
      return queuePosition(Math.max(queueIndex, 0));
    case "SEAT_ASSIGNED":
    case "RIDE_RUNNING":
      return employee.seatId ? seatPosition(employee.seatId) : RIDE_POSITION;
    case "RIDE_COMPLETED":
    case "WORK_STARTED":
      return WORK_START_POSITION;
    default:
      return SPAWN_POSITION;
  }
}
