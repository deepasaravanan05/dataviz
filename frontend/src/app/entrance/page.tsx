"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { JourneyHud } from "@/components/hud/JourneyHud";
import { TimelineControls } from "@/components/hud/TimelineControls";
import { PlaceNav } from "@/components/hud/PlaceNav";
import { EMPLOYEE_COUNT, GATE_X, GATE_Z } from "@/simulation/journey/constants";

/** Framed on the main entrance, where every employee checks in. */
const CAMERA_POSITION: [number, number, number] = [GATE_X + 46, 78, GATE_Z + 215];
const CAMERA_TARGET: [number, number, number] = [GATE_X, 22, GATE_Z - 40];

export default function EntrancePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#03050b]">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-16 rounded-xl bg-[#070b14]/82 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">MAIN ENTRANCE</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{EMPLOYEE_COUNT} EMPLOYEES</div>
        <div className="mt-1 max-w-[15rem] text-xs text-white/60">
          One gate for the whole workforce. Arrival time decides the colour; the colour travels
          with the employee all the way to their department ride.
        </div>
      </div>

      <JourneyHud />
      <TimelineControls />
      <PlaceNav />

      <div className="pointer-events-auto absolute right-4 top-16 flex flex-wrap justify-end gap-2">
        <Link
          href="/dashboard"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Dashboard
        </Link>
        <Link
          href="/roller-coaster"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Full park →
        </Link>
        <Link
          href="/"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          ← Theme Park
        </Link>
      </div>
    </main>
  );
}
