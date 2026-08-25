"use client";

import { SIMULATION_SPEEDS, useSimulationStore } from "@/store/simulationStore";

export function ClockControls() {
  const playing = useSimulationStore((s) => s.playing);
  const speed = useSimulationStore((s) => s.speed);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const reset = useSimulationStore((s) => s.reset);

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#070b14]/84 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
      <button
        onClick={togglePlay}
        className="rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white/20"
      >
        {playing ? "Pause" : "Play"}
      </button>

      <div className="mx-1 h-5 w-px bg-white/20" />

      {SIMULATION_SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={`rounded-full px-3 py-1.5 transition ${
            speed === s ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {s}x
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-white/20" />

      <button
        onClick={reset}
        className="rounded-full bg-red-500/80 px-3 py-1.5 transition hover:bg-red-500"
      >
        Reset
      </button>
    </div>
  );
}
