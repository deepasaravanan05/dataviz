"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { formatSimTime } from "@/simulation/clock";

const IN_PARK_STATES = new Set(["ENTERED_PARK", "VISITING_PARK", "GOING_TO_DEPARTMENT"]);

export function Dashboard() {
  const employees = useSimulationStore((s) => s.employees);
  const simTime = useSimulationStore((s) => s.simTime);
  const ride = useSimulationStore((s) => s.ride);

  const total = employees.length;
  const workStarted = employees.filter((e) => e.state === "WORK_STARTED").length;
  const inPark = employees.filter((e) => IN_PARK_STATES.has(e.state)).length;
  const waiting = employees.filter((e) => e.state === "WAITING_FOR_RIDE").length;

  const delays = employees.map((e) => e.delayMinutes).filter((d): d is number => d !== null);
  const avgDelay = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

  const colorOf = (e: (typeof employees)[number]) => e.finalColor ?? e.seatColor;
  const green = employees.filter((e) => colorOf(e) === "GREEN").length;
  const yellow = employees.filter((e) => colorOf(e) === "YELLOW").length;
  const red = employees.filter((e) => colorOf(e) === "RED").length;

  return (
    <div className="pointer-events-none absolute left-4 top-4 w-72 rounded-xl bg-[#070b14]/84 p-4 text-sm text-white shadow-lg backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-lg font-semibold tabular-nums">{formatSimTime(simTime)}</span>
        <span className="text-xs text-white/60">Phase 1 &middot; Proof of Concept</span>
      </div>

      <Row label="Total Employees" value={total} />
      <Row label="Work Started" value={workStarted} />
      <Row label="In Park" value={inPark} />
      <Row label="Waiting" value={waiting} />
      <Row label="Average Delay" value={`${avgDelay.toFixed(0)} min`} />

      <div className="mt-3 flex gap-2">
        <Badge hex="#22c55e" label="Green" value={green} />
        <Badge hex="#eab308" label="Yellow" value={yellow} />
        <Badge hex="#ef4444" label="Red" value={red} />
      </div>

      <div className="mt-3 border-t border-cyan-300/12 pt-2 text-xs text-white/70">
        {ride.name}: {ride.status} &middot; {ride.queue.length} in queue &middot; run #
        {ride.dispatchCount}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-white/70">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Badge({ hex, label, value }: { hex: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
      <span>
        {label} {value}
      </span>
    </div>
  );
}
