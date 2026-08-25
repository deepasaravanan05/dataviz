import { create } from "zustand";
import type { Employee, Ride } from "@/types/simulation";
import { generateEmployees } from "@/simulation/employees";
import { createRide } from "@/simulation/ride";
import { tick } from "@/simulation/engine";
import { PARK_START_MINUTES } from "@/simulation/clock";

export const SIMULATION_SPEEDS = [1, 5, 10, 60] as const;

interface SimulationState {
  employees: Employee[];
  ride: Ride;
  /** Simulated minutes-of-day. */
  simTime: number;
  playing: boolean;
  /** Simulated minutes advanced per real second. */
  speed: number;
  /** Called every rendered frame with the real elapsed seconds. */
  advance: (realDeltaSeconds: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
}

function initialSnapshot() {
  return {
    employees: generateEmployees(10),
    ride: createRide(),
    simTime: PARK_START_MINUTES,
    playing: true,
    speed: 10,
  };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialSnapshot(),

  advance: (realDeltaSeconds) => {
    const { playing, speed, simTime, employees, ride } = get();
    if (!playing) return;

    const nextSimTime = simTime + realDeltaSeconds * speed;
    const { employees: nextEmployees, ride: nextRide } = tick(employees, ride, nextSimTime);
    set({ simTime: nextSimTime, employees: nextEmployees, ride: nextRide });
  },

  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ ...initialSnapshot() }),
}));
