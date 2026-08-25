"use client";

import { useState } from "react";
import { LOOP_END, LOOP_START } from "@/simulation/journey/journey";
import { SPEED_OPTIONS } from "@/simulation/journey/clock";
import { formatSimTime } from "@/simulation/clock";
import { useJourneyStore } from "@/store/journeyStore";

/**
 * Play, pause, scrub and speed for the simulated morning.
 *
 * Ordinary DOM, like the other panels. Scrubbing is a straight seek on the
 * clock: because every figure's position is a pure function of the simulated
 * time, jumping to 9:47 puts all fifty-six people exactly where they were at
 * 9:47, with nothing to replay or rewind.
 *
 * A native range input carries the scrubber, so arrow keys, Home and End work
 * without any extra handling.
 */
export function TimelineControls() {
  const simTime = useJourneyStore((s) => s.simTime);
  const paused = useJourneyStore((s) => s.paused);
  const speed = useJourneyStore((s) => s.speed);
  const setPaused = useJourneyStore((s) => s.setPaused);
  const setSpeed = useJourneyStore((s) => s.setSpeed);
  const seek = useJourneyStore((s) => s.seek);
  const reset = useJourneyStore((s) => s.reset);

  /*
   * While the thumb is held, show what the user is dragging rather than what
   * the clock last published — otherwise playback keeps nudging the thumb out
   * from under the pointer.
   */
  const [dragValue, setDragValue] = useState<number | null>(null);
  const value = dragValue ?? simTime;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <div className="pointer-events-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-cyan-300/10 bg-[#070b14]/84 px-4 py-3 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play the simulation" : "Pause the simulation"}
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
            </svg>
          </button>

          <button
            type="button"
            onClick={reset}
            aria-label="Reset the simulation to the start of the morning"
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 11-1.7-3.96" strokeLinecap="round" />
              <path d="M13.6 1.9v2.9h-2.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="min-w-[5.5rem] text-lg font-bold tabular-nums leading-none">
            {formatSimTime(value)}
          </div>

          <div className="ml-auto flex gap-1" role="group" aria-label="Playback speed">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                aria-pressed={speed === option}
                className={[
                  "rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  speed === option
                    ? "bg-sky-400/90 text-slate-950"
                    : "bg-white/10 text-white/70 hover:bg-white/20",
                ].join(" ")}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={LOOP_START}
          max={LOOP_END}
          step={0.25}
          value={value}
          aria-label="Simulated time"
          aria-valuetext={formatSimTime(value)}
          onChange={(e) => {
            const next = Number(e.target.value);
            setDragValue(next);
            seek(next);
          }}
          onPointerUp={() => setDragValue(null)}
          onBlur={() => setDragValue(null)}
          className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        />

        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/40">
          <span>{formatSimTime(LOOP_START)}</span>
          <span className="text-white/30">
            {paused ? "Paused — drag to inspect any moment" : "Check-in → work start"}
          </span>
          <span>{formatSimTime(LOOP_END)}</span>
        </div>
      </div>
    </div>
  );
}
