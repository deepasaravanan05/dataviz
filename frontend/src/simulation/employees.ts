import type { Employee } from "@/types/simulation";
import { PARK_START_MINUTES } from "./clock";

const NAMES = [
  "Aditi Rao",
  "Ben Carter",
  "Chloe Kim",
  "Daniel Osei",
  "Elena Petrova",
  "Farid Khan",
  "Grace Liu",
  "Hassan Ali",
  "Isabel Cruz",
  "Jamal Brooks",
];

/**
 * Phase 1 proof-of-concept population: check-ins are staggered across the
 * opening window so the delay-classification rule (§5) produces a natural
 * mix of green/yellow/red employees without needing the four-gate system
 * from Phase 2.
 */
export function generateEmployees(count = 10): Employee[] {
  const employees: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const staggerMinutes = i * 4 + Math.random() * 3;
    const checkInTime = PARK_START_MINUTES + staggerMinutes;
    employees.push({
      id: `EMP${(i + 1).toString().padStart(3, "0")}`,
      name: NAMES[i % NAMES.length],
      department: "Operations",
      checkInTime,
      state: "ARRIVED",
      stateEnteredAt: PARK_START_MINUTES,
      visitDwellMinutes: 2 + Math.random() * 10,
      queueJoinedAt: null,
      seatId: null,
      seatColor: null,
      workStartTime: null,
      delayMinutes: null,
      finalColor: null,
    });
  }
  return employees;
}
